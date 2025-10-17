/**
 * updateCommitmentsMapReduce.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Update Commitments - Map/Reduce
 * @NScriptType MapReduceScript
 * @NApiVersion 2.x
 */
define(["N/format", "N/https", "N/log", "N/record", "N/runtime", "N/search", "N/url"], function (format, https, log, record, runtime, search, url) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInputData = function () {
        var lastRunEast = getLastRunTime();
        // Find orders created since the last time we ran this script.
        log.audit('Execution Starting', "Looking up sales orders created since " + lastRunEast + ".");
        var newCommitments = [];
        var searchId = runtime.getCurrentScript().getParameter({ name: 'custscript_updatecommitmentsmr_search' });
        var testItem = runtime.getCurrentScript().getParameter({ name: 'custscript_updatecommitmentsmr_item' });
        var orderSearch = search.load({ id: searchId });
        var filters = orderSearch.filterExpression;
        filters.push('and', [['datecreated', 'onorafter', lastRunEast], 'or', ['custbody_runreallocationscript', 'is', 'T']]); // These are in Eastern time)
        if (testItem) {
            filters.push('and', ['item', 'anyof', testItem]);
            log.audit('Using Test Item', "Item " + testItem + ".");
        }
        orderSearch.filterExpression = filters;
        orderSearch.run().each(function (result) {
            var item = result.getValue('item');
            var locationId = result.getValue('location');
            var shipDate = result.getValue('shipdate');
            var lastMod = result.getValue('linelastmodifieddate');
            log.debug('Analyzing sales order line', "Order " + result.id + " item " + item + ", ESD " + shipDate + ", Last modified " + lastMod + ".");
            var commitmentFound = false;
            for (var _i = 0, newCommitments_1 = newCommitments; _i < newCommitments_1.length; _i++) {
                var commitment = newCommitments_1[_i];
                if (commitment.item == item && commitment.locationId == locationId) {
                    commitmentFound = true;
                    break;
                }
            }
            if (!commitmentFound)
                newCommitments.push({ item: item, locationId: locationId, poDates: [] });
            return true;
        });
        newCommitments = getPOWindows(newCommitments);
        // Update last run time
        var deploymentId = getMRDeploymentId(); // Numerical script ID (unique to this script / deployment pair)
        var thisRun = format.format({ type: format.Type.DATETIME, value: new Date() }); // This will be in eastern time.
        try {
            record.submitFields({ type: 'scriptdeployment', id: deploymentId, values: { custscript_updatecommitmentsmr_lastrun: thisRun } });
        }
        catch (e) {
            log.error('getInputData()', "Failed to update timestamp on deployment ID " + deploymentId + " to " + thisRun + ": " + e.message);
        }
        // log.audit('getInputData()', `New Commitments Found: ${newCommitments.length}.`);
        log.audit('getInputData()', "New Commitments Found: " + newCommitments.length + " " + JSON.stringify(newCommitments) + ".");
        return newCommitments;
    };
    /** Read time last run */
    function getLastRunTime(addAMinute) {
        var pacificDate = runtime.getCurrentScript().getParameter({ name: 'custscript_updatecommitmentsmr_lastrun' });
        if (addAMinute)
            pacificDate = new Date(pacificDate.getTime() + 60 * 1000);
        var lastRunEast = format.format({ type: format.Type.DATETIME, value: pacificDate });
        var dateTime = lastRunEast.split(' ');
        var timeSplit = dateTime[1].split(':');
        // Format the last run time for use as a search filter. Basically just cut the seconds out of the end of the string.
        return dateTime[0] + " " + timeSplit[0] + ":" + timeSplit[1] + " " + dateTime[2];
    }
    // Runs for each item/location found on new orders.  We'll check all open orders to see if we need to update any commitments for this item.
    exports.map = function (mapContext) {
        try {
            var ordersUpdated_1 = [];
            var demand_1 = [];
            var newItem_1 = JSON.parse(mapContext.value);
            var orderSearchId = runtime.getCurrentScript().getParameter({ name: 'custscript_updatecommitmentsmr_openorder' });
            // Find sales order lines for this item/location with qty committed with older ship dates
            var soSearch = search.load({ id: orderSearchId });
            soSearch.filterExpression = soSearch.filterExpression.concat(['and', ['item', 'anyof', newItem_1.item], 'and', ['location', 'anyof', newItem_1.locationId]]);
            soSearch.run().each(function (result) {
                var committed = Number(result.getValue('quantitycommitted'));
                var line = Number(result.getValue('linesequencenumber')) - 1; // Convert from 1-based to 0-based
                var quantity = Number(result.getValue('quantity'));
                var shipDate = format.parse({ type: format.Type.DATE, value: result.getValue('shipdate') });
                var priority = result.getValue('orderpriority');
                var logApprove = result.getValue('custbody_logistics_approval');
                var splitFrom = result.getValue('custbody_so_split_from');
                var poWindow = calcShipWindow(shipDate, newItem_1.poDates);
                log.debug('Found order to update', "Item " + newItem_1.item + " Order ID " + result.id + ", Line " + line + ", Qty " + quantity + ", Ship Date " + shipDate + ".");
                demand_1.push({ orderId: result.id, quantity: quantity, committed: committed, line: line, shipDate: shipDate, priority: priority, doDecommit: false, doRecommit: false, logApprove: logApprove, splitFrom: splitFrom, poWindow: poWindow });
                return true;
            });
            // Sort the orders so that they'll be in priority order, so as we save them (in this order) the commitments will be applied to the preferred orders first.
            log.audit("Demand before sort - item " + newItem_1.item, JSON.stringify(demand_1));
            demand_1.sort(sortByPriorityAndDate);
            log.audit("Demand after sort - item " + newItem_1.item, JSON.stringify(demand_1));
            redistributeDemand(demand_1, newItem_1.item);
            log.audit("Demand after redistribution - item " + newItem_1.item, JSON.stringify(demand_1));
            // If we are taking inventory from an order, then we need to de-commit the lines on the orders following it too, so they don't steal its inventory when it becomes available.
            var firstDecommit_1 = -1;
            demand_1.forEach(function (soLine, idx) {
                if (!~firstDecommit_1 && soLine.doDecommit) {
                    firstDecommit_1 = idx;
                    log.debug('First decommit identified', "Index " + firstDecommit_1);
                }
                else if (~firstDecommit_1 && idx > firstDecommit_1) {
                    soLine.doDecommit = true;
                }
            });
            // De-commit orders that we need inventory from
            var suiteletUrl_1 = url.resolveScript({ scriptId: 'customscript_updateorder_suitelet', deploymentId: 'customdeploy1', returnExternalUrl: true });
            demand_1.forEach(function (soLine) {
                if (!soLine.doDecommit)
                    return;
                https.post({ url: suiteletUrl_1, body: { order: soLine.orderId, action: 'decommit', line: soLine.line } }); // Costs 10 points
                log.audit('Inventory Decommitted', "Sales Order Saved: " + JSON.stringify(soLine) + "; Usage: " + runtime.getCurrentScript().getRemainingUsage() + ".");
                // logCommittedQty(soLine.orderId, newItem.item);
                if (!~ordersUpdated_1.indexOf(soLine.orderId))
                    ordersUpdated_1.push(soLine.orderId);
            });
            // Re-commit orders that we have new inventory for, or where we decommitted
            demand_1.forEach(function (soLine) {
                if (!soLine.doRecommit && !soLine.doDecommit)
                    return;
                https.post({ url: suiteletUrl_1, body: { order: soLine.orderId, action: 'recommit', line: soLine.line } }); // Costs 10 points
                log.audit('Inventory Committed', "Sales Order Saved: " + JSON.stringify(soLine) + "; Usage: " + runtime.getCurrentScript().getRemainingUsage() + ".");
                // logCommittedQty(soLine.orderId, newItem.item);
                if (!~ordersUpdated_1.indexOf(soLine.orderId))
                    ordersUpdated_1.push(soLine.orderId);
            });
            ordersUpdated_1.forEach(function (orderId) {
                mapContext.write(orderId, "Updated in map key " + mapContext.key + ".");
            });
        }
        catch (e) {
            log.error('map()', e.message);
        }
    };
    exports.reduce = function (context) {
        try {
            log.audit('reduce', "Updating Fill Rate on order " + context.key + ".");
            var soRec = record.load({ type: 'salesorder', id: context.key });
            soRec.setValue('custbody_updatefillrate', true);
            soRec.setValue('custbody_runreallocationscript', false);
            soRec.save({ ignoreMandatoryFields: true });
        }
        catch (e) {
            log.error('reduce', "Failed to update order id " + context.key + " - " + e.message);
        }
    };
    exports.summarize = function () {
        var lastRunTime = getLastRunTime(true);
        log.debug('summarize', "Checking for orders modified at or before " + lastRunTime + ".");
        search.create({
            type: 'salesorder',
            filters: [['mainline', 'is', 'T'], 'and', ['custbody_runreallocationscript', 'is', 'T'], 'and', ['lastmodifieddate', 'notafter', lastRunTime]],
            columns: ['lastmodifieddate']
        }).run().each(function (result) {
            record.submitFields({ type: 'salesorder', id: result.id, values: { custbody_runreallocationscript: false } });
            log.debug('summarize', "Unchecked Run Reallocation checkbox on order " + result.id + ", last modified " + result.getValue('lastmodifieddate') + ".");
            return true;
        });
        log.audit('summarize()', 'Execution Complete');
    };
    /** For debugging - logs the quantity currently committed for an item on an order */
    // function logCommittedQty(order: string, item: string): void {
    //   const rec       = record.load({ type: 'salesorder', id: order });
    //   const line      = rec.findSublistLineWithValue({ sublistId: 'item', fieldId: 'item', value: item });
    //   const committed = rec.getSublistValue({ sublistId: 'item', fieldId: 'quantitycommitted', line }) as number;
    //   log.audit('Quantity Committed', `Order ${order} item ${item} committed ${committed}.`);
    // }
    function calcShipWindow(date, poDates) {
        for (var i = 0; i < poDates.length; i++) {
            var poDate = new Date(poDates[i]);
            if (i == 0 && date.getTime() == poDate.getTime())
                return i + 1;
            if (date.getTime() < poDate.getTime())
                return i;
        }
        return poDates.length;
    }
    function getPOWindows(newCommitments) {
        var itemLocFilters = [];
        // Sort by location so we can have fewer filters
        var itemsByLocation = {};
        for (var _i = 0, newCommitments_2 = newCommitments; _i < newCommitments_2.length; _i++) {
            var commitment = newCommitments_2[_i];
            if (!itemsByLocation[commitment.locationId])
                itemsByLocation[commitment.locationId] = [];
            itemsByLocation[commitment.locationId].push(commitment.item);
        }
        log.debug('Items by location', JSON.stringify(itemsByLocation));
        for (var locationId in itemsByLocation) {
            if (itemLocFilters.length > 0)
                itemLocFilters.push('or');
            itemLocFilters.push([['location', 'anyof', locationId], 'and', ['item', 'anyof', itemsByLocation[locationId]]]);
        }
        if (itemLocFilters.length > 0)
            search.create({
                type: 'purchaseorder',
                filters: [
                    itemLocFilters, 'and',
                    ['mainline', 'is', 'F'], 'and',
                    ['status', 'anyof', 'PurchOrd:B', 'PurchOrd:D', 'PurchOrd:E'], 'and',
                    ['formulanumeric: {quantity} - {quantityshiprecv}', 'greaterthan', '0']
                ],
                columns: [
                    search.createColumn({ name: 'item' }),
                    search.createColumn({ name: 'location' }),
                    search.createColumn({ name: 'expectedreceiptdate', sort: search.Sort.ASC })
                ]
            }).run().each(function (result) {
                var item = result.getValue('item');
                var locationId = result.getValue('location');
                var dateExpected = result.getValue('expectedreceiptdate');
                var idx = findObjectElementIndex(newCommitments, { item: item, locationId: locationId });
                if (dateExpected && ~idx && !~newCommitments[idx].poDates.indexOf(dateExpected))
                    newCommitments[idx].poDates.push(dateExpected);
                return true;
            });
        return newCommitments;
    }
    /** Figure out which order lines need additional inventory, then figure out which orders we can take it from. */
    function redistributeDemand(demand, itemId) {
        for (var demandIdx = 0; demandIdx < demand.length; demandIdx++) {
            var soLine = demand[demandIdx];
            var deficit = soLine.quantity - soLine.committed;
            if (deficit > 0) { // Then we need more, so figure out where we can pull it from
                log.debug('Deficit Found', "Item " + itemId + " Deficit: " + deficit + " for " + JSON.stringify(soLine) + ".");
                // See if we can meet this demand
                for (var i = demand.length - 1; deficit && i > demandIdx; i--) { // start at the sales order farthest in the future
                    // If we have some committed, and its not log approved, and not from a split, and has a later PO window, then we can take from this order.
                    if (demand[i].committed > 0 && !demand[i].logApprove && !demand[i].splitFrom && demand[i].poWindow > soLine.poWindow) {
                        log.debug('Redistributing Inventory', "Item " + itemId + " - found " + demand[i].committed + " on " + JSON.stringify(demand[i]) + ", applying to deficit...");
                        if (deficit > demand[i].committed) { // Deficit is greater than what we have here
                            deficit -= demand[i].committed; // Subtract the qty we are gaining from the deficit
                            soLine.committed += demand[i].committed; // Add what we've gained to our committed qty
                            demand[i].committed = 0; // Mark that we've taken all the committed inventory from this other order
                        }
                        else { // This order covers more than the deficit
                            demand[i].committed -= deficit; // Mark that we've taken some inventory away from this order
                            soLine.committed += deficit; // We've finished fulfilling the rest of the deficit
                            deficit = 0;
                        }
                        demand[i].doDecommit = true; // We're taking inventory from this line, so it needs to be decommitted
                        soLine.doRecommit = true; // We found inventory to add to this line, so we'll need to re-commit it
                    }
                }
            }
        }
    }
    function sortByPriorityAndDate(demandA, demandB) {
        var sortValue = 0;
        if (demandA.priority) {
            if (demandB.priority) {
                if (demandA.priority < demandB.priority)
                    sortValue = -1;
                else if (demandB.priority < demandA.priority)
                    sortValue = 1;
            }
            else { // Only A had a priority
                sortValue = -1;
            }
        }
        else if (demandB.priority) {
            sortValue = 1;
        }
        if (!sortValue) {
            if (demandA.poWindow < demandB.poWindow)
                sortValue = -1;
            else if (demandA.poWindow > demandB.poWindow)
                sortValue = 1;
            else { // Otherwise they have the same priority and poWindow, so use ship date
                if (demandA.shipDate.getTime() < demandB.shipDate.getTime())
                    sortValue = -1;
                else if (demandA.shipDate.getTime() > demandB.shipDate.getTime())
                    sortValue = 1;
            }
        }
        // log.debug('Sorting', `${sortValue} A: ${JSON.stringify(demandA)} B: ${JSON.stringify(demandB)}`);
        return sortValue;
    }
    function findObjectElementIndex(array, valuesToMatch) {
        for (var i = 0; i < array.length; i++) {
            var isMatch = true;
            for (var key in valuesToMatch) {
                if (array[i][key] != valuesToMatch[key])
                    isMatch = false;
            }
            if (isMatch)
                return i;
        }
        return -1;
    }
    /** Gets the numerical script deployment ID */
    function getMRDeploymentId() {
        var deploymentId = '';
        search.create({
            type: 'scriptdeployment',
            filters: [
                ['script.scriptid', 'is', runtime.getCurrentScript().id], 'and',
                ['scriptid', 'is', runtime.getCurrentScript().deploymentId]
            ]
        }).run().each(function (result) {
            deploymentId = result.id;
            return false;
        });
        return deploymentId;
    }
    return exports;
});
