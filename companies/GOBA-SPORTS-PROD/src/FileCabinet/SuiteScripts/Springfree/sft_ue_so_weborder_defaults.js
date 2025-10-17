/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     14-03-16	Eric.Choe		
 * 
 * 2.00		11-05-17	Eric.Choe		Final version including Incomplete Web Order Validation & Price Level for US
 * 
 * 2.10		28-03-19	Eric.Choe		Updated "function setDefaults_AfterSubmit(type)" to add different logic for web order submitted by Springfree stuff at the event.
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
function setDefaults_AfterSubmit(type){
	var conText = nlapiGetContext();
	var exeContext = conText.getExecutionContext();	
	try{
//		if(type == 'edit' && exeContext == 'userinterface'){ // for testing, make it inactive when go live
		if(type == 'create' && exeContext == 'webstore'){			
			var salesOrder		= nlapiLoadRecord('salesorder', nlapiGetRecordId());
			var subSidiary		= salesOrder.getFieldValue('subsidiary');
			var webSite			= salesOrder.getFieldValue('source');
			var dealerHub_US	= conText.getSetting('SCRIPT', 'custscript_wo_us_dealer_source');			
			nlapiLogExecution('DEBUG', 'Check Point 1', type + ' ' + exeContext); 					
			if(webSite != dealerHub_US){ // For web orders except Dealer Hub					
				nlapiLogExecution('DEBUG', 'Check Point 2', webSite); 				
				if(subSidiary == '5' || subSidiary == '4' || subSidiary == '3' || subSidiary == '1'){ //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2   					
					nlapiLogExecution('DEBUG', 'Check Point 3', subSidiary); 					
					/*** Enhancement to check Incomplete Web Order 11-05-17 (Start) ***/
					var webstoreFlag		= salesOrder.getFieldValue('custbody_ps_webstore_process_flag'); 
					var pickLocation		= salesOrder.getFieldValue('custbody_web_default_warehouse_loc');
					var deliveryAvailable	= salesOrder.getFieldValue('custbody_delivery_available');
					var installAvailable	= salesOrder.getFieldValue('custbody_install_available');
					var installGroup		= salesOrder.getFieldValue('custbody_install_group');
					var orderStatus			= salesOrder.getFieldText('orderstatus');					
					if(orderStatus != 'Pending Billing'){//If it's not Gift Voucher only order
						if(webstoreFlag == 'F' || isNULL(pickLocation) || deliveryAvailable == 'F'){ 
							salesOrder.setFieldValue('custbody_incomplete_web_order', 'T');
						}
						else if(installAvailable == 'T' && isNULL(installGroup)){
							salesOrder.setFieldValue('custbody_incomplete_web_order', 'T');
						}
					}
					/*** Enhancement to check Incomplete Web Order 11-05-17 (End) ***/					
					var filteredCamp;
					var dePartment;
					var priceLevel;
					var salesRep		= conText.getSetting('SCRIPT', 'custscript_wo_sales_rep');
					var salesChannel	= conText.getSetting('SCRIPT', 'custscript_wo_sales_channel');	
					var channelReferal	= salesOrder.getFieldValue('custbodycustbody_referralsource');
					var altPhone		= salesOrder.getFieldValue('custbody_secondphone');
					var promoCode		= salesOrder.getFieldValue('promocode');	
					var postCode 		= getPostCode();
					var eventMarketID		= salesOrder.getFieldValue('custbody_so_event_market');				
					if(subSidiary == '5'){ // NZ variables, AU = 1, US = 3, CA = 4, NZ = 5, Global = 2   
						dePartment		= conText.getSetting('SCRIPT', 'custscript_wo_nz_department');
						filteredCamp	= conText.getSetting('SCRIPT', 'custscript_wo_nz_filtered_camp');
					}
					else if(subSidiary == '1'){//AU variables, AU = 1, US = 3, CA = 4, NZ = 5, Global = 2 
						dePartment		= conText.getSetting('SCRIPT', 'custscript_wo_au_department');
						filteredCamp	= conText.getSetting('SCRIPT', 'custscript_wo_au_filtered_camp');
					}
					else if(subSidiary == '3'){//US variables, AU = 1, US = 3, CA = 4, NZ = 5, Global = 2 
						dePartment		= conText.getSetting('SCRIPT', 'custscript_wo_us_department');
						filteredCamp	= conText.getSetting('SCRIPT', 'custscript_wo_us_filtered_camp');
						priceLevel		= conText.getSetting('SCRIPT', 'custscript_wo_us_price_level'); //Updating Price Level for US customers only
					}
					else if(subSidiary == '4'){//CA variables, AU = 1, US = 3, CA = 4, NZ = 5, Global = 2 
						dePartment		= conText.getSetting('SCRIPT', 'custscript_wo_ca_department');
						filteredCamp	= conText.getSetting('SCRIPT', 'custscript_wo_ca_filtered_camp');
					}
					nlapiLogExecution('DEBUG', 'Check Point 4', dePartment + ' ' + filteredCamp); 					
					/*** Enhancement on web order submitted by Springfree stuff at the event 28-03-19 (Start) ***/
					if(eventMarketID){
						// Load default field values for Event
						var eventMarket = nlapiLoadRecord('customrecord_event_market_list', eventMarketID);
						if(eventMarket){
							dePartment = eventMarket.getFieldValue('custrecord_em_department');
							filteredCamp = eventMarket.getFieldValue('custrecord_em_campaign');
							salesChannel = eventMarket.getFieldValue('custrecord_em_sales_channel');
							salesRep = eventMarket.getFieldValue('custrecord_em_sales_rep');
						}
						nlapiLogExecution('DEBUG', 'Check Point 4-1', dePartment + ' ' + filteredCamp); 				
					}
					/*** Enhancement on web order submitted by Springfree stuff at the event 28-03-19 (End) ***/					
					if(!isNULL(promoCode)){ // If there is a linked campaign in promotion,									
						var linkedCamp = nlapiLookupField('promotioncode', promoCode, 'custrecord_linked_campaign');						
						if(!isNULL(linkedCamp)){				
							filteredCamp = linkedCamp;					
						}
					}					
					nlapiLogExecution('DEBUG', 'Check Point 6', dePartment + ' ' + filteredCamp);					
					if(!isNULL(postCode)){
						salesOrder.setFieldValue('custbody_so_installer', getInstaller(postCode));// Update Installer field even no one is assigned 	
					}					
					salesOrder.setFieldValue('department', dePartment);
					salesOrder.setFieldValue('custbody_sp_filtered_campaign_source', filteredCamp);
					salesOrder.setFieldValue('leadsource', filteredCamp);							
					salesOrder.setFieldValue('salesrep', salesRep);
					salesOrder.setFieldValue('custbody_salessource', salesChannel);							
					nlapiSubmitRecord(salesOrder, false, true); //Submit sales order record and ignore mandatory fields & sourcing					
					// Updating customer record
					var updatedCustInfo; //Update required for Customer record
					var custRec 			= nlapiLoadRecord('customer', salesOrder.getFieldValue('entity'));
					var filteredCamp_cust 	= custRec.getFieldValue('custentity_sp_filtered_campaign_source');
					var dePartment_cust 	= custRec.getFieldValue('custentity_customer_department');
					var channelReferal_cust = custRec.getFieldValue('custentity_lead_source_class');
					var salesRep_cust 		= custRec.getFieldValue('salesrep');					
					var freightZone_cust 	= custRec.getFieldValue('custentity_freight_zone');
					var installGroup_cust	= custRec.getFieldValue('custentity_install_group');
					var freightZone			= "";
					var installGroup		= "";					
					if(!isNULL(postCode)){// Search Freight ZOne & Install Group if there is a matching post code
						freightZone			= getFeightZone(postCode);
						installGroup		= getInstallGroup(postCode);
					}					
					/*** Enhancement on web order submitted by Springfree stuff at the event 28-03-19 (Start) ***/
					if(salesRep_cust == '14000'){ // 14000 = Web
						custRec.setFieldValue('salesrep', salesRep);
					}
					/*** Enhancement on web order submitted by Springfree stuff at the event 28-03-19 (End) ***/					
					if(isNULL(channelReferal_cust)){ //Only update if it's empty (i.e. New Customer Record, not Returning)
						custRec.setFieldValue('custentity_lead_source_class', channelReferal);
						updatedCustInfo = 'Channel Referal';
					}					
					if(!isNULL(altPhone)){ //Only update if Alt Phone in Web Order is not empty 
						custRec.setFieldValue('altphone', altPhone);
						
						if(isNULL(updatedCustInfo)){
							updatedCustInfo = 'Alt Phone';
						}
						else {
							updatedCustInfo += ', Alt Phone';
						}
					}					
					if(isNULL(dePartment_cust) && isNULL(filteredCamp_cust)){
						custRec.setFieldValue('custentity_customer_department', dePartment);
						custRec.setFieldValue('custentity_sp_filtered_campaign_source', filteredCamp);
						custRec.setFieldValue('leadsource', filteredCamp);
						custRec.setFieldValue('custentity_customer_facing_name', nlapiLookupField('campaign', filteredCamp, 'custevent_customer_facing_name2'));

						if(isNULL(updatedCustInfo)){
							updatedCustInfo = 'Department, Filtered Campaign';
						}
						else {
							updatedCustInfo += ', Department, Filtered Campaign';
						}
						
						if(!isNULL(priceLevel)){ 
							custRec.setFieldValue('pricelevel', priceLevel);
							updatedCustInfo += ', Price Level';
						}						
					}					
					if(freightZone_cust != freightZone){ //Only update if freight zone is different 
						custRec.setFieldValue('custentity_freight_zone', freightZone);
						
						if(isNULL(updatedCustInfo)){
							updatedCustInfo = 'Freight Zone';
						}
						else {
							updatedCustInfo += ', Freight Zone';
						}
					}					
					if(installGroup_cust != installGroup){ //Only update if install group is different 
						custRec.setFieldValue('custentity_install_group', installGroup);
						
						if(isNULL(updatedCustInfo)){
							updatedCustInfo = 'Install Group';
						}
						else {
							updatedCustInfo += ', Install Group';
						}
					}					
					if(!isNULL(updatedCustInfo)){
						nlapiSubmitRecord(custRec, false, true); //Submit customer record and ignore mandatory fields & sourcing
						nlapiLogExecution('AUDIT', 'Sales Order : Customer - Updated Details', 
								nlapiGetRecordId() + ' ' + salesOrder.getFieldValue('tranid') + ' : ' 
								+ custRec.getId() + ' ' + custRec.getFieldValue('entityid') + ' : ' + updatedCustInfo);
					}
					else{
						nlapiLogExecution('AUDIT', 'Sales Order : Customer - No Update Required', 
								nlapiGetRecordId() + ' ' + salesOrder.getFieldValue('tranid') + ' : ' 
								+ custRec.getId() + ' ' + custRec.getFieldValue('entityid'));
					}
				}	  
			}
			
	/*		else if(webSite == dealerHub_US){ // For Dealer Hub enhancement in the future							
				if(subSidiary == '3'){ //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2   					
					var dePartment = conText.getSetting('SCRIPT', 'custscript_wo_us_dealer_department');
					var salesRep = conText.getSetting('SCRIPT', 'custscript_wo_sales_rep'); 				
					nlapiLogExecution('DEBUG', 'Field Values', 'Department' + ' : ' + dePartment + ' , '
							+ 'salesRep' + ' : ' + salesRep); // Testing only				
					salesOrder.setFieldValue('salesrep', salesRep);									
					salesOrder.setFieldValue('department', dePartment);										
					nlapiSubmitRecord(salesOrder,false, true); //Submit customer record and ignore mandatory fields & sourcing				
					nlapiLogExecution('AUDIT', 'Sales Order : Dealer Hub', 
							nlapiGetRecordId() + ' ' + salesOrder.getFieldValue('tranid'));										
				}	  
			}*/
			
		}
	}catch(ex){
		var processMssg	= 'Processing Web Order : ';
		var errorStr	= (ex.getCode() != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n'  : ex.toString();
	    nlapiLogExecution('Error', 'setDefaults_AfterSubmit', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}		
}