# Pier Assets Management - NetSuite Project

This project contains the NetSuite SuiteScript customizations for Pier Assets Management.

## Company Information
- **Company Name**: Pier Assets Management
- **Environment**: TBD (Production/Sandbox)
- **Account ID**: ⚠️ **Not Verified** - Must be verified before authentication setup

## Project Structure

```
Pier-Assets-Management/
├── src/                           # Source files
│   ├── FileCabinet/              # File Cabinet contents
│   │   └── SuiteScripts/         # SuiteScript files
│   ├── Objects/                  # Custom objects (workflows, fields, forms)
│   ├── AccountConfiguration/     # Account-specific configuration
│   ├── Translations/             # Translation files
│   ├── manifest.xml              # Project manifest
│   └── deploy.xml                # Deployment configuration
├── docs/                         # Documentation
│   ├── setup/                    # Setup guides
│   ├── features/                 # Feature documentation
│   ├── deployment/               # Deployment guides
│   └── testing/                  # Test plans and results
├── .credentials/                 # 🔒 NEVER COMMIT - Auth credentials
├── suitecloud.config.js          # SuiteCloud configuration
└── README.md                     # This file
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- SuiteCloud CLI installed globally: `npm install -g @oracle/suitecloud-cli`
- Java 21 installed (required for SuiteCloud CLI)
- NetSuite account access

### Step 1: Verify Account ID

**⚠️ CRITICAL: Complete this BEFORE any authentication setup!**

```bash
# From project root, run verification tool
cd ../..
node verify-account-ids.js
```

If Account ID shows ⚠️ warning:
1. Log into Pier Assets Management NetSuite account
2. Navigate to: **Setup → Company → Company Information**
3. Copy the **Account ID** displayed there
4. Update `ACCOUNT-IDS.md` in project root
5. Run verification tool again

**DO NOT proceed with authentication until Account ID is verified ✅**

See: [Account ID Verification Guide](../../docs/setup/ACCOUNT-ID-VERIFICATION.md)

### Step 2: Configure Authentication

Choose one of these authentication methods:

#### Option A: Token-Based Authentication (TBA) - Recommended ⭐

**Best for:** REST API access, data queries, simple setup

```bash
# Setup guide
See: docs/setup/TBA-SETUP-GUIDE.md (to be created)
```

**Advantages:**
- ✅ Simpler setup (no certificates)
- ✅ Faster authentication
- ✅ Perfect for REST API queries
- ✅ Better error messages

#### Option B: SuiteCloud Development Framework (SDF)

**Best for:** Deploying customizations, object management

```bash
# Authenticate with NetSuite
suitecloud account:setup
```

Follow prompts to configure:
- Account ID (verified in Step 1)
- Authentication method (TBA recommended)
- Role (Administrator or Developer)

### Step 3: Import Existing Customizations (Optional)

```bash
# Import all SuiteScripts
suitecloud object:import --type file --scriptid customscript_*

# Import custom objects
suitecloud object:import --type customrecord --scriptid customrecord_*

# Import workflows
suitecloud object:import --type workflow --scriptid customworkflow_*
```

## Development Workflow

### Creating New SuiteScripts

1. Place scripts in: `src/FileCabinet/SuiteScripts/`
2. Follow SuiteScript 2.1 standards (see project standards)
3. Test in sandbox before production deployment

### Deploying to NetSuite

```bash
# Validate project
suitecloud project:validate

# Deploy to NetSuite
suitecloud project:deploy

# Deploy specific files
suitecloud file:upload --paths /SuiteScripts/your_script.js
```

### Querying NetSuite Data

#### Using REST API (Token-Based Auth)

**Status:** ⚠️ Not Configured

Once TBA is configured, you can query NetSuite data:

```bash
# Query customer records
node test-netsuite-records.js

# See available query scripts
ls *.js
```

**Setup Required:**
1. Create Integration Record in NetSuite
2. Generate Access Token
3. Configure test scripts
4. See: `docs/setup/REST-API-SETUP.md` (to be created)

## Documentation Index

### Setup & Configuration
- [ ] TBA Setup Guide (to be created)
- [ ] REST API Setup Guide (to be created)
- [ ] SDF Authentication Guide (to be created)
- [ ] Account ID Verification Guide (in project root)

### Features
*No features documented yet*

### Deployment
- [ ] Deployment Checklist (to be created)
- [ ] Production Deployment Guide (to be created)

### Testing
- [ ] Test Plan Template (to be created)
- [ ] Test Data Setup Guide (to be created)

## SuiteScript 2.1 Standards

All scripts MUST follow:
- ✅ SuiteScript 2.1 only (not 1.0 or 2.0)
- ✅ AMD module pattern with `define()`
- ✅ Comprehensive error handling (try/catch)
- ✅ Governance optimization (<1000 units when possible)
- ✅ NetSuite logging (`log.audit`, `log.debug`, `log.error`)
- ✅ Script parameters (no hardcoded values)
- ✅ JSDoc documentation on all functions
- ✅ Field-level input validation

See: [Project Code Standards](../../docs/standards/CODE-STANDARDS.md)

## Security Best Practices

### Protected Files (NEVER COMMIT)
```
.credentials/           # All authentication credentials
*.pem                  # Private keys
mcp-env.json           # MCP credentials
test-netsuite-*.js     # Contains tokens/secrets
.env*                  # Environment variables
```

**These are auto-ignored by `.gitignore`** ✅

### Before Committing
- [ ] No hardcoded Account IDs
- [ ] No authentication tokens in code
- [ ] No customer/sensitive data
- [ ] Scripts use parameter/config files

## Git Workflow

### Commit Convention
```bash
# Format: <type>(<scope>): <subject>
feat(Pier-Assets-Management): Add invoice processing script
fix(Pier-Assets-Management): Correct date calculation bug
docs(Pier-Assets-Management): Add deployment guide
refactor(Pier-Assets-Management): Optimize governance units
```

### Before Deployment
```bash
# Always commit changes first
git status
git add .
git commit -m "feat(Pier-Assets-Management): [description]"
git push origin main
```

## Available Tools

### Verification Tools
- `../../verify-account-ids.js` - Verify Account ID before auth setup

### Query Tools (After REST API Setup)
- `test-netsuite-records.js` - Query any NetSuite record type
- `test-netsuite-api.js` - General API testing

### Import/Export Tools
- `suitecloud object:import` - Import from NetSuite
- `suitecloud file:import` - Import files from File Cabinet

## Next Steps

**Complete these setup tasks:**

1. ✅ **Verify Account ID**
   - Run `../../verify-account-ids.js`
   - Update ACCOUNT-IDS.md if needed

2. ⬜ **Choose Authentication Method**
   - Option A: Token-Based Auth (REST API)
   - Option B: SDF Authentication

3. ⬜ **Import Existing Customizations**
   - Import scripts, workflows, custom records

4. ⬜ **Set Up Documentation**
   - Create setup guides in `docs/setup/`
   - Document existing features in `docs/features/`

5. ⬜ **Configure Development Workflow**
   - Set up Git branching strategy
   - Define deployment process
   - Create test environment

## Support

For issues or questions:
- Check project documentation in `docs/`
- Review troubleshooting guides
- Contact NetSuite administrator

## License

This project is proprietary to Pier Assets Management and should not be shared outside the organization.

---

**Project Created**: 2025-10-17
**Last Updated**: 2025-10-17
**Status**: Initial Setup
**Primary Technology**: NetSuite SuiteScript 2.1
