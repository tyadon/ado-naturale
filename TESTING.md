# Testing Guide - ADO Naturale Extension

This guide provides comprehensive testing procedures for the ADO Naturale extension.

## Pre-Testing Setup

### 1. Extension Installation
1. Open Microsoft Edge
2. Navigate to `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder
5. Verify the extension appears in the extensions list

### 2. Azure DevOps Access
Ensure you have access to:
- At least one Azure DevOps organization
- A project with work items (bugs, user stories, tasks)
- Query creation permissions

### 3. Test Environment URLs
- Visual Studio Team Services: `https://{org}.visualstudio.com/{project}/_queries`
- Azure DevOps: `https://dev.azure.com/{org}/{project}/_queries`

## Core Functionality Tests

### Test 1: Extension Loading
**Objective**: Verify the extension loads correctly on ADO query pages

**Steps**:
1. Navigate to an ADO query page
2. Wait for page to fully load
3. Look for the "Natural Language Query" interface

**Expected Results**:
- Interface appears at the top of the page
- No console errors
- Interface is properly styled and responsive

**Debug Commands**:
```javascript
// Check if extension is initialized
window.ADONaturale_Debug.isInitialized()

// Get page context
window.ADONaturale_Debug.getContext()
```

### Test 2: Basic Query Processing
**Objective**: Test simple natural language queries

**Test Cases**:
| Input | Expected WIQL Pattern |
|-------|----------------------|
| "Show me my bugs" | `WHERE [System.WorkItemType] = 'Bug' AND [System.AssignedTo] = @Me` |
| "Items assigned to me" | `WHERE [System.AssignedTo] = @Me` |
| "Work items I created" | `WHERE [System.CreatedBy] = @Me` |
| "All user stories" | `WHERE [System.WorkItemType] = 'User Story'` |

**Steps**:
1. Enter each test query in the natural language input
2. Click "Query" button
3. Verify WIQL is generated and executed
4. Check results appear in ADO interface

### Test 3: Query Execution
**Objective**: Verify queries execute properly in ADO

**Steps**:
1. Enter "Show me my bugs"
2. Click "Query" button
3. Wait for execution to complete
4. Verify results display in ADO results grid

**Expected Results**:
- Query executes without errors
- Results appear in standard ADO interface
- Loading indicators work properly

### Test 4: Error Handling
**Objective**: Test error scenarios and recovery

**Test Cases**:
1. Empty query input
2. Unsupported query patterns
3. Network connectivity issues
4. ADO permission errors

**Steps**:
1. Test each error scenario
2. Verify appropriate error messages appear
3. Confirm extension remains functional after errors

## Advanced Feature Tests

### Test 5: Query Suggestions
**Objective**: Test quick suggestion buttons

**Steps**:
1. Click each suggestion button:
   - "My bugs"
   - "Assigned to me"
   - "High priority stories"
   - "Created by me"
2. Verify queries execute correctly

### Test 6: Interface Interactions
**Objective**: Test UI responsiveness and interactions

**Steps**:
1. Test toggle button (minimize/maximize)
2. Test keyboard shortcuts (Ctrl+Enter, Shift+Enter)
3. Test textarea auto-resize
4. Test responsive design on different screen sizes

### Test 7: Query History
**Objective**: Verify query history functionality

**Steps**:
1. Execute several different queries
2. Open extension popup
3. Check usage statistics update
4. Verify queries are saved to history

## Browser Compatibility Tests

### Test 8: Edge Versions
**Objective**: Test on different Edge versions

**Test Matrix**:
- Edge Stable (latest)
- Edge Beta
- Edge Dev (if available)

### Test 9: Operating Systems
**Objective**: Test cross-platform compatibility

**Platforms**:
- Windows 10/11
- macOS
- Linux (if Edge available)

## Performance Tests

### Test 10: Query Processing Speed
**Objective**: Measure query processing performance

**Metrics**:
- Time from input to WIQL generation: < 1 second
- Time from WIQL to query execution: < 2 seconds
- Memory usage: Monitor for leaks

**Steps**:
1. Execute 10 different queries
2. Measure processing times
3. Monitor browser memory usage
4. Check for performance degradation

### Test 11: Large Result Sets
**Objective**: Test with queries returning many results

**Steps**:
1. Create queries that return 100+ work items
2. Verify performance remains acceptable
3. Check for UI responsiveness issues

## Integration Tests

### Test 12: ADO Interface Compatibility
**Objective**: Ensure no conflicts with existing ADO functionality

**Steps**:
1. Test existing ADO query features still work
2. Verify no visual conflicts or layout issues
3. Test with ADO dark theme (if available)
4. Check accessibility features remain functional

### Test 13: Multiple Projects
**Objective**: Test across different project configurations

**Test Scenarios**:
- Different work item types (Agile, Scrum, CMMI)
- Projects with custom fields
- Projects with different permissions
- Cross-organization testing

## Security Tests

### Test 14: Data Privacy
**Objective**: Verify no sensitive data leakage

**Steps**:
1. Monitor network requests during query processing
2. Verify no sensitive ADO data sent to external services
3. Check local storage for sensitive information
4. Test with private/incognito browsing

### Test 15: Permission Handling
**Objective**: Test behavior with limited permissions

**Steps**:
1. Test with read-only project access
2. Test with no query creation permissions
3. Verify appropriate error messages

## Regression Tests

### Test 16: Core Functionality Regression
**Objective**: Ensure existing features continue working after changes

**Test Suite**:
- Re-run Tests 1-7 after any code changes
- Verify no new console errors
- Check performance hasn't degraded

## Automated Testing

### Test 17: Console Error Monitoring
**Objective**: Catch JavaScript errors automatically

**Setup**:
```javascript
// Add to content script for error monitoring
window.addEventListener('error', (e) => {
  console.error('ADO Naturale Error:', e.error);
});
```

### Test 18: Performance Monitoring
**Objective**: Track performance metrics

**Metrics to Track**:
- Query processing time
- Memory usage
- DOM manipulation performance
- Network request timing

## Test Data Requirements

### Sample Work Items
Create test work items with:
- Different work item types (Bug, User Story, Task, Feature)
- Various priority levels (1-4)
- Different states (New, Active, Resolved, Closed)
- Assigned to different users
- Created at different times

### Sample Queries for Testing
```
Basic Queries:
- "Show me my bugs"
- "Items assigned to me"
- "Work items I created"
- "All user stories"
- "High priority items"

Time-based Queries:
- "Items created today"
- "Work items from this week"
- "Bugs from last month"

Complex Queries:
- "High priority bugs assigned to me"
- "User stories created this week"
- "Resolved items from current sprint"
```

## Bug Reporting Template

When reporting bugs, include:

```
**Bug Title**: Brief description

**Environment**:
- Browser: Microsoft Edge [version]
- OS: [Windows/macOS/Linux] [version]
- ADO URL: [organization/project]

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happened

**Console Errors**:
Any JavaScript errors from browser console

**Screenshots**:
If applicable

**Additional Context**:
Any other relevant information
```

## Test Sign-off Checklist

Before releasing:
- [ ] All core functionality tests pass
- [ ] No critical bugs identified
- [ ] Performance meets requirements
- [ ] Security tests pass
- [ ] Cross-browser compatibility verified
- [ ] Documentation updated
- [ ] Icons and assets finalized 