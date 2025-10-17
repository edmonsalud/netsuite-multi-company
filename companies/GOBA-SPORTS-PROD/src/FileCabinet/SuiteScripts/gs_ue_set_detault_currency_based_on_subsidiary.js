/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @description Sets the default currency on Customer record based on the selected Subsidiary before the record is created or edited.
 */
define(['N/search'], (search) => {

    const beforeSubmit = (context) => {
        try {
            const rec = context.newRecord;
            const subsidiaryId = rec.getValue({ fieldId: 'subsidiary' });

            if (subsidiaryId) {
                const subsidiaryLookup = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiaryId,
                    columns: ['currency']
                });

                const defaultCurrency = subsidiaryLookup.currency?.[0]?.value || null;

                if (defaultCurrency) {
                    rec.setValue({
                        fieldId: 'currency',
                        value: defaultCurrency
                    });
                }
            }
        } catch (e) {
            log.error('Error setting default currency', e.message);
        }
    };

    return { beforeSubmit };
});
