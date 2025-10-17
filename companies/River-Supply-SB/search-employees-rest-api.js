/**
 * Search for Employees using REST Record API
 * Attempts to use Record API endpoint since SuiteQL doesn't work for employees
 */

const crypto = require('crypto');
const https = require('https');

const config = {
  accountId: '9910981-sb1',
  consumerKey: 'bd6196d01ed2c54870c69e760025ec93bbc36a0dc610af928889b9c193b23cfd',
  consumerSecret: '478e6d485c65368fa4dd087d8ff61a422f9de1e5eb4cf56aed4884f40fc2bb88',
  tokenId: '4d1aa3b5e7bc4fca471a84ae87ee6ca4d897a8d983fa7d8872e9fb1e04d0ede5',
  tokenSecret: 'bd65c2f0fcd35aab4380aea9617ba71e6ae2bb9c16b802907338772f9709f7cf',
  realm: '9910981_SB1'
};

// Sales rep names to find
const salesRepNames = [
  { first: 'Eric', last: 'Pearle' },
  { first: 'Garrett', last: 'Dixon' },
  { first: 'Greg', last: 'Landers' },
  { first: 'Jeff', last: 'McKendree' },
  { first: 'Kim', last: 'Lyons' },
  { first: 'Matt', last: 'Macleod' },
  { first: 'Mike', last: 'McCarn' },
  { first: 'Sandy', last: 'Hopkins' }
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

  return `OAuth realm="${realm}", ` +
    Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ') +
    `, oauth_signature="${encodeURIComponent(signature)}"`;
}

function searchEmployees(query) {
  return new Promise((resolve, reject) => {
    // Try using the employee endpoint with query parameters
    const queryParams = `?q=${encodeURIComponent(query)}`;
    const basePath = '/services/rest/record/v1/employee';
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com${basePath}${queryParams}`;

    const authHeader = generateOAuthHeader(
      url,
      'GET',
      config.realm,
      config.consumerKey,
      config.consumerSecret,
      config.tokenId,
      config.tokenSecret
    );

    const options = {
      hostname: `${config.accountId}.suitetalk.api.netsuite.com`,
      path: `${basePath}${queryParams}`,
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Prefer': 'transient'
      }
    };

    console.log(`🔍 Searching for: ${query}`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
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

async function findEmployees() {
  console.log('🔍 Searching for employees using REST Record API');
  console.log('='.repeat(80));
  console.log('');

  for (const name of salesRepNames) {
    const fullName = `${name.first} ${name.last}`;
    console.log(`\nSearching for: ${fullName}`);

    try {
      // Try searching by last name
      const result = await searchEmployees(name.last);

      console.log(`  Status: ${result.statusCode}`);
      console.log(`  Response:`, JSON.stringify(result.data, null, 2));

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`  ✗ ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

// Run the search
findEmployees()
  .then(() => {
    console.log('\n✅ Search complete!');
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
  });
