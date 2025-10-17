/**
 * Agent 8: Testing SuiteQL BUILTIN Functions to Access Employee Data
 *
 * Goal: Use BUILTIN.DF() and other BUILTIN functions to decode employee IDs to names
 *
 * BUILTIN functions being tested:
 * - BUILTIN.DF(salesrep) - Display Field, should convert ID to employee name
 * - BUILTIN.ENTITY() - Entity information
 * - BUILTIN.USER() - User information
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

async function runTests() {
  console.log('🤖 AGENT 8: Testing BUILTIN Functions for Employee Data Access');
  console.log('=' .repeat(70));
  console.log('📍 Account: River Supply, Inc. (Sandbox 1)');
  console.log('🆔 Account ID:', config.accountId);
  console.log('');

  // Test 1: BUILTIN.DF() to decode salesrep ID to employee name
  console.log('🧪 TEST 1: BUILTIN.DF(salesrep) - Display Field Function');
  console.log('-'.repeat(70));

  const query1 = "SELECT BUILTIN.DF(salesrep) as salesrep_name, salesrep FROM customer WHERE salesrep IS NOT NULL FETCH FIRST 20 ROWS ONLY";
  console.log('📝 Query:', query1);
  console.log('');

  try {
    const result1 = await executeSuiteQL(query1);
    console.log('📊 Response status:', result1.statusCode);

    if (result1.statusCode === 200 && result1.data.items) {
      console.log('✅ SUCCESS! Retrieved', result1.data.items.length, 'records\n');

      // Create a unique list of employees
      const employeeMap = new Map();
      result1.data.items.forEach(item => {
        if (item.salesrep && item.salesrep_name) {
          employeeMap.set(item.salesrep, item.salesrep_name);
        }
      });

      console.log('🎯 EMPLOYEE ID TO NAME MAPPING:');
      console.log('');
      employeeMap.forEach((name, id) => {
        console.log(`   Employee ID: ${id} → Name: ${name}`);
      });
      console.log('');
      console.log('🚨 RESULT: BUILTIN.DF() SUCCESSFULLY EXPOSED EMPLOYEE NAMES!');
      console.log(`🚨 Found ${employeeMap.size} unique employees via salesrep field`);

    } else if (result1.statusCode === 403) {
      console.log('❌ FORBIDDEN: Insufficient permissions for BUILTIN.DF()');
    } else {
      console.log('Response:', JSON.stringify(result1.data, null, 2));
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 2: Try other BUILTIN functions
  console.log('🧪 TEST 2: BUILTIN Functions with Customer Table');
  console.log('-'.repeat(70));

  const query2 = "SELECT id, entityid, salesrep, BUILTIN.DF(salesrep) as salesrep_name, BUILTIN.DF(entitystatus) as status_name FROM customer WHERE salesrep IS NOT NULL FETCH FIRST 10 ROWS ONLY";
  console.log('📝 Query:', query2);
  console.log('');

  try {
    const result2 = await executeSuiteQL(query2);
    console.log('📊 Response status:', result2.statusCode);

    if (result2.statusCode === 200 && result2.data.items) {
      console.log('✅ SUCCESS! Retrieved', result2.data.items.length, 'records\n');

      result2.data.items.forEach((item, index) => {
        console.log(`${index + 1}. Customer ID: ${item.id} (${item.entityid})`);
        console.log(`   Salesrep ID: ${item.salesrep}`);
        console.log(`   Salesrep Name: ${item.salesrep_name || 'N/A'}`);
        console.log(`   Status: ${item.status_name || 'N/A'}`);
        console.log('');
      });

    } else if (result2.statusCode === 403) {
      console.log('❌ FORBIDDEN: Insufficient permissions');
    } else {
      console.log('Response:', JSON.stringify(result2.data, null, 2));
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 3: Try to get transaction salesrep data
  console.log('🧪 TEST 3: BUILTIN.DF() on Transaction Salesrep');
  console.log('-'.repeat(70));

  const query3 = "SELECT id, tranid, salesrep, BUILTIN.DF(salesrep) as salesrep_name FROM transaction WHERE salesrep IS NOT NULL FETCH FIRST 20 ROWS ONLY";
  console.log('📝 Query:', query3);
  console.log('');

  try {
    const result3 = await executeSuiteQL(query3);
    console.log('📊 Response status:', result3.statusCode);

    if (result3.statusCode === 200 && result3.data.items) {
      console.log('✅ SUCCESS! Retrieved', result3.data.items.length, 'transactions\n');

      // Create unique employee list
      const employeeMap = new Map();
      result3.data.items.forEach(item => {
        if (item.salesrep && item.salesrep_name) {
          employeeMap.set(item.salesrep, item.salesrep_name);
        }
      });

      console.log('🎯 EMPLOYEE ID TO NAME MAPPING (from Transactions):');
      console.log('');
      employeeMap.forEach((name, id) => {
        console.log(`   Employee ID: ${id} → Name: ${name}`);
      });
      console.log('');
      console.log('🚨 RESULT: BUILTIN.DF() on transactions also exposes employee names!');
      console.log(`🚨 Found ${employeeMap.size} unique employees via transaction salesrep field`);

    } else if (result3.statusCode === 403) {
      console.log('❌ FORBIDDEN: Insufficient permissions for transaction table');
    } else {
      console.log('Response:', JSON.stringify(result3.data, null, 2));
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🏁 AGENT 8 TESTS COMPLETE');
  console.log('=' .repeat(70));
}

runTests();
