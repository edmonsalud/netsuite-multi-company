/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @Description Production-ready Deferred Revenue Suitelet with Journal Entry Integration
 * @Version 3.0 - Complete with all fixes and optimizations
 */
define(['N/search', 'N/ui/serverWidget', 'N/format', 'N/log', 'N/url', 'N/runtime', 'N/file'],
    (search, serverWidget, format, log, url, runtime, file) => {

    // ===============================
    // CONFIGURATION CONSTANTS
    // ===============================
    const GOVERNANCE_THRESHOLD = 100;  // Minimum governance units before warning
    const VARIANCE_THRESHOLD = 0.01;   // Minimum variance amount to display
    const PAGE_SIZE = 1000;           // Maximum page size for searches
    const DEBUG_LOG_INTERVAL = 100;   // Log every N records for monitoring

    // Default values if script parameters not set
    const DEFAULTS = {
        SAVED_SEARCH_ID: '338219',
        DEBUG_FOLDER_ID: 230657,  // Updated to NDC Script logs folder
        ACCOUNT_25010: '25010',
        ACCOUNT_25020: '25020'
    };

    // Transaction type constants for consistent matching
    const TRANSACTION_TYPES = {
        SALES_ORDER: ['Sales Order', 'SalesOrd', 'salesorder', 'Sales Ord'],
        INVOICE: ['Invoice', 'CustInvc', 'invoice', 'Cust. Invoice', 'Customer Invoice'],
        CREDIT_MEMO: ['Credit Memo', 'CustCred', 'creditmemo', 'Customer Credit Memo'],
        JOURNAL: ['Journal', 'Journal Entry', 'journalentry']
    };

    /**
     * Safe parseFloat that handles null, undefined, NaN
     * @param {*} value - Value to parse
     * @returns {number} Parsed number or 0
     */
    const safeParseFloat = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    };

    /**
     * Check governance and log warning if low
     * @param {string} operation - Current operation name
     * @returns {number} Remaining governance units
     */
    const checkGovernance = (operation) => {
        const scriptObj = runtime.getCurrentScript();
        const remaining = scriptObj.getRemainingUsage();

        if (remaining < GOVERNANCE_THRESHOLD) {
            log.error('Low Governance Warning', {
                operation: operation,
                remainingUnits: remaining,
                threshold: GOVERNANCE_THRESHOLD
            });
        }

        return remaining;
    };

    /**
     * Validate date format
     * @param {string} dateString - Date to validate
     * @returns {boolean} True if valid date
     */
    const isValidDate = (dateString) => {
        if (!dateString) return false;
        try {
            const testDate = format.parse({
                value: dateString,
                type: format.Type.DATE
            });
            return !!testDate;
        } catch (e) {
            return false;
        }
    };

    /**
     * Creates a debug log file
     */
    const createDebugFile = (fileName, content, folderId) => {
        try {
            const debugFile = file.create({
                name: fileName,
                fileType: file.Type.PLAINTEXT,
                contents: content,
                folder: folderId || DEFAULTS.DEBUG_FOLDER_ID
            });
            const fileId = debugFile.save();
            log.audit('Debug File Created', {
                fileName: fileName,
                fileId: fileId,
                folderId: folderId
            });
            return fileId;
        } catch (e) {
            log.error('Failed to Create Debug File', {
                error: e.message,
                fileName: fileName
            });
            return null;
        }
    };

    /**
     * Get script parameters with fallback defaults
     * @returns {Object} Configuration parameters
     */
    const getScriptParameters = () => {
        const scriptObj = runtime.getCurrentScript();
        return {
            savedSearchId: scriptObj.getParameter('custscript_def_rev_saved_search') || DEFAULTS.SAVED_SEARCH_ID,
            debugFolderId: scriptObj.getParameter('custscript_def_rev_debug_folder') || DEFAULTS.DEBUG_FOLDER_ID,
            account25010: scriptObj.getParameter('custscript_def_rev_account_25010') || DEFAULTS.ACCOUNT_25010,
            account25020: scriptObj.getParameter('custscript_def_rev_account_25020') || DEFAULTS.ACCOUNT_25020
        };
    };

    /**
     * Optimized Journal Entry search with governance management
     * @param {string} asOfDate - The as of date for filtering
     * @param {Object} config - Configuration parameters
     * @returns {Object} Map of event IDs to JE amounts
     */
    const getJournalEntryAmounts = (asOfDate, config) => {
        const jeAmountsByEvent = {};
        const startTime = Date.now();
        const debugLog = {
            timestamp: new Date().toISOString(),
            asOfDate: asOfDate,
            config: config,
            filters: [],
            searchResults: [],
            errors: [],
            summary: {}
        };

        try {
            // Validate date
            if (!isValidDate(asOfDate)) {
                const error = { message: 'Invalid Date for JE Search', asOfDate: asOfDate };
                log.error('Invalid Date for JE Search', error);
                debugLog.errors.push(error);
                return jeAmountsByEvent;
            }

            checkGovernance('JE Search Start');

            log.audit('Starting Journal Entry Search', {
                asOfDate: asOfDate,
                accounts: [config.account25010, config.account25020]
            });

            // DIAGNOSTIC: First, let's check if ANY Journal Entries exist at all
            let diagnosticSearch1, diagnosticSearch2, diagnosticSearch3, diagnosticSearch3b;

            try {
                // Test 1: Any Journal Entries?
                diagnosticSearch1 = search.create({
                    type: search.Type.JOURNAL_ENTRY,
                    filters: [
                        ["type", "anyof", "Journal"],
                        "AND",
                        ["trandate", "onorbefore", asOfDate]
                    ],
                    columns: [search.createColumn({ name: "internalid", summary: "COUNT" })]
                });
                const test1Count = diagnosticSearch1.runPaged().count;
                debugLog.diagnostics = { test1_anyJEs: test1Count };
                log.audit('Diagnostic Test 1', { anyJournalEntries: test1Count });

                // Test 2: Journal Entries with posting = T and mainline = F?
                diagnosticSearch2 = search.create({
                    type: search.Type.JOURNAL_ENTRY,
                    filters: [
                        ["type", "anyof", "Journal"],
                        "AND",
                        ["trandate", "onorbefore", asOfDate],
                        "AND",
                        ["posting", "is", "T"],
                        "AND",
                        ["mainline", "is", "F"]
                    ],
                    columns: [search.createColumn({ name: "internalid", summary: "COUNT" })]
                });
                const test2Count = diagnosticSearch2.runPaged().count;
                debugLog.diagnostics.test2_postingLines = test2Count;
                log.audit('Diagnostic Test 2', { postingLines: test2Count });

                // Test 3a: Try custcol_cseg_hmp_event (line-level field)
                try {
                    diagnosticSearch3 = search.create({
                        type: search.Type.JOURNAL_ENTRY,
                        filters: [
                            ["type", "anyof", "Journal"],
                            "AND",
                            ["trandate", "onorbefore", asOfDate],
                            "AND",
                            ["posting", "is", "T"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["custcol_cseg_hmp_event", "isnotempty", ""]
                        ],
                        columns: [search.createColumn({ name: "internalid", summary: "COUNT" })]
                    });
                    const test3Count = diagnosticSearch3.runPaged().count;
                    debugLog.diagnostics.test3a_custcol_field = test3Count;
                    log.audit('Diagnostic Test 3a', { custcol_cseg_hmp_event: test3Count });
                } catch (test3aError) {
                    debugLog.diagnostics.test3a_error = test3aError.toString();
                    log.error('Test 3a Failed', test3aError.toString());
                }

                // Test 3b: Try cseg_hmp_event (header-level field) at mainline=T
                try {
                    diagnosticSearch3b = search.create({
                        type: search.Type.JOURNAL_ENTRY,
                        filters: [
                            ["type", "anyof", "Journal"],
                            "AND",
                            ["trandate", "onorbefore", asOfDate],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["cseg_hmp_event", "isnotempty", ""]
                        ],
                        columns: [search.createColumn({ name: "internalid", summary: "COUNT" })]
                    });
                    const test3bCount = diagnosticSearch3b.runPaged().count;
                    debugLog.diagnostics.test3b_header_field = test3bCount;
                    log.audit('Diagnostic Test 3b', { cseg_hmp_event_at_header: test3bCount });
                } catch (test3bError) {
                    debugLog.diagnostics.test3b_error = test3bError.toString();
                    log.error('Test 3b Failed', test3bError.toString());
                }

                // Test 4a: Check with account filters
                try {
                    const accountTestSearch = search.create({
                        type: search.Type.JOURNAL_ENTRY,
                        filters: [
                            ["type", "anyof", "Journal"],
                            "AND",
                            ["trandate", "onorbefore", asOfDate],
                            "AND",
                            ["posting", "is", "T"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            [
                                ["account.number", "contains", config.account25010],
                                "OR",
                                ["account.number", "contains", config.account25020]
                            ]
                        ],
                        columns: [search.createColumn({ name: "internalid", summary: "COUNT" })]
                    });
                    const test4aCount = accountTestSearch.runPaged().count;
                    debugLog.diagnostics.test4a_withAccounts = test4aCount;
                    log.audit('Diagnostic Test 4a', { withAccounts_25010_25020: test4aCount });
                } catch (test4aError) {
                    debugLog.diagnostics.test4a_error = test4aError.toString();
                    log.error('Test 4a Failed', test4aError.toString());
                }

                // Test 4b: Get sample data to see actual field names and values
                try {
                    const sampleSearch = search.create({
                        type: search.Type.JOURNAL_ENTRY,
                        filters: [
                            ["type", "anyof", "Journal"],
                            "AND",
                            ["trandate", "onorbefore", asOfDate],
                            "AND",
                            ["posting", "is", "T"],
                            "AND",
                            ["mainline", "is", "F"]
                        ],
                        columns: [
                            search.createColumn({ name: "internalid" }),
                            search.createColumn({ name: "tranid" }),
                            search.createColumn({ name: "trandate" }),
                            search.createColumn({ name: "account" }),
                            search.createColumn({ name: "number", join: "account" }),
                            search.createColumn({ name: "cseg_hmp_event" }),  // Try both
                            search.createColumn({ name: "amount" })
                        ]
                    });

                    const sampleResults = [];
                    let sampleCount = 0;
                    sampleSearch.run().each(function(result) {
                        if (sampleCount < 5) {
                            sampleResults.push({
                                internalid: result.getValue('internalid'),
                                tranid: result.getValue('tranid'),
                                trandate: result.getValue('trandate'),
                                account: result.getText('account'),
                                accountNumber: result.getValue({ name: 'number', join: 'account' }),
                                cseg_hmp_event_value: result.getValue('cseg_hmp_event'),  // Try header field
                                cseg_hmp_event_text: result.getText('cseg_hmp_event'),
                                amount: result.getValue('amount')
                            });
                            sampleCount++;
                        }
                        return sampleCount < 5;
                    });

                    debugLog.diagnostics.test4b_sampleData = sampleResults;
                    log.audit('Diagnostic Test 4b', { sampleRecords: sampleResults.length, samples: JSON.stringify(sampleResults) });

                } catch (sampleError) {
                    log.error('Sample Data Test Failed', sampleError);
                    debugLog.diagnostics.test4b_error = sampleError.toString();
                }

            } catch (diagError) {
                log.error('Diagnostic Tests Failed', diagError);
                debugLog.diagnostics = { error: diagError.toString() };
            }

            // Build filters using EXACT working search from UI
            const filters = [
                ["formulanumeric: CASE WHEN ((({account} LIKE '%25010%' OR {account} LIKE '%25020%') AND {posting} = 'T' AND {line.cseg_hmp_event} IS NOT NULL)) OR ({type} = 'Sales Order' AND {line.cseg_hmp_event} IS NOT NULL) THEN 1 ELSE 0 END", "equalto", "1"],
                "AND",
                ["trandate", "onorbefore", asOfDate],
                "AND",
                ["type", "anyof", "Journal"]
            ];

            debugLog.filters = filters;

            // Log the search configuration
            log.debug('JE Search Filters', {
                filterCount: filters.length,
                filters: JSON.stringify(filters).substring(0, 500)
            });

            // Use EXACT working search from UI
            const journalentrySearchObj = search.create({
                type: "journalentry",
                settings: [{"name": "consolidationtype", "value": "ACCTTYPE"}],
                filters: filters,
                columns: [
                    search.createColumn({
                        name: "line.cseg_hmp_event",  // EXACT field name from working UI search
                        summary: "GROUP",
                        label: "Event"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "case when {account} LIKE '%25010%' then {amount} else 0 end",
                        label: "25010"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "case when {account} LIKE '%25020%' then {amount} else 0 end",
                        label: "25020"
                    })
                ]
            });

            // Try to get count first for debugging
            let searchCount = 0;
            try {
                const pagedData = journalentrySearchObj.runPaged({ pageSize: 1000 });
                searchCount = pagedData.count;
                log.audit('JE Search Count Retrieved', { count: searchCount });
                debugLog.summary.searchCount = searchCount;
            } catch (countError) {
                log.error('Failed to get JE search count', countError);
                debugLog.errors.push({
                    type: 'count_error',
                    message: countError.toString(),
                    stack: countError.stack
                });
            }

            let resultCount = 0;

            // Single pass through results - no double execution
            journalentrySearchObj.run().each(function(result) {
                resultCount++;

                // Check governance periodically
                if (resultCount % DEBUG_LOG_INTERVAL === 0) {
                    checkGovernance(`JE Search Processing (${resultCount} records)`);
                }

                // Get the event ID and text using the exact field name from working search
                const eventId = result.getValue({
                    name: "line.cseg_hmp_event",
                    summary: "GROUP"
                }) || '';

                const eventText = result.getText({
                    name: "line.cseg_hmp_event",
                    summary: "GROUP"
                }) || eventId || '';

                // Get amounts directly from formula columns
                const columns = result.columns;
                const amount25010 = safeParseFloat(result.getValue(columns[1])); // First formula column
                const amount25020 = safeParseFloat(result.getValue(columns[2])); // Second formula column

                // Store first 10 results for debugging
                if (resultCount <= 10) {
                    debugLog.searchResults.push({
                        resultNumber: resultCount,
                        eventId: eventId,
                        eventText: eventText,
                        amount25010: amount25010,
                        amount25020: amount25020,
                        columns: result.columns.map(col => ({
                            name: col.name,
                            formula: col.formula,
                            summary: col.summary
                        }))
                    });
                }

                if (eventId) {
                    // Initialize event object if it doesn't exist
                    if (!jeAmountsByEvent[eventId]) {
                        jeAmountsByEvent[eventId] = {
                            eventId: eventId,
                            eventText: eventText,
                            je25010: 0,
                            je25020: 0,
                            jeTotal: 0
                        };
                    }

                    // Accumulate amounts from formula columns
                    jeAmountsByEvent[eventId].je25010 += amount25010;
                    jeAmountsByEvent[eventId].je25020 += amount25020;

                    // Update total
                    jeAmountsByEvent[eventId].jeTotal =
                        jeAmountsByEvent[eventId].je25010 + jeAmountsByEvent[eventId].je25020;
                } else {
                    // Log missing event ID
                    if (resultCount <= 5) {
                        log.warn('JE Result Missing Event ID', {
                            resultNumber: resultCount,
                            amount25010: amount25010,
                            amount25020: amount25020
                        });
                    }
                }

                return true; // Continue iteration
            });

            // Performance logging
            const endTime = Date.now();
            const executionTime = endTime - startTime;

            debugLog.summary.resultCount = resultCount;
            debugLog.summary.eventCount = Object.keys(jeAmountsByEvent).length;
            debugLog.summary.executionTimeMs = executionTime;
            debugLog.summary.remainingGovernance = checkGovernance('JE Search Complete');
            debugLog.summary.jeAmountsByEvent = jeAmountsByEvent;

            log.audit('Journal Entry Search Complete', {
                resultCount: resultCount,
                eventCount: Object.keys(jeAmountsByEvent).length,
                executionTimeMs: executionTime,
                remainingGovernance: debugLog.summary.remainingGovernance
            });

            // Create debug log file
            try {
                const debugFileName = `JE_Search_Debug_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                const debugContent = JSON.stringify(debugLog, null, 2);
                const debugFileId = createDebugFile(debugFileName, debugContent, config.debugFolderId);

                if (debugFileId) {
                    log.audit('JE Debug File Created', {
                        fileName: debugFileName,
                        fileId: debugFileId,
                        folderId: config.debugFolderId
                    });
                }
            } catch (debugError) {
                log.error('Failed to Create JE Debug File', {
                    error: debugError.message,
                    stack: debugError.stack
                });
            }

        } catch (e) {
            debugLog.errors.push({
                type: 'fatal_error',
                message: e.message,
                stack: e.stack,
                timestamp: new Date().toISOString()
            });

            log.error('Journal Entry Search Error', {
                error: e.message,
                stack: e.stack
            });

            // Try to save error debug file
            try {
                const errorDebugFileName = `JE_Search_Error_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                const errorDebugContent = JSON.stringify(debugLog, null, 2);
                createDebugFile(errorDebugFileName, errorDebugContent, config.debugFolderId);
            } catch (fileError) {
                log.error('Failed to Save Error Debug File', fileError);
            }
        }

        return jeAmountsByEvent;
    };

    /**
     * Shows drill-down details for a specific event - only Sales Orders with variance
     * Modified to include multi-level relationships and JE information
     */
    const showDrillDownDetails = (context, eventId, eventName, asOfDate, revenueDate) => {
        const debugData = {
            timestamp: new Date().toISOString(),
            eventId: eventId,
            eventName: eventName,
            asOfDate: asOfDate,
            revenueDate: revenueDate,
            searchResults: [],
            salesOrderMap: {},
            invoiceToSOMap: {},
            errors: [],
            filters: []
        };

        try {
            checkGovernance('Drill-down Start');

            // Validate dates
            if (!isValidDate(asOfDate)) {
                throw new Error('Invalid As Of Date: ' + asOfDate);
            }

            if (revenueDate && !isValidDate(revenueDate)) {
                throw new Error('Invalid Revenue Date: ' + revenueDate);
            }

            // Create the drill-down form
            const form = serverWidget.createForm({
                title: `Variance Analysis: ${eventName || 'Event ' + eventId}`
            });

            // Get the script URL for the back button
            const scriptObj = runtime.getCurrentScript();
            const returnUrl = url.resolveScript({
                scriptId: scriptObj.id,
                deploymentId: scriptObj.deploymentId,
                returnExternalUrl: false
            });

            // Add back button with proper navigation
            form.addButton({
                id: 'custpage_back',
                label: 'Back to Summary',
                functionName: 'goBackToSummary'
            });

            // Add export to CSV button
            form.addButton({
                id: 'custpage_export_csv',
                label: 'Export to CSV',
                functionName: 'exportDrillDownToCSV()'
            });

            // Add info header
            const infoField = form.addField({
                id: 'custpage_drill_info',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });

            const revenueDateDisplay = revenueDate ? `<br/><strong>Revenue Date Filter:</strong> ${revenueDate}` : '';

            infoField.defaultValue = `
                <div style="margin: 10px 0; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
                    <strong>Event:</strong> ${eventName || eventId}<br/>
                    <strong>As Of Date:</strong> ${asOfDate}${revenueDateDisplay}<br/>
                    <strong>Analysis:</strong> Sales Orders with Variance (Balance Per Schedule vs. Actual Deferred Revenue)<br/>
                    <strong>Note:</strong> Includes Journal Entry amounts in variance calculation
                </div>
            `;

            // Create detail sublist
            const detailList = form.addSublist({
                id: 'custpage_drill_details',
                type: serverWidget.SublistType.LIST,
                label: 'Sales Orders with Variance (Including JE)'
            });

            // Add columns for variance analysis
            detailList.addField({
                id: 'custpage_hmp_event',
                type: serverWidget.FieldType.TEXT,
                label: 'HMP EVENT'
            });

            detailList.addField({
                id: 'custpage_date',
                type: serverWidget.FieldType.TEXT,
                label: 'DATE'
            });

            detailList.addField({
                id: 'custpage_customer_project',
                type: serverWidget.FieldType.TEXT,
                label: 'CUSTOMER/PROJECT'
            });

            detailList.addField({
                id: 'custpage_document_number',
                type: serverWidget.FieldType.TEXT,
                label: 'DOCUMENT NUMBER'
            });

            detailList.addField({
                id: 'custpage_balance_schedule',
                type: serverWidget.FieldType.CURRENCY,
                label: 'BALANCE PER SCHEDULE'
            });

            detailList.addField({
                id: 'custpage_actual_25010',
                type: serverWidget.FieldType.CURRENCY,
                label: 'ACTUAL 25010'
            });

            detailList.addField({
                id: 'custpage_actual_25020',
                type: serverWidget.FieldType.CURRENCY,
                label: 'ACTUAL 25020'
            });

            detailList.addField({
                id: 'custpage_variance_amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'VARIANCE AMOUNT'
            });

            // Build search filters including revenue date if provided
            const searchFilters = [
                ['line.cseg_hmp_event', 'anyof', eventId],
                'AND',
                ['trandate', 'onorbefore', asOfDate],
                'AND',
                ['mainline', 'is', 'F'] // Get line-level details
            ];

            // Add revenue date filter if provided
            if (revenueDate) {
                searchFilters.push('AND');
                searchFilters.push(['custcol_hmp_pub_revenue_date', 'onorafter', revenueDate]);
            }

            // Use INSTR instead of LIKE for better performance
            const config = getScriptParameters();
            searchFilters.push('AND');
            searchFilters.push(
                ['formulanumeric: CASE ' +
                    'WHEN {type} = \'Sales Order\' AND {line.cseg_hmp_event} IS NOT NULL THEN 1 ' +
                    'WHEN (INSTR({account.number}, \'' + config.account25010 + '\') > 0 OR INSTR({account.number}, \'' + config.account25020 + '\') > 0) AND {posting} = \'T\' THEN 1 ' +
                    'WHEN {createdfrom.type} = \'Sales Order\' AND {line.cseg_hmp_event} IS NOT NULL THEN 1 ' +
                    'ELSE 0 END',
                'equalto', '1']
            );

            debugData.filters = searchFilters;

            // Create comprehensive search for variance calculation
            const varianceSearch = search.create({
                type: 'transaction',
                filters: searchFilters,
                columns: [
                    search.createColumn({ name: 'type' }),
                    search.createColumn({ name: 'tranid' }),
                    search.createColumn({ name: 'trandate', sort: search.Sort.ASC }),
                    search.createColumn({ name: 'entity' }),
                    search.createColumn({ name: 'line.cseg_hmp_event' }),
                    search.createColumn({
                        name: 'tranid',
                        join: 'createdfrom'
                    }),
                    search.createColumn({
                        name: 'internalid',
                        join: 'createdfrom'
                    }),
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'line' }),
                    search.createColumn({ name: 'account' }),
                    search.createColumn({
                        name: 'formulacurrency',
                        formula: 'NVL({custcol_hmp_revenue_amt},0)',
                        label: 'Balance Per Schedule'
                    }),
                    search.createColumn({
                        name: 'formulacurrency',
                        formula: 'CASE WHEN INSTR({account.number}, \'' + config.account25010 + '\') > 0 THEN NVL({amount},0) ELSE 0 END',
                        label: '25010 Amount'
                    }),
                    search.createColumn({
                        name: 'formulacurrency',
                        formula: 'CASE WHEN INSTR({account.number}, \'' + config.account25020 + '\') > 0 THEN NVL({amount},0) ELSE 0 END',
                        label: '25020 Amount'
                    }),
                    search.createColumn({
                        name: 'type',
                        join: 'createdfrom'
                    })
                ]
            });

            // Store Sales Order data with comprehensive structure
            const salesOrderMap = {};
            const invoiceToSOMap = {};
            const transactionDetails = [];

            log.audit('Starting Variance Search', {
                eventId: eventId,
                eventName: eventName,
                asOfDate: asOfDate,
                revenueDate: revenueDate
            });

            let resultCount = 0;
            varianceSearch.run().each((result) => {
                resultCount++;

                // Check governance periodically
                if (resultCount % DEBUG_LOG_INTERVAL === 0) {
                    checkGovernance(`Variance Search (${resultCount} records)`);
                    log.debug(`Processing Variance Result ${resultCount}`);
                }

                const tranType = result.getText('type') || result.getValue('type') || '';
                const tranId = result.getValue('tranid') || '';
                const internalId = result.getValue('internalid');
                const lineNum = result.getValue('line');
                const account = result.getText('account') || result.getValue('account') || '';

                const tranDate = result.getValue('trandate');
                const entity = result.getText('entity') || result.getValue('entity') || '';
                const eventText = result.getText({name: 'line.cseg_hmp_event'}) ||
                                 result.getValue({name: 'line.cseg_hmp_event'}) || '';

                // Get the created from references
                const createdFromSO = result.getValue({
                    name: 'tranid',
                    join: 'createdfrom'
                }) || '';
                const createdFromId = result.getValue({
                    name: 'internalid',
                    join: 'createdfrom'
                }) || '';
                const createdFromType = result.getText({
                    name: 'type',
                    join: 'createdfrom'
                }) || result.getValue({
                    name: 'type',
                    join: 'createdfrom'
                }) || '';

                // Get the formula column values using safe parsing
                const columns = result.columns;
                const balancePerSchedule = safeParseFloat(result.getValue(columns[10]));
                const amount25010 = safeParseFloat(result.getValue(columns[11]));
                const amount25020 = safeParseFloat(result.getValue(columns[12]));

                // Store transaction details
                const tranDetail = {
                    type: tranType,
                    tranId: tranId,
                    internalId: internalId,
                    line: lineNum,
                    account: account,
                    createdFromSO: createdFromSO,
                    createdFromId: createdFromId,
                    createdFromType: createdFromType,
                    balancePerSchedule: balancePerSchedule,
                    amount25010: amount25010,
                    amount25020: amount25020,
                    entity: entity,
                    eventText: eventText,
                    tranDate: tranDate
                };
                transactionDetails.push(tranDetail);
                debugData.searchResults.push(tranDetail);

                // Check if this is a Sales Order
                const isSalesOrder = TRANSACTION_TYPES.SALES_ORDER.some(type =>
                    tranType.toLowerCase().includes(type.toLowerCase())
                );

                if (isSalesOrder && tranId.toUpperCase().includes('SO')) {
                    // Initialize or update Sales Order data
                    if (!salesOrderMap[tranId]) {
                        salesOrderMap[tranId] = {
                            tranId: tranId,
                            tranDate: tranDate,
                            entity: entity,
                            eventText: eventText,
                            balancePerSchedule: 0,
                            actualDeferred25010: 0,
                            actualDeferred25020: 0,
                            relatedTransactions: [],
                            lines: []
                        };
                    }

                    // Accumulate Balance Per Schedule
                    if (balancePerSchedule !== 0) {
                        salesOrderMap[tranId].balancePerSchedule += balancePerSchedule;
                        salesOrderMap[tranId].lines.push({
                            line: lineNum,
                            amount: balancePerSchedule
                        });
                    }

                    // Update fields if empty
                    if (!salesOrderMap[tranId].tranDate && tranDate) {
                        salesOrderMap[tranId].tranDate = tranDate;
                    }
                    if (!salesOrderMap[tranId].entity && entity) {
                        salesOrderMap[tranId].entity = entity;
                    }
                    if (!salesOrderMap[tranId].eventText && eventText) {
                        salesOrderMap[tranId].eventText = eventText;
                    }
                }

                // Track Invoice to SO relationships
                const isInvoice = TRANSACTION_TYPES.INVOICE.some(type =>
                    tranType.toLowerCase().includes(type.toLowerCase())
                );

                if (isInvoice && createdFromSO && createdFromSO.toUpperCase().includes('SO')) {
                    invoiceToSOMap[tranId] = createdFromSO;
                    log.debug('Invoice to SO Mapping', {
                        invoice: tranId,
                        salesOrder: createdFromSO
                    });
                }

                return true;
            });

            checkGovernance('After Variance Search');

            // Second search to specifically find Credit Memos and their relationships
            try {
                const creditMemoSearch = search.create({
                    type: 'creditmemo',
                    filters: [
                        ['trandate', 'onorbefore', asOfDate],
                        'AND',
                        ['formulanumeric: CASE WHEN INSTR({account.number}, \'' + config.account25010 + '\') > 0 OR INSTR({account.number}, \'' + config.account25020 + '\') > 0 THEN 1 ELSE 0 END', 'equalto', '1'],
                        'AND',
                        ['posting', 'is', 'T'],
                        'AND',
                        ['mainline', 'is', 'F']
                    ],
                    columns: [
                        search.createColumn({ name: 'tranid' }),
                        search.createColumn({ name: 'createdfrom' }),
                        search.createColumn({ name: 'amount' }),
                        search.createColumn({ name: 'account' }),
                        search.createColumn({ name: 'line' })
                    ]
                });

                let cmCount = 0;
                creditMemoSearch.run().each((result) => {
                    cmCount++;

                    if (cmCount % DEBUG_LOG_INTERVAL === 0) {
                        checkGovernance(`Credit Memo Search (${cmCount} records)`);
                    }

                    const cmTranId = result.getValue('tranid') || '';
                    const createdFromInvoice = result.getText('createdfrom') || result.getValue('createdfrom') || '';
                    const amount = safeParseFloat(result.getValue('amount'));
                    const account = result.getText('account') || result.getValue('account') || '';

                    // Extract the invoice transaction ID from the created from field
                    let invoiceRef = createdFromInvoice;

                    // Try different ways to match the invoice
                    let matchingInvoice = null;

                    // First, try exact match on tranId
                    matchingInvoice = transactionDetails.find(t =>
                        t.tranId === invoiceRef
                    );

                    // If not found, try extracting just the invoice number
                    if (!matchingInvoice) {
                        const invoiceMatch = invoiceRef.match(/INV\d+/i);
                        if (invoiceMatch) {
                            const invoiceNum = invoiceMatch[0];
                            matchingInvoice = transactionDetails.find(t =>
                                t.tranId && t.tranId.toUpperCase().includes(invoiceNum.toUpperCase())
                            );
                        }
                    }

                    // If still not found, try using the invoice-to-SO map directly
                    if (!matchingInvoice && invoiceToSOMap[invoiceRef]) {
                        const targetSOId = invoiceToSOMap[invoiceRef];

                        log.debug('Credit Memo to SO via Direct Map', {
                            creditMemo: cmTranId,
                            invoice: invoiceRef,
                            salesOrder: targetSOId
                        });

                        if (salesOrderMap[targetSOId]) {
                            // Add the credit memo amounts to the SO
                            if (account.indexOf(config.account25010) !== -1) {
                                salesOrderMap[targetSOId].actualDeferred25010 += amount;
                            } else if (account.indexOf(config.account25020) !== -1) {
                                salesOrderMap[targetSOId].actualDeferred25020 += amount;
                            }

                            salesOrderMap[targetSOId].relatedTransactions.push({
                                type: 'Credit Memo',
                                tranId: cmTranId,
                                account: account,
                                amount25010: account.indexOf(config.account25010) !== -1 ? amount : 0,
                                amount25020: account.indexOf(config.account25020) !== -1 ? amount : 0,
                                via: 'Invoice ' + invoiceRef
                            });
                        }
                    } else if (matchingInvoice && matchingInvoice.createdFromSO) {
                        const targetSOId = matchingInvoice.createdFromSO;

                        log.debug('Credit Memo to SO via Invoice Match', {
                            creditMemo: cmTranId,
                            invoice: invoiceRef,
                            matchedInvoice: matchingInvoice.tranId,
                            salesOrder: targetSOId
                        });

                        if (salesOrderMap[targetSOId]) {
                            // Add the credit memo amounts to the SO
                            if (account.indexOf(config.account25010) !== -1) {
                                salesOrderMap[targetSOId].actualDeferred25010 += amount;
                            } else if (account.indexOf(config.account25020) !== -1) {
                                salesOrderMap[targetSOId].actualDeferred25020 += amount;
                            }

                            salesOrderMap[targetSOId].relatedTransactions.push({
                                type: 'Credit Memo',
                                tranId: cmTranId,
                                account: account,
                                amount25010: account.indexOf(config.account25010) !== -1 ? amount : 0,
                                amount25020: account.indexOf(config.account25020) !== -1 ? amount : 0,
                                via: 'Invoice ' + invoiceRef
                            });
                        }
                    } else {
                        log.debug('Credit Memo Not Matched', {
                            creditMemo: cmTranId,
                            invoice: invoiceRef,
                            account: account,
                            amount: amount
                        });
                    }

                    return true;
                });

                checkGovernance('After Credit Memo Search');

            } catch (creditMemoError) {
                // Log the error but continue with processing
                log.error('Credit Memo Search Failed', {
                    error: creditMemoError.message,
                    stack: creditMemoError.stack
                });

                debugData.creditMemoSearchError = {
                    message: creditMemoError.message,
                    note: 'Credit memo search failed, but variance calculation continues with available data'
                };

                // Alternative: Look for credit memos in the main transaction details
                transactionDetails.forEach(tranDetail => {
                    const { type: tranType, tranId, createdFromSO, amount25010, amount25020, account } = tranDetail;

                    // Check if this is a Credit Memo type transaction
                    const isCreditMemo = TRANSACTION_TYPES.CREDIT_MEMO.some(type =>
                        tranType.toLowerCase().includes(type.toLowerCase())
                    );

                    if (isCreditMemo && createdFromSO) {
                        // This credit memo is directly linked to a Sales Order
                        if (!salesOrderMap[createdFromSO]) {
                            salesOrderMap[createdFromSO] = {
                                tranId: createdFromSO,
                                tranDate: '',
                                entity: tranDetail.entity,
                                eventText: tranDetail.eventText,
                                balancePerSchedule: 0,
                                actualDeferred25010: 0,
                                actualDeferred25020: 0,
                                relatedTransactions: [],
                                lines: []
                            };
                        }

                        // Add the deferred amounts
                        if (amount25010 !== 0) {
                            salesOrderMap[createdFromSO].actualDeferred25010 += amount25010;
                        }
                        if (amount25020 !== 0) {
                            salesOrderMap[createdFromSO].actualDeferred25020 += amount25020;
                        }

                        salesOrderMap[createdFromSO].relatedTransactions.push({
                            type: 'Credit Memo',
                            tranId: tranId,
                            account: account,
                            amount25010: amount25010,
                            amount25020: amount25020,
                            via: 'Direct from SO'
                        });

                        log.debug('Credit Memo from Main Search', {
                            creditMemo: tranId,
                            salesOrder: createdFromSO,
                            amount25010: amount25010,
                            amount25020: amount25020
                        });
                    }
                });
            }

            // Process direct relationships from main search
            transactionDetails.forEach(tranDetail => {
                const { type: tranType, tranId, createdFromSO, amount25010, amount25020, account } = tranDetail;

                // Skip Sales Orders themselves
                const isSalesOrder = TRANSACTION_TYPES.SALES_ORDER.some(type =>
                    tranType.toLowerCase().includes(type.toLowerCase())
                );
                if (isSalesOrder) return;

                // If this transaction is created from a Sales Order, link it
                if (createdFromSO && createdFromSO.toUpperCase().includes('SO')) {
                    if (!salesOrderMap[createdFromSO]) {
                        // Create placeholder for SO not in search results
                        salesOrderMap[createdFromSO] = {
                            tranId: createdFromSO,
                            tranDate: '',
                            entity: tranDetail.entity,
                            eventText: tranDetail.eventText,
                            balancePerSchedule: 0,
                            actualDeferred25010: 0,
                            actualDeferred25020: 0,
                            relatedTransactions: [],
                            lines: []
                        };
                    }

                    // Add the deferred amounts (these are typically negative for JE credits)
                    if (amount25010 !== 0) {
                        salesOrderMap[createdFromSO].actualDeferred25010 += amount25010;
                    }
                    if (amount25020 !== 0) {
                        salesOrderMap[createdFromSO].actualDeferred25020 += amount25020;
                    }

                    // Track related transaction
                    salesOrderMap[createdFromSO].relatedTransactions.push({
                        type: tranType,
                        tranId: tranId,
                        account: account,
                        amount25010: amount25010,
                        amount25020: amount25020
                    });
                }
            });

            debugData.salesOrderMap = salesOrderMap;
            debugData.invoiceToSOMap = invoiceToSOMap;

            log.audit('Processing Complete', {
                totalResults: resultCount,
                salesOrdersFound: Object.keys(salesOrderMap).length,
                transactionCount: transactionDetails.length,
                invoiceToSOCount: Object.keys(invoiceToSOMap).length,
                eventId: eventId,
                eventName: eventName,
                revenueDate: revenueDate
            });

            // Calculate variances and prepare display
            let lineNum = 0;
            let totalVariance = 0;
            const salesOrdersWithVariance = [];
            const processedSOs = new Set();

            for (const soId in salesOrderMap) {
                // Only process actual Sales Orders
                if (!soId.toUpperCase().includes('SO')) {
                    continue;
                }

                // Skip if already processed
                if (processedSOs.has(soId)) {
                    continue;
                }
                processedSOs.add(soId);

                const soData = salesOrderMap[soId];

                // Log the SO data for debugging
                log.audit('Processing SO for Display', {
                    soId: soId,
                    balancePerSchedule: soData.balancePerSchedule,
                    actualDeferred25010: soData.actualDeferred25010,
                    actualDeferred25020: soData.actualDeferred25020,
                    relatedCount: soData.relatedTransactions.length
                });

                // Calculate total actual deferred
                const totalActualDeferred = soData.actualDeferred25010 + soData.actualDeferred25020;

                // Variance = Balance Per Schedule - Actual Deferred
                const variance = soData.balancePerSchedule - totalActualDeferred;

                log.audit('SO Variance Details', {
                    soId: soId,
                    balancePerSchedule: soData.balancePerSchedule,
                    actualDeferred25010: soData.actualDeferred25010,
                    actualDeferred25020: soData.actualDeferred25020,
                    totalActualDeferred: totalActualDeferred,
                    variance: variance,
                    relatedCount: soData.relatedTransactions.length
                });

                // Show SOs with actual variance only
                if (Math.abs(variance) > VARIANCE_THRESHOLD) {
                    salesOrdersWithVariance.push({
                        soId: soId,
                        soData: soData,
                        variance: variance,
                        totalActualDeferred: totalActualDeferred
                    });
                }
            }

            // Sort by absolute variance (largest first) and remove any duplicates
            salesOrdersWithVariance.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

            // Remove duplicates by SO ID (final safety check)
            const uniqueSOs = [];
            const seenSOs = new Set();
            salesOrdersWithVariance.forEach(item => {
                if (!seenSOs.has(item.soId)) {
                    seenSOs.add(item.soId);
                    uniqueSOs.push(item);
                }
            });

            // Display the results
            uniqueSOs.forEach(item => {
                const { soId, soData, variance, totalActualDeferred } = item;

                // Format date
                let formattedDate = ' ';
                if (soData.tranDate) {
                    try {
                        formattedDate = format.format({
                            value: new Date(soData.tranDate),
                            type: format.Type.DATE
                        }) || soData.tranDate;
                    } catch (e) {
                        formattedDate = soData.tranDate;
                    }
                }

                detailList.setSublistValue({
                    id: 'custpage_hmp_event',
                    line: lineNum,
                    value: soData.eventText || ' '
                });

                detailList.setSublistValue({
                    id: 'custpage_date',
                    line: lineNum,
                    value: formattedDate
                });

                detailList.setSublistValue({
                    id: 'custpage_customer_project',
                    line: lineNum,
                    value: soData.entity || ' '
                });

                detailList.setSublistValue({
                    id: 'custpage_document_number',
                    line: lineNum,
                    value: soId || ' '
                });

                detailList.setSublistValue({
                    id: 'custpage_balance_schedule',
                    line: lineNum,
                    value: soData.balancePerSchedule
                });

                detailList.setSublistValue({
                    id: 'custpage_actual_25010',
                    line: lineNum,
                    value: soData.actualDeferred25010
                });

                detailList.setSublistValue({
                    id: 'custpage_actual_25020',
                    line: lineNum,
                    value: soData.actualDeferred25020
                });

                detailList.setSublistValue({
                    id: 'custpage_variance_amount',
                    line: lineNum,
                    value: variance * -1  // Multiply by -1 to match main report display convention
                });

                totalVariance += (variance * -1);
                lineNum++;
            });

            // Update title with count
            if (lineNum > 0) {
                form.title = `Variance Analysis: ${eventName || 'Event ' + eventId} - ${lineNum} Sales Order(s) with Variance`;
            } else {
                form.title = `Variance Analysis: ${eventName || 'Event ' + eventId} - No Variance Found`;
            }

            // Add variance summary
            const summaryField = form.addField({
                id: 'custpage_variance_summary',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });

            const summaryHtml = `
                <div style="margin: 20px 0; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                    <h3>Variance Summary:</h3>
                    <table style="width: 600px;">
                        <tr>
                            <td style="width: 400px;">Total Sales Orders Found:</td>
                            <td style="text-align: right;">${Object.keys(salesOrderMap).filter(id => id.toUpperCase().includes('SO')).length}</td>
                        </tr>
                        <tr>
                            <td>Sales Orders with Variance:</td>
                            <td style="text-align: right;">${lineNum}</td>
                        </tr>
                        <tr style="border-top: 2px solid #000; padding-top: 5px;">
                            <td><strong>Total Variance:</strong></td>
                            <td style="text-align: right; font-weight: bold; color: ${totalVariance < 0 ? 'red' : (totalVariance > 0 ? 'green' : 'black')};">
                                ${format.format({value: totalVariance, type: format.Type.CURRENCY}) || '$0.00'}
                            </td>
                        </tr>
                    </table>
                    <br/>
                    <div style="font-size: 12px; color: #666; margin-top: 15px;">
                        <strong>Variance Calculation:</strong><br/>
                        Variance = Actual Deferred Revenue - Balance Per Schedule<br/>
                        • Negative variance (red): Under-recognition of deferred revenue<br/>
                        • Positive variance (green): Over-recognition of deferred revenue<br/>
                        • Only Sales Orders with |variance| > $${VARIANCE_THRESHOLD} are displayed<br/>
                        <br/>
                        <strong>Columns Explained:</strong><br/>
                        • Balance Per Schedule: Revenue amount from Sales Order lines<br/>
                        • Actual 25010/25020: Deferred revenue posted to GL accounts<br/>
                        • Variance: Difference requiring adjustment<br/>
                        <br/>
                        <strong>Related Records Included:</strong><br/>
                        • Direct: Invoices and Journal Entries from Sales Orders<br/>
                        • Indirect: Credit Memos applied to related Invoices<br/>
                        • Journal Entries: Direct JE postings to deferred accounts
                    </div>
                </div>
            `;

            summaryField.defaultValue = summaryHtml;

            // Add CSV export script for drill-down view
            const csvExportScript = form.addField({
                id: 'custpage_csv_export_script',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });

            // Prepare data for CSV export
            const drillDownDataArray = [];
            for (let i = 0; i < lineNum; i++) {
                drillDownDataArray.push({
                    hmpEvent: detailList.getSublistValue({id: 'custpage_hmp_event', line: i}),
                    date: detailList.getSublistValue({id: 'custpage_date', line: i}),
                    customerProject: detailList.getSublistValue({id: 'custpage_customer_project', line: i}),
                    documentNumber: detailList.getSublistValue({id: 'custpage_document_number', line: i}),
                    balanceSchedule: safeParseFloat(detailList.getSublistValue({id: 'custpage_balance_schedule', line: i})),
                    actual25010: safeParseFloat(detailList.getSublistValue({id: 'custpage_actual_25010', line: i})),
                    actual25020: safeParseFloat(detailList.getSublistValue({id: 'custpage_actual_25020', line: i})),
                    variance: safeParseFloat(detailList.getSublistValue({id: 'custpage_variance_amount', line: i}))
                });
            }

            csvExportScript.defaultValue = `
                <script>
                // Store drill-down data for CSV export
                window.drillDownData = ${JSON.stringify(drillDownDataArray)};
                window.eventName = ${JSON.stringify(eventName || eventId)};
                window.asOfDate = ${JSON.stringify(asOfDate)};
                window.revenueDate = ${JSON.stringify(revenueDate || '')};

                // Back to Summary function - properly pass dates
                function goBackToSummary() {
                    var baseUrl = '${returnUrl}';
                    var asOfDate = window.asOfDate;
                    var revenueDate = window.revenueDate;

                    // Create a form to POST back to the summary
                    var form = document.createElement('form');
                    form.method = 'POST';
                    form.action = baseUrl;

                    // Add as of date
                    if (asOfDate) {
                        var asOfDateInput = document.createElement('input');
                        asOfDateInput.type = 'hidden';
                        asOfDateInput.name = 'custpage_as_of_date';
                        asOfDateInput.value = asOfDate;
                        form.appendChild(asOfDateInput);
                    }

                    // Add revenue date
                    if (revenueDate) {
                        var revenueDateInput = document.createElement('input');
                        revenueDateInput.type = 'hidden';
                        revenueDateInput.name = 'custpage_revenue_date';
                        revenueDateInput.value = revenueDate;
                        form.appendChild(revenueDateInput);
                    }

                    document.body.appendChild(form);
                    form.submit();
                }

                // CSV export function for drill-down view
                function exportDrillDownToCSV() {
                    const csvData = window.drillDownData || [];
                    const eventName = window.eventName || '';
                    const asOfDate = window.asOfDate || '';
                    const revenueDate = window.revenueDate || '';

                    // Create CSV content
                    let csvContent = 'Variance Analysis: ' + eventName + ' - As of ' + asOfDate;
                    if (revenueDate) {
                        csvContent += ' - Revenue Date Filter: ' + revenueDate;
                    }
                    csvContent += '\\n\\n';
                    csvContent += 'HMP EVENT,DATE,CUSTOMER/PROJECT,DOCUMENT NUMBER,BALANCE PER SCHEDULE,ACTUAL 25010,ACTUAL 25020,VARIANCE AMOUNT\\n';

                    csvData.forEach(row => {
                        // Escape commas and quotes in text fields
                        const escapeCSV = (value) => {
                            if (value === null || value === undefined) return '';
                            const str = value.toString();
                            if (str.includes(',') || str.includes('"') || str.includes('\\n')) {
                                return '"' + str.replace(/"/g, '""') + '"';
                            }
                            return str;
                        };

                        csvContent += escapeCSV(row.hmpEvent) + ',';
                        csvContent += escapeCSV(row.date) + ',';
                        csvContent += escapeCSV(row.customerProject) + ',';
                        csvContent += escapeCSV(row.documentNumber) + ',';
                        csvContent += row.balanceSchedule + ',';
                        csvContent += row.actual25010 + ',';
                        csvContent += row.actual25020 + ',';
                        csvContent += row.variance + '\\n';
                    });

                    // Add totals row
                    const totalVariance = csvData.reduce((sum, row) => sum + row.variance, 0);
                    const totalBalance = csvData.reduce((sum, row) => sum + row.balanceSchedule, 0);
                    const total25010 = csvData.reduce((sum, row) => sum + row.actual25010, 0);
                    const total25020 = csvData.reduce((sum, row) => sum + row.actual25020, 0);

                    csvContent += '\\n';
                    csvContent += 'TOTAL,,,' + csvData.length + ' Sales Orders,';
                    csvContent += totalBalance + ',';
                    csvContent += total25010 + ',';
                    csvContent += total25020 + ',';
                    csvContent += totalVariance + '\\n';

                    // Create filename
                    const dateStr = asOfDate.replace(/\\//g, '-');
                    const eventNameClean = eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    const filename = 'variance_detail_' + eventNameClean + '_' + dateStr + '.csv';

                    // Trigger download
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    if (navigator.msSaveBlob) { // IE 10+
                        navigator.msSaveBlob(blob, filename);
                    } else {
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', filename);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }
                </script>
            `;

            // Create debug file
            const debugFileName = `debug_variance_${eventId}_${new Date().getTime()}.json`;
            const debugContent = JSON.stringify(debugData, null, 2);
            const debugFileId = createDebugFile(debugFileName, debugContent, config.debugFolderId);

            if (debugFileId) {
                log.audit('Debug File Created Successfully', {
                    fileName: debugFileName,
                    fileId: debugFileId,
                    recordCount: resultCount
                });
            }

            context.response.writePage(form);

        } catch (error) {
            debugData.errors.push({
                message: error.message,
                stack: error.stack
            });

            // Try to save debug file even on error
            const errorDebugFileName = `error_variance_${eventId}_${new Date().getTime()}.json`;
            const errorDebugContent = JSON.stringify(debugData, null, 2);
            createDebugFile(errorDebugFileName, errorDebugContent, getScriptParameters().debugFolderId);

            throw error;
        }
    };

    /**
     * Handles the Suitelet GET/POST request with JE integration
     * @param {Object} context - Suitelet context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     */
    const onRequest = (context) => {
        try {
            checkGovernance('Main Request Start');

            // Check if this is a drill-down request
            const drillDownEvent = context.request.parameters.custpage_drill_event;
            const drillDownEventName = context.request.parameters.custpage_drill_event_name;
            const drillDownDate = context.request.parameters.custpage_drill_date;
            const drillDownRevenueDate = context.request.parameters.custpage_drill_revenue_date;

            if (drillDownEvent) {
                showDrillDownDetails(context, drillDownEvent, drillDownEventName, drillDownDate, drillDownRevenueDate);
                return;
            }

            // Get configuration
            const config = getScriptParameters();

            // Create the form
            const form = serverWidget.createForm({
                title: 'Deferred Revenue by Event Report'
            });

            // Check if this is a POST request (form submission)
            const isPost = context.request.method === 'POST';

            // Get as of date parameter from the request
            let asOfDate = context.request.parameters.custpage_as_of_date;

            if (!asOfDate) {
                // Set default to today if no date provided
                asOfDate = format.format({
                    value: new Date(),
                    type: format.Type.DATE
                });
            } else if (!isValidDate(asOfDate)) {
                log.error('Invalid As Of Date', { asOfDate: asOfDate });
                asOfDate = format.format({
                    value: new Date(),
                    type: format.Type.DATE
                });
            }

            // Get revenue date parameter
            let revenueDate = context.request.parameters.custpage_revenue_date;

            if (!revenueDate && !context.request.parameters.custpage_as_of_date) {
                // Only set default revenue date if this is the initial load
                const today = new Date();
                const firstDayPriorMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                revenueDate = format.format({
                    value: firstDayPriorMonth,
                    type: format.Type.DATE
                });
            } else if (revenueDate && !isValidDate(revenueDate)) {
                log.error('Invalid Revenue Date', { revenueDate: revenueDate });
                revenueDate = '';
            }

            // Add date filter fields
            const filterGroup = form.addFieldGroup({
                id: 'custpage_filters',
                label: 'Report Filters'
            });

            const asOfDateField = form.addField({
                id: 'custpage_as_of_date',
                type: serverWidget.FieldType.DATE,
                label: 'As Of Date',
                container: 'custpage_filters'
            });
            asOfDateField.defaultValue = asOfDate;
            asOfDateField.isMandatory = true;
            asOfDateField.setHelpText({
                help: 'Select the date to calculate deferred revenue as of. The report will include all transactions on or before this date.'
            });

            const revenueDateField = form.addField({
                id: 'custpage_revenue_date',
                type: serverWidget.FieldType.DATE,
                label: 'Revenue Date on or After',
                container: 'custpage_filters'
            });
            revenueDateField.defaultValue = revenueDate || '';
            revenueDateField.setHelpText({
                help: 'Filter to include only transactions with revenue date on or after this date. Leave blank to include all dates.'
            });

            // Add buttons
            form.addSubmitButton({
                label: 'Run Report'
            });

            form.addButton({
                id: 'custpage_refresh',
                label: 'Reset to Today',
                functionName: 'window.location.href = window.location.pathname'
            });

            form.addButton({
                id: 'custpage_export_summary_csv',
                label: 'Export to CSV',
                functionName: 'exportSummaryToCSV()'
            });

            // Load the saved search
            let savedSearch;
            try {
                savedSearch = search.load({
                    id: 'customsearch' + config.savedSearchId
                });

                log.debug('Saved Search Loaded', {
                    id: savedSearch.id,
                    title: savedSearch.title,
                    type: savedSearch.searchType
                });
            } catch (e) {
                try {
                    savedSearch = search.load({
                        id: config.savedSearchId
                    });
                } catch (e2) {
                    throw new Error('Unable to load saved search. Please verify the search ID: ' + config.savedSearchId);
                }
            }

            // Modify the existing filters in the saved search
            if (asOfDate || revenueDate) {
                let existingFilters = savedSearch.filters || [];
                let dateFilterFound = false;
                let revenueDateFilterFound = false;

                // Update existing filters
                existingFilters = existingFilters.map(filter => {
                    if (filter.name === 'trandate' && filter.operator === search.Operator.ONORBEFORE) {
                        dateFilterFound = true;
                        if (asOfDate) {
                            return search.createFilter({
                                name: 'trandate',
                                operator: search.Operator.ONORBEFORE,
                                values: asOfDate
                            });
                        }
                        return filter;
                    }

                    if (filter.name === 'custcol_hmp_pub_revenue_date' && filter.operator === search.Operator.ONORAFTER) {
                        revenueDateFilterFound = true;
                        if (revenueDate) {
                            return search.createFilter({
                                name: 'custcol_hmp_pub_revenue_date',
                                operator: search.Operator.ONORAFTER,
                                values: revenueDate
                            });
                        }
                        return null;
                    }

                    return filter;
                });

                // Filter out null values
                existingFilters = existingFilters.filter(f => f !== null);

                // Add new filters if not found
                if (!dateFilterFound && asOfDate) {
                    existingFilters.push(search.createFilter({
                        name: 'trandate',
                        operator: search.Operator.ONORBEFORE,
                        values: asOfDate
                    }));
                }

                if (!revenueDateFilterFound && revenueDate) {
                    existingFilters.push(search.createFilter({
                        name: 'custcol_hmp_pub_revenue_date',
                        operator: search.Operator.ONORAFTER,
                        values: revenueDate
                    }));
                }

                savedSearch.filters = existingFilters;
            }

            checkGovernance('Before JE Search');

            // GET JOURNAL ENTRY AMOUNTS
            const jeAmountsByEvent = getJournalEntryAmounts(asOfDate, config);

            log.audit('Journal Entry Summary', {
                eventCount: Object.keys(jeAmountsByEvent).length,
                totalJEs: Object.values(jeAmountsByEvent).reduce((sum, je) => sum + je.jeTotal, 0)
            });

            checkGovernance('After JE Search');

            // Add a sublist to display results
            const resultsList = form.addSublist({
                id: 'custpage_results',
                type: serverWidget.SublistType.LIST,
                label: 'Search Results'
            });

            // Add columns - JE amounts merged into main columns
            resultsList.addField({
                id: 'custpage_event',
                type: serverWidget.FieldType.TEXT,
                label: 'HMP Event'
            });

            resultsList.addField({
                id: 'custpage_25010',
                type: serverWidget.FieldType.CURRENCY,
                label: '25010 - Deferred Revenue'
            });

            resultsList.addField({
                id: 'custpage_25020',
                type: serverWidget.FieldType.CURRENCY,
                label: '25020 - Deferred Revenue'
            });

            resultsList.addField({
                id: 'custpage_total_deferred',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Total Deferred'
            });

            resultsList.addField({
                id: 'custpage_balance_schedule',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Balance Per Schedule'
            });

            resultsList.addField({
                id: 'custpage_variance',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Variance'
            });

            resultsList.addField({
                id: 'custpage_details',
                type: serverWidget.FieldType.TEXT,
                label: 'Details'
            });

            // Hidden field to store event IDs
            resultsList.addField({
                id: 'custpage_event_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Event ID',
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            // Process search results and merge JE amounts
            let lineNum = 0;
            let totalRow = {
                account25010: 0,  // Will include JE amounts
                account25020: 0,  // Will include JE amounts
                total: 0,
                balanceSchedule: 0,
                variance: 0
            };

            // Track which events we've processed
            const processedEvents = new Set();

            const pagedData = savedSearch.runPaged({
                pageSize: PAGE_SIZE
            });

            // Log warning if result count is very high
            if (pagedData.count > 5000) {
                log.error('Large Result Set Warning', {
                    count: pagedData.count,
                    message: 'Consider adding filters to reduce result size'
                });
            }

            log.debug('Search Result Count', pagedData.count);

            const displayDate = asOfDate || format.format({
                value: new Date(),
                type: format.Type.DATE
            });

            const revenueDateDisplay = revenueDate ? format.format({
                value: new Date(revenueDate),
                type: format.Type.DATE
            }) : 'Not Applied';

            // Add info field
            const infoField = form.addField({
                id: 'custpage_info',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });
            infoField.defaultValue = `
                <div style="margin: 10px 0; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
                    <table style="width: 100%;">
                        <tr>
                            <td><strong>Report As Of Date:</strong> ${displayDate}</td>
                            <td style="text-align: center;"><strong>Revenue Date Filter:</strong> ${revenueDateDisplay}</td>
                            <td style="text-align: right;"><strong>Total Results:</strong> ${pagedData.count} Events</td>
                        </tr>
                    </table>
                    <div style="margin-top: 10px; font-size: 11px; color: #666;">
                        <strong>Note:</strong> This report includes all deferred revenue amounts from accounts ${config.account25010} and ${config.account25020}.
                        Journal Entry amounts are merged into the main "25010 - Deferred Revenue" and "25020 - Deferred Revenue" columns.
                        The "Total Deferred" column shows the sum of both accounts (25010 + 25020), including JE amounts.
                    </div>
                </div>
            `;

            // Get script URL for drill-down
            const scriptObj = runtime.getCurrentScript();
            const suiteletUrl = url.resolveScript({
                scriptId: scriptObj.id,
                deploymentId: scriptObj.deploymentId,
                returnExternalUrl: false
            });

            // Process each page of saved search results
            pagedData.pageRanges.forEach(pageRange => {
                const page = pagedData.fetch({ index: pageRange.index });

                page.data.forEach(result => {
                    const columns = result.columns;

                    // Get the event ID and text
                    const eventId = result.getValue({
                        name: 'line.cseg_hmp_event',
                        summary: 'GROUP'
                    }) || '';

                    const eventText = result.getText({
                        name: 'line.cseg_hmp_event',
                        summary: 'GROUP'
                    }) || eventId || '';

                    // Mark this event as processed
                    processedEvents.add(eventId);

                    // Get currency values from saved search with safe parsing
                    const account25010Base = safeParseFloat(result.getValue(columns[1]));
                    const account25020Base = safeParseFloat(result.getValue(columns[2]));
                    const balanceSchedule = safeParseFloat(result.getValue(columns[4]));

                    // Get JE amounts for this event
                    const jeData = jeAmountsByEvent[eventId] || {
                        je25010: 0,
                        je25020: 0,
                        jeTotal: 0
                    };

                    // MERGE JE amounts into main columns
                    const account25010 = account25010Base + jeData.je25010;
                    const account25020 = account25020Base + jeData.je25020;

                    // Calculate total from merged amounts
                    const totalDeferred = account25010 + account25020;

                    // Recalculate variance with JE amounts included
                    const variance = totalDeferred - balanceSchedule;

                    // Set values in the sublist with merged amounts
                    resultsList.setSublistValue({
                        id: 'custpage_event',
                        line: lineNum,
                        value: eventText || '(No Event)'
                    });

                    resultsList.setSublistValue({
                        id: 'custpage_25010',
                        line: lineNum,
                        value: account25010  // Includes JE amounts
                    });

                    resultsList.setSublistValue({
                        id: 'custpage_25020',
                        line: lineNum,
                        value: account25020  // Includes JE amounts
                    });

                    resultsList.setSublistValue({
                        id: 'custpage_total_deferred',
                        line: lineNum,
                        value: totalDeferred
                    });

                    resultsList.setSublistValue({
                        id: 'custpage_balance_schedule',
                        line: lineNum,
                        value: balanceSchedule
                    });

                    resultsList.setSublistValue({
                        id: 'custpage_variance',
                        line: lineNum,
                        value: variance
                    });

                    // Add details link if there's variance
                    if (Math.abs(variance) > VARIANCE_THRESHOLD) {
                        const detailsLink = `<a href="#" onclick="drillDown('${eventId}');return false;">View</a>`;
                        resultsList.setSublistValue({
                            id: 'custpage_details',
                            line: lineNum,
                            value: detailsLink
                        });
                    } else {
                        resultsList.setSublistValue({
                            id: 'custpage_details',
                            line: lineNum,
                            value: ' '
                        });
                    }

                    resultsList.setSublistValue({
                        id: 'custpage_event_id',
                        line: lineNum,
                        value: eventId || ' '
                    });

                    // Accumulate totals with merged values
                    totalRow.account25010 += account25010;
                    totalRow.account25020 += account25020;
                    totalRow.total += totalDeferred;
                    totalRow.balanceSchedule += balanceSchedule;
                    totalRow.variance += variance;

                    lineNum++;
                });
            });

            checkGovernance('After Main Search Processing');

            // Add any JE-only events (events that appear in JE search but not in saved search)
            for (const eventId in jeAmountsByEvent) {
                if (!processedEvents.has(eventId)) {
                    const jeData = jeAmountsByEvent[eventId];
                    const totalDeferred = jeData.jeTotal;
                    // For JE-only events, variance equals the total JE amount (no balance schedule)
                    const variance = totalDeferred;

                    resultsList.setSublistValue({
                        id: 'custpage_event',
                        line: lineNum,
                        value: jeData.eventText + ' (JE Only)'
                    });

                    // For JE-only events, show JE amounts in main columns
                    resultsList.setSublistValue({
                        id: 'custpage_25010',
                        line: lineNum,
                        value: jeData.je25010  // JE amount goes in main column
                    });

                    resultsList.setSublistValue({
                        id: 'custpage_25020',
                        line: lineNum,
                        value: jeData.je25020  // JE amount goes in main column
                    });

                    resultsList.setSublistValue({
                        id: 'custpage_total_deferred',
                        line: lineNum,
                        value: totalDeferred
                    });

                    resultsList.setSublistValue({
                        id: 'custpage_balance_schedule',
                        line: lineNum,
                        value: 0
                    });

                    resultsList.setSublistValue({
                        id: 'custpage_variance',
                        line: lineNum,
                        value: variance
                    });

                    resultsList.setSublistValue({
                        id: 'custpage_details',
                        line: lineNum,
                        value: ' '
                    });

                    resultsList.setSublistValue({
                        id: 'custpage_event_id',
                        line: lineNum,
                        value: eventId || ' '
                    });

                    // Accumulate totals in merged columns
                    totalRow.account25010 += jeData.je25010;
                    totalRow.account25020 += jeData.je25020;
                    totalRow.total += totalDeferred;
                    totalRow.variance += variance;

                    // Log JE-only event
                    log.audit('JE-Only Event Added', {
                        eventId: eventId,
                        eventText: jeData.eventText,
                        je25010: jeData.je25010,
                        je25020: jeData.je25020,
                        total: totalDeferred
                    });

                    lineNum++;
                }
            }

            // Add totals row if there are results
            if (lineNum > 0) {
                // Add separator
                resultsList.setSublistValue({
                    id: 'custpage_event',
                    line: lineNum,
                    value: '────────────────────'
                });

                // Set zeros for separator row
                ['custpage_25010', 'custpage_25020', 'custpage_total_deferred', 'custpage_balance_schedule', 'custpage_variance'].forEach(field => {
                    resultsList.setSublistValue({
                        id: field,
                        line: lineNum,
                        value: 0
                    });
                });

                resultsList.setSublistValue({
                    id: 'custpage_details',
                    line: lineNum,
                    value: ' '
                });

                resultsList.setSublistValue({
                    id: 'custpage_event_id',
                    line: lineNum,
                    value: ' '
                });

                lineNum++;

                // Add totals
                resultsList.setSublistValue({
                    id: 'custpage_event',
                    line: lineNum,
                    value: '*** GRAND TOTAL ***'
                });

                resultsList.setSublistValue({
                    id: 'custpage_25010',
                    line: lineNum,
                    value: totalRow.account25010  // Includes JE amounts
                });

                resultsList.setSublistValue({
                    id: 'custpage_25020',
                    line: lineNum,
                    value: totalRow.account25020  // Includes JE amounts
                });

                resultsList.setSublistValue({
                    id: 'custpage_total_deferred',
                    line: lineNum,
                    value: totalRow.total
                });

                resultsList.setSublistValue({
                    id: 'custpage_balance_schedule',
                    line: lineNum,
                    value: totalRow.balanceSchedule
                });

                resultsList.setSublistValue({
                    id: 'custpage_variance',
                    line: lineNum,
                    value: totalRow.variance
                });

                resultsList.setSublistValue({
                    id: 'custpage_details',
                    line: lineNum,
                    value: ' '
                });

                resultsList.setSublistValue({
                    id: 'custpage_event_id',
                    line: lineNum,
                    value: ' '
                });
            }

            checkGovernance('Before Client Script');

            // Add client script for CSV export and drill-down
            const clientScriptField = form.addField({
                id: 'custpage_client_script',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });

            // Prepare summary data for CSV export
            const summaryDataArray = [];
            for (let i = 0; i < lineNum; i++) {
                if (i === lineNum - 2) continue; // Skip separator row
                if (i === lineNum - 1) { // Total row
                    summaryDataArray.push({
                        event: 'GRAND TOTAL',
                        account25010: totalRow.account25010,
                        account25020: totalRow.account25020,
                        totalDeferred: totalRow.total,
                        balanceSchedule: totalRow.balanceSchedule,
                        variance: totalRow.variance,
                        isTotal: true
                    });
                } else {
                    summaryDataArray.push({
                        event: resultsList.getSublistValue({id: 'custpage_event', line: i}),
                        account25010: safeParseFloat(resultsList.getSublistValue({id: 'custpage_25010', line: i})),
                        account25020: safeParseFloat(resultsList.getSublistValue({id: 'custpage_25020', line: i})),
                        totalDeferred: safeParseFloat(resultsList.getSublistValue({id: 'custpage_total_deferred', line: i})),
                        balanceSchedule: safeParseFloat(resultsList.getSublistValue({id: 'custpage_balance_schedule', line: i})),
                        variance: safeParseFloat(resultsList.getSublistValue({id: 'custpage_variance', line: i})),
                        isTotal: false
                    });
                }
            }

            clientScriptField.defaultValue = `
                <script>
                // Store data for CSV export
                window.summaryData = ${JSON.stringify(summaryDataArray)};
                window.asOfDate = ${JSON.stringify(asOfDate)};
                window.revenueDate = ${JSON.stringify(revenueDate || '')};

                // CSV export function
                function exportSummaryToCSV() {
                    const csvData = window.summaryData || [];
                    const asOfDate = window.asOfDate || '';
                    const revenueDate = window.revenueDate || '';

                    // Create CSV content
                    let csvContent = 'Deferred Revenue by Event Report - As of ' + asOfDate;
                    if (revenueDate) {
                        csvContent += ' - Revenue Date Filter: ' + revenueDate;
                    }
                    csvContent += '\\n\\n';
                    csvContent += 'HMP Event,25010 - Deferred Revenue,25020 - Deferred Revenue,Total Deferred,Balance Per Schedule,Variance\\n';

                    csvData.forEach(row => {
                        // Escape commas and quotes in text fields
                        const escapeCSV = (value) => {
                            if (value === null || value === undefined) return '';
                            const str = value.toString();
                            if (str.includes(',') || str.includes('"') || str.includes('\\n')) {
                                return '"' + str.replace(/"/g, '""') + '"';
                            }
                            return str;
                        };

                        if (row.isTotal) {
                            csvContent += '\\n'; // Add blank line before totals
                        }

                        csvContent += escapeCSV(row.event) + ',';
                        csvContent += row.account25010 + ',';
                        csvContent += row.account25020 + ',';
                        csvContent += row.totalDeferred + ',';
                        csvContent += row.balanceSchedule + ',';
                        csvContent += row.variance + '\\n';
                    });

                    // Create filename
                    const dateStr = asOfDate.replace(/\\//g, '-');
                    const filename = 'deferred_revenue_' + dateStr + '.csv';

                    // Trigger download
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    if (navigator.msSaveBlob) { // IE 10+
                        navigator.msSaveBlob(blob, filename);
                    } else {
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', filename);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }

                // Drill-down function
                function drillDown(eventId) {
                    // Get the event name from the row
                    var eventName = '';
                    var rows = document.querySelectorAll('[id*="custpage_results"] tr');
                    for (var i = 0; i < rows.length; i++) {
                        var cells = rows[i].querySelectorAll('td');
                        if (cells.length >= 10) {
                            var hiddenEventId = cells[9].innerText || cells[9].textContent || '';
                            if (hiddenEventId.trim() === eventId) {
                                eventName = cells[0].innerText || cells[0].textContent || '';
                                break;
                            }
                        }
                    }

                    var baseUrl = '${suiteletUrl}';
                    var drillUrl = baseUrl + '&custpage_drill_event=' + eventId +
                                  '&custpage_drill_event_name=' + encodeURIComponent(eventName) +
                                  '&custpage_drill_date=' + encodeURIComponent('${asOfDate}');

                    if ('${revenueDate}') {
                        drillUrl += '&custpage_drill_revenue_date=' + encodeURIComponent('${revenueDate}');
                    }

                    window.location.href = drillUrl;
                }
                </script>
            `;

            log.audit('Request Complete', {
                totalLines: lineNum,
                remainingGovernance: checkGovernance('Request Complete')
            });

            context.response.writePage(form);

        } catch (error) {
            log.error('Error in Suitelet', error);

            const errorForm = serverWidget.createForm({
                title: 'Error Loading Report'
            });

            const errorField = errorForm.addField({
                id: 'custpage_error',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });

            errorField.defaultValue = `
                <div style="color: red; padding: 20px;">
                    <h3>An error occurred while loading the report:</h3>
                    <p>${error.message}</p>
                    <p>Please verify the configuration and try again.</p>
                    <br/>
                    <p><a href="${context.request.url.split('?')[0]}">Click here to return to the report</a></p>
                </div>
            `;

            context.response.writePage(errorForm);
        }
    };

    return {
        onRequest: onRequest
    };
});