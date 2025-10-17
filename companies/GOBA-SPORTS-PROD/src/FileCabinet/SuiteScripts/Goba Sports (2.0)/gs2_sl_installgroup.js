/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     28-05-19	Eric.Choe		Created following function to get the install group searched by post code
 * 											- function onRequest(context)
 * 
 * 1.10		21-10-19	Eric.Choe		Updated function onRequest(context) to return 'Not Found' if there is no matching record
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/url', 'N/log', './lib/utils'],
/**
 * @param {search} search
 * @param {url} url
 * @param {log} log
 */
function(search, url, log, utils) {
   
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
    			var installGroup = 'Not Found';
    			var postCode	= context.request.parameters.postcode;
    			// Searching for matching install group using post code    			   				
    			if(postCode){
    				var mySearch = search.create({
    					type: 'customrecord_install_post_code',
    					filters: [{
    						name: 'isinactive',
    						operator: 'is',
    						values: false
    					}, /*{
    						name: 'custrecord_ipc_install_grp',
    			            operator: 'noneof',
    			            values: '@NONE@'
    					},*/ {
    						name: 'custrecord_ipc_post_code',
    			            operator: 'is',
    			            values: postCode
    					}],
    					columns: ['custrecord_ipc_install_grp']			
    				});	   				
    				// Run search to find first matching record
    				mySearch.run().each(function(result){
    					log.debug('result', result);
    					if(result.id){
    						installGroup = result.getValue({name: 'custrecord_ipc_install_grp'});
    						return false; //  returns a boolean which can be used to stop the iteration with a value of false, or continue the iteration with a value of true.
    					}
    				});			 				   				 							  				
    			}
//    			if(installGroup){
//    				context.response.write(installGroup); // Return matching install group  
//    			}    
    			context.response.write(installGroup); // Return matching install group 
    		}
    	}catch(ex){
    		var processMssg 	= 'processing Install Group ';
    		log.error({
    		    title: 'Suitelet Script - Install Group', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});  	    		
    	}  
    }
    return {
        onRequest: onRequest
    };    
});