console.log("Script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_PAGE_TEXT") {
    const bodyText = document.body.innerText || "";
    sendResponse({ text: bodyText });
  }
});
