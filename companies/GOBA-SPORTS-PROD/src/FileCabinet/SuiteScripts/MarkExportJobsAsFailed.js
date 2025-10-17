if (!Celigo)
	var Celigo = {};

var ns = $.namespace("Celigo.custom.springfree.userEvent");

ns.Celigo_MarkFailed = function(myContext) {
	Celigo.custom.springfree.userEvent.Celigo_MarkFailed.superclass.constructor.call(this, myContext);
	// private members
	var that = this;
	// methods


		
};

ns.Celigo_MarkFailed.prototype = {
	// send emails to these people when an exception is handled
	getEmailsToNotifyOnError : function() {
		return [ 'srikrishna.allahari@celigo.com' ];
	},
	
	beforeSubmitContext : {
		'type' : [ 'create', 'edit']
	},
	beforeSubmit : function(type) {
		$$.logExecution('DEBUG', 'before submit type', type.toLowerCase());        
	},
	afterSubmitContext : {
		'type' : [ 'create', 'edit', 'xedit']
	},
	afterSubmit : function(type) {
		$$.logExecution('DEBUG', 'parent', nlapiGetFieldValue('custrecord_celigo_je_parent'));    
		if($$.getFieldValue('custrecord_celigo_je_status') === '3' && $$.getFieldValue('custrecord_celigo_je_parent')){
			var jobSearch = $$.searchRecord('customrecord_celigo_job_export', null, [new nlobjSearchFilter('custrecord_celigo_je_parent', null, 'anyof', $$.getFieldValue('custrecord_celigo_je_parent'))]);
			for(var i=0; jobSearch && i < jobSearch.length; i++){
				$$.submitField('customrecord_celigo_job_export', jobSearch[i].getId(), 'custrecord_celigo_je_status', '3');
				$$.logExecution('DEBUG', 'marked job rec as failed', jobSearch[i].getId());    
			}
			$$.submitField('customrecord_celigo_job_export', $$.getFieldValue('custrecord_celigo_je_parent'), 'custrecord_celigo_je_status', '3');
			$$.logExecution('DEBUG', 'marked parent job rec as failed', $$.getFieldValue('custrecord_celigo_je_parent'));    

		}
	}
};