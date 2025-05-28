# ADO Naturale Debug Guide

## Overview
Comprehensive debug statements have been implemented throughout the entire query execution flow to help you trace what's happening step by step.

## Preserving Logs During Page Navigation

### Problem
When ADO Naturale executes a query, it navigates to a new page, which clears the browser console logs. This makes it difficult to see what happened during query processing.

### Solutions

#### 1. Enable "Preserve log" in Browser Console (Recommended)
**Chrome/Edge:**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Click the gear icon (⚙️) or look for "Console settings"
4. Check "Preserve log" option
5. This keeps logs even when the page navigates

**Firefox:**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Click the gear icon in the console toolbar
4. Check "Persist Logs"

#### 2. Use Network Tab for API Calls
1. Open Developer Tools (F12)
2. Go to Network tab
3. Check "Preserve log" option
4. Execute your query
5. Look for API calls to Azure OpenAI in the network requests
6. Click on the request to see headers, request body, and response

#### 3. Copy Logs Before Query Execution
1. Open console and enable preserve log
2. Submit your query
3. Right-click in console → "Save as..." to save all logs
4. Or select all logs (Ctrl+A) and copy (Ctrl+C)

#### 4. Use Browser's Performance Tab
1. Open Developer Tools (F12)
2. Go to Performance tab
3. Click Record
4. Execute your query
5. Stop recording
6. You can see console messages in the timeline

#### 5. Add Breakpoints to Pause Execution
You can add breakpoints in the console to pause execution:

```javascript
// Paste this in console before submitting query
window.ADONaturale_DEBUG_PAUSE = true;

// This will pause execution before navigation
// The debug implementation will check for this flag
```

#### 6. Enable Detailed Console Logging
Run this in console for even more detailed logging:

```javascript
// Enable maximum verbosity
localStorage.setItem('ado-naturale-debug-level', 'verbose');

// You can also enable specific categories
localStorage.setItem('ado-naturale-debug-categories', 'API_CALL,QUERY_PROCESSING,EXECUTE_QUERY');
```

### Recommended Workflow

1. **Before testing:**
   - Enable "Preserve log" in Console tab
   - Clear console (Ctrl+L)
   - Open Network tab and enable "Preserve log" there too

2. **During testing:**
   - Submit your natural language query
   - Let the page navigate naturally

3. **After navigation:**
   - Return to console tab to view preserved logs
   - Check Network tab for API calls
   - Look for any error messages or warnings

4. **For deeper analysis:**
   - Save console logs if needed
   - Check specific debug categories
   - Review API request/response details in Network tab

### What to Look For

Even with preserved logs, focus on these key log sequences:

1. **Query Start:** `🔍 [UI-Injector][QUERY_SUBMIT] Query submission started`
2. **Processing Method:** Look for either "AI processing" or "pattern matching"
3. **API Calls:** `🔍 [OpenAI-Client][API_CALL]` messages if using AI
4. **Success/Failure:** `✅` for success, `❌` for errors
5. **URL Generation:** Final query URL that was generated
6. **Navigation:** `🔍 [UI-Injector][EXECUTE_QUERY] Starting query execution`

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