# Pull Contact URL Scripts - Quick Guide

## 🚀 Run These Commands

### 1. Setup Authentication (One-time)

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\ABA-CON"
suitecloud account:setup
```

**Copy/paste when prompted:**

```
Account ID: 8606430

Auth ID: aba-con

Token ID: de9b2c3d5b1b2d68b85447f05894b8a53dd89a14ff970e4f560e29bdd8ea3dae

Token Secret: 57441dd937b1338f0155ee2de61825c2226e571d37aa0c94d367e2dc0bf6e1f3

Consumer Key: 2a45aa48e1e611d6e87952582420e8653bb615a53b0caaa56f2e8cefddf9be2a

Consumer Secret: 954bbca748667ce7d9dded498c0e45a3eb9864ea8c825477676a2188d894b304
```

---

### 2. Import the Scripts

```bash
# Import ALL files from SuiteScripts folder (includes your 2 scripts)
suitecloud file:import --paths /SuiteScripts
```

**OR** use interactive browser:

```bash
suitecloud file:import
```
(Navigate to find: netsuite_contact_url_updater.js and netsuite_contact_url_userevent.js)

---

### 3. Import Script Objects (XML definitions)

```bash
suitecloud object:import --type customscript
```

Select the scripts with "contact_url" in the name.

---

### 4. Verify Import

```bash
# Find the imported files
find src/FileCabinet -name "*contact_url*.js"

# List imported objects
ls src/Objects/ | grep contact
```

---

## ✅ Expected Result

```
src/FileCabinet/SuiteScripts/.../
  ├── netsuite_contact_url_updater.js
  └── netsuite_contact_url_userevent.js

src/Objects/
  ├── customscript_*_contact_url_updater.xml
  ├── customdeploy_*_contact_url_updater.xml
  ├── customscript_*_contact_url_userevent.xml
  └── customdeploy_*_contact_url_userevent.xml
```

---

## 🤖 After Import - Use Elite AI Agents

```
"Use claude-reviewer agent to audit the contact URL scripts in companies/ABA-CON/src/FileCabinet"

"Use claude-documenter agent to create complete documentation for the contact URL scripts"

"Use claude-architect agent to analyze the architecture and suggest improvements"

"Use claude-coder agent to implement optimizations based on review findings"
```

**Orchestration Flow**: Architect → Coder → Reviewer → Documenter

---

**That's it!** Your scripts will be pulled from NetSuite into your local project. 🎯
