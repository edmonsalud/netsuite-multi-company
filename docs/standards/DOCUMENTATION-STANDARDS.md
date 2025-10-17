# NetSuite Documentation Standards

## Purpose

This guide defines where and how to organize documentation in the multi-company NetSuite workspace to ensure consistency, discoverability, and maintainability.

---

## Documentation Structure

### Universal Documentation (`docs/`)

Documentation that applies to **ALL companies** goes in the root `docs/` directory.

```
docs/
├── setup/              # Setup & onboarding guides
├── workflow/           # Development workflows
├── standards/          # Standards & conventions
└── troubleshooting/    # Common issues & solutions
```

### Company-Specific Documentation (`companies/[COMPANY]/docs/`)

Documentation specific to **ONE company** goes in that company's `docs/` subfolder.

```
companies/[COMPANY]/
├── docs/
│   ├── features/       # Feature-specific documentation
│   ├── deployment/     # Deployment guides & checklists
│   ├── testing/        # Test plans & results
│   ├── security/       # Security reports & audits
│   └── setup/          # Company-specific setup
├── src/                # Scripts & objects
└── README.md           # Company overview
```

---

## Decision Tree: Where Does This Doc Go?

### Step 1: Universal or Company-Specific?

**Ask: "Does this apply to all companies, or just one?"**

#### Universal → `docs/[category]/`
Examples:
- Authentication setup process
- SuiteScript coding standards
- Git workflow guide
- File naming conventions
- General troubleshooting

#### Company-Specific → `companies/[COMPANY]/docs/[category]/`
Examples:
- Deferred Revenue feature for HMP-Global
- Contact Print customization for ABA-CON
- PO Payment Schedule for HBNO
- Role analysis for HBNO
- Company-specific deployment checklist

### Step 2: What Category?

| Category | Purpose | Examples |
|----------|---------|----------|
| `setup/` | Onboarding, installation, configuration | BEGINNER-GUIDE, COMPLETE-SETUP, AUTHENTICATION-SETUP |
| `workflow/` | Development processes | WORKFLOW-GUIDE, DEPLOYMENT-GUIDE, GIT-WORKFLOW |
| `standards/` | Conventions & best practices | FILE-NAMING-STANDARDS, CODE-STANDARDS |
| `troubleshooting/` | Common issues & solutions | AUTHENTICATION-ISSUES, DEPLOYMENT-ERRORS |
| `features/` | Feature documentation | [FEATURE]_DOCUMENTATION, [FEATURE]_ARCHITECTURE |
| `deployment/` | Deployment guides | DEPLOYMENT_CHECKLIST, DEPLOYMENT_HISTORY |
| `testing/` | Test plans & results | TEST_PLAN, TEST_RESULTS |
| `security/` | Security & audit reports | ROLE_ANALYSIS, SOD_VIOLATIONS, SECURITY_ASSESSMENT |

---

## File Naming Conventions

### Universal Documentation

**Format**: `[DESCRIPTIVE_NAME].md`

Examples:
- `AUTHENTICATION-SETUP.md`
- `WORKFLOW-GUIDE.md`
- `FILE-NAMING-STANDARDS.md`
- `TROUBLESHOOTING-DEPLOYMENT.md`

**Rules**:
- ALL CAPS with hyphens
- Descriptive and concise
- No company names
- No version numbers

### Company-Specific Documentation

#### Feature Documentation

**Format**: `[FEATURE_NAME]_[TYPE].md`

Types:
- `_DOCUMENTATION.md` - Complete feature documentation
- `_ARCHITECTURE.md` - Architecture & design
- `_RUNBOOK.md` - Operational runbook
- `_API.md` - API documentation

Examples:
- `DEFERRED_REVENUE_DOCUMENTATION.md`
- `CONTACT_PRINT_ARCHITECTURE.md`
- `PO_PAYMENT_SCHEDULE_RUNBOOK.md`
- `INVOICE_EXTRACTOR_API.md`

#### Deployment Documentation

**Format**: `DEPLOYMENT_[PURPOSE].md`

Examples:
- `DEPLOYMENT_CHECKLIST.md`
- `DEPLOYMENT_HISTORY.md`
- `DEPLOYMENT_INSTRUCTIONS.md`

#### Testing Documentation

**Format**: `TEST_[PURPOSE]_[FEATURE].md`

Examples:
- `TEST_PLAN_DEFERRED_REVENUE.md`
- `TEST_RESULTS_PO_SCHEDULE.md`
- `TEST_DATA_SETUP.md`

#### Security Documentation

**Format**: `[TOPIC]_[TYPE].md`

Examples:
- `ROLE_ANALYSIS_REPORT.md`
- `SOD_VIOLATIONS_REPORT.md`
- `SECURITY_ASSESSMENT.md`
- `EXTERNAL_VENDOR_ACCESS_REPORT.md`

#### Setup Documentation

**Format**: `[SCOPE]_[PURPOSE].md`

Examples:
- `QUICK-START.md`
- `COMPLETE-SETUP.md`
- `IMPORT-GUIDE.md`

---

## Documentation Requirements

### All Documentation MUST Include

1. **Title** - Clear, descriptive H1
2. **Purpose** - Brief overview of what this doc covers
3. **Date Created** - When was this written
4. **Last Updated** - When was this last modified
5. **Author/Contact** - Who created this (can be "Claude Code")
6. **Table of Contents** - For docs >500 lines

### Feature Documentation MUST Include

1. **Executive Summary** - Business value & purpose
2. **Technical Overview** - How it works
3. **Architecture Diagram** - Visual representation (if applicable)
4. **Deployment Guide** - Step-by-step deployment
5. **Testing Guide** - How to test
6. **Troubleshooting** - Common issues & solutions
7. **Maintenance** - Ongoing maintenance requirements

### Test Documentation MUST Include

1. **Test Scope** - What's being tested
2. **Test Cases** - Detailed test scenarios
3. **Expected Results** - What should happen
4. **Actual Results** - What actually happened
5. **Status** - Pass/Fail/Blocked
6. **Environment** - Where was this tested

---

## Company README.md Standards

Each company's `README.md` MUST include:

```markdown
# [COMPANY-NAME] - NetSuite SDF Project

## Company Information
- Account ID
- Account Type (Sandbox/Production)
- Authentication Status

## Quick Start
- Deploy command
- Import command
- Validate command

## Documentation Index
### Features
- [Feature 1](docs/features/FEATURE1_DOCUMENTATION.md)
- [Feature 2](docs/features/FEATURE2_DOCUMENTATION.md)

### Deployment
- [Deployment Checklist](docs/deployment/DEPLOYMENT_CHECKLIST.md)

### Testing
- [Test Plan](docs/testing/TEST_PLAN.md)

## Scripts Inventory
- List of scripts

## Custom Objects
- List of custom objects

## Deployment History
- Recent deployments

## Contacts
- Admin, developer contacts
```

---

## Documentation Workflow

### When Creating New Documentation

1. **Determine Scope**: Universal or company-specific?
2. **Choose Category**: setup, workflow, features, etc.
3. **Name File**: Follow naming conventions
4. **Create File**: In correct directory
5. **Add Content**: Include required sections
6. **Update Index**: Add link to company README.md
7. **Commit**: With descriptive message

### Example: New Feature Documentation

```bash
# Feature: Invoice Automation for HMP-Global

# 1. Create documentation file
companies/HMP-Global/docs/features/INVOICE_AUTOMATION_DOCUMENTATION.md

# 2. Create architecture doc
companies/HMP-Global/docs/features/INVOICE_AUTOMATION_ARCHITECTURE.md

# 3. Create runbook
companies/HMP-Global/docs/features/INVOICE_AUTOMATION_RUNBOOK.md

# 4. Update README.md
# Add links under ## Documentation Index > ### Features

# 5. Commit
git add .
git commit -m "docs(HMP-Global): Add Invoice Automation documentation"
```

---

## Documentation Maintenance

### Regular Reviews

- **Monthly**: Review and update deployment histories
- **Quarterly**: Review feature docs for accuracy
- **After each deployment**: Update deployment checklist
- **After major changes**: Update architecture docs

### Deprecation

When a feature is deprecated:

1. Add `[DEPRECATED]` prefix to filename
2. Add deprecation notice at top of file
3. Move to `docs/archive/` subfolder
4. Update README.md to remove from active list

Example:
```
companies/HMP-Global/docs/archive/[DEPRECATED]_OLD_FEATURE_DOCUMENTATION.md
```

---

## Templates

### Feature Documentation Template

```markdown
# [Feature Name] - Documentation

**Company**: [COMPANY-NAME]
**Created**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD
**Author**: [Name/Claude Code]
**Status**: [Active/Deprecated/In Development]

## Executive Summary

[Business value and purpose]

## Technical Overview

[How it works]

## Architecture

[Architecture details or link to architecture doc]

## Deployment

[Deployment instructions]

## Testing

[Testing procedures]

## Troubleshooting

[Common issues]

## Maintenance

[Ongoing maintenance]
```

### Test Plan Template

```markdown
# Test Plan - [Feature Name]

**Company**: [COMPANY-NAME]
**Feature**: [Feature Name]
**Environment**: [Sandbox/Production]
**Date**: YYYY-MM-DD
**Tester**: [Name]

## Test Scope

[What's being tested]

## Test Cases

### TC-001: [Test Case Name]
- **Description**: [What this tests]
- **Prerequisites**: [Setup required]
- **Steps**:
  1. [Step 1]
  2. [Step 2]
- **Expected Result**: [What should happen]
- **Actual Result**: [What happened]
- **Status**: [Pass/Fail/Blocked]
```

---

## Automation with Claude Code

When using `/documenter` agent, documentation will be automatically placed according to these standards:

1. Agent determines if universal or company-specific
2. Agent chooses appropriate category
3. Agent names file according to conventions
4. Agent creates file in correct location
5. Agent updates company README.md
6. Agent suggests commit message

**No manual organization needed!**

---

## Quick Reference

| Documentation Type | Universal Location | Company Location |
|-------------------|-------------------|------------------|
| Setup Guides | `docs/setup/` | `companies/[CO]/docs/setup/` |
| Workflows | `docs/workflow/` | N/A |
| Standards | `docs/standards/` | N/A |
| Feature Docs | N/A | `companies/[CO]/docs/features/` |
| Deployment | N/A | `companies/[CO]/docs/deployment/` |
| Testing | N/A | `companies/[CO]/docs/testing/` |
| Security | N/A | `companies/[CO]/docs/security/` |

---

## Examples

### ✅ Good Examples

```
# Universal
docs/setup/AUTHENTICATION-SETUP.md
docs/workflow/DEPLOYMENT-GUIDE.md
docs/standards/CODE-STANDARDS.md

# Company-Specific
companies/HMP-Global/docs/features/DEFERRED_REVENUE_DOCUMENTATION.md
companies/ABA-CON/docs/features/CONTACT_PRINT_ARCHITECTURE.md
companies/HBNO/docs/testing/TEST_PLAN_PO_SCHEDULE.md
companies/HBNO/docs/security/ROLE_ANALYSIS_REPORT.md
```

### ❌ Bad Examples

```
# Don't put company-specific docs in root
docs/HMP-Global-deferred-revenue.md

# Don't mix categories
companies/HMP-Global/DEFERRED_REVENUE_TEST_PLAN.md

# Don't use poor naming
companies/HBNO/doc1.md
companies/ABA-CON/new_feature_v2.md
```

---

**Last Updated**: 2025-10-15
**Status**: Active
**Maintained By**: Claude Code
