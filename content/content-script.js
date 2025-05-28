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
    const urlMatch = context.url.match(/https:\/\/(.+?)\.visualstudio\.com\/(.+?)\/_queries/) ||
                    context.url.match(/https:\/\/dev\.azure\.com\/(.+?)\/(.+?)\/_queries/);
    
    if (urlMatch) {
      context.organization = urlMatch[1];
      context.project = urlMatch[2];
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
   * Handle messages from background script
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'getPageContext':
        sendResponse({ context: currentContext });
        break;
        
      case 'reinitialize':
        isInitialized = false;
        initialize();
        sendResponse({ success: true });
        break;
        
      case 'toggleExtension':
        extensionEnabled = request.enabled;
        if (!extensionEnabled && isInitialized) {
          // Remove UI components
          if (typeof window.ADONaturale_UIInjector !== 'undefined') {
            window.ADONaturale_UIInjector.removeInterface();
          }
          isInitialized = false;
        } else if (extensionEnabled && !isInitialized) {
          initialize();
        }
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  });
  
  // Expose global functions for debugging
  window.ADONaturale_Debug = {
    getContext: () => currentContext,
    isInitialized: () => isInitialized,
    reinitialize: initialize
  };
  
})(); 