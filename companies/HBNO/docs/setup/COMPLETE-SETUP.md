# HBNO NetSuite SDF - Complete Setup Guide

This guide provides detailed, step-by-step instructions for setting up the HBNO NetSuite SDF project.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [NetSuite Configuration](#netsuite-configuration)
3. [Local Environment Setup](#local-environment-setup)
4. [Authentication Setup](#authentication-setup)
5. [Verification](#verification)
6. [First Import](#first-import)

---

## Prerequisites

### Required Software

| Software | Version | Download Link | Purpose |
|----------|---------|---------------|---------|
| Node.js | v14+ | [nodejs.org](https://nodejs.org/) | Runtime for SuiteCloud CLI |
| Java JDK | v11+ (v21 recommended) | [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) | Required by SuiteCloud CLI |
| Git | Latest | [git-scm.com](https://git-scm.com/) | Version control |
| VS Code | Latest | [code.visualstudio.com](https://code.visualstudio.com/) | Code editor (recommended) |

### Verify Installations

```bash
node --version    # Should show v14.x.x or higher
npm --version     # Should show 6.x.x or higher
java -version     # Should show version 11 or higher
git --version     # Should show 2.x.x or higher
```

### Install SuiteCloud CLI

```bash
npm install -g @oracle/suitecloud-cli
```

Verify:
```bash
suitecloud --version
```

---

## NetSuite Configuration

### Step 1: Enable SuiteCloud Features

1. **Log in to NetSuite** with Administrator credentials
2. Navigate to: **Setup > Company > Enable Features**
3. Click the **SuiteCloud** tab
4. Enable the following:
   - ✅ **SuiteCloud Development Framework**
   - ✅ **Token-Based Authentication**
5. Click **Save**
6. Wait for the features to be enabled (may take a few minutes)

### Step 2: Create Integration Record

An Integration Record provides the Consumer Key and Consumer Secret for API access.

1. Navigate to: **Setup > Integration > Manage Integrations > New**
2. Fill in the form:
   ```
   Name: SDF Development - HBNO
   Description: SuiteCloud Development Framework access for HBNO
   State: Enabled
   ```
3. **Authentication** section:
   - ✅ Check **Token-Based Authentication**
4. **Concurrency Limit**: Leave default or set as needed
5. Click **Save**
6. **CRITICAL**: A popup will display your credentials:
   ```
   Consumer Key: [64-character string]
   Consumer Secret: [64-character string]
   ```
   **Copy these immediately** - you cannot retrieve them later!
7. Store in a secure password manager or secure note

### Step 3: Create Access Token

An Access Token provides the Token ID and Token Secret for authentication.

1. Navigate to: **Setup > Users/Roles > Access Tokens > New**
2. Fill in the form:
   ```
   Application Name: SDF Development - HBNO (select from dropdown)
   User: [Your user account]
   Role: Administrator (or a role with SDF permissions)
   Token Name: HBNO SDF Token
   ```
3. Click **Save**
4. **CRITICAL**: A popup will display your credentials:
   ```
   Token ID: [64-character string]
   Token Secret: [64-character string]
   ```
   **Copy these immediately** - you cannot retrieve them later!
5. Store alongside your Consumer Key/Secret

### Step 4: Get Your Account ID

1. Navigate to: **Setup > Company > Company Information**
2. Locate **Account ID**:
   - Production: Simple number like `8606430`
   - Sandbox: May have suffix like `8606430_SB1`
3. Note this down

---

## Local Environment Setup

### Step 1: Navigate to Project Directory

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\HBNO"
```

### Step 2: Verify Project Structure

```bash
dir
```

You should see:
```
.env
.gitignore
suitecloud.config.js
README.md
BEGINNER-GUIDE.md
COMPLETE-SETUP.md
src/
```

### Step 3: Configure Environment Variables

1. Open `.env` file in a text editor
2. Replace placeholder values with your actual credentials:

```bash
# HBNO NetSuite Credentials
NS_ACCOUNT_ID=8606430              # Replace with your Account ID (Step 4 above)
NS_TOKEN_ID=abc123...              # Replace with your Token ID (Step 3 above)
NS_TOKEN_SECRET=xyz789...          # Replace with your Token Secret (Step 3 above)
NS_CONSUMER_KEY=def456...          # Replace with your Consumer Key (Step 2 above)
NS_CONSUMER_SECRET=ghi012...       # Replace with your Consumer Secret (Step 2 above)
```

3. Save the file
4. **Security Check**: Verify `.env` is in `.gitignore`:
   ```bash
   cat .gitignore | grep .env
   ```
   Should show: `.env`

---

## Authentication Setup

### Step 1: Run Account Setup

```bash
suitecloud account:setup
```

### Step 2: Interactive Prompts

The CLI will prompt you for the following information. Enter the values from your `.env` file:

```
? Enter your Account ID:
> 8606430

? Select your authentication mode:
> Token Authentication

? Enter your Token ID:
> [paste your token ID]

? Enter your Token Secret:
> [paste your token secret]

? Enter your Consumer Key:
> [paste your consumer key]

? Enter your Consumer Secret:
> [paste your consumer secret]

? Would you like to save these credentials?
> Yes

? Would you like to set this account as default for this project?
> Yes
```

### Step 3: Verify Authentication File

A `.sdfcli.json` file should be created:

```bash
dir .sdfcli.json
```

**IMPORTANT**: This file is automatically added to `.gitignore`. Never commit it to Git!

---

## Verification

### Step 1: Validate Connection

```bash
suitecloud project:validate
```

**Expected Output**:
```
Starting validation...
✓ Validation completed successfully
```

**If you see errors**:
- Verify credentials in `.env` file
- Check that Token-Based Auth is enabled in NetSuite
- Ensure the access token hasn't been deleted/disabled
- Try creating a new access token

### Step 2: Test Object List

```bash
suitecloud object:list
```

This should display a list of object types you can import (or empty if no custom objects exist yet).

### Step 3: Test File List

```bash
suitecloud file:list
```

This should show folders in your File Cabinet.

---

## First Import

Now that authentication is working, let's import some customizations.

### Import SuiteScripts

```bash
suitecloud file:import
```

Follow the prompts:
1. Select folders to import (e.g., `/SuiteScripts`)
2. CLI will download files to `src/FileCabinet/`

### Import Custom Objects

```bash
suitecloud object:import
```

Follow the prompts:
1. Select object types (e.g., custom fields, workflows)
2. Select specific objects to import
3. CLI will download to `src/Objects/`

### Verify Import

```bash
dir src\FileCabinet\SuiteScripts
dir src\Objects
```

---

## Configuration Files

### suitecloud.config.js

This file configures the SuiteCloud CLI:

```javascript
module.exports = {
    defaultProjectFolder: "src",
    commands: {}
};
```

### deploy.xml

Auto-generated file that specifies what gets deployed. Example:

```xml
<deploy>
    <files>
        <path>~/FileCabinet/SuiteScripts/my_script.js</path>
    </files>
</deploy>
```

### manifest.xml

Auto-generated file that lists all objects in your project.

---

## Development Workflow

### Daily Workflow

```bash
# 1. Pull latest from NetSuite
suitecloud file:import

# 2. Make changes locally in src/

# 3. Validate changes
suitecloud project:validate

# 4. Deploy to NetSuite
suitecloud project:deploy

# 5. Test in NetSuite UI
```

### Best Practices

1. **Always validate before deploying**:
   ```bash
   suitecloud project:validate && suitecloud project:deploy
   ```

2. **Import before making changes**:
   Ensure you have the latest version from NetSuite

3. **Use Git for version control**:
   ```bash
   git add src/
   git commit -m "Add new custom script"
   git push
   ```

4. **Never commit credentials**:
   `.env` and `.sdfcli.json` are in `.gitignore`

---

## Advanced Configuration

### Managing Multiple Accounts

You can set up multiple NetSuite accounts (e.g., Sandbox and Production):

```bash
# Setup sandbox account
suitecloud account:setup

# Save as "sandbox"

# Setup production account
suitecloud account:setup

# Save as "production"

# Switch between accounts
suitecloud account:setup --account sandbox
suitecloud account:setup --account production
```

### Custom Deploy Configuration

Edit `src/deploy.xml` to control what gets deployed:

```xml
<deploy>
    <configuration>
        <preview>false</preview>
        <validateOnly>false</validateOnly>
    </configuration>
    <files>
        <path>~/FileCabinet/SuiteScripts/my_script.js</path>
    </files>
</deploy>
```

---

## Troubleshooting

### Authentication Issues

**Problem**: "Invalid credentials" or "Authentication failed"

**Solutions**:
1. Verify all 5 credentials in `.env` are correct
2. Check Token-Based Auth is enabled: Setup > Company > Enable Features
3. Verify access token exists: Setup > Users/Roles > Access Tokens
4. Try creating a new access token
5. Ensure your role has SDF permissions

### Java Issues

**Problem**: "JAVA_HOME not set" or "Java not found"

**Solutions**:
1. Install Java JDK 11+ (21 recommended)
2. Set environment variable:
   ```
   Windows: setx JAVA_HOME "C:\Program Files\Java\jdk-21"
   Mac/Linux: export JAVA_HOME=/path/to/java
   ```
3. Restart terminal/command prompt

### Permission Issues

**Problem**: "Insufficient permissions" or "Access denied"

**Solutions**:
1. Ensure your NetSuite role has:
   - SuiteCloud Development Framework permissions
   - Access to objects you're trying to import/deploy
2. Try using Administrator role (for development only)
3. Check that access token's role has necessary permissions

### Import/Deploy Failures

**Problem**: Objects fail to import or deploy

**Solutions**:
1. Run validation first: `suitecloud project:validate`
2. Check NetSuite for error details
3. Verify object dependencies are included
4. Try importing/deploying objects individually

---

## Next Steps

1. ✅ Authentication is complete
2. ✅ First import successful
3. 📝 Start developing:
   - Create new SuiteScripts in `src/FileCabinet/SuiteScripts/`
   - Edit existing scripts
   - Import custom objects
4. 🚀 Deploy your changes: `suitecloud project:deploy`
5. 🧪 Test in NetSuite
6. 🔁 Repeat!

---

## Additional Resources

- [NetSuite SDF Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/)
- [SuiteCloud CLI Command Reference](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_156046557150.html)
- [SuiteScript 2.1 API Reference](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/set_1502135122.html)
- [Multi-Company Setup Guide](../../MULTI-COMPANY-GUIDE.md)
- [AI Agents](.claude/agents/) - Use for help with development

---

**Your HBNO NetSuite SDF environment is now fully configured!** 🎉
