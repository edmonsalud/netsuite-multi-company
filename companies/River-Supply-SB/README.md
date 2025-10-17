# River Supply SB NetSuite Project

## Company Information
- **Company Name:** River Supply SB
- **Account ID:** 9910981-sb1
- **Environment:** Sandbox
- **Authentication:** Browser-Based

## Project Structure
```
River-Supply-SB/
├── src/                    # Source files
│   ├── FileCabinet/       # SuiteScripts and files
│   ├── Objects/           # NetSuite customizations
│   ├── deploy.xml         # Deployment configuration
│   └── manifest.xml       # Project manifest
├── suitecloud.config.js   # SuiteCloud configuration
├── authenticate.bat       # Authentication script
├── deploy.bat            # Deployment script
└── README.md             # This file
```

## Setup Instructions

### 1. Initial Authentication
Run the authentication script to connect to NetSuite:
```bash
authenticate.bat
```
This will open your browser. Log in with your NetSuite credentials for account 9910981-sb1.

### 2. Import Existing Customizations
To import existing scripts and customizations from NetSuite:
```bash
npx suitecloud file:import
```

### 3. Deploy Changes
To deploy your changes to NetSuite:
```bash
deploy.bat
```

## Development Workflow

1. **Pull Latest Changes**
   ```bash
   npx suitecloud file:import
   ```

2. **Make Your Changes**
   - Add/modify SuiteScripts in `src/FileCabinet/SuiteScripts/`
   - Update customizations in `src/Objects/`

3. **Validate Project**
   ```bash
   npx suitecloud project:validate
   ```

4. **Deploy to NetSuite**
   ```bash
   deploy.bat
   ```

## Available Commands

- `npx suitecloud account:savetoken` - Re-authenticate with NetSuite
- `npx suitecloud file:import` - Import files from NetSuite
- `npx suitecloud file:list` - List files in NetSuite
- `npx suitecloud project:deploy` - Deploy project to NetSuite
- `npx suitecloud project:validate` - Validate project structure
- `npx suitecloud object:import` - Import NetSuite objects
- `npx suitecloud object:list` - List NetSuite objects
- `npx suitecloud object:update` - Update NetSuite objects

## Troubleshooting

### Authentication Issues
If you encounter authentication problems:
1. Delete the authentication token: `npx suitecloud account:revoketoken`
2. Re-run authentication: `authenticate.bat`

### Deployment Failures
If deployment fails:
1. Validate the project: `npx suitecloud project:validate`
2. Check the deploy.xml file for correct script IDs
3. Ensure all referenced files exist in the project

### Browser-Based Authentication
This project uses browser-based authentication. If you need to switch to OAuth:
1. Update `suitecloud.config.js` to use OAuth configuration
2. Follow the OAuth setup guide in the main project documentation

## Support
For additional help, refer to the main project documentation or NetSuite's SuiteCloud SDK documentation.