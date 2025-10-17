/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     04-04-19	Eric.Choe		Created following functions to replicate item pricing in child customer record
 * 											- function afterSubmit(scriptContext)
 * 											- function copyItemPricing(parent_id, child_id)
 * 
**/


/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', './lib/utils'],
/**
 * @param {record} record
 * @param {record} utils
 */
function(record, utils) {

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
    	try{
    		if(utils.isUI()){
    			var eventType		= scriptContext.type;
    			var recSubsidiary	= scriptContext.newRecord.getValue({
    	    		fieldId: 'subsidiary'
    	    	});
    	    	var parentRec		= scriptContext.newRecord.getValue({
    	    		fieldId: 'parent'
    	    	});    	    	
    	    	if(/*eventType == 'create' &&*/ recSubsidiary == '1' && parentRec || recSubsidiary == '5' && parentRec){// AU = 1, US = 3, CA = 4, NZ = 5,    	    		
    	    		// Copy Item Pricing from parent record
    	    		copyItemPricing(parentRec,scriptContext.newRecord.id);
    	    	}
    		}
    	}catch(ex){    		
    		var processMssg 	= 'processing Copying Item Pricing';
    		var errorStr = (ex.id != null) ? ex.id + '\n' + ex.name + '\n' + ex.message + '\n'  : ex.toString();
    		log.error({
    		    title: 'afterSubmit', 
    		    details: 'Error encountered while ' + processMssg  + ' (' +  errorStr + ')'
    		});
    	}
    }
    
    function copyItemPricing(parent_id, child_id){
		var parentRec = record.load({
		    type: record.Type.CUSTOMER, 
		    id: parent_id,
		});
		var totalLineItem = parentRec.getLineCount({
    		sublistId: 'itempricing'
    	}); 
		if(totalLineItem>0){
			// Load Child record
			var childRec = record.load({
			    type: record.Type.CUSTOMER, 
			    id: child_id,
			    isDynamic: true 
			});
			// Get item pricing from parent and add it to child record.
			for(var i = 0; i<totalLineItem; i++){ // Caution: Line item index starts from 0, not 1 
				// Get item pricing from parent record
				var itempricing_Currency = parentRec.getSublistValue({
        		    sublistId: 'itempricing',
        		    fieldId: 'currency',
        		    line: i
        		});
				var itempricing_Item = parentRec.getSublistValue({
        		    sublistId: 'itempricing',
        		    fieldId: 'item',
        		    line: i
        		});
				var itempricing_PriceLevel = parentRec.getSublistValue({
        		    sublistId: 'itempricing',
        		    fieldId: 'level',
        		    line: i
        		});
				var itempricing_UnitPrice = parentRec.getSublistValue({
        		    sublistId: 'itempricing',
        		    fieldId: 'price',
        		    line: i
        		});
				// Add new item pricing to child record
				childRec.selectNewLine({sublistId: 'itempricing'});
				childRec.setCurrentSublistValue({
        		    sublistId: 'itempricing',
        		    fieldId: 'currency',
        		    value: itempricing_Currency,
        		    ignoreFieldChange: true
        		});
				childRec.setCurrentSublistValue({
        		    sublistId: 'itempricing',
        		    fieldId: 'item',
        		    value: itempricing_Item,
        		    ignoreFieldChange: true
        		});
				childRec.setCurrentSublistValue({
        		    sublistId: 'itempricing',
        		    fieldId: 'level',
        		    value: itempricing_PriceLevel,
        		    ignoreFieldChange: true
        		});
				childRec.setCurrentSublistValue({
        		    sublistId: 'itempricing',
        		    fieldId: 'price',
        		    value: itempricing_UnitPrice,
        		    ignoreFieldChange: true
        		});
				childRec.commitLine({sublistId: 'itempricing'});
			}
			// Save child record
			childRec.save({       
        		enableSourcing: false,
        		ignoreMandatoryFields : true
        	});
			log.audit({
			    title: 'afterSubmit', 
			    details: 'Item Pricing is replicated in customer id ' + child_id + ', total ' + totalLineItem
			});
		}
    }
    return {
        afterSubmit: afterSubmit
    };   
});