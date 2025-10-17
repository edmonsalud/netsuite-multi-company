/**
 * Smart Customer ID Mapper
 * Maps items like "Due from PAT" to customers like "IC-Pier Active Transactions LLC"
 * Based on naming patterns and abbreviations
 */

const fs = require('fs');
const path = require('path');

// Read CSV files
const customerSearchPath = path.join(__dirname, 'docs/testing/CustomerSearch257Results646.csv');
const itemSearchPath = path.join(__dirname, 'docs/testing/ItemSearchdsdaResults726.csv');

console.log('Reading CSV files...\n');

const customerData = fs.readFileSync(customerSearchPath, 'utf8');
const itemData = fs.readFileSync(itemSearchPath, 'utf8');

// Build customer lookup map
const customerMap = new Map();
const customerLines = customerData.split('\n').slice(1);

customerLines.forEach(line => {
    if (!line.trim()) return;
    const match = line.match(/^(\d+),(.*?),(\d+)$/);
    if (match) {
        const internalId = match[1];
        const name = match[2].replace(/^"|"$/g, '');
        customerMap.set(name, internalId);
    }
});

// Define mapping rules: Item keyword → Customer name pattern
const mappingRules = [
    { keyword: 'Due from PSOF', customerName: 'IC-PSOF LP', match: 'exact' },
    { keyword: 'Due from Plumeria', customerName: 'IC-Plumeria', match: 'exact' },
    { keyword: 'Due from PAT', customerName: 'IC-Pier Active Transactions LLC', match: 'exact' },
    { keyword: 'Due from PMRF', customerName: 'IC-PMRF', match: 'exact' },
    { keyword: 'Due from PLFF', customerName: 'IC-PLFF I LP', match: 'exact' },
    { keyword: 'Due from PAT Series 06', customerName: 'IC-Series 006', match: 'exact' },
    { keyword: 'Due from PAT Series 11', customerName: 'IC-Series 011', match: 'exact' },
    { keyword: 'Due from PAT Series 13', customerName: 'IC-Series 013', match: 'exact' },
    { keyword: 'Due from PAT Series 18', customerName: 'IC-Series 018', match: 'exact' },
    { keyword: 'Due from PAT Series 19', customerName: 'IC-Series 019', match: 'exact' },
    { keyword: 'Due from PAT Series 20', customerName: 'IC-Series 020', match: 'exact' },
    { keyword: 'Due from PAT Series 42', customerName: 'IC-Series 042', match: 'exact' },
];

console.log('Mapping Items to Customers:\n');
console.log('Item Name → Customer Name → Internal ID');
console.log('='.repeat(80));

// Parse item data
const itemLines = itemData.split('\n');
const results = [];

itemLines.slice(1).forEach(line => {
    if (!line.trim()) return;

    const fields = line.split(',');
    const itemInternalId = fields[0];
    const itemName = fields[1];

    if (!itemName) return;

    // Find matching rule
    const rule = mappingRules.find(r => r.keyword === itemName);

    if (rule) {
        const customerInternalId = customerMap.get(rule.customerName);

        if (customerInternalId) {
            console.log(`✓ ${itemName.padEnd(30)} → ${rule.customerName.padEnd(35)} → ${customerInternalId}`);
            results.push({
                itemInternalId,
                itemName,
                customerName: rule.customerName,
                customerInternalId,
                found: true
            });
        } else {
            console.log(`✗ ${itemName.padEnd(30)} → ${rule.customerName.padEnd(35)} → NOT FOUND IN CSV`);
            results.push({
                itemInternalId,
                itemName,
                customerName: rule.customerName,
                customerInternalId: 'NOT_FOUND',
                found: false
            });
        }
    } else {
        console.log(`✗ ${itemName.padEnd(30)} → NO MAPPING RULE`);
        results.push({
            itemInternalId,
            itemName,
            customerName: 'N/A',
            customerInternalId: 'NO_RULE',
            found: false
        });
    }
});

console.log('='.repeat(80));
console.log(`\nMatched: ${results.filter(r => r.found).length} items`);
console.log(`Unmatched: ${results.filter(r => !r.found).length} items\n`);

// Generate output CSV with customer Internal IDs
const outputLines = ['Customer Internal ID,Customer Name,Item Internal ID,Item Name'];

results.forEach(r => {
    outputLines.push(`${r.customerInternalId},${r.customerName},${r.itemInternalId},${r.itemName}`);
});

const outputPath = path.join(__dirname, 'docs/testing/ItemSearch_WithCustomerIDs_Final.csv');
fs.writeFileSync(outputPath, outputLines.join('\n'));

console.log(`✓ Generated final CSV with customer Internal IDs:`);
console.log(`  ${outputPath}\n`);

// Generate simplified mapping reference
console.log('\n📋 CUSTOMER ID MAPPING REFERENCE:\n');
console.log('Customer Internal ID | Customer Name');
console.log('-'.repeat(60));

const uniqueCustomers = new Map();
results.forEach(r => {
    if (r.found && !uniqueCustomers.has(r.customerName)) {
        uniqueCustomers.set(r.customerName, r.customerInternalId);
        console.log(`${r.customerInternalId.padEnd(20)} | ${r.customerName}`);
    }
});

console.log('\n✅ Done!');
