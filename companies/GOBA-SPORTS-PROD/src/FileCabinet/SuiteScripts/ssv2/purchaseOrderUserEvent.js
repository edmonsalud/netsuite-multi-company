/**
 * purchaseOrderUserEvent.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Purchase Order - User Event
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */
define(["N/log"], function (log) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function beforeLoad(context) {
        log.debug('Before Load', context.type);
        if (~[context.UserEventType.CREATE, context.UserEventType.EDIT].indexOf(context.type)) {
            // Add Item Search button
            var itemSublist = context.form.getSublist({ id: 'item' });
            itemSublist.addButton({ id: 'custpage_itemsearch', label: 'Item Search', functionName: 'itemSearchButton' });
            context.form.addField({ id: 'custpage_jqueryui', label: 'jQuery UI', type: 'inlinehtml' });
            context.form.clientScriptModulePath = './salesOrderClient.js'; // For Item Search button
        }
    }
    exports.beforeLoad = beforeLoad;
    return exports;
});
