/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * IMPROVED VERSION with:
 * - Retry logic for API calls and vendor bill creation
 * - Better vendor matching with fuzzy logic
 * - Graceful fallbacks for missing data
 * - Enhanced error recovery
 *
 * Script Parameters (recommended to add):
 * custscript_ue_default_expense_account - Default expense account for vendor bills (List/Record - Account)
 * custscript_ue_default_item_id - Default item for vendor bills if using items (List/Record - Item)
 * custscript_ue_skip_vendor_matching - Skip vendor matching (checkbox)
 * custscript_ue_openai_api_key - OpenAI API Key (Password field recommended)
 * custscript_ue_convert_api_secret - ConvertAPI Secret (Password field recommended)
 */
define(['N/runtime', 'N/log', 'N/record', 'N/file', 'N/https', 'N/encode', 'N/search'],
function(runtime, log, record, file, https, encode, search) {

    // API Configuration
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
    const OPENAI_MODEL = 'gpt-4-turbo';
    const CONVERT_API_URL = 'https://v2.convertapi.com/convert/pdf/to/txt';

    // Retry configuration
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000; // 2 seconds between retries

    // Batching configuration
    const VENDOR_BATCH_SIZE = 400;

    /**
     * Retry function with exponential backoff
     */
    function retryOperation(operation, maxRetries, operationName) {
        maxRetries = maxRetries || MAX_RETRIES;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                return operation();
            } catch (e) {
                attempt++;
                const isLastAttempt = attempt >= maxRetries;

                log.debug('Retry Operation', {
                    operation: operationName,
                    attempt: attempt,
                    maxRetries: maxRetries,
                    error: e.toString(),
                    willRetry: !isLastAttempt
                });

                if (isLastAttempt) {
                    throw e;
                }

                // Simple delay (SuiteScript doesn't have setTimeout)
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
                const startTime = Date.now();
                while (Date.now() - startTime < delay) {
                    // Busy wait
                }
            }
        }
    }

    /**
     * Get API keys from script parameters (REQUIRED - No defaults for security)
     */
    function getAPIKeys() {
        const currentScript = runtime.getCurrentScript();

        const apiKeys = {
            openAI: currentScript.getParameter('custscript_ue_openai_api_key'),
            convertAPI: currentScript.getParameter('custscript_ue_convert_api_secret')
        };

        // Validate required API keys are configured
        if (!apiKeys.openAI) {
            throw new Error('OpenAI API Key is required. Please configure script parameter: custscript_ue_openai_api_key');
        }
        if (!apiKeys.convertAPI) {
            throw new Error('ConvertAPI Secret is required. Please configure script parameter: custscript_ue_convert_api_secret');
        }

        return apiKeys;
    }

    /**
     * Fuzzy string matching - check if two vendor names are similar
     */
    function fuzzyMatchVendor(invoiceVendor, netsuiteVendor) {
        // Normalize both strings
        const normalize = (str) => {
            return str.toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove punctuation
                .replace(/\s{2,}/g, ' ') // Multiple spaces to single
                .replace(/\b(inc|llc|ltd|corp|corporation|company|co|lp|llp)\b/g, '') // Remove suffixes
                .trim();
        };

        const norm1 = normalize(invoiceVendor);
        const norm2 = normalize(netsuiteVendor);

        // Exact match after normalization
        if (norm1 === norm2) {
            return { match: true, confidence: 1.0, method: 'exact_normalized' };
        }

        // Substring match
        if (norm1.includes(norm2) || norm2.includes(norm1)) {
            const longerLength = Math.max(norm1.length, norm2.length);
            const shorterLength = Math.min(norm1.length, norm2.length);
            const confidence = shorterLength / longerLength;

            if (confidence > 0.7) {
                return { match: true, confidence: confidence, method: 'substring' };
            }
        }

        // Word-based matching
        const words1 = norm1.split(' ').filter(w => w.length > 2);
        const words2 = norm2.split(' ').filter(w => w.length > 2);

        if (words1.length > 0 && words2.length > 0) {
            let matchingWords = 0;
            for (const word1 of words1) {
                for (const word2 of words2) {
                    if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
                        matchingWords++;
                        break;
                    }
                }
            }

            const confidence = matchingWords / Math.max(words1.length, words2.length);
            if (confidence > 0.6) {
                return { match: true, confidence: confidence, method: 'word_match' };
            }
        }

        return { match: false, confidence: 0, method: 'no_match' };
    }

    /**
     * Try to find vendor using fuzzy matching as fallback
     */
    function findVendorWithFuzzyMatch(vendorRaw, vendorData) {
        if (!vendorRaw || !vendorData || !vendorData.names) {
            return null;
        }

        log.debug('Attempting Fuzzy Vendor Match', { vendorRaw: vendorRaw });

        let bestMatch = null;
        let bestConfidence = 0;

        for (const vendorName of vendorData.names) {
            const matchResult = fuzzyMatchVendor(vendorRaw, vendorName);

            if (matchResult.match && matchResult.confidence > bestConfidence) {
                bestMatch = {
                    vendor: vendorName,
                    vendorId: vendorData.mappings[vendorName.toLowerCase()],
                    confidence: matchResult.confidence,
                    method: matchResult.method
                };
                bestConfidence = matchResult.confidence;
            }
        }

        if (bestMatch && bestConfidence > 0.7) {
            log.audit('Fuzzy Match Found', {
                invoiceVendor: vendorRaw,
                matchedVendor: bestMatch.vendor,
                confidence: bestMatch.confidence,
                method: bestMatch.method
            });
            return bestMatch;
        }

        log.debug('No Fuzzy Match Found', {
            vendorRaw: vendorRaw,
            bestConfidence: bestConfidence
        });

        return null;
    }

    /**
     * Get attachment IDs for a message
     */
    function getAttachmentIds(messageId) {
        const attachmentIds = [];
        try {
            const messageSearch = search.create({
                type: 'message',
                filters: [['internalid', 'anyof', messageId]],
                columns: [
                    search.createColumn({ name: 'internalid', join: 'attachments' }),
                    search.createColumn({ name: 'name', join: 'attachments' })
                ]
            });

            messageSearch.run().each(result => {
                const attachmentId = result.getValue({ name: 'internalid', join: 'attachments' });
                if (attachmentId) attachmentIds.push(attachmentId);
                return true;
            });
        } catch (e) {
            log.error('Error searching for attachments', e.toString());
        }
        return attachmentIds;
    }

    /**
     * Get all vendor names from NetSuite
     */
    function getAllVendorNames() {
        const vendorData = {
            names: [],
            mappings: {}
        };

        try {
            const vendorSearch = search.create({
                type: search.Type.VENDOR,
                filters: [['isinactive', 'is', 'F']],
                columns: [
                    search.createColumn({ name: 'entityid', sort: search.Sort.ASC }),
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'companyname' })
                ]
            });

            const vendorSearchPagedData = vendorSearch.runPaged({ pageSize: 1000 });

            log.audit('Vendor Search Started', {
                totalVendors: vendorSearchPagedData.count,
                pageCount: vendorSearchPagedData.pageRanges.length
            });

            for (let i = 0; i < vendorSearchPagedData.pageRanges.length; i++) {
                const vendorSearchPage = vendorSearchPagedData.fetch({ index: i });
                vendorSearchPage.data.forEach(function(result) {
                    const entityId = result.getValue('entityid');
                    const internalId = result.getValue('internalid');
                    const companyName = result.getValue('companyname') || entityId;

                    if (entityId) {
                        vendorData.names.push(companyName);
                        vendorData.mappings[companyName.toLowerCase()] = internalId;

                        // Also map by entityid if different
                        if (entityId !== companyName) {
                            vendorData.names.push(entityId);
                            vendorData.mappings[entityId.toLowerCase()] = internalId;
                        }
                    }
                });
            }

            log.audit('Vendors Found', {
                totalVendors: vendorSearchPagedData.count,
                vendorsRetrieved: vendorData.names.length
            });

        } catch (e) {
            log.error('Error retrieving vendor names', e.toString());
        }

        return vendorData;
    }

    /**
     * Convert PDF to text using Convert API (with retry)
     */
    function convertPdfToText(base64Content, filename) {
        return retryOperation(function() {
            const apiKeys = getAPIKeys();
            const payload = {
                Parameters: [
                    { Name: "File", FileValue: { Name: filename, Data: base64Content } },
                    { Name: "StoreFile", Value: true }
                ]
            };

            const response = https.post({
                url: CONVERT_API_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKeys.convertAPI,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.code !== 200) {
                throw new Error('Failed to convert PDF. Response code: ' + response.code);
            }

            const responseBody = JSON.parse(response.body);
            if (!responseBody.Files || responseBody.Files.length === 0) {
                throw new Error('ConvertAPI returned no files');
            }

            const txtFileUrl = responseBody.Files[0].Url;

            const textResponse = https.get({ url: txtFileUrl });
            if (textResponse.code !== 200) {
                throw new Error('Failed to download extracted text');
            }

            return textResponse.body;
        }, MAX_RETRIES, 'PDF Conversion');
    }

    /**
     * Extract basic invoice data without vendor matching
     */
    function extractBasicInvoiceData(pdfText) {
        const apiKeys = getAPIKeys();
        const systemPrompt = `You are an invoice data extractor. Extract ONLY these fields:

1. amount: Total amount due (number only, like "1234.56")
2. invoiceDate: Invoice date in MM/DD/YYYY format
3. poNumber: PO number or invoice number if no PO exists (never return "N/A")
4. vendorRaw: Company name from top of invoice

Return ONLY valid JSON:
{
    "amount": "1234.56",
    "invoiceDate": "MM/DD/YYYY",
    "poNumber": "PO12345",
    "vendorRaw": "Company Name"
}`;

        return retryOperation(function() {
            const payload = {
                model: OPENAI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: pdfText.substring(0, 3000) } // Limit to reduce cost
                ],
                temperature: 0.1,
                max_tokens: 500
            };

            const response = https.post({
                url: OPENAI_API_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKeys.openAI
                },
                body: JSON.stringify(payload)
            });

            if (response.code !== 200) {
                throw new Error('OpenAI API error: ' + response.code);
            }

            const responseData = JSON.parse(response.body);
            const content = responseData.choices[0].message.content;

            // Parse JSON response
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            let extractedData = JSON.parse(cleanContent);

            // Ensure required fields
            extractedData.vendor = null;
            extractedData.confidence = {
                amount: 0.8,
                invoiceDate: 0.8,
                poNumber: 0.8,
                vendor: 0
            };

            return extractedData;
        }, MAX_RETRIES, 'AI Extraction');
    }

    /**
     * Extract invoice data with vendor batch matching
     */
    function extractInvoiceDataWithVendorBatch(pdfText, vendorBatch, batchNumber, totalBatches) {
        const apiKeys = getAPIKeys();
        const vendorList = vendorBatch.slice(0, 400).join(', '); // Limit to 400 vendors

        const systemPrompt = `Extract invoice data and match vendor from this list: ${vendorList}

Extract:
1. amount (number)
2. invoiceDate (MM/DD/YYYY)
3. poNumber (or invoice number if no PO)
4. vendor (exact match from list above, or null)
5. vendorRaw (name as shown on invoice)

Use fuzzy matching - "ABC Inc" matches "ABC, Inc." or "ABC LLC"

Return JSON:
{
    "amount": "1234.56",
    "invoiceDate": "01/15/2025",
    "poNumber": "PO12345",
    "vendor": "Exact Name From List",
    "vendorRaw": "Name On Invoice",
    "batchNumber": ${batchNumber + 1}
}`;

        try {
            return retryOperation(function() {
                const payload = {
                    model: OPENAI_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: pdfText.substring(0, 3000) }
                    ],
                    temperature: 0.1,
                    max_tokens: 500
                };

                const response = https.post({
                    url: OPENAI_API_URL,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiKeys.openAI
                    },
                    body: JSON.stringify(payload)
                });

                if (response.code !== 200) {
                    throw new Error('OpenAI API error');
                }

                const responseData = JSON.parse(response.body);
                const content = responseData.choices[0].message.content;
                const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

                return JSON.parse(cleanContent);
            }, 2, 'Batch Vendor Matching'); // Fewer retries for batch processing

        } catch (e) {
            log.error('Batch Extraction Error', {
                batch: batchNumber + 1,
                error: e.toString()
            });
            return null;
        }
    }

    /**
     * Extract invoice data using smart batching
     */
    function extractInvoiceDataWithBatching(pdfText, vendorData) {
        // First get basic data
        const basicExtraction = extractBasicInvoiceData(pdfText);

        if (!basicExtraction.vendorRaw) {
            return basicExtraction;
        }

        // Try fuzzy matching first (faster, no API calls)
        const fuzzyMatch = findVendorWithFuzzyMatch(basicExtraction.vendorRaw, vendorData);
        if (fuzzyMatch) {
            basicExtraction.vendor = fuzzyMatch.vendor;
            basicExtraction.fuzzyMatchConfidence = fuzzyMatch.confidence;
            basicExtraction.matchMethod = fuzzyMatch.method;
            return basicExtraction;
        }

        // Fall back to AI batching
        const vendorBatches = [];
        for (let i = 0; i < vendorData.names.length; i += VENDOR_BATCH_SIZE) {
            vendorBatches.push(vendorData.names.slice(i, i + VENDOR_BATCH_SIZE));
        }

        log.audit('Vendor Batching', {
            totalVendors: vendorData.names.length,
            totalBatches: vendorBatches.length,
            vendorRaw: basicExtraction.vendorRaw
        });

        let finalResult = basicExtraction;

        for (let batchIndex = 0; batchIndex < vendorBatches.length; batchIndex++) {
            const batchResult = extractInvoiceDataWithVendorBatch(
                pdfText,
                vendorBatches[batchIndex],
                batchIndex,
                vendorBatches.length
            );

            if (batchResult && batchResult.vendor) {
                log.audit('Vendor Match Found', {
                    vendor: batchResult.vendor,
                    batch: batchIndex + 1
                });
                finalResult = batchResult;
                break;
            }
        }

        return finalResult;
    }

    /**
     * Extract invoice data
     */
    function extractInvoiceData(pdfText, vendorData) {
        if (!vendorData || vendorData.names.length === 0) {
            return extractBasicInvoiceData(pdfText);
        }

        return extractInvoiceDataWithBatching(pdfText, vendorData);
    }

    /**
     * Get vendor expense account
     */
    function getVendorExpenseAccount(vendorId) {
        try {
            const vendorFields = search.lookupFields({
                type: search.Type.VENDOR,
                id: vendorId,
                columns: ['expenseaccount']
            });

            if (vendorFields.expenseaccount && vendorFields.expenseaccount.length > 0) {
                return vendorFields.expenseaccount[0].value;
            }
        } catch (e) {
            log.error('Error getting vendor expense account', e.toString());
        }

        return null;
    }

    /**
     * Find first available expense account
     */
    function findDefaultExpenseAccount() {
        try {
            const accountSearch = search.create({
                type: search.Type.ACCOUNT,
                filters: [
                    ['type', 'anyof', 'Expense'],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: ['internalid']
            });

            let accountId = null;
            accountSearch.run().each(function(result) {
                accountId = result.getValue('internalid');
                return false; // Stop after first
            });

            return accountId;
        } catch (e) {
            log.error('Error finding default expense account', e.toString());
            return null;
        }
    }

    /**
     * Create vendor bill from extracted data (with retry logic)
     */
    function createVendorBill(extractedData, vendorData, fileName, fileId, messageId) {
        return retryOperation(function() {
            // Find vendor internal ID
            let vendorId = null;

            if (extractedData.vendor && vendorData.mappings) {
                vendorId = vendorData.mappings[extractedData.vendor.toLowerCase()];

                // If not found, try searching
                if (!vendorId) {
                    const vendorSearch = search.create({
                        type: search.Type.VENDOR,
                        filters: [
                            ['entityid', 'is', extractedData.vendor],
                            'AND',
                            ['isinactive', 'is', 'F']
                        ],
                        columns: ['internalid']
                    });

                    vendorSearch.run().each(function(result) {
                        vendorId = result.getValue('internalid');
                        return false;
                    });
                }
            }

            if (!vendorId) {
                throw new Error('Vendor not found: ' + (extractedData.vendor || extractedData.vendorRaw));
            }

            // Create vendor bill
            const vendorBill = record.create({
                type: record.Type.VENDOR_BILL,
                isDynamic: true
            });

            vendorBill.setValue({ fieldId: 'entity', value: vendorId });
            vendorBill.setValue({ fieldId: 'approvalstatus', value: '1' }); // Pending Approval

            // Set date
            if (extractedData.invoiceDate) {
                try {
                    const dateParts = extractedData.invoiceDate.split('/');
                    if (dateParts.length === 3) {
                        const invoiceDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
                        vendorBill.setValue({ fieldId: 'trandate', value: invoiceDate });
                    }
                } catch (dateError) {
                    log.error('Date parse error', dateError.toString());
                }
            }

            // Set PO/reference
            if (extractedData.poNumber) {
                vendorBill.setValue({ fieldId: 'tranid', value: extractedData.poNumber });
            }

            // Build memo
            const memoText = [];
            if (extractedData.poNumber) memoText.push('Ref: ' + extractedData.poNumber);
            if (fileName) memoText.push('Source: ' + fileName);
            if (extractedData.matchMethod) memoText.push('Match: ' + extractedData.matchMethod);

            vendorBill.setValue({ fieldId: 'memo', value: memoText.join(' | ') });

            // Add expense line
            vendorBill.selectNewLine({ sublistId: 'expense' });

            // Get expense account
            let expenseAccountId = getVendorExpenseAccount(vendorId);
            if (!expenseAccountId) {
                expenseAccountId = runtime.getCurrentScript().getParameter('custscript_ue_default_expense_account');
            }
            if (!expenseAccountId) {
                expenseAccountId = findDefaultExpenseAccount();
            }
            if (!expenseAccountId) {
                throw new Error('No expense account available');
            }

            vendorBill.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'account',
                value: expenseAccountId
            });

            vendorBill.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'amount',
                value: parseFloat(extractedData.amount) || 0
            });

            vendorBill.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'memo',
                value: 'Auto-extracted from: ' + (fileName || 'email')
            });

            vendorBill.commitLine({ sublistId: 'expense' });

            // Save bill
            const vendorBillId = vendorBill.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            // Attach PDF
            if (fileId) {
                try {
                    record.attach({
                        record: { type: record.Type.VENDOR_BILL, id: vendorBillId },
                        to: { type: 'file', id: fileId }
                    });
                } catch (attachError) {
                    log.error('Error attaching file', attachError.toString());
                }
            }

            log.audit('Vendor Bill Created', {
                vendorBillId: vendorBillId,
                vendor: extractedData.vendor,
                amount: extractedData.amount,
                matchMethod: extractedData.matchMethod || 'AI'
            });

            return {
                success: true,
                vendorBillId: vendorBillId
            };

        }, MAX_RETRIES, 'Vendor Bill Creation');
    }

    /**
     * UserEvent afterSubmit entry point
     */
    function afterSubmit(context) {
        const startTime = Date.now();

        try {
            if (context.type !== context.UserEventType.CREATE) return;

            const messageRecord = context.newRecord;
            const emailSubject = messageRecord.getValue({ fieldId: 'subject' }) || '';

            // Check if this is a vendor invoice email
            if (!emailSubject.includes('IQ - Powertools: Vendor Invoice')) return;

            const messageId = messageRecord.id;
            const attachmentFileIds = getAttachmentIds(messageId);
            const results = [];

            // Get vendor names
            const skipVendorMatching = runtime.getCurrentScript().getParameter('custscript_ue_skip_vendor_matching') || false;
            let vendorData = { names: [], mappings: {} };

            if (!skipVendorMatching) {
                log.audit('Processing', 'Retrieving vendor names...');
                try {
                    vendorData = getAllVendorNames();

                    if (!vendorData || typeof vendorData !== 'object' || !Array.isArray(vendorData.names)) {
                        log.error('Invalid vendor data', typeof vendorData);
                        vendorData = { names: [], mappings: {} };
                    }
                } catch (vendorError) {
                    log.error('Error in getAllVendorNames', vendorError.toString());
                    vendorData = { names: [], mappings: {} };
                }
            }

            // Process each PDF attachment
            for (const fileId of attachmentFileIds) {
                try {
                    const fileObj = file.load({ id: fileId });

                    if (fileObj.fileType === 'PDF') {
                        log.audit('Processing PDF', {
                            fileName: fileObj.name,
                            fileId: fileId
                        });

                        // Convert PDF
                        const base64Content = encode.convert({
                            string: fileObj.getContents(),
                            inputEncoding: encode.Encoding.BASE_64,
                            outputEncoding: encode.Encoding.BASE_64
                        });

                        const pdfText = convertPdfToText(base64Content, fileObj.name);

                        // Extract data
                        let extractedData;
                        try {
                            extractedData = extractInvoiceData(pdfText, vendorData);
                        } catch (extractError) {
                            log.error('Extraction Error', extractError.toString());
                            extractedData = extractBasicInvoiceData(pdfText);
                        }

                        log.audit('Extraction Complete', {
                            fileName: fileObj.name,
                            vendor: extractedData.vendor || extractedData.vendorRaw,
                            amount: extractedData.amount,
                            matchMethod: extractedData.matchMethod || 'unknown'
                        });

                        // Create bill
                        if (extractedData.vendor && extractedData.amount) {
                            try {
                                const billResult = createVendorBill(
                                    extractedData,
                                    vendorData,
                                    fileObj.name,
                                    fileId,
                                    messageId
                                );

                                results.push({
                                    fileName: fileObj.name,
                                    billCreated: billResult.success,
                                    billId: billResult.vendorBillId,
                                    vendor: extractedData.vendor,
                                    amount: extractedData.amount
                                });
                            } catch (billError) {
                                log.error('Bill creation failed after retries', billError.toString());
                                results.push({
                                    fileName: fileObj.name,
                                    billCreated: false,
                                    error: billError.toString()
                                });
                            }
                        } else {
                            results.push({
                                fileName: fileObj.name,
                                billCreated: false,
                                error: 'Missing vendor or amount',
                                extractedData: extractedData
                            });
                        }
                    }
                } catch (error) {
                    log.error('Error processing attachment', {
                        fileId: fileId,
                        error: error.toString()
                    });
                    results.push({
                        fileId: fileId,
                        error: error.toString()
                    });
                }
            }

            // Log summary
            const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

            log.audit('PROCESSING COMPLETE', {
                messageId: messageId,
                totalAttachments: attachmentFileIds.length,
                billsCreated: results.filter(r => r.billCreated).length,
                failures: results.filter(r => !r.billCreated).length,
                processingTime: processingTime + ' seconds',
                results: results
            });

        } catch (e) {
            log.error('Critical Error', {
                error: e.toString(),
                stack: e.stack
            });
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
