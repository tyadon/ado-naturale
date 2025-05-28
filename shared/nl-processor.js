/**
 * ADO Naturale - Natural Language Processor
 * Processes natural language queries and extracts structured information
 */

(function() {
  'use strict';
  
  /**
   * Natural Language Processor class
   */
  class NaturalLanguageProcessor {
    constructor() {
      this.patterns = this.initializePatterns();
      this.entities = this.initializeEntities();
    }
    
    /**
     * Initialize query patterns for matching
     */
    initializePatterns() {
      return {
        // Assignment patterns
        assignedToMe: [
          /assigned to me/i,
          /my (work items?|tasks?|bugs?|stories?)/i,
          /items? assigned to me/i,
          /work items? for me/i
        ],
        
        createdByMe: [
          /created by me/i,
          /i created/i,
          /items? i created/i,
          /my created (work items?|tasks?|bugs?|stories?)/i
        ],
        
        // Work item types
        bugs: [
          /bugs?/i,
          /defects?/i,
          /issues?/i
        ],
        
        userStories: [
          /user stories?/i,
          /stories?/i,
          /requirements?/i
        ],
        
        tasks: [
          /tasks?/i,
          /work items?/i,
          /todos?/i
        ],
        
        features: [
          /features?/i,
          /epics?/i
        ],
        
        // Priority patterns
        highPriority: [
          /high priority/i,
          /priority 1/i,
          /p1/i,
          /critical/i,
          /urgent/i
        ],
        
        lowPriority: [
          /low priority/i,
          /priority 3/i,
          /priority 4/i,
          /p3/i,
          /p4/i
        ],
        
        // State patterns
        active: [
          /active/i,
          /in progress/i,
          /working/i,
          /started/i
        ],
        
        new: [
          /new/i,
          /created/i,
          /fresh/i
        ],
        
        resolved: [
          /resolved/i,
          /fixed/i,
          /completed?/i,
          /done/i,
          /closed/i
        ],
        
        // Time patterns
        today: [
          /today/i,
          /this day/i
        ],
        
        thisWeek: [
          /this week/i,
          /past week/i,
          /last 7 days?/i
        ],
        
        lastWeek: [
          /last week/i,
          /previous week/i,
          /past week/i
        ],
        
        thisMonth: [
          /this month/i,
          /past month/i,
          /last 30 days?/i
        ],
        
        thisSprint: [
          /this sprint/i,
          /current sprint/i,
          /this iteration/i,
          /current iteration/i
        ]
      };
    }
    
    /**
     * Initialize entity extraction patterns
     */
    initializeEntities() {
      return {
        // User mentions
        userMention: /@([a-zA-Z0-9._-]+)/g,
        
        // Date patterns
        datePattern: /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{1,2}-\d{1,2})/g,
        
        // Number patterns
        numberPattern: /\b(\d+)\b/g,
        
        // Work item ID patterns
        workItemId: /#(\d+)/g,
        
        // Priority numbers
        priorityNumber: /priority\s*(\d+)/i
      };
    }
    
    /**
     * Process natural language query
     */
    processQuery(query, context = {}) {
      console.log('Processing natural language query:', query);
      
      const result = {
        originalQuery: query,
        intent: this.extractIntent(query),
        entities: this.extractEntities(query, context),
        filters: this.extractFilters(query, context),
        timeRange: this.extractTimeRange(query),
        workItemTypes: this.extractWorkItemTypes(query),
        confidence: 0
      };
      
      // Calculate confidence score
      result.confidence = this.calculateConfidence(result);
      
      console.log('Processed query result:', result);
      return result;
    }
    
    /**
     * Extract intent from query
     */
    extractIntent(query) {
      const intents = {
        search: ['find', 'search', 'show', 'get', 'list', 'display'],
        filter: ['filter', 'where', 'with', 'having'],
        count: ['count', 'how many', 'number of'],
        sort: ['sort', 'order', 'arrange']
      };
      
      const lowerQuery = query.toLowerCase();
      
      for (const [intent, keywords] of Object.entries(intents)) {
        if (keywords.some(keyword => lowerQuery.includes(keyword))) {
          return intent;
        }
      }
      
      return 'search'; // Default intent
    }
    
    /**
     * Extract entities from query
     */
    extractEntities(query, context) {
      const entities = {
        users: [],
        workItemIds: [],
        dates: [],
        numbers: [],
        priorities: []
      };
      
      // Extract user mentions
      const userMatches = query.matchAll(this.entities.userMention);
      for (const match of userMatches) {
        entities.users.push(match[1]);
      }
      
      // Extract work item IDs
      const workItemMatches = query.matchAll(this.entities.workItemId);
      for (const match of workItemMatches) {
        entities.workItemIds.push(parseInt(match[1]));
      }
      
      // Extract dates
      const dateMatches = query.matchAll(this.entities.datePattern);
      for (const match of dateMatches) {
        entities.dates.push(match[1]);
      }
      
      // Extract numbers
      const numberMatches = query.matchAll(this.entities.numberPattern);
      for (const match of numberMatches) {
        entities.numbers.push(parseInt(match[1]));
      }
      
      // Extract priority numbers
      const priorityMatch = query.match(this.entities.priorityNumber);
      if (priorityMatch) {
        entities.priorities.push(parseInt(priorityMatch[1]));
      }
      
      return entities;
    }
    
    /**
     * Extract filters from query
     */
    extractFilters(query, context) {
      const filters = {
        assignedTo: null,
        createdBy: null,
        state: [],
        priority: [],
        workItemType: []
      };
      
      // Check assignment patterns
      if (this.matchesAnyPattern(query, this.patterns.assignedToMe)) {
        filters.assignedTo = '@Me';
      }
      
      if (this.matchesAnyPattern(query, this.patterns.createdByMe)) {
        filters.createdBy = '@Me';
      }
      
      // Check state patterns
      if (this.matchesAnyPattern(query, this.patterns.active)) {
        filters.state.push('Active');
      }
      
      if (this.matchesAnyPattern(query, this.patterns.new)) {
        filters.state.push('New');
      }
      
      if (this.matchesAnyPattern(query, this.patterns.resolved)) {
        filters.state.push('Resolved', 'Closed', 'Done');
      }
      
      // Check priority patterns
      if (this.matchesAnyPattern(query, this.patterns.highPriority)) {
        filters.priority.push(1, 2);
      }
      
      if (this.matchesAnyPattern(query, this.patterns.lowPriority)) {
        filters.priority.push(3, 4);
      }
      
      return filters;
    }
    
    /**
     * Extract time range from query
     */
    extractTimeRange(query) {
      const timeRange = {
        type: null,
        start: null,
        end: null
      };
      
      if (this.matchesAnyPattern(query, this.patterns.today)) {
        timeRange.type = 'today';
        timeRange.start = '@Today';
      } else if (this.matchesAnyPattern(query, this.patterns.thisWeek)) {
        timeRange.type = 'thisWeek';
        timeRange.start = '@Today - 7';
      } else if (this.matchesAnyPattern(query, this.patterns.lastWeek)) {
        timeRange.type = 'lastWeek';
        timeRange.start = '@Today - 14';
        timeRange.end = '@Today - 7';
      } else if (this.matchesAnyPattern(query, this.patterns.thisMonth)) {
        timeRange.type = 'thisMonth';
        timeRange.start = '@Today - 30';
      } else if (this.matchesAnyPattern(query, this.patterns.thisSprint)) {
        timeRange.type = 'thisSprint';
        timeRange.start = '@CurrentIteration';
      }
      
      return timeRange;
    }
    
    /**
     * Extract work item types from query
     */
    extractWorkItemTypes(query) {
      const types = [];
      
      if (this.matchesAnyPattern(query, this.patterns.bugs)) {
        types.push('Bug');
      }
      
      if (this.matchesAnyPattern(query, this.patterns.userStories)) {
        types.push('User Story');
      }
      
      if (this.matchesAnyPattern(query, this.patterns.tasks)) {
        types.push('Task');
      }
      
      if (this.matchesAnyPattern(query, this.patterns.features)) {
        types.push('Feature', 'Epic');
      }
      
      return types;
    }
    
    /**
     * Check if query matches any pattern in array
     */
    matchesAnyPattern(query, patterns) {
      return patterns.some(pattern => pattern.test(query));
    }
    
    /**
     * Calculate confidence score for the processed query
     */
    calculateConfidence(result) {
      let score = 0;
      let maxScore = 0;
      
      // Intent recognition
      maxScore += 20;
      if (result.intent) {
        score += 20;
      }
      
      // Work item type recognition
      maxScore += 25;
      if (result.workItemTypes.length > 0) {
        score += 25;
      }
      
      // Filter recognition
      maxScore += 30;
      const filterCount = Object.values(result.filters).filter(f => 
        f !== null && (Array.isArray(f) ? f.length > 0 : true)
      ).length;
      score += Math.min(filterCount * 10, 30);
      
      // Time range recognition
      maxScore += 15;
      if (result.timeRange.type) {
        score += 15;
      }
      
      // Entity recognition
      maxScore += 10;
      const entityCount = Object.values(result.entities).reduce((sum, arr) => 
        sum + (Array.isArray(arr) ? arr.length : 0), 0
      );
      score += Math.min(entityCount * 2, 10);
      
      return Math.round((score / maxScore) * 100);
    }
    
    /**
     * Get suggestions for improving query
     */
    getSuggestions(query, result) {
      const suggestions = [];
      
      if (result.confidence < 50) {
        suggestions.push('Try being more specific about what you\'re looking for');
      }
      
      if (result.workItemTypes.length === 0) {
        suggestions.push('Specify work item type (bugs, user stories, tasks, etc.)');
      }
      
      if (!result.filters.assignedTo && !result.filters.createdBy) {
        suggestions.push('Add assignment information (assigned to me, created by me)');
      }
      
      if (!result.timeRange.type) {
        suggestions.push('Add time context (this week, last month, etc.)');
      }
      
      return suggestions;
    }
    
    /**
     * Get example queries
     */
    getExampleQueries() {
      return [
        'Show me my bugs',
        'High priority user stories assigned to me',
        'Tasks created this week',
        'Resolved bugs from last sprint',
        'All user stories in current iteration',
        'Critical issues assigned to @john.doe',
        'Work items I created this month',
        'Active tasks with priority 1'
      ];
    }
  }
  
  // Make the class globally available
  window.ADONaturale_NLProcessor = NaturalLanguageProcessor;
  
})(); 