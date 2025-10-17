/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     23-08-19	Eric.Choe		Created following function to get the distance between department and shipping address
 * 											- function pageInit()
 * 											- function fieldChanged()
 * 											- function getDepartmentAddress()
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/url', 'N/search'],
/**
 * @param {https} https
 * @param {url} url
 * @param {url} search
 */
function(https, url, search) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
    	var recSubsidiary = scriptContext.currentRecord.getValue({
    		fieldId: 'subsidiary'
    	});    	
    	if(scriptContext.mode == 'create' && (recSubsidiary == '3'||recSubsidiary == '4')){// AU = 1, US = 3, CA = 4, NZ = 5
    		var recForm = scriptContext.currentRecord.getValue({
        		fieldId: 'customform'
        	});
    		if(recForm == '152'){ // 152 = SFT Sales Order (Direct Sales) NA
    			var shipAdd	= scriptContext.currentRecord.getValue({fieldId: 'shipaddress'});
    			log.debug('Client - pageInit', 'shipAdd = ' + shipAdd);
    			if(shipAdd){     				
    				// Get Department Address
    				var fromAdd = getDepartmentAddress(scriptContext.currentRecord.getValue({fieldId: 'department'}));   				
    				if(fromAdd){
    					// Get Shipping Address without Addressee
    					log.debug('Client - pageInit', 'shipaddresslist = ' + scriptContext.currentRecord.getValue({fieldId: 'shipaddresslist'}));
    					var shipTo = scriptContext.currentRecord.getSubrecord({fieldId: 'shippingaddress'});   					
    					var toAdd = shipTo.getValue({fieldId: 'addr1'}) // getText is not supported
								    + ',' + shipTo.getValue({fieldId: 'city'})
								    + ',' +  shipTo.getValue({fieldId: 'state'})
								    + ',' +  shipTo.getValue({fieldId: 'zip'})
								    + ',' +  shipTo.getValue({fieldId: 'country'});    					
						var reqURL = url.resolveScript({
							scriptId: 'customscript_gs2_sl_google_distance_api',
							deploymentId: 'customdeploy_gs2_sl_google_distance_api',
							returnExternalUrl: true
						});
        				reqURL += '&from=' + fromAdd + '&to=' + toAdd + '&subsidiary=' + recSubsidiary; // Passing parameters into URL        			
    					// Calculate distance using Google Distance Matrix API
    					var clientResponse 	= https.request({
							method: https.Method.GET,
							url: reqURL
						});
						var responseCode 	= clientResponse.code; //Get response code
						var responseText	= 'Network Issue - NetSuite, please try again later or contact your NetSuite Administrator.';
						var responseValue	= '';
						if(responseCode == '200'){							
							var responseBody	= JSON.parse(clientResponse.body); //Get response body
							responseText		= responseBody[0].text;
							responseValue		= responseBody[0].value;
							log.debug('Client - pageInit', 'responseBody = ' + JSON.stringify(responseBody));
						}
						else{
							log.error('Client - pageInit', responseCode + ' : ' + clientResponse);
						}
						scriptContext.currentRecord.setValue({
							fieldId: 'custbody_travel_distance_time',
							value: responseText,
						});
						if(recSubsidiary == '3'){ // AU = 1, US = 3, CA = 4, NZ = 5
							scriptContext.currentRecord.setValue({
								fieldId: 'custbody_travel_distance',
								value: Math.round(parseInt(responseValue)/1.609/10)/100 // Convert meters into miles
							});
						}
						else{
							scriptContext.currentRecord.setValue({
								fieldId: 'custbody_travel_distance',
								value: Math.round(parseInt(responseValue)/10)/100 // Convert meters into km
							});
						}																	
    				}
    				else{
    					scriptContext.currentRecord.setValue({
    						fieldId: 'custbody_travel_distance_time',
    						value: 'Invalid Department Address',
    					});
    					scriptContext.currentRecord.setValue({
    						fieldId: 'custbody_travel_distance',
    						value: -1
    					});
        			}	
    			}
    			else{
					scriptContext.currentRecord.setValue({
						fieldId: 'custbody_travel_distance_time',
						value: 'Invalid Shipping Address',
					});
					scriptContext.currentRecord.setValue({
						fieldId: 'custbody_travel_distance',
						value: -1
					});
    			} 
    		}
    	}
    }
   
    function getDepartmentAddress(rec_id) {
    	// Get Department Address using Suitelet to bypass permission validation on Department record
    	var reqURL = url.resolveScript({
			scriptId: 'customscript_gs2_sl_get_department_add',
			deploymentId: 'customdeploy_gs2_sl_get_department_add',
			returnExternalUrl: true
		});
		reqURL += '&id=' + rec_id; // Passing parameters into URL	
		var clientResponse 	= https.request({
			method: https.Method.GET,
			url: reqURL
		});
		var responseCode 	= clientResponse.code; //Get response code
		if(responseCode == '200'){							
			log.debug('Client - getDepartmentAddress', 'clientResponse.body = ' + clientResponse.body);
			return clientResponse.body
		}
		else{
			log.error('Client - getDepartmentAddress', responseCode + ' : ' + clientResponse);
			return null
		}
    }
       
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
    function fieldChanged(scriptContext) {
    	var recSubsidiary = scriptContext.currentRecord.getValue({
    		fieldId: 'subsidiary'
    	}); 	
    	if(recSubsidiary == '3' || recSubsidiary == '4'){// AU = 1, US = 3, CA = 4, NZ = 5
    		var recForm = scriptContext.currentRecord.getValue({
        		fieldId: 'customform'
        	});
    		if(recForm == '152' || recForm == '167'){ // 152 = "SFT Sales Order (Direct Sales) NA", 167 = "*SFT Sales Order (Web Store) NA"
    			var changedField = scriptContext.fieldId;
        		if(changedField == 'department' || changedField == 'shipaddresslist' || changedField == 'shipaddress'){
        			var shipAdd	= scriptContext.currentRecord.getValue({fieldId: 'shipaddress'});
        			log.debug('Client - fieldChanged', 'shipAdd = ' + shipAdd);
        			if(shipAdd){     				
        				// Get Department Address
        				var fromAdd = getDepartmentAddress(scriptContext.currentRecord.getValue({fieldId: 'department'}));   				
        				if(fromAdd){
        					// Get Shipping Address without Addressee
        					log.debug('Client - fieldChanged', 'shipaddresslist = ' + scriptContext.currentRecord.getValue({fieldId: 'shipaddresslist'}));
        					var shipTo = scriptContext.currentRecord.getSubrecord({fieldId: 'shippingaddress'});   					
        					var toAdd = shipTo.getValue({fieldId: 'addr1'}) // getText is not supported
    								    + ',' + shipTo.getValue({fieldId: 'city'})
    								    + ',' +  shipTo.getValue({fieldId: 'state'})
    								    + ',' +  shipTo.getValue({fieldId: 'zip'})
    								    + ',' +  shipTo.getValue({fieldId: 'country'});    					
    						var reqURL = url.resolveScript({
    							scriptId: 'customscript_gs2_sl_google_distance_api',
    							deploymentId: 'customdeploy_gs2_sl_google_distance_api',
    							returnExternalUrl: true
    						});
            				reqURL += '&from=' + fromAdd + '&to=' + toAdd + '&subsidiary=' + recSubsidiary; // Passing parameters into URL        			
            				// Calculate distance using Google Distance Matrix API
        					var clientResponse 	= https.request({
    							method: https.Method.GET,
    							url: reqURL
    						});
    						var responseCode 	= clientResponse.code; //Get response code
    						var responseText	= 'Network Issue - NetSuite, please try again later or contact your NetSuite Administrator.';
    						var responseValue	= '';
    						if(responseCode == '200'){							
    							var responseBody	= JSON.parse(clientResponse.body); //Get response body
    							responseText		= responseBody[0].text;
    							responseValue		= responseBody[0].value;
    							log.debug('Client - fieldChanged', 'responseBody = ' + JSON.stringify(responseBody));
    						}
    						else{
    							log.error('Client - fieldChanged', responseCode + ' : ' + clientResponse);
    						}
    						scriptContext.currentRecord.setValue({
    							fieldId: 'custbody_travel_distance_time',
    							value: responseText,
    						});
    						if(recSubsidiary == '3'){ // AU = 1, US = 3, CA = 4, NZ = 5
    							scriptContext.currentRecord.setValue({
    								fieldId: 'custbody_travel_distance',
    								value: Math.round(parseInt(responseValue)/1.609/10)/100 // Convert meters into miles
    							});
    						}
    						else{
    							scriptContext.currentRecord.setValue({
    								fieldId: 'custbody_travel_distance',
    								value: Math.round(parseInt(responseValue)/10)/100 // Convert meters into km
    							});
    						}																	
        				}
        				else{
        					scriptContext.currentRecord.setValue({
        						fieldId: 'custbody_travel_distance_time',
        						value: 'Invalid Department Address',
        					});
        					scriptContext.currentRecord.setValue({
        						fieldId: 'custbody_travel_distance',
        						value: -1
        					});
            			}	
        			}
        			else{
    					scriptContext.currentRecord.setValue({
    						fieldId: 'custbody_travel_distance_time',
    						value: 'Invalid Shipping Address',
    					});
    					scriptContext.currentRecord.setValue({
    						fieldId: 'custbody_travel_distance',
    						value: -1
    					});
        			}   			
        		}
    		}  		    		 		
    	}
    }
       
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
    };
    
});