/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * Constants.js
 * Configuration constants for PO Payment Schedule system
 *
 * Version: 1.0.0
 * Author: HBNO Development Team
 */
define([], function() {

    /**
     * Payment Trigger Types
     * Maps to custrecord_terms_payment_sche_trigger list values
     */
    const TRIGGER_TYPES = {
        QIMA: {
            id: '1',
            label: 'QIMA',
            description: 'Quality Inspection Management Application'
        },
        ON_RECEIPT: {
            id: '2',
            label: 'On Receipt',
            description: 'Payment due on item receipt'
        },
        AFTER_RECEIPT: {
            id: '3',
            label: 'After Receipt',
            description: 'Payment due X days after item receipt'
        },
        ON_BOL: {
            id: '4',
            label: 'On BOL',
            description: 'Payment due on Bill of Lading'
        },
        ADVANCED_START_PRODUCTION: {
            id: '5',
            label: 'Advanced Start Production',
            description: 'Payment due at production start'
        },
        ADVANCED_PRIOR_SHIPPING: {
            id: '6',
            label: 'Advanced Prior to Shipping',
            description: 'Payment due before shipping'
        }
    };

    /**
     * Payment Schedule Status Values
     * Maps to custrecord_pay_sched_stat list values
     */
    const SCHEDULE_STATUS = {
        OPEN: '1',
        PAID: '2',
        CANCELLED: '3',
        OVERDUE: '4'
    };

    /**
     * Custom Record Type IDs
     */
    const RECORD_TYPES = {
        CUSTOM_PAYMENT_TERMS: 'customrecord_po_terms',
        TERMS_PAYMENT_DETAILS: 'customrecord_terms_payment_sche_details',
        PO_PAYMENT_SCHEDULE: 'customrecord_po_payment_schedule'
    };

    /**
     * Field IDs for Custom Payment Terms Record
     */
    const PAYMENT_TERMS_FIELDS = {
        NAME: 'custrecord_po_terms_name',
        NUMBER_OF_PAYMENTS: 'custrecord_number',
        NATIVE_TERMS: 'custrecord_po_terms_term'
    };

    /**
     * Field IDs for Terms Payment Schedule Details Record
     */
    const PAYMENT_DETAILS_FIELDS = {
        TERMS: 'custrecord_terms_pay_details',
        PAYMENT_NUMBER: 'custrecord_terms_pay_number',
        TRIGGER: 'custrecord_terms_payment_sche_trigger',
        PERCENTAGE: 'custrecord_terms_payment_sche_perc',
        NUMBER_OF_DAYS: 'custrecord_terms_payment_sche_num_days',
        DESCRIPTOR: 'custrecord_terms_payment_sche_descriptor'
    };

    /**
     * Field IDs for PO Payment Schedule Record
     */
    const SCHEDULE_FIELDS = {
        PURCHASE_ORDER: 'custrecord_po_pay_sched_po',
        DATE: 'custrecord_po_pay_sched_date',
        AMOUNT: 'custrecord_po_pay_sched_amount',
        PERCENTAGE: 'custrecord_po_pay_sched_percent',
        DESCRIPTOR: 'custrecord_po_pay_desc',
        PAYMENT_NUMBER: 'custrecord_po_pay_num',
        STATUS: 'custrecord_pay_sched_stat'
    };

    /**
     * Purchase Order Field IDs
     */
    const PO_FIELDS = {
        PAYMENT_TERMS_CUSTOM: 'custbody_payment_terms_cust',
        DATE_REFERENCE: 'custbody1'
    };

    /**
     * Error Messages
     */
    const ERROR_MESSAGES = {
        MISSING_PAYMENT_TERMS: 'Purchase Order does not have custom payment terms specified',
        INVALID_PAYMENT_TERMS: 'Invalid payment terms configuration: {0}',
        PERCENTAGE_MISMATCH: 'Payment term percentages do not sum to 100%. Total: {0}%',
        MISSING_PO_TOTAL: 'Purchase Order total amount is missing or zero',
        MISSING_DATE_REFERENCE: 'No date reference available for payment calculation',
        SCHEDULE_CREATION_FAILED: 'Failed to create payment schedule: {0}',
        INVALID_TRIGGER_TYPE: 'Invalid payment trigger type: {0}',
        MISSING_CONFIGURATION: 'Payment terms configuration is incomplete',
        GOVERNANCE_EXCEEDED: 'Script governance limit exceeded during processing',
        DUPLICATE_PAYMENT_NUMBER: 'Duplicate payment numbers found in configuration'
    };


    /**
     * Governance Thresholds
     */
    const GOVERNANCE = {
        THRESHOLD_CRITICAL: 100,
        UNITS_PER_SCHEDULE: 15,
        UNITS_PER_SEARCH: 10
    };

    /**
     * Date Calculation Constants
     */
    const DATE_CALC = {
        MAX_DAYS_OFFSET: 365, // Maximum days to add for payment terms
        DEFAULT_DAYS_OFFSET: 0
    };

    /**
     * Validation Rules
     */
    const VALIDATION = {
        MAX_PAYMENT_SCHEDULES: 10,
        MIN_PAYMENT_SCHEDULES: 1,
        MAX_PERCENTAGE: 100,
        MIN_PERCENTAGE: 0.01,
        PERCENTAGE_PRECISION: 2, // Decimal places
        MAX_DAYS_OFFSET: 365,
        MIN_DAYS_OFFSET: 0
    };

    return {
        TRIGGER_TYPES: TRIGGER_TYPES,
        SCHEDULE_STATUS: SCHEDULE_STATUS,
        RECORD_TYPES: RECORD_TYPES,
        PAYMENT_TERMS_FIELDS: PAYMENT_TERMS_FIELDS,
        PAYMENT_DETAILS_FIELDS: PAYMENT_DETAILS_FIELDS,
        SCHEDULE_FIELDS: SCHEDULE_FIELDS,
        PO_FIELDS: PO_FIELDS,
        ERROR_MESSAGES: ERROR_MESSAGES,
        GOVERNANCE: GOVERNANCE,
        DATE_CALC: DATE_CALC,
        VALIDATION: VALIDATION
    };
});