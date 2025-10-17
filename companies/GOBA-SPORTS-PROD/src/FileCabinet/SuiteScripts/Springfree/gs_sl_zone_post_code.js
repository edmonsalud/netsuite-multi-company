/**
 * Module Description
 * 
 * Version  Date		Author          Remarks
 * 1.00     13-11-17	Eric.Choe		To access zone post code from Client script regardless of user permission
 * 
 * 2.00		25-07-18	Eric.Choe		"function getFreightZone(request, response)" is updated	
 * 											- To handle multiple post codes
 * 											- Refer to backup archive for original codes & PS_CS_CustPostCode.js
 * 
 */


/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function getFreightZone(request, response){
	try{		
		var freightZone	= "";
		var postCodes = request.getParameter('postcodes');
		nlapiLogExecution('AUDIT', 'getFreightZone', 'Matching Post Codes = ' + postCodes);
		var postCodes_List = postCodes.split(',');	
		for(var i=0; i<postCodes_List.length; i++){
			var postCode = postCodes_List[i];
			var schFilters 	= [new nlobjSearchFilter('isinactive', null, 'is', 'F'),
					           new nlobjSearchFilter('custrecord_zpc_post_code', null, 'is', postCode)];
			var schColoumns = [new nlobjSearchColumn('custrecord_zpc_city_suburb'),
			                   new nlobjSearchColumn('custrecord_zpc_state_province'),
			                   new nlobjSearchColumn('custrecord_zpc_zone')];	
			var schResults 	= nlapiSearchRecord('customrecord_zone_post_code', null, schFilters, schColoumns);
			if (!isNULL(schResults)){
				for(var j=0; j<schResults.length; j++){
					if(freightZone == ""){
						freightZone = '    ' + schResults[j].getValue('custrecord_zpc_city_suburb') + ', ' 
									+ nlapiLookupField('customrecord_post_code', postCode, 'custrecord_pc_post_code') + ', ' // Pulling up post code from parent record
									+ schResults[j].getText('custrecord_zpc_state_province') + ', '
									+ schResults[j].getText('custrecord_zpc_zone') + '\n';						
					}
					else{
						freightZone += '    ' + schResults[j].getValue('custrecord_zpc_city_suburb') + ', ' 
									+ nlapiLookupField('customrecord_post_code', postCode, 'custrecord_pc_post_code') + ', ' // Pulling up post code from parent record
									+ schResults[j].getText('custrecord_zpc_state_province') + ', '
									+ schResults[j].getText('custrecord_zpc_zone') + '\n';	
					}
				}
			}
		}
		if(freightZone == ""){
			freightZone	= 'N/A'
		}
		response.write(freightZone);//Return Freight Zone text
	}catch(ex){
		var processMssg	= 'Error encountered while processing Zone Post Code \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'getFreightZone', processMssg  + ' ' +  errorStr);
	}		
}