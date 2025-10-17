/**
 * reallocationProcessOperationSetsMapReduce.ts
 * by Head in the Cloud Development
 *
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType MapReduceScript
 */
define(["N/log", "N/record", "N/runtime", "N/search", "N/task"], function (log, record, runtime, search, task) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.config = { retryCount: 3 };
    exports.getInputData = function (ctx) {
        var mapObjects = exports.doGetInputData(ctx);
        log.audit("getInputData", "Processing " + mapObjects.length + " operations");
        return mapObjects;
    };
    exports.doGetInputData = function (ctx) {
        var alreadyRunningMRSearch = search.create({
            type: "scheduledscriptinstance",
            filters: [
                ["script.scriptid", "is", "customscript_reallocation_process_ops_mr"], "AND",
                ["scriptdeployment.scriptid", "isnot", runtime.getCurrentScript().deploymentId], "AND",
                ["status", "anyof", "PENDING", "PROCESSING", "RETRY"]
            ]
        });
        var mrAlreadyRunning = alreadyRunningMRSearch.runPaged().count > 0;
        if (mrAlreadyRunning) {
            log.debug("Script already running", "Exiting early.");
            return [];
        }
        // Only process a single operation set at a time.
        var results = search.create({
            type: 'customrecord_ros',
            filters: [['custrecord_ros_status', 'noneof', ROSStatus.Complete]],
            columns: [
                search.createColumn({ name: 'internalid', sort: search.Sort.ASC }),
                'custrecord_ros_status',
                'custrecord_ros_decommits',
                'custrecord_ros_recommits_all',
                'custrecord_ros_recommits_part',
                'custrecord_ros_recommits_none',
                'custrecord_ros_update_fill_rates',
                'custrecord_ros_lastrun',
            ]
        }).run().getRange({ start: 0, end: 1 });
        if (!results || results.length == 0)
            return [];
        var status = Number(results[0].getValue('custrecord_ros_status'));
        switch (status) {
            case ROSStatus.Pending:
                record.submitFields({ type: 'customrecord_ros', id: results[0].id, values: { custrecord_ros_status: ROSStatus.Decommitting } });
                var decommitStr = results[0].getValue('custrecord_ros_decommits');
                var decommits_1 = JSON.parse(decommitStr);
                var decommitActions = Object.keys(decommits_1).map(function (orderId) { return ({ action: DECOMMIT, orderId: orderId, lines: decommits_1[orderId] }); });
                if (decommitActions.length > 0)
                    return decommitActions;
            // Fall through...
            case ROSStatus.Decommitting:
                record.submitFields({ type: 'customrecord_ros', id: results[0].id, values: { custrecord_ros_status: ROSStatus.RecommittingAll } });
                var recommitAllStr = results[0].getValue('custrecord_ros_recommits_all');
                var recommitsAll_1 = JSON.parse(recommitAllStr);
                var recommitAllActions = Object.keys(recommitsAll_1).map(function (orderId) { return ({ action: RECOMMIT_ALL, orderId: orderId, lines: recommitsAll_1[orderId] }); });
                if (recommitAllActions.length > 0)
                    return recommitAllActions;
            // Fall through...
            case ROSStatus.RecommittingAll:
                record.submitFields({ type: 'customrecord_ros', id: results[0].id, values: { custrecord_ros_status: ROSStatus.RecommittingPartial } });
                var recommitPartialStr = results[0].getValue('custrecord_ros_recommits_part');
                var recommitsPartial_1 = JSON.parse(recommitPartialStr);
                var recommitPartialActions = Object.keys(recommitsPartial_1).map(function (orderId) { return ({ action: RECOMMIT_PARTIAL, orderId: orderId, lines: recommitsPartial_1[orderId] }); });
                if (recommitPartialActions.length > 0)
                    return recommitPartialActions;
            // Fall through...
            case ROSStatus.RecommittingPartial:
                record.submitFields({ type: 'customrecord_ros', id: results[0].id, values: { custrecord_ros_status: ROSStatus.RecommittingNone } });
                var recommitNoneStr = results[0].getValue('custrecord_ros_recommits_none');
                var recommitsNone_1 = JSON.parse(recommitNoneStr);
                var recommitNoneActions = Object.keys(recommitsNone_1).map(function (orderId) { return ({ action: RECOMMIT_NONE, orderId: orderId, lines: recommitsNone_1[orderId] }); });
                if (recommitNoneActions.length > 0)
                    return recommitNoneActions;
            // Fall through...
            case ROSStatus.RecommittingNone:
                record.submitFields({ type: 'customrecord_ros', id: results[0].id, values: { custrecord_ros_status: ROSStatus.UpdatingFillRates } });
                var updateFillRatesStr = results[0].getValue('custrecord_ros_update_fill_rates');
                var updateFillRates = JSON.parse(updateFillRatesStr);
                var updateFillRatesActions = updateFillRates.map(function (orderId) { return ({ action: UPDATE_FILL_RATES, orderId: orderId }); });
                if (updateFillRatesActions.length > 0)
                    return updateFillRatesActions;
            // Fall through...
            case ROSStatus.UpdatingFillRates:
                record.submitFields({ type: 'customrecord_ros', id: results[0].id, values: { custrecord_ros_status: ROSStatus.UncheckingRunReallocationScript } });
                var lastRunTime = results[0].getValue('custrecord_ros_lastrun');
                var dateTime = lastRunTime.split(' ');
                var timeSplit = dateTime[1].split(':');
                // Format the last run time for use as a search filter. Basically just cut the seconds out of the end of the string.
                lastRunTime = dateTime[0] + " " + timeSplit[0] + ":" + timeSplit[1] + " " + dateTime[2];
                log.debug('Updating Fill Rates', "Checking for orders modified at or before " + lastRunTime + ".");
                var pageData_1 = search.create({
                    type: 'salesorder',
                    filters: [['mainline', 'is', 'T'], 'and', ['custbody_runreallocationscript', 'is', 'T'], 'and', ['lastmodifieddate', 'notafter', lastRunTime]],
                    columns: ['lastmodifieddate']
                }).runPaged({ pageSize: 1000 });
                var uncheckRunReallactionScriptActions = pageData_1
                    .pageRanges
                    .map(function (pageRange) { return pageData_1.fetch({ index: pageRange.index }); })
                    .reduce(function (results, page) { return results.concat(page.data); }, [])
                    .map(function (result) { return ({
                    action: UNCHECK_RUN_REALLOCATION_SCRIPT,
                    orderId: result.id,
                    lastModifiedDate: result.getValue('lastmodifieddate')
                }); });
                if (uncheckRunReallactionScriptActions.length > 0)
                    return uncheckRunReallactionScriptActions;
            // Fall through...
            case ROSStatus.UncheckingRunReallocationScript:
                record.submitFields({ type: 'customrecord_ros', id: results[0].id, values: { custrecord_ros_status: ROSStatus.Complete } });
                var shouldReRunReallocation = search.create({ type: 'salesorder', filters: [['mainline', 'is', 'T'], 'and', ['custbody_runreallocationscript', 'is', 'T']] }).run()
                    .getRange({ start: 0, end: 1 }).length > 0;
                if (shouldReRunReallocation)
                    task.create({ taskType: task.TaskType.MAP_REDUCE, scriptId: 'customscript_reallocation_gather_reqs' }).submit();
                return [];
            default:
                throw "Unsupported ROSStatus: " + status;
        }
    };
    exports.map = function (ctx) {
        try {
            var mapObj = JSON.parse(ctx.value);
            switch (mapObj.action) {
                case DECOMMIT: {
                    log.debug('Loading Order', "Order " + mapObj.orderId + "; Lines " + JSON.stringify(mapObj.lines) + "; Action Decommit.");
                    var order_1 = record.load({ type: 'salesorder', id: mapObj.orderId, isDynamic: true });
                    mapObj.lines.forEach(function (line) {
                        order_1.selectLine({ sublistId: 'item', line: line });
                        order_1.setCurrentSublistValue({ sublistId: 'item', fieldId: 'commitinventory', value: '3' /*Do Not Commit*/ });
                        order_1.commitLine({ sublistId: 'item' });
                    });
                    order_1.save({ ignoreMandatoryFields: true });
                    log.audit('Order Saved', "Order " + mapObj.orderId + "; Lines " + JSON.stringify(mapObj.lines) + "; Action Decommit.");
                    break;
                }
                case RECOMMIT_ALL:
                case RECOMMIT_PARTIAL:
                case RECOMMIT_NONE: {
                    log.debug('Loading Order', "Order " + mapObj.orderId + "; Lines " + JSON.stringify(mapObj.lines) + "; Action Recommit.");
                    var order_2 = record.load({ type: 'salesorder', id: mapObj.orderId, isDynamic: true });
                    mapObj.lines.forEach(function (line) {
                        order_2.selectLine({ sublistId: 'item', line: line });
                        order_2.setCurrentSublistValue({ sublistId: 'item', fieldId: 'commitinventory', value: '1' /*Commit Available*/ });
                        order_2.commitLine({ sublistId: 'item' });
                    });
                    order_2.setValue('custbody_updatefillrate', true);
                    order_2.setValue('custbody_runreallocationscript', false);
                    order_2.save({ ignoreMandatoryFields: true });
                    log.audit('Order Saved', "Order " + mapObj.orderId + "; Lines " + JSON.stringify(mapObj.lines) + "; Action Recommit.");
                    break;
                }
                case UPDATE_FILL_RATES: {
                    log.debug('Loading Order', "Order " + mapObj.orderId + "; Action Update Fill Rates.");
                    var soRec = record.load({ type: 'salesorder', id: mapObj.orderId });
                    soRec.setValue('custbody_updatefillrate', true);
                    soRec.setValue('custbody_runreallocationscript', false);
                    soRec.save();
                    log.audit('Order Saved', "Order " + mapObj.orderId + "; Action Update Fill Rates.");
                    break;
                }
                case UNCHECK_RUN_REALLOCATION_SCRIPT: {
                    log.debug('Submitting Fields', "Order " + mapObj.orderId + "; Action Run Reallocation Script.");
                    record.submitFields({ type: 'salesorder', id: mapObj.orderId, values: { custbody_runreallocationscript: false } });
                    log.audit('Order Saved', "Unchecked Run Reallocation checkbox on order " + mapObj.orderId + ", last modified " + mapObj.lastModifiedDate + ".");
                    break;
                }
            }
        }
        catch (e) {
            log.error("map error", { ctx: ctx, e: e });
            throw e;
        }
        ctx.write('restart', '1');
    };
    exports.reduce = function (ctx) {
        ctx.write('restart', '1'); // If map wrote here at all, this will trigger the Gather Required Operations script to get triggered in Summarize.
    };
    exports.summarize = function (ctx) {
        ctx.output.iterator().each(function (key, value) {
            try { // [GOBA-20]
                task.create({ taskType: task.TaskType.MAP_REDUCE, scriptId: 'customscript_reallocation_process_ops_mr' }).submit();
            }
            catch (e) { // There are two deployments, if it fails to re-run its because its already running
                log.error('summarize', "Failed to re-queue this script: " + e.message);
            }
            return false;
        });
    };
    var DECOMMIT = 'DECOMMIT';
    var RECOMMIT_ALL = 'RECOMMIT_ALL';
    var RECOMMIT_PARTIAL = 'RECOMMIT_PARTIAL';
    var RECOMMIT_NONE = 'RECOMMIT_NONE';
    var UPDATE_FILL_RATES = 'UPDATE_FILL_RATES';
    var UNCHECK_RUN_REALLOCATION_SCRIPT = 'UNCHECK_RUN_REALLOCATION_SCRIPT';
    var ROSStatus;
    (function (ROSStatus) {
        ROSStatus[ROSStatus["Pending"] = 1] = "Pending";
        ROSStatus[ROSStatus["Decommitting"] = 2] = "Decommitting";
        ROSStatus[ROSStatus["RecommittingAll"] = 3] = "RecommittingAll";
        ROSStatus[ROSStatus["RecommittingPartial"] = 4] = "RecommittingPartial";
        ROSStatus[ROSStatus["RecommittingNone"] = 5] = "RecommittingNone";
        ROSStatus[ROSStatus["UpdatingFillRates"] = 6] = "UpdatingFillRates";
        ROSStatus[ROSStatus["UncheckingRunReallocationScript"] = 8] = "UncheckingRunReallocationScript";
        ROSStatus[ROSStatus["Complete"] = 7] = "Complete";
    })(ROSStatus || (ROSStatus = {}));
    return exports;
});
