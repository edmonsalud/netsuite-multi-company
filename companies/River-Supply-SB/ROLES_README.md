# River Supply - Custom Roles

## Successfully Deployed Roles

The following 6 custom roles have been created and deployed via SDF to your NetSuite River Supply sandbox account:

### 1. River Supply - AR Specialist (`customrole_river_ar`)
**Purpose:** Accounts Receivable management

**Key Permissions:**
- Full access to customer invoicing, payments, credits, deposits, and refunds
- View access to accounts and AR reports

**Use Case:** Staff handling customer billing and payment processing

---

### 2. River Supply - AP Specialist (`customrole_river_ap`)
**Purpose:** Accounts Payable management

**Key Permissions:**
- Full access to vendor bills, payments, checks, and credits
- View access to vendors, accounts, and AP reports
- View expense reports

**Use Case:** Staff handling vendor bill entry and payment processing

---

### 3. River Supply - Sales Representative (`customrole_river_sales`)
**Purpose:** Sales operations and customer relationship management

**Key Permissions:**
- Full access to quotes, sales orders, invoices, cash sales, and opportunities
- Full customer and contact management
- Full task and event management
- Create-level credit memo access
- View sales and AR reports

**Use Case:** Sales team members managing customer relationships and sales transactions

---

### 4. River Supply - Inventory Manager (`customrole_river_inventory_mgr`)
**Purpose:** Inventory control and warehouse operations

**Key Permissions:**
- Full access to inventory counts, worksheets, item receipts, and shipments
- Full item and bin management
- View access to sales orders, purchase orders, and inventory reports

**Use Case:** Warehouse staff managing inventory, receiving, and fulfillment

---

### 5. River Supply - Purchasing Agent (`customrole_river_purchasing`)
**Purpose:** Procurement and vendor management

**Key Permissions:**
- Full access to purchase orders, item receipts, and vendor returns
- Full vendor and item management
- Create-level vendor bill access
- View inventory and AP reports

**Use Case:** Purchasing staff managing procurement and vendor relationships

---

### 6. River Supply - Developer (`customrole_river_developer`)
**Purpose:** SuiteScript development and customization

**Key Permissions:**
- Full access to custom scripts, workflows, web services, and dashboards
- View access to transactions (for testing)
- View access to master data (vendors, items)

**Use Case:** Developers creating and maintaining custom scripts and workflows

---

## Next Steps

### Assigning Roles to Users

1. Navigate to **Setup > Users/Roles > Manage Users**
2. Select a user
3. Click **Edit**
4. In the **Access** tab, select one of the newly created roles from the **Role** dropdown
5. Save

### Modifying Roles

To add or modify permissions:

1. Edit the appropriate role XML file in [`src/Objects/`](./src/Objects/)
2. Add, remove, or modify `<permission>` entries
3. Run validation: `npx suitecloud project:validate`
4. Deploy changes: `npx suitecloud project:deploy`

### Common Permission Keys

**Transactions:**
- `TRAN_FIND` - Find/Search Transactions
- `TRAN_SALESORD` - Sales Orders
- `TRAN_CUSTINVC` - Customer Invoices
- `TRAN_PURCHORD` - Purchase Orders
- `TRAN_VENDBILL` - Vendor Bills

**Lists:**
- `LIST_CUSTOMER` - Customer Records
- `LIST_VENDOR` - Vendor Records
- `LIST_ITEM` - Item Records
- `LIST_ACCOUNT` - Chart of Accounts

**Reports:**
- `REPO_AR` - Accounts Receivable Reports
- `REPO_AP` - Accounts Payable Reports
- `REPO_SALES` - Sales Reports
- `REPO_INVENTORY` - Inventory Reports

**Permission Levels:**
- `NONE` - No access
- `VIEW` - Read-only
- `CREATE` - Create new records only
- `EDIT` - View and edit
- `FULL` - Full access (view, create, edit, delete)

**Note:** Report permissions (REPO_*) only support VIEW level.

## Important Notes

- These are baseline roles with core permissions
- You may need to add additional permissions based on specific business needs
- Always test role changes in sandbox before deploying to production
- Follow the principle of least privilege
- Review role permissions quarterly

## Deployment Information

- **Deployed:** October 14, 2025
- **Account:** River Supply, Inc. (Sandbox)
- **Method:** SuiteCloud Development Framework (SDF)
- **Script IDs:** customrole_river_*

---

For more information about NetSuite roles and permissions, visit the [NetSuite Help Center](https://system.netsuite.com/app/help/helpcenter.nl).
