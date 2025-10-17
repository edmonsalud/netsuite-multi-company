/**
 * @NApiVersion 2.0
 * @NScriptType WorkflowActionScript
 */
define(['N/log', 'N/record'], function (log, record) {

    function onAction(context) {
        try {
            var newRecord = context.newRecord;
            var recordId = newRecord.id || 'New Record (No ID yet)'; // Log the internal ID or indicate it's a new record

            // Log the record ID
            log.debug('Processing Record', 'Record ID: ' + recordId);

            // Check if the status is marked as Started
            var status = newRecord.getValue({ fieldId: 'status' });
            if (status !== 'Started') { // Update if your status value differs
                log.debug('Skipped Record', 'Status is not "Started". Current status: ' + status);
                return;
            }

            var totalValue = 0;
            var lineCount = newRecord.getLineCount({ sublistId: 'item' });

            // Log the number of transaction lines
            log.debug('Line Count', 'Number of lines in the transaction: ' + lineCount);

            // Loop through each line item
            for (var i = 0; i < lineCount; i++) {
                var adjustedQty = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'countquantity',
                    line: i
                });

                var rate = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    line: i
                });

                // Log the adjusted quantity and rate separately
                log.debug('Line Quantity', 'Line ' + (i + 1) + ': Adjusted Qty = ' + adjustedQty);
                log.debug('Line Rate', 'Line ' + (i + 1) + ': Rate = ' + rate);

                // Calculate the total for this line
                if (adjustedQty && rate) {
                    totalValue += adjustedQty * rate;
                    // Log the calculation details for the current line
                    log.debug('Line Calculation', 'Line ' + (i + 1) + ': Adjusted Qty = ' + adjustedQty + ', Rate = ' + rate + ', Line Total = ' + (adjustedQty * rate));
                }
            }

            // Log the total value being set
            log.debug('Total Value', 'Calculated Total Value: ' + totalValue);

            // Set the custom field on the record
            newRecord.setValue({
                fieldId: 'custbody_totalvalue',
                value: totalValue
            });

            log.debug('Field Update', 'custbody_totalvalue set to: ' + totalValue);

        } catch (error) {
            log.error('Error in onAction script', error.message);
        }
    }

    return {
        onAction: onAction
    };
});
