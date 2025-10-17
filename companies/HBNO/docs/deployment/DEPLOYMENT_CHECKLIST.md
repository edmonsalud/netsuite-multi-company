# PO Payment Schedule System - Production Deployment Checklist

## Document Information
- **System**: PO Payment Schedule Automation
- **Company**: HBNO (Account ID: 5221064)
- **Version**: 1.0.0
- **Deployment Date**: _____________
- **Deployed By**: _____________
- **Status**: Ready for Production

---

## Table of Contents
1. [Pre-Deployment Verification](#pre-deployment-verification)
2. [Custom Record Setup](#custom-record-setup)
3. [Script File Upload](#script-file-upload)
4. [Script Configuration](#script-configuration)
5. [Payment Terms Configuration](#payment-terms-configuration)
6. [Testing Scenarios](#testing-scenarios)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)
9. [Sign-Off](#sign-off)

---

## Pre-Deployment Verification

### Environment Readiness
- [ ] **NetSuite Account Verified**
  - Account ID: 5221064 (HBNO)
  - Environment: Production
  - Access confirmed with Administrator role

- [ ] **SuiteCloud Development Framework Enabled**
  - Navigate to Setup > Company > Enable Features
  - SuiteCloud tab > SuiteCloud Development Framework checked
  - Server-side Scripting enabled

- [ ] **Required Features Enabled**
  - Custom Records feature enabled
  - User Event Scripts enabled
  - Purchase Order feature enabled

- [ ] **Backup Completed**
  - Recent backup of NetSuite account available
  - Backup date: _____________
  - Backup verified: Yes / No

### Code Review Verification
- [ ] **All Scripts Reviewed**
  - po_payment_schedule_ue.js reviewed
  - All library files reviewed (Constants.js, ValidationHelper.js, DateCalculator.js, PaymentScheduleManager.js)
  - No critical issues identified

- [ ] **Architecture Documentation Reviewed**
  - PO_PAYMENT_SCHEDULE_ARCHITECTURE.md current and accurate
  - All dependencies documented
  - Data flow diagrams validated

- [ ] **Testing Completed**
  - Unit tests passed
  - Integration tests passed
  - User acceptance testing signed off
  - Test results documented: _____________

### Governance & Performance
- [ ] **Script Governance Verified**
  - Estimated governance usage: ~50-100 units per PO
  - Confirmed within account limits
  - No concurrent script conflicts identified

- [ ] **Performance Baseline Established**
  - Expected processing time: < 5 seconds per PO
  - No known performance bottlenecks
  - Monitoring plan in place

---

## Custom Record Setup

### 1. Custom Payment Terms Record

**Record Type ID**: `customrecord_po_terms`

- [ ] **Create Custom Record Type**
  - Navigate to Customization > Lists, Records, & Fields > Record Types > New
  - Name: "Custom Payment Terms"
  - ID: `customrecord_po_terms`
  - Include Name Field: Yes
  - Access: Public

- [ ] **Create Required Fields**

  **Field 1: Payment Term Name**
  - Field ID: `custrecord_po_terms_name`
  - Type: Free-Form Text
  - Label: "Payment Term Name"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes

  **Field 2: Number of Payments**
  - Field ID: `custrecord_number`
  - Type: Integer Number
  - Label: "Number of Payments"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes
  - Default Value: 1
  - Validation: Min = 1, Max = 10

  **Field 3: Native Terms Reference**
  - Field ID: `custrecord_po_terms_term`
  - Type: List/Record (NetSuite Terms list)
  - Label: "Native Payment Terms"
  - Store Value: Yes
  - Show in List: Yes
  - Required: No

- [ ] **Set Record Permissions**
  - Administrator: Full
  - Purchaser: View
  - Accounting: View

- [ ] **Add to Lists Menu**
  - Add to Lists menu under "Accounting"
  - Save and verify accessibility

### 2. Terms Payment Schedule Details Record

**Record Type ID**: `customrecord_terms_payment_sche_details`

- [ ] **Create Custom Record Type**
  - Name: "Terms Payment Schedule Details"
  - ID: `customrecord_terms_payment_sche_details`
  - Include Name Field: No
  - Access: Public
  - Parent Record: None (uses reference field)

- [ ] **Create Required Fields**

  **Field 1: Payment Term (Parent Link)**
  - Field ID: `custrecord_terms_pay_details`
  - Type: List/Record → Custom Payment Terms
  - Label: "Payment Term"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes

  **Field 2: Payment Number**
  - Field ID: `custrecord_terms_pay_number`
  - Type: List/Record → Create custom list with values 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
  - Label: "Payment Number"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes

  **Field 3: Trigger Type**
  - Field ID: `custrecord_terms_payment_sche_trigger`
  - Type: List/Record → Create custom list:
    - 1 = QIMA
    - 2 = On Receipt
    - 3 = After Receipt
    - 4 = On BOL
    - 5 = Advanced Start Production
    - 6 = Advanced Prior to Shipping
  - Label: "Payment Trigger Type"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes

  **Field 4: Percentage**
  - Field ID: `custrecord_terms_payment_sche_perc`
  - Type: Percent
  - Label: "Payment Percentage"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes
  - Validation: Min = 0.01, Max = 100

  **Field 5: Days Offset**
  - Field ID: `custrecord_terms_payment_sche_num_days`
  - Type: Integer Number
  - Label: "Number of Days Offset"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes
  - Default Value: 0
  - Validation: Min = -365, Max = 365

  **Field 6: Description**
  - Field ID: `custrecord_terms_payment_sche_descriptor`
  - Type: Free-Form Text
  - Label: "Payment Description"
  - Store Value: Yes
  - Show in List: Yes
  - Required: No
  - Max Length: 255

- [ ] **Set Record Permissions**
  - Administrator: Full
  - Purchaser: View
  - Accounting: View

- [ ] **Add Sublist to Parent Record**
  - Edit Custom Payment Terms record form
  - Add sublist tab showing related Schedule Details
  - Enable inline editing if desired

### 3. PO Payment Schedule Record

**Record Type ID**: `customrecord_po_payment_schedule`

- [ ] **Create Custom Record Type**
  - Name: "PO Payment Schedule"
  - ID: `customrecord_po_payment_schedule`
  - Include Name Field: No
  - Access: Public

- [ ] **Create Required Fields**

  **Field 1: Purchase Order**
  - Field ID: `custrecord_po_pay_sched_po`
  - Type: List/Record → Purchase Order
  - Label: "Purchase Order"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes

  **Field 2: Payment Due Date**
  - Field ID: `custrecord_po_pay_sched_date`
  - Type: Date
  - Label: "Payment Due Date"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes

  **Field 3: Payment Amount**
  - Field ID: `custrecord_po_pay_sched_amount`
  - Type: Currency
  - Label: "Payment Amount"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes

  **Field 4: Payment Percentage**
  - Field ID: `custrecord_po_pay_sched_percent`
  - Type: Percent
  - Label: "Payment Percentage"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes

  **Field 5: Description**
  - Field ID: `custrecord_po_pay_desc`
  - Type: Free-Form Text
  - Label: "Payment Description"
  - Store Value: Yes
  - Show in List: Yes
  - Required: No

  **Field 6: Payment Number**
  - Field ID: `custrecord_po_pay_num`
  - Type: List/Record → Use same list as Schedule Details Payment Number
  - Label: "Payment Number"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes

  **Field 7: Status**
  - Field ID: `custrecord_pay_sched_stat`
  - Type: List/Record → Create custom list:
    - 1 = OPEN
    - 2 = PAID
    - 3 = CANCELLED
    - 4 = OVERDUE
  - Label: "Payment Status"
  - Store Value: Yes
  - Show in List: Yes
  - Required: Yes
  - Default Value: 1 (OPEN)

- [ ] **Set Record Permissions**
  - Administrator: Full
  - Purchaser: View
  - Accounting: Edit (for status updates)

- [ ] **Create Saved Searches**
  - "Open Payment Schedules" - All OPEN schedules
  - "Overdue Payments" - OPEN schedules with date < today
  - "Payment Schedules by PO" - Group by Purchase Order

### 4. Purchase Order Custom Fields

- [ ] **Create Payment Terms Field**
  - Navigate to Customization > Transaction Body Fields > New
  - Label: "Custom Payment Terms"
  - ID: `custbody_payment_terms_cust`
  - Type: List/Record → Custom Payment Terms
  - Applies To: Purchase Order (check)
  - Store Value: Yes
  - Show in List: Yes
  - Required: No
  - Add to PO form (Main tab)

- [ ] **Verify Date Reference Field**
  - Confirm `custbody1` exists on Purchase Order
  - Type: Date
  - Used as fallback date for payment calculations
  - If not present, create with ID `custbody1`

---

## Script File Upload

### Method 1: SuiteCloud CLI Deployment (Recommended)

- [ ] **Prepare Local Environment**
  ```bash
  cd C:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\HBNO
  ```

- [ ] **Authenticate to NetSuite**
  ```bash
  npx suitecloud account:setup
  ```
  - Account ID: 5221064
  - Authentication method: Browser-based (OAuth 2.0)
  - Role: Administrator

- [ ] **Validate Project**
  ```bash
  npx suitecloud project:validate
  ```
  - Review validation output
  - Address any warnings or errors
  - Document validation result: _____________

- [ ] **Deploy to Production**
  ```bash
  npx suitecloud project:deploy
  ```
  - Deployment time: _____________
  - Deployment ID: _____________
  - Status: Success / Failed

- [ ] **Verify File Upload**
  - Navigate to Documents > Files > SuiteScripts
  - Confirm PO_Payment_Schedule folder exists
  - Verify all files present:
    - po_payment_schedule_ue.js
    - lib/Constants.js
    - lib/ValidationHelper.js
    - lib/DateCalculator.js
    - lib/PaymentScheduleManager.js

### Method 2: Manual File Upload (Alternative)

- [ ] **Create Folder Structure**
  - Navigate to Documents > Files > SuiteScripts
  - Create folder: `PO_Payment_Schedule`
  - Create subfolder: `lib`

- [ ] **Upload Main Script**
  - Upload: `po_payment_schedule_ue.js` to PO_Payment_Schedule/
  - Verify file path: /SuiteScripts/PO_Payment_Schedule/po_payment_schedule_ue.js

- [ ] **Upload Library Files**
  - Upload to PO_Payment_Schedule/lib/:
    - Constants.js
    - ValidationHelper.js
    - DateCalculator.js
    - PaymentScheduleManager.js

- [ ] **Set File Permissions**
  - All files: Available Without Login = No
  - Restrict access to internal users only

---

## Script Configuration

### 1. Create Script Record

- [ ] **Navigate to Script Setup**
  - Customization > Scripting > Scripts > New

- [ ] **Configure Script**
  - Name: "PO Payment Schedule Generator"
  - ID: `customscript_po_payment_schedule`
  - Description: "Automatically generates payment schedules for Purchase Orders based on custom payment terms"
  - Script File: /SuiteScripts/PO_Payment_Schedule/po_payment_schedule_ue.js
  - Owner: Administrator
  - Notify Owner on Error: Yes
  - Owner Email: _____________

- [ ] **Save Script Record**
  - Record ID: _____________
  - Internal ID: _____________

### 2. Create Script Deployment

- [ ] **Deploy Script**
  - Click "Deploy Script" on script record
  - Or: Customization > Scripting > Script Deployments > New

- [ ] **Configure Deployment**
  - Title: "PO Payment Schedule - Production"
  - ID: `customdeploy_po_payment_schedule`
  - Applies To: Purchase Order
  - Status: **Testing** (initially - change to Released after verification)
  - Execute As Role: Administrator
  - Audience: All Roles
  - Event Type: After Submit
  - Log Level: **Audit** (initially - change to Error after verification)

- [ ] **Set Deployment Schedule**
  - Status: Testing
  - Effective Date: Today's date
  - End Date: (Leave blank)

- [ ] **Save Deployment**
  - Deployment ID: _____________
  - Internal ID: _____________

### 3. Script Permissions

- [ ] **Verify Script Execution Permissions**
  - Script runs as Administrator role
  - Has access to:
    - Purchase Order records (View)
    - Custom Payment Terms (View)
    - Terms Payment Schedule Details (View)
    - PO Payment Schedule (Full)

- [ ] **Test Permission Access**
  - Create test PO as different roles
  - Verify script executes properly
  - Document any permission issues: _____________

---

## Payment Terms Configuration

### Create Test Payment Terms

- [ ] **Payment Term 1: Net 30**
  - Navigate to Custom Payment Terms list
  - New Record
  - Payment Term Name: "Net 30"
  - Number of Payments: 1
  - Save record (ID: _____________)

  **Schedule Details**:
  - Payment Number: 1
  - Trigger Type: After Receipt (3)
  - Percentage: 100%
  - Days Offset: 30
  - Description: "Net 30 days after receipt"

- [ ] **Payment Term 2: 50/50 Split**
  - Payment Term Name: "50/50 - Receipt and 30 Days"
  - Number of Payments: 2
  - Save record (ID: _____________)

  **Schedule Detail 1**:
  - Payment Number: 1
  - Trigger Type: On Receipt (2)
  - Percentage: 50%
  - Days Offset: 0
  - Description: "50% on receipt"

  **Schedule Detail 2**:
  - Payment Number: 2
  - Trigger Type: After Receipt (3)
  - Percentage: 50%
  - Days Offset: 30
  - Description: "50% net 30 days"

- [ ] **Payment Term 3: 3-Way Split (Advanced)**
  - Payment Term Name: "30/30/40 QIMA-Receipt-Terms"
  - Number of Payments: 3
  - Save record (ID: _____________)

  **Schedule Detail 1**:
  - Payment Number: 1
  - Trigger Type: QIMA (1)
  - Percentage: 30%
  - Days Offset: 0
  - Description: "30% on QIMA inspection"

  **Schedule Detail 2**:
  - Payment Number: 2
  - Trigger Type: On Receipt (2)
  - Percentage: 30%
  - Days Offset: 0
  - Description: "30% on receipt"

  **Schedule Detail 3**:
  - Payment Number: 3
  - Trigger Type: After Receipt (3)
  - Percentage: 40%
  - Days Offset: 15
  - Description: "40% net 15 days after receipt"

### Validation Checks

- [ ] **Verify Percentage Totals**
  - Net 30: Total = 100% ✓
  - 50/50 Split: Total = 100% ✓
  - 3-Way Split: Total = 100% ✓

- [ ] **Verify Payment Number Sequence**
  - All terms have sequential payment numbers (1, 2, 3, etc.)
  - No duplicate payment numbers within same term
  - No gaps in sequence

---

## Testing Scenarios

### Test 1: Basic PO Creation with Net 30 Terms

- [ ] **Setup**
  - Create new Purchase Order
  - Vendor: (Select any vendor)
  - Amount: $1,000.00
  - Custom Payment Terms: "Net 30"
  - custbody1 (Date Reference): Today's date

- [ ] **Execute**
  - Add line items totaling $1,000
  - Save Purchase Order
  - PO ID: _____________

- [ ] **Verify Results**
  - 1 payment schedule record created
  - Payment amount = $1,000.00
  - Payment percentage = 100%
  - Payment due date = Today + 30 days
  - Status = OPEN
  - Description contains "Net 30 days after receipt"

- [ ] **Check Logs**
  - Navigate to Customization > Scripting > Script Execution Log
  - Filter by script and PO date
  - Verify AUDIT log shows successful creation
  - No errors logged
  - Test Result: Pass / Fail
  - Notes: _____________

### Test 2: 50/50 Split Payment Terms

- [ ] **Setup**
  - Create new Purchase Order
  - Amount: $5,000.00
  - Custom Payment Terms: "50/50 - Receipt and 30 Days"
  - custbody1: Today's date

- [ ] **Execute**
  - Save Purchase Order
  - PO ID: _____________

- [ ] **Verify Results**
  - 2 payment schedule records created
  - Payment 1: $2,500.00 (50%), Due: Today
  - Payment 2: $2,500.00 (50%), Due: Today + 30 days
  - Both status = OPEN
  - Total of payments = $5,000.00

- [ ] **Test Result**: Pass / Fail
- [ ] **Notes**: _____________

### Test 3: 3-Way Split with Rounding

- [ ] **Setup**
  - Create new Purchase Order
  - Amount: $10,000.01 (tests rounding)
  - Custom Payment Terms: "30/30/40 QIMA-Receipt-Terms"
  - custbody1: Today's date

- [ ] **Execute**
  - Save Purchase Order
  - PO ID: _____________

- [ ] **Verify Results**
  - 3 payment schedule records created
  - Payment 1: $3,000.00 (30%)
  - Payment 2: $3,000.00 (30%)
  - Payment 3: $4,000.01 (40%, adjusted for rounding)
  - Total = $10,000.01 (matches PO exactly)

- [ ] **Test Result**: Pass / Fail
- [ ] **Notes**: _____________

### Test 4: PO Without Payment Terms

- [ ] **Setup**
  - Create new Purchase Order
  - Amount: $1,000.00
  - Custom Payment Terms: (Leave blank)

- [ ] **Execute**
  - Save Purchase Order
  - PO ID: _____________

- [ ] **Verify Results**
  - No payment schedule records created
  - No errors thrown
  - Script logs show: "No custom payment terms set on PO"
  - PO saves successfully

- [ ] **Test Result**: Pass / Fail
- [ ] **Notes**: _____________

### Test 5: Performance Test (Multiple POs)

- [ ] **Setup**
  - Create 5 Purchase Orders with different payment terms
  - Mix of Net 30, 50/50, and 3-Way split
  - Total amount across all POs: $50,000

- [ ] **Execute**
  - Save all POs within 5-minute window
  - Record save times

- [ ] **Verify Results**
  - All payment schedules created correctly
  - Average processing time per PO: _________ seconds
  - No governance errors
  - No timeout errors

- [ ] **Test Result**: Pass / Fail
- [ ] **Notes**: _____________

### Test 6: Error Handling - Invalid Configuration

- [ ] **Setup**
  - Create payment term with percentages NOT totaling 100%
  - Example: Two payments at 40% and 50% (total 90%)

- [ ] **Execute**
  - Create PO with this invalid payment term
  - Attempt to save

- [ ] **Verify Results**
  - Script validation catches the error
  - User-friendly error message displayed
  - Error logged in Script Execution Log
  - PO is NOT saved (or saved without schedules)

- [ ] **Test Result**: Pass / Fail
- [ ] **Notes**: _____________

### Test 7: Weekend Date Adjustment

- [ ] **Setup**
  - Create payment term with due date falling on Saturday
  - Example: PO created on Friday, Net 1 day term

- [ ] **Execute**
  - Save Purchase Order

- [ ] **Verify Results**
  - Payment due date adjusted to Monday (next business day)
  - Adjustment logged in script execution log

- [ ] **Test Result**: Pass / Fail
- [ ] **Notes**: _____________

---

## Post-Deployment Verification

### Immediate Checks (Within 1 Hour)

- [ ] **Script Status**
  - Script deployment is active
  - Status: Testing (will change to Released after full verification)
  - No deployment errors

- [ ] **Log Review**
  - Check Script Execution Log
  - All test POs processed successfully
  - No unexpected errors or warnings
  - Log entries show expected behavior

- [ ] **Data Integrity**
  - All test payment schedules created
  - Amounts and dates accurate
  - No orphaned or duplicate records
  - Parent-child relationships intact

### Day 1 Verification

- [ ] **Monitor Production Activity**
  - Review all POs created today
  - Count: _________ POs processed
  - Count: _________ Payment schedules created
  - Issues identified: _____________

- [ ] **User Feedback**
  - Contact purchasing team
  - Any errors or unexpected behavior reported?
  - User satisfaction: High / Medium / Low

- [ ] **Performance Review**
  - Average script execution time: _________ seconds
  - Governance usage: Within limits
  - No performance degradation reported

### Week 1 Monitoring

- [ ] **Daily Log Review**
  - Day 1: Reviewed, Issues: _____________
  - Day 2: Reviewed, Issues: _____________
  - Day 3: Reviewed, Issues: _____________
  - Day 4: Reviewed, Issues: _____________
  - Day 5: Reviewed, Issues: _____________

- [ ] **Sample Audit**
  - Randomly select 10 POs
  - Verify payment schedules are accurate
  - Check date calculations
  - Verify amount calculations
  - All 10 verified: Yes / No
  - Issues found: _____________

- [ ] **Performance Metrics**
  - Total POs processed: _____________
  - Total schedules created: _____________
  - Average processing time: _________ seconds
  - Error rate: _________%
  - Target error rate: < 1%

### Status Change to "Released"

- [ ] **All Verifications Passed**
  - All test scenarios pass
  - Week 1 monitoring complete with no critical issues
  - User acceptance confirmed
  - Performance within acceptable limits

- [ ] **Change Deployment Status**
  - Navigate to Script Deployment
  - Change Status from "Testing" to "Released"
  - Change Log Level from "Audit" to "Error"
  - Save changes
  - Status change date: _____________

- [ ] **Document Status**
  - Update deployment documentation
  - Notify stakeholders of production status
  - Archive test data

---

## Rollback Procedures

### Rollback Triggers

**Immediate Rollback Required If**:
- [ ] Critical errors affecting > 10% of POs
- [ ] Data integrity issues detected
- [ ] Governance limits exceeded causing script failures
- [ ] System performance degradation
- [ ] Security vulnerabilities discovered

### Rollback Steps

#### Step 1: Disable Script Deployment

- [ ] **Immediate Action**
  - Navigate to Customization > Scripting > Script Deployments
  - Find "PO Payment Schedule - Production"
  - Change Status to "Not Scheduled"
  - Save immediately
  - Time disabled: _____________

- [ ] **Notify Stakeholders**
  - Email: IT team, purchasing manager, project sponsor
  - Subject: "PO Payment Schedule Script Disabled - Investigating Issue"
  - Include: Reason for rollback, estimated resolution time

#### Step 2: Assess Impact

- [ ] **Identify Affected Records**
  - Run saved search for payment schedules created since deployment
  - Count of affected POs: _____________
  - Count of payment schedules: _____________

- [ ] **Data Quality Check**
  - Review affected payment schedules
  - Identify incorrect data
  - Document issues: _____________

#### Step 3: Clean Up (If Necessary)

- [ ] **Delete Incorrect Records (Use with Caution)**
  - Create backup export of all payment schedules
  - Backup file: _____________
  - Delete only clearly incorrect records
  - Records deleted: _____________

- [ ] **Manual Corrections**
  - If some schedules are partially correct, correct manually
  - Document all manual changes
  - Correction log: _____________

#### Step 4: Root Cause Analysis

- [ ] **Review Logs**
  - Analyze script execution logs
  - Identify error patterns
  - Document root cause: _____________

- [ ] **Code Review**
  - Review script code for bugs
  - Check library functions
  - Test in sandbox environment

- [ ] **Fix Development**
  - Develop fix in sandbox
  - Test fix thoroughly
  - Document changes: _____________

#### Step 5: Redeployment Decision

- [ ] **Fix Verification**
  - All tests pass in sandbox
  - Root cause resolved
  - No new issues introduced

- [ ] **Approval for Redeployment**
  - Technical Lead approval: _____________
  - Business Owner approval: _____________
  - Date approved: _____________

- [ ] **Redeploy to Production**
  - Follow full deployment checklist again
  - Enhanced monitoring for first 48 hours
  - Redeployment date: _____________

### Emergency Contact Information

**Deployment Team**:
- Technical Lead: _____________ | Phone: _____________ | Email: _____________
- Developer: _____________ | Phone: _____________ | Email: _____________
- NetSuite Admin: _____________ | Phone: _____________ | Email: _____________

**Business Stakeholders**:
- Purchasing Manager: _____________ | Phone: _____________ | Email: _____________
- Accounting Lead: _____________ | Phone: _____________ | Email: _____________
- Project Sponsor: _____________ | Phone: _____________ | Email: _____________

---

## Sign-Off

### Deployment Approval

**Pre-Deployment Sign-Off**:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | _____________ | _____________ | ________ |
| Business Owner | _____________ | _____________ | ________ |
| NetSuite Administrator | _____________ | _____________ | ________ |
| QA Lead | _____________ | _____________ | ________ |

**Post-Deployment Sign-Off**:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | _____________ | _____________ | ________ |
| Business Owner | _____________ | _____________ | ________ |
| NetSuite Administrator | _____________ | _____________ | ________ |

### Deployment Notes

**Deployment Start Time**: _____________

**Deployment End Time**: _____________

**Total Deployment Duration**: _____________

**Issues Encountered**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

**Resolutions Applied**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

**Final Status**: Success / Partial Success / Failed

**Next Steps**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

---

## Appendix

### A. Quick Reference - Custom Record IDs

| Custom Record | ID |
|--------------|-----|
| Custom Payment Terms | customrecord_po_terms |
| Terms Payment Schedule Details | customrecord_terms_payment_sche_details |
| PO Payment Schedule | customrecord_po_payment_schedule |

### B. Quick Reference - Field IDs

**Purchase Order Fields**:
- Custom Payment Terms: custbody_payment_terms_cust
- Date Reference: custbody1

**Payment Terms Fields**:
- Name: custrecord_po_terms_name
- Number of Payments: custrecord_number

**Schedule Details Fields**:
- Parent Term: custrecord_terms_pay_details
- Payment Number: custrecord_terms_pay_number
- Trigger Type: custrecord_terms_payment_sche_trigger
- Percentage: custrecord_terms_payment_sche_perc
- Days Offset: custrecord_terms_payment_sche_num_days
- Description: custrecord_terms_payment_sche_descriptor

**Payment Schedule Fields**:
- Purchase Order: custrecord_po_pay_sched_po
- Date: custrecord_po_pay_sched_date
- Amount: custrecord_po_pay_sched_amount
- Percentage: custrecord_po_pay_sched_percent
- Description: custrecord_po_pay_desc
- Payment Number: custrecord_po_pay_num
- Status: custrecord_pay_sched_stat

### C. Trigger Type Values

| ID | Name | Description |
|----|------|-------------|
| 1 | QIMA | Quality Inspection Management Application |
| 2 | On Receipt | Payment due on item receipt date |
| 3 | After Receipt | Payment due X days after receipt |
| 4 | On BOL | Payment due on Bill of Lading |
| 5 | Advanced Start Production | Payment due at production start |
| 6 | Advanced Prior to Shipping | Payment due before shipping |

### D. Status Values

| ID | Name | Description |
|----|------|-------------|
| 1 | OPEN | Payment pending |
| 2 | PAID | Payment completed |
| 3 | CANCELLED | Payment cancelled |
| 4 | OVERDUE | Payment past due date |

---

**Document Version**: 1.0
**Last Updated**: 2025-10-14
**Next Review Date**: _____________
