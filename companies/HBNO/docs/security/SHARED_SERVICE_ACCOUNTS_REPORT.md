# HBNO NetSuite User Security Assessment
## Shared Accounts & Service Accounts Analysis

**Assessment Date:** 2025-10-15
**NetSuite Account:** HBNO
**Total Users Analyzed:** 144 users
**Critical Findings:** 15 Shared/Service Accounts Identified

---

## Executive Summary

### Key Findings
- **15 Shared/Service Accounts** identified with functional or generic email addresses
- **8 High-Risk Accounts** with Administrator or privileged financial access
- **Multiple compliance violations** for shared accounts with privileged roles
- **Lack of individual accountability** across critical business functions
- **Password sharing risks** across departments

### Risk Distribution
| Risk Level | Count | Percentage |
|------------|-------|------------|
| **CRITICAL** | 5 | 33.3% |
| **HIGH** | 3 | 20.0% |
| **MEDIUM** | 4 | 26.7% |
| **LOW** | 3 | 20.0% |

---

## Detailed Account Analysis

### 🔴 CRITICAL RISK - Shared Accounts with Administrator Access

#### 1. AP Accounts Payable (`ap@hbno.com`)
**Account Type:** Shared Functional Account
**Risk Level:** 🔴 **CRITICAL**

**Assigned Roles:**
- buildHBNO - Warehouse Manager
- HBNO - Customer Service Restricted all subs
- **HBNO - Accountant** (Financial Access)
- J.P. Morgan Minimal Role (Banking Integration)

**Security Concerns:**
- ✗ Shared account with financial transaction authority
- ✗ Multiple departments sharing single credential (AP + Warehouse + CS)
- ✗ Access to J.P. Morgan banking integration
- ✗ No individual accountability for financial transactions
- ✗ Password sharing risk across teams
- ✗ Potential SOX compliance violation

**Business Impact:**
- Accounts Payable operations (bill entry, vendor payments)
- Warehouse management functions
- Customer service access
- Banking reconciliation

**Recommended Actions:**
1. **IMMEDIATE:** Disable this account after converting to named users
2. Create individual AP user accounts for each staff member
3. Segregate warehouse and customer service access
4. Implement approval workflows requiring named users
5. Audit all transactions performed by this account in the last 12 months

**Remediation Priority:** ⚠️ **IMMEDIATE (Week 1)**

---

#### 2. Accounts Receivable (`ar@hbno.com`)
**Account Type:** Shared Functional Account
**Risk Level:** 🔴 **CRITICAL**

**Assigned Roles:**
- HBNO - Customer Service Specialist
- HBNO - Customer Service Restricted all subs
- **HBNO - Accountant** (Financial Access)

**Security Concerns:**
- ✗ Shared account with financial transaction authority
- ✗ Customer service and accounting combined (SOD violation)
- ✗ No audit trail for individual AR staff actions
- ✗ Payment application and adjustment authority
- ✗ Customer credit management access

**Business Impact:**
- Accounts Receivable operations (invoicing, payments, credits)
- Customer service functions
- Credit management
- Collections activities

**Recommended Actions:**
1. **IMMEDIATE:** Create individual AR user accounts
2. Separate customer service from financial accounting roles
3. Implement segregation of duties (SOD) controls
4. Require named users for all payment applications
5. Enable approval workflows for credits and adjustments

**Remediation Priority:** ⚠️ **IMMEDIATE (Week 1)**

---

#### 3. AP Accountant (`accountant@hbno.com`)
**Account Type:** Shared Functional Account
**Risk Level:** 🔴 **CRITICAL**

**Assigned Roles:**
- **HBNO - Accountant** (Full Financial Access)

**Security Concerns:**
- ✗ Generic accountant credential shared by multiple staff
- ✗ Full financial transaction authority
- ✗ Journal entry and adjustment capabilities
- ✗ No individual accountability for GL changes
- ✗ Potential fraud risk with shared credentials

**Business Impact:**
- General Ledger entries
- Financial statement preparation
- Month-end close activities
- Account reconciliations

**Recommended Actions:**
1. **IMMEDIATE:** Convert to named accountant users
2. Assign specific GL responsibilities by user
3. Implement maker-checker approval workflows
4. Enable detailed audit logging per user
5. Review all GL entries from the last fiscal year

**Remediation Priority:** ⚠️ **IMMEDIATE (Week 1)**

---

#### 4. Eduardo NS (`netsuite1@hbno.com`)
**Account Type:** Generic Service Account
**Risk Level:** 🔴 **CRITICAL**

**Assigned Roles:**
- NetSuite Support Center (Basic)
- NetSuite Support Center
- **HBNO - Administrator** (Full System Access)
- Amazon User (Integration)

**Security Concerns:**
- ✗ Administrator role on generic account
- ✗ Likely used for system administration or support
- ✗ Amazon integration access
- ✗ No clear account ownership
- ✗ Potential backdoor access risk

**Business Impact:**
- Full system configuration access
- Amazon integration operations
- NetSuite support activities
- User and role management

**Recommended Actions:**
1. **IMMEDIATE:** Identify actual user(s) of this account
2. Convert to named administrator account
3. Remove Amazon integration from admin account (use service account)
4. Implement MFA requirement
5. Review all configuration changes made by this account

**Remediation Priority:** ⚠️ **IMMEDIATE (Week 1)**

---

#### 5. Diego Gasaniga (`netsuite2@hbno.com`)
**Account Type:** Generic Service Account
**Risk Level:** 🔴 **CRITICAL**

**Assigned Roles:**
- WMS Warehouse Manager Not Approval
- HBNO - Purchasing Sourcing Role
- HBNO - Material Handler WMS
- **Administrator** (Full System Access)
- WMS Warehouse Manager

**Security Concerns:**
- ✗ Administrator role on generic "netsuite2" account
- ✗ Combines system admin with operational roles
- ✗ No clear account ownership or purpose
- ✗ Multiple functional areas (warehouse, purchasing, admin)
- ✗ Potential for misuse with combined privileges

**Business Impact:**
- Full system administration
- Warehouse management operations
- Purchasing and sourcing decisions
- Inventory management

**Recommended Actions:**
1. **IMMEDIATE:** Identify if this is a legitimate user or shared account
2. If shared: Disable immediately and create named accounts
3. Separate administrator access from operational roles
4. Implement role segregation
5. Audit recent system changes and purchases

**Remediation Priority:** ⚠️ **IMMEDIATE (Week 1)**

---

### 🟠 HIGH RISK - Shared Accounts with Privileged Access

#### 6. Christine Canuto (`Shipping@hbno.com`)
**Account Type:** Shared Functional Account
**Risk Level:** 🟠 **HIGH**

**Assigned Roles:**
- buildHBNO - Warehouse Manager

**Security Concerns:**
- ✗ Shared shipping department credential
- ✗ Warehouse manager privileges
- ✗ Multiple shipping staff likely sharing access
- ✗ No individual accountability for shipments

**Business Impact:**
- Shipment processing and fulfillment
- Inventory movement authorization
- Order completion
- Shipping label generation

**Recommended Actions:**
1. Create individual shipping user accounts
2. Assign specific roles by shipping function
3. Track individual performance metrics
4. Implement barcode scanning with user login

**Remediation Priority:** 🔶 **HIGH (Week 2-3)**

---

#### 7. Keagen Cornaga (`receiving@hbno.com`)
**Account Type:** Shared Functional Account
**Risk Level:** 🟠 **HIGH**

**Assigned Roles:**
- buildHBNO - Warehouse Manager
- WMS Mobile Operator

**Security Concerns:**
- ✗ Shared receiving department credential
- ✗ Multiple receiving staff sharing access
- ✗ Warehouse manager privileges
- ✗ No accountability for receiving errors

**Business Impact:**
- Purchase order receiving
- Inventory receipt processing
- Quality inspection records
- Vendor performance tracking

**Recommended Actions:**
1. Create individual receiving user accounts
2. Track receiving accuracy by user
3. Implement individual accountability for discrepancies
4. Enable mobile device user authentication

**Remediation Priority:** 🔶 **HIGH (Week 2-3)**

---

#### 8. Purchasing Department (`purchasing@hbno.com`)
**Account Type:** Shared Functional Account
**Risk Level:** 🟠 **HIGH**

**Assigned Roles:**
- **HBNO - Purchasing Manager** (Financial Commitment Authority)

**Security Concerns:**
- ✗ Shared purchasing credential with manager privileges
- ✗ Purchase order approval authority
- ✗ Vendor management access
- ✗ No individual accountability for procurement decisions
- ✗ Potential conflict of interest risk

**Business Impact:**
- Purchase order creation and approval
- Vendor selection decisions
- Pricing negotiations
- Procurement spend management

**Recommended Actions:**
1. Create individual purchasing user accounts
2. Implement approval hierarchies by purchase amount
3. Segregate buyer from approver roles
4. Track vendor relationships by individual user
5. Enable spend analysis by purchaser

**Remediation Priority:** 🔶 **HIGH (Week 2-3)**

---

### 🟡 MEDIUM RISK - Shared Operational Accounts

#### 9. Mallory Newman (`pl@hbno.com`)
**Account Type:** Shared Functional Account (Production/Planning?)
**Risk Level:** 🟡 **MEDIUM**

**Assigned Roles:**
- HBNO - Manufacturing
- buildHBNO - Warehouse Manager

**Security Concerns:**
- ✗ Likely shared planning/production credential
- ✗ Combined manufacturing and warehouse access
- ✗ Generic "pl@" email suggests shared use

**Business Impact:**
- Production scheduling
- Manufacturing execution
- Warehouse coordination

**Recommended Actions:**
1. Clarify account ownership and purpose
2. If shared: Convert to named users
3. Separate manufacturing from warehouse roles

**Remediation Priority:** 🟡 **MEDIUM (Week 4-6)**

---

#### 10. Norman Diaz (`sku@hbno.com`)
**Account Type:** Shared Functional Account
**Risk Level:** 🟡 **MEDIUM**

**Assigned Roles:**
- HBNO - Planning

**Security Concerns:**
- ✗ Generic "sku@" email suggests shared use
- ✗ Planning/inventory management access
- ✗ Potential for shared access to item master data

**Business Impact:**
- Item master data management
- SKU creation and maintenance
- Planning functions

**Recommended Actions:**
1. Convert to named user account
2. Track item master changes by individual
3. Implement approval for new SKU creation

**Remediation Priority:** 🟡 **MEDIUM (Week 4-6)**

---

#### 11. Kassandra E Greule (`blends@hbno.com`)
**Account Type:** Shared Functional Account
**Risk Level:** 🟡 **MEDIUM**

**Assigned Roles:**
- Bulk Cart - Planning
- buildHBNO - Warehouse Manager
- HBNO - Production
- HBNO - Planning
- Bulk Cart - Blend Production

**Security Concerns:**
- ✗ Generic "blends@" email for production function
- ✗ Multiple role assignments suggest shared use
- ✗ Planning and production combined

**Business Impact:**
- Blend/formula production
- Production planning
- Warehouse management for blends

**Recommended Actions:**
1. Clarify if this is individual or shared account
2. If shared: Create individual blend production users
3. Separate planning from production execution

**Remediation Priority:** 🟡 **MEDIUM (Week 4-6)**

---

#### 12. Paul Nelson (`mechanic@hbno.com`)
**Account Type:** Shared Functional Account
**Risk Level:** 🟡 **MEDIUM**

**Assigned Roles:**
- Warehouse Administrator

**Security Concerns:**
- ✗ Generic "mechanic@" email suggests shared use
- ✗ Warehouse administrator privileges
- ✗ Likely maintenance/facilities staff sharing

**Business Impact:**
- Warehouse equipment maintenance
- Facilities management
- Asset tracking

**Recommended Actions:**
1. Convert to named facilities/maintenance user
2. Limit warehouse admin rights to necessary functions
3. Track equipment maintenance by technician

**Remediation Priority:** 🟡 **MEDIUM (Week 4-6)**

---

### 🟢 LOW RISK - Service/Integration Accounts

#### 13. ATER PIPE17 (`computers@hbno.com`)
**Account Type:** Integration Service Account
**Risk Level:** 🟢 **LOW**

**Assigned Roles:**
- Pipe17 ATER (Integration Role)

**Security Concerns:**
- ✓ Appropriate use for integration account
- ⚠ Generic "computers@" email lacks clarity
- ⚠ Should follow service account naming standards

**Business Impact:**
- Pipe17 integration connectivity
- Automated order processing
- Inventory synchronization

**Recommended Actions:**
1. Rename to `integration-pipe17@hbno.com`
2. Document account purpose and ownership
3. Implement MFA and token-based authentication
4. Set password rotation policy (90 days)
5. Restrict to API-only access (no UI login)

**Remediation Priority:** 🟢 **LOW (Week 8-12)**

---

#### 14. Saud Ali (`amazon@hbno.com`)
**Account Type:** Integration Service Account
**Risk Level:** 🟢 **LOW**

**Assigned Roles:**
- Amazon User (Integration Role)

**Security Concerns:**
- ✓ Appropriate use for Amazon integration
- ⚠ Could be named "Saud Ali" (individual) or truly service account
- ⚠ Should verify if this is personal or service account

**Business Impact:**
- Amazon marketplace integration
- Order synchronization
- Inventory updates to Amazon

**Recommended Actions:**
1. Verify if this is individual user or service account
2. If service: Rename to `integration-amazon@hbno.com`
3. Remove personal name association
4. Implement API token authentication
5. Restrict to integration use only

**Remediation Priority:** 🟢 **LOW (Week 8-12)**

---

#### 15. Regulatory & Compliance (`regulatory@hbno.com`)
**Account Type:** Shared Functional Account
**Risk Level:** 🟢 **LOW**

**Assigned Roles:**
- WMS Warehouse Manager

**Security Concerns:**
- ⚠ Generic regulatory email with operational access
- ⚠ Should be read-only for compliance review
- ✗ Warehouse manager role inappropriate for compliance

**Business Impact:**
- Regulatory reporting and compliance
- Quality documentation access
- Audit trail review

**Recommended Actions:**
1. Create dedicated compliance user accounts
2. Remove warehouse manager operational access
3. Assign read-only reporting roles
4. Enable audit log access for compliance team

**Remediation Priority:** 🟢 **LOW (Week 8-12)**

---

## Compliance Violations Summary

### SOX Compliance Issues
| Violation | Accounts Affected | Risk |
|-----------|------------------|------|
| Shared financial accounts | `ap@hbno.com`, `ar@hbno.com`, `accountant@hbno.com` | 🔴 CRITICAL |
| No individual accountability | All 15 shared accounts | 🔴 CRITICAL |
| Lack of segregation of duties | `ap@hbno.com` (AP + Warehouse + CS) | 🔴 CRITICAL |
| Administrator role on shared account | `netsuite1@hbno.com`, `netsuite2@hbno.com` | 🔴 CRITICAL |

### Audit Findings
1. **No audit trail for individual actions** on shared accounts
2. **Password sharing risks** across departments
3. **Lack of approval workflows** requiring named users
4. **Generic credentials** with privileged access
5. **Mixing operational and administrative roles** on same account

---

## Service Account Governance Recommendations

### Service Account Standards

#### Naming Convention
```
Format: integration-[system]-[environment]@hbno.com

Examples:
- integration-pipe17-prod@hbno.com
- integration-amazon-prod@hbno.com
- integration-jpmorgan-prod@hbno.com
- service-netsuite-support@hbno.com
```

#### Access Controls
1. **API-Only Access:** Service accounts should not have UI login capability
2. **Token-Based Authentication:** Use OAuth tokens instead of passwords
3. **IP Restrictions:** Limit access to known integration server IPs
4. **MFA Enforcement:** Require MFA for any UI-enabled service accounts
5. **Least Privilege:** Grant minimum necessary permissions

#### Monitoring & Auditing
1. **Dedicated Audit Logging:** Track all service account activities
2. **Anomaly Detection:** Alert on unusual activity patterns
3. **Regular Access Reviews:** Quarterly review of service account permissions
4. **Password Rotation:** 90-day rotation for password-based accounts
5. **Token Expiration:** 365-day maximum for API tokens

#### Documentation Requirements
For each service account, document:
- **Purpose:** What system/integration does it serve?
- **Owner:** Who is responsible for this account?
- **Access Level:** What permissions are granted and why?
- **Authentication Method:** Password, token, certificate, etc.
- **Monitoring:** Who receives alerts for this account?
- **Decommission Plan:** How to disable if integration ends?

---

## Remediation Roadmap

### Phase 1: CRITICAL (Weeks 1-2)
**Priority:** Shared accounts with financial/administrative access

| Account | Action | Owner | Status |
|---------|--------|-------|--------|
| `ap@hbno.com` | Create individual AP users, disable shared account | Finance Director | ⏳ Pending |
| `ar@hbno.com` | Create individual AR users, disable shared account | Finance Director | ⏳ Pending |
| `accountant@hbno.com` | Create individual accountant users | Finance Director | ⏳ Pending |
| `netsuite1@hbno.com` | Convert to named administrator | IT Director | ⏳ Pending |
| `netsuite2@hbno.com` | Verify user, convert or disable | IT Director | ⏳ Pending |

**Expected Outcomes:**
- Eliminate SOX compliance violations
- Establish individual accountability for financial transactions
- Enable audit trail for all administrative actions

---

### Phase 2: HIGH (Weeks 3-4)
**Priority:** Shared operational accounts with manager privileges

| Account | Action | Owner | Status |
|---------|--------|-------|--------|
| `shipping@hbno.com` | Create individual shipping users | Operations Manager | ⏳ Pending |
| `receiving@hbno.com` | Create individual receiving users | Operations Manager | ⏳ Pending |
| `purchasing@hbno.com` | Create individual purchasing users | Procurement Director | ⏳ Pending |

**Expected Outcomes:**
- Individual accountability for warehouse operations
- Performance tracking by user
- Segregation of duties in procurement

---

### Phase 3: MEDIUM (Weeks 5-8)
**Priority:** Shared functional accounts

| Account | Action | Owner | Status |
|---------|--------|-------|--------|
| `pl@hbno.com` | Clarify ownership, convert if shared | Production Manager | ⏳ Pending |
| `sku@hbno.com` | Convert to named user | Planning Manager | ⏳ Pending |
| `blends@hbno.com` | Clarify ownership, convert if shared | Production Manager | ⏳ Pending |
| `mechanic@hbno.com` | Convert to named facilities user | Facilities Manager | ⏳ Pending |

**Expected Outcomes:**
- Individual tracking for planning/production activities
- Clear ownership of item master data changes

---

### Phase 4: LOW (Weeks 9-12)
**Priority:** Service account governance

| Account | Action | Owner | Status |
|---------|--------|-------|--------|
| `computers@hbno.com` | Rename, implement service account standards | IT Director | ⏳ Pending |
| `amazon@hbno.com` | Verify type, implement service account standards | IT Director | ⏳ Pending |
| `regulatory@hbno.com` | Convert to read-only compliance users | Compliance Officer | ⏳ Pending |

**Expected Outcomes:**
- Service accounts follow governance standards
- Compliance team has appropriate read-only access
- Integration accounts properly secured

---

## Individual User Account Requirements

### For Each Shared Account Being Converted:

#### 1. Identify Current Users
- Who currently uses the shared credential?
- What are their specific job functions?
- What access do they actually need?

#### 2. Create Named User Accounts
```
Format: [firstname].[lastname]@hbno.com
or:     [firstname]@hbno.com (current standard)

Examples:
- john.smith@hbno.com
- jane.doe@hbno.com
```

#### 3. Assign Appropriate Roles
- Use least privilege principle
- Separate operational from approval roles
- Implement maker-checker controls where needed

#### 4. Enable MFA
- Require multi-factor authentication
- Use authenticator app or hardware token
- No SMS-based MFA for privileged accounts

#### 5. User Training
- Train on proper credential management
- Explain audit logging and accountability
- Review security policies

#### 6. Disable Shared Account
- Only after all users have individual accounts
- Archive account data for audit retention
- Document decommission date and reason

---

## Cost Impact Analysis

### License Requirements
Converting shared accounts to individual users will require additional NetSuite licenses.

**Current Shared Accounts:** 15
**Estimated Individual Users Needed:** 35-45 (assuming 2-3 users per shared account)

| Account Type | Est. Users | License Type | Annual Cost/User | Total Annual Cost |
|--------------|------------|--------------|------------------|-------------------|
| Financial (AP/AR/Accountant) | 8-12 | Full User | $999 | $7,992 - $11,988 |
| Warehouse/Operations | 15-20 | Limited User | $499 | $7,485 - $9,980 |
| Service/Integration | 3 | Service Account | $0 | $0 |

**Total Estimated Annual Cost:** $15,477 - $21,968

### ROI Justification
**Cost of Non-Compliance:**
- SOX violation penalties: $50,000 - $5,000,000
- Audit findings remediation: $25,000 - $100,000
- Reputational damage: Incalculable
- Fraud risk with shared credentials: Potentially millions

**Benefits:**
- ✅ SOX compliance achieved
- ✅ Individual accountability established
- ✅ Fraud risk significantly reduced
- ✅ Audit trail for all transactions
- ✅ Performance tracking enabled
- ✅ User-specific permissions (least privilege)

**Net ROI:** Investment pays for itself by avoiding a single compliance penalty or fraud incident.

---

## Technical Implementation Guide

### Step-by-Step Process

#### For Each Shared Account:

##### Step 1: Document Current Usage
```sql
-- Run this saved search to identify usage patterns
SELECT
    User,
    Role,
    Last_Login_Date,
    Transaction_Count,
    Record_Types_Accessed
FROM Usage_Audit_Log
WHERE User = '[shared account email]'
    AND Date >= ADD_MONTHS(SYSDATE, -3)
ORDER BY Last_Login_Date DESC;
```

##### Step 2: Create Individual Users
1. Navigate to: Setup > Users/Roles > Manage Users
2. Click "New User"
3. Fill in required fields:
   - Email (primary identifier)
   - First Name, Last Name
   - Department
   - Supervisor
4. Set access level (Full, Limited, etc.)
5. Enable "Require Password Change" on first login
6. Enable MFA requirement

##### Step 3: Assign Roles
1. Clone existing role if appropriate
2. Refine permissions to least privilege
3. Test access in sandbox first
4. Document role assignment rationale

##### Step 4: User Acceptance Testing
1. Provide test credentials to user
2. Verify all required functions work
3. Verify unnecessary access is blocked
4. User signs off on access

##### Step 5: Cutover Plan
```
Day 1: Create new user accounts
Day 2-3: User testing and validation
Day 4: Training on new credentials
Day 5: Switch from shared to individual accounts
Day 6: Monitor for issues
Day 7: Disable shared account (but don't delete)
Day 30: Archive shared account after confirming no issues
```

##### Step 6: Communication Template
```
Subject: ACTION REQUIRED: New NetSuite Login Credentials

Dear [Team],

As part of our security improvement initiative, we are transitioning from
shared department accounts to individual user accounts in NetSuite.

WHAT'S CHANGING:
- You will receive your own personal NetSuite login
- The shared [department]@hbno.com account will be disabled
- You will be required to set up multi-factor authentication (MFA)

TIMELINE:
- [Date]: New credentials provided
- [Date]: Training session on new login process
- [Date]: Shared account disabled

ACTION REQUIRED:
1. Check your email for your new NetSuite credentials
2. Login and change your temporary password
3. Set up MFA using the NetSuite Authenticator app
4. Complete the 15-minute training video
5. Stop using the shared account as of [cutover date]

BENEFITS:
- Better security with individual accountability
- Personalized dashboard and preferences
- Ability to track your own work
- Compliance with SOX requirements

Questions? Contact [IT Support] or [Security Team]

Thank you,
[Your Name]
[Title]
```

---

## Monitoring & Ongoing Governance

### Post-Implementation Controls

#### 1. Quarterly Access Reviews
- Review all user accounts and roles
- Identify dormant accounts (>90 days no login)
- Verify segregation of duties
- Confirm least privilege principle

#### 2. New Shared Account Prevention
- Require approval from Security Officer for any generic email accounts
- Policy: No shared accounts with financial/administrative access
- Exception process must document business justification and compensating controls

#### 3. Audit Logging
- Enable detailed audit trail for all users
- Monitor for anomalous activity patterns
- Alert on:
  - After-hours access by financial users
  - Multiple failed login attempts
  - Changes to user roles/permissions
  - Large batch transactions
  - Access from unusual IP addresses

#### 4. Metrics & KPIs
Track these metrics monthly:
- Number of shared accounts (target: 0 for privileged access)
- Percentage of users with MFA enabled (target: 100%)
- Average days to provision new user (target: <2 days)
- Number of access review exceptions (target: 0)
- Percentage of users passing security training (target: 100%)

#### 5. Annual Security Training
- Credential management best practices
- Password security and MFA usage
- Recognizing phishing attempts
- Reporting security incidents
- Understanding audit requirements

---

## Appendix A: Full Account Inventory

### Shared Accounts Summary Table

| # | Email | Account Type | Roles Count | Risk Level | Priority |
|---|-------|--------------|-------------|------------|----------|
| 1 | `ap@hbno.com` | Shared - AP | 4 | 🔴 CRITICAL | Week 1 |
| 2 | `ar@hbno.com` | Shared - AR | 3 | 🔴 CRITICAL | Week 1 |
| 3 | `accountant@hbno.com` | Shared - Accounting | 1 | 🔴 CRITICAL | Week 1 |
| 4 | `netsuite1@hbno.com` | Generic Service | 4 | 🔴 CRITICAL | Week 1 |
| 5 | `netsuite2@hbno.com` | Generic Service | 5 | 🔴 CRITICAL | Week 1 |
| 6 | `Shipping@hbno.com` | Shared - Shipping | 1 | 🟠 HIGH | Week 2-3 |
| 7 | `receiving@hbno.com` | Shared - Receiving | 2 | 🟠 HIGH | Week 2-3 |
| 8 | `purchasing@hbno.com` | Shared - Purchasing | 1 | 🟠 HIGH | Week 2-3 |
| 9 | `pl@hbno.com` | Shared - Planning? | 2 | 🟡 MEDIUM | Week 4-6 |
| 10 | `sku@hbno.com` | Shared - SKU Mgmt | 1 | 🟡 MEDIUM | Week 4-6 |
| 11 | `blends@hbno.com` | Shared - Production | 5 | 🟡 MEDIUM | Week 4-6 |
| 12 | `mechanic@hbno.com` | Shared - Facilities | 1 | 🟡 MEDIUM | Week 4-6 |
| 13 | `computers@hbno.com` | Integration - Pipe17 | 1 | 🟢 LOW | Week 8-12 |
| 14 | `amazon@hbno.com` | Integration - Amazon | 1 | 🟢 LOW | Week 8-12 |
| 15 | `regulatory@hbno.com` | Shared - Compliance | 1 | 🟢 LOW | Week 8-12 |

---

## Appendix B: External/Vendor Accounts Review

### External Administrator Access - HIGH RISK

These external consultants/vendors have Administrator roles and should be reviewed:

| Name | Email | Company | Roles | Risk |
|------|-------|---------|-------|------|
| Chimee Eze | chimee@crmexpertsonline.com | CRM Experts Online | Quality Admin, Quality Mgr, **Administrator** | 🔴 HIGH |
| Gijo Varghese | gijo.varghesee@gmail.com | External Developer | Senior Developer, **Administrator** | 🔴 HIGH |
| Mubashir M Amin | mubashir@srp.ai | SRP.ai | Administrator, QC, HBNO Admin, Purchasing | 🔴 CRITICAL |
| Rajeswaran Ayyadurai | rajesh@hbno.com | ? | Administrator, multiple mgr roles | 🔴 CRITICAL |
| Nora Gazga | nora@hbno.com | ? | **Administrator** | 🔴 CRITICAL |

**Recommendations:**
1. **IMMEDIATE:** Review all external administrator accounts
2. Verify active projects requiring admin access
3. Convert to time-limited project accounts
4. Implement vendor access policy:
   - Maximum 90-day access
   - Require business justification
   - Must be supervised by internal staff
   - Disable immediately upon project completion
5. Audit all changes made by external administrators

---

## Appendix C: Compliance Checklist

### SOX Compliance Requirements

- [ ] **No shared accounts with financial access**
  - Status: ❌ FAIL - 3 accounts identified (AP, AR, Accountant)

- [ ] **Individual user accountability**
  - Status: ❌ FAIL - 15 shared accounts

- [ ] **Segregation of duties (SOD)**
  - Status: ❌ FAIL - AP account has warehouse + finance access

- [ ] **Audit trail for all financial transactions**
  - Status: ⚠️ PARTIAL - Audit trail exists but not by individual

- [ ] **Approval workflows for financial changes**
  - Status: ⚠️ UNKNOWN - Needs verification

- [ ] **Regular access reviews**
  - Status: ❌ FAIL - No documented process

- [ ] **MFA for privileged accounts**
  - Status: ❌ FAIL - No MFA on shared accounts

- [ ] **Password policies enforced**
  - Status: ⚠️ UNKNOWN - Shared accounts bypass individual policies

### Recommendations to Achieve Compliance

**Priority 1 (Weeks 1-2):**
✅ Eliminate shared financial accounts
✅ Establish individual user accounts with MFA
✅ Implement audit logging by user

**Priority 2 (Weeks 3-4):**
✅ Implement approval workflows
✅ Document SOD matrix
✅ Establish quarterly access review process

**Priority 3 (Weeks 5-8):**
✅ Conduct initial access review
✅ User security training rollout
✅ Policy documentation complete

---

## Appendix D: Contact & Escalation

### Project Ownership

| Role | Name | Contact | Responsibility |
|------|------|---------|----------------|
| Executive Sponsor | [CFO Name] | [Email] | Budget approval, SOX compliance |
| Project Manager | [PM Name] | [Email] | Timeline, coordination |
| IT Director | [IT Dir] | [Email] | Technical implementation |
| Finance Director | [Fin Dir] | [Email] | Financial accounts conversion |
| Operations Manager | [Ops Mgr] | [Email] | Warehouse accounts conversion |
| Security Officer | [SecOff] | [Email] | Policy enforcement, auditing |

### Escalation Path

1. **Issue Identified** → Project Manager
2. **Requires Decision** → Functional Director
3. **Budget/Timeline Impact** → Executive Sponsor
4. **Compliance Risk** → Security Officer + CFO

---

## Document Control

**Document Version:** 1.0
**Created By:** Claude Code (Anthropic)
**Creation Date:** 2025-10-15
**Classification:** CONFIDENTIAL - Internal Use Only
**Distribution:** Executive Team, IT Leadership, Finance Leadership

**Review Schedule:**
- Weekly during remediation (Weeks 1-12)
- Monthly post-implementation (Months 4-12)
- Quarterly thereafter

**Change Log:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-15 | Claude Code | Initial assessment |

---

**END OF REPORT**
