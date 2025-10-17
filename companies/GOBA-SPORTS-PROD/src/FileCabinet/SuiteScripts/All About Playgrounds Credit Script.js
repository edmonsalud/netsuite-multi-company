/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/log', 'N/search'], function(record, log, search) {

    function getPreviousMonthEndDate() {
    var today = new Date();
    // Set date to the last day of the previous month
    var prevMonthEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
    return prevMonthEndDate;
} 
	
	function execute(context) {
        try {
            var customerId = 7765824; // Replace with your customer ID

            // Load the saved search
            var savedSearchId = 'customsearch_all_about_play_credit'; // Replace with your saved search ID
            var creditAmount = getCreditAmountFromSavedSearch(savedSearchId);
            var documentNumbers = getDocumentNumbersFromSavedSearch(savedSearchId);

            log.debug({
                title: 'Credit Amount',
                details: creditAmount
            });

            log.debug({
                title: 'Document Numbers',
                details: documentNumbers
            });

            if (creditAmount > 0) {
                var creditMemo = record.create({
                    type: record.Type.CREDIT_MEMO,
                    isDynamic: true
                });

                creditMemo.setValue({
                    fieldId: 'entity',
                    value: customerId
                });

				// Set trandate to last day of previous month
                creditMemo.setValue({
                    fieldId: 'trandate',
                    value: getPreviousMonthEndDate()
          	    });	
				
				// Set notes field with document numbers
                creditMemo.setValue({
                    fieldId: 'custbody_notesspecialrequests',
                    value: 'Document Numbers: ' + documentNumbers
                });

                creditMemo.setValue({
                    fieldId: 'custbody_returnreason',
                    value: 18 // Discount
                });

                creditMemo.setValue({
                    fieldId: 'department',
                    value: 60 // Corporate US Office : Wholesale : Dealer
                });

                creditMemo.setValue({
                    fieldId: 'otherrefnum',
                    value: 'Installation Credit'
                });

                // Calculate previous month
                var prevMonth = getPreviousMonth();
                var description = '75% Credit of Installations Completed for ' + prevMonth;

                // Add items to the credit memo
                creditMemo.selectNewLine({
                    sublistId: 'item'
                });
                creditMemo.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: 109556 // Replace with your item ID
                });
                creditMemo.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'description',
                    value: description
                });
                creditMemo.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: 1
                });
                creditMemo.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: creditAmount
                });
                creditMemo.commitLine({
                    sublistId: 'item'
                });

                var creditMemoId = creditMemo.save();
                log.debug({
                    title: 'Credit Memo Created',
                    details: 'Credit Memo ID: ' + creditMemoId
                });

                // Update orders to change custbody_3rd_party_status field
                updateOrdersStatus(savedSearchId);
            } else {
                log.debug({
                    title: 'No Credit Amount Found',
                    details: 'No credit memo created as the credit amount is zero or less.'
                });
            }
        } catch (e) {
            log.error({
                title: 'Error Creating Credit Memo',
                details: e.toString()
            });
        }
    }

    function getCreditAmountFromSavedSearch(savedSearchId) {
        var creditAmount = 0;
        var searchResult = search.load({
            id: savedSearchId
        }).run();

        searchResult.each(function(result) {
            var amount = parseFloat(result.getValue({
                name: 'formulacurrency',
                summary: 'SUM'
            }));
            if (!isNaN(amount)) {
                creditAmount += amount;
            }
            return true; // Continue iterating
        });

        return creditAmount;
    }

    function getDocumentNumbersFromSavedSearch(savedSearchId) {
        var documentNumbers = [];
        var searchResult = search.load({
            id: savedSearchId
        }).run().each(function(result) {
            var docNumber = result.getValue({
                name: 'tranid',
                summary: 'GROUP' // Ensure you are using GROUP for summary search
            });
            log.debug({
                title: 'Fetched Document Number',
                details: docNumber
            });
            if (docNumber) {
                documentNumbers.push(docNumber);
            }
            return true; // Continue iterating
        });

        log.debug({
            title: 'All Fetched Document Numbers',
            details: documentNumbers
        });

        return documentNumbers.join(', ');
    }

    function updateOrdersStatus(savedSearchId) {
        var searchResult = search.load({
            id: savedSearchId
        }).run().each(function(result) {
            var orderId = result.getValue({
                name: 'internalid',
                summary: 'GROUP' // Ensure you are using GROUP for summary search
            });

            log.debug({
                title: 'Order ID to Update',
                details: orderId
            });

            if (orderId) {
                try {
                    var orderRecord = record.load({
                        type: record.Type.SALES_ORDER,
                        id: orderId,
                        isDynamic: true
                    });
                    orderRecord.setValue({
                        fieldId: 'custbody_3rd_party_status',
                        value: 10 // Replace with your desired value
                    });
                    orderRecord.save();
                    log.debug({
                        title: 'Order Updated',
                        details: 'Order ID: ' + orderId + ' updated successfully.'
                    });
                } catch (e) {
                    log.error({
                        title: 'Error Updating Order',
                        details: 'Order ID: ' + orderId + ', Error: ' + e.toString()
                    });
                }
            } else {
                log.error({
                    title: 'Missing Order ID',
                    details: 'No Order ID found in search result.'
                });
            }
            return true; // Continue iterating
        });
    }

    function getPreviousMonth() {
        var today = new Date();
        var prevMonth = new Date(today.getFullYear(), today.getMonth() - 1);

        var monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        var month = monthNames[prevMonth.getMonth()];
        var year = prevMonth.getFullYear();

        return month + ' ' + year;
    }

    return {
        execute: execute
    };
});
