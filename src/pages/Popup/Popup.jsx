import React, { useState, useEffect } from 'react';
import './Popup.css'; // Your CSS is assumed to be correct

const Popup = () => {
  // --- STATE MANAGEMENT ---
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serverHealth, setServerHealth] = useState(null);
  const [countdown, setCountdown] = useState(15);

  // --- HELPER FUNCTIONS ---
  const formatLastCheckedTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 2) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const getServerStatus = () => {
    if (!serverHealth || !serverHealth.lastChecked) {
      return { status: 'checking', color: 'gray', message: 'Checking server status...' };
    }
    if (!serverHealth.connected) {
      return { status: 'offline', color: 'red', message: 'Server is unreachable' };
    }
    if (!serverHealth.model_loaded || !serverHealth.vectorizer_loaded) {
      return { status: 'error', color: 'orange', message: 'AI components not loaded' };
    }
    if (!serverHealth.supabase_connected) {
      return { status: 'warning', color: 'yellow', message: 'Database disconnected' };
    }
    return { status: 'healthy', color: 'green', message: 'All systems operational' };
  };

  // --- EFFECTS ---

  // Effect to load initial state and listen for storage changes
  useEffect(() => {
    const loadInitialState = async () => {
      if (!chrome.storage) return;
      try {
        const result = await chrome.storage.local.get(['sageAiActivated', 'serverHealth']);
        setIsActivated(result.sageAiActivated || false);
        setServerHealth(result.serverHealth || null);
      } catch (error) {
        console.error("Error loading state from storage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleStorageChange = (changes) => {
      if (changes.serverHealth) {
        setServerHealth(changes.serverHealth.newValue);
        // If we just reconnected, the countdown will be stopped by the other effect
        // If we just disconnected, the countdown will be started.
      }
    };

    loadInitialState();
    // Request a fresh check every time the popup is opened for immediate feedback
    if (chrome.runtime) chrome.runtime.sendMessage({ action: 'checkHealth' });

    chrome.storage?.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage?.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const serverStatus = getServerStatus();
  const isServerOffline = serverStatus.status === 'offline';

  // Effect to manage the 15-second retry countdown
  useEffect(() => {
    // We only want a timer if the server is offline.
    if (!isServerOffline) {
        // Reset countdown for the next potential disconnection.
        setCountdown(15);
        return;
    }

    // When the countdown hits zero, the background script's 15s alarm
    // will be about to run, so we just reset our visual timer.
    if (countdown === 0) {
        setCountdown(15); // Reset the visual countdown
        return;
    }

    // Set up a 1-second interval to decrement the countdown.
    const intervalId = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
    }, 1000);

    // Cleanup function to clear the interval when the component unmounts
    // or when the server comes back online.
    return () => clearInterval(intervalId);

  }, [isServerOffline, countdown]);


  // --- HANDLERS ---
  const handleToggle = async () => {
    const newState = !isActivated;
    setIsActivated(newState);
    try {
      if (!chrome.storage) return;
      await chrome.storage.local.set({ sageAiActivated: newState });
      chrome.runtime?.sendMessage({ action: 'toggleSageAi', activated: newState });
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="popup-container" style={{ height: '100px' }}>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const canActivate = serverStatus.status === 'healthy';

  return (
    <div className="popup-container">
      <div className="header">
        <div className="brand-container">
          <div className="sage-icon">🧠</div>
          <div className="brand-text">
            <h1 className="sage-title">SAGE AI</h1>
            <p className="sage-subtitle">Focus Extension</p>
          </div>
        </div>
      </div>

      <div className={`server-status-card ${serverStatus.color}`}>
        <div className="server-status-header">
          <div className="server-status-indicator">
            <div className="server-dot"></div>
            <span className="server-status-label">Server Status</span>
          </div>
          <span className="last-checked">
            {formatLastCheckedTime(serverHealth?.lastChecked)}
          </span>
        </div>

        <div className="server-status-details">
          <div className="status-message">{serverStatus.message}</div>
            
            {/* Show countdown when offline, otherwise show component status */}
            {isServerOffline ? (
                <div className="retry-container">
                    <div className="retry-spinner"></div>
                    <span>Retrying in {countdown}s...</span>
                </div>
            ) : (
                serverHealth?.connected && (
                    <div className="status-components">
                        <div className={`component ${serverHealth.model_loaded ? 'ok' : 'error'}`}>
                            <span className="component-icon">{serverHealth.model_loaded ? '✓' : '✗'}</span>
                            <span className="component-label">AI Model</span>
                        </div>
                        <div className={`component ${serverHealth.vectorizer_loaded ? 'ok' : 'error'}`}>
                            <span className="component-icon">{serverHealth.vectorizer_loaded ? '✓' : '✗'}</span>
                            <span className="component-label">Vectorizer</span>
                        </div>
                        <div className={`component ${serverHealth.supabase_connected ? 'ok' : 'error'}`}>
                            <span className="component-icon">{serverHealth.supabase_connected ? '✓' : '✗'}</span>
                            <span className="component-label">Database</span>
                        </div>
                    </div>
                )
            )}
        </div>
      </div>

      <div className="content">
        <div className={`status-container ${isActivated ? 'active' : 'inactive'}`}>
          <div className="status-dot"></div>
          <span className="status-text">{isActivated ? 'Focus Active' : 'Focus Inactive'}</span>
        </div>

        <div className="toggle-container">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={isActivated}
              onChange={handleToggle}
              className="toggle-input"
              disabled={!canActivate}
            />
            <div className="toggle-slider">
              <div className="toggle-thumb">
                <div className="toggle-icon">{isActivated ? '🔒' : '🔓'}</div>
              </div>
            </div>
          </label>
        </div>

        <div className="description">
          {!canActivate
            ? 'Server must be healthy to activate'
            : isActivated
              ? 'Blocking distractions'
              : 'Distractions allowed'}
        </div>
      </div>

      <div className="footer">
        <span className="footer-text">StudyRat.com</span>
      </div>
    </div>
  );
};

export default Popup;