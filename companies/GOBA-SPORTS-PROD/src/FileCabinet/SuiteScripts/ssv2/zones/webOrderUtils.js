/**
 * webOrderUtils.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NApiVersion 2.1
 */
define(["N/format", "N/log", "N/record", "N/search"], function (format, log, record, search) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lookupIsNewCustomer = exports.isNewCustomer = exports.updateCustomerAddressesFromSalesOrder = exports.updateCustomerDefaultsFromWebOrder = exports.updatePhoneOnCustomerRecord = exports.getWebOrderDefaults = exports.lookupPromoCode = exports.getValuesFromEventCode = exports.addAddressSubrecordToCustomerFromSalesOrder = exports.addressExistsOnCustomer = exports.addressIdExistsOnCustomer = exports.addAddressToCustomerFromSalesOrder = exports.updateExistingCustomerAddresses = exports.checkBillingAddressAgainstShipping = exports.buildAddressObj = exports.billingAddressAndShippingAddressMatch = exports.setDefaultAddressFromSalesOrder = void 0;
    function setDefaultAddressFromSalesOrder(salesRec, customerRec) {
        const shippingSubRecord = salesRec.getSubrecord({ fieldId: 'shippingaddress' });
        customerRec.selectNewLine({ sublistId: 'addressbook' });
        customerRec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
        const newAddress = customerRec.getCurrentSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress' });
        newAddress.setValue({ fieldId: 'country', value: shippingSubRecord.getValue({ fieldId: 'country' }) });
        newAddress.setValue({ fieldId: 'addressee', value: shippingSubRecord.getValue({ fieldId: 'addressee' }) });
        newAddress.setValue({ fieldId: 'addrphone', value: shippingSubRecord.getValue({ fieldId: 'addrphone' }) });
        newAddress.setValue({ fieldId: 'addr1', value: shippingSubRecord.getValue({ fieldId: 'addr1' }) });
        newAddress.setValue({ fieldId: 'city', value: shippingSubRecord.getValue({ fieldId: 'city' }) });
        newAddress.setValue({ fieldId: 'state', value: shippingSubRecord.getValue({ fieldId: 'state' }) });
        newAddress.setValue({ fieldId: 'zip', value: shippingSubRecord.getValue({ fieldId: 'zip' }) });
        customerRec.commitLine({ sublistId: 'addressbook' });
        return {
            city: shippingSubRecord.getValue({ fieldId: 'city' }),
            state: shippingSubRecord.getValue({ fieldId: 'state' }),
            zip: shippingSubRecord.getValue({ fieldId: 'zip' }),
            country: shippingSubRecord.getValue({ fieldId: 'country' })
        };
    }
    exports.setDefaultAddressFromSalesOrder = setDefaultAddressFromSalesOrder;
    function billingAddressAndShippingAddressMatch(salesRecord) {
        const shippingSubRecord = salesRecord.getSubrecord({ fieldId: 'shippingaddress' });
        const billingSubRecord = salesRecord.getSubrecord({ fieldId: 'billingaddress' });
        log.debug(`billingSubRecord ${shippingSubRecord}`, buildAddressObj(billingSubRecord));
        log.debug(`shippingSubRecord ${billingSubRecord}`, buildAddressObj(shippingSubRecord));
        log.debug('checking if billing address and shipping address match: ', JSON.stringify(buildAddressObj(billingSubRecord)) == JSON.stringify(buildAddressObj(shippingSubRecord)));
        return JSON.stringify(buildAddressObj(billingSubRecord)) == JSON.stringify(buildAddressObj(shippingSubRecord));
    }
    exports.billingAddressAndShippingAddressMatch = billingAddressAndShippingAddressMatch;
    function buildAddressObj(addressRec) {
        return {
            addr1: addressRec.getValue('addr1').toLowerCase(),
            city: addressRec.getValue('city').toLowerCase(),
            country: addressRec.getValue('country').toLowerCase(),
            state: addressRec.getValue('state').toLowerCase(),
            zip: addressRec.getValue('zip')
        };
    }
    exports.buildAddressObj = buildAddressObj;
    function checkBillingAddressAgainstShipping(salesRec, customerRec) {
        const customerAddresses = customerRec.getLineCount({ sublistId: 'addressbook' });
        if (customerAddresses > 0 && !billingAddressAndShippingAddressMatch(salesRec)) {
            addAddressToCustomerFromSalesOrder(salesRec, customerRec, 'billaddresslist', false);
        }
        else if (customerAddresses < 1) {
            updateExistingCustomerAddresses(salesRec, customerRec);
        }
    }
    exports.checkBillingAddressAgainstShipping = checkBillingAddressAgainstShipping;
    function updateExistingCustomerAddresses(salesRec, customerRec) {
        addAddressToCustomerFromSalesOrder(salesRec, customerRec, 'billaddresslist', false);
        addAddressToCustomerFromSalesOrder(salesRec, customerRec, 'shipaddresslist', false);
    }
    exports.updateExistingCustomerAddresses = updateExistingCustomerAddresses;
    function addAddressToCustomerFromSalesOrder(salesRec, customerRec, addressListId, setBothAsDefault) {
        const addressList = salesRec.getValue({ fieldId: addressListId });
        let addAddress = true;
        log.audit('addAddressToCustomerFromSalesOrder', `addressListId: '${addressListId}', addressList: '${addressList}'`);
        if (addressList && Number(addressList) > 0) {
            log.debug('address values bill fields', `${addressListId}: ${addressList}`); // check for bililng address on customer record
            addAddress = addressIdExistsOnCustomer(customerRec, addressList);
        }
        else {
            const addressSubRecord = salesRec.getSubrecord({ fieldId: addressListId == 'billaddresslist' ? 'billingaddress' : 'shippingaddress' });
            log.debug(`address sub record from sales order ${addressListId} is dynamic: ${customerRec.isDynamic}`, addressSubRecord);
            try {
                addAddress = addressExistsOnCustomer(customerRec, buildAddressObj(addressSubRecord));
            }
            catch (e) {
                log.error('error checking for address', e);
            }
        }
        if (addAddress) { // if not match found on customer for this address, then add it
            addAddressSubrecordToCustomerFromSalesOrder(salesRec, customerRec, addressListId == 'billaddresslist' ? 'billingaddress' : 'shippingaddress', setBothAsDefault);
        }
    }
    exports.addAddressToCustomerFromSalesOrder = addAddressToCustomerFromSalesOrder;
    function addressIdExistsOnCustomer(customerRec, addressId) {
        let addAddress = true;
        for (let c = 0; c < customerRec.getLineCount({ sublistId: 'addressbook' }); c++) {
            const currAddressLine = customerRec.getSublistValue({ sublistId: 'addressbook', fieldId: 'id', line: c });
            if (currAddressLine == addressId) {
                addAddress = false;
            }
        }
        return addAddress;
    }
    exports.addressIdExistsOnCustomer = addressIdExistsOnCustomer;
    function addressExistsOnCustomer(customerRec, addressObj) {
        let addAddress = true;
        for (let c = 0; c < customerRec.getLineCount({ sublistId: 'addressbook' }); c++) {
            customerRec.selectLine({ sublistId: 'addressbook', line: c });
            const address = customerRec.getCurrentSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress' });
            const thisAddress = buildAddressObj(address);
            if (JSON.stringify(thisAddress) == JSON.stringify(addressObj)) {
                addAddress = false;
            }
        }
        log.debug('did address existing on customer?', !addAddress);
        return addAddress;
    }
    exports.addressExistsOnCustomer = addressExistsOnCustomer;
    function addAddressSubrecordToCustomerFromSalesOrder(salesRec, customerRec, addressToGet, setBothAsDefault) {
        log.debug('adding new address', `adding default ${addressToGet}`);
        try {
            const addressSubRecord = salesRec.getSubrecord({ fieldId: addressToGet });
            customerRec.selectNewLine({ sublistId: 'addressbook' });
            if (setBothAsDefault) {
                customerRec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: true });
                customerRec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
            }
            else if (addressToGet == 'billingaddress')
                customerRec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: true });
            else if (addressToGet == 'shippingaddress')
                customerRec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
            const newAddress = customerRec.getCurrentSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress' });
            newAddress.setValue({ fieldId: 'country', value: addressSubRecord.getValue({ fieldId: 'country' }) });
            newAddress.setValue({ fieldId: 'addressee', value: addressSubRecord.getValue({ fieldId: 'addressee' }) });
            newAddress.setValue({ fieldId: 'addrphone', value: addressSubRecord.getValue({ fieldId: 'addrphone' }) });
            newAddress.setValue({ fieldId: 'addr1', value: addressSubRecord.getValue({ fieldId: 'addr1' }) });
            newAddress.setValue({ fieldId: 'city', value: addressSubRecord.getValue({ fieldId: 'city' }) });
            newAddress.setValue({ fieldId: 'state', value: addressSubRecord.getValue({ fieldId: 'state' }) });
            newAddress.setValue({ fieldId: 'zip', value: addressSubRecord.getValue({ fieldId: 'zip' }) });
            customerRec.commitLine({ sublistId: 'addressbook' });
        }
        catch (e) {
            log.error('error adding address', e);
        }
        log.debug('adding new address', `adding ${addressToGet} address complete`);
    }
    exports.addAddressSubrecordToCustomerFromSalesOrder = addAddressSubrecordToCustomerFromSalesOrder;
    function getValuesFromEventCode(eventMarketID) {
        let department, campaign, channel, salesRep;
        if (Number(eventMarketID) > 0) { // Load default field values for Event
            const lookupFields = search.lookupFields({
                type: 'customrecord_event_market_list',
                id: eventMarketID,
                columns: ['custrecord_em_department', 'custrecord_em_campaign', 'custrecord_em_sales_channel', 'custrecord_em_sales_rep']
            });
            const campaignLookup = lookupFields['custrecord_em_campaign'];
            if (campaignLookup.length > 0) {
                department = lookupFields['custrecord_em_department'][0].value;
                campaign = lookupFields['custrecord_em_campaign'][0].value;
                channel = lookupFields['custrecord_em_sales_channel'][0].value;
                salesRep = lookupFields['custrecord_em_sales_rep'][0].value;
            }
        }
        return { department, campaign, channel, salesRep };
    }
    exports.getValuesFromEventCode = getValuesFromEventCode;
    function lookupPromoCode(promocode) {
        const lookupFields = search.lookupFields({ type: 'promotioncode', id: promocode, columns: ['custrecord_linked_campaign'] });
        const lookupCampaign = lookupFields['custrecord_linked_campaign'];
        if (lookupCampaign.length > 0) {
            return lookupCampaign[0].value;
        }
        return '';
    }
    exports.lookupPromoCode = lookupPromoCode;
    function getWebOrderDefaults(rec) {
        const isWebstoreOrder = rec.getValue('custbody_ps_webstore_process_flag');
        const pickLocation = rec.getValue('custbody_web_default_warehouse_loc');
        const deliveryAvailable = rec.getValue('custbody_delivery_available');
        const installAvailable = rec.getValue('custbody_install_available');
        const installGroup = rec.getValue('custbody_install_group');
        const channelReferral = rec.getValue('custbodycustbody_referralsource');
        const orderStatus = rec.getValue('orderstatus');
        const subsidiary = rec.getValue('subsidiary');
        log.debug('orderStatus', orderStatus);
        if (orderStatus != 'Pending Billing') { //If it's not Gift Voucher only order
            if ((!isWebstoreOrder && pickLocation == '' && !deliveryAvailable) ||
                (installAvailable && !installGroup)) {
                rec.setValue({ fieldId: 'custbody_incomplete_web_order', value: true });
            }
        }
        let eventDataMap = {
            department: '',
            campaign: '',
            channel: '2',
            salesRep: '14000' //Online runtime.getCurrentScript().getParameter({ name: 'custscript_web_salesrep'     }) as string,
        };
        // set defaults
        switch (subsidiary) {
            case '1': //AU
                eventDataMap.department = '13';
                eventDataMap.campaign = '20708621';
                break;
            case '3': //US
                eventDataMap.department = '63';
                eventDataMap.campaign = '20790398';
                break;
            case '4': //CA
                eventDataMap.department = '65';
                eventDataMap.campaign = '20833630';
                break;
            case '5': //NZ
                eventDataMap.department = '47';
                eventDataMap.campaign = '20566014';
                break;
            default:
                break;
        }
        // check for other possible values
        const eventMarketID = rec.getValue('custbody_so_event_market');
        const promocode = rec.getValue('promocode');
        const eventData = getValuesFromEventCode(eventMarketID);
        for (let i in eventData) {
            if (eventData[i] && eventData[i].length > 0) {
                eventDataMap[i] = eventData[i];
            }
        }
        if (Number(promocode)) { // If there is a linked campaign in promotion
            const promocodeCampaign = lookupPromoCode(promocode);
            if (promocodeCampaign.length > 0)
                eventDataMap.campaign = promocodeCampaign;
        }
        /*rec.setValue({ fieldId: 'department', value: eventDataMap.department });
         rec.setValue({ fieldId: 'custbody_sp_filtered_campaign_source', value: eventDataMap.campaign });
         rec.setValue({ fieldId: 'leadsource', value: eventDataMap.campaign });
         rec.setValue({ fieldId: 'salesrep', value: eventDataMap.salesRep });
         rec.setValue({ fieldId: 'custbody_salessource', value: eventDataMap.channel });*/
        const match = rec.findSublistLineWithValue({ sublistId: 'item', fieldId: 'item', value: '4274' });
        log.debug('installation cost', match);
        if (match > -1)
            rec.setValue({ fieldId: 'custbody_for_installation', value: true });
        return {
            salesRep: eventDataMap.salesRep,
            channel: eventDataMap.channel,
            department: eventDataMap.department,
            campaign: eventDataMap.campaign,
            channelReferral
        };
    }
    exports.getWebOrderDefaults = getWebOrderDefaults;
    function updatePhoneOnCustomerRecord(salesOrderRec, customerRecord) {
        /** [GOBASD-12]
         1. Check to see if there is a phone number in the phone field.
         2. If that field is already populated, go to step 3, if empty, fill this field with number from sales order and end flow.
         3. Check to see if there is a phone number in the mobile phone field.
         4. If that field is already populated, go to step 5, if empty, fill this field with number from sales order and end flow.
         5. Fill Phone field with number and move any populated number currently in this field to alt phone field.
         */
        let soPhone;
        const phone = customerRecord.getValue({ fieldId: 'phone' }); // Check to see if there is a phone number in the phone field.
        const billingSubRecord = salesOrderRec.getSubrecord({ fieldId: 'billingaddress' });
        soPhone = billingSubRecord.getValue('addrphone');
        log.debug(`updatePhoneOnCustomerRecord`, `Checking for phone number on billing address for so ${salesOrderRec.id}, so phone '${soPhone}'`);
        if (!soPhone) {
            const shippingSubRecord = salesOrderRec.getSubrecord({ fieldId: 'shippingaddress' });
            soPhone = shippingSubRecord.getValue('addrphone');
            log.debug(`checking for phone number on shipping address for so ${salesOrderRec.id}`, `so phone '${soPhone}'`);
        }
        if (soPhone) {
            if (phone) { // If phone field is already populated, check to see if there is a phone number in the mobile phone field.
                const mobilePhone = customerRecord.getValue({ fieldId: 'mobilephone' });
                if (mobilePhone) { // If mobile phone field is already populated, fill phone the so phone and move what's in phone to alt phone field.
                    record.submitFields({ type: record.Type.CUSTOMER, id: customerRecord.id, values: { mobilephone: soPhone, altphone: phone } });
                }
                else { // else put the so phone into the mobile phone field
                    record.submitFields({ type: record.Type.CUSTOMER, id: customerRecord.id, values: { mobilephone: soPhone } });
                }
            }
            else { // if phone empty, fill this field with number from sales order and end flow.
                record.submitFields({ type: record.Type.CUSTOMER, id: customerRecord.id, values: { phone: soPhone } });
            }
        }
        else {
            log.debug(`no phone numbers could be found on sales order ${salesOrderRec}`, `no phone data was updated on customer ${customerRecord.id}`);
        }
    }
    exports.updatePhoneOnCustomerRecord = updatePhoneOnCustomerRecord;
    function updateCustomerDefaultsFromWebOrder(customerId, salesOrderRec) {
        const fieldsToUpdate = {};
        if (salesOrderRec.getValue({ fieldId: 'subsidiary' }) == '4') {
            fieldsToUpdate['pricelevel'] = 3;
        }
        //fieldsToUpdate['custentity_hitc_post_processing_run'] = true; don't flag it here, let the other script pick it up
        log.debug('updateCustomerDefaultsFromWebOrder', `Customer id ${customerId} on soId ${salesOrderRec.id} with fieldsToUpdate: ${JSON.stringify(fieldsToUpdate)}.`);
        if (Object.keys(fieldsToUpdate).length > 0) {
            record.submitFields({ type: record.Type.CUSTOMER, id: customerId, values: fieldsToUpdate, options: { ignoreMandatoryFields: true } });
            log.debug('updateCustomerDefaultsFromWebOrder', `Customer record ${customerId} was updated.`);
        }
    }
    exports.updateCustomerDefaultsFromWebOrder = updateCustomerDefaultsFromWebOrder;
    function updateCustomerAddressesFromSalesOrder(salesRec, customerRec) {
        try {
            // update the sales order with the new address
            const match = customerRec.findSublistLineWithValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: true });
            if (match > -1) {
                const defaultAddressID = customerRec.getSublistValue({ sublistId: 'addressbook', fieldId: 'id', line: match });
                log.debug('set defaultAddressID on sales order record', `defaultAddressID: ${defaultAddressID}`);
                salesRec.setValue({ fieldId: 'billaddresslist', value: defaultAddressID });
            }
        }
        catch (e) {
            log.error('error updating SO record with new address', e);
        }
    }
    exports.updateCustomerAddressesFromSalesOrder = updateCustomerAddressesFromSalesOrder;
    function isNewCustomer(customerRec) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const customerCreated = customerRec.getValue({ fieldId: 'datecreated' });
        log.debug('isNewCustomer datecreated', customerCreated);
        const custCreatedDate = new Date(format.format({ value: customerCreated, type: format.Type.DATE }));
        custCreatedDate.setHours(0, 0, 0, 0);
        log.debug('checking if is new customer', `created date: ${custCreatedDate} now: ${now} is new: ?${custCreatedDate >= now}`);
        return custCreatedDate >= now;
    }
    exports.isNewCustomer = isNewCustomer;
    function lookupIsNewCustomer(customerId) {
        const cutomerValues = search.lookupFields({ type: search.Type.CUSTOMER, id: customerId, columns: ['datecreated'] });
        log.debug('lookupIsNewCustomer', `Customer ${customerId} values: ${JSON.stringify(cutomerValues)}.`);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const customerCreated = cutomerValues['datecreated'];
        if (!customerCreated)
            return false; // [GOBA-26]
        const custCreatedDate = format.parse({ value: customerCreated, type: format.Type.DATETIME });
        custCreatedDate.setHours(0, 0, 0, 0);
        log.debug(`lookupIsNewCustomer`, `Customer ${customerId} created date: ${custCreatedDate} now: ${now}, is new: ${custCreatedDate >= now}.`);
        return custCreatedDate >= now;
    }
    exports.lookupIsNewCustomer = lookupIsNewCustomer;
    return exports;
});
