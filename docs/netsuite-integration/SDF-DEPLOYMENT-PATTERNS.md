# SDF Deployment Patterns & Troubleshooting

**Date Created**: 2025-10-17
**Last Updated**: 2025-10-17
**Status**: Active
**Production Validated**: Yes (Pier Assets Management - Account 7759280)

---

## Purpose

This guide documents critical patterns and common pitfalls when deploying NetSuite SuiteCloud Development Framework (SDF) projects. All patterns are based on real production deployments and troubleshooting sessions.

**Use this guide when:**
- Setting up new SDF projects
- Deploying scripts to NetSuite
- Encountering deployment errors
- Multi-account SDF configuration

---

## Table of Contents

1. [Critical: Wrong Account Deployment](#critical-wrong-account-deployment)
2. [Missing Feature Dependencies](#missing-feature-dependencies)
3. [SDF XML Configuration Issues](#sdf-xml-configuration-issues)
4. [Deployment Verification Checklist](#deployment-verification-checklist)
5. [Account Authentication Management](#account-authentication-management)

---

## Critical: Wrong Account Deployment

### Problem: Deploying to Wrong NetSuite Account

**Symptom:**
```bash
npx suitecloud project:deploy

# Output shows:
Deploying to 693183 - GOBA Sports Production
# But you wanted to deploy to 7759280 - Pier Asset Management LLC
```

**Root Cause:**

The `project.json` file contains a `defaultAuthId` field that determines which NetSuite account receives the deployment. If this field references the wrong account ID, ALL deployments go to the wrong account.

**Real Example from Pier Assets Management:**

```json
// ❌ WRONG - This deployed to GOBA Sports instead of Pier Assets
{
    "defaultAuthId": "GOBA-Sports-prod"
}

// ✅ CORRECT - This deploys to Pier Asset Management
{
    "defaultAuthId": "7759280"
}
```

### Solution

**Step 1: Check current defaultAuthId**
```bash
cd companies/[COMPANY-NAME]
cat project.json
```

**Step 2: Verify correct Account ID**

1. Check `ACCOUNT-IDS.md` in project root for verified Account ID
2. OR log into target NetSuite account:
   - Setup → Company → Company Information
   - Copy Account ID

**Step 3: Update project.json**
```json
{
    "defaultAuthId": "7759280"  // Use actual Account ID, not alias
}
```

**Step 4: Verify before deploying**
```bash
# Validate first (shows which account will receive deployment)
npx suitecloud project:validate

# Check output carefully before proceeding
npx suitecloud project:deploy
```

### Prevention Checklist

Before ANY deployment:

- [ ] Run `node verify-account-ids.js` from project root (if available)
- [ ] Check `project.json` defaultAuthId matches target account
- [ ] Verify deployment target in validation output
- [ ] Compare Account ID against NetSuite UI (Setup → Company → Company Information)
- [ ] Document verified Account ID in `ACCOUNT-IDS.md`

### Time Saved

Following this checklist prevents:
- ❌ 1-2 hours debugging "why isn't my script deployed"
- ❌ Potential production issues if wrong account modified
- ❌ Having to rollback deployments from wrong accounts

---

## Missing Feature Dependencies

### Problem: Script Deployment Fails with Validation Error

**Symptom:**
```bash
npx suitecloud project:deploy

# Error during validation:
ERROR -- Custom object validation failed
Details: Script deployment requires SERVERSIDESCRIPTING feature
File: ~/Objects/customscript_xxx.xml
```

**Root Cause:**

The `manifest.xml` file declares project dependencies. If you're deploying SuiteScripts but haven't declared the SERVERSIDESCRIPTING feature, validation fails.

**Real Example from Pier Assets Management:**

Initial `manifest.xml` (missing dependency):
```xml
❌ WRONG - Missing feature declaration
<manifest projecttype="ACCOUNTCUSTOMIZATION">
  <projectname>Pier-Assets-Management</projectname>
  <frameworkversion>1.0</frameworkversion>
  <dependencies>
    <!-- SERVERSIDESCRIPTING feature missing! -->
  </dependencies>
</manifest>
```

Fixed `manifest.xml`:
```xml
✅ CORRECT - Feature declared
<manifest projecttype="ACCOUNTCUSTOMIZATION">
  <projectname>Pier-Assets-Management</projectname>
  <frameworkversion>1.0</frameworkversion>
  <dependencies>
    <features>
      <feature required="true">SERVERSIDESCRIPTING</feature>
    </features>
  </dependencies>
</manifest>
```

### Solution

**For SuiteScript Projects:**

Always include this in `src/manifest.xml`:
```xml
<dependencies>
  <features>
    <feature required="true">SERVERSIDESCRIPTING</feature>
  </features>
</dependencies>
```

**Common Features You May Need:**

| Feature | When to Include |
|---------|----------------|
| `SERVERSIDESCRIPTING` | **ALWAYS** for any SuiteScript project |
| `ADVANCEDPDFHTML` | When using PDF templates |
| `CUSTOMRECORDS` | When creating custom record types |
| `WORKFLOW` | When deploying workflow definitions |
| `SUBSIDIARIES` | When working with multi-subsidiary transactions |
| `MULTICURRENCY` | When handling multiple currencies |

### Prevention

**Template for New SDF Projects:**

```xml
<manifest projecttype="ACCOUNTCUSTOMIZATION">
  <projectname>YOUR-PROJECT-NAME</projectname>
  <frameworkversion>1.0</frameworkversion>
  <dependencies>
    <features>
      <!-- Required for all SuiteScript projects -->
      <feature required="true">SERVERSIDESCRIPTING</feature>

      <!-- Add others as needed -->
      <!-- <feature required="true">CUSTOMRECORDS</feature> -->
      <!-- <feature required="true">WORKFLOW</feature> -->
    </features>
  </dependencies>
</manifest>
```

---

## SDF XML Configuration Issues

### Problem: Invalid XML Structure for Script Objects

**Symptom:**
```bash
ERROR -- XML validation failed
Details: Unsupported field in scriptdeployment: buffertime
File: ~/Objects/customscript_xxx.xml
```

**Root Cause:**

SDF XML schemas are strict. Some fields available in the NetSuite UI are NOT supported in SDF XML files. If you include them, validation fails.

### Solution: Simplified Script Deployment XML

**Minimal Working Template:**

```xml
<usereventscript scriptid="customscript_your_script_id">
  <name>Your Script Name</name>
  <scriptfile>[/SuiteScripts/your_script.js]</scriptfile>

  <scriptdeployments>
    <scriptdeployment scriptid="customdeploy_your_deployment_id">
      <allroles>T</allroles>
      <isdeployed>T</isdeployed>
      <loglevel>DEBUG</loglevel>
      <recordtype>VENDORBILL</recordtype>
      <status>TESTING</status>
    </scriptdeployment>
  </scriptdeployments>
</usereventscript>
```

**Supported Fields (Safe to Include):**

- `<name>` - Script/deployment name
- `<scriptfile>` - Path to .js file
- `<allroles>` - T/F for all roles access
- `<isdeployed>` - T/F for deployed status
- `<loglevel>` - DEBUG, AUDIT, ERROR, EMERGENCY
- `<recordtype>` - VENDORBILL, SALESORDER, CUSTOMER, etc.
- `<status>` - TESTING, RELEASED, NOTRUNNING

**Unsupported Fields (Remove from XML):**

- ❌ `<buffertime>` - Set via UI after deployment
- ❌ `<eventtypes>` - Set via UI after deployment
- ❌ `<executioncontext>` - Set via UI after deployment
- ❌ Complex audience configurations - Use `<allroles>T</allroles>` initially

### Prevention

1. **Start with minimal XML** (only essential fields)
2. **Deploy via SDF first**
3. **Configure advanced settings in NetSuite UI** after deployment
4. **Do NOT re-import** the object after UI configuration (or you'll lose UI changes)

---

## Deployment Verification Checklist

Use this checklist before EVERY SDF deployment:

### Pre-Deployment Checks

- [ ] **Account ID Verified**
  - `project.json` defaultAuthId is correct
  - Matches target account in `ACCOUNT-IDS.md`
  - Verified against NetSuite UI (Setup → Company → Company Information)

- [ ] **Manifest Valid**
  - `manifest.xml` includes required features
  - SERVERSIDESCRIPTING feature present (if deploying scripts)
  - Project name matches folder name

- [ ] **Files Ready**
  - Script files exist in `src/FileCabinet/SuiteScripts/`
  - Object XML files exist in `src/Objects/`
  - No syntax errors in JavaScript files

- [ ] **Authentication Working**
  - Can run `suitecloud account:list` successfully
  - Target account appears in list
  - Token-based auth configured (if applicable)

### Deployment Steps

```bash
# Step 1: Navigate to project folder
cd companies/[COMPANY-NAME]

# Step 2: Validate project (catches issues before deployment)
npx suitecloud project:validate

# Step 3: Review validation output carefully
# Look for:
# - ✅ "Deploying to [ACCOUNT-ID] - [ACCOUNT-NAME]"
# - ✅ "Validation of [...] -- Success"
# - ⚠️  Warnings (review, but usually safe)
# - ❌ Errors (MUST fix before deploying)

# Step 4: Deploy only if validation succeeds
npx suitecloud project:deploy

# Step 5: Verify deployment success
# Look for:
# - "Installation COMPLETE"
# - List of uploaded files
# - List of updated objects
```

### Post-Deployment Verification

- [ ] **Check NetSuite UI**
  - Navigate to Customization → Scripting → Scripts
  - Find your script record
  - Verify deployment exists and status = TESTING or RELEASED

- [ ] **Check Script Execution Log**
  - Setup → Scripting → Script Execution Log
  - Filter by your deployment ID
  - Look for any errors during first execution

- [ ] **Test Functionality**
  - Create test record to trigger script
  - Verify expected behavior
  - Check execution log for errors

- [ ] **Commit Changes**
  ```bash
  git add .
  git commit -m "feat([COMPANY]): Deploy [script name]

  - Deployed to Account [ID]
  - Status: TESTING
  - Script ID: customscript_xxx

  🤖 Generated with Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>"
  git push origin main
  ```

---

## Account Authentication Management

### Multi-Account SDF Setup

When managing multiple NetSuite accounts (common in multi-company environments), authentication can be tricky.

### Project Structure

```
Netsuite/
├── companies/
│   ├── Company-A/
│   │   ├── project.json          # defaultAuthId: "12345"
│   │   └── .suitecloud.json      # Hidden auth data
│   ├── Company-B/
│   │   ├── project.json          # defaultAuthId: "67890"
│   │   └── .suitecloud.json      # Hidden auth data
```

### Authentication Workflow

**Initial Setup for New Company:**

```bash
# 1. Navigate to company folder
cd companies/[COMPANY-NAME]

# 2. Authenticate with NetSuite
npx suitecloud account:setup

# 3. Follow prompts:
#    - Account ID: [verified Account ID]
#    - Auth method: Token-Based Authentication (recommended)
#    - Role: Administrator (or Developer)

# 4. Verify authentication worked
npx suitecloud account:list

# Expected output:
# Account ID: 7759280
# Account Name: Pier Asset Management LLC
# Role: Administrator

# 5. Update project.json with Account ID
echo '{"defaultAuthId": "7759280"}' > project.json
```

**Switching Between Accounts:**

```bash
# List all authenticated accounts
npx suitecloud account:list

# Authentication is stored PER PROJECT FOLDER
# Just cd to the correct folder
cd companies/Company-A    # Uses Company-A credentials
cd companies/Company-B    # Uses Company-B credentials
```

### Common Authentication Issues

#### Issue: "Account not found"

**Cause:** `defaultAuthId` in `project.json` doesn't match any authenticated account

**Solution:**
```bash
# List authenticated accounts
npx suitecloud account:list

# Copy exact Account ID from output
# Update project.json with that ID
```

#### Issue: "Token expired"

**Cause:** Token-Based Authentication tokens can expire

**Solution:**
```bash
# Re-authenticate
npx suitecloud account:setup

# Choose "Use existing account" if prompted
# Generate new token pair in NetSuite if needed
```

---

## Quick Reference: Common Deployment Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Invalid account ID" | Wrong `defaultAuthId` in project.json | Verify Account ID, update project.json |
| "Feature not enabled" | Missing feature in manifest.xml | Add `<feature>SERVERSIDESCRIPTING</feature>` |
| "XML validation failed" | Unsupported fields in object XML | Use minimal XML template, configure via UI |
| "File not found" | Script file path incorrect | Check `<scriptfile>` path matches actual location |
| "Permission denied" | Insufficient role permissions | Use Administrator or Developer role |
| "Account not found" | Not authenticated for this account | Run `npx suitecloud account:setup` |

---

## Production Validation

These patterns were validated during the deployment of the **Vendor Bill Intercompany Automation** script to **Pier Asset Management LLC (Account 7759280)** on 2025-10-17.

**Challenges Resolved:**
1. ✅ Wrong account deployment (project.json defaultAuthId)
2. ✅ Missing SERVERSIDESCRIPTING feature
3. ✅ Invalid XML structure (unsupported fields)
4. ✅ Account verification workflow

**Time Saved**: ~2-3 hours per deployment by following these patterns

---

## Related Guides

- [NetSuite REST API Guide](NETSUITE-REST-API-GUIDE.md) - REST API patterns
- [Account ID Verification](../../ACCOUNT-IDS.md) - Account ID registry
- [SuiteScript Development Patterns](SUITESCRIPT-DEVELOPMENT-PATTERNS.md) - Script development patterns

---

**Last Updated**: 2025-10-17
**Production Validated**: Yes
**Companies Using This**: Pier Assets Management
**Status**: Active
