/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     12-03-19	Eric.Choe		Created following functions to trigger scheduled script to replicate Parent/Hold order with custom prices
 * 											- function onAction(scriptContext)
 * 											
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType workflowactionscript
 */
define(['N/record', 'N/email', 'N/runtime'],
/**
 * @param {record} record
 * @param {email} email
 * @param {runtime} runtime
 */
function(record, email, runtime) {  
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @Since 2016.1
     */
    function onAction(scriptContext) {
    	try{               						
    		var currUser = runtime.getCurrentUser();
        	var userName = currUser.name;
        	var userEmail = currUser.email;       	
    		log.debug({
    		    title: 'DEBUG', 
    		    details: 'userName = ' + userName  + ', userEmail = ' +  userEmail
    		});   		
    		log.debug({
    		    title: 'DEBUG', 
    		    details: 'scriptContext.newRecord.type = ' + scriptContext.newRecord.type  + ', scriptContext.newRecord.id = ' +  scriptContext.newRecord.id
    		});   		
    		if(scriptContext.newRecord.type == 'salesorder'){
    			// Update Sales Order to trigger scheduled script
    			record.submitFields({
        		    type: record.Type.SALES_ORDER,
        		    id: scriptContext.newRecord.id,
        		    values: {
        		        'custbody_assignedto' : currUser.id, 
        		        'custbody_order_status': '4' // 4 = Create Split Order
        		    },
        		    options: {
        		        enableSourcing: false,
        		        ignoreMandatoryFields : true
        		    }
        		});
        		// Send email to user who requested Split Order            	       	        		
        		email.send({
                    author: -5, // Update default one in Production, Goba Sports, donotreply@gobasports.com
                    recipients: userEmail,
                    subject: 'Split Order request submitted!',
                    body: 'Hi ' + userName + '\n\n' 
                    	+ 'Your Split Order request has been submitted. \n\n' 
                    	+ 'Please do not reply to this email but contact your NetSuite Administrator if you have any questions.\n\n'
                    	+ 'NetSuite ERP team \n Goba Sports'
                });
           	 	log.audit({
           	 		title: 'AUDIT', 
           	 		details: 'Split Order is requested by ' + userName + ' from Parent/Hold order ' + scriptContext.newRecord.id
           	 	});
    		}    		           
    	}catch(ex){
    		var processMssg 	= 'processing Split Order with Line Items';
    		var errorStr = (ex.id != null) ? ex.id + '\n' + ex.message + '\n'  : ex.toString();
    		log.error({
    		    title: 'Workflow Action Script - onAction', 
    		    details: 'Error encountered while ' + processMssg  + ' (' +  errorStr + ')'
    		});
    	}   			
    }

    return {
        onAction : onAction
    };
    
});