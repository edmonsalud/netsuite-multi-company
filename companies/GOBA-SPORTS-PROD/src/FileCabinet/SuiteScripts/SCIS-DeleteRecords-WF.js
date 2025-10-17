/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Jun 2016     dglenn
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function scheduledDelete() {
	//Load Record
	var type = nlapiGetRecordType();
	nlapiLogExecution("DEBUG", "Type: ", type);
	var id = nlapiGetRecordId();
	nlapiLogExecution("DEBUG", "Record ID: ", id);
	//Delete Record
	nlapiDeleteRecord(type, id);
}
