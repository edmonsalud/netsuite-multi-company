/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/format'], function (log, format) {
    function beforeSubmit(context) {
        if (context.type !== context.UserEventType.CREATE) {
            return;
        }

        try {
            var newRecord = context.newRecord;

            // Ensure the order record is accessible
            if (!newRecord) {
                log.debug('Error', 'Order record is null or undefined');
                return;
            }

            log.debug('Order Info', 'Order ID: ' + newRecord.id);

            // Retrieve the transaction date
            var transactionDate = newRecord.getValue('trandate');
            var formattedDate = format.parse({
                value: transactionDate,
                type: format.Type.DATE
            });

            // Define the date range
            var startDate = new Date('2024-12-01'); // YYYY-MM-DD
            var endDate = new Date('2024-12-10');   // YYYY-MM-DD

            // Check if the transaction date is within the range
            if (formattedDate < startDate || formattedDate > endDate) {
                log.debug('Order Skipped', 'Order ID: ' + newRecord.id + ' - Date (' + formattedDate + ') not in range');
                return;
            }

            // Retrieve the subsidiary field value and log its type for debugging
            var subsidiary = newRecord.getValue('subsidiary');
            log.debug('Subsidiary Check', 'Order ID: ' + newRecord.id + ' - Subsidiary Value: ' + subsidiary + ' Type: ' + typeof subsidiary);

            // Manually check if subsidiary is CA (4), converting the subsidiary to a number
            subsidiary = parseInt(subsidiary, 10);  // Convert to number
            if (subsidiary !== 4) {
                log.debug('Order Skipped', 'Order ID: ' + newRecord.id + ' - Subsidiary not CA');
                return;
            }

            // Define the promo code for CA
            var promoCodeToAdd = '2683'; // Example promo code for CA

            // Internal IDs of the items to check against (ensure these are numbers)
            var skuInternalIds = [
                115012, 110159, 114764, 114775, 115349, 110155, 114763, 114774, 115351, 
                110160, 114762, 114773, 115350, 110154, 114765, 114776, 115348 // Example internal IDs
            ];

            // Ensure the item sublist is being accessed correctly
            var lineCount = newRecord.getLineCount({ sublistId: 'item' });
            log.debug('Line Count', 'Number of items in order: ' + lineCount);

            var itemFound = false;

            for (var i = 0; i < lineCount; i++) {
                var itemId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                log.debug('Item Internal ID on line ' + i, 'Item ID: ' + itemId);

                // Check if the item internal ID is in the list of target IDs
                if (skuInternalIds.indexOf(Number(itemId)) !== -1) {
                    itemFound = true;
                    break;  // Stop once a matching item is found
                }
            }

            if (itemFound) {
                log.debug('Matching SKU Found', 'Order ID: ' + newRecord.id + ' - Adding Promo Code: ' + promoCodeToAdd);

                // Add the promo code to the promotions sublist
                var promotionsLineCount = newRecord.getLineCount({ sublistId: 'promotions' });

                if (promotionsLineCount > 0) {
                    // Add the promo code to the next available line
                    newRecord.setSublistValue({
                        sublistId: 'promotions',
                        fieldId: 'promocode',
                        line: promotionsLineCount, // Add the promo code to the next available line
                        value: promoCodeToAdd
                    });

                    log.debug('Promo Code Added', 'Order ID: ' + newRecord.id + ', Promo Code: ' + promoCodeToAdd);
                } else {
                    // If there are no existing lines, create a new line and add the promo code
                    newRecord.insertLine({
                        sublistId: 'promotions',
                        line: promotionsLineCount
                    });

                    newRecord.setSublistValue({
                        sublistId: 'promotions',
                        fieldId: 'promocode',
                        line: promotionsLineCount,
                        value: promoCodeToAdd
                    });

                    log.debug('Promo Code Added', 'Order ID: ' + newRecord.id + ', Promo Code: ' + promoCodeToAdd);
                }
            } else {
                log.debug('No Matching SKU Found', 'Order ID: ' + newRecord.id + ' - No matching SKUs found');
            }

        } catch (error) {
            log.error('Error Processing Order', 'Error: ' + error.message);
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
