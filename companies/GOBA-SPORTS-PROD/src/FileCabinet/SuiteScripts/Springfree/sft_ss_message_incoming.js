/**
 * Module Description
 * 
 * Version  Date        Author      Remarks
 * 1.00     09-03-17	Eric.Choe	Scheduled script to search incoming email into NetSuite and create custom records to monitor
 * 1.01		01-06-17	Eric.Choe	Fixed issue with line 87 currentData.length => allData.length 			
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function createNew(type, form, request){
	
	//Calls in the created saved search
   	var incEmail_Search = nlapiLoadSearch('message', 'customsearch_incoming_email');
   	nlapiLogExecution('DEBUG', 'Step 1', 'Load Saved Search');
   	
   	//Run Save Search
   	var incEmail_Result = incEmail_Search.runSearch();
   	nlapiLogExecution('DEBUG', 'Step 2', 'Run Saved Search');
   	
   	if(!isNULL(incEmail_Result)){
   		
		var start = 0;
		var end = 1000;
		var allData = [];
		var currentData;
		var currentDataValues = [];
		var count = 0;
		var total = 0;
		
		nlapiLogExecution('DEBUG', 'Step 3', 'incEmail_Result : ' + incEmail_Result);
		
		try {
			do{
				allData = incEmail_Result.getResults(start, end);
				
				nlapiLogExecution('DEBUG', 'Step 4', 'allData.length : ' + allData.length);
				
				for (var i=0; i<allData.length; i++){
					total +=1;
					
					currentData = allData[i];
					currentDataValues = currentData.getAllColumns();
					
					var email_ID = currentData.getValue(currentDataValues[0]);
										
					//Search existing/matching Incoming Email custom record
					var schFilters = [new nlobjSearchFilter('custrecord_inc_email_id', null, 'equalto', email_ID)];  
					var schColoumns = [new nlobjSearchColumn('custrecord_inc_email_id')];
					var schResults = nlapiSearchRecord('customrecord_inc_email', null, schFilters , schColoumns);
					
					if(isNULL(schResults)){//Create New if none is matching
						nlapiLogExecution('DEBUG', 'New Incoming Email Record', email_ID);
					
						var email_Date = nlapiDateToString(nlapiStringToDate(currentData.getValue(currentDataValues[1])),'datetimetz');//Convert into correct date/time format (i.e 2/22/2017 12:57:00 pm)						
						var email_Author = currentData.getText(currentDataValues[2]);				
						var email_Subject = currentData.getValue(currentDataValues[3]);						
						var email_Recipient = currentData.getValue(currentDataValues[4]);
						var email_RecipientType = currentData.getValue(currentDataValues[5]);							
						var email_Entity_ID = currentData.getValue(currentDataValues[6]);
						var email_Entity_Type = getEntityTypeID(currentData.getText(currentDataValues[7]));
						var email_Entity_Sub = currentData.getValue(currentDataValues[8]);
						
						var newRec = nlapiCreateRecord('customrecord_inc_email');
						newRec.setFieldValue('custrecord_inc_email_id', email_ID);
						newRec.setDateTimeValue('custrecord_inc_email_date', email_Date);//Correct date/time format is mm/dd/yyyy hh:mm:ss am|pm (i.e 2/22/2017 12:57:00 pm)							
						newRec.setFieldValue('custrecord_inc_email_author', email_Author);
						newRec.setFieldValue('custrecord_inc_email_subject', email_Subject);
						
						if(email_RecipientType == 'Employee' && nlapiLookupField('employee', email_Recipient, 'isinactive') == 'F'){
							newRec.setFieldValue('custrecord_inc_email_recipient', email_Recipient);
						}
						
						newRec.setFieldValue('custrecord_inc_email_entity_id', email_Entity_ID);
						newRec.setFieldValue('custrecord_inc_email_entity_type', email_Entity_Type);
						newRec.setFieldValue('custrecord_inc_email_entity_sub', email_Entity_Sub);

						nlapiSubmitRecord(newRec);
						count +=1;
					}				   			
					checkGovernance();				
				}
				start += 1000;
				end   += 1000;				
			}while(allData.length == 1000);			
		} catch(ex) {
			var errorStr = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n'  : ex.toString();
			nlapiLogExecution('Error', 'Incoming Email Monitor', 'Error encountered while '  + ' ' +  errorStr);
		}	
		nlapiLogExecution('AUDIT', 'Goverance Left : ' + nlapiGetContext().getRemainingUsage(), 'Searched Records = ' + total + ' : New Records = ' + count);	
   	}  	
}