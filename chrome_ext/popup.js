document.querySelectorAll(".preset").forEach((preset) => {
  preset.addEventListener("click", async () => {
    const text = preset.dataset.prompt;

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(tab.id, {
      action: "insert_prompt",
      text,
    });
  });
});
