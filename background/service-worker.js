/**
 * ADO Naturale - Background Service Worker
 * Handles extension lifecycle and communication between components
 */

// Extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('ADO Naturale extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      enabled: true,
      queryHistory: [],
      favorites: [],
      settings: {
        maxHistoryItems: 50,
        enableAnalytics: false,
        theme: 'auto'
      }
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'processNaturalLanguage':
      handleNaturalLanguageProcessing(request.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'saveQueryHistory':
      saveQueryToHistory(request.data);
      sendResponse({ success: true });
      break;
      
    case 'getQueryHistory':
      getQueryHistory(sendResponse);
      return true;
      
    case 'getSettings':
      getSettings(sendResponse);
      return true;
      
    case 'toggleExtension':
      toggleExtensionState(request.enabled, sendResponse);
      return true;
      
    default:
      console.warn('Unknown action:', request.action);
      sendResponse({ error: 'Unknown action' });
  }
});

/**
 * Process natural language query using Azure OpenAI
 */
async function handleNaturalLanguageProcessing(data, sendResponse) {
  try {
    const { query, context } = data;
    
    // TODO: Implement Azure OpenAI integration
    // For now, use a simple pattern matching approach
    const wiqlQuery = await generateWIQLFromNaturalLanguage(query, context);
    
    sendResponse({
      success: true,
      wiql: wiqlQuery,
      originalQuery: query
    });
  } catch (error) {
    console.error('Error processing natural language:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Simple WIQL generation (placeholder for Azure OpenAI integration)
 */
async function generateWIQLFromNaturalLanguage(query, context) {
  const lowerQuery = query.toLowerCase();
  
  // Basic pattern matching for common queries
  if (lowerQuery.includes('my bugs') || (lowerQuery.includes('bugs') && lowerQuery.includes('assigned to me'))) {
    return `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.CreatedDate]
FROM WorkItems 
WHERE [System.WorkItemType] = 'Bug' 
AND [System.AssignedTo] = @Me
ORDER BY [System.CreatedDate] DESC`;
  }
  
  if (lowerQuery.includes('assigned to me') || lowerQuery.includes('my work items')) {
    return `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.AssignedTo]
FROM WorkItems 
WHERE [System.AssignedTo] = @Me
ORDER BY [System.ChangedDate] DESC`;
  }
  
  if (lowerQuery.includes('created by me') || lowerQuery.includes('i created')) {
    return `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.CreatedBy]
FROM WorkItems 
WHERE [System.CreatedBy] = @Me
ORDER BY [System.CreatedDate] DESC`;
  }
  
  if (lowerQuery.includes('user stories') || lowerQuery.includes('user story')) {
    return `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.IterationPath]
FROM WorkItems 
WHERE [System.WorkItemType] = 'User Story'
ORDER BY [System.CreatedDate] DESC`;
  }
  
  if (lowerQuery.includes('high priority') || lowerQuery.includes('priority 1')) {
    return `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [Microsoft.VSTS.Common.Priority]
FROM WorkItems 
WHERE [Microsoft.VSTS.Common.Priority] <= 2
ORDER BY [Microsoft.VSTS.Common.Priority], [System.CreatedDate] DESC`;
  }
  
  // Default fallback
  return `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.AssignedTo]
FROM WorkItems 
WHERE [System.Title] CONTAINS '${query}'
ORDER BY [System.ChangedDate] DESC`;
}

/**
 * Save query to history
 */
async function saveQueryToHistory(queryData) {
  try {
    const result = await chrome.storage.sync.get(['queryHistory', 'settings']);
    const history = result.queryHistory || [];
    const settings = result.settings || { maxHistoryItems: 50 };
    
    // Add new query to beginning of history
    history.unshift({
      ...queryData,
      timestamp: Date.now(),
      id: generateId()
    });
    
    // Limit history size
    if (history.length > settings.maxHistoryItems) {
      history.splice(settings.maxHistoryItems);
    }
    
    await chrome.storage.sync.set({ queryHistory: history });
  } catch (error) {
    console.error('Error saving query history:', error);
  }
}

/**
 * Get query history
 */
async function getQueryHistory(sendResponse) {
  try {
    const result = await chrome.storage.sync.get(['queryHistory']);
    sendResponse({
      success: true,
      history: result.queryHistory || []
    });
  } catch (error) {
    console.error('Error getting query history:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get extension settings
 */
async function getSettings(sendResponse) {
  try {
    const result = await chrome.storage.sync.get(['enabled', 'settings']);
    sendResponse({
      success: true,
      enabled: result.enabled !== false,
      settings: result.settings || {
        maxHistoryItems: 50,
        enableAnalytics: false,
        theme: 'auto'
      }
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Toggle extension enabled state
 */
async function toggleExtensionState(enabled, sendResponse) {
  try {
    await chrome.storage.sync.set({ enabled });
    sendResponse({ success: true, enabled });
  } catch (error) {
    console.error('Error toggling extension state:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Generate unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
} 