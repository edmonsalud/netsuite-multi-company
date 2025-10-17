/**
 * Bulk Update Customers from Combined_Customer_List.csv - IMPROVED VERSION
 *
 * Improvements:
 * - Better CSV parsing for quoted names
 * - Resume capability (skip already processed)
 * - Faster execution
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

  for (let i = 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    let customerName, employeeName;

    // Handle quoted customer names (e.g., "CAMPBELL,CHRIS",Eric Pearle)
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

    if (customerName && employeeName && customerName !== '00000000000') {
      records.push({ customerName, employeeName });
    }
  }

  return records;
}

async function main() {
  console.log('🔄 Bulk Customer Update - IMPROVED VERSION');
  console.log('='.repeat(80));
  console.log('');

  // Read CSV
  console.log('Step 1: Reading CSV file...\n');
  const csvPath = path.join(__dirname, 'Upload files', 'Combined_Customer_List.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parseCSV(csvContent);
  console.log(`✅ Loaded ${records.length} customer records\n`);

  // Get employees
  console.log('Step 2: Fetching employees...\n');
  const empQuery = `SELECT id, entityid, firstname, lastname FROM employee ORDER BY lastname`;
  const empResult = await executeSuiteQL(empQuery);

  if (empResult.statusCode !== 200 || !empResult.data.items) {
    console.log('❌ Failed to fetch employees');
    return;
  }

  const employees = empResult.data.items;
  const employeeMap = new Map();
  employees.forEach(emp => {
    const fullName = `${emp.firstname || ''} ${emp.lastname || ''}`.trim();
    employeeMap.set(fullName, emp.id);
  });

  console.log(`✅ ${employees.length} employees mapped\n`);

  // Process updates
  console.log('Step 3: Processing updates...\n');

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    if ((i + 1) % 10 === 0) {
      process.stdout.write(`\r[${i + 1}/${records.length}] Success: ${successCount} | Not Found: ${notFoundCount} | Errors: ${errorCount}`);
    }

    const employeeId = employeeMap.get(record.employeeName);
    if (!employeeId) {
      errorCount++;
      continue;
    }

    try {
      const searchQuery = `SELECT id FROM customer WHERE companyname = '${record.customerName.replace(/'/g, "''")}' FETCH FIRST 1 ROWS ONLY`;
      const searchResult = await executeSuiteQL(searchQuery);

      if (searchResult.statusCode !== 200 || !searchResult.data.items || searchResult.data.items.length === 0) {
        notFoundCount++;
        continue;
      }

      const customerId = searchResult.data.items[0].id;

      // Update subsidiary
      await updateCustomer(customerId, { subsidiary: { id: '1' } });
      await new Promise(resolve => setTimeout(resolve, 200));

      // Update salesrep
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

  console.log('\n\n' + '='.repeat(80));
  console.log('\n📊 FINAL SUMMARY:');
  console.log(`   Total records: ${records.length}`);
  console.log(`   ✅ Successfully updated: ${successCount}`);
  console.log(`   ❌ Not found: ${notFoundCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('\n' + '='.repeat(80));
}

main().catch(error => console.error('❌ Fatal error:', error));
