// Server health check
const SERVER_URL = 'http://127.0.0.1:5000';
const CHECK_INTERVAL = 30000; // 30 seconds

async function checkServerHealth() {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const health = await response.json();
    
    await chrome.storage.local.set({
      serverHealth: {
        connected: true,
        ...health,
        lastChecked: Date.now()
      }
    });
  } catch (error) {
    await chrome.storage.local.set({
      serverHealth: {
        connected: false,
        lastChecked: Date.now()
      }
    });
  }
}

// Check health periodically
checkServerHealth();
setInterval(checkServerHealth, CHECK_INTERVAL);

// Add to your message listener if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkHealth') {
    checkServerHealth();
  }
});