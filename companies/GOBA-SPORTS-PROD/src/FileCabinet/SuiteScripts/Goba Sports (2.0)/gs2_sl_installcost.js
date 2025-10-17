/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     15-06-20	Eric.Choe		Created following function to get the install cost searched by install group and item
 * 											- function onRequest(context) 
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
    			var installCost	= 'Not Found';
    			var installGroup	= context.request.parameters.installgroup;   			
    			// Searching for matching install cost using install group    			   				
    			if(installGroup){   				
    				var installCost = search.lookupFields({
					    type: 'customrecord_install_group',
					    id: installGroup,
					    columns: 'custrecord_ig_cost'
					}).custrecord_ig_cost;
//    				log.debug('installCost',installCost);		 				   				 							  				
    			}
    			context.response.write(installCost); // Return matching freight cost
    		}
    	}catch(ex){
    		var processMssg 	= 'processing Install Cost ';
    		log.error({
    		    title: 'Suitelet Script - Install Cost', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});  	    		
    	}  
    }
    return {
        onRequest: onRequest
    };    
});