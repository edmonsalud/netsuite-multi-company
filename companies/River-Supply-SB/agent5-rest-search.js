/**
 * Agent 5: Testing Employee Record Access via REST API Search
 * Task: Try different employee query formats to find what works
 * Account: River-Supply-SB (9910981-sb1)
 */

const crypto = require('crypto');
const https = require('https');

// NetSuite Configuration - River Supply Sandbox 1 (PROVEN WORKING)
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

function executeSuiteQL(query, testName) {
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
          resolve({
            testName,
            query,
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            testName,
            query,
            statusCode: res.statusCode,
            data: data
          });
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

console.log('🔍 Agent 5: Testing Employee Record Access via REST API');
console.log('📍 Account: River Supply, Inc. (Sandbox 1)');
console.log('🆔 Account ID:', config.accountId);
console.log('');
console.log('Testing multiple query formats to find what works...');
console.log('═'.repeat(60));
console.log('');

// Test queries to try
const testQueries = [
  {
    name: 'Test 1: employees (lowercase with s)',
    query: "SELECT * FROM employees FETCH FIRST 5 ROWS ONLY"
  },
  {
    name: 'Test 2: Employee (capital E)',
    query: "SELECT * FROM Employee FETCH FIRST 5 ROWS ONLY"
  },
  {
    name: 'Test 3: EMPLOYEE (all caps)',
    query: "SELECT * FROM EMPLOYEE FETCH FIRST 5 ROWS ONLY"
  },
  {
    name: 'Test 4: employee (lowercase)',
    query: "SELECT * FROM employee FETCH FIRST 5 ROWS ONLY"
  },
  {
    name: 'Test 5: Specific fields (employee lowercase)',
    query: "SELECT id, entityid, firstname, lastname, email FROM employee FETCH FIRST 5 ROWS ONLY"
  },
  {
    name: 'Test 6: With WHERE clause (employee lowercase)',
    query: "SELECT id, entityid, firstname, lastname FROM employee WHERE isinactive = 'F' FETCH FIRST 5 ROWS ONLY"
  },
  {
    name: 'Test 7: COUNT query (employee lowercase)',
    query: "SELECT COUNT(*) as total_employees FROM employee"
  },
  {
    name: 'Test 8: COUNT query (EMPLOYEE uppercase)',
    query: "SELECT COUNT(*) as total_employees FROM EMPLOYEE"
  }
];

// Run all tests sequentially
async function runAllTests() {
  const results = {
    successful: [],
    failed: []
  };

  for (const test of testQueries) {
    console.log(`📝 ${test.name}`);
    console.log(`   Query: ${test.query}`);

    try {
      const result = await executeSuiteQL(test.query, test.name);

      if (result.statusCode === 200 && result.data.items) {
        console.log(`   ✅ SUCCESS! Status: ${result.statusCode}`);
        console.log(`   📊 Returned ${result.data.items.length} rows`);

        if (result.data.items.length > 0) {
          console.log(`   📄 First row:`, JSON.stringify(result.data.items[0], null, 2));
        }

        results.successful.push({
          test: test.name,
          query: test.query,
          rowCount: result.data.items.length,
          sample: result.data.items[0]
        });
      } else {
        console.log(`   ❌ FAILED: Status ${result.statusCode}`);
        if (result.data.error) {
          console.log(`   Error: ${result.data.error.message || result.data.error}`);
        }
        results.failed.push({
          test: test.name,
          query: test.query,
          status: result.statusCode,
          error: result.data.error || result.data
        });
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.failed.push({
        test: test.name,
        query: test.query,
        error: error.message
      });
    }

    console.log('');

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary report
  console.log('═'.repeat(60));
  console.log('📊 SUMMARY REPORT');
  console.log('═'.repeat(60));
  console.log('');

  console.log(`✅ Successful queries: ${results.successful.length}`);
  console.log(`❌ Failed queries: ${results.failed.length}`);
  console.log('');

  if (results.successful.length > 0) {
    console.log('🎉 SUCCESSFUL QUERIES:');
    console.log('');
    results.successful.forEach((result, index) => {
      console.log(`${index + 1}. ${result.test}`);
      console.log(`   Query: ${result.query}`);
      console.log(`   Rows returned: ${result.rowCount}`);
      console.log('');
    });
  }

  if (results.failed.length > 0) {
    console.log('❌ FAILED QUERIES:');
    console.log('');
    results.failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.test}`);
      console.log(`   Query: ${result.query}`);
      console.log(`   Error:`, result.error);
      console.log('');
    });
  }

  // Final recommendation
  console.log('═'.repeat(60));
  console.log('🔍 AGENT 5 FINDINGS:');
  console.log('═'.repeat(60));

  if (results.successful.length > 0) {
    console.log('✅ Found working query format(s) for employee records!');
    console.log('');
    console.log('💡 Recommended query format:');
    console.log(`   ${results.successful[0].query}`);
  } else {
    console.log('❌ No employee queries succeeded.');
    console.log('');
    console.log('Possible reasons:');
    console.log('- Employee record type not available in this account');
    console.log('- Insufficient permissions for employee records');
    console.log('- Different table name required');
    console.log('');
    console.log('💡 Suggestion: Try querying other record types or check permissions');
  }
}

// Execute all tests
runAllTests().catch(error => {
  console.error('❌ Fatal error:', error);
});
