# NetSuite Multi-Company Development Project

Enterprise NetSuite development environment with multi-company support and AI-powered agents.

## 🎯 Quick Start

### Complete ABA-CON Setup (One Command)

```bash
cd "c:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\ABA-CON"
suitecloud account:setup
```

Copy credentials from `companies/ABA-CON/.env` when prompted.

**Then import customizations**:
```bash
suitecloud object:import
```

📖 **Full instructions**: [companies/ABA-CON/COMPLETE-SETUP.md](companies/ABA-CON/COMPLETE-SETUP.md)

---

## 📁 Project Structure

```
Netsuite/
├── .claude/agents/              # 🤖 4 Elite AI Agents
│   ├── claude-architect.md     # Solution Architecture
│   ├── claude-coder.md         # Code Implementation
│   ├── claude-reviewer.md      # Code Auditing
│   └── claude-documenter.md    # Documentation
│
├── companies/
│   └── ABA-CON/                # ✅ Account: 8606430 (Configured)
│       ├── .env                # Credentials (secured)
│       ├── src/                # NetSuite customizations
│       ├── README.md           # Company-specific guide
│       └── COMPLETE-SETUP.md   # Setup instructions
│
├── MULTI-COMPANY-GUIDE.md      # 📖 Adding more companies
├── SDF-SETUP.md                # 📖 SDF reference guide
└── README.md                   # 👈 You are here
```

---

## 🏢 Companies

| Company | Account ID | Status | Setup Guide |
|---------|------------|--------|-------------|
| **ABA-CON** | 8606430 | ✅ Configured | [COMPLETE-SETUP.md](companies/ABA-CON/COMPLETE-SETUP.md) |
| *(Add more)* | - | ⬜ Not setup | [MULTI-COMPANY-GUIDE.md](MULTI-COMPANY-GUIDE.md) |

---

## 🤖 Elite AI Agent Framework (The Four Pillars)

Your world-class NetSuite development team:

### 🎯 The Four Pillars of Excellence

1. **🧠 Claude-Architect** - Senior Solution Architect
   - Creates bulletproof architectural blueprints
   - 15+ years enterprise experience perspective
   - Governance optimization & scalability focus

2. **💻 Claude-Coder** - Elite SuiteScript Engineer
   - Transforms designs into production-ready code
   - Zero placeholders or pseudo-code
   - Advanced error handling & optimization

3. **🔍 Claude-Reviewer** - Meticulous Code Auditor
   - 7-layer systematic review framework
   - Security, governance & performance analysis
   - Pass/fail verdicts with actionable fixes

4. **🧾 Claude-Documenter** - Technical & Functional Writer
   - Complete documentation suites
   - Executive summaries to API references
   - Training materials & maintenance guides

**Using the Framework**:
```
# Architecture Design
"Use claude-architect agent to design an order approval workflow"

# Code Implementation
"Use claude-coder agent to implement the approved architecture"

# Code Review
"Use claude-reviewer agent to audit companies/ABA-CON/src/FileCabinet/SuiteScripts/my_script.js"

# Documentation
"Use claude-documenter agent to create complete documentation"
```

**Orchestration Flow**: Architect → Coder → Reviewer → Documenter

---

## 🚀 Common Commands

### For ABA-CON

```bash
cd companies/ABA-CON

# Import from NetSuite
suitecloud object:import
suitecloud file:import

# Deploy to NetSuite
suitecloud project:deploy

# Validate project
suitecloud project:validate

# List available objects
suitecloud object:list
```

---

## 📚 Documentation

### Universal Documentation (All Companies)

**Setup & Onboarding**
- [Authentication Setup](docs/setup/AUTHENTICATION-SETUP.md) - NetSuite account authentication
- [SDF Setup Guide](docs/setup/SDF-SETUP.md) - SuiteCloud Development Framework setup
- [Multi-Company Management](docs/setup/MULTI-COMPANY-GUIDE.md) - Managing multiple NetSuite accounts

**Development Workflows**
- [Multi-Company Deployment](docs/workflow/MULTI-COMPANY-DEPLOYMENT.md) - Deployment strategies
- [Team Development Process](.claude/TEAM_DEVELOPMENT_PROCESS.md) - AI agent collaboration

**Standards & Conventions**
- [Documentation Standards](docs/standards/DOCUMENTATION-STANDARDS.md) - How to organize and create documentation

**AI Agent Framework**
- [Orchestration Guide](.claude/agents/ORCHESTRATION_GUIDE.md) - Agent workflow patterns
- `.claude/agents/` - Specialized AI agents (architect, coder, reviewer, documenter)
- `.claude/commands/` - Slash commands for agent invocation

### Company-Specific Documentation

Each company has structured documentation in `companies/[COMPANY]/docs/`:

- **features/** - Feature-specific technical documentation
- **deployment/** - Deployment guides and checklists
- **testing/** - Test plans, test data, and results
- **security/** - Security assessments and audit reports
- **setup/** - Company-specific setup guides

See each company's README for their specific documentation:
- [HMP-Global Documentation](companies/HMP-Global/README.md)
- [HBNO Documentation](companies/HBNO/README.md)
- [ABA-CON Documentation](companies/ABA-CON/README.md)
- [GOBA-SPORTS-PROD Documentation](companies/GOBA-SPORTS-PROD/README.md)
- [IQ-Powertools Documentation](companies/IQ-Powertools/README.md)
- [River-Supply-SB Documentation](companies/River-Supply-SB/README.md)

---

## 🔐 Security

- ✅ All credentials stored in `.env` files (not in git)
- ✅ `.sdfcli.json` auth files (not in git)
- ✅ All sensitive files in `.gitignore`
- ⚠️ Never commit credentials!

---

## 🆕 Adding New Companies

See: [MULTI-COMPANY-GUIDE.md](MULTI-COMPANY-GUIDE.md)

**Quick steps**:
1. Create directory: `companies/COMPANY-NAME/`
2. Initialize: `suitecloud project:create`
3. Add credentials to `.env`
4. Run: `suitecloud account:setup`
5. Import: `suitecloud object:import`

---

## 🛠️ Tech Stack

- **SuiteCloud CLI**: v3.1.0
- **Node.js**: v22.20.0
- **Project Type**: Account Customization (ACP)
- **Companies**: 1 (ABA-CON) - expandable

---

## 📞 Support

- **SuiteCloud CLI**: `suitecloud --help`
- **Company Guides**: See `companies/*/README.md`
- **AI Agents**: 13 specialists in `.claude/agents/`
- **Oracle Docs**: https://docs.oracle.com/en/cloud/saas/netsuite/

---

## ✅ Next Steps

1. **Complete ABA-CON setup**: [companies/ABA-CON/COMPLETE-SETUP.md](companies/ABA-CON/COMPLETE-SETUP.md)
2. **Import customizations**: `suitecloud object:import`
3. **Start developing** with your AI agents
4. **Add more companies** as needed

---

**Your multi-company NetSuite development environment is ready!** 🚀

*Last updated: October 13, 2024*
