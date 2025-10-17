/**
 * Module Description
 * 
 * Version	Date        Author			Remarks
 * 1.00		02-11-16	Eric.Choe		createTgoma_AfterSubmit : Creating tgoma sublist when user enter tgoma s/n into "SERIAL NUMBER TGOMA" field in Item Fulfillment from mobile app
 * 
 * 1.10 	15-11-16	Eric.Choe		createTgoma_AfterSubmit : Updated to be triggered by IF Creation
 * 
 * 2.00		15-08-17	Eric.Choe		Created setDefaults_AfterSubmit function & updated AFTER SUBMIT FUNCTION = setDefaults_AfterSubmit
 * 										Created following new functions to send warranty registration email automatically
 * 											- check_Installation()
 * 											- update_WarrantyRegistrationInfo()
 * 										Added Try & Catch error handling
 * 
 * 2.10		22-11-17	Eric.Choe		Merged following functions into function update_Customer()
 * 	  										- check_Installation()
 * 											- update_WarrantyRegistrationInfo()
 * 								
 * 2.10		17-07-18	Eric.Choe		Updated "function update_Customer()" to check "G4 Customer" tickbox in customer record
 * 										Created following new function to send automated survey email
 * 											-  function send_Survey(cust_id, tran_id)
 * 
 * 2.11		19-07-18	Eric.Choe		Updated "function send_Survey(cust_id, tran_id)"
 * 											- To use 229770 Springfree New Zealand(sales@springfree.co.nz) as sender
 * 
 * 2.12		01-10-19	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)"
 * 											- Added AUDIT log to monitor script execution context
 * 
 */

function testing_BeforeLoad(type){//Dummy function to check parameter values
/*	if(type == 'edit'){
		var item_Class;
		var item_Type;
		var item_ID;		
		for(var i = 1; i<=nlapiGetLineItemCount('item'); i++){// Check line item contains Trampoline
			item_ID		= nlapiGetLineItemValue('item', 'item', i);
			item_Class	= nlapiLookupField('item', item_ID, 'class');
			item_Type	= nlapiLookupField('item', item_ID, 'type');		
			nlapiLogExecution('DEBUG', 'DEBUG', 'item_Class = ' + item_Class);
			nlapiLogExecution('DEBUG', 'DEBUG', 'item_Type = ' + item_Type);
		}
	}*/
} 

function setDefaults_AfterSubmit(type){
	var newTgomaSN 		= nlapiGetFieldValue('custbody_if_tgoma_sn');
	var subSidiary		= nlapiGetFieldValue('subsidiary');	
	if(type != 'delete'){
		try {
			var extContext = nlapiGetContext().getExecutionContext();
			nlapiLogExecution('AUDIT', 'Execution Context', 'Execution Context = '+ extContext + ' : ' + 'type = ' + type + ' : ' + 'recType = ' + nlapiGetRecordType() + ' : '  + 'recID = ' + nlapiGetRecordId());
			if(subSidiary == '1'||subSidiary == '3'||subSidiary == '4'||subSidiary == '5'){// //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2   
				update_Customer(subSidiary);
				if(newTgomaSN){
					createTgoma_AfterSubmit(newTgomaSN);
				}
			}			
		}catch(ex){
			var processMssg	= 'Error encountered while processing Item Fulfilment \n';
			var errorStr 	= ex.toString();
			if (ex instanceof nlobjError){
				errorStr = getErrorMessage(ex);
			}
		    nlapiLogExecution('ERROR', 'setDefaults_AfterSubmit', processMssg  + ' ' +  errorStr);
		}
	}
}


function update_Customer(subsidiary){
	try {					
		var custID		= nlapiGetFieldValue('entity');
		var tranID		= nlapiGetRecordId();
		var isInstall	= false;
		var isTramp		= false;		
		var newStatus	= nlapiGetFieldText('shipstatus');
		var oldRec		= nlapiGetOldRecord();
		var oldStatus	= 'Null';		
		if(oldRec){
			oldStatus =  oldRec.getFieldText('shipstatus');
		}								
		if(oldStatus != newStatus && newStatus == 'Shipped'){// Execute one time only when it's marked as "Shipped"
			var item_Class;
			var item_Type;
			var item_ID;
			var item_Qty;
			var sendSurvey = false;
			//Check line item contains trampoline or installation				
			for(var i = 1; i<=nlapiGetLineItemCount('item'); i++){
				item_ID		= nlapiGetLineItemValue('item', 'item', i);
				item_Qty	= nlapiGetLineItemValue('item', 'quantity', i); //To filter out null value line item in creation
				item_Class	= nlapiLookupField('item', item_ID, 'class');
				item_Type	= nlapiLookupField('item', item_ID, 'type');				
				if(item_ID == '4274' && item_Qty > 0){// 4274 = Install Trampoline
					isInstall 	= true;
					sendSurvey	= true;
				}
				else if((item_ID == '1439'||item_ID == '594'||item_ID == '1327') && item_Qty > 0){// 1439 = Service, 594 = Reassembly, 1327 = Disassembly
					sendSurvey	= true;
				}
				if(item_Class == '1' && item_Type == 'Kit' && item_Qty > 0){// Class 1 = Trampoline
					isTramp = true;
				}
			}
			if(isInstall){
				nlapiSubmitField('customer', custID, 'custentity_install_date', nlapiDateToString(convertToUserTimeZone(), 'date')); // Return current date using user's time zone and update install date	
			}
			if(isTramp){
				nlapiSubmitField('customer', custID, ['custentity_warranty_registered', 'custentity_g4cust'], ['3', 'T']); // 3 = 10 Years	
			}
			if(subsidiary=='5' && sendSurvey){// //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2   
				send_Survey(custID, tranID); // Send survey email for services
			}		
		}
		// Disabled auto-reply below - 29/11/17
/*		// Update correct email template before Go Live###########################		
		var email_Merger 	= nlapiCreateEmailMerger('875'); // SANDBOX
//		var email_Merger 	= nlapiCreateEmailMerger('898'); // Calling Email template, 898 = AU - Warranty Registration SFT Install - Auto Reply		
		// Set up linked records to auto-populate NS tags in email template	
		email_Merger.setEntity('customer', custID);		
		email_Merger.setTransaction(tranID);	
		var merge_Result	= email_Merger.merge(); // Create email object to call subject and body fields	
		// Assign parent records where email will be attached
		var parentRecords	= new Object();
		parentRecords['transaction'] = tranID;
		parentRecords['entity'] = custID;	
		// Send Email
		nlapiSendEmail(nlapiGetUser(), custID, merge_Result.getSubject(), merge_Result.getBody(), null, null, parentRecords);	
*/			
	}catch(ex){
		var processMssg	= 'Error encountered while processing Item Fulfilment \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'update_Customer', processMssg  + ' ' +  errorStr);
	}
}


function send_Survey(cust_id, tran_id){
	try{
		var email_Merger 	= nlapiCreateEmailMerger('1018'); // Calling Email template, 1018 = NZ - Automated Install Survey (SANDBOX = 962)		
		// Set up linked records to auto-populate NS tags in email template	
		email_Merger.setEntity('customer', cust_id);		
		email_Merger.setTransaction(tran_id);	
		var merge_Result				= email_Merger.merge(); // Create email object to call subject and body fields	
		// Assign parent records where email will be attached
		var parentRecords				= new Object();
		parentRecords['transaction']	= tran_id;
		parentRecords['entity'] 		= cust_id;	
		// Send Email
		nlapiSendEmail('229770', cust_id, merge_Result.getSubject(), merge_Result.getBody(), null, null, parentRecords, null, true); // 229770 = Springfree New Zealand, sales@springfree.co.nz
		nlapiLogExecution('DEBUG', 'send_Survey', 'IF# = ' + tran_id + ' : ' + 'Cust# = ' + cust_id);
	}catch(ex){
		var processMssg	= 'Error encountered while processing Item Fulfilment \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'send_Survey', processMssg  + ' ' +  errorStr);
	}
}


function createTgoma_AfterSubmit(newTgomaSN){	
	try {		
		var tranID = nlapiGetRecordId();
		var custID = nlapiGetFieldValue('entity');
		if(type == 'create' && isUI()){//Create new tgoma s/n in creation of new Item Fulfillment
			createTgoma(newTgomaSN, tranID, custID);
			nlapiLogExecution('DEBUG', 'Create New tgoma in IF Creation', tranID + ' ' + nlapiGetFieldValue('tranid') + ' - S/N: ' + newTgomaSN);
		}	
		else if(type == 'edit' && isUI()){//When user updates existing Item Fulfillment
			var oldTgomaSN = nlapiGetOldRecord().getFieldValue('custbody_if_tgoma_sn');			
			var schFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F'),  //Is not Inactive
			                  new nlobjSearchFilter('custrecord_if', null, 'is', tranID)];  //Search by Item Fulfillment		                  
			var schColoumns = [new nlobjSearchColumn('internalid'),
			                   new nlobjSearchColumn('custrecord_sn')];		
			var schResults = nlapiSearchRecord('customrecord_tgoma', null, schFilters , schColoumns);				
			if(isNULL(schResults)){//Adding new tgoma s/n if there is no tgoma sublist in Item Fulfillment
				createTgoma(newTgomaSN, tranID, custID);
				nlapiLogExecution('DEBUG', 'Create New tgoma', tranID + ' ' + nlapiGetFieldValue('tranid') + ' - S/N: ' + newTgomaSN);
			}			
			else{//If there is an existing tgoma sublist 
				var currTgomaSN;
				var isMatching = false;			
				for (var i in schResults){
					currTgomaID = schResults[i].getValue('internalid');
					currTgomaSN = schResults[i].getValue('custrecord_sn');			
					if(currTgomaSN == oldTgomaSN && currTgomaSN != newTgomaSN){//If there is matching tgoma record with old s/n, update it using new s/n
						isMatching = true;
						updateTgoma(currTgomaID, newTgomaSN, custID);
						nlapiLogExecution('DEBUG', 'Update tgoma', tranID + ' ' + nlapiGetFieldValue('tranid') + ' - ID: ' + currTgomaID + ' S/N: ' + oldTgomaSN +' => ' + newTgomaSN);
						break;
					}
					else if(currTgomaSN == newTgomaSN){//If there is matching tgoma record with new s/n, don't do anything
						isMatching = true;
						nlapiLogExecution('DEBUG', 'tgoma Exist', tranID + ' ' + nlapiGetFieldValue('tranid') + ' - ID: ' + currTgomaID + ' S/N: '  + ' ' + newTgomaSN);
						break;
					}				
				}			
				if(isMatching == false){//If there is no matching s/n in search result, create new s/n
					createTgoma(newTgomaSN, tranID, custID);
					nlapiLogExecution('DEBUG', 'Create New tgoma - No Matching', tranID + ' ' + nlapiGetFieldValue('tranid') + ' - S/N: ' + newTgomaSN);
				}
			}			
		}
	}catch(ex){
		var processMssg	= 'Error encountered while processing Item Fulfilment \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'createTgoma_AfterSubmit', processMssg  + ' ' +  errorStr);
	}	
}


function createTgoma(newTgomaSN, tranID, custID){//Create new tgoma s/n object and link to Item Fulfillment
	try{
		var newRec = nlapiCreateRecord('customrecord_tgoma');
		newRec.setFieldValue('name',newTgomaSN);
		newRec.setFieldValue('custrecord_sn',parseInt(newTgomaSN)); //convert case_tgoma to integer
		newRec.setFieldValue('custrecord_if',tranID);	
		nlapiSubmitRecord(newRec, false, true);
		nlapiSubmitField('customer', custID, 'custentity_default_tgoma_sn', newTgomaSN, false); // Updating "DEFAULT TGOMA S/N" in customer record
	}catch(ex){
		var processMssg	= 'Error encountered while processing Item Fulfilment \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'createTgoma', processMssg  + ' ' +  errorStr);
	}	
}


function updateTgoma(tgomaID, newTgomaSN, custID){//Create new tgoma s/n object and link to Item Fulfillment
	try{
		var newRec = nlapiLoadRecord('customrecord_tgoma', tgomaID);
		newRec.setFieldValue('name',newTgomaSN);
		newRec.setFieldValue('custrecord_sn',parseInt(newTgomaSN)); //convert case_tgoma to integer
		nlapiSubmitRecord(newRec, false, true);
		nlapiSubmitField('customer', custID, 'custentity_default_tgoma_sn', newTgomaSN, false); // Updating "DEFAULT TGOMA S/N" in customer record	
	}catch(ex){
		var processMssg	= 'Error encountered while processing Item Fulfilment \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'updateTgoma', processMssg  + ' ' +  errorStr);
	}
}