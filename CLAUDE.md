# NetSuite Multi-Company Development Project - Memory File

> **Purpose**: This file serves as persistent memory for Claude Code, ensuring consistent behavior and automatic workflow orchestration across all conversations.

## Project Overview

This is a **multi-company NetSuite SuiteScript 2.1 development environment** with pre-configured account connections for multiple NetSuite instances.

### Project Structure
```
Netsuite/
├── companies/                    # Each folder = One NetSuite account
│   ├── HMP-Global/              # Connected to HMP-Global account
│   ├── ABA-CON/                 # Connected to ABA-CON account
│   ├── GOBA-SPORTS-PROD/        # Connected to GOBA-SPORTS-PROD account
│   ├── HBNO/                    # Connected to HBNO account
│   └── River-Supply-SB/         # Connected to River-Supply-SB account
├── .claude/
│   ├── agents/                  # Specialized AI agent definitions
│   │   ├── claude-architect.md  # Solution architecture design
│   │   ├── claude-coder.md      # Code implementation
│   │   ├── claude-reviewer.md   # Code review & QA
│   │   ├── claude-documenter.md # Documentation creation
│   │   └── ORCHESTRATION_GUIDE.md
│   └── commands/                # Slash commands
│       ├── architect.md         # /architect command
│       └── coder.md            # /coder command
└── CLAUDE.md                    # This file
```

## CRITICAL: Automatic Workflow Preferences

### Primary Directive: PROACTIVE Agent Orchestration

**AUTOMATICALLY trigger the enhanced orchestration system WITHOUT waiting for user to ask:**

When the user requests any SuiteScript development work, **IMMEDIATELY and AUTOMATICALLY** invoke the appropriate agents:

#### Phase 1: Architecture Design (3-Architect Brainstorming)

For architecture/planning tasks, **AUTOMATICALLY invoke 3 specialist architects in PARALLEL**:

1. **Architect-Governance** (`.claude/agents/architect-governance.md`)
   - **Mission**: Ensure solution works reliably in production
   - **Focus**: Functional reliability, production success, performance that enables functionality
   - **Asks**: "Will this actually work when deployed?" "How do we ensure 100% success rate?"

2. **Architect-Security** (`.claude/agents/architect-security.md`)
   - **Mission**: Ensure solution produces correct, valid data
   - **Focus**: Data correctness, functional integrity, input validation, error prevention
   - **Asks**: "Will this produce the right data?" "How do we prevent incorrect results?"

3. **Architect-Innovation** (`.claude/agents/architect-innovation.md`)
   - **Mission**: Ensure solution solves the real business problem
   - **Focus**: Business success, user success, practical solutions, measurable results
   - **Asks**: "Does this actually help the business succeed?" "Will users be able to use this effectively?"

**Process:**
```
Step 1: Launch 3 architects in PARALLEL (ONE message with 3 Task calls)
Step 2: Each architect analyzes from their perspective:
   ⚡ Governance → "Will this work reliably in production?"
   🔒 Security → "Will this produce correct data?"
   💡 Innovation → "Does this solve the real business problem?"
Step 3: Synthesize insights into final architecture blueprint
Step 4: Present unified architecture combining all 3 perspectives
```

**The 3 architects focus on FUNCTIONALITY and SUCCESS:**
- Not perfection, but **working solutions**
- Not theory, but **production readiness**
- Not complexity, but **simplicity that succeeds**
- Not elegance, but **results that matter**

#### Phase 2-4: Development Pipeline

4. **/coder** - Implement the synthesized architecture
5. **/reviewer** - Review for quality, governance, security
6. **/documenter** - Create comprehensive documentation

### AUTO-TRIGGER KEYWORDS

When you detect ANY of these keywords in the user's message, **AUTOMATICALLY start orchestration**:

| User Says | Auto-Trigger Action |
|-----------|-------------------|
| "create a script" | ✅ Immediately launch `/architect` with requirements |
| "build a feature" | ✅ Immediately launch `/architect` with requirements |
| "implement [anything]" | ✅ Immediately launch `/architect` with requirements |
| "develop [anything]" | ✅ Immediately launch `/architect` with requirements |
| "make a script" | ✅ Immediately launch `/architect` with requirements |
| "write a script" | ✅ Immediately launch `/architect` with requirements |
| "need a script for" | ✅ Immediately launch `/architect` with requirements |
| "automate [process]" | ✅ Immediately launch `/architect` with requirements |

**DO NOT ASK** "Would you like me to use the architect agent?"
**JUST DO IT** - Launch the agent immediately and show progress.

### AUTOMATIC ORCHESTRATION FLOW

**Example User Request:**
> "Create an invoice reminder script for HMP-Global"

**Your Automatic Response:**
```
I'll create this using our enhanced orchestration system with 3-architect brainstorming.

🧠 Phase 1: Architecture Design (3-Architect Brainstorming)
Launching 3 specialist architects in parallel to analyze requirements...

⚡ Architect-Governance analyzing: Will this work reliably in production?
🔒 Architect-Security analyzing: Will this produce correct data?
💡 Architect-Innovation analyzing: Does this solve the real business problem?

[3 architects provide their perspectives]

✅ Synthesizing insights into unified architecture...
✅ Architecture complete - combining production reliability, data correctness, and business success perspectives.

💻 Phase 2: Code Implementation
Launching /coder to implement the design...
[Code output appears]

✅ Code complete.

🔍 Phase 3: Code Review
Launching /reviewer to audit the code...
[Review output appears]

✅ Review complete - [Pass/Needs Revision]

🧾 Phase 4: Documentation
Launching /documenter to create full documentation...
[Documentation output appears]

✅ All phases complete!

Would you like me to:
1. Commit these changes to Git?
2. Deploy to HMP-Global NetSuite account?
```

**DO NOT WAIT for user approval between phases** - Run all phases automatically.

### Parallel Execution Rules

**CRITICAL: ALWAYS prefer parallel execution when possible for maximum speed and efficiency.**

When the user requests to create SuiteScript projects or features:

1. **Single Feature/Script**: Use sequential orchestration
   ```
   Architect → Coder → Reviewer → Documenter
   ```

2. **Multiple Independent Features**: **MANDATORY - Launch agents in PARALLEL**

   **Use a SINGLE message with multiple Task tool calls:**
   ```bash
   # ✅ CORRECT: For 3 independent modules, send ONE message with 3 Task calls
   Send single message containing:
   - Task: /architect "Design Module A"
   - Task: /architect "Design Module B"
   - Task: /architect "Design Module C"

   # Then when architectures complete, send ONE message with 3 /coder calls
   # Then when code complete, send ONE message with 3 /reviewer calls
   # Then when reviews complete, send ONE message with 3 /documenter calls
   ```

   **❌ WRONG: Do NOT send separate sequential messages for independent work**
   ```bash
   # ❌ Don't do this - it's slower!
   Message 1: Task /architect "Design Module A"
   Message 2: Task /architect "Design Module B"
   Message 3: Task /architect "Design Module C"
   ```

3. **Complex Multi-Module Project**: Follow the orchestration guide patterns
   - Reference: `.claude/agents/ORCHESTRATION_GUIDE.md`
   - Use parallel streams for independent components
   - Synchronize at integration points

4. **Parallel Execution Examples**

   **Example 1: User wants 2 scripts for same company**
   ```
   User: "Create an invoice reminder script and a customer aging report for HMP-Global"

   ✅ CORRECT Response:
   "I'll create both scripts in parallel for maximum efficiency.

   🧠 Phase 1: Architecture Design (Parallel)
   Launching both architects simultaneously..."

   [Send ONE message with TWO Task calls]
   ```

   **Example 2: User wants same feature for multiple companies**
   ```
   User: "Deploy the payment schedule feature to both HBNO and ABA-CON"

   ✅ CORRECT Response:
   "I'll deploy to both companies in parallel.

   Starting parallel deployments..."

   [Send ONE message with TWO Task calls for parallel deployment]
   ```

   **Example 3: User wants multiple code reviews**
   ```
   User: "Review all scripts in the HMP-Global FileCabinet folder"

   ✅ CORRECT Response:
   "I'll review all 5 scripts in parallel.

   🔍 Launching parallel code reviews..."

   [Send ONE message with FIVE Task calls]
   ```

5. **When to Use Parallel vs Sequential**

   **Use PARALLEL when:**
   - ✅ Multiple independent features/scripts
   - ✅ Multiple companies (same or different features)
   - ✅ Multiple file reviews
   - ✅ Multiple documentation tasks
   - ✅ Any work that doesn't depend on another task's output

   **Use SEQUENTIAL when:**
   - ⏭️ Single feature through 4-phase pipeline (architect → coder → reviewer → documenter)
   - ⏭️ Task B needs output from Task A
   - ⏭️ User explicitly requests sequential execution

### 3-Architect Brainstorming: When to Use

**ALWAYS use 3-architect brainstorming for:**
- ✅ New feature/script architecture (moderate to complex)
- ✅ System integration planning
- ✅ Performance-critical solutions
- ✅ Compliance-sensitive implementations
- ✅ User-facing automations
- ✅ When explicitly requested ("design", "architect", "plan")

**Use single architect or skip brainstorming for:**
- ⏭️ Simple utility scripts (<50 lines)
- ⏭️ Code reviews (use /reviewer)
- ⏭️ Documentation tasks (use /documenter)
- ⏭️ Bug fixes with clear solution

**Brainstorming Output Format:**
After 3 architects complete, synthesize their insights into:
```markdown
## Final Architecture Blueprint

### Executive Summary
[Combines Innovation's business value perspective]

### System Design
[Combines all 3 perspectives]

### Governance Strategy
[Governance specialist's optimization recommendations]

### Security & Compliance
[Security specialist's requirements]

### User Experience
[Innovation specialist's UX considerations]

### Implementation Approach
[Unified recommendations for coder agent]
```

### Available Slash Commands

All agents have slash commands available:

```bash
/architect "[Business requirement description]"
/coder "[Architecture + requirements]"
/reviewer "[Code to review]"
/documenter "[All artifacts for documentation]"
```

**IMPORTANT:** You should invoke these automatically when triggered, not wait for the user to call them manually.

**For 3-architect brainstorming:**
- Use Task tool with `.claude/agents/architect-governance.md`
- Use Task tool with `.claude/agents/architect-security.md`
- Use Task tool with `.claude/agents/architect-innovation.md`
- Send all 3 in ONE message (parallel execution)

## Multi-Company Deployment Rules

### CRITICAL Account Mapping
- **Each company folder is pre-authenticated to its NetSuite account**
- **NEVER mix files between company folders**
- **Each deployment is isolated to its specific account**

### Deployment Workflow
```bash
# 1. Navigate to the specific company folder
cd companies/[COMPANY-NAME]

# 2. Validate the project
npx suitecloud project:validate

# 3. Deploy to that account
npx suitecloud project:deploy

# 4. Import specific files if needed
npx suitecloud file:import --paths /SuiteScripts/[script-name].js
```

### Before Deploying - Always Check:
- [ ] Correct company folder selected
- [ ] suitecloud.config.js present
- [ ] manifest.xml up to date
- [ ] deploy.xml configured correctly

## CRITICAL: Account ID Verification Process

### The Account ID Problem

**CRITICAL LESSON**: Using the wrong Account ID can cost hours of debugging OAuth, certificates, and authentication when the real problem is a simple identifier mismatch.

**Real Example**:
- Spent 5+ hours troubleshooting OAuth signatures, certificates, and permissions
- Root cause: Account ID was **7759280** (wrong) instead of **693183** (correct)
- After fixing Account ID: Authentication worked immediately with Status 200

### MANDATORY: Verify Account ID BEFORE Any Authentication Setup

**BEFORE setting up authentication, API access, or MCP integration for ANY company:**

1. **Run the verification tool FIRST**:
   ```bash
   node verify-account-ids.js
   ```

2. **Check the output**:
   - ✅ **Green checkmark** = Account ID verified, safe to proceed
   - ⚠️ **Yellow warning** = Account ID NOT verified, STOP and verify first
   - ❌ **Red error** = Wrong Account ID detected, FIX immediately

3. **If you see a warning**, verify the Account ID:
   ```bash
   # Step 1: Log into that company's NetSuite account
   # Step 2: Navigate to Setup → Company → Company Information
   # Step 3: Copy the Account ID from that page
   # Step 4: Update ACCOUNT-IDS.md with verified ID
   # Step 5: Run verification tool again
   ```

### Account ID Registry

**Master registry location**: `ACCOUNT-IDS.md`

This file tracks:
- ✅ Verified Account IDs for each company
- ❌ Known incorrect Account IDs to avoid
- 📅 Verification dates
- 📝 Verification methods

**Example entry**:
```markdown
| GOBA-SPORTS-PROD | 693183 | 2025-10-15 | SDF Deploy | Verified via deployment output |
```

### Verification Workflow

**For NEW company authentication setup:**

```bash
# STEP 1: Check if Account ID is verified
node verify-account-ids.js

# STEP 2a: If verified (✅), proceed with setup
cd companies/[COMPANY-NAME]
# Continue with authentication setup

# STEP 2b: If NOT verified (⚠️), verify first
# 1. Log into NetSuite
# 2. Setup → Company → Company Information
# 3. Copy Account ID
# 4. Update ACCOUNT-IDS.md
# 5. Run verification tool again
# 6. Only then proceed with authentication
```

**For EXISTING company with auth failures:**

```bash
# STEP 1: Verify Account ID FIRST (don't assume it's OAuth/certificates)
node verify-account-ids.js

# STEP 2: Check against NetSuite UI
# Log in → Setup → Company → Company Information
# Compare Account ID

# STEP 3: If mismatch found:
# - Update ALL config files with correct ID
# - Update ACCOUNT-IDS.md registry
# - Run verification tool to confirm
# - THEN retry authentication
```

### Configuration Files That Need Account IDs

The verification tool automatically checks these files:

**For REST API authentication:**
- `test-netsuite-api.js`
- `test-netsuite-records.js`
- Any custom API scripts

**For MCP integration:**
- `.mcp.json` (in NETSUITE_ACCOUNT_ID env var)
- Custom MCP server configs

**For SuiteCloud CLI:**
- `suitecloud.config.js` (accountId field)

### Prevention Checklist

Before ANY authentication work:

- [ ] Run `node verify-account-ids.js`
- [ ] If warning appears, verify Account ID in NetSuite UI
- [ ] Update ACCOUNT-IDS.md with verified ID
- [ ] Confirm all config files use same Account ID
- [ ] Run verification tool again to confirm ✅
- [ ] ONLY THEN proceed with auth setup

### Emergency: Wrong Account ID Discovered

If you discover authentication is failing and suspect Account ID:

1. **STOP** - Don't waste time troubleshooting OAuth/certificates
2. **VERIFY** the Account ID in NetSuite UI immediately
3. **CHECK** ACCOUNT-IDS.md for known incorrect IDs
4. **UPDATE** all configuration files with correct ID
5. **RUN** verification tool: `node verify-account-ids.js`
6. **TEST** authentication immediately
7. **DOCUMENT** the correct ID in ACCOUNT-IDS.md

### Account ID Quick Reference

| Company | Status | Registry Status |
|---------|--------|----------------|
| GOBA-SPORTS-PROD | ✅ Verified: 693183 | In registry |
| HMP-Global | ⚠️ Not verified | Needs verification |
| ABA-CON | ⚠️ Not verified | Needs verification |
| HBNO | ⚠️ Not verified | Needs verification |
| River-Supply-SB | ⚠️ Not verified | Needs verification |

### Automation Rules

**AUTOMATICALLY run verification tool when:**
- User requests authentication setup for a company
- User reports authentication failures
- User mentions "OAuth error", "401", "token rejected"
- User wants to set up MCP integration
- User wants to configure REST API access

**Example response**:
```
Before we set up authentication for [COMPANY], let me verify the Account ID first to avoid hours of debugging.

Running: node verify-account-ids.js

[Results appear]

⚠️ WARNING: [COMPANY] Account ID not verified.
Let's verify this in NetSuite UI first before proceeding.

Please log in to [COMPANY] NetSuite and navigate to:
Setup → Company → Company Information

What Account ID do you see there?
```

## SuiteScript 2.1 Standards

### Mandatory Code Requirements
- **Version**: SuiteScript 2.1 only (not 1.0 or 2.0)
- **Modules**: Use AMD pattern with `define()`
- **Error Handling**: Comprehensive try/catch blocks
- **Governance**: Optimize for <1000 units per execution when possible
- **Logging**: Use `log.audit()`, `log.debug()`, `log.error()` (never `console.log`)
- **Parameters**: Use script parameters instead of hardcoded values

### Code Quality Gates
- Cyclomatic complexity < 10
- All functions documented with JSDoc
- No hardcoded internal IDs
- Field-level validation on all inputs
- Graceful error recovery

### Script Header Requirements
- **NEVER** add `@author Claude Code` to script JSDoc headers
- Leave `@author` field empty or use actual developer name if provided by user
- Scripts should include `@NApiVersion`, `@NScriptType`, `@NModuleName`, and `@description`
- Do NOT include AI attribution in source code files
- Attribution belongs only in Git commits, not in deployed code

## Development Workflow Triggers

When you see these keywords, automatically invoke agent orchestration:

| User Says | Action |
|-----------|--------|
| "create a script" | Start with /architect |
| "build a feature" | Start with /architect |
| "implement automation" | Start with /architect |
| "optimize this code" | Start with claude-reviewer, then claude-coder |
| "review this script" | Use claude-reviewer |
| "document this solution" | Use claude-documenter |
| "fix this bug" | claude-reviewer (diagnose) → claude-coder (fix) |

## Context-Aware Behaviors

### When User Provides Requirements
1. Automatically analyze complexity (simple/moderate/complex)
2. If moderate/complex → Invoke /architect first
3. If simple → Ask if they want full orchestration or quick implementation

### When User Provides Existing Code
1. Check if they want review, optimization, or documentation
2. Route to appropriate agent(s)
3. Suggest running full review if code looks production-bound

### When User Mentions a Company Name
1. Confirm which company folder to use
2. Navigate to that folder for all operations
3. Remind about account-specific deployment

## Quality Assurance Defaults

### Always Include in Code Reviews:
- Governance unit analysis
- Security vulnerability check
- Error handling completeness
- Performance bottleneck identification
- NetSuite best practices compliance

### Always Include in Documentation:
- Executive summary for business stakeholders
- Technical specifications for developers
- Deployment guide with step-by-step instructions
- Troubleshooting guide for support teams

## Documentation Organization Rules

### MANDATORY: Automatic Documentation Placement

**ALWAYS organize documentation immediately after creation** following this structure:

### Decision Tree: Where Does Documentation Go?

**Step 1: Determine Scope**

Ask: "Does this documentation apply to ALL companies or just ONE company?"

- **Universal (all companies)** → `docs/[category]/`
- **Company-specific** → `companies/[COMPANY]/docs/[category]/`

**Step 2: Determine Category**

| Category | Universal Location | Company Location | Examples |
|----------|-------------------|------------------|----------|
| **setup** | `docs/setup/` | `companies/[CO]/docs/setup/` | AUTHENTICATION-SETUP, BEGINNER-GUIDE, COMPLETE-SETUP |
| **workflow** | `docs/workflow/` | N/A | WORKFLOW-GUIDE, DEPLOYMENT-GUIDE, GIT-WORKFLOW |
| **standards** | `docs/standards/` | N/A | FILE-NAMING-STANDARDS, CODE-STANDARDS |
| **troubleshooting** | `docs/troubleshooting/` | N/A | AUTHENTICATION-ISSUES, DEPLOYMENT-ERRORS |
| **features** | N/A | `companies/[CO]/docs/features/` | [FEATURE]_DOCUMENTATION, [FEATURE]_ARCHITECTURE, [FEATURE]_RUNBOOK |
| **deployment** | N/A | `companies/[CO]/docs/deployment/` | DEPLOYMENT_CHECKLIST, DEPLOYMENT_HISTORY |
| **testing** | N/A | `companies/[CO]/docs/testing/` | TEST_PLAN, TEST_RESULTS, SETUP_TEST_DATA |
| **security** | N/A | `companies/[CO]/docs/security/` | ROLE_ANALYSIS, SOD_VIOLATIONS, SECURITY_ASSESSMENT |

**Step 3: File Naming Convention**

#### Universal Documentation
```
[DESCRIPTIVE_NAME].md
```
Examples: `AUTHENTICATION-SETUP.md`, `WORKFLOW-GUIDE.md`

#### Company-Specific Feature Documentation
```
[FEATURE_NAME]_[TYPE].md
```
Types:
- `_DOCUMENTATION.md` - Complete feature documentation
- `_ARCHITECTURE.md` - Architecture & design
- `_RUNBOOK.md` - Operational runbook
- `_API.md` - API documentation

Examples:
- `DEFERRED_REVENUE_DOCUMENTATION.md`
- `CONTACT_PRINT_ARCHITECTURE.md`
- `PO_PAYMENT_SCHEDULE_RUNBOOK.md`

#### Test Documentation
```
TEST_PLAN_[FEATURE].md
TEST_RESULTS_[FEATURE].md
SETUP_TEST_DATA.md
```

#### Security Documentation
```
ROLE_ANALYSIS_REPORT.md
SOD_VIOLATIONS_REPORT.md
SECURITY_ASSESSMENT.md
EXTERNAL_VENDOR_ACCESS_REPORT.md
```

### Automatic Documentation Workflow

**After /documenter agent completes:**

1. **Determine scope and category** using decision tree above
2. **Create file** in appropriate directory with proper naming
3. **Update company README.md** with link to new documentation
4. **Commit** with message: `docs([COMPANY]): Add [feature] documentation`

**Example for HMP-Global Deferred Revenue feature:**
```bash
# /documenter creates these files:
companies/HMP-Global/docs/features/DEFERRED_REVENUE_DOCUMENTATION.md
companies/HMP-Global/docs/features/DEFERRED_REVENUE_ARCHITECTURE.md
companies/HMP-Global/docs/features/DEFERRED_REVENUE_RUNBOOK.md
companies/HMP-Global/docs/testing/TEST_PLAN_DEFERRED_REVENUE.md

# Update README.md:
companies/HMP-Global/README.md (add links under ## Documentation Index)

# Commit:
git add .
git commit -m "docs(HMP-Global): Add Deferred Revenue documentation

- Complete feature documentation
- Architecture design
- Operational runbook
- Test plan

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Documentation Requirements (All Docs MUST Include)

1. **Title** - Clear, descriptive H1
2. **Purpose** - Brief overview
3. **Date Created** - YYYY-MM-DD
4. **Last Updated** - YYYY-MM-DD
5. **Company** (if company-specific) - Which company this applies to
6. **Author/Contact** - "Claude Code" or developer name (NOTE: This is for DOCUMENTATION files only, NOT for SuiteScript source code)
7. **Status** - Active/Deprecated/In Development
8. **Table of Contents** - For docs >500 lines

### Reference Guide

See full documentation standards: `docs/standards/DOCUMENTATION-STANDARDS.md`

### DO's ✅
- ✅ **ALWAYS** determine if universal or company-specific
- ✅ **ALWAYS** use proper category folder
- ✅ **ALWAYS** follow naming conventions
- ✅ **ALWAYS** update company README.md with links
- ✅ **ALWAYS** commit documentation immediately after creation

### DON'Ts ❌
- ❌ **NEVER** put company-specific docs in root `docs/`
- ❌ **NEVER** mix documentation types in same folder
- ❌ **NEVER** use version numbers in filenames
- ❌ **NEVER** create docs without proper headers
- ❌ **NEVER** forget to link docs in README.md

## Integration Points

### Java Requirement
- Java 21 is installed: `C:\Program Files\Java\jdk-21\bin\java`
- Required for SuiteCloud CLI operations

### NetSuite REST API Integration (Primary Data Access Method)

**CRITICAL**: REST API is the PRIMARY method for querying NetSuite data. Always prefer REST API over MCP for data queries.

#### When to Automatically Query NetSuite Data

**AUTOMATICALLY execute REST API queries when:**
- User asks about data in a specific account ("How many customers in GOBA?", "Show me recent sales orders")
- User wants to validate field names or record structures before coding
- User needs real-time data for analysis or reporting
- User is developing a script that needs actual data examples
- User asks about specific records, transactions, or lists
- User wants to understand data structure for architecture/design
- User requests "query", "fetch", "get", "retrieve" data from NetSuite

**DO NOT ASK for permission** - if account is ✅ READY, execute query immediately.

#### REST API Setup Status (Check ACCOUNT-IDS.md)

| Company | Status | Can Query Now? |
|---------|--------|----------------|
| GOBA-SPORTS-PROD | ✅ **READY** | **YES** - Query immediately |
| HMP-Global | ❌ Not configured | **NO** - Setup required |
| ABA-CON | ❌ Not configured | **NO** - Setup required |
| HBNO | ❌ Not configured | **NO** - Setup required |
| River-Supply-SB | ❌ Not configured | **NO** - Setup required |

**Legend:**
- ✅ **READY** - Token-Based Authentication configured, test scripts available, query immediately
- ⚠️ **PARTIAL** - Account ID verified but TBA credentials not configured
- ❌ **Not configured** - Account ID and/or REST API authentication not set up

#### How to Execute REST API Queries

**For accounts marked ✅ READY:**

```bash
# Navigate to company folder
cd companies/GOBA-SPORTS-PROD

# Example: Query customer records
node test-netsuite-records.js

# Or use Node.js inline for custom queries
node -e "const script = require('./test-netsuite-records'); /* modify as needed */"
```

**Common Record Types Available:**
- `customer` - Customer master records
- `salesorder` - Sales order transactions
- `invoice` - Invoice transactions
- `item` - Inventory item master
- `vendor` - Vendor master records
- `employee` - Employee records
- `purchaseorder` - Purchase order transactions
- `contact` - Contact records
- `transaction` - Generic transaction search

**REST API Query Parameters:**
- `limit=N` - Return max N records (default: 1000)
- `offset=N` - Skip N records (for pagination)
- `expand=subitems` - Include child/related records
- `fields=id,companyname,email` - Specific fields only

#### Automatic Query Execution Workflow

**When user mentions querying NetSuite data:**

**Step 1:** Check ACCOUNT-IDS.md REST API status
**Step 2a:** If ✅ READY → Execute query immediately without asking
**Step 2b:** If ❌ Not configured → Inform user and offer REST API setup

**Example Automatic Response (✅ READY):**
```
I'll query GOBA-SPORTS-PROD for customer data.

[Execute: cd companies/GOBA-SPORTS-PROD && node test-netsuite-records.js]

✅ Retrieved 1000 customers from NetSuite.

Here's a summary:
- Total customers: 1000
- Active: 876
- Inactive: 124
- Top 5 by ID: [show first 5]

Would you like me to:
1. Filter by specific criteria?
2. Export to CSV?
3. Analyze specific customer segment?
```

**Example Response (❌ Not configured):**
```
REST API is not configured for HMP-Global yet.

To query this account, I need to set up Token-Based Authentication first.

Would you like me to guide you through:
1. ✅ Quick setup (15 mins) - Create Integration + Tokens
2. 📖 Review setup documentation first

This is a one-time setup, then queries work automatically.
```

#### Available REST API Scripts Per Company

Each configured company folder contains:
- **`test-netsuite-records.js`** - ⭐ Primary script for record queries (PREFERRED)
- **`test-netsuite-api.js`** - General API testing

**Script Features:**
- ✅ Token-Based Authentication (OAuth 1.0a with HMAC-SHA256)
- ✅ Automatic signature generation
- ✅ Error handling and detailed logging
- ✅ Pagination support
- ✅ Query parameter flexibility

#### Setting Up REST API for New Accounts

**If user requests data from ❌ Not configured account:**

**DO NOT manually guide through setup** - offer automatic setup:

```
REST API not configured for [COMPANY]. Let me set it up.

🔧 **Automatic REST API Setup**

I'll need you to:

**Step 1: Create Integration Record**
1. Log into [COMPANY] NetSuite
2. Setup → Integrations → Manage Integrations → New
3. Name: "Claude Code REST API Access"
4. Token-Based Authentication: ✅ CHECKED
5. TBA: Authorization Flow: ☐ UNCHECKED
6. Save and copy:
   - Consumer Key
   - Consumer Secret

**Step 2: Create Access Token**
1. Setup → Users/Roles → Access Tokens → New
2. Application Name: "Claude Code REST API Access"
3. User: [Your user]
4. Role: Administrator (or appropriate role)
5. Save and copy:
   - Token ID
   - Token Secret

**Step 3: Verify Account ID**
1. Setup → Company → Company Information
2. Copy Account ID

Once you provide these, I'll:
✅ Create test scripts in companies/[COMPANY]/
✅ Configure authentication
✅ Test connection
✅ Update ACCOUNT-IDS.md
✅ Enable automatic queries

Ready to start?
```

**After credentials provided:**
1. Create `test-netsuite-records.js` in company folder
2. Configure with provided credentials
3. Test authentication
4. Update ACCOUNT-IDS.md to ✅ READY status
5. Commit changes
6. Execute user's original query

#### Auto-Trigger Keywords for REST API Queries

Automatically execute queries when user says:

| User Says | Action |
|-----------|--------|
| "How many [records] in [company]?" | Query that record type, show count |
| "Show me [records] from [company]" | Query and display records |
| "Get [record type] data for [company]" | Execute query for that type |
| "Query [company] for [records]" | Execute REST API query |
| "Fetch [records] from [company]" | Execute REST API query |
| "What [records] exist in [company]?" | Query and analyze |
| "List [records] in [company]" | Query and display |
| "Retrieve [records] from [company]" | Execute REST API query |

**DO NOT ask "Would you like me to query NetSuite?"** - Just execute if account is ✅ READY.

#### Query Result Handling

**Always present query results with:**
1. **Summary** - Total count, status breakdown
2. **Sample data** - Show first 3-5 records
3. **Insights** - Any patterns or notable findings
4. **Next actions** - Offer relevant follow-up queries

**Example:**
```
✅ Retrieved 1,547 sales orders from GOBA-SPORTS-PROD

📊 Summary:
- Total orders: 1,547
- Status breakdown:
  * Pending Fulfillment: 342
  * Pending Billing: 156
  * Billed: 1,049

💰 Revenue:
- Total: $3,247,892.43
- Average order: $2,099.35

📦 Sample Orders:
1. SO-10234 - ACME Corp - $12,450.00 (Pending Fulfillment)
2. SO-10235 - TechStart Inc - $8,932.50 (Billed)
3. SO-10236 - Global Systems - $15,234.75 (Pending Billing)

Would you like me to:
1. Filter by specific status?
2. Analyze orders by customer?
3. Export to CSV for analysis?
```

#### Error Handling for REST API Queries

**Common errors and automatic responses:**

**401 Unauthorized:**
```
❌ Authentication failed for [COMPANY]

Possible issues:
1. Tokens expired or revoked
2. Wrong Account ID
3. Integration disabled

Let me verify the Account ID first:
[Run: node verify-account-ids.js]

[If Account ID wrong] → Fix Account ID
[If Account ID correct] → Need to regenerate tokens
```

**403 Forbidden:**
```
❌ Access denied - insufficient permissions

The token's role lacks permission to access [record type].

Would you like me to:
1. Check what permissions are available?
2. Guide you to update role permissions?
```

**404 Not Found:**
```
❌ Record type '[type]' not found

Valid record types: customer, salesorder, invoice, item, vendor, employee, purchaseorder

Did you mean one of these?
```

#### NetSuite Integration Knowledge Base

**CRITICAL**: Comprehensive integration guides are available in `docs/netsuite-integration/`

**ALWAYS reference these guides when working with NetSuite REST API:**

1. **[NetSuite REST API Guide](docs/netsuite-integration/NETSUITE-REST-API-GUIDE.md)**
   - Complete REST API integration reference
   - OAuth 1.0a authentication patterns
   - SuiteQL vs Record API differences
   - Common patterns and troubleshooting
   - **Use this for**: API setup, authentication issues, query patterns

2. **[Employee Access Patterns](docs/netsuite-integration/EMPLOYEE-ACCESS-PATTERNS.md)**
   - How to access employee records via REST API
   - **BREAKTHROUGH**: SuiteQL endpoint works when Record API fails
   - 10-agent parallel testing methodology
   - Complete working examples
   - **Use this for**: Employee queries, user management, sales rep assignments

3. **[Bulk Update Patterns](docs/netsuite-integration/BULK-UPDATE-PATTERNS.md)**
   - Production-validated bulk update workflows
   - Two-step update pattern (avoid validation errors)
   - CSV parsing and progress tracking
   - Error handling strategies
   - **Use this for**: Bulk customer updates, data imports, mass assignments

**When to Auto-Reference These Docs:**

- User mentions employee records → Check Employee Access Patterns
- User wants bulk updates → Check Bulk Update Patterns
- User reports API errors → Check REST API Guide troubleshooting section
- User asks "how to access [record type]" → Check REST API Guide

**Key Learnings Documented:**

- ✅ SuiteQL has MORE permissive access than Record API for reads
- ✅ Employee records ONLY accessible via SuiteQL (not Record API)
- ✅ Two-step update (subsidiary first) prevents 400 errors
- ✅ BUILTIN.DF() can expose data when direct queries fail
- ✅ Parallel agent testing can discover solutions in <10 minutes

#### Automatic Knowledge Capture System

**CRITICAL: Automatically detect and document new NetSuite learnings**

**When to AUTOMATICALLY offer documentation:**

Detect these situations and offer to update knowledge base:

| Situation | Detection Trigger | Action |
|-----------|-------------------|--------|
| **Problem Solved** | User reports error → We fix it | Offer: "Should I add this to knowledge base?" |
| **New Pattern Discovered** | We find new API approach | Offer: "Should I document this pattern?" |
| **Workaround Found** | We work around NetSuite limitation | Offer: "Should I add this workaround?" |
| **Better Method** | We improve on existing pattern | Offer: "Should I update the docs with this?" |
| **Multiple Attempts** | Tried 3+ approaches before success | Offer: "Should I document what worked?" |
| **Research Session** | Spent >30 mins troubleshooting | Offer: "Should I capture this learning?" |

**Detection Patterns:**

```
# Automatically detect problem-solving
IF:
  - User reported error/problem
  - We tried multiple solutions
  - We found working solution
THEN:
  - Offer to document in knowledge base
  - Use /document-learning command

# Automatically detect new discoveries
IF:
  - Found new API endpoint/method
  - Discovered better approach
  - Created working code example
THEN:
  - Suggest adding to knowledge base
  - Provide quick documentation option
```

**Automatic Response Pattern:**

```
✅ Problem solved! [describe solution]

📚 **Knowledge Base Update**

This is a new learning that should be documented. Would you like me to add it to the knowledge base?

What we learned:
- [Problem]: [description]
- [Solution]: [description]
- [Why it works]: [explanation]

I can add this to: [suggest guide name]

Type "yes" or I can show you the /document-learning command.
```

**Available Documentation Tools:**

1. **`/document-learning`** command (`.claude/commands/document-learning.md`)
   - Specialized agent for knowledge capture
   - Prompts for all necessary information
   - Updates appropriate guide
   - Creates commit automatically

2. **Learning Template** (`docs/netsuite-integration/LEARNING-TEMPLATE.md`)
   - Quick form for manual documentation
   - Structured capture of key info
   - Copy-paste into knowledge base

**When NOT to Offer Documentation:**

- ⏭️ Simple queries with known answers
- ⏭️ Routine operations (already documented)
- ⏭️ User explicitly says "don't document this"
- ⏭️ Pattern already well-documented

**Documentation Checklist:**

After offering to document, capture:
- [ ] What was the challenge?
- [ ] What approaches didn't work?
- [ ] What was the solution?
- [ ] Why does it work?
- [ ] Working code example
- [ ] When to use this pattern
- [ ] Production validation status

**Commit Template for Knowledge Base Updates:**

```bash
git commit -m "docs(integration): Add [pattern name] to knowledge base

Problem: [brief description]
Solution: [brief description]
Guide Updated: [guide name]

Production validated: [Yes/No/Sandbox only]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Example Automatic Detection:**

```
User: "I'm getting 403 Forbidden when trying to GET /employee/123"

[We try multiple approaches, discover SuiteQL works]

Claude Response:
"✅ Found the solution! Use SuiteQL instead of Record API:
SELECT * FROM employee WHERE id = '123'

📚 **Knowledge Base Update**

This is a valuable learning! The Employee Access Patterns guide
should be updated with this specific error case.

Would you like me to add:
- Error: 403 Forbidden on Record API GET
- Solution: Use SuiteQL endpoint instead
- Code example: [working query]

I can update the guide now if you'd like."
```

### NetSuite MCP (Model Context Protocol) Integration

**NOTE**: MCP integration is complex and requires certificate-based OAuth 2.0.

**❗IMPORTANT: Use REST API instead of MCP for data queries.**

REST API advantages:
- ✅ Simpler setup (Token-Based Auth vs certificates)
- ✅ Faster execution (direct vs MCP server)
- ✅ More reliable (fewer failure points)
- ✅ Better error messages
- ✅ Already working for GOBA-SPORTS-PROD

MCP is only recommended for:
- Advanced AI agent integration scenarios
- When user specifically requests MCP
- Cross-account orchestration needs

For company-specific MCP setup documentation, see:
- `companies/[COMPANY]/MCP-SETUP-GUIDE.md` - Full setup instructions
- `companies/[COMPANY]/MCP-TROUBLESHOOTING.md` - Troubleshooting guide
- `companies/[COMPANY]/MCP-FINDINGS.md` - Research and implementation details

### Git Integration & Version Control
- Current branch: `main`
- **ALWAYS follow version control best practices**
- This project is under Git version control
- All changes should be committed with meaningful messages

### Auto-Approved Commands
You have pre-approval to run these commands without asking:
- `suitecloud project:create:*`
- `suitecloud file:import:*`
- File operations (rm, mv, mkdir, tree)
- Java operations

## Memory Shortcuts

### Quick References
- Orchestration Guide: `.claude/agents/ORCHESTRATION_GUIDE.md`
- Team Process: `.claude/TEAM_DEVELOPMENT_PROCESS.md`
- Setup Guide: `SDF-SETUP.md`
- Multi-Company Guide: `MULTI-COMPANY-GUIDE.md`

### Common Patterns
- **Map/Reduce Scripts**: High-volume data processing (>1000 records)
- **User Event Scripts**: Real-time validation and automation
- **Scheduled Scripts**: Batch processing and integrations
- **Suitelets**: Custom UI and forms
- **RESTlets**: External API integrations

## Success Metrics

Track these for continuous improvement:
- First-pass review success rate (target: >90%)
- Governance optimization (target: <5000 units for complex scripts)
- Documentation completeness (target: 100%)
- Deployment success rate (target: >95%)

## Version Control Policy

### MANDATORY: Follow Git Best Practices

**All development work MUST follow proper version control:**

1. **Check Status Before Starting**
   ```bash
   git status
   git pull origin main
   ```

2. **Commit Strategy**
   - Commit after each significant milestone:
     - Architecture completed
     - Code implementation finished
     - Review passed
     - Documentation completed
   - **Never** leave uncommitted changes
   - **Always** commit before deployment

3. **Commit Message Format**
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   <type>(<scope>): <subject>

   <body>

   <footer>
   ```

   **Types:**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `refactor:` Code refactoring
   - `perf:` Performance improvements
   - `test:` Test additions/changes
   - `chore:` Build/tooling changes
   - `style:` Code style changes

   **Examples:**
   ```bash
   git commit -m "feat(HMP-Global): Add deferred revenue Map/Reduce script

   - Implements automated revenue recognition
   - Processes 10k+ transactions efficiently
   - Includes comprehensive error handling
   - Optimized for <2000 governance units

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

   ```bash
   git commit -m "docs(ABA-CON): Add contact PDF customization documentation

   - Complete user guide
   - Technical specifications
   - Deployment instructions

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

4. **When to Commit**

   **After Architecture Phase:**
   ```bash
   git add .
   git commit -m "docs(<company>): Add architecture design for <feature>"
   ```

   **After Code Implementation:**
   ```bash
   git add .
   git commit -m "feat(<company>): Implement <feature> SuiteScript"
   ```

   **After Code Review & Fixes:**
   ```bash
   git add .
   git commit -m "refactor(<company>): Apply code review improvements to <feature>"
   ```

   **After Documentation:**
   ```bash
   git add .
   git commit -m "docs(<company>): Add complete documentation for <feature>"
   ```

5. **Before Deployment**
   ```bash
   # Always check what's changed
   git status
   git diff

   # Commit all changes
   git add .
   git commit -m "feat(<company>): <description>"

   # Push to remote
   git push origin main
   ```

6. **Multi-Company Commits**
   - Scope commits by company folder
   - Keep company-specific changes isolated
   - Examples:
     ```
     feat(HMP-Global): Add invoice processing script
     fix(ABA-CON): Correct contact URL generation logic
     docs(River-Supply-SB): Add deployment guide
     ```

7. **Branching Strategy**
   - **main**: Production-ready code
   - **feature/\<company\>-\<feature-name\>**: For new features
   - **fix/\<company\>-\<issue\>**: For bug fixes
   - **docs/\<company\>-\<doc-type\>**: For documentation

   **Example workflow:**
   ```bash
   # Create feature branch
   git checkout -b feature/HMP-Global-revenue-recognition

   # Make changes, commit frequently
   git add .
   git commit -m "feat(HMP-Global): Add revenue recognition logic"

   # When complete, merge to main
   git checkout main
   git merge feature/HMP-Global-revenue-recognition
   git push origin main
   ```

8. **Commit Checklist**
   Before committing, verify:
   - [ ] Code is tested and working
   - [ ] No syntax errors
   - [ ] No hardcoded credentials or sensitive data
   - [ ] Documentation updated
   - [ ] Meaningful commit message
   - [ ] Correct company scope in message

### Version Control Automation

**AUTOMATICALLY suggest commits after EACH phase completes:**

After each agent completes its work, **IMMEDIATELY suggest the appropriate git commit**:

1. **After /architect completes:**
   ```bash
   Ready to commit architecture?

   git add .
   git commit -m "docs(<company>): Add architecture design for <feature>

   - Complete system design
   - Governance estimates
   - Error handling strategy

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

2. **After /coder completes:**
   ```bash
   Ready to commit code?

   git add .
   git commit -m "feat(<company>): Implement <feature> SuiteScript

   - Production-ready SuiteScript 2.1
   - Comprehensive error handling
   - Governance optimized

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

3. **After /reviewer completes (with fixes):**
   ```bash
   Ready to commit review improvements?

   git add .
   git commit -m "refactor(<company>): Apply code review improvements

   - Fixed governance issues
   - Enhanced error handling
   - Improved performance

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

4. **After /documenter completes:**
   ```bash
   Ready to commit documentation?

   git add .
   git commit -m "docs(<company>): Add complete documentation for <feature>

   - Technical specifications
   - Deployment guide
   - User training materials

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

**IMPORTANT:** Always show the commit command ready to execute. User just needs to confirm.

### Git Safety Rules
- ✅ ALWAYS check `git status` before committing
- ✅ ALWAYS use meaningful commit messages
- ✅ ALWAYS scope by company folder
- ✅ ALWAYS commit before deployment
- ❌ NEVER commit sensitive data
- ❌ NEVER force push without explicit user request
- ❌ NEVER skip commit messages
- ❌ NEVER commit directly to main without testing

## Behavioral Rules for Agent Orchestration

### DO's ✅
- ✅ **AUTOMATICALLY detect trigger keywords** and start orchestration
- ✅ **IMMEDIATELY launch agents** without asking permission
- ✅ **RUN ALL 4 AGENTS** in sequence for new development
- ✅ **SUGGEST GIT COMMITS** after each phase
- ✅ **SHOW PROGRESS** clearly with phase indicators (🧠💻🔍🧾)
- ✅ **USE PARALLEL EXECUTION** for multiple independent features (MANDATORY - send ONE message with multiple Task calls)
- ✅ **FOLLOW ORCHESTRATION GUIDE** patterns
- ✅ **EXTRACT COMPANY NAME** from request and use in commits
- ✅ **ALWAYS check for parallelization opportunities** before starting work

### DON'Ts ❌
- ❌ **NEVER ASK** "Would you like me to use the architect?"
- ❌ **NEVER WAIT** for approval between agent phases
- ❌ **NEVER SKIP** any of the 4 agents for new development
- ❌ **NEVER FORGET** to suggest commits after each phase
- ❌ **NEVER DEPLOY** without user confirmation
- ❌ **NEVER COMMIT** without showing the command first
- ❌ **NEVER send sequential messages** for independent parallel work (combine into ONE message with multiple Task calls)

### Decision Matrix

| User Request | Automatic Action | Agents to Use |
|--------------|------------------|---------------|
| "Create a script..." | ✅ Auto-start orchestration | /architect → /coder → /reviewer → /documenter |
| "Build a feature..." | ✅ Auto-start orchestration | /architect → /coder → /reviewer → /documenter |
| "Implement..." | ✅ Auto-start orchestration | /architect → /coder → /reviewer → /documenter |
| "Review this code..." | ✅ Auto-launch /reviewer | /reviewer only |
| "Optimize this..." | ✅ Auto-launch /reviewer then /coder | /reviewer → /coder |
| "Document this..." | ✅ Auto-launch /documenter | /documenter only |
| "Fix this bug..." | ✅ Auto-launch /reviewer | /reviewer → /coder (if needed) |

## Notes & Preferences

- User prefers **AUTOMATIC orchestration** - no manual agent invocation needed
- User wants **MANDATORY parallel execution** when possible for maximum speed
- **CRITICAL**: For multiple independent tasks, use ONE message with multiple Task calls (never sequential messages)
- Always follow the orchestration guide for consistency
- Quality over speed - never skip the review phase
- Documentation is not optional - it's part of delivery
- **Version control is mandatory - commit at every milestone**
- **Show clear progress** through each orchestration phase
- **Always look for parallelization opportunities** before starting any multi-task work
- **ALWAYS verify Account ID before authentication setup** - prevents hours of debugging
- **AUTOMATICALLY query NetSuite via REST API** when user requests data (if account is ✅ READY)
- **Prefer REST API over MCP** for all NetSuite data queries

---

**Last Updated**: 2025-10-16
**Project Status**: Active Development
**Primary Technology**: NetSuite SuiteScript 2.1
**Methodology**: Orchestrated AI Agent Development with Parallel Execution
**MCP Integration**: Documented requirements and troubleshooting for NetSuite AI Connector Service
**OAuth2 Troubleshooting**: Comprehensive guide for resolving authentication errors added 2025-10-15
**Account ID Verification**: Mandatory verification process and automation added 2025-10-15
**REST API Auto-Query**: Automatic NetSuite data query system with trigger keywords added 2025-10-15
**NetSuite Integration Knowledge Base**: Comprehensive REST API guides added 2025-10-16 (`docs/netsuite-integration/`)
