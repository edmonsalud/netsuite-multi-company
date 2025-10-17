/**
 * agedInventoryMapReduce.ts
 * © 2018 Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Aged Inventory - Map/Reduce
 * @NScriptType MapReduceScript
 * @NApiVersion 2.x
 */
define(["N/log", "N/file", "N/email", "N/runtime", "N/search"], function (log, file, email, runtime, search) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Look up which items to run this on */
    exports.getInputData = function () {
        var returnObjects = [];
        try {
            var itemDetails = getItemDetails();
            // Figure out how many results to expect
            var tranSearchId = runtime.getCurrentScript().getParameter({ name: 'custscript_agedinventory_transearch' });
            var summarySearch = search.load({ id: tranSearchId });
            // summarySearch.filterExpression = summarySearch.filterExpression.concat(['and', ['item', 'anyof', itemDetails.itemIds]]);
            // summarySearch.filterExpression = summarySearch.filterExpression.concat(['and', ['location', 'anyof', itemDetails.locations]]);
            if (itemDetails.itemIds.length < 1000) { // Otherwise don't bother filtering
                var itemLocFilters = [];
                for (var locId in itemDetails.itemsByLoc) {
                    if (itemLocFilters.length > 0)
                        itemLocFilters.push('or');
                    log.debug('getInputSummary', "Adding filter for location " + locId + " with " + itemDetails.itemsByLoc[locId].length + " items.");
                    itemLocFilters.push([['item', 'anyof', itemDetails.itemsByLoc[locId]], 'and', ['location', 'anyof', locId]]);
                }
                // log.debug('Item Location Filters', JSON.stringify(itemLocFilters));
                summarySearch.filterExpression = summarySearch.filterExpression.concat(['and', itemLocFilters]);
            }
            summarySearch.columns = [search.createColumn({ name: 'formulanumeric', formula: '1', summary: search.Summary.SUM })];
            var summaryResults = summarySearch.run().getRange({ start: 0, end: 1 });
            var resultCount = Number(summaryResults[0].getValue({ name: 'formulanumeric', summary: search.Summary.SUM }));
            var resultSetCount = resultCount / 1000;
            // const returnObjects: { resultRange: { start: number, end: number }, locations: string[], itemIds: string[] }[] = [];
            // for (let i = 0; i < resultSetCount; i++) {
            //   returnObjects.push({ resultRange: { start: 1000 * i, end: 1000 * (i + 1) }, locations: itemDetails.locations, itemIds: itemDetails.itemIds });
            // }
            for (var i = 0; i < resultSetCount; i++) {
                returnObjects.push({ resultRange: { start: 1000 * i, end: 1000 * (i + 1) }, itemsByLoc: itemDetails.itemsByLoc, itemIds: itemDetails.itemIds });
            }
        }
        catch (e) {
            log.error('getInputSummary', e.message);
        }
        log.audit('getInputData', "Result Sets returned: " + returnObjects.length + ".");
        return returnObjects;
    };
    // Get 1000 transaction results
    exports.reduce = function (context) {
        try {
            // const input      = JSON.parse(context.values[0]) as { resultRange: { start: number, end: number }, itemsData: ItemInventory[], locations: string[], itemIds: string[] };
            var input = JSON.parse(context.values[0]);
            var tranSearchId = runtime.getCurrentScript().getParameter({ name: 'custscript_agedinventory_transearch' });
            var tranSearch = search.load({ id: tranSearchId }); // Default is: [Script] Aged Inventory Transactions
            log.debug('reduce', "Key " + context.key + ", Getting results " + JSON.stringify(input.resultRange) + ".");
            // if (input.itemIds.length <= 1000) // Otherwise don't even bother filtering the transactions by item.
            // tranSearch.filterExpression = tranSearch.filterExpression.concat(['and', ['item', 'anyof', input.itemIds]]);
            if (input.itemIds.length < 1000) { // Otherwise don't bother filtering
                var itemLocFilters = [];
                for (var locId in input.itemsByLoc) {
                    if (itemLocFilters.length > 0)
                        itemLocFilters.push('or');
                    log.debug('reduce', "Key " + context.key + " - adding filter for location " + locId + " with " + input.itemsByLoc[locId].length + " items.");
                    itemLocFilters.push([['item', 'anyof', input.itemsByLoc[locId]], 'and', ['location', 'anyof', locId]]);
                }
                tranSearch.filterExpression = tranSearch.filterExpression.concat(['and', itemLocFilters]);
            }
            // tranSearch.filterExpression = tranSearch.filterExpression.concat(['and', ['location', 'anyof', input.locations]]);
            var stockResults_1 = [];
            var searchResults = tranSearch.run().getRange(input.resultRange);
            searchResults.forEach(function (result) {
                var itemId = result.getValue('item');
                var quantity = result.getValue('quantity');
                var type = result.getValue('type');
                var location = result.getValue('location');
                var value = result.getValue('formulacurrency');
                var date = result.getValue('trandate');
                stockResults_1.push({ itemId: itemId, quantity: quantity, type: type, location: location, value: value, date: date });
            });
            log.audit('reduce', "Finished key " + context.key + ", Results: " + stockResults_1.length + " Results size: " + JSON.stringify(searchResults).length + " bytes; new size: " + JSON.stringify(stockResults_1).length + " bytes.");
            context.write(context.key, JSON.stringify(stockResults_1));
        }
        catch (e) {
            log.error('reduce', e.message);
        }
    };
    exports.summarize = function (context) {
        var itemDetails = getItemDetails();
        var items = itemDetails.items;
        // Put together all our stock results
        var resultSets = []; // We use this to sort the results we get back so the order will be as they were in the search; not key order (1, 10, 100, 2, etc.)
        var stockResults = [];
        context.output.iterator().each(function (key, value) {
            log.audit('summarize', "Concatenating search results from reduce key " + key + ".");
            // stockResults = stockResults.concat(JSON.parse(value));
            resultSets[Number(key)] = JSON.parse(value);
            return true;
        });
        for (var _i = 0, resultSets_1 = resultSets; _i < resultSets_1.length; _i++) { // Put them back in the correct sequence
            var resultSet = resultSets_1[_i];
            stockResults = stockResults.concat(resultSet);
        }
        log.audit('summarize', "Transactions: " + stockResults.length + ".");
        var itemTransactions = {};
        stockResults.forEach(function (result) {
            var itemId = result.itemId;
            if (~itemDetails.itemIds.indexOf(itemId)) {
                if (!itemTransactions[itemId])
                    itemTransactions[itemId] = [];
                itemTransactions[itemId].push(result);
            }
        });
        var today = new Date(); // Fri Oct 20 2017 10:06:19 GMT+0100 (BST)
        today.setHours(0, 0, 0, 0);
        var oneDay = 60 * 60 * 24 * 1000;
        var oneYearAgo = new Date(today.getTime() - oneDay * 365);
        var twoYearsAgo = new Date(today.getTime() - oneDay * 730);
        var csv = "Item, Description, Class, Brand, Season, Location, Qty Less Than 1 Yr, Value Less Than 1 Yr, Qty 1-2 Yrs, Value 1-2 Yrs, Qty 2 Yrs+, Value 2 Yrs+\n";
        log.debug('summarize', 'CSV started');
        try {
            var _loop_1 = function (itemId) {
                var itemDetail = items[itemId];
                itemDetail.locations.forEach(function (itemLoc, locationIdx) {
                    var value = 0;
                    var totQty = 0;
                    var totVal = 0;
                    var avgCost = 0;
                    var rate = 0;
                    var twoPlusQty = 0;
                    var twoPlusVal = 0;
                    var oneTwoQty = 0;
                    var oneTwoVal = 0;
                    var oneLessQty = 0;
                    var oneLessVal = 0;
                    var prevAvgCost = 0;
                    log.debug("Processing Transactions", itemTransactions[itemDetail.item].length);
                    if (itemTransactions[itemDetail.item])
                        itemTransactions[itemDetail.item].forEach(function (result, index) {
                            var locResult = result.location;
                            if (itemLoc == locResult) {
                                var tranDateSt = result.date;
                                var type = result.type;
                                var qty = Number(result.quantity);
                                var tranDate = new Date(tranDateSt);
                                // const trans = result.getValue('tranid');
                                log.debug("Processing Transaction", "Idx: " + index + " - Tran Date: " + tranDateSt + ", Type: " + type + ", Qty: " + qty);
                                if (!qty || qty > 0) { // 'In' transaction or landed cost
                                    log.debug("Logic Trace", "Idx: " + index + " - " + tranDateSt + " 'In' transaction or landed cost");
                                    value = Number(result.value);
                                    log.debug("Value = formulacurrency", "Idx: " + index + " - " + value);
                                    // log.debug('In Details', `Trans: ${trans}. Date: ${tranDate}. Qty: ${qty}. Val: ${value}`)
                                    totQty += qty;
                                    if (value == 0) {
                                        log.debug("Logic Trace", "value == 0, " + value + " == 0");
                                        value = prevAvgCost;
                                        log.debug("Value = prevAvgCost", "Idx: " + index + " - " + value);
                                    }
                                    log.debug("totVal += value", "Idx: " + index + " - " + (totVal + value) + " = " + totVal + " + " + value);
                                    totVal += value;
                                    log.debug('Running Totals', "Idx: " + index + " - Total Qty: " + totQty + ". Total Value: " + totVal);
                                    if (tranDate.getTime() > oneYearAgo.getTime()) {
                                        oneLessQty += qty;
                                        oneLessVal += value;
                                        log.debug('Adding to One Less Values', "Idx: " + index + " - Quantity: " + oneLessQty + ". Value: " + oneLessVal + ".");
                                    }
                                    else if (tranDate.getTime() < twoYearsAgo.getTime()) {
                                        twoPlusQty += qty;
                                        twoPlusVal += value;
                                        log.debug('Adding to Two Plus Values', "Idx: " + index + " - Quantity: " + twoPlusQty + ". Value: " + twoPlusVal + ".");
                                    }
                                    else {
                                        log.debug("Logic Trace", "Idx: " + index + " - Tran Date is between one and two years " + tranDateSt);
                                        oneTwoQty += qty;
                                        log.debug('Adding to One Two Values', "Idx: " + index + " - Tran Date: " + tranDateSt + ", Prev Quantity: " + oneTwoQty + ". Prev Value: " + oneTwoVal + ". Adding value: " + value);
                                        oneTwoVal += value;
                                        log.debug('Adding to One Two Values', "Idx: " + index + " - Tran Date: " + tranDateSt + ", New Quantity: " + oneTwoQty + ". New Value: " + oneTwoVal + ".");
                                    }
                                }
                                else { // 'Out' transaction
                                    log.debug("Logic Trace", "Idx: " + index + " - " + tranDateSt + " 'Out' transaction");
                                    var posQty = qty * -1;
                                    log.debug("posQty = qty * -1", "Idx: " + index + " - " + posQty + " = " + qty + " * -1");
                                    if (type == 'InvTrnfr' || type == 'InvWksht') {
                                        log.debug("Logic Trace", "Idx: " + index + " - type is 'InvTrnfr' or 'InvWksht', " + type);
                                        avgCost = Number(result.value);
                                        avgCost = avgCost * -1;
                                        log.debug("avgCost = negative formulacurrency", "Idx: " + index + " - " + avgCost);
                                    }
                                    else {
                                        log.debug("Logic Trace", "Idx: " + index + " - type is neither 'InvTrnfr' nor 'InvWksht)', " + type);
                                        if (totQty > 0) {
                                            log.debug("Logic Trace", "Idx: " + index + " - Positive Total Qty, " + totQty);
                                            avgCost = Number((totVal / totQty * posQty).toFixed(2));
                                            log.debug("avgCost = Number((totVal / totQty * posQty).toFixed(2)", "Idx: " + index + " - Number((" + totVal + " / " + totQty + " * " + posQty + ").toFixed(2)");
                                            prevAvgCost = avgCost;
                                            log.debug("prevAvgCost = avgCost", "Idx: " + index + " - " + prevAvgCost + " = " + avgCost);
                                        }
                                        else {
                                            log.debug("Logic Trace", "Idx: " + index + " - Negative Total Qty, " + totQty);
                                            avgCost = prevAvgCost;
                                            log.debug("avgCost = prevAvgCost", prevAvgCost);
                                        }
                                    }
                                    //log.debug('Out Details', `Idx: ${index} - Tran Date: ${tranDateSt}. Qty: -${posQty}. Val: ${avgCost}`);
                                    rate = avgCost / posQty;
                                    log.debug("rate = avgCost / posQty", "Idx: " + index + " - " + rate + " = " + avgCost + " / " + posQty);
                                    totQty -= posQty;
                                    totVal -= avgCost;
                                    log.debug('Running Totals', "Idx: " + index + " - Qty: " + totQty + ". Value: " + totVal);
                                    if (twoPlusQty >= posQty) {
                                        twoPlusQty -= posQty;
                                        twoPlusVal -= avgCost;
                                        posQty = 0;
                                    }
                                    else {
                                        var remaining = posQty - twoPlusQty;
                                        var twoPlusOutQ = posQty - remaining;
                                        var twoPlusOutV = twoPlusOutQ * rate;
                                        twoPlusQty -= twoPlusOutQ;
                                        twoPlusVal -= twoPlusOutV;
                                        posQty = remaining;
                                    }
                                    if (oneTwoQty >= posQty) {
                                        log.debug("Logic Trace", "Idx: " + index + " - oneTwoQty >= posQty, " + oneTwoQty + ", >= " + posQty);
                                        var oneTwoOutV = posQty * rate;
                                        log.debug("oneTwoOutV = posQty * rate", "Idx: " + index + " - " + oneTwoOutV + " = " + posQty + " * " + rate);
                                        oneTwoQty -= posQty;
                                        log.debug('Subtracting to One Two Values', "Idx: " + index + " - Tran Date: " + tranDateSt + ", Prev Quantity: " + oneTwoQty + ". Prev Value: " + oneTwoVal + ". Subtracting oneTwoOutV: " + oneTwoOutV);
                                        oneTwoVal -= oneTwoOutV; // TODO: The positive values on zero quantity happen here.
                                        log.debug('Subtracting to One Two Values', "Idx: " + index + " - Tran Date: " + tranDateSt + ", New Quantity: " + oneTwoQty + ". New Value: " + oneTwoVal + ".");
                                        //log.debug('Adding to One Two Values', `Quantity: ${oneTwoQty}. Value: ${oneTwoVal}.`);
                                        // posQty = 0;
                                    }
                                    else {
                                        log.debug("Logic Trace", "Idx: " + index + " - !(oneTwoQty >= posQty), !(" + oneTwoQty + " >= " + posQty + ")");
                                        var lessOneOutQ = posQty - oneTwoQty;
                                        var lessOneOutV = lessOneOutQ * rate;
                                        var oneTwoOutQ = posQty - lessOneOutQ;
                                        var oneTwoOutV = oneTwoOutQ * rate;
                                        oneTwoQty -= oneTwoOutQ;
                                        log.debug('Adding to One Two Values', "Idx: " + index + " - Tran Date: " + tranDateSt + ", Prev Quantity: " + oneTwoQty + ". Prev Value: " + oneTwoVal + ". Adding oneTwoOutV: " + oneTwoOutV);
                                        oneTwoVal -= oneTwoOutV;
                                        log.debug('Adding to One Two Values', "Idx: " + index + " - Tran Date: " + tranDateSt + ", New Quantity: " + oneTwoQty + ". New Value: " + oneTwoVal + ".");
                                        //log.debug('Adding to One Two Values', `Quantity: ${oneTwoQty}. Value: ${oneTwoVal}.`);
                                        oneLessQty -= lessOneOutQ;
                                        oneLessVal -= lessOneOutV;
                                    }
                                }
                                return true;
                            }
                        });
                    log.debug("Finished processing transactions", "Processing One to Two Year final value");
                    if (twoPlusQty == 0 && twoPlusVal < 0) {
                        log.debug("Logic Trace", "twoPlusQty == 0 && twoPlusVal < 0, " + twoPlusQty + " == 0 && " + twoPlusVal + " < 0");
                        log.debug('Adding to One Two Values', "Prev Quantity: " + oneTwoQty + ". Prev Value: " + oneTwoVal + ". Adding twoPlusVal: " + twoPlusVal);
                        oneTwoVal += twoPlusVal;
                        log.debug('Adding to One Two Values', "New Quantity: " + oneTwoQty + ". New Value: " + oneTwoVal + ".");
                        //log.debug('Adding to One Two Values', `Quantity: ${oneTwoQty}. Value: ${oneTwoVal}.`);
                        twoPlusVal = 0;
                    }
                    if (oneTwoQty == 0 && oneTwoVal < 0) {
                        log.debug("Logic Trace", "oneTwoQty == 0 && oneTwoVal < 0, " + oneTwoQty + " == 0 && " + oneTwoVal + " < 0");
                        oneLessVal += oneTwoVal;
                        log.debug('Setting One Two Value to Zero', "Prev Quantity: " + oneTwoQty + ". Prev Value: " + oneTwoVal + ".");
                        oneTwoVal = 0;
                        log.debug('Adding to One Two Values', "Prev Quantity: " + oneTwoQty + ". Prev Value: " + oneTwoVal + ". Adding twoPlusVal: " + twoPlusVal);
                        oneTwoVal += twoPlusVal;
                        log.debug('Adding to One Two Values', "New Quantity: " + oneTwoQty + ". New Value: " + oneTwoVal + ".");
                        //log.debug('Adding to One Two Values', `Quantity: ${oneTwoQty}. Value: ${oneTwoVal}.`);
                    }
                    log.debug("Output CSV Line", "");
                    // log.debug('Results', `Item: ${itemDetail.item}, Location: ${itemDetail.locationText},  1Yr Qty: ${oneLessQty}, 1Yr Value: ${oneLessVal}, 1-2Qty: ${oneTwoQty}, 1-2 Value: ${oneTwoVal}, 2plusQty: ${twoPlusQty}, 2plus Value: ${twoPlusVal}, Total Qty: ${totQty}, Total Value: ${totVal}`);
                    csv += itemDetail.name + ",";
                    csv += itemDetail.desc + ",";
                    csv += itemDetail.class + ",";
                    csv += itemDetail.brand + ",";
                    csv += itemDetail.season + ",";
                    csv += itemDetail.locationTexts[locationIdx] + ",";
                    csv += oneLessQty + ",";
                    csv += oneLessVal.toFixed(2) + ",";
                    csv += oneTwoQty + ",";
                    csv += ((oneTwoQty > 0) ? oneTwoVal.toFixed(2) : 0.00) + ",";
                    log.debug('Final One Two Value', "Quantity: " + oneTwoQty + ". Value: " + oneTwoVal.toFixed(2) + ".");
                    csv += twoPlusQty + ",";
                    csv += twoPlusVal.toFixed(2) + "\n";
                });
            };
            for (var itemId in items) {
                _loop_1(itemId);
            }
            var csvFile = file.create({ fileType: file.Type.CSV, contents: csv, name: 'AgedInventory.csv' });
            email.send({
                author: 10,
                recipients: [949],
                subject: "Aged Inventory Report",
                body: 'This an an automated email from the NetSuite Script "Aged Inventory Report - Scheduled". See Attached.',
                attachments: [csvFile]
            });
            log.audit("summarize", "Email Sent!");
        }
        catch (e) {
            log.error('Error in summarize()', "Error: " + e.message);
        }
    };
    function getItemDetails() {
        var itemIds = [];
        var locations = [];
        var items = {};
        var itemsByLoc = {};
        var searchId = runtime.getCurrentScript().getParameter({ name: 'custscript_agedinventory_inventorysearch' });
        var inStockResults = getAllResults(search.load({ id: searchId })); // Default is: [Script] Aged Inventory - Items on Hand
        inStockResults.forEach(function (result, idx) {
            if (idx % 1000 == 0)
                log.debug('Getting items', "Processing idx " + idx + ".");
            var name = result.getValue('itemid');
            var locationId = result.getValue('inventorylocation');
            var locationText = result.getText('inventorylocation');
            var originalDescription = result.getValue('salesdescription');
            var desc = originalDescription.replace(/,/g, '');
            var itemClass = result.getText('class');
            var brand = result.getText('custitem_rmp_brand');
            var season = result.getValue('custitem_season');
            var onHand = result.getValue('locationquantityonhand');
            if (!items[result.id]) {
                itemIds.push(result.id);
                items[result.id] = { item: result.id, name: name, locations: [locationId], locationTexts: [locationText], onHand: onHand, desc: desc, class: itemClass, brand: brand, season: season };
            }
            else {
                items[result.id].locations.push(locationId);
                items[result.id].locationTexts.push(locationText);
            }
            if (!~locations.indexOf(locationId))
                locations.push(locationId);
            // Track items by location so we can have more accurate transaction filters
            if (!itemsByLoc[locationId])
                itemsByLoc[locationId] = [];
            if (!~itemsByLoc[locationId].indexOf(result.id))
                itemsByLoc[locationId].push(result.id);
            return true;
        });
        log.debug('Item Details', "" + JSON.stringify(items));
        return { itemIds: itemIds, locations: locations, items: items, itemsByLoc: itemsByLoc };
    }
    function getAllResults(searchObj) {
        var pageData = searchObj.runPaged({ pageSize: 1000 });
        var results = pageData.pageRanges
            .map(function (pageRange) { return pageData.fetch({ index: pageRange.index }); })
            .reduce(function (results, page) { return results.concat(page.data); }, []);
        log.audit('getAllResults() paged', "Search type: " + searchObj.searchType + "; Results: " + results.length + "; Usage left: " + runtime.getCurrentScript().getRemainingUsage() + ".");
        return results;
    }
    return exports;
});
