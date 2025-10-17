# Workflow Deployment Guide - River Supply SB

**Date:** 2025-10-16
**Purpose:** Step-by-step guide to deploy and test workflow XMLs

## Quick Start

### Prerequisites
- ✅ SuiteCloud CLI configured for River-Supply-SB
- ✅ Authentication working
- ✅ Workflow XML files corrected and ready

### 3-Step Deployment Process

```bash
# Step 1: Navigate to project
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\River-Supply-SB"

# Step 2: Validate (expect field reference warnings - this is normal)
npx suitecloud project:validate

# Step 3: Deploy
npx suitecloud project:deploy
```

## Detailed Deployment Steps

### Phase 1: Test Connectivity with Minimal Workflow

**Purpose:** Verify deployment mechanism works before deploying complex workflows

```bash
# 1. Create a deploy list with ONLY the minimal workflow
# Edit src/deploy.xml to include only:
# - customworkflow_absolute_minimal

# 2. Deploy minimal workflow
npx suitecloud project:deploy

# Expected result: ✅ Success
# If fails: Check authentication, account permissions
```

**Verify in NetSuite:**
1. Log in to River-Supply-SB
2. Customization → Workflow → Workflows
3. Find "Absolute Minimal Workflow"
4. Status should be "Active"

### Phase 2: Deploy Estimate Workflow

**Purpose:** Deploy the actual sales rep auto-population for Estimates

```bash
# 1. Update deploy.xml to include:
# - customworkflow_estimate_salesrep_auto

# 2. Deploy
npx suitecloud project:deploy

# Expected warnings (SAFE TO IGNORE):
# - Field reference warnings during local validation
# - These resolve when deployed to NetSuite

# Expected result: ✅ Success
```

**Verify in NetSuite:**
1. Customization → Workflow → Workflows
2. Find "Auto-Set Sales Rep from Customer - Estimate"
3. Check configuration:
   - Record Type: Estimate
   - Trigger: On Create, On View/Update
   - State: "Populate Sales Rep"
   - Action: Set Field Value (salesrep)

**Test Functionality:**
1. Transactions → Sales → Enter Estimates → New
2. Select a customer with a default sales rep assigned
3. **Expected:** Sales Rep field auto-populates with customer's rep
4. Change customer to different one with different rep
5. **Expected:** Sales Rep field updates to new customer's rep
6. Save estimate
7. **Expected:** Sales rep persists correctly

### Phase 3: Deploy Sales Order Workflow

**Purpose:** Same functionality for Sales Orders

```bash
# 1. Update deploy.xml to include:
# - customworkflow_salesorder_salesrep_auto

# 2. Deploy
npx suitecloud project:deploy

# Expected result: ✅ Success
```

**Verify in NetSuite:**
1. Customization → Workflow → Workflows
2. Find "Auto-Set Sales Rep from Customer - Sales Order"
3. Configuration matches Estimate workflow

**Test Functionality:**
1. Transactions → Sales → Enter Sales Orders → New
2. Test same scenarios as Estimate
3. Verify sales rep auto-populates and updates on customer change

## Troubleshooting Guide

### Issue: "Invalid field reference" during deployment

**Symptoms:**
```
Error: Invalid "field" reference key "salesrep"
```

**Diagnosis:**
- Field doesn't exist in NetSuite
- Field name is wrong
- Permission issue

**Solution:**
```bash
# 1. Verify field exists
# In NetSuite: Customization → Lists, Records & Fields → Transaction Body Fields
# Look for "Sales Rep" field with ID: salesrep

# 2. Check workflow has permission to access field
# Customization → Workflow → Workflows → [Your Workflow] → Fields tab

# 3. Verify your role can access the field
# Setup → Users/Roles → Manage Roles → [Your Role] → Transactions tab
```

### Issue: "Invalid keephistory reference"

**Symptoms:**
```
Error: Invalid "keephistory" reference key "ONLYONCHANGE"
```

**Solution:**
The corrected workflows use `ONLYONCHANGE`. If this fails, try:
- Remove `keephistory` line entirely (optional field)
- Or change to: `<keephistory>NEVER</keephistory>`

### Issue: Workflow deploys but doesn't trigger

**Symptoms:**
- Workflow shows as Active in NetSuite
- Creating Estimate doesn't populate sales rep

**Diagnosis:**
```bash
# Check workflow execution logs
# In NetSuite: Setup → Audit Trail → Workflow Execution Log
# Filter by: Workflow = "Auto-Set Sales Rep from Customer"
```

**Common causes:**
1. **Workflow not active** - Check "Inactive" checkbox is unchecked
2. **Customer has no default sales rep** - Test with customer that has rep assigned
3. **Field is already populated** - Workflow only sets if empty (based on removed condition logic)
4. **Permissions** - User role doesn't have workflow execution permission

**Solution:**
```bash
# 1. Activate workflow
# Customization → Workflow → Workflows → [Workflow] → Edit
# General tab → Release Status: "Released"
# Is Inactive: Unchecked

# 2. Verify customer has sales rep
# Lists → Relationships → Customers → [Customer] → Sales tab
# Sales Rep field should have value

# 3. Test with completely new estimate
# Don't edit existing ones initially

# 4. Check role permissions
# Setup → Users/Roles → Manage Roles → [Your Role]
# Permissions tab → Transactions → Estimate
# "Level" should be "Full" or "Edit"
```

### Issue: "lockfieldaction not supported"

**Symptoms:**
```
Error: The object field "lockfieldaction" is invalid or not supported
```

**Solution:**
This feature was intentionally removed from the corrected workflows. Lock field actions are not supported in XML-based workflow definitions via SDF.

**Alternative approaches:**
1. **Configure field locking in NetSuite UI** after deployment
2. **Use field-level permissions** via role configuration
3. **Use User Event script** to lock field programmatically

### Issue: Workflow validation warnings about "not being used"

**Symptoms:**
```
Warning: The STDBODYFIELD:CUSTOMER.SALESREP condition builder parameter is not being used
```

**Diagnosis:**
This warning appears during local validation because conditions were removed from the workflow.

**Solution:**
✅ **SAFE TO IGNORE** - This is expected behavior after simplification. The workflow works without conditions.

## Testing Checklist

After deployment, verify each scenario:

### Estimate Workflow Tests

- [ ] **Test 1:** Create new Estimate with customer that has sales rep
  - Expected: Sales rep auto-populates

- [ ] **Test 2:** Create new Estimate with customer that has NO sales rep
  - Expected: Sales rep field stays empty

- [ ] **Test 3:** Edit existing Estimate, change customer to one with different rep
  - Expected: Sales rep updates to new customer's rep

- [ ] **Test 4:** Edit existing Estimate, manually change sales rep
  - Expected: Manual change persists (no override)

- [ ] **Test 5:** Transform Estimate to Sales Order
  - Expected: Sales rep carries over correctly

### Sales Order Workflow Tests

- [ ] **Test 6:** Create new Sales Order with customer that has sales rep
  - Expected: Sales rep auto-populates

- [ ] **Test 7:** Create new Sales Order with customer that has NO sales rep
  - Expected: Sales rep field stays empty

- [ ] **Test 8:** Edit existing Sales Order, change customer
  - Expected: Sales rep updates

- [ ] **Test 9:** Create Sales Order from Estimate
  - Expected: Sales rep matches Estimate

- [ ] **Test 10:** Manually override sales rep on Sales Order
  - Expected: Manual change persists

### Performance Tests

- [ ] **Test 11:** Create 10 Estimates rapidly
  - Expected: No performance degradation, all populate correctly

- [ ] **Test 12:** Bulk edit Estimates (change customer on multiple)
  - Expected: All sales reps update appropriately

### Permission Tests

- [ ] **Test 13:** Test as Administrator role
  - Expected: Workflow executes, field populates

- [ ] **Test 14:** Test as Sales role (non-admin)
  - Expected: Workflow executes, field populates

- [ ] **Test 15:** Test as limited user
  - Expected: Workflow executes based on permissions

## Deployment Manifest

### Files to Deploy

**Production Workflows:**
```
src/Objects/customworkflow_estimate_salesrep_auto.xml
src/Objects/customworkflow_salesorder_salesrep_auto.xml
```

**Optional Test Workflow:**
```
src/Objects/customworkflow_absolute_minimal.xml
```

**Do NOT deploy (test files only):**
```
src/Objects/customworkflow_test_corrected_v*.xml
```

### deploy.xml Configuration

```xml
<deploy>
  <configuration>
    <path>~/Objects/customworkflow_estimate_salesrep_auto.xml</path>
  </configuration>
  <configuration>
    <path>~/Objects/customworkflow_salesorder_salesrep_auto.xml</path>
  </configuration>
</deploy>
```

## Rollback Plan

If workflows cause issues after deployment:

### Quick Disable

```bash
# In NetSuite UI:
# Customization → Workflow → Workflows → [Workflow Name]
# Edit → General tab → Check "Is Inactive" → Save
```

### Complete Removal

```bash
# 1. Deactivate in NetSuite (see above)

# 2. Remove from SDF project
cd companies/River-Supply-SB
rm src/Objects/customworkflow_estimate_salesrep_auto.xml
rm src/Objects/customworkflow_salesorder_salesrep_auto.xml

# 3. Update deploy.xml to remove workflow references

# 4. Deploy to remove from NetSuite (if needed)
npx suitecloud project:deploy
```

## Success Criteria

Deployment is successful when:

- ✅ Both workflows deploy without errors
- ✅ Both workflows show as "Active" in NetSuite
- ✅ Creating new Estimate auto-populates sales rep from customer
- ✅ Creating new Sales Order auto-populates sales rep from customer
- ✅ Changing customer updates sales rep field dynamically
- ✅ No performance degradation
- ✅ No errors in Workflow Execution Log
- ✅ Manual overrides still work (not blocked)

## Next Steps After Successful Deployment

1. **Monitor for 24 hours**
   - Check Workflow Execution Log for errors
   - Monitor user feedback

2. **Document behavior**
   - Update user training materials
   - Add to internal documentation

3. **Consider enhancements**
   - Add conditions (if needed) via NetSuite UI
   - Add field locking via role permissions
   - Add notifications if sales rep changes

4. **Replicate to other transaction types** (if desired)
   - Invoice
   - Credit Memo
   - Return Authorization
   - etc.

## Support Contacts

**Project:** River-Supply-SB NetSuite Integration
**Documentation:** See MINIMAL-WORKFLOW-FINDINGS.md for technical details
**Testing Results:** Will be documented in WORKFLOW-DEPLOYMENT-RESULTS.md after execution
