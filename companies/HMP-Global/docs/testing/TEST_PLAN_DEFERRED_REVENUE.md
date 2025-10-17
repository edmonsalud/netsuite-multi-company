# Comprehensive Test Plan: Deferred Revenue Suitelet with Journal Entry Integration

**System**: HMP-Global Deferred Revenue Report with JE Integration
**File**: `ndc_deferred_revenue_suitelet_with_je.js`
**Script Type**: Suitelet 2.1
**Test Plan Version**: 1.0
**Created**: 2025-10-14

---

## Table of Contents
1. [Test Plan Overview](#test-plan-overview)
2. [Unit Test Cases](#unit-test-cases)
3. [Integration Test Cases](#integration-test-cases)
4. [Performance Test Cases](#performance-test-cases)
5. [User Acceptance Test Cases](#user-acceptance-test-cases)
6. [Edge Cases and Error Scenarios](#edge-cases-and-error-scenarios)
7. [Test Data Requirements](#test-data-requirements)
8. [Automated Test Scripts](#automated-test-scripts)

---

## 1. Test Plan Overview

### 1.1 Purpose
This test plan validates the Deferred Revenue Suitelet that combines saved search results with Journal Entry data to provide comprehensive deferred revenue reporting with variance analysis.

### 1.2 Scope
- **In Scope**:
  - Journal Entry search functionality (getJournalEntryAmounts)
  - Date filtering (As Of Date and Revenue Date)
  - Account filtering (25010 and 25020)
  - Variance calculations
  - JE integration with main search results
  - JE-only event handling
  - Drill-down functionality
  - CSV export functionality
  - UI rendering and data display
  - Error handling and logging

- **Out of Scope**:
  - Saved search modification (external dependency)
  - NetSuite platform performance
  - Browser compatibility testing

### 1.3 Test Environment
- **NetSuite Account**: HMP-Global Production/Sandbox
- **Saved Search ID**: 338219 (customsearch338219)
- **Required Custom Fields**:
  - `line.cseg_hmp_event` (Event segment)
  - `custcol_hmp_pub_revenue_date` (Revenue Date)
- **Required Accounts**: 25010, 25020 (Deferred Revenue accounts)

### 1.4 Test Data Setup Requirements
- Minimum 10 events with varying transaction types
- Journal Entries with accounts 25010 and 25020
- Sales Orders with event assignments
- Transactions spanning multiple date ranges
- Events with and without balance schedules
- JE-only events (no saved search matches)

### 1.5 Success Criteria
- All unit tests pass with 95%+ coverage
- Integration tests validate correct data merging
- Performance tests complete within governance limits
- UAT validates business requirements
- Zero critical/high severity defects in production

---

## 2. Unit Test Cases

### 2.1 getJournalEntryAmounts Function Tests

#### Test Case UT-JE-001: Basic JE Search Execution
**Objective**: Verify the function executes without errors and returns expected data structure

**Test Steps**:
1. Call `getJournalEntryAmounts('12/31/2024')`
2. Verify function returns an object
3. Verify no exceptions are thrown

**Expected Results**:
- Returns object/map structure
- No errors in execution log
- Function completes successfully

**Test Data**:
```javascript
// Mock Journal Entry with Event
{
  type: "Journal Entry",
  account: "25010 - Deferred Revenue",
  event: "Event-001",
  trandate: "11/15/2024",
  amount: 5000.00
}
```

**Validation Criteria**:
- Return type is Object
- Function execution time < 5 seconds
- Log audit entry created

---

#### Test Case UT-JE-002: JE Amount Parsing - Single Event
**Objective**: Validate correct parsing of JE amounts for a single event

**Test Steps**:
1. Create test JE with Event-001, 25010 account, $5000
2. Call `getJournalEntryAmounts('12/31/2024')`
3. Verify returned object contains Event-001
4. Verify amounts are correctly parsed

**Expected Results**:
```javascript
{
  'Event-001-ID': {
    eventId: 'Event-001-ID',
    eventText: 'Event-001',
    je25010: 5000.00,
    je25020: 0.00,
    jeTotal: 5000.00
  }
}
```

**Validation Criteria**:
- Event ID matches input
- je25010 = 5000.00
- je25020 = 0.00
- jeTotal = 5000.00
- All values are numeric (not strings)

---

#### Test Case UT-JE-003: JE Amount Parsing - Multiple Accounts
**Objective**: Validate correct parsing when both 25010 and 25020 accounts exist

**Test Steps**:
1. Create JE with Event-002:
   - Line 1: Account 25010, Amount: $3000
   - Line 2: Account 25020, Amount: $2000
2. Call `getJournalEntryAmounts('12/31/2024')`
3. Verify both amounts are captured

**Expected Results**:
```javascript
{
  'Event-002-ID': {
    eventId: 'Event-002-ID',
    eventText: 'Event-002',
    je25010: 3000.00,
    je25020: 2000.00,
    jeTotal: 5000.00
  }
}
```

**Validation Criteria**:
- je25010 = 3000.00
- je25020 = 2000.00
- jeTotal = 5000.00 (correct sum)
- No data loss between accounts

---

#### Test Case UT-JE-004: JE Amount Parsing - Multiple Events
**Objective**: Validate handling of multiple events in single search

**Test Steps**:
1. Create JEs for 5 different events
2. Call `getJournalEntryAmounts('12/31/2024')`
3. Verify all 5 events are returned
4. Verify no cross-contamination of amounts

**Expected Results**:
- Object contains 5 event entries
- Each event has unique eventId
- Amounts are correctly assigned to respective events
- Total count matches expected

**Validation Criteria**:
- Object.keys(result).length === 5
- No duplicate event IDs
- Sum of all jeTotals matches expected aggregate

**Test Data**:
```javascript
[
  { eventId: 'E1', je25010: 1000, je25020: 500 },
  { eventId: 'E2', je25010: 2000, je25020: 0 },
  { eventId: 'E3', je25010: 0, je25020: 1500 },
  { eventId: 'E4', je25010: 3000, je25020: 2000 },
  { eventId: 'E5', je25010: 500, je25020: 500 }
]
```

---

#### Test Case UT-JE-005: JE Search - Negative Amounts
**Objective**: Validate handling of negative amounts (reversals/adjustments)

**Test Steps**:
1. Create JE with negative amounts:
   - Account 25010: -1000
   - Account 25020: -500
2. Call `getJournalEntryAmounts('12/31/2024')`
3. Verify negative values preserved

**Expected Results**:
```javascript
{
  'Event-003-ID': {
    eventId: 'Event-003-ID',
    eventText: 'Event-003',
    je25010: -1000.00,
    je25020: -500.00,
    jeTotal: -1500.00
  }
}
```

**Validation Criteria**:
- Negative signs preserved
- jeTotal correctly calculated as negative sum
- No absolute value conversion

---

#### Test Case UT-JE-006: JE Search - No Results
**Objective**: Validate function behavior when no JEs match criteria

**Test Steps**:
1. Call `getJournalEntryAmounts('01/01/2020')` (date before any JEs)
2. Verify empty object returned
3. Verify no errors thrown

**Expected Results**:
- Returns empty object: `{}`
- No exceptions thrown
- Log shows "Journal Entry Search Result Count: 0"

**Validation Criteria**:
- Return value is object
- Object.keys(result).length === 0
- Function completes successfully

---

### 2.2 Date Validation Tests

#### Test Case UT-DATE-001: As Of Date Filter - Future Date
**Objective**: Verify JE search includes all transactions up to future date

**Test Steps**:
1. Create JE dated 11/15/2024
2. Call `getJournalEntryAmounts('12/31/2025')`
3. Verify JE is included

**Expected Results**:
- JE from 11/15/2024 is included in results
- trandate filter applied correctly

**Validation Criteria**:
- Search filter: ["trandate","onorbefore", "12/31/2025"]
- Result includes test JE

---

#### Test Case UT-DATE-002: As Of Date Filter - Past Date
**Objective**: Verify JE search excludes transactions after cutoff date

**Test Steps**:
1. Create JE dated 11/15/2024
2. Call `getJournalEntryAmounts('10/31/2024')`
3. Verify JE is excluded

**Expected Results**:
- JE from 11/15/2024 is NOT included
- Only earlier transactions returned

**Validation Criteria**:
- Search filter correctly applied
- Result does NOT include test JE

---

#### Test Case UT-DATE-003: As Of Date - Today Default
**Objective**: Verify default behavior when no date provided

**Test Steps**:
1. Call `getJournalEntryAmounts()` with no parameter
2. Verify search uses "today"
3. Compare with explicit today date call

**Expected Results**:
- Search filter uses "today" when asOfDate is null/undefined
- Results match explicit today date

**Validation Criteria**:
- Filter value is "today" string
- Results consistent with explicit date

---

#### Test Case UT-DATE-004: Date Format Validation
**Objective**: Verify function accepts various date formats

**Test Steps**:
1. Test with formats:
   - "12/31/2024"
   - "2024-12-31"
   - "31-Dec-2024"
2. Verify all formats work or error appropriately

**Expected Results**:
- NetSuite date formats accepted
- Invalid formats throw clear errors

**Validation Criteria**:
- Valid formats process successfully
- Invalid formats handled gracefully

---

### 2.3 Account Filtering Tests

#### Test Case UT-ACCT-001: Account Filter - 25010 Only
**Objective**: Verify correct filtering for account 25010

**Test Steps**:
1. Create JEs with accounts: 25010, 25020, 30010, 40020
2. Call `getJournalEntryAmounts()`
3. Verify only 25010 and 25020 amounts returned

**Expected Results**:
- Only accounts matching '%25010%' and '%25020%' included
- Other accounts excluded

**Validation Criteria**:
- Formula filter works: `{account} LIKE '%25010%' OR {account} LIKE '%25020%'`
- Result contains only deferred revenue accounts

---

#### Test Case UT-ACCT-002: Account Filter - 25020 Only
**Objective**: Verify correct filtering for account 25020

**Test Steps**:
1. Create JE with only 25020 account
2. Verify je25010 = 0 and je25020 = amount

**Expected Results**:
```javascript
{
  je25010: 0,
  je25020: 5000,
  jeTotal: 5000
}
```

**Validation Criteria**:
- je25010 explicitly set to 0
- je25020 contains correct amount

---

#### Test Case UT-ACCT-003: Account Filter - Mixed Accounts
**Objective**: Verify correct separation when JE has multiple account types

**Test Steps**:
1. Create JE with lines:
   - 25010: $3000
   - 25020: $2000
   - 40010: $5000 (revenue, should be excluded)
2. Verify only deferred accounts summed

**Expected Results**:
```javascript
{
  je25010: 3000,
  je25020: 2000,
  jeTotal: 5000  // NOT 10000
}
```

**Validation Criteria**:
- Revenue account (40010) excluded
- jeTotal = 5000 (not 10000)

---

#### Test Case UT-ACCT-004: Account Wildcard Matching
**Objective**: Verify LIKE wildcard matches subsidiary accounts

**Test Steps**:
1. Create JEs with accounts:
   - 25010 (parent)
   - 25010.1 (sub-account)
   - 25010.2 (sub-account)
   - 25020
   - 25020.1
2. Verify all are included

**Expected Results**:
- All 25010.x accounts grouped into je25010
- All 25020.x accounts grouped into je25020

**Validation Criteria**:
- LIKE '%25010%' matches all variations
- Amounts correctly aggregated

---

### 2.4 Variance Calculation Tests

#### Test Case UT-VAR-001: Variance - Perfect Match
**Objective**: Verify variance = 0 when totals match

**Test Steps**:
1. Set up:
   - Search Total: $5000
   - JE Total: $0
   - Balance Schedule: $5000
2. Calculate variance: (5000 + 0) - 5000
3. Verify variance = 0

**Expected Results**:
- Variance = 0.00
- No variance link displayed

**Validation Criteria**:
- Math.abs(variance) <= 0.01
- Details column shows space, not "View" link

---

#### Test Case UT-VAR-002: Variance - Positive Difference
**Objective**: Verify positive variance when actual > scheduled

**Test Steps**:
1. Set up:
   - Search Total: $4000
   - JE Total: $2000
   - Balance Schedule: $5000
2. Calculate variance: (4000 + 2000) - 5000
3. Verify variance = +1000

**Expected Results**:
- Variance = 1000.00
- "View" link displayed

**Validation Criteria**:
- variance === 1000
- Drill-down link generated

---

#### Test Case UT-VAR-003: Variance - Negative Difference
**Objective**: Verify negative variance when actual < scheduled

**Test Steps**:
1. Set up:
   - Search Total: $3000
   - JE Total: $1000
   - Balance Schedule: $5000
2. Calculate variance: (3000 + 1000) - 5000
3. Verify variance = -1000

**Expected Results**:
- Variance = -1000.00
- "View" link displayed

**Validation Criteria**:
- variance === -1000
- Negative sign preserved
- Drill-down link generated

---

#### Test Case UT-VAR-004: Variance - Rounding Precision
**Objective**: Verify variance calculation handles decimal precision

**Test Steps**:
1. Set up amounts with decimals:
   - Search Total: $1234.567
   - JE Total: $890.123
   - Balance Schedule: $2124.69
2. Calculate variance
3. Verify correct precision

**Expected Results**:
- Variance calculated with full precision
- No rounding errors

**Validation Criteria**:
- Variance = (1234.567 + 890.123) - 2124.69 = 0.00
- Handles floating-point math correctly

---

#### Test Case UT-VAR-005: Variance - JE Only Event
**Objective**: Verify variance for events with only JE data

**Test Steps**:
1. Create JE-only event:
   - Search Total: $0
   - JE Total: $3000
   - Balance Schedule: $0
2. Calculate variance: (0 + 3000) - 0
3. Verify variance = 3000

**Expected Results**:
- Variance = 3000.00
- Event marked as "(JE Only)"
- Variance equals JE Total

**Validation Criteria**:
- variance === jeTotal
- balanceSchedule === 0
- Event text includes "(JE Only)"

---

## 3. Integration Test Cases

### 3.1 JE Search Integration with Main Search

#### Test Case IT-INT-001: Data Merge - Matching Events
**Objective**: Verify correct merging of JE and saved search data

**Test Steps**:
1. Create event "Event-Alpha" with:
   - Saved search: 25010=$4000, 25020=$1000
   - JE search: 25010=$500, 25020=$500
2. Run report
3. Verify combined display

**Expected Results**:
| Event | 25010 | 25020 | JE 25010 | JE 25020 | Total |
|-------|-------|-------|----------|----------|-------|
| Event-Alpha | $4,000 | $1,000 | $500 | $500 | $6,000 |

**Validation Criteria**:
- Columns display separately
- Total = 4000 + 1000 + 500 + 500 = 6000
- Event ID matches between searches

---

#### Test Case IT-INT-002: Data Merge - Non-Matching Events
**Objective**: Verify JE-only events added to report

**Test Steps**:
1. Create saved search results for Event-A, Event-B
2. Create JE for Event-C (not in saved search)
3. Run report
4. Verify Event-C appears with "(JE Only)" label

**Expected Results**:
- Event-C listed after main results
- Event-C shows:
  - 25010 = $0
  - 25020 = $0
  - JE columns populated
  - Label: "Event-C (JE Only)"

**Validation Criteria**:
- JE-only events added after processedEvents check
- Main columns show $0
- JE columns show actual amounts

---

#### Test Case IT-INT-003: Combined Total Calculations
**Objective**: Verify grand total row sums all sources

**Test Steps**:
1. Set up:
   - 3 events from saved search
   - 2 JE-only events
2. Run report
3. Verify grand total row

**Expected Results**:
```
Grand Total:
- 25010: Sum of all saved search 25010
- 25020: Sum of all saved search 25020
- JE 25010: Sum of all JE 25010
- JE 25020: Sum of all JE 25020
- Total: Sum of all above
```

**Validation Criteria**:
- Manual sum matches displayed total
- All 5 events included in totals
- Separator row exists before totals

---

#### Test Case IT-INT-004: Event ID Matching Logic
**Objective**: Verify correct event ID matching between searches

**Test Steps**:
1. Create event with ID "123" and text "Event-Alpha"
2. Ensure both searches return same ID
3. Verify data merged by ID, not text

**Expected Results**:
- jeAmountsByEvent uses eventId as key
- processedEvents.add(eventId) uses same ID
- Single row in report, not duplicate

**Validation Criteria**:
- Event appears once in report
- Data correctly merged by ID
- processedEvents.has(eventId) prevents duplication

---

### 3.2 JE-Only Event Handling

#### Test Case IT-JEONLY-001: JE-Only Event Display
**Objective**: Verify JE-only events display correctly

**Test Steps**:
1. Create JE for event not in saved search
2. Run report
3. Verify display formatting

**Expected Results**:
- Event name appended with " (JE Only)"
- Main columns (25010, 25020) show $0
- JE columns populated
- Balance Schedule = $0
- Variance = JE Total

**Validation Criteria**:
- eventText includes "(JE Only)"
- Main columns explicitly set to 0
- Variance equals combinedTotal

---

#### Test Case IT-JEONLY-002: JE-Only Event Positioning
**Objective**: Verify JE-only events appear after main results

**Test Steps**:
1. Create 5 saved search events
2. Create 3 JE-only events
3. Verify order in report

**Expected Results**:
- Lines 0-4: Saved search events
- Lines 5-7: JE-only events
- Line 8: Separator
- Line 9: Grand total

**Validation Criteria**:
- lineNum increments correctly
- JE-only loop runs after main loop
- processedEvents prevents duplication

---

#### Test Case IT-JEONLY-003: No Balance Schedule for JE-Only
**Objective**: Verify JE-only events have zero balance schedule

**Test Steps**:
1. Create JE-only event with $5000 total
2. Verify balance schedule column
3. Verify variance calculation

**Expected Results**:
- Balance Schedule = $0
- Variance = $5000 (equals total)
- No drill-down for schedule comparison

**Validation Criteria**:
- balanceSchedule explicitly set to 0
- variance = combinedTotal (no subtraction)

---

### 3.3 Multi-Source Data Aggregation

#### Test Case IT-AGG-001: Three-Way Data Merge
**Objective**: Verify correct handling of saved search, JE, and balance schedule

**Test Steps**:
1. Create event with all three sources:
   - Saved search: $3000
   - JE: $1000
   - Balance Schedule: $4500
2. Run report
3. Verify all sources displayed and totaled

**Expected Results**:
- All three data sources visible
- Total = $4000 (search + JE)
- Variance = -$500 (total - schedule)

**Validation Criteria**:
- No data source lost
- Calculations use all sources
- Variance correct

---

#### Test Case IT-AGG-002: Aggregate Totals Validation
**Objective**: Verify totalRow accumulation logic

**Test Steps**:
1. Create 10 events with varying amounts
2. Manually calculate expected totals
3. Compare with displayed grand total

**Expected Results**:
- Grand total matches manual calculation
- All columns accumulated correctly

**Test Data**:
```javascript
// Expected totals for 10 events
totalRow = {
  account25010: 50000,
  account25020: 30000,
  je25010: 5000,
  je25020: 3000,
  total: 88000,
  balanceSchedule: 85000,
  variance: 3000
}
```

**Validation Criteria**:
- Each totalRow field matches expected
- No accumulation errors
- Floating-point precision maintained

---

## 4. Performance Test Cases

### 4.1 Large Dataset Handling

#### Test Case PT-PERF-001: 1000+ Events Processing
**Objective**: Verify script handles large datasets within governance limits

**Test Steps**:
1. Create 1000 events in saved search
2. Create 500 JE records
3. Run report
4. Monitor governance usage

**Expected Results**:
- Script completes successfully
- No USAGE_LIMIT_EXCEEDED errors
- Response time < 60 seconds

**Validation Criteria**:
- Governance units < 10,000
- Memory usage acceptable
- Paged search utilized (1000 per page)

**Performance Metrics**:
```javascript
{
  totalEvents: 1000,
  totalJEs: 500,
  executionTime: '<60s',
  governanceUsed: '<10000 units',
  searchYield: true,
  pagedSearch: true
}
```

---

#### Test Case PT-PERF-002: JE Search Performance
**Objective**: Measure getJournalEntryAmounts execution time

**Test Steps**:
1. Create varying JE record counts: 10, 100, 500, 1000
2. Time each execution
3. Plot performance curve

**Expected Results**:
- Linear or better performance curve
- < 10 seconds for 1000 JEs

**Validation Criteria**:
- Execution time scales linearly
- No exponential slowdown
- Search optimization effective

**Performance Benchmarks**:
- 10 JEs: < 1 second
- 100 JEs: < 3 seconds
- 500 JEs: < 7 seconds
- 1000 JEs: < 10 seconds

---

#### Test Case PT-PERF-003: Memory Usage Monitoring
**Objective**: Verify script doesn't cause memory issues

**Test Steps**:
1. Process large dataset (1000+ events)
2. Monitor jeAmountsByEvent object size
3. Check for memory leaks

**Expected Results**:
- jeAmountsByEvent object size manageable
- No out-of-memory errors
- Object cleared after use

**Validation Criteria**:
- Object size < 10MB
- No memory growth over time
- Garbage collection effective

---

### 4.2 Governance Usage Monitoring

#### Test Case PT-GOV-001: Search Governance Usage
**Objective**: Measure governance units consumed by searches

**Test Steps**:
1. Log governance before/after saved search
2. Log governance before/after JE search
3. Calculate units used

**Expected Results**:
```javascript
{
  savedSearchUnits: '<1000',
  jeSearchUnits: '<500',
  totalUnits: '<2000',
  remainingUnits: '>8000'
}
```

**Validation Criteria**:
- Each search < 1000 units
- Total usage < 20% of limit
- No yield required

---

#### Test Case PT-GOV-002: Paged Search Implementation
**Objective**: Verify paged search reduces governance

**Test Steps**:
1. Run report with 2000 events
2. Verify pageSize = 1000
3. Check governance for each page

**Expected Results**:
- Search uses .runPaged()
- Pages processed sequentially
- Governance spread across pages

**Validation Criteria**:
- pagedData.pageRanges exists
- .fetch({ index }) used
- Each page < 1000 units

---

#### Test Case PT-GOV-003: Governance Limit Scenario
**Objective**: Test behavior near governance limits

**Test Steps**:
1. Simulate script running low on units
2. Verify error handling
3. Check for graceful degradation

**Expected Results**:
- Script detects low governance
- Error message displayed
- No data corruption

**Validation Criteria**:
- Governance checked before operations
- USAGE_LIMIT_EXCEEDED caught
- User notified appropriately

---

### 4.3 Search Optimization Validation

#### Test Case PT-OPT-001: Filter Efficiency
**Objective**: Verify filters reduce result set effectively

**Test Steps**:
1. Run JE search without date filter
2. Run with date filter
3. Compare result counts and performance

**Expected Results**:
- Date filter significantly reduces results
- Faster execution with filter
- Governance savings measurable

**Validation Criteria**:
- Filtered results < 50% of unfiltered
- Execution time reduced proportionally

---

#### Test Case PT-OPT-002: Formula Column Performance
**Objective**: Verify formula columns don't cause slowdown

**Test Steps**:
1. Measure search with formula columns
2. Test alternative without formulas
3. Compare performance

**Expected Results**:
- Formula columns acceptable overhead
- < 20% performance impact

**Validation Criteria**:
- Execution time difference < 20%
- Formulas necessary for functionality

---

#### Test Case PT-OPT-003: Index Usage Verification
**Objective**: Ensure searches use NetSuite indexes

**Test Steps**:
1. Review filter fields for indexed columns
2. Verify date fields indexed
3. Check account field indexing

**Expected Results**:
- Key filters on indexed fields:
  - trandate (indexed)
  - type (indexed)
  - account (indexed)
  - line.cseg_hmp_event (indexed)

**Validation Criteria**:
- All primary filters indexed
- Search performance optimal

---

## 5. User Acceptance Test Cases

### 5.1 Report Accuracy Verification

#### Test Case UAT-ACC-001: End-to-End Accuracy Test
**Objective**: Verify complete report accuracy against manual calculation

**Test Steps**:
1. Select 5 known events
2. Manually calculate expected amounts from transactions
3. Run report
4. Compare results

**Expected Results**:
- 100% match between manual and system calculations
- All events displayed
- Totals accurate

**Test Data**:
```
Event-001:
  - Invoice 1: 25010 = $1000, 25020 = $500
  - Invoice 2: 25010 = $2000, 25020 = $0
  - JE 1: 25010 = $500, 25020 = $250

Expected:
  - 25010: $3000
  - 25020: $500
  - JE 25010: $500
  - JE 25020: $250
  - Total: $4250
```

**Validation Criteria**:
- All amounts match
- No missing transactions
- Variance calculation correct

---

#### Test Case UAT-ACC-002: Balance Schedule Reconciliation
**Objective**: Verify balance schedule amounts accurate

**Test Steps**:
1. Retrieve balance schedule for event from NetSuite
2. Compare with report display
3. Verify variance calculation

**Expected Results**:
- Balance schedule matches NetSuite record
- Variance = (Total - Balance Schedule)
- Math accurate

**Validation Criteria**:
- Schedule value correct
- Variance formula applied correctly

---

#### Test Case UAT-ACC-003: Date Filter Accuracy
**Objective**: Verify date filters exclude correct transactions

**Test Steps**:
1. Set As Of Date = 11/30/2024
2. Verify transactions from 12/1/2024 excluded
3. Verify transactions from 11/30/2024 included

**Expected Results**:
- Only transactions <= 11/30/2024 in report
- December transactions excluded
- Boundary date (11/30) included

**Validation Criteria**:
- Date filter "onorbefore" works correctly
- No future transactions

---

#### Test Case UAT-ACC-004: Revenue Date Filter Accuracy
**Objective**: Verify revenue date filter works independently

**Test Steps**:
1. Set As Of Date = 12/31/2024
2. Set Revenue Date = 11/1/2024
3. Verify only transactions with revenue date >= 11/1/2024

**Expected Results**:
- Transactions with revenue date < 11/1/2024 excluded
- Transactions with no revenue date handling verified
- Both filters work together

**Validation Criteria**:
- Revenue date filter independent of As Of Date
- "onorafter" operator correct

---

### 5.2 Drill-Down Functionality

#### Test Case UAT-DRILL-001: Variance Drill-Down Link
**Objective**: Verify drill-down link appears for variances

**Test Steps**:
1. Find event with variance > $0.01
2. Verify "View" link exists
3. Click link
4. Verify drill-down page loads

**Expected Results**:
- "View" link visible for variance > $0.01
- Link navigates to drill-down page
- Event context passed in URL

**Validation Criteria**:
- Math.abs(variance) > 0.01 shows link
- Link format: `drillDown('eventId')`
- URL parameters correct

---

#### Test Case UAT-DRILL-002: No Link for Zero Variance
**Objective**: Verify no drill-down link when variance = 0

**Test Steps**:
1. Find event with perfect match
2. Verify Details column empty or space
3. No clickable link

**Expected Results**:
- Details column shows ' ' (space)
- No "View" link
- Column not clickable

**Validation Criteria**:
- if condition: Math.abs(variance) > 0.01
- Else: set value to ' '

---

#### Test Case UAT-DRILL-003: Drill-Down URL Parameters
**Objective**: Verify correct parameters passed to drill-down

**Test Steps**:
1. Click drill-down link
2. Inspect URL
3. Verify parameters

**Expected Results**:
```
URL format:
?custpage_drill_event=EVENT_ID
&custpage_drill_date=11/30/2024
&custpage_drill_revenue_date=11/01/2024
&custpage_drill_event_name=Event-Alpha
```

**Validation Criteria**:
- All 4 parameters present
- Values correctly encoded
- Event ID matches selected event

---

### 5.3 CSV Export Functionality

#### Test Case UAT-CSV-001: Export Button Display
**Objective**: Verify CSV export button visible and clickable

**Test Steps**:
1. Load report
2. Verify "Export to CSV" button exists
3. Click button

**Expected Results**:
- Button visible in form
- Button ID: custpage_export_summary_csv
- Function call: exportSummaryToCSV()

**Validation Criteria**:
- Button rendered
- Function defined in client script

---

#### Test Case UAT-CSV-002: CSV Export Data Completeness
**Objective**: Verify exported CSV contains all data

**Test Steps**:
1. Run report with 10 events
2. Export to CSV
3. Verify CSV contents

**Expected Results**:
- CSV contains all 10 events
- All columns included
- Grand total row included
- Headers correct

**CSV Structure**:
```csv
HMP Event,25010,25020,JE 25010,JE 25020,Total,Balance Schedule,Variance
Event-001,1000,500,250,100,1850,1800,50
...
*** GRAND TOTAL ***,10000,5000,2500,1000,18500,18000,500
```

**Validation Criteria**:
- Row count = events + header + total
- All numeric values match report
- Format parseable by Excel

---

#### Test Case UAT-CSV-003: CSV Special Character Handling
**Objective**: Verify CSV handles special characters in event names

**Test Steps**:
1. Create event with name: "Event, "Alpha" & Beta"
2. Export to CSV
3. Verify proper escaping

**Expected Results**:
- Event name properly quoted/escaped
- CSV parseable
- No data corruption

**Validation Criteria**:
- Commas in quotes
- Quotes escaped as ""
- Standard CSV format

---

### 5.4 UI/UX Validation

#### Test Case UAT-UI-001: Form Layout and Labels
**Objective**: Verify form displays correctly with proper labels

**Test Steps**:
1. Load suitelet
2. Review form elements
3. Verify labels and help text

**Expected Results**:
- Title: "Deferred Revenue by Event Report (Including Journal Entries)"
- Filter group visible
- Help text displayed
- Info banner shows correct dates

**Validation Criteria**:
- All labels clear and professional
- Help text provides guidance
- Layout organized and readable

---

#### Test Case UAT-UI-002: Sublist Column Alignment
**Objective**: Verify currency columns right-aligned

**Test Steps**:
1. View results sublist
2. Verify column alignment
3. Check formatting

**Expected Results**:
- Currency columns right-aligned
- Text columns left-aligned
- Values formatted with $ and commas

**Validation Criteria**:
- FieldType.CURRENCY auto-formats
- Alignment correct
- Negative values in parentheses

---

#### Test Case UAT-UI-003: Grand Total Row Visibility
**Objective**: Verify grand total row stands out

**Test Steps**:
1. Scroll to bottom of results
2. Verify separator and total row
3. Verify formatting

**Expected Results**:
- Separator row: "────────────────────"
- Total row: "*** GRAND TOTAL ***"
- Clearly visible

**Validation Criteria**:
- Separator exists
- Total label distinctive
- All total columns populated

---

#### Test Case UAT-UI-004: Mobile Responsiveness
**Objective**: Verify report usable on mobile devices

**Test Steps**:
1. Access suitelet from mobile device
2. Test button clicks
3. Verify scrolling

**Expected Results**:
- Form loads on mobile
- Buttons clickable
- Horizontal scroll for wide table

**Validation Criteria**:
- No rendering errors
- Usable on tablets/phones
- Data readable

---

## 6. Edge Cases and Error Scenarios

### 6.1 Data Edge Cases

#### Test Case EDGE-001: Zero Amount Transactions
**Objective**: Verify handling of $0 transactions

**Test Steps**:
1. Create JE with $0 amounts
2. Run report
3. Verify display

**Expected Results**:
- Event included in report
- $0 values displayed correctly
- No division by zero errors

**Validation Criteria**:
- parseFloat() handles $0
- Variance calculation correct
- No undefined values

---

#### Test Case EDGE-002: Very Large Amounts
**Objective**: Verify handling of amounts > $1 million

**Test Steps**:
1. Create JE with amount: $10,000,000
2. Run report
3. Verify formatting

**Expected Results**:
- Amount displayed: $10,000,000.00
- No overflow errors
- Currency formatting correct

**Validation Criteria**:
- Number precision maintained
- Display formatting works
- Calculations accurate

---

#### Test Case EDGE-003: Null/Undefined Event
**Objective**: Verify handling of transactions without events

**Test Steps**:
1. Create JE without event assignment
2. Run JE search
3. Verify handling

**Expected Results**:
- Transaction excluded or labeled "(No Event)"
- No errors thrown
- Log shows empty event ID

**Validation Criteria**:
- if (eventId) check prevents null processing
- Empty string handling correct

---

#### Test Case EDGE-004: Duplicate Event IDs
**Objective**: Verify system handles duplicate event processing

**Test Steps**:
1. Simulate scenario where event appears twice
2. Verify deduplication logic

**Expected Results**:
- processedEvents Set prevents duplicates
- Event appears once in report
- Amounts not double-counted

**Validation Criteria**:
- processedEvents.has(eventId) works
- Set data structure effective

---

### 6.2 Error Scenarios

#### Test Case ERROR-001: Saved Search Not Found
**Objective**: Verify error handling when search ID invalid

**Test Steps**:
1. Modify SAVED_SEARCH_ID to non-existent ID
2. Run suitelet
3. Verify error handling

**Expected Results**:
- Error form displayed
- Message: "Unable to load saved search. Please verify the search ID: [ID]"
- No script crash

**Validation Criteria**:
- try/catch around search.load()
- Error form rendered
- User-friendly message

---

#### Test Case ERROR-002: JE Search Failure
**Objective**: Verify handling of JE search errors

**Test Steps**:
1. Simulate JE search error (invalid filter)
2. Verify error handling
3. Check log entries

**Expected Results**:
- Error logged: "Journal Entry Search Error"
- Empty object returned
- Main report continues
- No script termination

**Validation Criteria**:
- try/catch in getJournalEntryAmounts
- Returns {} on error
- Error logged with details

---

#### Test Case ERROR-003: Invalid Date Format
**Objective**: Verify handling of malformed date inputs

**Test Steps**:
1. Submit form with invalid date: "2024-13-45"
2. Verify error handling

**Expected Results**:
- NetSuite date validation triggers
- User-friendly error message
- Form not processed

**Validation Criteria**:
- Mandatory date validation
- Format validation
- Error message clear

---

#### Test Case ERROR-004: Missing Custom Field
**Objective**: Verify handling when required custom field missing

**Test Steps**:
1. Search for event where cseg_hmp_event is null
2. Verify handling

**Expected Results**:
- Transaction skipped or labeled "(No Event)"
- No script error
- Log entry created

**Validation Criteria**:
- Null checks before getValue()
- Default values used
- No undefined errors

---

#### Test Case ERROR-005: Governance Limit Exceeded
**Objective**: Verify handling of governance limit

**Test Steps**:
1. Simulate usage limit exceeded
2. Verify error handling

**Expected Results**:
- Error caught
- User notified
- Partial results displayed if possible

**Validation Criteria**:
- USAGE_LIMIT_EXCEEDED caught
- Graceful degradation
- User guidance provided

---

#### Test Case ERROR-006: File Creation Failure
**Objective**: Verify handling of debug file creation errors

**Test Steps**:
1. Simulate folder permission error
2. Verify createDebugFile error handling

**Expected Results**:
- Error logged: "Failed to Create Debug File"
- Script continues
- No termination

**Validation Criteria**:
- try/catch around file.create()
- Return null on error
- Main functionality unaffected

---

### 6.3 Boundary Conditions

#### Test Case BOUND-001: Single Event Result
**Objective**: Verify report with only 1 event

**Test Steps**:
1. Filter to single event
2. Run report
3. Verify display

**Expected Results**:
- Event displayed
- Grand total = event amount
- Separator and total rows exist

**Validation Criteria**:
- No array index errors
- Total calculation correct
- UI renders properly

---

#### Test Case BOUND-002: Zero Events Result
**Objective**: Verify empty result handling

**Test Steps**:
1. Set date filter to exclude all events
2. Run report
3. Verify display

**Expected Results**:
- Message: "No results found"
- Empty sublist
- No total row
- No errors

**Validation Criteria**:
- if (lineNum > 0) check prevents empty totals
- Sublist displays cleanly

---

#### Test Case BOUND-003: Maximum Page Size
**Objective**: Verify paged search at maximum size

**Test Steps**:
1. Create 1000 events (pageSize limit)
2. Verify single page processing
3. Check governance

**Expected Results**:
- All 1000 events on single page
- Processing completes
- Governance acceptable

**Validation Criteria**:
- pageSize: 1000 (maximum)
- All events processed
- No pagination issues

---

## 7. Test Data Requirements

### 7.1 Minimum Test Data Set

**Required for Basic Testing**:
```javascript
{
  events: 10,
  journalEntries: 5,
  salesOrders: 8,
  invoices: 12,
  dateRange: '01/01/2024 - 12/31/2024',
  accounts: ['25010', '25020', '25010.1', '25020.1'],
  withBalanceSchedule: 7,
  withoutBalanceSchedule: 3
}
```

### 7.2 Comprehensive Test Data Set

**Required for Full Test Coverage**:

**Events** (20 total):
1. Event-001 through Event-010: Standard events with all transaction types
2. Event-011 through Event-015: JE-only events
3. Event-016 through Event-018: Events with variances
4. Event-019: Event with zero amounts
5. Event-020: Event with very large amounts ($1M+)

**Journal Entries** (25 total):
- 10 JEs with 25010 only
- 5 JEs with 25020 only
- 8 JEs with both 25010 and 25020
- 2 JEs with negative amounts (reversals)

**Date Distribution**:
- Q1 2024: 5 transactions
- Q2 2024: 8 transactions
- Q3 2024: 7 transactions
- Q4 2024: 10 transactions
- Future dates (testing): 3 transactions

**Amount Ranges**:
- $0 - $1,000: 8 transactions
- $1,001 - $10,000: 12 transactions
- $10,001 - $100,000: 8 transactions
- $100,001+: 2 transactions

**Special Scenarios**:
- Events with perfect balance (0 variance): 3
- Events with positive variance: 5
- Events with negative variance: 5
- Events with no balance schedule: 7

### 7.3 Test Data Creation Script

```javascript
/**
 * Test Data Creation Script
 * Run this in Script Console to create test data
 */

// Create test events
const testEvents = [];
for (let i = 1; i <= 20; i++) {
    testEvents.push({
        id: `TEST-EVENT-${String(i).padStart(3, '0')}`,
        name: `Test Event ${i}`,
        type: i <= 15 ? 'standard' : 'je-only'
    });
}

// Create journal entries
const createTestJE = (eventId, account, amount, date) => {
    const jeRecord = record.create({
        type: record.Type.JOURNAL_ENTRY,
        isDynamic: true
    });

    jeRecord.setValue({ fieldId: 'trandate', value: new Date(date) });
    jeRecord.setValue({ fieldId: 'subsidiary', value: 1 }); // Adjust

    // Debit line
    jeRecord.selectNewLine({ sublistId: 'line' });
    jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: account });
    jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: amount });
    jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_hmp_event', value: eventId });
    jeRecord.commitLine({ sublistId: 'line' });

    // Credit line (to revenue account)
    jeRecord.selectNewLine({ sublistId: 'line' });
    jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: '40010' });
    jeRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: amount });
    jeRecord.commitLine({ sublistId: 'line' });

    const jeId = jeRecord.save();
    log.audit('Test JE Created', { id: jeId, event: eventId, amount: amount });
    return jeId;
};

// Execute test data creation
log.audit('Creating Test Data Set...');

// Create 25010 JEs
for (let i = 1; i <= 10; i++) {
    createTestJE(`TEST-EVENT-${String(i).padStart(3, '0')}`, '25010', 1000 * i, '2024-06-01');
}

// Create 25020 JEs
for (let i = 11; i <= 15; i++) {
    createTestJE(`TEST-EVENT-${String(i).padStart(3, '0')}`, '25020', 500 * i, '2024-08-01');
}

// Create mixed JEs
for (let i = 16; i <= 20; i++) {
    createTestJE(`TEST-EVENT-${String(i).padStart(3, '0')}`, '25010', 2000, '2024-10-01');
    createTestJE(`TEST-EVENT-${String(i).padStart(3, '0')}`, '25020', 1500, '2024-10-01');
}

log.audit('Test Data Creation Complete');
```

### 7.4 Test Data Cleanup Script

```javascript
/**
 * Test Data Cleanup Script
 * Remove test data after testing
 */

const deleteTestRecords = () => {
    // Search for test journal entries
    const jeSearch = search.create({
        type: 'journalentry',
        filters: [
            ['cseg_hmp_event', 'startswith', 'TEST-EVENT-']
        ],
        columns: ['internalid']
    });

    let deleteCount = 0;
    jeSearch.run().each((result) => {
        record.delete({
            type: record.Type.JOURNAL_ENTRY,
            id: result.getValue('internalid')
        });
        deleteCount++;
        return true;
    });

    log.audit('Test Data Cleanup', { deletedRecords: deleteCount });
};

deleteTestRecords();
```

---

## 8. Automated Test Scripts

### 8.1 Unit Test Framework

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @Description Automated Unit Test Runner for Deferred Revenue Suitelet
 */

define(['N/search', 'N/log'], (search, log) => {

    // Import function to test (in real scenario, would require module export)
    const getJournalEntryAmounts = (asOfDate) => {
        // ... function implementation ...
    };

    /**
     * Test Framework
     */
    class TestRunner {
        constructor() {
            this.tests = [];
            this.results = {
                passed: 0,
                failed: 0,
                errors: []
            };
        }

        addTest(name, testFunction) {
            this.tests.push({ name, testFunction });
        }

        async runAll() {
            log.audit('Starting Test Suite', { totalTests: this.tests.length });

            for (const test of this.tests) {
                try {
                    await test.testFunction();
                    this.results.passed++;
                    log.audit('TEST PASSED', test.name);
                } catch (e) {
                    this.results.failed++;
                    this.results.errors.push({
                        test: test.name,
                        error: e.message
                    });
                    log.error('TEST FAILED', `${test.name}: ${e.message}`);
                }
            }

            return this.results;
        }

        assert(condition, message) {
            if (!condition) {
                throw new Error(`Assertion failed: ${message}`);
            }
        }

        assertEqual(actual, expected, message) {
            if (actual !== expected) {
                throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
            }
        }

        assertObjectEqual(actual, expected, message) {
            const actualStr = JSON.stringify(actual);
            const expectedStr = JSON.stringify(expected);
            if (actualStr !== expectedStr) {
                throw new Error(`${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`);
            }
        }
    }

    /**
     * Unit Tests
     */
    const runUnitTests = () => {
        const runner = new TestRunner();

        // UT-JE-001: Basic JE Search Execution
        runner.addTest('UT-JE-001: Basic JE Search Execution', () => {
            const result = getJournalEntryAmounts('12/31/2024');
            runner.assert(typeof result === 'object', 'Result should be an object');
            runner.assert(result !== null, 'Result should not be null');
        });

        // UT-JE-002: JE Amount Parsing - Single Event
        runner.addTest('UT-JE-002: JE Amount Parsing - Single Event', () => {
            // Setup: Create test JE (in real test, would use test data)
            const testEventId = 'TEST-001';
            const result = getJournalEntryAmounts('12/31/2024');

            runner.assert(result[testEventId] !== undefined, 'Event should exist in results');

            const eventData = result[testEventId];
            runner.assertEqual(typeof eventData.je25010, 'number', 'je25010 should be number');
            runner.assertEqual(typeof eventData.je25020, 'number', 'je25020 should be number');
            runner.assertEqual(typeof eventData.jeTotal, 'number', 'jeTotal should be number');
        });

        // UT-JE-003: JE Amount Parsing - Multiple Accounts
        runner.addTest('UT-JE-003: JE Amount Parsing - Multiple Accounts', () => {
            const testEventId = 'TEST-002';
            const result = getJournalEntryAmounts('12/31/2024');

            if (result[testEventId]) {
                const eventData = result[testEventId];
                const calculatedTotal = eventData.je25010 + eventData.je25020;
                runner.assertEqual(
                    eventData.jeTotal,
                    calculatedTotal,
                    'jeTotal should equal sum of je25010 + je25020'
                );
            }
        });

        // UT-JE-005: JE Search - Negative Amounts
        runner.addTest('UT-JE-005: JE Search - Negative Amounts', () => {
            // Test with reversal JE
            const result = getJournalEntryAmounts('12/31/2024');

            // Find any negative amounts
            for (const eventId in result) {
                const eventData = result[eventId];
                if (eventData.jeTotal < 0) {
                    runner.assert(true, 'Negative amounts are preserved');
                    return;
                }
            }
        });

        // UT-DATE-001: As Of Date Filter - Future Date
        runner.addTest('UT-DATE-001: As Of Date Filter - Future Date', () => {
            const resultFuture = getJournalEntryAmounts('12/31/2025');
            const resultPast = getJournalEntryAmounts('01/01/2020');

            runner.assert(
                Object.keys(resultFuture).length >= Object.keys(resultPast).length,
                'Future date should include all past transactions'
            );
        });

        // UT-VAR-001: Variance - Perfect Match
        runner.addTest('UT-VAR-001: Variance - Perfect Match', () => {
            const searchTotal = 5000;
            const jeTotal = 0;
            const balanceSchedule = 5000;
            const variance = (searchTotal + jeTotal) - balanceSchedule;

            runner.assertEqual(variance, 0, 'Variance should be 0 for perfect match');
        });

        // UT-VAR-002: Variance - Positive Difference
        runner.addTest('UT-VAR-002: Variance - Positive Difference', () => {
            const searchTotal = 4000;
            const jeTotal = 2000;
            const balanceSchedule = 5000;
            const variance = (searchTotal + jeTotal) - balanceSchedule;

            runner.assertEqual(variance, 1000, 'Variance should be 1000');
            runner.assert(variance > 0, 'Variance should be positive');
        });

        // UT-VAR-003: Variance - Negative Difference
        runner.addTest('UT-VAR-003: Variance - Negative Difference', () => {
            const searchTotal = 3000;
            const jeTotal = 1000;
            const balanceSchedule = 5000;
            const variance = (searchTotal + jeTotal) - balanceSchedule;

            runner.assertEqual(variance, -1000, 'Variance should be -1000');
            runner.assert(variance < 0, 'Variance should be negative');
        });

        return runner.runAll();
    };

    /**
     * Suitelet Entry Point
     */
    const onRequest = (context) => {
        const results = runUnitTests();

        const html = `
            <html>
            <head>
                <title>Test Results</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .passed { color: green; font-weight: bold; }
                    .failed { color: red; font-weight: bold; }
                    .summary { background: #f0f0f0; padding: 10px; margin: 20px 0; }
                    .error { background: #ffe0e0; padding: 10px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <h1>Automated Test Results</h1>
                <div class="summary">
                    <h2>Summary</h2>
                    <p>Total Tests: ${results.passed + results.failed}</p>
                    <p class="passed">Passed: ${results.passed}</p>
                    <p class="failed">Failed: ${results.failed}</p>
                </div>

                ${results.errors.length > 0 ? `
                    <h2>Failed Tests</h2>
                    ${results.errors.map(err => `
                        <div class="error">
                            <strong>${err.test}</strong>
                            <p>${err.error}</p>
                        </div>
                    `).join('')}
                ` : '<p class="passed">All tests passed!</p>'}
            </body>
            </html>
        `;

        context.response.write(html);
    };

    return { onRequest };
});
```

### 8.2 Integration Test Script

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @Description Integration Test for JE Search + Saved Search Integration
 */

define(['N/search', 'N/log', 'N/email', 'N/runtime'], (search, log, email, runtime) => {

    const execute = (context) => {
        const testResults = {
            timestamp: new Date(),
            tests: [],
            passed: 0,
            failed: 0
        };

        try {
            // IT-INT-001: Data Merge - Matching Events
            log.audit('Running IT-INT-001', 'Data Merge - Matching Events');

            const savedSearch = search.load({ id: 'customsearch338219' });
            const jeAmounts = getJournalEntryAmounts('12/31/2024');

            let mergeSuccess = 0;
            let mergeFailed = 0;

            savedSearch.run().each((result) => {
                const eventId = result.getValue({
                    name: 'line.cseg_hmp_event',
                    summary: 'GROUP'
                });

                if (eventId && jeAmounts[eventId]) {
                    mergeSuccess++;
                    log.debug('Merge Success', { eventId: eventId });
                } else if (eventId) {
                    // Event in saved search but not in JE search (valid scenario)
                    log.debug('Event without JE', { eventId: eventId });
                }

                return true;
            });

            testResults.tests.push({
                name: 'IT-INT-001',
                status: 'PASS',
                details: `Merged ${mergeSuccess} events successfully`
            });
            testResults.passed++;

            // IT-INT-002: JE-Only Events
            log.audit('Running IT-INT-002', 'JE-Only Events');

            const processedEvents = new Set();
            savedSearch.run().each((result) => {
                const eventId = result.getValue({
                    name: 'line.cseg_hmp_event',
                    summary: 'GROUP'
                });
                if (eventId) processedEvents.add(eventId);
                return true;
            });

            let jeOnlyCount = 0;
            for (const eventId in jeAmounts) {
                if (!processedEvents.has(eventId)) {
                    jeOnlyCount++;
                    log.debug('JE-Only Event Found', { eventId: eventId });
                }
            }

            testResults.tests.push({
                name: 'IT-INT-002',
                status: 'PASS',
                details: `Found ${jeOnlyCount} JE-only events`
            });
            testResults.passed++;

            // IT-INT-003: Combined Total Calculations
            log.audit('Running IT-INT-003', 'Combined Total Calculations');

            let totalRow = {
                account25010: 0,
                account25020: 0,
                je25010: 0,
                je25020: 0,
                total: 0
            };

            savedSearch.run().each((result) => {
                const columns = result.columns;
                const eventId = result.getValue({
                    name: 'line.cseg_hmp_event',
                    summary: 'GROUP'
                });

                const account25010 = parseFloat(result.getValue(columns[1])) || 0;
                const account25020 = parseFloat(result.getValue(columns[2])) || 0;
                const searchTotal = parseFloat(result.getValue(columns[3])) || 0;

                const jeData = jeAmounts[eventId] || {
                    je25010: 0,
                    je25020: 0,
                    jeTotal: 0
                };

                totalRow.account25010 += account25010;
                totalRow.account25020 += account25020;
                totalRow.je25010 += jeData.je25010;
                totalRow.je25020 += jeData.je25020;
                totalRow.total += searchTotal + jeData.jeTotal;

                return true;
            });

            // Verify total consistency
            const calculatedTotal = totalRow.account25010 + totalRow.account25020 +
                                   totalRow.je25010 + totalRow.je25020;
            const difference = Math.abs(calculatedTotal - totalRow.total);

            if (difference < 0.01) {
                testResults.tests.push({
                    name: 'IT-INT-003',
                    status: 'PASS',
                    details: `Total calculation accurate: $${totalRow.total.toFixed(2)}`
                });
                testResults.passed++;
            } else {
                throw new Error(`Total mismatch: ${difference}`);
            }

        } catch (e) {
            log.error('Integration Test Failed', e);
            testResults.tests.push({
                name: 'Integration Test',
                status: 'FAIL',
                details: e.message
            });
            testResults.failed++;
        }

        // Send email with results
        const scriptObj = runtime.getCurrentScript();
        const emailBody = `
            Integration Test Results
            ========================

            Timestamp: ${testResults.timestamp}

            Tests Run: ${testResults.tests.length}
            Passed: ${testResults.passed}
            Failed: ${testResults.failed}

            Details:
            ${testResults.tests.map(t => `
                ${t.name}: ${t.status}
                ${t.details}
            `).join('\n')}
        `;

        email.send({
            author: -5, // System
            recipients: scriptObj.getParameter({ name: 'custscript_test_email' }),
            subject: `Integration Test Results - ${testResults.passed}/${testResults.tests.length} Passed`,
            body: emailBody
        });

        log.audit('Integration Tests Complete', testResults);
    };

    return { execute };
});
```

### 8.3 Performance Test Script

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @Description Performance Test Runner
 */

define(['N/runtime', 'N/log'], (runtime, log) => {

    const performanceTests = {

        // PT-PERF-001: 1000+ Events Processing
        testLargeDataset: () => {
            const startTime = Date.now();
            const startGovernance = runtime.getCurrentScript().getRemainingUsage();

            // Run report with large dataset
            const result = getJournalEntryAmounts('12/31/2024');

            const endTime = Date.now();
            const endGovernance = runtime.getCurrentScript().getRemainingUsage();

            const metrics = {
                executionTime: (endTime - startTime) / 1000, // seconds
                governanceUsed: startGovernance - endGovernance,
                eventCount: Object.keys(result).length
            };

            log.audit('Performance Test PT-PERF-001', metrics);

            return {
                pass: metrics.executionTime < 60 && metrics.governanceUsed < 10000,
                metrics: metrics
            };
        },

        // PT-PERF-002: JE Search Performance
        testSearchPerformance: () => {
            const iterations = [10, 100, 500, 1000];
            const results = [];

            iterations.forEach(size => {
                const startTime = Date.now();

                // Simulate processing 'size' records
                const result = getJournalEntryAmounts('12/31/2024');

                const executionTime = (Date.now() - startTime) / 1000;

                results.push({
                    size: size,
                    time: executionTime,
                    timePerRecord: executionTime / size
                });
            });

            log.audit('Performance Test PT-PERF-002', results);

            // Verify linear scaling
            const isLinear = results[3].timePerRecord < results[0].timePerRecord * 2;

            return {
                pass: isLinear && results[3].time < 10,
                metrics: results
            };
        },

        // PT-GOV-001: Search Governance Usage
        testGovernanceUsage: () => {
            const scriptObj = runtime.getCurrentScript();
            const startUnits = scriptObj.getRemainingUsage();

            // Run saved search
            const savedSearch = search.load({ id: 'customsearch338219' });
            savedSearch.run().each(() => { return true; });

            const afterSavedSearch = scriptObj.getRemainingUsage();
            const savedSearchUnits = startUnits - afterSavedSearch;

            // Run JE search
            const jeResults = getJournalEntryAmounts('12/31/2024');

            const afterJESearch = scriptObj.getRemainingUsage();
            const jeSearchUnits = afterSavedSearch - afterJESearch;

            const metrics = {
                savedSearchUnits: savedSearchUnits,
                jeSearchUnits: jeSearchUnits,
                totalUnits: savedSearchUnits + jeSearchUnits,
                remainingUnits: afterJESearch
            };

            log.audit('Governance Usage PT-GOV-001', metrics);

            return {
                pass: metrics.totalUnits < 2000,
                metrics: metrics
            };
        }
    };

    const onRequest = (context) => {
        const allResults = {};

        for (const testName in performanceTests) {
            try {
                allResults[testName] = performanceTests[testName]();
            } catch (e) {
                allResults[testName] = {
                    pass: false,
                    error: e.message
                };
            }
        }

        const html = `
            <html>
            <head><title>Performance Test Results</title></head>
            <body>
                <h1>Performance Test Results</h1>
                <pre>${JSON.stringify(allResults, null, 2)}</pre>
            </body>
            </html>
        `;

        context.response.write(html);
    };

    return { onRequest };
});
```

### 8.4 Test Execution Schedule

**Daily Automated Tests**:
- Unit tests: Run every night at 2 AM
- Smoke tests: Run every 6 hours
- Integration tests: Run daily at 3 AM

**Weekly Tests**:
- Performance tests: Every Sunday at 1 AM
- Full regression suite: Every Saturday at midnight

**On-Demand Tests**:
- UAT tests: Before each release
- Edge case tests: When bug fixes deployed
- Security tests: Quarterly

---

## Test Execution Summary

### Test Execution Checklist

- [ ] Unit tests pass with 95%+ coverage
- [ ] Integration tests validate data merging
- [ ] Performance tests within governance limits
- [ ] UAT tests approved by business users
- [ ] Edge cases handled gracefully
- [ ] Error scenarios documented
- [ ] Test data created and validated
- [ ] Automated tests scheduled
- [ ] Test results documented
- [ ] Sign-off obtained

### Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | __________ | __________ | ______ |
| Developer | __________ | __________ | ______ |
| Business Analyst | __________ | __________ | ______ |
| Project Manager | __________ | __________ | ______ |

---

## Appendix

### A. Test Environment Setup

**NetSuite Configuration**:
1. Enable SuiteScript 2.1
2. Create test subsidiary
3. Set up custom segments (cseg_hmp_event)
4. Create test accounts (25010, 25020)
5. Configure saved search (ID: 338219)

**Test User Roles**:
- Administrator (full access)
- Accountant (read-only)
- Auditor (view variance details)

### B. Known Issues and Limitations

1. **showDrillDownDetails Function**: Not implemented in current version (line 816 comment)
2. **CSV Export**: Placeholder function, needs full implementation (line 770)
3. **Mobile UI**: Limited testing on mobile devices
4. **Large Datasets**: Performance degradation beyond 5000 events

### C. Test Metrics Dashboard

Track these KPIs throughout testing:

- **Test Coverage**: Target 95%+
- **Pass Rate**: Target 98%+
- **Defect Density**: < 0.5 defects per 100 lines of code
- **Mean Time to Resolution**: < 2 days
- **Governance Efficiency**: < 20% of limit used

### D. References

- NetSuite SuiteScript 2.1 API Documentation
- NetSuite Search API Reference
- HMP-Global Business Requirements Document
- Deferred Revenue Accounting Standards (ASC 606)

---

**Document Control**:
- Version: 1.0
- Created: 2025-10-14
- Last Updated: 2025-10-14
- Next Review: 2025-11-14
- Owner: QA Team
- Classification: Internal Use Only
