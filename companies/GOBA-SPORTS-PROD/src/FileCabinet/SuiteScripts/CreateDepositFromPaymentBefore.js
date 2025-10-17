/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 Jan 2016     dglenn
 *
 */

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
function createDeposit(type){
	//Restrict the script to SCIS only
	nlapiLogExecution('Debug', 'Execution Type', nlapiGetContext().getExecutionContext());	
	if (type == 'create' && nlapiGetContext().getExecutionContext() == 'webapplication')
	{
		// Bring in Parameters
		var context = nlapiGetContext();
		var depOpt = context.getSetting('SCRIPT', 'custscript_scis_payment_deposit_2');
		nlapiLogExecution('Debug', 'Deposit Item Option', depOpt);
		var balMethod = context.getSetting('SCRIPT', 'custscript_scis_paymethod_balance');
		nlapiLogExecution('Debug', 'Remaining Balance Payment Method', balMethod);
		var depMethod = context.getSetting('SCRIPT', 'custscript_scis_paymethod_deposit');
		nlapiLogExecution('Debug', 'Customer Deposit Payment Method', depMethod);
		
		//Get values for the applied to invoice and related sales order
		var payMethod = nlapiGetFieldValue('paymentmethod');
		var applyLength = nlapiGetLineItemCount('apply');
		if(payMethod != balMethod)
		{
			nlapiLogExecution('DEBUG', 'Payment Method:', payMethod);
			for (var i=1; i<=applyLength; i++)
			{
				if (nlapiGetLineItemValue('apply', 'apply', i) == 'T')
				{
					var salesOrder = nlapiGetLineItemValue('apply', 'createdfrom', i);
					var invId = nlapiGetLineItemValue('apply', 'internalid', i);
					var invAmt = nlapiGetLineItemValue('apply', 'total', i);
					nlapiLogExecution('DEBUG', 'Invoice', invId);
					break
				}
			}

			// Load invoice and check for deposit taken item option
			var invRec = nlapiLoadRecord('invoice', invId, {recordmode : 'dynamic'});
			var itemLength = invRec.getLineItemCount('item');
			for (var i=1; i<=itemLength; i++)
			{
				var depTaken = invRec.getLineItemValue('item','custcol_scis_paymentoptions',i);
				nlapiLogExecution('DEBUG', 'Deposit Taken?', depTaken);

				// IF the deposit taken item option is present on any item, a deposit will be created using this payment's data
				if (depTaken == depOpt)
				{
					nlapiSetFieldValue('custbody_scis_deposit_delete','T');
					nlapiSetFieldValue('ccapproved','F');
					nlapiSetFieldValue('chargeit','F');
					var custId = nlapiGetFieldValue('customer');
					var payMethod = nlapiGetFieldValue('paymentmethod');
					var location = nlapiGetFieldValue('location');
					var ccName = nlapiGetFieldValue('ccname');
					var ccStreet = nlapiGetFieldValue('ccstreet');
					var ccZip = nlapiGetFieldValue('cczipcode');
					var payProf = nlapiGetFieldValue('creditcardprocessor');
					nlapiLogExecution('DEBUG', 'Payment Record Profile', payProf);
					var payAmount = nlapiGetFieldValue('payment');
					var ccNumber = nlapiGetFieldValue('ccnumber');
					var ccCode = nlapiGetFieldValue('ccsecuritycode');
					var ccExpire = nlapiGetFieldValue('ccexpiredate');
					nlapiSetFieldValue('paymentmethod',depMethod);
					nlapiSetFieldValue('chargeit','F');
					nlapiSetFieldValue('ccapproved','T');
					nlapiSetFieldValue('creditcardprocessor','');
					nlapiSetFieldValue('ccnumber','');
					nlapiSetFieldValue('ccsecuritycode','');
					nlapiSetFieldValue('ccexpiredate','');
					// If a Sales Order has not been created, then alert the user to create one prior to accepting deposit
					if (salesOrder == null)
					{
						var error = nlapiCreateError('SalesOrder', 'You must create a Sales Order prior to accepting a deposit', true);
						throw error;
					}
					else{
						nlapiLogExecution('DEBUG', 'Sales Order:', salesOrder);						
						try{
							var deposit = nlapiCreateRecord('customerdeposit', {recordmode : 'dynamic'});
							deposit.setFieldValue('customer', custId);
							deposit.setFieldValue('paymentmethod', payMethod);
							//deposit.setFieldValue('salesorder', salesOrder);
							deposit.setFieldValue('custbody_scis_salesorder_dep', salesOrder);
							deposit.setFieldValue('location', location);
							deposit.setFieldValue('payment', payAmount);
							//credit card details is needed when it is not cash payment
							if(!isUndefinedNullOrEmpty(ccNumber)){
								deposit.setFieldValue('ccnumber', ccNumber);
								deposit.setFieldValue('creditcardprocessor', payProf);
								nlapiLogExecution('DEBUG', 'Deposit Record Profile', deposit.getFieldValue('creditcardprocessor'));
								deposit.setFieldValue('ccname', ccName);
								deposit.setFieldValue('ccstreet', ccStreet);
								deposit.setFieldValue('cczipcode', ccZip);
								deposit.setFieldValue('ccsecuritycode', ccCode);
								deposit.setFieldValue('ccexpiredate', ccExpire);
							}							
							nlapiSubmitRecord(deposit);
							nlapiLogExecution('DEBUG', 'Deposit Created for SO ID: ', salesOrder);

						}catch(ex){
							var strError = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' + ex.getStackTrace().join('\n') : ex.toString();
							nlapiLogExecution('DEBUG',  '-- customer deposit creation --', strError);
						}						
					}
				}
			}
		}
		else
		{
			nlapiSetFieldValue('custbody_scis_deposit_delete','T');
			//Get values for the applied to invoice and related sales order
			var applyLength = nlapiGetLineItemCount('apply');
			nlapiLogExecution('DEBUG', 'Payment Method:', payMethod);
			for (var i=1; i<=applyLength; i++)
			{
				if (nlapiGetLineItemValue('apply', 'apply', i) == 'T')
				{
					var salesOrder = nlapiGetLineItemValue('apply', 'createdfrom', i);
					var invId = nlapiGetLineItemValue('apply', 'internalid', i);
					var invAmt = nlapiGetLineItemValue('apply', 'total', i);
					var amtDue = nlapiGetLineItemValue('apply','due',i);
					nlapiLogExecution('DEBUG', 'Remaining Balance Due: ', amtDue);
					break
				}
			}
		}
	}
}

function isUndefinedNullOrEmpty(obj){
	return (obj == null || !obj || obj == '' || obj == undefined);
}
