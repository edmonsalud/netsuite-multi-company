/**
 * Module Description
 * 
 * Version  Date		Author          Remarks
 * 1.00     20-01-16	eric.choe		
 * 2.00		13-10-16	Eric.Choe		Added "setDefaults_AfterSubmit" function 
 * 2.01		22-11-16	Eric.Choe		Added "Start Date" in setDefaults_AfterSubmit" function
 * 										Updated DEBUG descriptions 
 * 2.0.2	28-02-17	Eric.Choe		Updated "setDefaults_BeforeLoad" function
 * 											- Show "Mobile Phone" for AU/NZ
 * 											- Show "Shipping Address" for AU
 * 2.0.3	30-03-17	Eric.Choe		Updated "function setDefaults_AfterSubmit"
 * 											- Remove
 * 												Clearance call out fee
 *												Slope - 3 degrees
 *												Removal of rubbish and debris
 *												Confirm all items delivered
 *												Spare Parts delivery
 *												Access
 *												Parking
 *												Accessories - Disassembly only
 *												Boxes - Disassembly
 *											- Add
 *												Please Call On Approach
 * 2.1.0	19-04-17	Eric.Choe		Updated "function setDefaults_BeforeLoad"
 * 											- For NZ to include "NOTES/SPECIAL REQUESTS" in message 
 * 										Installation checklist script will be triggered for NZ as well
 * 											- Updated preferred Event form(SFT - AU Installation Form) for NZ roles
 * 											- Enabled "SO - Installation Checklist" in following transaction forms 
 * 												- *SFT Sales Order (Web Store) NZ
 * 												- *SFT Sales Order (Part Pay OR on Inv) NZ
 * 											- Enabled "SO - Installation Checklist" in PDF form
 * 												- SFT-NZ: Picking Ticket
 * 2.2.0	15-08-17	Eric.Choe		Updated "function setDefaults_BeforeLoad"
 * 											- To use Suitelet to get dynamic URL for Sales Order / Return Authorization
 * 											- To include Return Authorization
 * 										Added error handling functions
 * 2.2.0	06-04-17	Eric.Choe		Updated "function setDefaults_BeforeLoad"
 * 											- To include following service items
 * 												- 86160 = AU Service to Fit (parts)
 * 												- 86161 = AU Service to Fit (Frame or Sleeves)
 * 												- 86162 = AU Service - Goodwill
 * 2.2.1	25-09-18	Eric.Choe		Updated nlapiLogExecution() with correct function name
 * 2.2.2	14-08-19	Eric.Choe		Updated "function setDefaults_AfterSubmit()" to pass Installation Booking Date to sales order
 * 2.2.3	11-03-20	Eric.Choe		Updated internal id "custbody4" => "custbody_install_date_external" (i.e. Installation Date External)
 * 2.3.0	23-06-20	Eric.Choe		Updated "function setDefaults_AfterSubmit()"
 * 											- To disable install checklist logic  for NZ
 * 											- To pass following install checklist values only for AU
 * 												- Compliant Space
 *  											- Pets
 *    											- Steps
 *      										- Quantity of Steps
 *   											- Access Details & Install Location
 *   											- Please Call on Approach
 *   											- Additional Details
 * 2.3.1	30-06-20	Eric.Choe		Updated "function setDefaults_AfterSubmit()" to pass following install checklist values only for NZ
 * 											- Booking Date
 * 2.3.2	03-08-20	Eric.Choe		Updated "function setDefaults_AfterSubmit()"
 * 											- To add extra questions for Yard Service for NZ
**/

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
	var tranID = nlapiGetFieldValue('transaction');
	try{
		if(type == 'create' && tranID != null && isUI()){ 			
			var subsidiary = nlapiLookupField('transaction', tranID, 'subsidiary'); //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2			
			// ################## Need to update Workflow - "Event:New:SetDefault" if any changes made with subsidiary ##################			
			if(subsidiary == '1'||subsidiary == '5'||subsidiary == '3'||subsidiary == '4'){ 			
				var tranType = nlapiLookupField('transaction', tranID, 'recordtype');				
				if(tranType == 'salesorder' || tranType == 'returnauthorization'){ 					
					var tranNumber = nlapiLookupField('transaction', tranID, 'tranid');					
					var recURL		= nlapiResolveURL('RECORD', tranType, tranID);
					var domainURL	= nlapiRequestURL(nlapiResolveURL('SUITELET','customscript_sl_ns_url','customdeploy_sl_ns_url',true)).getBody();;					
					nlapiLogExecution('DEBUG', 'URL', domainURL+recURL);
					nlapiLogExecution('DEBUG', 'recURL', recURL);					
					var eventMessage = '<a href="'+ domainURL + recURL + '">' + tranNumber + '</a>' + '<br>';									
					var eventTitle; 						
					var tranRecord = nlapiLoadRecord(tranType, tranID);
					var totalLine = tranRecord.getLineItemCount('item');
					var currentItem;
					var currentItemType;
					var currentItemClass;
                    var currentItemModel;	
					var invDetailSubrecord ;										
					var trampModel = '';
					var serviceType = 'Delivery'; // By default Delivery is used if there is no other service item			
					var trampCount = 0;
					var serviceCount = 0;
					var isYardService = false;
					// Search any trampoline or service item included in Sales Order
					for(var i=1; i<=totalLine; i++){		
						tranRecord.selectLineItem('item', i);
						currentItem = tranRecord.getCurrentLineItemValue('item', 'item');
						currentItemType = nlapiLookupField('item', currentItem, 'type');
						currentItemClass = nlapiLookupField('item', currentItem, 'class');
						currentItemModel = nlapiLookupField('item', currentItem, 'custitem_noninventory_model');
                      
						if(currentItemType == 'Kit' && currentItemClass == '1'|| currentItemType == 'Group' && currentItemClass == '1' || currentItemType == 'Assembly' && currentItemClass == '1' && currentItemModel != ''){ // 1 = Trampolines 							
							if(trampCount == 0){
								trampModel = nlapiLookupField('item', currentItem, 'itemid');
							}
							else {
								trampModel = trampModel + ', ' + nlapiLookupField('item', currentItem, 'itemid');						
							}
							trampCount++;
						}						
						else if(currentItemType == 'Service' && (currentItemClass == '11' || currentItem == '86160' || currentItem == '86161' || currentItem == '86162')){ // 11 = Services : Install
							if(serviceCount == 0){
								serviceType = nlapiLookupField('item', currentItem, 'itemid');						
							}
							else {
								serviceType = serviceType + ' & ' + nlapiLookupField('item', currentItem, 'itemid'); // E.g. Alternative options : 'displayname' , 'salesdescription'  
							}
							serviceCount++;
							if(currentItem == '1911'){// 1911 = Yardserv
								isYardService = true;
							}
						}						
					}
					// Add service type in event title field
					eventTitle = serviceType 
					+ ' : ' + tranRecord.getFieldValue('shipaddressee') 
					+ ' : ' + tranRecord.getFieldValue('shipcity');
					// Add trampoline model in event title field, if any
					if(trampCount > 0){
						eventTitle = eventTitle + ' : ' + trampModel;
					}					
					var custID = nlapiGetFieldValue('company');
					var mobilePhone = nlapiLookupField('customer', custID, 'mobilephone');
					//Add Mobile Phone and Address for AU/NZ
					if(subsidiary == '1'||subsidiary == '5'){					
						eventMessage = eventMessage + 'Mobile : ' + mobilePhone;						
						if(subsidiary == '1'){//AU
							eventMessage = eventMessage + '<br>'
							+ 'Shipping Address : ' + tranRecord.getFieldValue('shipaddress') + '<br>';
						}
						else{ //NZ
							eventMessage = eventMessage + '<br>' 
							+ 'From : ' + tranRecord.getFieldValue('billaddress') + '<br>'
							+ 'To : ' + tranRecord.getFieldValue('shipaddress') + '<br>' + '<br>'
							+ 'NOTES/SPECIAL REQUESTS : ' + tranRecord.getFieldValue('custbody_notesspecialrequests') + '<br>';
							if(isYardService){// Add extra questions for Yard Service
								eventMessage = eventMessage + '<br>' 
								+ 'Specific Model Customer looking at?' + '<br>'
								+ 'Concerns about space?' + '<br>'
								+ 'Preferred spot for Trampoline?' + '<br>'
								+ 'Will customer be home?' + '<br>'
								+ 'If not at home is a gate code required?' + '<br>'
								+ 'Any Pets we need to be aware of?' + '<br>';
							}
						}
					}	
nlapiLogExecution('DEBUG', eventTitle)					
					nlapiSetFieldValue('message', eventMessage, false, true);
					nlapiSetFieldValue('title', eventTitle, false, true);	
					nlapiSetFieldValue('location', tranNumber, false, true);						
					nlapiLogExecution('DEBUG', 'Create Event', 'Sales Order : ' + tranID + ' ' + tranNumber + ' / Event Title : '  + eventTitle);					
				}						
			}		
		}
	}catch(ex){
		var processMssg	= 'Error encountered while processing Event created from SO/RA \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'setDefaults_BeforeLoad', processMssg  + ' ' +  errorStr);
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

	var tranID = nlapiGetFieldValue('transaction');
	try{
		if(tranID != null && isUI()){ 			
			var subsidiary = nlapiLookupField('transaction', tranID, 'subsidiary'); //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2			
			// ################## Need to update Workflow - "Event:New:SetDefault" if any changes made with subsidiary ##################			
			if(subsidiary == '1'||subsidiary == '5'||subsidiary == '3'||subsidiary == '4'){ 			
				var tranType = nlapiLookupField('transaction', tranID, 'recordtype');				
				if(tranType == 'salesorder' || tranType == 'returnauthorization'){ 					
					var tranNumber = nlapiLookupField('transaction', tranID, 'tranid');					
					var recURL		= nlapiResolveURL('RECORD', tranType, tranID);
					var domainURL	= nlapiRequestURL(nlapiResolveURL('SUITELET','customscript_sl_ns_url','customdeploy_sl_ns_url',true)).getBody();;					
					nlapiLogExecution('DEBUG', 'URL', domainURL+recURL);
					nlapiLogExecution('DEBUG', 'recURL', recURL);					
					var eventMessage = '<a href="'+ domainURL + recURL + '">' + tranNumber + '</a>' + '<br>';									
					var eventTitle; 						
					var tranRecord = nlapiLoadRecord(tranType, tranID);
					var totalLine = tranRecord.getLineItemCount('item');
					var currentItem;
					var currentItemType;
					var currentItemClass;
                    var currentItemModel;	
					var invDetailSubrecord ;										
					var trampModel = '';
					var serviceType = 'Delivery'; // By default Delivery is used if there is no other service item			
					var trampCount = 0;
					var serviceCount = 0;
					var isYardService = false;
					// Search any trampoline or service item included in Sales Order
					for(var i=1; i<=totalLine; i++){		
						tranRecord.selectLineItem('item', i);
						currentItem = tranRecord.getCurrentLineItemValue('item', 'item');
						currentItemType = nlapiLookupField('item', currentItem, 'type');
						currentItemClass = nlapiLookupField('item', currentItem, 'class');
                        currentItemModel = nlapiLookupField('item', currentItem, 'custitem_noninventory_model');
						if(currentItemType == 'Kit' && currentItemClass == '1' || currentItemType == 'Group' && currentItemClass == '1' || currentItemType == 'Assembly' && currentItemClass == '1' && currentItemModel != ''){ // 1 = Trampolines 							
							if(trampCount == 0){
								trampModel = nlapiLookupField('item', currentItem, 'itemid');
							}
							else {
								trampModel = trampModel + ', ' + nlapiLookupField('item', currentItem, 'itemid');						
							}
							trampCount++;
						}						
						else if(currentItemType == 'Service' && (currentItemClass == '11' || currentItem == '86160' || currentItem == '86161' || currentItem == '86162')){ // 11 = Services : Install
							if(serviceCount == 0){
								serviceType = nlapiLookupField('item', currentItem, 'itemid');						
							}
							else {
								serviceType = serviceType + ' & ' + nlapiLookupField('item', currentItem, 'itemid'); // E.g. Alternative options : 'displayname' , 'salesdescription'  
							}
							serviceCount++;
							if(currentItem == '1911'){// 1911 = Yardserv
								isYardService = true;
							}
						}						
					}
					// Add service type in event title field
					eventTitle = serviceType 
					+ ' : ' + tranRecord.getFieldValue('shipaddressee') 
					+ ' : ' + tranRecord.getFieldValue('shipcity');
					// Add trampoline model in event title field, if any
					if(trampCount > 0){
						eventTitle = eventTitle + ' : ' + trampModel;
					}					
					var custID = nlapiGetFieldValue('company');
					var mobilePhone = nlapiLookupField('customer', custID, 'mobilephone');
					//Add Mobile Phone and Address for AU/NZ
					if(subsidiary == '1'||subsidiary == '5'){					
						eventMessage = eventMessage + 'Mobile : ' + mobilePhone;						
						if(subsidiary == '1'){//AU
							eventMessage = eventMessage + '<br>'
							+ 'Shipping Address : ' + tranRecord.getFieldValue('shipaddress') + '<br>';
						}
						else{ //NZ
							eventMessage = eventMessage + '<br>' 
							+ 'From : ' + tranRecord.getFieldValue('billaddress') + '<br>'
							+ 'To : ' + tranRecord.getFieldValue('shipaddress') + '<br>' + '<br>'
							+ 'NOTES/SPECIAL REQUESTS : ' + tranRecord.getFieldValue('custbody_notesspecialrequests') + '<br>';
							if(isYardService){// Add extra questions for Yard Service
								eventMessage = eventMessage + '<br>' 
								+ 'Specific Model Customer looking at?' + '<br>'
								+ 'Concerns about space?' + '<br>'
								+ 'Preferred spot for Trampoline?' + '<br>'
								+ 'Will customer be home?' + '<br>'
								+ 'If not at home is a gate code required?' + '<br>'
								+ 'Any Pets we need to be aware of?' + '<br>';
							}
						}
					}	
				
				
				
				}						
			}		
		}
	}catch(ex){
		var processMssg	= 'Error encountered while processing Event created from SO/RA \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	}


	
	try{	
		if(isUI() && type != 'delete' && !isNULL(nlapiGetFieldValue('transaction')) && nlapiGetFieldValue('customform') == '131'){// 131 = "SFT - AU Installation Form"
			var tranID = nlapiGetFieldValue('transaction');
			var tranType = nlapiLookupField('transaction', tranID, 'recordtype');			
			if(tranType == 'salesorder'){//Related transaction type is Sales Order
				var tranSubsidiary		= nlapiLookupField('transaction', tranID, 'subsidiary');
				var installDate			= nlapiGetFieldValue('startdate'); // Event Start Date
				var installCheckList 	= 'Date Confirmed : ' + installDate + '<br>';	
				if(tranSubsidiary == '1'||subsidiary == '5'){// AU = 1, US = 3, CA = 4, NZ = 5, Global = 2													
					var compliantSpace	= nlapiGetFieldValue('custevent_compliant_space'); // Compliant Space
					var peTs			= nlapiGetFieldValue('custevent23'); // Pets												
					var stEps			= nlapiGetFieldValue('custevent26'); // Steps				
					var qtySteps		= nlapiGetFieldValue('custevent_qty_of_steps'); // Quantity of Steps
					var accessDetails	= nlapiGetFieldValue('custevent_access_install_details'); // Access Details & Install Location					
					var callonApproach  = nlapiGetFieldValue('custevent_event_call_on_approach'); // Please Call On Approach	
					var deTails			= nlapiGetFieldValue('custevent_details'); // Details																				
					if(compliantSpace == 'T'){
						installCheckList += '\n' + 'Compliant Space : Yes' + '<br>';
					}
					else{
						installCheckList += '\n' + 'Compliant Space : No' + '<br>';
					}										
					if(peTs == 'T'){
						installCheckList += '\n' + 'Pets : Yes' + '<br>';
					}
					else{
						installCheckList += '\n' + 'Pets : No' + '<br>';
					}					
					if(stEps == 'T'){
						installCheckList += '\n' + 'Steps : Yes' + '<br>';
					}
					else{
						installCheckList += '\n' + 'Steps : No' + '<br>';
					}					
					if(qtySteps){
						installCheckList += '\n' + 'Quantity of Steps : ' + qtySteps + '<br>';						
					}
					if(accessDetails){
						installCheckList += '\n' + 'Access Details & Install Location : ' + accessDetails + '<br>';						
					}								
					if(callonApproach == 'T'){
						installCheckList += '\n' + 'Please Call On Approach : Yes' + '<br>';
					}
					else{
						installCheckList += '\n' + 'Please Call On Approach : No' + '<br>';
					}
					if(deTails){
						installCheckList += '\n' + 'Additional Details : ' + deTails + '<br>';						
					}					
					nlapiSubmitField('salesorder', tranID, 'custbody_so_install_checklist',installCheckList);//Update "SO - Installation Checklist" in linked Sales Order
					nlapiLogExecution('DEBUG', 'Update Install CheckList', 'Sales Order : ' + tranID + ' ' + nlapiLookupField('salesorder', tranID, 'tranid') + ' / Event ID : ' + nlapiGetRecordId());	
					
				}
			}		
		}
		if(isUI() && type != 'delete' && !isNULL(nlapiGetFieldValue('transaction')) && nlapiGetFieldValue('customform') == '244'){// 244 = "SFT - NZ Installation Form"
		
		var tranID = nlapiGetFieldValue('transaction');
			var tranType = nlapiLookupField('transaction', tranID, 'recordtype');			
			if(tranType == 'salesorder'){//Related transaction type is Sales Order
				var tranSubsidiary		= nlapiLookupField('transaction', tranID, 'subsidiary');
				var installDate			= nlapiGetFieldValue('startdate'); // Event Start Date
				var installCheckList 	= 'Date Confirmed : ' + installDate + '<br>';	
				if(tranSubsidiary == '5'){// AU = 1, US = 3, CA = 4, NZ = 5, Global = 2
					nlapiSubmitField('salesorder', tranID, 'custbody_install_date_external',installDate); //Update "Installation Date External" in linked Sales Order
					nlapiLogExecution('DEBUG', 'Update Installation Booking Date', 'Sales Order : ' + tranID + ' ' + nlapiLookupField('salesorder', tranID, 'tranid') + ' / Event ID : ' + nlapiGetRecordId());											
					var compliantSpace	= nlapiGetFieldValue('custevent_compliant_space'); // Compliant Space
					var peTs			= nlapiGetFieldValue('custevent23'); // Pets												
					var stEps			= nlapiGetFieldValue('custevent26'); // Steps				
					var qtySteps		= nlapiGetFieldValue('custevent_qty_of_steps'); // Quantity of Steps
					var accessDetails	= nlapiGetFieldValue('custevent_access_install_details'); // Access Details & Install Location					
					var callonApproach  = nlapiGetFieldValue('custevent_event_call_on_approach'); // Please Call On Approach	
					var deTails			= nlapiGetFieldValue('custevent_details'); // Details			
                  	var clearance		= nlapiGetFieldValue('custevent_1metre_clearance'); // 1 Metre Clearance
                  	var freeObstructions= nlapiGetFieldValue('custevent_free_obstructions'); // Free From Obstructions
                  	var flatSurface		= nlapiGetFieldValue('custevent_flat_surface'); // Flat Surface
					if(compliantSpace == 'T'){
						installCheckList += '\n' + 'Compliant Space : Yes' + '<br>';
					}
					else{
						installCheckList += '\n' + 'Compliant Space : No' + '<br>';
					}										
					if(peTs == 'T'){
						installCheckList += '\n' + 'Pets : Yes' + '<br>';
					}
					else{
						installCheckList += '\n' + 'Pets : No' + '<br>';
					}					
					if(stEps == 'T'){
						installCheckList += '\n' + 'Steps : Yes' + '<br>';
					}
					else{
						installCheckList += '\n' + 'Steps : No' + '<br>';
					}					
					if(qtySteps){
						installCheckList += '\n' + 'Quantity of Steps : ' + qtySteps + '<br>';						
					}
					if(accessDetails){
						installCheckList += '\n' + 'Access Details & Install Location : ' + accessDetails + '<br>';						
					}								
					if(callonApproach == 'T'){
						installCheckList += '\n' + 'Please Call On Approach : Yes' + '<br>';
					}
					else{
						installCheckList += '\n' + 'Please Call On Approach : No' + '<br>';
					}
					if(deTails){
						installCheckList += '\n' + 'Additional Details : ' + deTails + '<br>';	
                    }								
					if(clearance == 'T'){
						installCheckList += '\n' + '1 Metre Clearance : Yes' + '<br>';
					}
					else{
						installCheckList += '\n' + '1 Metre Clearance : No' + '<br>';
                    }								
					if(freeObstructions == 'T'){
						installCheckList += '\n' + 'Free From Obstructions : Yes' + '<br>';
					}
					else{
						installCheckList += '\n' + 'Free From Obstructions : No' + '<br>';
                    }								
					if(flatSurface == 'T'){
						installCheckList += '\n' + 'Flat Surface : Yes' + '<br>';
					}
					else{
						installCheckList += '\n' + 'Flat Surface : No' + '<br>';
					}
					
					var finalMessage = eventMessage
					finalMessage += installCheckList
					
					var eventId = nlapiGetRecordId();
					nlapiSubmitField('calendarevent', eventId, 'message', finalMessage);
					nlapiSubmitField('salesorder', tranID, 'custbody_so_install_checklist',installCheckList);//Update "SO - Installation Checklist" in linked Sales Order
					nlapiLogExecution('DEBUG', 'Update Install CheckList', 'Sales Order : ' + tranID + ' ' + nlapiLookupField('salesorder', tranID, 'tranid') + ' / Event ID : ' + nlapiGetRecordId());
				}
			}
		}
	}catch(ex){
		var processMssg	= 'Error encountered while processing Installation Check List in SO \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'setDefaults_AfterSubmit', processMssg  + ' ' +  errorStr);
	}
	
}