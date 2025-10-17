/**
 * Module Description
 * 
 * Version  Date        Author          Remarks
 * 1.00		07-07-16	Eric.Choe		Library file is created with following functions
 * 											- function isNULL(valueStr)
 * 											- function isUI()
 * 											- function getDateDiff(date1, date2)
 * 											- function getUserSub()
 * 											- function getEntityTypeID(entityName)
 * 											- function checkGovernance()
 * 											- Utils.getErrorMessage
 * 
 * 2.00		29-05-17	Eric.Choe		Following functions are created
 * 											- function getPostCode() : For UE script
 * 											- function getPostCode_Client() : For Client script
 * 											- function getFeightZone(postCode)
 * 											- function getInstallGroup(postCode)
 *  										- function getInstaller(postCode)
 *  
 * 2.01		10-08-17	Eric.Choe		Following function is created
 * 											- function convertToUserTimeZone()
 * 
 * 2.02		05-10-17	Eric.Choe		Following functions are created
 * 											- function getErrorMessage(ex)
 * 											- function getPercentageDiscount(price,percentrate)
 * 											- function setFillRate(id, issplitorder)
 * 
 * 2.03		08-11-17	Eric.Choe		Updated "function setFillRate(id, issplitorder)"
 * 											- To exclude item which does not commit stock
 * 
 * 2.10		11-12-17	Eric.Choe		Updated "function setFillRate(id, issplitorder)" 
 * 											- To update expected ship date in line items
 * 
 * 2.11		22-01-18	Eric.Choe		Updated "function getPostCode()"
 * 											- To remove white space in post code
 * 
 * 2.12		09-02-18	Eric.Choe		Updated "function setFillRate(id, issplitorder, updateshipdate)"
 * 											- To include new parameter - updateshipdate
 * 											- To round fill rate to 2 decimals only
 *  
 * 2.13		22-02-18	Eric.Choe		Updated "function setFillRate(id, issplitorder, updateshipdate)"
 * 											- To count Quantity Picked as Quantity Shipped when calculating fill rate
 * 
 * 2.20		27-02-18	Eric.Choe		Updated "function setFillRate(id, issplitorder, updateshipdate)"
 * 											- To handle Sales Order contains more than 1000 line items
 * 
 * 2.20		02-03-18	Eric.Choe		Updated "function setFillRate(id, issplitorder, updateshipdate)"
 * 											- To set new fields - "Quantity Committed", "Quantity Remaining"
 * 
 * 2.20		05-04-18	Eric.Choe		Updated "function getPostCode()"
 * 											- To search post code without "State"(i.e. City) for NZ 
 * 
 * 2.21		15-06-18	Eric.Choe		Updated "function setFillRate(id, issplitorder, updateshipdate)"
 * 											- To set new field - "Quantity Picked"
 * 
 * 2.30		27-08-18	Eric.Choe		Updated "function setFillRate(id, issplitorder, updateshipdate)"
 * 											- To set new field - "Total Value / custbody_totalvalue"
 * 
 * 2.31		10-09-18	Eric.Choe		Updated "function setFillRate(id, issplitorder, updateshipdate)"
 * 											- To use 'linesequencenumber' instead of 'line' for searching line items
 * 
 * 2.31		29-01-18	Eric.Choe		Updated following function to remove "shipstate" field in search filter & convert country code into internal id
 * 											- function getPostCode()
 * 											- function getPostCode_Client()
 * 										Created following function to get internal id of country
 * 											- function getCountryID(countrycode)
 * 
 * 2.41		26-03-19	Eric.Choe		Created following function to check execution time left for scheduled script
 * 											- function checkTimeElapsed(start_time)
 * 
 * 2.42		04-03-20	Eric.Choe		Updated following function to use Suitelet to bypass permission restriction on install postcode
 * 											- function getInstaller(postCode)
 * 			
 */


function getCountryID(countrycode){
	try{
		if(countrycode){
			var countryID = nlapiRequestURL(nlapiResolveURL('SUITELET','customscript_gs2_sl_countryid','customdeploy_gs2_sl_countryid','external') + '&req_countrycode=' + countrycode).getBody();;			
			if(countryID == 'No Matching Record'){
				return 0;
			}
			else{
				return countryID;
			}
		}
		else {
			return 0;
		}
	}catch(ex){
		var processMssg = 'processing Country ID \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
		nlapiLogExecution('Error', 'setFillRate', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}
}


function getErrorMessage(ex){// To return full details of error message
	var stackTrace	= ex.getStackTrace();
	var errorMssg	= 'Error Code : ' + ex.getCode() + '\n' 
						+ 'Details : ' + ex.getDetails() + '\n'
						+ 'Record ID : ' + ex.getInternalId() + '\n';	
	for(var i=0; i<stackTrace.length; i++){
		errorMssg += stackTrace[i] + '\n';
	}
	return errorMssg
}


function getPercentageDiscount(price,rate){// i.e. Price = 19.99, rate = 5%
	var discountedPrice = ((100 - parseFloat(rate)) / 100 ) * price;
	return discountedPrice;	
}


function setFillRate(id, issplitorder, updateshipdate){	
	try{
		var extContext			= nlapiGetContext().getExecutionContext();
		var curRec 				= nlapiLoadRecord('salesorder', id);
		var qtyOrdered			= 0;
		var qtyOrdered_Left		= 0;
		var qtyCommitted		= 0;
		var qtyCommitted_Left	= 0;
		var qtyFulfilled		= 0;
		var qtyPicked			= 0; // Note: Picked or Packed are not supported from record browser for scripting
		var fillRate			= 0;
		var totalValue			= 0;
		var startDate			= curRec.getFieldValue('startdate');		
		if(issplitorder){
			curRec.setFieldValue('custbody_order_status', '1');
		}			
		// Calculate Fill Rate here
		var totalLineItem	= curRec.getLineItemCount('item');		
		for(var i = 1; i<=totalLineItem; i++){		
			curRec.selectLineItem('item', i); // Get current line item			
			var isCommitting = curRec.getCurrentLineItemValue('item', 'commitinventory');	
			if(curRec.getCurrentLineItemValue('item', 'isclosed') == 'F' && isCommitting){ // Line item is not inactive/closed and it's a committing item 
				qtyOrdered 		+= parseInt(curRec.getCurrentLineItemValue('item', 'quantity'));
				qtyCommitted	+= parseInt(curRec.getCurrentLineItemValue('item', 'quantitycommitted'));
				qtyFulfilled	+= parseInt(curRec.getCurrentLineItemValue('item', 'quantityfulfilled'));
			}		
			if(startDate && (isNULL(curRec.getCurrentLineItemValue('item', 'expectedshipdate')) || updateshipdate)){ // Expected Ship Date is not set up or Required Date has changed
				curRec.setCurrentLineItemValue('item', 'expectedshipdate', startDate);
				curRec.commitLineItem('item', true);// Commit & do not recalculate total amount 
			}
		}		
		curRec.setFieldValue('custbody_so_qty_shipped', qtyFulfilled);
		curRec.setFieldValue('custbody_so_qty_ordered', qtyOrdered);
		if((qtyOrdered - qtyFulfilled) != 0){ // If there are items left to ship
			// Using nlapiSearchRecord to get Quantity Picked as it is not available in record browser for scripting
			var startLine			= 1;
			var endLine				= 1000;
			var qty_Line			= 0;
			var qtyPicked_Line		= 0;
			var qtyPickedLeft_Line	= 0;
			var totalAmount			= 0;
			var totalTax			= 0;
			var exchageRate			= 0;			
			do{ // Due to limitation of nlapiSearchRecord which returns 1000 rows as maximum
				var pickedItemList = nlapiSearchRecord('salesorder', null, 
						  [new nlobjSearchFilter('internalid', null, 'anyOf', id), 
						   new nlobjSearchFilter('taxline', null, 'is', 'F'), 
						   new nlobjSearchFilter('commit', null, 'noneof', '@NONE@'), 
						   new nlobjSearchFilter('closed', null, 'is', 'F'), 
						   new nlobjSearchFilter('linesequencenumber', null, 'greaterthanorequalto', startLine),
						   new nlobjSearchFilter('linesequencenumber', null, 'lessthanorequalto', endLine)], 
						  [new nlobjSearchColumn('quantity'),
						   new nlobjSearchColumn('quantitypicked'),
						   new nlobjSearchColumn('quantitypacked'),
						   new nlobjSearchColumn('amount'), // Total line item amount
						   new nlobjSearchColumn('taxamount'), // Total line item tax
						   new nlobjSearchColumn('fxamount')] // Total line item amount in foreign currency (i.e. CA)
						   );
				for(var i in pickedItemList){
					qty_Line			= parseInt(pickedItemList[i].getValue('quantity'));
					qtyPicked_Line		= parseInt(pickedItemList[i].getValue('quantitypicked'));
					qtyPickedLeft_Line	= parseInt(qtyPicked_Line - pickedItemList[i].getValue('quantitypacked'));
					totalAmount			= parseFloat(pickedItemList[i].getValue('amount'));
					totalTax			= parseFloat(pickedItemList[i].getValue('taxamount'));
					exchageRate			= parseFloat(pickedItemList[i].getValue('fxamount')/totalAmount);					
					qtyPicked			+= qtyPicked_Line; // Sum total picked quantities					
					totalValue			+= parseFloat((totalAmount+totalTax)*exchageRate*qtyPickedLeft_Line/qty_Line); // Sum total value of picked quantities
				}
				startLine	+= 1000;
				endLine		+= 1000;
			}while(startLine<=totalLineItem)
			if((qtyOrdered - qtyPicked) > 0){ // If there are items left to pick
				qtyOrdered_Left 	= qtyOrdered - qtyPicked;
				qtyCommitted_Left	= qtyCommitted - qtyPicked + qtyFulfilled;
				fillRate 			= Math.round((qtyCommitted_Left / qtyOrdered_Left) *10000) /100; // Rounding to 2 digits only
			}
			qtyPicked -= qtyFulfilled; // Get picked item qty, currently waiting for fulfillment
		}
		totalValue = Math.round(totalValue*100)/100; // Rounding to 2 digits only
		curRec.setFieldValue('custbody_totalvalue', totalValue);
		curRec.setFieldValue('custbody_so_qty_picked', qtyPicked);			
		curRec.setFieldValue('custbody_so_qty_remaining', qtyOrdered_Left);
		curRec.setFieldValue('custbody_so_qty_committed', qtyCommitted_Left);
		curRec.setFieldValue('custbody_so_fill_rate', fillRate);
		nlapiSubmitRecord(curRec,false,true); // Ignore sourcing & mandatory fields
		nlapiLogExecution('AUDIT', 'setFillRate', extContext + ' : ' + type 
												  + ' : Sales Order ID = ' + id + ' : Split Order = ' + issplitorder 
												  + ' : Update Ship Date = ' + updateshipdate + ' : Fill Rate = ' + fillRate 
												  + '% : qtyOrdered = ' + qtyOrdered + ' : qtyOrdered_Left = ' + qtyOrdered_Left
												  + ' : qtyCommitted = ' + qtyCommitted + ' : qtyCommitted_Left = ' + qtyCommitted_Left 
												  + ' : qtyPicked = ' + qtyPicked + ' : qtyFulfilled = ' + qtyFulfilled
												  + ' : totalValue = ' + totalValue
												  + ' : Usage Remaining = ' + nlapiGetContext().getRemainingUsage());
	}catch(ex){
		var processMssg = 'Processing Fill Rate \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
		nlapiLogExecution('Error', 'setFillRate', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}
}


function convertToUserTimeZone() {// Return current date & time following user's time zone 
	var currentDateTime = new Date();
	var userTimeZone = nlapiLoadConfiguration('userpreferences').getFieldText('timezone');
	var timeZoneOffSet = (userTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(userTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
	var UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
	var userDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
	
	return new Date(userDateTime);
}


function getPostCode(){
	/************************************* KNOWN ISSUE with State field ***********************************
	 * 
	 * It seems like State is not used in search filter properly, it'll accept any value except NULL
	 * 
	 ******************************************************************************************************/ 
	
	try{
		var processMssg 	= 'Searching for Post Code';
		var postCode		= "";
		var ship_City 		= "";
		var ship_State 		= "";
		var ship_Postcode 	= "";
		var ship_Country	= "";
		var exeContext 		= nlapiGetContext().getExecutionContext(); 
		var recType 		= nlapiGetRecordType();
		var recID 			= nlapiGetRecordId();
		var recSubsidiary	= "";
		var isCustomer		= false;
		nlapiLogExecution('DEBUG', 'getPostCode', 'Record ID & Type : ' + recID + ' ' + recType);
		
		var curRec		= nlapiLoadRecord(recType, recID);					
		ship_City 		= curRec.getFieldValue('shipcity');				
		ship_State 		= curRec.getFieldValue('shipstate');
		ship_Postcode 	= curRec.getFieldValue('shipzip');
		if(ship_Postcode){
			ship_Postcode = ship_Postcode.replace(/ /g,''); // Remove white space - 22/01/18
			nlapiLogExecution('DEBUG', 'DEBUG', 'shipzip = ' + ship_Postcode);
		}
		
		ship_Country	= curRec.getFieldValue('shipcountry');
		recSubsidiary	= curRec.getFieldValue('subsidiary');
			
		if(recType == 'lead' || recType == 'prospect' || recType == 'customer'){
			isCustomer = true;
		}
		
		nlapiLogExecution('DEBUG', 'getPostCode', 'Shipping Address : ' + recID + ' ' + recType + ' ' + ship_City + ' ' + ship_State + ' ' + ship_Postcode + ' ' + ship_Country);			

		if(isNULL(ship_City) && isNULL(ship_State) && isNULL(ship_Postcode) && isCustomer){//Use billing address if there is no default shipping address (i.e. Lead from Online Customer Form)
			ship_City 		= curRec.getFieldValue('billcity');				
			ship_State 		= curRec.getFieldValue('billstate');
			ship_Postcode 	= curRec.getFieldValue('billzip');
			if(ship_Postcode){
				ship_Postcode = ship_Postcode.replace(/ /g,''); // Remove white space - 22/01/18
				nlapiLogExecution('DEBUG', 'DEBUG', 'billzip = ' + ship_Postcode);
			}
			ship_Country	= curRec.getFieldValue('billcountry');
			nlapiLogExecution('DEBUG', 'getPostCode', 'Use Billing Address : ' + ship_City + ' ' + ship_State + ' ' + ship_Postcode + ' ' + ship_Country);
		}
		else{
			nlapiLogExecution('DEBUG', 'getPostCode', 'Use Shipping Address : ' + ship_City + ' ' + ship_State + ' ' + ship_Postcode + ' ' + ship_Country);
		}
				
		ship_Country = getCountryID(ship_Country); // 29-01-19 Convert country code into internal id for searching 
		
		if(!isNULL(ship_City) && !isNULL(ship_State) && !isNULL(ship_Postcode) && !isNULL(ship_Country)){
			nlapiLogExecution('DEBUG', 'getPostCode', 'Shipping Address : ' + ship_City + ' ' + ship_State + ' ' + ship_Postcode + ' ' + ship_Country);
			var schFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F'),
				               new nlobjSearchFilter('custrecord_pc_post_code', null, 'is', ship_Postcode),
				               new nlobjSearchFilter('custrecord_pc_city_suburb', null, 'is', ship_City),
//				               new nlobjSearchFilter('custrecord_pc_state', null, 'is', ship_State), // 29-01-19 Remove shipstate from search filter
				               new nlobjSearchFilter('custrecord_pc_country', null, 'is', ship_Country)];	
			var schColoumns = [new nlobjSearchColumn('internalid')];			
			var schResults = nlapiSearchRecord('customrecord_post_code', null, schFilters, schColoumns);				
			if (!isNULL(schResults)){
				postCode = schResults[0].getValue('internalid');
			}
		}
		else if(!isNULL(ship_City) && !isNULL(ship_Postcode) && !isNULL(ship_Country) && (recSubsidiary == '1' || recSubsidiary == '5')){//For AU & NZ - excluding state field in search filter, //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2
			nlapiLogExecution('DEBUG', 'getPostCode', 'AU Shipping Address : ' + ship_City + ' ' + ship_State + ' ' + ship_Postcode + ' ' + ship_Country);			
			var schFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F'),
				               new nlobjSearchFilter('custrecord_pc_post_code', null, 'is', ship_Postcode),
				               new nlobjSearchFilter('custrecord_pc_city_suburb', null, 'is', ship_City),
				               new nlobjSearchFilter('custrecord_pc_country', null, 'is', ship_Country)];						
			var schColoumns = [new nlobjSearchColumn('internalid')];				
			var schResults = nlapiSearchRecord('customrecord_post_code', null, schFilters, schColoumns);				
			if (!isNULL(schResults)){
				postCode = schResults[0].getValue('internalid');
			}
		}
	}catch(ex){
		var errorStr = (ex.getCode() != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' : ex.toString();
        nlapiLogExecution('Error', 'getPostCode', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}
	return postCode;
}


function getPostCode_Client(){ // Client version	
	try{
		var processMssg = 'Searching for Post Code';
		var postCode = "";				
		var ship_City 		= nlapiGetFieldValue('shipcity');
		var ship_State 		= nlapiGetFieldValue('shipstate');
		var ship_Postcode 	= nlapiGetFieldValue('shipzip');
		var ship_Country	= nlapiGetFieldValue('shipcountry');				
		nlapiLogExecution('DEBUG', 'getPostCode_Client', 'Shipping Address : ' + ship_City + ' ' + ship_State + ' ' + ship_Postcode + ' ' + ship_Country);
		
		ship_Country = getCountryID(ship_Country); // 29-01-19 Convert country code into internal id for searching 		
		
		if(!isNULL(ship_City) && !isNULL(ship_State) && !isNULL(ship_Postcode) && !isNULL(ship_Country)){
			nlapiLogExecution('DEBUG', 'getPostCode', 'Shipping Address : ' + ship_City + ' ' + ship_State + ' ' + ship_Postcode + ' ' + ship_Country);			
			var schFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F'),
				               new nlobjSearchFilter('custrecord_pc_post_code', null, 'is', ship_Postcode),
				               new nlobjSearchFilter('custrecord_pc_city_suburb', null, 'is', ship_City),
//				               new nlobjSearchFilter('custrecord_pc_state', null, 'is', ship_State), // 29-01-19 Remove shipstate from search filter
				               new nlobjSearchFilter('custrecord_pc_country', null, 'is', ship_Country)];						
			var schColoumns = [new nlobjSearchColumn('internalid')];				
			var schResults = nlapiSearchRecord('customrecord_post_code', null, schFilters, schColoumns);				
			if (!isNULL(schResults)){
				postCode = schResults[0].getValue('internalid');
			}
		}	
	}catch(ex){
		var errorStr = (ex.getCode() != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' : ex.toString();
        nlapiLogExecution('Error', 'getPostCode_Client', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}
	return postCode;
}


function getFeightZone(postCode){
	try{
		var processMssg = 'Searching for Freight Zone';	
		var schFilters	= [new nlobjSearchFilter('isinactive', null, 'is', 'F'),
		                  new nlobjSearchFilter('custrecord_zpc_post_code', null, 'is', postCode)];					
		var schColoumns = [new nlobjSearchColumn('custrecord_zpc_zone')];			
		var schResults	= nlapiSearchRecord('customrecord_zone_post_code', null, schFilters, schColoumns);		
		var freightZone = "";
		
		if (!isNULL(schResults)){
			freightZone = schResults[0].getValue('custrecord_zpc_zone');
		}
	}catch(ex){
		var errorStr = (ex.getCode() != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' : ex.toString();
        nlapiLogExecution('Error', 'getFeightZone', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}
	return freightZone;
}


function getInstallGroup(postCode){
	try{
		var processMssg = 'Searching for Install Group';		
		var schFilters  = [new nlobjSearchFilter('isinactive', null, 'is', 'F'),
		                  new nlobjSearchFilter('custrecord_ipc_post_code', null, 'is', postCode)];				
		var schColoumns = [new nlobjSearchColumn('custrecord_ipc_install_grp')];			
		var schResults  = nlapiSearchRecord('customrecord_install_post_code', null, schFilters, schColoumns);		
		var installGroup = "";
		
		if (!isNULL(schResults)){
			installGroup = schResults[0].getValue('custrecord_ipc_install_grp');
		}
	}catch(ex){
		var errorStr = (ex.getCode() != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' : ex.toString();
        nlapiLogExecution('Error', 'getInstallGroup', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}
	return installGroup;
}

function getESRI(postCode){
	try{
		var processMssg = 'Searching for ESRI';		
		var schFilters  = [new nlobjSearchFilter('isinactive', null, 'is', 'F'),
		                  new nlobjSearchFilter('custrecord_ipc_post_code', null, 'is', postCode)];				
		var schColoumns = [new nlobjSearchColumn('custrecord_ipc_esri')];			
		var schResults  = nlapiSearchRecord('customrecord_install_post_code', null, schFilters, schColoumns);		
		var ESRI = "";
		
		if (!isNULL(schResults)){
			ESRI = schResults[0].getValue('custrecord_ipc_esri');
		}
	}catch(ex){
		var errorStr = (ex.getCode() != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' : ex.toString();
        nlapiLogExecution('Error', 'getESRI', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}
	return ESRI;
}

function getLifemodeSegment(postCode){
	try{
		var processMssg = 'Searching for Lifemode Segment';		
		var schFilters  = [new nlobjSearchFilter('isinactive', null, 'is', 'F'),
		                  new nlobjSearchFilter('custrecord_ipc_post_code', null, 'is', postCode)];				
		var schColoumns = [new nlobjSearchColumn('custrecord_ipc_lifemode')];			
		var schResults  = nlapiSearchRecord('customrecord_install_post_code', null, schFilters, schColoumns);		
		var LifemodeSegment = "";
		
		if (!isNULL(schResults)){
			LifemodeSegment = schResults[0].getValue('custrecord_ipc_lifemode');
		}
	}catch(ex){
		var errorStr = (ex.getCode() != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' : ex.toString();
        nlapiLogExecution('Error', 'getLifemodeSegment', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}
	return LifemodeSegment;
}

function getInstaller(postCode){
	var processMssg = 'Searching for Installer';	
	try{
		var insTaller = "";
		// Load Suitelet URL for searching installer
		var reqURL = nlapiResolveURL('SUITELET','customscript_gs2_sl_installer','customdeploy_gs2_sl_installer','external') + '&postcode=' + postCode;
		// Get installer
		var insTaller = nlapiRequestURL(reqURL).getBody();
		if(insTaller == "Not Found"){
			insTaller = "";
		}
		return insTaller;
	}catch(ex){
		var errorStr = (ex.getCode() != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n' : ex.toString();
        nlapiLogExecution('Error', 'getInstallGgetInstallerroup', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}
}


function isNULL(valueStr){ // Check "valueStr" is NULL or empty value
    return(valueStr == null || valueStr == "" || valueStr == undefined);
}


function isUI(){
	if(nlapiGetContext().getExecutionContext()=='userinterface'){
		return true;
	}
	else{
		return false;
	}
}


function getDateDiff(date1, date2) { // Return time difference in seconds
	var timeDiff = 0;	
    if(date1 != null){
    	timeDiff = Math.abs(date2.getTime() - date1.getTime());
    }  
    var diffDays = timeDiff / (3600 * 24 * 1000) ; // Get 1 day in seconds    
    return diffDays;
}


function getUserSub(){ //Return user's subsidiary as alphabet initial
	var subID = parseInt(nlapiGetSubsidiary());
	var userSub = "Not Matching";

	switch(subID){
		case 1:
			userSub = "AU";
			break;
			
		case 3:
			userSub = "US";
			break;

		case 4:
			userSub = "CA";
			break;

		case 5:
			userSub = "NZ";
			break;
	}
	
	return userSub;
}


function getEntityTypeID(entityName){ //Return Entity Type's ID 
	
	var entityID;

	switch(entityName){
		case "Customer" :
			entityID = 2;
			break;
			
		case "Vendor":
			entityID = 1;
			break;

		case "Contact" :
			entityID = 4;
			break;
			
		case "Employee":
			entityID = 3;
			break;
			
		case "Generic Resource" :
			entityID = 12;
			break;
			
		case "Group":
			entityID = 9;
			break;

		case "Other Name" :
			entityID = 5;
			break;
			
		case "Partner":
			entityID = 10;
			break;
			
		case "Project" :
			entityID = 6;
			break;
			
		case "Project Template":
			entityID = 13;
			break;

	}
	
	return entityID;
}


function checkTimeElapsed(start_time){// Checking execution time left for scheduled script	
	// https://netsuite.custhelp.com/app/answers/detail/a_id/68069/kw/SSS_TIME_LIMIT_EXCEEDED
	var endTime = new Date().getTime();
	//new Date().getTime() gets time in milliseconds therefore, convert time difference into seconds.
	var timeElapsed = (endTime - start_time)*0.001;
	nlapiLogExecution('DEBUG', 'TIME ELAPSED',timeElapsed);
	// yield script due to time limitation, 3600 seconds for scheduled script
	if(timeElapsed > 90){		
		var recPoint = nlapiYieldScript();
		var messageDetails = 'Reason: ' + recPoint.reason + ' Info: ' + recPoint.information + ' Size: ' + recPoint.size;		
		if(recPoint.status == 'FAILURE'){
			nlapiLogExecution('Error', 'SCRIPT_ERROR', 'Failed to yield script; exiting. ' + messageDetails);
			throw nlapiCreateError('SCRIPT_ERROR', 'Failed to yield script; exiting. ' + messageDetails);			
		}
		else if(recPoint.status == 'RESUME'){
			nlapiLogExecution('Audit', 'TIME_LIMIT_REACHED', 'Resuming script because of ' + messageDetails);
		}
	}
}


function checkGovernance(){//Checking Governance for scheduled script	
	var usageLeft = nlapiGetContext().getRemainingUsage();	
//	nlapiLogExecution('DEBUG', 'Check Goverance', 'usageLeft = ' + usageLeft);	
	if (usageLeft < 500){		
		var recPoint = nlapiYieldScript();
		var messageDetails = 'Reason: ' + recPoint.reason + ' Info: ' + recPoint.information + ' Size: ' + recPoint.size;		
		if(recPoint.status == 'FAILURE'){
			nlapiLogExecution('Error', 'SCRIPT_ERROR', 'Failed to yield script; exiting. ' + messageDetails);
			throw nlapiCreateError('SCRIPT_ERROR', 'Failed to yield script; exiting. ' + messageDetails);			
		}
		else if(recPoint.status == 'RESUME'){
			nlapiLogExecution('Audit', 'USAGE_LIMIT_REACHED', 'Resuming script because of ' + messageDetails);
		}
	}
}


var Utils = {};
Utils.getErrorMessage = function(ex){
	var errDetails = '';
	
	if (ex instanceof nlobjError) {
		errDetails = ex.getDetails();
	} else {
		var errorStr = ex.toString();
		var lblDetails = 'Details: ';
		var indexOf = errorStr.indexOf(lblDetails);
		if (indexOf >= 0) {
			errDetails = errorStr.substr(indexOf + lblDetails.length);	
		}
	}	
	return errDetails;
}