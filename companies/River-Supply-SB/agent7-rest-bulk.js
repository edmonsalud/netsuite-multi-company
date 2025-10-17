/**
 * Agent 7: Test bulk employee record retrieval
 * Testing different query parameters and approaches for bulk GET
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

function makeRestRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const fullUrl = `https://${config.accountId}.suitetalk.api.netsuite.com${path}`;

    const authHeader = generateOAuthHeader(
      fullUrl,
      method,
      config.realm,
      config.consumerKey,
      config.consumerSecret,
      config.tokenId,
      config.tokenSecret
    );

    const options = {
      hostname: `${config.accountId}.suitetalk.api.netsuite.com`,
      path: path,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Prefer': 'transient'
      }
    };

    console.log(`🚀 ${method} ${fullUrl}`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testBulkEmployeeRetrieval() {
  console.log('🧪 Agent 7: Testing Bulk Employee Record Retrieval');
  console.log('📍 Account: River Supply, Inc. (Sandbox 1)');
  console.log('🆔 Account ID:', config.accountId);
  console.log('');

  const tests = [
    {
      name: 'Test 1: Basic bulk GET with limit',
      path: '/services/rest/record/v1/employee?limit=100'
    },
    {
      name: 'Test 2: Bulk GET with specific fields',
      path: '/services/rest/record/v1/employee?fields=id,entityid,firstname,lastname&limit=50'
    },
    {
      name: 'Test 3: Bulk GET with expandSubResources',
      path: '/services/rest/record/v1/employee?expandSubResources=true&limit=20'
    },
    {
      name: 'Test 4: Bulk GET with offset pagination',
      path: '/services/rest/record/v1/employee?limit=10&offset=0'
    },
    {
      name: 'Test 5: Minimal fields request',
      path: '/services/rest/record/v1/employee?fields=id,entityid&limit=100'
    },
    {
      name: 'Test 6: With expand and specific fields',
      path: '/services/rest/record/v1/employee?fields=id,entityid,email,firstname,lastname&expandSubResources=false&limit=25'
    },
    {
      name: 'Test 7: Very small limit to test response',
      path: '/services/rest/record/v1/employee?limit=5'
    },
    {
      name: 'Test 8: Just the base endpoint',
      path: '/services/rest/record/v1/employee'
    }
  ];

  for (const test of tests) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📋 ${test.name}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    try {
      const result = await makeRestRequest(test.path);

      console.log('📊 Status Code:', result.statusCode);

      if (result.statusCode === 200) {
        console.log('✅ SUCCESS! Got 200 response!');
        console.log('');

        // Check if we got employee data
        if (result.data) {
          if (Array.isArray(result.data)) {
            console.log(`🎉 Retrieved ${result.data.length} employee records!`);
            console.log('');
            console.log('Sample records:');
            result.data.slice(0, 3).forEach((emp, idx) => {
              console.log(`  ${idx + 1}. ${JSON.stringify(emp, null, 2)}`);
            });
          } else if (result.data.items && Array.isArray(result.data.items)) {
            console.log(`🎉 Retrieved ${result.data.items.length} employee records!`);
            console.log('');
            console.log('Sample records:');
            result.data.items.slice(0, 3).forEach((emp, idx) => {
              console.log(`  ${idx + 1}. ${JSON.stringify(emp, null, 2)}`);
            });
          } else if (result.data.links || result.data.count !== undefined) {
            console.log('📄 Response structure:');
            console.log(JSON.stringify(result.data, null, 2));
          } else {
            console.log('📄 Response data:');
            console.log(JSON.stringify(result.data, null, 2));
          }
        }
      } else if (result.statusCode === 401) {
        console.log('❌ 401 Unauthorized - OAuth issue');
        console.log('Response:', JSON.stringify(result.data, null, 2));
      } else if (result.statusCode === 403) {
        console.log('⚠️ 403 Forbidden - Permission issue');
        console.log('Response:', JSON.stringify(result.data, null, 2));
      } else if (result.statusCode === 400) {
        console.log('⚠️ 400 Bad Request - Invalid parameters');
        console.log('Response:', JSON.stringify(result.data, null, 2));
      } else {
        console.log('ℹ️ Status:', result.statusCode);
        console.log('Response:', JSON.stringify(result.data, null, 2));
      }

      // Show response headers if they contain useful info
      if (result.headers && result.headers['content-type']) {
        console.log('\n📋 Content-Type:', result.headers['content-type']);
      }

    } catch (error) {
      console.error('❌ ERROR:', error.message);
    }

    console.log('');
    console.log('');

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🏁 All bulk retrieval tests complete!');
  console.log('═══════════════════════════════════════════════════════════════');
}

// Run the tests
testBulkEmployeeRetrieval().catch(error => {
  console.error('💥 Fatal error:', error);
});
