/**
 * returnAuthClient.ts
 * by Head in the Cloud Development, Ltd.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Return Authorisation - Client
 * @NScriptType ClientScript
 * @NApiVersion 2.x
 */
define(["N/currentRecord", "N/search"], function (currentRecord, search) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function pageInit(context) {
    }
    exports.pageInit = pageInit;
    function fieldChanged(context) {
    }
    exports.fieldChanged = fieldChanged;
    function itemSearchButton() {
        isATPRunning();
        var itemSearchDiv = jQuery('#item_search');
        if (itemSearchDiv.length > 0) { // If we are searching for something, clear the previous results and reset the dialog box
            jQuery('#item_search_button').prop('disabled', false);
            jQuery('#item_search_results').empty();
            jQuery('#item_search_esd').val('');
            jQuery('#item_search_text').val('');
            itemSearchDiv.dialog('option', 'position', { my: 'center', at: 'center', of: document });
            itemSearchDiv.dialog('option', 'height', 'auto'); // Without this, it re-opens in a collapsed state.
            return itemSearchDiv.dialog('open');
        }
        jQuery('<div id="item_search">').attr('title', 'Item Search').html("\n    <p id=\"atp_warning\"></p>\n    <label for=\"item_search_text\">Parent Item:</label>\n    <input type=\"text\" placeholder=\"Search for...\" id=\"item_search_text\"> \n    <label for=\"item_search_esd\">Expected Ship Date:</label>\n    <input type=\"text\" placeholder=\"mm/dd/yyyy format\" id=\"item_search_esd\"> \n    <button id=\"item_search_button\">Search</button><br />\n    <table id=\"item_search_results\" width=\"100%\" />\n  ").dialog({
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
            filters: [
                ['status', 'anyof', 'PROCESSING'], 'and',
                ['script.scriptid', 'is', 'customscript_itematp_mapreduce']
            ]
        }).then(function (scriptInstanceSearch) {
            scriptInstanceSearch.run().getRange.promise({ start: 0, end: 1 }).then(function (results) {
                var atpWarning = results.length > 0 ? '<h3>Warning: ATP Recalculation is in progress!</h3>' : '';
                jQuery('#atp_warning').html(atpWarning);
            });
        });
    }
    function searchForItems(eventObject) {
        if (eventObject)
            eventObject.preventDefault();
        jQuery('#item_search_button').prop('disabled', true).html('Searching...');
        jQuery('#item_search_results').empty();
        currentRecord.get.promise().then(function (rec) {
            // Set up search filters
            var parentItemInput = String(jQuery('#item_search_text').val()).trim();
            var locationId = rec.getValue('locaiton');
            var subsidiaryId = rec.getValue('subsidiary');
            var filters = [
                ['isinactive', 'is', 'F'], 'and',
                [['parent.name', 'is', parentItemInput], 'or', ['itemid', 'is', parentItemInput], 'or', ['custitem_old_item', 'contains', parentItemInput]]
            ];
            if (subsidiaryId)
                filters.push('and', ['subsidiary', 'anyof', subsidiaryId]);
            if (locationId)
                filters.push('and', ['inventorylocation', 'anyof', locationId]);
            search.create.promise({
                type: 'item',
                filters: filters,
                columns: ['displayname', 'itemid', 'parent', 'custitem_size_list', 'custitem_colour_group', 'locationquantityonorder', 'locationquantityavailable', 'matrix']
            }).then(function (itemSearch) {
                itemSearch.run().getRange.promise({ start: 0, end: 1000 }).then(displayItemResults);
            }); // End search promise
        });
    }
    /** Parse parent styles from items found, identify the size scale, and populate the table. */
    function displayItemResults(results) {
        // Figure out what type of size category we are using and group by parent name
        var parentItemNames = [];
        var parentStyles = {}; // Will be like: 1000093: ['ABW', 'CPN', 'HBWH']
        var parentSizes = ''; // Will be like "10,11,7,8,9"
        var multipleSizeTypesFound = false; // So we can warn the user just once
        for (var i = 0; i < results.length; i++) {
            var isMatrix = results[i].getValue('matrix');
            var itemName = results[i].getValue('itemid');
            var parentItem = results[i].getText('parent');
            var sizeGroup = results[i].getText('custitem_size_list');
            if (!parentItem && !isMatrix)
                parentItem = itemName;
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
                if (!~parentItemNames.indexOf(parentItem)) {
                    parentItemNames.push(parentItem); // Add the parent item
                    parentStyles[parentItem] = [];
                }
                var itemStyle = parseStyleName(itemName);
                if (!~parentStyles[parentItem].indexOf(itemStyle))
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
        var sizeScale = getSizeScale(parentSizes);
        if (parentSizes) { // Build the header row with the size names
            var row = jQuery('<tr>');
            row.append(jQuery('<th>').text('Parent Item'));
            row.append(jQuery('<th>').text('Display Name'));
            row.append(jQuery('<th>').text('Colour Description'));
            for (var _i = 0, sizeScale_1 = sizeScale; _i < sizeScale_1.length; _i++) {
                var size = sizeScale_1[_i];
                jQuery('<th>').text(size).css('text-align', 'center').appendTo(row);
            }
            jQuery('<th>').text('Total').css('text-align', 'center').appendTo(row);
            row.appendTo('#item_search_results');
        }
        else
            jQuery('#item_search_results').append(jQuery('<tr>').append('<td colspan="3">').text("No matching parent item found."));
        var itemATPs = getATPValues(results); // We show the ATP in brackets beside each item quantity input
        var rec = currentRecord.get();
        parentItemNames.forEach(function (parentName) {
            parentStyles[parentName].forEach(function (style) {
                addRowForStyle(style, parentName, sizeScale, itemATPs, results, rec);
            });
        });
    }
    function addRowForStyle(style, parentName, sizeScale, itemATPs, results, rec) {
        var color = ''; // We'll add this below after going through the results
        var display = ''; // We'll add this below after going through the results
        var itemRow = jQuery('<tr>').addClass('addItemRow');
        itemRow.append(jQuery('<td>').text(style));
        // Initialize an input element for each size required
        var sizeInputs = [];
        sizeScale.forEach(function (size) {
            var input = jQuery('<input>').attr('type', 'text').attr('size', '4').addClass('itemQuantity').attr('title', size);
            sizeInputs.push(input);
        });
        results.forEach(function (result) {
            var itemName = result.getValue('itemid');
            var resultStyle = result.getText('parent') || itemName; // Non-matrix items don't have a parent
            if (resultStyle != parentName || style != parseStyleName(itemName))
                return;
            if (!color)
                color = result.getText('custitem_colour_group');
            if (!display)
                display = result.getValue('displayname');
            var itemSize = result.getText('custitem_size_list') || 'Non-Matrix';
            var onHand = result.getValue('locationquantityonhand');
            var onOrder = result.getValue('locationquantityonorder');
            var sizeIdx = sizeScale.indexOf(itemSize);
            if (!~sizeIdx)
                return;
            // See if there's already any of this item on the order
            var line = rec.findSublistLineWithValue({ sublistId: 'item', fieldId: 'item', value: result.id });
            var qty = ~line ? String(rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: line })) : '';
            sizeInputs[sizeIdx]
                .data('internalid', result.id)
                .data('atp', itemATPs[result.id].available)
                .data('onorder', onOrder)
                .data('onhand', onHand)
                .data('poPastDue', itemATPs[result.id].hasPastDuePO)
                .val(qty);
        });
        itemRow.append(jQuery('<td>').text(display));
        itemRow.append(jQuery('<td>').text(color));
        sizeInputs.forEach(function (sizeInput) {
            var sizeATP = sizeInput.data('atp') || '';
            if (!sizeATP)
                sizeInput.prop('disabled', true); // This item doesn't come in this size
            var pastDueIndicator = sizeInput.data('poPastDue') ? '<b>*</b>' : '';
            itemRow.append(jQuery('<td>').css('text-align', 'center').append(sizeInput).append(" [" + sizeATP + "]" + pastDueIndicator));
        });
        itemRow.append(jQuery('<td>').css('text-align', 'center').addClass('row_total').html('0'));
        jQuery('#item_search_results').append(itemRow);
    }
    /** Read the quantity inputs and add the selected items to the order */
    function addSelectedItemsToOrder(eventObject) {
        // Gather quantities entered
        var itemsToAdd = [];
        jQuery('.itemQuantity').each(function (qtyIdx, qtyInput) {
            if (Number(qtyInput.value))
                itemsToAdd.push({ itemId: jQuery(qtyInput).data('internalid'), quantity: qtyInput.value, atp: jQuery(qtyInput).data('atp') });
        });
        var esdString = jQuery('#item_search_esd').val();
        var expShipDate = esdString ? new Date(esdString) : null;
        // Add the items
        currentRecord.get.promise().then(function (rec) {
            itemsToAdd.forEach(function (item) {
                if (Number(item.quantity) >= 1000 && !~item.quantity.indexOf('.'))
                    item.quantity += '.00'; // Workaround for case 2834230
                var line = rec.findSublistLineWithValue({ sublistId: 'item', fieldId: 'item', value: item.itemId }); // [GOBA-9] See if this item is already on the order
                ~line ? rec.selectLine({ sublistId: 'item', line: line }) : rec.selectNewLine({ sublistId: 'item' });
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
        var itemATPs = {};
        var itemIds = [];
        itemResults.forEach(function (itemResult) {
            itemATPs[itemResult.id] = { available: '0', hasPastDuePO: false };
            itemIds.push(itemResult.id);
        });
        var expectedShipDate = String(jQuery('#item_search_esd').val());
        var locationId = currentRecord.get().getValue('location');
        var filters = [['isinactive', 'is', 'F'], 'and', ['custrecord_atpsnapshot_item', 'anyof', itemIds]];
        if (expectedShipDate) {
            filters.push('and', ['custrecord_atpsnapshot_date', 'onorbefore', expectedShipDate]);
        }
        else {
            filters.push('and', ['custrecord_atpsnapshot_date', 'on', 'today']);
        }
        if (locationId)
            filters.push('and', ['custrecord_atpsnapshot_location', 'anyof', locationId]);
        search.create({
            type: 'customrecord_atpsnapshot',
            filters: filters,
            columns: [
                search.createColumn({ name: 'custrecord_atpsnapshot_date', sort: search.Sort.ASC }),
                search.createColumn({ name: 'custrecord_atpsnapshot_available' }),
                search.createColumn({ name: 'custrecord_atpsnapshot_item' }),
                search.createColumn({ name: 'custrecord_atpsnapshot_pastduepo' })
            ]
        }).run().each(function (result) {
            var itemId = result.getValue('custrecord_atpsnapshot_item');
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
        var sizesInput = sizes.split(',');
        var sortedSizes = [
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
        var subsetIdx = -1; // A subset match is when the parent's sizes are all contained in a larger size scale
        for (var j = 0; j < sortedSizes.length; j++) {
            var matchFound = true; // A match is when the parent's sizes match a pre-defined size scale exactly.
            var subsetFound = true;
            // Make sure all of the size scale's elements are in the parent item's sizes
            for (var i = 0; i < sortedSizes[j].length; i++) {
                if (!~sizesInput.indexOf(sortedSizes[j][i])) {
                    matchFound = false;
                    break;
                }
            }
            // Make sure all of the parent item's sizes are in this sorted size scale
            for (var i = 0; i < sizesInput.length; i++) {
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
        var styleName = '';
        ['/', '-'].forEach(function (splittingCharacter) {
            if (~itemName.indexOf(splittingCharacter)) {
                var itemNameWords = itemName.split(splittingCharacter);
                if (itemNameWords.length > 2)
                    styleName = [itemNameWords[0], itemNameWords[1]].join(splittingCharacter);
            }
        });
        return styleName;
    }
    /** Ensure the quantity is a number, etc. */
    function validateQuantity(eventObject) {
        var input = Number(jQuery(this).val());
        if (isNaN(input)) {
            alert('Invalid number (must be between -9999999999 and 9999999999)');
            jQuery(this).val('');
        }
        else {
            var onHand = Number(jQuery(this).data('onhand'));
            var onOrder = Number(jQuery(this).data('onorder'));
            if (input > (onHand + onOrder))
                alert("Warning: This item has " + onHand + " on hand and " + onOrder + " on order. There may not be " + input + " available until after a new production order is placed.");
            var totalQty_1 = 0;
            jQuery(this).parent().parent().find('.itemQuantity').each(function (idx, elem) {
                totalQty_1 += Number(jQuery(elem).val());
            });
            jQuery(this).parent().parent().find('.row_total').text(totalQty_1);
        }
    }
    return exports;
});
