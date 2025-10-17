/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     13-12-18	Eric.Choe		Created following function for email validation using "neverbounce" API
 * 											- function onRequest(context)
 * 
 * 1.01		02-04-20	Eric.Choe		Rolled back to NA API credential due to expiration of free credit with NeverBounce
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/url', 'N/log'],
/**
 * @param {https} https
 * @param {url} url
 */
function(https, url, log) {
   
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
    		var processMssg 	= 'Submitting NeverBounce API Request';
    		
    		if (context.request.method === 'GET'){    			
    			var reqEmail		= context.request.parameters.req_email;
	    		var reqSubsidiary	= context.request.parameters.req_subsidiary;
	    		var reqURL;
	    		var responseMessage = 'Success';
	    		
	    		if(reqSubsidiary == '5'){// AU = 1, US = 3, CA = 4, NZ = 5,
//	    			reqURL = 'https://api.neverbounce.com/v4/single/check?key=webhook_c45b7b137fa11160d63a9779ea0c4c5d&email=' + reqEmail; // NZ
	    			reqURL = 'https://api.neverbounce.com/v4/single/check?key=webhook_1f80084d34520239b2a4c1094b90cbca&email=' + reqEmail; // NA from Isiash
	    		}
	    		
	    		// Send webhook API request to neverbounce server
	    		var clientResponse 	= https.request({
	    		    method: https.Method.GET,
	    		    url: reqURL
	    		});
	    		
	    		var responseCode 	= clientResponse.code; 	    		
	    		// Parse response body string as a JSON object
	    		var responseBody 	= JSON.parse(clientResponse.body); 
	    		var responseStatus	= responseBody.status;
	    		var responseResult	= responseBody.result;
	    			    			    		
	    		if(responseCode == '200'){
	    			if(responseStatus == 'success'){
	    				if(responseResult != 'valid' && responseResult != 'catchall'){
	    	    			responseMessage = 'Invalid Email';
	        	    		log.debug({
	        	    		    title: responseMessage, 
	        	    		    details: responseResult + ' : ' + reqEmail
	        	    		});
	    				}
	    			}
	    			else{
    	    			responseMessage = 'Internal  Error';
        	    		log.error({
        	    		    title: responseMessage, 
        	    		    details: reqEmail + ' : ' + responseStatus + ' : ' + clientResponse.body
        	    		});
	    			}
	    		}
	    		else{
	    			responseMessage = 'Network Error - NB';
    	    		log.error({
    	    		    title: responseMessage, 
    	    		    details: 'responseCode = ' + responseCode
    	    		});
	    		}
	    		
	    		context.response.write(responseMessage); // Return corresponding message back

    		}
    	}catch(ex){
    		var errorStr = (ex.id != null) ? ex.id + '\n' + ex.message + '\n'  : ex.toString();
    		log.error({
    		    title: 'Suitelet - onRequest', 
    		    details: 'Error encountered while ' + processMssg  + ' (' +  errorStr + ')'
    		});
    		context.response.write('Network Error'); // Return corresponding message	   	    		
    	}  		  	  		  		    		
    }
    return {
        onRequest: onRequest
    };  
});