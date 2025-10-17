/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 *
 * automated_test_suite.js
 * Comprehensive Automated Test Suite for PO Payment Schedule System
 *
 * Version: 1.0.0
 * Author: HBNO Development Team
 * Last Updated: 2025-10-14
 *
 * This script provides comprehensive automated testing including:
 * - Unit tests for all modules
 * - Integration test scenarios
 * - Date calculation validation
 * - Amount calculation verification
 * - Error handling tests
 * - Governance monitoring
 *
 * Deployment:
 * - Type: Scheduled Script
 * - Frequency: On Demand / Daily (as needed)
 * - Execute As: Administrator
 * - Log Level: Debug
 */

define(['N/log', 'N/record', 'N/search', 'N/runtime', 'N/error',
        '../lib/Constants', '../lib/ValidationHelper', '../lib/DateCalculator',
        '../lib/PaymentScheduleManager'],
function(log, record, search, runtime, error,
         Constants, ValidationHelper, DateCalculator, PaymentScheduleManager) {

    /**
     * Main execution function - runs all test suites
     * @param {Object} context - Script context
     */
    function execute(context) {
        log.audit('Automated Test Suite', '========================================');
        log.audit('Automated Test Suite', 'PO Payment Schedule - Comprehensive Test Execution');
        log.audit('Automated Test Suite', 'Started: ' + new Date().toISOString());
        log.audit('Automated Test Suite', '========================================\n');

        const startTime = Date.now();
        const testResults = {
            suites: [],
            totalTests: 0,
            totalPassed: 0,
            totalFailed: 0,
            totalSkipped: 0,
            startTime: startTime,
            governanceStart: runtime.getCurrentScript().getRemainingUsage()
        };

        try {
            // Run all test suites
            testResults.suites.push(runConstantsTests());
            testResults.suites.push(runValidationTests());
            testResults.suites.push(runDateCalculationTests());
            testResults.suites.push(runAmountCalculationTests());
            testResults.suites.push(runPaymentScheduleManagerTests());
            testResults.suites.push(runIntegrationTests());
            testResults.suites.push(runErrorHandlingTests());
            testResults.suites.push(runEdgeCaseTests());

            // Calculate totals
            testResults.suites.forEach(function(suite) {
                testResults.totalTests += suite.totalTests;
                testResults.totalPassed += suite.passed;
                testResults.totalFailed += suite.failed;
                testResults.totalSkipped += suite.skipped;
            });

            // Calculate execution metrics
            testResults.endTime = Date.now();
            testResults.duration = testResults.endTime - startTime;
            testResults.governanceEnd = runtime.getCurrentScript().getRemainingUsage();
            testResults.governanceUsed = testResults.governanceStart - testResults.governanceEnd;

            // Generate final report
            generateFinalReport(testResults);

        } catch (e) {
            log.error('Test Suite Execution', 'Fatal error: ' + e.message + '\nStack: ' + e.stack);
        }
    }

    /**
     * Test Suite 1: Constants Module Tests
     * Verifies all constants are properly defined
     */
    function runConstantsTests() {
        const suite = createTestSuite('Constants Module');
        log.audit(suite.name, 'Starting test suite...');

        // Test trigger type constants
        runTest(suite, 'TRIGGER_TYPES.QIMA defined', function() {
            assert(Constants.TRIGGER_TYPES.QIMA !== undefined, 'QIMA trigger type should be defined');
            assert(Constants.TRIGGER_TYPES.QIMA.id === '1', 'QIMA trigger ID should be "1"');
        });

        runTest(suite, 'All trigger types defined', function() {
            const triggers = ['QIMA', 'ON_RECEIPT', 'AFTER_RECEIPT', 'ON_BOL',
                            'ADVANCED_START_PRODUCTION', 'ADVANCED_PRIOR_SHIPPING'];
            triggers.forEach(function(trigger) {
                assert(Constants.TRIGGER_TYPES[trigger] !== undefined,
                      trigger + ' should be defined');
            });
        });

        // Test schedule status constants
        runTest(suite, 'SCHEDULE_STATUS constants defined', function() {
            assert(Constants.SCHEDULE_STATUS.OPEN === '1', 'OPEN status should be "1"');
            assert(Constants.SCHEDULE_STATUS.PAID === '2', 'PAID status should be "2"');
            assert(Constants.SCHEDULE_STATUS.CANCELLED === '3', 'CANCELLED status should be "3"');
        });

        // Test record type constants
        runTest(suite, 'RECORD_TYPES constants defined', function() {
            assert(Constants.RECORD_TYPES.CUSTOM_PAYMENT_TERMS === 'customrecord_po_terms',
                  'Payment terms record type should match');
            assert(Constants.RECORD_TYPES.TERMS_PAYMENT_DETAILS === 'customrecord_terms_payment_sche_details',
                  'Schedule details record type should match');
            assert(Constants.RECORD_TYPES.PO_PAYMENT_SCHEDULE === 'customrecord_po_payment_schedule',
                  'Payment schedule record type should match');
        });

        // Test validation constants
        runTest(suite, 'VALIDATION constants defined', function() {
            assert(Constants.VALIDATION.MAX_PAYMENT_SCHEDULES === 10, 'Max payments should be 10');
            assert(Constants.VALIDATION.MIN_PAYMENT_SCHEDULES === 1, 'Min payments should be 1');
            assert(Constants.VALIDATION.MAX_PERCENTAGE === 100, 'Max percentage should be 100');
        });

        // Test governance constants
        runTest(suite, 'GOVERNANCE constants defined', function() {
            assert(Constants.GOVERNANCE.THRESHOLD_CRITICAL === 100, 'Critical threshold should be 100');
            assert(Constants.GOVERNANCE.UNITS_PER_SCHEDULE > 0, 'Units per schedule should be positive');
        });

        return suite;
    }

    /**
     * Test Suite 2: Validation Helper Tests
     * Tests all validation functions
     */
    function runValidationTests() {
        const suite = createTestSuite('ValidationHelper Module');
        log.audit(suite.name, 'Starting test suite...');

        // Percentage validation tests
        runTest(suite, 'Valid percentage: 50', function() {
            assert(ValidationHelper.isValidPercentage(50) === true, '50% should be valid');
        });

        runTest(suite, 'Valid percentage: 0.01', function() {
            assert(ValidationHelper.isValidPercentage(0.01) === true, '0.01% should be valid');
        });

        runTest(suite, 'Valid percentage: 100', function() {
            assert(ValidationHelper.isValidPercentage(100) === true, '100% should be valid');
        });

        runTest(suite, 'Invalid percentage: 150', function() {
            assert(ValidationHelper.isValidPercentage(150) === false, '150% should be invalid');
        });

        runTest(suite, 'Invalid percentage: -10', function() {
            assert(ValidationHelper.isValidPercentage(-10) === false, '-10% should be invalid');
        });

        runTest(suite, 'Invalid percentage: 0', function() {
            assert(ValidationHelper.isValidPercentage(0) === false, '0% should be invalid');
        });

        // Amount validation tests
        runTest(suite, 'Valid amount: 100.50', function() {
            assert(ValidationHelper.isValidAmount(100.50) === true, '100.50 should be valid');
        });

        runTest(suite, 'Valid amount: 0.01', function() {
            assert(ValidationHelper.isValidAmount(0.01) === true, '0.01 should be valid');
        });

        runTest(suite, 'Invalid amount: 0', function() {
            assert(ValidationHelper.isValidAmount(0) === false, '0 should be invalid');
        });

        runTest(suite, 'Invalid amount: -50', function() {
            assert(ValidationHelper.isValidAmount(-50) === false, '-50 should be invalid');
        });

        // Trigger type validation tests
        runTest(suite, 'Valid trigger: QIMA (1)', function() {
            assert(ValidationHelper.isValidTriggerType('1') === true, 'Trigger type 1 should be valid');
        });

        runTest(suite, 'Valid trigger: On Receipt (2)', function() {
            assert(ValidationHelper.isValidTriggerType('2') === true, 'Trigger type 2 should be valid');
        });

        runTest(suite, 'Valid trigger: After Receipt (3)', function() {
            assert(ValidationHelper.isValidTriggerType('3') === true, 'Trigger type 3 should be valid');
        });

        runTest(suite, 'Invalid trigger: 999', function() {
            assert(ValidationHelper.isValidTriggerType('999') === false, 'Trigger type 999 should be invalid');
        });

        // Text sanitization tests
        runTest(suite, 'Sanitize HTML tags', function() {
            const input = '<script>alert("xss")</script>';
            const result = ValidationHelper.sanitizeText(input);
            assert(!result.includes('<script>'), 'Script tags should be removed');
        });

        runTest(suite, 'Sanitize special characters', function() {
            const input = 'Test & < > "text"';
            const result = ValidationHelper.sanitizeText(input);
            assert(result.includes('&amp;'), 'Ampersand should be escaped');
        });

        runTest(suite, 'Validate descriptor sanitization', function() {
            const input = 'Valid <b>descriptor</b> text';
            const result = ValidationHelper.validateAndSanitizeDescriptor(input);
            assert(result.isValid === true, 'Should return valid result');
            assert(result.sanitized.length > 0, 'Should have sanitized output');
        });

        return suite;
    }

    /**
     * Test Suite 3: Date Calculator Tests
     * Tests date calculation functions
     */
    function runDateCalculationTests() {
        const suite = createTestSuite('DateCalculator Module');
        log.audit(suite.name, 'Starting test suite...');

        // Calendar days tests
        runTest(suite, 'Add 30 calendar days', function() {
            const startDate = new Date('2025-01-01');
            const result = DateCalculator.addCalendarDays(startDate, 30);
            const expected = new Date('2025-01-31');
            assert(result.getTime() === expected.getTime(),
                  'Should add 30 days: expected ' + expected + ', got ' + result);
        });

        runTest(suite, 'Subtract 15 calendar days', function() {
            const startDate = new Date('2025-01-31');
            const result = DateCalculator.addCalendarDays(startDate, -15);
            const expected = new Date('2025-01-16');
            assert(result.getTime() === expected.getTime(),
                  'Should subtract 15 days: expected ' + expected + ', got ' + result);
        });

        runTest(suite, 'Add zero days', function() {
            const startDate = new Date('2025-01-15');
            const result = DateCalculator.addCalendarDays(startDate, 0);
            assert(result.getTime() === startDate.getTime(),
                  'Adding 0 days should return same date');
        });

        runTest(suite, 'Add days crossing month boundary', function() {
            const startDate = new Date('2025-01-25');
            const result = DateCalculator.addCalendarDays(startDate, 10);
            const expected = new Date('2025-02-04');
            assert(result.getTime() === expected.getTime(),
                  'Should cross month boundary correctly');
        });

        runTest(suite, 'Add days crossing year boundary', function() {
            const startDate = new Date('2025-12-25');
            const result = DateCalculator.addCalendarDays(startDate, 10);
            const expected = new Date('2026-01-04');
            assert(result.getTime() === expected.getTime(),
                  'Should cross year boundary correctly');
        });

        // Date parsing tests
        runTest(suite, 'Parse date from string M/D/YYYY', function() {
            const dateString = '1/15/2025';
            const parsed = DateCalculator.parseDate(dateString);
            assert(parsed !== null, 'Should parse date string');
            assert(parsed.getDate() === 15, 'Day should be 15');
            assert(parsed.getMonth() === 0, 'Month should be 0 (January)');
            assert(parsed.getFullYear() === 2025, 'Year should be 2025');
        });

        runTest(suite, 'Parse date from Date object', function() {
            const dateObj = new Date('2025-01-15');
            const parsed = DateCalculator.parseDate(dateObj);
            assert(parsed.getTime() === dateObj.getTime(),
                  'Should return same date object');
        });

        runTest(suite, 'Parse null date', function() {
            const parsed = DateCalculator.parseDate(null);
            assert(parsed === null, 'Should return null for null input');
        });

        // Date formatting tests
        runTest(suite, 'Format date to NetSuite format', function() {
            const date = new Date('2025-01-15');
            const formatted = DateCalculator.formatDate(date);
            assert(formatted !== null && formatted !== '', 'Should format date');
            assert(formatted.includes('1') && formatted.includes('15') && formatted.includes('2025'),
                  'Formatted date should contain all components');
        });

        return suite;
    }

    /**
     * Test Suite 4: Amount Calculator Tests
     * Tests percentage and amount calculations
     */
    function runAmountCalculationTests() {
        const suite = createTestSuite('Amount Calculator Module');
        log.audit(suite.name, 'Starting test suite...');

        // Basic percentage calculations
        runTest(suite, 'Calculate 50% of 1000', function() {
            const total = 1000;
            const percentage = 50;
            const result = (total * percentage) / 100;
            assert(result === 500, 'Should calculate 500');
        });

        runTest(suite, 'Calculate 30% of 1000', function() {
            const total = 1000;
            const percentage = 30;
            const result = (total * percentage) / 100;
            assert(result === 300, 'Should calculate 300');
        });

        runTest(suite, 'Calculate 33.33% of 999.99', function() {
            const total = 999.99;
            const percentage = 33.33;
            const result = parseFloat(((total * percentage) / 100).toFixed(2));
            assert(Math.abs(result - 333.30) < 0.01,
                  'Should calculate approximately 333.30, got ' + result);
        });

        // Percentage sum validation
        runTest(suite, 'Percentages sum to 100', function() {
            const percentages = [30, 30, 40];
            const sum = percentages.reduce(function(acc, val) { return acc + val; }, 0);
            assert(sum === 100, 'Should sum to 100');
        });

        runTest(suite, 'Percentages sum to 99 (invalid)', function() {
            const percentages = [30, 30, 39];
            const sum = percentages.reduce(function(acc, val) { return acc + val; }, 0);
            assert(sum !== 100, 'Should not sum to 100');
        });

        // Rounding tests
        runTest(suite, 'Rounding to 2 decimal places', function() {
            const value = 333.3333333;
            const rounded = parseFloat(value.toFixed(2));
            assert(rounded === 333.33, 'Should round to 333.33');
        });

        runTest(suite, 'Rounding up', function() {
            const value = 333.336;
            const rounded = parseFloat(value.toFixed(2));
            assert(rounded === 333.34, 'Should round up to 333.34');
        });

        // Amount distribution tests
        runTest(suite, 'Even 3-way split', function() {
            const total = 1000;
            const amounts = [
                (total * 33.33) / 100,
                (total * 33.33) / 100,
                (total * 33.34) / 100
            ];
            const roundedAmounts = amounts.map(function(amt) {
                return parseFloat(amt.toFixed(2));
            });
            const sum = roundedAmounts.reduce(function(acc, val) { return acc + val; }, 0);
            assert(Math.abs(sum - total) < 0.01,
                  'Amounts should sum to total: ' + sum + ' vs ' + total);
        });

        return suite;
    }

    /**
     * Test Suite 5: PaymentScheduleManager Tests
     * Tests schedule generation logic
     */
    function runPaymentScheduleManagerTests() {
        const suite = createTestSuite('PaymentScheduleManager Module');
        log.audit(suite.name, 'Starting test suite...');

        // Mock PO data for testing
        const mockPO = {
            id: 'TEST_PO_001',
            getValue: function(field) {
                if (field === 'total') return 1000;
                if (field === 'trandate') return new Date('2025-01-01');
                if (field === Constants.PO_FIELDS.PAYMENT_TERMS_CUSTOM) return 'TEST_TERM_001';
                if (field === Constants.PO_FIELDS.DATE_REFERENCE) return new Date('2025-01-01');
                return null;
            }
        };

        // Test schedule calculation
        runTest(suite, 'Calculate schedules - basic validation', function() {
            const scheduleDetails = [
                {
                    getValue: function(field) {
                        if (field === Constants.PAYMENT_DETAILS_FIELDS.PAYMENT_NUMBER) return '1';
                        if (field === Constants.PAYMENT_DETAILS_FIELDS.TRIGGER) return '3';
                        if (field === Constants.PAYMENT_DETAILS_FIELDS.PERCENTAGE) return 100;
                        if (field === Constants.PAYMENT_DETAILS_FIELDS.NUMBER_OF_DAYS) return 30;
                        if (field === Constants.PAYMENT_DETAILS_FIELDS.DESCRIPTOR) return 'Test Payment';
                        return null;
                    }
                }
            ];

            const poData = { total: 1000 };
            const schedules = PaymentScheduleManager.calculateSchedules({
                purchaseOrder: mockPO,
                scheduleDetails: scheduleDetails,
                poData: poData
            });

            assert(schedules.length === 1, 'Should calculate 1 schedule');
            assert(schedules[0].amount === 1000, 'Amount should be 1000');
            assert(schedules[0].percentage === 100, 'Percentage should be 100');
        });

        // Test load payment terms (if accessible)
        runTest(suite, 'Load payment terms - function exists', function() {
            assert(typeof PaymentScheduleManager.loadPaymentTerms === 'function',
                  'loadPaymentTerms should be a function');
        });

        // Test get schedule summary
        runTest(suite, 'Get schedule summary - function exists', function() {
            assert(typeof PaymentScheduleManager.getScheduleSummary === 'function',
                  'getScheduleSummary should be a function');
        });

        return suite;
    }

    /**
     * Test Suite 6: Integration Tests
     * Tests interaction between modules
     */
    function runIntegrationTests() {
        const suite = createTestSuite('Integration Tests');
        log.audit(suite.name, 'Starting test suite...');

        // Test validation + date calculation integration
        runTest(suite, 'Validate PO data for schedule generation', function() {
            const mockPO = {
                id: '12345',
                getValue: function(field) {
                    if (field === 'total') return 1000;
                    if (field === Constants.PO_FIELDS.PAYMENT_TERMS_CUSTOM) return '1';
                    if (field === 'tranid') return 'PO001';
                    if (field === 'trandate') return new Date();
                    return null;
                }
            };

            const validation = ValidationHelper.validatePurchaseOrder(mockPO);
            assert(validation.isValid === true, 'Valid PO should pass validation');
            assert(validation.data.total === 1000, 'Should extract total correctly');
        });

        // Test date + amount calculation integration
        runTest(suite, 'Calculate payment schedule with date and amount', function() {
            const baseDate = new Date('2025-01-01');
            const daysOffset = 30;
            const total = 1000;
            const percentage = 50;

            const paymentDate = DateCalculator.addCalendarDays(baseDate, daysOffset);
            const paymentAmount = (total * percentage) / 100;

            assert(paymentDate.getTime() === new Date('2025-01-31').getTime(),
                  'Payment date should be Jan 31');
            assert(paymentAmount === 500, 'Payment amount should be 500');
        });

        // Test validation + sanitization integration
        runTest(suite, 'Validate and sanitize descriptor', function() {
            const descriptor = 'Payment 1 - <b>Bold Text</b>';
            const result = ValidationHelper.validateAndSanitizeDescriptor(descriptor);

            assert(result.isValid === true, 'Should be valid');
            assert(result.sanitized !== descriptor, 'Should be sanitized');
            assert(!result.sanitized.includes('<b>'), 'HTML tags should be removed');
        });

        return suite;
    }

    /**
     * Test Suite 7: Error Handling Tests
     * Tests error scenarios and exception handling
     */
    function runErrorHandlingTests() {
        const suite = createTestSuite('Error Handling Tests');
        log.audit(suite.name, 'Starting test suite...');

        // Test invalid PO validation
        runTest(suite, 'Handle PO with zero total', function() {
            const mockPO = {
                id: '12345',
                getValue: function(field) {
                    if (field === 'total') return 0;
                    if (field === Constants.PO_FIELDS.PAYMENT_TERMS_CUSTOM) return '1';
                    return null;
                }
            };

            const validation = ValidationHelper.validatePurchaseOrder(mockPO);
            assert(validation.isValid === false, 'PO with zero total should be invalid');
            assert(validation.errors.length > 0, 'Should have error messages');
        });

        // Test invalid payment term
        runTest(suite, 'Handle missing payment terms', function() {
            const mockPO = {
                id: '12345',
                getValue: function(field) {
                    if (field === 'total') return 1000;
                    if (field === Constants.PO_FIELDS.PAYMENT_TERMS_CUSTOM) return null;
                    return null;
                }
            };

            const validation = ValidationHelper.validatePurchaseOrder(mockPO);
            assert(validation.isValid === false, 'PO without payment term should be invalid');
        });

        // Test invalid percentage
        runTest(suite, 'Handle percentages not summing to 100', function() {
            const scheduleDetails = [
                { getValue: function(f) { return f === Constants.PAYMENT_DETAILS_FIELDS.PERCENTAGE ? 30 : '1'; }},
                { getValue: function(f) { return f === Constants.PAYMENT_DETAILS_FIELDS.PERCENTAGE ? 30 : '2'; }},
                { getValue: function(f) { return f === Constants.PAYMENT_DETAILS_FIELDS.PERCENTAGE ? 30 : '3'; }}
            ];

            const validation = ValidationHelper.validateScheduleDetails(scheduleDetails, 3);
            assert(validation.isValid === false, 'Should be invalid when percentages sum to 90');
            assert(validation.errors.length > 0, 'Should have error message about percentage mismatch');
        });

        // Test duplicate payment numbers
        runTest(suite, 'Handle duplicate payment numbers', function() {
            const scheduleDetails = [
                { getValue: function(f) {
                    if (f === Constants.PAYMENT_DETAILS_FIELDS.PAYMENT_NUMBER) return '1';
                    if (f === Constants.PAYMENT_DETAILS_FIELDS.PERCENTAGE) return 50;
                    if (f === Constants.PAYMENT_DETAILS_FIELDS.TRIGGER) return '3';
                    if (f === Constants.PAYMENT_DETAILS_FIELDS.NUMBER_OF_DAYS) return 0;
                    return null;
                }},
                { getValue: function(f) {
                    if (f === Constants.PAYMENT_DETAILS_FIELDS.PAYMENT_NUMBER) return '1';  // Duplicate!
                    if (f === Constants.PAYMENT_DETAILS_FIELDS.PERCENTAGE) return 50;
                    if (f === Constants.PAYMENT_DETAILS_FIELDS.TRIGGER) return '3';
                    if (f === Constants.PAYMENT_DETAILS_FIELDS.NUMBER_OF_DAYS) return 0;
                    return null;
                }}
            ];

            const validation = ValidationHelper.validateScheduleDetails(scheduleDetails, 2);
            assert(validation.isValid === false, 'Should be invalid with duplicate payment numbers');
        });

        return suite;
    }

    /**
     * Test Suite 8: Edge Case Tests
     * Tests boundary conditions and unusual scenarios
     */
    function runEdgeCaseTests() {
        const suite = createTestSuite('Edge Case Tests');
        log.audit(suite.name, 'Starting test suite...');

        // Test very small amounts
        runTest(suite, 'Handle very small PO amount', function() {
            const total = 0.01;
            const percentage = 100;
            const amount = (total * percentage) / 100;
            assert(amount === 0.01, 'Should handle 1 cent amount');
        });

        // Test very large amounts
        runTest(suite, 'Handle very large PO amount', function() {
            const total = 1000000.00;
            const percentage = 50;
            const amount = (total * percentage) / 100;
            assert(amount === 500000.00, 'Should handle large amounts');
        });

        // Test leap year
        runTest(suite, 'Handle leap year date calculation', function() {
            const startDate = new Date('2024-02-28');
            const result = DateCalculator.addCalendarDays(startDate, 1);
            assert(result.getDate() === 29, 'Should handle Feb 29 in leap year');
            assert(result.getMonth() === 1, 'Should still be February');
        });

        // Test maximum payments
        runTest(suite, 'Handle maximum payment schedules', function() {
            const maxPayments = Constants.VALIDATION.MAX_PAYMENT_SCHEDULES;
            assert(maxPayments === 10, 'Maximum should be 10 payments');
        });

        // Test minimum percentage
        runTest(suite, 'Handle minimum valid percentage', function() {
            const minPercentage = 0.01;
            assert(ValidationHelper.isValidPercentage(minPercentage) === true,
                  'Minimum valid percentage should be 0.01');
        });

        // Test date crossing year boundary
        runTest(suite, 'Handle New Years Eve date calculation', function() {
            const startDate = new Date('2025-12-31');
            const result = DateCalculator.addCalendarDays(startDate, 1);
            assert(result.getFullYear() === 2026, 'Should cross to new year');
            assert(result.getMonth() === 0, 'Should be January');
            assert(result.getDate() === 1, 'Should be 1st');
        });

        // Test empty descriptor
        runTest(suite, 'Handle empty descriptor field', function() {
            const result = ValidationHelper.validateAndSanitizeDescriptor('');
            assert(result.isValid === true, 'Empty descriptor should be valid');
            assert(result.sanitized === '', 'Sanitized value should be empty string');
        });

        // Test null descriptor
        runTest(suite, 'Handle null descriptor field', function() {
            const result = ValidationHelper.validateAndSanitizeDescriptor(null);
            assert(result.isValid === true, 'Null descriptor should be valid');
            assert(result.sanitized === '', 'Sanitized value should be empty string');
        });

        return suite;
    }

    // ========================================
    // Test Framework Helper Functions
    // ========================================

    /**
     * Creates a new test suite
     * @param {String} name - Suite name
     * @returns {Object} Test suite object
     */
    function createTestSuite(name) {
        return {
            name: name,
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0,
            totalTests: 0,
            startTime: Date.now()
        };
    }

    /**
     * Runs a single test
     * @param {Object} suite - Test suite object
     * @param {String} testName - Test name
     * @param {Function} testFunction - Test function to execute
     */
    function runTest(suite, testName, testFunction) {
        suite.totalTests++;

        try {
            testFunction();
            suite.passed++;
            suite.tests.push({
                name: testName,
                status: 'PASS',
                error: null
            });
            log.debug(suite.name, 'PASS: ' + testName);
        } catch (e) {
            suite.failed++;
            suite.tests.push({
                name: testName,
                status: 'FAIL',
                error: e.message
            });
            log.error(suite.name, 'FAIL: ' + testName + ' - ' + e.message);
        }
    }

    /**
     * Simple assertion function
     * @param {Boolean} condition - Condition to test
     * @param {String} message - Error message if assertion fails
     */
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    /**
     * Generates final test report
     * @param {Object} results - Test results object
     */
    function generateFinalReport(results) {
        let report = '\n\n========================================\n';
        report += 'PO PAYMENT SCHEDULE TEST SUITE - FINAL REPORT\n';
        report += '========================================\n\n';
        report += 'Execution Time: ' + new Date(results.startTime).toISOString() + '\n';
        report += 'Duration: ' + (results.duration / 1000).toFixed(2) + ' seconds\n';
        report += 'Governance Used: ' + results.governanceUsed + ' units\n';
        report += 'Governance Remaining: ' + results.governanceEnd + ' units\n\n';

        // Summary by suite
        report += 'TEST SUITE RESULTS:\n';
        report += '----------------------------------------\n';
        results.suites.forEach(function(suite) {
            const suiteTime = Date.now() - suite.startTime;
            const successRate = suite.totalTests > 0 ?
                ((suite.passed / suite.totalTests) * 100).toFixed(1) : 0;

            report += suite.name + ':\n';
            report += '  Total Tests: ' + suite.totalTests + '\n';
            report += '  Passed: ' + suite.passed + ' (' + successRate + '%)\n';
            report += '  Failed: ' + suite.failed + '\n';
            report += '  Skipped: ' + suite.skipped + '\n';
            report += '  Duration: ' + (suiteTime / 1000).toFixed(2) + 's\n';

            // Show failed tests
            if (suite.failed > 0) {
                report += '  Failed Tests:\n';
                suite.tests.forEach(function(test) {
                    if (test.status === 'FAIL') {
                        report += '    - ' + test.name + ': ' + test.error + '\n';
                    }
                });
            }
            report += '\n';
        });

        // Overall summary
        report += '========================================\n';
        report += 'OVERALL SUMMARY\n';
        report += '========================================\n';
        report += 'Total Test Suites: ' + results.suites.length + '\n';
        report += 'Total Tests: ' + results.totalTests + '\n';
        report += 'Total Passed: ' + results.totalPassed + '\n';
        report += 'Total Failed: ' + results.totalFailed + '\n';
        report += 'Total Skipped: ' + results.totalSkipped + '\n';

        const overallSuccessRate = results.totalTests > 0 ?
            ((results.totalPassed / results.totalTests) * 100).toFixed(2) : 0;
        report += 'Success Rate: ' + overallSuccessRate + '%\n';

        // Pass/Fail determination
        const testsPassed = results.totalFailed === 0;
        report += '\nFINAL RESULT: ' + (testsPassed ? 'PASS' : 'FAIL') + '\n';

        if (!testsPassed) {
            report += '\nACTION REQUIRED: ' + results.totalFailed + ' test(s) failed. ' +
                     'Please review failed tests and fix issues before deployment.\n';
        } else {
            report += '\nAll tests passed! System is ready for deployment.\n';
        }

        report += '========================================\n';

        // Log the complete report
        log.audit('Test Report', report);

        // Return results for potential email notification or further processing
        return {
            passed: testsPassed,
            totalTests: results.totalTests,
            totalPassed: results.totalPassed,
            totalFailed: results.totalFailed,
            successRate: overallSuccessRate,
            report: report
        };
    }

    return {
        execute: execute
    };
});
