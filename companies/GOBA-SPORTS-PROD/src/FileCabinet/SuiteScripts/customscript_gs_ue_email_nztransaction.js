/**
 * Module Description
 * 
 * Version  Date            Author          Remarks
 * 1.00     1 Jun 2021     Rebecca.Basile	Set field for "Include Transaction" to False on record load
  */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, 
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */

function BeforeLoad_Message(type, form){
	try{
		var conText = nlapiGetContext();
		var exeContext = conText.getExecutionContext();
		var entityID = nlapiGetFieldValue('entity');	
		if(type == 'create' && exeContext == 'userinterface' && entityID != null){			
			var tranID = nlapiGetFieldValue('transaction');		
			if(tranID != null){
				var tranType = nlapiLookupField('transaction', tranID, 'recordtype');			
				if(tranType == 'salesorder'){			
					var subID = nlapiLookupField('entity', entityID, 'subsidiary');// filter required - subsidiary of entity
					if(subID == '5'){
							var inclTrans = nlapiGetField('includetransaction');
							if(inclTrans = 'T'){
								nlapiSetFieldValue('includetransaction', null, null, false);
						}
					}	
				}
			}			
		}
	}catch(ex){
		var processMssg	= 'Error encountered while processing Message \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'BeforeLoad_Message', processMssg  + ' ' +  errorStr);
	}
}
