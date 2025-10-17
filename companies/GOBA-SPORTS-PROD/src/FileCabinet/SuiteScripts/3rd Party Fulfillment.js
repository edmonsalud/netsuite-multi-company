/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/log'], function (search, record, log) {
    function execute(context) {
        try {
            // Load the saved search for orders
            var orderSearch = search.load({ id: 'customsearch_3rd_party_to_be_fulfilled' });

            // Run through each order in the saved search
            orderSearch.run().each(function (result) {
                var salesOrderId = result.id;
                var subsidiaryId = result.getValue({ name: 'subsidiary' }); // Get the subsidiary from the sales order

                log.debug('Processing Sales Order', 'ID: ' + salesOrderId + ', Subsidiary: ' + subsidiaryId);

                try {
                    // Create item fulfillment for the sales order
                    var fulfillment = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: salesOrderId,
                        toType: record.Type.ITEM_FULFILLMENT,
                        isDynamic: true
                    });

                    // Set the 'shipmethod' field based on the subsidiary
                    var shipMethodId = null;
                    if (subsidiaryId === 'SFT-US') {
                        shipMethodId = 1336; // Internal ID for the ship method for "SFT-US"
                    } else if (subsidiaryId === 'SFT-CA') {
                        shipMethodId = 1338; // Internal ID for the ship method for "SFT-CA"
                    }

                    if (shipMethodId) {
                        fulfillment.setValue({ fieldId: 'shipmethod', value: shipMethodId });
                    }

                    // Set package fields to avoid the PACKAGE_WEIGHT_REQD error
                    fulfillment.setValue({ fieldId: 'packageweight', value: 1 }); // Set weight to 1

                    // Track fulfilled items (by item ID)
                    var fulfilledItems = [];

                    // Process only service items and set them as shipped
                    for (var i = 0; i < fulfillment.getLineCount({ sublistId: 'item' }); i++) {
                        fulfillment.selectLine({ sublistId: 'item', line: i });
                        var itemId = fulfillment.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item'
                        });
                        var itemType = fulfillment.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype'
                        });

                        // Only process items to be fulfilled (e.g., service items)
                        if (itemType === 'Service' || itemType === 'InventoryItem') {
                            fulfillment.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'itemreceive',
                                value: true
                            });
                            fulfillment.commitLine({ sublistId: 'item' });
                            fulfilledItems.push(itemId);
                        } else {
                            fulfillment.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'itemreceive',
                                value: false
                            });
                            fulfillment.commitLine({ sublistId: 'item' });
                        }
                    }

                    // Set the fulfillment status to shipped
                    fulfillment.setValue({ fieldId: 'shipstatus', value: 'C' });

                    // Uncheck the "generateintegratedshipperlabel" field
                    fulfillment.setValue({ fieldId: 'generateintegratedshipperlabel', value: false });

                    // Save the fulfillment
                    var fulfillmentId = fulfillment.save();
                    log.debug('Fulfillment created successfully', 'Fulfillment ID: ' + fulfillmentId);

                    // Now, create an invoice for the fulfilled items
                    var invoice = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: salesOrderId,
                        toType: record.Type.INVOICE,
                        isDynamic: true
                    });

                    // Process only fulfilled items for invoicing
                    for (var j = invoice.getLineCount({ sublistId: 'item' }) - 1; j >= 0; j--) {
                        invoice.selectLine({ sublistId: 'item', line: j });
                        var invoiceItemId = invoice.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item'
                        });

                        // Remove the line if the item was not fulfilled and is not a discount
                        var itemType = invoice.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype'
                        });

                        if (fulfilledItems.indexOf(invoiceItemId) === -1 && itemType !== 'Discount') {
                            invoice.removeLine({ sublistId: 'item', line: j });
                        }
                    }

                    // Save the invoice if it contains any items
                    if (invoice.getLineCount({ sublistId: 'item' }) > 0) {
                        var invoiceId = invoice.save();
                        log.debug('Invoice created successfully', 'Invoice ID: ' + invoiceId);
                    } else {
                        log.debug('No items to invoice for Sales Order', salesOrderId);
                    }
                } catch (fulfillmentInvoiceError) {
                    log.error('Error during fulfillment or invoicing', {
                        salesOrderId: salesOrderId,
                        error: fulfillmentInvoiceError
                    });
                }

                return true;
            });
        } catch (mainError) {
            log.error('Error in Scheduled Script', mainError);
        }
    }

    return { execute: execute };
});
