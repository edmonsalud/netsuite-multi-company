/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     23-08-19	Eric.Choe		Created following function to get the distance between 2 addresses
 * 											- function onRequest(context)
 * 
 * 1.01		25-09-19	Eric.Choe		Added error handling code to return proper error message in case of SSS_CONNECTION_TIME_OUT on Google API
 *
 * 1.02		20-02-20	Eric.Choe		Removed "NOT_FOUND" status from error log
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/url', './lib/utils'],
/**
 * @param {https} https
 * @param {url} url
 * @param {utils} utils
 */
function(https, url, utils) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
	function onRequest(context) {
		var responseMessage = [{
			"text" : 'Invalid', // Default message to avoid error with context.response.write() call
		    "value" : -1000	
		}]; 
    	try{
    		if (context.request.method === 'GET'){
    			var apiOrigin		= context.request.parameters.from;
	    		var apiDestination	= context.request.parameters.to;
	    		var recSubsidiary	= context.request.parameters.subsidiary;	    		          
	    		if(apiOrigin && apiDestination){
	    			var apiURL	= 'https://maps.googleapis.com/maps/api/distancematrix/json?' // JSON format Google API url
	    			var apiKey	= 'AIzaSyBqj8P0DrZwihZhe3iYeDeUUHZUTOYrAcA' // check with Ning
	    	    	if(recSubsidiary == '3'){ // AU = 1, US = 3, CA = 4, NZ = 5
	    	    		var reqURL	= apiURL + '&origins=' + apiOrigin 
	    	    							 + '&destinations=' + apiDestination
	    	    							 + '&units=imperial' // To return distances in miles and feet
	    	    							 + '&key=' + apiKey;
	    	    	}
	    	    	else{
	    	    		var reqURL	= apiURL + '&origins=' + apiOrigin 
	    	    							 + '&destinations=' + apiDestination
	    	    							 + '&key=' + apiKey;
	    	    	}	    			
	    			// Send webhook API request to Google server
		    		var clientResponse 	= https.request({
		    		    method: https.Method.GET,
		    		    url: reqURL
		    		});	
		    		log.debug('clientResponse', clientResponse);
		    		if(clientResponse){
		    			var responseCode 	= clientResponse.code; 	    				    				    				    				    		  		
			    		if(responseCode == '200'){
			    			// Parse response body string as a JSON object
				    		var responseBody 	= JSON.parse(clientResponse.body);
				    		var responseStatus	= responseBody.status;
			    			if(responseStatus == 'OK'){
			    				var apiStatus		= responseBody.rows[0].elements[0].status;
			    				if(apiStatus == 'OK'){
			    					responseMessage[0].text		= responseBody.rows[0].elements[0].distance.text + ', ' + responseBody.rows[0].elements[0].duration.text;
			    					responseMessage[0].value	= responseBody.rows[0].elements[0].distance.value;
			    					log.debug('Google Distance Matrix API - Result', responseMessage);
			    				}
			    				else{		    					
			    					responseMessage[0].text	 = 'Invalid Address, please check shipping address and try again.';
			    					if(apiStatus != 'NOT_FOUND'){ // Removed "NOT_FOUND" status from error log
			    						log.error('Google Distance Matrix API - Error', 'apiStatus' + ' = ' + apiStatus);
			    					}			    				
			    				}
			    			}
			    			else{
			    				responseMessage[0].text = 'Invalid Request - Google, please try again later or contact your NetSuite Administrator.';
			    				log.error('Google Distance Matrix API - Error', 'responseStatus' + ' = ' + responseStatus);
			    			}
			    		}
			    		else{	    	    		
			    			responseMessage[0].text = 'Network Error - Google, please try again later or contact your NetSuite Administrator.';
		    	    		log.error('Google Distance Matrix API - Error', responseCode + ' = ' + clientResponse);
			    		}
		    		}
		    		else{
		    			responseMessage[0].text = 'Network Error - Google, please try again later or contact your NetSuite Administrator.';
	    	    		log.error('Google Distance Matrix API - Error', responseCode + ' = ' + clientResponse);
		    		}		    		
	    		}	    		
	    		context.response.write(JSON.stringify(responseMessage)); // Return corresponding message back   					
    		}
    	}catch(ex){
    		var processMssg 	= 'processing Google Distance Matrix API ';
    		log.error({
    		    title: 'Suitelet Script - Google Distance API', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
			responseMessage[0].text = 'SL Script Error - Google or NetSuite, please try again later or contact your NetSuite Administrator.';
			context.response.write(JSON.stringify(responseMessage)); // Return corresponding message back   					
    	}  
    }
	
    return {
        onRequest: onRequest
    };    
});