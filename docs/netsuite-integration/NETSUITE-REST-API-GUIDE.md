# NetSuite REST API Integration Guide

> **Purpose**: Complete guide for integrating Claude Code with NetSuite via REST API
> **Last Updated**: 2025-10-16
> **Status**: Active - Keep Updated

## Table of Contents

- [Overview](#overview)
- [Authentication Setup](#authentication-setup)
- [SuiteQL vs Record API](#suiteql-vs-record-api)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

NetSuite provides two primary REST API endpoints:

1. **SuiteQL Endpoint** (`/services/rest/query/v1/suiteql`)
   - SQL-like queries
   - Best for searching and reading data
   - More permissive access

2. **Record API** (`/services/rest/record/v1/{recordType}`)
   - CRUD operations
   - Best for creating and updating records
   - Requires specific permissions per record type

---

## Authentication Setup

### Prerequisites

1. **Integration Record** (Setup → Integrations → Manage Integrations → New)
   - Name: "Claude Code REST API Access"
   - Token-Based Authentication: ✅ CHECKED
   - TBA: Authorization Flow: ☐ UNCHECKED
   - Save and note: Consumer Key + Consumer Secret

2. **Access Token** (Setup → Users/Roles → Access Tokens → New)
   - Application Name: Select your integration
   - User: Your NetSuite user
   - Role: Administrator or appropriate role
   - Save and note: Token ID + Token Secret

3. **Account ID** (Setup → Company → Company Information)
   - CRITICAL: Verify this BEFORE any auth setup
   - Use verification tool: `node verify-account-ids.js`
   - See: `ACCOUNT-IDS.md` registry

### OAuth 1.0a Signature Generation

```javascript
const crypto = require('crypto');

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

  // Sort and encode parameters
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  // Create signature base string
  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

  // Generate signature
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  // Build authorization header
  return `OAuth realm="${realm}", ` +
    Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ') +
    `, oauth_signature="${encodeURIComponent(signature)}"`;
}
```

### Account ID Format

**CRITICAL**: Different contexts require different formats

```javascript
// For URLs (lowercase with hyphen)
const accountId = '9910981-sb1';  // Sandbox
const accountId = '693183';        // Production

// For OAuth realm (uppercase with underscore for sandbox)
const realm = '9910981_SB1';  // Sandbox
const realm = '693183';        // Production

// URL examples
const url = `https://${accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`;
```

---

## SuiteQL vs Record API

### When to Use SuiteQL

✅ **USE SUITEQL FOR:**
- Searching records
- Querying data
- Complex filters
- Joining tables
- Counting records
- Accessing employee/user data (see Employee Access Patterns)

**Example:**
```javascript
const query = `
  SELECT id, companyname, email, salesrep
  FROM customer
  WHERE isinactive = 'F'
  ORDER BY companyname
  FETCH FIRST 100 ROWS ONLY
`;

const body = JSON.stringify({ q: query });
// POST to /services/rest/query/v1/suiteql
```

### When to Use Record API

✅ **USE RECORD API FOR:**
- Creating records
- Updating records (PATCH)
- Deleting records
- Getting single record by ID (GET)

**Example - Update Customer:**
```javascript
const customerId = '4038';
const updateData = {
  salesRep: { id: '16' },
  subsidiary: { id: '1' }
};

const body = JSON.stringify(updateData);
// PATCH to /services/rest/record/v1/customer/4038
```

### Permission Differences

| Operation | SuiteQL | Record API |
|-----------|---------|------------|
| Query employee table | ✅ Works | ❌ 403 Forbidden |
| Query customer table | ✅ Works | ✅ Works |
| Update customer | N/A | ✅ Works |
| Create customer | N/A | ✅ Works |
| Complex searches | ✅ Best | ⚠️ Limited |

**Key Learning**: SuiteQL has MORE permissive read access than Record API GET operations.

---

## Common Patterns

### Pattern 1: Find Record by Name

```javascript
async function findCustomerByName(companyName) {
  const query = `
    SELECT id, companyname, email
    FROM customer
    WHERE companyname = '${companyName.replace(/'/g, "''")}'
    FETCH FIRST 1 ROWS ONLY
  `;

  const result = await executeSuiteQL(query);
  return result.data.items[0];
}
```

**Note**: Always escape single quotes: `'` → `''`

### Pattern 2: Two-Step Update (Avoid Validation Errors)

```javascript
async function updateCustomerSalesRep(customerId, salesRepId) {
  // Step 1: Set subsidiary (required field)
  await updateCustomer(customerId, {
    subsidiary: { id: '1' }
  });

  // Wait between requests
  await new Promise(resolve => setTimeout(resolve, 300));

  // Step 2: Set sales rep
  await updateCustomer(customerId, {
    salesRep: { id: salesRepId }
  });
}
```

**Why?** NetSuite validates required fields. Setting subsidiary first prevents 400 errors.

### Pattern 3: Bulk Update with Progress Tracking

```javascript
async function bulkUpdateCustomers(records) {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < records.length; i++) {
    // Show progress every 10 records
    if ((i + 1) % 10 === 0) {
      process.stdout.write(
        `\r[${i + 1}/${records.length}] Success: ${successCount} | Errors: ${errorCount}`
      );
    }

    try {
      await updateRecord(records[i]);
      successCount++;
    } catch (error) {
      errorCount++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return { successCount, errorCount };
}
```

### Pattern 4: Employee ID Mapping

```javascript
async function buildEmployeeMap() {
  const query = `
    SELECT id, entityid, firstname, lastname
    FROM employee
    WHERE isinactive = 'F'
    ORDER BY lastname
  `;

  const result = await executeSuiteQL(query);
  const employeeMap = new Map();

  result.data.items.forEach(emp => {
    const fullName = `${emp.firstname || ''} ${emp.lastname || ''}`.trim();
    employeeMap.set(fullName, emp.id);
    employeeMap.set(emp.entityid, emp.id);
  });

  return employeeMap;
}
```

---

## Troubleshooting

### Error: "InvalidSignature"

**Possible Causes:**
1. ❌ Wrong Account ID format
2. ❌ Wrong realm format (uppercase vs lowercase)
3. ❌ OAuth signature not including query parameters
4. ❌ Expired or revoked tokens

**Solution:**
```bash
# Step 1: Verify Account ID
node verify-account-ids.js

# Step 2: Check NetSuite Login Audit Trail
# Setup → Users/Roles → User Management → View Login Audit Trail

# Step 3: Test with working script
node test-netsuite-suiteql-WORKING.js
```

### Error: 401 Unauthorized

**Check:**
- Token not expired/revoked
- Integration record still active
- User has appropriate role
- Account ID correct

### Error: 403 Forbidden (Record API)

**Likely Cause:** Insufficient permissions for that record type

**Solution:** Use SuiteQL instead for read operations:
```javascript
// ❌ This might fail with 403
GET /services/rest/record/v1/employee/123

// ✅ Use this instead
POST /services/rest/query/v1/suiteql
Body: { "q": "SELECT * FROM employee WHERE id = '123'" }
```

### Error: 400 Bad Request (Update)

**Common Causes:**
1. Missing required field (e.g., subsidiary)
2. Invalid field value
3. Validation rule violation

**Solution:** Use two-step update pattern (see Pattern 2)

---

## Best Practices

### 1. Rate Limiting

Always add delays between API calls:
```javascript
await new Promise(resolve => setTimeout(resolve, 200-300));
```

### 2. Error Handling

```javascript
try {
  const result = await apiCall();

  if (result.statusCode === 200) {
    // Success
  } else if (result.statusCode === 400) {
    // Validation error - log and continue
  } else if (result.statusCode === 404) {
    // Not found - skip
  } else {
    // Other error - log and investigate
  }
} catch (error) {
  // Network error
  console.error('API call failed:', error.message);
}
```

### 3. Bulk Operations

- Process in batches of 50-100
- Show progress indicators
- Log failures for review
- Use background processing for >200 records

### 4. Query Optimization

```javascript
// ✅ Good - Use FETCH FIRST to limit results
SELECT * FROM customer FETCH FIRST 100 ROWS ONLY

// ❌ Bad - Unlimited results
SELECT * FROM customer

// ✅ Good - Select only needed fields
SELECT id, companyname, email FROM customer

// ❌ Bad - Select all fields when not needed
SELECT * FROM customer
```

### 5. Account ID Verification

**ALWAYS verify Account ID before any authentication setup:**

```bash
# Run this FIRST
node verify-account-ids.js

# Then proceed with auth setup
```

See: `ACCOUNT-IDS.md` for verified IDs

---

## Related Documentation

- [Employee Access Patterns](./EMPLOYEE-ACCESS-PATTERNS.md) - How to access employee records
- [Bulk Update Patterns](./BULK-UPDATE-PATTERNS.md) - Best practices for bulk operations
- [Account ID Registry](../../ACCOUNT-IDS.md) - Verified account IDs

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-10-16 | Initial creation with all REST API learnings | Claude Code |

---

**Status**: Active - Update this document when new patterns or issues are discovered.
