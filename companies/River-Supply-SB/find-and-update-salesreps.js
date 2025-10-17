/**
 * Find and Update Sales Rep Employees
 * Find internal IDs and set issalesrep = true
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
  'Eric Pearle',
  'Garrett Dixon',
  'Greg Landers',
  'Jeff McKendree',
  'Kim Lyons',
  'Matt Macleod',
  'Mike McCarn',
  'Sandy Hopkins'
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
  const paramString = Object.keys(oauthParams).sort().map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`).join('&');
  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto.createHmac('sha256', signingKey).update(signatureBaseString).digest('base64');
  return `OAuth realm="${realm}", ` + Object.keys(oauthParams).map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`).join(', ') + `, oauth_signature="${encodeURIComponent(signature)}"`;
}

function executeSuiteQL(query) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`;
    const body = JSON.stringify({ q: query });
    const authHeader = generateOAuthHeader(url, 'POST', config.realm, config.consumerKey, config.consumerSecret, config.tokenId, config.tokenSecret);
    const options = {
      hostname: `${config.accountId}.suitetalk.api.netsuite.com`,
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

function updateEmployee(employeeId, updateData) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/employee/${employeeId}`;
    const body = JSON.stringify(updateData);
    const authHeader = generateOAuthHeader(url, 'PATCH', config.realm, config.consumerKey, config.consumerSecret, config.tokenId, config.tokenSecret);
    const options = {
      hostname: `${config.accountId}.suitetalk.api.netsuite.com`,
      path: `/services/rest/record/v1/employee/${employeeId}`,
      method: 'PATCH',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Prefer': 'transient' }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function findAndUpdateSalesReps() {
  console.log('🔍 Finding and updating sales rep employees');
  console.log('='.repeat(80));
  console.log('');

  const results = [];
  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  let alreadySetCount = 0;

  for (let i = 0; i < salesRepNames.length; i++) {
    const name = salesRepNames[i];
    const progress = `[${i + 1}/${salesRepNames.length}]`;

    console.log(`${progress} Searching for: ${name}`);

    try {
      // Try to find by first and last name
      const nameParts = name.split(' ');
      let query;

      if (nameParts.length === 2) {
        const firstName = nameParts[0].replace(/'/g, "''");
        const lastName = nameParts[1].replace(/'/g, "''");
        query = `SELECT id, entityid, firstname, lastname, issalesrep FROM employee WHERE UPPER(firstname) = UPPER('${firstName}') AND UPPER(lastname) = UPPER('${lastName}')`;
      } else {
        // Fallback - search by full name in either field
        const escapedName = name.replace(/'/g, "''");
        query = `SELECT id, entityid, firstname, lastname, issalesrep FROM employee WHERE UPPER(firstname || ' ' || lastname) LIKE UPPER('%${escapedName}%')`;
      }

      const searchResult = await executeSuiteQL(query);

      if (searchResult.statusCode === 200 && searchResult.data.items && searchResult.data.items.length > 0) {
        const employee = searchResult.data.items[0];
        const fullName = `${employee.firstname || ''} ${employee.lastname || ''}`.trim();

        console.log(`  ✓ Found: ${fullName}`);
        console.log(`    Internal ID: ${employee.id}`);
        console.log(`    Entity ID: ${employee.entityid}`);
        console.log(`    Current isSalesRep: ${employee.issalesrep === 'T' || employee.issalesrep === true ? 'true' : 'false'}`);

        results.push({
          name: fullName,
          id: employee.id,
          entityId: employee.entityid,
          currentIsSalesRep: employee.issalesrep
        });

        // Check if already set
        if (employee.issalesrep === 'T' || employee.issalesrep === true) {
          console.log('    → Already set to Sales Rep - skipping');
          alreadySetCount++;
        } else {
          console.log('    → Updating isSalesRep to true...');

          const updateResult = await updateEmployee(employee.id, {
            isSalesRep: true
          });

          if (updateResult.statusCode === 200 || updateResult.statusCode === 204) {
            console.log('    ✓ SUCCESS - isSalesRep set to true');
            successCount++;
          } else {
            console.log(`    ✗ Update failed (Status ${updateResult.statusCode})`);
            if (updateResult.data) {
              console.log('    Response:', JSON.stringify(updateResult.data, null, 2));
            }
            errorCount++;
          }
        }
      } else {
        console.log('  ✗ NOT FOUND in NetSuite');
        notFoundCount++;
      }

      console.log('');

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.log(`  ✗ ERROR: ${error.message}`);
      console.log('');
      errorCount++;
    }
  }

  console.log('='.repeat(80));
  console.log('\n📋 EMPLOYEE INTERNAL IDS:\n');

  results.forEach((emp, index) => {
    console.log(`${index + 1}. ${emp.name}`);
    console.log(`   Internal ID: ${emp.id}`);
    console.log(`   Entity ID: ${emp.entityId}`);
    console.log(`   isSalesRep: ${emp.currentIsSalesRep === 'T' || emp.currentIsSalesRep === true ? 'true' : 'false → true (updated)'}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('\n📊 SUMMARY:');
  console.log(`   Total employees: ${salesRepNames.length}`);
  console.log(`   ✓ Successfully updated: ${successCount}`);
  console.log(`   → Already set as sales rep: ${alreadySetCount}`);
  console.log(`   ✗ Not found: ${notFoundCount}`);
  console.log(`   ✗ Errors: ${errorCount}`);
  console.log('');
}

// Run the process
findAndUpdateSalesReps()
  .then(() => {
    console.log('✅ Process complete!');
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
  });
