/**
 * ADO Naturale - URL Generator
 * Converts processed natural language into Azure DevOps query URLs
 */

(function() {
  'use strict';
  
  /**
   * URL Generator class
   */
  class URLGenerator {
    constructor() {
      // Remove hard-coded templates since we'll build URLs dynamically
    }
    
    /**
     * Build query URL based on the hosting environment
     */
    buildQueryUrl(organization, project, currentUrl) {
      if (currentUrl.includes('dev.azure.com')) {
        // dev.azure.com format: https://dev.azure.com/organization/project/_queries/query/
        return `https://dev.azure.com/${organization}/${project}/_queries/query/`;
      } else if (currentUrl.includes('.visualstudio.com')) {
        // visualstudio.com format: https://organization.visualstudio.com/project/_queries/query/
        return `https://${organization}.visualstudio.com/${project}/_queries/query/`;
      }
      throw new Error('Unsupported ADO hosting environment');
    }
    
    /**
     * Generate a query URL from processed natural language
     */
    generateQueryUrl(processedQuery, context = {}) {
      console.log('Generating query URL from processed query:', processedQuery);
      
      try {
        // Create WIQL
        const wiql = this.generateWIQL(processedQuery, context);
        
        // Encode WIQL for URL
        const encodedWiql = encodeURIComponent(wiql);
        
        // Build the URL base using current context
        const baseUrl = this.buildQueryUrl(
          context.organization, 
          context.project, 
          context.url || window.location.href
        );
        
        // Add the encoded WIQL
        const fullUrl = `${baseUrl}?wiql=${encodedWiql}`;
        
        console.log('Generated query URL:', fullUrl);
        return fullUrl;
      } catch (error) {
        console.error('Error generating query URL:', error);
        throw error;
      }
    }
    
    /**
     * Generate WIQL query from processed natural language
     */
    generateWIQL(processedQuery, context = {}) {
      console.log('Generating WIQL for URL from processed query:', processedQuery);
      
      try {
        // Build SELECT clause
        const fields = this.determineSelectFields(processedQuery);
        const selectClause = `SELECT ${fields.join(', ')}`;
        
        // Build FROM clause
        const fromClause = 'FROM WorkItems';
        
        // Build WHERE clause
        const whereClause = this.buildWhereClause(processedQuery, context);
        
        // Build ORDER BY clause
        const orderByClause = this.buildOrderByClause(processedQuery);
        
        // Construct full WIQL
        let wiql = `${selectClause} ${fromClause}`;
        
        if (whereClause) {
          wiql += ` WHERE ${whereClause}`;
        }
        
        if (orderByClause) {
          wiql += ` ORDER BY ${orderByClause}`;
        }
        
        console.log('Generated WIQL:', wiql);
        return wiql;
      } catch (error) {
        console.error('Error generating WIQL:', error);
        throw error;
      }
    }
    
    /**
     * Determine fields for SELECT clause
     */
    determineSelectFields(processedQuery) {
      const defaultFields = [
        '[System.Id]',
        '[System.Title]',
        '[System.WorkItemType]',
        '[System.State]',
        '[System.AssignedTo]',
        '[System.CreatedDate]',
        '[System.ChangedDate]'
      ];
      
      const fields = [...defaultFields];
      
      // Add additional fields based on query
      if (processedQuery.filters.priority && processedQuery.filters.priority.length > 0) {
        fields.push('[Microsoft.VSTS.Common.Priority]');
      }
      
      // Add iteration path for sprint-related queries
      if (processedQuery.timeRange && processedQuery.timeRange.type === 'thisSprint') {
        fields.push('[System.IterationPath]');
      }
      
      // Add specific fields for work item types
      if (processedQuery.workItemTypes && processedQuery.workItemTypes.includes('Bug')) {
        fields.push('[Microsoft.VSTS.Common.Severity]');
      }
      
      if (processedQuery.workItemTypes && processedQuery.workItemTypes.includes('User Story')) {
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
      if (processedQuery.workItemTypes && processedQuery.workItemTypes.length > 0) {
        const typeConditions = processedQuery.workItemTypes.map(type => 
          `[System.WorkItemType] = '${type}'`
        );
        conditions.push(`(${typeConditions.join(' OR ')})`);
      }
      
      // Assignment filters
      if (processedQuery.filters.assignedTo) {
        conditions.push(`[System.AssignedTo] = ${processedQuery.filters.assignedTo}`);
      }
      
      // Status filters
      if (processedQuery.filters.state && processedQuery.filters.state.length > 0) {
        const stateConditions = processedQuery.filters.state.map(state => 
          `[System.State] = '${state}'`
        );
        conditions.push(`(${stateConditions.join(' OR ')})`);
      }
      
      // Priority filters
      if (processedQuery.filters.priority && processedQuery.filters.priority.length > 0) {
        const priorityConditions = processedQuery.filters.priority.map(priority => 
          `[Microsoft.VSTS.Common.Priority] = ${priority}`
        );
        conditions.push(`(${priorityConditions.join(' OR ')})`);
      }
      
      // Time range filters
      if (processedQuery.timeRange) {
        const timeCondition = this.buildTimeRangeCondition(processedQuery.timeRange);
        if (timeCondition) {
          conditions.push(timeCondition);
        }
      }
      
      // Text search
      if (processedQuery.textSearch) {
        conditions.push(`[System.Title] CONTAINS '${processedQuery.textSearch.replace(/'/g, "''")}'`);
      }
      
      // Return the combined WHERE clause
      return conditions.join(' AND ');
    }
    
    /**
     * Build time range condition for WHERE clause
     */
    buildTimeRangeCondition(timeRange) {
      if (!timeRange || !timeRange.type) return null;
      
      switch (timeRange.type) {
        case 'today':
          return "[System.ChangedDate] >= @Today";
        case 'yesterday':
          return "[System.ChangedDate] >= @Today-1 AND [System.ChangedDate] < @Today";
        case 'thisWeek':
          return "[System.ChangedDate] >= @StartOfWeek AND [System.ChangedDate] <= @EndOfWeek";
        case 'lastWeek':
          return "[System.ChangedDate] >= @StartOfWeek-7 AND [System.ChangedDate] <= @EndOfWeek-7";
        case 'thisMonth':
          return "[System.ChangedDate] >= @StartOfMonth AND [System.ChangedDate] <= @EndOfMonth";
        case 'lastMonth':
          return "[System.ChangedDate] >= @StartOfMonth-1 AND [System.ChangedDate] <= @EndOfMonth-1";
        case 'thisSprint':
          return "[System.IterationPath] = @CurrentIteration";
        case 'lastSprint':
          return "[System.IterationPath] = @CurrentIteration-1";
        default:
          return null;
      }
    }
    
    /**
     * Build ORDER BY clause
     */
    buildOrderByClause(processedQuery) {
      if (!processedQuery.sortBy) return null;
      
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
      
      return `${field} ${direction}`;
    }
  }
  
  // Export to global scope
  window.ADONaturale = window.ADONaturale || {};
  window.ADONaturale.URLGenerator = new URLGenerator();
  
})();
