/**
 * Test Approach 1: UPPERCASE Account ID in Signature URL
 *
 * This script tests OAuth 1.0a signature generation for NetSuite REST API
 * using UPPERCASE Account ID format (9910981_SB1) in signature base string
 * while using lowercase hostname (9910981-sb1) for actual HTTP request.
 */

const crypto = require('crypto');
const https = require('https');

// Configuration
const config = {
    accountId: '9910981_SB1',           // UPPERCASE with UNDERSCORE for signature
    hostname: '9910981-sb1.suitetalk.api.netsuite.com',  // lowercase with hyphen for HTTP
    realm: '9910981_SB1',               // UPPERCASE for realm
    consumerKey: 'bd6196d01ed2c54870c69e760025ec93bbc36a0dc610af928889b9c193b23cfd',
    consumerSecret: '478e6d485c65368fa4dd087d8ff61a422f9de1e5eb4cf56aed4884f40fc2bb88',
    tokenId: '4d1aa3b5e7bc4fca471a84ae87ee6ca4d897a8d983fa7d8872e9fb1e04d0ede5',
    tokenSecret: 'bd65c2f0fcd35aab4380aea9617ba71e6ae2bb9c16b802907338772f9709f7cf'
};

// Test endpoint
const endpoint = '/services/rest/record/v1/customer?limit=1';

/**
 * Generate OAuth 1.0a signature
 */
function generateOAuthSignature(method, url, oauthParams) {
    // Sort parameters
    const sortedParams = Object.keys(oauthParams)
        .sort()
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
        .join('&');

    // Create signature base string
    const signatureBaseString = [
        method.toUpperCase(),
        encodeURIComponent(url),
        encodeURIComponent(sortedParams)
    ].join('&');

    console.log('\n=== SIGNATURE GENERATION DEBUG ===');
    console.log('Method:', method.toUpperCase());
    console.log('URL for signature:', url);
    console.log('Sorted params:', sortedParams);
    console.log('Signature base string:', signatureBaseString);

    // Create signing key
    const signingKey = `${encodeURIComponent(config.consumerSecret)}&${encodeURIComponent(config.tokenSecret)}`;
    console.log('Signing key length:', signingKey.length);

    // Generate signature using HMAC-SHA256
    const signature = crypto
        .createHmac('sha256', signingKey)
        .update(signatureBaseString)
        .digest('base64');

    console.log('Generated signature:', signature);
    console.log('=================================\n');

    return signature;
}

/**
 * Generate OAuth Authorization header
 */
function generateAuthHeader(method, url) {
    // OAuth parameters
    const oauthParams = {
        oauth_consumer_key: config.consumerKey,
        oauth_token: config.tokenId,
        oauth_signature_method: 'HMAC-SHA256',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_version: '1.0'
    };

    // Generate signature
    const signature = generateOAuthSignature(method, url, oauthParams);

    // Add signature to params
    oauthParams.oauth_signature = signature;

    // Build Authorization header
    const authHeader = 'OAuth realm="' + config.realm + '",' +
        Object.keys(oauthParams)
            .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
            .join(',');

    return authHeader;
}

/**
 * Make REST API request
 */
function makeRequest() {
    console.log('=== TEST CONFIGURATION ===');
    console.log('Account ID (for signature):', config.accountId);
    console.log('Hostname (for HTTP):', config.hostname);
    console.log('Realm:', config.realm);
    console.log('Endpoint:', endpoint);
    console.log('==========================\n');

    // Build signature URL with UPPERCASE Account ID
    const signatureUrl = `https://${config.accountId.toUpperCase()}.suitetalk.api.netsuite.com${endpoint.split('?')[0]}`;
    console.log('Signature URL:', signatureUrl);

    // Generate Authorization header
    const authHeader = generateAuthHeader('GET', signatureUrl);

    console.log('\n=== AUTHORIZATION HEADER ===');
    console.log(authHeader);
    console.log('============================\n');

    // Make actual HTTP request to lowercase hostname
    const options = {
        hostname: config.hostname,
        path: endpoint,
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    console.log('=== HTTP REQUEST ===');
    console.log('Actual hostname:', options.hostname);
    console.log('Path:', options.path);
    console.log('====================\n');

    const req = https.request(options, (res) => {
        let data = '';

        console.log('=== RESPONSE ===');
        console.log('Status Code:', res.statusCode);
        console.log('Status Message:', res.statusMessage);
        console.log('\n=== RESPONSE HEADERS ===');
        Object.keys(res.headers).forEach(header => {
            console.log(`${header}:`, res.headers[header]);
        });
        console.log('========================\n');

        // Check for InvalidSignature in www-authenticate header
        const wwwAuth = res.headers['www-authenticate'];
        if (wwwAuth) {
            console.log('=== WWW-AUTHENTICATE HEADER ===');
            console.log(wwwAuth);
            if (wwwAuth.includes('InvalidSignature')) {
                console.log('\n❌ RESULT: InvalidSignature DETECTED');
            } else {
                console.log('\n✅ RESULT: No InvalidSignature detected');
            }
            console.log('================================\n');
        }

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('=== RESPONSE BODY ===');
            try {
                const jsonData = JSON.parse(data);
                console.log(JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log(data);
            }
            console.log('=====================\n');

            // Final summary
            console.log('=== TEST SUMMARY ===');
            console.log('Approach: UPPERCASE Account ID in signature URL');
            console.log('Account ID format:', config.accountId);
            console.log('Hostname format:', config.hostname);
            console.log('Status:', res.statusCode);
            if (wwwAuth && wwwAuth.includes('InvalidSignature')) {
                console.log('InvalidSignature: ❌ YES - Signature is INVALID');
            } else if (res.statusCode === 200) {
                console.log('InvalidSignature: ✅ NO - Authentication SUCCESSFUL');
            } else {
                console.log('InvalidSignature: ⚠️ UNKNOWN - Check response above');
            }
            console.log('====================\n');
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request Error:', error.message);
    });

    req.end();
}

// Run the test
console.log('\n========================================');
console.log('  NetSuite REST API OAuth Test');
console.log('  Approach 1: UPPERCASE Account ID');
console.log('========================================\n');

makeRequest();
