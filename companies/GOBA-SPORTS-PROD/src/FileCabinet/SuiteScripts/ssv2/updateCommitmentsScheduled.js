/**
 * updateCommitmentsScheduled.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Update Commitments - Scheduled
 * @NScriptType ScheduledScript
 * @NApiVersion 2.x
 */
define(["N/format", "N/log", "N/record", "N/runtime", "N/search"], function (format, log, record, runtime, search) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This gets triggered whenever an order is saved. Basically we need to look for recently created orders that may have a Ship Date later than this one,
     * so that if necessary we can borrow committed inventory from them for orders that ship earlier.
     */
    function execute() {
        // Read time last run
        var deploymentId = getDeploymentId();
        var testItem = runtime.getCurrentScript().getParameter({ name: 'custscript_updatecommitments_item' });
        var pacificDate = runtime.getCurrentScript().getParameter({ name: 'custscript_updatecommitments_lastrun' });
        var thisRun = format.format({ type: format.Type.DATETIME, value: new Date() }); // This will be in eastern time.
        var lastRunEast = format.format({ type: format.Type.DATETIME, value: pacificDate });
        var dateTime = lastRunEast.split(' ');
        var timeSplit = dateTime[1].split(':');
        // Format the last run time for use as a search filter. Basically just cut the seconds out of the end of the string.
        lastRunEast = dateTime[0] + " " + timeSplit[0] + ":" + timeSplit[1] + " " + dateTime[2];
        // Find order lines updated since the last time we ran this script.
        log.audit('Execution Starting', "Looking up sales orders created since " + lastRunEast + ".");
        var newCommitments = [];
        var searchId = runtime.getCurrentScript().getParameter({ name: 'custscript_updatecommitments_search' });
        var orderSearch = search.load({ id: searchId });
        var filters = orderSearch.filterExpression;
        filters.push('and', ['datecreated', 'onorafter', lastRunEast]); // These are in Eastern time)
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
                newCommitments.push({ item: item, locationId: locationId });
            return true;
        });
        newCommitments.forEach(redistributeCommitments);
        record.submitFields({ type: 'scriptdeployment', id: deploymentId, values: { custscript_updatecommitments_lastrun: thisRun } });
        log.debug('Execution Complete', 'Finished');
    }
    exports.execute = execute;
    /** Find all open orders for this item/location and redistribute inventory accordingly. */
    function redistributeCommitments(newItem) {
        var demand = [];
        var orderSearchId = runtime.getCurrentScript().getParameter({ name: 'custscript_updatecommitments_ordersearch' });
        // Find sales order lines for this item/location with qty committed with older ship dates
        var soSearch = search.load({ id: orderSearchId });
        soSearch.filterExpression = soSearch.filterExpression.concat(['and', ['item', 'anyof', newItem.item], 'and', ['location', 'anyof', newItem.locationId]]);
        // search.create({
        //   type: 'salesorder',
        //   filters: [
        //     ['mainline', 'is', 'F'], 'and',
        //     ['memorized', 'is', 'F'], 'and',
        //     ['item', 'anyof', newItem.item], 'and',
        //     ['shipdate', 'isnotempty', null], 'and',
        //     ['location', 'anyof', newItem.locationId], 'and',
        //     ['custbody_logistics_approval', 'is', 'F'], 'and',
        //     ['status', 'anyof', 'SalesOrd:B', 'SalesOrd:D', 'SalesOrd:E'], 'and',
        //     ['formulanumeric: {quantity} - {quantitypicked}', 'greaterthan', '0']
        //   ],
        //   columns: [
        //     search.createColumn({ name: 'linesequencenumber' }),
        //     search.createColumn({ name: 'quantity'           }),
        //     search.createColumn({ name: 'quantitycommitted'  }),
        //     search.createColumn({ name: 'shipdate', sort: search.Sort.ASC })
        //   ]
        soSearch.run().each(function (result) {
            var committed = Number(result.getValue('quantitycommitted'));
            var line = Number(result.getValue('linesequencenumber')) - 1; // Convert from 1-based to 0-based
            var quantity = Number(result.getValue('quantity'));
            var shipDate = format.parse({ type: format.Type.DATE, value: result.getValue('shipdate') });
            log.debug('Found order to update', "Item " + newItem.item + " Order ID " + result.id + ", Line " + line + ", Qty " + quantity + ", Ship Date " + shipDate + ".");
            demand.push({ committed: committed, line: line, shipDate: shipDate, quantity: quantity, orderId: result.id, doDecommit: false, doRecommit: false });
            return true;
        });
        // Figure out which orders need to be decommitted
        demand.sort(sortByDate).forEach(function (soLine, demandIdx) {
            var deficit = soLine.quantity - soLine.committed;
            if (deficit > 0) {
                log.debug('Deficit Found', "Item " + newItem.item + " Deficit: " + deficit + " for " + JSON.stringify(soLine) + ".");
                for (var i = demand.length - 1; deficit && i > demandIdx; i--) {
                    if (demand[i].committed > 0) {
                        log.debug('Redistributing Inventory', "Item " + newItem.item + " - found " + demand[i].committed + " on " + JSON.stringify(demand[i]) + ", applying to deficit...");
                        if (deficit > demand[i].committed) {
                            deficit -= demand[i].committed;
                            demand[i].committed = 0;
                        }
                        else {
                            demand[i].committed -= deficit;
                            deficit = 0;
                        }
                        demand[i].doDecommit = true;
                        soLine.doRecommit = true;
                    }
                }
            }
        });
        // De-commit orders that we need inventory from
        demand.forEach(function (soLine) {
            if (!soLine.doDecommit)
                return;
            log.debug('Decommiting inventory', "Item " + newItem.item + ": " + JSON.stringify(soLine));
            var soRec = record.load({ type: 'salesorder', id: soLine.orderId, isDynamic: true });
            soRec.selectLine({ sublistId: 'item', line: soLine.line });
            soRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'commitinventory', value: '3' }); // Do not commit
            soRec.commitLine({ sublistId: 'item' });
            // var timestamp = format.format({ type: format.Type.DATETIME, value: new Date() });
            soRec.setValue('custbody_datecommitmentsupdated', new Date()); // Per email from Rebecca on 15 Dec 2017
            soRec.save({ ignoreMandatoryFields: true });
            log.audit('Inventory Decommitted', "Sales Order Saved: " + JSON.stringify(soLine) + ".");
        });
        // Re-commit orders that we have new inventory for, or where we decommitted
        demand.forEach(function (soLine) {
            if (!soLine.doRecommit && !soLine.doDecommit)
                return;
            log.debug('Re-commiting inventory', "Item " + newItem.item + ": " + JSON.stringify(soLine));
            var soRec = record.load({ type: 'salesorder', id: soLine.orderId, isDynamic: true });
            soRec.selectLine({ sublistId: 'item', line: soLine.line });
            soRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'commitinventory', value: '1' }); // Commit Available
            soRec.commitLine({ sublistId: 'item' });
            // var timestamp = format.format({ type: format.Type.DATETIME, value: new Date() });
            soRec.setValue('custbody_datecommitmentsupdated', new Date()); // Per email from Rebecca on 15 Dec 2017
            soRec.save({ ignoreMandatoryFields: true });
            log.audit('Inventory Committed', "Sales Order Saved: " + JSON.stringify(soLine) + ".");
        });
    }
    function sortByDate(demandA, demandB) {
        if (demandA.shipDate.getTime() < demandB.shipDate.getTime())
            return -1;
        else if (demandA.shipDate.getTime() > demandB.shipDate.getTime())
            return 1;
        else
            return 0;
    }
    /** Gets the numerical script deployment ID */
    function getDeploymentId() {
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
