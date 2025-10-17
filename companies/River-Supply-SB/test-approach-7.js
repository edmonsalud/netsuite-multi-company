/**
 * NetSuite REST API OAuth Signature Test - Approach 7
 *
 * PURPOSE: Verify HTTP method case sensitivity in OAuth signature
 *
 * FOCUS:
 * - Signature base string: "GET&..." (UPPERCASE method)
 * - Actual HTTP request: "GET" (UPPERCASE method)
 * - Detailed logging of method case at each step
 *
 * Account: River Supply, Inc. (Sandbox 1)
 * Account ID: 9910981-sb1
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
  realm: '9910981-sb1'
};

/**
 * Generate OAuth 1.0a signature with detailed method case logging
 */
function generateOAuthHeader(url, method, realm, consumerKey, consumerSecret, tokenId, tokenSecret) {
  console.log('\n=== OAUTH SIGNATURE GENERATION ===');
  console.log('Input method parameter:', JSON.stringify(method));
  console.log('Input method type:', typeof method);
  console.log('Input method length:', method.length);

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

  // Build signature base string with UPPERCASE method
  const methodForSignature = method.toUpperCase();
  console.log('\nMethod transformation:');
  console.log('  Original method:', JSON.stringify(method));
  console.log('  After toUpperCase():', JSON.stringify(methodForSignature));
  console.log('  Method in signature:', JSON.stringify(methodForSignature));

  const paramString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  const signatureBaseString = `${methodForSignature}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

  console.log('\nSignature Base String Components:');
  console.log('  1. HTTP Method:', methodForSignature);
  console.log('  2. URL:', url);
  console.log('  3. Params:', paramString.substring(0, 100) + '...');
  console.log('\nComplete Signature Base String:');
  console.log(signatureBaseString.substring(0, 150) + '...');

  // Generate signature - NetSuite uses HMAC-SHA256
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  console.log('\nSignature Generation:');
  console.log('  Signing key length:', signingKey.length);
  console.log('  Generated signature:', signature.substring(0, 30) + '...');

  // Build OAuth header
  const authHeader = `OAuth realm="${realm}", ` +
    Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ') +
    `, oauth_signature="${encodeURIComponent(signature)}"`;

  console.log('\nOAuth Header:');
  console.log(authHeader.substring(0, 150) + '...');
  console.log('=== END OAUTH SIGNATURE GENERATION ===\n');

  return authHeader;
}

/**
 * Test NetSuite REST API with explicit method case handling
 */
function testNetSuiteAPI() {
  return new Promise((resolve, reject) => {
    const recordType = 'customer';
    const path = `/services/rest/record/v1/${recordType}`;
    const queryParams = 'limit=5';
    const fullPath = `${path}?${queryParams}`;

    // Build base URL for signature (WITHOUT query parameters)
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com${path}`;

    // CRITICAL: Method MUST be uppercase for both signature and request
    const method = 'GET';

    console.log('\n=== REQUEST CONFIGURATION ===');
    console.log('Record Type:', recordType);
    console.log('Base URL:', url);
    console.log('Full Path (with query):', fullPath);
    console.log('HTTP Method:', JSON.stringify(method));
    console.log('Method case:', method === method.toUpperCase() ? 'UPPERCASE' : 'lowercase/mixed');
    console.log('=== END REQUEST CONFIGURATION ===\n');

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
      path: fullPath,
      method: method,  // UPPERCASE: 'GET'
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Prefer': 'transient'
      }
    };

    console.log('\n=== HTTPS REQUEST OPTIONS ===');
    console.log('Hostname:', options.hostname);
    console.log('Path:', options.path);
    console.log('Method:', JSON.stringify(options.method));
    console.log('Method matches signature?', options.method === method);
    console.log('Headers:', JSON.stringify(options.headers, null, 2));
    console.log('=== END HTTPS REQUEST OPTIONS ===\n');

    console.log('🚀 Sending request to NetSuite...\n');

    const req = https.request(options, (res) => {
      let data = '';

      console.log('\n=== RESPONSE RECEIVED ===');
      console.log('Status Code:', res.statusCode);
      console.log('Status Message:', res.statusMessage);
      console.log('\nResponse Headers:');
      console.log(JSON.stringify(res.headers, null, 2));

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('\n=== RESPONSE BODY ===');
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          console.log('Raw response (not JSON):');
          console.log(data);
          resolve({ statusCode: res.statusCode, data: data });
        }
        console.log('=== END RESPONSE ===\n');
      });
    });

    req.on('error', (error) => {
      console.error('\n❌ REQUEST ERROR:', error.message);
      console.error(error);
      reject(error);
    });

    req.end();
  });
}

// Run the test
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  NetSuite OAuth Signature Test - Approach 7                   ║');
console.log('║  Focus: HTTP Method Case Sensitivity                          ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\nAccount: River Supply, Inc. (Sandbox 1)');
console.log('Account ID:', config.accountId);
console.log('Realm:', config.realm);
console.log('Test: Retrieve customers with UPPERCASE method verification\n');

testNetSuiteAPI()
  .then(result => {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  TEST RESULTS                                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('Status Code:', result.statusCode);

    if (result.statusCode === 200) {
      console.log('\n✅ SUCCESS! Authentication accepted by NetSuite');
      if (result.data.items) {
        console.log(`\n📊 Retrieved ${result.data.items.length} customer records:`);
        result.data.items.forEach((item, index) => {
          console.log(`  ${index + 1}. ID: ${item.id}, Name: ${item.companyName || item.entityId || 'N/A'}`);
        });
      }
      console.log('\n✅ CONCLUSION: HTTP method case handling is CORRECT');
      console.log('   - Signature uses: UPPERCASE method');
      console.log('   - Request uses: UPPERCASE method');
      console.log('   - Result: Successful authentication');
    } else if (result.statusCode === 401) {
      console.log('\n❌ AUTHENTICATION FAILED (401 Unauthorized)');
      console.log('\nPossible causes:');
      console.log('  1. OAuth signature mismatch');
      console.log('  2. Invalid credentials');
      console.log('  3. Timestamp skew');
      console.log('  4. Method case mismatch (if signature uses lowercase)');
      console.log('\n⚠️  Check signature generation logs above for method case');
    } else if (result.statusCode === 403) {
      console.log('\n⚠️  FORBIDDEN (403)');
      console.log('Authentication succeeded but insufficient permissions');
      console.log('Token role needs "Customer" record permissions');
    } else {
      console.log('\n⚠️  UNEXPECTED STATUS CODE:', result.statusCode);
    }
  })
  .catch(error => {
    console.error('\n╔════════════════════════════════════════════════════════════════╗');
    console.error('║  TEST FAILED WITH ERROR                                       ║');
    console.error('╚════════════════════════════════════════════════════════════════╝\n');
    console.error('Error:', error.message);
    console.error('\nFull error:');
    console.error(error);
  });
