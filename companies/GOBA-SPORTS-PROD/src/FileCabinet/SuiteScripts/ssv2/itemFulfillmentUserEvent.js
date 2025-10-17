/**
 * itemFulfillmentUserEvent.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Item Fulfillment - User Event
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */
define(["N/log", "N/search"], function (log, search) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function beforeSubmit(context) {
        if (~[context.UserEventType.CREATE, context.UserEventType.EDIT].indexOf(context.type)) {
            var subsidiary = context.newRecord.getValue('subsidiary');
            if (~['10', '9', '2', '8'].indexOf(subsidiary)) { // Set the Total Value value; 10 = Core Sports; 9 = RMP Athletic; 2 = Springree Trampoline; 8 is RMP
                var createdFrom = context.newRecord.getValue('createdfrom');
                var totalValue = 0;
                var results = search.create({
                    type: 'salesorder',
                    filters: [['mainline', 'is', 'F'], 'and', ['internalid', 'anyof', createdFrom]],
                    columns: ['item', 'rate', 'exchangerate']
                }).run().getRange({ start: 0, end: 1000 });
                log.debug('Before Submit', "Parent sales order " + createdFrom + " lines found: " + results.length + "; subsidiary " + subsidiary + ".");
                for (var line = 0; line < context.newRecord.getLineCount({ sublistId: 'item' }); line++) {
                    var selected = context.newRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: line });
                    var quantity = context.newRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: line });
                    var itemId = context.newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: line });
                    var rate = 0;
                    if (!selected)
                        continue;
                    for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                        var result = results_1[_i];
                        if (result.getValue('item') == itemId) {
                            log.debug('Before Submit', "Adding item sale price for item " + itemId + ", Quantity " + quantity + ", Rate " + result.getValue('rate') + ".");
                            var itemRate = Number(result.getValue('rate'));
                            var exchangeRate = Number(result.getValue('exchangerate'));
                            rate = itemRate * exchangeRate;
                            break;
                        }
                    }
                    totalValue += quantity * rate;
                }
                context.newRecord.setValue('custbody_totalvalue', totalValue);
            }
        }
    }
    exports.beforeSubmit = beforeSubmit;
    function afterSubmit(context) {
        log.debug('After Submit', context.type + " rec " + context.newRecord.id + ".");
    }
    exports.afterSubmit = afterSubmit;
    return exports;
});
