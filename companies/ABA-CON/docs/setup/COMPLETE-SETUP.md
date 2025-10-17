# ABA-CON - Complete Setup Instructions

## ✅ What's Already Done

1. **Project Structure Created** ✓
2. **Credentials Configured** ✓
   - Account ID: 8606430
   - Token ID: Stored in `.env`
   - Token Secret: Stored in `.env`
   - Consumer Key: Stored in `.env`
   - Consumer Secret: Stored in `.env`

## 🚀 Final Step: Complete Authentication

You need to run ONE command to link your project to NetSuite:

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\ABA-CON"
suitecloud account:setup
```

### When Prompted:

**1. Account ID**: `8606430`

**2. Select Authentication Method**:
   - Choose: `TOKEN AUTHENTICATION`

**3. Auth ID** (custom name for this connection):
   - Enter: `aba-con`

**4. Token ID**:
   ```
   de9b2c3d5b1b2d68b85447f05894b8a53dd89a14ff970e4f560e29bdd8ea3dae
   ```

**5. Token Secret**:
   ```
   57441dd937b1338f0155ee2de61825c2226e571d37aa0c94d367e2dc0bf6e1f3
   ```

**6. Consumer Key**:
   ```
   2a45aa48e1e611d6e87952582420e8653bb615a53b0caaa56f2e8cefddf9be2a
   ```

**7. Consumer Secret**:
   ```
   954bbca748667ce7d9dded498c0e45a3eb9864ea8c825477676a2188d894b304
   ```

**8. Save auth ID?**: `Yes`

---

## ✅ Verify Connection

After setup completes, test the connection:

```bash
suitecloud project:validate
```

**Expected**: Project validation should complete without authentication errors.

---

## 📥 Import Existing Customizations

Once connected, import your existing NetSuite customizations:

### Import All Custom Objects

```bash
suitecloud object:import
```

This will show an interactive menu. Select what you want to import:
- [ ] Custom Fields
- [ ] Custom Records
- [ ] Scripts
- [ ] Workflows
- [ ] Saved Searches
- [ ] Custom Lists
- etc.

### Import Files from File Cabinet

```bash
suitecloud file:import
```

---

## 🎯 Quick Start Commands

**See what's in your NetSuite account**:
```bash
suitecloud object:list
```

**Import specific script**:
```bash
suitecloud object:import --scriptid customscript_example
```

**Deploy changes to NetSuite**:
```bash
suitecloud project:deploy
```

**Check for errors**:
```bash
suitecloud project:validate
```

---

## 📖 Full Documentation

- **Company-specific guide**: [README.md](README.md)
- **Multi-company setup**: [../../MULTI-COMPANY-GUIDE.md](../../MULTI-COMPANY-GUIDE.md)
- **Original SDF guide**: [../../SDF-SETUP.md](../../SDF-SETUP.md)

---

## 🤖 Use Your Elite AI Agent Framework

Your 4 world-class agents are ready:

```bash
# Step 1: Architecture Design
"Use claude-architect agent to design an automated approval workflow for ABA-CON"

# Step 2: Code Implementation
"Use claude-coder agent to implement the approved architecture"

# Step 3: Code Review
"Use claude-reviewer agent to audit src/FileCabinet/SuiteScripts/my_script.js"

# Step 4: Documentation
"Use claude-documenter agent to create complete documentation for the solution"
```

**Orchestration Flow**: Architect → Coder → Reviewer → Documenter

---

## 🆘 Troubleshooting

### "Authentication failed"
- Verify tokens haven't expired in NetSuite
- Check that Token-Based Authentication is enabled
- Try creating new access token in NetSuite

### "No account set up"
- Run: `suitecloud account:setup` again
- Make sure you're in the correct directory: `companies/ABA-CON`

### Need help?
- Check `.env` file for credentials
- Review error messages carefully
- Use: `suitecloud --help`

---

**Ready to complete setup? Run the command above!** 🚀
