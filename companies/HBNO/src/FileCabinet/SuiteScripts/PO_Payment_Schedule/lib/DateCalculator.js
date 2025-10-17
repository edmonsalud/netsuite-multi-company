/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * DateCalculator.js
 * Date calculation utilities for PO Payment Schedule system
 * Simplified version - Calendar days only
 *
 * Version: 1.0.0
 * Author: HBNO Development Team
 */
define(['N/log', 'N/format', 'N/search', './Constants'],
function(log, format, search, Constants) {

    /**
     * Calculate payment date based on trigger type and configuration
     * @param {Object} params - Calculation parameters
     * @param {String} params.triggerType - Payment trigger type ID
     * @param {Number} params.daysOffset - Number of days to add
     * @param {Date} params.baseDate - Base date for calculation
     * @param {Object} params.purchaseOrder - Purchase Order record
     * @returns {Date} Calculated payment date
     */
    function calculatePaymentDate(params) {
        try {
            log.debug('calculatePaymentDate', 'Params: ' + JSON.stringify(params));

            let baseDate = null;
            const triggerType = String(params.triggerType);
            const daysOffset = parseInt(params.daysOffset) || 0;

            // Determine base date based on trigger type
            switch (triggerType) {
                case Constants.TRIGGER_TYPES.QIMA.id:
                    baseDate = handleQIMATrigger(params);
                    break;

                case Constants.TRIGGER_TYPES.ON_RECEIPT.id:
                    baseDate = handleOnReceiptTrigger(params);
                    break;

                case Constants.TRIGGER_TYPES.AFTER_RECEIPT.id:
                    baseDate = handleAfterReceiptTrigger(params);
                    break;

                case Constants.TRIGGER_TYPES.ON_BOL.id:
                    baseDate = handleBOLTrigger(params);
                    break;

                case Constants.TRIGGER_TYPES.ADVANCED_START_PRODUCTION.id:
                    baseDate = handleProductionStartTrigger(params);
                    break;

                case Constants.TRIGGER_TYPES.ADVANCED_PRIOR_SHIPPING.id:
                    baseDate = handlePriorShippingTrigger(params);
                    break;

                default:
                    log.error('calculatePaymentDate', 'Unknown trigger type: ' + triggerType);
                    // Default to After Receipt behavior
                    baseDate = handleAfterReceiptTrigger(params);
            }

            // If no base date could be determined, use PO date as fallback
            if (!baseDate) {
                baseDate = params.baseDate || new Date();
                log.audit('calculatePaymentDate', 'Using fallback base date: ' + baseDate);
            }

            // Add calendar days offset
            const paymentDate = addCalendarDays(baseDate, daysOffset);

            log.debug('calculatePaymentDate', 'Calculated date: ' + paymentDate);
            return paymentDate;

        } catch (e) {
            log.error('calculatePaymentDate', 'Error calculating payment date: ' + e.message);
            // Return base date as fallback
            return params.baseDate || new Date();
        }
    }

    /**
     * Handle QIMA trigger type
     * @param {Object} params - Parameters object
     * @returns {Date} Base date for payment
     */
    function handleQIMATrigger(params) {
        // QIMA trigger logic - typically based on quality inspection date
        // For now, using PO date + standard offset
        // TODO: Implement actual QIMA date retrieval logic
        log.audit('handleQIMATrigger', 'Processing QIMA trigger');
        return params.baseDate || params.purchaseOrder.getValue('trandate');
    }

    /**
     * Handle On Receipt trigger type
     * @param {Object} params - Parameters object
     * @returns {Date} Base date for payment
     */
    function handleOnReceiptTrigger(params) {
        log.audit('handleOnReceiptTrigger', 'Processing On Receipt trigger');

        // Skip receipt search on CREATE context to save governance units
        if (!params.isCreate) {
            // Try to get Item Receipt date
            const receiptDate = getItemReceiptDate(params.purchaseOrder.id);
            if (receiptDate) {
                return receiptDate;
            }
        } else {
            log.debug('handleOnReceiptTrigger', 'Skipping receipt search - CREATE context');
        }

        // Fallback to custbody1
        const customDate = params.purchaseOrder.getValue(Constants.PO_FIELDS.DATE_REFERENCE);
        if (customDate) {
            return parseDate(customDate);
        }

        // Final fallback to PO date
        return params.baseDate || parseDate(params.purchaseOrder.getValue('trandate'));
    }

    /**
     * Handle After Receipt trigger type
     * @param {Object} params - Parameters object
     * @returns {Date} Base date for payment
     */
    function handleAfterReceiptTrigger(params) {
        log.audit('handleAfterReceiptTrigger', 'Processing After Receipt trigger');

        // Skip receipt search on CREATE context to save governance units
        if (!params.isCreate) {
            // Try to get Item Receipt date first
            const receiptDate = getItemReceiptDate(params.purchaseOrder.id);
            if (receiptDate) {
                log.debug('handleAfterReceiptTrigger', 'Using Item Receipt date: ' + receiptDate);
                return receiptDate;
            }
        } else {
            log.debug('handleAfterReceiptTrigger', 'Skipping receipt search - CREATE context');
        }

        // If no receipt, use custbody1 as reference date
        const customDate = params.purchaseOrder.getValue(Constants.PO_FIELDS.DATE_REFERENCE);
        if (customDate) {
            log.debug('handleAfterReceiptTrigger', 'Using custbody1 date: ' + customDate);
            return parseDate(customDate);
        }

        // Final fallback to PO date
        const poDate = params.purchaseOrder.getValue('trandate');
        log.debug('handleAfterReceiptTrigger', 'Using PO date as fallback: ' + poDate);
        return parseDate(poDate);
    }

    /**
     * Handle BOL (Bill of Lading) trigger type
     * @param {Object} params - Parameters object
     * @returns {Date} Base date for payment
     */
    function handleBOLTrigger(params) {
        // BOL trigger logic - would typically look for BOL date field
        // TODO: Implement actual BOL date retrieval logic
        log.audit('handleBOLTrigger', 'Processing BOL trigger');
        return params.baseDate || params.purchaseOrder.getValue('trandate');
    }

    /**
     * Handle Production Start trigger type
     * @param {Object} params - Parameters object
     * @returns {Date} Base date for payment
     */
    function handleProductionStartTrigger(params) {
        // Production start trigger logic
        // TODO: Implement actual production start date retrieval logic
        log.audit('handleProductionStartTrigger', 'Processing Production Start trigger');
        return params.baseDate || params.purchaseOrder.getValue('trandate');
    }

    /**
     * Handle Prior to Shipping trigger type
     * @param {Object} params - Parameters object
     * @returns {Date} Base date for payment
     */
    function handlePriorShippingTrigger(params) {
        // Prior to shipping trigger logic
        // TODO: Implement actual shipping date retrieval logic
        log.audit('handlePriorShippingTrigger', 'Processing Prior to Shipping trigger');

        // Could look for expected ship date on PO
        const expectedShipDate = params.purchaseOrder.getValue('shipdate');
        if (expectedShipDate) {
            return parseDate(expectedShipDate);
        }

        return params.baseDate || params.purchaseOrder.getValue('trandate');
    }

    /**
     * Get Item Receipt date for a Purchase Order
     * @param {String} poId - Purchase Order internal ID
     * @returns {Date|null} Item Receipt date or null if not found
     */
    function getItemReceiptDate(poId) {
        try {
            // Search for Item Receipts related to this PO
            const receiptSearch = search.create({
                type: search.Type.ITEM_RECEIPT,
                filters: [
                    ['createdfrom', 'anyof', poId],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    search.createColumn({
                        name: 'trandate',
                        sort: search.Sort.ASC
                    })
                ]
            });

            let receiptDate = null;
            receiptSearch.run().each(function(result) {
                // Get the first (earliest) receipt date
                const dateStr = result.getValue('trandate');
                if (dateStr) {
                    receiptDate = parseDate(dateStr);
                    return false; // Stop iteration after first result
                }
                return true;
            });

            if (receiptDate) {
                log.debug('getItemReceiptDate', 'Found receipt date for PO ' + poId + ': ' + receiptDate);
            }
            return receiptDate;

        } catch (e) {
            log.error('getItemReceiptDate', 'Error getting receipt date: ' + e.message);
            return null;
        }
    }

    /**
     * Add calendar days to a date
     * @param {Date} startDate - Starting date
     * @param {Number} days - Number of days to add
     * @returns {Date} New date
     */
    function addCalendarDays(startDate, days) {
        const result = new Date(startDate);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * Parse date from various formats
     * @param {String|Date} dateValue - Date value to parse
     * @returns {Date} Parsed date
     */
    function parseDate(dateValue) {
        if (!dateValue) return null;

        if (dateValue instanceof Date) {
            return dateValue;
        }

        try {
            // Try NetSuite format parsing
            return format.parse({
                value: dateValue,
                type: format.Type.DATE
            });
        } catch (e) {
            // Try standard JavaScript parsing as fallback
            const parsed = new Date(dateValue);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
        }

        return null;
    }

    /**
     * Format date for NetSuite
     * @param {Date} date - Date to format
     * @returns {String} Formatted date string
     */
    function formatDate(date) {
        if (!date) return '';

        try {
            return format.format({
                value: date,
                type: format.Type.DATE
            });
        } catch (e) {
            // Fallback to simple format
            return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
        }
    }

    /**
     * Calculate all payment dates for a PO
     * @param {Object} params - Parameters for calculation
     * @param {Array} params.scheduleDetails - Schedule detail records
     * @param {Object} params.purchaseOrder - Purchase Order record
     * @param {Boolean} params.isCreate - True if this is a CREATE operation (default: false)
     * @returns {Array} Array of calculated dates
     */
    function calculateAllPaymentDates(params) {
        const results = [];

        try {
            const scheduleDetails = params.scheduleDetails;
            const purchaseOrder = params.purchaseOrder;
            const isCreate = params.isCreate || false;

            scheduleDetails.forEach(function(detail) {
                const triggerType = detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.TRIGGER);
                const daysOffset = parseInt(detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.NUMBER_OF_DAYS)) || 0;
                const paymentNumber = detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.PAYMENT_NUMBER);

                const paymentDate = calculatePaymentDate({
                    triggerType: triggerType,
                    daysOffset: daysOffset,
                    baseDate: parseDate(purchaseOrder.getValue('trandate')),
                    purchaseOrder: purchaseOrder,
                    isCreate: isCreate
                });

                results.push({
                    paymentNumber: paymentNumber,
                    date: paymentDate,
                    formattedDate: formatDate(paymentDate),
                    triggerType: triggerType,
                    daysOffset: daysOffset
                });
            });

        } catch (e) {
            log.error('calculateAllPaymentDates', 'Error calculating payment dates: ' + e.message);
        }

        return results;
    }

    return {
        calculatePaymentDate: calculatePaymentDate,
        calculateAllPaymentDates: calculateAllPaymentDates,
        addCalendarDays: addCalendarDays,
        parseDate: parseDate,
        formatDate: formatDate,
        getItemReceiptDate: getItemReceiptDate
    };
});