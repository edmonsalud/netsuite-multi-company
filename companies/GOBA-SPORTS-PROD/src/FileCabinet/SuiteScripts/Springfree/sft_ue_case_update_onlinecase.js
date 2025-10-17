/**
 * Module Description
 * 
 * Version  Date      	Author			Remarks
 * 1.00		14-09-16	Eric.Choe		Moved modules for warranty cases and created new modules for estimate		
 * 1.01		17-05-17	Eric.Choe		Updated function convertTrampModel to include new Trampoline Model R132
 * 										Added new list value to following custom lists in NetSuite
 * 											- For Entity field:	Model / customlist_model
 * 											- For CRM field:	Trampoline Model - List / customlist_trampoline_model_list
 * 1.02		12-07-17	Eric.Choe		Updated function updateCustomer_Warranty not to update department/filtered campaign if Lead was created from Event
 * 1.03		19-10-17	Eric.Choe		Updated function updateCustomer_Warranty(caseType)
 * 											- Disabled script - to check "Warranty Registered" tick box in customer record
 * 1.20		28-02-18	Eric.Choe		Created following new function for "Online Yard Assessment" form
 * 											- function updateCustomer_Service()
 * 1.21		30-10-19	Eric.Choe		Updated function convertTrampModel(trampModel) to include following new model
 * 											- R30
 * 											- O47
 * 1.22		17-08-21	R.Basile		Updated custom form to include Estimate Request NDIS requirements
 * 1.23		23-08-21	R.Basile		Updated to include NZ Estimate case form requirements
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */

function updateOnlineCase_AfterSubmit(type) {
    try {
        if (type == 'create' && nlapiGetContext().getExecutionContext() == 'userevent' && nlapiGetContext().getRoleId() == 'online_form_user') { // If case is created from online form
            var caseType = nlapiGetFieldValue('custevent_case_type');
            var NDISType = nlapiGetFieldValue('custevent_ndis_funding_type');
            var title = nlapiGetFieldValue('title'); // Get the case title
            var curRec = nlapiLoadRecord('supportcase', nlapiGetRecordId());

            // New condition: caseType == '118' and title == 'Upgrade to Springfree Promotion'
            if (caseType == '118' && title == 'Upgrade to Springfree Promotion') {
                if (nlapiGetFieldValue('customform') != '157') { // '157' = SFT Case Form - Sales
                    curRec.setFieldValue('customform', '157'); // Set custom form to 157
                    curRec.setFieldValue('custevent_case_service_type', '73'); // Set service type to Promotion (internal ID 73)
                    nlapiSubmitRecord(curRec, false, true);
                    nlapiLogExecution('DEBUG', 'Update Case Form', 'Case: Custom Form set to 157, Service Type set to 73');
                }
            }
            else if (caseType == '15' || caseType == '16') { // Warranty = 15, Warranty Registration = 16
                if (nlapiGetFieldValue('customform') != '81') { // Updating "Custom Form", 81 = SFT Case Form - Warranty
                    curRec.setFieldValue('customform', '81');
                    nlapiSubmitRecord(curRec, false, true);
                    nlapiLogExecution('DEBUG', 'Update Case Form', 'Warranty: Custom Form : ' + curRec.getFieldValue('customform'));
                }
                updateCustomer_Warranty(caseType);
            }

            else if (caseType == '118' && (NDISType == '1' || NDISType == '2' || NDISType == '3')) { // '118'= Estimate Request with NDISType 1, 2, or 3
                if (nlapiGetFieldValue('customform') != '157') { // Updating "Custom Form", '157' = SFT Case Form - Sales
                    curRec.setFieldValue('customform', '157');
                    curRec.setFieldValue('custevent_case_service_type', '67');    
                    nlapiSubmitRecord(curRec, false, true);
                    nlapiLogExecution('DEBUG', 'Update Case Form', 'Estimate Request: Custom Form : ' + curRec.getFieldValue('customform') + ' , NDISType : ' + curRec.getFieldValue('custevent_ndis_funding_type'));
                }
                updateCustomer_Estimate(caseType);
            }

            else if (caseType == '118' && (NDISType !== '1' || NDISType !== '2' || NDISType !== '3')) { // '118'= Estimate Request without NDISType 1, 2, or 3
                if (nlapiGetFieldValue('customform') != '157') { // Updating "Custom Form", '157' = SFT Case Form - Sales
                    curRec.setFieldValue('customform', '157');
                    nlapiSubmitRecord(curRec, false, true);
                    nlapiLogExecution('DEBUG', 'Update Case Form', 'Estimate Request: Custom Form : ' + curRec.getFieldValue('customform') + ' , NDISType : ' + curRec.getFieldValue('custevent_ndis_funding_type'));
                }
                updateCustomer_Estimate(caseType);
            }

            else if (caseType == '13') {
                updateCustomer_Service();
            }
        }
    } catch (ex) {
        var processMssg = 'Error encountered while processing Online Case \n';
        var errorStr = ex.toString();
        if (ex instanceof nlobjError) {
            errorStr = getErrorMessage(ex);
        }
        nlapiLogExecution('ERROR', 'updateOnlineCase_AfterSubmit', processMssg + ' ' + errorStr);
    }
}

function updateCustomer_Service(){
	try{
		var custID			= nlapiGetFieldValue('company');
		var custRec			= nlapiLoadRecord('customer', custID); 
		var custType		= custRec.getFieldValue('entitystatus');
		var custSub			= custRec.getFieldValue('subsidiary');		
		var custCategory	= '';
		var custDept		= '';
		var custFilterdCamp	= '';

		switch(custSub){ //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2
			case '1':
				custCategory = '3'; //Consumer
				custDept = '13'; //Kunda Park
				custFilterdCamp = 14973910; //5416 AU Measure Your Yard Service, SANDBOX = 10016929, 4191 AU 2018 Backyard Play  
				break;
						
			case '5':
				custCategory = '3'; //Consumer
				custDept = '47'; //Christchurch:Direct Sales
				custFilterdCamp = '430044'; //812 NZ Previous/Existing Customers			
				break;
	/*			
			case '3':
				custCategory = '8'; //Customer via 3rd Party
				custDept = '6'; //Customer Care
				custFilterdCamp = '431635'; //857 US Existing Customer			
				break;
		
			case '4':
				custCategory = '8'; //Customer via 3rd Party
				custDept = '6'; //Customer Care
				custFilterdCamp = '812185'; //1694 CA Existing Customer		
				break;

	*/
		}
			
		if(custType == '6' && custSub == '1' || custType == '6' && custSub == '5'){//Lead Unqualified & AU || NZ only
			custRec.setFieldValue('entitystatus', '7');//Update Status to "Prospect-Qualified"			
			custRec.setFieldValue('category', custCategory);
			custRec.setFieldValue('custentity_customer_department', custDept);			
			custRec.setFieldValue('custentity_lead_source_class', '1'); // 1 = Online		
			custRec.setFieldValue('custentity_sp_filtered_campaign_source', custFilterdCamp);
			custRec.setFieldValue('leadsource', custFilterdCamp);			
		}		
		nlapiSubmitRecord(custRec, false, true); //Submit customer record and ignore mandatory fields & sourcing
		nlapiLogExecution('DEBUG', 'Update Customer', 'Service: Customer ID : ' + custRec.getId());
	}catch(ex){
		var processMssg	= 'Error encountered while processing Online Case \n';
		var errorStr 	= ex.toString();
		if (ex instanceof nlobjError){
			errorStr = getErrorMessage(ex);
		}
	    nlapiLogExecution('ERROR', 'updateCustomer_Service', processMssg  + ' ' +  errorStr);
	}	
}


function updateCustomer_Estimate(caseType){
	var custID = nlapiGetFieldValue('company');
	var custRec = nlapiLoadRecord('customer', custID); 
	var custType = custRec.getFieldValue('entitystatus');
	var custSub = custRec.getFieldValue('subsidiary');
	
	var custCategory = '';
	var custDept = '';
	var custChannelReferral = nlapiGetFieldValue('custevent_case_channel_referral'); // Submitted value
	var custFilterdCamp = '';

	switch(custSub){ //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2
		case '1':
			custCategory = '3'; //Consumer
			custDept = '13'; //Kunda Park
			custFilterdCamp = 2484227; //2212 AU Lead Gen SFT Web Estimate Form 
			break;
				
		case '5':
			custCategory = '3'; //Consumer
			custDept = '47'; //Christchurch:Direct Sales
			custFilterdCamp = '430044'; //812 NZ Previous/Existing Customers			
			break;
/*			
		case '3':
			custCategory = '8'; //Customer via 3rd Party
			custDept = '6'; //Customer Care
			custFilterdCamp = '431635'; //857 US Existing Customer			
			break;
	
		case '4':
			custCategory = '8'; //Customer via 3rd Party
			custDept = '6'; //Customer Care
			custFilterdCamp = '812185'; //1694 CA Existing Customer		
			break;

*/
	}
		
	if(custType == '6' && custSub == '1' || custType == '6' && custSub == '5'){//Lead Unqualified & AU || NZ only
		custRec.setFieldValue('entitystatus', '7');//Update Status to "Prospect-Qualified"
		
		custRec.setFieldValue('category', custCategory);
		custRec.setFieldValue('custentity_customer_department', custDept);
		
		if(!isNULL(custChannelReferral)){ // Update MARKETING CHANNEL REFERRAL if it's not empty in Case
			custRec.setFieldValue('custentity_lead_source_class', custChannelReferral);
		}
				
		custRec.setFieldValue('custentity_sp_filtered_campaign_source', custFilterdCamp);
		custRec.setFieldValue('leadsource', custFilterdCamp);
		

	}		
	nlapiSubmitRecord(custRec, false, true); //Submit customer record and ignore mandatory fields & sourcing
	nlapiLogExecution('DEBUG', 'Update Customer', 'Estimate: Customer ID : ' + custRec.getId());
}


function updateCustomer_Warranty(caseType){
	var custID = nlapiGetFieldValue('company');
	var custRec = nlapiLoadRecord('customer', custID); 
	var custType = custRec.getFieldValue('entitystatus');
	var custSub = custRec.getFieldValue('subsidiary');
	
	var custCategory = '';
	var custDept = '';
	var custChannelReferral = '';
	var custFilterdCamp = '';

	switch(custSub){ //AU = 1, US = 3, CA = 4, NZ = 5, Global = 2
		case '1':
			custCategory = '3'; //Consumer
			custDept = '13'; //Kunda Park
			custChannelReferral = '12'; //Existing Customer
			custFilterdCamp = 1240; //317 AU Existing Customer
			break;
			
		case '3':
			custCategory = '8'; //Customer via 3rd Party
			custDept = '6'; //Customer Care
			custChannelReferral = '20'; //Retailer or Dealer
			custFilterdCamp = '431635'; //857 US Existing Customer			
			break;
	
		case '4':
			custCategory = '8'; //Customer via 3rd Party
			custDept = '6'; //Customer Care
			custChannelReferral = '20'; //Retailer or Dealer
			custFilterdCamp = '812185'; //1694 CA Existing Customer		
			break;
	
		case '5':
			custCategory = '3'; //Consumer
			custDept = '47'; //Christchurch:Direct Sales
			custChannelReferral = '12'; //Existing Customer
			custFilterdCamp = '430044'; //812 NZ Previous/Existing Customers			
			break;
	}
		
	var case_Tramp = convertTrampModel(nlapiGetFieldValue('custevent_trampoline_model'));
	var case_Frame = nlapiGetFieldValue('custevent_sn_frame');
	var case_Mat = nlapiGetFieldValue('custevent_sn_mat');
	var case_Net = nlapiGetFieldValue('custevent_sn_enclosure');

	var case_Step = nlapiGetFieldValue('custevent_flexrstep');// Non Mandantory field
	var case_Hoop = nlapiGetFieldValue('custevent_flexrhoop');// Non Mandantory field
	var case_tgoma = nlapiGetFieldValue('custevent_tgoma');// Non Mandantory field
	
	if(custType == '6'){//Lead Unqualified
		var cust_Leadsource = custRec.getFieldValue('leadsource');
		
		custRec.setFieldValue('entitystatus', '13');//Update Status to Customer Won
		
		custRec.setFieldValue('category', custCategory); //Update/override Category
		
		if(isNULL(custRec.getFieldValue('custentity_customer_department'))){
			custRec.setFieldValue('custentity_customer_department', custDept);
		}
		
		if(isNULL(custRec.getFieldValue('custentity_lead_source_class'))){
			custRec.setFieldValue('custentity_lead_source_class', custChannelReferral);
		}
		
		if(isNULL(custRec.getFieldValue('custentity_sp_filtered_campaign_source'))){
			if(!isNULL(cust_Leadsource)){//Use existing Lead Source
				custRec.setFieldValue('custentity_sp_filtered_campaign_source', cust_Leadsource);
			}
			else{//Use default value
				custRec.setFieldValue('custentity_sp_filtered_campaign_source', custFilterdCamp);
			}
		}

		if(isNULL(cust_Leadsource)){
			custRec.setFieldValue('leadsource', custFilterdCamp);
		}
		
		// Disabled below as of 13-11-17
/*		if(caseType == '16'){// Check Warranty Registered tick box if Case Type is Warranty Registration
			custRec.setFieldValue('custentity_warranty_registered', 'T');
		}*/
		
		if(!isNULL(case_Tramp) && isNULL(custRec.getFieldValue('custentity_modelproductsupport'))){
			custRec.setFieldValue('custentity_modelproductsupport', case_Tramp);
		}
		
		if(!isNULL(case_Frame) && isNULL(custRec.getFieldValue('custentityserialframe1'))){
			custRec.setFieldValue('custentityserialframe1', case_Frame);
		}

		if(!isNULL(case_Mat) && isNULL(custRec.getFieldValue('custentityserialmat'))){
			custRec.setFieldValue('custentityserialmat', case_Mat);
		}

		if(!isNULL(case_Net) && isNULL(custRec.getFieldValue('custentityserialnet'))){
			custRec.setFieldValue('custentityserialnet', case_Net);
		}

		if(!isNULL(case_Step) && isNULL(custRec.getFieldValue('custentityserialflexrstep'))){
			custRec.setFieldValue('custentityserialflexrstep', case_Step);
		}

		if(!isNULL(case_Hoop) && isNULL(custRec.getFieldValue('custentityserialflexrhoop'))){
			custRec.setFieldValue('custentityserialflexrhoop', case_Hoop);
		}

		if(!isNULL(case_tgoma) && isNULL(custRec.getFieldValue('custentity_default_tgoma_sn'))){ // If there is tgoma s/n in case and default tgoma s/n is empty in customer record  
			nlapiSubmitField('supportcase', nlapiGetRecordId(), 'custevent_linked_tgoma', createTgoma(case_tgoma, custID), true); // Updating "LINKED TGOMA IN CUSTOMER RECORD" in case
			custRec.setFieldValue('custentity_default_tgoma_sn', case_tgoma); //Updating Default tgoma S/N
		}	
	}		
	nlapiSubmitRecord(custRec, false, true); //Submit customer record and ignore mandatory fields & sourcing
	nlapiLogExecution('DEBUG', 'Update Customer', 'Warranty: Customer ID : ' + custRec.getId());
}

function createTgoma(case_tgoma, custID){//Create new tgoma s/n object and return internal ID
	var newRec = nlapiCreateRecord('customrecord_tgoma');

	newRec.setFieldValue('name',case_tgoma);
	newRec.setFieldValue('custrecord_sn',parseInt(case_tgoma)); //convert case_tgoma to integer
	newRec.setFieldValue('custrecord_cust',custID);
	
	return nlapiSubmitRecord(newRec, false, true);
}

function convertTrampModel(trampModel){
	
	switch(trampModel){//Converting Field Value, "Trampoline Model - List" => "Model"	
	case '1' :
		trampModel = '9';
		break;
	case '2' :
		trampModel = '11';
		break;
	case '3' :
		trampModel = '7';
		break;
	case '4' :
		trampModel = '10';
		break;
	case '5' :
		trampModel = '12';
		break;
	case '6' :
		trampModel = '8';
		break;
	case '7' :
		trampModel = '1';
		break;
	case '8' :
		trampModel = '2';
		break;
	case '9' :
		trampModel = '5';
		break;
	case '10' :
		trampModel = '6';
		break;
	case '11' :
		trampModel = '3';
		break;
	case '12' :
		trampModel = '4';
		break;
	case '13' :
		trampModel = '13';
		break;
	case '14' :
		trampModel = '14';
		break;
	case '15' :
		trampModel = '15';
		break;
	}
	
	return trampModel;	
}