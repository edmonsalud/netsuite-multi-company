/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     24-06-20	Eric.Choe		Created following functions to create visitor tracker for Pick-Up or Cash & Carry order fulfillment
 * 											- function afterSubmit(scriptContext)
 * 											- 
 * 
**/


/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/record', 'N/search', './lib/utils'],
/**
 * @param {runtime} runtime
 * @param {record} record
 * @param {search} search
 */
function(runtime, record, search, utils) {

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
    	try{
    		if(utils.isUI()){
    			var eventType		= scriptContext.type;
    			var recSubsidiary	= scriptContext.newRecord.getValue({
    	    		fieldId: 'subsidiary'
    	    	});
    	    	var parentRec		= scriptContext.newRecord.getValue({
    	    		fieldId: 'createdfrom'
    	    	});
    	    	var createVT = false;
    	    	if((eventType == 'create' || eventType == 'edit') && recSubsidiary == '1' && parentRec){// AU = 1, US = 3, CA = 4, NZ = 5,    	    		
    	    		var shipStatus = scriptContext.newRecord.getText({
        	    		fieldId: 'shipstatus'
        	    	});
//    	    		var createVT = true; // For debugging
    	    		if(shipStatus == 'Shipped'){
    	    			if(scriptContext.oldRecord){
     	    				var shipStatus_Old = scriptContext.oldRecord.getValue({
    	        	    		fieldId: 'shipstatus'
    	        	    	});
    	    				if(shipStatus_Old != 'Shipped'){
    	    					createVT = true;
    	    					log.debug('afterSubmit', 'eventType = ' + eventType);
    	    				}
    	    			}
    	    			else{
    	    				createVT = true;
    	    				log.debug('afterSubmit', 'eventType = ' + eventType);
    	    			}
    	    		}
    	    		if(createVT){
    	    			createVisitorTracker(scriptContext.newRecord, recSubsidiary, runtime.getCurrentUser());
    	    		}   	    		
    	    	}
    		}
    	}catch(ex){    		
    		var processMssg 	= 'processing Creating Visitor Tracker ';
    		var errorStr = (ex.id != null) ? ex.id + '\n' + ex.name + '\n' + ex.message + '\n'  : ex.toString();
    		log.error({
    		    title: 'afterSubmit', 
    		    details: 'Error encountered while ' + processMssg  + ' (' +  errorStr + ')'
    		});
    	}
    }
    
    function createVisitorTracker(createdfrom, subsidiary, user){
    	try{
    		var pickupType = 'Delivery';
    		var totalLineItem = createdfrom.getLineCount({
        		sublistId: 'item'
        	});
    		// Check pickup type
    		for(var i = 0; i<totalLineItem; i++){ // Caution: Line item index starts from 0, not 1 
    			var isPickup = createdfrom.getSublistValue({
        		    sublistId: 'item',
        		    fieldId: 'custcol_pick_up',
        		    line: i
        		});
    			if(isPickup){
    				pickupType = 'Pickup';
    				log.debug('createVisitorTracker', 'Pick-Up is checked in line item ' + (i+1) + ' in ' + createdfrom.type + ' ' + createdfrom.id);
     				break;			    					
    			}
    			else{
    				isPickup = createdfrom.getSublistValue({
            		    sublistId: 'item',
            		    fieldId: 'custcol_cash_n_carry',
            		    line: i
            		});
    				if(isPickup){
        				pickupType = 'Cashcarry';
        				log.debug('createVisitorTracker', 'Cash & Carry is checked in line item ' + (i+1) + ' in ' + createdfrom.type + ' ' + createdfrom.id);
        				break;        			
        			}
    			}
    		}    		
    		if(pickupType != 'Delivery'){
        		var custID = createdfrom.getValue({
    	    		fieldId: 'entity'
    	    	});
    			var visitorActivity = '3'; // 3 = Pick Up in Visitor Activity - AU/customlist_visitoractivity_au    			    			
    			if(pickupType == 'Cashcarry'){
    				visitorActivity = createdfrom.getValue({
        	    		fieldId: 'custbody_if_visitor_activity_au'
        	    	});
    			}  
    			log.debug('createVisitorTracker', 'pickupType = ' + pickupType);
    			log.debug('createVisitorTracker', 'visitorActivity = ' + visitorActivity);
    			var sellingLocation = search.lookupFields({
				    type: record.Type.EMPLOYEE, 
				    id: user.id,
				    columns: 'custentity_selling_location'
				}).custentity_selling_location[0];   			    			   			
    			var salesRep = user.id;
       			var recordObj = record.create({
    			    type: 'customrecord_visitor_tracker', 
    			});
       			recordObj.setValue({
                    fieldId: 'customform',
                    value: 243 // 243 = SFT-AU Visitor Tracker Form
                });
       			recordObj.setValue({
                    fieldId: 'custrecord_cust_name',
                    value: custID
                });
       			recordObj.setValue({
                    fieldId: 'custrecord_subs',
                    value: subsidiary
                });       		
        		if(sellingLocation){
    				recordObj.setValue({
                        fieldId: 'custrecord_selling_location',
                        value: sellingLocation.value
                    });
    			}
       			recordObj.setValue({
                    fieldId: 'custrecord_visitoractivity_au',
                    value: visitorActivity
                });
       			// Submit new Visitor Tracker record
       		    var recordId = recordObj.save({
       		       enableSourcing: true,  
       		       ignoreMandatoryFields: true
       		    });
       		    log.audit('createVisitorTracker', 'Visitor Tracker ' + recordId + ' is created from ' + createdfrom.type + ' ' + createdfrom.id)
    		}    		
    	}catch(ex){    		
    		var processMssg 	= 'processing Creating Visitor Tracker ';
    		var errorStr = (ex.id != null) ? ex.id + '\n' + ex.name + '\n' + ex.message + '\n'  : ex.toString();
    		log.error({
    		    title: 'createVisitorTracker', 
    		    details: 'Error encountered while ' + processMssg  + ' (' +  errorStr + ')'
    		});
    	}	
    }
    
    return {
        afterSubmit: afterSubmit
    };   
});