# Multi-Company NetSuite Setup Guide

Your NetSuite project is configured to manage **multiple companies** with separate SDF projects for each.

## Project Structure

```
Netsuite/
├── .claude/agents/              # Shared: 4 Elite agents
├── companies/
│   ├── ABA-CON/                # ✅ First company (configured)
│   │   ├── .env                # Credentials (not in git)
│   │   ├── .sdfcli.json        # Auth config (not in git)
│   │   ├── src/                # ABA-CON customizations
│   │   └── README.md
│   ├── COMPANY-2/              # Future company
│   └── COMPANY-3/              # Future company
├── shared/                      # (Optional) Shared utilities
└── MULTI-COMPANY-GUIDE.md      # This file
```

---

## ✅ ABA-CON (Configured)

**Account ID**: 8606430
**Location**: `companies/ABA-CON/`
**Status**: Ready to use

### Next Steps for ABA-CON:

1. **Complete setup** (one-time):
   ```bash
   cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\ABA-CON"
   suitecloud account:setup
   ```

   Copy credentials from `.env` file when prompted.

2. **Import existing customizations**:
   ```bash
   suitecloud object:import
   ```

3. **Start developing**!

See: [companies/ABA-CON/README.md](companies/ABA-CON/README.md)

---

## 🆕 Adding a New Company

### Step 1: Create Company Directory

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite"
mkdir -p companies/COMPANY-NAME
cd companies/COMPANY-NAME
```

### Step 2: Initialize SDF Project

```bash
suitecloud project:create --type ACCOUNTCUSTOMIZATION --projectname COMPANY-NAME --overwrite
```

### Step 3: Create Credentials File

Create `companies/COMPANY-NAME/.env`:
```bash
# COMPANY-NAME NetSuite Credentials
NS_ACCOUNT_ID=your_account_id
NS_TOKEN_ID=your_token_id
NS_TOKEN_SECRET=your_token_secret
NS_CONSUMER_KEY=your_consumer_key
NS_CONSUMER_SECRET=your_consumer_secret
```

### Step 4: Setup Authentication

```bash
cd companies/COMPANY-NAME
suitecloud account:setup
```

Enter credentials from `.env` file when prompted.

### Step 5: Test Connection

```bash
suitecloud project:validate
```

### Step 6: Import Customizations

```bash
suitecloud object:import
suitecloud file:import
```

---

## 🔄 Working with Multiple Companies

### Switch Between Companies

Each company has its own isolated project:

```bash
# Work on ABA-CON
cd companies/ABA-CON
suitecloud object:import

# Switch to another company
cd ../COMPANY-2
suitecloud object:import
```

### Deploy to Specific Company

```bash
# Deploy to ABA-CON
cd companies/ABA-CON
suitecloud project:deploy

# Deploy to COMPANY-2
cd ../COMPANY-2
suitecloud project:deploy
```

### Run Commands for All Companies

Create a script to run commands across all companies:

```bash
# Example: Import objects from all companies
for company in companies/*/; do
  echo "Processing $company"
  cd "$company"
  suitecloud object:import
  cd ../..
done
```

---

## 📋 Company Checklist Template

When adding a new company, complete this checklist:

### Pre-Setup (In NetSuite)
- [ ] Enable SuiteCloud Development Framework
- [ ] Enable Token-Based Authentication
- [ ] Create Integration Record (get Consumer Key/Secret)
- [ ] Create Access Token (get Token ID/Secret)
- [ ] Note Account ID

### Project Setup
- [ ] Create company directory: `companies/COMPANY-NAME/`
- [ ] Initialize SDF project
- [ ] Create `.env` file with credentials
- [ ] Run `suitecloud account:setup`
- [ ] Test connection: `suitecloud project:validate`
- [ ] Import objects: `suitecloud object:import`
- [ ] Import files: `suitecloud file:import`
- [ ] Create `README.md` with company-specific notes

### Verify
- [ ] Can import objects successfully
- [ ] Can deploy changes
- [ ] Credentials secured (not in git)
- [ ] Team members have access (if applicable)

---

## 🔐 Security Best Practices

### Credentials Management

1. **Never commit credentials**:
   - `.env` files are in `.gitignore`
   - `.sdfcli.json` files are in `.gitignore`

2. **Rotate tokens periodically**:
   - Update in NetSuite: Setup > Access Tokens
   - Update `.env` file
   - Re-run `suitecloud account:setup`

3. **Use environment-specific tokens**:
   - Sandbox: Development tokens
   - Production: Production tokens (separate)

4. **Limit token permissions**:
   - Use roles with minimal required permissions
   - Avoid using Administrator role in production

### Git Best Practices

```bash
# Verify credentials won't be committed
git status

# Should NOT see:
# - .env files
# - .sdfcli.json files

# If they appear, add to .gitignore immediately
```

---

## 🤖 Using Elite Agent Framework with Multiple Companies

Your 4 world-class agents work across all companies:

```bash
# Architecture Design for ABA-CON
"Use claude-architect agent to design order approval workflow for companies/ABA-CON"

# Code Implementation
"Use claude-coder agent to implement the approved architecture for companies/ABA-CON"

# Code Review for specific company
"Use claude-reviewer agent to audit companies/ABA-CON/src/FileCabinet/SuiteScripts/custom_script.js"

# Documentation
"Use claude-documenter agent to create complete documentation for companies/COMPANY-2"
```

**Orchestration Flow**: Architect → Coder → Reviewer → Documenter

---

## 📊 Company Summary

| Company | Account ID | Status | Scripts | Objects | Last Deploy |
|---------|------------|--------|---------|---------|-------------|
| ABA-CON | 8606430    | ✅ Active | - | - | Not deployed yet |
| COMPANY-2 | -        | ⬜ Not setup | - | - | - |
| COMPANY-3 | -        | ⬜ Not setup | - | - | - |

---

## 🛠️ Common Commands

### For Each Company

Run these from `companies/COMPANY-NAME/` directory:

**Development**:
```bash
suitecloud object:import          # Pull latest from NetSuite
suitecloud file:import            # Pull files from File Cabinet
suitecloud project:validate       # Check for errors
suitecloud project:deploy         # Deploy to NetSuite
```

**Troubleshooting**:
```bash
suitecloud account:manageauth     # Manage authentication
suitecloud object:list            # List available objects
suitecloud --help                 # Get help
```

---

## 📁 Organizing Shared Code

If you have scripts/utilities used across multiple companies:

### Option 1: Shared Directory (Recommended)

```
Netsuite/
├── shared/
│   ├── libraries/
│   │   └── common_utils.js
│   └── templates/
│       └── standard_workflow.xml
└── companies/
    ├── ABA-CON/
    │   └── src/FileCabinet/SuiteScripts/
    │       └── custom_script.js (imports from shared)
    └── COMPANY-2/
        └── src/FileCabinet/SuiteScripts/
            └── custom_script.js (imports from shared)
```

### Option 2: Copy Per Company

Duplicate shared code in each company project (easier for deployment).

### Option 3: Git Submodules

Use Git submodules for truly shared libraries across repos.

---

## 🔄 Deployment Strategy

### Development Workflow

1. **Develop in Sandbox**:
   - Each company should have sandbox account
   - Use sandbox credentials during development

2. **Test thoroughly**:
   ```bash
   cd companies/ABA-CON
   suitecloud project:validate
   ```

3. **Deploy to Sandbox**:
   ```bash
   suitecloud project:deploy
   ```

4. **Test in Sandbox UI**

5. **Switch to Production credentials**:
   - Update `.env` with production tokens
   - Re-run `suitecloud account:setup`

6. **Deploy to Production**:
   ```bash
   suitecloud project:deploy
   ```

### Production Deployment Best Practices

- ✅ Always test in sandbox first
- ✅ Use version control (Git tags/releases)
- ✅ Deploy during off-hours
- ✅ Have rollback plan ready
- ✅ Monitor after deployment
- ❌ Never deploy untested code to production

---

## 📞 Support

- **SuiteCloud CLI**: `suitecloud --help`
- **Company-specific**: See `companies/COMPANY-NAME/README.md`
- **AI Agents**: Use your 4 elite agents in `.claude/agents/`
- **NetSuite Docs**: https://docs.oracle.com/en/cloud/saas/netsuite/

---

## 🎯 Next Steps

### For ABA-CON (Your First Company):

1. **Complete authentication**:
   ```bash
   cd companies/ABA-CON
   suitecloud account:setup
   ```

2. **Import existing customizations**:
   ```bash
   suitecloud object:import
   ```

3. **Start developing with your AI agents**!

### When Adding New Companies:

1. Follow the "Adding a New Company" section above
2. Use ABA-CON as a template
3. Keep this guide updated with new companies

---

**Your multi-company NetSuite development environment is ready!** 🚀
