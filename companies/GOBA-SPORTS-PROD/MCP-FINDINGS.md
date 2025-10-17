# NetSuite MCP Integration - Research Findings

**Date**: 2025-10-15
**Account**: GOBA Sports (7759280)
**Status**: ⚠️ Configuration Blocked - Needs Alternative Approach

---

## What We Attempted

### Goal
Connect Claude Code to GOBA Sports NetSuite account via Model Context Protocol (MCP) to enable:
- Natural language queries of NetSuite data
- Real-time schema access
- SuiteQL execution
- Accurate SuiteScript generation with actual field IDs

### Configuration Completed
✅ NetSuite OAuth Integration created
✅ Client ID/Secret obtained
✅ Claude Code MCP configuration added

### Credentials Obtained
- **Account ID**: `7759280`
- **Client ID**: `ddc8077f885c1336311279a3710d271a279c0fa64ffc957e1e3c4422b87ae834`
- **Client Secret**: `f3be846539d4905512a9bd9fdbccc8813debe2a6d02d285783145477db083051`
- **Integration**: Uses NetSuite AI Connector Service scope

---

## Issues Discovered

### Issue #1: Wrong Package Type
The third-party MCP server package we attempted to use (`@glints-dev/mcp-netsuite`) **does not exist** as an npm package.

```bash
npm error 404  '@glints-dev/mcp-netsuite@*' is not in this registry.
```

**Root Cause**:
1. **Glints MCP server** is a **Go-based** application, not Node.js/npm
   - Repository: https://github.com/glints-dev/mcp-netsuite
   - Requires: Go runtime and certificate-based authentication
   - Command: `go run github.com/glints-dev/mcp-netsuite@latest`

2. **NetSuite AI Connector Service** is designed for:
   - Claude.ai web interface (direct integration)
   - ChatGPT Plus/Pro (direct integration)
   - Not necessarily third-party MCP clients like Claude Code

### Issue #2: Wrong Authentication Method ⚠️ CRITICAL

**Problem**: We configured Token-Based Authentication (TBA), but Glints MCP requires Certificate Authentication.

**What We Configured**:
```json
{
  "NETSUITE_TOKEN_ID": "xxx",
  "NETSUITE_TOKEN_SECRET": "xxx"
}
```

**What Glints MCP Actually Requires**:
```json
{
  "NETSUITE_CERTIFICATE_ID": "<cert_id>",
  "NETSUITE_PRIVATE_KEY_PATH": "/path/to/private_key.pem"
}
```

**Why "oauth2: server_error" Occurs**:
1. MCP server tries to load private key from `NETSUITE_PRIVATE_KEY_PATH`
2. This variable is missing → Cannot load key
3. Cannot sign JWT without private key
4. Authentication fails immediately (no request reaches NetSuite)
5. Error: `oauth2: server_error`

**See detailed authentication research**: `GLINTS-MCP-AUTH-RESEARCH.md`

---

## Alternative Approaches

### Option 1: Use Glints MCP Server (Go-based) ✅ Viable

**Requirements**:
1. Install Go runtime (https://go.dev/dl/)
2. Generate certificate authentication in NetSuite
3. Update MCP configuration to use Go command

**Configuration**:
```json
{
  "mcpServers": {
    "netsuite-goba-sports": {
      "command": "go",
      "args": ["run", "github.com/glints-dev/mcp-netsuite@latest"],
      "env": {
        "NETSUITE_ACCOUNT_ID": "7759280",
        "NETSUITE_CLIENT_ID": "<client_id>",
        "NETSUITE_CLIENT_SECRET": "<client_secret>",
        "NETSUITE_CERTIFICATE_ID": "<cert_id>",
        "NETSUITE_PRIVATE_KEY_PATH": "<path_to_pem_file>"
      }
    }
  }
}
```

**Pros**:
- Open source and free
- Full SuiteQL and metadata access
- Actively maintained

**Cons**:
- Requires Go installation
- Requires certificate setup (additional NetSuite configuration)

---

### Option 2: Use CData NetSuite MCP Server ⚠️ Commercial

**Requirements**:
1. Java JDK installed
2. CData JDBC Driver for NetSuite (commercial license or trial)
3. Maven for building

**Repository**: https://github.com/CDataSoftware/netsuite-mcp-server-by-cdata

**Pros**:
- JDBC-based (enterprise-grade)
- Professional support available

**Cons**:
- Requires commercial license (free trial available)
- Java + Maven setup required
- Read-only in free version

---

### Option 3: Build Custom SuiteScript-Based MCP Server 🛠️ Advanced

**Approach**:
- Create RESTlet in NetSuite to expose MCP endpoints
- Use SuiteScript 2.1 to query data and return schemas
- Configure Claude Code to connect via HTTP transport

**Pros**:
- Complete control over functionality
- Uses existing SuiteScript knowledge
- No third-party dependencies

**Cons**:
- Requires custom development
- Maintenance burden
- Need to implement full MCP protocol

---

### Option 4: Use NetSuite REST API Directly (No MCP) 🔄 Workaround

**Approach**:
Instead of MCP, use Claude Code to generate scripts that call NetSuite's REST API directly.

**Example**:
```javascript
// Claude would generate this based on your requests
const https = require('https');
const oauth = require('oauth-1.0a');

// Query NetSuite REST API
// ...
```

**Pros**:
- No MCP server needed
- Uses official NetSuite REST API
- Well-documented

**Cons**:
- No real-time schema access for Claude
- Manual API calls required
- Less integrated experience

---

## Recommended Next Steps

### Immediate (Easiest Path):

**Install Go and Use Glints MCP Server with Certificate Authentication**

1. **Install Go**:
   - Download from: https://go.dev/dl/
   - Install Go 1.20+ for Windows
   - Verify: `go version`

2. **Complete Certificate Setup in NetSuite**:
   - Go to: Setup → Integration → Manage Integrations
   - Edit: GOBA Sports MCP Integration
   - Enable: ☑ Certificate Authentication
   - Choose one:
     - **Option A**: Generate Certificate (NetSuite creates it)
     - **Option B**: Upload Certificate (you create it with OpenSSL)
   - Download private key (`.pem` file) - **ONLY SHOWN ONCE!**
   - Note: Certificate ID (displayed in integration)

3. **Secure Private Key**:
   - Save to: `C:\Users\Ed\.netsuite\certs\netsuite_goba_private.pem`
   - Set read-only permissions (current user only)
   - **NEVER commit to Git** (add `*.pem` to .gitignore)

4. **Update MCP Configuration** (`.mcp.json`):
   - Change `command`: from `npx` to `go`
   - Remove: `NETSUITE_TOKEN_ID`, `NETSUITE_TOKEN_SECRET`
   - Add: `NETSUITE_CERTIFICATE_ID`, `NETSUITE_PRIVATE_KEY_PATH`
   - Example:
     ```json
     {
       "command": "go",
       "args": ["run", "github.com/glints-dev/mcp-netsuite@latest"],
       "env": {
         "NETSUITE_ACCOUNT_ID": "7759280",
         "NETSUITE_CLIENT_ID": "ddc8077f885c1336...",
         "NETSUITE_CLIENT_SECRET": "f3be846539d49055...",
         "NETSUITE_CERTIFICATE_ID": "<cert_id_from_netsuite>",
         "NETSUITE_PRIVATE_KEY_PATH": "C:\\Users\\Ed\\.netsuite\\certs\\netsuite_goba_private.pem"
       }
     }
     ```

5. **Test Connection**:
   - Restart Claude Code
   - Run: `/mcp` (should show connected)
   - Test query: "Get first 5 customers from GOBA Sports"

**Estimated Time**: 30-45 minutes

**See detailed step-by-step guide**: `GLINTS-MCP-AUTH-RESEARCH.md`

---

### Long-term (Best Solution):

**Wait for Official NetSuite MCP Client Support**

NetSuite's AI Connector Service is new (announced August 2025). It's possible that:
- Official MCP client SDK will be released
- Direct Claude Code integration will be supported
- npm/Node.js package will become available

**Monitor**:
- NetSuite SuiteCloud releases
- MCP ecosystem announcements
- Claude Code MCP server marketplace

---

## Current Status

### What's Working:
✅ OAuth integration created in NetSuite
✅ Claude Code MCP configuration structure ready
✅ Credentials securely stored
✅ Documentation complete

### What's Blocked:
❌ MCP server executable not available
❌ Certificate authentication not completed
❌ Go runtime not installed

### Next Action Required:
**Decision needed**: Which option to pursue?

1. **Install Go + Complete setup** (Recommended - 30-45 min)
2. **Try CData** (Commercial option - requires license)
3. **Build custom** (Advanced - multiple days)
4. **Use REST API directly** (Workaround - no MCP)

---

## Resources

- **Glints MCP NetSuite**: https://github.com/glints-dev/mcp-netsuite
- **Go Downloads**: https://go.dev/dl/
- **NetSuite AI Connector Docs**: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_3200541651.html
- **CData MCP Server**: https://github.com/CDataSoftware/netsuite-mcp-server-by-cdata
- **MCP Protocol Docs**: https://modelcontextprotocol.io

---

**Last Updated**: 2025-10-15
**Next Review**: After decision on approach
