/**
 * zoneLookup.ts
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
    const ERR_MISSING_REQUIRED_PARAMETERS = {
        success: false,
        responseText: JSON.stringify({
            errorMessage: "There are required parameters or configurations missing from this script. Please check with your developer.",
            response_code: "ERR_MISSING_REQUIRED_ARGUMENTS"
        }),
        response_code: "ERR_MISSING_REQUIRED_ARGUMENTS"
    };
    const ERR_METHOD_NOT_ALLOWED = {
        success: false,
        responseText: JSON.stringify({ errorMessage: "Method not allowed.", response_code: "ERR_METHOD_NOT_ALLOWED" }),
        response_code: "ERR_METHOD_NOT_ALLOWED"
    };
    function onRequest(context) {
        const method = context.request.method;
        if (method == 'GET') {
            const action = context.request.parameters['action'];
            const countries = ['AU', 'US', 'CA', 'NZ'];
            const country = context.request.parameters['country']; // AU, US, CA & NZ are valid options
            const page = Number(context.request.parameters['page']) || 1;
            let numberPerPage = Number(context.request.parameters['perpage']) || 4000;
            const runPaged = false;
            if (numberPerPage > 4000)
                numberPerPage = 4000; // don't allow more than NS max
            log.audit('GET', `country: ${country}, action: ${action}`);
            if (action && country && countries.includes(country)) {
                let output;
                switch (action) {
                    case 'install_post_codes':
                        // Install Post Code (if the postal code is listed and has an "Install group", install is available)
                        output = getInstallPostCodeRecords(country, runPaged, page, numberPerPage);
                        log.debug('output', output);
                        break;
                    case 'zone_post_codes': // Zone Post Code
                        output = getZonePostCodeRecords(country, runPaged, page, numberPerPage);
                        break;
                    case 'installation_group': // Installation Group
                        output = getInstallGroupRecords(country, runPaged, page, numberPerPage);
                        break;
                    case 'freight_zone_cost': // Zone Freight Cost
                        output = getZoneFreightCostRecords(country, runPaged, page, numberPerPage);
                        break;
                    case 'locations': // pick up locations
                        output = getPickupLocations(country);
                        break;
                    default:
                        log.error({ title: 'Script Failed', details: 'parameters are missing.' });
                        output = ERR_MISSING_REQUIRED_PARAMETERS;
                        break;
                }
                context.response.write({ output: JSON.stringify(output) });
                return;
            }
            else {
                context.response.write({ output: JSON.stringify(ERR_MISSING_REQUIRED_PARAMETERS) });
                return;
            }
        }
        else {
            context.response.write({ output: JSON.stringify(ERR_METHOD_NOT_ALLOWED) });
            return;
        }
    }
    exports.onRequest = onRequest;
    function getInstallPostCodeRecords(country, runPaged, pageNumber, numberPerPage) {
        const results = [];
        const searchObj = search.create({
            type: 'customrecord_install_post_code',
            filters: [{ name: 'isinactive', operator: 'is', values: false },
                { name: 'custrecord_ipc_country', operator: 'is', values: freightAndInstallZoneUtils_1.COUNTRIES[country] },
                { name: 'custrecord_ipc_install_grp', operator: 'noneof', values: '@NONE@' }
            ],
            columns: [
                search.createColumn({ name: 'internalid', sort: search.Sort.ASC }),
                search.createColumn({ name: 'custrecord_ipc_postcode' }),
                search.createColumn({ name: 'custrecord_ipc_country' }),
                search.createColumn({ name: 'custrecord_ipc_installer' }),
                search.createColumn({ name: 'custrecord_ipc_install_grp' }),
                search.createColumn({ name: 'custrecord_ipc_state_province' })
            ]
        });
        log.debug('getInstallPostCodeRecords', `Filters: ${JSON.stringify(searchObj.filters)}`);
        const pageData = searchObj.runPaged({ pageSize: numberPerPage });
        if (runPaged) {
            pageData.pageRanges.forEach(function (pageRange) {
                const pageIndex = pageRange.index + 1;
                if (pageIndex == pageNumber) {
                    const page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(function (result) {
                        results.push(toInstallPostCodeResult(result));
                        return true;
                    });
                }
            });
        }
        else {
            pageData.pageRanges.forEach(function (pageRange) {
                const page = pageData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    results.push(toInstallPostCodeResult(result));
                    return true;
                });
            });
        }
        return results;
    }
    function getInstallGroupRecords(country, runPaged, pageNumber, numberPerPage) {
        const results = [];
        const searchObj = search.create({
            type: 'customrecord_install_group',
            filters: [{ name: 'isinactive', operator: 'is', values: false },
                { name: 'custrecord_ig_country', operator: 'is', values: freightAndInstallZoneUtils_1.COUNTRIES[country] }
            ],
            columns: ['name', 'custrecord_ig_cost', 'custrecord_ig_installmsg']
        });
        const pageData = searchObj.runPaged({ pageSize: numberPerPage });
        if (runPaged) {
            pageData.pageRanges.forEach(function (pageRange) {
                const pageIndex = pageRange.index + 1;
                if (pageIndex == pageNumber) {
                    const page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(function (result) {
                        results.push(toInstallGroupResult(result));
                        return true;
                    });
                }
            });
        }
        else {
            pageData.pageRanges.forEach(function (pageRange) {
                const page = pageData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    results.push(toInstallGroupResult(result));
                    return true;
                });
            });
        }
        return results;
    }
    function getZonePostCodeRecords(country, runPaged, pageNumber, numberPerPage) {
        const results = [];
        if (freightAndInstallZoneUtils_1.COUNTRIES[country]) {
            const searchObj = search.create({
                type: 'customrecord_zone_post_code',
                filters: [{ name: 'isinactive', operator: 'is', values: false },
                    { name: 'custrecord_zpc_country', operator: 'is', values: freightAndInstallZoneUtils_1.COUNTRIES[country] }
                ],
                columns: ['custrecord_zpc_zone_list', 'custrecord_zpc_country', 'custrecord_zpc_postcode', 'custrecord_zpc_state_province', 'custrecord_zpc_delivery', 'custrecord_zpc_online_pickup_location']
            });
            const pageData = searchObj.runPaged({ pageSize: numberPerPage });
            if (runPaged) {
                pageData.pageRanges.forEach(function (pageRange) {
                    const pageIndex = pageRange.index + 1;
                    if (pageIndex == pageNumber) {
                        const page = pageData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            results.push(toZonePostCodeResult(result));
                            return true;
                        });
                    }
                });
            }
            else {
                pageData.pageRanges.forEach(function (pageRange) {
                    const page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(function (result) {
                        results.push(toZonePostCodeResult(result));
                        return true;
                    });
                });
            }
        }
        return results;
    }
    function getZoneFreightCostRecords(country, runPaged, pageNumber, numberPerPage) {
        const results = [];
        const searchObj = search.create({
            type: 'customrecord_zone_freight_cost',
            filters: [{ name: 'isinactive', operator: 'is', values: false },
                { name: 'custrecord_zfc_country', operator: 'is', values: freightAndInstallZoneUtils_1.COUNTRIES[country] }
            ],
            columns: ['custrecord_zfc_zone_list', 'custrecord_zfc_item', 'custrecord_zfc_cost']
        });
        const pageData = searchObj.runPaged({ pageSize: numberPerPage });
        if (runPaged) {
            pageData.pageRanges.forEach(function (pageRange) {
                const pageIndex = pageRange.index + 1;
                if (pageIndex == pageNumber) {
                    const page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(function (result) {
                        results.push(toZoneFreightCostResult(result));
                        return true;
                    });
                }
            });
        }
        else {
            pageData.pageRanges.forEach(function (pageRange) {
                const page = pageData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    results.push(toZoneFreightCostResult(result));
                    return true;
                });
            });
        }
        return results;
    }
    function getPickupLocations(country) {
        const locationIds = [];
        const results = [];
        if (freightAndInstallZoneUtils_1.COUNTRIES[country]) {
            const locationSearch = search.create({
                type: 'customrecord_zone_post_code',
                filters: [
                    { name: 'isinactive', operator: 'is', values: false },
                    { name: 'custrecord_zpc_country', operator: 'is', values: freightAndInstallZoneUtils_1.COUNTRIES[country] }
                ],
                columns: ['custrecord_zpc_online_pickup_location']
            });
            const pageData = locationSearch.runPaged({ pageSize: 1000 });
            pageData.pageRanges.forEach(function (pageRange) {
                const page = pageData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    const location = Number(result.getValue('custrecord_zpc_online_pickup_location'));
                    if (location > 0 && !locationIds.includes(location))
                        locationIds.push(location); // [GOBASD-38]
                    return true;
                });
            });
            log.debug('getPickupLocations', `locationIds: ${JSON.stringify(locationIds)}`);
            if (locationIds.length < 1)
                return [];
            const searchObj = search.create({
                type: search.Type.LOCATION,
                filters: [
                    { name: 'isinactive', operator: 'is', values: false },
                    { name: 'internalid', operator: 'anyof', values: locationIds }
                ],
                columns: ['address.address']
            });
            const locationPages = searchObj.runPaged({ pageSize: 1000 });
            locationPages.pageRanges.forEach(function (pageRange) {
                const page = locationPages.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    results.push(toLocationResult(result));
                    return true;
                });
            });
        }
        return results;
    }
    const toInstallPostCodeResult = function (result) {
        return {
            internalid: Number(result.id),
            country: result.getText({ name: 'custrecord_ipc_country' }),
            installGroupID: Number(result.getValue({ name: 'custrecord_ipc_install_grp' })),
            installGroup: result.getText({ name: 'custrecord_ipc_install_grp' }),
            installer: result.getValue({ name: 'custrecord_ipc_installer' }),
            postcode: result.getValue({ name: 'custrecord_ipc_postcode' }),
            state: Number(result.getValue({ name: 'custrecord_ipc_state_province' })),
            stateName: result.getText({ name: 'custrecord_ipc_state_province' })
        };
    };
    const toInstallGroupResult = function (result) {
        return {
            internalid: Number(result.id),
            installCost: Number(result.getValue({ name: 'custrecord_ig_cost' })),
            installMessaging: result.getValue({ name: 'custrecord_ig_installmsg' }),
            name: result.getValue({ name: 'name' }),
        };
    };
    const toZonePostCodeResult = function (result) {
        return {
            internalid: Number(result.id),
            freightZoneID: Number(result.getValue({ name: 'custrecord_zpc_zone_list' })),
            freightZone: result.getText({ name: 'custrecord_zpc_zone_list' }),
            country: result.getText({ name: 'custrecord_zpc_country' }),
            postcode: result.getValue({ name: 'custrecord_zpc_postcode' }),
            state: Number(result.getValue({ name: 'custrecord_zpc_state_province' })),
            stateName: result.getText({ name: 'custrecord_zpc_state_province' }),
            deliveryAvailable: result.getValue({ name: 'custrecord_zpc_delivery' }),
            onlinePickupLocation: Number(result.getValue({ name: 'custrecord_zpc_online_pickup_location' }))
        };
    };
    const toZoneFreightCostResult = function (result) {
        return {
            internalid: Number(result.id),
            freightZoneID: Number(result.getValue({ name: 'custrecord_zfc_zone_list' })),
            freightZone: result.getText({ name: 'custrecord_zfc_zone_list' }),
            itemID: Number(result.getValue({ name: 'custrecord_zfc_item' })),
            item: result.getText({ name: 'custrecord_zfc_item' }),
            cost: Number(result.getValue({ name: 'custrecord_zfc_cost' }))
        };
    };
    const toLocationResult = function (result) {
        return {
            internalid: Number(result.id),
            addressText: result.getValue({ name: 'address', join: 'address' })
        };
    };
    return exports;
});
