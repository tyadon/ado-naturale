/**
 * ADO Naturale - Main Content Script
 * Detects Azure DevOps query pages and initializes the natural language interface
 */

(function() {
  'use strict';
  
  // Debug utility
  const DEBUG = {
    log: (category, message, data = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `🔍 [ADO-Naturale][${category}][${timestamp}]`;
      if (data) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
    },
    error: (category, message, error = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `❌ [ADO-Naturale][${category}][${timestamp}]`;
      if (error) {
        console.error(prefix, message, error);
      } else {
        console.error(prefix, message);
      }
    },
    warn: (category, message, data = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `⚠️ [ADO-Naturale][${category}][${timestamp}]`;
      if (data) {
        console.warn(prefix, message, data);
      } else {
        console.warn(prefix, message);
      }
    }
  };
  
  // Global state
  let isInitialized = false;
  let extensionEnabled = true;
  let currentContext = {};
  
  DEBUG.log('INIT', 'Content script loading...', {
    url: window.location.href,
    readyState: document.readyState,
    userAgent: navigator.userAgent
  });
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    DEBUG.log('INIT', 'DOM still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    DEBUG.log('INIT', 'DOM already ready, initializing immediately');
    initialize();
  }
  
  /**
   * Main initialization function
   */
  async function initialize() {
    DEBUG.log('INIT', 'Starting initialization process');
    
    // Check if we're on a valid ADO query page
    const isValidPage = isValidADOQueryPage();
    DEBUG.log('INIT', 'Page validation result', { 
      isValid: isValidPage, 
      url: window.location.href 
    });
    
    if (!isValidPage) {
      DEBUG.warn('INIT', 'Not on a valid ADO query page, aborting initialization');
      return;
    }
    
    // Check if extension is enabled
    DEBUG.log('INIT', 'Getting extension settings...');
    const settings = await getExtensionSettings();
    DEBUG.log('INIT', 'Extension settings retrieved', settings);
    
    if (!settings.enabled) {
      DEBUG.warn('INIT', 'Extension is disabled in settings');
      return;
    }
    
    // Extract page context
    DEBUG.log('INIT', 'Extracting page context...');
    currentContext = extractPageContext();
    DEBUG.log('INIT', 'Page context extracted', currentContext);
    
    // Wait for ADO interface to be ready
    DEBUG.log('INIT', 'Waiting for ADO interface to be ready...');
    await waitForADOInterface();
    DEBUG.log('INIT', 'ADO interface is ready');
    
    // Initialize the natural language interface
    if (!isInitialized) {
      DEBUG.log('INIT', 'Initializing natural language interface...');
      initializeNaturalLanguageInterface();
      isInitialized = true;
      DEBUG.log('INIT', '✅ Successfully initialized ADO Naturale');
    } else {
      DEBUG.warn('INIT', 'Already initialized, skipping');
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
    
    const matches = validPatterns.map(pattern => ({
      pattern: pattern.toString(),
      matches: pattern.test(url)
    }));
    
    DEBUG.log('PAGE_VALIDATION', 'Testing URL patterns', {
      url,
      patterns: matches,
      anyMatch: matches.some(m => m.matches)
    });
    
    return validPatterns.some(pattern => pattern.test(url));
  }
  
  /**
   * Extract context information from the current page
   */
  function extractPageContext() {
    DEBUG.log('CONTEXT', 'Starting context extraction');
    
    const context = {
      url: window.location.href,
      timestamp: Date.now()
    };
    
    // Extract organization and project from URL
    if (context.url.includes('dev.azure.com')) {
      DEBUG.log('CONTEXT', 'Detected dev.azure.com format');
      // dev.azure.com format: https://dev.azure.com/organization/project/...
      const match = context.url.match(/https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        context.organization = match[1];
        context.project = match[2];
        DEBUG.log('CONTEXT', 'Extracted org/project from dev.azure.com', {
          organization: context.organization,
          project: context.project
        });
      } else {
        DEBUG.warn('CONTEXT', 'Failed to extract org/project from dev.azure.com URL');
      }
    } else if (context.url.includes('.visualstudio.com')) {
      DEBUG.log('CONTEXT', 'Detected visualstudio.com format');
      // visualstudio.com format: https://organization.visualstudio.com/project/...
      const orgMatch = context.url.match(/https:\/\/(.+?)\.visualstudio\.com/);
      const projectMatch = context.url.match(/\.visualstudio\.com\/([^\/\?\#]+)/);
      
      if (orgMatch && projectMatch) {
        context.organization = orgMatch[1];
        let project = projectMatch[1];
        
        // Handle DefaultCollection pattern - extract actual project from next segment
        if (project === 'DefaultCollection') {
          DEBUG.warn('CONTEXT', 'Detected DefaultCollection pattern');
          const altMatch = context.url.match(/\.visualstudio\.com\/DefaultCollection\/([^\/\?\#]+)/);
          if (altMatch) {
            project = altMatch[1];
            DEBUG.log('CONTEXT', 'Using alternative project extraction', { project });
          }
        }
        
        context.project = project;
        DEBUG.log('CONTEXT', 'Extracted org/project from visualstudio.com', {
          organization: context.organization,
          project: context.project
        });
      } else {
        DEBUG.warn('CONTEXT', 'Failed to extract org/project from visualstudio.com URL');
      }
    }
    
    // Try to extract current user information
    DEBUG.log('CONTEXT', 'Extracting user information...');
    try {
      const userSelectors = [
        '[data-testid="user-menu-button"]',
        '.user-display-name',
        '.identity-picker-resolved-user'
      ];
      
      let userElement = null;
      for (const selector of userSelectors) {
        userElement = document.querySelector(selector);
        if (userElement) {
          DEBUG.log('CONTEXT', `Found user element with selector: ${selector}`);
          break;
        }
      }
      
      if (userElement) {
        context.currentUser = userElement.textContent?.trim() || userElement.title;
        DEBUG.log('CONTEXT', 'Extracted user information', { currentUser: context.currentUser });
      } else {
        DEBUG.warn('CONTEXT', 'No user element found with any selector');
      }
    } catch (error) {
      DEBUG.error('CONTEXT', 'Error extracting user information', error);
    }
    
    // Try to extract current iteration/sprint
    DEBUG.log('CONTEXT', 'Extracting iteration information...');
    try {
      const iterationSelectors = [
        '[aria-label*="iteration"]',
        '.iteration-picker'
      ];
      
      let iterationElement = null;
      for (const selector of iterationSelectors) {
        iterationElement = document.querySelector(selector);
        if (iterationElement) {
          DEBUG.log('CONTEXT', `Found iteration element with selector: ${selector}`);
          break;
        }
      }
      
      if (iterationElement) {
        context.currentIteration = iterationElement.textContent?.trim();
        DEBUG.log('CONTEXT', 'Extracted iteration information', { currentIteration: context.currentIteration });
      } else {
        DEBUG.warn('CONTEXT', 'No iteration element found with any selector');
      }
    } catch (error) {
      DEBUG.error('CONTEXT', 'Error extracting iteration information', error);
    }
    
    DEBUG.log('CONTEXT', 'Context extraction complete', context);
    return context;
  }
  
  /**
   * Wait for ADO interface elements to be available
   */
  function waitForADOInterface() {
    DEBUG.log('ADO_INTERFACE', 'Starting to wait for ADO interface elements');
    
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds total
      
      const checkInterval = setInterval(() => {
        attempts++;
        DEBUG.log('ADO_INTERFACE', `Checking for ADO elements (attempt ${attempts}/${maxAttempts})`);
        
        // Look for key ADO interface elements
        const selectors = [
          '.query-editor',
          '[data-testid="query-editor"]',
          '.wiql-editor',
          '.monaco-editor',
          '.toolbar',
          '.query-toolbar',
          '[role="toolbar"]'
        ];
        
        let foundElement = null;
        let foundSelector = null;
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            foundElement = element;
            foundSelector = selector;
            break;
          }
        }
        
        if (foundElement) {
          DEBUG.log('ADO_INTERFACE', `Found ADO interface element with selector: ${foundSelector}`, {
            attempts,
            element: foundElement.tagName,
            className: foundElement.className
          });
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          DEBUG.warn('ADO_INTERFACE', `Timeout after ${maxAttempts} attempts, proceeding anyway`);
          clearInterval(checkInterval);
          resolve();
        } else {
          DEBUG.log('ADO_INTERFACE', `No ADO elements found yet (attempt ${attempts})`);
        }
      }, 500);
    });
  }
  
  /**
   * Initialize the natural language interface
   */
  function initializeNaturalLanguageInterface() {
    DEBUG.log('UI_INIT', 'Starting UI initialization');
    
    try {
      // Check if UI Injector is available
      if (typeof window.ADONaturale_UIInjector !== 'undefined') {
        DEBUG.log('UI_INIT', 'UI Injector is available, injecting interface');
        window.ADONaturale_UIInjector.injectInterface(currentContext);
        DEBUG.log('UI_INIT', '✅ UI interface injection completed');
      } else {
        DEBUG.error('UI_INIT', 'UI Injector not available in window object', {
          availableGlobals: Object.keys(window).filter(key => key.includes('ADONaturale'))
        });
      }
    } catch (error) {
      DEBUG.error('UI_INIT', 'Error initializing interface', error);
    }
  }
  
  /**
   * Get extension settings from storage
   */
  async function getExtensionSettings() {
    DEBUG.log('SETTINGS', 'Requesting extension settings from background script');
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'getSettings' },
        (response) => {
          if (chrome.runtime.lastError) {
            DEBUG.error('SETTINGS', 'Error getting extension settings', chrome.runtime.lastError);
            resolve({ enabled: true }); // Default to enabled
          } else {
            DEBUG.log('SETTINGS', 'Extension settings received', response);
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
      DEBUG.log('URL_CHANGE', 'URL changed detected', {
        from: lastUrl,
        to: window.location.href
      });
      
      lastUrl = window.location.href;
      
      // Reset state
      isInitialized = false;
      DEBUG.log('URL_CHANGE', 'Reset initialization state, reinitializing...');
      
      // Reinitialize after a short delay
      setTimeout(initialize, 1000);
    }
  });
  
  // Start observing URL changes
  DEBUG.log('OBSERVER', 'Starting MutationObserver for URL changes');
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  /**
   * Handle messages from popup and background script
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    DEBUG.log('MESSAGE', 'Received message from extension', {
      action: message.action,
      sender: sender?.tab?.id || 'popup',
      messageData: message
    });
    
    switch (message.action) {
      case 'getMetadataStatus':
        DEBUG.log('MESSAGE', 'Handling getMetadataStatus request');
        handleGetMetadataStatus(sendResponse);
        break;
        
      case 'getMetadataInfo':
        DEBUG.log('MESSAGE', 'Handling getMetadataInfo request');
        handleGetMetadataInfo(sendResponse);
        break;
        
      case 'refreshMetadata':
        DEBUG.log('MESSAGE', 'Handling refreshMetadata request');
        handleRefreshMetadata(sendResponse);
        break;
        
      case 'testOpenAIConnection':
        DEBUG.log('MESSAGE', 'Handling testOpenAIConnection request', {
          hasConfig: !!message.config,
          configEndpoint: message.config?.endpoint
        });
        handleTestOpenAIConnection(message.config, sendResponse);
        break;
        
      default:
        DEBUG.warn('MESSAGE', 'Unknown message action received', { action: message.action });
        sendResponse({ success: false, error: 'Unknown action' });
    }
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  });
  
  /**
   * Handle metadata status request
   */
  async function handleGetMetadataStatus(sendResponse) {
    DEBUG.log('METADATA_STATUS', 'Processing metadata status request');
    
    try {
      if (window.ADONaturale_EnhancedNLProcessor) {
        DEBUG.log('METADATA_STATUS', 'Enhanced NL Processor is available');
        const processor = new window.ADONaturale_EnhancedNLProcessor();
        const stats = processor.getStats();
        
        DEBUG.log('METADATA_STATUS', 'Retrieved processor stats', stats);
        
        sendResponse({
          success: true,
          hasMetadata: stats.hasMetadata,
          isInitialized: stats.isInitialized,
          isOpenAIConfigured: stats.isOpenAIConfigured
        });
      } else {
        DEBUG.error('METADATA_STATUS', 'Enhanced NL Processor not available in window object');
        sendResponse({ success: false, error: 'Enhanced processor not available' });
      }
    } catch (error) {
      DEBUG.error('METADATA_STATUS', 'Error getting metadata status', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  /**
   * Handle metadata info request
   */
  async function handleGetMetadataInfo(sendResponse) {
    DEBUG.log('METADATA_INFO', 'Processing metadata info request');
    
    try {
      if (window.ADONaturale_MetadataClient) {
        DEBUG.log('METADATA_INFO', 'Metadata Client is available');
        const metadataClient = new window.ADONaturale_MetadataClient();
        const metadata = await metadataClient.getComprehensiveMetadata();
        
        DEBUG.log('METADATA_INFO', 'Retrieved comprehensive metadata', {
          hasOrg: !!metadata.organization,
          hasProject: !!metadata.project,
          workItemTypesCount: Object.keys(metadata.workItemTypes || {}).length,
          fieldsCount: Object.keys(metadata.fields || {}).length,
          teamMembersCount: (metadata.teamMembers || []).length
        });
        
        sendResponse({
          success: true,
          metadata: metadata
        });
      } else {
        DEBUG.error('METADATA_INFO', 'Metadata Client not available in window object');
        sendResponse({ success: false, error: 'Metadata client not available' });
      }
    } catch (error) {
      DEBUG.error('METADATA_INFO', 'Error getting metadata info', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  /**
   * Handle metadata refresh request
   */
  async function handleRefreshMetadata(sendResponse) {
    DEBUG.log('METADATA_REFRESH', 'Processing metadata refresh request');
    
    try {
      if (window.ADONaturale_MetadataClient) {
        DEBUG.log('METADATA_REFRESH', 'Metadata Client is available, clearing cache');
        const metadataClient = new window.ADONaturale_MetadataClient();
        
        // Clear cache and reload metadata
        metadataClient.cache.clear();
        DEBUG.log('METADATA_REFRESH', 'Cache cleared, reloading metadata');
        
        const metadata = await metadataClient.getComprehensiveMetadata();
        
        DEBUG.log('METADATA_REFRESH', 'Metadata reloaded, reinitializing Enhanced NL Processor');
        
        // If we have an enhanced processor, reinitialize it
        if (window.ADONaturale_EnhancedNLProcessor) {
          const processor = new window.ADONaturale_EnhancedNLProcessor();
          processor.metadata = null;
          processor.metadataLoadPromise = null;
          processor.isInitialized = false;
          await processor.initialize();
          DEBUG.log('METADATA_REFRESH', 'Enhanced NL Processor reinitialized');
        }
        
        sendResponse({
          success: true,
          metadata: metadata
        });
      } else {
        DEBUG.error('METADATA_REFRESH', 'Metadata Client not available in window object');
        sendResponse({ success: false, error: 'Metadata client not available' });
      }
    } catch (error) {
      DEBUG.error('METADATA_REFRESH', 'Error refreshing metadata', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  /**
   * Handle OpenAI connection test
   */
  async function handleTestOpenAIConnection(config, sendResponse) {
    DEBUG.log('OPENAI_TEST', 'Processing OpenAI connection test', {
      hasEndpoint: !!config.endpoint,
      hasApiKey: !!config.apiKey,
      deploymentName: config.deploymentName
    });
    
    try {
      if (window.ADONaturale_OpenAIClient) {
        DEBUG.log('OPENAI_TEST', 'OpenAI Client is available, configuring and testing');
        const openaiClient = new window.ADONaturale_OpenAIClient();
        openaiClient.configure(config);
        
        const testResult = await openaiClient.testConnection();
        
        DEBUG.log('OPENAI_TEST', 'Test connection completed', {
          success: testResult.success,
          hasError: !!testResult.error,
          hasResponse: !!testResult.response
        });
        
        sendResponse({
          success: testResult.success,
          error: testResult.error,
          response: testResult.response
        });
      } else {
        DEBUG.error('OPENAI_TEST', 'OpenAI Client not available in window object');
        sendResponse({ success: false, error: 'OpenAI client not available' });
      }
    } catch (error) {
      DEBUG.error('OPENAI_TEST', 'Error testing OpenAI connection', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    DEBUG.log('CLEANUP', 'Page unloading, cleaning up observers');
    if (observer) {
      observer.disconnect();
    }
  });
  
})(); 