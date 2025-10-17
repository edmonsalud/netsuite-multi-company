# Glints NetSuite MCP Server - Authentication Research

**Date**: 2025-10-15
**Repository**: https://github.com/glints-dev/mcp-netsuite
**Status**: ⚠️ **CRITICAL FINDING - TOKEN_ID/TOKEN_SECRET NOT USED**

---

## Executive Summary

**PROBLEM IDENTIFIED**: The Glints MCP server uses **certificate-based OAuth 2.0 authentication with RSA private keys**, NOT Token-Based Authentication (TBA) with TOKEN_ID/TOKEN_SECRET.

**Why Authentication Is Failing**:
- We configured: `TOKEN_ID` and `TOKEN_SECRET` (Token-Based Authentication)
- Glints MCP requires: `CERTIFICATE_ID` and `PRIVATE_KEY_PATH` (Certificate Authentication)
- These are completely different authentication methods

---

## Authentication Method Used

### ❌ What It DOES NOT Use
- **Token-Based Authentication (TBA)** - TOKEN_ID/TOKEN_SECRET
- **OAuth 1.0a** - Consumer key/secret with token credentials

### ✅ What It DOES Use
- **OAuth 2.0 Client Credentials Flow**
- **JWT Bearer Assertion**
- **RSA Certificate Authentication (PS256)**

---

## Required Environment Variables

### MANDATORY Variables (5 Required)

| Variable | Purpose | Example | Notes |
|----------|---------|---------|-------|
| `NETSUITE_ACCOUNT_ID` | NetSuite account ID | `7759280` | ✅ We have this |
| `NETSUITE_CLIENT_ID` | Integration Client ID | `ddc8077f885c1336...` | ✅ We have this |
| `NETSUITE_CLIENT_SECRET` | Integration Client Secret | `f3be846539d49055...` | ✅ We have this |
| `NETSUITE_CERTIFICATE_ID` | Certificate ID from integration | `abc123...` | ❌ **MISSING** |
| `NETSUITE_PRIVATE_KEY_PATH` | Path to RSA private key (.pem) | `/path/to/key.pem` | ❌ **MISSING** |

### Optional Variables

| Variable | Purpose | Default | Notes |
|----------|---------|---------|-------|
| `NETSUITE_PRIVATE_KEY_PASSWORD` | Password for encrypted key | None | Only if key is encrypted |
| `NETSUITE_RECORD_TYPES` | Comma-separated record types | All | E.g., "customer,item,transaction" |

---

## Exact Authentication Flow

### Step-by-Step Authentication Process

```
┌─────────────────────────────────────────────────────────────┐
│ 1. MCP Server Starts                                        │
│    - Reads environment variables                            │
│    - Loads RSA private key from file                        │
│    - Parses private key (with password if encrypted)        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Create JWT (JSON Web Token)                             │
│    - Header: {"alg": "PS256", "typ": "JWT"}                │
│    - Claims:                                                │
│      * iss (Issuer): CLIENT_ID                             │
│      * scope: "rest_webservices"                           │
│      * aud (Audience): Token endpoint URL                  │
│      * iat (Issued At): Current timestamp                  │
│      * exp (Expires): 1 hour from now                      │
│    - Sign with RSA private key (PS256 algorithm)           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Exchange JWT for Access Token                           │
│    - POST to: https://[ACCOUNT_ID].suitetalk.api.netsuite  │
│                .com/services/rest/auth/oauth2/v1/token     │
│    - Body:                                                  │
│      * grant_type: "client_credentials"                    │
│      * client_assertion_type: "urn:ietf:params:oauth:      │
│        client-assertion-type:jwt-bearer"                   │
│      * client_assertion: [Signed JWT]                      │
│    - Returns: Access token (valid ~1 hour)                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Use Access Token for API Requests                       │
│    - Add header: Authorization: Bearer [access_token]      │
│    - Make SuiteQL queries                                   │
│    - Retrieve metadata                                      │
│    - Token auto-refreshed when expired                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Source Code Analysis

### Authentication Implementation (pkg/netsuite/netsuite.go)

**Key Functions**:

1. **NewClient()**
   ```go
   func NewClient(opts ClientOptions) (*Client, error) {
       // Parse RSA private key
       privateKey, err := jwt.ParseRSAPrivateKeyFromPEMWithPassword(
           opts.PrivateKeyBytes,
           []byte(opts.PrivateKeyPassword),
       )

       // Create OAuth2 config
       oauthConfig := &oauth2.Config{
           ClientID:     opts.ClientID,
           ClientSecret: opts.ClientSecret,
           Endpoint: oauth2.Endpoint{
               TokenURL: fmt.Sprintf("https://%s.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token", opts.AccountID),
           },
       }

       // Create token source with certificate
       tokenSource := oauth2.ReuseTokenSource(nil, &certificateTokenSource{...})
   }
   ```

2. **Certificate Token Source (certificateTokenSource)**
   ```go
   func (ts *certificateTokenSource) Token() (*oauth2.Token, error) {
       // Create JWT claims
       claims := jwt.MapClaims{
           "iss":   ts.clientID,      // Client ID
           "scope": "rest_webservices",
           "aud":   ts.tokenURL,
           "iat":   now.Unix(),
           "exp":   now.Add(time.Hour).Unix(),
       }

       // Sign with PS256 (RSASSA-PSS with SHA-256)
       token := jwt.NewWithClaims(jwt.SigningMethodPS256, claims)
       signedToken, err := token.SignedString(ts.privateKey)

       // Exchange for access token
       // Uses client_credentials grant type
       // Sends client_assertion (signed JWT)
   }
   ```

3. **ClientOptions Struct**
   ```go
   type ClientOptions struct {
       AccountID            string
       ClientID             string
       ClientSecret         string
       CertificateID        string  // NOT used in auth flow directly
       PrivateKeyBytes      []byte  // RSA private key content
       PrivateKeyPassword   string  // Optional key password
   }
   ```

**IMPORTANT NOTE**: `CertificateID` is stored but not directly used in the authentication flow. The actual authentication relies on the RSA private key to sign JWTs.

---

## Why Current Configuration Is Failing

### Current Configuration (from .mcp.json)
```json
{
  "env": {
    "NETSUITE_ACCOUNT_ID": "7759280",
    "NETSUITE_CLIENT_ID": "ddc8077f885c1336...",
    "NETSUITE_CLIENT_SECRET": "f3be846539d49055...",
    "NETSUITE_TOKEN_ID": "xxx",        ← Wrong auth method
    "NETSUITE_TOKEN_SECRET": "xxx"     ← Wrong auth method
  }
}
```

### Why It Fails

1. **MCP Server Initialization**
   - Glints MCP reads `NETSUITE_PRIVATE_KEY_PATH` environment variable
   - This variable is missing → `loadConfig()` gets empty string
   - Attempts to load private key from empty path → File not found

2. **JWT Creation Fails**
   - Without private key, cannot sign JWT
   - Without signed JWT, cannot get access token
   - Authentication fails immediately

3. **Error Manifestation**
   - Error: `oauth2: server_error`
   - Root cause: Cannot create valid client assertion (JWT)
   - NetSuite never receives authentication attempt
   - No audit trail because request never reaches NetSuite

---

## Required NetSuite Setup

### Current Integration Configuration

**What We Have** (from MCP-FINDINGS.md):
- ✅ Integration record created
- ✅ Client ID obtained
- ✅ Client Secret obtained
- ✅ "NetSuite AI Connector Service" scope enabled

**What We're Missing**:
- ❌ Certificate uploaded/generated in integration
- ❌ Certificate ID obtained
- ❌ Private key (.pem file) downloaded/saved

---

### How to Complete Certificate Setup

**Step 1: Access Integration Record**
1. Go to: Setup → Integration → Manage Integrations
2. Find: GOBA Sports MCP Integration
3. Click: Edit

**Step 2: Enable Certificate Authentication**
1. Scroll to: Authentication section
2. Check: ☑ Certificate Authentication (in addition to Token-Based)
3. Choose one:

   **Option A: Generate New Certificate**
   - Click: "Generate Certificate"
   - NetSuite creates RSA key pair
   - Download private key immediately (only shown once!)
   - Note: Certificate ID (shown in integration record)

   **Option B: Upload Existing Certificate**
   - Generate RSA key pair locally:
     ```bash
     # Generate private key
     openssl genrsa -out netsuite_private.pem 2048

     # Extract public key
     openssl rsa -in netsuite_private.pem -pubout -out netsuite_public.pem
     ```
   - Upload public key to NetSuite
   - Note: Certificate ID
   - Keep private key secure

**Step 3: Save Private Key**
1. Save downloaded/generated private key as: `netsuite_goba_private.pem`
2. Store in secure location: `C:\Users\Ed\.netsuite\certs\`
3. Set appropriate file permissions (read-only for current user)

**Step 4: Note Certificate ID**
- Format: Usually a GUID or short identifier
- Displayed in integration record after certificate is added
- Example: `cert_abc123xyz` or just `abc123`

---

## Updated MCP Configuration

### Correct Configuration for Glints MCP

```json
{
  "mcpServers": {
    "netsuite-goba-sports": {
      "command": "go",
      "args": [
        "run",
        "github.com/glints-dev/mcp-netsuite@latest"
      ],
      "env": {
        "NETSUITE_ACCOUNT_ID": "7759280",
        "NETSUITE_CLIENT_ID": "ddc8077f885c1336311279a3710d271a279c0fa64ffc957e1e3c4422b87ae834",
        "NETSUITE_CLIENT_SECRET": "f3be846539d4905512a9bd9fdbccc8813debe2a6d02d285783145477db083051",
        "NETSUITE_CERTIFICATE_ID": "<CERTIFICATE_ID_FROM_INTEGRATION>",
        "NETSUITE_PRIVATE_KEY_PATH": "C:\\Users\\Ed\\.netsuite\\certs\\netsuite_goba_private.pem",
        "NETSUITE_RECORD_TYPES": "customer,vendor,item,transaction,customrecord_*"
      }
    }
  }
}
```

### Configuration Notes

1. **Command**: Must be `go` (not `npx` or `node`)
2. **Private Key Path**: Use absolute path with escaped backslashes for Windows
3. **Certificate ID**: Must match what's shown in NetSuite integration record
4. **Record Types**: Optional, but limits what metadata is exposed
5. **Private Key Password**: Only add if your key is encrypted

---

## Security Considerations

### Private Key Security

**CRITICAL**: The private key is equivalent to your password. Protect it!

**Best Practices**:
- ✅ Store outside of Git repository
- ✅ Use restrictive file permissions (600 on Unix, read-only on Windows)
- ✅ Never commit to version control
- ✅ Add to .gitignore: `*.pem`, `*.key`
- ✅ Consider encrypting the key (with password)
- ✅ Rotate certificates periodically (every 6-12 months)

**Windows File Permissions**:
```powershell
# Set file to read-only for current user only
icacls "C:\Users\Ed\.netsuite\certs\netsuite_goba_private.pem" /inheritance:r
icacls "C:\Users\Ed\.netsuite\certs\netsuite_goba_private.pem" /grant:r "%USERNAME%:R"
```

### Certificate Rotation

**When to Rotate**:
- Every 6-12 months (security best practice)
- When key may have been compromised
- When employee with access leaves
- When integration is being deprecated

**How to Rotate**:
1. Generate new certificate in NetSuite
2. Download new private key
3. Update `NETSUITE_CERTIFICATE_ID` and `NETSUITE_PRIVATE_KEY_PATH`
4. Test connection
5. Delete old certificate from NetSuite

---

## Troubleshooting Guide

### Common Errors

#### Error: "oauth2: server_error"
**Cause**: Cannot create valid JWT (missing/invalid private key)
**Fix**: Verify `NETSUITE_PRIVATE_KEY_PATH` points to valid .pem file

#### Error: "Failed to parse private key"
**Cause**: Private key format is incorrect or encrypted
**Solutions**:
- Ensure key is in PEM format
- If encrypted, set `NETSUITE_PRIVATE_KEY_PASSWORD`
- Try converting key format:
  ```bash
  openssl rsa -in encrypted_key.pem -out unencrypted_key.pem
  ```

#### Error: "Certificate authentication not enabled"
**Cause**: Integration record doesn't have certificate auth enabled
**Fix**: Edit integration in NetSuite, enable "Certificate Authentication"

#### Error: "Invalid certificate ID"
**Cause**: `NETSUITE_CERTIFICATE_ID` doesn't match NetSuite record
**Fix**: Check integration record for correct certificate ID

#### No error, but queries fail
**Cause**: Missing permissions on role assigned to integration
**Fix**: Verify role has:
- SuiteAnalytics Workbook
- REST Web Services
- Access to relevant record types

---

## Comparison: TBA vs Certificate Authentication

### Token-Based Authentication (TBA) - What We Tried

**Used By**:
- SDF CLI (`suitecloud`)
- Legacy integrations
- OAuth 1.0a applications

**Environment Variables**:
```bash
NETSUITE_TOKEN_ID=xxx
NETSUITE_TOKEN_SECRET=xxx
```

**Authentication Flow**:
1. Use OAuth 1.0a signature method
2. Sign each request with token credentials
3. Include signature in Authorization header

**When to Use**:
- SDF projects (project:deploy, file:import)
- Backwards compatibility required
- Single-user integrations

---

### Certificate Authentication - What Glints MCP Uses

**Used By**:
- Modern REST API integrations
- OAuth 2.0 applications
- Enterprise security requirements

**Environment Variables**:
```bash
NETSUITE_CERTIFICATE_ID=xxx
NETSUITE_PRIVATE_KEY_PATH=/path/to/key.pem
```

**Authentication Flow**:
1. Sign JWT with RSA private key
2. Exchange JWT for access token (OAuth 2.0)
3. Use access token for API requests
4. Token auto-refreshes

**When to Use**:
- REST API access (SuiteQL, Record API)
- MCP servers
- Machine-to-machine integration
- Enhanced security requirements

---

## Prerequisites for Using Glints MCP

### 1. Install Go

**Windows**:
1. Download: https://go.dev/dl/ (go1.24.3.windows-amd64.msi)
2. Run installer
3. Verify installation:
   ```bash
   go version
   # Should output: go version go1.24.3 windows/amd64
   ```

**Why Go?**:
- Glints MCP is written in Go
- Uses `go run` to fetch and execute from GitHub
- No local clone needed (downloads automatically)

---

### 2. Generate/Upload Certificate

**Choose One Method**:

**Method A: Let NetSuite Generate (Easiest)**
1. Integration → Generate Certificate button
2. Download private key (only chance!)
3. Save as .pem file
4. Note certificate ID

**Method B: Generate Locally (More Control)**
```bash
# Generate 2048-bit RSA key
openssl genrsa -out netsuite_private.pem 2048

# Extract public key
openssl rsa -in netsuite_private.pem -pubout -out netsuite_public.pem

# Upload public key to NetSuite integration
```

---

### 3. Update MCP Configuration

**File**: `.mcp.json` (in Claude Code settings)

**Replace**:
```json
"NETSUITE_TOKEN_ID": "xxx",
"NETSUITE_TOKEN_SECRET": "xxx"
```

**With**:
```json
"NETSUITE_CERTIFICATE_ID": "<cert_id>",
"NETSUITE_PRIVATE_KEY_PATH": "C:\\Users\\Ed\\.netsuite\\certs\\netsuite_goba_private.pem"
```

---

### 4. Test Connection

**Restart Claude Code**:
```bash
# Exit and restart Claude Code to reload MCP config
```

**Verify MCP Server**:
```bash
# In Claude Code, check MCP status
/mcp

# Should show: netsuite-goba-sports [Connected]
```

**Test Query**:
```bash
# Try a simple SuiteQL query
Can you query the first 5 customers from GOBA Sports?
```

Expected result:
```
Using netsuite_run_suiteql...
Result: 5 customers retrieved
```

---

## Implementation Checklist

Use this checklist to complete the setup:

### Phase 1: Prerequisites
- [ ] Go installed and working (`go version`)
- [ ] Certificate directory created (`C:\Users\Ed\.netsuite\certs\`)
- [ ] .gitignore updated (add `*.pem`, `*.key`)

### Phase 2: NetSuite Configuration
- [ ] Access integration record in NetSuite
- [ ] Enable "Certificate Authentication"
- [ ] Generate/upload certificate
- [ ] Download private key (.pem file)
- [ ] Note certificate ID
- [ ] Verify role permissions (REST Web Services, SuiteAnalytics)

### Phase 3: Local Setup
- [ ] Save private key to: `C:\Users\Ed\.netsuite\certs\netsuite_goba_private.pem`
- [ ] Set restrictive file permissions
- [ ] Verify key is readable: `type <key_path>`

### Phase 4: MCP Configuration
- [ ] Update `.mcp.json` in Claude Code settings
- [ ] Remove: `NETSUITE_TOKEN_ID`, `NETSUITE_TOKEN_SECRET`
- [ ] Add: `NETSUITE_CERTIFICATE_ID`, `NETSUITE_PRIVATE_KEY_PATH`
- [ ] Verify JSON syntax is valid
- [ ] Save configuration

### Phase 5: Testing
- [ ] Restart Claude Code
- [ ] Check MCP status (`/mcp`)
- [ ] Verify "netsuite-goba-sports" shows as connected
- [ ] Run test query (e.g., "Get customer count")
- [ ] Check NetSuite audit trail for API access logs

### Phase 6: Documentation
- [ ] Update `MCP-FINDINGS.md` with success status
- [ ] Document certificate ID in secure location
- [ ] Add certificate rotation reminder (6 months)
- [ ] Create troubleshooting runbook for team

---

## Additional Resources

### Official Documentation
- **NetSuite OAuth 2.0**: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158081952044.html
- **Certificate Authentication**: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_161969042119.html
- **REST Web Services**: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1540391670.html

### Glints MCP Resources
- **GitHub Repository**: https://github.com/glints-dev/mcp-netsuite
- **Issues/Support**: https://github.com/glints-dev/mcp-netsuite/issues
- **Go Installation**: https://go.dev/dl/

### Security Best Practices
- **OWASP API Security**: https://owasp.org/www-project-api-security/
- **Certificate Management**: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_161969042119.html

### Tools
- **OpenSSL (Windows)**: https://slproweb.com/products/Win32OpenSSL.html
- **Go Downloads**: https://go.dev/dl/
- **JWT Debugger**: https://jwt.io/ (for troubleshooting JWT structure)

---

## Summary: What We Learned

### Key Findings

1. **Wrong Authentication Method**
   - Configured: Token-Based Auth (TBA) with TOKEN_ID/TOKEN_SECRET
   - Required: Certificate Auth with CERTIFICATE_ID/PRIVATE_KEY
   - These are fundamentally different OAuth methods

2. **Authentication Flow Details**
   - Uses OAuth 2.0 Client Credentials flow
   - Creates JWT signed with RSA private key (PS256)
   - Exchanges JWT for bearer access token
   - Access token used for all API requests

3. **Missing Components**
   - Certificate not uploaded to NetSuite integration
   - Private key (.pem file) not generated/saved
   - Certificate ID not obtained
   - MCP config missing certificate variables

4. **Why "oauth2: server_error"**
   - Cannot load private key (path not provided)
   - Cannot sign JWT (no private key)
   - Cannot create client assertion
   - OAuth token request fails immediately
   - No request ever reaches NetSuite (explains no audit trail)

### Next Actions

**To fix authentication**:
1. Install Go runtime
2. Generate/upload certificate in NetSuite
3. Download and secure private key
4. Update MCP configuration with certificate variables
5. Restart Claude Code and test

**Estimated time**: 30-45 minutes (once Go is installed)

---

**Document Status**: ✅ Research Complete
**Last Updated**: 2025-10-15
**Next Review**: After implementation attempt
**Owner**: Claude Code Team
