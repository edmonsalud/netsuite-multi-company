/**
 * NetSuite REST API Test Script - Approach 6: DOUBLE URL Encoding
 *
 * Tests OAuth signature with DOUBLE URL encoding in signature base string.
 *
 * Theory: Some OAuth implementations require the URL to be encoded TWICE
 * in the signature base string:
 * - First encoding: space -> %20
 * - Second encoding: %20 -> %2520
 *
 * Account: River Supply SB1 (9910981-sb1)
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
 * Generate OAuth 1.0a signature with DOUBLE URL encoding
 */
function generateOAuthHeader(url, method, realm, consumerKey, consumerSecret, tokenId, tokenSecret) {
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

  // Build parameter string
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  // *** KEY CHANGE: DOUBLE URL ENCODING ***
  // Encode the URL TWICE in the signature base string
  const doubleEncodedUrl = encodeURIComponent(encodeURIComponent(url));

  const signatureBaseString = `${method.toUpperCase()}&${doubleEncodedUrl}&${encodeURIComponent(paramString)}`;

  console.log('\n=== APPROACH 6: DOUBLE URL ENCODING ===');
  console.log('Original URL:', url);
  console.log('Single encoded:', encodeURIComponent(url).substring(0, 80) + '...');
  console.log('DOUBLE encoded:', doubleEncodedUrl.substring(0, 80) + '...');
  console.log('\nSignature Base String (first 100 chars):');
  console.log(signatureBaseString.substring(0, 100) + '...');

  // Generate signature
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  console.log('\nGenerated signature:', signature);

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

    console.log('\nMaking request to:', url);
    console.log('Method:', method);
    console.log('Authorization header (first 80 chars):', authHeader.substring(0, 80) + '...');

    const req = https.request(options, (res) => {
      let data = '';

      console.log('\n=== RESPONSE ===');
      console.log('Status Code:', res.statusCode);
      console.log('Status Message:', res.statusMessage);
      console.log('\nResponse Headers:');
      console.log(JSON.stringify(res.headers, null, 2));

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('\nResponse Body:');
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          console.log(data);
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('\n❌ Request Error:', error.message);
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

// Execute test
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  NetSuite REST API Test - APPROACH 6: DOUBLE URL ENCODING     ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\nAccount: River Supply, Inc. (Sandbox 1)');
console.log('Account ID:', config.accountId);
console.log('Testing: DOUBLE URL encoding in signature base string');
console.log('Theory: URL gets encoded TWICE (e.g., space -> %20 -> %2520)');

executeSuiteQL('SELECT id, entityid, companyname FROM customer WHERE isinactive = \'F\' FETCH FIRST 5 ROWS ONLY')
  .then(result => {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    if (result.statusCode === 200) {
      console.log('║  ✅ SUCCESS! APPROACH 6 WORKED!                                ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
      console.log('\n🎉 DOUBLE URL encoding resolved the InvalidSignature error!');

      if (result.data.items) {
        console.log('\n📊 Retrieved', result.data.items.length, 'customers:');
        result.data.items.forEach(item => {
          console.log(`  - ID: ${item.id}, Entity ID: ${item.entityid}, Company: ${item.companyname || 'N/A'}`);
        });
      }
    } else {
      console.log('║  ❌ FAILED - Status Code:', result.statusCode.toString().padEnd(29), '║');
      console.log('╚════════════════════════════════════════════════════════════════╝');

      if (result.data.error) {
        console.log('\nError Details:');
        console.log('Code:', result.data.error.code);
        console.log('Message:', result.data.error.message);
      }
    }

    console.log('\n=== CONCLUSION ===');
    if (result.statusCode === 200) {
      console.log('✅ DOUBLE URL encoding is the correct approach for River Supply SB1');
      console.log('✅ This resolves the InvalidSignature error');
      console.log('✅ Update all production scripts to use double URL encoding');
    } else {
      console.log('❌ DOUBLE URL encoding did NOT resolve the issue');
      console.log('❌ Continue investigating other approaches');
    }
  })
  .catch(error => {
    console.log('║  ❌ REQUEST FAILED                                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  });
