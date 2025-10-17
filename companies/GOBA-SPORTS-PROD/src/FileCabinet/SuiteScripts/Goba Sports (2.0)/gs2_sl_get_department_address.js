/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     23-08-19	Eric.Choe		Created following function to get the distance between given addresses and department 
 * 											- function onRequest(context)
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', './lib/utils'],
/**
 * @param {search} search
 * @param {utils} utils
 * 
 */
function(search, utils) {
   
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
    			var recID		= context.request.parameters.id;
    			if(recID){
    				// Search Address in Department recrod
    				var deptAdd = search.lookupFields({
					    type: 'department',
					    id: recID,
					    columns: ['custrecord_dept_address','custrecord_dept_city','custrecord_dept_state_province','custrecord_dept_zip_postal']
					});
    				log.debug('Suitelet Script - Get Department Address', 'deptAdd = ' + JSON.stringify(deptAdd));
    				var responseMessage = '';   				
    				if(deptAdd.custrecord_dept_address){
    					responseMessage += deptAdd.custrecord_dept_address + ',';
    				}
    				if(deptAdd.custrecord_dept_city){
    					responseMessage += deptAdd.custrecord_dept_city + ',';
    				}
    				if(deptAdd.custrecord_dept_state_province[0]){
    					responseMessage += deptAdd.custrecord_dept_state_province[0].text + ',';
    				}
    				if(deptAdd.custrecord_dept_zip_postal){
    					responseMessage += deptAdd.custrecord_dept_zip_postal;
    				}
    				log.debug('Suitelet Script - Get Department Address', 'responseMessage = ' + responseMessage);   		
    			}   			
    			if(responseMessage){
    				context.response.write(responseMessage); // Return found address
    			}	    			 					
    		}
    	}catch(ex){
    		var processMssg 	= 'processing Department Address ';
    		log.error({
    		    title: 'Suitelet Script - Get Department Address', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});  	    		
    	}  
    }
	
    return {
        onRequest: onRequest
    };    
    
});