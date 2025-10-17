/**
 * Bulk Update Customers from Combined_Customer_List.csv
 *
 * Two-step update process to avoid errors:
 * 1. Set subsidiary to ID 1
 * 2. Set salesrep to employee's internal ID
 */

const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

const config = {
  accountId: '9910981-sb1',
  consumerKey: 'bd6196d01ed2c54870c69e760025ec93bbc36a0dc610af928889b9c193b23cfd',
  consumerSecret: '478e6d485c65368fa4dd087d8ff61a422f9de1e5eb4cf56aed4884f40fc2bb88',
  tokenId: '4d1aa3b5e7bc4fca471a84ae87ee6ca4d897a8d983fa7d8872e9fb1e04d0ede5',
  tokenSecret: 'bd65c2f0fcd35aab4380aea9617ba71e6ae2bb9c16b802907338772f9709f7cf',
  realm: '9910981_SB1'
};

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
  const paramString = Object.keys(oauthParams).sort().map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`).join('&');
  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto.createHmac('sha256', signingKey).update(signatureBaseString).digest('base64');
  return `OAuth realm="${realm}", ` + Object.keys(oauthParams).map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`).join(', ') + `, oauth_signature="${encodeURIComponent(signature)}"`;
}

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

function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV with quotes
    const match = line.match(/^"?([^"]*?)"?,(.+)$/);
    if (match) {
      const customerName = match[1].trim();
      const employeeName = match[2].trim();

      if (customerName && employeeName) {
        records.push({ customerName, employeeName });
      }
    }
  }

  return records;
}

async function main() {
  console.log('🔄 Bulk Customer Update from Combined_Customer_List.csv');
  console.log('='.repeat(80));
  console.log('');

  // Step 1: Read CSV file
  console.log('Step 1: Reading CSV file...\n');
  const csvPath = path.join(__dirname, 'Upload files', 'Combined_Customer_List.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parseCSV(csvContent);
  console.log(`✅ Loaded ${records.length} customer records from CSV\n`);

  // Step 2: Get all employees to build ID mapping
  console.log('Step 2: Fetching all employees to build ID mapping...\n');
  const empQuery = `SELECT id, entityid, firstname, lastname FROM employee ORDER BY lastname`;
  const empResult = await executeSuiteQL(empQuery);

  if (empResult.statusCode !== 200 || !empResult.data.items) {
    console.log('❌ Failed to fetch employees');
    return;
  }

  const employees = empResult.data.items;
  console.log(`✅ Retrieved ${employees.length} employees\n`);

  // Build employee name to ID mapping
  const employeeMap = new Map();
  employees.forEach(emp => {
    const fullName = `${emp.firstname || ''} ${emp.lastname || ''}`.trim();
    employeeMap.set(fullName, emp.id);
    employeeMap.set(emp.entityid, emp.id); // Also map by entity ID
  });

  console.log('Employee ID Mapping:');
  employeeMap.forEach((id, name) => {
    console.log(`  ${name} → ID: ${id}`);
  });
  console.log('');

  // Step 3: Process each customer
  console.log('Step 3: Processing customer updates...\n');
  console.log('='.repeat(80));
  console.log('');

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  const notFoundCustomers = [];
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const progress = `[${i + 1}/${records.length}]`;

    console.log(`${progress} Processing: ${record.customerName} → ${record.employeeName}`);

    // Get employee ID
    const employeeId = employeeMap.get(record.employeeName);
    if (!employeeId) {
      console.log(`  ⚠️  Employee "${record.employeeName}" not found in NetSuite`);
      errors.push({ customer: record.customerName, reason: `Employee not found: ${record.employeeName}` });
      errorCount++;
      console.log('');
      continue;
    }

    console.log(`  Employee ID: ${employeeId}`);

    // Find customer
    const searchQuery = `SELECT id, companyname FROM customer WHERE companyname = '${record.customerName.replace(/'/g, "''")}' FETCH FIRST 1 ROWS ONLY`;

    try {
      const searchResult = await executeSuiteQL(searchQuery);

      if (searchResult.statusCode !== 200 || !searchResult.data.items || searchResult.data.items.length === 0) {
        console.log(`  ❌ Customer not found in NetSuite`);
        notFoundCustomers.push(record.customerName);
        notFoundCount++;
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }

      const customer = searchResult.data.items[0];
      console.log(`  Customer ID: ${customer.id}`);

      // Two-step update: subsidiary first, then salesrep
      console.log(`  Step 1: Setting subsidiary to 1...`);
      const subsidiaryUpdate = await updateCustomer(customer.id, { subsidiary: { id: '1' } });

      if (subsidiaryUpdate.statusCode !== 200 && subsidiaryUpdate.statusCode !== 204) {
        console.log(`  ❌ Failed to set subsidiary (Status ${subsidiaryUpdate.statusCode})`);
        errors.push({ customer: record.customerName, reason: `Subsidiary update failed: ${subsidiaryUpdate.statusCode}` });
        errorCount++;
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }

      console.log(`  ✅ Subsidiary set`);
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log(`  Step 2: Setting salesrep to ${employeeId}...`);
      const salesrepUpdate = await updateCustomer(customer.id, { salesRep: { id: employeeId } });

      if (salesrepUpdate.statusCode === 200 || salesrepUpdate.statusCode === 204) {
        console.log(`  ✅ SUCCESS - Customer updated`);
        successCount++;
      } else {
        console.log(`  ❌ Failed to set salesrep (Status ${salesrepUpdate.statusCode})`);
        if (salesrepUpdate.data) {
          console.log('  Response:', JSON.stringify(salesrepUpdate.data, null, 2));
        }
        errors.push({ customer: record.customerName, reason: `Salesrep update failed: ${salesrepUpdate.statusCode}` });
        errorCount++;
      }

      console.log('');
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      errors.push({ customer: record.customerName, reason: error.message });
      errorCount++;
      console.log('');
    }

    // Progress checkpoint every 50 records
    if ((i + 1) % 50 === 0) {
      console.log('='.repeat(80));
      console.log(`📊 CHECKPOINT: ${i + 1}/${records.length} processed`);
      console.log(`   ✅ Success: ${successCount} | ❌ Not Found: ${notFoundCount} | ❌ Errors: ${errorCount}`);
      console.log('='.repeat(80));
      console.log('');
    }
  }

  // Final summary
  console.log('='.repeat(80));
  console.log('\n📊 FINAL SUMMARY:');
  console.log(`   Total records in CSV: ${records.length}`);
  console.log(`   ✅ Successfully updated: ${successCount}`);
  console.log(`   ❌ Customers not found: ${notFoundCount}`);
  console.log(`   ❌ Update errors: ${errorCount}`);
  console.log('');

  if (notFoundCustomers.length > 0) {
    console.log(`\n⚠️  Customers not found in NetSuite (${notFoundCustomers.length}):`);
    notFoundCustomers.slice(0, 20).forEach(name => console.log(`  - ${name}`));
    if (notFoundCustomers.length > 20) {
      console.log(`  ... and ${notFoundCustomers.length - 20} more`);
    }
    console.log('');
  }

  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered (${errors.length}):`);
    errors.slice(0, 20).forEach(err => console.log(`  - ${err.customer}: ${err.reason}`));
    if (errors.length > 20) {
      console.log(`  ... and ${errors.length - 20} more`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('\n✅ Bulk update process complete!');
}

// Run the update
main().catch(error => {
  console.error('❌ Fatal error:', error);
});
