/**
 * Module Description
 * 
 * Version  Date        Author          Remarks
 * 1.00		03-04-17	Eric.Choe		Updating fields in customer record after creating/editing visitor tracker
 * 
 * 1.01		26-09-19	Eric.Choe		Deleted default functions not used - before load and before submit
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
function updateCustomer_AfterSubmit(type){
	
	var custID = nlapiGetFieldValue('custrecord_cust_name');
	
	if(type != 'delete' && !isNULL(custID)){//Customer record field is not empty

		var salesReadiness = nlapiGetFieldValue('custrecord_vt_sales_readiness');
		var yardSize = nlapiGetFieldValue('custrecord_vt_yard_size');
		var noOfKids = nlapiGetFieldValue('custrecord_vt_no_kids');
		var smartInterest = nlapiGetFieldValue('custrecord_vt_smart_interest');
			
		if(!isNULL(salesReadiness) || !isNULL(yardSize) || !isNULL(noOfKids) || !isNULL(smartInterest)){
			var custRec = nlapiLoadRecord('customer', custID); 
			
			if(!isNULL(salesReadiness)){//Update SALES READINESS field, if not empty
				custRec.setFieldValue('custentity_sales_readiness', salesReadiness);
			}
			
			if(!isNULL(yardSize)){//Update QUALIFICATION (SIZE OF YARD) field, if not empty
				custRec.setFieldValue('custentity_qualification_size_yard', yardSize);
			}
			
			if(!isNULL(noOfKids)){//Update FAMILY MEMBERS field, if not empty
				custRec.setFieldValue('custentity_familymembers', noOfKids);
			}
			
			if(!isNULL(smartInterest)){//Update SMART INTEREST field, if not empty
				custRec.setFieldValue('custentity_smart_interest', smartInterest);
			}
			
			nlapiSubmitRecord(custRec, false, true); //Submit customer record and ignore mandatory fields & sourcing
			nlapiLogExecution('DEBUG', 'Update Customer', 'Customer ID : SALES READINESS : SIZE OF YARD : FAMILY MEMBERS = ' 
					+ custID + ' : ' + nlapiGetFieldText('custrecord_vt_sales_readiness') 
					+ ' : ' + nlapiGetFieldText('custrecord_vt_yard_size')
					+ ' : ' + nlapiGetFieldText('custrecord_vt_no_kids')
					+ ' : ' + nlapiGetFieldText('custrecord_vt_smart_interest'));
		}
		else{
			nlapiLogExecution('DEBUG', 'No Fields to Update', salesReadiness + ' : ' + yardSize + ' : ' + noOfKids + ' : ' + smartInterest);
		}

	}
	else{
		nlapiLogExecution('DEBUG', 'No Customer Record', custID);
	}
}