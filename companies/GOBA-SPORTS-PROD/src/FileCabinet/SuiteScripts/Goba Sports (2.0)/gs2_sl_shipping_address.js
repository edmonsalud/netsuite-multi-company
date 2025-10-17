/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     07-06-19	Eric.Choe		Created following function to get the city field value from given address internal id
 * 											- function onRequest(context)
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', './lib/utils'],
/**
 * @param {search} search
 * @param {search} record
 * @param {utils} utils
 */
function(search, record, utils) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	try{
    		if (context.request.method === 'GET'){
    			var customerID		= context.request.parameters.customer;
    			log.debug('onRequest : GET', 'customerID = ' + customerID);
    			// Searching for shipping address in the matching customer record    			   				
    			if(customerID){
    				var customerRec = record.load({
        			    type: record.Type.CUSTOMER, 
        			    id: customerID,
        			    isDynamic: false,
        			});   				
    				var totalAddress = customerRec.getLineCount({
    				    sublistId: 'addressbook'
    				});   				
    				for(var i=0; i<totalAddress; i++){
    					var isDefaultShipping = customerRec.getSublistValue({
    		                sublistId: 'addressbook',
    		                fieldId: 'defaultshipping',
    		                line: i
    		            });
    					if(isDefaultShipping){
    			            // Retrieve the subrecord associated with that same line. Note: getSublistValue => not working   				          
    			            var addRec = customerRec.getSublistSubrecord({
    			                sublistId: 'addressbook',
    			                fieldId: 'addressbookaddress',
    			                line: i
    			            });
    			            log.debug('onRequest : GET', 'addRec = ' + JSON.stringify(addRec));   						    						
    		    			var shipAddress = {
    		    					city	: addRec.getValue({fieldId: 'city'}),
    		    					state	: addRec.getValue({fieldId: 'state'}),
    		    					zip		: addRec.getValue({fieldId: 'zip'}),
    		    					country	: addRec.getValue({fieldId: 'country'})
    		    			}    		    			   		    			   		    			
    						break;
    					}
    				}    				
    			}    			
    			if(shipAddress){
    				log.debug('onRequest : GET', 'shipAddress = ' + JSON.stringify(shipAddress));
    				context.response.write(JSON.stringify(shipAddress)); // Return ship city 
    			}
    			else{
    				log.debug('onRequest : GET', 'There is no default shipping address in customer record ' + customerID);
    				context.response.write('NULL'); // Return null 
    			}			
    		}
    	}catch(ex){
    		var processMssg = 'processing Shipping Address ';
    		log.error({
    		    title: 'onRequest : GET', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});  	    		
    	}  
    }
    return {
        onRequest: onRequest
    };    
});