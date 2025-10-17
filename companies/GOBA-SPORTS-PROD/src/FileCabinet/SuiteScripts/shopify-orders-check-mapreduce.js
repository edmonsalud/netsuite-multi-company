/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/search', 'N/log', 'N/runtime', 'N/email', 'N/format'], 
    function(file, search, log, runtime, email, format) {

    // Configuration
    const SOURCE_FOLDER_ID = 15729114; // Original folder with CSV files
    const ARCHIVE_FOLDER_ID = 15729115; // Archive folder for processed files

    /**
     * Get CSV files from the source folder
     */
    function getInputData() {
        try {
            log.audit('getInputData', 'Starting to search for CSV files in folder ' + SOURCE_FOLDER_ID);

            // Search for CSV files in the source folder
            const fileSearchObj = search.create({
                type: 'file',
                filters: [
                    ['folder', 'anyof', SOURCE_FOLDER_ID],
                    'AND',
                    ['filetype', 'anyof', 'CSV'],
                    'AND',
                    ['name', 'startswith', 'shopify_orders_'] // Only process our Shopify order files
                ],
                columns: [
                    search.createColumn({ name: 'name', sort: search.Sort.ASC }),
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'created' })
                ]
            });

            const searchResults = [];
            fileSearchObj.run().each(function(result) {
                searchResults.push({
                    fileId: result.getValue('internalid'),
                    fileName: result.getValue('name'),
                    created: result.getValue('created')
                });
                return true;
            });

            log.audit('getInputData', `Found ${searchResults.length} CSV files to process`);
            return searchResults;

        } catch (error) {
            log.error('getInputData Error', error);
            throw error;
        }
    }

    /**
     * Process each CSV file and check for matching transactions
     */
    function map(context) {
        try {
            const fileData = JSON.parse(context.value);
            log.audit('map - Processing File', fileData);

            // Load the CSV file
            const csvFile = file.load({
                id: fileData.fileId
            });

            // Parse CSV content
            const csvContent = csvFile.getContents();
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',');

            // Find the Order ID column index
            const orderIdIndex = headers.findIndex(h => h.trim() === 'Order ID');
            if (orderIdIndex === -1) {
                log.error('map - Column Not Found', 'Order ID column not found in CSV');
                return;
            }

            const unmatchedOrders = [];
            let totalOrders = 0;
            let matchedOrders = 0;

            // Process each data row (skip header)
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue; // Skip empty lines

                const columns = parseCSVLine(lines[i]);
                if (columns.length > orderIdIndex) {
                    // Keep Order ID as string to preserve full number
                    const orderId = columns[orderIdIndex].trim().replace(/^"/, '').replace(/"$/, '');
                    if (!orderId) continue;

                    totalOrders++;

                    // Search for matching transaction for this specific order
                    const transactionSearch = search.create({
                        type: search.Type.TRANSACTION,
                        filters: [
                            ['custbody_celigo_etail_order_id', 'is', orderId],
                            'AND',
                            ['mainline', 'is', 'T']
                        ],
                        columns: ['tranid', 'recordtype']
                    });

                    const hasMatch = transactionSearch.runPaged().count > 0;

                    if (hasMatch) {
                        matchedOrders++;
                        log.debug('map - Individual Order Check', `Order ${orderId} ✓ MATCHED - Found transaction in NetSuite`);
                    } else {
                        // Collect order details for unmatched orders
                        const orderData = {
                            orderId: orderId,
                            orderName: columns[1] || '', // Order Name column
                            orderDate: columns[2] || '', // Order Date column
                            customerEmail: columns[6] || '', // Customer Email column
                            totalPrice: columns[8] || '' // Total Price column
                        };
                        unmatchedOrders.push(orderData);
                        log.debug('map - Individual Order Check', `Order ${orderId} ✗ UNMATCHED - No transaction found in NetSuite`);
                    }
                }
            }

            // Write results for this file
            context.write({
                key: fileData.fileId,
                value: {
                    fileName: fileData.fileName,
                    fileId: fileData.fileId,
                    totalOrders: totalOrders,
                    matchedOrders: matchedOrders,
                    unmatchedOrders: unmatchedOrders
                }
            });

            log.audit('map - File Processing Complete', {
                fileName: fileData.fileName,
                totalOrders: totalOrders,
                matchedOrders: matchedOrders,
                unmatchedOrders: unmatchedOrders.length,
                summary: `${matchedOrders} of ${totalOrders} orders have matching transactions`
            });

        } catch (error) {
            log.error('map Error', {
                error: error.toString(),
                context: context.value
            });
        }
    }

    /**
     * Parse a CSV line handling quoted values
     */
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current); // Add last field
        return result;
    }

    /**
     * Reduce - not needed for this use case as we process everything in summarize
     */
    function reduce(context) {
        // Pass through to summarize
        context.write({
            key: context.key,
            value: context.values[0] // Should only be one value per file
        });
    }

    /**
     * Summarize results, send email, and move files
     */
    function summarize(summary) {
        try {
            log.audit('summarize', 'Starting summary phase');

            const scriptObj = runtime.getCurrentScript();
            const emailRecipient = scriptObj.getParameter({name: 'custscript_shopify_check_email'});

            let allUnmatchedOrders = [];
            let processedFiles = [];
            let totalFilesProcessed = 0;
            let totalOrdersProcessed = 0;
            let totalMatchedOrders = 0;
            let totalUnmatched = 0;

            // Collect all results
            summary.output.iterator().each(function(key, value) {
                const fileResult = JSON.parse(value);
                totalFilesProcessed++;
                totalOrdersProcessed += fileResult.totalOrders;
                totalMatchedOrders += fileResult.matchedOrders;
                totalUnmatched += fileResult.unmatchedOrders.length;

                if (fileResult.unmatchedOrders.length > 0) {
                    allUnmatchedOrders = allUnmatchedOrders.concat(fileResult.unmatchedOrders);
                }

                processedFiles.push({
                    fileId: fileResult.fileId,
                    fileName: fileResult.fileName,
                    totalOrders: fileResult.totalOrders,
                    matchedOrders: fileResult.matchedOrders,
                    unmatchedCount: fileResult.unmatchedOrders.length
                });

                return true;
            });

            // Only send email if there are unmatched orders
            if (totalUnmatched > 0) {
                if (!emailRecipient) {
                    log.error('summarize', 'Unmatched orders found but no email recipient configured');
                } else {
                    // Create email content
                    let emailSubject = `Shopify Orders Check: ${totalUnmatched} Unmatched Orders Found`;
                    let emailBody = `Shopify Orders Check Summary\n`;
                    emailBody += `============================\n\n`;
                    emailBody += `Files Processed: ${totalFilesProcessed}\n`;
                    emailBody += `Total Orders Checked: ${totalOrdersProcessed}\n`;
                    emailBody += `Successfully Matched Orders: ${totalMatchedOrders}\n`;
                    emailBody += `Unmatched Orders: ${totalUnmatched}\n`;
                    emailBody += `Match Rate: ${(totalMatchedOrders / totalOrdersProcessed * 100).toFixed(1)}%\n`;
                    emailBody += `Process Date: ${new Date().toLocaleString()}\n\n`;

                    emailBody += `FILE BREAKDOWN:\n`;
                    emailBody += `===============\n`;

                    // Show breakdown by file
                    processedFiles.forEach(function(fileInfo) {
                        emailBody += `\nFile: ${fileInfo.fileName}\n`;
                        emailBody += `  - Total Orders: ${fileInfo.totalOrders}\n`;
                        emailBody += `  - Matched: ${fileInfo.matchedOrders}\n`;
                        emailBody += `  - Unmatched: ${fileInfo.unmatchedCount}\n`;
                    });

                    emailBody += `\n\nUNMATCHED ORDERS DETAIL:\n`;
                    emailBody += `========================\n`;
                    emailBody += `The following ${totalUnmatched} orders do not have matching transactions in NetSuite:\n\n`;

                    // List all unmatched orders
                    emailBody += `Order ID | Order Name | Order Date | Customer Email | Total Price\n`;
                    emailBody += `----------------------------------------------------------------\n`;
                    
                    allUnmatchedOrders.forEach(function(order) {
                        // Format Order ID to prevent scientific notation in email body
                        const formattedOrderId = order.orderId.toString();
                        emailBody += `${formattedOrderId} | ${order.orderName} | ${order.orderDate} | ${order.customerEmail} | ${order.totalPrice}\n`;
                    });

                    // Add CSV attachment with unmatched orders
                    let csvContent = 'Order ID,Order Name,Order Date,Customer Email,Total Price\n';
                    allUnmatchedOrders.forEach(function(order) {
                        // Ensure Order ID is treated as text to prevent scientific notation
                        csvContent += `"${order.orderId}","${order.orderName}",${order.orderDate},${order.customerEmail},${order.totalPrice}\n`;
                    });

                    const attachmentFile = file.create({
                        name: `unmatched_shopify_orders_${new Date().toISOString().split('T')[0]}.csv`,
                        fileType: file.Type.CSV,
                        contents: csvContent
                    });

                    // Send email with attachment
                    email.send({
                        author: -5, // System email
                        recipients: emailRecipient,
                        subject: emailSubject,
                        body: emailBody,
                        attachments: [attachmentFile]
                    });

                    log.audit('summarize - Email Sent', {
                        recipient: emailRecipient,
                        unmatchedCount: totalUnmatched
                    });
                }
            } else {
                log.audit('summarize - No Email Sent', 'All orders have matching transactions, no email notification needed');
            }

            // Move processed files to archive folder
            processedFiles.forEach(function(fileInfo) {
                try {
                    // Load the file
                    const sourceFile = file.load({
                        id: fileInfo.fileId
                    });

                    // Create copy in archive folder
                    const archiveFile = file.create({
                        name: sourceFile.name,
                        fileType: sourceFile.fileType,
                        contents: sourceFile.getContents(),
                        folder: ARCHIVE_FOLDER_ID
                    });

                    const archiveFileId = archiveFile.save();
                    
                    // Delete original file
                    file.delete({
                        id: fileInfo.fileId
                    });

                    log.audit('summarize - File Moved', {
                        fileName: fileInfo.fileName,
                        sourceId: fileInfo.fileId,
                        archiveId: archiveFileId
                    });

                } catch (moveError) {
                    log.error('summarize - File Move Error', {
                        fileName: fileInfo.fileName,
                        error: moveError.toString()
                    });
                }
            });

            log.audit('summarize - Complete', {
                filesProcessed: totalFilesProcessed,
                ordersProcessed: totalOrdersProcessed,
                matchedOrders: totalMatchedOrders,
                unmatchedOrders: totalUnmatched,
                matchRate: totalOrdersProcessed > 0 ? (totalMatchedOrders / totalOrdersProcessed * 100).toFixed(1) + '%' : 'N/A',
                filesMoved: processedFiles.length
            });

        } catch (error) {
            log.error('summarize Error', error);
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});