/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/ui/serverWidget', 'N/log', 'N/runtime'], function(search, serverWidget, log, runtime) {
    
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        try {
            if (context.request.method === 'GET') {
                // Create the form
                var form = serverWidget.createForm({
                    title: 'Support Type Field (custcol_supporttype) Usage Analysis'
                });
                
                // Add refresh button
                form.addSubmitButton({
                    label: 'Refresh Analysis'
                });
                
                // Add informational section
                var infoHTML = '<div style="padding: 10px; background-color: #f0f0f0; border-radius: 5px; margin-bottom: 20px;">' +
                    '<h3>Support Type Field Usage Analysis</h3>' +
                    '<p>This tool analyzes the usage of the <b>custcol_supporttype</b> field in your NetSuite account.</p>' +
                    '<p>It will help you understand:</p>' +
                    '<ul>' +
                    '<li>Which transaction types use this field</li>' +
                    '<li>How many records contain values in this field</li>' +
                    '<li>The different support type values being used</li>' +
                    '<li>Recent transactions using this field</li>' +
                    '</ul>' +
                    '</div>';
                
                form.addField({
                    id: 'custpage_info',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: ' '
                }).defaultValue = infoHTML;
                
                // Section 1: Transaction Type Analysis
                var transactionSublist = form.addSublist({
                    id: 'custpage_transaction_types',
                    type: serverWidget.SublistType.LIST,
                    label: 'Usage by Transaction Type'
                });
                
                transactionSublist.addField({
                    id: 'custpage_tran_type',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Transaction Type'
                });
                
                transactionSublist.addField({
                    id: 'custpage_tran_count',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Count of Records'
                });
                
                transactionSublist.addField({
                    id: 'custpage_tran_percentage',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Percentage with Support Type'
                });
                
                // Section 2: Support Type Values
                var valuesSublist = form.addSublist({
                    id: 'custpage_support_values',
                    type: serverWidget.SublistType.LIST,
                    label: 'Support Type Values in Use'
                });
                
                valuesSublist.addField({
                    id: 'custpage_value',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Support Type Value'
                });
                
                valuesSublist.addField({
                    id: 'custpage_value_count',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Usage Count'
                });
                
                valuesSublist.addField({
                    id: 'custpage_value_percentage',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Percentage'
                });
                
                // Section 3: Recent Transactions
                var recentSublist = form.addSublist({
                    id: 'custpage_recent_trans',
                    type: serverWidget.SublistType.LIST,
                    label: 'Recent Transactions with Support Type (Last 30 Days)'
                });
                
                recentSublist.addField({
                    id: 'custpage_recent_date',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Date'
                });
                
                recentSublist.addField({
                    id: 'custpage_recent_type',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Type'
                });
                
                recentSublist.addField({
                    id: 'custpage_recent_number',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Document Number'
                });
                
                recentSublist.addField({
                    id: 'custpage_recent_customer',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Customer'
                });
                
                recentSublist.addField({
                    id: 'custpage_recent_support',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Support Type'
                });
                
                recentSublist.addField({
                    id: 'custpage_recent_link',
                    type: serverWidget.FieldType.TEXT,
                    label: 'View'
                });
                
                // Perform the analysis
                log.audit('Starting Analysis', 'Analyzing custcol_supporttype usage');
                
                // 1. Analyze by transaction type
                var transactionAnalysis = analyzeByTransactionType();
                for (var i = 0; i < transactionAnalysis.length; i++) {
                    transactionSublist.setSublistValue({
                        id: 'custpage_tran_type',
                        line: i,
                        value: transactionAnalysis[i].type
                    });
                    transactionSublist.setSublistValue({
                        id: 'custpage_tran_count',
                        line: i,
                        value: transactionAnalysis[i].count.toString()
                    });
                    transactionSublist.setSublistValue({
                        id: 'custpage_tran_percentage',
                        line: i,
                        value: transactionAnalysis[i].percentage
                    });
                }
                
                // 2. Analyze support type values
                var valueAnalysis = analyzeSupportTypeValues();
                for (var j = 0; j < valueAnalysis.length; j++) {
                    valuesSublist.setSublistValue({
                        id: 'custpage_value',
                        line: j,
                        value: valueAnalysis[j].value || '(Empty)'
                    });
                    valuesSublist.setSublistValue({
                        id: 'custpage_value_count',
                        line: j,
                        value: valueAnalysis[j].count.toString()
                    });
                    valuesSublist.setSublistValue({
                        id: 'custpage_value_percentage',
                        line: j,
                        value: valueAnalysis[j].percentage
                    });
                }
                
                // 3. Get recent transactions
                var recentTransactions = getRecentTransactions();
                for (var k = 0; k < recentTransactions.length && k < 50; k++) {
                    recentSublist.setSublistValue({
                        id: 'custpage_recent_date',
                        line: k,
                        value: recentTransactions[k].date
                    });
                    recentSublist.setSublistValue({
                        id: 'custpage_recent_type',
                        line: k,
                        value: recentTransactions[k].type
                    });
                    recentSublist.setSublistValue({
                        id: 'custpage_recent_number',
                        line: k,
                        value: recentTransactions[k].number
                    });
                    recentSublist.setSublistValue({
                        id: 'custpage_recent_customer',
                        line: k,
                        value: recentTransactions[k].customer
                    });
                    recentSublist.setSublistValue({
                        id: 'custpage_recent_support',
                        line: k,
                        value: recentTransactions[k].supportType || '(Empty)'
                    });
                    recentSublist.setSublistValue({
                        id: 'custpage_recent_link',
                        line: k,
                        value: recentTransactions[k].link
                    });
                }
                
                // Add recommendations
                var recommendationsHTML = '<div style="padding: 10px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; margin-top: 20px;">' +
                    '<h3>Recommendations for Finding Saved Searches</h3>' +
                    '<p>Since NetSuite restricts direct access to saved search metadata, here are manual methods to find saved searches using custcol_supporttype:</p>' +
                    '<ol>' +
                    '<li><b>Global Search Method:</b> Use the global search box and search for "custcol_supporttype" - this may show saved searches referencing the field</li>' +
                    '<li><b>Saved Search List:</b> Go to Reports > Saved Searches > All Saved Searches, then use browser Find (Ctrl+F) to search for "custcol_supporttype"</li>' +
                    '<li><b>Transaction Forms:</b> Check Customization > Forms > Transaction Forms to see which forms display this field</li>' +
                    '<li><b>Workflows:</b> Review Customization > Workflow > Workflows for any that might use this field</li>' +
                    '<li><b>Scripts:</b> Search in Customization > Scripting > Scripts for any scripts referencing this field</li>' +
                    '</ol>' +
                    '<p><b>Based on the analysis above, focus on saved searches for the transaction types that show usage of this field.</b></p>' +
                    '</div>';
                
                form.addField({
                    id: 'custpage_recommendations',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: ' '
                }).defaultValue = recommendationsHTML;
                
                // Write the form
                context.response.writePage(form);
            }
        } catch (e) {
            log.error('Error in onRequest', {
                error: e.toString(),
                stack: e.stack
            });
            
            // Create error form
            var errorForm = serverWidget.createForm({
                title: 'Error Occurred'
            });
            
            errorForm.addField({
                id: 'custpage_error',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Error'
            }).defaultValue = '<p style="color:red;"><b>An error occurred:</b><br/>' + e.toString() + '</p>';
            
            context.response.writePage(errorForm);
        }
    }
    
    /**
     * Analyze usage by transaction type
     */
    function analyzeByTransactionType() {
        var results = [];
        var transactionTypes = [
            { type: 'salesorder', label: 'Sales Order' },
            { type: 'invoice', label: 'Invoice' },
            { type: 'cashsale', label: 'Cash Sale' },
            { type: 'estimate', label: 'Estimate' },
            { type: 'creditmemo', label: 'Credit Memo' },
            { type: 'returnauthorization', label: 'Return Authorization' }
        ];
        
        transactionTypes.forEach(function(tranType) {
            try {
                // Count total records
                var totalSearch = search.create({
                    type: tranType.type,
                    filters: [
                        search.createFilter({
                            name: 'mainline',
                            operator: search.Operator.IS,
                            values: true
                        })
                    ],
                    columns: [
                        search.createColumn({
                            name: 'internalid',
                            summary: search.Summary.COUNT
                        })
                    ]
                });
                
                var totalCount = 0;
                totalSearch.run().each(function(result) {
                    totalCount = parseInt(result.getValue({
                        name: 'internalid',
                        summary: search.Summary.COUNT
                    })) || 0;
                    return false;
                });
                
                // Count records with support type
                var withSupportSearch = search.create({
                    type: tranType.type,
                    filters: [
                        search.createFilter({
                            name: 'custcol_supporttype',
                            operator: search.Operator.ISNOTEMPTY
                        }),
                        search.createFilter({
                            name: 'mainline',
                            operator: search.Operator.IS,
                            values: false
                        })
                    ],
                    columns: [
                        search.createColumn({
                            name: 'internalid',
                            join: 'transaction',
                            summary: search.Summary.COUNT
                        })
                    ]
                });
                
                var withSupportCount = 0;
                withSupportSearch.run().each(function(result) {
                    withSupportCount = parseInt(result.getValue({
                        name: 'internalid',
                        join: 'transaction',
                        summary: search.Summary.COUNT
                    })) || 0;
                    return false;
                });
                
                if (totalCount > 0 || withSupportCount > 0) {
                    var percentage = totalCount > 0 ? ((withSupportCount / totalCount) * 100).toFixed(2) : '0';
                    results.push({
                        type: tranType.label,
                        count: withSupportCount,
                        percentage: percentage + '%'
                    });
                }
                
            } catch (e) {
                log.error('Error analyzing ' + tranType.type, e.toString());
            }
        });
        
        return results;
    }
    
    /**
     * Analyze different support type values
     */
    function analyzeSupportTypeValues() {
        var results = [];
        
        try {
            var valueSearch = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    search.createFilter({
                        name: 'mainline',
                        operator: search.Operator.IS,
                        values: false
                    })
                ],
                columns: [
                    search.createColumn({
                        name: 'custcol_supporttype',
                        summary: search.Summary.GROUP
                    }),
                    search.createColumn({
                        name: 'internalid',
                        summary: search.Summary.COUNT
                    })
                ]
            });
            
            var totalCount = 0;
            var values = [];
            
            valueSearch.run().each(function(result) {
                var value = result.getText({
                    name: 'custcol_supporttype',
                    summary: search.Summary.GROUP
                }) || result.getValue({
                    name: 'custcol_supporttype',
                    summary: search.Summary.GROUP
                });
                
                var count = parseInt(result.getValue({
                    name: 'internalid',
                    summary: search.Summary.COUNT
                })) || 0;
                
                if (value || count > 0) {
                    values.push({
                        value: value,
                        count: count
                    });
                    totalCount += count;
                }
                
                return true;
            });
            
            // Calculate percentages
            values.forEach(function(item) {
                results.push({
                    value: item.value,
                    count: item.count,
                    percentage: totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(2) + '%' : '0%'
                });
            });
            
            // Sort by count descending
            results.sort(function(a, b) {
                return b.count - a.count;
            });
            
        } catch (e) {
            log.error('Error analyzing values', e.toString());
        }
        
        return results;
    }
    
    /**
     * Get recent transactions with support type
     */
    function getRecentTransactions() {
        var results = [];
        
        try {
            var recentSearch = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    search.createFilter({
                        name: 'custcol_supporttype',
                        operator: search.Operator.ISNOTEMPTY
                    }),
                    search.createFilter({
                        name: 'trandate',
                        operator: search.Operator.WITHIN,
                        values: 'last30days'
                    }),
                    search.createFilter({
                        name: 'mainline',
                        operator: search.Operator.IS,
                        values: false
                    })
                ],
                columns: [
                    search.createColumn({
                        name: 'trandate',
                        sort: search.Sort.DESC
                    }),
                    search.createColumn({ name: 'type' }),
                    search.createColumn({ name: 'tranid' }),
                    search.createColumn({ name: 'entity' }),
                    search.createColumn({ name: 'custcol_supporttype' })
                ]
            });
            
            recentSearch.run().each(function(result) {
                results.push({
                    date: result.getValue('trandate'),
                    type: result.getText('type'),
                    number: result.getValue('tranid'),
                    customer: result.getText('entity'),
                    supportType: result.getText('custcol_supporttype') || result.getValue('custcol_supporttype'),
                    link: '<a href="/app/accounting/transactions/transaction.nl?id=' + 
                          result.id + '" target="_blank">View</a>'
                });
                
                return results.length < 50; // Limit to 50 records
            });
            
        } catch (e) {
            log.error('Error getting recent transactions', e.toString());
        }
        
        return results;
    }
    
    return {
        onRequest: onRequest
    };
});