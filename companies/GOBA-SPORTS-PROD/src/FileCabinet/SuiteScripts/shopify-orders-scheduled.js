/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
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

    // File storage configuration
    const FILE_FOLDER_ID = 15729114; // Your specified folder ID

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
     * Fetches all orders from Shopify created in the last 7 days
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

            log.audit('fetchAllOrders - START', {
                message: 'Beginning to fetch orders from last 7 days',
                dateFilter: todayISO,
                dateRange: `${lastWeek.toLocaleDateString()} to ${today.toLocaleDateString()}`
            });

            // Initial request parameters
            const baseParams = {
                limit: 250, // Maximum allowed by Shopify
                status: 'any', // Get all orders regardless of status
                created_at_min: todayISO // Only orders created in last 7 days
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
                'Order Name',  // Full reference with prefix
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
                        order.name || order.order_number || '',  // Use order.name for full reference (e.g., AU34163)
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
     * Creates a CSV file in the specified folder
     */
    function createCSVFile(csvContent) {
        try {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            const timestamp = today.toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const fileName = `shopify_orders_last7days_${dateStr}_${timestamp}.csv`;

            log.audit('createCSVFile - START', {
                fileName: fileName,
                contentLength: csvContent.length,
                folderId: FILE_FOLDER_ID
            });

            const fileObj = file.create({
                name: fileName,
                fileType: file.Type.CSV,
                contents: csvContent,
                folder: FILE_FOLDER_ID // Using specified folder
            });

            const fileId = fileObj.save();
            
            log.audit('createCSVFile - SUCCESS', {
                fileName: fileName,
                fileId: fileId,
                folderId: FILE_FOLDER_ID
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
     * Main scheduled script execution function
     */
    function execute(context) {
        const startTime = new Date();
        
        try {
            log.audit('SCHEDULED SCRIPT START', {
                timestamp: startTime.toISOString(),
                folderId: FILE_FOLDER_ID
            });

            // Check governance units
            const remainingUsage = runtime.getCurrentScript().getRemainingUsage();
            log.audit('Governance Check', `Starting with ${remainingUsage} units`);

            // Run the export process
            log.audit('STEP 1', 'Fetching orders from last 7 days from Shopify');
            const orders = fetchAllOrders();
            
            log.audit('STEP 2', `Converting ${orders.length} orders to CSV`);
            const csvContent = convertOrdersToCSV(orders);
            
            log.audit('STEP 3', 'Creating CSV file');
            const fileInfo = createCSVFile(csvContent);

            const endTime = new Date();
            const executionTime = (endTime - startTime) / 1000; // in seconds
            
            // Calculate date range
            const dateRangeEnd = new Date();
            const dateRangeStart = new Date();
            dateRangeStart.setDate(dateRangeStart.getDate() - 7);

            const results = {
                success: true,
                ordersExported: orders.length,
                fileName: fileInfo.name,
                fileId: fileInfo.id,
                executionTime: executionTime,
                dateRange: `${dateRangeStart.toLocaleDateString()} to ${dateRangeEnd.toLocaleDateString()}`
            };

            log.audit('SCHEDULED SCRIPT COMPLETE', results);

            // Check remaining governance units
            const finalUsage = runtime.getCurrentScript().getRemainingUsage();
            log.audit('Governance Final', `Completed with ${finalUsage} units remaining`);

        } catch (error) {
            const endTime = new Date();
            const executionTime = (endTime - startTime) / 1000;

            log.error('SCHEDULED SCRIPT ERROR', {
                error: error.toString(),
                stack: error.stack,
                executionTimeSeconds: executionTime
            });
        }
    }

    return {
        execute: execute
    };
});