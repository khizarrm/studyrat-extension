
export function analyzePageText({ text, image_count, video_count, gif_count, media_density_ratio }) {
  console.log("Analyzng the text")
  fetch("http://127.0.0.1:5000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      text,
      image_count,
      video_count,
      gif_count,
      media_density_ratio
    })
  })
  .then(response => console.log("Res: ", response))
  .then(data => handleProductivityResult(data.productive))
  .catch(err => console.error("Analysis failed:", err));
}
