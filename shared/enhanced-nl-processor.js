/**
 * ADO Naturale - Enhanced Natural Language Processor
 * Combines metadata awareness with AI-powered query generation
 */

(function() {
  'use strict';
  
  // Debug utility
  const DEBUG = {
    log: (category, message, data = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `🔍 [Enhanced-NL-Processor][${category}][${timestamp}]`;
      if (data) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
    },
    error: (category, message, error = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `❌ [Enhanced-NL-Processor][${category}][${timestamp}]`;
      if (error) {
        console.error(prefix, message, error);
      } else {
        console.error(prefix, message);
      }
    },
    warn: (category, message, data = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `⚠️ [Enhanced-NL-Processor][${category}][${timestamp}]`;
      if (data) {
        console.warn(prefix, message, data);
      } else {
        console.warn(prefix, message);
      }
    }
  };
  
  DEBUG.log('INIT', 'Enhanced NL Processor script loading');
  
  /**
   * Enhanced Natural Language Processor class
   */
  class EnhancedNLProcessor {
    constructor() {
      DEBUG.log('CONSTRUCTOR', 'Creating new EnhancedNLProcessor instance');
      
      this.isInitialized = false;
      this.metadata = null;
      this.metadataLoadPromise = null;
      
      // Initialize clients
      DEBUG.log('CONSTRUCTOR', 'Initializing client instances');
      
      if (typeof window.ADONaturale_MetadataClient !== 'undefined') {
        this.metadataClient = new window.ADONaturale_MetadataClient();
        DEBUG.log('CONSTRUCTOR', '✅ Metadata client initialized');
      } else {
        DEBUG.error('CONSTRUCTOR', 'Metadata client not available');
      }
      
      if (typeof window.ADONaturale_OpenAIClient !== 'undefined') {
        this.openaiClient = new window.ADONaturale_OpenAIClient();
        DEBUG.log('CONSTRUCTOR', '✅ OpenAI client initialized');
      } else {
        DEBUG.error('CONSTRUCTOR', 'OpenAI client not available');
      }
      
      DEBUG.log('CONSTRUCTOR', 'EnhancedNLProcessor instance created', {
        hasMetadataClient: !!this.metadataClient,
        hasOpenAIClient: !!this.openaiClient
      });
      
      this.fallbackProcessor = null;
      
      // Initialize fallback processor if available
      if (window.ADONaturale_NLProcessor) {
        try {
          this.fallbackProcessor = new window.ADONaturale_NLProcessor();
        } catch (error) {
          console.warn('Enhanced NL Processor: Could not initialize fallback processor:', error);
        }
      }
    }
    
    /**
     * Initialize the processor by loading metadata and OpenAI configuration
     */
    async initialize() {
      if (this.isInitialized) {
        DEBUG.log('INITIALIZE', 'Already initialized, skipping');
        return true;
      }
      
      DEBUG.log('INITIALIZE', 'Starting initialization process');
      
      try {
        const initStartTime = Date.now();
        
        // Load metadata and OpenAI configuration in parallel
        DEBUG.log('INITIALIZE', 'Loading metadata and OpenAI configuration in parallel');
        
        const [metadataLoaded, openaiConfigured] = await Promise.all([
          this.loadMetadata(),
          this.openaiClient ? this.openaiClient.loadConfiguration() : Promise.resolve(false)
        ]);
        
        const initTime = Date.now() - initStartTime;
        
        this.isInitialized = true;
        
        DEBUG.log('INITIALIZE', '✅ Initialization completed', {
          metadataLoaded,
          openaiConfigured,
          hasMetadata: !!this.metadata,
          isOpenAIConfigured: this.openaiClient ? this.openaiClient.isConfigured() : false,
          initTime: `${initTime}ms`
        });
        
        return true;
      } catch (error) {
        DEBUG.error('INITIALIZE', 'Initialization failed', error);
        this.isInitialized = false;
        return false;
      }
    }
    
    /**
     * Load metadata from the metadata client
     */
    async loadMetadata() {
      DEBUG.log('METADATA_LOAD', 'Starting metadata loading process');
      
      if (!this.metadataClient) {
        DEBUG.error('METADATA_LOAD', 'Metadata client not available');
        return false;
      }
      
      // If metadata is already loading, wait for that promise
      if (this.metadataLoadPromise) {
        DEBUG.log('METADATA_LOAD', 'Metadata load already in progress, waiting for completion');
        return await this.metadataLoadPromise;
      }
      
      // If metadata is already loaded, return true
      if (this.metadata) {
        DEBUG.log('METADATA_LOAD', 'Metadata already loaded', {
          organization: this.metadata.organization,
          project: this.metadata.project,
          workItemTypesCount: Object.keys(this.metadata.workItemTypes || {}).length,
          fieldsCount: Object.keys(this.metadata.fields || {}).length
        });
        return true;
      }
      
      // Start loading metadata
      DEBUG.log('METADATA_LOAD', 'Loading comprehensive metadata from client');
      
      this.metadataLoadPromise = (async () => {
        try {
          const metadataStartTime = Date.now();
          this.metadata = await this.metadataClient.getComprehensiveMetadata();
          const metadataLoadTime = Date.now() - metadataStartTime;
          
          DEBUG.log('METADATA_LOAD', '✅ Metadata loaded successfully', {
            loadTime: `${metadataLoadTime}ms`,
            organization: this.metadata.organization,
            project: this.metadata.project,
            workItemTypesCount: Object.keys(this.metadata.workItemTypes || {}).length,
            fieldsCount: Object.keys(this.metadata.fields || {}).length,
            teamMembersCount: (this.metadata.teamMembers || []).length,
            iterationsCount: (this.metadata.iterations || []).length,
            areaPathsCount: (this.metadata.areaPaths || []).length
          });
          
          return true;
        } catch (error) {
          DEBUG.error('METADATA_LOAD', 'Failed to load metadata', error);
          this.metadata = null;
          return false;
        } finally {
          this.metadataLoadPromise = null;
        }
      })();
      
      return await this.metadataLoadPromise;
    }
    
    /**
     * Process natural language query with enhanced capabilities
     */
    async processQuery(userInput, context = {}) {
      DEBUG.log('PROCESS_QUERY', 'Starting query processing', {
        query: userInput,
        queryLength: userInput?.length || 0,
        context,
        isInitialized: this.isInitialized
      });
      
      // Ensure we're initialized
      if (!this.isInitialized) {
        DEBUG.log('PROCESS_QUERY', 'Not initialized, initializing now');
        await this.initialize();
      }
      
      // Validate input
      if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
        DEBUG.error('PROCESS_QUERY', 'Empty or invalid query provided');
        return this.createErrorResult('Empty or invalid query');
      }
      
      const startTime = Date.now();
      
      try {
        // Enhance context with metadata
        DEBUG.log('PROCESS_QUERY', 'Enhancing context with metadata');
        const enhancedContext = await this.enhanceContext(context);
        
        DEBUG.log('PROCESS_QUERY', 'Enhanced context prepared', {
          originalContextKeys: Object.keys(context),
          enhancedContextKeys: Object.keys(enhancedContext),
          hasMetadata: !!this.metadata
        });
        
        // Check if AI processing is available and configured
        const isAIConfigured = this.openaiClient ? this.openaiClient.isConfigured() : false;
        const hasMetadata = !!this.metadata;
        
        DEBUG.log('PROCESS_QUERY', 'Processing capabilities check', {
          isAIConfigured,
          hasMetadata,
          hasOpenAIClient: !!this.openaiClient,
          hasMetadataClient: !!this.metadataClient
        });
        
        // Try AI-powered generation first
        if (isAIConfigured && hasMetadata) {
          DEBUG.log('PROCESS_QUERY', 'Attempting AI processing (Azure OpenAI)');
          try {
            const aiResult = await this.processWithAI(userInput, enhancedContext);
            if (aiResult.success) {
              DEBUG.log('PROCESS_QUERY', '✅ AI processing successful!', {
                method: aiResult.method,
                confidence: aiResult.confidence,
                hasUrl: !!aiResult.url
              });
              aiResult.processingTime = Date.now() - startTime;
              return aiResult;
            } else {
              DEBUG.warn('PROCESS_QUERY', 'AI processing returned unsuccessful result', aiResult);
            }
          } catch (aiError) {
            DEBUG.warn('PROCESS_QUERY', 'AI processing failed with error', aiError);
          }
        } else {
          if (!isAIConfigured) {
            DEBUG.log('PROCESS_QUERY', 'Skipping AI processing - not configured');
          }
          if (!hasMetadata) {
            DEBUG.log('PROCESS_QUERY', 'Skipping AI processing - no metadata available');
          }
        }
        
        // Fallback to enhanced pattern matching
        DEBUG.log('PROCESS_QUERY', 'Using enhanced pattern matching fallback');
        const patternResult = await this.processWithEnhancedPatterns(userInput, enhancedContext);
        patternResult.processingTime = Date.now() - startTime;
        
        DEBUG.log('PROCESS_QUERY', '✅ Enhanced pattern matching completed', {
          success: patternResult.success,
          method: patternResult.method,
          confidence: patternResult.confidence
        });
        
        return patternResult;
        
      } catch (error) {
        const processingTime = Date.now() - startTime;
        DEBUG.error('PROCESS_QUERY', 'Query processing failed', {
          error,
          processingTime,
          query: userInput
        });
        return this.createErrorResult(error.message, processingTime);
      }
    }
    
    /**
     * Enhance context with metadata information
     */
    async enhanceContext(context) {
      const enhanced = { ...context };
      
      if (this.metadata) {
        enhanced.metadata = this.metadata;
        enhanced.organization = this.metadata.organization;
        enhanced.project = this.metadata.project;
        
        // Add current user information if available
        if (!enhanced.currentUser && this.metadata.teamMembers.length > 0) {
          // Try to find current user from DOM or use first team member as fallback
          enhanced.currentUser = this.extractCurrentUser() || this.metadata.teamMembers[0]?.uniqueName;
        }
        
        // Add current iteration if available
        if (!enhanced.currentIteration && this.metadata.iterations.length > 0) {
          const currentIteration = this.metadata.iterations.find(iter => 
            iter.timeFrame === 'current' || 
            (iter.startDate && iter.finishDate && 
             new Date() >= new Date(iter.startDate) && 
             new Date() <= new Date(iter.finishDate))
          );
          if (currentIteration) {
            enhanced.currentIteration = currentIteration.path;
          }
        }
      }
      
      return enhanced;
    }
    
    /**
     * Process query using AI
     */
    async processWithAI(userInput, context) {
      DEBUG.log('AI_PROCESSING', 'Starting AI processing', {
        query: userInput,
        hasOpenAIClient: !!this.openaiClient,
        isConfigured: this.openaiClient ? this.openaiClient.isConfigured() : false,
        hasMetadata: !!this.metadata
      });
      
      try {
        if (!this.openaiClient) {
          DEBUG.error('AI_PROCESSING', 'OpenAI client not available');
          throw new Error('OpenAI client not available');
        }
        
        DEBUG.log('AI_PROCESSING', 'OpenAI client available, generating query URL');
        
        const result = await this.openaiClient.generateQueryUrl(userInput, this.metadata, context);
        
        DEBUG.log('AI_PROCESSING', 'OpenAI client returned result', {
          success: result.success,
          method: result.method,
          confidence: result.confidence,
          hasUrl: !!result.url,
          reasoning: result.reasoning?.substring(0, 100) + (result.reasoning?.length > 100 ? '...' : '')
        });
        
        if (result.success) {
          DEBUG.log('AI_PROCESSING', '✅ AI processing completed successfully');
          return {
            success: true,
            url: result.url,
            confidence: result.confidence,
            method: result.method,
            reasoning: result.reasoning,
            originalQuery: userInput,
            metadata: {
              workItemTypes: this.extractWorkItemTypesFromQuery(userInput),
              fields: this.extractFieldsFromQuery(userInput),
              entities: this.extractEntitiesFromQuery(userInput, context)
            }
          };
        }
        
        DEBUG.warn('AI_PROCESSING', 'AI processing returned unsuccessful result');
        throw new Error('AI processing failed');
        
      } catch (error) {
        DEBUG.error('AI_PROCESSING', 'AI processing failed with error', {
          error: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
        throw error;
      }
    }
    
    /**
     * Process query using enhanced pattern matching
     */
    async processWithEnhancedPatterns(userInput, context) {
      console.log('Enhanced NL Processor: Using enhanced pattern matching');
      
      // Use metadata to enhance pattern matching
      const processedQuery = this.analyzeQueryWithMetadata(userInput, context);
      
      // Generate URL using enhanced information
      const url = this.generateEnhancedURL(processedQuery, context);
      
      return {
        success: true,
        url,
        confidence: processedQuery.confidence,
        method: 'enhanced-patterns',
        reasoning: processedQuery.reasoning,
        originalQuery: userInput,
        metadata: processedQuery.metadata
      };
    }
    
    /**
     * Analyze query using metadata for enhanced pattern matching
     */
    analyzeQueryWithMetadata(userInput, context) {
      const lowerInput = userInput.toLowerCase();
      const result = {
        workItemTypes: [],
        fields: {},
        conditions: [],
        sorting: null,
        confidence: 0.5,
        reasoning: '',
        metadata: {}
      };
      
      // Extract work item types using metadata
      if (this.metadata && this.metadata.workItemTypes) {
        for (const [typeName, typeInfo] of Object.entries(this.metadata.workItemTypes)) {
          const typePatterns = [
            typeName.toLowerCase(),
            typeInfo.referenceName.toLowerCase(),
            ...this.getTypeAliases(typeName)
          ];
          
          if (typePatterns.some(pattern => lowerInput.includes(pattern))) {
            result.workItemTypes.push(typeName);
            result.confidence += 0.2;
          }
        }
      }
      
      // Extract field references using metadata
      if (this.metadata && this.metadata.commonFields) {
        for (const [naturalName, technicalName] of Object.entries(this.metadata.commonFields)) {
          if (lowerInput.includes(naturalName)) {
            result.fields[technicalName] = this.extractFieldValue(userInput, naturalName, technicalName);
            result.confidence += 0.1;
          }
        }
      }
      
      // Extract assignment patterns
      if (lowerInput.includes('assigned to me') || lowerInput.includes('my ')) {
        result.fields['System.AssignedTo'] = '@Me';
        result.confidence += 0.3;
      }
      
      // Extract time-based patterns
      const timePattern = this.extractTimePattern(lowerInput);
      if (timePattern) {
        result.fields[timePattern.field] = timePattern.value;
        result.confidence += 0.2;
      }
      
      // Extract priority patterns
      const priorityPattern = this.extractPriorityPattern(lowerInput);
      if (priorityPattern) {
        result.fields['Microsoft.VSTS.Common.Priority'] = priorityPattern;
        result.confidence += 0.2;
      }
      
      // Extract state patterns
      const statePattern = this.extractStatePattern(lowerInput);
      if (statePattern) {
        result.fields['System.State'] = statePattern;
        result.confidence += 0.2;
      }
      
      // Build reasoning
      result.reasoning = this.buildReasoning(result, userInput);
      
      return result;
    }
    
    /**
     * Generate enhanced URL from processed query
     */
    generateEnhancedURL(processedQuery, context) {
      // Build WIQL query
      const selectFields = this.determineSelectFields(processedQuery);
      const whereConditions = this.buildWhereConditions(processedQuery);
      const orderBy = this.buildOrderBy(processedQuery);
      
      let wiql = `SELECT ${selectFields.join(', ')} FROM WorkItems`;
      
      if (whereConditions.length > 0) {
        wiql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      if (orderBy) {
        wiql += ` ORDER BY ${orderBy}`;
      }
      
      // Build URL
      const baseUrl = this.buildBaseUrl(context);
      const encodedWiql = encodeURIComponent(wiql);
      
      return `${baseUrl}/_queries/query/?wiql=${encodedWiql}`;
    }
    
    /**
     * Determine SELECT fields based on query
     */
    determineSelectFields(processedQuery) {
      const defaultFields = [
        '[System.Id]',
        '[System.Title]',
        '[System.WorkItemType]',
        '[System.State]',
        '[System.AssignedTo]'
      ];
      
      const additionalFields = [];
      
      // Add fields based on what's being queried
      if (processedQuery.fields['Microsoft.VSTS.Common.Priority']) {
        additionalFields.push('[Microsoft.VSTS.Common.Priority]');
      }
      
      if (processedQuery.fields['System.CreatedDate'] || processedQuery.fields['System.ChangedDate']) {
        additionalFields.push('[System.CreatedDate]', '[System.ChangedDate]');
      }
      
      if (processedQuery.workItemTypes.includes('User Story')) {
        additionalFields.push('[Microsoft.VSTS.Scheduling.StoryPoints]');
      }
      
      if (processedQuery.workItemTypes.includes('Bug')) {
        additionalFields.push('[Microsoft.VSTS.Common.Severity]');
      }
      
      return [...new Set([...defaultFields, ...additionalFields])];
    }
    
    /**
     * Build WHERE conditions
     */
    buildWhereConditions(processedQuery) {
      const conditions = [];
      
      // Work item types
      if (processedQuery.workItemTypes.length > 0) {
        const typeConditions = processedQuery.workItemTypes.map(type => 
          `[System.WorkItemType] = '${type}'`
        );
        conditions.push(`(${typeConditions.join(' OR ')})`);
      }
      
      // Field conditions
      for (const [field, value] of Object.entries(processedQuery.fields)) {
        if (value !== null && value !== undefined) {
          if (typeof value === 'string' && value.startsWith('@')) {
            conditions.push(`[${field}] = ${value}`);
          } else if (typeof value === 'number') {
            conditions.push(`[${field}] = ${value}`);
          } else {
            conditions.push(`[${field}] = '${value}'`);
          }
        }
      }
      
      return conditions;
    }
    
    /**
     * Build ORDER BY clause
     */
    buildOrderBy(processedQuery) {
      if (processedQuery.sorting) {
        return processedQuery.sorting;
      }
      
      // Default sorting based on query type
      if (processedQuery.fields['Microsoft.VSTS.Common.Priority']) {
        return '[Microsoft.VSTS.Common.Priority], [System.CreatedDate] DESC';
      }
      
      if (processedQuery.fields['System.CreatedDate']) {
        return '[System.CreatedDate] DESC';
      }
      
      return '[System.ChangedDate] DESC';
    }
    
    /**
     * Build base URL
     */
    buildBaseUrl(context) {
      if (context.organization && context.project) {
        if (context.url?.includes('dev.azure.com')) {
          return `https://dev.azure.com/${context.organization}/${context.project}`;
        } else if (context.url?.includes('.visualstudio.com')) {
          return `https://${context.organization}.visualstudio.com/${context.project}`;
        }
      }
      
      // Fallback - extract from current URL
      const currentUrl = window.location.href;
      if (currentUrl.includes('dev.azure.com')) {
        const match = currentUrl.match(/(https:\/\/dev\.azure\.com\/[^\/]+\/[^\/]+)/);
        return match ? match[1] : 'https://dev.azure.com/org/project';
      } else if (currentUrl.includes('.visualstudio.com')) {
        // Extract organization from subdomain and project from first path segment
        const orgMatch = currentUrl.match(/https:\/\/(.+?)\.visualstudio\.com/);
        const projectMatch = currentUrl.match(/\.visualstudio\.com\/([^\/\?]+)/);
        
        if (orgMatch && projectMatch) {
          return `https://${orgMatch[1]}.visualstudio.com/${projectMatch[1]}`;
        } else {
          return 'https://org.visualstudio.com/project';
        }
      }
      
      return 'https://dev.azure.com/org/project';
    }
    
    /**
     * Helper methods for pattern extraction
     */
    getTypeAliases(typeName) {
      const aliases = {
        'Bug': ['bug', 'defect', 'issue'],
        'User Story': ['story', 'user story', 'requirement'],
        'Task': ['task', 'work item'],
        'Feature': ['feature', 'epic'],
        'Test Case': ['test', 'test case']
      };
      return aliases[typeName] || [];
    }
    
    extractFieldValue(userInput, naturalName, technicalName) {
      // Extract specific values based on field type
      if (technicalName === 'System.AssignedTo') {
        if (userInput.toLowerCase().includes('me')) return '@Me';
        // Could extract specific user names here
      }
      
      return null;
    }
    
    extractTimePattern(lowerInput) {
      const patterns = {
        'today': { field: 'System.ChangedDate', value: '>= @Today' },
        'this week': { field: 'System.ChangedDate', value: '>= @StartOfWeek' },
        'last week': { field: 'System.ChangedDate', value: '>= @StartOfWeek-7 AND [System.ChangedDate] <= @EndOfWeek-7' },
        'this month': { field: 'System.ChangedDate', value: '>= @StartOfMonth' },
        'this sprint': { field: 'System.IterationPath', value: '= @CurrentIteration' }
      };
      
      for (const [pattern, result] of Object.entries(patterns)) {
        if (lowerInput.includes(pattern)) {
          return result;
        }
      }
      
      return null;
    }
    
    extractPriorityPattern(lowerInput) {
      if (lowerInput.includes('high priority') || lowerInput.includes('priority 1')) return '<= 2';
      if (lowerInput.includes('low priority') || lowerInput.includes('priority 4')) return '>= 3';
      if (lowerInput.includes('critical')) return '= 1';
      return null;
    }
    
    extractStatePattern(lowerInput) {
      if (lowerInput.includes('active')) return 'Active';
      if (lowerInput.includes('new')) return 'New';
      if (lowerInput.includes('resolved') || lowerInput.includes('closed')) return 'Resolved';
      return null;
    }
    
    buildReasoning(result, userInput) {
      const parts = [];
      
      if (result.workItemTypes.length > 0) {
        parts.push(`Detected work item types: ${result.workItemTypes.join(', ')}`);
      }
      
      if (Object.keys(result.fields).length > 0) {
        parts.push(`Identified fields: ${Object.keys(result.fields).join(', ')}`);
      }
      
      if (parts.length === 0) {
        parts.push('Using basic text search');
      }
      
      return parts.join('; ');
    }
    
    extractWorkItemTypesFromQuery(userInput) {
      // Implementation for extracting work item types
      return [];
    }
    
    extractFieldsFromQuery(userInput) {
      // Implementation for extracting fields
      return {};
    }
    
    extractEntitiesFromQuery(userInput, context) {
      // Implementation for extracting entities
      return {};
    }
    
    extractCurrentUser() {
      // Try to extract current user from DOM
      try {
        const userElement = document.querySelector('[data-testid="user-menu-button"]') ||
                           document.querySelector('.user-display-name') ||
                           document.querySelector('.identity-picker-resolved-user');
        
        if (userElement) {
          return userElement.textContent?.trim() || userElement.title;
        }
      } catch (error) {
        console.warn('Could not extract current user:', error);
      }
      
      return null;
    }
    
    /**
     * Create error result
     */
    createErrorResult(message, processingTime = 0) {
      return {
        success: false,
        error: message,
        confidence: 0,
        method: 'error',
        processingTime,
        url: null
      };
    }
    
    /**
     * Get processing statistics
     */
    getStats() {
      return {
        isInitialized: this.isInitialized,
        hasMetadata: !!this.metadata,
        isOpenAIConfigured: this.openaiClient.isConfigured(),
        metadataStats: this.metadata ? {
          organization: this.metadata.organization,
          project: this.metadata.project,
          workItemTypesCount: Object.keys(this.metadata.workItemTypes).length,
          fieldsCount: Object.keys(this.metadata.fields).length,
          teamMembersCount: this.metadata.teamMembers.length,
          isFallback: this.metadata.isFallback
        } : null
      };
    }
  }
  
  // Make the class globally available
  window.ADONaturale_EnhancedNLProcessor = EnhancedNLProcessor;
  
})(); 