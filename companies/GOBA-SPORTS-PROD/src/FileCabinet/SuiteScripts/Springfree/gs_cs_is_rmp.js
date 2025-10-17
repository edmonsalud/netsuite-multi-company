/**
 * Module Description
 * 
 * Version  Date        Author          Remarks
 * 1.00		25-10-17	Eric.Choe
 * 
 * 
 */


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */

function inboundShipment_PageInit(type){
	
}


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to save line item, false to abort save
 */

function  inboundShipment_ValidateLine(type){
	var isValid 	= true;
	var trafficCode	= nlapiGetFieldValue('custrecord_is_traffic_code');
	var shipNo		= nlapiGetFieldValue('id'); // Note: internalid & shipmentnumber both returns NULL
	var shipStatus	= nlapiGetFieldValue('shipmentstatus');
	if(type == 'items'){	
		if(trafficCode == 'To Be Generated' && isNULL(shipNo)){ // For creation only
			isValid = setTrafficCode();
		}
		else if(shipNo && shipStatus != 'received'){			
			// Set flag field to trigger UE script - gs_ue_is_rmp, (Note: Removed items won't be updated!!) 
			nlapiSetFieldValue('custrecord_is_update_po', 'T'); 
		}	
	}
    return isValid;
}


function  setTrafficCode(){
	var isValid	= true;
	var vend_ID	= nlapiLookupField('purchaseorder', nlapiGetCurrentLineItemValue('items','purchaseorder'), 'entity');
	var shipCountry = nlapiLookupField('vendor', vend_ID, 'custentity_vendor_country');
	if(isNULL(shipCountry)){
		alert('Please select "Country" field in the vendor record');
		nlapiLogExecution('DEBUG', 'AUDIT', '"Country" field is missing in the vendor record, ID = ' + vend_ID);
		isValid = false;
	}
	else{
		var trafficCode_Prefix	= nlapiLookupField('customrecord_country_code', shipCountry, 'custrecord_cc_code');
		nlapiLogExecution('DEBUG', 'DEBUG', 'trafficCode_Prefix : ' + trafficCode_Prefix);
		nlapiSetFieldValue('custrecord_is_traffic_code', trafficCode_Prefix);
	}
	return isValid;
}