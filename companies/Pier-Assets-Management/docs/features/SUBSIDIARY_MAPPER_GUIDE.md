# Subsidiary Mapper - Quick Reference Guide

**Created:** 2025-10-17
**Location:** `src/FileCabinet/SuiteScripts/subsidiary_mapper.js`
**Purpose:** Map representing customer names to subsidiary internal IDs

---

## Overview

The Subsidiary Mapper is a reusable SuiteScript 2.1 module that maps customer names (like "IC-PSOF LP") to their corresponding subsidiary internal IDs (like 8).

### Why This Exists

In Pier Assets Management, many transactions need to be assigned to specific subsidiaries based on the customer. This module provides a centralized, maintainable way to perform these lookups.

---

## Quick Start

### 1. Import the Module

```javascript
define(['./subsidiary_mapper'], function(SubsidiaryMapper) {
    // Your code here
});
```

### 2. Basic Usage

```javascript
// Get subsidiary ID for a customer
const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer('IC-PSOF LP');
// Returns: 8
```

---

## API Reference

### `getSubsidiaryByCustomer(customerName)`

Returns the subsidiary internal ID for a given customer name.

**Parameters:**
- `customerName` (string) - The representing customer name (e.g., 'IC-PSOF LP')

**Returns:**
- `number` - The subsidiary internal ID
- `null` - If no mapping exists

**Example:**
```javascript
const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer('IC-PSOF LP');
// Returns: 8

const invalidId = SubsidiaryMapper.getSubsidiaryByCustomer('Invalid Customer');
// Returns: null
```

---

### `getSubsidiaryDetails(customerName)`

Returns full details about the subsidiary.

**Parameters:**
- `customerName` (string) - The representing customer name

**Returns:**
- `Object` - `{ subsidiaryId: number, subsidiaryName: string }`
- `null` - If no mapping exists

**Example:**
```javascript
const details = SubsidiaryMapper.getSubsidiaryDetails('IC-PSOF LP');
// Returns: { subsidiaryId: 8, subsidiaryName: 'PSOF LP' }
```

---

### `hasSubsidiaryMapping(customerName)`

Checks if a mapping exists for the given customer.

**Parameters:**
- `customerName` (string) - The representing customer name

**Returns:**
- `boolean` - `true` if mapping exists, `false` otherwise

**Example:**
```javascript
const exists = SubsidiaryMapper.hasSubsidiaryMapping('IC-PSOF LP');
// Returns: true
```

---

### `getAllMappings()`

Returns the complete mapping object (for debugging/reference).

**Returns:**
- `Object` - Complete subsidiary mapping table

---

## Common Mappings

| Customer Name | Subsidiary ID | Subsidiary Name |
|--------------|---------------|-----------------|
| IC-PSOF LP | 8 | PSOF LP |
| IC-Pier Active Transactions LLC | 6 | Pier Active Transactions LLC |
| IC-PLFF I LP | 49 | PLFF I LP |
| IC-PMRF LP | 74 | PMRF LP |
| IC-Plumeria 51 | 51 | Plumeria |
| IC-Series 006 | 18 | Series 006 |
| IC-Series 013 | 26 | Series 013 |
| IC-Series 042 | 77 | Series 042 |

*See complete mapping table in the source code: [subsidiary_mapper.js](../../src/FileCabinet/SuiteScripts/subsidiary_mapper.js)*

---

## Usage Examples

### Example 1: User Event Script - Auto-Set Subsidiary

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', './subsidiary_mapper'],
function(record, SubsidiaryMapper) {

    function beforeSubmit(context) {
        const currentRecord = context.newRecord;
        const customerId = currentRecord.getValue({ fieldId: 'entity' });

        if (customerId) {
            const customerRec = record.load({
                type: record.Type.CUSTOMER,
                id: customerId
            });

            const customerName = customerRec.getValue({ fieldId: 'companyname' });
            const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer(customerName);

            if (subsidiaryId) {
                currentRecord.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiaryId
                });
            }
        }
    }

    return { beforeSubmit: beforeSubmit };
});
```

---

### Example 2: Map/Reduce Script - Process Multiple Records

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', './subsidiary_mapper'],
function(search, SubsidiaryMapper) {

    function map(context) {
        const searchResult = JSON.parse(context.value);
        const customerName = searchResult.values.companyname;

        const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer(customerName);

        if (subsidiaryId) {
            context.write({
                key: searchResult.id,
                value: {
                    customerId: searchResult.id,
                    customerName: customerName,
                    subsidiaryId: subsidiaryId
                }
            });
        }
    }

    function reduce(context) {
        const data = JSON.parse(context.values[0]);

        // Update record with correct subsidiary
        record.submitFields({
            type: record.Type.CUSTOMER,
            id: data.customerId,
            values: {
                subsidiary: data.subsidiaryId
            }
        });
    }

    return { map: map, reduce: reduce };
});
```

---

### Example 3: Workflow Action Script

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['./subsidiary_mapper'],
function(SubsidiaryMapper) {

    function onAction(context) {
        const currentRecord = context.newRecord;
        const customerName = currentRecord.getText({ fieldId: 'entity' });

        const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer(customerName);

        if (subsidiaryId) {
            return subsidiaryId.toString();
        }

        return null;
    }

    return { onAction: onAction };
});
```

---

### Example 4: Validation Before Processing

```javascript
const customerName = 'IC-Series 042';

// Check if mapping exists first
if (SubsidiaryMapper.hasSubsidiaryMapping(customerName)) {
    const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer(customerName);

    // Process with valid subsidiary ID
    record.submitFields({
        type: record.Type.INVOICE,
        id: invoiceId,
        values: {
            subsidiary: subsidiaryId
        }
    });
} else {
    log.error({
        title: 'Invalid Customer',
        details: `No subsidiary mapping for: ${customerName}`
    });
}
```

---

## Testing

### Test Script

A test Suitelet is provided at:
`src/FileCabinet/SuiteScripts/test_subsidiary_mapper.js`

**To test:**
1. Deploy the test Suitelet in NetSuite
2. Navigate to the deployed Suitelet URL
3. Enter a customer name (e.g., 'IC-PSOF LP')
4. View the mapping results

### Console Testing

You can also test in NetSuite's browser console:

```javascript
// Load the module
require(['./subsidiary_mapper'], function(SubsidiaryMapper) {
    console.log(SubsidiaryMapper.getSubsidiaryByCustomer('IC-PSOF LP'));
    // Output: 8
});
```

---

## Maintenance

### Adding New Mappings

1. Open `subsidiary_mapper.js`
2. Add new entry to `SUBSIDIARY_MAP` object:

```javascript
const SUBSIDIARY_MAP = {
    // ... existing mappings ...
    'IC-New Customer': { subsidiaryId: 999, subsidiaryName: 'New Subsidiary' }
};
```

3. Save and deploy the updated script

### Data Source

The mapping data is based on:
`docs/testing/Subsidiaries737.csv`

**Columns:**
- **Internal ID** - Subsidiary internal ID
- **Name** - Subsidiary name
- **Representing Customer** - Customer name (lookup key)

---

## Troubleshooting

### Problem: Returns `null` for valid customer

**Solution:**
- Check exact customer name spelling
- Customer names are **case-sensitive**
- Verify customer exists in `SUBSIDIARY_MAP`

### Problem: Mapping not found for Series customer

**Solution:**
- Some series have number suffixes (e.g., 'IC-Series 035 62')
- Check the exact format in the mapping table
- Use `getAllMappings()` to see all available keys

### Problem: Script deployment fails

**Solution:**
- Ensure `subsidiary_mapper.js` is deployed first
- Check module path in `define()` statement
- Verify NetSuite script deployment settings

---

## Performance

- **Lookup Time:** O(1) - Constant time (hash table lookup)
- **Memory:** ~8KB (all mappings in memory)
- **Governance Units:** 0 units per lookup (pure JavaScript, no NetSuite API calls)

---

## Best Practices

1. ✅ **Always validate input** before lookup
   ```javascript
   if (customerName && customerName.trim()) {
       const id = SubsidiaryMapper.getSubsidiaryByCustomer(customerName);
   }
   ```

2. ✅ **Check for null results** before using
   ```javascript
   const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer(name);
   if (subsidiaryId !== null) {
       // Safe to use subsidiaryId
   }
   ```

3. ✅ **Log missing mappings** for future maintenance
   ```javascript
   if (!subsidiaryId) {
       log.audit({
           title: 'Missing Subsidiary Mapping',
           details: `Customer: ${customerName}`
       });
   }
   ```

4. ✅ **Cache results** if calling multiple times in same execution
   ```javascript
   const cache = {};
   function getSubsidiaryWithCache(customerName) {
       if (!cache[customerName]) {
           cache[customerName] = SubsidiaryMapper.getSubsidiaryByCustomer(customerName);
       }
       return cache[customerName];
   }
   ```

---

## Related Files

- **Main Module:** `src/FileCabinet/SuiteScripts/subsidiary_mapper.js`
- **Examples:** `src/FileCabinet/SuiteScripts/subsidiary_mapper_examples.js`
- **Test Script:** `src/FileCabinet/SuiteScripts/test_subsidiary_mapper.js`
- **Source Data:** `docs/testing/Subsidiaries737.csv`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-17 | Initial release - 62 subsidiary mappings |

---

## Support

For questions or issues:
1. Check this guide first
2. Review the example scripts
3. Test using the provided test Suitelet
4. Contact NetSuite development team

---

**Last Updated:** 2025-10-17
**Status:** Production Ready ✅
