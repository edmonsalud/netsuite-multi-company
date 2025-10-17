/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     22-07-20	Eric.Choe		Created following functions to create package sublist for FedEx integration - US
 * 											- function beforeSubmit(scriptContext) 											
 * 											- function getItemDim(type, id) 	
 * 											- function addPackage(newRec, weight, length, height, width)	 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', './lib/utils'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, utils) {
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
	function beforeSubmit(scriptContext) {
    	try{
    		var eventType		= scriptContext.type;
			var newRec			= scriptContext.newRecord;
			var newRec_ID		= scriptContext.newRecord.id;
			var recSubsidiary	= newRec.getValue({
	    		fieldId: 'subsidiary'
	    	});
	    	var parentRec		= newRec.getValue({
	    		fieldId: 'createdfrom'
	    	}); 
	    	var fedex_ref		= newRec.getSublistValue({
				sublistId: 'packagefedex',
	    		fieldId: 'reference1fedex',
				line: 0
			}); 	    	
	    	log.debug('beforeSubmit', 'eventType = ' + eventType + ' : recSubsidiary = ' + recSubsidiary + ' : parentRec = ' + parentRec + ' : fedex_ref = ' + fedex_ref);

	    	if(eventType == 'pack' && recSubsidiary == '3' && parentRec){// AU = 1, US = 3, CA = 4, NZ = 5,    	    		        	    	   	    		
	    		var validFedex	= ['3','1413'];// '3' = FedEx, '1413' = FedEx 2 Day - US, '598' = FedEx CA, '1397' = FedEx 2 Day - CA
	    		var shipMethod	= newRec.getValue({
    	    		fieldId: 'shipmethod'
    	    	});  	    	
    	    	log.debug('beforeSubmit', 'eventType = ' + eventType + ' : newRec_ID = ' + newRec_ID + ' : shipMethod = ' + shipMethod + ' : fedex_ref = ' + fedex_ref);

    	    	
    	    	
	    		if(validFedex.indexOf(shipMethod) != '-1'){ 
	    			//// Add Package sublist - START ////
	    			var comInvoice = false;
    				var totalPackItem = newRec.getLineCount({
    	        		sublistId: 'packagefedex'
    	        	});
    	        	log.debug('beforeSubmit', 'totalPackItem = ' + totalPackItem);
    	        	// Removing existing package items in reverse order
    				for(var i=totalPackItem-1; i>=0; i--){
    					newRec.removeLine({
    	        		    sublistId: 'packagefedex',
    	        		    line: i,
    	        		});
    	        	}
    				log.debug('beforeSubmit', 'totalPackItem_AfterRemove = ' + newRec.getLineCount({sublistId: 'packagefedex'}));
    				// Loop line items
    	        	var totalLineItem = newRec.getLineCount({
    	        		sublistId: 'item'
    	        	});   
    	        	log.debug('beforeSubmit', 'totalLineItem = ' + totalLineItem);   	        	
    	        	for(var j=0; j<totalLineItem; j++){
    	        		var item_Id = newRec.getSublistValue({
    	        		    sublistId: 'item',
    	        		    fieldId: 'item',
    	        		    line: j
    	        		});
    	        		var item_Type = newRec.getSublistValue({
    	        		    sublistId: 'item',
    	        		    fieldId: 'itemtype',
    	        		    line: j
    	        		});
    	        		var item_Qty = newRec.getSublistValue({
    	        		    sublistId: 'item',
    	        		    fieldId: 'quantity',
    	        		    line: j
    	        		}); 
    	        		log.debug('beforeSubmit', 'line = ' + j + ' : item_Type = ' + item_Type);   	        		
    	        		var item_Dim;
    	        		var item_Weight;
    	        		var item_Length;
    	        		var item_Height;
    	        		var item_Width; 
						if(item_Type == 'Kit'){
    	        			// Loop for kit item to add packages per each assoicated items
    	        			var item_Kit = record.load({
    	    	    		    type: 'kititem', 
    	    	    		    id: item_Id,
    	    	    		});   	        			
    	        			var totalCompItem = item_Kit.getLineCount({
    	    	        		sublistId: 'member'
    	    	        	});
    	        			var compItem_Id;
    	        			var compItem_Qty;
    	        			for(var k=0; k<totalCompItem; k++){
    	        				compItem_Id = item_Kit.getSublistValue({
    	    	        		    sublistId: 'member',
    	    	        		    fieldId: 'item',
    	    	        		    line: k
    	    	        		});
    	        				item_Dim = JSON.parse(getItemDim('item', compItem_Id));
        	        			log.debug('beforeSubmit', 'item_Id = ' + compItem_Id + ' : item_Dim = ' + JSON.stringify(item_Dim));	    	        	        	        			
    	    	        		item_Weight = item_Dim.weight;
    	    	        		item_Length = item_Dim.length;
    	    	        		item_Height = item_Dim.height;
    	    	        		item_Width	= item_Dim.width;   	    	        		
    	    	        		if(item_Weight){
    	    	        			compItem_Qty = item_Kit.getSublistValue({
        	    	        		    sublistId: 'member',
        	    	        		    fieldId: 'quantity',
        	    	        		    line: k
        	    	        		});
    	    	        			// For each Kit Item quantity 
        	        				for(var l=0; l<item_Qty; l++){
        	        					// For each Kit Component quantity
        	        					for(var m=0; m<compItem_Qty; m++){
        	    	        				addPackage(newRec, item_Weight, item_Length, item_Height, item_Width, fedex_ref);	    	        				
        		    	        		}
        	        				}
    	    	        		}
    	        			}
    	        		}else{
    	        			item_Dim = JSON.parse(getItemDim('item', item_Id));
    	        			log.debug('beforeSubmit', 'item_Id = ' + item_Id + ' : item_Dim = ' + JSON.stringify(item_Dim) + ' : fedex_ref = ' + fedex_ref);	    	        	   	        			
	    	        		item_Weight = item_Dim.weight;
	    	        		item_Length = item_Dim.length;
	    	        		item_Height = item_Dim.height;
	    	        		item_Width	= item_Dim.width;	    	        		
	    	        		// Add packages per each quantity
	    	        		if(item_Weight){
	    	        			for(var k=0; k<item_Qty ; k++){
	    	        				addPackage(newRec, item_Weight, item_Length, item_Height, item_Width, fedex_ref);	    	        				
		    	        		}
	    	        		}	    	        		    	        		
    	        		}
    	        	} 	        	
    	        	log.debug('beforeSubmit', 'totalPackItem_AfterInsert = ' + newRec.getLineCount({sublistId: 'packagefedex'}));    				
	    		}    		
	    	}    	
    	}catch(ex){    		
    		var processMssg 	= 'processing Adding Package ';
    		var errorStr = (ex.id != null) ? ex.id + '\n' + ex.name + '\n' + ex.message + '\n'  : ex.toString();
    		log.error({
    		    title: 'beforeSubmit', 
    		    details: 'Error encountered while ' + processMssg  + ' (' +  errorStr + ')'
    		});
    	}
    }
			
    function getItemDim(type, id){
    	try{
    		var searchResult  = 'Not Found';
    		var item_Dim = search.lookupFields({
    		    type: type,
    		    id: id,
    		    columns: ['weight', 'custitem_length', 'custitem_height', 'custitem_width']
    		});
    		if(item_Dim){
    			searchResult = {
    				"weight"	: item_Dim.weight,
    				"length"	: item_Dim.custitem_length,
    				"height"	: item_Dim.custitem_height,
    				"width"		: item_Dim.custitem_width,
    			};
    			return JSON.stringify(searchResult);
    		}
    		else{
    			return searchResult;
    		}
    	}catch(ex){    		
    		var processMssg 	= 'processing Item Demensions ';
    		var errorStr = (ex.id != null) ? ex.id + '\n' + ex.name + '\n' + ex.message + '\n'  : ex.toString();
    		log.error({
    		    title: 'getItemDim', 
    		    details: 'Error encountered while ' + processMssg  + ' (' +  errorStr + ')'
    		});
    	}
    }
    
    function addPackage(newRec, weight, length, height, width, fedex_ref){
    	try{
			newRec.insertLine({
			    sublistId: 'packagefedex',
			    line: 0,
			});	
			newRec.setSublistValue({
				sublistId: 'packagefedex',
	    		fieldId: 'reference1fedex',
				line: 0,
				value: fedex_ref
			}); 
			newRec.setSublistValue({
			    sublistId: 'packagefedex',
			    fieldId: 'packageweightfedex',
			    line: 0,
			    value: weight
			});
			newRec.setSublistValue({
			    sublistId: 'packagefedex',
			    fieldId: 'packagelengthfedex',
			    line: 0,
			    value: length
			});
			newRec.setSublistValue({
			    sublistId: 'packagefedex',
			    fieldId: 'packageheightfedex',
			    line: 0,
			    value: height
			});
			newRec.setSublistValue({
			    sublistId: 'packagefedex',
			    fieldId: 'packagewidthfedex',
			    line: 0,
			    value: width
			});	
    	}catch(ex){    		
    		var processMssg 	= 'processing Package sublist ';
    		var errorStr = (ex.id != null) ? ex.id + '\n' + ex.name + '\n' + ex.message + '\n'  : ex.toString();
    		log.error({
    		    title: 'addPackage', 
    		    details: 'Error encountered while ' + processMssg  + ' (' +  errorStr + ')'
    		});
    	}
    }
               
    return {
        beforeSubmit: beforeSubmit
    };   
});