# NetSuite File Naming Standards

## Purpose

Consistent file naming improves:
- Code readability
- File searchability
- Team collaboration
- Automated tooling
- Version control clarity

---

## SuiteScript File Naming

### Format
```
[prefix]_[type]_[module]_[description].js
```

### Prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| `cs_` | Client Script | `cs_sales_order_validation.js` |
| `ue_` | User Event Script | `ue_invoice_before_submit.js` |
| `sl_` | Suitelet | `sl_custom_report_generator.js` |
| `mr_` | Map/Reduce Script | `mr_revenue_recognition.js` |
| `ss_` | Scheduled Script | `ss_daily_inventory_sync.js` |
| `rl_` | RESTlet | `rl_customer_api.js` |
| `wf_` | Workflow Action Script | `wf_approval_notification.js` |
| `pl_` | Portlet | `pl_dashboard_widget.js` |
| `bu_` | Bundle Installation Script | `bu_setup_configuration.js` |
| `lib_` | Library Module | `lib_date_utils.js` |

### Naming Conventions

1. **Use lowercase** with underscores (snake_case)
   - ✅ `ue_sales_order_validation.js`
   - ❌ `UE_SalesOrderValidation.js`
   - ❌ `ue-sales-order-validation.js`

2. **Be descriptive but concise**
   - ✅ `mr_revenue_recognition_monthly.js`
   - ❌ `mr_script.js`
   - ❌ `mr_monthly_revenue_recognition_processing_and_journal_entry_creation.js`

3. **Include entity/record type** when relevant
   - ✅ `ue_customer_after_submit.js`
   - ✅ `cs_sales_order_line_validation.js`
   - ❌ `ue_after_submit.js`

4. **Avoid version numbers in filenames**
   - ✅ `sl_invoice_report.js` (use Git for versions)
   - ❌ `sl_invoice_report_v2.js`
   - ❌ `sl_invoice_report_2023.js`

5. **No spaces or special characters**
   - ✅ `ue_item_fulfillment_tracking.js`
   - ❌ `ue item fulfillment tracking.js`
   - ❌ `ue_item-fulfillment@tracking.js`

---

## Script Deployment XML Naming

### Format
```
customscript_[prefix]_[description].xml
```

### Examples
```
customscript_ue_invoice_validation.xml
customscript_mr_revenue_recognition.xml
customscript_sl_custom_report.xml
```

---

## Custom Record Type Naming

### Format
```
customrecord_[company_prefix]_[description].xml
```

### Examples
```
customrecord_hmp_invoice_tracking.xml
customrecord_aba_contact_preferences.xml
customrecord_goba_order_notes.xml
```

### Company Prefixes
| Company | Prefix | Example |
|---------|--------|---------|
| HMP-Global | `hmp_` | `customrecord_hmp_deferred_revenue.xml` |
| ABA-CON | `aba_` | `customrecord_aba_contact_url.xml` |
| GOBA-SPORTS-PROD | `goba_` | `customrecord_goba_nametag.xml` |
| HBNO | `hbno_` | `customrecord_hbno_po_schedule.xml` |
| IQ-Powertools | `iq_` | `customrecord_iq_vendor_cache.xml` |
| River-Supply-SB | `river_` | `customrecord_river_inventory.xml` |

---

## Custom Field Naming

### Format
```
custbody_[company_prefix]_[field_purpose]
custcol_[company_prefix]_[field_purpose]
custevent_[company_prefix]_[field_purpose]
custentity_[company_prefix]_[field_purpose]
custitem_[company_prefix]_[field_purpose]
```

### Examples
```
custbody_hmp_deferred_revenue_date
custcol_aba_contact_url
custentity_goba_customer_tier
custitem_iq_vendor_alias
```

---

## Workflow Naming

### Format
```
customworkflow_[company_prefix]_[workflow_purpose]
```

### Examples
```
customworkflow_hmp_invoice_approval
customworkflow_aba_order_validation
customworkflow_goba_fulfillment_routing
```

---

## Saved Search Naming

### Format
```
customsearch_[company_prefix]_[search_purpose]
```

### Examples
```
customsearch_hmp_revenue_summary
customsearch_aba_contacts_without_url
customsearch_goba_pending_orders
```

---

## Library Module Naming

### Purpose-Based Naming
```
lib_[functionality].js
```

### Examples
```
lib_date_utils.js          // Date manipulation utilities
lib_email_templates.js     // Email template functions
lib_api_client.js          // External API client
lib_validation.js          // Common validation functions
lib_currency_converter.js  // Currency conversion
lib_pdf_generator.js       // PDF generation utilities
```

---

## Template Files

### XML Templates
```
custtmpl_[company_prefix]_[template_type]_[description].xml
```

### Examples
```
custtmpl_aba_pdf_contact_details.xml
custtmpl_hmp_email_invoice_reminder.xml
custtmpl_goba_pdf_packing_slip.xml
```

---

## Documentation Files

### README Files
```
README.md                  // Company-specific overview
DEPLOYMENT_GUIDE.md        // Deployment instructions
TESTING_GUIDE.md          // Testing procedures
ARCHITECTURE.md           // Architecture documentation
```

### Change-specific Documentation
```
[FEATURE_NAME]_DOCUMENTATION.md
[FEATURE_NAME]_TEST_PLAN.md
[FEATURE_NAME]_RUNBOOK.md
```

### Examples
```
DEFERRED_REVENUE_DOCUMENTATION.md
PO_PAYMENT_SCHEDULE_ARCHITECTURE.md
CONTACT_PRINT_CUSTOMIZATION_DOCUMENTATION.md
```

---

## Backup and Version Files

### ❌ AVOID These Patterns

DO NOT use these patterns - use Git for versioning instead:

```
❌ script_v1.js, script_v2.js
❌ script_ORIGINAL_BACKUP.js
❌ script_PRODUCTION.js
❌ script_DEBUG.js
❌ script_2023.js, script_2024.js
❌ script (1).js, script (2).js
❌ script_backup.js
❌ script_old.js
```

### ✅ Use Git Instead

```bash
# Create a feature branch
git checkout -b feature/invoice-enhancement

# Make changes to script.js

# Commit with meaningful message
git commit -m "feat(HMP): Enhance invoice processing logic"

# Tag for releases
git tag -a v1.0.0 -m "Production release 1.0.0"
```

---

## Folder Organization

### SuiteScripts Directory Structure

```
src/FileCabinet/SuiteScripts/
├── ClientScripts/
│   ├── cs_sales_order_validation.js
│   └── cs_invoice_line_items.js
├── UserEvents/
│   ├── ue_customer_after_submit.js
│   └── ue_invoice_before_submit.js
├── Suitelets/
│   ├── sl_custom_report.js
│   └── sl_data_export.js
├── MapReduce/
│   ├── mr_revenue_recognition.js
│   └── mr_inventory_sync.js
├── Scheduled/
│   ├── ss_daily_cleanup.js
│   └── ss_weekly_report.js
├── RESTlets/
│   ├── rl_customer_api.js
│   └── rl_order_webhook.js
├── Libraries/
│   ├── lib_date_utils.js
│   ├── lib_api_client.js
│   └── lib_validation.js
└── Templates/
    ├── custtmpl_invoice_pdf.xml
    └── custtmpl_email_notification.xml
```

---

## Migration Guide

### If You Have Non-Standard Names

1. **Identify non-standard files**
   ```bash
   # Find files with spaces
   find . -name "* *.js"

   # Find files with version numbers
   find . -name "*_v[0-9]*.js"

   # Find backup files
   find . -name "*backup*.js"
   ```

2. **Rename files using Git** (preserves history)
   ```bash
   git mv "old file name.js" "new_file_name.js"
   git commit -m "refactor: Rename file to follow naming standards"
   ```

3. **Update references** in:
   - Script deployment XMLs
   - Other scripts that import the renamed file
   - Documentation

---

## Checklist

Before committing new files, verify:

- [ ] Filename uses snake_case (lowercase with underscores)
- [ ] Appropriate prefix used (cs_, ue_, mr_, etc.)
- [ ] Company prefix included for custom objects
- [ ] No spaces in filename
- [ ] No version numbers in filename
- [ ] Descriptive but concise name
- [ ] Follows established patterns for file type

---

**Last Updated**: 2025-10-15
