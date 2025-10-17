# Agent 2: Sales Order Primary Information Issues - Action Plan

**Project:** River-Supply-SB NetSuite UAT Implementation
**Account ID:** 9910981-sb1
**Agent:** Agent 2 - Sales Order Primary Info Expert
**Date Created:** 2025-10-16
**Status:** Action Plan - Ready for Review

---

## Executive Summary

This action plan addresses 8 UAT issues (14-21) related to Sales Order primary information, custom forms, and sales information fields. The plan includes both custom form customization, field removal/hiding, workflow enhancements, and permission-based field locking.

**Key Findings:**
- Issue #18 is **PARTIALLY COMPLETE** - workflow auto-populates salesrep, but field locking for non-admins is not yet implemented
- Most issues require custom form customization (UI configuration)
- Some issues require workflow enhancements or User Event scripts
- No SuiteScript development needed for most issues (configuration only)

---

## Issues Overview

| Issue # | Description | Complexity | Method | Est. Time |
|---------|-------------|------------|---------|-----------|
| 14 | Custom Form auto-default from Customer | Medium | Workflow + Preference | 2-3 hours |
| 15 | Custom Form dropdown filtering | Low | Form customization | 1 hour |
| 16 | Remove Status, Start Date, End Date | Low | Form customization | 30 mins |
| 17 | Memo field usage clarification | Low | Documentation | 30 mins |
| 18 | Sales Info auto-populate + lock | Medium | Workflow enhancement | 2-3 hours |
| 19 | Remove Opportunity field | Low | Form customization | 15 mins |
| 20 | Remove Sales Effective Date | Low | Form customization | 15 mins |
| 21 | Remove Partner field | Low | Form customization | 15 mins |

**Total Estimated Time:** 7-9 hours

---

## Issue #14: Sales Order - Custom Form Auto-Default from Customer

### Issue Analysis

**UAT Request:**
> "Sales Order - Custom Form; Auto default from Customer card"

**Current State:**
- When creating Sales Orders, users must manually select the custom form each time
- Customer records have a "Preferred Transaction Forms" feature that can specify default forms per customer

**Business Impact:**
- Manual form selection is time-consuming
- Risk of using wrong form for customer
- Inconsistent user experience

**Root Cause:**
- Custom form preference not configured at customer level
- System-wide default form may not be set for Sales Order transaction type

### Technical Solution

**Solution 1: Customer-Level Default Form (Preferred)**

**Pros:**
- ✅ Different customers can use different forms
- ✅ Most flexible
- ✅ No code required
- ✅ Standard NetSuite feature

**Cons:**
- ❌ Requires manual setup per customer (or bulk update)
- ❌ Doesn't prevent users from changing form

**Implementation:**
1. **Create/Identify Custom Sales Order Form:**
   - Customization → Forms → Transaction Forms
   - Find existing custom Sales Order form OR create new one
   - Note the Internal ID

2. **Set Default Form at Customer Level (Bulk Update):**
   - Use CSV Import or Mass Update to set "Preferred Transaction Forms" for all customers
   - Field: `custentity_prefform_salesorder` (or similar)

3. **Set System-Wide Default:**
   - Setup → Company → Setup Tasks → Set Preferences
   - Company Preferences → Transactions → Preferred Forms
   - Sales Order = [Your Custom Form]

**Solution 2: User Event Script (If Dynamic Logic Needed)**

Only needed if different customers need different forms based on complex logic (classification, location, etc.)

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'], (record) => {
    function beforeLoad(context) {
        if (context.type !== context.UserEventType.CREATE) return;

        const currentRecord = context.newRecord;
        const customerId = currentRecord.getValue({ fieldId: 'entity' });

        if (!customerId) return;

        // Load customer to get preferred form
        const customerRec = record.load({
            type: record.Type.CUSTOMER,
            id: customerId
        });

        const preferredForm = customerRec.getValue({
            fieldId: 'custentity_prefform_salesorder'
        });

        if (preferredForm) {
            currentRecord.setValue({
                fieldId: 'customform',
                value: preferredForm
            });
        }
    }

    return { beforeLoad };
});
```

### Implementation Method

**Phase 1: Configuration (Recommended First)**

```bash
# Step 1: Identify or create custom Sales Order form
1. Log into River-Supply-SB NetSuite
2. Customization → Forms → Transaction Forms
3. Find "Custom Sales Order" form (or create new)
4. Note Internal ID (e.g., "102" or "customform_salesorder")

# Step 2: Set system-wide default
1. Setup → Company → Setup Tasks → Set Preferences
2. Company Preferences → Transactions tab
3. Preferred Forms section
4. Sales Order dropdown = [Your Custom Form]
5. Save

# Step 3: Test
1. Create new Sales Order
2. Verify custom form is pre-selected
```

**Phase 2: Customer-Level Customization (Optional)**

```bash
# Only if different customers need different forms

# Step 1: Add custom field to Customer record (if not exists)
1. Customization → Lists, Records & Fields → Entity Fields → New
2. Label: "Preferred Sales Order Form"
3. ID: custentity_prefform_salesorder
4. Type: List/Record (Transaction Forms)
5. Applies To: Customer
6. Save

# Step 2: Bulk update customers
1. Lists → Relationships → Customers
2. Select customers
3. Mass Update → Preferred Sales Order Form = [Custom Form]
4. Submit
```

**Phase 3: User Event Script (If Needed)**

```bash
# Only if dynamic logic required

cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\River-Supply-SB"

# Create script file
# src/FileCabinet/SuiteScripts/River_UE_SalesOrder_DefaultForm.js

# Create script record
# Customization → Scripting → Scripts → New
# Upload file, configure deployments

# Test with various customers
```

### Validation Needs

**Test Cases:**

| Test # | Scenario | Expected Result | Pass/Fail |
|--------|----------|-----------------|-----------|
| 1 | Create SO without selecting customer | System default form loads | |
| 2 | Create SO, select customer | Customer's preferred form loads | |
| 3 | Change customer on existing SO | Form updates to new customer's preferred form | |
| 4 | Create SO for customer without preferred form | System default form loads | |
| 5 | User manually changes form | Manual selection persists | |

**Validation Checklist:**
- [ ] System-wide default form configured
- [ ] Custom form is active and published
- [ ] All standard SO fields present on custom form
- [ ] Form works for all user roles
- [ ] Form displays correctly in view/edit mode
- [ ] Print templates work with custom form

### Dependencies

**Prerequisites:**
- Custom Sales Order form must exist (or be created)
- Form must be active and published
- Form must include all required fields
- If using customer-level preferences:
  - Custom entity field created
  - Customers updated with preferred form
- If using User Event script:
  - SuiteScript 2.1 development environment
  - Script deployment permissions

**Related Issues:**
- Issue #15 (Custom Form dropdown) - ensures only custom forms appear
- Issue #18 (Sales Info auto-populate) - works with any form

### Priority & Time Estimate

**Priority:** HIGH
- Directly impacts user efficiency
- Affects every Sales Order creation
- Requested by client

**Complexity:** MEDIUM
- Configuration approach: Simple
- Script approach: Medium

**Time Estimate:**

**Configuration Only:**
- Setup: 1 hour
- Testing: 1 hour
- Documentation: 30 mins
- **Total: 2.5 hours**

**With User Event Script:**
- Setup + Script development: 2 hours
- Testing: 1 hour
- Documentation: 30 mins
- **Total: 3.5 hours**

**Recommended Approach:** Start with configuration-only approach (Phase 1), test with users, add script only if dynamic logic needed.

---

## Issue #15: Sales Order - Custom Form Dropdown Filtering

### Issue Analysis

**UAT Request:**
> "Sales Order - Custom Form; Drop down includes Stnd and Custom"

**Current State:**
- Custom Form dropdown on Sales Orders shows ALL available forms:
  - Standard NetSuite forms
  - Custom forms created for this account
- Users can accidentally select wrong form
- Cluttered dropdown with 10+ options

**Business Impact:**
- User confusion - too many choices
- Risk of selecting wrong form (standard instead of custom)
- Inconsistent form usage across organization
- Training complexity

**Root Cause:**
- NetSuite displays all active forms by default
- Standard forms cannot be fully hidden (NetSuite limitation)
- Form filtering requires configuration at form level

### Technical Solution

**Solution 1: Make Custom Form "Preferred" (Recommended)**

**Pros:**
- ✅ Custom forms appear first in dropdown
- ✅ Standard forms moved to bottom/hidden
- ✅ No code required
- ✅ Standard NetSuite feature

**Cons:**
- ❌ Standard forms still visible (can't be fully removed)
- ❌ Requires form-by-form configuration

**Implementation:**
1. Set custom form as "Preferred"
2. Mark standard forms as inactive (if not used elsewhere)
3. Configure form roles/permissions

**Solution 2: Role-Based Form Restrictions**

**Pros:**
- ✅ Restrict which forms each role can see
- ✅ Better security
- ✅ Reduces dropdown clutter

**Cons:**
- ❌ Must configure per role
- ❌ Administrators always see all forms
- ❌ More complex to maintain

**Solution 3: Client Script Filtering (Not Recommended)**

While possible, NetSuite discourages this approach as it can cause UI issues and doesn't work on mobile.

### Implementation Method

**Phase 1: Configure Form Preferences (Recommended)**

```bash
# Step 1: Review all Sales Order forms
1. Log into River-Supply-SB NetSuite
2. Customization → Forms → Transaction Forms
3. Filter: Record Type = Sales Order
4. Review list of all forms

# Step 2: Configure custom form as preferred
1. Open your custom Sales Order form
2. Check "Preferred" checkbox
3. Save

# Step 3: Deactivate or restrict standard forms
For each standard form NOT needed:
1. Open standard form
2. Either:
   a) Mark as "Inactive" (if not used elsewhere)
   OR
   b) Remove roles that shouldn't see it

# Step 4: Set system default (ties to Issue #14)
1. Setup → Company → Preferences
2. Transactions → Preferred Forms
3. Sales Order = [Your Custom Form]
4. Save
```

**Phase 2: Role-Based Restrictions**

```bash
# Only if you want different forms for different roles

# Step 1: Edit custom form
1. Customization → Forms → Transaction Forms → [Your Custom Form]
2. Access tab
3. Roles section - Add specific roles that should see this form
4. Save

# Step 2: Edit standard forms
1. Open each standard form
2. Access tab
3. Remove roles that shouldn't use standard forms
4. Leave only Administrator role
5. Save

# Step 3: Test per role
1. Log in as different roles:
   - Sales Rep
   - Accounting
   - Inventory Manager
2. Try creating Sales Order
3. Verify dropdown shows only permitted forms
```

**Phase 3: Document Form Purpose**

```bash
# Create documentation for which form to use when

# If you end up with multiple forms, document:
- "Custom Sales Order - Standard" - Use for most customers
- "Custom Sales Order - International" - Use for international customers
- "Standard Sales Order" - DO NOT USE (legacy)
```

### Validation Needs

**Test Cases:**

| Test # | Scenario | Expected Result | Pass/Fail |
|--------|----------|-----------------|-----------|
| 1 | Sales Rep creates SO | Dropdown shows only custom form(s) | |
| 2 | Accountant creates SO | Dropdown shows only custom form(s) | |
| 3 | Administrator creates SO | Dropdown shows all forms (expected) | |
| 4 | View existing SO | Correct form displayed | |
| 5 | Edit existing SO | Form doesn't change | |

**Validation Checklist:**
- [ ] Custom form marked as "Preferred"
- [ ] Standard forms inactive or role-restricted
- [ ] All non-admin roles see only custom forms
- [ ] Administrators can still access all forms
- [ ] Existing SOs still open correctly
- [ ] Form dropdown has <5 options for end users

### Dependencies

**Prerequisites:**
- Issue #14 completed (custom form identified/created)
- Custom form fully configured with all fields
- All roles identified and documented
- Permission requirements documented

**Related Issues:**
- Issue #14 (Form auto-default) - sets which form loads by default
- All other Issues 16-21 - require custom form to be configured

**Blocking Issues:**
- None - can be done independently

### Priority & Time Estimate

**Priority:** MEDIUM
- Quality-of-life improvement
- Reduces user error
- Not blocking other functionality

**Complexity:** LOW
- Pure configuration
- No code required
- Standard NetSuite features

**Time Estimate:**
- Form configuration: 30 mins
- Role testing: 30 mins
- Documentation: 15 mins
- **Total: 1 hour 15 mins**

**Recommended Approach:** Configure as part of Issue #14 implementation.

---

## Issue #16: Sales Order - Remove Status, Start Date & End Date

### Issue Analysis

**UAT Request:**
> "Sales Order - Status, Start Date & End Date; Remove"

**Current State:**
- Sales Order form displays three fields in primary info:
  - **Status** - Shows approval workflow status (Pending Approval, Approved, etc.)
  - **Start Date** - Optional date field (rarely used)
  - **End Date** - Optional date field (rarely used)
- These fields take up screen space
- Users find them confusing or irrelevant

**Business Impact:**
- Cluttered UI distracts from important fields
- Users ask what these fields are for
- Start/End dates not used in client's business process
- Status field may be needed for approval workflows (INVESTIGATE)

**Root Cause:**
- Standard Sales Order form includes these fields by default
- Fields serve specific purposes in some businesses but not all

**Critical Question:**
⚠️ **Status field may be REQUIRED for approval workflows.** Need to verify:
- Does River-Supply-SB use Sales Order approval workflows?
- Is Issue #40 related? ("Sales Order - Supervisor Approval")
- Check with client before removing Status field

### Technical Solution

**Solution: Custom Form Field Removal/Hiding**

**Pros:**
- ✅ Simple configuration change
- ✅ No code required
- ✅ Reversible
- ✅ Can hide fields instead of removing

**Cons:**
- ❌ Status field may be needed for workflows
- ❌ Fields still exist in database (just hidden)

**Implementation Options:**

**Option 1: Hide Fields (Recommended)**
- Fields remain on form but hidden
- Can be shown for specific roles if needed
- Easier to reverse

**Option 2: Remove Fields from Form**
- Fields not displayed at all
- Cleaner configuration
- Harder to reverse if needed

**Status Field Decision Tree:**

```
Does River-Supply-SB use approval workflows for Sales Orders?
│
├─ YES → Keep Status field, hide Start/End Date only
│         OR configure Status for specific roles only
│
└─ NO → Hide all three fields (Status, Start Date, End Date)
```

### Implementation Method

**Phase 1: Investigation (REQUIRED FIRST)**

```bash
# Step 1: Check for approval workflows
1. Log into River-Supply-SB NetSuite
2. Customization → Workflow → Workflows
3. Filter: Record Type = Sales Order
4. Look for workflows with approval states
5. Document findings

# Step 2: Check Purchase Order issue
1. Review Issue #50: "Purchase Order - Supervisor Approval"
2. Determine if same applies to Sales Orders
3. Consult with client/stakeholders

# Step 3: Decision
IF approval workflows exist OR planned:
   → Hide Start Date and End Date only (keep Status)
ELSE:
   → Hide all three fields
```

**Phase 2: Custom Form Configuration**

```bash
# Step 1: Open custom Sales Order form
1. Customization → Forms → Transaction Forms
2. Find custom Sales Order form
3. Edit

# Step 2: Find fields in Screen Fields tab
1. Screen Fields tab
2. Primary Information subtab (or Main subtab)
3. Locate:
   - Status
   - Start Date (trandate_start)
   - End Date (trandate_end)

# Step 3: Hide fields
For each field to hide:
1. Find field in list
2. Uncheck "Show" checkbox
   OR
3. Remove from form entirely
4. Save

# Alternative: Role-specific visibility
If Status needed for managers but not sales reps:
1. Custom Fields tab
2. Add conditional display rules
3. Show Status only for Administrator, Accounting roles
4. Hide for Sales, Inventory roles
```

**Phase 3: Testing**

```bash
# Test 1: View existing Sales Order
1. Open existing Sales Order
2. Verify fields are hidden
3. Verify form still functions correctly

# Test 2: Create new Sales Order
1. Create new Sales Order
2. Verify hidden fields don't appear
3. Verify all other fields work correctly
4. Save successfully

# Test 3: Edit existing Sales Order
1. Edit Sales Order
2. Make changes to visible fields
3. Save
4. Verify hidden fields weren't affected

# Test 4: Approval workflow (if applicable)
1. Create Sales Order requiring approval
2. Submit for approval
3. Verify approval process works without Status field visible
4. Check backend: Status value still updates correctly
```

### Validation Needs

**Pre-Implementation Validation:**
- [ ] Approval workflows identified (Y/N)
- [ ] Status field requirements documented
- [ ] Client approval obtained for field removal
- [ ] Backup of form configuration created

**Post-Implementation Validation:**

| Test # | Scenario | Expected Result | Pass/Fail |
|--------|----------|-----------------|-----------|
| 1 | View existing SO | Hidden fields don't appear | |
| 2 | Create new SO | Hidden fields don't appear | |
| 3 | Edit SO | Form saves correctly | |
| 4 | SO approval (if applicable) | Approval workflow functions | |
| 5 | SO status changes | Backend status updates correctly | |
| 6 | Print SO | Hidden fields don't print | |
| 7 | Export SO data | Hidden fields still exportable (if needed) | |

**Validation Checklist:**
- [ ] All hidden fields confirmed with client
- [ ] Status field need verified (approval workflows)
- [ ] All user roles tested
- [ ] Existing SOs display correctly
- [ ] New SOs save correctly
- [ ] Print templates updated (if needed)
- [ ] Reports don't break (that may reference these fields)

### Dependencies

**Prerequisites:**
- Issue #14 completed (custom form created)
- Issue #15 completed (custom form is default)
- Approval workflow requirements documented
- Client sign-off on field removal

**Related Issues:**
- Issue #50 (PO Supervisor Approval) - may indicate approval workflow pattern
- All Sales Order issues - use same custom form

**Blocking Issues:**
- Must complete investigation phase before implementation
- Cannot proceed without client approval

### Priority & Time Estimate

**Priority:** LOW
- UI cleanup only
- Not blocking functionality
- Can be done later

**Complexity:** LOW
- Simple form configuration
- May require investigation time

**Time Estimate:**
- Investigation (workflows): 30 mins
- Form configuration: 15 mins
- Testing: 30 mins
- Documentation: 15 mins
- **Total: 1.5 hours**

**Recommended Approach:**
1. Complete investigation first (check workflows)
2. Get client approval on what to hide
3. Configure custom form
4. Test thoroughly if approval workflows exist

---

## Issue #17: Sales Order - Memo Field Usage Clarification

### Issue Analysis

**UAT Request:**
> "Sales Order - Memo; where does this show. Is it printed?"

**Current State:**
- Sales Order has a "Memo" field (standard NetSuite field)
- Users don't understand where memo appears or its purpose
- Unknown if memo prints on Sales Order PDF
- May be confused with other note/comment fields

**Business Impact:**
- Users unsure what to enter in Memo field
- Risk of entering wrong information in wrong field
- Possible duplicate information entry
- Lack of training/documentation

**Root Cause:**
- Memo field purpose not documented
- No clear guidance on when to use Memo vs. other fields
- Print behavior not tested

**Key Questions to Answer:**
1. Where does Memo display? (Form, list view, reports)
2. Does Memo print on Sales Order PDF?
3. What's the difference between Memo and other note fields?
4. What should users put in Memo field?

### Technical Solution

**Solution: Documentation + Testing (No Configuration Change)**

This is not a configuration issue - it's a documentation/training issue.

**Approach:**
1. Test Memo field behavior comprehensively
2. Document findings
3. Create user guidance
4. Optionally rename field or add help text

**Testing Plan:**

| Test | What to Verify | Method |
|------|---------------|---------|
| 1 | Memo displays on form | View SO, check if Memo visible |
| 2 | Memo displays in list view | Lists → Sales Orders, check columns |
| 3 | Memo prints on PDF | Print SO to PDF, search for memo text |
| 4 | Memo appears in email | Email SO, check if memo included |
| 5 | Memo in saved search | Create search, add Memo column |
| 6 | Memo vs. other fields | Compare Memo to Message, Comments |

### Implementation Method

**Phase 1: Comprehensive Testing**

```bash
# Test 1: Create test Sales Order with distinctive memo
1. Log into River-Supply-SB NetSuite
2. Create new Sales Order
3. Enter unique text in Memo: "TEST MEMO - DO NOT SHIP"
4. Save

# Test 2: Check form display
1. View saved Sales Order
2. Note where Memo appears:
   - Primary Info section?
   - Other section?
   - Separate tab?
3. Take screenshot

# Test 3: Check list view
1. Lists → Transactions → Sales Orders
2. Check if Memo column exists
3. If not, customize view to add Memo
4. Verify memo text displays

# Test 4: Check PDF print
1. Open test Sales Order
2. Print → Save as PDF
3. Open PDF, search for "TEST MEMO"
4. Document: YES/NO - Memo prints
5. If YES: Note location on PDF

# Test 5: Check email
1. Open test Sales Order
2. Send → Email
3. Check email preview
4. Document: YES/NO - Memo in email
5. If YES: Note location

# Test 6: Compare to other fields
Create comparison table:

Field Name | Location | Prints? | Emails? | Purpose
-----------|----------|---------|---------|--------
Memo       | ?        | ?       | ?       | ?
Message    | ?        | ?       | ?       | ?
Comments   | ?        | ?       | ?       | ?
```

**Phase 2: Document Findings**

Create user guide document:

```markdown
# Sales Order Memo Field - User Guide

## What is the Memo Field?

[Description based on testing]

## Where Does Memo Appear?

- ✅ Sales Order form: [Location]
- ✅ List views: [Yes/No]
- ✅ PDF printout: [Yes/No - Location]
- ✅ Email: [Yes/No - Location]
- ✅ Reports: [Yes/No]

## When to Use Memo

Use Memo field for:
- [Use case 1]
- [Use case 2]
- [Use case 3]

Do NOT use Memo for:
- [Anti-use case 1]
- [Anti-use case 2]

## Memo vs. Other Fields

| Use This Field | When You Need To |
|----------------|------------------|
| Memo | [Purpose] |
| Message | [Purpose] |
| Comments | [Purpose] |
| Line-level Comments | [Purpose] |

## Examples

**Good Memo Examples:**
- "Customer requested expedited shipping"
- "Ship only after payment received"
- "Call customer before shipping"

**Bad Memo Examples:**
- "Thanks for your order!" (use Message instead)
- "Item A - rush, Item B - standard" (use line comments instead)
```

**Phase 3: Optional Form Customization**

```bash
# Option 1: Add help text to field
1. Customization → Forms → Transaction Forms → [Custom SO Form]
2. Find Memo field
3. Add "Help Text": "Internal notes - prints on packing slip but not customer PDF"
4. Save

# Option 2: Rename field label
1. Same form editor
2. Find Memo field
3. Change Label to something more descriptive:
   - "Internal Notes"
   - "Shipping Instructions"
   - "Order Notes (Prints on PDF)"
4. Save

# Option 3: Hide Memo field if not needed
1. If testing reveals Memo is redundant
2. Hide field on custom form
3. Use Message or Comments instead
```

**Phase 4: User Training**

```bash
# Create training materials
1. Document findings in user guide
2. Add screenshots showing where Memo appears
3. Provide examples of good Memo content
4. Train users on when to use each field

# Add to onboarding
1. Include in new user training
2. Add to quick reference guide
3. Post in company wiki/documentation
```

### Validation Needs

**Testing Checklist:**

- [ ] Memo visible on Sales Order form (location documented)
- [ ] Memo appears in list views (or documented as not shown)
- [ ] Memo behavior on PDF print tested and documented
- [ ] Memo behavior in email tested and documented
- [ ] Memo appears in saved searches (confirmed)
- [ ] Comparison to Message field completed
- [ ] Comparison to Comments field completed
- [ ] User guide created with screenshots
- [ ] Examples provided for users

**Documentation Deliverables:**

1. **Sales Order Field Guide** (PDF/Markdown)
   - Purpose of each note field
   - Where each field appears
   - What prints/emails
   - When to use which field

2. **Quick Reference Card** (1-page)
   - Simple decision tree: "Which field should I use?"
   - Common examples

3. **Form Help Text** (in NetSuite)
   - Added to Memo field
   - Clear, concise guidance

### Dependencies

**Prerequisites:**
- Custom Sales Order form configured
- Access to print templates
- Sample test data (customer, items)

**Related Issues:**
- Issue #33 (Communication tab) - may reveal other note/messaging fields
- Issue #34 (Custom fields) - may reveal additional custom note fields

**Blocking Issues:**
- None - pure testing and documentation

### Priority & Time Estimate

**Priority:** LOW
- Documentation/training issue
- Not blocking functionality
- Can be done anytime

**Complexity:** LOW
- Testing only
- No configuration changes
- Documentation work

**Time Estimate:**
- Testing: 1 hour
- Documentation creation: 1 hour
- User guide with screenshots: 1 hour
- Form help text (optional): 15 mins
- **Total: 3 hours 15 mins**

**Recommended Approach:**
1. Complete testing phase immediately
2. Document findings
3. Present to client/users for feedback
4. Create final user guide based on feedback

---

## Issue #18: Sales Order - Sales Info Auto-Populate and Lock

### Issue Analysis

**UAT Request:**
> "Sales Order - Sales Info; This should auto populate from customer card and cannot be changed."

**Current State:**
- ✅ **PARTIALLY COMPLETE** - Workflow auto-populates Sales Rep from customer
- ❌ **NOT COMPLETE** - Field locking for non-admins not implemented
- Workflow files exist:
  - `customworkflow_salesorder_salesrep_auto.xml`
  - Ready for deployment per FINAL-WORKFLOW-STATUS.md

**Business Impact:**
- ✅ Auto-population reduces manual entry errors
- ✅ Ensures correct sales rep assignment
- ❌ Risk: Non-admins can change sales rep (violates Issue #40)
- ❌ Risk: Sales rep changes not tracked/audited

**Root Cause:**
- Workflow implements auto-population only
- Field locking not supported in XML workflow format
- Must be added via NetSuite UI or User Event script

**Related Requirements:**
- Issue #40: "Sales Reps assigned to customers can only be changed by administrators and accounting"
- This requirement applies to BOTH customer records AND transactions

### Technical Solution

**Current Implementation (Existing Workflow):**

File: `customworkflow_salesorder_salesrep_auto.xml`
- Trigger: BEFORELOAD (when form loads)
- Action: Set Sales Rep from `{entity.salesrep}` formula
- Works when: Creating or editing Sales Order
- Updates when: Customer changes

**Missing Implementation: Field Locking**

**Solution 1: Workflow Field Locking (Recommended - Simplest)**

Add field locking action to existing workflow via NetSuite UI:

**Pros:**
- ✅ Leverages existing workflow
- ✅ No code required
- ✅ Role-based conditions supported
- ✅ Easy to test and modify

**Cons:**
- ❌ Cannot be configured via XML/SDF
- ❌ Must configure in NetSuite UI
- ❌ Harder to version control

**Solution 2: User Event Script (Recommended - Most Flexible)**

Create SuiteScript to lock field based on role:

**Pros:**
- ✅ Full programmatic control
- ✅ Complex logic supported (role-based, customer-based, etc.)
- ✅ Version controlled via SDF
- ✅ Easy to extend later

**Cons:**
- ❌ Requires SuiteScript development
- ❌ Governance units (minimal for this use case)
- ❌ More testing required

**Solution 3: Form-Level Field Permissions (Limited)**

Configure field permissions on custom form:

**Pros:**
- ✅ Simple configuration
- ✅ No code required

**Cons:**
- ❌ Limited role-based control
- ❌ All-or-nothing (field read-only for all or none)
- ❌ Doesn't allow admin override easily

**Recommended Approach: Combination of Workflow + User Event Script**

1. ✅ Keep existing workflow for auto-population
2. ✅ Add User Event script for role-based field locking
3. ✅ Lock for all roles EXCEPT Administrator and Accounting

### Implementation Method

**Phase 1: Deploy Existing Workflow (If Not Already Deployed)**

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\River-Supply-SB"

# Step 1: Validate project
npx suitecloud project:validate
# Expected: Field reference errors (normal - ignore)

# Step 2: Deploy workflow
npx suitecloud project:deploy --scriptid customworkflow_salesorder_salesrep_auto

# Step 3: Verify in NetSuite
1. Log into River-Supply-SB
2. Customization → Workflow → Workflows
3. Find "Auto-Set Sales Rep from Customer - Sales Order"
4. Verify Status = Active, Released

# Step 4: Test auto-population
1. Create new Sales Order
2. Select customer with sales rep
3. Verify Sales Rep field auto-populates
```

**Phase 2: Add Field Locking via User Event Script**

```bash
# Step 1: Create User Event script file
```

Create file: `src/FileCabinet/SuiteScripts/River_UE_SalesOrder_LockSalesRep.js`

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/**
 * River Supply - Sales Order Sales Rep Field Locking
 *
 * Purpose: Lock Sales Rep field for non-admin roles
 * Issue: UAT #18 - Sales Info should auto-populate and cannot be changed
 *
 * Business Rules:
 * - Sales Rep auto-populates from customer (handled by workflow)
 * - Only Administrator and Accounting roles can change Sales Rep
 * - All other roles: field is read-only
 */

define(['N/runtime', 'N/ui/serverWidget'], function(runtime, serverWidget) {

    /**
     * BeforeLoad event - Lock Sales Rep field for non-admin roles
     */
    function beforeLoad(context) {
        try {
            // Only lock on edit/view, not create (workflow handles create)
            if (context.type === context.UserEventType.CREATE) {
                return; // Workflow auto-populates on create
            }

            const currentUser = runtime.getCurrentUser();
            const userRole = currentUser.role;
            const userRoleId = currentUser.roleId;

            // Define roles that CAN edit Sales Rep
            const ALLOWED_ROLES = [
                3,  // Administrator
                1001, // Custom: River Accounting (check actual ID)
            ];

            // Define role names that CAN edit (alternative check)
            const ALLOWED_ROLE_NAMES = [
                'administrator',
                'accountant',
                'customrole_river_ar',
                'customrole_river_ap'
            ];

            // Check if user role is allowed to edit
            const canEdit = ALLOWED_ROLES.includes(userRole) ||
                          ALLOWED_ROLE_NAMES.includes(userRoleId.toLowerCase());

            if (!canEdit) {
                // Lock Sales Rep field for this user
                const form = context.form;
                const salesRepField = form.getField({
                    id: 'salesrep'
                });

                if (salesRepField) {
                    salesRepField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.INLINE
                    });

                    // Optional: Add help text explaining why field is locked
                    salesRepField.setHelpText({
                        help: 'Sales Rep is set from Customer record. Contact Administrator to change.'
                    });
                }
            }

        } catch (e) {
            log.error({
                title: 'Error in beforeLoad - Lock Sales Rep',
                details: e.message
            });
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
```

```bash
# Step 2: Deploy script file via SDF
npx suitecloud file:upload --paths /SuiteScripts/River_UE_SalesOrder_LockSalesRep.js

# Step 3: Create Script record in NetSuite
1. Log into River-Supply-SB
2. Customization → Scripting → Scripts → New
3. Click "+" to upload script file
4. Select River_UE_SalesOrder_LockSalesRep.js
5. Save

# Step 4: Configure Script Deployments
1. Scripts → [Your Script] → Deployments → New
2. Settings:
   - Applies To: Sales Order
   - Status: Testing (initially)
   - Log Level: Debug (initially)
   - Execute as Role: Administrator
   - Deployed: All Roles (script handles role checking)
3. Save

# Step 5: Test with different roles
```

**Phase 3: Update Workflow (Optional - Add Field Locking Action)**

Alternative to User Event script - add via NetSuite UI:

```bash
# Only do this if you prefer workflow approach over script

1. Log into NetSuite
2. Customization → Workflow → Workflows
3. Open "Auto-Set Sales Rep from Customer - Sales Order"
4. Edit State
5. Add new action: Lock Field
6. Configure:
   - Field: Sales Rep
   - Unlock for Roles: Administrator, Accounting
7. Save workflow
8. Test
```

**Phase 4: Role ID Discovery**

```bash
# Need to find actual role IDs for River-Supply-SB

# Method 1: Via UI
1. Setup → Users/Roles → Manage Roles
2. Click each custom role
3. Note Internal ID from URL (e.g., customrole_river_ar)

# Method 2: Via SuiteQL
1. Run query:
   SELECT id, name, scriptid
   FROM role
   WHERE isinactive = 'F'
   ORDER BY name

# Method 3: Via REST API
node -p "
const script = require('./test-netsuite-api.js');
// Add query for roles
"

# Method 4: Check existing role files
cat src/Objects/customrole_river_*.xml | grep scriptid
```

### Validation Needs

**Pre-Deployment Validation:**
- [ ] Existing workflow deployed and tested
- [ ] Role IDs identified for Administrator and Accounting
- [ ] Script syntax validated
- [ ] Script file uploaded to FileCabinet

**Post-Deployment Testing:**

| Test # | Role | Action | Expected Result | Pass/Fail |
|--------|------|--------|-----------------|-----------|
| 1 | Sales Rep | Create SO, select customer | Sales Rep auto-fills | |
| 2 | Sales Rep | Try to change Sales Rep | Field is read-only | |
| 3 | Administrator | Create SO | Sales Rep auto-fills | |
| 4 | Administrator | Change Sales Rep | Change allowed | |
| 5 | Accounting | Create SO | Sales Rep auto-fills | |
| 6 | Accounting | Change Sales Rep | Change allowed | |
| 7 | Inventory Mgr | Create SO | Sales Rep auto-fills | |
| 8 | Inventory Mgr | Try to change Sales Rep | Field is read-only | |
| 9 | Any role | Change customer | Sales Rep updates | |
| 10 | Admin | Override Sales Rep | Override saved | |

**Additional Validation:**

- [ ] Script executes without errors (check script logs)
- [ ] Governance units <10 per execution
- [ ] Performance: Page load time not impacted
- [ ] Mobile app: Field locking works on mobile
- [ ] Saved Searches: Sales Rep field still searchable
- [ ] Reports: Sales Rep field still reportable
- [ ] Mass Update: Admin can still mass-update Sales Rep

**Testing Checklist:**
- [ ] All user roles tested (6+ roles)
- [ ] Create, Edit, View scenarios tested
- [ ] Customer change scenario tested
- [ ] Manual override by admin tested
- [ ] Script error logging verified
- [ ] Workflow execution log reviewed
- [ ] No conflicts between workflow and script
- [ ] Help text displays correctly

### Dependencies

**Prerequisites:**
- ✅ Workflow already created (customworkflow_salesorder_salesrep_auto.xml)
- ✅ Workflow files ready to deploy
- Custom Sales Order form configured (Issue #14)
- Role IDs identified
- SuiteScript development environment ready

**Related Issues:**
- Issue #40: "Sales Reps assigned to customers can only be changed by administrators and accounting"
  - Same role restrictions apply
  - May need similar script for Customer record
- Issue #29: "Sales Order - Billing; Terms should pull over from the customer card and view only"
  - Similar pattern (auto-populate + lock)
  - Can use same script approach

**Blocking Issues:**
- Workflow must be deployed before script (or configure script to handle auto-population too)

### Priority & Time Estimate

**Priority:** HIGH
- Already partially implemented (workflow ready)
- Critical business requirement (Issue #40 compliance)
- Prevents unauthorized sales rep changes
- Client explicitly requested

**Complexity:** MEDIUM
- Workflow deployment: Simple (already done)
- User Event script: Medium complexity
- Role-based logic: Standard pattern
- Testing: Moderate (multiple roles)

**Time Estimate:**

**Workflow Deployment (if not done):**
- Deploy: 15 mins
- Test: 30 mins
- **Subtotal: 45 mins**

**User Event Script Development:**
- Script development: 1.5 hours
- Role ID discovery: 30 mins
- Script deployment: 30 mins
- Testing (all roles): 2 hours
- Documentation: 30 mins
- **Subtotal: 5 hours**

**Total: 5.75 hours (5 hours 45 mins)**

**Recommended Approach:**
1. Deploy workflow first (if not already deployed)
2. Test workflow auto-population thoroughly
3. Develop and deploy User Event script for field locking
4. Test both together (workflow + script)
5. Monitor script execution logs for first 48 hours

---

## Issue #19: Sales Order - Remove Opportunity Field

### Issue Analysis

**UAT Request:**
> "Sales Order - Sales Info; remove Opportunity"

**Current State:**
- Sales Order form includes "Opportunity" field in Sales Info section
- Field allows linking Sales Order to an Opportunity record
- NetSuite CRM feature - tracks sales pipeline
- Client doesn't use Opportunity functionality

**Business Impact:**
- Unused field clutters UI
- Users confused about purpose
- No value to client's business process
- Takes up screen space

**Root Cause:**
- Standard NetSuite field included on all Sales Order forms by default
- Part of NetSuite CRM functionality
- Not relevant for clients who don't use CRM features

**Note:** This is a common customization request from clients who don't use NetSuite CRM/Sales Pipeline features.

### Technical Solution

**Solution: Hide Field on Custom Form**

**Pros:**
- ✅ Simple configuration change
- ✅ No code required
- ✅ Reversible if client starts using Opportunities
- ✅ Takes 2 minutes

**Cons:**
- ❌ Field still exists in database
- ❌ Visible to admins (standard form)

**Implementation:**
- Edit custom Sales Order form
- Hide Opportunity field in Screen Fields tab
- Save and test

### Implementation Method

```bash
# Step 1: Edit custom Sales Order form
1. Log into River-Supply-SB NetSuite
2. Customization → Forms → Transaction Forms
3. Find custom Sales Order form (from Issue #14)
4. Click Edit

# Step 2: Locate Opportunity field
1. Screen Fields tab
2. Find "Sales" subtab or "Main" subtab
3. Scroll to find "Opportunity" field
4. Note: Field ID is typically "opportunity"

# Step 3: Hide field
1. Find Opportunity in field list
2. Uncheck "Show" checkbox
3. Alternative: Remove from form layout entirely
4. Save form

# Step 4: Test
1. Create new Sales Order
2. Verify Opportunity field doesn't appear
3. Check that all other Sales Info fields still visible:
   - Sales Rep ✓
   - Lead Source ✓
   - Class ✓
   - Department ✓
   - Location ✓
4. Save successfully

# Step 5: Verify existing Sales Orders
1. Open existing Sales Order
2. Verify Opportunity field hidden
3. Verify no errors
4. If any SOs have Opportunity linked, verify link still exists (just hidden)
```

**Screenshot for Reference:**

```
Sales Order Form Editor → Screen Fields Tab

Fields in "Sales" Section:
☑ Sales Rep
☐ Opportunity         <-- UNCHECK THIS
☐ Sales Effective Date  <-- Also uncheck (Issue #20)
☐ Partner              <-- Also uncheck (Issue #21)
☑ Lead Source
☑ Class
☑ Department
☑ Location
```

### Validation Needs

**Test Cases:**

| Test # | Scenario | Expected Result | Pass/Fail |
|--------|----------|-----------------|-----------|
| 1 | Create new SO | Opportunity field not visible | |
| 2 | Edit existing SO | Opportunity field not visible | |
| 3 | SO with existing Opportunity link | Hidden, link preserved in DB | |
| 4 | View SO | Opportunity field not visible | |
| 5 | Print SO to PDF | Opportunity field not printed | |

**Validation Checklist:**
- [ ] Opportunity field hidden on custom form
- [ ] Other Sales Info fields still visible
- [ ] Existing SOs with Opportunity links still function
- [ ] No errors when saving SO
- [ ] Print template doesn't break
- [ ] Saved searches still work (if any reference Opportunity)

### Dependencies

**Prerequisites:**
- Issue #14 completed (custom form created and set as default)
- Custom form is active and published

**Related Issues:**
- Issue #20 (Remove Sales Effective Date) - same section, same method
- Issue #21 (Remove Partner) - same section, same method
- **Can be done together in one form edit session**

**Blocking Issues:**
- None - standalone configuration change

### Priority & Time Estimate

**Priority:** LOW
- UI cleanup only
- Not blocking functionality
- Can be batched with #20, #21

**Complexity:** LOW
- Simple checkbox change
- No code required
- Standard procedure

**Time Estimate:**
- Form configuration: 5 mins
- Testing: 10 mins
- **Total: 15 mins**

**Recommended Approach:**
Combine with Issues #20 and #21 - do all three field removals in one form edit session (total 30 mins for all three).

---

## Issue #20: Sales Order - Remove Sales Effective Date

### Issue Analysis

**UAT Request:**
> "Sales Order - Sales Info; remove Sales Effective Date"

**Current State:**
- Sales Order form includes "Sales Effective Date" field in Sales Info section
- Field used to track when sales credit is effective (for commission tracking)
- Client doesn't use commission tracking via NetSuite
- Field is optional and rarely populated

**Business Impact:**
- Unused field clutters UI
- Users confused about purpose vs. order date
- No value to client's business process

**Root Cause:**
- Standard NetSuite field for commission management
- Not relevant for clients who manage commissions externally

### Technical Solution

**Solution: Hide Field on Custom Form**

Same approach as Issue #19 - simple field hiding.

**Note:** Sales Effective Date is different from:
- **Order Date** (trandate) - Date of order (keep this)
- **Start Date** (from Issue #16) - Project/recurring date (removing)
- **Ship Date** - Date shipped (keep this)

Make sure to hide the correct field.

### Implementation Method

```bash
# Step 1: Edit custom Sales Order form
1. Customization → Forms → Transaction Forms
2. Open custom Sales Order form
3. Edit

# Step 2: Locate Sales Effective Date field
1. Screen Fields tab
2. Sales Info section
3. Find "Sales Effective Date" field
   - Field ID: saleseffectivedate
   - Sometimes labeled "Eff. Date"

# Step 3: Hide field
1. Uncheck "Show" checkbox
2. Save form

# Step 4: Test (same as Issue #19)
```

### Validation Needs

Same testing approach as Issue #19.

**Key Validation:**
- [ ] Sales Effective Date hidden
- [ ] Order Date (trandate) still visible
- [ ] Ship Date still visible
- [ ] Other date fields not affected

### Dependencies

**Prerequisites:**
- Issue #14 completed (custom form)

**Related Issues:**
- Issue #19 (Remove Opportunity) - same section
- Issue #21 (Remove Partner) - same section
- Issue #16 (Remove Start/End Date) - different dates
- **Batch with #19 and #21**

### Priority & Time Estimate

**Priority:** LOW
**Complexity:** LOW
**Time Estimate:** 15 mins (or 5 mins if batched with #19, #21)

---

## Issue #21: Sales Order - Remove Partner Field

### Issue Analysis

**UAT Request:**
> "Sales Order - Sales Info; Remove Partner"

**Current State:**
- Sales Order form includes "Partner" field in Sales Info section
- Field used to track reseller/partner relationships
- NetSuite Partner Management feature
- Client doesn't use partner/reseller model

**Business Impact:**
- Unused field clutters UI
- Not applicable to client's business model
- No reseller/partner relationships to track

**Root Cause:**
- Standard NetSuite field for partner/reseller management
- Included on all Sales Order forms by default

### Technical Solution

**Solution: Hide Field on Custom Form**

Same approach as Issues #19 and #20.

### Implementation Method

```bash
# Same as #19 and #20, but for Partner field
# Field ID: partner

# RECOMMENDED: Do Issues #19, #20, #21 together
# Total time: 15 mins for all three

# Step 1: Edit custom Sales Order form
1. Screen Fields tab
2. Sales Info section
3. Hide three fields:
   ☐ Opportunity
   ☐ Sales Effective Date
   ☐ Partner
4. Save once
5. Test once
```

### Validation Needs

Same as Issues #19 and #20.

### Dependencies

**Prerequisites:**
- Issue #14 completed

**Related Issues:**
- Issue #19 (Remove Opportunity)
- Issue #20 (Remove Sales Effective Date)
- **BATCH THESE THREE TOGETHER**

### Priority & Time Estimate

**Priority:** LOW
**Complexity:** LOW
**Time Estimate:** 15 mins (or 5 mins if batched)

**RECOMMENDATION: Combine Issues #19, #20, #21 into ONE form edit session.**

---

## Implementation Roadmap

### Phase 1: High Priority (Week 1)

**Issues: #14, #15, #18**

| Day | Task | Duration | Owner |
|-----|------|----------|-------|
| Day 1 | #14: Configure custom form auto-default | 2-3 hours | Config Admin |
| Day 1 | #15: Filter form dropdown | 1 hour | Config Admin |
| Day 2-3 | #18: Deploy workflow + field locking script | 5-6 hours | Developer |
| Day 3 | Testing Phase 1 issues | 2 hours | QA/Client |

**Total Phase 1: 10-12 hours over 3 days**

### Phase 2: UI Cleanup (Week 2)

**Issues: #16, #17, #19, #20, #21**

| Day | Task | Duration | Owner |
|-----|------|----------|-------|
| Day 4 | #19, #20, #21: Hide Opportunity, Eff Date, Partner | 30 mins | Config Admin |
| Day 4 | #16: Investigate + hide Start/End Date (+ Status?) | 1.5 hours | Config Admin |
| Day 5 | #17: Test Memo field behavior | 2 hours | QA |
| Day 5 | #17: Document Memo usage | 1-2 hours | Tech Writer |
| Day 5 | Testing Phase 2 issues | 1 hour | QA/Client |

**Total Phase 2: 6-7 hours over 2 days**

### Phase 3: Documentation & Training (Week 2-3)

| Day | Task | Duration | Owner |
|-----|------|----------|-------|
| Day 6 | Create user guides | 3 hours | Tech Writer |
| Day 7 | User training sessions | 2 hours | Trainer |
| Day 7 | Monitor and support | Ongoing | Support |

**Total Phase 3: 5 hours + ongoing support**

---

## Testing Strategy

### Test Environment Requirements

- [ ] River-Supply-SB Sandbox account access
- [ ] Test users for each role:
  - Administrator
  - Sales Rep (River Sales role)
  - Accounting (River AR, River AP roles)
  - Inventory Manager
  - Purchasing
- [ ] Test customer records with varying configurations
- [ ] Test Sales Order records (existing and new)

### Testing Phases

**Phase 1: Unit Testing (Per Issue)**
- Test each configuration change individually
- Verify expected behavior
- Check for no unintended side effects

**Phase 2: Integration Testing (Cross-Issue)**
- Test all changes together
- Verify no conflicts between changes
- Test workflows + scripts together

**Phase 3: Role-Based Testing**
- Test with each user role
- Verify permissions work correctly
- Test field locking scenarios

**Phase 4: User Acceptance Testing (UAT)**
- Client users test in sandbox
- Real-world scenarios
- Gather feedback

**Phase 5: Production Verification**
- Deploy to production
- Monitor for 48 hours
- Quick rollback plan if issues

### Testing Checklist Template

For each issue:

```
Issue #__: _____________________

☐ Configuration applied
☐ Basic functionality tested
☐ Tested by admin user
☐ Tested by non-admin user
☐ Tested with existing records
☐ Tested with new records
☐ Print templates verified
☐ Reports verified (if applicable)
☐ No console errors
☐ No script errors (if applicable)
☐ Performance acceptable
☐ Client approval obtained

Notes:
_________________________________
```

---

## Risk Assessment

### Low Risk Issues

✅ **Issues #19, #20, #21** (Hide fields)
- Simple configuration
- Easily reversible
- No data loss
- No code involved

### Medium Risk Issues

⚠️ **Issues #14, #15** (Form default, dropdown)
- Configuration complexity
- User training needed
- Affects all Sales Orders

⚠️ **Issue #16** (Remove Status, Start/End Date)
- Must verify approval workflow dependencies
- May affect reporting

⚠️ **Issue #17** (Memo documentation)
- No technical risk
- Requires accurate testing

### High Risk Issues

🔴 **Issue #18** (Sales Info auto-populate + lock)
- SuiteScript development
- Role-based permissions
- Workflow + script interaction
- Related to compliance (Issue #40)
- Thorough testing required

**Risk Mitigation:**
- Deploy to sandbox first
- Test with all roles
- Monitor script execution logs
- Have rollback plan
- Deploy workflow and script separately
- Test each component individually first

---

## Dependencies & Prerequisites

### Technical Prerequisites

- [ ] River-Supply-SB Sandbox access
- [ ] SuiteCloud CLI configured
- [ ] SuiteScript development environment
- [ ] Custom Sales Order form created (Issue #14)
- [ ] All user roles identified and documented
- [ ] Role IDs discovered for script configuration

### Information Prerequisites

- [ ] Approval workflow requirements documented (for Issue #16)
- [ ] Client sign-off on field removals
- [ ] User roles and permissions documented
- [ ] Print template requirements documented

### Deployment Prerequisites

- [ ] Sandbox testing completed
- [ ] UAT sign-off obtained
- [ ] Deployment window scheduled
- [ ] Rollback plan prepared
- [ ] User communication sent

---

## Rollback Plan

### Configuration Changes (Issues #14, #15, #16, #19, #20, #21)

**Rollback Method:** Revert form changes

```bash
# Option 1: Restore previous form version
1. Customization → Forms → Transaction Forms
2. Find custom Sales Order form
3. View Version History
4. Revert to previous version

# Option 2: Manual revert
1. Open form editor
2. Re-check hidden fields to show them
3. Change default form back to standard
4. Save
```

**Rollback Time:** 15 minutes

### Workflow Deployment (Issue #18 - Workflow)

**Rollback Method:** Deactivate workflow

```bash
1. Customization → Workflow → Workflows
2. Find "Auto-Set Sales Rep from Customer - Sales Order"
3. Mark as "Inactive"
4. Save

# OR delete workflow entirely
```

**Rollback Time:** 5 minutes

### Script Deployment (Issue #18 - Field Locking)

**Rollback Method:** Deactivate script deployment

```bash
1. Customization → Scripting → Scripts
2. Find "River - Sales Order Lock Sales Rep"
3. Deployments tab
4. Click deployment
5. Status = "Not Scheduled"
6. Save

# OR delete deployment entirely
```

**Rollback Time:** 5 minutes

---

## Success Criteria

### Issue #14 Success Criteria

✅ Creating Sales Order automatically selects custom form
✅ Form selection based on customer (if configured)
✅ Users can still manually change form if needed
✅ All roles can create Sales Orders successfully

### Issue #15 Success Criteria

✅ Custom form dropdown shows only custom forms
✅ Standard forms hidden or at bottom of list
✅ Dropdown has <5 options for end users
✅ Admins can still access all forms if needed

### Issue #16 Success Criteria

✅ Start Date and End Date fields hidden on form
✅ Status field hidden (or kept if needed for approvals)
✅ All other fields still visible and functional
✅ Approval workflows still function (if applicable)

### Issue #17 Success Criteria

✅ Memo field behavior fully documented
✅ Users understand where Memo appears (form, PDF, email)
✅ Clear guidance on when to use Memo vs. other fields
✅ Help text added to form (optional)

### Issue #18 Success Criteria

✅ Sales Rep auto-populates from customer on create
✅ Sales Rep updates when customer changes
✅ Non-admin users cannot change Sales Rep
✅ Administrator and Accounting can change Sales Rep
✅ No errors in script execution logs
✅ Governance units <10 per execution

### Issue #19, #20, #21 Success Criteria

✅ Opportunity field hidden on form
✅ Sales Effective Date field hidden on form
✅ Partner field hidden on form
✅ All other Sales Info fields still visible
✅ No errors when saving Sales Orders

---

## Documentation Deliverables

### Technical Documentation

1. **Implementation Guide** (this document)
   - Issue analysis
   - Technical solutions
   - Implementation steps
   - Testing procedures

2. **Custom Form Configuration Guide**
   - Which fields are hidden
   - Which fields are auto-populated
   - Role-based field permissions

3. **Script Documentation** (Issue #18)
   - Purpose and business rules
   - Role permissions logic
   - Deployment instructions
   - Troubleshooting guide

4. **Workflow Documentation** (Issue #18)
   - Purpose and triggers
   - Field mapping
   - Execution logic

### User Documentation

1. **Sales Order User Guide**
   - How to create Sales Orders
   - Which fields auto-populate
   - Which fields are locked
   - When to use each field (Memo, etc.)

2. **Field Reference Guide**
   - Purpose of each field
   - Where each field appears (form, PDF, email)
   - Examples of good data entry

3. **Quick Reference Card**
   - 1-page guide for common tasks
   - Decision tree for field usage

### Training Materials

1. **Training Presentation**
   - Overview of changes
   - Before/after screenshots
   - Live demo

2. **Training Videos** (optional)
   - "Creating a Sales Order" (5 mins)
   - "Understanding Sales Order Fields" (3 mins)

---

## Next Steps

### Immediate Actions (This Week)

1. **Review this action plan** with stakeholders
2. **Prioritize issues** - confirm priority rankings
3. **Schedule implementation** - allocate resources
4. **Set up test environment** - sandbox access
5. **Identify test users** - one per role

### Week 1 Actions

1. Implement Issue #14 (form auto-default)
2. Implement Issue #15 (form dropdown filtering)
3. Deploy workflow for Issue #18 (if not already deployed)
4. Begin User Event script development for Issue #18

### Week 2 Actions

1. Complete Issue #18 (field locking)
2. Implement Issues #19, #20, #21 (hide fields)
3. Investigate and implement Issue #16 (Status, Start/End Date)
4. Test Memo field for Issue #17

### Week 3 Actions

1. Complete documentation for Issue #17
2. User acceptance testing
3. Create user guides and training materials
4. Schedule user training sessions

### Production Deployment

1. Final UAT sign-off
2. Schedule deployment window
3. Deploy to production
4. Monitor for 48 hours
5. Gather user feedback
6. Make adjustments if needed

---

## Appendix A: Field Reference

### Sales Order Sales Info Section - Standard Fields

| Field ID | Label | Purpose | Client Uses? | Action |
|----------|-------|---------|--------------|--------|
| salesrep | Sales Rep | Sales representative | ✅ YES | Auto-populate + Lock |
| opportunity | Opportunity | Link to opportunity | ❌ NO | Hide (Issue #19) |
| saleseffectivedate | Sales Effective Date | Commission tracking | ❌ NO | Hide (Issue #20) |
| partner | Partner | Reseller/partner | ❌ NO | Hide (Issue #21) |
| leadsource | Lead Source | Marketing source | ? | TBD - Keep for now |
| class | Class | Classification | ? | TBD |
| department | Department | Department | ? | TBD |
| location | Location | Location | ? | TBD |

### Sales Order Primary Info Section - Standard Fields

| Field ID | Label | Purpose | Client Uses? | Action |
|----------|-------|---------|--------------|--------|
| customform | Custom Form | Form template | ✅ YES | Auto-default (Issue #14) |
| tranid | SO# | Transaction number | ✅ YES | Keep |
| entity | Customer | Customer | ✅ YES | Keep |
| trandate | Date | Order date | ✅ YES | Keep |
| memo | Memo | Internal notes | ? | Document (Issue #17) |
| transtatus | Status | Approval status | ? | Investigate (Issue #16) |
| trandate_start | Start Date | Project start | ❌ NO | Hide (Issue #16) |
| trandate_end | End Date | Project end | ❌ NO | Hide (Issue #16) |

---

## Appendix B: Role Information

### River-Supply-SB Custom Roles

From existing role files in `src/Objects/`:

| Role File | Script ID | Purpose |
|-----------|-----------|---------|
| customrole_river_sales.xml | customrole_river_sales | Sales representatives |
| customrole_river_ar.xml | customrole_river_ar | Accounts receivable |
| customrole_river_ap.xml | customrole_river_ap | Accounts payable |
| customrole_river_inventory_mgr.xml | customrole_river_inventory_mgr | Inventory management |
| customrole_river_purchasing.xml | customrole_river_purchasing | Purchasing agents |
| customrole_river_developer.xml | customrole_river_developer | Development/admin |

### Role Permissions for Sales Rep Field

| Role | Can Create SO? | Sales Rep Auto-Populates? | Can Edit Sales Rep? |
|------|---------------|--------------------------|-------------------|
| Administrator | ✅ YES | ✅ YES | ✅ YES |
| Sales | ✅ YES | ✅ YES | ❌ NO |
| Accounts Receivable | ✅ YES | ✅ YES | ✅ YES |
| Accounts Payable | ✅ YES | ✅ YES | ✅ YES |
| Inventory Manager | ✅ YES | ✅ YES | ❌ NO |
| Purchasing | ✅ YES | ✅ YES | ❌ NO |

---

## Appendix C: Related UAT Issues

### Issues Handled by Other Agents

The following UAT issues are related but assigned to other agents:

- **Issue #1-13:** Estimate issues (Agent 1?)
- **Issue #23:** Sales Order - Classification; Remove entire section
- **Issue #24-28:** Sales Order - Items and Shipping
- **Issue #29-34:** Sales Order - Billing, Accounting, Relationships, Communication, Custom
- **Issue #40:** Sales Reps assigned to customers can only be changed by administrators and accounting
  - **Directly related to Issue #18**
  - Same role restrictions
  - May require similar workflow/script for Customer record

### Cross-Agent Dependencies

**Issue #18 (Agent 2) ↔ Issue #40 (Agent ?)**
- Both require Sales Rep field locking
- Same role permission logic
- Issue #18 handles Sales Order
- Issue #40 handles Customer record
- Coordinate implementation approach

---

## Agent 2 Summary

**Issues Assigned:** 8 (Issues #14-21)
**Total Estimated Time:** 17-21 hours
**Complexity Distribution:**
- Low: 6 issues (field hiding, documentation)
- Medium: 2 issues (form config, script development)

**Key Deliverables:**
1. Custom Sales Order form configured
2. Sales Rep auto-population + field locking implemented
3. UI cleanup (hidden fields)
4. Memo field documentation
5. User guides and training materials

**Critical Path:**
1. Issue #14 → Issue #15 (form setup)
2. Issue #18 (workflow + script) - most complex
3. Issues #16, #17, #19-21 (cleanup and docs)

**Status:** ✅ Action plan complete - ready for review and implementation

---

**Document Status:** ✅ COMPLETE - Ready for stakeholder review
**Next Action:** Present to project manager and client for approval
**Created:** 2025-10-16
**Last Updated:** 2025-10-16
