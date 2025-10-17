/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     13-12-18	Eric.Choe		Created following function for email validation using "neverbounce" API
 * 											- function fieldChanged(scriptContext)
 * 											- function saveRecord(scriptContext)
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/url', 'N/https', 'N/log'],
/**
 * @param {record} record
 * @param {url} url
 */
function(record, url, https, log) {
    
    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
	
	/***	
 	Notes: Not using "validateField" to allow user to bypass email validation manually
	in case of any issue with neverbounce API (i.e. Network issue, not enough credit, etc) 
	***/
	
    function fieldChanged(scriptContext) {
    	var recSubsidiary = scriptContext.currentRecord.getValue({
    		fieldId: 'subsidiary'
    	});
    	var changedField = scriptContext.fieldId;
    	
    	if(recSubsidiary == '5' && changedField == 'email'){// AU = 1, US = 3, CA = 4, NZ = 5,
    		var recEmail = scriptContext.currentRecord.getValue({
        		fieldId: 'email'
        	});
    		var disableNB = scriptContext.currentRecord.getValue({
        		fieldId: 'custpage_disable_nb'
        	});
    		recEmail = recEmail.replace(/ /g,''); // Remove white space in email
    		if(recEmail&&!disableNB){ // "Email" is not empty and "Disable Email Validation" is not checked
    			// Loading NeverBounce Suitelet using dynamic method
        		var reqURL = url.resolveScript({
        		    scriptId: 'customscript_gs2_sl_neverbounce',
        		    deploymentId: 'customdeploy_gs2_sl_neverbounce',
        		    returnExternalUrl: true
        		});       		
        		reqURL += '&req_subsidiary=' + recSubsidiary + '&req_email=' + recEmail; // Passing parameters into URL
        		// https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=1058&deploy=1&compid=693183_SB1&h=44b06293910200c39b4f&req_subsidiary=5&req_email=eric@springfree.co.nz
	    		var clientResponse 	= https.request({
	    		    method: https.Method.GET,
	    		    url: reqURL
	    		});	    		
	    		var responseCode 	= clientResponse.code; //Get response code
//	    		var responseCode 	= '400'; // For testing
	    		
	    		if(responseCode == '200'){
	    			var responseBody 	= clientResponse.body; //Get response body
	    			if(responseBody == 'Success'){
	            		scriptContext.currentRecord.setValue({
	            		    fieldId: 'custpage_invalid_email',
	            		    value: false,
	            		});	  
	    			}
	    			else if(responseBody == 'Invalid Email'){
	    				alert('Invalid email address, please enter correct email address');
	            		scriptContext.currentRecord.setValue({
	            		    fieldId: 'custpage_invalid_email',
	            		    value: true,
	            		});	    				
	    			}
	    			else if(responseBody == 'Internal Error'){
	    				alert('Internal error, please contact your NetSuite Administrator and disable email validation if you want to proceed.');
	            		scriptContext.currentRecord.setValue({
	            		    fieldId: 'custpage_invalid_email',
	            		    value: true,
	            		});
	    			}
	    		}
	    		else{
	    			alert('Network error - NS, please try again later or disable email validation if you want to proceed now.');
	        		scriptContext.currentRecord.setValue({
	        		    fieldId: 'custpage_invalid_email',
	        		    value: true,
	        		});
    	    		log.error({
    	    		    title: 'Network Error - NS', 
    	    		    details: 'responseCode = ' + responseCode
    	    		});
	    		}  			
    		}
    		else if(!recEmail){ // Email is empty
        		scriptContext.currentRecord.setValue({
        		    fieldId: 'custpage_invalid_email',
        		    value: false,
        		});
    		}
    	}
    }

    
    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	var recSubsidiary = scriptContext.currentRecord.getValue({
    		fieldId: 'subsidiary'
    	});
    	
    	if(recSubsidiary == '5'){// AU = 1, US = 3, CA = 4, NZ = 5,
    		var disableNB = scriptContext.currentRecord.getValue({
        		fieldId: 'custpage_disable_nb'
        	});
    		var invalidEmail = scriptContext.currentRecord.getValue({
        		fieldId: 'custpage_invalid_email'
        	});
    		if(!disableNB && invalidEmail){
    			alert('Invalid email address, please enter correct email address');
    			return false;
    		}
    		else{
    			return true;
    		} 			
    	}
    	else{
    		return true;
    	}  	
    }

    return {
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
   
});