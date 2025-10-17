/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     31-10-17	Eric.Choe		Created following
 * 											- function setDefaults_AfterSubmit(type)
 * 											- function updateExpRecDate(recID, newDueDate)
 * 
 * 1.01		15-11-17	Eric.Choe		Updated function setDefaults_AfterSubmit(type)
 * 											- To be triggered only if due date has value
 * 											- To be triggered for Core Sports as well
 * 
 * 1.10		27-11-17	Eric.Choe		Renamed function 
 * 											- updateExpRecDate(recID, newDueDate) => function updatePO(type)
 * 										Updated function updatePO(type)
 * 											- To calculate Quantity Ordered
 * 
 * 1.11		22-03-17	Eric.Choe		Updated function updatePO(type)
 * 											- To update "Expected Ship Date" if it's not matching with "Receive By/Due Date"
 * 
 * 1.12		01-10-19	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)"
 * 											- Added AUDIT log to monitor script execution context
 * 											- Added error handling codes
 *
 * 1.13		20-01-20	Eric.Choe		Updated "function updatePO(type)"
 * 											- To update expectedreceiptdate in line item in creation only
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
		var recSubsidiary	= nlapiGetFieldValue('subsidiary');	
		if((recSubsidiary == '9' || recSubsidiary == '10') && isUI()){ //9 = RMP Athletic, 10 = Core Sports
			if(type=='create' || type=='edit'){
				updatePO(type);		
			}
		}
	}catch(ex){
		var processMssg	= 'Error encountered while processing Purchase Order \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'setDefaults_AfterSubmit', processMssg  + ' ' +  errorStr);
	}
}


function updatePO(type){
	try{
		var recID			= nlapiGetRecordId();
		var curRec 			= nlapiLoadRecord(nlapiGetRecordType(), recID);	
		var totalLineItem	= curRec.getLineItemCount('item');
		var dueDate			= curRec.getFieldValue('duedate');
		var totalOrdered	= 0;
		var expDate;				
		for(var i = 1; i<=totalLineItem; i++){		
			curRec.selectLineItem('item', i); // Get current line item		
			if(curRec.getCurrentLineItemValue('item', 'isclosed') == 'F'){//Count quantity if line item is not closed
				totalOrdered 	+= parseInt(curRec.getCurrentLineItemValue('item', 'quantity'));
			}
			expDate = curRec.getCurrentLineItemValue('item', 'expectedreceiptdate');
			if(expDate != dueDate && type =='create'){ // 20-01-20 Only triggered in creation, requested by Mai - SC159808  
				curRec.setCurrentLineItemValue('item', 'expectedreceiptdate', dueDate);
				curRec.commitLineItem('item', true);// Commit & recalculate total amount
			}						
		}
		curRec.setFieldValue('custbody_so_qty_ordered', totalOrdered);		
		nlapiSubmitRecord(curRec);
		nlapiLogExecution('AUDIT', 'updatePO', 'Type = '+ type + ', Record Updated = ' + recID);		
	}catch(ex){
		var processMssg	= 'Error encountered while processing Purchase Order \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'updatePO', processMssg  + ' ' +  errorStr);
	}
}