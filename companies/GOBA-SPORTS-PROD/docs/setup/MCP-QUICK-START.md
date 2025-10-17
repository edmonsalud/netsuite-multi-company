# GOBA Sports MCP Server - Quick Start Checklist

## Prerequisites Setup Status

Use this checklist to track your MCP setup progress.

---

## Step 1: Gather NetSuite Credentials

### A. Account ID
- [ ] Logged into GOBA Sports NetSuite
- [ ] Found Account ID at: Setup > Company > Company Information
- [ ] Account ID: `_________________`

### B. OAuth 2.0 Integration
- [ ] Created integration at: Setup > Integration > Manage Integrations > New
- [ ] Named: "Claude Code MCP Integration"
- [ ] Enabled: Token-Based Authentication ✅
- [ ] Enabled: REST Web Services ✅
- [ ] Client ID (Consumer Key): `_________________`
- [ ] Client Secret (Consumer Secret): `_________________`

### C. Certificate Authentication
- [ ] Created certificate at: Setup > Company > Setup Tasks > Integration Management
- [ ] Downloaded private key file (`.pem`)
- [ ] Saved as: `goba-sports-mcp-key.pem`
- [ ] Certificate ID: `_________________`

---

## Step 2: Configure Local Environment

### A. Private Key File
- [ ] Moved `goba-sports-mcp-key.pem` to:
  ```
  companies/GOBA-SPORTS-PROD/.credentials/
  ```

### B. Create Configuration File
- [ ] Created `mcp-env.json` in `.credentials/` folder
- [ ] Filled in all credentials from Step 1
- [ ] File location:
  ```
  companies/GOBA-SPORTS-PROD/.credentials/mcp-env.json
  ```

**Template:**
```json
{
  "NETSUITE_ACCOUNT_ID": "YOUR_ACCOUNT_ID",
  "NETSUITE_CLIENT_ID": "YOUR_CLIENT_ID",
  "NETSUITE_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
  "NETSUITE_CERTIFICATE_ID": "YOUR_CERT_ID",
  "NETSUITE_PRIVATE_KEY_PATH": "C:/Users/Ed/OneDrive/Desktop/Projects/Netsuite/companies/GOBA-SPORTS-PROD/.credentials/goba-sports-mcp-key.pem"
}
```

---

## Step 3: Update Claude Code MCP Configuration

### A. Edit `.mcp.json`
- [ ] Opened file: `.mcp.json` in project root
- [ ] Found `netsuite-goba-sports` server configuration
- [ ] Replaced placeholder values with actual credentials:
  - [ ] `NETSUITE_ACCOUNT_ID`
  - [ ] `NETSUITE_CLIENT_ID`
  - [ ] `NETSUITE_CLIENT_SECRET`
  - [ ] `NETSUITE_CERTIFICATE_ID`
  - [ ] `NETSUITE_PRIVATE_KEY_PATH` (verify absolute path)

### B. Verify Configuration
- [ ] No trailing commas in JSON
- [ ] All quotes are double quotes (`"`)
- [ ] All paths use forward slashes (`/`) not backslashes (`\`)
- [ ] File saved

---

## Step 4: Test Connection

### A. Restart Claude Code
- [ ] Completely closed Claude Code
- [ ] Reopened Claude Code
- [ ] Navigated to this project

### B. Check MCP Status
- [ ] Ran command: `/mcp`
- [ ] Saw `netsuite-goba-sports` in the list
- [ ] Status shows: **Connected** ✅

### C. Test Basic Query
Try this in Claude Code:
```
Show me the customer record schema in GOBA Sports NetSuite
```

- [ ] Query executed successfully
- [ ] Received schema information

### D. Test SuiteQL
Try this in Claude Code:
```
Run a SuiteQL query in GOBA Sports to show me 5 customers
```

- [ ] Query executed successfully
- [ ] Received customer data

---

## Step 5: Usage Examples

Once connected, try these commands:

### Get Record Metadata
```
What fields are available on the Sales Order record in GOBA Sports?
```

### Query Data
```
Show me all items with quantity on hand less than 10 in GOBA Sports
```

### Generate Scripts
```
Create a User Event script for GOBA Sports that validates the customer email field on beforeSubmit
```

Claude will now use your **actual** field IDs and schema from GOBA Sports!

---

## Troubleshooting

### Issue: MCP Server Not Listed
**Solution:**
- Verify `.mcp.json` is in project root
- Check JSON syntax (no trailing commas)
- Restart Claude Code

### Issue: "Authentication Failed"
**Solution:**
- Verify all credentials are correct
- Check that integration is ENABLED in NetSuite
- Verify certificate hasn't expired
- Check private key file path is absolute

### Issue: "Certificate not found"
**Solution:**
- Verify `goba-sports-mcp-key.pem` exists in `.credentials/` folder
- Check file permissions (must be readable)
- Verify path uses forward slashes: `C:/Users/...`

### Issue: "Account ID invalid"
**Solution:**
- Check Account ID format
- For sandbox, may need underscore: `1234567_SB1`
- No spaces before/after in `.mcp.json`

---

## Security Checklist

- [ ] `.credentials/` folder is in `.gitignore`
- [ ] Never committed credentials to Git
- [ ] Private key file has restricted permissions
- [ ] Using dedicated integration role (not Administrator)
- [ ] OAuth secrets stored securely

---

## What's Next?

Once your MCP server is working:

1. **Explore Your Schema**
   - Ask about custom records
   - Get field lists for any record type
   - Understand relationships between records

2. **Data Analysis**
   - Run SuiteQL queries for business insights
   - Generate reports
   - Find data quality issues

3. **Better SuiteScript Development**
   - Generate scripts with accurate field IDs
   - Get real-time validation
   - Test queries before deploying

4. **Multi-Company Setup**
   - Once GOBA Sports works, repeat for other companies:
     - HMP-Global
     - ABA-CON
     - HBNO
     - River-Supply-SB

---

## Completion

**Setup Completed**: _________________ (Date)
**Tested By**: _________________
**Status**: ⬜ In Progress  ⬜ Working  ⬜ Issues

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
