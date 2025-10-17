# How to Export All Workflows from GOBA-SPORTS-PROD

## Problem
SuiteCloud CLI has a bug preventing bulk workflow imports with error:
```
"Objects must be placed under the Objects folder or any of its subfolders"
```

## Solution: Export from NetSuite UI

### Step 1: Log into NetSuite
1. Log into GOBA-SPORTS-PROD NetSuite account
2. Navigate to: **Customization → Workflow → Workflows**

### Step 2: Select All Workflows
1. On the Workflows list page, check the box at the top to select all workflows
2. If there are multiple pages (237 workflows total), you may need to:
   - Increase "Items per page" to 1000
   - OR select all on first page, then repeat for next pages

### Step 3: Export
1. Click **Actions → Export**
2. This will download an XML bundle containing all selected workflows

### Step 4: Extract to Project
1. Save the exported XML file
2. Extract the workflows from the bundle
3. Place individual workflow XML files into:
   ```
   companies/GOBA-SPORTS-PROD/src/Objects/
   ```

### Alternative: Use SuiteCloud Extension for NetSuite

NetSuite also offers a browser extension that integrates with VS Code:
1. Install "SuiteCloud Extension for NetSuite" in your browser
2. Log into NetSuite
3. Use the extension to export objects directly to your local project

## After Import

Once workflows are imported, you can analyze them for patterns:

```bash
# Count workflows by type
cd companies/GOBA-SPORTS-PROD/src/Objects
grep -h "recordtype=" *.xml | sort | uniq -c | sort -rn

# Find all workflows that trigger on sales orders
grep -l 'recordtype="salesorder"' *.xml

# Find workflows with email actions
grep -l "<workflowactionsendemail" *.xml
```

## Quick Win: Analyze Existing Workflows

We already have 2 workflows imported:
- `customworkflow_cust_default.xml` - Customer defaults
- `customworkflow_cust_update_bc.xml` - Customer update

I can create a comprehensive analysis of these to identify patterns.
