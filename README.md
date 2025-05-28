# ADO Naturale - Azure DevOps Natural Language Query Extension

🧠 **Query Azure DevOps using natural language - now with AI-powered metadata awareness**

## Overview

ADO Naturale is a Microsoft Edge extension that lets you query Azure DevOps using plain English instead of WIQL. It features:
- **Metadata awareness** (knows your work item types, fields, team members, and sprints)
- **Azure OpenAI integration** (optional, for smarter queries)
- **Quick, bottom-of-screen UI** (minimizable, non-intrusive)
- **URL-based query execution** (no backend, works with your ADO session)

## Key Features
- Natural language query input (e.g. "Show me my bugs", "High priority user stories assigned to John")
- Smart field and team member detection
- Query suggestions and templates
- Query history tracking
- Error handling and feedback
- Works on both `dev.azure.com` and `*.visualstudio.com`

## Example Queries Supported
| Natural Language | Generated URL Pattern |
|------------------|----------------------|
| "My bugs" | `.../query/?wiql=SELECT * FROM WorkItems WHERE [System.WorkItemType] = 'Bug' AND [System.AssignedTo] = @Me` |
| "Everything assigned to me" | `.../query/?wiql=SELECT * FROM WorkItems WHERE [System.AssignedTo] = @Me` |
| "High priority bugs" | `.../query/?wiql=SELECT * FROM WorkItems WHERE [System.WorkItemType] = 'Bug' AND [Microsoft.VSTS.Common.Priority] <= 2` |
| "Active bugs assigned to me over a year old" | `.../query/?wiql=SELECT * FROM WorkItems WHERE [System.WorkItemType] = 'Bug' AND [System.AssignedTo] = @Me AND [System.State] = 'Active' AND [System.CreatedDate] <= @Today - 365` |

## Quick Start

1. **Clone and Load the Extension**
   ```bash
   git clone https://github.com/your-org/ado-naturale.git
   cd ado-naturale
   ```
   - Open Edge, go to `edge://extensions/`, enable Developer mode, and load the `ado-naturale` folder.

2. **Navigate to Azure DevOps**
   - Go to any ADO query page (`https://dev.azure.com/.../_queries` or `https://org.visualstudio.com/.../_queries`).
   - The "Natural Language Query" bar appears at the bottom.

3. **Type a Query**
   - Try: `Show me my bugs` or `High priority user stories assigned to John`.
   - Press Ctrl+Enter or click "Query".
   - The extension generates a WIQL query URL and navigates to the results.

4. **(Optional) Configure Azure OpenAI**
   - Click the extension icon, enter your OpenAI endpoint and key, and test the connection for smarter query understanding.
   - See below for how to get your own Azure OpenAI keys.

## How to Get Azure OpenAI Keys and Set Up the Extension

1. **Create an Azure Account**
   - Go to https://portal.azure.com and sign in or create a new account.
2. **Create an Azure OpenAI Resource**
   - In the Azure Portal, search for "Azure OpenAI" and create a new resource.
   - Follow the prompts to set up your resource and select a region where OpenAI is available.
3. **Deploy a Model**
   - In your Azure OpenAI resource, go to the "Deployments" section.
   - Deploy a model such as `gpt-35-turbo` or `gpt-4`.
4. **Get Your Endpoint and Key**
   - In the Azure Portal, go to your OpenAI resource and select "Keys and Endpoint".
   - Copy the endpoint URL and one of the keys.
5. **Configure the Extension**
   - Open the extension popup in your browser.
   - Paste your endpoint and key into the configuration fields.
   - Save and test the connection.

**Note:** Access to Azure OpenAI may require approval from Microsoft. If you do not have access, you can request it through the Azure Portal or your organization's Azure administrator.

## How to Test
- Try the example queries above.
- Use the suggestion buttons for quick tests.
- Test on different ADO projects and organizations.
- Try minimizing/maximizing the UI.
- Check error handling by submitting an empty query or an unsupported pattern.

## What to Expect
- **Fast, in-browser query generation**
- **No data leaves your browser except to ADO/OpenAI if configured**
- **Works with your existing ADO session and permissions**
- **Handles most common query types and fields**
- **Graceful fallback and error messages**

## Project Structure (for Developers)
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
│   ├── metadata-client.js    # Metadata fetching and caching
│   ├── openai-client.js      # Azure OpenAI integration
│   ├── nl-processor.js       # Natural language processing
│   ├── enhanced-nl-processor.js # Enhanced NLP with metadata
│   └── url-generator.js      # URL query generation
└── styles/
    └── content.css           # Injected styles
```

## FAQ
- **Does this send my data anywhere?**
  - No, all query processing is local. If you enable OpenAI, your query text is sent to your Azure OpenAI endpoint only.
- **What if I don't configure OpenAI?**
  - The extension uses enhanced pattern matching and metadata for most queries.
- **How do I give feedback?**
  - Contact the project maintainer or open an issue in the repo.

## License
MIT 