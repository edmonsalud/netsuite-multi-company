/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 *
 * payment_schedule_test.js
 * Test suite for PO Payment Schedule system
 * Simplified version - Calendar days only
 *
 * Version: 1.0.0
 * Author: HBNO Development Team
 *
 * This script can be deployed as a scheduled script for testing purposes
 */
define(['N/log', 'N/record', 'N/search',
        '../lib/Constants', '../lib/ValidationHelper', '../lib/DateCalculator'],
function(log, record, search,
         Constants, ValidationHelper, DateCalculator) {

    /**
     * Main test execution function
     * @param {Object} context - Script context
     */
    function execute(context) {
        log.audit('Test Suite', 'Starting PO Payment Schedule test suite');

        try {
            // Run all test categories
            const results = {
                validation: runValidationTests(),
                dateCalculation: runDateCalculationTests(),
                percentageCalculation: runPercentageTests(),
                triggerType: runTriggerTypeTests()
            };

            // Generate test report
            generateTestReport(results);

        } catch (e) {
            log.error('Test Suite', 'Test suite failed: ' + e.message);
        }
    }

    /**
     * Run validation tests
     * @returns {Object} Test results
     */
    function runValidationTests() {
        const results = {
            passed: 0,
            failed: 0,
            tests: []
        };

        log.audit('Validation Tests', 'Starting validation tests');

        // Test 1: Valid percentage validation
        try {
            const isValid = ValidationHelper.isValidPercentage(50);
            if (isValid) {
                results.passed++;
                results.tests.push({name: 'Valid percentage (50%)', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({name: 'Valid percentage (50%)', status: 'FAIL', error: 'Should be valid'});
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: 'Valid percentage (50%)', status: 'FAIL', error: e.message});
        }

        // Test 2: Invalid percentage validation (over 100)
        try {
            const isValid = ValidationHelper.isValidPercentage(150);
            if (!isValid) {
                results.passed++;
                results.tests.push({name: 'Invalid percentage (150%)', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({name: 'Invalid percentage (150%)', status: 'FAIL', error: 'Should be invalid'});
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: 'Invalid percentage (150%)', status: 'FAIL', error: e.message});
        }

        // Test 3: Valid amount validation
        try {
            const isValid = ValidationHelper.isValidAmount(100.50);
            if (isValid) {
                results.passed++;
                results.tests.push({name: 'Valid amount (100.50)', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({name: 'Valid amount (100.50)', status: 'FAIL', error: 'Should be valid'});
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: 'Valid amount (100.50)', status: 'FAIL', error: e.message});
        }

        // Test 4: Invalid trigger type validation
        try {
            const isValid = ValidationHelper.isValidTriggerType('999');
            if (!isValid) {
                results.passed++;
                results.tests.push({name: 'Invalid trigger type (999)', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({name: 'Invalid trigger type (999)', status: 'FAIL', error: 'Should be invalid'});
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: 'Invalid trigger type (999)', status: 'FAIL', error: e.message});
        }

        // Test 5: Valid trigger type validation
        try {
            const isValid = ValidationHelper.isValidTriggerType(Constants.TRIGGER_TYPES.AFTER_RECEIPT.id);
            if (isValid) {
                results.passed++;
                results.tests.push({name: 'Valid trigger type (After Receipt)', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({name: 'Valid trigger type (After Receipt)', status: 'FAIL', error: 'Should be valid'});
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: 'Valid trigger type (After Receipt)', status: 'FAIL', error: e.message});
        }

        return results;
    }

    /**
     * Run date calculation tests
     * @returns {Object} Test results
     */
    function runDateCalculationTests() {
        const results = {
            passed: 0,
            failed: 0,
            tests: []
        };

        log.audit('Date Calculation Tests', 'Starting date calculation tests');

        // Test 1: Add calendar days
        try {
            const startDate = new Date('2025-01-01');
            const result = DateCalculator.addCalendarDays(startDate, 30);
            const expected = new Date('2025-01-31');

            if (result.getTime() === expected.getTime()) {
                results.passed++;
                results.tests.push({name: 'Add 30 calendar days', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({
                    name: 'Add 30 calendar days',
                    status: 'FAIL',
                    error: 'Expected ' + expected + ' but got ' + result
                });
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: 'Add 30 calendar days', status: 'FAIL', error: e.message});
        }

        // Test 2: Add negative calendar days
        try {
            const startDate = new Date('2025-01-31');
            const result = DateCalculator.addCalendarDays(startDate, -15);
            const expected = new Date('2025-01-16');

            if (result.getTime() === expected.getTime()) {
                results.passed++;
                results.tests.push({name: 'Subtract 15 calendar days', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({
                    name: 'Subtract 15 calendar days',
                    status: 'FAIL',
                    error: 'Expected ' + expected + ' but got ' + result
                });
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: 'Subtract 15 calendar days', status: 'FAIL', error: e.message});
        }

        // Test 3: Parse date from string
        try {
            const dateString = '1/15/2025';
            const parsed = DateCalculator.parseDate(dateString);
            const expected = new Date('2025-01-15');

            if (parsed && parsed.getDate() === expected.getDate() &&
                parsed.getMonth() === expected.getMonth() &&
                parsed.getFullYear() === expected.getFullYear()) {
                results.passed++;
                results.tests.push({name: 'Parse date from string', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({
                    name: 'Parse date from string',
                    status: 'FAIL',
                    error: 'Parse failed'
                });
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: 'Parse date from string', status: 'FAIL', error: e.message});
        }

        // Test 4: Format date for NetSuite
        try {
            const date = new Date('2025-01-15');
            const formatted = DateCalculator.formatDate(date);

            if (formatted && formatted.includes('1') && formatted.includes('15') && formatted.includes('2025')) {
                results.passed++;
                results.tests.push({name: 'Format date for NetSuite', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({
                    name: 'Format date for NetSuite',
                    status: 'FAIL',
                    error: 'Format failed: ' + formatted
                });
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: 'Format date for NetSuite', status: 'FAIL', error: e.message});
        }

        return results;
    }

    /**
     * Run percentage calculation tests
     * @returns {Object} Test results
     */
    function runPercentageTests() {
        const results = {
            passed: 0,
            failed: 0,
            tests: []
        };

        log.audit('Percentage Tests', 'Starting percentage calculation tests');

        // Test 1: Calculate 50% of 1000
        try {
            const total = 1000;
            const percentage = 50;
            const result = (total * percentage) / 100;
            const expected = 500;

            if (result === expected) {
                results.passed++;
                results.tests.push({name: '50% of 1000', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({
                    name: '50% of 1000',
                    status: 'FAIL',
                    error: 'Expected ' + expected + ' but got ' + result
                });
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: '50% of 1000', status: 'FAIL', error: e.message});
        }

        // Test 2: Multiple percentages sum to 100
        try {
            const percentages = [30, 30, 40];
            const sum = percentages.reduce(function(acc, val) { return acc + val; }, 0);

            if (sum === 100) {
                results.passed++;
                results.tests.push({name: 'Percentages sum to 100', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({
                    name: 'Percentages sum to 100',
                    status: 'FAIL',
                    error: 'Sum is ' + sum
                });
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: 'Percentages sum to 100', status: 'FAIL', error: e.message});
        }

        // Test 3: Decimal percentage calculation
        try {
            const total = 999.99;
            const percentage = 33.33;
            const result = parseFloat(((total * percentage) / 100).toFixed(2));
            const expected = 333.30;

            if (Math.abs(result - expected) < 0.01) {
                results.passed++;
                results.tests.push({name: '33.33% of 999.99', status: 'PASS'});
            } else {
                results.failed++;
                results.tests.push({
                    name: '33.33% of 999.99',
                    status: 'FAIL',
                    error: 'Expected ' + expected + ' but got ' + result
                });
            }
        } catch (e) {
            results.failed++;
            results.tests.push({name: '33.33% of 999.99', status: 'FAIL', error: e.message});
        }

        return results;
    }

    /**
     * Run trigger type tests
     * @returns {Object} Test results
     */
    function runTriggerTypeTests() {
        const results = {
            passed: 0,
            failed: 0,
            tests: []
        };

        log.audit('Trigger Type Tests', 'Starting trigger type tests');

        // Test each trigger type constant
        const triggerTypes = [
            {name: 'QIMA', id: '1'},
            {name: 'On Receipt', id: '2'},
            {name: 'After Receipt', id: '3'},
            {name: 'On BOL', id: '4'},
            {name: 'Advanced Start Production', id: '5'},
            {name: 'Advanced Prior to Shipping', id: '6'}
        ];

        triggerTypes.forEach(function(trigger) {
            try {
                const isValid = ValidationHelper.isValidTriggerType(trigger.id);
                if (isValid) {
                    results.passed++;
                    results.tests.push({name: 'Trigger type: ' + trigger.name, status: 'PASS'});
                } else {
                    results.failed++;
                    results.tests.push({
                        name: 'Trigger type: ' + trigger.name,
                        status: 'FAIL',
                        error: 'Should be valid'
                    });
                }
            } catch (e) {
                results.failed++;
                results.tests.push({
                    name: 'Trigger type: ' + trigger.name,
                    status: 'FAIL',
                    error: e.message
                });
            }
        });

        return results;
    }

    /**
     * Generate and log test report
     * @param {Object} results - Test results object
     */
    function generateTestReport(results) {
        let totalPassed = 0;
        let totalFailed = 0;
        let report = '\n========================================\n';
        report += 'PO PAYMENT SCHEDULE TEST REPORT\n';
        report += '========================================\n\n';

        // Process each test category
        Object.keys(results).forEach(function(category) {
            const categoryResults = results[category];
            totalPassed += categoryResults.passed;
            totalFailed += categoryResults.failed;

            report += category.toUpperCase() + ' TESTS:\n';
            report += '-----------------\n';
            report += 'Passed: ' + categoryResults.passed + '\n';
            report += 'Failed: ' + categoryResults.failed + '\n';
            report += 'Tests:\n';

            categoryResults.tests.forEach(function(test) {
                const status = test.status === 'PASS' ? '✓' : '✗';
                report += '  ' + status + ' ' + test.name;
                if (test.error) {
                    report += ' - ' + test.error;
                }
                report += '\n';
            });

            report += '\n';
        });

        // Summary
        report += '========================================\n';
        report += 'SUMMARY\n';
        report += '========================================\n';
        report += 'Total Passed: ' + totalPassed + '\n';
        report += 'Total Failed: ' + totalFailed + '\n';
        report += 'Success Rate: ' + ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(2) + '%\n';
        report += '========================================\n';

        // Log the report
        log.audit('Test Report', report);

        // Return summary for potential email notification
        return {
            passed: totalPassed,
            failed: totalFailed,
            report: report
        };
    }

    return {
        execute: execute
    };
});