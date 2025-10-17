/**
 * OlsenGroupIntegrationRESTlet.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Olsen Group Integration RESTlet
 * @NScriptType Restlet
 * @NApiVersion 2.1
 */
define(["N/log", "N/record"], function (log, record) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.post = void 0;
    const post = (request) => {
        try {
            log.debug({ title: 'post: request', details: request });
            const salesOrder = record.load({ type: record.Type.SALES_ORDER, id: request.transactionId });
            let scheduledDate = new Date(request.scheduledDate);
            scheduledDate.setHours(scheduledDate.getHours() + 12);
            salesOrder.setValue({ fieldId: fieldMapping.status, value: returnStatus(request.status) || salesOrder.getValue({ fieldId: 'custbody_3rd_party_status' }) });
            salesOrder.setValue({ fieldId: fieldMapping.scheduledDate, value: scheduledDate });
            salesOrder.setValue({ fieldId: fieldMapping.scheduledTime, value: request.scheduledTime });
            salesOrder.setValue({ fieldId: fieldMapping.jobId, value: request.jobId });
            salesOrder.save();
            return {
                success: true,
                message: 'Order Updated'
            };
        }
        catch (e) {
            log.error({ title: 'post', details: e });
            return {
                success: false,
                message: e.message
            };
        }
    };
    exports.post = post;
    const returnStatus = (status) => {
        switch (status) {
            case 'Scheduled':
                return 4;
            case 'Completed':
                return 3;
            default:
                return null;
        }
    };
    const fieldMapping = {
        status: 'custbody_3rd_party_status',
        scheduledDate: 'custbody_3rd_party_scheduled_date',
        scheduledTime: 'custbody_3rd_party_install_time',
        jobId: 'custbody_3rd_party_job_id'
    };
    return exports;
});
