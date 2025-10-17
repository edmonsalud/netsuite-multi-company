/**
 * quickContractorsAPI.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Quick Conctractors API
 * @NApiVersion 2.1
 */
define(["N/email", "N/format", "N/https", "N/log", "N/record", "N/runtime", "N/url"], function (email, format, https, log, record, runtime, url) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getUpdate = exports.addJobFromSalesOrder = void 0;
    function addJobFromSalesOrder(salesOrderRecordID) {
        log.debug('addJobFromSalesOrder', `Loading sales order ${salesOrderRecordID} at ${new Date()}.`);
        const salesOrderRecord = record.load({ type: record.Type.SALES_ORDER, id: salesOrderRecordID });
        const customerRecord = record.load({ type: record.Type.CUSTOMER, id: salesOrderRecord.getValue('entity') });
        const payload = buildAddJobPayload(salesOrderRecord, customerRecord);
        let responseBody;
        if (runtime.envType == runtime.EnvType.PRODUCTION) { // [GOBASD-24] Only do this API call in production
            const resp = https.post({
                headers: { 'API_KEY': '9b906392-9e9c-11ec-b909-0242ac120002', 'Content-Type': 'application/json' },
                //url: 'https://playapi.quickcontractors.com/api/ManageJob/AddJob', //sandbox URL
                url: 'https://api.quickcontractors.com/api/ManageJob/AddJob',
                body: JSON.stringify(payload)
            });
            responseBody = resp.body;
        }
        else {
            const fakeResponse = { message: 'Simulated sandbox response', isSuccess: false, statusCode: 201, jobId: '12345' };
            responseBody = JSON.stringify(fakeResponse);
        }
        try {
            const body = JSON.parse(responseBody); // Example from 24 June 2023 does not have jobs property.
            log.debug('addJobFromSalesOrder', { body });
            const hasJobID = ((body.jobs && body.jobs.length > 0) || (body.jobId && body.jobId.length > 0));
            const jobID = body.jobs && body.jobs.length > 0 ? body[0].jobId : (body.jobId && body.jobId.length > 0) ? body.jobId : 0;
            if (body.isSuccess && hasJobID) {
                record.submitFields({
                    type: record.Type.SALES_ORDER,
                    id: salesOrderRecord.id,
                    values: { custbody_3rd_party_job_id: jobID, custbody_3rd_party_status: 2 }
                });
                log.debug('addJobFromSalesOrder', `Updated sales order ${salesOrderRecordID} with 3rd party job ID ${jobID} and 3rd party status 2.`);
                return JSON.stringify(body);
            }
            else if (body.errors) {
                let message = `Sales order internalid ${salesOrderRecordID} got an error back from the QuickContractors API.`;
                for (const error of body.errors) {
                    message += `\n${body.errors[error]}`;
                }
                message += `<a href="${url.resolveRecord({ recordType: 'salesorder', recordId: salesOrderRecordID })}">View Sales Order</a>`;
                email.send({
                    author: 1498785,
                    recipients: [577528, 1498785],
                    subject: `Process Failed When Sending to QuickContractors`,
                    body: message
                });
            }
            return responseBody;
        }
        catch (e) {
            log.error('addJobFromSalesOrder', e);
            email.send({
                author: 1498785,
                recipients: [577528],
                subject: `Process Failed When Sending to QuickContractors: Body was malformed on SO ID ${salesOrderRecordID}`,
                body: responseBody
            });
            return JSON.stringify({ malformedBody: responseBody });
        }
    }
    exports.addJobFromSalesOrder = addJobFromSalesOrder;
    function buildAddJobPayload(salesOrderRecord, customerRecord) {
        const shippingSubRecord = salesOrderRecord.getSubrecord({ fieldId: 'shippingaddress' });
        const payload = {
            CustomerInfo: `${customerRecord.getValue('firstname')} ${customerRecord.getValue('lastname')}`,
            CustomerHomePhone: customerRecord.getValue('phone'),
            CustomerAlternatePhone: customerRecord.getValue('altphone'),
            CustomerMobilePhone: customerRecord.getValue('mobilephone'),
            CustomerEmail: customerRecord.getValue('email'),
            CustomerAddress1: shippingSubRecord.getValue({ fieldId: 'addr1' }),
            CustomerAddress2: shippingSubRecord.getValue({ fieldId: 'addr2' }),
            SuitNumber: "",
            CustomerPostalCode: shippingSubRecord.getValue({ fieldId: 'zip' }),
            CustomerCity: shippingSubRecord.getValue({ fieldId: 'city' }),
            CustomerProvince: shippingSubRecord.getValue({ fieldId: 'state' }),
            CustomerCountry: shippingSubRecord.getText({ fieldId: 'country' }),
            SourceCompanyName: "Spring Free Trampoline",
            TicketNumber: salesOrderRecord.id,
            OrderNumber: salesOrderRecord.getValue('tranid'),
            /*"PermitNumber": "1119",
            "ModelNumber": "1119",
            "Make": "1119",
            "SerialNumber": "1119",*/
            Products: [],
            AdditionalInstructions: salesOrderRecord.getValue('custbody_3rd_party_notes'),
            InstallerReassemblyAddress: salesOrderRecord.getValue('custbody_3rd_party_add_2'),
            InstallerReassemblyCity: salesOrderRecord.getValue('custbody_3rd_party_add_city'),
            InstallerReassemblyState: salesOrderRecord.getValue('custbody_3rd_party_add_state'),
            InstallerReassemblyZip: salesOrderRecord.getValue('custbody_3rd_party_add_zip') // [GOBASD-24]
        };
        let hasO200 = false;
        for (let line = 0; line < salesOrderRecord.getLineCount({ sublistId: 'item' }); line++) {
            const itemType = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line });
            const item = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line });
            const Quantity = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line });
            log.debug('buildAddJobPayload', `Line ${line} item ${item} type ${itemType} quantity ${Quantity}, hasO200 ${hasO200}.`);
            if (hasO200 || (itemType != 'Service' && item != '114997'))
                continue; // [GOBASD-24] Only send service items or the O200 item (but not Service items for O200)
            if (item == '114997')
                hasO200 = true; // [GOBASD-24] We don't want to send service lines if there is an O200
            payload.Products.push({ ProductCode: item, Quantity, ExtraInstructions: "" });
        }
        log.debug('buildAddJobPayload', payload);
        return payload;
    }
    function getUpdate(jobid, orderid, currentStatus) {
        log.debug('getUpdate', `job id ${jobid}, orderid ${orderid}, currentStatus ${currentStatus}.`);
        let body = { isSuccess: false, jobs: [] }; // Use this response in sandbox.
        if (runtime.envType == runtime.EnvType.PRODUCTION) { // Don't do this in non-production
            let resp = { code: 0, body: '', headers: {} };
            try { // [Goba-29]
                resp = https.post({
                    headers: { 'API_KEY': '9b906392-9e9c-11ec-b909-0242ac120002', 'Content-Type': 'application/json' },
                    url: 'https://api.quickcontractors.com/api/ManageJob/get_update',
                    body: JSON.stringify({ JobID: jobid })
                });
                log.debug('getUpdate', `Response ${resp.code}: ${resp.body}`);
            }
            catch (e) { // Timeout?
                log.error('getUpdate', `POST Failed: ${e.message}`);
            }
            if (resp.code == 200)
                body = JSON.parse(resp.body); // It is 200 whether there are jobs or no jobs. A 500 response has no content and is not parsable.
        }
        const updateValues = {};
        if (body.isSuccess && body.jobs && body.jobs.length > 0) {
            if (body.jobs.length > 1) {
            }
            else {
                const installDate = body.jobs[0].intendedInstallDate;
                const bookedDate = body.jobs[0].bookedDate;
                //const invoiceAmount = body.jobs[0].invoiceAmount;
                //const retailCost = body.jobs[0].retailCost;
                //const trackingURL = body.jobs[0].trackingURL;
                const jobCompletionDate = body.jobs[0].jobCompletionDate;
                //const financialReview = body.jobs[0].financialReview; // && financialReview != 'Pending'
                const jobStatus = body.jobs[0].jobStatus;
                updateValues['custbody_3rd_party_update_timestamp'] = format.format({ value: new Date(), type: format.Type.DATE });
                if (jobStatus != 'Unassigned') {
                    if (bookedDate != '1900-01-01T00:00:00' && bookedDate != '0001-01-01T00:00:00' && currentStatus != '4') {
                        updateValues['custbody_3rd_party_status'] = '4'; // third party has scheduled
                        updateValues['custbody_3rd_party_scheduled_date'] = format.format({ value: new Date(bookedDate), type: format.Type.DATE });
                        updateValues['custbody_3rd_party_install_time'] = bookedDate;
                    }
                    if (installDate != '1900-01-01T00:00:00' && installDate != '0001-01-01T00:00:00' && currentStatus != '4') {
                        updateValues['custbody_3rd_party_status'] = '4'; // third party has scheduled
                        updateValues['custbody_3rd_party_scheduled_date'] = format.format({ value: new Date(bookedDate), type: format.Type.DATE });
                        updateValues['custbody_3rd_party_install_time'] = installDate;
                    }
                    if (jobCompletionDate != '1900-01-01T00:00:00' && jobCompletionDate != '0001-01-01T00:00:00') {
                        updateValues['custbody_3rd_party_status'] = '3'; // service completed
                    }
                }
            }
            log.debug('getUpdate', `Updating sales order ${orderid} with values: ${JSON.stringify(updateValues)}.`);
            try {
                record.submitFields({ type: record.Type.SALES_ORDER, id: orderid, values: updateValues });
                log.debug(`getUpdate`, `Sales order ${orderid} updated at ${new Date()}.`);
            }
            catch (e) {
                log.error('getUpdate', e);
            }
        }
        else {
            log.debug('getUpdate', `job id ${jobid} for sales order id ${orderid} current status ${currentStatus} - no jobs returned from API`);
        }
    }
    exports.getUpdate = getUpdate;
    return exports;
});
