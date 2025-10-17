/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     29-05-17	Eric.Choe		function setDefaults_AfterSubmit() is created
 * 										function updateFreight_Install() is created
 * 1.01		10-11-17	Eric.Choe		Updated following to be triggered by Springfree only
 * 											- function setDefaults_AfterSubmit(type)
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

	var exeContext 			= nlapiGetContext().getExecutionContext();
	var isValidContext 		= false;
	var roleID 				= nlapiGetContext().getRoleId();
	var isValidSubsidiary	= false;
	var recSubsidiary		= nlapiGetFieldValue('subsidiary');
	
	
	if(recSubsidiary == '1' || recSubsidiary == '3' ||recSubsidiary == '4' ||recSubsidiary == '5'){//AU = 1, US = 3, CA = 4, NZ = 5
		isValidSubsidiary = true;
	}
	
	if((exeContext == 'userinterface' || exeContext == 'csvimport') && isValidSubsidiary){ // Execute only if context is UI or CSV import 
		isValidContext = true;
	}
	else if(exeContext=='userevent' && roleID == 'online_form_user' && isValidSubsidiary){ // Execute it from online forms
		isValidContext = true;
	} 
	
//	nlapiLogExecution('DEBUG', 'Check Point 1', type + ' : ' + exeContext + ' : ' + roleID);
	
	try{
		if((type == 'create'||type == 'edit') && isValidContext){
			updateFreight_Install();					
		}
	}catch(ex){
		var processMssg	= 'Error encountered while processing Customer/Prospect/Lead record \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'setDefaults_AfterSubmit', processMssg  + ' ' +  errorStr);
	}
}

function updateFreight_Install(){// Update Freight Zone and Install Group fields in customer record
	
	try{		
		var postCode = getPostCode();
		
		nlapiLogExecution('DEBUG', 'Check Point 1', 'Post Code : ' + postCode);		
		
		if(!isNULL(postCode)){
			var freightZone		= getFeightZone(postCode);
			var installGroup	= getInstallGroup(postCode);
			var installer 		= getInstaller(postCode);    
          	var ESRI	 		= getESRI(postCode);    
          	var LifemodeSegment	= getLifemodeSegment(postCode);    
			var updateRecord 	= false;			
			var curRec 			= nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
			var curFreightZone 	= curRec.getFieldValue('custentity_freight_zone');
			var curInstallGroup	= curRec.getFieldValue('custentity_install_group');
          	var curInstaller	= curRec.getFieldValue('custentity_installer');
            var curESRI			= curRec.getFieldValue('custentity_esri');
            var curLifemodeSegment = curRec.getFieldValue('custentity_lifemode_segment');
			var subSidiary		= curRec.getFieldValue('subsidiary');
			
			nlapiLogExecution('DEBUG', 'Check Point 2', type + ' ' + nlapiGetRecordType() + ' ' + curRec.getFieldText('subsidiary'));

			if(subSidiary == '5' || subSidiary == '4' || subSidiary == '3' || subSidiary == '1'){ //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2   
				
				if(curFreightZone != freightZone){// Only update if freight zone changed
					curRec.setFieldValue('custentity_freight_zone', freightZone);
					updateRecord = true;
					nlapiLogExecution('DEBUG', 'Check Point 3', 'Freight Zone change : ' + curFreightZone + ' => ' + freightZone);
				}
										
				if(curInstallGroup != installGroup){// Only update if install group changed
					curRec.setFieldValue('custentity_install_group', installGroup);
					updateRecord = true;
					nlapiLogExecution('DEBUG', 'Check Point 4', 'Install Group change : ' + curInstallGroup + ' => ' + installGroup);
                }
										
				if(curInstaller != installer){// Only update if installer changed
					curRec.setFieldValue('custentity_installer', installer);
					updateRecord = true;
					nlapiLogExecution('DEBUG', 'Check Point 5', 'Installer change : ' + curInstaller + ' => ' + installer);
				}

              	if(curESRI != ESRI){// Only update if ESRI changed
					curRec.setFieldValue('custentity_esri', ESRI);
					updateRecord = true;
					nlapiLogExecution('DEBUG', 'Check Point 5', 'ESRI change : ' + curESRI + ' => ' + ESRI);
				}
														
				if(curLifemodeSegment != LifemodeSegment){// Only update if lifemode segment changed
					curRec.setFieldValue('custentity_lifemode_segment', LifemodeSegment);
					updateRecord = true;
					nlapiLogExecution('DEBUG', 'Check Point 5', 'Lifemode Segment change : ' + curLifemodeSegment + ' => ' + LifemodeSegment);
				}
              
				if(updateRecord){
					nlapiSubmitRecord(curRec, false, true);
					nlapiLogExecution('AUDIT', 'Freight & Install - Updated', 'Customer ID : ' + nlapiGetRecordId());
				}
				else{
					nlapiLogExecution('AUDIT', 'Freight & Install - No Update Required', 'Customer ID : ' + nlapiGetRecordId());
				}
			}
			else{
				nlapiLogExecution('AUDIT', 'Freight & Install - Not Updated', 'Invalid Subsidiary - Customer ID : ' + nlapiGetRecordId() + ' ' + curRec.getFieldText('subsidiary'));
			}
		}
		else{
			nlapiLogExecution('AUDIT', 'Freight & Install - Not Updated', 'No matching Post Code - Customer ID : ' + nlapiGetRecordId());
		}
	}catch(ex){
		var processMssg	= 'Error encountered while processing Customer/Prospect/Lead record \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'updateFreight_Install', processMssg  + ' ' +  errorStr);
	}
}
