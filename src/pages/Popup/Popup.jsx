import React, { useState, useEffect } from 'react';
import './Popup.css'

const Popup = () => {
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial state from Chrome storage
  useEffect(() => {
    const loadState = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['sageAiActivated']);
          setIsActivated(result.sageAiActivated || false);
        }
      } catch (error) {
        console.error('Error loading state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadState();
  }, []);

  // Handle toggle and save to Chrome storage
  const handleToggle = async () => {
    const newState = !isActivated;
    setIsActivated(newState);
    
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ sageAiActivated: newState });
        
        // Notify background script of state change
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
          {isActivated ? 'Blocking distractions' : 'Distractions allowed'}
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