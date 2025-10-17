# HBNO NetSuite SDF Setup - Beginner's Guide

This guide will walk you through setting up NetSuite SuiteCloud Development Framework (SDF) for HBNO from scratch.

## What is SDF?

SDF (SuiteCloud Development Framework) allows you to:
- Write and edit SuiteScripts locally on your computer
- Version control your NetSuite customizations with Git
- Deploy changes to NetSuite from the command line
- Import existing customizations from NetSuite to your local machine

## Prerequisites

### 1. Software Requirements

- **Node.js** (v14 or higher): [Download here](https://nodejs.org/)
- **Git**: [Download here](https://git-scm.com/)
- **Text Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))
- **Java JDK**: Required by SuiteCloud CLI ([Download JDK 21](https://www.oracle.com/java/technologies/downloads/))

### 2. Check Your Installation

Open a terminal/command prompt and verify:

```bash
# Check Node.js
node --version
# Should show v14.x.x or higher

# Check npm
npm --version

# Check Java
java -version
# Should show version 11 or higher

# Check Git
git --version
```

### 3. Install SuiteCloud CLI

```bash
npm install -g @oracle/suitecloud-cli
```

Verify installation:
```bash
suitecloud --version
```

## NetSuite Configuration

Before you can use SDF, you need to enable features and create credentials in NetSuite.

### Step 1: Enable SuiteCloud Features

1. Log in to NetSuite as Administrator
2. Go to **Setup > Company > Enable Features**
3. Click the **SuiteCloud** tab
4. Enable these features:
   - ✅ **SuiteCloud Development Framework**
   - ✅ **Token-Based Authentication**
5. Click **Save**

### Step 2: Create Integration Record

1. Go to **Setup > Integration > Manage Integrations > New**
2. Fill in:
   - **Name**: `SDF Development - HBNO`
   - **Description**: `SDF CLI access for HBNO development`
   - **State**: Enabled
   - ✅ **Token-Based Authentication** (must be checked)
3. Click **Save**
4. **IMPORTANT**: Copy the **Consumer Key** and **Consumer Secret** that appear
   - You'll only see these once!
   - Save them in a secure location

### Step 3: Create Access Token

1. Go to **Setup > Users/Roles > Access Tokens > New**
2. Fill in:
   - **Application Name**: Select "SDF Development - HBNO" (the integration you just created)
   - **User**: Select your user account
   - **Role**: Administrator (or appropriate development role)
   - **Token Name**: `HBNO SDF Development`
3. Click **Save**
4. **IMPORTANT**: Copy the **Token ID** and **Token Secret** that appear
   - You'll only see these once!
   - Save them in a secure location

### Step 4: Note Your Account ID

1. Go to **Setup > Company > Company Information**
2. Note your **Account ID** (looks like `8606430` or `8606430_SB1` for sandbox)

## Local Project Setup

### Step 1: Navigate to HBNO Directory

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\HBNO"
```

### Step 2: Configure Credentials

1. Open the `.env` file in this directory
2. Replace the placeholder values with your actual credentials:

```bash
NS_ACCOUNT_ID=your_account_id_here          # From Step 4 above
NS_TOKEN_ID=your_token_id_here              # From Step 3 above
NS_TOKEN_SECRET=your_token_secret_here      # From Step 3 above
NS_CONSUMER_KEY=your_consumer_key_here      # From Step 2 above
NS_CONSUMER_SECRET=your_consumer_secret_here # From Step 2 above
```

3. Save the file
4. **NEVER commit this file to Git!** (it's already in .gitignore)

### Step 3: Setup SuiteCloud Account

```bash
suitecloud account:setup
```

You'll be prompted for:
- **Account ID**: Enter from your `.env` file
- **Authentication Mode**: Select "Token Authentication"
- **Token ID**: Enter from your `.env` file
- **Token Secret**: Enter from your `.env` file
- **Consumer Key**: Enter from your `.env` file
- **Consumer Secret**: Enter from your `.env` file
- **Save credentials**: Yes

### Step 4: Test Connection

```bash
suitecloud project:validate
```

If successful, you should see:
```
✓ Validation completed successfully
```

🎉 Congratulations! Your SDF environment is now set up!

## Your First Import

Let's import some existing objects from NetSuite to your local project.

### Import Files from File Cabinet

```bash
suitecloud file:import
```

This will:
1. Show you a list of folders in your File Cabinet
2. Let you select which folders/files to import
3. Download them to `src/FileCabinet/`

### Import Custom Objects

```bash
suitecloud object:import
```

This will let you import:
- Custom Records
- Custom Fields
- Workflows
- Saved Searches
- Script Records (metadata)
- And more

## Basic Workflow

### 1. Import from NetSuite
```bash
suitecloud object:import
```

### 2. Make Changes Locally
Edit files in the `src/` directory using your text editor.

### 3. Validate Changes
```bash
suitecloud project:validate
```

### 4. Deploy to NetSuite
```bash
suitecloud project:deploy
```

## Common Commands Cheat Sheet

```bash
# View all available commands
suitecloud --help

# Import objects
suitecloud object:import

# Import files
suitecloud file:import

# List available objects
suitecloud object:list

# Validate project
suitecloud project:validate

# Deploy to NetSuite
suitecloud project:deploy

# Manage authentication
suitecloud account:manageauth
```

## Directory Structure

```
HBNO/
├── .env                          # Your credentials (DO NOT COMMIT!)
├── .sdfcli.json                  # Auth config (DO NOT COMMIT!)
├── .gitignore                    # Prevents committing sensitive files
├── suitecloud.config.js          # Project configuration
├── README.md                     # Quick reference guide
├── BEGINNER-GUIDE.md            # This file
├── COMPLETE-SETUP.md            # Detailed setup instructions
└── src/                          # Your NetSuite customizations
    ├── FileCabinet/             # File Cabinet files
    │   └── SuiteScripts/        # Your SuiteScripts
    ├── Objects/                  # Custom objects (when imported)
    ├── AccountConfiguration/     # Account settings (when imported)
    ├── deploy.xml               # Deployment config (auto-generated)
    └── manifest.xml             # Project manifest (auto-generated)
```

## Troubleshooting

### "suitecloud: command not found"

**Solution**: Install SuiteCloud CLI:
```bash
npm install -g @oracle/suitecloud-cli
```

### "No account set up"

**Solution**: Run account setup:
```bash
suitecloud account:setup
```

### "Invalid credentials" or "Authentication failed"

**Solution**:
1. Verify credentials in `.env` file are correct
2. Check that Token-Based Authentication is enabled in NetSuite
3. Verify the access token hasn't been deleted or disabled in NetSuite
4. Try creating a new access token

### "JAVA_HOME not set" or Java errors

**Solution**:
1. Install Java JDK 11 or higher
2. Set JAVA_HOME environment variable
3. Restart your terminal

### "Permission denied" errors

**Solution**:
1. Check that your NetSuite role has appropriate permissions
2. Verify the access token's role has necessary permissions
3. Try using Administrator role (for development only)

## Next Steps

1. ✅ Complete the setup steps above
2. ✅ Import some existing scripts: `suitecloud file:import`
3. ✅ Create your first SuiteScript in `src/FileCabinet/SuiteScripts/`
4. ✅ Deploy it: `suitecloud project:deploy`
5. ✅ Explore the [NetSuite SDF documentation](https://docs.oracle.com/en/cloud/saas/netsuite/)

## Getting Help

- Check the main [README.md](README.md) for quick commands
- Review [COMPLETE-SETUP.md](COMPLETE-SETUP.md) for detailed setup
- See the [Multi-Company Guide](../../MULTI-COMPANY-GUIDE.md)
- Use the AI agents in `.claude/agents/` directory for help with:
  - SuiteScript development
  - Troubleshooting
  - Code review
  - Architecture decisions

## Resources

- [NetSuite SDF Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/)
- [SuiteCloud CLI Command Reference](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_156046557150.html)
- [SuiteScript 2.1 API Reference](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/set_1502135122.html)
- [NetSuite Help Center](https://system.netsuite.com/app/help/helpcenter.nl)

---

**Welcome to NetSuite development with SDF!** 🚀
