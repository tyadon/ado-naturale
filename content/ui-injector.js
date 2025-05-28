/**
 * ADO Naturale - UI Injector
 * Injects natural language input interface components into Azure DevOps query pages
 */

(function() {
  'use strict';
  
  // UI state
  let injectedElements = [];
  let isInterfaceVisible = true;
  let currentContext = {};
  
  /**
   * Main UI Injector class
   */
  class UIInjector {
    constructor() {
      this.nlInputContainer = null;
      this.nlInput = null;
      this.submitButton = null;
      this.loadingIndicator = null;
      this.errorDisplay = null;
      this.suggestionsContainer = null;
    }
    
    /**
     * Inject the natural language interface
     */
    injectInterface(context) {
      currentContext = context;
      console.log('ADO Naturale: Injecting UI interface');
      
      try {
        // Find the best location to inject our interface
        const injectionPoint = this.findInjectionPoint();
        if (!injectionPoint) {
          console.warn('ADO Naturale: Could not find suitable injection point');
          return false;
        }
        
        // Create and inject the interface
        this.createNaturalLanguageInterface();
        this.injectAtLocation(injectionPoint);
        this.attachEventListeners();
        
        console.log('ADO Naturale: UI interface successfully injected');
        return true;
      } catch (error) {
        console.error('ADO Naturale: Error injecting interface:', error);
        return false;
      }
    }
    
    /**
     * Find the best location to inject our interface
     */
    findInjectionPoint() {
      // Try multiple possible locations in order of preference
      const selectors = [
        '.query-editor-container',
        '.query-toolbar',
        '.toolbar-container',
        '.query-view-container',
        '.hub-content',
        '.content-container',
        '[role="main"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          console.log(`ADO Naturale: Found injection point: ${selector}`);
          return element;
        }
      }
      
      // Fallback to body
      return document.body;
    }
    
    /**
     * Create the natural language interface elements
     */
    createNaturalLanguageInterface() {
      // Main container
      this.nlInputContainer = document.createElement('div');
      this.nlInputContainer.className = 'ado-naturale-container';
      this.nlInputContainer.innerHTML = `
        <div class="ado-naturale-header">
          <div class="ado-naturale-title">
            <span class="ado-naturale-icon">🧠</span>
            <span class="ado-naturale-text">Natural Language Query</span>
          </div>
          <button class="ado-naturale-toggle" title="Toggle Natural Language Interface">
            <span class="toggle-icon">−</span>
          </button>
        </div>
        <div class="ado-naturale-content">
          <div class="ado-naturale-input-group">
            <textarea 
              class="ado-naturale-input" 
              placeholder="Ask in plain English: 'Show me my bugs', 'High priority user stories', 'Items created last week'..."
              rows="2"
            ></textarea>
            <button class="ado-naturale-submit" title="Generate and Execute Query">
              <span class="submit-text">Query</span>
              <span class="submit-icon">→</span>
            </button>
          </div>
          <div class="ado-naturale-loading" style="display: none;">
            <div class="loading-spinner"></div>
            <span>Processing your query...</span>
          </div>
          <div class="ado-naturale-error" style="display: none;"></div>
          <div class="ado-naturale-suggestions">
            <div class="suggestions-header">Quick Examples:</div>
            <div class="suggestions-list">
              <button class="suggestion-item" data-query="Show me my bugs">My bugs</button>
              <button class="suggestion-item" data-query="Items assigned to me">Assigned to me</button>
              <button class="suggestion-item" data-query="High priority user stories">High priority stories</button>
              <button class="suggestion-item" data-query="Work items I created">Created by me</button>
            </div>
          </div>
        </div>
      `;
      
      // Get references to key elements
      this.nlInput = this.nlInputContainer.querySelector('.ado-naturale-input');
      this.submitButton = this.nlInputContainer.querySelector('.ado-naturale-submit');
      this.loadingIndicator = this.nlInputContainer.querySelector('.ado-naturale-loading');
      this.errorDisplay = this.nlInputContainer.querySelector('.ado-naturale-error');
      this.suggestionsContainer = this.nlInputContainer.querySelector('.ado-naturale-suggestions');
      
      injectedElements.push(this.nlInputContainer);
    }
    
    /**
     * Inject the interface at the specified location
     */
    injectAtLocation(targetElement) {
      // Insert at the beginning of the target element
      if (targetElement.firstChild) {
        targetElement.insertBefore(this.nlInputContainer, targetElement.firstChild);
      } else {
        targetElement.appendChild(this.nlInputContainer);
      }
    }
    
    /**
     * Attach event listeners to interface elements
     */
    attachEventListeners() {
      // Submit button click
      this.submitButton.addEventListener('click', () => {
        this.handleQuerySubmit();
      });
      
      // Enter key in textarea (Ctrl+Enter or Shift+Enter to submit)
      this.nlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
          e.preventDefault();
          this.handleQuerySubmit();
        }
      });
      
      // Toggle interface visibility
      const toggleButton = this.nlInputContainer.querySelector('.ado-naturale-toggle');
      toggleButton.addEventListener('click', () => {
        this.toggleInterface();
      });
      
      // Suggestion clicks
      const suggestionItems = this.nlInputContainer.querySelectorAll('.suggestion-item');
      suggestionItems.forEach(item => {
        item.addEventListener('click', () => {
          const query = item.getAttribute('data-query');
          this.nlInput.value = query;
          this.handleQuerySubmit();
        });
      });
      
      // Auto-resize textarea
      this.nlInput.addEventListener('input', () => {
        this.autoResizeTextarea();
      });
    }
    
    /**
     * Handle query submission
     */
    async handleQuerySubmit() {
      const query = this.nlInput.value.trim();
      if (!query) {
        this.showError('Please enter a query');
        return;
      }
      
      try {
        this.showLoading(true);
        this.hideError();
        
        // Send query to background script for processing
        const response = await this.sendMessageToBackground({
          action: 'processNaturalLanguage',
          data: {
            query: query,
            context: currentContext
          }
        });
        
        if (response.success) {
          // Execute the generated WIQL query
          await this.executeWIQLQuery(response.wiql);
          
          // Save to history
          this.saveQueryToHistory(query, response.wiql);
          
          // Clear input
          this.nlInput.value = '';
          this.autoResizeTextarea();
        } else {
          this.showError(response.error || 'Failed to process query');
        }
      } catch (error) {
        console.error('ADO Naturale: Error processing query:', error);
        this.showError('An error occurred while processing your query');
      } finally {
        this.showLoading(false);
      }
    }
    
    /**
     * Execute WIQL query in the ADO interface
     */
    async executeWIQLQuery(wiql) {
      try {
        // Use the query executor to run the WIQL
        if (typeof window.ADONaturale_QueryExecutor !== 'undefined') {
          await window.ADONaturale_QueryExecutor.executeQuery(wiql);
        } else {
          throw new Error('Query executor not available');
        }
      } catch (error) {
        console.error('ADO Naturale: Error executing WIQL:', error);
        throw error;
      }
    }
    
    /**
     * Send message to background script
     */
    sendMessageToBackground(message) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response);
          }
        });
      });
    }
    
    /**
     * Save query to history
     */
    saveQueryToHistory(naturalLanguage, wiql) {
      this.sendMessageToBackground({
        action: 'saveQueryHistory',
        data: {
          naturalLanguage,
          wiql,
          context: currentContext
        }
      });
    }
    
    /**
     * Show/hide loading indicator
     */
    showLoading(show) {
      this.loadingIndicator.style.display = show ? 'flex' : 'none';
      this.submitButton.disabled = show;
      this.nlInput.disabled = show;
    }
    
    /**
     * Show error message
     */
    showError(message) {
      this.errorDisplay.textContent = message;
      this.errorDisplay.style.display = 'block';
    }
    
    /**
     * Hide error message
     */
    hideError() {
      this.errorDisplay.style.display = 'none';
    }
    
    /**
     * Toggle interface visibility
     */
    toggleInterface() {
      const content = this.nlInputContainer.querySelector('.ado-naturale-content');
      const toggleIcon = this.nlInputContainer.querySelector('.toggle-icon');
      
      isInterfaceVisible = !isInterfaceVisible;
      content.style.display = isInterfaceVisible ? 'block' : 'none';
      toggleIcon.textContent = isInterfaceVisible ? '−' : '+';
    }
    
    /**
     * Auto-resize textarea based on content
     */
    autoResizeTextarea() {
      this.nlInput.style.height = 'auto';
      this.nlInput.style.height = Math.min(this.nlInput.scrollHeight, 120) + 'px';
    }
    
    /**
     * Remove the interface
     */
    removeInterface() {
      injectedElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      injectedElements = [];
      console.log('ADO Naturale: UI interface removed');
    }
  }
  
  // Create global instance
  window.ADONaturale_UIInjector = new UIInjector();
  
})(); 