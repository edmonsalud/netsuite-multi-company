# OAuth2 "server_error" Troubleshooting - NetSuite Deep Dive Research

**Date Created:** 2025-10-15
**Company:** GOBA-SPORTS-PROD
**Purpose:** Comprehensive research on OAuth2 server_error issues in NetSuite context
**Status:** Active Investigation

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Common Causes of OAuth2 server_error](#common-causes-of-oauth2-server_error)
3. [Debugging OAuth Issues in NetSuite](#debugging-oauth-issues-in-netsuite)
4. [Error Messages: Credentials vs Permissions](#error-messages-credentials-vs-permissions)
5. [Known NetSuite OAuth Limitations & Bugs](#known-netsuite-oauth-limitations--bugs)
6. [Solutions from Real-World Cases](#solutions-from-real-world-cases)
7. [Diagnostic Steps to Identify Root Cause](#diagnostic-steps-to-identify-root-cause)
8. [OAuth Flow Comparison](#oauth-flow-comparison)
9. [Go-Based OAuth Implementation Notes](#go-based-oauth-implementation-notes)

---

## Executive Summary

The OAuth2 "server_error" in NetSuite is most commonly caused by **cryptographic signing scheme issues**, specifically NetSuite's deprecation of RSA PKCSv1.5 (effective October 1, 2024). The error manifests as a generic 500 Internal Server Error with `error: "server_error"` response from the token endpoint.

**Critical Finding:** The #1 cause of server_error is using **Application ID instead of Client ID** as the `iss` (issuer) parameter in JWT tokens.

**Security Update:** NetSuite now **requires PS256 algorithm** with **3072-bit or 4096-bit RSA keys** or EC keys (256/384/521 bits).

---

## Common Causes of OAuth2 server_error

### 1. RSA Signing Scheme Deprecation (MOST CRITICAL)

**Issue:** NetSuite deprecated RSA PKCSv1.5 scheme for signing tokens in OAuth 2.0 client credential flow.

**Deadline:** October 1, 2024

**Impact:** Integrations using the old signing scheme receive `server_error` responses when generating access tokens.

**Solution:**
- Switch from RSA PKCSv1.5 to **RSA-PSS** scheme
- Change signing algorithm to **PS256** (mandatory with RSA-PSS)
- Upgrade private key to at least **3072 bits** (or 4096 bits)
- Alternative: Use **EC keys** (256, 384, or 521 bits)

**Code Impact:**
```
OLD: RS256 with PKCSv1.5 padding
NEW: PS256 with PSS padding
```

### 2. Application ID vs Client ID Confusion (MOST COMMON MISTAKE)

**Issue:** Using the Integration Record's "Application ID" instead of "Client ID" as the `iss` parameter in JWT.

**Symptoms:**
- Generic `server_error` response
- No detailed error message in response
- May appear in Login Audit Trail as authentication failure

**Solution:**
- Use the **Client ID** (shown only once when integration record is created)
- Do NOT use the internal "Application ID"
- Client ID is the OAuth consumer key/identifier
- Store Client ID securely when first generated

**How to Identify:**
- Client ID is displayed once upon integration record creation
- Application ID is the internal ID of the integration record itself
- JWT `iss` parameter must be Client ID, not Application ID

### 3. Certificate ID (`kid`) Mismatch

**Issue:** The `kid` (Key ID) parameter in JWT header doesn't match uploaded certificate ID.

**How `kid` Works:**
- `kid` is the Certificate ID from OAuth 2.0 Client Credentials (M2M) Setup
- Generated when you upload certificate in Setup > Integration > Manage Authentication
- NetSuite uses `kid` to lookup which public key to use for signature verification

**JWT Header Structure:**
```json
{
  "alg": "PS256",
  "typ": "JWT",
  "kid": "certificate_id_from_netsuite"
}
```

**Solution:**
- Verify `kid` matches exactly the Certificate ID from NetSuite
- Certificate ID is visible in OAuth 2.0 Client Credentials mapping table
- Case-sensitive match required

### 4. Insufficient Key Length

**Issue:** RSA private key is less than 3072 bits.

**Requirements:**
- RSA keys: **3072 bits minimum** or 4096 bits
- EC keys: 256, 384, or 521 bits
- Certificate format: x.509 with extensions .cer, .pem, or .crt
- Maximum certificate validity: **2 years** (automatically shortened if longer)

**Check Key Size:**
```bash
openssl rsa -in private_key.pem -text -noout | grep "Private-Key"
# Should show: Private-Key: (3072 bit) or (4096 bit)
```

### 5. Missing or Incorrect Required Features

**Issue:** OAuth 2.0 or REST Web Services features not enabled in NetSuite account.

**Required Features:**
1. **REST WEB SERVICES** - Setup > Company > Enable Features > SuiteCloud > SuiteTalk section
2. **OAUTH 2.0** - Setup > Company > Enable Features > SuiteCloud > Manage Authentication section

**Symptoms:**
- Authentication fails before reaching token endpoint
- May receive different error codes (not server_error)
- Integration record options may be grayed out

### 6. Role Permission Issues

**Issue:** Role doesn't have required permissions for OAuth 2.0 authentication.

**Required Permissions:**
- **REST Web Services**: Full level (Permissions > Setup)
- **Log in using Access Tokens**: Full level (Permissions > Setup)
- **Log in using OAuth 2.0 Access Tokens**: Required for OAuth 2.0

**Common Mistakes:**
- Using Administrator role (not allowed for external integrations)
- "Web Services Only Role" checkbox enabled (blocks RESTlet access with user credentials)
- Missing User Access Tokens permission

**Solution:**
- Create custom integration role
- Set both permissions to Full
- Do NOT use built-in Administrator role

### 7. Integration Record Misconfiguration

**Issue:** Token-Based Authentication not enabled on integration record.

**Checklist:**
- [ ] TOKEN-BASED AUTHENTICATION checked
- [ ] CLIENT CREDENTIALS (MACHINE TO MACHINE) GRANT checked (for M2M flow)
- [ ] Consent Screen not required for M2M flow
- [ ] Integration record state is ENABLED

**Location:** Setup > Integration > Manage Integrations > [Your Integration]

### 8. JWT Claims Issues

**Common JWT Claim Errors:**

**iss (Issuer):**
- Must be Client ID (not Application ID)
- Case-sensitive

**aud (Audience):**
- Must be NetSuite account-specific token endpoint URL
- Format: `https://[ACCOUNT_ID].suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`
- Must match exact account ID format

**exp (Expiration):**
- Token must not be expired
- Recommended: Set exp to current time + 5 minutes
- Time synchronization critical (use NTP)

**iat (Issued At):**
- Cannot be in the future
- Server time vs client time sync issues

**scope:**
- Valid scopes: `rest_webservices`, `restlets`, `suite_analytics`
- Space-separated if multiple scopes
- Invalid scopes cause errors

---

## Debugging OAuth Issues in NetSuite

### Method 1: Login Audit Trail (PRIMARY DEBUG TOOL)

**Location:** Setup > Users/Roles > User Management > View Login Audit Trail

**How to Use:**
1. Check "Use Advanced Search" box
2. Click "Results" subtab
3. Add columns:
   - **Detail** - Shows error messages for failures
   - **Token-based Application Name** - Shows which integration
   - **Status** - Success/Failure
   - **Date/Time**
   - **User/Role**

**Filter for OAuth 2.0:**
- Filter by integration name
- Look for Status = "Failure"
- Detail column contains specific error messages

**Limitations:**
- Requests resulting in 500 server errors **may not appear** in audit log
- Log retention: Up to 30 days (shorter with high volume)
- No log entry = issue before NetSuite processes request

### Method 2: JWT Token Validation

**Tool:** https://jwt.io

**What to Check:**
1. **Header:**
   - `alg`: Should be "PS256"
   - `typ`: Should be "JWT"
   - `kid`: Matches NetSuite certificate ID

2. **Payload:**
   - `iss`: Client ID (verify correct)
   - `aud`: Token endpoint URL (verify account ID)
   - `exp`: Not expired
   - `iat`: Not in future
   - `scope`: Valid scope string

3. **Signature:**
   - Verify using public key
   - Should validate successfully

**Red Flags:**
- Invalid signature
- Expired token
- Missing required claims
- Wrong algorithm

### Method 3: Script Execution Logs (For SuiteScript OAuth)

**Location:** Customization > Scripting > Script Execution Log

**Log Levels:**
- **Debug**: Detailed execution info
- **Audit**: Business events
- **Error**: Failures requiring attention
- **Emergency**: Critical system issues

**Using N/log Module:**
```javascript
require(['N/log'], function(log) {
    log.debug('OAuth Debug', 'Token request details: ' + JSON.stringify(details));
    log.error('OAuth Error', 'Token generation failed: ' + error);
});
```

**Access Logs:**
- Customization > Scripting > Script Execution Log
- Filter by script ID and deployment
- Recent logs up to 30 days
- Max 100,000 log calls per hour

### Method 4: RESTlets Execution Log

**Location:** Customization > Scripting > RESTlets Execution Log (when feature enabled)

**Information Provided:**
- Date/time of call
- Duration of request
- User email (if authenticated)
- Action taken
- Script ID and deployment ID
- HTTP status codes

### Method 5: Network Traffic Analysis

**Tools:**
- Postman (OAuth 2.0 testing)
- cURL with verbose mode (`-v` flag)
- Wireshark (deep packet inspection)

**What to Capture:**
- Full HTTP request/response headers
- Token endpoint URL
- Request body (JWT)
- Response status code
- Response body (error details)

**Example cURL:**
```bash
curl -v -X POST "https://[ACCOUNT].suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=[JWT_TOKEN]"
```

### Method 6: Time Synchronization Check

**Issue:** JWT exp/iat claims fail due to clock skew.

**Check System Time:**
```bash
# Windows
w32tm /query /status

# Linux/Mac
ntpdate -q pool.ntp.org
```

**Solution:**
- Sync system clock with NTP server
- Use generous exp window (5 minutes)
- Consider timezone differences

---

## Error Messages: Credentials vs Permissions

### Credential Errors (Wrong Client ID, Certificate, Key)

**Error:** `server_error`
- **Cause:** Wrong signing scheme, wrong Client ID as iss, certificate/key mismatch
- **HTTP Status:** 500 Internal Server Error
- **Response Body:**
  ```json
  {
    "error": "server_error",
    "error_description": "An internal server error occurred"
  }
  ```
- **Login Audit Trail:** May not appear if error is before NetSuite processes request
- **Fix:** Verify signing algorithm (PS256), Client ID (not App ID), certificate kid parameter

**Error:** `invalid_client`
- **Cause:** Client ID not recognized or integration record disabled
- **HTTP Status:** 401 Unauthorized
- **Response Body:**
  ```json
  {
    "error": "invalid_client",
    "error_description": "Client authentication failed"
  }
  ```
- **Login Audit Trail:** "Invalid client credentials"
- **Fix:** Verify Client ID exists, integration record is enabled

**Error:** `invalid_request`
- **Cause:** Malformed request, missing required parameters
- **HTTP Status:** 400 Bad Request
- **Response Body:**
  ```json
  {
    "error": "invalid_request",
    "error_description": "The request is missing a required parameter..."
  }
  ```
- **Login Audit Trail:** "Request parameter missing or invalid"
- **Fix:** Check grant_type, client_assertion_type, client_assertion parameters

**Error:** `invalid_grant`
- **Cause:** JWT signature invalid, token expired, claims invalid
- **HTTP Status:** 400 Bad Request
- **Response Body:**
  ```json
  {
    "error": "invalid_grant",
    "error_description": "The provided authorization grant is invalid..."
  }
  ```
- **Login Audit Trail:** "Invalid grant" or "Token expired"
- **Fix:** Verify signature, check exp/iat claims, validate aud claim

**Refresh Token Expired:**
- **Error:** `invalid_grant`
- **Timing:** After 7 days for Authorization Code flow
- **Response:** "Refresh token expired"
- **Fix:** Re-authorize user through authorization code flow

### Permission Errors (Role, Feature, Access Issues)

**Error:** `invalid_token`
- **Cause:** Token valid but insufficient permissions to access resource
- **HTTP Status:** 401 Unauthorized
- **WWW-Authenticate Header:** `Bearer error="invalid_token", error_description="Invalid login attempt"`
- **Login Audit Trail:** "Invalid login attempt" with user/role details
- **Fix:** Check role permissions (REST Web Services, Access Tokens)

**Error:** HTTP 403 Forbidden
- **Cause:** Role lacks specific permission for requested operation
- **HTTP Status:** 403 Forbidden
- **Response Body:** May include specific permission required
- **Login Audit Trail:** "Insufficient permissions" with permission details
- **Fix:** Add required permissions to role, verify role assignment in OAuth mapping

**Features Not Enabled:**
- **Symptom:** OAuth 2.0 options grayed out or unavailable
- **Cause:** REST WEB SERVICES or OAUTH 2.0 features not enabled
- **Location:** Setup > Company > Enable Features > SuiteCloud
- **Fix:** Enable both features, may require account admin

**Administrator Role Block:**
- **Error:** Generic authentication failure
- **Cause:** Attempting to use built-in Administrator role
- **NetSuite Policy:** Administrator role not allowed for external integrations
- **Fix:** Create custom integration role with same permissions

**Web Services Only Role:**
- **Symptom:** RESTlet access fails with user credential authentication
- **Cause:** "Web Services Only Role" checkbox enabled
- **Fix:** Uncheck "Web Services Only Role" on role record

### How to Differentiate

| Indicator | Credential Issue | Permission Issue |
|-----------|-----------------|------------------|
| HTTP Status | 500, 400, 401 (invalid_client) | 401 (invalid_token), 403 |
| Error Code | server_error, invalid_grant, invalid_client | invalid_token, or no error code |
| Login Audit Trail | May be absent or show "Invalid client" | Shows "Invalid login attempt" with user/role |
| Token Validation | Token signature fails or claims invalid | Token signature valid, claims valid |
| Timing | Fails at token generation | Fails at API call after token obtained |
| WWW-Authenticate | Not present or generic | Contains specific permission error |

---

## Known NetSuite OAuth Limitations & Bugs

### 1. Certificate Upload UI Bug

**Issue:** After uploading certificate, it may not appear in the certificate mapping table.

**Symptoms:**
- Certificate submitted successfully (confirmation message)
- Table remains empty or doesn't update
- Multiple page refreshes don't help

**Workaround:**
- Try different browser
- Clear browser cache
- Wait several minutes and refresh
- Certificate is actually uploaded (check by trying to use it)
- As long as confirmation appears, proceed with integration

**Status:** Known UI rendering issue, doesn't affect functionality

### 2. Environment Isolation (Not a Bug, by Design)

**Issue:** OAuth 2.0 setup in production is NOT copied to sandbox/Release Preview.

**Impact:**
- Each environment requires separate OAuth setup
- Sandbox refresh **clears** OAuth 2.0 configuration
- Must reconfigure after every sandbox refresh

**Affected:**
- OAuth 2.0 Client Credentials (M2M) mappings
- Certificates must be re-uploaded
- Integration records may need reconfiguration

**Workaround:**
- Document OAuth setup process
- Store certificates in secure location for re-upload
- Automate setup where possible
- Plan for reconfiguration in sandbox refresh schedule

### 3. Refresh Token 7-Day Expiration (Authorization Code Flow)

**Issue:** Refresh tokens expire after 7 days, requiring user re-authorization.

**Impact:**
- Cannot fully automate Authorization Code Grant flow
- User interaction required weekly
- Integrations must handle re-authorization flow

**Limitation:** By design for security

**Alternative:** Use Client Credentials (M2M) flow for server-to-server integrations (2-year certificate validity)

**Comparison:**
- Authorization Code: Refresh token expires in 7 days
- Client Credentials: Certificate valid for 2 years

### 4. Access Token 60-Minute Expiration

**Issue:** Access tokens expire after 60 minutes for both flows.

**Impact:**
- Must refresh token every hour
- Integration must handle token refresh logic
- API calls may fail if token expires during operation

**Best Practice:**
- Refresh token proactively before expiration
- Implement token refresh on 401 errors
- Cache tokens with expiration tracking

### 5. Certificate Reuse Restriction

**Issue:** One certificate can only be used for ONE combination of integration record, role, and entity.

**Impact:**
- Need multiple certificates for:
  - Different integration records
  - Different roles with same integration
  - Different entities (subsidiaries) with same integration

**Example:**
```
Integration A + Role 1 + Entity 1 → Certificate 1
Integration A + Role 2 + Entity 1 → Certificate 2 (DIFFERENT)
Integration A + Role 1 + Entity 2 → Certificate 3 (DIFFERENT)
```

**Workaround:**
- Generate multiple key pairs
- Manage certificate inventory
- Document which certificate for which combination

### 6. 500 Errors Don't Appear in Login Audit Trail

**Issue:** Token endpoint 500 errors may not create Login Audit Trail entries.

**Impact:**
- No detailed error information in audit log
- Harder to debug server_error responses
- Must rely on network traffic analysis

**Workaround:**
- Use external logging (application-level)
- Capture full HTTP response
- Test with cURL/Postman to capture error details

### 7. JWT Signing Library Compatibility

**Issue:** Some JWT libraries default to RS256 or don't support PS256.

**Affected Libraries:**
- Older versions of popular JWT libraries
- Libraries that don't implement RFC 7518

**Solution:**
- Verify library supports PS256 (RSA-PSS with SHA-256)
- Update to latest library version
- May need to use different library

**Go Example:** Use `golang.org/x/oauth2` with custom JWT implementation supporting PS256

### 8. Time Synchronization Sensitivity

**Issue:** JWT validation very sensitive to clock skew.

**Symptoms:**
- `invalid_grant` errors on valid-looking tokens
- Intermittent failures
- Errors at specific times

**Root Cause:**
- `exp` (expiration) or `iat` (issued at) claims outside acceptable window
- NetSuite server time vs client time difference

**Solution:**
- Sync client clock with NTP
- Use generous expiration window (5 minutes)
- Set `iat` to current server time

---

## Solutions from Real-World Cases

### Case Study 1: AINIRO.IO Blog - Server Error Solution

**Problem:** NetSuite API returns `server_error` when creating access token.

**Root Cause:** RSA PKCSv1.5 scheme deprecation.

**Solution Implemented:**
1. Modified JWT signing to use RSA-PSS scheme
2. Updated signing algorithm to PS256
3. Upgraded private key to 3,072 bits
4. Changed certificate import method to use PKCS8 format

**Key Learning:** Even if integration worked before October 2024, it requires updates to continue working.

**Technical Details:**
- Old: `crypto.sign('RS256', data, privateKey)`
- New: `crypto.sign('PS256', data, privateKey)` with PSS padding

### Case Study 2: Stack Overflow - Application ID vs Client ID

**Problem:** Invalid login attempt errors despite correct setup.

**Root Cause:** Using Application ID instead of Client ID as JWT `iss` parameter.

**Solution:**
1. Located actual Client ID (shown once at integration record creation)
2. Updated JWT payload `iss` to use Client ID
3. Access tokens generated successfully

**Key Learning:** Application ID (internal record ID) ≠ Client ID (OAuth consumer key)

**Prevention:**
- Store Client ID securely when first generated
- Label clearly in secrets management
- Document difference in team guides

### Case Study 3: Login Audit Trail Troubleshooting

**Problem:** Generic authentication failures with no detail.

**Solution Process:**
1. Enabled advanced search in Login Audit Trail
2. Added "Detail" column to results
3. Found specific error: "Certificate not found for kid parameter"
4. Discovered kid value didn't match uploaded certificate ID
5. Corrected kid to match NetSuite's certificate ID

**Key Learning:** Login Audit Trail Detail column essential for debugging.

### Case Study 4: Time Synchronization Issue

**Problem:** Intermittent `invalid_grant` errors.

**Root Cause:** Client server clock 3 minutes ahead of NetSuite.

**Solution:**
1. Configured NTP on client server
2. Verified time sync with `ntpdate -q`
3. Set exp claim to current time + 5 minutes (instead of 1 minute)
4. Errors resolved

**Key Learning:** JWT exp/iat claims require accurate time synchronization.

### Case Study 5: Role Permissions for M2M

**Problem:** Token generated successfully, but API calls return 401.

**Root Cause:** Role missing "Log in using OAuth 2.0 Access Tokens" permission.

**Solution:**
1. Edited custom integration role
2. Added permission: Permissions > Setup > Log in using OAuth 2.0 Access Tokens = Full
3. Re-tested OAuth mapping
4. API calls succeeded

**Key Learning:** Two separate permissions required:
- Token generation: Log in using Access Tokens
- API access: Log in using OAuth 2.0 Access Tokens

### Case Study 6: Certificate Validity Period

**Problem:** Certificate upload failed silently.

**Root Cause:** Certificate valid for 5 years (NetSuite max is 2 years).

**Solution:**
1. Generated new certificate with 2-year validity
2. Upload succeeded
3. NetSuite automatically truncates to 2 years if longer

**Key Learning:** Certificate validity must be ≤ 2 years, or NetSuite auto-shortens it.

### Case Study 7: Sandbox Refresh Wiped OAuth Config

**Problem:** Integration stopped working after sandbox refresh.

**Root Cause:** OAuth 2.0 setup not copied to refreshed sandbox.

**Solution:**
1. Re-uploaded certificate to sandbox
2. Recreated OAuth 2.0 Client Credentials mapping
3. Tested integration
4. Documented process for future refreshes

**Key Learning:** Plan for OAuth reconfiguration in every sandbox refresh cycle.

---

## Diagnostic Steps to Identify Root Cause

### Step-by-Step Diagnostic Flowchart

**Step 1: Verify Basic Setup**

```
┌─────────────────────────────────────┐
│ Features Enabled?                   │
│ - REST WEB SERVICES                 │
│ - OAUTH 2.0                         │
└─────────────┬───────────────────────┘
              │
              ├─ NO → Enable features in Setup > Company > Enable Features > SuiteCloud
              │
              └─ YES → Continue to Step 2
```

**Step 2: Integration Record Check**

```
┌─────────────────────────────────────┐
│ Integration Record Configured?      │
│ - TOKEN-BASED AUTHENTICATION ✓      │
│ - CLIENT CREDENTIALS GRANT ✓        │
│ - State: ENABLED                    │
└─────────────┬───────────────────────┘
              │
              ├─ NO → Fix integration record configuration
              │
              └─ YES → Continue to Step 3
```

**Step 3: Certificate & Key Validation**

```
┌─────────────────────────────────────┐
│ Certificate Upload Successful?      │
│ - Certificate ID visible?           │
│ - Key size ≥ 3072 bits?            │
│ - Algorithm PS256?                  │
└─────────────┬───────────────────────┘
              │
              ├─ NO → Re-upload with correct specs
              │
              └─ YES → Continue to Step 4
```

**Step 4: JWT Token Construction**

```
┌─────────────────────────────────────┐
│ JWT Token Valid?                    │
│ Test at https://jwt.io              │
│ - Header: alg=PS256, kid=cert_id    │
│ - Payload: iss=CLIENT_ID (not App ID)│
│ - Payload: aud=correct token URL    │
│ - Signature: Validates with pub key │
└─────────────┬───────────────────────┘
              │
              ├─ NO → Fix JWT construction
              │
              └─ YES → Continue to Step 5
```

**Step 5: Time Synchronization**

```
┌─────────────────────────────────────┐
│ Time Sync Correct?                  │
│ - iat: Not in future                │
│ - exp: Not expired                  │
│ - Clock sync: ≤1 min difference     │
└─────────────┬───────────────────────┘
              │
              ├─ NO → Sync with NTP, adjust exp window
              │
              └─ YES → Continue to Step 6
```

**Step 6: Token Endpoint Request**

```
┌─────────────────────────────────────┐
│ Make Token Request                  │
│ POST to token endpoint              │
│ - grant_type=client_credentials     │
│ - client_assertion_type=jwt-bearer  │
│ - client_assertion=[JWT]            │
└─────────────┬───────────────────────┘
              │
              ├─ 500 server_error → Check algorithm (PS256), Client ID (iss), kid parameter
              ├─ 400 invalid_grant → Check JWT signature, exp/iat claims
              ├─ 401 invalid_client → Check Client ID, integration enabled
              ├─ 400 invalid_request → Check required parameters present
              │
              └─ 200 Success → Token received, continue to Step 7
```

**Step 7: API Request with Token**

```
┌─────────────────────────────────────┐
│ Make API Request with Access Token  │
│ Authorization: Bearer [token]       │
└─────────────┬───────────────────────┘
              │
              ├─ 401 invalid_token → Check role permissions
              ├─ 403 Forbidden → Add specific permission to role
              │
              └─ 200 Success → OAuth 2.0 fully functional!
```

### Detailed Diagnostic Checklist

**Pre-Flight Checklist:**

```
□ NetSuite Account Setup
  □ REST WEB SERVICES feature enabled
  □ OAUTH 2.0 feature enabled
  □ Account ID known (for aud claim)
  □ Account realm known (for token endpoint URL)

□ Integration Record
  □ Created at Setup > Integration > Manage Integrations
  □ TOKEN-BASED AUTHENTICATION checked
  □ CLIENT CREDENTIALS (M2M) GRANT checked
  □ Client ID saved (shown once!)
  □ Client Secret saved (if needed)
  □ Integration state = ENABLED

□ Role Configuration
  □ Custom role created (not Administrator)
  □ REST Web Services = Full
  □ Log in using Access Tokens = Full
  □ Log in using OAuth 2.0 Access Tokens = Full
  □ Any specific API permissions added
  □ "Web Services Only Role" NOT checked

□ Certificate & Keys
  □ Private key generated (RSA 3072/4096 or EC 256/384/521)
  □ Public certificate generated (x.509 format)
  □ Certificate valid ≤ 2 years
  □ Certificate uploaded to NetSuite
  □ Certificate ID obtained from mapping table
  □ Certificate format: .cer, .pem, or .crt

□ OAuth 2.0 Client Credentials Mapping
  □ Mapping created at Setup > Integration > Manage Authentication > OAuth 2.0 Client Credentials
  □ Entity selected (if multi-subsidiary)
  □ Role selected (custom integration role)
  □ Application selected (integration record)
  □ Certificate uploaded and mapped
  □ Certificate ID visible in table
```

**JWT Construction Checklist:**

```
□ Header
  □ alg: "PS256"
  □ typ: "JWT"
  □ kid: "[Certificate ID from NetSuite]"

□ Payload
  □ iss: "[Client ID]" (NOT Application ID!)
  □ aud: "https://[ACCOUNT_ID].suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token"
  □ exp: [Current Unix timestamp + 300 seconds]
  □ iat: [Current Unix timestamp]
  □ scope: "rest_webservices" (or other valid scope)

□ Signature
  □ Signing algorithm: PS256 (RSA-PSS with SHA-256)
  □ Private key: Correct key matching uploaded certificate
  □ Signature validates at https://jwt.io
```

**Token Request Checklist:**

```
□ HTTP Method: POST
□ URL: https://[ACCOUNT_ID].suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token
□ Content-Type: application/x-www-form-urlencoded
□ Body Parameters:
  □ grant_type: client_credentials
  □ client_assertion_type: urn:ietf:params:oauth:client-assertion-type:jwt-bearer
  □ client_assertion: [JWT Token]
```

**Error Response Analysis:**

If you receive an error, use this decision tree:

```
Error: server_error (500)
├─ Check JWT signing algorithm → Should be PS256
├─ Check iss claim → Should be Client ID (not Application ID)
├─ Check kid parameter → Should match NetSuite Certificate ID
├─ Check private key size → Should be ≥3072 bits
└─ Check signature → Should validate with public key

Error: invalid_grant (400)
├─ Check JWT signature → Use jwt.io to validate
├─ Check exp claim → Should not be expired
├─ Check iat claim → Should not be in future
├─ Check aud claim → Should match exact token endpoint URL
└─ Check time sync → Sync with NTP server

Error: invalid_client (401)
├─ Check Client ID → Should exist in NetSuite
├─ Check integration record → Should be ENABLED
└─ Check environment → Production vs Sandbox OAuth setup

Error: invalid_request (400)
├─ Check grant_type → Should be "client_credentials"
├─ Check client_assertion_type → Should be "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
├─ Check client_assertion → Should be present and valid JWT
└─ Check Content-Type → Should be "application/x-www-form-urlencoded"

Error: invalid_token (401) - After successful token generation
├─ Check role permissions → Should have OAuth 2.0 Access Tokens permission
├─ Check token expiration → Access token expires in 60 minutes
└─ Check API endpoint → Should be valid NetSuite REST endpoint

Error: HTTP 403 Forbidden - After successful token generation
├─ Check role specific permissions → Add required permission for API endpoint
├─ Check entity/subsidiary access → Role may need subsidiary permissions
└─ Check record-level permissions → Role may need specific record access
```

### Quick Diagnostic Commands

**Check Private Key Size:**
```bash
openssl rsa -in private_key.pem -text -noout | grep "Private-Key"
# Expected output: Private-Key: (3072 bit) or (4096 bit)
```

**Extract Public Key from Private Key:**
```bash
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

**Generate Certificate from Public Key:**
```bash
openssl req -new -x509 -key private_key.pem -out certificate.pem -days 730
# Set -days to 730 or less (2 years max)
```

**View Certificate Details:**
```bash
openssl x509 -in certificate.pem -text -noout
# Check validity period, key size, signature algorithm
```

**Test JWT Signature (with jwt.io or programming):**
```bash
# Example in Node.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('private_key.pem');
const payload = {
  iss: 'CLIENT_ID_HERE',
  aud: 'https://ACCOUNT_ID.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token',
  exp: Math.floor(Date.now() / 1000) + 300,
  iat: Math.floor(Date.now() / 1000),
  scope: 'rest_webservices'
};

const token = jwt.sign(payload, privateKey, {
  algorithm: 'PS256',
  keyid: 'CERTIFICATE_ID_HERE'
});

console.log(token);

// Verify at https://jwt.io
```

**Test Token Endpoint with cURL:**
```bash
curl -v -X POST "https://ACCOUNT_ID.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
  -d "client_assertion=PASTE_JWT_TOKEN_HERE"
```

**Check System Time Sync:**
```bash
# Windows
w32tm /query /status

# Linux
timedatectl status

# Mac
sntp -t pool.ntp.org
```

### Common Diagnostic Patterns

**Pattern 1: Works in Production, Fails in Sandbox**
- **Likely Cause:** OAuth setup not copied to sandbox
- **Solution:** Re-upload certificate and recreate mapping in sandbox

**Pattern 2: Worked Yesterday, Fails Today**
- **Likely Cause:** Token expired or RSA deprecation enforcement
- **Solution:** Check access token expiration (60 min) or update to PS256

**Pattern 3: Works with Postman, Fails in Code**
- **Likely Cause:** JWT signing implementation difference
- **Solution:** Compare JWT tokens from Postman vs code at jwt.io

**Pattern 4: Intermittent Failures at Specific Times**
- **Likely Cause:** Time synchronization issue
- **Solution:** Sync with NTP, expand exp window

**Pattern 5: Token Generated, API Call Fails**
- **Likely Cause:** Permission issue, not credential issue
- **Solution:** Check role permissions for specific API endpoint

---

## OAuth Flow Comparison

### NetSuite Supports Two OAuth 2.0 Flows:

### Flow 1: Authorization Code Grant Flow

**Purpose:** User-facing applications requiring user consent

**Flow Diagram:**
```
User → Application → NetSuite Authorization Endpoint (user consents)
                  ← Authorization Code

Application → NetSuite Token Endpoint (exchange code)
            ← Access Token + Refresh Token

Application → NetSuite API (with access token)
            ← API Response
```

**Characteristics:**
- **User Interaction:** REQUIRED (user must consent)
- **Automation:** Cannot be fully automated
- **Access Token Lifespan:** 60 minutes
- **Refresh Token Lifespan:** 7 DAYS
- **Re-authorization:** Required every 7 days
- **Best For:** Web applications, mobile apps, user-facing integrations

**Tokens:**
1. **Authorization Code:** One-time use, exchange for tokens
2. **Access Token:** Used for API calls, expires in 60 minutes
3. **Refresh Token:** Used to get new access token, expires in 7 days

**Major Limitation:**
- Refresh token only valid 7 days
- User must re-consent weekly
- Not suitable for server-to-server integrations

**Token Endpoint:**
```
POST https://[ACCOUNT].suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token

Body:
  grant_type=authorization_code
  code=[AUTHORIZATION_CODE]
  redirect_uri=[REDIRECT_URI]
  client_id=[CLIENT_ID]
  client_secret=[CLIENT_SECRET]
```

**Refresh Token Endpoint:**
```
POST https://[ACCOUNT].suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token

Body:
  grant_type=refresh_token
  refresh_token=[REFRESH_TOKEN]
  client_id=[CLIENT_ID]
  client_secret=[CLIENT_SECRET]
```

**Error When Refresh Token Expires:**
```json
{
  "error": "invalid_grant",
  "error_description": "Refresh token expired"
}
```

### Flow 2: Client Credentials Flow (M2M - Machine to Machine)

**Purpose:** Server-to-server integrations without user interaction

**Flow Diagram:**
```
Application → Generate JWT (signed with private key)
            → NetSuite Token Endpoint (with JWT)
            ← Access Token

Application → NetSuite API (with access token)
            ← API Response
```

**Characteristics:**
- **User Interaction:** NOT REQUIRED (fully automated)
- **Automation:** Fully automated
- **Access Token Lifespan:** 60 minutes
- **Certificate Validity:** 2 YEARS
- **Re-authorization:** Not needed for 2 years (until cert expires)
- **Best For:** Server-to-server, scheduled jobs, backend integrations

**Tokens:**
1. **Access Token:** Used for API calls, expires in 60 minutes
2. **No Refresh Token:** Generate new access token with same JWT approach

**JWT Required Claims:**
```json
{
  "header": {
    "alg": "PS256",
    "typ": "JWT",
    "kid": "[Certificate ID]"
  },
  "payload": {
    "iss": "[Client ID]",
    "aud": "https://[ACCOUNT].suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token",
    "exp": [Unix timestamp + 300],
    "iat": [Unix timestamp],
    "scope": "rest_webservices"
  }
}
```

**Token Endpoint:**
```
POST https://[ACCOUNT].suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token

Headers:
  Content-Type: application/x-www-form-urlencoded

Body:
  grant_type=client_credentials
  client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
  client_assertion=[JWT_TOKEN]
```

**Certificate-Based:**
- Upload public certificate to NetSuite
- Sign JWT with corresponding private key
- Valid for 2 years
- One certificate per combination of integration/role/entity

### Side-by-Side Comparison

| Feature | Authorization Code Flow | Client Credentials (M2M) Flow |
|---------|------------------------|-------------------------------|
| **User Interaction** | Required | Not required |
| **Automation** | Partial (manual re-auth) | Full |
| **Access Token Expiration** | 60 minutes | 60 minutes |
| **Refresh Mechanism** | Refresh token (7 days) | Generate new JWT |
| **Long-term Validity** | 7 days | 2 years (certificate) |
| **Re-authorization Frequency** | Every 7 days | Every 2 years |
| **Authentication Method** | Client ID + Secret | Certificate + JWT |
| **Signing Requirement** | No signing | JWT must be signed (PS256) |
| **Best For** | User-facing apps | Server-to-server |
| **Complexity** | Lower (no crypto) | Higher (JWT + certificates) |
| **Security** | User consent required | Certificate-based |
| **NetSuite Setup** | Integration record | Integration + certificate mapping |

### When to Use Which Flow?

**Use Authorization Code Grant Flow When:**
- ✅ Building user-facing web application
- ✅ Users need to grant permissions
- ✅ Each user has individual NetSuite account
- ✅ User-specific data access required
- ✅ Weekly re-authorization acceptable

**Use Client Credentials (M2M) Flow When:**
- ✅ Server-to-server integration
- ✅ No user interaction possible
- ✅ Scheduled/automated processes
- ✅ Service account accessing NetSuite
- ✅ Long-running background jobs
- ✅ Need 2-year validity

**Example Use Cases:**

**Authorization Code Flow:**
- SaaS application where users connect their NetSuite account
- Mobile app accessing user's NetSuite data
- Third-party tool requiring user authorization
- Multi-tenant application with user-specific access

**Client Credentials Flow:**
- Scheduled ETL job extracting NetSuite data nightly
- Microservice synchronizing orders to NetSuite
- Backend API integrating with NetSuite REST services
- Automated reporting system
- Data warehouse connector

### OAuth 2.0 vs OAuth 1.0 (TBA)

NetSuite also supports OAuth 1.0 (Token-Based Authentication). Here's the comparison:

| Feature | OAuth 2.0 | OAuth 1.0 (TBA) |
|---------|-----------|-----------------|
| **Request Signing** | Not required | Required (every request) |
| **Complexity** | Simpler | More complex |
| **Token Lifespan** | 60 minutes (access token) | No expiration |
| **Credential Management** | Certificate or Client Secret | Token ID + Token Secret |
| **Standards Compliance** | OAuth 2.0 RFC | OAuth 1.0a RFC |
| **NetSuite Recommendation** | Preferred for new integrations | Legacy support |

**Why OAuth 2.0 is Preferred:**
- No request signing complexity
- Industry-standard protocol
- Better tooling support
- Clearer security model

---

## Go-Based OAuth Implementation Notes

While there aren't many specific Golang examples for NetSuite OAuth 2.0 in the wild, here's what you need to know:

### Standard Go OAuth2 Package

**Package:** `golang.org/x/oauth2`

**Limitation:** This package is designed for standard OAuth 2.0 flows and may not directly support NetSuite's JWT-based client credentials flow.

**Recommendation:** Use the oauth2 package for token management, but implement custom JWT generation for NetSuite.

### Implementing NetSuite OAuth 2.0 in Go

**Required Libraries:**
```go
import (
    "crypto/rsa"
    "crypto/x509"
    "encoding/pem"
    "github.com/golang-jwt/jwt/v5"  // For PS256 support
    "net/http"
    "net/url"
    "time"
)
```

**Key Considerations for Go Implementation:**

#### 1. JWT Signing with PS256

**Challenge:** Need library that supports PS256 (RSA-PSS with SHA-256)

**Solution:** Use `github.com/golang-jwt/jwt/v5` which supports PS256

**Example:**
```go
package main

import (
    "crypto/rsa"
    "crypto/x509"
    "encoding/pem"
    "fmt"
    "github.com/golang-jwt/jwt/v5"
    "io/ioutil"
    "time"
)

func loadPrivateKey(path string) (*rsa.PrivateKey, error) {
    keyData, err := ioutil.ReadFile(path)
    if err != nil {
        return nil, err
    }

    block, _ := pem.Decode(keyData)
    if block == nil {
        return nil, fmt.Errorf("failed to parse PEM block")
    }

    key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
    if err != nil {
        return nil, err
    }

    rsaKey, ok := key.(*rsa.PrivateKey)
    if !ok {
        return nil, fmt.Errorf("not an RSA private key")
    }

    return rsaKey, nil
}

func generateNetSuiteJWT(clientID, accountID, certificateID, privateKeyPath string) (string, error) {
    privateKey, err := loadPrivateKey(privateKeyPath)
    if err != nil {
        return "", err
    }

    now := time.Now()
    claims := jwt.MapClaims{
        "iss":   clientID,  // CRITICAL: Use Client ID, not Application ID
        "aud":   fmt.Sprintf("https://%s.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token", accountID),
        "exp":   now.Add(5 * time.Minute).Unix(),
        "iat":   now.Unix(),
        "scope": "rest_webservices",
    }

    token := jwt.NewWithClaims(jwt.SigningMethodPS256, claims)
    token.Header["kid"] = certificateID  // CRITICAL: Certificate ID from NetSuite

    tokenString, err := token.SignedString(privateKey)
    if err != nil {
        return "", err
    }

    return tokenString, nil
}
```

#### 2. Token Endpoint Request

**Example:**
```go
package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "net/url"
    "strings"
)

type TokenResponse struct {
    AccessToken string `json:"access_token"`
    TokenType   string `json:"token_type"`
    ExpiresIn   int    `json:"expires_in"`
}

type ErrorResponse struct {
    Error            string `json:"error"`
    ErrorDescription string `json:"error_description"`
}

func getAccessToken(accountID, jwtToken string) (*TokenResponse, error) {
    tokenURL := fmt.Sprintf("https://%s.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token", accountID)

    data := url.Values{}
    data.Set("grant_type", "client_credentials")
    data.Set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer")
    data.Set("client_assertion", jwtToken)

    req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
    if err != nil {
        return nil, err
    }

    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    if resp.StatusCode != http.StatusOK {
        var errResp ErrorResponse
        if err := json.Unmarshal(body, &errResp); err != nil {
            return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
        }
        return nil, fmt.Errorf("%s: %s", errResp.Error, errResp.ErrorDescription)
    }

    var tokenResp TokenResponse
    if err := json.Unmarshal(body, &tokenResp); err != nil {
        return nil, err
    }

    return &tokenResp, nil
}
```

#### 3. Making API Requests

**Example:**
```go
package main

import (
    "fmt"
    "io/ioutil"
    "net/http"
)

func callNetSuiteAPI(accountID, accessToken, endpoint string) ([]byte, error) {
    apiURL := fmt.Sprintf("https://%s.suitetalk.api.netsuite.com/services/rest%s", accountID, endpoint)

    req, err := http.NewRequest("GET", apiURL, nil)
    if err != nil {
        return nil, err
    }

    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
    }

    return body, nil
}
```

#### 4. Complete Example with Token Caching

**Production-Ready Example:**
```go
package main

import (
    "crypto/rsa"
    "crypto/x509"
    "encoding/json"
    "encoding/pem"
    "fmt"
    "github.com/golang-jwt/jwt/v5"
    "io/ioutil"
    "net/http"
    "net/url"
    "strings"
    "sync"
    "time"
)

type NetSuiteClient struct {
    accountID     string
    clientID      string
    certificateID string
    privateKey    *rsa.PrivateKey
    accessToken   string
    tokenExpiry   time.Time
    mu            sync.RWMutex
}

func NewNetSuiteClient(accountID, clientID, certificateID, privateKeyPath string) (*NetSuiteClient, error) {
    privateKey, err := loadPrivateKey(privateKeyPath)
    if err != nil {
        return nil, err
    }

    return &NetSuiteClient{
        accountID:     accountID,
        clientID:      clientID,
        certificateID: certificateID,
        privateKey:    privateKey,
    }, nil
}

func (c *NetSuiteClient) ensureValidToken() error {
    c.mu.Lock()
    defer c.mu.Unlock()

    // If token exists and not expired (with 5-minute buffer), use cached token
    if c.accessToken != "" && time.Now().Add(5*time.Minute).Before(c.tokenExpiry) {
        return nil
    }

    // Generate new JWT
    jwtToken, err := c.generateJWT()
    if err != nil {
        return fmt.Errorf("failed to generate JWT: %w", err)
    }

    // Get access token
    tokenResp, err := c.getAccessToken(jwtToken)
    if err != nil {
        return fmt.Errorf("failed to get access token: %w", err)
    }

    c.accessToken = tokenResp.AccessToken
    c.tokenExpiry = time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)

    return nil
}

func (c *NetSuiteClient) generateJWT() (string, error) {
    now := time.Now()
    claims := jwt.MapClaims{
        "iss":   c.clientID,
        "aud":   fmt.Sprintf("https://%s.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token", c.accountID),
        "exp":   now.Add(5 * time.Minute).Unix(),
        "iat":   now.Unix(),
        "scope": "rest_webservices",
    }

    token := jwt.NewWithClaims(jwt.SigningMethodPS256, claims)
    token.Header["kid"] = c.certificateID

    return token.SignedString(c.privateKey)
}

func (c *NetSuiteClient) getAccessToken(jwtToken string) (*TokenResponse, error) {
    tokenURL := fmt.Sprintf("https://%s.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token", c.accountID)

    data := url.Values{}
    data.Set("grant_type", "client_credentials")
    data.Set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer")
    data.Set("client_assertion", jwtToken)

    req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
    if err != nil {
        return nil, err
    }

    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    if resp.StatusCode != http.StatusOK {
        var errResp ErrorResponse
        if err := json.Unmarshal(body, &errResp); err != nil {
            return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
        }
        return nil, fmt.Errorf("%s: %s", errResp.Error, errResp.ErrorDescription)
    }

    var tokenResp TokenResponse
    if err := json.Unmarshal(body, &tokenResp); err != nil {
        return nil, err
    }

    return &tokenResp, nil
}

func (c *NetSuiteClient) Get(endpoint string) ([]byte, error) {
    if err := c.ensureValidToken(); err != nil {
        return nil, err
    }

    c.mu.RLock()
    token := c.accessToken
    c.mu.RUnlock()

    apiURL := fmt.Sprintf("https://%s.suitetalk.api.netsuite.com/services/rest%s", c.accountID, endpoint)

    req, err := http.NewRequest("GET", apiURL, nil)
    if err != nil {
        return nil, err
    }

    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    if resp.StatusCode == http.StatusUnauthorized {
        // Token may have expired, clear cache and retry once
        c.mu.Lock()
        c.accessToken = ""
        c.mu.Unlock()

        return c.Get(endpoint)  // Recursive retry
    }

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
    }

    return body, nil
}

// Usage example
func main() {
    client, err := NewNetSuiteClient(
        "1234567",          // Account ID
        "abc123...",        // Client ID (NOT Application ID!)
        "cert_xyz...",      // Certificate ID from NetSuite
        "/path/to/private_key.pem",
    )
    if err != nil {
        panic(err)
    }

    // Make API call
    result, err := client.Get("/record/v1/customer/123")
    if err != nil {
        panic(err)
    }

    fmt.Println(string(result))
}
```

### Go-Specific Gotchas

#### 1. Private Key Format

**Issue:** NetSuite requires PKCS8 format, Go's `x509` package has specific parsers.

**Solution:**
```go
// For PKCS8
key, err := x509.ParsePKCS8PrivateKey(block.Bytes)

// For PKCS1 (if your key is in this format)
key, err := x509.ParsePKCS1PrivateKey(block.Bytes)

// Then assert to *rsa.PrivateKey
rsaKey, ok := key.(*rsa.PrivateKey)
```

#### 2. PS256 Algorithm Support

**Issue:** Not all JWT libraries support PS256.

**Solution:** Use `github.com/golang-jwt/jwt/v5` which supports PS256:
```go
token := jwt.NewWithClaims(jwt.SigningMethodPS256, claims)
```

#### 3. Time Synchronization in Go

**Issue:** JWT exp/iat claims sensitive to time skew.

**Solution:**
```go
import "time"

// Always use UTC
now := time.Now().UTC()
claims := jwt.MapClaims{
    "exp": now.Add(5 * time.Minute).Unix(),
    "iat": now.Unix(),
}
```

#### 4. Thread-Safe Token Caching

**Issue:** Concurrent requests may cause race conditions.

**Solution:** Use `sync.RWMutex` as shown in example above.

#### 5. Error Handling

**Issue:** NetSuite errors can be in different formats.

**Solution:**
```go
type ErrorResponse struct {
    Error            string `json:"error"`
    ErrorDescription string `json:"error_description"`
    // Some errors have additional fields
    Message string `json:"message"`
    Code    string `json:"code"`
}
```

### Recommended Go Package Structure

```
netsuiteauth/
├── client.go           # Main NetSuite client with token management
├── auth.go             # OAuth 2.0 authentication logic
├── jwt.go              # JWT generation and signing
├── types.go            # Request/response types
├── errors.go           # Custom error types
└── client_test.go      # Unit tests
```

### Testing Strategy for Go Implementation

**Unit Tests:**
```go
func TestJWTGeneration(t *testing.T) {
    // Test JWT structure
    // Test PS256 signing
    // Test header/payload claims
}

func TestTokenCaching(t *testing.T) {
    // Test token reuse
    // Test expiration handling
    // Test concurrent access
}
```

**Integration Tests:**
```go
func TestNetSuiteAPICall(t *testing.T) {
    // Requires real NetSuite credentials
    // Test full OAuth flow
    // Test API request with token
}
```

### Environment Variables for Go

**Configuration:**
```go
import "os"

type Config struct {
    AccountID     string
    ClientID      string
    CertificateID string
    PrivateKeyPath string
}

func LoadConfig() Config {
    return Config{
        AccountID:     os.Getenv("NETSUITE_ACCOUNT_ID"),
        ClientID:      os.Getenv("NETSUITE_CLIENT_ID"),
        CertificateID: os.Getenv("NETSUITE_CERTIFICATE_ID"),
        PrivateKeyPath: os.Getenv("NETSUITE_PRIVATE_KEY_PATH"),
    }
}
```

**.env file:**
```
NETSUITE_ACCOUNT_ID=1234567
NETSUITE_CLIENT_ID=abc123...
NETSUITE_CERTIFICATE_ID=cert_xyz...
NETSUITE_PRIVATE_KEY_PATH=/secrets/netsuite_private_key.pem
```

---

## Conclusion & Best Practices

### Top 10 Troubleshooting Steps (Priority Order)

1. **Verify Client ID (not Application ID) in JWT `iss` parameter** ← Most common mistake
2. **Check JWT signing algorithm is PS256** ← Caused by Oct 2024 deprecation
3. **Verify private key is ≥3072 bits** ← Required since deprecation
4. **Confirm `kid` matches NetSuite Certificate ID** ← Common configuration error
5. **Check Login Audit Trail for detailed error messages** ← Best debugging tool
6. **Validate JWT structure at https://jwt.io** ← Catches signing issues
7. **Verify role permissions (REST Web Services + OAuth 2.0 Access Tokens)** ← Permission vs credential
8. **Check time synchronization (NTP)** ← Causes intermittent failures
9. **Confirm features enabled (REST WEB SERVICES + OAUTH 2.0)** ← Basic setup
10. **Verify integration record state is ENABLED** ← Often overlooked

### Security Best Practices

1. **Never commit private keys to version control**
2. **Store Client ID and secrets in secure vault** (HashiCorp Vault, AWS Secrets Manager)
3. **Use environment variables for configuration**
4. **Rotate certificates before 2-year expiration**
5. **Monitor for unauthorized token generation in Login Audit Trail**
6. **Implement least-privilege role permissions**
7. **Use separate integration records per environment** (prod/sandbox)
8. **Log token generation events (but not tokens themselves!)**

### Performance Best Practices

1. **Cache access tokens** (valid for 60 minutes)
2. **Reuse tokens across requests** (don't generate new token per API call)
3. **Implement token refresh 5 minutes before expiration**
4. **Use connection pooling for HTTP requests**
5. **Handle rate limiting gracefully** (NetSuite has API rate limits)

### Monitoring & Alerting

**Monitor These Metrics:**
- OAuth token generation success rate
- OAuth token generation latency
- API call authentication failures (401/403)
- Certificate expiration date (alert 30 days before)

**Alert On:**
- Sudden increase in authentication failures
- Certificate expiring within 30 days
- server_error responses from token endpoint
- Time sync drift >1 minute

### Documentation Requirements

**For Your Team:**
- Document Client ID, Certificate ID, and where private key is stored
- Create runbook for certificate rotation
- Document OAuth setup process for sandbox refresh
- Maintain list of which integrations use which OAuth flow

### Migration Path from OAuth 1.0 to OAuth 2.0

**If currently using OAuth 1.0 (TBA):**

1. **Assess:** Determine if OAuth 2.0 is better fit (usually yes)
2. **Plan:** Choose flow (Authorization Code vs Client Credentials)
3. **Setup:** Create OAuth 2.0 integration record
4. **Test:** Implement in sandbox first
5. **Migrate:** Switch production traffic gradually
6. **Monitor:** Watch for authentication issues
7. **Cleanup:** Deprecate OAuth 1.0 tokens after successful migration

---

## Additional Resources

### Official NetSuite Documentation
- OAuth 2.0 Setup: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_157769826287.html
- Troubleshooting OAuth: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_157780265265.html
- Login Audit Trail: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158323851171.html

### Community Resources
- NetSuite Professionals Community: https://netsuiteprofessionals.com
- Stack Overflow - NetSuite OAuth Tag: https://stackoverflow.com/questions/tagged/netsuite+oauth

### Tools
- JWT Debugger: https://jwt.io
- OpenSSL Documentation: https://www.openssl.org/docs/
- Postman (OAuth 2.0 Testing): https://www.postman.com

### Libraries

**Go:**
- `github.com/golang-jwt/jwt/v5` - JWT with PS256 support
- `golang.org/x/oauth2` - Standard OAuth2 client

**Node.js:**
- `jsonwebtoken` - JWT generation
- `axios` - HTTP requests

**.NET:**
- `System.IdentityModel.Tokens.Jwt` - JWT handling
- `Microsoft.IdentityModel.Tokens` - Cryptography

**Python:**
- `PyJWT` - JWT library
- `cryptography` - RSA key handling

---

**Document Status:** Complete
**Last Updated:** 2025-10-15
**Next Review:** When NetSuite announces OAuth changes or after troubleshooting sessions
**Maintained By:** Claude Code Research Agent

---

## Document Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-10-15 | Initial comprehensive research document created | Claude Code Research Agent 5 |

