# GOBA Sports - Nametag Functionality Summary

## Overview
The nametag functionality in GOBA Sports NetSuite implementation allows customers to add custom nametags to their trampoline orders. This feature is integrated into the sales order process for custom color trampolines.

## Files Containing Nametag Logic

### 1. **processCustomColorOrdersMR.js** (MapReduce Script)
**Path:** `/SuiteScripts/ssv2/processCustomColorOrdersMR.js`
**Purpose:** Processes custom color trampoline orders and adds nametag items when applicable

### 2. **gs2_cs_tran_sft.js** (Client Script)
**Path:** `/SuiteScripts/Goba Sports (2.0)/gs2_cs_tran_sft.js`
**Purpose:** Validates nametag records on sales order line items

## Key Components

### Item ID
- **Nametag Item ID:** `106362` - This is the internal ID for the "Custom Nametag" item in NetSuite

### Custom Record Type
- **Record Type:** `customrecord789` - Custom record type for storing nametag details

### Custom Fields

#### On Sales Order Lines
- `custcol_nametag_field` - Links to the nametag custom record

#### On Nametag Custom Record (customrecord789)
- `name` - Display name combining design, font, and text
- `custrecord_nametag_so_no` - Sales Order number
- `custrecord_nametag_so_date` - Sales Order date
- `custrecord_nametag_customer_name` - Customer entity
- `custrecord_nametag_font` - Font selection
- `custrecord_nametag_colour` - Design/color selection
- `custrecord_nametag_text` - Primary text line
- `custrecord_nametag_text_2` - Secondary text line

## Business Logic Flow

### 1. Order Processing (processCustomColorOrdersMR.js)

#### When Nametag is Added:
```javascript
// Check if nametag exists and has text
if (orderDetails.nametag && orderDetails.nametag.textLine1.length > 0)
    addNameTagToOrder(orderDetails, salesOrder, taxcode);
```

#### Creating Nametag Record:
1. Creates a new custom record of type `customrecord789`
2. Sets the following values:
   - Name: Combination of design, font, and text line 1
   - Sales order reference
   - Customer information
   - Font and color/design selections
   - Text lines (up to 2 lines)
3. Saves the record and returns the ID

#### Adding Nametag to Sales Order:
1. Adds item `106362` (Custom Nametag) to the sales order
2. Sets quantity to 1
3. Sets price to -1 (custom pricing)
4. Sets amount to 0 (free item)
5. Links the nametag custom record via `custcol_nametag_field`

### 2. Validation (gs2_cs_tran_sft.js)

#### Validation Triggers:
- **Subsidiaries:** US (3) and Canada (4) only
- **Forms:** Specific sales order forms:
  - 152: SFT Sales Order (Direct Sales) NA
  - 167: *SFT Sales Order (Web Store) NA
  - 128: SFT Sales Order (Dealer/Wholesaler Inv)

#### Validation Logic:
When a Custom Nametag item (106362) is added to a sales order:
1. Checks if the `custcol_nametag_field` contains a valid nametag record
2. If missing, displays alert: "Please select/add 'NAMETAG' record"
3. Prevents line from being saved until a nametag record is selected/created

## Data Structure

### Nametag Object from IT Hands Integration:
```javascript
nametag: {
    design: "Blue",        // Color/design selection
    font: "Arial",         // Font selection
    textLine1: "John",     // Primary text
    textLine2: "Smith"     // Secondary text (optional)
}
```

## Integration Points

### IT Hands Integration
- Nametag data comes from external system (IT Hands) as part of the order details
- The MapReduce script processes these orders automatically

### Sales Order Forms
- Only specific forms for North American subsidiaries support nametag validation
- Other regions/forms may not have this validation enabled

## Business Rules

1. **Free Item:** Nametags are added as zero-amount line items
2. **Validation:** Required for US and Canadian orders on specific forms
3. **Custom Pricing:** Uses price level -1 (custom)
4. **Automatic Processing:** Nametags are automatically added during custom color order processing
5. **Text Requirements:** At least textLine1 must have content for a nametag to be created

## Error Handling

- If nametag creation fails, the error is logged but doesn't stop order processing
- Client-side validation prevents saving incomplete nametag lines
- Missing nametag records trigger user alerts

## Usage Scenarios

1. **Web Orders:** Customer selects nametag options during checkout
2. **Direct Sales:** Sales rep adds nametag during order entry
3. **Dealer Orders:** Dealers can add nametags for their customers

## Technical Notes

- The functionality is tightly integrated with the custom color trampoline ordering system
- Nametag records are linked to sales orders for tracking and fulfillment
- The system supports up to 2 lines of text per nametag
- Design and font options are text-based selections

## Recommendations for Enhancement

1. Consider adding validation for text length limits
2. Add support for preview/mockup generation
3. Consider expanding to other subsidiaries if needed
4. Add reporting for nametag usage analytics
5. Consider adding validation for inappropriate text content