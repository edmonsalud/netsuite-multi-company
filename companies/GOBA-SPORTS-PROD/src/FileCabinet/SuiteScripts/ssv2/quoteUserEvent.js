/**
 * quoteUserEvent.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Quote - User Event
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
            context.form.addField({ id: 'custpage_jqueryui', label: 'jQuery UI', type: 'inlinehtml' }).defaultValue = "\n      <script src=\"https://code.jquery.com/ui/1.12.1/jquery-ui.min.js\"></script>\n      <link rel=\"stylesheet\" href=\"https://code.jquery.com/ui/1.12.1/themes/cupertino/jquery-ui.css\" />\n      <style>\n        .ui-dialog {\n          font-size: 10pt;\n          z-index: 1000 !important;\n        }\n        .ui-dialog-title { font-size: 11pt; }\n        #item_search_results th { font-weight: bold; background-color: #eee }\n        #item_search_results th, #item_search_results td {\n          border-bottom: thin solid black;\n          padding: 4px;\n        }\n      </style>\n    ";
            context.form.clientScriptModulePath = './salesOrderClient.js'; // For Item Search button
        }
    }
    exports.beforeLoad = beforeLoad;
    return exports;
});
