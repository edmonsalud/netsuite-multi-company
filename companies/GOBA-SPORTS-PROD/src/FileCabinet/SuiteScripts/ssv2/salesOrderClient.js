/**
 * salesOrderClient.ts
 * by Head in the Cloud Development, Ltd.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Sales Order - Client
 * @NScriptType ClientScript
 * @NApiVersion 2.1
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["N/currentRecord", "N/format", "N/https", "N/runtime", "N/search", "N/ui/message", "N/url", "./zones/freightAndInstallZoneUtils"], function (currentRecord, format, https, runtime, search, message, url, freightAndInstallZoneUtils_1) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sendJobToQuickContractors = exports.calculateFreightCost = exports.addInstallCost = exports.defaultWarehouses = exports.itemSearchButton = exports.postSourcing = exports.fieldChanged = void 0;
    function fieldChanged(context) {
        if (context.fieldId == 'startdate') {
            context.currentRecord.setValue('custbody_runreallocationscript', true); // Per meeting with Rebecca on 16 Feb 2017
        }
        if (context.fieldId == 'custbody_for_installation') { //fieldChanged_freightSO
            const forInstall = context.currentRecord.getValue('custbody_for_installation');
            const installAvail = context.currentRecord.getValue('custbody_install_available');
            if (!installAvail) {
                if (!forInstall)
                    context.currentRecord.setValue('custbody_install_override', true);
                else
                    context.currentRecord.setValue('custbody_install_override', false);
            }
        }
    }
    exports.fieldChanged = fieldChanged;
    function postSourcing(context) {
        if (context.fieldId == 'shipaddresslist') {
            updateFreightAndInstallZones(context.currentRecord);
        }
    }
    exports.postSourcing = postSourcing;
    function updateFreightAndInstallZones(currentRec) {
        const postalcode = currentRec.getValue({ fieldId: 'shipzip' });
        const stateProvince = currentRec.getValue({ fieldId: 'shipstate' });
        const country = currentRec.getValue({ fieldId: 'shipcountry' });
        console.log(postalcode, stateProvince, country);
        if (!postalcode || !country)
            return;
        const freigthZone = (0, freightAndInstallZoneUtils_1.searchFreightZone)(postalcode, stateProvince, country);
        const installZones = (0, freightAndInstallZoneUtils_1.searchInstallZones)(postalcode, stateProvince, country);
        console.log('freigthZone', freigthZone, 'installZones', installZones);
        currentRec.setValue({ fieldId: 'custbody_hitc_freight_zone', value: '' });
        currentRec.setValue({ fieldId: 'custbody_delivery_available', value: false });
        currentRec.setValue({ fieldId: 'custbody_pickup_available', value: false });
        if (freigthZone.length == 1) {
            currentRec.setValue({ fieldId: 'custbody_hitc_freight_zone', value: freigthZone[0].zoneid });
            currentRec.setValue({ fieldId: 'custbody_delivery_available', value: freigthZone[0].delivery });
            currentRec.setValue({ fieldId: 'custbody_pickup_available', value: Number(freigthZone[0].onlinePickupLocation) > 0 });
            const itemSublist = currentRec.getSublist({ sublistId: 'item' });
            const deliveryColumn = itemSublist.getColumn({ fieldId: 'custcol_delivery' });
            deliveryColumn.isDisabled = !freigthZone[0].delivery;
        }
        currentRec.setValue({ fieldId: 'custbody_install_available', value: false });
        currentRec.setValue({ fieldId: 'custbody_install_group', value: '' });
        currentRec.setValue({ fieldId: 'custbody_install_cost', value: '' });
        if (installZones.length == 1 && installZones[0].installCost > 0) {
            currentRec.setValue({ fieldId: 'custbody_install_available', value: installZones[0].installCost > 0 });
            currentRec.setValue({ fieldId: 'custbody_install_group', value: installZones[0].installGroupId });
            currentRec.setValue({ fieldId: 'custbody_install_cost', value: installZones[0].installCost });
            currentRec.setValue({ fieldId: 'custbody_so_installer', value: installZones[0].installer }); // [GOBASD-36]
        }
    }
    function itemSearchButton() {
        isATPRunning();
        const itemSearchDiv = jQuery('#item_search');
        if (itemSearchDiv.length > 0) { // If we are searching for something, clear the previous results and reset the dialog box
            jQuery('#item_search_button').prop('disabled', false);
            jQuery('#item_search_results').empty();
            jQuery('#item_search_esd').val('');
            jQuery('#item_search_text').val('');
            itemSearchDiv.dialog('option', 'position', { my: 'center', at: 'center', of: document });
            itemSearchDiv.dialog('option', 'height', 'auto'); // Without this, it re-opens in a collapsed state.
            return itemSearchDiv.dialog('open');
        }
        jQuery('<div id="item_search">').attr('title', 'Item Search').html(`
    <p id="atp_warning"></p>
    <label for="item_search_text">Parent Item:</label>
    <input type="text" placeholder="Search for..." id="item_search_text"> 
    <label for="item_search_esd">Expected Ship Date:</label>
    <input type="text" placeholder="mm/dd/yyyy format" id="item_search_esd"> 
    <button id="item_search_button">Search</button><br />
    <table id="item_search_results" style="width: 100%;" />
  `).dialog({
            modal: true,
            position: { my: 'center', at: 'center', of: document },
            width: 1200,
            buttons: [
                { text: 'Add Items', click: addSelectedItemsToOrder },
                {
                    text: 'Cancel',
                    click: function () {
                        jQuery('#item_search').dialog('close');
                    }
                }
            ]
        });
        jQuery('#item_search_button').on('click', searchForItems);
        jQuery('#item_search_esd').datepicker();
    }
    exports.itemSearchButton = itemSearchButton;
    /** Checks to see if the "Item ATP - Map/Reduce" script is currently running. If so, set <p> content. */
    function isATPRunning() {
        search.create.promise({
            type: 'scheduledscriptinstance',
            filters: [['status', 'anyof', 'PROCESSING'], 'and', ['script.scriptid', 'is', 'customscript_itematp_mapreduce']]
        }).then((scriptInstanceSearch) => {
            scriptInstanceSearch.run().getRange.promise({ start: 0, end: 1 }).then((results) => {
                const atpWarning = results.length > 0 ? '<h3>Warning: ATP Recalculation is in progress!</h3>' : '';
                jQuery('#atp_warning').html(atpWarning);
            });
        });
    }
    function searchForItems(eventObject) {
        if (eventObject)
            eventObject.preventDefault();
        jQuery('#item_search_button').prop('disabled', true).html('Searching...');
        jQuery('#item_search_results').empty();
        currentRecord.get.promise().then((rec) => {
            // Set up search filters
            const parentItemInput = String(jQuery('#item_search_text').val()).trim();
            const locationId = rec.getValue('locaiton');
            const subsidiaryId = rec.getValue('subsidiary');
            const filters = [
                ['isinactive', 'is', 'F'], 'and',
                [['parent.name', 'is', parentItemInput], 'or', ['itemid', 'is', parentItemInput], 'or', ['custitem_old_item', 'contains', parentItemInput]] // [GOBASD-1]
            ];
            if (subsidiaryId)
                filters.push('and', ['subsidiary', 'anyof', subsidiaryId]);
            if (locationId)
                filters.push('and', ['inventorylocation', 'anyof', locationId]);
            search.create.promise({
                type: 'item',
                filters,
                columns: ['displayname', 'itemid', 'parent', 'custitem_size_list', 'custitem_colour_group', 'locationquantityonorder', 'locationquantityavailable', 'matrix']
            }).then((itemSearch) => {
                itemSearch.run().getRange.promise({ start: 0, end: 1000 }).then(displayItemResults).catch((reason) => {
                    console.log('searchForItems search run failed', reason);
                });
            }).catch((reason) => {
                console.log('searchForItems item search failed', reason);
            }); // End search promise
        });
    }
    /** Parse parent styles from items found, identify the size scale, and populate the table. */
    function displayItemResults(results) {
        console.log('displayItemResults results found', results.length);
        const parentItemNames = [];
        const parentStyles = {}; // Will be like: 1000093: ['ABW', 'CPN', 'HBWH']
        let parentSizes = ''; // Will be like "10,11,7,8,9"
        let multipleSizeTypesFound = false; // So we can warn the user just once
        for (let i = 0; i < results.length; i++) {
            const isMatrix = results[i].getValue('matrix');
            const itemName = results[i].getValue('itemid');
            let parentItem = results[i].getText('parent');
            const sizeGroup = results[i].getText('custitem_size_list');
            if (!parentItem && !isMatrix)
                parentItem = itemName; // If this item has no parent and is not a matrix item, then it is the parent item.
            if (!parentItem && sizeGroup) {
                if (parentSizes && parentSizes != sizeGroup) {
                    if (!multipleSizeTypesFound)
                        alert("Warning: Multiple size types were found, only the first set is shown here.");
                    multipleSizeTypesFound = true;
                    continue;
                }
                else if (!parentSizes) { // This is the first parent found
                    parentSizes = sizeGroup;
                }
            }
            if (parentItem) {
                if (!parentItemNames.includes(parentItem)) {
                    parentItemNames.push(parentItem); // Add the parent item
                    parentStyles[parentItem] = [];
                }
                const itemStyle = parseStyleName(itemName);
                if (!parentStyles[parentItem].includes(itemStyle))
                    parentStyles[parentItem].push(itemStyle);
            }
        }
        if (!parentSizes)
            parentSizes = 'Non-Matrix';
        addHTMLRowsToTable(results, parentItemNames, parentStyles, parentSizes);
        jQuery('#item_search_button').prop('disabled', false).html('Search'); // Re-enable the button so they can search again
        jQuery('.itemQuantity').on('change', validateQuantity);
    }
    /** Add a group of rows for each parent item found. */
    function addHTMLRowsToTable(results, parentItemNames, parentStyles, parentSizes) {
        const sizeScale = getSizeScale(parentSizes);
        if (parentSizes) { // Build the header row with the size names
            const row = jQuery('<tr>');
            row.append(jQuery('<th>').text('Parent Item'));
            row.append(jQuery('<th>').text('Display Name'));
            row.append(jQuery('<th>').text('Colour Description'));
            for (const size of sizeScale) {
                jQuery('<th>').text(size).css('text-align', 'center').appendTo(row);
            }
            jQuery('<th>').text('Total').css('text-align', 'center').appendTo(row);
            row.appendTo('#item_search_results');
        }
        else
            jQuery('#item_search_results').append(jQuery('<tr>').append('<td colspan="3">').text(`No matching parent item found.`));
        const itemATPs = getATPValues(results); // We show the ATP in brackets beside each item quantity input
        const rec = currentRecord.get();
        parentItemNames.forEach((parentName) => {
            parentStyles[parentName].forEach((style) => {
                addRowForStyle(style, parentName, sizeScale, itemATPs, results, rec);
            });
        });
    }
    function addRowForStyle(style, parentName, sizeScale, itemATPs, results, rec) {
        let color = ''; // We'll add this below after going through the results
        let display = ''; // We'll add this below after going through the results
        const itemRow = jQuery('<tr>').addClass('addItemRow');
        itemRow.append(jQuery('<td>').text(style));
        // Initialize an input element for each size required
        const sizeInputs = [];
        sizeScale.forEach((size) => {
            const input = jQuery('<input>').attr('type', 'text').attr('size', '4').addClass('itemQuantity').attr('title', size);
            sizeInputs.push(input);
        });
        results.forEach((result) => {
            const itemName = result.getValue('itemid');
            const resultStyle = result.getText('parent') || itemName; // Non-matrix items don't have a parent
            if (resultStyle != parentName || style != parseStyleName(itemName))
                return;
            if (!color)
                color = result.getText('custitem_colour_group');
            if (!display)
                display = result.getValue('displayname');
            const itemSize = result.getText('custitem_size_list') || 'Non-Matrix';
            const onHand = result.getValue('locationquantityonhand');
            const onOrder = result.getValue('locationquantityonorder');
            const sizeIdx = sizeScale.indexOf(itemSize);
            if (!~sizeIdx)
                return;
            // See if there's already any of this item on the order
            const line = rec.findSublistLineWithValue({ sublistId: 'item', fieldId: 'item', value: result.id });
            const qty = ~line ? String(rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line })) : '';
            sizeInputs[sizeIdx].data('internalid', result.id).data('atp', itemATPs[result.id].available).data('onorder', onOrder).data('onhand', onHand).data('poPastDue', itemATPs[result.id].hasPastDuePO).val(qty);
        });
        itemRow.append(jQuery('<td>').text(display));
        itemRow.append(jQuery('<td>').text(color));
        sizeInputs.forEach((sizeInput) => {
            const sizeATP = sizeInput.data('atp') || '';
            if (!sizeATP)
                sizeInput.prop('disabled', true); // This item doesn't come in this size
            const pastDueIndicator = sizeInput.data('poPastDue') ? '<b>*</b>' : '';
            itemRow.append(jQuery('<td>').css('text-align', 'center').append(sizeInput).append(` [${sizeATP}]${pastDueIndicator}`));
        });
        itemRow.append(jQuery('<td>').css('text-align', 'center').addClass('row_total').html('0'));
        jQuery('#item_search_results').append(itemRow);
    }
    /** Read the quantity inputs and add the selected items to the order */
    function addSelectedItemsToOrder() {
        // Gather quantities entered
        const itemsToAdd = [];
        jQuery('.itemQuantity').each((qtyIdx, qtyInput) => {
            if (Number(qtyInput.value)) {
                console.log('Adding item quantity idx to order', qtyIdx);
                itemsToAdd.push({ itemId: jQuery(qtyInput).data('internalid'), quantity: qtyInput.value, atp: jQuery(qtyInput).data('atp') });
            }
        });
        const esdString = jQuery('#item_search_esd').val();
        const expShipDate = esdString ? new Date(esdString) : null;
        // Add the items
        currentRecord.get.promise().then((rec) => {
            itemsToAdd.forEach((item) => {
                if (Number(item.quantity) >= 1000 && !~item.quantity.indexOf('.'))
                    item.quantity += '.00'; // Workaround for case 2834230
                const line = rec.findSublistLineWithValue({ sublistId: 'item', fieldId: 'item', value: item.itemId }); // [GOBA-9] See if this item is already on the order
                ~line ? rec.selectLine({ sublistId: 'item', line }) : rec.selectNewLine({ sublistId: 'item' });
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: item.itemId, fireSlavingSync: true });
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: item.quantity, fireSlavingSync: true });
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'expectedshipdate', value: expShipDate, fireSlavingSync: true });
                rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_atp', value: item.atp, fireSlavingSync: true });
                rec.commitLine({ sublistId: 'item' });
            });
        });
        jQuery('#item_search').dialog('close');
    }
    function getATPValues(itemResults) {
        const itemATPs = {};
        const itemIds = [];
        itemResults.forEach((itemResult) => {
            itemATPs[itemResult.id] = { available: '0', hasPastDuePO: false };
            itemIds.push(itemResult.id);
        });
        const expectedShipDate = String(jQuery('#item_search_esd').val());
        const locationId = currentRecord.get().getValue('location');
        const filters = [['isinactive', 'is', 'F'], 'and', ['custrecord_atpsnapshot_item', 'anyof', itemIds]];
        if (expectedShipDate) {
            filters.push('and', ['custrecord_atpsnapshot_date', 'onorbefore', expectedShipDate]);
        }
        else {
            filters.push('and', ['custrecord_atpsnapshot_date', 'on', 'today']);
        }
        if (locationId)
            filters.push('and', ['custrecord_atpsnapshot_location', 'anyof', locationId]);
        if (itemIds.length > 0)
            search.create({
                type: 'customrecord_atpsnapshot',
                filters,
                columns: [
                    search.createColumn({ name: 'custrecord_atpsnapshot_date', sort: search.Sort.ASC }),
                    search.createColumn({ name: 'custrecord_atpsnapshot_available' }),
                    search.createColumn({ name: 'custrecord_atpsnapshot_item' }),
                    search.createColumn({ name: 'custrecord_atpsnapshot_pastduepo' })
                ]
            }).run().each((result) => {
                const itemId = result.getValue('custrecord_atpsnapshot_item');
                itemATPs[itemId] = {
                    available: result.getValue('custrecord_atpsnapshot_available'),
                    hasPastDuePO: result.getValue('custrecord_atpsnapshot_pastduepo')
                };
                return true;
            });
        return itemATPs;
    }
    /** Convert like 'M,L,S,XL' to ['S', 'M', 'L', 'XL'] */
    function getSizeScale(sizes) {
        if (!sizes)
            return [];
        const sizesInput = sizes.split(',');
        const sortedSizes = [
            ['7', '71/8', '71/4', '73/8', '71/2', '75/8', '73/4', '77/8'],
            ['S/M', 'M/L', 'L/XL'],
            ['B', 'LB'],
            ['YL', 'YXL', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
            ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
            ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            ['YXXS', 'YXS', 'YS', 'YM', 'YL', 'YXL'],
            ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
            ['XXXS', ' YXXS', 'YXS'],
            ['XXXS', 'XXS', 'XS', 'S', 'M', 'L'],
            ['30', '32', '33', '34', '36', '38', '40'],
            ['4', '6', '8', '10', '12', '14'],
            ['3', '4', '5', '6', '7', '8', '9', '10', '11'],
            ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '14', '15', '16'],
            ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '14'],
            ['5', '6', '7', '8', '9', '10', '11'],
            ['5', '6', '7', '8', '9', '10', '11', '12'],
            ['6', '7', '8', '9', '10', '11', '12', '13', '14'],
            ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
            ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '11'],
            ['2', '3', '3.5', '4', '4.5', '5', '5.5', '6'],
            ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5'],
            ['4', '5', '6', '7', '8', '9'],
            ['15', '16', '17', '18'],
            ['11', '12', '13', '1', '2', '3', '3.5', '4', '4.5', '5', '5.5', '6'],
            ['8', '9', '10', '11', '12', '13', '1', '2', '3', '3.5', '4', '4.5', '5', '5.5', '6'],
            ['13/1', '2/3', '4/5', '6/7'],
            ['7/8', '9/10', '11/12'],
            ['Non-Matrix']
        ];
        // Find a match
        let subsetIdx = -1; // A subset match is when the parent's sizes are all contained in a larger size scale
        for (let j = 0; j < sortedSizes.length; j++) {
            let matchFound = true; // A match is when the parent's sizes match a pre-defined size scale exactly.
            let subsetFound = true;
            // Make sure all the size scale's elements are in the parent item's sizes
            for (let i = 0; i < sortedSizes[j].length; i++) {
                if (!~sizesInput.indexOf(sortedSizes[j][i])) {
                    matchFound = false;
                    break;
                }
            }
            // Make sure all the parent item's sizes are in this sorted size scale
            for (let i = 0; i < sizesInput.length; i++) {
                if (!~sortedSizes[j].indexOf(sizesInput[i])) {
                    matchFound = false;
                    subsetFound = false;
                    break;
                }
            }
            if (matchFound)
                return sortedSizes[j];
            else if (subsetFound)
                subsetIdx = j;
        }
        if (~subsetIdx)
            return sortedSizes[subsetIdx];
        return sizesInput; // If there were no matches found
    }
    function parseStyleName(itemName) {
        let styleName = '';
        ['/', '-'].forEach((splittingCharacter) => {
            if (~itemName.indexOf(splittingCharacter)) {
                let itemNameWords = itemName.split(splittingCharacter);
                if (itemNameWords.length > 2)
                    styleName = [itemNameWords[0], itemNameWords[1]].join(splittingCharacter);
            }
        });
        return styleName;
    }
    /** Ensure the quantity is a number, etc. */
    function validateQuantity() {
        const input = Number(jQuery(this).val());
        if (isNaN(input)) {
            alert('Invalid number (must be between -9999999999 and 9999999999)');
            jQuery(this).val('');
        }
        else {
            const onHand = Number(jQuery(this).data('onhand'));
            const onOrder = Number(jQuery(this).data('onorder'));
            if (input > (onHand + onOrder))
                alert(`Warning: This item has ${onHand} on hand and ${onOrder} on order. There may not be ${input} available until after a new production order is placed.`);
            let totalQty = 0;
            jQuery(this).parent().parent().find('.itemQuantity').each((idx, elem) => {
                console.log('validateQuantity - Adding total quantity for idx', idx);
                totalQty += Number(jQuery(elem).val());
            });
            jQuery(this).parent().parent().find('.row_total').text(totalQty);
        }
    }
    // Button Click Events
    function defaultWarehouses() {
        currentRecord.get.promise().then(rec => {
            const items = rec.getLineCount({ sublistId: 'item' });
            if (items > 0) {
                const postalcode = rec.getValue({ fieldId: 'shipzip' });
                const stateProvince = rec.getValue({ fieldId: 'shipstate' });
                const country = rec.getValue({ fieldId: 'shipcountry' });
                const freightZones = (0, freightAndInstallZoneUtils_1.searchFreightZone)(postalcode, stateProvince, country);
                console.log('freightZones', freightZones);
                (0, freightAndInstallZoneUtils_1.setDefaultWarehouses)(rec, freightZones);
            }
            else {
                alert(`Please add at least one item`);
            }
        });
    }
    exports.defaultWarehouses = defaultWarehouses;
    function addInstallCost() {
        return __awaiter(this, void 0, void 0, function* () {
            const rec = yield currentRecord.get.promise();
            const installAvailable = rec.getValue({ fieldId: 'custbody_install_available' });
            if (installAvailable) {
                const trampoline_class = runtime.getCurrentScript().getParameter({ name: 'custscript_trampoline_class' });
                const postalcode = rec.getValue({ fieldId: 'shipzip' });
                const stateProvince = rec.getValue({ fieldId: 'shipstate' });
                const country = rec.getValue({ fieldId: 'shipcountry' });
                const installationItemID = runtime.getCurrentScript().getParameter({ name: 'custscript_install_item' });
                const installGroup = (0, freightAndInstallZoneUtils_1.searchInstallZones)(postalcode, stateProvince, country);
                if (installGroup.length != 1) {
                    alert(`No installation groups or multiple were found. Can't continue`);
                    return;
                }
                if (!trampoline_class) {
                    alert('Set Up Error: Installation Cost cannot be calculated; \nTrampoline Item Class parameter is not set up.');
                    return;
                }
                if (!installationItemID) {
                    alert('Set Up Error: Installation Cost cannot be added; \nInstallation Item parameter is not set up.');
                    return;
                }
                let calculationString = '';
                let totalInstallCost = 0;
                let totalInstallQty = 0;
                for (let line = 0; line < rec.getLineCount({ sublistId: 'item' }); line++) {
                    const item = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line });
                    const itemType = (0, freightAndInstallZoneUtils_1.getItemType)(rec.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line }));
                    const itemClassLookup = yield search.lookupFields.promise({ type: itemType, id: item, columns: 'class' });
                    const itemClasses = itemClassLookup.class;
                    const itemClass = itemClasses.length > 0 ? itemClasses[0].value : '';
                    if (itemClass == trampoline_class) {
                        const itemName = rec.getSublistText({ sublistId: 'item', fieldId: 'item', line });
                        const itemQty = Number(rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line }));
                        const itemType = rec.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line });
                        if (['InvtPart', 'Kit', 'Assembly'].includes(itemType)) {
                            const cost = itemQty * installGroup[0].installCost;
                            totalInstallCost += cost;
                            totalInstallQty += itemQty;
                            calculationString += `${itemQty} x ${itemName} (${format.format({ type: format.Type.CURRENCY, value: installGroup[0].installCost })})\n`;
                        }
                    }
                }
                calculationString += calculationString.length > 0 ? `   -----------    \nTotal Cost: ${format.format({ type: format.Type.CURRENCY, value: totalInstallCost })}` : '';
                console.log('totalInstallCost', totalInstallCost);
                if (totalInstallCost > 0) {
                    let taxItem = Number(rec.getSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: 0 }));
                    // check if install item already on the SO. If so, remove and replace with new one
                    const match = rec.findSublistLineWithValue({ sublistId: 'item', fieldId: 'item', value: installationItemID });
                    match > -1 ? rec.selectLine({ sublistId: 'item', line: match }) : rec.selectNewLine({ sublistId: 'item' });
                    if (match < 0)
                        rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: installationItemID, forceSyncSourcing: true });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: totalInstallQty });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: taxItem, forceSyncSourcing: true });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: -1, forceSyncSourcing: true });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: installGroup[0].installCost });
                    rec.commitLine({ sublistId: 'item' });
                    rec.setValue({ fieldId: 'custbody_for_installation', value: true });
                    rec.setValue({ fieldId: 'custbody_calc_installation', value: calculationString });
                    alert(`Added Installation Cost: ${format.format({ type: format.Type.CURRENCY, value: totalInstallCost })}`);
                }
                else {
                    alert('Installation came out to $0.');
                }
            }
            else {
                alert('Installation is not available for this address.');
            }
        });
    }
    exports.addInstallCost = addInstallCost;
    // export function getItemRecordType(itemType: string): record.Type {
    //   let type = record.Type.INVENTORY_ITEM
    //   switch (itemType) {
    //     case 'Kit':
    //       type = record.Type.KIT_ITEM
    //       break;
    //     case 'Assembly':
    //       type = record.Type.ASSEMBLY_ITEM;
    //       break;
    //     case 'NonInvtPart':
    //       type = record.Type.NON_INVENTORY_ITEM;
    //       break;
    //     case 'Service':
    //       type = record.Type.SERVICE_ITEM;
    //       break;
    //     case 'Discount':
    //       type = record.Type.DISCOUNT_ITEM;
    //       break;
    //     case 'GiftCert':
    //       type = record.Type.GIFT_CERTIFICATE;
    //       break;
    //     case 'InvtPart':
    //       type = record.Type.INVENTORY_ITEM;
    //       break;
    //     case 'Group':
    //       type = record.Type.ITEM_GROUP;
    //       break;
    //     case 'OthCharge':
    //       type = record.Type.OTHER_CHARGE_ITEM;
    //       break;
    //     case 'Payment':
    //       type = record.Type.PAYMENT_ITEM;
    //       break;
    //     default:
    //       break;
    //   }
    //   return type;
    // }
    function calculateFreightCost() {
        currentRecord.get.promise().then(rec => {
            console.log('calculateFreightCost');
            const deliveryAvailable = rec.getValue({ fieldId: 'custbody_delivery_available' });
            const selectedFreightZone = Number(rec.getValue({ fieldId: 'custbody_hitc_freight_zone' })); // converted to list - used to be custbody_freight_zone
            let freightCostString = ``;
            if (selectedFreightZone > 0 && deliveryAvailable) {
                const postalcode = rec.getValue({ fieldId: 'shipzip' });
                const stateProvince = rec.getValue({ fieldId: 'shipstate' });
                const country = rec.getValue({ fieldId: 'shipcountry' });
                let taxItem = 0;
                const shipItemId = runtime.getCurrentScript().getParameter({ name: 'custscript_shipping_item' });
                if (!shipItemId) {
                    alert('Set Up Error: Ship Cost cannot be added; \nShip Item parameter is not set up.');
                    return;
                }
                const itemIds = [];
                let itemQtyMap = {};
                for (let i = 0; i < rec.getLineCount({ sublistId: 'item' }); i++) { // loop lines and condense them into a unique map
                    if (i == 0)
                        taxItem = Number(rec.getSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: i }));
                    const item = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    const itemName = rec.getSublistText({ sublistId: 'item', fieldId: 'item', line: i });
                    const qty = rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                    const forDelivery = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_delivery', line: i });
                    const itemType = rec.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                    if (forDelivery && ['InvtPart', 'Kit', 'Assembly'].includes(itemType)) {
                        if (itemIds.indexOf(item) < 0)
                            itemIds.push(item);
                        if (!itemQtyMap[item]) {
                            itemQtyMap[item] = {
                                id: item,
                                cost: 0,
                                qty: 0,
                                name: itemName,
                                currency: '',
                                solo: isItemSoloItem(item)
                            };
                        }
                        itemQtyMap[item].qty += qty;
                    }
                }
                if (itemIds.length < 1) {
                    alert('Please mark items for delivery.');
                    return;
                }
                itemQtyMap = (0, freightAndInstallZoneUtils_1.calculateFreightCosts)(itemQtyMap, itemIds, selectedFreightZone, postalcode, stateProvince, country);
                let totalCost = 0;
                for (let cost in itemQtyMap) {
                    freightCostString += `${itemQtyMap[cost].qty} x ${itemQtyMap[cost].name} + (${format.format({ type: format.Type.CURRENCY, value: itemQtyMap[cost].cost })})\n`;
                    totalCost += itemQtyMap[cost].cost;
                }
                freightCostString += `   -----------    \nTotal Cost: ' + ${format.format({ type: format.Type.CURRENCY, value: totalCost })}`;
                if (totalCost > 0) {
                    // check if install item already on the SO. If so, remove and replace with new one
                    const match = rec.findSublistLineWithValue({ sublistId: 'item', fieldId: 'item', value: shipItemId });
                    match > -1 ? rec.selectLine({ sublistId: 'item', line: match }) : rec.selectNewLine({ sublistId: 'item' });
                    if (match < 0)
                        rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: shipItemId });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: taxItem, fireSlavingSync: true });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: -1, fireSlavingSync: true });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: totalCost });
                    rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: totalCost });
                    rec.commitLine({ sublistId: 'item' });
                    rec.setValue({ fieldId: 'custbody_calc_freight_cost', value: freightCostString });
                    alert(`Added Shipping Cost: ${format.format({ type: format.Type.CURRENCY, value: totalCost })}`);
                }
                else {
                    alert('Freight Cost is not applicable to this order.');
                }
            }
            else {
                alert('Freight Cost is not applicable to this order.');
            }
        });
    }
    exports.calculateFreightCost = calculateFreightCost;
    function sendJobToQuickContractors() {
        return __awaiter(this, void 0, void 0, function* () {
            let banner = message.create({ title: 'Job Being Sent to Quick Contractors', message: '', type: message.Type.INFORMATION });
            const rec = yield currentRecord.get.promise();
            const serverTask = url.resolveScript({ scriptId: 'customscript_server_task_suitelet', deploymentId: 'customdeploy1' }); // [GOBASD-28]
            banner.show();
            const qcResponse = yield https.post.promise({ url: serverTask, body: { mode: 'sendOrderToQuickContractors', orderId: rec.id } });
            console.log('sendJobToQuickContractors response', qcResponse.code, qcResponse.body);
            try {
                const response = JSON.parse(qcResponse.body);
                if (response.isSuccess) {
                    banner.hide();
                    banner = message.create({ title: 'Job Sent to Quick Contractors', message: 'Refresh Page to See Job ID', type: message.Type.CONFIRMATION });
                    banner.show();
                }
                else {
                    banner.hide();
                    banner = message.create({
                        title: 'Job Not Sent to Quick Contractors',
                        message: response.errors && response.errors.length > 0 ? response.errors[0] : response.message,
                        type: message.Type.ERROR
                    });
                    banner.show();
                }
            }
            catch (e) {
                console.log(e);
                banner.hide();
                banner = message.create({ title: 'Job Not Sent to Quick Contractors', message: 'There was a problem submitting the job.', type: message.Type.ERROR });
                banner.show();
            }
        });
    }
    exports.sendJobToQuickContractors = sendJobToQuickContractors;
    function isItemSoloItem(item) {
        return getSoloItems().indexOf(item) > -1;
    }
    function getSoloItems() {
        const ladderItemID = runtime.getCurrentScript().getParameter({ name: 'custscript_itmgrp_ladder' }) || '76';
        const hoopItemID = runtime.getCurrentScript().getParameter({ name: 'custscript_itmgrp_hoop' }) || '82';
        const wheelsItemID = runtime.getCurrentScript().getParameter({ name: 'custscript_itmgrp_wheels' });
        const anchorItemID = runtime.getCurrentScript().getParameter({ name: 'custscript_itmgrp_anchor' });
        const coverItemID = runtime.getCurrentScript().getParameter({ name: 'custscript_itmgrp_cover' });
        return [ladderItemID, hoopItemID, wheelsItemID, anchorItemID, coverItemID];
    }
    return exports;
});
