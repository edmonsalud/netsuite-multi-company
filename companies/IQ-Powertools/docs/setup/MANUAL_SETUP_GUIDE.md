# IQ Powertools Invoice Processor V2.0 - Manual Setup Guide

## ✅ Scripts Uploaded Successfully!

The following files are now in your NetSuite File Cabinet:
- ✅ `/SuiteScripts/invoice_email_plug_in_v2.js` (Main script)
- ✅ `/SuiteScripts/iq_fuzzy_matching_lib.js` (Fuzzy matching library)

## 📝 Next Steps: Create Custom Records Manually

Since the XML has validation complexities, it's faster to create the custom records directly in NetSuite UI.

---

## Step 1: Create Custom Record Type - IQ Vendor Cache

1. Navigate to: **Customization > Lists, Records, & Fields > Record Types > New**

2. **Basic Information**:
   - Record Type Label: `IQ Vendor Cache`
   - Record Type ID: `customrecord_iq_vendor_cache`
   - Description: `Cache for vendor list to optimize governance usage. Refreshes every 24 hours.`

3. **Access Settings**:
   - Access Type: **Use Permission List**
   - Allow Attachments: **Unchecked**
   - Show ID: **Checked**

4. Click **Save**

5. **Add Custom Fields** (Go to Custom Fields subtab):

   **Field 1: Cache Data**
   - Type: **Long Text**
   - Label: `Cache Data (JSON)`
   - ID: `custrecord_iq_cache_data`
   - Help: `JSON string containing vendor data`
   - Mandatory: **Checked**
   - Store Value: **Checked**

   **Field 2: Last Updated**
   - Type: **Date/Time**
   - Label: `Last Updated`
   - ID: `custrecord_iq_cache_updated`
   - Help: `Timestamp when cache was last updated`
   - Mandatory: **Checked**
   - Default Value: **Now**

   **Field 3: Vendor Count**
   - Type: **Integer**
   - Label: `Vendor Count`
   - ID: `custrecord_iq_cache_record_count`
   - Help: `Number of vendor records in cache`

6. **Set Permissions** (Permissions subtab):
   - Administrator Role: **Full**

---

## Step 2: Create Custom Record Type - IQ Vendor Alias

1. Navigate to: **Customization > Lists, Records, & Fields > Record Types > New**

2. **Basic Information**:
   - Record Type Label: `IQ Vendor Alias`
   - Record Type ID: `customrecord_iq_vendor_alias`
   - Description: `Learned vendor name mappings from invoice processing`

3. **Access Settings**:
   - Access Type: **Use Permission List**
   - Allow Inline Editing: **Checked**
   - Show ID: **Checked**

4. Click **Save**

5. **Add Custom Fields**:

   **Field 1: Invoice Vendor Name**
   - Type: **Free-Form Text**
   - Label: `Invoice Vendor Name`
   - ID: `custrecord_iq_alias_invoice_name`
   - Help: `Vendor name as it appears on invoice`
   - Mandatory: **Checked**
   - Max Length: 200

   **Field 2: NetSuite Vendor**
   - Type: **List/Record**
   - Label: `NetSuite Vendor`
   - ID: `custrecord_iq_alias_vendor`
   - List/Record: **Vendor**
   - Help: `The correct vendor in NetSuite`
   - Mandatory: **Checked**

   **Field 3: Confidence Score**
   - Type: **Decimal Number**
   - Label: `Confidence Score`
   - ID: `custrecord_iq_alias_confidence`
   - Help: `1.0 = Manual correction, 0.8-0.99 = Auto-match`
   - Precision: 2 decimal places

   **Field 4: Usage Count**
   - Type: **Integer**
   - Label: `Usage Count`
   - ID: `custrecord_iq_alias_usage_count`
   - Help: `Number of times this alias has been matched`
   - Default Value: 0

6. **Set Permissions**:
   - Administrator Role: **Full**
   - AP Manager/Team: **Full** (if applicable)

---

## Step 3: Create Custom Record Type - IQ Invoice Review

1. Navigate to: **Customization > Lists, Records, & Fields > Record Types > New**

2. **Basic Information**:
   - Record Type Label: `IQ Invoice Review`
   - Record Type ID: `customrecord_iq_invoice_review`
   - Description: `Manual review queue for low-confidence invoice extractions`

3. **Access Settings**:
   - Access Type: **Use Permission List**
   - Allow Attachments: **Checked**
   - Show ID: **Checked**

4. Click **Save**

5. **Add Custom Fields**:

   **Field 1: Status**
   - Type: **List/Record** → Create new custom list
   - Label: `Status`
   - ID: `custrecord_iq_review_status`
   - List Values:
     - Pending
     - In Review
     - Resolved
     - Rejected
   - Default Value: **Pending**
   - Mandatory: **Checked**

   **Field 2: Email Message ID**
   - Type: **Free-Form Text**
   - Label: `Email Message ID`
   - ID: `custrecord_iq_review_email_id`
   - Max Length: 50

   **Field 3: Invoice PDF**
   - Type: **List/Record**
   - Label: `Invoice PDF`
   - ID: `custrecord_iq_review_file_id`
   - List/Record: **File**

   **Field 4: Extracted Data (JSON)**
   - Type: **Long Text**
   - Label: `Extracted Data (JSON)`
   - ID: `custrecord_iq_review_extracted_data`
   - Help: `All data extracted by AI`

   **Field 5: Vendor Name (Raw)**
   - Type: **Free-Form Text**
   - Label: `Vendor Name (Raw)`
   - ID: `custrecord_iq_review_vendor_raw`
   - Help: `Vendor name from invoice`
   - Max Length: 200

   **Field 6: Top Match Candidates (JSON)**
   - Type: **Long Text**
   - Label: `Top Match Candidates (JSON)`
   - ID: `custrecord_iq_review_top_matches`
   - Help: `Top 5 possible matches`

   **Field 7: Confidence Score**
   - Type: **Decimal Number**
   - Label: `Confidence Score`
   - ID: `custrecord_iq_review_confidence`
   - Precision: 2 decimal places

   **Field 8: Assigned To**
   - Type: **List/Record**
   - Label: `Assigned To`
   - ID: `custrecord_iq_review_assigned_to`
   - List/Record: **Employee**

   **Field 9: Resolution Notes**
   - Type: **Long Text**
   - Label: `Resolution Notes`
   - ID: `custrecord_iq_review_resolution_notes`
   - Help: `What was corrected`

   **Field 10: Vendor Bill**
   - Type: **List/Record**
   - Label: `Vendor Bill`
   - ID: `custrecord_iq_review_bill_id`
   - List/Record: **Vendor Bill**

6. **Set Permissions**:
   - Administrator Role: **Full**
   - AP Manager/Team: **Full**

---

## Step 4: Create Custom Record Type - IQ Invoice Metrics

1. Navigate to: **Customization > Lists, Records, & Fields > Record Types > New**

2. **Basic Information**:
   - Record Type Label: `IQ Invoice Metrics`
   - Record Type ID: `customrecord_iq_invoice_metrics`
   - Description: `Daily processing metrics for invoice automation monitoring`

3. Click **Save**

4. **Add Custom Fields**:

   **Field 1: Date**
   - Type: **Date**
   - Label: `Date`
   - ID: `custrecord_iq_metric_date`
   - Mandatory: **Checked**

   **Field 2: Total Invoices**
   - Type: **Integer**
   - Label: `Total Invoices`
   - ID: `custrecord_iq_metric_invoice_count`
   - Default: 0

   **Field 3: High Confidence Count**
   - Type: **Integer**
   - Label: `High Confidence Count`
   - ID: `custrecord_iq_metric_high_confidence`
   - Default: 0

   **Field 4: Medium Confidence Count**
   - Type: **Integer**
   - Label: `Medium Confidence Count`
   - ID: `custrecord_iq_metric_medium_confidence`
   - Default: 0

   **Field 5: Low Confidence Count**
   - Type: **Integer**
   - Label: `Low Confidence Count`
   - ID: `custrecord_iq_metric_low_confidence`
   - Default: 0

   **Field 6: API Calls**
   - Type: **Integer**
   - Label: `API Calls`
   - ID: `custrecord_iq_metric_api_calls`
   - Default: 0

   **Field 7: Estimated API Cost**
   - Type: **Currency**
   - Label: `Estimated API Cost`
   - ID: `custrecord_iq_metric_api_cost`

   **Field 8: Avg Processing Time (sec)**
   - Type: **Decimal Number**
   - Label: `Avg Processing Time (sec)`
   - ID: `custrecord_iq_metric_avg_process_time`
   - Precision: 2

   **Field 9: Governance Units Used**
   - Type: **Integer**
   - Label: `Governance Units Used`
   - ID: `custrecord_iq_metric_governance_units`

   **Field 10: Error Count**
   - Type: **Integer**
   - Label: `Error Count`
   - ID: `custrecord_iq_metric_errors`
   - Default: 0

5. **Set Permissions**:
   - Administrator Role: **View**

---

## Step 5: Create Script Record

1. Navigate to: **Customization > Scripting > Scripts > New**

2. Click **+** to select file from file cabinet

3. Select: `/SuiteScripts/invoice_email_plug_in_v2.js`

4. Click **Create Script Record**

5. **Script Configuration**:
   - Name: `IQ Invoice Email Processor V2`
   - ID: `customscript_iq_invoice_processor_v2`
   - Description: `AI-powered invoice processing with hybrid vendor matching`

6. **Add Script Parameters** (Parameters tab):

   | ID | Type | Label | Mandatory | Default |
   |-----|------|-------|-----------|---------|
   | `custscript_iq_openai_api_key` | Password | OpenAI API Key | ✅ | (none) |
   | `custscript_iq_convertapi_secret` | Password | ConvertAPI Secret | ✅ | (none) |
   | `custscript_iq_confidence_high_threshold` | Decimal Number | High Confidence Threshold | ❌ | 0.90 |
   | `custscript_iq_confidence_medium_threshold` | Decimal Number | Medium Confidence Threshold | ❌ | 0.70 |
   | `custscript_iq_amount_max_threshold` | Currency | Maximum Amount Threshold | ❌ | 1000000 |
   | `custscript_iq_default_expense_account` | List/Record (Account) | Default Expense Account | ❌ | (none) |
   | `custscript_iq_notification_recipients` | Multiple Select (Employee) | Notification Recipients | ❌ | (none) |
   | `custscript_iq_vendor_cache_ttl_hours` | Integer | Vendor Cache TTL (hours) | ❌ | 24 |
   | `custscript_iq_enable_ai_assisted_matching` | Checkbox | Enable AI-Assisted Matching | ❌ | ✅ |
   | `custscript_iq_enable_duplicate_detection` | Checkbox | Enable Duplicate Detection | ❌ | ✅ |

7. Click **Save**

---

## Step 6: Create Script Deployment

1. On the Script Record page, go to **Deployments** subtab

2. Click **New Deployment**

3. **Deployment Configuration**:
   - Title: `IQ Invoice Processor V2 - Production`
   - ID: `customdeploy_iq_invoice_proc_v2_prod`
   - Status: **Testing** (change to Released after testing)
   - Log Level: **Debug**

4. **Event Configuration**:
   - Event Type: **After Submit**
   - Record Type: **Message**

5. **Configure Script Parameter Values**:

   ⚠️ **CRITICAL - You MUST set these values:**

   - **OpenAI API Key**: (Get from https://platform.openai.com/api-keys)
   - **ConvertAPI Secret**: (Get from https://www.convertapi.com/a)
   - **High Confidence Threshold**: 0.90
   - **Medium Confidence Threshold**: 0.70
   - **Maximum Amount Threshold**: 1000000
   - **Default Expense Account**: (Select an active expense account)
   - **Notification Recipients**: (Select AP team members)
   - **Vendor Cache TTL**: 24
   - **Enable AI-Assisted Matching**: ✅ Checked
   - **Enable Duplicate Detection**: ✅ Checked

6. **Execution Context**:
   - Execute As Admin: ✅ Checked (for testing)

7. Click **Save**

---

## Step 7: Inactivate Old V1 Script

1. Navigate to: **Customization > Scripting > Script Deployments**

2. Find: Original invoice email plug-in deployment

3. Edit the deployment

4. Set **Status**: **Testing** or **Disabled**

5. Click **Save**

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] All 4 custom record types created
- [ ] All custom fields added to each record type
- [ ] Script record created with all 10 parameters
- [ ] Script deployment created
- [ ] **API keys entered in deployment** ⚠️ CRITICAL
- [ ] Default expense account selected
- [ ] Notification recipients added
- [ ] Old V1 deployment inactivated
- [ ] Permissions granted to appropriate roles

---

## 🧪 Ready to Test!

Now you can send a test invoice email:

1. Send email with subject: **"IQ - Powertools: Vendor Invoice"**
2. Attach a PDF invoice
3. Wait 30-60 seconds
4. Check: **System > Scripting > Script Execution Log**
5. Look for: **"PROCESSING COMPLETE"**

### Expected Results:
- ✅ Vendor matched with confidence score
- ✅ Vendor bill created (if high/medium confidence)
- ✅ Manual review record created (if low confidence)
- ✅ Processing time <30 seconds
- ✅ Governance usage <500 units

---

## 📊 Where to Check Results

### Script Execution Logs:
```
System > Scripting > Script Execution Log
Filter: Script = "IQ Invoice Email Processor V2"
```

### Created Vendor Bills:
```
Transactions > Purchases > Enter Bills
Filter: Status = Pending Approval, Date = Today
```

### Manual Review Queue:
```
Customization > Lists, Records, & Fields > IQ Invoice Review
```

### Vendor Aliases:
```
Customization > Lists, Records, & Fields > IQ Vendor Alias
```

### Vendor Cache:
```
Customization > Lists, Records, & Fields > IQ Vendor Cache
```

---

## 🚨 Troubleshooting

### Error: "MISSING_API_KEYS"
**Fix**: Edit deployment, add API keys to parameter values

### Error: "Error loading vendor cache"
**Fix**: Check custom record type exists, grant permissions

### No bills created
**Fix**: Check execution log for confidence scores, may need to lower thresholds

---

## 📞 Need Help?

Refer to:
- **DEPLOYMENT_GUIDE.md** - Detailed explanations
- **TESTING_GUIDE.md** - 15 test scenarios
- **README_V2.md** - System overview

---

**Setup Time**: 30-45 minutes
**Status**: Scripts uploaded ✅ | Custom records pending ⏳
**Next Step**: Create 4 custom record types above

Good luck! 🚀
