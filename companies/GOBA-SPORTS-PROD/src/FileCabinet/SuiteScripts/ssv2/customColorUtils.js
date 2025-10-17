/**
 * customColorUtils.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NApiVersion 2.1
 */
define(["N/https", "N/log", "N/runtime"], function (https, log, runtime) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nets = exports.nsSpecificToItHands = exports.itHandsToNSSpecific = exports.itHandsToNS = exports.jsonToPartList = exports.partListToJSON = exports.fetchOrderFromITHands = exports.getLocationFromSubsidiary = exports.WAREHOUSES = exports.IT_HANDS_ORDER_KEY = exports.PRODUCTION_API_CA = exports.PRODUCTION_API_AU = exports.PRODUCTION_API_US = exports.SANDBOX_API_CA = exports.SANDBOX_API_AU = exports.SANDBOX_API_US = exports.CUSTOM_TRAMPOLINE = void 0;
    exports.CUSTOM_TRAMPOLINE = 110168;
    exports.SANDBOX_API_US = 'https://customdev.springfreetrampoline.com/api/orderDetails/';
    exports.SANDBOX_API_AU = 'https://customdev.springfreetrampoline.com.au/api/orderDetails/';
    exports.SANDBOX_API_CA = 'https://customdev.springfreetrampoline.ca/api/orderDetails/';
    exports.PRODUCTION_API_US = 'https://custom.springfreetrampoline.com/api/orderDetails/';
    exports.PRODUCTION_API_AU = 'https://custom.springfreetrampoline.com.au/api/orderDetails/';
    exports.PRODUCTION_API_CA = 'https://custom.springfreetrampoline.ca/api/orderDetails/';
    exports.IT_HANDS_ORDER_KEY = 'custcol_ctid';
    exports.WAREHOUSES = {
        'US': 139,
        'CA': 1,
        'AU': 0,
    };
    function getLocationFromSubsidiary(subsidiary) {
        switch (subsidiary) {
            case '1':
                return exports.WAREHOUSES.AU;
            case '4':
                return exports.WAREHOUSES.CA;
            case '3':
                return exports.WAREHOUSES.US;
            default:
                return 0;
        }
    }
    exports.getLocationFromSubsidiary = getLocationFromSubsidiary;
    function fetchOrderFromITHands(id, subsidiary) {
        const isSandbox = runtime.envType == runtime.EnvType.SANDBOX;
        let url = isSandbox ? exports.SANDBOX_API_US : exports.PRODUCTION_API_US;
        if (subsidiary == 1)
            url = isSandbox ? exports.SANDBOX_API_AU : exports.PRODUCTION_API_AU;
        if (subsidiary == 4)
            url = isSandbox ? exports.SANDBOX_API_CA : exports.PRODUCTION_API_CA;
        const resp = https.get({ url: `${url}${id}` });
        const body = JSON.parse(resp.body);
        log.debug(`fetching Order Data from ID hands for subsidiary ${subsidiary}`, `url ${url}${id}`);
        if (resp.body && resp.body.length > 0)
            log.debug('fetchOrderFromITHands', resp.body);
        return body;
    }
    exports.fetchOrderFromITHands = fetchOrderFromITHands;
    exports.partListToJSON = {
        '1': 'legs',
        '2': 'frame',
        '3': 'mat_rods',
        '4': 'enclosure_rods'
    };
    exports.jsonToPartList = {
        'legs': '1',
        'frame': '2',
        'mat_rods': '3',
        'enclosure_rods': '4'
    };
    exports.itHandsToNS = {
        'legs': 'legs',
        'frame': 'frame',
        'mat_rods': 'mat rods',
        'enclosure_rods': 'net rods'
    };
    exports.itHandsToNSSpecific = {
        'legs': ['legs - straight', 'legs - curved'],
        'frame': ['frame - curved', 'frame - straight'],
        'mat_rods': 'mat rods',
        'enclosure_rods': 'enclosure rods'
    };
    exports.nsSpecificToItHands = {
        'legs - straight': 'legs',
        'legs - curved': 'legs',
        'frame - curved': 'frame',
        'frame - straight': 'frame',
        'mat rods': 'mat_rods',
        'enclosure rods': 'enclosure_rods'
    };
    exports.nets = {};
    return exports;
});
