/**
 * @NScriptName Aged Inventory Report - Scheduled
 * @NScriptId _agedinventory_scheduled
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(["N/email", "N/file", "N/format", "N/log", "N/search", "N/runtime"], function (email, file, format, log, search, runtime) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function execute() {
        var items = getItemsWithInventory();
        items = mergeInInventoryTransactions(items);
        items = organizeDataByAge(items);
        // Put together a CSV
        var csv = "Item, Description, Class, Season, Brand, Last Receipt Date, Location, Qty Less Than 1 Yr, Value Less Than 1 Yr, Qty 1-2 Yrs, Value 1-2 Yrs, Qty 2 Yrs+, Value 2 Yrs+\n";
        var _loop_1 = function (itemId) {
            items[itemId].locations.forEach(function (locationValues) {
                var totalquantity = locationValues.periodQty[0] + locationValues.periodQty[1] + locationValues.periodQty[2];
                if (totalquantity > 0) {
                    csv += items[itemId].name + ",";
                    csv += items[itemId].description + ",";
                    csv += items[itemId].itemClass + ",";
                    csv += items[itemId].season + ",";
                    csv += items[itemId].brand + ",";
                    csv += locationValues.lastReceiptDate + ",";
                    csv += locationValues.locationName + ",";
                    csv += locationValues.periodQty[2].toFixed(2) + ",";
                    csv += locationValues.periodValues[2].toFixed(2) + ",";
                    csv += locationValues.periodQty[1].toFixed(2) + ",";
                    csv += locationValues.periodValues[1].toFixed(2) + ",";
                    csv += locationValues.periodQty[0].toFixed(2) + ",";
                    csv += locationValues.periodValues[0].toFixed(2) + "\n";
                }
            });
        };
        for (var itemId in items) {
            _loop_1(itemId);
        }
        var csvFile = file.create({ fileType: file.Type.CSV, contents: csv, name: 'AgedInventory.csv' });
        email.send({
            author: 10,
            recipients: [10, 949],
            subject: "Aged Inventory Report",
            body: 'This an an automated email from the NetSuite Script "Aged Inventory Report - Scheduled". See Attached.',
            attachments: [csvFile]
        });
        log.audit("Done", "Email Sent!");
    }
    exports.execute = execute;
    function getItemsWithInventory() {
        // First find items with inventory
        var itemCount = 0;
        var items = {};
        var testItem = runtime.getCurrentScript().getParameter({ name: 'custscript_agedinventory_testitem' });
        var filters = [
            ['isinactive', 'is', 'F'], 'and',
            ['type', 'anyof', 'Assembly', 'InvtPart'], 'and',
            ['locationquantityonhand', 'greaterthan', '0']
        ];
        if (testItem)
            filters.push('and', ['internalid', 'anyof', testItem]);
        var inStockResults = getAllResults(search.create({
            type: 'item',
            filters: filters,
            columns: ['inventorylocation', 'locationquantityonhand', 'itemid', 'salesdescription', 'class', 'custitem_season', 'custitem_rmp_brand']
        }));
        inStockResults.forEach(function (result) {
            var name = result.getValue('itemid');
            var locationId = result.getValue('inventorylocation');
            var locationName = result.getText('inventorylocation');
            var originalDescription = result.getValue('salesdescription');
            var description = originalDescription.replace(/,/g, '');
            var itemClass = result.getText('class');
            var season = result.getValue('custitem_season');
            var brand = result.getText('custitem_rmp_brand');
            if (!items[result.id]) {
                items[result.id] = { name: name, description: description, itemClass: itemClass, locations: [], season: season, brand: brand };
                itemCount++;
            }
            var locationIndex = -1;
            for (var i = 0; i < items[result.id].locations.length; i++) {
                if (items[result.id].locations[i].locationId == locationId) {
                    locationIndex = i;
                    break;
                }
            }
            if (!~locationIndex)
                locationIndex = items[result.id].locations.length;
            items[result.id].locations.push({ lastReceiptDate: '', locationId: locationId, locationName: locationName, onHand: 0, periodQty: [0, 0, 0], periodValues: [0, 0, 0], receipts: [] });
            items[result.id].locations[locationIndex].onHand = Number(result.getValue('locationquantityonhand'));
            return true;
        });
        log.audit('Running - Items Found', itemCount);
        return items;
    }
    function mergeInInventoryTransactions(items) {
        var searchId = runtime.getCurrentScript().getParameter({ name: 'custscript_agedinventory_savedsearch' });
        var testItem = runtime.getCurrentScript().getParameter({ name: 'custscript_agedinventory_testitem' });
        var tranSearch = search.load({ id: searchId });
        if (testItem)
            tranSearch.filterExpression = tranSearch.filterExpression.concat(['and', ['item', 'anyof', testItem]]);
        var results = getAllResults(tranSearch);
        log.audit('Transaction Results Found', results.length);
        results.forEach(function (result) {
            var currency = result.getValue({ name: 'currency', summary: search.Summary.GROUP });
            var tranDate = result.getValue({ name: 'trandate', summary: search.Summary.GROUP });
            var itemId = result.getValue({ name: 'item', summary: search.Summary.GROUP });
            var name = result.getText({ name: 'item', summary: search.Summary.GROUP });
            var locationId = result.getValue({ name: 'location', summary: search.Summary.GROUP });
            var locationName = result.getText({ name: 'location', summary: search.Summary.GROUP });
            var quantity = Number(result.getValue({ name: 'formulanumeric', summary: search.Summary.MAX }));
            //const ogAmount      = Number(result.getValue({ name: 'fxamount', summary: search.Summary.MAX }));
            var ogAmount = Number(result.getValue(result.columns[7]));
            var duty = Number(result.getValue(result.columns[8]));
            var freight = Number(result.getValue(result.columns[9]));
            var amount = ogAmount + duty + freight;
            var rate = amount / quantity;
            var exRate = Number(result.getValue({ name: 'exchangerate', summary: search.Summary.MAX }));
            var date = format.parse({ type: format.Type.DATE, value: tranDate });
            var itemClass = result.getText({ name: "class", join: "item", summary: search.Summary.GROUP });
            var season = result.getValue({ name: "custitem_season", join: "item", summary: search.Summary.GROUP });
            var brand = result.getValue({ name: "custitem_rmp_brand", join: "item", summary: search.Summary.GROUP });
            var locationIndex = -1;
            if (!items[itemId]) {
                items[itemId] = { name: name, description: '', itemClass: itemClass, locations: [], season: season };
            }
            for (var i = 0; i < items[itemId].locations.length; i++) {
                if (items[itemId].locations[i].locationId == locationId) {
                    locationIndex = i;
                    break;
                }
            }
            if (!~locationIndex) {
                locationIndex = items[itemId].locations.length;
                items[itemId].locations.push({ lastReceiptDate: tranDate, locationId: locationId, locationName: locationName, onHand: 0, periodQty: [0, 0, 0], periodValues: [0, 0, 0], receipts: [] });
            }
            if (items[itemId].locations[locationIndex].lastReceiptDate) {
                var locationLastReceiptDate = format.parse({ type: format.Type.DATE, value: items[itemId].locations[locationIndex].lastReceiptDate });
                if (locationLastReceiptDate.getTime() < date.getTime()) {
                    items[itemId].locations[locationIndex].lastReceiptDate = tranDate;
                }
            }
            else {
                items[itemId].locations[locationIndex].lastReceiptDate = tranDate;
            }
            if (quantity > 0 && items[itemId]) {
                log.audit("Item " + itemId + ", Location " + locationId, "Tracking Receipt " + JSON.stringify({ date: date, quantity: quantity, rate: rate, currency: currency }));
                items[itemId].locations[locationIndex].receipts.push({ date: date, quantity: quantity, rate: rate, currency: currency, exRate: exRate });
            }
        });
        return items;
    }
    /** Organize the data into groups by age (+2 years, 1-2 years, and < 1 year) */
    function organizeDataByAge(items) {
        var today = new Date(); // Fri Oct 20 2017 10:06:19 GMT+0100 (BST)
        today.setHours(0, 0, 0, 0);
        var oneDay = 60 * 60 * 24 * 1000;
        var oneYearAgo = new Date(today.getTime() - oneDay * 365);
        var twoYearsAgo = new Date(today.getTime() - oneDay * 730);
        // const usdExchange = currency.exchangeRate({ source: 'USD', target: 'CAD', date: today });
        for (var itemId in items) {
            items[itemId].locations.forEach(function (locationValues) {
                locationValues.receipts.forEach(function (receipt) {
                    var onHandRemaining = locationValues.onHand;
                    if (!onHandRemaining)
                        return;
                    if (receipt.quantity > onHandRemaining)
                        receipt.quantity = onHandRemaining;
                    var itemRate = receipt.currency == '2' ? receipt.rate * receipt.exRate : receipt.rate;
                    // log.debug('Comparing dates', `tran date ${receipt.date}, One Year Ago ${oneYearAgo}, Two Years Ago ${twoYearsAgo}`);
                    if (receipt.date.getTime() > oneYearAgo.getTime()) {
                        locationValues.periodQty[2] += receipt.quantity;
                        locationValues.periodValues[2] += receipt.quantity * itemRate;
                    }
                    else if (receipt.date.getTime() >= twoYearsAgo.getTime()) {
                        locationValues.periodQty[1] += receipt.quantity;
                        locationValues.periodValues[1] += receipt.quantity * itemRate;
                    }
                    else {
                        locationValues.periodQty[0] += receipt.quantity;
                        locationValues.periodValues[0] += receipt.quantity * itemRate;
                    }
                    log.debug('Setting Values', "On Hand " + locationValues.onHand + ", Receipt quantity " + receipt.quantity + ", Rate " + itemRate);
                    locationValues.onHand -= receipt.quantity; // Update the on hand remaining for this location
                    // log.debug('New On Hand Qty Remaining', `Subtracted ${receipt.qty} from item ${itemId} location ${receipt.location}, On Hand is now ${items[itemId].onHand[receipt.location]}`);
                });
            });
        }
        return items;
    }
    function getAllResults(searchObj) {
        var results = [];
        var resultSet = searchObj.run();
        if (resultSet) {
            var tempResults = resultSet.getRange({ start: results.length, end: results.length + 1000 });
            while (tempResults && tempResults.length > 0) {
                results = results.concat(tempResults);
                log.debug('Getting all results...', "Results found: " + results.length + ".");
                tempResults = resultSet.getRange({ start: results.length, end: results.length + 1000 });
            }
        }
        return results;
    }
    return exports;
});
