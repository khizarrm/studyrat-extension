import {showBlockOverlay } from "./components/blockOverlay"
import { showPredictionOverlay } from "./components/predictionOverlay";
import { predict } from "../../apis/apiClient";

const learningmode = true;

async function analyzeContent() {
  console.log("Starting to analyze content...");
  const bodyText = document.body.innerText || "";

  // --- Media Counts ---
  const allImgs = document.getElementsByTagName("img");
  const allVideos = document.getElementsByTagName("video");

  let gif_count = 0;
  for (let img of allImgs) {
    const src = (img.src || "").toLowerCase();
    if (src.endsWith(".gif") || src.includes("gif")) { // More robust check
      gif_count += 1;
    }
  }

  // Explicitly ensure all counts are numbers
  const image_count = Number(allImgs.length);
  const video_count = Number(allVideos.length);
  gif_count = Number(gif_count); // Ensure gif_count is also a number

  // --- Media Density ---
  const total_media = image_count + video_count; // GIF count is part of image_count
  const words = (bodyText.trim().split(/\s+/).filter(w => w).length);
  
  // Ensure density is a valid float, guarding against division by zero
  const media_density_ratio = words > 0 ? parseFloat((total_media / words).toFixed(4)) : 0.0;

  if (bodyText.trim().length > 100) {
    const wordLimit = 300;
    const wordsArray = bodyText.trim().split(/\s+/).filter(w => w);
    const truncatedText = wordsArray.slice(0, wordLimit).join(' ');

    const payload = {
      text: truncatedText,
      image_count: image_count,
      video_count: video_count,
      gif_count: gif_count,
      media_density_ratio: media_density_ratio
    };

    // CRITICAL: Log the payload to debug what's being sent
    console.log("Sending payload to /predict:", payload);

    const data = await predict(payload);

    if (data && data.productive !== undefined) {
      console.log("Predicted: ", data.productive);
      handleProductivityResult(data.productive);
    } else {
      console.error("Prediction failed or returned invalid data:", data);
    }
  }
}


function handleProductivityResult(isProductive) {
  if (learningmode){
    showPredictionOverlay(isProductive)
  } else {
    if (!isProductive){
    showBlockOverlay()
    }
  }
}

async function runThatBitch(){
  const result = await chrome.storage.local.get(['sageAiActivated']);
  console.log("Just got the result: ", result)
  if (!result.sageAiActivated) return;

  console.log("Calling auto analyze..")
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', analyzeContent);
  } else {
    analyzeContent();
  }
}

runThatBitch()