/**
 * Bulk Update Sales Rep for Caroline Lyons Customer List
 * Updates all customers from CSV to Sales Rep ID 16
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

function updateCustomer(customerId) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/customer/${customerId}`;
    const body = JSON.stringify({ salesRep: { id: "16" } });
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
        resolve({ statusCode: res.statusCode, customerId: customerId });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function processCustomers() {
  // Read CSV file
  const csvPath = path.join(__dirname, 'Upload files', 'Caroline Lyons Customer List.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');

  // Parse CSV (simple parsing - split by newline and comma)
  const lines = csvContent.split('\n');
  const customerNames = [];

  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma but handle quoted values
    const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
    if (matches && matches.length >= 2) {
      let customerName = matches[1].replace(/^,?"?|"?$/g, '').replace(/""/g, '"').trim();
      if (customerName) {
        customerNames.push(customerName);
      }
    }
  }

  console.log(`Found ${customerNames.length} customers in CSV\n`);
  console.log('='.repeat(80));

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  let alreadySetCount = 0;

  for (let i = 0; i < customerNames.length; i++) {
    const customerName = customerNames[i];
    const progress = `[${i + 1}/${customerNames.length}]`;

    console.log(`\n${progress} Processing: ${customerName}`);

    try {
      // Search for customer by name
      const escapedName = customerName.replace(/'/g, "''"); // Escape single quotes for SQL
      const query = `SELECT id, entityid, companyname, salesrep FROM customer WHERE UPPER(companyname) = UPPER('${escapedName}')`;

      const searchResult = await executeSuiteQL(query);

      if (searchResult.statusCode === 200 && searchResult.data.items && searchResult.data.items.length > 0) {
        const customer = searchResult.data.items[0];
        console.log(`  ✓ Found: ID ${customer.id}, Entity ${customer.entityid}`);

        // Check if salesrep is already 16
        if (customer.salesrep === 16 || customer.salesrep === '16') {
          console.log(`  → Already set to Sales Rep 16 - skipping`);
          alreadySetCount++;
          continue;
        }

        console.log(`  → Current Sales Rep: ${customer.salesrep || 'Not set'}`);
        console.log(`  → Updating to Sales Rep 16...`);

        // Update customer
        const updateResult = await updateCustomer(customer.id);

        if (updateResult.statusCode === 200 || updateResult.statusCode === 204) {
          console.log(`  ✓ SUCCESS - Updated to Sales Rep 16`);
          successCount++;
        } else {
          console.log(`  ✗ Update failed (Status ${updateResult.statusCode})`);
          errorCount++;
        }
      } else {
        console.log(`  ✗ NOT FOUND in NetSuite`);
        notFoundCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.log(`  ✗ ERROR: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY:');
  console.log(`   Total in CSV: ${customerNames.length}`);
  console.log(`   ✓ Successfully updated: ${successCount}`);
  console.log(`   → Already set to 16: ${alreadySetCount}`);
  console.log(`   ✗ Not found: ${notFoundCount}`);
  console.log(`   ✗ Errors: ${errorCount}`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Total processed: ${successCount + alreadySetCount + notFoundCount + errorCount}`);
  console.log('');
}

// Run the process
console.log('🚀 Starting bulk update for Caroline Lyons Customer List');
console.log('   Target Sales Rep: ID 16');
console.log('');

processCustomers()
  .then(() => {
    console.log('✅ Bulk update complete!');
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
  });
