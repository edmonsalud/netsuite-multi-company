/**
 * entityClient.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptType ClientScript
 * @NApiVersion 2.1
 */
define(["./zones/freightAndInstallZoneUtils"], function (freightAndInstallZoneUtils_1) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateLine = exports.fieldChanged = exports.pageInit = void 0;
    function pageInit(context) {
        console.log('script firing');
    }
    exports.pageInit = pageInit;
    function fieldChanged(context) {
    }
    exports.fieldChanged = fieldChanged;
    function validateLine(context) {
        console.log('validateLine', context.sublistId);
        if (context.sublistId == 'addressbook') {
            //const address = context.currentRecord.getCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'addressbookaddress'  });
            const address = context.currentRecord.getCurrentSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress' });
            const postalcode = address.getValue({ fieldId: 'zip' });
            const state = address.getValue({ fieldId: 'state' });
            const country = address.getValue({ fieldId: 'country' });
            const zipPopulated = postalcode && postalcode.length > 0;
            const statePopulated = state && state.length > 0;
            const countryPopulated = country && country.length > 0;
            const populateCountry = zipPopulated && statePopulated && !countryPopulated;
            const populateState = zipPopulated && !statePopulated && countryPopulated;
            if (populateCountry || populateState) {
                try {
                    const postCodeRecMatch = freightAndInstallZoneUtils_1.getPostCodeRecordFromAddress(postalcode, country, state);
                    if (postCodeRecMatch && postCodeRecMatch.length == 1) {
                        if (populateCountry)
                            context.currentRecord.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'country', value: postCodeRecMatch[0].getValue({ name: 'custrecord_zpc_country' }) });
                        if (populateState)
                            context.currentRecord.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'state', value: postCodeRecMatch[0].getValue({ name: 'custrecord_zpc_state_province' }) });
                    }
                    else {
                        alert('This address is invalid. Please fix.');
                        return false;
                    }
                }
                catch (e) {
                    console.log('error fetching address', e);
                }
            }
        }
        return true;
    }
    exports.validateLine = validateLine;
    return exports;
});
