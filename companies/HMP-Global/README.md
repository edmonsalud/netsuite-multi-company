# HMP-Global NetSuite Project

## Overview
This is the NetSuite SDF (SuiteCloud Development Framework) project for HMP-Global company.

## Project Structure
```
HMP-Global/
├── src/                         # SDF source files
│   ├── FileCabinet/            # File Cabinet customizations
│   │   └── SuiteScripts/       # SuiteScript files
│   ├── Objects/                # NetSuite objects and customizations
│   ├── manifest.xml            # Project manifest
│   └── deploy.xml              # Deployment configuration
├── suitecloud.config.js        # SuiteCloud configuration
└── README.md                   # This file
```

## Setup Instructions

### Prerequisites
1. Java JDK 17 or 21 installed
2. Node.js and npm installed
3. SuiteCloud CLI installed (`npm install -g @oracle/suitecloud-cli`)
4. NetSuite account credentials

### Initial Setup
1. Navigate to the project directory:
   ```bash
   cd companies/HMP-Global
   ```

2. Set up account credentials:
   ```bash
   suitecloud account:setup
   ```
   - Enter your NetSuite account ID
   - Choose authentication method (Token-based or OAuth 2.0)
   - Provide required credentials

3. Validate project:
   ```bash
   suitecloud project:validate
   ```

## Common Commands

### Deploy to NetSuite
```bash
suitecloud project:deploy
```

### Import from NetSuite
```bash
suitecloud file:import
```

### List files in account
```bash
suitecloud file:list
```

### Create new script
```bash
suitecloud file:create --type SuiteScript
```

## SuiteScript Development

### File Naming Convention
- User Event Scripts: `*_ue.js` or `*_userevent.js`
- Client Scripts: `*_cs.js` or `*_client.js`
- Scheduled Scripts: `*_ss.js` or `*_scheduled.js`
- Suitelet Scripts: `*_sl.js` or `*_suitelet.js`
- RESTlet Scripts: `*_rl.js` or `*_restlet.js`
- Map/Reduce Scripts: `*_mr.js` or `*_mapreduce.js`

### Script Template
All SuiteScripts should follow the standard AMD module pattern:
```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], (record, log) => {

    const beforeLoad = (context) => {
        // Your code here
    };

    return {
        beforeLoad: beforeLoad
    };
});
```

## Deployment Notes

### Environment Variables
If using token-based authentication, you can set environment variables:
- `SUITECLOUD_ACCOUNT_ID`: Your NetSuite account ID
- `SUITECLOUD_TOKEN_ID`: Integration token ID
- `SUITECLOUD_TOKEN_SECRET`: Integration token secret

### Excluded Files
The following files/folders are excluded from deployment:
- `node_modules/`
- `.git/`
- `.gitignore`
- `package.json`
- `package-lock.json`
- `*.log`
- `test/` and `tests/` directories

## Support
For issues or questions, refer to the NetSuite SuiteCloud documentation or contact your NetSuite administrator.