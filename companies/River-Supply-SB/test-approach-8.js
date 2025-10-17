/**
 * NetSuite REST API Endpoint Variation Test - River Supply SB1
 * Tests different API endpoint URL formats to find which works for sandbox accounts
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
 * Generate OAuth 1.0a signature for NetSuite TBA
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

  // Build signature base string
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

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

  return authHeader;
}

/**
 * Test a specific API endpoint URL
 */
function testEndpoint(endpointUrl, endpointName) {
  return new Promise((resolve, reject) => {
    const method = 'GET';
    const url = `${endpointUrl}?limit=1`;

    const authHeader = generateOAuthHeader(
      url,
      method,
      config.realm,
      config.consumerKey,
      config.consumerSecret,
      config.tokenId,
      config.tokenSecret
    );

    // Parse URL to get hostname and path
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${endpointName}`);
    console.log(`${'='.repeat(80)}`);
    console.log('URL:', url);
    console.log('Hostname:', urlObj.hostname);
    console.log('Path:', urlObj.pathname + urlObj.search);
    console.log('Authorization:', authHeader.substring(0, 50) + '...');
    console.log('');

    const req = https.request(options, (res) => {
      let data = '';

      console.log('Response Status:', res.statusCode);
      console.log('Response Headers:', JSON.stringify(res.headers, null, 2));

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Response Body:', data.substring(0, 500));

        try {
          const parsed = JSON.parse(data);
          resolve({
            endpointName,
            url,
            statusCode: res.statusCode,
            success: res.statusCode === 200,
            data: parsed
          });
        } catch (e) {
          resolve({
            endpointName,
            url,
            statusCode: res.statusCode,
            success: false,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request Error:', error.message);
      resolve({
        endpointName,
        url,
        statusCode: 0,
        success: false,
        error: error.message
      });
    });

    req.end();
  });
}

// Test all endpoint variations
async function testAllEndpoints() {
  console.log('NetSuite REST API Endpoint Variation Test');
  console.log('Account: River Supply, Inc. (Sandbox 1)');
  console.log('Account ID:', config.accountId);
  console.log('');

  const endpoints = [
    {
      name: 'Approach 8A: Account-Specific Restlets Domain',
      url: `https://${config.accountId}.restlets.api.netsuite.com/services/rest/record/v1/customer`
    },
    {
      name: 'Approach 8B: Generic REST Domain',
      url: 'https://rest.netsuite.com/services/rest/record/v1/customer'
    },
    {
      name: 'Approach 8C: SuiteTalk Domain (Baseline)',
      url: `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/customer`
    }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.url, endpoint.name);
    results.push(result);

    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY OF RESULTS');
  console.log(`${'='.repeat(80)}\n`);

  results.forEach(result => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`${status} - ${result.endpointName}`);
    console.log(`  URL: ${result.url}`);
    console.log(`  Status Code: ${result.statusCode}`);

    if (result.success && result.data) {
      console.log(`  Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
    } else if (result.error) {
      console.log(`  Error: ${result.error}`);
    } else if (result.rawData) {
      console.log(`  Raw Response: ${result.rawData.substring(0, 100)}`);
    }
    console.log('');
  });

  // Determine which approach worked
  const successfulApproach = results.find(r => r.success);

  if (successfulApproach) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ WORKING ENDPOINT FOUND!');
    console.log(`${'='.repeat(80)}`);
    console.log(`\nEndpoint: ${successfulApproach.endpointName}`);
    console.log(`URL Pattern: ${successfulApproach.url}`);
    console.log('\nUse this endpoint format for River Supply SB1 REST API access.');
  } else {
    console.log(`\n${'='.repeat(80)}`);
    console.log('❌ NO WORKING ENDPOINT FOUND');
    console.log(`${'='.repeat(80)}`);
    console.log('\nNone of the tested endpoint variations worked.');
    console.log('This may indicate:');
    console.log('1. REST API access not enabled for this account');
    console.log('2. Token permissions insufficient');
    console.log('3. Sandbox account requires different authentication');
    console.log('4. Account ID format issue');
  }
}

// Run the test
testAllEndpoints().catch(error => {
  console.error('\n❌ TEST EXECUTION ERROR:', error);
});
