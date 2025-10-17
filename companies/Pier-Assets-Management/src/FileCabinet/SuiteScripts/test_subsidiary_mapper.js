/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @description Test script for SubsidiaryMapper - displays all mappings and allows testing
 */

define(['N/ui/serverWidget', './subsidiary_mapper'],
    /**
     * @param {serverWidget} serverWidget
     * @param {SubsidiaryMapper} SubsidiaryMapper
     */
    function(serverWidget, SubsidiaryMapper) {

        /**
         * Displays test results for subsidiary mapper
         */
        function onRequest(context) {
            if (context.request.method === 'GET') {
                const form = serverWidget.createForm({
                    title: 'Subsidiary Mapper Test Results'
                });

                // Add test input field
                const customerField = form.addField({
                    id: 'custpage_customer_name',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Test Customer Name'
                });
                customerField.defaultValue = 'IC-PSOF LP';

                form.addSubmitButton({
                    label: 'Test Mapping'
                });

                // Display test results if submitted
                if (context.request.parameters.custpage_customer_name) {
                    const testCustomer = context.request.parameters.custpage_customer_name;

                    const resultField = form.addField({
                        id: 'custpage_result',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'Result'
                    });

                    const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer(testCustomer);
                    const details = SubsidiaryMapper.getSubsidiaryDetails(testCustomer);

                    let html = '<div style="background: #f0f0f0; padding: 15px; margin: 10px 0;">';
                    html += '<h3>Test Results for: ' + testCustomer + '</h3>';

                    if (subsidiaryId) {
                        html += '<p style="color: green;"><strong>✓ Mapping Found</strong></p>';
                        html += '<p><strong>Subsidiary ID:</strong> ' + subsidiaryId + '</p>';
                        html += '<p><strong>Subsidiary Name:</strong> ' + details.subsidiaryName + '</p>';
                    } else {
                        html += '<p style="color: red;"><strong>✗ No Mapping Found</strong></p>';
                        html += '<p>No subsidiary mapping exists for this customer.</p>';
                    }

                    html += '</div>';
                    resultField.defaultValue = html;
                }

                // Add section showing all common mappings
                const allMappingsField = form.addField({
                    id: 'custpage_all_mappings',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'All Mappings'
                });

                let mappingsHtml = '<div style="margin: 20px 0;">';
                mappingsHtml += '<h3>Common Subsidiary Mappings</h3>';
                mappingsHtml += '<table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">';
                mappingsHtml += '<tr style="background: #e0e0e0;">';
                mappingsHtml += '<th>Customer Name</th>';
                mappingsHtml += '<th>Subsidiary ID</th>';
                mappingsHtml += '<th>Subsidiary Name</th>';
                mappingsHtml += '</tr>';

                // Test common customers
                const testCustomers = [
                    'IC-PSOF LP',
                    'IC-Pier Active Transactions LLC',
                    'IC-Series 006',
                    'IC-Series 013',
                    'IC-Series 042',
                    'IC-PLFF I LP',
                    'IC-PMRF LP',
                    'IC-Plumeria 51'
                ];

                testCustomers.forEach(function(customerName) {
                    const details = SubsidiaryMapper.getSubsidiaryDetails(customerName);
                    if (details) {
                        mappingsHtml += '<tr>';
                        mappingsHtml += '<td>' + customerName + '</td>';
                        mappingsHtml += '<td>' + details.subsidiaryId + '</td>';
                        mappingsHtml += '<td>' + details.subsidiaryName + '</td>';
                        mappingsHtml += '</tr>';
                    }
                });

                mappingsHtml += '</table></div>';
                allMappingsField.defaultValue = mappingsHtml;

                context.response.writePage(form);
            }
        }

        return {
            onRequest: onRequest
        };
    }
);
