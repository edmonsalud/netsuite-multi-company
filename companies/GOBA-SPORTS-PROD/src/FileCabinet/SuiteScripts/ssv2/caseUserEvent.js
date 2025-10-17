/**
 * caseUserEvent.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Case - User Event
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */
define(["N/log"], function (log) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = exports.beforeSubmit = void 0;
    function beforeSubmit(context) {
        log.debug('beforeSubmit', `${context.type} case ${context.newRecord.id}`);
        if (context.type == context.UserEventType.CREATE) { // [GOBASD-37]
            const proofOfPurchaseId = context.newRecord.getValue('custevent_case_store_receipt_id');
            if (proofOfPurchaseId)
                context.newRecord.setValue('custevent_store_receipt', proofOfPurchaseId);
            const photoOfDamage = context.newRecord.getValue('custevent_case_photo_of_damage_id');
            if (photoOfDamage)
                context.newRecord.setValue('custevent_photo1', photoOfDamage);
        }
    }
    exports.beforeSubmit = beforeSubmit;
    function afterSubmit(context) {
        log.debug('afterSubmit', `${context.type} case ${context.newRecord.id}`);
    }
    exports.afterSubmit = afterSubmit;
    return exports;
});
