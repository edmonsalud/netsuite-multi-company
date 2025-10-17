# SuiteScript Credential Migration Guide

> **Purpose**: Guide for safely migrating from hardcoded credentials to NetSuite Script Parameters

**Created**: 2025-10-17
**Status**: Migration Pending
**Priority**: Medium (implement when convenient, not urgent)

---

## 🎯 Overview

Four production SuiteScripts currently use **hardcoded API credentials**. These scripts work perfectly in production, but credentials are excluded from Git for security.

**Current State**:
- ✅ Scripts work in production with hardcoded credentials
- ✅ Local files have credentials (deployment-ready)
- ✅ Git has sanitized versions (Script Parameters)
- ✅ Files are .gitignore protected

**Future Goal**: Migrate to NetSuite Script Parameters for better security and credential management.

---

## 📋 Affected Scripts

### GOBA-SPORTS-PROD

**1. shopify-orders-scheduled.js**
[Path](companies/GOBA-SPORTS-PROD/src/FileCabinet/SuiteScripts/shopify-orders-scheduled.js)

- **Function**: Exports Shopify orders to CSV (last 7 days)
- **Credential**: Shopify Admin API Token
- **Current**: `adminApiToken: 'shpat_8bded...'` (line 12)
- **Required Parameter**: `custscript_shopify_admin_api_token`

**2. shopify-orders-suitelet.js**
[Path](companies/GOBA-SPORTS-PROD/src/FileCabinet/SuiteScripts/shopify-orders-suitelet.js)

- **Function**: Shopify order management Suitelet
- **Credential**: Shopify Admin API Token
- **Current**: `adminApiToken: 'shpat_8bded...'` (line 12)
- **Required Parameter**: `custscript_shopify_admin_api_token`

### IQ-Powertools

**3. invoice_email_plug_in.js**
[Path](companies/IQ-Powertools/src/FileCabinet/SuiteScripts/invoice_email_plug_in.js)

- **Function**: AI-powered invoice email extraction
- **Credentials**:
  - OpenAI API Key
  - ConvertAPI Secret
- **Current**: Hardcoded defaults (lines 198, 200)
- **Required Parameters**:
  - `custscript_ue_openai_api_key`
  - `custscript_ue_convert_api_secret`

**4. invoice_email_plug_in_improved.js**
[Path](companies/IQ-Powertools/src/FileCabinet/SuiteScripts/invoice_email_plug_in_improved.js)

- **Function**: Enhanced version of invoice extraction
- **Credentials**:
  - OpenAI API Key
  - ConvertAPI Secret
- **Current**: Hardcoded defaults (lines 78, 80)
- **Required Parameters**:
  - `custscript_ue_openai_api_key`
  - `custscript_ue_convert_api_secret`

---

## ⚠️ Important: Current Setup

### Local Files (Your Computer)
- **Location**: `companies/[COMPANY]/src/FileCabinet/SuiteScripts/`
- **Status**: Have hardcoded credentials, fully functional
- **Git**: Excluded via .gitignore
- **Deployment**: ✅ Safe to deploy to NetSuite as-is

### Git Repository (GitHub)
- **Location**: Same paths
- **Status**: Script Parameter versions (no hardcoded credentials)
- **Purpose**: Template/reference only
- **Deployment**: ❌ Would break production if deployed

### Multi-Computer Scenario
When cloning on another computer, you'll get the Script Parameter versions from Git. You have two options:

**Option A: Keep using hardcoded credentials (easier)**
1. Add credentials back to the files manually
2. Files are already .gitignore protected
3. Continue working as normal

**Option B: Implement Script Parameters (recommended long-term)**
1. Follow the migration steps below
2. Configure Script Parameters in NetSuite
3. Use Script Parameter versions

---

## 🚀 Migration Steps (When Ready)

### Phase 1: Prepare NetSuite Script Parameters

**For GOBA-SPORTS-PROD scripts:**

1. **Navigate to Script Deployment** in NetSuite:
   - Customization → Scripting → Scripts
   - Find: "Shopify Orders Scheduled Script"
   - Click on deployment

2. **Add Script Parameter**:
   - Parameters tab → Add Parameter
   - ID: `custscript_shopify_admin_api_token`
   - Type: Password
   - Name: "Shopify Admin API Token"
   - Help: "Admin API token for Shopify integration"

3. **Set the value**:
   - Value: `[YOUR_SHOPIFY_TOKEN]` (use the actual token from the local file)
   - Save

4. **Repeat for Suitelet deployment**

**For IQ-Powertools scripts:**

1. **Navigate to Script Deployment**:
   - Find: "Invoice Email Plug-in" User Event Script
   - Click on deployment

2. **Add Script Parameters**:

   **Parameter 1:**
   - ID: `custscript_ue_openai_api_key`
   - Type: Password
   - Name: "OpenAI API Key"
   - Value: `[YOUR_OPENAI_API_KEY]` (use the actual key from the local file)

   **Parameter 2:**
   - ID: `custscript_ue_convert_api_secret`
   - Type: Password
   - Name: "ConvertAPI Secret"
   - Value: `[YOUR_CONVERTAPI_SECRET]` (use the actual secret from the local file)

3. **Repeat for improved version deployment**

### Phase 2: Deploy Script Parameter Versions

1. **Get Script Parameter versions from Git**:
   ```bash
   # In your project root
   git show origin/main:companies/GOBA-SPORTS-PROD/src/FileCabinet/SuiteScripts/shopify-orders-scheduled.js > temp-shopify-scheduled.js
   git show origin/main:companies/GOBA-SPORTS-PROD/src/FileCabinet/SuiteScripts/shopify-orders-suitelet.js > temp-shopify-suitelet.js
   git show origin/main:companies/IQ-Powertools/src/FileCabinet/SuiteScripts/invoice_email_plug_in.js > temp-invoice-plugin.js
   git show origin/main:companies/IQ-Powertools/src/FileCabinet/SuiteScripts/invoice_email_plug_in_improved.js > temp-invoice-improved.js
   ```

2. **Test in Sandbox First**:
   - Upload Script Parameter versions to sandbox
   - Configure Script Parameters
   - Test thoroughly
   - Verify all API calls work

3. **Deploy to Production**:
   ```bash
   # Replace local files with Script Parameter versions
   cp temp-shopify-scheduled.js companies/GOBA-SPORTS-PROD/src/FileCabinet/SuiteScripts/shopify-orders-scheduled.js
   cp temp-shopify-suitelet.js companies/GOBA-SPORTS-PROD/src/FileCabinet/SuiteScripts/shopify-orders-suitelet.js
   cp temp-invoice-plugin.js companies/IQ-Powertools/src/FileCabinet/SuiteScripts/invoice_email_plug_in.js
   cp temp-invoice-improved.js companies/IQ-Powertools/src/FileCabinet/SuiteScripts/invoice_email_plug_in_improved.js

   # Deploy via SuiteCloud CLI
   cd companies/GOBA-SPORTS-PROD
   npx suitecloud project:deploy

   cd ../IQ-Powertools
   npx suitecloud project:deploy
   ```

4. **Verify Production**:
   - Run scripts manually
   - Check logs for errors
   - Monitor scheduled executions

### Phase 3: Update Local Workspace

1. **Remove .gitignore exceptions**:
   - Edit `.gitignore`
   - Remove lines 84-89 (the Script Parameter files)

2. **Allow tracking of Script Parameter versions**:
   ```bash
   git add companies/GOBA-SPORTS-PROD/src/FileCabinet/SuiteScripts/shopify-orders-scheduled.js
   git add companies/GOBA-SPORTS-PROD/src/FileCabinet/SuiteScripts/shopify-orders-suitelet.js
   git add companies/IQ-Powertools/src/FileCabinet/SuiteScripts/invoice_email_plug_in.js
   git add companies/IQ-Powertools/src/FileCabinet/SuiteScripts/invoice_email_plug_in_improved.js

   git commit -m "feat: Migrate to Script Parameters for credential management

   - Shopify scripts now use custscript_shopify_admin_api_token
   - Invoice scripts use custscript_ue_openai_api_key and custscript_ue_convert_api_secret
   - All credentials configured as Script Parameters in NetSuite
   - No hardcoded secrets in code

   Tested in sandbox and production. All integrations working.

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"

   git push origin main
   ```

---

## 🔒 Security Benefits of Migration

**Before (Hardcoded)**:
- ❌ Credentials in source code
- ❌ Difficult to rotate credentials
- ❌ Visible in NetSuite File Cabinet
- ❌ Must be excluded from Git

**After (Script Parameters)**:
- ✅ Credentials stored securely in NetSuite
- ✅ Easy credential rotation (update parameter only)
- ✅ Not visible in File Cabinet
- ✅ Source code can be safely committed

---

## ⏰ Migration Timeline

**Recommended Approach**: No rush!

This migration is **optional** and can be done when convenient:

- **Continue as-is**: Perfectly fine. Scripts work great with hardcoded credentials.
- **Migrate later**: When rotating credentials or during maintenance window.
- **Migrate soon**: If adding new computers or team members frequently.

**Suggested Timeline**:
- Review: 1-2 months
- Plan: During quarterly maintenance
- Execute: During low-usage period

---

## 📞 Support

### Testing Before Migration

```bash
# Test Script Parameter retrieval in NetSuite:
// In NetSuite Console/Debugger:
require(['N/runtime'], function(runtime) {
    const script = runtime.getCurrentScript();
    const token = script.getParameter('custscript_shopify_admin_api_token');
    console.log('Token retrieved:', token ? 'Success' : 'Failed');
});
```

### Rollback Plan

If migration causes issues:

1. **Immediate rollback**:
   ```bash
   # Restore hardcoded versions from Git history
   git checkout 13f344f -- companies/GOBA-SPORTS-PROD/src/FileCabinet/SuiteScripts/shopify-orders-scheduled.js
   # (repeat for other files)

   # Deploy old versions
   npx suitecloud project:deploy
   ```

2. **Remove Script Parameters** (optional):
   - Navigate to script deployments
   - Remove custom parameters
   - Save

---

## ✅ Migration Checklist

### Pre-Migration
- [ ] Review all affected scripts
- [ ] Document current credential values securely
- [ ] Test Script Parameter creation in sandbox
- [ ] Schedule migration during low-usage period

### Migration Day
- [ ] Create Script Parameters in NetSuite
- [ ] Set parameter values (copy from hardcoded)
- [ ] Deploy Script Parameter versions to sandbox
- [ ] Test all integrations in sandbox
- [ ] Deploy to production
- [ ] Monitor for 24 hours

### Post-Migration
- [ ] Verify all scheduled scripts running
- [ ] Check integration logs for errors
- [ ] Update documentation
- [ ] Commit Script Parameter versions to Git
- [ ] Remove .gitignore exceptions

---

## 📖 Reference

**NetSuite Documentation**:
- [Script Parameters Guide](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4618456305.html)
- [Password-Type Parameters](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4618449823.html)

**Project Documentation**:
- [MULTI-COMPUTER-SETUP.md](./MULTI-COMPUTER-SETUP.md) - Multi-computer workspace guide
- [.gitignore](./.gitignore) - Lines 84-89 protect these scripts

---

**Last Updated**: 2025-10-17
**Next Review**: When convenient (no deadline)
**Status**: Current setup working well, migration optional
