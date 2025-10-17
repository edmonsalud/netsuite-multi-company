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
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @author vlad <wladyslaw.motyka@netsuite.com>
 * @version 2023-05-06
 * @summary tbd
 */

/*jshint esversion: 6, multistr: true */

define(['N/file'], function (file) {
    return {
        onRequest: function onRequest(context) {
            log.debug('parameters', context.request.parameters);
            try {
                context.response.writeFile({
                    file: file.load({
                        id: 'SuiteScripts/ACS/statuspage.html'
                    }),
                    isInline: true
                });
            } catch (error) {
                log.error({
                    title: error.name,
                    details: error.message
                });
                context.response.write(`<h3>${error.name}</h3><p>${error.message}</p>`);
            }
        }
    };
});