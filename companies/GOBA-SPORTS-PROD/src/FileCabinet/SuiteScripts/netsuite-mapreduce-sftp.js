/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/file', 'N/sftp', 'N/log', 'N/record', 'N/runtime', 'N/format'], 
    (search, file, sftp, log, record, runtime, format) => {

    // SFTP Configuration
    const SFTP_CONFIG = {
        host: '18.208.213.72',
        port: 22,
        username: 'powerbi',
        passwordGuid: '10bbdf74507e454abdd6d15f201e8a68',
        hostKey: 'AAAAB3NzaC1yc2EAAAADAQABAAABAQDAQd32KucJIHJExtzFgDpOpc0nA2Jerdt2135hZHy8RKX+/FQcaikhgVhg/BmoPgaVi6JCWN7ACwEjk0zajUrT4Z5rLNUIGTZfTwNjPgVtIRUzbAdJo8FweKpchfTY9KaYFKpWPdVm0Dp5mzu6UVr7YOiG+C0zdi9R5sUyy9WTaa8h1wDwtAa4d2zFpliWOPY47TLLUrDcGW2GebpOFkk4ARf2ibGTxRlbRg7eJROWDltuQ2XGgU1hO/X1Icdm5wsaJmms+6jtElLyWwud3DiLNK7UKH1RWoItpjVfE9QGifre57WEoivdXvCoYYDWf1ldwfKqWjy4wPF47aM/NZ99'
    };

    /**
     * Defines the function that is executed at the beginning of the map/reduce process
     * @param {Object} inputContext
     * @returns {Array|Object} The search results or input data
     */
    const getInputData = () => {
        log.audit('getInputData', 'Starting Map/Reduce to export saved searches to SFTP');
        
        // Create and run the search for active mappings
        // Include the new fields for frequency control and file naming
        return search.create({
            type: "customrecord_powerbi_ss_sftp",
            filters: [
                ["isinactive", "is", "F"]
            ],
            columns: [
                search.createColumn({name: "internalid", label: "Internal ID"}),
                search.createColumn({name: "custrecord_savedsearch_source", label: "Saved Search Source"}),
                search.createColumn({name: "custrecord_sftp_directory", label: "SFTP Directory"}),
                search.createColumn({name: "custrecord_frequency", label: "Upload Frequency"}),
                search.createColumn({name: "custrecord_last_upload_datetime", label: "Last Upload DateTime"}),
                search.createColumn({name: "custrecord_file_name_prefix", label: "File Name Prefix"})
            ]
        });
    };

    /**
     * Converts 12-hour time format to 24-hour format for comparison
     * @param {string} time12h - Time in format "HH:MM AM/PM"
     * @returns {string} Time in 24-hour format "HH:MM"
     */
    const convertTo24Hour = (time12h) => {
        if (!time12h) return null;
        
        const [time, period] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours);
        
        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
        
        return hours.toString().padStart(2, '0') + ':' + minutes;
    };

    /**
     * Checks if we should process based on schedule, handling delayed executions
     * @param {Array|string} scheduledTimes - Selected times from multi-select field
     * @param {string} lastUploadDateTime - Last upload date/time string
     * @returns {boolean} True if should process, false if should skip
     */
    const shouldProcessRecord = (scheduledTimes, lastUploadDateTime) => {
        // If no times are selected, always process (backward compatibility)
        if (!scheduledTimes || (Array.isArray(scheduledTimes) && scheduledTimes.length === 0)) {
            log.debug('Frequency Check', 'No scheduled times set - processing record');
            return true;
        }

        // Convert scheduledTimes to array if it's a string
        let timesArray = [];
        if (typeof scheduledTimes === 'string') {
            timesArray = [scheduledTimes];
        } else if (Array.isArray(scheduledTimes)) {
            timesArray = scheduledTimes;
        }

        // Get current time
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentDate = now.toDateString();

        // Convert scheduled times to hours
        const scheduledHours = [];
        for (let scheduledTime of timesArray) {
            const time24h = convertTo24Hour(scheduledTime);
            if (time24h) {
                scheduledHours.push(parseInt(time24h.split(':')[0]));
            }
        }

        // Sort scheduled hours for easier missed schedule detection
        scheduledHours.sort((a, b) => a - b);

        // Check for any missed uploads today
        let shouldUpload = false;
        let targetHour = null;

        for (let hour of scheduledHours) {
            // Check if this scheduled time has passed or is current
            if (hour <= currentHour) {
                // Check if we already uploaded for this hour today
                let alreadyUploaded = false;
                
                if (lastUploadDateTime) {
                    const lastUpload = new Date(lastUploadDateTime);
                    const lastUploadDate = lastUpload.toDateString();
                    const lastUploadHour = lastUpload.getHours();
                    
                    // Check if we uploaded today and if that upload covers this scheduled hour
                    if (lastUploadDate === currentDate) {
                        // Find the scheduled hour that the last upload would have covered
                        for (let schedHour of scheduledHours) {
                            if (schedHour <= lastUploadHour) {
                                if (schedHour === hour) {
                                    alreadyUploaded = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                if (!alreadyUploaded) {
                    shouldUpload = true;
                    targetHour = hour;
                    break; // Process the earliest missed upload
                }
            }
        }

        // Allow grace period for delayed executions (e.g., up to 30 minutes into next hour)
        if (!shouldUpload && currentMinutes <= 30) {
            const previousHour = currentHour === 0 ? 23 : currentHour - 1;
            if (scheduledHours.includes(previousHour)) {
                // Check if we missed the previous hour's upload
                let missedPreviousHour = true;
                
                if (lastUploadDateTime) {
                    const lastUpload = new Date(lastUploadDateTime);
                    const lastUploadDate = lastUpload.toDateString();
                    const lastUploadHour = lastUpload.getHours();
                    
                    if (lastUploadDate === currentDate && lastUploadHour === previousHour) {
                        missedPreviousHour = false;
                    }
                }
                
                if (missedPreviousHour) {
                    shouldUpload = true;
                    targetHour = previousHour;
                }
            }
        }

        log.debug('Frequency Check', {
            scheduledHours: scheduledHours,
            currentHour: currentHour,
            currentMinutes: currentMinutes,
            targetHour: targetHour,
            lastUpload: lastUploadDateTime,
            shouldProcess: shouldUpload
        });

        return shouldUpload;
    };

    /**
     * Defines the function that is executed when the map entry point is triggered
     * @param {Object} context - Data collection containing the key-value pairs to process
     */
    const map = (context) => {
        try {
            log.debug('Map Stage', 'Processing: ' + context.value);
            
            const searchResult = JSON.parse(context.value);
            const recordId = searchResult.id;
            
            // Extract frequency settings and file name prefix
            let scheduledTimes = searchResult.values.custrecord_frequency;
            let lastUploadDateTime = searchResult.values.custrecord_last_upload_datetime;
            let fileNamePrefix = searchResult.values.custrecord_file_name_prefix;
            
            // Check if we should process this record based on schedule
            if (!shouldProcessRecord(scheduledTimes, lastUploadDateTime)) {
                log.audit('Skipping', 'Record ' + recordId + ' not scheduled for upload at this time');
                
                // Write skip status to context
                context.write({
                    key: recordId,
                    value: {
                        success: true,
                        skipped: true,
                        reason: 'Not scheduled for upload at current time'
                    }
                });
                return;
            }
            
            // Extract saved search ID - handle both object and string formats
            let savedSearchId = searchResult.values.custrecord_savedsearch_source;
            log.debug('Raw saved search value', JSON.stringify(savedSearchId));
            
            if (savedSearchId && typeof savedSearchId === 'object') {
                // If it's an object, get the value property
                savedSearchId = savedSearchId.value || savedSearchId.text || savedSearchId;
            }
            
            // Extract SFTP directory - handle both object and string formats
            let sftpDirectory = searchResult.values.custrecord_sftp_directory;
            if (sftpDirectory && typeof sftpDirectory === 'object') {
                sftpDirectory = sftpDirectory.value || sftpDirectory.text || sftpDirectory;
            }
            
            // Clean up directory path
            if (sftpDirectory) {
                // Remove /home/powerbi if present since user logs into home directory
                sftpDirectory = sftpDirectory.replace(/^\/home\/powerbi\/?/, '');
                // If empty after cleanup, use current directory
                if (!sftpDirectory) {
                    sftpDirectory = '.';
                }
            } else {
                sftpDirectory = '.';
            }
            
            log.debug('Directory path', 'Original: ' + searchResult.values.custrecord_sftp_directory + ', Using: ' + sftpDirectory);
            
            if (!savedSearchId) {
                log.error('Map Error', 'No saved search ID found for record: ' + recordId);
                return;
            }

            log.audit('Processing', 'Saved Search ID: ' + savedSearchId + ', Directory: ' + sftpDirectory);

            // Load and run the saved search
            const searchObj = search.load({
                id: savedSearchId
            });

            // Get search title dynamically
            let searchTitle = getSearchTitle(savedSearchId, searchObj);
            
            // Process search results and create CSV using pagination
            const csvResult = processLargeSearchToCSV(searchObj);
            
            log.debug('Search Results', 'Processed ' + csvResult.recordCount + ' records for search: ' + searchTitle);

            // Generate filename
            let filename;
            if (fileNamePrefix && fileNamePrefix.trim()) {
                // Use exact file name prefix if provided
                filename = fileNamePrefix.trim() + '.csv';
            } else {
                // Use original method with search title
                const sanitizedTitle = searchTitle
                    .replace(/[\[\]]/g, '') // Remove brackets
                    .replace(/[^a-zA-Z0-9_-\s]/g, '') // Remove other special chars
                    .replace(/\s+/g, '_') // Replace spaces with underscores
                    .trim();
                filename = sanitizedTitle + '.csv';
            }

            // Create file
            const csvFile = file.create({
                name: filename,
                fileType: file.Type.CSV,
                contents: csvResult.csvContent,
                folder: -15 // Temp folder
            });

            // Connect to SFTP and upload
            const connection = sftp.createConnection({
                username: SFTP_CONFIG.username,
                passwordGuid: SFTP_CONFIG.passwordGuid,
                url: SFTP_CONFIG.host,
                port: SFTP_CONFIG.port,
                hostKey: SFTP_CONFIG.hostKey
            });

            // Upload file
            connection.upload({
                directory: sftpDirectory,
                filename: filename,
                file: csvFile,
                replaceExisting: true
            });

            log.audit('Upload Success', 'File ' + filename + ' uploaded to ' + sftpDirectory);

            // Update the last upload datetime
            try {
                record.submitFields({
                    type: 'customrecord_powerbi_ss_sftp',
                    id: recordId,
                    values: {
                        custrecord_last_upload_datetime: new Date()
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                log.debug('Updated timestamp', 'Record ' + recordId + ' last upload time updated');
            } catch (updateError) {
                log.error('Timestamp Update Error', 'Failed to update last upload time for record ' + recordId + ': ' + updateError.message);
            }

            // Write success to context
            context.write({
                key: recordId,
                value: {
                    success: true,
                    savedSearchId: savedSearchId,
                    filename: filename,
                    directory: sftpDirectory,
                    recordCount: csvResult.recordCount
                }
            });

        } catch (e) {
            log.error('Map Error', 'Error processing record ' + context.key + ': ' + e.message);
            
            // Write error to context
            context.write({
                key: context.key,
                value: {
                    success: false,
                    error: e.message
                }
            });
        }
    };

    /**
     * Get search title using multiple methods
     * @param {string} savedSearchId - The saved search internal ID
     * @param {Object} searchObj - The loaded search object
     * @returns {string} The search title
     */
    const getSearchTitle = (savedSearchId, searchObj) => {
        let searchTitle = '';
        
        try {
            // Method 1: Try to get from search object
            searchTitle = searchObj.title || '';
            
            // Method 2: If no title, load the search record to get the name
            if (!searchTitle) {
                const searchFields = search.lookupFields({
                    type: search.Type.SAVED_SEARCH,
                    id: savedSearchId,
                    columns: ['title']
                });
                searchTitle = searchFields.title || '';
            }
            
            // Method 3: If still no title, try loading as record
            if (!searchTitle) {
                try {
                    const searchRecord = record.load({
                        type: record.Type.SAVED_SEARCH,
                        id: savedSearchId
                    });
                    searchTitle = searchRecord.getValue('title') || searchRecord.getValue('name') || '';
                } catch (recordError) {
                    log.debug('Record load attempt', recordError);
                }
            }
        } catch (e) {
            log.debug('Title retrieval error', e);
        }
        
        // Fallback if no title found
        if (!searchTitle) {
            searchTitle = 'saved_search_' + savedSearchId;
        }
        
        return searchTitle;
    };

    /**
     * Process large search results and create CSV using pagination
     * @param {Search} searchObj - The search object
     * @returns {Object} Object containing csvContent and recordCount
     */
    const processLargeSearchToCSV = (searchObj) => {
        const csvLines = [];
        const columns = searchObj.columns;
        
        // Create header row
        const headers = columns.map(col => {
            let label = col.label || col.name;
            // Handle join columns
            if (col.join) {
                label = col.join + '.' + label;
            }
            // Escape quotes in header
            if (label.includes('"') || label.includes(',')) {
                label = '"' + label.replace(/"/g, '""') + '"';
            }
            return label;
        });
        csvLines.push(headers.join(','));
        
        // Process results using pagination to handle large datasets
        let start = 0;
        const pageSize = 1000;
        let hasMore = true;
        let totalRecords = 0;
        
        try {
            while (hasMore) {
                const pagedResults = searchObj.run().getRange({
                    start: start,
                    end: start + pageSize
                });
                
                if (pagedResults.length === 0) {
                    hasMore = false;
                } else {
                    // Process this page of results
                    pagedResults.forEach(result => {
                        const row = columns.map(col => {
                            let value = result.getText(col) || result.getValue(col) || '';
                            
                            // Handle special characters in CSV
                            if (typeof value === 'string' && (value.includes('"') || value.includes(',') || value.includes('\n'))) {
                                value = '"' + value.replace(/"/g, '""') + '"';
                            }
                            
                            return value;
                        });
                        csvLines.push(row.join(','));
                        totalRecords++;
                    });
                    
                    // If we got a full page, there might be more
                    if (pagedResults.length === pageSize) {
                        start += pageSize;
                    } else {
                        hasMore = false;
                    }
                    
                    // Log progress for large datasets
                    if (totalRecords % 5000 === 0) {
                        log.audit('Progress', 'Processed ' + totalRecords + ' records');
                    }
                }
            }
        } catch (e) {
            log.error('Search Processing Error', 'Error at record ' + totalRecords + ': ' + e.message);
            throw e;
        }
        
        return {
            csvContent: csvLines.join('\n'),
            recordCount: totalRecords
        };
    };

    /**
     * Defines the function that is executed when the reduce entry point is triggered
     * @param {Object} context
     */
    const reduce = (context) => {
        // Not needed for this use case - all processing done in map
    };

    /**
     * Defines the function that is executed when the summarize entry point is triggered
     * @param {Object} context
     */
    const summarize = (context) => {
        log.audit('Summarize', 'Map/Reduce process completed');
        
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        const errors = [];
        
        // Process output from map stage
        context.output.iterator().each((key, value) => {
            const result = JSON.parse(value);
            if (result.success) {
                if (result.skipped) {
                    skippedCount++;
                    log.debug('Skipped', 'Record ' + key + ' - ' + result.reason);
                } else {
                    successCount++;
                    log.audit('Success', 'Saved Search ' + result.savedSearchId + ' exported as ' + result.filename + ' (' + result.recordCount + ' records)');
                }
            } else {
                errorCount++;
                errors.push({
                    recordId: key,
                    error: result.error
                });
            }
            return true;
        });
        
        // Log summary
        log.audit('Summary', 'Successfully processed: ' + successCount + ', Skipped: ' + skippedCount + ', Errors: ' + errorCount);
        
        if (errors.length > 0) {
            log.error('Errors Summary', JSON.stringify(errors));
        }
        
        // Log any map/reduce errors
        if (context.mapSummary.errors) {
            for (let key in context.mapSummary.errors) {
                log.error('Map Error', 'Key: ' + key + ', Error: ' + context.mapSummary.errors[key]);
            }
        }
    };

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});