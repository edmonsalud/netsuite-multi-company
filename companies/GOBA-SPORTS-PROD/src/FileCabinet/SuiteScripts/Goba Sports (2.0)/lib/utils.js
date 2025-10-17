/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     04-04-19	Eric.Choe		Created following functions for 2.0 library
 * 											- function isNull(valueStr)
 * 											- function isUI()
 * 											- getErrorMessage(ex)
 * 
**/

/**
 * @NApiVersion 2.0
 */

define(['N/runtime'],
/**
 * @param {runtime} runtime
 */	
		
function(runtime) {

	function isUI(){
		if(runtime.executionContext === runtime.ContextType.USER_INTERFACE){
			return true;
		}
		else{
			return false;
		}
	}
	
	function getErrorMessage(ex){// To return full details of error message
		var errorMssg 	= ex.toString();
		var stackTrace	= ex.stack;
		if (stackTrace){			
			errorMssg	= 'Error Name : ' + ex.name + ', ' + '\n'
						+ 'Message : ' + ex.message + ', '+ '\n'
						+ 'Stack Trace : ' + ex.stack;	
		}		
		return errorMssg
	}
	  
    return {
    	isUI:	isUI,
    	getErrorMessage: getErrorMessage,
    };    
});