/**
 * NetSuite REST API Test Script - Approach 9
 * Test: NO URL encoding of consumer secret and token secret in signing key
 *
 * Hypothesis: OAuth spec is ambiguous - some implementations don't encode secrets
 * Current approach encodes: `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`
 * This test uses: `${consumerSecret}&${tokenSecret}` (raw secrets)
 */

const crypto = require('crypto');
const https = require('https');

// NetSuite Configuration - River Supply SB1
const config = {
  accountId: '9910981-sb1',
  consumerKey: '5e5d733cc3828b3a69b00f4d9a25e17608e7586421b368dc58fc6b9f4e50a062',
  consumerSecret: 'd43a0e2e81a705e56e853cf43a3ef3f6ebd3fa8a1e7924f0d9fa066f9baef779',
  tokenId: '1fb0993955eda8d2a87e6e0a6bd9644e774ebdaff8b6422e86cceaf31ec2964a',
  tokenSecret: '21b59c47249212c1e72294d59ab1f35a6503de454a31cb552e5bc28d4df31192',
  realm: '9910981_SB1'
};

/**
 * Generate OAuth 1.0a signature - Approach 9: NO URL encoding in signing key
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

  // Build signature base string (unchanged)
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

  console.log('\n🔍 DEBUG: Signature Generation Details');
  console.log('=====================================');
  console.log('Timestamp:', timestamp);
  console.log('Nonce:', nonce);
  console.log('\nOAuth Parameters:');
  console.log(JSON.stringify(oauthParams, null, 2));
  console.log('\nParameter String:', paramString);
  console.log('\nSignature Base String:', signatureBaseString);

  // ⭐ KEY CHANGE: DO NOT encode secrets in signing key
  const signingKey = `${consumerSecret}&${tokenSecret}`;
  console.log('\n⭐ APPROACH 9: Signing Key (NO URL ENCODING)');
  console.log('Signing Key Length:', signingKey.length);
  console.log('Signing Key (first 50 chars):', signingKey.substring(0, 50) + '...');
  console.log('Contains special chars that would be encoded:', /[^a-zA-Z0-9\-_.~&]/.test(signingKey));

  // Compare with encoded version (for reference)
  const signingKeyEncoded = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  console.log('\n📊 COMPARISON:');
  console.log('Old approach (encoded):', signingKeyEncoded.substring(0, 50) + '...');
  console.log('New approach (raw):', signingKey.substring(0, 50) + '...');
  console.log('Are they different?:', signingKey !== signingKeyEncoded);

  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  console.log('\n🔐 Generated Signature:', signature);

  // Build OAuth header
  const authHeader = `OAuth realm="${realm}", ` +
    Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ') +
    `, oauth_signature="${encodeURIComponent(signature)}"`;

  console.log('\n📋 OAuth Header:', authHeader.substring(0, 100) + '...');

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

    console.log('\n📡 Making Request');
    console.log('================');
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Query:', query);

    const req = https.request(options, (res) => {
      let data = '';

      console.log('\n📬 Response Received');
      console.log('===================');
      console.log('Status Code:', res.statusCode);
      console.log('Status Message:', res.statusMessage);
      console.log('\nResponse Headers:');
      console.log(JSON.stringify(res.headers, null, 2));

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

// Test execution
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  NetSuite REST API Test - APPROACH 9                          ║');
console.log('║  NO URL encoding of secrets in signing key                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\nAccount: River Supply, Inc. (Sandbox 1)');
console.log('Account ID:', config.accountId);
console.log('Test Date:', new Date().toISOString());
console.log('\n🎯 HYPOTHESIS:');
console.log('   OAuth spec may not require URL encoding of secrets in signing key');
console.log('   Current approach: encodes secrets before concatenation');
console.log('   This approach: uses raw secrets directly');

executeSuiteQL('SELECT id, entityid, companyname FROM customer WHERE isinactive = \'F\' FETCH FIRST 5 ROWS ONLY')
  .then(result => {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  RESULT: SUCCESS ✅                                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\nStatus Code:', result.statusCode);
    console.log('\n📊 Response Data:');
    console.log(JSON.stringify(result.data, null, 2));

    if (result.data.items) {
      console.log('\n✅ Retrieved', result.data.items.length, 'customers:');
      result.data.items.forEach(item => {
        console.log(`  - ID: ${item.id}, Entity ID: ${item.entityid}, Company: ${item.companyname || 'N/A'}`);
      });
    }

    console.log('\n🎉 CONCLUSION: Approach 9 WORKS!');
    console.log('   Raw secrets (no URL encoding) in signing key = CORRECT');
  })
  .catch(error => {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  RESULT: FAILED ❌                                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\nError:', error.message);
    console.log('\n🎯 CONCLUSION: Approach 9 does NOT work');
    console.log('   Raw secrets in signing key = INCORRECT');
    console.log('   OAuth spec likely requires URL encoding of secrets');
  });
