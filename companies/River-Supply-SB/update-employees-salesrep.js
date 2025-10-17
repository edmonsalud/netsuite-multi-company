/**
 * Update Employee isSalesRep Field
 *
 * This script updates the issalesrep field to true for specified employees.
 *
 * TO USE THIS SCRIPT:
 * 1. Look up employee internal IDs in NetSuite UI (Lists → Employees → Employees)
 * 2. Add the IDs and names to the employeeList array below
 * 3. Run: node update-employees-salesrep.js
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

// ADD EMPLOYEE INTERNAL IDS HERE
// To find IDs: NetSuite UI → Lists → Employees → Employees → Search for name → Note ID from URL
const employeeList = [
  { name: 'Eric Pearle', id: null },      // TODO: Add internal ID
  { name: 'Garrett Dixon', id: null },    // TODO: Add internal ID
  { name: 'Greg Landers', id: null },     // TODO: Add internal ID
  { name: 'Jeff McKendree', id: null },   // TODO: Add internal ID
  { name: 'Kim Lyons', id: null },        // TODO: Add internal ID
  { name: 'Matt Macleod', id: null },     // TODO: Add internal ID
  { name: 'Mike McCarn', id: null },      // TODO: Add internal ID
  { name: 'Sandy Hopkins', id: null }     // TODO: Add internal ID
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

function updateEmployee(employeeId, updateData) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/employee/${employeeId}`;
    const body = JSON.stringify(updateData);

    const authHeader = generateOAuthHeader(
      url,
      'PATCH',
      config.realm,
      config.consumerKey,
      config.consumerSecret,
      config.tokenId,
      config.tokenSecret
    );

    const options = {
      hostname: `${config.accountId}.suitetalk.api.netsuite.com`,
      path: `/services/rest/record/v1/employee/${employeeId}`,
      method: 'PATCH',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'transient'
      }
    };

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

    req.write(body);
    req.end();
  });
}

async function updateEmployees() {
  console.log('🔄 Updating Employee Sales Rep Status');
  console.log('='.repeat(80));
  console.log('');

  // Check if any IDs are missing
  const missingIds = employeeList.filter(emp => !emp.id);

  if (missingIds.length > 0) {
    console.log('⚠️  WARNING: Employee internal IDs are missing!');
    console.log('');
    console.log('Please add internal IDs for the following employees:');
    missingIds.forEach(emp => {
      console.log(`  ❌ ${emp.name} - ID not set`);
    });
    console.log('');
    console.log('To find internal IDs:');
    console.log('  1. Log into NetSuite');
    console.log('  2. Go to Lists → Employees → Employees');
    console.log('  3. Search for employee name');
    console.log('  4. Open the employee record');
    console.log('  5. Note the ID from the URL (e.g., /app/common/entity/employee.nl?id=123)');
    console.log('');
    console.log('Then update the employeeList array in this script with the IDs.');
    console.log('');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < employeeList.length; i++) {
    const employee = employeeList[i];
    const progress = `[${i + 1}/${employeeList.length}]`;

    console.log(`${progress} Updating: ${employee.name} (ID: ${employee.id})`);

    try {
      const updateData = {
        isSalesRep: true
      };

      const result = await updateEmployee(employee.id, updateData);

      if (result.statusCode === 200 || result.statusCode === 204) {
        console.log(`  ✅ SUCCESS - isSalesRep set to true`);
        successCount++;
      } else {
        console.log(`  ❌ Failed (Status ${result.statusCode})`);
        if (result.data) {
          console.log('  Response:', JSON.stringify(result.data, null, 2));
        }
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      errorCount++;
    }

    console.log('');
  }

  console.log('='.repeat(80));
  console.log('\n📊 SUMMARY:');
  console.log(`   Total employees: ${employeeList.length}`);
  console.log(`   ✅ Successfully updated: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('');
}

// Run the update
updateEmployees()
  .then(() => {
    console.log('✅ Process complete!');
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
  });
