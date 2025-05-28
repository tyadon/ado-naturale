# ADO Naturale - Azure DevOps Natural Language Query Extension

🧠 **Query Azure DevOps using natural language - now with AI-powered metadata awareness**

## Overview

ADO Naturale is a Microsoft Edge extension that integrates seamlessly into Azure DevOps, allowing you to write queries in plain English instead of learning complex WIQL syntax. The extension now features **enhanced natural language processing** with **Azure DevOps metadata awareness** and **Azure OpenAI integration** for intelligent query generation.

### 🚀 **New Enhanced Features**

- **🔍 Metadata Awareness**: Automatically fetches and uses your project's work item types, fields, team members, and iterations
- **🤖 Azure OpenAI Integration**: Leverage GPT-4 for sophisticated natural language understanding
- **📊 Smart Field Detection**: Recognizes custom fields and their allowed values
- **👥 Team Context**: Knows your team members and can handle user-specific queries
- **🔄 Intelligent Fallbacks**: Multiple processing layers ensure queries always work
- **📈 Processing Feedback**: See how your queries are interpreted and processed

### Key Features

- **Natural Language Processing**: Write queries like "Show me high priority bugs assigned to John from last sprint"
- **Seamless Integration**: Positions at the bottom of the screen with minimizable interface
- **URL Generation**: Automatically converts natural language to valid Azure DevOps query URLs
- **Query Execution**: Navigates to appropriate query results using ADO's native URL structure
- **Query History**: Keeps track of your recent queries with processing details
- **Smart Suggestions**: Provides quick examples and templates

## Installation

### Development Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-org/ado-naturale.git
   cd ado-naturale
   ```

2. Open Microsoft Edge and navigate to `edge://extensions/`

3. Enable "Developer mode" in the bottom left corner

4. Click "Load unpacked" and select the `ado-naturale` folder

5. The extension should now appear in your extensions list

### Production Installation

*Coming soon to Microsoft Edge Add-ons store*

## Configuration

### Azure OpenAI Setup (Optional but Recommended)

For the best natural language understanding, configure Azure OpenAI:

1. Click the extension icon in your browser toolbar
2. Navigate to the "Azure OpenAI Configuration" section
3. Enter your Azure OpenAI details:
   - **Endpoint URL**: Your Azure OpenAI resource endpoint
   - **API Key**: Your Azure OpenAI API key
   - **Deployment Name**: Your GPT-4 deployment name (default: "gpt-4")
4. Click "Save Configuration" and "Test Connection"

**Note**: Without Azure OpenAI, the extension uses enhanced pattern matching with metadata awareness.

## Usage

### Basic Usage

1. Navigate to any Azure DevOps page (`https://*.visualstudio.com/*` or `https://dev.azure.com/*`)

2. You'll see a new "Natural Language Query" interface at the bottom of the page (can be minimized when not in use)

3. Type your query in plain English, for example:
   - "Show me my bugs"
   - "High priority user stories assigned to me"
   - "Tasks created this week by John Smith"
   - "Items I created last month"
   - "Critical bugs in current sprint"

4. Click the "Query" button or press Ctrl+Enter

5. The extension will generate a query URL and navigate to the results page

6. View processing feedback to understand how your query was interpreted

### Enhanced Query Examples

#### With Metadata Awareness
- "Show me bugs assigned to [actual team member name]"
- "User stories in [actual iteration name]"
- "Items with [custom field] set to [actual allowed value]"
- "Work items in [actual area path]"

#### With Azure OpenAI
- "Find all high priority items that haven't been updated in the last week"
- "Show me user stories that are blocked or have dependencies"
- "Get all bugs reported by external users in the current release"
- "Find work items that mention performance issues in the title or description"

### Supported Query Types

#### Assignment Queries
- "Show me my bugs"
- "Items assigned to me"
- "Work items I created"
- "Tasks assigned to @username"
- "Items assigned to [team member name]"

#### Work Item Type Queries
- "All user stories"
- "High priority bugs"
- "Features in current sprint"
- "Tasks and bugs"

#### Time-based Queries
- "Items created today"
- "Work items from this week"
- "Bugs resolved last month"
- "Stories in current iteration"
- "Items updated in [specific iteration]"

#### Priority and State Queries
- "High priority items"
- "Critical bugs"
- "Active user stories"
- "Resolved work items"
- "Items in [specific state]"

#### Custom Field Queries (with metadata)
- "Items with [custom field] = [value]"
- "Work items in [area path]"
- "Stories with [story points] > 5"

### Advanced Features

#### Processing Methods
The extension uses multiple processing methods in order of sophistication:

1. **Azure OpenAI** (if configured): Most intelligent, handles complex queries
2. **Enhanced Pattern Matching**: Uses metadata for smart field recognition
3. **Basic Pattern Matching**: Fallback for common query patterns
4. **Text Search**: Ultimate fallback for any input

#### Query Feedback
After each query, you'll see:
- **Processing Method**: How the query was processed
- **Confidence Level**: How confident the system is in the interpretation
- **Analysis**: What the system understood from your query
- **Processing Time**: How long it took to process

#### Metadata Information
View your project's metadata in the extension popup:
- Work item types and their fields
- Team members
- Iterations/sprints
- Areas
- Custom fields and allowed values

## Architecture

### Enhanced Extension Structure
```
ado-naturale/
├── manifest.json              # Extension manifest (V3)
├── background/
│   └── service-worker.js      # Background service worker
├── content/
│   ├── content-script.js      # Main content script
│   ├── ui-injector.js         # UI component injection
│   └── query-executor.js      # Query execution logic
├── popup/
│   ├── popup.html            # Extension popup with configuration
│   ├── popup.js              # Popup logic
│   └── popup.css             # Popup styles
├── shared/
│   ├── api-client.js         # ADO API interaction
│   ├── metadata-client.js    # 🆕 Metadata fetching and caching
│   ├── openai-client.js      # 🆕 Azure OpenAI integration
│   ├── nl-processor.js       # Original natural language processing
│   ├── enhanced-nl-processor.js # 🆕 Enhanced NLP with metadata
│   └── url-generator.js      # URL query generation
└── styles/
    └── content.css           # Injected styles
```

### Core Components

1. **Metadata Client**: Fetches comprehensive project information from Azure DevOps APIs
2. **Azure OpenAI Client**: Handles AI-powered query generation with metadata context
3. **Enhanced NL Processor**: Combines metadata awareness with multiple processing strategies
4. **URL Generator**: Converts processed queries into valid Azure DevOps URLs
5. **UI Injector**: Provides feedback and configuration interface

## Development

### Prerequisites

- Microsoft Edge (latest version)
- Node.js (for build tools, if needed)
- Access to Azure DevOps for testing
- Azure OpenAI resource (optional, for AI features)

### Development Setup

1. Clone the repository
2. Enable Edge Developer Mode
3. Load the extension as unpacked
4. Configure Azure OpenAI (optional)
5. Make changes to the code
6. Reload the extension in Edge to test changes

### Testing

Test the extension on various Azure DevOps environments:
- `https://*.visualstudio.com/*/_queries`
- `https://dev.azure.com/*/_queries`

### Common Query Patterns for Testing

```sql
-- "Show me my bugs"
SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.CreatedDate]
FROM WorkItems 
WHERE [System.WorkItemType] = 'Bug' 
AND [System.AssignedTo] = @Me
ORDER BY [System.CreatedDate] DESC

-- "High priority user stories assigned to John"
SELECT [System.Id], [System.Title], [System.State], [Microsoft.VSTS.Common.Priority]
FROM WorkItems 
WHERE [System.WorkItemType] = 'User Story'
AND [Microsoft.VSTS.Common.Priority] <= 2
AND [System.AssignedTo] = 'john@company.com'
ORDER BY [Microsoft.VSTS.Common.Priority], [System.CreatedDate] DESC
```

## Configuration

### Extension Settings

Access settings through the extension popup:
- Enable/disable the extension
- Configure Azure OpenAI integration
- View metadata information
- Access usage statistics
- Refresh metadata cache

### Permissions

The extension requires the following permissions:
- `activeTab`: To interact with Azure DevOps pages
- `storage`: To save query history and settings
- `scripting`: To inject content scripts

### Host Permissions

- `https://*.visualstudio.com/*`: Azure DevOps (Visual Studio Team Services)
- `https://dev.azure.com/*`: Azure DevOps (new URL format)
- `https://*.azure.com/*`: Azure OpenAI services

## Troubleshooting

### Common Issues

1. **Extension not appearing on ADO pages**
   - Ensure you're on a query page (`/_queries`)
   - Check that the extension is enabled
   - Try refreshing the page

2. **Queries not executing**
   - Verify you have permissions to run queries in the project
   - Check browser console for error messages
   - Try refreshing metadata in the popup

3. **Azure OpenAI not working**
   - Verify your endpoint URL and API key
   - Check that your deployment is active
   - Use the "Test Connection" button in the popup

4. **Metadata not loading**
   - Ensure you have read permissions for the project
   - Try refreshing metadata in the popup
   - Check if you're on a supported ADO page

### Debug Information

- Open the extension popup to view status and metadata
- Check browser console for detailed logs
- Use the "View Logs" link in the popup

## Privacy and Security

- **No External Data Sharing**: Metadata stays within your browser and Azure OpenAI (if configured)
- **Secure Storage**: API keys are stored securely in browser storage
- **Session-based**: Uses your existing Azure DevOps authentication
- **Optional AI**: Azure OpenAI integration is completely optional

## Contributing

We welcome contributions! Please see our contributing guidelines for more information.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### Version 1.1.0 (Enhanced NLP)
- ✅ Added Azure DevOps metadata awareness
- ✅ Integrated Azure OpenAI for advanced query processing
- ✅ Enhanced UI with processing feedback
- ✅ Improved popup with configuration options
- ✅ Added metadata caching and refresh capabilities
- ✅ Multiple processing fallback strategies

### Version 1.0.0 (Initial Release)
- ✅ Basic natural language processing
- ✅ URL-based query execution
- ✅ Pattern matching for common queries
- ✅ Minimizable interface
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different ADO environments
5. Submit a pull request

### Code Style

- Use ES6+ features
- Follow existing naming conventions
- Add JSDoc comments for functions
- Include error handling

### Testing Guidelines

- Test on both `*.visualstudio.com` and `dev.azure.com`
- Verify different work item types
- Test with various project configurations
- Check accessibility compliance

## Roadmap

### Phase 1: Core Functionality ✅
- [x] Basic natural language processing
- [x] WIQL generation
- [x] ADO integration
- [x] Query execution

### Phase 2: Enhanced Features (In Progress)
- [ ] Azure OpenAI integration
- [ ] Advanced query patterns
- [ ] Query optimization
- [ ] Better error handling

### Phase 3: Advanced Features (Planned)
- [ ] Cross-project queries
- [ ] Query templates and favorites
- [ ] Analytics and insights
- [ ] Bulk operations support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: Report bugs and feature requests on [GitHub Issues](https://github.com/your-org/ado-naturale/issues)
- **Documentation**: Check this README and inline code comments
- **Community**: Join discussions in GitHub Discussions

## Acknowledgments

- Microsoft Azure DevOps team for the excellent platform
- The open-source community for inspiration and tools
- Beta testers and early adopters for feedback

---

**Made with ❤️ for the Azure DevOps community** 