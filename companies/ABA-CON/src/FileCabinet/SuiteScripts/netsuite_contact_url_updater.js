/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @Description Updates ALL contact records with Suitelet URL for PDF generation (overwrites existing values)
 * @Version 2.1 - Added validation logging, always overwrites custentity_print_url field
 */
define(['N/search', 'N/record', 'N/log', 'N/runtime'], 
    (search, record, log, runtime) => {

    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     * @typedef {Object} ObjectRef
     * @property {string} id - Internal ID of the record instance
     * @property {string} type - Record type id
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    const getInputData = () => {
        try {
            log.audit('getInputData', 'Starting to fetch all contact records');
            
            // Create search for all contact records
            // We only need the internal ID since that's all we need to construct the URL
            const contactSearch = search.create({
                type: search.Type.CONTACT,
                filters: [],
                columns: [
                    search.createColumn({
                        name: 'internalid',
                        label: 'Internal ID'
                    }),
                    search.createColumn({
                        name: 'entityid',
                        label: 'Name'
                    }),
                    // Include current URL value to check if update is needed (optional)
                    search.createColumn({
                        name: 'custentity_print_url',
                        label: 'Current Print URL'
                    })
                ]
            });
            
            const searchResultCount = contactSearch.runPaged().count;
            log.audit('getInputData', `Found ${searchResultCount} contact records to process`);
            
            return contactSearch;
            
        } catch (e) {
            log.error('getInputData Error', `Error: ${e.message}\n${e.stack}`);
            throw e;
        }
    };

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     * @param {MapContext} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    const map = (context) => {
        try {
            // Parse the search result
            const searchResult = JSON.parse(context.value);
            const contactId = searchResult.id;
            const contactName = searchResult.values.entityid;
            const currentUrl = searchResult.values.custentity_print_url;
            
            // Construct the new URL - Using Suitelet with dynamic contact ID parameter
            const newUrl = `https://8606430.app.netsuite.com/app/site/hosting/scriptlet.nl?script=3247&deploy=1&contactId=${contactId}`;

            // Log the field change for validation
            log.error('map - Field Update Validation',
                `Contact ID: ${contactId}\n` +
                `Contact Name: ${contactName}\n` +
                `OLD URL Value: ${currentUrl || '(empty)'}\n` +
                `NEW URL Value: ${newUrl}\n` +
                `Field Being Set: custentity_print_url`
            );

            try {
                // Update the contact record - always overwrite
                record.submitFields({
                    type: record.Type.CONTACT,
                    id: contactId,
                    values: {
                        'custentity_print_url': newUrl
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

                // Log successful update for validation
                log.error('map - Update Success Validation',
                    `Contact ID ${contactId} successfully updated\n` +
                    `Field: custentity_print_url\n` +
                    `Set to: ${newUrl}\n` +
                    `Previous value: ${currentUrl || '(empty)'}`
                );
                
                // Write success to context for reduce stage
                context.write({
                    key: contactId,
                    value: {
                        status: 'success',
                        name: contactName,
                        url: newUrl
                    }
                });
                
            } catch (updateError) {
                log.error('map - Update Error', `Failed to update Contact ID ${contactId}: ${updateError.message}`);
                
                // Write error to context for reduce stage
                context.write({
                    key: contactId,
                    value: {
                        status: 'error',
                        name: contactName,
                        error: updateError.message
                    }
                });
            }
            
        } catch (e) {
            log.error('map - General Error', `Error processing record: ${e.message}\n${e.stack}`);
            
            // Try to write error context even if we couldn't parse the initial value
            context.write({
                key: context.key || 'unknown',
                value: {
                    status: 'error',
                    error: e.message
                }
            });
        }
    };

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     * @param {ReduceContext} context - Data collection containing the key/value pairs to process through the reduce stage
     * @since 2015.1
     */
    const reduce = (context) => {
        try {
            const contactId = context.key;
            const results = context.values.map(v => JSON.parse(v));
            
            // Log the results for this contact
            results.forEach(result => {
                if (result.status === 'error') {
                    log.error('reduce - Error Record', `Contact ID ${contactId}: ${result.error}`);
                } else if (result.status === 'skipped') {
                    log.audit('reduce - Skipped Record', `Contact ID ${contactId}: ${result.message}`);
                } else {
                    log.audit('reduce - Success Record', `Contact ID ${contactId}: Successfully updated`);
                }
            });
            
        } catch (e) {
            log.error('reduce - Error', `Error in reduce for key ${context.key}: ${e.message}`);
        }
    };

    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     * @param {SummaryContext} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    const summarize = (summary) => {
        try {
            log.audit('summarize', '==== Map/Reduce Script Completed ====');
            
            // Log input data errors
            if (summary.inputSummary.error) {
                log.error('Input Data Error', summary.inputSummary.error);
            }
            
            // Count and log map errors
            let mapErrorCount = 0;
            summary.mapSummary.errors.iterator().each((key, error) => {
                mapErrorCount++;
                log.error('Map Error', `Key: ${key}, Error: ${error}`);
                return true;
            });
            
            // Count and log reduce errors
            let reduceErrorCount = 0;
            summary.reduceSummary.errors.iterator().each((key, error) => {
                reduceErrorCount++;
                log.error('Reduce Error', `Key: ${key}, Error: ${error}`);
                return true;
            });
            
            // Log summary statistics
            const stats = {
                'Total Records Processed': summary.mapSummary.keys.length,
                'Map Errors': mapErrorCount,
                'Reduce Errors': reduceErrorCount,
                'Duration (seconds)': summary.seconds,
                'Concurrency': summary.concurrency,
                'Yields': summary.yields,
                'Usage Consumed': summary.usage,
                'Usage Units Remaining': runtime.getCurrentScript().getRemainingUsage()
            };
            
            log.audit('Summary Statistics', JSON.stringify(stats, null, 2));
            
            // Log completion
            log.audit('summarize', '==== Update Complete ====');
            
        } catch (e) {
            log.error('summarize - Error', `Error in summarize: ${e.message}\n${e.stack}`);
        }
    };

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
