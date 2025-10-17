/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     04-03-20	Eric.Choe		Created following function to get the installer searched by post code
 * 											- function onRequest(context)
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/url', './lib/utils'],
/**
 * @param {search} search
 * @param {url} url
 * @param {utils} utils
 */
function(search, url, utils) {
   
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
    			var insTaller = "Not Found";
    			var postCode	= context.request.parameters.postcode;
    			// Searching for matching installer using post code    			   				
    			if(postCode){
    				var mySearch = search.create({
    					type: 'customrecord_install_post_code',
    					filters: [{
    						name: 'isinactive',
    						operator: 'is',
    						values: false
    					},  {
    						name: 'custrecord_ipc_post_code',
    			            operator: 'is',
    			            values: postCode
    					}],
    					columns: ['custrecord_ipc_installer']			
    				});	   				
    				// Run search to find first matching record
    				mySearch.run().each(function(result){
    					log.debug('result', result);
    					if(result.id){
    						insTaller = result.getValue({name: 'custrecord_ipc_installer'});
    						if(insTaller){
    							return false; //  returns a boolean which can be used to stop the iteration with a value of false, or continue the iteration with a value of true.
    						}
    						else{
    							insTaller = "Not Found";
    						}
    					}
    				});			 				   				 							  				
    			}   
    			context.response.write(insTaller); // Return matching install group 
    		}
    	}catch(ex){
    		var processMssg 	= 'processing Installer ';
    		log.error({
    		    title: 'Suitelet Script - Installer', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});  	    		
    	}  
    }
    return {
        onRequest: onRequest
    };    
});