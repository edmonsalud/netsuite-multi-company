# Import Specific Scripts from ABA-CON

Quick guide to pull `netsuite_contact_url_updater.js` and `netsuite_contact_url_userevent.js` from NetSuite.

## Step 1: Complete Authentication (If Not Done)

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\ABA-CON"
suitecloud account:setup
```

Use credentials from [COMPLETE-SETUP.md](COMPLETE-SETUP.md)

---

## Step 2: Import Files from NetSuite

### Option A: Use PowerShell Helper Script (Recommended)

```powershell
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\ABA-CON"
.\import-scripts.ps1
```

This will:
1. Check authentication
2. Help you import files
3. Search for the contact URL scripts

### Option B: Manual Import Commands

#### Import ALL files from SuiteScripts folder:
```bash
suitecloud file:import --paths /SuiteScripts
```

#### Import from specific folder (if you know where they are):
```bash
# Example: If scripts are in /SuiteScripts/ContactScripts/
suitecloud file:import --paths /SuiteScripts/ContactScripts
```

#### Interactive file browser:
```bash
suitecloud file:import
```
This opens a menu where you can navigate and select files.

---

## Step 3: Find Your Imported Scripts

After import, scripts will be in:
```
src/FileCabinet/SuiteScripts/
```

Search for them:
```bash
# Windows PowerShell
Get-ChildItem -Path src/FileCabinet -Recurse -Filter "*contact_url*.js"

# Git Bash / WSL
find src/FileCabinet -name "*contact_url*.js"
```

---

## Step 4: Import Script Object Definitions

After importing the JavaScript files, also import their SuiteScript object definitions:

```bash
suitecloud object:import --type customscript
```

This imports the XML files that define:
- Script metadata
- Script parameters
- Deployment configurations
- Entry points

Files will be in:
```
src/Objects/
├── customscript_contact_url_updater.xml
├── customdeploy_contact_url_updater.xml
├── customscript_contact_url_userevent.xml
└── customdeploy_contact_url_userevent.xml
```

---

## Expected File Structure

After successful import:

```
ABA-CON/
├── src/
│   ├── FileCabinet/SuiteScripts/
│   │   └── (path in NetSuite)/
│   │       ├── netsuite_contact_url_updater.js
│   │       └── netsuite_contact_url_userevent.js
│   └── Objects/
│       ├── customscript_contact_url_updater.xml
│       ├── customdeploy_contact_url_updater.xml
│       ├── customscript_contact_url_userevent.xml
│       └── customdeploy_contact_url_userevent.xml
```

---

## What Each File Contains

### `netsuite_contact_url_updater.js`
Likely a **Scheduled Script** or **Map/Reduce Script** that:
- Updates contact URL fields
- Processes multiple contacts in batch
- Runs on a schedule

### `netsuite_contact_url_userevent.js`
Likely a **User Event Script** that:
- Triggers when contact records are created/edited
- Validates or auto-populates URL fields
- Runs in real-time

### XML Files (Script Objects)
Define:
- Script type and version
- Parameters and configurations
- Deployment settings
- Execution context

---

## Troubleshooting

### "No account has been set up"
**Solution**: Run `suitecloud account:setup` first

### "File does not exist"
**Possible causes**:
1. File path is different in NetSuite
2. You don't have permission to view the file
3. File might be in a different folder

**Solution**: Use interactive import to browse:
```bash
suitecloud file:import
```

### "Authentication failed"
**Solution**:
1. Check tokens haven't expired
2. Verify credentials in `.env` file
3. Re-run `suitecloud account:setup`

### Can't find script object XMLs
**Solution**: The scripts might not be in your account, or:
```bash
# List all scripts
suitecloud object:list --type customscript

# Search for specific script ID
suitecloud object:list --type customscript | grep -i contact
```

---

## After Import: Work with Elite AI Agents

### Step 1: Architecture Review
```
"Use claude-architect agent to analyze and redesign the contact URL solution architecture"
```

### Step 2: Code Optimization
```
"Use claude-coder agent to optimize src/FileCabinet/SuiteScripts/netsuite_contact_url_updater.js"
```

### Step 3: Code Review
```
"Use claude-reviewer agent to audit the contact URL scripts in companies/ABA-CON"
```

### Step 4: Documentation
```
"Use claude-documenter agent to create complete documentation for the contact URL scripts"
```

**Orchestration Flow**: Architect → Coder → Reviewer → Documenter

---

## Deploy Changes Back to NetSuite

After making modifications:

1. **Validate**:
   ```bash
   suitecloud project:validate
   ```

2. **Deploy**:
   ```bash
   suitecloud project:deploy
   ```

---

## Quick Reference

```bash
# Setup (once)
suitecloud account:setup

# Import files
suitecloud file:import

# Import objects
suitecloud object:import

# List what's available
suitecloud object:list
suitecloud file:list

# Deploy changes
suitecloud project:deploy

# Validate before deploy
suitecloud project:validate
```

---

**Ready to import?** Run the commands above! 🚀
