/**
 * processCustomColorOrdersMR.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Process Custom Color Orders
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/error", "N/log", "N/search", "N/record", "N/runtime", "./customColorUtils", "./zones/freightAndInstallZoneUtils"], function (err, log, search, record, runtime, customColorUtils_1, freightAndInstallZoneUtils_1) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getBoxConfigBySku = exports.summarize = exports.reduce = exports.map = exports.getInputData = void 0;
    exports.getInputData = ctx => {
        const searchResults = mapResults('customsearch_custom_color_orders'); // [SCRIPT] Search Custom Color Orders: map search results into objects
        log.audit('getInputData', `Results: ${searchResults.length}.`);
        return searchResults;
    };
    exports.map = ctx => {
        try {
            const orderLine = JSON.parse(ctx.value);
            const orderDetails = orderLine.foreignId > 0 ? customColorUtils_1.fetchOrderFromITHands(orderLine.foreignId, orderLine.subsidiary) : null;
            if (orderDetails)
                log.debug(`map ${ctx.key}`, `orderDetails response from IT Hands: ${JSON.stringify(orderDetails)}.`);
            ctx.write(orderLine.id.toString(), JSON.stringify({ orderLine, orderDetails }));
        }
        catch (e) {
            log.error(`map ${ctx.value}`, e);
        }
    };
    exports.reduce = ctx => {
        var _a;
        try {
            const valueObjs = ctx.values.map(v => JSON.parse(v));
            const orderLineMaps = getOrderLineMap(valueObjs);
            log.debug(`reduce ${ctx.key}`, `build order lines to map for: ${JSON.stringify(orderLineMaps)}.`);
            log.debug(`reduce ${ctx.key}`, `valueObjs: ${JSON.stringify(valueObjs)}.`);
            if (Object.keys(orderLineMaps).length == 0)
                return; // IT Hands order is moved to lines on group item
            for (const product in orderLineMaps) {
                const orderLineMap = orderLineMaps[product];
                const orderDetails = orderLineMap.orderDetails && orderLineMap.orderDetails.order[0] || orderLineMap.lines[0].orderDetails.order[0];
                const kitItemSku = (_a = orderDetails.tramplineSKU.replace('C', '')) !== null && _a !== void 0 ? _a : ''; // the sku without the C is the non-custom sku and how the assembly items are named.
                const partsVariations = valueObjs[0].orderLine.partsCombos[kitItemSku];
                if (!partsVariations) {
                    log.error(`reduce ${ctx.key}`, `sku ${kitItemSku} isn't defined in the parts variation map - couldn't build item`);
                    return;
                }
                /** get the configuration of boxes based on the sku */
                const boxConfig = getBoxConfigBySku(kitItemSku);
                /** get the part configuration of boxes based on the box cofig and allowed parts variations */
                let partsConfig = convertBoxConfigToPartsConfig(boxConfig, partsVariations);
                /** get a color map to help determine how colors can be divided between boxes */
                const colorMap = buildColorMap(kitItemSku, orderDetails.parts, partsConfig, partsVariations);
                /** build queries to run against items to find ones that have the part skus we need */
                const queries = buildQueriesForItems(kitItemSku, orderDetails.parts, partsConfig, partsVariations, colorMap);
                /** map the found items onto the parts config object */
                partsConfig = mapFoundItemsIntoPartConfig(partsConfig, queries, kitItemSku, orderDetails);
                log.debug(`reduce ${ctx.key}`, `${kitItemSku} parts config: ${JSON.stringify(partsConfig)}.`);
                const finalParts = {};
                const partsToProcess = {};
                const toBoxes = convertPartConfigsToBoxes(partsConfig, boxConfig, kitItemSku);
                /** map the found objects into a final parts map that can be processed */
                for (const boxNum in toBoxes) {
                    const partsByBox = toBoxes[boxNum];
                    const productMap = {}; // productMap is all the internalids of assbembly items and the matching skus in them
                    for (const partKey in partsByBox) {
                        const parts = partsByBox[partKey];
                        for (const part of parts) {
                            if (!productMap[part.id])
                                productMap[part.id] = [];
                            if (!productMap[part.id].includes(part.memberName))
                                productMap[part.id].push(part.memberName);
                        }
                    }
                    log.debug(`reduce ${ctx.key}`, `productMap final for box num ${boxNum}: ${JSON.stringify(productMap)}.`);
                    const box = boxConfig[boxNum];
                    const numMatches = box.filter(b => b.partSpecificText.length > 0).length;
                    const matches = [];
                    for (const partId in productMap) {
                        if (productMap[partId].length == numMatches)
                            matches.push(partId);
                    }
                    log.debug(`reduce ${ctx.key}`, `matches final for box ${boxNum} which requires ${numMatches}: ${JSON.stringify(matches)}.`);
                    if (matches.length == 1) {
                        finalParts[boxNum] = matches[0];
                    }
                    else {
                        partsToProcess[boxNum] = matches;
                    }
                }
                log.debug(`reduce ${ctx.key}`, `Parts To Process: ${JSON.stringify(partsToProcess)}.`);
                log.debug(`reduce ${ctx.key}`, `Final parts map: ${JSON.stringify(finalParts)}.`);
                const groupItemMap = orderLineMap.lines[0].orderLine.groupItemMap;
                const itemGroup = groupItemMap[kitItemSku];
                log.debug(`reduce ${ctx.key}`, `itemGroup: ${JSON.stringify(itemGroup)}.`);
                log.audit(`reduce ${ctx.key}`, `Usage: ${runtime.getCurrentScript().getRemainingUsage()}.`);
                const orderUpdated = addPartsToSalesOrder(finalParts, orderLineMap, partsConfig, itemGroup, orderDetails, boxConfig, colorMap);
                if (!orderUpdated)
                    log.error(`reduce ${ctx.key}`, `error updating parts onto order, check config and try again.`);
            }
        }
        catch (e) {
            log.error(`reduce ${ctx.key}`, e);
        }
    };
    function summarize(context) {
        log.audit('summarize', 'Execution Complete');
    }
    exports.summarize = summarize;
    function mapFoundItemsIntoPartConfig(partsConfig, queries, kitItemSku, orderDetails) {
        for (const partKey in queries) {
            log.debug('mapFoundItemsIntoPartConfig', `query for ${kitItemSku} query ${partKey}: ${JSON.stringify(queries[partKey])}`);
            const boxConfig = partsConfig[partKey];
            const partJSONKey = boxConfig.itHandsPartText;
            const partMatches = findParts(kitItemSku, queries[partKey]);
            const partJSON = orderDetails.parts[partJSONKey];
            /*log.debug(`checking parts for ${kitItemSku} for ${partKey} boxConfig`, `${JSON.stringify(boxConfig)}`)
             log.debug(`checking parts for ${kitItemSku} for ${partKey} partJSON`, `${JSON.stringify(partJSON)} `)
             log.debug(`checking parts for ${kitItemSku} for ${partKey} partMatches`, ` ${JSON.stringify(partMatches)}`)*/
            partMatches.forEach((partMatch, index, arr) => {
                partJSON.forEach((part, index, arr) => {
                    //log.debug(`checking matches for ${partKey}`, `${partMatch.memberName} == ${part.sku} ${partMatch.quantity} == ${boxConfig.numberPartsPerBox}`)
                    if (partMatch.memberName == part.sku && partMatch.quantity == boxConfig.numberPartsPerBox) {
                        partsConfig[partKey].foundParts.push(partMatch);
                        if (!partsConfig[partKey].skus.includes(partMatch.memberName))
                            partsConfig[partKey].skus.push(partMatch.memberName);
                    }
                });
            });
        }
        return partsConfig;
    }
    function convertPartConfigsToBoxes(partsConfig, boxConfig, kitItemSku) {
        const toBoxes = {};
        for (const boxNum in boxConfig) {
            const box = boxConfig[boxNum];
            for (const partConfig of box) {
                if (partConfig.partSpecificText.length > 0) {
                    const part = partsConfig[partConfig.partText];
                    toBoxes[boxNum] = toBoxes[boxNum] || {};
                    toBoxes[boxNum][partConfig.partText] = toBoxes[boxNum][partConfig.partText] || [];
                    const partsCount = part.foundParts.filter(p => p.box == boxNum);
                    //log.debug(`${kitItemSku} part config box: ${boxNum} ${partConfig.partText} partsCount:`, partsCount);
                    toBoxes[boxNum][partConfig.partText] = toBoxes[boxNum][partConfig.partText].concat(partsCount);
                }
            }
            //log.debug(`found matches for ${kitItemSku}`, toBoxes);
        }
        log.debug('convertPartConfigsToBoxes', `kitItemSku ${kitItemSku} toBoxes: ${JSON.stringify(toBoxes)}.`);
        return toBoxes;
    }
    function getOrderLineDetail(itemId, orderLineMap) {
        for (const line of orderLineMap.lines) {
            if (line.orderLine.item == Number(itemId))
                return line.orderLine;
        }
        return null;
    }
    function addPartsToSalesOrder(finalParts, orderLineMap, partsConfig, itemGroup, orderDetails, boxesConfig, colorMap) {
        let saveNewOrder = true;
        let errorForSave = '';
        const salesOrderID = orderLineMap.lines[0].orderLine.id;
        log.audit('addPartsToSalesOrder', `Loading sales order ${salesOrderID} at ${new Date()}.`);
        const salesOrder = record.load({ type: record.Type.SALES_ORDER, id: salesOrderID, isDynamic: true }); // load the order
        const subsidiary = salesOrder.getValue('subsidiary');
        let location = customColorUtils_1.getLocationFromSubsidiary(subsidiary);
        let colouredTrampoline = false;
        let freightZones, addressData, itemClass;
        let isAU = subsidiary == '1'; 
		let isUS = subsidiary == '3';
		let isCA = subsidiary == '4';
        if (isAU || isUS || isCA) {
            const entity = salesOrder.getValue({ fieldId: 'entity' });
            addressData = freightAndInstallZoneUtils_1.getDefaultAddressOnSO(salesOrder, entity);
            freightZones = freightAndInstallZoneUtils_1.searchFreightZone(addressData.postalcode, addressData.stateProvince, addressData.country);
        }
        let groupItemLine = salesOrder.findSublistLineWithValue({ sublistId: 'item', fieldId: 'item', value: orderLineMap.groupItem });
        log.debug('addPartsToSalesOrder', `SO ${salesOrderID} group item: ${orderLineMap.groupItem} found on line ${groupItemLine} and location ${location} for subsidiary ${subsidiary}, isAU: ${isAU}, isUS: ${isUS}, isCA: ${isCA}, freight zones: ${freightZones}`);
        if (groupItemLine < 0)
            return false;
        let line = groupItemLine;
        const total = Number(salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'amount', line }));
        const taxcode = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: line + 1 }); // tax code isn't on the first line
        const itHandsOrderID = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ctid', line });
        const customizationURL = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_image_url', line });
        const customizationURL3D = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_3d_url', line });
        const groupItemCode = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcolitem_code', line });
        const description = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'description', line });
        let classId = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'class', line });
        //let unicornOrder         = Object.keys(finalParts).length == 0; // no final parts map is there
        /** Remove the item group line and replace it with the new one. */
        salesOrder.removeLine({ sublistId: 'item', line: groupItemLine });
        salesOrder.insertLine({ sublistId: 'item', line: groupItemLine });
        /** if class id is empty, then we have to look it up on the item */
        if (!classId) {
            const itemValues = search.lookupFields({ type: search.Type.ITEM, id: orderLineMap.groupItem, columns: ['class', 'type', 'custitem_colour_trampoline'] }); // [GOBASD-16]
            log.debug('setDefaultWarehouses', `Looked up item ${orderLineMap.groupItem} values: ${JSON.stringify(itemValues)}`);
            colouredTrampoline = itemValues.custitem_colour_trampoline;
            itemClass = itemValues.class;
            if (itemClass && itemClass.length > 0)
                classId = itemClass[0].value;
            else
                log.error(`there is no item class for item id ${orderLineMap.groupItem}`, itemValues);
        }
        let zoneId = '';
        /** if it's AU then we need to look up the default location per line */
        if (isAU || isUS || isCA) {
            if (freightZones.length > 0) {
                zoneId = freightZones[0].zoneid;
                const warehouses = freightAndInstallZoneUtils_1.getDefaultWarehouse('colored trampoline', subsidiary, freightZones[0].zoneid, addressData.stateProvince, addressData.country, classId, '2' /*delivery*/, colouredTrampoline);
                if (warehouses.length == 1)
                    location = Number(warehouses[0].warehouse);
                else
                    throw err.create({ name: 'NO_WAREHOUSE_FOUND', message: `Default warehouse couldnt be determined for item class ${classId} in zone ${freightZones[0].zoneid}, state ${addressData.stateProvince} country ${addressData.country}` });
            }
            else {
                throw err.create({ name: 'NO_FREIGHT_ZONES_FOUND', message: `Freight zone couldn't be found for item class ${classId}, state ${addressData.stateProvince} country ${addressData.country}` });
            }
        }
        setLineItemValues(salesOrder, String(itemGroup), 1, taxcode, location, itHandsOrderID, customizationURL, customizationURL3D, zoneId, addressData, subsidiary);
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'groupsetup', value: true, ignoreFieldChange: true }); // Specify this is a group item
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemtype', value: 'Group', ignoreFieldChange: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: orderLineMap.groupItemClass });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcolitem_code', value: groupItemCode });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: description });
        salesOrder.commitLine({ sublistId: 'item' });
        groupItemLine++;
        /** Add the new lines */
        if (Object.keys(finalParts).length == 3) { // all three boxes found
            log.debug('addPartsToSalesOrder', `SO ${salesOrderID} final parts map is an exact match - swap out all items.`);
            for (const boxNum in finalParts) {
                const partNumber = finalParts[boxNum];
                const orderLine = getOrderLineDetail(partNumber, orderLineMap);
                log.debug('addPartsToSalesOrder', `SO ${salesOrderID}, inserting line for partNumber ${partNumber} to line ${groupItemLine}, class ${classId}.`);
                salesOrder.insertLine({ sublistId: 'item', line: groupItemLine });
                setLineItemValues(salesOrder, partNumber, 1, taxcode, location, itHandsOrderID, customizationURL, customizationURL3D, zoneId, addressData, subsidiary);
                salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'ingroup', value: true, ignoreFieldChange: true }); // Specify this is a group item
                salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: '16', ignoreFieldChange: false, fireSlavingSync: true }); // 16 is Custom Colour
                salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: classId });
                if (orderLine)
                    salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: orderLine.description });
                if (orderLine)
                    salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcolitem_code', value: orderLine.description });
                if (orderLine)
                    salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'units', value: orderLine.unitId });
                salesOrder.commitLine({ sublistId: 'item' });
                groupItemLine++;
            }
        }
        else {
            //log.debug('addPartsToSalesOrder', `SO ${salesOrderID} not all parts were found: ${JSON.stringify(finalParts)}`);
            const boxes = ['1', '2', '3'];
            const partsToAdd = {};
            for (const boxNum of boxes) {
                if (finalParts[boxNum]) {
                    const partNumber = finalParts[boxNum];
                    //log.debug('addPartsToSalesOrder', `SO ${salesOrderID} item found for box #${boxNum}, adding ${partNumber} to order`);
                    addLineToSalesOrder(salesOrder, { groupItemLine, item: Number(partNumber), quantity: 1, ingroup: true, taxcode, location, itHandsOrderID, customizationURL, customizationURL3D, zoneId, addressData, subsidiary });
                    groupItemLine++;
                }
                else {
                    let addedBox1 = false;
                    const boxConfig = boxesConfig[boxNum];
                    const partCounts = {};
                    boxConfig.forEach((box) => {
                        partCounts[box.partSpecificText] = partCounts[box.partSpecificText] || [];
                        partCounts[box.partSpecificText].push(box);
                    });
                    log.debug(`testing grouped parts`, partCounts);
                    for (const partKey in partsConfig) {
                        const partConfig = partsConfig[partKey];
                        //log.debug('addPartsToSalesOrder', `SO ${salesOrderID} partKey ${partKey} partConfig: ${JSON.stringify(partConfig)}.`);
                        if (partConfig.boxes.includes(boxNum)) { // if the part is in the current box we're looking at
                            if (partConfig.itHandsPartText) {
                                if ((!addedBox1 && boxNum == '1') || boxNum != '1') { // there are two configs for legs in box one, and we only want to run it once
                                    if (boxNum == '1')
                                        addedBox1 = true;
                                    const partsArray = orderDetails.parts[partConfig.itHandsPartText]; // get the ithands config
                                    for (const part of partsArray) {
                                        const colors = boxNum != '1' ? colorMap[boxNum][partConfig.partKeySpecific] : [];
                                        const partsKeyMatches = partCounts[partConfig.partKey];
                                        const partsKeyCount = partsKeyMatches ? partsKeyMatches.length : 1;
                                        log.debug(`numberPartsMatch ${partConfig.partKey} ${partConfig.partKeySpecific} `, partsKeyCount);
                                        const itemId = getItemIDFromSku(part.sku);
                                        let numberToAdd = boxNum == '1' ? Number(part.quality) : (Number(partConfig.numberPartsPerBox) / colors.length) / partsKeyCount;
                                        log.debug('addPartsToSalesOrder', `SO ${salesOrderID}, checking parts for part ${partConfig.itHandsPartText} in box #${boxNum}, quality: ${part.quality}, quantity: ${partConfig.numberPartsPerBox}, colors: ${colors}; adding ${numberToAdd} to order. ${partConfig.partKey} ${partConfig.partKeySpecific} number of matching parts ${partsKeyCount}`);
                                        if (!partsToAdd[itemId])
                                            partsToAdd[itemId] = numberToAdd;
                                        else
                                            partsToAdd[itemId] += numberToAdd;
                                    }
                                }
                            }
                        }
                    }
                    log.debug('addPartsToSalesOrder', `unicorn parts map: ${JSON.stringify(partsToAdd)}.`);
                    for (const box of boxConfig) {
                        if (box.defaultSku > 0) {
                            log.debug(`addPartsToSalesOrder`, `Adding ${JSON.stringify(box)} to order, part ${box.partSpecific} in box #${boxNum}, quantity: ${box.quantity}.`);
                            addLineToSalesOrder(salesOrder, { groupItemLine, item: box.defaultSku, quantity: box.quantity, ingroup: true, taxcode, location, itHandsOrderID, customizationURL, customizationURL3D, zoneId, addressData, subsidiary });
                            groupItemLine++;
                        }
                    }
                }
            }
            for (const itemId in partsToAdd) {
                try {
                    const defaults = { groupItemLine, item: Number(itemId), quantity: Number(partsToAdd[itemId]), ingroup: true, taxcode, location, itHandsOrderID, customizationURL, customizationURL3D, zoneId, addressData, subsidiary };
                    addLineToSalesOrder(salesOrder, defaults);
                    groupItemLine++;
                }
                catch (e) {
                    saveNewOrder = false;
                    errorForSave += `Sku ${itemId} wasn't added so the order wasn't saved.`;
                    log.error('addPartsToSalesOrder', `error adding line: ${e.message}`);
                }
            }
        }
        /** add end group */
        salesOrder.insertLine({ sublistId: 'item', line: groupItemLine });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: 0, ignoreFieldChange: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemtype', value: 'EndGroup', ignoreFieldChange: true }); // Specify this is a group item
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: taxcode, ignoreFieldChange: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: total, ignoreFieldChange: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: classId });
        salesOrder.commitLine({ sublistId: 'item' });
        /** add nametag item */
        if (orderDetails.nametag && orderDetails.nametag.textLine1.length > 0)
            addNameTagToOrder(orderDetails, salesOrder, taxcode);
        /** add item SP0036 in qty 2 for S155 and O92 [Disabled May2 RB] */
        // const boxConfig = boxesConfig['3'];
        // if(!boxConfig && ['S155', 'O92'].includes(boxConfig[0].skuPrefix)) {
        //   salesOrder.insertLine({ sublistId: 'item', line: groupItemLine });
        //   salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: 1717 });
        //   salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 2 });
        //   salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: taxcode });
        //   salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: total });
        //   salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: classId });
        //   salesOrder.commitLine({ sublistId: 'item' });
        // }
        salesOrder.setValue({ fieldId: 'custbody_process_color_trampolines', value: false });
        salesOrder.setValue({ fieldId: 'custbody_goba_check_colortramp_invt', value: true }); // set flag to check inventory on assembly items
        if (saveNewOrder) {
            //TODO: run default warehouse logic?
            try {
                log.debug('addPartsToSalesOrder', `Saving sales order ${salesOrder.id} at ${new Date()}.`);
                salesOrder.save({ enableSourcing: true, ignoreMandatoryFields: true });
                log.audit('addPartsToSalesOrder', `Sales order ${salesOrder.id} updated at ${new Date()}.`);
                return true;
            }
            catch (e) {
                log.error('addPartsToSalesOrder', e);
                return false;
            }
        }
        else {
            log.error('addPartsToSalesOrder', `order conversion not performed: ${errorForSave}`);
        }
    }
    function setLineItemValues(salesOrder, itemId, quantity, taxcode, location, itHandsOrderID, customizationURL, customizationURL3D, zoneId, addressData, subsidiary) {
        /** look up values on item in order to get correct class */
        const itemValues = search.lookupFields({ type: search.Type.ITEM, id: itemId, columns: ['class', 'type', 'custitem_colour_trampoline'] }); // [GOBASD-16]
        log.debug('setDefaultWarehouses', `Looked up item ${itemId} values: ${JSON.stringify(itemValues)}`);
        const colouredTrampoline = itemValues.custitem_colour_trampoline;
        const itemClass = itemValues.class;
        const classId = itemClass[0].value;
        if (subsidiary == '1' || subsidiary == '3' || subsidiary == '4') { // have to look up class and location for AU [26052023 RB Add US][22082023 BP Add CA]
            const warehouses = freightAndInstallZoneUtils_1.getDefaultWarehouse('colored trampoline', subsidiary, zoneId, addressData.stateProvince, addressData.country, classId, '2' /*delivery*/, colouredTrampoline);
            if (warehouses.length == 1)
                location = Number(warehouses[0].warehouse);
            else
                throw err.create({ name: 'NO_WAREHOUSE_FOUND', message: `Default bwarehouse couldnt be determined for item class ${classId} in zone ${zoneId}, state ${addressData.stateProvince} country ${addressData.country}` });
        }
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemId, ignoreFieldChange: false, forceSyncSourcing: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1, ignoreFieldChange: false });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: taxcode, ignoreFieldChange: false });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: location, ignoreFieldChange: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ctid', value: itHandsOrderID, ignoreFieldChange: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_image_url', value: customizationURL, ignoreFieldChange: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_3d_url', value: customizationURL3D, ignoreFieldChange: true });
    }
    function addLineToSalesOrder(salesOrder, defaults) {
        let location = defaults.location;
        const itemValues = search.lookupFields({ type: search.Type.ITEM, id: defaults.item, columns: ['class', 'type', 'custitem_colour_trampoline'] }); // [GOBASD-16]
        log.debug('setDefaultWarehouses', `Looked up item ${defaults.item} values: ${JSON.stringify(itemValues)}`);
        const colouredTrampoline = itemValues.custitem_colour_trampoline;
        const itemClass = itemValues.class;
        const classId = itemClass[0].value;
        if (defaults.subsidiary == '1') { // have to look up class and location for AU [26052023 RB Add US]
            const warehouses = freightAndInstallZoneUtils_1.getDefaultWarehouse('colored trampoline', defaults.subsidiary, defaults.zoneId, defaults.addressData.stateProvince, defaults.addressData.country, classId, '2' /*delivery*/, colouredTrampoline);
            if (warehouses.length == 1)
                location = Number(warehouses[0].warehouse);
            else
                throw err.create({ name: 'NO_WAREHOUSE_FOUND', message: `Default warehouse couldnt be determined for item class ${classId} in zone ${defaults.zoneId}, state ${defaults.addressData.stateProvince} country ${defaults.addressData.country}` });
        }
        salesOrder.insertLine({ sublistId: 'item', line: defaults.groupItemLine });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: defaults.item, ignoreFieldChange: false, forceSyncSourcing: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'ingroup', value: defaults.ingroup, ignoreFieldChange: true }); // Specify this is a group item
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: defaults.quantity, ignoreFieldChange: false });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: '16', ignoreFieldChange: false, fireSlavingSync: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: defaults.taxcode, ignoreFieldChange: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: location, ignoreFieldChange: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ctid', value: defaults.itHandsOrderID, ignoreFieldChange: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_image_url', value: defaults.customizationURL, ignoreFieldChange: true });
        salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_3d_url', value: defaults.customizationURL3D, ignoreFieldChange: true });
        salesOrder.commitLine({ sublistId: 'item' });
    }
    function addNameTagToOrder(orderDetails, salesOrder, taxCode) {
        try {
            const nameTagRecord = addNameTagItem(salesOrder, orderDetails.nametag);
            salesOrder.selectNewLine({ sublistId: 'item' });
            salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: '106362', ignoreFieldChange: true }); // name tag item
            salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1, ignoreFieldChange: true });
            salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: taxCode, ignoreFieldChange: true });
            salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: '-1', ignoreFieldChange: true });
            salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: 0, ignoreFieldChange: true });
            salesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_nametag_field', value: nameTagRecord });
            salesOrder.commitLine({ sublistId: 'item' });
        }
        catch (e) {
            log.error(`couldn't add the name tag record`, e);
        }
    }
    function addNameTagItem(salesOrder, nametag) {
        if (nametag.textLine1.length > 0) {
            const nametagRec = record.create({ type: 'customrecord789' });
            nametagRec.setValue('name', `${nametag.design} ${nametag.font} ${nametag.textLine1}`);
            nametagRec.setValue('custrecord_nametag_so_no', salesOrder.id);
            nametagRec.setValue('custrecord_nametag_so_date', salesOrder.getValue('trandate'));
            nametagRec.setValue('custrecord_nametag_customer_name', salesOrder.getValue('entity'));
            nametagRec.setText('custrecord_nametag_font', nametag.font);
            nametagRec.setText('custrecord_nametag_colour', nametag.design);
            nametagRec.setValue('custrecord_nametag_text', nametag.textLine1);
            nametagRec.setValue('custrecord_nametag_text_2', nametag.textLine2);
            return nametagRec.save();
        }
        return 0;
    }
    function getOrderLineMap(orderLineObjs) {
        const productMap = {};
        let prodIndex = 0;
        orderLineObjs.sort(function (a, b) {
            return a.orderLine.lineId - b.orderLine.lineId;
        });
        orderLineObjs.forEach((line, idx) => {
            log.debug('getOrderLineMap', `Adding line ${JSON.stringify(line)}.`);
            const thisLine = {
                lines: [],
                groupItem: line.orderLine.item,
                groupItemLineId: line.orderLine.lineId,
                groupItemClass: line.orderLine.classId,
                orderDetails: line.orderDetails
            };
            if (line.orderLine.itemType == 'Group') {
                productMap[`trampoline_${prodIndex}`] = thisLine;
            }
            if (line.orderLine.foreignId < 1 || line.orderLine.itemType == 'Assembly') {
                productMap[`trampoline_${prodIndex}`] = productMap[`trampoline_${prodIndex}`] || thisLine;
                productMap[`trampoline_${prodIndex}`].lines.push(line);
            }
            else if (line.orderLine.itemType == 'EndGroup')
                prodIndex++;
        });
        log.debug('getOrderLineMap', `mapping order lines to order details: ${JSON.stringify(productMap)}`);
        return productMap;
    }
    function getPartConfigsByITHandsKey(part, partsConfig) {
        const matchingPartsConfigs = [];
        for (let partConfig in partsConfig) {
            if (partsConfig[partConfig].itHandsPartText == part)
                matchingPartsConfigs.push(partsConfig[partConfig]);
        }
        return matchingPartsConfigs;
    }
    function buildQueriesForItems(kitItemSku, itHandsPartsJSON, partsConfig, partsVariations, colorsMap) {
        log.debug(`buildQueriesForItems`, `kitItemSku ${kitItemSku}; partsConfig: ${JSON.stringify(partsConfig)}`);
        const queryMap = {};
        for (const part in itHandsPartsJSON) {
            // for each part config in the IT Hands Payload, there can be multiples, so we need to divide
            const partsArray = itHandsPartsJSON[part];
            const matchingConfigs = getPartConfigsByITHandsKey(part, partsConfig);
            log.debug('buildQueriesForItems', `found matching part configs for ithands part key ${part}: ${JSON.stringify(matchingConfigs)}.`);
            for (let config of matchingConfigs) {
                const variations = partsVariations.parts[customColorUtils_1.jsonToPartList[part]];
                const maxVariations = Math.max(...variations); // get the max number of variations we will search for
                const partColors = getPartColors(partsVariations, part, partsArray, kitItemSku); // TODO if colors can be split between boxes we need to pick a box per query...
                if (partColors.length <= maxVariations) {
                    if (config.boxes.length == 1) {
                        queryMap[config.partKeySpecific] = buildPartQuerySingleBox(config, kitItemSku, partsArray);
                    }
                    else {
                        queryMap[config.partKeySpecific] = buildPartQueryMultipleBoxes(config, kitItemSku, partsArray, colorsMap);
                    }
                }
                else {
                    log.error(`${kitItemSku}: ${partColors.length} colors were in the array for ${part}`, `${maxVariations} are allowed so this combination cannot be built from exisitng items. ${JSON.stringify(partColors)}`);
                }
            }
        }
        //log.debug(`query map is built for ${kitItemSku}`, queryMap)
        return queryMap;
    }
    function buildColorMap(kitItemSku, itHandsPartsJSON, partsConfig, partsVariations) {
        const colorsPerBox = {};
        for (const part in itHandsPartsJSON) {
            const partsArray = itHandsPartsJSON[part];
            const matchingConfigs = getPartConfigsByITHandsKey(part, partsConfig);
            for (const config of matchingConfigs) {
                const partColors = getPartColors(partsVariations, part, partsArray, kitItemSku);
                if (partColors.length > 0) {
                    config.boxes.forEach(box => {
                        colorsPerBox[box] = colorsPerBox[box] || {};
                        colorsPerBox[box][config.partKeySpecific] = partColors;
                    });
                }
            }
        }
        log.debug('buildColorMap', colorsPerBox);
        return colorsPerBox;
    }
    function getPartColors(partsVariations, part, partsArray, kitItemSku) {
        const partColors = [];
        //log.debug(`searching for variations for key ${part}`, `max variations for this part: ${maxVariations}, ${JSON.stringify(partsArray)}`);
        for (let partJSON of partsArray) { // get the colors for the part
            const partArr = partJSON.sku.split('-');
            if (!partColors.includes(partArr[1]))
                partColors.push(partArr[1]);
        }
        return partColors;
    }
    function buildPartQuerySingleBox(partConfig, kitItemSku, partsArray) {
        const filterExpression = [];
        for (const box of partConfig.boxes) {
            filterExpression.push(['name', 'startswith', `${kitItemSku} Box #${box}`]);
            filterExpression.push('AND');
            const skuArr = [];
            let skuIdx = 0;
            for (let partJSON of partsArray) {
                skuArr.push(['memberitem.itemid', 'is', partJSON.sku]);
                if (skuIdx < partsArray.length - 1)
                    skuArr.push('OR');
                skuIdx++;
            }
            filterExpression.push(skuArr);
        }
        return filterExpression;
    }
    function buildPartQueryMultipleBoxes(partConfig, kitItemSku, partsArray, partColorsMap) {
        const filterExpression = [];
        let boxIdx = 0;
        const colorsMap = [];
        for (const box of partConfig.boxes) {
            //log.debug(`box ${box} `, partColorsMap);
            const colors = partColorsMap[box][partConfig.partKeySpecific];
            colors.forEach(color => {
                if (!colorsMap.includes(color))
                    colorsMap.push(color);
            });
        }
        if (colorsMap.length > 1) { // colors length should match boxes length
            for (let idx = 0; idx < colorsMap.length; idx++) {
                const partsArrFiltered = partsArray.filter(part => part.sku.includes(colorsMap[idx]));
                const box = partConfig.boxes[idx];
                log.debug(`checking for box ${idx} for color ${colorsMap[idx]}`, `found box ${box}, ${JSON.stringify(partsArrFiltered)}`);
                let filterArr = buildPartsConfigIntoQuery(kitItemSku, box, partsArrFiltered);
                filterExpression.push(filterArr);
                if (boxIdx < partConfig.boxes.length - 1)
                    filterExpression.push('OR');
                boxIdx++;
            }
        }
        else {
            for (const box of partConfig.boxes) {
                let filterArr = buildPartsConfigIntoQuery(kitItemSku, box, partsArray);
                filterExpression.push(filterArr);
                if (boxIdx < partConfig.boxes.length - 1)
                    filterExpression.push('OR');
                boxIdx++;
            }
        }
        //log.debug('checking color split filters: ', filterExpression);
        return filterExpression;
    }
    function buildPartsConfigIntoQuery(kitItemSku, box, partsArray) {
        const filterArr = [];
        const skuArr = [];
        let skuIdx = 0;
        filterArr.push(['name', 'startswith', `${kitItemSku} Box #${box}`]);
        filterArr.push('AND');
        for (let partJSON of partsArray) {
            skuArr.push(['memberitem.itemid', 'is', partJSON.sku]);
            if (skuIdx < partsArray.length - 1)
                skuArr.push('OR');
            skuIdx++;
        }
        filterArr.push(skuArr);
        return filterArr;
    }
    /** IT HAnds Payload...
     "parts":{
     "legs":[{"sku":"SP0030-BLUE","quality":4},{"sku":"SP0029-BLUE","quality":2}],
     "frame":[{"sku":"SP0026-BLUE","quality":2},{"sku":"SP0024-BLUE","quality":4}],
     "mat_rods":[{"sku":"SP0037-PINK","quality":52}],
     "enclosure_rods":[{"sku":"SP0041-GREEN","quality":10}]}
     * */
    const partsConfigFields = {
        'skuPrefix': 'custrecord_goba_color_boxes',
        'partSpecific': 'custrecord_goba_color_boxes_part_key',
        'part': 'custrecord_goba_color_boxes_part',
        'boxNumber': 'custrecord_goba_color_boxes_box',
        'quantity': 'custrecord_goba_color_boxes_part_qty',
        'defaultSku': 'custrecord_goba_color_boxes_default_sku'
    };
    function convertBoxConfigToPartsConfig(boxConfigs, partsVariations) {
        const partsConfig = {};
        for (const box in boxConfigs) {
            for (const boxConfig of boxConfigs[box]) {
                log.debug('convertBoxConfigToPartsConfig', `Processing boxConfig: ${JSON.stringify(boxConfig)}.`);
                if (boxConfig.partSpecificText.length > 0) { // only map if there is a part key
                    const key = boxConfig.partText;
                    //const keyBox = boxConfig.partKey;
                    if (!partsConfig[key]) {
                        const variations = partsVariations.parts[boxConfig.partSpecific];
                        const maxVariations = Math.max(...variations);
                        const partsPerBox = {};
                        partsPerBox[box] = boxConfig.quantity;
                        partsConfig[key] = {
                            boxes: [box],
                            numberPartsTotal: Number(boxConfig.quantity),
                            numberVariations: maxVariations,
                            numberPartsPerBox: 0,
                            numberBoxes: 0,
                            foundParts: [],
                            skus: [],
                            partKey: boxConfig.partSpecificText,
                            partKeySpecific: boxConfig.partText,
                            itHandsPartText: boxConfig.itHandsPartText
                        };
                        partsConfig[key].numberPartsPerBox[box] = Number(boxConfig.quantity);
                    }
                    else {
                        !partsConfig[key].boxes.includes(box) ? partsConfig[key].boxes.push(box) : null;
                        partsConfig[key].numberPartsTotal += Number(boxConfig.quantity);
                    }
                    partsConfig[key].numberBoxes = partsConfig[key].boxes.length;
                    partsConfig[key].numberPartsPerBox = Math.floor(partsConfig[key].numberPartsTotal / partsConfig[key].boxes.length);
                }
            }
        }
        log.debug('convertBoxConfigToPartsConfig', `partsConfig: ${JSON.stringify(partsConfig)}.`);
        return partsConfig;
    }
    function getBoxConfigBySku(skuPrefix) {
        const searchObj = search.load({ id: 'customsearch_goba_color_box_configs' }); //[SCRIPT] Box Configurations
        const filterExpression = searchObj.filterExpression;
        if (filterExpression.length > 0)
            filterExpression.push('AND');
        filterExpression.push(['custrecord_goba_color_boxes', 'startswith', skuPrefix]);
        searchObj.filterExpression = filterExpression;
        const boxesConfig = {};
        searchObj.run().each(function (result) {
            const boxConfig = {};
            const boxNumber = result.getValue(partsConfigFields.boxNumber);
            for (let prop in partsConfigFields) {
                boxConfig[prop] = result.getValue(partsConfigFields[prop]);
            }
            boxConfig.partSpecificText = result.getText('custrecord_goba_color_boxes_part_key').toLowerCase();
            boxConfig.partText = result.getText('custrecord_goba_color_boxes_part').toLowerCase();
            boxConfig.itHandsPartText = customColorUtils_1.nsSpecificToItHands[boxConfig.partText];
            if (!boxesConfig[boxNumber])
                boxesConfig[boxNumber] = [];
            boxesConfig[boxNumber].push(boxConfig);
            return true;
        });
        log.debug('getBoxConfigBySku', `${skuPrefix} built box configuriation: ${JSON.stringify(boxesConfig)}.`);
        return boxesConfig;
    }
    exports.getBoxConfigBySku = getBoxConfigBySku;
    // function getPartQuantitiesFromBoxes(boxConfig: IBoxesConfig, partKey: string): number[] {
    //   const boxes = [];
    //   for (let box in boxConfig) {
    //     for (let partConfig of boxConfig[box]) {
    //       if (partConfig.partSpecific == partKey) {
    //         if (boxes.indexOf(partConfig.quantity) < 0) boxes.push(partConfig.quantity);
    //       }
    //     }
    //   }
    //   return boxes;
    // }
    function findParts(skuPrefix, queries) {
        const searchObj = search.load({ id: 'customsearch_all_assembly_items' }); //[SCRIPT] Assembly Items
        const filterExpression = searchObj.filterExpression;
        if (filterExpression.length > 0)
            filterExpression.push('AND');
        if (queries.length == 1)
            filterExpression.push(queries[0]);
        else
            filterExpression.push(queries);
        searchObj.filterExpression = filterExpression;
        const itemMap = [];
        searchObj.run().each(function (result) {
            const name = result.getValue('itemid');
            itemMap.push({
                id: result.id,
                skuPrefix: skuPrefix,
                memberId: result.getValue('memberitem'),
                memberName: result.getText('memberitem'),
                description: result.getValue('description'),
                memberItemDescription: result.getValue({ name: 'description', join: 'memberitem' }),
                quantity: Number(result.getValue('memberquantity')),
                box: name.substring(name.indexOf('#') + 1, name.indexOf('#') + 2)
            });
            return true;
        });
        return itemMap;
    }
    function getItemIDFromSku(name) {
        const itemsSearch = search.create({ type: search.Type.ITEM, filters: [['name', 'startswith', name]] });
        const numResults = itemsSearch.runPaged().count;
        if (numResults == 1) {
            const result = itemsSearch.run().getRange({ start: 0, end: 1 });
            return Number(result[0].id);
        }
        return 0;
    }
    function mapResults(searchID) {
        const partsCombos = getPartVariationOptions();
        const groupItemMap = getItemGroupMap();
        const searchObj = search.load({ id: searchID });
        const pageData = searchObj.runPaged({ pageSize: 1000 });
        const results = [];
        pageData.pageRanges.forEach(function (pageRange) {
            const page = pageData.fetch({ index: pageRange.index });
            page.data.forEach(function (result) {
                results.push({
                    id: Number(result.id),
                    lineId: Number(result.getValue({ name: 'line' })),
                    item: Number(result.getValue({ name: 'item' })),
                    subsidiary: Number(result.getValue({ name: 'subsidiary' })),
                    itemType: result.getValue({ name: 'itemtype' }),
                    foreignId: Number(result.getValue({ name: `${customColorUtils_1.IT_HANDS_ORDER_KEY}` })),
                    classId: result.getValue('class'),
                    description: result.getText('item'),
                    unitId: result.getValue('unitid'),
                    partsCombos,
                    groupItemMap
                });
            });
        });
        return results;
    }
    function getItemGroupMap() {
        const searchObj = search.load({ id: 'customsearch_goba_color_group_mappings' }); //[SCRIPT] Color Trampoline Group Mappings
        const pageData = searchObj.runPaged({ pageSize: 1000 });
        const skuMap = {};
        pageData.pageRanges.forEach(function (pageRange) {
            const page = pageData.fetch({ index: pageRange.index });
            page.data.forEach(function (result) {
                const skuPrefix = result.getValue('custrecord_goba_color_group_mappings_sku');
                skuMap[skuPrefix] = Number(result.getValue('custrecord_goba_color_group_mappings_grp'));
            });
        });
        return skuMap;
    }
    function getPartVariationOptions() {
        const searchObj = search.load({ id: 'customsearch_goba_variations' }); //[SCRIPT] Color Combination Variations
        const variationsMap = {};
        searchObj.run().each(result => {
            const sku = result.getValue('custrecord_goba_color_combos_sku');
            const partId = result.getValue('custrecord_goba_color_combos_part');
            //const partName         = result.getText('custrecord_goba_color_combos_part') as string;
            const numberVariations = Number(result.getValue('custrecord_goba_color_combos_num_vars'));
            if (!variationsMap[sku])
                variationsMap[sku] = { parts: {} };
            if (!variationsMap[sku].parts[partId])
                variationsMap[sku].parts[partId] = [numberVariations];
            else if (!variationsMap[sku].parts[partId].includes(numberVariations))
                variationsMap[sku].parts[partId].push(numberVariations);
            return true;
        });
        return variationsMap;
    }
    return exports;
});
