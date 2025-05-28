/**
 * ADO Naturale - Popup Script
 * Handles extension popup interface and configuration
 */

(function() {
  'use strict';
  
  // DOM elements
  let elements = {};
  
  // Initialize popup when DOM is loaded
  document.addEventListener('DOMContentLoaded', initializePopup);
  
  /**
   * Initialize the popup interface
   */
  async function initializePopup() {
    console.log('ADO Naturale Popup: Initializing...');
    
    // Get DOM element references
    getElementReferences();
    
    // Attach event listeners
    attachEventListeners();
    
    // Load current settings and status
    await loadCurrentState();
    
    console.log('ADO Naturale Popup: Initialized successfully');
  }
  
  /**
   * Get references to DOM elements
   */
  function getElementReferences() {
    elements = {
      // Status elements
      extensionStatus: document.getElementById('extension-status'),
      metadataStatus: document.getElementById('metadata-status'),
      openaiStatus: document.getElementById('openai-status'),
      
      // Configuration elements
      openaiEndpoint: document.getElementById('openai-endpoint'),
      openaiKey: document.getElementById('openai-key'),
      openaiDeployment: document.getElementById('openai-deployment'),
      saveConfigBtn: document.getElementById('save-config'),
      testConnectionBtn: document.getElementById('test-connection'),
      
      // Settings elements
      extensionEnabled: document.getElementById('extension-enabled'),
      showFeedback: document.getElementById('show-feedback'),
      
      // Metadata elements
      metadataInfo: document.getElementById('metadata-info'),
      refreshMetadataBtn: document.getElementById('refresh-metadata'),
      
      // Stats elements
      queriesCount: document.getElementById('queries-count'),
      successRate: document.getElementById('success-rate'),
      
      // Other elements
      viewLogsBtn: document.getElementById('view-logs')
    };
  }
  
  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    // Configuration buttons
    elements.saveConfigBtn.addEventListener('click', saveOpenAIConfiguration);
    elements.testConnectionBtn.addEventListener('click', testOpenAIConnection);
    
    // Settings toggles
    elements.extensionEnabled.addEventListener('change', toggleExtension);
    elements.showFeedback.addEventListener('change', toggleFeedback);
    
    // Metadata refresh
    elements.refreshMetadataBtn.addEventListener('click', refreshMetadata);
    
    // View logs
    elements.viewLogsBtn.addEventListener('click', viewLogs);
  }
  
  /**
   * Load current state and settings
   */
  async function loadCurrentState() {
    try {
      // Load extension settings
      const settings = await getStorageData(['extensionEnabled', 'showFeedback', 'openaiConfig']);
      
      // Update UI with current settings
      elements.extensionEnabled.checked = settings.extensionEnabled !== false;
      elements.showFeedback.checked = settings.showFeedback !== false;
      
      // Load OpenAI configuration
      if (settings.openaiConfig) {
        elements.openaiEndpoint.value = settings.openaiConfig.endpoint || '';
        elements.openaiKey.value = settings.openaiConfig.apiKey || '';
        elements.openaiDeployment.value = settings.openaiConfig.deploymentName || 'gpt-4';
      }
      
      // Update status indicators
      await updateStatusIndicators();
      
      // Load usage statistics
      await loadUsageStatistics();
      
      // Load metadata information
      await loadMetadataInformation();
      
    } catch (error) {
      console.error('ADO Naturale Popup: Error loading current state:', error);
      showError('Failed to load current settings');
    }
  }
  
  /**
   * Update status indicators
   */
  async function updateStatusIndicators() {
    // Extension status
    const extensionEnabled = elements.extensionEnabled.checked;
    updateStatusElement(elements.extensionStatus, extensionEnabled ? 'Active' : 'Disabled', extensionEnabled);
    
    // OpenAI status
    const hasOpenAIConfig = elements.openaiEndpoint.value && elements.openaiKey.value;
    updateStatusElement(elements.openaiStatus, hasOpenAIConfig ? 'Configured' : 'Not Configured', hasOpenAIConfig);
    
    // Metadata status - check with content script
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && isADOPage(tabs[0].url)) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'getMetadataStatus' });
        if (response && response.success) {
          updateStatusElement(elements.metadataStatus, 'Loaded', true);
        } else {
          updateStatusElement(elements.metadataStatus, 'Not Available', false);
        }
      } else {
        updateStatusElement(elements.metadataStatus, 'Not on ADO Page', false);
      }
    } catch (error) {
      updateStatusElement(elements.metadataStatus, 'Unknown', false);
    }
  }
  
  /**
   * Update a status element
   */
  function updateStatusElement(element, text, isPositive) {
    element.textContent = text;
    element.className = `status-value ${isPositive ? 'status-positive' : 'status-negative'}`;
  }
  
  /**
   * Save OpenAI configuration
   */
  async function saveOpenAIConfiguration() {
    try {
      const config = {
        endpoint: elements.openaiEndpoint.value.trim(),
        apiKey: elements.openaiKey.value.trim(),
        deploymentName: elements.openaiDeployment.value.trim() || 'gpt-4'
      };
      
      if (!config.endpoint || !config.apiKey) {
        showError('Please provide both endpoint URL and API key');
        return;
      }
      
      // Validate endpoint URL
      try {
        new URL(config.endpoint);
      } catch {
        showError('Please provide a valid endpoint URL');
        return;
      }
      
      // Save configuration
      await setStorageData({ openaiConfig: config });
      
      // Update status
      await updateStatusIndicators();
      
      showSuccess('OpenAI configuration saved successfully');
      
    } catch (error) {
      console.error('ADO Naturale Popup: Error saving OpenAI config:', error);
      showError('Failed to save configuration');
    }
  }
  
  /**
   * Test OpenAI connection
   */
  async function testOpenAIConnection() {
    try {
      elements.testConnectionBtn.disabled = true;
      elements.testConnectionBtn.textContent = 'Testing...';
      
      const config = {
        endpoint: elements.openaiEndpoint.value.trim(),
        apiKey: elements.openaiKey.value.trim(),
        deploymentName: elements.openaiDeployment.value.trim() || 'gpt-4'
      };
      
      if (!config.endpoint || !config.apiKey) {
        showError('Please provide both endpoint URL and API key');
        return;
      }
      
      // Send test request to content script
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && isADOPage(tabs[0].url)) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'testOpenAIConnection',
          config: config
        });
        
        if (response && response.success) {
          showSuccess('OpenAI connection test successful');
        } else {
          showError(response?.error || 'Connection test failed');
        }
      } else {
        showError('Please navigate to an Azure DevOps page to test the connection');
      }
      
    } catch (error) {
      console.error('ADO Naturale Popup: Error testing OpenAI connection:', error);
      showError('Connection test failed');
    } finally {
      elements.testConnectionBtn.disabled = false;
      elements.testConnectionBtn.textContent = 'Test Connection';
    }
  }
  
  /**
   * Toggle extension enabled/disabled
   */
  async function toggleExtension() {
    try {
      const enabled = elements.extensionEnabled.checked;
      await setStorageData({ extensionEnabled: enabled });
      await updateStatusIndicators();
      
      showSuccess(`Extension ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('ADO Naturale Popup: Error toggling extension:', error);
      showError('Failed to update extension setting');
    }
  }
  
  /**
   * Toggle feedback display
   */
  async function toggleFeedback() {
    try {
      const showFeedback = elements.showFeedback.checked;
      await setStorageData({ showFeedback: showFeedback });
      
      showSuccess(`Feedback display ${showFeedback ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('ADO Naturale Popup: Error toggling feedback:', error);
      showError('Failed to update feedback setting');
    }
  }
  
  /**
   * Refresh metadata
   */
  async function refreshMetadata() {
    try {
      elements.refreshMetadataBtn.disabled = true;
      elements.refreshMetadataBtn.textContent = 'Refreshing...';
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && isADOPage(tabs[0].url)) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshMetadata' });
        
        if (response && response.success) {
          await loadMetadataInformation();
          await updateStatusIndicators();
          showSuccess('Metadata refreshed successfully');
        } else {
          showError(response?.error || 'Failed to refresh metadata');
        }
      } else {
        showError('Please navigate to an Azure DevOps page to refresh metadata');
      }
      
    } catch (error) {
      console.error('ADO Naturale Popup: Error refreshing metadata:', error);
      showError('Failed to refresh metadata');
    } finally {
      elements.refreshMetadataBtn.disabled = false;
      elements.refreshMetadataBtn.textContent = 'Refresh Metadata';
    }
  }
  
  /**
   * Load metadata information
   */
  async function loadMetadataInformation() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && isADOPage(tabs[0].url)) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'getMetadataInfo' });
        
        if (response && response.success && response.metadata) {
          const metadata = response.metadata;
          const html = `
            <div class="metadata-details">
              <div class="metadata-item">
                <strong>Organization:</strong> ${metadata.organization || 'Unknown'}
              </div>
              <div class="metadata-item">
                <strong>Project:</strong> ${metadata.project || 'Unknown'}
              </div>
              <div class="metadata-item">
                <strong>Work Item Types:</strong> ${Object.keys(metadata.workItemTypes || {}).length}
              </div>
              <div class="metadata-item">
                <strong>Fields:</strong> ${Object.keys(metadata.fields || {}).length}
              </div>
              <div class="metadata-item">
                <strong>Team Members:</strong> ${(metadata.teamMembers || []).length}
              </div>
              <div class="metadata-item">
                <strong>Iterations:</strong> ${(metadata.iterations || []).length}
              </div>
              ${metadata.isFallback ? '<div class="metadata-warning">⚠️ Using fallback metadata</div>' : ''}
            </div>
          `;
          elements.metadataInfo.innerHTML = html;
        } else {
          elements.metadataInfo.innerHTML = '<p class="metadata-error">Metadata not available</p>';
        }
      } else {
        elements.metadataInfo.innerHTML = '<p class="metadata-info">Navigate to an Azure DevOps page to view metadata</p>';
      }
    } catch (error) {
      console.error('ADO Naturale Popup: Error loading metadata info:', error);
      elements.metadataInfo.innerHTML = '<p class="metadata-error">Error loading metadata</p>';
    }
  }
  
  /**
   * Load usage statistics
   */
  async function loadUsageStatistics() {
    try {
      const stats = await getStorageData(['queryHistory', 'usageStats']);
      
      const queryHistory = stats.queryHistory || [];
      const usageStats = stats.usageStats || { totalQueries: 0, successfulQueries: 0 };
      
      elements.queriesCount.textContent = usageStats.totalQueries || queryHistory.length || 0;
      
      const successRate = usageStats.totalQueries > 0 
        ? Math.round((usageStats.successfulQueries / usageStats.totalQueries) * 100)
        : 0;
      elements.successRate.textContent = `${successRate}%`;
      
    } catch (error) {
      console.error('ADO Naturale Popup: Error loading usage statistics:', error);
      elements.queriesCount.textContent = '-';
      elements.successRate.textContent = '-';
    }
  }
  
  /**
   * View logs
   */
  function viewLogs() {
    // Open browser console or extension logs
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
  }
  
  /**
   * Utility functions
   */
  function isADOPage(url) {
    return url && (url.includes('dev.azure.com') || url.includes('.visualstudio.com'));
  }
  
  function getStorageData(keys) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, resolve);
    });
  }
  
  function setStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(data, resolve);
    });
  }
  
  function showSuccess(message) {
    showNotification(message, 'success');
  }
  
  function showError(message) {
    showNotification(message, 'error');
  }
  
  function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to popup
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
  
})(); 