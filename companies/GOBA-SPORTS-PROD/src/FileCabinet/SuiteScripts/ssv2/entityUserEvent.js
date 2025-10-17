/**
 * entityUserEvent.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Entity - User Event
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */
define(["N/log", "./zones/freightAndInstallZoneUtils"], function (log, freightAndInstallZoneUtils_1) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = exports.beforeSubmit = void 0;
    function beforeSubmit(context) {
        log.debug('beforeSubmit', `${context.type} ${context.newRecord.type} ${context.newRecord.id}`);
        if ([context.UserEventType.EDIT, context.UserEventType.CREATE].includes(context.type)) {
            const subsidiary = context.newRecord.getValue({ fieldId: 'subsidiary' });
            if (freightAndInstallZoneUtils_1.runInSubsidiary(subsidiary)) {
                const defaultShipAddress = freightAndInstallZoneUtils_1.getCustomerDefaultAddress(context.newRecord);
                if (defaultShipAddress) {
                    freightAndInstallZoneUtils_1.setFreightAndInstallDefaultsOnCustomerRecord(context.newRecord, defaultShipAddress);
                }
            }
        }
    }
    exports.beforeSubmit = beforeSubmit;
    function afterSubmit(context) {
        log.debug('afterSubmit', `${context.type} ${context.newRecord.type} ${context.newRecord.id}`);
    }
    exports.afterSubmit = afterSubmit;
    return exports;
});
