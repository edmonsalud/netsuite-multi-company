/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     03-08-17	Eric.Choe		Created following functions
 * 											- function setDefaults_BeforeLoad(type, form, request)
 * 											- function setDefaults_BeforeSubmit(type)
 * 
 * 1.01		17-07-18	Eric.Choe		Updated "function setDefaults_BeforeLoad(type, form, request)"
 * 											- to display form level fields as mandatory
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
function setDefaults_BeforeLoad(type, form, request){
	var parent_RA_ID = nlapiGetFieldValue('custrecord_wo_sft_ra'); // Get ID of parent RA 
	
	if(!parent_RA_ID && type == 'create'){// Do not allow creation from scratch
		alert('Please create it from Return Authorization');
		throw nlapiCreateError('Invalid Access', 'Invalid Access : Please create it from Return Authorization', true);
	}
	else if(parent_RA_ID){
		try{
			var parent_RA		= nlapiLoadRecord('returnauthorization', parent_RA_ID);
			var rec_Subsidiary	= parent_RA.getFieldValue('subsidiary');
			
			// Separate Create/Copy and Edit, Create => hide original fields,  Edit => show original field		
			if(rec_Subsidiary == '1' && type == 'create'){// //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2   
				var currentItem_ID;
				var currentItem_Type;						
				
				var repairerField = nlapiGetField('custrecord_wo_sft_repairer'); 
				var itemField = nlapiGetField('custrecord_wo_sft_item'); 

				// Hide original item & repairer fields from form to avoid confusion
				itemField.setDisplayType('hidden');  
				repairerField.setDisplayType('hidden'); 
				
				// Adding temporary form level fields to use filtered/custom drop down list value			
				var repairerField_Form = form.addField('custpage_repairer_id', 'select', 'Repairer');
				var itemField_Form = form.addField('custpage_item_id', 'select', 'Item');
							
				form.insertField(itemField_Form,'custrecord_wo_sft_instructions');
				form.insertField(repairerField_Form,'custrecord_wo_sft_type');
				
				repairerField_Form.setMandatory(true);
				itemField_Form.setMandatory(true);
				
				for(var i = 1; i<= parent_RA.getLineItemCount('item'); i++){ // Replicating item drop down list from RA, default is first line item							
					itemField_Form.addSelectOption(parent_RA.getLineItemValue('item', 'item', i), parent_RA.getLineItemText('item', 'item', i));			
				}
				
				// Creating custom drop down list for repairer
				repairerField_Form.addSelectOption('','');
				repairerField_Form.addSelectOption('60360', nlapiLookupField('vendor', '60360', 'entityid')); // 60360 = Cool Canopies
				repairerField_Form.addSelectOption('60232', nlapiLookupField('vendor', '60232', 'entityid')); // 60232 = Eeva Reinikainen
				repairerField_Form.addSelectOption('338612', nlapiLookupField('vendor', '338612', 'entityid')); // 338612 = Kerry Tuck Sewing Services
				repairerField_Form.addSelectOption('61092', nlapiLookupField('vendor', '61092', 'entityid')); // 61092 = Sunshine Powder Coatings Pty Ltd
				repairerField_Form.addSelectOption('60373', nlapiLookupField('vendor', '60373', 'entityid')); // 60373 = United Canvas & Vinyl
			}
		}catch(ex){
			var processMssg = 'Showing temporary form level fields with filtered drop down list in new Work Order(SFT)';
			var errorStr = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n'  : ex.toString();
			nlapiLogExecution('Error', 'setDefaults_BeforeLoad', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
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
function setDefaults_BeforeSubmit(type){	
	if(type == 'create'){ // Only update hidden field values in creation only
		var vendID = nlapiGetFieldValue('custpage_repairer_id');
		var itemID = nlapiGetFieldValue('custpage_item_id');
		
		if(!vendID && !itemID){
			throw nlapiCreateError('Missing Item & Repairer', 'Please select Item and Repairer', true);
		}
		else if(!vendID){
			throw nlapiCreateError('Missing Repairer', 'Please select Repairer', true);
		}
		else if(!itemID){
			throw nlapiCreateError('Missing Item', 'Please select Item', true);
		}
		else{ // Override hidden field values using temporary form level field values
			try{
				nlapiSetFieldValue('custrecord_wo_sft_repairer', vendID);
				nlapiSetFieldValue('custrecord_wo_sft_item', itemID);
			}catch(ex){
				var processMssg = 'Updating hidden Vendor and Item fields in new Work Order(SFT)';
				var errorStr = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n'  : ex.toString();
				nlapiLogExecution('Error', 'setDefaults_BeforeSubmit', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
			}
		}
	}
}
