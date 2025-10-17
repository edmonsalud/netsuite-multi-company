/**
 * reallocationGatherRequiredOperationsMapReduce.ts
 * by Head in the Cloud Development
 *
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType MapReduceScript
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
define(["N/format", "N/log", "N/record", "N/runtime", "N/search", "N/task"], function (format, log, record, runtime, search, task) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInputData = function () {
        var thisRun = format.format({ type: format.Type.DATETIME, value: new Date() }); // This will be in eastern time.
        var lastRunTime = getLastRunTime();
        var deploymentId = getMRDeploymentId(); // Numerical script ID (unique to this script / deployment pair)
        var testItem = runtime.getCurrentScript().getParameter({ name: 'custscript_reallocation_item' });
        // Find orders created since the last time we ran this script.
        log.audit('Execution Starting', "Looking up sales orders created since " + lastRunTime + ".");
        var newCommitments = [];
        var searchId = runtime.getCurrentScript().getParameter({ name: 'custscript_reallocation_search' });
        var orderSearch = search.load({ id: searchId });
        var filters = orderSearch.filterExpression;
        filters.push('and', [['datecreated', 'onorafter', lastRunTime], 'or', ['custbody_runreallocationscript', 'is', 'T']]); // These are in Eastern time)
        if (testItem) {
            filters.push('and', ['item', 'anyof', testItem]);
            log.audit('Using Test Item', "Item " + testItem + ".");
        }
        orderSearch.filterExpression = filters;
        var results = getAllResults(orderSearch);
        log.audit('getInputData', "Results: " + results.length + ".");
        results.forEach(function (result) {
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
                newCommitments.push({
                    item: item,
                    locationId: locationId,
                    quantity: { available: 0, committed: 0, onorder: 0 },
                    poDates: {},
                    atpDetails: []
                });
        });
        newCommitments = getItemLocationQuantity(newCommitments);
        newCommitments = getPOWindows(newCommitments);
        newCommitments = getATPDetails(newCommitments);
        try {
            record.submitFields({ type: 'scriptdeployment', id: deploymentId, values: { custscript_reallocation_lastrun: thisRun } });
        }
        catch (e) {
            log.error('getInputData()', "Failed to update timestamp on deployment ID " + deploymentId + " to " + thisRun + ": " + e.message);
        }
        // log.audit('getInputData()', `New Commitments Found: ${newCommitments.length}.`);
        log.audit('getInputData()', "New Commitments Found: " + newCommitments.length + " " + JSON.stringify(newCommitments) + ".");
        return newCommitments;
    };
    // Runs for each item/location found on new orders.  We'll check all open orders to see if we need to update any commitments for this item.
    exports.map = function (mapContext) {
        try {
            var demand_1 = [];
            var newItem_1 = JSON.parse(mapContext.value);
            var orderSearchId = runtime.getCurrentScript().getParameter({ name: 'custscript_reallocation_openorder' });
            // Find sales order lines for this item/location with qty committed with older ship dates
            var soSearch = search.load({ id: orderSearchId });
            soSearch.filterExpression = soSearch.filterExpression.concat(['and', ['item', 'anyof', newItem_1.item], 'and', ['location', 'anyof', newItem_1.locationId]]);
            var pageData_1 = soSearch.runPaged({ pageSize: 1000 });
            pageData_1.pageRanges
                .map(function (pageRange) { return pageData_1.fetch({ index: pageRange.index }); })
                .reduce(function (results, page) { return results.concat(page.data); }, [])
                .forEach(function (result) {
                var committed = Number(result.getValue('quantitycommitted'));
                var line = Number(result.getValue('linesequencenumber')) - 1; // Convert from 1-based to 0-based
                var quantity = Number(result.getValue('quantity'));
                var shipDate = format.parse({ type: format.Type.DATE, value: result.getValue('shipdate') });
                var created = format.parse({ type: format.Type.DATE, value: result.getValue('datecreated') });
                var priority = result.getValue('orderpriority');
                var logApprove = result.getValue('custbody_logistics_approval');
                var splitFrom = result.getValue('custbody_so_split_from');
                // Set an initial PO Window based on PO expected receipt date vs SO ship date
                var poWindow = (Number(priority) > 0) ? 0 : calcShipWindow(shipDate, Object.keys(newItem_1.poDates));
                var originPoWindow = poWindow;
                log.debug('Found order to update', "Item " + newItem_1.item + " Order ID " + result.id + ", Line " + line + ", Qty " + quantity + ", Ship Date " + shipDate + ", PO Window " + poWindow + ".");
                demand_1.push({
                    orderId: result.id,
                    quantity: quantity,
                    committed: committed,
                    line: line,
                    shipDate: shipDate,
                    priority: priority,
                    doDecommit: false,
                    doRecommit: false,
                    doUpdateFillRate: false,
                    logApprove: logApprove,
                    splitFrom: splitFrom,
                    poWindow: poWindow,
                    originPoWindow: originPoWindow,
                    poDates: newItem_1.poDates,
                    created: created,
                    needToSort: true,
                    recommitPhase: 1,
                });
                return true;
            });
            if (demand_1.length > 0) {
                demand_1 = redistributeDemand(demand_1, newItem_1);
                // If we are taking inventory from an order, then we need to de-commit the lines on the other orders too, so they don't steal its inventory when it becomes available.
                var decommitting_1 = false;
                for (var i = 0; i < demand_1.length; i++) {
                    if (demand_1[i].doDecommit) {
                        decommitting_1 = true;
                        break;
                    }
                }
                log.debug('Decommitting?', decommitting_1);
                demand_1.forEach(function (soLine, idx) {
                    if (decommitting_1) {
                        soLine.doDecommit = true;
                        soLine.doRecommit = true;
                        soLine.doUpdateFillRate = true;
                    }
                    if (soLine.doRecommit) {
                        if (soLine.committed == soLine.quantity) {
                            soLine.recommitPhase = 1;
                        }
                        else if (soLine.committed == 0) {
                            soLine.recommitPhase = 3;
                        }
                        else {
                            soLine.recommitPhase = 2;
                        }
                    }
                });
            }
            var ordersUpdated_1 = [];
            var actions_1 = [];
            demand_1.forEach(function (soLine) {
                if (!soLine.doDecommit)
                    return;
                var decommitAction = { order: soLine.orderId, action: 'decommit', line: soLine.line };
                actions_1.push(decommitAction);
            });
            // Re-commit orders that we have new inventory for, or where we decommitted
            demand_1.forEach(function (soLine) {
                if (!soLine.doRecommit && !soLine.doDecommit)
                    return;
                var action = 'recommit-all';
                if (soLine.recommitPhase == 2) {
                    action = 'recommit-partial';
                }
                else if (soLine.recommitPhase == 3) {
                    action = 'recommit-none';
                }
                var recommitAction = { order: soLine.orderId, action: action, line: soLine.line };
                actions_1.push(recommitAction);
                ordersUpdated_1.push(soLine.orderId);
            });
            ordersUpdated_1.forEach(function (orderId) {
                actions_1.push({ action: "updatefillrate", order: orderId, line: null });
            });
            log.debug('Actions found', actions_1.length);
            if (actions_1.length > 0)
                mapContext.write('1', JSON.stringify(actions_1));
        }
        catch (e) {
            log.error('map()', e.message);
        }
    };
    exports.reduce = function (context) {
        try {
            log.debug('reduce ctx', context);
            var decommits_1 = {};
            var recommitsAll_1 = {};
            var recommitsPartial_1 = {};
            var recommitsNone_1 = {};
            var updateFillRates_1 = [];
            var totalActions_1 = 0;
            context.values.forEach(function (valueStr) {
                var actions = JSON.parse(valueStr);
                totalActions_1 += actions.length;
                actions.forEach(function (action) {
                    switch (action.action) {
                        case "decommit":
                            if (!decommits_1[action.order]) {
                                decommits_1[action.order] = [];
                            }
                            decommits_1[action.order].push(action.line);
                            break;
                        case "recommit-all":
                            if (!recommitsAll_1[action.order]) {
                                recommitsAll_1[action.order] = [];
                            }
                            recommitsAll_1[action.order].push(action.line);
                            break;
                        case "recommit-partial":
                            if (!recommitsPartial_1[action.order]) {
                                recommitsPartial_1[action.order] = [];
                            }
                            recommitsPartial_1[action.order].push(action.line);
                            break;
                        case "recommit-none":
                            if (!recommitsNone_1[action.order]) {
                                recommitsNone_1[action.order] = [];
                            }
                            recommitsNone_1[action.order].push(action.line);
                            break;
                        case "updatefillrate":
                            if (!recommitsAll_1[action.order] && !recommitsPartial_1[action.order] && !recommitsNone_1[action.order]) {
                                updateFillRates_1.push(action.order);
                            }
                            break;
                        default:
                            throw "Weird action: " + JSON.stringify(action);
                    }
                });
            });
            log.audit('Total actions to perform', totalActions_1);
            var rec = record.create({ type: 'customrecord_ros' });
            rec.setValue('custrecord_ros_decommits', JSON.stringify(decommits_1));
            rec.setValue('custrecord_ros_recommits_all', JSON.stringify(recommitsAll_1));
            rec.setValue('custrecord_ros_recommits_part', JSON.stringify(recommitsPartial_1));
            rec.setValue('custrecord_ros_recommits_none', JSON.stringify(recommitsNone_1));
            rec.setValue('custrecord_ros_update_fill_rates', JSON.stringify(updateFillRates_1));
            var lastRunTime = getLastRunTime(true);
            if (runtime.version == '2018.1') {
                lastRunTime = lastRunTime.replace(' am', ':00 am').replace(' pm', ':00 pm');
            }
            rec.setValue('custrecord_ros_lastrun', format.parse({ type: format.Type.DATETIME, value: lastRunTime }));
            rec.save();
        }
        catch (e) {
            log.error('reduce', "Failed to update order id " + context.key + " - " + e.message);
        }
    };
    exports.summarize = function () {
        log.audit('summarize()', 'Execution Complete');
        task.create({ taskType: task.TaskType.MAP_REDUCE, scriptId: 'customscript_reallocation_process_ops_mr' }).submit();
    };
    /** Return the sum of the given object property */
    function sumProp(obj, prop) {
        return obj.reduce(function (prev, cur) {
            return prev + cur[prop];
        }, 0);
    }
    /* Get the latest "created" date for the given PO Window */
    function getLatest(arr) {
        var latestIndex = 0;
        var max = new Date(0);
        if (typeof arr != 'undefined') {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].created > max && Number(arr[i].priority) <= 0) {
                    max = arr[i].created;
                    latestIndex = i;
                }
            }
        }
        return latestIndex;
    }
    function distributeDemandInSortedPOWindow(poWindows, i) {
        log.debug("Analyzing PO Window " + i, "Date: " + poWindows[i].date + ", Quantity: " + poWindows[i].quantity);
        var poDemand = sumProp(poWindows[i].demand, 'quantity');
        var poCommitted = sumProp(poWindows[i].demand, 'committed');
        var poOnOrder = poWindows[i].quantity;
        var poDeficit = poDemand - poCommitted - poOnOrder;
        log.debug("Analyzing PO Window " + i + " Demand", "PO Demand " + poDemand + ", PO Commitment " + poCommitted + ", PO Deficit " + poDeficit);
        // If there's a deficit in this PO Window
        if (poDeficit > 0) {
            log.debug("PO Window Deficit found", "PO Window " + i + ", PO Window Deficit " + poDeficit);
            // For each SO line in this PO window, while there is a PO deficit
            for (var j = 0; j < poWindows[i].demand.length && poDeficit > 0; j++) {
                var lineDeficit = poWindows[i].demand[j].quantity - poWindows[i].demand[j].committed;
                log.debug("Checking Line Deficit", "PO Window " + i + ", Demand Line " + j + ", Demand Line Deficit " + lineDeficit);
                if (lineDeficit > 0) { // Else, if the uncommitted pool is less than or equal to the demand line deficit
                    // log.debug("Checking future inventory", "");
                    // For each future PO Window, starting at the end, if there is still a line deficit
                    for (var k = poWindows.length - 1; k >= i && lineDeficit > 0; k--) {
                        if (poWindows[k].demand.length <= 0)
                            continue;
                        log.debug("Checking Future PO Window", k);
                        log.debug("Demand Line Deficit", lineDeficit);
                        // For each SO line in the future PO that has committed inventory, while there is still a line deficit
                        for (var l = poWindows[k].demand.length - 1; lineDeficit > 0 && l >= 0; l--) {
                            // if we're in the same PO window, stop when if you get to the current demand line!
                            if (i == k && j == l)
                                break;
                            if (poWindows[k].demand[l].committed <= 0)
                                continue;
                            log.debug("PO Window " + k + " Line " + l + " committed:", poWindows[k].demand[l].committed);
                            // If the future line's committed quantity is greater than or equal to the demand line's deficit,
                            var quantityToReallocate = Math.min(poWindows[k].demand[l].committed, lineDeficit);
                            log.debug('quantityToReallocate', quantityToReallocate);
                            // Sanity check. This shouldn't happen
                            if (quantityToReallocate <= 0)
                                continue;
                            // Subract the demand line deficit from the future line committed
                            poWindows[k].demand[l].committed -= quantityToReallocate;
                            // Set the future line to do decommit during reduce
                            poWindows[k].demand[l].doDecommit = true;
                            poWindows[k].demand[l].doRecommit = true;
                            poWindows[k].demand[l].doUpdateFillRate = true;
                            // Add the demand line deficit to the demand line committed
                            poWindows[i].demand[j].committed += quantityToReallocate;
                            poWindows[i].demand[j].doUpdateFillRate = true;
                            // Set the current line to recommit during reduce
                            poWindows[i].demand[j].doDecommit = true;
                            poWindows[i].demand[j].doRecommit = true;
                            poWindows[i].demand[j].doUpdateFillRate = true;
                            // Update our total deficit counts
                            if (i != k) {
                                poDeficit -= quantityToReallocate;
                            }
                            lineDeficit -= quantityToReallocate;
                        }
                    }
                }
            }
            log.debug("PO Window after reallocation", poWindows[i]);
        }
    }
    /** Idenfity PO Windows with deficits. For each window with a deficit, move the latest order to the last PO Window. */
    function sortPODemand(poWindows) {
        var totalDemand = 0;
        var totalCommitted = 0;
        var onOrder = 0;
        //let unCommitted = 0;
        for (var i = 0; i < poWindows.length; i++) {
            totalDemand += sumProp(poWindows[i].demand, 'quantity');
            totalCommitted += sumProp(poWindows[i].demand, 'committed');
            onOrder += poWindows[i].quantity;
        }
        var totalDeficit = totalDemand - totalCommitted - onOrder;
        log.debug("Initial Totals", "Demand: " + totalDemand + ", Committed: " + totalCommitted + ", Available/On Order: " + onOrder + ", Deficit: " + totalDeficit + ", PO Windows: " + poWindows.length);
        for (var i = 0; i < poWindows.length - 1; i++) {
            // For each PO Window except for the final one, starting at the beginning...
            // Sort by priority and date each time we go through the iteration
            poWindows[i].demand = poWindows[i].demand.sort(sortByPriorityAndDate);
        }
        if (poWindows.length > 2) { //If there are PO windows
            if (totalDeficit > 0) { //If there are PO windows and there is a total deficit
                // For each PO Window except for the final one, starting at the beginning...
                while (totalDeficit > 0) {
                    // We need to find the latest order regardless of PO Window
                    // Make an array of latest demand lines for each PO window, each containing the address in the overall poWindows array
                    // Get the latest in this array
                    // move the latest overall into the final PO window
                    // Sort the final PO window by priority, original PO window, and created date
                    var latestLines = [];
                    var linesIndex = [];
                    var target = poWindows.length - 1;
                    for (var i_1 = 0; i_1 < poWindows.length - 1; i_1++) {
                        var source_1 = getLatest(poWindows[i_1].demand);
                        latestLines.push(poWindows[i_1].demand[source_1]);
                        linesIndex.push({ i: i_1, source: source_1 });
                    }
                    var latestIndex = getLatest(latestLines);
                    var _a = linesIndex[latestIndex], i = _a.i, source = _a.source;
                    var quantityToPushOut = poWindows[i].demand[source].quantity;
                    log.debug('Pushing out line quantity', { poWindow: i, demandLine: source, quantityToPushOut: quantityToPushOut, line: poWindows[i].demand[source] });
                    totalDeficit -= quantityToPushOut;
                    poWindows[i].demand[source].committed = 0;
                    poWindows[i].demand[source].doDecommit = true;
                    poWindows[i].demand[source].doRecommit = true;
                    poWindows[i].demand[source].doUpdateFillRate = true;
                    poWindows[i].demand[source].poWindow = target;
                    poWindows[target].demand.push(poWindows[i].demand[source]);
                    // Delete the original and clean out the null value left behind
                    delete poWindows[i].demand[source];
                    poWindows[i].demand = poWindows[i].demand.filter(function (n) { return n; });
                }
                poWindows[poWindows.length - 1].demand = poWindows[poWindows.length - 1].demand.sort(sortByPriorityAndDate);
                // } else { //If there are PO windows and there is no overall deficit
            } // End if there is an overall deficit
        }
        else { //If there are no PO windows
            // If there is no future PO, sort by priority, then by created date
            log.debug("No PO Windows found", poWindows);
            // Starting at the end of the list, decommit order lines until there is no longer a deficit
            for (var i = poWindows[0].demand.length - 1; totalDeficit > 0 && i >= 0; i--) {
                //log.debug(`Checking Index ${i}`, poWindows[0].demand[i]);
                totalDeficit -= poWindows[0].demand[i].quantity;
                poWindows[0].demand[i].doDecommit = true;
                poWindows[0].demand[i].doRecommit = true;
                poWindows[0].demand[i].doUpdateFillRate = true;
                //log.debug("Total Remaining Deficit", totalDeficit);
            }
        }
        for (var i = 0; i < poWindows.length - 1; i++) {
            distributeDemandInSortedPOWindow(poWindows, i);
        }
        return poWindows;
    }
    /** Sort the orders so that they'll be in priority order, so as we save them (in this order) the commitments will be applied to the preferred orders first. */
    function redistributeDemand(demand, itemDetails) {
        log.audit('Demand before sort', JSON.stringify(demand));
        try {
            // If at any point there is a deficit in the second PO window, move the last created SO to the end of the line.
            // Define an initial starting quantity
            var today = format.format({ type: format.Type.DATE, value: new Date() });
            // Need to check item availability for PO windows. If an order's demand can't be met in a window, need to bump it to the next window and retry
            //log.debug("test", itemDetails.quantity);
            // Initialize PO Windows data store
            var poWindows = [{
                    item: itemDetails.item,
                    date: today,
                    quantity: itemDetails.quantity.available || 0,
                    demand: []
                }];
            // Add any known PO Windows
            for (var poDate in itemDetails.poDates) {
                //log.debug("PO Date", poDate);
                poWindows.push({ item: itemDetails.item, date: poDate, quantity: itemDetails.poDates[poDate] || 0, demand: [] });
            }
            // Add an empty "future" PO Window to catch any demand that gets pushed off the end of the list.
            poWindows.push({ item: itemDetails.item, date: "12/31/9999", quantity: 0, demand: [] });
            var _loop_1 = function (i) {
                /*log.debug(`PO Window ${i}`, demand.filter(obj => {
                    return obj.poWindow === i
                }));*/
                poWindows[i].demand = demand.filter(function (obj) {
                    return obj.poWindow === i;
                });
            };
            // Populate demand for each PO window
            for (var i = 0; i < poWindows.length; i++) {
                _loop_1(i);
            }
            log.debug({
                title: "PO Windows before sort",
                details: poWindows.map(function (poWindow) {
                    return __assign({}, poWindow, { demand: "<Array of " + poWindow.demand.length + " Demand Objects>" });
                })
            });
            // Sort all demand lines causing a deficit into a "future" PO window.
            poWindows = sortPODemand(poWindows);
            // Sort all Sales Order item lines (in the "future" PO Window) by priority, then by PO Window, then by “created date”
            var newDemand = [];
            log.audit('redistributeDemand', "PO Windows: " + JSON.stringify(poWindows) + ".");
            for (var i = 0; i < poWindows.length; i++) {
                poWindows[i].demand = poWindows[i].demand.sort(sortByPriorityAndDate);
                for (var j = 0; j < poWindows[i].demand.length; j++) {
                    if (typeof poWindows[i].demand[j] == "object")
                        newDemand.push(poWindows[i].demand[j]);
                }
            }
            log.debug("Sorted PO Windows", newDemand);
            return newDemand;
        }
        catch (e) {
            log.error("Error redistributing demand", e);
        }
    }
    /** Compares demands A and B to determine which comes first.
     * A value of 1 means A sorts toward the start of the list.
     * A value of -1 sorts A toward the end.
     * A value of 0 indicates no change.
     */
    function sortByPriorityAndDate(demandA, demandB) {
        //log.debug("sortByPriorityAndDate", `A.poWindow ${JSON.stringify(demandA.poWindow)},B.poWindow ${JSON.stringify(demandB.poWindow)}`);
        var sortValue = 0;
        if (typeof demandA != 'undefined' && typeof demandB != 'undefined') {
            if (demandA.priority) { // If A has a priority...
                if (demandB.priority) { // AND if B HAS a priority...
                    if (demandA.priority < demandB.priority)
                        sortValue = -1; // If A is lower, sort it toward the start
                    else if (demandB.priority < demandA.priority)
                        sortValue = 1; // if A is higher, sort it toward the end
                    else if (demandA.created.getTime() < demandB.created.getTime())
                        sortValue = -1; // If both are the same, sort by created time
                    else if (demandA.created.getTime() > demandB.created.getTime())
                        sortValue = 1;
                }
                else { // Else, B has NO priority
                    sortValue = -1;
                }
            }
            else if (demandB.priority) { // Else if only B has a priority
                sortValue = 1;
            }
            else { // Else neither has a priority...
                // Origin PO Window is the same
                if (demandA.created.getTime() < demandB.created.getTime())
                    sortValue = -1;
                else if (demandA.created.getTime() > demandB.created.getTime())
                    sortValue = 1;
            }
            //log.debug('Sorting', `${sortValue} A: ${JSON.stringify(demandA)} B: ${JSON.stringify(demandB)}`);
        }
        return sortValue;
    }
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
    function getATPDetails(newCommitments) {
        var itemIds = [];
        var locationIds = [];
        newCommitments.forEach(function (commitment) {
            if (!~itemIds.indexOf(commitment.item))
                itemIds.push(commitment.item);
            if (!~locationIds.indexOf(commitment.item))
                locationIds.push(commitment.locationId);
        });
        if (itemIds.length > 0)
            search.create({
                type: 'customrecord_atpsnapshot',
                filters: [
                    ['isinactive', 'is', 'F'], 'and',
                    ['custrecord_atpsnapshot_item', 'anyof', itemIds], 'and',
                    ['custrecord_atpsnapshot_location', 'anyof', locationIds]
                ],
                columns: [
                    'custrecord_atpsnapshot_date',
                    'custrecord_atpsnapshot_item',
                    'custrecord_atpsnapshot_location',
                    'custrecord_atpsnapshot_balance',
                    'custrecord_atpsnapshot_available',
                    'custrecord_atpsnapshot_supply'
                ]
            }).run().each(function (result) {
                var date = result.getValue('custrecord_atpsnapshot_date');
                var item = result.getValue('custrecord_atpsnapshot_item');
                var locationId = result.getValue('custrecord_atpsnapshot_location');
                var supply = result.getValue('custrecord_atpsnapshot_supply');
                // const available  = result.getValue('custrecord_atpsnapshot_available') as string;
                var idx = findObjectElementIndex(newCommitments, { item: item, locationId: locationId });
                if (~idx && ~newCommitments[idx].poDates[date])
                    newCommitments[idx].atpDetails.push({
                        date: date,
                        atp: Number(supply)
                    });
                return true;
            });
        return newCommitments;
    }
    function getItemLocationQuantity(newCommitments) {
        //log.debug("getItemLocationQuantity", newCommitments);
        var itemLocFilters = [];
        // Sort by location so we can have fewer filters
        var itemsByLocation = {};
        for (var _i = 0, newCommitments_2 = newCommitments; _i < newCommitments_2.length; _i++) {
            var commitment = newCommitments_2[_i];
            if (!itemsByLocation[commitment.locationId])
                itemsByLocation[commitment.locationId] = [];
            itemsByLocation[commitment.locationId].push(commitment.item);
        }
        //log.debug('Items by location', JSON.stringify(itemsByLocation));
        for (var locationId in itemsByLocation) {
            if (itemLocFilters.length > 0)
                itemLocFilters.push('or');
            itemLocFilters.push([['inventorylocation', 'anyof', locationId], 'and', ['internalidnumber', 'equalto', itemsByLocation[locationId]]]);
        }
        if (itemLocFilters.length > 0)
            search.create({
                type: "item",
                filters: [itemLocFilters],
                columns: [
                    "internalid",
                    "inventorylocation",
                    "locationquantityonhand",
                    "locationquantityavailable",
                    "locationquantitycommitted",
                    "locationquantityonorder"
                ]
            }).run().each(function (result) {
                log.debug("Item Location Search Result", result);
                var item = result.getValue('internalid');
                var locationId = result.getValue('inventorylocation');
                // const locationquantityavailable = Number(result.getValue('locationquantityonhand') as string);
                var locationquantityavailable = Number(result.getValue('locationquantityavailable'));
                var locationquantitycommitted = Number(result.getValue('locationquantitycommitted'));
                var locationquantityonorder = Number(result.getValue('locationquantityonorder'));
                var idx = findObjectElementIndex(newCommitments, { item: item, locationId: locationId });
                // Store quantity for this PO Window
                //log.debug("Quantity for index", `${idx}: ${locationquantityavailable}, ${locationquantitycommitted}, ${locationquantityonorder}`);
                if (~idx) {
                    newCommitments[idx].quantity = {
                        available: locationquantityavailable || 0,
                        committed: locationquantitycommitted || 0,
                        onorder: locationquantityonorder || 0
                    };
                }
                return true;
            });
        //log.debug("getItemLocationQuantity Output", newCommitments);
        return newCommitments;
    }
    function getPOWindows(newCommitments) {
        // First add in the current date as a PO Date, since we'll always have an ATP here
        var itemLocFilters = [];
        // Sort by location so we can have fewer filters
        var itemsByLocation = {};
        for (var _i = 0, newCommitments_3 = newCommitments; _i < newCommitments_3.length; _i++) {
            var commitment = newCommitments_3[_i];
            if (!itemsByLocation[commitment.locationId])
                itemsByLocation[commitment.locationId] = [];
            itemsByLocation[commitment.locationId].push(commitment.item);
        }
        //log.debug('Items by location', JSON.stringify(itemsByLocation));
        for (var locationId in itemsByLocation) {
            if (itemLocFilters.length > 0)
                itemLocFilters.push('or');
            itemLocFilters.push([['location', 'anyof', locationId], 'and', ['item', 'anyof', itemsByLocation[locationId]]]);
        }
        if (itemLocFilters.length > 0) {
            var pageData_2 = search
                .create({
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
                    search.createColumn({ name: 'expectedreceiptdate', sort: search.Sort.ASC }),
                    search.createColumn({ name: "formulanumeric", formula: "{quantity} - {quantityshiprecv}" })
                ]
            }).runPaged({ pageSize: 1000 });
            pageData_2
                .pageRanges
                .map(function (pageRange) { return pageData_2.fetch({ index: pageRange.index }); })
                .reduce(function (results, page) { return results.concat(page.data); }, [])
                .forEach(function (result) {
                var item = result.getValue('item');
                var locationId = result.getValue('location');
                var dateExpected = result.getValue('expectedreceiptdate');
                var idx = findObjectElementIndex(newCommitments, { item: item, locationId: locationId });
                if (dateExpected && ~idx) {
                    if (typeof newCommitments[idx].poDates[dateExpected] == 'undefined')
                        newCommitments[idx].poDates[dateExpected] = 0;
                    newCommitments[idx].poDates[dateExpected] += Number(result.getValue('formulanumeric'));
                }
            });
        }
        return newCommitments;
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
    /** Read time last run */
    function getLastRunTime(addAMinute) {
        var pacificDate = runtime.getCurrentScript().getParameter({ name: 'custscript_reallocation_lastrun' });
        if (addAMinute)
            pacificDate = new Date(pacificDate.getTime() + 60 * 1000);
        var lastRunEast = format.format({ type: format.Type.DATETIME, value: pacificDate });
        var dateTime = lastRunEast.split(' ');
        var timeSplit = dateTime[1].split(':');
        // Format the last run time for use as a search filter. Basically just cut the seconds out of the end of the string.
        return dateTime[0] + " " + timeSplit[0] + ":" + timeSplit[1] + " " + dateTime[2];
    }
    function getAllResults(searchObj) {
        var pageData = searchObj.runPaged({ pageSize: 1000 });
        var results = pageData.pageRanges
            .map(function (pageRange) { return pageData.fetch({ index: pageRange.index }); })
            .reduce(function (results, page) { return results.concat(page.data); }, []);
        log.audit('getAllResults() paged', "Search type: " + searchObj.searchType + "; Results: " + results.length + "; Usage left: " + runtime.getCurrentScript().getRemainingUsage() + ".");
        return results;
    }
    return exports;
});
