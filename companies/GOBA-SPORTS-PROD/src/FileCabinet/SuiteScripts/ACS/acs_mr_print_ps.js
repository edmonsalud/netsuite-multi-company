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
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @author vlad <wladyslaw.motyka@netsuite.com>
 * @version 2023-03-08
 * @summary Part 3/3 of SBE app - Reduce/Array version
 */
/*jshint esversion: 6, multistr: true */

const folder = 12717148;

define(['N/runtime', 'N/record', 'N/https', 'N/file', 'N/render', 'N/error'], function (runtime, record, https, file, render, error) {

    function getInputData() {
        log.audit('🏳️ MR getInputData()');
        const object = JSON.parse(runtime.getCurrentScript().getParameter({
            name: 'custscript_acs_mr_json'
        }));
        log.debug('INPUT_JSON', object);
        return object;
    }

    function getIFdata(object) {
        const objRec = record.load(object);

        // SO Number from which was IF created
        object.createdFrom = objRec.getValue('createdfrom');

        // Create Array of items in Items sublist which have Model column data specified
        // For these will be details searched later
        const itemLinesWithModel = [];
        for (let line = 0; line < objRec.getLineCount('item'); line++) {
            const currentLineModel = objRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_acs_item_model',
                line
            });
            if (currentLineModel != '') {
                const currentLineItemID = objRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line
                });
                itemLinesWithModel.push(currentLineItemID);
            }
        }
        object.itemIDs = itemLinesWithModel.join(',');
    }

    function getPDFbyRestlet(context, object) {
        log.debug('Calling Restlet');
        https.requestRestlet.promise({
            body: 'My Restlet body',

            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            deploymentId: 'customdeploy_acs_rl_print_ps',
            method: 'GET',
            scriptId: 'customscript_acs_rl_print_ps',
            urlParams: {
                id: object.id,
                recordType: object.type,
                createdFrom: object.createdFrom,
                itemIDs: object.itemIDs,
                folder,
            }
        })
            .then(function (response) {
                log.debug({ title: 'Response', details: response });

                if (response.code == 200) {
                    const fileObj = JSON.parse(response.body);
                    log.debug('link', fileObj);
                    var id = record.attach({
                        record: {
                            type: 'file',
                            id: fileObj.fileId
                        },
                        to: {
                            type: object.type,
                            id: object.id
                        }
                    });
                    record.submitFields({
                        type: object.type,
                        id: object.id,
                        values: {
                            custbody_acs_ps_pdf: fileObj.fileId
                        }
                    });
                    log.debug('🏴', '☑️ PDF attached');
                    // context.write(context.key, fileObj.fileId);
                    const fileObj2 = file.load({id: fileObj.fileId});
                    context.write(context.key, fileObj2.url);
                } else {
                    log.error('restlet', `<h1><small>HTTP CODE: ${response.code}</small><br><hr><br>${response.body}</h1>`);
                }

            })
            .catch(function onRejected(reason) {
                log.debug({
                    title: 'Invalid Get Request: ',
                    details: reason
                });
            });
    }


    function reduce(context) {
        log.debug(`🏳️ MR reduce(${context.key})`);
        try {
            const object = JSON.parse(context.values[0]);
            object.id = object.transactionId;
            object.type = 'itemfulfillment';

            getIFdata(object);
            getPDFbyRestlet(context, object);

        } catch (err) {
            log.error('🚩 reduce.error', err);
            context.write(context.key, { value: JSON.parse(context.values[0]), err: JSON.parse(JSON.stringify(err)) });
        }
    }


    function summarize(summary) {
        log.audit('🏁 MR summarize()', summary);
        try {
            //Output the SUCCESSES
            const ARRAY = [];
            let totalRecordsUpdated = 0;
            summary.output.iterator().each(function (key, value) {
                totalRecordsUpdated++;
                log.audit({
                    title: 'Reduce Success key: ' + key,
                    details: value
                });
                ARRAY.push(value);
                return true;
            });

        const OPTIONS = JSON.parse(runtime.getCurrentScript().getParameter({
            name: 'custscript_acs_object_options'
        }));
        log.debug('OPTIONS', {OPTIONS,ARRAY});

            const xmlStr = `<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n<pdfset>\n${ARRAY.map(url => `\t<pdf src="${url.replaceAll('&', '&#38;')}" />`).join('\n')} </pdfset>`;
        log.debug('xmlStr', JSON.stringify(xmlStr));
            var fileObj = render.xmlToPdf({
                xmlString: xmlStr
            });
        fileObj.name = `${OPTIONS.location}_bulk.pdf`;
        fileObj.description = new Date().toJSON();
        fileObj.folder = folder;
        fileObj.isOnline = true;
        const fileId = fileObj.save();
            log.debug('link', {fileId: fileId});

            //Output the ERRORS
            let totalRecordsErrored = 0;
            summary.reduceSummary.errors.iterator().each(function (key, err) {
                totalRecordsErrored++;
                log.error({
                    title: 'Reduce error for key: ' + key,
                    details: JSON.parse(err).message
                });

                return true;
            });

            //Output the SUMMARY
            log.audit({
                title: 'Total records updated / Errored',
                details: 'Updated: ' + totalRecordsUpdated + ' | Errored: ' + totalRecordsErrored
            });
        } catch (e) {
            const errorMsg = 'Error thrown: ' + e.name + '\n\n' + e.message;
            const errorObj = error.create({
                name: 'SUMMARIZE',
                message: errorMsg,
                notifyOff: true
            });
            log.error({
                title: "SUMMARIZE",
                details: errorMsg
            });

            throw errorObj;
        }
    }
    return {
        getInputData,
        reduce,
        summarize
    };
});