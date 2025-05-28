/**
 * ADO Naturale - Popup JavaScript
 * Handles popup interface functionality and communication with background script
 */

(function() {
  'use strict';
  
  // DOM elements
  let extensionStatusEl;
  let pageStatusEl;
  let toggleButton;
  let toggleText;
  let refreshButton;
  let totalQueriesEl;
  let successRateEl;
  let viewHistoryLink;
  let reportIssueLink;
  
  // State
  let extensionEnabled = true;
  let currentTab = null;
  
  /**
   * Initialize popup when DOM is loaded
   */
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('ADO Naturale popup initializing...');
    
    // Get DOM elements
    initializeElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial state
    await loadInitialState();
    
    console.log('ADO Naturale popup initialized');
  });
  
  /**
   * Get references to DOM elements
   */
  function initializeElements() {
    extensionStatusEl = document.getElementById('extensionStatus');
    pageStatusEl = document.getElementById('pageStatus');
    toggleButton = document.getElementById('toggleExtension');
    toggleText = document.getElementById('toggleText');
    refreshButton = document.getElementById('refreshExtension');
    totalQueriesEl = document.getElementById('totalQueries');
    successRateEl = document.getElementById('successRate');
    viewHistoryLink = document.getElementById('viewHistory');
    reportIssueLink = document.getElementById('reportIssue');
  }
  
  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Toggle extension
    toggleButton.addEventListener('click', handleToggleExtension);
    
    // Refresh extension
    refreshButton.addEventListener('click', handleRefreshExtension);
    
    // View history
    viewHistoryLink.addEventListener('click', handleViewHistory);
    
    // Report issue
    reportIssueLink.addEventListener('click', handleReportIssue);
  }
  
  /**
   * Load initial state from storage and current tab
   */
  async function loadInitialState() {
    try {
      // Get current tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tabs[0];
      
      // Update page status
      updatePageStatus();
      
      // Get extension settings
      const settings = await getExtensionSettings();
      extensionEnabled = settings.enabled !== false;
      
      // Update extension status
      updateExtensionStatus();
      
      // Load usage statistics
      await loadUsageStats();
      
    } catch (error) {
      console.error('Error loading initial state:', error);
      showError('Failed to load extension state');
    }
  }
  
  /**
   * Update page status display
   */
  function updatePageStatus() {
    if (!currentTab) {
      pageStatusEl.textContent = 'Unknown';
      pageStatusEl.className = 'status-value';
      return;
    }
    
    const url = currentTab.url;
    const isADOPage = url.includes('visualstudio.com') || url.includes('dev.azure.com');
    const isQueryPage = url.includes('/_queries');
    
    if (isADOPage && isQueryPage) {
      pageStatusEl.textContent = 'ADO Queries';
      pageStatusEl.className = 'status-value ado-page';
    } else if (isADOPage) {
      pageStatusEl.textContent = 'Azure DevOps';
      pageStatusEl.className = 'status-value ado-page';
    } else {
      pageStatusEl.textContent = 'Other Page';
      pageStatusEl.className = 'status-value other-page';
    }
  }
  
  /**
   * Update extension status display
   */
  function updateExtensionStatus() {
    if (extensionEnabled) {
      extensionStatusEl.textContent = 'Enabled';
      extensionStatusEl.className = 'status-value enabled';
      toggleText.textContent = 'Disable Extension';
      toggleButton.className = 'control-button primary';
    } else {
      extensionStatusEl.textContent = 'Disabled';
      extensionStatusEl.className = 'status-value disabled';
      toggleText.textContent = 'Enable Extension';
      toggleButton.className = 'control-button primary disabled';
    }
  }
  
  /**
   * Load usage statistics
   */
  async function loadUsageStats() {
    try {
      const response = await sendMessageToBackground({ action: 'getQueryHistory' });
      
      if (response.success) {
        const history = response.history || [];
        const totalQueries = history.length;
        
        // Calculate success rate (assuming queries without errors are successful)
        const successfulQueries = history.filter(query => !query.error).length;
        const successRate = totalQueries > 0 ? Math.round((successfulQueries / totalQueries) * 100) : 0;
        
        totalQueriesEl.textContent = totalQueries;
        successRateEl.textContent = `${successRate}%`;
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
      totalQueriesEl.textContent = '0';
      successRateEl.textContent = '0%';
    }
  }
  
  /**
   * Handle toggle extension button click
   */
  async function handleToggleExtension() {
    try {
      toggleButton.classList.add('loading');
      
      const newState = !extensionEnabled;
      
      // Send toggle message to background
      const response = await sendMessageToBackground({
        action: 'toggleExtension',
        enabled: newState
      });
      
      if (response.success) {
        extensionEnabled = newState;
        updateExtensionStatus();
        
        // If we're on an ADO page, also send message to content script
        if (currentTab && (currentTab.url.includes('visualstudio.com') || currentTab.url.includes('dev.azure.com'))) {
          try {
            await chrome.tabs.sendMessage(currentTab.id, {
              action: 'toggleExtension',
              enabled: newState
            });
          } catch (error) {
            console.warn('Could not send message to content script:', error);
          }
        }
      } else {
        showError('Failed to toggle extension');
      }
    } catch (error) {
      console.error('Error toggling extension:', error);
      showError('Failed to toggle extension');
    } finally {
      toggleButton.classList.remove('loading');
    }
  }
  
  /**
   * Handle refresh extension button click
   */
  async function handleRefreshExtension() {
    try {
      refreshButton.classList.add('loading');
      
      // If we're on an ADO page, send reinitialize message
      if (currentTab && (currentTab.url.includes('visualstudio.com') || currentTab.url.includes('dev.azure.com'))) {
        try {
          await chrome.tabs.sendMessage(currentTab.id, {
            action: 'reinitialize'
          });
          
          // Reload stats
          await loadUsageStats();
          
        } catch (error) {
          console.warn('Could not send message to content script:', error);
          showError('Please refresh the page manually');
        }
      } else {
        showError('Not on an Azure DevOps page');
      }
    } catch (error) {
      console.error('Error refreshing extension:', error);
      showError('Failed to refresh extension');
    } finally {
      refreshButton.classList.remove('loading');
    }
  }
  
  /**
   * Handle view history link click
   */
  function handleViewHistory(e) {
    e.preventDefault();
    
    // For now, just show an alert. In the future, this could open a dedicated history page
    alert('Query history feature coming soon!\n\nYou can view your recent queries in the browser console for now.');
  }
  
  /**
   * Handle report issue link click
   */
  function handleReportIssue(e) {
    e.preventDefault();
    
    // Open GitHub issues page or internal feedback system
    const issueUrl = 'https://github.com/your-org/ado-naturale/issues/new';
    chrome.tabs.create({ url: issueUrl });
  }
  
  /**
   * Get extension settings from storage
   */
  async function getExtensionSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['enabled', 'settings'], (result) => {
        if (chrome.runtime.lastError) {
          console.warn('Could not get extension settings:', chrome.runtime.lastError);
          resolve({ enabled: true });
        } else {
          resolve({
            enabled: result.enabled !== false,
            settings: result.settings || {}
          });
        }
      });
    });
  }
  
  /**
   * Send message to background script
   */
  function sendMessageToBackground(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false, error: 'No response' });
        }
      });
    });
  }
  
  /**
   * Show error message
   */
  function showError(message) {
    // For now, just log to console. In the future, could show in UI
    console.error('Popup error:', message);
    
    // Could add a toast notification or error banner here
    const errorEl = document.createElement('div');
    errorEl.textContent = message;
    errorEl.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      background: #ffebe9;
      color: #cf222e;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #fd8c73;
      font-size: 12px;
      z-index: 1000;
    `;
    
    document.body.appendChild(errorEl);
    
    setTimeout(() => {
      if (errorEl.parentNode) {
        errorEl.parentNode.removeChild(errorEl);
      }
    }, 3000);
  }
  
})(); 