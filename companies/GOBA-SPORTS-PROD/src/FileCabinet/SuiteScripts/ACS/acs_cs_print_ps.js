/**
* Copyright (c) 1998-2023 NetSuite, Inc.
* 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
* All Rights Reserved.
*
* This software is the confidential and proprietary information of NetSuite, Inc. ("Confidential Information").
* You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement
* you entered into with NetSuite.
*/
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author vlad | 2023-05-06
 * @description Part 2/3 of SME app - Helping script used by SUITELET customscript_acs_sl_send_bulk_emails
 */
/*jshint esversion: 6, multistr: true */
const OBSERVED_FIELDS = {
    custpage_f_date_from:   'getText',
    custpage_f_date_to:     'getText',
    custpage_f_status:      'getValue',
    custpage_f_template:    'getValue',
    custpage_f_page_id:     'getValue',
    custpage_f_page_size:   'getValue',
    custpage_f_groupby:     'getValue',
};

let isFiltersChanged = false;

define([], function () {
    function pageInit(scriptContext) {
        setTimeout(() => {
            const rec = scriptContext.currentRecord;
            const lineCount = rec.getLineCount({ sublistId: 'custpage_sublist' });
            const objField = { sublistId: "custpage_sublist", fieldId: "custpage_mark", line: null, value: false };
            for (let index = 0; index < lineCount; index++) {
                objField.line = index;
                objField.fieldId = 'custcol_email';
                if (rec.getSublistValue(objField) == ' ') {
                    objField.fieldId = 'custpage_mark';
                    rec.getSublistField(objField).isDisabled = true;
                }
            }
        }, 100);
        window.currentRecord007 = scriptContext.currentRecord;
        if (window.onbeforeunload) window.onbeforeunload = function () {};
    }

    function getParams(currentRecord, page_id_override) {
        const PARAMETERS = {};
        for (const key in OBSERVED_FIELDS) {
            if (Object.hasOwnProperty.call(OBSERVED_FIELDS, key)) {
                const value = currentRecord[OBSERVED_FIELDS[key]]({
                    fieldId: key
                });
                PARAMETERS[key] = value !== undefined ? value : '';
            }
        }
        if (page_id_override === null) {
            // react on button 'Applay filters'
            PARAMETERS.custpage_f_page_id = PARAMETERS.custpage_f_page_id ? parseInt(PARAMETERS.custpage_f_page_id) : 0;
        } else {
            // react on buttons Previous or Next
            PARAMETERS.custpage_f_page_id = page_id_override;
        }
        //console.log('PARAMETERS', PARAMETERS);
        return new URLSearchParams(PARAMETERS).toString();
    }

    function getSuiteletPage(suiteletScriptId, suiteletDeploymentId, page_id_override, currentRecord) {
        // document.querySelector('.uir-page-title-firstline').innerHTML += '<img src="/images/setup/loading.gif">';
        // document.getElementById('custpage_f_apply').parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.innerHTML += '<td><img src="/images/setup/loading.gif"></td>';
        // document.getElementById('secondarycustpage_f_apply').parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.innerHTML += '<td><img src="/images/setup/loading.gif"></td>';
        // document.body.style.cursor = 'wait';
        // document.body.style.pointerEvents = 'none';
        document.body.style.opacity = 0.5
        
        // without this timeout we would start geting errors in Execution Log
        // Error    INVALID_TYPE_1_USE_2    1/13/2023    10:11 am    Vlad Motyka    Invalid type NaN, use Date
        setTimeout(()=>{
        	// Navigate to selected page
            document.location = `/app/site/hosting/scriptlet.nl?script=${suiteletScriptId}&deploy=${suiteletDeploymentId}&${getParams(currentRecord || window.currentRecord007, page_id_override)}`;
        }, 100);
    }

    function fieldChanged(scriptContext) {
        // react only on OBSERVED_FIELDS fields
        if (OBSERVED_FIELDS[scriptContext.fieldId]) {
            isFiltersChanged = true;
            document.getElementById('custpage_f_apply').style.setProperty("background", 'linear-gradient(to bottom, #ffeed1 2%, #ff9800 100%)', "important");
            document.getElementById('secondarycustpage_f_apply').style.setProperty("background", 'linear-gradient(to bottom, #ffeed1 2%, #ff9800 100%)', "important");
        }
    }

    function saveRecord(scriptContext) {
        if (isFiltersChanged) {
            // this is here to react on user hitting ENTER key
            document.getElementById('custpage_f_apply').style.setProperty("background", 'linear-gradient(to bottom, #ffeed1 2%, #ff9 100%)', "important");
            document.getElementById('secondarycustpage_f_apply').style.setProperty("background", 'linear-gradient(to bottom, #ffeed1 2%, #ff9 100%)', "important");
            document.getElementById('custpage_f_apply').click();
            return false;
        }

        const rec = scriptContext.currentRecord;
        const lineCount = rec.getLineCount({ sublistId: 'custpage_sublist' });
        const objField = { sublistId: "custpage_sublist", fieldId: "custpage_mark", line: null, value: false };
        for (let index = 0; index < lineCount; index++) {
            objField.line = index;
            //rec.selectLine(objField);
            if (rec.getSublistValue(objField)) {
                return true;
            }
        }
        alert('Nothing was selected. Please select at least one line.');
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord,
        getSuiteletPage
    };
});