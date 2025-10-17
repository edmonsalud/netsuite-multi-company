/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * ValidationHelper.js
 * Validation utilities for PO Payment Schedule system
 *
 * Version: 1.0.0
 * Author: HBNO Development Team
 */
define(['N/log', './Constants'], function(log, Constants) {

    /**
     * Validates payment terms configuration
     * @param {Object} paymentTerms - Payment terms record object
     * @returns {Object} Validation result with isValid flag and errors array
     */
    function validatePaymentTerms(paymentTerms) {
        const result = {
            isValid: true,
            errors: []
        };

        try {
            // Check if payment terms exists
            if (!paymentTerms) {
                result.isValid = false;
                result.errors.push(Constants.ERROR_MESSAGES.MISSING_PAYMENT_TERMS);
                return result;
            }

            // Validate number of payments
            const numberOfPayments = paymentTerms.getValue({
                fieldId: Constants.PAYMENT_TERMS_FIELDS.NUMBER_OF_PAYMENTS
            });

            if (!numberOfPayments || numberOfPayments < Constants.VALIDATION.MIN_PAYMENT_SCHEDULES ||
                numberOfPayments > Constants.VALIDATION.MAX_PAYMENT_SCHEDULES) {
                result.isValid = false;
                result.errors.push('Number of payments must be between ' +
                    Constants.VALIDATION.MIN_PAYMENT_SCHEDULES + ' and ' +
                    Constants.VALIDATION.MAX_PAYMENT_SCHEDULES);
            }

            // Validate payment terms name
            const termsName = paymentTerms.getValue({
                fieldId: Constants.PAYMENT_TERMS_FIELDS.NAME
            });

            if (!termsName || termsName.trim() === '') {
                result.isValid = false;
                result.errors.push('Payment terms name is required');
            }

        } catch (e) {
            log.error('validatePaymentTerms', 'Error validating payment terms: ' + e.message);
            result.isValid = false;
            result.errors.push('Error validating payment terms: ' + e.message);
        }

        return result;
    }

    /**
     * Validates payment schedule details
     * @param {Array} scheduleDetails - Array of payment schedule detail records
     * @param {Number} expectedCount - Expected number of payment schedules
     * @returns {Object} Validation result with isValid flag and errors array
     */
    function validateScheduleDetails(scheduleDetails, expectedCount) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        try {
            // Check if we have the expected number of schedules
            if (!scheduleDetails || scheduleDetails.length === 0) {
                result.isValid = false;
                result.errors.push('No payment schedule details found');
                return result;
            }

            if (scheduleDetails.length !== expectedCount) {
                result.isValid = false;
                result.errors.push('Expected ' + expectedCount + ' payment schedules but found ' + scheduleDetails.length);
            }

            // Validate percentages sum to 100%
            let totalPercentage = 0;
            const paymentNumbers = new Set();

            scheduleDetails.forEach(function(detail, index) {
                // Check for duplicate payment numbers
                const paymentNumber = detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.PAYMENT_NUMBER);
                if (paymentNumbers.has(paymentNumber)) {
                    result.isValid = false;
                    result.errors.push(Constants.ERROR_MESSAGES.DUPLICATE_PAYMENT_NUMBER);
                }
                paymentNumbers.add(paymentNumber);

                // Sum percentages
                const percentage = parseFloat(detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.PERCENTAGE)) || 0;
                totalPercentage += percentage;

                // Validate individual percentage
                if (percentage <= 0 || percentage > Constants.VALIDATION.MAX_PERCENTAGE) {
                    result.isValid = false;
                    result.errors.push('Invalid percentage for payment #' + paymentNumber + ': ' + percentage);
                }

                // Validate trigger type
                const triggerType = detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.TRIGGER);
                if (!isValidTriggerType(triggerType)) {
                    result.isValid = false;
                    result.errors.push(Constants.ERROR_MESSAGES.INVALID_TRIGGER_TYPE.replace('{0}', triggerType));
                }

                // Validate days offset
                const daysOffset = parseInt(detail.getValue(Constants.PAYMENT_DETAILS_FIELDS.NUMBER_OF_DAYS)) || 0;
                if (daysOffset < Constants.VALIDATION.MIN_DAYS_OFFSET ||
                    daysOffset > Constants.VALIDATION.MAX_DAYS_OFFSET) {
                    result.warnings.push('Days offset out of range for payment #' + paymentNumber + ': ' + daysOffset);
                }
            });

            // Check if percentages sum to 100% (with small tolerance for rounding)
            const tolerance = 0.01;
            if (Math.abs(totalPercentage - 100) > tolerance) {
                result.isValid = false;
                result.errors.push(Constants.ERROR_MESSAGES.PERCENTAGE_MISMATCH.replace('{0}', totalPercentage.toFixed(2)));
            }

        } catch (e) {
            log.error('validateScheduleDetails', 'Error validating schedule details: ' + e.message);
            result.isValid = false;
            result.errors.push('Error validating schedule details: ' + e.message);
        }

        return result;
    }

    /**
     * Validates Purchase Order data
     * @param {Object} purchaseOrder - Purchase Order record object
     * @returns {Object} Validation result with isValid flag and errors array
     */
    function validatePurchaseOrder(purchaseOrder) {
        const result = {
            isValid: true,
            errors: [],
            data: {}
        };

        try {
            // Validate PO total
            const total = parseFloat(purchaseOrder.getValue('total')) || 0;
            if (total <= 0) {
                result.isValid = false;
                result.errors.push(Constants.ERROR_MESSAGES.MISSING_PO_TOTAL);
            } else {
                result.data.total = total;
            }

            // Validate payment terms field
            const paymentTermsId = purchaseOrder.getValue(Constants.PO_FIELDS.PAYMENT_TERMS_CUSTOM);
            if (!paymentTermsId) {
                result.isValid = false;
                result.errors.push(Constants.ERROR_MESSAGES.MISSING_PAYMENT_TERMS);
            } else {
                result.data.paymentTermsId = paymentTermsId;
            }

            // Check for date reference (custbody1)
            const dateReference = purchaseOrder.getValue(Constants.PO_FIELDS.DATE_REFERENCE);
            if (!dateReference) {
                result.warnings = result.warnings || [];
                result.warnings.push('No date reference (custbody1) found, will use transaction date');
                result.data.dateReference = purchaseOrder.getValue('trandate');
            } else {
                result.data.dateReference = dateReference;
            }

            // Get PO ID and number for reference
            result.data.poId = purchaseOrder.id;
            result.data.poNumber = purchaseOrder.getValue('tranid');
            result.data.vendorId = purchaseOrder.getValue('entity');
            result.data.tranDate = purchaseOrder.getValue('trandate');

        } catch (e) {
            log.error('validatePurchaseOrder', 'Error validating PO: ' + e.message);
            result.isValid = false;
            result.errors.push('Error validating Purchase Order: ' + e.message);
        }

        return result;
    }

    /**
     * Validates a trigger type ID
     * @param {String} triggerType - Trigger type ID to validate
     * @returns {Boolean} True if valid trigger type
     */
    function isValidTriggerType(triggerType) {
        const validTypes = Object.keys(Constants.TRIGGER_TYPES).map(function(key) {
            return Constants.TRIGGER_TYPES[key].id;
        });
        return validTypes.indexOf(String(triggerType)) !== -1;
    }

    /**
     * Validates date value
     * @param {Date|String} dateValue - Date to validate
     * @returns {Boolean} True if valid date
     */
    function isValidDate(dateValue) {
        if (!dateValue) return false;

        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        return date instanceof Date && !isNaN(date.getTime());
    }

    /**
     * Validates percentage value
     * @param {Number} percentage - Percentage to validate
     * @returns {Boolean} True if valid percentage
     */
    function isValidPercentage(percentage) {
        const value = parseFloat(percentage);
        return !isNaN(value) && value >= Constants.VALIDATION.MIN_PERCENTAGE &&
               value <= Constants.VALIDATION.MAX_PERCENTAGE;
    }

    /**
     * Validates amount value
     * @param {Number} amount - Amount to validate
     * @returns {Boolean} True if valid amount
     */
    function isValidAmount(amount) {
        const value = parseFloat(amount);
        return !isNaN(value) && value > 0;
    }

    /**
     * Comprehensive validation for schedule creation
     * @param {Object} params - Object containing PO, payment terms, and schedule details
     * @returns {Object} Comprehensive validation result
     */
    function validateScheduleCreation(params) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            validatedData: {}
        };

        // Validate Purchase Order
        const poValidation = validatePurchaseOrder(params.purchaseOrder);
        if (!poValidation.isValid) {
            result.isValid = false;
            result.errors = result.errors.concat(poValidation.errors);
        }
        result.validatedData.poData = poValidation.data;
        if (poValidation.warnings) {
            result.warnings = result.warnings.concat(poValidation.warnings);
        }

        // Validate Payment Terms
        if (params.paymentTerms) {
            const termsValidation = validatePaymentTerms(params.paymentTerms);
            if (!termsValidation.isValid) {
                result.isValid = false;
                result.errors = result.errors.concat(termsValidation.errors);
            }
        }

        // Validate Schedule Details
        if (params.scheduleDetails && params.expectedScheduleCount) {
            const detailsValidation = validateScheduleDetails(params.scheduleDetails, params.expectedScheduleCount);
            if (!detailsValidation.isValid) {
                result.isValid = false;
                result.errors = result.errors.concat(detailsValidation.errors);
            }
            if (detailsValidation.warnings) {
                result.warnings = result.warnings.concat(detailsValidation.warnings);
            }
        }

        return result;
    }

    /**
     * Formats validation errors for logging
     * @param {Object} validationResult - Validation result object
     * @returns {String} Formatted error message
     */
    function formatValidationErrors(validationResult) {
        if (validationResult.isValid) {
            return 'Validation successful';
        }

        let message = 'Validation failed:\n';
        if (validationResult.errors && validationResult.errors.length > 0) {
            message += 'Errors:\n' + validationResult.errors.map(function(err, i) {
                return '  ' + (i + 1) + '. ' + err;
            }).join('\n');
        }
        if (validationResult.warnings && validationResult.warnings.length > 0) {
            message += '\nWarnings:\n' + validationResult.warnings.map(function(warn, i) {
                return '  ' + (i + 1) + '. ' + warn;
            }).join('\n');
        }
        return message;
    }

    /**
     * Sanitizes text input to prevent script injection and malicious content
     * Removes or escapes potentially dangerous characters
     * @param {String} text - Text to sanitize
     * @param {Object} options - Sanitization options
     * @param {Number} options.maxLength - Maximum allowed length (default: 4000)
     * @param {Boolean} options.allowHtml - Whether to allow HTML tags (default: false)
     * @returns {String} Sanitized text
     */
    function sanitizeText(text, options) {
        // Set default options
        const opts = options || {};
        const maxLength = opts.maxLength || 4000;
        const allowHtml = opts.allowHtml || false;

        // Return empty string if input is null or undefined
        if (text == null) {
            return '';
        }

        // Convert to string if not already
        let sanitized = String(text);

        // Trim whitespace
        sanitized = sanitized.trim();

        // Enforce maximum length
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
            log.warning('sanitizeText', 'Text truncated to ' + maxLength + ' characters');
        }

        // If HTML is not allowed, remove/escape HTML special characters
        if (!allowHtml) {
            sanitized = sanitized
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        }

        // Remove null bytes and other control characters (except newlines, tabs, carriage returns)
        sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // Remove script-like patterns
        sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');

        return sanitized;
    }

    /**
     * Validates and sanitizes descriptor field
     * @param {String} descriptor - Descriptor text to validate and sanitize
     * @returns {Object} Result object with isValid flag and sanitized value
     */
    function validateAndSanitizeDescriptor(descriptor) {
        const result = {
            isValid: true,
            sanitized: '',
            warnings: []
        };

        if (!descriptor) {
            result.sanitized = '';
            return result;
        }

        // Check original length before sanitization
        const originalLength = String(descriptor).length;

        // Sanitize the descriptor
        result.sanitized = sanitizeText(descriptor, {
            maxLength: 500,  // Reasonable limit for descriptor field
            allowHtml: false
        });

        // Warn if content was modified
        if (result.sanitized.length < originalLength) {
            result.warnings.push('Descriptor field was sanitized/truncated from ' +
                               originalLength + ' to ' + result.sanitized.length + ' characters');
        }

        return result;
    }

    return {
        validatePaymentTerms: validatePaymentTerms,
        validateScheduleDetails: validateScheduleDetails,
        validatePurchaseOrder: validatePurchaseOrder,
        validateScheduleCreation: validateScheduleCreation,
        isValidTriggerType: isValidTriggerType,
        isValidDate: isValidDate,
        isValidPercentage: isValidPercentage,
        isValidAmount: isValidAmount,
        formatValidationErrors: formatValidationErrors,
        sanitizeText: sanitizeText,
        validateAndSanitizeDescriptor: validateAndSanitizeDescriptor
    };
});