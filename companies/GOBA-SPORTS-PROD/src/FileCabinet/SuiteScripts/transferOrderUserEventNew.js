/**
 * transfereOrderUserEvent.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Transfer Order - User Event
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */
define(["N/log", "N/record", "N/search"], function (log, record, search) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = exports.beforeSubmit = void 0;
    function beforeSubmit(context) {
        log.debug('beforeSubmit', `${context.type} transfer order ${context.newRecord.id}`);
        if ([context.UserEventType.CREATE, context.UserEventType.EDIT].includes(context.type)) {
            replaceTrampolinesWithUnbuiltComponents(context.newRecord); // [GOBASD-20]
        }
    }
    exports.beforeSubmit = beforeSubmit;
    function afterSubmit(context) {
        log.debug('afterSubmit', `${context.type} transfer order ${context.newRecord.id}`);
        if (context.type == context.UserEventType.APPROVE) {
            // [GOBASD-20] TODO: See if we have any trampolines on here that we might need to replace.
            const itemIds = [];
            for (let line = 0; line < context.newRecord.getLineCount({ sublistId: 'item' }); line++) {
                const itemId = context.newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line });
                if (!itemIds.includes(itemId))
                    itemIds.push(itemId);
            }
            const results = search.create({
                type: 'assemblyitem',
                filters: [['internalid', 'anyof', itemIds], 'and', ['custitem_noninventory_model', 'noneof', '@NONE@'], 'and', ['class', 'anyof', '1']]
            }).run().getRange({ start: 0, end: 1 });
            if (results.length > 0) {
                log.debug('afterSubmit', `Loading TO ${context.newRecord.id} to replace trampolines`);
                const transferOrder = record.load({ type: 'transferorder', id: context.newRecord.id });
                replaceTrampolinesWithUnbuiltComponents(transferOrder);
                log.debug('afterSubmit', `Saving updated TO ${context.newRecord.id}.`);
                transferOrder.save({ ignoreMandatoryFields: true });
            }
        }
    }
    exports.afterSubmit = afterSubmit;
    /** [GOBASD-20] Break tramplines down into their component items (unbuild them). */
    function replaceTrampolinesWithUnbuiltComponents(transferOrder) {
        const subsidiary = transferOrder.getValue('subsidiary');
        const itemIds = [];
        for (let line = 0; line < transferOrder.getLineCount({ sublistId: 'item' }); line++) {
            const itemId = transferOrder.getSublistValue({ sublistId: 'item', fieldId: 'item', line });
            const committed = transferOrder.getSublistValue({ sublistId: 'item', fieldId: 'quantitycommitted', line });
            if (committed && !itemIds.includes(itemId))
                itemIds.push(itemId);
        }
        log.debug('replaceTrampolinesWithUnbuiltComponents', `TO for Subsidiary ${subsidiary} includes committed items (${itemIds.length}): ${JSON.stringify(itemIds)}.`);
        if (itemIds.length > 0)
            search.create({
                type: 'assemblyitem',
                filters: [['internalid', 'anyof', itemIds], 'and', ['custitem_noninventory_model', 'noneof', '@NONE@'], 'and', ['class', 'anyof', '1']]
            }).run().each((result) => {
                log.debug('replaceTrampolinesWithUnbuiltComponents', `Processing trampoline item ${result.id}`);
                for (let line = 0; line < transferOrder.getLineCount({ sublistId: 'item' }); line++) { // For each committed line, we'll generate an assembly build
                    const itemId = transferOrder.getSublistValue({ sublistId: 'item', fieldId: 'item', line });
                    const committed = transferOrder.getSublistValue({ sublistId: 'item', fieldId: 'quantitycommitted', line });
                    if (itemId != result.id || !committed)
                        continue;
                    const unbuild = record.create({ type: 'assemblyunbuild', isDynamic: true });
                    unbuild.setValue('subsidiary', subsidiary);
                    unbuild.setValue('location', transferOrder.getValue('location'));
                    unbuild.setValue('item', result.id);
                    unbuild.setValue('quantity', committed);
                    for (let i = 0; i < unbuild.getLineCount({ sublistId: 'component' }); i++) {
                        const newTOLine = transferOrder.getLineCount({ sublistId: 'item' });
                        const component = unbuild.getSublistValue({ sublistId: 'component', fieldId: 'item', line: i });
                        const quantity = unbuild.getSublistValue({ sublistId: 'component', fieldId: 'quantity', line: i });
                        let description = ''; // We only set the description on the first component line
                        if (i == 0)
                            description = `Unbuilt from: ${JSON.stringify({ trampolineId: result.id, quantity: committed })}`;
                        transferOrder.setSublistValue({ sublistId: 'item', fieldId: 'item', line: newTOLine, value: component });
                        transferOrder.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: newTOLine, value: quantity });
                        transferOrder.setSublistValue({ sublistId: 'item', fieldId: 'description', line: newTOLine, value: description });
                    }
                    const unbuildId = unbuild.save();
                    log.audit('replaceTrampolinesWithUnbuiltComponents', `Created unbuild ${unbuildId} for item ${result.id} on line ${line}.`);
                    transferOrder.removeLine({ sublistId: 'item', line: line-- });
                }
                return true;
            });
    }
    return exports;
});
