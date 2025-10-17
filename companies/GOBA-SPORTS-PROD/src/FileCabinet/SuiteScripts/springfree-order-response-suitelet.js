/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/log', 'N/redirect', 'N/record', 'N/url', 'N/format'], 
function(serverWidget, search, log, redirect, record, url, format) {

    /**
     * Definition of the Suitelet script trigger point.
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        if (context.request.method === 'GET') {
            createForm(context);
        } else {
            handleFormSubmission(context);
        }
    }

    function createForm(context) {
        // Create form
        const form = serverWidget.createForm({
            title: ' ' // We'll use custom title in HTML
        });

        // Add extensive modern styling and HTML structure
        const htmlField = form.addField({
            id: 'custpage_html_css',
            type: serverWidget.FieldType.INLINEHTML,
            label: ' '
        });
        
        htmlField.defaultValue = `
            <style>
                /* Hide NetSuite default styling */
                .uir-page-title-firstline, .uir-page-title-secondline {
                    display: none !important;
                }
                
                /* Modern Variables */
                :root {
                    --primary-color: #10b981;
                    --primary-light: #d1fae5;
                    --primary-dark: #047857;
                    --bg-color: #f0fdf4;
                    --card-bg: #ffffff;
                    --text-primary: #1f2937;
                    --text-secondary: #6b7280;
                    --border-color: #e5e7eb;
                    --error-color: #ef4444;
                    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }

                /* Base Styles */
                body {
                    background-color: var(--bg-color) !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }

                /* Container */
                .modern-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                /* Header */
                .modern-header {
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
                    color: white;
                    padding: 3rem 2rem;
                    border-radius: 16px 16px 0 0;
                    text-align: center;
                    margin: -2rem -2rem 0 -2rem;
                }

                .modern-header h1 {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin: 0;
                    letter-spacing: -0.025em;
                }

                .modern-header p {
                    margin-top: 0.5rem;
                    font-size: 1.125rem;
                    opacity: 0.9;
                }

                /* Form Card */
                .form-card {
                    background: var(--card-bg);
                    border-radius: 0 0 16px 16px;
                    box-shadow: var(--shadow-lg);
                    padding: 2.5rem;
                    margin: 0 -2rem;
                }

                /* Instructions */
                .instructions {
                    background: var(--primary-light);
                    border-left: 4px solid var(--primary-color);
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                }

                .instructions p {
                    margin: 0.5rem 0;
                    color: var(--primary-dark);
                    line-height: 1.6;
                }

                /* Form Groups */
                .form-group {
                    margin-bottom: 1.75rem;
                }

                .form-label {
                    display: block;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }

                .required-indicator {
                    color: var(--error-color);
                    margin-left: 0.25rem;
                }

                .help-text {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-top: 0.25rem;
                }

                /* Input Styles */
                .modern-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    background-color: #fafafa;
                }

                .modern-input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    background-color: white;
                    box-shadow: 0 0 0 3px var(--primary-light);
                }

                .modern-input:disabled {
                    background-color: #f3f4f6;
                    cursor: not-allowed;
                }

                /* Radio Button Styling */
                .radio-group {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .radio-wrapper {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1.5rem;
                    background: white;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .radio-wrapper:hover {
                    border-color: var(--primary-color);
                    background: var(--primary-light);
                }

                .radio-wrapper.selected {
                    background: var(--primary-light);
                    border-color: var(--primary-color);
                }

                .radio-wrapper input[type="radio"] {
                    margin-right: 0.5rem;
                }

                /* Date Input */
                input[type="date"] {
                    cursor: pointer;
                }

                /* Textarea */
                textarea.modern-input {
                    min-height: 120px;
                    resize: vertical;
                }

                /* Submit Button */
                .submit-container {
                    margin-top: 2rem;
                    text-align: center;
                }

                .modern-submit {
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
                    color: white;
                    border: none;
                    padding: 1rem 3rem;
                    font-size: 1.125rem;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: var(--shadow);
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }

                .modern-submit:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                }

                .modern-submit:active {
                    transform: translateY(0);
                }

                .modern-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                /* Error message */
                .error-message {
                    color: var(--error-color);
                    font-size: 0.875rem;
                    margin-top: 0.5rem;
                    display: none;
                }

                /* Hide NetSuite default elements */
                .uir-form-content > table {
                    display: none !important;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .modern-container {
                        padding: 1rem;
                    }
                    
                    .modern-header {
                        padding: 2rem 1rem;
                    }
                    
                    .form-card {
                        padding: 1.5rem;
                    }
                    
                    .radio-group {
                        flex-direction: column;
                    }
                }
            </style>
        `;

        // Add the modern form HTML structure - Simplified without auto-suggest
        const formHTML = form.addField({
            id: 'custpage_form_html',
            type: serverWidget.FieldType.INLINEHTML,
            label: ' '
        });

        formHTML.defaultValue = `
            <div class="modern-container">
                <div class="modern-header">
                    <h1>Springfree Order Responses</h1>
                    <p>Provide status updates on Springfree Trampoline Orders</p>
                </div>
                
                <div class="form-card">
                    <div class="instructions">
                        <p>📋 This form should be used to provide status updates on Springfree Trampoline Orders</p>
                        <p>🔒 When you submit this form, it will not automatically collect your details like name and email address unless you provide it yourself.</p>
                    </div>

                    <form id="orderResponseForm">
                        <!-- Order Number Field - Manual Entry -->
                        <div class="form-group">
                            <label class="form-label">
                                Order Number
                                <span class="required-indicator">*</span>
                            </label>
                            <input type="text" 
                                   id="orderNumberInput" 
                                   class="modern-input" 
                                   placeholder="Enter order number (e.g., SO12345, ORDUS678)"
                                   name="custpage_order_number"
                                   required>
                            <div class="help-text">Please enter the complete order number as provided</div>
                        </div>

                        <!-- Customer Name Field - Optional for display purposes -->
                        <div class="form-group">
                            <label class="form-label">
                                Customer Name (Optional)
                            </label>
                            <input type="text" 
                                   id="customerNameInput" 
                                   class="modern-input" 
                                   placeholder="Enter customer name (for your reference only)"
                                   name="custpage_customer_name">
                            <div class="help-text">This field is optional and for reference only</div>
                        </div>

                        <!-- Installation Status -->
                        <div class="form-group">
                            <label class="form-label">
                                Installation Status
                                <span class="required-indicator">*</span>
                            </label>
                            <div class="radio-group">
                                <div class="radio-wrapper selected">
                                    <input type="radio" 
                                           id="status_completed" 
                                           name="custpage_installation_status" 
                                           value="completed" 
                                           checked>
                                    <label for="status_completed">✅ Completed</label>
                                </div>
                                <div class="radio-wrapper">
                                    <input type="radio" 
                                           id="status_cancelled" 
                                           name="custpage_installation_status" 
                                           value="cancelled">
                                    <label for="status_cancelled">❌ Cancelled</label>
                                </div>
                            </div>
                        </div>

                        <!-- Installation Date -->
                        <div class="form-group">
                            <label class="form-label">
                                Installation Date
                                <span class="required-indicator">*</span>
                            </label>
                            <input type="date" 
                                   id="completedDateInput" 
                                   class="modern-input"
                                   name="custpage_completed_date"
                                   required>
                        </div>

                        <!-- Notes -->
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea id="notesInput" 
                                      class="modern-input" 
                                      placeholder="Enter any additional notes or comments"
                                      name="custpage_notes"></textarea>
                        </div>

                        <!-- Submit Button -->
                        <div class="submit-container">
                            <button type="submit" class="modern-submit" id="submitButton">
                                Submit Response
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <script>
                (function() {
                    const form = document.getElementById('orderResponseForm');

                    // Handle radio button styling
                    const radioWrappers = document.querySelectorAll('.radio-wrapper');
                    radioWrappers.forEach(wrapper => {
                        wrapper.addEventListener('click', function() {
                            radioWrappers.forEach(w => w.classList.remove('selected'));
                            this.classList.add('selected');
                            this.querySelector('input[type="radio"]').checked = true;
                        });
                    });

                    // Form submission
                    form.addEventListener('submit', function(e) {
                        e.preventDefault();
                        
                        // Basic client-side validation
                        const orderNumber = document.getElementById('orderNumberInput').value.trim();
                        const completedDate = document.getElementById('completedDateInput').value;
                        
                        if (!orderNumber) {
                            alert('Please enter an order number.');
                            document.getElementById('orderNumberInput').focus();
                            return;
                        }
                        
                        if (!completedDate) {
                            alert('Please select the installation date.');
                            document.getElementById('completedDateInput').focus();
                            return;
                        }

                        // Submit form
                        document.getElementById('submitButton').disabled = true;
                        document.getElementById('submitButton').textContent = 'Submitting...';
                        
                        // Create and submit the actual NetSuite form
                        const nsForm = document.createElement('form');
                        nsForm.method = 'POST';
                        nsForm.action = window.location.href;
                        
                        // Copy all form values
                        const inputs = form.querySelectorAll('input[name], textarea[name], input[type="radio"]:checked');
                        inputs.forEach(input => {
                            const hiddenField = document.createElement('input');
                            hiddenField.type = 'hidden';
                            hiddenField.name = input.name;
                            hiddenField.value = input.value;
                            nsForm.appendChild(hiddenField);
                        });
                        
                        document.body.appendChild(nsForm);
                        nsForm.submit();
                    });
                })();
            </script>
        `;

        // Hidden fields for NetSuite form processing (removed the order_id field since we'll search for it during submission)
        const hiddenOrderNumber = form.addField({
            id: 'custpage_order_number',
            type: serverWidget.FieldType.TEXT,
            label: 'Order Number'
        });
        hiddenOrderNumber.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        // Write the form to the response
        context.response.writePage(form);
    }

    function handleFormSubmission(context) {
        const request = context.request;
        
        // Get form values
        const orderNumber = request.parameters.custpage_order_number;
        const customerName = request.parameters.custpage_customer_name; // Captured but not used
        const installationStatus = request.parameters.custpage_installation_status;
        const completedDate = request.parameters.custpage_completed_date;
        const notes = request.parameters.custpage_notes;

        try {
            // Search for the order by order number
            const orderSearch = search.create({
                type: search.Type.SALES_ORDER,
                filters: [
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['tranid', 'is', orderNumber.toUpperCase()]
                ],
                columns: [
                    search.createColumn({name: 'internalid'}),
                    search.createColumn({name: 'entity'}),
                    search.createColumn({name: 'status'})
                ]
            });

            let orderId = null;
            let actualCustomerName = '';
            let orderStatus = '';

            orderSearch.run().each(function(result) {
                orderId = result.getValue('internalid');
                actualCustomerName = result.getText('entity');
                orderStatus = result.getText('status');
                return false; // Stop after first result
            });

            // Check if order was found
            if (!orderId) {
                throw new Error('Order number ' + orderNumber + ' was not found in the system. Please verify the order number and try again.');
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
                parseInt(dateParts[1]) - 1,  // month (0-indexed in JavaScript)
                parseInt(dateParts[2])       // day
            );

            // First, load the sales order to get existing notes (if any)
            let existingNotes = '';
            try {
                const orderRecord = record.load({
                    type: record.Type.SALES_ORDER,
                    id: orderId,
                    isDynamic: false
                });
                existingNotes = orderRecord.getValue('custbody_3rd_party_notes') || '';
            } catch (loadError) {
                log.error('Error loading order for notes', loadError);
                // Continue anyway - we'll just not have existing notes
            }

            // Format the new notes with prefix
            let updatedNotes = existingNotes;
            if (notes && notes.trim()) {
                // Format date for prefix (MM/DD/YYYY)
                const dateForPrefix = format.format({
                    value: now,
                    type: format.Type.DATE
                });
                
                // Add new notes with prefix
                const notesPrefix = `\nDealer ${dateForPrefix} : `;
                updatedNotes = existingNotes + notesPrefix + notes.trim();
            }

            // Update the Sales Order record
            const updateValues = {
                custbody_3rd_party_status: statusInternalId,
                custbody_3rd_party_update_timestamp: now,
                custbody_3rd_party_scheduled_date: installationDate
            };

            // Add updated notes if there are any (either existing or new)
            if (updatedNotes) {
                updateValues.custbody_3rd_party_notes = updatedNotes;
            }

            // Update the Sales Order
            record.submitFields({
                type: record.Type.SALES_ORDER,
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
                actualCustomerName: actualCustomerName,
                userEnteredCustomerName: customerName,
                installationStatus: installationStatus + ' (Internal ID: ' + statusInternalId + ')',
                completedDate: completedDate,
                submissionTimestamp: formSubmissionDate,
                notesAppended: notes ? 'Yes' : 'No',
                notes: notes
            });

            // Create a modern confirmation page
            const confirmForm = serverWidget.createForm({
                title: ' '
            });

            const confirmHTML = confirmForm.addField({
                id: 'custpage_confirmation',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });

            const statusDisplay = {
                'completed': '✅ Completed',
                'cancelled': '❌ Cancelled'
            };

            confirmHTML.defaultValue = '<style>' + getModernStyles() + `
                    .success-container {
                        max-width: 600px;
                        margin: 3rem auto;
                        text-align: center;
                    }
                    
                    .success-icon {
                        width: 80px;
                        height: 80px;
                        background: var(--primary-color);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 2rem;
                        animation: scaleIn 0.5s ease;
                    }
                    
                    .success-icon svg {
                        width: 40px;
                        height: 40px;
                        stroke: white;
                        stroke-width: 3;
                    }
                    
                    .success-message {
                        background: white;
                        padding: 2rem;
                        border-radius: 16px;
                        box-shadow: var(--shadow-lg);
                    }
                    
                    .success-title {
                        font-size: 2rem;
                        font-weight: 700;
                        color: var(--text-primary);
                        margin-bottom: 1rem;
                    }
                    
                    .success-details {
                        background: var(--primary-light);
                        padding: 1.5rem;
                        border-radius: 8px;
                        margin: 2rem 0;
                        text-align: left;
                    }
                    
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 0.5rem 0;
                        border-bottom: 1px solid rgba(16, 185, 129, 0.2);
                    }
                    
                    .detail-row:last-child {
                        border-bottom: none;
                    }
                    
                    .detail-label {
                        font-weight: 600;
                        color: var(--primary-dark);
                    }
                    
                    .detail-value {
                        color: var(--text-primary);
                    }
                    
                    .action-buttons {
                        margin-top: 2rem;
                        display: flex;
                        gap: 1rem;
                        justify-content: center;
                    }
                    
                    .action-button {
                        padding: 0.75rem 2rem;
                        border-radius: 8px;
                        font-weight: 600;
                        text-decoration: none;
                        transition: all 0.3s ease;
                        cursor: pointer;
                        border: none;
                        font-size: 1rem;
                    }
                    
                    .primary-button {
                        background: var(--primary-color);
                        color: white;
                    }
                    
                    .primary-button:hover {
                        background: var(--primary-dark);
                        transform: translateY(-2px);
                    }
                    
                    .secondary-button {
                        background: white;
                        color: var(--primary-color);
                        border: 2px solid var(--primary-color);
                    }
                    
                    .secondary-button:hover {
                        background: var(--primary-light);
                    }
                    
                    @keyframes scaleIn {
                        from {
                            transform: scale(0);
                            opacity: 0;
                        }
                        to {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                </style>
                
                <div class="success-container">
                    <div class="success-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    
                    <div class="success-message">
                        <h1 class="success-title">Response Submitted Successfully!</h1>
                        <p>The Sales Order has been updated with the installation status.</p>
                        
                        <div class="success-details">
                            <div class="detail-row">
                                <span class="detail-label">Order Number:</span>
                                <span class="detail-value">` + orderNumber + `</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Customer (System):</span>
                                <span class="detail-value">` + actualCustomerName + `</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Installation Status:</span>
                                <span class="detail-value">` + (statusDisplay[installationStatus] || installationStatus) + `</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Installation Date:</span>
                                <span class="detail-value">` + completedDate + `</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Submitted at:</span>
                                <span class="detail-value">` + formSubmissionDate + `</span>
                            </div>` +
                            (notes ? `
                            <div class="detail-row">
                                <span class="detail-label">Notes Added:</span>
                                <span class="detail-value">` + notes + `</span>
                            </div>` : '') + `
                        </div>
                        
                        <div class="action-buttons">
                            <button onclick="window.location.href='` + context.request.url + `'" class="action-button primary-button">
                                Submit Another Response
                            </button>
                            <button onclick="window.close()" class="action-button secondary-button">
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>`;

            context.response.writePage(confirmForm);

        } catch (e) {
            log.error('Error processing form submission', e);
            
            // Show error page
            const errorForm = serverWidget.createForm({
                title: ' '
            });

            const errorHTML = errorForm.addField({
                id: 'custpage_error',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });

            errorHTML.defaultValue = '<style>' + getModernStyles() + `
                    .error-container {
                        max-width: 600px;
                        margin: 3rem auto;
                        text-align: center;
                    }
                    
                    .error-icon {
                        width: 80px;
                        height: 80px;
                        background: var(--error-color);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 2rem;
                    }
                    
                    .error-icon svg {
                        width: 40px;
                        height: 40px;
                        stroke: white;
                        stroke-width: 3;
                    }
                    
                    .error-message {
                        background: white;
                        padding: 2rem;
                        border-radius: 16px;
                        box-shadow: var(--shadow-lg);
                    }
                    
                    .error-title {
                        font-size: 2rem;
                        font-weight: 700;
                        color: var(--error-color);
                        margin-bottom: 1rem;
                    }
                    
                    .error-details {
                        background: #fee2e2;
                        padding: 1rem;
                        border-radius: 8px;
                        margin: 1rem 0;
                        color: #991b1b;
                        font-family: monospace;
                        font-size: 0.875rem;
                    }
                </style>
                
                <div class="error-container">
                    <div class="error-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    
                    <div class="error-message">
                        <h1 class="error-title">Submission Error</h1>
                        <p>We encountered an error processing your submission. Please try again.</p>
                        
                        <div class="error-details">
                            ` + e.message + `
                        </div>
                        
                        <div class="action-buttons">
                            <button onclick="history.back()" class="action-button primary-button">
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>`;

            context.response.writePage(errorForm);
        }
    }

    function getModernStyles() {
        return `
            :root {
                --primary-color: #10b981;
                --primary-light: #d1fae5;
                --primary-dark: #047857;
                --bg-color: #f0fdf4;
                --card-bg: #ffffff;
                --text-primary: #1f2937;
                --text-secondary: #6b7280;
                --border-color: #e5e7eb;
                --error-color: #ef4444;
                --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
            
            body {
                background-color: var(--bg-color) !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            
            .uir-page-title-firstline, .uir-page-title-secondline {
                display: none !important;
            }
        `;
    }

    return {
        onRequest: onRequest
    };
});