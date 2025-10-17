/**
 * Test multiple account ID format combinations to find the correct one
 */

const crypto = require('crypto');
const https = require('https');

const config = {
  consumerKey: 'bd6196d01ed2c54870c69e760025ec93bbc36a0dc610af928889b9c193b23cfd',
  consumerSecret: '478e6d485c65368fa4dd087d8ff61a422f9de1e5eb4cf56aed4884f40fc2bb88',
  tokenId: '4d1aa3b5e7bc4fca471a84ae87ee6ca4d897a8d983fa7d8872e9fb1e04d0ede5',
  tokenSecret: 'bd65c2f0fcd35aab4380aea9617ba71e6ae2bb9c16b802907338772f9709f7cf',
  hostname: '9910981-sb1'  // DNS hostname (always lowercase with hyphen)
};

// Test combinations
const testCases = [
  { name: 'lowercase hyphen', accountId: '9910981-sb1', realm: '9910981-sb1' },
  { name: 'UPPERCASE UNDERSCORE', accountId: '9910981_SB1', realm: '9910981_SB1' },
  { name: 'UPPERCASE hyphen', accountId: '9910981-SB1', realm: '9910981-SB1' },
  { name: 'lowercase underscore', accountId: '9910981_sb1', realm: '9910981_sb1' },
  { name: 'Mixed: uppercase for signature, realm', accountId: '9910981_SB1', realm: '9910981_SB1' },
];

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

function testFormat(testCase) {
  return new Promise((resolve) => {
    const path = `/services/rest/record/v1/customer`;
    const signatureUrl = `https://${testCase.accountId}.suitetalk.api.netsuite.com${path}`;
    const method = 'GET';

    const authHeader = generateOAuthHeader(
      signatureUrl,
      method,
      testCase.realm,
      config.consumerKey,
      config.consumerSecret,
      config.tokenId,
      config.tokenSecret
    );

    const options = {
      hostname: `${config.hostname}.suitetalk.api.netsuite.com`,
      path: path + '?limit=1',
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Prefer': 'transient'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const authError = res.headers['www-authenticate'] || '';
        const hasInvalidSig = authError.includes('InvalidSignature') || authError.includes('invalid_signature');
        const hasTokenRejected = authError.includes('token_rejected');

        resolve({
          name: testCase.name,
          accountId: testCase.accountId,
          realm: testCase.realm,
          statusCode: res.statusCode,
          invalidSignature: hasInvalidSig,
          tokenRejected: hasTokenRejected,
          authHeader: authError
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name: testCase.name,
        error: error.message
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing multiple account ID format combinations...\n');
  console.log('Looking for the format that does NOT show "InvalidSignature"\n');
  console.log('='.repeat(80));

  for (const testCase of testCases) {
    const result = await testFormat(testCase);

    console.log(`\nTest: ${result.name}`);
    console.log(`  Account ID: ${result.accountId}`);
    console.log(`  Realm: ${result.realm}`);
    console.log(`  Status: ${result.statusCode}`);
    console.log(`  InvalidSignature: ${result.invalidSignature ? '❌ YES' : '✅ NO'}`);
    console.log(`  TokenRejected: ${result.tokenRejected ? '⚠️  YES' : '  NO'}`);
    if (result.authHeader) {
      console.log(`  Auth Error: ${result.authHeader.substring(0, 100)}...`);
    }

    if (!result.invalidSignature && result.statusCode === 401) {
      console.log(`\n  🎉 POTENTIAL MATCH! This format passed signature validation!`);
    }

    console.log('-'.repeat(80));

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ Test complete! Check above for formats without "InvalidSignature"');
}

runTests().catch(console.error);
