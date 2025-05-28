/**
 * ADO Naturale - WIQL Generator
 * Converts processed natural language into valid WIQL queries
 */

(function() {
  'use strict';
  
  /**
   * WIQL Generator class
   */
  class WIQLGenerator {
    constructor() {
      this.defaultFields = [
        '[System.Id]',
        '[System.Title]',
        '[System.WorkItemType]',
        '[System.State]',
        '[System.AssignedTo]',
        '[System.CreatedDate]',
        '[System.ChangedDate]'
      ];
    }
    
    /**
     * Generate WIQL query from processed natural language
     */
    generateWIQL(processedQuery, context = {}) {
      console.log('Generating WIQL from processed query:', processedQuery);
      
      try {
        const query = {
          select: this.buildSelectClause(processedQuery),
          from: 'WorkItems',
          where: this.buildWhereClause(processedQuery, context),
          orderBy: this.buildOrderByClause(processedQuery)
        };
        
        const wiql = this.assembleQuery(query);
        console.log('Generated WIQL:', wiql);
        
        return wiql;
      } catch (error) {
        console.error('Error generating WIQL:', error);
        throw new Error(`Failed to generate WIQL: ${error.message}`);
      }
    }
    
    /**
     * Build SELECT clause
     */
    buildSelectClause(processedQuery) {
      let fields = [...this.defaultFields];
      
      // Add specific fields based on query intent
      if (processedQuery.intent === 'count') {
        return ['COUNT()'];
      }
      
      // Add priority field if priority is mentioned
      if (processedQuery.filters.priority.length > 0) {
        fields.push('[Microsoft.VSTS.Common.Priority]');
      }
      
      // Add iteration path for sprint-related queries
      if (processedQuery.timeRange.type === 'thisSprint') {
        fields.push('[System.IterationPath]');
      }
      
      // Add specific fields for work item types
      if (processedQuery.workItemTypes.includes('Bug')) {
        fields.push('[Microsoft.VSTS.Common.Severity]');
      }
      
      if (processedQuery.workItemTypes.includes('User Story')) {
        fields.push('[Microsoft.VSTS.Common.StoryPoints]');
      }
      
      // Remove duplicates
      return [...new Set(fields)];
    }
    
    /**
     * Build WHERE clause
     */
    buildWhereClause(processedQuery, context) {
      const conditions = [];
      
      // Work item type filter
      if (processedQuery.workItemTypes.length > 0) {
        const typeConditions = processedQuery.workItemTypes.map(type => 
          `[System.WorkItemType] = '${type}'`
        );
        conditions.push(`(${typeConditions.join(' OR ')})`);
      }
      
      // Assignment filters
      if (processedQuery.filters.assignedTo) {
        conditions.push(`[System.AssignedTo] = ${processedQuery.filters.assignedTo}`);
      }
      
      if (processedQuery.filters.createdBy) {
        conditions.push(`[System.CreatedBy] = ${processedQuery.filters.createdBy}`);
      }
      
      // State filters
      if (processedQuery.filters.state.length > 0) {
        const stateConditions = processedQuery.filters.state.map(state => 
          `[System.State] = '${state}'`
        );
        conditions.push(`(${stateConditions.join(' OR ')})`);
      }
      
      // Priority filters
      if (processedQuery.filters.priority.length > 0) {
        const priorityConditions = processedQuery.filters.priority.map(priority => 
          `[Microsoft.VSTS.Common.Priority] = ${priority}`
        );
        conditions.push(`(${priorityConditions.join(' OR ')})`);
      }
      
      // Time range filters
      const timeCondition = this.buildTimeCondition(processedQuery.timeRange);
      if (timeCondition) {
        conditions.push(timeCondition);
      }
      
      // Entity-based filters
      if (processedQuery.entities.workItemIds.length > 0) {
        const idConditions = processedQuery.entities.workItemIds.map(id => 
          `[System.Id] = ${id}`
        );
        conditions.push(`(${idConditions.join(' OR ')})`);
      }
      
      // User mention filters
      if (processedQuery.entities.users.length > 0) {
        const userConditions = processedQuery.entities.users.map(user => 
          `[System.AssignedTo] CONTAINS '${user}'`
        );
        conditions.push(`(${userConditions.join(' OR ')})`);
      }
      
      // Text search fallback
      if (conditions.length === 0 && processedQuery.originalQuery) {
        const searchTerms = this.extractSearchTerms(processedQuery.originalQuery);
        if (searchTerms.length > 0) {
          const searchConditions = searchTerms.map(term => 
            `[System.Title] CONTAINS '${this.escapeString(term)}'`
          );
          conditions.push(`(${searchConditions.join(' OR ')})`);
        }
      }
      
      return conditions;
    }
    
    /**
     * Build time-based conditions
     */
    buildTimeCondition(timeRange) {
      if (!timeRange.type) {
        return null;
      }
      
      switch (timeRange.type) {
        case 'today':
          return '[System.CreatedDate] >= @Today';
          
        case 'thisWeek':
          return '[System.CreatedDate] >= @Today - 7';
          
        case 'lastWeek':
          return '[System.CreatedDate] >= @Today - 14 AND [System.CreatedDate] < @Today - 7';
          
        case 'thisMonth':
          return '[System.CreatedDate] >= @Today - 30';
          
        case 'thisSprint':
          return '[System.IterationPath] = @CurrentIteration';
          
        default:
          return null;
      }
    }
    
    /**
     * Build ORDER BY clause
     */
    buildOrderByClause(processedQuery) {
      // Default ordering
      let orderBy = '[System.ChangedDate] DESC';
      
      // Specific ordering based on intent
      if (processedQuery.intent === 'search') {
        if (processedQuery.workItemTypes.includes('Bug')) {
          orderBy = '[Microsoft.VSTS.Common.Priority], [System.CreatedDate] DESC';
        } else if (processedQuery.filters.priority.length > 0) {
          orderBy = '[Microsoft.VSTS.Common.Priority], [System.CreatedDate] DESC';
        }
      }
      
      // Time-based queries should order by creation date
      if (processedQuery.timeRange.type) {
        orderBy = '[System.CreatedDate] DESC';
      }
      
      return orderBy;
    }
    
    /**
     * Assemble the final WIQL query
     */
    assembleQuery(queryParts) {
      let wiql = `SELECT ${queryParts.select.join(', ')}\nFROM ${queryParts.from}`;
      
      if (queryParts.where.length > 0) {
        wiql += `\nWHERE ${queryParts.where.join(' AND ')}`;
      }
      
      if (queryParts.orderBy) {
        wiql += `\nORDER BY ${queryParts.orderBy}`;
      }
      
      return wiql;
    }
    
    /**
     * Extract search terms from original query
     */
    extractSearchTerms(query) {
      // Remove common words and extract meaningful terms
      const commonWords = [
        'show', 'me', 'my', 'get', 'find', 'list', 'all', 'the', 'a', 'an',
        'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
        'after', 'above', 'below', 'between', 'among', 'this', 'that',
        'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'can', 'work', 'items', 'item'
      ];
      
      const words = query.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => 
          word.length > 2 && 
          !commonWords.includes(word) &&
          !/^\d+$/.test(word)
        );
      
      return [...new Set(words)];
    }
    
    /**
     * Escape string for WIQL
     */
    escapeString(str) {
      return str.replace(/'/g, "''");
    }
    
    /**
     * Generate WIQL for common query patterns
     */
    generateCommonQuery(pattern, context = {}) {
      const patterns = {
        myBugs: `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.CreatedDate]
FROM WorkItems 
WHERE [System.WorkItemType] = 'Bug' 
AND [System.AssignedTo] = @Me
ORDER BY [System.CreatedDate] DESC`,

        assignedToMe: `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.AssignedTo]
FROM WorkItems 
WHERE [System.AssignedTo] = @Me
ORDER BY [System.ChangedDate] DESC`,

        createdByMe: `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.CreatedBy]
FROM WorkItems 
WHERE [System.CreatedBy] = @Me
ORDER BY [System.CreatedDate] DESC`,

        userStories: `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.IterationPath]
FROM WorkItems 
WHERE [System.WorkItemType] = 'User Story'
ORDER BY [System.CreatedDate] DESC`,

        highPriority: `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [Microsoft.VSTS.Common.Priority]
FROM WorkItems 
WHERE [Microsoft.VSTS.Common.Priority] <= 2
ORDER BY [Microsoft.VSTS.Common.Priority], [System.CreatedDate] DESC`,

        thisWeek: `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.CreatedDate]
FROM WorkItems 
WHERE [System.CreatedDate] >= @Today - 7
ORDER BY [System.CreatedDate] DESC`,

        currentSprint: `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.IterationPath]
FROM WorkItems 
WHERE [System.IterationPath] = @CurrentIteration
ORDER BY [System.ChangedDate] DESC`
      };
      
      return patterns[pattern] || null;
    }
    
    /**
     * Validate generated WIQL
     */
    validateWIQL(wiql) {
      const errors = [];
      
      if (!wiql || !wiql.trim()) {
        errors.push('Generated WIQL is empty');
        return errors;
      }
      
      const upperWiql = wiql.toUpperCase();
      
      // Basic structure validation
      if (!upperWiql.includes('SELECT')) {
        errors.push('Missing SELECT clause');
      }
      
      if (!upperWiql.includes('FROM WORKITEMS')) {
        errors.push('Missing FROM WorkItems clause');
      }
      
      // Field name validation
      const fieldPattern = /\[([^\]]+)\]/g;
      const fields = [];
      let match;
      
      while ((match = fieldPattern.exec(wiql)) !== null) {
        fields.push(match[1]);
      }
      
      // Check for common field name issues
      fields.forEach(field => {
        if (field.includes(' ') && !field.startsWith('System.') && !field.startsWith('Microsoft.')) {
          errors.push(`Potentially invalid field name: [${field}]`);
        }
      });
      
      // Check for balanced brackets and quotes
      const openBrackets = (wiql.match(/\[/g) || []).length;
      const closeBrackets = (wiql.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push('Unbalanced square brackets');
      }
      
      const singleQuotes = (wiql.match(/'/g) || []).length;
      if (singleQuotes % 2 !== 0) {
        errors.push('Unbalanced single quotes');
      }
      
      return errors;
    }
    
    /**
     * Get field suggestions for auto-completion
     */
    getFieldSuggestions() {
      return {
        system: [
          'System.Id',
          'System.Title',
          'System.WorkItemType',
          'System.State',
          'System.AssignedTo',
          'System.CreatedBy',
          'System.CreatedDate',
          'System.ChangedDate',
          'System.IterationPath',
          'System.AreaPath',
          'System.Tags'
        ],
        common: [
          'Microsoft.VSTS.Common.Priority',
          'Microsoft.VSTS.Common.Severity',
          'Microsoft.VSTS.Common.StoryPoints',
          'Microsoft.VSTS.Common.ValueArea',
          'Microsoft.VSTS.Common.Risk'
        ],
        scheduling: [
          'Microsoft.VSTS.Scheduling.StartDate',
          'Microsoft.VSTS.Scheduling.FinishDate',
          'Microsoft.VSTS.Scheduling.OriginalEstimate',
          'Microsoft.VSTS.Scheduling.RemainingWork',
          'Microsoft.VSTS.Scheduling.CompletedWork'
        ]
      };
    }
  }
  
  // Create global instance
  window.ADONaturale_WIQLGenerator = new WIQLGenerator();
  
})(); 