/**
 * @NApiVersion 2.1
 * @NModuleName SubsidiaryMapper
 * @description Maps representing customer names to subsidiary internal IDs
 *
 * Usage:
 *   const SubsidiaryMapper = require('./subsidiary_mapper');
 *   const subsidiaryId = SubsidiaryMapper.getSubsidiaryByCustomer('IC-PSOF LP');
 *   // Returns: 8
 */

define([], function() {

    /**
     * Subsidiary Mapping Table
     * Key: Representing Customer Name
     * Value: { subsidiaryId: Internal ID, subsidiaryName: Subsidiary Name }
     */
    const SUBSIDIARY_MAP = {
        // Main Entities
        'IC-Planks and Pilings': { subsidiaryId: 1, subsidiaryName: 'Planks and Pilings' },
        'IC-PAT GP LLC': { subsidiaryId: 4, subsidiaryName: 'PAT GP LLC' },
        'IC-Pier Active Transactions LLC': { subsidiaryId: 6, subsidiaryName: 'Pier Active Transactions LLC' },
        'IC-Pier Asset Management': { subsidiaryId: 3, subsidiaryName: 'Pier Asset Management' },
        'IC-PSOF GP LLC': { subsidiaryId: 2, subsidiaryName: 'PSOF GP LLC' },
        'IC-PSOF LP': { subsidiaryId: 8, subsidiaryName: 'PSOF LP' },
        'IC-PLFF GP LLC': { subsidiaryId: 48, subsidiaryName: 'PLFF GP LLC' },
        'IC-PLFF I LP': { subsidiaryId: 49, subsidiaryName: 'PLFF I LP' },
        'IC-PMRF GP LLC': { subsidiaryId: 72, subsidiaryName: 'PMRF GP LLC' },
        'IC-PMRF LP': { subsidiaryId: 74, subsidiaryName: 'PMRF LP' },
        'IC-Plumeria 51': { subsidiaryId: 51, subsidiaryName: 'Plumeria' },

        // Series 001-024
        'IC-Series 006': { subsidiaryId: 18, subsidiaryName: 'Series 006' },
        'IC-Series 007': { subsidiaryId: 19, subsidiaryName: 'Series 007' },
        'IC-Series 008': { subsidiaryId: 20, subsidiaryName: 'Series 008' },
        'IC-Series 011': { subsidiaryId: 24, subsidiaryName: 'Series 011' },
        'IC-Series 012': { subsidiaryId: 25, subsidiaryName: 'Series 012' },
        'IC-Series 013': { subsidiaryId: 26, subsidiaryName: 'Series 013' },
        'IC-Series 014': { subsidiaryId: 27, subsidiaryName: 'Series 014' },
        'IC-Series 015': { subsidiaryId: 28, subsidiaryName: 'Series 015' },
        'IC-Series 016': { subsidiaryId: 29, subsidiaryName: 'Series 016' },
        'IC-Series 017': { subsidiaryId: 31, subsidiaryName: 'Series 017' },
        'IC-Series 018': { subsidiaryId: 32, subsidiaryName: 'Series 018' },
        'IC-Series 019': { subsidiaryId: 33, subsidiaryName: 'Series 019' },
        'IC-Series 020': { subsidiaryId: 34, subsidiaryName: 'Series 020' },
        'IC-Series 021': { subsidiaryId: 35, subsidiaryName: 'Series 021' },
        'IC-Series 022': { subsidiaryId: 36, subsidiaryName: 'Series 022' },
        'IC-Series 023': { subsidiaryId: 37, subsidiaryName: 'Series 023' },
        'IC-Series 024': { subsidiaryId: 38, subsidiaryName: 'Series 024' },

        // Series 026-037
        'IC-Series 026': { subsidiaryId: 40, subsidiaryName: 'Series 026' },
        'IC-Series 027': { subsidiaryId: 41, subsidiaryName: 'Series 027' },
        'IC-Series 028': { subsidiaryId: 42, subsidiaryName: 'Series 028' },
        'IC-Series 029': { subsidiaryId: 43, subsidiaryName: 'Series 029' },
        'IC-Series 030': { subsidiaryId: 44, subsidiaryName: 'Series 030' },
        'IC-Series 031': { subsidiaryId: 45, subsidiaryName: 'Series 031' },
        'IC-Series 032': { subsidiaryId: 59, subsidiaryName: 'Series 032' },
        'IC-Series 033': { subsidiaryId: 60, subsidiaryName: 'Series 033' },
        'IC-Series 034': { subsidiaryId: 61, subsidiaryName: 'Series 034' },
        'IC-Series 035 62': { subsidiaryId: 62, subsidiaryName: 'Series 035' },
        'IC-Series 036': { subsidiaryId: 64, subsidiaryName: 'Series 036' },
        'IC-Series 037': { subsidiaryId: 65, subsidiaryName: 'Series 037' },

        // Series 038-052 (including variants)
        'IC-Series 038 63': { subsidiaryId: 63, subsidiaryName: 'Series 038' },
        'IC-Series 039': { subsidiaryId: 66, subsidiaryName: 'Series 039' },
        'IC-Series 039 66': { subsidiaryId: 66, subsidiaryName: 'Series 039' },
        'IC-Series 040 70': { subsidiaryId: 70, subsidiaryName: 'Series 040' },
        'IC-Series 041 71': { subsidiaryId: 71, subsidiaryName: 'Series 041' },
        'IC-Series 042': { subsidiaryId: 77, subsidiaryName: 'Series 042' },
        'IC-Series 043': { subsidiaryId: 78, subsidiaryName: 'Series 043' },
        'IC-Series 044': { subsidiaryId: 79, subsidiaryName: 'Series 044' },
        'IC-Series 045': { subsidiaryId: 81, subsidiaryName: 'Series 045' },
        'IC-Series 046': { subsidiaryId: 80, subsidiaryName: 'Series 046' },
        'IC-Series 047': { subsidiaryId: 86, subsidiaryName: 'Series 047' },
        'IC-Series 047 86': { subsidiaryId: 86, subsidiaryName: 'Series 047' },
        'IC-Series 048 84': { subsidiaryId: 84, subsidiaryName: 'Series 048' },
        'IC-Series 049': { subsidiaryId: 85, subsidiaryName: 'Series 049' },
        'IC-Series 050': { subsidiaryId: 87, subsidiaryName: 'Series 050' },
        'IC-Series 050 87': { subsidiaryId: 87, subsidiaryName: 'Series 050' },
        'IC-Series 051': { subsidiaryId: 88, subsidiaryName: 'Series 051' },
        'IC-Series 051 88': { subsidiaryId: 88, subsidiaryName: 'Series 051' },
        'IC-Series 052': { subsidiaryId: 89, subsidiaryName: 'Series 052' }
    };

    /**
     * Get subsidiary internal ID by representing customer name
     *
     * @param {string} customerName - The representing customer name (e.g., 'IC-PSOF LP')
     * @returns {number|null} The subsidiary internal ID, or null if not found
     *
     * @example
     * getSubsidiaryByCustomer('IC-PSOF LP') // Returns: 8
     * getSubsidiaryByCustomer('IC-Series 042') // Returns: 77
     * getSubsidiaryByCustomer('Invalid Customer') // Returns: null
     */
    function getSubsidiaryByCustomer(customerName) {
        try {
            if (!customerName || typeof customerName !== 'string') {
                log.error({
                    title: 'Invalid Input',
                    details: 'Customer name must be a non-empty string'
                });
                return null;
            }

            const trimmedName = customerName.trim();
            const mapping = SUBSIDIARY_MAP[trimmedName];

            if (mapping) {
                log.debug({
                    title: 'Subsidiary Mapping Found',
                    details: `Customer: ${trimmedName} → Subsidiary: ${mapping.subsidiaryName} (ID: ${mapping.subsidiaryId})`
                });
                return mapping.subsidiaryId;
            } else {
                log.audit({
                    title: 'No Mapping Found',
                    details: `No subsidiary mapping exists for customer: ${trimmedName}`
                });
                return null;
            }
        } catch (e) {
            log.error({
                title: 'Error in getSubsidiaryByCustomer',
                details: e.toString()
            });
            return null;
        }
    }

    /**
     * Get full subsidiary details by representing customer name
     *
     * @param {string} customerName - The representing customer name
     * @returns {Object|null} Object with subsidiaryId and subsidiaryName, or null if not found
     *
     * @example
     * getSubsidiaryDetails('IC-PSOF LP')
     * // Returns: { subsidiaryId: 8, subsidiaryName: 'PSOF LP' }
     */
    function getSubsidiaryDetails(customerName) {
        try {
            if (!customerName || typeof customerName !== 'string') {
                return null;
            }

            const trimmedName = customerName.trim();
            return SUBSIDIARY_MAP[trimmedName] || null;
        } catch (e) {
            log.error({
                title: 'Error in getSubsidiaryDetails',
                details: e.toString()
            });
            return null;
        }
    }

    /**
     * Check if a customer has a subsidiary mapping
     *
     * @param {string} customerName - The representing customer name
     * @returns {boolean} True if mapping exists, false otherwise
     *
     * @example
     * hasSubsidiaryMapping('IC-PSOF LP') // Returns: true
     * hasSubsidiaryMapping('Invalid') // Returns: false
     */
    function hasSubsidiaryMapping(customerName) {
        try {
            if (!customerName || typeof customerName !== 'string') {
                return false;
            }
            return SUBSIDIARY_MAP.hasOwnProperty(customerName.trim());
        } catch (e) {
            log.error({
                title: 'Error in hasSubsidiaryMapping',
                details: e.toString()
            });
            return false;
        }
    }

    /**
     * Get all available subsidiary mappings
     *
     * @returns {Object} Complete mapping object
     */
    function getAllMappings() {
        return SUBSIDIARY_MAP;
    }

    // Public API
    return {
        getSubsidiaryByCustomer: getSubsidiaryByCustomer,
        getSubsidiaryDetails: getSubsidiaryDetails,
        hasSubsidiaryMapping: hasSubsidiaryMapping,
        getAllMappings: getAllMappings
    };
});
