/**
 * Module Description
 * 
 * Version  Date            Author          Remarks
 * 1.00     22 Jul 2015     eric.choe
 * 1.01		25-08-16		Eric			Updated search filter to exclude inactive vendors
 * 1.02		07-11-17		Eric.Choe		Updated script to only hide 'recipientemail' field, if returned value is not null
 * 											Added Try/Catch error handling codes 
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
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
				if(tranType == 'itemfulfillment'){			
					var emailField = nlapiGetField('recipientemail'); 
					if(emailField){//To avoid intermittent error due to returning null value
						emailField.setDisplayType('hidden');  // hide default email address field to avoid confusion
					}											
					var subID = nlapiLookupField('entity', entityID, 'subsidiary');// filter required - subsidiary of entity
					var schFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F'),  //Is not Inactive
					                  new nlobjSearchFilter('category', null, 'anyof', 4),  //Supplier
					                  new nlobjSearchFilter('email', null, 'isnotempty'), //Email is not empty
					                  new nlobjSearchFilter('subsidiary', null, 'anyof', subID)]; // Same subsidiary as customer		
					var schColoumns = [new nlobjSearchColumn('entityid')];
					var schResults = nlapiSearchRecord('vendor', null, schFilters , schColoumns);						
					var vendID = form.addField('custpage_vend_id', 'select', 'Send to Installer', null, 'recipients');
					vendID.addSelectOption('',''); //adding null as first value				
					for (var i in schResults){
						vendID.addSelectOption(schResults[i].getId(), schResults[i].getValue('entityid'));
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

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */

function BeforeSubmit_Message(type){
	try{
		var conText = nlapiGetContext();
		var exeContext = conText.getExecutionContext();
		var vendID = nlapiGetFieldValue('custpage_vend_id');		
		if(type == 'create' && exeContext == 'userinterface' && vendID != '' && vendID != null){ //not first empty string nor null value
			var vendEmail = nlapiLookupField('entity', vendID, 'email');//Get email address from vendor 
			nlapiSetFieldValue('recipientemail', vendEmail); //Replace Recipient email using vendor email
		}
	}catch(ex){
		var processMssg	= 'Error encountered while processing Message \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'BeforeSubmit_Message', processMssg  + ' ' +  errorStr);
	}	
}

