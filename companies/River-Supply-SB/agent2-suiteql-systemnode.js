/**
 * Agent 2: Test SuiteQL systemnode/systemnote tables for employee records
 * River-Supply-SB Account
 */

const crypto = require('crypto');
const https = require('https');

// NetSuite Configuration - River Supply Sandbox 1
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

  const paramString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  const authHeader = `OAuth realm="${realm}", ` +
    Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ') +
    `, oauth_signature="${encodeURIComponent(signature)}"`;

  return authHeader;
}

function executeSuiteQL(query, queryName) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`;
    const method = 'POST';
    const body = JSON.stringify({ q: query });

    const authHeader = generateOAuthHeader(
      url,
      method,
      config.realm,
      config.consumerKey,
      config.consumerSecret,
      config.tokenId,
      config.tokenSecret
    );

    const options = {
      hostname: `${config.accountId}.suitetalk.api.netsuite.com`,
      path: '/services/rest/query/v1/suiteql',
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'transient'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ queryName, statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ queryName, statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Agent 2: Testing systemnode/systemnote tables for employee records');
  console.log('📍 Account: River Supply, Inc. (Sandbox 1)');
  console.log('🆔 Account ID:', config.accountId);
  console.log('');

  const queries = [
    {
      name: 'Query 1: systemnode with recordtype employee',
      sql: "SELECT * FROM systemnode WHERE recordtype = 'employee' FETCH FIRST 10 ROWS ONLY"
    },
    {
      name: 'Query 2: systemnote searching for Pearle',
      sql: "SELECT * FROM systemnote WHERE name LIKE '%Pearle%' FETCH FIRST 10 ROWS ONLY"
    },
    {
      name: 'Query 3: systemnode general browse',
      sql: "SELECT * FROM systemnode FETCH FIRST 10 ROWS ONLY"
    },
    {
      name: 'Query 4: systemnote general browse',
      sql: "SELECT * FROM systemnote FETCH FIRST 10 ROWS ONLY"
    },
    {
      name: 'Query 5: systemnode searching for employee-related fields',
      sql: "SELECT * FROM systemnode WHERE recordtype LIKE '%employ%' FETCH FIRST 10 ROWS ONLY"
    },
    {
      name: 'Query 6: systemnote searching for Dixon',
      sql: "SELECT * FROM systemnote WHERE name LIKE '%Dixon%' FETCH FIRST 10 ROWS ONLY"
    },
    {
      name: 'Query 7: systemnote searching for Landers',
      sql: "SELECT * FROM systemnote WHERE name LIKE '%Landers%' FETCH FIRST 10 ROWS ONLY"
    }
  ];

  for (const query of queries) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 ${query.name}`);
    console.log(`SQL: ${query.sql}`);
    console.log('');

    try {
      const result = await executeSuiteQL(query.sql, query.name);

      console.log(`📊 Status: ${result.statusCode}`);

      if (result.statusCode === 200) {
        console.log('✅ SUCCESS!');
        if (result.data.items) {
          console.log(`📦 Found ${result.data.items.length} items`);
          console.log('');
          console.log('Data:', JSON.stringify(result.data.items, null, 2));
        } else {
          console.log('Response:', JSON.stringify(result.data, null, 2));
        }
      } else {
        console.log('❌ Error or no data');
        console.log('Response:', JSON.stringify(result.data, null, 2));
      }

      console.log('');
    } catch (error) {
      console.log('❌ ERROR:', error.message);
      console.log('');
    }

    // Small delay between queries
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Agent 2 testing complete');
}

runTests().catch(console.error);
