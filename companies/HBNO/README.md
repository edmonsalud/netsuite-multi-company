# HBNO NetSuite Project

**Account ID**: [To be configured]
**Company**: HBNO
**Status**: 🆕 New Setup Required

## Quick Commands

All commands should be run from this directory:
```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\HBNO"
```

### Setup Account (First Time)
```bash
# Interactive setup (will prompt for credentials from .env file)
suitecloud account:setup
```

When prompted:
- **Account ID**: (from .env file)
- **Auth Method**: Token Authentication
- **Token ID**: (from .env file)
- **Token Secret**: (from .env file)
- **Consumer Key**: (from .env file)
- **Consumer Secret**: (from .env file)

### Common Operations

**Import objects from NetSuite**:
```bash
suitecloud object:import
```

**Import files from File Cabinet**:
```bash
suitecloud file:import
```

**Validate project (check for errors)**:
```bash
suitecloud project:validate
```

**Deploy to NetSuite**:
```bash
suitecloud project:deploy
```

**List available objects**:
```bash
suitecloud object:list
```

**Update specific object**:
```bash
suitecloud object:update --scriptid customscript_example
```

## Project Structure

```
HBNO/
├── .env                    # Credentials (DO NOT COMMIT)
├── .sdfcli.json           # Auth config (DO NOT COMMIT)
├── src/
│   ├── FileCabinet/       # Scripts and files
│   │   └── SuiteScripts/
│   ├── Objects/           # Custom objects (fields, records, scripts)
│   ├── AccountConfiguration/
│   ├── Translations/
│   ├── deploy.xml
│   └── manifest.xml
└── suitecloud.config.js
```

## Initial Setup Steps

### 1. Get NetSuite Credentials

Before you begin, you need to obtain the following from NetSuite:

1. **Account ID**: Found in NetSuite at Setup > Company > Company Information
2. **Enable Features**:
   - Setup > Company > Enable Features > SuiteCloud tab
   - ✅ SuiteCloud Development Framework
   - ✅ Token-Based Authentication
3. **Create Integration Record**:
   - Setup > Integration > Manage Integrations > New
   - Name: "SDF Development - HBNO"
   - ✅ Token-Based Authentication
   - Save and note the **Consumer Key** and **Consumer Secret**
4. **Create Access Token**:
   - Setup > Users/Roles > Access Tokens > New
   - Application Name: Select your integration
   - User: Select your user
   - Role: Administrator (or appropriate role)
   - Save and note the **Token ID** and **Token Secret**

### 2. Configure Credentials

Edit the `.env` file and add your actual credentials:

```bash
NS_ACCOUNT_ID=your_account_id
NS_TOKEN_ID=your_token_id
NS_TOKEN_SECRET=your_token_secret
NS_CONSUMER_KEY=your_consumer_key
NS_CONSUMER_SECRET=your_consumer_secret
```

### 3. Setup SuiteCloud Authentication

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\HBNO"
suitecloud account:setup
```

When prompted, enter the credentials from your `.env` file.

### 4. Test Connection

```bash
suitecloud project:validate
```

If successful, you're ready to start developing!

### 5. Import Existing Customizations (if applicable)

```bash
suitecloud object:import
suitecloud file:import
```

## Credentials

Credentials are stored in `.env` file (already in .gitignore).

To view credentials:
```bash
cat .env
```

**⚠️ NEVER commit `.env` or `.sdfcli.json` to git!**

## Getting Help

```bash
# View all commands
suitecloud --help

# Help for specific command
suitecloud object:import --help
```

## Troubleshooting

### "No account set up"
Run: `suitecloud account:setup`

### Authentication errors
1. Check credentials in `.env` file
2. Verify Token-Based Auth is enabled in NetSuite
3. Check token hasn't expired (rotate in NetSuite if needed)

### "Object does not exist"
Import it first: `suitecloud object:import`

### SuiteCloud CLI not found
Install globally: `npm install -g @oracle/suitecloud-cli`

## Development Workflow

1. **Import** existing objects from NetSuite
2. **Edit** files locally in your IDE
3. **Validate** your changes
4. **Deploy** to NetSuite
5. **Test** in NetSuite UI

## Security Documentation

### Security Assessments
- [Shared Accounts Security Assessment](docs/security/SHARED_ACCOUNTS_SECURITY_ASSESSMENT.md) - Comprehensive analysis of shared/generic accounts (SOX violations)
- [Shared Accounts Executive Summary](SHARED_ACCOUNTS_EXECUTIVE_SUMMARY.md) - Quick reference for CFO/Controller
- [Shared Accounts Analysis CSV](Shared_Generic_Accounts_Analysis.csv) - Detailed remediation steps for each account
- [Role Analysis Report](docs/security/ROLE_ANALYSIS_REPORT.md) - User role assignments and permissions
- [SOD Violations Report](docs/security/SOD_VIOLATIONS_REPORT.md) - Segregation of Duties analysis
- [Super User Analysis](docs/security/SUPER_USER_ANALYSIS.md) - Administrator and power user review
- [External Vendor Access Report](docs/security/EXTERNAL_VENDOR_ACCESS_REPORT.md) - Third-party access review
- [Shared Service Accounts Report](docs/security/SHARED_SERVICE_ACCOUNTS_REPORT.md) - Service account analysis

### Key Findings
- **5 SOX violations** - Shared financial accounts (ap@, ar@, accountant@) and generic admin accounts
- **7 total shared/generic accounts** requiring remediation
- **Complete audit trail loss** for financial transactions
- **Immediate action required** for compliance

## Additional Resources

- [Multi-Company Guide](../../docs/setup/MULTI-COMPANY-GUIDE.md)
- [SDF Setup Guide](../../docs/setup/SDF-SETUP.md)
- [NetSuite SDF Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/)
- [SuiteCloud CLI Reference](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_156046557150.html)

## Next Steps

1. ✅ Update `.env` with your NetSuite credentials
2. ✅ Run `suitecloud account:setup`
3. ✅ Test connection with `suitecloud project:validate`
4. ✅ Import existing objects with `suitecloud object:import`
5. ✅ Start developing!

---

**Need help?** Use the specialized NetSuite agents in `.claude/agents/` directory for:
- Solution architecture
- SuiteScript development
- Code review
- Troubleshooting
- And more!
