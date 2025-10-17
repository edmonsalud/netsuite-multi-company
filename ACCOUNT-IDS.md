# NetSuite Account IDs - Master Registry

**Purpose**: Single source of truth for all NetSuite Account IDs to prevent authentication errors.

**Critical**: ALWAYS verify Account ID from NetSuite UI before using in any configuration.

---

## How to Find Your Account ID

### Method 1: NetSuite UI (Most Reliable)
1. Log into NetSuite
2. Go to **Setup → Company → Company Information**
3. Look for **Account ID** field
4. OR check the URL: `https://ACCOUNTID.app.netsuite.com/...`

### Method 2: From Deployment Output
When you run `npx suitecloud project:deploy`, the output shows:
```
Deploying to [ACCOUNTID] - [Company Name] - [Role].
```

### Method 3: From SuiteCloud Account Setup
```bash
cd companies/[COMPANY-NAME]
npx suitecloud account:setup --list
```

---

## Verified Account IDs

| Company Folder | Account ID | Verified Date | REST API Setup | Status |
|----------------|------------|---------------|----------------|--------|
| **GOBA-SPORTS-PROD** | **693183** | 2025-10-15 | ✅ **READY** | Token-Based Auth configured with test scripts |
| **River-Supply-SB** | **9910981-sb1** | 2025-10-16 | ✅ **READY** | Token-Based Auth configured, SuiteQL endpoint working |
| HMP-Global | *[NEEDS VERIFICATION]* | - | ❌ Not configured | Need Account ID + TBA setup |
| ABA-CON | *[NEEDS VERIFICATION]* | - | ❌ Not configured | Need Account ID + TBA setup |
| HBNO | *[NEEDS VERIFICATION]* | - | ❌ Not configured | Need Account ID + TBA setup |

### REST API Setup Legend

- ✅ **READY** - Token-Based Authentication configured, test scripts available, queries can be executed
- ⚠️ **PARTIAL** - Account ID verified but TBA credentials not configured
- ❌ **Not configured** - Account ID and/or REST API authentication not set up yet

---

## ❌ Known INCORRECT Account IDs

| Wrong ID | Actual ID | Company | Source of Error |
|----------|-----------|---------|-----------------|
| **7759280** | **693183** | GOBA-SPORTS-PROD | Previous research/different account |

---

## Verification Checklist

Before using ANY Account ID in configuration:

- [ ] Logged into NetSuite UI for that specific account
- [ ] Checked Setup → Company → Company Information
- [ ] Confirmed Account ID matches what's in the URL
- [ ] Tested authentication with that Account ID
- [ ] Documented the verified ID in this file

---

## Configuration Files That Use Account IDs

### Per-Company Locations:
1. `companies/[COMPANY]/.mcp.json` - MCP server configuration
2. `companies/[COMPANY]/test-netsuite-api.js` - REST API test script
3. `companies/[COMPANY]/test-netsuite-records.js` - Records API test script
4. `companies/[COMPANY]/mcp-server/index.js` - Custom MCP server (uses env var)

### Global Location:
1. `.mcp.json` (root) - If using global MCP config

---

## Emergency: Wrong Account ID Used

If authentication fails with a company:

1. **STOP** - Don't waste hours troubleshooting OAuth/certificates
2. **VERIFY** the Account ID first:
   ```bash
   # Log into NetSuite UI for that company
   # Check: Setup → Company → Company Information
   # Look for: Account ID field
   ```
3. **UPDATE** all configuration files with correct ID
4. **TEST** authentication immediately
5. **DOCUMENT** the correct ID in this file

---

## Next Steps

**TODO**: Verify Account IDs for remaining companies:
- [ ] HMP-Global
- [ ] ABA-CON
- [ ] HBNO
- [x] River-Supply-SB (Verified: 9910981-sb1)

**How to verify**: For each company:
1. Log into that company's NetSuite instance
2. Go to Setup → Company → Company Information
3. Copy the Account ID
4. Update this file
5. Update any config files for that company

---

**Last Updated**: 2025-10-16
**Maintained By**: Claude Code + Eduardo Monsalud

---

## River-Supply-SB Notes (2025-10-16)

**OAuth Configuration:**
- Account ID format: `9910981-sb1` (lowercase with hyphen)
- Realm format: `9910981_SB1` (UPPERCASE with underscore)
- Working endpoint: SuiteQL (`/services/rest/query/v1/suiteql`)
- Record API endpoint requires additional role permissions

**Key Learnings:**
- 10 parallel agent tests identified that OAuth signature was correct
- "InvalidSignature" errors in Login Audit Trail were from old credentials
- New credentials work perfectly with SuiteQL endpoint
- Role permissions determine which REST API endpoints are accessible
