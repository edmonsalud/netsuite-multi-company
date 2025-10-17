#!/usr/bin/env node

/**
 * NetSuite Account ID Verification Tool
 *
 * Purpose: Verify Account IDs are correct across all company configurations
 * Run this before any major authentication setup to prevent wasted time
 */

const fs = require('fs');
const path = require('path');

// Master registry of verified Account IDs
const VERIFIED_ACCOUNT_IDS = {
  'GOBA-SPORTS-PROD': '693183',
  // Add more as they are verified:
  // 'HMP-Global': 'XXXXXX',
  // 'ABA-CON': 'XXXXXX',
  // 'HBNO': 'XXXXXX',
  // 'River-Supply-SB': 'XXXXXX',
};

// Known incorrect Account IDs to warn about
const KNOWN_INCORRECT_IDS = {
  '7759280': 'This is NOT GOBA Sports! Correct ID is 693183',
};

console.log('🔍 NetSuite Account ID Verification Tool\n');
console.log('=' .repeat(60));

// Check each company folder
const companiesDir = path.join(__dirname, 'companies');
const companies = fs.readdirSync(companiesDir).filter(f =>
  fs.statSync(path.join(companiesDir, f)).isDirectory()
);

let errors = 0;
let warnings = 0;

companies.forEach(company => {
  console.log(`\n📁 ${company}`);

  const verifiedId = VERIFIED_ACCOUNT_IDS[company];
  if (!verifiedId) {
    console.log('   ⚠️  WARNING: No verified Account ID in registry');
    console.log('   📝 Action: Log into NetSuite and verify Account ID');
    warnings++;
    return;
  }

  console.log(`   ✅ Verified Account ID: ${verifiedId}`);

  // Check config files
  const configFiles = [
    path.join(companiesDir, company, 'test-netsuite-api.js'),
    path.join(companiesDir, company, 'test-netsuite-records.js'),
    path.join(companiesDir, company, 'mcp-server', 'index.js'),
  ];

  configFiles.forEach(file => {
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);

    // Check if it contains the verified ID
    if (content.includes(verifiedId)) {
      console.log(`   ✅ ${fileName}: Correct (${verifiedId})`);
    } else {
      // Check if it contains any Account ID
      const accountIdMatch = content.match(/accountId:\s*['"]([\d]+)['"]/);
      if (accountIdMatch) {
        const foundId = accountIdMatch[1];
        console.log(`   ❌ ${fileName}: WRONG! Found ${foundId}, should be ${verifiedId}`);

        if (KNOWN_INCORRECT_IDS[foundId]) {
          console.log(`      💡 ${KNOWN_INCORRECT_IDS[foundId]}`);
        }

        errors++;
      }
    }
  });

  // Check MCP config
  const mcpConfig = path.join(__dirname, '.mcp.json');
  if (fs.existsSync(mcpConfig)) {
    const content = fs.readFileSync(mcpConfig, 'utf8');
    if (content.includes(company.toLowerCase()) || content.includes(company)) {
      if (content.includes(verifiedId)) {
        console.log(`   ✅ .mcp.json: Correct (${verifiedId})`);
      } else {
        const accountIdMatch = content.match(/NETSUITE_ACCOUNT_ID["']:\s*["']([\d]+)["']/);
        if (accountIdMatch) {
          const foundId = accountIdMatch[1];
          console.log(`   ❌ .mcp.json: WRONG! Found ${foundId}, should be ${verifiedId}`);
          errors++;
        }
      }
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:');
console.log(`   ✅ Verified companies: ${Object.keys(VERIFIED_ACCOUNT_IDS).length}`);
console.log(`   ❌ Errors found: ${errors}`);
console.log(`   ⚠️  Warnings: ${warnings}`);

if (errors > 0) {
  console.log('\n❌ CRITICAL: Wrong Account IDs detected!');
  console.log('   Fix these before attempting authentication.');
  process.exit(1);
}

if (warnings > 0) {
  console.log('\n⚠️  Some companies need Account ID verification.');
  console.log('   Update ACCOUNT-IDS.md after verifying each account.');
}

if (errors === 0 && warnings === 0) {
  console.log('\n✅ All Account IDs verified and correct!');
}

console.log('\n📖 See ACCOUNT-IDS.md for verification procedures.\n');
