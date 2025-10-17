/**
 * Agent 4: Employee ID Discovery via Transaction Tables
 * Testing: Find employee IDs through transaction table references
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
  console.log('🕵️  Agent 4: Employee ID Discovery via Transaction Tables');
  console.log('📍 Account: River Supply, Inc. (Sandbox 1)');
  console.log('🆔 Account ID:', config.accountId);
  console.log('');

  // Test 1: Get DISTINCT createdby and modifiedby IDs
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test 1: Get DISTINCT createdby, modifiedby from transactions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const query1 = "SELECT id, tranid, createdby, modifiedby FROM transaction WHERE rownum <= 50";
  console.log('📝 Query:', query1);
  console.log('');

  try {
    const result1 = await executeSuiteQL(query1);
    console.log('📊 Status Code:', result1.statusCode);

    if (result1.statusCode === 200 && result1.data.items) {
      console.log('✅ SUCCESS! Found', result1.data.items.length, 'transaction records\n');

      // Collect unique IDs
      const createdByIds = new Set();
      const modifiedByIds = new Set();

      result1.data.items.forEach((item, index) => {
        if (item.createdby) createdByIds.add(item.createdby);
        if (item.modifiedby) modifiedByIds.add(item.modifiedby);

        if (index < 10) {
          console.log(`${index + 1}. Created By: ${item.createdby || 'NULL'}, Modified By: ${item.modifiedby || 'NULL'}`);
        }
      });

      console.log('\n📊 Summary:');
      console.log(`   Unique Created By IDs: ${createdByIds.size}`);
      console.log(`   Unique Modified By IDs: ${modifiedByIds.size}`);

      const allUserIds = new Set([...createdByIds, ...modifiedByIds]);
      console.log(`   Total Unique User IDs: ${allUserIds.size}`);
      console.log('\n🔍 Unique User IDs found:');
      Array.from(allUserIds).sort((a, b) => a - b).forEach(id => {
        console.log(`   - ${id}`);
      });
    } else {
      console.log('❌ Unexpected response:', JSON.stringify(result1.data, null, 2));
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  console.log('\n');

  // Test 2: Get full transaction details with employee fields
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test 2: Get transaction details with employee-related fields');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const query2 = "SELECT id, tranid, type, createdby, modifiedby, createddate FROM transaction WHERE rownum <= 10";
  console.log('📝 Query:', query2);
  console.log('');

  try {
    const result2 = await executeSuiteQL(query2);
    console.log('📊 Status Code:', result2.statusCode);

    if (result2.statusCode === 200 && result2.data.items) {
      console.log('✅ SUCCESS! Retrieved', result2.data.items.length, 'transactions\n');

      result2.data.items.forEach((txn, index) => {
        console.log(`${index + 1}. Transaction ID: ${txn.id}`);
        console.log(`   Tran Number: ${txn.tranid || 'N/A'}`);
        console.log(`   Type: ${txn.type || 'N/A'}`);
        console.log(`   Created By: ${txn.createdby || 'NULL'}`);
        console.log(`   Modified By: ${txn.modifiedby || 'NULL'}`);
        console.log(`   Created Date: ${txn.createddate || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ Unexpected response:', JSON.stringify(result2.data, null, 2));
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  console.log('\n');

  // Test 3: Try to find employee-specific fields in transactions
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test 3: Look for employee field in transactions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const query3 = "SELECT id, tranid, type, employee FROM transaction WHERE rownum <= 20";
  console.log('📝 Query:', query3);
  console.log('');

  try {
    const result3 = await executeSuiteQL(query3);
    console.log('📊 Status Code:', result3.statusCode);

    if (result3.statusCode === 200 && result3.data.items) {
      console.log('✅ SUCCESS! Found', result3.data.items.length, 'transactions with employee field\n');

      const employeeIds = new Set();

      result3.data.items.forEach((txn, index) => {
        if (txn.employee) employeeIds.add(txn.employee);

        console.log(`${index + 1}. Transaction ID: ${txn.id}`);
        console.log(`   Tran Number: ${txn.tranid || 'N/A'}`);
        console.log(`   Type: ${txn.type || 'N/A'}`);
        console.log(`   Employee ID: ${txn.employee || 'NULL'}`);
        console.log('');
      });

      if (employeeIds.size > 0) {
        console.log('🔍 Unique Employee IDs found:');
        Array.from(employeeIds).sort((a, b) => a - b).forEach(id => {
          console.log(`   - ${id}`);
        });
      } else {
        console.log('⚠️ No employee IDs found in these transactions');
      }
    } else {
      console.log('❌ Unexpected response:', JSON.stringify(result3.data, null, 2));
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  console.log('\n');

  // Test 4: Try systemNote table (tracks who created/modified records)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test 4: Check systemNote table for user IDs');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const query4 = "SELECT name, recordid, recordtypeid FROM systemNote WHERE rownum <= 100";
  console.log('📝 Query:', query4);
  console.log('');

  try {
    const result4 = await executeSuiteQL(query4);
    console.log('📊 Status Code:', result4.statusCode);

    if (result4.statusCode === 200 && result4.data.items) {
      console.log('✅ SUCCESS! Found', result4.data.items.length, 'system note entries\n');

      const userNames = new Set();

      result4.data.items.forEach((note, index) => {
        if (note.name) userNames.add(note.name);

        if (index < 15) {
          console.log(`${index + 1}. User ID: ${note.name || 'NULL'} | Record: ${note.recordid || 'N/A'} | Type: ${note.recordtypeid || 'N/A'}`);
        }
      });

      console.log('\n🔍 Unique User IDs found in systemNote:');
      Array.from(userNames).sort((a, b) => a - b).forEach(id => {
        console.log(`   - ${id}`);
      });
    } else {
      console.log('❌ Unexpected response:', JSON.stringify(result4.data, null, 2));
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Agent 4 Testing Complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

runTests();
