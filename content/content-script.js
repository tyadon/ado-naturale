/**
 * ADO Naturale - Main Content Script
 * Detects Azure DevOps query pages and initializes the natural language interface
 */

(function() {
  'use strict';
  
  // Global state
  let isInitialized = false;
  let extensionEnabled = true;
  let currentContext = {};
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  /**
   * Main initialization function
   */
  async function initialize() {
    console.log('ADO Naturale: Initializing content script');
    
    // Check if we're on a valid ADO query page
    if (!isValidADOQueryPage()) {
      console.log('ADO Naturale: Not on a valid ADO query page');
      return;
    }
    
    // Check if extension is enabled
    const settings = await getExtensionSettings();
    if (!settings.enabled) {
      console.log('ADO Naturale: Extension is disabled');
      return;
    }
    
    // Extract page context
    currentContext = extractPageContext();
    console.log('ADO Naturale: Page context:', currentContext);
    
    // Wait for ADO interface to be ready
    await waitForADOInterface();
    
    // Initialize the natural language interface
    if (!isInitialized) {
      initializeNaturalLanguageInterface();
      isInitialized = true;
      console.log('ADO Naturale: Successfully initialized');
    }
  }
  
  /**
   * Check if current page is a valid ADO query page
   */
  function isValidADOQueryPage() {
    const url = window.location.href;
    const validPatterns = [
      /https:\/\/.*\.visualstudio\.com\/.*\/_queries/,
      /https:\/\/dev\.azure\.com\/.*\/_queries/
    ];
    
    return validPatterns.some(pattern => pattern.test(url));
  }
  
  /**
   * Extract context information from the current page
   */
  function extractPageContext() {
    const context = {
      url: window.location.href,
      timestamp: Date.now()
    };
    
    // Extract organization and project from URL
    if (context.url.includes('dev.azure.com')) {
      // dev.azure.com format: https://dev.azure.com/organization/project/...
      const match = context.url.match(/https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        context.organization = match[1];
        context.project = match[2];
      }
    } else if (context.url.includes('.visualstudio.com')) {
      // visualstudio.com format: https://organization.visualstudio.com/project/...
      const orgMatch = context.url.match(/https:\/\/(.+?)\.visualstudio\.com/);
      const projectMatch = context.url.match(/\.visualstudio\.com\/([^\/\?]+)/);
      
      if (orgMatch && projectMatch) {
        context.organization = orgMatch[1];
        context.project = projectMatch[1];
      }
    }
    
    // Try to extract current user information
    try {
      const userElement = document.querySelector('[data-testid="user-menu-button"]') ||
                         document.querySelector('.user-display-name') ||
                         document.querySelector('.identity-picker-resolved-user');
      
      if (userElement) {
        context.currentUser = userElement.textContent?.trim() || userElement.title;
      }
    } catch (error) {
      console.warn('Could not extract user information:', error);
    }
    
    // Try to extract current iteration/sprint
    try {
      const iterationElement = document.querySelector('[aria-label*="iteration"]') ||
                              document.querySelector('.iteration-picker');
      
      if (iterationElement) {
        context.currentIteration = iterationElement.textContent?.trim();
      }
    } catch (error) {
      console.warn('Could not extract iteration information:', error);
    }
    
    return context;
  }
  
  /**
   * Wait for ADO interface elements to be available
   */
  function waitForADOInterface() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // Look for key ADO interface elements
        const queryEditor = document.querySelector('.query-editor') ||
                           document.querySelector('[data-testid="query-editor"]') ||
                           document.querySelector('.wiql-editor') ||
                           document.querySelector('.monaco-editor');
        
        const toolbar = document.querySelector('.toolbar') ||
                       document.querySelector('.query-toolbar') ||
                       document.querySelector('[role="toolbar"]');
        
        if (queryEditor || toolbar) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 10000);
    });
  }
  
  /**
   * Initialize the natural language interface
   */
  function initializeNaturalLanguageInterface() {
    try {
      // Inject the UI components
      if (typeof window.ADONaturale_UIInjector !== 'undefined') {
        window.ADONaturale_UIInjector.injectInterface(currentContext);
      } else {
        console.error('ADO Naturale: UI Injector not available');
      }
    } catch (error) {
      console.error('ADO Naturale: Error initializing interface:', error);
    }
  }
  
  /**
   * Get extension settings from storage
   */
  async function getExtensionSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'getSettings' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Could not get extension settings:', chrome.runtime.lastError);
            resolve({ enabled: true }); // Default to enabled
          } else {
            resolve(response || { enabled: true });
          }
        }
      );
    });
  }
  
  /**
   * Handle URL changes (for SPA navigation)
   */
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('ADO Naturale: URL changed, reinitializing...');
      
      // Reset state
      isInitialized = false;
      
      // Reinitialize after a short delay
      setTimeout(initialize, 1000);
    }
  });
  
  // Start observing URL changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  /**
   * Handle messages from popup and background script
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('ADO Naturale: Received message:', message);
    
    switch (message.action) {
      case 'getMetadataStatus':
        handleGetMetadataStatus(sendResponse);
        break;
        
      case 'getMetadataInfo':
        handleGetMetadataInfo(sendResponse);
        break;
        
      case 'refreshMetadata':
        handleRefreshMetadata(sendResponse);
        break;
        
      case 'testOpenAIConnection':
        handleTestOpenAIConnection(message.config, sendResponse);
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  });
  
  /**
   * Handle metadata status request
   */
  async function handleGetMetadataStatus(sendResponse) {
    try {
      if (window.ADONaturale_EnhancedNLProcessor) {
        const processor = new window.ADONaturale_EnhancedNLProcessor();
        const stats = processor.getStats();
        
        sendResponse({
          success: true,
          hasMetadata: stats.hasMetadata,
          isInitialized: stats.isInitialized,
          isOpenAIConfigured: stats.isOpenAIConfigured
        });
      } else {
        sendResponse({ success: false, error: 'Enhanced processor not available' });
      }
    } catch (error) {
      console.error('ADO Naturale: Error getting metadata status:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  /**
   * Handle metadata info request
   */
  async function handleGetMetadataInfo(sendResponse) {
    try {
      if (window.ADONaturale_MetadataClient) {
        const metadataClient = new window.ADONaturale_MetadataClient();
        const metadata = await metadataClient.getComprehensiveMetadata();
        
        sendResponse({
          success: true,
          metadata: metadata
        });
      } else {
        sendResponse({ success: false, error: 'Metadata client not available' });
      }
    } catch (error) {
      console.error('ADO Naturale: Error getting metadata info:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  /**
   * Handle metadata refresh request
   */
  async function handleRefreshMetadata(sendResponse) {
    try {
      if (window.ADONaturale_MetadataClient) {
        const metadataClient = new window.ADONaturale_MetadataClient();
        
        // Clear cache and reload metadata
        metadataClient.cache.clear();
        const metadata = await metadataClient.getComprehensiveMetadata();
        
        // If we have an enhanced processor, reinitialize it
        if (window.ADONaturale_EnhancedNLProcessor) {
          const processor = new window.ADONaturale_EnhancedNLProcessor();
          processor.metadata = null;
          processor.metadataLoadPromise = null;
          processor.isInitialized = false;
          await processor.initialize();
        }
        
        sendResponse({
          success: true,
          metadata: metadata
        });
      } else {
        sendResponse({ success: false, error: 'Metadata client not available' });
      }
    } catch (error) {
      console.error('ADO Naturale: Error refreshing metadata:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  /**
   * Handle OpenAI connection test
   */
  async function handleTestOpenAIConnection(config, sendResponse) {
    try {
      if (window.ADONaturale_OpenAIClient) {
        const openaiClient = new window.ADONaturale_OpenAIClient();
        openaiClient.configure(config);
        
        const testResult = await openaiClient.testConnection();
        
        sendResponse({
          success: testResult.success,
          error: testResult.error,
          response: testResult.response
        });
      } else {
        sendResponse({ success: false, error: 'OpenAI client not available' });
      }
    } catch (error) {
      console.error('ADO Naturale: Error testing OpenAI connection:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (observer) {
      observer.disconnect();
    }
  });
  
})(); 