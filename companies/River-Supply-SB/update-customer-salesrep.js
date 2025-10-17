/**
 * Update Customer Sales Rep - River Supply SB1
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

function updateCustomer(customerId, updateData) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/customer/${customerId}`;
    const method = 'PATCH';
    const body = JSON.stringify(updateData);

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
      path: `/services/rest/record/v1/customer/${customerId}`,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'transient'
      }
    };

    console.log('🔄 Updating customer', customerId);
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Body:', body);
    console.log('');

    const req = https.request(options, (res) => {
      let data = '';

      console.log('📊 Response status:', res.statusCode);

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

// Update customer 4038 with salesrep 16
console.log('🎯 Updating Customer: GOODBYE STRANGER COLLAR FREE PRODUCTIONS');
console.log('   Internal ID: 4038');
console.log('   Setting Sales Rep to Internal ID: 16\n');

const updateData = {
  salesRep: {
    id: "16"
  }
};

updateCustomer('4038', updateData)
  .then(result => {
    console.log('');
    if (result.statusCode === 200 || result.statusCode === 204) {
      console.log('✅ SUCCESS! Customer updated successfully!');
      console.log('');
      console.log('Updated fields:');
      console.log('  Sales Rep: Internal ID 16');
      console.log('');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else if (result.statusCode === 401) {
      console.log('❌ Authentication error (401)');
      console.log('This means the role lacks permission to edit customer records.');
      console.log('');
      console.log('To fix: Add "Customer" Edit permission to the MCP Integration role');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ Update failed');
      console.log('Status:', result.statusCode);
      console.log('Response:', JSON.stringify(result.data, null, 2));
    }
  })
  .catch(error => {
    console.error('❌ ERROR:', error.message);
  });
