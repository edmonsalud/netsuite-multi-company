/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/search'], (search) => {

    const saveRecord = (context) => {
        const title = "saveRecord() :: ";
        try {
            const currentRecord = context.currentRecord;
            let createdFromdId = currentRecord.getValue("createdfrom");
            if (!createdFromdId || currentRecord.id) {
                return true;
            }

            log.debug(title + "createdFromdId", createdFromdId);
            const itemLocationQtyMap = getItemLocationMapping(currentRecord);

            // console.log("itemLocationQtyMap:", itemLocationQtyMap);


            if (itemLocationQtyMap.size === 0) return true;


            const warningItems = getSearchData(itemLocationQtyMap);
            // console.log("warningItems:", warningItems);

            if (warningItems.length > 0) {
                let message = 'The following items do not have sufficient on-hand quantity at the selected location:\n\n';

                warningItems.forEach(item => {
                    message += `- ${item.name}: Ordered ${item.orderedQty}, On Hand ${item.onHandQty}\n`;
                });

                let confirmMessage = confirm(message + '\n\nDo you still want to proceed with saving the Sales Order?');

                if (confirmMessage) {
                    return true;
                } else {
                    return false;
                }

            }

            return true;

        } catch (e) {
            log.error("ERROR IN " + title, e.message);
        }
    };

    const getItemLocationMapping = (currentRecord) => {
        const title = "getItemLocationMapping() :: ";
        try {
            const itemLocationQtyMap = new Map();

            const itemCount = currentRecord.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < itemCount; i++) {
                const itemId = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                const locationId = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i });
                const quantity = parseFloat(currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i })) || 0;
                if (!itemId || !locationId || quantity <= 0) continue;

                const key = `${itemId}|${locationId}`;
                if (!itemLocationQtyMap.has(key)) {
                    itemLocationQtyMap.set(key, { itemId, locationId, totalQty: quantity });
                } else {
                    itemLocationQtyMap.get(key).totalQty += quantity;
                }
            }

            return itemLocationQtyMap;

        } catch (e) {
            log.error("ERROR IN " + title, e.message);
        }
    }


    const getSearchData = (itemLocationQtyMap) => {
        const title = "getSearchData() :: ";
        try {
            const filters = Array.from(itemLocationQtyMap.values()).map(({ itemId, locationId }) => [
                ['internalid', 'is', itemId], 'AND', ['inventorylocation', 'anyof', locationId]
            ]);

            const joinedFilters = filters.reduce((acc, f, idx) => {
                if (idx > 0) acc.push('OR');
                acc.push(f);
                return acc;
            }, []);

            const itemSearch = search.create({
                type: search.Type.ITEM,
                filters: joinedFilters,
                columns: [
                    'internalid',
                    'type',
                    'itemid',
                    'displayname',
                    'inventorylocation',
                    'locationquantityonhand'
                ]
            });

            const results = itemSearch.run().getRange({ start: 0, end: 1000 });

            const warningItems = [];

            for (let result of results) {
                const type = result.getValue('type');
                const itemInternalId = result.getValue('internalid');
                const itemId = result.getValue('itemid');
                const displayName = result.getValue('displayname');
                const locationId = result.getValue('inventorylocation');
                const onHandQty = parseFloat(result.getValue('locationquantityonhand')) || 0;

                if (!['InvtPart', 'Assembly'].includes(type)) continue;

                const key = `${itemInternalId}|${locationId}`;

                const { totalQty } = itemLocationQtyMap.get(key);

                if (onHandQty < totalQty) {
                    const name = `Item ${itemId} ${displayName}`;
                    warningItems.push({
                        id: itemId,
                        name,
                        locationId,
                        orderedQty: totalQty,
                        onHandQty
                    });
                }
            }

            return warningItems;

        } catch (e) {
            log.error("ERROR IN " + title, e.message);
        }
    }

    const fieldChanged = (context) => {
        try {
            const currentRecord = context.currentRecord;
            const sublistName = context.sublistId;
            const fieldId = context.fieldId;

            const subsidiaryId = currentRecord.getValue({
                fieldId: 'subsidiary'
            });


            if (sublistName === 'item' && fieldId === 'item' && subsidiaryId == '1') {

                var sublist = currentRecord.getSublist({
                    sublistId: 'item'
                });
                var supportType = sublist.getColumn({
                    fieldId: 'custcol_supporttype'
                });
                supportType.isMandatory = false;

                const span = document.getElementById('itemreq30');
                if (span) {
                    span.remove(); // Removes the span from the DOM
                }


            }

        } catch (e) {
            log.error("ERROR in fieldChanged", e.message);
        }
    };



    return {
        saveRecord,
        fieldChanged
    };
});
