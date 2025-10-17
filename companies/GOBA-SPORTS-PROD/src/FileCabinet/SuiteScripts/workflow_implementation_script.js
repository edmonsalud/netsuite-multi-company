/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * 
 * Accessory Attachment Type Workflow - Map/Reduce Implementation with Decision Logging
 * Folder: 16084405
 * Date: September 25, 2025
 * Updated: October 3, 2025 - Fixed item class search logic
 * 
 * This MAP/REDUCE SCRIPT implements the Accessory Attachment Type Workflow logic
 * using NetSuite Saved Searches 12009 (Unit Sales) and 11698 (Accessory Sales)
 * 
 * Script Type: Map/Reduce Script
 * Purpose: Process large volumes of accessory sales and match against unit sales
 * 
 * Field to update: custbody_attachment_type
 * Values:
 *   - 1: Attached
 *   - 2: PP Same Day  
 *   - 3: Post Purchase
 *   - 4: 3rd Party
 * 
 * Enhancement: Creates detailed decision log when processing single records
 * 
 * IMPORTANT: 
 * - Saved Search 11698 must include these columns:
 *   - tranid (Document Number)
 *   - entity (Customer)
 *   - trandate (Transaction Date)
 *   - type (Transaction Type)
 *   - trandate.fulfillingtransaction (Ship Date - optional)
 * - Unit sales are identified by items with class = 1 (at line level)
 */

define(['N/search', 'N/record', 'N/log', 'N/runtime', 'N/file'], 
    function(search, record, log, runtime, file) {

    var LOG_FOLDER_ID = 16084405;

    /**
     * Helper function to repeat a character n times
     */
    function repeatChar(char, count) {
        var result = '';
        for (var i = 0; i < count; i++) {
            result += char;
        }
        return result;
    }

    /**
     * Input Data Stage - Define the accessory sales to process
     * @returns {Array|Object|Search|RecordRef} Accessory sales records
     */
    function getInputData() {
        try {
            log.audit('GetInputData', 'Starting Accessory Attachment Type processing');
            
            // Load the accessory sales search
            var accessorySalesSearch = search.load({
                id: '11698' // [Power BI] Accessory Sales - Detail
            });
            
            log.audit('Search Loaded', 'Using saved search ID 11698 - [Power BI] Accessory Sales - Detail');
            
            // Check if we have only one result for detailed logging
            var resultCount = accessorySalesSearch.runPaged().count;
            log.audit('Result Count', 'Found ' + resultCount + ' records to process');
            
            // Enable single record mode if only one result
            if (resultCount === 1) {
                log.audit('Single Record Mode', 'Enabled detailed decision logging for single record');
                
                // We'll pass this information through the search results
                // For single record mode, we need to extract the values properly
                var resultsWithFlag = [];
                accessorySalesSearch.run().each(function(result) {
                    // Extract all the values we need
                    var extractedResult = {
                        id: result.id,
                        recordType: result.recordType,
                        values: {
                            tranid: result.getValue('tranid'),
                            entity: {
                                value: result.getValue('entity'),
                                text: result.getText('entity')
                            },
                            trandate: result.getValue('trandate'),
                            'trandate.fulfillingtransaction': result.getValue({
                                name: 'trandate',
                                join: 'fulfillingtransaction'
                            }),
                            type: {
                                value: result.getValue('type'),
                                text: result.getText('type')
                            }
                        }
                    };
                    
                    resultsWithFlag.push({
                        searchResult: extractedResult,
                        singleRecordMode: true,
                        totalCount: resultCount
                    });
                    return false; // Since we know there's only 1 result
                });
                return resultsWithFlag;
            }
            
            return accessorySalesSearch;
            
        } catch (e) {
            log.error('GetInputData Error', 
                'Failed to load saved search ID 11698. Error: ' + e.toString() + 
                '\nPlease ensure the search "[Power BI] Accessory Sales - Detail" exists and is accessible.'
            );
            throw e;
        }
    }

    /**
     * Map Stage - Process each accessory sale record with detailed logging
     * @param {MapContext} context
     */
    function map(context) {
        try {
            var singleRecordMode = false;
            var decisionLog = [];
            var searchResult;
            
            // Check if we have the wrapped format (single record mode) or regular search result
            var contextValue = JSON.parse(context.value);
            
            if (contextValue.singleRecordMode !== undefined) {
                // Single record mode - extract the actual search result
                singleRecordMode = true;
                searchResult = contextValue.searchResult;
                log.audit('Map Stage', 'Processing in single record mode');
            } else {
                // Regular search result
                searchResult = contextValue;
            }
            
            // Extract accessory sale data
            var accessorySale = {
                internalId: searchResult.id,
                recordType: searchResult.recordType,
                docNumber: searchResult.values.tranid || '',
                customerName: (searchResult.values.entity && searchResult.values.entity.text) || 
                              (searchResult.values.entity && searchResult.values.entity.value) || 
                              searchResult.values.entity || '',
                customerId: (searchResult.values.entity && searchResult.values.entity.value) || 
                            searchResult.values.entity || '',
                orderDate: searchResult.values.trandate || '',
                shipDate: searchResult.values['trandate.fulfillingtransaction'] || searchResult.values.trandate || '',
                transactionType: (searchResult.values.type && searchResult.values.type.value) || 
                                searchResult.values.type || 'SalesOrd'
            };
            
            log.debug('Processing Accessory Sale', 
                'Doc: ' + accessorySale.docNumber + ', Customer: ' + accessorySale.customerName
            );
            
            // Initialize decision log for single record mode
            if (singleRecordMode) {
                decisionLog = initializeDecisionLog(accessorySale);
            }
            
            // Determine attachment type with logging
            var attachmentResult = determineAttachmentTypeWithLogging(accessorySale, singleRecordMode, decisionLog);
            
            // Add final decision to log
            if (singleRecordMode) {
                decisionLog = attachmentResult.decisionLog;
                addToDecisionLog(decisionLog, '');
                addToDecisionLog(decisionLog, 'FINAL DECISION:');
                addToDecisionLog(decisionLog, repeatChar('-', 40));
                addToDecisionLog(decisionLog, 'Attachment Type: ' + attachmentResult.attachmentType);
                addToDecisionLog(decisionLog, 'Attachment Type ID: ' + attachmentResult.attachmentTypeId);
                if (attachmentResult.dateDifference !== null) {
                    addToDecisionLog(decisionLog, 'Date Difference (days): ' + attachmentResult.dateDifference);
                }
                addToDecisionLog(decisionLog, repeatChar('=', 80));
                
                // Save the log file if in single record mode
                saveDecisionLogFile(accessorySale, decisionLog);
            }
            
            // Pass to reduce stage for updating
            if (attachmentResult.attachmentTypeId) {
                context.write({
                    key: accessorySale.internalId,
                    value: {
                        internalId: accessorySale.internalId,
                        recordType: determineRecordType(accessorySale.transactionType),
                        docNumber: accessorySale.docNumber,
                        customerName: accessorySale.customerName,
                        attachmentType: attachmentResult.attachmentType,
                        attachmentTypeId: attachmentResult.attachmentTypeId,
                        dateDifference: attachmentResult.dateDifference,
                        singleRecordMode: singleRecordMode
                    }
                });
            }
            
        } catch (e) {
            log.error('Map Error', 'Error processing record: ' + e.toString());
        }
    }
    
    /**
     * Initialize the decision log
     */
    function initializeDecisionLog(accessorySale) {
        var decisionLog = [];
        addToDecisionLog(decisionLog, repeatChar('=', 80));
        addToDecisionLog(decisionLog, 'ACCESSORY ATTACHMENT TYPE DECISION LOG');
        addToDecisionLog(decisionLog, 'Generated: ' + new Date().toISOString());
        addToDecisionLog(decisionLog, repeatChar('=', 80));
        addToDecisionLog(decisionLog, '');
        addToDecisionLog(decisionLog, 'ACCESSORY SALE DETAILS:');
        addToDecisionLog(decisionLog, repeatChar('-', 40));
        addToDecisionLog(decisionLog, 'Internal ID: ' + accessorySale.internalId);
        addToDecisionLog(decisionLog, 'Document Number: ' + accessorySale.docNumber);
        addToDecisionLog(decisionLog, 'Customer Name: ' + accessorySale.customerName);
        addToDecisionLog(decisionLog, 'Customer ID: ' + accessorySale.customerId);
        addToDecisionLog(decisionLog, 'Order Date: ' + accessorySale.orderDate);
        addToDecisionLog(decisionLog, 'Ship Date: ' + accessorySale.shipDate);
        addToDecisionLog(decisionLog, 'Transaction Type: ' + accessorySale.transactionType);
        addToDecisionLog(decisionLog, '');
        addToDecisionLog(decisionLog, 'DECISION PROCESS:');
        addToDecisionLog(decisionLog, repeatChar('-', 40));
        return decisionLog;
    }
    
    /**
     * Add a line to the decision log
     */
    function addToDecisionLog(decisionLog, message) {
        if (decisionLog && Array.isArray(decisionLog)) {
            decisionLog.push(message);
            log.debug('Decision Log', message);
        }
    }
    
    /**
     * Save the decision log to a file
     */
    function saveDecisionLogFile(accessorySale, decisionLog) {
        try {
            if (!decisionLog || decisionLog.length === 0) return;
            
            // Create filename with timestamp and doc number
            var timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
            var docNum = (accessorySale.docNumber || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
            var fileName = 'attachment_type_decision_' + docNum + '_' + timestamp + '.txt';
            
            // Create the file
            var logFile = file.create({
                name: fileName,
                fileType: file.Type.PLAINTEXT,
                contents: decisionLog.join('\n'),
                folder: LOG_FOLDER_ID,
                description: 'Attachment Type Decision Log for ' + accessorySale.docNumber
            });
            
            // Save the file
            var fileId = logFile.save();
            
            log.audit('Decision Log Saved', 
                'File saved with ID: ' + fileId + ', Name: ' + fileName + ', Folder: ' + LOG_FOLDER_ID
            );
            
        } catch (e) {
            log.error('Save Log File Error', 'Failed to save decision log: ' + e.toString());
        }
    }
    
    /**
     * Determine the attachment type with detailed logging
     */
    function determineAttachmentTypeWithLogging(accessorySale, singleRecordMode, decisionLog) {
        var result = {
            attachmentType: '',
            attachmentTypeId: null,
            dateDifference: null,
            decisionLog: decisionLog || []
        };
        
        // Step 1: Try to match by Document Number
        if (singleRecordMode) {
            addToDecisionLog(result.decisionLog, '');
            addToDecisionLog(result.decisionLog, 'STEP 1: Document Number Matching');
            addToDecisionLog(result.decisionLog, 'Searching for unit sale with document number: ' + accessorySale.docNumber);
        }
        
        var unitSaleByDoc = findUnitSaleByDocNumberWithLogging(accessorySale.docNumber, singleRecordMode, result.decisionLog);
        
        if (unitSaleByDoc) {
            result.attachmentType = 'Attached';
            result.attachmentTypeId = 1;
            if (singleRecordMode) {
                addToDecisionLog(result.decisionLog, '✓ MATCH FOUND by document number');
                addToDecisionLog(result.decisionLog, 'Unit Sale Date: ' + unitSaleByDoc.orderDate);
                addToDecisionLog(result.decisionLog, 'Unit Sale Customer: ' + unitSaleByDoc.customer);
                addToDecisionLog(result.decisionLog, 'RESULT: Setting type to "Attached" (ID: 1)');
            }
            return result;
        } else {
            if (singleRecordMode) {
                addToDecisionLog(result.decisionLog, '✗ No match found by document number');
            }
        }
        
        // Step 2: Try to match by Customer Name/ID
        if (singleRecordMode) {
            addToDecisionLog(result.decisionLog, '');
            addToDecisionLog(result.decisionLog, 'STEP 2: Customer Matching');
            addToDecisionLog(result.decisionLog, 'Searching for unit sales by customer...');
            addToDecisionLog(result.decisionLog, 'Customer ID: ' + accessorySale.customerId);
            addToDecisionLog(result.decisionLog, 'Customer Name: ' + accessorySale.customerName);
        }
        
        var unitSalesByCustomer = findUnitSalesByCustomerWithLogging(
            accessorySale.customerId, 
            accessorySale.customerName,
            singleRecordMode,
            result.decisionLog
        );
        
        if (unitSalesByCustomer && unitSalesByCustomer.length > 0) {
            if (singleRecordMode) {
                addToDecisionLog(result.decisionLog, '✓ Found ' + unitSalesByCustomer.length + ' unit sale(s) for this customer');
                
                // Log all found unit sales
                unitSalesByCustomer.forEach(function(sale, index) {
                    addToDecisionLog(result.decisionLog, '  Unit Sale ' + (index + 1) + ':');
                    addToDecisionLog(result.decisionLog, '    - Doc Number: ' + sale.docNumber);
                    addToDecisionLog(result.decisionLog, '    - Order Date: ' + sale.orderDate);
                });
                
                addToDecisionLog(result.decisionLog, '');
                addToDecisionLog(result.decisionLog, 'STEP 3: Date Matching');
                addToDecisionLog(result.decisionLog, 'Finding closest date match to accessory order date: ' + accessorySale.orderDate);
            }
            
            // Find the closest date match
            var closestMatch = findClosestDateMatchWithLogging(
                accessorySale.orderDate, 
                unitSalesByCustomer,
                singleRecordMode,
                result.decisionLog
            );
            
            if (closestMatch) {
                var daysDiff = calculateDaysDifference(
                    accessorySale.orderDate,
                    closestMatch.orderDate
                );
                
                result.dateDifference = daysDiff;
                
                if (singleRecordMode) {
                    addToDecisionLog(result.decisionLog, 'Closest match found:');
                    addToDecisionLog(result.decisionLog, '  - Doc Number: ' + closestMatch.docNumber);
                    addToDecisionLog(result.decisionLog, '  - Order Date: ' + closestMatch.orderDate);
                    addToDecisionLog(result.decisionLog, '  - Days Difference: ' + daysDiff);
                    addToDecisionLog(result.decisionLog, '');
                    addToDecisionLog(result.decisionLog, 'STEP 4: Attachment Type Determination');
                }
                
                if (daysDiff === 0) {
                    result.attachmentType = 'PP Same Day';
                    result.attachmentTypeId = 2;
                    if (singleRecordMode) {
                        addToDecisionLog(result.decisionLog, 'Days difference = 0');
                        addToDecisionLog(result.decisionLog, 'RESULT: Setting type to "PP Same Day" (ID: 2)');
                    }
                } else if (daysDiff > 0 && daysDiff <= 365) {
                    result.attachmentType = 'Post Purchase';
                    result.attachmentTypeId = 3;
                    if (singleRecordMode) {
                        addToDecisionLog(result.decisionLog, 'Days difference between 1 and 365');
                        addToDecisionLog(result.decisionLog, 'RESULT: Setting type to "Post Purchase" (ID: 3)');
                    }
                } else {
                    result.attachmentType = '3rd Party';
                    result.attachmentTypeId = 4;
                    if (singleRecordMode) {
                        addToDecisionLog(result.decisionLog, 'Days difference > 365');
                        addToDecisionLog(result.decisionLog, 'RESULT: Setting type to "3rd Party" (ID: 4)');
                    }
                }
            } else {
                result.attachmentType = '3rd Party';
                result.attachmentTypeId = 4;
                if (singleRecordMode) {
                    addToDecisionLog(result.decisionLog, 'No valid date match found');
                    addToDecisionLog(result.decisionLog, 'RESULT: Setting type to "3rd Party" (ID: 4)');
                }
            }
        } else {
            // No match found
            result.attachmentType = '3rd Party';
            result.attachmentTypeId = 4;
            if (singleRecordMode) {
                addToDecisionLog(result.decisionLog, '✗ No unit sales found for this customer');
                addToDecisionLog(result.decisionLog, 'RESULT: Setting type to "3rd Party" (ID: 4)');
            }
        }
        
        return result;
    }
    
    /**
     * Find unit sale by document number with logging
     * FIXED: Now searches at line level for items with class = 1
     */
    function findUnitSaleByDocNumberWithLogging(docNumber, singleRecordMode, decisionLog) {
        if (!docNumber) {
            if (singleRecordMode) {
                addToDecisionLog(decisionLog, '  - No document number provided');
            }
            return null;
        }
        
        if (singleRecordMode) {
            addToDecisionLog(decisionLog, '  - Creating search for document number: ' + docNumber);
            addToDecisionLog(decisionLog, '  - Looking for transactions with items of class = 1');
        }
        
        // FIXED: Search for transactions that have line items with class = 1
        // This uses a summary search to find transactions with qualifying items
        var unitSalesSearch = search.create({
            type: 'transaction',
            filters: [
                ['tranid', 'is', docNumber],
                'AND',
                ['mainline', 'is', 'F'], // Look at line level
                'AND',
                ['item.class', 'anyof', '1'], // Items with class = 1
                'AND',
                ['taxline', 'is', 'F'], // Exclude tax lines
                'AND',
                ['shipping', 'is', 'F'] // Exclude shipping lines
            ],
            columns: [
                search.createColumn({
                    name: 'trandate',
                    summary: 'GROUP'
                }),
                search.createColumn({
                    name: 'tranid',
                    summary: 'GROUP'
                }),
                search.createColumn({
                    name: 'entity',
                    summary: 'GROUP'
                })
            ]
        });
        
        var result = null;
        var searchCount = 0;
        
        unitSalesSearch.run().each(function(searchResult) {
            searchCount++;
            result = {
                orderDate: searchResult.getValue({name: 'trandate', summary: 'GROUP'}),
                docNumber: searchResult.getValue({name: 'tranid', summary: 'GROUP'}),
                customer: searchResult.getText({name: 'entity', summary: 'GROUP'})
            };
            return false; // Stop after first match
        });
        
        if (singleRecordMode) {
            addToDecisionLog(decisionLog, '  - Search executed, found ' + searchCount + ' result(s)');
            if (searchCount > 0) {
                addToDecisionLog(decisionLog, '  - Transaction contains items with class = 1 (Unit Sale)');
            }
        }
        
        return result;
    }
    
    /**
     * Find unit sales by customer with logging
     * FIXED: Now searches at line level for items with class = 1
     */
    function findUnitSalesByCustomerWithLogging(customerId, customerName, singleRecordMode, decisionLog) {
        if (!customerId && !customerName) {
            if (singleRecordMode) {
                addToDecisionLog(decisionLog, '  - No customer ID or name provided');
            }
            return [];
        }
        
        // FIXED: Search at line level for items with class = 1, then group by transaction
        var filters = [
            ['mainline', 'is', 'F'], // Look at line level
            'AND',
            ['item.class', 'anyof', '1'], // Items with class = 1
            'AND',
            ['taxline', 'is', 'F'], // Exclude tax lines
            'AND',
            ['shipping', 'is', 'F'] // Exclude shipping lines
        ];
        
        if (customerId) {
            filters.push('AND');
            filters.push(['entity', 'anyof', customerId]);
            if (singleRecordMode) {
                addToDecisionLog(decisionLog, '  - Searching by customer ID: ' + customerId);
                addToDecisionLog(decisionLog, '  - Looking for transactions with items of class = 1');
            }
        } else {
            filters.push('AND');
            filters.push(['entity', 'is', customerName]);
            if (singleRecordMode) {
                addToDecisionLog(decisionLog, '  - Searching by customer name: ' + customerName);
                addToDecisionLog(decisionLog, '  - Looking for transactions with items of class = 1');
            }
        }
        
        var unitSalesSearch = search.create({
            type: 'transaction',
            filters: filters,
            columns: [
                search.createColumn({
                    name: 'trandate',
                    summary: 'GROUP',
                    sort: search.Sort.DESC
                }),
                search.createColumn({
                    name: 'tranid',
                    summary: 'GROUP'
                }),
                search.createColumn({
                    name: 'entity',
                    summary: 'GROUP'
                })
            ]
        });
        
        var results = [];
        unitSalesSearch.run().each(function(searchResult) {
            results.push({
                orderDate: searchResult.getValue({name: 'trandate', summary: 'GROUP'}),
                docNumber: searchResult.getValue({name: 'tranid', summary: 'GROUP'}),
                customer: searchResult.getText({name: 'entity', summary: 'GROUP'})
            });
            return true; // Continue to get all matches
        });
        
        if (singleRecordMode) {
            addToDecisionLog(decisionLog, '  - Search executed, found ' + results.length + ' unit sale(s)');
        }
        
        return results;
    }
    
    /**
     * Find the closest date match with logging
     */
    function findClosestDateMatchWithLogging(accessoryDate, unitSales, singleRecordMode, decisionLog) {
        if (!accessoryDate || unitSales.length === 0) {
            if (singleRecordMode) {
                addToDecisionLog(decisionLog, '  - Cannot find closest match: missing date or no unit sales');
            }
            return null;
        }
        
        var accDate = new Date(accessoryDate);
        var closestMatch = null;
        var minDiff = Infinity;
        
        if (singleRecordMode) {
            addToDecisionLog(decisionLog, '  - Comparing dates to find closest match:');
        }
        
        unitSales.forEach(function(unitSale, index) {
            var unitDate = new Date(unitSale.orderDate);
            var diff = Math.abs(accDate - unitDate);
            var daysDiff = Math.ceil(diff / (1000 * 60 * 60 * 24));
            
            if (singleRecordMode) {
                addToDecisionLog(decisionLog, '    Sale ' + (index + 1) + ': ' + unitSale.orderDate + ' (' + daysDiff + ' days difference)');
            }
            
            if (diff < minDiff) {
                minDiff = diff;
                closestMatch = unitSale;
            }
        });
        
        if (closestMatch && singleRecordMode) {
            var finalDaysDiff = Math.ceil(minDiff / (1000 * 60 * 60 * 24));
            addToDecisionLog(decisionLog, '  - Closest match selected: ' + closestMatch.orderDate + ' (' + finalDaysDiff + ' days)');
        }
        
        return closestMatch;
    }
    
    /**
     * Determine the attachment type for an accessory sale (non-logging version for regular processing)
     */
    function determineAttachmentType(accessorySale) {
        return determineAttachmentTypeWithLogging(accessorySale, false, []);
    }
    
    /**
     * Find unit sale by document number (non-logging version)
     */
    function findUnitSaleByDocNumber(docNumber) {
        return findUnitSaleByDocNumberWithLogging(docNumber, false, []);
    }
    
    /**
     * Find unit sales by customer (non-logging version)
     */
    function findUnitSalesByCustomer(customerId, customerName) {
        return findUnitSalesByCustomerWithLogging(customerId, customerName, false, []);
    }
    
    /**
     * Find the closest date match (non-logging version)
     */
    function findClosestDateMatch(accessoryDate, unitSales) {
        return findClosestDateMatchWithLogging(accessoryDate, unitSales, false, []);
    }
    
    /**
     * Calculate difference in days between two dates
     */
    function calculateDaysDifference(date1, date2) {
        if (!date1 || !date2) return null;
        
        var d1 = new Date(date1);
        var d2 = new Date(date2);
        var diffTime = Math.abs(d1 - d2);
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }
    
    /**
     * Determine NetSuite record type from transaction type
     */
    function determineRecordType(transactionType) {
        switch(transactionType) {
            case 'SalesOrd':
                return record.Type.SALES_ORDER;
            case 'RtnAuth':
                return record.Type.RETURN_AUTHORIZATION;
            case 'CashSale':
                return record.Type.CASH_SALE;
            case 'Invoice':
                return record.Type.INVOICE;
            case 'CustInvc':
                return record.Type.INVOICE;
            default:
                return record.Type.SALES_ORDER;
        }
    }

    /**
     * Reduce Stage - Update records with attachment type
     * @param {ReduceContext} context
     */
    function reduce(context) {
        try {
            // Parse the record data (take first value if multiple)
            var recordData = JSON.parse(context.values[0]);
            
            log.debug('Updating Record', 
                'ID: ' + recordData.internalId + 
                ', Type: ' + recordData.attachmentType +
                ', TypeID: ' + recordData.attachmentTypeId +
                ', Doc: ' + recordData.docNumber
            );
            
            // Skip if no attachment type ID
            if (!recordData.attachmentTypeId) {
                log.error('Reduce Skip', 'No attachment type ID for record ' + recordData.internalId);
                context.write({
                    key: 'error',
                    value: JSON.stringify({
                        id: recordData.internalId,
                        error: 'No attachment type ID determined'
                    })
                });
                return;
            }
            
            // Update the transaction record
            var updateResult = record.submitFields({
                type: recordData.recordType,
                id: recordData.internalId,
                values: {
                    'custbody_attachment_type': recordData.attachmentTypeId
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
            
            log.audit('Record Updated Successfully', 
                'ID: ' + recordData.internalId + 
                ' updated to ' + recordData.attachmentType + 
                ' (ID: ' + recordData.attachmentTypeId + ')'
            );
            
            // Write success to context
            context.write({
                key: 'updated',
                value: JSON.stringify({
                    id: recordData.internalId,
                    type: recordData.attachmentType,
                    docNumber: recordData.docNumber,
                    singleRecordMode: recordData.singleRecordMode
                })
            });
            
        } catch (e) {
            var errorMsg = 'Failed to update record ' + context.key + ': ' + e.toString();
            log.error('Reduce Error', errorMsg);
            
            // Write error to context
            context.write({
                key: 'error',
                value: JSON.stringify({
                    id: context.key,
                    error: e.toString()
                })
            });
        }
    }

    /**
     * Summary Stage - Log results and send notification
     * @param {SummaryContext} summary
     */
    function summarize(summary) {
        var totalRecords = 0;
        var updatedRecords = 0;
        var errorRecords = 0;
        var wasSingleRecordMode = false;
        var attachmentTypes = {
            attached: 0,
            ppSameDay: 0,
            postPurchase: 0,
            thirdParty: 0
        };
        
        // Count input records from the InputSummary
        try {
            var inputSummary = summary.inputSummary;
            totalRecords = inputSummary.recordCount || 0;
            
            // Log input errors if any
            if (inputSummary.error) {
                log.error('Input Stage Error', inputSummary.error);
            }
        } catch (e) {
            log.error('Input Summary Error', e.toString());
        }
        
        // Process output records
        summary.output.iterator().each(function(key, value) {
            var data = JSON.parse(value);
            
            if (key === 'updated') {
                updatedRecords++;
                if (data.singleRecordMode) {
                    wasSingleRecordMode = true;
                }
                // Track attachment types
                switch(data.type) {
                    case 'Attached':
                        attachmentTypes.attached++;
                        break;
                    case 'PP Same Day':
                        attachmentTypes.ppSameDay++;
                        break;
                    case 'Post Purchase':
                        attachmentTypes.postPurchase++;
                        break;
                    case '3rd Party':
                        attachmentTypes.thirdParty++;
                        break;
                }
            } else if (key === 'error') {
                errorRecords++;
            }
            return true;
        });
        
        // Log any errors that occurred in Map stage
        summary.mapSummary.errors.iterator().each(function(key, error) {
            log.error('Map Error Summary', 'Key: ' + key + ', Error: ' + error);
            errorRecords++;
            return true;
        });
        
        // Log any errors that occurred in Reduce stage
        summary.reduceSummary.errors.iterator().each(function(key, error) {
            log.error('Reduce Error Summary', 'Key: ' + key + ', Error: ' + error);
            errorRecords++;
            return true;
        });
        
        // Calculate processing statistics
        var processingStats = {
            totalProcessed: totalRecords,
            successfulUpdates: updatedRecords,
            errors: errorRecords,
            duration: summary.seconds + ' seconds',
            governance: summary.usage + ' units',
            yields: summary.yields,
            attachmentBreakdown: attachmentTypes,
            singleRecordMode: wasSingleRecordMode
        };
        
        // Log summary statistics
        log.audit('Process Complete', JSON.stringify(processingStats, null, 2));
        
        // Log detailed breakdown
        var summaryMessage = 'Attachment Type Breakdown:\n' +
            'Attached: ' + attachmentTypes.attached + '\n' +
            'PP Same Day: ' + attachmentTypes.ppSameDay + '\n' +
            'Post Purchase: ' + attachmentTypes.postPurchase + '\n' +
            '3rd Party: ' + attachmentTypes.thirdParty;
        
        if (wasSingleRecordMode) {
            summaryMessage += '\n\nNote: Detailed decision log was created in folder ' + LOG_FOLDER_ID;
        }
        
        log.audit('Summary', summaryMessage);
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});