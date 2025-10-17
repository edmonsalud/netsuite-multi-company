/**
 * updateOrderSuitelet.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Update Order Suitelet
 * @NScriptType Suitelet
 * @NApiVersion 2.x
 */
define(["N/log", "N/record"], function (log, record) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function onRequest(context) {
        var action = context.request.parameters['action'];
        var orderId = context.request.parameters['order'];
        var line = Number(context.request.parameters['line']);
        if (action && orderId && !isNaN(line)) {
            try {
                log.debug('Processing Order', "Order " + orderId + "; Line " + line + "; Action " + action + ".");
                processOrderLine(orderId, line, action);
            }
            catch (e) { // Try again...
                log.audit('Update failed', "Trying again for order " + orderId + " line " + line + " action " + action + ".");
                processOrderLine(orderId, line, action);
            }
        }
    }
    exports.onRequest = onRequest;
    function processOrderLine(orderId, line, action) {
        var order = record.load({ type: 'salesorder', id: orderId, isDynamic: true });
        var commitValue = action == 'recommit' ? '1' : '3';
        order.selectLine({ sublistId: 'item', line: line });
        order.setCurrentSublistValue({ sublistId: 'item', fieldId: 'commitinventory', value: commitValue });
        order.commitLine({ sublistId: 'item' });
        order.save({ ignoreMandatoryFields: true });
        log.debug('Order Saved', "Order " + orderId + "; Line " + line + "; Action " + action + ".");
    }
    return exports;
});
