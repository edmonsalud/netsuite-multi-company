/**
 * NetSuite REST API Test - Approach 10
 * Testing: Lowercase protocol in signature base string + realm quoting variations
 *
 * Key Changes:
 * 1. Explicitly use lowercase 'https' in signature base string
 * 2. Test different realm value quoting approaches
 * 3. Verify protocol case sensitivity
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
 * Generate OAuth 1.0a signature with LOWERCASE protocol enforcement
 * @param {string} realmQuoting - 'quoted' or 'unquoted' or 'urlencoded'
 */
function generateOAuthHeader(url, method, realm, consumerKey, consumerSecret, tokenId, tokenSecret, realmQuoting = 'quoted') {
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

  // CRITICAL: Ensure URL uses lowercase 'https' for signature calculation
  const normalizedUrl = url.toLowerCase().replace('https://', 'https://');

  // Build signature base string with LOWERCASE protocol
  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(normalizedUrl)}&${encodeURIComponent(paramString)}`;

  console.log('\n🔍 Signature Base String Components:');
  console.log('  Method:', method.toUpperCase());
  console.log('  Normalized URL:', normalizedUrl);
  console.log('  URL Encoded:', encodeURIComponent(normalizedUrl));
  console.log('  Param String:', paramString.substring(0, 100) + '...');
  console.log('\n📝 Full Signature Base String:');
  console.log('  ', signatureBaseString.substring(0, 150) + '...');

  // Generate signature
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  console.log('\n🔑 Signature:', signature);

  // Build OAuth header with realm quoting variation
  let authHeader;
  switch (realmQuoting) {
    case 'unquoted':
      authHeader = `OAuth realm=${realm}, ` +
        Object.keys(oauthParams)
          .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
          .join(', ') +
        `, oauth_signature="${encodeURIComponent(signature)}"`;
      console.log('\n📋 Realm Format: UNQUOTED (realm=value)');
      break;

    case 'urlencoded':
      authHeader = `OAuth realm="${encodeURIComponent(realm)}", ` +
        Object.keys(oauthParams)
          .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
          .join(', ') +
        `, oauth_signature="${encodeURIComponent(signature)}"`;
      console.log('\n📋 Realm Format: URL-ENCODED (realm="encoded_value")');
      break;

    case 'quoted':
    default:
      authHeader = `OAuth realm="${realm}", ` +
        Object.keys(oauthParams)
          .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
          .join(', ') +
        `, oauth_signature="${encodeURIComponent(signature)}"`;
      console.log('\n📋 Realm Format: QUOTED (realm="value")');
      break;
  }

  return authHeader;
}

/**
 * Test REST API with different realm quoting approaches
 */
function testRESTAPI(realmQuoting) {
  return new Promise((resolve, reject) => {
    // Use lowercase 'https' in URL
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/customer`;
    const method = 'GET';

    console.log('\n' + '='.repeat(80));
    console.log(`🧪 TEST: Lowercase Protocol + Realm ${realmQuoting.toUpperCase()}`);
    console.log('='.repeat(80));
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Account:', config.accountId);
    console.log('Realm:', config.realm);

    const authHeader = generateOAuthHeader(
      url,
      method,
      config.realm,
      config.consumerKey,
      config.consumerSecret,
      config.tokenId,
      config.tokenSecret,
      realmQuoting
    );

    const options = {
      hostname: `${config.accountId}.suitetalk.api.netsuite.com`,
      path: '/services/rest/record/v1/customer?limit=5',
      method: method,
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Prefer': 'transient'
      }
    };

    console.log('\n📤 Request Headers:');
    console.log('  Authorization:', authHeader.substring(0, 100) + '...');
    console.log('  Accept:', options.headers.Accept);
    console.log('  Prefer:', options.headers.Prefer);

    const req = https.request(options, (res) => {
      let data = '';

      console.log('\n📥 Response Status:', res.statusCode, res.statusMessage);
      console.log('📥 Response Headers:', JSON.stringify(res.headers, null, 2));

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsed,
            realmQuoting: realmQuoting
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            realmQuoting: realmQuoting
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({ error: error, realmQuoting: realmQuoting });
    });

    req.end();
  });
}

// Main test execution
async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║            NetSuite REST API - Approach 10 Test Suite                        ║');
  console.log('║         Testing: Lowercase Protocol + Realm Quoting Variations               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n🏢 Account: River Supply, Inc. (Sandbox 1)');
  console.log('🆔 Account ID:', config.accountId);
  console.log('🔐 Realm:', config.realm);
  console.log('📅 Test Date:', new Date().toISOString());

  const results = [];

  // Test 1: Quoted realm (standard approach)
  console.log('\n\n🧪 Test 1/3: Quoted Realm (realm="value")');
  console.log('─'.repeat(80));
  try {
    const result1 = await testRESTAPI('quoted');
    results.push(result1);
    console.log('\n✅ Test 1 Complete - Status:', result1.statusCode);
  } catch (error) {
    results.push({ error: error, realmQuoting: 'quoted' });
    console.log('\n❌ Test 1 Failed:', error.error?.message || error.message);
  }

  // Wait 1 second between requests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Unquoted realm
  console.log('\n\n🧪 Test 2/3: Unquoted Realm (realm=value)');
  console.log('─'.repeat(80));
  try {
    const result2 = await testRESTAPI('unquoted');
    results.push(result2);
    console.log('\n✅ Test 2 Complete - Status:', result2.statusCode);
  } catch (error) {
    results.push({ error: error, realmQuoting: 'unquoted' });
    console.log('\n❌ Test 2 Failed:', error.error?.message || error.message);
  }

  // Wait 1 second between requests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: URL-encoded realm
  console.log('\n\n🧪 Test 3/3: URL-Encoded Realm (realm="encoded_value")');
  console.log('─'.repeat(80));
  try {
    const result3 = await testRESTAPI('urlencoded');
    results.push(result3);
    console.log('\n✅ Test 3 Complete - Status:', result3.statusCode);
  } catch (error) {
    results.push({ error: error, realmQuoting: 'urlencoded' });
    console.log('\n❌ Test 3 Failed:', error.error?.message || error.message);
  }

  // Summary
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                            TEST RESULTS SUMMARY                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.realmQuoting?.toUpperCase() || 'UNKNOWN'} Realm:`);
    if (result.error) {
      console.log('   ❌ FAILED:', result.error.error?.message || result.error.message);
    } else if (result.statusCode === 200) {
      console.log('   ✅ SUCCESS - Status 200');
      if (result.data.items) {
        console.log('   📊 Retrieved', result.data.items.length, 'customer records');
      }
    } else {
      console.log('   ⚠️  Status:', result.statusCode);
      if (typeof result.data === 'string') {
        console.log('   Response:', result.data.substring(0, 200));
      } else {
        console.log('   Response:', JSON.stringify(result.data, null, 2).substring(0, 300));
      }
    }
  });

  console.log('\n\n🎯 Key Findings:');
  console.log('─'.repeat(80));
  console.log('1. Protocol: Using lowercase "https" in signature base string');
  console.log('2. URL Normalization: Explicitly converting URL to lowercase');
  console.log('3. Tested 3 realm quoting approaches:');
  console.log('   - Quoted: realm="9910981_SB1"');
  console.log('   - Unquoted: realm=9910981_SB1');
  console.log('   - URL-encoded: realm="9910981%5FSB1"');

  const successCount = results.filter(r => r.statusCode === 200).length;
  console.log(`\n📈 Success Rate: ${successCount}/3 tests passed`);

  if (successCount > 0) {
    const successfulApproach = results.find(r => r.statusCode === 200);
    console.log(`\n🎉 WORKING APPROACH: ${successfulApproach.realmQuoting.toUpperCase()} realm format`);
  } else {
    console.log('\n⚠️  All approaches failed - may need to investigate other factors');
  }

  console.log('\n' + '═'.repeat(80));
}

// Execute tests
runTests().catch(error => {
  console.error('\n💥 Test execution failed:', error);
  process.exit(1);
});
