/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description Automatically sets the Print URL field on contact records to use the PDF Suitelet (always overwrites)
 * @Version 2.1 - Added validation logging, removed skip logic, always overwrites custentity_print_url field
 */
define(['N/record', 'N/log', 'N/runtime'], 
    (record, log, runtime) => {

    /**
     * Function definition to be triggered after record is submitted.
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     * @since 2015.2
     */
    const afterSubmit = (context) => {
        try {
            // Only execute on create, edit, and inline edit events
            if (context.type !== context.UserEventType.CREATE && 
                context.type !== context.UserEventType.EDIT &&
                context.type !== context.UserEventType.XEDIT) {
                return;
            }

            const contactId = context.newRecord.id;
            
            if (!contactId) {
                log.error('afterSubmit', 'No contact ID available');
                return;
            }

            // Construct the expected URL - Using Suitelet with dynamic contact ID parameter
            const expectedUrl = `https://8606430.app.netsuite.com/app/site/hosting/scriptlet.nl?script=3247&deploy=1&contactId=${contactId}`;
            
            // Get current URL value
            const currentUrl = context.newRecord.getValue({
                fieldId: 'custentity_print_url'
            });

            // Log the field change for validation
            log.error('afterSubmit - Field Update Validation',
                `Contact ID: ${contactId}\n` +
                `Event Type: ${context.type}\n` +
                `OLD URL Value: ${currentUrl || '(empty)'}\n` +
                `NEW URL Value: ${expectedUrl}\n` +
                `Field Being Set: custentity_print_url`
            );

            // Check governance units before updating
            const remainingUsage = runtime.getCurrentScript().getRemainingUsage();
            if (remainingUsage < 20) {
                log.error('afterSubmit', `Insufficient governance units remaining: ${remainingUsage}`);
                return;
            }

            // Update the record with the correct URL
            try {
                record.submitFields({
                    type: record.Type.CONTACT,
                    id: contactId,
                    values: {
                        'custentity_print_url': expectedUrl
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                
                const actionType = context.type === context.UserEventType.CREATE ? 'Created' : 'Updated';

                // Log successful update for validation
                log.error('afterSubmit - Update Success Validation',
                    `${actionType} Contact ID ${contactId} successfully updated\n` +
                    `Field: custentity_print_url\n` +
                    `Set to: ${expectedUrl}\n` +
                    `Previous value: ${currentUrl || '(empty)'}`
                );
                
            } catch (updateError) {
                log.error('afterSubmit - Update Failed', 
                    `Contact ID ${contactId}: Failed to update URL - ${updateError.message}`);
                // Don't throw the error to prevent issues with the user's save operation
                // The record is already saved, we're just updating the URL field
            }
            
        } catch (e) {
            log.error('afterSubmit - Unexpected Error', `Error: ${e.message}\n${e.stack}`);
            // Don't throw to prevent affecting the user's workflow
        }
    };

    return {
        afterSubmit: afterSubmit
    };
});