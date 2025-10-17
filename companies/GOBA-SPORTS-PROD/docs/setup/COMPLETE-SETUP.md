# Complete Setup Guide for GOBA Sports - Production

## Step-by-Step Setup Instructions

### Step 1: Prerequisites
Ensure you have the following installed:
- [ ] Node.js (version 14 or higher)
- [ ] Java JDK (version 11 or higher)
- [ ] SuiteCloud CLI

### Step 2: Install SuiteCloud CLI
```bash
npm install -g @oracle/suitecloud-cli
```

### Step 3: Configure Account Credentials

1. Open `suitecloud.config.js` in your editor
2. Replace the placeholder values with your actual GOBA Sports credentials:
   ```javascript
   module.exports = {
       accountId: 'YOUR_GOBA_SPORTS_ACCOUNT_ID',
       tokenId: 'YOUR_TOKEN_ID',
       tokenSecret: 'YOUR_TOKEN_SECRET',
       // ... rest of config
   };
   ```

### Step 4: Setup Authentication
```bash
cd companies/GOBA-SPORTS-PROD
suitecloud account:setup
```

When prompted:
- Select "TBA" (Token-Based Authentication)
- Enter your account ID
- Enter your token ID
- Enter your token secret
- Choose a memorable name for this authentication (e.g., "GOBA-SPORTS-PROD")

### Step 5: Create the SuiteCloud Project
```bash
suitecloud project:create --type ACCOUNTCUSTOMIZATION --projectname GOBA-SPORTS-PROD --overwrite
```

### Step 6: Import Existing Objects (Optional)
If you have existing SuiteScripts in NetSuite:

```bash
# Import all SuiteScripts
suitecloud object:import --type file --paths /SuiteScripts

# Or import specific folders
suitecloud object:import --type file --paths /SuiteScripts/YourFolder
```

### Step 7: Validate the Project
```bash
suitecloud project:validate
```

### Step 8: Deploy to NetSuite
```bash
suitecloud project:deploy
```

## Environment Variables Setup (Optional)

For enhanced security, you can use environment variables:

1. Create a `.env` file (DO NOT commit this to git):
   ```
   SUITECLOUD_ACCOUNT_ID=YOUR_ACCOUNT_ID
   SUITECLOUD_TOKEN_ID=YOUR_TOKEN_ID
   SUITECLOUD_TOKEN_SECRET=YOUR_TOKEN_SECRET
   ```

2. Update `suitecloud.config.js` to use environment variables:
   ```javascript
   module.exports = {
       accountId: process.env.SUITECLOUD_ACCOUNT_ID || 'TSTDRV1234567',
       tokenId: process.env.SUITECLOUD_TOKEN_ID || 'your_token_id_here',
       tokenSecret: process.env.SUITECLOUD_TOKEN_SECRET || 'your_token_secret_here',
       // ... rest of config
   };
   ```

## Troubleshooting

### Common Issues and Solutions

1. **Authentication Failed**
   - Verify your account ID is correct
   - Ensure your token has not expired
   - Check that the token has appropriate permissions

2. **Java Not Found**
   - Ensure Java JDK 11+ is installed
   - Add Java to your PATH environment variable
   - Restart your terminal after installation

3. **Permission Denied**
   - Ensure your NetSuite role has SuiteScript deployment permissions
   - Check file permissions in your local project

4. **Import Fails**
   - Verify the file paths exist in NetSuite
   - Check your NetSuite connection
   - Ensure you have read permissions for the files

## Next Steps

1. Start developing your SuiteScripts in `src/FileCabinet/SuiteScripts/`
2. Use `suitecloud project:validate` before each deployment
3. Set up version control with Git
4. Consider setting up a CI/CD pipeline for automated deployments

## Support

For GOBA Sports specific issues, contact your NetSuite administrator or development team.