// BLOCK OVERLAY (for non-learning mode) - UNBYPASSABLE
export function showBlockOverlay() {
  
  // Create full-screen overlay with dark background
  const overlay = document.createElement('div');
  overlay.id = 'studyrat-overlay';
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: radial-gradient(ellipse at center, #0f0f0f 0%, #000000 100%) !important;
    z-index: 2147483647 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    pointer-events: all !important;
    backdrop-filter: blur(20px) !important;
    animation: fadeIn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  `;

  // Floating particles background
  const particlesContainer = document.createElement('div');
  particlesContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  `;

  // Create floating particles
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 4 + 2}px;
      height: ${Math.random() * 4 + 2}px;
      background: linear-gradient(45deg, #8b5cf6, #a855f7);
      border-radius: 50%;
      opacity: ${Math.random() * 0.3 + 0.1};
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: float ${Math.random() * 10 + 15}s infinite linear;
    `;
    particlesContainer.appendChild(particle);
  }

  // Main card container with enhanced purple gradient
  const card = document.createElement('div');
  card.style.cssText = `
    position: relative;
    background: linear-gradient(145deg, #ffffff 0%, #faf5ff 30%, #f3e8ff 60%, #ede9fe 100%);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 32px;
    padding: 60px 50px;
    max-width: 520px;
    text-align: center;
    box-shadow: 
      0 32px 64px rgba(139, 92, 246, 0.25),
      0 16px 32px rgba(139, 92, 246, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      inset 0 -1px 0 rgba(139, 92, 246, 0.1);
    animation: slideUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both;
    overflow: hidden;
    cursor: default;
    transform-style: preserve-3d;
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
      rgba(139, 92, 246, 0.1), 
      rgba(168, 85, 247, 0.15), 
      rgba(192, 132, 252, 0.1), 
      rgba(196, 181, 253, 0.05), 
      rgba(139, 92, 246, 0.1));
    animation: rotate 15s linear infinite;
    pointer-events: none;
    opacity: 0.7;
  `;

  // Interactive spotlight effect that follows mouse
  const spotlight = document.createElement('div');
  spotlight.style.cssText = `
    position: absolute;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s ease;
    opacity: 0;
    mix-blend-mode: overlay;
  `;

  // Animated geometric shapes
  const geometryContainer = document.createElement('div');
  geometryContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
  `;

  // Create floating geometric shapes
  for (let i = 0; i < 8; i++) {
    const shape = document.createElement('div');
    const isCircle = Math.random() > 0.5;
    const size = Math.random() * 8 + 4;
    
    shape.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: linear-gradient(45deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.2));
      ${isCircle ? 'border-radius: 50%;' : 'transform: rotate(45deg);'}
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: geometryFloat ${Math.random() * 8 + 12}s infinite ease-in-out;
      animation-delay: ${Math.random() * 5}s;
    `;
    geometryContainer.appendChild(shape);
  }

  // Header with Sage AI branding
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
    padding: 20px 24px 18px 24px;
    border-radius: 20px;
    color: white;
    position: relative;
    overflow: hidden;
    margin-bottom: 32px;
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
  subtitle.textContent = 'Focus Mode • Study Rat';

  sageContainer.appendChild(sageIcon);
  sageContainer.appendChild(sageText);
  header.appendChild(sageContainer);
  header.appendChild(subtitle);

  // Status indicator with pulsing dot
  const statusContainer = document.createElement('div');
  statusContainer.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 32px;
    padding: 16px 24px;
    background: linear-gradient(135deg, #fefbf2 0%, #fef3c7 100%);
    border: 2px solid #fde68a;
    border-radius: 16px;
    position: relative;
    overflow: hidden;
  `;

  // Status glow effect
  const statusGlow = document.createElement('div');
  statusGlow.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.1) 0%, transparent 50%);
    pointer-events: none;
  `;

  const statusDot = document.createElement('div');
  statusDot.style.cssText = `
    width: 12px;
    height: 12px;
    background: linear-gradient(45deg, #ef4444, #f97316);
    border-radius: 50%;
    animation: statusPulse 2s ease-in-out infinite;
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
    position: relative;
    z-index: 2;
  `;

  const statusText = document.createElement('span');
  statusText.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    color: #92400e;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    position: relative;
    z-index: 2;
  `;
  statusText.textContent = 'Distraction Blocked';

  statusContainer.appendChild(statusGlow);
  statusContainer.appendChild(statusDot);
  statusContainer.appendChild(statusText);

  // Main heading with enhanced gradient text
  const heading = document.createElement('h1');
  heading.style.cssText = `
    font-size: 42px;
    font-weight: 800;
    margin: 0 0 16px 0;
    background: linear-gradient(135deg, #1f2937 0%, #8b5cf6 30%, #a855f7 70%, #1f2937 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.02em;
    line-height: 1.1;
    animation: textShimmer 4s ease-in-out infinite;
    text-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
    position: relative;
  `;
  heading.textContent = 'Focus Mode';

  // Subtitle
  const contentSubtitle = document.createElement('p');
  contentSubtitle.style.cssText = `
    font-size: 18px;
    color: rgba(75, 85, 99, 0.8);
    margin: 0 0 40px 0;
    font-weight: 400;
    line-height: 1.6;
    letter-spacing: 0.01em;
  `;
  contentSubtitle.textContent = 'Distraction detected. Time to lock in and achieve greatness.';

  // Button container for both buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 0;
  `;

  // Interactive unlock button
  const unlockButton = document.createElement('button');
  unlockButton.style.cssText = `
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
    border: none;
    border-radius: 20px;
    padding: 16px 32px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  `;
  unlockButton.textContent = '🔓 Break Focus';

  // Go back button
  const goBackButton = document.createElement('button');
  goBackButton.style.cssText = `
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border: 2px solid rgba(139, 92, 246, 0.2);
    border-radius: 20px;
    padding: 14px 32px;
    color: #4b5563;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  `;
  goBackButton.textContent = '← Go Back';

  // Button hover effects
  unlockButton.addEventListener('mouseenter', () => {
    unlockButton.style.transform = 'translateY(-2px) scale(1.02)';
    unlockButton.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.4)';
  });

  unlockButton.addEventListener('mouseleave', () => {
    unlockButton.style.transform = 'translateY(0) scale(1)';
    unlockButton.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.3)';
  });

  goBackButton.addEventListener('mouseenter', () => {
    goBackButton.style.transform = 'translateY(-2px) scale(1.02)';
    goBackButton.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.15)';
    goBackButton.style.borderColor = 'rgba(139, 92, 246, 0.4)';
  });

  goBackButton.addEventListener('mouseleave', () => {
    goBackButton.style.transform = 'translateY(0) scale(1)';
    goBackButton.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.05)';
    goBackButton.style.borderColor = 'rgba(139, 92, 246, 0.2)';
  });

  // Study Rat branding
  const branding = document.createElement('div');
  branding.style.cssText = `
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: rgba(75, 85, 99, 0.5);
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
  `;
  branding.textContent = 'Study Rat • Sage AI';

  // Add all animations and styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes statusPulse {
      0%, 100% { 
        transform: scale(1); 
        opacity: 1;
      }
      50% { 
        transform: scale(1.2); 
        opacity: 0.8;
      }
    }
    
    @keyframes geometryFloat {
      0%, 100% { 
        transform: translateY(0px) rotate(0deg); 
        opacity: 0.3;
      }
      25% { 
        transform: translateY(-20px) rotate(90deg); 
        opacity: 0.6;
      }
      50% { 
        transform: translateY(-10px) rotate(180deg); 
        opacity: 0.4;
      }
      75% { 
        transform: translateY(-30px) rotate(270deg); 
        opacity: 0.7;
      }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { 
        opacity: 0; 
        transform: translateY(40px) scale(0.95); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
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
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes float {
      0% { 
        transform: translateY(0px) rotate(0deg); 
        opacity: 0;
      }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { 
        transform: translateY(-100vh) rotate(360deg); 
        opacity: 0;
      }
    }
    
    @keyframes textShimmer {
      0%, 100% { 
        background-position: 0% 50%; 
      }
      50% { 
        background-position: 100% 50%; 
      }
    }
    
    h1 {
      background-size: 200% 200%;
    }
  `;
  document.head.appendChild(style);

  // Mouse tracking for interactive effects
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - cardCenterX;
    const mouseY = e.clientY - cardCenterY;
    
    // Calculate rotation values (reduced intensity for smoother effect)
    const rotateX = (mouseY / rect.height) * -15;
    const rotateY = (mouseX / rect.width) * 15;
    
    // Apply 3D transform
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    
    // Move spotlight relative to card
    const spotlightX = e.clientX - rect.left;
    const spotlightY = e.clientY - rect.top;
    spotlight.style.left = spotlightX + 'px';
    spotlight.style.top = spotlightY + 'px';
    spotlight.style.opacity = '1';
  });
  
  card.addEventListener('mouseleave', () => {
    // Reset transform with smooth transition
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    spotlight.style.opacity = '0';
  });

  // Assemble the overlay
  buttonContainer.appendChild(unlockButton);
  buttonContainer.appendChild(goBackButton);
  
  card.appendChild(cardGlow);
  card.appendChild(spotlight);
  card.appendChild(geometryContainer);
  card.appendChild(header);
  card.appendChild(statusContainer);
  card.appendChild(heading);
  card.appendChild(contentSubtitle);
  card.appendChild(buttonContainer);
  card.appendChild(branding);
  
  overlay.appendChild(particlesContainer);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Make it unbypassable
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  
  // Prevent interactions
  overlay.addEventListener('contextmenu', (e) => e.preventDefault());
  overlay.addEventListener('selectstart', (e) => e.preventDefault());
  overlay.addEventListener('dragstart', (e) => e.preventDefault());
  
  // Block keyboard shortcuts
  document.addEventListener('keydown', blockKeyboardShortcuts, true);
  
  // Button functionality (you can customize this)
  unlockButton.addEventListener('click', () => {
    console.log('Focus break requested');
    removeStudyRatOverlay()
  });

  goBackButton.addEventListener('click', () => {
    window.history.back()
  });
  
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
  
  return overlay;
}

function blockKeyboardShortcuts(e) {
  // Block common shortcuts like F12, Ctrl+Shift+I, etc.
  if (e.key === 'F12' || 
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      (e.ctrlKey && e.key === 'u')) {
    e.preventDefault();
    e.stopPropagation();
    return false;
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