/**
 * Module Description
 * 
 * Version  Date		Author          Remarks
 * 1.00     22-11-19	Eric.Choe		MR script for Ad-hoc testing 
 * 											 
 */

/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/runtime', 'N/search', 'N/error', 'N/email', './lib/utils', './lib/postcode'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {error} error
 * @param {email} email
 * @param {email} utils
 * @param {email} postcode
 */
		
function(record, runtime, search, error, email, utils, postcode) {
   	
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
            var msg = 'Error encountered while processing web order: ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
            errorMsg.push(msg);
            return true;
        });
        if (errorMsg.length > 0){
            var e = error.create({
                name: 'WEBORDER_PROCESSING_FAILED',
                message: JSON.stringify(errorMsg)
            });
            handleErrorAndSendNotification(e, stage);
        }
    }

    function handleErrorAndSendNotification(e, stage){
        log.error('Stage: ' + stage + ' failed', e);
        var author = 18;
        var recipients = ['it@springfrree.co.nz']; //18 = Eric, 10 = Dan
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
    function getInputData() {
		var currRec	= record.load({
		    type: record.Type.SALES_ORDER, 
		    id: '9736421', // Sample Sales Order ID to compare
		    isDynamic: false,
		});
		var shipTo = search.lookupFields({
		    type: 'address',
		    id: currRec.getValue({fieldId: 'shippingaddress'}),
		    columns: ['addressee','phone','address1','city','state','zip','countrycode']
		});
		
		log.debug('getInputData', 'shipTo = ' + JSON.stringify(shipTo));
		
		var ship_City		= shipTo.city;
		var ship_Postcode   = shipTo.zip;   
		var ship_State	= postcode.getStateID(shipTo.countrycode,shipTo.state);
		var ship_Country	= postcode.getCountryID(shipTo.countrycode);
		var postCode   		= postcode.getPostCode(ship_City, ship_Postcode, ship_Country);	
		
		log.debug('getInputData', 'ship_City = ' + ship_City);
		log.debug('getInputData', 'postCode = ' + postCode);
		
    	return search.load({id : runtime.getCurrentScript().getParameter({ name: 'custscript_saved_search' })}); // Load search for web order stored in script parameter
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
    	try{
    		for(var i in context.values){
    			var currRecID	= JSON.parse(context.values[i]).id;   			
    			var currRec		= record.load({
    			    type: record.Type.SALES_ORDER, 
    			    id: currRecID,
    			    isDynamic: false,
    			});
    			var recSubsidiary	= currRec.getValue({fieldId: 'subsidiary'});
    			var shipTo = search.lookupFields({
    			    type: 'address',
    			    id: currRec.getValue({fieldId: 'shippingaddress'}),
    			    columns: ['addressee','phone','address1','city','state','zip','countrycode']
    			});
    			log.debug('Reduce', 'shipTo = ' + JSON.stringify(shipTo));
    			
    			var ship_City		= shipTo.city;
    			var ship_Postcode   = shipTo.zip;   
    			if(recSubsidiary == '5'){ // 5 = NZ
					var ship_State	= shipTo.state;
				}
				else{ // Converting State Code to internal ID
					var ship_State	= postcode.getStateID(shipTo.countrycode,shipTo.state);
				}
    			var ship_State		= postcode.getStateID(shipTo.countrycode,shipTo.state);
    			var ship_Country	= postcode.getCountryID(shipTo.countrycode);
    			var postCode   		= postcode.getPostCode(ship_City, ship_Postcode, ship_Country);
    			
    			log.debug('Reduce', 'ship_City = ' + ship_City);
				log.debug('Reduce', 'ship_State = ' + ship_State);
				log.debug('Reduce', 'ship_Postcode = ' + ship_Postcode);
				log.debug('Reduce', 'ship_Country = ' + ship_Country);   
    			log.debug('Reduce', 'postCode = ' + postCode);
    		}
    		
    	}catch(ex){
    		var processMssg 	= 'processing Web Order ';
    		log.error({
    		    title: 'Reduce', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
    	}
    }

    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        log.audit('summarize', 'Usage Consumed = ' + summary.usage + ' : Concurrency Number = ' + summary.concurrency + ' : Number of Yields = ', + summary.yields);
    	handleErrorIfAny(summary);
    }

    return {
        config: {
            retryCount: 1, // Change it to 1 after testing
            exitOnError: false
        },
    	getInputData: getInputData,
        reduce: reduce,
        summarize: summarize
    };
    
});