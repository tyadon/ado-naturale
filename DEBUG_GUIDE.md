# ADO Naturale Debug Guide

## Overview
Comprehensive debug statements have been implemented throughout the entire query execution flow to help you trace what's happening step by step.

## Debug Categories

### Content Script Debug Categories
- **INIT**: Initialization process
- **PAGE_VALIDATION**: URL pattern matching
- **CONTEXT**: Page context extraction
- **ADO_INTERFACE**: Waiting for ADO elements
- **UI_INIT**: UI component initialization
- **SETTINGS**: Extension settings loading
- **URL_CHANGE**: SPA navigation detection
- **MESSAGE**: Extension message handling
- **METADATA_STATUS**: Metadata status requests
- **METADATA_INFO**: Metadata information requests
- **METADATA_REFRESH**: Metadata refresh operations
- **OPENAI_TEST**: OpenAI connection testing
- **CLEANUP**: Resource cleanup

### UI Injector Debug Categories
- **INJECT**: Interface injection process
- **CREATE_UI**: UI element creation
- **EVENTS**: Event listener attachment
- **QUERY_SUBMIT**: Query submission flow
- **PROCESSOR_CHECK**: Available processor detection
- **QUERY_PROCESSING**: Query processing stages
- **QUERY_EXECUTION**: Query URL execution
- **EXECUTE_QUERY**: Query executor operations
- **BACKGROUND_MESSAGE**: Background script communication
- **SAVE_HISTORY**: Query history saving
- **UI_STATE**: UI state changes
- **UI_ERROR**: Error display
- **UI_TOGGLE**: Interface visibility toggle
- **SUCCESS_FEEDBACK**: Success feedback display
- **CLEANUP**: UI cleanup

### Enhanced NL Processor Debug Categories
- **CONSTRUCTOR**: Instance creation
- **INITIALIZE**: Initialization process
- **METADATA_LOAD**: Metadata loading operations
- **PROCESS_QUERY**: Main query processing flow
- **AI_PROCESSING**: Azure OpenAI processing

### OpenAI Client Debug Categories
- **CONSTRUCTOR**: Instance creation
- **CONFIG_LOAD**: Configuration loading from storage
- **CONFIG_SET**: Configuration updates
- **CONFIG_CHECK**: Configuration validation
- **GENERATE_URL**: URL generation process
- **API_CALL**: Azure OpenAI API interactions
- **TEST_CONNECTION**: Connection testing
- **FALLBACK**: Pattern matching fallback
- **EXPORT**: Global export operations

## How to Use

### 1. Open Browser Console
- Open Azure DevOps in your browser
- Press F12 to open Developer Tools
- Go to the Console tab

### 2. Filter Debug Messages
You can filter messages by category using the browser's console filter:

```
🔍 [ADO-Naturale]        # All debug messages
🔍 [UI-Injector]         # UI-related messages
🔍 [Enhanced-NL-Processor] # NL processing messages
🔍 [OpenAI-Client]       # OpenAI API messages
```

### 3. Trace Query Execution Flow

When you submit a query, you should see logs in this sequence:

1. **Query Submission Start**
   ```
   🔍 [UI-Injector][QUERY_SUBMIT] Query submission started
   ```

2. **Processor Selection**
   ```
   🔍 [UI-Injector][PROCESSOR_CHECK] Checking available natural language processors
   ```

3. **Query Processing**
   ```
   🔍 [Enhanced-NL-Processor][PROCESS_QUERY] Starting query processing
   ```

4. **AI Processing (if configured)**
   ```
   🔍 [Enhanced-NL-Processor][AI_PROCESSING] Starting AI processing
   🔍 [OpenAI-Client][GENERATE_URL] Starting query URL generation
   🔍 [OpenAI-Client][API_CALL] Making fetch request to Azure OpenAI
   ```

5. **Query Execution**
   ```
   🔍 [UI-Injector][EXECUTE_QUERY] Starting query execution
   ```

### 4. Common Debug Scenarios

#### Check if OpenAI is Configured
Look for:
```
🔍 [OpenAI-Client][CONFIG_CHECK] Checking configuration status
```

#### Trace API Calls
Look for:
```
🔍 [OpenAI-Client][API_CALL] Preparing Azure OpenAI API call
🔍 [OpenAI-Client][API_CALL] Received HTTP response
```

#### Check Metadata Loading
Look for:
```
🔍 [Enhanced-NL-Processor][METADATA_LOAD] Loading comprehensive metadata from client
```

#### Trace Fallback Behavior
Look for:
```
🔍 [OpenAI-Client][FALLBACK] Using pattern matching fallback
```

## Troubleshooting Common Issues

### 1. Extension Not Loading
Check for:
- `🔍 [ADO-Naturale][INIT] Content script loading`
- `🔍 [ADO-Naturale][PAGE_VALIDATION] Testing URL patterns`

### 2. UI Not Appearing
Check for:
- `🔍 [ADO-Naturale][UI_INIT] UI Injector is available`
- `🔍 [UI-Injector][INJECT] Natural language interface injected successfully`

### 3. OpenAI Not Working
Check for:
- `🔍 [OpenAI-Client][CONFIG_CHECK] Checking configuration status`
- `❌ [OpenAI-Client][API_CALL] API returned error response`

### 4. Metadata Issues
Check for:
- `🔍 [Enhanced-NL-Processor][METADATA_LOAD] Metadata loaded successfully`
- `❌ [Enhanced-NL-Processor][METADATA_LOAD] Failed to load metadata`

## Debug Message Format

All debug messages follow this format:
```
[EMOJI] [COMPONENT][CATEGORY][TIMESTAMP] Message {data}
```

- **🔍** = Info/Debug
- **⚠️** = Warning  
- **❌** = Error
- **✅** = Success

## Performance Monitoring

The debug messages include timing information:
- `initTime`: Initialization duration
- `processingTime`: Query processing duration
- `fetchTime`: API call duration
- `apiCallTime`: Total API interaction time

Look for these in the debug data objects. 