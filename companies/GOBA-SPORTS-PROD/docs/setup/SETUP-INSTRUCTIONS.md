# GOBA Sports - Authentication Setup Instructions

## Important: This is a NEW Account Setup
Since GOBA Sports is a different NetSuite account from ABA-CON, you need to set up new authentication.

## Steps to Complete Setup:

### 1. Open Terminal/Command Prompt
Navigate to the project directory:
```bash
cd C:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\GOBA-SPORTS-PROD\GOBA-SPORTS-PROD
```

### 2. Run Account Setup
Execute the following command:
```bash
suitecloud account:setup
```

### 3. Follow the Interactive Prompts:

1. **Select Authentication Method**: Choose "Browser-based authentication"

2. **Create New Authentication ID**:
   - Select "Create a new authentication ID"
   - Enter name: `goba-sports-prod`

3. **Enter GOBA Sports Account Details**:
   - Account ID: Enter your GOBA Sports account ID (NOT 8606430 - that's ABA-CON)
   - A browser window will open for NetSuite login
   - Log in with your GOBA Sports credentials
   - Select the appropriate role for development

4. **Confirm Setup**: The tool will confirm the authentication is saved

### 4. After Setup is Complete

Once authentication is set up, return here and we can pull the scripts from GOBA Sports.

## Alternative: Token-Based Authentication (If Available)

If you have Token-Based Authentication credentials for GOBA Sports:

1. Get from your NetSuite administrator:
   - GOBA Sports Account ID
   - Token ID (for GOBA Sports account)
   - Token Secret (for GOBA Sports account)

2. Create a manual authentication entry

## Note
The account ID 8606430 belongs to ABA-CON. Make sure you're using the correct GOBA Sports account ID for this setup.