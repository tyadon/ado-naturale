/**
 * ADO Naturale - Metadata Client
 * Fetches comprehensive field metadata from Azure DevOps to enhance NLP capabilities
 */

(function() {
  'use strict';
  
  // Singleton instance
  let metadataClientInstance = null;
  
  /**
   * Metadata Client class for fetching ADO field information
   */
  class MetadataClient {
    constructor() {
      // Return singleton instance if it exists
      if (metadataClientInstance) {
        return metadataClientInstance;
      }
      
      console.log('MetadataClient: Creating new singleton instance');
      console.log('MetadataClient: Current window.location.href:', window.location.href);
      
      this.baseUrl = this.extractBaseUrl();
      this.organization = this.extractOrganization();
      this.project = this.extractProject();
      this.cache = new Map();
      this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours (daily cache)
      this.storageKey = `adoNaturale_metadata_${this.organization}_${this.project}`;
      
      console.log('MetadataClient: Initialized with:', {
        baseUrl: this.baseUrl,
        organization: this.organization,
        project: this.project,
        currentUrl: window.location.href,
        cacheExpiryHours: 24,
        storageKey: this.storageKey
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
      
      // Set singleton instance
      metadataClientInstance = this;
      
      // Load cached data from storage on initialization
      this.loadCacheFromStorage();
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
      const now = Date.now();
      
      // Check if cached data exists and is not expired
      if (cached && (now - cached.timestamp) < this.cacheExpiry) {
        const ageHours = Math.round((now - cached.timestamp) / (1000 * 60 * 60) * 100) / 100;
        console.log(`📂 MetadataClient: Using cached data for ${key} (${ageHours} hours old)`);
        return cached.data;
      }
      
      // If cached data exists but is expired
      if (cached) {
        const ageHours = Math.round((now - cached.timestamp) / (1000 * 60 * 60) * 100) / 100;
        console.log(`⏰ MetadataClient: Cached data for ${key} expired (${ageHours} hours old), fetching fresh data`);
      } else {
        console.log(`🆕 MetadataClient: No cached data for ${key}, fetching fresh data`);
      }
      
      try {
        const data = await fetchFunction();
        this.cache.set(key, {
          data,
          timestamp: now
        });
        
        // Save to persistent storage
        this.saveCacheToStorage();
        
        console.log(`✅ MetadataClient: Cached fresh data for ${key}`);
        return data;
      } catch (error) {
        // Return cached data if available, even if expired
        if (cached) {
          const ageHours = Math.round((now - cached.timestamp) / (1000 * 60 * 60) * 100) / 100;
          console.warn(`⚠️ MetadataClient: Using expired cache for ${key} due to fetch error (${ageHours} hours old):`, error);
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
          timestamp: Date.now(),
          cacheInfo: {
            cacheExpiry: this.cacheExpiry,
            nextRefresh: new Date(Date.now() + this.cacheExpiry).toISOString()
          }
        };
        
        console.log('MetadataClient: Successfully fetched metadata:', {
          workItemTypesCount: Object.keys(workItemTypes).length,
          fieldsCount: Object.keys(enhancedFields).length,
          iterationsCount: iterations.length,
          areasCount: areas.length,
          teamMembersCount: teamMembers.length
        });
        
        // 🔍 COMPREHENSIVE DEBUG OUTPUT FOR ANALYSIS
        console.group('🔍 ADO NATURALE - COMPLETE METADATA DEBUG');
        console.log('📊 METADATA SUMMARY:');
        console.table({
          'Organization': metadata.organization,
          'Project': metadata.project,
          'Work Item Types': Object.keys(workItemTypes).length,
          'Fields': Object.keys(enhancedFields).length,
          'Iterations': iterations.length,
          'Areas': areas.length,
          'Team Members': teamMembers.length,
          'Cache Expiry': '24 hours',
          'Next Refresh': metadata.cacheInfo.nextRefresh
        });
        
        console.log('📋 FULL METADATA JSON (copy this for analysis):');
        console.log(JSON.stringify(metadata, null, 2));
        
        console.log('💾 To save metadata to file, run this in console:');
        console.log(`
const metadata = ${JSON.stringify(metadata, null, 2)};
const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'ado-naturale-metadata-${metadata.organization}-${metadata.project}-${new Date().toISOString().split('T')[0]}.json';
a.click();
URL.revokeObjectURL(url);
        `);
        
        // Make metadata available globally for debugging
        if (typeof window !== 'undefined') {
          window.ADONaturale_DebugMetadata = metadata;
          console.log('🌐 Metadata also available globally as: window.ADONaturale_DebugMetadata');
        }
        
        console.groupEnd();
        
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
        isFallback: true,
        cacheInfo: {
          cacheExpiry: this.cacheExpiry,
          nextRefresh: new Date(Date.now() + this.cacheExpiry).toISOString()
        }
      };
    }
    
    /**
     * 🔧 DEBUG HELPERS - Manual cache management and debugging
     */
    
    /**
     * Force refresh metadata (ignores cache)
     */
    async forceRefreshMetadata() {
      console.log('🔄 MetadataClient: Force refreshing metadata...');
      this.cache.clear();
      localStorage.removeItem(this.storageKey);
      const metadata = await this.getComprehensiveMetadata();
      console.log('✅ MetadataClient: Force refresh completed');
      return metadata;
    }
    
    /**
     * Get cache status and information
     */
    getCacheStatus() {
      const cacheKeys = Array.from(this.cache.keys());
      const cacheStatus = {};
      const now = Date.now();
      
      cacheKeys.forEach(key => {
        const cached = this.cache.get(key);
        const age = now - cached.timestamp;
        const isExpired = age > this.cacheExpiry;
        
        cacheStatus[key] = {
          ageMs: age,
          ageHours: Math.round(age / (1000 * 60 * 60) * 100) / 100,
          isExpired,
          size: JSON.stringify(cached.data).length,
          timestamp: new Date(cached.timestamp).toISOString()
        };
      });
      
      const status = {
        cacheExpiryHours: this.cacheExpiry / (1000 * 60 * 60),
        totalCacheEntries: cacheKeys.length,
        cacheEntries: cacheStatus,
        nextRefreshAfter: new Date(now + this.cacheExpiry).toISOString(),
        storageKey: this.storageKey,
        isSingleton: metadataClientInstance === this
      };
      
      console.log('📈 MetadataClient Cache Status:');
      console.table(cacheStatus);
      console.log('Storage Info:', {
        storageKey: this.storageKey,
        hasStorageData: !!localStorage.getItem(this.storageKey),
        isSingleton: metadataClientInstance === this
      });
      
      return status;
    }
    
    /**
     * Clear all cache (memory and storage)
     */
    clearCache() {
      console.log('🗑️ MetadataClient: Clearing all cache...');
      this.cache.clear();
      localStorage.removeItem(this.storageKey);
      console.log('✅ MetadataClient: Cache cleared (memory and storage)');
    }
    
    /**
     * Download metadata as JSON file
     */
    downloadMetadataAsJson(metadata = null) {
      if (!metadata) {
        if (window.ADONaturale_DebugMetadata) {
          metadata = window.ADONaturale_DebugMetadata;
        } else {
          console.error('❌ No metadata available to download. Fetch metadata first.');
          return;
        }
      }
      
      const filename = `ado-naturale-metadata-${metadata.organization}-${metadata.project}-${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log(`💾 Downloaded metadata as: ${filename}`);
    }
    
    /**
     * Save cached data to storage
     */
    saveCacheToStorage() {
      try {
        const cacheData = JSON.stringify(Array.from(this.cache.entries()));
        localStorage.setItem(this.storageKey, cacheData);
        console.log('MetadataClient: Saved cached data to storage');
      } catch (error) {
        console.warn('MetadataClient: Failed to save cache to storage:', error);
      }
    }
    
    /**
     * Load cached data from storage on initialization
     */
    loadCacheFromStorage() {
      try {
        const cachedData = localStorage.getItem(this.storageKey);
        if (cachedData) {
          const cacheEntries = JSON.parse(cachedData);
          this.cache = new Map(cacheEntries);
          
          // Check if any cached data is still valid
          const now = Date.now();
          let validEntries = 0;
          let expiredEntries = 0;
          
          for (const [key, value] of this.cache.entries()) {
            if (value && value.timestamp && (now - value.timestamp) < this.cacheExpiry) {
              validEntries++;
            } else {
              expiredEntries++;
            }
          }
          
          console.log('MetadataClient: Loaded cached data from storage:', {
            totalEntries: this.cache.size,
            validEntries,
            expiredEntries,
            storageKey: this.storageKey
          });
          
          // Clean up expired entries
          if (expiredEntries > 0) {
            for (const [key, value] of this.cache.entries()) {
              if (!value || !value.timestamp || (now - value.timestamp) >= this.cacheExpiry) {
                this.cache.delete(key);
              }
            }
            this.saveCacheToStorage();
            console.log(`🗑️ MetadataClient: Cleaned up ${expiredEntries} expired cache entries`);
          }
        } else {
          console.log('MetadataClient: No cached data found in storage');
        }
      } catch (error) {
        console.warn('MetadataClient: Failed to load cache from storage:', error);
        this.cache = new Map(); // Reset to empty cache
      }
    }
  }
  
  // Make the class globally available
  window.ADONaturale_MetadataClient = MetadataClient;
  
  // 🔧 GLOBAL DEBUG HELPERS for easy console access
  if (typeof window !== 'undefined') {
    window.ADONaturale_Debug = {
      /**
       * Get current metadata (from cache if available)
       */
      async getMetadata() {
        const client = new window.ADONaturale_MetadataClient(); // Uses singleton
        return await client.getComprehensiveMetadata();
      },
      
      /**
       * Force refresh metadata (ignores cache)
       */
      async refreshMetadata() {
        const client = new window.ADONaturale_MetadataClient(); // Uses singleton
        return await client.forceRefreshMetadata();
      },
      
      /**
       * Get cache status
       */
      getCacheStatus() {
        const client = new window.ADONaturale_MetadataClient(); // Uses singleton
        return client.getCacheStatus();
      },
      
      /**
       * Clear cache (memory and storage)
       */
      clearCache() {
        const client = new window.ADONaturale_MetadataClient(); // Uses singleton
        client.clearCache();
      },
      
      /**
       * Download metadata as JSON file
       */
      downloadMetadata() {
        const client = new window.ADONaturale_MetadataClient(); // Uses singleton
        client.downloadMetadataAsJson();
      },
      
      /**
       * Get singleton instance info
       */
      getSingletonInfo() {
        const client1 = new window.ADONaturale_MetadataClient();
        const client2 = new window.ADONaturale_MetadataClient();
        console.log('Singleton test:', {
          sameInstance: client1 === client2,
          cacheSize: client1.cache.size,
          storageKey: client1.storageKey
        });
        return client1 === client2;
      },
      
      /**
       * Display help for debugging commands
       */
      help() {
        console.group('🔧 ADO NATURALE DEBUG COMMANDS');
        console.log('Use these commands in the browser console:');
        console.log('');
        console.log('📋 ADONaturale_Debug.getMetadata()       - Get current metadata');
        console.log('🔄 ADONaturale_Debug.refreshMetadata()   - Force refresh metadata');
        console.log('📈 ADONaturale_Debug.getCacheStatus()    - Show cache status');
        console.log('🗑️ ADONaturale_Debug.clearCache()        - Clear all cache');
        console.log('💾 ADONaturale_Debug.downloadMetadata()  - Download metadata as JSON');
        console.log('🔧 ADONaturale_Debug.getSingletonInfo()  - Test singleton pattern');
        console.log('');
        console.log('🌐 window.ADONaturale_DebugMetadata      - Access last fetched metadata');
        console.log('');
        console.log('💡 Example usage:');
        console.log('   await ADONaturale_Debug.refreshMetadata()');
        console.log('   ADONaturale_Debug.downloadMetadata()');
        console.log('   ADONaturale_Debug.getSingletonInfo()');
        console.groupEnd();
      }
    };
    
    // Show help on load
    console.log('🔧 ADO Naturale Debug helpers loaded! Type ADONaturale_Debug.help() for commands.');
    console.log('🔧 Singleton MetadataClient pattern enabled for persistent 24-hour caching.');
  }
  
})(); 