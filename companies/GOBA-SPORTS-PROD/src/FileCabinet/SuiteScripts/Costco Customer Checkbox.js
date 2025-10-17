/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'], function(record, search, log) {

    function afterSubmit(context) {
        log.debug('Script Execution', 'Entered afterSubmit');

        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
            log.debug('Script Execution', 'Skipping, not CREATE or EDIT');
            return;
        }

        var salesOrder = context.newRecord;
        var customerId = salesOrder.getValue('entity');
        var lineCount = salesOrder.getLineCount({ sublistId: 'item' });

        log.debug('Script Execution', 'Sales Order ID: ' + salesOrder.id);
        log.debug('Script Execution', 'Customer ID: ' + customerId);
        log.debug('Script Execution', 'Line Count: ' + lineCount);

        var targetSKU = '115513'; // CostcoInstallTrampoline
        var checkboxFieldId = 'custentity_costco_cust'; // Your custom checkbox field ID
        var skuFound = false;

        for (var i = 0; i < lineCount; i++) {
            var item = salesOrder.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });

            log.debug('Script Execution', 'Checking Item: ' + item);

            if (item === targetSKU) {
                skuFound = true;
                log.debug('Script Execution', 'SKU Found: ' + targetSKU);
                break;
            }
        }

        if (skuFound) {
            var customerRecord = record.load({
                type: record.Type.CUSTOMER,
                id: customerId
            });

            customerRecord.setValue({
                fieldId: checkboxFieldId,
                value: true
            });

            customerRecord.save();

            log.debug('Script Execution', 'Customer Checkbox Updated');
        } else {
            log.debug('Script Execution', 'SKU Not Found');
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
