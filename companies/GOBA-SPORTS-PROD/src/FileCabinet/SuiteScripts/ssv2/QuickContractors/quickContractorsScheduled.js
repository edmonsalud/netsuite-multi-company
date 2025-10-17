/**
 * quickContractorsScheduled.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName QuickContractors - Update Job
 * @NScriptType ScheduledScript
 * @NApiVersion 2.1
 */
define(["N/log", "N/runtime", "N/search", "./quickContractorsAPI"], function (log, runtime, search, quickContractorsAPI_1) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.execute = void 0;
    function execute() {
        const savedSearchParam = runtime.getCurrentScript().getParameter({ name: 'custscript_hitc_qc_search' });
        log.debug('execute', `Starting with search parameter: ${savedSearchParam}.`);
        let searchResults;
        if (savedSearchParam && savedSearchParam.length > 0)
            searchResults = mapResults(savedSearchParam);
        else
            searchResults = mapResults('customsearch_hitc_get_jobs'); // [SCRIPT] QuickContractors - Get Jobs
        if (searchResults.length > 0) {
            for (const order of searchResults) {
                (0, quickContractorsAPI_1.getUpdate)(order.jobid, order.id, order.currentStatus);
            }
        }
        log.audit('execute', `Execution finished at ${new Date()}.`);
    }
    exports.execute = execute;
    function mapResults(searchID) {
        const searchObj = search.load({ id: searchID });
        const pageData = searchObj.runPaged({ pageSize: 1000 });
        let results = [];
        pageData.pageRanges.forEach(function (pageRange) {
            let page = pageData.fetch({ index: pageRange.index });
            page.data.forEach(function (result) {
                results.push({
                    jobid: result.getValue('custbody_3rd_party_job_id'),
                    id: result.id,
                    currentStatus: result.getValue('custbody_3rd_party_status')
                });
            });
        });
        return results;
    }
    return exports;
});
