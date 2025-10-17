/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     15-06-20	Eric.Choe		Created following function to get the freight cost searched by freight zone and item
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
    			var zoneFreightCost	= 'Not Found';
    			var freightZone		= context.request.parameters.freightzone;
    			var searchItem 		= context.request.parameters.item;
    			// Searching for matching install group using post code    			   				
    			if(freightZone && searchItem){
    				var mySearch = search.create({
    					type: 'customrecord_zone_freight_cost',
    					filters: [{
    						name: 'isinactive',
    						operator: 'is',
    						values: false
    					}, {
    						name: 'custrecord_zfc_zone',
    			            operator: 'is',
    			            values: freightZone
    					}, {
    						name: 'custrecord_zfc_item',
    			            operator: 'is',
    			            values: searchItem
    					}],
    					columns: ['custrecord_zfc_cost']			
    				});	   				
    				// Run search to find first matching record
    				mySearch.run().each(function(result){
    					log.debug('result', result);
    					if(result.id){
    						zoneFreightCost = result.getValue({name: 'custrecord_zfc_cost'});   					
    						return false; //  returns a boolean which can be used to stop the iteration with a value of false, or continue the iteration with a value of true.
    					}
    				});			 				   				 							  				
    			}
    			context.response.write(zoneFreightCost); // Return matching freight cost
    		}
    	}catch(ex){
    		var processMssg 	= 'processing Zone Freight Cost ';
    		log.error({
    		    title: 'Suitelet Script - Zone Freight Cost', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});  	    		
    	}  
    }
    return {
        onRequest: onRequest
    };    
});