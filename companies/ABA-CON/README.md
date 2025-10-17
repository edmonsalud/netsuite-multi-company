# ABA-CON NetSuite Project

**Account ID**: 8606430
**Company**: ABA-CON
**Status**: ✅ Configured

## Quick Commands

All commands should be run from this directory:
```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\ABA-CON"
```

### Setup Account (First Time)
```bash
# Interactive setup (will prompt for credentials from .env file)
suitecloud account:setup
```

When prompted:
- **Account ID**: `8606430`
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
ABA-CON/
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
