/**
 * autoPopulateForFedExCanadaFulfillmentsSuitelet.ts
 * by Head in the Cloud Development, Ltd.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Auto Populate For FedEx Canada Fulfil SL
 * @NScriptType Suitelet
 * @NApiVersion 2.1
 */
define(["N/search", "N/log", "N/record"], function (search, log, record) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getItemDim = exports.onRequest = void 0;
    function onRequest(context) {
        const recId = context.request.parameters['recid'];
        if (!recId)
            return context.response.write('Missing required recid parameter');
        const itemFulfillment = record.load({ type: 'itemfulfillment', id: recId, isDynamic: true });
        const country = itemFulfillment.getValue('shipcountry');
        log.debug('onRequest', `Loaded item fulfillment ID: ${recId}; Customer Country: ${country}.`);
        itemFulfillment.setValue('shipstatus', 'B'); // Packed
        if (country == 'CA') { // Canada
            itemFulfillment.setValue({ fieldId: 'certoforiginfedex', value: false });
            itemFulfillment.setValue({ fieldId: 'comminvoicefedex', value: false });
            itemFulfillment.setValue({ fieldId: 'naftacertoforiginfedex', value: false });
            itemFulfillment.setValue({ fieldId: 'proformainvoicefedex', value: false });
        }
        else if (country == 'US') { // United States
            itemFulfillment.setValue({ fieldId: 'certoforiginfedex', value: false });
            itemFulfillment.setValue({ fieldId: 'comminvoicefedex', value: true });
            itemFulfillment.setValue({ fieldId: 'naftacertoforiginfedex', value: false });
            itemFulfillment.setValue({ fieldId: 'proformainvoicefedex', value: false });
        }
        createPackageSubtlistForFedEx(itemFulfillment);
        try {
            itemFulfillment.save();
            log.debug('Complete', `Saved item fulfillment ${recId} in packed status.`);
            context.response.write('success');
        }
        catch (e) {
            log.error('Failed to save', e.message);
            context.response.write(e.message || 'Unexpected error');
        }
    }
    exports.onRequest = onRequest;
    function createPackageSubtlistForFedEx(itemFulfillment) {
        const validFedex = ['3', '598', '1397']; // '3' = FedEx, '598' = FedEx CA, '1397' = FedEx 2 Day - CA
        try {
            const parentRec = itemFulfillment.getValue({ fieldId: 'createdfrom' });
            const shipMethod = itemFulfillment.getValue({ fieldId: 'shipmethod' });
            const fedExRef = itemFulfillment.getSublistValue({ sublistId: 'packagefedex', fieldId: 'reference1fedex', line: 0 });
            log.debug('createPackageSubtlistForFedEx', `IF ${itemFulfillment.id} parentRec ${parentRec}; fedex_ref: ${fedExRef}; shipMethod ${shipMethod}.`);
            if (parentRec && ~validFedex.indexOf(shipMethod)) { // AU = 1, US = 3, CA = 4, NZ = 5,
                //// Add Package sublist - START ////
                const totalPackItem = itemFulfillment.getLineCount({ sublistId: 'packagefedex' });
                log.debug('createPackageSubtlistForFedEx', 'totalPackItem = ' + totalPackItem);
                // Removing existing package items in reverse order
                for (let i = totalPackItem - 1; i >= 0; i--) {
                    itemFulfillment.removeLine({ sublistId: 'packagefedex', line: i });
                }
                log.debug('createPackageSubtlistForFedEx', 'totalPackItem_AfterRemove = ' + itemFulfillment.getLineCount({ sublistId: 'packagefedex' }));
                // Loop line items
                const totalLineItem = itemFulfillment.getLineCount({ sublistId: 'item' });
                log.debug('Total Items On Item Line', 'totalLineItem = ' + totalLineItem);
                for (let j = 0; j < totalLineItem; j++) {
                    const itemId = itemFulfillment.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                    const itemType = itemFulfillment.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j });
                    const itemQty = itemFulfillment.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: j });
                    const itemFields = search.lookupFields({ type: search.Type.ASSEMBLY_ITEM, id: itemId, columns: ['custitem_noninventory_model'] });
                    const modelVals = itemFields.custitem_noninventory_model;
                    log.debug('Model values', JSON.stringify(modelVals));
                    log.debug('Line Number & Item Type', `line = ${j} + itemType = ${itemType}`);
                    let itemDimension, itemWeight, itemLength, itemHeight, itemWidth;
                    if (itemType === 'Kit' || (itemType === 'Assembly' && modelVals.length > 0 && modelVals[0].value)) { // [GOBASD-19]
                        // Loop for kit/assembly item to add packages per each associated items
                        const itemRecordType = itemType == 'Kit' ? 'kititem' : 'assemblyitem';
                        const itemRec = record.load({ type: itemRecordType, id: itemId });
                        const totalCompItem = itemRec.getLineCount({ sublistId: 'member' });
                        let compItemId;
                        let compItemQty;
                        for (let k = 0; k < totalCompItem; k++) {
                            compItemId = itemRec.getSublistValue({ sublistId: 'member', fieldId: 'item', line: k });
                            itemDimension = JSON.parse(getItemDim('item', compItemId));
                            log.debug('Item Specifics', `itemId = ${compItemId} + itemDimension = ${JSON.stringify(itemDimension)}`);
                            itemWeight = itemDimension.weight;
                            itemLength = itemDimension.length;
                            itemHeight = itemDimension.height;
                            itemWidth = itemDimension.width;
                            if (itemWeight) {
                                compItemQty = itemRec.getSublistValue({ sublistId: 'member', fieldId: 'quantity', line: k });
                                // For each Kit/Assembly Item quantity
                                for (let l = 0; l < itemQty; l++) {
                                    // For each Kit/Assembly Component quantity
                                    for (let m = 0; m < compItemQty; m++) {
                                        addPackage(itemFulfillment, itemWeight, itemLength, itemHeight, itemWidth, fedExRef);
                                    }
                                }
                            }
                        }
                    }
                    else { // Not a kit or assembly with model
                        itemDimension = JSON.parse(getItemDim('item', itemId));
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
                log.debug('Total Items After Insert', 'totalPackItem_AfterInsert = ' + itemFulfillment.getLineCount({ sublistId: 'packagefedex' }));
            }
        }
        catch (e) {
            log.error('Failed To Add Package', `Error encountered while processing Adding Package: ${e.message} `);
        }
    }
    function getItemDim(type, id) {
        try {
            const itemDimensions = search.lookupFields({ type, id, columns: ['weight', 'custitem_length', 'custitem_height', 'custitem_width'] });
            const searchResult = { weight: itemDimensions.weight, length: itemDimensions.custitem_length, height: itemDimensions.custitem_height, width: itemDimensions.custitem_width };
            return JSON.stringify(searchResult);
        }
        catch (e) {
            log.error('getItemDim', `Error encountered while processing Item Demensions: ${e.message}`);
        }
    }
    exports.getItemDim = getItemDim;
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
