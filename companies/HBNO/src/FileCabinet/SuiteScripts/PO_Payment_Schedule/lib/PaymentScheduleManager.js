/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * PaymentScheduleManager.js
 * Core business logic for managing PO Payment Schedules
 * Simplified version - Create only, no updates or deletions
 *
 * Version: 1.0.0
 * Author: HBNO Development Team
 */
define(['N/record', 'N/search', 'N/log', 'N/runtime', 'N/error',
        './Constants', './ValidationHelper', './DateCalculator'],
function(record, search, log, runtime, error,
         Constants, ValidationHelper, DateCalculator) {

    /**
     * Main function to process payment schedules for a Purchase Order
     * @param {Object} purchaseOrder - Purchase Order record object
     * @returns {Object} Result object with success status and details
     */
    function processPaymentSchedules(purchaseOrder) {
        const result = {
            success: false,
            schedulesCreated: 0,
            errors: [],
            warnings: []
        };

        try {
            log.audit('processPaymentSchedules', 'Starting process for new PO: ' + purchaseOrder.id);

            // Step 1: Validate Purchase Order
            const poValidation = ValidationHelper.validatePurchaseOrder(purchaseOrder);
            if (!poValidation.isValid) {
                result.errors = poValidation.errors;
                log.error('processPaymentSchedules', ValidationHelper.formatValidationErrors(poValidation));
                return result;
            }
            if (poValidation.warnings) {
                result.warnings = poValidation.warnings;
            }

            // Step 2: Load Payment Terms
            const paymentTermsId = poValidation.data.paymentTermsId;
            const paymentTerms = loadPaymentTerms(paymentTermsId);
            if (!paymentTerms) {
                result.errors.push('Failed to load payment terms: ' + paymentTermsId);
                return result;
            }

            // Step 3: Validate Payment Terms
            const termsValidation = ValidationHelper.validatePaymentTerms(paymentTerms);
            if (!termsValidation.isValid) {
                result.errors = result.errors.concat(termsValidation.errors);
                return result;
            }

            // Step 4: Load Payment Schedule Details
            const numberOfPayments = paymentTerms.getValue(Constants.PAYMENT_TERMS_FIELDS.NUMBER_OF_PAYMENTS);
            const scheduleDetails = loadPaymentScheduleDetails(paymentTermsId);

            // Step 5: Validate Schedule Details
            const detailsValidation = ValidationHelper.validateScheduleDetails(scheduleDetails, numberOfPayments);
            if (!detailsValidation.isValid) {
                result.errors = result.errors.concat(detailsValidation.errors);
                return result;
            }
            if (detailsValidation.warnings) {
                result.warnings = result.warnings.concat(detailsValidation.warnings);
            }

            // Step 6: Check for existing schedules to prevent duplicates
            const existingSchedules = getScheduleSummary(purchaseOrder.id);
            if (existingSchedules.count > 0) {
                result.errors.push('Payment schedules already exist for this PO. Found ' +
                                 existingSchedules.count + ' existing schedule(s).');
                log.warning('processPaymentSchedules',
                           'Skipping schedule creation - ' + existingSchedules.count +
                           ' schedule(s) already exist for PO: ' + purchaseOrder.id);
                return result;
            }

            // Step 7: Calculate and create new schedules
            const schedules = calculateSchedules({
                purchaseOrder: purchaseOrder,
                scheduleDetails: scheduleDetails,
                poData: poValidation.data
            });

            // Step 8: Create schedule records
            const createdSchedules = createScheduleRecords(schedules, purchaseOrder.id);
            result.schedulesCreated = createdSchedules.length;
            result.success = true;

            log.audit('processPaymentSchedules',
                'Successfully created ' + result.schedulesCreated + ' schedules for PO: ' + purchaseOrder.id);

        } catch (e) {
            log.error('processPaymentSchedules', 'Error processing schedules: ' + e.message);
            result.errors.push('Processing error: ' + e.message);
        }

        return result;
    }

    /**
     * Load payment terms record
     * @param {String} paymentTermsId - Internal ID of payment terms
     * @returns {Object} Payment terms record or null
     */
    function loadPaymentTerms(paymentTermsId) {
        try {
            return record.load({
                type: Constants.RECORD_TYPES.CUSTOM_PAYMENT_TERMS,
                id: paymentTermsId,
                isDynamic: false
            });
        } catch (e) {
            log.error('loadPaymentTerms', 'Error loading payment terms ' + paymentTermsId + ': ' + e.message);
            return null;
        }
    }

    /**
     * Load payment schedule details for a payment term
     * @param {String} paymentTermsId - Internal ID of payment terms
     * @returns {Array} Array of schedule detail records
     */
    function loadPaymentScheduleDetails(paymentTermsId) {
        const details = [];

        try {
            const detailSearch = search.create({
                type: Constants.RECORD_TYPES.TERMS_PAYMENT_DETAILS,
                filters: [
                    [Constants.PAYMENT_DETAILS_FIELDS.TERMS, 'anyof', paymentTermsId]
                ],
                columns: [
                    Constants.PAYMENT_DETAILS_FIELDS.PAYMENT_NUMBER,
                    Constants.PAYMENT_DETAILS_FIELDS.TRIGGER,
                    Constants.PAYMENT_DETAILS_FIELDS.PERCENTAGE,
                    Constants.PAYMENT_DETAILS_FIELDS.NUMBER_OF_DAYS,
                    Constants.PAYMENT_DETAILS_FIELDS.DESCRIPTOR
                ]
            });

            detailSearch.run().each(function(result) {
                details.push({
                    id: result.id,
                    getValue: function(fieldId) {
                        return result.getValue(fieldId);
                    },
                    getText: function(fieldId) {
                        return result.getText(fieldId);
                    }
                });
                return true;
            });

            // Sort by payment number
            details.sort(function(a, b) {
                const aNum = parseInt(a.getValue(Constants.PAYMENT_DETAILS_FIELDS.PAYMENT_NUMBER)) || 0;
                const bNum = parseInt(b.getValue(Constants.PAYMENT_DETAILS_FIELDS.PAYMENT_NUMBER)) || 0;
                return aNum - bNum;
            });

            log.debug('loadPaymentScheduleDetails', 'Loaded ' + details.length + ' schedule details');

        } catch (e) {
            log.error('loadPaymentScheduleDetails', 'Error loading schedule details: ' + e.message);
        }

        return details;
    }

    /**
     * Calculate payment schedules based on configuration
     * @param {Object} params - Calculation parameters
     * @returns {Array} Array of calculated schedule objects
     */
    function calculateSchedules(params) {
        const schedules = [];
        const poTotal = params.poData.total;

        try {
            // Calculate dates for all schedules (calendar days only)
            // Pass isCreate=true to skip receipt searches and save governance units
            const calculatedDates = DateCalculator.calculateAllPaymentDates({
                scheduleDetails: params.scheduleDetails,
                purchaseOrder: params.purchaseOrder,
                isCreate: true
            });

            // Create schedule objects and track total for rounding adjustment
            let runningTotal = 0;

            params.scheduleDetails.forEach(function(detail, index) {
                const percentage = parseFloat(detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.PERCENTAGE)) || 0;
                const amount = (poTotal * percentage) / 100;
                const dateInfo = calculatedDates[index] || {};

                // Sanitize descriptor field
                const rawDescriptor = detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.DESCRIPTOR) || '';
                const sanitizedDescriptor = ValidationHelper.validateAndSanitizeDescriptor(rawDescriptor);

                schedules.push({
                    paymentNumber: detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.PAYMENT_NUMBER),
                    date: dateInfo.date || new Date(),
                    amount: parseFloat(amount.toFixed(2)),
                    percentage: percentage,
                    descriptor: sanitizedDescriptor.sanitized,
                    triggerType: detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.TRIGGER),
                    daysOffset: detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.NUMBER_OF_DAYS) || 0
                });

                runningTotal += parseFloat(amount.toFixed(2));
            });

            // Fix rounding errors by adjusting the last payment schedule
            if (schedules.length > 0) {
                const roundingDifference = poTotal - runningTotal;

                if (Math.abs(roundingDifference) > 0.001) {
                    const lastSchedule = schedules[schedules.length - 1];
                    lastSchedule.amount = parseFloat((lastSchedule.amount + roundingDifference).toFixed(2));

                    log.audit('calculateSchedules',
                        'Adjusted last payment schedule by ' + roundingDifference.toFixed(2) +
                        ' to match PO total of ' + poTotal.toFixed(2));
                }
            }

            log.debug('calculateSchedules', 'Calculated ' + schedules.length + ' schedules');

        } catch (e) {
            log.error('calculateSchedules', 'Error calculating schedules: ' + e.message);
        }

        return schedules;
    }

    /**
     * Create payment schedule records
     * @param {Array} schedules - Array of schedule objects
     * @param {String} poId - Purchase Order internal ID
     * @returns {Array} Array of created record IDs
     */
    function createScheduleRecords(schedules, poId) {
        const createdIds = [];

        try {
            schedules.forEach(function(schedule) {
                try {
                    // Check governance
                    const remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                    if (remainingUsage < Constants.GOVERNANCE.THRESHOLD_CRITICAL) {
                        throw error.create({
                            name: 'GOVERNANCE_EXCEEDED',
                            message: Constants.ERROR_MESSAGES.GOVERNANCE_EXCEEDED
                        });
                    }

                    // Create schedule record
                    const scheduleRecord = record.create({
                        type: Constants.RECORD_TYPES.PO_PAYMENT_SCHEDULE,
                        isDynamic: false
                    });

                    // Set field values
                    scheduleRecord.setValue({
                        fieldId: Constants.SCHEDULE_FIELDS.PURCHASE_ORDER,
                        value: poId
                    });

                    scheduleRecord.setValue({
                        fieldId: Constants.SCHEDULE_FIELDS.DATE,
                        value: schedule.date
                    });

                    scheduleRecord.setValue({
                        fieldId: Constants.SCHEDULE_FIELDS.AMOUNT,
                        value: schedule.amount
                    });

                    scheduleRecord.setValue({
                        fieldId: Constants.SCHEDULE_FIELDS.PERCENTAGE,
                        value: schedule.percentage
                    });

                    scheduleRecord.setValue({
                        fieldId: Constants.SCHEDULE_FIELDS.DESCRIPTOR,
                        value: schedule.descriptor
                    });

                    scheduleRecord.setValue({
                        fieldId: Constants.SCHEDULE_FIELDS.PAYMENT_NUMBER,
                        value: schedule.paymentNumber
                    });

                    scheduleRecord.setValue({
                        fieldId: Constants.SCHEDULE_FIELDS.STATUS,
                        value: Constants.SCHEDULE_STATUS.OPEN
                    });

                    // Save record
                    const scheduleId = scheduleRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: false
                    });

                    createdIds.push(scheduleId);
                    log.debug('createScheduleRecords', 'Created schedule ' + scheduleId +
                              ' for payment #' + schedule.paymentNumber);

                } catch (e) {
                    log.error('createScheduleRecords',
                             'Error creating schedule for payment #' + schedule.paymentNumber + ': ' + e.message);

                    // ROLLBACK: Delete all successfully created schedules
                    if (createdIds.length > 0) {
                        log.audit('createScheduleRecords',
                                 'Rolling back ' + createdIds.length + ' created schedules due to error');
                        rollbackCreatedSchedules(createdIds);
                    }

                    throw e;
                }
            });

        } catch (e) {
            log.error('createScheduleRecords', 'Error in schedule creation process: ' + e.message);
            throw e;
        }

        return createdIds;
    }

    /**
     * Rollback (delete) created payment schedule records
     * @param {Array} scheduleIds - Array of schedule record IDs to delete
     * @returns {Object} Result object with deletion statistics
     */
    function rollbackCreatedSchedules(scheduleIds) {
        const result = {
            deleted: 0,
            failed: 0,
            errors: []
        };

        if (!scheduleIds || scheduleIds.length === 0) {
            return result;
        }

        try {
            scheduleIds.forEach(function(scheduleId) {
                try {
                    record.delete({
                        type: Constants.RECORD_TYPES.PO_PAYMENT_SCHEDULE,
                        id: scheduleId
                    });
                    result.deleted++;
                    log.debug('rollbackCreatedSchedules', 'Deleted schedule: ' + scheduleId);
                } catch (deleteError) {
                    result.failed++;
                    result.errors.push('Failed to delete schedule ' + scheduleId + ': ' + deleteError.message);
                    log.error('rollbackCreatedSchedules',
                             'Failed to delete schedule ' + scheduleId + ': ' + deleteError.message);
                }
            });

            log.audit('rollbackCreatedSchedules',
                     'Rollback complete. Deleted: ' + result.deleted + ', Failed: ' + result.failed);

        } catch (e) {
            log.error('rollbackCreatedSchedules', 'Error during rollback: ' + e.message);
        }

        return result;
    }

    /**
     * Get summary of payment schedules for a PO
     * @param {String} poId - Purchase Order internal ID
     * @returns {Object} Summary object with schedule details
     */
    function getScheduleSummary(poId) {
        const summary = {
            count: 0,
            totalAmount: 0,
            schedules: []
        };

        try {
            const scheduleSearch = search.create({
                type: Constants.RECORD_TYPES.PO_PAYMENT_SCHEDULE,
                filters: [
                    [Constants.SCHEDULE_FIELDS.PURCHASE_ORDER, 'anyof', poId]
                ],
                columns: [
                    Constants.SCHEDULE_FIELDS.PAYMENT_NUMBER,
                    Constants.SCHEDULE_FIELDS.DATE,
                    Constants.SCHEDULE_FIELDS.AMOUNT,
                    Constants.SCHEDULE_FIELDS.STATUS
                ]
            });

            scheduleSearch.run().each(function(result) {
                const amount = parseFloat(result.getValue(Constants.SCHEDULE_FIELDS.AMOUNT)) || 0;
                summary.totalAmount += amount;
                summary.count++;
                summary.schedules.push({
                    id: result.id,
                    paymentNumber: result.getValue(Constants.SCHEDULE_FIELDS.PAYMENT_NUMBER),
                    date: result.getValue(Constants.SCHEDULE_FIELDS.DATE),
                    amount: amount,
                    status: result.getValue(Constants.SCHEDULE_FIELDS.STATUS)
                });
                return true;
            });

        } catch (e) {
            log.error('getScheduleSummary', 'Error getting schedule summary: ' + e.message);
        }

        return summary;
    }

    return {
        processPaymentSchedules: processPaymentSchedules,
        loadPaymentTerms: loadPaymentTerms,
        loadPaymentScheduleDetails: loadPaymentScheduleDetails,
        calculateSchedules: calculateSchedules,
        createScheduleRecords: createScheduleRecords,
        getScheduleSummary: getScheduleSummary
    };
});