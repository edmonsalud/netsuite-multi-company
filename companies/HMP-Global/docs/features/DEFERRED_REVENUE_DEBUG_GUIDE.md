# Debug-Enhanced Deferred Revenue Suitelet - Configuration Guide

## Overview
This guide provides step-by-step instructions for configuring and deploying the debug-enhanced version of the Deferred Revenue Suitelet with comprehensive diagnostic capabilities.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [File Setup](#file-setup)
3. [Script Deployment](#script-deployment)
4. [Parameter Configuration](#parameter-configuration)
5. [Testing & Validation](#testing--validation)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Permissions
- Administrator or Developer role
- File Cabinet access (SuiteScripts folder)
- Script deployment permissions
- Email sending permissions (for alerts)

### NetSuite Features
- SuiteScript 2.1 support
- Custom segments enabled (if using event segments)
- Advanced searching enabled

---

## File Setup

### Step 1: Create Debug Folder

1. Navigate to: **Documents > Files > File Cabinet**
2. Navigate to: **SuiteScripts** folder
3. Click **Add Folder**
4. Configure folder:
   ```
   Name: Debug_Logs
   Parent: SuiteScripts
   ```
5. Click **Save**
6. Note the **Internal ID** (you'll need this later)

**To find the Internal ID:**
- After saving, open the folder
- Check the URL: `...folder=XXXXX`
- Copy the number (e.g., 229740)

### Step 2: Upload Script File

1. Navigate to: **Documents > Files > File Cabinet > SuiteScripts**
2. Click **Add File**
3. Upload: `ndc_deferred_revenue_suitelet_with_je_debug.js`
4. Configure:
   ```
   Name: ndc_deferred_revenue_suitelet_with_je_debug.js
   Folder: SuiteScripts
   Available Without Login: Unchecked
   ```
5. Click **Save**

---

## Script Deployment

### Step 1: Create Script Record

1. Navigate to: **Customization > Scripting > Scripts > New**
2. Select file: **ndc_deferred_revenue_suitelet_with_je_debug.js**
3. Click **Create Script Record**

### Step 2: Configure Script Settings

#### Basic Information
```
Name: Deferred Revenue Report (Debug-Enhanced)
ID: customscript_def_rev_debug
Description: Debug-enhanced deferred revenue report with comprehensive diagnostics
```

#### Script Parameters

Create the following script parameters:

**1. DEBUG_LEVEL**
```
ID: custscript_debug_level
Type: List/Record
Label: Debug Level
Description: Controls logging verbosity
List Values:
  - OFF (Production default)
  - ERROR (Errors only)
  - INFO (Key operations)
  - DEBUG (Detailed info)
  - TRACE (All operations)
Default Value: INFO
```

**2. DEBUG_FOLDER_ID**
```
ID: custscript_debug_folder_id
Type: Integer
Label: Debug Folder ID
Description: NetSuite folder ID for debug log files
Default Value: [Your Debug_Logs folder ID]
```

**3. PERF_MONITOR_ENABLED**
```
ID: custscript_perf_monitor_enabled
Type: Checkbox
Label: Performance Monitoring Enabled
Description: Enable performance profiling and metrics
Default Value: Unchecked (for production)
```

**4. ALERT_EMAIL**
```
ID: custscript_alert_email
Type: Email Address
Label: Alert Email
Description: Email address for critical error alerts (comma-separated for multiple)
Default Value: [Leave blank or set admin email]
```

**5. ENABLE_UI_DEBUG**
```
ID: custscript_enable_ui_debug
Type: Checkbox
Label: Enable UI Debug
Description: Show debug information in UI (Admin only)
Default Value: Unchecked
```

**6. MAX_LOG_FILE_SIZE**
```
ID: custscript_max_log_file_size
Type: Integer
Label: Max Log File Size (KB)
Description: Maximum size for debug log files
Default Value: 500
```

**7. SAVED_SEARCH_ID** (if not hardcoded)
```
ID: custscript_def_rev_saved_search
Type: Free-Form Text
Label: Saved Search ID
Description: Internal ID of the saved search for deferred revenue
Default Value: 338219
```

**8. DEBUG_FOLDER_PARAM**
```
ID: custscript_def_rev_debug_folder
Type: Integer
Label: Debug Log Folder ID
Description: Folder ID for debug logs
Default Value: [Your folder ID]
```

**9. ACCOUNT_25010**
```
ID: custscript_def_rev_account_25010
Type: Free-Form Text
Label: Account 25010 Number
Description: Account number for 25010 deferred revenue
Default Value: 25010
```

**10. ACCOUNT_25020**
```
ID: custscript_def_rev_account_25020
Type: Free-Form Text
Label: Account 25020 Number
Description: Account number for 25020 deferred revenue
Default Value: 25020
```

### Step 3: Create Deployment

1. Click **Deployments** subtab
2. Click **New Deployment**

#### Deployment Configuration

**Basic Settings:**
```
Title: Deferred Revenue Report (Debug) - Production
ID: customdeploy_def_rev_debug_prod
Status: Released (or Testing initially)
Log Level: DEBUG
```

**Audience:**
```
Roles: Administrator, Accountant, Custom Role (as needed)
Employees: All (or specific users)
```

**Script Parameters** (for Production):
```
DEBUG_LEVEL: ERROR (or INFO)
DEBUG_FOLDER_ID: [Your folder ID]
PERF_MONITOR_ENABLED: Checked
ALERT_EMAIL: admin@yourcompany.com
ENABLE_UI_DEBUG: Unchecked
MAX_LOG_FILE_SIZE: 500
```

**Script Parameters** (for Development/Testing):
```
DEBUG_LEVEL: DEBUG (or TRACE)
DEBUG_FOLDER_ID: [Your folder ID]
PERF_MONITOR_ENABLED: Checked
ALERT_EMAIL: developer@yourcompany.com
ENABLE_UI_DEBUG: Checked
MAX_LOG_FILE_SIZE: 1000
```

**Governance:**
```
Max Concurrency: 1 (or higher if needed)
```

3. Click **Save**

### Step 4: Note Script and Deployment IDs

After saving, note these IDs:
```
Script ID: customscript_def_rev_debug
Deployment ID: customdeploy_def_rev_debug_prod
```

You'll use these to access the Suitelet.

---

## Parameter Configuration

### Environment-Specific Configurations

#### Development Environment
```
DEBUG_LEVEL = DEBUG or TRACE
PERF_MONITOR_ENABLED = T
ENABLE_UI_DEBUG = T
ALERT_EMAIL = dev-team@company.com
MAX_LOG_FILE_SIZE = 1000
```

**Use Case:** Detailed debugging, performance analysis, UI inspection

#### Testing/Sandbox Environment
```
DEBUG_LEVEL = INFO
PERF_MONITOR_ENABLED = T
ENABLE_UI_DEBUG = T
ALERT_EMAIL = qa-team@company.com
MAX_LOG_FILE_SIZE = 750
```

**Use Case:** User acceptance testing, performance validation

#### Production Environment
```
DEBUG_LEVEL = ERROR
PERF_MONITOR_ENABLED = T
ENABLE_UI_DEBUG = F
ALERT_EMAIL = admin@company.com,finance@company.com
MAX_LOG_FILE_SIZE = 500
```

**Use Case:** Live environment, error monitoring only

### Dynamic Configuration Changes

To change debug level without redeployment:

1. Navigate to: **Customization > Scripting > Scripts**
2. Find: **Deferred Revenue Report (Debug-Enhanced)**
3. Click **Deployments** subtab
4. Click deployment name
5. Change **DEBUG_LEVEL** parameter
6. Click **Save**
7. Changes take effect immediately

---

## Testing & Validation

### Initial Testing Checklist

#### 1. Access Test
```
URL Format:
https://[ACCOUNT_ID].app.netsuite.com/app/site/hosting/scriptlet.nl?script=customscript_def_rev_debug&deploy=customdeploy_def_rev_debug_prod

Expected: Report loads successfully
```

#### 2. Health Check Test
```
URL:
[Base URL]&action=health

Expected Response:
{
  "timestamp": "2025-10-14T10:30:00Z",
  "status": "HEALTHY",
  "checks": { ... }
}
```

#### 3. Debug Info Test (Admin Only)
```
URL:
[Base URL]&action=debug

Expected: JSON with session info, metrics
```

#### 4. Debug File Creation Test
```
1. Run report with DEBUG_LEVEL = DEBUG
2. Navigate to File Cabinet > SuiteScripts > Debug_Logs
3. Verify new JSON file created
4. Download and validate JSON structure
```

#### 5. Performance Monitoring Test
```
1. Enable PERF_MONITOR_ENABLED
2. Run report
3. Check debug file for performanceMetrics array
4. Verify operation timings logged
```

#### 6. Error Alert Test
```
1. Set ALERT_EMAIL to test email
2. Temporarily break search ID (invalid value)
3. Run report
4. Verify error email received
5. Restore correct search ID
```

#### 7. UI Debug Test (Admin)
```
1. Enable ENABLE_UI_DEBUG
2. Login as Administrator
3. Run report
4. Verify debug info displayed at bottom
5. Check Session ID, governance, performance metrics
```

### Validation Scripts

**Check Debug Folder Permissions:**
```javascript
// Execute in NetSuite console
require(['N/search'], function(search) {
    var folderSearch = search.create({
        type: 'folder',
        filters: [['internalid', 'is', 'YOUR_FOLDER_ID']],
        columns: ['name', 'owner']
    });
    folderSearch.run().each(function(result) {
        console.log('Folder:', result.getValue('name'));
        console.log('Owner:', result.getText('owner'));
        return false;
    });
});
```

**Test Email Configuration:**
```javascript
// Execute as admin
require(['N/email', 'N/runtime'], function(email, runtime) {
    email.send({
        author: runtime.getCurrentUser().id,
        recipients: 'YOUR_ALERT_EMAIL',
        subject: 'Test Alert - Debug Suitelet',
        body: 'This is a test email from the debug configuration.'
    });
    console.log('Test email sent');
});
```

---

## Monitoring Setup

### Daily Monitoring Tasks

#### 1. Check Execution Logs
```
Location: Setup > Management > System Information > View Execution Logs
Filter:
  - Script = Deferred Revenue Report (Debug-Enhanced)
  - Date = Today
  - Status = All

Review for errors and warnings
```

#### 2. Review Debug Files
```
Location: File Cabinet > SuiteScripts > Debug_Logs
Action:
  - Check latest files
  - Review error counts
  - Monitor file sizes
```

#### 3. Verify Health Status
```
Action: Access health check endpoint
Frequency: Once daily
Alert: If status != HEALTHY
```

### Weekly Monitoring Tasks

#### 1. Performance Review
```
1. Collect all debug files from past week
2. Extract performanceMetrics from each
3. Calculate averages:
   - Average execution time
   - Average governance used
   - Slowest operations
4. Compare to benchmarks
5. Identify trends
```

#### 2. Error Analysis
```
1. Query execution logs for errors
2. Group by error type
3. Identify patterns
4. Document solutions
5. Update runbook
```

#### 3. Data Quality Check
```
1. Review dataValidationIssues from debug files
2. Check for:
   - Variance calculation errors
   - JE amount inconsistencies
   - Missing events
3. Investigate and resolve
```

### Automated Monitoring Script

Create a scheduled script to monitor health:

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/https', 'N/email', 'N/runtime'], (https, email, runtime) => {

    function execute(context) {
        const SUITELET_URL = 'https://YOUR_ACCOUNT.app.netsuite.com/app/site/hosting/scriptlet.nl?script=customscript_def_rev_debug&deploy=customdeploy_def_rev_debug_prod&action=health';

        try {
            const response = https.get({ url: SUITELET_URL });
            const healthData = JSON.parse(response.body);

            if (healthData.status !== 'HEALTHY') {
                // Send alert
                email.send({
                    author: runtime.getCurrentUser().id,
                    recipients: 'admin@company.com',
                    subject: '[ALERT] Deferred Revenue Suitelet Health Check Failed',
                    body: 'Health Status: ' + healthData.status + '\n\n' +
                          'Details:\n' + JSON.stringify(healthData.checks, null, 2)
                });
            }

            log.audit('Health Check Complete', healthData);

        } catch (e) {
            log.error('Health Check Failed', e);

            // Send alert
            email.send({
                author: runtime.getCurrentUser().id,
                recipients: 'admin@company.com',
                subject: '[CRITICAL] Deferred Revenue Suitelet Health Check Error',
                body: 'Error: ' + e.message + '\n\nStack: ' + e.stack
            });
        }
    }

    return { execute };
});
```

Schedule this to run daily at a specific time.

---

## Troubleshooting

### Issue: Script Not Loading

**Symptoms:**
- 404 error
- "Script not found"

**Solutions:**
1. Verify script ID and deployment ID in URL
2. Check deployment status (must be "Released")
3. Verify user has role access
4. Check script hasn't been deleted

### Issue: Parameters Not Working

**Symptoms:**
- Debug files not created
- Email alerts not sent
- Wrong debug level

**Solutions:**
1. Verify parameter IDs match script code
2. Check parameter values in deployment
3. Ensure parameters are not marked "Hidden"
4. Test with default values first

### Issue: Debug Files Not Created

**Symptoms:**
- No files in Debug_Logs folder
- Error: "Failed to Create Debug File"

**Solutions:**
1. Verify folder ID is correct
2. Check folder permissions
3. Ensure folder exists and is not deleted
4. Try creating file manually in folder (permission test)
5. Check file cabinet storage quota

**Permission Check:**
```
1. Navigate to Debug_Logs folder
2. Click Edit
3. Check "Available Without Login" is unchecked
4. Verify no restrictive permissions
5. Save if changes made
```

### Issue: Email Alerts Not Sending

**Symptoms:**
- No emails received on errors
- "Email send failed" in logs

**Solutions:**
1. Verify email address format correct
2. Check sender has email permissions
3. Verify company email setup
4. Test with simple email first
5. Check spam/junk folders

### Issue: High Governance Usage

**Symptoms:**
- "Usage limit exceeded" errors
- Script stopping mid-execution

**Solutions:**
1. Reduce DEBUG_LEVEL to ERROR
2. Disable PERF_MONITOR_ENABLED
3. Optimize search filters
4. Increase page size in searches
5. Consider scheduled script instead of real-time

### Issue: Large Debug Files

**Symptoms:**
- Debug files > MAX_LOG_FILE_SIZE
- Storage quota warnings

**Solutions:**
1. Reduce DEBUG_LEVEL
2. Lower MAX_LOG_FILE_SIZE parameter
3. Implement file rotation script
4. Archive old debug files
5. Reduce date ranges in reports

---

## Best Practices

### Development
- Always use DEBUG or TRACE level
- Enable all monitoring features
- Enable UI debug for quick feedback
- Test with small date ranges first
- Review debug files after each test

### Testing
- Use INFO level for most tests
- Enable performance monitoring
- Test with production-like data volumes
- Validate all error scenarios
- Document findings in debug files

### Production
- Use ERROR level by default
- Enable performance monitoring
- Disable UI debug (security)
- Set up alert emails
- Monitor daily

### Security
- Restrict debug folder access
- Limit UI debug to administrators
- Secure alert email addresses
- Review debug files for sensitive data
- Set appropriate log retention

### Performance
- Monitor governance usage trends
- Optimize slow operations
- Review performance metrics weekly
- Adjust search page sizes as needed
- Consider off-peak scheduling for large reports

---

## Appendix

### Quick Reference URLs

**Report Access:**
```
https://[ACCOUNT].app.netsuite.com/app/site/hosting/scriptlet.nl?script=customscript_def_rev_debug&deploy=customdeploy_def_rev_debug_prod
```

**Health Check:**
```
[BASE_URL]&action=health
```

**Debug Info (Admin):**
```
[BASE_URL]&action=debug
```

### Parameter ID Reference

| Parameter | Internal ID | Type | Default |
|-----------|-------------|------|---------|
| Debug Level | custscript_debug_level | List | INFO |
| Debug Folder | custscript_debug_folder_id | Integer | - |
| Performance Monitor | custscript_perf_monitor_enabled | Checkbox | F |
| Alert Email | custscript_alert_email | Email | - |
| UI Debug | custscript_enable_ui_debug | Checkbox | F |
| Max File Size | custscript_max_log_file_size | Integer | 500 |

### Support Resources

**Internal Documentation:**
- Troubleshooting Runbook: `DEFERRED_REVENUE_TROUBLESHOOTING_RUNBOOK.md`
- Original Script Documentation: [Link]

**NetSuite Resources:**
- SuiteScript 2.1 Documentation: https://system.netsuite.com/app/help/helpcenter.nl
- SuiteAnswers: https://netsuite.custhelp.com/
- SuiteScript Debugger: [NetSuite Help Center]

**Contact Information:**
- Development Team: dev-team@company.com
- NetSuite Admin: netsuite-admin@company.com
- NetSuite Support: 1-877-638-7848

---

*Last Updated: October 14, 2025*
*Version: 1.0*
