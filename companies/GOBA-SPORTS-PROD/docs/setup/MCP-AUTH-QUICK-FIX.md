# Glints MCP Authentication - Quick Fix Guide

**Date**: 2025-10-15
**Company**: GOBA Sports
**Issue**: oauth2: server_error
**Root Cause**: Wrong authentication method configured

---

## Problem Summary

**Error**: `oauth2: server_error`
**Why**: We configured Token-Based Auth (TOKEN_ID/TOKEN_SECRET), but Glints MCP requires Certificate Auth (CERTIFICATE_ID/PRIVATE_KEY)

---

## Quick Fix (30 minutes)

### Step 1: Install Go (if not already installed)
```bash
# Download and install Go from:
https://go.dev/dl/

# Verify installation:
go version
```

### Step 2: Generate Certificate in NetSuite

1. Go to: **Setup → Integration → Manage Integrations**
2. Edit: **GOBA Sports MCP Integration**
3. Check: **☑ Certificate Authentication**
4. Click: **Generate Certificate**
5. **IMMEDIATELY DOWNLOAD** the private key (.pem file) - only shown once!
6. Note the **Certificate ID** shown in the integration record

### Step 3: Save Private Key Securely

```powershell
# Create directory
mkdir C:\Users\Ed\.netsuite\certs

# Save downloaded file as:
C:\Users\Ed\.netsuite\certs\netsuite_goba_private.pem

# Set read-only permissions (PowerShell):
icacls "C:\Users\Ed\.netsuite\certs\netsuite_goba_private.pem" /inheritance:r
icacls "C:\Users\Ed\.netsuite\certs\netsuite_goba_private.pem" /grant:r "$env:USERNAME:R"
```

### Step 4: Update MCP Configuration

**File**: `.mcp.json` (Claude Code settings)

**Remove these lines**:
```json
"NETSUITE_TOKEN_ID": "xxx",
"NETSUITE_TOKEN_SECRET": "xxx"
```

**Add these lines**:
```json
"NETSUITE_CERTIFICATE_ID": "<your_cert_id_from_step_2>",
"NETSUITE_PRIVATE_KEY_PATH": "C:\\Users\\Ed\\.netsuite\\certs\\netsuite_goba_private.pem"
```

**Change command from npx to go**:
```json
"command": "go",
"args": ["run", "github.com/glints-dev/mcp-netsuite@latest"]
```

**Complete config example**:
```json
{
  "mcpServers": {
    "netsuite-goba-sports": {
      "command": "go",
      "args": ["run", "github.com/glints-dev/mcp-netsuite@latest"],
      "env": {
        "NETSUITE_ACCOUNT_ID": "7759280",
        "NETSUITE_CLIENT_ID": "ddc8077f885c1336311279a3710d271a279c0fa64ffc957e1e3c4422b87ae834",
        "NETSUITE_CLIENT_SECRET": "f3be846539d4905512a9bd9fdbccc8813debe2a6d02d285783145477db083051",
        "NETSUITE_CERTIFICATE_ID": "<your_cert_id>",
        "NETSUITE_PRIVATE_KEY_PATH": "C:\\Users\\Ed\\.netsuite\\certs\\netsuite_goba_private.pem"
      }
    }
  }
}
```

### Step 5: Test

```bash
# Restart Claude Code

# Check MCP status
/mcp

# Should show: netsuite-goba-sports [Connected]

# Test query
"Get the first 5 customers from GOBA Sports"
```

---

## Security Reminder

**NEVER commit the private key to Git!**

Add to `.gitignore`:
```
*.pem
*.key
.netsuite/certs/
```

---

## Troubleshooting

### Error: "go: command not found"
**Fix**: Install Go from https://go.dev/dl/ and restart terminal

### Error: "Failed to parse private key"
**Fix**: Verify file path in config uses double backslashes: `C:\\Users\\...`

### Error: "Invalid certificate ID"
**Fix**: Check certificate ID in NetSuite integration record matches config

### Still getting "oauth2: server_error"
**Fix**: Verify:
- Private key file exists at the specified path
- File permissions allow reading
- Certificate is enabled in NetSuite integration
- Role has "REST Web Services" permission

---

## Full Documentation

For complete details, see: `GLINTS-MCP-AUTH-RESEARCH.md`

---

**Status**: ✅ Solution Identified
**Next Action**: Complete Steps 1-5 above
**Estimated Time**: 30 minutes
