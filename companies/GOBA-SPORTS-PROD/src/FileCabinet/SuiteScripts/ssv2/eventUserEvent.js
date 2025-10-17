/**
 * eventUserEvent.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName GOBA - Event
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */
define(["N/format", "N/log", "N/record", "N/search"], function (format, log, record, search) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = void 0;
    function afterSubmit(context) {
        log.debug('afterSubmit', `${context.type} event ${context.newRecord.id}`);
        if ([context.UserEventType.EDIT, context.UserEventType.CREATE].includes(context.type)) {
            // [GOBASD-10] Update the sales order with the event date/time
            const eventMessage = context.newRecord.getValue({ fieldId: 'message' });
            if (eventMessage) {
                const startOfOrderIDEncode = eventMessage.indexOf('id&#61;') + 7;
                log.debug('startOfOrderIDEncode', startOfOrderIDEncode);
                if (startOfOrderIDEncode > -1) {
                    const endOfStrEncode = eventMessage.indexOf('&amp');
                    log.debug('endOfStrEncode', endOfStrEncode);
                    if (endOfStrEncode > -1) {
                        const orderID = eventMessage.substring((startOfOrderIDEncode), (endOfStrEncode));
                        log.debug('orderId', orderID);
                        if (Number(orderID) > 0)
                            updateSalesOrder(orderID, context.newRecord);
                    }
                }
                else {
                    const startOfOrderID = eventMessage.indexOf('id=') + 3;
                    log.debug('startOfOrderID', startOfOrderID);
                    if (startOfOrderID > -1) {
                        const endOfStr = eventMessage.indexOf('&compid');
                        log.debug('endOfStr', endOfStr);
                        if (endOfStr > -1) {
                            const orderID = eventMessage.substring((startOfOrderID), (endOfStr));
                            if (Number(orderID) > 0) {
                                log.debug('orderId', orderID);
                                updateSalesOrder(orderID, context.newRecord);
                            }
                        }
                    }
                }
            }
        }
    }
    exports.afterSubmit = afterSubmit;
    function updateSalesOrder(orderId, rec) {
        const startDate = rec.getValue('startdate');
        const startTime = rec.getValue('starttime');
        const endTime = rec.getValue('endtime');
        // First make sure it's a sales order
        const values = search.lookupFields({ type: 'transaction', id: orderId, columns: ['recordtype'] });
        log.debug('updateSalesOrder', `Transction ${orderId}: ${JSON.stringify(values)}; startDate: ${startDate} (${typeof startDate}); startTime: ${startTime} (${typeof startTime}); endTime: ${endTime} (${typeof endTime})`);
        if (values.recordtype != 'salesorder')
            return;
        let startTimeStr = '', endTimeStr = ''; // [GOBA-25]
        if (startTime)
            startTimeStr = format.format({ value: startTime, type: format.Type.TIMEOFDAY });
        if (endTime)
            endTimeStr = format.format({ value: endTime, type: format.Type.TIMEOFDAY });
        record.submitFields({
            type: record.Type.SALES_ORDER,
            id: orderId,
            values: { custbody_sms_event_start_date: startDate, custbody_sms_event_start_time: startTimeStr, custbody_sms_event_end_time: endTimeStr }
        });
        log.debug('updateSalesOrder', `Updated sales order ${orderId}.`);
    }
    return exports;
});
