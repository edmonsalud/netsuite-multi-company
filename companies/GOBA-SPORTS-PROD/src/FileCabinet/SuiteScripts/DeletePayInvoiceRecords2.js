/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Jun 2016     dglenn
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
function markForDeletion(type){
	if (nlapiGetContext().getExecutionContext() == 'webapplication' && (type == 'create' || type == 'xedit'))
	{
		// Bring in Parameters
		var context = nlapiGetContext();
		var depOpt = context.getSetting('SCRIPT', 'custscript_scis_payment_deposit');
		nlapiLogExecution('Debug', 'Deposit Item Option', depOpt);

		//Load Record
		var type = nlapiGetRecordType();
		nlapiLogExecution("DEBUG", "Type: ", type);
		var id = nlapiGetRecordId();
		nlapiLogExecution("DEBUG", "Record ID: ", id);
		var rec = nlapiLoadRecord(type, id,  {recordmode : 'dynamic'});

		//Check the record type
		if (type == 'cashsale')
		{
			nlapiLogExecution('DEBUG', 'After Submit Cash Sale', type);
			// IF the deposit taken item option is present on any item, a deposit will be created using this payment's data
			var itemLength = rec.getLineItemCount('item');
			for (var i=1; i<=itemLength; i++)
			{
				var depTaken = rec.getLineItemValue('item','custcol_scis_paymentoptions',i);
				nlapiLogExecution('DEBUG', 'Deposit Taken?', depTaken);
				if (depTaken == depOpt)
				{
					var cust = rec.getFieldValue('entity');
					var salesOrder = rec.getFieldValue('createdfrom');
					rec.setFieldValue('custbody_scis_deposit_delete','T');
					nlapiSubmitRecord(rec);
					//Search for the Deposit and Link the Sales Order
					var filters = new Array();
					filters[0] = new nlobjSearchFilter ('type', null, 'anyof', ["CustDep"]);			
					filters[1] = new nlobjSearchFilter ('name', null, 'anyof', cust);
					filters[2] = new nlobjSearchFilter ('salesorder', null, 'anyof', "@NONE@");
					filters[3] = new nlobjSearchFilter ('custbody_scis_salesorder_dep', null, 'anyof', [salesOrder]);
					filters[4] = new nlobjSearchFilter ('mainline', null, 'is', "T");

					var columns = new Array();
					columns[0] = new nlobjSearchColumn('internalid').setSort(true);
					var depositSearch = nlapiSearchRecord('transaction', null, filters, columns);
					nlapiLogExecution('DEBUG', 'Deposit Search Length', depositSearch.length);
					var results = depositSearch[0];						
					var depId = results.getId();
					nlapiLogExecution('DEBUG', 'Deposit to Link', depId);
					var depRec = nlapiLoadRecord('customerdeposit', depId);
					depRec.setFieldValue('salesorder', salesOrder);
					nlapiSubmitRecord(depRec);
				}
			}
		}
		else
		{
			//Check if invoice is 'Paid in Full'
			if (rec.getFieldValue('status') == 'Paid In Full')
			{
				// IF the deposit taken item option is present on any item, a deposit will be created using this payment's data
				var itemLength = rec.getLineItemCount('item');
				for (var i=1; i<=itemLength; i++)
				{
					var depTaken = rec.getLineItemValue('item','custcol_scis_paymentoptions',i);
					nlapiLogExecution('DEBUG', 'Deposit Taken?', depTaken);
					if (depTaken == depOpt)
					{
						var cust = rec.getFieldValue('entity');
						var salesOrder = rec.getFieldValue('createdfrom');
						//Check SCIS Deposit - Delete Trans box on invoice
						rec.setFieldValue('custbody_scis_deposit_delete','T');
						nlapiSubmitRecord(rec);
						var soRec = nlapiLoadRecord('salesorder', salesOrder);
						soRec.setFieldValue('paymentmethod', null);
						nlapiSubmitRecord(soRec);

						//Search for the Deposit and Link the Sales Order
						var filters = new Array();
						filters[0] = new nlobjSearchFilter ('type', null, 'anyof', ["CustDep"]);			
						filters[1] = new nlobjSearchFilter ('name', null, 'anyof', cust);
						filters[2] = new nlobjSearchFilter ('salesorder', null, 'anyof', "@NONE@");
						filters[3] = new nlobjSearchFilter ('custbody_scis_salesorder_dep', null, 'anyof', [salesOrder]);
						filters[4] = new nlobjSearchFilter ('mainline', null, 'is', "T");

						var columns = new Array();
						columns[0] = new nlobjSearchColumn('internalid').setSort(true);
						var depositSearch = nlapiSearchRecord('transaction', null, filters, columns);
						if(depositSearch != null && depositSearch.length > 0)
						{ 
							nlapiLogExecution('DEBUG', 'Deposit Search Length', depositSearch.length);
							for (var j=0; j<depositSearch.length; j++)
							{
								var results = depositSearch[j];
								var depId = results.getId();
								nlapiLogExecution('DEBUG', 'Deposit to Link', depId);
								var depRec = nlapiLoadRecord('customerdeposit', depId);
								depRec.setFieldValue('salesorder', salesOrder);
								nlapiSubmitRecord(depRec);
							}
						}
					}
				}
			}
		}
	}
}

function createFullDeposit(type){
	if (nlapiGetContext().getExecutionContext() == 'webapplication' && (type == 'create' || type == 'xedit'))
	{
		// Bring in Parameters
		var context = nlapiGetContext();
		var depOpt = context.getSetting('SCRIPT', 'custscript_scis_payment_deposit');
		var depMethod = context.getSetting('SCRIPT', 'custscript_scis_paymethod_deposit2');
		nlapiLogExecution('Debug', 'Deposit Item Option', depOpt);

		//Load Record
		var type = nlapiGetRecordType();
		nlapiLogExecution("DEBUG", "Type: ", type);

		//Check the record type
		if (type == 'cashsale')
		{
			// IF the deposit taken item option is present on any item, a deposit will be created using this payment's data
			var itemLength = nlapiGetLineItemCount('item');
			for (var i=1; i<=itemLength; i++)
			{
				var depTaken = nlapiGetLineItemValue('item','custcol_scis_paymentoptions',i);
				nlapiLogExecution('DEBUG', 'Deposit Taken?', depTaken);
				if (depTaken == depOpt)
				{
					var salesOrder = nlapiGetFieldValue('createdfrom');
					if (salesOrder)
					{
						var soRec = nlapiLoadRecord('salesorder', salesOrder);
						soRec.setFieldValue('paymentmethod', null);
						nlapiSubmitRecord(soRec);
						//Check SCIS Deposit - Delete Trans box on cash sale
						nlapiSetFieldValue('custbody_scis_deposit_delete','T');
						nlapiSetFieldValue('ccapproved','F');
						nlapiSetFieldValue('chargeit','F');
						var custId = nlapiGetFieldValue('entity');
						nlapiLogExecution('DEBUG', 'Customer ID: ', custId);
						var payMethod = nlapiGetFieldValue('paymentmethod');
						var location = nlapiGetFieldValue('location');
						var ccName = nlapiGetFieldValue('ccname');
						var ccStreet = nlapiGetFieldValue('ccstreet');
						var ccZip = nlapiGetFieldValue('cczipcode');
						var payProf = nlapiGetFieldValue('creditcardprocessor');
						var payAmount = nlapiGetFieldValue('total');
						nlapiLogExecution('DEBUG', 'Payment Amount: ', payAmount);
						var ccNumber = nlapiGetFieldValue('ccnumber');
						var ccCode = nlapiGetFieldValue('ccsecuritycode');
						var ccExpire = nlapiGetFieldValue('ccexpiredate');
						nlapiSetFieldValue('paymentmethod', depMethod);
						nlapiSetFieldValue('creditcardprocessor','');
						nlapiSetFieldValue('ccnumber',null);
						nlapiSetFieldValue('ccsecuritycode',null);
						nlapiSetFieldValue('ccexpiredate',null);

						try{
							var deposit = nlapiCreateRecord('customerdeposit', {recordmode : 'dynamic'});
							deposit.setFieldValue('customer', custId);
							deposit.setFieldValue('paymentmethod', payMethod);
							deposit.setFieldValue('custbody_scis_salesorder_dep', salesOrder);
							deposit.setFieldValue('location', location);
							deposit.setFieldValue('payment', payAmount);
							//credit card details is needed when it is not cash payment
							if(!isUndefinedNullOrEmpty(ccNumber)){
								deposit.setFieldValue('ccnumber', ccNumber);
								deposit.setFieldValue('creditcardprocessor', payProf);
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
					// If a Sales Order has not been created, then alert the user to create one prior to accepting deposit
					else (salesOrder == null)
					{
						var error = nlapiCreateError('SalesOrder', 'You must create a Sales Order prior to accepting a deposit', true);
						throw error;
					}
				}
			}
		}
	}
}

function isUndefinedNullOrEmpty(obj){
	return (obj == null || !obj || obj == '' || obj == undefined);
}
