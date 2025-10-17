# Multi-Computer Workspace Setup Guide

> Complete guide for setting up this NetSuite development workspace on multiple computers

**Last Updated**: 2025-10-17
**Security Level**: CRITICAL - This workspace contains sensitive NetSuite credentials

---

## 📋 Overview

This workspace is designed to work across multiple computers using Git for synchronization. Sensitive credentials are **NEVER committed to Git** and must be configured separately on each computer.

---

## 🔐 Security Architecture

### What Gets Synced via Git
✅ **Safe to sync (committed to Git):**
- All SuiteScript source code
- Documentation files
- Configuration templates (.template files)
- Project structure
- .gitignore rules
- SuiteCloud project manifests

### What Stays Local
❌ **NEVER synced (excluded from Git):**
- `.mcp.json` - MCP server credentials
- `test-netsuite-*.js` - REST API test scripts with tokens
- `companies/**/*.json` - Exported data files
- `companies/**/*.csv` - Customer/transaction exports
- `companies/**/mcp-server/` - Company-specific MCP servers
- `**/.env` - Environment variables
- `**/.credentials/` - Credential directories
- `**/*.pem` - Certificate files
- `**/*.key` - Private keys

---

## 🚀 Initial Setup: Primary Computer (First Time)

This is the computer where you're setting up the project for the first time.

### Step 1: Verify Git Repository Status

```bash
cd c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite

# Check current status
git status

# Verify .gitignore is protecting credentials
git ls-files | grep -E "(\.mcp\.json|test-netsuite|\.env|credentials)"
# Should return nothing or only .template files
```

### Step 2: Create Remote Repository

**Option A: GitHub (Recommended)**
```bash
# On GitHub.com:
# 1. Create new PRIVATE repository named "netsuite-multi-company"
# 2. DO NOT initialize with README (we have one)

# On your computer:
git remote add origin https://github.com/YOUR_USERNAME/netsuite-multi-company.git
git branch -M main
git push -u origin main
```

**Option B: GitLab**
```bash
# Similar process - create private repo on GitLab
git remote add origin https://gitlab.com/YOUR_USERNAME/netsuite-multi-company.git
git branch -M main
git push -u origin main
```

**Option C: Bitbucket**
```bash
# Similar process - create private repo on Bitbucket
git remote add origin https://bitbucket.org/YOUR_USERNAME/netsuite-multi-company.git
git branch -M main
git push -u origin main
```

### Step 3: Backup Current Credentials

**CRITICAL: Save your current credentials before they're untracked!**

```bash
# Create a secure backup folder (NOT in the Git repo)
mkdir C:\Secure\NetSuite-Credentials

# Backup .mcp.json
copy .mcp.json C:\Secure\NetSuite-Credentials\.mcp.json.backup

# Backup REST API test scripts
copy companies\GOBA-SPORTS-PROD\test-netsuite-api.js C:\Secure\NetSuite-Credentials\goba-test-api.backup
copy companies\GOBA-SPORTS-PROD\test-netsuite-records.js C:\Secure\NetSuite-Credentials\goba-test-records.backup
copy companies\River-Supply-SB\test-netsuite-api.js C:\Secure\NetSuite-Credentials\river-test-api.backup
copy companies\River-Supply-SB\test-netsuite-records.js C:\Secure\NetSuite-Credentials\river-test-records.backup

# Backup any .env files
copy companies\HBNO\.env C:\Secure\NetSuite-Credentials\hbno-env.backup
```

### Step 4: Verify Sensitive Files Are Excluded

```bash
# Check git status - sensitive files should NOT appear
git status

# If you see .mcp.json or test-netsuite-*.js in "Changes to be committed",
# they're still tracked. Untrack them:
git rm --cached .mcp.json
git rm --cached companies/*/test-netsuite-*.js

# Verify they're excluded now
git status
```

---

## 💻 Setup on Additional Computers

Follow these steps to set up the workspace on your other computers.

### Prerequisites

Ensure these are installed on the new computer:
- **Git** (latest version)
- **Node.js** (v18 or higher)
- **Java 21** (for SuiteCloud CLI)
- **Visual Studio Code** (recommended)

### Step 1: Clone the Repository

```bash
# Navigate to your projects directory
cd C:\Users\[YOUR_USERNAME]\OneDrive\Desktop\Projects
# Or your preferred location

# Clone the repository
git clone https://github.com/YOUR_USERNAME/netsuite-multi-company.git Netsuite

# Navigate into the project
cd Netsuite
```

### Step 2: Install Dependencies

```bash
# Install SuiteCloud CLI globally
npm install -g @oracle/suitecloud-cli

# Install project dependencies (if any)
npm install
```

### Step 3: Configure Credentials (CRITICAL)

**Each computer needs its own credential configuration.**

#### Option A: Copy from Secure Backup (Same User)

If you have access to your secure backup (e.g., cloud storage, USB drive):

```bash
# Copy .mcp.json from backup
copy C:\Secure\NetSuite-Credentials\.mcp.json.backup .mcp.json

# Update the path in .mcp.json to match this computer's path
# Edit .mcp.json and change:
# "args": ["C:\\Users\\Ed\\..."]
# to match this computer's path

# Copy REST API test scripts
copy C:\Secure\NetSuite-Credentials\goba-test-api.backup companies\GOBA-SPORTS-PROD\test-netsuite-api.js
copy C:\Secure\NetSuite-Credentials\goba-test-records.backup companies\GOBA-SPORTS-PROD\test-netsuite-records.js
```

#### Option B: Create from Templates (New User or Fresh Setup)

```bash
# Copy template to create .mcp.json
copy .mcp.json.template .mcp.json

# Edit .mcp.json with your credentials
code .mcp.json

# Update these values:
# - ABSOLUTE_PATH_TO_PROJECT: Full path to this project on THIS computer
# - YOUR_ACCOUNT_ID: NetSuite Account ID (from Setup → Company → Company Information)
# - YOUR_CONSUMER_KEY: From Integration Record
# - YOUR_CONSUMER_SECRET: From Integration Record
# - YOUR_TOKEN_ID: From Access Token
# - YOUR_TOKEN_SECRET: From Access Token
```

For REST API test scripts:

```bash
# Navigate to company folder
cd companies\GOBA-SPORTS-PROD

# Copy template
copy ..\..\test-netsuite-api.js.template test-netsuite-api.js

# Edit and add your credentials
code test-netsuite-api.js

# Repeat for other companies as needed
```

### Step 4: Verify Credential Files Are NOT Tracked

**CRITICAL SAFETY CHECK:**

```bash
# Check git status
git status

# You should see:
# - NO .mcp.json
# - NO test-netsuite-*.js
# - NO .env files
# - NO credential files

# If you see any of these, DO NOT COMMIT!
# They should be excluded by .gitignore
```

### Step 5: Test NetSuite Authentication

```bash
# Test GOBA-SPORTS-PROD connection
cd companies\GOBA-SPORTS-PROD
node test-netsuite-api.js

# Expected output: ✅ SUCCESS with customer data

# If you get errors:
# - 401 Unauthorized → Check credentials, verify Account ID
# - 403 Forbidden → Check role permissions
# - 404 Not Found → Check Account ID format
```

### Step 6: Test SuiteCloud CLI Authentication

```bash
# Navigate to a company folder
cd companies\HMP-Global

# Setup SuiteCloud authentication
npx suitecloud account:setup

# Follow prompts to authenticate
# This creates .sdfcli.json (already in .gitignore)

# Test with validation
npx suitecloud project:validate
```

---

## 🔄 Daily Workflow: Syncing Between Computers

### On Computer A (Making Changes)

```bash
# Start of work session - pull latest changes
git pull origin main

# Make your changes (write code, update docs, etc.)

# When ready to sync
git add .
git commit -m "feat(HMP-Global): Add invoice processing script"
git push origin main
```

### On Computer B (Getting Changes)

```bash
# Pull the latest changes
git pull origin main

# Your local credentials remain intact
# Start working immediately
```

### Important Notes

- **Credentials stay local** - Each computer keeps its own `.mcp.json`, test scripts, etc.
- **Templates sync** - .template files sync so new computers can set up easily
- **Data exports stay local** - .csv, .json exports are excluded (may contain sensitive data)
- **Always pull before starting work** - Avoid merge conflicts

---

## 🛠️ Troubleshooting

### Problem: "Credentials file appears in git status"

**Solution:**
```bash
# Untrack the file
git rm --cached .mcp.json

# Verify .gitignore includes it
cat .gitignore | grep mcp.json

# If missing, add to .gitignore:
echo ".mcp.json" >> .gitignore
```

### Problem: "Authentication fails on new computer"

**Solution:**
1. Verify Account ID matches NetSuite (Setup → Company → Company Information)
2. Run Account ID verification: `node verify-account-ids.js`
3. Check credentials haven't expired
4. Verify role has REST API permissions

### Problem: "Merge conflict in company folder"

**Solution:**
```bash
# Check what's conflicting
git status

# If it's .sdfcli.json or credentials:
git checkout --ours companies/COMPANY/.sdfcli.json

# If it's source code, resolve manually
code [conflicting-file]
```

### Problem: "Cannot push - credentials in commit history"

**CRITICAL - Remove sensitive data:**
```bash
# Install BFG Repo Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove sensitive files from history
java -jar bfg.jar --delete-files .mcp.json

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (ONLY if repository is private and you're the only user)
git push --force origin main
```

---

## 📝 Credential Management Best Practices

### DO's ✅
- ✅ **Always use .template files** for version control
- ✅ **Keep backups** of credentials in secure, non-Git location
- ✅ **Verify .gitignore** before pushing
- ✅ **Use strong passwords** for Git hosting
- ✅ **Enable 2FA** on GitHub/GitLab/Bitbucket
- ✅ **Use private repositories** only

### DON'Ts ❌
- ❌ **Never commit .mcp.json** with real credentials
- ❌ **Never commit test-netsuite-*.js** files
- ❌ **Never push to public repositories**
- ❌ **Never share credentials** via email/Slack
- ❌ **Never disable .gitignore** rules for convenience

---

## 🔍 Quick Reference: File Types

| File Type | Git Tracked? | Synced? | Local Setup Required? |
|-----------|-------------|---------|----------------------|
| `.js` (SuiteScripts) | ✅ Yes | ✅ Yes | ❌ No |
| `.md` (Documentation) | ✅ Yes | ✅ Yes | ❌ No |
| `.template` files | ✅ Yes | ✅ Yes | ❌ No |
| `.mcp.json` | ❌ No | ❌ No | ✅ Yes - Create from template |
| `test-netsuite-*.js` | ❌ No | ❌ No | ✅ Yes - Create from template |
| `.env` | ❌ No | ❌ No | ✅ Yes - Create manually |
| `.sdfcli.json` | ❌ No | ❌ No | ✅ Yes - Created by suitecloud CLI |
| `*.csv`, `*.json` (data) | ❌ No | ❌ No | ❌ No - Generated locally |

---

## 🚨 Emergency: Credentials Accidentally Committed

If you accidentally commit credentials to Git:

**IMMEDIATE ACTIONS:**

1. **DO NOT PUSH** to remote if you haven't already
2. **Remove from last commit** (if not pushed):
   ```bash
   git reset --soft HEAD~1
   git restore --staged .mcp.json
   ```

3. **If already pushed** (CRITICAL):
   ```bash
   # Revoke all credentials in NetSuite IMMEDIATELY
   # Setup → Integrations → Manage Integrations → [Integration] → Revoke
   # Setup → Access Tokens → [Token] → Revoke

   # Then clean Git history (see Troubleshooting section above)
   ```

4. **Generate new credentials** in NetSuite
5. **Update local files** with new credentials
6. **Verify .gitignore** is protecting the files

---

## 📞 Support & Resources

### Documentation
- [SuiteCloud CLI Setup](./SDF-SETUP.md)
- [Multi-Company Guide](./MULTI-COMPANY-GUIDE.md)
- [Account ID Verification](./ACCOUNT-IDS.md)
- [REST API Setup](./companies/GOBA-SPORTS-PROD/docs/setup/COMPLETE-SETUP.md)

### Tools
- **Account ID Verification**: `node verify-account-ids.js`
- **REST API Test**: `node companies/[COMPANY]/test-netsuite-api.js`
- **SuiteCloud Validation**: `npx suitecloud project:validate`

### Getting Help
- Check `.gitignore` first for file exclusions
- Review this guide's Troubleshooting section
- Verify credentials using test scripts
- Check CLAUDE.md for project context

---

## ✅ Setup Verification Checklist

Use this checklist after setting up a new computer:

### Initial Clone
- [ ] Git repository cloned successfully
- [ ] All files present (check companies/ folders)
- [ ] No credential files visible in repo
- [ ] .template files present

### Dependencies
- [ ] Node.js installed (check: `node --version`)
- [ ] Java 21 installed (check: `java --version`)
- [ ] SuiteCloud CLI installed (check: `npx suitecloud --version`)

### Credentials
- [ ] `.mcp.json` created from template
- [ ] Paths updated for this computer
- [ ] REST API test scripts created
- [ ] All YOUR_* placeholders replaced
- [ ] Account IDs verified against ACCOUNT-IDS.md

### Security
- [ ] `git status` shows NO credential files
- [ ] .gitignore rules working
- [ ] Credentials backed up securely (outside Git)

### Testing
- [ ] REST API authentication works
- [ ] SuiteCloud CLI authentication works
- [ ] Can pull from Git successfully
- [ ] Can push to Git successfully (test with small change)

### Final Check
- [ ] All tests passing
- [ ] No errors in console
- [ ] Ready to start development

---

**Last Updated**: 2025-10-17
**Author**: Claude Code
**Status**: Active

For questions or issues with multi-computer setup, refer to this guide first.
