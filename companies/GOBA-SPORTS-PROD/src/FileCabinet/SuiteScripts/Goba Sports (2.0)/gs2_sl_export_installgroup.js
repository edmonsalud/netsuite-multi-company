/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     18-07-19	Eric.Choe		Created following function to export all installation group records 
 * 											- function onRequest(context)
 * 
 * 1.01     04-10-19	Eric.Choe		Removed unnecessary modules
 * 
 * 1.10		22-11-19	Eric.Choe		Updated "function onRequest(context)"
 * 											- Added header, "Access-Control-Allow-Origin = *", to bypass CORS issue
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
    			var outputData = [];
    			var arrayIndex = 0;	
    			var mySearch = search.create({
					type: 'customrecord_install_group',
					columns: ['internalid','isinactive','name','custrecord_ig_country','custrecord_ig_currency','custrecord_ig_cost']			
				});	   				
				// Run search to find first matching record
				mySearch.run().each(function(result){
//					log.debug('result', result);
					var internalID = result.getValue({name: 'internalid'});					
					if(internalID){ // To filter out deleted records of incremental index for internal id, i.e. 10~100
						outputData[arrayIndex] = {								
								"INTERNAL ID"	: internalID,
								"INACTIVE"		: result.getValue({name: 'isinactive'}),
								"NAME"			: result.getValue({name: 'name'}),
								"COUNTRY"		: result.getText({name: 'custrecord_ig_country'}),
								"CURRENCY"		: result.getText({name: 'custrecord_ig_currency'}),
								"COST"			: result.getValue({name: 'custrecord_ig_cost'})	
						}
						arrayIndex++;
					}
					return true; //  returns a boolean which can be used to stop the iteration with a value of false, or continue the iteration with a value of true.
				});
				context.response.setHeader({
				    name: 'Access-Control-Allow-Origin',
				    value: '*',
				});
				log.debug('outputData', outputData);
    			context.response.write(JSON.stringify(outputData)); // Return matching install group  		
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