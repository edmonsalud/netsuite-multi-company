# PO Payment Schedule Deployment Instructions for HBNO

## Account Information
- **Account ID**: 5221064
- **Company**: HBNO

## Pre-Deployment Checklist

### Custom Records Required
Before deploying, ensure these custom records exist in NetSuite:

1. **Custom Payment Terms** (customrecord_po_terms)
   - custrecord_po_terms_name (Text)
   - custrecord_number (Integer)
   - custrecord_po_terms_term (List/Record)

2. **Terms Payment Schedule Details** (customrecord_terms_payment_sche_details)
   - custrecord_terms_pay_details (List/Record - links to customrecord_po_terms)
   - custrecord_terms_pay_number (List: 1,2,3,4,5)
   - custrecord_terms_payment_sche_trigger (List: 1-6)
   - custrecord_terms_payment_sche_perc (Percent)
   - custrecord_terms_payment_sche_num_days (Integer)
   - custrecord_terms_payment_sche_descriptor (Text)

3. **PO Payment Schedule** (customrecord_po_payment_schedule)
   - custrecord_po_pay_sched_po (List/Record - Purchase Order)
   - custrecord_po_pay_sched_date (Date)
   - custrecord_po_pay_sched_amount (Currency)
   - custrecord_po_pay_sched_percent (Percent)
   - custrecord_po_pay_desc (Text)
   - custrecord_po_pay_num (List)
   - custrecord_pay_sched_stat (List with values: 1=OPEN, 2=PAID, 3=CANCELLED, 4=OVERDUE)

### Purchase Order Custom Fields Required
- **custbody_payment_terms_cust** - List/Record field linking to customrecord_po_terms
- **custbody1** - Date field (fallback date reference)

## Deployment Methods

### Method 1: SuiteCloud CLI Deployment (Recommended)

1. **Setup Authentication** (if not already done):
   ```bash
   cd companies/HBNO
   suitecloud account:setup
   ```
   Enter account 5221064 and your credentials when prompted.

2. **Validate the Project**:
   ```bash
   suitecloud project:validate
   ```

3. **Deploy to NetSuite**:
   ```bash
   suitecloud project:deploy
   ```

### Method 2: Manual Deployment via NetSuite UI

1. **Upload Script Files**:
   - Navigate to **Documents > Files > SuiteScripts**
   - Create folder: `PO_Payment_Schedule`
   - Upload main script: `po_payment_schedule_ue.js`
   - Create subfolder: `lib`
   - Upload library files:
     - Constants.js
     - ValidationHelper.js
     - DateCalculator.js
     - PaymentScheduleManager.js

2. **Create Script Record**:
   - Navigate to **Customization > Scripting > Scripts > New**
   - Select the uploaded `po_payment_schedule_ue.js`
   - Set Name: "PO Payment Schedule Generator"
   - Set ID: `customscript_po_payment_schedule`

3. **Create Script Deployment**:
   - Click "Deploy Script" on the script record
   - Set the following:
     - Applies To: Purchase Order
     - Status: Released
     - Execute As Role: Administrator
     - Event: After Submit
     - Log Level: Audit
   - Save the deployment

### Method 3: Using PowerShell Script (Windows)

```powershell
# Save this as deploy_po_schedule.ps1
cd "C:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\HBNO"

# Set environment variables
$env:ACCOUNT_ID = "5221064"

# Authenticate (you'll be prompted for credentials)
npx suitecloud account:setup

# Validate project
Write-Host "Validating project..." -ForegroundColor Yellow
npx suitecloud project:validate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Validation successful. Deploying..." -ForegroundColor Green
    npx suitecloud project:deploy

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "Deployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host "Validation failed. Please fix errors before deploying." -ForegroundColor Red
}
```

## Post-Deployment Testing

1. **Create Test Payment Terms**:
   - Go to your custom record list
   - Create a new "Custom Payment Terms" record
   - Set Number of Payments: 2
   - Create 2 "Terms Payment Schedule Details" records:
     - Payment 1: 50%, Trigger: After Receipt, 30 days
     - Payment 2: 50%, Trigger: After Receipt, 60 days

2. **Test on Purchase Order**:
   - Create a new Purchase Order
   - Select the custom payment terms in `custbody_payment_terms_cust`
   - Set `custbody1` to today's date (fallback date)
   - Add line items and save

3. **Verify Results**:
   - Check that PO Payment Schedule records were created
   - Verify dates are calculated correctly (30 and 60 days from custbody1)
   - Verify amounts are 50% each of PO total

## Troubleshooting

### Common Issues:

1. **Script doesn't trigger**:
   - Verify the deployment is Released
   - Check that custbody_payment_terms_cust has a value
   - Check Execution Log for errors

2. **"Custom record not found" errors**:
   - Ensure all custom records are created with exact IDs
   - Check field IDs match exactly

3. **Permission errors**:
   - Ensure script runs as Administrator role
   - Check custom record permissions

4. **Date calculation issues**:
   - Verify custbody1 has a valid date
   - Check Terms Payment Schedule Details records have valid trigger types

### View Logs:
Navigate to **Customization > Scripting > Script Execution Log**
Filter by:
- Script: PO Payment Schedule Generator
- Date/Time: Today

## Rollback Instructions

If needed, to disable the script:
1. Go to **Customization > Scripting > Scripts**
2. Find "PO Payment Schedule Generator"
3. Edit the deployment
4. Set Status to "Not Scheduled"
5. Save

## Support

For issues or questions:
- Check the Script Execution Log first
- Review error messages in the log
- Verify all custom records and fields exist
- Ensure proper permissions are set

## Files Included

```
companies/HBNO/
├── src/
│   ├── FileCabinet/
│   │   └── SuiteScripts/
│   │       └── PO_Payment_Schedule/
│   │           ├── po_payment_schedule_ue.js
│   │           └── lib/
│   │               ├── Constants.js
│   │               ├── ValidationHelper.js
│   │               ├── DateCalculator.js
│   │               └── PaymentScheduleManager.js
│   ├── Objects/
│   │   └── Scripts/
│   │       └── customscript_po_payment_schedule.xml
│   ├── manifest.xml
│   └── deploy.xml
└── suitecloud.config.js
```