import React, { useState, useEffect } from 'react';
import './Popup.css'

const Popup = () => {
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serverHealth, setServerHealth] = useState(null);

  // Load initial state from Chrome storage
  useEffect(() => {
    const loadState = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['sageAiActivated', 'serverHealth']);
          setIsActivated(result.sageAiActivated || false);
          setServerHealth(result.serverHealth || null);
        }
      } catch (error) {
        console.error('Error loading state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadState();
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (changes) => {
      if (changes.serverHealth) {
        setServerHealth(changes.serverHealth.newValue);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(handleStorageChange);
      
      // Request fresh health check when popup opens
      if (chrome.runtime) {
        chrome.runtime.sendMessage({ action: 'checkHealth' });
      }
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  // Format last checked time
  const getLastCheckedText = () => {
    if (!serverHealth?.lastChecked) return '';
    
    const seconds = Math.floor((Date.now() - serverHealth.lastChecked) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  // Get server status details
  const getServerStatus = () => {
    if (!serverHealth) return { status: 'checking', color: 'gray' };
    
    if (!serverHealth.connected) {
      return { status: 'offline', color: 'red', message: 'Server is not reachable' };
    }
    
    if (!serverHealth.model_loaded || !serverHealth.vectorizer_loaded) {
      return { status: 'error', color: 'orange', message: 'Model not loaded' };
    }
    
    if (!serverHealth.supabase_connected) {
      return { status: 'warning', color: 'yellow', message: 'Database disconnected' };
    }
    
    return { status: 'healthy', color: 'green', message: 'All systems operational' };
  };

  // Handle toggle
  const handleToggle = async () => {
    const newState = !isActivated;
    setIsActivated(newState);
    
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ sageAiActivated: newState });
        
        if (chrome.runtime) {
          chrome.runtime.sendMessage({
            action: 'toggleSageAi',
            activated: newState
          });
        }
      }
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const serverStatus = getServerStatus();
  const canActivate = serverStatus.status === 'healthy';

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="header">
        <div className="brand-container">
          <div className="sage-icon">🧠</div>
          <div className="brand-text">
            <h1 className="sage-title">SAGE AI</h1>
            <p className="sage-subtitle">Focus Extension</p>
          </div>
        </div>
      </div>

      {/* Server Status Card */}
      <div className={`server-status-card ${serverStatus.color}`}>
        <div className="server-status-header">
          <div className="server-status-indicator">
            <div className="server-dot"></div>
            <span className="server-status-label">Server Status</span>
          </div>
          {serverHealth?.lastChecked && (
            <span className="last-checked">{getLastCheckedText()}</span>
          )}
        </div>
        
        <div className="server-status-details">
          <div className="status-message">{serverStatus.message}</div>
          
          {serverHealth?.connected && (
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
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="content">
        {/* Status indicator */}
        <div className={`status-container ${isActivated ? 'active' : 'inactive'}`}>
          <div className="status-dot"></div>
          <span className="status-text">
            {isActivated ? 'Focus Active' : 'Focus Inactive'}
          </span>
        </div>

        {/* Toggle switch */}
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
                <div className="toggle-icon">
                  {isActivated ? '🔒' : '🔓'}
                </div>
              </div>
            </div>
          </label>
        </div>

        <div className="description">
          {!canActivate
            ? 'Server must be healthy to activate' 
            : isActivated 
              ? 'Blocking distractions' 
              : 'Distractions allowed'
          }
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <span className="footer-text">StudyRat.com</span>
      </div>
    </div>
  );
};

export default Popup;