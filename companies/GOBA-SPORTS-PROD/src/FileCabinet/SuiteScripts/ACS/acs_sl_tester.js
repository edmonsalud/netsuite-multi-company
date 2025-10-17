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
 * @version 2023-08-08
 * @summary test restlet
 */

/*jshint esversion: 6, multistr: true */

define(['N/ui/serverWidget', 'N/url', 'N/https', '/SuiteScripts/ACS/cryptojs'], function (serverWidget, url, https, cryptojs) {
    function GET(scriptContext, response) {
        log.debug('🚩 GET');
        const PARAMETERS = scriptContext.request.parameters;
        log.debug('parameters', PARAMETERS);

        let form = serverWidget.createForm({
            title: 'Simple Form'
        });

        let textfield = form.addField({
            id: 'textfield',
            type: serverWidget.FieldType.TEXTAREA,
            label: 'Text'
        });
        textfield.layoutType = serverWidget.FieldLayoutType.NORMAL;
        textfield.updateBreakType({
            breakType: serverWidget.FieldBreakType.STARTCOL
        });
        textfield.defaultValue = PARAMETERS.textfield || '{}';

        if (response) {
            const objFieldStatusCode = form.addField({
                id: 'custpage_message',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Status Code'
            });

            if (response.code == 200) {
                var link = form.addField({
                    id : 'custpage_textfield',
                    type : serverWidget.FieldType.URL,
                    label : 'URL'
                });
                link.defaultValue = `https://693183.app.netsuite.com/app/crm/support/supportcase.nl?id=${response.body}`;
                link.linkText = `Click to open Case internalId: ${response.body}`;
                link.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

            } else {
                objFieldStatusCode.defaultValue = `<h3 style="padding: 5px; margin: 5px; background-color: gainsboro; color: red">Status Code: ${response.code}</h3>`;
                
                const objFieldBody = form.addField({
                    id: 'custpage_body',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Restlet Body'
                });
                objFieldBody.defaultValue = `<label style="padding: 5px; margin: 5px; background-color: gainsboro;">Restlet Body</label><br><pre style="width: 100%; white-space: pre-wrap; padding: 10px;">${response.body || '-'}`;
                objFieldBody.padding = 1;
            }
        }

        if (PARAMETERS.message) {
            const objFieldMessage = form.addField({
                id: 'custpage_message',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Suitelet Message'
            });
            objFieldMessage.defaultValue = `<label style="padding: 5px; margin: 5px; background-color: gainsboro;">Suitelet Message</label><br><pre style="width: 100%; white-space: pre-wrap; padding: 10px;">${PARAMETERS.message || '-'}`;
            objFieldMessage.padding = 1;
        }

        form.addSubmitButton({
            label: 'Submit Button'
        });

        scriptContext.response.writePage(form);
    }
    function POST(scriptContext) {
        log.debug('🚩 POST');
        const PARAMETERS = scriptContext.request.parameters;
        log.debug('parameters', PARAMETERS);
        try {
            //get suitelet URL
            const scriptId = 3236;
            const deploymentId = 1;
            const restletURL = url.resolveScript({ scriptId, deploymentId, returnExternalUrl: true });
            const baseURL = restletURL.split("?")[0];

            const tokenObj = {
                account: '693183',
                token_id: '4e31b9dc1a6b830356957aca69b1a6b1f54c1c22cd528e1cb82038782c5f8d59',
                token_secret: 'd8cde77eaea6242764d1e7945de92e0dee03dc86a3b988d2db37bba6c869e5f3',
                consumer_key: 'da75b9b461596c5b5cbc92a8f3848ca8aa825e82abbcfff7301fb3276269cb6d',
                consumer_secret: '9b59ca882e506b6d82f7eee6af7758dabb98c04a91805cae9b099f93148c1a0f',
            };

            let OAUTH_NONCE = cryptojs.lib.WordArray.random(10).toString();
            const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < 32; i++) {
                OAUTH_NONCE += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            const TIME_STAMP = Math.round(+new Date() / 1000);

            const Authorization = `OAuth oauth_signature="${encodeURIComponent((cryptojs.HmacSHA256('POST&' + encodeURIComponent(baseURL) + '&' + encodeURIComponent(`deploy=${deploymentId}&oauth_consumer_key=${tokenObj["consumer_key"]}&oauth_nonce=${OAUTH_NONCE}&oauth_signature_method=HMAC-SHA256&oauth_timestamp=${TIME_STAMP}&oauth_token=${tokenObj["token_id"]}&oauth_version=1.0&script=${scriptId}`), `${tokenObj["consumer_secret"]}&${tokenObj["token_secret"]}`)).toString(cryptojs.enc.Base64))}",oauth_version="1.0",oauth_nonce="${OAUTH_NONCE}",oauth_signature_method="HMAC-SHA256",oauth_consumer_key="${tokenObj["consumer_key"]}",oauth_token="${tokenObj["token_id"]}",oauth_timestamp="${TIME_STAMP}",realm="${tokenObj["account"]}"`;

            const request = https.post({
                url: `${baseURL}?script=${scriptId}&deploy=${deploymentId}`,
                headers: {
                    "Content-Type": "application/json",
                    Authorization
                },
                body: PARAMETERS.textfield || '-'
            });

            GET(scriptContext, request);

        } catch (error) {
            log.error('POST', error);
            scriptContext.response.write(error);
        }
    }

    return {
        onRequest: function onRequest(scriptContext) {
            try {
            if (scriptContext.request.method == 'GET') {
                GET(scriptContext);
            } else if (scriptContext.request.method == 'POST') {
                POST(scriptContext);
            } else {
                log.error('Unknown scriptContext.request.method', scriptContext.request.method);
                scriptContext.response.write('Unknown scriptContext.request.method');
            }
            } catch (error) {
              log.debug('error', error);
            }
        }
    };
});