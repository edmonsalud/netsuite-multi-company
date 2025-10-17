function handleFormSubmission(context) {
    const request = context.request;
    
    // Get form values
    let orderId = request.parameters.custpage_order_id;
    const orderNumber = request.parameters.custpage_order_number;
    const customerName = request.parameters.custpage_customer_name;
    const installationStatus = request.parameters.custpage_installation_status;
    const completedDate = request.parameters.custpage_completed_date;
    const notes = request.parameters.custpage_notes;

    try {
        // If order was manually entered (not validated via RESTlet)
        if (orderId === 'MANUAL_ENTRY' || !orderId) {
            log.audit('Manual Order Entry', {
                orderNumber: orderNumber,
                customerName: customerName
            });
            
            // Validate the order exists server-side
            const orderSearch = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ['type', 'anyof', 'SalesOrd', 'CashSale'],
                    'AND',
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['tranid', 'is', orderNumber]
                ],
                columns: ['internalid', 'type']
            });
            
            const searchResults = orderSearch.run().getRange({
                start: 0,
                end: 1
            });
            
            if (searchResults.length === 0) {
                throw new Error('Order number ' + orderNumber + ' not found. Please verify the order number and try again.');
            }
            
            // Get the actual internal ID and type
            orderId = searchResults[0].getValue('internalid');
            const orderType = searchResults[0].getValue('type');
            
            // Determine record type for update
            const recordType = orderType === 'CashSale' ? 
                record.Type.CASH_SALE : record.Type.SALES_ORDER;
        } else {
            // Order was validated via RESTlet, we have the ID
            const recordType = record.Type.SALES_ORDER; // Default to Sales Order
        }
        
        // Map the installation status to internal IDs
        const statusMapping = {
            'completed': '3',  // Service Completed (Complete)
            'cancelled': '5'   // 3rd Party has Cancelled (Cancelled)
        };

        const statusInternalId = statusMapping[installationStatus];
        
        // Get current timestamp as Date object
        const now = new Date();
        const formSubmissionDate = format.format({
            value: now,
            type: format.Type.DATETIME
        });

        // Convert the date string (YYYY-MM-DD) to a Date object
        const dateParts = completedDate.split('-');
        const installationDate = new Date(
            parseInt(dateParts[0]),     // year
            parseInt(dateParts[1]) - 1,  // month (0-indexed)
            parseInt(dateParts[2])       // day
        );

        // First, try to load the record to get existing notes
        let existingNotes = '';
        let recordType = record.Type.SALES_ORDER; // Default
        
        try {
            // Try as Sales Order first
            const orderRecord = record.load({
                type: record.Type.SALES_ORDER,
                id: orderId,
                isDynamic: false
            });
            existingNotes = orderRecord.getValue('custbody_3rd_party_notes') || '';
        } catch (loadError) {
            // If failed, try as Cash Sale
            try {
                const orderRecord = record.load({
                    type: record.Type.CASH_SALE,
                    id: orderId,
                    isDynamic: false
                });
                existingNotes = orderRecord.getValue('custbody_3rd_party_notes') || '';
                recordType = record.Type.CASH_SALE;
            } catch (cashSaleError) {
                log.error('Error loading order for notes', {
                    orderId: orderId,
                    error: cashSaleError.message
                });
            }
        }

        // Format the new notes with prefix
        let updatedNotes = existingNotes;
        if (notes && notes.trim()) {
            const dateForPrefix = format.format({
                value: now,
                type: format.Type.DATE
            });
            const notesPrefix = existingNotes ? '\n' : ''; // Add newline only if there are existing notes
            updatedNotes = existingNotes + notesPrefix + 'Dealer ' + dateForPrefix + ' : ' + notes.trim();
        }

        // Update the record
        const updateValues = {
            custbody_3rd_party_status: statusInternalId,
            custbody_3rd_party_update_timestamp: now,
            custbody_3rd_party_scheduled_date: installationDate
        };

        if (updatedNotes) {
            updateValues.custbody_3rd_party_notes = updatedNotes;
        }

        // Submit the field updates
        record.submitFields({
            type: recordType,
            id: orderId,
            values: updateValues,
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true
            }
        });

        // Log the successful submission
        log.audit('Order Response Submitted Successfully', {
            orderId: orderId,
            orderNumber: orderNumber,
            recordType: recordType,
            customerName: customerName,
            installationStatus: installationStatus + ' (Internal ID: ' + statusInternalId + ')',
            completedDate: completedDate,
            submissionTimestamp: formSubmissionDate,
            notesAppended: notes ? 'Yes' : 'No',
            validationMethod: orderId === 'MANUAL_ENTRY' ? 'Server-side validation' : 'RESTlet validation'
        });

        // Show success page (your existing success page code)
        // ...
        
    } catch (e) {
        log.error('Error processing form submission', {
            error: e.message,
            stack: e.stack,
            orderNumber: orderNumber
        });
        
        // Show error page (your existing error page code)
        // ...
    }
}