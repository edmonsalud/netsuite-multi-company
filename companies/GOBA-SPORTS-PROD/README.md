# GOBA Sports - Production NetSuite Project

This project contains the NetSuite SuiteScript customizations for GOBA Sports Production environment.

## Company Information
- **Company Name**: GOBA Sports
- **Environment**: Production
- **Account ID**: **693183** ✅ (Verified 2025-10-15)

## Project Structure

```
GOBA-SPORTS-PROD/
├── src/                           # Source files
│   ├── FileCabinet/              # File Cabinet contents
│   │   └── SuiteScripts/         # SuiteScript files
│   ├── manifest.xml              # Project manifest
│   └── deploy.xml                # Deployment configuration
├── suitecloud.config.js          # SuiteCloud configuration
├── import-scripts.ps1            # PowerShell import script
└── README.md                     # This file
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- SuiteCloud CLI installed globally
- NetSuite account credentials (Account ID, Token ID, Token Secret)

### Initial Setup

1. **Configure SuiteCloud Authentication**
   - Edit `suitecloud.config.js` and update:
     - `accountId`: Your GOBA Sports NetSuite Account ID
     - `tokenId`: Your token ID
     - `tokenSecret`: Your token secret

2. **Initialize the Project**
   ```bash
   cd companies/GOBA-SPORTS-PROD
   suitecloud project:setup
   ```

3. **Import Existing Scripts** (if applicable)
   ```powershell
   .\import-scripts.ps1
   ```

## Development Workflow

### Importing Objects from NetSuite
```bash
# Import all SuiteScripts
suitecloud object:import --type file --paths /SuiteScripts

# Import specific script
suitecloud object:import --type file --paths /SuiteScripts/your_script.js
```

### Deploying to NetSuite
```bash
# Deploy all project files
suitecloud project:deploy

# Deploy with validation
suitecloud project:validate
suitecloud project:deploy
```

### Working with SuiteScripts

1. Place your SuiteScript files in: `src/FileCabinet/SuiteScripts/`
2. Follow NetSuite's SuiteScript 2.x standards
3. Use meaningful file naming conventions

## Available Scripts

- **import-scripts.ps1**: PowerShell script to import multiple SuiteScripts at once

## Important Notes

- Always validate your project before deploying
- Keep sensitive information (tokens, secrets) secure
- Follow NetSuite's best practices for SuiteScript development
- Test thoroughly in a sandbox environment before deploying to production

## MCP Server Integration 🚀

### Status: ⚠️ Authentication Issue Resolved - Ready for Implementation

This account is configured for **Model Context Protocol (MCP)** integration with Claude Code, enabling AI-powered NetSuite development.

### Documentation Index:

#### Setup & Configuration
- **[Quick Fix Guide](docs/setup/MCP-AUTH-QUICK-FIX.md)** - 30-min fix for authentication issue ⭐ START HERE
- **[Complete Auth Research](GLINTS-MCP-AUTH-RESEARCH.md)** - Deep dive into authentication requirements
- **[Setup Guide](docs/setup/MCP-SETUP-GUIDE.md)** - Original step-by-step setup
- **[Troubleshooting](docs/setup/MCP-TROUBLESHOOTING.md)** - Common issues and solutions

#### Research & Findings
- **[MCP Findings](MCP-FINDINGS.md)** - Current status and alternatives
- **[OAuth2 Research](OAUTH2-SERVER-ERROR-RESEARCH.md)** - Server error investigation
- **[SuiteQL Requirements](docs/setup/SUITEQL-METADATA-ACCESS-REQUIREMENTS.md)** - Permissions needed

### What MCP Enables:
- ✅ Query NetSuite data using natural language
- ✅ Get real-time record schemas and metadata
- ✅ Execute SuiteQL queries for data analysis
- ✅ Generate SuiteScripts with accurate field IDs from your actual schema
- ✅ Test and validate queries before deployment

### Setup Status:
- ✅ OAuth integration created in NetSuite
- ✅ Client ID and Secret obtained
- ✅ Security configured (`.gitignore` protection)
- ✅ Authentication issue identified and documented
- ⚠️ **NEXT STEP**: Complete certificate authentication setup
  - Install Go runtime
  - Generate certificate in NetSuite integration
  - Update MCP config with certificate credentials
  - See: [MCP-AUTH-QUICK-FIX.md](docs/setup/MCP-AUTH-QUICK-FIX.md)

### Security:
**IMPORTANT**: Never commit credentials to Git!

Protected files (auto-ignored):
- `.credentials/` folder and all contents
- `*.pem` files (private keys)
- `mcp-env.json` (credential storage)

---

## Support

For issues or questions specific to GOBA Sports implementations, contact your NetSuite administrator.

## License

This project is proprietary to GOBA Sports and should not be shared outside the organization.