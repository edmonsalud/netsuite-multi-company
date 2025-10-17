/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/file', 'N/log', 'N/runtime'], 
    function(https, file, log, runtime) {

    // Shopify API Configuration
    // IMPORTANT: Configure these values as Script Parameters for security
    const SHOPIFY_CONFIG = {
        shopDomain: runtime.getCurrentScript().getParameter('custscript_shopify_shop_domain') || 'YOUR_SHOP_DOMAIN.myshopify.com',
        adminApiToken: runtime.getCurrentScript().getParameter('custscript_shopify_admin_api_token'),
        apiVersion: runtime.getCurrentScript().getParameter('custscript_shopify_api_version') || '2024-01'
    };

    // Validate required configuration
    if (!SHOPIFY_CONFIG.adminApiToken) {
        throw new Error('Shopify Admin API Token is required. Please configure script parameter: custscript_shopify_admin_api_token');
    }

    /**
     * Makes a request to Shopify API
     */
    function makeShopifyRequest(endpoint, method, params) {
        try {
            log.audit('makeShopifyRequest - START', {
                endpoint: endpoint,
                method: method,
                params: params
            });

            const url = `https://${SHOPIFY_CONFIG.shopDomain}/admin/api/${SHOPIFY_CONFIG.apiVersion}${endpoint}`;
            
            const headers = {
                'X-Shopify-Access-Token': SHOPIFY_CONFIG.adminApiToken,
                'Content-Type': 'application/json'
            };

            let fullUrl = url;
            if (params && Object.keys(params).length > 0) {
                const queryString = Object.entries(params)
                    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                    .join('&');
                fullUrl = `${url}?${queryString}`;
            }

            log.debug('makeShopifyRequest - Request Details', {
                url: fullUrl,
                headerKeys: Object.keys(headers)
            });

            const response = https.get({
                url: fullUrl,
                headers: headers
            });

            log.debug('makeShopifyRequest - Response', {
                code: response.code,
                bodyLength: response.body ? response.body.length : 0,
                bodyPreview: response.body ? response.body.substring(0, 200) : 'No body'
            });

            if (response.code !== 200) {
                log.error('makeShopifyRequest - API Error', {
                    code: response.code,
                    body: response.body
                });
                throw new Error(`Shopify API Error: ${response.code} - ${response.body}`);
            }

            const parsedResponse = JSON.parse(response.body);
            log.audit('makeShopifyRequest - SUCCESS', {
                endpoint: endpoint,
                responseKeys: Object.keys(parsedResponse)
            });

            return parsedResponse;
        } catch (error) {
            log.error('makeShopifyRequest - EXCEPTION', {
                error: error.toString(),
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Fetches all orders from Shopify created today
     */
    function fetchAllOrders() {
        const allOrders = [];
        let pageInfo = null;
        let hasNextPage = true;
        let pageCount = 0;

        try {
            // Get today's date at midnight (start of day)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Get last 7 days of orders
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            const todayISO = lastWeek.toISOString();
            
            // OPTIONAL: To get only today's orders, uncomment these lines:
            // const todayISO = today.toISOString();
            
            // OPTIONAL: To get yesterday's orders, uncomment these lines:
            // const yesterday = new Date(today);
            // yesterday.setDate(yesterday.getDate() - 1);
            // const todayISO = yesterday.toISOString();

            log.audit('fetchAllOrders - START', {
                message: 'Beginning to fetch orders from last 7 days',
                dateFilter: todayISO,
                dateRange: `${lastWeek.toLocaleDateString()} to ${today.toLocaleDateString()}`
            });

            // Initial request parameters
            const baseParams = {
                limit: 250, // Maximum allowed by Shopify
                status: 'any', // Get all orders regardless of status
                created_at_min: todayISO // Only orders created today or after
            };

            while (hasNextPage && pageCount < 20) { // Limit pages to prevent timeout
                pageCount++;
                log.debug('fetchAllOrders - Page', `Fetching page ${pageCount}`);

                const params = { ...baseParams };
                if (pageInfo) {
                    params.page_info = pageInfo;
                }

                try {
                    const response = makeShopifyRequest('/orders.json', 'GET', params);
                    
                    if (response.orders && response.orders.length > 0) {
                        allOrders.push(...response.orders);
                        log.audit('fetchAllOrders - Page Complete', {
                            pageNumber: pageCount,
                            ordersInPage: response.orders.length,
                            totalOrdersSoFar: allOrders.length
                        });
                    }

                    // Check if there are more orders (simple check - if we got 250, there might be more)
                    hasNextPage = response.orders && response.orders.length === 250;
                    
                } catch (pageError) {
                    log.error('fetchAllOrders - Page Error', {
                        page: pageCount,
                        error: pageError.toString()
                    });
                    hasNextPage = false;
                }
            }

            log.audit('fetchAllOrders - COMPLETE', {
                totalPages: pageCount,
                totalOrders: allOrders.length,
                message: allOrders.length === 0 ? 'No orders found for the last 7 days' : 'Orders fetched successfully'
            });

            return allOrders;
        } catch (error) {
            log.error('fetchAllOrders - EXCEPTION', {
                error: error.toString(),
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Converts orders to CSV format
     */
    function convertOrdersToCSV(orders) {
        try {
            log.audit('convertOrdersToCSV - START', `Converting ${orders.length} orders to CSV`);

            // Define CSV headers
            const headers = [
                'Order ID',
                'Order Name',  // Changed from 'Order Number' to show full reference
                'Order Date',
                'Status',
                'Financial Status',
                'Fulfillment Status',
                'Customer Email',
                'Customer Name',
                'Total Price',
                'Currency',
                'Line Items Count',
                'Tags'
            ];

            // Create CSV content
            let csvContent = headers.join(',') + '\n';
            let successCount = 0;
            let errorCount = 0;

            orders.forEach((order, index) => {
                try {
                    const customerName = order.customer ? 
                        `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : '';
                    
                    const lineItemsCount = order.line_items ? order.line_items.length : 0;

                    const row = [
                        order.id || '',
                        order.order_number || '',
                        order.created_at || '',
                        order.status || '',
                        order.financial_status || '',
                        order.fulfillment_status || 'unfulfilled',
                        order.email || '',
                        `"${customerName}"`,
                        order.total_price || '0',
                        order.currency || '',
                        lineItemsCount,
                        `"${(order.tags || '').replace(/"/g, '""')}"`
                    ];

                    csvContent += row.join(',') + '\n';
                    successCount++;

                    // Log every 100 orders processed
                    if ((index + 1) % 100 === 0) {
                        log.debug('convertOrdersToCSV - Progress', {
                            processed: index + 1,
                            total: orders.length
                        });
                    }
                } catch (rowError) {
                    errorCount++;
                    log.error('convertOrdersToCSV - Row Error', {
                        error: rowError.toString(),
                        orderIndex: index,
                        orderId: order.id
                    });
                }
            });

            log.audit('convertOrdersToCSV - COMPLETE', {
                totalOrders: orders.length,
                successCount: successCount,
                errorCount: errorCount
            });

            return csvContent;
        } catch (error) {
            log.error('convertOrdersToCSV - EXCEPTION', {
                error: error.toString(),
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Creates a CSV file in the file cabinet
     */
    function createCSVFile(csvContent) {
        try {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            const timestamp = today.toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const fileName = `shopify_orders_last7days_${dateStr}_${timestamp}.csv`;

            log.audit('createCSVFile - START', {
                fileName: fileName,
                contentLength: csvContent.length
            });

            const fileObj = file.create({
                name: fileName,
                fileType: file.Type.CSV,
                contents: csvContent,
                folder: -15 // SuiteScripts folder
            });

            const fileId = fileObj.save();
            
            log.audit('createCSVFile - SUCCESS', {
                fileName: fileName,
                fileId: fileId
            });
            
            return {
                id: fileId,
                name: fileName
            };
        } catch (error) {
            log.error('createCSVFile - EXCEPTION', {
                error: error.toString(),
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Main suitelet function
     */
    function onRequest(context) {
        const startTime = new Date();
        
        try {
            log.audit('SUITELET START', {
                method: context.request.method,
                parameters: context.request.parameters,
                timestamp: startTime.toISOString()
            });

            // Run the export process
            log.audit('STEP 1', 'Fetching orders from last 7 days from Shopify');
            const orders = fetchAllOrders();
            
            log.audit('STEP 2', `Converting ${orders.length} orders to CSV`);
            const csvContent = convertOrdersToCSV(orders);
            
            log.audit('STEP 3', 'Creating CSV file');
            const fileInfo = createCSVFile(csvContent);

            const endTime = new Date();
            const executionTime = (endTime - startTime) / 1000; // in seconds
            
            // Calculate date range for logging
            const dateRangeEnd = new Date();
            const dateRangeStart = new Date();
            dateRangeStart.setDate(dateRangeStart.getDate() - 7);

            // Prepare response
            const responseData = {
                success: true,
                message: 'Export completed successfully',
                ordersExported: orders.length,
                fileName: fileInfo.name,
                fileId: fileInfo.id,
                executionTimeSeconds: executionTime,
                downloadUrl: `/app/common/media/mediaitem.nl?id=${fileInfo.id}`,
                dateFilter: `${dateRangeStart.toISOString().split('T')[0]} to ${dateRangeEnd.toISOString().split('T')[0]}`
            };

            log.audit('SUITELET COMPLETE', responseData);

            // Prepare the message based on order count
            const noOrdersMessage = orders.length === 0 ? 
                '<div class="info" style="color: orange;"><em>No orders were created in the last 7 days. The CSV file contains only headers.</em></div>' : '';
            
            // Calculate date range for display
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            // Return simple HTML response
            context.response.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Shopify Last 7 Days Orders Export Complete</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .success { color: green; }
                        .info { margin: 10px 0; }
                        a { color: blue; text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <h2 class="success">Last 7 Days Orders Export ${orders.length > 0 ? 'Successful' : 'Complete - No Orders Found'}!</h2>
                    <div class="info"><strong>Date Range:</strong> ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</div>
                    <div class="info"><strong>Orders Exported:</strong> ${orders.length}</div>
                    ${noOrdersMessage}
                    <div class="info"><strong>File Name:</strong> ${fileInfo.name}</div>
                    <div class="info"><strong>File ID:</strong> ${fileInfo.id}</div>
                    <div class="info"><strong>Execution Time:</strong> ${executionTime} seconds</div>
                    <div class="info">
                        <a href="/app/common/media/mediaitem.nl?id=${fileInfo.id}" target="_blank">Download CSV File</a>
                    </div>
                    <p>Check the script execution logs for detailed information.</p>
                </body>
                </html>
            `);

        } catch (error) {
            const endTime = new Date();
            const executionTime = (endTime - startTime) / 1000;

            log.error('SUITELET ERROR', {
                error: error.toString(),
                stack: error.stack,
                executionTimeSeconds: executionTime
            });
            
            // Return error response
            context.response.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Shopify Last 7 Days Orders Export Error</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .error { color: red; }
                        .details { background: #f5f5f5; padding: 10px; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <h2 class="error">Last 7 Days Orders Export Failed</h2>
                    <div class="details">
                        <strong>Error:</strong> ${error.message || error.toString()}
                    </div>
                    <p>Please check the script execution logs for detailed error information.</p>
                </body>
                </html>
            `);
        }
    }

    return {
        onRequest: onRequest
    };
});