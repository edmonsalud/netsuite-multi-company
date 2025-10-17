# NetSuite Bulk Update Patterns

> **Purpose**: Best practices and patterns for bulk updating NetSuite records via REST API
> **Last Updated**: 2025-10-16
> **Status**: Active
> **Validated**: River-Supply-SB (476 customer updates, 78% success rate)

## Table of Contents

- [Overview](#overview)
- [The Two-Step Update Pattern](#the-two-step-update-pattern)
- [CSV Processing](#csv-processing)
- [Progress Tracking](#progress-tracking)
- [Error Handling](#error-handling)
- [Complete Working Example](#complete-working-example)

---

## Overview

Bulk updating NetSuite records requires careful handling of:

1. **Validation requirements** (subsidiary, required fields)
2. **Rate limiting** (avoid API throttling)
3. **Error handling** (400/404/403 errors)
4. **Progress tracking** (user feedback)
5. **CSV parsing** (handle special characters)

**Key Metrics from Production**:
- Processed: 476 customer records
- Success rate: 78.2% (372 successful)
- Average time: ~3 seconds per record
- Total time: ~25 minutes

---

## The Two-Step Update Pattern

### Problem: 400 Bad Request Errors

NetSuite validates required fields during updates. Missing or invalid `subsidiary` causes:

```
HTTP 400 Bad Request
"Please enter value(s) for: Subsidiary"
```

### Solution: Two-Step Update

```javascript
async function updateCustomerSalesRep(customerId, salesRepId) {
  // STEP 1: Set subsidiary (required field)
  const subsidiaryUpdate = await updateCustomer(customerId, {
    subsidiary: { id: '1' }
  });

  if (subsidiaryUpdate.statusCode !== 200 && subsidiaryUpdate.statusCode !== 204) {
    throw new Error(`Subsidiary update failed: ${subsidiaryUpdate.statusCode}`);
  }

  // Wait between requests (rate limiting)
  await new Promise(resolve => setTimeout(resolve, 300));

  // STEP 2: Set sales rep
  const salesrepUpdate = await updateCustomer(customerId, {
    salesRep: { id: salesRepId }
  });

  return salesrepUpdate;
}
```

### Why This Works

1. **Subsidiary validation**: NetSuite validates subsidiary exists before accepting other field updates
2. **Separate requests**: Isolates validation errors to specific fields
3. **Rate limiting**: Delay between requests prevents API throttling

### When to Use Two-Step Pattern

✅ **Use for:**
- Customer updates (subsidiary required)
- Any record with complex validation
- Bulk operations (>10 records)

⏭️ **Skip for:**
- Single record updates where you control all fields
- Records where all required fields are already set

---

## CSV Processing

### Challenge: Special Characters in CSV

CSV files often contain:
- Quoted company names: `"CAMPBELL,CHRIS",Eric Pearle`
- Commas within names
- Empty lines
- Invalid records (e.g., `00000000000`)

### Solution: Robust CSV Parser

```javascript
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) { // Skip header
    let line = lines[i].trim();
    if (!line) continue;

    let customerName, employeeName;

    // Handle quoted names (e.g., "CAMPBELL,CHRIS",Eric Pearle)
    if (line.startsWith('"')) {
      const closingQuoteIndex = line.indexOf('"', 1);
      if (closingQuoteIndex !== -1) {
        customerName = line.substring(1, closingQuoteIndex);
        const remainder = line.substring(closingQuoteIndex + 1);
        employeeName = remainder.replace(/^,\s*/, '').trim();
      }
    } else {
      // Normal CSV line
      const parts = line.split(',');
      customerName = parts[0]?.trim();
      employeeName = parts[1]?.trim();
    }

    // Validate and filter
    if (customerName &&
        employeeName &&
        customerName !== '00000000000') {
      records.push({ customerName, employeeName });
    }
  }

  return records;
}
```

### Validation Rules

```javascript
// ✅ Valid records
{ customerName: 'ABC MOTORS', employeeName: 'Eric Pearle' }
{ customerName: 'CAMPBELL,CHRIS', employeeName: 'Eric Pearle' }

// ❌ Invalid records (filtered out)
{ customerName: '00000000000', employeeName: 'Greg Landers' } // Placeholder
{ customerName: '', employeeName: 'Eric Pearle' }             // Empty name
{ customerName: 'ABC MOTORS', employeeName: '' }              // Empty employee
```

---

## Progress Tracking

### Real-Time Console Updates

```javascript
async function bulkUpdate(records) {
  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (let i = 0; i < records.length; i++) {
    // Update progress every 10 records
    if ((i + 1) % 10 === 0) {
      process.stdout.write(
        `\r[${i + 1}/${records.length}] ` +
        `Success: ${successCount} | ` +
        `Not Found: ${notFoundCount} | ` +
        `Errors: ${errorCount}`
      );
    }

    // Process record...
    try {
      await processRecord(records[i]);
      successCount++;
    } catch (error) {
      if (error.message.includes('not found')) {
        notFoundCount++;
      } else {
        errorCount++;
      }
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Final summary
  console.log('\n\n' + '='.repeat(80));
  console.log('\n📊 FINAL SUMMARY:');
  console.log(`   Total records: ${records.length}`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Not found: ${notFoundCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}
```

**Output Example:**
```
[10/476] Success: 7 | Not Found: 2 | Errors: 0
[20/476] Success: 17 | Not Found: 2 | Errors: 0
[30/476] Success: 26 | Not Found: 3 | Errors: 0
```

### Checkpoint Reporting

For long-running operations (>100 records), add checkpoints:

```javascript
// Progress checkpoint every 50 records
if ((i + 1) % 50 === 0) {
  console.log('\n' + '='.repeat(80));
  console.log(`📊 CHECKPOINT: ${i + 1}/${records.length} processed`);
  console.log(`   ✅ Success: ${successCount} | ❌ Errors: ${errorCount}`);
  console.log('='.repeat(80) + '\n');
}
```

---

## Error Handling

### Error Categories

```javascript
async function processRecord(record) {
  try {
    // Find customer
    const customer = await findCustomerByName(record.customerName);

    if (!customer) {
      // Category 1: Not Found (404)
      return { status: 'not_found', record };
    }

    // Update customer
    const result = await updateCustomer(customer.id, updateData);

    if (result.statusCode === 200 || result.statusCode === 204) {
      // Category 2: Success (200/204)
      return { status: 'success', record };
    } else if (result.statusCode === 400) {
      // Category 3: Validation Error (400)
      return { status: 'validation_error', record, error: result.data };
    } else {
      // Category 4: Other Error
      return { status: 'error', record, statusCode: result.statusCode };
    }

  } catch (error) {
    // Category 5: Network/System Error
    return { status: 'system_error', record, error: error.message };
  }
}
```

### Retry Logic for Validation Errors

```javascript
async function updateWithRetry(customerId, updateData) {
  try {
    const result = await updateCustomer(customerId, updateData);
    return result;
  } catch (error) {
    if (error.statusCode === 400) {
      // Retry with two-step pattern
      await updateCustomer(customerId, { subsidiary: { id: '1' } });
      await new Promise(resolve => setTimeout(resolve, 300));
      return await updateCustomer(customerId, updateData);
    }
    throw error;
  }
}
```

### Error Reporting

```javascript
// Collect errors during processing
const errors = [];

for (const record of records) {
  const result = await processRecord(record);

  if (result.status !== 'success') {
    errors.push({
      customer: record.customerName,
      employee: record.employeeName,
      reason: result.error || result.status
    });
  }
}

// Report at end
if (errors.length > 0) {
  console.log(`\n❌ Errors encountered (${errors.length}):`);
  errors.slice(0, 20).forEach(err => {
    console.log(`  - ${err.customer}: ${err.reason}`);
  });
  if (errors.length > 20) {
    console.log(`  ... and ${errors.length - 20} more`);
  }
}
```

---

## Complete Working Example

```javascript
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

// Configuration
const config = {
  accountId: '9910981-sb1',
  consumerKey: '...',
  consumerSecret: '...',
  tokenId: '...',
  tokenSecret: '...',
  realm: '9910981_SB1'
};

// OAuth signature generation
function generateOAuthHeader(url, method, realm, consumerKey, consumerSecret, tokenId, tokenSecret) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_token: tokenId,
    oauth_version: '1.0'
  };
  const paramString = Object.keys(oauthParams).sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');
  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto.createHmac('sha256', signingKey).update(signatureBaseString).digest('base64');
  return `OAuth realm="${realm}", ` + Object.keys(oauthParams)
    .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ') + `, oauth_signature="${encodeURIComponent(signature)}"`;
}

// Execute SuiteQL query
function executeSuiteQL(query) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`;
    const body = JSON.stringify({ q: query });
    const authHeader = generateOAuthHeader(url, 'POST', config.realm, config.consumerKey, config.consumerSecret, config.tokenId, config.tokenSecret);
    const options = {
      hostname: `${config.accountId}.suitetalk.api.netsuite.com`,
      path: '/services/rest/query/v1/suiteql',
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Prefer': 'transient' }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, data: JSON.parse(data) }); }
        catch (e) { resolve({ statusCode: res.statusCode, data: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Update customer record
function updateCustomer(customerId, updateData) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/customer/${customerId}`;
    const body = JSON.stringify(updateData);
    const authHeader = generateOAuthHeader(url, 'PATCH', config.realm, config.consumerKey, config.consumerSecret, config.tokenId, config.tokenSecret);
    const options = {
      hostname: `${config.accountId}.suitetalk.api.netsuite.com`,
      path: `/services/rest/record/v1/customer/${customerId}`,
      method: 'PATCH',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Prefer': 'transient' }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, data: data ? JSON.parse(data) : {} }); }
        catch (e) { resolve({ statusCode: res.statusCode, data: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Main bulk update function
async function bulkUpdateFromCSV(csvFilePath) {
  console.log('🔄 Bulk Customer Update');
  console.log('='.repeat(80) + '\n');

  // Step 1: Parse CSV
  const csvContent = fs.readFileSync(csvFilePath, 'utf8');
  const records = parseCSV(csvContent);
  console.log(`✅ Loaded ${records.length} records\n`);

  // Step 2: Build employee map
  const empQuery = `SELECT id, firstname, lastname FROM employee WHERE isinactive = 'F'`;
  const empResult = await executeSuiteQL(empQuery);
  const employeeMap = new Map();
  empResult.data.items.forEach(emp => {
    const fullName = `${emp.firstname} ${emp.lastname}`;
    employeeMap.set(fullName, emp.id);
  });
  console.log(`✅ Mapped ${employeeMap.size} employees\n`);

  // Step 3: Process updates
  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    if ((i + 1) % 10 === 0) {
      process.stdout.write(`\r[${i + 1}/${records.length}] Success: ${successCount} | Not Found: ${notFoundCount} | Errors: ${errorCount}`);
    }

    try {
      // Get employee ID
      const employeeId = employeeMap.get(record.employeeName);
      if (!employeeId) {
        errorCount++;
        continue;
      }

      // Find customer
      const searchQuery = `SELECT id FROM customer WHERE companyname = '${record.customerName.replace(/'/g, "''")}' FETCH FIRST 1 ROWS ONLY`;
      const searchResult = await executeSuiteQL(searchQuery);

      if (!searchResult.data.items || searchResult.data.items.length === 0) {
        notFoundCount++;
        continue;
      }

      const customerId = searchResult.data.items[0].id;

      // Two-step update
      await updateCustomer(customerId, { subsidiary: { id: '1' } });
      await new Promise(resolve => setTimeout(resolve, 200));
      const result = await updateCustomer(customerId, { salesRep: { id: employeeId } });

      if (result.statusCode === 200 || result.statusCode === 204) {
        successCount++;
      } else {
        errorCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      errorCount++;
    }
  }

  // Final summary
  console.log('\n\n' + '='.repeat(80));
  console.log('\n📊 FINAL SUMMARY:');
  console.log(`   Total: ${records.length}`);
  console.log(`   ✅ Success: ${successCount} (${(successCount/records.length*100).toFixed(1)}%)`);
  console.log(`   ❌ Not found: ${notFoundCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('\n' + '='.repeat(80));
}

// Run
bulkUpdateFromCSV('./Upload files/Combined_Customer_List.csv')
  .then(() => console.log('\n✅ Complete!'))
  .catch(error => console.error('❌ Fatal:', error));
```

---

## Performance Optimization

### Rate Limiting Guidelines

```javascript
// General guideline: 200-300ms between requests
await new Promise(resolve => setTimeout(resolve, 200));

// For critical operations (avoid throttling): 500ms
await new Promise(resolve => setTimeout(resolve, 500));

// For high-volume (>500 records): Consider background processing
node script.js > log.txt 2>&1 &
```

### Batch Processing

For very large datasets (>1000 records):

```javascript
async function processBatch(records, batchSize = 100) {
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${i/batchSize + 1}...`);

    await bulkUpdate(batch);

    // Longer pause between batches
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
```

---

## Validation

### Pre-Flight Checks

```javascript
async function validateBeforeBulkUpdate(records, employeeMap) {
  console.log('🔍 Pre-flight validation...\n');

  const missingEmployees = new Set();
  records.forEach(record => {
    if (!employeeMap.has(record.employeeName)) {
      missingEmployees.add(record.employeeName);
    }
  });

  if (missingEmployees.size > 0) {
    console.log(`⚠️  WARNING: ${missingEmployees.size} employees not found:`);
    missingEmployees.forEach(name => console.log(`  - ${name}`));
    console.log('');

    // Prompt user to continue
    const recordsAffected = records.filter(r => missingEmployees.has(r.employeeName)).length;
    console.log(`This affects ${recordsAffected} customer records.`);
    console.log('Continue anyway? (These records will be skipped)');
  }

  return { valid: true, warnings: missingEmployees.size };
}
```

---

## Related Documentation

- [NetSuite REST API Guide](./NETSUITE-REST-API-GUIDE.md) - Complete REST API reference
- [Employee Access Patterns](./EMPLOYEE-ACCESS-PATTERNS.md) - Employee record access methods

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-10-16 | Initial creation - 476 customer bulk update learnings | Claude Code |

---

**Status**: Production-validated with River-Supply-SB (476 records, 78% success rate)
