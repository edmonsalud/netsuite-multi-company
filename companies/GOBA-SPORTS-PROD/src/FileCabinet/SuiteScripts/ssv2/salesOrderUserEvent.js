/**
 * salesOrderUserEvent.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Sales Order - User Event
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */
define(["require", "exports", "./zones/freightAndInstallZoneUtils", "N/currency", "N/format", "N/log", "N/record", "N/runtime", "N/search", "N/ui/serverWidget", "N/task", "N/https", "./zones/webOrderUtils", "./QuickContractors/quickContractorsAPI", "./customColorUtils"], function (require, exports, freightAndInstallZoneUtils_1, currency, format, log, record, runtime, search, serverWidget, task, https, webOrderUtils_1, quickContractorsAPI_1, customColorUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sendJobToQuickContractors = exports.afterSubmit = exports.beforeSubmit = exports.beforeLoad = void 0;
    // Deployed to quotes and sales orders
    function beforeLoad(context) {
        if ([context.UserEventType.CREATE, context.UserEventType.COPY].includes(context.type))
            setRecordDefaults(context.newRecord);
        const subsidiary = context.newRecord.getValue('subsidiary');
        if ([context.UserEventType.CREATE, context.UserEventType.EDIT, context.UserEventType.COPY].includes(context.type) && runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
            context.form.clientScriptModulePath = './salesOrderClient.js';
            const itemSublist = context.form.getSublist({ id: 'item' });
            itemSublist.addButton({ id: 'custpage_itemsearch', label: 'Item Search', functionName: 'itemSearchButton' });
            context.form.addField({ id: 'custpage_jqueryui', label: 'jQuery UI', type: 'inlinehtml' }).defaultValue = `
      <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js"></script>
      <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/cupertino/jquery-ui.css" />
      <style>
        .ui-dialog {
          font-size: 10pt;
          z-index: 1000 !important;
        }
        .ui-dialog-title { font-size: 11pt; }
        #item_search_results th { font-weight: bold; background-color: #eee }
        #item_search_results th, #item_search_results td {
          border-bottom: thin solid black;
          padding: 4px;
        }
      </style>
    `;
            if ((0, freightAndInstallZoneUtils_1.runInSubsidiary)(subsidiary))
                addItemsSublistButtons(itemSublist);
        }
        if ([context.UserEventType.CREATE, context.UserEventType.COPY, context.UserEventType.EDIT].includes(context.type) && runtime.executionContext == runtime.ContextType.USER_INTERFACE && (0, freightAndInstallZoneUtils_1.runInSubsidiary)(subsidiary)) {
            const entity = context.newRecord.getValue({ fieldId: 'entity' });
            if (entity) {
                const addressData = (0, freightAndInstallZoneUtils_1.getDefaultAddressOnSO)(context.newRecord, entity);
                const itemSublist = context.form.getSublist({ id: 'item' });
                if (addressData.postalcode.length > 0 && addressData.country.length > 0) {
                    const freigthZone = (0, freightAndInstallZoneUtils_1.searchFreightZone)(addressData.postalcode, addressData.stateProvince, addressData.country);
                    if (freigthZone.length == 1) {
                        context.newRecord.setValue({ fieldId: 'custbody_hitc_freight_zone', value: freigthZone[0].zoneid }); //old field custbody_freight_zone
                        context.newRecord.setValue({ fieldId: 'custbody_delivery_available', value: freigthZone[0].delivery });
                        context.newRecord.setValue({ fieldId: 'custbody_pickup_available', value: Number(freigthZone[0].onlinePickupLocation) > 0 });
                        const delivery = itemSublist.getField({ id: 'custcol_delivery' });
                        const pickup = itemSublist.getField({ id: 'custcol_pick_up' });
                        if (freigthZone[0].delivery) {
                            delivery.updateDisplayType({ displayType: serverWidget.FieldDisplayType.NORMAL });
                        }
                        else {
                            delivery.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                        }
                        if (Number(freigthZone[0].onlinePickupLocation) > 0) {
                            pickup.updateDisplayType({ displayType: serverWidget.FieldDisplayType.NORMAL });
                        }
                        else {
                            pickup.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                        }
                    }
                    (0, freightAndInstallZoneUtils_1.setInstallDataOnSalesOrder)(context.newRecord, addressData); // [GOBASD-35] This doesn't seem to work (it doesn't change field values) in edit mode.
                }
            }
        }
        if (context.type == context.UserEventType.COPY) {
            clearValues(context.newRecord);
        }
        if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && [context.UserEventType.VIEW, context.UserEventType.EDIT].includes(context.type)) {
            const customForm = context.newRecord.getValue('customform'); // This is only readable in edit mode!! ^ View doesn't work.
            if (customForm == 167 || customForm == 152 || customForm == 258) { // [GOBASD-8] per Brandon limit to *SFT Sales Order (Web Store) NA, SFT Sales Order (Direct Sales) NA and SFT Sales Order NA - Customization
                if (isServiceOnlyOrder(context.newRecord) || context.newRecord.getValue('custbody_so_installer') == 'GTA') { // [GOBASD-28] Added GTA
                    try { // [GOBA-30]
                        context.form.clientScriptModulePath = './salesOrderClient.js';
                        context.form.addButton({ id: 'custpage_sendjob', label: 'Send to QuickContractors', functionName: 'sendJobToQuickContractors' });
                    }
                    catch (e) {
                        log.error('beforeLoad', `Failed to set client script on SO ${context.newRecord.id}: ${e.message}`);
                    }
                }
            }
        }
    }
    exports.beforeLoad = beforeLoad;
    // Deployed to quotes and sales orders
    function beforeSubmit(context) {
        log.debug('Before Submit', `Running on SO ${context.newRecord.id}, Mode ${context.type} ${runtime.executionContext}.`);
        if (runtime.executionContext != runtime.ContextType.WEBSTORE) {
            if ([context.UserEventType.CREATE, context.UserEventType.EDIT].includes(context.type)) {
                setLineItemWholesalePrices(context.newRecord);
                // Fix formula field issue that we were seeing error emails for during last week of March 2018
                for (let line = 0; line < context.newRecord.getLineCount({ sublistId: 'item' }); line++) {
                    const itemType = context.newRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line });
                    if (itemType != 'EndGroup') {
                        const qtyRemaining = context.newRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_quantity_remaining', line });
                        if (qtyRemaining == "ERROR: Field 'quantitypicked' Not Found") {
                            context.newRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_quantity_remaining', line, value: '' });
                        }
                    }
                }
                const subsidiary = context.newRecord.getValue('subsidiary');
                const freightZone = context.newRecord.getValue('custbody_install_group');
                const updateFreightZoneOnly = !freightZone && (0, freightAndInstallZoneUtils_1.runInSubsidiary)(subsidiary) && [context.UserEventType.CREATE, context.UserEventType.EDIT].includes(context.type);
                const updatCeligoOrderDefaults = context.UserEventType.CREATE == context.type && (0, freightAndInstallZoneUtils_1.runInSubsidiary)(subsidiary) && runtime.executionContext != runtime.ContextType.USER_INTERFACE;
                log.debug('beforeSubmit', `updateFreightZoneOnly - freightZone.length ${freightZone.length}, subsidiary ${subsidiary}`);
                if (updateFreightZoneOnly || updatCeligoOrderDefaults)
                    updateFreightZone(context.newRecord, updatCeligoOrderDefaults, freightZone);
                updateCustomerDefaults(context.newRecord);
            }
            // When the order gets approved, set this order to be included in the Update Commitments Map/Reduce script execution
            if (context.type == context.UserEventType.APPROVE) {
                context.newRecord.setValue('custbody_runreallocationscript', true);
            }
            else if (context.type == context.UserEventType.EDIT) {
                const newStatus = context.newRecord.getValue('orderstatus');
                const oldStatus = context.oldRecord.getValue('orderstatus');
                if (newStatus == 'B' && oldStatus != 'B')
                    context.newRecord.setValue('custbody_runreallocationscript', true);
            }
            else if (context.type == context.UserEventType.CREATE) { // [GOBASD-16]
                for (let line = 0; line < context.newRecord.getLineCount({ sublistId: 'item' }); line++) {
                    const itHandsOrderId = context.newRecord.getSublistValue({ sublistId: 'item', fieldId: customColorUtils_1.IT_HANDS_ORDER_KEY, line });
                    if (Number(itHandsOrderId) > 0)
                        context.newRecord.setValue({ fieldId: 'custbody_process_color_trampolines', value: true });
                }
            }
            log.debug('Before Submit', `Finished executing for mode ${context.type}.`);
        }
    }
    exports.beforeSubmit = beforeSubmit;
    // Deployed to quotes and sales orders
    function afterSubmit(context) {
        log.debug('After Submit', `${context.type} ${context.newRecord.type} ${context.newRecord.id} ${runtime.executionContext}.`);
        if ([context.UserEventType.CREATE, context.UserEventType.EDIT, context.UserEventType.XEDIT, context.UserEventType.APPROVE].includes(context.type)
            && runtime.getCurrentUser().id != 18 // 18 is Eric Choe
            && runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
            const runScriptParam = runtime.getCurrentScript().getParameter({ name: 'custscript_salesorder_ue_runcommitsript' });
            if (runScriptParam) { // Schedule the inventory recommitment script if it's not already running
                runReallocationScript(context.newRecord);
            }
        }
        // [GOBASD-10] set fields on SO from event on Customer
        if (context.UserEventType.CREATE == context.type || context.UserEventType.EDIT == context.type) {
            const doNotSMS = context.newRecord.getValue({ fieldId: 'custbody_cont_do_not_sms' });
            const entity = context.newRecord.getValue('entity');
            if (doNotSMS) {
                log.debug('afterSubmit', `Updating customer ${entity} with custentity_cont_do_not_sms: ${doNotSMS} at ${new Date()}.`);
                try { // [GOBA-31]
                    record.submitFields({ type: record.Type.CUSTOMER, id: entity, values: { custentity_cont_do_not_sms: doNotSMS } });
                }
                catch (e) {
                    log.error('afterSubmit', `Failed to update customer ${entity}: ${e.message}.`);
                }
            }
            setSMSFieldsFromEvent(entity, context.newRecord.id, context.newRecord.getValue('tranid'), String(context.newRecord.type)); // [GOBA-22]
        }
        if (context.UserEventType.EDIT == context.type) {
            sendJobToQuickContractors(context.newRecord);
            try {
                sendJobToOlsenGroup(context.newRecord);
            }
            catch (e) {
                log.error({ title: 'afterSubmit', details: e });
            }
        }
    }
    exports.afterSubmit = afterSubmit;
    // [GOBASD-10] Set fields on SO from event on Customer
    function setSMSFieldsFromEvent(entityID, transactionId, salesOrderTranId, transactionType) {
        log.debug('setSMSFieldsFromEvent', `Loading delivery events search for entity ${entityID} at ${new Date()}.`);
        const searchObj = search.load({ id: 'customsearch_hitc_delivery_events' }); // "[SCRIPT] Delivery Events" search (ID 9993)
        const filterExpression = searchObj.filterExpression;
        filterExpression.push('AND', ['attendee', 'anyof', entityID]);
        searchObj.filterExpression = filterExpression;
        log.debug('setSMSFieldsFromEvent', `Running search with filters: ${JSON.stringify(searchObj.filterExpression)}`);
        const results = [];
        let resultAtIndex = 0;
        searchObj.run().each(function (result) {
            results.push({
                startDate: result.getValue({ name: 'startdate' }),
                startTime: result.getValue({ name: 'starttime' }),
                endTime: result.getValue({ name: 'endtime' }),
                message: result.getValue({ name: 'messsage' }) // might be null
            });
            return true;
        });
        log.debug('setSMSFieldsFromEvent', `results: ${JSON.stringify(results)}`);
        if (results.length > 0) {
            if (results.length > 1) {
                results.forEach((result, index) => {
                    log.debug('setSMSFieldsFromEvent', `Parsing result ${index} for order Id: ${JSON.stringify(result)}`);
                    const startOfOrderID = result.message ? result.message.indexOf('">ORD') : -1;
                    if (startOfOrderID > -1) {
                        const endOfStr = result.message.indexOf('</a>');
                        const orderID = result.message.substring(startOfOrderID + 2, endOfStr);
                        log.debug('setSMSFieldsFromEvent', `Parsing found orderID: ${orderID}`);
                        if (salesOrderTranId == orderID)
                            resultAtIndex = index;
                    }
                });
            }
            log.debug('setSMSFieldsFromEvent', `Updating ${transactionType} ${transactionId} with dates/times from result: ${JSON.stringify(results[resultAtIndex])} at ${new Date()}`);
            record.submitFields({
                type: transactionType, // [GOBA-22]
                id: transactionId,
                values: {
                    custbody_sms_event_start_date: format.parse({ value: results[resultAtIndex].startDate, type: format.Type.DATE }),
                    custbody_sms_event_start_time: results[resultAtIndex].startTime,
                    custbody_sms_event_end_time: results[resultAtIndex].endTime
                }
            });
        }
    }
    // [GOBASD-8] Send job to Quick Contractors via API
    function sendJobToQuickContractors(salesOrder) {
        const subsidiary = salesOrder.getValue('subsidiary');
        const status = salesOrder.getValue('custbody_3rd_party_status');
        const jobID = salesOrder.getValue({ fieldId: 'custbody_3rd_party_job_id' });
        const isFulfilled = isOrderFulfilled(salesOrder);
        log.debug('sendJobToQuickContractors', `subsidiary ${subsidiary} status ${status} jobID ${jobID} isFulfilled ${isFulfilled}`);
        if (!jobID && isFulfilled && subsidiary == '4' && status == '1') { // SFT-CA and SFT Dispatched
            (0, quickContractorsAPI_1.addJobFromSalesOrder)(salesOrder.id);
        }
    }
    exports.sendJobToQuickContractors = sendJobToQuickContractors;
    // [GOBASD-8] if all lines are service lines, load button to send to qc
    function isServiceOnlyOrder(salesOrder) {
        let allServiceLines = true;
        let numLines = salesOrder.getLineCount({ sublistId: 'item' });
        const subsidiary = salesOrder.getValue({ fieldId: 'subsidiary' }); // SFT-CA
        const status = salesOrder.getValue({ fieldId: 'custbody_3rd_party_status' }); // SFT Dispatched
        const jobID = salesOrder.getValue({ fieldId: 'custbody_3rd_party_job_id' });
        for (let line = 0; line < numLines; line++) {
            const itemType = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line });
            log.debug('isServiceOnlyOrder', `Line ${line} item type: ${itemType}.`);
            if (itemType != 'Service')
                allServiceLines = false;
        }
        return allServiceLines && subsidiary == '4' && jobID.length < 1 && status == '1';
    }
    // [GOBASD-8] Custom criteria for order fulfillment
    function isOrderFulfilled(salesOrder) {
        let allItemLinesFulfilled = true;
        let allServiceLinesFulfilled = true;
        let numServiceLines = 0;
        let numLines = salesOrder.getLineCount({ sublistId: 'item' });
        for (let line = 0; line < numLines; line++) {
            const itemType = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line });
            const quantityfulfilled = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'quantityfulfilled', line });
            const quantity = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line });
            log.debug('isOrderFulfilled', `itemType ${itemType} quantityfulfilled ${quantityfulfilled} quantity ${quantity}`);
            if (itemType == 'Service') {
                numServiceLines++;
                if (quantity != quantityfulfilled)
                    allServiceLinesFulfilled = false;
            }
            else if (quantity != quantityfulfilled && !['Discount', 'NonInvtPart', 'Group', 'EndGroup', 'OthCharge'].includes(itemType)) { // [GOBASD-23] don't check these item types
                allItemLinesFulfilled = false;
            }
        }
        log.debug(`isOrderFulfilled`, `SO ${salesOrder.id} allItem Lines Fulfilled: ${allItemLinesFulfilled}, all Service Lines Fulfilled: ${allServiceLinesFulfilled}, is only service items: ${numLines == numServiceLines}`);
        if (numLines == numServiceLines)
            return false; // pre brandon, if only service items are handled via button
        else
            return allItemLinesFulfilled;
    }
    function clearValues(rec) {
        // clear third party defaults
        rec.setValue({ fieldId: 'custbody_3rd_party_status', value: '' });
        rec.setValue({ fieldId: 'custbody_3rd_party_install_time', value: '' });
        rec.setValue({ fieldId: 'custbody_3rd_party_scheduled_date', value: '' });
        rec.setValue({ fieldId: 'custbody_3rd_party_notes', value: '' });
        rec.setValue({ fieldId: 'custbody_3rd_party_update_timestamp', value: '' });
        rec.setValue({ fieldId: 'custbody_3rd_party_job_id', value: '' });
    }
    function runReallocationScript(rec) {
        let alreadyRunning = false;
        search.create({
            type: 'scheduledscriptinstance',
            filters: [
                ['status', 'anyof', 'PENDING', 'PROCESSING'], 'and',
                [
                    ['script.scriptid', 'is', 'customscript_reallocation_gather_reqs'], 'or',
                    ['script.scriptid', 'is', 'customscript_reallocation_process_ops_mr'],
                ]
            ]
        }).run().each(() => {
            alreadyRunning = true;
            return false;
        });
        if (alreadyRunning)
            log.debug('runReallocationScript', `SO ${rec.id}; Inventory re-commitment is already running.`);
        else {
            const mrTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
            mrTask.scriptId = 'customscript_reallocation_gather_reqs';
            try {
                const taskId = mrTask.submit();
                log.debug('runReallocationScript', `SO ${rec.id}; Scheduled inventory recommitment: ${taskId}.`);
            }
            catch (e) { // Even though we try to detect when its running, sometimes SOs are getting submitted too quickly, and it doesn't catch that its already running
                log.error('runReallocationScript', `SO ${rec.id}; ${e.message}`);
            }
        }
    }
    /** Set the Wholesale price on item lines, per email from Rebecca on 17 Nov 2017. */
    function setLineItemWholesalePrices(rec) {
        // First loop through the lines to see which items we need to set it on
        const itemsNeeded = [];
        const itemPrices = {}; // We'll default them to 0, per email from Rebecca on 22 Nov 2017
        for (let line = 0; line < rec.getLineCount({ sublistId: 'item' }); line++) {
            const itemId = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line });
            const wPrice = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ws_price', line });
            if (!wPrice && !itemsNeeded.includes(itemId)) {
                itemsNeeded.push(itemId);
                itemPrices[itemId] = 0;
            }
        }
        // Then look up the wholesale prices and convert to transaction currency
        if (itemsNeeded.length > 0) {
            const tranCurrency = rec.getValue('currency');
            const exchangeRates = {}; // So we only have to look up each currency once
            //log.debug('Before Submit', `Looking up Wholesale CAD proces for items needed: ${itemsNeeded.length}.`);
            search.create({
                type: 'item',
                filters: [['internalid', 'anyof', itemsNeeded], 'and', ['pricing.pricelevel', 'anyof', '1', '2'], 'and', ['pricing.currency', 'anyof', '3']], // Wholesale, CAD
                columns: ['pricing.currency', 'pricing.unitprice']
            }).run().each((result) => {
                let wholesalePrice = Number(result.getValue({ name: 'unitprice', join: 'pricing' }));
                const priceCurrency = result.getValue({ name: 'currency', join: 'pricing' });
                if (tranCurrency && priceCurrency != tranCurrency) {
                    const exchangeRate = exchangeRates[priceCurrency] || currency.exchangeRate({ source: priceCurrency, target: tranCurrency });
                    if (!exchangeRates[priceCurrency])
                        exchangeRates[priceCurrency] = exchangeRate;
                    //log.debug('Before Submit', `Converting wholesale price ${wholesalePrice} in currency ${priceCurrency} to currency ${tranCurrency} at rate ${exchangeRate}.`);
                    wholesalePrice *= exchangeRate;
                }
                itemPrices[result.id] = wholesalePrice;
                return true;
            });
            //log.debug('Before Submit', `Wholesale Prices Found: ${JSON.stringify(itemPrices)}.`);
            // Update lines
            for (let line = 0; line < rec.getLineCount({ sublistId: 'item' }); line++) {
                const itemType = rec.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line });
                if (itemType != 'EndGroup') {
                    const itemId = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line });
                    if (itemsNeeded.includes(itemId)) {
                        rec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ws_price', line, value: itemPrices[itemId] });
                        //log.debug('Before Submit', `Item ${itemId} Wholesale Price set on line ${line} to ${itemPrices[itemId]}.`);
                    }
                }
            }
        }
    }
    function setRecordDefaults(rec) {
        rec.setValue({ fieldId: 'custbody_for_installation', value: false });
        rec.setValue({ fieldId: 'custbody_install_override', value: false });
        rec.setValue({ fieldId: 'custbody_install_available', value: false });
        rec.setValue({ fieldId: 'custbody_delivery_available', value: false });
        rec.setValue({ fieldId: 'custbody_pickup_available', value: false });
        rec.setValue({ fieldId: 'custbody_cashncarry_available', value: false });
        rec.setValue({ fieldId: 'custbody_hitc_freight_zone', value: '' });
        rec.setValue({ fieldId: 'custbody_calc_installation', value: '' });
        rec.setValue({ fieldId: 'custbody_calc_freight_cost', value: '' });
        rec.setValue({ fieldId: 'custbody_install_group', value: '' });
        rec.setValue({ fieldId: 'custbody_install_cost', value: '' });
    }
    function addItemsSublistButtons(itemSublist) {
        itemSublist.addButton({ id: 'custpage_btn_def_warehouse', label: 'Default Warehouse', functionName: 'defaultWarehouses' });
        itemSublist.addButton({ id: 'custpage_btn_add_install', label: 'Add Install Cost', functionName: 'addInstallCost' });
        itemSublist.addButton({ id: 'custpage_btn_add_freight', label: 'Calculate Freight Cost', functionName: 'calculateFreightCost' });
    }
    function updateFreightZone(rec, updatCeligoOrderDefaults, freightZone) {
        log.debug('updateFreightZone', `updatCeligoOrderDefaults ${updatCeligoOrderDefaults}`);
        const entity = rec.getValue({ fieldId: 'entity' });
        if (!entity)
            return;
        const addressData = (0, freightAndInstallZoneUtils_1.getDefaultAddressOnSO)(rec, entity);
        if (addressData.postalcode.length > 0 && addressData.country.length > 0) {
            const freightZones = (0, freightAndInstallZoneUtils_1.searchFreightZone)(addressData.postalcode, addressData.stateProvince, addressData.country);
            if (freightZones.length == 1) {
                rec.setValue({ fieldId: 'custbody_hitc_freight_zone', value: freightZones[0].zoneid }); //old field custbody_freight_zone
                rec.setValue({ fieldId: 'custbody_delivery_available', value: freightZones[0].delivery });
                rec.setValue({ fieldId: 'custbody_pickup_available', value: Number(freightZones[0].onlinePickupLocation) > 0 });
                rec.setValue({ fieldId: 'custbody_pickup_location', value: freightZones[0].onlinePickupLocation });
            }
            else {
                log.debug('updateFreightZone', `Freight zone mismatch: ${freightZone}`);
            }
            (0, freightAndInstallZoneUtils_1.setInstallDataOnSalesOrder)(rec, addressData);
            if (updatCeligoOrderDefaults) {
                (0, freightAndInstallZoneUtils_1.setDefaultWarehouses)(rec, freightZones);
            }
        }
        else {
            log.debug('updateFreightZone', 'Default customer address was not found - no defaults set');
        }
    }
    function updateCustomerDefaults(rec) {
        // const defaults: IWebOrderDefaults = getWebOrderDefaults(rec); // [GOBA-26] This wasn't even being used in the updateCustomerDefaultsFromWebOrder function below
        const entity = rec.getValue('entity');
        // const newCustomer                 = lookupIsNewCustomer(entity); // [GOBA-26] This wasn't even being used in the updateCustomerDefaultsFromWebOrder function below
        try {
            /*const source         = context.newRecord.getValue({ fieldId: 'source' });
             const usDealerSource = runtime.getCurrentScript().getParameter({ name: 'custscript_us_dealer_source' });
             source != usDealerSource*/
            (0, webOrderUtils_1.updateCustomerDefaultsFromWebOrder)(entity, rec);
        }
        catch (e) {
            log.error('updateCustomerDefaults', `error setting customer defaults: ${e.message}`);
        }
    }
    const sendJobToOlsenGroup = (rec) => {
        const status = rec.getValue({ fieldId: 'custbody_3rd_party_status' });
        if (status !== '1') {
            log.audit({ title: 'sendJobToOlsenGroup', details: 'Not in status 1' });
            return;
        }
        log.debug({ title: 'sendJobToOlsenGroup', details: rec.id });
        if (!validateServiceOrder(rec)) {
            log.audit({ title: 'sendJobToOlsenGroup', details: 'No service items on order' });
            return;
        }
        if (exitConditions(rec))
            return;
        const payload = generateOlsenGroupPayload(rec);
        log.audit({ title: 'sendJobToOlsenGroup:payload', details: payload });
        const url = 'https://www.cristalene.com/api/saveorder.php?SAASCustomerID=MQ==&ClientId=NDIwMDg=&action=save';
        const headers = { 'Content-Type': 'application/json' };
        const response = https.post({ url, body: payload, headers });
        const responseStatus = JSON.parse(response.body).status;
        log.audit({ title: 'response', details: { response, responseStatus } });
        if (responseStatus === 'Success') {
            record.submitFields({ type: record.Type.SALES_ORDER, id: rec.id, values: { custbody_3rd_party_status: thirdPartyStatus.thirdPartyNotified, custbody_integration_failed: false } });
        }
        else {
            record.submitFields({ type: record.Type.SALES_ORDER, id: rec.id, values: { custbody_integration_failed: true } });
        }
        log.audit({ title: 'sendJobToOlsenGroup:reponse', details: { code: response.code, body: JSON.parse(response.body) } });
    };
    const validateServiceOrder = (rec) => {
        let isValid = false;
        Array.from({ length: rec.getLineCount({ sublistId: 'item' }) }).forEach((_, line) => {
            const itemType = rec.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line });
            if (itemType === 'Service')
                isValid = true;
        });
        return isValid;
    };
    const generateOlsenGroupPayload = (rec) => {
        // do not send on inventory item only orders
        // service item is required on order to send
        // only send product and service items
        // do not send price
        let orderDescription = 'Service Order';
        const ignoreItemType = ['OthCharge', 'Discount'];
        const lines = Array.from({ length: rec.getLineCount({ sublistId: 'item' }) }).map((_, line) => {
            const itemType = rec.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line });
            if (ignoreItemType.includes(itemType))
                return;
            return {
                WorkType: 'Service Order',
                Equipment: rec.getSublistText({ sublistId: 'item', fieldId: 'item', line }),
                Model: rec.getSublistValue({ sublistId: 'item', fieldId: 'description', line }),
                Quantity: rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line }),
                Price: 'N/A'
            };
        }).filter((lineObj) => Boolean(lineObj));
        const shippingAddressSubRecord = rec.getSubrecord({ fieldId: 'shippingaddress' });
        const shipCity = shippingAddressSubRecord.getValue({ fieldId: 'city' });
        const shipZip = shippingAddressSubRecord.getValue({ fieldId: 'zip' });
        const payload = {
            "0": lines,
            "PurchaseOrder": rec.getValue({ fieldId: 'tranid' }),
            "Order Description": orderDescription,
            "Customer name": rec.getText({ fieldId: 'entity' }),
            "Customer email": rec.getValue({ fieldId: 'custbody_soemail' }),
            "Customer address": rec.getValue({ fieldId: 'shipaddress' }),
            "Customer contactName": rec.getText({ fieldId: 'entity' }),
            "Customer city": shipCity,
            "Customer state": rec.getValue({ fieldId: 'shipstate' }),
            "Customer Zip": shipZip,
            "Customer phone": rec.getValue({ fieldId: 'custbody_sophone' }),
            "Customer Altphone": rec.getValue({ fieldId: 'custbody_somobile' }),
            "pickup_location": "",
            "pickup_address": "",
            "pickup_city": "",
            "pickup_state": "",
            "pickup_zip_code": "",
            "pickup_phone_no": "",
            "pickup_alt_phone": "",
            "tracking_number": rec.getValue({ fieldId: 'linkedtrackingnumbers' }),
            "carrier_company": rec.getValue({ fieldId: 'shipcarrier' }),
            "parts_arrive": "0000-00-00",
            "admin_note": rec.getValue({ fieldId: 'custbody_3rd_party_notes' }),
            "reassembly_address": rec.getValue({ fieldId: 'custbody_3rd_party_add_2' }),
            "reassembly_city": rec.getValue({ fieldId: 'custbody_3rd_party_add_city' }),
            "reassembly_state": rec.getValue({ fieldId: 'custbody_3rd_party_add_state' }),
            "reassembly_zip": rec.getValue({ fieldId: 'custbody_3rd_party_add_zip' }),
            "transactionId": rec.id
        };
        return JSON.stringify(payload);
    };
    const exitConditions = (rec) => {
        const trackingNumber = rec.getValue({ fieldId: 'linkedtrackingnumbers' });
        if (!trackingNumber) {
            log.audit({ title: 'sendToOlsenGroup', details: 'No Tracking Number Set' });
            return true;
        }
        const status = rec.getValue({ fieldId: 'custbody_3rd_party_status' });
        if (status !== '1') {
            log.audit({ title: 'sendJobToOlsenGroup', details: 'Not in status 1' });
            return true;
        }
        if (!validateServiceOrder(rec)) {
            log.audit({ title: 'sendJobToOlsenGroup', details: 'No service items on order' });
            return;
        }
        const balanceDue = rec.getValue({ fieldId: 'custbody_custbodysalesorderbalance' });
        if (balanceDue > 0) {
            log.audit({ title: 'exitConditions', details: 'Balance due on order' });
            return true;
        }
        if (rec.getValue({ fieldId: 'custbody_so_installer' }) !== 'OOTB') {
            log.audit({ title: 'exitConditions', details: 'Status not 2' });
            return true;
        }
        return false;
    };
    const thirdPartyStatus = {
        thirdPartyNotified: '2'
    };
});
