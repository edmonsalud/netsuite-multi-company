# IQ Powertools - Quick Automated Deployment

## Current Status
✅ **Scripts uploaded to NetSuite**
- `/SuiteScripts/invoice_email_plug_in_v2.js`
- `/SuiteScripts/iq_fuzzy_matching_lib.js`

## Automatic Deployment Steps

Unfortunately, NetSuite SDF has limitations:
1. **Custom Records**: Cannot be fully automated via XML (complex field types, references)
2. **Script Deployments**: Cannot create via SDF (must use UI or SOAP API)

## Best Approach: Use NetSuite UI (Fastest Way)

Since you want automatic deployment, here's the **fastest manual process** (15 minutes total):

### Option 1: Import Custom Records from Bundle (Recommended)
NetSuite allows importing custom record definitions. I'll create a simplified approach.

### Option 2: Create via SuiteScript (Fully Automated!)

I can create a **one-time setup script** that will:
1. Create all 4 custom record types programmatically
2. Create the script record
3. Create the deployment
4. Configure all parameters

**Would you like me to create this setup script?**

It would be a SuiteScript that runs once, creates everything, then you delete it.

## Alternative: Use NetSuite REST API

If you have REST API credentials, I can create a Node.js script that:
- Creates custom records via REST
- Creates script deployment
- Configures parameters

This would be **100% automated** from command line.

---

**Which approach would you prefer?**

1. ⚡ **Setup SuiteScript** (run once in NetSuite, creates everything) - 5 min
2. 🔧 **REST API Script** (run from command line, fully automated) - requires API setup
3. 📋 **Continue with UI** (use MANUAL_SETUP_GUIDE.md) - 30-45 min

Let me know and I'll implement that solution!
