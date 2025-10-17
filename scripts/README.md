# NetSuite Automation Scripts

This directory contains automation scripts for managing the multi-company NetSuite workspace.

## Available Scripts

### 🚀 `deploy-to-company.sh`
Deploy to a specific company's NetSuite account.

**Usage:**
```bash
./scripts/deploy-to-company.sh [COMPANY-NAME]
```

**Examples:**
```bash
./scripts/deploy-to-company.sh HMP-Global
./scripts/deploy-to-company.sh ABA-CON
./scripts/deploy-to-company.sh HBNO
```

**What it does:**
1. Validates the project
2. Deploys to NetSuite
3. Reports success/failure

---

### ✅ `validate-all-companies.sh`
Validate all company projects and show deployment readiness.

**Usage:**
```bash
./scripts/validate-all-companies.sh
```

**What it does:**
1. Validates each company project
2. Shows which companies are deployment-ready
3. Identifies issues across companies

---

### 📥 `import-from-company.sh`
Import objects/files from NetSuite to local project.

**Usage:**
```bash
./scripts/import-from-company.sh [COMPANY-NAME] [TYPE]
```

**Types:**
- `objects` - Import custom objects only
- `files` - Import files from File Cabinet only
- `all` - Import both (default)

**Examples:**
```bash
./scripts/import-from-company.sh HMP-Global objects
./scripts/import-from-company.sh ABA-CON files
./scripts/import-from-company.sh HBNO all
```

---

### 📊 `deployment-status.sh`
Show deployment dashboard with status for all companies.

**Usage:**
```bash
./scripts/deployment-status.sh
```

**What it shows:**
- Number of scripts per company
- Number of objects per company
- Total size of scripts
- Validation status
- Summary statistics

---

## Running Scripts on Windows

### Option 1: Git Bash (Recommended)
If you have Git for Windows installed:
```bash
bash ./scripts/deploy-to-company.sh HMP-Global
```

### Option 2: WSL (Windows Subsystem for Linux)
```bash
wsl ./scripts/deploy-to-company.sh HMP-Global
```

### Option 3: PowerShell/CMD (Use .bat files instead)
For Windows users without bash, equivalent `.bat` files are available in each company folder:
```cmd
cd companies\HMP-Global
deploy.bat
```

---

## Making Scripts Executable (Linux/Mac)

```bash
chmod +x scripts/*.sh
```

---

## Adding New Scripts

When creating new automation scripts:

1. **Use bash for portability** (works on Linux, Mac, WSL)
2. **Include usage documentation** at the top of the script
3. **Use colors** for better readability (see existing scripts for examples)
4. **Add error handling** (`set -e` for exit on error)
5. **Test with multiple companies** before committing
6. **Document in this README**

---

## Script Conventions

### Error Handling
```bash
set -e  # Exit on error (for critical scripts)
set +e  # Don't exit on error (for validation loops)
```

### Colors
```bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
```

### Company Validation
```bash
if [ ! -d "companies/$COMPANY" ]; then
    echo "Error: Company not found"
    exit 1
fi
```

---

## Future Enhancements

Potential scripts to add:
- [ ] `sync-configs.sh` - Sync template configs to all companies
- [ ] `health-check.sh` - Check for common issues across companies
- [ ] `git-commit-by-company.sh` - Smart git commits scoped by company
- [ ] `backup-company.sh` - Create backup of company project
- [ ] `compare-companies.sh` - Compare configurations between companies

---

**Last Updated**: 2025-10-15
