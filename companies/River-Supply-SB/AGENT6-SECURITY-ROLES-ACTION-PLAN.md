# Agent 6: Security, Roles & Access Control - Action Plan

**Account:** River Supply SB (9910981-sb1)
**Agent Mission:** Security and role-related UAT issues
**Date:** 2025-10-16
**Status:** Analysis Complete - Ready for Implementation

---

## Executive Summary

This action plan addresses 5 UAT issues related to security, roles, and access control for River Supply SB. Analysis includes current state discovery via REST API queries, detailed implementation plans, testing procedures, and risk mitigation strategies.

### Issues Overview

| Issue | Type | Status | Priority | Time | Risk |
|-------|------|--------|----------|------|------|
| **#46** Customer Salesrep Security | Security | Workflow exists for transactions, needs customer record | HIGH | 3-4h | Low |
| **#47** Hide SuiteApps | Security | Permission configuration | MEDIUM | 1-2h | Low |
| **#48** Activities Personalization | Verification | Documentation task | LOW | 1h | None |
| **#49** Thunderbolt Access | Security | Subsidiary ID 2 identified, needs restriction | MEDIUM | 2-3h | Medium |
| **#50** Consolidate Purchasing Roles | Role Mgmt | Two roles → one "Purchasing Manager" | MEDIUM | 4-5h | Medium |
| **#51** Consolidate Accounting Roles | Role Mgmt | Two roles → one "Accounting" | MEDIUM | 4-5h | **HIGH** |

### Key Findings

**Issue #46 - Customer Salesrep Field:**
- ✅ Transaction forms already secured via workflow (non-admins cannot edit)
- ❌ Customer master record salesrep field still editable by all
- Solution: Extend existing workflow pattern to customer record

**Issue #49 - Thunderbolt Motor Sales:**
- ✅ **IDENTIFIED via REST API:** Subsidiary ID 2 (ACTIVE)
- Multi-subsidiary environment confirmed:
  - ID 1: River Supply Inc. (main)
  - ID 2: Thunderbolt Motor Sales (restricted)
  - ID 3: River Services (inactive)
- Solution: Implement subsidiary-based role restrictions

**Issue #51 - Critical Risk:**
- ⚠️ **COMPLIANCE WARNING:** Combining AP + AR roles may violate Segregation of Duties (SOD)
- Requires explicit business/compliance approval before implementation
- Consider SOX, GAAP, and internal audit requirements

### Total Estimates
- **Total Time:** 15-20 hours across all issues
- **Complexity:** Medium
- **Overall Risk:** Medium-High (Issue #51 has SOD compliance risk)

### Recommended Approach
**Week 1:** Quick wins (#48, #47, #46)
**Week 2:** Investigation & role consolidation prep (#49, #50, #51 - pending approvals)
**Week 3:** User migration (after business approval)

---

## Issue #46: Sales Rep Field - Customer Record Security

### Issue Analysis
**User Request:** "Sales Reps assigned to customers can only be changed by administrators and accounting"

**Current State:**
- ✅ **TRANSACTION FORMS**: Workflow already disables salesrep field for non-admins on Sales Orders
  - Workflow: `customworkflow_salesorder_salesrep_auto`
  - Condition: `{role} <> 3` (role 3 = Administrator)
  - Auto-populates from customer master record
- ❌ **CUSTOMER RECORD**: No restriction exists - all users can modify

**Gap:** Customer master record salesrep field is NOT restricted

### Current Setup (Via REST API Query)
**Relevant Roles:**
- Administrator (ID: 3, Script ID: `administrator`)
- Accountant (ID: 1, Script ID: `accountant`)
- River Supply - AP Specialist (ID: 1002)
- River Supply - AR Specialist (ID: 1003)

**Customer Record Permissions:**
- Most roles have `LIST_CUSTOMER` permission at EDIT or FULL level
- No field-level restriction exists on `salesrep` field

### Solution: Client Script + Field-Level Security

**Approach:** Use Client Script (User Event) to enforce field-level security on Customer record

**Implementation Plan:**

#### Step 1: Create User Event Script
```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleName Customer_SalesRep_FieldSecurity
 */
define(['N/runtime', 'N/ui/serverWidget'], (runtime, serverWidget) => {

    function beforeLoad(context) {
        // Only apply on EDIT and VIEW modes
        if (context.type !== context.UserEventType.CREATE) {
            const currentUser = runtime.getCurrentUser();
            const currentRole = currentUser.role;

            // Allowed roles (IDs):
            // 3 = Administrator
            // 1 = Accountant
            // 2 = Accountant (Reviewer)
            const allowedRoles = ['3', '1', '2'];

            if (!allowedRoles.includes(currentRole.toString())) {
                const salesRepField = context.form.getField({
                    id: 'salesrep'
                });

                if (salesRepField) {
                    salesRepField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.INLINE
                    });
                }
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
```

#### Step 2: Create Script Deployment
```xml
<scriptdeployment scriptid="customdeploy_customer_salesrep_security">
  <recordtype>CUSTOMER</recordtype>
  <status>RELEASED</status>
  <allemployees>T</allemployees>
  <allroles>T</allroles>
  <loglevel>ERROR</loglevel>
</scriptdeployment>
```

#### Step 3: Alternative - Workflow Solution (Extends Existing Pattern)
Add to existing customer workflow or create new workflow:

```xml
<workflow scriptid="customworkflow_customer_salesrep_security">
  <name>Customer - Sales Rep Field Security</name>
  <recordtypes>CUSTOMER</recordtypes>
  <initonvieworupdate>T</initonvieworupdate>
  <workflowstates>
    <workflowstate scriptid="workflowstate_restrict_salesrep">
      <workflowactions triggertype="BEFORELOAD">
        <setdisplaytypeaction scriptid="workflowaction_disable_salesrep_customer">
          <displaytype>DISABLED</displaytype>
          <field>salesrep</field>
          <initcondition>
            <!-- Disable if role is NOT (3=Admin OR 1=Accountant OR 2=Accountant Reviewer) -->
            <formula>{role}&lt;&gt;3 AND {role}&lt;&gt;1 AND {role}&lt;&gt;2</formula>
            <type>FORMULA</type>
          </initcondition>
        </setdisplaytypeaction>
      </workflowactions>
    </workflowstate>
  </workflowstates>
</workflow>
```

### Testing Plan
1. **Test with Administrator Role (ID: 3)**
   - Navigate to any customer record
   - ✅ Verify salesrep field is EDITABLE
   - Change salesrep value
   - ✅ Verify save succeeds

2. **Test with Accountant Role (ID: 1)**
   - Navigate to same customer
   - ✅ Verify salesrep field is EDITABLE
   - Change salesrep value
   - ✅ Verify save succeeds

3. **Test with Sales Representative Role (ID: 1007)**
   - Navigate to same customer
   - ✅ Verify salesrep field is DISABLED/INLINE
   - Attempt to edit (should not be possible)

4. **Test with Purchasing Agent Role (ID: 1006)**
   - Navigate to customer with customer permission
   - ✅ Verify salesrep field is DISABLED/INLINE

5. **Integration Test**
   - Change salesrep on customer record (as admin)
   - Create new Sales Order for that customer
   - ✅ Verify transaction workflow auto-populates correct salesrep
   - ✅ Verify transaction salesrep field is disabled for non-admin

### Implementation Steps
1. Choose approach: Client Script OR Workflow (Recommend: **Workflow** for consistency)
2. Create workflow XML in `src/Objects/`
3. Update `deploy.xml` to include new workflow
4. Deploy to sandbox: `npx suitecloud project:deploy`
5. Execute testing plan with 4 different roles
6. Document results
7. If successful, create deployment guide for production

### Priority & Time Estimate
- **Priority:** HIGH (data integrity concern)
- **Time:** 3-4 hours
  - 1 hour: Create workflow/script
  - 1 hour: Deploy and configure
  - 1-2 hours: Comprehensive testing with multiple roles

---

## Issue #47: Hide SuiteApps from Non-Administrators

### Issue Analysis
**User Request:** "SuiteApps; Can this be hidden except for administrator of account"

**Current State:**
- SuiteApps tab visible to all users in navigation
- Users can browse and potentially request installations
- Security concern: visibility of available apps

**Goal:** Restrict SuiteApps visibility to Administrator role only

### Current Setup
**SuiteApps Permissions:**
- Controlled by `ADMI_BUNDLEMANAGER` permission
- Default visibility based on role's setup permissions

### Solution: Role Permission Adjustment

**Implementation Plan:**

#### Step 1: Identify Roles with SuiteApps Access
Query current permissions:
```sql
SELECT
  r.id,
  r.name,
  r.scriptid
FROM role r
WHERE r.isinactive = 'F'
  AND r.id IN (
    SELECT role
    FROM rolePermission
    WHERE permkey = 'ADMI_BUNDLEMANAGER'
  )
```

#### Step 2: Remove Permission from Non-Admin Roles
For each custom role, verify `ADMI_BUNDLEMANAGER` permission is NOT granted:

**Roles to Review:**
1. River Supply - AP Specialist (1002) - Remove if exists
2. River Supply - AR Specialist (1003) - Remove if exists
3. River Supply - Developer (1004) - **KEEP** (developers need this)
4. River Supply - Inventory Manager (1005) - Remove if exists
5. River Supply - Purchasing Agent (1006) - Remove if exists
6. River Supply - Sales Representative (1007) - Remove if exists

#### Step 3: Update Role Definitions
Ensure only these roles have `ADMI_BUNDLEMANAGER`:
- Administrator (3)
- System Administrator (25)
- Developer (55) - if they need SuiteApp development access
- River Supply - Developer (1004) - if they need SuiteApp development access

#### Step 4: UI Customization (Alternative Approach)
If SuiteApps tab still appears, use **Center Type** customization:
1. Navigate to: Setup → Users/Roles → Manage Roles → [Role]
2. Set appropriate Center Type (Account Center, Sales Center, etc.)
3. Customize Center Tab visibility

### Testing Plan
1. **Test with Administrator Role (ID: 3)**
   - Log in as Administrator
   - ✅ Verify SuiteApps tab IS visible
   - ✅ Verify can access SuiteApps marketplace

2. **Test with Developer Role (ID: 1004)**
   - Log in as Developer
   - Decision point: Should developers see SuiteApps?
   - If YES: ✅ Verify visible
   - If NO: ✅ Verify hidden

3. **Test with Sales Representative (ID: 1007)**
   - Log in as Sales Rep
   - ✅ Verify SuiteApps tab is NOT visible

4. **Test with Accounting Roles (1002, 1003)**
   - Log in as AP or AR Specialist
   - ✅ Verify SuiteApps tab is NOT visible

### Implementation Steps
1. Query current role permissions for `ADMI_BUNDLEMANAGER`
2. Update each custom role XML to remove permission
3. Update `deploy.xml`
4. Deploy: `npx suitecloud project:deploy`
5. Test with 4 different roles
6. Verify tab visibility changes

### Priority & Time Estimate
- **Priority:** MEDIUM (security/UX improvement)
- **Time:** 1-2 hours
  - 30 min: Query and identify roles
  - 30 min: Update role XMLs
  - 30 min: Deploy and test
  - 30 min: Documentation

---

## Issue #48: Activities - Personalization Verification

### Issue Analysis
**User Request:** "Activities; Is this personalized for each person"

**This is a VERIFICATION question, not a configuration request**

**Understanding NetSuite Activities:**
- Activities = Tasks, Calls, Events, System Notes
- Visibility controlled by:
  - **Assigned To** field (primary filter)
  - **Company/Contact** association
  - **Role permissions** (LIST_EVENT, LIST_TASK, etc.)
  - **User preferences** (My Activities vs All Activities)

### Current Setup (Via Existing Roles)
**All River Supply roles have:**
- `LIST_EVENT` permission (FULL or VIEW)
- `LIST_TASK` permission (FULL or VIEW)

**Expected Behavior:**
- ✅ Users see activities ASSIGNED to them
- ✅ Users see activities for customers/vendors they can access
- ❌ Users do NOT see all users' activities (unless Admin)

### Solution: Verification Steps

**Implementation Plan:**

#### Step 1: Verify Current Behavior
1. Create test activities for different users
2. Verify personalization is working as expected
3. Document findings

#### Step 2: Configure Portlet Defaults (If Needed)
If users are seeing too many activities:
1. Navigate to: Home → Customize Dashboard
2. Configure "Activities" portlet settings:
   - Show: **My Activities** (not All Activities)
   - Date Range: **This Week** or **This Month**

#### Step 3: Role Permission Verification
Verify role permissions are appropriate:
- **FULL** level: Can create, edit, delete own activities
- **VIEW** level: Can only view activities assigned to them
- **NONE**: Cannot see activities

#### Step 4: Create Documentation
Document standard behavior for River Supply users:
```markdown
## Activities Visibility - Standard Behavior

**What You See:**
- ✅ Activities assigned to YOU
- ✅ Activities for YOUR customers/contacts
- ✅ Activities YOU created
- ❌ Other users' personal activities (unless shared)

**How to Filter:**
1. Home → Activities portlet → Click "Customize"
2. Select "My Activities" (not "All Activities")
3. Set date range preference

**Administrators:**
- Can see ALL activities (use filters to focus)
```

### Testing Plan
1. **Create Test Activities**
   - As Admin: Create activity assigned to User A
   - As Admin: Create activity assigned to User B
   - As User A: Create activity for Customer X

2. **Test Visibility - User A**
   - Log in as User A
   - Navigate to Activities list
   - ✅ Verify sees activity assigned to them
   - ✅ Verify sees activity they created
   - ❌ Verify does NOT see User B's activity

3. **Test Visibility - User B**
   - Log in as User B
   - Navigate to Activities list
   - ✅ Verify sees only THEIR activities

4. **Test Visibility - Administrator**
   - Log in as Admin
   - Navigate to Activities list
   - ✅ Verify can see ALL activities (with appropriate filters)

### Implementation Steps
1. Create test activities with different assignments
2. Test with 3 different users
3. Document actual behavior
4. If behavior is NOT personalized:
   - Review role permissions
   - Check if "All Activities" view is default
   - Update portlet settings
5. Create user guide for managing activity views

### Priority & Time Estimate
- **Priority:** LOW (verification task, not implementation)
- **Time:** 1 hour
  - 30 min: Create test data and verify
  - 30 min: Document findings and create user guide

---

## Issue #49: Thunderbolt Motor Sales - Access Restrictions

### Issue Analysis
**User Request:** "Only a few people can access Thunderbolt Motor Sales; How is this accessed?"

**Understanding the Request:**
- Thunderbolt Motor Sales is likely:
  - **Subsidiary** in multi-subsidiary environment, OR
  - **Department/Class/Location**, OR
  - **Customer record** with special access needs

**Goal:** Implement role-based access restrictions for this entity

### Current Setup (Via REST API Query)
**IDENTIFIED:** Thunderbolt Motor Sales is a **SUBSIDIARY**
- **Internal ID:** 2
- **Name:** Thunderbolt Motor Sales
- **Status:** ACTIVE
- **Type:** Subsidiary (multi-subsidiary environment confirmed)

**Complete Subsidiary Structure:**
```
ID: 1 | ACTIVE   | River Supply Inc. (Main subsidiary)
ID: 2 | ACTIVE   | Thunderbolt Motor Sales (Restricted access required)
ID: 3 | INACTIVE | River Services (Old/unused)
```

Query results confirmed it is NOT a customer, department, or location.

### Solution: Subsidiary-Based Access Control

**Confirmed Approach:** Use subsidiary restrictions on roles to limit access to Thunderbolt Motor Sales (Subsidiary ID: 2)

#### Step 1: Determine Which Roles Need Access

First, identify which users/roles should have access to Thunderbolt Motor Sales subsidiary.

**Example roles that might need access:**
- Administrator (always has access)
- Specific sales reps assigned to Thunderbolt
- Accounting (if they handle Thunderbolt financials)

**Roles that should NOT have access:**
- General sales reps (unless specifically assigned)
- Other subsidiary-specific roles

#### Step 2: Configure Subsidiary Restrictions on Roles

**Option A: INCLUDE Model (Restrictive - Recommended)**
Only users with explicitly granted access can see Thunderbolt:

```xml
<!-- Example: Sales role that CAN access Thunderbolt -->
<role scriptid="customrole_river_sales_thunderbolt">
  <name>River Supply - Sales Rep (Thunderbolt)</name>
  <subsidiaryrestriction>SUBSIDIARY</subsidiaryrestriction>
  <subsidiaryoption>
    <subsidiary internalid="2">INCLUDE</subsidiary>
  </subsidiaryoption>
  <!-- Other role permissions -->
</role>

<!-- Example: General sales role that CANNOT access Thunderbolt -->
<role scriptid="customrole_river_sales">
  <name>River Supply - Sales Representative</name>
  <subsidiaryrestriction>SUBSIDIARY</subsidiaryrestriction>
  <subsidiaryoption>
    <!-- Subsidiary ID 2 NOT included, so cannot access -->
    <subsidiary internalid="1">INCLUDE</subsidiary> <!-- Assume ID 1 is main subsidiary -->
  </subsidiaryoption>
</role>
```

**Option B: EXCLUDE Model**
All users can see everything EXCEPT Thunderbolt unless specifically granted:

```xml
<role scriptid="customrole_river_sales">
  <subsidiaryrestriction>SUBSIDIARY</subsidiaryrestriction>
  <subsidiaryoption>
    <subsidiary internalid="2">EXCLUDE</subsidiary>
  </subsidiaryoption>
</role>
```

#### Step 3: Update Existing Roles
Review ALL existing River Supply custom roles and configure subsidiary restrictions:

1. **River Supply - AP Specialist (1002)** - Decision: Include Thunderbolt? Y/N
2. **River Supply - AR Specialist (1003)** - Decision: Include Thunderbolt? Y/N
3. **River Supply - Developer (1004)** - Usually include all subsidiaries
4. **River Supply - Inventory Manager (1005)** - Decision: Include Thunderbolt? Y/N
5. **River Supply - Purchasing Agent (1006)** - Decision: Include Thunderbolt? Y/N
6. **River Supply - Sales Representative (1007)** - Decision: Include Thunderbolt? Y/N

#### Step 4: Create Thunderbolt-Specific Role (If Needed)
If specific users need exclusive access to Thunderbolt:

```xml
<role scriptid="customrole_river_thunderbolt_sales">
  <name>River Supply - Thunderbolt Sales Representative</name>
  <centertype>SALESCENTER</centertype>
  <issalesrole>T</issalesrole>
  <subsidiaryrestriction>SUBSIDIARY</subsidiaryrestriction>
  <subsidiaryoption>
    <subsidiary internalid="2">INCLUDE</subsidiary>
  </subsidiaryoption>
  <!-- Copy permissions from standard sales rep role -->
</role>
```

### Testing Plan
1. **Query All Subsidiaries**
   - Verify complete subsidiary list
   - Identify what subsidiary ID 1 is (likely main subsidiary)

2. **Test Current Access (Before Changes)**
   - Log in as different roles
   - Navigate to Transactions → Enter Transactions → Select Subsidiary dropdown
   - Document which subsidiaries each role can currently see

3. **Implement Subsidiary Restrictions**
   - Update role definitions with subsidiary restrictions
   - Deploy changes

4. **Test Restricted Access (After Changes)**
   - **Test with General Sales Rep (ID: 1007)**
     - Log in as general sales rep
     - Attempt to view Thunderbolt subsidiary
     - ✅ Verify CANNOT see Thunderbolt in subsidiary dropdown
     - ✅ Verify cannot access Thunderbolt customers/transactions

   - **Test with Thunderbolt-Authorized User**
     - Log in as user with Thunderbolt access
     - ✅ Verify CAN see Thunderbolt in subsidiary dropdown
     - ✅ Verify can access Thunderbolt customers/transactions

   - **Test with Administrator (ID: 3)**
     - Log in as admin
     - ✅ Verify can see ALL subsidiaries (no restrictions)

5. **Test Data Isolation**
   - Create test transaction in Thunderbolt subsidiary (as authorized user)
   - Log in as restricted user
   - ✅ Verify transaction does NOT appear in searches/reports
   - ✅ Verify customers from Thunderbolt do NOT appear in customer list

### Implementation Steps
1. **Query all subsidiaries to understand structure:**
   ```sql
   SELECT id, name, isinactive FROM subsidiary ORDER BY id
   ```

2. **Document business requirements:**
   - Which users need Thunderbolt access?
   - Should existing roles be updated or new roles created?
   - Are there other subsidiaries that need similar restrictions?

3. **Choose implementation approach:**
   - Option A: Update existing roles with EXCLUDE (easier)
   - Option B: Create Thunderbolt-specific roles (more granular control)

4. **Update role XML files:**
   - Add `<subsidiaryrestriction>` and `<subsidiaryoption>` tags
   - Test in development/sandbox first

5. **Deploy changes:**
   ```bash
   npx suitecloud project:deploy
   ```

6. **Assign users to appropriate roles:**
   - If created new Thunderbolt roles, migrate users

7. **Test thoroughly with multiple user scenarios**

8. **Document access control policy:**
   - Who has Thunderbolt access
   - How to request access
   - Approval process

### Priority & Time Estimate
- **Priority:** MEDIUM (business-critical if data isolation required)
- **Time:** 2-3 hours
  - ✅ 30 min: Investigation (COMPLETE - identified as Subsidiary ID 2)
  - 30 min: Document business requirements and choose approach
  - 1 hour: Implement role restrictions
  - 1 hour: Testing and validation
  - 30 min: Create access control policy documentation

---

## Issue #50: Consolidate Purchasing Agent + Inventory Manager → Purchasing Manager

### Issue Analysis
**User Request:** "Role; Purchasing Agent and Inventory Manager are the same. Should be Purchasing Manager"

**Current State:**
Two separate roles with overlapping functions:

**River Supply - Purchasing Agent (ID: 1006)**
- Purchase Orders (FULL)
- Item Receipts (FULL)
- Vendor Bills (CREATE)
- Vendor Authorizations (FULL)
- Vendors (FULL)
- Items (FULL)

**River Supply - Inventory Manager (ID: 1005)**
- Inventory Counts (FULL)
- Inventory Worksheets (FULL)
- Item Receipts (FULL)
- Item Shipments (FULL)
- Items (FULL)
- Bins (FULL)

**Analysis:** These roles have DIFFERENT focuses:
- Purchasing Agent = **Procurement process**
- Inventory Manager = **Inventory control process**

However, client wants **single consolidated role**

### Solution: Create Unified "Purchasing Manager" Role

**New Role: River Supply - Purchasing Manager**
Combines ALL permissions from both roles:

```xml
<role scriptid="customrole_river_purchasing_mgr">
  <name>River Supply - Purchasing Manager</name>
  <centertype>ACCOUNTCENTER</centertype>
  <employeerestriction>NONE</employeerestriction>
  <issalesrole>F</issalesrole>
  <issupportrole>F</issupportrole>
  <restricttimeandexpenses>F</restricttimeandexpenses>
  <permissions>
    <!-- Transaction Find -->
    <permission>
      <permkey>TRAN_FIND</permkey>
      <permlevel>FULL</permlevel>
    </permission>

    <!-- PURCHASING PERMISSIONS -->
    <permission>
      <permkey>TRAN_PURCHORD</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_ITEMRCPT</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_VENDBILL</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_VENDAUTH</permkey>
      <permlevel>FULL</permlevel>
    </permission>

    <!-- INVENTORY PERMISSIONS -->
    <permission>
      <permkey>TRAN_INVCOUNT</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_INVWKSHT</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_ITEMSHIP</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_RTNAUTH</permkey>
      <permlevel>VIEW</permlevel>
    </permission>

    <!-- LISTS -->
    <permission>
      <permkey>LIST_VENDOR</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>LIST_ITEM</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>LIST_BIN</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>LIST_LOCATION</permkey>
      <permlevel>VIEW</permlevel>
    </permission>
    <permission>
      <permkey>LIST_EVENT</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>LIST_TASK</permkey>
      <permlevel>FULL</permlevel>
    </permission>

    <!-- SALES ORDERS (View only) -->
    <permission>
      <permkey>TRAN_SALESORD</permkey>
      <permlevel>VIEW</permlevel>
    </permission>

    <!-- REPORTS -->
    <permission>
      <permkey>REPO_INVENTORY</permkey>
      <permlevel>VIEW</permlevel>
    </permission>
    <permission>
      <permkey>REPO_AP</permkey>
      <permlevel>VIEW</permlevel>
    </permission>
  </permissions>
</role>
```

### Migration Plan

**Phase 1: Create New Role**
1. Create `customrole_river_purchasing_mgr.xml`
2. Deploy to sandbox
3. Test all permissions

**Phase 2: User Migration**
1. Query current users assigned to old roles:
   ```sql
   SELECT
     e.id,
     e.entityid,
     e.email,
     er.role,
     r.name as role_name
   FROM employee e
   JOIN employeeRoles er ON e.id = er.entity
   JOIN role r ON er.role = r.id
   WHERE er.role IN (1005, 1006)
   ORDER BY e.entityid
   ```

2. Document which users need migration
3. Communicate change to users
4. Reassign users to new role (UI or SuiteQL update)

**Phase 3: Deactivate Old Roles**
1. After all users migrated, set old roles to inactive:
   ```xml
   <role scriptid="customrole_river_purchasing">
     <isinactive>T</isinactive>
   </role>

   <role scriptid="customrole_river_inventory_mgr">
     <isinactive>T</isinactive>
   </role>
   ```

2. Deploy changes
3. Monitor for any issues

**Phase 4: Cleanup (30 days later)**
1. Verify no users assigned to old roles
2. Delete old role definitions
3. Update documentation

### Testing Plan
1. **Test New Role - Purchasing Functions**
   - Create Purchase Order ✅
   - Create Item Receipt ✅
   - Create Vendor Bill ✅
   - View Vendor records ✅
   - Manage items ✅

2. **Test New Role - Inventory Functions**
   - Create Inventory Count ✅
   - Create Inventory Worksheet ✅
   - Create Item Shipment ✅
   - Manage bins ✅
   - View inventory reports ✅

3. **Test Restrictions**
   - Attempt to create Sales Order (should be VIEW only) ✅
   - Attempt to access financials (should be restricted) ✅

4. **Migration Test**
   - Assign test user to new role
   - Verify user can perform ALL previous functions
   - Verify no loss of access

### Implementation Steps
1. Create new role XML file
2. Add to `deploy.xml`
3. Deploy: `npx suitecloud project:deploy`
4. Test all permissions thoroughly
5. Query users currently assigned to old roles
6. Create migration plan document
7. Communicate with users about change
8. Perform user migration (in batches if large number)
9. Deactivate old roles
10. Monitor for 30 days
11. Delete old roles

### Priority & Time Estimate
- **Priority:** MEDIUM (organizational cleanup)
- **Time:** 4-5 hours
  - 1 hour: Create new role definition
  - 1 hour: Deploy and test permissions
  - 1 hour: Query and document current users
  - 1 hour: User migration communication and execution
  - 1 hour: Deactivation and monitoring

**Risk Level:** MEDIUM
- Risk: Users temporarily lose access during migration
- Mitigation: Migrate in batches, test thoroughly, maintain old roles active during transition

---

## Issue #51: Consolidate AP Specialist + AR Specialist → Accounting

### Issue Analysis
**User Request:** "Role; AP and AR Specialist are the same. Should be Accounting"

**Current State:**
Two separate roles with distinct functions:

**River Supply - AP Specialist (ID: 1002)**
- Vendor Bills (FULL)
- Vendor Credits (FULL)
- Vendor Payments (FULL)
- Checks (FULL)
- Expense Reports (VIEW)
- Vendors (VIEW)
- AP Reports (VIEW)

**River Supply - AR Specialist (ID: 1003)**
- Customer Invoices (FULL)
- Customer Credits (FULL)
- Customer Payments (FULL)
- Customer Deposits (FULL)
- Customer Refunds (FULL)
- AR Reports (VIEW)

**Analysis:** These roles have COMPLETELY DIFFERENT focuses:
- AP Specialist = **Accounts Payable**
- AR Specialist = **Accounts Receivable**

However, client wants **single "Accounting" role**

### Solution: Create Unified "Accounting" Role

**New Role: River Supply - Accounting**
Combines ALL permissions from both AP and AR roles:

```xml
<role scriptid="customrole_river_accounting">
  <name>River Supply - Accounting</name>
  <centertype>ACCOUNTCENTER</centertype>
  <employeerestriction>NONE</employeerestriction>
  <issalesrole>F</issalesrole>
  <issupportrole>F</issupportrole>
  <restricttimeandexpenses>F</restricttimeandexpenses>
  <permissions>
    <!-- Transaction Find -->
    <permission>
      <permkey>TRAN_FIND</permkey>
      <permlevel>FULL</permlevel>
    </permission>

    <!-- ACCOUNTS PAYABLE PERMISSIONS -->
    <permission>
      <permkey>TRAN_VENDBILL</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_VENDCRED</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_VENDPYMT</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_CHECK</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_EXPREPT</permkey>
      <permlevel>EDIT</permlevel>
    </permission>

    <!-- ACCOUNTS RECEIVABLE PERMISSIONS -->
    <permission>
      <permkey>TRAN_CUSTINVC</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_CUSTCRED</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_CUSTPYMT</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_CUSTDEP</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>TRAN_CUSTRFND</permkey>
      <permlevel>FULL</permlevel>
    </permission>

    <!-- LISTS -->
    <permission>
      <permkey>LIST_VENDOR</permkey>
      <permlevel>VIEW</permlevel>
    </permission>
    <permission>
      <permkey>LIST_CUSTOMER</permkey>
      <permlevel>VIEW</permlevel>
    </permission>
    <permission>
      <permkey>LIST_ACCOUNT</permkey>
      <permlevel>VIEW</permlevel>
    </permission>

    <!-- REPORTS -->
    <permission>
      <permkey>REPO_AP</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>REPO_AR</permkey>
      <permlevel>FULL</permlevel>
    </permission>
    <permission>
      <permkey>REPO_FINANCIALS</permkey>
      <permlevel>VIEW</permlevel>
    </permission>

    <!-- RECONCILIATION (Important for unified accounting role) -->
    <permission>
      <permkey>TRAN_RECON</permkey>
      <permlevel>FULL</permlevel>
    </permission>
  </permissions>
</role>
```

### Migration Plan

**Phase 1: Create New Role**
1. Create `customrole_river_accounting.xml`
2. Deploy to sandbox
3. Test all AP and AR permissions

**Phase 2: User Migration**
1. Query current users assigned to AP and AR roles:
   ```sql
   SELECT
     e.id,
     e.entityid,
     e.email,
     er.role,
     r.name as role_name
   FROM employee e
   JOIN employeeRoles er ON e.id = er.entity
   JOIN role r ON er.role = r.id
   WHERE er.role IN (1002, 1003)
   ORDER BY r.name, e.entityid
   ```

2. Document:
   - Who currently has AP role only
   - Who currently has AR role only
   - Who has BOTH roles (if any)

3. Communication plan:
   - Notify users of role consolidation
   - Explain new unified permissions
   - Schedule migration date

**Phase 3: Execute Migration**
1. For AP-only users:
   - Assign new Accounting role
   - **IMPORTANT:** They will gain AR permissions - verify this is acceptable

2. For AR-only users:
   - Assign new Accounting role
   - **IMPORTANT:** They will gain AP permissions - verify this is acceptable

3. Verify each user's access after migration

**Phase 4: Deactivate Old Roles**
1. After all users migrated and verified:
   ```xml
   <role scriptid="customrole_river_ap">
     <isinactive>T</isinactive>
   </role>

   <role scriptid="customrole_river_ar">
     <isinactive>T</isinactive>
   </role>
   ```

2. Deploy changes
3. Monitor for issues

**Phase 5: Cleanup (30 days later)**
1. Verify no users assigned to old roles
2. Delete old role definitions
3. Update documentation

### Testing Plan
1. **Test New Role - AP Functions**
   - Create Vendor Bill ✅
   - Create Vendor Payment ✅
   - Create Vendor Credit ✅
   - Write Check ✅
   - View AP Aging Report ✅

2. **Test New Role - AR Functions**
   - Create Customer Invoice ✅
   - Create Customer Payment ✅
   - Create Customer Credit ✅
   - Process Customer Deposit ✅
   - View AR Aging Report ✅

3. **Test Financial Reports**
   - View Balance Sheet (should be VIEW only) ✅
   - View P&L (should be VIEW only) ✅
   - Bank Reconciliation (should be FULL) ✅

4. **Test Restrictions**
   - Attempt to edit Chart of Accounts (should be VIEW only) ✅
   - Attempt to create Journal Entry (should be restricted unless granted) ✅

5. **Migration Test**
   - Test with former AP user: Verify can now do AR functions ✅
   - Test with former AR user: Verify can now do AP functions ✅

### Implementation Steps
1. Create new role XML file
2. Add to `deploy.xml`
3. Deploy: `npx suitecloud project:deploy`
4. Test all AP and AR permissions thoroughly
5. Query users currently assigned to old roles
6. **IMPORTANT:** Get business approval for expanded permissions
   - AP users gaining AR access
   - AR users gaining AP access
7. Create migration communication
8. Perform user migration (coordinate with users)
9. Deactivate old roles
10. Monitor for 30 days
11. Delete old roles

### Priority & Time Estimate
- **Priority:** MEDIUM (organizational cleanup)
- **Time:** 4-5 hours
  - 1 hour: Create new role definition
  - 1 hour: Deploy and test permissions
  - 1 hour: Query users and get business approval
  - 1 hour: User migration communication and execution
  - 1 hour: Deactivation and monitoring

**Risk Level:** HIGH
- **Risk:** Users gain access to functions outside their original scope
  - Former AP user can now process customer payments
  - Former AR user can now pay vendor bills
- **Mitigation:**
  - Get explicit business approval for expanded access
  - Provide training on new responsibilities
  - Consider keeping roles separate if segregation of duties is required
  - Document audit trail for compliance

**⚠️ COMPLIANCE WARNING:**
Combining AP and AR roles may violate **Segregation of Duties (SOD)** controls in some compliance frameworks (SOX, GAAP). Verify with client that this consolidation is acceptable from a controls perspective.

---

## Implementation Priority Matrix

| Issue | Priority | Time | Risk | Dependencies |
|-------|----------|------|------|--------------|
| #46 - Customer Salesrep Security | HIGH | 3-4h | Low | None |
| #47 - Hide SuiteApps | MEDIUM | 1-2h | Low | None |
| #48 - Activities Verification | LOW | 1h | None | None (verification only) |
| #49 - Thunderbolt Access | MEDIUM | 2-3h | Medium | Need entity identification |
| #50 - Consolidate Purchasing Roles | MEDIUM | 4-5h | Medium | User migration |
| #51 - Consolidate Accounting Roles | MEDIUM | 4-5h | **HIGH** | User migration + SOD approval |

**Total Time:** 15-20 hours across all issues

---

## Recommended Implementation Order

### Week 1: Quick Wins
1. **Issue #48** - Activities verification (1h) - Complete and document
2. **Issue #47** - Hide SuiteApps (2h) - Low risk, quick implementation
3. **Issue #46** - Customer salesrep security (4h) - High priority, data integrity

### Week 2: Investigation & Role Consolidation Prep
4. **Issue #49** - Thunderbolt investigation (3h) - Need data before proceeding
5. **Issue #50** - Create Purchasing Manager role, test (5h)
6. **Issue #51** - Create Accounting role, test, **GET SOD APPROVAL** (5h)

### Week 3: User Migration
7. **Issue #50** - Execute Purchasing Manager migration (included in Week 2 time)
8. **Issue #51** - Execute Accounting migration (ONLY if SOD approved)

---

## Success Criteria

**Issue #46:**
- ✅ Customer salesrep field is editable ONLY by Administrators and Accountants
- ✅ All other roles see field as disabled/inline
- ✅ Existing transaction workflow continues to work

**Issue #47:**
- ✅ SuiteApps tab hidden from all non-admin roles
- ✅ Administrators can still access SuiteApps
- ✅ No impact on existing SuiteApp functionality

**Issue #48:**
- ✅ Verification complete and documented
- ✅ User guide created for activity filtering
- ✅ Confirmed personalization is working as expected

**Issue #49:**
- ✅ Thunderbolt Motor Sales entity identified
- ✅ Access restricted to authorized users only
- ✅ Unauthorized users cannot view/edit entity
- ✅ Access request procedure documented

**Issue #50:**
- ✅ New Purchasing Manager role created with combined permissions
- ✅ All users migrated successfully
- ✅ No loss of functionality for any user
- ✅ Old roles deactivated

**Issue #51:**
- ✅ New Accounting role created with combined AP + AR permissions
- ✅ **SOD compliance verified and approved**
- ✅ All users migrated with appropriate training
- ✅ No loss of functionality
- ✅ Old roles deactivated

---

## Risk Mitigation

**Issue #46 - Customer Salesrep Security:**
- **Risk:** Workflow conflict or script conflict
- **Mitigation:** Use same pattern as existing transaction workflow, test thoroughly

**Issue #47 - SuiteApps:**
- **Risk:** Developers lose access to needed functionality
- **Mitigation:** Explicitly grant to Developer role if needed

**Issue #49 - Thunderbolt Access:**
- **Risk:** Incorrect entity identification, over/under restriction
- **Mitigation:** Thorough investigation, test with actual users before deployment

**Issue #50 - Purchasing Roles:**
- **Risk:** Users gain unintended permissions
- **Mitigation:** Document all permission changes, test each function, clear communication

**Issue #51 - Accounting Roles:**
- **Risk:** SOD violations, compliance failures
- **Mitigation:** **GET EXPLICIT APPROVAL** from compliance/CFO before implementation
- **Alternative:** Keep roles separate if SOD is required

---

## Next Steps

1. **Immediate Actions:**
   - [ ] Get business approval for role consolidations (Issues #50, #51)
   - [ ] Verify SOD compliance for Issue #51
   - [ ] Identify "Thunderbolt Motor Sales" entity (Issue #49)

2. **Technical Implementation:**
   - [ ] Create workflow for Issue #46 (customer salesrep security)
   - [ ] Update role permissions for Issue #47 (SuiteApps)
   - [ ] Perform activities verification for Issue #48
   - [ ] Create new unified roles for Issues #50 and #51

3. **User Communication:**
   - [ ] Draft user communication for role consolidations
   - [ ] Schedule training sessions for new Accounting role (expanded permissions)
   - [ ] Create user guides for all changes

4. **Deployment:**
   - [ ] Deploy in order of priority matrix
   - [ ] Test each change with real users
   - [ ] Monitor for issues
   - [ ] Document all changes

---

## Questions for Client

Before proceeding with implementation:

1. **Issue #49:** What is "Thunderbolt Motor Sales"? (Subsidiary, Customer, Department, Location?)

2. **Issue #50:** Confirm you want to merge Purchasing Agent + Inventory Manager into single "Purchasing Manager" role?
   - Users will gain expanded permissions
   - Is this acceptable from business perspective?

3. **Issue #51:** **CRITICAL** - Confirm you want to merge AP + AR into single "Accounting" role?
   - AP users will gain ability to process customer payments
   - AR users will gain ability to pay vendor bills
   - Does this violate any SOD requirements?
   - Have you consulted with auditors/compliance?

4. **Issue #46:** Should Accountant (Reviewer) role also be able to edit customer salesrep field?

5. **Issue #47:** Should Developer roles retain access to SuiteApps, or hide completely?

---

**Status:** Ready for client approval and implementation

**Next Agent:** After client approves, implementation can begin with Issue #48 (verification) followed by Issues #46, #47, then #49, #50, #51 pending approvals.
