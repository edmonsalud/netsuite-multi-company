/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     07-12-18	Eric.Choe		Created following function for email validation using "neverbounce" API
 * 											- function beforeLoad(scriptContext)
 * 
**/

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/runtime'],
/**
 * @param {serverWidget} serverWidget
 */
function(serverWidget, runtime) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
    	var recSubsidiary = scriptContext.newRecord.getValue({
    		fieldId: 'subsidiary'
    	});
    	var userSubsidiary = runtime.getCurrentUser().subsidiary;
    	var eventType = scriptContext.type;
    	
    	if((recSubsidiary == '5' || userSubsidiary == '5') && (eventType == 'create' ||eventType == 'edit')){// AU = 1, US = 3, CA = 4, NZ = 5,
        	var currForm = scriptContext.form;
        	var disableNB = currForm.addField({
        		id: 'custpage_disable_nb',
        		type: serverWidget.FieldType.CHECKBOX,
        		label: 'Disable Email Validation'
        	});
        	disableNB.setHelpText({
        	    help : "Check this box to disable email validation."
        	});
        	currForm.insertField({
        	    field : disableNB,
        	    nextfield : 'altemail'
        	});
        	var invalidEmail = currForm.addField({
        		id: 'custpage_invalid_email',
        		type: serverWidget.FieldType.CHECKBOX,
        		label: 'Invalid Email'
        	});
        	currForm.insertField({
        	    field : invalidEmail,
        	    nextfield : 'altemail'
        	});
        	invalidEmail.updateDisplayType({
        	    displayType : serverWidget.FieldDisplayType.HIDDEN
        	});
    	}
    }

    return {
        beforeLoad: beforeLoad,
    };
    
});