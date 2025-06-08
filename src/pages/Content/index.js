import {showBlockOverlay } from "./components/blockOverlay"
import { showPredictionOverlay } from "./components/predictionOverlay";
import { predict } from "../../apis/apiClient";

const learningmode = false;

async function analyzeContent() {

  console.log("Starting to analyze content...")
  const bodyText = document.body.innerText || "";

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
      
  if (bodyText.trim().length > 100) {
    const wordLimit = 300;
    const wordsArray = bodyText.trim().split(/\s+/).filter(w => w);
    const limitedWords = wordsArray.slice(0, wordLimit);
    const truncatedText = limitedWords.join(' ');
    
    const payload = {
      text: truncatedText,
      image_count,
      video_count,
      gif_count,
      media_density_ratio
    };

    console.log("Predicting")
    const data = await predict(payload);
    console.log("Predicted: ", data.productive)

    if (data) {
      
      handleProductivityResult(data.productive);
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