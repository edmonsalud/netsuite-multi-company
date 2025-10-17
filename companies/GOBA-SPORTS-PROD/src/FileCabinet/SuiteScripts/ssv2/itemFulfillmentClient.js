/**
 * itemFulfillmentClient.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
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
define(["N/ui/message", "N/url", "N/currentRecord", "N/https"], function (message, url, currentRecord, https) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.markPackedUSButton = exports.markPackedCanadaButton = exports.pageInit = void 0;
    function pageInit(context) {
    }
    exports.pageInit = pageInit;
    function markPackedCanadaButton() {
        return __awaiter(this, void 0, void 0, function* () {
            const banner = message.create({
                title: 'Processing Packages for FedEx Canada Fulfillments',
                message: 'Running FedEx for Canada Item Fulfillment process, this may take 10-20 seconds',
                type: message.Type.INFORMATION
            });
            banner.show();
            const currentRec = yield currentRecord.get.promise();
            const serverTask = url.resolveScript({ scriptId: 'customscript_autopop_fedexca_fulfil_sl', deploymentId: 'customdeploy_autopop_fedexca_fulfil_sl' });
            let response;
            try {
                response = yield https.post.promise({ url: serverTask, body: { recid: currentRec.id } });
                if (response.body == 'success') {
                    window.location.reload();
                }
                else {
                    alert(`Error: ${response.body}`);
                }
            }
            catch (e) {
                alert(e.message);
            }
            banner.hide();
        });
    }
    exports.markPackedCanadaButton = markPackedCanadaButton;
    function markPackedUSButton() {
        return __awaiter(this, void 0, void 0, function* () {
            const banner = message.create({
                title: 'Processing Packages for FedEx Fulfillments',
                message: 'Running FedEx for US Item Fulfillment process, this may take 10-20 seconds',
                type: message.Type.INFORMATION
            });
            banner.show();
            const currentRec = yield currentRecord.get.promise();
            const serverTask = url.resolveScript({ scriptId: 'customscript_add_fedex_pack_us_sl', deploymentId: 'customdeploy1' });
            let response;
            try {
                response = yield https.post.promise({ url: serverTask, body: { recid: currentRec.id } });
                if (response.body == 'success') {
                    window.location.reload();
                }
                else {
                    alert(`Error: ${response.body}`);
                }
            }
            catch (e) {
                alert(e.message);
            }
            banner.hide();
        });
    }
    exports.markPackedUSButton = markPackedUSButton;
    return exports;
});
