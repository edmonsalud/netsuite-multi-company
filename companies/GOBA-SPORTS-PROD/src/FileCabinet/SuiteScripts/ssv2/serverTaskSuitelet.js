/**
 * serverTaskSuitelet.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Server Task Suitelet
 * @NScriptType Suitelet
 * @NApiVersion 2.1
 */
define(["N/file", "N/log", "N/record", "N/search", "./QuickContractors/quickContractorsAPI"], function (file, log, record, search, quickContractorsAPI_1) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = void 0;
    function onRequest(context) {
        const mode = context.request.parameters['mode'];
        log.debug('Executing', `Mode: ${mode} at ${Date.now()} (${new Date()}).`);
        if (mode == 'invoiceSalesOrder') {
            return context.response.write(invoiceSalesOrder(context.request.parameters));
        }
        else if (mode == 'invoiceFulfillment') {
            // return context.response.write(invoiceFulfillment(context.request.parameters));
        }
        else if (mode == 'sendOrderToQuickContractors') { // [GOBASD-28]
            return context.response.write(sendOrderToQuickContractors(context.request.parameters));
        }
        if (context.request.method == 'POST') {
            if (mode == 'createFile') // [GOBASD-37]
                return context.response.write(createFile(context.request.parameters));
        }
        context.response.write('Invalid mode');
    }
    exports.onRequest = onRequest;
    function createFile(params) {
        const data = params.pdf;
        const name = params.name;
        const type = params.fileType;
        const folder = params.folder || -10; // -10 = Attachments Received
        if (!data)
            return 'No file data passed in!';
        if (!name)
            return 'No file name passed in!';
        // let fileType = file.Type.PLAINTEXT;
        // if (type == 'pdf') fileType = file.Type.PDF;
        // if (type == 'doc') fileType = file.Type.WORD;
        // if (type == 'png') fileType = file.Type.PNGIMAGE;
        // if (type == 'jpg') fileType = file.Type.JPGIMAGE;
        // if (type == 'csv') fileType = file.Type.CSV;
        const FileTypes = { 'pdf': file.Type.PDF, 'doc': file.Type.WORD, 'png': file.Type.PNGIMAGE, 'jpg': file.Type.JPGIMAGE, 'csv': file.Type.CSV };
        const fileType = FileTypes[type] || file.Type.PLAINTEXT;
        let fileId = 0;
        log.debug('createFile', `Inputs: ${JSON.stringify(params)}; type: ${type}.`);
        try {
            const fileObj = file.create({ fileType, name, contents: data, folder }); // Resumes folder (abstract this!)
            fileObj.isOnline = true;
            fileId = fileObj.save();
            log.debug('createFile', `Created file ID: ${fileId}, type ${fileType} (from type ${type}).`);
        }
        catch (e) { // [CSI-258] Probably too large (> 10MB)
            log.error('createFile', `Failed to create file: ${e.message}`);
            return '0';
        }
        return fileId ? String(fileId) : '';
    }
    function invoiceSalesOrder(params) {
        log.debug('invoiceSalesOrder', `Loading sales order ${params.orderId} at ${new Date()}.`);
        // [GOBASD-6] We only want to invoice the unfulfilled lines
        const unfulfilledItems = [];
        const unfulfilledLines = []; // These are the "line" values, which link to the "discline" value on discount lines
        let salesOrder;
        try { // [GOBA-32]
            salesOrder = record.load({ type: 'salesorder', id: params.orderId });
        }
        catch (e) { // Unexpected error?
            log.error('invoiceSalesOrder', `Failed to load sales order ${params.orderId}: ${e.message}.`);
            return `Failed to load sales order: ${e.message}.`;
        }
        for (let line = 0; line < salesOrder.getLineCount({ sublistId: 'item' }); line++) {
            const itemId = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'item', line });
            const lineNumber = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'line', line });
            const quantityFulfilled = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'quantityfulfilled', line });
            if (quantityFulfilled === 0) { // If quantity fulfilled is blank, we need to leave the line there, as it is unfulfillable
                unfulfilledItems.push(itemId);
                unfulfilledLines.push(lineNumber);
            }
        }
        let invoice;
        try {
            invoice = record.transform({ fromType: 'salesorder', fromId: Number(params.orderId), toType: 'invoice' });
        }
        catch (e) { // INVALID_INITIALIZE_REF?
            log.error('invoiceSalesOrder', `Failed to initialize invoice for order ${params.orderId}: ${e.message}`);
            return e.message;
        }
        // now.setHours(now.getHours() + 3); // Convert from pacific to eastern date. Instead, look up fulfillment date and use that
        const fulfillmentValues = search.lookupFields({ type: 'itemfulfillment', id: params.fulfillment, columns: ['trandate'] });
        log.debug('invoiceSalesOrder', `Fulfillment ${params.fulfillment} values: ${JSON.stringify(fulfillmentValues)}.`);
        invoice.setValue('trandate', new Date(fulfillmentValues.trandate)); // Comes through like "1/12/2022" (American date format)
        log.debug('invoiceSalesOrder', `Transformed order ${params.orderId}, removing unfulfilled items ${JSON.stringify(unfulfilledItems)} from invoice with ${invoice.getLineCount({ sublistId: 'item' })} lines; unfulfilledLines ${JSON.stringify(unfulfilledLines)}.`);
        unfulfilledItems.forEach((itemId) => {
            const line = invoice.findSublistLineWithValue({ sublistId: 'item', fieldId: 'item', value: itemId });
            if (~line)
                invoice.removeLine({ sublistId: 'item', line });
        });
        unfulfilledLines.forEach((value) => {
            const line = invoice.findSublistLineWithValue({ sublistId: 'item', fieldId: 'discline', value });
            if (~line)
                invoice.removeLine({ sublistId: 'item', line });
        });
        try {
            const invoiceId = invoice.save();
            log.audit('invoiceSalesOrder', `Created invoice ${invoiceId}.`);
            return String(invoiceId);
        }
        catch (e) {
            log.error('invoiceSalesOrder', e.message);
            return e.message;
        }
    }
    function sendOrderToQuickContractors(params) {
        log.debug('sendORderToQuickContractors', `Processing order ${params.orderId} at ${new Date()}.`);
        const response = (0, quickContractorsAPI_1.addJobFromSalesOrder)(Number(params.orderId));
        log.debug('sendORderToQuickContractors', `Order ${params.orderId} response: ${response}`);
        return response;
    }
    return exports;
});
