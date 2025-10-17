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
 * @summary Part 1/3 of SBE app - Reduce/Array version - Creates Custom page with possibility to select invoices and send them to [recepient + CC]
 */
/*jshint esversion: 6, multistr: true */

const SETTINGS = {
    PAGE_TITLE: '🖨️ Print Packing Slips',
    STATUS_PAGE_TITLE: 'Print Packing Slips',

    // Record type of Transaction on which we should check checkbox ... "EMAIL SENT?"
    recordType: 'invoice',

    // link to view Record on Suitelet line "View"
    view_link: '/app/accounting/transactions/itemship.nl?id=',

    // if you put column 
    default_pagesize: 100,

    // AS DEFAULT Email Template script will select template name which starts with override value
    templateId: 'CUSTEMAILTMPL_ACS_PRINT_PS', // custemailtmpl_acs_print_ps   // CUSTTMPL_ACS_PRINT_PS
    saved_search: 'customsearch_acs_print_ps',
    clientScriptModulePath: './acs_cs_print_ps.js',
};
// internal variable - do not change (used for cases when TRANDATE is put on SavedSearch) 
let trandate = null;
// internal variable - do not change (used for filename of bulk pdf file) 
let LOCATION = null;

define(['N/ui/serverWidget', 'N/search', 'N/format', 'N/redirect', 'N/runtime', 'N/task', 'N/url', 'N/file'], function (serverWidget, search, format, redirect, runtime, task, url, file) {
    function GET(context) {
        log.debug('🏴 GET');

        SETTINGS.current_user = runtime.getCurrentUser();
        log.debug('🏴 RUNTIME', SETTINGS.current_user);

        const PARAMETERS = context.request.parameters;
        log.debug('parameters', PARAMETERS);

        const form = createForm();
        buildForm(form, PARAMETERS);

        // ADD sublist that will show results
        const sublist = createSublist(form);

        /**
         * Load Saved Search
         * - add filters
         * - get pageSearch
         * - get result count
         */

        //creating a land object
        let mySearch = new Search(PARAMETERS)
            .filterByDate()
            .filterByStatus()
            .filterByLocation();
      
            // .filterBySubsidiary();
        log.debug('Filters:', mySearch.searchObj.filters);

        const retrieveSearch = getPagedSearch(mySearch.searchObj, PARAMETERS.custpage_f_page_size || SETTINGS.default_pagesize);
        log.debug('RetrieveSearch', retrieveSearch);

        buildFilterTransationDate(form, PARAMETERS);

        if (retrieveSearch.count) {
            const pageId = buildPaginatorFromSearchResults(form, PARAMETERS, retrieveSearch);
            const search_results = fetchSearchResults(retrieveSearch, pageId);

            const COLUMN_SETUP = buildSublist(form, sublist, retrieveSearch);

            populateSublist(form, PARAMETERS, sublist, search_results, COLUMN_SETUP);

        } else {
            buildFilterGroupBy(form, PARAMETERS, {});
            buildSublist(form, sublist, retrieveSearch);
            log.debug('warning', 'no data from SEARCH');
        }
        addReportLink(form, PARAMETERS.custpage_f_groupby);

        context.response.writePage(form);
    }

    // Sending of email and attachment
    function POST(context) {
        log.debug('🚩 POST');
        const REQUEST = context.request;
        const lineCount = REQUEST.getLineCount({
            group: 'custpage_sublist'
        });
        const ARRAY_OF_TRANSACTIONS = [];
        for (let line = 0; line < lineCount; line++) {
            if (REQUEST.getSublistValue({
                group: 'custpage_sublist',
                name: 'custpage_mark',
                line
            }) == 'T') {
                const obj = {
                    transactionId: Number(REQUEST.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custcol_internalid',
                        line
                    })),
                    entityId: Number(REQUEST.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custcol_entityid',
                        line
                    })),
                    email: REQUEST.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custcol_email',
                        line
                    })
                };
                const cc = REQUEST.getSublistValue({
                    group: 'custpage_sublist',
                    name: 'custcol_cc_emails',
                    line
                });
                if (cc.trim()) {
                    obj.cc = cc.split(/[;,]/).map(email => email.trim());
                }
                ARRAY_OF_TRANSACTIONS.push(obj);
            }
        }
        // MAX 1.000.000 characters
        log.debug('ARRAY_OF_TRANSACTIONS', ARRAY_OF_TRANSACTIONS);

        SETTINGS.authorId = runtime.getCurrentUser().id;
        createMapReduceTask(ARRAY_OF_TRANSACTIONS, REQUEST.parameters);
    }

    function createMapReduceTask(ARRAY_OF_TRANSACTIONS, PARAMETERS) {
        const object_status_page = {
            task_title: SETTINGS.STATUS_PAGE_TITLE,
            entryformquerystring: PARAMETERS.entryformquerystring
        };
        const objMrTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: 'customscript_acs_mr_print_ps',
            deploymentId: 'customdeploy_acs_mr_print_ps',
            params: {
                custscript_acs_mr_json: ARRAY_OF_TRANSACTIONS,
                custscript_acs_object_options: {
                    templateId: SETTINGS.templateId,
                    authorId: SETTINGS.authorId,
                    recordType: SETTINGS.recordType,
                    location: PARAMETERS.custpage_f_groupby
                }
            }
        });

        try {
            objMrTask.submit();
            object_status_page.task_id = objMrTask.id;
            object_status_page.timestamp = Date.now();
        } catch (err) {
            if (err.name == "MAP_REDUCE_ALREADY_RUNNING") {
                log.error('MAP_REDUCE_ALREADY_RUNNING', err.message);
                object_status_page.error = err.message;
            } else {
                log.error('objMrTask.submit()', err);
                object_status_page.error = err;
            }
        }

        object_status_page.url_of_task_handler = url.resolveScript({
            scriptId: 'customscript_acs_task_handler',
            deploymentId: 'customdeploy_acs_task_handler'
        });

        log.debug({
            title: 'object_status_page',
            details: object_status_page
        });

        // Redirect to Status Page
        redirect.toSuitelet({
            scriptId: 'customscript_acs_sl_status_page',
            deploymentId: 'customdeploy_acs_sl_status_page',
            parameters: object_status_page
        });
    }

    function createForm() {
        return serverWidget.createForm({
            title: SETTINGS.PAGE_TITLE,
            hideNavBar: false
        });
    }

    function buildForm(form, PARAMETERS) {
        log.debug('info', 'buildForm()');
        // Attach Client Script to react on USER changes to the FILTERS
        form.clientScriptModulePath = SETTINGS.clientScriptModulePath;

        // ADD button to SEND emails
        form.addSubmitButton({
            id: 'custpage_search_escalate',
            label: 'Submit'
        });

        form.addButton({
            id: "custpage_f_apply",
            label: "Apply filters",
            functionName: `getSuiteletPage(${PARAMETERS.script},${PARAMETERS.deploy},null)`
        });
        form.addResetButton({
            label: 'Reset filters'
        });

        // ADD sections
        form.addFieldGroup({
            id: 'custpage_f_fldgrp',
            label: 'Filters'
        });
        form.addFieldGroup({
            id: 'custpage_f_fldgrp_paginator',
            label: 'Filters - paginator'
        });

        // ADD sections
        const fieldgroup = form.addFieldGroup({
            id: 'custpage_fg_bulk',
            label: 'Additional information'
        });
        fieldgroup.isBorderHidden = false;
    }


    function addReportLink(form, location) {
        let fileObj;
        try {
            fileObj = file.load({ id: `PackingSlipPdfs/${location}_bulk.pdf` });

        } catch (error) {
            log.debug('bulk file not found', location);
        }

        const field = form.addField({
            id: 'custpage_bulk_url',
            type: serverWidget.FieldType.URL,
            label: 'Bulk PDF file',
            container: 'custpage_fg_bulk'
        })
        field.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        field.setHelpText({ help: "This field shows how old the file is in minutes." });

        if (fileObj) {
            field.linkText = `${fileObj.description} - ${(new Date() - new Date(fileObj.description)) / 60000 | 0} minutes old`;
            field.defaultValue = fileObj.url;
            log.debug('pdf', fileObj);
        } else {
            field.linkText = 'nothing yet';
            field.defaultValue = '';
        }
    }

    // --------------------- FILTER FIELDS ---------------------
    function buildFilterTransationDate(form, parameters) {
        log.debug('info', 'buildFilterFields()');
        if (!trandate) {
            // ADD Date From
            const objField_filter_date_from = form.addField({
                id: 'custpage_f_date_from',
                type: serverWidget.FieldType.DATE,
                label: 'Start Date',
                container: 'custpage_f_fldgrp'
            });
            objField_filter_date_from.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });
            if (parameters.custpage_f_date_from) {
                objField_filter_date_from.defaultValue = format.parse({
                    value: parameters.custpage_f_date_from,
                    type: format.Type.DATE
                });
            } else {
                objField_filter_date_from.defaultValue = new Date();
            }

            // ADD Date To
            const objField_filter_date_to = form.addField({
                id: 'custpage_f_date_to',
                type: serverWidget.FieldType.DATE,
                label: 'End Date',
                container: 'custpage_f_fldgrp'
            });
            objField_filter_date_to.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.MIDROW });
            if (parameters.custpage_f_date_to) {
                objField_filter_date_to.defaultValue = format.parse({
                    value: parameters.custpage_f_date_to,
                    type: format.Type.DATE
                });
            } else {
                objField_filter_date_to.defaultValue = new Date();
            }
        } else {
            const objField_filter_no_date = form.addField({
                id: 'custpage_no_date_filters',
                type: serverWidget.FieldType.TEXT,
                label: 'Date filter',
                container: 'custpage_f_fldgrp'
            });
            const obj = JSON.parse(JSON.stringify(trandate));
            if (obj.values.length > 1) {
                objField_filter_no_date.defaultValue = `${obj.operator} (${obj.values[0]} - ${obj.values[1]})`;
            } else {
                objField_filter_no_date.defaultValue = `${obj.operator} ${obj.values[0]}`;
            }
            objField_filter_no_date.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
            objField_filter_no_date.setHelpText({
                help: `Dynamic DATE filters are disabled.
                There is already DATE filter on SavedSearch.
                To restore the possibility to dynamically change DATEs,
                please remove 'Date' filter from SavedSearch ID:
                '${SETTINGS.saved_search}'.`
            });
            objField_filter_no_date.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });
        }
    }

    function buildFilterGroupBy(form, parameters, GROUP) {
        // ADD Status Filter
        const objField_filter_customer = form.addField({
            id: 'custpage_f_groupby',
            type: serverWidget.FieldType.SELECT,
            label: 'Location',
            source: 'location',
            container: 'custpage_f_fldgrp'
        });
        objField_filter_customer.isMandatory = true;

        /*
        objField_filter_customer.addSelectOption({
            value: '-all-',
            text: '- All -',
            isSelected: parameters.custpage_f_groupby == '-all-' ? true : false
        });
        for (const key in GROUP) {
            if (Object.hasOwnProperty.call(GROUP, key)) {
                objField_filter_customer.addSelectOption({
                    value: key,
                    text: GROUP[key],
                    isSelected: parameters.custpage_f_groupby == key ? true : false
                });
            }
        }
        */
        objField_filter_customer.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });
        if (parameters.custpage_f_groupby) {
            objField_filter_customer.defaultValue = parameters.custpage_f_groupby;
        }
    }

    function buildPaginatorFromSearchResults(form, parameters, retrieveSearch) {
        log.debug('info', 'buildPaginatorFromSearchResults()');
        const pageCount = retrieveSearch.pageRanges.length;
        const default_pagesize = parameters.custpage_f_page_size || SETTINGS.default_pagesize;

        // Get parameters
        let pageId = parseInt(parameters.custpage_f_page_id) || 0;

        // Set pageId to correct value if out of index
        if (!pageId || pageId == '' || pageId < 0)
            pageId = 0;
        else if (pageId >= pageCount)
            pageId = pageCount - 1;

        // Add buttons to simulate Next & Previous
        const btn_previous = form.addButton({
            id: 'custpage_previous',
            label: 'Previous',
            functionName: `getSuiteletPage(${parameters.script},${parameters.deploy},${pageId - 1})`
        });
        btn_previous.isDisabled = pageId != 0 ? false : true;
        const btn_next = form.addButton({
            id: 'custpage_next',
            label: 'Next',
            functionName: `getSuiteletPage(${parameters.script},${parameters.deploy},${pageId + 1})`
        });
        btn_next.isDisabled = pageId != pageCount - 1 ? false : true;


        if (retrieveSearch.count > default_pagesize) {
            // Add drop-down and options to navigate to specific page =================================
            const selectOptions = form.addField({
                container: 'custpage_f_fldgrp_paginator',
                id: 'custpage_f_page_id',
                label: 'Page Index',
                type: serverWidget.FieldType.SELECT
            });
            selectOptions.updateLayoutType({
                layoutType: serverWidget.FieldLayoutType.STARTROW
            });

            for (let index = 0; index < pageCount; index++) {
                if (index == pageId) {
                    selectOptions.addSelectOption({
                        value: index,
                        text: retrieveSearch.pageRanges[index].compoundLabel,
                        isSelected: true
                    });
                } else {
                    selectOptions.addSelectOption({
                        value: index,
                        text: retrieveSearch.pageRanges[index].compoundLabel,
                    });
                }
            }
        }

        // Add PAGE_SIZE ==========================================================================
        const selectPS = form.addField({
            container: 'custpage_f_fldgrp_paginator',
            id: 'custpage_f_page_size',
            label: 'Page Size',
            type: serverWidget.FieldType.SELECT
        });
        selectPS.updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.MIDROW
        });

        // const default_pagesize = parameters.custpage_f_page_size || SETTINGS.default_pagesize;

        const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500];
        for (let index = 0; index < PAGE_SIZE_OPTIONS.length; index++) {
            const size = PAGE_SIZE_OPTIONS[index];
            selectPS.addSelectOption({
                value: size,
                text: size,
                isSelected: default_pagesize == size ? true : false
            });
        }

        // ADD Total ==============================================================================
        const objFieldTotal = form.addField({
            container: 'custpage_f_fldgrp_paginator',
            id: 'custpage_total',
            label: 'Total',
            type: 'TEXT'
        });
        objFieldTotal.defaultValue = retrieveSearch.count;
        objFieldTotal.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        objFieldTotal.updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.ENDROW
        });





        if (retrieveSearch.count > default_pagesize) {
            const field_message = form.addField({
                container: 'custpage_f_fldgrp_paginator',
                id: 'custpage_bulk_message',
                label: 'Bulk PDF file',
                type: serverWidget.FieldType.INLINEHTML,
            })
            field_message.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
            field_message.defaultValue = `<h1>There are additional <b style="color: red">${retrieveSearch.count - default_pagesize}</b> results which will not be processed on SUBMIT.</h1>`;
        }



        return pageId;
    }

    function createSublist(form) {
        return form.addSublist({
            id: 'custpage_sublist',
            type: serverWidget.SublistType.LIST,
            label: 'Transactions'
        });
    }

    function buildSublist(form, sublist, retrieveSearch) {
        log.debug('info', 'buildSublist()');
        sublist.addMarkAllButtons();
        /*
            ADD 3 fields that are not included in the Saved Search Results
        */
        sublist.addField({
            id: 'custpage_mark',
            label: 'Mark',
            type: serverWidget.FieldType.CHECKBOX,
        });
        form.updateDefaultValues({
            custpage_mark: 'F'
        });

        const IDfield = sublist.addField({
            id: 'custcol_internalid',
            label: 'internalid',
            type: serverWidget.FieldType.INTEGER,
        });
        IDfield.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        sublist.addField({
            id: 'custcol_link',
            label: 'View',
            type: serverWidget.FieldType.URL,
        }).linkText = 'View';


        // Create COLUMNS based on first result
        const objCOLUMNS = JSON.parse(JSON.stringify(retrieveSearch.searchDefinition.columns));

        // log.debug('objCOLUMNS', objCOLUMNS);

        const DEFAULT_VALUES = {
            checkbox: 'F',
            currency: 0,
            date: '10/3/2002',
            datetimetz: ' ',
            float: 0,
            email: '_@do.not.use.email.type.in.saved.search._.use_formulatext.instead',
            text: ' ',
            url: '',
            inlinehtml: ' ',
            integer: 0,
            clobtext: ' ',
            percent: 0,
            select: ' ',
            phone: ' ',
            file: 0,
        };
        const COLUMN_SETUP = [];
        for (let index = 0; index < objCOLUMNS.length; index++) {
            const objColumn = objCOLUMNS[index];
            let id = '';
            let hide = false, disabled = false;
            switch (objColumn.label) {
                case 'closed':
                    disabled = true;
                    id = `custcol_${index}`;
                    break;
                case 'entityid':
                    id = 'custcol_entityid';
                    hide = true;
                    break;
                case 'email':
                    id = 'custcol_email';
                    break;
                case 'pdfpreview':
                    id = 'custcol_pdfpreview';
                    objColumn.type = 'url';
                    break;
                case 'cc_emails':
                    id = 'custcol_cc_emails';
                    break;
                case 'location':
                    id = 'custcol_loc';
                    hide = true;
                    break;
                default:
                    id = `custcol_${index}`;
                    break;
            }
            if (objColumn.type == 'clobtext') {
                objColumn.type = 'text';
            }
            objColumn.id = id;
            const objField = sublist.addField({
                id,
                label: objColumn.label,
                type: objColumn.type.toUpperCase()
            });
            if (hide) {
                objField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
            if (disabled) {
                objField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
            }
            //log.debug('objColumn', objColumn)
            //log.debug('objField', objField)
            if (objColumn.label == 'pdfpreview') {
                objField.linkText = 'View';
            }
            COLUMN_SETUP.push({ id, default: DEFAULT_VALUES[objColumn.type] });
        }
        return COLUMN_SETUP;
    }

    function populateSublist(form, parameters, sublist, search_results, COLUMN_SETUP) {
        log.debug('info', 'populateSublist()');

        const GROUP = {};
        let counter = 0;
        const GROUP_BY = {
            key: 'location',
            value: 'Location'
        };

        const columns = search_results.pagedData.searchDefinition.columns;
        //const columns = JSON.parse(JSON.stringify(search_results.pagedData.searchDefinition.columns));
        //log.debug('columns', columns);

        const values = {
            key: '',
            value: 0
        };
        //CEIL({today}-{trandate})
        // Set data returned to columns
        search_results.data.forEach(function (result, line) {
            // SET hidden field INTERNALID for MR script processing
            sublist.setSublistValue({
                id: 'custcol_internalid',
                line,
                value: result.id
            });
            // SET View link
            sublist.setSublistValue({
                id: 'custcol_link',
                line,
                value: `${SETTINGS.view_link}${result.id}`
            });

            for (let index = 0; index < columns.length; index++) {
                let value = result.getValue(columns[index]) || COLUMN_SETUP[index].default;
                if (COLUMN_SETUP[index].default == 'F') {
                    value = value === true ? 'T' : 'F';
                }
                //log.debug('value22', value)
                if (value) sublist.setSublistValue({
                    id: COLUMN_SETUP[index].id,
                    line,
                    value
                });
                if (columns[index].label == GROUP_BY.key) values.key = value;
                if (columns[index].label == GROUP_BY.value) values.value = value;


            }
            if (!GROUP[values.key]) {
                counter++;
                GROUP[values.key] = values.value;
            }
        });
        if (!counter) {
            log.debug('warning', 'No GROUP found. Please check SavedSearch.');
        }
        log.debug('GROUP', GROUP);
        buildFilterGroupBy(form, parameters, GROUP);
    }

    // --------------------- SEARCH ---------------------
    class Search {
        constructor(parameters) {
            this.searchObj = search.load({
                id: SETTINGS.saved_search
            });
            this.parameters = parameters;
            log.debug('constructor', this)
        }

        filterByDate() {
            log.debug('this', this)
            trandate = this.searchObj.filters.find(f => f.name == 'trandate');
            //log.debug('array_filters', array_filters);

            if (!trandate) {
                if (this.parameters.custpage_f_date_from && this.parameters.custpage_f_date_to) {
                    this.searchObj.filters.push(search.createFilter({
                        name: 'trandate',
                        operator: search.Operator.WITHIN,
                        values: [this.parameters.custpage_f_date_from, this.parameters.custpage_f_date_to]
                    }));
                } else {
                    const ttoday = format.format({
                        value: new Date(),
                        type: format.Type.DATE
                    })

                    this.searchObj.filters.push(search.createFilter({
                        name: 'trandate',
                        operator: search.Operator.WITHIN,
                        //values: 'lastfiscalhalf' // thisfiscalyear
                        values: [ttoday, ttoday]
                    }));
                }
            }
            return this;
        }
        filterByStatus() {
            if (this.parameters.custpage_f_status && this.parameters.custpage_f_status != '-all-') {
                this.searchObj.filters.push(search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: this.parameters.custpage_f_status
                }));
            }
            return this;
        }
        filterByLocation() {
            if (this.parameters.custpage_f_groupby && this.parameters.custpage_f_groupby != '-all-') {
                this.searchObj.filters.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: this.parameters.custpage_f_groupby
                }));
            }
            return this;
        }
        filterBySubsidiary() {
            if (SETTINGS.current_user.role != 3) {
                this.searchObj.filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: SETTINGS.current_user.subsidiary
                }));
            }
            return this;
        }
    }

    function getPagedSearch(searchObj, PAGE_SIZE) {
        return searchObj.runPaged({
            pageSize: PAGE_SIZE
        });
    }

    // Get subset of data to be shown on page
    function fetchSearchResults(retrieveSearch, pageId) {
        return retrieveSearch.fetch({
            index: pageId
        });
    }

    return {
        onRequest: function onRequest(context) {
            if (context.request.method == 'GET') {
                GET(context);
            } else if (context.request.method == 'POST') {
                POST(context);
            } else {
                log.error('Unknown context.request.method', context.request.method);
            }
        }
    };
});