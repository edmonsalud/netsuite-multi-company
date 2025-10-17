/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     22-01-18	Eric.Choe		Created "function update_FillRate(type)"
 * 
 * 1.10		26-03-19	Eric.Choe		Following function is added to handle "SSS_TIME_LIMIT_EXCEEDED" error
 * 											- checkTimeElapsed(startTime) to handle "SSS_TIME_LIMIT_EXCEEDED" error
 * 										Created script parameter to keep saved search to be used										
 * 
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function update_FillRate(type) {
	// Load saved search from script parameter - [Script] Open Sales Orders - RMP
	var openSO = nlapiLoadSearch('salesorder', nlapiGetContext().getSetting('SCRIPT', 'custscript_so_search')); 
   	nlapiLogExecution('DEBUG', 'update_FillRate', 'Load Saved Search');   	
   	// Run Save Search
   	var openSO_Result = openSO.runSearch();
   	nlapiLogExecution('DEBUG', 'update_FillRate', 'Run Saved Search');  	
   	if(!isNULL(openSO_Result)){   		
		var start = 0;
		var end = 500;
		var allData = [];
		var currentData;
		var currentDataValues = [];		
		var recID;
		var curRec;		
		var total = 0;						
		try {
			var startTime = new Date().getTime();
			do{
				allData = openSO_Result.getResults(start, end);				
				nlapiLogExecution('DEBUG', 'update_FillRate', 'Total number of records : ' + allData.length);				
				for (var i=0; i<allData.length; i++){
					total +=1;	
					currentData	= allData[i];
					currentDataValues = currentData.getAllColumns(); //To get search column object for Internal ID						
					recID = currentData.getValue(currentDataValues[0]); // Internal ID of sales order														
					nlapiLogExecution('DEBUG', 'DEBUG', total + 'th Run : Record updated = ' + recID);
					setFillRate(recID, false, false); // Update fill rate
					checkGovernance(); // Check script usage left
					checkTimeElapsed(startTime); // Check execution time left										
				}
				start += 500;
				end   += 500;				
			}while(allData.length == 500);			
		}catch(ex){
			var processMssg	= 'Error encountered while processing Fill Rate on Sales Order \n';
			var errorStr 	= ex.toString();
			if (ex instanceof nlobjError){
				errorStr = getErrorMessage(ex);
			}
		    nlapiLogExecution('ERROR', 'update_FillRate', processMssg  + ' ' +  errorStr);
		}	
		nlapiLogExecution('AUDIT', 'Goverance Left : ' + nlapiGetContext().getRemainingUsage(), 'Updated Records = ' + total);	
   	} 
}