/**
 * itemFulfillmentUEV2.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Item Fulfillment - User Event V2
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */
define(["N/log", "N/record", "N/runtime", "N/search", "./salesOrderUserEvent"], function (log, record, runtime, search, salesOrderUserEvent_1) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = exports.beforeLoad = void 0;
    function beforeLoad(context) {
        if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) { // [GOBA-28]
            if (context.type == context.UserEventType.VIEW) {
                const subsidiary = context.newRecord.getValue('subsidiary');
                const status = context.newRecord.getValue('shipstatus');
                if (subsidiary == '4' && status == 'A') { // SFT-CA (Canadian) and Picked status
                    log.debug('Before Load', `Rec ${context.newRecord.id} subsidiary ${subsidiary}, status: ${status}.`);
                    context.form.addButton({ id: 'custpage_mark_packed_canada', label: 'Mark Packed - Canada', functionName: 'markPackedCanadaButton' }); // [GOBASD-2]
                    context.form.clientScriptModulePath = './itemFulfillmentClient.js';
                }
                else if (subsidiary == '3' && status == 'A') { // SFT-US (United States) and Picked status
                    let buttonCA = false;
                    for (let line = 0; line < context.newRecord.getLineCount({ sublistId: 'item' }); line++) {
                        const wareHouseLocation = context.newRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line });
                        log.debug('Before Load', `Rec ${context.newRecord.id} subsidiary ${subsidiary}, status: ${status}, warehouse ${wareHouseLocation}.`);
                        if (wareHouseLocation == '75') { // Markham - G3
                            context.form.addButton({ id: 'custpage_mark_packed_canada', label: 'Mark Packed - Canada', functionName: 'markPackedCanadaButton' });
                            context.form.clientScriptModulePath = './itemFulfillmentClient.js';
                            buttonCA = true;
                            break;
                        }
                    }
                    if (!buttonCA) {
                        context.form.addButton({ id: 'custpage_mark_packed_us', label: 'Mark Packed - US', functionName: 'markPackedUSButton' });
                        context.form.clientScriptModulePath = './itemFulfillmentClient.js';
                    }
                }
            }
        }
    }
    exports.beforeLoad = beforeLoad;
    function afterSubmit(context) {
        log.debug('After Submit', `${context.type} rec ${context.newRecord.id}.`);
        log.debug('After Submit', `Packed? ${context.type == context.UserEventType.PACK}`);
        if (context.type != context.UserEventType.DELETE) { // [GOBASD-8]
            const status = context.newRecord.getValue('shipstatus');
            if (status == 'C') { // shipped
                sendFulfilledOrderToQuickContractors(context.newRecord);
            }
        }
    }
    exports.afterSubmit = afterSubmit;
    function sendFulfilledOrderToQuickContractors(rec) {
        const createdFrom = Number(rec.getValue('createdfrom'));
        const fieldLookup = search.lookupFields({ type: search.Type.TRANSACTION, id: createdFrom, columns: ['type'] });
        const createdFromType = fieldLookup['type'];
        log.debug('sendFulfilledOrderToQuickContractors', `IF ${rec.id} parent transaction ${createdFrom} values: ${JSON.stringify(fieldLookup)}.`);
        if (createdFrom > 0 && createdFromType[0].value == 'SalesOrd') {
            let salesOrder = null;
            try { // [GOBA-24]
                salesOrder = record.load({ type: record.Type.SALES_ORDER, id: createdFrom });
            }
            catch (e) { // Unexpected error?
                log.error('sendFulfilledOrderToQuickContractors', `Failed to load sales order ${createdFrom}: ${e.message}`);
            }
            if (salesOrder)
                (0, salesOrderUserEvent_1.sendJobToQuickContractors)(salesOrder);
        }
    }
    return exports;
});
