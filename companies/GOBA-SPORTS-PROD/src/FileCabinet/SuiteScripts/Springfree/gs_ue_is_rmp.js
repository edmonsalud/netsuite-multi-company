/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     25-10-17	Eric.Choe		Created following functions
 * 											- function setDefaults_AfterSubmit(type)
 * 											- function updatePurchaseOrder(type)
 * 1.10		27-11-17	Eric.Choe		Updated function updatePurchaseOrder(type)
 * 											- To calculate Quantity Ordered
 * 1.11		01-10-19	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)"
 * 											- Added AUDIT log to monitor script execution context
 * 											- Added error handling codes
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
	try{
		var extContext = nlapiGetContext().getExecutionContext();
		nlapiLogExecution('AUDIT', 'Execution Context', 'Execution Context = '+ extContext + ' : ' + 'type = ' + type + ' : ' + 'recType = ' + nlapiGetRecordType() + ' : '  + 'recID = ' + nlapiGetRecordId());
		var shipStatus	= nlapiGetFieldValue('shipmentstatus');
		var updatePO	= nlapiGetFieldValue('custrecord_is_update_po');
		
		if((type == 'create' || type == 'edit') && shipStatus != 'received'){ 
			if(updatePO == 'T'){// EXPECTED DELIVERY DATE has changed or items are added
				updatePurchaseOrder(type, true); 
			}
			else{
				updatePurchaseOrder(type, false);
			}
		}
	}catch(ex){
		var processMssg	= 'Error encountered while processing Inbound Shipment \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'setDefaults_AfterSubmit', processMssg  + ' ' +  errorStr);
	}		
}


function updatePurchaseOrder(type, updatePO){
	try{			
		var recID			= nlapiGetRecordId();
		var curRec 			= nlapiLoadRecord(nlapiGetRecordType(), recID);
		var exp_D_Date		= curRec.getFieldValue('expecteddeliverydate');
		var totalLineItem	= curRec.getLineItemCount('items');		
		var totalOrdered	= 0;		
		//Update EXPECTED DELIVERY DATE in line item(s) in linked Purchase Order(s)
		if(updatePO && exp_D_Date && totalLineItem > 0){			
			var prePO_ID;
			var curPO_ID;
			var curPO_Rec;
			var curPO_TotalLineItem;
			var curPO_Item;
			var curRec_Item;			
			for(var i = 1; i<=totalLineItem; i++){
				curRec.selectLineItem('items', i); 
				curRec_Item	= curRec.getCurrentLineItemValue('items', 'shipmentitem'); // Get unique id of current line item from global line item list				
				nlapiLogExecution('DEBUG', 'DEBUG',  i + 'th Item from Inbound Shipment : ' + curRec_Item);								
				if(i == 1){ // First line item									
					curPO_ID			= curRec.getCurrentLineItemValue('items', 'purchaseorder');
					curPO_Rec			= nlapiLoadRecord('purchaseorder', curPO_ID);
					curPO_TotalLineItem = curPO_Rec.getLineItemCount('item');
				}
				else{
					curPO_ID	= curRec.getCurrentLineItemValue('items', 'purchaseorder');
					if(curPO_ID != prePO_ID){
						nlapiSubmitRecord(curPO_Rec, true, true); // Submit previous Purchase Order if current line item belongs to different Purchase Order
						curPO_Rec	= nlapiLoadRecord('purchaseorder', curPO_ID); // Load new PO
						curPO_TotalLineItem = curPO_Rec.getLineItemCount('item');
					}
				}
				nlapiLogExecution('DEBUG', 'DEBUG', i + 'th Run : prePO_ID = ' + prePO_ID);
				nlapiLogExecution('DEBUG', 'DEBUG', i + 'th Run : curPO_ID = ' + curPO_ID);
				nlapiLogExecution('DEBUG', 'DEBUG', i + 'th Run : curPO_TotalLineItem = ' + curPO_TotalLineItem);							
				for(var j = 1; j<=curPO_TotalLineItem; j++){
					curPO_Rec.selectLineItem('item', j);
					curPO_Item	= curPO_Rec.getCurrentLineItemValue('item', 'lineuniquekey'); // Get unique id of current line item from global line item list					
					if(curPO_Item == curRec_Item){
						nlapiLogExecution('DEBUG', 'DEBUG', 'Found Matching : PO number = ' + curPO_ID + ' : Row = ' + j + ' : Item = ' + curPO_Item);						
						curPO_Rec.setCurrentLineItemValue('item', 'expectedreceiptdate', exp_D_Date);
						curPO_Rec.commitLineItem('item', true);// Commit & do not recalculate total amount 
						break;
					}					
				}																			
				prePO_ID = curPO_ID;				
				if(i == totalLineItem){ // Submit current Purchase Order if it it last line item from Inbound Shipment
					nlapiSubmitRecord(curPO_Rec, true, true);
				}
			}
			curRec.setFieldValue('custrecord_is_update_po', 'F');
		}		
		//Generate Traffic Code in creation of new Inbound Shipment		
		if(type == 'create'){
			var trafficCode	= nlapiGetFieldValue('custrecord_is_traffic_code') + '-';
			var shipNo		= nlapiGetFieldValue('id'); // Note: internalid & shipmentnumber both returns NULL
			if(shipNo){
				for(var i=3; i>=shipNo.length;i--){
					trafficCode += '0';
				}
				trafficCode += shipNo;
			}
			nlapiLogExecution('DEBUG', 'DEBUG', 'trafficCode : ' + trafficCode);
			curRec.setFieldValue('custrecord_is_traffic_code', trafficCode);
		}								
		//Calculate total quantity included in Inbound Shipment
		for(var i = 1; i<=totalLineItem; i++){	
			curRec.selectLineItem('items', i); // Get current line item
			totalOrdered += parseInt(curRec.getCurrentLineItemValue('items', 'quantityexpected'))
		}
		curRec.setFieldValue('custrecord_is_qty_ordered', totalOrdered);						
		nlapiSubmitRecord(curRec);
		nlapiLogExecution('AUDIT', 'updatePurchaseOrder', 'Type = '+ type + ', Record Updated = ' + recID + ', updatePO = ' + updatePO);
		nlapiLogExecution('AUDIT', 'updatePurchaseOrder', 'Governance Left' + nlapiGetContext().getRemainingUsage());
	}catch(ex){
		var processMssg	= 'Error encountered while processing Inbound Shipment \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'updatePurchaseOrder', processMssg  + ' ' +  errorStr);
	}
}