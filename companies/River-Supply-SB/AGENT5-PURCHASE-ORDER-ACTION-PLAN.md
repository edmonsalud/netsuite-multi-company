# Agent 5: Purchase Order Issues - Comprehensive Action Plan

**Project:** River-Supply-SB
**Account:** 9910981-sb1 (Sandbox)
**Date Created:** 2025-10-16
**Agent:** Agent 5 - NetSuite Purchase Order & Purchasing Process Expert
**Status:** Action Plan Complete - Ready for Implementation

---

## Executive Summary

This document provides detailed action plans for 9 Purchase Order (PO) issues identified during UAT for River-Supply-SB. Issues range from workflow automation requirements to UI customization needs and training questions.

**Issue Categories:**
- **Workflow/Automation:** Issues #37, #38, #39 (Approval routing and auto-population)
- **Configuration:** Issues #40, #42, #44 (Custom numbering, field removal, billing display)
- **Training/Documentation:** Issues #41, #43, #45 (Understanding existing features)

**Implementation Priority:**
1. **HIGH:** Issues #37, #39 (Approval workflow - business critical)
2. **MEDIUM:** Issues #38, #40, #44 (User experience improvements)
3. **LOW:** Issues #41, #42, #43, #45 (Training/minor customization)

---

## Issue #37: PO Approval Workflow to Purchasing Department

### Issue Description
**User Request:** "How can they create a PO but have it sent to purchasing dept for submission?"

**Business Need:**
- Non-purchasing employees need ability to create draft POs
- POs should route to Purchasing department for review and approval
- Purchasing department submits final PO to vendor

### Current State Analysis
- River-Supply-SB has `customrole_river_purchasing` role deployed
- Purchasing role has FULL permission for `TRAN_PURCHORD` (Purchase Orders)
- No approval workflow exists for Purchase Orders

### Solution Approach: **Custom Workflow with Approval Routing**

### Technical Implementation Plan

#### Option A: NetSuite Approval Routing (Recommended)
**Complexity:** Medium
**Timeline:** 2-4 hours
**Cost:** Included in NetSuite subscription

**Implementation Steps:**

1. **Enable Approval Routing Feature**
   ```
   Setup → Company → Enable Features → Transactions tab
   ☑ Approval Routing
   ```

2. **Create Purchase Order Approval Route**
   ```
   Setup → Accounting → Approval Routing
   Click "New"

   Configuration:
   - Name: "Purchase Order - Purchasing Dept Approval"
   - Record Type: Purchase Order
   - Approval Type: Single Approver or Chain

   Routing Criteria:
   - If: Creator Role ≠ "River Supply - Purchasing Agent"
   - Then: Route to [Purchasing Manager/Supervisor]
   - Or: Route to Queue → "Purchasing Approval Queue"
   ```

3. **Configure Approval Queue (if using queue approach)**
   ```
   Setup → Accounting → Approval Routing → Queues
   Create new queue: "Purchasing Approval Queue"
   Add Members: All users with "River Supply - Purchasing Agent" role
   ```

4. **Set PO Status Flow**
   ```
   Pending Approval → Pending Receipt (after approval)
   ```

5. **Create Email Notifications**
   ```
   Setup → Company → Email Preferences → Templates
   Create template: "PO Awaiting Purchasing Approval"
   Trigger: When PO enters "Pending Approval" status
   Recipients: Purchasing Queue members
   ```

#### Option B: Custom Workflow (More Flexible)
**Complexity:** Medium-High
**Timeline:** 4-6 hours
**Cost:** Free (development time)

**Workflow Logic:**
```
TRIGGER: On Create (Purchase Order)
IF: Current User Role ≠ "River Supply - Purchasing Agent"
THEN:
  1. Set PO Status = "Pending Approval"
  2. Lock all fields (prevent editing)
  3. Send notification to Purchasing department
  4. Create approval task assigned to Purchasing Manager

TRIGGER: On Field Change (Approval Status)
IF: Approval Status = "Approved"
THEN:
  1. Set PO Status = "Pending Receipt"
  2. Unlock fields for Purchasing role only
  3. Send notification to original creator
  4. Allow submission to vendor
```

**Workflow File Structure:**
```xml
<workflow scriptid="customworkflow_po_purchasing_approval">
  <name>Purchase Order - Purchasing Department Approval</name>
  <recordtypes>
    <recordtype>PURCHASEORDER</recordtype>
  </recordtypes>
  <workfloweventtypes>
    <workfloweventtype>
      <recordevent>ONCREATE</recordevent>
    </workfloweventtype>
  </workfloweventtypes>
  <workflowstates>
    <workflowstate scriptid="workflowstate_pending_approval">
      <name>Pending Purchasing Approval</name>
      <workflowtransitions>...</workflowtransitions>
      <workflowactions>...</workflowactions>
    </workflowstate>
  </workflowstates>
</workflow>
```

### Role Permission Adjustments Required

**Non-Purchasing Roles (Sales, Inventory, etc.):**
```xml
<permission>
  <permkey>TRAN_PURCHORD</permkey>
  <permlevel>CREATE</permlevel>  <!-- Changed from FULL -->
</permission>
```

**Purchasing Role (Already configured correctly):**
```xml
<permission>
  <permkey>TRAN_PURCHORD</permkey>
  <permlevel>FULL</permlevel>  <!-- Remains FULL -->
</permission>
```

### Testing Plan
1. Create test user with "River Supply - Sales" role
2. Log in as Sales user → Create Purchase Order
3. **Expected:** PO enters "Pending Approval" status
4. Log in as Purchasing user → Navigate to Approval Queue
5. **Expected:** PO appears in queue
6. Approve PO
7. **Expected:** PO status changes to "Pending Receipt"
8. Verify original creator receives notification

### Documentation Requirements
- User Guide: "Creating Purchase Orders for Approval"
- Purchasing Guide: "Approving Purchase Orders"
- FAQ: "Why can't I submit my PO to vendor?"

### Recommendation
**Use Option A (Approval Routing)** - Native NetSuite feature, easier to maintain, no custom code.

---

## Issue #38: Auto-Populate Employee Field on Purchase Order

### Issue Description
**User Request:** "Purchase Order - Employee; This should self populate with signon"

**Business Need:**
- Employee field should automatically populate with logged-in user's name
- Reduces data entry errors
- Improves tracking of who created PO

### Current State Analysis
- Standard NetSuite behavior: Employee field is blank by default
- User must manually select employee from dropdown
- No existing workflow for this functionality

### Solution Approach: **Custom Workflow - Auto-Set Employee Field**

### Technical Implementation Plan

#### Workflow Configuration
**Complexity:** Low
**Timeline:** 1 hour
**Similar to existing:** `customworkflow_salesorder_salesrep_auto.xml`

**Workflow Logic:**
```
TRIGGER: Before Load (On Create, On Edit)
ACTION: Set Field Value
FIELD: employee (or body field for created by)
FORMULA: {currentuser.id} or {currentuser}
```

**Implementation Steps:**

1. **Create Workflow XML File**
   ```bash
   Location: companies/River-Supply-SB/src/Objects/
   Filename: customworkflow_po_employee_auto.xml
   ```

2. **Workflow XML Structure:**
   ```xml
   <workflow scriptid="customworkflow_po_employee_auto">
     <name>Auto-Set Employee from Current User - Purchase Order</name>
     <recordtypes>
       <recordtype>PURCHASEORDER</recordtype>
     </recordtypes>
     <initcondition>
       <type>VISUAL_BUILDER</type>
       <parameters>
         <parameter>
           <name>formula</name>
           <value>FORMULANUMERIC: CASE WHEN {employee} IS NULL THEN 1 ELSE 0 END</value>
         </parameter>
       </parameters>
     </initcondition>
     <isinactive>F</isinactive>
     <islogenabled>T</islogenabled>
     <keephistory>ONLYONCHANGE</keephistory>
     <releasestatus>RELEASED</releasestatus>
     <workflowcustomfields/>
     <workfloweventtypes>
       <workfloweventtype>
         <contexttypes>
           <contexttype>USERINTERFACE</contexttype>
         </contexttypes>
         <recordevent>BEFORELOAD</recordevent>
       </workfloweventtype>
     </workfloweventtypes>
     <workflowstates>
       <workflowstate scriptid="workflowstate_set_employee">
         <donotexitworkflow>T</donotexitworkflow>
         <name>Set Employee to Current User</name>
         <positionx>143</positionx>
         <positiony>143</positiony>
         <workflowactions>
           <workflowactiongroup>
             <eventtypes>
               <eventtype>ENTRY</eventtype>
             </eventtypes>
             <workflowactions>
               <setfieldvalueaction scriptid="workflowaction_set_employee">
                 <isinactive>F</isinactive>
                 <field>employee</field>
                 <schedulemode>DELAY</schedulemode>
                 <valuetext>{currentuser.id}</valuetext>
               </setfieldvalueaction>
             </workflowactions>
           </workflowactiongroup>
         </workflowactions>
       </workflowstate>
     </workflowstates>
   </workflow>
   ```

3. **Update deploy.xml**
   ```xml
   <configuration>
     <path>~/Objects/customworkflow_po_employee_auto.xml</path>
   </configuration>
   ```

4. **Deploy Workflow**
   ```bash
   cd companies/River-Supply-SB
   npx suitecloud project:validate
   npx suitecloud project:deploy
   ```

### Alternative Approaches

#### Option B: User Event Script
**Use if:** Workflow doesn't meet requirements

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/runtime'], (runtime) => {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE) {
            const currentUser = runtime.getCurrentUser();
            const newRecord = context.newRecord;

            // Set employee field to current user
            const employeeField = newRecord.getValue({
                fieldId: 'employee'
            });

            if (!employeeField) {
                newRecord.setValue({
                    fieldId: 'employee',
                    value: currentUser.id
                });
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
```

### Testing Plan
1. Log in as any user
2. Create new Purchase Order
3. **Expected:** Employee field auto-populates with logged-in user's name
4. Verify field can be manually changed if needed
5. Test with multiple users and roles

### Edge Cases to Handle
- What if logged-in user is not in Employee list? (External users)
- Should field be locked after auto-population?
- Should it update if PO is edited by different user?

**Recommendation:** Allow manual override, don't lock field

---

## Issue #39: Supervisor Approval - Default for Non-Purchasing Roles

### Issue Description
**User Request:** "Purchase Order - Supervisor Approval; This should be default for everyone but Purchasing Role"

**Business Need:**
- All users EXCEPT Purchasing role need supervisor approval for POs
- Purchasing role can create and approve their own POs
- Implements proper financial controls

### Current State Analysis
- No approval workflow exists
- All roles with FULL permission can create and approve POs
- No supervisor approval mechanism in place

### Solution Approach: **Integrated with Issue #37 Approval Workflow**

**NOTE:** This issue complements Issue #37. Implement together as single approval workflow.

### Technical Implementation Plan

#### Workflow Configuration
**Complexity:** Medium
**Timeline:** Combined with Issue #37 (2-4 hours total)

**Approval Routing Logic:**
```
IF: PO Creator Role = "River Supply - Purchasing Agent"
THEN: No approval required → Status = "Pending Receipt"

ELSE IF: PO Creator Role = ANY OTHER ROLE
THEN:
  Step 1: Route to Creator's Supervisor for approval
  Step 2: After supervisor approval → Route to Purchasing Department
  Step 3: After purchasing approval → Status = "Pending Receipt"
```

**Supervisor Determination Methods:**

**Method A: Use NetSuite Supervisor Field**
```
Employee Record → Supervisor field
Workflow references: {employee.supervisor}
```

**Method B: Role-Based Routing**
```
IF: Creator Role = "Sales Representative"
THEN: Route to → Sales Manager

IF: Creator Role = "Inventory Manager"
THEN: Route to → Operations Manager

IF: Creator Role = "AP Specialist"
THEN: Route to → Controller
```

**Method C: Amount-Based Routing**
```
IF: PO Total < $1,000
THEN: Supervisor approval only

IF: PO Total >= $1,000 AND < $10,000
THEN: Supervisor + Purchasing approval

IF: PO Total >= $10,000
THEN: Supervisor + Purchasing + Controller approval
```

### Approval Routing Configuration

**Setup → Accounting → Approval Routing:**

```
Route #1: "PO Supervisor Approval"
- Trigger: Purchase Order created by non-Purchasing role
- Approver: Employee.Supervisor
- Rejection Action: Return to creator

Route #2: "PO Purchasing Department Final Approval"
- Trigger: After supervisor approval
- Approver: Role = "River Supply - Purchasing Agent"
- Approval Action: Change status to "Pending Receipt"
```

### Custom Status Values Required

**Add Custom PO Statuses:**
```
Setup → Accounting → Accounting Preferences → Transaction Form Preferences

New Statuses:
1. "Pending Supervisor Approval"
2. "Pending Purchasing Approval"
3. "Rejected by Supervisor"
4. "Rejected by Purchasing"
```

### Email Notification Templates

**Template 1: Notify Supervisor**
```
Subject: Purchase Order #{tranid} Awaiting Your Approval
Body:
{employee.firstname} has created Purchase Order #{tranid} for {entity.entityid}.
Amount: {total}
Description: {memo}

Click here to review and approve: [Link to PO]
```

**Template 2: Notify Purchasing**
```
Subject: Purchase Order #{tranid} Awaiting Purchasing Approval
Body:
Purchase Order #{tranid} has been approved by supervisor and requires final purchasing review.
Creator: {employee.firstname}
Vendor: {entity.entityid}
Amount: {total}

Click here to review: [Link to PO]
```

**Template 3: Rejection Notification**
```
Subject: Purchase Order #{tranid} Requires Revision
Body:
Your Purchase Order #{tranid} was not approved.
Reason: {approvalstatus.comments}

Please review and resubmit.
```

### Role Permission Updates

**File:** `src/Objects/customrole_river_purchasing.xml`

**No changes needed** - Already has FULL permission

**Other Roles (Sales, Inventory, AR, AP):**

```xml
<permission>
  <permkey>TRAN_PURCHORD</permkey>
  <permlevel>CREATE</permlevel>  <!-- CREATE only, not FULL -->
</permission>

<permission>
  <permkey>TRAN_PURCHORD_APPROVE</permkey>
  <permlevel>NONE</permlevel>  <!-- Cannot approve -->
</permission>
```

### Testing Plan

**Test Case 1: Non-Purchasing User Creates PO**
1. Log in as "River Supply - Sales" role
2. Create Purchase Order
3. **Expected:** Status = "Pending Supervisor Approval"
4. Verify creator cannot approve own PO
5. Verify supervisor receives notification

**Test Case 2: Supervisor Approves**
1. Log in as supervisor
2. Navigate to Approval Queue
3. Approve PO
4. **Expected:** Status = "Pending Purchasing Approval"
5. Verify purchasing department receives notification

**Test Case 3: Purchasing Final Approval**
1. Log in as "River Supply - Purchasing Agent"
2. Navigate to Approval Queue
3. Approve PO
4. **Expected:** Status = "Pending Receipt"
5. Verify creator receives confirmation

**Test Case 4: Purchasing User Creates PO**
1. Log in as "River Supply - Purchasing Agent"
2. Create Purchase Order
3. **Expected:** No approval required, Status = "Pending Receipt"
4. Verify workflow bypasses approval for purchasing role

**Test Case 5: Rejection Flow**
1. Create PO as Sales user
2. Supervisor rejects with comments
3. **Expected:** PO returns to creator with rejection reason
4. Creator edits and resubmits
5. **Expected:** Re-enters approval workflow

### Integration with Issue #37
This issue should be implemented as PART OF Issue #37's approval workflow, not separately. The combined workflow provides:
- Supervisor approval for non-purchasing roles
- Final purchasing department approval
- Bypass for purchasing role
- Comprehensive approval routing

---

## Issue #40: Custom Purchase Order Numbering

### Issue Description
**User Request:** "Purchase Order - PO#; Is there a way to allow a customized #? We do custom ones with a vendor"

**Business Need:**
- Certain vendors require specific PO number formats
- Need ability to override auto-generated PO numbers
- Maintain audit trail of custom numbering

### Current State Analysis
- NetSuite auto-generates PO numbers sequentially
- Standard format typically: PO-00001, PO-00002, etc.
- PO number field is auto-generated and typically locked

### Solution Approaches

#### Option A: Enable Manual PO Numbering (Recommended for Flexibility)
**Complexity:** Low
**Timeline:** 15 minutes
**Pros:** Simple, native NetSuite feature
**Cons:** Users might create duplicate numbers

**Implementation Steps:**

1. **Disable Auto-Generated PO Numbers**
   ```
   Setup → Accounting → Set Up Accounting Preferences
   Navigate to: Transaction Number Preferences

   Find: Purchase Orders
   ☐ Uncheck "Auto-Generated"
   ```

2. **Configure Custom Numbering Rules (Optional)**
   ```
   Setup → Accounting → Configure Auto-Generated Numbers

   Record Type: Purchase Order
   Prefix: PO-
   Next Number: 10001
   Suffix: [blank or year]
   ```

3. **Add Field Validation (Recommended)**
   Create User Event Script to validate PO numbers:
   ```javascript
   // Validate PO number format
   // Prevent duplicates
   // Log custom PO numbers for audit
   ```

**Result:** Users can manually enter PO number when creating PO.

#### Option B: Vendor-Specific PO Number Field
**Complexity:** Medium
**Timeline:** 2-3 hours
**Pros:** Maintains auto-numbering, adds vendor field
**Cons:** Requires custom field and scripts

**Implementation Steps:**

1. **Create Custom Field**
   ```
   Setup → Customization → Lists, Records, & Fields → Transaction Body Fields

   New Field:
   - Label: "Vendor PO Number"
   - ID: custbody_vendor_po_number
   - Type: Free-Form Text
   - Applies To: Purchase Order
   - Display Type: Normal
   - Show on List: Yes
   ```

2. **Add Field to PO Form**
   ```
   Customization → Forms → Transaction Forms → Purchase Order
   Edit Standard PO form
   Add field: custbody_vendor_po_number
   Position: Below main PO # field
   ```

3. **Create Client Script for Validation**
   ```javascript
   /**
    * @NApiVersion 2.1
    * @NScriptType ClientScript
    */
   define(['N/search'], (search) => {
       function validateField(context) {
           if (context.fieldId === 'custbody_vendor_po_number') {
               const vendorPONum = context.currentRecord.getValue({
                   fieldId: 'custbody_vendor_po_number'
               });

               if (vendorPONum) {
                   // Check for duplicates
                   const duplicateSearch = search.create({
                       type: search.Type.PURCHASE_ORDER,
                       filters: [
                           ['custbody_vendor_po_number', 'is', vendorPONum]
                       ]
                   });

                   const resultCount = duplicateSearch.runPaged().count;

                   if (resultCount > 0) {
                       alert('Warning: This vendor PO number already exists.');
                       return false;
                   }
               }
           }
           return true;
       }

       return {
           validateField: validateField
       };
   });
   ```

4. **Update PO PDF Template**
   Show both numbers on printed PO:
   ```
   NetSuite PO #: ${record.tranid}
   Vendor Reference #: ${record.custbody_vendor_po_number}
   ```

#### Option C: Conditional Numbering by Vendor
**Complexity:** High
**Timeline:** 4-6 hours
**Pros:** Automatic based on vendor
**Cons:** Complex to maintain

**Implementation:**
- Custom field on Vendor record: "Use Custom PO Format"
- Workflow checks vendor setting
- If enabled, prompts user for custom PO number
- Maintains auto-numbering for other vendors

### Recommendation

**Use Option A (Enable Manual Numbering)** if:
- Only occasional need for custom numbers
- Trust users to enter correctly
- Want simplest solution

**Use Option B (Vendor-Specific Field)** if:
- Want to maintain auto-numbering
- Need both NetSuite # and vendor #
- Want better audit trail

### Testing Plan
1. Create PO with standard vendor → Verify auto-number works
2. Create PO with vendor requiring custom # → Enter custom number
3. Attempt duplicate custom # → Verify validation catches it
4. Print PO → Verify both numbers appear
5. Search/report on POs → Verify custom # is searchable

### Training Documentation Required
- "When to Use Custom PO Numbers"
- "How to Enter Vendor-Specific PO Numbers"
- "Custom PO Numbering Guidelines"

---

## Issue #41: Purchase Order Memo Field - Print vs. Internal

### Issue Description
**User Request:** "Purchase Order - Memo; Does this print or just live in computer"

**Business Need:**
- Clarify whether Memo field appears on printed/emailed PO
- Understand difference between Memo (internal) vs. Message (prints on PO)

### Current State Analysis
- Standard NetSuite PO form has both "Memo" and "Message" fields
- **Memo:** Internal notes (does NOT print by default)
- **Message:** Vendor-facing message (DOES print on PO)
- Users may be confusing the two fields

### Solution Approach: **Training & Documentation (No Development Required)**

### Answer to User Question

**Memo Field Behavior:**
- **Default:** Does NOT print on Purchase Order PDF
- **Purpose:** Internal notes for accounting/purchasing team
- **Visibility:** Only visible to NetSuite users, not vendors
- **Can Be Modified:** Yes, via custom PDF template

**Message Field Behavior:**
- **Default:** DOES print on Purchase Order PDF
- **Purpose:** Communication to vendor
- **Visibility:** Vendors see this on emailed/printed PO
- **Location on PO:** Usually appears below items, above totals

### If Memo Field Needs to Print (Customization Required)

**Option A: Modify Standard PO PDF Template**
**Complexity:** Low
**Timeline:** 30 minutes

**Implementation Steps:**

1. **Navigate to PDF Template**
   ```
   Customization → Forms → Transaction Forms → Purchase Order
   Select "Standard Purchase Order PDF/HTML Template"
   Click "Customize"
   ```

2. **Add Memo Field to Template**
   ```xml
   <!-- Add in template body where needed -->
   <#if record.memo?has_content>
     <p><b>Internal Notes:</b> ${record.memo}</p>
   </#if>
   ```

3. **Save and Assign Template**
   ```
   Save template
   Assign to Purchase Order form
   ```

**Option B: Add Custom "Internal Notes" Section**
Create separate section on PO that clearly labels internal vs. vendor-visible notes.

### Recommended Action: **Training Document**

**Create Documentation:**
- "Understanding PO Fields: Memo vs. Message"
- Visual guide showing where each field appears
- Best practices for using each field

**Quick Reference Card:**
```
┌─────────────────────────────────────────┐
│ MEMO Field                              │
│ • Internal notes only                   │
│ • Does NOT print on PO by default       │
│ • Use for: Purchase justification,      │
│   approval notes, internal references   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ MESSAGE Field                           │
│ • Vendor communication                  │
│ • DOES print on PO                      │
│ • Use for: Delivery instructions,       │
│   special requests, vendor notes        │
└─────────────────────────────────────────┘
```

### Testing/Validation Plan
1. Create test PO
2. Enter text in Memo field
3. Enter different text in Message field
4. Print PO to PDF
5. **Verify:** Only Message appears, Memo does not
6. Document findings for training

### No Development Required
This is a **training/documentation issue**, not a technical issue.

**Recommendation:** Create quick reference guide and distribute to users.

---

## Issue #42: Remove Classification Section from Purchase Order

### Issue Description
**User Request:** "Purchase Order - Classification; Remove entire section"

**Business Need:**
- Classification field not used by River Supply
- Clutters the PO form
- Want cleaner UI

### Current State Analysis
- Classification is a standard NetSuite field
- Used for departmental/project tracking
- Can be hidden but not deleted (standard field)

### Solution Approaches

#### Option A: Hide Classification via Form Customization (Recommended)
**Complexity:** Very Low
**Timeline:** 5 minutes
**No development required**

**Implementation Steps:**

1. **Navigate to PO Form**
   ```
   Customization → Forms → Transaction Forms → Purchase Order
   Select form in use (typically "Standard Purchase Order")
   Click "Customize"
   ```

2. **Hide Classification Field**
   ```
   Screen Fields → Main tab
   Find: Classification
   Set Display Type: "Hidden"

   OR

   Remove from screen entirely
   ```

3. **Save and Assign**
   ```
   Save form
   Verify it's assigned as default for Purchase Orders
   ```

4. **Test**
   ```
   Create new PO
   Verify Classification section no longer appears
   ```

**Result:** Classification field hidden from all users.

#### Option B: Role-Based Field Display
**Complexity:** Low
**Timeline:** 15 minutes
**If only certain roles should see it**

**Implementation:**
- Use "Show Field For" setting on form
- Select specific roles that can see Classification
- All other roles won't see field

#### Option C: Conditional Display via Workflow
**Complexity:** Medium
**Timeline:** 1 hour
**If field should show based on certain conditions**

**Example Conditions:**
- Show Classification if PO amount > $10,000
- Show Classification if vendor type = "Capital Equipment"
- Hide for all other scenarios

### Recommendation
**Use Option A** - Simple, fast, meets requirement.

No SuiteScript needed. Pure form customization.

### Rollback Plan
If Classification needs to be restored:
1. Edit PO form
2. Change Display Type back to "Normal"
3. Save

### Testing Plan
1. Edit PO form → Hide Classification
2. Create new PO as different users/roles
3. **Verify:** Classification section not visible
4. Edit existing PO
5. **Verify:** Classification section not visible
6. Test with all roles (Purchasing, Sales, Inventory, etc.)

### Documentation
- Update user training materials
- Remove Classification from PO creation guides
- Update screenshots

---

## Issue #43: Unit of Measure - Purchase vs. Sales UofM

### Issue Description
**User Request:** "Purchase Order - Items; Qty, UofM, Vendor Item #, Description, Cost, Total; How does this account for sale UofM and purchase UofM?"

**Business Need:**
- Understand how NetSuite handles items with different purchase vs. sales units
- Example: Purchase in Cases, Sell in Each
- Ensure proper conversion and costing

### Current State Analysis
- NetSuite supports multiple Units of Measure per item
- Item records can have different Purchase Unit vs. Stock Unit vs. Sales Unit
- Conversion factors defined on Item record

### Solution Approach: **Training & Documentation (No Development Required)**

### Answer to User Question

**How NetSuite Handles Purchase vs. Sales UofM:**

**1. Item Setup:**
```
Item Record Configuration:
- Stock Unit: Each
- Purchase Unit: Case (24 each)
- Sale Unit: Each
- Conversion: 1 Case = 24 Each
```

**2. Purchase Order Behavior:**
```
When adding item to PO:
- Default UofM = Purchase Unit (Case)
- Enter Quantity: 10 Cases
- NetSuite converts: 10 Cases = 240 Each (stock)
- Cost per Case: $50.00
- Total: $500.00
```

**3. Sales Order Behavior:**
```
When adding same item to Sales Order:
- Default UofM = Sale Unit (Each)
- Enter Quantity: 100 Each
- NetSuite converts: 100 Each = 4.17 Cases (purchase)
- Price per Each: $5.00
- Total: $500.00
```

**4. Inventory Impact:**
```
Receiving PO (10 Cases):
- Inventory increases by 240 Each (stock unit)

Selling 100 Each:
- Inventory decreases by 100 Each (stock unit)
- Remaining: 140 Each (5.83 Cases)
```

**5. Costing:**
```
Purchase Cost: $50.00 per Case
Unit Cost Calculation: $50.00 ÷ 24 = $2.083 per Each

When selling:
COGS = Quantity (Each) × Unit Cost per Each
COGS = 100 × $2.083 = $208.30
```

### Visual Example for Training

**Scenario: Paper Towel Rolls**
```
┌──────────────────────────────────────────┐
│ Item: Paper Towels                       │
├──────────────────────────────────────────┤
│ Stock Unit: Roll                         │
│ Purchase Unit: Case (12 rolls per case) │
│ Sale Unit: Roll                          │
│ Conversion: 1 Case = 12 Rolls           │
└──────────────────────────────────────────┘

Purchase Order:
┌────────────────────────────────────────────┐
│ Item: Paper Towels                         │
│ Qty: 10                                    │
│ UofM: Case ← Auto-selects Purchase Unit   │
│ Cost: $30.00 per Case                      │
│ Total: $300.00                             │
│                                            │
│ NetSuite Calculation:                      │
│ 10 Cases × 12 Rolls = 120 Rolls in stock │
│ Unit cost = $30 ÷ 12 = $2.50 per Roll    │
└────────────────────────────────────────────┘

Sales Order:
┌────────────────────────────────────────────┐
│ Item: Paper Towels                         │
│ Qty: 50                                    │
│ UofM: Roll ← Auto-selects Sales Unit      │
│ Price: $4.00 per Roll                      │
│ Total: $200.00                             │
│                                            │
│ NetSuite Calculation:                      │
│ 50 Rolls from stock                       │
│ COGS = 50 × $2.50 = $125.00              │
│ Profit = $200 - $125 = $75.00            │
└────────────────────────────────────────────┘
```

### Configuration Verification

**Check Item UofM Setup:**
```
Lists → Accounting → Items → [Item Name]

Units Tab:
☑ Units Type: [Select type, e.g., "Weight", "Volume", "Count"]
- Stock Unit: [Base unit]
- Purchase Unit: [Larger unit]
- Sale Unit: [Customer-facing unit]

Unit Conversion:
1 [Purchase Unit] = [X] [Stock Units]
Example: 1 Case = 24 Each
```

### Common Issues & Solutions

**Issue 1: Wrong Unit Appears on PO**
**Cause:** Purchase Unit not set on item record
**Solution:** Set Purchase Unit on item

**Issue 2: Conversion Factor Wrong**
**Cause:** Unit conversion not defined
**Solution:** Define conversion on Item → Units tab

**Issue 3: Cost Calculation Incorrect**
**Cause:** User entered cost in wrong unit
**Solution:** Training on proper cost entry

**Issue 4: Inventory Count Doesn't Match Purchase Qty**
**Cause:** Misunderstanding conversion
**Solution:** Inventory always in Stock Unit, not Purchase Unit

### Training Documentation Required

**Create:**
1. **"Understanding Units of Measure in NetSuite"**
   - Purchase Unit vs. Sale Unit vs. Stock Unit
   - How conversions work
   - Visual examples

2. **"Purchase Order UofM Best Practices"**
   - Always verify unit before entering quantity
   - Understanding cost per unit
   - How to convert between units manually

3. **"Item Setup Guide: Configuring Units of Measure"**
   - Step-by-step item setup
   - Defining conversions
   - Testing configuration

4. **Quick Reference Card**
   ```
   ┌─────────────────────────────────────┐
   │ UNIT OF MEASURE CHEAT SHEET        │
   ├─────────────────────────────────────┤
   │ Purchase Order → Uses Purchase Unit │
   │ Sales Order → Uses Sale Unit        │
   │ Inventory → Uses Stock Unit         │
   │                                     │
   │ NetSuite converts automatically!    │
   └─────────────────────────────────────┘
   ```

### No Development Required
This is a **training/documentation issue**. NetSuite's standard UofM functionality handles this correctly.

**Recommendation:**
1. Verify all items have correct UofM setup
2. Create training materials with examples
3. Train users on UofM concepts
4. Create troubleshooting guide

---

## Issue #44: Billing Section - Pull from Vendor, View Only

### Issue Description
**User Request:** "Purchase Order - Billing; Should pull from the Vendor card and view only"

**Business Need:**
- Billing address should auto-populate from Vendor record
- Users should not be able to edit billing address on PO
- Ensures consistency with vendor master data

### Current State Analysis
- NetSuite auto-populates billing address from Vendor by default
- Field is typically editable (allows overrides)
- No field-level locking in place

### Solution Approaches

#### Option A: Form Customization - Make Field Display-Only (Recommended)
**Complexity:** Very Low
**Timeline:** 5 minutes

**Implementation Steps:**

1. **Navigate to PO Form**
   ```
   Customization → Forms → Transaction Forms → Purchase Order
   Select active form
   Click "Customize"
   ```

2. **Make Billing Address Display-Only**
   ```
   Screen Fields → Main tab
   Find: Billing Address
   Set Display Type: "Inline Text" or "Disabled"
   ```

3. **Save and Test**
   ```
   Save form
   Create new PO
   Verify billing address auto-populates and cannot be edited
   ```

**Result:** Billing address displays but is not editable.

#### Option B: Role-Based Field Permissions
**Complexity:** Low
**Timeline:** 15 minutes
**If only certain roles should edit**

**Implementation Steps:**

1. **Edit Role Permissions**
   ```
   Setup → Users/Roles → Manage Roles → [Role Name]
   Permissions tab → Transactions → Purchase Order
   ```

2. **Create Field-Level Security**
   ```
   Customization → Lists, Records & Fields → Field Security
   Create new restriction:
   - Field: Billing Address (on Purchase Order)
   - Roles: All except "Administrator"
   - Permission: View Only
   ```

3. **Test with Multiple Roles**
   ```
   Log in as different users
   Verify billing address is view-only for non-admins
   ```

#### Option C: Workflow - Prevent Changes
**Complexity:** Medium
**Timeline:** 1-2 hours
**If need validation/error messages**

**Workflow Logic:**
```
TRIGGER: Before Submit
IF: Billing Address ≠ Vendor.Default Billing Address
THEN:
  - Display error: "Cannot change billing address on PO"
  - Reset to vendor's default address
  - Prevent save
```

#### Option D: User Event Script - Lock Field
**Complexity:** Low-Medium
**Timeline:** 1 hour

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], (serverWidget) => {
    function beforeLoad(context) {
        if (context.type !== context.UserEventType.VIEW) {
            const form = context.form;

            // Get billing address field
            const billingField = form.getField({
                id: 'billaddr'
            });

            // Make field display-only
            if (billingField) {
                billingField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
```

### Vendor Record Verification

**Ensure Vendor Records Have Billing Address:**
```
Lists → Relationships → Vendors → [Vendor Name]
Address tab → Add/Edit Billing Address
☑ Set as Default Billing Address
```

### Testing Plan
1. Open vendor record → Verify billing address exists
2. Create new PO for that vendor
3. **Verify:** Billing address auto-populates from vendor
4. **Verify:** Billing address field is not editable (grayed out)
5. Test with vendor that has multiple addresses
6. **Verify:** Default billing address is used
7. Test as different user roles
8. **Verify:** All roles see view-only billing address

### Recommendation
**Use Option A (Form Customization)** - Simplest, fastest, no code.

If need more granular control (some roles can edit), use Option B.

### Edge Cases to Consider
- What if vendor has no billing address? → Display warning
- What if vendor has multiple billing addresses? → Use default
- What if PO needs exception billing address? → Admin override capability

**Solution:** Allow Administrator role to edit, all others view-only.

---

## Issue #45: Communication Section - Purpose & Notes Field

### Issue Description
**User Request:** "Purchase Order - Communication; What is this for; Really just need a place to put notes"

**Business Need:**
- Understand purpose of Communication section
- Need simple notes field for internal communication
- Clarify vs. Memo, Message, and other note fields

### Current State Analysis
- "Communication" section contains:
  - Email field (for PO recipient)
  - Phone field
  - Fax field
- Multiple note fields exist on PO:
  - **Memo:** Internal notes
  - **Message:** Vendor-facing message (prints on PO)
  - **Communication:** Typically contact info for vendor

### Solution Approach: **Training & Field Clarification**

### Answer to User Question

**What is the Communication Section For?**

**Standard Purpose:**
```
Communication Section:
- Email: Vendor contact email for PO delivery
- Phone: Vendor phone number for PO inquiries
- Fax: Vendor fax (legacy, rarely used)

Purpose: Contact information for sending/discussing the PO
```

**Versus Other Note Fields:**
```
┌─────────────────────────────────────────────┐
│ MEMO                                        │
│ • Internal notes (doesn't print)            │
│ • Accounting/purchasing reference           │
│ • Example: "Rush order per John Smith"     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ MESSAGE                                     │
│ • Vendor communication (prints on PO)       │
│ • Delivery instructions, special requests   │
│ • Example: "Deliver to loading dock B"     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ COMMUNICATION (Email/Phone)                 │
│ • Vendor contact information                │
│ • Who to send PO to                         │
│ • Who to call about PO                      │
└─────────────────────────────────────────────┘
```

### If User Needs Additional Notes Field

#### Option A: Use Existing Memo Field
**No customization needed**

**Recommendation:**
- Use **Memo** for internal notes
- Use **Message** for vendor-visible notes
- Use **Communication** for vendor contact info

**Training needed to clarify field purposes**

#### Option B: Add Custom Notes Field
**Complexity:** Low
**Timeline:** 30 minutes
**If existing fields don't meet needs**

**Implementation Steps:**

1. **Create Custom Field**
   ```
   Setup → Customization → Lists, Records, & Fields → Transaction Body Fields
   Click "New"

   Configuration:
   - Label: "Internal Notes"
   - ID: custbody_internal_notes
   - Type: Long Text (or Text Area)
   - Applies To: Purchase Order
   - Store Value: Checked
   - Display Type: Normal

   Help Text: "Internal notes for purchasing team. Does not print on PO."
   ```

2. **Add to PO Form**
   ```
   Customization → Forms → Transaction Forms → Purchase Order
   Edit form → Screen Fields → Custom tab
   Add: custbody_internal_notes
   Position: Below Classification or in footer
   ```

3. **Update PO PDF Template (if needed)**
   ```
   If you want internal notes to print on internal copy only:

   <#if record.custbody_internal_notes?has_content>
     <p><b>Internal Notes:</b></p>
     <p>${record.custbody_internal_notes}</p>
   </#if>
   ```

#### Option C: Repurpose Communication Section
**Complexity:** Low
**Timeline:** 15 minutes
**If Communication section is not used**

**Implementation:**
- Hide Email, Phone, Fax fields
- Rename section to "Internal Notes"
- Add custom notes field in that location

### Recommended Solution

**Recommendation:**
**Use existing Memo field** for internal notes. No customization needed.

**If Memo is already being used for another purpose:**
Add custom "Internal Notes" field (Option B)

### Field Usage Guide for Training

**Create documentation:**

```
┌──────────────────────────────────────────────┐
│ PURCHASE ORDER NOTE FIELDS - QUICK GUIDE    │
├──────────────────────────────────────────────┤
│                                              │
│ MEMO                                         │
│ ✓ Internal use only                         │
│ ✓ Purchasing team reference                 │
│ ✗ Does not print on PO                      │
│ Example: "Approved by CFO on 10/15"         │
│                                              │
│ MESSAGE                                      │
│ ✓ Vendor communication                      │
│ ✓ Prints on PO sent to vendor              │
│ ✗ Not for internal notes                    │
│ Example: "Ship to warehouse B, attention    │
│           receiving manager"                 │
│                                              │
│ COMMUNICATION (Email/Phone)                  │
│ ✓ Vendor contact information                │
│ ✓ Who to send/call about PO                │
│ ✗ Not for notes or messages                 │
│ Example: purchasing@vendor.com              │
│          (555) 123-4567                      │
│                                              │
└──────────────────────────────────────────────┘

BEST PRACTICE:
• Use Memo for internal coordination
• Use Message for vendor instructions
• Use Communication for contact details
```

### Testing Plan
1. Create test PO
2. Fill in Memo field with internal note
3. Fill in Message field with vendor instruction
4. Fill in Communication email/phone
5. Print PO to PDF
6. **Verify:**
   - Message appears on PDF
   - Memo does not appear on PDF
   - Communication appears as contact info
7. Email PO to test email
8. **Verify:** Email goes to Communication email address

### No Development Required (If Using Existing Fields)
This is primarily a **training/documentation issue**.

**Action Items:**
1. Create field usage guide
2. Train users on field purposes
3. Update PO creation procedures
4. Add help text to fields in NetSuite

---

## Implementation Priority & Timeline

### Phase 1: Critical - Approval Workflows (Week 1)
**Duration:** 1 week
**Effort:** 10-15 hours

| Issue | Task | Hours | Priority |
|-------|------|-------|----------|
| #37 | PO Approval Routing | 4 | HIGH |
| #39 | Supervisor Approval Integration | 4 | HIGH |
| #38 | Auto-populate Employee Field | 2 | MEDIUM |
| Testing | Comprehensive workflow testing | 3 | HIGH |
| Documentation | Workflow user guides | 2 | MEDIUM |

**Deliverables:**
- ✅ Approval routing configured
- ✅ Workflows deployed and tested
- ✅ User guides created
- ✅ Role permissions updated

### Phase 2: Form Customization (Week 2)
**Duration:** 3-4 days
**Effort:** 4-6 hours

| Issue | Task | Hours | Priority |
|-------|------|-------|----------|
| #42 | Hide Classification field | 0.25 | LOW |
| #44 | Make Billing view-only | 0.25 | MEDIUM |
| #40 | Configure custom PO numbering | 1 | MEDIUM |
| Testing | Form customization testing | 1 | MEDIUM |
| Documentation | Updated form guides | 1 | LOW |

**Deliverables:**
- ✅ PO form customized
- ✅ Field permissions configured
- ✅ Custom numbering enabled (if desired)
- ✅ Testing completed

### Phase 3: Training & Documentation (Week 2-3)
**Duration:** 1 week
**Effort:** 6-8 hours

| Issue | Task | Hours | Priority |
|-------|------|-------|----------|
| #41 | Memo field documentation | 1 | LOW |
| #43 | UofM training materials | 2 | MEDIUM |
| #45 | Communication section guide | 1 | LOW |
| All Issues | Comprehensive PO user guide | 3 | HIGH |
| Training | User training sessions | 2 | HIGH |

**Deliverables:**
- ✅ Field usage guides
- ✅ UofM training materials
- ✅ Quick reference cards
- ✅ User training completed

### Total Timeline: 2-3 Weeks
**Total Effort:** 20-29 hours

---

## Testing Strategy

### Pre-Deployment Testing (Sandbox)

**Environment:** River-Supply-SB (9910981-sb1)

**Test Plan:**

#### Workflow Testing (Issues #37, #38, #39)
```
Test Case 1: Non-Purchasing User Creates PO
- User: Sales role
- Action: Create PO for $5,000
- Expected: Status = "Pending Supervisor Approval"
- Expected: Employee field auto-populated
- Expected: Supervisor receives notification

Test Case 2: Supervisor Approves PO
- User: Supervisor
- Action: Approve PO from queue
- Expected: Status = "Pending Purchasing Approval"
- Expected: Purchasing receives notification

Test Case 3: Purchasing Final Approval
- User: Purchasing role
- Action: Approve PO
- Expected: Status = "Pending Receipt"
- Expected: Original creator notified

Test Case 4: Purchasing Creates PO Directly
- User: Purchasing role
- Action: Create PO
- Expected: No approval required
- Expected: Status = "Pending Receipt" immediately
- Expected: Employee field auto-populated

Test Case 5: Rejection Flow
- User: Supervisor
- Action: Reject PO with comments
- Expected: PO returns to creator
- Expected: Creator receives rejection notification
```

#### Form Customization Testing (Issues #42, #44)
```
Test Case 6: Classification Hidden
- User: Any role
- Action: Create/edit PO
- Expected: Classification section not visible

Test Case 7: Billing View-Only
- User: Non-admin
- Action: Create PO
- Expected: Billing address auto-populates
- Expected: Billing address not editable
```

#### Custom Numbering Testing (Issue #40)
```
Test Case 8: Manual PO Number Entry
- User: Purchasing role
- Action: Create PO with custom number "VEN-2025-001"
- Expected: System accepts custom number
- Expected: PO saved with custom number

Test Case 9: Duplicate PO Number
- User: Purchasing role
- Action: Try to create PO with existing number
- Expected: Validation error prevents duplicate
```

### User Acceptance Testing (UAT)

**Participants:**
- Purchasing Department (2 users)
- Sales Representative (1 user)
- Inventory Manager (1 user)
- Supervisor/Manager (1 user)

**UAT Duration:** 1 week

**UAT Checklist:**
- [ ] All workflows function as expected
- [ ] Notifications deliver correctly
- [ ] Form customizations meet requirements
- [ ] No negative impact on existing processes
- [ ] Documentation is clear and accurate
- [ ] Training materials are comprehensive
- [ ] Users understand new processes

### Post-Deployment Monitoring

**Week 1 After Deployment:**
- Daily review of Workflow Execution Logs
- Monitor for approval bottlenecks
- Track user questions/issues
- Verify email notifications deliver

**Week 2-4 After Deployment:**
- Weekly review of approval metrics
- Identify process improvements
- Refine documentation based on feedback
- Additional training if needed

---

## Documentation Deliverables

### Technical Documentation

**1. Purchase Order Approval Workflow Technical Specification**
- Workflow logic diagrams
- Approval routing rules
- Status transitions
- Error handling
- SDF deployment instructions

**2. Custom Field Specifications**
- Field definitions
- Usage guidelines
- Validation rules
- Search/report integration

**3. Form Customization Guide**
- PO form changes
- Field visibility rules
- Role-based permissions
- Rollback procedures

### User Documentation

**1. Purchase Order Creation Guide**
- Step-by-step PO creation process
- When approval is required
- How to track approval status
- What to do if PO is rejected

**2. Purchase Order Approval Guide**
- For supervisors: How to approve/reject POs
- For purchasing: Final approval process
- Approval queue management
- Escalation procedures

**3. Field Usage Quick Reference**
- Memo vs. Message vs. Communication
- When to use custom PO numbers
- Unit of Measure guidelines
- Best practices

**4. Troubleshooting Guide**
- Common issues and solutions
- Who to contact for help
- How to check approval status
- How to modify submitted PO

### Training Materials

**1. Video Tutorials**
- Creating a Purchase Order (5 min)
- Approving Purchase Orders (3 min)
- Using Custom PO Numbers (2 min)
- Understanding UofM (4 min)

**2. Quick Reference Cards**
- PO Field Guide (1 page)
- Approval Process Flowchart (1 page)
- When to Use Custom PO Numbers (1 page)

**3. Training Presentation**
- PowerPoint deck covering all 9 issues
- Live demo scenarios
- Q&A section

---

## Risk Assessment & Mitigation

### Risk 1: Approval Bottlenecks
**Risk Level:** MEDIUM
**Impact:** POs stuck in approval, delays orders

**Mitigation:**
- Configure approval escalation (auto-approve after X days)
- Set up backup approvers
- Create approval queue with multiple purchasers
- Monitor approval metrics weekly

### Risk 2: User Confusion on New Process
**Risk Level:** MEDIUM
**Impact:** Incorrect PO creation, approval delays

**Mitigation:**
- Comprehensive training before go-live
- Quick reference cards at every desk
- Internal FAQ document
- Designated "PO Champion" for questions

### Risk 3: Custom PO Numbers - Duplicates
**Risk Level:** LOW
**Impact:** Confusion with vendors, audit issues

**Mitigation:**
- Implement validation script
- Create custom PO number guidelines
- Log all custom numbers for audit
- Restrict custom numbering to Purchasing role only

### Risk 4: Workflow Performance Issues
**Risk Level:** LOW
**Impact:** Slow PO creation, system timeouts

**Mitigation:**
- Test workflows with high volume before deploy
- Monitor governance units
- Optimize workflow logic
- Schedule workflow actions during off-peak

### Risk 5: Integration with Existing Processes
**Risk Level:** MEDIUM
**Impact:** Disruption to current operations

**Mitigation:**
- Phase deployment (workflows first, then forms)
- Maintain parallel processes during transition
- Rollback plan ready
- Sandbox testing before production

---

## Success Metrics

### Quantitative Metrics

**Approval Efficiency:**
- Average approval time: < 24 hours
- Approval rejection rate: < 10%
- Escalation rate: < 5%

**User Adoption:**
- % POs with auto-populated employee: > 95%
- % POs following new approval process: 100%
- % Custom PO numbers with errors: < 2%

**System Performance:**
- Workflow execution time: < 3 seconds
- Form load time: < 2 seconds
- Email notification delivery: > 99%

### Qualitative Metrics

**User Satisfaction:**
- Purchasing team feedback: Positive
- Supervisor feedback: Process is clear
- Sales team feedback: Easy to create POs

**Process Improvement:**
- Reduced PO errors
- Better audit trail
- Improved vendor communication
- Clearer approval accountability

---

## Rollback Plan

### If Critical Issues Arise

**Immediate Rollback (< 1 hour):**

1. **Deactivate Workflows**
   ```
   NetSuite UI:
   Customization → Workflow → Workflows → [Workflow] → Edit
   Check "Is Inactive" → Save
   ```

2. **Revert Role Permissions**
   ```
   Restore FULL permission to all roles for TRAN_PURCHORD
   Remove approval requirements
   ```

3. **Restore Form**
   ```
   Revert to previous PO form version
   Show hidden fields
   Re-enable editing on locked fields
   ```

4. **Communicate to Users**
   ```
   Email blast: "PO system temporarily reverted to previous process"
   Provide workaround instructions
   Estimated resolution time
   ```

**Post-Rollback Analysis:**
- Identify root cause of issues
- Revise implementation plan
- Additional testing in sandbox
- Schedule new deployment

---

## Next Steps & Recommendations

### Immediate Actions (This Week)

1. **Review this action plan with stakeholders**
   - Purchasing Manager
   - IT Director
   - Finance Controller
   - Key users from each department

2. **Prioritize issues**
   - Confirm HIGH/MEDIUM/LOW priorities
   - Adjust timeline based on business needs
   - Identify any blocking dependencies

3. **Approve approach for each issue**
   - Issue #37: Approve routing approach (Option A or B)
   - Issue #40: Decide on custom numbering approach
   - All issues: Confirm recommendations

### Week 1-2: Development & Testing

4. **Implement Phase 1 (Approval Workflows)**
   - Configure approval routing
   - Deploy workflows
   - Update role permissions
   - Test thoroughly in sandbox

5. **Implement Phase 2 (Form Customization)**
   - Hide Classification
   - Lock Billing address
   - Configure custom numbering (if approved)
   - Test form changes

6. **Create documentation**
   - Technical specs
   - User guides
   - Quick reference cards

### Week 3: Training & Deployment

7. **Conduct user training**
   - Group sessions by role
   - Hands-on practice in sandbox
   - Q&A sessions
   - Distribute documentation

8. **Deploy to production**
   - Schedule deployment for low-activity time
   - Execute deployment checklist
   - Monitor for issues
   - Provide real-time support

9. **Post-deployment support**
   - Daily check-ins (Week 1)
   - Monitor workflow logs
   - Address issues quickly
   - Collect feedback

### Ongoing (Month 1-3)

10. **Optimize and refine**
    - Review success metrics
    - Gather user feedback
    - Make adjustments as needed
    - Document lessons learned

---

## Support & Contact Information

### Technical Support
**Primary Contact:** NetSuite Administrator
**Email:** [admin@riversupply.com]
**Phone:** [Phone number]

### Process Questions
**Primary Contact:** Purchasing Manager
**Email:** [purchasing@riversupply.com]
**Phone:** [Phone number]

### Training & Documentation
**Primary Contact:** Training Coordinator
**Email:** [training@riversupply.com]

### Escalation
**Level 1:** NetSuite Administrator
**Level 2:** IT Director
**Level 3:** NetSuite Support (Case #)

---

## Appendices

### Appendix A: Approval Routing Decision Tree
```
┌─────────────────────────────────────┐
│ User Creates Purchase Order         │
└─────────┬───────────────────────────┘
          │
          ▼
     ┌─────────────────────┐
     │ Is user Purchasing? │
     └─────────┬───────────┘
               │
        ┌──────┴──────┐
        │             │
       YES           NO
        │             │
        ▼             ▼
   ┌─────────┐   ┌──────────────┐
   │ Status  │   │ Route to     │
   │ Pending │   │ Supervisor   │
   │ Receipt │   └──────┬───────┘
   │         │          │
   │ No      │          ▼
   │ Approval│    ┌──────────────┐
   │ Needed  │    │ Supervisor   │
   └─────────┘    │ Approves?    │
                  └──────┬───────┘
                         │
                  ┌──────┴──────┐
                  │             │
                 YES           NO
                  │             │
                  ▼             ▼
          ┌──────────────┐  ┌─────────┐
          │ Route to     │  │ Reject  │
          │ Purchasing   │  │ Return  │
          └──────┬───────┘  │ to      │
                 │          │ Creator │
                 ▼          └─────────┘
          ┌──────────────┐
          │ Purchasing   │
          │ Approves?    │
          └──────┬───────┘
                 │
          ┌──────┴──────┐
          │             │
         YES           NO
          │             │
          ▼             ▼
     ┌─────────┐   ┌─────────┐
     │ Status  │   │ Reject  │
     │ Pending │   │ Return  │
     │ Receipt │   │ to      │
     │         │   │ Creator │
     └─────────┘   └─────────┘
```

### Appendix B: Field Mapping Reference

| Field Label | Internal ID | Purpose | Visibility |
|-------------|-------------|---------|-----------|
| Memo | memo | Internal notes | Internal only |
| Message | message | Vendor communication | Prints on PO |
| Employee | employee | PO creator | Internal only |
| Classification | class | Department/project | Hidden (Issue #42) |
| Billing Address | billaddr | Vendor billing | View-only (Issue #44) |
| Communication Email | email | Vendor contact | Visible |
| Communication Phone | phone | Vendor phone | Visible |

### Appendix C: Workflow XML Template Locations

```
Workflow Files (to be created):
- customworkflow_po_purchasing_approval.xml (Issue #37, #39)
- customworkflow_po_employee_auto.xml (Issue #38)

Location:
companies/River-Supply-SB/src/Objects/

Deployment:
Update companies/River-Supply-SB/src/deploy.xml
Add workflow references
Run: npx suitecloud project:deploy
```

### Appendix D: Additional Resources

**NetSuite Documentation:**
- Approval Routing Setup Guide
- Workflow Best Practices
- Transaction Form Customization
- Units of Measure Configuration

**Internal Resources:**
- River Supply PO Policy (if exists)
- Purchasing Procedures Manual (if exists)
- Vendor Management Guidelines (if exists)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-16 | Agent 5 | Initial action plan created |
| | | | All 9 issues analyzed |
| | | | Comprehensive solutions provided |

---

## Approval Signatures

**Reviewed By:**
- [ ] Purchasing Manager: ___________________ Date: _______
- [ ] IT Director: ___________________ Date: _______
- [ ] Finance Controller: ___________________ Date: _______

**Approved for Implementation:**
- [ ] Project Sponsor: ___________________ Date: _______

---

**END OF DOCUMENT**

Total Pages: [This document]
Total Word Count: ~8,500 words
Estimated Reading Time: 30-40 minutes
Implementation Complexity: Medium
Total Effort Estimate: 20-29 hours
Timeline: 2-3 weeks

---

**Document Status:** ✅ COMPLETE - Ready for Review and Implementation

**Next Action:** Schedule stakeholder review meeting to approve approach and timeline.
