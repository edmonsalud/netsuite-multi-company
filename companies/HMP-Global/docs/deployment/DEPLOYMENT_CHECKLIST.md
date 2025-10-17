# NetSuite Deferred Revenue Suitelet - Production Deployment Checklist

## Script File: ndc_deferred_revenue_suitelet_PRODUCTION.js
**Version:** 3.0
**Date:** 2025-10-14
**Environment:** HMP-Global NetSuite Account

---

## PRE-DEPLOYMENT CHECKLIST

### 1. Code Review Verification
- [ ] Production script has been reviewed and contains all fixes
- [ ] All hardcoded values have been replaced with script parameters
- [ ] All unsafe parseFloat usage has been replaced with safeParseFloat()
- [ ] Date validation is implemented for all user inputs
- [ ] Governance monitoring is in place with appropriate thresholds
- [ ] INSTR is used instead of LIKE for account filtering
- [ ] No double search execution exists
- [ ] showDrillDownDetails function is complete and functional
- [ ] Error handling is comprehensive throughout

### 2. Testing Requirements
- [ ] Script has been tested in Sandbox environment
- [ ] All test cases from TEST_PLAN_DEFERRED_REVENUE_SUITELET.md have passed
- [ ] Performance testing completed with large datasets (5000+ records)
- [ ] Governance usage stays within limits for maximum expected data
- [ ] CSV export functionality works correctly
- [ ] Drill-down functionality displays correct variance details
- [ ] JE integration shows correct amounts
- [ ] Date filters work as expected
- [ ] Error scenarios have been tested and handled gracefully

### 3. Configuration Preparation
- [ ] Saved Search ID verified: 338219 (or customsearch338219)
- [ ] Debug Folder ID identified: 229740
- [ ] Account numbers confirmed: 25010 and 25020
- [ ] Script parameters documented for deployment record

---

## DEPLOYMENT STEPS

### Step 1: Create Script Record in NetSuite
1. Navigate to **Customization > Scripting > Scripts > New**
2. Upload script file: `ndc_deferred_revenue_suitelet_PRODUCTION.js`
3. Configure script record:
   - **Name:** NDC Deferred Revenue Report with JE Integration
   - **ID:** `customscript_ndc_def_rev_je_prod`
   - **Type:** Suitelet
   - **API Version:** 2.1
   - **Status:** Testing (initially)

### Step 2: Add Script Parameters
Create the following script parameters:

| Parameter ID | Label | Type | Default Value | Help Text |
|---|---|---|---|---|
| `custscript_def_rev_saved_search` | Saved Search ID | Text | 338219 | ID of the saved search for deferred revenue |
| `custscript_def_rev_debug_folder` | Debug Folder ID | Text | 229740 | Folder ID for storing debug files |
| `custscript_def_rev_account_25010` | Account 25010 Number | Text | 25010 | Account number for deferred revenue 25010 |
| `custscript_def_rev_account_25020` | Account 25020 Number | Text | 25020 | Account number for deferred revenue 25020 |

### Step 3: Create Script Deployment
1. Click **Deploy Script** button
2. Configure deployment:
   - **Title:** NDC Deferred Revenue Report - Production
   - **ID:** `customdeploy_ndc_def_rev_je_prod`
   - **Status:** Testing (initially)
   - **Execute As Role:** Administrator (or appropriate role)
   - **Audience:** Select appropriate roles/users

### Step 4: Set Deployment Parameters
For each parameter, set the deployment-specific values:
- `custscript_def_rev_saved_search`: 338219
- `custscript_def_rev_debug_folder`: 229740
- `custscript_def_rev_account_25010`: 25010
- `custscript_def_rev_account_25020`: 25020

### Step 5: Initial Testing in Production
1. Access the Suitelet URL
2. Run report with default dates
3. Verify data loads correctly
4. Test date filters
5. Test drill-down functionality
6. Test CSV export
7. Monitor script execution logs
8. Check governance usage

### Step 6: User Acceptance Testing
1. Share URL with key users
2. Have users verify:
   - [ ] Report data accuracy
   - [ ] JE amounts are correct
   - [ ] Variance calculations are accurate
   - [ ] Drill-down shows expected details
   - [ ] Export functionality works
   - [ ] Performance is acceptable

### Step 7: Go-Live
1. Change script status from "Testing" to "Released"
2. Change deployment status from "Testing" to "Released"
3. Update any saved bookmarks or dashboard links
4. Notify all users of availability

---

## POST-DEPLOYMENT VERIFICATION

### Immediate Checks (First Hour)
- [ ] Script is accessible via URL
- [ ] No error messages in execution logs
- [ ] Reports load within acceptable time (< 30 seconds)
- [ ] Governance usage remains below 90%
- [ ] Debug files are being created in correct folder

### Day 1 Monitoring
- [ ] Monitor execution logs for any errors
- [ ] Check governance usage patterns
- [ ] Verify JE integration is capturing all expected transactions
- [ ] Confirm variance calculations match expectations
- [ ] Review any user-reported issues

### Week 1 Follow-up
- [ ] Analyze performance metrics
- [ ] Review debug files for any anomalies
- [ ] Gather user feedback
- [ ] Document any needed enhancements
- [ ] Update documentation if needed

---

## ROLLBACK PLAN

If critical issues are discovered:

1. **Immediate Actions:**
   - Set deployment status to "Testing" to limit access
   - Notify affected users
   - Document the issue in detail

2. **Revert Options:**
   - Option A: Fix issue in place if minor
   - Option B: Upload previous version (keep backup of original)
   - Option C: Disable deployment temporarily

3. **Communication:**
   - Send notification to all affected users
   - Provide ETA for resolution
   - Offer alternative reporting methods if needed

---

## DOCUMENTATION UPDATES

After successful deployment:

1. [ ] Update DEFERRED_REVENUE_JE_DOCUMENTATION.md with production URL
2. [ ] Add script/deployment IDs to documentation
3. [ ] Update user training materials
4. [ ] Create knowledge base article for end users
5. [ ] Document any deployment-specific configurations

---

## PERFORMANCE BENCHMARKS

Expected performance metrics:
- Small dataset (< 500 events): < 5 seconds
- Medium dataset (500-2000 events): < 15 seconds
- Large dataset (2000-5000 events): < 30 seconds
- Governance usage: < 5000 units for typical run

---

## SUPPORT INFORMATION

**Script Owner:** NDC Development Team
**Technical Contact:** [Technical Lead]
**Business Contact:** [Business Analyst]
**Documentation Location:** /SuiteScripts/Documentation/
**Debug Files Location:** Internal ID 229740

---

## SIGN-OFF

### Technical Approval
- [ ] Developer Sign-off: _________________ Date: _______
- [ ] Code Reviewer Sign-off: _________________ Date: _______
- [ ] QA Sign-off: _________________ Date: _______

### Business Approval
- [ ] Business Analyst Sign-off: _________________ Date: _______
- [ ] Business Owner Sign-off: _________________ Date: _______
- [ ] Finance Team Sign-off: _________________ Date: _______

---

## NOTES

_Add any deployment-specific notes, issues encountered, or special configurations here:_

_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________