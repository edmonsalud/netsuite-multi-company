/**
 * Agent 10: Find Employee References Through Transaction Tables
 * River-Supply-SB NetSuite Account
 *
 * Testing Strategy:
 * 1. Query salesrep from transaction table
 * 2. Query employee from transactionline table
 * 3. Join customer with transaction for salesrep data
 * 4. Look for any employee-related references
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

function executeSuiteQL(query) {
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
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
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

async function testQuery(description, query) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 TEST: ${description}`);
  console.log('='.repeat(80));
  console.log('📝 Query:', query);
  console.log('');

  try {
    const result = await executeSuiteQL(query);
    console.log('📊 Status Code:', result.statusCode);

    if (result.statusCode === 200) {
      if (result.data.items && result.data.items.length > 0) {
        console.log(`✅ SUCCESS! Found ${result.data.items.length} records\n`);

        // Show first 10 records
        const displayCount = Math.min(10, result.data.items.length);
        result.data.items.slice(0, displayCount).forEach((item, index) => {
          console.log(`Record ${index + 1}:`, JSON.stringify(item, null, 2));
        });

        if (result.data.items.length > 10) {
          console.log(`\n... and ${result.data.items.length - 10} more records`);
        }

        // Extract unique employee IDs if present
        const employeeFields = ['salesrep', 'employee', 'createdby', 'lastmodifiedby'];
        const employeeIds = new Set();

        result.data.items.forEach(item => {
          employeeFields.forEach(field => {
            if (item[field]) {
              employeeIds.add(item[field]);
            }
          });
        });

        if (employeeIds.size > 0) {
          console.log('\n🎯 EMPLOYEE IDs FOUND:', Array.from(employeeIds).sort());
        }

        return { success: true, count: result.data.items.length, employeeIds: Array.from(employeeIds) };
      } else {
        console.log('⚠️  Query succeeded but returned no records');
        return { success: true, count: 0, employeeIds: [] };
      }
    } else {
      console.log('❌ FAILED');
      console.log('Response:', JSON.stringify(result.data, null, 2));
      return { success: false, error: result.data };
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Agent 10: Employee Reference Discovery');
  console.log('📍 Account: River Supply, Inc. (Sandbox 1)');
  console.log('🆔 Account ID:', config.accountId);
  console.log('');

  const allEmployeeIds = new Set();
  const results = [];

  // Test 1: Salesrep from transaction table
  const test1 = await testQuery(
    'Find salesreps in transaction table',
    "SELECT DISTINCT salesrep FROM transaction WHERE salesrep IS NOT NULL FETCH FIRST 50 ROWS ONLY"
  );
  results.push({ test: 'Transaction salesrep', ...test1 });
  test1.employeeIds?.forEach(id => allEmployeeIds.add(id));

  // Test 2: Employee from transactionline table
  const test2 = await testQuery(
    'Find employees in transactionline table',
    "SELECT DISTINCT employee FROM transactionline WHERE employee IS NOT NULL FETCH FIRST 50 ROWS ONLY"
  );
  results.push({ test: 'Transactionline employee', ...test2 });
  test2.employeeIds?.forEach(id => allEmployeeIds.add(id));

  // Test 3: Join customer with transaction
  const test3 = await testQuery(
    'Join customer with transaction for salesrep',
    "SELECT DISTINCT c.salesrep, c.entityid, t.tranid FROM customer c JOIN transaction t ON c.id = t.entity WHERE c.salesrep IS NOT NULL FETCH FIRST 50 ROWS ONLY"
  );
  results.push({ test: 'Customer-Transaction join', ...test3 });
  test3.employeeIds?.forEach(id => allEmployeeIds.add(id));

  // Test 4: Sales order specific query
  const test4 = await testQuery(
    'Find employees in sales orders',
    "SELECT id, tranid, salesrep, entity FROM transaction WHERE type = 'SalesOrd' AND salesrep IS NOT NULL FETCH FIRST 50 ROWS ONLY"
  );
  results.push({ test: 'Sales orders', ...test4 });
  test4.employeeIds?.forEach(id => allEmployeeIds.add(id));

  // Test 5: Transaction with employee metadata
  const test5 = await testQuery(
    'Transaction with creator/modifier info',
    "SELECT id, tranid, type, createdby, lastmodifiedby FROM transaction FETCH FIRST 50 ROWS ONLY"
  );
  results.push({ test: 'Transaction metadata', ...test5 });
  test5.employeeIds?.forEach(id => allEmployeeIds.add(id));

  // Test 6: Check customer salesrep field
  const test6 = await testQuery(
    'Customer salesrep field',
    "SELECT id, entityid, companyname, salesrep FROM customer WHERE salesrep IS NOT NULL FETCH FIRST 50 ROWS ONLY"
  );
  results.push({ test: 'Customer salesrep', ...test6 });
  test6.employeeIds?.forEach(id => allEmployeeIds.add(id));

  // Final Summary
  console.log('\n');
  console.log('='.repeat(80));
  console.log('📊 FINAL SUMMARY - EMPLOYEE ID DISCOVERY');
  console.log('='.repeat(80));
  console.log('');

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.count || 0} records, ${result.employeeIds?.length || 0} employee IDs`);
  });

  console.log('\n🎯 ALL UNIQUE EMPLOYEE IDs DISCOVERED:');
  if (allEmployeeIds.size > 0) {
    const sortedIds = Array.from(allEmployeeIds).sort((a, b) => a - b);
    console.log(sortedIds);
    console.log('\nTotal unique employee IDs found:', allEmployeeIds.size);

    console.log('\n💡 RECOMMENDATION:');
    console.log('Try querying employee table with these IDs:');
    console.log(`SELECT * FROM employee WHERE id IN (${sortedIds.join(', ')})`);
  } else {
    console.log('⚠️  No employee IDs found in any transaction-related tables');
    console.log('\n💡 POSSIBLE REASONS:');
    console.log('1. No transactions exist with employee references');
    console.log('2. Employee fields are null in all transactions');
    console.log('3. Account may not have employee records set up');
  }

  console.log('\n' + '='.repeat(80));
}

// Run all tests
runAllTests().catch(error => {
  console.error('❌ FATAL ERROR:', error);
});
