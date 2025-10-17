/**
 * Module Description
 * 
 * Version  Date		Author          Remarks
 * 1.00     15-08-19	Eric.Choe		Created following functions
 * 											- function handleErrorIfAny()
 * 											- function handleErrorInStage()								
 * 											- function handleErrorAndSendNotification()
 * 											- function getInputData()	
 * 											- function reduce()
 * 											- function summarize()	
 * 
 * 1.10		16-10-19		Eric.Choe	Updated "function reduce()"
 * 											- To add logic for orders coming in from event by Springfree stuff
 * 											- To add logic for "Invalid Shopify Order"
 *
 * 1.20		21-10-19		Eric.Choe	Updated logic for "Invalid Shopify Order" to handle 'NULL' and 'Not Found' separately
 * 
 * 1.2.1	04-03-20		Eric.Choe	Created following logic
 * 											- To assign installer for US & CA
 * 											- To assign price level for US
 * 	
 * 1.30		15-06-20		Eric.Choe	Created following logic
 * 											- To validate Shipping & Installation line item price
 * 									 
 */

/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/runtime', 'N/search', 'N/error', 'N/email', './lib/utils', './lib/postcode'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {error} error
 * @param {email} email
 * @param {email} utils
 * @param {email} postcode
 */
		
function(record, runtime, search, error, email, utils, postcode) {
   	
    function handleErrorIfAny(summary){
        var inputSummary = summary.inputSummary;
        var mapSummary = summary.mapSummary;
        var reduceSummary = summary.reduceSummary;
        if (inputSummary.error){
            var e = error.create({
                name: 'INPUT_STAGE_FAILED',
                message: inputSummary.error
            });
            handleErrorAndSendNotification(e, 'getInputData');
        }
        handleErrorInStage('map', mapSummary);
        handleErrorInStage('reduce', reduceSummary);
    }
    	
    function handleErrorInStage(stage, summary){
        var errorMsg = [];
        summary.errors.iterator().each(function(key, value){
            var msg = 'Error encountered while processing web order: ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
            errorMsg.push(msg);
            return true;
        });
        if (errorMsg.length > 0){
            var e = error.create({
                name: 'WEBORDER_PROCESSING_FAILED',
                message: JSON.stringify(errorMsg)
            });
            handleErrorAndSendNotification(e, stage);
        }
    }

    function handleErrorAndSendNotification(e, stage){
        log.error('Stage: ' + stage + ' failed', e);
        var author = 18;
        var recipients = ['it@springfrree.co.nz']; //18 = Eric, 10 = Dan
        var subject = 'Map/Reduce script ' + runtime.getCurrentScript().id + ' failed for stage: ' + stage;
        var body = 'An error occurred with the following information:\n'
        			+ 'Error code: ' + e.name + '\n'
        			+ 'Error msg: ' + e.message;
		email.send({
		    author: author,
		    recipients: recipients,
		    subject: subject,
		    body: body
		});
    }
    
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
    	return search.load({id : runtime.getCurrentScript().getParameter({ name: 'custscript_search_weborder' })}); // Load search for web order stored in script parameter
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
    	try{    		
    		var scriptObj = runtime.getCurrentScript();
        	for(var i in context.values){
    			var currRecID	= JSON.parse(context.values[i]).id;   			
    			var currRec		= record.load({
    			    type: record.Type.SALES_ORDER, 
    			    id: currRecID,
    			    isDynamic: false,
    			});   			
    			var webStore	= currRec.getValue({fieldId: 'custbody_celigo_etail_channel'});
    			if(webStore == '4'){ //Shopify = 4   				   				
    				var recSubsidiary	= currRec.getValue({fieldId: 'subsidiary'});
    				var promoCode		= currRec.getValue({fieldId: 'promocode'});   				
    				var marketingStatus	= currRec.getValue({fieldId: 'custbody_celigo_etail_refund_id'});
    				var altPhone		= currRec.getValue({fieldId: 'custbody_secondphone'});
    				var eventMarketID	= currRec.getValue({fieldId: 'custbody_so_event_market'});
    				var shipType = '2'; // Delivery = 2    				    				    				
    				if(currRec.getValue({fieldId: 'custbody_for_pickup'}) == true){
    					shipType = '1';  // Pick-Up = 1
    				}    				
    				// For web order submitted by Springfree stuff at the event - START
					if(eventMarketID){
						// Load default field values for Event					
	    				var eventMarket = search.lookupFields({
						    type: 'customrecord_event_market_list',
						    id: eventMarketID,
						    columns: ['custrecord_em_department','custrecord_em_campaign','custrecord_em_sales_channel','custrecord_em_sales_rep']
						});
	    				log.debug('Order from Event', 'Sales Order = ' + currRecID + ' : ' + 'eventMarket = ' + JSON.stringify(eventMarket));
	    				if(eventMarket){
	    					currRec.setValue({
    		            		fieldId: 'department',
    		            		value: eventMarket.custrecord_em_department[0].value
    		            	});
    						currRec.setValue({
    		            		fieldId: 'custbody_sp_filtered_campaign_source',
    		            		value: eventMarket.custrecord_em_campaign[0].value
    		            	});
    						currRec.setValue({
    		            		fieldId: 'leadsource',
    		            		value: eventMarket.custrecord_em_campaign[0].value
    		            	});    						
    						currRec.setValue({
    		            		fieldId: 'custbody_salessource',
    		            		value: eventMarket.custrecord_em_sales_channel[0].value
    		            	});
    						currRec.setValue({
    		            		fieldId: 'salesrep',
    		            		value: eventMarket.custrecord_em_sales_rep[0].value
    		            	});
	    				}				
					}
					// For web order submitted by Springfree stuff at the event - END					    				
    				if(promoCode){	
    					// If there is a linked campaign in promotion then update MARKETING CAMPAIGN and CAMPAIGN SOURCE using linked campaign				
    					var linkedCamp = search.lookupFields({
    					    type: search.Type.PROMOTION_CODE,
    					    id: promoCode,
    					    columns: 'custrecord_linked_campaign'
    					});
    					log.debug('Order for Promotion', 'Sales Order = ' + currRecID + ' : ' +  'promoCode = ' + promoCode + ' : linkedCamp = ' + JSON.stringify(linkedCamp));
    					if(linkedCamp.custrecord_linked_campaign[0]){
    						var linkedCamp_ID = linkedCamp.custrecord_linked_campaign[0].value;
    						currRec.setValue({
    		            		fieldId: 'leadsource',
    		            		value: linkedCamp_ID
    		            	});
    						currRec.setValue({
    		            		fieldId: 'custbody_sp_filtered_campaign_source',
    		            		value: linkedCamp_ID
    		            	});
    					}
    				}
    				// Get shipping address from sales order
    				var shipTo = search.lookupFields({
					    type: 'address',
					    id: currRec.getValue({fieldId: 'shippingaddress'}),
					    columns: ['addressee','phone','address1','city','state','zip','countrycode']
					});
    				log.debug('Inspecting Shipping Address', 'Sales Order = ' + currRecID + ' : ' +  'shipTo = ' + JSON.stringify(shipTo));    				
    				var ship_Addressee	= shipTo.addressee;
    				var ship_Phone		= shipTo.phone;
    				var ship_Add1		= shipTo.address1;
    				var ship_City		= shipTo.city;
    				var ship_Postcode   = shipTo.zip;   				
    				if(recSubsidiary == '5'){ // 5 = NZ
    					var ship_State	= shipTo.state;
    				}
    				else{ // Converting State Code to internal ID
    					var ship_State	= postcode.getStateID(shipTo.countrycode,shipTo.state);
    				}    				
    				// Converting Country Code to internal ID
    				var ship_Country	= postcode.getCountryID(shipTo.countrycode);
    				var postCode   		= postcode.getPostCode(ship_City, ship_Postcode, ship_Country);	
    				var orderStatus		= currRec.getValue({fieldId: 'orderstatus'});
    				var freightZone		= '';
    				var installGroup	= '';    				
    				var logMssg			= [];
    				if(postCode){    					
    					// FUTURE ENHANCEMENT - create Suitelet instead if required for client script
        				freightZone		= postcode.getFeightZone(postCode);
        				installGroup	= postcode.getInstallGroup(postCode);
        				log.debug('Expected Freight & Install Group ', 'Sales Order = ' + currRecID + ' : ' + 'freightZone = ' + freightZone + ' : installGroup = ' + installGroup);     				
        				if(orderStatus != 'Pending Billing'){ //If it's not Gift Voucher only order(i.e. there is at least an item to be fulfilled)
        					var currRec_delivery		= currRec.getValue({fieldId: 'custbody_delivery_available'});
        					var currRec_pickup			= currRec.getValue({fieldId: 'custbody_pickup_available'});
        					var currRec_cash_n_carry	= currRec.getValue({fieldId: 'custbody_cashncarry_available'});
        					var currRec_installation	= currRec.getValue({fieldId: 'custbody_install_available'});				
        					var currRec_freightzone		= currRec.getValue({fieldId: 'custbody_freight_zone'});        					
        					var currRec_freightcost		= 0;
        					var freightCost_Total		= 0;       					
        					var currRec_installgroup	= currRec.getValue({fieldId: 'custbody_install_group'});
        					var include_installation	= false;
        					var currRec_installcost		= 0;
        					var installCost_Total		= 0;        					
        					var currRec_pickuplocation	= currRec.getValue({fieldId: 'custbody_pickup_location'});       					
        					var postCode_Text			= search.lookupFields({
        					    type: 'customrecord_post_code',
        					    id: postCode,
        					    columns: ['name']
        					}).name;
        					// Assign installer for US & CA
        					if(recSubsidiary == '3' || recSubsidiary == '4'){// AU = 1, US = 3, CA = 4, NZ = 5,
        						currRec.setValue({
            	            		fieldId: 'custbody_so_installer',
            	            		value: postcode.getInstaller(postCode)
            	            	});
        					}      					
        					var totalLineItem = currRec.getLineCount({
                        		sublistId: 'item'
                        	});        					
        					if(freightZone != 'Not Found'){           					
        						// Assigning default warehouse location - START        						
            					for(var j = 0; j < totalLineItem; j++){ // Caution: Line item index starts from 0, not 1         						
            						var currItem = currRec.getSublistValue({
            						    sublistId: 'item',
            						    fieldId: 'item',
            						    line: j
            						});
                					// Get actual freight cost from line item
            						if(currItem == '4272'){ // 4272 = SH Shipping
            							currRec_freightcost = currRec.getSublistValue({
                						    sublistId: 'item',
                						    fieldId: 'amount',
                						    line: j
                						});
            						}
            						// Update Delivery and Pickup transaction line fields, Delivery is checked by default
            	    				if(shipType == '1'){ // Pick-up = 1
                						currRec.setSublistValue({ 
                                		    sublistId: 'item',
                                		    fieldId: 'custcol_pick_up',
                                		    line: j,
                                		    value: true
                                		});
                						currRec.setSublistValue({ 
                                		    sublistId: 'item',
                                		    fieldId: 'custcol_delivery',
                                		    line: j,
                                		    value: false
                                		});            						           						
                						var isCommitting = currRec.getSublistValue({ 
                                		    sublistId: 'item',
                                		    fieldId: 'quantitycommitted',
                                		    line: j,
                                		});
                						var defWarehouse = currRec.getValue({fieldId: 'custbody_pickup_location'});	
                						// Assign default w/h location for pickup for fulfillable item
                						if(defWarehouse && (isCommitting == '0'|| currItem == '4274')){ // 4274 = Install Trampoline
                    						currRec.setSublistValue({
                                    		    sublistId: 'item',
                                    		    fieldId: 'location',
                                    		    line: j,
                                    		    value: defWarehouse
                                    		});
                						}           						            						
            	    				}
            	    				else{ // Get & assign default w/h location for delivery
            	    					var defWarehouse = postcode.getDefaultWarehouse(recSubsidiary, ship_State, postCode, ship_Country, currItem, shipType, freightZone);
                    					// Assigning default warehouse in line items
                    					if(defWarehouse){
                    						currRec.setSublistValue({
                                    		    sublistId: 'item',
                                    		    fieldId: 'location',
                                    		    line: j,
                                    		    value: defWarehouse
                                    		});
                    					}
                						// Calculate EXPECTED freight cost based on line items
                    					if(currItem != '4272'){ // 4272 = SH Shipping
                							var freightCost = postcode.getFreightCost(freightZone, currItem);
                							if(freightCost > 0){
                								var currItem_Quantity = currRec.getSublistValue({
                        						    sublistId: 'item',
                        						    fieldId: 'quantity',
                        						    line: j
                        						});
                								freightCost_Total += parseFloat(freightCost)*parseFloat(currItem_Quantity);
                							}               							
                						}				               					               						
            	    				}
            	    			}           					        	    				            						            						            						
            					// Assigning default warehouse location - END            					
            					// Validating shipping flag field values from Shopify - START           				
        	    				var zonePostCode_ID = postcode.getZonePostCode(postCode);
            					var zonePostCode	= search.lookupFields({
            					    type: 'customrecord_zone_post_code',
            					    id: zonePostCode_ID,
            					    columns: ['custrecord_zpc_zone','custrecord_zpc_delivery','custrecord_zpc_pickup','custrecord_zpc_cash_n_carry','custrecord_zpc_online_pickup_location']
            					});           					            					
            					if(currRec_delivery != zonePostCode.custrecord_zpc_delivery){
            						if(currRec_delivery){
            							logMssg.push({'Invalid DELIVERY AVAILABLE' : 'DELIVERY AVAILABLE should be NOT CHECKED for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});  
            						}
            						else{
            							logMssg.push({'Invalid DELIVERY AVAILABLE' : 'DELIVERY AVAILABLE should be CHECKED for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});  
            						}           						
            					}
            					if(currRec_pickup != zonePostCode.custrecord_zpc_pickup){
            						if(currRec_pickup){
            							logMssg.push({'Invalid PICK-UP AVAILABLE' : 'PICK-UP AVAILABLE should be NOT CHECKED for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});  
            						}
            						else{
            							logMssg.push({'Invalid PICK-UP AVAILABLE' : 'PICK-UP AVAILABLE should be CHECKED for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});  
            						}            						
            					}
            					if(currRec_cash_n_carry != zonePostCode.custrecord_zpc_cash_n_carry){
            						if(currRec_cash_n_carry){
            							logMssg.push({'Invalid CASH & CARRY AVAILABLE' : 'CASH & CARRY AVAILABLE should be NOT CHECKED for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});  
            						}
            						else{
            							logMssg.push({'Invalid CASH & CARRY AVAILABLE' : 'CASH & CARRY AVAILABLE should be CHECKED for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});  
            						}            						
            					}
            					if(currRec_freightzone != freightZone){
            						if(zonePostCode.custrecord_zpc_zone[0]){
            							logMssg.push({'Invalid FREIGHT ZONE' : 'FREIGHT ZONE should be ' + zonePostCode.custrecord_zpc_zone[0].text + ' for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});   
            						}
            						else{
            							logMssg.push({'Invalid FREIGHT ZONE' : 'FREIGHT ZONE should be NULL for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});           					
            						}
            					}
            					if(shipType == '1'){
            						if(zonePostCode.custrecord_zpc_online_pickup_location[0]){
                    					if(currRec_pickuplocation != zonePostCode.custrecord_zpc_online_pickup_location[0].value){ // Pick-up = 1
                    						logMssg.push({'Invalid WEB PICK UP LOCATION' : 'WEB PICK UP LOCATION should be ' + zonePostCode.custrecord_zpc_online_pickup_location[0].value + ' / ' + zonePostCode.custrecord_zpc_online_pickup_location[0].text + ' for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});           						
                    					}
            						}
            						else{
            							logMssg.push({'Invalid WEB PICK UP LOCATION' : 'WEB PICK UP LOCATION should be NULL for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});           						
            						}
            					}
            					freightCost_Total = parseFloat(freightCost_Total).toFixed(2);
        	    				if(recSubsidiary != '2'){// AU = 1, US = 3, CA = 4, NZ = 5,
//        	    					if(currRec_freightcost != freightCost_Total){ 
//                						logMssg.push({'Invalid amount in Shipping Line Item' : 'Correct amount should be ' + freightCost_Total + ' for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});  						
//                					}
        	    					// Igonre 0.01 difference caused by tax rouding in Shopify
        	    					if(Math.abs(parseFloat(currRec_freightcost) - parseFloat(freightCost_Total)).toFixed(2) > 0.01){ 
                						logMssg.push({'Invalid amount in Shipping Line Item' : 'Correct amount should be ' + freightCost_Total + ' for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});  						
                					}
                					log.debug('Validating Shipping Cost' , 'Sales Order = ' + currRecID + ' : ' + 'Actual = ' + currRec_freightcost + ' : Expected = ' + freightCost_Total);
        	    					log.debug('FreightCosts - Difference', Math.abs(parseFloat(currRec_freightcost) - parseFloat(freightCost_Total)));        	    					
        	    				}            					
            				}
            				else if(currRec_delivery || currRec_pickup || currRec_cash_n_carry || currRec_freightzone ||currRec_pickuplocation){
            					// Validating shipping flag field values from Shopify
            					if(currRec_delivery){
            						logMssg.push({'Invalid DELIVERY AVAILABLE' : 'There is no matching ZONE POST CODE for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ')'});       					
            					}
            					if(currRec_pickup){
            						logMssg.push({'Invalid PICK-UP AVAILABLE' : 'There is no matching ZONE POST CODE for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ')'});       					
            					}
            					if(currRec_cash_n_carry){
            						logMssg.push({'Invalid CASH & CARRY AVAILABLE' : 'There is no matching ZONE POST CODE for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ')'});       					
            					}
            					if(currRec_freightzone){
            						logMssg.push({'Invalid FREIGHT ZONE' : 'There is no matching ZONE POST CODE for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ')'});       					
            					}
            					if(shipType == '1' && currRec_pickuplocation){;  // Pick-Up = 1
            						logMssg.push({'Invalid WEB PICK UP LOCATION' : 'There is no matching ZONE POST CODE for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ')'});       					
            					}
            				}
        					// Validating shipping flag field values from Shopify - END  
        					// Validating install flag field values from Shopify - START
            				if(installGroup != 'Not Found'){            					
            					if(!currRec_installation){
            						logMssg.push({'Invalid INSTALLATION AVAILABLE' : 'INSTALLATION AVAILABLE should be CHECKED for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ')'});
            					}
            					if(currRec_installgroup != installGroup){
            						if(installGroup){
            							var installGroup_Text = search.lookupFields({
                    					    type: 'customrecord_install_group',
                    					    id: installGroup,
                    					    columns: ['name']
                    					}).name;
                						logMssg.push({'Invalid INSTALL GROUP' : 'INSTALL GROUP should be ' + installGroup_Text + ' for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ')'});
            						}
            						else{
            							logMssg.push({'Invalid INSTALL GROUP' : 'INSTALL GROUP should be NULL for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ')'});               						
            						}            						
            					}
            					// Check Installation Cost is correct
               					for(var k = 0; k < totalLineItem; k++){ // Caution: Line item index starts from 0, not 1         						
               						var lineItem = currRec.getSublistValue({
            						    sublistId: 'item',
            						    fieldId: 'item',
            						    line: k
            						});               						
               						// Get actual installation cost from line item
            						if(lineItem == '4274'){ // 4274 = Install Trampoline Install Trampoline
            							currRec_installcost = currRec.getSublistValue({
                						    sublistId: 'item',
                						    fieldId: 'amount',
                						    line: k
                						});
            							include_installation = true;
            						}
            						// Calculate EXPECTED installation cost based on line items
            						else{
            							var lineItem_Class = search.lookupFields({
                						    type: 'item',
                						    id: lineItem,
                						    columns: 'class'
                						}).class[0];
                   						if(lineItem_Class && lineItem_Class.value  == '1'){ // 1 = Trampolines
                   							var installCost = postcode.getInstallCost(installGroup);
                							if(installCost > 0){               								
                								var lineItem_Quantity = currRec.getSublistValue({
                        						    sublistId: 'item',
                        						    fieldId: 'quantity',
                        						    line: k
                        						});
                								installCost_Total += parseFloat(installCost)*parseFloat(lineItem_Quantity);
                							} 
                   						}							              							
            						}	
            					}
               					installCost_Total = parseFloat(installCost_Total).toFixed(2);
        	    				if(include_installation && recSubsidiary != '2'){// AU = 1, US = 3, CA = 4, NZ = 5,
//        	    					if(currRec_installcost != installCost_Total){ 
//                						logMssg.push({'Invalid amount in Installation Line Item' : 'Correct amount should be ' + installCost_Total + ' for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});  						
//                					}
        	    					// Igonre 0.01 difference caused by tax rouding in Shopify
        	    					if(Math.abs(parseFloat(currRec_installcost) - parseFloat(installCost_Total)).toFixed(2) > 0.01){ 
                						logMssg.push({'Invalid amount in Installation Line Item' : 'Correct amount should be ' + installCost_Total + ' for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ', ZONE POST CODE internalid = ' + zonePostCode_ID + ')'});  						
                					}
                   					log.debug('Validating Installation Cost', 'Sales Order = ' + currRecID + ' : ' + 'Actual = ' + currRec_installcost + ' : Expected = ' + installCost_Total);
        	    					log.debug('InstallCosts - Difference', Math.abs(parseFloat(currRec_installcost) - parseFloat(installCost_Total)));
        	    				}  	
            				}
            				else if(currRec_installgroup || currRec_installation){
            					if(currRec_installation){
            						logMssg.push({'Invalid INSTALLATION AVAILABLE' : 'There is no matching INSTALL GROUP for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ')'});       					
            					}  
            					if(currRec_installgroup){
            						logMssg.push({'Invalid INSTALL GROUP' : 'There is no matching INSTALL GROUP for POST CODE '+ postCode_Text + '(internalid = ' + postCode + ')'});       					
            					}     					
            				}
            				// Validating install flag field values from Shopify- END  					
        				}        				    					     				
    				}
    				else if(orderStatus != 'Pending Billing'){
    					logMssg.push({'Invalid SHIPPING ADDRESS' : 'There is no matching POST CODE, please check all shipping & installation field values and costs are correct'});    					
    					log.audit('Reduce', 'Invalid Shipping Address : Web Order ID = ' + currRecID + ' : shipTo = ' + JSON.stringify(shipTo));
    				}
    				// Update Incomplete Web Order Log
    				if(logMssg.length > 0){
    					currRec.setValue({
    	            		fieldId: 'custbody_incomplete_web_order',
    	            		value: true
    	            	});
    					currRec.setValue({
    	            		fieldId: 'custbody_incomplete_web_order_log',
    	            		value: JSON.stringify(logMssg)
    	            	});
    				}
    				// Update other flag fields
    				currRec.setValue({
	            		fieldId: 'custbody_celigo_etail_refund_id',
	            		value: ''
	            	});
    				currRec.setValue({
	            		fieldId: 'custbody_celigo_shopify_order_no',
	            		value: currRec.getValue({fieldId: 'otherrefnum'})
	            	});
    				currRec.setValue({
	            		fieldId: 'custbody_ps_webstore_process_flag',
	            		value: false
	            	});  				    				
    				// Save sales order
    				currRec.save({       
                		enableSourcing: false,
                		ignoreMandatoryFields : true
                	});    				
    				// Update customer record   				    				    				
					var updatedFields		= ""; // To log updated fields in customer record
					var currRec_CustomerID	= currRec.getValue({fieldId: 'entity'});
					var currRec_Customer = record.load({
	    			    type: record.Type.CUSTOMER, 
	    			    id: currRec_CustomerID,
	    			    isDynamic: true,
	    			});										
					var freightZone_Cust 	= currRec_Customer.getValue({fieldId: 'custentity_freight_zone'});
					var installGroup_Cust	= currRec_Customer.getValue({fieldId: 'custentity_install_group'});
					var isNewRec_Cust		= currRec_Customer.getValue({fieldId: 'custentity_celigo_etail_cust_exported'});
					var gss_Cust			= currRec_Customer.getValue({fieldId: 'globalsubscriptionstatus'});		
					var phone_Cust			= currRec_Customer.getValue({fieldId: 'phone'});													
					if(freightZone != 'Not Found' && freightZone && freightZone != freightZone_Cust){ //Only update if freight zone is different 					
						currRec_Customer.setValue({
		            		fieldId: 'custentity_freight_zone',
		            		value: freightZone
		            	});						
						if(updatedFields){
							updatedFields += ', Freight Zone';
						}
						else{
							updatedFields = 'Freight Zone';
						}
					}
					if(installGroup != 'Not Found' && installGroup && installGroup != installGroup_Cust){ //Only update if install group is different		
						currRec_Customer.setValue({
		            		fieldId: 'custentity_install_group',
		            		value: installGroup
		            	});						
						if(updatedFields){
							updatedFields += ', Install Group';
						}
						else{
							updatedFields = 'Install Group';
						}
					}			
					if(ship_Phone && ship_Phone != phone_Cust){ //Only update if Phone is different 					
						currRec_Customer.setValue({
		            		fieldId: 'phone',
		            		value: ship_Phone
		            	});						
						if(updatedFields){
							updatedFields += ', Home/Work Phone';
						}
						else{
							updatedFields = 'Home/Work Phone';
						}
					}
					if(altPhone){
						var altPhone_Cust = currRec_Customer.getValue({fieldId: 'altphone'});
						if(altPhone != altPhone_Cust){ //Only update if GSS is different 					
							currRec_Customer.setValue({
			            		fieldId: 'altphone',
			            		value: altPhone
			            	});
							if(updatedFields){
								updatedFields += ', Alt Phone';
							}
							else{
								updatedFields = 'Alt Phone';
							}
						}
					}
					if(marketingStatus && marketingStatus != gss_Cust){ //Only update if GSS is different 					
						currRec_Customer.setValue({
		            		fieldId: 'globalsubscriptionstatus',
		            		value: marketingStatus
		            	});
						if(updatedFields){
							updatedFields += ', Global Subscription Status';
						}
						else{
							updatedFields = 'Global Subscription Status';
						}
					}					
					// Update price level for US
					if(recSubsidiary == '3'){// AU = 1, US = 3, CA = 4, NZ = 5,
						var priceLevel = currRec_Customer.getValue({fieldId: 'pricelevel'});
						if(!priceLevel){
							currRec_Customer.setValue({
			            		fieldId: 'pricelevel',
			            		value: 3 // 3 = Phone/Online Price 
			            	});
							if(updatedFields){
								updatedFields += ', Price Level';
							}
							else{
								updatedFields = 'Price Level';
							}
						}						
					}					
					 // Create new address in customer record if it's a valid address/postcode
					if(postCode){
						currRec_Customer.selectNewLine({sublistId: 'addressbook'});
						currRec_Customer.setCurrentSublistValue({
							sublistId: 'addressbook',
				            fieldId: 'defaultshipping',
				            value: true
						});
			    		var newAdd = currRec_Customer.getCurrentSublistSubrecord({
			    			sublistId : "addressbook",
			    			fieldId : "addressbookaddress"
			    		});
			    		newAdd.setValue({
			    			fieldId : 'country',
			    			value : shipTo.countrycode
			    		});
			    		newAdd.setValue({
			    			fieldId : 'addressee',
			    			value : ship_Addressee
			    		});
			    		newAdd.setValue({
			    			fieldId : 'addrphone',
			    			value : ship_Phone
			    		});
			    		newAdd.setValue({
			    			fieldId : 'addr1',
			    			value : ship_Add1
			    		});
			    		newAdd.setValue({
			    			fieldId : 'city',
			    			value : ship_City
			    		});
			    		newAdd.setValue({
			    			fieldId : 'state',
			    			value : shipTo.state
			    		});
			    		newAdd.setValue({
			    			fieldId : 'zip',
			    			value : ship_Postcode
			    		});			    		
			    		currRec_Customer.commitLine({sublistId: 'addressbook'});
			    		if(updatedFields){
							updatedFields += ', Address';
						}
						else{
							updatedFields = 'Address';
						}	
					}
					// Reset flag fields used in customer record
					if(isNewRec_Cust){
						// Reset flag field used to identify new record creation
						currRec_Customer.setValue({ 
		            		fieldId: 'custentity_celigo_etail_cust_exported',
		            		value: false
		            	});
						// Update External ID field which is used to find duplicate by Celigo connector, (Note: We cannot remove default logic in connector so override it)
						var recID_Prefix = 'SHOPIFY_SFT';
						switch(recSubsidiary){ //AU = 1, US = 3, CA = 4, NZ = 5
							case '1':
								recID_Prefix = recID_Prefix + 'AU_'; 
								break;								
							case '3':
								recID_Prefix = recID_Prefix + 'US_'; 
								break;						
							case '4':
								recID_Prefix = recID_Prefix + 'CA_'; 
								break;						
							case '5':
								recID_Prefix = recID_Prefix + 'NZ_'; 
								break;				
						};
						currRec_Customer.setValue({ 
		            		fieldId: 'externalid',
		            		value: recID_Prefix + currRec_CustomerID
		            	});
						if(updatedFields){
							updatedFields += ', Marketing Channel Referral, External ID';
						}
						else{
							updatedFields = 'Marketing Channel Referral, External ID';
						}							
						// Limitation with connector so update hard-coded value coming in as default
						currRec_Customer.setValue({ 
		            		fieldId: 'custentity_lead_source_class',
		            		value: currRec.getValue({fieldId: 'custbodycustbody_referralsource'})
		            	});
					}
					// Save customer record if any update is required
					if(updatedFields){ 
						currRec_Customer.save({       
	                		enableSourcing: false,
	                		ignoreMandatoryFields : true
	                	});
						log.audit('Order Completed', 'Sales Order = ' + currRecID + ' : Customer = ' + currRec_CustomerID + ' : Updated fields = ' + updatedFields);
					}
					else{
						log.audit('Order Completed', 'Sales Order = ' + currRecID + ' : Customer = ' + currRec_CustomerID +  ' : No update required');
					}	
    			} // End of if	
        	}// End of For      	
    	}catch(ex){
    		var processMssg 	= 'processing Web Order ';
    		log.error({
    		    title: 'Reduce', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
    	}
    }

    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        log.audit('summarize', 'Usage Consumed = ' + summary.usage + ' : Concurrency Number = ' + summary.concurrency + ' : Number of Yields = ', + summary.yields);
    	handleErrorIfAny(summary);
    }

    return {
        config: {
            retryCount: 1, // Change it to 1 after testing
            exitOnError: false
        },
    	getInputData: getInputData,
        reduce: reduce,
        summarize: summarize
    };
    
});