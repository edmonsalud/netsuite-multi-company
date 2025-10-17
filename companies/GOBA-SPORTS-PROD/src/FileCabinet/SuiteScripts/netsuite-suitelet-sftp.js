/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/file', 'N/sftp', 'N/ui/serverWidget', 'N/log', 'N/record'], 
    (search, file, sftp, serverWidget, log, record) => {

    // Configuration - Update these values as needed
   // const SAVED_SEARCH_ID = '11727';
  const SAVED_SEARCH_ID = '11170'
    const SFTP_CONFIG = {
        host: '18.208.213.72',
        port: 22,
        username: 'powerbi',
        passwordGuid: '7cde44ad07d149848fab87bdfa868765',
        directory: '.', // Current directory (user's home directory)
        hostKey: 'AAAAB3NzaC1yc2EAAAADAQABAAABAQDAQd32KucJIHJExtzFgDpOpc0nA2Jerdt2135hZHy8RKX+/FQcaikhgVhg/BmoPgaVi6JCWN7ACwEjk0zajUrT4Z5rLNUIGTZfTwNjPgVtIRUzbAdJo8FweKpchfTY9KaYFKpWPdVm0Dp5mzu6UVr7YOiG+C0zdi9R5sUyy9WTaa8h1wDwtAa4d2zFpliWOPY47TLLUrDcGW2GebpOFkk4ARf2ibGTxRlbRg7eJROWDltuQ2XGgU1hO/X1Icdm5wsaJmms+6jtElLyWwud3DiLNK7UKH1RWoItpjVfE9QGifre57WEoivdXvCoYYDWf1ldwfKqWjy4wPF47aM/NZ99'
    };

    /**
     * Definition of the Suitelet script trigger point.
     * @param {Object} context
     * @param {ServerRequest} context.request - Incoming request
     * @param {ServerResponse} context.response - Suitelet response
     */
    const onRequest = (context) => {
        try {
            if (context.request.method === 'GET') {
                // Display form
                const form = createForm();
                context.response.writePage(form);
            } else {
                // POST - Process the export
                const result = processExport();
                
                // Display result
                const form = createForm();
                if (result.success) {
                    form.addField({
                        id: 'custpage_message',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: ' '
                    }).defaultValue = '<div style="color: green; font-weight: bold;">Export completed successfully! File "' + (result.filename || 'export') + '" uploaded to SFTP.</div>';
                } else {
                    form.addField({
                        id: 'custpage_message',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: ' '
                    }).defaultValue = '<div style="color: red; font-weight: bold;">Error: ' + result.error + '</div>';
                }
                context.response.writePage(form);
            }
        } catch (e) {
            log.error('Suitelet Error', e);
            context.response.write('Error: ' + e.message);
        }
    };

    /**
     * Creates the suitelet form
     * @returns {Form} The form object
     */
    const createForm = () => {
        const form = serverWidget.createForm({
            title: 'Export Saved Search to SFTP'
        });

        form.addField({
            id: 'custpage_info',
            type: serverWidget.FieldType.INLINEHTML,
            label: ' '
        }).defaultValue = '<p>Click the button below to export saved search (ID: ' + SAVED_SEARCH_ID + ') to SFTP server.</p>' +
                          '<p>The file will be named based on the saved search title.</p>';

        form.addSubmitButton({
            label: 'Export to SFTP'
        });

        return form;
    };

    /**
     * Process the export - run search, create CSV, upload to SFTP
     * @returns {Object} Result object with success status and error if any
     */
    const processExport = () => {
        try {
            log.audit('Export Process', 'Starting export process');

            // Step 1: Load and run the saved search
            const searchObj = search.load({
                id: SAVED_SEARCH_ID
            });

            // Get search title dynamically
            let searchTitle = '';
            try {
                // Method 1: Try to get from search object
                searchTitle = searchObj.title || '';
                
                // Method 2: If no title, load the search record to get the name
                if (!searchTitle) {
                    const searchFields = search.lookupFields({
                        type: search.Type.SAVED_SEARCH,
                        id: SAVED_SEARCH_ID,
                        columns: ['title']
                    });
                    searchTitle = searchFields.title || '';
                }
                
                // Method 3: If still no title, try loading as record
                if (!searchTitle) {
                    try {
                        const searchRecord = record.load({
                            type: record.Type.SAVED_SEARCH,
                            id: SAVED_SEARCH_ID
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
                searchTitle = 'saved_search_' + SAVED_SEARCH_ID;
            }
            
            log.audit('Search Title Retrieved', searchTitle);
            
            // Sanitize filename - remove special characters and spaces
            const sanitizedTitle = searchTitle
                .replace(/[\[\]]/g, '') // Remove brackets
                .replace(/[^a-zA-Z0-9_-\s]/g, '') // Remove other special chars
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .trim();
            const filename = sanitizedTitle + '.csv';
            
            log.audit('Filename', 'Using filename: ' + filename);

            // Get all results
            const searchResults = [];
            searchObj.run().each((result) => {
                searchResults.push(result);
                return true; // Continue to next result
            });

            log.audit('Search Results', 'Found ' + searchResults.length + ' records');

            // Step 2: Create CSV content
            const csvContent = createCSVContent(searchObj, searchResults);

            // Step 3: Create file object
            const csvFile = file.create({
                name: filename,
                fileType: file.Type.CSV,
                contents: csvContent,
                folder: -15 // Temp folder
            });

            log.audit('CSV File', 'Created CSV file: ' + filename);

            // Step 4: Connect to SFTP and upload
            const connection = sftp.createConnection({
                username: SFTP_CONFIG.username,
                passwordGuid: SFTP_CONFIG.passwordGuid,
                url: SFTP_CONFIG.host,
                port: SFTP_CONFIG.port,
                hostKey: SFTP_CONFIG.hostKey
            });

            // Upload file (overwrite if exists)
            connection.upload({
                directory: SFTP_CONFIG.directory,
                filename: filename,
                file: csvFile,
                replaceExisting: true
            });

            log.audit('SFTP Upload', 'File uploaded successfully: ' + filename);

            return { success: true, filename: filename };

        } catch (e) {
            log.error('Process Export Error', e);
            return { success: false, error: e.message, filename: null };
        }
    };

    /**
     * Creates CSV content from search results
     * @param {Search} searchObj - The search object
     * @param {Array} results - Array of search results
     * @returns {string} CSV formatted string
     */
    const createCSVContent = (searchObj, results) => {
        const columns = searchObj.columns;
        const csvLines = [];

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

        // Create data rows
        results.forEach(result => {
            const row = columns.map(col => {
                let value = result.getText(col) || result.getValue(col) || '';
                
                // Handle special characters in CSV
                if (typeof value === 'string' && (value.includes('"') || value.includes(',') || value.includes('\n'))) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                
                return value;
            });
            csvLines.push(row.join(','));
        });

        return csvLines.join('\n');
    };

    return { onRequest };
});