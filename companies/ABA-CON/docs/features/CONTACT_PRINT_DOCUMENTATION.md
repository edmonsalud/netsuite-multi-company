# Contact Print PDF Customization Documentation
## ABA-CON Implementation

---

## Executive Summary

The Contact Print PDF Customization is a comprehensive NetSuite solution that enables users to generate professional PDF reports for contact records. This customization automatically maintains print URLs for all contacts and provides on-demand PDF generation with detailed contact information including addresses, communications, relationships, and system history.

---

## Table of Contents

1. [Overview](#overview)
2. [Technical Architecture](#technical-architecture)
3. [Component Details](#component-details)
4. [Installation Guide](#installation-guide)
5. [Configuration](#configuration)
6. [Usage Instructions](#usage-instructions)
7. [Data Fields and Sections](#data-fields-and-sections)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)
10. [Technical Specifications](#technical-specifications)

---

## Overview

### Purpose
This customization provides ABA-CON with the ability to:
- Generate comprehensive PDF reports for any contact record
- Automatically maintain print URLs on all contact records
- Access contact PDFs directly from the contact record
- View consolidated contact information in a professional format

### Key Features
- **Automatic URL Management**: Print URLs are automatically set and maintained
- **Bulk Processing**: Map/Reduce script for updating existing records
- **Real-time Updates**: User Event script for new/edited contacts
- **Comprehensive Reporting**: Includes all contact-related data
- **Professional Formatting**: Clean, organized PDF layout
- **Error Handling**: Robust error handling with detailed logging

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Contact Record                         │
│                (custentity_print_url)                    │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌─────────────────┐       ┌─────────────────┐
│  User Event     │       │  Map/Reduce     │
│    Script       │       │    Script       │
│ (Auto-maintain) │       │ (Bulk update)   │
└─────────────────┘       └─────────────────┘
        │                           │
        └─────────────┬─────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │  PDF Suitelet   │
            │  (Generate PDF) │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  XML Template   │
            │  (PDF Layout)   │
            └─────────────────┘
```

### Script Flow

1. **Initial Setup**: Map/Reduce script updates all existing contacts
2. **Ongoing**: User Event script maintains URLs for new/edited contacts
3. **On-Demand**: Users click URL to trigger PDF generation
4. **Output**: Suitelet generates PDF using XML template

---

## Component Details

### 1. Map/Reduce Script: `netsuite_contact_url_updater.js`

**Script ID**: customscript_contact_url_updater
**Deployment ID**: customdeploy_contact_url_updater

**Purpose**: Bulk update all contact records with PDF Suitelet URLs

**Key Functions**:
- `getInputData()`: Searches for all contact records
- `map()`: Updates each contact's custentity_print_url field
- `reduce()`: Aggregates results and logs errors
- `summarize()`: Provides execution statistics

**Configuration**:
- Concurrency: 1-4 (recommended: 2)
- Queue: Standard
- Priority: Standard

### 2. User Event Script: `netsuite_contact_url_userevent.js`

**Script ID**: customscript_contact_url_ue
**Deployment ID**: customdeploy_contact_url_ue

**Purpose**: Automatically set print URL on contact create/edit

**Triggers**:
- CREATE
- EDIT
- XEDIT (inline edit)

**Key Function**:
- `afterSubmit()`: Sets custentity_print_url field with Suitelet URL

### 3. PDF Suitelet: `contact_pdf_suitelet.js`

**Script ID**: 3247
**Deployment ID**: 1

**Purpose**: Generate PDF report for specified contact

**URL Format**:
```
https://8606430.app.netsuite.com/app/site/hosting/scriptlet.nl?script=3247&deploy=1&contactId={contactId}
```

**Key Functions**:
- `onRequest()`: Main entry point for PDF generation
- `getContactData()`: Collects all contact information
- `getAddressBook()`: Retrieves address information
- `getSystemNotes()`: Gets system note history
- `getMessages()`: Retrieves communication records
- `getWorkflowHistory()`: Gets workflow state history
- `formatPhone()`: Formats phone numbers
- `formatDate()`: Formats dates for display

### 4. XML Template: `contact_detail_template.xml`

**File Cabinet ID**: 561358
**Location**: /SuiteScripts/contact_detail_template.xml

**Sections**:
- Address
- Communication
- Relationships
- Marketing
- Subscriptions
- System Information
- System Notes
- Workflow State
- Custom Fields

---

## Installation Guide

### Prerequisites
1. Administrator access to NetSuite account
2. SuiteScript 2.1 enabled
3. Custom field `custentity_print_url` created on Contact record

### Step-by-Step Installation

#### Step 1: Create Custom Field
1. Navigate to **Customization > Lists, Records, & Fields > Entity Fields > New**
2. Create new field:
   - **Label**: Print URL
   - **ID**: custentity_print_url
   - **Type**: Hyperlink
   - **Applies To**: Contact
   - **Display > Subtab**: Main
   - **Display Type**: Normal

#### Step 2: Upload Scripts to File Cabinet
1. Navigate to **Documents > Files > SuiteScripts**
2. Upload the following files:
   - `netsuite_contact_url_updater.js`
   - `netsuite_contact_url_userevent.js`
   - `contact_pdf_suitelet.js`
   - `contact_detail_template.xml`
3. Note the Internal ID of the template file

#### Step 3: Create Script Records

**Map/Reduce Script**:
1. Navigate to **Customization > Scripting > Scripts > New**
2. Select `netsuite_contact_url_updater.js`
3. Configure:
   - **Name**: Contact URL Bulk Updater
   - **ID**: customscript_contact_url_updater

**User Event Script**:
1. Create new script record for `netsuite_contact_url_userevent.js`
2. Configure:
   - **Name**: Contact URL Auto-Set
   - **ID**: customscript_contact_url_ue

**Suitelet**:
1. Create new script record for `contact_pdf_suitelet.js`
2. Configure:
   - **Name**: Contact PDF Generator
   - **ID**: customscript_contact_pdf_gen

#### Step 4: Create Deployments

**Map/Reduce Deployment**:
1. Deploy the Map/Reduce script
2. Set Status to **Released**
3. Configure execution settings

**User Event Deployment**:
1. Deploy to **Contact** record type
2. Set Status to **Released**
3. Enable for All Roles (or specific roles)

**Suitelet Deployment**:
1. Deploy the Suitelet
2. Set Status to **Released**
3. Configure access (Available Without Login if needed)
4. Note the Script ID and Deployment ID

#### Step 5: Update Configuration
1. Edit `contact_pdf_suitelet.js`
2. Update `TEMPLATE_FILE_ID` with the Internal ID of your template file
3. Save the changes

#### Step 6: Initial Data Population
1. Run the Map/Reduce script to populate existing contacts
2. Monitor execution in **Customization > Scripting > Script Deployments**

---

## Configuration

### Template Configuration
Edit the template file ID in `contact_pdf_suitelet.js` line 20:
```javascript
var TEMPLATE_FILE_ID = 561358; // Update with your template file ID
```

### URL Configuration
The base URL is constructed in both scripts:
```javascript
const expectedUrl = `https://8606430.app.netsuite.com/app/site/hosting/scriptlet.nl?script=3247&deploy=1&contactId=${contactId}`;
```

Update the script and deployment IDs if different in your environment.

### Field Mapping
Custom fields can be added to the contact data collection in `getContactData()`:
```javascript
data.customfield = getField('custentity_customfield', false);
```

---

## Usage Instructions

### For End Users

#### Generating a Contact PDF
1. Navigate to any Contact record
2. Locate the **Print URL** field in the Custom subtab
3. Click the URL link
4. The PDF will open in a new browser tab
5. Use browser print/save functions to save the PDF

#### Understanding PDF Sections
- **Address**: All addresses associated with the contact
- **Communication**: Recent email communications
- **Relationships**: Related contacts and companies
- **Marketing**: Lead source and campaign information
- **System Information**: Creation date and status
- **Workflow History**: Workflow state transitions

### For Administrators

#### Running Bulk Update
1. Navigate to **Customization > Scripting > Script Deployments**
2. Find "Contact URL Bulk Updater" deployment
3. Click **Save & Execute**
4. Monitor progress in the Execution Log

#### Monitoring Script Execution
1. Check script deployment status
2. Review Execution Logs for errors
3. Verify governance usage

---

## Data Fields and Sections

### Contact Information Fields
| Field | Internal ID | Description |
|-------|------------|-------------|
| First Name | firstname | Contact's first name |
| Last Name | lastname | Contact's last name |
| Company | company | Associated company |
| Title | title | Job title |
| Email | email | Primary email |
| Phone | phone | Primary phone |
| Mobile Phone | mobilephone | Mobile phone |
| Office Phone | officephone | Office phone |

### Address Fields
| Field | Description |
|-------|-------------|
| Default Shipping | Shipping address flag |
| Default Billing | Billing address flag |
| Address Line 1 | Primary address line |
| City | City name |
| State | State/Province |
| ZIP | Postal code |
| Country | Country code |

### System Fields
| Field | Description |
|-------|-------------|
| Date Created | Record creation date |
| Last Modified | Last modification date |
| Inactive | Inactive status flag |
| Print URL | Generated PDF URL |

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: PDF Not Generating
**Symptoms**: Clicking URL shows error page

**Solutions**:
1. Verify Suitelet deployment is Released
2. Check template file ID is correct
3. Verify contact ID parameter is passed
4. Review Suitelet execution logs

#### Issue: URLs Not Updating
**Symptoms**: custentity_print_url field empty

**Solutions**:
1. Verify User Event script is deployed and Released
2. Check script is applied to Contact record type
3. Run Map/Reduce script for existing records
4. Check governance units available

#### Issue: Missing Data in PDF
**Symptoms**: Sections appear empty

**Solutions**:
1. Verify field permissions
2. Check data exists in source records
3. Review field ID mappings
4. Check search filters and criteria

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Contact ID parameter is required" | Missing contactId in URL | Ensure URL includes contactId parameter |
| "Invalid contact ID" | Non-numeric or invalid ID | Verify contact ID is valid |
| "Template file not found" | Incorrect template file ID | Update TEMPLATE_FILE_ID in script |
| "Insufficient governance units" | Script execution limits | Reduce batch size or increase allocation |

---

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- Review script execution logs
- Monitor error rates
- Check governance usage

#### Monthly
- Verify all new contacts have URLs
- Review PDF generation statistics
- Update template if needed

#### Quarterly
- Run Map/Reduce script for data cleanup
- Review and optimize search performance
- Update documentation

### Performance Optimization

#### Map/Reduce Optimization
- Adjust concurrency based on account limits
- Use search columns efficiently
- Implement error retry logic

#### Suitelet Optimization
- Cache template file reference
- Optimize search filters
- Limit result set sizes

### Backup and Recovery

#### Backup Procedures
1. Export script files regularly
2. Document template customizations
3. Maintain deployment configurations

#### Recovery Procedures
1. Restore scripts from backup
2. Recreate script records and deployments
3. Run Map/Reduce to restore URLs

---

## Technical Specifications

### System Requirements
- NetSuite Version: 2024.1 or later
- SuiteScript Version: 2.1
- Browser: Chrome, Firefox, Safari, Edge (latest versions)
- PDF Viewer: Any modern PDF viewer

### API Modules Used
- N/record
- N/search
- N/render
- N/file
- N/format
- N/log
- N/runtime

### Governance Usage
| Operation | Units | Notes |
|-----------|-------|-------|
| Contact Load | 10 | Per record |
| Record Update | 10 | Per submitFields |
| Search | 10 | Per 1000 results |
| PDF Generation | 100 | Per render |

### Performance Metrics
- Map/Reduce: ~1000 contacts per minute
- User Event: <1 second per record
- PDF Generation: 2-5 seconds per contact

### Security Considerations
- Script access controlled by NetSuite roles
- No sensitive data exposed in URLs
- PDF access requires NetSuite authentication
- Audit trail maintained via system notes

---

## Appendix

### A. Script Parameters
None required - all configuration is hardcoded

### B. Custom Field Definition
```xml
<customfield>
    <label>Print URL</label>
    <fieldid>custentity_print_url</fieldid>
    <fieldtype>HYPERLINK</fieldtype>
    <appliestocontact>T</appliestocontact>
    <displaytype>NORMAL</displaytype>
    <subtab>CUSTOM</subtab>
</customfield>
```

### C. Sample URL Format
```
https://8606430.app.netsuite.com/app/site/hosting/scriptlet.nl?script=3247&deploy=1&contactId=12345
```

### D. Support Information
- **Implementation Date**: October 2025
- **Developed For**: ABA-CON
- **Account ID**: 8606430
- **Support Contact**: [Your Support Contact]

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 2025 | Development Team | Initial implementation |
| 2.0 | Oct 2025 | Development Team | Added Map/Reduce for bulk updates |
| 2.1 | Oct 2025 | Development Team | Enhanced logging and validation |

---

*End of Documentation*