/**
 * salesOrderuncheckReallocMU.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Sales Order - Uncheck Reallocation - Mass Update
 * @NScriptType MassUpdateScript
 * @NApiVersion 2.x
 */
define(["N/log", "N/record"], function (log, record) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function each(context) {
        record.submitFields({ type: context.type, id: context.id, values: { custbody_runreallocationscript: false } });
        log.debug(context.type + " " + context.id, 'Record Updated');
    }
    exports.each = each;
    return exports;
});
