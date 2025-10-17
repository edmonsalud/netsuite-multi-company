/**
 * Module Description
 * 
 * Version  Date            Author          Remarks
 * 1.00     22-03-16		Eric.Choe		Created script
 * 
 * 2.00		24-06-16		Eric.Choe		Added CSV Import as valid context
 * 
 * 2.01		26-09-19		Eric.Choe		Updated module description to follow standard layout
 * 					  	
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */

function setDefaults_AfterSubmit(type){	
	var exeContext = nlapiGetContext().getExecutionContext();
	var tgomaRec;
	var isValidContext = false;	
	if(exeContext == 'userinterface' || exeContext == 'csvimport'){ // Execute only if context is UI or CSV import 
		isValidContext = true;
	} 				
	if(type != 'delete'){
		tgomaRec = nlapiLoadRecord('customrecord_tgoma', nlapiGetRecordId());
		
		if (isValidContext == true && tgomaRec.getFieldValue('custrecord_update_default') == 'T'){	
			if(type == 'create' || type == 'edit' || type == 'xedit'){		
				nlapiSubmitField('customer', tgomaRec.getFieldValue('custrecord_cust'), 'custentity_default_tgoma_sn', tgomaRec.getFieldValue('custrecord_sn'));
				nlapiLogExecution('DEBUG', 'Customer ID : Tgoma S/N', tgomaRec.getFieldValue('custrecord_cust') + ' : ' + tgomaRec.getFieldValue('custrecord_sn'));
			}
		}
	}
	else{
		tgomaRec = nlapiGetOldRecord();
		
		nlapiLogExecution('DEBUG', 'tgoma Deleted by ' + nlapiGetContext().getUser() + ' ' + nlapiGetContext().getName(), 
				'S/N ' + tgomaRec.getFieldValue('custrecord_sn') + ' is deleted from customer ' +  tgomaRec.getFieldValue('custrecord_cust') );
	}
}