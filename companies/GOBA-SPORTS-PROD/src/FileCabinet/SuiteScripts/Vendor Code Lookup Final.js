/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/search', 'N/log', 'N/record'], function(search, log, record) {

  // Initialize a flag to prevent multiple triggers
  let isProcessing = false;

  function fieldChanged(context) {
    log.debug('fieldChanged triggered', 'Field: ' + context.fieldId);

    // Only proceed if this is the first trigger and we are not already processing
    if (context.sublistId === 'item' && context.fieldId === 'custcol_enter_vendor_item' && !isProcessing) {
      isProcessing = true; // Set the flag to prevent re-entry
      const currentRecord = context.currentRecord;

      // Get the entered vendor code in the custom field
      var enteredVendorCode = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_enter_vendor_item' });

      log.debug('Entered Vendor Code:', enteredVendorCode);

      if (enteredVendorCode) {
        // Load the saved search "customsearch_vendor_item_list"
        const itemSearch = search.load({ id: 'customsearch_vendor_item_list' });

        // Add a filter to check for the entered vendor code in any of the vendor code fields
        itemSearch.filters.push(
          search.createFilter({
            name: 'formulanumeric',
            formula: "CASE WHEN {custitem_vend_usnz} = '" + enteredVendorCode + "' OR {custitem_vend_ca} = '" + enteredVendorCode + "' OR {custitem_vend_au} = '" + enteredVendorCode + "' OR {custitem_vend_eu} = '" + enteredVendorCode + "' OR {custitem_vend_de} = '" + enteredVendorCode + "' OR {custitem_vend_wr} = '" + enteredVendorCode + "' THEN 1 ELSE 0 END",
            operator: 'equalto',
            values: [1]
          })
        );

        log.debug('Search Filter Added', 'Running search for matching item.');

        // Run the search and get the results
        const results = itemSearch.run().getRange({ start: 0, end: 1 });

        log.debug('Search Results', results.length > 0 ? 'Match found' : 'No match found');

        if (results.length > 0) {
          // If a matching item is found, get the internal ID
          const correctItemId = results[0].getValue({ name: 'internalid' });
          
          // Log the correct item ID
          log.debug('Correct Item ID:', correctItemId);

          if (correctItemId) {
            // Check if the item is a kit
            const itemFields = search.lookupFields({ type: search.Type.ITEM, id: correctItemId, columns: ['type'] });

            const itemType = itemFields.type[0].value;
            log.debug('Item Type:', itemType);

            if (itemType === 'Kit') {
              // Start adding the kit components
              addKitComponentsToPO(currentRecord, correctItemId);
            } else {
              // If not a kit, just set the item as usual
              currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: correctItemId });
              currentRecord.commitLine({ sublistId: 'item' });
              log.debug('Single item committed (non-kit)', 'Item ID: ' + correctItemId);
            }
          } else {
            log.error('Item not found', 'No item found for Vendor Code: ' + enteredVendorCode);
          }
        } else {
          log.error('Item not found', 'No matching item for Vendor Code: ' + enteredVendorCode);
        }

        // Reset the flag after processing
        isProcessing = false;
      }
    }
  }

  // Separate function to handle adding components for kit items
function addKitComponentsToPO(currentRecord, kitItemId) {
  // Load the kit item record to retrieve its components
  const kitRecord = record.load({ type: record.Type.KIT_ITEM, id: kitItemId });

  const componentCount = kitRecord.getLineCount({ sublistId: 'member' });
  log.debug('Kit Components Found', componentCount);

  for (let i = 0; i < componentCount; i++) {
    const componentId = kitRecord.getSublistValue({ sublistId: 'member', fieldId: 'item',     line: i });
    const quantity    = kitRecord.getSublistValue({ sublistId: 'member', fieldId: 'quantity', line: i });

    log.debug('Adding Component', 'Component ID: ' + componentId + ', Quantity: ' + quantity);

    // Use selectNewLine to ensure we’re on a new line
    currentRecord.selectNewLine({ sublistId: 'item' });
    // Set item and quantity for the component
    currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item',     value: componentId, forceSyncSourcing: true });
    currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: quantity });

    // Commit the line to finalize adding this component
    currentRecord.commitLine({ sublistId: 'item' });
    log.debug('Component Committed', 'Component ID: ' + componentId);

    // Optional: Small delay after each commit
    pause(100); // Pause for 100ms
  }

  log.debug('Kit Components Added', 'All kit components added to the PO lines.');
}

// Pause function to delay execution for a given time in milliseconds
function pause(milliseconds) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + milliseconds);
}

return {
  fieldChanged: fieldChanged
};

});
