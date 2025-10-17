# NetSuite MCP Troubleshooting Session - GOBA Sports

**Date**: 2025-10-15
**Status**: ⚠️ Connected but Authentication Failing

---

## Current Status

### ✅ What's Working
- MCP server shows as "connected" in Claude Code
- Go installation successful
- Certificate generated and uploaded to NetSuite
- Glints MCP server compiles and starts

### ❌ What's Not Working
- SuiteQL queries fail with: `oauth2: "server_error"`
- Metadata queries fail with: `Connection closed`
- Authentication not completing successfully

---

## Configuration Summary

### NetSuite Account
- **Account ID**: `7759280`
- **Environment**: Production

### Integration Created
- **Name**: MCP Integration TBA
- **Type**: Token-Based Authentication
- **Consumer Key (Client ID)**: `0cb5e5cae2a103d22fa66934a0747f7229a271c8c49b30d0e05724b248906d70`
- **Consumer Secret (Client Secret)**: `ca04e94db5ce75b28497c8275486cf37463e98a310d9571e0234d4abc95aa867`

### Certificate
- **Certificate ID**: `custcertificate3`
- **Private Key**: `goba-sports-mcp-key.pem`
- **Location**: `companies/GOBA-SPORTS-PROD/.credentials/`

### Access Tokens Created
- **Token ID**: `45625f8849dd7862440c4e7198705d34aa3293ac37d57d4937a991364fc426d5`
- **Token Secret**: `be386a766fa0ae9a78562d9148ae1524fa4caa9bf3f16dff8d53f75b4204d88b`

**Note**: Glints MCP server doesn't use TOKEN_ID/TOKEN_SECRET env vars (confirmed by source code)

---

## Authentication Flow Investigation

### What Glints MCP Server Uses
From source code analysis (`cmd/main.go`):
```go
AccountID:          os.Getenv("NETSUITE_ACCOUNT_ID"),
ClientID:           os.Getenv("NETSUITE_CLIENT_ID"),
ClientSecret:       os.Getenv("NETSUITE_CLIENT_SECRET"),
CertificateID:      os.Getenv("NETSUITE_CERTIFICATE_ID"),
PrivateKeyPassword: os.Getenv("NETSUITE_PRIVATE_KEY_PASSWORD"),
```

### What We're Providing
```json
{
  "NETSUITE_ACCOUNT_ID": "7759280",
  "NETSUITE_CLIENT_ID": "0cb5e5cae2a103d22fa66934a0747f7229a271c8c49b30d0e05724b248906d70",
  "NETSUITE_CLIENT_SECRET": "ca04e94db5ce75b28497c8275486cf37463e98a310d9571e0234d4abc95aa867",
  "NETSUITE_CERTIFICATE_ID": "custcertificate3",
  "NETSUITE_PRIVATE_KEY_PATH": "C:/Users/Ed/.../goba-sports-mcp-key.pem",
  "NETSUITE_TOKEN_ID": "..." (not used by Glints),
  "NETSUITE_TOKEN_SECRET": "..." (not used by Glints)
}
```

---

## Possible Issues

### 1. Integration Permissions ⚠️ Most Likely
The TBA integration may need specific permissions/roles assigned:
- **SuiteAnalytics** permission (for SuiteQL queries)
- **Web Services** permission
- **RESTlets** permission
- **Specific record-level permissions**

**Action Needed**: Check integration permissions in NetSuite

### 2. Access Token Association
Token-Based Authentication requires:
1. Integration record (Consumer Key/Secret) ✅
2. Certificate ✅
3. **Access Token linking user + role to integration** ✅ Created but may not be used correctly

The Glints MCP server might need the Token ID/Secret to establish the OAuth session, even though it doesn't read them as env vars.

### 3. Certificate-Client ID Mismatch
The certificate was uploaded to NetSuite under one integration (original MCP Integration), but we're now using a different integration (MCP Integration TBA) with different Client ID/Secret.

**Possible Issue**: Certificate might not be associated with the new integration.

### 4. NetSuite API Endpoint Access
The "server_error" might indicate:
- API endpoint not enabled
- Account doesn't have REST Web Services feature enabled
- Firewall/IP restriction blocking API calls

---

## Next Troubleshooting Steps

### Step 1: Verify Integration Permissions
1. Go to **Setup > Integration > Manage Integrations**
2. Edit **"MCP Integration TBA"**
3. In **Authentication** section, verify:
   - ✅ TOKEN-BASED AUTHENTICATION is checked
   - No OAuth 2.0 boxes are checked
4. Check what **permissions/scopes** are available or required

### Step 2: Associate Certificate with New Integration
The certificate `custcertificate3` might only be linked to the old integration.

**Option A**: Upload certificate to new integration
1. Edit "MCP Integration TBA"
2. Look for certificate association settings
3. Link `custcertificate3` or upload the certificate again

**Option B**: Use the original integration
- Switch back to using the original "MCP Integration" Consumer Key/Secret
- Update `.claude.json` with original Client ID/Secret

### Step 3: Check NetSuite Features Enabled
1. Go to **Setup > Company > Enable Features**
2. Under **SuiteCloud** tab, verify:
   - ✅ **Client SuiteScript** enabled
   - ✅ **Server SuiteScript** enabled
   - ✅ **SuiteAnalytics Connect** enabled (for SuiteQL)
   - ✅ **REST Web Services** enabled
   - ✅ **SOAP Web Services** enabled

### Step 4: Test with NetSuite's REST API Directly
Use curl or Postman to test if REST API authentication works:
```bash
curl -X POST https://7759280.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql \
  -H "Authorization: OAuth ..." \
  -d '{"q": "SELECT id FROM customer LIMIT 1"}'
```

If this fails, the issue is with NetSuite setup, not the MCP server.

### Step 5: Check Glints MCP Server Logs
Run the MCP server manually to see actual error messages:
```bash
export NETSUITE_ACCOUNT_ID=7759280
export NETSUITE_CLIENT_ID=0cb5e5ca...
export NETSUITE_CLIENT_SECRET=ca04e94d...
export NETSUITE_CERTIFICATE_ID=custcertificate3
export NETSUITE_PRIVATE_KEY_PATH="C:/Users/Ed/.../goba-sports-mcp-key.pem"

go run github.com/glints-dev/mcp-netsuite/cmd@latest
```

Look for specific error messages about OAuth, certificates, or permissions.

---

## Alternative Solutions

### Option A: Use CData NetSuite MCP Server
- **Pros**: Commercial product, better documentation, professional support
- **Cons**: Requires commercial license (trial available), Java+Maven setup

### Option B: Use NetSuite REST API Directly (No MCP)
- **Pros**: Official NetSuite API, well-documented
- **Cons**: No MCP integration, manual API calls required

### Option C: Wait for Official NetSuite MCP Client
NetSuite AI Connector Service was announced in August 2025. Official MCP client support for Claude Code may be coming.

---

## Resources

- **Glints MCP NetSuite**: https://github.com/glints-dev/mcp-netsuite
- **NetSuite Token-Based Auth**: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4247337262.html
- **NetSuite REST Web Services**: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1540391670.html
- **SuiteQL**: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_156257770590.html

---

**Last Updated**: 2025-10-15 19:30
**Next Action**: Verify integration permissions and certificate association in NetSuite
