/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search'], (search) => {

    const beforeSubmit = (context) => {
        const title = "beforeSubmit() :: ";

        try {
            const rec = context.newRecord;
            const itemIds = [];

            const alreadyChecked = rec.getValue({
                fieldId: 'custbody_gs_net_return_transaction'
            });
            const subsidiaryId = rec.getValue({
                fieldId: 'subsidiary'
            });

            log.debug(title + "alreadyChecked:", alreadyChecked);

            if (alreadyChecked || subsidiaryId != 4) {

                if (alreadyChecked || subsidiaryId == 4) {
                    rec.setValue({
                        fieldId: 'department',
                        value: 118 //Net Return
                    });
                }

                return true;
            }

            const lineCount = rec.getLineCount({ sublistId: 'item' }) || 0;

            if (lineCount > 0) {

                for (let i = 0; i < lineCount; i++) {

                    const itemId = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    itemIds.push(itemId);
                }

                log.debug(title + "itemIds:", JSON.stringify(itemIds));

                if (itemIds.length > 0) {

                    let hasNetReturn = false;

                    const itemSearch = search.create({
                        type: search.Type.ITEM,
                        filters: [
                            ['internalid', 'anyof', itemIds],
                            'AND',
                            ['custitem_gs_net_return_item', 'is', 'T']
                        ],
                        columns: ['internalid']
                    });

                    const searchResult = itemSearch.run().getRange({ start: 0, end: 1000 });

                    log.debug(title + "searchResult.length:", searchResult.length);

                    if (searchResult.length > 0) {

                        hasNetReturn = true;

                        rec.setValue({
                            fieldId: 'custbody_gs_net_return_transaction',
                            value: hasNetReturn
                        });

                        if (subsidiaryId == 4) {
                            rec.setValue({
                                fieldId: 'department',
                                value: 118
                            });
                        }

                    }

                }
            }

            return true;



        } catch (e) {
            log.error("ERROR IN " + title, e.message);

        }
    };

    return {
        beforeSubmit
    };

});
