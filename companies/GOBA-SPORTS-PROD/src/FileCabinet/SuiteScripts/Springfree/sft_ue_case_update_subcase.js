/**
 * Module Description
 * 
 * Version  Date        Author 	        Remarks
 * 1.00     31-08-15    Eric.Choe		
 * 1.10     18-07-16    Eric.Choe		Added "validateUserPermission_BeforeLoad"
 * 1.20		10-08-16	Eric.Choe		Updates on Online Case Forms - Warranty
  										Updated
  											function updateSubCase_AfterSubmit(type)
  										New
  											a.	function updateCustomer_AfterSubmit(caseType)
											b.	function createTgoma(case_tgoma, custID)
											c.	function convertTrampModel(trampModel)
 * 1.30		15-09-16	Eric.Choe		Separated modules for online case forms into new script, "SFT: UE: Case: Update Online Case"
 * 1.31		26-07-17	Eric.Choe		function updateSubCase_AfterSubmit(type) - added following function
 * 											- Updating WARRANTY REGISTERED field in customer record for warranty registration case
 * 											- Added Try & Catch error handling
 * 1.32		13-03-19	Eric.Choe		Updated following function to return "Start Date" as PDT during day light saving period
 * 											- updateTimeOnHold_BeforeSubmit(type)
 * 
 * 1.40		01-10-19	Eric.Choe		Updated "function updateSubCase_AfterSubmit(type)"
 * 											- Added AUDIT log to monitor script execution context						
 * 										Updated "function validateUserPermission_BeforeLoad(type, form, request)"
 * 											- Restructured validation logic 
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

function validateUserPermission_BeforeLoad(type, form, request){ // Validate user's permission to view restricted cases		
	if(type!='create' && isUI()){//  User tried to access it from UI
		var casePermission = nlapiGetFieldValue('custevent_case_permission_type');			
		if(!isNULL(casePermission)){ // If case permission is not empty
			var isValidUser = false; //Flag field to validate permission
			var userID = nlapiGetUser();
			var currentUser = nlapiLoadRecord('employee', userID);
			var userPermissions = currentUser.getFieldValues('custentity_case_permissions'); //permission list from Employee record		
			if(nlapiGetRole() == 3 || userID == nlapiGetFieldValue('assigned') || userID == nlapiGetFieldValue('custevent_created_by')){// Case Owner, Assignee or Administrator role(id = 3) has permission to view
				isValidUser = true;
			}	
			else if(userPermissions){ //Validate user's permission list		
				for(var i=0; i<userPermissions.length; i++){
					if(userPermissions[i] == casePermission){
//						nlapiLogExecution('DEBUG', 'Valid User', 'Employee : ' + currentUser.getFieldValue('entityid') + 
//								', Case : ' + nlapiGetFieldValue('casenumber') + ' - ' +
//								nlapiGetFieldText('custevent_case_permission_type'));									
						isValidUser = true; // If matching permission is found, break for loop
						break;			
					}
				}
			}
			if(isValidUser == false){// If it's not a valid user, return error message
				nlapiLogExecution('DEBUG', 'Invalid User : ' + type, 'Employee : ' + currentUser.getFieldValue('entityid') + 
						', Case : ' + nlapiGetFieldValue('casenumber') + ' - ' +
						nlapiGetFieldText('custevent_case_permission_type'));		
				throw nlapiCreateError('Permission Violation', 'You do not have permission to view this case. Please contact your NetSuite administrator for further details.', true);
			}
		}	
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

/*	Known issues with Time Zone 
 * 		1. setDateTimeValue => not working with custom field
 * 		2. getUserCurrentDateTime() has issue with daylight saving so it adds 1 hr every single time it hold => resolved by converting start time to PDT
*/

function updateTimeOnHold_BeforeSubmit(type){ 	
	var newRec = nlapiGetNewRecord();
	var timeZone = nlapiLoadConfiguration('userpreferences').getFieldValue('timezone');
	var caseRef = nlapiGetRecordId() + ' ' + nlapiGetFieldValue('casenumber') + ' : ';
	var now = nlapiDateToString(getUserCurrentDateTime(),'datetimetz');	
	if(type == 'create' && nlapiGetFieldValue('status') == '6'){ //update Pause Start Date in creation		
		nlapiSetDateTimeValue('custevent_pause_start_date', now, timeZone);				
		nlapiLogExecution('DEBUG', 'Current Date & Time', now);
		nlapiLogExecution('DEBUG', 'Pause Start Date - Pause in Creation ', caseRef + nlapiGetFieldValue('custevent_pause_start_date'));
	}	
	else if (type == 'edit' || type == 'xedit'){  
		var oldRec = nlapiGetOldRecord();
		var oldStatus = oldRec.getFieldValue('status');
		var newStatus = newRec.getFieldValue('status');		
		if(oldStatus != '6' && newStatus == '6'){ // if status changed from non-pause to pause, 6
			nlapiSetDateTimeValue('custevent_pause_start_date', now, timeZone);						
			nlapiLogExecution('DEBUG', 'Current Date & Time', now);
			nlapiLogExecution('DEBUG', 'Pause Start Date', caseRef + nlapiGetFieldValue('custevent_pause_start_date'));
		}		
		else if(oldStatus == '6' && newStatus != '6'){ // if status changed from pause (6) to non-pause
			nlapiSetDateTimeValue('custevent_pause_end_date', now, timeZone);
			var currentTimeZone = 5; // 5 = PST, default time zone of NetSuite
			var currentTime = new Date().toTimeString();
			if(currentTime.indexOf('PDT') !== -1){ // If it's on PDT (i.e. Day Light Saving)
				currentTimeZone = 7;								
			}			
			var startTime = nlapiStringToDate(nlapiGetDateTimeValue('custevent_pause_start_date', currentTimeZone), 'datetimetz'); // Getting value as PST/PDT
			var timeOnPause = new Number(date_difference(startTime, new Date())); // Calculating last pause duration						
			var totalTimeOnPause = new Number(nlapiGetFieldValue('custevent_time_on_pause')); // Getting existing value			
			nlapiSetFieldValue('custevent_time_on_pause', totalTimeOnPause + timeOnPause, false, true); // Sum				
			nlapiLogExecution('DEBUG', 'Pause Start Date (PST/PDT)', caseRef + startTime);
			nlapiLogExecution('DEBUG', 'Current Date & Time (PST/PDT)', currentTime);
			nlapiLogExecution('DEBUG', 'Pause End Date (User Time Zone)', caseRef + nlapiGetFieldValue('custevent_pause_end_date'));
			nlapiLogExecution('DEBUG', 'timeOnPause', caseRef + timeOnPause);
			nlapiLogExecution('DEBUG', 'timeOnPause_Previous', caseRef + totalTimeOnPause);				
		}	
	}
}	


/*function convertToUserTimeZone(currentDateTime) {
//	var currentDateTime = new Date();
	var userTimeZone = nlapiLoadConfiguration('userpreferences').getFieldText('timezone');
	var timeZoneOffSet = (userTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(userTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
	var UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
	var userDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
	
	return new Date(userDateTime);
}*/

function getUserCurrentDateTime() {
	var currentDateTime = new Date();
	var userTimeZone = nlapiLoadConfiguration('userpreferences').getFieldText('timezone');
	var timeZoneOffSet = (userTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(userTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
	var UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
	var userDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
	return new Date(userDateTime);
}


function date_difference(date1, date2) {
	var timeDiff = 0;	
    if(date1 != null){
    	timeDiff = Math.abs(date2.getTime() - date1.getTime());
    }   
//    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Get 1 day in milliseconds    
    var diffDays = timeDiff / (3600 * 24 * 1000) ; // Get 1 day in seconds    
    return diffDays;
}


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

function updateSubCase_AfterSubmit(type){	
	var createdFrom = nlapiGetFieldValue('custevent_case_created_from');
	var caseForm	= nlapiGetFieldValue('customform');
	var caseStatus	= nlapiGetFieldValue('status');
	var extContext = nlapiGetContext().getExecutionContext();
	nlapiLogExecution('AUDIT', 'Execution Context', 'Execution Context = '+ extContext + ' : ' + 'type = ' + type + ' : ' + 'recType = ' + nlapiGetRecordType() + ' : '  + 'recID = ' + nlapiGetRecordId());
	try {
		var processMssg 	= 'Processing Case : ';		
		/***** Updating Sub Case field in parent case after creating a sub case ****/ 	
		if(type == 'create' && createdFrom != '' && isUI()){		
			var subCase = nlapiGetRecordId();				
			nlapiSubmitField('supportcase', createdFrom, 'custevent_sub_case', subCase);			
			nlapiLogExecution('DEBUG', 'Update Sub Case', 'Case ' + createdFrom + ' is updated with sub case ' + subCase);
		}		
		/***** Updating WARRANTY REGISTERED field in customer record for warranty registration case ****/
		if(type != 'delete' && caseForm == '81' && isUI() && caseStatus =='8'){// 81 = SFT Case Form - Warranty, 8 = Resolved - Warranty Registration
			var oldRec = nlapiGetOldRecord();
			var oldRecStatus;	
			if(oldRec){
				oldRecStatus	= oldRec.getFieldValue('status');
			}						
//			nlapiLogExecution('DEBUG', 'updateSubCase_AfterSubmit', 'type: oldRec : oldRecStatus = ' + type + ' : ' + oldRec + ' : ' + oldRecStatus);			
			if((oldRecStatus!= '4' && oldRecStatus!= '8') || oldRec == null){ // Only run if it's in creation or it's not a re-opened or updated case once resolved, 4 = Re-Opened, 8 = Resolved - Warranty Registration
				var custID = nlapiGetFieldValue('company');
			//	nlapiSubmitField('customer', custID, 'custentity_warranty_registered', 'T');
                nlapiSubmitField('customer', custID, 'custentity_warranty_registered', nlapiGetFieldValue('custevent_case_warranty_period'));
				nlapiLogExecution('DEBUG', 'updateSubCase_AfterSubmit', 'Action Type : ' + type + ', Updated Customer ID : ' + custID);
			}
		}		
	}catch(ex){
		var errorStr = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n'  : ex.toString();
	    nlapiLogExecution('Error', 'setDefaults_AfterSubmit', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}	
}