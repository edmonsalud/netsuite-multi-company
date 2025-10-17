/**
 * Explore Different Table Names for Employee Data
 * Try various SuiteQL table names that might contain employee information
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

// Different table name variations to try
const tableVariations = [
  { name: 'nexus', query: 'SELECT * FROM nexus FETCH FIRST 5 ROWS ONLY' },
  { name: 'entitystatus', query: 'SELECT * FROM entitystatus FETCH FIRST 5 ROWS ONLY' },
  { name: 'transaction (employees)', query: "SELECT id, entity, createdby FROM transaction WHERE createdby IN (SELECT id FROM customer WHERE isperson = 'T') FETCH FIRST 5 ROWS ONLY" },
  { name: 'customer (as people)', query: "SELECT id, entityid, companyname, isperson FROM customer WHERE isperson = 'T' AND entityid LIKE '%Pearle%' FETCH FIRST 10 ROWS ONLY" },
  { name: 'vendor (check if employees)', query: "SELECT id, entityid, companyname FROM vendor FETCH FIRST 5 ROWS ONLY" }
];

async function exploreTables() {
  console.log('🔍 Exploring different table names for employee data');
  console.log('='.repeat(80));
  console.log('');

  for (const table of tableVariations) {
    console.log(`\nTrying table: ${table.name}`);
    console.log(`Query: ${table.query}`);

    try {
      const result = await executeSuiteQL(table.query);

      console.log(`  Status: ${result.statusCode}`);

      if (result.statusCode === 200 && result.data.items) {
        console.log(`  ✅ SUCCESS! Found ${result.data.items.length} records`);
        console.log('  Sample data:', JSON.stringify(result.data.items[0], null, 2));
      } else if (result.statusCode === 200) {
        console.log('  ✅ Query worked but no data returned');
        console.log('  Response:', JSON.stringify(result.data, null, 2));
      } else {
        console.log('  ❌ Failed');
        console.log('  Error:', JSON.stringify(result.data, null, 2));
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`  ✗ ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\nNow trying specific name searches in customer table...\n');

  // Try searching for the sales rep names in the customer table (they might be marked as people/contacts)
  const names = ['Eric Pearle', 'Garrett Dixon', 'Greg Landers', 'Jeff McKendree', 'Kim Lyons', 'Matt Macleod', 'Mike McCarn', 'Sandy Hopkins'];

  for (const name of names) {
    const nameParts = name.split(' ');
    const query = `SELECT id, entityid, companyname, isperson FROM customer WHERE (companyname LIKE '%${nameParts[1]}%' OR entityid LIKE '%${nameParts[1]}%') FETCH FIRST 5 ROWS ONLY`;

    console.log(`\nSearching for: ${name}`);

    try {
      const result = await executeSuiteQL(query);

      if (result.statusCode === 200 && result.data.items && result.data.items.length > 0) {
        console.log(`  ✅ Found ${result.data.items.length} potential matches:`);
        result.data.items.forEach(item => {
          console.log(`    - ID: ${item.id}, Entity: ${item.entityid}, Name: ${item.companyname}`);
        });
      } else {
        console.log('  ❌ Not found in customer table');
      }

      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.log(`  ✗ ERROR: ${error.message}`);
    }
  }
}

// Run the exploration
exploreTables()
  .then(() => {
    console.log('\n✅ Exploration complete!');
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
  });
