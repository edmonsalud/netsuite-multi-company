/**
 * updateFillRatesMapReduce.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Update Fill Rates - Map/Reduce
 * @NScriptType MapReduceScript
 * @NApiVersion 2.x
 */
define(["N/log", "N/record", "N/runtime"], function (log, record, runtime) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //import search  = require('N/search');
    //import url     = require('N/url');
    exports.getInputData = function () {
        var ordersUpdated = JSON.parse(runtime.getCurrentScript().getParameter({ name: 'custscript_updatefillratesmr_ordersupdat' }));
        try {
            log.debug("Orders to Update", ordersUpdated);
            return ordersUpdated;
        }
        catch (e) {
            log.error('getInputData', "Failed to process input data - " + e.message);
        }
    };
    exports.map = function (mapContext) {
        try {
            var orderId = mapContext.value;
            log.audit('Map', "Updating Fill Rate on order " + orderId + ".");
            var soRec = record.load({ type: 'salesorder', id: orderId });
            soRec.setValue('custbody_updatefillrate', true);
            soRec.save({ ignoreMandatoryFields: true });
        }
        catch (e) {
            log.error("Error in Map", e);
        }
    };
    exports.summarize = function () {
        log.audit('summarize()', 'Execution Complete');
    };
    return exports;
});
