/**
 * ADO Naturale - UI Injector
 * Injects natural language input interface components into Azure DevOps query pages
 */

(function() {
  'use strict';
  
  // Debug utility
  const DEBUG = {
    log: (category, message, data = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `🔍 [UI-Injector][${category}][${timestamp}]`;
      if (data) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
    },
    error: (category, message, error = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `❌ [UI-Injector][${category}][${timestamp}]`;
      if (error) {
        console.error(prefix, message, error);
      } else {
        console.error(prefix, message);
      }
    },
    warn: (category, message, data = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `⚠️ [UI-Injector][${category}][${timestamp}]`;
      if (data) {
        console.warn(prefix, message, data);
      } else {
        console.warn(prefix, message);
      }
    }
  };
  
  // UI state
  let injectedElements = [];
  let isInterfaceVisible = true;
  let currentContext = {};
  
  DEBUG.log('INIT', 'UI Injector script loading');

  /**
   * Main UI Injector class
   */
  class UIInjector {
    constructor() {
      DEBUG.log('CONSTRUCTOR', 'Creating new UIInjector instance');
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
      DEBUG.log('INJECT', 'Starting interface injection', context);
      currentContext = context;
      
      try {
        // Remove any existing interface
        DEBUG.log('INJECT', 'Removing any existing interface');
        this.removeInterface();
        
        // Create the interface
        DEBUG.log('INJECT', 'Creating natural language interface');
        this.nlInputContainer = this.createNaturalLanguageInterface();
        
        // Find injection point and inject
        DEBUG.log('INJECT', 'Finding injection point');
        const targetElement = this.findInjectionPoint();
        if (targetElement) {
          DEBUG.log('INJECT', 'Target element found, injecting interface', {
            targetTag: targetElement.tagName,
            targetClass: targetElement.className
          });
          this.injectAtLocation(targetElement);
          this.attachEventListeners();
          DEBUG.log('INJECT', '✅ Natural language interface injected successfully');
        } else {
          DEBUG.error('INJECT', 'Could not find suitable injection point');
        }
      } catch (error) {
        DEBUG.error('INJECT', 'Error injecting interface', error);
      }
    }
    
    /**
     * Find the injection point for the interface
     */
    findInjectionPoint() {
      // For bottom-fixed layout, we want to inject directly into the body
      DEBUG.log('INJECTION_POINT', 'Using body as injection point for bottom bar');
      return document.body;
    }
    
    /**
     * Create the natural language interface
     */
    createNaturalLanguageInterface() {
      DEBUG.log('CREATE_UI', 'Creating UI elements');
      
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
          <div class="ado-naturale-input-group">
            <textarea 
              class="ado-naturale-input" 
              placeholder="Enter your query in natural language (e.g., 'Show me my bugs', 'High priority user stories assigned to me')"
              rows="2"
            ></textarea>
            <button class="ado-naturale-submit">
              <span class="submit-icon">🔍</span>
              <span class="submit-text">Query</span>
            </button>
          </div>
          <div class="ado-naturale-feedback" style="display: none;">
            <div class="feedback-content"></div>
          </div>
          <div class="ado-naturale-loading" style="display: none;">
            <div class="loading-spinner"></div>
            <span>Processing query...</span>
          </div>
          <div class="ado-naturale-error" style="display: none;"></div>
          <div class="ado-naturale-suggestions">
            <div class="suggestions-header">Quick suggestions:</div>
            <div class="suggestions-list">
              <div class="suggestion-item" data-query="Show me my bugs">My bugs</div>
              <div class="suggestion-item" data-query="Everything assigned to me">Everything assigned to me</div>
              <div class="suggestion-item" data-query="High priority bugs">High priority bugs</div>
              <div class="suggestion-item" data-query="Active bugs assigned to me over a year old">Active bugs assigned to me over a year old</div>
            </div>
          </div>
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
      
      DEBUG.log('CREATE_UI', 'UI elements created and references stored', {
        hasInput: !!this.nlInput,
        hasSubmitButton: !!this.submitButton,
        hasLoadingIndicator: !!this.loadingIndicator,
        hasErrorDisplay: !!this.errorDisplay
      });
      
      injectedElements.push(container);
      
      return container;
    }
    
    /**
     * Inject the interface at the specified location
     */
    injectAtLocation(targetElement) {
      DEBUG.log('INJECT_LOCATION', 'Injecting interface at target location');
      // For bottom-fixed layout, always append to the body
      targetElement.appendChild(this.nlInputContainer);
      
      // Initialize in minimized state
      if (!isInterfaceVisible) {
        DEBUG.log('INJECT_LOCATION', 'Setting interface to minimized state');
        this.nlInputContainer.classList.add('minimized');
      }
      
      DEBUG.log('INJECT_LOCATION', 'Interface injected successfully');
    }
    
    /**
     * Attach event listeners to interface elements
     */
    attachEventListeners() {
      DEBUG.log('EVENTS', 'Attaching event listeners');
      
      // Submit button click
      this.submitButton.addEventListener('click', () => {
        DEBUG.log('EVENTS', 'Submit button clicked');
        this.handleQuerySubmit();
      });
      
      // Enter key in textarea (Ctrl+Enter or Shift+Enter to submit)
      this.nlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
          DEBUG.log('EVENTS', 'Keyboard shortcut triggered (Ctrl/Shift+Enter)');
          e.preventDefault();
          this.handleQuerySubmit();
        }
      });
      
      // Toggle interface visibility
      const toggleButton = this.nlInputContainer.querySelector('.ado-naturale-toggle');
      toggleButton.addEventListener('click', () => {
        DEBUG.log('EVENTS', 'Toggle button clicked');
        this.toggleInterface();
      });
      
      // Suggestion clicks
      const suggestionItems = this.nlInputContainer.querySelectorAll('.suggestion-item');
      const suggestionQueries = [
        "My bugs",
        "Everything assigned to me",
        "High priority bugs",
        "Active bugs assigned to me over a year old"
      ];
      suggestionItems.forEach((item, index) => {
        item.addEventListener('click', () => {
          const query = suggestionQueries[index] || item.getAttribute('data-query');
          DEBUG.log('EVENTS', 'Suggestion clicked', { index, query });
          this.nlInput.value = query;
          this.handleQuerySubmit();
        });
      });
      
      // Auto-resize textarea
      this.nlInput.addEventListener('input', () => {
        this.autoResizeTextarea();
      });
      
      DEBUG.log('EVENTS', `✅ Event listeners attached (${suggestionItems.length} suggestions)`);
    }
    
    /**
     * Handle query submission
     */
    async handleQuerySubmit() {
      const query = this.nlInput.value.trim();
      
      DEBUG.log('QUERY_SUBMIT', 'Query submission started', {
        query,
        queryLength: query.length,
        context: currentContext
      });
      
      if (!query) {
        DEBUG.warn('QUERY_SUBMIT', 'Empty query submitted');
        this.showError('Please enter a query');
        return;
      }
      
      const startTime = Date.now();
      
      try {
        DEBUG.log('QUERY_SUBMIT', 'Showing loading state');
        this.showLoading(true);
        this.hideError();
        
        // Check for available processors
        DEBUG.log('PROCESSOR_CHECK', 'Checking available natural language processors', {
          hasEnhanced: typeof window.ADONaturale_EnhancedNLProcessor !== 'undefined',
          hasStandard: typeof window.ADONaturale_NLProcessor !== 'undefined'
        });
        
        // Use enhanced NL processor for metadata-aware AI processing
        let processor;
        if (window.ADONaturale_EnhancedNLProcessor) {
          processor = new window.ADONaturale_EnhancedNLProcessor();
          DEBUG.log('PROCESSOR_CHECK', '✅ Using Enhanced NL Processor');
        } else if (window.ADONaturale_NLProcessor) {
          processor = new window.ADONaturale_NLProcessor();
          DEBUG.log('PROCESSOR_CHECK', '⚠️ Using Standard NL Processor (fallback)');
        } else {
          DEBUG.error('PROCESSOR_CHECK', 'No natural language processor available');
          throw new Error('No natural language processor available');
        }
        
        // Process the query
        DEBUG.log('QUERY_PROCESSING', 'Starting query processing', {
          processor: processor.constructor.name,
          query,
          context: currentContext
        });
        
        const result = await processor.processQuery(query, currentContext);
        const processingTime = Date.now() - startTime;
        
        DEBUG.log('QUERY_PROCESSING', 'Query processing completed', {
          success: result.success,
          hasUrl: !!result.url,
          method: result.method,
          confidence: result.confidence,
          processingTime,
          reasoning: result.reasoning
        });
        
        if (result.success && result.url) {
          DEBUG.log('QUERY_EXECUTION', 'Query processed successfully, executing URL', {
            url: result.url,
            method: result.method,
            confidence: result.confidence
          });
          
          // Execute the generated query URL
          await this.executeQuery(result.url);
          
          // Save to history
          DEBUG.log('HISTORY', 'Saving query to history');
          this.saveQueryToHistory(query, result.url, result);
          
          // Show success feedback
          DEBUG.log('FEEDBACK', 'Showing success feedback');
          this.showSuccessFeedback(result);
          
          // Clear input
          DEBUG.log('UI_UPDATE', 'Clearing input and resizing textarea');
          this.nlInput.value = '';
          this.autoResizeTextarea();
          
          DEBUG.log('QUERY_SUBMIT', '✅ Query submission completed successfully');
        } else {
          const errorMessage = result.error || 'Failed to process query';
          DEBUG.error('QUERY_PROCESSING', 'Query processing failed', {
            error: errorMessage,
            result
          });
          this.showError(errorMessage);
        }
      } catch (error) {
        const processingTime = Date.now() - startTime;
        DEBUG.error('QUERY_SUBMIT', 'Error during query submission', {
          error,
          processingTime,
          query
        });
        this.showError('An error occurred while processing your query');
      } finally {
        DEBUG.log('QUERY_SUBMIT', 'Hiding loading state');
        this.showLoading(false);
      }
    }
    
    /**
     * Execute query by navigating to the generated URL
     */
    async executeQuery(queryUrl) {
      DEBUG.log('EXECUTE_QUERY', 'Starting query execution', {
        url: queryUrl,
        hasQueryExecutor: typeof window.ADONaturale !== 'undefined' && !!window.ADONaturale.QueryExecutor
      });
      
      // Check for debug pause flag
      if (window.ADONaturale_DEBUG_PAUSE) {
        DEBUG.warn('EXECUTE_QUERY', '🛑 DEBUG PAUSE ENABLED - Execution paused for log inspection', {
          url: queryUrl,
          instructions: 'Review console logs, then set window.ADONaturale_DEBUG_PAUSE = false to continue'
        });
        
        // Show user-friendly alert
        const shouldContinue = confirm(
          `🛑 DEBUG PAUSE ENABLED\n\n` +
          `Query URL generated: ${queryUrl.substring(0, 100)}...\n\n` +
          `The execution is paused so you can inspect the console logs.\n` +
          `Click OK to continue navigation, or Cancel to abort.`
        );
        
        if (!shouldContinue) {
          DEBUG.log('EXECUTE_QUERY', 'User chose to abort navigation during debug pause');
          return;
        }
        
        DEBUG.log('EXECUTE_QUERY', 'User chose to continue navigation, proceeding...');
      }
      
      try {
        // Use the query executor to navigate to the URL
        if (typeof window.ADONaturale !== 'undefined' && window.ADONaturale.QueryExecutor) {
          DEBUG.log('EXECUTE_QUERY', 'Query executor available, executing query');
          await window.ADONaturale.QueryExecutor.executeQuery(queryUrl);
          DEBUG.log('EXECUTE_QUERY', '✅ Query execution completed successfully');
        } else {
          DEBUG.error('EXECUTE_QUERY', 'Query executor not available, falling back to window.location');
          // Fallback to direct navigation
          window.location.href = queryUrl;
        }
      } catch (error) {
        DEBUG.error('EXECUTE_QUERY', 'Error executing query URL', {
          error,
          url: queryUrl
        });
        throw error;
      }
    }
    
    /**
     * Send message to background script
     */
    sendMessageToBackground(message) {
      DEBUG.log('BACKGROUND_MESSAGE', 'Sending message to background script', {
        action: message.action,
        hasData: !!message.data
      });
      
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            DEBUG.error('BACKGROUND_MESSAGE', 'Error sending message to background', chrome.runtime.lastError);
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            DEBUG.log('BACKGROUND_MESSAGE', 'Received response from background', {
              success: response?.success,
              hasError: !!response?.error
            });
            resolve(response);
          }
        });
      });
    }
    
    /**
     * Save query to history
     */
    saveQueryToHistory(naturalLanguage, queryUrl, result) {
      DEBUG.log('SAVE_HISTORY', 'Saving query to history', {
        naturalLanguage,
        queryUrl,
        method: result.method,
        confidence: result.confidence
      });
      
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
      DEBUG.log('UI_STATE', `${show ? 'Showing' : 'Hiding'} loading indicator`);
      this.loadingIndicator.style.display = show ? 'flex' : 'none';
      this.submitButton.disabled = show;
      this.nlInput.disabled = show;
    }
    
    /**
     * Show error message
     */
    showError(message) {
      DEBUG.log('UI_ERROR', 'Showing error message', { message });
      this.errorDisplay.textContent = message;
      this.errorDisplay.style.display = 'block';
    }
    
    /**
     * Hide error message
     */
    hideError() {
      DEBUG.log('UI_STATE', 'Hiding error message');
      this.errorDisplay.style.display = 'none';
    }
    
    /**
     * Toggle interface visibility
     */
    toggleInterface() {
      const toggleIcon = this.nlInputContainer.querySelector('.toggle-icon');
      
      isInterfaceVisible = !isInterfaceVisible;
      
      DEBUG.log('UI_TOGGLE', 'Toggling interface visibility', {
        wasVisible: !isInterfaceVisible,
        nowVisible: isInterfaceVisible
      });
      
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
      DEBUG.log('CLEANUP', 'Removing interface elements', {
        elementsToRemove: injectedElements.length
      });
      
      injectedElements.forEach((element, index) => {
        if (element.parentNode) {
          DEBUG.log('CLEANUP', `Removing element ${index + 1}/${injectedElements.length}`);
          element.parentNode.removeChild(element);
        }
      });
      injectedElements = [];
      DEBUG.log('CLEANUP', '✅ UI interface removed successfully');
    }
    
    /**
     * Show success feedback with processing information
     */
    showSuccessFeedback(result) {
      DEBUG.log('SUCCESS_FEEDBACK', 'Displaying success feedback', {
        method: result.method,
        confidence: result.confidence,
        hasReasoning: !!result.reasoning,
        hasProcessingTime: !!result.processingTime
      });
      
      if (!this.feedbackDisplay || !this.feedbackContent) {
        DEBUG.warn('SUCCESS_FEEDBACK', 'Feedback display elements not available');
        return;
      }
      
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
      
      DEBUG.log('SUCCESS_FEEDBACK', 'Feedback displayed, setting auto-hide timer');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (this.feedbackDisplay) {
          DEBUG.log('SUCCESS_FEEDBACK', 'Auto-hiding feedback after timeout');
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
  
  // Export the UIInjector globally
  if (typeof window.ADONaturale_UIInjector === 'undefined') {
    DEBUG.log('EXPORT', 'Creating global UIInjector instance');
    window.ADONaturale_UIInjector = new UIInjector();
  } else {
    DEBUG.warn('EXPORT', 'UIInjector already exists in global scope');
  }

})(); 