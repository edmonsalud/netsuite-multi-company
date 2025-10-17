/**
 * addFedexPackagesUSSuitelet.ts
 * by Head in the Cloud Development, Ltd.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Add FedEx Packages US SL
 * @NScriptType Suitelet
 * @NApiVersion 2.1
 */
define(["N/search", "N/log", "N/record", "./autoPopulateForFedExCanadaFulfillmentsSuitelet"], function (search, log, record, autoPopulateForFedExCanadaFulfillmentsSuitelet_1) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = void 0;
    function onRequest(context) {
        const recId = context.request.parameters['recid'];
        if (!recId)
            return context.response.write('Missing required recid parameter');
        let itemFulfillment;
        try {
            log.audit(context.request.method, `Loading fulfillment ${recId} at ${new Date()}.`);
            itemFulfillment = record.load({ type: 'itemfulfillment', id: recId, isDynamic: true });
        }
        catch (e) {
            log.error('onRequest', `Failed to load IF ${recId}: ${e.message}`);
            return context.response.write(`Failed to load IF ${recId}: ${e.message}`);
        }
        const country = itemFulfillment.getValue('shipcountry');
        const fedExSublistLines = itemFulfillment.getLineCount({ sublistId: 'packagefedex' });
        log.debug('onRequest', `Loaded item fulfillment ID: ${recId}; Customer Country: ${country} fedExSublistLines: ${fedExSublistLines}.`);
        if (fedExSublistLines == -1)
            return context.response.write('Unable to process - this fulfillment does not have a FedEx shipping method set.'); // [GOBA-23]
        itemFulfillment.setValue('shipstatus', 'B'); // Packed
        createPackageSubtlistForFedEx(itemFulfillment);
        try {
            log.debug('Before Save IF', `Packages: ${itemFulfillment.getLineCount({ sublistId: 'packagefedex' })}`);
            const fulfId = itemFulfillment.save({ ignoreMandatoryFields: true });
            log.debug('Save Item Fulfillment', fulfId);
            const updatedFulf = record.load({ type: 'itemfulfillment', id: fulfId });
            log.debug('Saved IF', `Packages: ${updatedFulf.getLineCount({ sublistId: 'packagefedex' })}`);
            log.debug('Complete', `Saved item fulfillment ${recId} in packed status.`);
            record.submitFields({ type: 'itemfulfillment', id: recId, values: { shipstatus: 'B' } });
            context.response.write('success');
        }
        catch (e) {
            log.error('Failed to save', e.message);
            context.response.write(e.message || 'Unexpected error');
        }
    }
    exports.onRequest = onRequest;
    function createPackageSubtlistForFedEx(itemFulfillment) {
        const fedExRef = itemFulfillment.getSublistValue({ sublistId: 'packagefedex', fieldId: 'reference1fedex', line: 0 });
        const totalPackItem = itemFulfillment.getLineCount({ sublistId: 'packagefedex' });
        log.debug('createPackageSubtlistForFedEx', 'totalPackItem = ' + totalPackItem);
        // Removing existing package items in reverse order
        for (let i = totalPackItem - 1; i >= 0; i--) {
            itemFulfillment.removeLine({ sublistId: 'packagefedex', line: i });
        }
        for (let j = 0; j < itemFulfillment.getLineCount({ sublistId: 'item' }); j++) {
            const itemId = itemFulfillment.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
            const itemType = itemFulfillment.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j });
            const itemQty = Number(itemFulfillment.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: j }));
            const itemFields = search.lookupFields({
                type: search.Type.ASSEMBLY_ITEM,
                id: itemId,
                columns: ['custitem_noninventory_model']
            });
            const modelVals = itemFields.custitem_noninventory_model;
            log.debug('Model values', JSON.stringify(modelVals));
            log.debug('Line Number & Item Type', `line = ${j} + itemType = ${itemType}`);
            let itemDimension, itemWeight, itemLength, itemHeight, itemWidth;
            if ((itemType == 'Assembly' && modelVals.length > 0 && modelVals[0].value) || (itemType == 'Kit')) { // [GOBASD-19]
                // Loop for kit/assembly item to add packages per each associated items
                const itemRecordType = itemType == 'Kit' ? 'kititem' : 'assemblyitem';
                const itemRec = record.load({ type: itemRecordType, id: itemId });
                const totalCompItem = itemRec.getLineCount({ sublistId: 'member' });
                let compItemId;
                let compItemQty;
                for (let k = 0; k < totalCompItem; k++) {
                    const componentType = itemRec.getSublistValue({ sublistId: 'member', fieldId: 'sitemtype', line: k });
                    compItemId = itemRec.getSublistValue({ sublistId: 'member', fieldId: 'item', line: k });
                    if (componentType == 'Assembly') {
                        const assemblyItem = record.load({ type: record.Type.ASSEMBLY_ITEM, id: compItemId });
                        const assemblyItemFields = search.lookupFields({
                            type: search.Type.ASSEMBLY_ITEM,
                            id: compItemId,
                            columns: ['custitem_noninventory_model']
                        });
                        const assemblyModelVals = assemblyItemFields.custitem_noninventory_model;
                        if (assemblyModelVals.length > 0 && assemblyModelVals[0].value) {
                            for (let z = 0; z < assemblyItem.getLineCount({ sublistId: 'member' }); z++) {
                                const assemblyCompItemId = assemblyItem.getSublistValue({ sublistId: 'member', fieldId: 'item', line: z });
                                const assemblyCompQty = assemblyItem.getSublistValue({ sublistId: 'member', fieldId: 'quantity', line: z });
                                itemDimension = JSON.parse((0, autoPopulateForFedExCanadaFulfillmentsSuitelet_1.getItemDim)('item', assemblyCompItemId));
                                log.debug('Item Specifics', `itemId = ${assemblyCompItemId} + itemDimension = ${JSON.stringify(itemDimension)}`);
                                itemWeight = itemDimension.weight;
                                itemLength = itemDimension.length;
                                itemHeight = itemDimension.height;
                                itemWidth = itemDimension.width;
                                if (!itemWeight)
                                    continue;
                                const assemblyCompItemQty = assemblyItem.getSublistValue({ sublistId: 'member', fieldId: 'quantity', line: z });
                                log.debug('compItemQty', assemblyCompItemQty);
                                // For each Assembly Item quantity
                                for (let t = 0; t < itemQty; t++) {
                                    // For each Assembly Component quantity
                                    for (let m = 0; m < assemblyCompQty; m++) {
                                        log.debug('addPackage', '');
                                        try {
                                            addPackage(itemFulfillment, itemWeight, itemLength, itemHeight, itemWidth, fedExRef);
                                            log.debug('addPackage', `Package Added: ${itemFulfillment.getLineCount({ sublistId: 'packagefedex' })}`);
                                        }
                                        catch (e) {
                                            log.error('addPackage', `Error encountered whilst processing Package sublist: ${e.message} `);
                                        }
                                    }
                                }
                            }
                        }
                        else { // use item qty
                            itemDimension = JSON.parse((0, autoPopulateForFedExCanadaFulfillmentsSuitelet_1.getItemDim)('item', compItemId));
                            log.debug('Assembly component dimensions', `itemId = ${itemId}, itemDim = ${JSON.stringify(itemDimension)}, fedExRef = ${fedExRef}`);
                            itemWeight = itemDimension.weight;
                            itemLength = itemDimension.length;
                            itemHeight = itemDimension.height;
                            itemWidth = itemDimension.width;
                            // Add packages per each quantity
                            if (itemWeight) {
                                for (let k = 0; k < itemQty; k++) {
                                    addPackage(itemFulfillment, itemWeight, itemLength, itemHeight, itemWidth, fedExRef);
                                }
                            }
                        }
                    }
                    else {
                        itemDimension = JSON.parse((0, autoPopulateForFedExCanadaFulfillmentsSuitelet_1.getItemDim)('item', compItemId));
                        log.debug('Item Specifics', `itemId = ${compItemId} + itemDimension = ${JSON.stringify(itemDimension)}`);
                        itemWeight = itemDimension.weight;
                        itemLength = itemDimension.length;
                        itemHeight = itemDimension.height;
                        itemWidth = itemDimension.width;
                        if (itemWeight) {
                            compItemQty = itemRec.getSublistValue({ sublistId: 'member', fieldId: 'quantity', line: k });
                            log.debug('compItemQty', compItemQty);
                            // For each Assembly Item quantity
                            for (let l = 0; l < itemQty; l++) {
                                // For each Assembly Component quantity
                                for (let m = 0; m < compItemQty; m++) {
                                    log.debug('addPackage', '');
                                    try {
                                        addPackage(itemFulfillment, itemWeight, itemLength, itemHeight, itemWidth, fedExRef);
                                        log.debug('addPackage', `Package Added: ${itemFulfillment.getLineCount({ sublistId: 'packagefedex' })}`);
                                    }
                                    catch (e) {
                                        log.error('addPackage', `Error encountered whilst processing Package sublist: ${e.message} `);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else if (itemType == 'InvtPart') {
                itemDimension = JSON.parse((0, autoPopulateForFedExCanadaFulfillmentsSuitelet_1.getItemDim)('item', itemId));
                log.debug('Not a kit or assembly', `itemId = ${itemId}, itemDim = ${JSON.stringify(itemDimension)}, fedExRef = ${fedExRef}`);
                itemWeight = itemDimension.weight;
                itemLength = itemDimension.length;
                itemHeight = itemDimension.height;
                itemWidth = itemDimension.width;
                // Add packages per each quantity
                if (itemWeight) {
                    for (let k = 0; k < itemQty; k++) {
                        addPackage(itemFulfillment, itemWeight, itemLength, itemHeight, itemWidth, fedExRef);
                    }
                }
            }
        }
    }
    function addPackage(fulfillment, weight, length, height, width, fedexRef) {
        try {
            fulfillment.selectNewLine({ sublistId: 'packagefedex' });
            fulfillment.setCurrentSublistValue({ sublistId: 'packagefedex', fieldId: 'reference1fedex', value: fedexRef });
            fulfillment.setCurrentSublistValue({ sublistId: 'packagefedex', fieldId: 'packageweightfedex', value: weight });
            fulfillment.setCurrentSublistValue({ sublistId: 'packagefedex', fieldId: 'packagelengthfedex', value: length });
            fulfillment.setCurrentSublistValue({ sublistId: 'packagefedex', fieldId: 'packageheightfedex', value: height });
            fulfillment.setCurrentSublistValue({ sublistId: 'packagefedex', fieldId: 'packagewidthfedex', value: width });
            fulfillment.commitLine({ sublistId: 'packagefedex' });
        }
        catch (e) {
            log.error('addPackage', `Error encountered whilst processing Package sublist: ${e.message} `);
        }
    }
    return exports;
});
