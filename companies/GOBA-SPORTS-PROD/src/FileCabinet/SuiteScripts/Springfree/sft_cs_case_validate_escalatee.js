/**
 * Module Description
 * 
 * Version  Date        Author          Remarks
 * 1.00		11-04-16	Eric.Choe	
 * 
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */

function validateEscalatee_BeforeSaveRecord(){
	var	istgomaSupport = false;
	var escalateeList = nlapiGetLineItemCount('escalateto')
	for(var i=1; i<=escalateeList; i++){		
		if(nlapiGetLineItemValue('escalateto', 'escalatee', i) == '646334'){ // 646334 = tgoma Support, 18 = Eric(testing) 
			istgomaSupport = true;
		}
	}	
	if(istgomaSupport == true && isNullOrEmpty(nlapiGetFieldValue('escalationmessage'))){
		alert('Please remove "tgoma Support" from "Escalate To" or enter new message in "Escalation Message" field');
		return false; 
	}			
    return true;
}


function isNullOrEmpty(valueStr){
    return(valueStr == null || valueStr == "" || valueStr == undefined);
}