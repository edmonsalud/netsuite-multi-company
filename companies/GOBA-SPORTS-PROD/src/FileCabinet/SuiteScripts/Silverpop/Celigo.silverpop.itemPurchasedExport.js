$.namespace('Celigo.silverpop.itemPurchasedExport');
Celigo.silverpop.itemPurchasedExport.itemPurchasedExportHandler=function(){

	var Log_title='Purchased_Item_Export';
	var l = $.getExecutionLogger('PurchasedItemLogger');	
	var xmlFileTimeStamp = (new Date()).getTime();
	credentials = new Celigo.io.CredentialsManager({
		id : 'CELIGO_SILVERPOP'
	});

	/*retrySendRequest = function(flow, counter) {
		if(!counter)
			counter = 1;
		if(counter > 3)
			return;
		var apiUserName = credentials.getUserName();
		var apiPassword = credentials.getPassword();
		var baseUrl = $$.getContext().getSetting('SCRIPT', 'custscript_cps_silverpop_endpoint_url') || '';
		var listId = $$.getContext().getSetting('SCRIPT', 'custscript_cps_silverpop_listid') || '';

		var loginReq = "<Envelope><Body><Login><USERNAME>" + apiUserName + "</USERNAME><PASSWORD>" + apiPassword + "</PASSWORD></Login></Body></Envelope>";
		var response = $$.requestURL(baseUrl, loginReq);
		var xmlRespDoc = $$.stringToXML(response.getBody());
		var jsessionid = $$.selectValue(xmlRespDoc, '//SESSIONID');
		$$.logExecution('DEBUG', 'session', jsessionid);
		var endpointURL = baseUrl + ';jsessionid=' + jsessionid;
		response = $$.requestURL(endpointURL, reqMessage);
		var xmlResp = $$.stringToXML(response.getBody());
		nlapiLogExecution('AUDIT', 'RETRY RESP', response.getBody());
		if($$.selectValue(xmlResp, './Envelope/Body/RESULT/SUCCESS') !== 'false') {
			logRec = $$.createRecord('customrecord_celigo_logger');
			logRec.setFieldValue('custrecord_celigo_logger_parent', flow.publicState.reserved.integrationLoggerID);
			logRec.setFieldValue('custrecord_celigo_logger_message', $$.escapeXML(response.getBody()));
			logRec.setFieldValue('custrecord_celigo_logger_level', "2");
			$$.submitRecord(logRec);
		} else {
			counter = counter + 1;
			retrySendRequest(flow, counter);
		}
	}*/	

	onAfterSendMessage = function( flow, responseMessage ){
		var xmlString = responseMessage.getData().getContent();
		l.audit(Log_title,'processed response message' + $$.escapeXML(xmlString));
		var xmlResString = $$.xmlToString($$.stringToXML(responseMessage.getData()));


		xmlResString = xmlResString.replace(/&amp;amp;/g, '&amp;');
		xmlResString = xmlResString.replace(/&amp;apos;/g, '&apos;');
		xmlResString = xmlResString.replace(/&amp;lt;/g, '&lt;');
		xmlResString = xmlResString.replace(/&amp;gt;/g, '&gt;');
		xmlResString = xmlResString.replace(/&amp;quot;/g, '&quot;');

		//Check for failures here and put them in created custom record

		try{
			var messageLogFileName = 'Celigo_JOB_Res_' + new Date().getTime() + '.txt';
			var file = $$.createFile(messageLogFileName, 'PLAINTEXT', xmlResString);
			file.setFolder(315364);
            var fileid = $$.submitFile(file);
            var jobRec = nlapiSearchRecord('customrecord_celigo_job_export', null, 
            	new nlobjSearchFilter('custrecord_celigo_je_log', null, 'is', flow.publicState.reserved.integrationLoggerID));
            if(jobRec && jobRec.length>0)
                $$.submitField('customrecord_celigo_job_export', jobRec[0].getId(), 'custrecord_celigo_je_out_file', fileid);
		}
		catch(e){
			$$.logExecution('ERROR', 'ERROR in saving silverpop request to file');
		}
		logRec = $$.createRecord('customrecord_celigo_logger');
		logRec.setFieldValue('custrecord_celigo_logger_parent', flow.publicState.reserved.integrationLoggerID);
		//logRec.setFieldValue('custrecord_celigo_logger_message', xmlReqString);
		logRec.setFieldValue('custrecord_celigo_logger_level', "1");
		$$.submitRecord(logRec);

	};

	onbeforeSendMessage = function(flow, requestMessage){
		l.audit(Log_title, 'beforeSend' + $$.escapeXML(requestMessage));
		var xmlReqString = $$.xmlToString($$.stringToXML(requestMessage.getData()));
		xmlReqString = xmlReqString.replace(/&amp;amp;/g, '&amp;');
		xmlReqString = xmlReqString.replace(/&amp;apos;/g, '&apos;');
		xmlReqString = xmlReqString.replace(/&amp;lt;/g, '&lt;');
		xmlReqString = xmlReqString.replace(/&amp;gt;/g, '&gt;');
		xmlReqString = xmlReqString.replace(/&amp;quot;/g, '&quot;');

		requestMessage.getData().setContent(xmlReqString);
		reqMessage = xmlReqString;
		l.audit(Log_title, 'beforeSend >>' + xmlReqString);
		//Logging request to xml file in Celigo > Integrator > Configuration > Flows > Backup > SilverpopSOandRAItemExportRequest
		try{
			var messageLogFileName = 'Celigo_JOB_Req_' + new Date().getTime() + '.txt';
			var file = $$.createFile(messageLogFileName, 'PLAINTEXT', xmlReqString);
			file.setFolder(315363);
            var fileid = $$.submitFile(file);
            var jobRec = nlapiSearchRecord('customrecord_celigo_job_export', null, 
            	new nlobjSearchFilter('custrecord_celigo_je_log', null, 'is', flow.publicState.reserved.integrationLoggerID));
            if(jobRec && jobRec.length>0)
                $$.submitField('customrecord_celigo_job_export', jobRec[0].getId(), 'custrecord_celigo_je_out_file', fileid);
		}
		catch(e){
			$$.logExecution('ERROR', 'ERROR in saving silverpop request to file');
		}
		logRec = $$.createRecord('customrecord_celigo_logger');
		logRec.setFieldValue('custrecord_celigo_logger_parent', flow.publicState.reserved.integrationLoggerID);
		//logRec.setFieldValue('custrecord_celigo_logger_message', xmlReqString);
		logRec.setFieldValue('custrecord_celigo_logger_level', "1");
		$$.submitRecord(logRec);
	}

//	add listeners
	var d = Celigo.event.dispatcher.integrator.batch.ExportDispatcher;
	var c = Celigo.event.dispatcher.integrator.connectors.ConnectorDispatcher;
	d.on('BATCH_EXPORT:AFTER_SEND_MESSAGE', onAfterSendMessage);
	d.on('BATCH_EXPORT:BEFORE_SEND_MESSAGE', onbeforeSendMessage);

};
Celigo.silverpop.itemPurchasedExport.itemExportHandlerInstance = new Celigo.silverpop.itemPurchasedExport.itemPurchasedExportHandler();