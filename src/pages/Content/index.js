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
    if (src.endsWith(".gif") || src.includes("gif")) {
      gif_count += 1;
    }
  }

  const image_count = Number(allImgs.length);
  const video_count = Number(allVideos.length);
  gif_count = Number(gif_count);

  // --- Media Density ---
  const total_media = image_count + video_count;
  const words = (bodyText.trim().split(/\s+/).filter(w => w).length);
  const media_density_ratio = words > 0 ? parseFloat((total_media / words).toFixed(4)) : 0.0;

  if (bodyText.trim().length > 100) {

    // --- NEW: Truncate by Byte Length ---
    const BYTE_LIMIT = 2700; // A safe limit, just under the 2704 max
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Convert the entire text to a byte array
    const encodedText = encoder.encode(bodyText.trim());

    let truncatedText;

    if (encodedText.byteLength > BYTE_LIMIT) {
      // Slice the byte array to the limit
      const truncatedBytes = encodedText.slice(0, BYTE_LIMIT);
      // Decode it back to a string. The decoder handles incomplete multi-byte characters gracefully.
      truncatedText = decoder.decode(truncatedBytes);
    } else {
      // The text is already within the limit
      truncatedText = bodyText.trim();
    }
    // --- End of New Logic ---

    const payload = {
      text: truncatedText, // Use the new byte-truncated text
      image_count: image_count,
      video_count: video_count,
      gif_count: gif_count,
      media_density_ratio: media_density_ratio
    };

    console.log("Sending payload to /predict:", payload);
    console.log("Payload text byte length:", encoder.encode(payload.text).byteLength); // For debugging

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