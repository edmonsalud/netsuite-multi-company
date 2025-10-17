/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     12-03-19	Eric.Choe		Created following functions to replicate Parent/Hold order with custom prices
 * 											- function execute(scriptContext)
 * 											- function getClosedItem(rec_id)
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/record', 'N/runtime', 'N/search', 'N/url'],
/**
 * @param {email} email
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {url} url
 */
function(email, record, runtime, search, url) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	try{
    		var mySearch = search.create({
    			type: search.Type.SALES_ORDER,
    			filters: [{
    				name: 'custbody_order_status',
   	                operator: 'is',
   	                values: '4' // 4 = Create Split Order 
   	         	}, {
   	        	 	name: 'mainline',
   	        	 	operator: 'is',
   	        	 	values: ['T']
   	         	}],
   	         	columns: [{name: 'internalid'}, {name: 'custbody_assignedto'}]   		 		 	 
    		});

            mySearch.run().each(function(result){
            	var currUser = search.lookupFields({        	 
           		 	type: search.Type.EMPLOYEE,
           		 	id: result.getValue({name: 'custbody_assignedto'}),
           		 	columns: ['firstname', 'email']
            	});
            	var userName = currUser['firstname']; 
            	var userEmail = currUser['email'];         	       		
            	var parent_Rec	= result.getValue({name: 'internalid'});
            	log.debug({
           		 	title: 'DEBUG', 
           		 	details: 'userName = ' + userName + ', userEmail = ' + userEmail + ', parent_Rec = ' + parent_Rec 
            	});
            	var splitOrder = record.copy({            		 
            		type: record.Type.SALES_ORDER,
            		id: parent_Rec,
            	}); 
            	splitOrder.setValue({
            		fieldId: 'custbody_so_split_from',
            		value: parent_Rec
            	});
            	splitOrder.setValue({
            		fieldId: 'custbody_so_split_from_id', // Hidden flag field to trigger Split Order flow
            		value: parent_Rec
            	});
            	splitOrder.setValue({
            		fieldId: 'orderstatus',
            		value: 'A' // A = Pending Fulfilment
            	});           	            	
            	// Set fill rate values = 0, all of them
            	splitOrder.setValue({
                    fieldId: 'custbody_so_qty_ordered',
                    value: '0'
                });
            	splitOrder.setValue({
                    fieldId: 'custbody_so_qty_remaining',
                    value: '0'
                });
            	splitOrder.setValue({
                    fieldId: 'custbody_so_qty_committed',
                    value: '0'
                });
            	splitOrder.setValue({
                    fieldId: 'custbody_so_fill_rate',
                    value: '0'
                });
            	splitOrder.setValue({
                    fieldId: 'custbody_so_qty_picked',
                    value: '0'
                });
            	splitOrder.setValue({
                    fieldId: 'custbody_so_qty_shipped',
                    value: '0'
                });
            	splitOrder.setValue({
                    fieldId: 'custbody_order_status',
                    value: ''
                });           	 
            	splitOrder.setValue({
                    fieldId: 'custbody_assignedto',
                    value: ''
                });
            	splitOrder.setValue({
                    fieldId: 'custbody_ordertype',
                    value: ''
                });
            	splitOrder.setValue({
                    fieldId: 'custbody_shipping_priority',
                    value: ''
                });        		            	
//            	Get list of closed line from Hold Order - Line #, Item ID
            	var closedItemList = getClosedItem(parent_Rec);            	
            	var totalRemovedItem = 0;           	
//            	Remove closed line item from Split Order
            	for(var j = 0; j < closedItemList.length; j++){
            		var curRec = JSON.parse(closedItemList[j]);
            		log.debug({
            		    title: 'Hold Order : ' + parent_Rec + ' - Closed Item' , 
            		    details: 'Line No = ' + curRec.line  + ', Item = ' + curRec.item
            		});
            		splitOrder.removeLine({
            		    sublistId: 'item',
            		    line: (curRec.line - totalRemovedItem),
            		    ignoreRecalc: true
            		});
            		totalRemovedItem += 1;
//            		For test debugging only
/*            		log.debug({
            		    title: 'totalLineItem', 
            		    details: 'parentRec = ' + parent_Rec + ', totalLineItem = ' 
            		    	+ splitOrder.getLineCount({sublistId: 'item'})  + ', totalRemovedItem = ' + totalRemovedItem
            		});*/
            	}           	 
            	var totalLineItem = splitOrder.getLineCount({
            		sublistId: 'item'
            	});            	            	
            	// Set Order Priority = 1 for Split Order to get priority on commitment     
            	for(var i = 0; i<totalLineItem; i++){ // Caution: Line item index starts from 0, not 1          		      		
            		splitOrder.setSublistValue({
            		    sublistId: 'item',
            		    fieldId: 'orderpriority',
            		    line: i,
            		    value: 1
            		});
            	}            	
                // Save Split Order
            	var splitOrderID = splitOrder.save({       
            		enableSourcing: false,
            		ignoreMandatoryFields : true
            	});          	 
            	var splitOrderNo = search.lookupFields({            		 
            		type: search.Type.SALES_ORDER,
            		id: splitOrderID,
            		columns: ['tranid']
            	})['tranid'];        	
            	log.audit({
        		    title: 'Hold Order : ' + parent_Rec, 
        		    details: 'Total # of Line Item = ' + totalLineItem + ', Total # of Closed Line Item = ' + totalRemovedItem
        		});          	
            	log.audit({
            		title: 'Split Order : ' + splitOrderID, 
            		details: splitOrderNo
            	});           	
            	var recURL = url.resolveRecord({
            		recordType: record.Type.SALES_ORDER,
            		recordId: splitOrderID,
            		isEditMode: false
            	});           	
//           	Send email confirmation to requested user 
           	 	email.send({
                    author: -5, // Update default one in Production, Goba Sports, donotreply@gobasports.com
                    recipients: userEmail,
                    subject: 'Split Order is created!',
                    body: 'Hi ' + userName + '<br><br>' 
                    	+ 'Your Split Order ' + '<a href="'+ recURL + '">' + splitOrderNo + '</a>' + ' has been successfully created.<br><br>'
                    	+ 'Please do not reply to this email but contact your NetSuite Administrator if you have any questions.<br><br>'
                    	+ 'NetSuite ERP team <br> Goba Sports'
                });         	
           	 	// Reset Parent record
           	 	record.submitFields({
           	 		type: record.Type.SALES_ORDER,
           	 		id: parent_Rec,
           	 		values: {
           	 			'custbody_assignedto' : '', 
           	 			'custbody_order_status': '' // 4 = Create Split Order
           	 		},
           	 		options: {           			 
           	 			enableSourcing: false,
           	 			ignoreMandatoryFields : true
           	 		}
           	 	});         	 
           	 	log.debug({
           	 		title: 'DEBUG', 
           	 		details: 'parent_Rec ' + parent_Rec + ' is reset now.'
           	 	});          	 
           	 	return true; //  returns a boolean which can be used to stop the iteration with a value of false, or continue the iteration with a value of true.            	
            });  		       	
    	}catch(ex){
    		var processMssg 	= 'processing Split Order with Line Items';
    		var errorStr = (ex.id != null) ? ex.id + '\n' + ex.message + '\n'  : ex.toString();
    		log.error({
    		    title: 'Scheduled Script - execute', 
    		    details: 'Error encountered while ' + processMssg  + ' (' +  errorStr + ')'
    		});
    	}   	
    }
 
    
    function getClosedItem(rec_id){// Get the list of closed line item from Parent/Hold order  	
    	try{
    		var parentRec = record.load({
        	    type: record.Type.SALES_ORDER, 
        	    id: rec_id,
        	    isDynamic: false,
        	});		
        	var totalLineItem = parentRec.getLineCount({
        		sublistId: 'item'
        	});     	
        	var closedItemList = [];    	
        	for(var i = 0; i<totalLineItem; i++){ // Caution: Line item index starts from 0, not 1
        		var isClosed = parentRec.getSublistValue({
        			sublistId: 'item',
        		    fieldId: 'isclosed',
        		    line: i,       			
        		});		
        		if(isClosed){
            		var itemDesc = parentRec.getSublistText({
            			sublistId: 'item',
            		    fieldId: 'item',
            		    line: i,       			
            		});	
        			closedItemList.push(JSON.stringify({line : i, item : itemDesc}));
        		}
        	}    	
        	return closedItemList;     	
        	// For test debugging only
        	/*for(var j = 0; j < closedItemList.length; j++){
        		var curRec = JSON.parse(closedItemList[j]);
        		log.debug({
        		    title: 'Scheduled Script - closedItemList', 
        		    details: 'parentRec = ' + rec_id + ', Line No = ' + curRec.line  + ', Item = ' + curRec.item
        		});
        	}*/   		
    	}catch(ex){
    		var processMssg 	= 'processing Split Order with Line Items';
    		var errorStr = (ex.id != null) ? ex.id + '\n' + ex.message + '\n'  : ex.toString();
    		log.error({
    		    title: 'Scheduled Script - getClosedItem', 
    		    details: 'Error encountered while ' + processMssg  + ' (' +  errorStr + ')'
    		});
    	}
    }

    return {
        execute: execute
    };
    
});