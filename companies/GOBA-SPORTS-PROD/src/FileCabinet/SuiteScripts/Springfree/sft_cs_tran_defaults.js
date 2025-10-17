/**
 * Module Description
 * 
 * Version  Date        Author          Remarks
 * 1.00		11-10-16	Eric.Choe		"transaction_PageInit" : Set default values for (AU) Organisational Sales Order with Parent/Child relationship
 * 										"transaction_PostSourcing": Set default value for "Reassembly" and "Disassembly" same as installation cost per zone
 * 
 * 2.00		29-05-17	Eric.Choe		"function updateInstaller()" is created and added to following functions
 * 											- "transaction_PageInit" 
 * 											- "transaction_PostSourcing"
 *  									"function updateOrganisationInvoice()" is created : core functions are now separated from transaction_PageInit
 * 										"function updateDeReCharge()" is created : core functions are now separated from transaction_PostSourcing
 * 										isUI() is removed from all functions
 * 
 * 3.00		13-09-17	Eric.Choe		Following function is created for RMP on hold order
											- "function updateSplitOrder(splitFrom_ID)"
											 
 * 3.10		05-10-17	Eric.Choe		Following functions are created for calculating discount on unit price (RMP)
 * 											- "function transaction_ValidateLine(type)"
 * 											- "function setDiscountedPrice()"
 * 
 * 3.20		24-01-18	Eric.Choe		Following function is created for RMP 
 * 											- "function transaction_FieldChanged(type, name, linenum)"
 * 
 * 3.2.1	13-02-18	Eric.Choe		Updated "function setDiscountedPrice()"
 * 											- To exclude new price level - Close Out
 * 
 * 3.2.2	23-02-18	Eric.Choe		Updated "function updateSplitOrder(splitFrom_ID)"
 * 											- To copy billing address from parent order
 * 										Updated "function setDiscountedPrice()"
 * 											- To exclude items where unit price is not set up and keep amount entered manually by user
 * 										Deleted all "nlapiLogExecution" calls as it's not supported in client script
 * 
 * 3.2.3	15-03-18	Eric.Choe		Updated "function setDiscountedPrice()"
 * 											- To set Order Priority = 1 for Split Order to get priority on commitment 

 * 4.0.0	15-06-18	Eric.Choe		Created following new functions to set form level field values - Sales Preference & Discount Rate
 * 											- "function transaction_FieldChanged(type, name, linenum)"
 * 											- "function updateSalesPreference(custform)"
 * 											- "function insertSelectOption_SalesPreference(season)"
 * 										Updated "function transaction_PageInit(type)"
 * 											- To call "updateSalesPreference(reqDate)" 
 * 										Updated "function setDiscountedPrice()"
 * 											- To use form level field value('custpage_discount_rate') to calculate discount in line item
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
function transaction_FieldChanged(type, name, linenum){
	var custForm = nlapiGetFieldValue('customform');
	var custID = nlapiGetFieldValue('entity');
	if(custID && (name == 'startdate' || name == 'saleseffectivedate')){	
		if(name == 'startdate' ){
			var reqDate = nlapiGetFieldValue('startdate');
		}
		else{
			var reqDate = nlapiGetFieldValue('saleseffectivedate');
		}	
		if(reqDate){
			if((custForm == '210' || custForm == '224') && name == 'startdate'){// 210 = RMP Sales Order GOE, 224 = *RMP Estimate
				insertSelectOption_SalesPreference(custID, nlapiStringToDate(reqDate).getFullYear());
			}
			else if(custForm == '211' &&name == 'saleseffectivedate' ){// 211 = RMP Return Authorisation - Credit
				insertSelectOption_SalesPreference(custID, nlapiStringToDate(reqDate).getFullYear());
			}
		}
	}
	if(name == 'custpage_sales_preference'){
		if(custForm == '210' || custForm == '211' || custForm == '224'){// 210 = RMP Sales Order GOE, 211 = RMP Return Authorisation - Credit, 224 = *RMP Estimate
			var salesPref 		= nlapiGetFieldValue('custpage_sales_preference');
			if(salesPref){
				var salesPrefValues	= nlapiLookupField('customrecord_sales_preferences',salesPref,['custrecord_sp_department', 'custrecord_sp_sales_rep' , 'custrecord_sp_discount_rate']);
				nlapiSetFieldValue('custbody_so_sales_pref', salesPref);
				nlapiSetFieldValue('department', salesPrefValues['custrecord_sp_department']);
				nlapiSetFieldValue('salesrep', salesPrefValues['custrecord_sp_sales_rep']);
				nlapiSetFieldValue('custpage_discount_rate', salesPrefValues['custrecord_sp_discount_rate']);
			}		
		}
	}
}


function insertSelectOption_SalesPreference(custid, season){
	var schFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F'),  //Is not Inactive
	                  new nlobjSearchFilter('custrecord_sp_customer', null, 'is', custid),  // Same customer
	                  new nlobjSearchFilter('custrecord_sp_season', null, 'equalto', season)]; // Same season
	var schColoumns = [new nlobjSearchColumn('internalid'), 
	                   new nlobjSearchColumn('name')];
	var schResults = nlapiSearchRecord('customrecord_sales_preferences', null, schFilters , schColoumns);		
	nlapiRemoveSelectOption('custpage_sales_preference');
	nlapiInsertSelectOption('custpage_sales_preference','','');
	for (var i in schResults){
		nlapiInsertSelectOption('custpage_sales_preference',schResults[i].getValue('internalid'),schResults[i].getValue('name'), false);
	}
}


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function transaction_PageInit(type){
	var splitFrom_ID	= nlapiGetFieldValue('custbody_so_split_from_id');
	var custForm = nlapiGetFieldValue('customform');
	var reqDate = nlapiGetFieldValue('saleseffectivedate');
	if(type=='create' && !isNULL(splitFrom_ID)){
		updateSplitOrder(splitFrom_ID); // Auto populate fields using field values from parent sales order - RMP on hold order
	}
	if(type == 'copy' && custForm == '138'){// 138 = *SFT Organisation Invoice AU, copy due to converting Sales Order to Invoice	
		updateOrganisationInvoice(); // Set default values on invoice if it's for Organisation Sales Order(AU) with Parent/Child relationship
	}
	if(isNULL(nlapiGetFieldValue('custbody_so_installer'))){// Subsidiary validation is in function	updateInstaller() as it's called from other function.			
		updateInstaller();
	}
	if(!nlapiGetFieldValue('custpage_sales_preference') && custForm == '211' && reqDate){// 211 = RMP Return Authorisation - Credit
		// Updating Sales Preference & Discount Rate when created from Sales Order
		// UE script cannot be used as Sales Effective Date will not populate in beforeload call
		updateSalesPreference(reqDate);
	}		
}


function updateSalesPreference(reqdate){
	// Add selection list to Sales Preference (form level)
	insertSelectOption_SalesPreference(nlapiGetFieldValue('entity'), nlapiStringToDate(reqdate).getFullYear());
	var salesPref_current = nlapiGetFieldValue('custbody_so_sales_pref');
	if(salesPref_current){ // Set default values on form level field if Sales Preference (Transaction Body field) is not empty
		nlapiSetFieldValue('custpage_sales_preference', salesPref_current);
		nlapiSetFieldValue('custpage_discount_rate', nlapiLookupField('customrecord_sales_preferences',salesPref_current,'custrecord_sp_discount_rate'));
	} 
}


// Keeping copy of previous version, disabled as Edit is too slow in client script, UE will be used instead
/*function updateSalesPreference_old(custform){
	if(custform == '211'){ // 211 = RMP Return Authorisation - Credit
		var reqDate = nlapiGetFieldValue('saleseffectivedate');
	}
	else{
		var reqDate = nlapiGetFieldValue('startdate');
	}
	if(reqDate){
		// Add selection list to Sales Preference (form level)
		insertSelectOption_SalesPreference(nlapiStringToDate(reqDate).getFullYear());
		var salesPref_current = nlapiGetFieldValue('custbody_so_sales_pref');
		if(salesPref_current){ // Set default values on form level field if Sales Preference (Transaction Body field) is not empty
			nlapiSetFieldValue('custpage_sales_preference', salesPref_current);
			nlapiSetFieldValue('custpage_discount_rate', nlapiLookupField('customrecord_sales_preferences',salesPref_current,'custrecord_sp_discount_rate'));
		} 
	}
}*/


function updateSplitOrder(splitFrom_ID){
	var parentRec = nlapiLoadRecord('salesorder', splitFrom_ID);
	if(parentRec){				
		var shipTo = parentRec.getFieldValue('shipaddresslist');	
		if(shipTo){
			nlapiSetFieldValue('shipaddresslist', shipTo, true, true);
		}
		var billTo = parentRec.getFieldValue('billaddresslist');	
		if(billTo){
			nlapiSetFieldValue('billaddresslist', billTo, true, true);
		}		
		nlapiSetFieldValue('custbody_so_split_from', splitFrom_ID);
	}
}

function updateInstaller(){	
	var subSidiary = nlapiGetFieldValue('subsidiary');
	// NOTE: Please add required roles in Install Post Code > Permissions
	if(subSidiary == '4' || subSidiary == '3' /*|| subSidiary == '1' || subSidiary == '5'*/  ){ //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2  
		var postCode = getPostCode_Client();		
		if(!isNULL(postCode)){
			nlapiSetFieldValue('custbody_so_installer', getInstaller(postCode));// Update Installer field even no one is assigned
		}
	}
}

function updateOrganisationInvoice(){
	var custRec = nlapiGetFieldValue('entity');
	var childRec = nlapiLookupField('customer', custRec, 'parent');
	if(!isNULL(childRec)){// Customer is child of other Customer record.	
		nlapiSetFieldValue('entity', childRec, true, true); // Assign Child as Customer	
		nlapiSetFieldValue('custbody_child_name', custRec, true, true); // Assign Customer as Child	
		var salesOrder = nlapiLoadRecord('salesorder', nlapiGetFieldValue('createdfrom'));
		var shipCost;
		var installCost;		
		for(var i = 1; i<=salesOrder.getLineItemCount('item'); i++){
			if(salesOrder.getLineItemValue('item', 'item', i) == '4272'){// 4272 = "SH Shipping"
				shipCost = salesOrder.getLineItemValue('item', 'amount', i);
			}		
			if(salesOrder.getLineItemValue('item', 'item', i) == '4274'){// 4274 = "Install Trampoline"
				installCost = salesOrder.getLineItemValue('item', 'amount', i);
			}
		}
		var totalLine = nlapiGetLineItemCount('item');	
		for(var j = 1; j<=totalLine ; j++){		
			nlapiSelectLineItem('item', j);					
			if(nlapiGetCurrentLineItemValue('item', 'item') == '4272'){// 4272 = "SH Shipping"
				nlapiSetCurrentLineItemValue('item', 'rate', shipCost);
			}		
			else if(nlapiGetCurrentLineItemValue('item', 'item') == '4274'){// 4274 = "Install Trampoline"
				nlapiSetCurrentLineItemValue('item', 'rate', installCost);
			}			
			nlapiCommitLineItem('item');
		}	
		nlapiSetFieldValue('salesrep', salesOrder.getFieldValue('salesrep')); //Copy "Sales Rep" from Sales Order
		nlapiSetFieldValue('custbodycustbody_referralsource', salesOrder.getFieldValue('custbodycustbody_referralsource')); //Copy "MARKETING CHANNEL REFERRAL" from Sales Order
		nlapiSetFieldValue('billaddress', salesOrder.getFieldValue('billaddress')); //Copy "Bill To" from Sales Order
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function transaction_PostSourcing(type, name) {
	var tranType = nlapiGetRecordType();
	if(tranType == 'salesorder' || tranType == 'estimate'){
		if(type == 'item' && name == 'item'){  
			updateDeReCharge(); // Set default value for "Reassembly" and "Disassembly" same as installation cost per zone
		}
		else if(name == 'shipaddress'){//Post Sourcing is used instead of Field Changed to support the change of customer record(i.e. create Sales Order then select Customer record)			
			updateInstaller(); // Update Installer field using installer in install group custom record		
		}
	}
}

function updateDeReCharge(){// Set default value for "Reassembly" and "Disassembly" same as installation cost per zone
	var installGroup = nlapiGetFieldValue('custbody_install_group');
	var itemID = nlapiGetCurrentLineItemValue('item', 'item');
	var subSidiary = nlapiGetFieldValue('subsidiary');
	var isValidSub = false;
	if(subSidiary == '5'){ //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2  
		isValidSub = true;
	}	
	if(isValidSub && !isNULL(installGroup) && (itemID == '594' || itemID == '1327')){//594 = "Reassembly", 1327 = "Disassembly"
		var itemRate = nlapiLookupField('customrecord_install_group', installGroup, 'custrecord_ig_cost'); //Search installation cost for current installation zone
		nlapiSetCurrentLineItemValue('item', 'rate', itemRate);		
	}								
}


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to save line item, false to abort save
 */
function transaction_ValidateLine(type){
	var custForm = nlapiGetFieldValue('customform');
	if((custForm == '201' || custForm == '210' || custForm == '224' || custForm == '211') && type == 'item'){// 201 = RMP Sales Order, 210 = RMP Sales Order GOE, 224 = *RMP Estimate, 211 = RMP Return Authorisation - Credit
		setDiscountedPrice();	
	}
    return true;
}

function setDiscountedPrice(){	
	var salesPreference = nlapiGetFieldValue('custbody_so_sales_pref');
	var priceLevel		= nlapiGetCurrentLineItemValue('item', 'price');
	var applyDiscount	= false;
	var parentRec		= nlapiGetFieldValue('custbody_so_split_from');	
	// Use 'custpage_discount_rate' form level field value to calculate discount on line item
	var discountRate = nlapiGetFieldValue('custpage_discount_rate');
	if(discountRate && parseFloat(discountRate) > 0){ // Discount rate is not 0%
		applyDiscount = true;
	}
	// Keeping copy of previous version
/*	var discountRate;
	if(salesPreference){
		discountRate = nlapiLookupField('customrecord_sales_preferences', salesPreference, 'custrecord_sp_discount_rate');		
		if(!isNULL(discountRate) && parseFloat(discountRate) > 0){ // Discount rate is not 0%
			applyDiscount = true;
		}
	}*/
	if(priceLevel != '-1' && priceLevel != '16' && applyDiscount){ // Price Level (Base = 1, Whole Sale = 2 , Custom = -1, Close Out = 16)	
		var currentAmount = nlapiGetCurrentLineItemValue('item', 'amount');
		nlapiSetCurrentLineItemValue('item', 'price', priceLevel); // Reset Price Level to get original value
		if(nlapiGetCurrentLineItemValue('item', 'rate') == 0){ // If there is no price set up in item then keep original price entered manually
			nlapiSetCurrentLineItemValue('item', 'amount', currentAmount); 
		}
		else{
			nlapiSetCurrentLineItemValue('item', 'rate', getPercentageDiscount(nlapiGetCurrentLineItemValue('item', 'rate'),discountRate));
		}								
	}
	if(parentRec){
		nlapiSetCurrentLineItemValue('item', 'orderpriority', '1'); // Set Order Priority = 1 for Split Order to get priority on commitment
	}
}