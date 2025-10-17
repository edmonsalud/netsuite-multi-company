# HBNO - Quick Start Guide

**Status**: 🆕 Ready for Initial Setup
**Created**: 2025-10-14

## ⚡ Fast Setup (5 Steps)

### 1️⃣ Get NetSuite Credentials

You need these 5 values from NetSuite:

| Credential | Where to Find |
|------------|---------------|
| Account ID | Setup > Company > Company Information |
| Token ID | Setup > Users/Roles > Access Tokens > New |
| Token Secret | (Same as above) |
| Consumer Key | Setup > Integration > Manage Integrations > New |
| Consumer Secret | (Same as above) |

**See [BEGINNER-GUIDE.md](BEGINNER-GUIDE.md) for detailed instructions**

### 2️⃣ Update `.env` File

```bash
# Edit the .env file in this directory
NS_ACCOUNT_ID=your_account_id
NS_TOKEN_ID=your_token_id
NS_TOKEN_SECRET=your_token_secret
NS_CONSUMER_KEY=your_consumer_key
NS_CONSUMER_SECRET=your_consumer_secret
```

### 3️⃣ Setup Authentication

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\HBNO"
suitecloud account:setup
```

Enter the values from your `.env` file when prompted.

### 4️⃣ Test Connection

```bash
suitecloud project:validate
```

✅ Should show: "Validation completed successfully"

### 5️⃣ Import Existing Scripts (Optional)

```powershell
# Run the import helper script
.\import-scripts.ps1

# OR manually:
suitecloud file:import
suitecloud object:import
```

---

## 📁 Project Structure

```
HBNO/
├── .env                        # ⚠️ Your credentials (DO NOT COMMIT!)
├── .gitignore                  # Protects credentials
├── suitecloud.config.js        # SDF configuration
├── README.md                   # Main reference guide
├── BEGINNER-GUIDE.md          # Detailed setup instructions
├── COMPLETE-SETUP.md          # Comprehensive guide
├── QUICK-START.md             # This file
├── import-scripts.ps1         # Import helper script
└── src/                        # NetSuite customizations
    ├── FileCabinet/           # File Cabinet files
    │   └── SuiteScripts/      # Your SuiteScripts
    ├── Objects/               # Custom objects (after import)
    ├── manifest.xml           # Project manifest
    └── deploy.xml             # Deployment config
```

---

## 🎯 Common Commands

```bash
# Navigate to project
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\HBNO"

# Import from NetSuite
suitecloud file:import          # Import scripts/files
suitecloud object:import        # Import custom objects

# Validate project
suitecloud project:validate     # Check for errors

# Deploy to NetSuite
suitecloud project:deploy       # Upload changes

# Get help
suitecloud --help               # View all commands
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| **README.md** | Quick reference for common commands |
| **BEGINNER-GUIDE.md** | Step-by-step setup for beginners |
| **COMPLETE-SETUP.md** | Comprehensive setup and configuration |
| **QUICK-START.md** | This file - fast setup checklist |

---

## ✅ Setup Checklist

- [ ] NetSuite features enabled (SDF, Token Auth)
- [ ] Integration record created (Consumer Key/Secret)
- [ ] Access token created (Token ID/Secret)
- [ ] Account ID noted
- [ ] `.env` file updated with all credentials
- [ ] `suitecloud account:setup` completed
- [ ] Connection tested (`suitecloud project:validate`)
- [ ] First import completed (optional)

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "suitecloud: command not found" | Run: `npm install -g @oracle/suitecloud-cli` |
| "No account set up" | Run: `suitecloud account:setup` |
| "Invalid credentials" | Check `.env` values, verify tokens in NetSuite |
| "JAVA_HOME not set" | Install Java JDK 11+ and set JAVA_HOME |

**For more help, see [BEGINNER-GUIDE.md](BEGINNER-GUIDE.md)**

---

## 🚀 Next Steps

1. ✅ Complete setup checklist above
2. 📥 Import existing scripts: `.\import-scripts.ps1`
3. ✏️ Edit scripts in `src/FileCabinet/SuiteScripts/`
4. ✅ Validate: `suitecloud project:validate`
5. 🚀 Deploy: `suitecloud project:deploy`

---

## 🤖 Elite AI Agent Framework

Use the 4 world-class agents in `.claude/agents/` for help with:
- **claude-architect**: Design solution architecture
- **claude-coder**: Implement production-ready code
- **claude-reviewer**: Audit code for quality and performance
- **claude-documenter**: Create complete documentation

**Orchestration Flow**: Architect → Coder → Reviewer → Documenter

---

**Ready to start developing!** 🎉
