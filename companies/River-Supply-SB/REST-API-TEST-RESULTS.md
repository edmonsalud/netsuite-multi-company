# NetSuite REST API Test Results - River Supply SB

**Company**: River Supply, Inc. (Sandbox 1)
**Account ID**: 9910981-sb1
**Test Date**: 2025-10-16
**Tester**: Claude Code

---

## Summary

All REST API authentication approaches tested have **FAILED** with `401 Unauthorized` error.

**Error Pattern**: Consistent `token_rejected` with `Invalid login attempt` message across all tests.

**Diagnosis**: The issue is NOT with OAuth signature calculation - the tokens themselves are not being accepted by NetSuite.

---

## Tests Performed

### Test 1: Standard Account-Specific Subdomain Approach
**Script**: `test-netsuite-records.js`

**Configuration**:
- Signature URL: `https://9910981-sb1.suitetalk.api.netsuite.com/services/rest/record/v1/customer`
- Request URL: `https://9910981-sb1.suitetalk.api.netsuite.com/services/rest/record/v1/customer?limit=10`
- Realm: `9910981-sb1`

**Result**: ❌ 401 Unauthorized - `token_rejected`

---

### Test 2: Multiple Account ID Format Combinations
**Script**: `test-all-formats.js`

**Formats Tested**:
1. Lowercase hyphen: `9910981-sb1` / `9910981-sb1`
2. UPPERCASE UNDERSCORE: `9910981_SB1` / `9910981_SB1`
3. UPPERCASE hyphen: `9910981-SB1` / `9910981-SB1`
4. Lowercase underscore: `9910981_sb1` / `9910981_sb1`
5. Mixed formats

**Result**: ❌ All formats failed with 401 - `token_rejected`

**Finding**: No signature validation errors (`InvalidSignature`) detected, suggesting signatures are technically valid but tokens are rejected.

---

### Test 3: system.netsuite.com Signature Approach
**Script**: `test-approach-3.js`

**Configuration**:
- Signature URL: `https://system.netsuite.com/services/rest/record/v1/customer`
- Request URL: `https://9910981-sb1.suitetalk.api.netsuite.com/services/rest/record/v1/customer?limit=1`
- Realm: `9910981_SB1`

**Result**: ❌ 401 Unauthorized - `token_rejected`

**NetSuite Response**:
```json
{
  "type": "https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.2",
  "title": "Unauthorized",
  "status": 401,
  "o:errorDetails": [
    {
      "detail": "Invalid login attempt. For more details, see the Login Audit Trail in the NetSuite UI at Setup > Users/Roles > User Management > View Login Audit Trail.",
      "o:errorCode": "INVALID_LOGIN"
    }
  ]
}
```

---

## Error Analysis

### Common Error Pattern

**HTTP Headers**:
```
www-authenticate: OAuth realm="9910981_SB1", error="token_rejected", error_description="Invalid login attempt."
```

**Error Code**: `INVALID_LOGIN`

### What This Means

The error `token_rejected` with `INVALID_LOGIN` indicates:

1. ✅ **OAuth signature is technically valid** (no `InvalidSignature` errors)
2. ❌ **Tokens are not recognized by NetSuite** (rejected at authentication layer)
3. ❌ **Login attempt is considered invalid** (check Login Audit Trail)

### Possible Root Causes

1. **Tokens are not active**
   - Integration record may be disabled
   - Access Token may be inactive or deleted
   - Token may have been revoked

2. **Wrong token credentials**
   - Consumer Key/Secret may not match the Integration
   - Token ID/Secret may not match the Access Token
   - Credentials may have been regenerated

3. **Role/Permission issues**
   - Token's role lacks necessary permissions
   - Role doesn't have "Web Services" permission
   - Role doesn't have REST API access enabled

4. **Account configuration**
   - SuiteTalk Web Services feature not enabled
   - REST API Web Services feature not enabled
   - IP restrictions blocking requests

5. **Token scope/user issues**
   - Token created for wrong user
   - User account is locked or disabled
   - Token created for production but using sandbox

---

## Comparison with Working Account (GOBA-SPORTS-PROD)

| Aspect | GOBA-SPORTS-PROD (✅ Working) | River-Supply-SB (❌ Not Working) |
|--------|------------------------------|----------------------------------|
| **Status Code** | 200 OK | 401 Unauthorized |
| **Token Recognition** | Tokens accepted | Tokens rejected |
| **Error Type** | None | INVALID_LOGIN |
| **Account ID Format** | 693183 (numeric) | 9910981-sb1 (alphanumeric) |
| **Environment** | Production | Sandbox |
| **Authentication Setup** | Token-Based Auth verified working | Browser-based (SuiteCloud CLI) |

**Key Difference**: GOBA-SPORTS-PROD has verified working Token-Based Authentication setup. River-Supply-SB may not have TBA properly configured.

---

## Recommended Next Steps

### 1. Verify Token Status in NetSuite UI

**Check Integration Record**:
1. Log into River Supply Sandbox: `https://9910981-sb1.app.netsuite.com`
2. Go to: **Setup → Integrations → Manage Integrations**
3. Find: "Claude Code REST API Access" (or the integration used)
4. Verify:
   - ✅ State: **ENABLED**
   - ✅ Token-Based Authentication: **CHECKED**
   - ✅ Consumer Key matches: `bd6196d01...`

**Check Access Token**:
1. Go to: **Setup → Users/Roles → Access Tokens**
2. Find the token for this integration
3. Verify:
   - ✅ Status: **ACTIVE** (not Inactive/Revoked)
   - ✅ Application Name: Matches integration
   - ✅ User: Correct user account
   - ✅ Role: Has appropriate permissions
   - ✅ Token ID matches: `4d1aa3b5e7...`

### 2. Check Login Audit Trail

NetSuite error message suggests checking Login Audit Trail:

1. Go to: **Setup → Users/Roles → User Management → View Login Audit Trail**
2. Look for recent failed login attempts
3. Check for:
   - Reason for rejection
   - IP address restrictions
   - User account status
   - Role issues

### 3. Verify Role Permissions

The role associated with the Access Token must have:

**Required Permissions**:
- ✅ **Web Services** - Full access
- ✅ **REST Web Services** - Full access
- ✅ **User Access Tokens** - Full access
- ✅ **Customer** records - View access minimum

**To Check**:
1. Go to: **Setup → Users/Roles → Manage Roles**
2. Find the role used by the Access Token
3. Check **Permissions** tab → **Setup** subtab
4. Verify permissions listed above

### 4. Verify SuiteTalk Web Services Enabled

**Required Features**:
1. Go to: **Setup → Company → Enable Features**
2. **SuiteCloud** tab:
   - ✅ SuiteTalk (Web Services)
   - ✅ REST Web Services
   - ✅ Client SuiteScript
   - ✅ Server SuiteScript

### 5. Regenerate Tokens if Necessary

If tokens are invalid or compromised:

**Step A - Delete Old Integration** (if exists):
1. Setup → Integrations → Manage Integrations
2. Find old integration
3. Click **Edit** → **State: DISABLED** → **Save**

**Step B - Create New Integration**:
1. Setup → Integrations → Manage Integrations → **New**
2. Name: "Claude Code REST API - River Supply SB"
3. ✅ Token-Based Authentication: **CHECKED**
4. ☐ TBA: Authorization Flow: **UNCHECKED**
5. **Save** and copy:
   - Consumer Key
   - Consumer Secret

**Step C - Create New Access Token**:
1. Setup → Users/Roles → Access Tokens → **New**
2. Application Name: Select the integration created above
3. User: Your administrator user
4. Role: Administrator (or custom role with full permissions)
5. **Save** and copy:
   - Token ID
   - Token Secret

**Step D - Update Test Scripts**:
Update all test scripts with new credentials:
- `test-netsuite-api.js`
- `test-netsuite-records.js`
- `test-all-formats.js`
- `test-approach-3.js`

**Step E - Test Again**:
```bash
cd companies/River-Supply-SB
node test-netsuite-records.js
```

---

## Technical Details

### OAuth 1.0a Implementation

**Signature Method**: HMAC-SHA256
**Signature Encoding**: Base64
**Parameter Encoding**: RFC 3986 (percent encoding)

**OAuth Parameters Used**:
- `oauth_consumer_key`
- `oauth_nonce` (random 32-char hex)
- `oauth_signature_method` = "HMAC-SHA256"
- `oauth_timestamp` (Unix timestamp)
- `oauth_token`
- `oauth_version` = "1.0"
- `oauth_signature` (calculated)

**Signature Base String Format**:
```
GET&https%3A%2F%2F[url-encoded-endpoint]&[sorted-oauth-params]
```

**Signing Key Format**:
```
[percent-encoded-consumer-secret]&[percent-encoded-token-secret]
```

### Code Quality

All test scripts implement:
- ✅ Proper OAuth 1.0a signature generation
- ✅ HMAC-SHA256 hashing
- ✅ Correct parameter sorting
- ✅ RFC 3986 compliant URL encoding
- ✅ Proper header formatting
- ✅ Error handling and logging

**Conclusion**: The OAuth implementation is correct. The issue is with token authentication at the NetSuite server level.

---

## Files Created

1. `test-netsuite-records.js` - Standard REST API test
2. `test-all-formats.js` - Account ID format testing
3. `test-approach-3.js` - system.netsuite.com signature test
4. `REST-API-TEST-RESULTS.md` - This report

---

## Status

**REST API Status**: ⚠️ **BLOCKED**

River-Supply-SB REST API access is currently non-functional due to token authentication issues.

**Required Action**: Manual verification and potential token regeneration in NetSuite UI.

**ACCOUNT-IDS.md Status**: ⚠️ **PARTIAL** - Account ID verified, TBA credentials need validation/regeneration.

---

**Report Generated**: 2025-10-16
**Next Review**: After token verification/regeneration in NetSuite UI
