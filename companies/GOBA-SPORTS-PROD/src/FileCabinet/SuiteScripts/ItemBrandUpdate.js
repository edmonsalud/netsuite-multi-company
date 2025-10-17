/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    function execute(context) {
        try {
            // Load the saved search
            var itemSearch = search.load({ id: 'customsearch11885' });

            // Run the saved search and get results in batches
            var pagedResults = itemSearch.runPaged({ pageSize: 1000 });

            pagedResults.pageRanges.forEach(function (pageRange) {
                var page = pagedResults.fetch({ index: pageRange.index });

                page.data.forEach(function (result) {
                    var itemId = result.getValue({ name: 'internalid' });
                    var itemType = result.recordType; // Fetch the item type from the result's record type
                    var brandId;

                    // Ensure itemId is not null or undefined
                    if (!itemId) {
                        log.error('Missing Item ID', 'Result does not contain a valid internalid.');
                        return;
                    }

                    // If the item type is 'Discount', set brandId to 1
                    if (itemType === 'discount') {
                        brandId = 1;
                    } else {
                        // Load the item record to fetch the class field
                        var itemRecord;
                        var itemClass;
                        try {
                            itemRecord = record.load({
                                type: itemType,
                                id: itemId
                            });
                            itemClass = itemRecord.getValue({ fieldId: 'class' });
                        } catch (e) {
                            log.error('Error Loading Item Record', { itemId: itemId, message: e.message });
                            return;
                        }

                        // Determine the cseg_brand value based on class
                        if (itemClass === '162' || itemClass === '163' || itemClass === '164' || itemClass === '165') {
                            brandId = 2;
                        } else {
                            brandId = 1;
                        }
                    }

                    // Update the cseg_brand field regardless of item type
                    try {
                        record.submitFields({
                            type: itemType, // Dynamically set the item type
                            id: itemId,
                            values: { cseg_brand: brandId },
                            options: { enableSourcing: true, ignoreMandatoryFields: true }
                        });

                        log.audit('Updated Item', { itemId: itemId, itemType: itemType, brandId: brandId });
                    } catch (e) {
                        log.error('Error Updating Item', { itemId: itemId, message: e.message });
                    }
                });
            });

        } catch (e) {
            log.error('Error Updating Items', e.message);
        }
    }

    return {
        execute: execute
    };
});
