/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * @description Automated Vendor Invoice Processing with Enhanced AI
 *
 * Features:
 * - Multi-strategy vendor identification (Fuzzy → AI Batching → Relaxed Fuzzy)
 * - Separate handling for European invoices (date/currency/VAT formatting)
 * - Enhanced ChatGPT prompts with step-by-step vendor extraction
 * - Automatic retry logic with exponential backoff
 * - Confidence-based matching with detailed logging
 *
 * Email Subject Triggers:
 * - "IQ - Powertools: Vendor Invoice" → Standard invoice processing
 * - "IQ - Powertools: Europe Vendor Invoice" → European invoice processing
 *
 * Script Parameters (recommended to add):
 * custscript_ue_default_expense_account - Default expense account for vendor bills (List/Record - Account)
 * custscript_ue_default_item_id - Default item for vendor bills if using items (List/Record - Item)
 * custscript_ue_skip_vendor_matching - Skip vendor matching (checkbox)
 * custscript_ue_openai_api_key - OpenAI API Key (Password field recommended)
 * custscript_ue_convert_api_secret - ConvertAPI Secret (Password field recommended)
 *
 * @author Claude-Coder (Enhanced)
 * @version 2.0.0
 * @date 2025-10-14
 */
define(['N/runtime', 'N/log', 'N/record', 'N/file', 'N/https', 'N/encode', 'N/search'],
function(runtime, log, record, file, https, encode, search) {

    // API Configuration
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
    const OPENAI_MODEL = 'gpt-4-turbo';
    const CONVERT_API_URL = 'https://v2.convertapi.com/convert/pdf/to/txt';

    // Batching configuration
    const VENDOR_BATCH_SIZE = 400; // Safe size for ChatGPT token limits

    // Retry configuration
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000; // 2 seconds base delay
    const FUZZY_MATCH_THRESHOLD = 0.7; // Minimum confidence for fuzzy matching

    /**
     * Retry operation with exponential backoff
     * @param {Function} operation - The operation to retry
     * @param {number} maxRetries - Maximum number of retry attempts
     * @param {string} operationName - Name of the operation for logging
     * @returns {*} Result of the operation
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

                // Exponential backoff delay
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                const startTime = Date.now();
                while (Date.now() - startTime < delay) {
                    // Busy wait (SuiteScript limitation)
                }
            }
        }
    }

    /**
     * Fuzzy match vendor names
     * @param {string} invoiceVendor - Vendor name from invoice
     * @param {string} netsuiteVendor - Vendor name from NetSuite
     * @returns {Object} Match result with confidence score
     */
    function fuzzyMatchVendor(invoiceVendor, netsuiteVendor) {
        const normalize = function(str) {
            return str.toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove punctuation
                .replace(/\s{2,}/g, ' ')
                .replace(/\b(inc|llc|ltd|corp|corporation|company|co|lp|llp|pa|pc)\b/g, '')
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

            if (confidence > FUZZY_MATCH_THRESHOLD) {
                return { match: true, confidence: confidence, method: 'substring' };
            }
        }

        // Word-based matching
        const words1 = norm1.split(' ').filter(function(w) { return w.length > 2; });
        const words2 = norm2.split(' ').filter(function(w) { return w.length > 2; });

        if (words1.length > 0 && words2.length > 0) {
            let matchingWords = 0;
            for (let i = 0; i < words1.length; i++) {
                for (let j = 0; j < words2.length; j++) {
                    if (words1[i] === words2[j] ||
                        words1[i].includes(words2[j]) ||
                        words2[j].includes(words1[i])) {
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
     * Find vendor using fuzzy matching (pre-AI optimization)
     * @param {string} vendorRaw - Raw vendor name from invoice
     * @param {Object} vendorData - Vendor data with names and mappings
     * @returns {Object|null} Best match result or null
     */
    function findVendorWithFuzzyMatch(vendorRaw, vendorData) {
        if (!vendorRaw || !vendorData || !vendorData.names) {
            return null;
        }

        log.debug('Attempting Fuzzy Vendor Match', { vendorRaw: vendorRaw });

        let bestMatch = null;
        let bestConfidence = 0;

        for (let i = 0; i < vendorData.names.length; i++) {
            const vendorName = vendorData.names[i];
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

        if (bestMatch && bestConfidence > FUZZY_MATCH_THRESHOLD) {
            log.audit('Fuzzy Match Found', {
                invoiceVendor: vendorRaw,
                matchedVendor: bestMatch.vendor,
                confidence: bestMatch.confidence,
                method: bestMatch.method
            });
            return bestMatch;
        }

        return null;
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
            mappings: {} // Store vendor internal ID mappings
        };
        
        try {
            const vendorSearchFilters = [
                ['isinactive', 'is', 'F']
            ];

            const vendorSearchColEntityId = search.createColumn({ 
                name: 'entityid', 
                sort: search.Sort.ASC 
            });
            
            const vendorSearchColInternalId = search.createColumn({ 
                name: 'internalid'
            });

            const vendorSearch = search.create({
                type: search.Type.VENDOR,
                filters: vendorSearchFilters,
                columns: [
                    vendorSearchColEntityId,
                    vendorSearchColInternalId
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
                    const entityId = result.getValue(vendorSearchColEntityId);
                    const internalId = result.getValue(vendorSearchColInternalId);
                    
                    if (entityId) {
                        vendorData.names.push(entityId);
                        vendorData.mappings[entityId.toLowerCase()] = internalId;
                    }
                });
            }
            
            log.audit('Vendors Found', {
                totalVendorsInSystem: vendorSearchPagedData.count,
                vendorsRetrieved: vendorData.names.length
            });
            
        } catch (e) {
            log.error('Error retrieving vendor names', e.toString());
        }

        return vendorData;
    }

    /**
     * Convert PDF to text using Convert API (with retry logic)
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
                throw new Error('Failed to convert PDF to Text. Response: ' + response.body);
            }

            const responseBody = JSON.parse(response.body);
            const txtFileUrl = responseBody.Files[0].Url;

            const textResponse = https.get({ url: txtFileUrl });
            if (textResponse.code !== 200) {
                throw new Error('Failed to download extracted text.');
            }

            return textResponse.body;
        }, MAX_RETRIES, 'PDF Conversion');
    }

    /**
     * Extract basic invoice data without vendor matching (with retry logic)
     */
    function extractBasicInvoiceData(pdfText, isEuropeInvoice) {
        return retryOperation(function() {
            const apiKeys = getAPIKeys();
            const europeanInstructions = isEuropeInvoice ? `

EUROPEAN INVOICE SPECIAL INSTRUCTIONS:
- Dates may be in DD/MM/YYYY or DD.MM.YYYY format (convert to MM/DD/YYYY for output)
- Amounts may use periods for thousands and commas for decimals (e.g., 1.234,56 means 1234.56)
- VAT/BTW/MwSt amounts should be EXCLUDED from the total - use the net amount or subtotal before VAT
- Currency symbols: €, EUR, GBP, £, CHF, etc. - extract numeric value only
- Common European vendor patterns: GmbH, AG, BV, SA, SRL, AB, ApS, OY, AS
- Language may be German, French, Dutch, Italian, Spanish, Polish, etc.
- Look for terms: Rechnung, Facture, Factuur, Fattura, Factura (all mean "invoice")
- PO references: Bestellnummer, Commande, Bestelling, Ordine, Pedido
- Look for "Lieferant" (supplier), "Verkoper" (seller), "Fournisseur" (supplier)
` : '';

            const systemPrompt = `You are an invoice data extractor. Extract the following information from the invoice text:
${europeanInstructions}
1. Total Amount (look for: total, amount due, balance due, total due, invoice total, grand total)
2. Invoice Date (look for: invoice date, bill date, date, dated)
3. PO Number - Use intelligent detection to find the purchase order reference:
   
   STEP 1 - Scan for ALL reference numbers on the invoice:
   - PO/Purchase Order fields: PO, P.O., Purchase Order, PO#, PO Number, PRO#, Customer PO, Your PO, Client PO
   - Invoice identifiers: Invoice #, Invoice Number, Invoice No, Invoice NR, Inv #
   - Order references: Order #, Order Number, Sales Order, Work Order, Job #
   - Other references: Reference, Ref, Ref1, Ref2, Contract #, Project #, Customer #, Account #, BOL#
   
   STEP 2 - Apply intelligent selection logic:
   
   For logistics/freight companies (GlobalTranz, FedEx, UPS, etc.):
   - Prioritize "Customer PO", "Your PO", "Client PO" if present
   - These are typically the customer's reference for the shipment
   - PRO# or BOL# are carrier references, not customer POs
   
   For service/software companies (Raben, SaaS providers, consultants):
   - If no explicit PO field or PO shows "N/A"
   - Consider using the Invoice Number as the tracking reference
   - This is common when services are provided without formal POs
   
   STEP 3 - Decision hierarchy:
   1. If "Customer PO", "Your PO", or similar exists with a value → use that
   2. If traditional PO field exists with a real value (not N/A) → use that
   3. If PO field is empty/N/A but Invoice Number exists → use Invoice Number
   4. If multiple references exist, choose based on:
      - What would the buyer use to track this purchase?
      - Which reference appears in the most prominent position?
      - Which follows typical PO patterns (alphanumeric, 6-20 chars)?
   
   NEVER return "N/A", "None", "-", or similar placeholder text
   Return the reference that the buyer would most likely use to match this invoice to their records
4. Vendor Name - CRITICAL: Use multi-step extraction for accuracy:

   STEP 1 - Identify the invoice issuer (NOT the recipient):
   - Top of invoice header/letterhead (usually largest company name)
   - "From:", "Bill From:", "Vendor:", "Seller:", "Supplier:" sections
   - Left side of invoice (sender information)
   - Company logo text
   - Return address / remit to address

   STEP 2 - Distinguish issuer from recipient:
   - IGNORE: "Bill To:", "Ship To:", "Customer:", "Sold To:" (these are recipients)
   - IGNORE: "IQ Powertools" or similar customer names
   - Look for legal entity suffixes: Inc, LLC, Ltd, GmbH, Corp, Co, SA, BV, AG

   STEP 3 - Extract clean company name:
   - Include the full legal name with suffix (e.g., "Acme Corporation Ltd")
   - Remove address details, phone numbers, tax IDs
   - Remove taglines or marketing text
   - Keep legal entity designation (Inc, LLC, etc.)

   STEP 4 - Validate extraction:
   - Does this name appear in the "sender" area, not "recipient" area?
   - Is this a company name, not a person's name?
   - Does it match the company issuing the invoice?

Return ONLY a JSON object in this exact format:
{
    "amount": "1234.56",
    "invoiceDate": "MM/DD/YYYY",
    "poNumber": "PO12345",
    "vendor": null,
    "vendorRaw": "Company name as it appears on invoice",
    "confidence": {
        "amount": 0.9,
        "invoiceDate": 0.9,
        "poNumber": 0.9,
        "vendor": 0
    }
}`;

            const payload = {
                model: OPENAI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: pdfText
                    }
                ],
                temperature: 0.1,
                max_tokens: 1000
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
                throw new Error('OpenAI API error: ' + response.body);
            }

            const responseData = JSON.parse(response.body);
            const content = responseData.choices[0].message.content;
            
            // Parse the JSON response
            let extractedData = {};
            try {
                // Remove markdown code blocks if present
                const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                extractedData = JSON.parse(cleanContent);
            } catch (e) {
                log.error('JSON Parse Error', 'Failed to parse ChatGPT response: ' + content);
                // Try to extract JSON from the response
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    extractedData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Could not extract valid JSON from response');
                }
            }
            
            // Ensure confidence object exists
            if (!extractedData.confidence) {
                extractedData.confidence = {
                    amount: 0,
                    invoiceDate: 0,
                    poNumber: 0,
                    vendor: 0
                };
            }

            return extractedData;
        }, MAX_RETRIES, 'Basic Invoice Extraction');
    }

    /**
     * Extract invoice data with a specific batch of vendors (with retry logic)
     */
    function extractInvoiceDataWithVendorBatch(pdfText, vendorBatch, batchNumber, totalBatches, isEuropeInvoice) {
        return retryOperation(function() {
            const apiKeys = getAPIKeys();
            const vendorList = vendorBatch.join(', ');

            log.debug('Processing Vendor Batch', {
                batchNumber: batchNumber + 1,
                totalBatches: totalBatches,
                vendorsInBatch: vendorBatch.length,
                isEuropeInvoice: isEuropeInvoice
            });

            const europeanInstructions = isEuropeInvoice ? `

EUROPEAN INVOICE SPECIAL INSTRUCTIONS:
- Dates may be in DD/MM/YYYY or DD.MM.YYYY format (convert to MM/DD/YYYY for output)
- Amounts may use periods for thousands and commas for decimals (e.g., 1.234,56 means 1234.56)
- VAT/BTW/MwSt amounts should be EXCLUDED from the total - use the net amount or subtotal before VAT
- Currency symbols: €, EUR, GBP, £, CHF, etc. - extract numeric value only
- Common European vendor patterns: GmbH, AG, BV, SA, SRL, AB, ApS, OY, AS
- Language may be German, French, Dutch, Italian, Spanish, Polish, etc.
- Look for terms: Rechnung, Facture, Factuur, Fattura, Factura (all mean "invoice")
- PO references: Bestellnummer, Commande, Bestelling, Ordine, Pedido
` : '';

            const systemPrompt = `You are an expert invoice data extractor with advanced pattern recognition capabilities.

CRITICAL MISSION: Your primary goal is to correctly identify the vendor from the invoice and match it to the provided vendor list.
${europeanInstructions}

Extract the following information from the invoice text:
1. Total Amount (look for: total, amount due, balance due, total due, invoice total, grand total)
2. Invoice Date (look for: invoice date, bill date, date, dated)
3. PO Number - IMPORTANT extraction rules:
   - First look for: PO#, PO Number, Purchase Order, P.O., Order Number, Order #
   - If the PO field exists but shows "N/A", "None", "NA", or is blank/empty:
     * Use the Invoice Number instead (look for: Invoice #, Invoice Number, Invoice No., Inv #)
     * The Invoice Number often starts with prefixes like "IN-", "INV-", or similar
   - If no PO field exists at all, look for any reference numbers that could be a PO
   - Do NOT return "N/A" or null if an Invoice Number is available
4. Vendor Name - ULTRA-IMPORTANT MULTI-STEP PROCESS:

   STEP 1: IDENTIFY THE INVOICE ISSUER (NOT the customer/recipient)
   - Scan the TOP of the invoice for the main company letterhead
   - Look in these priority areas:
     a) Company logo/letterhead at top (usually bold, large text)
     b) "From:", "Bill From:", "Vendor:", "Seller:", "Remit To:" sections
     c) Return address (top-left or top-right)
     d) First 5-10 lines of the document

   STEP 2: DISTINGUISH ISSUER FROM RECIPIENT
   - ⚠️ CRITICAL: DO NOT confuse with "Bill To:", "Ship To:", "Customer:" sections
   - ⚠️ IGNORE any mention of "IQ Powertools" or similar customer names
   - The ISSUER is who is requesting payment
   - The RECIPIENT is who must pay (that's the customer)

   STEP 3: EXTRACT COMPLETE VENDOR NAME
   - Include legal suffixes: Inc, LLC, Ltd, Corp, GmbH, SA, BV, AG, etc.
   - Remove address lines, phone numbers, tax IDs, URLs
   - Example: "Acme Transport GmbH" NOT "Acme Transport GmbH\nMain Street 5"

   STEP 4: MATCH TO VENDOR LIST (Batch ${batchNumber + 1} of ${totalBatches})
   Available vendors: ${vendorList}

   Advanced matching rules:
   - Use intelligent fuzzy matching
   - Ignore these differences:
     * Punctuation: "Company, Inc." ≈ "Company Inc" ≈ "Company Inc."
     * Case: "ACME" ≈ "Acme" ≈ "acme"
     * Suffixes: "ABC LLC" ≈ "ABC" (if "ABC" is in list)
     * Word order sometimes: "Transport Acme" might match "Acme Transport"
     * Abbreviations: "Corp" ≈ "Corporation", "Co" ≈ "Company"
   - Match by core business name, not legal suffix
   - If 60%+ similarity in core name → likely a match
   - ALWAYS use the EXACT name from the provided vendor list in your response

   STEP 5: CONFIDENCE SCORING
   - Confidence 0.9-1.0: Exact or near-exact match found
   - Confidence 0.7-0.89: Strong fuzzy match (e.g., suffix differences only)
   - Confidence 0.5-0.69: Partial match (some words match)
   - Confidence <0.5: Weak or no match (set vendor to null)

Return ONLY a JSON object in this exact format:
{
    "amount": "1234.56",
    "invoiceDate": "MM/DD/YYYY",
    "poNumber": "PO12345",
    "vendor": "Exact Vendor Name from List",
    "vendorRaw": "Name as it appears on invoice",
    "confidence": {
        "amount": 0.9,
        "invoiceDate": 0.9,
        "poNumber": 0.9,
        "vendor": 0.9
    },
    "batchNumber": ${batchNumber + 1}
}

If you cannot find a vendor match in this batch, set vendor to null. Always include vendorRaw with the vendor name as it appears on the invoice.`;

            const payload = {
                model: OPENAI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: pdfText
                    }
                ],
                temperature: 0.1,
                max_tokens: 1000
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
                throw new Error('OpenAI API error: ' + response.body);
            }

            const responseData = JSON.parse(response.body);
            const content = responseData.choices[0].message.content;
            
            // Parse the JSON response
            let extractedData = {};
            try {
                // Remove markdown code blocks if present
                const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                extractedData = JSON.parse(cleanContent);
            } catch (e) {
                log.error('JSON Parse Error', 'Failed to parse ChatGPT response: ' + content);
                // Try to extract JSON from the response
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    extractedData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Could not extract valid JSON from response');
                }
            }

            // Ensure confidence object exists
            if (!extractedData.confidence) {
                extractedData.confidence = {
                    amount: 0,
                    invoiceDate: 0,
                    poNumber: 0,
                    vendor: 0
                };
            }

            return extractedData;
        }, MAX_RETRIES, 'Batch Extraction (Batch ' + (batchNumber + 1) + ')');
    }

    /**
     * Multi-strategy vendor identification with intelligent retry
     * Implements 3-tier approach: Fuzzy Match → AI Batching → Enhanced AI Retry
     */
    function identifyVendorWithRetry(pdfText, vendorData, isEuropeInvoice) {
        // STRATEGY 1: Basic extraction to get raw vendor name
        const basicExtraction = extractBasicInvoiceData(pdfText, isEuropeInvoice);

        if (!basicExtraction.vendorRaw) {
            log.warn('Vendor Identification Failed', 'No vendor name found in invoice');
            return basicExtraction;
        }

        log.audit('Vendor Identification Started', {
            vendorRaw: basicExtraction.vendorRaw,
            isEuropeInvoice: isEuropeInvoice,
            totalVendors: vendorData.names.length
        });

        // STRATEGY 2: Fast fuzzy matching (no API calls)
        const fuzzyMatch = findVendorWithFuzzyMatch(basicExtraction.vendorRaw, vendorData);
        if (fuzzyMatch && fuzzyMatch.confidence >= FUZZY_MATCH_THRESHOLD) {
            log.audit('✓ Strategy 1 Success: Fuzzy Match', {
                vendorRaw: basicExtraction.vendorRaw,
                matchedVendor: fuzzyMatch.vendor,
                confidence: fuzzyMatch.confidence,
                method: fuzzyMatch.method
            });

            basicExtraction.vendor = fuzzyMatch.vendor;
            basicExtraction.confidence = basicExtraction.confidence || {};
            basicExtraction.confidence.vendor = fuzzyMatch.confidence;
            basicExtraction.matchMethod = 'fuzzy_match';
            return basicExtraction;
        }

        log.debug('✗ Strategy 1 Failed: Fuzzy Match', {
            vendorRaw: basicExtraction.vendorRaw,
            bestConfidence: fuzzyMatch ? fuzzyMatch.confidence : 0
        });

        // STRATEGY 3: AI-powered batching with enhanced prompts
        return extractInvoiceDataWithBatchingEnhanced(pdfText, vendorData, basicExtraction, isEuropeInvoice);
    }

    /**
     * Enhanced batching with multi-attempt vendor identification
     */
    function extractInvoiceDataWithBatchingEnhanced(pdfText, vendorData, basicExtraction, isEuropeInvoice) {
        // Split vendors into batches
        const vendorBatches = [];
        for (let i = 0; i < vendorData.names.length; i += VENDOR_BATCH_SIZE) {
            vendorBatches.push(vendorData.names.slice(i, i + VENDOR_BATCH_SIZE));
        }

        log.audit('✓ Strategy 2: AI Batching Started', {
            totalVendors: vendorData.names.length,
            batchSize: VENDOR_BATCH_SIZE,
            totalBatches: vendorBatches.length,
            vendorRaw: basicExtraction.vendorRaw
        });

        let finalResult = basicExtraction;
        let bestMatch = null;
        let highestConfidence = 0;

        // ATTEMPT 1: Try all batches sequentially
        for (let batchIndex = 0; batchIndex < vendorBatches.length; batchIndex++) {
            try {
                const batchResult = extractInvoiceDataWithVendorBatch(
                    pdfText,
                    vendorBatches[batchIndex],
                    batchIndex,
                    vendorBatches.length,
                    isEuropeInvoice
                );

                // Track best match across all batches
                if (batchResult.vendor && batchResult.confidence && batchResult.confidence.vendor > highestConfidence) {
                    highestConfidence = batchResult.confidence.vendor;
                    bestMatch = batchResult;
                    bestMatch.matchedInBatch = batchIndex + 1;
                }

                // If we found a HIGH CONFIDENCE match (>0.8), stop searching
                if (batchResult.vendor && batchResult.confidence && batchResult.confidence.vendor > 0.8) {
                    log.audit('✓ Strategy 2 Success: High Confidence Match', {
                        vendor: batchResult.vendor,
                        vendorRaw: batchResult.vendorRaw,
                        batch: batchIndex + 1,
                        confidence: batchResult.confidence.vendor
                    });
                    finalResult = batchResult;
                    finalResult.totalBatches = vendorBatches.length;
                    finalResult.matchMethod = 'ai_batch_high_confidence';
                    return finalResult;
                }

                // Update extraction data regardless of vendor match
                if (batchResult.amount || batchResult.invoiceDate || batchResult.poNumber) {
                    finalResult.amount = batchResult.amount || finalResult.amount;
                    finalResult.invoiceDate = batchResult.invoiceDate || finalResult.invoiceDate;
                    finalResult.poNumber = batchResult.poNumber || finalResult.poNumber;
                    finalResult.confidence = batchResult.confidence;
                }

            } catch (batchError) {
                log.error('Batch Processing Error', {
                    batch: batchIndex + 1,
                    error: batchError.toString()
                });
            }
        }

        // ATTEMPT 2: Use best match if confidence is acceptable (>0.5)
        if (bestMatch && highestConfidence > 0.5) {
            log.audit('✓ Strategy 2 Success: Medium Confidence Match', {
                vendor: bestMatch.vendor,
                vendorRaw: bestMatch.vendorRaw,
                batch: bestMatch.matchedInBatch,
                confidence: highestConfidence
            });
            finalResult = bestMatch;
            finalResult.totalBatches = vendorBatches.length;
            finalResult.matchMethod = 'ai_batch_medium_confidence';
            return finalResult;
        }

        // ATTEMPT 3: Retry with relaxed fuzzy matching on extracted vendor name
        log.debug('✗ Strategy 2 Failed: No confident AI match', {
            vendorRaw: basicExtraction.vendorRaw,
            highestConfidence: highestConfidence
        });

        // Try fuzzy match again with lower threshold as last resort
        const relaxedFuzzyMatch = findVendorWithFuzzyMatch(basicExtraction.vendorRaw, vendorData);
        if (relaxedFuzzyMatch && relaxedFuzzyMatch.confidence > 0.5) {
            log.audit('✓ Strategy 3 Success: Relaxed Fuzzy Match', {
                vendorRaw: basicExtraction.vendorRaw,
                matchedVendor: relaxedFuzzyMatch.vendor,
                confidence: relaxedFuzzyMatch.confidence,
                method: relaxedFuzzyMatch.method
            });

            finalResult.vendor = relaxedFuzzyMatch.vendor;
            finalResult.confidence = finalResult.confidence || {};
            finalResult.confidence.vendor = relaxedFuzzyMatch.confidence;
            finalResult.matchMethod = 'fuzzy_match_relaxed';
            return finalResult;
        }

        // FINAL: No match found
        log.warn('✗ All Strategies Failed: No vendor match', {
            vendorRaw: finalResult.vendorRaw,
            batchesSearched: vendorBatches.length,
            highestAIConfidence: highestConfidence,
            fuzzyConfidence: relaxedFuzzyMatch ? relaxedFuzzyMatch.confidence : 0
        });

        finalResult.matchedInBatch = 0;
        finalResult.totalBatches = vendorBatches.length;
        finalResult.matchMethod = 'no_match';
        return finalResult;
    }

    /**
     * Extract invoice data using ChatGPT - Multi-strategy vendor identification
     */
    function extractInvoiceData(pdfText, vendorData, isEuropeInvoice) {
        // Check if vendor matching is disabled or no vendors available
        if (!vendorData || vendorData.names.length === 0) {
            log.debug('Vendor matching disabled or no vendors available');
            return extractBasicInvoiceData(pdfText, isEuropeInvoice);
        }

        // Use enhanced multi-strategy vendor identification
        log.audit('=== INVOICE EXTRACTION STARTED ===', {
            vendorCount: vendorData.names.length,
            approach: 'Multi-strategy: Fuzzy → AI Batching → Relaxed Fuzzy',
            batchSize: VENDOR_BATCH_SIZE,
            estimatedBatches: Math.ceil(vendorData.names.length / VENDOR_BATCH_SIZE),
            isEuropeInvoice: isEuropeInvoice
        });

        const result = identifyVendorWithRetry(pdfText, vendorData, isEuropeInvoice);

        log.audit('=== INVOICE EXTRACTION COMPLETED ===', {
            vendorFound: !!result.vendor,
            vendor: result.vendor,
            vendorRaw: result.vendorRaw,
            matchMethod: result.matchMethod,
            confidence: result.confidence ? result.confidence.vendor : 0,
            amount: result.amount,
            invoiceDate: result.invoiceDate,
            poNumber: result.poNumber
        });

        return result;
    }

    /**
     * Get vendor expense account
     */
    function getVendorExpenseAccount(vendorId) {
        let expenseAccountId = null;
        
        try {
            // Use search.lookupFields for better performance
            const vendorFields = search.lookupFields({
                type: search.Type.VENDOR,
                id: vendorId,
                columns: ['expenseaccount', 'entityid']
            });
            
            // Get the expense account value
            if (vendorFields.expenseaccount && vendorFields.expenseaccount.length > 0) {
                expenseAccountId = vendorFields.expenseaccount[0].value;
                
                if (expenseAccountId) {
                    log.debug('Found vendor default expense account', {
                        vendorId: vendorId,
                        vendorName: vendorFields.entityid,
                        expenseAccountId: expenseAccountId
                    });
                    
                    // Validate the account is active and is an expense account
                    try {
                        const accountFields = search.lookupFields({
                            type: search.Type.ACCOUNT,
                            id: expenseAccountId,
                            columns: ['isinactive', 'type']
                        });
                        
                        if (accountFields.isinactive === true || 
                            (accountFields.type && accountFields.type[0] && accountFields.type[0].value !== 'Expense')) {
                            log.warn('Vendor default account is invalid', {
                                accountId: expenseAccountId,
                                inactive: accountFields.isinactive,
                                type: accountFields.type ? accountFields.type[0].text : 'Unknown'
                            });
                            expenseAccountId = null; // Force fallback
                        }
                    } catch (validateError) {
                        log.error('Error validating expense account', {
                            accountId: expenseAccountId,
                            error: validateError.toString()
                        });
                    }
                }
            }
        } catch (lookupError) {
            log.error('Error looking up vendor expense account', {
                vendorId: vendorId,
                error: lookupError.toString()
            });
        }
        
        return expenseAccountId;
    }

    /**
     * Create vendor bill from extracted data (with retry logic)
     */
    function createVendorBill(extractedData, vendorData, fileName, fileId, messageId) {
        return retryOperation(function() {
            // Create vendor bill in dynamic mode
            const vendorBill = record.create({
                type: record.Type.VENDOR_BILL,
                isDynamic: true
            });

            // Find vendor internal ID
            let vendorId = null;
            if (extractedData.vendor && vendorData.mappings) {
                vendorId = vendorData.mappings[extractedData.vendor.toLowerCase()];
                
                // If not found in mappings, search for it
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
                        return false; // Stop after first result
                    });
                }
            }

            if (!vendorId) {
                log.error('Vendor not found', {
                    vendor: extractedData.vendor,
                    vendorRaw: extractedData.vendorRaw
                });
                // Skip creation if vendor not found
                return {
                    success: false,
                    error: 'Vendor not found in NetSuite: ' + (extractedData.vendor || extractedData.vendorRaw)
                };
            }

            // Set vendor
            vendorBill.setValue({
                fieldId: 'entity',
                value: vendorId
            });

            // Set approval status to Pending Approval
            vendorBill.setValue({
                fieldId: 'approvalstatus',
                value: '1' // Pending Approval
            });


  

            // Set transaction date
            if (extractedData.invoiceDate) {
                try {
                    // Parse the date string (assuming MM/DD/YYYY format)
                    const dateParts = extractedData.invoiceDate.split('/');
                    if (dateParts.length === 3) {
                        const invoiceDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
                        vendorBill.setValue({
                            fieldId: 'trandate',
                            value: invoiceDate
                        });
                    }
                } catch (dateError) {
                    log.error('Date Parse Error', {
                        date: extractedData.invoiceDate,
                        error: dateError.toString()
                    });
                }
            }

            // Set PO/reference number in memo or reference field
            const memoText = [];
            if (extractedData.poNumber) {
                vendorBill.setValue({
                    fieldId: 'tranid', // Transaction number
                    value: extractedData.poNumber
                });
                memoText.push('PO/Ref: ' + extractedData.poNumber);
            }
            
            if (fileName) {
                memoText.push('Source: ' + fileName);
            }
            
            if (messageId) {
                memoText.push('Email Message ID: ' + messageId);
            }
            
            if (extractedData.vendorRaw && extractedData.vendorRaw !== extractedData.vendor) {
                memoText.push('Invoice vendor: ' + extractedData.vendorRaw);
            }
            
            vendorBill.setValue({
                fieldId: 'memo',
                value: memoText.join(' | ')
            });

            // Add a line item for the total amount
            // First check if we should use items or expenses
            const useItems = runtime.getCurrentScript().getParameter('custscript_ue_default_item_id');
            
            if (useItems) {
                // Use item sublist
                vendorBill.selectNewLine({
                    sublistId: 'item'
                });

                vendorBill.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: useItems
                });

                vendorBill.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: 1
                });

                vendorBill.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: parseFloat(extractedData.amount) || 0
                });

                vendorBill.commitLine({
                    sublistId: 'item'
                });
            } else {
                // Use expense sublist
                vendorBill.selectNewLine({
                    sublistId: 'expense'
                });

                // Try to get expense account from vendor record first
                let expenseAccountId = getVendorExpenseAccount(vendorId);
                
                // Fallback logic if no expense account on vendor
                if (!expenseAccountId) {
                    // Try script parameter
                    expenseAccountId = runtime.getCurrentScript().getParameter('custscript_ue_default_expense_account');
                    
                    if (expenseAccountId) {
                        log.debug('Using script parameter expense account', {
                            expenseAccountId: expenseAccountId
                        });
                    } else {
                        // Last resort: find first active expense account
                        const accountSearch = search.create({
                            type: search.Type.ACCOUNT,
                            filters: [
                                ['type', 'anyof', 'Expense'],
                                'AND',
                                ['isinactive', 'is', 'F']
                            ],
                            columns: ['name', 'number']
                        });
                        
                        accountSearch.run().each(function(result) {
                            expenseAccountId = result.id;
                            log.debug('Using first expense account found (no vendor default)', {
                                id: result.id,
                                name: result.getValue('name'),
                                number: result.getValue('number')
                            });
                            return false; // Stop after first
                        });
                        
                        if (!expenseAccountId) {
                            throw new Error('No expense accounts available. Please set a default expense account on the vendor or in script parameters.');
                        }
                    }
                }
                
                // Set the expense account
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
                    value: 'Auto-extracted from email attachment - ' + (fileName || 'Unknown source')
                });

                vendorBill.commitLine({
                    sublistId: 'expense'
                });
            }

            // Save the vendor bill
            const vendorBillId = vendorBill.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            // Attach the PDF file to the vendor bill
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
                    log.error('Error attaching file to vendor bill', {
                        vendorBillId: vendorBillId,
                        fileId: fileId,
                        error: attachError.toString()
                    });
                }
            }

            log.audit('Vendor Bill Created', {
                vendorBillId: vendorBillId,
                vendor: extractedData.vendor,
                amount: extractedData.amount,
                poNumber: extractedData.poNumber,
                invoiceDate: extractedData.invoiceDate,
                sourceFile: fileName,
                approvalStatus: 'Pending Approval',
                messageId: messageId,
                expenseAccountUsed: !useItems ? 'From vendor record or fallback' : 'N/A - using items'
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
        try {
            if (context.type !== context.UserEventType.CREATE) return;

            const messageRecord = context.newRecord;
            const emailSubject = messageRecord.getValue({ fieldId: 'subject' }) || '';

            // Check if this is a vendor invoice email
            const isStandardInvoice = emailSubject.includes('IQ - Powertools: Vendor Invoice');
            const isEuropeInvoice = emailSubject.includes('IQ - Powertools: Europe Vendor Invoice');

            if (!isStandardInvoice && !isEuropeInvoice) return;

            const messageId = messageRecord.id;
            const attachmentFileIds = getAttachmentIds(messageId);
            const results = [];

            // Get vendor names (optional based on script parameter)
            const skipVendorMatching = runtime.getCurrentScript().getParameter('custscript_ue_skip_vendor_matching') || false;
            let vendorData = { names: [], mappings: {} };
            
            if (!skipVendorMatching) {
                log.audit('Processing', 'Retrieving vendor names...');
                try {
                    vendorData = getAllVendorNames();
                    
                    // Double-check the structure
                    if (!vendorData || typeof vendorData !== 'object') {
                        log.error('getAllVendorNames returned invalid data', {
                            type: typeof vendorData,
                            value: vendorData
                        });
                        vendorData = { names: [], mappings: {} };
                    } else if (!Array.isArray(vendorData.names)) {
                        log.error('vendorData.names is not an array', {
                            type: typeof vendorData.names,
                            value: vendorData.names
                        });
                        vendorData = { names: [], mappings: {} };
                    }
                } catch (vendorError) {
                    log.error('Error in getAllVendorNames', {
                        error: vendorError.toString(),
                        stack: vendorError.stack
                    });
                    vendorData = { names: [], mappings: {} };
                }
            } else {
                log.audit('Processing', 'Skipping vendor matching as per script parameter');
            }

            // Process each PDF attachment
            for (let fileId of attachmentFileIds) {
                try {
                    const fileObj = file.load({ id: fileId });

                    if (fileObj.fileType === 'PDF') {
                        // Convert PDF to text
                        const base64Content = encode.convert({
                            string: fileObj.getContents(),
                            inputEncoding: encode.Encoding.BASE_64,
                            outputEncoding: encode.Encoding.BASE_64
                        });

                        log.audit('Processing PDF', {
                            fileName: fileObj.name,
                            fileId: fileId
                        });

                        const pdfText = convertPdfToText(base64Content, fileObj.name);

                        // Extract invoice data
                        let extractedData;
                        try {
                            extractedData = extractInvoiceData(pdfText, vendorData, isEuropeInvoice);
                        } catch (extractError) {
                            log.error('Extraction Error', {
                                error: extractError.toString(),
                                message: extractError.message,
                                stack: extractError.stack
                            });
                            // Try basic extraction as fallback
                            extractedData = extractBasicInvoiceData(pdfText, isEuropeInvoice);
                        }

                        log.audit('Extraction Complete', {
                            fileName: fileObj.name,
                            extractedData: extractedData,
                            vendorMatched: !!extractedData.vendor
                        });

                        // Create vendor bill if we have vendor and amount
                        if (extractedData.vendor && extractedData.amount) {
                            const billResult = createVendorBill(
                                extractedData, 
                                vendorData, 
                                fileObj.name, 
                                fileId,
                                messageId
                            );

                            results.push({
                                fileName: fileObj.name,
                                fileId: fileId,
                                extractedData: extractedData,
                                billCreated: billResult.success,
                                billId: billResult.vendorBillId,
                                error: billResult.error
                            });
                        } else {
                            results.push({
                                fileName: fileObj.name,
                                fileId: fileId,
                                extractedData: extractedData,
                                billCreated: false,
                                error: 'Missing vendor or amount data'
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

            // Log final results
            log.audit('=== PROCESSING COMPLETE ===', {
                messageId: messageId,
                emailSubject: emailSubject,
                invoiceType: isEuropeInvoice ? 'EUROPE' : 'STANDARD',
                totalAttachments: attachmentFileIds.length,
                processedFiles: results.length,
                vendorBillsCreated: results.filter(r => r.billCreated).length,
                successRate: ((results.filter(r => r.billCreated).length / results.length) * 100).toFixed(1) + '%',
                results: results.map(r => ({
                    file: r.fileName,
                    billCreated: r.billCreated,
                    billId: r.billId,
                    vendor: r.extractedData?.vendor,
                    vendorRaw: r.extractedData?.vendorRaw,
                    matchMethod: r.extractedData?.matchMethod,
                    confidence: r.extractedData?.confidence?.vendor,
                    amount: r.extractedData?.amount,
                    poNumber: r.extractedData?.poNumber,
                    error: r.error
                }))
            });

        } catch (e) {
            log.error('Error in Vendor Bill Email Extractor', {
                error: e.toString(),
                stack: e.stack
            });
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});