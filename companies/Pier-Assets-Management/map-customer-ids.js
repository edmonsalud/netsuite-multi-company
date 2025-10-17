/**
 * Map Customer Names to Internal IDs
 * Maps customer names from ItemSearch CSV to internal IDs from CustomerSearch CSV
 */

const fs = require('fs');
const path = require('path');

// Read both CSV files
const customerSearchPath = path.join(__dirname, 'docs/testing/CustomerSearch257Results646.csv');
const itemSearchPath = path.join(__dirname, 'docs/testing/ItemSearchdsdaResults726.csv');

console.log('Reading CSV files...\n');

const customerData = fs.readFileSync(customerSearchPath, 'utf8');
const itemData = fs.readFileSync(itemSearchPath, 'utf8');

// Parse customer data into a map: Name -> Internal ID
const customerMap = new Map();
const customerLines = customerData.split('\n').slice(1); // Skip header

customerLines.forEach(line => {
    if (!line.trim()) return;

    // Parse CSV line (handle quoted fields)
    const matches = line.match(/^(\d+),(.*?),(\d+)$/);
    if (matches) {
        const internalId = matches[1];
        const name = matches[2].replace(/^"|"$/g, ''); // Remove quotes if present
        customerMap.set(name, internalId);
    }
});

console.log(`Loaded ${customerMap.size} customers from CustomerSearch CSV\n`);

// Parse item search data
const itemLines = itemData.split('\n');
const header = itemLines[0];
const dataLines = itemLines.slice(1);

console.log('Mapping customer names from ItemSearch to Internal IDs:\n');
console.log('Customer Name → Internal ID');
console.log('='.repeat(60));

const mappedData = [];
let unmatchedCount = 0;

dataLines.forEach(line => {
    if (!line.trim()) return;

    const fields = line.split(',');
    if (fields.length < 2) return;

    const customerName = fields[1].trim();

    // Try to find internal ID
    let internalId = null;

    // Direct match
    if (customerMap.has(customerName)) {
        internalId = customerMap.get(customerName);
    } else {
        // Try fuzzy matching for common variations
        for (let [name, id] of customerMap) {
            // Match "IC - PSOF LP" to "IC-PSOF LP"
            const normalizedMapName = name.replace(/\s+/g, '').replace(/-/g, '').toLowerCase();
            const normalizedSearchName = customerName.replace(/\s+/g, '').replace(/-/g, '').toLowerCase();

            if (normalizedMapName === normalizedSearchName) {
                internalId = id;
                break;
            }
        }
    }

    if (internalId) {
        console.log(`✓ ${customerName.padEnd(40)} → ${internalId}`);
        mappedData.push({ customerName, internalId, originalLine: line });
    } else {
        console.log(`✗ ${customerName.padEnd(40)} → NOT FOUND`);
        unmatchedCount++;
        mappedData.push({ customerName, internalId: 'NOT_FOUND', originalLine: line });
    }
});

console.log('='.repeat(60));
console.log(`\nMatched: ${mappedData.length - unmatchedCount} customers`);
console.log(`Unmatched: ${unmatchedCount} customers\n`);

// Generate new CSV with Internal IDs
const outputLines = ['Customer Internal ID,Customer Name,Item Internal ID,Item Name,Display Name,Description,Type,Base Price,Item Internal ID'];

mappedData.forEach(item => {
    const fields = item.originalLine.split(',');
    const newLine = `${item.internalId},${fields[1]},${fields.join(',')}`;
    outputLines.push(newLine);
});

const outputPath = path.join(__dirname, 'docs/testing/ItemSearch_WithCustomerIDs.csv');
fs.writeFileSync(outputPath, outputLines.join('\n'));

console.log(`✓ Generated new CSV with customer Internal IDs:`);
console.log(`  ${outputPath}\n`);

// Also generate a simple mapping reference
const mappingReference = ['Customer Name,Customer Internal ID'];
mappedData.forEach(item => {
    mappingReference.push(`${item.customerName},${item.internalId}`);
});

const mappingPath = path.join(__dirname, 'docs/testing/Customer_ID_Mapping.csv');
fs.writeFileSync(mappingPath, mappingReference.join('\n'));

console.log(`✓ Generated customer ID mapping reference:`);
console.log(`  ${mappingPath}\n`);

console.log('Done!');
