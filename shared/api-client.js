/**
 * ADO Naturale - API Client
 * Handles API interactions with Azure DevOps and Azure OpenAI
 */

(function() {
  'use strict';
  
  /**
   * API Client class
   */
  class APIClient {
    constructor() {
      this.baseUrl = this.extractBaseUrl();
      this.organization = this.extractOrganization();
      this.project = this.extractProject();
    }
    
    /**
     * Extract base URL from current page
     */
    extractBaseUrl() {
      const url = window.location.href;
      if (url.includes('dev.azure.com')) {
        return 'https://dev.azure.com';
      } else if (url.includes('.visualstudio.com')) {
        const match = url.match(/https:\/\/(.+?)\.visualstudio\.com/);
        return match ? match[0] : null;
      }
      return null;
    }
    
    /**
     * Extract organization from URL
     */
    extractOrganization() {
      const url = window.location.href;
      if (url.includes('dev.azure.com')) {
        const match = url.match(/dev\.azure\.com\/(.+?)\//);
        return match ? match[1] : null;
      } else if (url.includes('.visualstudio.com')) {
        const match = url.match(/https:\/\/(.+?)\.visualstudio\.com/);
        return match ? match[1] : null;
      }
      return null;
    }
    
    /**
     * Extract project from URL
     */
    extractProject() {
      const url = window.location.href;
      if (url.includes('dev.azure.com')) {
        const match = url.match(/dev\.azure\.com\/.+?\/(.+?)\//);
        return match ? match[1] : null;
      } else if (url.includes('.visualstudio.com')) {
        const match = url.match(/\.visualstudio\.com\/(.+?)\//);
        return match ? match[1] : null;
      }
      return null;
    }
    
    /**
     * Get work item types for the current project
     */
    async getWorkItemTypes() {
      try {
        const url = `${this.baseUrl}/${this.organization}/${this.project}/_apis/wit/workitemtypes?api-version=6.0`;
        const response = await this.makeRequest(url);
        return response.value || [];
      } catch (error) {
        console.warn('Could not fetch work item types:', error);
        return this.getDefaultWorkItemTypes();
      }
    }
    
    /**
     * Get default work item types (fallback)
     */
    getDefaultWorkItemTypes() {
      return [
        { name: 'Bug', referenceName: 'Microsoft.VSTS.WorkItemTypes.Bug' },
        { name: 'User Story', referenceName: 'Microsoft.VSTS.WorkItemTypes.UserStory' },
        { name: 'Task', referenceName: 'Microsoft.VSTS.WorkItemTypes.Task' },
        { name: 'Feature', referenceName: 'Microsoft.VSTS.WorkItemTypes.Feature' },
        { name: 'Epic', referenceName: 'Microsoft.VSTS.WorkItemTypes.Epic' },
        { name: 'Issue', referenceName: 'Microsoft.VSTS.WorkItemTypes.Issue' }
      ];
    }
    
    /**
     * Get current user information
     */
    async getCurrentUser() {
      try {
        const url = `${this.baseUrl}/_apis/profile/profiles/me?api-version=6.0`;
        const response = await this.makeRequest(url);
        return response;
      } catch (error) {
        console.warn('Could not fetch current user:', error);
        return this.extractUserFromDOM();
      }
    }
    
    /**
     * Extract user information from DOM (fallback)
     */
    extractUserFromDOM() {
      try {
        const userElement = document.querySelector('[data-testid="user-menu-button"]') ||
                           document.querySelector('.user-display-name') ||
                           document.querySelector('.identity-picker-resolved-user');
        
        if (userElement) {
          return {
            displayName: userElement.textContent?.trim() || userElement.title,
            emailAddress: userElement.getAttribute('data-email') || null
          };
        }
      } catch (error) {
        console.warn('Could not extract user from DOM:', error);
      }
      
      return { displayName: 'Current User', emailAddress: null };
    }
    
    /**
     * Get project iterations/sprints
     */
    async getIterations() {
      try {
        const url = `${this.baseUrl}/${this.organization}/${this.project}/_apis/work/teamsettings/iterations?api-version=6.0`;
        const response = await this.makeRequest(url);
        return response.value || [];
      } catch (error) {
        console.warn('Could not fetch iterations:', error);
        return [];
      }
    }
    
    /**
     * Execute WIQL query via API
     */
    async executeWIQLQuery(wiql) {
      try {
        const url = `${this.baseUrl}/${this.organization}/${this.project}/_apis/wit/wiql?api-version=6.0`;
        const response = await this.makeRequest(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: wiql })
        });
        return response;
      } catch (error) {
        console.error('Error executing WIQL query:', error);
        throw error;
      }
    }
    
    /**
     * Make HTTP request with proper headers
     */
    async makeRequest(url, options = {}) {
      const defaultOptions = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include' // Include cookies for authentication
      };
      
      const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      };
      
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    }
    
    /**
     * Get project context information
     */
    async getProjectContext() {
      try {
        const [workItemTypes, currentUser, iterations] = await Promise.all([
          this.getWorkItemTypes(),
          this.getCurrentUser(),
          this.getIterations()
        ]);
        
        return {
          organization: this.organization,
          project: this.project,
          baseUrl: this.baseUrl,
          workItemTypes,
          currentUser,
          iterations,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error('Error getting project context:', error);
        return {
          organization: this.organization,
          project: this.project,
          baseUrl: this.baseUrl,
          workItemTypes: this.getDefaultWorkItemTypes(),
          currentUser: this.extractUserFromDOM(),
          iterations: [],
          timestamp: Date.now()
        };
      }
    }
    
    /**
     * Validate WIQL query syntax
     */
    validateWIQL(wiql) {
      const errors = [];
      
      // Basic syntax checks
      if (!wiql.trim()) {
        errors.push('Query cannot be empty');
        return errors;
      }
      
      const upperWiql = wiql.toUpperCase();
      
      // Must have SELECT
      if (!upperWiql.includes('SELECT')) {
        errors.push('Query must include SELECT statement');
      }
      
      // Must have FROM WorkItems
      if (!upperWiql.includes('FROM WORKITEMS')) {
        errors.push('Query must include FROM WorkItems');
      }
      
      // Check for balanced brackets
      const openBrackets = (wiql.match(/\[/g) || []).length;
      const closeBrackets = (wiql.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push('Unbalanced square brackets in field names');
      }
      
      // Check for balanced quotes
      const singleQuotes = (wiql.match(/'/g) || []).length;
      if (singleQuotes % 2 !== 0) {
        errors.push('Unbalanced single quotes in string values');
      }
      
      return errors;
    }
  }
  
  // Create global instance
  window.ADONaturale_APIClient = new APIClient();
  
})(); 