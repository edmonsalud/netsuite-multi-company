# NetSuite Integration Knowledge Base

> **Purpose**: Centralized documentation for NetSuite REST API integration with Claude Code
> **Created**: 2025-10-16
> **Status**: Active - Keep Updated

## Overview

This knowledge base contains production-validated patterns, troubleshooting guides, and best practices for integrating Claude Code with NetSuite via REST API.

**All documentation is automatically available to Claude Code in future sessions.**

---

## Documentation Index

### 1. [NetSuite REST API Guide](./NETSUITE-REST-API-GUIDE.md)

**Purpose**: Complete reference for NetSuite REST API integration

**Contains:**
- Authentication setup (OAuth 1.0a with Token-Based Auth)
- SuiteQL vs Record API comparison
- Common patterns and workflows
- Troubleshooting guide
- Best practices

**Use When:**
- Setting up new account authentication
- Debugging API connection issues
- Understanding SuiteQL vs Record API
- Need query examples

**Key Sections:**
- Authentication Setup
- Account ID Format (critical!)
- SuiteQL vs Record API
- Common Patterns
- Troubleshooting

---

### 2. [Employee Access Patterns](./EMPLOYEE-ACCESS-PATTERNS.md)

**Purpose**: Document proven methods for accessing employee records

**Contains:**
- The 10-agent parallel testing breakthrough
- SuiteQL endpoint discovery
- Complete working examples
- BUILTIN.DF() indirect access method

**Use When:**
- Need to access employee records
- Building employee ID mappings
- Updating employee fields
- User management tasks

**Key Discovery:**
```
✅ SuiteQL endpoint provides FULL employee access
❌ Record API blocks employee GET requests
```

**Breakthrough**: SuiteQL `SELECT * FROM employee` works perfectly!

---

### 3. [Bulk Update Patterns](./BULK-UPDATE-PATTERNS.md)

**Purpose**: Production-validated patterns for bulk record updates

**Contains:**
- Two-step update pattern (subsidiary first)
- CSV parsing with special character handling
- Progress tracking implementation
- Error handling strategies
- Complete working example

**Use When:**
- Bulk customer updates
- CSV imports
- Mass field updates
- Data migrations

**Key Pattern:**
```javascript
// Step 1: Set subsidiary (prevents 400 errors)
await update({ subsidiary: { id: '1' } });

// Step 2: Set other fields
await update({ salesRep: { id: '16' } });
```

**Production Stats:**
- 476 records processed
- 78.2% success rate
- ~3 seconds per record

---

### 4. [SDF Deployment Patterns](./SDF-DEPLOYMENT-PATTERNS.md)

**Purpose**: Critical patterns for NetSuite SuiteCloud Development Framework deployments

**Contains:**
- Wrong account deployment prevention
- Feature dependency configuration
- SDF XML troubleshooting
- Authentication management
- Deployment verification checklist

**Use When:**
- Setting up new SDF projects
- Deploying scripts to NetSuite
- Encountering deployment errors
- Multi-account configuration

**Key Issues Prevented:**
```
✅ Wrong Account ID in project.json
✅ Missing SERVERSIDESCRIPTING feature
✅ Invalid XML structure
✅ Authentication failures
```

**Time Saved**: 2-3 hours per deployment

---

### 5. [SuiteScript Development Patterns](./SUITESCRIPT-DEVELOPMENT-PATTERNS.md)

**Purpose**: Production-validated SuiteScript 2.1 development patterns

**Contains:**
- Intercompany transaction creation
- Vendor lookup for subsidiary transactions
- Mandatory field validation
- Dynamic vs standard record mode
- Search patterns for relationships

**Use When:**
- Developing User Event scripts
- Creating intercompany transactions
- Encountering INVALID_FLD_VALUE errors
- Encountering USER_ERROR for mandatory fields

**Key Pattern:**
```javascript
// Search vendor by ORIGINAL subsidiary
const vendorId = findVendorForSubsidiary(originalSubsidiary);

// Create bill in TARGET subsidiary
newBill.setValue({ fieldId: 'entity', value: vendorId });
newBill.setValue({ fieldId: 'subsidiary', value: targetSubsidiary });
```

**Production Validated**: Pier Assets Management intercompany automation

---

## Quick Reference

### Common Tasks

| Task | Documentation | Key Section |
|------|--------------|-------------|
| Set up REST API | REST API Guide | Authentication Setup |
| Deploy SuiteScript via SDF | SDF Deployment Patterns | Deployment Verification Checklist |
| Access employees | Employee Access Patterns | Method 1: Query All Employees |
| Bulk update customers | Bulk Update Patterns | Two-Step Update Pattern |
| Fix 401/403 errors | REST API Guide | Troubleshooting |
| Create intercompany transactions | SuiteScript Development Patterns | Intercompany Transaction Creation |
| Parse CSV files | Bulk Update Patterns | CSV Processing |
| Map employee names to IDs | Employee Access Patterns | Example 1 |
| Set up new SDF project | SDF Deployment Patterns | Account Authentication Management |

### Error Quick Reference

| Error | Guide | Section |
|-------|-------|---------|
| InvalidSignature | REST API Guide | Troubleshooting → InvalidSignature |
| 401 Unauthorized | REST API Guide | Troubleshooting → 401 |
| 403 Forbidden | REST API Guide | Troubleshooting → 403 |
| 400 Bad Request | Bulk Update Patterns | Two-Step Update Pattern |
| Employee not found | Employee Access Patterns | Access Methods |
| INVALID_FLD_VALUE | SuiteScript Development Patterns | Vendor Lookup for Subsidiary Transactions |
| USER_ERROR (mandatory fields) | SuiteScript Development Patterns | Mandatory Field Validation |
| Wrong account deployment | SDF Deployment Patterns | Wrong Account Deployment |
| Missing SERVERSIDESCRIPTING | SDF Deployment Patterns | Missing Feature Dependencies |
| XML validation failed | SDF Deployment Patterns | SDF XML Configuration Issues |

---

## Maintenance Guidelines

### When to Update Documentation

**ALWAYS update when:**
- New integration pattern discovered
- API endpoint behavior changes
- Authentication method changes
- Production validation of new pattern
- Bug fix or workaround found

### How to Update

1. **Edit the relevant guide** - Add new section or update existing
2. **Update changelog** - Add entry with date and change
3. **Update CLAUDE.md** - If major change, reference in main memory file
4. **Test the documentation** - Verify examples still work
5. **Commit changes** - Use conventional commit format

**Example commit:**
```bash
git commit -m "docs(integration): Add SuiteQL JOIN pattern to REST API Guide

- Document INNER JOIN syntax
- Add performance considerations
- Include working example

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Documentation Standards

All guides MUST include:
- ✅ Clear title and purpose
- ✅ Last updated date
- ✅ Table of contents
- ✅ Code examples that work
- ✅ When to use section
- ✅ Troubleshooting section
- ✅ Changelog at bottom

### Review Schedule

**Quarterly review** (or after major project):
- Verify all examples still work
- Check for outdated patterns
- Update with new learnings
- Archive deprecated methods

---

## Knowledge Base Philosophy

### Core Principles

1. **Production-Validated**: All patterns tested in real projects
2. **Complete Examples**: Full working code, not snippets
3. **Troubleshooting-First**: Document problems and solutions
4. **Discovery Process**: Include how solutions were found
5. **Maintained**: Update regularly, deprecate obsolete content

### What Belongs Here

✅ **Include:**
- REST API integration patterns
- Authentication and setup guides
- Common workflows and recipes
- Troubleshooting guides
- Performance optimization
- Error handling patterns

❌ **Don't Include:**
- SuiteScript 2.1 code (belongs in company docs)
- Company-specific configurations
- Business logic
- Deployment procedures

---

## Related Documentation

- **Main Memory File**: [`CLAUDE.md`](../../CLAUDE.md) - Project memory and preferences
- **Account Registry**: [`ACCOUNT-IDS.md`](../../ACCOUNT-IDS.md) - Verified account IDs
- **Company Docs**: `companies/[COMPANY]/docs/` - Company-specific documentation

---

## Success Metrics

Track these to measure knowledge base effectiveness:

- **Time to solution**: How quickly can issue be resolved using docs?
- **Discovery prevention**: Did docs prevent need for research?
- **Reuse rate**: How often are patterns reused?
- **Update frequency**: Is knowledge base staying current?

**Target**: 90% of integration issues resolvable via knowledge base

---

## Feedback & Contributions

This is a living knowledge base. When you discover:
- New patterns
- Better solutions
- Edge cases
- Performance optimizations

**Document them immediately!** Future Claude Code sessions will benefit.

---

**Status**: Active - Continuously Updated
**Next Review**: 2025-11-16 (1 month)
