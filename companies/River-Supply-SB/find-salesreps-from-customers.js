/**
 * Find Sales Rep IDs from Customer Records
 * Since we can't access employee table, let's find sales reps assigned to customers
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

async function findSalesReps() {
  console.log('🔍 Finding Sales Rep IDs from Customer Records');
  console.log('='.repeat(80));
  console.log('');

  // Query to get all unique sales rep IDs from customers
  const query = `
    SELECT DISTINCT
      salesrep as salesrep_id
    FROM customer
    WHERE salesrep IS NOT NULL
    ORDER BY salesrep
  `;

  console.log('Querying all unique sales rep IDs assigned to customers...\n');

  try {
    const result = await executeSuiteQL(query);

    if (result.statusCode === 200 && result.data.items) {
      console.log(`✅ Found ${result.data.items.length} unique sales rep IDs:\n`);

      const salesRepIds = result.data.items.map(item => item.salesrep_id);

      console.log('Sales Rep Internal IDs currently in use:');
      salesRepIds.forEach((id, index) => {
        console.log(`  ${index + 1}. Internal ID: ${id}`);
      });

      console.log('\n' + '='.repeat(80));
      console.log('\n💡 Since we cannot access the employee table directly,');
      console.log('these are the sales rep IDs that are currently assigned to customers.');
      console.log('\nTo find specific employees like Eric Pearle, Garrett Dixon, etc.,');
      console.log('you would need to:');
      console.log('  1. Log into NetSuite UI');
      console.log('  2. Go to Lists → Employees → Employees');
      console.log('  3. Search for each name');
      console.log('  4. Note their Internal ID from the URL or record');
      console.log('\nAlternatively, if you know which customers they currently serve,');
      console.log('we can look up the sales rep ID from those customer records.');

    } else {
      console.log('❌ Query failed');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(80));
}

// Run the search
findSalesReps()
  .then(() => {
    console.log('\n✅ Complete!');
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
  });
