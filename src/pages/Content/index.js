import {showBlockOverlay } from "./components/blockOverlay"
import { showPredictionOverlay } from "./components/predictionOverlay";
import { predict } from "../../apis/apiClient";

const learningmode = true;

let contentObserver = null;
let settleTimer = null;


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

function waitForPageToSettleAndAnalyze() {
  // Clear any previous observer or timer to prevent overlaps from fast navigations.
  if (contentObserver) {
    contentObserver.disconnect();
  }
  clearTimeout(settleTimer);

  const DEBOUNCE_DELAY_MS = 750;

  // This is the key change. We set a "default" timer that will run
  // if the page is static and doesn't change.
  settleTimer = setTimeout(() => {
    console.log("Timer finished, page is assumed stable.");
    // When the timer runs, we disconnect the observer so it doesn't fire later.
    if (contentObserver) {
      contentObserver.disconnect();
      contentObserver = null;
    }
    analyzeContent();
  }, DEBOUNCE_DELAY_MS);


  // Now, we set up the observer.
  contentObserver = new MutationObserver(() => {
    // If the DOM *does* change, it means the page is dynamic.
    // We clear the previous timer...
    clearTimeout(settleTimer);
    
    // ...and set a new one. This pushes the analysis further into the future.
    settleTimer = setTimeout(() => {
      console.log("Debounced timer finished after DOM changes.");
      if (contentObserver) {
        contentObserver.disconnect();
        contentObserver = null;
      }
      analyzeContent();
    }, DEBOUNCE_DELAY_MS);
  });

  // Start observing the page.
  contentObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

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

async function runThatBitch() {
  const result = await chrome.storage.local.get(['sageAiActivated']);
  console.log("Just got the result: ", result);
  if (!result.sageAiActivated) return;

  console.log("Calling content waiter/analyzer...");
  
  // This handles both the initial load AND SPA navigations correctly.
  waitForPageToSettleAndAnalyze();
}

runThatBitch();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'URL_CHANGED') {
    console.log("URL has changed, re-running checks.");
    runThatBitch();
  }
  return true;
});