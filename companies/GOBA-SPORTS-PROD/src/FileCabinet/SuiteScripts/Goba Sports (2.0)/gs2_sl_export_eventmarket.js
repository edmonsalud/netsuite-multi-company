/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     04-10-19	Eric.Choe		Created following function to export marekt drop-down list in event form per market/subsidiary
 * 											- function onRequest(context)
 * 1.10		22-11-19	Eric.Choe		Updated "function onRequest(context)"
 * 											- Added header, "Access-Control-Allow-Origin = *", to bypass CORS issue
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
    		var reqType = context.request.method;
    		if (reqType /*=== 'GET' || context.request.method === 'POST'*/){
    			log.debug('context', reqType + ' : ' + JSON.stringify(context));
    			var recSubsidiary = context.request.parameters.countrycode;
    			if(recSubsidiary){
    				var outputData = [];
        			var arrayIndex = 0;
					switch(recSubsidiary){ //AU = 1, US = 3, CA = 4, NZ = 5
						case 'AU':
							recSubsidiary = '1'; 
							break;								
						case 'US':
							recSubsidiary = '3'; 
							break;						
						case 'CA':
							recSubsidiary = '4'; 
							break;						
						case 'NZ':
							recSubsidiary = '5'; 
							break;
						default :
							recSubsidiary = '0'; 
					};
					if(recSubsidiary == '0'){
						context.response.write('Invalid country code, it must be 2-letters in upper case (i.e. CA for Canada).');
					}
					else{
						var mySearch = search.create({
	    					type: 'customrecord_event_market_list',
	    					columns: ['internalid','name'],
	    					filters: [{
	    						name: 'isinactive',
	    						operator: 'is',
	    						values: false
	    					}, {
	    						name: 'custrecord_em_subsidiary',
	    			            operator: 'is',
	    			            values: recSubsidiary
	    					}]     	                
	    				});	   				
	    				// Run search to find first matching record
	    				mySearch.run().each(function(result){
	    					var internalID = result.getValue({name: 'internalid'});					
	    					if(internalID){ // To filter out deleted records of incremental index for internal id, i.e. 10~100
	    						outputData[arrayIndex] = {								
	    								"INTERNAL ID"	: internalID,
	    								"NAME"			: result.getValue({name: 'name'})
	    						}
	    						arrayIndex++;
	    					}
	    					return true; //  returns a boolean which can be used to stop the iteration with a value of false, or continue the iteration with a value of true.
	    				});
	    				log.debug('outputData', outputData);	    				
	    				context.response.setHeader({
	    				    name: 'Access-Control-Allow-Origin',
	    				    value: '*',
	    				});
	    				log.debug('Response Headers', JSON.stringify(context.response.headers));	    				
	        			context.response.write(JSON.stringify(outputData)); // Return matching event market  	
					}       				
    			}
    			else {
    				context.response.write('Please pass parameter value for country code (i.e. 2-letters in upper case).');
    			} 			
    		}
    	}catch(ex){
    		var processMssg 	= 'processing Event Market List';
    		log.error({
    		    title: 'Suitelet Script - Event Market List', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});  	    		
    	}  
    }
    return {
        onRequest: onRequest
    };    
});