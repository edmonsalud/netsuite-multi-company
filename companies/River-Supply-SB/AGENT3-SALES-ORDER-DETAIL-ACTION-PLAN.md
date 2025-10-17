# Agent 3: Sales Order Detail Sections - Action Plan
## River-Supply-SB UAT Issues 22-32

**Account:** River-Supply-SB (9910981-sb1)
**Date Created:** 2025-10-16
**Agent:** Agent 3 - NetSuite Sales Order Detail Sections Expert
**Status:** Action Plan Complete - Ready for Implementation

---

## Executive Summary

This document provides comprehensive action plans for 11 Sales Order detail section issues identified during UAT. These issues span multiple functional areas:

- **Form Layout:** Classification section removal, custom field placement
- **Item Line Details:** Column additions for inventory visibility
- **Shipping Configuration:** Custom carrier and method dropdowns
- **Field Security:** Auto-population and view-only restrictions for billing/accounting
- **Relationship Management:** Contact integration with customer master
- **Communication Options:** Print/email/fax functionality verification

**Complexity Assessment:**
- **High Complexity:** Issues #23 (Custom column), #27, #29 (Field security)
- **Medium Complexity:** Issues #24-26 (Shipping dropdowns), #30, #32
- **Low Complexity:** Issue #22 (Section removal), #28, #31

**Estimated Total Effort:** 24-32 hours development + testing

---

## Issue Analysis & Action Plans

### ISSUE #22: Remove Classification Section Entirely
**Section:** Sales Order - Classification
**Request:** Remove entire section
**Priority:** Low
**Complexity:** Low
**Estimated Effort:** 1-2 hours

#### Current State Analysis
- Classification subtab exists on standard Sales Order form
- Contains fields like: Class, Department, Location (standard body fields)
- These fields may be used for accounting segment reporting

#### Business Impact Assessment
- **Risk Level:** MEDIUM
- **Why?** If classification fields are used in:
  - Chart of Accounts segmentation
  - Financial reporting
  - Saved searches or dashboards
  - Integration mappings

  Removing access could break these dependencies.

#### CRITICAL: Pre-Implementation Discovery Required

**MANDATORY STEP 1 - Data Usage Analysis:**
```sql
-- Check if classification fields are populated on existing Sales Orders
SELECT
    COUNT(*) as total_orders,
    COUNT(class) as orders_with_class,
    COUNT(department) as orders_with_department,
    COUNT(location) as orders_with_location
FROM transaction
WHERE type = 'SalesOrd'
```

**MANDATORY STEP 2 - Dependency Analysis:**
- [ ] Review Chart of Accounts setup (Setup → Accounting → Chart of Accounts)
- [ ] Check if Class, Department, or Location segmentation is enabled
- [ ] Search for saved searches using these fields
- [ ] Check KPIs/dashboards referencing these fields
- [ ] Review any integrations that may populate or read these fields

**MANDATORY STEP 3 - Stakeholder Confirmation:**
- [ ] Confirm with accounting team: Are Class/Dept/Location required for GL posting?
- [ ] Confirm with finance: Are these fields used in reporting?
- [ ] Confirm with IT: Are these fields used in integrations?

#### Implementation Options

**Option A: Complete Removal (If analysis confirms not used)**
1. Create custom Sales Order entry form
2. Remove Classification subtab from layout
3. Ensure GL posting still works without these fields
4. Update user training materials

**Option B: Hide Section (If may be needed in future)**
1. Create custom Sales Order entry form
2. Set Classification subtab display type to "Hidden"
3. Fields remain in database but not visible to users
4. Can be re-enabled quickly if needed

**Option C: Role-Based Access (If used by some but not all)**
1. Create custom Sales Order entry form
2. Set Classification subtab to display only for specific roles (e.g., Accounting Manager)
3. Hide from sales team but keep accessible for finance

#### Recommended Approach
**Start with Option B (Hide)** - Safest approach:
- Zero risk to data integrity
- Can be completely removed later if confirmed unnecessary
- Quick rollback if needed

#### Implementation Steps

**Step 1: Create Custom Sales Order Form**
```
Navigate to: Customization → Forms → Entry Forms → New
- Form Type: Sales Order
- Name: "River Supply Custom SO Form"
- Based on: Standard Sales Order
```

**Step 2: Modify Form Layout**
```
Form Editor:
1. Click "Customize" button
2. Navigate to "Screen Fields" → "Custom" subtab
3. Find "Classification" subtab
4. Set Display Type: Hidden
5. Save form
```

**Step 3: Set as Preferred Form**
```
Option A - Set as default for all roles:
  Customization → Forms → Entry Forms → River Supply Custom SO Form
  → Edit → Check "Preferred" → Save

Option B - Set per role:
  Setup → Users/Roles → Manage Roles → [Role Name]
  → Forms subtab → Set preferred form for Sales Order
```

**Step 4: Testing Checklist**
- [ ] Create new Sales Order - Classification section not visible
- [ ] Edit existing Sales Order - Classification section not visible
- [ ] Verify GL posting works correctly
- [ ] Verify existing reports still function
- [ ] Verify saved searches still function
- [ ] Test with all relevant user roles

#### Validation Queries
```sql
-- After implementation, verify no new classification data is being added
SELECT
    tranid,
    trandate,
    class,
    department,
    location
FROM transaction
WHERE type = 'SalesOrd'
    AND trandate >= TO_DATE('2025-10-16', 'YYYY-MM-DD')
    AND (class IS NOT NULL OR department IS NOT NULL OR location IS NOT NULL)
```

#### Rollback Plan
If issues arise:
1. Change preferred form back to Standard Sales Order form
2. Or unhide Classification subtab in custom form
3. No data loss - fields remain in database

---

### ISSUE #23: Items Section - Add Columns
**Section:** Sales Order - Items
**Request:** Line should include Qty Ordered, Qty Avail, UofM, Item #, Description, Price, Total Price, Line Comment
**Priority:** HIGH
**Complexity:** HIGH
**Estimated Effort:** 8-12 hours

#### Current State Analysis
**Standard Sales Order Item Columns:**
- ✅ Item # (Item field)
- ✅ Description
- ✅ Quantity (Qty Ordered)
- ✅ Units (UofM)
- ✅ Rate (Price)
- ✅ Amount (Total Price)
- ❌ Qty Available (NOT standard column)
- ❌ Line Comment (May be hidden)

#### Key Challenge: Qty Available Column
**Problem:** "Quantity Available" is NOT a standard item line column in NetSuite.

**Why This is Complex:**
- Qty Available is an ITEM-level field, not a transaction line field
- Calculated across multiple locations
- Changes dynamically as transactions are processed
- Requires custom scripting to display on transaction lines

#### Technical Approaches

**Approach A: Custom Transaction Column (RECOMMENDED)**

Create a custom transaction column field that looks up item availability at time of order entry.

**Pros:**
- Native NetSuite functionality
- No scripting required (uses formula)
- Appears as standard column
- Sortable and filterable

**Cons:**
- Shows snapshot at time of form load (not real-time)
- May not reflect current availability if user keeps form open
- Limited to single location unless scripted

**Implementation:**
```
Customization → Lists, Records, & Fields → Transaction Body Fields → New
- Field Type: Transaction Column
- Label: "Qty Available"
- Applies To: ☑ Sales Order (Items subtab)
- Store Value: No (calculated)
- Formula: {item.quantityavailable}
```

**Approach B: User Event Script (For Real-Time Updates)**

Create a User Event script that updates availability in real-time as lines are added.

**Pros:**
- Real-time availability calculation
- Can show location-specific availability
- Can show available qty after accounting for current SO qty
- Can include color coding (green if available, red if not)

**Cons:**
- Requires custom field + script deployment
- Governance units consumption
- More complex to maintain

**Implementation Overview:**
1. Create custom column field: custcol_qty_available
2. Create User Event script (beforeLoad, fieldChanged)
3. Script recalculates on item selection and qty change
4. Deploy to Sales Order record type

**Approach C: Suitelet with Advanced Availability (If Very Complex Logic Needed)**

Custom UI page for Sales Order entry with advanced availability logic.

**Pros:**
- Complete control over UI/UX
- Can show multi-location availability
- Can show projected availability dates
- Can integrate with external warehouse systems

**Cons:**
- VERY high complexity
- Requires custom deployment scripting
- User training required
- Maintenance overhead

#### Recommended Implementation Path

**Phase 1: Quick Win (Use Approach A)**
- Implement custom transaction column with formula
- Add to custom SO form immediately
- Provides basic availability visibility
- Est: 2-3 hours

**Phase 2: Enhanced (If Phase 1 insufficient)**
- Develop User Event script for real-time updates
- Add location-specific logic if needed
- Implement color coding for low stock warnings
- Est: 6-9 hours additional

#### Detailed Implementation Steps

**Step 1: Create Custom Transaction Column Field**

```
Navigate to: Customization → Lists, Records, & Fields → Transaction Column Fields → New

Field Configuration:
- Label: Qty Available
- ID: custcol_qty_available
- Type: Decimal Number
- Description: "Displays available quantity for selected item"
- Applies To: ☑ Sales Order

Display Tab:
- Subtab: Items
- Display Type: Inline Text (read-only)

Validation & Defaulting:
- Store Value: No
- Formula: {item.quantityavailable}

Sourcing & Filtering:
- Source List: Item
- Source From: Item
```

**Step 2: Add All Required Columns to Custom Form**

```
Navigate to: Customization → Forms → Entry Forms → [Your Custom SO Form] → Edit

Items Subtab Configuration:
- Columns to Show (in order):
  1. Item # (ITEM)
  2. Description (DESCRIPTION)
  3. Qty Ordered (QUANTITY)
  4. Qty Available (CUSTCOL_QTY_AVAILABLE) ← NEW
  5. UofM (UNITS)
  6. Price (RATE)
  7. Total Price (AMOUNT)
  8. Line Comment (MEMO)

- Verify "Memo" column is not hidden (check Show checkboxes)
```

**Step 3: Column Ordering & Display**

Recommended column order for optimal UX:
```
1. Line # (auto)
2. Item #
3. Description
4. Qty Ordered
5. Qty Available ← NEW (helps prevent over-ordering)
6. UofM
7. Price
8. Total Price
9. Line Comment
```

**Step 4: Formula Enhancement (Optional)**

For more informative display, enhance formula to show location:

```formula
{item.quantityavailable} || ' (' || {item.location} || ')'
```

Result: "150 (Main Warehouse)"

Or show shortage warning:
```formula
CASE
  WHEN {item.quantityavailable} >= {quantity} THEN 'Available: ' || {item.quantityavailable}
  WHEN {item.quantityavailable} > 0 THEN 'Low Stock: ' || {item.quantityavailable}
  ELSE 'Out of Stock'
END
```

#### Advanced Implementation: User Event Script

If real-time updates required, here's the script outline:

**File:** `src/FileCabinet/SuiteScripts/RiverSupply/SO_ItemAvailability_UE.js`

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime'],
    (record, search, runtime) => {

        /**
         * Updates Qty Available column with real-time inventory data
         */
        function beforeLoad(context) {
            if (context.type !== context.UserEventType.VIEW &&
                context.type !== context.UserEventType.EDIT) {
                return;
            }

            const soRecord = context.newRecord;
            const lineCount = soRecord.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {
                const itemId = soRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                if (itemId) {
                    const qtyAvailable = getItemAvailability(itemId);

                    soRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_qty_available',
                        line: i,
                        value: qtyAvailable
                    });
                }
            }
        }

        /**
         * Looks up current item availability
         */
        function getItemAvailability(itemId) {
            try {
                const itemSearch = search.lookupFields({
                    type: 'item',
                    id: itemId,
                    columns: ['quantityavailable']
                });

                return itemSearch.quantityavailable || 0;
            } catch (e) {
                log.error('Error fetching availability', e);
                return 'N/A';
            }
        }

        return {
            beforeLoad: beforeLoad
        };
    });
```

**Script Deployment:**
```
Script Record:
- Name: SO Item Availability Update
- ID: customscript_so_item_avail_ue
- Script File: SO_ItemAvailability_UE.js

Script Deployment:
- Status: Released
- Record Type: Sales Order
- Event Types: ☑ View, ☑ Edit, ☑ Create
- Audience: All Roles
```

#### Testing Checklist

**Basic Column Display:**
- [ ] All 8 columns visible on Items subtab
- [ ] Columns in correct order
- [ ] Column headers display properly
- [ ] Data populates correctly when item selected

**Qty Available Functionality:**
- [ ] Shows correct available qty for in-stock items
- [ ] Shows 0 for out-of-stock items
- [ ] Updates when different item selected
- [ ] Formula handles null/empty values gracefully

**Line Comment Field:**
- [ ] Field is editable
- [ ] Accepts text input (500+ characters)
- [ ] Saves with transaction
- [ ] Displays on saved records

**Cross-Browser Testing:**
- [ ] Chrome
- [ ] Edge
- [ ] Firefox
- [ ] Safari (if Mac users)

**User Role Testing:**
- [ ] Sales Rep can see all columns
- [ ] Order Entry can see all columns
- [ ] Warehouse can see Qty Available
- [ ] View-only users can see all data

#### Validation Queries

```sql
-- Verify custom column field deployed
SELECT name, scriptid, fieldtype
FROM customfield
WHERE scriptid = 'custcol_qty_available'

-- Test availability calculation on actual SOs
SELECT
    t.tranid,
    tl.item,
    i.displayname,
    tl.quantity as qty_ordered,
    i.quantityavailable as qty_avail,
    (i.quantityavailable - tl.quantity) as remaining_after_so
FROM transaction t
JOIN transactionline tl ON t.id = tl.transaction
JOIN item i ON tl.item = i.id
WHERE t.type = 'SalesOrd'
    AND t.trandate >= CURRENT_DATE - 30
ORDER BY t.trandate DESC
LIMIT 10
```

#### Known Limitations & Workarounds

**Limitation 1: Multi-Location Availability**
- Formula shows total availability across all locations
- Does not show location-specific availability
- **Workaround:** Add second custom column for location-specific qty if needed

**Limitation 2: Committed Quantity**
- Shows gross available, not net available (available - committed)
- **Workaround:** Modify formula: `{item.quantityavailable} - {item.quantitycommitted}`

**Limitation 3: Real-Time Updates**
- Formula calculated at form load, not dynamically
- **Workaround:** Use User Event script (Approach B) for real-time

**Limitation 4: Back Orders**
- Does not show expected restock dates
- **Workaround:** Add custom field referencing purchase orders

#### Success Criteria

✅ All 8 columns visible and functional
✅ Qty Available displays accurately
✅ Line Comment field editable and saves
✅ No performance degradation (<2 sec form load)
✅ User testing confirms improved order entry workflow
✅ Zero data integrity issues

---

### ISSUES #24-26: Shipping Configuration
**Section:** Sales Order - Shipping
**Issues:**
- #24: Options should be UPS, FedEx, Freight
- #25: Options should be Customer Rep Dlv, Customer Pup, Local Dlv, Std Ship, Drop Ship
- #26: Is there an int'l shipping option?

**Priority:** HIGH
**Complexity:** MEDIUM
**Estimated Effort:** 6-8 hours

#### Current State Analysis

NetSuite has TWO separate shipping-related fields:
1. **Ship Method** (shipmethod) - HOW the shipment is transported
2. **Shipping Carrier** (shippingcarrier) - WHO transports it

**Current Confusion:**
- Issue #24 mentions "UPS, FedEx, Freight" - these are CARRIERS
- Issue #25 mentions "Customer Rep Dlv, Customer Pup, Local Dlv, Std Ship, Drop Ship" - these are METHODS
- Need to clarify which field needs which values

#### Field Definitions

**Field 1: Ship Method**
- Standard Field: shipmethod
- Purpose: Describes the delivery method/service level
- Examples: Ground, 2-Day Air, Overnight, Local Delivery, Will Call
- Location: Shipping subtab

**Field 2: Shipping Carrier**
- Standard Field: shippingcarrier (or shipcarrier in some versions)
- Purpose: Identifies the shipping company
- Examples: UPS, FedEx, USPS, DHL
- Location: Shipping subtab or may not be on form

#### Recommended Configuration

Based on the requirements, implement BOTH fields with custom values:

**Ship Method Field (Issue #25):**
- Customer Rep Delivery
- Customer Pickup
- Local Delivery
- Standard Shipping
- Drop Ship

**Shipping Carrier Field (Issue #24):**
- UPS
- FedEx
- Freight

**International Shipping (Issue #26):**
- Add international options to both fields

#### Implementation Steps

**Step 1: Configure Ship Method Custom List**

```
Navigate to: Customization → Lists, Records, & Fields → Lists → New

List Configuration:
- List Name: River Supply Ship Methods
- ID: customlist_rs_ship_methods
- Description: "Ship methods for River Supply sales orders"

List Values (Add these items):
1. Customer Rep Delivery
   - ID: customer_rep_dlv
   - Abbreviation: Rep Dlv

2. Customer Pickup
   - ID: customer_pickup
   - Abbreviation: Pickup

3. Local Delivery
   - ID: local_delivery
   - Abbreviation: Local

4. Standard Shipping
   - ID: standard_ship
   - Abbreviation: Std Ship

5. Drop Ship
   - ID: drop_ship
   - Abbreviation: Drop Ship

6. International Shipping (if needed)
   - ID: intl_shipping
   - Abbreviation: Int'l
```

**Step 2: Replace Standard Ship Method Field**

**Option A: Use Custom Transaction Body Field**
```
Navigate to: Customization → Lists, Records, & Fields → Transaction Body Fields → New

Field Configuration:
- Label: Shipping Method
- ID: custbody_ship_method
- Type: List/Record
- List/Record: River Supply Ship Methods (custom list created above)
- Applies To: ☑ Sales Order
- Description: "Internal shipping method"

Display:
- Subtab: Shipping
- Display Type: Normal

Validation & Defaulting:
- Default Value: Standard Shipping
- Mandatory: Yes (for shipped orders)
```

**Option B: Customize Standard shipmethod Field**

If you want to use the standard field (preserves integrations):
```
Navigate to: Setup → Accounting → Shipping Items → New

For each method, create a shipping item:
1. Name: Customer Rep Delivery
   - Item Number: SHIP-REP-DLV
   - Rate: $0.00 (or actual rate)
   - Account: Freight Income

2. Name: Customer Pickup
   - Item Number: SHIP-PICKUP
   - Rate: $0.00

3. Name: Local Delivery
   - Item Number: SHIP-LOCAL
   - Rate: varies

4. Name: Standard Shipping
   - Item Number: SHIP-STANDARD
   - Rate: calculated

5. Name: Drop Ship
   - Item Number: SHIP-DROPSHIP
   - Rate: $0.00
```

**Step 3: Configure Shipping Carrier List**

Check if Shipping Carrier field exists on form:
```
Navigate to: Customization → Forms → Entry Forms → [Your Custom SO Form] → Edit
→ Screen Fields → Main → Shipping subtab
→ Look for "Carrier" or "Shipping Carrier" field
```

If field doesn't exist, create custom field:
```
Navigate to: Customization → Lists, Records, & Fields → Transaction Body Fields → New

Field Configuration:
- Label: Shipping Carrier
- ID: custbody_shipping_carrier
- Type: List/Record
- Create new list inline:

Carrier List Values:
1. UPS
2. FedEx
3. Freight (Generic)
4. DHL (for international)
5. USPS (if needed)
6. Customer Arranged (for customer pickup)

Display:
- Subtab: Shipping
- Display Type: Normal
```

**Step 4: Add International Shipping Support**

**Method 1: Add to Ship Method list**
```
Add to custom list:
- International - Air
- International - Ocean
- International - Courier
```

**Method 2: Create separate checkbox**
```
Create Transaction Body Field:
- Label: International Shipment
- ID: custbody_intl_shipment
- Type: Checkbox
- Subtab: Shipping

When checked, show different carrier/method options via Client Script
```

**Step 5: Update Custom Sales Order Form**

```
Navigate to: Customization → Forms → Entry Forms → [Your Custom SO Form] → Edit

Shipping Subtab Configuration:
1. Add custom shipping method field (or verify standard is configured)
2. Add custom shipping carrier field
3. Add international shipment checkbox (if using Method 2)
4. Order fields logically:
   - Ship To Address
   - Shipping Method ← NEW/UPDATED
   - Shipping Carrier ← NEW
   - International Shipment ← NEW (if applicable)
   - Ship Date
   - Shipping Cost
```

**Step 6: Create Client Script for Dynamic Behavior (Optional)**

If you want carrier options to change based on method selected:

**File:** `src/FileCabinet/SuiteScripts/RiverSupply/SO_ShippingValidation_CS.js`

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message'],
    (message) => {

        /**
         * Validates shipping method and carrier compatibility
         */
        function fieldChanged(context) {
            if (context.fieldId === 'custbody_ship_method') {
                validateShippingMethod(context);
            }
        }

        function validateShippingMethod(context) {
            const shipMethod = context.currentRecord.getValue({
                fieldId: 'custbody_ship_method'
            });

            // If Customer Pickup or Customer Rep Delivery selected,
            // clear carrier field (not needed)
            if (shipMethod === 'customer_pickup' ||
                shipMethod === 'customer_rep_dlv') {

                context.currentRecord.setValue({
                    fieldId: 'custbody_shipping_carrier',
                    value: 'customer_arranged'
                });

                // Show info message
                message.create({
                    title: 'Carrier Not Required',
                    message: 'Customer is arranging transportation. Carrier field set to "Customer Arranged".',
                    type: message.Type.INFORMATION
                }).show({ duration: 5000 });
            }

            // If International, show warning
            const isIntl = context.currentRecord.getValue({
                fieldId: 'custbody_intl_shipment'
            });

            if (isIntl && shipMethod === 'local_delivery') {
                message.create({
                    title: 'Shipping Conflict',
                    message: 'Local Delivery is not compatible with International shipments.',
                    type: message.Type.WARNING
                }).show({ duration: 10000 });
            }
        }

        /**
         * Validates before save
         */
        function saveRecord(context) {
            const shipMethod = context.currentRecord.getValue({
                fieldId: 'custbody_ship_method'
            });

            const shipCarrier = context.currentRecord.getValue({
                fieldId: 'custbody_shipping_carrier'
            });

            // Require carrier for standard shipping
            if (shipMethod === 'standard_ship' && !shipCarrier) {
                alert('Please select a Shipping Carrier for Standard Shipping orders.');
                return false;
            }

            return true;
        }

        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
    });
```

**Script Deployment:**
```
Script Record:
- Name: SO Shipping Validation
- ID: customscript_so_ship_validation_cs
- Script File: SO_ShippingValidation_CS.js

Script Deployment:
- Status: Released
- Record Type: Sales Order
- Audience: All Roles
```

#### Testing Checklist

**Ship Method Field:**
- [ ] All 5 methods visible in dropdown
- [ ] Customer Rep Delivery selectable
- [ ] Customer Pickup selectable
- [ ] Local Delivery selectable
- [ ] Standard Shipping selectable (default)
- [ ] Drop Ship selectable

**Shipping Carrier Field:**
- [ ] UPS option available
- [ ] FedEx option available
- [ ] Freight option available
- [ ] Customer Arranged option available (for pickup)

**International Shipping:**
- [ ] International checkbox visible (if implemented)
- [ ] International carriers available (DHL, etc.)
- [ ] Validation prevents incompatible combinations

**Integration Testing:**
- [ ] Selected method saves with SO record
- [ ] Selected carrier saves with SO record
- [ ] Fields appear on SO print forms
- [ ] Fields appear in saved searches
- [ ] Pick tickets show correct shipping info
- [ ] Packing slips show correct shipping info

**Business Logic:**
- [ ] Customer Pickup → No carrier required
- [ ] Standard Shipping → Carrier required
- [ ] International → International carriers only
- [ ] Drop Ship → Special handling (if configured)

#### Validation Queries

```sql
-- Verify shipping methods are being used
SELECT
    custbody_ship_method,
    COUNT(*) as order_count
FROM transaction
WHERE type = 'SalesOrd'
    AND trandate >= CURRENT_DATE - 30
GROUP BY custbody_ship_method
ORDER BY order_count DESC

-- Check carrier distribution
SELECT
    custbody_shipping_carrier,
    COUNT(*) as order_count
FROM transaction
WHERE type = 'SalesOrd'
    AND trandate >= CURRENT_DATE - 30
GROUP BY custbody_shipping_carrier
ORDER BY order_count DESC

-- Identify orders with missing shipping info
SELECT
    tranid,
    trandate,
    entity,
    custbody_ship_method,
    custbody_shipping_carrier
FROM transaction
WHERE type = 'SalesOrd'
    AND status NOT IN ('Closed', 'Cancelled')
    AND (custbody_ship_method IS NULL OR custbody_shipping_carrier IS NULL)
```

#### Configuration Options Summary

**Recommended Approach:**
1. Create custom Ship Method list with 5 values (Issue #25)
2. Create custom Shipping Carrier field with 3-5 carriers (Issue #24)
3. Add International Shipment checkbox (Issue #26)
4. Deploy Client Script for validation
5. Update custom SO form layout

**Alternative Approach (If want to preserve standard fields):**
1. Create shipping items for each method
2. Use standard shipmethod field
3. Add custom carrier field
4. Less customization, more integration-friendly

#### Success Criteria

✅ All 5 ship methods available and selectable
✅ All 3 carriers available (UPS, FedEx, Freight)
✅ International shipping option available
✅ Fields save correctly with Sales Order
✅ Print forms show shipping method and carrier
✅ User training materials updated
✅ No errors during order entry

---

### ISSUE #27: Billing Terms - Auto-Populate from Customer
**Section:** Sales Order - Billing
**Request:** Terms should pull over from customer card and view only
**Priority:** HIGH
**Complexity:** HIGH
**Estimated Effort:** 4-6 hours

#### Current State Analysis

**Standard NetSuite Behavior:**
- Terms field (payment terms) DOES auto-populate from customer master
- However, field is EDITABLE by default
- Users can override customer terms on individual SOs

**Client Request:**
- Confirm terms auto-populate (should already work)
- Make field VIEW ONLY (read-only) - prevent overrides

#### Business Impact Assessment

**Why Make Terms Read-Only?**
- Enforce consistent payment terms per customer
- Prevent sales reps from offering unauthorized discounts via extended terms
- Ensure billing/AR team controls credit policies
- Maintain audit trail (terms changes must be made on customer master)

**Risks of Read-Only:**
- Cannot handle one-time term exceptions
- May require customer master updates for special deals
- Finance must be involved for any term changes

**Recommended: Role-Based Access**
- Sales Rep: Read-only
- Sales Manager: Read-only
- AR Manager: Editable
- Administrator: Editable

#### Implementation Options

**Option A: Workflow (RECOMMENDED)**

Use NetSuite workflow to:
1. Auto-populate terms from customer (redundant but ensures it)
2. Set display type to "View Only" based on role

**Pros:**
- Native NetSuite functionality
- Role-based control
- Can add approval process if needed
- Easy to modify later

**Cons:**
- Uses one workflow execution limit
- Requires workflow knowledge

**Option B: User Event Script**

SuiteScript to set field display type on form load.

**Pros:**
- More flexible logic
- Can add complex rules
- Can log override attempts

**Cons:**
- Higher governance units
- More code to maintain
- Script deployment required

**Option C: Form-Level Field Security**

Set field display type directly on custom form.

**Pros:**
- Simplest implementation
- No scripting
- Zero governance units

**Cons:**
- Applies to ALL roles (can't differentiate)
- Less flexible

#### Recommended Implementation

**Use Workflow with Role-Based Display Control**

#### Detailed Implementation Steps

**Step 1: Create Workflow**

```
Navigate to: Customization → Scripting → Workflows → New

Workflow Configuration:
- Name: Sales Order - Terms Auto-Populate & Lock
- ID: customworkflow_so_terms_lock
- Record Type: Sales Order
- Description: "Populates payment terms from customer and restricts editing"

Workflow Settings:
- Release Status: Released
- Execute as Admin: No
- Trigger Type:
  ☑ Before Record Load (View, Edit, Create)
- Log Executions: Yes
- Keep History: Always
```

**Step 2: Add Workflow State**

```
State Name: Set Terms and Display Type

Actions (Before Load):

Action 1: Set Field Value (Terms)
- Field: Terms (terms)
- Value Type: Formula
- Formula: {entity.terms}
- Description: "Populate terms from customer master"

Action 2: Set Display Type (Terms) - Read Only for Sales
- Field: Terms (terms)
- Display Type: Disabled
- Condition: {role} = 1009 (Sales Rep role ID - verify actual ID)
- Description: "Make terms read-only for sales reps"

Action 3: Set Display Type (Terms) - Editable for AR
- Field: Terms (terms)
- Display Type: Normal
- Condition: {role} = 1010 (AR Manager role ID - verify actual ID)
- Description: "Allow AR managers to edit terms"
```

**Step 3: Get Actual Role IDs**

Run this query to get role internal IDs:
```sql
SELECT
    name,
    scriptid,
    id
FROM role
WHERE isinactive = 'F'
ORDER BY name
```

Map roles:
```
River Sales Rep → ID: [actual ID]
River AR Manager → ID: [actual ID]
River Purchasing → ID: [actual ID]
Administrator → ID: 3
```

**Step 4: Update Workflow Conditions**

Update Action 2 formula with actual role IDs:
```formula
{role} IN (1009, 1011, 1012)  -- Sales Rep, Sales Manager, Order Entry
```

Update Action 3 formula:
```formula
{role} IN (3, 1010, 1015)  -- Administrator, AR Manager, Accounting
```

**Step 5: Add Workflow to Custom Form**

```
Navigate to: Customization → Forms → Entry Forms → [Your Custom SO Form] → Edit
→ Workflows subtab
→ Add: Sales Order - Terms Auto-Populate & Lock
→ Save
```

**Step 6: Test Workflow**

Create test scenarios for each role.

#### Testing Checklist

**Sales Rep Role:**
- [ ] Create new SO → Terms auto-populate from customer
- [ ] Terms field is greyed out (disabled)
- [ ] Cannot change terms value
- [ ] Save SO → Terms remain from customer

**AR Manager Role:**
- [ ] Create new SO → Terms auto-populate from customer
- [ ] Terms field is editable
- [ ] Can change terms if needed
- [ ] Save SO → Updated terms save correctly

**Administrator Role:**
- [ ] Full access to terms field
- [ ] Can override if needed
- [ ] Save works correctly

**Edge Cases:**
- [ ] Customer with NO terms set → SO allows selection
- [ ] Change customer on SO → Terms update automatically
- [ ] Copy SO → Terms copy from original (then reset to customer terms)

**Integration Testing:**
- [ ] SO saves successfully
- [ ] Terms flow to invoice correctly
- [ ] AR aging report uses correct terms
- [ ] No impact on fulfillment process

#### Alternative Implementation: User Event Script

If workflow approach doesn't meet needs, here's the script approach:

**File:** `src/FileCabinet/SuiteScripts/RiverSupply/SO_TermsLock_UE.js`

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/ui/serverWidget'],
    (record, runtime, serverWidget) => {

        // Role IDs that should NOT be able to edit terms
        const RESTRICTED_ROLES = [
            1009, // Sales Rep
            1011, // Sales Manager
            1012  // Order Entry
        ];

        // Role IDs that CAN edit terms
        const AUTHORIZED_ROLES = [
            3,    // Administrator
            1010, // AR Manager
            1015  // Accounting
        ];

        /**
         * Before Load: Set terms field display type based on role
         */
        function beforeLoad(context) {
            // Only apply to View, Edit, Create modes
            if (context.type !== context.UserEventType.VIEW &&
                context.type !== context.UserEventType.EDIT &&
                context.type !== context.UserEventType.CREATE) {
                return;
            }

            const currentUser = runtime.getCurrentUser();
            const userRole = currentUser.role;

            const form = context.form;
            const soRecord = context.newRecord;

            // Get customer and their terms
            const customerId = soRecord.getValue({ fieldId: 'entity' });

            if (customerId) {
                const customerTerms = getCustomerTerms(customerId);

                // Auto-populate terms if not already set
                const currentTerms = soRecord.getValue({ fieldId: 'terms' });
                if (!currentTerms && customerTerms) {
                    soRecord.setValue({
                        fieldId: 'terms',
                        value: customerTerms
                    });
                }
            }

            // Set field display type based on role
            const termsField = form.getField({ id: 'terms' });

            if (RESTRICTED_ROLES.includes(parseInt(userRole))) {
                // Make read-only for sales roles
                termsField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                log.audit('Terms Locked',
                    `User role ${userRole} - Terms field set to read-only`);
            } else if (AUTHORIZED_ROLES.includes(parseInt(userRole))) {
                // Ensure editable for authorized roles
                termsField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL
                });

                log.audit('Terms Editable',
                    `User role ${userRole} - Terms field editable`);
            }
        }

        /**
         * Before Submit: Validate terms haven't been improperly changed
         */
        function beforeSubmit(context) {
            if (context.type === context.UserEventType.DELETE) {
                return;
            }

            const currentUser = runtime.getCurrentUser();
            const userRole = currentUser.role;

            // If restricted role, verify terms match customer
            if (RESTRICTED_ROLES.includes(parseInt(userRole))) {
                const newRecord = context.newRecord;
                const customerId = newRecord.getValue({ fieldId: 'entity' });
                const soTerms = newRecord.getValue({ fieldId: 'terms' });
                const customerTerms = getCustomerTerms(customerId);

                // If terms don't match customer, log and reset
                if (soTerms !== customerTerms) {
                    log.error('Unauthorized Terms Change Attempt', {
                        user: currentUser.id,
                        role: userRole,
                        customer: customerId,
                        customerTerms: customerTerms,
                        attemptedTerms: soTerms
                    });

                    // Reset to customer terms
                    newRecord.setValue({
                        fieldId: 'terms',
                        value: customerTerms
                    });
                }
            }
        }

        /**
         * Lookup customer payment terms
         */
        function getCustomerTerms(customerId) {
            try {
                const customerFields = search.lookupFields({
                    type: 'customer',
                    id: customerId,
                    columns: ['terms']
                });

                return customerFields.terms[0] ? customerFields.terms[0].value : null;
            } catch (e) {
                log.error('Error looking up customer terms', e);
                return null;
            }
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        };
    });
```

**Script Deployment:**
```
Script Record:
- Name: SO Terms Lock by Role
- ID: customscript_so_terms_lock_ue
- Script File: SO_TermsLock_UE.js

Script Deployment:
- Status: Released
- Record Type: Sales Order
- Event Types: ☑ Before Load, ☑ Before Submit
- Audience: All Roles
```

#### Validation Queries

```sql
-- Check if any SOs have terms different from customer
SELECT
    t.tranid,
    t.entity,
    c.companyname,
    c.terms as customer_terms,
    ct1.name as customer_terms_name,
    t.terms as so_terms,
    ct2.name as so_terms_name,
    t.createddate,
    e.entityid as created_by
FROM transaction t
JOIN customer c ON t.entity = c.id
LEFT JOIN term ct1 ON c.terms = ct1.id
LEFT JOIN term ct2 ON t.terms = ct2.id
JOIN entity e ON t.createdby = e.id
WHERE t.type = 'SalesOrd'
    AND t.trandate >= CURRENT_DATE - 90
    AND (t.terms IS DISTINCT FROM c.terms)
ORDER BY t.createddate DESC

-- Monitor workflow executions
SELECT
    tranid,
    workflowinstance.name as workflow,
    workflowinstance.status,
    workflowinstance.startdate
FROM transaction t
JOIN workflowinstance ON t.id = workflowinstance.recordid
WHERE workflowinstance.name = 'Sales Order - Terms Auto-Populate & Lock'
    AND workflowinstance.startdate >= CURRENT_DATE
ORDER BY workflowinstance.startdate DESC
```

#### User Communication

**Email Template for Sales Team:**
```
Subject: Update to Sales Order Terms Field

Team,

Effective [DATE], the Payment Terms field on Sales Orders will automatically populate from the customer master record and will be read-only for sales roles.

What this means:
- Terms will auto-fill when you select a customer
- You cannot change terms on individual orders
- If a customer needs different terms, contact AR team to update customer master

Why this change:
- Ensures consistent application of credit policies
- Maintains accurate AR aging
- Streamlines order entry process

If you need to offer special terms:
1. Contact AR Manager before creating the order
2. AR will update customer master terms
3. Then create your sales order

Questions? Contact [AR Manager Name]

Thank you,
Operations Team
```

#### Success Criteria

✅ Terms auto-populate from customer 100% of time
✅ Sales reps cannot edit terms field
✅ AR managers CAN edit terms field
✅ No errors during SO creation/editing
✅ Terms flow correctly to invoices
✅ User feedback confirms improved workflow
✅ No unauthorized term overrides in audit log

---

### ISSUE #28: Billing - Payment Restrictions
**Section:** Sales Order - Billing
**Request:** OK to add payment but not able to delete or change
**Priority:** MEDIUM
**Complexity:** MEDIUM
**Estimated Effort:** 3-4 hours

#### Current State Analysis

**Standard NetSuite Behavior:**
- Payments can be applied to Sales Orders (deposits/prepayments)
- Users with appropriate permissions can add/edit/delete payments
- No native restriction for "add only, no edit/delete"

**Client Request:**
- Allow adding payments to SO
- Prevent deleting existing payments
- Prevent changing existing payment amounts/details

#### Business Rationale

**Why Restrict Payment Changes?**
- Prevent accidental deletion of customer deposits
- Maintain audit trail of payment history
- Ensure payments are only adjusted by AR team
- Protect against fraud (changing payment amounts)

**Who Should Have Full Payment Access?**
- AR Manager
- Accounting team
- Administrator
- NOT sales reps or order entry

#### Implementation Challenges

**Challenge 1: Payment Application Methods**

NetSuite has multiple ways to apply payments to SO:
1. Customer Payment record linked to SO
2. Customer Deposit linked to SO
3. Direct payment on SO Billing subtab
4. Payment via Advanced Billing feature

Need to restrict all methods.

**Challenge 2: Record Type Dependencies**

Payments are separate records (Customer Payment, Customer Deposit), not fields on SO. Cannot simply make field read-only.

**Challenge 3: UI vs. API Access**

Restrictions applied via UI can be bypassed via API/CSV import if not properly secured at permission level.

#### Recommended Approach

**Multi-Layered Security:**
1. **Permission Level:** Restrict role permissions for Customer Payment/Deposit records
2. **Workflow Level:** Prevent deletion/editing of linked payments
3. **Script Level:** Validate and log any unauthorized attempts

#### Detailed Implementation Steps

**Step 1: Review Current Role Permissions**

```
Navigate to: Setup → Users/Roles → Manage Roles

For each sales role (Sales Rep, Order Entry, Sales Manager):
1. Open role → Permissions tab
2. Find "Customer Payment" record
3. Find "Customer Deposit" record
4. Review current permission levels
```

**Current vs. Desired State:**

| Role | Customer Payment Permission | Customer Deposit Permission |
|------|---------------------------|---------------------------|
| **Sales Rep** | Create, View (current) | Create (desired - add only) |
| **Order Entry** | Create, Edit, View (current) | Create (desired - add only) |
| **AR Manager** | Full (current) | Full (keep) |
| **Accounting** | Full (current) | Full (keep) |

**Step 2: Modify Role Permissions**

For each sales role:
```
Navigate to: Setup → Users/Roles → Manage Roles → [Role Name] → Edit

Permissions Tab:
1. Find "Transactions" section
2. Locate "Customer Payment"
   - Current: Create, Edit, View
   - Change to: Create, View (remove Edit permission)

3. Locate "Customer Deposit"
   - Current: Create, Edit, View
   - Change to: Create, View (remove Edit permission)

4. Save role
```

**Step 3: Test Permission Changes**

Log in as sales rep and verify:
- [ ] Can create new Customer Payment
- [ ] Can view existing Customer Payment
- [ ] CANNOT edit existing Customer Payment
- [ ] CANNOT delete existing Customer Payment
- [ ] See "Insufficient Permissions" error if attempted

**Step 4: Create Workflow for Additional Protection**

Even with permissions removed, add workflow as secondary control:

```
Navigate to: Customization → Scripting → Workflows → New

Workflow 1: Customer Payment - Prevent Unauthorized Edits

Workflow Configuration:
- Name: Customer Payment - Edit Protection
- ID: customworkflow_custpay_edit_protect
- Record Type: Customer Payment
- Trigger Type: ☑ Before Record Submit (Edit, Delete)

State: Validate Editor Role

Condition:
- Formula: {role} NOT IN (3, 1010, 1015)  -- Not Admin, AR Mgr, or Accounting
- Type: Formula (Numeric)

Action (if condition true):
- Action Type: Return Error
- Error Message: "You do not have permission to edit or delete customer payments. Contact AR team for assistance."

Save and Release workflow.
```

```
Workflow 2: Customer Deposit - Prevent Unauthorized Edits

Same as above, but for Customer Deposit record type.
```

**Step 5: Add Audit Logging (Optional but Recommended)**

Create User Event script to log payment modification attempts:

**File:** `src/FileCabinet/SuiteScripts/RiverSupply/PaymentAudit_UE.js`

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/record'],
    (runtime, record) => {

        const AUTHORIZED_ROLES = [3, 1010, 1015]; // Admin, AR Mgr, Accounting

        /**
         * Before Submit: Log payment changes
         */
        function beforeSubmit(context) {
            if (context.type === context.UserEventType.CREATE) {
                return; // Allow all roles to create
            }

            const currentUser = runtime.getCurrentUser();
            const userRole = parseInt(currentUser.role);

            // If unauthorized role attempting edit/delete
            if (!AUTHORIZED_ROLES.includes(userRole)) {
                log.error('Unauthorized Payment Modification Attempt', {
                    recordType: context.newRecord.type,
                    recordId: context.newRecord.id,
                    user: currentUser.id,
                    userName: currentUser.name,
                    role: userRole,
                    action: context.type,
                    timestamp: new Date().toISOString()
                });

                throw error.create({
                    name: 'INSUFFICIENT_PERMISSION',
                    message: 'You do not have permission to modify payments. Contact AR team.',
                    notifyOff: false
                });
            }

            // For authorized users, log the change for audit trail
            if (context.type === context.UserEventType.EDIT) {
                const oldRecord = context.oldRecord;
                const newRecord = context.newRecord;

                log.audit('Payment Modified by Authorized User', {
                    recordType: newRecord.type,
                    recordId: newRecord.id,
                    user: currentUser.name,
                    role: userRole,
                    oldAmount: oldRecord.getValue({ fieldId: 'payment' }),
                    newAmount: newRecord.getValue({ fieldId: 'payment' }),
                    oldCustomer: oldRecord.getText({ fieldId: 'customer' }),
                    newCustomer: newRecord.getText({ fieldId: 'customer' })
                });
            }

            if (context.type === context.UserEventType.DELETE) {
                log.audit('Payment Deleted by Authorized User', {
                    recordType: context.oldRecord.type,
                    recordId: context.oldRecord.id,
                    user: currentUser.name,
                    role: userRole,
                    amount: context.oldRecord.getValue({ fieldId: 'payment' }),
                    customer: context.oldRecord.getText({ fieldId: 'customer' })
                });
            }
        }

        return {
            beforeSubmit: beforeSubmit
        };
    });
```

**Script Deployment:**
```
Deploy to both:
1. Customer Payment record type
2. Customer Deposit record type

Script Record:
- Name: Payment Modification Audit
- ID: customscript_payment_audit_ue
- Script File: PaymentAudit_UE.js

Script Deployment:
- Status: Released
- Record Types: Customer Payment, Customer Deposit
- Event Type: ☑ Before Submit (Edit, Delete)
- Audience: All Roles
```

**Step 6: Update Custom Sales Order Form (UI Hint)**

Add help text to Billing subtab to inform users:

```
Navigate to: Customization → Forms → Entry Forms → [Your Custom SO Form] → Edit

Billing Subtab:
1. Add a "Help" field (display-only text field)
2. Text: "Payments can be added to this order but cannot be edited or deleted. Contact AR team for payment adjustments."
3. Position near payment/deposit fields
```

#### Testing Checklist

**Sales Rep Testing:**
- [ ] Can create new Customer Payment linked to SO
- [ ] Can view existing payments on SO
- [ ] CANNOT click Edit on existing payment record
- [ ] CANNOT delete existing payment record
- [ ] Receives clear error message if attempted

**AR Manager Testing:**
- [ ] Can create new payments
- [ ] CAN edit existing payments
- [ ] CAN delete payments if needed
- [ ] No restrictions on payment management

**Edge Cases:**
- [ ] SO with multiple payments → All restrictions apply
- [ ] Partial payment → Can add additional, cannot modify original
- [ ] Overpayment scenario → AR can adjust
- [ ] Payment reversal → AR only

**Audit Testing:**
- [ ] All unauthorized attempts logged
- [ ] All authorized changes logged
- [ ] Log includes user, role, timestamp
- [ ] Log accessible to administrators

#### User Communication

**Training Document for Sales Team:**
```markdown
# Customer Payments on Sales Orders - Updated Policy

## What Changed?

You can ADD customer payments to sales orders, but you cannot EDIT or DELETE existing payments.

## How to Add a Payment

1. Open the Sales Order
2. Click "Apply Payment" or "Receive Payment" button
3. Enter payment details
4. Save

✅ Payment is now recorded and locked

## What If I Need to Change a Payment?

Contact the AR team:
- Email: ar@example.com
- Extension: x1234

Provide:
- Sales Order number
- Payment amount
- What needs to change
- Reason for change

## Why This Policy?

- Protects customer deposits
- Maintains accurate financial records
- Ensures proper approval process
- Creates clear audit trail

## FAQ

**Q: I entered the wrong payment amount. Can I fix it?**
A: No. Contact AR team immediately. They will void the incorrect payment and create a new one.

**Q: Customer wants refund of deposit. Can I delete the payment?**
A: No. Contact AR team. They will process the refund properly.

**Q: I can't see the Edit button on a payment. Is this a bug?**
A: No. This is the new security policy. Only AR team can edit payments.
```

#### Validation Queries

```sql
-- List all payments on SOs created/modified in last 30 days
SELECT
    t.tranid as so_number,
    cp.tranid as payment_number,
    cp.trandate as payment_date,
    cp.payment as amount,
    e.entityid as created_by,
    r.name as role,
    cp.lastmodifieddate,
    e2.entityid as last_modified_by
FROM transaction t
JOIN transaction cp ON t.id = cp.createdfrom
JOIN entity e ON cp.createdby = e.id
JOIN role r ON r.id = (SELECT role FROM employee WHERE entity = e.id)
LEFT JOIN entity e2 ON cp.lastmodifiedby = e2.id
WHERE t.type = 'SalesOrd'
    AND cp.type IN ('CustPymt', 'CustDep')
    AND cp.createddate >= CURRENT_DATE - 30
ORDER BY cp.createddate DESC

-- Identify any payments edited by unauthorized roles
SELECT
    cp.tranid,
    cp.trandate,
    cp.payment,
    e.entityid as modified_by,
    r.name as role,
    cp.lastmodifieddate
FROM transaction cp
JOIN entity e ON cp.lastmodifiedby = e.id
JOIN role r ON r.id = (SELECT role FROM employee WHERE entity = e.id)
WHERE cp.type IN ('CustPymt', 'CustDep')
    AND cp.lastmodifieddate >= CURRENT_DATE - 7
    AND r.id NOT IN (3, 1010, 1015)  -- Not authorized roles
ORDER BY cp.lastmodifieddate DESC
```

#### Alternative Approaches

**Option A: Read-Only Sublist on SO Form**

Instead of restricting at record level, make payment sublist read-only on SO form:
- Pros: Simpler implementation
- Cons: Doesn't prevent direct access to payment record, only UI restriction

**Option B: Approval Workflow**

Allow edits but require approval:
- Sales rep can request payment edit
- Workflow routes to AR manager for approval
- AR manager approves or denies
- Pros: More flexible, maintains sales rep productivity
- Cons: More complex, approval bottleneck

**Option C: Hybrid Approach**

- Allow edits within 1 hour of creation (for immediate error correction)
- Lock after 1 hour
- Pros: Balances flexibility and security
- Cons: Complex logic, potential for abuse

#### Success Criteria

✅ Sales reps can add payments to SOs
✅ Sales reps CANNOT edit existing payments
✅ Sales reps CANNOT delete existing payments
✅ AR team has full payment management capability
✅ All unauthorized attempts logged
✅ Clear error messages guide users to proper process
✅ Zero unauthorized payment modifications in audit log

---

### ISSUE #29: Accounting - Auto-Populate from Customer & View Only
**Section:** Sales Order - Accounting
**Request:** Accounting should pull over from customer card and view only
**Priority:** HIGH
**Complexity:** HIGH
**Estimated Effort:** 4-6 hours

#### Current State Analysis

**Accounting Subtab Fields:**
- Class
- Department
- Location
- Subsidiary (if OneWorld)
- Accounting Book (if Advanced Revenue Management)

**Standard NetSuite Behavior:**
- These fields MAY auto-populate from customer, depending on setup
- Fields are typically editable on SO
- Override allowed for order-specific accounting treatment

**Client Request:**
- Ensure ALL accounting fields auto-populate from customer master
- Make fields VIEW ONLY (read-only) for most users
- Maintain data integrity and consistent accounting

#### Business Impact Assessment

**Why Make Accounting Fields Read-Only?**

**Pros:**
- Consistent GL posting per customer
- Prevents incorrect departmental allocation
- Simplifies month-end accounting reconciliation
- Reduces training burden on sales team
- Maintains data integrity

**Cons:**
- No flexibility for project-based allocation
- Cannot handle multi-department customers
- May require customer master updates for exceptions
- Limits order-level reporting granularity

**Critical Questions to Ask Client:**

1. **Are there customers that span multiple departments?**
   - Example: Large customer with orders for Dept A and Dept B
   - If yes, read-only accounting may be too restrictive

2. **Are there project-based sales that need unique class/dept?**
   - Example: Special project orders that need different allocation
   - If yes, may need role-based override capability

3. **How are drop ship orders handled?**
   - May need different location for drop ship vs. stock orders

4. **Are there inter-company transactions?**
   - May need different subsidiary allocation

**Recommended Approach:**
- Make fields auto-populate from customer (mandatory)
- Make read-only for Sales roles
- Keep editable for Accounting roles (for exceptions)
- Add approval workflow if override needed

#### Accounting Field Auto-Population Setup

First, ensure customer master has these fields and they're configured to flow to transactions:

**Step 1: Verify Customer Master Fields**

```
Navigate to: Lists → Relationships → Customers → [Sample Customer] → Edit

Check these subtabs:
1. Classification subtab:
   - Class
   - Department
   - Location

2. Financial subtab:
   - Accounting Book (if ARM enabled)
   - Subsidiary (if OneWorld enabled)

Verify these fields are populated on customer records.
```

**Step 2: Configure Auto-Population**

NetSuite SHOULD auto-populate these fields, but may require configuration:

```
Navigate to: Setup → Accounting → Accounting Preferences

Check settings:
- "Default Department from Customer" → ☑ Checked
- "Default Class from Customer" → ☑ Checked
- "Default Location from Customer" → ☑ Checked

If these options don't exist, proceed to workflow approach.
```

#### Implementation: Workflow + Field Security

**Step 1: Create Workflow for Auto-Population**

```
Navigate to: Customization → Scripting → Workflows → New

Workflow Configuration:
- Name: Sales Order - Accounting Fields Auto-Populate & Lock
- ID: customworkflow_so_acct_lock
- Record Type: Sales Order
- Description: "Populates accounting fields from customer and restricts editing"

Workflow Settings:
- Release Status: Released
- Execute as Admin: No
- Trigger Type: ☑ Before Record Load (Create, Edit, View)
- Log Executions: Yes
```

**Step 2: Add Workflow States and Actions**

```
State Name: Set Accounting Fields

Actions (Before Load):

Action 1: Set Class
- Action Type: Set Field Value
- Field: Class (class)
- Value Type: Formula
- Formula: {entity.class}

Action 2: Set Department
- Action Type: Set Field Value
- Field: Department (department)
- Value Type: Formula
- Formula: {entity.department}

Action 3: Set Location
- Action Type: Set Field Value
- Field: Location (location)
- Value Type: Formula
- Formula: {entity.location}

Action 4: Set Display Type - Read Only for Sales
- Action Type: Set Display Type
- Fields: class, department, location
- Display Type: Disabled
- Condition: {role} IN (1009, 1011, 1012)  -- Sales roles
- Description: "Lock accounting fields for sales team"

Action 5: Set Display Type - Editable for Accounting
- Action Type: Set Display Type
- Fields: class, department, location
- Display Type: Normal
- Condition: {role} IN (3, 1010, 1015)  -- Admin, AR Mgr, Accounting
- Description: "Allow accounting team to override if needed"
```

**Step 3: Get Role Internal IDs**

Run query to map roles:
```sql
SELECT
    name,
    scriptid,
    id
FROM role
WHERE isinactive = 'F'
    AND (
        name LIKE '%Sales%' OR
        name LIKE '%AR%' OR
        name LIKE '%Account%' OR
        name LIKE '%Admin%'
    )
ORDER BY name
```

Update workflow formulas with actual role IDs.

**Step 4: Update Custom Sales Order Form**

```
Navigate to: Customization → Forms → Entry Forms → [Your Custom SO Form] → Edit

Accounting Subtab:
1. Verify all accounting fields are present:
   - Class
   - Department
   - Location
   - (Subsidiary if OneWorld)

2. Add help text field:
   - Label: "Accounting Information"
   - Type: Help (inline text)
   - Text: "These fields auto-populate from the customer master record and are managed by the accounting team. Contact accounting for changes."
```

**Step 5: Apply Workflow to Form**

```
Form Editor → Workflows subtab
→ Add: Sales Order - Accounting Fields Auto-Populate & Lock
→ Save
```

#### Alternative Implementation: User Event Script

For more complex logic or multi-location scenarios:

**File:** `src/FileCabinet/SuiteScripts/RiverSupply/SO_AccountingLock_UE.js`

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/ui/serverWidget'],
    (record, search, runtime, serverWidget) => {

        const RESTRICTED_ROLES = [1009, 1011, 1012]; // Sales roles
        const AUTHORIZED_ROLES = [3, 1010, 1015]; // Accounting roles

        /**
         * Before Load: Populate and lock accounting fields
         */
        function beforeLoad(context) {
            if (context.type !== context.UserEventType.VIEW &&
                context.type !== context.UserEventType.EDIT &&
                context.type !== context.UserEventType.CREATE) {
                return;
            }

            const soRecord = context.newRecord;
            const form = context.form;
            const currentUser = runtime.getCurrentUser();
            const userRole = parseInt(currentUser.role);

            // Get customer ID
            const customerId = soRecord.getValue({ fieldId: 'entity' });

            if (customerId) {
                // Get customer accounting fields
                const customerAccounting = getCustomerAccounting(customerId);

                // Auto-populate if not already set
                populateAccountingFields(soRecord, customerAccounting);

                // Set field display types based on role
                setAccountingFieldSecurity(form, userRole);
            }
        }

        /**
         * Get accounting field values from customer master
         */
        function getCustomerAccounting(customerId) {
            try {
                const customerFields = search.lookupFields({
                    type: 'customer',
                    id: customerId,
                    columns: ['class', 'department', 'location', 'subsidiary']
                });

                return {
                    class: customerFields.class[0] ? customerFields.class[0].value : null,
                    department: customerFields.department[0] ? customerFields.department[0].value : null,
                    location: customerFields.location[0] ? customerFields.location[0].value : null,
                    subsidiary: customerFields.subsidiary[0] ? customerFields.subsidiary[0].value : null
                };
            } catch (e) {
                log.error('Error fetching customer accounting', e);
                return {};
            }
        }

        /**
         * Populate accounting fields from customer
         */
        function populateAccountingFields(soRecord, customerAccounting) {
            // Only populate if not already set
            const fields = ['class', 'department', 'location', 'subsidiary'];

            fields.forEach(field => {
                const currentValue = soRecord.getValue({ fieldId: field });
                if (!currentValue && customerAccounting[field]) {
                    soRecord.setValue({
                        fieldId: field,
                        value: customerAccounting[field]
                    });

                    log.debug(`Populated ${field}`,
                        `Set ${field} to ${customerAccounting[field]} from customer`);
                }
            });
        }

        /**
         * Set field security based on user role
         */
        function setAccountingFieldSecurity(form, userRole) {
            const accountingFields = ['class', 'department', 'location', 'subsidiary'];

            accountingFields.forEach(fieldId => {
                const field = form.getField({ id: fieldId });
                if (!field) return; // Field may not exist in all configs

                if (RESTRICTED_ROLES.includes(userRole)) {
                    // Make read-only for sales
                    field.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.INLINE
                    });

                    log.audit('Accounting Field Locked',
                        `Field ${fieldId} set to read-only for role ${userRole}`);

                } else if (AUTHORIZED_ROLES.includes(userRole)) {
                    // Ensure editable for accounting
                    field.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.NORMAL
                    });
                }
            });
        }

        /**
         * Before Submit: Validate accounting fields haven't been tampered
         */
        function beforeSubmit(context) {
            if (context.type === context.UserEventType.DELETE) {
                return;
            }

            const currentUser = runtime.getCurrentUser();
            const userRole = parseInt(currentUser.role);

            // If restricted role, verify accounting matches customer
            if (RESTRICTED_ROLES.includes(userRole)) {
                const newRecord = context.newRecord;
                const customerId = newRecord.getValue({ fieldId: 'entity' });
                const customerAccounting = getCustomerAccounting(customerId);

                // Validate each field
                const fields = ['class', 'department', 'location'];
                let hasUnauthorizedChange = false;

                fields.forEach(field => {
                    const soValue = newRecord.getValue({ fieldId: field });
                    const customerValue = customerAccounting[field];

                    if (soValue && soValue !== customerValue) {
                        log.error('Unauthorized Accounting Field Change', {
                            field: field,
                            user: currentUser.id,
                            role: userRole,
                            customer: customerId,
                            customerValue: customerValue,
                            attemptedValue: soValue
                        });

                        // Reset to customer value
                        newRecord.setValue({
                            fieldId: field,
                            value: customerValue
                        });

                        hasUnauthorizedChange = true;
                    }
                });

                if (hasUnauthorizedChange) {
                    log.audit('Accounting Fields Reset',
                        'Unauthorized changes reverted to customer master values');
                }
            }
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        };
    });
```

**Script Deployment:**
```
Script Record:
- Name: SO Accounting Fields Lock
- ID: customscript_so_acct_lock_ue
- Script File: SO_AccountingLock_UE.js

Script Deployment:
- Status: Released
- Record Type: Sales Order
- Event Types: ☑ Before Load, ☑ Before Submit
- Audience: All Roles
```

#### Special Considerations

**OneWorld Accounts:**
If using OneWorld (multi-subsidiary):
- Subsidiary field is critical for correct GL posting
- MUST be locked to customer's subsidiary
- Add special validation to prevent cross-subsidiary errors

**Advanced Revenue Management:**
If using ARM (multiple accounting books):
- Accounting Book field may need similar controls
- Consult with accounting team on requirements

**Multi-Entity Customers:**
Some customers may have orders that need different accounting:
- Example: Customer has retail and wholesale divisions
- May need custom field to indicate order type
- Then dynamically set accounting fields based on order type

**Drop Ship Orders:**
- May need different location (vendor location vs. warehouse)
- Consider exception for order type = Drop Ship

#### Testing Checklist

**Auto-Population Testing:**
- [ ] Select customer → Class auto-populates
- [ ] Select customer → Department auto-populates
- [ ] Select customer → Location auto-populates
- [ ] Change customer → Accounting fields update
- [ ] Customer with blank accounting → SO fields remain blank

**Field Security Testing (Sales Rep):**
- [ ] Class field is greyed out
- [ ] Department field is greyed out
- [ ] Location field is greyed out
- [ ] Cannot edit any accounting field
- [ ] Save SO → Accounting fields save correctly

**Field Security Testing (Accounting Role):**
- [ ] Class field is editable
- [ ] Department field is editable
- [ ] Location field is editable
- [ ] Can override customer values if needed
- [ ] Save SO → Override values save correctly

**Edge Cases:**
- [ ] SO copied from existing → Accounting resets to customer
- [ ] SO created from estimate → Accounting populated correctly
- [ ] SO with no customer selected → Accounting fields blank/editable
- [ ] Customer changed mid-entry → Accounting updates

**Integration Testing:**
- [ ] GL impact report shows correct accounting segments
- [ ] Financial reports by class/dept show SO data correctly
- [ ] Invoice inherits SO accounting fields
- [ ] Item fulfillment inherits SO accounting fields

#### Validation Queries

```sql
-- Check if SOs have different accounting than their customer
SELECT
    t.tranid,
    c.companyname,
    c.class as cust_class,
    cl1.name as cust_class_name,
    t.class as so_class,
    cl2.name as so_class_name,
    c.department as cust_dept,
    d1.name as cust_dept_name,
    t.department as so_dept,
    d2.name as so_dept_name
FROM transaction t
JOIN customer c ON t.entity = c.id
LEFT JOIN classification cl1 ON c.class = cl1.id
LEFT JOIN classification cl2 ON t.class = cl2.id
LEFT JOIN department d1 ON c.department = d1.id
LEFT JOIN department d2 ON t.department = d2.id
WHERE t.type = 'SalesOrd'
    AND t.trandate >= CURRENT_DATE - 30
    AND (
        t.class IS DISTINCT FROM c.class OR
        t.department IS DISTINCT FROM c.department
    )
ORDER BY t.trandate DESC

-- Verify workflow executions
SELECT
    COUNT(*) as executions,
    status,
    DATE(startdate) as execution_date
FROM workflowinstance
WHERE name = 'Sales Order - Accounting Fields Auto-Populate & Lock'
    AND startdate >= CURRENT_DATE - 7
GROUP BY status, DATE(startdate)
ORDER BY execution_date DESC
```

#### User Communication

**Email to Sales Team:**
```
Subject: Update to Sales Order Accounting Fields

Team,

Effective [DATE], the accounting fields (Class, Department, Location) on Sales Orders will:

1. ✅ Automatically populate from customer master
2. 🔒 Be read-only for sales roles

What this means for you:
- You don't need to fill in accounting fields manually
- You cannot change accounting fields on orders
- Accounting info flows from customer setup

If a customer needs different accounting:
- Contact accounting team BEFORE creating the order
- They will update the customer master
- Then your order will have correct accounting

Why this change:
- Ensures accurate financial reporting
- Reduces order entry time
- Maintains consistent accounting treatment
- Prevents data entry errors

Questions? Contact [Accounting Manager]

Thank you,
Operations Team
```

#### Success Criteria

✅ All accounting fields auto-populate from customer 100% of time
✅ Sales reps cannot edit accounting fields
✅ Accounting team CAN edit if needed (for exceptions)
✅ GL posting uses correct class/dept/location
✅ Financial reports show accurate data by segment
✅ No unauthorized accounting overrides in audit log
✅ User feedback confirms improved data accuracy

---

### ISSUE #30: Relationships - Contact Integration
**Section:** Sales Order - Relationships
**Question:** Is this contact people for customer? Does this save with the customer if something is added?
**Priority:** MEDIUM
**Complexity:** MEDIUM
**Estimated Effort:** 2-3 hours (documentation + testing)

#### Current State Analysis

**Relationships Subtab Purpose:**
The Relationships subtab on Sales Orders shows related records:
- Contacts associated with the customer
- Other related transactions
- Related opportunities or estimates

**Standard Behavior:**
1. **Contacts Field** - This IS the contact people for the customer
2. **Source** - Contacts come from customer master record
3. **Adding Contacts** - You CAN add contacts here, but behavior varies

#### Key Question: Where Do New Contacts Get Saved?

**Answer: It Depends on How They're Added**

**Scenario 1: Select Existing Contact**
- Choose contact from dropdown
- Contact already exists on customer master
- **Result:** No new record created, just links existing contact to this SO

**Scenario 2: Create New Contact Inline**
- Some forms allow "Add New" contact directly on SO
- **Result:** New contact IS added to customer master (permanent)
- Contact will appear on all future transactions for this customer

**Scenario 3: Transaction-Only Contact (Custom Implementation)**
- Some companies create transaction-specific contact field
- **Result:** Contact stored on transaction only, not on customer

#### Client Needs Clarification

**Questions to Ask:**

1. **Do you want contacts to be permanent (saved to customer)?**
   - If YES → Use standard Contacts field (default behavior)
   - If NO → Need custom "Transaction Contact" field

2. **Do you want to limit which contacts appear on SO?**
   - Example: Only show contacts with "Sales Contact" role
   - Requires custom filtering

3. **Do you need order-specific contact information?**
   - Example: Different contact for shipping vs. billing
   - May need multiple contact fields

4. **Do you want contact information to appear on order forms?**
   - Pick ticket, packing slip, invoice
   - May need to add contact details to print templates

#### Recommended Implementation

**Option A: Use Standard Contacts (RECOMMENDED for Most Cases)**

Leverage native NetSuite functionality:
- Contacts managed on customer master
- Automatically available on all transactions
- No custom development needed

**Setup Steps:**
1. Ensure Contacts subtab visible on custom SO form
2. Configure contact roles (Sales Contact, Shipping Contact, etc.)
3. Add contacts to customer master records
4. Contacts automatically appear on SO

**Option B: Add Transaction-Specific Contact Field**

For order-specific contact needs:
- Create custom "Order Contact" field
- Stores contact info on this SO only
- Does not update customer master

**Option C: Multiple Contact Fields by Purpose**

For complex contact management:
- Billing Contact (flows from customer)
- Shipping Contact (can be different)
- Order Placed By (who placed this specific order)
- Sales Rep Contact (internal)

#### Detailed Implementation: Standard Contacts

**Step 1: Verify Contacts Subtab on Form**

```
Navigate to: Customization → Forms → Entry Forms → [Your Custom SO Form] → Edit

Check Relationships Subtab:
1. Find "Contacts" sublist
2. Ensure Display checkbox is CHECKED
3. If not present, add it:
   - Screen Fields → Relationships subtab
   - Add "Contacts" to list
```

**Step 2: Configure Contact Roles (For Filtering)**

```
Navigate to: Lists → Relationships → Contacts → Contact Roles

Create roles:
1. Sales Contact
   - ID: sales_contact
   - Description: "Primary sales contact"

2. Shipping Contact
   - ID: shipping_contact
   - Description: "Receives shipment notifications"

3. Billing Contact
   - ID: billing_contact
   - Description: "Receives invoices"

4. Technical Contact
   - ID: tech_contact
   - Description: "Technical questions"
```

**Step 3: Add Contacts to Customer Master**

```
Navigate to: Lists → Relationships → Customers → [Customer] → Edit

Contacts Subtab:
1. Click "New Contact"
2. Enter contact information:
   - First Name
   - Last Name
   - Email
   - Phone
   - Role: Select from roles created above
3. Check "Main Contact" if applicable
4. Save

Repeat for all customer contacts.
```

**Step 4: Configure Contact Display on SO**

By default, ALL customer contacts appear. To filter:

**Create Workflow to Filter Contacts:**

```
Navigate to: Customization → Scripting → Workflows → New

Workflow Configuration:
- Name: Sales Order - Filter Contacts
- ID: customworkflow_so_filter_contacts
- Record Type: Sales Order

This is complex - may require SuiteScript instead.
```

**Alternative: Client Script to Filter Contacts Dynamically**

**File:** `src/FileCabinet/SuiteScripts/RiverSupply/SO_ContactFilter_CS.js`

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
    (record, search) => {

        /**
         * Page Init: Load relevant contacts
         */
        function pageInit(context) {
            const currentRecord = context.currentRecord;
            loadRelevantContacts(currentRecord);
        }

        /**
         * Field Changed: Reload contacts if customer changes
         */
        function fieldChanged(context) {
            if (context.fieldId === 'entity') {
                const currentRecord = context.currentRecord;
                loadRelevantContacts(currentRecord);
            }
        }

        /**
         * Load contacts relevant to sales orders
         */
        function loadRelevantContacts(currentRecord) {
            const customerId = currentRecord.getValue({ fieldId: 'entity' });

            if (!customerId) return;

            // Search for sales-relevant contacts
            const contactSearch = search.create({
                type: 'contact',
                filters: [
                    ['company', 'anyof', customerId],
                    'AND',
                    ['contactrole', 'anyof', ['sales_contact', 'shipping_contact', 'billing_contact']]
                ],
                columns: [
                    'entityid',
                    'email',
                    'phone',
                    'contactrole'
                ]
            });

            const contacts = [];
            contactSearch.run().each(function(result) {
                contacts.push({
                    id: result.id,
                    name: result.getValue('entityid'),
                    email: result.getValue('email'),
                    phone: result.getValue('phone'),
                    role: result.getText('contactrole')
                });
                return true;
            });

            // Log available contacts (for user visibility)
            console.log('Available contacts for this customer:', contacts);
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
        };
    });
```

#### Implementation: Transaction-Specific Contact Field

If client wants contact that does NOT save to customer:

**Step 1: Create Custom Contact Field**

```
Navigate to: Customization → Lists, Records, & Fields → Transaction Body Fields → New

Field Configuration:
- Label: Order Contact
- ID: custbody_order_contact
- Type: Free-Form Text
- Max Length: 100
- Applies To: ☑ Sales Order

Display:
- Subtab: Create new subtab "Order Information" or add to Relationships
- Display Type: Normal

Add help text:
"Enter the name of the person who placed this order. This information is stored with this order only and does not update the customer record."
```

**Step 2: Add to Custom Form**

```
Navigate to: Customization → Forms → Entry Forms → [Your Custom SO Form] → Edit

Add custbody_order_contact field to appropriate subtab
```

**Step 3: Add to Print Templates**

Update sales order print templates to show order contact:
```
Order placed by: ${record.custbody_order_contact}
```

#### Testing & Documentation

**Testing Checklist:**

**Standard Contacts Behavior:**
- [ ] Customer with 3 contacts → All 3 appear on SO
- [ ] Add new contact on customer → Appears on new SOs
- [ ] Add contact inline on SO → Contact added to customer master
- [ ] Contact appears on future SOs for same customer
- [ ] Contact email/phone visible on SO

**Transaction-Specific Field (If Implemented):**
- [ ] Enter contact name in custom field
- [ ] Save SO
- [ ] Open customer master → Custom contact NOT there
- [ ] Create new SO for same customer → Custom contact field empty
- [ ] View saved SO → Custom contact field shows value entered

**Print Templates:**
- [ ] SO print form shows contact information
- [ ] Pick ticket shows shipping contact
- [ ] Invoice shows billing contact

#### Create Documentation for Users

**File:** `src/documentation/SALES_ORDER_CONTACTS_GUIDE.md`

```markdown
# Sales Order Contacts - User Guide

## Overview

The Contacts section on Sales Orders shows people associated with the selected customer.

## How Contacts Work

### Where Do Contacts Come From?

Contacts are stored on the **Customer Master Record** and automatically appear on all transactions for that customer.

### Adding a New Contact

**Option 1: Add to Customer Master (Permanent)**
1. Go to Lists → Relationships → Customers
2. Open the customer
3. Go to Contacts subtab
4. Click "New Contact"
5. Enter contact details
6. Save customer

✅ This contact will now appear on ALL orders for this customer.

**Option 2: Add Inline on Sales Order**
1. On the Sales Order, go to Relationships subtab
2. Click "New" in Contacts section
3. Enter contact details
4. Save order

✅ This contact is added to the customer master and will appear on future orders.

### Contact Roles

Assign roles to contacts for clarity:
- **Sales Contact** - Primary person for sales communications
- **Shipping Contact** - Receives shipment notifications
- **Billing Contact** - Receives invoices and billing inquiries
- **Technical Contact** - Product/technical questions

### Selecting Contact for This Order

To indicate which contact is relevant for this specific order:
1. Use the "Order Contact" field (if available)
2. Or make note in the Memo field

### Contact Information on Printed Forms

Contact information appears on:
- Sales Order printout
- Pick tickets (shipping contact)
- Packing slips (shipping contact)
- Invoices (billing contact)

## FAQ

**Q: If I add a contact on a sales order, will it be saved to the customer?**
A: YES, if you use the Contacts sublist on the Relationships tab.

**Q: Can I add a contact just for this one order?**
A: Use the "Order Contact" custom field (if enabled) for one-time contacts.

**Q: How do I change a customer's contact information?**
A: Update the contact on the customer master record. It will update for all future transactions.

**Q: Can I have different contacts for different order types?**
A: Yes, use Contact Roles to organize contacts by purpose (Sales, Shipping, Billing, etc.).

## Best Practices

1. ✅ Keep customer contacts up to date
2. ✅ Assign appropriate roles to each contact
3. ✅ Mark the primary contact as "Main Contact"
4. ✅ Include email addresses for automated notifications
5. ✅ Use "Order Contact" field for one-time contacts

## Need Help?

Contact your system administrator or NetSuite support team.
```

#### Success Criteria

✅ Contacts subtab visible on Sales Order
✅ Customer contacts automatically appear when customer selected
✅ New contacts can be added (either to customer or transaction-specific)
✅ Contact information appears on print forms
✅ Users understand when contacts save to customer vs. transaction
✅ Documentation created for user training

---

### ISSUE #31: Communication - Print/Email/Fax Options
**Section:** Sales Order - Communication
**Question:** Is this how to print, email, or fax the sales order?
**Priority:** LOW
**Complexity:** LOW
**Estimated Effort:** 1-2 hours (documentation only)

#### Current State Analysis

**Communication Subtab Purpose:**
The Communication subtab tracks communication history and preferences for the transaction.

**Standard Fields Include:**
- Email
- Print
- Fax
- To Be Printed
- To Be Emailed
- To Be Faxed

**These are TRACKING fields, not ACTION buttons.**

#### Answer to Client Question

**SHORT ANSWER:**
No, the Communication subtab is NOT how you print, email, or fax the order. It's where NetSuite TRACKS whether the order has been printed/emailed/faxed.

**HOW TO ACTUALLY PRINT/EMAIL/FAX:**

1. **Print Sales Order:**
   - Open the Sales Order
   - Click "Print" button (top right)
   - Or: More → Print Checks and Forms → Sales Order

2. **Email Sales Order:**
   - Open the Sales Order
   - Click "Email" button (top right)
   - Or: More → Send Email

3. **Fax Sales Order:**
   - NetSuite native fax is deprecated
   - Use third-party integration (eFax, etc.)
   - Or print and manually fax

**What the Communication Subtab Does:**
- Records when order was printed
- Records when order was emailed
- Stores email template used
- Tracks communication history

#### Communication Subtab Fields Explained

| Field | Purpose | How It Gets Set |
|-------|---------|----------------|
| **To Be Printed** | Checkbox flag | Manually checked, or workflow sets it |
| **To Be Emailed** | Checkbox flag | Manually checked, or workflow sets it |
| **To Be Faxed** | Checkbox flag | Manually checked, or workflow sets it |
| **Printed** | Date printed | Auto-set when "Print" button clicked |
| **Emailed** | Date emailed | Auto-set when "Email" button clicked |
| **Faxed** | Date faxed | Auto-set if fax integration used |
| **Email Template** | Template used | Set when email sent |

#### Common Confusion Points

**Confusion #1: "I checked 'To Be Emailed' but nothing happened"**
- Explanation: "To Be Emailed" is a FLAG, not an action
- To actually email, click the "Email" button
- The flag is used for batch processing or workflow triggers

**Confusion #2: "Where's the Send button?"**
- Explanation: The "Email" or "Print" buttons are at the top of the form
- Not on the Communication subtab
- Communication subtab just shows history

**Confusion #3: "Fax doesn't work"**
- Explanation: NetSuite no longer has native fax
- Must use third-party fax integration
- Most companies have moved to email delivery

#### Implementation: No Changes Needed

**Assessment:** The Communication subtab works as designed. No customization required.

**What IS Needed:** User training and documentation.

#### Create User Documentation

**File:** `c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\River-Supply-SB\docs\SALES_ORDER_COMMUNICATION_GUIDE.md`

```markdown
# Sales Order Communication Guide

## How to Send Sales Orders to Customers

### Printing a Sales Order

**Method 1: Quick Print**
1. Open the Sales Order
2. Click the "Print" button at the top right
3. Select "Sales Order" form
4. Click "Print" in the PDF preview

**Method 2: Print Multiple Orders**
1. Go to Transactions → Sales → Enter Sales Orders
2. Check the boxes next to orders to print
3. Click "Print Checks & Forms"
4. Select orders and print

**After Printing:**
- The "Printed" field on Communication subtab will show today's date
- This helps track which orders have been sent to customers

### Emailing a Sales Order

**Method 1: Email from Order**
1. Open the Sales Order
2. Click the "Email" button at the top right
3. Verify/edit the recipient email address
4. Select email template (or use default)
5. Review message
6. Click "Send"

**Method 2: Scheduled Delivery**
1. Check the "To Be Emailed" box on Communication subtab
2. Save the order
3. Scheduled workflow will email it automatically

**After Emailing:**
- The "Emailed" field will show the date sent
- The email template used is recorded
- A copy is stored in communication history

### Faxing a Sales Order

**Current Fax Capabilities:**
NetSuite's native fax feature has been deprecated. To fax a sales order:

**Option 1: Third-Party Fax Integration**
If your company has eFax or similar integration:
1. Open the Sales Order
2. Click the integrated fax button
3. Enter fax number
4. Send

**Option 2: Manual Fax**
1. Print the Sales Order (see above)
2. Fax using physical fax machine or scan-to-fax
3. Manually update Communication subtab:
   - Check "To Be Faxed" box
   - Or add note in Memo

### What is the Communication Subtab?

The Communication subtab **TRACKS** when orders were sent, it doesn't **SEND** orders.

**Fields on Communication Subtab:**

| Field | What It Means |
|-------|--------------|
| To Be Printed | Order is flagged to be printed (batch processing) |
| To Be Emailed | Order is flagged to be emailed (batch processing) |
| To Be Faxed | Order is flagged to be faxed (legacy) |
| Printed | Date the order was last printed |
| Emailed | Date the order was last emailed |
| Email Template | Which email template was used |

**These are tracking fields, not action buttons.**

## Email Templates

### Standard Templates

NetSuite provides default templates:
- Standard Sales Order Email
- Sales Order Confirmation
- Custom templates (created by your admin)

### Customizing Email Content

To customize what's sent:
1. Setup → Communication → Email Templates
2. Find "Sales Order" templates
3. Edit template:
   - Subject line
   - Message body
   - Which fields to include
   - Attachments (PDF, Excel, etc.)

**Note:** Template changes require Administrator permission.

### Email Preferences

Set default email preferences:
1. Setup → Company → Company Preferences
2. Go to Communication category
3. Set defaults:
   - Default "From" email address
   - Default reply-to address
   - Email format (HTML or Plain Text)
   - Include PDF attachment

## Batch Processing

### Printing Multiple Orders

**Use Case:** Print all orders for today's shipments

1. Create Saved Search:
   - Type: Transaction (Sales Order)
   - Criteria: Ship Date = Today, Status = Pending Fulfillment

2. Run Search
3. Check orders to print
4. Click "Print Checks & Forms"
5. Print batch

### Emailing Multiple Orders

**Use Case:** Email all orders flagged "To Be Emailed"

1. Create Saved Search:
   - Type: Transaction (Sales Order)
   - Criteria: To Be Emailed = Yes

2. Run Search
3. Check orders
4. Use Mass Update to send emails or trigger workflow

## Automated Communication Workflows

### Auto-Email on Order Approval

If you want orders automatically emailed when approved:

**Workflow: Auto-Email Approved Orders**
1. Trigger: When order status → Pending Fulfillment
2. Action: Send Email
   - To: Customer email
   - Template: Sales Order Confirmation
   - Attachment: Sales Order PDF

**This requires workflow setup by administrator.**

### Auto-Print on Order Creation

If you want orders to auto-print at a printer:

**Workflow: Auto-Print Orders**
1. Trigger: On Create
2. Condition: Location = Main Warehouse
3. Action: Set "To Be Printed" = Yes
4. Scheduled script prints flagged orders to designated printer

**This requires workflow + script setup.**

## Troubleshooting

### "Email Button is Missing"

**Cause:** You may not have email permission for Sales Orders
**Solution:** Contact your administrator to add "Email" permission to your role

### "Print Button Doesn't Work"

**Cause:** PDF may be blocked by browser
**Solution:** Allow pop-ups from NetSuite in your browser settings

### "Customer Didn't Receive Email"

**Check:**
1. Communication subtab shows "Emailed" date → Email was sent
2. Check customer email address is correct
3. Check customer's spam folder
4. Resend email from Communication History

### "Wrong Email Template Used"

**Solution:**
1. Setup → Company → Preferences
2. Change default Sales Order email template
3. Or manually select template each time you email

## Best Practices

1. ✅ **Always verify customer email before sending**
2. ✅ **Use templates for consistent branding**
3. ✅ **Include PDF attachment for customer records**
4. ✅ **Review order before emailing (check prices, quantities)**
5. ✅ **Use "To Be Emailed" flag for batch processing**
6. ✅ **Check Communication subtab to confirm order was sent**

## Quick Reference

| I Want To... | What I Do |
|--------------|-----------|
| Print one order | Open order → Click "Print" button |
| Email one order | Open order → Click "Email" button |
| Print many orders | Saved search → Check orders → Print Checks & Forms |
| Email many orders | Saved search → Check orders → Mass Update or Workflow |
| See if order was emailed | Check "Emailed" date on Communication subtab |
| Change email template | Setup → Communication → Email Templates |
| Fax an order | Print order → Fax manually (NetSuite fax deprecated) |

## Need Help?

Contact your NetSuite administrator or IT support team.
```

#### Testing & Validation

**Create Test Scenarios Document:**

```markdown
# Communication Testing Checklist

## Test 1: Print Sales Order
- [ ] Open test SO
- [ ] Click "Print" button
- [ ] PDF displays correctly
- [ ] All order details visible
- [ ] Company logo appears
- [ ] Pricing correct
- [ ] After printing, "Printed" date field populated

## Test 2: Email Sales Order
- [ ] Open test SO
- [ ] Click "Email" button
- [ ] Email dialog appears
- [ ] Recipient address correct (from customer master)
- [ ] Subject line appropriate
- [ ] Message body looks professional
- [ ] PDF attachment included
- [ ] Send email
- [ ] After sending, "Emailed" date field populated
- [ ] Verify recipient received email

## Test 3: Communication Subtab Tracking
- [ ] Communication subtab visible on SO form
- [ ] "Printed" field shows last print date
- [ ] "Emailed" field shows last email date
- [ ] "Email Template" field shows template used
- [ ] History section shows all communications

## Test 4: Batch Printing (If Used)
- [ ] Create saved search for orders to print
- [ ] Check multiple orders
- [ ] Click "Print Checks & Forms"
- [ ] All selected orders print correctly
- [ ] "Printed" date updates on all orders

## Test 5: Workflow Auto-Email (If Implemented)
- [ ] Create new SO
- [ ] Set status to trigger workflow
- [ ] Verify email sent automatically
- [ ] Verify correct template used
- [ ] Verify customer received email
```

#### User Training Plan

**Training Session Agenda:**

1. **Introduction (5 mins)**
   - What is the Communication subtab
   - Why tracking matters

2. **Print Demo (10 mins)**
   - How to print one order
   - How to print multiple orders
   - Show "Printed" date field update

3. **Email Demo (10 mins)**
   - How to email one order
   - Selecting templates
   - Verifying email sent
   - Show "Emailed" date field update

4. **Communication History (5 mins)**
   - How to view past communications
   - How to resend emails
   - How to verify customer received order

5. **Q&A (10 mins)**

**Total Time:** 40 minutes

#### Success Criteria

✅ Users understand difference between Communication subtab (tracking) vs. Print/Email buttons (actions)
✅ Users can successfully print Sales Orders
✅ Users can successfully email Sales Orders
✅ Users know how to verify if order was sent
✅ Documentation created and distributed
✅ Training session completed
✅ No ongoing confusion about Communication subtab purpose

---

### ISSUE #32: Custom Fields - Move to Primary Info Area
**Section:** Sales Order - Custom
**Request:** Is there a way to add this to the Primary Info area instead of hidden - also need to have Contact Name
**Priority:** MEDIUM
**Complexity:** MEDIUM
**Estimated Effort:** 3-4 hours

#### Current State Analysis

**Custom Subtab:**
- NetSuite creates "Custom" subtab by default when custom fields exist
- Custom fields are "hidden" on secondary subtabs
- Not prominent during order entry

**Client Request:**
- Move custom fields to **Primary Information** area
- Specifically need "Contact Name" field visible
- Make fields more accessible during order entry

#### Why Custom Fields Get Hidden

**Default Behavior:**
When you create custom transaction body fields, NetSuite:
1. Auto-creates a "Custom" subtab
2. Places all custom fields there
3. User must click to secondary tab to see them

**Problem:**
- Users may not know custom fields exist
- Secondary tabs get ignored
- Important data not captured

#### Solution Options

**Option 1: Move Fields to Existing Subtabs (RECOMMENDED)**
- Place custom fields on Primary Information, Billing, Shipping, etc.
- Integrated with standard fields
- Most intuitive for users

**Option 2: Rename and Reorganize Custom Subtab**
- Keep custom subtab but make it more prominent
- Rename to something descriptive (e.g., "Additional Info")
- Move to first position

**Option 3: Create New "Order Details" Subtab**
- Custom subtab with business-friendly name
- Group all order-specific custom fields
- Position prominently

#### Recommended Approach: Option 1

Move custom fields to appropriate existing subtabs based on field purpose.

#### Implementation Steps

**Step 1: Identify All Custom Fields**

Run query to see all custom SO fields:
```sql
SELECT
    fieldid,
    label,
    fieldtype,
    description,
    scriptid
FROM customfield
WHERE appliestoexperience = 'SALESORDER'
    OR appliestotransaction = 'SALESORDER'
ORDER BY label
```

Or navigate to:
```
Customization → Lists, Records, & Fields → Transaction Body Fields
Filter: Applies To = Sales Order
```

**Document current custom fields:**

| Field ID | Label | Current Location | Desired Location |
|----------|-------|------------------|------------------|
| custbody_contact_name | Contact Name | Custom subtab | Primary Information |
| custbody_??? | ??? | Custom subtab | ??? |

**Step 2: Create or Update Contact Name Field**

If "Contact Name" field doesn't exist, create it:

```
Navigate to: Customization → Lists, Records, & Fields → Transaction Body Fields → New

Field Configuration:
- Label: Contact Name
- ID: custbody_contact_name
- Type: Free-Form Text
- Max Length: 100
- Applies To: ☑ Sales Order
- Description: "Name of the contact person for this order"

Display Tab:
- Subtab: Main (this is Primary Information)
- Field Group: (create new) "Contact Information"
- Display Type: Normal

Validation & Defaulting Tab:
- Default Value: (leave blank)
- Mandatory: No (or Yes if required)
```

**Step 3: Update Custom Sales Order Form**

```
Navigate to: Customization → Forms → Entry Forms → [Your Custom SO Form] → Edit

Form Editor:
1. Go to "Screen Fields" → "Main" tab (Primary Information)

2. Find your custom field in the "Available Fields" list
   - Look for: custbody_contact_name

3. Check the box next to the field to make it visible

4. Drag the field to desired position
   - Recommended: Place near "Customer" field or in contact section

5. Configure field display:
   - Show: ☑ Checked
   - Display Type: Normal (editable)
   - Label: Contact Name (verify)

6. Create field group if desired:
   - Custom Fields → New Group
   - Name: "Contact Information"
   - Add custbody_contact_name to this group

7. Save form
```

**Step 4: Position Field Optimally**

**Recommended Placement for "Contact Name":**

```
Primary Information Section Layout:

Customer: [Customer Name Dropdown]
Contact Name: [Text Field]  ← NEW FIELD HERE
Email: [Email Field]
Phone: [Phone Field]

-OR-

Sales Rep: [Sales Rep Dropdown]
Order Date: [Date Field]
Contact Name: [Text Field]  ← NEW FIELD HERE
```

**Field Positioning Tips:**
- Place near related fields (customer, email)
- Group with other contact-related fields
- Consider left vs. right column
- Don't place too far down (may require scrolling)

**Step 5: Test Field Visibility**

Create test sales order:
- [ ] Contact Name field visible on Primary Information
- [ ] Field is editable
- [ ] Field saves with transaction
- [ ] Field appears on saved record
- [ ] No "Custom" subtab remaining (if all fields moved)

#### Handling Multiple Custom Fields

If there are MANY custom fields beyond Contact Name:

**Organize by Purpose:**

| Field Purpose | Move To Subtab |
|---------------|----------------|
| Contact info | Primary Information |
| Order instructions | Primary Information or new "Order Details" subtab |
| Shipping preferences | Shipping subtab |
| Billing preferences | Billing subtab |
| Internal notes | Communication subtab |
| Accounting codes | Accounting subtab |

**Step-by-Step for Each Field:**

1. **Identify field purpose**
   - What information does it capture?
   - When in the process do users need it?

2. **Select target subtab**
   - Choose most logical location
   - Group similar fields together

3. **Update field configuration**
   ```
   Edit field → Display tab → Subtab: [Select new subtab]
   ```

4. **Update custom form**
   - Add field to selected subtab
   - Position appropriately
   - Test visibility

#### Alternative: Consolidate Custom Fields into One Subtab

If client wants custom fields together (not scattered):

**Create Dedicated "Order Details" Subtab:**

```
Navigate to: Customization → Forms → Entry Forms → [Your Custom SO Form] → Edit

1. Custom Code tab → Add Custom Tab
   - Label: "Order Details"
   - Tab ID: custpage_order_details

2. Screen Fields → Custom "Order Details" tab
   - Add all custom fields to this tab
   - Organize in logical order
   - Group related fields

3. Tab Ordering
   - Move "Order Details" tab to position 2 (right after Primary Information)
   - Ensure it's visible by default

4. Save form
```

**Result:**
Users see prominent "Order Details" tab with all custom fields organized.

#### Integration: Auto-Populate Contact Name from Customer

**Enhancement:** Auto-populate Contact Name from customer's primary contact

**Workflow Approach:**

```
Navigate to: Customization → Scripting → Workflows → New

Workflow Configuration:
- Name: Sales Order - Auto-Populate Contact Name
- ID: customworkflow_so_populate_contact
- Record Type: Sales Order
- Trigger: Before Record Load (Create, Edit)

State: Set Contact Name

Action: Set Field Value
- Field: custbody_contact_name
- Value Type: Formula
- Formula: {entity.contact}

OR (if want full name from primary contact):
- Formula: {entity.contact.firstname} || ' ' || {entity.contact.lastname}
```

**Script Approach (More Flexible):**

**File:** `src/FileCabinet/SuiteScripts/RiverSupply/SO_ContactAutoPopulate_UE.js`

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
    (record, search) => {

        /**
         * Before Load: Populate contact name from customer
         */
        function beforeLoad(context) {
            if (context.type !== context.UserEventType.CREATE) {
                return; // Only on new orders
            }

            const soRecord = context.newRecord;
            const customerId = soRecord.getValue({ fieldId: 'entity' });

            if (customerId) {
                const primaryContactName = getPrimaryContactName(customerId);

                if (primaryContactName) {
                    soRecord.setValue({
                        fieldId: 'custbody_contact_name',
                        value: primaryContactName
                    });

                    log.debug('Contact Auto-Populated',
                        `Set contact name to: ${primaryContactName}`);
                }
            }
        }

        /**
         * Get primary contact name from customer
         */
        function getPrimaryContactName(customerId) {
            try {
                // Search for primary contact
                const contactSearch = search.create({
                    type: 'contact',
                    filters: [
                        ['company', 'anyof', customerId],
                        'AND',
                        ['isprimarycontact', 'is', 'T'] // Primary contact
                    ],
                    columns: [
                        'firstname',
                        'lastname',
                        'entityid'
                    ]
                });

                let contactName = null;

                contactSearch.run().each(function(result) {
                    const firstName = result.getValue('firstname') || '';
                    const lastName = result.getValue('lastname') || '';
                    contactName = (firstName + ' ' + lastName).trim();
                    return false; // Only need first result
                });

                return contactName;

            } catch (e) {
                log.error('Error fetching primary contact', e);
                return null;
            }
        }

        return {
            beforeLoad: beforeLoad
        };
    });
```

**Script Deployment:**
```
Script Record:
- Name: SO Contact Auto-Populate
- ID: customscript_so_contact_autopopulate_ue
- Script File: SO_ContactAutoPopulate_UE.js

Script Deployment:
- Status: Released
- Record Type: Sales Order
- Event Type: ☑ Before Load (Create)
- Audience: All Roles
```

#### Testing Checklist

**Field Visibility:**
- [ ] Contact Name field visible on Primary Information subtab
- [ ] Field appears without clicking to secondary tab
- [ ] Field position is logical and intuitive
- [ ] Label is clear ("Contact Name")

**Field Functionality:**
- [ ] Field is editable
- [ ] Can enter text (up to max length)
- [ ] Can save order with contact name populated
- [ ] Can save order with contact name blank (if not mandatory)
- [ ] Field value saves correctly

**Auto-Population (If Implemented):**
- [ ] Select customer with primary contact → Contact Name auto-fills
- [ ] Select customer without contact → Contact Name remains blank
- [ ] User can override auto-populated value
- [ ] Changed customer → Contact Name updates

**User Experience:**
- [ ] Field is prominent and noticeable
- [ ] Sales reps understand purpose of field
- [ ] Data entry is smooth (no extra clicks)
- [ ] No confusion about where to find field

**Cross-Browser Testing:**
- [ ] Chrome
- [ ] Edge
- [ ] Firefox
- [ ] Safari (if applicable)

#### User Communication

**Email to Sales Team:**
```
Subject: Improved Sales Order Form - Contact Name Now Visible

Team,

We've updated the Sales Order form to make the Contact Name field more accessible.

What's Changed:
✅ Contact Name field now appears on the main Primary Information section
✅ No need to click to "Custom" tab anymore
✅ Field auto-populates from customer's primary contact
✅ You can still override if needed

Why This Helps:
- Faster order entry (one less click)
- Less likely to miss capturing contact info
- Better customer communication records
- Improved order tracking

Where to Find It:
The Contact Name field now appears right below the Customer field on the Primary Information section.

[Screenshot showing new field location]

Start Using It:
Next time you create a Sales Order, you'll see the Contact Name field in its new location. Enter the name of the person who placed the order or who should be contacted about the order.

Questions? Contact IT Support.

Thank you,
Operations Team
```

#### Documentation for Future Custom Fields

**Create Standards Doc:**

**File:** `c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\River-Supply-SB\docs\standards\CUSTOM_FIELD_PLACEMENT_STANDARDS.md`

```markdown
# Custom Field Placement Standards

## Policy

All custom fields on transaction forms should be placed on appropriate subtabs, NOT hidden in a generic "Custom" subtab.

## Placement Guidelines

When creating new custom fields, select subtab based on field purpose:

| Field Purpose | Place On Subtab | Examples |
|---------------|-----------------|----------|
| Customer/Contact info | Primary Information | Contact Name, Special Instructions |
| Order details | Primary Information | Order Source, Order Type, Priority Level |
| Shipping instructions | Shipping | Delivery Instructions, Loading Dock Hours |
| Billing details | Billing | PO Number, Payment Notes, Billing Contact |
| Internal notes | Communication | Internal Memo, CSR Notes, Follow-up Required |
| Accounting codes | Accounting | Project Code, Cost Center Override |
| Item line details | Items subtab (column) | Line-specific notes or attributes |

## Field Configuration Checklist

When creating custom field:
- [ ] Label is clear and business-friendly
- [ ] ID follows naming convention (custbody_descriptive_name)
- [ ] Help text provides guidance to users
- [ ] Subtab is set to appropriate location (not "Custom")
- [ ] Display type is appropriate (Normal, Inline, Hidden)
- [ ] Default value set if applicable
- [ ] Mandatory setting appropriate
- [ ] Field added to custom form in logical position

## Form Layout Best Practices

1. **Group Related Fields**
   - Use field groups to organize related custom fields
   - Example: "Project Information" group with project-related fields

2. **Position Strategically**
   - Most important fields = top of subtab
   - Related to standard fields = near those fields
   - Consider left vs. right column

3. **Avoid Clutter**
   - Don't add too many fields to Primary Information
   - Use secondary subtabs for less frequently used fields
   - Consider conditional display (workflow or client script)

4. **Consistent Naming**
   - Use consistent terminology across fields
   - Match field labels to business terminology
   - Avoid abbreviations unless universally understood

## Approval Process

Before deploying custom fields to production:
- [ ] Field purpose documented
- [ ] Placement approved by operations manager
- [ ] Form layout tested with end users
- [ ] Training materials updated
- [ ] User guide updated

## Examples

### Good Custom Field Placement

```
Primary Information:
- Customer: [Standard Field]
- Contact Name: [Custom Field - custbody_contact_name]
- Email: [Standard Field]

Shipping:
- Ship Via: [Standard Field]
- Loading Dock Hours: [Custom Field - custbody_loading_dock_hours]
- Delivery Instructions: [Custom Field - custbody_delivery_instructions]
```

### Poor Custom Field Placement

```
Custom Subtab:
- Contact Name
- Loading Dock Hours
- Delivery Instructions
- PO Number
- Project Code
(All hidden on secondary tab, users don't see them)
```

## Maintenance

Review custom field placement quarterly:
- Are fields being used?
- Are they in optimal location?
- Do users know they exist?
- Should any be removed or relocated?
```

#### Success Criteria

✅ Contact Name field visible on Primary Information subtab
✅ All other custom fields moved to appropriate subtabs
✅ No "Custom" subtab remaining (or minimized)
✅ Custom fields prominently displayed during order entry
✅ User feedback confirms improved visibility
✅ Field usage increases (measured via filled vs. blank)
✅ Standards document created for future custom fields

---

## Implementation Priority Matrix

| Issue | Priority | Complexity | Effort | Dependencies | Order |
|-------|----------|------------|--------|--------------|-------|
| #22 - Remove Classification | Low | Low | 1-2 hrs | Discovery req'd | 5 |
| #23 - Items Columns | HIGH | HIGH | 8-12 hrs | None | 1 |
| #24-26 - Shipping | HIGH | Medium | 6-8 hrs | None | 2 |
| #27 - Terms Lock | HIGH | High | 4-6 hrs | Role IDs | 3 |
| #28 - Payment Restrictions | Medium | Medium | 3-4 hrs | Role permissions | 6 |
| #29 - Accounting Lock | HIGH | High | 4-6 hrs | Role IDs | 4 |
| #30 - Contacts | Medium | Medium | 2-3 hrs | None (doc only) | 8 |
| #31 - Communication | Low | Low | 1-2 hrs | None (doc only) | 10 |
| #32 - Custom Fields | Medium | Medium | 3-4 hrs | Field discovery | 7 |

**Recommended Implementation Sequence:**

**Phase 1 - High Priority Form Enhancements (2-3 weeks)**
1. Issue #23 - Item columns (most complex, highest value)
2. Issues #24-26 - Shipping configuration (high user impact)
3. Issue #27 - Terms lock (governance requirement)
4. Issue #29 - Accounting lock (governance requirement)

**Phase 2 - Security & Permissions (1 week)**
5. Issue #22 - Classification removal (after confirming not used)
6. Issue #28 - Payment restrictions (security hardening)

**Phase 3 - User Experience Improvements (1 week)**
7. Issue #32 - Custom field placement (better UX)
8. Issue #30 - Contacts documentation (user training)

**Phase 4 - Documentation & Training (1 week)**
9. Issue #31 - Communication guide (user training)
10. Comprehensive user training on all changes

**Total Timeline:** 5-6 weeks (accounting for testing and user feedback)

---

## Roll-Out Plan

### Pre-Implementation
- [ ] Review action plan with stakeholders
- [ ] Confirm role IDs for all security implementations
- [ ] Gather test data and test scenarios
- [ ] Set up UAT environment (if available)

### Implementation
- [ ] Phase 1: High priority form enhancements
- [ ] Phase 2: Security and permissions
- [ ] Phase 3: User experience improvements
- [ ] Phase 4: Documentation and training

### Testing
- [ ] Unit testing (each issue individually)
- [ ] Integration testing (all changes together)
- [ ] User acceptance testing (sales team)
- [ ] Performance testing (form load times)

### Deployment
- [ ] Deploy to production during maintenance window
- [ ] Monitor first 24 hours for issues
- [ ] Gather user feedback
- [ ] Make adjustments as needed

### Post-Implementation
- [ ] Conduct training sessions
- [ ] Distribute documentation
- [ ] Monitor usage metrics
- [ ] Schedule 30-day review

---

## Validation Queries Collection

All validation queries from individual issues, consolidated:

```sql
-- Issue #22: Check classification field usage
SELECT
    COUNT(*) as total_orders,
    COUNT(class) as orders_with_class,
    COUNT(department) as orders_with_department,
    COUNT(location) as orders_with_location
FROM transaction
WHERE type = 'SalesOrd';

-- Issue #23: Test availability calculation
SELECT
    t.tranid,
    tl.item,
    i.displayname,
    tl.quantity as qty_ordered,
    i.quantityavailable as qty_avail,
    (i.quantityavailable - tl.quantity) as remaining_after_so
FROM transaction t
JOIN transactionline tl ON t.id = tl.transaction
JOIN item i ON tl.item = i.id
WHERE t.type = 'SalesOrd'
    AND t.trandate >= CURRENT_DATE - 30
ORDER BY t.trandate DESC
LIMIT 10;

-- Issue #24-26: Verify shipping methods being used
SELECT
    custbody_ship_method,
    COUNT(*) as order_count
FROM transaction
WHERE type = 'SalesOrd'
    AND trandate >= CURRENT_DATE - 30
GROUP BY custbody_ship_method
ORDER BY order_count DESC;

-- Issue #27: Check terms mismatches
SELECT
    t.tranid,
    c.companyname,
    c.terms as customer_terms,
    t.terms as so_terms
FROM transaction t
JOIN customer c ON t.entity = c.id
WHERE t.type = 'SalesOrd'
    AND t.trandate >= CURRENT_DATE - 90
    AND (t.terms IS DISTINCT FROM c.terms)
ORDER BY t.createddate DESC;

-- Issue #28: Payment modifications audit
SELECT
    cp.tranid,
    cp.trandate,
    cp.payment,
    e.entityid as modified_by,
    r.name as role,
    cp.lastmodifieddate
FROM transaction cp
JOIN entity e ON cp.lastmodifiedby = e.id
JOIN role r ON r.id = (SELECT role FROM employee WHERE entity = e.id)
WHERE cp.type IN ('CustPymt', 'CustDep')
    AND cp.lastmodifieddate >= CURRENT_DATE - 7
ORDER BY cp.lastmodifieddate DESC;

-- Issue #29: Check accounting field mismatches
SELECT
    t.tranid,
    c.companyname,
    c.class as cust_class,
    t.class as so_class,
    c.department as cust_dept,
    t.department as so_dept
FROM transaction t
JOIN customer c ON t.entity = c.id
WHERE t.type = 'SalesOrd'
    AND t.trandate >= CURRENT_DATE - 30
    AND (
        t.class IS DISTINCT FROM c.class OR
        t.department IS DISTINCT FROM c.department
    )
ORDER BY t.trandate DESC;

-- Issue #32: List all custom SO fields
SELECT
    fieldid,
    label,
    fieldtype,
    description,
    scriptid
FROM customfield
WHERE appliestotransaction LIKE '%SALESORDER%'
ORDER BY label;
```

---

## Risk Assessment & Mitigation

### High-Risk Items

**Issue #27 & #29: Field Security (Terms & Accounting)**
- **Risk:** Locked fields may prevent legitimate business exceptions
- **Mitigation:**
  - Implement role-based access (not universal lock)
  - Document exception process
  - Create fast-track approval workflow
  - Monitor for frequent override requests

**Issue #23: Custom Qty Available Column**
- **Risk:** Performance impact if script queries availability for many lines
- **Mitigation:**
  - Start with formula approach (Phase 1)
  - Monitor form load times
  - Only implement script if absolutely necessary
  - Add caching if performance issues

**Issue #22: Remove Classification**
- **Risk:** Breaking accounting, reporting, or integrations
- **Mitigation:**
  - MANDATORY discovery before implementation
  - Verify with accounting team
  - Check all saved searches and reports
  - Implement as "Hide" first, not "Remove"

### Medium-Risk Items

**Issue #24-26: Shipping Dropdowns**
- **Risk:** Existing shipping items/methods become orphaned
- **Mitigation:**
  - Map existing values to new values
  - Mass update existing open orders
  - Test integration with shipping systems

**Issue #28: Payment Restrictions**
- **Risk:** Users unable to correct legitimate payment errors
- **Mitigation:**
  - Clear escalation process to AR team
  - Fast response SLA for payment corrections
  - Log all restriction triggers for review

### Low-Risk Items

**Issues #30, #31, #32:** Documentation and minor UX improvements
- Minimal technical risk
- Easy rollback if needed
- Primary risk is user adoption (training solves this)

---

## Success Metrics

Track these metrics post-implementation:

**Efficiency Metrics:**
- Sales Order form load time (target: <2 seconds)
- Time to complete SO entry (target: reduce by 20%)
- Number of clicks to complete SO (target: reduce)

**Data Quality Metrics:**
- % of SOs with Contact Name populated (target: >90%)
- % of SOs with correct shipping method (target: 100%)
- % of SOs with terms matching customer (target: 100%)
- % of SOs with accounting matching customer (target: >95%)

**Adoption Metrics:**
- User satisfaction score (survey after 30 days)
- Support tickets related to SO form (target: reduce by 50%)
- Training completion rate (target: 100%)

**Compliance Metrics:**
- Unauthorized payment edit attempts (target: 0)
- Unauthorized term overrides (target: 0)
- Unauthorized accounting overrides (target: 0)

---

## Conclusion

This action plan provides comprehensive implementation guidance for all 11 Sales Order detail section issues (22-32).

**Next Steps:**
1. Review this plan with project stakeholders
2. Confirm priorities and sequence
3. Verify role IDs and permissions structure
4. Schedule implementation phases
5. Begin Phase 1 implementation

**Estimated Total Effort:** 33-45 hours
- Development: 24-32 hours
- Testing: 6-8 hours
- Documentation: 3-5 hours

**Estimated Calendar Time:** 5-6 weeks (including testing and user training)

**Questions or Concerns:** Contact project manager before beginning implementation.

---

**Document Status:** COMPLETE - Ready for Review
**Date:** 2025-10-16
**Agent:** Agent 3 - NetSuite Sales Order Detail Sections Expert
**Issues Covered:** 22-32 (11 issues)
**Approval Required:** Yes (before implementation)
