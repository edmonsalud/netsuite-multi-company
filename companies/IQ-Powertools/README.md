# IQ Powertools - NetSuite SDF Project

## Project Information
- **Company**: IQ Powertools
- **Project Type**: Account Customization Project
- **Framework**: SuiteCloud Development Framework (SDF)

## Directory Structure
```
IQ-Powertools/
├── src/
│   ├── FileCabinet/
│   │   └── SuiteScripts/      # Custom scripts go here
│   └── Objects/                # Custom objects (workflows, records, etc.)
├── suitecloud.config.js        # SDF configuration
├── deploy.bat                  # Quick deploy script
└── README.md                   # This file
```

## Setup Instructions

### 1. Authenticate with NetSuite
```bash
npx suitecloud account:setup
```

### 2. Import Existing Scripts (if needed)
```bash
npx suitecloud file:import --paths /SuiteScripts/[script-name].js
```

### 3. Deploy to NetSuite
```bash
npx suitecloud project:deploy
```

Or use the quick deploy script:
```bash
deploy.bat
```

## Development Workflow

1. **Create/Edit Scripts** in `src/FileCabinet/SuiteScripts/`
2. **Validate Project**: `npx suitecloud project:validate`
3. **Deploy**: `npx suitecloud project:deploy`
4. **Pull Changes**: `npx suitecloud file:import`

## Requirements
- Node.js installed
- Java 21 installed (already configured)
- SuiteCloud CLI tools
- Authenticated NetSuite account

## Notes
- All SuiteScripts should be SuiteScript 2.1 format
- Follow NetSuite governance best practices
- Test in sandbox before production deployment
