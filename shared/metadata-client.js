/**
 * ADO Naturale - Metadata Client
 * Fetches comprehensive field metadata from Azure DevOps to enhance NLP capabilities
 */

(function() {
  'use strict';
  
  /**
   * Metadata Client class for fetching ADO field information
   */
  class MetadataClient {
    constructor() {
      console.log('MetadataClient: Constructor called');
      console.log('MetadataClient: Current window.location.href:', window.location.href);
      
      this.baseUrl = this.extractBaseUrl();
      this.organization = this.extractOrganization();
      this.project = this.extractProject();
      this.cache = new Map();
      this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
      
      console.log('MetadataClient: Initialized with:', {
        baseUrl: this.baseUrl,
        organization: this.organization,
        project: this.project,
        currentUrl: window.location.href
      });
      
      // Additional validation
      if (!this.organization || !this.project) {
        console.error('MetadataClient: Failed to extract organization or project!', {
          organization: this.organization,
          project: this.project,
          url: window.location.href
        });
      }
      
      if (this.project === 'DefaultCollection') {
        console.error('MetadataClient: Project extracted as DefaultCollection - this is likely incorrect!', {
          url: window.location.href,
          baseUrl: this.baseUrl,
          organization: this.organization
        });
      }
    }
    
    /**
     * Extract base URL from current page
     */
    extractBaseUrl() {
      const url = window.location.href;
      console.log('MetadataClient: Extracting base URL from:', url);
      
      if (url.includes('dev.azure.com')) {
        const baseUrl = 'https://dev.azure.com';
        console.log('MetadataClient: Extracted base URL (dev.azure.com):', baseUrl);
        return baseUrl;
      } else if (url.includes('.visualstudio.com')) {
        // Extract the full subdomain + domain (e.g., https://microsoft.visualstudio.com)
        const match = url.match(/https:\/\/(.+?)\.visualstudio\.com/);
        const baseUrl = match ? match[0] : null;
        console.log('MetadataClient: Extracted base URL (visualstudio.com):', baseUrl);
        return baseUrl;
      }
      return null;
    }
    
    /**
     * Extract organization from URL
     */
    extractOrganization() {
      const url = window.location.href;
      console.log('MetadataClient: Extracting organization from URL:', url);
      
      if (url.includes('dev.azure.com')) {
        // For dev.azure.com: https://dev.azure.com/organization/project/...
        const match = url.match(/dev\.azure\.com\/(.+?)\//);
        const org = match ? match[1] : null;
        console.log('MetadataClient: Extracted organization (dev.azure.com):', org);
        return org;
      } else if (url.includes('.visualstudio.com')) {
        // For visualstudio.com: https://organization.visualstudio.com/project/...
        // Organization is the subdomain
        const match = url.match(/https:\/\/(.+?)\.visualstudio\.com/);
        const org = match ? match[1] : null;
        console.log('MetadataClient: Extracted organization (visualstudio.com):', org);
        return org;
      }
      return null;
    }
    
    /**
     * Extract project from URL
     */
    extractProject() {
      const url = window.location.href;
      console.log('MetadataClient: Extracting project from URL:', url);
      
      if (url.includes('dev.azure.com')) {
        // For dev.azure.com: https://dev.azure.com/organization/project/...
        const match = url.match(/dev\.azure\.com\/.+?\/(.+?)\//);
        const project = match ? match[1] : null;
        console.log('MetadataClient: Extracted project (dev.azure.com):', project);
        return project;
      } else if (url.includes('.visualstudio.com')) {
        // For visualstudio.com: https://organization.visualstudio.com/project/...
        // Project is the first path segment after the domain
        // Handle various URL patterns like /project/_queries, /project, etc.
        const match = url.match(/\.visualstudio\.com\/([^\/\?\#]+)/);
        const project = match ? match[1] : null;
        
        console.log('MetadataClient: URL match result:', match);
        console.log('MetadataClient: Extracted project (visualstudio.com):', project);
        
        // If we got DefaultCollection, it might be an old-style URL pattern
        if (project === 'DefaultCollection') {
          console.warn('MetadataClient: Detected DefaultCollection - this might be an old URL pattern');
          // Try to extract the actual project from a different part of the URL
          const altMatch = url.match(/\.visualstudio\.com\/DefaultCollection\/([^\/\?\#]+)/);
          if (altMatch) {
            const altProject = altMatch[1];
            console.log('MetadataClient: Found alternative project extraction:', altProject);
            return altProject;
          }
        }
        
        return project;
      }
      return null;
    }
    
    /**
     * Build API URL based on the hosting environment
     */
    buildApiUrl(endpoint) {
      console.log('MetadataClient: buildApiUrl called with endpoint:', endpoint);
      console.log('MetadataClient: buildApiUrl state:', {
        baseUrl: this.baseUrl,
        organization: this.organization,
        project: this.project
      });
      
      if (this.baseUrl.includes('dev.azure.com')) {
        // dev.azure.com format: https://dev.azure.com/organization/project/_apis/...
        const url = `${this.baseUrl}/${this.organization}/${this.project}/_apis/${endpoint}`;
        console.log('MetadataClient: buildApiUrl (dev.azure.com) result:', url);
        return url;
      } else if (this.baseUrl.includes('.visualstudio.com')) {
        // visualstudio.com format: https://organization.visualstudio.com/project/_apis/...
        const url = `${this.baseUrl}/${this.project}/_apis/${endpoint}`;
        console.log('MetadataClient: buildApiUrl (visualstudio.com) result:', url);
        return url;
      }
      console.error('MetadataClient: buildApiUrl - Unsupported ADO hosting environment');
      throw new Error('Unsupported ADO hosting environment');
    }
    
    /**
     * Build organization-level API URL (no project in path)
     */
    buildOrgApiUrl(endpoint) {
      console.log('MetadataClient: buildOrgApiUrl called with endpoint:', endpoint);
      console.log('MetadataClient: buildOrgApiUrl state:', {
        baseUrl: this.baseUrl,
        organization: this.organization,
        project: this.project
      });
      
      if (this.baseUrl.includes('dev.azure.com')) {
        // dev.azure.com format: https://dev.azure.com/organization/_apis/...
        const url = `${this.baseUrl}/${this.organization}/_apis/${endpoint}`;
        console.log('MetadataClient: buildOrgApiUrl (dev.azure.com) result:', url);
        return url;
      } else if (this.baseUrl.includes('.visualstudio.com')) {
        // visualstudio.com format: https://organization.visualstudio.com/_apis/...
        const url = `${this.baseUrl}/_apis/${endpoint}`;
        console.log('MetadataClient: buildOrgApiUrl (visualstudio.com) result:', url);
        return url;
      }
      console.error('MetadataClient: buildOrgApiUrl - Unsupported ADO hosting environment');
      throw new Error('Unsupported ADO hosting environment');
    }
    
    /**
     * Make authenticated request to ADO API
     */
    async makeRequest(url, options = {}) {
      const defaultOptions = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Use existing ADO session
      };
      
      const requestOptions = { ...defaultOptions, ...options };
      
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.warn(`API request failed for ${url}:`, error);
        throw error;
      }
    }
    
    /**
     * Get cached data or fetch if expired
     */
    async getCachedOrFetch(key, fetchFunction) {
      const cached = this.cache.get(key);
      if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
        return cached.data;
      }
      
      try {
        const data = await fetchFunction();
        this.cache.set(key, {
          data,
          timestamp: Date.now()
        });
        return data;
      } catch (error) {
        // Return cached data if available, even if expired
        if (cached) {
          console.warn('Using expired cache due to fetch error:', error);
          return cached.data;
        }
        throw error;
      }
    }
    
    /**
     * Get comprehensive work item type definitions with fields
     */
    async getWorkItemTypeDefinitions() {
      const cacheKey = `workItemTypes_${this.organization}_${this.project}`;
      
      return this.getCachedOrFetch(cacheKey, async () => {
        const url = this.buildApiUrl('wit/workitemtypes?$expand=fields&api-version=6.0');
        
        console.log('MetadataClient: Fetching work item types from URL:', url);
        const response = await this.makeRequest(url);
        
        const workItemTypes = {};
        
        for (const workItemType of response.value) {
          workItemTypes[workItemType.name] = {
            name: workItemType.name,
            referenceName: workItemType.referenceName,
            description: workItemType.description,
            icon: workItemType.icon,
            color: workItemType.color,
            fields: {}
          };
          
          // Process fields for this work item type
          for (const field of workItemType.fields) {
            workItemTypes[workItemType.name].fields[field.referenceName] = {
              name: field.name,
              referenceName: field.referenceName,
              type: field.type,
              description: field.description,
              readOnly: field.readOnly,
              required: field.alwaysRequired,
              allowedValues: field.allowedValues || [],
              defaultValue: field.defaultValue,
              helpText: field.helpText
            };
          }
        }
        
        return workItemTypes;
      });
    }
    
    /**
     * Get all available fields across all work item types
     */
    async getAllFields() {
      const cacheKey = `allFields_${this.organization}_${this.project}`;
      
      return this.getCachedOrFetch(cacheKey, async () => {
        const url = this.buildApiUrl('wit/fields?api-version=6.0');
        
        console.log('MetadataClient: Fetching fields from URL:', url);
        const response = await this.makeRequest(url);
        
        const fields = {};
        
        for (const field of response.value) {
          fields[field.referenceName] = {
            name: field.name,
            referenceName: field.referenceName,
            type: field.type,
            description: field.description,
            readOnly: field.readOnly,
            canSortBy: field.canSortBy,
            isQueryable: field.isQueryable,
            supportedOperations: field.supportedOperations || [],
            isIdentity: field.isIdentity,
            isPicklist: field.isPicklist,
            picklistId: field.picklistId,
            url: field.url
          };
        }
        
        return fields;
      });
    }
    
    /**
     * Get picklist values for dropdown fields
     */
    async getPicklistValues(picklistId) {
      if (!picklistId) return [];
      
      const cacheKey = `picklist_${picklistId}`;
      
      return this.getCachedOrFetch(cacheKey, async () => {
        const url = this.buildOrgApiUrl(`work/processes/lists/${picklistId}?api-version=6.0`);
        
        console.log('MetadataClient: Fetching picklist values from URL:', url);
        const response = await this.makeRequest(url);
        
        return response.items || [];
      });
    }
    
    /**
     * Get project iterations/sprints
     */
    async getIterations() {
      const cacheKey = `iterations_${this.organization}_${this.project}`;
      
      return this.getCachedOrFetch(cacheKey, async () => {
        const url = this.buildApiUrl('work/teamsettings/iterations?api-version=6.0');
        
        console.log('MetadataClient: Fetching iterations from URL:', url);
        const response = await this.makeRequest(url);
        
        return response.value.map(iteration => ({
          id: iteration.id,
          name: iteration.name,
          path: iteration.path,
          startDate: iteration.attributes?.startDate,
          finishDate: iteration.attributes?.finishDate,
          timeFrame: iteration.attributes?.timeFrame
        }));
      });
    }
    
    /**
     * Get project areas
     */
    async getAreas() {
      const cacheKey = `areas_${this.organization}_${this.project}`;
      
      return this.getCachedOrFetch(cacheKey, async () => {
        const url = this.buildApiUrl('wit/classificationnodes/areas?$depth=10&api-version=6.0');
        
        console.log('MetadataClient: Fetching areas from URL:', url);
        const response = await this.makeRequest(url);
        
        const areas = [];
        
        function extractAreas(node, parentPath = '') {
          const currentPath = parentPath ? `${parentPath}\\${node.name}` : node.name;
          areas.push({
            id: node.id,
            name: node.name,
            path: currentPath,
            hasChildren: node.hasChildren
          });
          
          if (node.children) {
            for (const child of node.children) {
              extractAreas(child, currentPath);
            }
          }
        }
        
        extractAreas(response);
        return areas;
      });
    }
    
    /**
     * Get team members
     */
    async getTeamMembers() {
      const cacheKey = `teamMembers_${this.organization}_${this.project}`;
      
      return this.getCachedOrFetch(cacheKey, async () => {
        try {
          const url = this.buildOrgApiUrl(`projects/${this.project}/teams?api-version=6.0`);
          
          console.log('MetadataClient: Fetching teams from URL:', url);
          const teamsResponse = await this.makeRequest(url);
          
          const allMembers = new Map();
          
          for (const team of teamsResponse.value) {
            try {
              const membersUrl = this.buildOrgApiUrl(`projects/${this.project}/teams/${team.id}/members?api-version=6.0`);
              
              console.log('MetadataClient: Fetching team members from URL:', membersUrl);
              const membersResponse = await this.makeRequest(membersUrl);
              
              for (const member of membersResponse.value) {
                allMembers.set(member.identity.uniqueName, {
                  displayName: member.identity.displayName,
                  uniqueName: member.identity.uniqueName,
                  email: member.identity.uniqueName,
                  imageUrl: member.identity.imageUrl,
                  teams: allMembers.has(member.identity.uniqueName) 
                    ? [...allMembers.get(member.identity.uniqueName).teams, team.name]
                    : [team.name]
                });
              }
            } catch (error) {
              console.warn(`MetadataClient: Could not fetch members for team ${team.name}:`, error);
            }
          }
          
          return Array.from(allMembers.values());
        } catch (error) {
          console.warn('MetadataClient: Could not fetch team members:', error);
          return [];
        }
      });
    }
    
    /**
     * Get comprehensive metadata for AI processing
     */
    async getComprehensiveMetadata() {
      console.log('MetadataClient: Starting comprehensive metadata fetch...');
      
      try {
        // Check if we have valid organization and project
        if (!this.organization || !this.project) {
          console.warn('MetadataClient: Missing organization or project, using fallback metadata');
          return this.getFallbackMetadata();
        }
        
        console.log('MetadataClient: Fetching metadata for org:', this.organization, 'project:', this.project);
        
        // Fetch metadata with individual error handling
        const results = await Promise.allSettled([
          this.getWorkItemTypeDefinitions(),
          this.getAllFields(),
          this.getIterations(),
          this.getAreas(),
          this.getTeamMembers()
        ]);
        
        const [workItemTypesResult, allFieldsResult, iterationsResult, areasResult, teamMembersResult] = results;
        
        // Extract successful results or use fallbacks
        const workItemTypes = workItemTypesResult.status === 'fulfilled' ? workItemTypesResult.value : {};
        const allFields = allFieldsResult.status === 'fulfilled' ? allFieldsResult.value : {};
        const iterations = iterationsResult.status === 'fulfilled' ? iterationsResult.value : [];
        const areas = areasResult.status === 'fulfilled' ? areasResult.value : [];
        const teamMembers = teamMembersResult.status === 'fulfilled' ? teamMembersResult.value : [];
        
        // Log any failures
        results.forEach((result, index) => {
          const names = ['workItemTypes', 'fields', 'iterations', 'areas', 'teamMembers'];
          if (result.status === 'rejected') {
            console.warn(`MetadataClient: Failed to fetch ${names[index]}:`, result.reason);
          }
        });
        
        // Enhance fields with picklist values (with error handling)
        const enhancedFields = { ...allFields };
        for (const [fieldRef, field] of Object.entries(enhancedFields)) {
          if (field.isPicklist && field.picklistId) {
            try {
              field.allowedValues = await this.getPicklistValues(field.picklistId);
            } catch (error) {
              console.warn(`MetadataClient: Could not fetch picklist values for ${fieldRef}:`, error);
              field.allowedValues = [];
            }
          }
        }
        
        const metadata = {
          organization: this.organization,
          project: this.project,
          workItemTypes,
          fields: enhancedFields,
          iterations,
          areas,
          teamMembers,
          commonFields: this.getCommonFieldMappings(),
          queryOperators: this.getQueryOperators(),
          timestamp: Date.now()
        };
        
        console.log('MetadataClient: Successfully fetched metadata:', {
          workItemTypesCount: Object.keys(workItemTypes).length,
          fieldsCount: Object.keys(enhancedFields).length,
          iterationsCount: iterations.length,
          areasCount: areas.length,
          teamMembersCount: teamMembers.length
        });
        
        return metadata;
      } catch (error) {
        console.error('MetadataClient: Error fetching comprehensive metadata:', error);
        return this.getFallbackMetadata();
      }
    }
    
    /**
     * Get common field mappings for natural language processing
     */
    getCommonFieldMappings() {
      return {
        // Assignment fields
        'assigned to': 'System.AssignedTo',
        'assignee': 'System.AssignedTo',
        'owner': 'System.AssignedTo',
        'created by': 'System.CreatedBy',
        'author': 'System.CreatedBy',
        'changed by': 'System.ChangedBy',
        'modified by': 'System.ChangedBy',
        
        // State fields
        'state': 'System.State',
        'status': 'System.State',
        
        // Priority fields
        'priority': 'Microsoft.VSTS.Common.Priority',
        'severity': 'Microsoft.VSTS.Common.Severity',
        
        // Time fields
        'created': 'System.CreatedDate',
        'created date': 'System.CreatedDate',
        'modified': 'System.ChangedDate',
        'changed': 'System.ChangedDate',
        'updated': 'System.ChangedDate',
        
        // Work item fields
        'title': 'System.Title',
        'description': 'System.Description',
        'type': 'System.WorkItemType',
        'id': 'System.Id',
        
        // Iteration fields
        'iteration': 'System.IterationPath',
        'sprint': 'System.IterationPath',
        'area': 'System.AreaPath',
        
        // Story points
        'story points': 'Microsoft.VSTS.Scheduling.StoryPoints',
        'points': 'Microsoft.VSTS.Scheduling.StoryPoints',
        'effort': 'Microsoft.VSTS.Scheduling.Effort',
        
        // Tags
        'tags': 'System.Tags',
        'tag': 'System.Tags'
      };
    }
    
    /**
     * Get supported query operators
     */
    getQueryOperators() {
      return {
        equality: ['=', '<>', '!='],
        comparison: ['>', '<', '>=', '<='],
        text: ['CONTAINS', 'CONTAINS WORDS', 'DOES NOT CONTAIN', 'DOES NOT CONTAIN WORDS'],
        list: ['IN', 'NOT IN'],
        date: ['@Today', '@StartOfWeek', '@StartOfMonth', '@StartOfYear'],
        special: ['@Me', '@CurrentIteration', '@TeamAreas']
      };
    }
    
    /**
     * Get fallback metadata when API calls fail
     */
    getFallbackMetadata() {
      return {
        organization: this.organization,
        project: this.project,
        workItemTypes: {
          'Bug': {
            name: 'Bug',
            referenceName: 'Microsoft.VSTS.WorkItemTypes.Bug',
            fields: {
              'System.Title': { name: 'Title', type: 'String' },
              'System.State': { name: 'State', type: 'String', allowedValues: ['New', 'Active', 'Resolved', 'Closed'] },
              'System.AssignedTo': { name: 'Assigned To', type: 'Identity' },
              'Microsoft.VSTS.Common.Priority': { name: 'Priority', type: 'Integer', allowedValues: [1, 2, 3, 4] },
              'Microsoft.VSTS.Common.Severity': { name: 'Severity', type: 'String', allowedValues: ['1 - Critical', '2 - High', '3 - Medium', '4 - Low'] }
            }
          },
          'User Story': {
            name: 'User Story',
            referenceName: 'Microsoft.VSTS.WorkItemTypes.UserStory',
            fields: {
              'System.Title': { name: 'Title', type: 'String' },
              'System.State': { name: 'State', type: 'String', allowedValues: ['New', 'Active', 'Resolved', 'Closed'] },
              'System.AssignedTo': { name: 'Assigned To', type: 'Identity' },
              'Microsoft.VSTS.Common.Priority': { name: 'Priority', type: 'Integer', allowedValues: [1, 2, 3, 4] },
              'Microsoft.VSTS.Scheduling.StoryPoints': { name: 'Story Points', type: 'Double' }
            }
          },
          'Task': {
            name: 'Task',
            referenceName: 'Microsoft.VSTS.WorkItemTypes.Task',
            fields: {
              'System.Title': { name: 'Title', type: 'String' },
              'System.State': { name: 'State', type: 'String', allowedValues: ['New', 'Active', 'Closed'] },
              'System.AssignedTo': { name: 'Assigned To', type: 'Identity' },
              'Microsoft.VSTS.Common.Priority': { name: 'Priority', type: 'Integer', allowedValues: [1, 2, 3, 4] }
            }
          }
        },
        fields: {},
        iterations: [],
        areas: [],
        teamMembers: [],
        commonFields: this.getCommonFieldMappings(),
        queryOperators: this.getQueryOperators(),
        timestamp: Date.now(),
        isFallback: true
      };
    }
  }
  
  // Make the class globally available
  window.ADONaturale_MetadataClient = MetadataClient;
  
})(); 