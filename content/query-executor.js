/**
 * ADO Naturale - Query Executor
 * Handles WIQL query injection and execution in Azure DevOps interface
 */

(function() {
  'use strict';
  
  /**
   * Query Executor class
   */
  class QueryExecutor {
    constructor() {
      this.queryEditor = null;
      this.executeButton = null;
      this.lastExecutedQuery = null;
    }
    
    /**
     * Execute a WIQL query in the ADO interface
     */
    async executeQuery(wiql) {
      console.log('ADO Naturale: Executing WIQL query:', wiql);
      
      try {
        // Find and prepare the query editor
        await this.prepareQueryEditor();
        
        // Inject the WIQL into the editor
        await this.injectWIQL(wiql);
        
        // Execute the query
        await this.triggerQueryExecution();
        
        this.lastExecutedQuery = wiql;
        console.log('ADO Naturale: Query executed successfully');
        
      } catch (error) {
        console.error('ADO Naturale: Error executing query:', error);
        throw error;
      }
    }
    
    /**
     * Find and prepare the query editor
     */
    async prepareQueryEditor() {
      // Try to find the query editor using various selectors
      const editorSelectors = [
        '.monaco-editor textarea',
        '.query-editor textarea',
        '.wiql-editor textarea',
        '.monaco-editor .view-lines',
        '[data-testid="query-editor"] textarea',
        '.query-text-editor textarea'
      ];
      
      for (const selector of editorSelectors) {
        this.queryEditor = document.querySelector(selector);
        if (this.queryEditor) {
          console.log(`ADO Naturale: Found query editor: ${selector}`);
          break;
        }
      }
      
      // If no textarea found, try Monaco editor approach
      if (!this.queryEditor) {
        await this.handleMonacoEditor();
      }
      
      if (!this.queryEditor) {
        throw new Error('Could not find query editor');
      }
      
      // Find the execute button
      this.findExecuteButton();
    }
    
    /**
     * Handle Monaco editor (code editor used in ADO)
     */
    async handleMonacoEditor() {
      // Look for Monaco editor instance
      const monacoContainer = document.querySelector('.monaco-editor');
      if (!monacoContainer) {
        return;
      }
      
      // Try to access Monaco editor instance
      if (window.monaco && window.monaco.editor) {
        const editors = window.monaco.editor.getEditors();
        if (editors.length > 0) {
          this.monacoEditor = editors[0];
          console.log('ADO Naturale: Found Monaco editor instance');
          return;
        }
      }
      
      // Fallback: try to find the hidden textarea
      this.queryEditor = monacoContainer.querySelector('textarea');
    }
    
    /**
     * Find the execute/run query button
     */
    findExecuteButton() {
      const buttonSelectors = [
        '[aria-label*="Run query"]',
        '[title*="Run query"]',
        '.query-run-button',
        '.execute-query-button',
        'button[data-testid*="run"]',
        'button[data-testid*="execute"]',
        '.toolbar button:first-child',
        '.query-toolbar button:first-child'
      ];
      
      for (const selector of buttonSelectors) {
        const button = document.querySelector(selector);
        if (button && (
          button.textContent.toLowerCase().includes('run') ||
          button.textContent.toLowerCase().includes('execute') ||
          button.getAttribute('aria-label')?.toLowerCase().includes('run') ||
          button.getAttribute('title')?.toLowerCase().includes('run')
        )) {
          this.executeButton = button;
          console.log(`ADO Naturale: Found execute button: ${selector}`);
          break;
        }
      }
      
      if (!this.executeButton) {
        console.warn('ADO Naturale: Could not find execute button');
      }
    }
    
    /**
     * Inject WIQL into the query editor
     */
    async injectWIQL(wiql) {
      if (this.monacoEditor) {
        // Use Monaco editor API
        this.monacoEditor.setValue(wiql);
        this.monacoEditor.focus();
      } else if (this.queryEditor) {
        // Use standard textarea approach
        this.queryEditor.focus();
        this.queryEditor.value = wiql;
        
        // Trigger input events to notify ADO of the change
        this.triggerInputEvents(this.queryEditor, wiql);
      } else {
        throw new Error('No query editor available for WIQL injection');
      }
      
      // Wait a moment for the UI to update
      await this.sleep(500);
    }
    
    /**
     * Trigger input events to notify ADO of text changes
     */
    triggerInputEvents(element, value) {
      // Clear existing content
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Set new content
      element.value = value;
      
      // Trigger various events that ADO might be listening for
      const events = ['input', 'change', 'keyup', 'paste'];
      events.forEach(eventType => {
        element.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
      
      // Trigger keyboard events for good measure
      element.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter', 
        bubbles: true 
      }));
    }
    
    /**
     * Trigger query execution
     */
    async triggerQueryExecution() {
      if (this.executeButton) {
        // Click the execute button
        this.executeButton.click();
        console.log('ADO Naturale: Clicked execute button');
      } else {
        // Try alternative execution methods
        await this.tryAlternativeExecution();
      }
      
      // Wait for query to execute
      await this.waitForQueryExecution();
    }
    
    /**
     * Try alternative methods to execute the query
     */
    async tryAlternativeExecution() {
      // Try keyboard shortcut (Ctrl+Enter or F5)
      if (this.queryEditor || this.monacoEditor) {
        const target = this.monacoEditor ? 
          document.querySelector('.monaco-editor') : 
          this.queryEditor;
        
        if (target) {
          target.focus();
          
          // Try Ctrl+Enter
          target.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            ctrlKey: true,
            bubbles: true
          }));
          
          await this.sleep(100);
          
          // Try F5
          target.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'F5',
            bubbles: true
          }));
          
          console.log('ADO Naturale: Tried keyboard shortcuts for execution');
        }
      }
    }
    
    /**
     * Wait for query execution to complete
     */
    async waitForQueryExecution() {
      const maxWaitTime = 10000; // 10 seconds
      const checkInterval = 500; // 500ms
      let waitTime = 0;
      
      return new Promise((resolve) => {
        const checkExecution = () => {
          // Look for loading indicators
          const loadingIndicators = document.querySelectorAll(
            '.loading, .spinner, [aria-label*="loading"], .progress-indicator'
          );
          
          const isLoading = Array.from(loadingIndicators).some(indicator => 
            indicator.offsetParent !== null && 
            !indicator.hidden
          );
          
          if (!isLoading || waitTime >= maxWaitTime) {
            resolve();
            return;
          }
          
          waitTime += checkInterval;
          setTimeout(checkExecution, checkInterval);
        };
        
        // Start checking after a brief delay
        setTimeout(checkExecution, checkInterval);
      });
    }
    
    /**
     * Get the current query from the editor
     */
    getCurrentQuery() {
      if (this.monacoEditor) {
        return this.monacoEditor.getValue();
      } else if (this.queryEditor) {
        return this.queryEditor.value;
      }
      return null;
    }
    
    /**
     * Check if query editor is available
     */
    isQueryEditorAvailable() {
      this.prepareQueryEditor().catch(() => {});
      return !!(this.queryEditor || this.monacoEditor);
    }
    
    /**
     * Utility function to sleep/wait
     */
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Reset the executor state
     */
    reset() {
      this.queryEditor = null;
      this.executeButton = null;
      this.monacoEditor = null;
      this.lastExecutedQuery = null;
    }
  }
  
  // Create global instance
  window.ADONaturale_QueryExecutor = new QueryExecutor();
  
  // Expose debug functions
  window.ADONaturale_QueryExecutor.debug = {
    getCurrentQuery: () => window.ADONaturale_QueryExecutor.getCurrentQuery(),
    isEditorAvailable: () => window.ADONaturale_QueryExecutor.isQueryEditorAvailable(),
    getLastQuery: () => window.ADONaturale_QueryExecutor.lastExecutedQuery,
    reset: () => window.ADONaturale_QueryExecutor.reset()
  };
  
})(); 