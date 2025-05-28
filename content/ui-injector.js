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
      this.feedbackDisplay = null;
      this.feedbackContent = null;
    }
    
    /**
     * Inject the natural language interface into the page
     */
    injectInterface(context) {
      currentContext = context;
      
      try {
        // Remove any existing interface
        this.removeInterface();
        
        // Create the interface
        this.nlInputContainer = this.createNaturalLanguageInterface();
        
        // Find injection point and inject
        const targetElement = this.findInjectionPoint();
        if (targetElement) {
          this.injectAtLocation(targetElement);
          this.attachEventListeners();
          console.log('ADO Naturale: Natural language interface injected successfully');
        } else {
          console.warn('ADO Naturale: Could not find suitable injection point');
        }
      } catch (error) {
        console.error('ADO Naturale: Error injecting interface:', error);
      }
    }
    
    /**
     * Find the injection point for the interface
     */
    findInjectionPoint() {
      // For bottom-fixed layout, we want to inject directly into the body
      console.log('ADO Naturale: Using body as injection point for bottom bar');
      return document.body;
    }
    
    /**
     * Create the natural language interface
     */
    createNaturalLanguageInterface() {
      const container = document.createElement('div');
      container.className = 'ado-naturale-container';
      container.innerHTML = `
        <div class="ado-naturale-header">
          <span class="ado-naturale-title">🧠 Natural Language Query</span>
          <button class="ado-naturale-toggle" title="Toggle interface">
            <span class="toggle-icon">−</span>
          </button>
        </div>
        <div class="ado-naturale-content">
          <div class="ado-naturale-input-section">
            <textarea 
              class="ado-naturale-input" 
              placeholder="Enter your query in natural language (e.g., 'Show me my bugs', 'High priority user stories assigned to me')"
              rows="2"
            ></textarea>
            <button class="ado-naturale-submit">Query</button>
          </div>
          <div class="ado-naturale-feedback" style="display: none;">
            <div class="feedback-content"></div>
          </div>
          <div class="ado-naturale-suggestions">
            <div class="suggestion-item" data-query="Show me my bugs">My bugs</div>
            <div class="suggestion-item" data-query="Items assigned to me">Assigned to me</div>
            <div class="suggestion-item" data-query="High priority user stories">High priority stories</div>
            <div class="suggestion-item" data-query="Work items I created">Created by me</div>
          </div>
          <div class="ado-naturale-loading" style="display: none;">
            <div class="loading-spinner"></div>
            <span>Processing query...</span>
          </div>
          <div class="ado-naturale-error" style="display: none;"></div>
        </div>
      `;
      
      // Store references to key elements
      this.nlInput = container.querySelector('.ado-naturale-input');
      this.submitButton = container.querySelector('.ado-naturale-submit');
      this.loadingIndicator = container.querySelector('.ado-naturale-loading');
      this.errorDisplay = container.querySelector('.ado-naturale-error');
      this.suggestionsContainer = container.querySelector('.ado-naturale-suggestions');
      this.feedbackDisplay = container.querySelector('.ado-naturale-feedback');
      this.feedbackContent = container.querySelector('.feedback-content');
      
      injectedElements.push(container);
      
      return container;
    }
    
    /**
     * Inject the interface at the specified location
     */
    injectAtLocation(targetElement) {
      // For bottom-fixed layout, always append to the body
      targetElement.appendChild(this.nlInputContainer);
      
      // Initialize in minimized state
      if (!isInterfaceVisible) {
        this.nlInputContainer.classList.add('minimized');
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
        
        // Use enhanced NL processor for metadata-aware AI processing
        let processor;
        if (window.ADONaturale_EnhancedNLProcessor) {
          processor = new window.ADONaturale_EnhancedNLProcessor();
          console.log('ADO Naturale: Using Enhanced NL Processor');
        } else if (window.ADONaturale_NLProcessor) {
          processor = new window.ADONaturale_NLProcessor();
          console.log('ADO Naturale: Using Standard NL Processor');
        } else {
          throw new Error('No natural language processor available');
        }
        
        // Process the query
        const result = await processor.processQuery(query, currentContext);
        
        if (result.success && result.url) {
          console.log('ADO Naturale: Query processed successfully', {
            method: result.method,
            confidence: result.confidence,
            reasoning: result.reasoning,
            processingTime: result.processingTime
          });
          
          // Execute the generated query URL
          await this.executeQuery(result.url);
          
          // Save to history
          this.saveQueryToHistory(query, result.url, result);
          
          // Show success feedback
          this.showSuccessFeedback(result);
          
          // Clear input
          this.nlInput.value = '';
          this.autoResizeTextarea();
        } else {
          const errorMessage = result.error || 'Failed to process query';
          console.warn('ADO Naturale: Query processing failed:', errorMessage);
          this.showError(errorMessage);
        }
      } catch (error) {
        console.error('ADO Naturale: Error processing query:', error);
        this.showError('An error occurred while processing your query');
      } finally {
        this.showLoading(false);
      }
    }
    
    /**
     * Execute query by navigating to the generated URL
     */
    async executeQuery(queryUrl) {
      try {
        // Use the query executor to navigate to the URL
        if (typeof window.ADONaturale !== 'undefined' && window.ADONaturale.QueryExecutor) {
          await window.ADONaturale.QueryExecutor.executeQuery(queryUrl);
        } else {
          throw new Error('Query executor not available');
        }
      } catch (error) {
        console.error('ADO Naturale: Error executing query URL:', error);
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
    saveQueryToHistory(naturalLanguage, queryUrl, result) {
      this.sendMessageToBackground({
        action: 'saveQueryHistory',
        data: {
          naturalLanguage,
          queryUrl,
          context: currentContext,
          result: result
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
      const toggleIcon = this.nlInputContainer.querySelector('.toggle-icon');
      
      isInterfaceVisible = !isInterfaceVisible;
      
      if (isInterfaceVisible) {
        this.nlInputContainer.classList.remove('minimized');
        toggleIcon.textContent = '−';
      } else {
        this.nlInputContainer.classList.add('minimized');
        toggleIcon.textContent = '+';
      }
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
    
    /**
     * Show success feedback with processing information
     */
    showSuccessFeedback(result) {
      if (!this.feedbackDisplay || !this.feedbackContent) return;
      
      const feedbackHtml = `
        <div class="success-feedback">
          <div class="feedback-header">
            <span class="success-icon">✓</span>
            <span class="feedback-title">Query processed successfully</span>
          </div>
          <div class="feedback-details">
            <div class="feedback-item">
              <strong>Method:</strong> ${this.formatMethod(result.method)}
            </div>
            <div class="feedback-item">
              <strong>Confidence:</strong> ${Math.round((result.confidence || 0) * 100)}%
            </div>
            ${result.reasoning ? `
              <div class="feedback-item">
                <strong>Analysis:</strong> ${result.reasoning}
              </div>
            ` : ''}
            ${result.processingTime ? `
              <div class="feedback-item">
                <strong>Processing time:</strong> ${result.processingTime}ms
              </div>
            ` : ''}
          </div>
        </div>
      `;
      
      this.feedbackContent.innerHTML = feedbackHtml;
      this.feedbackDisplay.style.display = 'block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (this.feedbackDisplay) {
          this.feedbackDisplay.style.display = 'none';
        }
      }, 5000);
    }
    
    /**
     * Format processing method for display
     */
    formatMethod(method) {
      const methodNames = {
        'azure-openai': 'Azure OpenAI',
        'enhanced-patterns': 'Enhanced Pattern Matching',
        'pattern-matching': 'Pattern Matching',
        'basic-fallback': 'Basic Fallback'
      };
      
      return methodNames[method] || method;
    }
  }
  
  // Create global instance
  window.ADONaturale_UIInjector = new UIInjector();
  
})(); 