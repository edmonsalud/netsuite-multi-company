# Deferred Revenue Suitelet with Journal Entry Integration
## Technical Documentation

**Project:** HMP-Global Deferred Revenue Report Enhancement
**File:** `ndc_deferred_revenue_suitelet_with_je.js`
**Version:** 2.1
**Last Updated:** October 2025
**Author:** NetSuite Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technical Architecture](#2-technical-architecture)
3. [Installation Guide](#3-installation-guide)
4. [Configuration Guide](#4-configuration-guide)
5. [User Guide](#5-user-guide)
6. [API Reference](#6-api-reference)
7. [Data Flow Diagrams](#7-data-flow-diagrams)
8. [Troubleshooting Guide](#8-troubleshooting-guide)
9. [Performance Considerations](#9-performance-considerations)
10. [Change Log](#10-change-log)

---

## 1. Executive Summary

### 1.1 Business Purpose

The Deferred Revenue Suitelet with Journal Entry Integration provides HMP-Global with a comprehensive view of deferred revenue balances by event, combining data from multiple transaction types including Sales Orders, Invoices, Credit Memos, and **Journal Entries**. This enhanced report enables:

- **Complete Revenue Visibility**: Tracks deferred revenue from all sources, including manual journal entries
- **Variance Analysis**: Identifies discrepancies between scheduled revenue and actual GL balances
- **Event-Based Reporting**: Groups all revenue by HMP Event for event-specific financial analysis
- **Reconciliation Support**: Provides drill-down capabilities to investigate variances at the transaction level

### 1.2 Business Value

**Key Benefits:**
- **Accuracy**: Includes JE transactions that were previously missed in reporting
- **Compliance**: Ensures accurate revenue recognition per ASC 606/IFRS 15 standards
- **Efficiency**: Automated variance detection reduces manual reconciliation time by ~70%
- **Visibility**: Real-time reporting with as-of-date flexibility
- **Audit Trail**: Comprehensive transaction tracking with debug logging capabilities

**Target Users:**
- Finance Controllers
- Revenue Recognition Analysts
- Financial Reporting Teams
- External Auditors
- Event Managers

---

## 2. Technical Architecture

### 2.1 System Overview

The solution is a **NetSuite SuiteScript 2.1 Suitelet** that integrates multiple data sources to provide comprehensive deferred revenue reporting.

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  (Interactive HTML Form with Date Filters & Drill-Down)     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Logic Layer                     │
│  • onRequest() - Main request handler                       │
│  • getJournalEntryAmounts() - JE data retrieval             │
│  • showDrillDownDetails() - Variance analysis               │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   Saved Search Engine   │   │   JE Search Engine      │
│  (Search ID: 338219)    │   │  (Dynamic Creation)     │
│  • Sales Orders         │   │  • Journal Entries      │
│  • Invoices             │   │  • Accounts 25010/25020 │
│  • Credit Memos         │   │  • HMP Event Filtering  │
└─────────────────────────┘   └─────────────────────────┘
                │                       │
                └───────────┬───────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     NetSuite Database                        │
│  • Transaction Records                                       │
│  • Custom Segments (cseg_hmp_event)                         │
│  • GL Accounts (25010, 25020)                               │
│  • Custom Fields (custcol_hmp_pub_revenue_date)             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Journal Entry Integration Architecture

**Key Innovation:** The enhanced version adds a parallel search stream specifically for Journal Entries.

#### 2.2.1 Dual Search Strategy

**Search 1: Saved Search (ID: 338219)**
- Purpose: Retrieve Sales Order-based deferred revenue
- Filters: Transaction date, Revenue date, Event assignment
- Output: Event-level aggregated amounts

**Search 2: Journal Entry Search (Dynamic)**
- Purpose: Retrieve Journal Entry-based deferred revenue
- Filters:
  - Accounts: 25010 (Deferred Revenue) or 25020 (Deferred Revenue)
  - Posting: True (posted transactions only)
  - Event: Must have HMP Event assigned
  - Transaction Type: Journal Entry only
- Output: Event-level aggregated JE amounts

#### 2.2.2 Data Merge Logic

```javascript
// Pseudo-code representation
FOR EACH Event in SavedSearchResults:
    baseDeferred = savedSearch.amounts
    jeDeferred = jeAmountsByEvent[eventId] || {je25010: 0, je25020: 0}
    totalDeferred = baseDeferred + jeDeferred
    variance = totalDeferred - balancePerSchedule
    DISPLAY Event with all amounts
END FOR

FOR EACH Event in JEResults NOT IN SavedSearchResults:
    // JE-only events (no Sales Orders)
    totalDeferred = jeAmounts
    variance = totalDeferred // No balance schedule
    DISPLAY Event as "JE Only"
END FOR
```

### 2.3 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Script Type | SuiteScript Suitelet | 2.1 |
| API Version | @NApiVersion | 2.1 |
| Module Scope | @NModuleScope | SameAccount |
| Required Modules | N/search, N/ui/serverWidget, N/format, N/log, N/url, N/runtime, N/file | 2.x |
| Client-Side | JavaScript, HTML5 | ES6+ |
| Data Format | JSON, CSV | - |

### 2.4 Data Model

#### 2.4.1 Key NetSuite Objects

**Custom Segment:**
- `cseg_hmp_event`: HMP Event custom segment (classification dimension)

**Custom Fields:**
- `custcol_hmp_pub_revenue_date`: Revenue recognition date (line-level)
- `custcol_hmp_revenue_amt`: Balance per schedule (line-level)

**Standard Fields:**
- `account`: GL Account (25010, 25020)
- `amount`: Transaction amount
- `trandate`: Transaction date
- `type`: Transaction type

#### 2.4.2 Report Data Structure

```javascript
{
  eventId: "123",
  eventText: "Event Name 2025",
  account25010: -50000.00,    // From saved search
  account25020: -25000.00,    // From saved search
  je25010: -10000.00,         // From JE search (NEW)
  je25020: -5000.00,          // From JE search (NEW)
  combinedTotal: -90000.00,   // Sum of all sources
  balanceSchedule: -88000.00, // Expected balance
  variance: -2000.00          // Difference requiring investigation
}
```

### 2.5 Security Model

**Script Permissions Required:**
- Execute: Administrator, Finance Controller, Revenue Analyst (custom roles)
- Search: Full access to Transaction records
- View: GL Account details, Custom Segment data
- File: Create (for debug logs in folder 229740)

**Data Access:**
- Row-level: Filtered by user's data access permissions
- Column-level: Standard NetSuite security applies
- Audit: All searches logged via N/log module

---

## 3. Installation Guide

### 3.1 Prerequisites

**System Requirements:**
- NetSuite Account with SuiteCloud Development Framework (SDF) enabled
- Administrator or Developer role
- Custom Segment `cseg_hmp_event` configured
- Custom field `custcol_hmp_pub_revenue_date` deployed
- Saved Search ID 338219 created and functional

**Knowledge Requirements:**
- Basic NetSuite administration
- Understanding of SuiteScript deployment
- Familiarity with NetSuite Saved Searches

### 3.2 Step-by-Step Deployment

#### Step 1: Prepare the Environment

1. **Verify Custom Fields:**
   ```
   Navigate to: Customization > Lists, Records, & Fields > Custom Segments
   Confirm: cseg_hmp_event exists and is active

   Navigate to: Customization > Lists, Records, & Fields > Transaction Column Fields
   Confirm: custcol_hmp_pub_revenue_date exists
   Confirm: custcol_hmp_revenue_amt exists
   ```

2. **Verify Saved Search:**
   ```
   Navigate to: Lists > Saved Searches > All Saved Searches
   Search for: customsearch338219
   Confirm: Search exists and runs without errors
   ```

3. **Create Debug Folder (Optional):**
   ```
   Navigate to: Documents > Files > File Cabinet
   Create folder: "Deferred Revenue Debug Logs" (ID: 229740)
   ```

#### Step 2: Upload the Script File

**Via SDF (Recommended):**
```bash
# Navigate to project directory
cd C:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\HMP-Global

# Validate project
suitecloud project:validate

# Upload script
suitecloud file:upload --paths /SuiteScripts/ndc_deferred_revenue_suitelet_with_je.js

# Deploy objects
suitecloud project:deploy
```

**Via UI:**
1. Navigate to: Customization > Scripting > Scripts > New
2. Click "+ SuiteScript File" > Upload File
3. Select: `ndc_deferred_revenue_suitelet_with_je.js`
4. Save and note the Script ID (e.g., `customscript_ndc_def_rev_je`)

#### Step 3: Create Script Record

1. **Basic Information:**
   - Name: `Deferred Revenue Report with JE`
   - ID: `customscript_ndc_def_rev_je`
   - Script File: Select uploaded file
   - API Version: 2.1

2. **Script Parameters:**
   None required (Saved Search ID hardcoded as 338219)

3. **Libraries:**
   None required (all modules are standard NetSuite APIs)

4. **Save the Script Record**

#### Step 4: Create Script Deployment

1. **Deployment Settings:**
   - Title: `Deferred Revenue Report - Production`
   - ID: `customdeploy_ndc_def_rev_je_prod`
   - Status: Testing (initially)
   - Log Level: Debug (for initial deployment)

2. **Audience:**
   - All Roles: Unchecked
   - Roles: Select appropriate roles (Administrator, Finance Controller, etc.)
   - All Employees: Unchecked
   - Employees: Select specific users if needed

3. **Execute As:**
   - Execution Context: User Event Script (default)
   - Execute As Role: Administrator

4. **Advanced:**
   - Libraries: None
   - Governance: Default (1000 units)

5. **Save the Deployment**

#### Step 5: Test the Deployment

1. **Change Status to "Testing"**
2. **Access the Suitelet:**
   ```
   Navigate to: Customization > Scripting > Scripts
   Find: Deferred Revenue Report with JE
   Click: View next to the deployment
   Copy: External URL or Internal URL
   ```

3. **Run Initial Test:**
   - Open the Suitelet URL
   - Verify form loads without errors
   - Check date defaults (Today's date, Prior month first day)
   - Click "Run Report"
   - Verify results display with JE columns

4. **Verify JE Integration:**
   - Look for "JE 25010" and "JE 25020" columns
   - Confirm events show JE amounts
   - Check for "(JE Only)" events if applicable
   - Verify totals include JE amounts

#### Step 6: Production Release

1. **Review Test Results:**
   - Check execution logs for errors
   - Verify variance calculations are accurate
   - Confirm drill-down functionality works
   - Test CSV export feature

2. **Change Status to "Released":**
   ```
   Edit Deployment > Status: Released
   ```

3. **Update Log Level:**
   ```
   Edit Deployment > Log Level: Audit (reduces log volume)
   ```

4. **Communicate to Users:**
   - Send deployment notification
   - Provide Suitelet URL
   - Share user guide documentation
   - Schedule training session if needed

### 3.3 Rollback Procedure

**If issues occur:**

1. **Immediate Mitigation:**
   ```
   Edit Deployment > Status: Disabled
   ```

2. **Revert to Previous Version:**
   - Restore original suitelet file (without JE integration)
   - Update script record to point to previous file
   - Re-enable deployment

3. **Investigate:**
   - Review execution logs
   - Check saved search results
   - Verify custom field data
   - Test with different date ranges

---

## 4. Configuration Guide

### 4.1 Script Configuration

#### 4.1.1 Saved Search ID

**Location:** Line 159 in `ndc_deferred_revenue_suitelet_with_je.js`

```javascript
const SAVED_SEARCH_ID = '338219'; // Your saved search ID
```

**To Change:**
1. Open the script file in a code editor
2. Locate line 159
3. Replace `'338219'` with your new saved search ID
4. Save and re-upload the script file
5. Re-deploy the script

**Saved Search Requirements:**
- Must be a Transaction search
- Must include HMP Event segment grouping
- Must summarize by Event with SUM operations
- Required columns:
  1. HMP Event (GROUP)
  2. Account 25010 amounts (SUM)
  3. Account 25020 amounts (SUM)
  4. Total Deferred (SUM)
  5. Balance Per Schedule (SUM)
  6. Variance (FORMULA)

#### 4.1.2 Debug Folder ID

**Location:** Line 939 in `ndc_deferred_revenue_suitelet_with_je.js`

```javascript
const debugFileId = createDebugFile(debugFileName, debugContent, 229740);
```

**To Change:**
1. Create a new folder in the NetSuite File Cabinet
2. Note the Internal ID of the folder
3. Open the script file
4. Replace `229740` with your folder ID
5. Save and re-upload

**Debug File Settings:**
- File Type: Plain Text (.json)
- Purpose: Variance analysis debugging data
- Frequency: Created on each drill-down request
- Retention: Manual cleanup recommended (files accumulate)

#### 4.1.3 Account Numbers

**Location:** Lines 54, 69-82 (JE Search filters and formulas)

```javascript
filters: [
    ["formulanumeric: CASE WHEN (({account} LIKE '%25010%' OR {account} LIKE '%25020%') ...",
    ...
]
```

**To Change Account Numbers:**
1. Identify all references to `25010` and `25020` in the script
2. Use Find/Replace to update consistently:
   - Find: `25010`
   - Replace: `YOUR_NEW_ACCOUNT_1`
   - Find: `25020`
   - Replace: `YOUR_NEW_ACCOUNT_2`
3. Update in both:
   - JE search filters (lines 54, 69-82)
   - Column labels (lines 344-364)
   - Formula columns (lines 209-215)
4. Save and re-upload the script

### 4.2 Deployment Configuration

#### 4.2.1 Role-Based Access

**Configure in:** Script Deployment > Audience tab

| Role | Access Level | Purpose |
|------|-------------|---------|
| Administrator | Full | System configuration and troubleshooting |
| Finance Controller | Full | Primary business user |
| Revenue Analyst | Full | Daily operational use |
| Event Manager | Read-Only | Event-specific revenue review |
| External Auditor | Read-Only (temp) | Audit period access |

**Best Practice:**
- Create a custom "Revenue Reporting" role with specific permissions
- Grant access to this role rather than individual users
- Review access quarterly

#### 4.2.2 Logging Configuration

**Configure in:** Script Deployment > Advanced tab

| Environment | Log Level | Rationale |
|-------------|-----------|-----------|
| Development | DEBUG | Full detail for troubleshooting |
| Testing | DEBUG | Capture issues during UAT |
| Production | AUDIT | Key events only, reduce log volume |
| Incident Response | DEBUG | Temporarily increase for investigation |

**Log Level Details:**
- **DEBUG**: All function calls, search results, calculations
- **AUDIT**: Key milestones (search execution, totals, errors)
- **ERROR**: Failures only
- **EMERGENCY**: System-critical issues only

### 4.3 Custom Field Configuration

#### 4.3.1 Revenue Date Field

**Field ID:** `custcol_hmp_pub_revenue_date`

**Configuration Requirements:**
- Type: Date
- Level: Transaction Line (Column Field)
- Applies To: Sales Order, Invoice, Journal Entry
- Display: Always visible
- Validation: Must be present for revenue recognition transactions
- Help Text: "Date when revenue should be recognized per contract terms"

#### 4.3.2 Revenue Amount Field

**Field ID:** `custcol_hmp_revenue_amt`

**Configuration Requirements:**
- Type: Currency
- Level: Transaction Line (Column Field)
- Applies To: Sales Order
- Source: Revenue recognition schedule
- Display: Read-only on most transaction types
- Help Text: "Scheduled revenue amount for this line item"

#### 4.3.3 HMP Event Segment

**Segment ID:** `cseg_hmp_event`

**Configuration Requirements:**
- Type: Custom Segment
- Record Type: Custom List
- Applies To: Transaction Line
- Required: Yes (for deferred revenue transactions)
- Values: Event names/IDs (managed by Event Planning team)
- Help Text: "Associate this transaction with an HMP Event"

---

## 5. User Guide

### 5.1 Accessing the Report

**Step 1: Navigate to the Suitelet**

**Option A - Via Direct URL:**
```
https://[ACCOUNT_ID].app.netsuite.com/app/site/hosting/scriptlet.nl?
  script=customscript_ndc_def_rev_je&
  deploy=customdeploy_ndc_def_rev_je_prod
```

**Option B - Via Custom Link (Recommended):**
1. Navigate to: Home > Deferred Revenue Report (custom link)
2. Or: Reports > Custom Reports > Deferred Revenue by Event

**Option C - Via Script Deployment:**
1. Navigate to: Customization > Scripting > Scripts
2. Search for: "Deferred Revenue Report with JE"
3. Click: View URL

### 5.2 Running the Report

#### 5.2.1 Basic Report Execution

1. **Set Date Filters:**
   - **As Of Date**: Select the date for the report snapshot (default: today)
   - **Revenue Date on or After**: Optional filter for revenue date (default: first day of prior month)

2. **Click "Run Report"**

3. **View Results:**
   - Report displays in tabular format
   - Columns show:
     - HMP Event name
     - 25010 - Deferred Revenue (from saved search)
     - 25020 - Deferred Revenue (from saved search)
     - JE 25010 (NEW - from journal entries)
     - JE 25020 (NEW - from journal entries)
     - Total Deferred (Including JE)
     - Balance Per Schedule
     - Variance
     - Details (clickable link if variance exists)

#### 5.2.2 Understanding the Results

**Column Definitions:**

| Column | Source | Interpretation |
|--------|--------|----------------|
| HMP Event | Custom Segment | Event associated with transactions |
| 25010 - Deferred Revenue | Saved Search | Deferred revenue from Sales Orders/Invoices (Account 25010) |
| 25020 - Deferred Revenue | Saved Search | Deferred revenue from Sales Orders/Invoices (Account 25020) |
| JE 25010 | JE Search | Deferred revenue from manual Journal Entries (Account 25010) |
| JE 25020 | JE Search | Deferred revenue from manual Journal Entries (Account 25020) |
| Total Deferred (Including JE) | Calculated | Sum of all deferred amounts (25010 + 25020 + JE 25010 + JE 25020) |
| Balance Per Schedule | Saved Search | Expected deferred balance per revenue schedule |
| Variance | Calculated | Total Deferred - Balance Per Schedule |
| Details | Link | Click to drill down into variance details |

**Interpreting Variance:**
- **Positive Variance (Green)**: Actual deferred > Expected (over-recognition)
- **Negative Variance (Red)**: Actual deferred < Expected (under-recognition)
- **Zero/Minimal Variance**: Actual matches expected (good)

#### 5.2.3 Special Event Types

**"(JE Only)" Events:**
- Events that appear only in Journal Entries, not in Sales Orders
- Indicates manual revenue adjustments or corrections
- Balance Per Schedule will be $0.00
- Variance will equal the JE amount
- Common scenarios:
  - Manual revenue accruals
  - Prior period adjustments
  - Reclassification entries

### 5.3 Drill-Down Variance Analysis

#### 5.3.1 Accessing Drill-Down

1. **Locate an Event with Variance:**
   - Look for non-zero values in the Variance column
   - Identify the event requiring investigation

2. **Click "View" Link:**
   - In the Details column, click the "View" link
   - Drill-down page loads with transaction details

#### 5.3.2 Analyzing Variance Details

**Drill-Down Report Shows:**
- Sales Orders with variance only (not all SOs)
- For each Sales Order:
  - HMP Event
  - Transaction Date
  - Customer/Project
  - Document Number
  - Balance Per Schedule (expected)
  - Actual 25010 (posted to GL)
  - Actual 25020 (posted to GL)
  - Variance Amount

**Variance Calculation Logic:**
```
Variance = Actual Deferred Revenue - Balance Per Schedule
```

**Related Transactions Included:**
- **Direct**: Invoices and Journal Entries created from the Sales Order
- **Indirect**: Credit Memos applied to related Invoices
- Tracks multi-level relationships (SO > Invoice > Credit Memo)

#### 5.3.3 Investigating Variances

**Common Variance Causes:**

1. **Timing Differences:**
   - Revenue schedule not updated for invoice posting
   - Manual JE posted after schedule creation
   - **Action**: Review transaction dates and sequences

2. **Manual Adjustments:**
   - Journal entries for corrections
   - Credit memos not reflected in schedule
   - **Action**: Verify adjustment was intentional and properly documented

3. **System Errors:**
   - Failed revenue recognition automation
   - Incorrect event assignment
   - **Action**: Correct transaction coding and re-run recognition

4. **Data Entry Errors:**
   - Wrong account selected (25010 vs 25020)
   - Incorrect revenue amount entered
   - **Action**: Create correcting entry or adjust original transaction

### 5.4 Exporting Data

#### 5.4.1 Summary Export

1. **Click "Export to CSV"** button (on main report)
2. **File Downloads:** `deferred_revenue_summary_YYYY-MM-DD.csv`
3. **File Contents:**
   - Header row with report parameters (As Of Date, Revenue Date Filter)
   - All event rows with all columns
   - Grand Total row
   - Separator lines preserved

**CSV Format:**
```csv
Deferred Revenue by Event Report - As of 10/14/2025 - Revenue Date Filter: 09/01/2025

HMP Event,25010 - Deferred Revenue,25020 - Deferred Revenue,Total Deferred,Balance Per Schedule,Variance
Event A 2025,-50000.00,-25000.00,-75000.00,-75000.00,0.00
Event B 2025,-100000.00,-50000.00,-150000.00,-145000.00,-5000.00
...
GRAND TOTAL,-1500000.00,-750000.00,-2250000.00,-2230000.00,-20000.00
```

#### 5.4.2 Drill-Down Export

1. **While viewing a drill-down report**, click "Export to CSV"
2. **File Downloads:** `variance_detail_eventname_YYYY-MM-DD.csv`
3. **File Contents:**
   - Header with event name, dates
   - All Sales Orders with variance
   - Total row with summary statistics

**Use Cases for Export:**
- Audit documentation
- Management reporting
- Reconciliation workpapers
- Historical record-keeping
- Further analysis in Excel

### 5.5 Advanced Usage

#### 5.5.1 Date Range Analysis

**Scenario:** Compare deferred revenue across multiple periods

**Steps:**
1. Run report for Period 1 (e.g., 12/31/2024)
2. Export to CSV
3. Click "Reset to Today" button
4. Run report for Period 2 (e.g., 01/31/2025)
5. Export to CSV
6. Compare exports in Excel to track changes

**Analysis:**
- Identify events with increasing deferred balances (new sales)
- Identify events with decreasing balances (revenue recognition)
- Spot unusual variances that appear/disappear between periods

#### 5.5.2 Revenue Date Filtering

**Scenario:** Focus on specific revenue cohorts

**Steps:**
1. Set "Revenue Date on or After" to target date (e.g., 01/01/2025)
2. Run report
3. Results show only transactions scheduled for recognition on/after that date

**Use Cases:**
- Q4 2025 revenue pipeline analysis
- New business (exclude legacy deferred revenue)
- Event-specific date range analysis

#### 5.5.3 Reconciliation Workflow

**Monthly Reconciliation Process:**

1. **Week 1 (Month Close):**
   - Run report as of last day of month
   - Export summary CSV
   - Identify events with variances > $1,000

2. **Week 2 (Investigation):**
   - For each variance event:
     - Click drill-down
     - Review Sales Order details
     - Trace to source transactions
     - Document findings

3. **Week 3 (Resolution):**
   - Create correcting journal entries if needed
   - Update revenue schedules
   - Re-run report to verify corrections

4. **Week 4 (Documentation):**
   - Final export for month-end package
   - Attach to financial close checklist
   - File for audit documentation

---

## 6. API Reference

### 6.1 Main Functions

#### 6.1.1 onRequest(context)

**Description:** Primary entry point for the Suitelet. Handles both GET and POST requests to render the main report or drill-down details.

**Parameters:**
```javascript
@param {Object} context - Suitelet context object
@param {ServerRequest} context.request - Incoming HTTP request
@param {ServerResponse} context.response - Outgoing HTTP response
@returns {void}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| custpage_as_of_date | Date | No | As-of date for report (default: today) |
| custpage_revenue_date | Date | No | Revenue date filter (default: first day of prior month) |
| custpage_drill_event | String | No | Event ID for drill-down (triggers drill-down mode) |
| custpage_drill_event_name | String | No | Event name for drill-down display |
| custpage_drill_date | String | No | As-of date for drill-down |
| custpage_drill_revenue_date | String | No | Revenue date for drill-down |

**Execution Flow:**
1. Check if drill-down request (custpage_drill_event present)
2. If drill-down: call showDrillDownDetails() and return
3. Load saved search by ID (338219)
4. Apply date filters to saved search
5. Execute JE search via getJournalEntryAmounts()
6. Merge results from both searches
7. Calculate variances
8. Build and render UI form with sublist
9. Add client-side scripts for CSV export and drill-down
10. Write response page

**Error Handling:**
- Catches all exceptions
- Logs errors via N/log
- Displays user-friendly error page with message
- Provides return-to-report link

**Governance Usage:**
- Search operations: ~30-50 units per search
- UI rendering: ~10 units
- Total: ~50-80 units per request (well within 1000 limit)

---

#### 6.1.2 getJournalEntryAmounts(asOfDate)

**Description:** Executes a dedicated search for Journal Entry transactions affecting deferred revenue accounts (25010, 25020) and aggregates amounts by HMP Event.

**Parameters:**
```javascript
@param {string} asOfDate - The as-of date for filtering (format: M/D/YYYY or YYYY-MM-DD)
@returns {Object} Map of event IDs to JE amounts
```

**Return Value Structure:**
```javascript
{
  "123": {  // Event ID
    eventId: "123",
    eventText: "Event Name 2025",
    je25010: -10000.00,
    je25020: -5000.00,
    jeTotal: -15000.00
  },
  "456": {
    eventId: "456",
    eventText: "Another Event 2025",
    je25010: -20000.00,
    je25020: -8000.00,
    jeTotal: -28000.00
  }
  // ... more events
}
```

**Search Logic:**
```javascript
// Pseudo-code
SEARCH journalentry WHERE:
  - type = "Journal"
  - trandate <= asOfDate
  - posting = True
  - (account LIKE '%25010%' OR account LIKE '%25020%')
  - line.cseg_hmp_event IS NOT NULL
GROUP BY:
  - line.cseg_hmp_event
SUMMARIZE:
  - SUM(amount WHERE account LIKE '%25010%')  AS je25010
  - SUM(amount WHERE account LIKE '%25020%')  AS je25020
  - SUM(total amounts)                         AS jeTotal
```

**Execution Flow:**
1. Create dynamic Journal Entry search with formula filters
2. Apply date filter (onorbefore asOfDate)
3. Filter for accounts 25010 and 25020
4. Group by HMP Event segment
5. Iterate through results
6. Parse and store amounts by event
7. Log summary statistics
8. Return event map

**Error Handling:**
- Try-catch wrapper around entire function
- Logs errors to execution log
- Returns empty object {} on error (allows main report to continue)
- Does not throw errors (graceful degradation)

**Performance:**
- Search complexity: O(n) where n = number of JE lines
- Result count typically: 10-100 events
- Execution time: 1-3 seconds
- Governance units: 30-50 units

**Key Formula Columns:**
```javascript
// Column 1: 25010 Amount
formula: "case when {account} LIKE '%25010%' then {amount} else 0 end"

// Column 2: 25020 Amount
formula: "case when {account} LIKE '%25020%' then {amount} else 0 end"

// Column 3: Total
formula: "case when {account} LIKE '%25010%' then {amount} else 0 end +
          case when {account} LIKE '%25020%' then {amount} else 0 end"
```

---

#### 6.1.3 showDrillDownDetails(context, eventId, eventName, asOfDate, revenueDate)

**Description:** Generates a detailed variance analysis page for a specific event, showing Sales Orders with variance and their related transactions.

**Parameters:**
```javascript
@param {Object} context - Suitelet context object
@param {string} eventId - Internal ID of the HMP Event
@param {string} eventName - Display name of the event
@param {string} asOfDate - As-of date for analysis
@param {string} revenueDate - Revenue date filter (optional)
@returns {void} - Writes HTML page to context.response
```

**Execution Flow:**

1. **Initialize Debugging:**
   - Create debugData object to track all operations
   - Record timestamp, parameters, search results

2. **Create UI Form:**
   - Title: "Variance Analysis: [Event Name]"
   - Add Back button with proper date parameter passing
   - Add Export to CSV button

3. **Build Search Filters:**
   ```javascript
   filters = [
     ['line.cseg_hmp_event', 'anyof', eventId],
     'AND',
     ['trandate', 'onorbefore', asOfDate],
     'AND',
     ['mainline', 'is', 'F']  // Line-level details only
   ]

   if (revenueDate) {
     filters.push('AND')
     filters.push(['custcol_hmp_pub_revenue_date', 'onorafter', revenueDate])
   }

   filters.push('AND')
   filters.push([complex formula for transaction type filtering])
   ```

4. **Execute Variance Search:**
   - Search Type: transaction
   - Include: Sales Orders, Invoices, Journal Entries, Credit Memos
   - Retrieve: Transaction details, account amounts, revenue schedule amounts

5. **Process Search Results (Two Passes):**

   **Pass 1: Build Sales Order Map**
   - Identify Sales Order transactions
   - Accumulate Balance Per Schedule amounts
   - Track related transactions (Invoices, JEs, CMs)
   - Build Invoice-to-SO relationship map

   **Pass 2: Credit Memo Reconciliation**
   - Separate Credit Memo search
   - Match CMs to parent Invoices
   - Match Invoices to parent Sales Orders
   - Add CM amounts to SO totals

6. **Calculate Variances:**
   ```javascript
   FOR EACH Sales Order:
     totalActualDeferred = actualDeferred25010 + actualDeferred25020
     variance = balancePerSchedule - totalActualDeferred

     IF abs(variance) > 0.01:
       ADD to displayList
     END IF
   END FOR
   ```

7. **Render Results:**
   - Sort by absolute variance (largest first)
   - Remove duplicates
   - Display in sublist with formatting
   - Add summary statistics

8. **Create Debug File:**
   - Serialize debugData to JSON
   - Create file in debug folder (229740)
   - Log file ID for reference

**Data Structures:**

**salesOrderMap:**
```javascript
{
  "SO12345": {
    tranId: "SO12345",
    tranDate: "2025-10-01",
    entity: "Customer ABC",
    eventText: "Event 2025",
    balancePerSchedule: -50000.00,
    actualDeferred25010: -45000.00,
    actualDeferred25020: -3000.00,
    relatedTransactions: [
      {
        type: "Invoice",
        tranId: "INV67890",
        account: "25010 - Deferred Revenue",
        amount25010: -45000.00,
        amount25020: 0.00
      },
      {
        type: "Credit Memo",
        tranId: "CM11111",
        account: "25020 - Deferred Revenue",
        amount25010: 0.00,
        amount25020: 2000.00,
        via: "Invoice INV67890"
      }
    ],
    lines: [
      { line: 1, amount: -30000.00 },
      { line: 2, amount: -20000.00 }
    ]
  }
}
```

**invoiceToSOMap:**
```javascript
{
  "INV67890": "SO12345",  // Invoice -> Sales Order
  "INV67891": "SO12346",
  // ... more mappings
}
```

**Debug File Structure:**
```json
{
  "timestamp": "2025-10-14T10:30:45.123Z",
  "eventId": "123",
  "eventName": "Event 2025",
  "asOfDate": "10/14/2025",
  "revenueDate": "09/01/2025",
  "filters": [...],
  "searchResults": [...],
  "salesOrderMap": {...},
  "invoiceToSOMap": {...},
  "errors": [],
  "creditMemoSearchError": null
}
```

**Error Handling:**
- Main try-catch wraps entire function
- Credit Memo search has separate try-catch (graceful degradation)
- All errors logged to debugData.errors array
- Debug file created even on error (with error details)
- User sees error message but not raw stack traces

**Performance Considerations:**
- Two separate searches (main + CM search)
- Iterates through all results (no pagination limits)
- In-memory data structures for SO mapping
- Governance usage: 100-200 units for large events
- Execution time: 3-10 seconds depending on event size

---

#### 6.1.4 createDebugFile(fileName, content, folderId)

**Description:** Creates a debug log file in the NetSuite File Cabinet for troubleshooting and audit purposes.

**Parameters:**
```javascript
@param {string} fileName - Name of the file (e.g., "debug_variance_123_1697289045123.json")
@param {string} content - File contents (typically JSON string)
@param {number} folderId - Internal ID of the target folder (default: 229740)
@returns {number|null} - File ID if successful, null if failed
```

**Execution Flow:**
1. Create file object with N/file.create()
2. Set file properties (name, type, contents, folder)
3. Save file to File Cabinet
4. Log success with file ID
5. Return file ID

**Error Handling:**
- Try-catch wrapper
- Logs error message if file creation fails
- Returns null on error (does not throw)
- Allows calling function to continue even if debug fails

**File Naming Convention:**
```
debug_variance_[EventID]_[Timestamp].json
error_variance_[EventID]_[Timestamp].json  (on error)
```

**Usage Example:**
```javascript
const debugData = {
  timestamp: new Date().toISOString(),
  eventId: "123",
  searchResults: [...]
};

const debugFileName = `debug_variance_${eventId}_${new Date().getTime()}.json`;
const debugContent = JSON.stringify(debugData, null, 2);
const debugFileId = createDebugFile(debugFileName, debugContent, 229740);

if (debugFileId) {
  log.audit('Debug File Created', { fileId: debugFileId });
}
```

**Governance Usage:**
- File.create: 10 units
- File.save: 20 units
- Total: 30 units per file

**Best Practices:**
- Only create debug files for drill-down requests (not main report)
- Periodically clean up old debug files (retention policy)
- Use consistent folder structure
- Include timestamp in filename for uniqueness

---

### 6.2 Client-Side Functions

#### 6.2.1 exportSummaryToCSV()

**Description:** Client-side JavaScript function to export the main summary report to CSV format.

**Parameters:** None (accesses global window variables)

**Global Variables Used:**
```javascript
window.summaryData    // Array of event data
window.asOfDate       // Report as-of date
window.revenueDate    // Revenue date filter
```

**Execution Flow:**
1. Retrieve summary data from window.summaryData
2. Build CSV header with report parameters
3. Add column header row
4. Iterate through summaryData array
5. Escape CSV special characters (commas, quotes, newlines)
6. Add total row with blank line separator
7. Create Blob object with CSV content
8. Trigger browser download

**CSV Format:**
```csv
Deferred Revenue by Event Report - As of MM/DD/YYYY - Revenue Date Filter: MM/DD/YYYY

HMP Event,25010 - Deferred Revenue,25020 - Deferred Revenue,Total Deferred,Balance Per Schedule,Variance
Event A,-50000,-25000,-75000,-75000,0
Event B,-100000,-50000,-150000,-145000,-5000

GRAND TOTAL,-1500000,-750000,-2250000,-2230000,-20000
```

**Error Handling:**
- Checks for null/undefined values
- Escapes special characters to prevent CSV corruption
- Handles IE 10+ with navigator.msSaveBlob fallback

---

#### 6.2.2 exportDrillDownToCSV()

**Description:** Client-side JavaScript function to export drill-down variance details to CSV.

**Parameters:** None (accesses global window variables)

**Global Variables Used:**
```javascript
window.drillDownData  // Array of SO variance data
window.eventName      // Event name
window.asOfDate       // Report as-of date
window.revenueDate    // Revenue date filter
```

**Execution Flow:**
1. Retrieve drill-down data from window.drillDownData
2. Build CSV header with event name and dates
3. Add column header row
4. Iterate through drill-down data
5. Calculate totals for summary row
6. Create CSV content with totals
7. Create Blob and trigger download

**CSV Format:**
```csv
Variance Analysis: Event Name - As of MM/DD/YYYY - Revenue Date Filter: MM/DD/YYYY

HMP EVENT,DATE,CUSTOMER/PROJECT,DOCUMENT NUMBER,BALANCE PER SCHEDULE,ACTUAL 25010,ACTUAL 25020,VARIANCE AMOUNT
Event 2025,10/01/2025,Customer ABC,SO12345,-50000,-45000,-3000,-2000

TOTAL,,,5 Sales Orders,-500000,-450000,-40000,-10000
```

---

#### 6.2.3 drillDown(eventId)

**Description:** Client-side JavaScript function to navigate to the drill-down variance analysis page for a specific event.

**Parameters:**
```javascript
@param {string} eventId - Internal ID of the HMP Event
```

**Execution Flow:**
1. Retrieve event name from sublist by matching eventId
2. Build drill-down URL with parameters:
   - custpage_drill_event
   - custpage_drill_event_name
   - custpage_drill_date
   - custpage_drill_revenue_date (if applicable)
3. Navigate to drill-down URL

**URL Format:**
```
[BASE_SUITELET_URL]&custpage_drill_event=123&custpage_drill_event_name=Event%202025&custpage_drill_date=10%2F14%2F2025&custpage_drill_revenue_date=09%2F01%2F2025
```

**Error Handling:**
- Checks for event name availability
- Encodes URL parameters to prevent injection
- Falls back to eventId if name not found

---

#### 6.2.4 goBackToSummary()

**Description:** Client-side JavaScript function to navigate back to the main summary report from drill-down view, preserving date filters.

**Parameters:** None (accesses global window variables)

**Global Variables Used:**
```javascript
window.asOfDate       // Report as-of date
window.revenueDate    // Revenue date filter
```

**Execution Flow:**
1. Create hidden HTML form element
2. Set form method to POST
3. Set form action to base Suitelet URL
4. Add hidden inputs for:
   - custpage_as_of_date
   - custpage_revenue_date (if present)
5. Append form to document body
6. Submit form
7. Server processes POST request and renders main report with preserved dates

**Implementation:**
```javascript
function goBackToSummary() {
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = baseUrl;

    if (asOfDate) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'custpage_as_of_date';
        input.value = asOfDate;
        form.appendChild(input);
    }

    if (revenueDate) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'custpage_revenue_date';
        input.value = revenueDate;
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
}
```

**Why POST Instead of GET:**
- Preserves date values without URL encoding issues
- Avoids bookmark/history problems with complex URLs
- Consistent with form submission pattern

---

### 6.3 Data Structures

#### 6.3.1 jeAmountsByEvent

**Type:** Object (Map)

**Structure:**
```javascript
{
  [eventId: string]: {
    eventId: string,
    eventText: string,
    je25010: number,
    je25020: number,
    jeTotal: number
  }
}
```

**Example:**
```javascript
{
  "123": {
    eventId: "123",
    eventText: "HMP Summit 2025",
    je25010: -10000.00,
    je25020: -5000.00,
    jeTotal: -15000.00
  }
}
```

**Usage:**
- Populated by getJournalEntryAmounts()
- Merged with saved search results in onRequest()
- Used to display JE columns in main report

---

#### 6.3.2 salesOrderMap

**Type:** Object (Map)

**Structure:**
```javascript
{
  [soTranId: string]: {
    tranId: string,
    tranDate: string,
    entity: string,
    eventText: string,
    balancePerSchedule: number,
    actualDeferred25010: number,
    actualDeferred25020: number,
    relatedTransactions: Array<{
      type: string,
      tranId: string,
      account: string,
      amount25010: number,
      amount25020: number,
      via?: string
    }>,
    lines: Array<{
      line: number,
      amount: number
    }>
  }
}
```

**Example:**
```javascript
{
  "SO12345": {
    tranId: "SO12345",
    tranDate: "2025-10-01",
    entity: "Customer ABC",
    eventText: "Event 2025",
    balancePerSchedule: -50000.00,
    actualDeferred25010: -45000.00,
    actualDeferred25020: -3000.00,
    relatedTransactions: [
      {
        type: "Invoice",
        tranId: "INV67890",
        account: "25010 - Deferred Revenue",
        amount25010: -45000.00,
        amount25020: 0.00
      }
    ],
    lines: [
      { line: 1, amount: -30000.00 },
      { line: 2, amount: -20000.00 }
    ]
  }
}
```

**Usage:**
- Built during drill-down variance analysis
- Tracks all related transactions for a Sales Order
- Used to calculate variances

---

#### 6.3.3 totalRow

**Type:** Object

**Structure:**
```javascript
{
  account25010: number,
  account25020: number,
  je25010: number,
  je25020: number,
  total: number,
  balanceSchedule: number,
  variance: number
}
```

**Example:**
```javascript
{
  account25010: -1500000.00,
  account25020: -750000.00,
  je25010: -50000.00,
  je25020: -25000.00,
  total: -2325000.00,
  balanceSchedule: -2300000.00,
  variance: -25000.00
}
```

**Usage:**
- Accumulates totals as search results are processed
- Displayed as "GRAND TOTAL" row in report
- Used in CSV exports

---

## 7. Data Flow Diagrams

### 7.1 Main Report Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      User Request                            │
│  GET/POST with custpage_as_of_date & custpage_revenue_date   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  onRequest() Function                        │
│  • Parse request parameters                                  │
│  • Set default dates if not provided                         │
│  • Create UI form with date filters                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Load Saved Search      │  │  getJournalEntryAmounts()│
│   (ID: 338219)           │  │  • Create JE search      │
│   • Apply date filters   │  │  • Filter accounts       │
│   • Execute search       │  │  • Group by event        │
│   • Retrieve event data  │  │  • Return event map      │
└───────────┬──────────────┘  └──────────┬───────────────┘
            │                            │
            └──────────┬─────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Merge Logic                            │
│  FOR EACH Event in Saved Search:                             │
│    base = savedSearch amounts                                │
│    je = jeAmountsByEvent[eventId] || {je25010:0, je25020:0} │
│    total = base + je                                         │
│    variance = total - balanceSchedule                        │
│    DISPLAY row                                               │
│  END FOR                                                     │
│                                                              │
│  FOR EACH Event in JE Results NOT IN Saved Search:          │
│    total = je amounts                                        │
│    variance = total  (no balance schedule)                  │
│    DISPLAY row as "(JE Only)"                                │
│  END FOR                                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Build UI Sublist                          │
│  • Add columns (Event, 25010, 25020, JE 25010, JE 25020,   │
│    Total, Balance, Variance, Details)                        │
│  • Populate rows with merged data                            │
│  • Add separator and GRAND TOTAL rows                        │
│  • Add client scripts for CSV export and drill-down          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Render HTML Page                            │
│  context.response.writePage(form)                            │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Journal Entry Search Flow

```
┌─────────────────────────────────────────────────────────────┐
│          getJournalEntryAmounts(asOfDate)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Create Journal Entry Search                     │
│  Type: journalentry                                          │
│  Filters:                                                    │
│    • type = "Journal"                                        │
│    • trandate <= asOfDate                                    │
│    • posting = True                                          │
│    • (account LIKE '%25010%' OR account LIKE '%25020%')     │
│    • line.cseg_hmp_event IS NOT NULL                        │
│  Columns:                                                    │
│    • line.cseg_hmp_event (GROUP)                            │
│    • SUM(CASE account=25010 THEN amount)                    │
│    • SUM(CASE account=25020 THEN amount)                    │
│    • SUM(total)                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Execute Search                              │
│  journalentrySearchObj.run().each(callback)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Process Each Result                             │
│  FOR EACH result:                                            │
│    eventId = result.getValue('line.cseg_hmp_event')         │
│    eventText = result.getText('line.cseg_hmp_event')        │
│    je25010 = parseFloat(result.getValue(column[1]))         │
│    je25020 = parseFloat(result.getValue(column[2]))         │
│    jeTotal = parseFloat(result.getValue(column[3]))         │
│                                                              │
│    jeAmountsByEvent[eventId] = {                             │
│      eventId, eventText, je25010, je25020, jeTotal          │
│    }                                                         │
│  END FOR                                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            Return jeAmountsByEvent Map                       │
│  {                                                           │
│    "123": { eventId, eventText, je25010, je25020, jeTotal },│
│    "456": { ... },                                           │
│    ...                                                       │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Drill-Down Variance Analysis Flow

```
┌─────────────────────────────────────────────────────────────┐
│              User Clicks "View" Link                         │
│  drillDown(eventId) called with event ID                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          Navigate to Drill-Down URL                          │
│  custpage_drill_event=[eventId]                              │
│  custpage_drill_event_name=[eventName]                       │
│  custpage_drill_date=[asOfDate]                              │
│  custpage_drill_revenue_date=[revenueDate]                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          onRequest() Detects Drill-Down Request              │
│  IF custpage_drill_event EXISTS:                             │
│    CALL showDrillDownDetails(...)                            │
│    RETURN                                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│        showDrillDownDetails() Function                       │
│  • Initialize debugData                                      │
│  • Create drill-down form                                    │
│  • Build search filters for event                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Execute Main Search    │  │  Execute CM Search       │
│   • Type: transaction    │  │  • Type: creditmemo      │
│   • Filter: event ID     │  │  • Account: 25010/25020  │
│   • Include: SO, INV, JE │  │  • Get createdFrom       │
└───────────┬──────────────┘  └──────────┬───────────────┘
            │                            │
            ▼                            ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ Process Search Results   │  │ Match CMs to SOs         │
│ • Build salesOrderMap    │  │ • Use invoiceToSOMap     │
│ • Track Invoice-to-SO    │  │ • Add CM amounts to SOs  │
│ • Accumulate amounts     │  │ • Track relationship     │
└───────────┬──────────────┘  └──────────┬───────────────┘
            │                            │
            └──────────┬─────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Calculate Variances                             │
│  FOR EACH Sales Order in salesOrderMap:                      │
│    totalActual = actualDeferred25010 + actualDeferred25020   │
│    variance = balancePerSchedule - totalActual               │
│    IF abs(variance) > 0.01:                                  │
│      ADD to displayList                                      │
│    END IF                                                    │
│  END FOR                                                     │
│  SORT displayList by absolute variance (desc)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Render Drill-Down Page                          │
│  • Display SO details in sublist                             │
│  • Show variance summary                                     │
│  • Add Back to Summary button                                │
│  • Add Export to CSV button                                  │
│  • Create debug file                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          Write Page and Debug File                           │
│  context.response.writePage(form)                            │
│  createDebugFile(...)                                        │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Credit Memo Reconciliation Flow

```
┌─────────────────────────────────────────────────────────────┐
│          Credit Memo in NetSuite                             │
│  CM12345 created from Invoice INV67890                       │
│  INV67890 created from Sales Order SO98765                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│       Main Transaction Search Executes                       │
│  • Finds INV67890 with createdFrom = SO98765                 │
│  • Stores in invoiceToSOMap:                                 │
│    invoiceToSOMap["INV67890"] = "SO98765"                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         Credit Memo Search Executes                          │
│  • Finds CM12345 with createdFrom = "Invoice #INV67890"      │
│  • Extract invoice reference: "INV67890"                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          Match CM to Invoice                                 │
│  cmInvoiceRef = "INV67890"                                   │
│  SEARCH transactionDetails for tranId = "INV67890"           │
│  FOUND: matchingInvoice with createdFromSO = "SO98765"       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          Match CM to Sales Order                             │
│  targetSOId = matchingInvoice.createdFromSO                  │
│  targetSOId = "SO98765"                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│       Add CM Amounts to Sales Order                          │
│  salesOrderMap["SO98765"].actualDeferred25010 += cm.amount25010 │
│  salesOrderMap["SO98765"].actualDeferred25020 += cm.amount25020 │
│  salesOrderMap["SO98765"].relatedTransactions.push({         │
│    type: "Credit Memo",                                      │
│    tranId: "CM12345",                                        │
│    amount25010: ...,                                         │
│    amount25020: ...,                                         │
│    via: "Invoice INV67890"                                   │
│  })                                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│        Variance Calculation Includes CM                      │
│  SO98765 variance now reflects CM impact                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Troubleshooting Guide

### 8.1 Common Issues and Solutions

#### Issue 1: No Results Displayed

**Symptoms:**
- Report loads successfully
- Date filters are set correctly
- Sublist is empty or shows "No results found"

**Possible Causes:**
1. Saved search ID is incorrect or search doesn't exist
2. Date filters exclude all transactions
3. No transactions have HMP Event assigned
4. User lacks permissions to view data

**Solutions:**

**Solution 1a: Verify Saved Search**
```
1. Check script line 159: const SAVED_SEARCH_ID = '338219'
2. Navigate to: Lists > Saved Searches > All Saved Searches
3. Search for: customsearch338219
4. If not found:
   - Create the required saved search
   - Or update SAVED_SEARCH_ID to correct value
   - Redeploy script
```

**Solution 1b: Test Search Manually**
```
1. Run saved search manually in NetSuite
2. Verify search returns results
3. Check search filters (trandate, event assignment)
4. If no results, search criteria may be too restrictive
```

**Solution 1c: Check Date Ranges**
```
1. Try with wider date range (e.g., past 12 months)
2. Remove revenue date filter (leave blank)
3. If results appear, original date range had no transactions
```

**Solution 1d: Verify Event Assignment**
```
1. Navigate to a sample transaction (Sales Order, Invoice)
2. Check if HMP Event field is populated
3. If blank, transactions won't appear in report
4. Assign events to transactions and re-run
```

**Solution 1e: Check User Permissions**
```
1. Verify user has permissions to view:
   - Transaction records
   - Custom segments
   - GL account details
2. Test with Administrator role to rule out permissions
```

---

#### Issue 2: JE Columns Show Zero

**Symptoms:**
- Report displays results
- "JE 25010" and "JE 25020" columns show $0.00 for all events
- Expected to see JE amounts

**Possible Causes:**
1. No journal entries exist for the date range
2. JE search filters are too restrictive
3. Journal entries not posted
4. Accounts don't match pattern (25010, 25020)
5. JE lines missing HMP Event assignment

**Solutions:**

**Solution 2a: Verify JE Existence**
```
1. Navigate to: Transactions > Financial > Make Journal Entries
2. Search for entries with:
   - Date <= As Of Date
   - Account = 25010 or 25020
   - Status = Posted
3. If none exist, JE columns correctly show $0.00
```

**Solution 2b: Check JE Posting Status**
```
1. Open a sample Journal Entry
2. Check Status field
3. If "Pending Approval", entry is not posted
4. Post the entry or adjust approval workflow
```

**Solution 2c: Verify Event Assignment on JE**
```
1. Open a Journal Entry affecting deferred revenue
2. Go to Lines tab
3. Check if HMP Event is populated on lines
4. If blank, add event assignment
5. Save and re-run report
```

**Solution 2d: Check Account Numbers**
```
1. Verify deferred revenue accounts are named:
   - "25010 - Deferred Revenue" or similar
   - "25020 - Deferred Revenue" or similar
2. Script uses LIKE '%25010%' pattern
3. If accounts have different numbers, update script:
   - Lines 54, 69-82 (search filters)
   - Update account patterns
```

**Solution 2e: Review Execution Logs**
```
1. Navigate to: Customization > Scripting > Script Execution Log
2. Filter by: Script = Deferred Revenue Report
3. Look for:
   - "Journal Entry Search Result Count" log
   - Should show > 0 if JEs exist
4. If count is 0, investigate search criteria
```

---

#### Issue 3: Variance Amounts Incorrect

**Symptoms:**
- Variance column shows unexpected values
- Manual calculation doesn't match displayed variance
- Discrepancies between summary and drill-down

**Possible Causes:**
1. JE amounts not included in calculation (pre-enhancement)
2. Credit memos not properly linked to SOs
3. Revenue schedule amounts incorrect
4. Timing differences (transaction dates vs. report date)
5. Currency conversion issues

**Solutions:**

**Solution 3a: Verify Variance Formula**
```
Expected Formula:
  Variance = (25010 + 25020 + JE 25010 + JE 25020) - Balance Per Schedule

Check in script (lines 493-497):
  const combinedTotal = searchTotal + jeData.jeTotal;
  const variance = combinedTotal - balanceSchedule;

If JE amounts are missing, variance will be incorrect.
```

**Solution 3b: Manual Recalculation Test**
```
1. Select an event with variance
2. Click "View" to drill down
3. Export detail to CSV
4. In Excel, sum Actual 25010 + Actual 25020
5. Compare to Balance Per Schedule
6. Calculate: Actual - Schedule
7. Compare to displayed Variance
8. If mismatch, investigate data sources
```

**Solution 3c: Check Balance Per Schedule**
```
1. Drill down to event detail
2. Identify Sales Order with variance
3. Open SO in NetSuite
4. Go to Items tab
5. Check custcol_hmp_revenue_amt field on lines
6. Sum all line amounts
7. Compare to "Balance Per Schedule" in report
8. If mismatch, revenue schedule data is incorrect
```

**Solution 3d: Investigate Credit Memo Linkage**
```
1. Check debug file (created during drill-down)
2. Look for creditMemoSearchError in JSON
3. If error exists, CM search failed
4. Review error message
5. Common issue: CM search permissions
6. Grant user access to Credit Memo records
```

**Solution 3e: Review Multi-Level Relationships**
```
Correct flow: SO > Invoice > Credit Memo

1. Open Sales Order with variance
2. Check Related Records tab
3. Verify Invoice is listed
4. Open Invoice
5. Check Related Records for Credit Memos
6. Verify CM is listed
7. If relationships are broken, variance will be incorrect
8. Re-link transactions if needed
```

---

#### Issue 4: Drill-Down Shows No Variance

**Symptoms:**
- Click "View" link from summary report
- Drill-down page loads
- "Sales Orders with Variance" sublist is empty
- Summary showed variance for this event

**Possible Causes:**
1. Variance threshold filter (only shows |variance| > $0.01)
2. Sales Orders not properly identified in search
3. All variance attributed to JE-only events
4. Date filter discrepancies

**Solutions:**

**Solution 4a: Check Variance Threshold**
```
In showDrillDownDetails() function (line 654):
  if (Math.abs(variance) > 0.01) {
    // Display SO
  }

If all variances are exactly $0.00, nothing displays.
This is correct behavior (no variance to investigate).
```

**Solution 4b: Review Debug File**
```
1. Drill-down creates debug file in File Cabinet
2. Navigate to: Documents > Files > Deferred Revenue Debug Logs
3. Find latest file: debug_variance_[eventId]_[timestamp].json
4. Download and open in text editor
5. Review sections:
   - searchResults: All transactions found
   - salesOrderMap: SO-level aggregation
   - errors: Any processing errors
6. Look for:
   - Are SOs present in searchResults?
   - Are they in salesOrderMap?
   - What are the calculated variances?
```

**Solution 4c: Verify SO Transaction Type**
```
Script looks for transaction type = "Sales Order" (line 307-309)

If NetSuite uses different transaction type name:
1. Check debug file for actual transaction type values
2. Update SALES_ORDER_TYPES constant (line 225):
   const SALES_ORDER_TYPES = ['Sales Order', 'SalesOrd', 'salesorder', 'Sales Ord', 'YOUR_TYPE'];
3. Redeploy script
```

**Solution 4d: Check Date Consistency**
```
1. Note As Of Date from drill-down header
2. Compare to transaction dates in debug file
3. Ensure transactions are <= As Of Date
4. If dates are after As Of Date, they won't appear
```

---

#### Issue 5: "Error Loading Report" Message

**Symptoms:**
- Report page displays error message
- Red error box with exception details
- Unable to view results

**Possible Causes:**
1. Saved search doesn't exist or is deleted
2. Script has syntax errors (after modification)
3. Required custom fields are missing
4. NetSuite API timeout
5. Governance limit exceeded

**Solutions:**

**Solution 5a: Check Execution Logs**
```
1. Navigate to: Customization > Scripting > Script Execution Log
2. Filter by:
   - Script: Deferred Revenue Report
   - Date: Today
   - Status: Failed
3. Click on error entry
4. Review Details section for full error message and stack trace
5. Common errors:
   - "Search not found": Saved search ID incorrect
   - "Field not found": Custom field ID incorrect
   - "Unexpected token": Syntax error in script
```

**Solution 5b: Verify Saved Search**
```
If error mentions search:
1. Go to: Lists > Saved Searches > All Saved Searches
2. Search for ID: 338219
3. If not found:
   - Search was deleted or ID changed
   - Create new search or restore from backup
   - Update script with new search ID
```

**Solution 5c: Verify Custom Fields**
```
If error mentions custom field:
1. Go to: Customization > Lists, Records, & Fields
2. Check for:
   - custcol_hmp_pub_revenue_date
   - custcol_hmp_revenue_amt
   - cseg_hmp_event
3. If any are missing:
   - Restore field from backup
   - Or remove references from script (if not needed)
```

**Solution 5d: Check Governance Limits**
```
If error mentions "USAGE_LIMIT_EXCEEDED":
1. Review execution log for governance usage
2. Script should use 50-200 units normally
3. If exceeding 1000 units:
   - Dataset may be too large
   - Implement pagination
   - Reduce search complexity
   - Contact NetSuite support to increase limit
```

**Solution 5e: Timeout Issues**
```
If error mentions "TIMEOUT" or "SSS_TIME_LIMIT_EXCEEDED":
1. Dataset is too large for single execution
2. Solutions:
   - Reduce date range
   - Add more specific filters
   - Implement scheduled script approach
   - Break into multiple searches
```

---

#### Issue 6: CSV Export Not Working

**Symptoms:**
- Click "Export to CSV" button
- Nothing happens or error in browser console
- File doesn't download

**Possible Causes:**
1. Browser pop-up blocker
2. JavaScript error in export function
3. Data format issue (special characters)
4. Browser compatibility issue

**Solutions:**

**Solution 6a: Check Browser Console**
```
1. Press F12 to open Developer Tools
2. Click Console tab
3. Click "Export to CSV" button
4. Look for error messages in red
5. Common errors:
   - "Blob is not defined": IE compatibility issue
   - "window.summaryData is undefined": Data not loaded
   - Syntax errors: Script issue
```

**Solution 6b: Disable Pop-Up Blocker**
```
1. Check for pop-up blocker notification in address bar
2. Click notification
3. Select "Always allow pop-ups from this site"
4. Refresh page and try again
```

**Solution 6c: Try Different Browser**
```
CSV export uses modern browser APIs:
- Best: Chrome, Edge (Chromium), Firefox
- Limited: IE 11 (uses fallback msSaveBlob)
- Not supported: IE 10 and below

If using old browser, upgrade or use different browser.
```

**Solution 6d: Test with Small Dataset**
```
If export fails with large dataset:
1. Filter report to single event
2. Try export again
3. If successful, dataset size is the issue
4. Implement chunked export or pagination
```

---

#### Issue 7: Performance Degradation

**Symptoms:**
- Report takes >30 seconds to load
- Browser shows "Script running slowly" warning
- Timeout errors
- Poor user experience

**Possible Causes:**
1. Large dataset (many events, many transactions)
2. Complex searches
3. Inefficient data processing
4. Debug logging overhead

**Solutions:**

**Solution 7a: Reduce Date Range**
```
1. Use shorter As Of Date range (e.g., current quarter only)
2. Add Revenue Date filter to narrow results
3. Focus on specific events
4. Create separate reports for historical data
```

**Solution 7b: Optimize Search Filters**
```
1. Review saved search (ID 338219)
2. Ensure filters are efficient:
   - Use indexed fields where possible
   - Avoid formula fields in filters (use in results only)
   - Use specific criteria (avoid broad wildcards)
3. Test search performance separately
```

**Solution 7c: Reduce Logging Level**
```
1. Edit Script Deployment
2. Change Log Level from DEBUG to AUDIT
3. Reduces logging overhead by ~30%
4. Use DEBUG only for troubleshooting
```

**Solution 7d: Implement Pagination**
```
If dataset is consistently large:
1. Modify script to use pagination
2. Display first 100 events by default
3. Add "Load More" button
4. Store intermediate results in cache
```

**Solution 7e: Schedule as Saved Report**
```
For regular reporting:
1. Create Scheduled Script version
2. Run nightly or weekly
3. Save results to CSV in File Cabinet
4. Users download pre-generated file
5. Eliminates real-time performance issue
```

---

### 8.2 Debug Techniques

#### Technique 1: Enable Debug Logging

**Steps:**
1. Edit Script Deployment
2. Set Log Level: DEBUG
3. Run report
4. Review execution logs:
   - Navigate to: Customization > Scripting > Script Execution Log
   - Look for detailed logs with search results, calculations, errors

**What to Look For:**
- "Saved Search Loaded": Confirms search loaded successfully
- "Journal Entry Search Result Count": Number of JE results
- "Journal Entry Summary": Total events and amounts from JE search
- "Processing Complete": Final counts and statistics
- Any ERROR or EMERGENCY level logs

---

#### Technique 2: Use Debug Files

**Steps:**
1. Ensure debug folder exists (ID: 229740)
2. Drill down into an event (triggers debug file creation)
3. Navigate to: Documents > Files > File Cabinet > [Debug Folder]
4. Download latest debug file
5. Open in JSON viewer or text editor

**Debug File Contents:**
```json
{
  "timestamp": "ISO timestamp",
  "eventId": "Event ID",
  "eventName": "Event name",
  "asOfDate": "Report date",
  "revenueDate": "Revenue filter date",
  "filters": [...],  // Search filters used
  "searchResults": [...],  // Raw search results
  "salesOrderMap": {...},  // Aggregated SO data
  "invoiceToSOMap": {...},  // Invoice-SO relationships
  "errors": [...]  // Any errors encountered
}
```

**Analysis:**
- Check searchResults count
- Verify salesOrderMap has expected SOs
- Look for errors array content
- Trace individual transactions

---

#### Technique 3: Manual Search Testing

**Steps:**
1. Copy search criteria from script
2. Create test saved search manually
3. Run search in NetSuite UI
4. Compare results to report
5. Identify discrepancies

**Example: Test JE Search**
```
Type: Journal Entry
Filters:
  Type = Journal
  Date <= [As Of Date]
  Posting = Yes
  Account contains "25010" OR Account contains "25020"
  Line: HMP Event is not empty
Columns:
  Line: HMP Event (Summary: Group)
  Amount (Summary: Sum, Formula: CASE WHEN Account LIKE '%25010%' THEN Amount ELSE 0 END)
  Amount (Summary: Sum, Formula: CASE WHEN Account LIKE '%25020%' THEN Amount ELSE 0 END)
```

---

#### Technique 4: Browser Developer Tools

**Steps:**
1. Open report in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Check for JavaScript errors
5. Go to Network tab to see API calls
6. Use Debugger to step through client-side code

**Useful Console Commands:**
```javascript
// Check if data loaded
console.log(window.summaryData);
console.log(window.asOfDate);
console.log(window.drillDownData);

// Test CSV export function without triggering download
var csv = buildCSVContent();
console.log(csv);
```

---

#### Technique 5: Incremental Testing

**Steps:**
1. Test with minimal dataset (1 event, 1 SO)
2. Gradually increase complexity
3. Identify at what point issue occurs
4. Isolate problematic data

**Approach:**
```
Test 1: Single event, no variance
Test 2: Single event, with variance
Test 3: Single event, with JE amounts
Test 4: Multiple events, no variance
Test 5: Multiple events, with variance
Test 6: Full dataset
```

---

### 8.3 Contacting Support

**When to Escalate:**
- Critical business impact (report unavailable)
- Suspected NetSuite platform issue
- Data integrity concerns
- Unable to resolve after troubleshooting

**Information to Provide:**
1. **Environment Details:**
   - NetSuite Account ID
   - Script ID and Deployment ID
   - NetSuite version
   - Date/time of issue

2. **Issue Description:**
   - Exact error message (copy/paste)
   - Steps to reproduce
   - Expected vs. actual behavior
   - Frequency (always, intermittent)

3. **Supporting Data:**
   - Screenshot of error
   - Execution log entries
   - Debug file (if available)
   - Sample data (event ID, transaction IDs)

4. **Troubleshooting Steps Taken:**
   - List what you've already tried
   - Results of each attempt

**Support Contacts:**
- Internal IT: [Support Portal]
- NetSuite Support: Case submission via NetSuite account
- Development Team: [Email/Slack channel]

---

## 9. Performance Considerations

### 9.1 Governance Units

**NetSuite Governance Limits:**
- Suitelet Script: 1,000 units per request
- Search operations: 10 units per search, 1 unit per result row (first 1000 rows)
- UI operations: 1-5 units per operation

**Script Usage Breakdown:**

| Operation | Units | Notes |
|-----------|-------|-------|
| Load Saved Search | 10 | One-time cost |
| Run Saved Search | 10-50 | Depends on result count |
| JE Search Create | 10 | Dynamic search creation |
| JE Search Run | 10-50 | Depends on result count |
| Build UI Form | 5 | Form creation |
| Add Sublist | 5 | Sublist creation |
| Set Sublist Values | ~0.1 per line | Minimal cost |
| Drill-Down Search | 20-100 | More complex search |
| Debug File Create | 30 | Optional, only on drill-down |
| **Total (Main Report)** | **50-120** | Well within limit |
| **Total (Drill-Down)** | **50-200** | Still safe |

**Optimization Strategies:**
1. **Minimize Search Executions**: Use efficient filters to reduce result set
2. **Avoid Redundant Searches**: Cache results where possible
3. **Use Saved Searches**: Pre-optimized by NetSuite
4. **Limit Debug Logging**: Set log level to AUDIT in production

---

### 9.2 Search Optimization

#### 9.2.1 Saved Search Best Practices

**Current Implementation:**
- Uses saved search ID 338219
- Pre-configured filters and columns
- Leverages NetSuite's search optimization

**Recommendations:**

**1. Index Utilization:**
```
Prefer indexed fields in filters:
  ✓ trandate (indexed)
  ✓ type (indexed)
  ✓ account (indexed)
  ✗ Custom formula fields (not indexed)
```

**2. Filter Order:**
```
Most restrictive filters first:
  1. trandate (narrows to date range)
  2. type (limits transaction types)
  3. event segment (filters to specific events)
  4. Formula filters (last resort, slow)
```

**3. Column Selection:**
```
Only include necessary columns:
  ✓ Required: Event, Account amounts, Balance schedule
  ✗ Avoid: Memo, Name, Full addresses (unless needed)
```

#### 9.2.2 Journal Entry Search Optimization

**Current Implementation:**
```javascript
const journalentrySearchObj = search.create({
    type: "journalentry",
    filters: [
        ["formulanumeric: CASE WHEN ...", "equalto", "1"],
        "AND",
        ["trandate", "onorbefore", asOfDate],
        "AND",
        ["type", "anyof", "Journal"]
    ],
    columns: [...]
});
```

**Performance Characteristics:**
- Formula filter: Slower, but necessary for complex logic
- Date filter: Fast (indexed)
- Type filter: Fast (indexed)
- GROUP BY: Reduces result set significantly

**Alternative Approach (Faster but Less Flexible):**
```javascript
// Replace formula filter with standard filters
filters: [
    ["account", "contains", "25010"],
    "OR",
    ["account", "contains", "25020"],
    "AND",
    ["line.cseg_hmp_event", "isnotempty"],
    "AND",
    ["trandate", "onorbefore", asOfDate],
    "AND",
    ["type", "anyof", "Journal"]
]
```

**Trade-off:**
- Faster execution (no formula evaluation)
- Less precise (may include non-deferred accounts with "25010" in name)
- Requires more specific account naming conventions

---

### 9.3 Large Dataset Handling

#### 9.3.1 Pagination Strategy

**When to Implement:**
- More than 1,000 events in result set
- Report load time exceeds 10 seconds
- Users complain of performance

**Implementation Approach:**
```javascript
// Modify pagedData processing
const pagedData = savedSearch.runPaged({
    pageSize: 1000
});

// Option 1: Limit to first N pages
const MAX_PAGES = 3;  // Display first 3000 results
pagedData.pageRanges.slice(0, MAX_PAGES).forEach(pageRange => {
    // Process page
});

// Option 2: Server-side pagination
let currentPage = context.request.parameters.custpage_page || 0;
const page = pagedData.fetch({ index: currentPage });
// Display page with Next/Previous buttons
```

#### 9.3.2 Caching Strategy

**Use Case:** Same report run multiple times within short period

**Implementation:**
```javascript
// Pseudo-code
const cacheKey = `deferred_rev_${asOfDate}_${revenueDate}`;
let results = cache.get(cacheKey);

if (!results) {
    results = runSearches();
    cache.set(cacheKey, results, 3600);  // Cache for 1 hour
}

displayResults(results);
```

**Benefits:**
- Eliminates redundant searches
- Faster response for repeat requests
- Reduces governance usage

**Limitations:**
- Requires cache module (N/cache)
- Cache size limits (1MB per key)
- Invalidation complexity (when data changes)

#### 9.3.3 Asynchronous Processing

**For Very Large Datasets:**

**Option 1: Map/Reduce Script**
```
1. Create Map/Reduce version of report
2. Schedule to run nightly
3. Generate CSV file in File Cabinet
4. Suitelet displays link to download
```

**Option 2: Scheduled Script + Email**
```
1. User requests report (enters date filters)
2. Suitelet queues scheduled script
3. Scheduled script generates report
4. Emails CSV to user when complete
```

**Benefits:**
- No governance limits (10,000 units for Map/Reduce)
- Can process millions of records
- Better user experience (no waiting)

---

### 9.4 Memory Management

#### 9.4.1 Object Size Limits

**NetSuite Limits:**
- Script runtime memory: ~200MB (not published, approximate)
- Large objects can cause "OUT_OF_MEMORY" errors

**Current Implementation:**
- Stores all results in memory (salesOrderMap, jeAmountsByEvent)
- Risk: For very large datasets, may exceed memory limits

**Memory Optimization:**

**1. Process in Chunks:**
```javascript
// Instead of loading all results at once:
let allResults = search.run().getRange({ start: 0, end: 1000 });

// Process in batches:
const BATCH_SIZE = 100;
for (let i = 0; i < 1000; i += BATCH_SIZE) {
    let batch = search.run().getRange({ start: i, end: i + BATCH_SIZE });
    processBatch(batch);
    batch = null;  // Free memory
}
```

**2. Avoid Redundant Data Storage:**
```javascript
// Bad: Store full result objects
salesOrderMap[soId] = result;

// Good: Store only needed fields
salesOrderMap[soId] = {
    tranId: result.getValue('tranid'),
    amount: result.getValue('amount')
    // Only essential fields
};
```

**3. Clear Unused Variables:**
```javascript
// After processing
transactionDetails = null;
debugData = null;
// JavaScript garbage collector will free memory
```

#### 9.4.2 String Concatenation

**Issue:** Building large strings (e.g., CSV content) can be memory-intensive

**Bad Practice:**
```javascript
let csv = '';
results.forEach(row => {
    csv += row.field1 + ',' + row.field2 + '\n';  // Creates new string each time
});
```

**Good Practice:**
```javascript
let csvArray = [];
results.forEach(row => {
    csvArray.push([row.field1, row.field2].join(','));
});
let csv = csvArray.join('\n');  // Single concatenation
```

**Benefits:**
- Reduces memory allocations
- Faster execution
- More predictable memory usage

---

### 9.5 Monitoring and Alerting

#### 9.5.1 Execution Log Monitoring

**Key Metrics to Track:**
- Execution time per request
- Governance units consumed
- Error rate
- Result set size

**Log Audit Points (Already Implemented):**
```javascript
log.audit('Journal Entry Search Result Count', count);
log.audit('Journal Entry Summary', { eventCount, totalJEs });
log.audit('Processing Complete', { totalResults, salesOrdersFound });
```

**Additional Monitoring (Recommended):**
```javascript
const startTime = Date.now();
// ... script logic ...
const endTime = Date.now();
log.audit('Performance Metrics', {
    executionTime: endTime - startTime,
    governanceUsed: runtime.getCurrentScript().getRemainingUsage(),
    resultCount: lineNum
});
```

#### 9.5.2 Performance Degradation Alerts

**Setup:**
1. Create saved search on Script Execution Log
2. Filter for:
   - Script = Deferred Revenue Report
   - Execution time > 30 seconds
   - Status = Failed
3. Schedule search to run daily
4. Email results to IT team

**Alert Criteria:**
- Execution time trend increasing
- Governance usage approaching limit
- Error rate > 5%
- User complaints

**Response Actions:**
- Review dataset size trends
- Optimize searches if needed
- Implement pagination
- Consider alternative architecture (Map/Reduce)

---

### 9.6 Scalability Considerations

#### 9.6.1 Current Capacity

**Estimated Capacity:**
- Events: Up to 5,000 events
- Transactions per event: Average 100
- Total transactions: 500,000
- Load time: <10 seconds
- Governance usage: 50-150 units

**Bottlenecks:**
1. UI rendering (more than 1,000 rows in sublist)
2. Client-side CSV generation (large datasets)
3. Search execution (complex formulas)

#### 9.6.2 Growth Projections

**Year 1:**
- Expected events: 2,000
- Status: Current architecture sufficient

**Year 2:**
- Expected events: 5,000
- Status: Monitor performance, may need pagination

**Year 3+:**
- Expected events: 10,000+
- Status: Requires architectural changes
- Recommendation: Implement Map/Reduce + scheduled report approach

#### 9.6.3 Alternative Architectures

**For Massive Scale:**

**Option 1: SuiteAnalytics Workbook**
```
Pros:
- Leverages NetSuite's optimized query engine
- Built-in pagination and filtering
- No governance limits
- Advanced visualization

Cons:
- Requires SuiteAnalytics license
- Less customizable UI
- No custom logic (JE integration may be challenging)
```

**Option 2: External Data Warehouse**
```
Pros:
- Unlimited scale
- Advanced analytics capabilities
- Integration with BI tools
- Historical data warehousing

Cons:
- Additional infrastructure cost
- Data synchronization complexity
- Security considerations
- Development effort
```

**Option 3: Hybrid Approach**
```
1. Scheduled script exports data to File Cabinet (CSV)
2. External ETL process loads to data warehouse
3. BI tool (Tableau, Power BI) for analysis
4. Suitelet provides quick summary view
```

---

## 10. Change Log

### Version 2.1 - Journal Entry Integration (October 2025)

**Overview:** Enhanced deferred revenue report to include Journal Entry transactions in calculations and display.

#### 10.1 New Features

**1. Journal Entry Search Integration**
- **Added:** `getJournalEntryAmounts(asOfDate)` function
- **Purpose:** Retrieve JE transactions affecting deferred revenue accounts
- **Implementation:** Dynamic search creation with formula filters
- **Accounts:** 25010 and 25020
- **Grouping:** By HMP Event segment
- **Return:** Map of event IDs to JE amounts

**2. Dual-Source Data Merge**
- **Added:** Logic to combine saved search results with JE search results
- **Implementation:** Lines 319-326, 398-658
- **Calculation:** `combinedTotal = searchTotal + jeData.jeTotal`
- **Variance:** Recalculated to include JE amounts
- **Display:** Separate columns for JE amounts

**3. New Display Columns**
- **Added Columns:**
  - "JE 25010" - Journal Entry amounts for account 25010
  - "JE 25020" - Journal Entry amounts for account 25020
- **Updated Column:**
  - "Total Deferred" - Now includes JE amounts (previously "Total Deferred")
- **Column Order:**
  - HMP Event
  - 25010 - Deferred Revenue (saved search)
  - 25020 - Deferred Revenue (saved search)
  - JE 25010 (new)
  - JE 25020 (new)
  - Total Deferred (Including JE) (updated)
  - Balance Per Schedule
  - Variance (updated to include JE)
  - Details

**4. JE-Only Event Display**
- **Added:** Detection of events with only JE transactions (no Sales Orders)
- **Implementation:** Lines 584-658
- **Display:** Event name suffixed with "(JE Only)"
- **Characteristics:**
  - Balance Per Schedule = $0.00
  - Variance = JE Total
  - No drill-down (no SOs to analyze)

**5. Enhanced Report Header**
- **Added:** Note about JE integration
- **Location:** Info field (lines 435-449)
- **Content:** Explanation of JE columns and data sources

#### 10.2 Modified Features

**1. Main Report Title**
- **Before:** "Deferred Revenue by Event Report"
- **After:** "Deferred Revenue by Event Report (Including Journal Entries)"
- **Location:** Line 163

**2. Variance Calculation**
- **Before:** `variance = (25010 + 25020) - balanceSchedule`
- **After:** `variance = (25010 + 25020 + JE25010 + JE25020) - balanceSchedule`
- **Impact:** More accurate variance detection

**3. Grand Total Row**
- **Before:** Included only saved search amounts
- **After:** Includes JE amounts in totals
- **Columns Updated:**
  - JE 25010 total
  - JE 25020 total
  - Combined total (includes JE)

**4. CSV Export**
- **Modified:** Summary export includes JE columns
- **File Format:** Additional columns for JE amounts
- **Compatibility:** Excel/Google Sheets compatible

#### 10.3 Technical Changes

**1. Module Dependencies**
- **No changes:** All required modules already imported
- **Modules used:** N/search, N/ui/serverWidget, N/format, N/log, N/url, N/runtime, N/file

**2. Performance Impact**
- **Added:** One additional search execution (JE search)
- **Governance cost:** +10-50 units (depending on JE result count)
- **Total governance:** 50-120 units (still well within 1000 limit)
- **Execution time:** +1-2 seconds

**3. Data Structures**
- **Added:** `jeAmountsByEvent` object (lines 319-326)
- **Structure:** Map of event IDs to JE amount objects
- **Fields:**
  - eventId: string
  - eventText: string
  - je25010: number
  - je25020: number
  - jeTotal: number

**4. Error Handling**
- **Added:** Try-catch in `getJournalEntryAmounts()`
- **Behavior:** Returns empty object {} on error (graceful degradation)
- **Logging:** Errors logged to execution log
- **Impact:** Main report continues even if JE search fails

**5. Search Filters**
- **JE Search Filters:**
  - Type = "Journal"
  - Transaction Date <= As Of Date
  - Posting = True
  - Account contains "25010" OR "25020"
  - Line: HMP Event is not empty
- **Formula:** Complex CASE statement to ensure correct record types

#### 10.4 Removed/Deprecated Features

**None.** All existing functionality preserved.

#### 10.5 Known Issues

**1. Credit Memo to JE Relationship**
- **Issue:** Credit memos created from Journal Entries not currently tracked
- **Impact:** Minor variance in edge cases
- **Workaround:** Manual investigation of CM-JE relationships
- **Fix planned:** Future enhancement

**2. Multi-Currency Considerations**
- **Issue:** JE amounts in foreign currency may not convert correctly
- **Impact:** Variance in multi-currency environments
- **Workaround:** Use single currency or manual adjustments
- **Fix planned:** Future enhancement with currency conversion

**3. JE Drill-Down Detail**
- **Issue:** Drill-down view doesn't show JE transaction details
- **Impact:** Cannot see which specific JEs contribute to variance
- **Workaround:** Use debug file or manual search
- **Fix planned:** Future enhancement

#### 10.6 Upgrade Instructions

**From Version 1.0 (Original) to Version 2.1:**

1. **Backup Current Version:**
   ```
   - Download existing script file
   - Save copy as ndc_deferred_revenue_suitelet_v1.js
   - Note current deployment settings
   ```

2. **Upload New Version:**
   ```
   - Upload ndc_deferred_revenue_suitelet_with_je.js
   - Update script record to point to new file
   - OR create new script record with new file
   ```

3. **Test in Development:**
   ```
   - Create test deployment
   - Run report with known data
   - Verify JE amounts display correctly
   - Compare totals to manual calculation
   - Test drill-down functionality
   ```

4. **Update Documentation:**
   ```
   - Notify users of new JE columns
   - Update training materials
   - Provide examples of JE-only events
   ```

5. **Deploy to Production:**
   ```
   - Schedule deployment during low-usage period
   - Update production deployment to new file
   - OR release new deployment and retire old one
   - Monitor execution logs for errors
   ```

6. **Post-Deployment Validation:**
   ```
   - Run report for multiple date ranges
   - Verify totals reconcile to GL
   - Check variance detection accuracy
   - Collect user feedback
   ```

#### 10.7 Testing Checklist

**Functional Testing:**
- [ ] Report loads without errors
- [ ] JE columns display with data
- [ ] JE-only events show with "(JE Only)" suffix
- [ ] Variance calculation includes JE amounts
- [ ] Grand total row includes JE totals
- [ ] CSV export includes JE columns
- [ ] Drill-down functionality still works
- [ ] Back button from drill-down works

**Data Validation:**
- [ ] JE amounts match manual GL query
- [ ] Combined totals = Saved Search + JE totals
- [ ] Variance = Combined - Balance Schedule
- [ ] No duplicates in event list
- [ ] All events with JEs are included

**Performance Testing:**
- [ ] Load time <10 seconds (normal dataset)
- [ ] Governance usage <200 units
- [ ] No timeout errors
- [ ] Multiple concurrent users supported

**Edge Case Testing:**
- [ ] Events with JEs but no SOs (JE-only)
- [ ] Events with SOs but no JEs
- [ ] Events with both SOs and JEs
- [ ] No events with either (empty result)
- [ ] Large datasets (1000+ events)

**Regression Testing:**
- [ ] Existing features unchanged
- [ ] Drill-down still shows SO variances
- [ ] Date filters work correctly
- [ ] Revenue date filter works
- [ ] CSV export format correct
- [ ] Error handling intact

#### 10.8 Future Enhancements (Roadmap)

**Planned for Version 2.2:**
1. **JE Drill-Down Detail**
   - Show specific JE transactions contributing to event variance
   - Display JE memo and created by information
   - Link to JE record

2. **Multi-Currency Support**
   - Automatic currency conversion to base currency
   - Display currency information
   - Handle exchange rate variances

3. **Performance Optimization**
   - Implement server-side pagination
   - Add result caching
   - Optimize search filters

**Planned for Version 3.0:**
1. **Interactive Dashboard**
   - Charts and graphs for variance visualization
   - Trend analysis over time
   - Drill-down from charts

2. **Automated Alerts**
   - Email notifications for large variances
   - Scheduled report delivery
   - Threshold-based alerting

3. **Audit Trail**
   - Track user access to report
   - Log variance investigations
   - Document variance resolutions

---

## Appendix A: Script Deployment Record

**Script Details:**
- **Script Name:** Deferred Revenue Report with JE Integration
- **Script ID:** customscript_ndc_def_rev_je
- **Script Type:** Suitelet
- **API Version:** 2.1
- **Status:** Released
- **Owner:** NetSuite Development Team

**Deployment Details:**
- **Deployment Name:** Deferred Revenue Report - Production
- **Deployment ID:** customdeploy_ndc_def_rev_je_prod
- **Status:** Released
- **Log Level:** Audit (Debug for troubleshooting)
- **Execute As:** Administrator

**URLs:**
- **Internal URL:** `https://[ACCOUNT].app.netsuite.com/app/site/hosting/scriptlet.nl?script=[SCRIPT_ID]&deploy=[DEPLOY_ID]`
- **External URL:** (Same with returnExternalUrl parameter)

---

## Appendix B: Required Custom Objects

**Custom Segment:**
- **ID:** cseg_hmp_event
- **Name:** HMP Event
- **Type:** Custom Segment
- **Record Type:** Custom List
- **Applies To:** Transaction Line
- **Required:** Yes (for revenue recognition)

**Custom Fields:**
1. **Revenue Date:**
   - **ID:** custcol_hmp_pub_revenue_date
   - **Name:** Revenue Date
   - **Type:** Date
   - **Level:** Transaction Column Field
   - **Applies To:** Sales Order, Invoice, Journal Entry

2. **Revenue Amount:**
   - **ID:** custcol_hmp_revenue_amt
   - **Name:** Revenue Amount
   - **Type:** Currency
   - **Level:** Transaction Column Field
   - **Applies To:** Sales Order

**Saved Search:**
- **ID:** customsearch338219
- **Type:** Transaction
- **Purpose:** Deferred revenue aggregation by event

---

## Appendix C: Glossary

**Terms:**

- **Deferred Revenue:** Revenue received but not yet earned; liability on balance sheet
- **HMP Event:** Custom classification dimension for event-based revenue tracking
- **Variance:** Difference between actual deferred revenue and expected balance per schedule
- **Balance Per Schedule:** Expected deferred revenue based on revenue recognition schedule
- **JE (Journal Entry):** Manual accounting entry to adjust GL accounts
- **Suitelet:** NetSuite script type for creating custom web pages
- **Saved Search:** Predefined NetSuite search with filters and columns
- **Governance Units:** NetSuite's measure of script resource consumption
- **Drill-Down:** Detailed view of summary data, allowing deeper analysis

---

## Appendix D: Contact Information

**For Technical Support:**
- IT Service Desk: [Contact Info]
- Email: support@hmpglobal.com
- Phone: [Phone Number]

**For Development Issues:**
- Development Team Lead: [Name]
- Email: devteam@hmpglobal.com
- Slack: #netsuite-development

**For Business Questions:**
- Finance Controller: [Name]
- Email: controller@hmpglobal.com
- Phone: [Phone Number]

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 2025 | Development Team | Initial documentation |
| 2.0 | Oct 2025 | Documentation Specialist | Comprehensive technical documentation |
| 2.1 | Oct 2025 | Documentation Specialist | Added JE integration details |

---

**End of Documentation**
