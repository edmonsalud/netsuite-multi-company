# NetSuite MCP Server Setup Guide - GOBA Sports

> **Purpose**: This guide walks you through setting up the Model Context Protocol (MCP) server to connect Claude Code directly to your GOBA Sports NetSuite account.

## What You'll Achieve

Once configured, you'll be able to:
- Query GOBA Sports NetSuite data using natural language in Claude Code
- Get real-time record schemas and metadata
- Execute SuiteQL queries for data analysis
- Generate SuiteScripts with accurate field IDs from your actual NetSuite schema
- Test searches and reports before deploying

---

## Phase 1: NetSuite Credentials Setup

### Step 1: Get Your NetSuite Account ID

1. Log in to your GOBA Sports NetSuite account
2. Go to **Setup > Company > Company Information**
3. Find **Account ID** (format: `1234567` or `1234567_SB1`)
4. Copy this value

**Save here**: Account ID: `_________________`

---

### Step 2: Create OAuth 2.0 Integration

1. Navigate to **Setup > Integration > Manage Integrations > New**
2. Fill in the form:
   - **Name**: `Claude Code MCP Integration`
   - **Description**: `MCP Server for AI-assisted development`
   - **State**: **Enabled** ✅
   - **Authentication**: Select **Token-Based Authentication**
   - **TBA: Authorization Flow**: Select **Authorization Code Grant**
   - **Scope**: Check all that you need:
     - ✅ **REST Web Services**
     - ✅ **SOAP Web Services**
     - ✅ **RESTlets**
     - ✅ **SuiteTalk (SOAP/REST)**

3. Check **TBA: AUTHORIZATION FLOW** section:
   - ✅ Enable **OAuth 2.0**

4. Click **Save**

5. **IMPORTANT**: After saving, you'll see:
   - **Consumer Key/Client ID**: Copy this immediately
   - **Consumer Secret/Client Secret**: Copy this immediately (you won't see it again!)

**Save here**:
- Client ID: `_________________`
- Client Secret: `_________________`

---

### Step 3: Generate Certificate for Authentication

#### Option A: Generate Certificate in NetSuite (Recommended)

1. Go to **Setup > Company > Setup Tasks > Integration Management**
2. Click **New Certificate**
3. Fill in:
   - **Certificate Name**: `Claude Code MCP Certificate`
   - **Description**: `MCP Server Authentication Certificate`
4. Click **Save**
5. **CRITICAL**: Download the private key file (`.pem`)
   - Save it securely - you'll need this file
   - Save it as: `goba-sports-mcp-key.pem`
6. Note the **Certificate ID** (appears after creation)

**Save here**: Certificate ID: `_________________`

#### Option B: Use Existing SDF Certificate

If you already have an SDF certificate for GOBA Sports:
- You can reuse that certificate
- Just note the Certificate ID from **Setup > Integration > Manage Certificates**

---

### Step 4: Create Integration User Role (Optional but Recommended)

For better security, create a dedicated role for MCP access:

1. Go to **Setup > Users/Roles > Manage Roles > New**
2. Name: `MCP Integration Role`
3. Permissions:
   - **Lists > Customers**: View, Edit (if needed)
   - **Lists > Items**: View, Edit (if needed)
   - **Transactions > Sales**: View
   - **Transactions > Purchases**: View
   - **Reports > SuiteAnalytics**: Full
   - **Setup > Custom Records**: View (for metadata access)

4. Click **Save**

---

### Step 5: Enable Token-Based Authentication for Your User

1. Go to **Setup > Users/Roles > Access Tokens > New**
2. Select:
   - **Application Name**: `Claude Code MCP Integration` (created in Step 2)
   - **User**: Your NetSuite user account (or dedicated integration user)
   - **Role**: `MCP Integration Role` (or your existing role)
   - **Token Name**: `GOBA MCP Token`

3. Click **Save**

4. You'll receive:
   - **Token ID**: Copy this
   - **Token Secret**: Copy this (won't be shown again!)

**Save here**:
- Token ID: `_________________`
- Token Secret: `_________________`

---

## Phase 2: Local Environment Setup

### Step 1: Check System Requirements

**Check if Go is installed** (required for Glints MCP server):

```bash
go version
```

If not installed:
- Download from: https://go.dev/dl/
- Install Go 1.20 or higher
- **OR** use the npx version (no Go required)

---

### Step 2: Secure Credentials Storage

**Create a secure folder for credentials**:

```bash
mkdir companies/GOBA-SPORTS-PROD/.credentials
```

**Move your private key file**:
- Place `goba-sports-mcp-key.pem` in `companies/GOBA-SPORTS-PROD/.credentials/`

**Full path should be**:
```
C:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\GOBA-SPORTS-PROD\.credentials\goba-sports-mcp-key.pem
```

---

### Step 3: Create Environment Configuration

Create a file to store your credentials safely:

**File**: `companies/GOBA-SPORTS-PROD/.credentials/mcp-env.json`

```json
{
  "NETSUITE_ACCOUNT_ID": "YOUR_ACCOUNT_ID_HERE",
  "NETSUITE_CLIENT_ID": "YOUR_CLIENT_ID_HERE",
  "NETSUITE_CLIENT_SECRET": "YOUR_CLIENT_SECRET_HERE",
  "NETSUITE_CERTIFICATE_ID": "YOUR_CERTIFICATE_ID_HERE",
  "NETSUITE_PRIVATE_KEY_PATH": "C:/Users/Ed/OneDrive/Desktop/Projects/Netsuite/companies/GOBA-SPORTS-PROD/.credentials/goba-sports-mcp-key.pem"
}
```

**Fill in with your actual values from Phase 1**.

---

## Phase 3: Claude Code MCP Configuration

### Configure MCP Server

We'll add the GOBA Sports MCP server to Claude Code's configuration.

**Configuration will be added to**: `.mcp.json` (in project root)

```json
{
  "mcpServers": {
    "netsuite-goba-sports": {
      "command": "npx",
      "args": ["-y", "@glints-dev/mcp-netsuite"],
      "env": {
        "NETSUITE_ACCOUNT_ID": "YOUR_ACCOUNT_ID",
        "NETSUITE_CLIENT_ID": "YOUR_CLIENT_ID",
        "NETSUITE_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
        "NETSUITE_CERTIFICATE_ID": "YOUR_CERT_ID",
        "NETSUITE_PRIVATE_KEY_PATH": "C:/Users/Ed/OneDrive/Desktop/Projects/Netsuite/companies/GOBA-SPORTS-PROD/.credentials/goba-sports-mcp-key.pem"
      }
    }
  }
}
```

---

## Phase 4: Testing & Verification

### Test MCP Server Connection

1. **Restart Claude Code** (required after configuration changes)

2. **Check MCP status**:
   ```
   /mcp
   ```

   You should see `netsuite-goba-sports` listed as **Connected** ✅

3. **Test with a simple query**:
   ```
   "Show me the customer record schema in GOBA Sports"
   ```

4. **Test SuiteQL**:
   ```
   "Run a SuiteQL query to show me the first 5 customers in GOBA Sports"
   ```

---

## Troubleshooting

### Error: "Certificate authentication failed"
- **Check**: Certificate ID is correct
- **Check**: Private key path is absolute (not relative)
- **Check**: Private key file has correct permissions (readable)

### Error: "OAuth authentication failed"
- **Check**: Client ID and Secret are correct
- **Check**: Integration is **Enabled** in NetSuite
- **Check**: Token-Based Authentication is enabled

### Error: "Account ID not found"
- **Check**: Account ID format (may need underscores for sandbox: `1234567_SB1`)
- **Check**: No extra spaces in configuration

### MCP Server Not Showing in `/mcp` List
- **Restart Claude Code** completely
- **Check**: `.mcp.json` is in the project root
- **Check**: JSON syntax is valid (no trailing commas)

---

## Security Best Practices

### ✅ DO:
- Keep private keys in `.credentials/` folder only
- Use environment-specific credentials (don't share between accounts)
- Regularly rotate OAuth secrets
- Use dedicated integration roles with minimum required permissions

### ❌ DON'T:
- Commit `.credentials/` folder to Git (it's in `.gitignore`)
- Share private key files
- Use Administrator role for integration
- Hardcode credentials in scripts

---

## What's Next?

Once your MCP server is connected, you can:

1. **Query Live Data**:
   ```
   "Show me all customers with unpaid invoices in GOBA Sports"
   "What custom fields exist on the Sales Order record?"
   ```

2. **Generate Accurate Scripts**:
   ```
   "Create a User Event script that validates the customer email field"
   ```
   Claude will use your actual field IDs and record structure!

3. **Data Analysis**:
   ```
   "Run a SuiteQL query to calculate total revenue by product category this month"
   ```

4. **Schema Exploration**:
   ```
   "What are all the custom records in GOBA Sports?"
   ```

---

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all credentials in Phase 1
3. Check `.mcp.json` syntax
4. Review NetSuite integration logs: Setup > Integration > Integration Governance

---

**Setup Date**: _________________
**Configured By**: _________________
**Last Tested**: _________________
