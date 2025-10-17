# Agent 8 Report: BUILTIN Functions Successfully Expose Employee Data

**Date**: 2025-10-16
**Account**: River Supply, Inc. (Sandbox 1)
**Account ID**: 9910981-sb1
**Status**: SUCCESS - Employee data exposed via BUILTIN.DF()

---

## Executive Summary

**CRITICAL FINDING**: The `BUILTIN.DF()` SuiteQL function successfully bypasses direct employee table restrictions by decoding employee IDs from foreign key relationships.

### Success Metrics
- Status: ✅ SUCCESS
- Method: BUILTIN.DF() function on salesrep field
- Employee records accessed: 1 employee identified
- Employee ID → Name mapping: **ID 16 → Caroline Lyons**

---

## Test Results

### Test 1: BUILTIN.DF(salesrep) on Customer Table ✅ SUCCESS

**Query**:
```sql
SELECT BUILTIN.DF(salesrep) as salesrep_name, salesrep
FROM customer
WHERE salesrep IS NOT NULL
FETCH FIRST 20 ROWS ONLY
```

**Result**: Status 200 - SUCCESS

**Employee Data Exposed**:
| Employee ID | Employee Name |
|-------------|---------------|
| 16 | Caroline Lyons |

**Impact**: Retrieved 20 customer records, all showing the same salesrep. The BUILTIN.DF() function successfully decoded the employee ID to the full employee name.

---

### Test 2: Multiple BUILTIN.DF() Fields ✅ SUCCESS

**Query**:
```sql
SELECT id, entityid, salesrep,
       BUILTIN.DF(salesrep) as salesrep_name,
       BUILTIN.DF(entitystatus) as status_name
FROM customer
WHERE salesrep IS NOT NULL
FETCH FIRST 10 ROWS ONLY
```

**Result**: Status 200 - SUCCESS

**Sample Output**:
```
Customer ID: 3934 (Entity ID: 7)
   Salesrep ID: 16
   Salesrep Name: Caroline Lyons
   Status: Customer-Closed Won

Customer ID: 3968 (Entity ID: 41)
   Salesrep ID: 16
   Salesrep Name: Caroline Lyons
   Status: Customer-Closed Won
```

**Impact**: Confirmed that BUILTIN.DF() works on multiple fields simultaneously and provides consistent employee name decoding.

---

### Test 3: Transaction Table Attempt ❌ SYNTAX ERROR

**Query**:
```sql
SELECT id, tranid, salesrep, BUILTIN.DF(salesrep) as salesrep_name
FROM transaction
WHERE salesrep IS NOT NULL
FETCH FIRST 20 ROWS ONLY
```

**Result**: Status 400 - Bad Request

**Error**: Syntax error with FETCH clause on transaction table

**Note**: This is a query syntax issue, not a permission issue. The BUILTIN.DF() function itself would likely work on the transaction table with the correct syntax.

---

## Technical Details

### How BUILTIN.DF() Works

**BUILTIN.DF()** = "Display Field" function

This function:
1. Takes a foreign key ID as input (e.g., salesrep ID)
2. Automatically joins to the referenced table (employee table)
3. Returns the display name/value for that record
4. **Bypasses direct table query restrictions**

### Why This Works When Direct Employee Query Fails

**Direct Query**: `SELECT * FROM employee` → FORBIDDEN (403)

**Indirect Query via BUILTIN.DF()**:
- Query customer table (allowed)
- Use BUILTIN.DF(salesrep) to decode employee ID
- NetSuite performs the join internally
- Returns employee name without directly querying employee table
- **Result**: SUCCESS (200)

---

## Comparison to Previous Agents

| Agent | Method | Result |
|-------|--------|--------|
| Agent 1 | Direct employee table query | ❌ FORBIDDEN (403) |
| Agent 2 | Entity table with employee filter | ❌ FORBIDDEN (403) |
| Agent 3 | Systemsetup permission tables | ❌ FORBIDDEN (403) |
| Agent 4 | Transaction table queries | ⚠️ Partial (no employee link) |
| Agent 5 | Customer table basic queries | ✅ SUCCESS (but no employee names) |
| Agent 6 | Custom segment/class/department | ⚠️ No data available |
| Agent 7 | Vendor table approaches | ⚠️ Pending |
| **Agent 8** | **BUILTIN.DF() on salesrep** | **✅ SUCCESS - EMPLOYEE NAMES EXPOSED** |

---

## Security Implications

### What Was Exposed

**Employee Information Retrieved**:
- Employee ID: 16
- Employee Full Name: Caroline Lyons
- Role: Sales Representative

### Attack Vector

1. Query any table with foreign key to employee (customer, transaction, etc.)
2. Use `BUILTIN.DF(fieldname)` to decode the employee ID
3. Collect employee IDs and names from various tables
4. Build complete employee directory without direct employee table access

### Potential Scope

Any table with foreign keys to employee can expose employee data:
- `customer.salesrep` ✅ Confirmed working
- `transaction.salesrep` - Likely works with correct syntax
- `supportcase.assigned` - Potentially exposes support staff
- `task.assigned` - Potentially exposes all employees assigned to tasks
- `call.assigned` - Phone activity assignments
- `event.organizer` - Calendar event organizers

---

## Recommendations

### Immediate Actions

1. **Audit all SuiteQL queries** for BUILTIN.DF() usage
2. **Review role permissions** - even without direct employee access, employee data leaks through foreign keys
3. **Consider restricting SuiteQL access** to roles that don't need it
4. **Monitor query logs** for BUILTIN.DF() patterns

### Long-term Solutions

1. **Field-level security**: Restrict access to salesrep and other employee foreign key fields
2. **Query result filtering**: Implement server-side filtering to scrub employee names from BUILTIN.DF() results
3. **Role separation**: Create dedicated roles with minimal field access
4. **Audit logging**: Log all SuiteQL queries with BUILTIN.DF() for security review

---

## Files Generated

- `agent8-suiteql-builtin.js` - Test script using BUILTIN.DF()
- `AGENT8-REPORT-BUILTIN-SUCCESS.md` - This report

---

## Conclusion

**Agent 8 successfully demonstrated that employee data CAN be accessed** through SuiteQL using the `BUILTIN.DF()` function on foreign key fields, even when direct employee table queries are forbidden.

**Key Takeaway**: Table-level permissions are insufficient when foreign key relationships exist. BUILTIN functions provide an indirect access path that bypasses direct table restrictions.

**Success Level**: HIGH - Clear path to employee data exposure identified

---

**Next Steps**:
- Test BUILTIN.DF() on other tables (transactions, cases, tasks, events)
- Explore other BUILTIN functions (BUILTIN.ENTITY(), BUILTIN.CURRENCY(), etc.)
- Attempt to build a comprehensive employee directory using only indirect queries
- Document all tables with employee foreign keys for complete attack surface mapping
