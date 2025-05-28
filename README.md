# ADO Naturale - Azure DevOps Natural Language Query Extension

🧠 **Query Azure DevOps using natural language - converts your questions into Azure DevOps queries**

## Overview

ADO Naturale is a Microsoft Edge extension that integrates seamlessly into Azure DevOps, allowing you to write queries in plain English instead of learning complex query syntax. The extension processes your natural language input and navigates to appropriate Azure DevOps query URLs.

### Key Features

- **Natural Language Processing**: Write queries like "Show me my bugs" or "High priority user stories assigned to me"
- **Seamless Integration**: Positions at the bottom of the screen with minimizable interface
- **URL Generation**: Automatically converts natural language to valid Azure DevOps query URLs
- **Query Execution**: Navigates to appropriate query results using ADO's native URL structure
- **Query History**: Keeps track of your recent queries
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

## Usage

### Basic Usage

1. Navigate to any Azure DevOps page (`https://*.visualstudio.com/*` or `https://dev.azure.com/*`)

2. You'll see a new "Natural Language Query" interface at the bottom of the page (can be minimized when not in use)

3. Type your query in plain English, for example:
   - "Show me my bugs"
   - "High priority user stories assigned to me"
   - "Tasks created this week"
   - "Items I created last month"

4. Click the "Query" button or press Ctrl+Enter

5. The extension will generate a query URL and navigate to the results page

### Supported Query Types

#### Assignment Queries
- "Show me my bugs"
- "Items assigned to me"
- "Work items I created"
- "Tasks assigned to @username"

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

#### Priority and State Queries
- "High priority items"
- "Critical bugs"
- "Active user stories"
- "Resolved work items"

### Advanced Features

#### Query Templates
Click on the suggestion buttons for quick access to common queries:
- My bugs
- Assigned to me
- High priority stories
- Created by me

#### Keyboard Shortcuts
- `Ctrl+Enter` or `Shift+Enter`: Execute query
- Toggle interface: Click the minimize/maximize button

## Architecture

### Extension Structure
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
│   ├── popup.html            # Extension popup
│   ├── popup.js              # Popup logic
│   └── popup.css             # Popup styles
├── shared/
│   ├── api-client.js         # ADO API interaction
│   ├── nl-processor.js       # Natural language processing
│   └── url-generator.js      # URL query generation
└── styles/
    └── content.css           # Injected styles
```

### Core Components

1. **Natural Language Processor**: Parses user input and extracts intent, entities, and filters
2. **URL Generator**: Converts processed natural language into valid Azure DevOps query URLs
3. **Query Executor**: Navigates to the generated URL to display query results
4. **UI Injector**: Positions the interface at the bottom of the screen with minimize/maximize capability

## Development

### Prerequisites

- Microsoft Edge (latest version)
- Node.js (for build tools, if needed)
- Access to Azure DevOps for testing

### Development Setup

1. Clone the repository
2. Enable Edge Developer Mode
3. Load the extension as unpacked
4. Make changes to the code
5. Reload the extension in Edge to test changes

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

-- "High priority user stories"
SELECT [System.Id], [System.Title], [System.State], [Microsoft.VSTS.Common.Priority]
FROM WorkItems 
WHERE [System.WorkItemType] = 'User Story'
AND [Microsoft.VSTS.Common.Priority] <= 2
ORDER BY [Microsoft.VSTS.Common.Priority], [System.CreatedDate] DESC
```

## Configuration

### Extension Settings

Access settings through the extension popup:
- Enable/disable the extension
- View usage statistics
- Access query history

### Permissions

The extension requires the following permissions:
- `activeTab`: To interact with Azure DevOps pages
- `storage`: To save query history and settings
- `scripting`: To inject content scripts

### Host Permissions

- `https://*.visualstudio.com/*`: Azure DevOps (Visual Studio Team Services)
- `https://dev.azure.com/*`: Azure DevOps (new URL format)

## Troubleshooting

### Common Issues

1. **Extension not appearing on ADO pages**
   - Ensure you're on a query page (`/_queries`)
   - Check that the extension is enabled
   - Try refreshing the page

2. **Queries not executing**
   - Verify you have permissions to run queries in the project
   - Check browser console for error messages
   - Try a simpler query first

3. **Natural language not understood**
   - Use more specific language
   - Include work item types (bugs, user stories, tasks)
   - Add assignment information (assigned to me, created by me)

### Debug Mode

Enable debug mode by opening browser console and running:
```javascript
window.ADONaturale_Debug.getContext()
window.ADONaturale_Debug.isInitialized()
```

## Contributing

### Development Workflow

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