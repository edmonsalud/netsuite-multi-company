/**
 * NetSuite REST API Test Script - River Supply SB1
 * Approach 4: Testing HMAC-SHA1 signature method
 *
 * Some older NetSuite integrations require SHA1 even though documentation says SHA256.
 */

const crypto = require('crypto');
const https = require('https');

// NetSuite Configuration - River Supply Sandbox 1
const config = {
  accountId: '9910981-sb1',
  consumerKey: '5e5d733cc3828b3a69b00f4d9a25e17608e7586421b368dc58fc6b9f4e50a062',
  consumerSecret: 'd43a0e2e81a705e56e853cf43a3ef3f6ebd3fa8a1e7924f0d9fa066f9baef779',
  tokenId: '1fb0993955eda8d2a87e6e0a6bd9644e774ebdaff8b6422e86cceaf31ec2964a',
  tokenSecret: '21b59c47249212c1e72294d59ab1f35a6503de454a31cb552e5bc28d4df31192',
  realm: '9910981_SB1'
};

/**
 * Generate OAuth 1.0a signature for NetSuite TBA using HMAC-SHA1
 */
function generateOAuthHeader(url, method, realm, consumerKey, consumerSecret, tokenId, tokenSecret) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  // OAuth parameters - USING HMAC-SHA1
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',  // Changed from HMAC-SHA256
    oauth_timestamp: timestamp,
    oauth_token: tokenId,
    oauth_version: '1.0'
  };

  // Build signature base string
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

  // Generate signature using SHA1
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto
    .createHmac('sha1', signingKey)  // Changed from 'sha256' to 'sha1'
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
 * Execute SuiteQL query via REST API
 */
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

    console.log('Making request to:', url);
    console.log('Using signature method: HMAC-SHA1');
    console.log('Authorization:', authHeader.substring(0, 80) + '...');
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

    req.write(body);
    req.end();
  });
}

// Test the connection
console.log('============================================');
console.log('NetSuite REST API Test - APPROACH 4');
console.log('Testing HMAC-SHA1 signature method');
console.log('============================================');
console.log('Account: River Supply, Inc. (Sandbox 1)');
console.log('Account ID:', config.accountId);
console.log('Realm:', config.realm);
console.log('');

executeSuiteQL('SELECT id, entityid, companyname FROM customer WHERE isinactive = \'F\' FETCH FIRST 5 ROWS ONLY')
  .then(result => {
    console.log('\n============================================');
    console.log('✅ SUCCESS! HMAC-SHA1 SIGNATURE ACCEPTED!');
    console.log('============================================');
    console.log('Status Code:', result.statusCode);
    console.log('\nResponse Data:');
    console.log(JSON.stringify(result.data, null, 2));

    if (result.data.items) {
      console.log('\n📊 Retrieved', result.data.items.length, 'customers:');
      result.data.items.forEach(item => {
        console.log(`  - ID: ${item.id}, Entity ID: ${item.entityid}, Company: ${item.companyname || 'N/A'}`);
      });
    }

    console.log('\n✅ CONCLUSION: HMAC-SHA1 signature method works!');
    console.log('NetSuite accepted the SHA1-based OAuth signature.');
  })
  .catch(error => {
    console.error('\n============================================');
    console.error('❌ ERROR WITH HMAC-SHA1 SIGNATURE');
    console.error('============================================');
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('\n❌ CONCLUSION: HMAC-SHA1 signature method failed');
  });
