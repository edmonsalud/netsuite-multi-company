/**
 * Module Description
 * 
 * Version	Date        Author			Remarks
 * 1.00     17-06-15	Eric.choe		Created function BeforeSubmit_Restrict_Creation()
 * 
 * 1.01		05-03-20	Eric.Choe		Added new role to user list - SFT - Knowledge Base Editor, requested by Brandon	
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord Folder
 * 
 * @param {String} 'c' Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */

function BeforeSubmit_Restrict_Creation(){
	var userRole = nlapiGetContext().getRole();
	var userContext = nlapiGetContext().getExecutionContext();	
	// 3 = Administrator, 14 = Customer Centre, 1188 = SFT - Knowledge Base Editor
	if(userContext == 'userinterface' && userRole != 3 && userRole != 14 && userRole != 1188){
 		throw nlapiCreateError('Permission Denied', 'Permission Denied : Your role does not allow you to create a folder. ' + '(Role ID : ' + userRole + ' Context : ' + userContext + ')', true);
	}	
}