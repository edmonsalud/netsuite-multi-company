/**
 * Find and Update Sales Rep Employees - WORKING VERSION
 * Uses SuiteQL (proven to work by Agent 5)
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

// Sales reps to find and update
const targetSalesReps = [
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
        try { resolve({ statusCode: res.statusCode, data: data ? JSON.parse(data) : {} }); }
        catch (e) { resolve({ statusCode: res.statusCode, data: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function findAndUpdateSalesReps() {
  console.log('🔍 Finding and Updating Sales Rep Employees');
  console.log('='.repeat(80));
  console.log('');

  // Step 1: Get ALL employees using SuiteQL
  console.log('Step 1: Querying all employees via SuiteQL...\n');

  const query = `SELECT id, entityid, firstname, lastname, email, issalesrep, isinactive FROM employee ORDER BY lastname`;

  try {
    const result = await executeSuiteQL(query);

    if (result.statusCode !== 200 || !result.data.items) {
      console.log('❌ Failed to query employees');
      console.log('Response:', JSON.stringify(result.data, null, 2));
      return;
    }

    const allEmployees = result.data.items;
    console.log(`✅ Retrieved ${allEmployees.length} employees\n`);

    // Step 2: Find matching employees
    console.log('Step 2: Finding target sales reps...\n');

    const foundEmployees = [];
    const notFoundNames = [];

    targetSalesReps.forEach(targetName => {
      const nameParts = targetName.split(' ');
      const firstName = nameParts[0].toLowerCase();
      const lastName = nameParts[nameParts.length - 1].toLowerCase();

      const match = allEmployees.find(emp => {
        const empFirst = (emp.firstname || '').toLowerCase();
        const empLast = (emp.lastname || '').toLowerCase();
        const empEntity = (emp.entityid || '').toLowerCase();

        return (empFirst === firstName && empLast === lastName) ||
               empEntity.includes(targetName.toLowerCase());
      });

      if (match) {
        foundEmployees.push({ name: targetName, ...match });
        console.log(`  ✅ FOUND: ${targetName} (ID: ${match.id}, Current isSalesRep: ${match.issalesrep})`);
      } else {
        notFoundNames.push(targetName);
        console.log(`  ❌ NOT FOUND: ${targetName}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\nFound: ${foundEmployees.length} / ${targetSalesReps.length} employees\n`);

    if (notFoundNames.length > 0) {
      console.log('⚠️  Not found in NetSuite:');
      notFoundNames.forEach(name => console.log(`  - ${name}`));
      console.log('');
    }

    // Step 3: Update employees
    if (foundEmployees.length > 0) {
      console.log('Step 3: Updating isSalesRep field to TRUE...\n');

      let successCount = 0;
      let alreadySet = 0;
      let errorCount = 0;

      for (let i = 0; i < foundEmployees.length; i++) {
        const emp = foundEmployees[i];
        const progress = `[${i + 1}/${foundEmployees.length}]`;

        if (emp.issalesrep === 'T') {
          console.log(`${progress} ${emp.name} (ID: ${emp.id}) - Already set to TRUE, skipping`);
          alreadySet++;
          continue;
        }

        console.log(`${progress} Updating: ${emp.name} (ID: ${emp.id})`);

        try {
          const updateData = { isSalesRep: true };
          const updateResult = await updateEmployee(emp.id, updateData);

          if (updateResult.statusCode === 200 || updateResult.statusCode === 204) {
            console.log(`  ✅ SUCCESS - isSalesRep set to TRUE`);
            successCount++;
          } else {
            console.log(`  ❌ Failed (Status ${updateResult.statusCode})`);
            if (updateResult.data) {
              console.log('  Response:', JSON.stringify(updateResult.data, null, 2));
            }
            errorCount++;
          }

          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          console.log(`  ❌ ERROR: ${error.message}`);
          errorCount++;
        }

        console.log('');
      }

      console.log('='.repeat(80));
      console.log('\n📊 FINAL SUMMARY:');
      console.log(`   Total target employees: ${targetSalesReps.length}`);
      console.log(`   ✅ Found in NetSuite: ${foundEmployees.length}`);
      console.log(`   ❌ Not found: ${notFoundNames.length}`);
      console.log(`   ✅ Successfully updated: ${successCount}`);
      console.log(`   ⏭️  Already set (skipped): ${alreadySet}`);
      console.log(`   ❌ Update errors: ${errorCount}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

// Run the process
findAndUpdateSalesReps()
  .then(() => {
    console.log('✅ Process complete!');
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
  });
