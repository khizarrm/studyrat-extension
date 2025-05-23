function checkProductivity(text) {
  fetch("http://127.0.0.1:5000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  })
  .then(res => res.json())
  .then(data => {
    const status = document.getElementById("status");
    if (data.productive === true) {
      status.textContent = "✅ This page is productive!";
      status.style.color = "green";
    } else if (data.productive === false) {
      status.textContent = "⚠️ This page is unproductive.";
      status.style.color = "red";
    } else {
      status.textContent = "❓ Couldn't determine productivity.";
      status.style.color = "gray";
    }
  })
  .catch(err => {
    document.getElementById("status").textContent = "Error connecting to ML model.";
    console.error("Fetch error:", err);
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.tabs.sendMessage(tabs[0].id, { type: "GET_PAGE_TEXT" }, function (response) {
    const contentDiv = document.getElementById("content");
    const pageText = response?.text || "No text found.";
    contentDiv.textContent = pageText;

    checkProductivity(pageText); // 🔗 Call the Flask model
  });
});
