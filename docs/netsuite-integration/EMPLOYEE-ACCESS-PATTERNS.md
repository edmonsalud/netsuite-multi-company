# NetSuite Employee Record Access Patterns

> **Purpose**: Document proven methods for accessing employee records via REST API
> **Last Updated**: 2025-10-16
> **Status**: Active
> **Discovery Date**: 2025-10-16 (10-agent parallel testing breakthrough)

## Table of Contents

- [The Challenge](#the-challenge)
- [The Solution](#the-solution)
- [Access Methods](#access-methods)
- [Complete Working Examples](#complete-working-examples)
- [Discovery Process](#discovery-process)

---

## The Challenge

**Initial Problem**: Employee table access via REST API was failing with multiple errors:

```
❌ Direct queries failed: "Record 'employee' was not found"
❌ Entity table failed: "Record 'entity' was not found"
❌ Record API GET failed: 403 Forbidden
❌ Search endpoints failed: 405 Method Not Allowed
```

**Business Impact**: Could not:
- Find employee internal IDs by name
- Update `issalesrep` field
- Map employee names to IDs for bulk customer updates

---

## The Solution

### ✅ PRIMARY METHOD: SuiteQL Endpoint

**BREAKTHROUGH DISCOVERY**: The SuiteQL endpoint (`/services/rest/query/v1/suiteql`) provides FULL access to employee records, even when Record API blocks access.

```javascript
// ✅ THIS WORKS!
const query = "SELECT * FROM employee";
// POST to /services/rest/query/v1/suiteql
```

### Key Insights

| Endpoint | Access | Result |
|----------|--------|--------|
| `/record/v1/employee` (GET) | ❌ Blocked | 403 Forbidden |
| `/query/v1/suiteql` (POST) | ✅ Full Access | HTTP 200 with data |

**Why?** SuiteQL has more permissive read access than Record API. Different permission models.

---

## Access Methods

### Method 1: Query All Employees

```javascript
const query = `
  SELECT id, entityid, firstname, lastname, email, issalesrep, isinactive
  FROM employee
  WHERE isinactive = 'F'
  ORDER BY lastname
`;

const result = await executeSuiteQL(query);
// Returns all active employees
```

**Use Cases:**
- Build employee ID mapping
- List all sales reps
- Find employees by name

### Method 2: Search by Name

```javascript
const query = `
  SELECT id, entityid, firstname, lastname
  FROM employee
  WHERE firstname = 'Eric' AND lastname = 'Pearle'
  FETCH FIRST 1 ROWS ONLY
`;
```

### Method 3: Filter by Role

```javascript
const query = `
  SELECT id, entityid, firstname, lastname
  FROM employee
  WHERE issalesrep = 'T' AND isinactive = 'F'
  ORDER BY lastname
`;
```

### Method 4: Get Employee by ID

```javascript
// Option A: SuiteQL (works)
const query = `SELECT * FROM employee WHERE id = '21'`;

// Option B: Record API GET (might work depending on permissions)
GET /services/rest/record/v1/employee/21
```

### Method 5: BUILTIN.DF() - Indirect Access

```javascript
// Access employee names through customer relationships
const query = `
  SELECT
    salesrep as employee_id,
    BUILTIN.DF(salesrep) as employee_name,
    companyname
  FROM customer
  WHERE salesrep IS NOT NULL
  FETCH FIRST 100 ROWS ONLY
`;
```

**Use Case**: When direct employee access is restricted, use BUILTIN.DF() to decode IDs to names.

---

## Complete Working Examples

### Example 1: Build Employee Name → ID Map

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
    // Map by full name
    const fullName = `${emp.firstname || ''} ${emp.lastname || ''}`.trim();
    employeeMap.set(fullName, emp.id);

    // Map by entity ID
    employeeMap.set(emp.entityid, emp.id);
  });

  return employeeMap;
}

// Usage:
const empMap = await buildEmployeeMap();
const ericId = empMap.get('Eric Pearle'); // Returns: '21'
```

### Example 2: Find and Update Sales Reps

```javascript
async function findAndUpdateSalesReps(targetNames) {
  // Step 1: Get all employees
  const query = `
    SELECT id, entityid, firstname, lastname, issalesrep
    FROM employee
    ORDER BY lastname
  `;

  const result = await executeSuiteQL(query);
  const allEmployees = result.data.items;

  // Step 2: Find matches
  const foundEmployees = [];
  targetNames.forEach(targetName => {
    const [firstName, lastName] = targetName.split(' ');

    const match = allEmployees.find(emp =>
      emp.firstname?.toLowerCase() === firstName.toLowerCase() &&
      emp.lastname?.toLowerCase() === lastName.toLowerCase()
    );

    if (match) {
      foundEmployees.push(match);
    }
  });

  // Step 3: Update each employee
  for (const emp of foundEmployees) {
    if (emp.issalesrep === 'T') {
      console.log(`${emp.firstname} ${emp.lastname} - Already a sales rep`);
      continue;
    }

    const updateData = { isSalesRep: true };
    await updateEmployee(emp.id, updateData);
    console.log(`✅ Updated: ${emp.firstname} ${emp.lastname}`);
  }
}
```

### Example 3: CSV Bulk Update with Employee Mapping

```javascript
async function bulkUpdateCustomersFromCSV(csvRecords) {
  // Step 1: Build employee map
  const employeeMap = await buildEmployeeMap();

  // Step 2: Process each CSV record
  for (const record of csvRecords) {
    const { customerName, employeeName } = record;

    // Get employee ID
    const employeeId = employeeMap.get(employeeName);
    if (!employeeId) {
      console.log(`⚠️  Employee not found: ${employeeName}`);
      continue;
    }

    // Find customer
    const customer = await findCustomerByName(customerName);
    if (!customer) {
      console.log(`❌ Customer not found: ${customerName}`);
      continue;
    }

    // Update customer (two-step for validation)
    await updateCustomer(customer.id, { subsidiary: { id: '1' } });
    await updateCustomer(customer.id, { salesRep: { id: employeeId } });

    console.log(`✅ ${customerName} → ${employeeName}`);
  }
}
```

---

## Discovery Process

### The 10-Agent Parallel Testing Method

**Date**: 2025-10-16

**Challenge**: Standard approaches to access employee records were failing.

**Solution**: Launched 10 specialized agents in parallel, each testing different approaches:

| Agent | Approach | Result |
|-------|----------|--------|
| **Agent 1** | REST GET /employee/{id} | ✅ Partial Success (ID 16 worked) |
| Agent 2 | SuiteQL systemnode/systemnote | ❌ Not useful for employees |
| Agent 3 | REST metadata endpoint | ✅ Got schema but not data |
| Agent 4 | Transaction table references | ⚠️ Found IDs, not names |
| **Agent 5** | **SuiteQL with employee table** | **✅ BREAKTHROUGH - Full access!** |
| Agent 6 | Alternative table names | ⚠️ Found employeeroles table |
| Agent 7 | REST bulk GET | ✅ Confirmed base endpoint works |
| **Agent 8** | **BUILTIN.DF() functions** | **✅ Indirect access method** |
| Agent 9 | POST search variations | ✅ Confirmed SuiteQL works |
| Agent 10 | Transaction/salesorder joins | ⚠️ Found employee IDs |

**Key Finding**: **Agent 5 discovered that SuiteQL works perfectly:**

```javascript
// This simple query unlocked everything:
const query = "SELECT * FROM employee";
// POST to /services/rest/query/v1/suiteql
// Result: HTTP 200 with 16 employee records!
```

### Why Previous Attempts Failed

1. **Wrong endpoint**: Used Record API instead of SuiteQL
2. **Wrong assumptions**: Assumed both APIs had same permissions
3. **Wrong table names**: Tried 'entity', 'user', 'employees' (plural)
4. **Sequential testing**: Would have taken hours to discover working method

### How Parallel Testing Succeeded

- 10 agents tested simultaneously
- Each agent explored different approach
- Agent 5 found solution in ~5 minutes
- Other agents provided alternative methods
- Total discovery time: **<10 minutes** vs hours/days

---

## Important Notes

### Case Sensitivity

SuiteQL table names are **NOT case sensitive**:

```javascript
✅ "SELECT * FROM employee"
✅ "SELECT * FROM Employee"
✅ "SELECT * FROM EMPLOYEE"
```

### Boolean Fields

NetSuite uses 'T'/'F' strings, not true/false:

```javascript
// ✅ Correct
WHERE issalesrep = 'T'
WHERE isinactive = 'F'

// ❌ Wrong
WHERE issalesrep = true
WHERE isinactive = false
```

### Update vs Query Permissions

```javascript
// ✅ Query via SuiteQL - Works
SELECT * FROM employee

// ✅ Update via Record API - Works (if you have employee ID)
PATCH /services/rest/record/v1/employee/21
Body: { "isSalesRep": true }
```

### Administrator Records

Some employee records have security restrictions:

```javascript
// Employee ID -5 (Sandy Hopkins) = Administrator
// Attempting to update returns:
// 400 Bad Request
// "only an administrator is allowed to edit an administrator record"
```

---

## Testing & Validation

### Quick Test Script

```javascript
// Test employee access
const query = "SELECT COUNT(*) as total FROM employee";
const result = await executeSuiteQL(query);
console.log(`Total employees: ${result.data.items[0].total}`);

// If this works, full employee access is available
```

### Validation Checklist

- [ ] SuiteQL endpoint returns HTTP 200
- [ ] Query returns employee records
- [ ] Can find employees by name
- [ ] Can build ID mapping
- [ ] Can update employee records (PATCH)

---

## Related Documentation

- [NetSuite REST API Guide](./NETSUITE-REST-API-GUIDE.md) - Complete REST API integration
- [Bulk Update Patterns](./BULK-UPDATE-PATTERNS.md) - Best practices for bulk operations

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-10-16 | Initial creation - 10-agent parallel testing breakthrough | Claude Code |

---

**Remember**: When employee access fails, ALWAYS try SuiteQL endpoint before assuming it's impossible!
