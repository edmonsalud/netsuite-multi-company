/**
 * Module Description
 * 
 * Version  Date		Author          Remarks
 * 1.00     25-11-19	Eric.Choe		Created following function
 * 											- function validateLine(scriptContext)
 * 
 */

/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

function() { 

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
    	var recSubsidiary = scriptContext.currentRecord.getValue({
    		fieldId: 'subsidiary'
    	}); 	
    	if(recSubsidiary == '3' || recSubsidiary == '4'){// AU = 1, US = 3, CA = 4, NZ = 5
    		var recForm = scriptContext.currentRecord.getValue({
        		fieldId: 'customform'
        	});
    		if(recForm == '152' || recForm == '167' || recForm == '128'){ // 152 = "SFT Sales Order (Direct Sales) NA", 167 = "*SFT Sales Order (Web Store) NA", 128 = "SFT Sales Order (Dealer/Wholesaler Inv)"
    			var sublistName = scriptContext.sublistId;		
    			if(sublistName == 'item'){
        			var curItem = scriptContext.currentRecord.getCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'item'
                    });
        			if(curItem == '106362'){ // 106362 = Custom Nametag
        				var nameTag = scriptContext.currentRecord.getCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'custcol_nametag_field'
                        });
        				// Return error message if "NAMETAG" record is missing in "Custom Nametag" item
        				if(!nameTag){ 
            				alert('Please select/add "NAMETAG" record');
            				return false;
            			}       				
        			}      		
    			}
    		}
    	}
    	return true;
    }

    return {
        validateLine: validateLine,

    };
    
});