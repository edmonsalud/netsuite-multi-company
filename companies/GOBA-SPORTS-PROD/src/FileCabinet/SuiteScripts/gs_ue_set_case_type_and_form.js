/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record'], function (record) {

    function beforeSubmit(context) {

        try {
            if (context.type !== context.UserEventType.CREATE) return;

            var caseRecord = context.newRecord;
            var title = caseRecord.getValue({ fieldId: 'title' });
            var caseOrigin = caseRecord.getValue({ fieldId: 'origin' });
            log.debug("caseRecord.id:", caseRecord.id);

            if (caseOrigin == -5) {

                if (title.toLowerCase().indexOf('warranty claim') != -1) {
                    caseRecord.setValue({
                        fieldId: 'custevent_case_type',
                        value: '15'
                    });
                } else if (title.toLowerCase().indexOf('warranty registration') != -1) {
                    caseRecord.setValue({
                        fieldId: 'custevent_case_type',
                        value: '16'
                    });

                }
                if (title.toLowerCase().indexOf('warranty claim') != -1 || title.toLowerCase().indexOf('warranty registration') != -1) {
                    caseRecord.setValue({
                        fieldId: 'customform',
                        value: '81'
                    });
                }


            }

        } catch (e) {
            log.error("ERROR IN beforSubmit() :: ", e.mssage);
        }

    }

    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE) return;

        try {
            var caseOrigin = context.newRecord.getValue({ fieldId: 'origin' });
            var title = context.newRecord.getValue({ fieldId: 'title' }) || "";
            log.debug("aftersubmit() context.newRecord.id:", context.newRecord.id);

            if (caseOrigin == -5) {

                if (title.toLowerCase().indexOf('warranty claim') != -1 || title.toLowerCase().indexOf('warranty registration') != -1) {
                    var recId = context.newRecord.id;
                    log.debug("recId:", recId)
                    var loadedRecord = record.load({
                        type: "supportcase",
                        id: recId,
                        isDynamic: true
                    });

                    loadedRecord.setValue({
                        fieldId: 'customform',
                        value: '81'
                    });

                    loadedRecord.save({
                        ignoreMandatoryFields: true
                    });

                }

            }


        } catch (e) {
            log.error('Error in afterSubmit save', e);
        }
    }

    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});
