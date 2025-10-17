# NetSuite Multi-Company Workflow Guide

## Daily Development Workflow

### Starting Work on a New Feature

1. **Pull latest code from Git**
   ```bash
   git pull origin main
   ```

2. **Create feature branch** (optional but recommended)
   ```bash
   git checkout -b feature/[COMPANY]-[feature-name]
   # Example: git checkout -b feature/HMP-Global-invoice-automation
   ```

3. **Import latest from NetSuite** (if needed)
   ```bash
   cd companies/[COMPANY-NAME]
   npx suitecloud object:import
   npx suitecloud file:import
   ```

4. **Make your changes** in VSCode

5. **Test locally** (validate before deploying)
   ```bash
   npx suitecloud project:validate
   ```

6. **Deploy to Sandbox** (test first!)
   ```bash
   npx suitecloud project:deploy
   ```

7. **Test in NetSuite UI**

8. **Commit changes**
   ```bash
   git add .
   git commit -m "feat([COMPANY]): [description]"
   ```

9. **Push to remote**
   ```bash
   git push origin [branch-name]
   ```

---

## Multi-Company Workflow

### Working Across Multiple Companies

**Best Practice**: Work on one company at a time to avoid confusion.

**Using VSCode Multi-Root Workspace**:
1. Open `netsuite.code-workspace`
2. Each company appears as a separate folder
3. Navigate between companies using the Explorer sidebar

**Quick Company Switching**:
```bash
# Option 1: Use automation scripts
./scripts/deploy-to-company.sh [COMPANY]

# Option 2: Navigate manually
cd companies/[COMPANY]
npx suitecloud project:deploy
```

---

## Deployment Workflow

### Development → Sandbox → Production

#### Phase 1: Development
```bash
# Make changes locally
# Validate
npx suitecloud project:validate
```

#### Phase 2: Sandbox Testing
```bash
# Deploy to sandbox
cd companies/[COMPANY]
npx suitecloud project:deploy

# Test thoroughly in NetSuite
# Fix any issues
# Redeploy if needed
```

#### Phase 3: Production Deployment
```bash
# Switch to production credentials
# (Update .env or use environment switcher)

# Final validation
npx suitecloud project:validate

# Backup reminder
echo "REMINDER: Backup production before deploying!"

# Deploy to production
npx suitecloud project:deploy

# Monitor for issues
```

---

## Git Workflow

### Branch Strategy

```
main (production-ready)
├── develop (integration branch)
├── feature/[COMPANY]-[feature-name]
├── hotfix/[COMPANY]-[issue]
└── release/[version]
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Tooling/config changes

**Scope**: Company name (ABA-CON, HMP-Global, etc.)

**Examples**:
```bash
git commit -m "feat(HMP-Global): Add deferred revenue automation

- Implements Map/Reduce script for revenue recognition
- Processes 10k+ transactions efficiently
- Includes comprehensive error handling

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Automation Scripts

### Quick Reference

```bash
# Deploy to specific company
./scripts/deploy-to-company.sh HMP-Global

# Validate all companies
./scripts/validate-all-companies.sh

# Import from NetSuite
./scripts/import-from-company.sh ABA-CON objects

# Show deployment dashboard
./scripts/deployment-status.sh
```

See [scripts/README.md](../scripts/README.md) for full documentation.

---

## VSCode Tasks

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Run Task":

- **Deploy to Current Company** - Deploy active company
- **Validate Current Company** - Validate active project
- **Import Objects from NetSuite** - Pull objects
- **Import Files from NetSuite** - Pull files
- **Validate All Companies** - Check all projects
- **Deployment Status Dashboard** - View status

---

## Common Scenarios

### Scenario 1: New Script Development

1. Create script in `companies/[COMPANY]/src/FileCabinet/SuiteScripts/`
2. Create script deployment XML in `companies/[COMPANY]/src/Objects/`
3. Update `manifest.xml` if needed
4. Validate: `npx suitecloud project:validate`
5. Deploy: `npx suitecloud project:deploy`
6. Test in NetSuite
7. Commit to Git

### Scenario 2: Modifying Existing Script

1. Import latest: `npx suitecloud file:import`
2. Modify script locally
3. Validate: `npx suitecloud project:validate`
4. Deploy: `npx suitecloud project:deploy`
5. Test in NetSuite
6. Commit to Git

### Scenario 3: Importing Custom Records

```bash
npx suitecloud object:import --type customrecordtype --scriptid [id]
```

### Scenario 4: Bulk Import All Objects

```bash
npx suitecloud object:import
# Select object types to import
# Wait for import to complete
# Review imported files
# Commit to Git
```

### Scenario 5: Working with Multiple Developers

```bash
# Morning: Pull latest changes
git pull origin main

# Before deploying: Check for conflicts
git status

# After deploying: Push changes
git add .
git commit -m "feat([COMPANY]): [description]"
git push origin main
```

---

## Troubleshooting

### Authentication Issues

```bash
# Re-authenticate
cd companies/[COMPANY]
npx suitecloud account:setup

# Check authentication status
npx suitecloud account:manageauth
```

### Validation Errors

```bash
# Check specific errors
npx suitecloud project:validate

# Common fixes:
# - Check manifest.xml is up to date
# - Verify deploy.xml includes all artifacts
# - Check for syntax errors in scripts
# - Ensure all dependencies are included
```

### Deployment Failures

```bash
# Check deployment status
npx suitecloud project:deploy --log debug

# Common issues:
# - Script already exists (need to update, not create)
# - Missing dependencies
# - Insufficient permissions
# - NetSuite account features not enabled
```

### Git Conflicts

```bash
# View conflicts
git status

# Resolve conflicts manually
# Edit files to remove conflict markers

# Mark as resolved
git add [resolved-file]
git commit
```

---

## Best Practices

### DO ✅
- ✅ Always validate before deploying
- ✅ Test in sandbox before production
- ✅ Commit frequently with meaningful messages
- ✅ Use feature branches for significant changes
- ✅ Import latest from NetSuite before making changes
- ✅ Keep company folders isolated
- ✅ Use automation scripts when possible
- ✅ Document custom scripts and objects

### DON'T ❌
- ❌ Never deploy untested code to production
- ❌ Never commit credentials or .env files
- ❌ Never work directly in production without testing
- ❌ Never skip validation
- ❌ Never mix files between companies
- ❌ Never force push without team coordination
- ❌ Never hardcode account IDs or internal IDs

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Deploy | `npx suitecloud project:deploy` |
| Validate | `npx suitecloud project:validate` |
| Import Objects | `npx suitecloud object:import` |
| Import Files | `npx suitecloud file:import` |
| List Objects | `npx suitecloud object:list` |
| Check Auth | `npx suitecloud account:manageauth` |
| Help | `npx suitecloud --help` |

---

**Last Updated**: 2025-10-15
