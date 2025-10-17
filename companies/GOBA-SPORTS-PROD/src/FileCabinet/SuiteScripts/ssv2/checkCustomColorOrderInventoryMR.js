/**
 * checkCustomColorOrderInventoryMR.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Rebuild Custom Color Order Assemblies
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/log", "N/record", "N/search"], function (log, record, search) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findAssembliesToUnbuild = exports.summarize = exports.reduce = exports.getInputData = void 0;
    const getInputData = () => {
        log.audit('getInputData', `Script version 231205a starting execution at ${new Date()}.`);
        const searchResults = mapResults('customsearch_goba_check_colortramp_invt'); // [SCRIPT] Orders to Check Inventory (id 10676)
        log.audit('getInputData', `Found ${searchResults.length} search results at ${new Date()}.`);
        return searchResults;
    };
    exports.getInputData = getInputData;
    const reduce = ctx => {
        try {
            const orderLines = ctx.values.map(v => JSON.parse(v));
            log.debug(`reduce ${ctx.key}`, `orderLines: ${JSON.stringify(orderLines)}.`);
            const itemsWithBackorder = [];
            const ordersReset = [];
            const backorderLocations = []; // Added 28 March 2023
            const salesOrderResultingTransactions = {}; // [GOBASD-27]
            orderLines.forEach((salesOrderLineSet) => {
                for (const lineId in salesOrderLineSet) {
                    const orderLine = salesOrderLineSet[lineId];
                    const locationQuantity = orderLine.locations[orderLine.location];
                    if (locationQuantity < orderLine.lineQuantity) {
                        itemsWithBackorder.push(orderLine);
                        if (!backorderLocations.includes(orderLine.location))
                            backorderLocations.push(orderLine.location);
                        salesOrderResultingTransactions[orderLine.orderId] = []; // [GOBASD-27]
                    }
                }
            });
            log.debug(`reduce ${ctx.key}`, `Items with back order: ${JSON.stringify(itemsWithBackorder)}.`);
            const componentParentAssemblies = itemsWithBackorder.length > 0 ? getStraightColorTrampolines(backorderLocations, ctx.key) : {};
            const componentsGenerated = {}; // [GOBASD-30] As we unbuild components, we'll track them here to avoid unbuilding too many.
            itemsWithBackorder.forEach((item) => {
                const componentsNeededFromUnbuilds = {};
                const itemsToCreateUnbuild = {};
                let unavailableComponents = []; // [GOBASD-26] We will try to unbuild straight color trampolines to generate component inventory, but if there's nothing to unbuild, we don't want to get into negative inventory.
                for (const member in item.members) { // See if any member component lacks sufficient inventory
                    const memberItem = item.members[member];
                    let quantityAvailable = getQuantityAvailable(memberItem.memberId, item.location.toString(), ctx.key); // quantity available of member item
                    const memberQtyRequired = memberItem.memberQuantity * item.lineQuantity;
                    // [GOBASD-30] See if we have any inventory coming available from what we're already planning to unbuild here.
                    const quantityFromUnbuilds = componentsGenerated[member] || 0;
                    log.debug(`reduce ${ctx.key}`, `Member ${member} quantity from unbuilds: ${quantityFromUnbuilds}, quantityAvailable ${quantityAvailable}, memberQtyRequired ${memberQtyRequired}`);
                    if (quantityFromUnbuilds && quantityAvailable < memberQtyRequired && (quantityAvailable + quantityFromUnbuilds) >= memberQtyRequired) { // Use the quantity from unbuilds!
                        const quantityToUse = memberQtyRequired - quantityAvailable;
                        log.debug(`reduce ${ctx.key}`, `Using ${quantityToUse} of quantityFromUnbuilds ${quantityFromUnbuilds} for member ${member}.`);
                        componentsGenerated[member] -= quantityToUse;
                        quantityAvailable += quantityToUse;
                    }
                    if (quantityAvailable < memberQtyRequired) { // If our line quantity is 2, and the member quantity is 3, we need 6. If we only have 2, then we need to unbuild 2 more (leaving us with 8 total).
                        const memberQtyToUnbuild = Math.ceil((memberQtyRequired - quantityAvailable) / memberItem.memberQuantity); // (6 - 2) / 3 = 1.33
                        log.debug(`reduce ${ctx.key}`, `For member ${member}, have ${quantityAvailable}, need ${memberQtyRequired}. To get it, we'll unbuild quantity ${memberQtyToUnbuild} x member qty ${memberItem.memberQuantity}.`);
                        const straightColorTrampolines = componentParentAssemblies[memberItem.memberId];
                        if (!straightColorTrampolines) {
                            log.debug(`reduce ${ctx.key}`, `No straight color trampoline found for memberId ${memberItem.memberId}.`);
                            unavailableComponents.push(memberItem.memberId);
                            continue;
                        }
                        let straightColorTrampoline = ''; // [GOBASD-25] We need to pick the one that matches the assembly on the sales order
                        for (const assembly of straightColorTrampolines) {
                            if (assembly.assemblyName.split(' ')[0] == item.itemName.split(' ')[0]) {
                                straightColorTrampoline = assembly.assemblyId;
                                log.debug(`reduce ${ctx.key}`, `Matched straight color assembly ${JSON.stringify(assembly)} for item ${JSON.stringify(item)}.`);
                                break;
                            }
                            else {
                                // log.debug(`reduce ${ctx.key}`, `Not a match, straight color assembly ${JSON.stringify(assembly)} for item ${JSON.stringify(item)}.`);
                            }
                        }
                        if (!itemsToCreateUnbuild[straightColorTrampoline])
                            itemsToCreateUnbuild[straightColorTrampoline] = 0;
                        itemsToCreateUnbuild[straightColorTrampoline] += memberQtyToUnbuild; // If we only needed 1, but now we need 2, increase what we'll unbuild.
                        // [GOBASD-30] We track which items we're creating unbuilds for, so we can deduct the inventory of what was built from what we gained from unbuilds
                        if (!componentsNeededFromUnbuilds[member])
                            componentsNeededFromUnbuilds[member] = 0;
                        componentsNeededFromUnbuilds[member] += memberQtyRequired;
                        // [GOBASD-30] Now add the components of the assembly we're going to unbuild, so they'll be available for usage above.
                        addComponentQuantitiesGeneratedByAssemblyUnbuild(componentsGenerated, straightColorTrampoline, memberQtyToUnbuild);
                    }
                    log.debug(`reduce ${ctx.key}`, `End member ${member}, componentsGenerated: ${JSON.stringify(componentsGenerated)}, itemsToCreateUnbuild: ${JSON.stringify(itemsToCreateUnbuild)}.`);
                } // End each member
                log.debug(`reduce ${ctx.key}`, `Components needed from unbuilds for item ${item.itemId}: ${JSON.stringify(componentsNeededFromUnbuilds)}.`); // [GOBASD-30]
                if (unavailableComponents.length > 0) { // [GOBASD-26] If we couldn't generate inventory for any of the components we need, abort here, so we don't create an assembly with inventory we don't have.
                    return log.debug(`reduce ${ctx.key}`, `Aborting assembly processing for item ${item.itemId}, unavailable components: ${JSON.stringify(unavailableComponents)}.`);
                }
                // We unbuild the straight-color trampoline in order to get the parts needed for a mixed-color trampoline.
                log.debug(`reduce ${ctx.key}`, `itemsToCreateUnbuild: ${JSON.stringify(itemsToCreateUnbuild)}.`);
                for (const straightColorTrampoline in itemsToCreateUnbuild) {
                    const unbuildNumber = unbuildItem(item, straightColorTrampoline, itemsToCreateUnbuild[straightColorTrampoline], ctx.key); // The straightColorTrampoline is what we're actually unbuilding.
                    salesOrderResultingTransactions[item.orderId].push(`${unbuildNumber}: ${item.itemName}`); // [GOBASD-27]
                }
                // [GOBASD-30] Remove the backordered inventory from what we just unbuilt
                for (const componentBeingUsedNow in componentsNeededFromUnbuilds) {
                    componentsGenerated[componentBeingUsedNow] -= componentsNeededFromUnbuilds[componentBeingUsedNow];
                }
                log.debug(`reduce ${ctx.key}`, `After current usage, other components generated: ${JSON.stringify(componentsGenerated)}.`);
                const build = buildAssemblyFromItemId(item, ctx.key);
                if (!build)
                    log.error(`reduce ${ctx.key}`, `Couldn't build assembly for item ${item}.`);
            });
            for (const orderLine of orderLines) { // Clear the checkbox on all the orders
                for (const line in orderLine) {
                    if (!ordersReset.includes(orderLine[line].orderId)) {
                        const custbody_builds_and_unbuilds = salesOrderResultingTransactions[orderLine[line].orderId].join('\n'); // [GOBASD-27]
                        log.debug(`reduce ${ctx.key}`, `Updating sales order ${orderLine[line].orderId} with builds/unbuilds ${custbody_builds_and_unbuilds} at ${new Date()}`);
                        record.submitFields({ type: 'salesorder', id: orderLine[line].orderId, values: { custbody_goba_check_colortramp_invt: false, custbody_builds_and_unbuilds } });
                        ordersReset.push(orderLine[line].orderId);
                    }
                }
            }
        }
        catch (e) {
            log.error(`reduce ${ctx.key}`, e);
        }
    };
    exports.reduce = reduce;
    function summarize(context) {
        log.audit('summarize', `Execution Complete, usage: ${context.usage}.`);
    }
    exports.summarize = summarize;
    function addComponentQuantitiesGeneratedByAssemblyUnbuild(componentsGenerated, assemblyUnbuilt, quantity) {
        if (assemblyUnbuilt)
            search.create({
                type: 'item',
                filters: [['internalid', 'anyof', assemblyUnbuilt]],
                columns: ['memberitem', 'memberquantity']
            }).run().each((result) => {
                const componentId = result.getValue('memberitem');
                if (!componentsGenerated[componentId])
                    componentsGenerated[componentId] = 0;
                const componentQuantity = Number(result.getValue('memberquantity')) * quantity;
                componentsGenerated[componentId] += componentQuantity;
                log.debug('addComponentQuantitiesGeneratedByAssemblyUnbuild', `Adding quantity ${componentQuantity} of component ${componentId} from unbuilt assembly ${assemblyUnbuilt}.`);
                return true;
            });
        log.debug('addComponentQuantitiesGeneratedByAssemblyUnbuild', `Resulting components generated after adding all from assembly ${assemblyUnbuilt}: ${JSON.stringify(componentsGenerated)}.`);
    }
    function getStraightColorTrampolines(locationIds, reduceKey) {
        const componentParentAssemblies = {}; // [GOBASD-25] Track multiple options
        log.debug(`getStraightColorTrampolines ${reduceKey}`, `Searching assemblies for items in locations ${JSON.stringify(locationIds)}.`);
        search.create({
            type: 'item',
            filters: [
                ['isinactive', 'is', 'F'], 'and',
                ['custitem_custom_unbuild_box', 'is', 'T'], 'and',
                ['inventorylocation', 'anyof', locationIds], 'and',
                ['locationquantityavailable', 'greaterthan', '0'] // If there's no inventory, we don't want to use this assembly.
            ],
            columns: ['memberitem', 'itemid', 'memberquantity'] // [GOBASD-30]
        }).run().each((result) => {
            const memberId = result.getValue('memberitem');
            if (!componentParentAssemblies[memberId])
                componentParentAssemblies[memberId] = [];
            componentParentAssemblies[memberId].push({ assemblyId: result.id, assemblyName: result.getValue('itemid') });
            // [GOBASD-30] Now, for any other members that are on this assembly, add this componet. This way, if we unbuild this to get some rods, we know that we also get a net with it.
            // for (const member in componentParentAssemblies) {
            //   for (const assembly of componentParentAssemblies[member]) {
            //     if (assembly.assemblyId != result.id) continue;
            //     assembly.components[memberId] = Number(result.getValue('memberquantity'));
            //   }
            // }
            return true;
        });
        log.debug(`getStraightColorTrampolines ${reduceKey}`, `Returning ${JSON.stringify(componentParentAssemblies)}.`);
        return componentParentAssemblies;
    }
    function unbuildItem(orderItem, straightColorTrampline, quantityToUnbuild, logKey) {
        let unbuildNumber = '';
        log.debug(`unbuildItem ${logKey}`, `Creating Unbuild with qty ${quantityToUnbuild} for item ${straightColorTrampline}, orderItem: ${JSON.stringify(orderItem)}.`);
        const unbuild = record.create({ type: 'assemblyunbuild', isDynamic: true });
        unbuild.setValue({ fieldId: 'subsidiary', value: orderItem.subsidiary });
        unbuild.setValue({ fieldId: 'location', value: orderItem.location });
        unbuild.setValue({ fieldId: 'item', value: straightColorTrampline });
        unbuild.setValue({ fieldId: 'quantity', value: quantityToUnbuild });
        unbuild.setValue({ fieldId: 'memo', value: orderItem.orderNumber });
        try {
            const unbuildId = unbuild.save({ ignoreMandatoryFields: true });
            log.debug(`unbuildItem ${logKey}`, `Created assembly Unbuild ${unbuildId} for item ${straightColorTrampline}, orderItem: ${JSON.stringify(orderItem)}.`);
            const values = search.lookupFields({ type: 'assemblyunbuild', id: unbuildId, columns: ['tranid'] });
            unbuildNumber = values.tranid;
        }
        catch (e) {
            log.error(`unbuildItem ${logKey}`, `Failed creating assembly unbuild for item ${straightColorTrampline}: ${e.message}`);
        }
        return unbuildNumber;
    }
    function getQuantityAvailable(itemId, locationId, reduceKey) {
        let quantityAvailable = 0;
        const results = search.create({
            type: search.Type.ITEM,
            filters: [['internalid', 'anyof', itemId], 'and', ['inventorylocation', 'anyof', locationId]],
            columns: ['locationquantityavailable']
        }).run().getRange({ start: 0, end: 1 });
        log.debug(`getQuantityAvailable ${reduceKey}`, `Results for item ${itemId}, location ${locationId}: ${results.length}`);
        if (results.length > 0)
            quantityAvailable = Number(results[0].getValue('locationquantityavailable'));
        log.debug(`getQuantityAvailable ${reduceKey}`, `Available quantity for item ${itemId} at location ${locationId}: ${quantityAvailable}.`);
        return quantityAvailable;
    }
    function mapResults(searchID) {
        let searchObj;
        try {
            searchObj = search.load({ id: searchID });
        }
        catch (e) {
            log.error('mapResults', `Failed to load search ${searchID}: ${e.message}`);
            return [];
        }
        const pageData = searchObj.runPaged({ pageSize: 1000 });
        const results = {};
        pageData.pageRanges.forEach(function (pageRange) {
            const page = pageData.fetch({ index: pageRange.index });
            page.data.forEach(function (result) {
                const locationId = result.getValue({ name: 'inventorylocation', join: 'item' });
                if (Number(locationId) > 0) {
                    const itemId = result.getValue('item');
                    const lineId = result.getValue('line');
                    if (!results[result.id])
                        results[result.id] = {}; // result.id is the transaction id
                    if (!results[result.id][lineId])
                        results[result.id][lineId] = {
                            orderId: result.id,
                            orderNumber: result.getValue('tranid'),
                            itemId: itemId,
                            itemName: result.getText('item'),
                            members: {},
                            lineQuantity: Number(result.getValue('quantity')),
                            location: Number(result.getValue('location')),
                            locations: {},
                            subsidiary: result.getValue('subsidiarynohierarchy')
                        };
                    results[result.id][lineId]['locations'] = results[result.id][lineId]['locations'] || {};
                    results[result.id][lineId]['locations'][locationId] = Number(result.getValue({ name: 'locationquantityavailable', join: 'item' }));
                    const memberItemId = result.getValue({ name: 'memberitem', join: 'item' });
                    if (!results[result.id][lineId]['members'][memberItemId])
                        results[result.id][lineId]['members'][memberItemId] = {
                            memberId: result.getValue({ name: 'memberitem', join: 'item' }),
                            memberName: result.getText({ name: 'memberitem', join: 'item' }),
                            memberQuantity: Number(result.getValue({ name: 'memberquantity', join: 'item' }))
                        };
                }
            });
        });
        return Object.values(results);
    }
    function buildAssemblyFromItemId(item, key) {
        log.debug(`buildAssemblyFromItemId ${key}`, `Creating assembly build for item: ${JSON.stringify(item)}.`);
        let buildId = 0, buildNumber = '';
        const build = record.create({ type: 'assemblybuild', isDynamic: true });
        build.setValue({ fieldId: 'subsidiary', value: item.subsidiary });
        build.setValue({ fieldId: 'location', value: item.location });
        build.setValue({ fieldId: 'item', value: item.itemId });
        build.setValue({ fieldId: 'quantity', value: item.lineQuantity });
        build.setValue({ fieldId: 'memo', value: item.orderNumber });
        try {
            buildId = build.save({ ignoreMandatoryFields: true });
            log.debug(`buildAssemblyFromItemId ${key}`, `Saved assembly build ${buildId} for item: ${JSON.stringify(item)}.`);
            const values = search.lookupFields({ type: 'assemblybuild', id: buildId, columns: ['tranid'] });
            buildNumber = values.tranid;
        }
        catch (e) {
            log.error(`buildAssemblyFromItemId ${key}`, `Failed creating assembly build for item ${item.itemId}: ${e.message}`);
        }
        return buildNumber;
    }
    function findAssembliesToUnbuild(item) {
        const searchForPartMatches = search.load({ id: 'customsearch_goba_assembly_inventory' }); //[SCRIPT] Assembly Inventory by Member
        const filterExpression = searchForPartMatches.filterExpression;
        if (filterExpression.length > 0)
            filterExpression.push('AND');
        filterExpression.push(['inventorylocation', 'is', item.location], 'AND', ['memberitem.internalid', 'anyof', item.itemId]);
    }
    exports.findAssembliesToUnbuild = findAssembliesToUnbuild;
    return exports;
});
