/**
 * freightZoneUtils.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NApiVersion 2.1
 *
 * Version  Date    	Author          	Remarks
 * 1.02     28-1102-24  Robin.Mitchell  Handle error in state lookup
 * 1.01     21-11-2024  Robin.Mitchell  Logging, formatting, and commenting improvements
 * 1.00     18-11-2024  Rebecca.Basile  Added back in AU and NZ specific conditions missed on 13-11-2024 Update
 */
define(["N/log", "N/record", "N/runtime", "N/search"], function (log, record, runtime, search) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.runInSubsidiary = exports.getCustomerDefaultAddress = exports.setFreightAndInstallDefaultsOnCustomerRecord = exports.searchItemFreightCosts = exports.calculateFreightCosts = exports.getPostCodeRecordFromAddress = exports.getItemType = exports.setDefaultWarehouses = exports.getDefaultWarehouse = exports.searchInstallZones = exports.searchFreightZone = exports.getDefaultAddressOnSO = exports.setInstallDataOnSalesOrder = exports.COUNTRIES = void 0;
    exports.COUNTRIES = {
        'US': 230,
        'AU': 14,
        'CA': 37,
        'NZ': 171,
    };
    function setInstallDataOnSalesOrder(salesOrder, addressData) {
        log.debug('setInstallDataOnSalesOrder', addressData);
        const installZones = searchInstallZones(addressData.postalcode, addressData.stateProvince, addressData.country);
        if (installZones.length == 1 && installZones[0].installCost > 0) {
            salesOrder.setValue({ fieldId: 'custbody_install_available', value: installZones[0].installCost > 0 });
            salesOrder.setValue({ fieldId: 'custbody_install_group', value: installZones[0].installGroupId });
            salesOrder.setValue({ fieldId: 'custbody_install_cost', value: installZones[0].installCost });
            salesOrder.setValue({ fieldId: 'custbody_so_installer', value: installZones[0].installer });
            // Check installer location and set internal ID accordingly
            if (installZones[0].installer === "Sydney") {
                salesOrder.setValue({ fieldId: 'custbody_so_installer_new', value: 20 });
            }
            else if (installZones[0].installer === "Melbourne") {
                salesOrder.setValue({ fieldId: 'custbody_so_installer_new', value: 14 });
            }
            else if (installZones[0].installer === "Perth") {
                salesOrder.setValue({ fieldId: 'custbody_so_installer_new', value: 15 });
            }
            else if (installZones[0].installer === "Kunda Park") {
                salesOrder.setValue({ fieldId: 'custbody_so_installer_new', value: 12 });
            }
            else if (installZones[0].installer === "Adelaide") {
                salesOrder.setValue({ fieldId: 'custbody_so_installer_new', value: 1 });
            }
            else if (installZones[0].installer === "Central Coast") {
                salesOrder.setValue({ fieldId: 'custbody_so_installer_new', value: 6 });
            }
            else if (installZones[0].installer === "Canberra") {
                salesOrder.setValue({ fieldId: 'custbody_so_installer_new', value: 5 });
            }
            else if (installZones[0].installer === "Wellington") {
                salesOrder.setValue({ fieldId: 'custbody_so_installer_new', value: 21 });
            }
        }
    }
    exports.setInstallDataOnSalesOrder = setInstallDataOnSalesOrder;
    function getDefaultAddressOnSO(salesOrder, entityID) {
        let postalcode = salesOrder.getValue({ fieldId: 'shipzip' });
        let stateProvince = salesOrder.getValue({ fieldId: 'shipstate' });
        let country = salesOrder.getValue({ fieldId: 'shipcountry' });
        if (postalcode.length < 1 || country.length < 1) {
            log.debug('getDefaultAddressOnSO', `Loading customer ${entityID}`);
            const customer = record.load({ type: record.Type.CUSTOMER, id: entityID, isDynamic: false });
            const defaultShipAddress = getCustomerDefaultAddress(customer);
            if (defaultShipAddress) {
                postalcode = defaultShipAddress.zip;
                stateProvince = defaultShipAddress.state;
                country = defaultShipAddress.country;
            }
        }
        return { postalcode, stateProvince, country };
    }
    exports.getDefaultAddressOnSO = getDefaultAddressOnSO;
    // replaces mainGetZone in PS_SL_FreightZones.js suitelet customscript_ps_sl_freight_zones
    // called by searchFreightZone in PS_Lib_Fn_FreightInstall.js - called by calling the suitelet customscript_ps_sl_freight_zones
    // called by postSourcing_freightCustomer in PS_CS_Fn_SalesOrder_Client.js
    function searchFreightZone(zip, state, country) {
        log.debug('searchFreightZone', `zip ${zip}; state ${state}; country ${country}`);
        const zones = [];
        if (zip.length >= 3 && country.length > 0 && exports.COUNTRIES[country]) {
            const searchObj = search.create({
                type: 'customrecord_zone_post_code',
                filters: [
                    search.createFilter({ name: 'isinactive', operator: search.Operator.IS, values: false }),
                    search.createFilter({ name: 'custrecord_zpc_country', operator: search.Operator.ANYOF, values: exports.COUNTRIES[country] }),
                    search.createFilter({ name: 'custrecord_zpc_zone_list', operator: search.Operator.NONEOF, values: '@NONE@' })
                ],
                columns: ['custrecord_zpc_zone_list', 'custrecord_zpc_delivery', 'custrecord_zpc_online_pickup_location']
            });
            if (country == 'CA') // Canada
                searchObj.filters.push(search.createFilter({
                    name: 'custrecord_zpc_postcode',
                    operator: search.Operator.STARTSWITH,
                    values: zip.length > 3 ? zip.substring(0, 3) : zip
                }));
            else
                searchObj.filters.push(search.createFilter({ name: 'custrecord_zpc_postcode', operator: search.Operator.STARTSWITH, values: zip }));
            if (state.length > 0 || country == 'CA') {
                const states = getStates(country);
                const stateID = states[state];
                if (stateID && Number(stateID) > 0)
                    searchObj.filters.push(search.createFilter({
                        name: 'custrecord_zpc_state_province',
                        operator: search.Operator.IS,
                        values: Number(stateID)
                    }));
            }
            log.debug('searchFreightZone', `Filters: ${JSON.stringify(searchObj.filters)}`);
            try { // [GOBA-33] Not all roles have permission for this record type (it is managed by permission list)
                searchObj.run().each(function (result) {
                    zones.push({
                        recid: result.id,
                        zoneid: result.getValue({ name: 'custrecord_zpc_zone_list' }),
                        zonename: result.getText({ name: 'custrecord_zpc_zone_list' }),
                        delivery: result.getValue({ name: 'custrecord_zpc_delivery' }),
                        onlinePickupLocation: result.getValue({ name: 'custrecord_zpc_online_pickup_location' })
                    });
                    return true;
                });
            }
            catch (e) {
                log.error('searchFreightZone', `Faield to run customrecord_zone_post_code search for role ${runtime.getCurrentUser().role}.`);
            }
            log.debug('searchFreightZone', 'Freight zones found: ' + JSON.stringify(zones));
        }
        return zones;
    }
    exports.searchFreightZone = searchFreightZone;
    function getStates(country) {
        const searchObj = search.load({ id: 'customsearch_hitc_get_states_by_country' }); // [SCRIPT] Get States by Country
        const filterExpress = searchObj.filterExpression;
        if (filterExpress.length > 0)
            filterExpress.push('AND');
        filterExpress.push(['country', 'anyof', [country]]); // why a string here? Cause NetSuite :D
        searchObj.filterExpression = filterExpress;
        const stateMap = {};
        try { // [GOBA-33]
            searchObj.run().each(function (result) {
                stateMap[result.getValue('shortname')] = result.getValue('id');
                return true;
            });
        }
        catch (e) { // This will fail if user does not have Set Up Company permission
            log.error('getStates', `Faield to run state search for role ${runtime.getCurrentUser().role}.`);
        }
        return stateMap;
    }
    // replaces mainGetInstallDetails in PS_SL_InstallGroups.js
    // searchInstallGroup in PS_Lib_Fn_FreightInstall.js calls suitelet customscript_ps_sl_install_groups
    // called by postSourcing_freightCustomer in PS_CS_Fn_SalesOrder_Client.js
    function searchInstallZones(zip, state, country) {
        log.debug('searchInstallZones', `zip: ${zip}, state: ${state}, country: ${country}`);
        const zones = [];
        if (exports.COUNTRIES[country]) {
            const searchObj = search.create({
                type: 'customrecord_install_post_code',
                filters: [
                    search.createFilter({ name: 'isinactive', operator: search.Operator.IS, values: false }),
                    search.createFilter({ name: 'custrecord_ipc_country', operator: search.Operator.ANYOF, values: exports.COUNTRIES[country] }),
                    search.createFilter({ name: 'custrecord_ipc_install_grp', operator: search.Operator.NONEOF, values: '@NONE@' })
                ],
                columns: ['custrecord_ipc_install_grp', 'custrecord_ipc_install_grp.custrecord_ig_currency', 'custrecord_ipc_install_grp.custrecord_ig_cost', 'custrecord_ipc_installer', 'custrecord_ipc_esri', 'custrecord_ipc_lifemode']
            });
            if (country == 'CA')
                searchObj.filters.push(search.createFilter({
                    name: 'custrecord_ipc_postcode',
                    operator: search.Operator.STARTSWITH,
                    values: zip.length > 3 ? zip.substring(0, 3) : zip
                }));
            else
                searchObj.filters.push(search.createFilter({ name: 'custrecord_ipc_postcode', operator: search.Operator.STARTSWITH, values: zip }));
            if (state.length > 0 && country != 'CA') {
                const states = getStates(country);
                const stateID = states[state];
                if (stateID && Number(stateID) > 0)
                    searchObj.filters.push(search.createFilter({ name: 'custrecord_ipc_state_province', operator: search.Operator.ANYOF, values: [stateID] }));
            }
            let pagedData;
            try { // [GOBA-33]
                pagedData = searchObj.runPaged({ pageSize: 1000 });
            }
            catch (e) {
                log.error('searchInstallZones', `Faield to run customrecord_install_post_code search for role ${runtime.getCurrentUser().role}.`);
                return [];
            }
            pagedData.pageRanges.forEach(function (pageRange) {
                const page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    zones.push({
                        recid: result.id,
                        installGroupId: result.getValue({ name: 'custrecord_ipc_install_grp' }),
                        installGroupName: result.getText({ name: 'custrecord_ipc_install_grp' }),
                        installCurrency: result.getText({ name: 'custrecord_ig_currency', join: 'custrecord_ipc_install_grp' }),
                        installCost: Number(result.getValue({ name: 'custrecord_ig_cost', join: 'custrecord_ipc_install_grp' })),
                        installer: result.getValue({ name: 'custrecord_ipc_installer' }),
                        esri: result.getValue({ name: 'custrecord_ipc_esri' }),
                        ipcLifemode: Number(result.getValue({ name: 'custrecord_ipc_lifemode' }))
                    });
                    return true;
                });
            });
            log.debug('searchInstallZones', `install zones found: ${JSON.stringify(zones)}`);
        }
        return zones;
    }
    exports.searchInstallZones = searchInstallZones;
    function getShipType(type) {
        let shipType = '';
        switch (type) {
            case 'pickup':
                return '1';
            case 'delivery':
                return '2';
            case 'cashcarry':
                return '4';
            default:
                break;
        }
        return shipType;
    }
    function getDefaultWarehouse(recordID, subsidiary, zoneId, state, country, itemClass, shipType, colorTrampoline) {
        log.debug(`getDefaultWarehouse`, `rec id ${recordID}, args ${zoneId} ${state} ${country} ${shipType}.`);
        const states = getStates(country);
        const stateID = states[state];
        const filters = [
            ['isinactive', 'is', 'F'], 'and',
            ['custrecord_dw_subsidiary', 'anyof', subsidiary], 'and',
            ['custrecord_dw_shiptype', 'anyof', shipType], 'and',
            ['custrecord_dw_item_class', 'anyof', itemClass]
        ];
        if (country == 'NZ')
            filters.push('and', ['custrecord_dw_zone', 'anyof', zoneId]);
        else if (state && state.length > 0) { // Country != 'NZ'
            const states = getStates(country);
            const stateID = states[state];
            if (stateID)
                filters.push('and', ['custrecord_dw_state', 'anyof', stateID]);
        }
        log.debug(`getDefaultWarehouse`, `Rec id ${recordID}, running with Filters: ${JSON.stringify(filters)}.`);
        const warehouses = [];
        const ids = [];
        search.create({
            type: 'customrecord_default_location',
            filters,
            columns: [
                'custrecord_dw_state',
                'custrecord_dw_zone',
                'custrecord_dw_postcode',
                'custrecord_dw_warehouse',
                'custrecord_dw_country',
                'custrecord_dw_item_class',
                'custrecord_dw_color_warehouse' // [GOBASD-16]
            ]
        }).run().each(function (result) {
            const warehouseId = result.getValue('custrecord_dw_warehouse');
            const warehouseState = result.getText('custrecord_dw_state');
            const warehouseCountry = result.getText('custrecord_dw_country');
            const warehouseStateId = result.getValue('custrecord_dw_state');
            const warehouseStates = warehouseStateId.split(',');
            const warehouseCountryId = result.getValue('custrecord_dw_country');
            const zones = result.getValue('custrecord_dw_zone');
            const colorWarehouse = result.getValue('custrecord_dw_color_warehouse');
            const warehouse = colorTrampoline ? colorWarehouse : warehouseId; // [GOBASD-16]
            const warehouseObj = { warehouse, warehouseStateId, warehouseCountryId, warehouseState, warehouseCountry, zones };
            if (zones.includes(zoneId))
                warehouses.push(warehouseObj); // if the zone passes is in the arrays on the warehouse, push it in
            else if (warehouseStates.includes(stateID) && warehouseCountryId == exports.COUNTRIES[country].toString() && !ids.includes(warehouseObj.warehouse)) {
                ids.push(warehouseObj.warehouse);
                warehouses.push(warehouseObj);
            } // or if the state and country match. In original script, they query postal code but there are none assigned so no need to run that query.
            return true;
        });
        log.debug(`getDefaultWarehouse`, `Rec id ${recordID} default warehouses found: ${JSON.stringify(warehouses)}.`);
        return warehouses;
    }
    exports.getDefaultWarehouse = getDefaultWarehouse;
    // This runs on transactions - primarily sales orders, so that is what rec is here.
    function setDefaultWarehouses(rec, freightZones) {
        const subsidiary = rec.getValue({ fieldId: 'subsidiary' });
        const stateProvince = rec.getValue({ fieldId: 'shipstate' });
        const country = rec.getValue({ fieldId: 'shipcountry' });
        let warehouseFound = false;
        log.audit(`setDefaultWarehouses`, `Rec id ${rec.id}, freightzones: ${freightZones}.`);
        const forPickUp = rec.getValue({ fieldId: 'custbody_for_pickup' });
        const canPickup = freightZones.length == 1 && Number(freightZones[0].onlinePickupLocation) > 0;
        const pickupLocation = rec.getValue({ fieldId: 'custbody_pickup_location' });
        const excludedTypes = ['EndGroup', 'Discount', 'TaxItem', 'ShipItem']; //[GOBASD-21] Removed 'Service' per Rebecca's request
        for (let line = 0; line < rec.getLineCount({ sublistId: 'item' }); line++) {
            const itemType = rec.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line });
            if (excludedTypes.includes(itemType))
                continue;
            if (forPickUp && canPickup) {
                if (rec.isDynamic) {
                    rec.selectLine({ sublistId: 'item', line });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: pickupLocation, ignoreFieldChange: true });
                    rec.commitLine({ sublistId: 'item' });
                }
                else {
                    rec.setSublistValue({ sublistId: 'item', fieldId: 'location', value: pickupLocation, line });
                }
            }
            else {
                const item = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line });
                const itemTypeSearch = getItemType(itemType);
                if (!itemTypeSearch)
                    continue; // TODO: We may need to optimize this lookup if there are a lot of items on the order:
                const itemValues = search.lookupFields({ type: itemTypeSearch, id: item, columns: ['class', 'custitem_colour_trampoline'] }); // [GOBASD-16]
                log.debug('setDefaultWarehouses', `Looked up item ${item} values: ${JSON.stringify(itemValues)}.`);
                const coloured = itemValues.custitem_colour_trampoline;
                const itemClass = itemValues.class;
                if (!itemClass || itemClass.length == 0)
                    continue;
                const delivery = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_delivery', line });
                const pickup = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_pick_up', line });
                const cashNCarry = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_cash_n_carry', line });
                let shipMethod = getShipType('delivery');
                if (delivery)
                    shipMethod = getShipType('delivery');
                else if (pickup)
                    shipMethod = getShipType('pickup');
                else if (cashNCarry)
                    shipMethod = getShipType('cashcarry');
                if (freightZones.length != 1)
                    continue;
                const defaultWarehouse = getDefaultWarehouse((rec && rec.id && rec.id.toString()) || 'no id', subsidiary, freightZones[0].zoneid, stateProvince, country, itemClass[0].value, shipMethod, coloured);
                if (defaultWarehouse.length == 1) {
                    warehouseFound = true;
                    if (rec.isDynamic) {
                        rec.selectLine({ sublistId: 'item', line });
                        rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: defaultWarehouse[0].warehouse, ignoreFieldChange: true });
                        rec.commitLine({ sublistId: 'item' });
                    }
                    else {
                        log.audit(`setDefaultWarehouses`, `setting default warehouse on line for ${rec.id}, default warehouse id: ${defaultWarehouse[0].warehouse}`);
                        rec.setSublistValue({ sublistId: 'item', fieldId: 'location', value: defaultWarehouse[0].warehouse, line });
                    }
                }
                else if (defaultWarehouse.length > 1) {
                    log.audit(`setDefaultWarehouses`, `Multiple Default warehouses were found for line on ${rec.id}; zone id ${freightZones[0].zoneid}, stateProvince: ${stateProvince}, item clas ${itemClass[0].value}, shipmethod ${shipMethod}`);
                }
            }
        }
        if (!warehouseFound) {
            if (typeof alert != 'undefined')
                alert(`Default warehouse couldn't be found`);
            log.audit(`Default warehouses couldn't be found for ${rec.id}`, `No warehouses were found`);
        }
    }
    exports.setDefaultWarehouses = setDefaultWarehouses;
    function getItemType(itemType) {
        let type = search.Type.INVENTORY_ITEM;
        switch (itemType) {
            case 'Kit':
                type = search.Type.KIT_ITEM;
                break;
            case 'Assembly':
                type = search.Type.ASSEMBLY_ITEM;
                break;
            case 'NonInvtPart':
                type = search.Type.NON_INVENTORY_ITEM;
                break;
            case 'Service':
                type = search.Type.SERVICE_ITEM;
                break;
            case 'Discount':
                type = search.Type.DISCOUNT_ITEM;
                break;
            case 'GiftCert':
                type = search.Type.GIFT_CERTIFICATE;
                break;
            case 'InvtPart':
                type = search.Type.INVENTORY_ITEM;
                break;
            case 'Group':
                type = search.Type.ITEM_GROUP;
                break;
            case 'OthCharge':
                type = search.Type.OTHER_CHARGE_ITEM;
                break;
            case 'Payment':
                type = search.Type.PAYMENT_ITEM;
                break;
            default:
                break;
        }
        return type;
    }
    exports.getItemType = getItemType;
    function getPostCodeRecordFromAddress(zip, country, state) {
        const results = [];
        const searchObj = search.create({
            type: 'customrecord_post_code',
            filters: [
                search.createFilter({ name: 'isinactive', operator: search.Operator.IS, values: false }),
                search.createFilter({ name: 'custrecord_pc_country', operator: search.Operator.ANYOF, values: exports.COUNTRIES[country] }),
            ],
            columns: ['internalid']
        });
        if (zip && zip.length) {
            if (country == 'CA')
                searchObj.filters.push(search.createFilter({
                    name: 'custrecord_pc_post_code',
                    operator: search.Operator.STARTSWITH,
                    values: zip.length > 3 ? zip.substring(0, 3) : zip
                }));
            else
                searchObj.filters.push(search.createFilter({ name: 'custrecord_pc_post_code', operator: search.Operator.STARTSWITH, values: zip }));
        }
        if (state && state.length > 0 || country == 'CA') {
            const states = getStates(country);
            const stateID = states[state];
            searchObj.filters.push(search.createFilter({ name: 'custrecord_pc_state', operator: search.Operator.IS, values: Number(stateID) }));
        }
        searchObj.run().each(function (result) {
            results.push(result);
            return true;
        });
        return results;
    }
    exports.getPostCodeRecordFromAddress = getPostCodeRecordFromAddress;
    // replaces calculateFreightCost in PS_Lib_Fn_FreightInstall.js
    // which calls suitelet customscript_ps_sl_freight_costs PS: SL: Freight Costs calculateFreightCosts in PS_SL_FreightCosts.js
    function calculateFreightCosts(lines, itemIds, selectedFreightZone, zip, state, country) {
        let freightZone = Number(selectedFreightZone);
        if (freightZone < 1) {
            const freightZones = searchFreightZone(zip, state, country);
            if (freightZones.length == 1) {
                freightZone = Number(freightZones[0].recid);
            }
        }
        if (freightZone > 0) {
            const itemFreightCosts = searchItemFreightCosts(freightZone, itemIds);
            if (itemFreightCosts) {
                for (let line in lines) {
                    if (itemFreightCosts[line]) {
                        lines[line].cost = itemFreightCosts[line].cost * lines[line].qty;
                        lines[line].solo = itemFreightCosts[line].solo;
                        lines[line].currency = itemFreightCosts[line].currency;
                    }
                }
                return lines;
            }
        }
        return null;
    }
    exports.calculateFreightCosts = calculateFreightCosts;
    function searchItemFreightCosts(freightzone, items) {
        const resp = {};
        log.debug(`freight zone ${freightzone}`, items);
        const searchObj = search.create({
            type: 'customrecord_zone_freight_cost',
            filters: [
                { name: 'isinactive', operator: 'is', values: false },
                { name: 'custrecord_zfc_zone_list', operator: 'is', values: freightzone },
                { name: 'custrecord_zfc_item', operator: 'anyof', values: [items] }
            ],
            columns: ['custrecord_zfc_cost', 'custrecord_zfc_item', 'custrecord_zfc_currency', 'custrecord_zfc_solo_ship_cost']
        });
        log.debug('results', searchObj.runPaged().count);
        searchObj.run().each(function (result) {
            const item = result.getValue('custrecord_zfc_item');
            if (!resp[item]) {
                resp[item] = {
                    item: Number(item),
                    currency: result.getText('custrecord_zfc_currency'),
                    cost: Number(result.getValue('custrecord_zfc_cost')),
                    solo: result.getValue('custrecord_zfc_solo_ship_cost')
                };
            }
            return true;
        });
        return Object.keys(resp).length === 0 ? null : resp;
    }
    exports.searchItemFreightCosts = searchItemFreightCosts;
    function setFreightAndInstallDefaultsOnCustomerRecord(customerRecord, defaultShipAddress) {
        const fieldsToUpdate = {};
        let postalcode = defaultShipAddress.zip;
        let stateProvince = defaultShipAddress.state;
        let country = defaultShipAddress.country;
        const freightZone = customerRecord.getValue('custentity_freight_zone_list');
        const installGroup = customerRecord.getValue('custentity_install_group');
        const installer = customerRecord.getValue('custentity_installer');
        const ESRI = Number(customerRecord.getValue('custentity_esri'));
        const lifemodeSegment = Number(customerRecord.getValue('custentity_lifemode_segment'));
        if (postalcode.length > 0 && country.length > 0) {
            const freigthZoneLookup = searchFreightZone(postalcode, stateProvince, country);
            if (freigthZoneLookup.length == 1) {
                if (freigthZoneLookup[0].zoneid != freightZone) {
                    fieldsToUpdate['custentity_freight_zone_list'] = freigthZoneLookup[0].zoneid;
                }
            }
            else {
                fieldsToUpdate['custentity_freight_zone_list'] = '';
            }
            const installZonesLookup = searchInstallZones(postalcode, stateProvince, country);
            if (installZonesLookup.length == 1) {
                if (installZonesLookup[0].installGroupId != installGroup)
                    fieldsToUpdate['custentity_install_group'] = installZonesLookup[0].installGroupId;
                if (installZonesLookup[0].installer != installer)
                    fieldsToUpdate['custentity_installer'] = installZonesLookup[0].installer;
                if (installZonesLookup[0].ipcLifemode != lifemodeSegment)
                    fieldsToUpdate['custentity_lifemode_segment'] = installZonesLookup[0].ipcLifemode;
                if ((!ESRI && installZonesLookup[0].esri) || (ESRI && !installZonesLookup[0].esri))
                    fieldsToUpdate['custentity_esri'] = installZonesLookup[0].esri;
            }
            else { // if no match then we clear the data
                fieldsToUpdate['custentity_install_group'] = '';
                fieldsToUpdate['custentity_installer'] = '';
                fieldsToUpdate['custentity_lifemode_segment'] = '';
                fieldsToUpdate['custentity_esri'] = false;
            }
            if (Object.keys(fieldsToUpdate).length > 0) {
                /*record.submitFields({
                 type  : customerRecord.type,
                 id    : customerRecord.id,
                 values: fieldsToUpdate
                 })*/
                for (let key in fieldsToUpdate) {
                    customerRecord.setValue({ fieldId: key, value: fieldsToUpdate[key] });
                }
            }
        }
    }
    exports.setFreightAndInstallDefaultsOnCustomerRecord = setFreightAndInstallDefaultsOnCustomerRecord;
    function getCustomerDefaultAddress(customer) {
        const match = customer.findSublistLineWithValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
        if (match > -1) {
            const address = customer.getSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress', line: match });
            return {
                city: address.getValue({ fieldId: 'city' }),
                state: address.getValue({ fieldId: 'state' }),
                zip: address.getValue({ fieldId: 'zip' }),
                country: address.getValue({ fieldId: 'country' })
            };
        }
        return null;
    }
    exports.getCustomerDefaultAddress = getCustomerDefaultAddress;
    function runInSubsidiary(subsidiary) {
        return ['1', '3', '4', '5'].indexOf(subsidiary) > -1;
    }
    exports.runInSubsidiary = runInSubsidiary;
    return exports;
});
