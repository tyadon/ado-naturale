/**
 * ADO Naturale - Enhanced Natural Language Processor
 * Combines metadata awareness with AI-powered query generation
 */

(function() {
  'use strict';
  
  /**
   * Enhanced Natural Language Processor class
   */
  class EnhancedNLProcessor {
    constructor() {
      this.metadataClient = new window.ADONaturale_MetadataClient();
      this.openaiClient = new window.ADONaturale_OpenAIClient();
      this.fallbackProcessor = null;
      
      // Initialize fallback processor if available
      if (window.ADONaturale_NLProcessor) {
        try {
          this.fallbackProcessor = new window.ADONaturale_NLProcessor();
        } catch (error) {
          console.warn('Enhanced NL Processor: Could not initialize fallback processor:', error);
        }
      }
      
      this.metadata = null;
      this.metadataLoadPromise = null;
      this.isInitialized = false;
    }
    
    /**
     * Initialize the processor by loading metadata and OpenAI configuration
     */
    async initialize() {
      if (this.isInitialized) {
        return true;
      }
      
      try {
        console.log('Enhanced NL Processor: Initializing...');
        
        // Load metadata and OpenAI configuration in parallel
        const [metadataLoaded, openaiConfigured] = await Promise.all([
          this.loadMetadata(),
          this.openaiClient.loadConfiguration()
        ]);
        
        this.isInitialized = true;
        
        console.log('Enhanced NL Processor: Initialized', {
          metadataLoaded,
          openaiConfigured,
          hasMetadata: !!this.metadata,
          isOpenAIConfigured: this.openaiClient.isConfigured()
        });
        
        return true;
      } catch (error) {
        console.error('Enhanced NL Processor: Initialization failed:', error);
        this.isInitialized = false;
        return false;
      }
    }
    
    /**
     * Load comprehensive metadata from ADO
     */
    async loadMetadata() {
      if (this.metadataLoadPromise) {
        return this.metadataLoadPromise;
      }
      
      this.metadataLoadPromise = this.metadataClient.getComprehensiveMetadata();
      
      try {
        this.metadata = await this.metadataLoadPromise;
        console.log('Enhanced NL Processor: Metadata loaded', {
          organization: this.metadata.organization,
          project: this.metadata.project,
          workItemTypesCount: Object.keys(this.metadata.workItemTypes).length,
          fieldsCount: Object.keys(this.metadata.fields).length,
          teamMembersCount: this.metadata.teamMembers.length,
          iterationsCount: this.metadata.iterations.length,
          isFallback: this.metadata.isFallback
        });
        
        return true;
      } catch (error) {
        console.error('Enhanced NL Processor: Failed to load metadata:', error);
        this.metadata = null;
        return false;
      }
    }
    
    /**
     * Process natural language query with enhanced capabilities
     */
    async processQuery(userInput, context = {}) {
      console.log('Enhanced NL Processor: Processing query:', userInput);
      console.log('Enhanced NL Processor: Context:', context);
      
      // Ensure we're initialized
      if (!this.isInitialized) {
        console.log('Enhanced NL Processor: Not initialized, initializing now...');
        await this.initialize();
      }
      
      // Validate input
      if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
        console.warn('Enhanced NL Processor: Empty or invalid query');
        return this.createErrorResult('Empty or invalid query');
      }
      
      const startTime = Date.now();
      
      try {
        // Enhance context with metadata
        const enhancedContext = await this.enhanceContext(context);
        console.log('Enhanced NL Processor: Enhanced context prepared');
        
        // Check if AI processing is available and configured
        const isAIConfigured = this.openaiClient.isConfigured();
        const hasMetadata = !!this.metadata;
        
        console.log('Enhanced NL Processor: AI configured:', isAIConfigured);
        console.log('Enhanced NL Processor: Has metadata:', hasMetadata);
        
        // Try AI-powered generation first
        if (isAIConfigured && hasMetadata) {
          console.log('Enhanced NL Processor: Attempting AI processing...');
          try {
            const aiResult = await this.processWithAI(userInput, enhancedContext);
            if (aiResult.success) {
              console.log('Enhanced NL Processor: AI processing successful!');
              aiResult.processingTime = Date.now() - startTime;
              return aiResult;
            } else {
              console.warn('Enhanced NL Processor: AI processing returned unsuccessful result');
            }
          } catch (aiError) {
            console.warn('Enhanced NL Processor: AI processing failed with error:', aiError);
          }
        } else {
          if (!isAIConfigured) {
            console.log('Enhanced NL Processor: Skipping AI processing - not configured');
          }
          if (!hasMetadata) {
            console.log('Enhanced NL Processor: Skipping AI processing - no metadata');
          }
        }
        
        // Fallback to enhanced pattern matching
        console.log('Enhanced NL Processor: Using enhanced pattern matching fallback');
        const patternResult = await this.processWithEnhancedPatterns(userInput, enhancedContext);
        patternResult.processingTime = Date.now() - startTime;
        return patternResult;
        
      } catch (error) {
        console.error('Enhanced NL Processor: Query processing failed:', error);
        return this.createErrorResult(error.message, Date.now() - startTime);
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
      try {
        console.log('Enhanced NL Processor: Starting AI processing for query:', userInput);
        console.log('Enhanced NL Processor: AI client configured:', this.openaiClient.isConfigured());
        console.log('Enhanced NL Processor: Metadata available:', !!this.metadata);
        
        const result = await this.openaiClient.generateQueryUrl(userInput, this.metadata, context);
        
        console.log('Enhanced NL Processor: AI client returned result:', {
          success: result.success,
          method: result.method,
          confidence: result.confidence,
          hasUrl: !!result.url
        });
        
        if (result.success) {
          console.log('Enhanced NL Processor: AI processing completed successfully');
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
        
        console.warn('Enhanced NL Processor: AI processing returned unsuccessful result');
        throw new Error('AI processing failed');
        
      } catch (error) {
        console.error('Enhanced NL Processor: AI processing failed with error:', error);
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