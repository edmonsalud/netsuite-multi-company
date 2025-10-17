/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */

define(['N/record', 'N/search', 'N/log'], function(record, search, log) {
    
    function execute(context) {
        try {
            // Load the saved search for Sales Orders
            var salesOrderSearch = search.load({
                id: 'customsearch_log_fulfill_auto' // Replace with the ID of your saved search
            });

            // Run the search and process each result
            salesOrderSearch.run().each(function(result) {
                var salesOrderId = result.id;
                log.debug('Processing Sales Order', 'Sales Order ID: ' + salesOrderId);

                try {
                    // Load the Sales Order record
                    var salesOrder = record.load({
                        type: record.Type.SALES_ORDER,
                        id: salesOrderId
                    });

                    // Verify that Logistics approval is checked
                    if (salesOrder.getValue('custbody_logistics_approval')) {
                        log.debug('Logistics Approval Checked', 'Sales Order ID: ' + salesOrderId);

                        // Transform the Sales Order into an Item Fulfillment
                        var fulfillment = record.transform({
                            fromType: record.Type.SALES_ORDER,
                            fromId: salesOrderId,
                            toType: record.Type.ITEM_FULFILLMENT
                        });

						// Loop through the items and exclude 'InstallTrampoline(4274)' or 'CostcoInstallTrampoline(115513)'
                        var lineCount = fulfillment.getLineCount({ sublistId: 'item' });
                        log.debug('Item Line Count', 'Count: ' + lineCount);

                        for (var i = 0; i < lineCount; i++) {
                            var itemName = fulfillment.getSublistText({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            });
                            log.debug('Item Name', 'Line ' + i + ': ' + itemName);

                            if (itemName === '4274' || itemName === '115513') {
                                // Uncheck the fulfill checkbox for these items
                                fulfillment.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'itemreceive',
                                    line: i,
                                    value: false
                                });
                                log.debug('Excluded Item', 'Line ' + i + ': ' + itemName + ' excluded from fulfillment');
                            }
                        }

                        // Set fulfillment status to "Picked"
                        fulfillment.setValue('shipstatus', 'A'); // 'A' is the code for 'Picked'
                        
                        // Save the Item Fulfillment record
                        var fulfillmentId = fulfillment.save();
                        log.audit('Fulfillment Created', 'Fulfillment ID: ' + fulfillmentId + ' for Sales Order: ' + salesOrderId);

                        // Uncheck the "Logistics fulfillment automation" checkbox on the Sales Order
                        salesOrder.setValue('custbody_log_fulfill_auto', false);
                        salesOrder.save();
                        log.audit('Logistics Fulfillment Automation Unchecked', 'Sales Order ID: ' + salesOrderId);
                    } else {
                        log.debug('Logistics Fulfillment Automation Not Checked', 'Sales Order ID: ' + salesOrderId + ' skipped.');
                    }
                } catch (fulfillmentError) {
                    log.error('Error Processing Sales Order', 'Sales Order ID: ' + salesOrderId + ' - ' + fulfillmentError.message);
                }

                return true; // Continue to next result
            });
        } catch (error) {
            log.error('Error in Scheduled Script', error.toString());
        }
    }

    return {
        execute: execute
    };
});
