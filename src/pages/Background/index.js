// --- CONFIGURATION ---
const SERVER_URL = 'http://127.0.0.1:5000';
const HEALTH_CHECK_ALARM_NAME = 'healthCheck';
// Set the alarm period to 15 seconds (0.25 minutes).
// Note: Chrome may enforce a minimum of 1 minute on stable versions.
// For development and testing, 0.25 is often acceptable.
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
  // Using an alarm ensures the check runs periodically even if the service worker goes inactive.
  chrome.alarms.create(HEALTH_CHECK_ALARM_NAME, {
    delayInMinutes: 0, // Fire immediately on setup
    periodInMinutes: HEALTH_CHECK_PERIOD_MINUTES
  });
  // Perform an initial check right away.
  checkServerHealth();
});

// Fired when an alarm defined in the extension goes off.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === HEALTH_CHECK_ALARM_NAME) {
    checkServerHealth();
  }
});

// Fired when a message is sent from other parts of the extension (like the popup).
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Allow the popup to trigger an immediate health check.
  if (request.action === 'checkHealth') {
    checkServerHealth();
    sendResponse({ status: 'initiated' });
    return true; // Indicates an async response.
  }

  // Handle the toggle action (optional, based on your extension's needs)
  if (request.action === 'toggleSageAi') {
    console.log(`Sage AI activation toggled to: ${request.activated}`);
    // Add any background logic needed when the toggle state changes.
    sendResponse({ status: 'ok' });
    return true;
  }
});