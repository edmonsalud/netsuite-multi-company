/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       27 May 2014     rvindal
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function saveShipping(type, name, linenum){
var objContext = nlapiGetContext();
	if (type == null && objContext.getExecutionContext() == 'webstore'){
		switch (name){
			case 'custbody_web_shipping_cost':
				nlapiSetFieldValue('shippingcost', nlapiGetFieldValue("custbody_web_shipping_cost"));
				//nlapiSetFieldValue('custbody_ps_webstore_process_flag', 'T');
				break;
//			case 'custbody_web_default_warehouse_loc':
//				nlapiSetFieldValue("custbody_salessource", "2");
//				nlapiSetFieldValue("salesrep", "14000");
//				
//				var sellingLocation = 0;
//				var sub = nlapiGetFieldText("subsidiary");
//				switch (sub){
//					case 'SFT-AU':
//						sellingLocation = 25;
//						break;
//					case 'SFT-CA':
//						sellingLocation = 1;
//						break;
//					case 'SFT-NZ':
//						sellingLocation = 42;
//						break;
//					case 'SFT-US':
//						sellingLocation = 10;
//						break;
//				}
//				
//				var totalLineCount = nlapiGetLineItemCount("item") === 0 ? nlapiGetLineItemCount("item") + 1 : nlapiGetLineItemCount("item");
//				var location = nlapiGetFieldValue("custbody_web_default_warehouse_loc").split(",")[0].split(":")[1];
//
//				for(var i = 1; i <= nlapiGetLineItemCount("item"); i++){
//					if(nlapiGetLineItemValue("item", "item", i) !== "1032"){
//						nlapiSetLineItemValue("item", "location", i, parseInt(location));
//						
//						nlapiSetLineItemValue("item", "custcol_selling_loc", i, sellingLocation);
//						
//						if(nlapiGetFieldValue("custbody_for_pickup") == "T"){
//							nlapiSetLineItemValue("item", "custcol_pick_up", i, "T");
//						} else {
//							nlapiSetLineItemValue("item", "custcol_delivery", i, "T");
//						}
//					}
//				}
//				nlapiCommitLineItem("item");
//				break;				
				
		}
	}
}

function setSalesRep(){
	nlapiSetFieldValue("custbody_salessource", "2");
	nlapiSetFieldValue("salesrep", "14000");
}

function insertInstallation(type){
var objContext = nlapiGetContext();
	if(nlapiGetCurrentLineItemValue("item", "item") === "1032" && objContext.getExecutionContext() == 'webstore'){
		nlapiSetCurrentLineItemValue("item", "amount", parseFloat(nlapiGetFieldValue("custbody_web_installation_total_cost")), true, true);		
	}
	return true;
}
