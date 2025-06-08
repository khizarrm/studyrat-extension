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

/**
 * Sends a message to a tab, retrying up to a few times if the content script isn't ready.
 * @param {number} tabId The ID of the tab to send the message to.
 * @param {any} message The message to send.
 * @param {number} retries The number of remaining retries.
 */
function sendMessageWithRetry(tabId, message, retries = 5) {
  // Stop retrying if we're out of attempts
  if (retries <= 0) {
    console.log(`Stopped retrying message for tab ${tabId}. Content script might not be available.`);
    return;
  }
  
  chrome.tabs.sendMessage(tabId, message)
    .catch(error => {
      // Check for the specific error that indicates the content script is not yet available
      if (error.message.includes("Could not establish connection. Receiving end does not exist.")) {
        console.log(`Content script not ready in tab ${tabId}, retrying... (${retries - 1} left)`);
        // Wait a short moment and try again
        setTimeout(() => sendMessageWithRetry(tabId, message, retries - 1), 200);
      } else {
        console.error(`Error sending message to tab ${tabId}:`, error);
      }
    });
}


function handleNavigation(details) {
  // Filter to only run on the main top-level frame and on actual web pages
  if (details.frameId === 0 && details.url.startsWith("http")) {
    console.log(`Navigation event on ${details.url}. Notifying content script in tab ${details.tabId}.`);
    sendMessageWithRetry(details.tabId, { type: "URL_CHANGED", url: details.url });
  }
}

// Listener for traditional page loads
chrome.webNavigation.onCompleted.addListener(handleNavigation);

// Listener for URL changes in Single Page Applications
chrome.webNavigation.onHistoryStateUpdated.addListener(handleNavigation);

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