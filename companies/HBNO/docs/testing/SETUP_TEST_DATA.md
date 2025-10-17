# PO Payment Schedule System - Test Data Setup Guide

## Document Information
- **System**: PO Payment Schedule Automation
- **Company**: HBNO (Account ID: 5221064)
- **Version**: 1.0.0
- **Purpose**: Guide for setting up comprehensive test data
- **Last Updated**: 2025-10-14

---

## Table of Contents
1. [Overview](#overview)
2. [Custom Lists Setup](#custom-lists-setup)
3. [Sample Payment Terms](#sample-payment-terms)
4. [Test Purchase Orders](#test-purchase-orders)
5. [Expected Results](#expected-results)
6. [Validation Queries](#validation-queries)
7. [Edge Case Testing](#edge-case-testing)
8. [Performance Testing Data](#performance-testing-data)

---

## Overview

This guide provides step-by-step instructions for creating comprehensive test data for the PO Payment Schedule system. Follow this guide to create realistic test scenarios that validate all system functionality.

### Testing Objectives

1. Validate basic payment schedule generation
2. Test multiple payment configurations
3. Verify date calculation accuracy
4. Confirm amount calculation and rounding
5. Test error handling and validation
6. Verify performance under load
7. Validate edge cases and boundary conditions

---

## Custom Lists Setup

### 1. Payment Number List

**List Name**: Payment Numbers
**List ID**: customlist_payment_numbers

Navigate to: Customization > Lists, Records, & Fields > Custom Lists > New

Create list values:
- 1 = Payment 1
- 2 = Payment 2
- 3 = Payment 3
- 4 = Payment 4
- 5 = Payment 5
- 6 = Payment 6
- 7 = Payment 7
- 8 = Payment 8
- 9 = Payment 9
- 10 = Payment 10

**Usage**: Used in both Schedule Details and Payment Schedule records

### 2. Payment Trigger Type List

**List Name**: Payment Trigger Types
**List ID**: customlist_payment_trigger_types

Create list values:
- 1 = QIMA
- 2 = On Receipt
- 3 = After Receipt
- 4 = On BOL
- 5 = Advanced Start Production
- 6 = Advanced Prior to Shipping

**Usage**: Defines when payment becomes due

### 3. Payment Schedule Status List

**List Name**: Payment Schedule Status
**List ID**: customlist_payment_schedule_status

Create list values:
- 1 = OPEN
- 2 = PAID
- 3 = CANCELLED
- 4 = OVERDUE

**Usage**: Tracks payment schedule status

---

## Sample Payment Terms

### Payment Term 1: Net 30 (Single Payment)

**Purpose**: Basic single payment term - most common scenario

**Configuration**:
- **Name**: "Net 30 Days After Receipt"
- **Number of Payments**: 1
- **Active**: Yes

**Schedule Details**:

| Payment # | Trigger Type | Percentage | Days Offset | Description |
|-----------|--------------|------------|-------------|-------------|
| 1 | After Receipt (3) | 100% | 30 | Full payment net 30 days |

**Test Scenarios**:
- Standard PO processing
- Receipt-based date fallback to custbody1
- Single payment calculation

---

### Payment Term 2: 50/50 Split (Two Payments)

**Purpose**: Test dual payment configuration

**Configuration**:
- **Name**: "50/50 - Receipt and Net 30"
- **Number of Payments**: 2
- **Active**: Yes

**Schedule Details**:

| Payment # | Trigger Type | Percentage | Days Offset | Description |
|-----------|--------------|------------|-------------|-------------|
| 1 | On Receipt (2) | 50% | 0 | 50% on receipt |
| 2 | After Receipt (3) | 50% | 30 | 50% net 30 days |

**Test Scenarios**:
- Even split payment calculation
- Multiple payment dates
- Receipt date dependency

---

### Payment Term 3: 30/30/40 Three-Way Split

**Purpose**: Test complex multi-payment configuration with rounding

**Configuration**:
- **Name**: "30/30/40 QIMA-Receipt-Terms"
- **Number of Payments**: 3
- **Active**: Yes

**Schedule Details**:

| Payment # | Trigger Type | Percentage | Days Offset | Description |
|-----------|--------------|------------|-------------|-------------|
| 1 | QIMA (1) | 30% | 0 | 30% on QIMA inspection |
| 2 | On Receipt (2) | 30% | 0 | 30% on receipt |
| 3 | After Receipt (3) | 40% | 15 | 40% net 15 days |

**Test Scenarios**:
- Three payment calculation
- QIMA trigger type
- Rounding adjustment on last payment
- Mixed trigger types

---

### Payment Term 4: 20/80 Advance Payment

**Purpose**: Test advance payment scenario with negative offset

**Configuration**:
- **Name**: "20% Advance / 80% on Receipt"
- **Number of Payments**: 2
- **Active**: Yes

**Schedule Details**:

| Payment # | Trigger Type | Percentage | Days Offset | Description |
|-----------|--------------|------------|-------------|-------------|
| 1 | Advanced Prior to Shipping (6) | 20% | -7 | 20% advance (7 days before ship) |
| 2 | On Receipt (2) | 80% | 0 | 80% on receipt |

**Test Scenarios**:
- Negative days offset
- Advance payment trigger
- Large percentage difference

---

### Payment Term 5: Quarterly Payments (Four Payments)

**Purpose**: Test quarterly distribution

**Configuration**:
- **Name**: "Quarterly - 25% Each Quarter"
- **Number of Payments**: 4
- **Active**: Yes

**Schedule Details**:

| Payment # | Trigger Type | Percentage | Days Offset | Description |
|-----------|--------------|------------|-------------|-------------|
| 1 | After Receipt (3) | 25% | 30 | Q1 - 30 days |
| 2 | After Receipt (3) | 25% | 90 | Q2 - 90 days |
| 3 | After Receipt (3) | 25% | 180 | Q3 - 180 days |
| 4 | After Receipt (3) | 25% | 270 | Q4 - 270 days |

**Test Scenarios**:
- Extended payment terms
- Four equal payments
- Long-term payment schedules

---

### Payment Term 6: 10/20/30/40 Weighted Payments

**Purpose**: Test unequal distribution across four payments

**Configuration**:
- **Name**: "10/20/30/40 Weighted Payments"
- **Number of Payments**: 4
- **Active**: Yes

**Schedule Details**:

| Payment # | Trigger Type | Percentage | Days Offset | Description |
|-----------|--------------|------------|-------------|-------------|
| 1 | On Receipt (2) | 10% | 0 | 10% on receipt |
| 2 | After Receipt (3) | 20% | 15 | 20% net 15 days |
| 3 | After Receipt (3) | 30% | 30 | 30% net 30 days |
| 4 | After Receipt (3) | 40% | 45 | 40% net 45 days |

**Test Scenarios**:
- Weighted payment distribution
- Progressive payment amounts
- Complex rounding scenarios

---

### Payment Term 7: BOL-Based Payment

**Purpose**: Test Bill of Lading trigger

**Configuration**:
- **Name**: "100% on BOL"
- **Number of Payments**: 1
- **Active**: Yes

**Schedule Details**:

| Payment # | Trigger Type | Percentage | Days Offset | Description |
|-----------|--------------|------------|-------------|-------------|
| 1 | On BOL (4) | 100% | 0 | Full payment on Bill of Lading |

**Test Scenarios**:
- BOL trigger type
- Single BOL-based payment

---

### Payment Term 8: Production-Based Payments

**Purpose**: Test production milestone triggers

**Configuration**:
- **Name**: "30% Start / 70% Ship"
- **Number of Payments**: 2
- **Active**: Yes

**Schedule Details**:

| Payment # | Trigger Type | Percentage | Days Offset | Description |
|-----------|--------------|------------|-------------|-------------|
| 1 | Advanced Start Production (5) | 30% | 0 | 30% at production start |
| 2 | Advanced Prior to Shipping (6) | 70% | 0 | 70% before shipping |

**Test Scenarios**:
- Production milestone triggers
- Advanced payment types

---

## Test Purchase Orders

### Test PO Set 1: Basic Validation

#### PO-001: Standard Net 30
- **Vendor**: Any active vendor
- **Amount**: $1,000.00
- **Payment Terms**: "Net 30 Days After Receipt"
- **custbody1**: Today's date
- **Line Items**: 1 item, quantity 10, rate $100

**Expected Schedule**:
- 1 payment: $1,000.00, Due: Today + 30 days

---

#### PO-002: 50/50 Split
- **Vendor**: Any active vendor
- **Amount**: $5,000.00
- **Payment Terms**: "50/50 - Receipt and Net 30"
- **custbody1**: Today's date
- **Line Items**: 1 item, quantity 50, rate $100

**Expected Schedule**:
- Payment 1: $2,500.00, Due: Today
- Payment 2: $2,500.00, Due: Today + 30 days
- Total: $5,000.00

---

#### PO-003: Three-Way Split
- **Vendor**: Any active vendor
- **Amount**: $10,000.00
- **Payment Terms**: "30/30/40 QIMA-Receipt-Terms"
- **custbody1**: Today's date
- **Line Items**: 2 items, total $10,000

**Expected Schedule**:
- Payment 1: $3,000.00, Due: Today (QIMA)
- Payment 2: $3,000.00, Due: Today (Receipt)
- Payment 3: $4,000.00, Due: Today + 15 days
- Total: $10,000.00

---

### Test PO Set 2: Rounding Tests

#### PO-004: Rounding Test - Small Amount
- **Vendor**: Any active vendor
- **Amount**: $100.01
- **Payment Terms**: "30/30/40 QIMA-Receipt-Terms"
- **custbody1**: Today's date

**Expected Schedule**:
- Payment 1: $30.00 (30.003 rounded)
- Payment 2: $30.00 (30.003 rounded)
- Payment 3: $40.01 (adjusted for rounding)
- Total: $100.01

---

#### PO-005: Rounding Test - Odd Amount
- **Vendor**: Any active vendor
- **Amount**: $999.99
- **Payment Terms**: "30/30/40 QIMA-Receipt-Terms"
- **custbody1**: Today's date

**Expected Schedule**:
- Payment 1: $300.00 (30%)
- Payment 2: $300.00 (30%)
- Payment 3: $399.99 (40% + rounding adjustment)
- Total: $999.99

---

#### PO-006: Rounding Test - Large Amount
- **Vendor**: Any active vendor
- **Amount**: $1,234,567.89
- **Payment Terms**: "30/30/40 QIMA-Receipt-Terms"
- **custbody1**: Today's date

**Expected Schedule**:
- Payment 1: $370,370.37 (30%)
- Payment 2: $370,370.37 (30%)
- Payment 3: $493,827.15 (40% + rounding)
- Total: $1,234,567.89

---

### Test PO Set 3: Edge Cases

#### PO-007: No Payment Terms
- **Vendor**: Any active vendor
- **Amount**: $1,000.00
- **Payment Terms**: (Leave blank)
- **custbody1**: Today's date

**Expected Behavior**:
- No payment schedules created
- No error thrown
- PO saves successfully
- Log shows: "No custom payment terms set on PO"

---

#### PO-008: Minimum Amount
- **Vendor**: Any active vendor
- **Amount**: $0.01
- **Payment Terms**: "50/50 - Receipt and Net 30"
- **custbody1**: Today's date

**Expected Schedule**:
- Payment 1: $0.01 (rounding adjustment)
- Payment 2: $0.00 (or $0.01 - depends on rounding)
- Total: $0.01

---

#### PO-009: Weekend Date Test
- **Vendor**: Any active vendor
- **Amount**: $1,000.00
- **Payment Terms**: "Net 30 Days After Receipt"
- **custbody1**: Friday (ensure Net 30 falls on Saturday)

**Expected Schedule**:
- 1 payment: $1,000.00
- Due date: Following Monday (weekend adjustment)

---

#### PO-010: Negative Offset Test
- **Vendor**: Any active vendor
- **Amount**: $10,000.00
- **Payment Terms**: "20% Advance / 80% on Receipt"
- **custbody1**: Today + 30 days

**Expected Schedule**:
- Payment 1: $2,000.00, Due: Today + 23 days (30 - 7)
- Payment 2: $8,000.00, Due: Today + 30 days

---

### Test PO Set 4: Multi-Item POs

#### PO-011: Multi-Item, Multiple Lines
- **Vendor**: Any active vendor
- **Amount**: $15,750.00
- **Payment Terms**: "10/20/30/40 Weighted Payments"
- **custbody1**: Today's date
- **Line Items**:
  - Item 1: Qty 100, Rate $50.00 = $5,000
  - Item 2: Qty 200, Rate $35.00 = $7,000
  - Item 3: Qty 75, Rate $50.00 = $3,750

**Expected Schedule**:
- Payment 1: $1,575.00 (10%)
- Payment 2: $3,150.00 (20%)
- Payment 3: $4,725.00 (30%)
- Payment 4: $6,300.00 (40%)
- Total: $15,750.00

---

## Expected Results

### Success Criteria

For each test PO, verify the following:

#### 1. Payment Schedule Creation
- [ ] Correct number of payment schedules created
- [ ] All schedules linked to correct PO
- [ ] All schedules have Status = OPEN (1)

#### 2. Amount Calculations
- [ ] Each payment amount matches expected percentage
- [ ] All payment amounts sum to PO total exactly
- [ ] Rounding handled correctly (last payment adjusted)
- [ ] No negative amounts
- [ ] Currency precision (2 decimal places)

#### 3. Date Calculations
- [ ] Payment due dates calculated correctly
- [ ] Days offset applied accurately
- [ ] Weekend adjustments applied (if implemented)
- [ ] Dates in correct format
- [ ] No dates in the past (warnings only)

#### 4. Data Integrity
- [ ] Payment numbers sequential (1, 2, 3, etc.)
- [ ] All required fields populated
- [ ] Descriptions populated correctly
- [ ] Percentages match configuration
- [ ] No duplicate payment numbers for same PO

#### 5. Script Execution
- [ ] Script executes without errors
- [ ] Execution time < 5 seconds per PO
- [ ] Governance usage within limits
- [ ] Audit logs show successful creation
- [ ] No unexpected warnings or errors

---

## Validation Queries

### Query 1: Verify All Payment Schedules Created

```javascript
// Run in Console or Saved Search
// Customization > Scripting > Script Console

require(['N/search'], function(search) {
    var scheduleSearch = search.create({
        type: 'customrecord_po_payment_schedule',
        filters: [
            ['custrecord_po_pay_sched_po', 'anyof', 'PO_ID'] // Replace with actual PO ID
        ],
        columns: [
            'custrecord_po_pay_num',
            'custrecord_po_pay_sched_date',
            'custrecord_po_pay_sched_amount',
            'custrecord_po_pay_sched_percent',
            'custrecord_pay_sched_stat'
        ]
    });

    var results = [];
    scheduleSearch.run().each(function(result) {
        results.push({
            paymentNum: result.getValue('custrecord_po_pay_num'),
            date: result.getValue('custrecord_po_pay_sched_date'),
            amount: result.getValue('custrecord_po_pay_sched_amount'),
            percentage: result.getValue('custrecord_po_pay_sched_percent'),
            status: result.getValue('custrecord_pay_sched_stat')
        });
        return true;
    });

    console.log('Payment Schedules:', JSON.stringify(results, null, 2));
    return results;
});
```

---

### Query 2: Verify Amount Totals Match PO Total

```javascript
// Verify payment schedules sum to PO total

require(['N/search', 'N/record'], function(search, record) {
    var poId = 'PO_ID'; // Replace with actual PO ID

    // Load PO to get total
    var poRecord = record.load({
        type: record.Type.PURCHASE_ORDER,
        id: poId
    });
    var poTotal = poRecord.getValue('total');

    // Sum payment schedules
    var scheduleSearch = search.create({
        type: 'customrecord_po_payment_schedule',
        filters: [
            ['custrecord_po_pay_sched_po', 'anyof', poId]
        ],
        columns: [
            search.createColumn({
                name: 'custrecord_po_pay_sched_amount',
                summary: 'SUM'
            })
        ]
    });

    var scheduleTotal = 0;
    scheduleSearch.run().each(function(result) {
        scheduleTotal = parseFloat(result.getValue({
            name: 'custrecord_po_pay_sched_amount',
            summary: 'SUM'
        }));
        return false;
    });

    var difference = Math.abs(poTotal - scheduleTotal);
    var isValid = difference < 0.01; // Allow for rounding to 2 decimal places

    console.log('PO Total:', poTotal);
    console.log('Schedule Total:', scheduleTotal);
    console.log('Difference:', difference);
    console.log('Valid:', isValid);

    return {
        poTotal: poTotal,
        scheduleTotal: scheduleTotal,
        difference: difference,
        isValid: isValid
    };
});
```

---

### Query 3: Find Payment Schedules with Issues

```javascript
// Find potential issues in payment schedules

require(['N/search'], function(search) {

    // Issue 1: Negative amounts
    var negativeAmounts = search.create({
        type: 'customrecord_po_payment_schedule',
        filters: [
            ['custrecord_po_pay_sched_amount', 'lessthan', '0']
        ],
        columns: ['custrecord_po_pay_sched_po', 'custrecord_po_pay_sched_amount']
    });

    console.log('Negative Amounts Found:', negativeAmounts.runPaged().count);

    // Issue 2: Missing required fields
    var missingFields = search.create({
        type: 'customrecord_po_payment_schedule',
        filters: [
            ['custrecord_po_pay_sched_po', 'anyof', '@NONE@'],
            'OR',
            ['custrecord_po_pay_sched_date', 'isempty', ''],
            'OR',
            ['custrecord_po_pay_sched_amount', 'isempty', '']
        ],
        columns: ['internalid']
    });

    console.log('Missing Required Fields:', missingFields.runPaged().count);

    // Issue 3: Duplicate payment numbers for same PO
    var duplicatePayments = search.create({
        type: 'customrecord_po_payment_schedule',
        filters: [],
        columns: [
            'custrecord_po_pay_sched_po',
            'custrecord_po_pay_num',
            search.createColumn({
                name: 'internalid',
                summary: 'COUNT'
            })
        ]
    });

    var duplicates = [];
    duplicatePayments.run().each(function(result) {
        var count = parseInt(result.getValue({
            name: 'internalid',
            summary: 'COUNT'
        }));
        if (count > 1) {
            duplicates.push({
                po: result.getValue('custrecord_po_pay_sched_po'),
                paymentNum: result.getValue('custrecord_po_pay_num'),
                count: count
            });
        }
        return true;
    });

    console.log('Duplicate Payment Numbers:', duplicates.length);
    console.log('Details:', JSON.stringify(duplicates, null, 2));
});
```

---

### Saved Search: Open Payment Schedules

**Search Name**: PO Payment Schedules - All Open
**Search Type**: Custom Record: PO Payment Schedule

**Criteria**:
- Status = OPEN (1)

**Results Columns**:
- Purchase Order
- Payment Number
- Payment Due Date
- Payment Amount
- Payment Percentage
- Description
- Status

**Sort By**: Purchase Order, Payment Number

**Usage**: Monitor all open payment schedules

---

### Saved Search: Payment Schedule Totals by PO

**Search Name**: PO Payment Schedule - Totals by PO
**Search Type**: Custom Record: PO Payment Schedule

**Criteria**:
- (None - show all)

**Results Columns**:
- Purchase Order (Group)
- Payment Amount (SUM)
- Internal ID (COUNT)

**Summary Type**: Group

**Usage**: Verify payment totals match PO totals

---

### Saved Search: Recently Created Payment Schedules

**Search Name**: PO Payment Schedules - Recent
**Search Type**: Custom Record: PO Payment Schedule

**Criteria**:
- Date Created is within last 7 days

**Results Columns**:
- Purchase Order
- Payment Number
- Payment Due Date
- Payment Amount
- Status
- Date Created
- Created By

**Sort By**: Date Created (descending)

**Usage**: Monitor recent schedule creation for testing

---

## Edge Case Testing

### Edge Case 1: Invalid Payment Term Configuration

**Setup**:
Create payment term with percentages NOT totaling 100%

**Configuration**:
- Name: "Invalid - 90% Total"
- Number of Payments: 2
- Payment 1: 40%
- Payment 2: 50%
- Total: 90% (INVALID)

**Test**:
1. Create PO with this payment term
2. Save PO

**Expected Result**:
- Validation error caught
- Error message displayed to user
- Script execution log shows validation failure
- No payment schedules created (or PO save blocked)

---

### Edge Case 2: Zero Amount PO

**Setup**:
Create PO with $0.00 total

**Test**:
1. Create PO with no line items or $0 items
2. Assign payment term
3. Save PO

**Expected Result**:
- Script handles gracefully
- Either no schedules created or all schedules = $0.00
- No errors thrown
- Appropriate warning logged

---

### Edge Case 3: Extremely Large Amount

**Setup**:
Create PO with very large total

**Test**:
- Amount: $999,999,999.99
- Payment Terms: "30/30/40 QIMA-Receipt-Terms"

**Expected Result**:
- All calculations handle large numbers
- No overflow errors
- Rounding still accurate
- All payments sum to total

---

### Edge Case 4: Duplicate PO Save

**Setup**:
Create PO, save, then edit and save again

**Test**:
1. Create PO with payment term
2. Save (schedules created)
3. Edit PO (change vendor or item)
4. Save again

**Expected Result**:
- Script detects existing schedules
- Does not create duplicates
- Log shows: "Payment schedules already exist"
- No errors thrown

---

## Performance Testing Data

### Performance Test 1: Concurrent PO Creation

**Objective**: Verify system handles multiple simultaneous PO creations

**Setup**:
- Create 10 POs within 1-minute window
- Mix of different payment terms
- Total value across all POs: $100,000

**POs**:
1. $5,000 - Net 30
2. $10,000 - 50/50 Split
3. $15,000 - 30/30/40 Split
4. $8,000 - Advance Payment
5. $12,000 - Quarterly
6. $20,000 - Weighted Payments
7. $7,500 - Net 30
8. $9,000 - 50/50 Split
9. $6,500 - BOL Payment
10. $7,000 - Production Payments

**Success Criteria**:
- All POs save successfully
- All payment schedules created
- Total processing time < 2 minutes
- No governance errors
- No concurrency conflicts

---

### Performance Test 2: Large Volume PO Processing

**Objective**: Verify system scales to production volumes

**Setup**:
- Create 50 POs over 1 hour
- Simulate realistic production usage
- Mix of payment terms (70% Net 30, 20% split, 10% complex)

**Monitoring**:
- Average processing time per PO
- Governance usage per PO
- Error rate
- Script execution log volume

**Success Criteria**:
- Average processing time < 5 seconds per PO
- Error rate < 1%
- All schedules created accurately
- No system performance degradation

---

### Performance Test 3: Complex Payment Terms

**Objective**: Verify performance with maximum complexity

**Setup**:
Create payment term with 10 payments (maximum allowed)

**Configuration**:
- Name: "10-Payment Term"
- Number of Payments: 10
- Each payment: 10%
- Various trigger types and offsets

**Test**:
- Create PO with $100,000 total
- Assign 10-payment term
- Save and measure

**Success Criteria**:
- All 10 schedules created
- Processing time < 10 seconds
- Governance usage < 200 units
- Accurate calculations

---

## Test Data Cleanup

### After Testing is Complete

**Cleanup Steps**:

1. **Delete Test Payment Schedules**:
   - Navigate to Custom Record: PO Payment Schedule
   - Filter by test PO numbers
   - Mass delete (or delete individually)

2. **Delete Test POs**:
   - Mark all test POs with identifier (e.g., "TEST-" prefix)
   - Use mass delete or individual deletion
   - Verify all related schedules deleted

3. **Keep Valid Payment Terms**:
   - Review payment terms created
   - Delete any test/invalid terms
   - Keep production-ready terms

4. **Archive Test Logs**:
   - Export script execution logs from test period
   - Save for reference
   - File location: logs/test_YYYYMMDD.csv

5. **Document Results**:
   - Update test results spreadsheet
   - Note any issues found
   - Document resolutions
   - Save test report

---

## Test Results Template

### Test Execution Summary

**Test Date**: _____________
**Tested By**: _____________
**Environment**: Production / Sandbox
**Account**: 5221064 (HBNO)

**Results**:

| Test Case | PO ID | Expected | Actual | Status | Notes |
|-----------|-------|----------|--------|--------|-------|
| PO-001: Net 30 | _____ | 1 schedule | _____ | Pass/Fail | _____ |
| PO-002: 50/50 | _____ | 2 schedules | _____ | Pass/Fail | _____ |
| PO-003: 30/30/40 | _____ | 3 schedules | _____ | Pass/Fail | _____ |
| PO-004: Rounding Small | _____ | $100.01 total | _____ | Pass/Fail | _____ |
| PO-005: Rounding Odd | _____ | $999.99 total | _____ | Pass/Fail | _____ |
| PO-006: Rounding Large | _____ | Exact total | _____ | Pass/Fail | _____ |
| PO-007: No Terms | _____ | 0 schedules | _____ | Pass/Fail | _____ |
| PO-008: Minimum Amount | _____ | $0.01 total | _____ | Pass/Fail | _____ |
| PO-009: Weekend Date | _____ | Monday due date | _____ | Pass/Fail | _____ |
| PO-010: Negative Offset | _____ | Correct dates | _____ | Pass/Fail | _____ |

**Summary Statistics**:
- Total Test Cases: _____
- Passed: _____
- Failed: _____
- Pass Rate: _____%

**Issues Identified**:
1. _____________________________________________________________
2. _____________________________________________________________
3. _____________________________________________________________

**Recommendations**:
1. _____________________________________________________________
2. _____________________________________________________________
3. _____________________________________________________________

**Sign-Off**:

Tester: _________________________ Date: __________

Reviewer: _______________________ Date: __________

---

**Document End**
