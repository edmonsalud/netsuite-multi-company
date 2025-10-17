/**
 * Module Description
 * 
 * Version  Date        Author          Remarks
 * 1.00		29-11-18	Eric.Choe		Created following functions for 8x8 integration enhancement - NA
 * 											- function transaction_FieldChanged(type, name, linenum)
 * 											- function controlRecording(name)
 * 											- function submitRequest(action)
 * 
 * 1.01		07-02-18	Eric.Choe		Added AU to following function
 * 											- function transaction_FieldChanged(type, name, linenum)
 * 										Created script deployment on "Customer Payment"
 *
 */


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */


function transaction_FieldChanged(type, name, linenum){
	var subSidiary = nlapiGetFieldValue('subsidiary');	
	if((subSidiary == '3' || subSidiary == '4' || subSidiary == '1') && (name == 'paymentmethod' || name == 'ccsecuritycode' || name == 'ccname')){// AU = 1, US = 3, CA = 4, NZ = 5,
		controlRecording(name);
	} 
}


function controlRecording(name){//Submitting 8x8 API request to stop/resume call recording
	try{		
		var recType 		= nlapiGetRecordType();
		var processMssg		= 'Processing ' + recType;
		var paymentMethod	= nlapiGetFieldValue('paymentmethod');

		if(paymentMethod == '4' || paymentMethod == '5' || paymentMethod == '6'){// 4 = Master Card, 5 = Visa, 6 = American Express
			switch (name){	
			
			case 'paymentmethod':																	
				nlapiLogExecution('DEBUG', 'callRecording', 'Submitting Pause Request : ' + recType + ', ' + nlapiGetFieldText('customer') + ', ' + nlapiGetFieldText('paymentmethod'));
				submitRequest('pause');
				break;	
				
			case 'ccsecuritycode':
				nlapiLogExecution('DEBUG', 'callRecording', 'Submitting Resume Request : ' + recType + ', ' + nlapiGetFieldText('customer') + ', ' + nlapiGetFieldText('paymentmethod'));
				submitRequest('resume');
				break;
			
			case 'ccname':
				if(recType == 'customerrefund'){
					nlapiLogExecution('DEBUG', 'callRecording', 'Submitting Resume Request : ' + recType + ', ' + nlapiGetFieldText('customer') + ', ' + nlapiGetFieldText('paymentmethod'));
					submitRequest('resume');
					break;
				}
			}
		}
	}catch(ex){
		var errorStr = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n'  : ex.toString();
		nlapiLogExecution('Error', 'controlRecording', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}
}


function submitRequest(action){ // submitRequest('pause'), submitRequest('resume')
	try{
		var processMssg 	= 'Submitting 8x8 API Request';
		var actionType		= (action == 'pause') ? 'Pause' : 'Resume';
		var requestURL		= 'https://vcc-ca2b.8x8.com/AGUI/controlRecording.php?action=' + action + '&token=42a5220c63f133ffd12ea448bad70401';
	    var iFrame = document.createElement('iframe');
	    iFrame.src = requestURL;
	    iFrame.onload = function () {       
	        document.body.removeChild(iFrame);
	    }  
	    document.body.appendChild(iFrame);
	    nlapiLogExecution('DEBUG', 'submitRequest', 'Completing ' + actionType + ' Request : ' + nlapiGetRecordType() + ', ' + nlapiGetFieldText('customer') + ', ' + nlapiGetFieldText('paymentmethod'));		
	}catch(ex){
		var errorStr = (ex.getCode != null) ? ex.getCode() + '\n' + ex.getDetails() + '\n'  : ex.toString();
		nlapiLogExecution('Error', 'submitRequest', 'Error encountered while ' + processMssg  + ' ' +  errorStr);
	}		
}