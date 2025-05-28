/**
 * ADO Naturale - Azure OpenAI Client
 * Handles AI-powered natural language to ADO query conversion
 */

(function() {
  'use strict';
  
  // Debug utility
  const DEBUG = {
    log: (category, message, data = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `🔍 [OpenAI-Client][${category}][${timestamp}]`;
      if (data) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
    },
    error: (category, message, error = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `❌ [OpenAI-Client][${category}][${timestamp}]`;
      if (error) {
        console.error(prefix, message, error);
      } else {
        console.error(prefix, message);
      }
    },
    warn: (category, message, data = null) => {
      const timestamp = new Date().toISOString();
      const prefix = `⚠️ [OpenAI-Client][${category}][${timestamp}]`;
      if (data) {
        console.warn(prefix, message, data);
      } else {
        console.warn(prefix, message);
      }
    }
  };
  
  DEBUG.log('INIT', 'OpenAI Client script loading');
  
  /**
   * Azure OpenAI Client class
   */
  class OpenAIClient {
    constructor() {
      DEBUG.log('CONSTRUCTOR', 'Creating new OpenAI Client instance');
      
      // These would typically come from environment variables or configuration
      // For now, we'll use placeholder values that need to be configured
      this.endpoint = null; // Will be set via configuration
      this.apiKey = null;   // Will be set via configuration
      this.deploymentName = 'gpt-4'; // Default deployment name
      this.apiVersion = '2024-02-15-preview';
      this.maxTokens = 1000;
      this.temperature = 0.1; // Low temperature for consistent, precise responses
      
      DEBUG.log('CONSTRUCTOR', 'OpenAI Client initialized with defaults', {
        deploymentName: this.deploymentName,
        apiVersion: this.apiVersion,
        maxTokens: this.maxTokens,
        temperature: this.temperature,
        hasEndpoint: !!this.endpoint,
        hasApiKey: !!this.apiKey
      });
    }
    
    /**
     * Load configuration from storage
     */
    async loadConfiguration() {
      DEBUG.log('CONFIG_LOAD', 'Loading OpenAI configuration from storage');
      
      try {
        const result = await chrome.storage.sync.get(['openaiConfig']);
        
        DEBUG.log('CONFIG_LOAD', 'Retrieved storage data', {
          hasOpenaiConfig: !!result.openaiConfig,
          configKeys: result.openaiConfig ? Object.keys(result.openaiConfig) : []
        });
        
        if (result.openaiConfig) {
          this.endpoint = result.openaiConfig.endpoint;
          this.apiKey = result.openaiConfig.apiKey;
          this.deploymentName = result.openaiConfig.deploymentName || 'gpt-4';
          
          DEBUG.log('CONFIG_LOAD', '✅ Configuration loaded successfully', {
            hasEndpoint: !!this.endpoint,
            hasApiKey: !!this.apiKey,
            deploymentName: this.deploymentName,
            endpointPreview: this.endpoint ? this.endpoint.substring(0, 30) + '...' : null
          });
          
          return true;
        } else {
          DEBUG.warn('CONFIG_LOAD', 'No OpenAI configuration found in storage');
          return false;
        }
      } catch (error) {
        DEBUG.error('CONFIG_LOAD', 'Error loading configuration from storage', error);
        return false;
      }
    }
    
    /**
     * Configure the client with provided settings
     */
    configure(config) {
      DEBUG.log('CONFIG_SET', 'Configuring OpenAI client', {
        hasEndpoint: !!config.endpoint,
        hasApiKey: !!config.apiKey,
        deploymentName: config.deploymentName,
        endpointPreview: config.endpoint ? config.endpoint.substring(0, 30) + '...' : null
      });
      
      this.endpoint = config.endpoint;
      this.apiKey = config.apiKey;
      this.deploymentName = config.deploymentName || 'gpt-4';
      
      DEBUG.log('CONFIG_SET', '✅ Configuration applied', {
        isConfigured: this.isConfigured()
      });
    }
    
    /**
     * Check if the client is properly configured
     */
    isConfigured() {
      const configured = !!(this.endpoint && this.apiKey && this.deploymentName);
      
      DEBUG.log('CONFIG_CHECK', 'Checking configuration status', {
        hasEndpoint: !!this.endpoint,
        hasApiKey: !!this.apiKey,
        hasDeploymentName: !!this.deploymentName,
        isConfigured: configured
      });
      
      return configured;
    }
    
    /**
     * Generate ADO query URL from natural language using Azure OpenAI
     */
    async generateQueryUrl(userInput, metadata, context = {}) {
      DEBUG.log('GENERATE_URL', 'Starting query URL generation', {
        userInput,
        hasMetadata: !!metadata,
        contextKeys: Object.keys(context),
        isConfigured: this.isConfigured()
      });
      
      if (!this.isConfigured()) {
        DEBUG.error('GENERATE_URL', 'Client not configured, falling back to pattern matching');
        return this.fallbackToPatternMatching(userInput, metadata, context);
      }
      
      try {
        const startTime = Date.now();
        
        DEBUG.log('GENERATE_URL', 'Building prompt for OpenAI API');
        const prompt = this.buildPrompt(userInput, metadata, context);
        
        DEBUG.log('GENERATE_URL', 'Prompt built successfully, making API call', {
          promptKeys: Object.keys(prompt),
          systemPromptLength: prompt.system?.length || 0,
          userPromptLength: prompt.user?.length || 0
        });
        
        const response = await this.callOpenAI(prompt);
        const apiCallTime = Date.now() - startTime;
        
        DEBUG.log('GENERATE_URL', 'Received response from OpenAI API', {
          hasResponse: !!response,
          responseType: typeof response,
          apiCallTime: `${apiCallTime}ms`
        });
        
        // Extract and validate the URL from the response
        const queryUrl = this.extractQueryUrl(response);
        
        DEBUG.log('GENERATE_URL', 'URL extraction attempted', {
          hasUrl: !!queryUrl,
          urlLength: queryUrl?.length || 0
        });
        
        if (this.validateQueryUrl(queryUrl, context)) {
          DEBUG.log('GENERATE_URL', '✅ URL validation successful');
          return {
            success: true,
            url: queryUrl,
            confidence: 0.9,
            method: 'azure-openai',
            reasoning: response.reasoning || 'Generated by Azure OpenAI'
          };
        } else {
          DEBUG.error('GENERATE_URL', 'URL validation failed');
          throw new Error('Generated URL failed validation');
        }
        
      } catch (error) {
        DEBUG.error('GENERATE_URL', 'Error during query generation', {
          error: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
        
        DEBUG.log('GENERATE_URL', 'Falling back to pattern matching');
        return this.fallbackToPatternMatching(userInput, metadata, context);
      }
    }
    
    /**
     * Build the prompt for Azure OpenAI
     */
    buildPrompt(userInput, metadata, context) {
      const systemPrompt = `You are an expert Azure DevOps Work Item Query Language (WIQL) generator.
Your task is to convert natural language queries into valid Azure DevOps query URLs.

IMPORTANT RULES:
1. Return ONLY a valid Azure DevOps query URL
2. Use the exact field names and values provided in the metadata
3. Ensure proper URL encoding
4. Use appropriate WIQL operators and syntax
5. Include proper SELECT, FROM, WHERE, and ORDER BY clauses

RESPONSE FORMAT:
Return a JSON object with:
{
  "url": "the complete Azure DevOps query URL",
  "reasoning": "brief explanation of the query logic"
}`;

      const metadataPrompt = this.buildMetadataPrompt(metadata);
      const contextPrompt = this.buildContextPrompt(context);
      const examplesPrompt = this.buildExamplesPrompt(metadata);
      
      const userPrompt = `User Query: "${userInput}"

Generate the appropriate Azure DevOps query URL for this request.`;

      return {
        system: systemPrompt,
        metadata: metadataPrompt,
        context: contextPrompt,
        examples: examplesPrompt,
        user: userPrompt
      };
    }
    
    /**
     * Build metadata section of the prompt
     */
    buildMetadataPrompt(metadata) {
      const workItemTypesInfo = Object.entries(metadata.workItemTypes)
        .map(([name, type]) => {
          const fields = Object.entries(type.fields)
            .filter(([_, field]) => field.isQueryable !== false)
            .map(([ref, field]) => {
              let fieldInfo = `  - ${field.name} (${ref}): ${field.type}`;
              if (field.allowedValues && field.allowedValues.length > 0) {
                fieldInfo += ` [${field.allowedValues.slice(0, 5).join(', ')}${field.allowedValues.length > 5 ? '...' : ''}]`;
              }
              return fieldInfo;
            })
            .slice(0, 10) // Limit fields to prevent prompt overflow
            .join('\n');
          
          return `${name}:\n${fields}`;
        })
        .join('\n\n');

      const commonFields = Object.entries(metadata.commonFields)
        .map(([natural, technical]) => `  "${natural}" → ${technical}`)
        .join('\n');

      const teamMembers = metadata.teamMembers
        .slice(0, 10) // Limit to prevent prompt overflow
        .map(member => `  - ${member.displayName} (${member.uniqueName})`)
        .join('\n');

      const iterations = metadata.iterations
        .slice(0, 5) // Limit to prevent prompt overflow
        .map(iteration => `  - ${iteration.name} (${iteration.path})`)
        .join('\n');

      return `METADATA:

Organization: ${metadata.organization}
Project: ${metadata.project}

Work Item Types and Fields:
${workItemTypesInfo}

Common Field Mappings:
${commonFields}

Team Members:
${teamMembers}

Iterations/Sprints:
${iterations}

Query Operators:
  Equality: =, <>, !=
  Comparison: >, <, >=, <=
  Text: CONTAINS, CONTAINS WORDS, DOES NOT CONTAIN
  Special Values: @Me, @Today, @CurrentIteration, @StartOfWeek, @StartOfMonth`;
    }
    
    /**
     * Build context section of the prompt
     */
    buildContextPrompt(context) {
      let baseUrl;
      if (context.organization && context.project) {
        if (context.url?.includes('dev.azure.com')) {
          baseUrl = `https://dev.azure.com/${context.organization}/${context.project}`;
        } else if (context.url?.includes('.visualstudio.com')) {
          baseUrl = `https://${context.organization}.visualstudio.com/${context.project}`;
        } else {
          baseUrl = 'https://dev.azure.com/{org}/{project}';
        }
      } else {
        baseUrl = 'https://dev.azure.com/{org}/{project}';
      }

      return `CONTEXT:

Base URL: ${baseUrl}/_queries/query/
Current User: ${context.currentUser || '@Me'}
Current Date: ${new Date().toISOString().split('T')[0]}
URL Format: {baseUrl}/_queries/query/?wiql={encoded_wiql_query}`;
    }
    
    /**
     * Build examples section of the prompt
     */
    buildExamplesPrompt(metadata) {
      let baseUrl;
      if (metadata.organization && metadata.project) {
        // Determine hosting environment from the current URL or context
        const currentUrl = window.location.href;
        if (currentUrl.includes('dev.azure.com')) {
          baseUrl = `https://dev.azure.com/${metadata.organization}/${metadata.project}`;
        } else if (currentUrl.includes('.visualstudio.com')) {
          baseUrl = `https://${metadata.organization}.visualstudio.com/${metadata.project}`;
        } else {
          baseUrl = `https://dev.azure.com/${metadata.organization}/${metadata.project}`;
        }
      } else {
        baseUrl = 'https://dev.azure.com/{org}/{project}';
      }

      return `EXAMPLES:

Query: "Show me my bugs"
URL: ${baseUrl}/_queries/query/?wiql=SELECT%20%5BSystem.Id%5D%2C%20%5BSystem.Title%5D%2C%20%5BSystem.State%5D%2C%20%5BSystem.AssignedTo%5D%20FROM%20WorkItems%20WHERE%20%5BSystem.WorkItemType%5D%20%3D%20%27Bug%27%20AND%20%5BSystem.AssignedTo%5D%20%3D%20%40Me%20ORDER%20BY%20%5BSystem.CreatedDate%5D%20DESC

Query: "High priority user stories"
URL: ${baseUrl}/_queries/query/?wiql=SELECT%20%5BSystem.Id%5D%2C%20%5BSystem.Title%5D%2C%20%5BSystem.State%5D%2C%20%5BMicrosoft.VSTS.Common.Priority%5D%20FROM%20WorkItems%20WHERE%20%5BSystem.WorkItemType%5D%20%3D%20%27User%20Story%27%20AND%20%5BMicrosoft.VSTS.Common.Priority%5D%20%3C%3D%202%20ORDER%20BY%20%5BMicrosoft.VSTS.Common.Priority%5D

Query: "Items created this week"
URL: ${baseUrl}/_queries/query/?wiql=SELECT%20%5BSystem.Id%5D%2C%20%5BSystem.Title%5D%2C%20%5BSystem.WorkItemType%5D%2C%20%5BSystem.CreatedBy%5D%20FROM%20WorkItems%20WHERE%20%5BSystem.CreatedDate%5D%20%3E%3D%20%40StartOfWeek%20ORDER%20BY%20%5BSystem.CreatedDate%5D%20DESC`;
    }
    
    /**
     * Call Azure OpenAI API
     */
    async callOpenAI(prompt) {
      const url = `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;
      
      DEBUG.log('API_CALL', 'Preparing Azure OpenAI API call', {
        endpoint: this.endpoint,
        deploymentName: this.deploymentName,
        apiVersion: this.apiVersion,
        fullUrl: url
      });
      
      const messages = [
        { role: 'system', content: prompt.system },
        { role: 'user', content: `${prompt.metadata}\n\n${prompt.context}\n\n${prompt.examples}\n\n${prompt.user}` }
      ];
      
      const requestBody = {
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' }
      };
      
      DEBUG.log('API_CALL', 'Request prepared', {
        messagesCount: messages.length,
        systemContentLength: messages[0].content.length,
        userContentLength: messages[1].content.length,
        maxTokens: this.maxTokens,
        temperature: this.temperature,
        requestBodySize: JSON.stringify(requestBody).length
      });
      
      try {
        const fetchStartTime = Date.now();
        
        DEBUG.log('API_CALL', 'Making fetch request to Azure OpenAI');
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey
          },
          body: JSON.stringify(requestBody)
        });
        
        const fetchTime = Date.now() - fetchStartTime;
        
        DEBUG.log('API_CALL', 'Received HTTP response', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          fetchTime: `${fetchTime}ms`,
          headers: {
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          DEBUG.error('API_CALL', 'API returned error response', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 500) + (errorText.length > 500 ? '...' : ''),
            errorTextLength: errorText.length
          });
          throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const parseStartTime = Date.now();
        const data = await response.json();
        const parseTime = Date.now() - parseStartTime;
        
        DEBUG.log('API_CALL', 'Response parsed successfully', {
          parseTime: `${parseTime}ms`,
          hasChoices: !!(data.choices && data.choices.length > 0),
          choicesCount: data.choices ? data.choices.length : 0,
          hasUsage: !!data.usage,
          usage: data.usage || null
        });
        
        if (!data.choices || data.choices.length === 0) {
          DEBUG.error('API_CALL', 'No choices in response', {
            responseData: data
          });
          throw new Error('No response from Azure OpenAI');
        }
        
        const content = data.choices[0].message.content;
        
        DEBUG.log('API_CALL', 'Extracted content from response', {
          contentLength: content ? content.length : 0,
          contentPreview: content ? content.substring(0, 100) + (content.length > 100 ? '...' : '') : null
        });
        
        try {
          const parsedContent = JSON.parse(content);
          DEBUG.log('API_CALL', '✅ Successfully parsed JSON response', {
            parsedKeys: Object.keys(parsedContent),
            hasUrl: !!parsedContent.url,
            hasReasoning: !!parsedContent.reasoning
          });
          return parsedContent;
        } catch (parseError) {
          DEBUG.warn('API_CALL', 'Failed to parse JSON, attempting URL extraction', {
            parseError: parseError.message,
            contentSample: content.substring(0, 200)
          });
          
          // If JSON parsing fails, try to extract URL from text
          const urlMatch = content.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            DEBUG.log('API_CALL', '✅ Extracted URL from text response', {
              extractedUrl: urlMatch[0]
            });
            return {
              url: urlMatch[0],
              reasoning: 'Extracted URL from text response'
            };
          }
          
          DEBUG.error('API_CALL', 'Could not parse response or extract URL', {
            content: content.substring(0, 500)
          });
          throw new Error('Could not parse OpenAI response');
        }
        
      } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          DEBUG.error('API_CALL', 'Network error during API call', {
            error: error.message,
            endpoint: this.endpoint
          });
        } else {
          DEBUG.error('API_CALL', 'Error during API call', {
            error: error.message,
            errorType: error.constructor.name
          });
        }
        throw error;
      }
    }
    
    /**
     * Extract query URL from OpenAI response
     */
    extractQueryUrl(response) {
      if (typeof response === 'string') {
        // Try to extract URL from string response
        const urlMatch = response.match(/https?:\/\/[^\s]+/);
        return urlMatch ? urlMatch[0] : null;
      }
      
      if (response.url) {
        return response.url;
      }
      
      // Look for URL in various possible fields
      const possibleFields = ['query_url', 'queryUrl', 'adoUrl', 'result'];
      for (const field of possibleFields) {
        if (response[field] && typeof response[field] === 'string') {
          return response[field];
        }
      }
      
      return null;
    }
    
    /**
     * Validate the generated query URL
     */
    validateQueryUrl(url, context) {
      if (!url || typeof url !== 'string') {
        return false;
      }
      
      // Check if it's a valid URL
      try {
        new URL(url);
      } catch {
        return false;
      }
      
      // Check if it contains the expected ADO patterns
      const adoPatterns = [
        /dev\.azure\.com/,
        /\.visualstudio\.com/,
        /_queries\/query/,
        /wiql=/
      ];
      
      return adoPatterns.some(pattern => pattern.test(url));
    }
    
    /**
     * Test the connection to Azure OpenAI
     */
    async testConnection() {
      DEBUG.log('TEST_CONNECTION', 'Starting connection test', {
        isConfigured: this.isConfigured(),
        endpoint: this.endpoint?.substring(0, 30) + '...'
      });
      
      if (!this.isConfigured()) {
        DEBUG.error('TEST_CONNECTION', 'Cannot test connection - not configured');
        return {
          success: false,
          error: 'OpenAI client is not configured'
        };
      }
      
      try {
        // Simple test prompt
        const testPrompt = {
          system: 'You are a helpful assistant. Respond with a simple JSON object containing a "status" field with value "ok".',
          user: 'Test connection'
        };
        
        DEBUG.log('TEST_CONNECTION', 'Making test API call');
        const response = await this.callOpenAI(testPrompt);
        
        DEBUG.log('TEST_CONNECTION', '✅ Connection test successful', {
          hasResponse: !!response,
          responseType: typeof response
        });
        
        return {
          success: true,
          response: response
        };
        
      } catch (error) {
        DEBUG.error('TEST_CONNECTION', 'Connection test failed', {
          error: error.message
        });
        
        return {
          success: false,
          error: error.message
        };
      }
    }
    
    /**
     * Fallback to pattern matching when OpenAI is not available
     */
    async fallbackToPatternMatching(userInput, metadata, context) {
      DEBUG.log('FALLBACK', 'Using pattern matching fallback', {
        userInput,
        hasMetadata: !!metadata,
        hasNLProcessor: typeof window.ADONaturale_NLProcessor !== 'undefined',
        hasURLGenerator: typeof window.ADONaturale_URLGenerator !== 'undefined'
      });
      
      // Use the existing natural language processor as fallback
      if (window.ADONaturale_NLProcessor) {
        DEBUG.log('FALLBACK', 'Using existing NL Processor');
        const processor = new window.ADONaturale_NLProcessor();
        const processedQuery = processor.processQuery(userInput, context);
        
        // Use the existing URL generator
        if (window.ADONaturale_URLGenerator) {
          DEBUG.log('FALLBACK', 'Using existing URL Generator');
          const urlGenerator = new window.ADONaturale_URLGenerator();
          const url = urlGenerator.generateQueryURL(processedQuery, context);
          
          DEBUG.log('FALLBACK', '✅ Pattern matching fallback successful', {
            confidence: processedQuery.confidence || 0.7,
            hasUrl: !!url
          });
          
          return {
            success: true,
            url,
            confidence: processedQuery.confidence || 0.7,
            method: 'pattern-matching',
            reasoning: 'Generated using pattern matching fallback'
          };
        }
      }
      
      // Ultimate fallback - basic URL construction
      DEBUG.log('FALLBACK', 'Using ultimate fallback - basic URL construction');
      
      const baseUrl = context.organization && context.project
        ? (context.url?.includes('dev.azure.com')
          ? `https://dev.azure.com/${context.organization}/${context.project}`
          : `https://${context.organization}.visualstudio.com/${context.project}`)
        : 'https://dev.azure.com/org/project';
      
      const basicWiql = `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State] FROM WorkItems WHERE [System.Title] CONTAINS '${userInput.replace(/'/g, "''")}'`;
      const encodedWiql = encodeURIComponent(basicWiql);
      
      const fallbackUrl = `${baseUrl}/_queries/query/?wiql=${encodedWiql}`;
      
      DEBUG.log('FALLBACK', '✅ Basic fallback URL generated', {
        baseUrl,
        wiqlLength: basicWiql.length,
        encodedWiqlLength: encodedWiql.length
      });
      
      return {
        success: true,
        url: fallbackUrl,
        confidence: 0.3,
        method: 'basic-fallback',
        reasoning: 'Basic text search fallback'
      };
    }
  }
  
  // Export the OpenAI client globally
  if (typeof window.ADONaturale_OpenAIClient === 'undefined') {
    DEBUG.log('EXPORT', 'Creating global OpenAI Client instance');
    window.ADONaturale_OpenAIClient = OpenAIClient;
  } else {
    DEBUG.warn('EXPORT', 'OpenAI Client already exists in global scope');
  }

})(); 