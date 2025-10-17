/**
* Copyright (c) 1998-2024 NetSuite, Inc.
* 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
* All Rights Reserved.
*
* This software is the confidential and proprietary information of NetSuite, Inc. ("Confidential Information").
* You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement
* you entered into with NetSuite.
*/
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @author vlad <wladyslaw.motyka@netsuite.com>
 * @version 2023-05-06
 * @summary call Restlet from a button in a Client script
 */
/*jshint esversion: 6, multistr: true */

define(['N/https'], function (https) {
    return {
        onRequest: function onRequest(context) {
            const parameters = context.request.parameters;
            log.audit('🏴 onRequest(context.request.parameters)', parameters);

            if (!parameters.id) throw "<h1>No Record ID</h1>";

            var myRestletResponse = https.requestRestlet.promise({
                body: 'My Restlet body',
                deploymentId: 'customdeploy_acs_rl_print_ps',
                //headers: myRestletHeaders,
                method: 'GET',
                scriptId: 'customscript_acs_rl_print_ps',
                urlParams: {
                    id: parameters.id,
                    recordType: 'itemfulfillment',
                    createdFrom: parameters.createdFrom,
                    itemIDs: parameters.itemIDs,
                    mode: parameters.mode,
                }
            })
                .then(function (response) {
                    // log.debug({ title: 'Response', details: response });

                    if (response.code == 200) {
                        // add Header - print into Browser window
                        context.response.setHeader({
                            name: 'Content-disposition',
                            value: 'inline; filename=' + 'IF_' + parameters.id + '.pdf'
                        });

                        log.debug('before rendering pdf');
                        const object = JSON.parse(response.body);
                        context.response.renderPdf({
                            xmlString: object.xmlString
                        });
                        log.debug('after rendering pdf');
                    } else {
                        log.debug('response', response);
                        context.response.write(`<h1><small>HTTP CODE: ${response.code}</small><br><hr><br>${response.body}</h1>`);
                    }

                })
                .catch(function onRejected(reason) {
                    log.debug({
                        title: 'Invalid Get Request: ',
                        details: reason
                    });
                })
        }
    }
});