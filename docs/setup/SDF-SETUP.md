# NetSuite SDF Setup Guide

Your project is now configured with SuiteCloud Development Framework (SDF)!

## ✅ What's Been Set Up

1. **SuiteCloud CLI Installed**: v3.1.0
2. **Project Structure Created**:
   ```
   Netsuite/
   ├── .claude/agents/          # Your 4 elite agents
   ├── src/
   │   ├── AccountConfiguration/ # Account-level settings
   │   ├── FileCabinet/         # Scripts, templates, files
   │   ├── Objects/             # Custom records, fields, workflows
   │   ├── Translations/        # Multi-language support
   │   ├── deploy.xml           # Deployment configuration
   │   └── manifest.xml         # Project manifest
   └── suitecloud.config.js     # SDF configuration
   ```

---

## 🔐 Step 3: Connect to Your NetSuite Account

### Prerequisites

Before connecting, you need to enable SuiteCloud features in your NetSuite account:

1. **Login to NetSuite** (as Administrator)

2. **Enable SuiteCloud Features**:
   - Go to: **Setup > Company > Enable Features > SuiteCloud**
   - Check these boxes:
     - ✅ **SuiteCloud Development Framework** (SDF)
     - ✅ **Client SuiteScript**
     - ✅ **Server SuiteScript**
   - Click **Save**

3. **Enable Token-Based Authentication** (TBA):
   - Go to: **Setup > Company > Enable Features > SuiteCloud**
   - Under **Manage Authentication**:
     - ✅ **Token-Based Authentication**
   - Click **Save**

### Create Integration Record

4. **Create a New Integration**:
   - Go to: **Setup > Integration > Manage Integrations > New**
   - Fill in:
     - **Name**: `SDF Development`
     - **State**: ENABLED
     - Check: ✅ **Token-Based Authentication**
     - Check: ✅ **TBA: Authorization Flow**
     - **Scope**: Full Access (or specific permissions)
   - Click **Save**

5. **Save These Credentials** (shown once):
   ```
   Consumer Key: [COPY THIS]
   Consumer Secret: [COPY THIS]
   ```

### Create Access Token

6. **Generate Access Token**:
   - Go to: **Setup > Users/Roles > Access Tokens > New**
   - Fill in:
     - **Application Name**: Select "SDF Development" (from step 4)
     - **User**: Select your user
     - **Role**: Select your role (Administrator recommended)
     - **Token Name**: `SDF Local Development`
   - Click **Save**

7. **Save These Credentials** (shown once):
   ```
   Token ID: [COPY THIS]
   Token Secret: [COPY THIS]
   ```

---

## 🔗 Connect Your Project to NetSuite

### Method 1: Interactive Setup (Recommended)

Run this command in your project directory:

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite"
suitecloud account:setup
```

You'll be prompted for:
1. **Account ID**: Your NetSuite account ID (e.g., `TSTDRV1234567`)
   - Find it: Go to **Setup > Company > Company Information**
   - Look for **Account ID**

2. **Authentication Method**: Select `TOKEN AUTHENTICATION`

3. **Token ID**: Paste the Token ID from step 6

4. **Token Secret**: Paste the Token Secret from step 6

5. **Consumer Key**: Paste the Consumer Key from step 5

6. **Consumer Secret**: Paste the Consumer Secret from step 5

### Method 2: Manual Configuration

Alternatively, create this file:

**`.sdfcli.json`** (in project root):
```json
{
  "defaultAuthId": "myaccount",
  "authIds": {
    "myaccount": {
      "accountId": "TSTDRV1234567",
      "tokenId": "YOUR_TOKEN_ID",
      "tokenSecret": "YOUR_TOKEN_SECRET",
      "urls": {
        "app": "https://TSTDRV1234567.app.netsuite.com",
        "restlet": "https://TSTDRV1234567.restlets.api.netsuite.com",
        "suitetalk": "https://TSTDRV1234567.suitetalk.api.netsuite.com"
      }
    }
  },
  "integrationIds": {
    "myaccount": {
      "consumerKey": "YOUR_CONSUMER_KEY",
      "consumerSecret": "YOUR_CONSUMER_SECRET"
    }
  }
}
```

**⚠️ IMPORTANT**: Add `.sdfcli.json` to `.gitignore` (already done)

---

## ✅ Verify Connection

Test your connection:

```bash
suitecloud account:ci
```

**Expected Output**:
```
Account information:
- Account ID: TSTDRV1234567
- Role: Administrator
- Account type: Sandbox
```

---

## 📥 Import Existing Customizations from NetSuite

Once connected, you can pull existing customizations:

### Import All Objects

```bash
suitecloud object:import
```

This opens an interactive menu where you can select:
- Custom Fields
- Custom Records
- Scripts
- Workflows
- Saved Searches
- etc.

### Import Specific Object Types

```bash
# Import all scripts
suitecloud object:import --type customscript

# Import all custom fields
suitecloud object:import --type customfield

# Import all workflows
suitecloud object:import --type workflow
```

### Import Files from File Cabinet

```bash
suitecloud file:import
```

---

## 🚀 Common SDF Commands

### Deploy to NetSuite

```bash
# Deploy all changes
suitecloud project:deploy

# Preview what will be deployed (dry run)
suitecloud project:validate

# Deploy specific objects
suitecloud object:update --scriptid customscript_example
```

### Pull Updates from NetSuite

```bash
# Import objects
suitecloud object:import

# Import files
suitecloud file:import

# List available objects
suitecloud object:list
```

### Compare Local vs NetSuite

```bash
# Compare project with account
suitecloud project:validate
```

### Manage Multiple Accounts

```bash
# Add another account
suitecloud account:setup

# Switch accounts
suitecloud account:ci

# List all configured accounts
suitecloud account:list
```

---

## 📁 SDF Project Structure Explained

### `src/FileCabinet/`
Place your SuiteScript files here:
```
src/FileCabinet/SuiteScripts/
├── ClientScripts/
│   └── customscript_example_client.js
├── UserEventScripts/
│   └── customscript_example_ue.js
├── ScheduledScripts/
│   └── customscript_example_scheduled.js
└── Libraries/
    └── custom_library.js
```

### `src/Objects/`
XML definitions for custom objects:
```
src/Objects/
├── customrecord_example.xml          # Custom Record Types
├── custombody_example_field.xml      # Body Fields
├── customscript_example_ue.xml       # Script Definitions
├── customdeploy_example_ue.xml       # Script Deployments
└── workflow_example.xml              # Workflows
```

### `src/AccountConfiguration/`
Account-level settings:
```
src/AccountConfiguration/
├── features.xml                       # Enabled Features
└── preferences.xml                    # Account Preferences
```

---

## 🔧 Workflow: Develop → Deploy

### 1. Create/Modify a Script

Create a new script:
```bash
# Create file
touch src/FileCabinet/SuiteScripts/customscript_my_script.js

# Write your code
```

### 2. Create Script Object Definition

Create XML definition:
```bash
# Let SuiteCloud CLI generate it
suitecloud object:create
```

Or manually create `src/Objects/customscript_my_script.xml`:
```xml
<scriptdeployment scriptid="customdeploy_my_script">
  <status>TESTING</status>
  <loglevel>DEBUG</loglevel>
  <recordtype>salesorder</recordtype>
  <scriptfile>[/SuiteScripts/customscript_my_script.js]</scriptfile>
</scriptdeployment>
```

### 3. Validate

```bash
suitecloud project:validate
```

### 4. Deploy

```bash
suitecloud project:deploy
```

---

## 🛠️ Troubleshooting

### Error: "Authentication failed"
- Verify Token ID/Secret haven't expired
- Check Consumer Key/Secret are correct
- Ensure Token-Based Authentication is enabled in NetSuite

### Error: "Object does not exist"
- The object may not be in your account yet
- Import it first: `suitecloud object:import`

### Error: "Insufficient permissions"
- Check that your user role has the required permissions
- Administrator role recommended for development

### Error: "Account is locked"
- Too many failed authentication attempts
- Wait 15 minutes or contact NetSuite support

---

## 📚 Additional Resources

- **Official Documentation**: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1558708800.html
- **SuiteCloud CLI Commands**: `suitecloud --help`
- **NetSuite SDF Community**: https://community.oracle.com/netsuite

---

## 🎯 Next Steps

1. **Complete authentication setup** (steps above)
2. **Test connection**: `suitecloud account:ci`
3. **Import existing customizations**: `suitecloud object:import`
4. **Start developing** using your 4 elite agents!
5. **Deploy changes**: `suitecloud project:deploy`

---

## 🤖 Use Your Elite Agent Framework

Your world-class agents are ready to help:

```bash
# Step 1: Architecture Design
"Use claude-architect agent to design an order approval workflow"

# Step 2: Code Implementation
"Use claude-coder agent to implement the approved architecture"

# Step 3: Code Review
"Use claude-reviewer agent to audit src/FileCabinet/SuiteScripts/my_script.js"

# Step 4: Documentation
"Use claude-documenter agent to create complete documentation"
```

**Orchestration Flow**: Architect → Coder → Reviewer → Documenter

---

**Your NetSuite SDF project is ready! Complete the authentication steps above to start deploying.**
