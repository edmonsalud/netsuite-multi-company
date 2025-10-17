/**
 * Fix customers with 400 errors by setting subsidiary first
 */

const crypto = require('crypto');
const https = require('https');

const config = {
  accountId: '9910981-sb1',
  consumerKey: 'bd6196d01ed2c54870c69e760025ec93bbc36a0dc610af928889b9c193b23cfd',
  consumerSecret: '478e6d485c65368fa4dd087d8ff61a422f9de1e5eb4cf56aed4884f40fc2bb88',
  tokenId: '4d1aa3b5e7bc4fca471a84ae87ee6ca4d897a8d983fa7d8872e9fb1e04d0ede5',
  tokenSecret: 'bd65c2f0fcd35aab4380aea9617ba71e6ae2bb9c16b802907338772f9709f7cf',
  realm: '9910981_SB1'
};

// Customers that had 400 errors
const errorCustomers = [
  { id: 6047, name: 'BIG INDIE UNDERGROUND INC' },
  { id: 6009, name: 'GEMINI PICTURES GEORGIA, LLC' },
  { id: 6011, name: 'THE NAUTICAL TOUCH' },
  { id: 6037, name: 'WOLFES PLUMBING' }
];

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
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function fixCustomers() {
  console.log('🔧 Fixing customers with 400 errors');
  console.log('   Step 1: Set subsidiary to 1');
  console.log('   Step 2: Set sales rep to 16');
  console.log('');
  console.log('='.repeat(80));

  let successCount = 0;
  let errorCount = 0;

  for (const customer of errorCustomers) {
    console.log(`\n📋 Processing: ${customer.name} (ID: ${customer.id})`);

    try {
      // Step 1: Set subsidiary to 1
      console.log('  → Step 1: Setting subsidiary to 1...');
      const subsidiaryUpdate = await updateCustomer(customer.id, {
        subsidiary: { id: "1" }
      });

      if (subsidiaryUpdate.statusCode === 200 || subsidiaryUpdate.statusCode === 204) {
        console.log('  ✓ Subsidiary set to 1');
      } else {
        console.log(`  ✗ Subsidiary update failed (Status ${subsidiaryUpdate.statusCode})`);
        console.log('  Response:', JSON.stringify(subsidiaryUpdate.data, null, 2));
        errorCount++;
        continue;
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Set sales rep to 16
      console.log('  → Step 2: Setting sales rep to 16...');
      const salesRepUpdate = await updateCustomer(customer.id, {
        salesRep: { id: "16" }
      });

      if (salesRepUpdate.statusCode === 200 || salesRepUpdate.statusCode === 204) {
        console.log('  ✓ Sales rep set to 16');
        console.log('  ✅ SUCCESS - Customer fully updated!');
        successCount++;
      } else {
        console.log(`  ✗ Sales rep update failed (Status ${salesRepUpdate.statusCode})`);
        console.log('  Response:', JSON.stringify(salesRepUpdate.data, null, 2));
        errorCount++;
      }

    } catch (error) {
      console.log(`  ✗ ERROR: ${error.message}`);
      errorCount++;
    }

    // Delay between customers
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY:');
  console.log(`   Total customers: ${errorCustomers.length}`);
  console.log(`   ✓ Successfully fixed: ${successCount}`);
  console.log(`   ✗ Errors: ${errorCount}`);
  console.log('');
}

// Run the fix
fixCustomers()
  .then(() => {
    console.log('✅ Fix process complete!');
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
  });
