/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Apr 2016     pmas
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

var AU_SUB_ID = nlapiGetContext().getSetting('SCRIPT', 'custscript_ps_au_susbsidiary') || 1; // if empty default to 1
var NZ_SUB_ID = nlapiGetContext().getSetting('SCRIPT', 'custscript_ps_nz_susbsidiary') || 5; // if empty default to 5


function suitelet_activeLaybyCustomerDeposit(request, response){
	var objResponse = {};
	try {
			var objResBody = JSON.parse(request.getBody());
			var intInvoicesCount = objResBody.invoices.length;
			var arrCreatedDeposits = [];
			var strSiteID = objResBody.siteid;
			
			for (var i = 0; i < intInvoicesCount; i++) {
				var objSO = objResBody.invoices[i];
				
				if (objSO.apply && objSO.checked) {
					var strSOID = objSO.internalid;

					var recCustDep = nlapiCreateRecord('customerdeposit');
					recCustDep.setFieldValue('customer', objResBody.customerid);
					recCustDep.setFieldValue('salesorder', strSOID);
					recCustDep.setFieldValue('payment', objSO.amountremaining);
					
					// set transaction date based on subsidiary's timezone
					strSubTimeZone = getTimezoneBySiteid(strSiteID);
					var strSubsidiaryDate = setTimeZone(strSubTimeZone);

					nlapiLogExecution('debug', 'converted time', new Date(strSubsidiaryDate));

					recCustDep.setFieldValue('trandate', nlapiDateToString(new Date(strSubsidiaryDate)));

					// set Payment Information
					recCustDep.setFieldValue('creditcard', objResBody.paymentmethods[0].creditcard.internalid);
					
					var strCustDepID = nlapiSubmitRecord(recCustDep, false, true);	
					arrCreatedDeposits.push({
						soid: strSOID,
						custdepositid: strCustDepID
					});
					
					nlapiLogExecution('DEBUG', 'Sales Order - Customer Deposit', JSON.stringify(arrCreatedDeposits));
				}
			}
			
			objResponse.status = 'success';
			objResponse.errorcode = 'CC_PROCESSOR_ERROR';
			objResponse.custdepid = JSON.stringify(arrCreatedDeposits);
			
	} catch(ex) {
		var errorStr = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' : ex.toString();
        nlapiLogExecution('Debug', 'Active Layby Customer Deposit', 'Error encountered.' + ' Error: ' + errorStr);
        
        objResponse.status = 'failed';
        objResponse.errorcode = ex.getCode();
		objResponse.errormessage = errorStr;
	}
	
	response.write(JSON.stringify(objResponse));
}

function getTimezoneBySiteid(siteid) {
	var tz = "";
	switch (siteid) {
		case 2:
			tz = "+10"; 
			break;
		case 4:
			tz = "+12"; 
			break;
		default: 
			tz = "+0"; 
	}

	return (tz);
}

/**
 * Use this method to get current date based on customer location.
 * PS: new date() will only return the current server date, not the date where customer is based.  
 *   
 * @param {string} utc client location UTC time zone 
 * @returns {string}
 */
function setTimeZone(utc) {
	var dateToday = new Date();
	var localTime = dateToday.getTime(); 
	var localOffset = dateToday.getTimezoneOffset()*60000;
	var newTime = localTime+localOffset+(3600000 * utc);
	return newTime;
};
