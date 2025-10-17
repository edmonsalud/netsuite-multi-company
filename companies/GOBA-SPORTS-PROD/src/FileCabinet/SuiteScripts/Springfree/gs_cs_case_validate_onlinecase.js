/**
 * Module Description
 * 
 * Version  Date		Author          Remarks
 * 1.00     31-07-18	Eric.Choe		Created following functions (Notes: version 2.0 was not used due to user experience issue on error message layout)
 * 											- function contactUS_SaveRecord() : To replace NS standard validation/error message
 * 											- function contactUS_ValidateFields(enable_mssg) : To display custom error message if any of required field is empty
 * 											- function validate_Name_Email()
 * 											- function isNULL(value)							
 * 2.00		07-08-18	Eric.Choe		Created following functions for warranty claim forms 
 * 											- function warrantyClaim_SaveRecord() : To replace NS standard validation/error message
 * 											- warrantyClaim_ValidateFields(enable_mssg) : To display custom error message if any of required field is empty
 * 											- function validate_WarrantyFields() : To validate common fields in warranty claim and registration form  
 * 											- function warrantyRegi_SaveRecord() : To replace NS standard validation/error message
 * 											- warrantyRegi_ValidateFields(enable_mssg) : To display custom error message if any of required field is empty
 * 2.10		12-11-18	Eric.Choe		Created following function to validate email address (Requested by Nert/Miz)
 * 											- window.addEventListener('load', function () {...}
 * 2.20		28-02-19	Eric.Choe		Created following function for yard assessment form (AU)
 * 											- function yardAssessment_SaveRecord()
 * 											- function yardAssessment_ValidateFields(enable_msg)
 * 2.30		07-07-20	Eric.Choe		Created following function for expression of interest form (AU)
 * 											- function eoInterest_SaveRecord()
 * 											- function eoInterest_ValidateFields(enable_msg)
 * 2.40		24-08-21	R.Basile		Created following function for NDIS form (AU)
 * 											- function ndis_SaveRecord()
 * 											- function ndis_ValidateFields(enable_mssg)
 * 2.50     24-04-23    Richard.Ng       Removed validation for enclosure and mat
 * 2.60     14-10-24	R.Basile		Created following function for Upgrade to Springfree form (AU)
 *											- function upgrade2springfree_SaveRecord()
 *											- function upgrade2springfree_ValidateFields(enable_msg)
 */

function eoInterest_SaveRecord(){	
    return eoInterest_ValidateFields(false);	
}

function eoInterest_ValidateFields(enable_mssg){
    var subSidiary = nlapiGetFieldValue('subsidiary');	
    var errorMssg = validate_Name_Email();	
    if(isNULL(nlapiGetFieldValue('phone'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Mobile';
        }
        else{
            errorMssg += '\n' + '  Mobile';
        }
    }
    if(isNULL(nlapiGetFieldValue('custevent_case_city'))){
        if(isNULL(errorMssg)){			
            if(subSidiary == '5'||subSidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg = '  Suburb';
            }
            else{
                errorMssg = '  City';
            }
        }
        else{
            if(subSidiary == '5'||subSidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg += '\n' + '  Suburb';
            }
            else{
                errorMssg += '\n' + '  City';
            }
        }
    }
    if(isNULL(nlapiGetFieldValue('custevent_case_state_new'))){
        if(isNULL(errorMssg)){
            errorMssg = '  State';
        }
        else{
            errorMssg += '\n' + '  State';
        }
    }
    if(isNULL(nlapiGetFieldValue('custevent_case_postcode'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Post Code';
        }
        else{
            errorMssg += '\n' + '  Post Code';
        }
    }	
    if(isNULL(nlapiGetFieldValue('custevent_item_trampoline'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Choose your trampoline';
        }
        else{
            errorMssg += '\n' + '  Choose your trampoline';
        }
    }
    if(isNULL(nlapiGetFieldValue('custevent_item_accessory'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Select your trampoline accessories';
        }
        else{
            errorMssg += '\n' + '  Select your trampoline accessories';
        }
    }	
    if(!isNULL(errorMssg)){
        if(enable_mssg){
            alert('Please enter following necessary field(s) before submitting.' + '\n\n' + errorMssg);
            nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
        }
        return false;
    }
    nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
    return true;
}

function ndis_SaveRecord(){	
    return ndis_ValidateFields(false);	
}

function ndis_ValidateFields(enable_mssg){
    var subSidiary = nlapiGetFieldValue('subsidiary');	
    var errorMssg = validate_Name_Email();	
    if(isNULL(nlapiGetFieldValue('phone'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Mobile';
        }
        else{
            errorMssg += '\n' + '  Mobile';
        }
    }
    if(isNULL(nlapiGetFieldValue('custevent_case_city'))){
        if(isNULL(errorMssg)){			
            if(subSidiary == '5'||subSidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg = '  Suburb';
            }
            else{
                errorMssg = '  City';
            }
        }
        else{
            if(subSidiary == '5'||subSidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg += '\n' + '  Suburb';
            }
            else{
                errorMssg += '\n' + '  City';
            }
        }
    }
    if(isNULL(nlapiGetFieldValue('custevent_case_state_new'))){
        if(isNULL(errorMssg)){
            errorMssg = '  State';
        }
        else{
            errorMssg += '\n' + '  State';
        }
    }
    if(isNULL(nlapiGetFieldValue('custevent_case_postcode'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Post Code';
        }
        else{
            errorMssg += '\n' + '  Post Code';
        }
    }	
    if(isNULL(nlapiGetFieldValue('custevent_case_recommended_model'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Choose your trampoline';
        }
        else{
            errorMssg += '\n' + '  Choose your trampoline';
        }
    }
    if(!isNULL(errorMssg)){
        if(enable_mssg){
            alert('Please enter following necessary field(s) before submitting.' + '\n\n' + errorMssg);
            nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
        }
        return false;
    }
    nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
    return true;
}
function upgrade2springfree_SaveRecord(){	
    return upgrade2springfree_ValidateFields(false);	
}

function upgrade2springfree_ValidateFields(enable_mssg){
	var subSidiary = nlapiGetFieldValue('subsidiary');	
	var errorMssg = validate_Name_Email();	
	if(isNULL(nlapiGetFieldValue('phone'))){
		if(isNULL(errorMssg)){
			errorMssg = '  Mobile';
		}
		else{
			errorMssg += '\n' + '  Mobile';
		}
	}	
 if(isNULL(nlapiGetFieldValue('custevent_case_city'))){
    if(isNULL(errorMssg)){			
        if(subSidiary == '5'||subSidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
            errorMssg = '  Suburb';
        }
        else{
            errorMssg = '  City';
        }
    }
    else{
        if(subSidiary == '5'||subSidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
            errorMssg += '\n' + '  Suburb';
        }
        else{
            errorMssg += '\n' + '  City';
        }
    }
}

if(isNULL(nlapiGetFieldValue('custevent_case_state_new'))){
    // Check if subsidiary is not '5', as 'custevent_case_state_new' is not mandatory for NZ (subSidiary == 5)
    if(subSidiary != '5'){
        if(isNULL(errorMssg)){
            errorMssg = '  State';
        }
        else{
            errorMssg += '\n' + '  State';
        }
    }
}
	if(isNULL(nlapiGetFieldValue('custevent_case_postcode'))){
		if(isNULL(errorMssg)){
			errorMssg = '  Post Code';
		}
		else{
			errorMssg += '\n' + '  Post Code';
		}
	}	
	if(isNULL(nlapiGetFieldValue('custevent_promotion_item'))){
		if(isNULL(errorMssg)){
			errorMssg = '  Choose your trampoline';
		}
		else{
			errorMssg += '\n' + '  Choose your trampoline';
		}
	}
	if(!isNULL(errorMssg)){
        if(enable_mssg){
        	alert('Please enter following necessary field(s) before submitting.' + '\n\n' + errorMssg);
        	nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
        }
        return false;
 	}
	nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
    return true;
}
function yardAssessment_SaveRecord(){	
    return yardAssessment_ValidateFields(false);	
}

function yardAssessment_ValidateFields(enable_mssg){
    var subSidiary = nlapiGetFieldValue('subsidiary');	
    var errorMssg = validate_Name_Email();	
    if(isNULL(nlapiGetFieldValue('phone'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Phone';
        }
        else{
            errorMssg += '\n' + '  Phone';
        }
    }
    if(isNULL(nlapiGetFieldValue('custevent_case_city'))){
        if(isNULL(errorMssg)){			
            if(subSidiary == '5'||subSidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg = '  Suburb';
            }
            else{
                errorMssg = '  City';
            }
        }
        else{
            if(subSidiary == '5'||subSidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg += '\n' + '  Suburb';
            }
            else{
                errorMssg += '\n' + '  City';
            }
        }
    }
    if(isNULL(nlapiGetFieldValue('custevent_case_state_new'))){
        if(isNULL(errorMssg)){
            errorMssg = '  State';
        }
        else{
            errorMssg += '\n' + '  State';
        }
    }
    if(isNULL(nlapiGetFieldValue('custevent_case_recommended_model'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Trampoline Models of Interest';
        }
        else{
            errorMssg += '\n' + '  Trampoline Models of Interest';
        }
    }
    if(!isNULL(errorMssg)){
        if(enable_mssg){
            alert('Please enter following necessary field(s) before submitting.' + '\n\n' + errorMssg);
            nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
        }
        return false;
    }
    nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
    return true;
}

window.addEventListener('load', function () {
    
    var netsuite_email = document.querySelectorAll('input[data-nb-id]')[0];
    var neverbounce_email = document.querySelectorAll('input[data-nb-id]')[1];

    neverbounce_email.addEventListener('nb:result', function (e) {
        // Get result object
        console.log(e.detail);
        var validaition = e.detail.result.response.result;

        if (validaition !== 'invalid') { 
            $('input[type="submit"]').removeAttr('disabled');
            $('.neverbounce-email-text').css('display', 'none');
            netsuite_email.value = neverbounce_email.value;
        }
        else { 
            $('input[type="submit"]').attr('disabled', 'true');
            $('.neverbounce-email-text').css('display', 'block');
            netsuite_email.value = "";
        }
    });

    neverbounce_email.addEventListener('change', function (e) {
        console.log(e.target.value);
        if (e.target.value === '') {
            netsuite_email.value = "";
        }
    });

    function addEmailMessage(message) {
        if (document.querySelector('.neverbounce-email-text')) { return true; }
        var emailMessage = document.createElement("p");
        emailMessage.className = "neverbounce-email-text";
        emailMessage.innerText = "Please enter a valid email";
        emailMessage.style.color = "#f95050";
        emailMessage.style.marginBottom = "5px"; 
        emailMessage.style.fontSize = "16px";
        emailMessage.style.fontWeight = "600";
        emailMessage.style.display = "none";

    var submitBtn = document.querySelector("input[type='submit']");
    submitBtn.before(emailMessage);
    }
    
    addEmailMessage("Please enter a valid email");
    
});

function warrantyRegi_SaveRecord(){	
    return warrantyRegi_ValidateFields(false);	
}

function warrantyRegi_ValidateFields(enable_mssg){
    var subSidiary = nlapiGetFieldValue('subsidiary');	
    var errorMssg = validate_WarrantyFields(subSidiary);
    if(!isNULL(errorMssg)){
        if(enable_mssg){
            alert('Please enter following necessary field(s) before submitting.' + '\n\n' + errorMssg);
            nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
        }
        return false;
    }
    nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
    return true;
}

function warrantyClaim_SaveRecord(){	
    return warrantyClaim_ValidateFields(false);	
}

function warrantyClaim_ValidateFields(enable_mssg){
    var subSidiary = nlapiGetFieldValue('subsidiary');
    var errorMssg = validate_WarrantyFields(subSidiary);
    // Add validation on warranty claim only fields below
    if(isNULL(nlapiGetFieldValue('startdate'))){
        if(isNULL(errorMssg)){
            errorMssg = '  When was it first noticed';
        }
        else{
            errorMssg += '\n' + '  When was it first noticed';
        }
    }	
    if(isNULL(nlapiGetFieldValue('incomingmessage'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Details of concern';
        }
        else{
            errorMssg += '\n' + '  Details of concern';
        }
    }	
    if(isNULL(nlapiGetFieldValue('custevent_installer'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Who installed the trampoline';
        }
        else{
            errorMssg += '\n' + '  Who installed the trampoline';
        }
    }	
    if(isNULL(nlapiGetFieldValue('file'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Purchase Receipt ';
        }
        else{
            errorMssg += '\n' + '  Purchase Receipt ';
        }
    }
    if(!isNULL(errorMssg)){
        if(enable_mssg){
            alert('Please enter following necessary field(s) before submitting.' + '\n\n' + errorMssg);
            nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
        }
        return false;
    }
    nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
    return true;
}

function validate_WarrantyFields(subsidiary){
    var errorMssg = validate_Name_Email();	
    // Add common warranty fields validation below
    if(isNULL(nlapiGetFieldValue('phone'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Phone';
        }
        else{
            errorMssg += '\n' + '  Phone';
        }
    }		
    if(isNULL(nlapiGetFieldValue('custevent_case_add1'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Address 1';
        }
        else{
            errorMssg += '\n' + '  Address 1';
        }
    }	
    if(isNULL(nlapiGetFieldValue('custevent_case_city'))){
        if(isNULL(errorMssg)){			
            if(subsidiary == '5'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg = '  Suburb / Town';
            }
            else{
                errorMssg = '  City';
            }
        }
        else{
            if(subsidiary == '5'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg += '\n' + '  Suburb / Town';
            }
            else{
                errorMssg += '\n' + '  City';
            }
        }
    }
    if(isNULL(nlapiGetFieldValue('custevent_case_state_new'))){
        if(isNULL(errorMssg)){			
            if(subsidiary == '5'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg = '  City / Town';
            }
            else{
                errorMssg = '  State';
            }
        }
        else{
            if(subsidiary == '5'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg += '\n' + '  City / Town';
            }
            else{
                errorMssg += '\n' + '  State';
            }
        }
    }	
    if(isNULL(nlapiGetFieldValue('custevent_case_postcode'))){
        if(isNULL(errorMssg)){			
            if(subsidiary == '5'||subsidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg = '  Post Code';
            }
            else{
                errorMssg = '  Zip/Postal Code';
            }
        }
        else{
            if(subsidiary == '5'||subsidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg += '\n' + '  Post Code';
            }
            else{
                errorMssg += '\n' + '  Zip/Postal Code';
            }
        }
    }		
    if(isNULL(nlapiGetFieldValue('custevent_case_country'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Country';
        }
        else{
            errorMssg += '\n' + '  Country';
        }
    }		
    if(isNULL(nlapiGetFieldValue('custevent_trampoline_model'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Trampoline Model #';
        }
        else{
            errorMssg += '\n' + '  Trampoline Model #';
        }
    }	
    if(isNULL(nlapiGetFieldValue('custevent_purchase_date'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Date of Purchase';
        }
        else{
            errorMssg += '\n' + '  Date of Purchase';
        }
    }	
    if(isNULL(nlapiGetFieldValue('custevent_sn_frame'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Trampoline Serial Number';
        }
        else{
            errorMssg += '\n' + '  Trampoline Serial Number';
        }
    }
    if(isNULL(nlapiGetFieldValue('file'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Purchase Receipt ';
        }
        else{
            errorMssg += '\n' + '  Purchase Receipt ';
        }
     }
    return errorMssg;
}

function contactUS_SaveRecord(){	
    return contactUS_ValidateFields(false);	
}

function contactUS_ValidateFields(enable_mssg){
    var subSidiary = nlapiGetFieldValue('subsidiary');	
    var errorMssg = validate_Name_Email();	
    if(isNULL(nlapiGetFieldValue('phone')) && (subSidiary == '1' || subSidiary == '5')){// AU = 1, US = 3, CA = 4, NZ = 5
        if(isNULL(errorMssg)){
            errorMssg = '  Phone';
        }
        else{
            errorMssg += '\n' + '  Phone';
        }
    }
    if(isNULL(nlapiGetFieldValue('zipcode'))){
        if(isNULL(errorMssg)){			
            if(subSidiary == '5'||subSidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg = '  Post Code';
            }
            else{
                errorMssg = '  Zip/Postal Code';
            }
        }
        else{
            if(subSidiary == '5'||subSidiary == '1'){ // AU = 1, US = 3, CA = 4, NZ = 5
                errorMssg += '\n' + '  Post Code';
            }
            else{
                errorMssg += '\n' + '  Zip/Postal Code';
            }
        }
    }	
    if(isNULL(nlapiGetFieldValue('category'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Your query is about';
        }
        else{
            errorMssg += '\n' + '  Your query is about';
        }
    }	
    if(isNULL(nlapiGetFieldValue('custevent_case_channel_referral'))){
        if(isNULL(errorMssg)){
            errorMssg = '  How did you become aware of Springfree Trampoline?';
        }
        else{
            errorMssg += '\n' + '  How did you become aware of Springfree Trampoline?';
        }
    }	
    if(isNULL(nlapiGetFieldValue('title'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Subject';
        }
        else{
            errorMssg += '\n' + '  Subject';
        }
    }	
    if(isNULL(nlapiGetFieldValue('incomingmessage'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Message';
        }
        else{
            errorMssg += '\n' + '  Message';
        }
    }	
    if(!isNULL(errorMssg)){
        if(enable_mssg){
            alert('Please enter following necessary field(s) before submitting.' + '\n\n' + errorMssg);
            nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
        }
        return false;
    }
    nlapiSetFieldValue('subsidiary', '-1'); // Reset subsidiary flag field
    return true;
}

function validate_Name_Email(){
    var errorMssg = "";
    if(isNULL(nlapiGetFieldValue('firstname'))){
        if(isNULL(errorMssg)){
            errorMssg = '  First Name';
        }
        else{
            errorMssg += '\n' + '  First Name';
        }
    }	
    if(isNULL(nlapiGetFieldValue('lastname'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Last Name';
        }
        else{
            errorMssg += '\n' + '  Last Name';
        }
    }	
    if(isNULL(nlapiGetFieldValue('email'))){
        if(isNULL(errorMssg)){
            errorMssg = '  Email';
        }
        else{
            errorMssg += '\n' + '  Email';
        }
    }
    return errorMssg;
}

function isNULL(value){ // Check "value" is NULL or empty
    return(value == null || value == "" || value == undefined);
}

function fieldChangeUS(type, name)
{
   //  Prompt for additional information,  based on values already selected.
   if (name == 'zipcode')
   {
     var zipcode = nlapiGetFieldValue('zipcode');
    var state = '';

       if (zipcode >= 35000 && zipcode <= 36999) {

      st = 'AL';
      state = 'Alabama';

  }
     else if (zipcode >= 99500 && zipcode <= 99999) {
      st = 'AK';
      state = 'Alaska';

  } else if (zipcode >= 85000 && zipcode <= 86999) {
      st = 'AZ';
      state = 'Arizona';

  } else if (zipcode >= 71600 && zipcode <= 72999) {
      st = 'AR';
      state = 'Arkansas';

  } else if (zipcode >= 90000 && zipcode <= 96699) {
      st = 'CA';
      state = 'California';

  } else if (zipcode >= 80000 && zipcode <= 81999) {
      st = 'CO';
      state = 'Colorado';

  } else if (zipcode >= 6000 && zipcode <= 6999) {
      st = 'CT';
      state = 'Connecticut';

  } else if (zipcode >= 19700 && zipcode <= 19999) {
      st = 'DE';
      state = 'Delaware';

  } else if (zipcode >= 32000 && zipcode <= 34999) {
      st = 'FL';
      state = 'Florida';

  } else if (zipcode >= 30000 && zipcode <= 31999) {
      st = 'GA';
      state = 'Georgia';

  } else if (zipcode >= 96700 && zipcode <= 96999) {
      st = 'HI';
      state = 'Hawaii';

  } else if (zipcode >= 83200 && zipcode <= 83999) {
      st = 'ID';
      state = 'Idaho';

  } else if (zipcode >= 60000 && zipcode <= 62999) {
      st = 'IL';
      state = 'Illinois';

  } else if (zipcode >= 46000 && zipcode <= 47999) {
      st = 'IN';
      state = 'Indiana';

  } else if (zipcode >= 50000 && zipcode <= 52999) {
      st = 'IA';
      state = 'Iowa';

  } else if (zipcode >= 66000 && zipcode <= 67999) {
      st = 'KS';
      state = 'Kansas';

  } else if (zipcode >= 40000 && zipcode <= 42999) {
      st = 'KY';
      state = 'Kentucky';

  } else if (zipcode >= 70000 && zipcode <= 71599) {
      st = 'LA';
      state = 'Louisiana';
      
  } else if (zipcode >= 3900 && zipcode <= 4999) {
      st = 'ME';
      state = 'Maine';

  } else if (zipcode >= 20600 && zipcode <= 21999) {
      st = 'MD';
      state = 'Maryland';

  } else if (zipcode >= 1000 && zipcode <= 2799) {
      st = 'MA';
      state = 'Massachusetts';

  } else if (zipcode >= 48000 && zipcode <= 49999) {
      st = 'MI';
      state = 'Michigan';

  } else if (zipcode >= 55000 && zipcode <= 56999) {
      st = 'MN';
      state = 'Minnesota';
  } else if (zipcode >= 38600 && zipcode <= 39999) {
      st = 'MS';
      state = 'Mississippi';
  } else if (zipcode >= 63000 && zipcode <= 65999) {
      st = 'MO';
      state = 'Missouri';
  } else if (zipcode >= 59000 && zipcode <= 59999) {
      st = 'MT';
      state = 'Montana';
  } else if (zipcode >= 27000 && zipcode <= 28999) {
      st = 'NC';
      state = 'North Carolina';
  } else if (zipcode >= 58000 && zipcode <= 58999) {
      st = 'ND';
      state = 'North Dakota';
  } else if (zipcode >= 68000 && zipcode <= 69999) {
      st = 'NE';
      state = 'Nebraska';
  } else if (zipcode >= 88900 && zipcode <= 89999) {
      st = 'NV';
      state = 'Nevada';
  } else if (zipcode >= 3000 && zipcode <= 3899) {
      st = 'NH';
      state = 'New Hampshire';
  } else if (zipcode >= 7000 && zipcode <= 8999) {
      st = 'NJ';
      state = 'New Jersey';
  } else if (zipcode >= 87000 && zipcode <= 88499) {
      st = 'NM';
      state = 'New Mexico';
  } else if (zipcode >= 10000 && zipcode <= 14999) {
      st = 'NY';
      state = 'New York';
  } else if (zipcode >= 43000 && zipcode <= 45999) {
      st = 'OH';
      state = 'Ohio';
  } else if (zipcode >= 73000 && zipcode <= 74999) {
      st = 'OK';
      state = 'Oklahoma';
  } else if (zipcode >= 97000 && zipcode <= 97999) {
      st = 'OR';
      state = 'Oregon';
  } else if (zipcode >= 15000 && zipcode <= 19699) {
      st = 'PA';
      state = 'Pennsylvania';
  } else if (zipcode >= 300 && zipcode <= 999) {
      st = 'PR';
      state = 'Puerto Rico';
  } else if (zipcode >= 2800 && zipcode <= 2999) {
      st = 'RI';
      state = 'Rhode Island';
  } else if (zipcode >= 29000 && zipcode <= 29999) {
      st = 'SC';
      state = 'South Carolina';
  } else if (zipcode >= 57000 && zipcode <= 57999) {
      st = 'SD';
      state = 'South Dakota';
  } else if (zipcode >= 37000 && zipcode <= 38599) {
      st = 'TN';
      state = 'Tennessee';
  } else if ( (zipcode >= 75000 && zipcode <= 79999) || (zipcode >= 88500 && zipcode <= 88599) ) {
      st = 'TX';
      state = 'Texas';
  } else if (zipcode >= 84000 && zipcode <= 84999) {
      st = 'UT';
      state = 'Utah';
  } else if (zipcode >= 5000 && zipcode <= 5999) {
      st = 'VT';
      state = 'Vermont';
  } else if (zipcode >= 22000 && zipcode <= 24699) {
      st = 'VA';
      state = 'Virgina';
  } else if (zipcode >= 20000 && zipcode <= 20599) {
      st = 'DC';
      state = 'Washington DC';
  } else if (zipcode >= 98000 && zipcode <= 99499) {
      st = 'WA';
      state = 'Washington';
  } else if (zipcode >= 24700 && zipcode <= 26999) {
      st = 'WV';
      state = 'West Virginia';
  } else if (zipcode >= 53000 && zipcode <= 54999) {
      st = 'WI';
      state = 'Wisconsin';
  } else if (zipcode >= 82000 && zipcode <= 83199) {
      st = 'WY';
      state = 'Wyoming';
  }
     nlapiSetFieldText('State', state);
   }
}

function pageInitCA(type, name)
{
    nlapiSetFieldValue('country', 'CA')
}

function fieldChangeCA(type, name)
{
    if (name == 'zipcode') {
        
    var zipcode = nlapiGetFieldValue('zipcode');
    var firstLetter = zipcode.charAt(0);
    
    var state = '';
    
    if (firstLetter == 'A') {
        state = 'Newfoundland'
    }
    else if (firstLetter == 'B') {
        state = 'Nova Scotia'
    }
    else if (firstLetter == 'C') {
        state = 'Prince Edward Island'
    }
    else if (firstLetter == 'E') {
        state = 'New Brunswick'
    }
    else if (firstLetter == 'G') {
        state = 'Quebec'
    }
    else if (firstLetter == 'H') {
        state = 'Quebec'
    }
    else if (firstLetter == 'J') {
        state = 'Quebec'
    }
    else if (firstLetter == 'K') {
        state = 'Ontario'
    }
    else if (firstLetter == 'L') {
        state = 'Ontario'
    }
    else if (firstLetter == 'M') {
        state = 'Ontario'
    }
    else if (firstLetter == 'N') {
        state = 'Ontario'
    }
    else if (firstLetter == 'P') {
        state = 'Ontario'
    }
    else if (firstLetter == 'R') {
        state = 'Manitoba'
    }
    else if (firstLetter == 'S') {
        state = 'Saskatchewan'
    }
    else if (firstLetter == 'T') {
        state = 'Alberta'
    }
    else if (firstLetter == 'V') {
        state = 'British Columbia'
    }
    nlapiSetFieldText('State', state);
    }
}

function pageInitAU(type, name)
{
    nlapiSetFieldValue('country', 'AU')
}

function pageInitNZ(type, name)
{
    nlapiSetFieldValue('country', 'NZ')
}