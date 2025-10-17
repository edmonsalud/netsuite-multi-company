/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * INVOICE EMAIL PROCESSOR V2.0 - IQ POWERTOOLS
 *
 * MAJOR IMPROVEMENTS:
 * - Hybrid vendor matching (AI + programmatic fuzzy matching)
 * - Security: NO hardcoded API keys
 * - Vendor cache system (24-hour TTL)
 * - Vendor alias learning
 * - Confidence-based routing (high/medium/low)
 * - Duplicate detection
 * - Enhanced validation
 * - Comprehensive error handling
 * - Metrics tracking
 *
 * Script Parameters (ALL MANDATORY):
 * - custscript_iq_openai_api_key (Password) - OpenAI API key
 * - custscript_iq_convertapi_secret (Password) - ConvertAPI secret
 * - custscript_iq_confidence_high_threshold (Decimal) - High confidence threshold (default: 0.90)
 * - custscript_iq_confidence_medium_threshold (Decimal) - Medium confidence threshold (default: 0.70)
 * - custscript_iq_amount_max_threshold (Currency) - Max reasonable amount (default: 1000000)
 * - custscript_iq_default_expense_account (List/Record) - Fallback expense account
 * - custscript_iq_notification_recipients (Multi-Select) - Email recipients for alerts
 * - custscript_iq_vendor_cache_ttl_hours (Integer) - Cache TTL in hours (default: 24)
 * - custscript_iq_enable_ai_assisted_matching (Checkbox) - Use AI for final matching
 * - custscript_iq_enable_duplicate_detection (Checkbox) - Check for duplicates
 */
define([
    'N/runtime',
    'N/log',
    'N/record',
    'N/file',
    'N/https',
    'N/encode',
    'N/search',
    'N/email',
    'N/error',
    './iq_fuzzy_matching_lib'
], function(runtime, log, record, file, https, encode, search, email, error, fuzzyMatch) {

    // API Configuration
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
    const OPENAI_MODEL = 'gpt-4-turbo';
    const CONVERT_API_URL = 'https://v2.convertapi.com/convert/pdf/to/txt';

    // Custom Record Types
    const REC_TYPE_VENDOR_CACHE = 'customrecord_iq_vendor_cache';
    const REC_TYPE_VENDOR_ALIAS = 'customrecord_iq_vendor_alias';
    const REC_TYPE_INVOICE_REVIEW = 'customrecord_iq_invoice_review';
    const REC_TYPE_INVOICE_METRICS = 'customrecord_iq_invoice_metrics';

    /**
     * Get configuration from script parameters
     * NO HARDCODED DEFAULTS - Fail if not configured
     */
    function getConfiguration() {
        const currentScript = runtime.getCurrentScript();

        // Get API keys (MANDATORY - no defaults)
        const openAIKey = currentScript.getParameter({name: 'custscript_iq_openai_api_key'});
        const convertAPIKey = currentScript.getParameter({name: 'custscript_iq_convertapi_secret'});

        if (!openAIKey || !convertAPIKey) {
            throw error.create({
                name: 'MISSING_API_KEYS',
                message: 'API keys not configured. Please set custscript_iq_openai_api_key and custscript_iq_convertapi_secret in script deployment.',
                notifyOff: false
            });
        }

        return {
            apiKeys: {
                openAI: openAIKey,
                convertAPI: convertAPIKey
            },
            thresholds: {
                highConfidence: parseFloat(currentScript.getParameter({name: 'custscript_iq_confidence_high_threshold'})) || 0.90,
                mediumConfidence: parseFloat(currentScript.getParameter({name: 'custscript_iq_confidence_medium_threshold'})) || 0.70,
                maxAmount: parseFloat(currentScript.getParameter({name: 'custscript_iq_amount_max_threshold'})) || 1000000
            },
            defaults: {
                expenseAccount: currentScript.getParameter({name: 'custscript_iq_default_expense_account'}),
                notificationRecipients: currentScript.getParameter({name: 'custscript_iq_notification_recipients'})
            },
            features: {
                vendorCacheTTL: parseInt(currentScript.getParameter({name: 'custscript_iq_vendor_cache_ttl_hours'})) || 24,
                enableAIAssistedMatching: currentScript.getParameter({name: 'custscript_iq_enable_ai_assisted_matching'}) !== false,
                enableDuplicateDetection: currentScript.getParameter({name: 'custscript_iq_enable_duplicate_detection'}) !== false
            }
        };
    }

    /**
     * Get vendor cache (or rebuild if expired)
     */
    function getVendorCache(config) {
        try {
            // Search for existing cache record
            const cacheSearch = search.create({
                type: REC_TYPE_VENDOR_CACHE,
                filters: [['isinactive', 'is', 'F']],
                columns: ['custrecord_iq_cache_data', 'custrecord_iq_cache_updated', 'custrecord_iq_cache_record_count']
            });

            let cacheRecord = null;
            cacheSearch.run().each(result => {
                cacheRecord = result;
                return false; // Only need first
            });

            if (cacheRecord) {
                const lastUpdated = new Date(cacheRecord.getValue('custrecord_iq_cache_updated'));
                const ageHours = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

                if (ageHours < config.features.vendorCacheTTL) {
                    // Cache is still fresh
                    log.debug('Vendor Cache Hit', {
                        age: Math.round(ageHours * 10) / 10 + ' hours',
                        count: cacheRecord.getValue('custrecord_iq_cache_record_count')
                    });

                    const cacheData = JSON.parse(cacheRecord.getValue('custrecord_iq_cache_data'));
                    return {
                        vendors: cacheData.vendors || [],
                        mappings: cacheData.mappings || {},
                        timestamp: lastUpdated,
                        fromCache: true
                    };
                }

                log.audit('Cache Expired', {
                    age: Math.round(ageHours * 10) / 10 + ' hours',
                    ttl: config.features.vendorCacheTTL + ' hours'
                });
            }

            // Cache miss or expired - rebuild
            return rebuildVendorCache();

        } catch (e) {
            log.error('Error loading vendor cache', e.toString());
            // Fallback to rebuild
            return rebuildVendorCache();
        }
    }

    /**
     * Rebuild vendor cache from live vendor search
     */
    function rebuildVendorCache() {
        log.audit('Rebuilding Vendor Cache', 'Loading all active vendors...');

        const vendorData = {
            vendors: [],
            mappings: {},
            timestamp: new Date(),
            fromCache: false
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

            const pagedData = vendorSearch.runPaged({ pageSize: 1000 });

            log.debug('Vendor Search', {
                totalVendors: pagedData.count,
                pageCount: pagedData.pageRanges.length
            });

            for (let i = 0; i < pagedData.pageRanges.length; i++) {
                const page = pagedData.fetch({ index: i });
                page.data.forEach(result => {
                    const entityId = result.getValue('entityid');
                    const internalId = result.getValue('internalid');
                    const companyName = result.getValue('companyname') || entityId;

                    if (entityId && internalId) {
                        vendorData.vendors.push({
                            id: internalId,
                            name: companyName,
                            nameLower: companyName.toLowerCase()
                        });

                        vendorData.mappings[companyName.toLowerCase()] = internalId;
                    }
                });
            }

            log.audit('Vendor Cache Rebuilt', {
                totalVendors: vendorData.vendors.length
            });

            // Save to cache record
            saveVendorCache(vendorData);

            return vendorData;

        } catch (e) {
            log.error('Error rebuilding vendor cache', e.toString());
            throw e;
        }
    }

    /**
     * Save vendor data to cache record
     */
    function saveVendorCache(vendorData) {
        try {
            // Delete any existing cache records
            const existingSearch = search.create({
                type: REC_TYPE_VENDOR_CACHE,
                filters: [['isinactive', 'is', 'F']],
                columns: ['internalid']
            });

            existingSearch.run().each(result => {
                try {
                    record.delete({
                        type: REC_TYPE_VENDOR_CACHE,
                        id: result.getValue('internalid')
                    });
                } catch (deleteError) {
                    log.error('Error deleting old cache', deleteError.toString());
                }
                return true;
            });

            // Create new cache record
            const cacheRec = record.create({
                type: REC_TYPE_VENDOR_CACHE
            });

            cacheRec.setValue({
                fieldId: 'name',
                value: 'Vendor Cache ' + new Date().toISOString()
            });

            cacheRec.setValue({
                fieldId: 'custrecord_iq_cache_data',
                value: JSON.stringify({
                    vendors: vendorData.vendors,
                    mappings: vendorData.mappings,
                    timestamp: new Date().toISOString()
                })
            });

            cacheRec.setValue({
                fieldId: 'custrecord_iq_cache_updated',
                value: new Date()
            });

            cacheRec.setValue({
                fieldId: 'custrecord_iq_cache_record_count',
                value: vendorData.vendors.length
            });

            const cacheId = cacheRec.save();
            log.debug('Vendor cache saved', { recordId: cacheId });

        } catch (e) {
            log.error('Error saving vendor cache', e.toString());
        }
    }

    /**
     * Check vendor alias cache
     */
    function checkVendorAlias(invoiceVendorName) {
        try {
            const aliasSearch = search.create({
                type: REC_TYPE_VENDOR_ALIAS,
                filters: [
                    ['custrecord_iq_alias_invoice_name', 'is', invoiceVendorName],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    'custrecord_iq_alias_vendor',
                    'custrecord_iq_alias_confidence',
                    'custrecord_iq_alias_usage_count'
                ]
            });

            let aliasMatch = null;
            aliasSearch.run().each(result => {
                aliasMatch = {
                    vendorId: result.getValue('custrecord_iq_alias_vendor'),
                    confidence: parseFloat(result.getValue('custrecord_iq_alias_confidence')) || 1.0,
                    usageCount: parseInt(result.getValue('custrecord_iq_alias_usage_count')) || 0,
                    recordId: result.id
                };
                return false; // Only need first
            });

            if (aliasMatch) {
                log.debug('Vendor Alias Match Found', {
                    invoiceName: invoiceVendorName,
                    vendorId: aliasMatch.vendorId,
                    confidence: aliasMatch.confidence,
                    usageCount: aliasMatch.usageCount
                });

                // Increment usage count
                try {
                    record.submitFields({
                        type: REC_TYPE_VENDOR_ALIAS,
                        id: aliasMatch.recordId,
                        values: {
                            custrecord_iq_alias_usage_count: aliasMatch.usageCount + 1
                        }
                    });
                } catch (updateError) {
                    log.error('Error updating alias usage count', updateError.toString());
                }
            }

            return aliasMatch;

        } catch (e) {
            log.error('Error checking vendor alias', e.toString());
            return null;
        }
    }

    /**
     * Save vendor alias for future use
     */
    function saveVendorAlias(invoiceVendorName, vendorId, confidence) {
        try {
            // Check if alias already exists
            const existing = checkVendorAlias(invoiceVendorName);
            if (existing) {
                log.debug('Alias already exists', { invoiceName: invoiceVendorName });
                return;
            }

            const aliasRec = record.create({
                type: REC_TYPE_VENDOR_ALIAS
            });

            aliasRec.setValue({
                fieldId: 'name',
                value: invoiceVendorName.substring(0, 100) // Max 100 chars for name
            });

            aliasRec.setValue({
                fieldId: 'custrecord_iq_alias_invoice_name',
                value: invoiceVendorName
            });

            aliasRec.setValue({
                fieldId: 'custrecord_iq_alias_vendor',
                value: vendorId
            });

            aliasRec.setValue({
                fieldId: 'custrecord_iq_alias_confidence',
                value: confidence
            });

            aliasRec.setValue({
                fieldId: 'custrecord_iq_alias_usage_count',
                value: 1
            });

            const aliasId = aliasRec.save();
            log.audit('Vendor Alias Saved', {
                aliasId: aliasId,
                invoiceName: invoiceVendorName,
                vendorId: vendorId,
                confidence: confidence
            });

        } catch (e) {
            log.error('Error saving vendor alias', e.toString());
        }
    }

    /**
     * Retry API call with exponential backoff
     */
    function retryWithBackoff(apiFunction, maxRetries) {
        maxRetries = maxRetries || 3;
        let attempt = 0;
        let lastError = null;

        while (attempt < maxRetries) {
            try {
                return apiFunction();
            } catch (e) {
                lastError = e;
                attempt++;

                if (attempt < maxRetries) {
                    const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                    log.debug('API Retry', {
                        attempt: attempt,
                        maxRetries: maxRetries,
                        waitTime: backoffMs + 'ms',
                        error: e.message || e.toString()
                    });

                    // Simple delay (SuiteScript limitation)
                    const startTime = Date.now();
                    while (Date.now() - startTime < backoffMs) {
                        // Busy wait
                    }
                }
            }
        }

        throw error.create({
            name: 'API_RETRY_EXHAUSTED',
            message: 'Failed after ' + maxRetries + ' attempts: ' + (lastError.message || lastError.toString()),
            notifyOff: false
        });
    }

    /**
     * Convert PDF to text using ConvertAPI
     */
    function convertPdfToText(base64Content, filename, apiKey) {
        return retryWithBackoff(function() {
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
                    'Authorization': 'Bearer ' + apiKey,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.code !== 200) {
                throw new Error('ConvertAPI failed: HTTP ' + response.code + ' - ' + response.body);
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
        }, 3);
    }

    /**
     * Extract invoice data using ChatGPT with optimized prompt
     */
    function extractInvoiceData(pdfText, apiKey) {
        const systemPrompt = `You are a precise invoice data extractor. Extract ONLY these fields from the invoice:

FIELD 1: amount
- Look for: Total, Amount Due, Balance Due, Invoice Total, Grand Total
- Return as decimal number (e.g., "1234.56")
- Must be > 0

FIELD 2: invoiceDate
- Look for: Invoice Date, Date, Bill Date
- Return as MM/DD/YYYY
- Must be a valid date

FIELD 3: poNumber
- Priority 1: Look for "PO#", "PO Number", "Purchase Order", "Customer PO"
- Priority 2: If PO field shows "N/A" or empty, use Invoice Number instead
- Return the actual value, not "N/A"

FIELD 4: vendorRaw
- Extract the company name from the TOP of invoice (header/letterhead)
- Look for: Bill From, Vendor, Remit To, Company Logo area
- Return the EXACT name as it appears

Return ONLY this JSON (no markdown, no extra text):
{
    "amount": "1234.56",
    "invoiceDate": "MM/DD/YYYY",
    "poNumber": "PO12345",
    "vendorRaw": "Company Name Inc",
    "confidence": {
        "amount": 0.95,
        "invoiceDate": 0.90,
        "poNumber": 0.85,
        "vendorRaw": 0.90
    }
}`;

        return retryWithBackoff(function() {
            const payload = {
                model: OPENAI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: pdfText.substring(0, 4000) } // Limit text to reduce cost
                ],
                temperature: 0.1,
                max_tokens: 500
            };

            const response = https.post({
                url: OPENAI_API_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify(payload)
            });

            if (response.code !== 200) {
                throw new Error('OpenAI API error: HTTP ' + response.code + ' - ' + response.body);
            }

            const responseData = JSON.parse(response.body);
            const content = responseData.choices[0].message.content;

            // Parse JSON response
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            let extractedData = JSON.parse(cleanContent);

            // Ensure confidence object exists
            if (!extractedData.confidence) {
                extractedData.confidence = {
                    amount: 0,
                    invoiceDate: 0,
                    poNumber: 0,
                    vendorRaw: 0
                };
            }

            return extractedData;
        }, 3);
    }

    /**
     * AI-assisted vendor matching (only for top candidates)
     */
    function aiAssistedVendorMatch(invoiceVendorName, topCandidates, apiKey) {
        if (!topCandidates || topCandidates.length === 0) {
            return null;
        }

        const candidateList = topCandidates.map((c, idx) => `${idx + 1}. ${c.name} (ID: ${c.id})`).join('\n');

        const systemPrompt = `You are a vendor matching expert. The invoice shows vendor name: "${invoiceVendorName}"

Here are the top candidate matches from the database:
${candidateList}

Which vendor is the BEST match? Consider:
- Company name variations (Inc vs Corporation vs LLC)
- Punctuation differences
- DBA names
- Common abbreviations

Return ONLY this JSON:
{
    "matchIndex": 1,
    "confidence": 0.85,
    "reasoning": "Brief explanation"
}

If NO good match exists, return: {"matchIndex": 0, "confidence": 0, "reasoning": "No match"}`;

        try {
            return retryWithBackoff(function() {
                const payload = {
                    model: OPENAI_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt }
                    ],
                    temperature: 0.1,
                    max_tokens: 150
                };

                const response = https.post({
                    url: OPENAI_API_URL,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiKey
                    },
                    body: JSON.stringify(payload)
                });

                if (response.code !== 200) {
                    throw new Error('OpenAI API error');
                }

                const responseData = JSON.parse(response.body);
                const content = responseData.choices[0].message.content;
                const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const result = JSON.parse(cleanContent);

                if (result.matchIndex > 0 && result.matchIndex <= topCandidates.length) {
                    const selectedCandidate = topCandidates[result.matchIndex - 1];
                    return {
                        vendorId: selectedCandidate.id,
                        vendorName: selectedCandidate.name,
                        confidence: result.confidence,
                        method: 'ai_assisted_match',
                        reasoning: result.reasoning
                    };
                }

                return null;
            }, 2);
        } catch (e) {
            log.error('AI-assisted matching failed', e.toString());
            return null;
        }
    }

    /**
     * Hybrid vendor matching - Main orchestrator
     */
    function matchVendor(invoiceVendorName, vendorData, config) {
        if (!invoiceVendorName) {
            return {
                vendorId: null,
                vendorName: null,
                confidence: 0,
                method: 'no_vendor_name'
            };
        }

        const startTime = Date.now();

        // Stage 1: Check vendor alias cache
        const aliasMatch = checkVendorAlias(invoiceVendorName);
        if (aliasMatch) {
            return {
                vendorId: aliasMatch.vendorId,
                vendorName: null, // Will be populated later
                confidence: aliasMatch.confidence,
                method: 'alias_cache_hit',
                processingTime: Date.now() - startTime
            };
        }

        // Stage 2: Programmatic fuzzy matching
        const fuzzyResult = fuzzyMatch.findBestVendorMatch(
            invoiceVendorName,
            vendorData.vendors,
            config.thresholds.mediumConfidence
        );

        log.debug('Fuzzy Match Result', {
            invoiceName: invoiceVendorName,
            matched: fuzzyResult.vendorName,
            confidence: fuzzyResult.confidence,
            method: fuzzyResult.method
        });

        // If high confidence from programmatic matching, use it
        if (fuzzyResult.confidence >= config.thresholds.highConfidence) {
            // Save as alias for future
            if (fuzzyResult.vendorId) {
                saveVendorAlias(invoiceVendorName, fuzzyResult.vendorId, fuzzyResult.confidence);
            }

            return {
                vendorId: fuzzyResult.vendorId,
                vendorName: fuzzyResult.vendorName,
                confidence: fuzzyResult.confidence,
                method: fuzzyResult.method,
                processingTime: Date.now() - startTime,
                topCandidates: fuzzyResult.topCandidates
            };
        }

        // Stage 3: AI-assisted matching for medium confidence
        if (config.features.enableAIAssistedMatching &&
            fuzzyResult.topCandidates.length > 0 &&
            fuzzyResult.confidence >= config.thresholds.mediumConfidence) {

            log.debug('Attempting AI-assisted matching', {
                topCandidates: fuzzyResult.topCandidates.length
            });

            const aiResult = aiAssistedVendorMatch(
                invoiceVendorName,
                fuzzyResult.topCandidates,
                config.apiKeys.openAI
            );

            if (aiResult && aiResult.confidence >= config.thresholds.mediumConfidence) {
                // Save as alias
                if (aiResult.vendorId) {
                    saveVendorAlias(invoiceVendorName, aiResult.vendorId, aiResult.confidence);
                }

                return {
                    vendorId: aiResult.vendorId,
                    vendorName: aiResult.vendorName,
                    confidence: aiResult.confidence,
                    method: 'ai_assisted_match',
                    reasoning: aiResult.reasoning,
                    processingTime: Date.now() - startTime,
                    topCandidates: fuzzyResult.topCandidates
                };
            }
        }

        // Stage 4: Return best programmatic match (even if low confidence)
        return {
            vendorId: fuzzyResult.vendorId,
            vendorName: fuzzyResult.vendorName,
            confidence: fuzzyResult.confidence,
            method: fuzzyResult.method || 'low_confidence',
            processingTime: Date.now() - startTime,
            topCandidates: fuzzyResult.topCandidates
        };
    }

    /**
     * Validate extracted invoice data
     */
    function validateInvoiceData(data, config) {
        const errors = [];

        // Validate amount
        if (!data.amount || isNaN(parseFloat(data.amount))) {
            errors.push('Invalid amount: ' + data.amount);
        } else {
            const amount = parseFloat(data.amount);
            if (amount <= 0) {
                errors.push('Amount must be greater than 0');
            }
            if (amount > config.thresholds.maxAmount) {
                errors.push('Amount exceeds maximum threshold: ' + config.thresholds.maxAmount);
            }
        }

        // Validate date
        if (!data.invoiceDate) {
            errors.push('Missing invoice date');
        } else {
            // Try to parse date
            try {
                const dateParts = data.invoiceDate.split('/');
                if (dateParts.length === 3) {
                    const invoiceDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    const thirtyDaysFromNow = new Date();
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

                    if (invoiceDate < oneYearAgo || invoiceDate > thirtyDaysFromNow) {
                        errors.push('Invoice date out of reasonable range: ' + data.invoiceDate);
                    }
                } else {
                    errors.push('Invalid date format: ' + data.invoiceDate);
                }
            } catch (dateError) {
                errors.push('Cannot parse date: ' + data.invoiceDate);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check for duplicate vendor bills
     */
    function checkDuplicateBill(vendorId, amount, invoiceDate) {
        try {
            // Parse invoice date
            const dateParts = invoiceDate.split('/');
            const invoiceDateObj = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);

            // Search for existing bills within 3 days
            const threeDaysAgo = new Date(invoiceDateObj);
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const threeDaysAfter = new Date(invoiceDateObj);
            threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);

            const billSearch = search.create({
                type: search.Type.VENDOR_BILL,
                filters: [
                    ['entity', 'anyof', vendorId],
                    'AND',
                    ['amount', 'equalto', amount],
                    'AND',
                    ['trandate', 'within', threeDaysAgo, threeDaysAfter]
                ],
                columns: ['internalid', 'tranid', 'trandate', 'amount']
            });

            let duplicateFound = null;
            billSearch.run().each(result => {
                duplicateFound = {
                    billId: result.getValue('internalid'),
                    tranId: result.getValue('tranid'),
                    date: result.getValue('trandate'),
                    amount: result.getValue('amount')
                };
                return false; // Stop after first
            });

            if (duplicateFound) {
                log.audit('Possible Duplicate Detected', duplicateFound);
            }

            return duplicateFound;

        } catch (e) {
            log.error('Error checking duplicates', e.toString());
            return null;
        }
    }

    /**
     * Create manual review queue record
     */
    function createManualReviewRecord(extractedData, vendorMatchResult, fileName, fileId, messageId) {
        try {
            const reviewRec = record.create({
                type: REC_TYPE_INVOICE_REVIEW
            });

            reviewRec.setValue({
                fieldId: 'name',
                value: (extractedData.vendorRaw || 'Unknown') + ' - ' + new Date().toLocaleDateString()
            });

            reviewRec.setValue({
                fieldId: 'custrecord_iq_review_status',
                value: '1' // Pending (will need to create custom list)
            });

            reviewRec.setValue({
                fieldId: 'custrecord_iq_review_email_id',
                value: messageId ? messageId.toString() : ''
            });

            if (fileId) {
                reviewRec.setValue({
                    fieldId: 'custrecord_iq_review_file_id',
                    value: fileId
                });
            }

            reviewRec.setValue({
                fieldId: 'custrecord_iq_review_extracted_data',
                value: JSON.stringify(extractedData)
            });

            reviewRec.setValue({
                fieldId: 'custrecord_iq_review_vendor_raw',
                value: extractedData.vendorRaw || ''
            });

            if (vendorMatchResult.topCandidates) {
                reviewRec.setValue({
                    fieldId: 'custrecord_iq_review_top_matches',
                    value: JSON.stringify(vendorMatchResult.topCandidates)
                });
            }

            reviewRec.setValue({
                fieldId: 'custrecord_iq_review_confidence',
                value: vendorMatchResult.confidence || 0
            });

            const reviewId = reviewRec.save();

            log.audit('Manual Review Record Created', {
                reviewId: reviewId,
                vendor: extractedData.vendorRaw,
                confidence: vendorMatchResult.confidence
            });

            return reviewId;

        } catch (e) {
            log.error('Error creating manual review record', e.toString());
            return null;
        }
    }

    /**
     * Get vendor expense account
     */
    function getVendorExpenseAccount(vendorId, defaultAccount) {
        try {
            const vendorFields = search.lookupFields({
                type: search.Type.VENDOR,
                id: vendorId,
                columns: ['expenseaccount']
            });

            if (vendorFields.expenseaccount && vendorFields.expenseaccount.length > 0) {
                return vendorFields.expenseaccount[0].value;
            }

            return defaultAccount;

        } catch (e) {
            log.error('Error looking up vendor expense account', e.toString());
            return defaultAccount;
        }
    }

    /**
     * Create vendor bill
     */
    function createVendorBill(extractedData, vendorMatchResult, fileName, fileId, messageId, config) {
        try {
            if (!vendorMatchResult.vendorId) {
                return {
                    success: false,
                    error: 'No vendor ID provided'
                };
            }

            // Create vendor bill
            const vendorBill = record.create({
                type: record.Type.VENDOR_BILL,
                isDynamic: true
            });

            // Set vendor
            vendorBill.setValue({
                fieldId: 'entity',
                value: vendorMatchResult.vendorId
            });

            // Set approval status
            vendorBill.setValue({
                fieldId: 'approvalstatus',
                value: '1' // Pending Approval
            });

            // Set transaction date
            if (extractedData.invoiceDate) {
                try {
                    const dateParts = extractedData.invoiceDate.split('/');
                    if (dateParts.length === 3) {
                        const invoiceDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
                        vendorBill.setValue({
                            fieldId: 'trandate',
                            value: invoiceDate
                        });
                    }
                } catch (dateError) {
                    log.error('Date parse error', dateError.toString());
                }
            }

            // Set tranid (PO number)
            if (extractedData.poNumber) {
                vendorBill.setValue({
                    fieldId: 'tranid',
                    value: extractedData.poNumber
                });
            }

            // Build memo
            const memoText = [];
            if (extractedData.poNumber) {
                memoText.push('PO/Ref: ' + extractedData.poNumber);
            }
            if (fileName) {
                memoText.push('Source: ' + fileName);
            }
            if (vendorMatchResult.confidence < config.thresholds.highConfidence) {
                memoText.push('REVIEW REQUIRED - Confidence: ' + Math.round(vendorMatchResult.confidence * 100) + '%');
            }
            if (vendorMatchResult.method) {
                memoText.push('Match: ' + vendorMatchResult.method);
            }

            vendorBill.setValue({
                fieldId: 'memo',
                value: memoText.join(' | ')
            });

            // Add expense line
            vendorBill.selectNewLine({
                sublistId: 'expense'
            });

            const expenseAccount = getVendorExpenseAccount(vendorMatchResult.vendorId, config.defaults.expenseAccount);
            if (!expenseAccount) {
                throw new Error('No expense account available');
            }

            vendorBill.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'account',
                value: expenseAccount
            });

            vendorBill.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'amount',
                value: parseFloat(extractedData.amount) || 0
            });

            vendorBill.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'memo',
                value: 'Auto-extracted from ' + (fileName || 'email attachment')
            });

            vendorBill.commitLine({
                sublistId: 'expense'
            });

            // Save bill
            const vendorBillId = vendorBill.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            // Attach PDF
            if (fileId) {
                try {
                    record.attach({
                        record: {
                            type: record.Type.VENDOR_BILL,
                            id: vendorBillId
                        },
                        to: {
                            type: 'file',
                            id: fileId
                        }
                    });
                } catch (attachError) {
                    log.error('Error attaching file', attachError.toString());
                }
            }

            log.audit('Vendor Bill Created', {
                vendorBillId: vendorBillId,
                vendor: vendorMatchResult.vendorName,
                vendorId: vendorMatchResult.vendorId,
                amount: extractedData.amount,
                confidence: vendorMatchResult.confidence,
                method: vendorMatchResult.method
            });

            return {
                success: true,
                vendorBillId: vendorBillId
            };

        } catch (e) {
            log.error('Vendor Bill Creation Error', e.toString());
            return {
                success: false,
                error: e.toString()
            };
        }
    }

    /**
     * Send notification email
     */
    function sendNotification(subject, body, recipients) {
        if (!recipients) return;

        try {
            email.send({
                author: -5, // System
                recipients: recipients,
                subject: subject,
                body: body
            });

            log.debug('Notification sent', { recipients: recipients });
        } catch (e) {
            log.error('Error sending notification', e.toString());
        }
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
     * Main afterSubmit entry point
     */
    function afterSubmit(context) {
        const startTime = Date.now();

        try {
            if (context.type !== context.UserEventType.CREATE) return;

            const messageRecord = context.newRecord;
            const emailSubject = messageRecord.getValue({ fieldId: 'subject' }) || '';

            // Check if this is a vendor invoice email
            if (!emailSubject.includes('IQ - Powertools: Vendor Invoice')) return;

            log.audit('Processing Started', {
                subject: emailSubject,
                messageId: messageRecord.id
            });

            // Load configuration
            const config = getConfiguration();

            // Load vendor cache
            const vendorData = getVendorCache(config);

            // Get attachments
            const messageId = messageRecord.id;
            const attachmentFileIds = getAttachmentIds(messageId);

            log.audit('Attachments Found', {
                count: attachmentFileIds.length,
                fileIds: attachmentFileIds
            });

            const results = [];

            // Process each PDF attachment
            for (const fileId of attachmentFileIds) {
                try {
                    const fileObj = file.load({ id: fileId });

                    if (fileObj.fileType === 'PDF') {
                        log.audit('Processing PDF', {
                            fileName: fileObj.name,
                            fileId: fileId
                        });

                        // Convert PDF to text
                        const base64Content = encode.convert({
                            string: fileObj.getContents(),
                            inputEncoding: encode.Encoding.BASE_64,
                            outputEncoding: encode.Encoding.BASE_64
                        });

                        const pdfText = convertPdfToText(base64Content, fileObj.name, config.apiKeys.convertAPI);

                        // Extract invoice data
                        const extractedData = extractInvoiceData(pdfText, config.apiKeys.openAI);

                        log.audit('Data Extracted', {
                            fileName: fileObj.name,
                            vendor: extractedData.vendorRaw,
                            amount: extractedData.amount,
                            date: extractedData.invoiceDate
                        });

                        // Validate data
                        const validation = validateInvoiceData(extractedData, config);
                        if (!validation.isValid) {
                            log.error('Validation Failed', {
                                errors: validation.errors
                            });

                            // Create manual review record
                            createManualReviewRecord(
                                extractedData,
                                { confidence: 0, topCandidates: [] },
                                fileObj.name,
                                fileId,
                                messageId
                            );

                            sendNotification(
                                'IQ Invoice Validation Failed',
                                'Invoice validation failed: ' + validation.errors.join(', '),
                                config.defaults.notificationRecipients
                            );

                            results.push({
                                fileName: fileObj.name,
                                error: 'Validation failed: ' + validation.errors.join(', ')
                            });
                            continue;
                        }

                        // Check for duplicates
                        if (config.features.enableDuplicateDetection) {
                            const vendorMatchResult = matchVendor(extractedData.vendorRaw, vendorData, config);

                            if (vendorMatchResult.vendorId) {
                                const duplicate = checkDuplicateBill(
                                    vendorMatchResult.vendorId,
                                    extractedData.amount,
                                    extractedData.invoiceDate
                                );

                                if (duplicate) {
                                    log.audit('Duplicate Bill Detected', duplicate);
                                    results.push({
                                        fileName: fileObj.name,
                                        warning: 'Possible duplicate of bill #' + duplicate.billId
                                    });
                                    // Continue processing anyway, but log warning
                                }
                            }
                        }

                        // Match vendor
                        const vendorMatchResult = matchVendor(extractedData.vendorRaw, vendorData, config);

                        log.audit('Vendor Match Result', {
                            vendor: vendorMatchResult.vendorName,
                            confidence: vendorMatchResult.confidence,
                            method: vendorMatchResult.method
                        });

                        // Route based on confidence
                        if (vendorMatchResult.confidence >= config.thresholds.highConfidence) {
                            // High confidence - auto-create bill
                            const billResult = createVendorBill(
                                extractedData,
                                vendorMatchResult,
                                fileObj.name,
                                fileId,
                                messageId,
                                config
                            );

                            results.push({
                                fileName: fileObj.name,
                                confidence: vendorMatchResult.confidence,
                                method: vendorMatchResult.method,
                                billCreated: billResult.success,
                                billId: billResult.vendorBillId
                            });

                        } else if (vendorMatchResult.confidence >= config.thresholds.mediumConfidence) {
                            // Medium confidence - create bill but flag for review
                            const billResult = createVendorBill(
                                extractedData,
                                vendorMatchResult,
                                fileObj.name,
                                fileId,
                                messageId,
                                config
                            );

                            sendNotification(
                                'IQ Invoice Requires Review',
                                'Invoice created but requires review. Confidence: ' + Math.round(vendorMatchResult.confidence * 100) + '%\n\n' +
                                'Vendor: ' + vendorMatchResult.vendorName + '\n' +
                                'Amount: $' + extractedData.amount + '\n' +
                                'Bill ID: ' + billResult.vendorBillId,
                                config.defaults.notificationRecipients
                            );

                            results.push({
                                fileName: fileObj.name,
                                confidence: vendorMatchResult.confidence,
                                method: vendorMatchResult.method,
                                billCreated: billResult.success,
                                billId: billResult.vendorBillId,
                                requiresReview: true
                            });

                        } else {
                            // Low confidence - manual review queue
                            const reviewId = createManualReviewRecord(
                                extractedData,
                                vendorMatchResult,
                                fileObj.name,
                                fileId,
                                messageId
                            );

                            sendNotification(
                                'IQ Invoice Requires Manual Review',
                                'Low confidence extraction. Please review manually.\n\n' +
                                'Vendor (from invoice): ' + extractedData.vendorRaw + '\n' +
                                'Amount: $' + extractedData.amount + '\n' +
                                'Confidence: ' + Math.round(vendorMatchResult.confidence * 100) + '%\n' +
                                'Review Record ID: ' + reviewId,
                                config.defaults.notificationRecipients
                            );

                            results.push({
                                fileName: fileObj.name,
                                confidence: vendorMatchResult.confidence,
                                method: vendorMatchResult.method,
                                manualReview: true,
                                reviewId: reviewId
                            });
                        }
                    }
                } catch (fileError) {
                    log.error('Error processing file', {
                        fileId: fileId,
                        error: fileError.toString()
                    });

                    results.push({
                        fileId: fileId,
                        error: fileError.toString()
                    });
                }
            }

            // Log final summary
            const processingTime = (Date.now() - startTime) / 1000;

            log.audit('PROCESSING COMPLETE', {
                messageId: messageId,
                totalFiles: attachmentFileIds.length,
                processedFiles: results.length,
                highConfidence: results.filter(r => r.confidence >= config.thresholds.highConfidence).length,
                mediumConfidence: results.filter(r => r.confidence >= config.thresholds.mediumConfidence && r.confidence < config.thresholds.highConfidence).length,
                lowConfidence: results.filter(r => r.confidence < config.thresholds.mediumConfidence).length,
                processingTime: processingTime + ' seconds',
                results: results
            });

        } catch (e) {
            log.error('CRITICAL ERROR in Invoice Processor', {
                error: e.toString(),
                stack: e.stack
            });

            // Attempt to send notification
            try {
                const config = getConfiguration();
                sendNotification(
                    'CRITICAL: IQ Invoice Processor Error',
                    'Critical error in invoice processing: ' + e.toString(),
                    config.defaults.notificationRecipients
                );
            } catch (notifyError) {
                log.error('Failed to send error notification', notifyError.toString());
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
