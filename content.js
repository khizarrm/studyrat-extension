console.log("Script loaded");

let currentPageText = ""; // Store page text for feedback
let learningMode = true; // Default to learning mode ON

// LOAD LEARNING MODE STATE ON STARTUP
chrome.storage.local.get(['learningMode'], (result) => {
  learningMode = result.learningMode !== undefined ? result.learningMode : true;
  console.log("Learning mode loaded on startup:", learningMode);
});

// Listen for learning mode updates from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "LEARNING_MODE_UPDATE") {
    learningMode = request.learningMode;
    console.log("Learning mode updated to:", learningMode);
    
    // If learning mode was turned OFF and we have an overlay, 
    // check if we need to switch to block mode
    if (!learningMode && document.getElementById('studyrat-overlay')) {
      // Remove existing overlay and re-analyze for potential blocking
      removeStudyRatOverlay();
      // Re-trigger analysis to potentially show block overlay
      setTimeout(() => {
        if (currentPageText) {
          // Re-analyze the current page with new mode
          analyzePageText(currentPageText);
        }
      }, 500);
    }
  }
});

function handleProductivityResult(isProductive) {
  // Remove existing overlay if present
  removeStudyRatOverlay();
  
  console.log("Handling productivity result:", isProductive, "Learning mode:", learningMode);
  
  if (learningMode) {
    // Learning mode: Show feedback overlay for ALL pages
    showPredictionOverlay(isProductive);
  } else {
    // Lock mode: Only block unproductive pages
    if (!isProductive) {
      console.log("Showing block overlay for unproductive content");
      showBlockOverlay();
    }
    // If productive, do nothing (leave page as is)
  }
}

// SEPARATE ANALYSIS FUNCTION
function analyzePageText({ text, image_count, video_count, gif_count, media_density_ratio }) {
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
  .then(res => res.json())
  .then(data => handleProductivityResult(data.productive))
  .catch(err => console.error("Analysis failed:", err));
}


// AUTO-ANALYSIS FUNCTION
function autoAnalyzePage() {
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
      const payload = {
        text: bodyText,
        image_count,
        video_count,
        gif_count,
        media_density_ratio
      };
      analyzePageText(payload);
    } else {
      console.log("Page content too short, skipping auto-analysis");
    }
  }, 2000); // Wait 2 seconds for page to load
}

// FORCE AUTO-ANALYSIS TO RUN
console.log("Setting up auto-analysis...");
setTimeout(() => {
  console.log("Running forced auto-analysis");
  autoAnalyzePage();
}, 3000); // Run after 3 seconds no matter what

// BLOCK OVERLAY (for non-learning mode) - UNBYPASSABLE
function showBlockOverlay() {
  console.log("Creating unbypassable block overlay");
  
  // Create full-screen overlay
  const overlay = document.createElement('div');
  overlay.id = 'studyrat-overlay';
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: linear-gradient(135deg, #F8FAFC 0%, #EDE9FE 100%) !important;
    z-index: 2147483647 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    pointer-events: all !important;
  `;

  // Main message container
  const messageContainer = document.createElement('div');
  messageContainer.style.cssText = `
    text-align: center;
    max-width: 600px;
    padding: 50px;
    background: white;
    border-radius: 24px;
    box-shadow: 0 25px 50px rgba(139, 92, 246, 0.15);
    border: 3px solid #8B5CF6;
  `;

  // Sage AI Header
  const sageHeader = document.createElement('div');
  sageHeader.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
    padding: 16px 24px;
    background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
    border-radius: 16px;
    color: white;
  `;

  const sageIcon = document.createElement('div');
  sageIcon.style.cssText = `
    font-size: 32px;
    animation: pulse 2s infinite;
  `;
  sageIcon.textContent = '🧠';

  const sageText = document.createElement('div');
  sageText.style.cssText = `
    font-size: 24px;
    font-weight: bold;
    letter-spacing: 1px;
  `;
  sageText.textContent = 'SAGE AI';

  sageHeader.appendChild(sageIcon);
  sageHeader.appendChild(sageText);

  // Lock icon
  const lockIcon = document.createElement('div');
  lockIcon.style.cssText = `
    font-size: 80px;
    margin: 20px 0;
    color: #8B5CF6;
    animation: pulse 2s infinite;
  `;
  lockIcon.textContent = '🔒';

  // Main message
  const mainMessage = document.createElement('div');
  mainMessage.style.cssText = `
    font-size: 42px;
    font-weight: bold;
    margin-bottom: 16px;
    color: #8B5CF6;
    text-shadow: 0 2px 4px rgba(139, 92, 246, 0.1);
  `;
  mainMessage.textContent = 'Lock in bro...';

  // Subtitle
  const subtitle = document.createElement('div');
  subtitle.style.cssText = `
    font-size: 20px;
    margin-bottom: 32px;
    color: #6B7280;
    line-height: 1.5;
  `;
  subtitle.textContent = 'Sage detected unproductive content.\nTime to focus on what truly matters.';

  // Study Rat branding
  const branding = document.createElement('div');
  branding.style.cssText = `
    font-size: 16px;
    color: #8B5CF6;
    font-weight: 600;
    margin-bottom: 32px;
    padding: 12px 20px;
    background: #F3F4F6;
    border-radius: 12px;
    border: 2px solid #E5E7EB;
  `;
  branding.textContent = '🐭 Study Rat • Powered by Sage AI';

  // Motivational message
  const motivationalMessage = document.createElement('div');
  motivationalMessage.style.cssText = `
    font-size: 16px;
    color: #374151;
    margin-bottom: 24px;
    padding: 20px;
    background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
    border-radius: 12px;
    border-left: 4px solid #8B5CF6;
    font-style: italic;
  `;
  motivationalMessage.textContent = '"Focus is the ultimate productivity hack. Every distraction you avoid is a step closer to your goals."';

  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }
  `;
  document.head.appendChild(style);

  // Assemble the UI
  messageContainer.appendChild(sageHeader);
  messageContainer.appendChild(lockIcon);
  messageContainer.appendChild(mainMessage);
  messageContainer.appendChild(subtitle);
  messageContainer.appendChild(branding);
  messageContainer.appendChild(motivationalMessage);
  
  overlay.appendChild(messageContainer);
  document.body.appendChild(overlay);

  // Make it truly unbypassable
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  
  // Prevent any interaction with the page behind
  overlay.addEventListener('contextmenu', (e) => e.preventDefault());
  overlay.addEventListener('selectstart', (e) => e.preventDefault());
  overlay.addEventListener('dragstart', (e) => e.preventDefault());
  
  // Block keyboard shortcuts
  document.addEventListener('keydown', blockKeyboardShortcuts, true);
  
  // Continuously ensure overlay stays on top
  const ensureOverlay = setInterval(() => {
    const currentOverlay = document.getElementById('studyrat-overlay');
    if (currentOverlay) {
      currentOverlay.style.zIndex = '2147483647';
      currentOverlay.style.display = 'flex';
    } else {
      clearInterval(ensureOverlay);
    }
  }, 1000);
}

// Block common keyboard shortcuts that might bypass the overlay
function blockKeyboardShortcuts(e) {
  // Block F12, Ctrl+Shift+I, Ctrl+U, etc.
  if (e.key === 'F12' || 
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.key === 'u') ||
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      (e.ctrlKey && e.key === 'r') ||
      (e.key === 'F5')) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

// LEARNING MODE OVERLAY (updated with Sage branding)
function showPredictionOverlay(isProductive) {
  console.log("Creating prediction overlay");
  
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'studyrat-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 380px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(139, 92, 246, 0.15);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 3px solid ${isProductive ? '#10B981' : '#F59E0B'};
  `;

  // Header section with Sage branding
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
    padding: 20px;
    border-radius: 13px 13px 0 0;
    color: white;
    text-align: center;
  `;

  // Sage AI Header
  const sageHeader = document.createElement('div');
  sageHeader.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 8px;
  `;

  const sageIcon = document.createElement('div');
  sageIcon.style.cssText = `
    font-size: 24px;
  `;
  sageIcon.textContent = '🧠';

  const sageText = document.createElement('div');
  sageText.style.cssText = `
    font-size: 20px;
    font-weight: bold;
    letter-spacing: 1px;
  `;

  sageText.textContent = 'SAGE AI';
  sageHeader.appendChild(sageIcon);
  sageHeader.appendChild(sageText);

  const subtitle = document.createElement('div');
  subtitle.style.cssText = `
    font-size: 13px;
    opacity: 0.9;
    font-weight: 500;
  `;
  subtitle.textContent = 'Learning Mode • Study Rat';

  // Content section
  const content = document.createElement('div');
  content.style.cssText = `
    padding: 24px;
  `;

  // Prediction result
  const predictionResult = document.createElement('div');
  predictionResult.style.cssText = `
    text-align: center;
    margin-bottom: 24px;
    padding: 20px;
    border-radius: 12px;
    background: ${isProductive ? '#F0FDF4' : '#FEF3C7'};
    border: 2px solid ${isProductive ? '#BBF7D0' : '#FDE68A'};
  `;

  const predictionIcon = document.createElement('div');
  predictionIcon.style.cssText = `
    font-size: 36px;
    margin-bottom: 12px;
  `;
  predictionIcon.textContent = isProductive ? '✅' : '⚠️';

  const predictionText = document.createElement('div');
  predictionText.style.cssText = `
    font-size: 18px;
    font-weight: 700;
    color: ${isProductive ? '#166534' : '#92400E'};
    margin-bottom: 6px;
  `;
  predictionText.textContent = isProductive ? 'Productive Content' : 'Unproductive Content';

  const confidenceText = document.createElement('div');
  confidenceText.style.cssText = `
    font-size: 13px;
    color: #6B7280;
    font-weight: 500;
  `;
  confidenceText.textContent = 'Sage AI Analysis';

  predictionResult.appendChild(predictionIcon);
  predictionResult.appendChild(predictionText);
  predictionResult.appendChild(confidenceText);

  // Feedback question
  const feedbackQuestion = document.createElement('div');
  feedbackQuestion.style.cssText = `
    font-size: 15px;
    color: #374151;
    margin-bottom: 16px;
    font-weight: 600;
    text-align: center;
  `;
  feedbackQuestion.textContent = 'Help Sage learn - is this correct?';

  // Feedback buttons container
  const feedbackContainer = document.createElement('div');
  feedbackContainer.style.cssText = `
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 20px;
  `;

  // Correct prediction button
  const correctBtn = document.createElement('button');
  correctBtn.style.cssText = `
    background: #F0FDF4;
    color: #166534;
    border: 2px solid #BBF7D0;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
  `;
  correctBtn.textContent = '✅ Correct';
  correctBtn.onmouseover = () => {
    correctBtn.style.background = '#DCFCE7';
    correctBtn.style.transform = 'translateY(-2px)';
  };
  correctBtn.onmouseout = () => {
    correctBtn.style.background = '#F0FDF4';
    correctBtn.style.transform = 'translateY(0)';
  };
  correctBtn.onclick = () => {
    sendFeedback(true, isProductive); // Correct prediction
  };

  // Incorrect prediction button
  const incorrectBtn = document.createElement('button');
  incorrectBtn.style.cssText = `
    background: #FEF2F2;
    color: #991B1B;
    border: 2px solid #FECACA;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
  `;
  incorrectBtn.textContent = '❌ Wrong';
  incorrectBtn.onmouseover = () => {
    incorrectBtn.style.background = '#FEE2E2';
    incorrectBtn.style.transform = 'translateY(-2px)';
  };
  incorrectBtn.onmouseout = () => {
    incorrectBtn.style.background = '#FEF2F2';
    incorrectBtn.style.transform = 'translateY(0)';
  };
  incorrectBtn.onclick = () => {
    sendFeedback(false, isProductive); // Incorrect prediction
  };

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.style.cssText = `
    background: #F8FAFC;
    color: #6B7280;
    border: 2px solid #E2E8F0;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    font-weight: 500;
  `;
  closeBtn.textContent = 'Skip for now';
  closeBtn.onmouseover = () => {
    closeBtn.style.background = '#F1F5F9';
    closeBtn.style.borderColor = '#CBD5E1';
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.background = '#F8FAFC';
    closeBtn.style.borderColor = '#E2E8F0';
  };
  closeBtn.onclick = () => {
    removeStudyRatOverlay();
  };

  // Feedback section
  const feedbackSection = document.createElement('div');
  feedbackSection.id = 'feedback-section';
  
  feedbackContainer.appendChild(correctBtn);
  feedbackContainer.appendChild(incorrectBtn);
  feedbackSection.appendChild(feedbackQuestion);
  feedbackSection.appendChild(feedbackContainer);
  feedbackSection.appendChild(closeBtn);

  // Assemble the UI
  header.appendChild(sageHeader);
  header.appendChild(subtitle);
  content.appendChild(predictionResult);
  content.appendChild(feedbackSection);
  overlay.appendChild(header);
  overlay.appendChild(content);
  
  document.body.appendChild(overlay);
}

function sendFeedback(isCorrectClassification, originalPrediction) {
  const bodyText = document.body.innerText || ""; // or re-grab innerText if needed
  const allImgs = document.getElementsByTagName("img");
  const image_count = allImgs.length;
  const allVideos = document.getElementsByTagName("video");
  const video_count = allVideos.length;
  let gif_count = 0;
  for (let img of allImgs) {
    const src = (img.src || "").toLowerCase();
    if (src.endsWith(".gif") || src.includes(".gif")) {
      gif_count++;
    }
  }
  const total_media = image_count + video_count + gif_count;
  const words = bodyText.trim().split(/\s+/).filter(w => w).length;
  const media_density_ratio = words > 0 ? total_media / words : 0;

  chrome.runtime.sendMessage({
    type: "FEEDBACK",
    text: bodyText,
    image_count,
    video_count,
    gif_count,
    media_density_ratio,
    originalPrediction,
    isCorrect: isCorrectClassification
  });

  showFeedbackConfirmation(isCorrectClassification);
}

function showFeedbackConfirmation(isCorrect) {
  // Replace feedback section with thank you message
  const feedbackSection = document.getElementById('feedback-section');
  if (feedbackSection) {
    feedbackSection.style.cssText = `
      text-align: center;
      padding: 16px;
      background: #F8FAFC;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
    `;
    
    const thankYou = document.createElement('div');
    thankYou.style.cssText = `
      font-size: 14px;
      color: #059669;
      font-weight: 600;
      margin-bottom: 4px;
    `;
    thankYou.textContent = '✅ Thanks for your feedback!';
    
    const helpText = document.createElement('div');
    helpText.style.cssText = `
      font-size: 12px;
      color: #6B7280;
    `;
    helpText.textContent = 'This helps Sage AI learn and improve';
    
    feedbackSection.innerHTML = '';
    feedbackSection.appendChild(thankYou);
    feedbackSection.appendChild(helpText);

    // Auto-hide the entire overlay after showing confirmation for 2 seconds
    setTimeout(() => {
      removeStudyRatOverlay();
    }, 2000);
  }
}

function removeStudyRatOverlay() {
  const existing = document.getElementById('studyrat-overlay');
  if (existing) {
    existing.remove();
    // Restore scrolling if it was disabled
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    // Remove keyboard event listener if it was added
    document.removeEventListener('keydown', blockKeyboardShortcuts, true);
  }
}

existing.remove();
    // Restore scrolling if it was disabled
    document.body.style.overflow = '';
