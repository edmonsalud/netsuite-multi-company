# [COMPANY-NAME] - NetSuite SDF Project

## Company Information

- **Account ID**: [Account ID]
- **Account Type**: [Production/Sandbox]
- **Environment**: [Production/Development/Testing]
- **Authentication Status**: [Configured ✅ / Not Configured ⬜]

---

## Quick Start

### Deploy to NetSuite
```bash
cd companies/[COMPANY-NAME]
npx suitecloud project:deploy
```

### Import from NetSuite
```bash
# Import all objects
npx suitecloud object:import

# Import specific object type
npx suitecloud object:import --type [objecttype] --scriptid [id]

# Import files from File Cabinet
npx suitecloud file:import --paths /SuiteScripts/[path]
```

### Validate Project
```bash
npx suitecloud project:validate
```

---

## Project Structure

```
[COMPANY-NAME]/
├── src/
│   ├── AccountConfiguration/    # Account settings
│   ├── FileCabinet/
│   │   └── SuiteScripts/        # Your scripts here
│   ├── Objects/                 # Custom records, workflows, etc.
│   ├── Translations/            # Multi-language strings
│   ├── deploy.xml               # Deployment configuration
│   └── manifest.xml             # Project manifest
├── deploy.bat                   # Quick deployment script (Windows)
├── suitecloud.config.js         # CLI configuration
└── README.md                    # This file
```

---

## Scripts Inventory

### User Event Scripts
- *[List your user event scripts here]*

### Scheduled Scripts
- *[List your scheduled scripts here]*

### Suitelets
- *[List your suitelets here]*

### Map/Reduce Scripts
- *[List your map/reduce scripts here]*

### RESTlets
- *[List your RESTlets here]*

### Client Scripts
- *[List your client scripts here]*

---

## Custom Objects

### Custom Records
- *[List custom record types]*

### Workflows
- *[List workflows]*

### Saved Searches
- *[List saved searches]*

---

## Deployment History

| Date | Developer | Changes | Status |
|------|-----------|---------|--------|
| YYYY-MM-DD | [Name] | [Description] | ✅ Success |
| YYYY-MM-DD | [Name] | [Description] | ✅ Success |

---

## Authentication Setup

### First-Time Setup

1. **Ensure NetSuite account has SDF enabled**:
   - Setup > Company > Enable Features > SuiteCloud tab
   - Enable "SuiteCloud Development Framework"

2. **Create Integration Record** (if using Token-Based Auth):
   - Setup > Integration > Manage Integrations > New
   - Copy Consumer Key and Consumer Secret

3. **Create Access Token**:
   - Setup > Users/Roles > Access Tokens > New
   - Copy Token ID and Token Secret

4. **Authenticate locally**:
   ```bash
   cd companies/[COMPANY-NAME]
   npx suitecloud account:setup
   ```
   - Choose authentication method
   - Enter credentials when prompted

---

## Common Commands

### Development Workflow
```bash
# Pull latest from NetSuite
npx suitecloud object:import

# Make changes locally

# Validate changes
npx suitecloud project:validate

# Deploy to NetSuite
npx suitecloud project:deploy
```

### Troubleshooting
```bash
# Check authentication status
npx suitecloud account:manageauth

# List available objects in NetSuite
npx suitecloud object:list

# Get help
npx suitecloud --help
```

---

## Notes

- **Authentication**: Credentials stored in `project.json` (auth ID reference) and `C:\Users\Ed\AppData\Local\.suitecloud-sdk\` (encrypted tokens)
- **Version Control**: This project uses Git - commit frequently with meaningful messages
- **Testing**: Always test in sandbox before deploying to production
- **Backup**: Always backup before major deployments

---

## Contacts

- **NetSuite Administrator**: [Name/Email]
- **Developer**: [Name/Email]
- **Project Manager**: [Name/Email]

---

**Last Updated**: [Date]
**Project Status**: [Active/Maintenance/Development]
