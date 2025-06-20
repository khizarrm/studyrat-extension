import { handleFeedback } from "../../../apis/apiClient";
// LEARNING MODE OVERLAY (updated with Sage branding)
export function showPredictionOverlay(isProductive) {
  console.log("Prediction Overlay: ", isProductive);
  // Create overlay container with dark background particles
  const overlayContainer = document.createElement('div');
  overlayContainer.id = 'prediction-overlay-container';
  overlayContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 2147483646;
  `;

  // Floating particles for ambient effect
  const particlesContainer = document.createElement('div');
  particlesContainer.style.cssText = `
    position: absolute;
    top: 0;
    right: 0;
    width: 500px;
    height: 500px;
    overflow: hidden;
    pointer-events: none;
  `;

  // Create subtle floating particles
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      background: linear-gradient(45deg, #8b5cf6, #a855f7);
      border-radius: 50%;
      opacity: ${Math.random() * 0.2 + 0.1};
      right: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: particleDrift ${Math.random() * 15 + 20}s infinite linear;
    `;
    particlesContainer.appendChild(particle);
  }

  // Main prediction card
  const card = document.createElement('div');
  card.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    width: 380px;
    background: linear-gradient(145deg, #ffffff 0%, #faf5ff 30%, #f3e8ff 60%, #ede9fe 100%);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 24px;
    box-shadow: 
      0 25px 50px rgba(139, 92, 246, 0.2),
      0 15px 30px rgba(139, 92, 246, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      inset 0 -1px 0 rgba(139, 92, 246, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    pointer-events: all;
    cursor: default;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  `;

  // Enhanced gradient overlay
  const cardGlow = document.createElement('div');
  cardGlow.style.cssText = `
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(from 0deg, 
      rgba(139, 92, 246, 0.05), 
      rgba(168, 85, 247, 0.1), 
      rgba(192, 132, 252, 0.05), 
      rgba(196, 181, 253, 0.02), 
      rgba(139, 92, 246, 0.05));
    animation: rotate 20s linear infinite;
    pointer-events: none;
    opacity: 0.8;
  `;

  // Header with Sage AI branding
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
    padding: 20px 24px 18px 24px;
    border-radius: 23px 23px 0 0;
    color: white;
    position: relative;
    overflow: hidden;
  `;

  // Sage AI branding section
  const sageContainer = document.createElement('div');
  sageContainer.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 8px;
  `;

  const sageIcon = document.createElement('div');
  sageIcon.style.cssText = `
    font-size: 22px;
    animation: pulse 2s ease-in-out infinite;
  `;
  sageIcon.textContent = '🧠';

  const sageText = document.createElement('div');
  sageText.style.cssText = `
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  `;
  sageText.textContent = 'Sage AI';

  const subtitle = document.createElement('div');
  subtitle.style.cssText = `
    font-size: 13px;
    opacity: 0.9;
    font-weight: 500;
    text-align: center;
  `;
  subtitle.textContent = 'Learning Mode • Study Rat';

  sageContainer.appendChild(sageIcon);
  sageContainer.appendChild(sageText);
  header.appendChild(sageContainer);
  header.appendChild(subtitle);

  // Main content area
  const content = document.createElement('div');
  content.style.cssText = `
    padding: 28px 24px 24px 24px;
    position: relative;
  `;

  content.id = 'feedback-section';

  // Prediction result section
  const predictionResult = document.createElement('div');
  predictionResult.style.cssText = `
    text-align: center;
    margin-bottom: 24px;
    padding: 24px 20px;
    border-radius: 16px;
    background: ${isProductive ? 
      'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' : 
      'linear-gradient(135deg, #fefbf2 0%, #fef3c7 100%)'};
    border: 2px solid ${isProductive ? '#bbf7d0' : '#fde68a'};
    position: relative;
    overflow: hidden;
  `;

  // Prediction result glow
  const resultGlow = document.createElement('div');
  resultGlow.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${isProductive ? 
      'radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)' :
      'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)'};
    pointer-events: none;
  `;

  const predictionIcon = document.createElement('div');
  predictionIcon.style.cssText = `
    font-size: 42px;
    margin-bottom: 12px;
    animation: iconPulse 2s ease-in-out infinite;
    position: relative;
    z-index: 2;
  `;
  predictionIcon.textContent = isProductive ? '✅' : '⚠️';

  const predictionText = document.createElement('div');
  predictionText.style.cssText = `
    font-size: 19px;
    font-weight: 700;
    color: ${isProductive ? '#166534' : '#92400e'};
    margin-bottom: 6px;
    position: relative;
    z-index: 2;
  `;
  predictionText.textContent = isProductive ? 'Productive Content' : 'Potentially Distracting';

  const confidenceText = document.createElement('div');
  confidenceText.style.cssText = `
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
    position: relative;
    z-index: 2;
  `;
  confidenceText.textContent = 'AI Analysis Complete';

  predictionResult.appendChild(resultGlow);
  predictionResult.appendChild(predictionIcon);
  predictionResult.appendChild(predictionText);
  predictionResult.appendChild(confidenceText);

  // Feedback question
  const feedbackQuestion = document.createElement('div');
  feedbackQuestion.style.cssText = `
    font-size: 16px;
    color: #374151;
    margin-bottom: 20px;
    font-weight: 600;
    text-align: center;
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `;
  feedbackQuestion.textContent = 'Help Sage learn - was this correct?';

  // Feedback buttons container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  `;

  // Correct button
  const correctBtn = document.createElement('button');
  correctBtn.style.cssText = `
    flex: 1;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  `;
  correctBtn.textContent = '✅ Correct';

  // Wrong button
  const wrongBtn = document.createElement('button');
  wrongBtn.style.cssText = `
    flex: 1;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border: none;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
  `;
  wrongBtn.textContent = '❌ Wrong';

  // Skip button
  const skipBtn = document.createElement('button');
  skipBtn.style.cssText = `
    width: 100%;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    color: #64748b;
    border: 2px solid rgba(139, 92, 246, 0.2);
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  `;
  skipBtn.textContent = 'Skip for now';

  // Button hover effects
  correctBtn.addEventListener('mouseenter', () => {
    correctBtn.style.transform = 'translateY(-2px) scale(1.02)';
    correctBtn.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
  });

  correctBtn.addEventListener('mouseleave', () => {
    correctBtn.style.transform = 'translateY(0) scale(1)';
    correctBtn.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)';
  });

  wrongBtn.addEventListener('mouseenter', () => {
    wrongBtn.style.transform = 'translateY(-2px) scale(1.02)';
    wrongBtn.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.4)';
  });

  wrongBtn.addEventListener('mouseleave', () => {
    wrongBtn.style.transform = 'translateY(0) scale(1)';
    wrongBtn.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.3)';
  });

  skipBtn.addEventListener('mouseenter', () => {
    skipBtn.style.transform = 'translateY(-2px)';
    skipBtn.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)';
    skipBtn.style.borderColor = 'rgba(139, 92, 246, 0.4)';
  });

  skipBtn.addEventListener('mouseleave', () => {
    skipBtn.style.transform = 'translateY(0)';
    skipBtn.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    skipBtn.style.borderColor = 'rgba(139, 92, 246, 0.2)';
  });

  // Add animations and styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes particleDrift {
      0% { 
        transform: translateY(0px) rotate(0deg); 
        opacity: 0;
      }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { 
        transform: translateY(-500px) rotate(360deg); 
        opacity: 0;
      }
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0%, 100% { 
        transform: scale(1); 
        opacity: 1;
      }
      50% { 
        transform: scale(1.1); 
        opacity: 0.8;
      }
    }
    
    @keyframes iconPulse {
      0%, 100% { 
        transform: scale(1); 
      }
      50% { 
        transform: scale(1.05); 
      }
    }
  `;
  document.head.appendChild(style);

  // Button functionality
  correctBtn.addEventListener('click', () => {
    console.log('Feedback: Correct prediction');
    sendFeedback(true, isProductive);
  });

  wrongBtn.addEventListener('click', () => {
    console.log('Feedback: Wrong prediction');
    sendFeedback(false, isProductive);

  });

  skipBtn.addEventListener('click', () => {
    console.log('Feedback: Skipped');
    removePredictionOverlay();
  });

  // Assemble the card
  buttonContainer.appendChild(correctBtn);
  buttonContainer.appendChild(wrongBtn);
  
  content.appendChild(predictionResult);
  content.appendChild(feedbackQuestion);
  content.appendChild(buttonContainer);
  content.appendChild(skipBtn);
  
  card.appendChild(cardGlow);
  card.appendChild(header);
  card.appendChild(content);
  
  overlayContainer.appendChild(particlesContainer);
  overlayContainer.appendChild(card);
  
  document.body.appendChild(overlayContainer);
  
  return overlayContainer;
}


function removePredictionOverlay() {
  const overlay = document.getElementById('prediction-overlay-container');
  if (overlay) {
    overlay.remove();
  }
}

function sendFeedback(isCorrectClassification, originalPrediction) {
  console.log("In feedback function")
  const bodyText = document.body.innerText || ""; // or re-grab innerText if needed

  const BYTE_LIMIT = 2400; 
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const encodedText = encoder.encode(bodyText.trim());

  let truncatedText;
  if (encodedText.byteLength > BYTE_LIMIT) {
    console.log(`Feedback text is too long (${encodedText.byteLength} bytes). Truncating.`);
    const truncatedBytes = encodedText.slice(0, BYTE_LIMIT);
    truncatedText = decoder.decode(truncatedBytes);
    console.log("Truncated text: ", truncatedText)
  } else {
    truncatedText = bodyText.trim();
  }

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

  console.log("Original prediction is: ", originalPrediction)

  const feedbackData = {
    text: truncatedText,
    image_count,
    video_count,
    gif_count,
    media_density_ratio,
    originalPrediction,
    isCorrect: isCorrectClassification
  };
  console.log("Sending: ", feedbackData)
  handleFeedback(feedbackData)
  showFeedbackConfirmation(isCorrectClassification)
}

function showFeedbackConfirmation(isCorrect) {
  // Replace feedback section with thank you message
  console.log("showing feedback confirmation")
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
      removePredictionOverlay();
    }, 2000);
  }
}

