/**
 * warehouseLocationsAPI.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Zone Lookup
 * @NScriptType Suitelet
 * @NApiVersion 2.1
 */
define(["N/log", "N/search", "./freightAndInstallZoneUtils"], function (log, search, freightAndInstallZoneUtils_1) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = void 0;
    const ERR_METHOD_NOT_ALLOWED = {
        success: false,
        responseText: JSON.stringify({
            errorMessage: "Method not allowed.",
            response_code: "ERR_METHOD_NOT_ALLOWED"
        }),
        response_code: "ERR_METHOD_NOT_ALLOWED"
    };
    function onRequest(context) {
        const method = context.request.method;
        if (method === 'GET') {
            const postalcode = context.request.parameters['shipzip'];
            const stateProvince = context.request.parameters['shipstate'];
            const country = context.request.parameters['shipcountry'];
            const items = context.request.parameters['items']; //expected as a JSON object of some kind
            //const itemClassMapping = context.request.parameters['custparam_item_class'].split(',');
            const subsidiary = context.request.parameters['custparam_subsidiary'];
            const zone = context.request.parameters['zone'];
            //const state            = context.request.parameters['custparam_state'];
            if (postalcode.length > 0 && country.length > 0) {
                const freigthZone = freightAndInstallZoneUtils_1.searchFreightZone(postalcode, stateProvince, country);
                if (freigthZone.length == 1) {
                    const itemJSON = JSON.parse(items);
                    const itemsArr = itemJSON.map(i => i.item);
                    log.debug('itemsArr', itemsArr);
                    let itemQtyMap = {};
                    const itemIds = [];
                    search.create({
                        type: 'item',
                        filters: [['internalid', 'anyof', itemsArr], 'and', ['isinactive', 'is', false]],
                        columns: ['itemid', 'name', 'itemtype', 'class']
                    }).run().each((result) => {
                        const item = result.id;
                        const match = itemJSON.filter(item => item.item == item.toString());
                        if (match && match.length == 1) {
                            const itemName = result.getValue({ name: 'name' });
                            const qty = match[0].qty;
                            const itemType = result.getValue({ name: 'itemtype' });
                            const itemClass = result.getValue({ name: 'class' });
                            if (~['InvtPart', 'Kit', 'Assembly'].indexOf(itemType)) {
                                const defaultWarehouse = freightAndInstallZoneUtils_1.getDefaultWarehouse('API', subsidiary, zone[0].zoneid, stateProvince, country, itemClass, '');
                                if (itemIds.indexOf(item) < 0)
                                    itemIds.push(item);
                                if (!itemQtyMap[item]) {
                                    itemQtyMap[item] = {
                                        id: item,
                                        cost: 0,
                                        qty: 0,
                                        name: itemName,
                                        currency: '',
                                        solo: false,
                                        defaultWarehouse: defaultWarehouse
                                    };
                                }
                                itemQtyMap[item].qty += qty;
                            }
                        }
                        return true;
                    });
                    itemQtyMap = freightAndInstallZoneUtils_1.calculateFreightCosts(itemQtyMap, itemIds, Number(freigthZone[0].zoneid), postalcode, stateProvince, country);
                }
            }
        }
        else {
            context.response.write({ output: JSON.stringify(ERR_METHOD_NOT_ALLOWED) });
            return;
        }
    }
    exports.onRequest = onRequest;
    return exports;
});
