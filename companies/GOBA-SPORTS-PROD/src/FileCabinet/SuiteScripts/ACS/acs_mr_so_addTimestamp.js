/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/format'], function (record, format) {
    function getInputData() {
        // SB1  https://693183-sb1.app.netsuite.com/app/common/search/searchresults.nl?searchid=10367&saverun=T&whence=
        // PROD https://693183.app.netsuite.com/app/common/search/searchresults.nl?searchid=10367&saverun=T&whence=
        return {
            type: 'search',
            //id: 'customsearch_acs_no_timestamp_yet'
            id: 'customsearch_acs_no_timestamp_yet'
        };
    }

    function reduce(context) {
        try {
            log.audit('changed SO ID', record.submitFields({
                type: record.Type.SALES_ORDER,
                id: context.key,
                values: {
                    custbody_acs_zero_timestamp: format.format({
                        type: format.Type.DATETIME,
                        value: format.parse({
                            type: format.Type.DATETIME,
                            value: JSON.parse(context.values[0]).values['date.systemNotes']
                        }),
                        timezone: format.Timezone.AMERICA_NEW_YORK
                    })
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            }));
        } catch (error) {
            log.error('record.submitFields', error);
        }
    }

    function summarize(summary) {
        log.debug('summary', summary);
    }

    return {
        getInputData: getInputData,
        reduce: reduce,
        summarize: summarize
    };
});