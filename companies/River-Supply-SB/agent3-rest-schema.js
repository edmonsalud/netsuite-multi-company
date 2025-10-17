/**
 * Agent 3 Follow-up: Get Employee Record Schema
 * Testing: /services/rest/record/v1/metadata-catalog/employee with Accept: application/schema+json
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

function getSchema(recordType) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/metadata-catalog/${recordType}`;
    const method = 'GET';

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
      path: `/services/rest/record/v1/metadata-catalog/${recordType}`,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/schema+json'
      }
    };

    console.log('🚀 Making request to:', url);
    console.log('📋 Accept: application/schema+json');

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

    req.end();
  });
}

// Test: Retrieve employee schema
console.log('🧪 Agent 3 Follow-up: Getting Employee Schema');
console.log('📍 Account: River Supply, Inc. (Sandbox 1)');
console.log('🎯 Requesting schema+json format for detailed field information');
console.log('');

getSchema('employee')
  .then(result => {
    console.log('Status Code:', result.statusCode);
    console.log('');

    if (result.statusCode === 200) {
      console.log('✅ SUCCESS! Schema retrieved!');
      console.log('');

      // Save to file for easier analysis
      const fs = require('fs');
      fs.writeFileSync('employee-schema.json', JSON.stringify(result.data, null, 2));
      console.log('💾 Full schema saved to: employee-schema.json');
      console.log('');

      // Extract key information
      if (result.data.properties) {
        console.log('📝 Employee Record Properties:');
        const props = Object.keys(result.data.properties);
        console.log(`   Found ${props.length} properties`);
        console.log('');
        console.log('   Sample properties:');
        props.slice(0, 20).forEach(prop => {
          const propData = result.data.properties[prop];
          console.log(`   - ${prop}: ${propData.type || 'unknown'} ${propData.format ? `(${propData.format})` : ''}`);
        });

        if (props.length > 20) {
          console.log(`   ... and ${props.length - 20} more properties`);
        }
      } else {
        console.log('📋 Raw Schema:');
        console.log(JSON.stringify(result.data, null, 2).substring(0, 2000));
      }
    } else {
      console.log('Response:', JSON.stringify(result.data, null, 2));
    }
  })
  .catch(error => {
    console.error('❌ ERROR:', error.message);
  });
