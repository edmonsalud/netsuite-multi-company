# HBNO NetSuite External Vendor & Consultant Access Security Report

**Report Date:** October 15, 2025
**Analysis Scope:** User-Role Assignments (HBNO Users and Roles.csv)
**Risk Classification:** HIGH RISK - Multiple Administrator Access Points Identified

---

## Executive Summary

**CRITICAL FINDINGS:**
- **11 External Users** identified with NetSuite access
- **9 Users with Administrator roles** (6 external, 3 potentially external)
- **4 Integration vendors** with privileged access
- **3 Consultant accounts** with full administrative privileges
- **2 Test accounts** with Administrator access (HIGH RISK)

**Immediate Actions Required:**
1. Review and disable test accounts (testhbno@gmail.com)
2. Audit all Oracle/NetSuite consultant access
3. Implement time-limited access policies for external consultants
4. Review Netstock integration permissions
5. Validate all external Administrator assignments

---

## 1. External Vendor & Consultant Access - Complete Inventory

| # | Name | Email | Domain | Organization | Role(s) | Risk Level |
|---|------|-------|--------|--------------|---------|------------|
| 1 | **454 Katyani Exports** | info@katyaniexport.com | katyaniexport.com | India-based Vendor | Vendor Center | LOW |
| 2 | **Chimee Eze** | chimee@crmexpertsonline.com | crmexpertsonline.com | CRM Experts Online (Consultant) | Quality Administrator, Quality Manager, **Administrator** | **CRITICAL** |
| 3 | **Gijo Varghese** | gijo.varghesee@gmail.com | gmail.com | External Developer | Senior Developer, **Administrator** | **CRITICAL** |
| 4 | **Jeff Restivo** | jrestivo@walpoleadvisors.com | walpoleadvisors.com | Walpole Advisors (Accounting Firm) | HBNO - Accountant | MEDIUM |
| 5 | **Jhon Smith** | testhbno@gmail.com | gmail.com | TEST ACCOUNT | **Administrator** | **CRITICAL** |
| 6 | **Mahesh Pragada** | mahesh.babu.pragada@oracle.com | oracle.com | Oracle NetSuite Support | Mobile - Administrator, **Administrator** | HIGH |
| 7 | **Mubashir M Amin** | mubashir@srp.ai | srp.ai | SRP.AI (AI/Automation Consultant) | **Administrator**, HBNO - Administrator, Quality Administrator, HBNO - QC, HBNO - Project Management, HBNO - Purchasing Manager, Bulk Cart - Customer Service, NetSuite Support Center | **CRITICAL** |
| 8 | **Prashant Chandra** | pchandra@netsuite.com | netsuite.com | NetSuite Support | **Administrator** | HIGH |
| 9 | **Rian** | rian@netstock.co | netstock.co | Netstock (Inventory Planning Integration) | HBNO - Administrator, NETSTOCK Integration Role, NETSTOCK Consultant Role | **CRITICAL** |
| 10 | **Ryan F** | ryan.fielding@oracle.com | oracle.com | Oracle NetSuite Support | Mobile - Administrator, **Administrator** | HIGH |
| 11 | **Ryan Fielding** | Ryan.Fielding@NetSuite.com | netsuite.com | NetSuite Support | **Administrator** | HIGH |
| 12 | **Vikram Kumar** | soma.vikram.kumar@oracle.com | oracle.com | Oracle NetSuite Support | **Administrator** | HIGH |

---

## 2. Vendor Access Summary by Organization

### 2.1 Oracle/NetSuite Support Team (5 Accounts)
**Risk Level:** HIGH
**Total Administrator Roles:** 5

| User | Email | Roles | Business Justification |
|------|-------|-------|----------------------|
| Mahesh Pragada | mahesh.babu.pragada@oracle.com | Administrator, Mobile - Administrator | Mobile WMS implementation/support |
| Prashant Chandra | pchandra@netsuite.com | Administrator | Platform support |
| Ryan F | ryan.fielding@oracle.com | Administrator, Mobile - Administrator | Mobile WMS implementation/support |
| Ryan Fielding | Ryan.Fielding@NetSuite.com | Administrator | Platform support |
| Vikram Kumar | soma.vikram.kumar@oracle.com | Administrator | Platform support |

**Analysis:**
- Multiple Oracle consultants with full Administrator access
- Potential duplicate accounts (Ryan F vs Ryan Fielding - same person?)
- No evidence of time-limited access
- Access appears to be from Mobile WMS implementation project

**Recommendations:**
- Consolidate duplicate Ryan Fielding accounts
- Implement 90-day access review cycle
- Require Oracle to log support sessions
- Consider downgrading to Support Center roles when not actively working on projects

---

### 2.2 External Consultants (3 Accounts)
**Risk Level:** CRITICAL

#### A. CRM Experts Online
| Field | Value |
|-------|-------|
| **User** | Chimee Eze |
| **Email** | chimee@crmexpertsonline.com |
| **Roles** | Quality Administrator, Quality Manager, Administrator |
| **Risk** | **CRITICAL** |
| **Business Case** | Likely: Quality module customization/implementation |
| **Access Scope** | Full system access + Quality management |

**Security Concerns:**
- Administrator role grants unrestricted access
- Quality roles may be legacy from completed project
- No time limitation visible

---

#### B. SRP.AI (Automation Consultant)
| Field | Value |
|-------|-------|
| **User** | Mubashir M Amin |
| **Email** | mubashir@srp.ai |
| **Roles** | Administrator, HBNO - Administrator, Quality Administrator, HBNO - QC, HBNO - Project Management, HBNO - Purchasing Manager, Bulk Cart - Customer Service, NetSuite Support Center |
| **Risk** | **CRITICAL** |
| **Business Case** | Likely: AI-driven automation, process optimization, multi-module customization |
| **Access Scope** | Most privileged external account - 8 roles across all business functions |

**Security Concerns:**
- Excessive permissions across quality, purchasing, project management, and customer service
- AI company with broad system access raises data privacy concerns
- Administrator + HBNO Administrator = unrestricted access to all data
- No compartmentalization of duties

---

#### C. External Developer
| Field | Value |
|-------|-------|
| **User** | Gijo Varghese |
| **Email** | gijo.varghesee@gmail.com |
| **Roles** | Senior Developer - REVISIONS REQUIRED, Administrator |
| **Risk** | **CRITICAL** |
| **Business Case** | Likely: SuiteScript development, customizations |
| **Access Scope** | Full administrator + development privileges |

**Security Concerns:**
- Gmail account (non-corporate email) with Administrator access
- "REVISIONS REQUIRED" in role name suggests incomplete or problematic work
- No corporate accountability trail
- Potential abandoned account if project completed

---

### 2.3 Netstock (Inventory Planning Integration)
| Field | Value |
|-------|-------|
| **User** | Rian |
| **Email** | rian@netstock.co |
| **Roles** | HBNO - Administrator, NETSTOCK Integration Role, NETSTOCK Consultant Role |
| **Risk** | **CRITICAL** |
| **Business Case** | Netstock inventory optimization platform integration |
| **Access Scope** | Full administrator + integration privileges |

**Analysis:**
- Legitimate business integration (Netstock is a recognized NetSuite partner)
- Administrator role likely excessive for integration needs
- Should be scoped to integration-only permissions
- Potential for data export to third-party platform

**Recommendations:**
- Remove HBNO - Administrator role
- Limit to NETSTOCK Integration Role only
- Implement data sharing agreement
- Quarterly access review

---

### 2.4 Accounting Firm
| Field | Value |
|-------|-------|
| **User** | Jeff Restivo |
| **Email** | jrestivo@walpoleadvisors.com |
| **Organization** | Walpole Advisors |
| **Roles** | HBNO - Accountant |
| **Risk** | MEDIUM |
| **Business Case** | External CPA/accounting consulting services |
| **Access Scope** | Financial data access |

**Analysis:**
- Appropriate role assignment for external accountant
- Access appears properly scoped
- Common for companies to grant accountant access to external CPAs

**Recommendations:**
- Maintain current access
- Annual access review
- Ensure confidentiality agreement on file

---

### 2.5 Vendor Portal Access
| Field | Value |
|-------|-------|
| **User** | 454 Katyani Exports |
| **Email** | info@katyaniexport.com |
| **Roles** | Vendor Center |
| **Risk** | LOW |
| **Business Case** | India-based supplier vendor portal access |
| **Access Scope** | Limited to vendor self-service functions |

**Analysis:**
- Standard vendor portal access
- Properly scoped permissions
- No security concerns

---

### 2.6 TEST ACCOUNTS (HIGH RISK)
| Field | Value |
|-------|-------|
| **User** | Jhon Smith |
| **Email** | testhbno@gmail.com |
| **Roles** | Administrator |
| **Risk** | **CRITICAL** |
| **Business Case** | Testing/development account |
| **Access Scope** | Full system access |

**CRITICAL SECURITY ISSUE:**
- Test account with Administrator privileges in production environment
- Gmail address indicates non-corporate, potentially shared credentials
- Likely created for testing but never disabled
- No individual accountability (generic "Jhon Smith" name)
- Violates SOX compliance if financial data accessed

**IMMEDIATE ACTION REQUIRED:**
1. **DISABLE THIS ACCOUNT IMMEDIATELY**
2. Audit all activities performed under this account
3. Review SOX compliance impact
4. Implement policy: No test accounts in production with Administrator access

---

## 3. Integration Vendor Access

### Summary Table
| Vendor/Integration | User(s) | Access Type | Risk |
|-------------------|---------|-------------|------|
| Netstock | rian@netstock.co | Administrator + Integration | CRITICAL |
| Oracle Mobile WMS | 3 Oracle consultants | Administrator | HIGH |
| Amazon | amazon@hbno.com (internal) | Amazon User | LOW |
| J.P. Morgan | ap@hbno.com (internal) | J.P. Morgan Minimal Role | LOW |

**Analysis:**
- Netstock integration has excessive Administrator permissions
- Oracle Mobile WMS access appears project-based but no expiration visible
- Amazon and JP Morgan integrations using internal HBNO email accounts (appropriate)

---

## 4. High-Risk External Access Requiring Immediate Review

### Priority 1: DISABLE IMMEDIATELY
| User | Email | Issue |
|------|-------|-------|
| Jhon Smith | testhbno@gmail.com | Test account with Administrator access in production |

### Priority 2: REVIEW WITHIN 7 DAYS
| User | Email | Issue | Action Required |
|------|-------|-------|-----------------|
| Gijo Varghese | gijo.varghesee@gmail.com | External developer with Administrator + Gmail account | Verify if still active contractor; disable if project complete |
| Mubashir M Amin | mubashir@srp.ai | 8 roles across all business functions | Reduce to minimum necessary permissions |
| Chimee Eze | chimee@crmexpertsonline.com | Administrator + Quality roles | Verify if still active; reduce permissions |

### Priority 3: REVIEW WITHIN 30 DAYS
| User | Email | Issue | Action Required |
|------|-------|-------|-----------------|
| Rian | rian@netstock.co | Administrator role excessive for integration | Remove Administrator, keep integration role only |
| Mahesh Pragada | mahesh.babu.pragada@oracle.com | Oracle support with ongoing access | Confirm Mobile WMS project status; disable if complete |
| Ryan F / Ryan Fielding | ryan.fielding@oracle.com / Ryan.Fielding@NetSuite.com | Potential duplicate accounts | Consolidate to one account |
| Prashant Chandra | pchandra@netsuite.com | Oracle support Administrator | Confirm if still needed |
| Vikram Kumar | soma.vikram.kumar@oracle.com | Oracle support Administrator | Confirm if still needed |

---

## 5. Recommendations for Access Governance

### 5.1 Immediate Actions (Next 7 Days)
1. **Disable test account** (testhbno@gmail.com) immediately
2. **Audit high-risk accounts:**
   - Gijo Varghese (gijo.varghesee@gmail.com)
   - Mubashir M Amin (mubashir@srp.ai)
   - Chimee Eze (chimee@crmexpertsonline.com)
3. **Document business justification** for all external Administrator access
4. **Contact Oracle** to confirm necessity of 5 support accounts

### 5.2 Short-Term Improvements (30 Days)
1. **Implement time-limited access policy:**
   - All external consultant access expires after 90 days
   - Require formal renewal with business justification

2. **Principle of Least Privilege:**
   - Remove Administrator role from Netstock integration (rian@netstock.co)
   - Reduce Mubashir M Amin permissions to specific project needs
   - Scope Oracle support access to specific modules

3. **Consolidate duplicate accounts:**
   - Merge Ryan F / Ryan Fielding accounts

4. **Create external access tracking:**
   - Spreadsheet or system to track all external accounts
   - Review cycle: Quarterly
   - Owner: IT Security / NetSuite Administrator

### 5.3 Long-Term Governance (90 Days)
1. **Establish External Access Policy:**
   - All external users require signed agreement
   - Maximum 90-day access periods
   - Mandatory quarterly review
   - No Administrator roles without CISO approval
   - No personal email accounts (Gmail, etc.) allowed

2. **Implement Role-Based Access Control (RBAC):**
   - Create "External Consultant - Limited" role templates
   - Restrict Administrator role to internal employees only
   - Create project-specific roles that auto-expire

3. **Monitoring & Auditing:**
   - Enable login tracking for all external accounts
   - Alert on Administrator role usage by external accounts
   - Monthly access review reports to management

4. **Vendor Management Program:**
   - Centralized vendor access request process
   - IT Security approval required for all external access
   - Automatic deprovisioning upon project completion

5. **Compliance Requirements:**
   - Document external access for SOX compliance
   - Annual third-party risk assessments
   - Confidentiality and data protection agreements

---

## 6. Risk Assessment Summary

### By Risk Level
| Risk Level | Count | Percentage |
|------------|-------|------------|
| CRITICAL | 5 | 45% |
| HIGH | 5 | 45% |
| MEDIUM | 1 | 9% |
| LOW | 1 | 9% |
| **TOTAL** | **12** | **100%** |

### By Organization Type
| Type | Count | Administrator Roles |
|------|-------|-------------------|
| Oracle/NetSuite Support | 5 | 5 |
| External Consultants | 3 | 3 |
| Integration Vendors | 1 | 1 |
| Accounting Firms | 1 | 0 |
| Suppliers | 1 | 0 |
| Test Accounts | 1 | 1 |
| **TOTAL** | **12** | **10** |

### Key Metrics
- **External Administrator Access:** 10 accounts (83% of external users)
- **Non-corporate Email Accounts:** 2 (Gmail) - HIGH RISK
- **Consultant Accounts with Multiple Roles:** 1 (Mubashir M Amin - 8 roles)
- **Potential Duplicate Accounts:** 1 (Ryan Fielding)
- **Test Accounts in Production:** 1 - CRITICAL ISSUE

---

## 7. Compliance & Audit Considerations

### SOX Compliance Impact
- **Issue:** Test account (testhbno@gmail.com) with Administrator access to financial data
- **Risk:** Lack of individual accountability, potential unauthorized access
- **Remediation:** Immediate account disable + activity audit

### Data Privacy (GDPR/CCPA)
- **Issue:** External consultant (mubashir@srp.ai from AI company) with broad access
- **Risk:** Customer/employee data exposure to third-party AI processing
- **Remediation:** Review data processing agreement, limit data access

### Industry Best Practices
- **Issue:** 83% of external users have Administrator access
- **Benchmark:** Industry standard is <10% Administrator accounts total
- **Gap:** Excessive privileged access
- **Remediation:** Implement least privilege principle

---

## 8. Access Review Schedule (Proposed)

| Account | Organization | Next Review Date | Review Frequency | Owner |
|---------|--------------|------------------|------------------|-------|
| testhbno@gmail.com | Test Account | **IMMEDIATE** | N/A - Disable | IT Security |
| gijo.varghesee@gmail.com | External Developer | Within 7 days | N/A - Validate then disable/reduce | NetSuite Admin |
| mubashir@srp.ai | SRP.AI | Within 7 days | Quarterly | Project Manager |
| chimee@crmexpertsonline.com | CRM Experts Online | Within 7 days | Quarterly | NetSuite Admin |
| rian@netstock.co | Netstock | Within 30 days | Quarterly | IT Manager |
| Oracle support accounts (5) | Oracle NetSuite | Within 30 days | Bi-annually | IT Manager |
| jrestivo@walpoleadvisors.com | Walpole Advisors | Within 90 days | Annually | CFO |
| info@katyaniexport.com | Katyani Exports | Within 90 days | Annually | Purchasing |

---

## 9. Appendix: Full External User Details

### A. Oracle/NetSuite Support Team Detail

**Account 1: Mahesh Pragada**
- Email: mahesh.babu.pragada@oracle.com
- Roles: Mobile - Administrator, Administrator
- Likely Purpose: Mobile WMS implementation
- Estimated Access Duration: Unknown
- Recommendation: Confirm WMS project status; reduce to Support Center role if maintenance-only

**Account 2: Prashant Chandra**
- Email: pchandra@netsuite.com
- Roles: Administrator
- Likely Purpose: Platform support/troubleshooting
- Estimated Access Duration: Unknown
- Recommendation: Implement 90-day re-authorization cycle

**Account 3: Ryan F**
- Email: ryan.fielding@oracle.com
- Roles: Mobile - Administrator, Administrator
- Likely Purpose: Mobile WMS implementation
- Estimated Access Duration: Unknown
- Recommendation: Consolidate with Ryan.Fielding@NetSuite.com account

**Account 4: Ryan Fielding**
- Email: Ryan.Fielding@NetSuite.com
- Roles: Administrator
- Likely Purpose: Platform support (DUPLICATE OF ACCOUNT 3?)
- Estimated Access Duration: Unknown
- Recommendation: Consolidate with ryan.fielding@oracle.com account

**Account 5: Vikram Kumar**
- Email: soma.vikram.kumar@oracle.com
- Roles: Administrator
- Likely Purpose: Platform support/troubleshooting
- Estimated Access Duration: Unknown
- Recommendation: Implement 90-day re-authorization cycle

---

### B. External Consultants Detail

**Consultant 1: Chimee Eze (CRM Experts Online)**
- Email: chimee@crmexpertsonline.com
- Organization: CRM Experts Online (NetSuite consulting firm)
- Roles:
  - Quality Administrator
  - Quality Manager
  - Administrator
- Business Justification (Inferred): Quality management system customization/implementation
- Risk Factors:
  - Administrator role unnecessary for quality module work
  - No indication of project completion date
  - Company specializes in CRM, yet has quality system access
- **Recommendation:**
  - Request project status from internal sponsor
  - If project complete: Disable account
  - If ongoing: Remove Administrator role, keep Quality roles only
  - Implement 90-day re-authorization

**Consultant 2: Gijo Varghese (Independent Developer)**
- Email: gijo.varghesee@gmail.com
- Organization: Independent contractor (Gmail account indicates no corporate affiliation)
- Roles:
  - Senior Developer - REVISIONS REQUIRED
  - Administrator
- Business Justification (Inferred): Custom SuiteScript development
- Risk Factors:
  - Personal Gmail account (not corporate email)
  - "REVISIONS REQUIRED" in role name suggests:
    - Either work is incomplete/problematic
    - Or role was created temporarily and never removed
  - No corporate accountability or insurance coverage
  - Administrator + Developer = can modify and deploy code with no oversight
- **CRITICAL CONCERNS:**
  - Potential backdoor code insertion
  - No corporate liability if issues arise
  - Likely abandoned account if project ended
- **Recommendation:**
  - **URGENT:** Contact internal sponsor to verify status
  - If contract ended: Disable immediately
  - If active: Require contractor to obtain business email, remove Administrator
  - Implement code review for all work performed
  - Consider replacing with corporate-backed consulting firm

**Consultant 3: Mubashir M Amin (SRP.AI)**
- Email: mubashir@srp.ai
- Organization: SRP.AI (AI/automation consulting firm)
- Roles (8 total - MOST PRIVILEGED EXTERNAL ACCOUNT):
  - Administrator
  - HBNO - Administrator
  - Quality Administrator
  - HBNO - QC
  - HBNO - Project Management
  - HBNO - Purchasing Manager
  - Bulk Cart - Customer Service
  - NetSuite Support Center
- Business Justification (Inferred): AI-driven business process automation across multiple departments
- Risk Factors:
  - **Excessive privilege accumulation across unrelated business functions**
  - AI company with access to all business data raises privacy concerns:
    - Customer data (Customer Service)
    - Supplier data (Purchasing Manager)
    - Quality data (QC, Quality Administrator)
    - Project data (Project Management)
  - Two separate Administrator roles (Administrator + HBNO - Administrator)
  - NetSuite Support Center suggests deep system integration work
  - No apparent compartmentalization or separation of duties
- **DATA PRIVACY CONCERNS:**
  - If SRP.AI is using HBNO data to train AI models, requires DPA (Data Processing Agreement)
  - Potential GDPR/CCPA violations if customer data exposed without consent
  - No indication of data handling safeguards
- **Recommendation:**
  - **URGENT:** Meet with internal project sponsor to understand scope
  - Request formal Data Processing Agreement (DPA) if not on file
  - Reduce permissions to specific project needs:
    - If working on quality automation: Keep Quality roles only
    - If working on purchasing automation: Keep Purchasing role only
    - If working on customer service: Keep Customer Service only
  - **Remove both Administrator roles immediately** - replace with least-privilege custom role
  - Implement data access logging and monitoring
  - Quarterly access review with executive sponsor
  - Consider requiring on-site work for sensitive data access

---

### C. Integration Vendor Detail

**Netstock Integration**
- User: Rian
- Email: rian@netstock.co
- Organization: Netstock (Inventory optimization platform - legitimate NetSuite ISV partner)
- Roles:
  - HBNO - Administrator
  - NETSTOCK Integration Role
  - NETSTOCK Consultant Role
- Business Justification: Netstock provides demand planning and inventory optimization integrated with NetSuite
- Risk Factors:
  - Administrator role excessive for integration account
  - Integration should use API-based connection with scoped permissions
  - Potential for data export to Netstock cloud platform
- **Integration Architecture Review Needed:**
  - Verify if integration uses RESTlet/SuiteTalk (should not need Administrator)
  - Check if Netstock has Data Processing Agreement on file
  - Understand what data is being synchronized to Netstock platform
- **Recommendation:**
  - Remove HBNO - Administrator role
  - Keep NETSTOCK Integration Role and NETSTOCK Consultant Role only
  - Implement quarterly access review
  - Request Netstock data flow diagram
  - Verify Data Processing Agreement and security certifications (SOC 2, etc.)

---

### D. Accounting Firm Detail

**Walpole Advisors**
- User: Jeff Restivo
- Email: jrestivo@walpoleadvisors.com
- Organization: Walpole Advisors (Accounting/CPA firm)
- Roles: HBNO - Accountant
- Business Justification: External accounting/CPA services (common practice)
- Risk Assessment: **MEDIUM** (appropriate role, but still external financial data access)
- Access Scope: Financial data including:
  - General ledger
  - Accounts payable/receivable
  - Financial reports
  - Bank reconciliations (potentially)
- **Compliance Considerations:**
  - Verify signed confidentiality agreement on file
  - Confirm professional liability insurance coverage
  - Validate CPA license status
- **Recommendation:**
  - Maintain current access (appropriate for external accountant)
  - Annual access review with CFO
  - Ensure engagement letter includes data security provisions
  - Consider implementing view-only restrictions if full accountant access not needed

---

### E. Vendor Portal Detail

**454 Katyani Exports**
- Email: info@katyaniexport.com
- Organization: Katyani Exports (India-based manufacturing supplier)
- Roles: Vendor Center
- Business Justification: Vendor self-service portal for purchase orders, invoices, payments
- Risk Assessment: **LOW**
- Access Scope: Limited to:
  - View own purchase orders
  - Submit invoices
  - Check payment status
  - Update contact information
- **Recommendation:**
  - No changes needed (appropriate vendor portal access)
  - Include in annual vendor access review

---

### F. Test Account Detail (CRITICAL ISSUE)

**Jhon Smith (TEST ACCOUNT)**
- Email: testhbno@gmail.com
- Organization: NONE (Test account)
- Roles: Administrator
- Business Justification: NONE - Test account should not exist in production
- Risk Assessment: **CRITICAL**
- **Why This Is a Critical Security Issue:**
  1. **No Individual Accountability:** "Jhon Smith" is likely a fake name; unclear who has access
  2. **Shared Credentials:** Test accounts typically have shared/known passwords
  3. **Gmail Account:** Personal email domain indicates no corporate control
  4. **Administrator Access:** Full system access including:
     - Financial data (SOX compliance issue)
     - Customer data (privacy violation)
     - Employee data (HR compliance issue)
     - Ability to modify configurations and delete data
  5. **Likely Abandoned:** Created for testing, never disabled
  6. **Audit Trail Issues:** Any actions taken under this account cannot be attributed to an individual

- **Potential Attack Vectors:**
  1. Former employee/contractor with knowledge of credentials
  2. Shared password may be documented in old project notes
  3. Credential stuffing attacks if password is weak

- **Compliance Violations:**
  - **SOX (Sarbanes-Oxley):** Generic accounts with financial access violate individual accountability requirements
  - **GDPR/CCPA:** Uncontrolled access to personal data
  - **PCI DSS:** If payment card data accessible, violates access control requirements

- **IMMEDIATE ACTIONS REQUIRED:**
  1. **DISABLE ACCOUNT IMMEDIATELY** (within 24 hours)
  2. **Audit all activities:**
     - Run system access log report for testhbno@gmail.com
     - Review all transactions created/modified by this account
     - Check for unauthorized data exports
  3. **Investigate creation:**
     - Determine who created this account and when
     - Identify business justification (if any)
     - Interview responsible parties
  4. **Document for compliance:**
     - Create incident report
     - Document remediation actions
     - Include in next SOX audit documentation
  5. **Policy implementation:**
     - Document policy: No test accounts in production with elevated privileges
     - All testing must occur in sandbox environment
     - If production testing absolutely required: Time-limited, named user accounts only

---

## 10. Executive Summary for Leadership

**To:** HBNO Executive Team, IT Leadership, CFO
**From:** NetSuite Security Analysis
**Date:** October 15, 2025
**Subject:** External Vendor Access Security Review - URGENT ACTIONS REQUIRED

**Bottom Line Up Front:**
Your NetSuite instance has **11 external users** with access, including **10 with Administrator privileges** (83%). This represents a significant security risk and potential compliance violation.

**Most Critical Issues:**

1. **Test Account in Production (CRITICAL - ACTION TODAY)**
   - Account: testhbno@gmail.com with Administrator access
   - Risk: No accountability, potential SOX violation, likely shared credentials
   - Action: Disable immediately

2. **External Consultants with Excessive Access (URGENT - ACTION THIS WEEK)**
   - 3 consultant accounts with Administrator roles
   - 1 account (mubashir@srp.ai) has 8 different roles across all business functions
   - 1 account using personal Gmail address (gijo.varghesee@gmail.com)
   - Action: Audit, reduce permissions, or disable

3. **Oracle Support Team (HIGH PRIORITY - ACTION THIS MONTH)**
   - 5 Oracle/NetSuite support accounts with Administrator access
   - Possible duplicate accounts
   - No visible expiration dates
   - Action: Confirm necessity, consolidate duplicates, implement time limits

**Business Impact:**
- **Compliance Risk:** Potential SOX, GDPR, CCPA violations
- **Financial Risk:** Unauthorized access to financial data
- **Operational Risk:** External parties can modify critical system configurations
- **Reputational Risk:** Data breach potential if external accounts compromised

**Recommended Investment:**
- **Immediate:** 8-16 hours IT staff time to audit and remediate critical issues (this week)
- **Short-term:** Implement external access governance program (20-40 hours over 30 days)
- **Long-term:** Ongoing quarterly access reviews (4-8 hours per quarter)

**Approval Requested:**
1. Authority to disable test account (testhbno@gmail.com) immediately
2. Authority to reduce external consultant permissions
3. Budget for external access management tools (optional, $5-10K annually)

---

## Document Control

**Classification:** CONFIDENTIAL - Internal Use Only
**Author:** NetSuite Security Analysis Team
**Version:** 1.0
**Distribution:** Executive Team, IT Leadership, Legal, Compliance
**Next Review:** 30 days from issue date

**Change Log:**
- 2025-10-15: Initial report created

---

## Appendix: Queries for Further Investigation

If you have access to NetSuite audit logs, run these queries to investigate external account usage:

1. **Test Account Activity:**
   ```
   Login History -> Filter by: testhbno@gmail.com -> Date Range: Last 12 months
   Role Change History -> Filter by: testhbno@gmail.com
   ```

2. **External Administrator Actions:**
   ```
   System Access -> Role: Administrator -> Email Domain: NOT @hbno.com -> Last 90 days
   ```

3. **Data Exports by External Users:**
   ```
   CSV Export Log -> User Email: *external domains* -> Last 6 months
   ```

4. **Configuration Changes:**
   ```
   Setup Audit Trail -> User: *external accounts* -> Change Type: Any -> Last 12 months
   ```

---

**END OF REPORT**

*For questions or to discuss remediation priorities, contact: [Your IT Security Team]*
