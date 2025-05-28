# Azure DevOps Natural Language Query Extension - Project Plan

## Project Overview
A Microsoft Edge extension that integrates into Azure DevOps to allow natural language querying by converting user input to query URLs and navigating to the results within the Azure DevOps interface.

## Core Requirements
- **Target Platform**: Microsoft Edge Extension (Manifest V3)
- **Integration Point**: All Azure DevOps pages (`https://microsoft.visualstudio.com/*` and `https://dev.azure.com/*`)
- **Authentication**: Use existing ADO session/cookies
- **Functionality**: Convert natural language → Query URL → Navigate to results
- **UI Integration**: Minimizable interface positioned at the bottom of the screen

## Technical Architecture

### 1. Extension Structure
```
ado-naturale/
├── manifest.json              # Extension manifest (V3)
├── background/
│   └── service-worker.js      # Background service worker
├── content/
│   ├── content-script.js      # Main content script for ADO pages
│   ├── ui-injector.js         # UI component injection
│   └── query-executor.js      # Query execution logic
├── popup/
│   ├── popup.html            # Extension popup (optional)
│   ├── popup.js              # Popup logic
│   └── popup.css             # Popup styles
├── shared/
│   ├── api-client.js         # ADO API interaction
│   ├── nl-processor.js       # Natural language processing
│   └── url-generator.js      # URL query generation
└── styles/
    └── content.css           # Injected styles
```

### 2. Core Components

#### A. Natural Language Processor
- **Input**: Natural language queries
- **Processing**: Parse intent, entities, and context
- **Output**: Structured query parameters
- **Technology**: Azure OpenAI Service (since you're at Microsoft)

#### B. URL Generator
- **Input**: Structured query parameters
- **Processing**: Generate valid Azure DevOps query URLs
- **Output**: Navigable URL string
- **Features**: Support for complex queries, dates ranges, etc.

#### C. ADO Integration Layer
- **Navigation**: Use URL-based approach to show query results
- **Result Handling**: Let ADO handle result display via its native URL structure
- **Session Management**: Leverage existing authentication

#### D. UI Components
- **Query Input Box**: Natural language input field positioned at bottom of screen
- **Minimize/Maximize**: Toggle between collapsed and expanded states
- **Quick Actions**: Common query templates
- **History**: Recent queries and favorites

## Feature Breakdown

### Phase 1: Core Functionality
1. **Basic Extension Setup**
   - Manifest V3 configuration
   - Content script injection on ADO query pages
   - Basic UI integration

2. **Simple Query Processing**
   - Basic natural language understanding
   - Simple WIQL generation (assigned to me, created by me, etc.)
   - Query execution integration

3. **UI Integration**
   - Inject query input box into ADO interface
   - Style matching ADO design system
   - Basic error handling

### Phase 2: Enhanced Queries
1. **Advanced Query Types**
   - Date range queries ("last week", "this sprint")
   - Status and state queries
   - Assignment and team queries
   - Work item type filtering

2. **Context Awareness**
   - Current project detection
   - Current iteration/sprint context
   - User role and permissions awareness

3. **Query Templates**
   - Pre-built common queries
   - User-customizable templates
   - Smart suggestions

### Phase 3: Advanced Features
1. **Complex Query Support**
   - Multi-condition queries
   - Hierarchical queries (parent/child relationships)
   - Cross-project queries
   - Custom field queries

2. **Learning & Optimization**
   - Query history and favorites
   - Usage analytics
   - Query optimization suggestions

3. **Integration Enhancements**
   - Keyboard shortcuts
   - Right-click context menus
   - Bulk operations support

## Technical Implementation Details

### 1. Content Script Integration
```javascript
// Detect any ADO pages
if (window.location.href.includes('visualstudio.com') || window.location.href.includes('dev.azure.com')) {
    injectNaturalLanguageInterface();
}
```

### 2. URL Generation Strategy
- **Entity Recognition**: Users, dates, work item types, fields
- **Intent Classification**: Search, filter, sort, group
- **Context Integration**: Current project, iteration, team
- **Query Building**: Construct valid ADO query URLs

### 3. Common Query Patterns
```
-- "Show me my bugs"
https://dev.azure.com/{org}/{project}/_queries/query/?wiql=SELECT%20*%20FROM%20WorkItems%20WHERE%20[System.WorkItemType]%20=%20'Bug'%20AND%20[System.AssignedTo]%20=%20@Me

-- "Items created last week"
https://dev.azure.com/{org}/{project}/_queries/query/?wiql=SELECT%20*%20FROM%20WorkItems%20WHERE%20[System.CreatedDate]%20>=%20@Today-7

-- "High priority user stories in current iteration"
https://dev.azure.com/{org}/{project}/_queries/query/?wiql=SELECT%20*%20FROM%20WorkItems%20WHERE%20[System.WorkItemType]%20=%20'User%20Story'%20AND%20[System.Priority]%20<=%202%20AND%20[System.IterationPath]%20=%20@CurrentIteration
```

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up extension structure and manifest
- [ ] Implement content script injection
- [ ] Create basic UI components
- [ ] Set up ADO page detection and integration points
- [ ] Implement basic WIQL execution

### Phase 2: Core NL Processing (Week 3-4)
- [ ] Integrate Azure OpenAI for natural language processing
- [ ] Implement basic query pattern recognition
- [ ] Create WIQL generation engine
- [ ] Add support for common query types
- [ ] Implement error handling and validation

### Phase 3: Enhanced Features (Week 5-6)
- [ ] Add context awareness (project, iteration, user)
- [ ] Implement query templates and suggestions
- [ ] Add query history and favorites
- [ ] Enhance UI with better integration
- [ ] Add keyboard shortcuts and accessibility

### Phase 4: Advanced Capabilities (Week 7-8)
- [ ] Support complex multi-condition queries
- [ ] Add cross-project query capabilities
- [ ] Implement query optimization
- [ ] Add analytics and usage tracking
- [ ] Performance optimization and testing

## Success Metrics
- **Functionality**: Successfully converts 90%+ of common natural language queries to valid WIQL
- **Integration**: Seamlessly integrates with ADO interface without breaking existing functionality
- **Performance**: Query processing and execution under 2 seconds
- **Usability**: Reduces time to create complex queries by 50%+

## Risk Mitigation
- **ADO UI Changes**: Monitor for ADO interface updates that might break integration
- **API Limits**: Implement rate limiting and caching for OpenAI calls
- **Security**: Ensure no sensitive data is sent to external services
- **Performance**: Optimize for large result sets and complex queries

## Next Steps
1. Set up development environment
2. Create basic extension structure
3. Implement ADO page detection
4. Begin UI integration work
5. Set up Azure OpenAI integration 