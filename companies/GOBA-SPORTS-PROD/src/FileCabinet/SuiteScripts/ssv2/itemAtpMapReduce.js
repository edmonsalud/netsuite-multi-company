/**
 * itemAtpMapReduce.ts
 * © 2017 Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Item ATP - Map/Reduce
 * @NScriptType MapReduceScript
 * @NApiVersion 2.x
 */
define(["N/format", "N/log", "N/record", "N/runtime", "N/search"], function (format, log, record, runtime, search) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.summarize = exports.reduce = exports.map = exports.getInputData = void 0;
    /** Look up which items to run this on */
    exports.getInputData = function () {
        var MAX_ARRAY_SIZE = 50; // This prevents the NS server from getting overloaded when trying to sort arrays and stuff.
        var resultSets = []; // This will be an array of arrays of item IDs. Each map phase will process up to MAX_ARRAY_SIZE.
        // Read deployment parameters
        var searchId = runtime.getCurrentScript().getParameter({ name: 'custscript_itematpmapreduce_itemsearch' });
        var testItem = runtime.getCurrentScript().getParameter({ name: 'custscript_itematpmapreduce_item' });
        var itemSearch = search.load({ id: searchId });
        if (testItem)
            itemSearch.filters.push(search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: [testItem] }));
        // We'll group the results into chunks small enough to process within the constraints of a NetSuite server...
        var itemLocations = [];
        var results = getAllResults(itemSearch);
        results.forEach(function (result, index) {
            var itemId = result.id;
            var locationId = result.getValue('inventorylocation');
            var parentItem = result.getValue('parent');
            itemLocations.push({ itemId: itemId, locationId: locationId, parentItem: parentItem });
            if (itemLocations.length == MAX_ARRAY_SIZE || index == results.length - 1) {
                resultSets.push(itemLocations);
                itemLocations = [];
            }
        });
        log.debug('getInputSummary', "Found " + resultSets.length + " sets of " + MAX_ARRAY_SIZE + " item/location pairs.");
        return resultSets;
    };
    /** Figure out relevant inventory balances to record a snapshot for. */
    exports.map = function (mapContext) {
        try {
            var itemLocations = JSON.parse(mapContext.value);
            var itemIds_1 = [];
            var locationIds_1 = [];
            var itemParents_1 = {};
            itemLocations.forEach(function (itemLocation) {
                if (!~itemIds_1.indexOf(itemLocation.itemId))
                    itemIds_1.push(itemLocation.itemId);
                if (!~locationIds_1.indexOf(itemLocation.locationId))
                    locationIds_1.push(itemLocation.locationId);
                itemParents_1[itemLocation.itemId] = itemLocation.parentItem;
            });
            var staticDemand_1 = getStaticDemand(itemIds_1, locationIds_1);
            var futureTransactionSets_1 = getFutureTransactions(itemIds_1, locationIds_1, staticDemand_1);
            var snapshots_1 = getCurrentInventory(itemIds_1, locationIds_1, futureTransactionSets_1, staticDemand_1);
            futureTransactionSets_1.forEach(function (itemFutureTransactions) {
                var latestSnapshot = getLatestSnapshot(itemFutureTransactions.itemId, itemFutureTransactions.locationId, snapshots_1);
                if (!latestSnapshot)
                    return; // This transaction location may be one that we aren't tracking
                var nextSnapshotDt = itemFutureTransactions.date;
                if (nextSnapshotDt == latestSnapshot.date)
                    return; // We already processed this
                var supply = 0;
                log.debug('map', "Processing Item Future Transactions for item " + latestSnapshot.itemId + " date " + nextSnapshotDt + ": " + JSON.stringify(itemFutureTransactions));
                itemFutureTransactions.transactions.forEach(function (transaction) {
                    if (transaction.type == 'purchaseorder') {
                        supply += transaction.quantity;
                    }
                    else if (transaction.type == 'transferorder' && transaction.quantity > 0) {
                        supply += transaction.quantity;
                    }
                });
                if (!supply && staticDemand_1.length == 0)
                    return; // [GOBASD-3] We do show zero-supply lines if we're using static demand
                // log.debug('Supply', `Item ${latestSnapshot.itemId} Supply ${supply}`);
                var demand = getUpcomingDemand(latestSnapshot, futureTransactionSets_1, nextSnapshotDt, false, staticDemand_1);
                var balance = latestSnapshot.balance + supply - demand;
                var available = latestSnapshot.balance + supply - demand;
                var newSnapshot = {
                    itemId: itemFutureTransactions.itemId,
                    locationId: itemFutureTransactions.locationId,
                    date: nextSnapshotDt,
                    supply: supply,
                    demand: demand,
                    balance: balance,
                    available: available,
                    forReports: true,
                    poPastDue: latestSnapshot.poPastDue
                };
                // log.debug('map', `Resulting New Snapshot: ${JSON.stringify(newSnapshot)}`);
                snapshots_1.push(newSnapshot);
            });
            snapshots_1 = calculateAvailableToSell(snapshots_1, itemIds_1, locationIds_1);
            snapshots_1 = fillInSnapshotGaps(snapshots_1, itemParents_1);
            snapshots_1.sort(sortSnapshotsByDate);
            snapshots_1 = calculateAvailableToSell(snapshots_1, itemIds_1, locationIds_1);
            snapshots_1.forEach(function (snapshot) {
                mapContext.write(mapContext.key, JSON.stringify(snapshot));
            });
        }
        catch (e) {
            log.error('Error in map()', "Error: " + e.message + " Context: " + JSON.stringify(mapContext));
        }
    };
    /** Create or update a snapshot record */
    exports.reduce = function (context) {
        var recordsSaved = 0;
        try {
            var snapshotStrs = context.values || [];
            var snapshots_2 = [];
            // log.audit('reduce', `Key ${context.key} Snapshots: ${snapshotStrs.length}`);
            // First loop through to get item IDs & location IDs
            var itemIds_2 = [];
            var locations_1 = [];
            snapshotStrs.forEach(function (jsonStr) {
                var snapshot = JSON.parse(jsonStr);
                snapshots_2.push(snapshot);
                if (!~itemIds_2.indexOf(snapshot.itemId))
                    itemIds_2.push(snapshot.itemId);
                if (!~locations_1.indexOf(snapshot.locationId))
                    locations_1.push(snapshot.locationId);
            });
            // Find existing snapshots for these items
            var results_1 = getAllResults(search.create({
                type: 'customrecord_atpsnapshot',
                filters: [['custrecord_atpsnapshot_date', 'onorafter', 'today'], 'and', ['custrecord_atpsnapshot_item', 'anyof', itemIds_2], 'and', ['custrecord_atpsnapshot_location', 'anyof', locations_1]],
                columns: ['custrecord_atpsnapshot_item', 'custrecord_atpsnapshot_date', 'custrecord_atpsnapshot_location']
            }));
            log.audit('reduce', "Key " + context.key + " - processing " + snapshots_2.length + " snapshots for " + itemIds_2.length + " items; found " + results_1.length + " existing results to check.");
            snapshots_2.forEach(function (snapshot) {
                // See if a record already exists for this date
                var recId = '';
                for (var i = 0; i < results_1.length; i++) {
                    var resultItem = results_1[i].getValue('custrecord_atpsnapshot_item');
                    var resultLoc = results_1[i].getValue('custrecord_atpsnapshot_location');
                    var resultDate = results_1[i].getValue('custrecord_atpsnapshot_date');
                    if (resultItem == snapshot.itemId && resultLoc == snapshot.locationId && resultDate == snapshot.date) {
                        recId = results_1[i].id;
                        break;
                    }
                }
                // Upsert the record
                var rec = recId ? record.load({ type: 'customrecord_atpsnapshot', id: recId }) : record.create({ type: 'customrecord_atpsnapshot' }); // 2 points
                rec.setValue('custrecord_atpsnapshot_item', snapshot.itemId);
                rec.setValue('custrecord_atpsnapshot_location', snapshot.locationId);
                rec.setValue('custrecord_atpsnapshot_date', format.parse({ type: format.Type.DATE, value: snapshot.date }));
                rec.setValue('custrecord_atpsnapshot_supply', snapshot.supply);
                rec.setValue('custrecord_atpsnapshot_demand', snapshot.demand);
                rec.setValue('custrecord_atpsnapshot_available', snapshot.available);
                rec.setValue('custrecord_atpsnapshot_balance', snapshot.balance);
                rec.setValue('custrecord_atpsnapshot_pastduepo', snapshot.poPastDue);
                rec.setValue('custrecord_atpsnapshot_for_reporting', snapshot.forReports); // [GOBASD-3]
                rec.setValue('isinactive', false); // In case this record had been inactive
                rec.save(); // 4 points
                recordsSaved++;
            });
        }
        catch (e) {
            log.error('Error in reduce()', "Error: " + e.message + " Key " + context.key + " - Processed " + recordsSaved + " records from context: " + JSON.stringify(context));
        }
        log.audit('reduce', "Key " + context.key + " - Complete - processed " + recordsSaved + " records, remaining usage is " + runtime.getCurrentScript().getRemainingUsage() + ".");
    };
    exports.summarize = function (context) {
        var results = getAllResults(search.create({
            type: 'customrecord_atpsnapshot',
            filters: [
                ['isinactive', 'is', 'F'], 'and',
                [['custrecord_atpsnapshot_date', 'before', 'today'], 'or', ['lastmodified', 'before', 'today']]
            ]
        }));
        log.audit('Summarizing', "Inactivating " + results.length + " old records; Usage: " + runtime.getCurrentScript().getRemainingUsage() + ".");
        var numberInactivated = 0;
        for (var i = 0; i < results.length; i++) {
            record.submitFields({ type: 'customrecord_atpsnapshot', id: results[i].id, values: { isinactive: true } });
            if (i % 100 == 0 || runtime.getCurrentScript().getRemainingUsage() < 100)
                log.debug('Summarizing', "Record inactivated: " + numberInactivated + "; Usage: " + runtime.getCurrentScript().getRemainingUsage() + ".");
            numberInactivated++;
            if (runtime.getCurrentScript().getRemainingUsage() < 2)
                break;
        }
        log.audit('summarize()', "Execution Complete, old records inactivated: " + numberInactivated + ".");
    };
    /** The ATS formula is: balance - (next demand - next supply), or the balance if supply > demand or if its the last one. */
    function calculateAvailableToSell(snapshots, itemIds, locationIds) {
        itemIds.forEach(function (itemId) {
            locationIds.forEach(function (locationId) {
                // First gather up the snapshot records that pertain to this item/location pair
                var itemSnapshots = [];
                snapshots.forEach(function (snapshot, index) {
                    if (snapshot.itemId == itemId && snapshot.locationId == locationId)
                        itemSnapshots.push({ snapshot: snapshot, index: index });
                });
                // Then loop through them and calculate reserves needed and available balances
                itemSnapshots.forEach(function (snapshotRef, index) {
                    var reserveNeeded = 0;
                    if (itemSnapshots.length > index + 1) { // we aren't on the last one, so check the next snapshot line
                        reserveNeeded = itemSnapshots[index + 1].snapshot.demand - itemSnapshots[index + 1].snapshot.supply;
                        if (reserveNeeded < 0)
                            reserveNeeded = 0; // Supply is greater than demand.
                    }
                    if (reserveNeeded > snapshotRef.snapshot.balance)
                        reserveNeeded = snapshotRef.snapshot.balance; // Can't reserve more than we have.
                    snapshotRef.snapshot.available = snapshotRef.snapshot.balance - reserveNeeded;
                });
                // If the available balance on the line below is lower, use that one.
                // So, we start at the bottom and go backwards comparing available quantities
                for (var i = itemSnapshots.length - 1; i > 0; i--) { // We don't process the 0th line, because there's no line above it to modify
                    var available = itemSnapshots[i].snapshot.available;
                    if (available < itemSnapshots[i - 1].snapshot.available) {
                        if (itemId == '5304')
                            log.audit('Available Qty Updated', "Setting Snapshot " + JSON.stringify(itemSnapshots[i - 1].snapshot) + " set to " + available + " from snapshot below: " + JSON.stringify(itemSnapshots[i].snapshot) + ".");
                        itemSnapshots[i - 1].snapshot.available = available;
                    }
                }
                itemSnapshots.forEach(function (snapshotRef) {
                    snapshots[snapshotRef.index] = snapshotRef.snapshot;
                });
            });
        });
        return snapshots;
    }
    /** If an item has a snapshot for a date, then all items from the same parent should have a snapshot on that date. */
    function fillInSnapshotGaps(snapshots, itemParents) {
        var trackItem = '13556'; // 50737U/060/YM
        /** Track which dates we have snapshots for, for each parent. So we can ensure that we have one for all subitems of the parent. */
        var itemLocDates = {};
        var gaps = [];
        // First we identify which dates each item parent has snapshots for.
        snapshots.forEach(function (snapshot) {
            if (snapshot.itemId == trackItem && snapshot.locationId == '120')
                log.audit('fillInSnapshotGaps()', "Tracking snapshot: " + JSON.stringify(snapshot));
            if (!itemLocDates[snapshot.itemId])
                itemLocDates[snapshot.itemId] = { dates: [], locationId: snapshot.locationId }; // Initialize this item tracker
            if (!~itemLocDates[snapshot.itemId].dates.indexOf(snapshot.date))
                itemLocDates[snapshot.itemId].dates.push(snapshot.date); // Add this date in
        });
        var _loop_1 = function (itemId) {
            var parent_1 = itemParents[itemId];
            var locationId = itemLocDates[itemId].locationId;
            if (!parent_1)
                return "continue"; // Not all items have parents
            // Compare this one to others with the same parent, and note any gaps that this item has
            for (var otherItem in itemLocDates) {
                if (itemParents[otherItem] != parent_1 || locationId != itemLocDates[otherItem].locationId || itemId == otherItem)
                    continue;
                itemLocDates[otherItem].dates.forEach(function (date) {
                    if (!~itemLocDates[itemId].dates.indexOf(date)) { // If this item doesn't have this date from the other item, then its a gap
                        gaps.push({ itemId: itemId, date: date, locationId: locationId });
                        if (itemId == trackItem)
                            log.audit('Snapshot Gap Identified', JSON.stringify(gaps[gaps.length - 1]));
                        itemLocDates[itemId].dates.push(date); // Since we have it identified as a gap now, we don't need to catch this one again.
                    }
                });
            }
        };
        // Then go through the sets of item dates to compare and see if any have dates missing
        for (var itemId in itemLocDates) {
            _loop_1(itemId);
        }
        // Finally, fill in the gaps
        var newSnapshots = []; // We have to add them after cylcing through because they won't be in order when we add them.
        gaps.forEach(function (gap) {
            // We'll start at the bottom of the list of snapshots (since they were constructed by transaction date) and find the first snapshot prior to this date.
            var gapDate = new Date(gap.date);
            var snapshotCopy = null;
            for (var i = snapshots.length - 1; i >= 0; i--) {
                var snapshot = snapshots[i];
                var snapshotDate = new Date(snapshot.date);
                var itemsMatch = snapshot.itemId == gap.itemId;
                var locationsMatch = snapshot.locationId == gap.locationId;
                var laterThanGap = snapshotDate.getTime() > gapDate.getTime();
                if (gap.itemId == trackItem)
                    log.audit('Checking Potential Gap Fillter', "Gap: " + JSON.stringify(gap) + ", Snapshot being checked: " + JSON.stringify(snapshot) + "; Items Match " + itemsMatch + "; Locations: " + locationsMatch + ", Later: " + laterThanGap + ". Gap Time: " + gapDate.getTime() + ", Snapshot Time: " + snapshotDate.getTime() + ".");
                if (!itemsMatch || !locationsMatch || laterThanGap)
                    continue;
                // Otherwise we have a matching item, location, and date
                snapshotCopy = {
                    available: snapshot.available,
                    balance: snapshot.balance,
                    date: gap.date,
                    demand: 0,
                    itemId: gap.itemId,
                    locationId: gap.locationId,
                    supply: 0,
                    forReports: false,
                    poPastDue: snapshot.poPastDue
                };
                if (gap.itemId == trackItem)
                    log.audit('Snapshot Gap Filled', "Copied " + JSON.stringify(snapshot) + " to new: " + JSON.stringify(snapshotCopy));
                break;
            }
            if (snapshotCopy)
                newSnapshots.push(snapshotCopy);
            else
                log.audit('Snapshot Gap Not Filled', JSON.stringify(gap));
        });
        return snapshots.concat(newSnapshots);
    }
    function getCurrentInventory(itemIds, locationIds, futureTransactionSets, staticDemand) {
        var snapshots = [];
        var today = new Date(Date.now() + 60 * 60 * 3 * 1000); // Add three hours to convert pacific to EST
        var todayStr = format.format({ type: format.Type.DATE, value: today }); // Set it to midnight
        search.create({
            type: 'inventoryitem',
            filters: [['internalid', 'anyof', itemIds], 'and', ['inventorylocation', 'anyof', locationIds]],
            columns: ['inventorylocation', 'locationquantityonhand', 'locationquantityavailable']
        }).run().each(function (result) {
            var locationId = result.getValue('inventorylocation');
            var available = Number(result.getValue('locationquantityavailable'));
            var supply = Number(result.getValue('locationquantityonhand'));
            var snapshot = {
                itemId: result.id,
                locationId: locationId,
                date: todayStr,
                supply: supply,
                demand: 0,
                balance: 0,
                available: available,
                forReports: true,
                poPastDue: false
            };
            // Add in supply
            futureTransactionSets.forEach(function (tranSet) {
                if (tranSet.itemId == result.id && tranSet.locationId == locationId) { // Include these transactions
                    if ((new Date(tranSet.date)).getTime() < (new Date(todayStr)).getTime()) {
                        for (var _i = 0, _a = tranSet.transactions; _i < _a.length; _i++) {
                            var tran = _a[_i];
                            if (tran.type == 'purchaseorder') { // Treat earlier transactions as if they're on today, but flag it as past due
                                snapshot.poPastDue = true;
                                tranSet.date = todayStr;
                                break;
                            }
                        }
                    }
                    if (tranSet.date == todayStr) {
                        tranSet.transactions.forEach(function (transaction) {
                            if (transaction.type == 'purchaseorder') {
                                snapshot.supply += transaction.quantity;
                                // log.debug(`map - ${date} - added supply`, `Processed Transaction ${JSON.stringify(transaction)}`);
                            }
                            else if (transaction.type == 'transferorder' && transaction.quantity > 0) {
                                snapshot.supply += transaction.quantity;
                                // log.debug(`map - ${date} - added supply`, `Processed Transaction ${JSON.stringify(transaction)}`);
                            }
                        });
                    }
                }
            });
            // Add in demand
            snapshot.demand = getUpcomingDemand(snapshot, futureTransactionSets, todayStr, true, staticDemand);
            snapshot.balance = snapshot.supply - snapshot.demand;
            log.debug('map', "Item " + result.id + " snapshot: " + JSON.stringify(snapshot));
            snapshots.push(snapshot);
            return true;
        });
        return snapshots;
    }
    /** Find future sales orders, purchase orders, and transfer orders for these items and locations.  */
    function getFutureTransactions(itemIds, locationIds, staticDemand) {
        if (itemIds.length == 0)
            return [];
        var futureTransactions = [];
        var tranSearch = search.load({ id: 'customsearch_itemats_purchaseorders' }); // This is the "[Script] Item ATS - Purchase Orders" search.
        var filters = tranSearch.filterExpression;
        filters.push('and', ['item', 'anyof', itemIds], 'and', ['location', 'anyof', locationIds]);
        tranSearch.filterExpression = filters;
        tranSearch.run().each(function (result) {
            var itemId = result.getValue({ name: 'item', summary: search.Summary.GROUP });
            var locationId = result.getValue({ name: 'location', summary: search.Summary.GROUP });
            var dateStr = result.getValue({ name: 'expectedreceiptdate', summary: search.Summary.GROUP });
            var poQuantity = Number(result.getValue({ name: 'quantity', summary: search.Summary.SUM }));
            var qtyRecved = Number(result.getValue({ name: 'quantityshiprecv', summary: search.Summary.SUM }));
            var quantity = poQuantity - qtyRecved;
            if (quantity && dateStr) {
                // const poDate = new Date(dateStr); // If the PO date is earlier than today, treat it as today's date, per email from Danielle on 19 Jan 2018.
                // if (poDate.getTime() < today.getTime()) dateStr = todayStr;
                futureTransactions[getFutureTranIndex(itemId, locationId, dateStr, futureTransactions)].transactions.push({ type: 'purchaseorder', quantity: quantity });
            }
            return true;
        });
        log.debug('getFutureTransactions', "Processed purchase orders: " + JSON.stringify(futureTransactions));
        tranSearch = search.load({ id: 'customsearch_itemats_salesorders' });
        filters = tranSearch.filterExpression;
        filters.push('and', ['item', 'anyof', itemIds], 'and', ['location', 'anyof', locationIds]);
        tranSearch.filterExpression = filters;
        var salesOrderResults = getAllResults(tranSearch);
        log.debug('getFutureTransactions', "Sales orders Found: " + salesOrderResults.length + ".");
        salesOrderResults.forEach(function (result) {
            var itemId = result.getValue({ name: 'item', summary: search.Summary.GROUP });
            var locationId = result.getValue({ name: 'location', summary: search.Summary.GROUP });
            var date = result.getValue({ name: 'shipdate', summary: search.Summary.GROUP });
            var soQuantity = Number(result.getValue({ name: 'quantity', summary: search.Summary.SUM }));
            var commitedQt = Number(result.getValue({ name: 'quantityshiprecv', summary: search.Summary.SUM }));
            var quantity = soQuantity - commitedQt;
            if (quantity)
                futureTransactions[getFutureTranIndex(itemId, locationId, date, futureTransactions)].transactions.push({ type: 'salesorder', quantity: quantity });
        });
        log.debug('getFutureTransactions', "Processed sales orders: " + JSON.stringify(futureTransactions));
        try { // Load the "[Script] Item ATS - Transfer Orders" saved search
            tranSearch = search.load({ id: 'customsearch_itemats_transferorders' });
            filters = tranSearch.filterExpression;
            filters.push('and', ['item', 'anyof', itemIds], 'and', [['location', 'anyof', locationIds], 'or', ['transferlocation', 'anyof', locationIds]]);
            tranSearch.filterExpression = filters;
            tranSearch.run().each(function (result) {
                var itemId = result.getValue({ name: 'item', summary: search.Summary.GROUP });
                var fromLocId = result.getValue({ name: 'location', summary: search.Summary.GROUP });
                var toLocation = result.getValue({ name: 'transferlocation', summary: search.Summary.GROUP });
                var date = result.getValue({ name: 'trandate', summary: search.Summary.GROUP });
                var toQuantity = Number(result.getValue({ name: 'quantity', summary: search.Summary.SUM })); // This is always negative
                var shippedQty = Number(result.getValue({ name: 'quantityshiprecv', summary: search.Summary.SUM })); // This is always positive
                var locationId = fromLocId; // Assume its an outgoing (demand) line, unless the condition below applies
                var quantity = toQuantity + shippedQty;
                log.debug('getFutureTransactions', "Transfer To Loc: " + toLocation + ", Location Ids: " + JSON.stringify(locationIds) + "; TO Qty: " + toQuantity + " - " + shippedQty + " = " + quantity + ".");
                if (~locationIds.indexOf(toLocation)) { // This is a supply line. Update this if we ever include more locations?  We could add lines for both from and to locations.
                    locationId = toLocation;
                    quantity = Math.abs(toQuantity) - shippedQty;
                }
                if (quantity) {
                    futureTransactions[getFutureTranIndex(itemId, locationId, date, futureTransactions)].transactions.push({ type: 'transferorder', quantity: quantity });
                    log.debug('getFutureTransactions', "Added transfer order; date " + date + " item " + itemId + "; quantity " + quantity + "; from loc " + fromLocId + " to loc " + toLocation);
                }
                return true;
            });
            log.debug('getFutureTransactions', 'Processed Transfer Orders.');
        }
        catch (e) {
            log.error('Error getting transfer orders', e.message);
        }
        // [GOBASD-3] Process Static Demand
        for (var _i = 0, staticDemand_2 = staticDemand; _i < staticDemand_2.length; _i++) {
            var demand = staticDemand_2[_i];
            if (demand.startDate.getTime() < Date.now())
                continue; // We don't want to generate a snapshot for a past date. This demand will be included in getCurrentInventory
            var date = format.format({ type: format.Type.DATE, value: demand.startDate });
            futureTransactions[getFutureTranIndex(demand.itemId, demand.locationId, date, futureTransactions)].transactions.push({ type: 'salesorder', quantity: demand.demand });
        }
        try {
            log.debug('getFutureTransactions', "Sorting " + futureTransactions.length + " transactions...");
            futureTransactions.sort(sortItemTransactionsByDate);
        }
        catch (e) {
            log.error('Error sorting transactions', e.message);
        }
        return futureTransactions;
    }
    function getFutureTranIndex(itemId, locationId, date, futureTransactions) {
        var idx = -1;
        for (var i = 0; i < futureTransactions.length; i++) {
            if (futureTransactions[i].date == date && futureTransactions[i].locationId == locationId && futureTransactions[i].itemId == itemId) {
                idx = i;
                break;
            }
        }
        if (!~idx) {
            idx = futureTransactions.length;
            futureTransactions.push({ itemId: itemId, locationId: locationId, date: date, transactions: [] });
        }
        return idx;
    }
    function getLatestSnapshot(itemId, locationId, snapshots) {
        var latestSnapshot = null;
        snapshots.forEach(function (snapshot) {
            var latestDate = latestSnapshot ? new Date(latestSnapshot.date) : new Date(0);
            var snapshotDate = new Date(snapshot.date);
            if (snapshot.itemId == itemId && snapshot.locationId == locationId && (latestDate.getTime() < snapshotDate.getTime()))
                latestSnapshot = snapshot;
        });
        return latestSnapshot;
    }
    /** Determine the demand for an item/location from one snapshot to the next supply increase. */
    function getUpcomingDemand(latestSnapshot, itemFutureTransactions, date, includePast, staticDemands) {
        var demand = 0;
        var currentDate = new Date(date).getTime();
        // First filter the item future transactions to only the item & location we care about.
        var futureTransactionSets = [];
        itemFutureTransactions.forEach(function (itemFutureTransactionSet) {
            if (itemFutureTransactionSet.itemId == latestSnapshot.itemId && itemFutureTransactionSet.locationId == latestSnapshot.locationId)
                futureTransactionSets.push(itemFutureTransactionSet);
        });
        log.debug("getUpcomingDemand", "Calculating Demand " + latestSnapshot.itemId + " " + date + "; Transaction Sets: " + JSON.stringify(futureTransactionSets));
        // Then find the next supply increase - that's how far we need to look at demand.
        var nextIncrease = null;
        futureTransactionSets.forEach(function (itemFutureTransactionSet) {
            var setDate = new Date(itemFutureTransactionSet.date);
            if (setDate.getTime() > currentDate && (!nextIncrease || setDate.getTime() < nextIncrease.getTime())) {
                itemFutureTransactionSet.transactions.forEach(function (tran) {
                    if (tran.type == 'purchaseorder' || (tran.type == 'transferorder' && tran.quantity > 0)) {
                        nextIncrease = setDate;
                        log.debug("getUpcomingDemand", "Calculating Demand " + latestSnapshot.itemId + " " + date + " - Found future supply on " + setDate + ": " + JSON.stringify(tran));
                    }
                });
            }
        });
        log.debug("getUpcomingDemand", "Calculating Demand " + latestSnapshot.itemId + " " + date + " - Next Supply: " + nextIncrease + ".");
        // [GOBASD-3] See if we have a static demand for this date/item/location
        var todayStr = format.format({ type: format.Type.DATE, value: new Date() });
        for (var _i = 0, staticDemands_1 = staticDemands; _i < staticDemands_1.length; _i++) {
            var staticDemand = staticDemands_1[_i];
            if (staticDemand.itemId != latestSnapshot.itemId || staticDemand.locationId != latestSnapshot.locationId || staticDemand.startDate.getTime() > currentDate || staticDemand.endDate.getTime() < currentDate)
                continue; // This static demand doesn't match our item, location, and time frame
            // return staticDemand.demand; // We only use this for the current date; otherwise static demand is built into future transactions
            log.audit('getUpcomingDemand', "Item " + latestSnapshot.itemId + " " + date + " - Using static demand: " + JSON.stringify(staticDemand) + ".");
            // If the previous snapshot was also in this static demand week, split the demand from it
            var previousDate = new Date(latestSnapshot.date);
            if (staticDemand.startDate.getTime() <= previousDate.getTime() && date != todayStr) { // We don't split it if we are processing "today", since its the first entry
                log.audit('getUpcomingDemand', "Item " + latestSnapshot.itemId + " " + date + " - Splitting static demand from previous entry: " + JSON.stringify(latestSnapshot) + ".");
                var splitDemand = Math.floor(latestSnapshot.demand / 2); // Round down. For example, if it was 125, this would be 62.
                latestSnapshot.demand -= splitDemand;
                latestSnapshot.balance += splitDemand;
                latestSnapshot.forReports = false;
                return splitDemand;
            }
            return staticDemand.demand;
        }
        // Now figure out how much demand we have from the previous snapshot to the next supply date calculated above.
        futureTransactionSets.forEach(function (itemFutureTransactionSet) {
            var setDate = new Date(itemFutureTransactionSet.date);
            if ((includePast || setDate.getTime() >= currentDate) && (!nextIncrease || setDate.getTime() < nextIncrease.getTime())) {
                itemFutureTransactionSet.transactions.forEach(function (tran) {
                    if (tran.type == 'salesorder') {
                        demand += tran.quantity;
                        log.debug("getUpcomingDemand", "Calculating Demand " + latestSnapshot.itemId + " " + date + " - Found SO demand on " + setDate + ": " + tran.quantity);
                    }
                    else if (tran.type == 'transferorder' && tran.quantity < 0) {
                        demand += Math.abs(tran.quantity);
                        log.debug("getUpcomingDemand", "Calculating Demand " + latestSnapshot.itemId + " " + date + " - Found TO demand on " + setDate + ": " + tran.quantity);
                    }
                });
            }
        });
        log.debug("getUpcomingDemand", "Calculating Demand " + latestSnapshot.itemId + " " + date + " - Location " + latestSnapshot.locationId + " Demand: " + demand + ".");
        return demand;
    }
    function getStaticDemand(itemIds, locationIds) {
        var staticDemand = [];
        if (itemIds.length == 0)
            return [];
        search.create({ type: 'customrecord_weekly_demand',
            filters: [['isinactive', 'is', 'F'], 'and', ['custrecord_weekly_demand_item', 'anyof', itemIds], 'and', ['custrecord_weekly_demand_location', 'anyof', locationIds]],
            columns: ['custrecord_weekly_demand_start_date', 'custrecord_weekly_demand_end_date', 'custrecord_weekly_demand_demand', 'custrecord_weekly_demand_item', 'custrecord_weekly_demand_location']
        }).run().each(function (result) {
            var startDate = format.parse({ type: format.Type.DATE, value: result.getValue('custrecord_weekly_demand_start_date') });
            var endDate = format.parse({ type: format.Type.DATE, value: result.getValue('custrecord_weekly_demand_end_date') });
            var itemId = result.getValue('custrecord_weekly_demand_item');
            var locationId = result.getValue('custrecord_weekly_demand_location');
            var demand = Number(result.getValue('custrecord_weekly_demand_demand'));
            staticDemand.push({ itemId: itemId, locationId: locationId, startDate: startDate, endDate: endDate, demand: demand, recordId: result.id });
            return true;
        });
        log.debug('getStaticDemand', "Items " + itemIds.length + ", locations " + locationIds.length + ": " + JSON.stringify(staticDemand) + ".");
        return staticDemand;
    }
    function getAllResults(searchObj) {
        var pageData = searchObj.runPaged({ pageSize: 1000 });
        var results = pageData.pageRanges
            .map(function (pageRange) { return pageData.fetch({ index: pageRange.index }); })
            .reduce(function (results, page) { return results.concat(page.data); }, []);
        log.audit('getAllResults() paged', "Search type: " + searchObj.searchType + "; Results: " + results.length + "; Usage left: " + runtime.getCurrentScript().getRemainingUsage() + ".");
        return results;
    }
    function sortItemTransactionsByDate(itemTranA, itemTranB) {
        try {
            var dateA = new Date(itemTranA.date).getTime();
            var dateB = new Date(itemTranB.date).getTime();
            if (dateA < dateB)
                return -1;
            else if (dateA > dateB)
                return 1;
        }
        catch (e) {
            log.error('Error sorting', e.message);
        }
        return 0;
    }
    function sortSnapshotsByDate(snapshotA, snapshotB) {
        var dateA = new Date(snapshotA.date).getTime();
        var dateB = new Date(snapshotB.date).getTime();
        if (dateA < dateB)
            return -1;
        else if (dateA > dateB)
            return 1;
        return 0;
    }
    return exports;
});
