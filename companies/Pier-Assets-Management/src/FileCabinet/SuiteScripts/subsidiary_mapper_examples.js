/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @description Examples of using SubsidiaryMapper module in various contexts
 */

define(['N/record', 'N/log', './subsidiary_mapper'],
    /**
     * @param {record} record
     * @param {log} log
     * @param {SubsidiaryMapper} SubsidiaryMapper
     */
    function(record, log, SubsidiaryMapper) {

        /**
         * Example 1: User Event Script - Auto-set Subsidiary on Invoice
         * Automatically sets the subsidiary based on the customer
         */
        function beforeSubmit(context) {
            try {
                if (context.type !== context.UserEventType.CREATE &&
                    context.type !== context.UserEventType.EDIT) {
                    return;
                }

                const currentRecord = context.newRecord;

                // Get customer internal ID
                const customerId = currentRecord.getValue({ fieldId: 'entity' });

                if (customerId) {
                    // Load customer record to get customer name
                    const customerRec = record.load({
                        type: record.Type.CUSTOMER,
                        id: customerId
                    });

                    const customerName = customerRec.getValue({ fieldId: 'companyname' });

                    // Get subsidiary ID using mapper
                    const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer(customerName);

                    if (subsidiaryId) {
                        currentRecord.setValue({
                            fieldId: 'subsidiary',
                            value: subsidiaryId
                        });

                        log.audit({
                            title: 'Subsidiary Auto-Set',
                            details: `Customer: ${customerName} → Subsidiary ID: ${subsidiaryId}`
                        });
                    } else {
                        log.audit({
                            title: 'No Subsidiary Mapping',
                            details: `No subsidiary found for customer: ${customerName}`
                        });
                    }
                }
            } catch (e) {
                log.error({
                    title: 'Error in beforeSubmit',
                    details: e.toString()
                });
            }
        }

        /**
         * Example 2: Standalone function - Get Subsidiary by Customer Name
         */
        function getSubsidiaryForCustomer(customerName) {
            try {
                // Basic usage
                const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer(customerName);

                log.debug({
                    title: 'Subsidiary Lookup',
                    details: `Input: ${customerName}, Result: ${subsidiaryId}`
                });

                return subsidiaryId;
            } catch (e) {
                log.error({
                    title: 'Error getting subsidiary',
                    details: e.toString()
                });
                return null;
            }
        }

        /**
         * Example 3: Get full subsidiary details
         */
        function getFullSubsidiaryInfo(customerName) {
            try {
                const details = SubsidiaryMapper.getSubsidiaryDetails(customerName);

                if (details) {
                    log.audit({
                        title: 'Subsidiary Details',
                        details: JSON.stringify(details)
                    });
                    // Returns: { subsidiaryId: 8, subsidiaryName: 'PSOF LP' }
                    return details;
                } else {
                    return null;
                }
            } catch (e) {
                log.error({
                    title: 'Error getting subsidiary details',
                    details: e.toString()
                });
                return null;
            }
        }

        /**
         * Example 4: Validation - Check if mapping exists before processing
         */
        function validateCustomerHasSubsidiary(customerName) {
            try {
                const hasMapping = SubsidiaryMapper.hasSubsidiaryMapping(customerName);

                if (!hasMapping) {
                    log.audit({
                        title: 'Validation Failed',
                        details: `Customer ${customerName} does not have a subsidiary mapping`
                    });
                    return false;
                }

                return true;
            } catch (e) {
                log.error({
                    title: 'Error in validation',
                    details: e.toString()
                });
                return false;
            }
        }

        /**
         * Example 5: Bulk processing - Process multiple customers
         */
        function processBatchCustomers(customerNames) {
            try {
                const results = [];

                customerNames.forEach(function(customerName) {
                    const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer(customerName);

                    results.push({
                        customer: customerName,
                        subsidiary: subsidiaryId,
                        hasMapping: subsidiaryId !== null
                    });
                });

                log.audit({
                    title: 'Batch Processing Complete',
                    details: `Processed ${results.length} customers`
                });

                return results;
            } catch (e) {
                log.error({
                    title: 'Error in batch processing',
                    details: e.toString()
                });
                return [];
            }
        }

        // Return public functions
        return {
            beforeSubmit: beforeSubmit,

            // Utility functions (for testing or other scripts)
            getSubsidiaryForCustomer: getSubsidiaryForCustomer,
            getFullSubsidiaryInfo: getFullSubsidiaryInfo,
            validateCustomerHasSubsidiary: validateCustomerHasSubsidiary,
            processBatchCustomers: processBatchCustomers
        };
    }
);

/**
 * USAGE EXAMPLES:
 * ================
 *
 * 1. Simple lookup:
 *    const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer('IC-PSOF LP');
 *    // Returns: 8
 *
 * 2. Get full details:
 *    const details = SubsidiaryMapper.getSubsidiaryDetails('IC-Series 042');
 *    // Returns: { subsidiaryId: 77, subsidiaryName: 'Series 042' }
 *
 * 3. Check if mapping exists:
 *    const exists = SubsidiaryMapper.hasSubsidiaryMapping('IC-PSOF LP');
 *    // Returns: true
 *
 * 4. On a transaction record:
 *    const currentRecord = context.newRecord;
 *    const customerName = 'IC-PSOF LP';
 *    const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer(customerName);
 *
 *    currentRecord.setValue({
 *        fieldId: 'subsidiary',
 *        value: subsidiaryId
 *    });
 *
 * 5. In a search result:
 *    searchResults.forEach(function(result) {
 *        const customerName = result.getValue({ name: 'companyname', join: 'customer' });
 *        const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer(customerName);
 *        // Process with subsidiaryId...
 *    });
 */
