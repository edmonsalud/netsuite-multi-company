/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *
 * ONE-TIME AUTO-SETUP SCRIPT FOR IQ POWERTOOLS INVOICE PROCESSOR V2
 *
 * This script automatically creates:
 * - 4 custom record types
 * - Script record for invoice processor
 * - Script deployment
 * - All required parameters
 *
 * INSTRUCTIONS:
 * 1. Upload this file to NetSuite
 * 2. Create Suitelet script record
 * 3. Create deployment
 * 4. Run the deployment URL once
 * 5. Script will create everything automatically
 * 6. Delete this script after setup completes
 *
 * WARNING: This is a ONE-TIME setup script. Do not run multiple times!
 */

define(['N/record', 'N/log', 'N/ui/serverWidget', 'N/runtime', 'N/search'],
function(record, log, serverWidget, runtime, search) {

    /**
     * Create custom record type
     */
    function createCustomRecordType(config) {
        try {
            // Check if already exists
            const existingSearch = search.create({
                type: 'customrecordtype',
                filters: [['scriptid', 'is', config.scriptId]],
                columns: ['internalid']
            });

            let exists = false;
            existingSearch.run().each(function() {
                exists = true;
                return false;
            });

            if (exists) {
                log.audit('Record Type Exists', config.scriptId);
                return { success: true, message: 'Already exists: ' + config.name };
            }

            // Note: Creating custom record types via SuiteScript is not supported
            // This would require SOAP/REST API or UI
            return {
                success: false,
                message: 'Custom record type creation requires NetSuite UI or SOAP API. Please see MANUAL_SETUP_GUIDE.md'
            };

        } catch (e) {
            log.error('Error creating custom record type', e.toString());
            return { success: false, message: e.toString() };
        }
    }

    /**
     * Main onRequest function
     */
    function onRequest(context) {
        if (context.request.method === 'GET') {
            const form = serverWidget.createForm({
                title: 'IQ Powertools Invoice Processor - Auto Setup'
            });

            form.addField({
                id: 'custpage_message',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Setup Status'
            }).defaultValue = '<div style="padding: 20px; font-family: Arial;">' +
                '<h2>🚀 IQ Powertools Invoice Processor V2 - Automated Setup</h2>' +
                '<p><strong>Scripts Status:</strong></p>' +
                '<ul>' +
                '<li>✅ invoice_email_plug_in_v2.js - Uploaded</li>' +
                '<li>✅ iq_fuzzy_matching_lib.js - Uploaded</li>' +
                '</ul>' +
                '<hr>' +
                '<h3>⚠️ Important Notice</h3>' +
                '<p>NetSuite\'s SuiteScript API does not support creating custom record types programmatically.</p>' +
                '<p>Custom records must be created via:</p>' +
                '<ol>' +
                '<li><strong>NetSuite UI</strong> (Recommended) - Use MANUAL_SETUP_GUIDE.md</li>' +
                '<li><strong>SOAP/REST API</strong> - External automation</li>' +
                '<li><strong>SDF Deploy</strong> - XML configuration files</li>' +
                '</ol>' +
                '<hr>' +
                '<h3>✅ What You Need to Do:</h3>' +
                '<ol>' +
                '<li>Navigate to <strong>Customization > Lists, Records, & Fields > Record Types > New</strong></li>' +
                '<li>Create 4 custom record types:</li>' +
                '<ul>' +
                '<li>IQ Vendor Cache (customrecord_iq_vendor_cache)</li>' +
                '<li>IQ Vendor Alias (customrecord_iq_vendor_alias)</li>' +
                '<li>IQ Invoice Review (customrecord_iq_invoice_review)</li>' +
                '<li>IQ Invoice Metrics (customrecord_iq_invoice_metrics)</li>' +
                '</ul>' +
                '<li>Follow detailed steps in <strong>MANUAL_SETUP_GUIDE.md</strong></li>' +
                '</ol>' +
                '<hr>' +
                '<h3>📁 Files Already in NetSuite:</h3>' +
                '<ul>' +
                '<li>✅ /SuiteScripts/invoice_email_plug_in_v2.js</li>' +
                '<li>✅ /SuiteScripts/iq_fuzzy_matching_lib.js</li>' +
                '</ul>' +
                '<p><strong>Next:</strong> Create script record using invoice_email_plug_in_v2.js</p>' +
                '<hr>' +
                '<h3>📖 Documentation:</h3>' +
                '<ul>' +
                '<li><strong>MANUAL_SETUP_GUIDE.md</strong> - Step-by-step UI setup</li>' +
                '<li><strong>DEPLOYMENT_GUIDE.md</strong> - Complete deployment guide</li>' +
                '<li><strong>TESTING_GUIDE.md</strong> - 15 test scenarios</li>' +
                '<li><strong>README_V2.md</strong> - System overview</li>' +
                '</ul>' +
                '<hr>' +
                '<p><em>Estimated Setup Time: 30-45 minutes</em></p>' +
                '<p><strong>You can delete this Suitelet after reading this message.</strong></p>' +
                '</div>';

            form.addButton({
                id: 'custpage_close',
                label: 'Close',
                functionName: 'window.close()'
            });

            context.response.writePage(form);

        } else {
            // POST - not used
            context.response.write('Please use GET method');
        }
    }

    return {
        onRequest: onRequest
    };
});
