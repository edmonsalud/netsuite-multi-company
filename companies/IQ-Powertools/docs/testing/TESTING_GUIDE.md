# IQ Powertools Invoice Processor V2.0 - Testing Guide

## 🎯 Testing Objectives

This guide provides comprehensive test scenarios to validate the invoice processing system works correctly before production use.

**Testing Time Estimate**: 1-2 hours
**Prerequisite**: Complete DEPLOYMENT_GUIDE.md first

## 📋 Pre-Test Checklist

Before running tests, verify:

- [ ] All custom record types deployed
- [ ] Scripts uploaded and deployed
- [ ] API keys configured in deployment parameters
- [ ] Script deployment status set to "Testing"
- [ ] At least 10 active vendors in NetSuite
- [ ] Test email account configured to send to NetSuite
- [ ] You have sample PDF invoices ready (or use scenarios below)

## 🧪 Test Scenarios

### Test 1: Security Validation - Missing API Keys ✅

**Objective**: Verify script fails gracefully without API keys

**Steps**:
1. Edit script deployment
2. **Clear** the OpenAI API Key parameter (leave blank)
3. Send test invoice email
4. Check script execution log

**Expected Result**:
- ❌ Script execution shows error: "MISSING_API_KEYS"
- Error message: "API keys not configured. Please set..."
- No vendor bill created
- No crash or unhandled exception

**How to Fix After Test**:
- Re-enter API keys in deployment parameters
- Confirm keys are valid

---

### Test 2: High Confidence Match - Perfect Vendor Name ✅

**Objective**: Verify exact vendor match creates bill automatically

**Prerequisites**:
- Have a vendor in NetSuite called exactly "Acme Corporation"

**Steps**:
1. Create/obtain PDF invoice with vendor name "Acme Corporation"
2. Invoice should have clear amount, date, PO number
3. Send email with subject: "IQ - Powertools: Vendor Invoice"
4. Attach PDF invoice
5. Wait 30-60 seconds
6. Check script execution log

**Expected Result**:
- ✅ Log shows "Vendor Match Result" with confidence ≥0.90
- ✅ Method: "exact_match" or "normalized_exact_match"
- ✅ "Vendor Bill Created" log entry with bill ID
- ✅ Vendor bill exists in NetSuite (Pending Approval status)
- ✅ PDF attached to vendor bill
- ✅ Memo contains source filename and match method
- ✅ Processing time <30 seconds
- ✅ Governance usage <500 units

**How to Verify**:
```
Go to: Transactions > Purchases > Enter Bills
Filter: Status = Pending Approval
Should see: New bill for Acme Corporation
```

---

### Test 3: Fuzzy Match - Vendor Name Variation ✅

**Objective**: Verify programmatic matching handles name variations

**Prerequisites**:
- Vendor in NetSuite: "ABC Company LLC"

**Test Invoice Variations** (test each):
- "ABC Company, LLC" (punctuation difference)
- "ABC Company Inc" (suffix difference)
- "ABC Company" (missing suffix)
- "A.B.C. Company" (periods added)

**Steps**:
1. Create/modify PDF invoice with ONE of the variations above
2. Send invoice email
3. Check execution log

**Expected Result**:
- ✅ Confidence: 0.85-0.95 (high, but not perfect)
- ✅ Method: "fuzzy_match"
- ✅ Matched to correct vendor: "ABC Company LLC"
- ✅ Vendor bill created
- ✅ Vendor alias record created for future lookups

**Verify Alias Created**:
```
Go to: Customization > Lists, Records, & Fields > IQ Vendor Alias
Should see: New alias mapping invoice name to vendor
```

---

### Test 4: Vendor Alias Cache Hit ✅

**Objective**: Verify alias cache improves performance on repeat invoices

**Prerequisites**:
- Complete Test 3 first (creates alias)

**Steps**:
1. Send ANOTHER invoice from same vendor with SAME name variation
2. Check execution log
3. Compare processing time to Test 3

**Expected Result**:
- ✅ Method: "alias_cache_hit"
- ✅ Confidence: 1.0 (perfect, from cache)
- ✅ Processing time <10 seconds (faster than first time)
- ✅ Alias usage count incremented
- ✅ Vendor bill created

---

### Test 5: Medium Confidence - Requires Review Flag ✅

**Objective**: Verify medium-confidence invoices are flagged for review

**Prerequisites**:
- Lower high threshold temporarily to 0.95 (so 0.70-0.94 = medium)

**Steps**:
1. Create PDF invoice with slightly ambiguous vendor name (e.g., "ABC Services" when you have "ABC Company" and "ABC Services Inc")
2. Send invoice email
3. Check execution log and notifications

**Expected Result**:
- ✅ Confidence: 0.70-0.89 (medium range)
- ✅ Vendor bill created
- ✅ Bill memo contains "REVIEW REQUIRED - Confidence: XX%"
- ✅ Email notification sent to AP team
- ✅ Notification subject: "IQ Invoice Requires Review"

**Verify Notification Sent**:
```
Check email inbox for configured recipients
Should see: Alert email with bill details
```

---

### Test 6: Low Confidence - Manual Review Queue ✅

**Objective**: Verify low-confidence invoices go to manual review

**Prerequisites**:
- Vendor on invoice does NOT exist in NetSuite (or very different name)

**Steps**:
1. Create PDF invoice from vendor "XYZ Completely Unknown Vendor LLC"
2. Ensure this vendor does NOT exist in your NetSuite
3. Send invoice email
4. Check execution log

**Expected Result**:
- ❌ Confidence: <0.70 (low)
- ❌ NO vendor bill created
- ✅ Manual review record created
- ✅ Email notification sent
- ✅ Notification subject: "IQ Invoice Requires Manual Review"

**Verify Manual Review Record**:
```
Go to: Customization > Lists, Records, & Fields > IQ Invoice Review
Should see: New record with:
  - Status: Pending
  - Vendor (Raw): "XYZ Completely Unknown Vendor LLC"
  - Extracted Data: JSON with amount, date, etc.
  - Top Match Candidates: JSON array (may be empty)
  - Confidence Score: <0.70
```

**AP Team Action**:
1. Open manual review record
2. Review extracted data
3. Determine correct vendor (or create new vendor)
4. Create vendor bill manually
5. Optionally: Create vendor alias for future

---

### Test 7: Data Validation - Invalid Amount ✅

**Objective**: Verify validation catches bad data

**Test Cases**:

**7A: Amount = $0 or negative**
- Create invoice with $0.00 amount
- Expected: Validation error, manual review queue

**7B: Amount exceeds threshold**
- Create invoice with $5,000,000 (above $1M default threshold)
- Expected: Validation warning, manual review queue

**7C: Invalid date**
- Create invoice with date "13/32/2025" (impossible date)
- Expected: Validation error, manual review queue

**Steps**:
1. Create/modify PDF with invalid data
2. Send invoice email
3. Check execution log

**Expected Result**:
- ❌ "Validation Failed" log entry
- ❌ Error details in log
- ✅ Manual review record created
- ✅ Email notification sent

---

### Test 8: Duplicate Detection ✅

**Objective**: Verify duplicate bills are detected

**Prerequisites**:
- Enable duplicate detection in deployment parameters
- Have existing vendor bill in system (from previous test)

**Steps**:
1. Send THE SAME PDF invoice again (same vendor, amount, date)
2. Check execution log
3. Check if duplicate warning appears

**Expected Result**:
- ⚠️ Log shows "Possible Duplicate Detected"
- ⚠️ References existing bill ID
- ✅ Bill still created (with duplicate warning in memo)
- ✅ AP team can decide if legitimate or duplicate

**Note**: System creates bill anyway to avoid false negatives (e.g., recurring monthly charges)

---

### Test 9: Vendor Cache Performance ✅

**Objective**: Verify caching reduces governance usage

**Steps**:
1. Send invoice (triggers cache build if needed)
2. Note governance units used in execution log
3. Send another invoice immediately after
4. Compare governance usage

**Expected Results**:

**First Execution** (cache rebuild):
- Governance: 500-1000 units
- Log: "Rebuilding Vendor Cache"
- Cache record created

**Second Execution** (cache hit):
- Governance: 50-200 units (much less!)
- Log: "Vendor Cache Hit" with age in hours
- Uses existing cache

**Verify Cache Record**:
```
Go to: Customization > Lists, Records, & Fields > IQ Vendor Cache
Should see: 1 record with:
  - Name: "Vendor Cache [timestamp]"
  - Last Updated: Recent timestamp
  - Vendor Count: Total # of active vendors
  - Cache Data: JSON string (long text field)
```

---

### Test 10: AI-Assisted Matching ✅

**Objective**: Verify ChatGPT is called for ambiguous cases

**Prerequisites**:
- Enable AI-assisted matching in deployment parameters
- Have 2-3 similar vendor names (e.g., "Smith Consulting" and "Smith & Associates" and "Smith Services")

**Steps**:
1. Create invoice with ambiguous name "Smith Co."
2. Send invoice email
3. Check execution log for AI call

**Expected Result**:
- ✅ Method: "ai_assisted_match"
- ✅ Log shows "Attempting AI-assisted matching"
- ✅ Log shows top candidates list
- ✅ ChatGPT selects best match
- ✅ Confidence from AI decision
- ✅ Vendor bill created with selected vendor

---

### Test 11: API Retry Logic ✅

**Objective**: Verify retry logic handles transient failures

**Steps** (Advanced - simulate API failure):
1. Temporarily set INVALID OpenAI API key (add extra characters)
2. Send invoice email
3. Check execution log

**Expected Result**:
- ⚠️ Log shows "API Retry" entries
- ⚠️ Attempt 1, 2, 3 with backoff times
- ❌ "API_RETRY_EXHAUSTED" after 3 attempts
- ✅ Graceful failure (no crash)
- ✅ Manual review record created
- ✅ Error notification sent

**Cleanup**:
- Restore correct API key
- Re-test with valid key

---

### Test 12: Multiple Invoices in One Email ✅

**Objective**: Verify batch processing works correctly

**Steps**:
1. Send ONE email with 3-5 PDF attachments (different invoices)
2. Wait for processing
3. Check execution log

**Expected Result**:
- ✅ "Attachments Found" log shows correct count
- ✅ Each PDF processed individually
- ✅ Multiple "Processing PDF" entries
- ✅ "PROCESSING COMPLETE" summary shows:
  - Total files
  - Processed files
  - High/Medium/Low confidence counts
- ✅ All applicable vendor bills created
- ✅ Total governance <2000 units

---

### Test 13: Non-PDF Attachment (Negative Test) ✅

**Objective**: Verify script ignores non-PDF files

**Steps**:
1. Send email with:
   - 1 PDF invoice (should process)
   - 1 .docx file (should ignore)
   - 1 .jpg image (should ignore)
2. Check execution log

**Expected Result**:
- ✅ Only PDF file processed
- ✅ No errors for .docx or .jpg
- ✅ "Processing PDF" log entry for PDF only
- ✅ Vendor bill created for PDF invoice

---

### Test 14: Wrong Email Subject (Negative Test) ✅

**Objective**: Verify script only processes correct subject lines

**Steps**:
1. Send email with subject: "Test Invoice" (wrong subject)
2. Attach valid PDF invoice
3. Check script execution log

**Expected Result**:
- ✅ Script executes but exits early
- ✅ Log: No "Processing Started" entry
- ❌ No vendor bill created
- ✅ No errors logged

---

### Test 15: End-to-End Performance Test ✅

**Objective**: Validate complete workflow under realistic conditions

**Scenario**: Typical daily invoice batch

**Steps**:
1. Send email with 5 PDF invoices:
   - Invoice 1: Perfect vendor match (high confidence)
   - Invoice 2: Fuzzy vendor match (high confidence)
   - Invoice 3: Medium confidence (review flag)
   - Invoice 4: Low confidence (manual review)
   - Invoice 5: Duplicate of Invoice 1
2. Wait for processing
3. Review all results

**Expected Results**:
- ✅ Processing time: <2 minutes total
- ✅ Governance usage: <1500 units
- ✅ 3 vendor bills created (Invoices 1, 2, 3)
- ✅ 1 manual review record (Invoice 4)
- ✅ 1 duplicate warning (Invoice 5)
- ✅ 1 email notification (for medium + low confidence)
- ✅ Vendor alias created for Invoice 2
- ✅ Cache hit on subsequent invoices

---

## 📊 Test Results Template

Use this template to track your test results:

| Test # | Test Name | Pass/Fail | Notes | Governance Used | Processing Time |
|--------|-----------|-----------|-------|-----------------|-----------------|
| 1 | Security Validation | ⬜ | | N/A | N/A |
| 2 | High Confidence Match | ⬜ | | | |
| 3 | Fuzzy Match | ⬜ | | | |
| 4 | Vendor Alias Cache | ⬜ | | | |
| 5 | Medium Confidence | ⬜ | | | |
| 6 | Low Confidence | ⬜ | | | |
| 7 | Data Validation | ⬜ | | | |
| 8 | Duplicate Detection | ⬜ | | | |
| 9 | Vendor Cache | ⬜ | | | |
| 10 | AI-Assisted Matching | ⬜ | | | |
| 11 | API Retry Logic | ⬜ | | | |
| 12 | Multiple Invoices | ⬜ | | | |
| 13 | Non-PDF Attachment | ⬜ | | | |
| 14 | Wrong Subject | ⬜ | | | |
| 15 | End-to-End Performance | ⬜ | | | |

**Legend**: ⬜ Not Tested | ✅ Pass | ❌ Fail | ⚠️ Partial

---

## 🔍 How to Check Test Results

### View Script Execution Logs
```
Navigation: System > Scripting > Script Execution Log
Filter: Script = "IQ Invoice Email Processor V2"
Sort: Date (newest first)
```

**Look for**:
- Type = DEBUG/AUDIT for normal flow
- Type = ERROR for failures
- Status = Complete vs Failed

### Check Created Vendor Bills
```
Navigation: Transactions > Purchases > Enter Bills
Filter: Status = Pending Approval, Date = Today
```

### Check Manual Review Queue
```
Navigation: Customization > Lists, Records, & Fields > IQ Invoice Review
Filter: Status = Pending
```

### Check Vendor Aliases
```
Navigation: Customization > Lists, Records, & Fields > IQ Vendor Alias
Sort: Date Created (newest first)
```

### Check Vendor Cache
```
Navigation: Customization > Lists, Records, & Fields > IQ Vendor Cache
Should see: 1 active record
```

---

## 🐛 Troubleshooting Test Failures

### Test Failed: No Vendor Bill Created (Test 2)

**Possible Causes**:
1. API keys not configured → Check deployment parameters
2. Vendor doesn't exist → Create test vendor first
3. PDF extraction failed → Check ConvertAPI is working
4. Confidence too low → Check fuzzy match results in log

**Debug Steps**:
1. Check "Data Extracted" log entry - is data there?
2. Check "Vendor Match Result" - what's the confidence?
3. Check "Vendor Bill Creation Error" - any error message?

### Test Failed: Cache Not Working (Test 9)

**Possible Causes**:
1. Custom record not deployed → Check custom record types
2. Permissions missing → Grant Full access to IQ Vendor Cache
3. Cache record not being created → Check for save errors in log

**Debug Steps**:
1. Manually create cache record to test permissions
2. Check script log for "Error saving vendor cache"
3. Verify cache TTL parameter is set correctly

### Test Failed: Fuzzy Matching Poor (Test 3)

**Possible Causes**:
1. Vendor names too different → May need AI-assisted matching
2. Thresholds too high → Lower medium threshold to 0.60
3. Fuzzy matching library not loaded → Check file upload

**Debug Steps**:
1. Check log for "Fuzzy Match Result" with breakdown scores
2. Check if `iq_fuzzy_matching_lib.js` exists in File Cabinet
3. Test with vendor names that are more similar

---

## ✅ Success Criteria

Your testing is successful when:

- [ ] All 15 tests pass (or documented failures have workarounds)
- [ ] Vendor matching accuracy ≥90% on your test invoices
- [ ] Processing time <30 seconds per invoice
- [ ] Governance usage <500 units per invoice (with cache)
- [ ] No unhandled exceptions or script crashes
- [ ] Notifications working for medium/low confidence
- [ ] Manual review queue functional
- [ ] Vendor alias learning working
- [ ] Cache performance improvement verified
- [ ] Duplicate detection working

---

## 📈 Next Steps After Testing

### If All Tests Pass:
1. ✅ Change deployment status from "Testing" to "Released"
2. ✅ Update confidence thresholds based on observed accuracy
3. ✅ Train AP team on manual review workflow
4. ✅ Monitor first week of production usage
5. ✅ Collect vendor aliases for common mismatches

### If Some Tests Fail:
1. Review troubleshooting section
2. Check DEPLOYMENT_GUIDE.md for setup issues
3. Review script execution logs for detailed errors
4. Adjust configuration parameters as needed
5. Re-test failed scenarios

### Optimization After 1 Week:
- Review vendor match accuracy metrics
- Adjust confidence thresholds if needed
- Add vendor aliases for frequent mismatches
- Fine-tune cache TTL if vendor list changes frequently
- Monitor API costs and optimize if needed

---

## 📞 Support Resources

- **Deployment Guide**: DEPLOYMENT_GUIDE.md
- **Architecture Document**: See .claude/agents/claude-architect.md output
- **NetSuite Documentation**: Search for "User Event Scripts" in Help Center
- **Script Execution Logs**: System > Scripting > Script Execution Log

---

**Testing Version**: 2.0
**Last Updated**: 2025-01-15
**Estimated Testing Time**: 1-2 hours
**Complexity**: Moderate

Good luck with testing! 🚀
