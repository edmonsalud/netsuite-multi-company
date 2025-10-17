# Multi-Company NetSuite Deployment Guide

## Overview
This workspace contains multiple NetSuite company accounts. Each company has its own folder under the `companies/` directory. This guide explains how to properly manage and deploy to different accounts without conflicts.

## Directory Structure
```
Netsuite/
├── companies/
│   ├── ABA-CON/           # Account ID: 8606430
│   ├── GOBA-SPORTS-PROD/  # Account ID: 8606430 (Same as ABA-CON)
│   ├── HMP-Global/        # Account ID: 934272
│   └── HBNO/              # Account ID: TBD
```

## Problem: Multiple Accounts in Same Workspace

### Issues That Can Occur
1. **Authentication Conflicts**: Global environment variables affect all projects
2. **Credential Leakage**: One account's credentials may be accidentally used for another
3. **Deployment Failures**: Wrong account configurations can cause deployment errors
4. **Cross-contamination**: Dependencies and configurations from one account interfere with another

## Solution: Project-Specific Authentication

### 1. Each Company Has Its Own Configuration

Each company folder now contains:
- `.sdfcli.json` - Authentication credentials (git-ignored)
- `suitecloud.config.js` - Project configuration (no credentials)
- `deploy.bat` - Deployment script with proper authentication

### 2. Deployment Scripts

Each company has a `deploy.bat` file that:
- Sets the correct environment variables
- Changes to the correct directory
- Runs the deployment command
- Provides clear feedback on success/failure

## How to Deploy to Each Account

### ABA-CON Deployment
```bash
cd companies/ABA-CON
./deploy.bat
```

### GOBA-SPORTS-PROD Deployment
```bash
cd companies/GOBA-SPORTS-PROD
./deploy.bat
```

### HMP-Global Deployment
1. First, update the credentials in `companies/HMP-Global/deploy.bat`
2. Then run:
```bash
cd companies/HMP-Global
./deploy.bat
```

### HBNO Deployment
1. First, update the credentials in `companies/HBNO/deploy.bat`
2. Then run:
```bash
cd companies/HBNO
./deploy.bat
```

## Setting Up New Company Credentials

### Option 1: Using SuiteCloud CLI (Recommended)
```bash
cd companies/[COMPANY-NAME]
npx suitecloud account:setup
```

### Option 2: Manual Configuration
1. Edit the `.sdfcli.json` file in the company folder
2. Replace placeholder values with actual credentials:
   - Account ID
   - Token ID
   - Token Secret
   - Consumer Key
   - Consumer Secret

### Option 3: Environment Variables (For CI/CD)
Set these before deployment:
```bash
export SUITECLOUD_ACCOUNT_ID=your_account_id
export SUITECLOUD_TOKEN_ID=your_token_id
export SUITECLOUD_TOKEN_SECRET=your_token_secret
```

## Best Practices

### 1. Always Deploy from Company Directory
```bash
# Good
cd companies/ABA-CON
npx suitecloud project:deploy

# Bad (from root)
npx suitecloud project:deploy --project companies/ABA-CON
```

### 2. Use Separate Terminal Sessions
Open different terminal windows for different accounts to avoid environment variable conflicts.

### 3. Verify Account Before Deployment
Always check which account you're deploying to:
```bash
npx suitecloud account:info
```

### 4. Keep Credentials Secure
- Never commit `.sdfcli.json` files
- Don't hardcode credentials in `suitecloud.config.js`
- Use environment variables for CI/CD pipelines

### 5. Clean Environment Between Deployments
If switching accounts in the same terminal:
```bash
# Clear environment variables
unset SUITECLOUD_ACCOUNT_ID
unset SUITECLOUD_TOKEN_ID
unset SUITECLOUD_TOKEN_SECRET
```

## Troubleshooting

### Error: "The SUITESCRIPT feature defined in the manifest does not exist"
**Solution**: Update `manifest.xml` to include correct features:
```xml
<features>
  <feature required="true">SERVERSIDESCRIPTING</feature>
  <feature required="true">SUBSIDIARIES</feature>
</features>
```

### Error: "Object reference is missing in the project"
**Solution**: This means the saved search or custom field referenced doesn't exist in the target account. Either:
1. Add the missing objects to the project
2. Remove references to account-specific objects
3. Add them to the dependencies list in `manifest.xml`

### Error: "Authentication failed"
**Solution**:
1. Check credentials in `.sdfcli.json`
2. Verify token is still valid in NetSuite
3. Run `npx suitecloud account:setup` to reconfigure

### Deployment to Wrong Account
**Solution**:
1. Clear environment variables
2. Navigate to correct company folder
3. Use the company-specific deploy script

## Security Checklist

- [ ] All `.sdfcli.json` files are in `.gitignore`
- [ ] No credentials in `suitecloud.config.js` files
- [ ] Deploy scripts don't expose credentials in logs
- [ ] Each company uses unique authentication tokens
- [ ] Regular audit of committed files for credentials

## Quick Reference

| Company | Account ID | Deploy Command | Status |
|---------|------------|---------------|---------|
| ABA-CON | 8606430 | `companies/ABA-CON/deploy.bat` | ✅ Configured |
| GOBA-SPORTS-PROD | 8606430 | `companies/GOBA-SPORTS-PROD/deploy.bat` | ✅ Configured |
| HMP-Global | 934272 | `companies/HMP-Global/deploy.bat` | ⚠️ Needs Credentials |
| HBNO | TBD | `companies/HBNO/deploy.bat` | ⚠️ Needs Credentials |

## Additional Resources
- [NetSuite SDF Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1501568181.html)
- [SuiteCloud CLI Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1558708800.html)
- [Token-Based Authentication](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4247337262.html)