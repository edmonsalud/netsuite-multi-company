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
  const paramString = Object.keys(oauthParams).sort().map(key => encodeURIComponent(key) + '=' + encodeURIComponent(oauthParams[key])).join('&');
  const signatureBaseString = method.toUpperCase() + '&' + encodeURIComponent(url) + '&' + encodeURIComponent(paramString);
  const signingKey = encodeURIComponent(consumerSecret) + '&' + encodeURIComponent(tokenSecret);
  const signature = crypto.createHmac('sha256', signingKey).update(signatureBaseString).digest('base64');
  return 'OAuth realm="' + realm + '", ' + Object.keys(oauthParams).map(key => key + '="' + encodeURIComponent(oauthParams[key]) + '"').join(', ') + ', oauth_signature="' + encodeURIComponent(signature) + '"';
}

function executeSuiteQL(query) {
  return new Promise((resolve, reject) => {
    const url = 'https://' + config.accountId + '.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql';
    const body = JSON.stringify({ q: query });
    const authHeader = generateOAuthHeader(url, 'POST', config.realm, config.consumerKey, config.consumerSecret, config.tokenId, config.tokenSecret);
    const options = {
      hostname: config.accountId + '.suitetalk.api.netsuite.com',
      path: '/services/rest/query/v1/suiteql',
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Prefer': 'transient' }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, data: JSON.parse(data) }); }
        catch (e) { resolve({ statusCode: res.statusCode, data: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const query = "SELECT c.id, c.entityid, c.companyname, c.salesrep, e.entityid as salesrep_entityid, e.firstname, e.lastname FROM customer c LEFT JOIN employee e ON c.salesrep = e.id WHERE c.id = 4038";
console.log('Verifying update for customer 4038...\n');
executeSuiteQL(query).then(result => {
  if (result.statusCode === 200 && result.data.items && result.data.items.length > 0) {
    const customer = result.data.items[0];
    console.log('Customer Details:');
    console.log('  Internal ID:', customer.id);
    console.log('  Entity ID:', customer.entityid);
    console.log('  Company:', customer.companyname);
    console.log('  Sales Rep ID:', customer.salesrep);
    console.log('  Sales Rep Name:', customer.firstname && customer.lastname ? customer.firstname + ' ' + customer.lastname : 'N/A');
    console.log('  Sales Rep Entity ID:', customer.salesrep_entityid || 'N/A');
    console.log('');
    if (customer.salesrep === 16) {
      console.log('✅ CONFIRMED: Sales Rep successfully updated to ID 16!');
    } else {
      console.log('⚠️  Sales Rep ID is:', customer.salesrep, '(expected 16)');
    }
  } else {
    console.log('Error:', JSON.stringify(result.data, null, 2));
  }
}).catch(err => console.error('Error:', err.message));
