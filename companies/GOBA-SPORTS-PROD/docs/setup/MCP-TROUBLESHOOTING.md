# NetSuite MCP Server - Troubleshooting Guide

This guide covers common issues when setting up and using the NetSuite MCP server with Claude Code.

---

## Table of Contents

1. [MCP Server Not Showing Up](#mcp-server-not-showing-up)
2. [Authentication Errors](#authentication-errors)
3. [Certificate Issues](#certificate-issues)
4. [Connection Timeouts](#connection-timeouts)
5. [Permission Errors](#permission-errors)
6. [Query Execution Failures](#query-execution-failures)
7. [General Debugging](#general-debugging)

---

## MCP Server Not Showing Up

### Symptom
When you run `/mcp` in Claude Code, `netsuite-goba-sports` doesn't appear in the list.

### Solutions

#### 1. Check Configuration File Location
```bash
# Verify .mcp.json exists in project root
ls -la .mcp.json
```

**Expected Location**: `C:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\.mcp.json`

If file is missing or in wrong location, recreate it in the project root.

#### 2. Validate JSON Syntax
Common JSON errors:
- ❌ Trailing commas: `"value",}`
- ✅ No trailing commas: `"value"}`
- ❌ Single quotes: `'value'`
- ✅ Double quotes: `"value"`
- ❌ Backslashes in paths: `C:\Users\...`
- ✅ Forward slashes: `C:/Users/...`

**Validate your JSON**:
```bash
# Use a JSON validator
npx jsonlint .mcp.json
```

#### 3. Restart Claude Code
- **Completely close** Claude Code (not just the window)
- Reopen Claude Code
- Navigate to the project
- Run `/mcp` again

---

## Authentication Errors

### Error: "OAuth authentication failed"

#### Possible Causes:
1. Incorrect Client ID or Secret
2. Integration disabled in NetSuite
3. OAuth not enabled for integration
4. Token-Based Authentication not enabled

#### Solutions:

**Verify Integration in NetSuite**:
1. Go to **Setup > Integration > Manage Integrations**
2. Find "Claude Code MCP Integration"
3. Verify:
   - ✅ **State** = Enabled
   - ✅ **Token-Based Authentication** = Checked
   - ✅ **OAuth 2.0** = Enabled

**Check Credentials**:
1. Open `.mcp.json`
2. Verify `NETSUITE_CLIENT_ID` matches **Consumer Key** from NetSuite
3. Verify `NETSUITE_CLIENT_SECRET` matches **Consumer Secret**
4. No extra spaces before/after values

**Re-generate Credentials**:
If credentials are lost or compromised:
1. Edit integration in NetSuite
2. Click "Reset Credentials"
3. Copy new Client ID and Secret
4. Update `.mcp.json`
5. Restart Claude Code

---

### Error: "Certificate authentication failed"

#### Possible Causes:
1. Incorrect Certificate ID
2. Private key file not found
3. Private key file path incorrect
4. Certificate expired or revoked

#### Solutions:

**Verify Certificate in NetSuite**:
1. Go to **Setup > Company > Setup Tasks > Integration Management**
2. Find your certificate
3. Verify:
   - ✅ Not expired
   - ✅ Not revoked
   - ✅ Certificate ID matches your configuration

**Check Private Key File**:
```bash
# Verify file exists
ls "companies/GOBA-SPORTS-PROD/.credentials/goba-sports-mcp-key.pem"

# Check file permissions (should be readable)
stat "companies/GOBA-SPORTS-PROD/.credentials/goba-sports-mcp-key.pem"
```

**Verify Path in Configuration**:
Open `.mcp.json` and check:
```json
"NETSUITE_PRIVATE_KEY_PATH": "C:/Users/Ed/OneDrive/Desktop/Projects/Netsuite/companies/GOBA-SPORTS-PROD/.credentials/goba-sports-mcp-key.pem"
```

Requirements:
- ✅ Absolute path (starts with `C:/`)
- ✅ Forward slashes (`/`) not backslashes (`\`)
- ✅ File extension is `.pem`
- ✅ No quotes around path in JSON (quotes are part of JSON syntax)

---

## Certificate Issues

### Error: "Unable to read private key file"

#### Solutions:

**Check File Encoding**:
Private key must be in PEM format. Open the file in a text editor:

**Should look like**:
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
...
-----END PRIVATE KEY-----
```

**Should NOT have**:
- Binary/unreadable characters
- Missing headers/footers
- Windows line endings (shouldn't matter, but can cause issues)

**Re-download Certificate**:
If file is corrupted:
1. Go to NetSuite integration management
2. Delete old certificate
3. Create new certificate
4. Download new private key
5. Update Certificate ID in `.mcp.json`

---

### Error: "Private key password required"

If your private key is password-protected, add this to `.mcp.json`:

```json
"env": {
  "NETSUITE_ACCOUNT_ID": "...",
  "NETSUITE_CLIENT_ID": "...",
  "NETSUITE_CLIENT_SECRET": "...",
  "NETSUITE_CERTIFICATE_ID": "...",
  "NETSUITE_PRIVATE_KEY_PATH": "...",
  "NETSUITE_PRIVATE_KEY_PASSWORD": "your_password_here"
}
```

---

## Connection Timeouts

### Error: "Connection timeout" or "Server not responding"

#### Possible Causes:
1. NetSuite account unavailable
2. Network connectivity issues
3. Firewall blocking connection
4. Incorrect Account ID

#### Solutions:

**Verify NetSuite is Accessible**:
1. Open browser
2. Navigate to your NetSuite login page
3. Verify you can log in

**Check Account ID Format**:

Production accounts: `1234567`
Sandbox accounts: `1234567_SB1` (note the underscore and SB suffix)

**Test Network Connectivity**:
```bash
# Ping NetSuite (may not respond to ping, but tests DNS)
ping 1234567.app.netsuite.com
```

**Check Firewall/Proxy**:
- Ensure corporate firewall allows HTTPS to NetSuite
- If using proxy, configure proxy settings
- Check VPN requirements

---

## Permission Errors

### Error: "Insufficient permissions" or "Access denied"

#### Possible Causes:
1. Integration user doesn't have required permissions
2. Role restrictions
3. IP address restrictions

#### Solutions:

**Verify Role Permissions**:
The user/role associated with the integration must have:
- ✅ **Web Services** permission (minimum: View)
- ✅ **SuiteAnalytics** permission (for SuiteQL)
- ✅ **Access** to records you want to query

**Create Dedicated MCP Role** (Recommended):
1. Go to **Setup > Users/Roles > Manage Roles > New**
2. Name: "MCP Integration Role"
3. Add permissions:
   - **Lists > Customers**: View (or Edit if needed)
   - **Lists > Items**: View
   - **Transactions**: View
   - **Reports > SuiteAnalytics**: Full
   - **Setup > Custom Records**: View

**Check IP Restrictions**:
1. Go to **Setup > Company > Enable Features**
2. Under **SuiteCloud** tab, check for IP address restrictions
3. If restricted, add your IP or disable restriction for integration

---

## Query Execution Failures

### Error: "SuiteQL query failed" or "Invalid query"

#### Common Issues:

**1. Query Syntax Error**
- SuiteQL uses SQL-like syntax but has NetSuite-specific requirements
- Table names are NetSuite record types (e.g., `customer`, `item`, `transaction`)
- Use backticks for field names with spaces: `` `field name` ``

**Example of correct SuiteQL**:
```sql
SELECT
  id,
  entityid,
  email
FROM
  customer
WHERE
  isinactive = 'F'
LIMIT 10
```

**2. Permission to Query Record**
- Verify role has permission to view the record type
- Some record types require specific permissions

**3. Field Doesn't Exist**
- Use `netsuite_get_metadata` tool first to see available fields
- Field IDs are case-sensitive

---

### Error: "Metadata retrieval failed"

#### Solutions:

**Verify Record Type Name**:
- Record type must be internal ID (e.g., `customer`, not `Customer`)
- Custom records use `customrecord_xxx` format

**Check Permissions**:
- Role must have "Custom Records" view permission for metadata access

---

## General Debugging

### Enable Verbose Logging

**Check MCP Server Output**:
When you run `/mcp`, look for error messages next to server status.

**Check NetSuite Integration Logs**:
1. Go to **Setup > Integration > Integration Governance**
2. Find recent requests from your MCP integration
3. Check for error details

---

### Test with Minimal Configuration

Create a test configuration to isolate the issue:

**Minimal `.mcp.json`**:
```json
{
  "mcpServers": {
    "test-netsuite": {
      "command": "npx",
      "args": ["-y", "@glints-dev/mcp-netsuite"],
      "env": {
        "NETSUITE_ACCOUNT_ID": "YOUR_ACCOUNT",
        "NETSUITE_CLIENT_ID": "YOUR_CLIENT_ID",
        "NETSUITE_CLIENT_SECRET": "YOUR_SECRET",
        "NETSUITE_CERTIFICATE_ID": "YOUR_CERT_ID",
        "NETSUITE_PRIVATE_KEY_PATH": "ABSOLUTE_PATH_TO_KEY"
      }
    }
  }
}
```

Test with this minimal config, then add complexity once it works.

---

### Verify Environment Variables

**Print current configuration** (be careful not to expose secrets!):

Check that environment variables are being loaded correctly:

```bash
# In Claude Code, you can ask:
"What environment variables are configured for the netsuite-goba-sports MCP server?"
```

This will show if variables are being read correctly (values will be redacted for security).

---

## Common Configuration Mistakes

### ❌ Wrong:
```json
{
  "mcpServers": {
    "netsuite-goba-sports": {
      "command": "npx",
      "args": ["-y", "@glints-dev/mcp-netsuite"],
      "env": {
        "NETSUITE_PRIVATE_KEY_PATH": "companies\\GOBA-SPORTS-PROD\\.credentials\\key.pem",  // Backslashes!
      },
    }  // Trailing comma!
  }
}
```

### ✅ Correct:
```json
{
  "mcpServers": {
    "netsuite-goba-sports": {
      "command": "npx",
      "args": ["-y", "@glints-dev/mcp-netsuite"],
      "env": {
        "NETSUITE_PRIVATE_KEY_PATH": "C:/Users/Ed/OneDrive/Desktop/Projects/Netsuite/companies/GOBA-SPORTS-PROD/.credentials/key.pem"
      }
    }
  }
}
```

---

## Still Having Issues?

### Create a Support Package

1. **Verify configuration** (remove sensitive data first!):
   ```bash
   cat .mcp.json
   ```

2. **Check file structure**:
   ```bash
   tree companies/GOBA-SPORTS-PROD/.credentials
   ```

3. **Test NetSuite connectivity**:
   - Can you log in via browser?
   - Can you use SuiteCloud CLI (`npx suitecloud account:setup`)?

4. **Check MCP server availability**:
   ```bash
   npx @glints-dev/mcp-netsuite --help
   ```

5. **Review error messages**:
   - From `/mcp` command
   - From NetSuite Integration Governance logs

---

## Additional Resources

- [NetSuite OAuth 2.0 Setup Guide](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4389727047.html)
- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [Glints NetSuite MCP GitHub](https://github.com/glints-dev/mcp-netsuite)

---

**Last Updated**: 2025-10-15
