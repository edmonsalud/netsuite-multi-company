/**
 *    Copyright (c) 2023, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/render', 'N/search'],

    function (record, render, search) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            log.audit('🏴 onRequest(context.request.parameters)', context.request.parameters);

            var recordId = context.request.parameters['recordId'];
            if (!recordId) throw "<h1>No Record ID</h1>";

            var createdFrom = context.request.parameters['createdFrom'];

            var itemIDs = context.request.parameters['itemIDs'];
            var arrayitemIDs = [];
            arrayitemIDs = itemIDs.split(',');
            //log.debug('arrayitemIDs ', arrayitemIDs);

            //Create Renderer
            var objTemplateRenderer = render.create();

            //Load Adv PDF Template ( ACS | NA_AU Packing Slip PDF/HTML Template file xml export )
            objTemplateRenderer.setTemplateByScriptId('CUSTTMPL_ACS_IF_PRINT_CUSTOM'); //has to be capital letters ID!

            //Add current IF record to Renderer
            objTemplateRenderer.addRecord({
                templateName: 'record',
                record: record.load({
                    type: 'itemfulfillment',
                    id: recordId
                })
            });

            //Add SO record from which was IF created
            var recCreatedFromSORecord = record.load({
                type: 'salesorder',
                id: createdFrom
            });
            objTemplateRenderer.addRecord({
                templateName: 'salesorder',
                record: recCreatedFromSORecord
            });

            //Add Subsidiary to load logo to the PDF template
            var subsidiaryID = recCreatedFromSORecord.getValue('subsidiary');
            objTemplateRenderer.addRecord({
                templateName: 'subsidiary',
                record: record.load({
                    type: 'subsidiary',
                    id: subsidiaryID
                })
            });

            //Add SAVED SEARCH Results to template Renderer
            const SEARCH_RESULTS = [];

            // Check if there are any items in the Sublist which need to be included.
            // Otherwise skips the Saved Search
            //if ( arrayitemIDs.length > 0 && arrayitemIDs[0] != "") {
            if (arrayitemIDs[0] != '') {

                try {
                    var itemMemberSublistSearch = search.load({
                        id: 'customsearch_acs_if_custom_print_sublist'
                    });
                    var filters = itemMemberSublistSearch.filters; //reference Search.filters object to customer ID
                    var filterTransNumber = search.createFilter({ //create new filter
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: arrayitemIDs
                    });
                    filters.push(filterTransNumber); //add the filter using .push() method
                    itemMemberSublistSearch.filters.push(filterTransNumber); // Add filter to only Parts with Model ID on Item Fullfillment

                    var searchResultCount = itemMemberSublistSearch.runPaged().count;

                    log.debug("itemMemberSublistSearch", itemMemberSublistSearch);

                    log.debug("transactionSearchObj result count", searchResultCount);

                    // Define Columns for results
                    const componentSearchParentKitID = search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    });
                    const componentSearchItemName = search.createColumn({
                        name: "itemid",
                        join: "memberItem",
                        label: "Name"
                    });
                    const componentSearchItemDescription = search.createColumn({
                        name: "salesdescription",
                        join: "memberItem",
                        label: "Description"
                    });
                    const componentSearchItemQuantity = search.createColumn({
                        name: "memberquantity",
                        label: "Member Quantity"
                    });
                    const componentSearchItemUnit = search.createColumn({
                        name: "memberbaseunit",
                        label: "Member Base Unit"
                    });

                    itemMemberSublistSearch.run().each(function (result) {

                        SEARCH_RESULTS.push({
                            parentkitid: result.getValue(componentSearchParentKitID),
                            itemname: result.getValue(componentSearchItemName),
                            description: result.getValue(componentSearchItemDescription),
                            quantity: result.getValue(componentSearchItemQuantity),
                            unit: result.getText(componentSearchItemUnit),
                        });
                        return true;

                    });

                } catch (e) {
                    log.error({ title: 'search.summarize', details: e });
                    throw e;
                }
            }
            log.debug('SEARCH_RESULTS', SEARCH_RESULTS);

            const CUSTOM = {
                member: SEARCH_RESULTS.length ? SEARCH_RESULTS : [{
                    parentkitid: "114946",
                    itemname: "S113BLACK",
                    description: "S113 - Limited Edition Signature Black Large Square Trampoline",
                    quantity: "1",
                    unit: ""
                }]
            };
            log.debug('CUSTOM', CUSTOM);

            // ADD custom data, in PDF template will be available as ${component.member}
            objTemplateRenderer.addCustomDataSource({
                format: render.DataSource.JSON,
                alias: "component",
                // data must be stringified
                data: JSON.stringify(CUSTOM)
            });

            /*
                RESPONSE section
            */
            // add Header - print into Browser window
            const filename = 'ItemShip_' + recordId;
            log.debug('objTemplateRenderer', objTemplateRenderer);
            context.response.setHeader({
                name: 'Content-disposition',
                //value: `inline; filename=${filename}.pdf`
                value: 'inline; filename=' + filename + '.pdf'
            });
            log.debug('before rendering pdf');
            context.response.renderPdf({
                xmlString: objTemplateRenderer.renderAsString()
            });

            log.debug('after rendering pdf');
        }

        return {
            onRequest: onRequest
        };
    });