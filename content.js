console.log("Script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_PAGE_TEXT") {
    const bodyText = document.body.innerText || "";
    sendResponse({ text: bodyText });
  }
});

// === Inject Floating Buttons ===
const alreadyInjected = document.getElementById("study-rat-button");
if (!alreadyInjected) {
  const container = document.createElement("div");
  container.id = "study-rat-button";
  container.style.position = "fixed";
  container.style.top = "10px";
  container.style.right = "10px";
  container.style.zIndex = "9999";
  container.style.background = "#fff";
  container.style.border = "1px solid #ccc";
  container.style.borderRadius = "6px";
  container.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  container.style.padding = "8px";
  container.style.fontFamily = "sans-serif";
  container.style.color = "black";


  const info = document.createElement("div");
  info.innerText = "Study Rat:";
  info.style.marginBottom = "6px";
  container.appendChild(info);

  const prodBtn = document.createElement("button");
  prodBtn.innerText = "✅ Productive";
  prodBtn.style.marginRight = "6px";

  const unprodBtn = document.createElement("button");
  unprodBtn.innerText = "❌ Unproductive";

  container.appendChild(prodBtn);
  container.appendChild(unprodBtn);
  document.body.appendChild(container);

  const labelPage = (label) => {
    const text = document.body.innerText || "";
    const url = window.location.href;

    // TODO: Replace this with Supabase insert
    console.log("Labeled:", label === 1 ? "Productive" : "Unproductive");
    console.log("Text:", text.slice(0, 100)); // preview
    console.log("URL:", url);

    // Disable buttons & remove after short delay
    prodBtn.disabled = true;
    unprodBtn.disabled = true;
    container.innerText = "✅ Labeled!";
    setTimeout(() => container.remove(), 1500);
  };

  prodBtn.onclick = () => labelPage(1);
  unprodBtn.onclick = () => labelPage(0);
}
