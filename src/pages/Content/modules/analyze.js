
export function autoAnalyzePage() {
  console.log("Auto-analysis triggered, readyState:", document.readyState);
  // Wait a bit for page to fully load
  setTimeout(() => {
    const bodyText = document.body.innerText || "";
    console.log("Page text length:", bodyText.trim().length);

    const allImgs = document.getElementsByTagName("img"); 
    const image_count = allImgs.length;

    const allVideos = document.getElementsByTagName("video");
    const video_count = allVideos.length;

    let gif_count = 0;
    for (let img of allImgs) {
      const src = (img.src || "").toLowerCase();
      if (src.endsWith(".gif") || src.includes(".gif")) {
        gif_count += 1;
      }
    }

    const total_media = image_count + video_count + gif_count;
    const words = (document.body.innerText || "").trim().split(/\s+/).filter(w => w).length;
    const media_density_ratio = words > 0 ? total_media / words : 0;
        
    if (bodyText.trim().length > 100) { // Only analyze if there's substantial content
      console.log("Starting auto-analysis...");
      
      // Limit text to 2000 characters to prevent database index errors
      const truncatedText = bodyText.trim().substring(0, 2000);
      console.log("Truncated text length:", truncatedText.length);
      
      const payload = {
        text: truncatedText,
        image_count,
        video_count,
        gif_count,
        media_density_ratio
      };

      return payload
    } else {
      console.log("Page content too short, skipping auto-analysis");
    }
  }, 2000); // Wait 2 seconds for page to load
}

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
