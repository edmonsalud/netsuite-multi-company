# HBNO Shared & Generic Accounts Security Assessment

**Date:** 2025-10-15
**Prepared By:** Claude Code - NetSuite Security Analysis
**Company:** HBNO
**Assessment Type:** Shared Account & SOX Compliance Review

---

## Executive Summary

**CRITICAL FINDINGS:**
- **7 shared/generic accounts identified** - 5 CRITICAL, 2 MEDIUM risk
- **5 accounts are SOX violations** requiring immediate remediation
- **Complete loss of audit trail** for financial transactions processed through shared accounts
- **Generic admin accounts with user management authority** create security and compliance risks

### Risk Breakdown
| Risk Level | Count | Account Types |
|------------|-------|---------------|
| CRITICAL | 5 | Financial shared accounts (3), Generic admin accounts (2) |
| HIGH | 2 | Operational shared accounts |
| MEDIUM | 2 | Integration accounts (acceptable if API-only) |

### Business Impact
- **Financial Audit Exposure:** Cannot identify who processed payments, deposits, or accounting transactions
- **Regulatory Compliance:** SOX violations for shared financial accounts without individual accountability
- **Security Risks:** Generic admin accounts with user management permissions create potential for unauthorized access
- **Operational Risk:** Inability to trace who created purchase orders or performed compliance activities

---

## Critical Findings - Immediate Action Required

### 1. AP Accounts Payable (ap@hbno.com) - CRITICAL
**Risk Level:** P0 - IMMEDIATE
**SOX Violation:** YES
**Roles:** 4 different roles including Accountant and Warehouse Manager

**Issues:**
- Multiple users sharing single account for Accounts Payable
- Complete loss of audit trail - cannot identify who created/approved payments
- Mixed role assignments (warehouse + accounting) suggest improper access control
- J.P. Morgan integration role on shared account

**Impact:**
- Cannot determine who approved vendor payments
- Unable to investigate payment discrepancies
- Audit trail completely broken for AP transactions
- SOX compliance failure

**Recommendation:** IMMEDIATE DEACTIVATION
**Remediation Time:** 2-3 days

---

### 2. AR Accounts Receivable (ar@hbno.com) - CRITICAL
**Risk Level:** P0 - IMMEDIATE
**SOX Violation:** YES
**Global Permissions:** Customer Payment - Full, Customer Deposit - Full

**Issues:**
- Shared account with authority to process customer payments and deposits
- 3 different roles assigned (Customer Service, Accountant)
- Complete loss of audit trail for cash handling

**Impact:**
- Cannot identify who processed customer payments
- Unable to detect potential theft or fraud in cash receipts
- Customer deposit reconciliation impossible without individual accountability
- Major SOX compliance violation

**Recommendation:** IMMEDIATE DEACTIVATION
**Remediation Time:** 2-3 days

---

### 3. AP Accountant (accountant@hbno.com) - CRITICAL
**Risk Level:** P0 - IMMEDIATE
**SOX Violation:** YES
**Role:** HBNO - Accountant

**Issues:**
- Generic email address suggests multiple users
- Likely used for journal entries, reconciliations, and month-end close
- No way to identify who made financial adjustments

**Impact:**
- Cannot trace who posted journal entries
- Unable to validate who performed account reconciliations
- Financial reporting integrity compromised
- Audit trail completely broken

**Recommendation:** IMMEDIATE DEACTIVATION
**Remediation Time:** 2-3 days

---

### 4. Eduardo NS (netsuite1@hbno.com) - CRITICAL
**Risk Level:** P0 - IMMEDIATE
**SOX Violation:** YES
**Global Permissions:** Manage Users - Full, Bulk Manage Roles - Full

**Issues:**
- Generic naming suggests shared or consultant account
- Full user management authority - can create/modify users and roles
- Also has Administrator and Amazon User roles
- Cannot identify who made user/role changes

**Impact:**
- Critical security risk - unknown who has system administration access
- Cannot audit user creation, role assignments, or permission changes
- Potential for unauthorized access creation
- If consultant account, should use consultant's work email, not @hbno.com

**Recommendation:** INVESTIGATE IMMEDIATELY
**Questions to Answer:**
1. Is "Eduardo NS" a real employee or generic account?
2. If real person, why generic email (netsuite1)?
3. If consultant, why using @hbno.com domain?
4. Who has access to this account?

**Remediation Time:** 1-2 days investigation + 2-3 days remediation

---

### 5. Diego Gasaniga (netsuite2@hbno.com) - CRITICAL
**Risk Level:** P0 - IMMEDIATE
**SOX Violation:** YES
**Roles:** Administrator, WMS Warehouse Manager, Purchasing Sourcing Role, Material Handler WMS

**Issues:**
- Generic naming pattern (netsuite2) suggests shared account
- Administrator role combined with operational roles = Segregation of Duties violation
- Single account spanning warehouse, purchasing, and system administration
- No way to identify who performed which actions

**Impact:**
- Critical SOD violation - admin should not have operational roles
- Cannot distinguish between administrative actions and operational transactions
- Potential for fraud - admin can modify records and cover tracks
- Audit trail compromised across multiple business functions

**Recommendation:** INVESTIGATE IMMEDIATELY
**Questions to Answer:**
1. Is "Diego Gasaniga" a real employee or generic account?
2. If real, why does admin account have warehouse/purchasing roles?
3. Who has access to this account?

**Remediation Time:** 1-2 days investigation + 3-4 days remediation

---

## High Priority Findings - Action Required This Quarter

### 6. Purchasing Department (purchasing@hbno.com) - HIGH
**Risk Level:** P1 - HIGH
**SOX Violation:** YES
**Role:** HBNO - Purchasing Manager

**Issues:**
- Departmental shared account
- Cannot identify who created/approved purchase orders
- No individual accountability for procurement decisions

**Impact:**
- Cannot trace who approved vendor purchases
- Unable to enforce purchase order approval limits by individual
- Procurement audit trail compromised
- Difficult to detect maverick spending

**Recommendation:** REPLACE with individual accounts + approval workflow
**Remediation Time:** 3-4 days

---

### 7. Regulatory a Compliance (regulatory@hbno.com) - HIGH
**Risk Level:** P1 - HIGH
**SOX Violation:** POSSIBLE
**Role:** WMS Warehouse Manager (likely incorrect)

**Issues:**
- Compliance account should not have warehouse operations role
- Cannot identify who performed regulatory submissions
- Shared account for compliance activities

**Impact:**
- Regulatory filings cannot be attributed to individual
- Potential compliance audit issues
- Role assignment appears incorrect (compliance staff should not manage warehouse)

**Recommendation:** REPLACE with individual accounts + dedicated compliance role
**Remediation Time:** 3-4 days

---

## Medium Priority - Verification Required

### 8. ATER PIPE17 (computers@hbno.com) - MEDIUM
**Risk Level:** P3 - MEDIUM
**SOX Violation:** NO (if API-only)
**Role:** Pipe17 ATER

**Status:** ACCEPTABLE - Integration account
**Conditions:**
- Must be API-only (Web Services access, no UI login)
- Should have IP whitelisting enabled
- Monitoring/alerting should be active

**Action Required:** Verification (1-2 hours)
1. Confirm API-only access
2. Verify IP whitelisting
3. Enable monitoring
4. Document integration purpose

---

### 9. Saud Ali (amazon@hbno.com) - MEDIUM
**Risk Level:** P3 - MEDIUM
**SOX Violation:** NO (if API-only)
**Role:** Amazon User

**Status:** NEEDS INVESTIGATION
**Questions:**
1. Is "Saud Ali" a real person or generic name?
2. Is this API-only or does someone log in via UI?
3. Why does "Eduardo NS" (netsuite1@hbno.com) also have "Amazon User" role? Duplicate integration?

**Action Required:** Investigation + Verification (1-2 hours)
1. Determine if real person or integration account
2. If real person at HBNO, create dedicated integration account
3. Verify API-only access
4. Resolve duplication with netsuite1@hbno.com

---

## Remediation Roadmap

### Phase 1: Emergency Response (Week 1)
**Priority:** P0 - IMMEDIATE
**Timeline:** 5-7 business days

#### Financial Shared Accounts
1. **AP Accounts Payable (ap@hbno.com)**
   - Interview AP manager to identify all users
   - Create individual accounts (use existing Priya AP as model)
   - Migrate permissions to individuals
   - Review last 90 days of transactions
   - Deactivate ap@hbno.com
   - Create email distribution for communications

2. **AR Accounts Receivable (ar@hbno.com)**
   - Interview AR manager to identify all users
   - Create individual accounts
   - Assign Customer Payment/Deposit permissions individually
   - Implement segregation: recording vs. reconciliation
   - Review last 90 days of transactions
   - Deactivate ar@hbno.com
   - Create email distribution for communications

3. **AP Accountant (accountant@hbno.com)**
   - Identify all users
   - Create individual accountant accounts
   - Implement dual authorization for JEs over $10,000
   - Review all JEs/reconciliations made via account
   - Deactivate accountant@hbno.com
   - Update accounting procedures

#### Generic Admin Accounts
4. **Eduardo NS (netsuite1@hbno.com)**
   - URGENT: Determine if real person or shared account
   - If shared: Document all user/role changes made
   - Review 180-day audit log
   - Create individual admin accounts
   - Remove user management from generic accounts
   - Enable MFA on all admin accounts
   - Implement dual authorization for user/role changes

5. **Diego Gasaniga (netsuite2@hbno.com)**
   - URGENT: Determine if real person or shared account
   - Review 180-day audit log for SOD violations
   - Separate admin/warehouse/purchasing functions
   - Create individual accounts for each function
   - Enable MFA on all admin accounts
   - Review all transactions for SOD issues

### Phase 2: Operational Accounts (Week 2-3)
**Priority:** P1 - HIGH
**Timeline:** 6-8 business days

6. **Purchasing Department (purchasing@hbno.com)**
   - Identify all buyers (Lean Villasis exists at purchasing4@hbno.com)
   - Create individual buyer accounts
   - Implement PO approval workflow:
     - Under $5,000: Buyer
     - $5,000-$25,000: Manager
     - Over $25,000: Director
   - Review 90 days of POs
   - Deactivate purchasing@hbno.com
   - Create distribution list for vendors

7. **Regulatory a Compliance (regulatory@hbno.com)**
   - Identify compliance officers
   - Create individual compliance accounts
   - Create dedicated compliance role (remove warehouse access)
   - Review 180 days of compliance activities
   - Implement activity logging
   - Deactivate regulatory@hbno.com
   - Create distribution for regulatory communications

### Phase 3: Integration Account Verification (Week 4)
**Priority:** P3 - MEDIUM
**Timeline:** 2-4 hours

8. **ATER PIPE17 (computers@hbno.com)**
   - Verify API-only access (no UI login)
   - Confirm IP whitelisting
   - Enable monitoring/alerting
   - Document integration
   - Monthly log review process

9. **Saud Ali (amazon@hbno.com)**
   - Determine if real person or integration
   - Verify API-only if integration
   - Resolve duplication with netsuite1@hbno.com
   - Enable monitoring
   - Monthly log review process

---

## Governance Framework - Prevent Future Issues

### Policy: Shared Account Prevention
**Effective Date:** Immediate

#### Prohibited
❌ Shared accounts for financial transactions
❌ Generic admin accounts (admin@, netsuite1@, netsuite2@)
❌ Departmental accounts for individual work (purchasing@, accounting@)
❌ Integration accounts with UI login capability

#### Permitted
✅ Integration accounts (API-only, no UI login)
✅ Distribution lists for email communication (not NetSuite logins)
✅ Service accounts with documented justification and monitoring

#### Requirements for All Accounts
1. **Real Names Only:** FirstName.LastName@hbno.com or FirstName@hbno.com
2. **Individual Accountability:** One person per account
3. **MFA Required:** All accounts with financial or admin access
4. **Annual Review:** Recertify all account access annually
5. **Termination Process:** Deactivate within 24 hours of employee departure

### Quarterly Access Review Process
**Owner:** IT Security / Internal Audit

#### Review Checklist (Run Quarterly)
- [ ] All active users have real first/last names in NetSuite
- [ ] All active users have personal email addresses (not generic)
- [ ] No shared accounts with financial permissions
- [ ] No admin accounts with operational roles (SOD check)
- [ ] All integration accounts are API-only (verify last UI login = Never)
- [ ] All users with financial access have MFA enabled
- [ ] All users with admin access have MFA enabled
- [ ] Terminated employees deactivated in NetSuite
- [ ] Contractor accounts use contractor's work email

### User Provisioning Standards

#### New Employee Account Creation
```
Email Format: firstname.lastname@hbno.com (or firstname@hbno.com if unique)
Example: priya.kumar@hbno.com (not priya@hbno.com, not ap@hbno.com)

Required Fields:
- First Name: [Legal First Name]
- Last Name: [Legal Last Name]
- Email: [Personal work email]
- Title: [Job Title]
- Department: [Department]
- Supervisor: [Direct Manager]
- MFA: ENABLED (if financial or admin access)
```

#### Contractor/Consultant Account Creation
```
Email Format: firstname.lastname@consultingfirm.com (NOT @hbno.com)
Example: eduardo.santos@consultingfirm.com (not netsuite1@hbno.com)

Required Fields:
- First Name: [Legal First Name]
- Last Name: [Legal Last Name]
- Email: [Consultant's work email at their firm]
- Title: [Consultant - Area of Work]
- Company: [Consulting Firm Name]
- Contract End Date: [Date]
- MFA: ENABLED (mandatory for all contractors)

Restrictions:
- Contractors MUST NOT use @hbno.com email addresses
- Accounts auto-deactivate on contract end date
- Weekly review of active contractor accounts
```

#### Integration Account Creation
```
Email Format: integration.[system]@hbno.com
Example: integration.pipe17@hbno.com, integration.amazon@hbno.com

Required Configuration:
- Web Services Only Role (no UI login permissions)
- Last UI Login: Never (verify monthly)
- IP Whitelist: [Documented vendor IPs only]
- Password: 25+ characters, stored in password vault
- Owner: [Business process owner]
- Documentation: Purpose, scope, IP addresses, contact info

Restrictions:
- MUST be API-only (Web Services Access Only checkbox enabled)
- MUST have IP whitelisting
- MUST have monitoring/alerting enabled
- Monthly log review required
```

---

## Monitoring & Detection

### Automated Alerts (Implement These)
1. **Shared Account Detection**
   - Alert if email pattern matches generic patterns (ap@, ar@, admin@, netsuite[0-9]@)
   - Alert if account name contains "Department", "Team", "Shared"

2. **Generic Admin Detection**
   - Alert if Administrator role assigned to account with generic email
   - Alert if "Manage Users" permission assigned to non-individual account

3. **Integration Account Misuse**
   - Alert if API-only account has UI login
   - Alert if integration account accessed outside whitelisted IPs
   - Alert if integration account used outside business hours

4. **SOD Violations**
   - Alert if Administrator role combined with operational roles (warehouse, purchasing, accounting)
   - Alert if single account has conflicting financial permissions (AP + AR, Create JE + Approve JE)

### Monthly Security Review Report
**Run on 1st of each month**

```sql
-- Shared Account Audit Query (Saved Search)
SELECT
    Employee.Name,
    Employee.Email,
    Employee.Roles,
    Employee.GlobalPermissions,
    Employee.LastLogin
FROM Employee
WHERE
    Email LIKE '%ap@%' OR
    Email LIKE '%ar@%' OR
    Email LIKE '%admin@%' OR
    Email LIKE '%netsuite%@%' OR
    Email LIKE '%purchasing@%' OR
    Email LIKE '%accounting@%' OR
    Email LIKE '%department@%' OR
    Name NOT LIKE '% %'  -- No space = no last name = generic
ORDER BY Email
```

---

## Audit Documentation

### Evidence Preservation
Before deactivating any shared account, collect:
1. **User List:** Interview managers to document all individuals who had access
2. **Transaction History:** Export all transactions for last 180 days
3. **Login History:** Export login audit trail
4. **Role History:** Document all role assignments
5. **Permission History:** Document all permission grants

### Audit Trail Reconstruction
For financial accounts (ap@, ar@, accountant@):
1. Export all transactions by date
2. Interview users to reconstruct who worked which dates
3. Document gaps in audit trail for external auditors
4. Implement compensating controls:
   - Supervisor review of all transactions
   - Sample testing of transactions for authorization
   - Enhanced month-end reconciliation

---

## Communication Plan

### Stakeholders to Notify

#### Immediate (Week 1)
- **CFO/Controller:** SOX violations and audit impact
- **External Auditors:** Inform of shared account issues and remediation plan
- **IT Security:** Coordinate account deactivation timeline
- **AP Manager:** Coordinate AP account remediation
- **AR Manager:** Coordinate AR account remediation
- **Accounting Manager:** Coordinate accountant account remediation

#### Week 2
- **Purchasing Manager:** Coordinate purchasing account remediation
- **Compliance Officer:** Coordinate regulatory account remediation
- **All affected users:** Training on new individual accounts

### User Communication Template

**Subject:** ACTION REQUIRED: Transition from Shared Account to Individual Account

**Body:**
```
Dear [Team],

As part of our compliance with SOX requirements and NetSuite security best practices,
we are eliminating shared accounts and transitioning to individual user accounts.

WHAT'S CHANGING:
- Shared account [account@hbno.com] will be deactivated on [DATE]
- You will receive a new individual account: [firstname.lastname@hbno.com]
- Your new account will have the same access and permissions

WHY THIS CHANGE:
- Compliance: SOX regulations require individual accountability for financial transactions
- Security: Individual accounts are more secure and easier to monitor
- Audit Trail: We need to know who performed each action in NetSuite

ACTION REQUIRED:
1. Check your email for new account credentials
2. Log in with your new account by [DATE]
3. Enable Multi-Factor Authentication (instructions attached)
4. Complete brief training on new login process

TIMELINE:
- [DATE]: New accounts created and credentials sent
- [DATE]: Training session (optional)
- [DATE]: Shared account deactivated

If you have questions, contact [IT Support Contact].

Thank you for your cooperation.

[Name]
[Title]
```

---

## Success Metrics

### Compliance Metrics (Track Monthly)
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Shared financial accounts | 0 | 3 | 🔴 FAIL |
| Generic admin accounts | 0 | 2 | 🔴 FAIL |
| Accounts with MFA (admin/financial) | 100% | Unknown | 🔴 UNKNOWN |
| Integration accounts with UI login | 0 | Unknown | 🟡 VERIFY |
| SOD violations (admin + operational) | 0 | 1+ | 🔴 FAIL |
| Accounts without real names | 0 | 7 | 🔴 FAIL |

### Remediation Progress Tracker
| Account | Risk | Target Date | Status | Owner | Notes |
|---------|------|-------------|--------|-------|-------|
| ap@hbno.com | CRITICAL | [Week 1] | 🔴 Not Started | CFO/AP Manager | 3 roles, 4 users estimated |
| ar@hbno.com | CRITICAL | [Week 1] | 🔴 Not Started | CFO/AR Manager | Payment authority, 2-3 users |
| accountant@hbno.com | CRITICAL | [Week 1] | 🔴 Not Started | Controller | JE authority, 2 users |
| netsuite1@hbno.com | CRITICAL | [Week 1] | 🔴 Not Started | IT Security | User management authority |
| netsuite2@hbno.com | CRITICAL | [Week 1] | 🔴 Not Started | IT Security | SOD violation |
| purchasing@hbno.com | HIGH | [Week 2] | 🔴 Not Started | Purchasing Manager | PO approval workflow needed |
| regulatory@hbno.com | HIGH | [Week 2-3] | 🔴 Not Started | Compliance Officer | Wrong role assigned |
| computers@hbno.com | MEDIUM | [Week 4] | 🔴 Not Started | IT | Verify API-only |
| amazon@hbno.com | MEDIUM | [Week 4] | 🔴 Not Started | IT | Investigate + verify |

---

## Conclusion

HBNO has **7 shared/generic accounts** that create significant security and compliance risks:

### Critical Issues (P0 - Immediate)
- **5 accounts** are direct SOX violations requiring immediate remediation
- **Complete loss of audit trail** for financial transactions (AP, AR, accounting)
- **Generic admin accounts** with user management authority create security risks
- **Segregation of Duties violations** where admin accounts have operational roles

### Estimated Effort
- **Phase 1 (Critical):** 5-7 business days, multiple stakeholders
- **Phase 2 (High Priority):** 6-8 business days
- **Phase 3 (Verification):** 2-4 hours
- **Total:** 3-4 weeks for complete remediation

### Business Risk
- **Audit Failure:** External auditors will flag these as material weaknesses
- **Regulatory Exposure:** SOX violations could result in penalties
- **Fraud Risk:** Shared accounts make fraud detection nearly impossible
- **Operational Impact:** Inability to troubleshoot issues or identify root causes

### Immediate Next Steps
1. **Today:** Brief CFO and Controller on findings
2. **This Week:** Contact external auditors to discuss remediation plan
3. **Week 1:** Begin Phase 1 remediation (5 critical accounts)
4. **Week 2-3:** Complete Phase 2 (operational accounts)
5. **Week 4:** Verify integration accounts
6. **Ongoing:** Implement monitoring and quarterly reviews

---

**Assessment Complete**
**Prepared by:** Claude Code - NetSuite Security Expert
**Date:** 2025-10-15
**Next Review:** 2025-11-15 (30 days post-remediation)
