/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define([], function () {

    function fieldChanged(context) {
        const title = "fieldChanged() :: ";

        try {
            if (context.sublistId === 'item' && context.fieldId === 'giftcertrecipientname') {
                var rec = context.currentRecord;

                var item = rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                var description = rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'description'
                });

                if (!item && description && description.trim() == 'Shipping') {

                    rec.cancelLine({
                        sublistId: 'item'
                    });

                }
            }

            return true;

        } catch (e) {
            log.error("ERRO IN " + title, e.message);
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});
