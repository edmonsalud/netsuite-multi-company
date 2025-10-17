/**
 * Module Description
 * 
 * Version  Date		Author          Remarks
 * 1.00     25-06-18	Eric.Choe		Created script to send scheduled product review email for trampoline purchase  
 * 													
 */

/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/runtime', 'N/search', 'N/error', 'N/email', 'N/render'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {error} error
 * @param {email} email
 * @param {email} render
 */
		
function(record, runtime, search, error, email, render) {
   	
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
            var msg = 'Error encountered while processing Item Fulfillment : ' + key + '. Error was : ' + JSON.parse(value).message + '\n';
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
        var recipients = [18]; //18 = Eric, 10 = Dan
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
    	return search.load({id : runtime.getCurrentScript().getParameter({ name: 'custscript_gs2_mr_se_search_if' })}); // Load search for eligible item fulfillment stored in script parameter
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
//    	log.debug('Reduce', 'Entry');
    	try{
    		var sub_Name = 'Invalid';
    		var review_Type = '1'; // 1 = Product Review, 2 = Customer Experience Review    		
    		for(var i in context.values){
//    			log.debug('Reduce', 'context.values = ' + JSON.stringify(JSON.parse(context.values[i])));
    			var rec_ID		= JSON.parse(context.values[i]).id;
    			var rec_Type	= JSON.parse(context.values[i]).recordType;
    			var rec_Email	= JSON.parse(context.values[i]).values['email.customerMain'];    			
    			// Load record
    			var rec_Obj		= record.load({
    			    type: rec_Type, 
    			    id: rec_ID,
    			    isDynamic: false,
    			});    			
    			if(rec_Obj){
    				var validItem			= false;
    				var email_Sender		= '';
    				var email_Template		= '';
    				var rec_Customer		= rec_Obj.getValue({fieldId: 'entity'});    				  				
    				var rec_totalItem		= rec_Obj.getLineCount({
                		sublistId: 'item'
                	});    				
    				var rec_Subsidiary		= rec_Obj.getValue({fieldId: 'subsidiary'});    				
    				//AU = 1, US = 3, CA = 4, NZ = 5
    				if(rec_Subsidiary == '1'){
    					sub_Name = 'AU';
    				}else if(rec_Subsidiary == '3'){
    					sub_Name = 'US';
    				}else if(rec_Subsidiary == '4'){
    					sub_Name = 'CA';
    				}else if(rec_Subsidiary == '5'){
    					sub_Name = 'NZ';
    				}    				
    				// Check if there is any eligible trampoline model in line item
                	for(var i = 0; i<rec_totalItem; i++){ // Caution: Line item index starts from 0, not 1          		      		
                		var thisItem = rec_Obj.getSublistValue({
                		    sublistId: 'item',
                		    fieldId: 'item',
                		    line: i
                		});              		                		
                		// Search if this line item is an eligible trampoline model
                		var mySearch = search.create({
        					type: 'customrecord_cust_review_email_temp',
        					filters: [{
        						name: 'isinactive',
        						operator: 'is',
        						values: false
        					}, {
        						name: 'custrecord_cret_subsidiary',
        			            operator: 'is',
        			            values: rec_Subsidiary
        					}, {
        						name: 'custrecord_cret_cust_review_type',
        			            operator: 'is',
        			            values: review_Type
        					}, {
        						name: 'custrecord_cret_item',
        			            operator: 'is',
        			            values: thisItem
        					}],
        					columns: ['custrecord_cret_sender', 'custrecord_cret_template', 'custrecord_cret_item']			
        				});
        				mySearch.run().each(function(result){       					
//        					log.debug('Reduce', 'result = ' + JSON.stringify(result));
        					if(result.id){
        						email_Sender		= result.getValue({name: 'custrecord_cret_sender'});
        						email_Template		= result.getValue({name: 'custrecord_cret_template'});
        						validItem 			= true;
            					log.audit('Reduce - ' + sub_Name, rec_Type + ' = ' + rec_ID + ' : Line Item Row = ' + (i+1)
            							+ ' : Trampoline = ' + result.getText({name: 'custrecord_cret_item'})
            							+ ' : Sender = "' + result.getText({name: 'custrecord_cret_sender'})
            							+ '" : Email Template = "' + result.getText({name: 'custrecord_cret_template'}) +'"'); 
        						return false; //  returns a boolean which can be used to stop the iteration with a value of false, or continue the iteration with a value of true.
        					}
        				});
        				if(validItem){
        					break; // Stop searching for the rest of line item
        				}
                	}             		
                	if(validItem){
                		// Load email template to render email subject and body
                		var merge_Result = render.mergeEmail({
                		    templateId: email_Template,
                		    entity: record.load({ // Set up linked records to auto-populate NS tags in email template	
                		        type: 'customer',
                		        id: rec_Customer
                		        }),
                		    transactionId : parseInt(rec_ID) // Set up linked records to auto-populate NS tags in email template	    
                		});
                		// Send Email to customer
                   	 	email.send({
                            author: email_Sender, 
                            recipients: rec_Email,
                            subject: merge_Result.subject, // Subject from email template
                            body: merge_Result.body, // Body from email template
                            relatedRecords: {
                            	transactionId : rec_ID,
                            	entityId : rec_Customer
                            }
                        });
                		// Update flag field
                   	 	rec_Obj.setValue({
    	            		fieldId: 'custbody_order_status',
    	            		value: '6' // 6 = Product Review Email Sent
    	            	});              
                		// Save record                		
                		rec_Obj.save({       
                    		enableSourcing: false,
                    		ignoreMandatoryFields : true
                    	});  
                	}
    			}
    			else{
    				// Invalid record - already deleted?
    				log.error('Reduce - ' + sub_Name, 'Cannot find record id = ' + rec_ID);
    			}   			
    		}   		       	
    	}catch(ex){
    		var processMssg 	= 'processing Item Fulfillment ';
    		log.error({
    		    title: 'Reduce - ' + sub_Name, 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + getErrorMessage(ex) + ']'
    		});
    	}
    }
    
	function getErrorMessage(ex){// To return full details of error message
		var errorMssg 	= ex.toString();
		var stackTrace	= ex.stack;
		if (stackTrace){			
			errorMssg	= 'Error Name : ' + ex.name + ', ' + '\n'
						+ 'Message : ' + ex.message + ', '+ '\n'
						+ 'Stack Trace : ' + ex.stack;	
		}		
		return errorMssg
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
            retryCount: 0, // Change it to 1 after testing
            exitOnError: false
        },
    	getInputData: getInputData,
        reduce: reduce,
        summarize: summarize
    };  
});