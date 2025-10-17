/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * Module Description
 * 
 * Version  Date		Author          Remarks
 * 1.00     07-08-18	Eric.Choe		Created following functions
 * 											- function handleErrorIfAny(summary)
 * 											- function handleErrorInStage(stage, summary)
 * 											- function handleErrorAndSendNotification(e, stage)
 * 											- function isNULL(value)
 * 											- function getInputData()
 * 											- function map(context)
 * 											- function reduce(context)
 * 											- function summarize(summary)									
 * 
 */

define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error'],
/**
 * @param {search} search
 * @param {record} record
 * @param {email} email
 * @param {runtime} runtime 
 * @param {error} error
 */
function(search, record, email, runtime, error) {
	

    function handleErrorIfAny(summary){
        var inputSummary = summary.inputSummary;
        var mapSummary = summary.mapSummary;
        var reduceSummary = summary.reduceSummary;

        if (inputSummary.error){
            var e = error.create({
                name: 'INPUT_STAGE_FAILED',
                message: inputSummary.error
            });
            handleErrorAndSendNotification(e, 'getInputData');
        }

        handleErrorInStage('map', mapSummary);
        handleErrorInStage('reduce', reduceSummary);
    }

    	
    function handleErrorInStage(stage, summary){
        var errorMsg = [];
        summary.errors.iterator().each(function(key, value){
            var msg = 'Failure to delete Item ATP Snapshot record: ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
            errorMsg.push(msg);
            return true;
        });
        if (errorMsg.length > 0){
            var e = error.create({
                name: 'RECORD_DELETE_FAILED',
                message: JSON.stringify(errorMsg)
            });
            handleErrorAndSendNotification(e, stage);
        }
    }

    function handleErrorAndSendNotification(e, stage){
        log.error('Stage: ' + stage + ' failed', e);
        var author = 18;
        var recipients = [18,10]; //18 = Eric, 10 = Dan
        var subject = 'Map/Reduce script ' + runtime.getCurrentScript().id + ' failed for stage: ' + stage;
        var body = 'An error occurred with the following information:\n'
        			+ 'Error code: ' + e.name + '\n'
        			+ 'Error msg: ' + e.message;
		email.send({
		    author: author,
		    recipients: recipients,
		    subject: subject,
		    body: body
		});
}
    
    function isNULL(value){ // Check "value" is NULL or empty value
        return(value == null || value == "" || value == undefined);
    }
    
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData(){
    	return search.load({id : runtime.getCurrentScript().getParameter({ name: 'custscript_search_delete' })}); // Search criteria to delete
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */

    function map(context){
    	var searchResult = JSON.parse(context.value);
        var recID = searchResult.id;
        var recItem = searchResult.values.custrecord_atpsnapshot_item.text;
//      var recItem = searchResult.values.formulatext; // Mapping by parent item => reverted back to use child item as it will break if there are more than appx. 1200 records (4 unit to delete)  
//      log.debug('map', 'context.value = ' + context.value);
//      log.debug('map', 'recItem = ' + recItem + ', recID = ' + recID);
     		
        if(isNULL(recItem)){ // Item is removed from Item ATP Snapshot record
        	recItem = 'Item Removed';
        }

        context.write({
            key: recItem,  
            value: recID 
        }); 
    }
    
    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context){
//    	log.debug('reduce', 'Entry');
		for(var i in context.values){
        	record.delete({
        		type: 'customrecord_atpsnapshot', 
				id: context.values[i],
			});
//    		log.debug('reduce', 'Record deleted : ID = ' + context.values[i] + ', Item = ' + context.key);
    	};
//    	log.audit('reduce', 'Total deleted records = ' + i++);
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary){
//    	log.debug('summarize', 'Entry');
        log.audit('summarize', 'Usage Consumed = ' + summary.usage);
        log.audit('summarize', 'Concurrency Number = ' + summary.concurrency);
        log.audit('summarize', 'Number of Yields = ', + summary.yields);
    	handleErrorIfAny(summary);
    }

    return {
        config: {
            retryCount: 3,
            exitOnError: false
        },
    	getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
