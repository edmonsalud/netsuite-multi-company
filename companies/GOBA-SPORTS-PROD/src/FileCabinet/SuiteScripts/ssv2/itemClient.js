/**
 * itemClient.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptType ClientScript
 * @NApiVersion 2.x
 */
define(["N/currentRecord", "N/search", "N/record"], function (currentRecord, search, record) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function pageInit(context) {
    }
    exports.pageInit = pageInit;
    function generateUPCButton() {
        currentRecord.get.promise().then(function (rec) {
            var lastBarcode = '';
            var barcodeNum = 0;
            var barcode = '';
            var oddSum = 0;
            var evenSum = 0;
            var check = 0;
            var i = 0;
            search.create({
                type: 'customrecord_upc',
                columns: [search.createColumn({ name: 'internalid', sort: search.Sort.DESC }), search.createColumn({ name: 'name' })]
            }).run().each(function (result) {
                lastBarcode = (result.getValue({ name: 'name' }));
                lastBarcode = lastBarcode.substr(0, 11);
                return false;
            });
            barcodeNum = Number(lastBarcode);
            barcodeNum = barcodeNum + 1;
            barcode = String(barcodeNum);
            for (i = 0; i < barcode.length; i++) {
                if (i % 2 === 0) {
                    oddSum += Number(barcode[i]);
                }
                else {
                    evenSum += Number(barcode[i]);
                }
            }
            oddSum = oddSum * 3;
            var numToCheck = oddSum + evenSum;
            var nearestTen = Math.ceil(numToCheck / 10) * 10;
            check = nearestTen - numToCheck;
            debugger;
            barcode = barcode + check;
            var UPCRecord = record.create({ type: 'customrecord_upc' });
            UPCRecord.setValue({ fieldId: 'name', value: barcode });
            var UPCId = UPCRecord.save();
            var itemRecord = record.load({ type: 'inventoryitem', id: rec.id });
            itemRecord.setValue({ fieldId: 'upccode', value: barcode });
            itemRecord.setValue({ fieldId: 'custitem_upc', value: UPCId });
            itemRecord.save();
            window.location.reload();
        });
    }
    exports.generateUPCButton = generateUPCButton;
    return exports;
});
