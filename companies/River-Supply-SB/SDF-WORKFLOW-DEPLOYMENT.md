# SDF Workflow Deployment Guide
## Auto-Set Sales Rep from Customer - River-Supply-SB

**Project**: Salesrep Auto-Population Workflow
**Company**: River-Supply-SB
**Account ID**: 9910981-sb1
**Deployment Method**: SuiteCloud Development Framework (SDF)
**Record Types**: Estimate, Sales Order

---

## 📋 Pre-Deployment Checklist

Before deploying, verify:
- [ ] SuiteCloud CLI installed (`suitecloud --version`)
- [ ] Node.js installed (v14 or higher)
- [ ] River-Supply-SB account authenticated
- [ ] Administrator access to NetSuite
- [ ] Test Estimate and Sales Order records available

---

## 📁 Project Structure

The workflows have been created in your SDF project:

```
companies/River-Supply-SB/
├── src/
│   ├── Workflows/
│   │   ├── customworkflow_estimate_salesrep_auto.xml      ← Estimate workflow
│   │   └── customworkflow_salesorder_salesrep_auto.xml    ← Sales Order workflow
│   ├── deploy.xml                                          ← Updated
│   └── manifest.xml
├── suitecloud.config.js
└── SDF-WORKFLOW-DEPLOYMENT.md                              ← This file
```

---

## 🚀 Deployment Steps

### Step 1: Navigate to Project Folder

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\River-Supply-SB"
```

---

### Step 2: Verify Account Authentication

Check if you're authenticated to River-Supply-SB:

```bash
npx suitecloud account:setup --list
```

**Expected Output**: Should show River-Supply-SB account (9910981-sb1)

**If not authenticated**, run:

```bash
npx suitecloud account:setup
```

Follow the prompts and enter River-Supply-SB credentials.

---

### Step 3: Validate Project

Before deploying, validate the project to catch any errors:

```bash
npx suitecloud project:validate
```

**Expected Output**:
```
[INFO] Validation process has started...
[INFO] Validating XML files...
[INFO] Validation has finished successfully.
```

**If validation fails**:
- Check XML syntax in workflow files
- Verify deploy.xml includes `<workflows>` section
- Review error messages and fix accordingly

---

### Step 4: Deploy Workflows to NetSuite

Deploy the workflows to River-Supply-SB:

```bash
npx suitecloud project:deploy
```

**You will be prompted**:
```
The following objects will be deployed:

Workflows:
  - customworkflow_estimate_salesrep_auto
  - customworkflow_salesorder_salesrep_auto

Do you want to proceed? (Y/N):
```

**Type `Y` and press Enter**

**Deployment Process**:
```
[INFO] Deployment process has started...
[INFO] Uploading customization objects...
[INFO] Validating deployed objects...
[INFO] Deployment has finished successfully.
```

**Deployment Time**: Typically 1-3 minutes

---

### Step 5: Verify Deployment in NetSuite UI

1. Log into River-Supply-SB NetSuite account
2. Navigate to: **Customization → Workflow → Workflows**
3. You should see:
   - **Auto-Set Sales Rep from Customer - Estimate**
   - **Auto-Set Sales Rep from Customer - Sales Order**

4. Click on each workflow and verify:
   - Status: **Released** (active)
   - Record Type: Correct (Estimate or Sales Order)
   - States visible: "Populate Sales Rep" and "Lock Field for Non-Admins"

---

## 🧪 Testing Workflows

### Test Case 1: Create Estimate as Non-Admin User

**Setup**:
- Create/identify a test customer with salesrep assigned (e.g., "Test Customer" with salesrep "John Doe")
- Log in as a non-Administrator user (e.g., Sales Rep role)

**Execute**:
1. Navigate to: **Transactions → Sales → Enter Estimates → New**
2. Select the test customer
3. Observe the salesrep field

**Expected Results**:
- [ ] Salesrep field automatically populated with customer's salesrep
- [ ] Salesrep field is grayed out (disabled/locked)
- [ ] Cannot edit salesrep field
- [ ] Can save estimate successfully

**✅ PASS** | **❌ FAIL** (Circle one)

---

### Test Case 2: Create Estimate as Administrator

**Setup**:
- Log in as Administrator user

**Execute**:
1. Navigate to: **Transactions → Sales → Enter Estimates → New**
2. Select the same test customer

**Expected Results**:
- [ ] Salesrep field automatically populated
- [ ] Salesrep field is NOT locked (can edit)
- [ ] Can manually change salesrep to different person
- [ ] Manual change persists after save (not overwritten)

**✅ PASS** | **❌ FAIL** (Circle one)

---

### Test Case 3: Customer with No Salesrep

**Setup**:
- Create/identify a customer with NO salesrep assigned

**Execute**:
1. Create new Estimate
2. Select customer with no salesrep

**Expected Results**:
- [ ] Salesrep field remains EMPTY (not populated)
- [ ] Salesrep field is still LOCKED (for non-admins)
- [ ] Estimate can still be saved
- [ ] No errors occur

**✅ PASS** | **❌ FAIL** (Circle one)

---

### Test Case 4: Edit Existing Estimate

**Setup**:
- Use an existing estimate with salesrep already populated

**Execute**:
- Edit the estimate as non-admin

**Expected Results**:
- [ ] Salesrep field remains locked
- [ ] Salesrep value unchanged
- [ ] Cannot modify salesrep

**✅ PASS** | **❌ FAIL** (Circle one)

---

### Test Case 5-8: Repeat for Sales Orders

Repeat Test Cases 1-4 but using **Sales Orders** instead of Estimates:

- [ ] Test 5: Create Sales Order as non-admin → locked & populated ✅
- [ ] Test 6: Create Sales Order as admin → unlocked ✅
- [ ] Test 7: Customer with no salesrep → empty but locked ✅
- [ ] Test 8: Edit existing Sales Order → remains locked ✅

---

## 📊 Post-Deployment Monitoring

### Week 1: Active Monitoring

Monitor these metrics daily:

**1. Workflow Execution History**
```
Navigate to: Customization → Workflow → Workflow Instances
Filter by: Workflow = "Auto-Set Sales Rep from Customer"
Check for: Failed executions, errors
```

**2. User Support Tickets**
- Track: Number of questions about locked salesrep field
- Expected: <5 tickets in first week

**3. Data Accuracy Audit**
Run this saved search weekly:
```sql
SELECT
  tranid,
  entity.altname AS customer,
  entity.salesrep.entityid AS customer_salesrep,
  salesrep.entityid AS transaction_salesrep
FROM transaction
WHERE
  type IN ('Estimate', 'SalesOrd')
  AND trandate >= [DEPLOYMENT_DATE]
  AND entity.salesrep != salesrep
```

**Target**: 0 mismatches (100% accuracy)

---

## 🔧 Workflow Configuration Details

### Workflow #1: Estimate

**File**: `src/Workflows/customworkflow_estimate_salesrep_auto.xml`

**Key Settings**:
- **Script ID**: `customworkflow_estimate_salesrep_auto`
- **Record Type**: ESTIMATE
- **Trigger Events**: On Create, On Edit, On View
- **Trigger Timing**: Before Record Load

**States**:

1. **Populate Sales Rep** (`workflowstate_populate_salesrep`)
   - **Conditions**:
     - Customer.salesrep IS NOT EMPTY
     - Transaction.salesrep IS EMPTY
   - **Action**: Set Field Value (salesrep = customer.salesrep)
   - **Transition**: → Lock Field for Non-Admins

2. **Lock Field for Non-Admins** (`workflowstate_lock_field`)
   - **Condition**: Current User Role ≠ Administrator (Role ID 3)
   - **Action**: Lock Field (salesrep)
   - **Transition**: → End

---

### Workflow #2: Sales Order

**File**: `src/Workflows/customworkflow_salesorder_salesrep_auto.xml`

**Key Settings**:
- **Script ID**: `customworkflow_salesorder_salesrep_auto`
- **Record Type**: SALESORDER
- **Trigger Events**: On Create, On Edit, On View
- **Trigger Timing**: Before Record Load

**States**: Identical to Workflow #1 (different script IDs)

---

## 🛠️ Troubleshooting

### Issue 1: Deployment Fails - Authentication Error

**Error Message**:
```
[ERROR] Authentication failed. Please run account:setup
```

**Solution**:
```bash
npx suitecloud account:setup
```

Re-enter credentials and try deployment again.

---

### Issue 2: Deployment Fails - Validation Error

**Error Message**:
```
[ERROR] Validation failed for object: customworkflow_estimate_salesrep_auto
```

**Solution**:
1. Check XML syntax in workflow files
2. Verify all required fields are present
3. Run validation command for details:
   ```bash
   npx suitecloud project:validate
   ```

---

### Issue 3: Workflow Not Appearing in NetSuite

**Symptoms**: Deployment succeeds, but workflows not visible in UI

**Solution**:
1. Clear browser cache and reload NetSuite
2. Navigate to: Customization → Workflow → Workflows
3. Check "Show Inactive" filter
4. Verify workflows are "Released" (not "Not Released")

---

### Issue 4: Field Not Populating

**Symptoms**: Salesrep field remains empty when creating transaction

**Possible Causes**:
1. Customer has no salesrep assigned → **Expected behavior**
2. Workflow not released → Check status in UI
3. Condition not met → Check Workflow Instances log

**Solution**:
- Verify customer has salesrep: Records → Sales → Customers → [Customer] → Sales tab
- Check workflow execution: Customization → Workflow → Workflow Instances
- Review workflow log for state execution

---

### Issue 5: Field Not Locked

**Symptoms**: Non-admin users can edit salesrep field

**Possible Causes**:
1. User has Administrator role → **Expected behavior**
2. Workflow state not executing → Check Workflow Instances

**Solution**:
- Confirm user's role: Setup → Users/Roles → Manage Users → [User] → Access tab
- Check workflow execution log in Workflow Instances
- Verify role condition in workflow XML (Role ID 3)

---

## 🔄 Rollback Plan

### Emergency Rollback (Deactivate Workflows)

If workflows cause issues, deactivate them immediately:

**Option A: Via NetSuite UI**
1. Log in as Administrator
2. Navigate to: **Customization → Workflow → Workflows**
3. For EACH workflow:
   - Click **Edit**
   - Change **"Release Status"** to: `Not Released`
   - Click **Save**

**Effect**: Workflows stop executing immediately

---

**Option B: Via SDF (Recommended)**

1. Edit workflow XML files and set inactive:
   ```xml
   <isinactive>T</isinactive>
   ```

2. Deploy changes:
   ```bash
   npx suitecloud project:deploy
   ```

---

### Complete Removal

To permanently remove workflows:

1. Deactivate workflows first (see above)
2. Delete workflow XML files:
   ```bash
   rm src/Workflows/customworkflow_estimate_salesrep_auto.xml
   rm src/Workflows/customworkflow_salesorder_salesrep_auto.xml
   ```

3. Deploy deletion:
   ```bash
   npx suitecloud project:deploy
   ```

4. Confirm deletion in NetSuite UI

---

## 📝 Updating Workflows

If you need to modify workflows after deployment:

### Step 1: Edit XML Files

Make changes to workflow XML files in `src/Workflows/`

Common modifications:
- Add additional conditions
- Change role restrictions
- Modify field locking behavior

---

### Step 2: Validate Changes

```bash
npx suitecloud project:validate
```

---

### Step 3: Deploy Updates

```bash
npx suitecloud project:deploy
```

**Note**: Existing workflows will be UPDATED (not recreated). No data loss.

---

### Step 4: Test Changes

Repeat all test cases to ensure updates work correctly.

---

## 🔐 Security Considerations

### Administrator Role ID

The workflows use **Role ID: 3** for Administrator.

**To verify this is correct for your account**:

1. Log into NetSuite
2. Navigate to: **Setup → Users/Roles → Manage Roles**
3. Search for "Administrator"
4. Click on the role
5. Check the **Internal ID** field

**If different**, update workflow XML files:
```xml
<parameter>
  <name>CURRENTUSER.ROLE</name>
  <operator>NONEOF</operator>
  <value>3</value>  ← Change this to your Administrator Role ID
</parameter>
```

---

### Custom Administrator Roles

If you have custom roles that should be able to override the salesrep field:

1. Identify role IDs: Setup → Users/Roles → Manage Roles
2. Update workflow XML to include multiple roles:
   ```xml
   <parameter>
     <name>CURRENTUSER.ROLE</name>
     <operator>NONEOF</operator>
     <value>3</value>
     <value>1047</value>  ← Add custom role IDs
     <value>1055</value>
   </parameter>
   ```

3. Redeploy workflows

---

## 📊 Success Metrics

Track these KPIs to measure workflow success:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Salesrep Accuracy** | 100% | Weekly saved search: transactions where salesrep ≠ customer.salesrep |
| **User Complaints** | <5 per month | Support ticket tracking |
| **Workflow Execution Success Rate** | >99% | Workflow Instances - check for errors |
| **Administrator Overrides** | <10 per month | Custom saved search or manual review |

---

## 📞 Support & Maintenance

### Workflow Files Location

All workflow files are version-controlled in Git:

```
companies/River-Supply-SB/src/Workflows/
├── customworkflow_estimate_salesrep_auto.xml
└── customworkflow_salesorder_salesrep_auto.xml
```

### Deployment History

Track deployments in Git commits:

```bash
git log --oneline -- src/Workflows/
```

### Contact Information

| Role | Responsibility |
|------|----------------|
| **SDF Administrator** | Workflow deployment and updates |
| **NetSuite Administrator** | User access and troubleshooting |
| **Development Team** | Workflow logic modifications |

---

## ✅ Deployment Completion Checklist

- [ ] Project validated (`npx suitecloud project:validate`)
- [ ] Workflows deployed successfully
- [ ] Workflows visible in NetSuite UI
- [ ] Both workflows show "Released" status
- [ ] Test Case 1 passed (non-admin create estimate)
- [ ] Test Case 2 passed (admin create estimate)
- [ ] Test Case 3 passed (customer with no salesrep)
- [ ] Test Case 4 passed (edit existing estimate)
- [ ] Test Cases 5-8 passed (sales orders)
- [ ] User communication sent
- [ ] Support team briefed
- [ ] Monitoring dashboard configured
- [ ] Git commit created

---

## 🎯 Quick Command Reference

```bash
# Navigate to project
cd companies/River-Supply-SB

# Check authentication
npx suitecloud account:setup --list

# Validate project
npx suitecloud project:validate

# Deploy to NetSuite
npx suitecloud project:deploy

# Import updates from NetSuite (if workflows modified in UI)
npx suitecloud object:import --type workflow --scriptid customworkflow_estimate_salesrep_auto

# List all workflows in account
npx suitecloud object:list --type workflow
```

---

## 📅 Maintenance Schedule

- **Daily** (Week 1): Check Workflow Instances for errors
- **Weekly** (Month 1): Review user feedback and override requests
- **Monthly** (Ongoing): Review success metrics
- **Quarterly**: Assess if workflow modifications needed

---

**Deployment Guide Version**: 1.0
**Last Updated**: 2025-10-16
**Document Owner**: Claude Code

---

## 🚀 Next Steps After Deployment

1. **Monitor Workflow Instances** for first 48 hours
2. **Collect user feedback** in first week
3. **Review success metrics** at 30 days
4. **Document lessons learned**
5. **Commit to Git** (see command below)

---

## 📦 Git Commit Command

After successful deployment and testing:

```bash
git add .
git commit -m "feat(River-Supply-SB): Add salesrep auto-population workflows

- Create workflow for Estimates
- Create workflow for Sales Orders
- Auto-populate salesrep from customer master record
- Lock field for non-administrators
- Deployed via SDF

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

---

**END OF DEPLOYMENT GUIDE**
