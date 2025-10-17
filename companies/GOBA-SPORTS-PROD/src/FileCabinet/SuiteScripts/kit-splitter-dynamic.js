/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Dynamic kit splitting - loads kit configurations from custom records
 * Runs on all Sales Order create/edit events
 * ONLY processes if kit configurations exist in custom records
 */
define(['N/record', 'N/log', 'N/search'], function(record, log, search) {
    
    const SPLIT_FROM_FIELD = 'custcol_split_from';
    const KIT_CONFIG_RECORD = 'customrecord_bolts_pack_conversion';
    
    /**
     * Quick check to see if any kit configurations exist
     * This is a lightweight check before doing full configuration load
     */
    function hasKitConfigurations() {
        try {
            const configSearch = search.create({
                type: KIT_CONFIG_RECORD,
                filters: [
                    ['custrecord_kit_package_item', 'noneof', '@NONE@']
                ],
                columns: ['internalid']
            });
            
            // Just check if at least one exists
            let hasConfig = false;
            configSearch.run().each(function(result) {
                hasConfig = true;
                return false; // Stop after finding first one
            });
            
            return hasConfig;
        } catch (e) {
            log.error('Error checking kit configurations', {
                error: e.message,
                stack: e.stack
            });
            return false;
        }
    }
    
    /**
     * Load all kit configurations from custom records
     * Returns an object with kit item IDs as keys
     */
    function loadKitConfigurations() {
        const kitConfigs = {};
        
        try {
            // First, get all unique kit package items
            const kitSearch = search.create({
                type: KIT_CONFIG_RECORD,
                filters: [
                    ['custrecord_kit_package_item', 'noneof', '@NONE@']
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_kit_package_item",
                        summary: "GROUP",
                        label: "Kit Package Item"
                    })
                ]
            });
            
            const kitIds = [];
            kitSearch.run().each(function(result) {
                const kitId = result.getValue({
                    name: "custrecord_kit_package_item",
                    summary: "GROUP"
                });
                if (kitId) {
                    kitIds.push(kitId);
                    kitConfigs[kitId] = {
                        itemId: kitId,
                        components: []
                    };
                }
                return true;
            });
            
            log.debug('Kits found', {
                count: kitIds.length,
                kitIds: kitIds
            });
            
            // If no kits found, return empty object
            if (kitIds.length === 0) {
                return kitConfigs;
            }
            
            // Now get all components for all kits in one search
            const componentSearch = search.create({
                type: KIT_CONFIG_RECORD,
                filters: [
                    ["custrecord_kit_package_item", "anyof", kitIds],
                    "AND",
                    ["custrecord_component_item", "noneof", "@NONE@"]
                ],
                columns: [
                    search.createColumn({name: "custrecord_kit_package_item", label: "Kit Package Item"}),
                    search.createColumn({name: "custrecord_component_item", label: "Component Item"}),
                    search.createColumn({name: "custrecord_quantity", label: "Quantity"})
                ]
            });
            
            componentSearch.run().each(function(result) {
                const kitId = result.getValue('custrecord_kit_package_item');
                const componentId = result.getValue('custrecord_component_item');
                const quantity = parseFloat(result.getValue('custrecord_quantity')) || 1;
                
                if (kitId && componentId) {
                    kitConfigs[kitId].components.push({
                        itemId: componentId,
                        quantity: quantity
                    });
                }
                return true;
            });
            
            // Remove kits with no valid components
            Object.keys(kitConfigs).forEach(function(kitId) {
                if (kitConfigs[kitId].components.length === 0) {
                    delete kitConfigs[kitId];
                    log.debug('Removed kit with no components', { kitId: kitId });
                }
            });
            
            // Log the configuration for debugging
            log.audit('Kit configurations loaded', {
                totalKits: Object.keys(kitConfigs).length,
                sample: Object.keys(kitConfigs).slice(0, 3).map(function(kitId) {
                    return {
                        kitId: kitId,
                        componentCount: kitConfigs[kitId].components.length
                    };
                })
            });
            
        } catch (e) {
            log.error('Error loading kit configurations', {
                error: e.message,
                stack: e.stack
            });
        }
        
        return kitConfigs;
    }
    
    /**
     * Check if the order has any potential kit items
     * Quick check to avoid unnecessary processing
     */
    function orderHasPotentialKits(salesOrder, kitIds) {
        const lineCount = salesOrder.getLineCount({ sublistId: 'item' });
        
        for (let i = 0; i < lineCount; i++) {
            const itemId = salesOrder.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });
            
            // Check if already split
            const splitFrom = salesOrder.getSublistValue({
                sublistId: 'item',
                fieldId: SPLIT_FROM_FIELD,
                line: i
            });
            
            // If this is a kit and not already split, we need to process
            if (!splitFrom && kitIds.indexOf(itemId) !== -1) {
                return true;
            }
        }
        
        return false;
    }
    
    function beforeSubmit(context) {
        // Only process on create and edit
        if (context.type !== context.UserEventType.CREATE && 
            context.type !== context.UserEventType.EDIT) {
            return;
        }
        
        try {
            // EARLY EXIT #1: Check if any kit configurations exist at all
            if (!hasKitConfigurations()) {
                log.debug('No kit configurations exist - skipping processing');
                return;
            }
            
            const salesOrder = context.newRecord;
            
            log.audit('Script triggered', {
                orderId: salesOrder.id,
                type: context.type
            });
            
            // Load all kit configurations
            const kitConfigs = loadKitConfigurations();
            
            // EARLY EXIT #2: Check if we have valid kit configurations
            if (Object.keys(kitConfigs).length === 0) {
                log.debug('No valid kit configurations found');
                return;
            }
            
            // EARLY EXIT #3: Quick check if order has any potential kits
            const kitIds = Object.keys(kitConfigs);
            if (!orderHasPotentialKits(salesOrder, kitIds)) {
                log.debug('Order has no kit items to process');
                return;
            }
            
            const lineCount = salesOrder.getLineCount({ sublistId: 'item' });
            const linesToRemove = [];
            const componentsToAdd = [];
            
            // Check each line
            for (let i = 0; i < lineCount; i++) {
                const itemId = salesOrder.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                
                // Skip if no item
                if (!itemId) continue;
                
                // Check if already split
                const splitFrom = salesOrder.getSublistValue({
                    sublistId: 'item',
                    fieldId: SPLIT_FROM_FIELD,
                    line: i
                });
                
                if (splitFrom) {
                    log.debug('Line already split', { line: i, splitFrom: splitFrom });
                    continue;
                }
                
                // Check if this is a kit
                const kitConfig = kitConfigs[itemId];
                if (!kitConfig) continue;
                
                // Get line values
                const quantity = salesOrder.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });
                
                const amount = salesOrder.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: i
                });
                
                let location = null;
                try {
                    location = salesOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        line: i
                    });
                } catch (e) {
                    // Location field might not exist
                }
                
                // Calculate pricing
                let totalComponentQty = 0;
                kitConfig.components.forEach(function(comp) {
                    totalComponentQty += comp.quantity;
                });
                
                const pricePerComponent = amount / (totalComponentQty * quantity);
                
                // Create component lines
                kitConfig.components.forEach(function(comp) {
                    componentsToAdd.push({
                        item: comp.itemId,
                        quantity: comp.quantity * quantity,
                        rate: pricePerComponent,
                        location: location,
                        [SPLIT_FROM_FIELD]: itemId
                    });
                });
                
                linesToRemove.push(i);
                
                log.audit('Kit found on line', {
                    line: i,
                    kitId: itemId,
                    componentCount: kitConfig.components.length,
                    kitQuantity: quantity
                });
            }
            
            // Process changes only if there are kits to replace
            if (linesToRemove.length > 0) {
                // Remove kit lines (reverse order to maintain indices)
                for (let i = linesToRemove.length - 1; i >= 0; i--) {
                    salesOrder.removeLine({
                        sublistId: 'item',
                        line: linesToRemove[i]
                    });
                }
                
                // Add component lines
                componentsToAdd.forEach(function(comp) {
                    const line = salesOrder.getLineCount({ sublistId: 'item' });
                    
                    salesOrder.insertLine({
                        sublistId: 'item',
                        line: line
                    });
                    
                    // Set required fields
                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: line,
                        value: comp.item
                    });
                    
                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: line,
                        value: comp.quantity
                    });
                    
                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: line,
                        value: comp.rate
                    });
                    
                    // Set optional fields
                    if (comp.location) {
                        try {
                            salesOrder.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                line: line,
                                value: comp.location
                            });
                        } catch (e) {
                            // Skip if can't set location
                        }
                    }
                    
                    // Set split from field
                    try {
                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: SPLIT_FROM_FIELD,
                            line: line,
                            value: comp[SPLIT_FROM_FIELD]
                        });
                    } catch (e) {
                        log.error('Could not set split_from field', {
                            field: SPLIT_FROM_FIELD,
                            error: e.message
                        });
                    }
                });
                
                log.audit('Kit replacement complete', {
                    kitsRemoved: linesToRemove.length,
                    componentsAdded: componentsToAdd.length
                });
            } else {
                log.debug('No kits to process on this order');
            }
            
        } catch (e) {
            log.error('Script error', {
                error: e.message,
                stack: e.stack
            });
            // Don't throw - let order save continue
        }
    }
    
    return {
        beforeSubmit: beforeSubmit
    };
});