/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/search', 'N/log', 'N/task', 'N/runtime'], 
function(record, search, log, task, runtime) {

    function execute(context) {
        try {
            // Get today's date to compare in the search filter
            var today = new Date();
            today.setHours(0, 0, 0, 0); // Set time to start of the day

            // Format today's date to M/d/yy
            var formattedToday = (today.getMonth() + 1) + '/' + today.getDate() + '/' + (today.getFullYear() % 100);
            log.debug('Formatted Today Date', formattedToday); // Log the formatted date

            // Search for SuitePromotions that expired before today
            var promotionSearch = search.create({
                type: 'promotionCode', // Replace with correct record type
                filters: [
                    ['enddate', 'before', formattedToday], // Filter for dates before today
                    'AND',
                    ['canbeautoapplied', 'is', 'T'] // Filter for auto-applied promotions
                ],
                columns: ['internalid']
            });

            // Run the search and check if any results are found
            var searchResults = promotionSearch.run();
            var resultCount = 0;

            searchResults.each(function(result) {
                var promotionId = result.getValue('internalid');
                log.debug('Processing Promotion ID', promotionId); // Log each promotion ID being processed

                // Load the record using promotionCode as the type
                var promotionRecord = record.load({
                    type: 'promotionCode', // Corrected to match the search type
                    id: promotionId,
                    isDynamic: true
                });

                promotionRecord.setValue({
                    fieldId: 'canbeautoapplied', // Correct field ID for 'canBeAutoApplied'
                    value: false
                });

                promotionRecord.save();
                log.debug('Promotion Updated', 'Promotion ID ' + promotionId + ' set to not auto apply.');

                resultCount++;
                return true;
            });

            log.debug('Total Promotions Processed', resultCount); // Log the number of processed promotions

            if (resultCount === 0) {
                log.debug('No promotions found with an expiry date before today and canBeAutoApplied set to true.');
            }
            
        } catch (e) {
            log.error({
                title: 'Error in Scheduled Script',
                details: e.message
            });
        }
    }

    return {
        execute: execute
    };
});
