/**
 * updateWebCustomers.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Update Web Customers
 * @NScriptType MapReduceScript
 * @NApiVersion 2.1
 */
define(["N/log", "N/record", "N/search", "./webOrderUtils"], function (log, record, search, webOrderUtils_1) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.summarize = exports.reduce = exports.getInputData = void 0;
    exports.getInputData = () => {
        const searchResults = mapResults('customsearch_hitc_update_web_customers'); //[SCRIPT] Update Web Customer Data
        return searchResults;
    };
    exports.reduce = (context) => {
        const valueObjs = context.values.map(v => JSON.parse(v));
        valueObjs.forEach((val) => {
            const latestSalesOrder = getLatestSalesOrder(Number(val));
            log.debug(`checking for last sales order ID for customer id ${val}`, latestSalesOrder);
            if (latestSalesOrder && latestSalesOrder > 0) {
                let customerRec = record.load({ type: record.Type.CUSTOMER, id: val, isDynamic: true });
                const newCustomer = webOrderUtils_1.isNewCustomer(customerRec);
                const salesOrderRec = record.load({ type: record.Type.SALES_ORDER, id: latestSalesOrder });
                if (newCustomer) {
                    /** If new customer, Celigo will add the shipping address to the customer
                     * So we only need to check for the billing address and if it is different add it
                     * */
                    log.debug('customer found', `process for sales order ${salesOrderRec.id} and customer id ${customerRec.id}, is new Customer? ${newCustomer}`);
                    webOrderUtils_1.checkBillingAddressAgainstShipping(salesOrderRec, customerRec);
                }
                else {
                    /**
                     * If customer is existing, check and see if there are any addresses and
                     * if not add the ones from the sales order OR
                     * check and see if the orders on the sales order are new compared with whats already on the customer record and add them if they aren’t there yet.
                     * */
                    webOrderUtils_1.updateExistingCustomerAddresses(salesOrderRec, customerRec);
                }
                try {
                    customerRec.setValue({ fieldId: 'custentity_hitc_post_processing_run', value: false });
                    const customerSaved = customerRec.save({ ignoreMandatoryFields: true });
                    log.audit(`customer ${customerSaved} was successfully updated`, `newcustomer (${newCustomer}), end!`);
                }
                catch (e) {
                    log.error('error saving customer', e);
                }
                // reload the record and set the phone
                customerRec = record.load({ type: record.Type.CUSTOMER, id: val, isDynamic: true });
                webOrderUtils_1.updatePhoneOnCustomerRecord(salesOrderRec, customerRec);
            }
            else {
                record.submitFields({ type: record.Type.CUSTOMER, id: val, values: { 'custentity_hitc_post_processing_run': false } });
            }
        });
    };
    exports.summarize = (context) => {
    };
    function mapResults(searchID) {
        const searchObj = search.load({ id: searchID });
        const pageData = searchObj.runPaged({ pageSize: 1000 });
        let results = [];
        pageData.pageRanges.forEach(function (pageRange) {
            let page = pageData.fetch({ index: pageRange.index });
            page.data.forEach(function (result) {
                results.push(result.id);
            });
        });
        return results;
    }
    function getLatestSalesOrder(customerId) {
        const searchObj = search.create({
            type: search.Type.SALES_ORDER,
            columns: [search.createColumn({ name: 'trandate', sort: search.Sort.DESC })],
            filters: [
                ['mainline', 'is', 'T'], 'and',
                ['status', 'anyof', 'SalesOrd:A', 'SalesOrd:B'], 'and',
                ['entity', 'anyof', customerId]
            ]
        });
        const orders = searchObj.run().getRange({ start: 0, end: 1 });
        return orders.length == 1 ? Number(orders[0].id) : 0;
    }
    return exports;
});
