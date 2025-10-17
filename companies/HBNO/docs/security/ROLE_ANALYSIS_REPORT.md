# HBNO NetSuite User & Role Assignment - Statistical Analysis Report

**Generated:** 2025-10-15
**Data Source:** HBNO Users and Roles.csv
**Analysis Type:** Statistical Analysis of Role Assignment Patterns

---

## Executive Summary

### Key Findings Dashboard

| Metric | Value |
|--------|-------|
| **Total Users** | 89 unique users |
| **Total Role Assignments** | 215 total assignments |
| **Unique Roles** | 51 distinct roles |
| **Average Roles per User** | 2.42 roles |
| **Users with Single Role** | 43 (48.3%) |
| **Users with Multiple Roles** | 46 (51.7%) |
| **Max Roles (Single User)** | 18 roles (David Bertini) |
| **Generic/Shared Accounts** | 12 accounts |
| **External/Vendor Accounts** | 6 accounts |

### Critical Issues Identified

- **Super-User Risk:** David Bertini has 18 roles (excessive access)
- **Shared Account Risk:** 12 generic emails (info@, ap@, ar@, etc.)
- **External Access:** 6 external consultant/vendor accounts with Administrator access
- **Role Sprawl:** 51 distinct roles across 89 users suggests potential consolidation opportunity

---

## 1. Role Usage Statistics

### Top 10 Most Assigned Roles

| Rank | Role Name | Assignments | % of Total | User Count |
|------|-----------|-------------|------------|------------|
| 1 | **buildHBNO - Warehouse Manager** | 24 | 11.16% | 24 users |
| 2 | **HBNO - QC** | 19 | 8.84% | 19 users |
| 3 | **HBNO - Material Handler** | 13 | 6.05% | 13 users |
| 4 | **Administrator** | 13 | 6.05% | 13 users |
| 5 | **HBNO - Customer Service Restricted all subs** | 10 | 4.65% | 10 users |
| 6 | **HBNO - Accountant** | 8 | 3.72% | 8 users |
| 7 | **HBNO - Production** | 8 | 3.72% | 8 users |
| 8 | **Quality Engineer** | 8 | 3.72% | 8 users |
| 9 | **HBNO - Quality Manager** | 7 | 3.26% | 7 users |
| 10 | **WMS Warehouse Manager** | 7 | 3.26% | 7 users |

**Key Insights:**
- Warehouse and QC roles dominate (35 assignments combined)
- Material handling and warehouse operations are heavily represented
- Administrator role assigned to 13 users (potential security concern)

### Bottom 10 Least Assigned Roles

| Rank | Role Name | Assignments | Notes |
|------|-----------|-------------|-------|
| 1 | **NETSTOCK Integration Role** | 1 | External integration account |
| 1 | **NETSTOCK Consultant Role** | 1 | External integration account |
| 1 | **Senior Developer - REVISIONS REQUIRED** | 1 | Incomplete/pending role |
| 1 | **Netsuite Development Team** | 1 | Development access |
| 1 | **Pipe17 ATER** | 1 | External integration |
| 1 | **Vendor Center** | 1 | Vendor portal access |
| 1 | **Warehouse Administrator** | 1 | Limited use |
| 1 | **Warehouse Inventory Manager** | 1 | Potentially duplicate of HBNO version |
| 1 | **Custom WMS Warehouse Manager** | 1 | Custom role variation |
| 1 | **LOT_SN_CustomRole** | 1 | Specialized custom role |

**Additional Roles with Only 1 Assignment:**
- Amazon User (3 users)
- HBNO - AP Specialist (1 user)
- HBNO - Ship Central Manager (3 users)
- Bulk Cart - Blend Production (1 user)
- Employee Center (2 users)
- J.P. Morgan Minimal Role (2 users)
- Mfg Mobile - Production Manager (1 user)
- Mobile - Administrator (3 users)
- NetSuite Support Center (Basic) (2 users)
- NetSuite Support Center (5 users)
- Packing Administrator (1 user)
- Purchase Administrator (1 user)
- Ship Central Mobile Operator (1 user)
- Ship Central Packing Operator (1 user)
- WMS Outbound Manager (1 user)
- WMS Web Services Admin (1 user)

### Roles Assigned to Only 1 User

**Total: 16 roles** assigned to a single user each

| Role Name | Assigned To | Department |
|-----------|-------------|------------|
| Senior Developer - REVISIONS REQUIRED | Gijo Varghese | IT/Development |
| Netsuite Development Team | Janne Gambican | IT/Development |
| Pipe17 ATER | ATER PIPE17 | Integration |
| Vendor Center | 454 Katyani Exports | Vendor |
| NETSTOCK Integration Role | Rian | Integration |
| NETSTOCK Consultant Role | Rian | Integration |
| Warehouse Administrator | Paul Nelson | Warehouse |
| Custom WMS Warehouse Manager | Luis A Robles Valencia | Warehouse |
| LOT_SN_CustomRole | David Bertini | Administration |
| HBNO - AP Specialist | Priya AP | Accounting |
| Bulk Cart - Blend Production | Kassandra E Greule | Production |
| Mfg Mobile - Production Manager | David Bertini | Manufacturing |
| Packing Administrator | David Bertini | Warehouse |
| Purchase Administrator | David Bertini | Purchasing |
| WMS Outbound Manager | David Bertini | Warehouse |
| WMS Web Services Admin | David Bertini | IT/Integration |

**Consolidation Opportunity:** Many of these single-assignment roles are assigned to David Bertini (super-user), suggesting role consolidation potential.

---

## 2. User Statistics Analysis

### User Distribution by Role Count

| Role Count | Number of Users | % of Total | User Type |
|------------|-----------------|------------|-----------|
| **1 role** | 43 | 48.3% | Single-function users |
| **2 roles** | 22 | 24.7% | Cross-functional users |
| **3 roles** | 10 | 11.2% | Multi-function users |
| **4 roles** | 5 | 5.6% | Senior/supervisory users |
| **5 roles** | 4 | 4.5% | Management users |
| **6-8 roles** | 4 | 4.5% | Senior management |
| **9-18 roles** | 1 | 1.1% | Super-user (security risk) |

### Power Users (4+ Roles)

| User Name | Email | Role Count | Primary Function |
|-----------|-------|------------|-----------------|
| **David Bertini** | david@hbno.com | **18 roles** | Operations Director/Administrator |
| Jose G De Los Santos-Chavez | josedls@hbno.com | 13 roles | Manufacturing/Admin/QC |
| Avery Anderson | aanderson@hbno.com | 9 roles | Quality Manager/Admin |
| Mubashir M Amin | mubashir@srp.ai | 8 roles | External Consultant/Admin |
| Rajeswaran Ayyadurai | rajesh@hbno.com | 6 roles | IT/Operations Manager |
| Santhosh K Bejjenki | santhosh@hbno.com | 6 roles | Warehouse/Shipping Manager |
| Kassandra E Greule | blends@hbno.com | 5 roles | Planning/Production Manager |
| Luis A Robles Valencia | luis@hbno.com | 5 roles | Warehouse Manager/WMS |
| Diego Gasaniga | netsuite2@hbno.com | 5 roles | Admin/Purchasing/WMS |
| Josef Demangeat | josef@hbno.com | 5 roles | Admin/Customer Service |

**Security Concern:** Top 4 power users have Administrator role + extensive functional access.

---

## 3. Department/Function Analysis

### QC Team Analysis

| Metric | Value |
|--------|-------|
| **Total QC Role Assignments** | 19 |
| **QC-Only Users** | 11 users |
| **QC + Other Roles** | 8 users |
| **QC Management** | 7 users (Quality Manager role) |
| **QC Engineers** | 8 users (Quality Engineer role) |

**QC Team Members:**
1. Aida Garcia (QC only)
2. Ailyn Diaz Acosta (QC only)
3. Alejandra Garcia Cruz (QC only)
4. Alma E Rosales (QC only)
5. Antonio Razo (QC only)
6. Esperanza Rios Duran (QC only)
7. Hussam B'Dour (QC + Quality Manager + Quality Engineer)
8. Jeff Petersen (QC + Quality Manager)
9. Maria G Flores (QC + Quality Manager + Quality Engineer)
10. Miguel A Rodriguez (QC + Quality Manager + Quality Engineer)
11. Michelle Zazueta (QC only)
12. Nicole A Jay (QC + Quality Manager + Quality Engineer + Quality Admin)
13. Silvia Anguiano De Servin (QC only)
14. Youssef Bensghir (QC only)
15. Avery Anderson (QC + 8 other roles including Quality Manager)
16. Jose G De Los Santos-Chavez (QC + 12 other roles)
17. Kaysin L Pittman (QC only)
18. Mubashir M Amin (QC + 7 other roles)
19. Hussam B'Dour (QC + other roles)

### Warehouse Team Analysis

| Metric | Value |
|--------|-------|
| **buildHBNO - Warehouse Manager** | 24 users |
| **buildHBNO - Warehouse Lead** | 4 users |
| **Material Handler** | 13 users |
| **Material Handler WMS** | 6 users |
| **WMS Warehouse Manager** | 7 users |
| **Total Warehouse Personnel** | ~35 unique users |

**Key Warehouse Roles:**
- Warehouse Managers: 24 assignments
- Material Handlers: 13 base + 6 WMS = 19 total
- Warehouse Leads: 4 users
- WMS Mobile Operators: 5 users

### Customer Service Team Analysis

| Metric | Value |
|--------|-------|
| **HBNO - Customer Service Restricted all subs** | 10 users |
| **HBNO - Customer Service Specialist** | 3 users |
| **Bulk Cart - Customer Service** | 3 users |
| **Total CS Personnel** | ~12 unique users |

**Customer Service Team Members:**
1. Accounts Receivable (ar@hbno.com) - CS Restricted + CS Specialist
2. AP Accounts Payable (ap@hbno.com) - CS Restricted
3. Consuelo Dimas - CS Specialist
4. Jeanarie Dacuro (cs1@hbno.com) - CS Restricted
5. Josef Demangeat - CS Restricted + Bulk Cart CS
6. Krishna Bejjenki - CS Restricted + Bulk Cart CS
7. Mikka Bautista - CS Restricted + CS Specialist
8. MJ Bautista - CS Restricted
9. Mubashir M Amin - Bulk Cart CS
10. Stephanie Flores - CS Restricted
11. Jose G De Los Santos-Chavez - CS Restricted

### Manufacturing Team Analysis

| Metric | Value |
|--------|-------|
| **HBNO - Manufacturing** | 6 users |
| **HBNO - Production** | 8 users |
| **Total Manufacturing Personnel** | ~12 unique users |

**Manufacturing Team:**
1. Avery Anderson (Manufacturing)
2. Cecilia Jimenez (Manufacturing)
3. Janna J McClaskey (Manufacturing)
4. Jose G De Los Santos-Chavez (Manufacturing)
5. Mallory Newman (Manufacturing)

**Production Team:**
1. Antonio Maldonado Farias
2. Jessica M Suarez
3. Kassandra E Greule
4. Monica Ruiz
5. Nadia G Chacon Hernandez
6. Naomi Robles
7. Selena Villalobos

### Administrative/Management Users

| Role Type | Count |
|-----------|-------|
| **Administrator** | 13 users |
| **HBNO - Administrator** | 5 users |
| **Total Admin Access** | 15 unique users |

**Users with Administrator Access:**
1. Avery Anderson (HBNO Admin)
2. Chimee Eze (Administrator)
3. David Bertini (HBNO Admin)
4. Diego Gasaniga (Administrator)
5. Eduardo NS (HBNO Admin)
6. Gijo Varghese (Administrator)
7. Jose G De Los Santos-Chavez (Administrator + HBNO Admin)
8. Josef Demangeat (Administrator)
9. Kirupa Krishna Kumar (Administrator)
10. Mahesh Pragada (Administrator + Mobile Admin)
11. Mubashir M Amin (Administrator + HBNO Admin)
12. Nora Gazga (Administrator)
13. Prashant Chandra (Administrator)
14. Rajeswaran Ayyadurai (Administrator)
15. Rian (HBNO Admin)
16. Ryan F (Administrator + Mobile Admin)
17. Ryan Fielding (Administrator)
18. Vikram Kumar (Administrator)

**Security Risk:** 18 users with Administrator-level access (20% of total users)

### Accounting/Finance Team

| Metric | Value |
|--------|-------|
| **HBNO - Accountant** | 8 users |
| **HBNO - AP Specialist** | 1 user |
| **Total Accounting Personnel** | 8 unique users |

**Accounting Team:**
1. Accounts Receivable (ar@hbno.com)
2. AP Accountant (accountant@hbno.com)
3. AP Accounts Payable (ap@hbno.com)
4. Jeff Restivo (external accountant)
5. Kirupa Krishna Kumar
6. Priya AP
7. Rajeswaran Ayyadurai
8. Sruthi Lakshmi

---

## 4. Anomaly Detection & Security Concerns

### Generic/Shared Account Emails (HIGH RISK)

| Account Name | Email | Roles Assigned | Risk Level |
|--------------|-------|----------------|------------|
| **Accounts Receivable** | ar@hbno.com | 3 roles | CRITICAL |
| **AP Accounts Payable** | ap@hbno.com | 4 roles | CRITICAL |
| **AP Accountant** | accountant@hbno.com | 1 role | HIGH |
| **Purchasing Department** | purchasing@hbno.com | 1 role | HIGH |
| **Christine Canuto** | Shipping@hbno.com | 1 role | MEDIUM |
| **Eltiwanda Ramirez** | shipping1@hbno.com | 1 role | MEDIUM |
| **Vanessa Balawon** | Shipping2@hbno.com | 1 role | MEDIUM |
| **Keagen Cornaga** | receiving@hbno.com | 2 roles | HIGH |
| **Mallory Newman** | pl@hbno.com | 2 roles | MEDIUM |
| **Jeanarie Dacuro** | cs1@hbno.com | 1 role | MEDIUM |
| **Editha Pangilinan** | planner1@hbno.com | 1 role | MEDIUM |
| **Mario Flores** | materialhandling1@hbno.com | 2 roles | MEDIUM |
| **Lean Villasis** | purchasing4@hbno.com | 1 role | MEDIUM |
| **Regulatory a Compliance** | regulatory@hbno.com | 1 role | MEDIUM |
| **Norman Diaz** | sku@hbno.com | 1 role | MEDIUM |
| **Kassandra E Greule** | blends@hbno.com | 5 roles | HIGH |
| **Paul Nelson** | mechanic@hbno.com | 1 role | LOW |
| **Youssef Bensghir** | qa@hbno.com | 1 role | MEDIUM |
| **Saud Ali** | amazon@hbno.com | 1 role | MEDIUM |

**Recommendation:** Replace all generic/functional emails with individual user accounts. Shared credentials prevent proper audit trails.

### External/Vendor Accounts

| User Name | Email Domain | Roles | Risk Level |
|-----------|--------------|-------|------------|
| **Chimee Eze** | @crmexpertsonline.com | 3 roles (Admin, Quality Admin, Quality Manager) | CRITICAL |
| **Mubashir M Amin** | @srp.ai | 8 roles (Administrator + 7 others) | CRITICAL |
| **Gijo Varghese** | @gmail.com | 2 roles (Administrator + Senior Developer) | CRITICAL |
| **Jhon Smith** | @gmail.com | 1 role (Administrator) | CRITICAL |
| **Jeff Restivo** | @walpoleadvisors.com | 1 role (Accountant) | MEDIUM |
| **Rian** | @netstock.co | 3 roles (Admin + Integration) | HIGH |
| **Mahesh Pragada** | @oracle.com | 2 roles (Administrator) | HIGH |
| **Ryan F** | @oracle.com | 2 roles (Administrator) | HIGH |
| **Ryan Fielding** | @NetSuite.com | 1 role (Administrator) | HIGH |
| **Prashant Chandra** | @netsuite.com | 1 role (Administrator) | HIGH |
| **Vikram Kumar** | @oracle.com | 1 role (Administrator) | HIGH |

**Recommendation:**
- External consultants should have time-limited access
- Remove Administrator access when projects complete
- Use role-based access, not Administrator for vendors
- Implement periodic access reviews (quarterly)

### Test/Demo Accounts

| User Name | Email | Role | Status |
|-----------|-------|------|--------|
| **Jhon Smith** | testhbno@gmail.com | Administrator | DELETE - Test account in production |

**Recommendation:** IMMEDIATELY disable test account with Administrator access.

### Integration/Service Accounts

| Account Name | Email | Roles | Purpose |
|--------------|-------|-------|---------|
| **ATER PIPE17** | computers@hbno.com | Pipe17 ATER | Integration |
| **Rian** | rian@netstock.co | 3 roles | NETSTOCK integration |
| **454 Katyani Exports** | info@katyaniexport.com | Vendor Center | Vendor portal |

**Recommendation:** Clearly label integration accounts with prefix (INT_, SVC_, etc.)

### Duplicate/Inconsistent Names

| User Name | Email | Notes |
|-----------|-------|-------|
| Eduardo NS | netsuite1@hbno.com | Generic name - likely service account |
| Diego Gasaniga | netsuite2@hbno.com | Generic email - should be personal |
| Accounts Receivable | ar@hbno.com | Department, not person |
| AP Accounts Payable | ap@hbno.com | Department, not person |
| Purchasing Department | purchasing@hbno.com | Department, not person |

### Suspicious/Incomplete Role Names

| Role Name | Issue | Recommendation |
|-----------|-------|----------------|
| **Senior Developer - REVISIONS REQUIRED** | Incomplete/pending role | Complete or remove |
| **Custom WMS Warehouse Manager** | Non-standard naming | Standardize as "HBNO - WMS Warehouse Manager" |
| **LOT_SN_CustomRole** | Unclear purpose | Rename with clear description |

---

## 5. Role Standardization Opportunities

### Role Naming Inconsistencies

#### Warehouse Roles (Consolidation Needed)
- buildHBNO - Warehouse Manager (24 users)
- WMS Warehouse Manager (7 users)
- Custom WMS Warehouse Manager (1 user)
- WMS Warehouse Manager Not Approval (1 user)
- HBNO - Warehouse Inventory Manager (3 users)
- HBNO - Warehouse Inventory Manager with Inv Adj (2 users)

**Recommendation:** Consolidate to 2-3 standardized roles:
- HBNO - Warehouse Manager (general warehouse management)
- HBNO - WMS Warehouse Manager (WMS-specific)
- HBNO - Warehouse Lead (supervisory role)

#### Material Handler Roles (Consolidation Needed)
- HBNO - Material Handler (13 users)
- HBNO - Material Handler WMS (6 users)

**Recommendation:** Clarify distinction or merge based on WMS usage patterns.

#### Quality Roles (Well Structured) ✓
- HBNO - QC (19 users) - Base level
- HBNO - Quality Manager (7 users) - Management
- HBNO-Quality Engineer (1 user)
- Quality Engineer (8 users)
- Quality Administrator (4 users)

**Recommendation:** Standardize "Quality Engineer" naming (remove HBNO prefix inconsistency)

#### Administrator Roles (Consolidation Needed)
- Administrator (13 users)
- HBNO - Administrator (5 users)

**Recommendation:** Standardize to "HBNO - Administrator" for all internal admin users.

#### Customer Service Roles
- HBNO - Customer Service Restricted all subs (10 users)
- HBNO - Customer Service Specialist (3 users)
- Bulk Cart - Customer Service (3 users)

**Recommendation:** Clear hierarchy is good, but rename "Restricted all subs" to clearer name like "HBNO - Customer Service (Multi-Subsidiary)"

---

## 6. Compliance & Audit Findings

### SOX Compliance Concerns

| Issue | Risk Level | Users Affected | Remediation |
|-------|------------|----------------|-------------|
| Shared accounting credentials | CRITICAL | 3 accounts | Create individual user accounts |
| Excessive admin access | HIGH | 18 users | Reduce to 3-5 admins only |
| External admin access | HIGH | 7 vendors | Remove admin, use specific roles |
| No role expiration visible | MEDIUM | All users | Implement periodic access reviews |
| Test account in production | CRITICAL | 1 account | Delete immediately |

### Segregation of Duties Issues

| User | Conflicting Roles | Risk |
|------|------------------|------|
| **David Bertini** | Purchasing + Warehouse + Quality + Admin (18 roles) | Can approve own purchases, receive, and verify quality |
| **Jose G De Los Santos-Chavez** | Manufacturing + QC + Admin + Warehouse (13 roles) | Can create, approve, and verify own work |
| **Accounts Receivable (ar@hbno.com)** | CS Specialist + Accountant | Can create orders and process payments |
| **AP Accounts Payable (ap@hbno.com)** | Accountant + Warehouse Manager | Can approve invoices and receive goods |

**Recommendation:** Implement role separation matrix and restrict cross-functional access.

---

## 7. Statistical Analysis Summary

### Role Distribution Pattern

```
Role Assignment Distribution (Text-Based Chart)

0-1 assignments:  ████████████████████████████ 28 roles (54.9%)
2-3 assignments:  ██████████ 10 roles (19.6%)
4-5 assignments:  ████ 4 roles (7.8%)
6-8 assignments:  ████ 4 roles (7.8%)
9-10 assignments: ██ 2 roles (3.9%)
11-19 assignments: ██ 2 roles (3.9%)
20-24 assignments: █ 1 role (2.0%)
```

**Pattern:** Long-tail distribution - few roles heavily used, many roles rarely used

### User Role Assignment Pattern

```
User Role Count Distribution (Text-Based Chart)

1 role:    ████████████████████████████████████████████ 43 users (48.3%)
2 roles:   ██████████████████████ 22 users (24.7%)
3 roles:   ██████████ 10 users (11.2%)
4 roles:   █████ 5 users (5.6%)
5 roles:   ████ 4 users (4.5%)
6-8 roles: ████ 4 users (4.5%)
9+ roles:  █ 1 user (1.1%)
```

**Pattern:** Most users single-purpose, small group with extensive access

### Department Size Comparison

```
Department Headcount (Text-Based Chart)

Warehouse:        ████████████████████████████████████ 35 users
QC:               ███████████████████ 19 users
Manufacturing:    ████████████ 12 users
Customer Service: ████████████ 12 users
Accounting:       ████████ 8 users
Administration:   ███████████████ 15 users
IT/Development:   ████ 4 users
```

---

## 8. Recommendations

### Immediate Actions (Within 1 Week)

1. **CRITICAL: Delete test account**
   - User: Jhon Smith (testhbno@gmail.com)
   - Role: Administrator
   - Risk: Test account with production admin access

2. **CRITICAL: Review external admin access**
   - Remove Administrator role from 7 external consultant accounts
   - Replace with specific functional roles only
   - Document business justification for any retained external access

3. **HIGH: Address shared credential accounts**
   - Create individual accounts for:
     - ar@hbno.com (Accounts Receivable)
     - ap@hbno.com (Accounts Payable)
     - accountant@hbno.com (AP Accountant)
   - Maintain audit trail with individual accountability

4. **HIGH: Review David Bertini's 18 roles**
   - Excessive access creates SOD risk
   - Reduce to 3-5 essential roles
   - Document business justification for each role retained

### Short-Term Actions (Within 1 Month)

5. **Role Consolidation Project**
   - Standardize warehouse role naming (7 variations → 3 standard roles)
   - Consolidate Administrator roles (2 variations → 1 standard)
   - Document role hierarchy and access levels

6. **Administrator Access Reduction**
   - Reduce from 18 users to 3-5 core administrators
   - Create "HBNO - Power User" role for users needing elevated (but not admin) access
   - Implement least-privilege principle

7. **Generic Email Remediation**
   - Replace 19 functional/generic emails with individual user accounts
   - Update naming convention: FirstName.LastName@hbno.com

8. **External Access Review**
   - Implement quarterly access reviews for all external consultants
   - Add expiration dates to consultant accounts
   - Remove access for completed projects (verify: Chimee Eze, Gijo Varghese)

### Medium-Term Actions (Within 3 Months)

9. **Role Standardization**
   - Create role naming standard: "HBNO - [Function] [Level]"
   - Example: HBNO - Warehouse Manager, HBNO - Warehouse Associate
   - Migrate all users to standardized roles

10. **Segregation of Duties Matrix**
    - Define incompatible role combinations
    - Flag users with SOD conflicts
    - Implement quarterly SOD reviews

11. **Access Certification Program**
    - Quarterly manager certification of direct report access
    - Semi-annual admin access review
    - Annual comprehensive access audit

12. **Role Documentation**
    - Document business justification for each role
    - Define approval requirements for role assignments
    - Create role assignment workflow

### Long-Term Actions (Within 6 Months)

13. **Role Optimization**
    - Eliminate 16 single-user roles (consolidate or justify)
    - Target: Reduce from 51 roles to 25-30 standard roles
    - Create role catalog with clear descriptions

14. **Integration Account Management**
    - Prefix all integration accounts: "INT_" or "SVC_"
    - Separate service accounts from user accounts
    - Implement service account review process

15. **Compliance Framework**
    - Document role assignment policy
    - Implement role-based access control (RBAC) formally
    - Create audit trail for all role changes
    - Prepare for SOX/compliance audit

---

## 9. Key Performance Indicators (KPIs)

### Current State vs. Target State

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Total Roles | 51 | 25-30 | -21 to -26 roles |
| Admin Access Users | 18 (20%) | 3-5 (3-6%) | -13 to -15 users |
| Generic/Shared Accounts | 19 | 0 | -19 accounts |
| Single-User Roles | 16 | 5 | -11 roles |
| External Admin Access | 7 | 0 | -7 users |
| Avg Roles/User | 2.42 | 1.8-2.0 | -0.42 to -0.62 |
| Users with SOD Conflicts | 4+ | 0 | -4+ users |

### Role Optimization Potential

| Category | Current Roles | Optimized Roles | Consolidation % |
|----------|--------------|-----------------|-----------------|
| Warehouse | 7 variations | 3 standard | 57% reduction |
| Quality | 5 variations | 3 standard | 40% reduction |
| Administrator | 2 variations | 1 standard | 50% reduction |
| Material Handler | 2 variations | 1 standard | 50% reduction |
| Customer Service | 3 variations | 2 standard | 33% reduction |

**Overall Optimization Potential:** 40-45% role reduction possible

---

## 10. Risk Heat Map

### Access Risk Assessment

| User Category | Risk Level | User Count | Mitigation Priority |
|--------------|------------|------------|---------------------|
| Super-Users (9+ roles) | CRITICAL | 1 | IMMEDIATE |
| External Admins | CRITICAL | 7 | IMMEDIATE |
| Shared Accounts | CRITICAL | 19 | IMMEDIATE |
| Test Accounts | CRITICAL | 1 | IMMEDIATE |
| Power Users (4-8 roles) | HIGH | 13 | HIGH |
| Multi-role Users (2-3 roles) | MEDIUM | 32 | MEDIUM |
| Single Role Users | LOW | 43 | LOW |

### Compliance Risk Matrix

| Risk Area | Impact | Likelihood | Overall Risk | Action |
|-----------|--------|------------|--------------|--------|
| SOX Compliance | HIGH | HIGH | CRITICAL | Immediate remediation |
| Audit Failure | HIGH | MEDIUM | HIGH | Address shared accounts |
| Data Breach | HIGH | MEDIUM | HIGH | Reduce admin access |
| Unauthorized Changes | MEDIUM | MEDIUM | MEDIUM | Implement SOD controls |
| Vendor Access Abuse | MEDIUM | LOW | MEDIUM | Quarterly vendor reviews |

---

## Appendix A: Complete Role Inventory

### All 51 Roles (Alphabetical)

1. Administrator (13 users)
2. Amazon User (3 users)
3. Bulk Cart - Blend Production (1 user)
4. Bulk Cart - Customer Service (3 users)
5. Bulk Cart - Planning (1 user)
6. buildHBNO - Warehouse Lead (4 users)
7. buildHBNO - Warehouse Manager (24 users)
8. Custom WMS Warehouse Manager (1 user)
9. Employee Center (2 users)
10. HBNO - Accountant (8 users)
11. HBNO - Administrator (5 users)
12. HBNO - AP Specialist (1 user)
13. HBNO - Customer Service Restricted all subs (10 users)
14. HBNO - Customer Service Specialist (3 users)
15. HBNO - Manufacturing (6 users)
16. HBNO - Material Handler (13 users)
17. HBNO - Material Handler WMS (6 users)
18. HBNO - Planning (5 users)
19. HBNO - Production (8 users)
20. HBNO - Project Management (2 users)
21. HBNO - Purchasing Manager (4 users)
22. HBNO - Purchasing Sourcing Role (1 user)
23. HBNO - QC (19 users)
24. HBNO - Quality Manager (7 users)
25. HBNO - Ship Central Manager (3 users)
26. HBNO - Warehouse Inventory Manager (3 users)
27. HBNO - Warehouse Inventory Manager with Inv Adj (2 users)
28. HBNO-Quality Engineer (1 user)
29. J.P. Morgan Minimal Role (2 users)
30. LOT_SN_CustomRole (1 user)
31. Mfg Mobile - Production Manager (1 user)
32. Mobile - Administrator (3 users)
33. NETSTOCK Consultant Role (1 user)
34. NETSTOCK Integration Role (1 user)
35. Netsuite Development Team (1 user)
36. NetSuite Support Center (5 users)
37. NetSuite Support Center (Basic) (2 users)
38. Packing Administrator (1 user)
39. Pipe17 ATER (1 user)
40. Purchase Administrator (1 user)
41. Quality Administrator (4 users)
42. Quality Engineer (8 users)
43. Quality Manager (2 users)
44. Senior Developer - REVISIONS REQUIRED (1 user)
45. Ship Central Mobile Operator (1 user)
46. Ship Central Packing Operator (1 user)
47. Vendor Center (1 user)
48. Warehouse Administrator (1 user)
49. Warehouse Inventory Manager (1 user)
50. WMS Mobile Operator (5 users)
51. WMS Outbound Manager (1 user)
52. WMS Warehouse Manager (7 users)
53. WMS Warehouse Manager Not Approval (1 user)
54. WMS Web Services Admin (1 user)

**Note:** Some roles appear with slight variations - consolidation opportunity identified.

---

## Appendix B: Complete User List by Role Count

### 9-18 Roles (Super-Users)
1. David Bertini - 18 roles

### 6-8 Roles (Power Users)
2. Jose G De Los Santos-Chavez - 13 roles
3. Avery Anderson - 9 roles
4. Mubashir M Amin - 8 roles
5. Rajeswaran Ayyadurai - 6 roles
6. Santhosh K Bejjenki - 6 roles

### 5 Roles
7. Diego Gasaniga - 5 roles
8. Eduardo NS - 4 roles (NetSuite Support + Admin + Amazon + 1)
9. Josef Demangeat - 5 roles
10. Kassandra E Greule - 5 roles
11. Luis A Robles Valencia - 5 roles

### 4 Roles
12. AP Accounts Payable - 4 roles
13. Chimee Eze - 3 roles (Quality Admin + Quality Manager + Admin)
14. Hussam B'Dour - 3 roles
15. Maria G Flores - 3 roles
16. Miguel A Rodriguez - 3 roles

### 3 Roles
17. Accounts Receivable - 3 roles
18. Kirupa Krishna Kumar - 2 roles
19. Mikka Bautista - 4 roles
20. Naomi Robles - 3 roles
21. Nicole A Jay - 4 roles
22. Priya AP - 4 roles
23. Rian - 3 roles

### 2 Roles
24-45. (22 users with 2 roles each)

### 1 Role
46-89. (43 users with single role)

---

## Document Information

**Report Generated:** 2025-10-15
**Data Source:** c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\HBNO\HBNO Users and Roles.csv
**Total Records Analyzed:** 215 role assignments
**Analysis Scope:** User-role assignments, department distribution, security anomalies
**Next Review Date:** 2025-11-15 (monthly recommended)

---

**END OF REPORT**
