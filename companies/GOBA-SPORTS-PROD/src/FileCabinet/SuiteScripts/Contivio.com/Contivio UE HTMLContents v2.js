// Contivio.com Copyright © 2025
// All rights reserved. No part of this code may be reproduced, distributed, transmitted or used in any form
// or by any means, without the prior written permission from Contivio.com

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/ui/serverWidget", "N/runtime"], function (a, c) {
    function b(g) {
        if (g.type === g.UserEventType.VIEW || g.type === g.UserEventType.EDIT) {
            var f = g.form;
            try {
                var l = "https://usweb4.contivio.com/Contivio.ADT.Web.Site/30.0.0/ContivioAI";
                var k = l + "/nsresults.js?20";
                var d = l + "/nsresults.css?20";
                var e = f.getField({
                    id: "custevent_contivio_ai_view"
                });
                var i = g.newRecord;
                var m = i.getValue("custevent_contivio_ai_data");
                if (m) {
                    var n = JSON.parse(m);
                    if (n.data != null) {
                        m = JSON.stringify(n.data)
                    }
                    var j = '<div class="ai-results-view"></div><link rel="stylesheet" href="' + d + '" /><script src="' + k + '"><\/script><script>var json = ' + m + '; AICallAnalysisResults(".ai-results-view", json);<\/script>';
                    e.defaultValue = j
                }
            } catch (h) {
                log.error({
                    title: "UE HTMLContents beforeLoad err",
                    details: h
                })
            }
            f.addField({
                id: "custpage_hdn_rsm_script",
                type: a.FieldType.INLINEHTML,
                label: "Contivio Placeholder"
            }).defaultValue = '<script>jQuery(document).ready(function() {document.getElementById("custevent_contivio_ai_view_fs").closest("table").parentNode.width="100%";document.getElementById("custevent_contivio_ai_data_fs_lbl_uir_label").closest("table").parentNode.style.display = "none";})<\/script>'
        }
    }
    return {
        beforeLoad: b
    }
});