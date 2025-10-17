/**
 * NetSuite REST API Test - Approach 3: system.netsuite.com Signature
 *
 * This approach tests using system.netsuite.com as the base URL for OAuth signature
 * calculation, while still sending the actual request to the account-specific subdomain.
 *
 * Some NetSuite implementations require this pattern for signature generation.
 */

const crypto = require('crypto');
const https = require('https');

// NetSuite Configuration - River Supply Sandbox 1
const config = {
  accountId: '9910981-sb1',  // For actual request hostname
  consumerKey: 'bd6196d01ed2c54870c69e760025ec93bbc36a0dc610af928889b9c193b23cfd',
  consumerSecret: '478e6d485c65368fa4dd087d8ff61a422f9de1e5eb4cf56aed4884f40fc2bb88',
  tokenId: '4d1aa3b5e7bc4fca471a84ae87ee6ca4d897a8d983fa7d8872e9fb1e04d0ede5',
  tokenSecret: 'bd65c2f0fcd35aab4380aea9617ba71e6ae2bb9c16b802907338772f9709f7cf',
  realm: '9910981_SB1'  // Using underscore format
};

/**
 * Generate OAuth 1.0a signature for NetSuite TBA
 * KEY DIFFERENCE: Uses system.netsuite.com for signature URL
 */
function generateOAuthHeader(signatureUrl, method, realm, consumerKey, consumerSecret, tokenId, tokenSecret) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  // OAuth parameters
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_token: tokenId,
    oauth_version: '1.0'
  };

  // Build signature base string using the provided signature URL
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(signatureUrl)}&${encodeURIComponent(paramString)}`;

  // Generate signature - NetSuite uses HMAC-SHA256
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  // Build OAuth header
  const authHeader = `OAuth realm="${realm}", ` +
    Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ') +
    `, oauth_signature="${encodeURIComponent(signature)}"`;

  return authHeader;
}

/**
 * Get records from NetSuite REST API using system.netsuite.com signature approach
 */
function getRecords(recordType, queryParams = '') {
  return new Promise((resolve, reject) => {
    const path = `/services/rest/record/v1/${recordType}`;
    const fullPath = queryParams ? `${path}?${queryParams}` : path;

    // KEY DIFFERENCE: Use system.netsuite.com for signature calculation
    const signatureUrl = `https://system.netsuite.com${path}`;

    // But send actual request to account-specific subdomain
    const actualRequestUrl = `https://${config.accountId}.suitetalk.api.netsuite.com${fullPath}`;

    const method = 'GET';

    const authHeader = generateOAuthHeader(
      signatureUrl,  // Use system.netsuite.com for signature
      method,
      config.realm,
      config.consumerKey,
      config.consumerSecret,
      config.tokenId,
      config.tokenSecret
    );

    const options = {
      hostname: `${config.accountId}.suitetalk.api.netsuite.com`,
      path: fullPath,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Prefer': 'transient'
      }
    };

    console.log('=== APPROACH 3: system.netsuite.com Signature ===');
    console.log('Signature URL:', signatureUrl);
    console.log('Actual Request URL:', actualRequestUrl);
    console.log('Method:', method);
    console.log('Realm:', config.realm);
    console.log('');

    const req = https.request(options, (res) => {
      let data = '';

      console.log('Response status:', res.statusCode);
      console.log('Response headers:', JSON.stringify(res.headers, null, 2));

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

    req.end();
  });
}

// Run the test
console.log('========================================');
console.log('NetSuite REST API - Approach 3 Test');
console.log('========================================');
console.log('Account: River Supply, Inc. (Sandbox 1)');
console.log('Account ID:', config.accountId);
console.log('Realm:', config.realm);
console.log('');
console.log('APPROACH: Use system.netsuite.com for OAuth signature calculation');
console.log('          Send actual request to account-specific subdomain');
console.log('========================================\n');

getRecords('customer', 'limit=1')
  .then(result => {
    console.log('\n========================================');
    console.log('RESULT');
    console.log('========================================');
    console.log('Status Code:', result.statusCode);
    console.log('\nResponse Data:');
    console.log(JSON.stringify(result.data, null, 2));

    if (result.statusCode === 200 && result.data.items) {
      console.log('\n✅ ✅ ✅ SUCCESS! ✅ ✅ ✅');
      console.log('Retrieved', result.data.items.length, 'customer(s):');
      result.data.items.forEach(item => {
        console.log(`  - ID: ${item.id}, Name: ${item.companyName || item.entityId}`);
      });
      console.log('\n🎉 APPROACH 3 WORKS! Using system.netsuite.com for signature calculation is the correct method!');
    } else if (result.statusCode === 401) {
      console.log('\n❌ APPROACH 3 FAILED - Authentication failed');
      console.log('This approach does not work for this account.');
    } else if (result.statusCode === 403) {
      console.log('\n⚠️ APPROACH 3 PARTIAL - Authentication succeeded but access forbidden');
      console.log('Token lacks permission to access customer records.');
    } else {
      console.log('\n❌ APPROACH 3 FAILED - Unexpected status code');
    }
    console.log('========================================');
  })
  .catch(error => {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  });
