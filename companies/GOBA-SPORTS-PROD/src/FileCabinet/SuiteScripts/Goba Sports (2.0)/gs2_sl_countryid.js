/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     29-01-19	Eric.Choe		Created following function to get internal id of requested country by searching country code
 * 											- function onRequest(context)
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/url', 'N/log'],
/**
 * @param {search} search
 * @param {url} url
 * @param {log} log
 */
function(search, url, log) {
   
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
			/* Manual testing example
			EXTERNAL_URL&req_countrycode=NZ
			*/
    		var processMssg 	= 'processing internal id of country';
    		if (context.request.method === 'GET'){
    			var country_ID 		= 'No Matching Record';
    			var country_Code	= context.request.parameters.req_countrycode;
    			// Searching for internal ID of the requested country code    			   				
    			if(country_Code){
    				var mySearch = search.create({
    	                type: 'customrecord_country_list',
    	                columns: ['custrecord_cl_name'],
    	                filters: [{
    	                    name: 'custrecord_cl_code',
    	                    operator: 'is',
    	                    values: country_Code
    	                }]
    	            });
    				// Run search to find first matching record
    				var mySearchResult = mySearch.run().getRange({
    					start: 0,
    					end: 1
    				})[0];
    				// get the internal id of matching country record
    				if(mySearchResult){
    					country_ID = mySearchResult.getValue(mySearch.columns[0]);   
    				}   							  				
    			}
    			context.response.write(country_ID); // Return internal id   		
    		}
    	}catch(ex){
    		var errorStr = (ex.id != null) ? ex.id + '\n' + ex.message + '\n'  : ex.toString();
    		log.error({
    		    title: 'Suitelet - onRequest', 
    		    details: 'Error encountered while ' + processMssg  + ' (' +  errorStr + ')'
    		});
//    		context.response.write('Network Error'); // Return error message	   	    		
    	}  
    }
    return {
        onRequest: onRequest
    };    
});