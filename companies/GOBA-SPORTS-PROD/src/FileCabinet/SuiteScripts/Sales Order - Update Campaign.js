/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search'], function(log, record, search) {

    function beforeSubmit(context) {
        var currRec = context.newRecord;
        var recordType = currRec.type;

        log.debug('Before Submit Triggered', 'Record Type: ' + recordType);

        var leadSourceSet = false; // Flag to track if leadsource is already set

        // Check if the promotions sublist exists
        if (currRec.getSublistFields({ sublistId: 'promotions' })) {
            var promoLineCount = currRec.getLineCount({ sublistId: 'promotions' });
            log.debug('Promotions Sublist Found', 'Number of lines in promotions: ' + promoLineCount);

            var maxCampaignId = null;

            for (var i = 0; i < promoLineCount; i++) {
                var promoCodeId = currRec.getSublistValue({
                    sublistId: 'promotions',
                    fieldId: 'promocode',
                    line: i
                });

                if (promoCodeId) {
                    log.debug('Promotion Code ID', 'Promotion Code ID for line ' + (i + 1) + ': ' + promoCodeId);
                    try {
                        var promotionRecord = record.load({
                            type: 'promotioncode',
                            id: promoCodeId
                        });
                        var campaignId = promotionRecord.getValue({ fieldId: 'custrecord_linked_campaign' });
                        log.debug('Promotion Line ' + (i + 1), 'Promotion Code ID: ' + promoCodeId + ', Linked Campaign ID: ' + (campaignId || 'None'));
                        
                        if (campaignId && (!maxCampaignId || campaignId > maxCampaignId)) {
                            maxCampaignId = campaignId;
                        }
                    } catch (e) {
                        log.error('Error loading promotion record', 'Error loading promotion with ID: ' + promoCodeId + ' - ' + e.message);
                    }
                }
            }

            if (maxCampaignId) {
                currRec.setValue({ fieldId: 'leadsource', value: maxCampaignId });
                log.debug('Lead Source Set', 'Lead Source (Campaign) set to the maximum campaign ID: ' + maxCampaignId);
                leadSourceSet = true;
            }
        }

        if (!leadSourceSet) {
            var subsidiary = currRec.getValue({ fieldId: 'subsidiary' });
            var salesSource = currRec.getValue({ fieldId: 'custbody_salessource' });
            var transactionDate = currRec.getValue({ fieldId: 'trandate' });
            var itemClass = null;
            var itemLineCount = currRec.getLineCount({ sublistId: 'item' });

            if (itemLineCount > 0) {
                itemClass = currRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'class',
                    line: 0
                });
            }

            log.debug('Order Details', {
                subsidiary: subsidiary,
                salesSource: salesSource,
                itemClass: itemClass || 'No Value Found',
                transactionDate: transactionDate,
                itemLineCount: itemLineCount
            });

            var campaignNew = null;
            var campaignSearch = search.create({
                type: 'customrecord_transaction_campaigns',
                columns: ['id', 'custrecord_subsidiary', 'custrecord_sales_source', 'custrecord_campaign', 'custrecord_transaction_type', 'custrecord_start_date', 'custrecord_end_date']
            });

            campaignSearch.run().each(function(result) {
                var campaignSubsidiary = result.getValue('custrecord_subsidiary');
                var campaignSalesSources = result.getValue('custrecord_sales_source');
                var salesSourceArray = campaignSalesSources ? campaignSalesSources.split(',') : [];
                var campaignClass = result.getValue('custrecord_transaction_type');
                var classArray = campaignClass ? campaignClass.split(',') : [];
                var campaignStartDate = result.getValue('custrecord_start_date');
                var campaignEndDate = result.getValue('custrecord_end_date');

                // Ensure transaction date comparison works correctly
                var startDate = new Date(campaignStartDate);
                var endDate = new Date(campaignEndDate);
                var transDate = new Date(transactionDate);

                if (
                    campaignSubsidiary == subsidiary &&
                    salesSource && salesSourceArray.indexOf(salesSource.toString()) !== -1 &&
                    itemClass && classArray.indexOf(itemClass.toString()) !== -1 &&
                    transDate >= startDate &&
                    transDate <= endDate
                ) {
                    campaignNew = result.getValue('custrecord_campaign');
                    return false;
                }
                return true;
            });

            if (campaignNew) {
                currRec.setValue({ fieldId: 'leadsource', value: campaignNew });
                log.debug('Lead Source Set', 'Lead Source (Campaign) set to: ' + campaignNew);
            } else {
                log.debug('No Campaign match found', 'No campaign match found in transaction campaign records');
            }
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
