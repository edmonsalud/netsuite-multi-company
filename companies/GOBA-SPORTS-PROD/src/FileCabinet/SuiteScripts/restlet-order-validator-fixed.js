/**
 * @NApiVersion 2.1
 * @NScriptType RESTlet
 */
define(['N/search', 'N/log', 'N/record'], function(search, log, record) {

    function doGet(requestParams) {
        try {
            var orderNumber = (requestParams.orderNumber || '').trim().toUpperCase();
            
            if (!orderNumber) {
                return {
                    success: false,
                    error: 'Order number is required'
                };
            }
            
            // Search for the order as Sales Order
            var orderSearch = search.create({
                type: search.Type.SALES_ORDER,
                filters: [
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['tranid', 'is', orderNumber]
                ],
                columns: [
                    'internalid',
                    'entity',
                    'trandate',
                    'status',
                    'amount',
                    'shipaddress'
                ]
            });
            
            var searchResults = orderSearch.run().getRange({
                start: 0,
                end: 1
            });
            
            if (searchResults.length === 0) {
                // Try searching Cash Sales
                var cashSaleSearch = search.create({
                    type: search.Type.CASH_SALE,
                    filters: [
                        ['mainline', 'is', 'T'],
                        'AND',
                        ['tranid', 'is', orderNumber]
                    ],
                    columns: [
                        'internalid',
                        'entity',
                        'trandate',
                        'status',
                        'amount',
                        'shipaddress'
                    ]
                });
                
                var cashSaleResults = cashSaleSearch.run().getRange({
                    start: 0,
                    end: 1
                });
                
                if (cashSaleResults.length === 0) {
                    return {
                        success: false,
                        error: 'Order not found: ' + orderNumber
                    };
                }
                
                // Found as Cash Sale
                var cashResult = cashSaleResults[0];
                return {
                    success: true,
                    order: {
                        id: cashResult.getValue('internalid'),
                        number: orderNumber,
                        customer: cashResult.getText('entity'),
                        customerRaw: cashResult.getValue('entity'),
                        date: cashResult.getValue('trandate'),
                        status: cashResult.getText('status'),
                        statusValue: cashResult.getValue('status'),
                        amount: cashResult.getValue('amount'),
                        type: 'CashSale',
                        address: cashResult.getValue('shipaddress')
                    }
                };
            }
            
            // Found as Sales Order
            var result = searchResults[0];
            var status = result.getValue('status');
            var validStatuses = ['SalesOrd:B', 'SalesOrd:D', 'SalesOrd:E', 'SalesOrd:F'];
            
            return {
                success: true,
                order: {
                    id: result.getValue('internalid'),
                    number: orderNumber,
                    customer: result.getText('entity'),
                    customerRaw: result.getValue('entity'),
                    date: result.getValue('trandate'),
                    status: result.getText('status'),
                    statusValue: status,
                    amount: result.getValue('amount'),
                    type: 'SalesOrd',
                    address: result.getValue('shipaddress'),
                    isValidForUpdate: validStatuses.indexOf(status) !== -1
                }
            };
            
        } catch (e) {
            log.error('RESTlet Error', {
                error: e.message,
                stack: e.stack,
                params: requestParams
            });
            
            return {
                success: false,
                error: 'An error occurred while validating the order'
            };
        }
    }
    
    function doPost(requestBody) {
        try {
            var orderNumbers = requestBody.orderNumbers || [];
            
            if (!Array.isArray(orderNumbers) || orderNumbers.length === 0) {
                return {
                    success: false,
                    error: 'Please provide an array of order numbers'
                };
            }
            
            if (orderNumbers.length > 20) {
                return {
                    success: false,
                    error: 'Maximum 20 orders per request'
                };
            }
            
            var results = {};
            var upperCaseNumbers = [];
            
            // Convert all order numbers to uppercase
            for (var i = 0; i < orderNumbers.length; i++) {
                upperCaseNumbers.push(orderNumbers[i].toUpperCase());
            }
            
            // Search for all orders at once
            var orderSearch = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ['type', 'anyof', 'SalesOrd', 'CashSale'],
                    'AND',
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['tranid', 'anyof', upperCaseNumbers]
                ],
                columns: [
                    'tranid',
                    'internalid',
                    'entity',
                    'trandate',
                    'status',
                    'type'
                ]
            });
            
            orderSearch.run().each(function(result) {
                var tranId = result.getValue('tranid');
                results[tranId] = {
                    found: true,
                    id: result.getValue('internalid'),
                    customer: result.getText('entity'),
                    date: result.getValue('trandate'),
                    status: result.getText('status'),
                    type: result.getValue('type')
                };
                return true;
            });
            
            // Mark not found orders
            for (var j = 0; j < upperCaseNumbers.length; j++) {
                var orderNum = upperCaseNumbers[j];
                if (!results[orderNum]) {
                    results[orderNum] = {
                        found: false
                    };
                }
            }
            
            return {
                success: true,
                orders: results
            };
            
        } catch (e) {
            log.error('RESTlet POST Error', {
                error: e.message,
                stack: e.stack
            });
            
            return {
                success: false,
                error: 'An error occurred while validating orders'
            };
        }
    }
    
    return {
        get: doGet,
        post: doPost
    };
    
});