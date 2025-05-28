/**
 * ADO Naturale - Query Executor
 * Handles URL-based query execution in Azure DevOps interface
 */

(function() {
  'use strict';
  
  /**
   * Query Executor class
   */
  class QueryExecutor {
    constructor() {
      this.lastExecutedQueryUrl = null;
    }
    
    /**
     * Execute a query by navigating to the generated URL
     */
    async executeQuery(queryUrl) {
      console.log('ADO Naturale: Executing query via URL:', queryUrl);
      
      try {
        // Store the last executed query URL
        this.lastExecutedQueryUrl = queryUrl;
        
        // Navigate to the query URL
        window.location.href = queryUrl;
        
        console.log('ADO Naturale: Query URL navigation initiated');
        return true;
      } catch (error) {
        console.error('ADO Naturale: Error executing query via URL:', error);
        throw error;
      }
    }
    
    /**
     * Check if the current page is a result of a query execution
     */
    isQueryResultPage() {
      const url = window.location.href;
      return url.includes('_queries/query') && url.includes('wiql=');
    }
    
    /**
     * Extract WIQL from the current URL
     */
    extractWiqlFromUrl() {
      const url = window.location.href;
      const match = url.match(/wiql=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
      return null;
    }
    
    /**
     * Create a shareable link for the current query
     */
    createShareableLink() {
      return window.location.href;
    }
    
    /**
     * Open a query in the WIQL editor for manual adjustments
     */
    openInWiqlEditor() {
      const wiql = this.extractWiqlFromUrl();
      if (!wiql) {
        console.error('ADO Naturale: No WIQL found in current URL');
        return false;
      }
      
      // Construct WIQL editor URL
      const baseUrl = window.location.href.split('_queries')[0];
      const wiqlEditorUrl = `${baseUrl}_queries/wiql?wiql=${encodeURIComponent(wiql)}`;
      
      // Open in new tab
      window.open(wiqlEditorUrl, '_blank');
      return true;
    }
    
    /**
     * Save the current query
     */
    async saveQuery(name, folderId = null) {
      // This would ideally use ADO's API to save the query
      // For now, we'll just open the save dialog in the UI
      const saveButton = document.querySelector('.save-query-button') || 
                         document.querySelector('[aria-label="Save query"]') ||
                         document.querySelector('[data-testid="save-query-button"]');
      
      if (saveButton) {
        saveButton.click();
        console.log('ADO Naturale: Opened save query dialog');
        return true;
      }
      
      console.error('ADO Naturale: Could not find save button');
      return false;
    }
  }
  
  // Export to global scope
  window.ADONaturale = window.ADONaturale || {};
  window.ADONaturale.QueryExecutor = new QueryExecutor();
  
})();
