// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const contentEl = document.getElementById("content");
  const statusEl = document.getElementById("status");
  const prodBtn = document.getElementById("productiveBtn");
  const unprodBtn = document.getElementById("unproductiveBtn");

  // Request content from the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: "GET_PAGE_TEXT" }, (response) => {
      if (response?.text) {
        contentEl.textContent = response.text.slice(0, 1000); // truncate for display
        contentEl.dataset.fullText = response.text; // save full text for labeling
      } else {
        contentEl.textContent = "Unable to retrieve content.";
      }
    });
  });

  const handleLabel = (label) => {
    const fullText = contentEl.dataset.fullText;
    if (!fullText) return;

    const item = {
      text: fullText,
      label: label,
      timestamp: Date.now()
    };

    chrome.storage.local.get(["labeledData"], (result) => {
      const currentData = result.labeledData || [];
      currentData.push(item);
      chrome.storage.local.set({ labeledData: currentData }, () => {
        statusEl.textContent = `Saved as ${label === 1 ? "Productive" : "Unproductive"}`;
      });
    });
  };

  prodBtn.addEventListener("click", () => handleLabel(1));
  unprodBtn.addEventListener("click", () => handleLabel(0));
});
