/**
 * Agent 9: REST POST Search Tests for Employee Records
 * Testing various POST body formats to search employees
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

function testPOSTRequest(endpoint, body, description) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com${endpoint}`;
    const method = 'POST';
    const bodyStr = JSON.stringify(body);

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
      path: endpoint,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Prefer': 'transient'
      }
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TEST: ${description}`);
    console.log(`${'='.repeat(80)}`);
    console.log('📍 Endpoint:', endpoint);
    console.log('📦 Body:', bodyStr);

    const req = https.request(options, (res) => {
      let data = '';

      console.log('📊 Response status:', res.statusCode);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsed,
            description: description,
            endpoint: endpoint,
            body: body
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            description: description,
            endpoint: endpoint,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(bodyStr);
    req.end();
  });
}

// Array of tests to run
const tests = [
  {
    description: 'POST to /employee with SuiteQL-style query',
    endpoint: '/services/rest/record/v1/employee',
    body: { q: "firstname IS 'Eric'" }
  },
  {
    description: 'POST to /employee with criteria array',
    endpoint: '/services/rest/record/v1/employee',
    body: {
      criteria: [
        { fieldId: "lastname", operator: "IS", values: ["Pearle"] }
      ]
    }
  },
  {
    description: 'POST to /employee with filters object',
    endpoint: '/services/rest/record/v1/employee',
    body: {
      filters: {
        lastname: "Pearle"
      }
    }
  },
  {
    description: 'POST to /employee/search endpoint',
    endpoint: '/services/rest/record/v1/employee/search',
    body: { q: "firstname IS 'Eric'" }
  },
  {
    description: 'POST to /employee with search field',
    endpoint: '/services/rest/record/v1/employee',
    body: {
      search: {
        criteria: [
          { field: "lastname", operator: "is", value: "Pearle" }
        ]
      }
    }
  },
  {
    description: 'POST to query endpoint with employee table',
    endpoint: '/services/rest/query/v1/suiteql',
    body: {
      q: "SELECT id, firstname, lastname, email FROM employee FETCH FIRST 5 ROWS ONLY"
    }
  },
  {
    description: 'POST to /employee with limit and offset',
    endpoint: '/services/rest/record/v1/employee',
    body: {
      limit: 5,
      offset: 0
    }
  },
  {
    description: 'POST to /employee with fields selection',
    endpoint: '/services/rest/record/v1/employee',
    body: {
      fields: ["id", "firstname", "lastname", "email"]
    }
  }
];

// Run all tests sequentially
async function runAllTests() {
  console.log('🚀 Agent 9: Testing REST POST Employee Search');
  console.log('📍 Account: River Supply, Inc. (Sandbox 1)');
  console.log('🆔 Account ID:', config.accountId);

  const results = [];

  for (const test of tests) {
    try {
      const result = await testPOSTRequest(test.endpoint, test.body, test.description);
      results.push(result);

      // Show result preview
      if (result.statusCode === 200) {
        console.log('✅ SUCCESS! Status 200');
        if (result.data) {
          console.log('📄 Response preview:', JSON.stringify(result.data, null, 2).substring(0, 500));
        }
      } else {
        console.log(`❌ Status ${result.statusCode}`);
        if (result.data) {
          console.log('📄 Response:', typeof result.data === 'string'
            ? result.data.substring(0, 300)
            : JSON.stringify(result.data, null, 2).substring(0, 300));
        }
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('❌ ERROR:', error.message);
      results.push({
        description: test.description,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 AGENT 9 SUMMARY - REST POST SEARCH RESULTS');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.statusCode === 200);
  const withData = results.filter(r => r.statusCode === 200 && r.data &&
    (r.data.items || r.data.records || (Array.isArray(r.data) && r.data.length > 0)));

  console.log(`\n✅ Successful requests (200): ${successful.length}/${results.length}`);
  console.log(`📦 Requests with data: ${withData.length}/${results.length}`);

  if (withData.length > 0) {
    console.log('\n🎉 EMPLOYEE DATA FOUND IN THESE TESTS:');
    withData.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.description}`);
      console.log(`   Endpoint: ${result.endpoint}`);
      console.log(`   Body: ${JSON.stringify(result.body)}`);
      console.log(`   Response has:`,
        result.data.items ? `${result.data.items.length} items` :
        result.data.records ? `${result.data.records.length} records` :
        Array.isArray(result.data) ? `${result.data.length} records` :
        'data structure'
      );
    });
  }

  if (successful.length === 0) {
    console.log('\n⚠️  No successful POST requests found.');
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 Agent 9 testing complete');
  console.log('='.repeat(80));
}

// Execute
runAllTests().catch(console.error);
