/**
 * Agent 1: Test Employee Record Access via REST API GET
 * Testing employee IDs: 1, 2, 3, 10, 16
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

function getEmployee(employeeId) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/employee/${employeeId}`;
    const method = 'GET';

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
      path: `/services/rest/record/v1/employee/${employeeId}`,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
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
          resolve({ statusCode: res.statusCode, employeeId, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, employeeId, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject({ employeeId, error });
    });

    req.end();
  });
}

async function testEmployeeAccess() {
  console.log('🧪 Agent 1: Testing Employee Record Access via REST API GET');
  console.log('📍 Account: River Supply, Inc. (Sandbox 1)');
  console.log('🆔 Account ID:', config.accountId);
  console.log('');

  const employeeIds = [1, 2, 3, 10, 16];

  console.log('🔍 Testing Employee IDs:', employeeIds.join(', '));
  console.log('');

  for (const id of employeeIds) {
    try {
      console.log(`\n➡️  Testing Employee ID: ${id}`);
      console.log(`   URL: https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/employee/${id}`);

      const result = await getEmployee(id);

      console.log(`   Status: ${result.statusCode}`);

      if (result.statusCode === 200) {
        console.log('   ✅ SUCCESS! Employee record retrieved:');
        console.log(JSON.stringify(result.data, null, 2));
      } else if (result.statusCode === 404) {
        console.log('   ❌ 404 Not Found - Employee ID does not exist');
        if (result.data && result.data['o:errorDetails']) {
          console.log('   Error:', result.data['o:errorDetails'][0].detail);
        }
      } else if (result.statusCode === 403) {
        console.log('   ❌ 403 Forbidden - Access denied');
        if (result.data && result.data['o:errorDetails']) {
          console.log('   Error:', result.data['o:errorDetails'][0].detail);
        }
      } else if (result.statusCode === 401) {
        console.log('   ❌ 401 Unauthorized - Authentication failed');
        console.log('   Response:', JSON.stringify(result.data, null, 2));
      } else {
        console.log('   ❌ Unexpected status code');
        console.log('   Response:', JSON.stringify(result.data, null, 2));
      }

    } catch (error) {
      console.log(`   ❌ Request failed for Employee ID ${error.employeeId}`);
      console.log('   Error:', error.error.message);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n📊 Agent 1 Test Complete');
}

testEmployeeAccess().catch(error => {
  console.error('❌ Fatal error:', error);
});
