/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleName VendorBillIntercompanyAutomation
 * @description Automatically creates intercompany vendor bills and invoices for "Due From" transactions
 *
 * WORKFLOW:
 * 1. Detects vendor bills with "Due From" expense lines
 * 2. Processes EACH "Due From" line found
 * 3. Maps representing customer to subsidiary
 * 4. Creates new VENDOR BILL in mapped subsidiary (per line)
 * 5. Creates new INVOICE to representing customer (per line)
 * 6. Links all transactions to original bill
 *
 * TRIGGER CONDITIONS:
 * - Event: CREATE (not EDIT)
 * - One or more expense lines with "Due From" in account name
 * - Each expense line has customer assigned
 * - custbody_due_from_expense field has value
 * - Customer maps to valid subsidiary
 * - Customer maps to valid "Due From" item
 *
 * @author Claude Code
 * @created 2025-10-17
 */

define(['N/record', 'N/search', 'N/log', 'N/runtime'],
    /**
     * @param {record} record
     * @param {search} search
     * @param {log} log
     * @param {runtime} runtime
     */
    function(record, search, log, runtime) {

        // ========================================
        // MAPPING TABLES
        // ========================================

        /**
         * SUBSIDIARY MAPPING
         * Maps representing customer names to subsidiary internal IDs
         * Source: docs/testing/Subsidiaries737.csv
         */
        const SUBSIDIARY_MAP = {
            // Main Entities
            'IC-Planks and Pilings': 1,
            'IC-PAT GP LLC': 4,
            'IC-Pier Active Transactions LLC': 6,
            'IC-Pier Asset Management': 3,
            'IC-PSOF GP LLC': 2,
            'IC-PSOF LP': 8,
            'IC-PLFF GP LLC': 48,
            'IC-PLFF I LP': 49,
            'IC-PMRF GP LLC': 72,
            'IC-PMRF LP': 74,
            'IC-PMRF': 74, // Alias
            'IC-Plumeria 51': 51,
            'IC-Plumeria': 51, // Alias

            // Series 001-024
            'IC-Series 006': 18,
            'IC-Series 007': 19,
            'IC-Series 008': 20,
            'IC-Series 011': 24,
            'IC-Series 012': 25,
            'IC-Series 013': 26,
            'IC-Series 014': 27,
            'IC-Series 015': 28,
            'IC-Series 016': 29,
            'IC-Series 017': 31,
            'IC-Series 018': 32,
            'IC-Series 019': 33,
            'IC-Series 020': 34,
            'IC-Series 021': 35,
            'IC-Series 022': 36,
            'IC-Series 023': 37,
            'IC-Series 024': 38,

            // Series 026-037
            'IC-Series 026': 40,
            'IC-Series 027': 41,
            'IC-Series 028': 42,
            'IC-Series 029': 43,
            'IC-Series 030': 44,
            'IC-Series 031': 45,
            'IC-Series 032': 59,
            'IC-Series 033': 60,
            'IC-Series 034': 61,
            'IC-Series 035 62': 62,
            'IC-Series 036': 64,
            'IC-Series 037': 65,

            // Series 038-052
            'IC-Series 038 63': 63,
            'IC-Series 039': 66,
            'IC-Series 039 66': 66,
            'IC-Series 040 70': 70,
            'IC-Series 041 71': 71,
            'IC-Series 042': 77,
            'IC-Series 043': 78,
            'IC-Series 044': 79,
            'IC-Series 045': 81,
            'IC-Series 046': 80,
            'IC-Series 047': 86,
            'IC-Series 047 86': 86,
            'IC-Series 048 84': 84,
            'IC-Series 049': 85,
            'IC-Series 050': 87,
            'IC-Series 050 87': 87,
            'IC-Series 051': 88,
            'IC-Series 051 88': 88,
            'IC-Series 052': 89
        };

        /**
         * DUE FROM ITEM MAPPING
         * Maps representing customer names to "Due From" item internal IDs
         * Source: docs/testing/ItemSearch_WithCustomerIDs_Final.csv
         */
        const DUE_FROM_ITEM_MAP = {
            'IC-PSOF LP': 167,                          // Due from PSOF
            'IC-Plumeria': 169,                         // Due from Plumeria
            'IC-Plumeria 51': 169,                      // Alias
            'IC-Pier Active Transactions LLC': 170,     // Due from PAT
            'IC-PMRF': 172,                             // Due from PMRF
            'IC-PMRF LP': 172,                          // Alias
            'IC-PLFF I LP': 174,                        // Due from PLFF
            'IC-Series 006': 175,                       // Due from PAT Series 06
            'IC-Series 011': 176,                       // Due from PAT Series 11
            'IC-Series 013': 179,                       // Due from PAT Series 13
            'IC-Series 018': 180,                       // Due from PAT Series 18
            'IC-Series 019': 181,                       // Due from PAT Series 19
            'IC-Series 020': 182,                       // Due from PAT Series 20
            'IC-Series 042': 183                        // Due from PAT Series 42
        };

        // ========================================
        // MAIN ENTRY POINT
        // ========================================

        /**
         * afterSubmit - Triggered after vendor bill is created
         * @param {Object} context
         */
        function afterSubmit(context) {
            // Only trigger on CREATE (not EDIT to avoid duplicates)
            if (context.type !== context.UserEventType.CREATE) {
                log.debug({
                    title: 'Script Skipped',
                    details: 'Not a CREATE event - type: ' + context.type
                });
                return;
            }

            try {
                const newRecordId = context.newRecord.id;

                log.audit({
                    title: 'Script Started',
                    details: 'Processing vendor bill: ' + newRecordId
                });

                // Load the vendor bill
                const vendorBill = record.load({
                    type: record.Type.VENDOR_BILL,
                    id: newRecordId,
                    isDynamic: false
                });

                // Find "Due From" expense lines
                const dueFromLines = findDueFromExpenseLines(vendorBill);

                // Validate at least ONE "Due From" line exists
                if (dueFromLines.length === 0) {
                    log.debug({
                        title: 'No Action Required',
                        details: 'No "Due From" expense lines found'
                    });
                    return;
                }

                log.audit({
                    title: 'Due From Lines Found',
                    details: 'Found ' + dueFromLines.length + ' "Due From" line(s). Processing each line...'
                });

                // Get common data from original bill (same for all lines)
                const originalSubsidiary = vendorBill.getValue({ fieldId: 'subsidiary' });
                const mainlineMemo = vendorBill.getValue({ fieldId: 'memo' }) || '';
                const trandate = vendorBill.getValue({ fieldId: 'trandate' });
                const currency = vendorBill.getValue({ fieldId: 'currency' });
                const referenceNo = vendorBill.getValue({ fieldId: 'tranid' }) || '';
                const allocationStatus = vendorBill.getValue({ fieldId: 'custbody3' }) || '';

                // Get custbody_due_from_expense (expense account for new bills)
                const targetExpenseAccount = vendorBill.getValue({
                    fieldId: 'custbody_due_from_expense'
                });

                if (!targetExpenseAccount) {
                    log.error({
                        title: 'Validation Failed - Missing Field',
                        details: 'custbody_due_from_expense field is empty. Cannot create intercompany bills.'
                    });
                    return;
                }

                // Find vendor once (same for all lines)
                log.audit({
                    title: 'Finding Vendor for Original Subsidiary',
                    details: 'Searching for vendor with representingsubsidiary = ' + originalSubsidiary
                });

                const targetVendorId = findVendorForSubsidiary(originalSubsidiary);

                if (!targetVendorId) {
                    log.error({
                        title: 'Vendor Not Found',
                        details: 'No vendor found with representingsubsidiary = ' + originalSubsidiary + '. Cannot create intercompany bills.'
                    });
                    return;
                }

                log.debug({
                    title: 'Vendor Found',
                    details: 'Using vendor ID: ' + targetVendorId + ' for all lines'
                });

                // Collect all created transaction IDs
                const allTransactionIds = [];
                let successCount = 0;
                let errorCount = 0;

                // Process each "Due From" line
                for (let idx = 0; idx < dueFromLines.length; idx++) {
                    const dueFromLine = dueFromLines[idx];
                    const lineNumber = idx + 1;

                    log.audit({
                        title: 'Processing Line ' + lineNumber + ' of ' + dueFromLines.length,
                        details: 'Expense line ' + dueFromLine.line + ': Customer=' + dueFromLine.customer + ', Amount=' + dueFromLine.amount
                    });

                    try {
                        // Process this line
                        const result = processDueFromLine({
                            dueFromLine: dueFromLine,
                            lineNumber: lineNumber,
                            totalLines: dueFromLines.length,
                            originalSubsidiary: originalSubsidiary,
                            targetVendorId: targetVendorId,
                            targetExpenseAccount: targetExpenseAccount,
                            mainlineMemo: mainlineMemo,
                            trandate: trandate,
                            currency: currency,
                            referenceNo: referenceNo,
                            allocationStatus: allocationStatus
                        });

                        if (result.success) {
                            if (result.billId) allTransactionIds.push(result.billId);
                            if (result.invoiceId) allTransactionIds.push(result.invoiceId);
                            successCount++;

                            log.audit({
                                title: 'Line ' + lineNumber + ' - Success',
                                details: 'Bill ID: ' + result.billId + ', Invoice ID: ' + result.invoiceId
                            });
                        } else {
                            errorCount++;
                            log.error({
                                title: 'Line ' + lineNumber + ' - Failed',
                                details: result.error || 'Unknown error'
                            });
                        }

                    } catch (e) {
                        errorCount++;
                        log.error({
                            title: 'Line ' + lineNumber + ' - Exception',
                            details: 'Error: ' + e.toString()
                        });
                    }
                }

                // Update original bill with links to all transactions
                if (allTransactionIds.length > 0) {
                    updateOriginalBillWithLinks(newRecordId, allTransactionIds);
                }

                log.audit({
                    title: 'Intercompany Automation Complete',
                    details: 'Original Bill: ' + newRecordId +
                             ' | Processed: ' + dueFromLines.length + ' lines' +
                             ' | Success: ' + successCount +
                             ' | Errors: ' + errorCount +
                             ' | Created: ' + allTransactionIds.length + ' transactions'
                });

            } catch (e) {
                log.error({
                    title: 'Script Execution Error',
                    details: 'Error: ' + e.toString() + '\nStack: ' + (e.stack || 'No stack trace')
                });
                // Don't throw - allow original transaction to complete
            }
        }

        // ========================================
        // LINE PROCESSING FUNCTION
        // ========================================

        /**
         * Process a single "Due From" line
         * @param {Object} params
         * @returns {Object} Result object with success flag and transaction IDs
         */
        function processDueFromLine(params) {
            const result = {
                success: false,
                billId: null,
                invoiceId: null,
                error: null
            };

            try {
                const dueFromLine = params.dueFromLine;

                // Get customer from expense line
                const customerId = dueFromLine.customer;
                if (!customerId) {
                    result.error = 'No customer assigned to line ' + dueFromLine.line;
                    return result;
                }

                // Get customer name
                const customerName = getCustomerName(customerId);
                if (!customerName) {
                    result.error = 'Could not retrieve customer name for ID: ' + customerId;
                    return result;
                }

                log.debug({
                    title: 'Line ' + params.lineNumber + ' - Customer Identified',
                    details: 'Customer: ' + customerName + ' (ID: ' + customerId + ')'
                });

                // Map customer to subsidiary
                const subsidiaryId = getSubsidiaryByCustomer(customerName);
                if (!subsidiaryId) {
                    result.error = 'No subsidiary mapping found for customer: ' + customerName;
                    return result;
                }

                log.debug({
                    title: 'Line ' + params.lineNumber + ' - Subsidiary Mapped',
                    details: 'Customer "' + customerName + '" → Subsidiary ID: ' + subsidiaryId
                });

                // Map customer to "Due From" item
                const dueFromItemId = getItemByCustomer(customerName);
                if (!dueFromItemId) {
                    result.error = 'No "Due From" item mapping found for customer: ' + customerName;
                    return result;
                }

                log.debug({
                    title: 'Line ' + params.lineNumber + ' - Item Mapped',
                    details: 'Customer "' + customerName + '" → Item ID: ' + dueFromItemId
                });

                // Create intercompany VENDOR BILL
                log.audit({
                    title: 'Line ' + params.lineNumber + ' - Creating Vendor Bill',
                    details: 'Vendor: ' + params.targetVendorId + ', Subsidiary: ' + subsidiaryId + ', Amount: ' + dueFromLine.amount
                });

                const newBillId = createIntercompanyBill({
                    vendor: params.targetVendorId,
                    subsidiary: subsidiaryId,
                    expenseAccount: params.targetExpenseAccount,
                    amount: dueFromLine.amount,
                    mainlineMemo: params.mainlineMemo,
                    expenseLineMemo: dueFromLine.memo || '',
                    date: params.trandate,
                    currency: params.currency,
                    referenceNo: params.referenceNo,
                    allocationStatus: params.allocationStatus
                });

                if (!newBillId) {
                    result.error = 'Vendor bill creation failed';
                    return result;
                }

                result.billId = newBillId;

                log.audit({
                    title: 'Line ' + params.lineNumber + ' - Vendor Bill Created',
                    details: 'Bill ID: ' + newBillId
                });

                // Create INVOICE
                log.audit({
                    title: 'Line ' + params.lineNumber + ' - Creating Invoice',
                    details: 'Customer: ' + customerId + ', Item: ' + dueFromItemId + ', Amount: ' + dueFromLine.amount
                });

                const newInvoiceId = createIntercompanyInvoice({
                    customer: customerId,
                    subsidiary: params.originalSubsidiary,
                    item: dueFromItemId,
                    amount: dueFromLine.amount,
                    mainlineMemo: params.mainlineMemo,
                    itemLineMemo: dueFromLine.memo || '',
                    date: params.trandate,
                    currency: params.currency
                });

                if (!newInvoiceId) {
                    result.error = 'Invoice creation failed (bill created successfully)';
                    result.success = true; // Partial success
                    return result;
                }

                result.invoiceId = newInvoiceId;
                result.success = true;

                log.audit({
                    title: 'Line ' + params.lineNumber + ' - Invoice Created',
                    details: 'Invoice ID: ' + newInvoiceId
                });

                return result;

            } catch (e) {
                result.error = e.toString();
                log.error({
                    title: 'Line ' + params.lineNumber + ' - Processing Error',
                    details: 'Error: ' + e.toString() + '\nStack: ' + (e.stack || 'No stack trace')
                });
                return result;
            }
        }

        // ========================================
        // MAPPING FUNCTIONS
        // ========================================

        /**
         * Get subsidiary internal ID by customer name
         * @param {string} customerName
         * @returns {number|null}
         */
        function getSubsidiaryByCustomer(customerName) {
            if (!customerName) return null;
            return SUBSIDIARY_MAP[customerName.trim()] || null;
        }

        /**
         * Get "Due From" item internal ID by customer name
         * @param {string} customerName
         * @returns {number|null}
         */
        function getItemByCustomer(customerName) {
            if (!customerName) return null;
            return DUE_FROM_ITEM_MAP[customerName.trim()] || null;
        }

        // ========================================
        // HELPER FUNCTIONS
        // ========================================

        /**
         * Find all expense lines with "Due From" in account name
         * @param {Record} vendorBill
         * @returns {Array}
         */
        function findDueFromExpenseLines(vendorBill) {
            const dueFromLines = [];
            const lineCount = vendorBill.getLineCount({ sublistId: 'expense' });

            log.debug({
                title: 'Scanning Expense Lines',
                details: 'Total expense lines: ' + lineCount
            });

            for (let i = 0; i < lineCount; i++) {
                const accountId = vendorBill.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'account',
                    line: i
                });

                // Get account name
                const accountName = getAccountName(accountId);

                // Check if contains "Due From" (case-insensitive)
                if (accountName && accountName.toLowerCase().includes('due from')) {
                    const customer = vendorBill.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'customer',
                        line: i
                    });

                    const amount = vendorBill.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'amount',
                        line: i
                    });

                    const memo = vendorBill.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'memo',
                        line: i
                    });

                    dueFromLines.push({
                        line: i,
                        accountId: accountId,
                        accountName: accountName,
                        customer: customer,
                        amount: amount,
                        memo: memo
                    });

                    log.debug({
                        title: 'Found "Due From" Line',
                        details: 'Line ' + i + ': Account "' + accountName + '", Customer: ' + customer + ', Amount: ' + amount
                    });
                }
            }

            return dueFromLines;
        }

        /**
         * Get account name from account ID
         * @param {number} accountId
         * @returns {string|null}
         */
        function getAccountName(accountId) {
            try {
                const accountLookup = search.lookupFields({
                    type: search.Type.ACCOUNT,
                    id: accountId,
                    columns: ['name']
                });
                return accountLookup.name || null;
            } catch (e) {
                log.error({
                    title: 'Error Getting Account Name',
                    details: 'Account ID: ' + accountId + ', Error: ' + e.toString()
                });
                return null;
            }
        }

        /**
         * Get customer name from customer ID
         * @param {number} customerId
         * @returns {string|null}
         */
        function getCustomerName(customerId) {
            try {
                const customerLookup = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: customerId,
                    columns: ['companyname']
                });
                return customerLookup.companyname || null;
            } catch (e) {
                log.error({
                    title: 'Error Getting Customer Name',
                    details: 'Customer ID: ' + customerId + ', Error: ' + e.toString()
                });
                return null;
            }
        }

        /**
         * Find vendor that represents the target subsidiary
         * @param {number} subsidiaryId - Target subsidiary internal ID
         * @returns {number|null} Vendor internal ID
         */
        function findVendorForSubsidiary(subsidiaryId) {
            try {
                const vendorSearch = search.create({
                    type: search.Type.VENDOR,
                    filters: [
                        ['representingsubsidiary', 'anyof', subsidiaryId]
                    ],
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'entityid', sort: search.Sort.ASC })
                    ]
                });

                // Get first result
                const vendorSearchResults = vendorSearch.run().getRange({ start: 0, end: 1 });

                if (vendorSearchResults.length > 0) {
                    const vendorId = vendorSearchResults[0].getValue({ name: 'internalid' });
                    const vendorName = vendorSearchResults[0].getValue({ name: 'entityid' });

                    log.debug({
                        title: 'Vendor Found for Subsidiary',
                        details: 'Subsidiary ' + subsidiaryId + ' → Vendor: ' + vendorName + ' (ID: ' + vendorId + ')'
                    });

                    return parseInt(vendorId);
                } else {
                    log.error({
                        title: 'No Vendor Found',
                        details: 'No vendor found with representingsubsidiary = ' + subsidiaryId
                    });
                    return null;
                }
            } catch (e) {
                log.error({
                    title: 'Error Finding Vendor',
                    details: 'Subsidiary: ' + subsidiaryId + ', Error: ' + e.toString()
                });
                return null;
            }
        }

        // ========================================
        // RECORD CREATION FUNCTIONS
        // ========================================

        /**
         * Create intercompany vendor bill
         * @param {Object} params
         * @returns {number|null} New bill internal ID
         */
        function createIntercompanyBill(params) {
            try {
                const newBill = record.create({
                    type: record.Type.VENDOR_BILL,
                    isDynamic: true
                });

                // Set header fields
                newBill.setValue({ fieldId: 'entity', value: params.vendor });
                newBill.setValue({ fieldId: 'subsidiary', value: params.subsidiary });
                newBill.setValue({ fieldId: 'trandate', value: params.date });
                newBill.setValue({ fieldId: 'currency', value: params.currency });
                newBill.setValue({ fieldId: 'memo', value: params.mainlineMemo });

                // Set account (mainline) = 289
                newBill.setValue({ fieldId: 'account', value: 289 });

                // Copy mandatory fields from original bill
                if (params.referenceNo) {
                    newBill.setValue({ fieldId: 'tranid', value: params.referenceNo });
                }
                if (params.allocationStatus) {
                    newBill.setValue({ fieldId: 'custbody3', value: params.allocationStatus });
                }

                // Add expense line
                newBill.selectNewLine({ sublistId: 'expense' });
                newBill.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'account',
                    value: params.expenseAccount
                });
                newBill.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'amount',
                    value: params.amount
                });
                newBill.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'memo',
                    value: params.expenseLineMemo
                });
                newBill.commitLine({ sublistId: 'expense' });

                // Save and return ID
                const newBillId = newBill.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: false
                });

                log.audit({
                    title: 'Vendor Bill Saved',
                    details: 'ID: ' + newBillId + ', Subsidiary: ' + params.subsidiary + ', Amount: ' + params.amount
                });

                return newBillId;

            } catch (e) {
                log.error({
                    title: 'Error Creating Vendor Bill',
                    details: 'Error: ' + e.toString() + '\nStack: ' + (e.stack || 'No stack trace')
                });
                return null;
            }
        }

        /**
         * Create intercompany invoice
         * @param {Object} params
         * @returns {number|null} New invoice internal ID
         */
        function createIntercompanyInvoice(params) {
            try {
                const newInvoice = record.create({
                    type: record.Type.INVOICE,
                    isDynamic: true
                });

                // Set header fields
                newInvoice.setValue({ fieldId: 'entity', value: params.customer });
                newInvoice.setValue({ fieldId: 'subsidiary', value: params.subsidiary });
                newInvoice.setValue({ fieldId: 'trandate', value: params.date });
                newInvoice.setValue({ fieldId: 'currency', value: params.currency });
                newInvoice.setValue({ fieldId: 'memo', value: params.mainlineMemo });

                // Set account = 232
                newInvoice.setValue({ fieldId: 'account', value: 232 });

                // Add item line
                newInvoice.selectNewLine({ sublistId: 'item' });
                newInvoice.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: params.item
                });
                newInvoice.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    value: params.amount
                });
                newInvoice.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'memo',
                    value: params.itemLineMemo
                });
                newInvoice.commitLine({ sublistId: 'item' });

                // Save and return ID
                const newInvoiceId = newInvoice.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: false
                });

                log.audit({
                    title: 'Invoice Saved',
                    details: 'ID: ' + newInvoiceId + ', Customer: ' + params.customer + ', Amount: ' + params.amount
                });

                return newInvoiceId;

            } catch (e) {
                log.error({
                    title: 'Error Creating Invoice',
                    details: 'Error: ' + e.toString() + '\nStack: ' + (e.stack || 'No stack trace')
                });
                return null;
            }
        }

        /**
         * Update original vendor bill with links to new transactions
         * @param {number} originalBillId
         * @param {Array<number>} newTransactionIds
         */
        function updateOriginalBillWithLinks(originalBillId, newTransactionIds) {
            try {
                // Load original bill
                const originalBill = record.load({
                    type: record.Type.VENDOR_BILL,
                    id: originalBillId,
                    isDynamic: false
                });

                // Get existing values from custbody_pier_matching_ic_transactions
                const existingTransactions = originalBill.getValue({
                    fieldId: 'custbody_pier_matching_ic_transactions'
                });

                // Convert to array
                let transactionArray = [];
                if (existingTransactions) {
                    if (Array.isArray(existingTransactions)) {
                        transactionArray = existingTransactions;
                    } else {
                        transactionArray = [existingTransactions];
                    }
                }

                // Append new transaction IDs
                newTransactionIds.forEach(function(txnId) {
                    transactionArray.push(txnId);
                });

                // Set the updated array
                originalBill.setValue({
                    fieldId: 'custbody_pier_matching_ic_transactions',
                    value: transactionArray
                });

                // Save
                originalBill.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.audit({
                    title: 'Original Bill Updated',
                    details: 'Bill ' + originalBillId + ' now links to: [' + transactionArray.join(', ') + ']'
                });

            } catch (e) {
                log.error({
                    title: 'Error Updating Original Bill',
                    details: 'Bill ID: ' + originalBillId + ', Error: ' + e.toString()
                });
                // Don't throw - new transactions were created successfully
            }
        }

        // ========================================
        // RETURN PUBLIC API
        // ========================================

        return {
            afterSubmit: afterSubmit
        };
    }
);
