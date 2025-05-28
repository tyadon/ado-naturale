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
    const processedQuery = await processNaturalLanguage(query, context);
    const queryUrl = await generateQueryUrl(processedQuery, context);
    
    sendResponse({
      success: true,
      queryUrl: queryUrl,
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

/**
 * Process natural language query
 */
async function processNaturalLanguage(query, context) {
  const lowerQuery = query.toLowerCase();
  const processedQuery = {
    filters: {},
    workItemTypes: [],
    timeRange: {}
  };
  
  // Process work item types
  if (lowerQuery.includes('bug') || lowerQuery.includes('defect')) {
    processedQuery.workItemTypes.push('Bug');
  }
  
  if (lowerQuery.includes('user stor')) {
    processedQuery.workItemTypes.push('User Story');
  }
  
  if (lowerQuery.includes('task')) {
    processedQuery.workItemTypes.push('Task');
  }
  
  if (lowerQuery.includes('feature')) {
    processedQuery.workItemTypes.push('Feature');
  }
  
  // Process assignments
  if (lowerQuery.includes('assigned to me') || lowerQuery.includes('my work') || lowerQuery.includes('my bug')) {
    processedQuery.filters.assignedTo = '@Me';
  }
  
  // Process time ranges
  if (lowerQuery.includes('today') || lowerQuery.includes('past day')) {
    processedQuery.timeRange.type = 'today';
  } else if (lowerQuery.includes('yesterday')) {
    processedQuery.timeRange.type = 'yesterday';
  } else if (lowerQuery.includes('this week')) {
    processedQuery.timeRange.type = 'thisWeek';
  } else if (lowerQuery.includes('last week')) {
    processedQuery.timeRange.type = 'lastWeek';
  } else if (lowerQuery.includes('this month')) {
    processedQuery.timeRange.type = 'thisMonth';
  } else if (lowerQuery.includes('last month')) {
    processedQuery.timeRange.type = 'lastMonth';
  } else if (lowerQuery.includes('this sprint') || lowerQuery.includes('current sprint')) {
    processedQuery.timeRange.type = 'thisSprint';
  } else if (lowerQuery.includes('last sprint') || lowerQuery.includes('previous sprint')) {
    processedQuery.timeRange.type = 'lastSprint';
  }
  
  // Process state/status
  const stateTerms = {
    'open': ['New', 'Active', 'To Do'],
    'active': ['Active', 'In Progress', 'Doing'],
    'closed': ['Closed', 'Done', 'Resolved', 'Completed'],
    'resolved': ['Resolved', 'Done', 'Completed']
  };
  
  processedQuery.filters.state = [];
  
  for (const [term, states] of Object.entries(stateTerms)) {
    if (lowerQuery.includes(term)) {
      processedQuery.filters.state.push(...states);
    }
  }
  
  // Process priority
  if (lowerQuery.includes('high priority') || lowerQuery.includes('priority 1')) {
    processedQuery.filters.priority = [1, 2];
  } else if (lowerQuery.includes('medium priority') || lowerQuery.includes('priority 3')) {
    processedQuery.filters.priority = [3];
  } else if (lowerQuery.includes('low priority') || lowerQuery.includes('priority 4')) {
    processedQuery.filters.priority = [4];
  }
  
  // Process sorting
  if (lowerQuery.includes('newest') || lowerQuery.includes('recent')) {
    processedQuery.sortBy = { field: 'created', direction: 'desc' };
  } else if (lowerQuery.includes('oldest')) {
    processedQuery.sortBy = { field: 'created', direction: 'asc' };
  }
  
  return processedQuery;
}

/**
 * Generate Azure DevOps query URL from processed query
 */
async function generateQueryUrl(processedQuery, context) {
  // Determine base URL
  let baseUrl;
  if (context.url.includes('visualstudio.com')) {
    baseUrl = `https://${context.organization}.visualstudio.com/${context.project}/_queries/query/`;
  } else {
    baseUrl = `https://dev.azure.com/${context.organization}/${context.project}/_queries/query/`;
  }
  
  // Build the WIQL query
  const wiql = generateWIQL(processedQuery);
  
  // Encode the WIQL for URL
  const encodedWiql = encodeURIComponent(wiql);
  
  // Build the final URL
  return `${baseUrl}?wiql=${encodedWiql}`;
}

/**
 * Generate WIQL from processed query 
 */
function generateWIQL(processedQuery) {
  // Build SELECT clause with fields
  const fields = [
    '[System.Id]',
    '[System.Title]',
    '[System.WorkItemType]',
    '[System.State]',
    '[System.AssignedTo]',
    '[System.CreatedDate]',
    '[System.ChangedDate]'
  ];
  
  if (processedQuery.filters.priority && processedQuery.filters.priority.length > 0) {
    fields.push('[Microsoft.VSTS.Common.Priority]');
  }
  
  // Build SELECT clause
  const selectClause = `SELECT ${fields.join(', ')}`;
  
  // Build FROM clause
  const fromClause = 'FROM WorkItems';
  
  // Build WHERE clause
  const conditions = [];
  
  // Work item types
  if (processedQuery.workItemTypes && processedQuery.workItemTypes.length > 0) {
    const typeConditions = processedQuery.workItemTypes.map(type => 
      `[System.WorkItemType] = '${type}'`
    );
    conditions.push(`(${typeConditions.join(' OR ')})`);
  }
  
  // Assignment
  if (processedQuery.filters.assignedTo) {
    conditions.push(`[System.AssignedTo] = ${processedQuery.filters.assignedTo}`);
  }
  
  // State
  if (processedQuery.filters.state && processedQuery.filters.state.length > 0) {
    const stateConditions = processedQuery.filters.state.map(state => 
      `[System.State] = '${state}'`
    );
    conditions.push(`(${stateConditions.join(' OR ')})`);
  }
  
  // Priority
  if (processedQuery.filters.priority && processedQuery.filters.priority.length > 0) {
    const priorityConditions = processedQuery.filters.priority.map(priority => 
      `[Microsoft.VSTS.Common.Priority] = ${priority}`
    );
    conditions.push(`(${priorityConditions.join(' OR ')})`);
  }
  
  // Time range
  if (processedQuery.timeRange && processedQuery.timeRange.type) {
    switch (processedQuery.timeRange.type) {
      case 'today':
        conditions.push("[System.ChangedDate] >= @Today");
        break;
      case 'yesterday':
        conditions.push("[System.ChangedDate] >= @Today-1 AND [System.ChangedDate] < @Today");
        break;
      case 'thisWeek':
        conditions.push("[System.ChangedDate] >= @StartOfWeek AND [System.ChangedDate] <= @EndOfWeek");
        break;
      case 'lastWeek':
        conditions.push("[System.ChangedDate] >= @StartOfWeek-7 AND [System.ChangedDate] <= @EndOfWeek-7");
        break;
      case 'thisMonth':
        conditions.push("[System.ChangedDate] >= @StartOfMonth AND [System.ChangedDate] <= @EndOfMonth");
        break;
      case 'lastMonth':
        conditions.push("[System.ChangedDate] >= @StartOfMonth-1 AND [System.ChangedDate] <= @EndOfMonth-1");
        break;
      case 'thisSprint':
        conditions.push("[System.IterationPath] = @CurrentIteration");
        break;
      case 'lastSprint':
        conditions.push("[System.IterationPath] = @CurrentIteration-1");
        break;
    }
  }
  
  // Build WHERE clause
  let whereClause = '';
  if (conditions.length > 0) {
    whereClause = `WHERE ${conditions.join(' AND ')}`;
  }
  
  // Build ORDER BY clause
  let orderByClause = 'ORDER BY [System.ChangedDate] DESC';
  if (processedQuery.sortBy) {
    const sortMappings = {
      id: '[System.Id]',
      created: '[System.CreatedDate]',
      updated: '[System.ChangedDate]',
      priority: '[Microsoft.VSTS.Common.Priority]',
      title: '[System.Title]',
      state: '[System.State]'
    };
    
    const field = sortMappings[processedQuery.sortBy.field] || '[System.ChangedDate]';
    const direction = processedQuery.sortBy.direction === 'asc' ? 'ASC' : 'DESC';
    
    orderByClause = `ORDER BY ${field} ${direction}`;
  }
  
  // Construct full WIQL
  let wiql = `${selectClause} ${fromClause}`;
  
  if (whereClause) {
    wiql += ` ${whereClause}`;
  }
  
  wiql += ` ${orderByClause}`;
  
  return wiql;
}