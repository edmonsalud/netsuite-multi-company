/**
 * Test OAuth Signature Approach 2 for River-Supply-SB
 *
 * CRITICAL DIFFERENCE FROM APPROACH 1:
 * - Signature URL: https://9910981-sb1.suitetalk.api.netsuite.com/services/rest/record/v1/customer (NO query params)
 * - Query params (limit=1) ARE included in OAuth signature base string as separate parameters
 * - Actual request URL: https://9910981-sb1.suitetalk.api.netsuite.com/services/rest/record/v1/customer?limit=1
 *
 * Theory: OAuth 1.0a spec says query params should be in signature base string,
 * but NOT as part of the URL itself.
 */

const crypto = require('crypto');
const https = require('https');

const config = {
  consumerKey: 'bd6196d01ed2c54870c69e760025ec93bbc36a0dc610af928889b9c193b23cfd',
  consumerSecret: '478e6d485c65368fa4dd087d8ff61a422f9de1e5eb4cf56aed4884f40fc2bb88',
  tokenId: '4d1aa3b5e7bc4fca471a84ae87ee6ca4d897a8d983fa7d8872e9fb1e04d0ede5',
  tokenSecret: 'bd65c2f0fcd35aab4380aea9617ba71e6ae2bb9c16b802907338772f9709f7cf',
  accountId: '9910981-sb1',
  hostname: '9910981-sb1',
  realm: '9910981-sb1'
};

/**
 * Generate OAuth 1.0a header WITH query parameters in signature
 *
 * @param {string} url - Base URL WITHOUT query parameters
 * @param {Object} queryParams - Query parameters to include in signature
 * @param {string} method - HTTP method
 * @param {string} realm - OAuth realm
 */
function generateOAuthHeaderWithQueryParams(url, queryParams, method, realm, consumerKey, consumerSecret, tokenId, tokenSecret) {
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

  // CRITICAL: Combine OAuth params AND query params for signature
  const allParams = {
    ...oauthParams,
    ...queryParams
  };

  // Sort and encode ALL parameters (OAuth + query)
  const paramString = Object.keys(allParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
    .join('&');

  // Signature base string uses URL WITHOUT query params
  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

  console.log('\n📝 APPROACH 2 - Signature Calculation:');
  console.log('  Base URL (no query):', url);
  console.log('  Query params:', JSON.stringify(queryParams));
  console.log('  All params combined:', paramString);
  console.log('  Signature base string:', signatureBaseString);

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  console.log('  Generated signature:', signature);

  // Auth header only includes OAuth params (NOT query params)
  const authHeader = `OAuth realm="${realm}", ` +
    Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ') +
    `, oauth_signature="${encodeURIComponent(signature)}"`;

  return authHeader;
}

async function testApproach2() {
  console.log('='.repeat(80));
  console.log('APPROACH 2: Query Params in Signature, NOT in Signature URL');
  console.log('='.repeat(80));

  const basePath = '/services/rest/record/v1/customer';
  const queryParams = { limit: '1' };

  // Signature URL: NO query parameters
  const signatureUrl = `https://${config.accountId}.suitetalk.api.netsuite.com${basePath}`;

  // Actual request URL: WITH query parameters
  const requestPath = `${basePath}?limit=${queryParams.limit}`;

  console.log('\n🔑 Configuration:');
  console.log('  Account ID:', config.accountId);
  console.log('  Hostname:', config.hostname);
  console.log('  Realm:', config.realm);
  console.log('  Signature URL:', signatureUrl);
  console.log('  Request URL:', `https://${config.hostname}.suitetalk.api.netsuite.com${requestPath}`);

  const authHeader = generateOAuthHeaderWithQueryParams(
    signatureUrl,
    queryParams,
    'GET',
    config.realm,
    config.consumerKey,
    config.consumerSecret,
    config.tokenId,
    config.tokenSecret
  );

  return new Promise((resolve) => {
    const options = {
      hostname: `${config.hostname}.suitetalk.api.netsuite.com`,
      path: requestPath,  // Path WITH query params
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Prefer': 'transient'
      }
    };

    console.log('\n📤 Making request...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('\n📥 Response:');
        console.log('  Status Code:', res.statusCode);

        const authError = res.headers['www-authenticate'] || '';
        const hasInvalidSig = authError.includes('InvalidSignature') || authError.includes('invalid_signature');
        const hasTokenRejected = authError.includes('token_rejected');

        if (hasInvalidSig) {
          console.log('  ❌ InvalidSignature: YES');
          console.log('  Result: Signature validation FAILED');
        } else {
          console.log('  ✅ InvalidSignature: NO');
          console.log('  Result: Signature validation PASSED');
        }

        if (hasTokenRejected) {
          console.log('  ⚠️  TokenRejected: YES');
        }

        if (authError) {
          console.log('  Auth Error:', authError);
        }

        if (res.statusCode === 200) {
          console.log('\n🎉 SUCCESS! Status 200 - Full authentication success!');
          try {
            const parsed = JSON.parse(data);
            console.log('  Records returned:', parsed.items?.length || 0);
            if (parsed.items && parsed.items.length > 0) {
              console.log('  First customer:', JSON.stringify(parsed.items[0], null, 2));
            }
          } catch (e) {
            console.log('  Response data:', data.substring(0, 200));
          }
        } else if (res.statusCode === 401 && !hasInvalidSig) {
          console.log('\n✅ Signature validation passed!');
          console.log('   (401 is expected - token/permission issue, NOT signature)');
        } else if (res.statusCode === 401 && hasInvalidSig) {
          console.log('\n❌ Approach 2 FAILED - InvalidSignature error');
        }

        console.log('\n' + '='.repeat(80));
        resolve({
          statusCode: res.statusCode,
          invalidSignature: hasInvalidSig,
          tokenRejected: hasTokenRejected,
          authError
        });
      });
    });

    req.on('error', (error) => {
      console.error('\n❌ Request Error:', error.message);
      resolve({ error: error.message });
    });

    req.end();
  });
}

// Run the test
console.log('\n🧪 Testing OAuth Signature Approach 2 for River-Supply-SB\n');
testApproach2()
  .then(result => {
    console.log('\n📊 Final Result:');
    console.log(JSON.stringify(result, null, 2));

    if (result.statusCode === 200) {
      console.log('\n✅ APPROACH 2 WORKS! This is the correct OAuth signature method.');
    } else if (result.statusCode === 401 && !result.invalidSignature) {
      console.log('\n✅ APPROACH 2: Signature validation PASSED!');
      console.log('   Token/permission issue needs resolution, but signature method is correct.');
    } else if (result.invalidSignature) {
      console.log('\n❌ APPROACH 2 FAILED: InvalidSignature error persists.');
    }
  })
  .catch(console.error);
