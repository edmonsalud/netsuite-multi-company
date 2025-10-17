/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/url', 'N/https'], 
function(search, url, https) {

    /**
     * Function to be executed after page is initialized.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed
     */
    function pageInit(scriptContext) {
        // Initialize the search function
        window.searchOrdersFromServer = function(query) {
            searchOrders(query);
        };
    }

    /**
     * Search for orders based on user input
     * @param {string} query - The search query
     */
    function searchOrders(query) {
        try {
            // Create search for open orders matching the query
            const orderSearch = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ['type', 'anyof', 'SalesOrd', 'CashSale'],
                    'AND',
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['status', 'anyof', 
                        'SalesOrd:A', // Sales Order:Pending Approval
                        'SalesOrd:B', // Sales Order:Pending Fulfillment
                        'SalesOrd:D', // Sales Order:Partially Fulfilled
                        'SalesOrd:E', // Sales Order:Pending Billing/Partially Fulfilled
                        'SalesOrd:F', // Sales Order:Pending Billing
                        'CashSale:C'  // Cash Sale:Paid In Full
                    ],
                    'AND',
                    ['tranid', 'contains', query.toUpperCase()]
                ],
                columns: [
                    search.createColumn({name: 'tranid', sort: search.Sort.DESC}),
                    search.createColumn({name: 'entity'}),
                    search.createColumn({name: 'type'}),
                    search.createColumn({name: 'trandate'}),
                    search.createColumn({name: 'amount'})
                ]
            });

            const results = [];
            let count = 0;
            
            // Run search and collect results (limit to 10 for performance)
            orderSearch.run().each(function(result) {
                const type = result.getValue('type');
                const typeDisplay = type === 'SalesOrd' ? 'Sales Order' : 'Cash Sale';
                
                results.push({
                    id: result.id,
                    tranid: result.getValue('tranid'),
                    customer: result.getText('entity'),
                    type: typeDisplay,
                    date: result.getValue('trandate'),
                    amount: result.getValue('amount')
                });
                
                count++;
                return count < 10; // Limit to 10 results
            });

            // Update the UI with results
            if (window.updateOrderSuggestions) {
                window.updateOrderSuggestions(results);
            }

        } catch (e) {
            console.error('Error searching orders:', e);
            // Show error in suggestions
            if (window.updateOrderSuggestions) {
                window.updateOrderSuggestions([]);
            }
        }
    }

    /**
     * Alternative approach using Suitelet for search (if client-side search has limitations)
     * This would require setting up a RESTlet endpoint
     */
    function searchOrdersViaRESTlet(query) {
        // This is an alternative approach if you need server-side search
        // You would need to create a RESTlet that performs the search
        
        const restletUrl = url.resolveScript({
            scriptId: 'customscript_order_search_restlet',
            deploymentId: 'customdeploy_order_search_restlet',
            returnExternalUrl: true
        });

        const headers = {
            'Content-Type': 'application/json'
        };

        const response = https.post({
            url: restletUrl,
            headers: headers,
            body: JSON.stringify({
                query: query
            })
        });

        const results = JSON.parse(response.body);
        
        if (window.updateOrderSuggestions) {
            window.updateOrderSuggestions(results);
        }
    }

    return {
        pageInit: pageInit
    };
});
