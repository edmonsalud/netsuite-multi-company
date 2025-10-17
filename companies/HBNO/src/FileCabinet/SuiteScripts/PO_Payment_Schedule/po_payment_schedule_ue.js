/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * po_payment_schedule_ue.js
 * User Event Script for automatic PO Payment Schedule generation
 * Simplified version - Only triggers on PO creation
 *
 * Version: 1.0.0
 * Author: HBNO Development Team
 *
 * Deployment:
 * - Record Type: Purchase Order
 * - Events: afterSubmit (create only)
 * - Execute As Role: Administrator (or role with custom record permissions)
 */
define(['N/log', 'N/runtime', 'N/error',
        './lib/Constants', './lib/PaymentScheduleManager'],
function(log, runtime, error,
         Constants, PaymentScheduleManager) {

    /**
     * Function executed after a Purchase Order is submitted
     * @param {Object} context - User event context
     * @param {Record} context.newRecord - New record
     * @param {string} context.type - Trigger type
     */
    function afterSubmit(context) {
        try {
            // Only process on CREATE event
            if (context.type !== context.UserEventType.CREATE) {
                return;
            }

            const newRecord = context.newRecord;
            log.audit('afterSubmit', 'Processing new PO: ' + newRecord.id);

            // Check if payment terms have been set
            const paymentTermsId = newRecord.getValue(Constants.PO_FIELDS.PAYMENT_TERMS_CUSTOM);
            if (!paymentTermsId) {
                log.debug('afterSubmit', 'No custom payment terms set on PO ' + newRecord.id);
                return;
            }

            // Check governance before processing
            const remainingUsage = runtime.getCurrentScript().getRemainingUsage();
            if (remainingUsage < Constants.GOVERNANCE.THRESHOLD_CRITICAL) {
                log.error('afterSubmit', 'Insufficient governance remaining: ' + remainingUsage);
                throw error.create({
                    name: 'GOVERNANCE_ERROR',
                    message: 'Insufficient governance units to process payment schedules'
                });
            }

            // Process payment schedules
            const result = PaymentScheduleManager.processPaymentSchedules(newRecord);

            // Handle results
            if (result.success) {
                log.audit('afterSubmit', 'Successfully created ' + result.schedulesCreated +
                         ' payment schedules for PO ' + newRecord.id);

                // Log warnings if any
                if (result.warnings && result.warnings.length > 0) {
                    log.warning('afterSubmit', 'Warnings: ' + result.warnings.join('; '));
                }

            } else {
                // Log errors and throw exception to make them visible
                const errorMessage = 'Failed to create payment schedules for PO ' + newRecord.id +
                                   '\nErrors: ' + result.errors.join('\n');
                log.error('afterSubmit', errorMessage);

                throw error.create({
                    name: 'PAYMENT_SCHEDULE_ERROR',
                    message: result.errors[0] || 'Payment schedule creation failed',
                    notifyOff: false
                });
            }

        } catch (e) {
            log.error('afterSubmit', 'Script error processing PO ' + context.newRecord.id +
                     ': ' + e.message + '\nStack: ' + e.stack);
            throw e;
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});