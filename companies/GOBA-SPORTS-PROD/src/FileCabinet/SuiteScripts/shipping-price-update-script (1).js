/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Script: Sales Order Shipping Line Price Update
 * Description: Updates shipping line item with custbody_shipping_line_price value
 */
define(['N/record', 'N/log'], function(record, log) {
    
    /**
     * Function to be executed before record is submitted
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type; use context.UserEventType enum
     * @returns {void}
     */
    function beforeSubmit(context) {
        try {
            // Get the new record from context
            const newRecord = context.newRecord;
            
            // Debug: Log the record type
            log.debug({
                title: 'Script Execution Started',
                details: 'Record Type: ' + newRecord.type
            });
            
            // Check if it's a sales order
            if (newRecord.type !== record.Type.SALES_ORDER) {
                log.debug({
                    title: 'Script Terminated',
                    details: 'Not a Sales Order. Record type: ' + newRecord.type
                });
                return;
            }
            
            // Get the shipping line price custom field value
            const shippingLinePrice = newRecord.getValue({
                fieldId: 'custbody_shipping_line_price'
            });
            
            // Debug: Log the shipping line price
            log.debug({
                title: 'Custom Field Value',
                details: 'custbody_shipping_line_price = ' + shippingLinePrice + 
                         ' (Type: ' + typeof shippingLinePrice + ')'
            });
            
            // Only proceed if the shipping line price has a value
            if (!shippingLinePrice) {
                log.debug({
                    title: 'Script Terminated',
                    details: 'No shipping line price found in custom field'
                });
                return;
            }
            
            // Get the line count for items
            const lineCount = newRecord.getLineCount({
                sublistId: 'item'
            });
            
            // Debug: Log the line count
            log.debug({
                title: 'Item Sublist',
                details: 'Total line items found: ' + lineCount
            });
            
            // Loop through all lines to find the shipping item (110007)
            log.debug({
                title: 'Searching for Shipping Item',
                details: 'Looking for item with internal ID: 110007'
            });
            
            let shippingItemFound = false;
            
            for (let i = 0; i < lineCount; i++) {
                const itemId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                
                // Debug: Log each item being checked
                log.debug({
                    title: 'Checking Line ' + i,
                    details: 'Item ID: ' + itemId
                });
                
                // Check if this is the shipping item (110007)
                if (itemId == 110007) {
                    log.debug({
                        title: 'Shipping Item Found',
                        details: 'Found at line ' + i
                    });
                    
                    shippingItemFound = true;
                    
                    // Get current rate for comparison
                    const currentRate = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i
                    });
                    
                    log.debug({
                        title: 'Current Values',
                        details: 'Current Rate: ' + currentRate + ', New Rate: ' + shippingLinePrice
                    });
                    
                    // Set the rate (price) for this line
                    newRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i,
                        value: shippingLinePrice
                    });
                    
                    log.debug({
                        title: 'Rate Updated',
                        details: 'Line ' + i + ' rate set to ' + shippingLinePrice
                    });
                    
                    // Also update the amount field (optional, NetSuite typically calculates this automatically)
                    const quantity = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    });
                    
                    const newAmount = shippingLinePrice * quantity;
                    
                    newRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i,
                        value: newAmount
                    });
                    
                    log.debug({
                        title: 'Amount Updated',
                        details: 'Line ' + i + ' amount set to ' + newAmount + ' (Rate ' + shippingLinePrice + ' × Quantity ' + quantity + ')'
                    });
                    
                    // Break the loop once we've found and updated the shipping item
                    break;
                }
            }
            
            // Debug: Log if shipping item was not found
            if (!shippingItemFound) {
                log.debug({
                    title: 'Shipping Item Not Found',
                    details: 'No line item with ID 110007 was found in this Sales Order'
                });
            }
        } catch (e) {
            log.error({
                title: 'Error in beforeSubmit function',
                details: e.toString() + '\n\nStack Trace: ' + e.stack
            });
        }
        
        log.debug({
            title: 'Script Execution Completed',
            details: 'beforeSubmit function finished execution'
        });
    }
    
    // Return the functions that should be exposed for this script
    return {
        beforeSubmit: beforeSubmit
    };
});