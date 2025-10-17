/**
 * NetSuite REST API Test - Approach 5: Explicit Port :443 in Signature
 * Tests OAuth signature with explicit port :443 vs without port
 *
 * OAuth 1.0a spec says default ports (80, 443) should be omitted from signature base string.
 * However, this test explicitly includes :443 to see if NetSuite accepts it.
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
 * Generate OAuth 1.0a signature for NetSuite TBA
 * @param {string} signatureUrl - URL to use in signature base string (may include :443)
 * @param {string} method - HTTP method
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

  // Build signature base string
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(signatureUrl)}&${encodeURIComponent(paramString)}`;

  // Generate signature
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

  return {
    authHeader,
    signature,
    timestamp,
    nonce,
    signatureBaseString: signatureBaseString.substring(0, 200) + '...'
  };
}

/**
 * Test customer record access with specific signature URL
 */
function testCustomerAccess(signatureUrl, actualUrl, description) {
  return new Promise((resolve, reject) => {
    const method = 'GET';

    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${description}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Signature URL: ${signatureUrl}`);
    console.log(`Actual URL: ${actualUrl}`);

    const authData = generateOAuthHeader(
      signatureUrl,
      method,
      config.realm,
      config.consumerKey,
      config.consumerSecret,
      config.tokenId,
      config.tokenSecret
    );

    console.log(`\nOAuth Parameters:`);
    console.log(`  Timestamp: ${authData.timestamp}`);
    console.log(`  Nonce: ${authData.nonce}`);
    console.log(`  Signature Base String (truncated):`);
    console.log(`    ${authData.signatureBaseString}`);
    console.log(`  Signature: ${authData.signature}`);

    const urlObj = new URL(actualUrl);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Authorization': authData.authHeader,
        'Content-Type': 'application/json',
        'Prefer': 'transient'
      }
    };

    console.log(`\nMaking request...`);

    const req = https.request(options, (res) => {
      let data = '';

      console.log(`Response Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`Response Headers:`, JSON.stringify(res.headers, null, 2));

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsed,
            success: res.statusCode === 200,
            description
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            success: res.statusCode === 200,
            description
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Request Error:`, error.message);
      reject(error);
    });

    req.end();
  });
}

// Run tests
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║  NetSuite REST API OAuth Signature Test: Port :443 in Signature URL       ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝');
console.log('\nAccount: River Supply, Inc. (Sandbox 1)');
console.log('Account ID:', config.accountId);
console.log('Testing: Customer record access with OAuth 1.0a');
console.log('\nTesting OAuth 1.0a spec interpretation:');
console.log('- OAuth spec: Default ports (80, 443) should be OMITTED from signature');
console.log('- This test: Explicitly INCLUDING :443 to see if NetSuite accepts it');

const baseUrl = 'https://9910981-sb1.suitetalk.api.netsuite.com/services/rest/record/v1/customer';

// Test 1: WITH explicit :443 port in signature URL
const test1SignatureUrl = 'https://9910981-sb1.suitetalk.api.netsuite.com:443/services/rest/record/v1/customer';
const test1ActualUrl = 'https://9910981-sb1.suitetalk.api.netsuite.com/services/rest/record/v1/customer?limit=1';

// Test 2: WITHOUT explicit :443 port in signature URL (standard OAuth 1.0a)
const test2SignatureUrl = 'https://9910981-sb1.suitetalk.api.netsuite.com/services/rest/record/v1/customer';
const test2ActualUrl = 'https://9910981-sb1.suitetalk.api.netsuite.com/services/rest/record/v1/customer?limit=1';

const results = [];

// Run Test 1
testCustomerAccess(
  test1SignatureUrl,
  test1ActualUrl,
  'WITH explicit :443 port in signature URL'
)
  .then(result => {
    results.push(result);

    // Small delay before test 2
    return new Promise(resolve => setTimeout(resolve, 1000));
  })
  .then(() => {
    // Run Test 2
    return testCustomerAccess(
      test2SignatureUrl,
      test2ActualUrl,
      'WITHOUT explicit :443 port in signature URL (OAuth 1.0a standard)'
    );
  })
  .then(result => {
    results.push(result);

    // Display summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('SUMMARY OF RESULTS');
    console.log(`${'='.repeat(80)}`);

    results.forEach((result, index) => {
      const testNum = index + 1;
      const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
      console.log(`\nTest ${testNum}: ${result.description}`);
      console.log(`Status: ${status} (HTTP ${result.statusCode})`);

      if (result.success && result.data.items) {
        console.log(`Retrieved: ${result.data.items.length} customer(s)`);
        if (result.data.items.length > 0) {
          const customer = result.data.items[0];
          console.log(`First customer: ID=${customer.id}, Name=${customer.companyname || customer.entityid || 'N/A'}`);
        }
      } else if (!result.success) {
        console.log(`Error: ${JSON.stringify(result.data).substring(0, 200)}`);
      }
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log('CONCLUSION');
    console.log(`${'='.repeat(80)}`);

    const test1Success = results[0].success;
    const test2Success = results[1].success;

    if (test1Success && test2Success) {
      console.log('✅ BOTH approaches work!');
      console.log('   NetSuite accepts signatures with AND without explicit :443 port.');
    } else if (!test1Success && test2Success) {
      console.log('✅ OAuth 1.0a standard is correct!');
      console.log('   NetSuite REQUIRES omitting default port :443 from signature URL.');
      console.log('   This confirms OAuth 1.0a specification compliance.');
    } else if (test1Success && !test2Success) {
      console.log('⚠️  UNEXPECTED: NetSuite requires explicit :443 port!');
      console.log('   This contradicts OAuth 1.0a specification.');
    } else {
      console.log('❌ BOTH approaches failed!');
      console.log('   The issue may not be related to port in signature URL.');
      console.log('   Check: Account ID, credentials, permissions, or integration status.');
    }

    console.log(`\n${'='.repeat(80)}`);
  })
  .catch(error => {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  });
