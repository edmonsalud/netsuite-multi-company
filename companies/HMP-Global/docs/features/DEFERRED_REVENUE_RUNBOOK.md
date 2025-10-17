# Deferred Revenue Suitelet - Troubleshooting Runbook

## Table of Contents
1. [Quick Reference](#quick-reference)
2. [Debug Configuration](#debug-configuration)
3. [Common Issues & Solutions](#common-issues--solutions)
4. [Performance Troubleshooting](#performance-troubleshooting)
5. [Data Integrity Issues](#data-integrity-issues)
6. [Health Check Procedures](#health-check-procedures)
7. [Log Analysis](#log-analysis)
8. [Emergency Procedures](#emergency-procedures)
9. [Monitoring & Alerts](#monitoring--alerts)

---

## Quick Reference

### Debug Endpoints
```
Health Check:
https://[account].app.netsuite.com/app/site/hosting/scriptlet.nl?script=[scriptid]&deploy=[deployid]&action=health

Debug Info (Admin Only):
https://[account].app.netsuite.com/app/site/hosting/scriptlet.nl?script=[scriptid]&deploy=[deployid]&action=debug
```

### Script Parameters
| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| custscript_debug_level | OFF, ERROR, INFO, DEBUG, TRACE | INFO | Controls logging verbosity |
| custscript_debug_folder_id | Folder Internal ID | null | Where debug files are saved |
| custscript_perf_monitor_enabled | T/F | F | Enable performance profiling |
| custscript_alert_email | Email address | null | Recipient for critical alerts |
| custscript_enable_ui_debug | T/F | F | Show debug info in UI (admin only) |
| custscript_max_log_file_size | Number (KB) | 500 | Max debug file size |

### Debug Levels
- **OFF**: No logging (production default)
- **ERROR**: Only errors logged
- **INFO**: Errors + key operations
- **DEBUG**: INFO + detailed operation info
- **TRACE**: All operations including minor details

---

## Debug Configuration

### Initial Setup

1. **Create Debug Folder**
   ```
   Location: File Cabinet > SuiteScripts > Debug_Logs
   Permissions: Administrator, Accountant (Read/Write)
   ```

2. **Configure Script Parameters**
   - Navigate to: Customization > Scripting > Scripts
   - Find: Deferred Revenue Suitelet (Debug-Enhanced)
   - Edit Deployment
   - Set parameters according to environment:

   **Development:**
   ```
   DEBUG_LEVEL = DEBUG
   PERF_MONITOR_ENABLED = T
   ENABLE_UI_DEBUG = T
   ```

   **Production:**
   ```
   DEBUG_LEVEL = ERROR
   PERF_MONITOR_ENABLED = T
   ALERT_EMAIL = admin@company.com
   ```

3. **Set Up Email Alerts**
   - Add alert email in script parameters
   - Verify sender has email permission
   - Test with intentional error

### Enabling Debug Mode

**Temporary (Current Session):**
- Admin users can view debug info in UI when ENABLE_UI_DEBUG = T
- Session ID shown at bottom of report

**Persistent (All Sessions):**
- Change DEBUG_LEVEL parameter in deployment
- Increase to DEBUG or TRACE for detailed logging
- Remember to revert after troubleshooting

---

## Common Issues & Solutions

### Issue 1: "Unable to load saved search" Error

**Symptoms:**
- Report fails to load
- Error message: "Unable to load saved search. Please verify the search ID: 338219"

**Diagnosis:**
```javascript
// Check saved search exists
1. Navigate to: Lists > Search > Saved Searches
2. Search for ID: 338219
3. Verify search is not deleted or private
```

**Solutions:**

**Solution A: Search ID Changed**
```javascript
// Update script with new search ID
1. Find new search internal ID
2. Edit script line ~159:
   const SAVED_SEARCH_ID = 'NEW_ID_HERE';
3. Save and deploy
```

**Solution B: Missing Permissions**
```javascript
// Grant access to search
1. Edit saved search
2. Set Audience: Public
3. Or add specific roles
```

**Solution C: Search Corrupted**
```javascript
// Clone and recreate
1. Clone original search
2. Test new search manually
3. Update script with new ID
```

### Issue 2: Governance Limit Exceeded

**Symptoms:**
- Script stops mid-execution
- Error: "SSS_USAGE_LIMIT_EXCEEDED"
- Incomplete results displayed

**Diagnosis:**
```javascript
// Check debug logs for governance snapshots
1. Access latest debug file
2. Review governanceSnapshots array
3. Identify operation consuming most units
```

**Solutions:**

**Solution A: Optimize Search Filters**
```javascript
// Add more restrictive filters
1. Limit date range
2. Add event filter if possible
3. Use indexed fields (internalid, trandate)
```

**Solution B: Increase Governance Allocation**
```javascript
// Edit script deployment
1. Increase Max Concurrency
2. Or schedule during off-peak hours
3. Consider splitting into multiple reports
```

**Solution C: Reduce Page Size**
```javascript
// Modify script line ~414
const pagedData = savedSearch.runPaged({
    pageSize: 500  // Reduce from 1000
});
```

### Issue 3: Variance Calculation Incorrect

**Symptoms:**
- Variances don't match manual calculations
- Data validation issues in logs
- Large unexpected variances

**Diagnosis:**
```javascript
// Enable TRACE level logging
1. Set DEBUG_LEVEL = TRACE
2. Run report
3. Review debug file for:
   - "Data Validation Issue" entries
   - "Variance calculation mismatch" messages
```

**Solutions:**

**Solution A: JE Amount Parsing Issue**
```javascript
// Check for null/undefined values
1. Review logs for events with parsing errors
2. Verify JE search formula syntax
3. Check for currency conversion issues
```

**Solution B: Formula Column Mismatch**
```javascript
// Verify saved search columns match script expectations
Expected columns (in order):
1. line.cseg_hmp_event (GROUP)
2. 25010 amount (SUM)
3. 25020 amount (SUM)
4. Total (SUM)
5. Balance Per Schedule (SUM)
```

**Solution C: Rounding Differences**
```javascript
// Increase tolerance threshold
// Modify validator (line ~371):
validateVariance(variance, combinedTotal, balanceSchedule, 0.1) // Increase from 0.01
```

### Issue 4: Missing Events in Report

**Symptoms:**
- Expected events not showing
- JE-only events missing
- Event count lower than expected

**Diagnosis:**
```javascript
// Run data integrity check
1. Set DEBUG_LEVEL = DEBUG
2. Run report
3. Check debug file for:
   - "Data Integrity Check Complete" entry
   - jeOnlyEvents array
   - searchOnlyEvents array
```

**Solutions:**

**Solution A: Date Filter Too Restrictive**
```javascript
// Adjust as of date
1. Try expanding date range
2. Check trandate filter in saved search
3. Verify revenue date filter not excluding events
```

**Solution B: Event Segment Missing**
```javascript
// Check transaction line items
1. Verify cseg_hmp_event populated
2. Check for events without deferred accounts
3. Validate JE search formula
```

**Solution C: Search Filter Conflict**
```javascript
// Review combined filters
1. Export debug file
2. Check "Search Filter Validator" logs
3. Look for contradictory filters
```

### Issue 5: Performance Degradation

**Symptoms:**
- Report takes >30 seconds to load
- Timeouts during execution
- Users complaining of slowness

**Diagnosis:**
```javascript
// Review performance metrics
1. Set PERF_MONITOR_ENABLED = T
2. Run report
3. Check debug file for:
   - performanceMetrics array
   - Slow operation warnings (>10 seconds)
```

**Solutions:**

**Solution A: JE Search Too Broad**
```javascript
// Optimize JE search filters
1. Add date constraints
2. Use account internal IDs instead of LIKE
3. Limit to specific posting periods
```

**Solution B: Too Many Results**
```javascript
// Implement pagination
1. Add result limit parameter
2. Display results in chunks
3. Use client-side filtering for drill-down
```

**Solution C: Database Performance**
```javascript
// Contact NetSuite support
1. Provide session ID from debug log
2. Share performance metrics
3. Request query plan analysis
```

---

## Performance Troubleshooting

### Performance Monitoring Checklist

1. **Enable Performance Monitoring**
   ```javascript
   custscript_perf_monitor_enabled = T
   ```

2. **Run Baseline Test**
   - Use standard date range (30 days)
   - Record execution time
   - Note governance units used

3. **Identify Bottlenecks**
   ```javascript
   // Check debug file sections:
   - performanceMetrics.operations[]
   - governanceSnapshots[]
   - Look for duration > 10000ms
   ```

4. **Common Bottleneck Operations**
   | Operation | Typical Time | Governance | Optimization |
   |-----------|--------------|------------|--------------|
   | getJournalEntryAmounts | 5-15s | 100-300 | Narrow date range |
   | processSavedSearch | 10-30s | 200-500 | Reduce result set |
   | loadSavedSearch | 1-3s | 10-20 | Use internal ID |
   | Result Processing | 5-10s | 50-100 | Increase page size |

### Performance Optimization Steps

**Step 1: Optimize Searches**
```javascript
// Add these filters to reduce result set:
["trandate", "within", "lastmonth"]
["line.cseg_hmp_event", "noneof", "@NONE@"]
["account", "anyof", ["25010_ID", "25020_ID"]] // Use actual IDs
```

**Step 2: Reduce Data Processing**
```javascript
// Skip events with zero balance
if (Math.abs(combinedTotal) < 0.01 && Math.abs(balanceSchedule) < 0.01) {
    return true; // Skip this result
}
```

**Step 3: Optimize Sublist Population**
```javascript
// Only show events with variances
if (Math.abs(variance) > 0.01) {
    resultsList.setSublistValue(...);
    lineNum++;
}
```

**Step 4: Use Caching**
```javascript
// Cache search results (requires Map/Reduce refactor)
// Store results in custom record
// Refresh on schedule
```

### Performance Benchmarks

| Environment | Expected Time | Units Used | Max Results |
|-------------|---------------|------------|-------------|
| Development | 10-20s | 200-400 | 500 events |
| Sandbox | 15-30s | 300-600 | 1000 events |
| Production | 20-45s | 400-800 | 2000 events |

**Warning Thresholds:**
- Execution time > 60s = INVESTIGATE
- Governance > 900 units = OPTIMIZE
- Results > 3000 = IMPLEMENT PAGINATION

---

## Data Integrity Issues

### Running Data Integrity Checks

1. **Manual Check Process**
   ```
   1. Set DEBUG_LEVEL = DEBUG
   2. Run report with specific date range
   3. Access debug file
   4. Review "Data Integrity Check Complete" section
   ```

2. **Automated Check (Scheduled)**
   ```javascript
   // Create scheduled script that calls:
   validator.runDataIntegrityCheck(jeAmountsByEvent, searchResults)
   // Email results daily
   ```

### Common Data Issues

**Issue: Negative Deferred Revenue**
```javascript
// Expected: Deferred revenue should be negative (liability)
// Investigation:
1. Check negativeAmounts array in integrity report
2. Verify account setup (debit/credit balance)
3. Confirm transaction posting
```

**Issue: Large Variances (>$10k)**
```javascript
// Investigation steps:
1. Review largeVariances array
2. Drill down to event details
3. Compare JE amounts vs. scheduled amounts
4. Check for:
   - Missing journal entries
   - Duplicate postings
   - Timing differences
```

**Issue: JE-Only Events**
```javascript
// Events in JE search but not main search
// Causes:
1. Direct JE postings without event in main transaction
2. Event added after transaction posted
3. Search filter excludes certain transaction types

// Investigation:
1. Check jeOnlyEvents array
2. Review transactions manually
3. Validate event assignment
```

### Data Validation Rules

**Rule 1: Total Calculation**
```javascript
// je25010 + je25020 = jeTotal
// Tolerance: $0.01
// Action: Log warning if exceeded
```

**Rule 2: Variance Calculation**
```javascript
// (searchTotal + jeTotal) - balanceSchedule = variance
// Tolerance: $0.01
// Action: Log error if exceeded
```

**Rule 3: Account Balance**
```javascript
// Deferred revenue accounts should be credit balance (negative)
// Exception: Adjustments/reversals
// Action: Flag unusual patterns
```

---

## Health Check Procedures

### Automated Health Check

**Access URL:**
```
https://[account].app.netsuite.com/app/site/hosting/scriptlet.nl?script=[scriptid]&deploy=[deployid]&action=health
```

**Response Format:**
```json
{
  "timestamp": "2025-10-14T10:30:00Z",
  "status": "HEALTHY" | "DEGRADED" | "UNHEALTHY",
  "checks": {
    "governance": {
      "status": "PASS" | "WARN" | "FAIL",
      "value": 1000,
      "message": "Sufficient units"
    },
    "user": {
      "status": "PASS",
      "userId": 123,
      "role": 1
    },
    "searchAccess": {
      "status": "PASS",
      "message": "Search creation successful"
    }
  }
}
```

### Manual Health Check

**Daily Check (5 minutes):**
1. Access Suitelet URL
2. Verify report loads within 30 seconds
3. Check for error messages
4. Verify total counts reasonable
5. Sample check 3-5 variances

**Weekly Check (15 minutes):**
1. Review debug logs from past week
2. Check for error patterns
3. Verify performance metrics stable
4. Review governance usage trends
5. Test drill-down functionality

**Monthly Check (30 minutes):**
1. Full data integrity check
2. Compare month-over-month metrics
3. Review all critical errors
4. Update documentation
5. Optimize based on trends

### Health Status Definitions

**HEALTHY:**
- All checks pass
- Response time < 30s
- Governance > 100 units remaining
- No errors in past 24 hours

**DEGRADED:**
- Some warnings present
- Response time 30-60s
- Governance 50-100 units remaining
- Minor errors present (automatically recovered)

**UNHEALTHY:**
- Any check fails
- Response time > 60s or timeout
- Governance < 50 units remaining
- Critical errors present

---

## Log Analysis

### Accessing Debug Logs

**Method 1: Debug Files**
```
Location: File Cabinet > SuiteScripts > Debug_Logs
Format: deferred_revenue_debug_[SESSION_ID].json
Retention: 30 days (manual cleanup)
```

**Method 2: Execution Logs**
```
Location: Customization > Scripting > Script Execution Logs
Filter by: Script ID, Deployment, Date
Search: Session ID from report UI
```

**Method 3: System Information**
```
Location: Setup > Company > System Information
Check: Script Execution Logs link
```

### Log Structure

```json
{
  "sessionId": "DEBUG_1697284800000_abc123",
  "timestamp": "2025-10-14T10:30:00Z",
  "debugLevel": "DEBUG",
  "logs": [
    {
      "timestamp": "2025-10-14T10:30:01Z",
      "level": "INFO",
      "title": "Suitelet Request Started",
      "details": {...},
      "remainingUsage": 1000
    }
  ],
  "errors": [...],
  "performanceMetrics": [...],
  "dataValidationIssues": [...],
  "governanceSnapshots": [...]
}
```

### Log Analysis Queries

**Find All Errors:**
```javascript
// Search in debug file:
logs.filter(log => log.level === "ERROR")
errors.length
```

**Find Slow Operations:**
```javascript
// Search in performance metrics:
performanceMetrics.filter(op => op.duration > 10000)
```

**Find Data Issues:**
```javascript
// Search in validation issues:
dataValidationIssues.filter(issue => issue.category === "VARIANCE")
```

### Common Log Messages

| Log Title | Level | Meaning | Action |
|-----------|-------|---------|--------|
| Suitelet Request Started | INFO | Normal request initiated | None |
| Saved Search Loaded | DEBUG | Search found and loaded | None |
| Journal Entry Search Result Count | INFO | JE results retrieved | Verify count |
| Large Variance Detected | DEBUG | Variance > $1000 | Investigate event |
| Low Governance Warning | ERROR | <100 units remaining | Optimize script |
| Data Validation Issue | DEBUG | Data inconsistency found | Review details |
| Slow Operation Detected | ERROR | Operation >10s | Optimize operation |
| Health Check Failed | ERROR | System check failed | Review checks |

---

## Emergency Procedures

### Scenario 1: Script Failure in Production

**Immediate Actions (5 minutes):**
1. Check script execution logs for errors
2. Verify deployment is active
3. Test with admin user account
4. Check governance limits not exceeded

**Short-term Fix (15 minutes):**
1. If governance issue: Deploy with increased limits
2. If search issue: Revert to last working version
3. If data issue: Add temporary filters to reduce load
4. Notify users of workaround

**Long-term Fix (1-2 hours):**
1. Analyze debug logs from failure
2. Identify root cause
3. Implement fix in sandbox
4. Test thoroughly
5. Deploy to production during maintenance window

### Scenario 2: Incorrect Data Displayed

**Immediate Actions:**
1. Take screenshot of incorrect data
2. Note session ID and timestamp
3. Stop users from making decisions based on data
4. Run health check endpoint

**Investigation (30 minutes):**
1. Access debug file for that session
2. Review dataValidationIssues array
3. Compare with manual calculation
4. Check source transactions in NetSuite

**Resolution:**
1. If calculation error: Fix formula and redeploy
2. If source data error: Correct source transactions
3. If search filter error: Update filters
4. Communicate correction to affected users

### Scenario 3: Performance Degradation

**Immediate Actions:**
1. Check current governance usage
2. Review other scripts running concurrently
3. Check NetSuite system status page
4. Reduce date range if possible

**Temporary Workaround:**
1. Implement result limit
2. Schedule during off-peak hours
3. Export to CSV for offline analysis

**Permanent Fix:**
1. Optimize search filters
2. Implement caching
3. Consider Map/Reduce refactoring for large datasets
4. Add pagination

### Escalation Path

**Level 1: Developer (0-30 min)**
- Check logs
- Verify configuration
- Test in sandbox
- Apply quick fixes

**Level 2: Senior Developer (30-60 min)**
- Deep log analysis
- Complex debugging
- Architecture review
- Performance optimization

**Level 3: NetSuite Support (60+ min)**
- Platform issues
- Search performance
- Governance limits
- Database optimization

### Emergency Contacts

```
Developer: [Name] - [Email] - [Phone]
Senior Developer: [Name] - [Email] - [Phone]
NetSuite Admin: [Name] - [Email] - [Phone]
NetSuite Support: 1-877-638-7848
```

---

## Monitoring & Alerts

### Setting Up Email Alerts

**Configuration:**
```javascript
// In script deployment:
custscript_alert_email = "admin@company.com,finance@company.com"
```

**Alert Triggers:**
- Critical errors (ERROR level)
- Governance < 100 units
- Health check fails
- Large data issues (>10 records)

**Alert Format:**
```
Subject: [NetSuite Critical Error] [Error Title]
Body:
  Session ID: [SESSION_ID]
  Error: [ERROR_TITLE]
  Details: [ERROR_DETAILS]
  Timestamp: [TIMESTAMP]
```

### Monitoring Dashboard Setup

**Option 1: Saved Search Dashboard**
```
Create saved search on Script Execution Logs:
- Filter by Script ID
- Group by Status (Success/Error)
- Show last 7 days
- Add to dashboard
```

**Option 2: Custom Report**
```
Create custom record to store:
- Session ID
- Execution time
- Error count
- Governance used
- Timestamp

Populate from script
Create reports/dashboards
```

**Option 3: Third-Party Integration**
```
Export logs to:
- Splunk
- DataDog
- New Relic
- Custom monitoring solution
```

### Key Metrics to Monitor

**Performance Metrics:**
- Average execution time (target: <30s)
- 95th percentile execution time (target: <45s)
- Governance usage (target: <500 units)

**Reliability Metrics:**
- Success rate (target: >99%)
- Error rate (target: <1%)
- Health check status (target: HEALTHY)

**Data Quality Metrics:**
- Data validation issues (target: 0)
- Large variances count (target: <5%)
- Missing events (target: 0)

### Weekly Monitoring Routine

**Monday Morning (10 minutes):**
1. Check health check endpoint
2. Review errors from previous week
3. Check performance trends
4. Verify alert emails working

**Mid-Week Spot Check (5 minutes):**
1. Run report manually
2. Verify totals reasonable
3. Check execution logs

**Friday Summary (15 minutes):**
1. Generate weekly metrics
2. Review all debug files
3. Document any issues
4. Plan optimizations

---

## Appendix

### Debug File Cleanup Script

```javascript
/**
 * Scheduled script to clean up old debug files
 * Run weekly
 */
function cleanupDebugFiles() {
    const RETENTION_DAYS = 30;
    const DEBUG_FOLDER_ID = '12345'; // Your folder ID

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    const fileSearch = search.create({
        type: search.Type.FILE,
        filters: [
            ['folder', 'anyof', DEBUG_FOLDER_ID],
            'AND',
            ['created', 'onorbefore', cutoffDate]
        ],
        columns: ['name', 'created']
    });

    let deletedCount = 0;
    fileSearch.run().each(result => {
        try {
            file.delete({ id: result.id });
            deletedCount++;
        } catch (e) {
            log.error('Failed to delete file', { id: result.id, error: e.message });
        }
        return true;
    });

    log.audit('Debug File Cleanup Complete', { deletedCount: deletedCount });
}
```

### Quick Reference Commands

**View Current Session Debug Info:**
```javascript
// In browser console after loading report:
console.log('Session:', window.sessionId);
```

**Extract Session ID from URL:**
```javascript
// Look for custpage_info field in HTML
// Or check page source for "Session:"
```

**Force Debug Mode:**
```javascript
// Temporarily change deployment parameter
// Set DEBUG_LEVEL = TRACE
// Run report
// Revert parameter
```

### Useful NetSuite Searches

**Script Execution Log Search:**
```
Type: Script Execution Log
Filters:
  - Script = [Your Script]
  - Date = [Range]
  - Status = Error
Columns:
  - Date
  - Status
  - Title
  - Details
```

**Debug File Search:**
```
Type: File
Filters:
  - Folder = Debug_Logs
  - Type = Plain Text
  - Created = Last 7 days
Columns:
  - Name
  - Size
  - Created
  - Modified
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-14 | Initial debug-enhanced version | [Your Name] |

---

## Contact & Support

**Internal Support:**
- Email: netsuite-support@company.com
- Slack: #netsuite-support
- Documentation: [Wiki Link]

**NetSuite Support:**
- Portal: https://system.netsuite.com/app/login/secure/login.nl
- Phone: 1-877-638-7848
- Email: support@netsuite.com

---

*Last Updated: October 14, 2025*
