/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Jun 2016     dglenn
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function deleteRecords(type) {
	// Bring in Parameters
	var context = nlapiGetContext();
	var paySearch = context.getSetting('SCRIPT', 'custscript_scis_delete_pay_cs');
	nlapiLogExecution('Debug', 'Payment Search', paySearch);
	var invSearch = context.getSetting('SCRIPT', 'custscript_scis_delete_inv');
	nlapiLogExecution('Debug', 'Payment Search', invSearch);
	
	//Search & Delete Payments and Cash Sales
	var payResults = nlapiSearchRecord(null, paySearch);
	try 
	{
		nlapiLogExecution('DEBUG', 'Results Length: ', payResults.length);
		for(i=0;i<payResults.length;i++)
		{
			var type = payResults[i].getRecordType();
			nlapiLogExecution('DEBUG', 'Type:'+i, type);
			var payId = payResults[i].getId();
			nlapiLogExecution('DEBUG', 'Payment Result:'+i, payId);
			nlapiDeleteRecord(type, payId);
		}
		
	}catch(ex){
		var strError = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' + ex.getStackTrace().join('\n') : ex.toString();
		nlapiLogExecution('DEBUG',  '-- scis record delete --', strError);
	}
	
	// Search & Delete Invoices
	var invResults = nlapiSearchRecord(null, invSearch);
	try 
	{
		nlapiLogExecution('DEBUG', 'Results Length: ', invResults.length);
		for(j=0;j<invResults.length;j++)
		{
			var invId = invResults[j].getId();
			nlapiLogExecution('DEBUG', 'Invoice Result:'+j, invId);
			nlapiDeleteRecord('invoice', invId);
		}
		
	}catch(ex){
		var strError = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' + ex.getStackTrace().join('\n') : ex.toString();
		nlapiLogExecution('DEBUG',  '-- scis record delete --', strError);
	}
}
