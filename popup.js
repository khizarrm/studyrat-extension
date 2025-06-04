/**
 * Chrome Extension Popup Controller
 * Manages admin panel, learning mode, and server communication
 */

class ExtensionPopup {
  constructor() {
    // Configuration
    this.config = {
      SERVER_URL: 'http://127.0.0.1:5000',
      ADMIN_PASSWORD: 'sageadmin123', // TODO: Move to secure storage
      ADMIN_CLICK_THRESHOLD: 5,
      ADMIN_CLICK_TIMEOUT: 3000,
      AUTO_REFRESH_INTERVAL: 30000,
      REQUEST_TIMEOUT: 120000
    };

    // State management
    this.state = {
      currentView: 'normal',
      adminClickCount: 0,
      adminClickTimer: null,
      autoRefreshTimer: null,
      isServerOnline: false,
      learningMode: true
    };

    // DOM elements cache
    this.elements = {};
    
    // API client
    this.api = new APIClient(this.config.SERVER_URL);
    
    // Initialize when DOM is ready
    this.init();
  }

  /**
   * Initialize the popup
   */
  async init() {
    try {
      await this.waitForDOM();
      this.cacheElements();
      this.setupEventListeners();
      await this.loadInitialState();
      this.showView('normal');
      
      console.log('Extension popup initialized successfully');
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showError('Initialization failed');
    }
  }

  /**
   * Wait for DOM to be ready
   */
  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Cache DOM elements for better performance
   */
  cacheElements() {
    const selectors = {
      // Admin trigger
      adminTrigger: '#admin-trigger',
      
      // Views
      normalContent: '.content-section',
      statusSection: '.status-section',
      adminLogin: '#admin-login',
      adminPanel: '#admin-panel',
      
      // Admin login
      adminPassword: '#admin-password',
      adminLoginBtn: '#admin-login-btn',
      adminCancelBtn: '#admin-cancel-btn',
      
      // Admin panel controls
      exitAdminBtn: '#exit-admin-btn',
      learningModeSwitch: '#learning-mode-switch',
      learningModeStatus: '#learning-mode-status',
      retrainBtn: '#retrain-btn',
      viewStatsBtn: '#view-stats-btn',
      
      // Status displays
      trainingStatusIcon: '#training-status-icon',
      trainingStatusText: '#training-status-text',
      untrainedProductive: '#untrained-productive',
      untrainedUnproductive: '#untrained-unproductive',
      totalUntrained: '#total-untrained',
      totalSamples: '#total-samples',
      totalProductive: '#total-productive',
      totalUnproductive: '#total-unproductive',
      lastTrained: '#last-trained',
      
      // Normal popup
      status: '#status',
      content: '#content'
    };

    for (const [key, selector] of Object.entries(selectors)) {
      this.elements[key] = document.querySelector(selector);
      if (!this.elements[key]) {
        console.warn(`Element not found: ${selector}`);
      }
    }
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Admin trigger
    this.elements.adminTrigger?.addEventListener('click', () => this.handleAdminTriggerClick());
    
    // Admin login
    this.elements.adminLoginBtn?.addEventListener('click', () => this.handleAdminLogin());
    this.elements.adminCancelBtn?.addEventListener('click', () => this.showView('normal'));
    this.elements.adminPassword?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleAdminLogin();
    });
    
    // Admin panel
    this.elements.exitAdminBtn?.addEventListener('click', () => this.showView('normal'));
    this.elements.learningModeSwitch?.addEventListener('click', () => this.toggleLearningMode());
    this.elements.retrainBtn?.addEventListener('click', () => this.handleRetrain());
    this.elements.viewStatsBtn?.addEventListener('click', () => this.viewDetailedStats());
  }

  /**
   * Load initial application state
   */
  async loadInitialState() {
    try {
      // Load learning mode from storage
      const { learningMode } = await this.getStorageData(['learningMode']);
      this.state.learningMode = learningMode ?? true;
      
      // Check server status
      await this.checkServerHealth();
      
    } catch (error) {
      console.error('Failed to load initial state:', error);
    }
  }

  /**
   * Show specific view
   */
  showView(viewName) {
    const views = {
      normal: [this.elements.normalContent, this.elements.statusSection],
      adminLogin: [this.elements.adminLogin],
      adminPanel: [this.elements.adminPanel]
    };

    // Hide all views
    Object.values(views).flat().forEach(element => {
      if (element) element.style.display = 'none';
    });

    // Show target view
    const targetViews = views[viewName];
    if (targetViews) {
      targetViews.forEach(element => {
        if (element) element.style.display = 'block';
      });
    }

    this.state.currentView = viewName;

    // Handle view-specific logic
    switch (viewName) {
      case 'normal':
        this.updateNormalView();
        this.clearAdminState();
        break;
      case 'adminLogin':
        this.focusPasswordInput();
        break;
      case 'adminPanel':
        this.setupAdminPanel();
        break;
    }
  }

  /**
   * Handle admin trigger clicks
   */
  handleAdminTriggerClick() {
    this.state.adminClickCount++;
    
    console.log(`Admin trigger click ${this.state.adminClickCount}/${this.config.ADMIN_CLICK_THRESHOLD}`);
    
    // Reset timer
    this.clearAdminClickTimer();
    
    // Check threshold
    if (this.state.adminClickCount >= this.config.ADMIN_CLICK_THRESHOLD) {
      this.showView('adminLogin');
      this.state.adminClickCount = 0;
      return;
    }
    
    // Set reset timer
    this.state.adminClickTimer = setTimeout(() => {
      console.log('Admin trigger reset');
      this.state.adminClickCount = 0;
    }, this.config.ADMIN_CLICK_TIMEOUT);
  }

  /**
   * Clear admin click timer
   */
  clearAdminClickTimer() {
    if (this.state.adminClickTimer) {
      clearTimeout(this.state.adminClickTimer);
      this.state.adminClickTimer = null;
    }
  }

  /**
   * Focus password input with delay
   */
  focusPasswordInput() {
    setTimeout(() => {
      this.elements.adminPassword?.focus();
    }, 100);
  }

  /**
   * Handle admin login attempt
   */
  async handleAdminLogin() {
    const password = this.elements.adminPassword?.value;
    
    if (password === this.config.ADMIN_PASSWORD) {
      console.log('Admin login successful');
      this.showView('adminPanel');
    } else {
      console.log('Admin login failed');
      this.showLoginError();
    }
  }

  /**
   * Show login error with visual feedback
   */
  showLoginError() {
    const input = this.elements.adminPassword;
    if (!input) return;
    
    // Apply error styling
    Object.assign(input.style, {
      borderColor: '#EF4444',
      background: '#FEF2F2'
    });
    
    input.value = '';
    input.placeholder = 'Wrong password, try again';
    
    // Reset after delay
    setTimeout(() => {
      Object.assign(input.style, {
        borderColor: '#DDD6FE',
        background: 'white'
      });
      input.placeholder = 'Enter admin password';
    }, 2000);
  }

  /**
   * Clear admin-related state
   */
  clearAdminState() {
    this.clearAdminClickTimer();
    this.state.adminClickCount = 0;
    
    if (this.elements.adminPassword) {
      this.elements.adminPassword.value = '';
    }
    
    this.clearAutoRefresh();
  }

  /**
   * Setup admin panel functionality
   */
  async setupAdminPanel() {
    console.log('Setting up admin panel');
    
    try {
      this.updateLearningModeDisplay();
      await this.loadAdminData();
      this.startAutoRefresh();
    } catch (error) {
      console.error('Failed to setup admin panel:', error);
      this.showError('Failed to load admin data');
    }
  }

  /**
   * Load admin data from server
   */
  async loadAdminData() {
    console.log('Loading admin data...');
    
    this.showLoadingState();
    
    try {
      // Check server health first
      const healthData = await this.api.checkHealth();
      console.log('Server health:', healthData);
      
      this.state.isServerOnline = true;
      
      // Load stats in parallel
      const [untrainedStats, datasetStats] = await Promise.allSettled([
        this.api.getUntrainedStats()
      ]);
      
      if (untrainedStats.status === 'fulfilled') {
        this.updateUntrainedStats(untrainedStats.value);
      } else {
        console.error('Failed to load untrained stats:', untrainedStats.reason);
      }
      
    } catch (error) {
      console.error('Server connection failed:', error);
      this.state.isServerOnline = false;
      this.showServerOfflineState();
    }
  }

  /**
   * Show loading state for admin data
   */
  showLoadingState() {
    const loadingElements = [
      { element: this.elements.trainingStatusText, value: 'Loading...' },
      { element: this.elements.trainingStatusIcon, value: '⏳' },
      { element: this.elements.untrainedProductive, value: '-' },
      { element: this.elements.untrainedUnproductive, value: '-' },
      { element: this.elements.totalUntrained, value: '-' },
      { element: this.elements.totalSamples, value: '-' },
      { element: this.elements.totalProductive, value: '-' },
      { element: this.elements.totalUnproductive, value: '-' }
    ];
    
    loadingElements.forEach(({ element, value }) => {
      if (element) element.textContent = value;
    });
  }

  /**
   * Update untrained statistics display
   */
  updateUntrainedStats(data) {
    // Update counts
    this.updateElementText(this.elements.untrainedProductive, data.untrained_productive || 0);
    this.updateElementText(this.elements.untrainedUnproductive, data.untrained_unproductive || 0);
    this.updateElementText(this.elements.totalUntrained, data.total_untrained || 0);
    
    // Update last trained time
    const lastTrainedText = this.formatLastTrainedTime(data.last_trained);
    this.updateElementText(this.elements.lastTrained, lastTrainedText);
    
    // Update training status
    this.updateTrainingStatus(data.total_untrained || 0);
  }

  /**
   * Format last trained time in human-readable format
   */
  formatLastTrainedTime(lastTrained) {
    if (!lastTrained) return 'Never';
    
    const lastTrainedDate = new Date(lastTrained);
    const now = new Date();
    const diffTime = Math.abs(now - lastTrainedDate);
    
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Update training status based on untrained count
   */
  updateTrainingStatus(totalUntrained) {
    const statusConfig = this.getTrainingStatusConfig(totalUntrained);
    
    this.updateElementText(this.elements.trainingStatusIcon, statusConfig.icon);
    this.updateElementText(this.elements.trainingStatusText, statusConfig.text);
    
    // Update retrain button
    const retrainBtn = this.elements.retrainBtn;
    if (retrainBtn) {
      Object.assign(retrainBtn.style, statusConfig.buttonStyle);
      retrainBtn.title = statusConfig.buttonTitle;
      retrainBtn.disabled = statusConfig.buttonDisabled;
    }
  }

  /**
   * Get training status configuration based on untrained count
   */
  getTrainingStatusConfig(totalUntrained) {
    if (totalUntrained === 0) {
      return {
        icon: '🟢',
        text: 'Model is up to date',
        buttonStyle: { opacity: '0.6' },
        buttonTitle: 'No new training data available',
        buttonDisabled: false
      };
    } else if (totalUntrained < 10) {
      return {
        icon: '🟡',
        text: `${totalUntrained} new sample${totalUntrained > 1 ? 's' : ''} - Model is current`,
        buttonStyle: { opacity: '0.8' },
        buttonTitle: 'Small amount of new data available',
        buttonDisabled: false
      };
    } else if (totalUntrained < 50) {
      return {
        icon: '🟡',
        text: `${totalUntrained} new samples - Consider retraining`,
        buttonStyle: { opacity: '1' },
        buttonTitle: 'Good amount of new data for training',
        buttonDisabled: false
      };
    } else {
      return {
        icon: '🔴',
        text: `${totalUntrained} new samples - Training recommended`,
        buttonStyle: { opacity: '1', background: '#EF4444' },
        buttonTitle: 'Lots of new data - training highly recommended',
        buttonDisabled: false
      };
    }
  }

  /**
   * Update dataset statistics display
   */
  updateDatasetStats(data) {
    const totalSamples = (data.total_productive || 0) + (data.total_unproductive || 0);
    
    this.updateElementText(this.elements.totalSamples, totalSamples.toLocaleString());
    this.updateElementText(this.elements.totalProductive, (data.total_productive || 0).toLocaleString());
    this.updateElementText(this.elements.totalUnproductive, (data.total_unproductive || 0).toLocaleString());
  }

  /**
   * Show server offline state
   */
  showServerOfflineState() {
    // Update status
    this.updateElementText(this.elements.trainingStatusIcon, '❌');
    this.updateElementText(this.elements.trainingStatusText, 'Server offline - Cannot connect to Flask');
    
    // Update all stats to show error
    const errorElements = [
      this.elements.untrainedProductive,
      this.elements.untrainedUnproductive,
      this.elements.totalUntrained,
      this.elements.totalSamples,
      this.elements.totalProductive,
      this.elements.totalUnproductive
    ];
    
    errorElements.forEach(element => {
      if (element) element.textContent = '?';
    });
    
    this.updateElementText(this.elements.lastTrained, 'Unknown');
    
    // Disable buttons
    this.disableButton(this.elements.retrainBtn, 'Server offline - cannot retrain');
    this.disableButton(this.elements.viewStatsBtn, 'Server offline - cannot view stats');
  }

  /**
   * Disable button with visual feedback
   */
  disableButton(button, tooltip) {
    if (!button) return;
    
    button.disabled = true;
    button.style.opacity = '0.5';
    button.title = tooltip;
  }

  /**
   * Handle model retraining
   */
  async handleRetrain() {
    console.log('Starting model retrain');
    
    const retrainBtn = this.elements.retrainBtn;
    if (!retrainBtn || retrainBtn.disabled) {
      this.showNotification('Cannot retrain: Server is offline', 'error');
      return;
    }
    
    const originalText = retrainBtn.innerHTML;
    
    try {
      // Show loading state
      this.setRetrainButtonState('loading');
      
      const result = await this.api.retrainModel();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Show success
      this.setRetrainButtonState('success', result);
      
      // Reset after delay and reload data
      setTimeout(async () => {
        await this.loadAdminData();
        this.setRetrainButtonState('normal', null, originalText);
      }, 3000);
      
    } catch (error) {
      console.error('Retrain failed:', error);
      this.setRetrainButtonState('error', error);
      
      setTimeout(() => {
        this.setRetrainButtonState('normal', null, originalText);
        this.loadAdminData();
      }, 3000);
    }
  }

  /**
   * Set retrain button state
   */
  setRetrainButtonState(state, data = null, text = null) {
    const retrainBtn = this.elements.retrainBtn;
    if (!retrainBtn) return;
    
    const states = {
      loading: {
        disabled: true,
        innerHTML: '🔄 Training...',
        statusIcon: '⏳',
        statusText: 'Model training in progress...'
      },
      success: {
        disabled: true,
        innerHTML: '✅ Training Complete!',
        statusIcon: '✅',
        statusText: `Training completed! Accuracy: ${((data?.accuracy?.test_accuracy || 0) * 100).toFixed(1)}%`
      },
      error: {
        disabled: true,
        innerHTML: '❌ Training Failed',
        statusIcon: '❌',
        statusText: this.getErrorMessage(data)
      },
      normal: {
        disabled: false,
        innerHTML: text || '🔄 Retrain Model',
        statusIcon: null,
        statusText: null,
        style: { opacity: '1' }
      }
    };
    
    const config = states[state];
    if (!config) return;
    
    retrainBtn.disabled = config.disabled;
    retrainBtn.innerHTML = config.innerHTML;
    
    if (config.style) {
      Object.assign(retrainBtn.style, config.style);
    }
    
    if (config.statusIcon) {
      this.updateElementText(this.elements.trainingStatusIcon, config.statusIcon);
    }
    
    if (config.statusText) {
      this.updateElementText(this.elements.trainingStatusText, config.statusText);
    }
  }

  /**
   * Get error message for retrain failure
   */
  getErrorMessage(error) {
    if (error?.name === 'TimeoutError') {
      return 'Training timeout - try again';
    } else if (error?.message?.includes('Failed to fetch')) {
      return 'Server connection lost during training';
    } else {
      return `Training failed: ${error?.message || 'Unknown error'}`;
    }
  }

  /**
   * Toggle learning mode
   */
  async toggleLearningMode() {
    console.log('Toggling learning mode');
    
    this.state.learningMode = !this.state.learningMode;
    
    // Update display
    this.updateLearningModeDisplay();
    
    // Save to storage
    await this.setStorageData({ learningMode: this.state.learningMode });
    
    // Broadcast to all tabs
    await this.broadcastLearningModeUpdate();
    
    console.log('Learning mode toggled to:', this.state.learningMode ? 'ON' : 'OFF');
  }

  /**
   * Update learning mode display
   */
  updateLearningModeDisplay() {
    const switchElement = this.elements.learningModeSwitch;
    const statusElement = this.elements.learningModeStatus;
    
    if (switchElement) {
      switchElement.classList.toggle('active', this.state.learningMode);
    }
    
    if (statusElement) {
      statusElement.textContent = `Currently: ${this.state.learningMode ? 'ON' : 'OFF'}`;
    }
  }

  /**
   * Broadcast learning mode update to all tabs
   */
  async broadcastLearningModeUpdate() {
    try {
      const tabs = await this.queryTabs({});
      
      const promises = tabs.map(tab => 
        this.sendTabMessage(tab.id, {
          type: "LEARNING_MODE_UPDATE",
          learningMode: this.state.learningMode
        }).catch(err => {
          console.log('Could not send learning mode update to tab:', tab.id);
        })
      );
      
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Failed to broadcast learning mode update:', error);
    }
  }

  /**
   * View detailed statistics
   */
  viewDetailedStats() {
    console.log('Viewing detailed stats');
    
    const stats = {
      total: this.elements.totalSamples?.textContent || '0',
      productive: this.elements.totalProductive?.textContent || '0',
      unproductive: this.elements.totalUnproductive?.textContent || '0',
      untrained: this.elements.totalUntrained?.textContent || '0'
    };
    
    const message = `Dataset Statistics:
Total Samples: ${stats.total}
Productive: ${stats.productive}
Unproductive: ${stats.unproductive}
Untrained: ${stats.untrained}`;
    
    alert(message);
  }

  /**
   * Update normal view (server health check)
   */
  async updateNormalView() {
    try {
      await this.checkServerHealth();
      this.showServerConnected();
    } catch (error) {
      this.showServerDisconnected();
    }
  }

  /**
   * Check server health
   */
  async checkServerHealth() {
    const healthData = await this.api.checkHealth();
    this.state.isServerOnline = true;
    return healthData;
  }

  /**
   * Show server connected state
   */
  showServerConnected() {
    if (this.elements.status) {
      this.elements.status.className = "status-productive";
      this.elements.status.innerHTML = '<span class="icon">✅</span><span>Server connected</span>';
    }
    
    if (this.elements.content) {
      this.elements.content.textContent = "Auto-analysis running on all pages. Check top-right corner for predictions.";
    }
  }

  /**
   * Show server disconnected state
   */
  showServerDisconnected() {
    if (this.elements.status) {
      this.elements.status.className = "status-error";
      this.elements.status.innerHTML = '<span class="icon">❌</span><span>Flask server offline</span>';
    }
    
    if (this.elements.content) {
      this.elements.content.textContent = "Cannot connect to ML server. Make sure Flask is running on port 5000.";
    }
  }

  /**
   * Start auto-refresh timer
   */
  startAutoRefresh() {
    this.clearAutoRefresh();
    
    this.state.autoRefreshTimer = setInterval(() => {
      console.log('Auto-refreshing admin data...');
      this.loadAdminData();
    }, this.config.AUTO_REFRESH_INTERVAL);
  }

  /**
   * Clear auto-refresh timer
   */
  clearAutoRefresh() {
    if (this.state.autoRefreshTimer) {
      clearInterval(this.state.autoRefreshTimer);
      this.state.autoRefreshTimer = null;
    }
  }

  // Utility methods

  /**
   * Update element text content safely
   */
  updateElementText(element, text) {
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    // For now using alert, can be enhanced with custom notification system
    alert(message);
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error(message);
    this.showNotification(message, 'error');
  }

  /**
   * Get data from Chrome storage
   */
  getStorageData(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  /**
   * Set data in Chrome storage
   */
  setStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }

  /**
   * Query tabs
   */
  queryTabs(queryInfo) {
    return new Promise((resolve) => {
      chrome.tabs.query(queryInfo, resolve);
    });
  }

  /**
   * Send message to tab
   */
  sendTabMessage(tabId, message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
}

/**
 * API Client for server communication
 */
class APIClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make HTTP request with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: AbortSignal.timeout(options.timeout || 30000),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Check server health
   */
  async checkHealth() {
    return this.request('/health');
  }

  /**
   * Get untrained statistics
   */
  async getUntrainedStats() {
    return this.request('/admin/untrained-stats');
  }


  /**
   * Retrain model
   */
  async retrainModel() {
    return this.request('/admin/retrain-model', {
      method: 'POST',
      timeout: 120000 // 2 minutes for training
    });
  }
}

// Initialize the popup when script loads
const popup = new ExtensionPopup();