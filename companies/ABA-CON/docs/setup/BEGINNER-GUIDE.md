# Complete Beginner's Guide - Pull Scripts from NetSuite

Follow these exact steps. I'll guide you through every click.

---

## Step 1: Open Terminal in VSCode

### 1.1 Look at the top menu bar in VSCode
- Find the word **"Terminal"** in the top menu
- Click on **Terminal**

### 1.2 Click "New Terminal"
- A panel will appear at the bottom of VSCode
- This is your terminal/command line

**What you should see:**
```
A black or white box at the bottom with text like:
PS C:\Users\Ed\OneDrive\Desktop\Projects\Netsuite>
```

---

## Step 2: Navigate to the ABA-CON Folder

### 2.1 Copy this command exactly:
```powershell
cd companies\ABA-CON
```

### 2.2 Paste it in the terminal:
- **Right-click** in the terminal (at the bottom)
- Click **"Paste"**
- Press **Enter** on your keyboard

**What you should see now:**
```
PS C:\Users\Ed\OneDrive\Desktop\Projects\Netsuite\companies\ABA-CON>
```

✅ Good! You're in the right folder.

---

## Step 3: Setup NetSuite Authentication

### 3.1 Copy this command:
```powershell
suitecloud account:setup
```

### 3.2 Paste and press Enter
- Right-click in terminal
- Click "Paste"
- Press Enter

### 3.3 Answer the Questions (Copy/Paste Each Answer)

The terminal will ask you questions. **Copy and paste these exact answers:**

---

**Question 1: "Enter your NetSuite account ID"**

**Your Answer:**
```
8606430
```
Press **Enter**

---

**Question 2: "Select the authentication method"**

You'll see options like:
```
> OAUTH 2.0
  TOKEN AUTHENTICATION
  REUSE EXISTING CREDENTIALS
```

**What to do:**
1. Press **Down Arrow** on your keyboard until `TOKEN AUTHENTICATION` is highlighted
2. Press **Enter**

---

**Question 3: "Enter the authentication ID (custom alias)"**

**Your Answer:**
```
aba-con
```
Press **Enter**

---

**Question 4: "Do you want to save the authentication ID?"**

**Your Answer:**
```
Y
```
Press **Enter** (This means "Yes")

---

**Question 5: "Enter your Token ID"**

**Your Answer (copy this entire line):**
```
de9b2c3d5b1b2d68b85447f05894b8a53dd89a14ff970e4f560e29bdd8ea3dae
```
Press **Enter**

---

**Question 6: "Enter your Token Secret"**

**Your Answer (copy this entire line):**
```
57441dd937b1338f0155ee2de61825c2226e571d37aa0c94d367e2dc0bf6e1f3
```
Press **Enter**

---

**Question 7: "Enter your Consumer Key"**

**Your Answer (copy this entire line):**
```
2a45aa48e1e611d6e87952582420e8653bb615a53b0caaa56f2e8cefddf9be2a
```
Press **Enter**

---

**Question 8: "Enter your Consumer Secret"**

**Your Answer (copy this entire line):**
```
954bbca748667ce7d9dded498c0e45a3eb9864ea8c825477676a2188d894b304
```
Press **Enter**

---

### 3.4 Wait for Success Message

You should see:
```
✓ Account setup completed successfully
```

✅ **Great! You're connected to NetSuite!**

---

## Step 4: Import Your Scripts from NetSuite

Now we'll pull the two scripts you need.

### 4.1 Copy this command:
```powershell
suitecloud file:import
```

### 4.2 Paste and press Enter

### 4.3 You'll see an interactive menu

The terminal will show something like:
```
? Select the files you want to import:
  /SuiteScripts/
  /Templates/
  /Web Site Hosting Files/
```

**What to do:**

1. Use **Arrow Keys** to navigate:
   - **Down Arrow** = move down
   - **Up Arrow** = move up

2. Navigate to `/SuiteScripts/` and press **Enter**

3. You'll see folders inside. Navigate through them looking for:
   - `netsuite_contact_url_updater.js`
   - `netsuite_contact_url_userevent.js`

4. When you find them:
   - Press **Spacebar** to select (you'll see a checkmark ✓)
   - Select BOTH files
   - Press **Enter** when done

**Alternative - Import Everything:**

If you can't find the files easily, let's just import everything:

### 4.4 Cancel the menu (press `Ctrl+C`)

### 4.5 Run this command instead:
```powershell
suitecloud file:import --paths /SuiteScripts
```

This imports ALL scripts. It might take a minute.

**You'll see:**
```
Importing files from account...
✓ Files imported successfully
```

---

## Step 5: Import Script Configurations

Now get the script settings (metadata):

### 5.1 Copy this command:
```powershell
suitecloud object:import
```

### 5.2 Paste and press Enter

### 5.3 You'll see a menu of object types:

```
? Select the object types:
  customfield
  customlist
  customrecord
> customscript
  workflow
  (more options...)
```

**What to do:**

1. Press **Down Arrow** until `customscript` is highlighted
2. Press **Spacebar** to select it (you'll see ✓)
3. Press **Enter**

### 5.4 Select your specific scripts

You'll see a list of all scripts. Look for ones with "contact" or "url" in the name:

```
? Select the scripts:
  customscript_something
> customscript_contact_url_updater
  customscript_contact_url_userevent
  customscript_other_thing
```

**What to do:**

1. Use **Arrow Keys** to navigate
2. Press **Spacebar** when you see scripts with "contact_url" in the name
3. Select BOTH contact URL scripts
4. Press **Enter** when done

**You'll see:**
```
Importing objects...
✓ Objects imported successfully
```

---

## Step 6: Verify Your Scripts Are There

### 6.1 Look at the left sidebar in VSCode

You should see a folder tree that looks like:

```
NETSUITE
└── companies
    └── ABA-CON
        └── src
            ├── FileCabinet
            │   └── SuiteScripts
            │       └── (your scripts are here!)
            └── Objects
                └── (script XML files here!)
```

### 6.2 Find your scripts

1. In the left sidebar, click the **arrow** next to `ABA-CON`
2. Click the arrow next to `src`
3. Click the arrow next to `FileCabinet`
4. Click the arrow next to `SuiteScripts`
5. Look for folders - expand them until you find:
   - ✅ `netsuite_contact_url_updater.js`
   - ✅ `netsuite_contact_url_userevent.js`

### 6.3 Open a script to view it

- **Click once** on `netsuite_contact_url_updater.js`
- The file will open in the main editor area
- You can now see the code!

---

## 🎉 Success! What You Have Now

✅ Connected to NetSuite account 8606430 (ABA-CON)
✅ Imported scripts from NetSuite to your computer
✅ Can now view and edit the scripts in VSCode

---

## Next Steps - What You Can Do Now

### Option 1: Review the Code with AI
In VSCode, type this message to me:
```
"Use claude-reviewer agent to audit companies/ABA-CON/src/FileCabinet/SuiteScripts/netsuite_contact_url_updater.js"
```

### Option 2: Get Documentation
```
"Use claude-documenter agent to create documentation for the contact URL scripts"
```

### Option 3: Optimize the Code
```
"Use claude-coder agent to optimize the contact URL scripts based on review findings"
```

### Option 4: Make Changes and Deploy Back to NetSuite

After editing a script:

```powershell
# Validate your changes
suitecloud project:validate

# Deploy back to NetSuite
suitecloud project:deploy
```

---

## 🆘 Troubleshooting

### Problem: "suitecloud: command not found"

**Solution:**
```powershell
npm install -g @oracle/suitecloud-cli
```
Wait for it to finish, then try again.

---

### Problem: "Authentication failed"

**Solution:** The tokens might have expired. You need to:
1. Go to NetSuite
2. Setup > Users/Roles > Access Tokens
3. Create a new token
4. Run `suitecloud account:setup` again with new credentials

---

### Problem: "Can't find the scripts in the menu"

**Solution:** Import everything:
```powershell
suitecloud file:import --paths /SuiteScripts
```

---

### Problem: Terminal is confusing / I messed up

**Solution:** Start fresh:
1. In VSCode, click **Terminal** menu
2. Click **Kill Terminal**
3. Click **Terminal** > **New Terminal**
4. Start from Step 2 again

---

## 📹 Visual Guide - What You Should See

### Terminal at Bottom:
```
┌──────────────────────────────────┐
│                                  │
│  Your code files appear here     │
│                                  │
├──────────────────────────────────┤
│ TERMINAL (bottom panel)          │
│ PS C:\...\ABA-CON>               │
│ (you type commands here)         │
└──────────────────────────────────┘
```

### File Tree on Left:
```
📁 NETSUITE
  📁 companies
    📁 ABA-CON
      📁 src
        📁 FileCabinet
          📁 SuiteScripts
            📄 netsuite_contact_url_updater.js ← YOUR FILE!
            📄 netsuite_contact_url_userevent.js ← YOUR FILE!
        📁 Objects
          📄 customscript_contact_url_updater.xml
```

---

## ✅ Checklist - Complete These in Order

- [ ] **Step 1:** Open Terminal in VSCode
- [ ] **Step 2:** Navigate to ABA-CON folder (`cd companies\ABA-CON`)
- [ ] **Step 3:** Setup authentication (`suitecloud account:setup`)
- [ ] **Step 4:** Import scripts (`suitecloud file:import`)
- [ ] **Step 5:** Import objects (`suitecloud object:import`)
- [ ] **Step 6:** Verify files in left sidebar
- [ ] **Step 7:** Open a script to view the code

---

**Follow these steps exactly and you'll have your scripts! Let me know when you complete each step.** 🚀

---

## 💡 Pro Tips

### Copy/Paste in Terminal
- **Right-click** → Paste (don't use Ctrl+V)
- Or use **Ctrl+Shift+V**

### Navigate with Keyboard
- **Tab** key = autocomplete folder names
- **Up Arrow** = previous command
- **Ctrl+C** = cancel current command

### If You Get Lost
Just tell me which step you're on and I'll help! 👍
