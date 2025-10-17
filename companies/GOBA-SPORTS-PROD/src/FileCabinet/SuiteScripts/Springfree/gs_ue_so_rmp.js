/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     12-09-17	Eric.Choe		Created "function updateSplitOrder(splitFrom_ID, rec_id)"
 * 											### Known limitations/issues ###
 * 												- When line item is closed, total balance won't be updated
 * 												- If there is multiple lines for same item, it won't calculate correctly
 * 													- Parent Order
 * 														Item 1, 100
 * 														Item 1, 100
 * 													- Split Order
 * 														Item 1, 200
 * 													After save parent order still has 2nd line open with 100
 * 														Item 1, 100 => closed
 * 														Item 1, 100
 *
 * 2.00		31-10-17	Eric.Choe		Created "function setDiscount(rec_id)"
 * 
 * 2.01		13-11-17	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)" 
 * 											- To be triggered by "Core Sports" subsidiary
 * 
 * 2.02		29-11-17	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)"
 * 											- To be triggered by "Cancel"
 * 											- To be triggered by scheduled script
 * 
 * 2.10		10-01-18	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)"
 * 											- To add error handling code 
 * 										Created "function setFillRateDiscount(rec_id)"
 * 											- To be triggered by Sales Order created by CSV import
 * 
 * 2.11		16-01-18	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)"
 * 											- To recalculate fill rate if created by user interface
 * 											- To be triggered by CSV import - update
 * 
 * 2.12		18-01-18	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)"
 * 											- To be triggered by Suitelet (i.e. celigo integrator for shopify orders)
 * 
 * 2.13		09-02-18	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)"
 * 											- To restructure coding logic
 * 												- "Cancel" is removed from trigger condition (i.e. Not "Close" but "Cancel" if status is "Pending Approval"
 * 											- To be triggered by
 * 												- "mapreduce", and
 * 												- "Update Fill Rate" checkbox is checked only (Performance improvement with Robbie's script)
 * 											- To remove "scheduled" as setFillRate(recID, false, false) will be called from scheduled script directly
 * 										Updated "function setDiscount(rec_id)"
 * 											- To exclude new price level - "Close Out"
 * 
 * 2.14		14-02-18	Eric.Choe		Created "function updateCustomer()"
 * 											- To be triggered by Shopify integration/"suitelet"
 * 
 * 2.15		04-04-18	Eric.Choe		Created "function setDefaults_BeforeSubmit(type)"
 * 											- To take priority on Robie's Map/Reduce script (Sales Order - User Event)
 *
 * 2.16		10-04-18	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)"
 * 											- To be triggered by Web Services (i.e. Costco.ca orders)
 * 
 * 3.0.0	15-06-18	Eric.Choe		Created following new functions to set form level field values - Sales Preference & Discount Rate
 * 											- "function setDefaults_BeforeLoad(type, form, request)"
 * 											- "function createSalesPreference(custform)"
 * 
 * 3.0.1	19-10-18	Eric.Choe		Updated following function to be triggered by "CSV Import" only for Estimate
 * 											- "function setDiscount(rec_id)"
 * 			
 * 3.0.2	01-10-19	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)"
 * 											- Added AUDIT log to monitor script execution context								
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
	if(isUI()){
		if(type == 'create' || type == 'edit' || type == 'copy'){
			var custForm = nlapiGetFieldValue('customform');	
			if(custForm == '210' || custForm == '211' || custForm == '224'){// 210 = RMP Sales Order GOE, 211 = RMP Return Authorisation - Credit, 224 = *RMP Estimate
				// Create form level fields to improve performance on sourcing/default value 
				createSalesPreference(custForm);
				nlapiLogExecution('DEBUG', 'setDefaults_BeforeLoad', 'createSalesPreference - Executed : ' + type + ' : ' + nlapiGetRecordType() + ' : ' + nlapiGetRecordId());
			}
		}
	}
}


function createSalesPreference(custform){
	// Create form level fields - Sales Preference & Discount Rate
	var salesPref = form.addField('custpage_sales_preference', 'select', 'Sales Preference');
	var discRate  = form.addField('custpage_discount_rate', 'percent', 'Discount Rate');
	form.insertField(salesPref, 'custbody_so_sales_pref');
	form.insertField(discRate, 'department');
	salesPref.setMandatory(true);
	discRate.setDisplayType('inline');
	//Hide Sales Preference - Transaction Body field
	form.getField('custbody_so_sales_pref').setDisplayType('hidden');
	var salesPref_current = nlapiGetFieldValue('custbody_so_sales_pref');
	// Load default values for edit or copy (Note: PageInit call from client script is too slow)
	if(type == 'edit' || salesPref_current){		
		if(custform == '211'){ // 211 = RMP Return Authorisation - Credit
			var reqDate = nlapiGetFieldValue('saleseffectivedate');
		}
		else{
			var reqDate = nlapiGetFieldValue('startdate');
		}
		// Add selection list to Sales Preference (form level)
		if(reqDate){
			var custID = nlapiGetFieldValue('entity');		
			var schFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F'),  //Is not Inactive
			                  new nlobjSearchFilter('custrecord_sp_customer', null, 'is', custID),  // Same customer
			                  new nlobjSearchFilter('custrecord_sp_season', null, 'equalto', nlapiStringToDate(reqDate).getFullYear())]; // Same season
			var schColoumns = [new nlobjSearchColumn('internalid'), 
			                   new nlobjSearchColumn('name'),
			                   new nlobjSearchColumn('custrecord_sp_discount_rate')];
			var schResults = nlapiSearchRecord('customrecord_sales_preferences', null, schFilters , schColoumns);		
//			nlapiLogExecution('debug', 'debug', 'salesPref_current : ' + salesPref_current);		
			for (var i in schResults){
				var currentRec = schResults[i].getValue('internalid');
				var defaultValue = false;
				// Set default value for form level fields - Sales Preference & Discount Rate
//				nlapiLogExecution('debug', 'debug', i +'th record : ' + currentRec + ' ' + schResults[i].getValue('name'));
				if(currentRec == salesPref_current){
					defaultValue = true;
					discRate.setDefaultValue(schResults[i].getValue('custrecord_sp_discount_rate'));
				}
				salesPref.addSelectOption(currentRec, schResults[i].getValue('name'), defaultValue);
			}
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
	if((type == 'create'||type == 'edit'||type == 'approve')){				
		try{
			var recSubsidiary	= nlapiGetFieldValue('subsidiary');							
			if(recSubsidiary == '9'||recSubsidiary == '10'){ //9 = RMP Athletic, 10 = Core Sports
				var logTitle	= 'setDefaults_BeforeSubmit';	
				var logDetails 	=  nlapiGetContext().getExecutionContext() + ' ' + type;
				nlapiLogExecution('DEBUG', logTitle, logDetails);
			} 
		}catch(ex){
			var processMssg = 'Processing Estimate/Sales Order \n';
			var errorStr 	= ex.toString();
			if (ex instanceof nlobjError){
				errorStr = getErrorMessage(ex);
			}						
			nlapiLogExecution('ERROR', 'setDefaults_BeforeSubmit', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
		}
	}
}


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
	if((type == 'create'||type == 'edit'||type == 'approve')){				
		try{			
			var recSubsidiary	= nlapiGetFieldValue('subsidiary');
			var logTitle		= 'setDefaults_AfterSubmit';						
			if(recSubsidiary == '9'||recSubsidiary == '10'){ //9 = RMP Athletic, 10 = Core Sports
				var splitFrom_ID 		= nlapiGetFieldValue('custbody_so_split_from_id');	
				var orderStatus			= nlapiGetFieldText('orderstatus'); // Note: 'status' will return NULL in creation so we cannot use that field.	
				var orderStatus_RMP		= nlapiGetFieldValue('custbody_order_status');
				var extContext			= nlapiGetContext().getExecutionContext();		
				var recID				= nlapiGetRecordId();
				var recType				= nlapiGetRecordType();
				var custForm 			= nlapiGetFieldValue('customform');
				var update_ShipDate		= false;
				var logDetails			= 'setFillRate - Entering : ' + extContext + ' ' + type + ' ' + recType + ' '+ recID;

				nlapiLogExecution('AUDIT', 'Execution Context', 'Execution Context = '+ extContext + ' : ' + 'type = ' + type + ' : ' + 'recType = ' + nlapiGetRecordType() + ' : '  + 'recID = ' + nlapiGetRecordId());

				// Sales Order flow
				if(custForm == '201' || custForm == '210' || custForm == '229'){// 201 = RMP Sales Order, 210 = RMP Sales Order GOE, 229 = RMP Sales Order - Shopify												
					if((type == 'create'||type == 'edit'||type == 'approve') && extContext == 'userinterface'){
						if(type == 'edit'){// Check if Required Date has changed
							var oldRec				= nlapiGetOldRecord();	
							var newRec				= nlapiGetNewRecord();
							if(oldRec.getFieldValue('startdate') != newRec.getFieldValue('startdate')){ // Check if Required Date has changed
								update_ShipDate = true;
							}
						}
						// Split order flow - update fill rate in parent/split orders and deduct qty from parent order
						if(!isNULL(splitFrom_ID) && isNULL(orderStatus_RMP) && (orderStatus == 'Pending Fulfillment' || type == 'approve')){// Status changed by Edit or Approve button
							nlapiLogExecution('DEBUG', logTitle, 'updateSplitOrder - Entering');
							updateSplitOrder(splitFrom_ID, recID, update_ShipDate); 							
						}
						else{
							nlapiLogExecution('DEBUG', logTitle, logDetails);
							setFillRate(recID, false, update_ShipDate);
							if(type == 'create'){
								setFillRate(recID, false, update_ShipDate); //16-01-18 Re-calculate fill rate due to defect
							}
						}
					}					
					else if((type == 'create') && (extContext == 'suitelet' || extContext == 'csvimport' || extContext == 'webservices')){
						nlapiLogExecution('DEBUG', logTitle, logDetails);
						setFillRate(recID, false, update_ShipDate); // Calculate fill rate
						if(extContext == 'suitelet'){
							updateCustomer(); // Check if this is a duplicate customer from different Shopify store
						}					
					}				
					else if((type == 'edit') && (extContext == 'csvimport'||extContext == 'mapreduce'/*||extContext == 'scheduled'*/)){				
						if(extContext == 'mapreduce' && nlapiGetFieldValue('custbody_updatefillrate') == 'T'){
							nlapiLogExecution('DEBUG', logTitle, logDetails);
							setFillRate(recID, false, update_ShipDate); // Calculate fill rate
						}
						else if(extContext == 'csvimport'){
							nlapiLogExecution('DEBUG', logTitle, logDetails);
							var oldRec = nlapiGetOldRecord();	
							var newRec = nlapiGetNewRecord();
							if(oldRec.getFieldValue('startdate') != newRec.getFieldValue('startdate')){ // Check if Required Date has changed
								update_ShipDate = true;
							}
							setFillRate(recID, false, update_ShipDate); // Calculate fill rate
						}
					}
				}			
				//Estimate flow
				else if(type=='create' && custForm == '224' && extContext == 'csvimport'){// 224 = *RMP Estimate	
					nlapiLogExecution('DEBUG', 'DEBUG', 'setDiscount - Entering : ' + extContext + ' ' + type + ' ' + recType + ' '+ recID);
					setDiscount(recID); 				
				}			
			}
		}catch(ex){
			var processMssg = 'Processing Estimate/Sales Order \n';
			var errorStr 	= ex.toString();
			if (ex instanceof nlobjError){
				errorStr = getErrorMessage(ex);
			}						
			nlapiLogExecution('ERROR', 'setDefaults_AfterSubmit', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
		}
	}				
}


function updateCustomer(){ 	
	var shopifyStore_Order = nlapiGetFieldValue('custbody_celigo_shopify_store');	
	if(shopifyStore_Order){
		var email_Order				= nlapiGetFieldValue('email');
		var gss_Order				= nlapiGetFieldValue('custbodycustbody_addonremarks');
		var custID					= nlapiGetFieldValue('entity');	
		var custRec					= nlapiLoadRecord('customer', custID);
//		var shopifyStore_Customer	= custRec.getFieldValue('custentity_celigo_shopify_store').split(','); => cannot use it as data is returning as record value
		var shopifyStore_Customer	= nlapiLookupField('customer', custID,'custentity_celigo_shopify_store').split(',');
		var email_Customer			= custRec.getFieldValue('email');
		var gss_Customer			= custRec.getFieldValue('globalsubscriptionstatus');
		var updateCustomer			= false;
		// If this order is created from different Shopify store with same customer details
		if(shopifyStore_Customer.indexOf(shopifyStore_Order) == -1){ 
			// Update "Shopify Store" list in customer record
			updateCustomer = true;
			shopifyStore_Customer.push(shopifyStore_Order);
			custRec.setFieldValue('custentity_celigo_shopify_store', shopifyStore_Customer);				
			// Create new sublist("Celigo Shopify Customer Id Map") in customer record 
			var shopifyCustomerIdMap = nlapiCreateRecord('customrecord_celigo_shopify_shpfnsidmap');
			shopifyCustomerIdMap.setFieldValue('custrecord_celigo_shpf_scim_nsid', custID);
			shopifyCustomerIdMap.setFieldValue('custrecord_celigo_shpf_scim_shpfid', nlapiGetFieldValue('custbody_notesspecialrequests'));
			shopifyCustomerIdMap.setFieldValue('custrecord_celigo_shpf_scim_shpfstore', shopifyStore_Order);
			nlapiSubmitRecord(shopifyCustomerIdMap, true, true);
			nlapiLogExecution('AUDIT', 'updateCustomer', 'New Shopify Store "' + nlapiGetFieldText('custbody_celigo_shopify_store') + '" is added in customer record ' + custID);
		}
		// If email has changed in Shopify since last order
		if(email_Order && email_Customer != email_Order){
			updateCustomer = true;
			custRec.setFieldValue('email', email_Order);
			nlapiLogExecution('AUDIT', 'updateCustomer', 'New email "' + email_Order + '" is updated in customer record ' + custID);
		}
		// If "Customer accepts email marketing" option in Shopify has changed since last order
		if(gss_Order && gss_Customer != gss_Order){
			updateCustomer = true;
			custRec.setFieldValue('globalsubscriptionstatus', gss_Order);
			nlapiLogExecution('AUDIT', 'updateCustomer', 'New Global Subscription Status "' + custRec.getFieldText('globalsubscriptionstatus') + '" is updated in customer record ' + custID);
		}
		if(updateCustomer){
			nlapiSubmitRecord(custRec, true, true);
			nlapiLogExecution('AUDIT', 'updateCustomer', 'Shopify customer record ' + custID + ' is updated successfully');
		}
	}
}


function updateSplitOrder(splitfrom_id, rec_id, update_shipdate){
	try{		
		if(splitfrom_id){
			var parentRec = nlapiLoadRecord('salesorder', splitfrom_id);			
			if(parentRec){				
				var totalLineItem 			= nlapiGetLineItemCount('item');				
				var parent_TotalLineItem 	= parentRec.getLineItemCount('item');															
				// Check all line items in Split Order to match against Parent Order
				for(var i = 1; i<=totalLineItem ; i++){					
					nlapiSelectLineItem('item', i);
					var currentItemID	= nlapiGetCurrentLineItemValue('item', 'item');				
					var currentItemQty	= nlapiGetCurrentLineItemValue('item', 'quantity');
					var isInactive 		= nlapiGetCurrentLineItemValue('item', 'isclosed');
					if(isInactive == 'F'){// If it's not inactive item												
						for(var j = 1; j<=parent_TotalLineItem; j++){ // Find matching item in parent record and deduct quantity						
							parentRec.selectLineItem('item', j); // Get current line item from parent record to compare
							
							if(parentRec.getCurrentLineItemValue('item', 'item') == currentItemID && parentRec.getCurrentLineItemValue('item', 'isclosed') == 'F'){							
								var newQuantity = parentRec.getCurrentLineItemValue('item', 'quantity') - currentItemQty;								
								if(newQuantity > 0){ // Deduct quantity from Parent order						
									parentRec.setCurrentLineItemValue('item', 'quantity', newQuantity); 
								}
								else{// Close line item line if it will be fully fulfilled by current Split Order
									parentRec.setCurrentLineItemValue('item', 'isclosed', 'T');
								}							
								parentRec.commitLineItem('item', false);// Commit & Recalculate total amount 
							}
						}
					}							
				}						
				nlapiSubmitRecord(parentRec,false,true); // Submit changes on parent record and ignore sourcing & mandatory fields	
				setFillRate(rec_id, true, update_shipdate); // Update Fill Rate on Split Order
				setFillRate(splitfrom_id, false, false); // Update Fill Rate on Parent Order (Note. Must be recalculated as stock levels are updated by Split Order)		
				nlapiLogExecution('AUDIT', 'AUDIT', 'updateSplitOrder - Executed : Parent Order = ' + splitfrom_id + ' : Split Order = ' + rec_id);								
			}
			else{
				nlapiLogExecution('ERROR', 'updateSplitOrder', 'Cannot find Parent Sales Order : ' + splitfrom_id + ' : Split Order = ' + rec_id);
			}
		}	
	}catch(ex){
		var processMssg = 'Processing Split Order \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}						
		nlapiLogExecution('ERROR', 'updateSplitOrder', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}	
}


function setDiscount(rec_id){
	var recType			= nlapiGetRecordType();
	var curRec 			= nlapiLoadRecord(recType, rec_id);
	var totalLineItem	= curRec.getLineItemCount('item');
	var salesPref_ID	= curRec.getFieldValue('custbody_so_sales_pref');
	
	try{
		if(salesPref_ID){
			var salesPref	= nlapiLoadRecord('customrecord_sales_preferences', salesPref_ID);			
			var discRate	= salesPref.getFieldValue('custrecord_sp_discount_rate');
			var dePartment	= salesPref.getFieldValue('custrecord_sp_department');
			var salesRep	= salesPref.getFieldValue('custrecord_sp_sales_rep');
			
			if(!isNULL(discRate) && parseFloat(discRate) > 0){
				for(var i = 1; i<=totalLineItem; i++){		
					curRec.selectLineItem('item', i); // Get current line item				
					var priceLevel	= curRec.getCurrentLineItemValue('item', 'price');	
					if(priceLevel != '-1' && priceLevel != '16'){ // Calculate discount if it has sales preference with discount rate and price level is not "Custom" or "Close Out"		
						curRec.setCurrentLineItemValue('item', 'rate', getPercentageDiscount(curRec.getCurrentLineItemValue('item', 'rate'), discRate));
						curRec.commitLineItem('item', false);// Commit & recalculate total amount					
					}			
				}
				nlapiLogExecution('DEBUG', 'DEBUG', 'Discount applied - ' + discRate + ' : ' + recType + ' : ' + rec_id);
			}
			else{
				nlapiLogExecution('DEBUG', 'DEBUG', 'Discount not applied - 0% : ' + recType + ' : ' + rec_id);
			}
			curRec.setFieldValue('department', dePartment);
			curRec.setFieldValue('salesrep', salesRep);		
			nlapiSubmitRecord(curRec);
			nlapiLogExecution('AUDIT', 'AUDIT', 'setDiscount - Executed  : ' + recType + ' : ' + rec_id);
		}
		else{
			nlapiLogExecution('ERROR', 'setDiscount', 'Record created without Sales Preference' + recType + ' : ' + rec_id);
		}			
	}catch(ex){
		var processMssg = 'Processing Estimate created by CSV Import \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}	
		nlapiLogExecution('ERROR', 'setDiscount', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}	
}


function setFillRateDiscount(rec_id){ // On Hold for now
	
}