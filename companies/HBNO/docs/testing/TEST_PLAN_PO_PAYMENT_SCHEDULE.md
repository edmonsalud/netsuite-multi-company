# PO Payment Schedule System - Comprehensive Test Plan

## Document Information
- **System Name**: PO Payment Schedule Automation
- **Version**: 1.0
- **Date Created**: 2025-10-14
- **Test Plan Owner**: QA Team
- **Company**: HBNO

---

## Table of Contents
1. [Test Plan Overview](#test-plan-overview)
2. [Unit Test Cases](#unit-test-cases)
3. [Integration Test Scenarios](#integration-test-scenarios)
4. [User Acceptance Test Cases](#user-acceptance-test-cases)
5. [Performance Test Cases](#performance-test-cases)
6. [Security Test Cases](#security-test-cases)
7. [Regression Test Suite](#regression-test-suite)
8. [Test Environment Setup](#test-environment-setup)
9. [Test Data Requirements](#test-data-requirements)
10. [Test Execution Schedule](#test-execution-schedule)

---

## 1. Test Plan Overview

### 1.1 Scope
This test plan covers comprehensive testing for the PO Payment Schedule system including:
- Automated payment schedule generation
- Date calculation logic for multiple trigger types
- Amount calculation and rounding
- Validation rules and error handling
- Performance under load
- Security and access controls
- Regression scenarios

### 1.2 Test Objectives
- Verify payment schedules are created correctly on PO creation
- Validate date calculations for all trigger types
- Ensure amount calculations are accurate with proper rounding
- Confirm error handling and validation work as expected
- Test performance meets acceptable thresholds
- Validate security controls and permissions
- Ensure no regression in existing functionality

### 1.3 Test Approach
- **Unit Testing**: Test individual modules and functions in isolation
- **Integration Testing**: Test interaction between modules and NetSuite APIs
- **System Testing**: End-to-end testing of complete workflows
- **UAT**: Business user validation of functionality
- **Performance Testing**: Load and stress testing
- **Security Testing**: Permission and access control validation

### 1.4 Entry/Exit Criteria

**Entry Criteria:**
- All code development completed
- Code review passed
- Unit tests written and passing
- Test environment configured
- Test data created

**Exit Criteria:**
- All critical and high priority test cases passed
- No critical or high severity defects open
- Code coverage minimum 80%
- Performance benchmarks met
- UAT sign-off received
- All documentation updated

---

## 2. Unit Test Cases

### 2.1 Constants Module Tests

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| UT-CONST-001 | Verify TRIGGER_TYPES constants | Access TRIGGER_TYPES.QIMA.id | Returns '1' | High |
| UT-CONST-002 | Verify SCHEDULE_STATUS constants | Access SCHEDULE_STATUS.OPEN | Returns '1' | High |
| UT-CONST-003 | Verify RECORD_TYPES constants | Access RECORD_TYPES.CUSTOM_PAYMENT_TERMS | Returns 'customrecord_po_terms' | High |
| UT-CONST-004 | Verify VALIDATION limits | Access VALIDATION.MAX_PAYMENT_SCHEDULES | Returns 10 | Medium |
| UT-CONST-005 | Verify GOVERNANCE thresholds | Access GOVERNANCE.THRESHOLD_CRITICAL | Returns 100 | Medium |

### 2.2 ValidationHelper Module Tests

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| UT-VAL-001 | Validate valid percentage | 50 | isValid: true | High |
| UT-VAL-002 | Validate invalid percentage (>100) | 150 | isValid: false | High |
| UT-VAL-003 | Validate invalid percentage (<0) | -10 | isValid: false | High |
| UT-VAL-004 | Validate edge percentage (0.01) | 0.01 | isValid: true | Medium |
| UT-VAL-005 | Validate edge percentage (100) | 100 | isValid: true | Medium |
| UT-VAL-006 | Validate valid amount | 100.50 | isValid: true | High |
| UT-VAL-007 | Validate invalid amount (0) | 0 | isValid: false | High |
| UT-VAL-008 | Validate invalid amount (negative) | -50 | isValid: false | High |
| UT-VAL-009 | Validate valid trigger type (QIMA) | '1' | isValid: true | High |
| UT-VAL-010 | Validate valid trigger type (On Receipt) | '2' | isValid: true | High |
| UT-VAL-011 | Validate valid trigger type (After Receipt) | '3' | isValid: true | High |
| UT-VAL-012 | Validate valid trigger type (On BOL) | '4' | isValid: true | High |
| UT-VAL-013 | Validate valid trigger type (Adv Production) | '5' | isValid: true | High |
| UT-VAL-014 | Validate valid trigger type (Adv Shipping) | '6' | isValid: true | High |
| UT-VAL-015 | Validate invalid trigger type | '999' | isValid: false | High |
| UT-VAL-016 | Validate PO with no payment terms | PO without custbody_payment_terms_cust | isValid: false, error message | High |
| UT-VAL-017 | Validate PO with zero total | PO with total = 0 | isValid: false, error message | High |
| UT-VAL-018 | Validate PO with valid data | PO with all required fields | isValid: true | High |
| UT-VAL-019 | Validate schedules sum to 100% | [30, 30, 40] | isValid: true | Critical |
| UT-VAL-020 | Validate schedules sum to 99% | [30, 30, 39] | isValid: false | Critical |
| UT-VAL-021 | Validate schedules sum to 101% | [30, 30, 41] | isValid: false | Critical |
| UT-VAL-022 | Validate duplicate payment numbers | [1, 1, 2] | isValid: false, error message | High |
| UT-VAL-023 | Validate sequential payment numbers | [1, 2, 3] | isValid: true | High |
| UT-VAL-024 | Sanitize text with HTML | "<script>alert('xss')</script>" | Sanitized text without script tags | High |
| UT-VAL-025 | Sanitize text with special chars | "Test & < > \"text\"" | Escaped special characters | Medium |
| UT-VAL-026 | Validate descriptor max length | 600 character string | Truncated to 500 chars | Medium |

### 2.3 DateCalculator Module Tests

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| UT-DATE-001 | Add positive calendar days | Date: 2025-01-01, Days: 30 | 2025-01-31 | Critical |
| UT-DATE-002 | Add negative calendar days | Date: 2025-01-31, Days: -15 | 2025-01-16 | Critical |
| UT-DATE-003 | Add zero days | Date: 2025-01-15, Days: 0 | 2025-01-15 | High |
| UT-DATE-004 | Add days crossing month boundary | Date: 2025-01-25, Days: 10 | 2025-02-04 | High |
| UT-DATE-005 | Add days crossing year boundary | Date: 2025-12-25, Days: 10 | 2026-01-04 | High |
| UT-DATE-006 | Add days in leap year | Date: 2024-02-28, Days: 1 | 2024-02-29 | Medium |
| UT-DATE-007 | Parse date from string (M/D/YYYY) | "1/15/2025" | Date object: Jan 15, 2025 | High |
| UT-DATE-008 | Parse date from string (MM/DD/YYYY) | "01/15/2025" | Date object: Jan 15, 2025 | High |
| UT-DATE-009 | Parse date from Date object | Date object | Same Date object | Medium |
| UT-DATE-010 | Parse invalid date string | "invalid" | null | High |
| UT-DATE-011 | Format date to NetSuite format | Date: Jan 15, 2025 | "1/15/2025" or NetSuite format | High |
| UT-DATE-012 | Calculate QIMA trigger date | PO with custbody1 date | custbody1 date + offset | High |
| UT-DATE-013 | Calculate On Receipt trigger (no receipt) | PO without receipt | custbody1 date + offset | High |
| UT-DATE-014 | Calculate After Receipt trigger (no receipt) | PO without receipt | custbody1 date + offset | High |
| UT-DATE-015 | Calculate On BOL trigger | PO with BOL date | BOL date + offset | Medium |
| UT-DATE-016 | Calculate Production Start trigger | PO with prod start date | Production date + offset | Medium |
| UT-DATE-017 | Calculate Prior Shipping trigger | PO with ship date | Ship date + offset | Medium |
| UT-DATE-018 | Fallback to PO date | PO with no custom dates | PO trandate + offset | High |

### 2.4 PaymentScheduleManager Module Tests

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| UT-PSM-001 | Load payment terms - valid ID | Valid payment term ID | Payment term record | Critical |
| UT-PSM-002 | Load payment terms - invalid ID | Invalid payment term ID | null or error | High |
| UT-PSM-003 | Load schedule details - valid term | Valid payment term ID | Array of schedule details | Critical |
| UT-PSM-004 | Load schedule details - no details | Term ID with no details | Empty array | High |
| UT-PSM-005 | Calculate schedules - 1 payment | PO $1000, 100% payment | 1 schedule: $1000 | Critical |
| UT-PSM-006 | Calculate schedules - 2 payments | PO $1000, 50%/50% | 2 schedules: $500, $500 | Critical |
| UT-PSM-007 | Calculate schedules - 3 payments | PO $1000, 30%/30%/40% | 3 schedules: $300, $300, $400 | Critical |
| UT-PSM-008 | Calculate schedules - rounding | PO $1000.01, 33.33% each | Schedules with proper rounding | Critical |
| UT-PSM-009 | Calculate schedules - last payment adjustment | PO $1000, rounding errors | Last payment = remainder | Critical |
| UT-PSM-010 | Create schedule record - success | Valid schedule data | Record ID returned | Critical |
| UT-PSM-011 | Create schedule record - missing required field | Invalid schedule data | Error thrown | High |
| UT-PSM-012 | Get schedule summary - existing schedules | PO with 3 schedules | Summary with count: 3 | High |
| UT-PSM-013 | Get schedule summary - no schedules | PO with no schedules | Summary with count: 0 | High |
| UT-PSM-014 | Process payment schedules - success | Valid PO with payment terms | Success: true, schedules created | Critical |
| UT-PSM-015 | Process payment schedules - no payment terms | PO without payment terms | Success: false, error message | High |
| UT-PSM-016 | Process payment schedules - duplicate prevention | PO with existing schedules | Success: false, duplicate error | High |
| UT-PSM-017 | Rollback created schedules | Array of schedule IDs | Schedules deleted | High |

---

## 3. Integration Test Scenarios

### 3.1 End-to-End Schedule Creation

| Test ID | Test Scenario | Steps | Expected Result | Priority |
|---------|---------------|-------|-----------------|----------|
| IT-E2E-001 | Create PO with single payment term | 1. Create PO with $1000 total<br>2. Select payment term (100%, On Receipt, 30 days)<br>3. Save PO | 1 payment schedule created: $1000, due date = receipt + 30 days | Critical |
| IT-E2E-002 | Create PO with two payment term | 1. Create PO with $5000 total<br>2. Select payment term (50%/50%)<br>3. Save PO | 2 payment schedules created: $2500 each | Critical |
| IT-E2E-003 | Create PO with three payment term | 1. Create PO with $10000 total<br>2. Select payment term (30%/30%/40%)<br>3. Save PO | 3 payment schedules created: $3000, $3000, $4000 | Critical |
| IT-E2E-004 | Create PO with five payment term | 1. Create PO with $10000 total<br>2. Select payment term (20%/20%/20%/20%/20%)<br>3. Save PO | 5 payment schedules created: $2000 each | High |
| IT-E2E-005 | Create PO without payment term | 1. Create PO with $1000 total<br>2. Leave payment term blank<br>3. Save PO | PO saves successfully, no schedules created, warning logged | High |
| IT-E2E-006 | Create PO with zero total | 1. Create PO with $0 total<br>2. Select payment term<br>3. Save PO | Validation error, schedules not created | High |

### 3.2 Date Calculation Integration

| Test ID | Test Scenario | Steps | Expected Result | Priority |
|---------|---------------|-------|-----------------|----------|
| IT-DATE-001 | QIMA trigger with positive offset | 1. Create PO with custbody1 = 2025-01-01<br>2. Payment term: QIMA trigger, +15 days<br>3. Save PO | Schedule due date = 2025-01-16 | Critical |
| IT-DATE-002 | On Receipt trigger without receipt | 1. Create PO with custbody1 = 2025-01-01<br>2. Payment term: On Receipt, +30 days<br>3. Save PO (no receipt) | Schedule due date = custbody1 + 30 = 2025-01-31 | Critical |
| IT-DATE-003 | After Receipt trigger with receipt | 1. Create PO<br>2. Create Item Receipt on 2025-01-15<br>3. Payment term: After Receipt, +30 days | Schedule due date = 2025-02-14 | High |
| IT-DATE-004 | Multiple triggers in one term | 1. Create PO<br>2. Term: Payment 1 (QIMA, +0), Payment 2 (On Receipt, +30)<br>3. Save PO | Two schedules with different due dates | High |
| IT-DATE-005 | Negative day offset (advance payment) | 1. Create PO with custbody1 = 2025-02-01<br>2. Payment term: On Receipt, -5 days<br>3. Save PO | Schedule due date = 2025-01-27 | Medium |

### 3.3 Amount Calculation Integration

| Test ID | Test Scenario | Steps | Expected Result | Priority |
|---------|---------------|-------|-----------------|----------|
| IT-AMT-001 | Standard percentage split | 1. Create PO with $10000 total<br>2. Payment term: 50%/50%<br>3. Save PO | Schedules: $5000.00, $5000.00 | Critical |
| IT-AMT-002 | Uneven percentage split | 1. Create PO with $10000 total<br>2. Payment term: 30%/30%/40%<br>3. Save PO | Schedules: $3000.00, $3000.00, $4000.00 | Critical |
| IT-AMT-003 | Rounding with decimal total | 1. Create PO with $1000.01 total<br>2. Payment term: 33.33%/33.33%/33.34%<br>3. Save PO | Schedules sum exactly to $1000.01 | Critical |
| IT-AMT-004 | Large PO amount | 1. Create PO with $1,000,000.00 total<br>2. Payment term: 25%/25%/25%/25%<br>3. Save PO | Schedules: $250,000.00 each | High |
| IT-AMT-005 | Small PO amount | 1. Create PO with $0.10 total<br>2. Payment term: 50%/50%<br>3. Save PO | Schedules: $0.05, $0.05 | Medium |
| IT-AMT-006 | Decimal percentage | 1. Create PO with $1000 total<br>2. Payment term: 33.33%/33.33%/33.34%<br>3. Save PO | Schedules sum exactly to $1000.00 | High |

### 3.4 Validation Integration

| Test ID | Test Scenario | Steps | Expected Result | Priority |
|---------|---------------|-------|-----------------|----------|
| IT-VAL-001 | Payment term percentages != 100% | 1. Create payment term with 30%/30%/30%<br>2. Create PO with this term<br>3. Save PO | Validation error, schedules not created | Critical |
| IT-VAL-002 | Payment term with invalid trigger | 1. Manually create term with invalid trigger type<br>2. Create PO with this term<br>3. Save PO | Validation error or fallback to default | High |
| IT-VAL-003 | Duplicate payment numbers | 1. Create term with duplicate payment numbers<br>2. Create PO with this term<br>3. Save PO | Validation error, schedules not created | High |
| IT-VAL-004 | Missing required fields in term details | 1. Create term with missing percentage<br>2. Create PO with this term<br>3. Save PO | Validation error, schedules not created | High |
| IT-VAL-005 | PO without vendor | 1. Create PO without vendor<br>2. Select payment term<br>3. Save PO | NetSuite validation prevents save OR schedules handle gracefully | Medium |

### 3.5 Error Handling Integration

| Test ID | Test Scenario | Steps | Expected Result | Priority |
|---------|---------------|-------|-----------------|----------|
| IT-ERR-001 | Governance limit exceeded | 1. Create PO at low governance threshold<br>2. Attempt schedule creation<br>3. Observe behavior | Error logged, appropriate exception thrown | High |
| IT-ERR-002 | Invalid payment term ID | 1. Create PO with deleted/invalid payment term ID<br>2. Save PO | Error logged, schedules not created, clear message | High |
| IT-ERR-003 | Record creation failure | 1. Remove permissions for schedule record<br>2. Create PO with payment term<br>3. Save PO | Error logged, rollback occurs | High |
| IT-ERR-004 | Partial schedule creation failure | 1. Create PO with 3 payment term<br>2. Simulate failure on 2nd schedule<br>3. Observe rollback | All schedules rolled back, error logged | Critical |
| IT-ERR-005 | Invalid date calculation | 1. Create PO with invalid custbody1 date<br>2. Payment term requires date<br>3. Save PO | Fallback to PO trandate, schedule created | High |

### 3.6 Duplicate Prevention

| Test ID | Test Scenario | Steps | Expected Result | Priority |
|---------|---------------|-------|-----------------|----------|
| IT-DUP-001 | Prevent duplicate on re-save | 1. Create PO with payment term<br>2. Save PO (schedules created)<br>3. Edit and re-save PO | Duplicate check prevents re-creation, existing schedules retained | Critical |
| IT-DUP-002 | Multiple CREATE events (edge case) | 1. Trigger multiple afterSubmit CREATE events<br>2. Observe schedule creation | Only one set of schedules created | High |

---

## 4. User Acceptance Test Cases

### 4.1 Basic Functionality UAT

| UAT ID | Test Case | Business Scenario | User Role | Expected Outcome | Priority |
|--------|-----------|-------------------|-----------|------------------|----------|
| UAT-001 | Create standard PO with payment schedule | Purchaser creates PO for $10,000 with standard 30/30/40 terms | Purchaser | Payment schedule appears on PO with 3 payments: $3000, $3000, $4000 | Critical |
| UAT-002 | View payment schedule on PO | Purchaser views existing PO to check payment dates | Purchaser | Payment schedule visible in related records or sublist with dates and amounts | Critical |
| UAT-003 | Create PO without payment terms | Purchaser creates PO without selecting payment terms | Purchaser | PO saves successfully, no payment schedule created, no error | High |
| UAT-004 | Create PO with advance payment terms | Purchaser creates PO with 20% advance payment | Purchaser | Schedule shows 20% payment with due date before other payments | High |
| UAT-005 | Verify payment schedule accuracy | Accounting reviews payment schedule for accuracy | Accounting | All amounts sum to PO total, dates are correct per business rules | Critical |

### 4.2 Advanced Scenarios UAT

| UAT ID | Test Case | Business Scenario | User Role | Expected Outcome | Priority |
|--------|-----------|-------------------|-----------|------------------|----------|
| UAT-006 | PO with item receipt trigger | Purchaser creates PO, receives items, checks payment dates | Purchaser | Payment dates calculate based on receipt date | High |
| UAT-007 | PO with QIMA inspection trigger | Purchaser creates PO with QIMA inspection payment terms | Purchaser | Payment schedule created with QIMA-based dates | Medium |
| UAT-008 | Multi-currency PO | Purchaser creates PO in foreign currency | Purchaser | Payment schedule amounts in correct currency | High |
| UAT-009 | PO for services (non-inventory) | Purchaser creates PO for services | Purchaser | Payment schedule created appropriately | Medium |
| UAT-010 | Partial item receipt scenario | Purchaser receives partial quantity, checks payment impact | Purchaser | Payment dates based on first receipt (as designed) | Medium |

### 4.3 Error Handling UAT

| UAT ID | Test Case | Business Scenario | User Role | Expected Outcome | Priority |
|--------|-----------|-------------------|-----------|------------------|----------|
| UAT-011 | Invalid payment term configuration | Purchaser selects payment term with invalid setup | Purchaser | Clear error message, PO does not save | High |
| UAT-012 | Permission denied scenario | User without payment schedule permissions | Limited User | PO saves but schedule creation handled appropriately | Medium |
| UAT-013 | System error during creation | System failure during schedule creation | Purchaser | Error message displayed, PO handling per design | High |

### 4.4 Reporting UAT

| UAT ID | Test Case | Business Scenario | User Role | Expected Outcome | Priority |
|--------|-----------|-------------------|-----------|------------------|----------|
| UAT-014 | View all payment schedules | Accounting views all open payment schedules | Accounting | Report shows all open payments with dates and amounts | High |
| UAT-015 | Filter by due date | Accounting filters payments due this month | Accounting | Filtered list shows only relevant payments | Medium |
| UAT-016 | View payment schedule history | Accounting reviews payment history for closed POs | Accounting | Historical schedules accessible | Medium |

---

## 5. Performance Test Cases

### 5.1 Load Testing

| Test ID | Test Scenario | Volume | Success Criteria | Priority |
|---------|---------------|--------|------------------|----------|
| PERF-001 | Single PO schedule creation time | 1 PO, 1 payment | < 2 seconds execution time | Critical |
| PERF-002 | Single PO with multiple payments | 1 PO, 5 payments | < 5 seconds execution time | Critical |
| PERF-003 | Concurrent PO creation | 10 POs created simultaneously | All complete within 30 seconds | High |
| PERF-004 | High volume PO creation | 100 POs in 1 hour | All schedules created successfully | High |
| PERF-005 | Large PO amount calculations | PO with $10,000,000 total | Calculations accurate, < 5 seconds | Medium |

### 5.2 Governance Testing

| Test ID | Test Scenario | Expected Governance Usage | Success Criteria | Priority |
|---------|---------------|---------------------------|------------------|----------|
| PERF-GOV-001 | Create 1 payment schedule | ~30 units (load term + create schedule) | Usage within expected range | Critical |
| PERF-GOV-002 | Create 5 payment schedules | ~100 units (load term + create 5 schedules) | Usage within expected range | Critical |
| PERF-GOV-003 | Load payment term details | ~15 units (record load + search) | Usage within expected range | High |
| PERF-GOV-004 | Date calculation with receipt search | ~10 units (search for receipt) | Usage within expected range | High |
| PERF-GOV-005 | Full PO processing | < 150 units total | Stays well below 1000 unit limit | Critical |

### 5.3 Stress Testing

| Test ID | Test Scenario | Stress Condition | Success Criteria | Priority |
|---------|---------------|------------------|------------------|----------|
| PERF-STR-001 | Maximum payments per term | PO with 10 payments (max limit) | Schedules created successfully | High |
| PERF-STR-002 | Minimum governance scenario | Execute at 150 remaining governance units | Completes or fails gracefully | High |
| PERF-STR-003 | Large schedule detail dataset | Search through 1000+ payment terms | Search completes < 5 seconds | Medium |
| PERF-STR-004 | Long-running transaction | Hold PO creation lock for extended period | Handles concurrent access properly | Medium |

### 5.4 Scalability Testing

| Test ID | Test Scenario | Scale | Success Criteria | Priority |
|---------|---------------|-------|------------------|----------|
| PERF-SCALE-001 | Growing schedule records | 10,000 payment schedule records exist | Search and creation remain performant | Medium |
| PERF-SCALE-002 | Multiple subsidiaries | Test across 5 subsidiaries | Performance consistent across all | Low |
| PERF-SCALE-003 | Year-over-year growth | Add 100,000 schedules per year | System remains responsive | Low |

---

## 6. Security Test Cases

### 6.1 Access Control Tests

| Test ID | Test Scenario | User Role | Expected Result | Priority |
|---------|---------------|-----------|-----------------|----------|
| SEC-001 | Admin views payment terms | Administrator | Full access to view/edit payment terms | High |
| SEC-002 | Purchaser views payment terms | Purchaser | Read-only access to payment terms | High |
| SEC-003 | Warehouse views payment terms | Warehouse | No access to payment terms | High |
| SEC-004 | Admin creates payment schedule | Administrator | Can manually create schedules | Medium |
| SEC-005 | Purchaser edits payment schedule | Purchaser | Read-only access to schedules | High |
| SEC-006 | Accounting updates schedule status | Accounting | Can update status field only | High |
| SEC-007 | Unauthorized role access | Limited User | Denied access, appropriate error | High |

### 6.2 Data Security Tests

| Test ID | Test Scenario | Test Action | Expected Result | Priority |
|---------|---------------|-------------|-----------------|----------|
| SEC-DATA-001 | SQL injection in descriptor field | Enter SQL code in descriptor | Code sanitized, not executed | Critical |
| SEC-DATA-002 | Script injection in descriptor | Enter "<script>alert('XSS')</script>" | Script tags removed/escaped | Critical |
| SEC-DATA-003 | HTML injection in descriptor | Enter HTML tags | HTML sanitized or escaped | High |
| SEC-DATA-004 | Excessive data length | Enter 10,000 character descriptor | Truncated to max length | Medium |
| SEC-DATA-005 | Special characters in fields | Enter special chars in all fields | Properly escaped/handled | Medium |
| SEC-DATA-006 | Unicode characters | Enter unicode/emoji characters | Handled appropriately | Low |

### 6.3 Permission Tests

| Test ID | Test Scenario | Permission Setup | Expected Result | Priority |
|---------|---------------|------------------|-----------------|----------|
| SEC-PERM-001 | Script execution permission | Remove execute permission | Script does not run, error logged | High |
| SEC-PERM-002 | Custom record create permission | Remove create permission for schedules | Error handled gracefully | High |
| SEC-PERM-003 | Custom record view permission | Remove view permission for payment terms | Error handled gracefully | High |
| SEC-PERM-004 | PO view permission | Remove PO view permission | Script cannot access PO data | Medium |
| SEC-PERM-005 | Search permission | Remove search permission | Error handled gracefully | Medium |

### 6.4 Audit Trail Tests

| Test ID | Test Scenario | Action | Expected Result | Priority |
|---------|---------------|--------|-----------------|----------|
| SEC-AUDIT-001 | Schedule creation audit | Create payment schedules | Creation logged with user, date, details | High |
| SEC-AUDIT-002 | Validation error audit | Trigger validation error | Error logged with details | High |
| SEC-AUDIT-003 | System error audit | Trigger system error | Error logged with stack trace | High |
| SEC-AUDIT-004 | Performance monitoring | Execute schedule creation | Governance usage logged | Medium |

---

## 7. Regression Test Suite

### 7.1 Core Functionality Regression

| Test ID | Test Scenario | Expected Result | Run Frequency | Priority |
|---------|---------------|-----------------|---------------|----------|
| REG-001 | Create standard PO | PO saves successfully | Every release | Critical |
| REG-002 | Create PO with payment term | Schedule created correctly | Every release | Critical |
| REG-003 | Edit existing PO | PO updates successfully, schedules unaffected | Every release | Critical |
| REG-004 | Delete PO draft | PO deletes without error | Every release | High |
| REG-005 | Approve PO workflow | Approval workflow functions normally | Every release | High |
| REG-006 | Create item receipt | Receipt creation unaffected by schedule script | Every release | Critical |
| REG-007 | Create vendor bill | Bill creation unaffected by schedule script | Every release | Critical |
| REG-008 | View PO form | Form loads properly with schedule sublist/related records | Every release | Critical |

### 7.2 Integration Point Regression

| Test ID | Test Scenario | Expected Result | Run Frequency | Priority |
|---------|---------------|-----------------|---------------|----------|
| REG-INT-001 | PO approval workflow integration | Workflow operates normally | Every release | High |
| REG-INT-002 | Email notifications on PO save | Notifications sent as configured | Every release | Medium |
| REG-INT-003 | Vendor portal PO visibility | Vendor can view PO in portal | Every release | Medium |
| REG-INT-004 | SuiteFlow actions on PO | SuiteFlow actions execute properly | Every release | Medium |
| REG-INT-005 | Scheduled scripts on PO record | Other scheduled scripts function | Every release | High |

### 7.3 Performance Regression

| Test ID | Test Scenario | Baseline | Threshold | Priority |
|---------|---------------|----------|-----------|----------|
| REG-PERF-001 | PO save time without schedule | 2 seconds | +20% max | High |
| REG-PERF-002 | PO save time with schedule | 5 seconds | +20% max | High |
| REG-PERF-003 | Governance usage per PO | 100 units | +30% max | High |
| REG-PERF-004 | PO list page load time | 3 seconds | +20% max | Medium |

### 7.4 Edge Case Regression

| Test ID | Test Scenario | Expected Result | Run Frequency | Priority |
|---------|---------------|-----------------|---------------|----------|
| REG-EDGE-001 | PO with $0.01 total | Handles correctly | Major releases | Medium |
| REG-EDGE-002 | PO with $999,999,999.99 total | Handles correctly | Major releases | Medium |
| REG-EDGE-003 | PO created on leap year Feb 29 | Date calculations correct | Major releases | Low |
| REG-EDGE-004 | PO with 100+ line items | Performance acceptable | Major releases | Medium |
| REG-EDGE-005 | PO in inactive subsidiary | Handles appropriately | Major releases | Low |

---

## 8. Test Environment Setup

### 8.1 Environment Configuration

**Sandbox Environment Requirements:**
- NetSuite Sandbox account with SuiteScript 2.1 support
- SuiteCloud Development Framework (SDF) installed
- Custom records created and configured
- Test users with appropriate roles configured
- Test data loaded

**Required Custom Records:**
1. Custom Payment Terms (customrecord_po_terms)
2. Terms Payment Schedule Details (customrecord_terms_payment_sche_details)
3. PO Payment Schedule (customrecord_po_payment_schedule)

**Required Roles:**
1. Administrator
2. Purchaser
3. Accounting
4. Limited User (for negative testing)

### 8.2 Script Deployment Configuration

**User Event Script Deployment:**
- Script ID: customscript_po_payment_schedule_ue
- Deployment ID: customdeploy_po_payment_schedule_ue
- Record Type: Purchase Order
- Event: afterSubmit (CREATE only in v1.0)
- Status: Testing (change to Released after UAT)
- Execute As: Administrator
- Log Level: Debug (change to Error after UAT)

**Test Script Deployment:**
- Script ID: customscript_po_payment_test_suite
- Deployment ID: customdeploy_po_payment_test_suite
- Type: Scheduled Script
- Status: Testing
- Execute As: Administrator
- Log Level: Debug

### 8.3 Access Configuration

**Test User Accounts:**

| User | Role | Email | Purpose |
|------|------|-------|---------|
| test_admin | Administrator | test.admin@hbno.test | Full access testing |
| test_purchaser | Purchaser | test.purchaser@hbno.test | Purchaser workflow testing |
| test_accounting | Accounting | test.accounting@hbno.test | Accounting access testing |
| test_limited | Limited User | test.limited@hbno.test | Negative permission testing |

---

## 9. Test Data Requirements

### 9.1 Payment Term Test Data

**Required Payment Terms:**

| Term Name | Payments | Configuration | Purpose |
|-----------|----------|---------------|---------|
| 100% On Receipt | 1 | 100% On Receipt, +30 days | Basic single payment |
| 50/50 Split | 2 | 50% On Receipt +0, 50% On Receipt +30 | Standard two payment |
| 30/30/40 Standard | 3 | 30% QIMA, 30% On Receipt, 40% After Receipt +15 | Standard three payment |
| 20% Advance | 2 | 20% PO Date +0, 80% On Receipt +30 | Advance payment scenario |
| Even Five Split | 5 | 20% each at different triggers | Maximum payment count |
| 33.33% Split (Rounding) | 3 | 33.33%, 33.33%, 33.34% | Rounding test |
| Invalid - 90% Total | 3 | 30%, 30%, 30% (90% total) | Negative validation test |

### 9.2 Purchase Order Test Data

**Required Test POs:**

| PO Purpose | Vendor | Total | Items | Payment Term |
|------------|--------|-------|-------|--------------|
| Standard PO 1 | Test Vendor A | $1,000.00 | 1 item, qty 10 | 100% On Receipt |
| Standard PO 2 | Test Vendor A | $10,000.00 | 2 items | 50/50 Split |
| Large Amount PO | Test Vendor B | $1,000,000.00 | 1 item, qty 1 | 30/30/40 Standard |
| Rounding Test PO | Test Vendor A | $1,000.01 | 1 item | 33.33% Split |
| Small Amount PO | Test Vendor C | $0.10 | 1 item | 50/50 Split |
| No Payment Term PO | Test Vendor A | $500.00 | 1 item | None |
| Advance Payment PO | Test Vendor D | $5,000.00 | 1 item | 20% Advance |

### 9.3 Vendor Test Data

**Required Test Vendors:**

| Vendor Name | Purpose | Payment Terms |
|-------------|---------|---------------|
| Test Vendor A | Standard testing | Net 30 |
| Test Vendor B | Large amount testing | Net 60 |
| Test Vendor C | Edge case testing | Net 15 |
| Test Vendor D | Advance payment testing | Net 30 |

### 9.4 Item Test Data

**Required Test Items:**

| Item Name | Type | Cost | Purpose |
|-----------|------|------|---------|
| Test Item 1 | Non-Inventory | $100.00 | Standard testing |
| Test Item 2 | Non-Inventory | $1,000.00 | Large amount testing |
| Test Item 3 | Non-Inventory | $0.01 | Small amount testing |
| Test Item Decimal | Non-Inventory | $33.337 | Rounding testing |

---

## 10. Test Execution Schedule

### 10.1 Test Phases

```
Phase 1: Unit Testing (Week 1)
  Days 1-2: ValidationHelper tests
  Days 3-4: DateCalculator tests
  Day 5: PaymentScheduleManager tests

Phase 2: Integration Testing (Week 2)
  Days 1-2: End-to-end scenarios
  Days 3-4: Error handling and edge cases
  Day 5: Integration test completion and review

Phase 3: Performance Testing (Week 2-3)
  Days 1-2: Load testing
  Days 2-3: Governance testing
  Day 4: Stress testing

Phase 4: Security Testing (Week 3)
  Days 1-2: Access control tests
  Days 2-3: Data security tests
  Day 3: Audit trail verification

Phase 5: UAT (Week 4)
  Days 1-3: Business user testing
  Days 4-5: UAT issue resolution

Phase 6: Regression Testing (Week 4-5)
  Days 1-2: Core functionality regression
  Days 2-3: Integration point regression
  Day 4: Final verification
```

### 10.2 Test Execution Tracking

**Daily Test Execution:**
- Execute automated test suite (automated_test_suite.js)
- Log results in TEST_RESULTS_TEMPLATE.md
- Address any failures immediately
- Update test cases as needed

**Weekly Test Reports:**
- Summary of test execution
- Pass/fail statistics
- Defect summary
- Risk assessment
- Schedule adherence

### 10.3 Defect Management

**Defect Severity Levels:**

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| Critical | System unusable, data corruption | Immediate | PO cannot be saved, schedules corrupt data |
| High | Major functionality broken | 24 hours | Schedules not created, amounts incorrect |
| Medium | Minor functionality issue | 3 days | Date calculation off by 1 day |
| Low | Cosmetic, documentation | 1 week | Logging format, minor UI issue |

**Defect Workflow:**
1. Tester logs defect with details
2. Developer reviews and prioritizes
3. Fix developed and unit tested
4. Tester verifies fix
5. Regression test executed
6. Defect closed

### 10.4 Test Sign-Off Criteria

**Unit Testing Sign-Off:**
- All unit test cases executed
- 90%+ pass rate
- All critical defects resolved
- Code coverage > 80%

**Integration Testing Sign-Off:**
- All integration scenarios executed
- 95%+ pass rate
- All critical and high defects resolved

**UAT Sign-Off:**
- All UAT test cases executed
- 100% of critical cases passed
- All critical defects resolved
- Business owner formal approval

**Final Release Sign-Off:**
- All test phases completed
- No open critical or high severity defects
- Performance benchmarks met
- Security requirements validated
- Regression testing passed
- All documentation updated
- Training completed

---

## Appendix A: Test Case Templates

### A.1 Unit Test Case Template

```
Test ID: [UT-MODULE-###]
Test Name: [Descriptive name]
Module: [Module being tested]
Function: [Function being tested]
Priority: [Critical/High/Medium/Low]

Test Data:
  Input: [Input parameters]
  Expected Output: [Expected result]

Test Steps:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]

Pass Criteria:
  - [Criterion 1]
  - [Criterion 2]

Notes:
  [Any additional information]
```

### A.2 Integration Test Case Template

```
Test ID: [IT-CATEGORY-###]
Test Name: [Descriptive name]
Category: [Test category]
Priority: [Critical/High/Medium/Low]

Prerequisites:
  - [Prerequisite 1]
  - [Prerequisite 2]

Test Steps:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]

Expected Results:
  - [Expected result 1]
  - [Expected result 2]

Actual Results:
  [To be filled during execution]

Pass/Fail: [To be determined]

Notes:
  [Any additional information]
```

### A.3 UAT Test Case Template

```
UAT ID: [UAT-###]
Test Case: [Descriptive name]
Business Scenario: [Real-world scenario]
User Role: [Role performing test]
Priority: [Critical/High/Medium/Low]

Prerequisites:
  - [Prerequisite 1]
  - [Prerequisite 2]

Steps:
  1. [Business-focused step 1]
  2. [Business-focused step 2]
  3. [Business-focused step 3]

Expected Business Outcome:
  [What the business user should see/achieve]

Acceptance Criteria:
  - [Criterion 1]
  - [Criterion 2]

Actual Outcome:
  [To be filled during UAT]

User Feedback:
  [Business user comments]

Approved By: [Name]
Date: [Date]
```

---

## Appendix B: Test Execution Checklist

### Daily Test Execution Checklist

- [ ] Review test schedule for the day
- [ ] Verify test environment is available
- [ ] Execute scheduled test cases
- [ ] Log all test results
- [ ] Document any defects found
- [ ] Update test status in tracking system
- [ ] Communicate blockers to team
- [ ] Prepare for next day's testing

### Weekly Test Review Checklist

- [ ] Review all test results from the week
- [ ] Calculate pass/fail statistics
- [ ] Review all open defects
- [ ] Assess risk to schedule
- [ ] Update stakeholders on progress
- [ ] Identify any bottlenecks
- [ ] Adjust test plan if needed
- [ ] Prepare weekly test report

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| PO | Purchase Order |
| UAT | User Acceptance Testing |
| SDF | SuiteCloud Development Framework |
| Governance Units | NetSuite script execution resource limits |
| QIMA | Quality Inspection Management Application |
| BOL | Bill of Lading |
| Trigger Type | Event that initiates payment due date calculation |
| Payment Schedule | Individual payment record with date and amount |
| Payment Term | Configuration defining payment structure |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | __________ | __________ | ______ |
| Development Lead | __________ | __________ | ______ |
| Business Owner | __________ | __________ | ______ |
| Project Manager | __________ | __________ | ______ |

---

**End of Test Plan**
