/**
 * Agent 6: Testing Alternative SuiteQL Table Names for Employee Data
 * River-Supply-SB NetSuite Account
 *
 * Testing these alternative table names:
 * 1. employeeroles
 * 2. employeestatus
 * 3. globalaccountmapping
 * 4. entityemployee
 * 5. role
 * 6. user
 * 7. contact
 * 8. partner
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

function executeSuiteQL(query) {
  return new Promise((resolve, reject) => {
    const url = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`;
    const method = 'POST';
    const body = JSON.stringify({ q: query });

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
      path: '/services/rest/query/v1/suiteql',
      method: method,
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

async function testTableName(tableName, description) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing: ${tableName} (${description})`);
  console.log('='.repeat(80));

  const query = `SELECT * FROM ${tableName} FETCH FIRST 5 ROWS ONLY`;
  console.log(`📝 Query: ${query}`);

  try {
    const result = await executeSuiteQL(query);

    if (result.statusCode === 200 && result.data.items) {
      console.log(`✅ SUCCESS! Table "${tableName}" is accessible`);
      console.log(`📊 Retrieved ${result.data.items.length} rows`);

      if (result.data.items.length > 0) {
        console.log(`\n📋 Columns available:`);
        const columns = Object.keys(result.data.items[0]);
        columns.forEach(col => console.log(`   - ${col}`));

        console.log(`\n📄 Sample data (first row):`);
        console.log(JSON.stringify(result.data.items[0], null, 2));
      }

      return { tableName, accessible: true, rowCount: result.data.items.length, columns: result.data.items.length > 0 ? Object.keys(result.data.items[0]) : [] };
    } else {
      console.log(`❌ FAILED: Status ${result.statusCode}`);
      console.log(`Error: ${JSON.stringify(result.data, null, 2)}`);
      return { tableName, accessible: false, error: result.data };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { tableName, accessible: false, error: error.message };
  }
}

// Main execution
async function runTests() {
  console.log('🚀 Agent 6: Testing Alternative SuiteQL Table Names');
  console.log('📍 Account: River Supply, Inc. (Sandbox 1)');
  console.log('🆔 Account ID:', config.accountId);
  console.log('🎯 Goal: Find employee data through alternative table names\n');

  const tablesToTest = [
    { name: 'employeeroles', description: 'Employee role assignments' },
    { name: 'employeestatus', description: 'Employee status information' },
    { name: 'globalaccountmapping', description: 'Global account mappings' },
    { name: 'entityemployee', description: 'Entity-employee relationships' },
    { name: 'role', description: 'System roles (may show users/employees)' },
    { name: 'user', description: 'User accounts' },
    { name: 'contact', description: 'Contacts (employees might be contacts)' },
    { name: 'partner', description: 'Partners (check if employees listed)' }
  ];

  const results = [];

  for (const table of tablesToTest) {
    const result = await testTableName(table.name, table.description);
    results.push(result);

    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary Report
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 FINAL SUMMARY REPORT');
  console.log('='.repeat(80));

  const accessibleTables = results.filter(r => r.accessible);
  const inaccessibleTables = results.filter(r => !r.accessible);

  console.log(`\n✅ ACCESSIBLE TABLES (${accessibleTables.length}):`);
  if (accessibleTables.length > 0) {
    accessibleTables.forEach(table => {
      console.log(`\n   📁 ${table.tableName}`);
      console.log(`      Rows retrieved: ${table.rowCount}`);
      if (table.columns && table.columns.length > 0) {
        console.log(`      Columns: ${table.columns.join(', ')}`);
      }
    });
  } else {
    console.log('   None found');
  }

  console.log(`\n❌ INACCESSIBLE TABLES (${inaccessibleTables.length}):`);
  if (inaccessibleTables.length > 0) {
    inaccessibleTables.forEach(table => {
      console.log(`   - ${table.tableName}`);
    });
  } else {
    console.log('   None');
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 Agent 6 Testing Complete');
  console.log('='.repeat(80));

  if (accessibleTables.length > 0) {
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Review accessible tables for employee-related data');
    console.log('   2. Query these tables with employee-specific filters');
    console.log('   3. Cross-reference data to find employee information');
  }
}

// Run all tests
runTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
