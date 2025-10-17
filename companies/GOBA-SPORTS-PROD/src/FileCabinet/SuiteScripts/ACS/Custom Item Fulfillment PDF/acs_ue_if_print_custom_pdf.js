/**
 *    Copyright (c) 2022, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author MJANICEK | 01/2023
 * @description Adds button to Expense Report to create sublist line with amount to zero the total.
 *
 */
/*jshint esversion: 6, multistr: true */

define([], function () {
    function beforeLoad(scriptContext) {
        if (scriptContext.type == 'view'){
            const objRec = scriptContext.newRecord;

            // SO Number from which was IF created
            const fieldCreatedFrom = objRec.getValue('createdfrom');

            // Create Array of items in Items sublist which have Model column data specified
            // For these will be details searched later
            const itemLinesWithModel = [];
            for (let line = 0; line < objRec.getLineCount('item'); line++){
                const currentLineModel = objRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_acs_item_model',
                    line
                });
                if (currentLineModel != ''){
                    const currentLineItemID = objRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line
                    });
                    itemLinesWithModel.push(currentLineItemID);
                }
            }

            // Add custom button //
            scriptContext.form.addButton({
                id: 'custpage_if_custom_print_pdf',
                label: 'Print Custom Packing Slip',
                functionName: `window.open("/app/site/hosting/scriptlet.nl?script=customscript_acs_sl_if_custom_pdf&deploy=customdeploy_acs_sl_if_custom_pdf&recordId=${objRec.id}&recordType=${objRec.type}&createdFrom=${fieldCreatedFrom}&itemIDs=${itemLinesWithModel.join()}")`
            });
        }
    }
    return {
        beforeLoad
    };
});
