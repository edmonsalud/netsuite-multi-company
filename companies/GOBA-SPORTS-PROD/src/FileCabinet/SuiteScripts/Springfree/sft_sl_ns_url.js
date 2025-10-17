/**
 * Module Description
 * 
 * Version  Date		Author          Remarks
 * 1.00     09-08-17	Eric.Choe		To return domain URL part to be used in other version 1.0 scripts
 * 
 * 2.00		29-01-19	Eric.Choe		Updated "function getDataCenterURL(request, response)" to use deployment id as filter only
 * 
 * 2.10		06-09-19	Eric.Choe		Updated "function getDataCenterURL(request, response)" to return new URL format (i.e. 693183.app.netsuite.com)
 * 
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */


function getDataCenterURL(request, response){
	 var env = nlapiGetContext();	 
	 if(request.getMethod() == 'GET'){		 
		//Get DataCenter URL from Suitelet Deployment record
		 nlapiLogExecution('DEBUG', 'env.getDeploymentId()', env.getDeploymentId());	 
		 var deploymentID  = nlapiSearchRecord('scriptdeployment',null,['scriptid','is', env.getDeploymentId()],[new nlobjSearchColumn('internalid')])[0].getId();
		 nlapiLogExecution('DEBUG', 'deploymentID', deploymentID);		 
		 var deploymentRec = nlapiLoadRecord('scriptdeployment', deploymentID);
		 var url = deploymentRec.getFieldValue('externalurl'); // New URL, not availalbe in preview account anymore, switch it back to 'externalurl' after go live
		 nlapiLogExecution('DEBUG','Suitelet Script Deployment External URL:',url);		 
//		 url = url.substring(0,url.indexOf('/app')).replace('forms','system'); // Old one
		 url = url.substring(0,url.indexOf('/app')).replace('extforms','app');
		 nlapiLogExecution('DEBUG','Data Center URL',url);	 
		 response.write(url); //return url
	 }	
}