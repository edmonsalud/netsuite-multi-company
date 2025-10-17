# GOBA Sports NetSuite Development - Beginner's Guide

## What is This Project?

This project contains custom scripts and configurations for GOBA Sports' NetSuite implementation. NetSuite is a cloud-based business management platform, and we use SuiteScript (JavaScript) to customize it for GOBA Sports' specific needs.

## Getting Started - First Time Setup

### Step 1: Install Required Software

1. **Install Node.js**
   - Go to https://nodejs.org/
   - Download the LTS version
   - Run the installer with default settings

2. **Install Java**
   - Go to https://www.oracle.com/java/technologies/downloads/
   - Download Java 11 or newer
   - Run the installer with default settings

3. **Open Command Prompt or PowerShell**
   - Press `Windows Key + R`
   - Type `cmd` or `powershell` and press Enter

### Step 2: Install SuiteCloud Tools

In your command prompt, type:
```bash
npm install -g @oracle/suitecloud-cli
```

Wait for the installation to complete.

### Step 3: Navigate to the Project

```bash
cd C:\Users\[YourUsername]\OneDrive\Desktop\Projects\Netsuite\companies\GOBA-SPORTS-PROD
```

Replace `[YourUsername]` with your actual Windows username.

### Step 4: Get Your NetSuite Credentials

You'll need three things from your NetSuite administrator:
1. **Account ID**: Looks like "1234567" or "1234567_SB1"
2. **Token ID**: A long string of characters
3. **Token Secret**: Another long string of characters

### Step 5: Configure the Project

1. Open the file `suitecloud.config.js` in Notepad or any text editor
2. Replace the placeholder values:
   - Change `TSTDRV1234567` to your actual Account ID
   - Change `your_token_id_here` to your Token ID
   - Change `your_token_secret_here` to your Token Secret
3. Save the file

### Step 6: Connect to NetSuite

In your command prompt, while in the GOBA-SPORTS-PROD directory, type:
```bash
suitecloud account:setup
```

Follow the prompts to set up your connection.

## Daily Development Tasks

### Downloading Scripts from NetSuite

To get the latest scripts from NetSuite:
```bash
suitecloud object:import --type file --paths /SuiteScripts
```

### Uploading Your Changes

After making changes to scripts:

1. First, validate your changes:
   ```bash
   suitecloud project:validate
   ```

2. If validation passes, deploy:
   ```bash
   suitecloud project:deploy
   ```

### Working with Scripts

1. **Where to find scripts**: Look in `src/FileCabinet/SuiteScripts/`
2. **How to edit**: Use any text editor (Notepad++, VS Code, etc.)
3. **File naming**: Follow the existing naming pattern

## Common Commands Reference

| What you want to do | Command to use |
|-------------------|---------------|
| Check connection | `suitecloud account:setup` |
| Download all scripts | `suitecloud object:import --type file --paths /SuiteScripts` |
| Upload changes | `suitecloud project:deploy` |
| Validate project | `suitecloud project:validate` |
| See project details | `suitecloud project:info` |

## Understanding the Folder Structure

```
GOBA-SPORTS-PROD/
├── src/                     # Your working files
│   └── FileCabinet/
│       └── SuiteScripts/   # Your JavaScript files go here
├── suitecloud.config.js    # Your configuration file
└── import-scripts.ps1      # Helper script for importing
```

## Tips for Beginners

1. **Always validate before deploying** - This catches errors before they reach NetSuite
2. **Keep backups** - Copy important scripts before making major changes
3. **Test in sandbox first** - If you have a sandbox account, test there before production
4. **Use meaningful names** - Name your scripts clearly (e.g., `goba_inventory_check.js`)
5. **Add comments** - Document what your code does for future reference

## Getting Help

### If Something Goes Wrong

1. **Authentication Error**: Check your credentials in `suitecloud.config.js`
2. **Validation Error**: Read the error message - it usually tells you what line has the problem
3. **Import Error**: Make sure the file path exists in NetSuite

### Learning Resources

- NetSuite Help Center: https://docs.oracle.com/en/cloud/saas/netsuite/
- SuiteScript Documentation: Search for "SuiteScript 2.x"
- Ask your NetSuite administrator or senior developer

## Your First Script

Here's a simple example to get you started:

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/dialog'], function(dialog) {

    function pageInit(context) {
        // This runs when a page loads
        dialog.alert({
            title: 'Welcome',
            message: 'GOBA Sports Custom Script Loaded!'
        });
    }

    return {
        pageInit: pageInit
    };
});
```

Save this as `goba_welcome.js` in the SuiteScripts folder and deploy it to see it in action!

## Next Steps

Once you're comfortable with the basics:
1. Learn about different script types (Client, User Event, Scheduled, etc.)
2. Explore the NetSuite API documentation
3. Practice with simple customizations
4. Join the NetSuite developer community

Remember: Everyone starts as a beginner. Take it one step at a time!