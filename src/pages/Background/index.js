// --- CONFIGURATION ---
const SERVER_URL = 'http://127.0.0.1:5000';
const HEALTH_CHECK_ALARM_NAME = 'healthCheck';
const HEALTH_CHECK_PERIOD_MINUTES = 0.25;

// --- CORE FUNCTIONS ---

/**
 * Checks the server's health endpoint and updates chrome.storage.
 */
async function checkServerHealth() {
  console.log('Performing server health check...');
  try {
    const response = await fetch(`${SERVER_URL}/health`, {
        signal: AbortSignal.timeout(5000) // 5-second timeout
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const healthData = await response.json();

    await chrome.storage.local.set({
      serverHealth: {
        connected: true,
        ...healthData,
        lastChecked: Date.now()
      }
    });
    console.log('Server health check successful:', healthData);

  } catch (error) {
    console.error('Server health check failed:', error.name === 'TimeoutError' ? 'Request timed out' : error);
    await chrome.storage.local.set({
      serverHealth: {
        connected: false,
        lastChecked: Date.now()
      }
    });
  }
}


// --- CHROME API LISTENERS ---

// Fired when the extension is first installed, updated, or Chrome is updated.
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated. Setting up alarm.');
  chrome.alarms.create(HEALTH_CHECK_ALARM_NAME, {
    delayInMinutes: 0,
    periodInMinutes: HEALTH_CHECK_PERIOD_MINUTES
  });
  checkServerHealth();
});

// Fired when an alarm defined in the extension goes off.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === HEALTH_CHECK_ALARM_NAME) {
    checkServerHealth();
  }
});

// Fired when a message is sent from other parts of the extension.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Return true to indicate you will send a response asynchronously.
  
  if (request.action === 'checkHealth') {
    checkServerHealth();
    sendResponse({ status: 'initiated' });
    return true;
  }
  
  if (request.action === 'toggleSageAi') {
    console.log(`Sage AI activation toggled to: ${request.activated}`);
    sendResponse({ status: 'ok' });
    return true;
  }

  // --- NEW: Handle request for untrained stats from DevTools ---
  if (request.action === 'getUntrainedStats') {
    (async () => {
      try {
        const response = await fetch(`${SERVER_URL}/admin/untrained-stats`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        sendResponse({ success: true, data });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Indicates async response.
  }

  // --- NEW: Handle request to retrain the model from DevTools ---
  if (request.action === 'retrainModel') {
    (async () => {
      try {
        const response = await fetch(`${SERVER_URL}/admin/retrain-model`, { method: 'POST' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        sendResponse({ success: true, data });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Indicates async response.
  }
});