import {showBlockOverlay } from "./components/blockOverlay"
import { showPredictionOverlay } from "./components/predictionOverlay";
import { predict } from "../../apis/apiClient";

const learningmode = true;

let contentObserver = null;
let settleTimer = null;
let isAnalysisRunning = false;


async function analyzeContent() {
  console.log("Starting to analyze content...");
  try {
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

  const image_count = getMeaningfulImageCount()
  const video_count = Number(allVideos.length);
  gif_count = Number(gif_count);

  // --- Media Density ---
  const total_media = image_count + video_count;
  const words = (bodyText.trim().split(/\s+/).filter(w => w).length);
  const media_density_ratio = words > 0 ? parseFloat((total_media / words).toFixed(4)) : 0.0;

  if (bodyText.trim().length > 100) {

    // --- NEW: Truncate by Byte Length ---
    const BYTE_LIMIT = 2400; // A safe limit, just under the 2704 max
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
      url: window.location.href, 
      text: truncatedText,
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
  } finally {
    console.log("Analysis process finished. Resetting state flag.");
    isAnalysisRunning = false;
  }
}


function getMeaningfulImageCount() {
  const allImgs = document.getElementsByTagName("img");
  let meaningfulImageCount = 0;
  const MIN_DIMENSION = 50; // An image must be at least 50x50 pixels to count

  for (const img of allImgs) {
    // Check 1: Is the image actually visible in the layout?
    // (offsetParent is null for hidden elements)
    const isVisible = !!img.offsetParent;

    // Check 2: Is the image's actual size larger than our minimum?
    // (naturalWidth is the true width of the image file)
    const isLargeEnough = img.naturalWidth > MIN_DIMENSION && img.naturalHeight > MIN_DIMENSION;

    if (isVisible && isLargeEnough) {
      meaningfulImageCount++;
    }
  }
  return meaningfulImageCount;
}

function waitForPageToSettleAndAnalyze() {
  if (contentObserver) contentObserver.disconnect();
  clearTimeout(settleTimer);

  const DEBOUNCE_DELAY_MS = 750;

  settleTimer = setTimeout(() => {
    if (contentObserver) contentObserver.disconnect();
    analyzeContent();
  }, DEBOUNCE_DELAY_MS);

  contentObserver = new MutationObserver(() => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (contentObserver) contentObserver.disconnect();
      analyzeContent();
    }, DEBOUNCE_DELAY_MS);
  });

  contentObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function handleProductivityResult(isProductive) {
  // Before showing a new overlay, let's make sure the old one is gone.
  const existingOverlay = document.getElementById('prediction-overlay-container');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  if (learningmode) {
    showPredictionOverlay(isProductive);
  } else {
    if (!isProductive) {
      showBlockOverlay();
    }
  }
}

async function runThatBitch() {
  // NEW: Check if an analysis is already running. If so, stop immediately.
  if (isAnalysisRunning) {
    console.log("Analysis already in progress. Skipping new trigger.");
    return;
  }
  // NEW: Set the flag to true to block any other triggers.
  isAnalysisRunning = true;
  console.log("State flag set to true. Starting analysis process...");
  
  const result = await chrome.storage.local.get(['sageAiActivated']);
  if (!result.sageAiActivated) {
    // Important: Reset the flag if we exit early.
    isAnalysisRunning = false; 
    return;
  }
  
  console.log("Calling content waiter/analyzer...");
  waitForPageToSettleAndAnalyze();
}

// --- LISTENERS (Unchanged) ---
runThatBitch();
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'URL_CHANGED') {
    console.log("URL has changed, re-running checks.");
    runThatBitch();
  }
  return true;
});