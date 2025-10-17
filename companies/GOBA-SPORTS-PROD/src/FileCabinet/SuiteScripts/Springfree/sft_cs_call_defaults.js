/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Jul 2016     Eric.Choe
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function setDefaults_PageInit(type){		
	var userSub = getUserSub();
		
	if(type == 'create' && getUserSub()=="AU"){
		var tranID = nlapiGetFieldValue('transaction');
		var caseID = nlapiGetFieldValue('supportcase');
			
		if(!isNULL(tranID)){
		   var tranType = nlapiLookupField('transaction', tranID, 'recordtype');
	
		   switch(tranType){
		   		case 'salesorder': 
			   			
		   			var salesOrder = nlapiLoadRecord('salesorder', tranID);
		   			var filCamp = salesOrder.getFieldValue('custbody_sp_filtered_campaign_source');
		   			var callDirect = salesOrder.getFieldValue('custbody_phonedirection');
		   			nlapiSetFieldValue('custevent_filt_camp_source_phone', filCamp);
		   			nlapiSetFieldValue('custevent_call_direction', callDirect);
		   			  
		   			break;
		   }
		}
		
		else if(!isNULL(caseID)){
			var userDept = nlapiGetDepartment();
			
			if(userDept == 6){// 6 = Customer Care
				nlapiSetFieldValue('custevent_filt_camp_source_phone', 1240); // 1240 = 317 AU Existing Customer
			}
			
			else if(userDept == 20 || userDept == 26 || userDept == 33 || userDept == 24){
				nlapiSetFieldValue('custevent_filt_camp_source_phone', 1242); // 1242 = 319 AU Phone
			}
		}
   }
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function clientSaveRecord(){

    return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Boolean} True to continue changing field value, false to abort value change
 */
function clientValidateField(type, name, linenum){
   
    return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum){
 
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function clientPostSourcing(type, name) {
   
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Void}
 */
function clientLineInit(type) {
     
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to save line item, false to abort save
 */
function clientValidateLine(type){
 
    return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Void}
 */
function clientRecalc(type){
 
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to continue line item insert, false to abort insert
 */
function clientValidateInsert(type){
  
    return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to continue line item delete, false to abort delete
 */
function clientValidateDelete(type){
   
    return true;
}
