# NetSuite Browser-Based Authentication Setup Guide

## Overview
This workspace uses browser-based authentication for all NetSuite deployments. No credentials are stored in files - authentication is handled securely through your browser.

## Initial Setup for Each Company

### Step 1: Navigate to Company Directory
```bash
cd companies/[COMPANY-NAME]
```

Available companies:
- `ABA-CON`
- `GOBA-SPORTS-PROD`
- `HMP-Global`
- `HBNO`

### Step 2: Set Up Authentication
Run the authentication setup command:
```bash
npx suitecloud account:setup
```

This will:
1. Open your browser to NetSuite login page
2. Prompt you to authenticate with your NetSuite credentials
3. Store the authentication securely in your system's credential store
4. No passwords or tokens are saved in project files

### Step 3: Verify Authentication
Check that authentication is working:
```bash
npx suitecloud account:info
```

## Deploying to Each Company

### Option 1: Using Deployment Scripts (Recommended)
Each company has a `deploy.bat` script:
```bash
companies/[COMPANY-NAME]/deploy.bat
```

Example:
```bash
companies/ABA-CON/deploy.bat
```

### Option 2: Manual Deployment
Navigate to the company directory and run:
```bash
cd companies/[COMPANY-NAME]
npx suitecloud project:deploy
```

## Authentication Management

### Viewing Current Authentication
```bash
npx suitecloud account:info
```

### Switching Between Accounts
When working with different companies, the authentication is managed per project directory. Simply navigate to the correct company folder before deploying.

### Clearing Authentication
If you need to reset authentication:
```bash
npx suitecloud account:setup --reset
```

## Troubleshooting

### "Not authenticated" Error
**Solution:** Run `npx suitecloud account:setup` from the company directory

### "Invalid credentials" Error
**Solution:**
1. Clear existing authentication: `npx suitecloud account:setup --reset`
2. Set up authentication again: `npx suitecloud account:setup`

### Browser Doesn't Open
**Solution:**
1. Check your default browser settings
2. Try copying the URL from the terminal and opening it manually

### Multiple Account Confusion
**Solution:** Always ensure you're in the correct company directory before running commands:
```bash
pwd  # Check current directory
cd companies/[CORRECT-COMPANY]
npx suitecloud account:setup
```

## Security Best Practices

✅ **DO:**
- Use browser-based authentication
- Run authentication setup from each company directory
- Log out of NetSuite when done working

❌ **DON'T:**
- Store credentials in files
- Share authentication tokens
- Commit any `.sdfcli.json` files with credentials
- Use environment variables with hardcoded tokens

## Quick Reference Commands

| Task | Command |
|------|---------|
| Set up authentication | `npx suitecloud account:setup` |
| Check authentication status | `npx suitecloud account:info` |
| Deploy project | `npx suitecloud project:deploy` |
| Import files from account | `npx suitecloud file:import` |
| List files in account | `npx suitecloud file:list` |

## Company-Specific Notes

### ABA-CON & GOBA-SPORTS-PROD
Both use the same NetSuite account (8606430) but have different projects. Ensure you're in the correct directory for the project you want to deploy.

### HMP-Global
Account ID: 934272 - Has its own separate NetSuite instance.

### HBNO
Needs account ID configuration during first-time setup.

## Need Help?
- NetSuite SDF Documentation: https://docs.oracle.com/en/cloud/saas/netsuite/
- SuiteCloud CLI Reference: https://github.com/oracle/netsuite-suitecloud-sdk