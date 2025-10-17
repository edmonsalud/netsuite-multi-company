/**
 * itemUserEvent.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptName Item - User Event
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */
define([], function () {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function beforeLoad(context) {
        if (context.type == context.UserEventType.VIEW) {
            context.form.addButton({ id: 'custpage_upc', label: 'Generate UPC', functionName: 'generateUPCButton' });
            context.form.clientScriptModulePath = './itemClient.js';
        }
    }
    exports.beforeLoad = beforeLoad;
    return exports;
});
