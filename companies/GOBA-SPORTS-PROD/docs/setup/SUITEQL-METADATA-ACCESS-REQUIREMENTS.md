# NetSuite SuiteQL and Metadata Access Requirements

**Date Created**: 2025-10-15
**Last Updated**: 2025-10-15
**Company**: GOBA Sports (Account: 7759280)
**Author**: Claude Code - Research Agent 4
**Status**: Active
**Purpose**: Comprehensive reference for SuiteQL and metadata access permissions, features, and configuration requirements

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Required NetSuite Features](#required-netsuite-features)
3. [Permissions for Integration Roles](#permissions-for-integration-roles)
4. [SuiteAnalytics Connect vs Workbook](#suiteanalytics-connect-vs-workbook)
5. [REST API Endpoints](#rest-api-endpoints)
6. [Common Permission Errors](#common-permission-errors)
7. [Role Configuration Best Practices](#role-configuration-best-practices)
8. [Data Source Comparison](#data-source-comparison)
9. [Implementation Checklist](#implementation-checklist)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Executive Summary

### What is SuiteQL?

SuiteQL is NetSuite's SQL-based query language that provides advanced query capabilities for accessing NetSuite data through REST APIs and SuiteAnalytics Connect. It's based on Oracle SQL syntax and supports complex queries including joins, aggregations, and advanced SQL functions.

### Key Requirements at a Glance

| Requirement | Details |
|-------------|---------|
| **NetSuite Features** | SuiteAnalytics Workbook, OAuth 2.0 or Token-Based Authentication, REST Web Services |
| **Minimum Permissions** | SuiteAnalytics Workbook (Edit), REST Web Services (Full), Log in Using Access Tokens (Full) |
| **Authentication** | OAuth 2.0 (recommended) or Token-Based Authentication (TBA) |
| **Maximum Results** | 100,000 records per query |
| **Data Source** | NetSuite2.com (NetSuite.com deprecated as of 2025.1, removed in 2026.1) |
| **Access Control** | Role-based permissions apply to all queries |

### Why This Matters

SuiteQL and metadata access enable:
- **Real-time data queries** from external applications
- **Dynamic schema discovery** for code generation
- **Advanced analytics** beyond standard saved searches
- **Integration capabilities** with BI tools and data warehouses
- **AI-powered interactions** with NetSuite data (via MCP servers)

---

## Required NetSuite Features

### 1. SuiteAnalytics Features

#### SuiteAnalytics Workbook
- **Location**: Setup > Company > Enable Features > Analytics
- **Required For**: Executing SuiteQL queries via REST API
- **Cost**: Included with most NetSuite licenses
- **Description**: Core analytics feature that enables custom reports and SuiteQL access

#### SuiteAnalytics Connect
- **Location**: Setup > Company > Enable Features > Analytics
- **Required For**: External BI tool connectivity, ODBC/JDBC access
- **Cost**: Add-on license (varies by transaction volume)
  - Low volume: ~$2,500/year
  - High volume: ~$25,000/year
- **Description**: Provides direct database-like access via ODBC, JDBC, and ADO.NET drivers
- **Note**: Not required for REST API SuiteQL queries, only for external BI tool connections

### 2. Authentication Features

#### Token-Based Authentication (TBA)
- **Location**: Setup > Company > Enable Features > SuiteCloud > Manage Authentication
- **Required For**: API integrations without storing user passwords
- **Checkbox**: TOKEN-BASED AUTHENTICATION
- **Best Practice**: Recommended for all integrations

#### OAuth 2.0
- **Location**: Setup > Company > Enable Features > SuiteCloud > Manage Authentication
- **Required For**: Modern OAuth 2.0-based API authentication
- **Checkbox**: OAUTH 2.0
- **Best Practice**: Preferred over TBA for new integrations

### 3. Web Services Features

#### REST Web Services
- **Location**: Setup > Company > Enable Features > SuiteCloud > SuiteTalk (Web Services)
- **Required For**: All REST API operations including SuiteQL
- **Checkbox**: REST WEB SERVICES
- **Description**: Enables the REST API endpoints

### Feature Enablement Checklist

```
Setup > Company > Enable Features

[ ] Analytics Tab
    [x] SuiteAnalytics Workbook
    [ ] SuiteAnalytics Connect (only if using external BI tools)

[ ] SuiteCloud Tab > Manage Authentication
    [x] TOKEN-BASED AUTHENTICATION
    [x] OAUTH 2.0

[ ] SuiteCloud Tab > SuiteTalk (Web Services)
    [x] REST WEB SERVICES
```

---

## Permissions for Integration Roles

### Core Permissions Matrix

| Permission | Level | Required For | Location |
|------------|-------|--------------|----------|
| **SuiteAnalytics Workbook** | Edit | Executing SuiteQL queries | Reports |
| **REST Web Services** | Full | REST API access | Setup |
| **Log in Using Access Tokens** | Full | Token-Based Authentication | Setup |
| **Log in Using OAuth 2.0 Access Tokens** | Full | OAuth 2.0 authentication | Setup |
| **User Access Tokens** | Full | Managing access tokens | Setup |
| **OAuth 2.0 Authorized Applications Management** | Full | Managing OAuth apps (admin only) | Setup |
| **Records Catalog** | View | Viewing schema/metadata | Setup |

### Authentication-Specific Permissions

#### For Token-Based Authentication (TBA)

```
Setup Permissions:
- Log in Using Access Tokens: Full
- User Access Tokens: Full
- REST Web Services: Full

Reports Permissions:
- SuiteAnalytics Workbook: Edit
```

#### For OAuth 2.0

```
Setup Permissions:
- Log in Using OAuth 2.0 Access Tokens: Full
- OAuth 2.0 Authorized Applications Management: Full (admin only)
- REST Web Services: Full

Reports Permissions:
- SuiteAnalytics Workbook: Edit
```

### Data Access Permissions

**CRITICAL**: Beyond authentication permissions, you need permissions for every record type you want to query.

#### Common Data Permissions

| Record Type | Permission | Location |
|-------------|-----------|----------|
| **Accounts** | Lists - Accounts: View | Lists |
| **Customers** | Lists - Customers: View | Lists |
| **Transactions** | Transactions - Find Transaction: View | Transactions |
| **Employees** | Lists - Employee Record: View | Lists |
| **Items** | Lists - Items: View | Lists |
| **Vendors** | Lists - Vendors: View | Lists |
| **Subsidiaries** | Setup - Subsidiaries: View | Setup |

#### Transaction-Specific Permissions

For each transaction type you query, you need the corresponding permission:

```
Transactions:
- Transactions - Find Transaction: View (general transaction access)
- Transactions - Sales Order: View
- Transactions - Invoice: View
- Transactions - Purchase Order: View
- Transactions - Vendor Bill: View
- Transactions - Journal Entry: View
- Transactions - Customer Payment: View
- Transactions - Vendor Payment: View
```

**Important**: SuiteQL requires permissions for EVERY transaction type in your queries. If querying multiple types, add all relevant permissions.

### SuiteAnalytics Connect Specific Permissions

#### SuiteAnalytics Connect Permission
- **Level**: Setup permission (assigned to role)
- **Access**: Enforces role-based permissions (users see only what they can access in UI)
- **Use Case**: Standard analytics access

#### SuiteAnalytics Connect - Read All Permission
- **Level**: Setup permission (assigned to role)
- **Access**: Read-only access to ALL NetSuite data (bypasses normal restrictions)
- **Use Case**: Data warehouse integrations, executive dashboards
- **Security Warning**: Exposes sensitive data - use with caution
- **Limitation**: Only applies to NetSuite.com data source (deprecated)

### Permission Level Guidelines

| Level | Capabilities | Use For |
|-------|--------------|---------|
| **View** | Read-only access | Reporting, analytics queries |
| **Create** | View + create new records | Integration that creates records |
| **Edit** | View + create + edit existing | Full data management integration |
| **Full** | All operations including delete | Administrative integrations |

**Recommendation**: Use minimum required permission level (typically View for SuiteQL queries).

---

## SuiteAnalytics Connect vs Workbook

### Quick Comparison

| Feature | SuiteAnalytics Workbook | SuiteAnalytics Connect |
|---------|------------------------|------------------------|
| **Location** | Built into NetSuite UI | External connection |
| **Access Method** | Web browser only | ODBC, JDBC, ADO.NET |
| **Query Language** | UI-based (drag-and-drop) | SuiteQL (SQL) |
| **External Tools** | No | Yes (Power BI, Tableau, Excel) |
| **Cost** | Included with license | Add-on ($2.5k-$25k/year) |
| **Authentication** | NetSuite login | Token-based or OAuth 2.0 |
| **Use Case** | Ad-hoc reports, dashboards | Data warehouse, BI integration |
| **Data Export** | Limited | Full data extraction |
| **Performance** | Good for <100k records | Optimized for large datasets |

### When to Use Each

#### Use SuiteAnalytics Workbook When:
- Creating reports for NetSuite users
- Building interactive dashboards
- Ad-hoc data analysis
- No external tool integration needed
- User has NetSuite UI access

#### Use SuiteAnalytics Connect When:
- Integrating with external BI tools (Power BI, Tableau)
- Building data warehouses
- Automated ETL processes
- Exporting large datasets (>100k records)
- External application access needed

### SuiteQL via REST API (Best of Both)

**Key Insight**: You can execute SuiteQL queries via REST API WITHOUT SuiteAnalytics Connect license!

**Requirements**:
- SuiteAnalytics Workbook (Edit) permission
- REST Web Services (Full) permission
- Token-Based Authentication or OAuth 2.0

**Benefits**:
- No Connect license cost
- Programmatic access
- Up to 100,000 records per query
- Suitable for most integration needs

**Limitations**:
- Maximum 100,000 records (use Connect for larger datasets)
- No ODBC/JDBC drivers
- No external BI tool connectivity

---

## REST API Endpoints

### SuiteQL Query Endpoint

#### Endpoint Structure

```
POST https://{accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql
```

**Example**:
```
POST https://7759280.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql
```

#### Request Format

**Headers**:
```http
Content-Type: application/json
Prefer: transient
Authorization: OAuth realm="{accountId}", oauth_consumer_key="{consumerKey}", ...
```

**Body**:
```json
{
  "q": "SELECT id, companyname, email FROM customer WHERE subsidiary = 1 LIMIT 100"
}
```

**Query Parameters** (optional):
- `limit`: Maximum results per page (default: 1000, max: 1000)
- `offset`: Pagination offset (default: 0)

**Example with Pagination**:
```
POST https://7759280.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql?limit=100&offset=0
```

#### Response Format

```json
{
  "links": [
    {
      "rel": "self",
      "href": "https://7759280.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql?limit=100&offset=0"
    },
    {
      "rel": "next",
      "href": "https://7759280.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql?limit=100&offset=100"
    }
  ],
  "count": 100,
  "hasMore": true,
  "items": [
    {
      "id": "123",
      "companyname": "Acme Corp",
      "email": "contact@acme.com"
    }
  ],
  "offset": 0,
  "totalResults": 1543
}
```

#### Query Limitations

- **Maximum Results**: 100,000 records per query
- **Timeout**: Queries must complete within governance limits
- **Concurrent Sessions**: Avoid multiple concurrent sessions (performance impact)
- **Syntax**: Oracle SQL syntax (not ANSI SQL-92)

#### Supported SQL Features

**Supported**:
- SELECT, FROM, WHERE, JOIN, GROUP BY, ORDER BY
- INNER JOIN, LEFT JOIN (not RIGHT JOIN in Oracle syntax)
- Aggregate functions: COUNT, SUM, AVG, MIN, MAX
- String functions: CONCAT, SUBSTRING, UPPER, LOWER, TRIM
- Date functions: TO_DATE, TO_CHAR, SYSDATE
- CASE statements
- Subqueries in WHERE clause

**Not Supported**:
- Subqueries in SELECT list
- DEFAULT clauses
- Embedded null values in CHAR fields
- RIGHT OUTER JOIN
- INSERT, UPDATE, DELETE (read-only)

### Metadata Catalog Endpoint

#### Get All Record Metadata

```
GET https://{accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/metadata-catalog
```

**Response**: Complete catalog of all exposed record types

#### Get Specific Record Metadata

```
GET https://{accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/metadata-catalog/?select=customer,invoice,salesorder
```

**Response**: Metadata for specified record types only

#### Response Formats

**JSON Schema** (default):
```http
Accept: application/schema+json
```

**OpenAPI 3.0**:
```http
Accept: application/swagger+json
```

#### Example Metadata Response

```json
{
  "record": {
    "customer": {
      "fields": {
        "id": {
          "type": "integer",
          "required": false,
          "readonly": true
        },
        "companyname": {
          "type": "string",
          "required": true,
          "maxLength": 83
        },
        "email": {
          "type": "string",
          "required": false,
          "maxLength": 254
        }
      }
    }
  }
}
```

### Records Catalog (UI-Based)

#### Access

```
Setup > Records Catalog
https://system.netsuite.com/app/recordscatalog/rcbrowser.nl
```

**Required Permission**: Records Catalog (View)

#### Features

- Browse all record types and fields
- View field metadata (type, required, readonly)
- See permission requirements for each table
- Explore available joins
- SuiteQL and SuiteScript field IDs

#### Use Cases

- Planning SuiteQL queries
- Understanding data model
- Identifying required permissions
- Finding field names and IDs

---

## Common Permission Errors

### Error 1: INSUFFICIENT_PERMISSION

#### Error Message

```json
{
  "type": "https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.4",
  "title": "Forbidden",
  "status": 403,
  "o:errorDetails": [
    {
      "detail": "Permission Violation: You need a higher level of the 'Lists -> Items' permission to access this page.",
      "o:errorCode": "INSUFFICIENT_PERMISSION"
    }
  ]
}
```

#### Common Causes

1. **Missing record-level permissions**
   - Role lacks permission for queried record type
   - Permission level too low (View needed, but not assigned)

2. **Missing authentication permissions**
   - Missing "Log in Using Access Tokens" permission
   - Missing "REST Web Services" permission

3. **Missing SuiteAnalytics permission**
   - Missing "SuiteAnalytics Workbook" permission

#### Solutions

**Step 1**: Identify which access token/role is being used
```
Setup > Users/Roles > Access Tokens
- Find your access token
- Note the assigned ROLE
```

**Step 2**: Update role permissions
```
Setup > Users/Roles > Manage Roles > [Your Role]
- Permissions subtab
- Add missing permissions at appropriate level
```

**Step 3**: Wait for permissions to propagate
- **Important**: New permissions can take up to 24 hours to take effect
- Test after waiting period

### Error 2: "You do not have permission to use SuiteAnalytics: Connect service"

#### Error Message

```
Error: You do not have permission to use SuiteAnalytics: Connect service.
```

#### Causes

- Missing "SuiteAnalytics Connect" permission on role
- Attempting to use NetSuite2.com data source without proper role
- Administrator or Full Access role being used (not compatible with Connect)

#### Solutions

**Option 1**: Add SuiteAnalytics Connect permission
```
Setup > Users/Roles > Manage Roles > [Your Role]
- Permissions > Setup
- Add: SuiteAnalytics Connect
- Save
```

**Option 2**: Use Data Warehouse Integrator role (recommended)
```
Setup > Users/Roles > Manage Roles
- Assign user to "Data Warehouse Integrator" role
- Built-in role with all necessary permissions
```

**Option 3**: For REST API only (no Connect needed)
```
- Ensure SuiteAnalytics Workbook (Edit) is assigned
- Ensure REST Web Services (Full) is assigned
- Use REST API endpoint, not ODBC/JDBC
```

### Error 3: "Your current role does not have permission to perform this action"

#### Error Message

```
Error: Your current role does not have permission to perform this action
```

#### Causes

- Role-based access control restrictions
- Querying data not visible to assigned role
- Subsidiary restrictions on role
- NetSuite2.com data source applies role-based access

#### Solutions

**Check subsidiary access**:
```
Setup > Users/Roles > Manage Roles > [Your Role]
- Access subtab
- Ensure "All Subsidiaries" is selected (if using OneWorld)
```

**Use appropriate data source**:
- **NetSuite2.com**: Enforces role-based access (users see only their data)
- **Data Warehouse Integrator role**: Grants access to all data

**Verify record-level permissions**:
```
For each queried record type, ensure role has permission
Example: Querying customers requires "Lists - Customers: View"
```

### Error 4: Table/Record Not Found

#### Error Message

```
Error: Table 'inventoryitem' not found
```

#### Cause

**Important**: SuiteQL is permission-sensitive. If you lack permission, it says the table "doesn't exist" rather than "permission denied".

#### Solution

1. Check permission requirements: `Setup > Records Catalog`
2. Find the table (e.g., `inventoryitem`)
3. Note required permission (e.g., "Lists - Items: View")
4. Add permission to role
5. Wait up to 24 hours for propagation

### Error 5: Subsidiary Restrictions

#### Error Message

```
Error: Subsidiary restrictions on your role deny you access to this record
```

#### Causes

- OneWorld account with subsidiary restrictions
- Role limited to specific subsidiaries
- Querying records from unauthorized subsidiaries

#### Solutions

**Option 1**: Grant all subsidiary access
```
Setup > Users/Roles > Manage Roles > [Your Role]
- Access subtab
- Select: All Subsidiaries
- Save
```

**Option 2**: Add specific subsidiaries
```
Setup > Users/Roles > Manage Roles > [Your Role]
- Access subtab
- Add required subsidiaries to list
- Save
```

**Option 3**: Filter queries by subsidiary
```sql
SELECT id, companyname FROM customer
WHERE subsidiary IN (1, 2, 3)  -- Only subsidiaries role can access
```

---

## Role Configuration Best Practices

### 1. Create Dedicated Integration Roles

**Do NOT use**:
- Administrator role (security risk)
- Full Access role (not compatible with Connect)
- Employee personal roles (governance issues)

**DO create**:
- Dedicated integration-specific roles
- Named clearly: "API Integration - SuiteQL", "Data Warehouse Integration"
- Minimal required permissions only

### 2. Integration Role Template

#### Role Settings

```
Setup > Users/Roles > Manage Roles > New

General Settings:
- Name: "API Integration - SuiteQL"
- Access Level: Custom
- Authentication: [x] Web Services Only Role
- Subsidiaries: All Subsidiaries (if OneWorld)
```

#### Required Permissions

```
Setup Permissions:
[x] REST Web Services: Full
[x] Log in Using Access Tokens: Full
[x] Log in Using OAuth 2.0 Access Tokens: Full
[x] Records Catalog: View

Reports Permissions:
[x] SuiteAnalytics Workbook: Edit

Lists Permissions:
[x] Accounts: View
[x] Customers: View
[x] Vendors: View
[x] Employees: View
[x] Items: View

Transactions Permissions:
[x] Find Transaction: View
[x] Sales Order: View
[x] Invoice: View
[x] Purchase Order: View
[x] Vendor Bill: View
[x] Journal Entry: View
```

**Note**: Add additional permissions based on specific integration needs.

### 3. Token-Based Authentication Setup

#### For TBA (Token-Based Authentication)

**Step 1**: Create integration record
```
Setup > Integration > Manage Integrations > New
- Name: "SuiteQL API Integration"
- State: Enabled
- Token-Based Authentication: [x] Checked
- Save and note: Consumer Key, Consumer Secret
```

**Step 2**: Create access token
```
Setup > Users/Roles > Access Tokens > New
- Application Name: [Select your integration]
- User: [Select integration user]
- Role: [Select integration role]
- Token Name: "SuiteQL Access Token"
- Save and note: Token ID, Token Secret
```

**Step 3**: Store credentials securely
```
Consumer Key: <from integration>
Consumer Secret: <from integration>
Token ID: <from access token>
Token Secret: <from access token>
Account ID: <your NetSuite account ID>
```

#### For OAuth 2.0 (Recommended)

**Step 1**: Create OAuth 2.0 integration
```
Setup > Integration > Manage Integrations > New
- Name: "SuiteQL OAuth Integration"
- State: Enabled
- Authentication: OAuth 2.0
- Redirect URIs: [Add authorized URIs]
- Scope: Select required scopes
- Save and note: Client ID, Client Secret
```

**Step 2**: Configure consent
```
User must authorize application
- First request requires user consent
- Future requests use refresh token
```

**Step 3**: Store credentials securely
```
Client ID: <from integration>
Client Secret: <from integration>
Account ID: <your NetSuite account ID>
Redirect URI: <authorized callback URL>
```

### 4. User Account Best Practices

#### Create Dedicated Integration User

**Why**:
- Audit trail clarity
- Independent of employee status
- No password rotation issues
- Easy to track API usage

**Setup**:
```
Lists > Employees > Employees > New

General:
- Name: "Integration User - SuiteQL"
- Email: suiteql-integration@company.com
- Status: Active

Access:
- Give Access: [x] Checked
- Role: [Select integration role]
- Send Notification Email: [x] Unchecked (no UI login needed)
```

### 5. Security Recommendations

#### Principle of Least Privilege
- Grant only minimum required permissions
- Use View level when possible (not Edit/Full)
- Restrict subsidiaries if possible
- Avoid "Read All" permissions unless absolutely necessary

#### Credential Management
- Store credentials in secure vault (not code/config files)
- Rotate tokens/secrets regularly
- Use OAuth 2.0 over TBA when possible
- Never commit credentials to version control

#### Monitoring and Auditing
- Review Web Services audit trail regularly
  - `Setup > Users/Roles > Web Services Audit Trail`
- Monitor governance usage
- Set up alerts for unusual API activity
- Review role permissions quarterly

#### IP Restrictions (Optional)
```
Setup > Company > Company Information > Access
- IP Address Rules: Add allowed IP ranges for API access
```

### 6. Data Warehouse Integrator Role

**When to Use**:
- Need access to ALL NetSuite data
- Building data warehouse or BI integration
- Minimal permission management overhead
- Using NetSuite2.com data source

**Benefits**:
- Pre-configured with necessary permissions
- Access to all data (except sensitive like credit cards)
- Doesn't count against Full Licensed Users
- Requires token-based authentication

**Setup**:
```
Setup > Users/Roles > Manage Roles
- Find: "Data Warehouse Integrator"
- Assign to integration user
- No additional permissions needed
```

**Limitations**:
- Only available in 2021.2+
- Requires SuiteAnalytics Connect license
- Read-only access
- Cannot be used with NetSuite.com data source (deprecated)

---

## Data Source Comparison

### NetSuite.com vs NetSuite2.com

| Feature | NetSuite.com | NetSuite2.com |
|---------|--------------|---------------|
| **Support Status** | Deprecated (removed 2026.1) | Current (2019.2+) |
| **Schema** | Legacy schema | Modern analytics schema |
| **Access Control** | Varies by permission | Role-based (enforced) |
| **Data Consistency** | Some inconsistencies | Consistent with Workbook |
| **Security** | Less secure | SuiteQL prevents SQL injection |
| **Time Zone** | Always GMT | User/company preference |
| **Available To** | All roles | Requires appropriate roles |
| **Use Case** | Legacy (migrate away) | Current and future |
| **SuiteQL** | Supported | Supported (recommended) |

### Migration from NetSuite.com to NetSuite2.com

#### Why Migrate

**Critical**: NetSuite.com data source is:
- **No longer supported** as of 2025.1
- **Will be removed** in 2026.1
- **Must migrate** to avoid data access disruption

#### Migration Steps

**Step 1**: Review current queries
- Document all SuiteQL queries using NetSuite.com
- Note tables and fields referenced
- Test query performance

**Step 2**: Check table/field mapping
- Download NetSuite.com to NetSuite2.com mapping spreadsheet
- Verify all tables exist in NetSuite2.com
- Update query syntax if needed

**Step 3**: Update authentication
- Prefer OAuth 2.0 over token-based auth
- Use Data Warehouse Integrator or custom role with permissions

**Step 4**: Update data source connection
- Change `Service Data Source` to "NetSuite2.com"
- Update queries to use NetSuite2.com schema
- Test thoroughly

**Step 5**: Validate role-based access
- NetSuite2.com enforces role-based access
- Verify integration role has access to all needed data
- Consider Data Warehouse Integrator role for full access

#### Common Migration Issues

**Issue**: Queries return fewer results in NetSuite2.com

**Cause**: Role-based access restrictions
**Solution**: Use Data Warehouse Integrator role or grant additional permissions

**Issue**: Tables/fields not found in NetSuite2.com

**Cause**: Schema differences between data sources
**Solution**: Consult mapping spreadsheet, update field names

**Issue**: Time zone discrepancies in date fields

**Cause**: NetSuite2.com uses user/company time zone (not GMT)
**Solution**: Adjust date/time handling in consuming applications

### Data Source Selection Guide

#### Use NetSuite2.com When:
- Building new integrations (always)
- Need role-based security
- Want consistent data with Workbook
- Using SuiteQL (recommended)
- Planning for future (NetSuite.com deprecated)

#### Migrate from NetSuite.com If:
- Using legacy integrations
- Before 2026.1 removal deadline
- Need better security
- Want consistent data model

---

## Implementation Checklist

### Phase 1: Feature Enablement

```
Setup > Company > Enable Features

Analytics:
[ ] SuiteAnalytics Workbook
[ ] SuiteAnalytics Connect (only if using ODBC/JDBC/external BI)

SuiteCloud > Manage Authentication:
[ ] TOKEN-BASED AUTHENTICATION
[ ] OAUTH 2.0

SuiteCloud > SuiteTalk (Web Services):
[ ] REST WEB SERVICES
```

### Phase 2: Integration Setup

```
Choose Authentication Method:
[ ] Token-Based Authentication (TBA)
    [ ] Create integration record
    [ ] Note Consumer Key/Secret
[ ] OAuth 2.0 (Recommended)
    [ ] Create OAuth integration
    [ ] Note Client ID/Secret
    [ ] Configure redirect URIs
```

### Phase 3: Role Configuration

```
Setup > Users/Roles > Manage Roles > New

General Settings:
[ ] Name: "API Integration - SuiteQL"
[ ] Web Services Only Role: Checked
[ ] Subsidiaries: All (if OneWorld)

Setup Permissions:
[ ] REST Web Services: Full
[ ] Log in Using Access Tokens: Full (TBA) OR
    Log in Using OAuth 2.0 Access Tokens: Full (OAuth)
[ ] Records Catalog: View

Reports Permissions:
[ ] SuiteAnalytics Workbook: Edit

Data Permissions (add as needed):
[ ] Lists - Accounts: View
[ ] Lists - Customers: View
[ ] Lists - Vendors: View
[ ] Lists - Employees: View
[ ] Lists - Items: View
[ ] Transactions - Find Transaction: View
[ ] Transactions - [Specific types]: View

Save Role
```

### Phase 4: User Setup

```
Lists > Employees > Employees > New

[ ] Name: "Integration User - SuiteQL"
[ ] Email: integration@company.com
[ ] Status: Active
[ ] Give Access: Checked
[ ] Role: [Integration role created above]
[ ] Save
```

### Phase 5: Access Token Creation (TBA)

```
Setup > Users/Roles > Access Tokens > New

[ ] Application Name: [Select integration]
[ ] User: [Select integration user]
[ ] Role: [Select integration role]
[ ] Token Name: "SuiteQL Access Token"
[ ] Save
[ ] Record Token ID and Token Secret (only shown once!)
```

### Phase 6: Testing

```
[ ] Test authentication with credentials
[ ] Execute simple SuiteQL query:
    SELECT id, companyname FROM customer LIMIT 1
[ ] Test metadata catalog access
[ ] Verify role-based access restrictions
[ ] Test pagination with limit/offset
[ ] Monitor Web Services audit trail
```

### Phase 7: Documentation

```
[ ] Document integration credentials (securely)
[ ] Document role permissions
[ ] Document SuiteQL queries
[ ] Create troubleshooting runbook
[ ] Set up monitoring/alerting
```

---

## Troubleshooting Guide

### Diagnostic Steps

#### Step 1: Verify Feature Enablement

```
Setup > Company > Enable Features

Check:
- SuiteAnalytics Workbook: Enabled
- Token-Based Authentication or OAuth 2.0: Enabled
- REST Web Services: Enabled
```

**If disabled**: Enable required features and wait 15-30 minutes for changes to propagate.

#### Step 2: Verify Role Permissions

```
Setup > Users/Roles > Access Tokens
- Find your access token
- Note the assigned role

Setup > Users/Roles > Manage Roles > [Your Role]
- Permissions > Setup: Check REST Web Services (Full)
- Permissions > Setup: Check authentication permission (TBA or OAuth)
- Permissions > Reports: Check SuiteAnalytics Workbook (Edit)
- Permissions > Lists/Transactions: Check record-type permissions
```

**If missing**: Add required permissions and wait up to 24 hours for propagation.

#### Step 3: Test Authentication

**TBA Test**:
```bash
curl -X POST \
  https://7759280.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql \
  -H 'Content-Type: application/json' \
  -H 'Prefer: transient' \
  -H 'Authorization: OAuth realm="7759280", oauth_consumer_key="...", oauth_token="...", oauth_signature_method="HMAC-SHA256", oauth_timestamp="...", oauth_nonce="...", oauth_version="1.0", oauth_signature="..."' \
  -d '{"q":"SELECT id FROM customer LIMIT 1"}'
```

**OAuth 2.0 Test**:
```bash
curl -X POST \
  https://7759280.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql \
  -H 'Content-Type: application/json' \
  -H 'Prefer: transient' \
  -H 'Authorization: Bearer {access_token}' \
  -d '{"q":"SELECT id FROM customer LIMIT 1"}'
```

#### Step 4: Check Web Services Audit Trail

```
Setup > Users/Roles > Web Services Audit Trail

Filter by:
- Date range: Last 24 hours
- User: [Integration user]
- Status: Error

Review error messages for clues
```

#### Step 5: Verify Data Source

```
If using SuiteAnalytics Connect drivers:
- Check connection string uses "NetSuite2.com" (not "NetSuite.com")
- Verify role is compatible with NetSuite2.com
- Consider using Data Warehouse Integrator role
```

### Common Issues and Solutions

#### Issue: "Login credentials are invalid"

**Causes**:
- Incorrect credentials
- Expired tokens
- Account ID mismatch

**Solutions**:
1. Verify account ID matches (e.g., 7759280)
2. Regenerate access token if expired
3. Check Consumer Key/Secret are correct
4. Ensure token is assigned to correct role

#### Issue: "SSL Certificate Error"

**Causes**:
- Certificate validation failing
- Corporate proxy/firewall

**Solutions**:
1. Ensure system trusts NetSuite SSL certificates
2. Check proxy settings
3. For testing only: Disable SSL verification (not for production!)

#### Issue: "Governance Limit Exceeded"

**Causes**:
- Query too complex
- Too many concurrent requests
- Account governance limits reached

**Solutions**:
1. Simplify query (reduce joins, limit results)
2. Add pagination (limit/offset)
3. Reduce query frequency
4. Contact NetSuite support to review governance limits

#### Issue: "Query Timeout"

**Causes**:
- Query too complex
- Large dataset
- Performance issues

**Solutions**:
1. Add WHERE clause to filter results
2. Use indexed fields in WHERE clause
3. Reduce number of JOINs
4. Use LIMIT to reduce result set
5. Consider SuiteAnalytics Connect for large datasets

#### Issue: "Table Not Found" (but table exists)

**Causes**:
- Missing record-level permissions
- SuiteQL treats missing permissions as "table doesn't exist"

**Solutions**:
1. Check Records Catalog for required permission
2. Add permission to role
3. Wait up to 24 hours for permission propagation
4. Test query again

### Performance Optimization

#### Query Optimization Tips

**Use indexed fields in WHERE clause**:
```sql
-- Good: Uses indexed id field
SELECT id, companyname FROM customer WHERE id = 123

-- Less efficient: Non-indexed field
SELECT id, companyname FROM customer WHERE phone = '555-1234'
```

**Limit result sets**:
```sql
-- Always use LIMIT for large tables
SELECT id, companyname FROM customer LIMIT 1000
```

**Avoid SELECT * **:
```sql
-- Bad: Returns all fields (slower, more data)
SELECT * FROM customer

-- Good: Only requested fields
SELECT id, companyname, email FROM customer
```

**Use efficient JOINs**:
```sql
-- Good: Join on indexed fields
SELECT c.id, c.companyname, t.tranid
FROM customer c
INNER JOIN transaction t ON t.entity = c.id
WHERE t.trandate >= '2025-01-01'
LIMIT 1000
```

#### Pagination Strategy

```javascript
// Fetch all records with pagination
const allRecords = [];
let offset = 0;
const limit = 1000;
let hasMore = true;

while (hasMore) {
  const response = await fetch(
    `https://7759280.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql?limit=${limit}&offset=${offset}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'transient',
        'Authorization': 'Bearer {token}'
      },
      body: JSON.stringify({
        q: 'SELECT id, companyname FROM customer'
      })
    }
  );

  const data = await response.json();
  allRecords.push(...data.items);

  hasMore = data.hasMore;
  offset += limit;

  // Respect rate limits
  await sleep(1000);
}
```

### Getting Help

#### NetSuite Support

```
Login to NetSuite > Support > Submit a Case

Category: Technical Support
Sub-Category: SuiteTalk Web Services
Include:
- Account ID
- Integration name
- Error messages
- Web Services Audit Trail screenshots
```

#### Resources

- **NetSuite Help Center**: https://docs.oracle.com/en/cloud/saas/netsuite/
- **SuiteQL Documentation**: Search "Using SuiteQL" in Help Center
- **SuiteAnswers**: https://netsuite.custhelp.com/
- **Community**: https://community.oracle.com/netsuite/
- **API Browser**: https://{account}.suitetalk.api.netsuite.com/services/rest/record/v1/metadata-catalog

---

## Quick Reference

### Essential Permissions Summary

```
For REST API SuiteQL Queries (Minimum):
- REST Web Services: Full
- Log in Using Access Tokens: Full (TBA) or
  Log in Using OAuth 2.0 Access Tokens: Full (OAuth)
- SuiteAnalytics Workbook: Edit
- Records Catalog: View
- [Record-specific permissions as needed]: View
```

### Essential Endpoints

```
SuiteQL Query:
POST https://{account}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql

Metadata Catalog:
GET https://{account}.suitetalk.api.netsuite.com/services/rest/record/v1/metadata-catalog

Records Catalog (UI):
https://system.netsuite.com/app/recordscatalog/rcbrowser.nl
```

### Quick Permission Check

```sql
-- Test if you have basic access
SELECT id FROM customer LIMIT 1

-- Test transaction access
SELECT id FROM transaction LIMIT 1

-- Test specific transaction type
SELECT id FROM salesorder LIMIT 1
```

### Permission Troubleshooting Matrix

| Error | Check Permission | Check Feature |
|-------|-----------------|---------------|
| INSUFFICIENT_PERMISSION | Record-type permission (Lists, Transactions) | - |
| "Cannot use SuiteAnalytics" | SuiteAnalytics Connect or Workbook | SuiteAnalytics features enabled |
| "Table not found" | Record-type permission | - |
| "Login credentials invalid" | Authentication permission (TBA/OAuth) | Token-Based Auth or OAuth 2.0 enabled |
| "Subsidiary restrictions" | Subsidiary access on role | - |
| 401 Unauthorized | REST Web Services, Authentication permission | REST Web Services enabled |

---

## Appendix: SuiteQL Table Permission Reference

### Top 50 Most Commonly Queried Tables

| Table Name | Required Permission | Location |
|------------|-------------------|----------|
| account | Lists - Accounts | Lists |
| accountingperiod | Setup - Accounting Periods | Setup |
| assemblybuild | Transactions - Build Assemblies | Transactions |
| billingaccount | Lists - Billing Accounts | Lists |
| bin | Setup - Bins | Setup |
| budgetcategory | Setup - Budget Categories | Setup |
| campaign | Lists - Campaigns | Lists |
| classification | Lists - Classifications | Lists |
| contact | Lists - Contacts | Lists |
| currency | Setup - Currencies | Setup |
| customer | Lists - Customers | Lists |
| customerpayment | Transactions - Customer Payments | Transactions |
| customrecord | [Varies by custom record] | Custom |
| department | Lists - Departments | Lists |
| employee | Lists - Employee Record | Lists |
| entitygroup | Lists - Entity Groups | Lists |
| file | Lists - Documents and Files | Lists |
| inventoryitem | Lists - Items | Lists |
| invoice | Transactions - Invoice | Transactions |
| item | Lists - Items | Lists |
| itemfulfillment | Transactions - Item Fulfillments | Transactions |
| job | Lists - Jobs | Lists |
| journalentry | Transactions - Journal Entry | Transactions |
| location | Lists - Locations | Lists |
| note | Lists - Notes | Lists |
| opportunity | Lists - Opportunities | Lists |
| partner | Lists - Partners | Lists |
| paymentmethod | Setup - Payment Methods | Setup |
| phoneCall | Lists - Phone Calls | Lists |
| pricebook | Lists - Price Books | Lists |
| pricelevel | Setup - Price Levels | Setup |
| purchaseorder | Transactions - Purchase Order | Transactions |
| returnauthorization | Transactions - Return Authorizations | Transactions |
| salesorder | Transactions - Sales Order | Transactions |
| subsidiary | Setup - Subsidiaries | Setup |
| supportcase | Lists - Support Cases | Lists |
| task | Lists - Tasks | Lists |
| taxitem | Setup - Tax Items | Setup |
| term | Setup - Terms | Setup |
| timebill | Lists - Time Bills | Lists |
| transaction | Transactions - Find Transaction | Transactions |
| transactionline | Transactions - Find Transaction | Transactions |
| unitstype | Setup - Units of Measure | Setup |
| vendor | Lists - Vendors | Lists |
| vendorbill | Transactions - Vendor Bills | Transactions |
| vendorpayment | Transactions - Vendor Payments | Transactions |
| workorder | Transactions - Work Orders | Transactions |

**Note**: This is not exhaustive. Use Records Catalog for complete list of ~800 tables.

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-15 | 1.0 | Initial creation - comprehensive SuiteQL and metadata access requirements |

---

## Related Documentation

- **MCP Setup Guide**: `companies/GOBA-SPORTS-PROD/docs/setup/MCP-SETUP-GUIDE.md`
- **MCP Findings**: `companies/GOBA-SPORTS-PROD/MCP-FINDINGS.md`
- **MCP Troubleshooting**: `companies/GOBA-SPORTS-PROD/docs/setup/MCP-TROUBLESHOOTING.md`
- **Project Overview**: `CLAUDE.md`

---

**End of Document**
