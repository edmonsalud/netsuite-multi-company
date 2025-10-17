// Contivio.com Copyright © 2025
// All rights reserved. No part of this code may be reproduced, distributed, transmitted or used in any form
// or by any means, without the prior written permission from Contivio.com

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {
var insightsRecordName = "customrecord_contivio_ai_insight", scorecardRecordName = "customrecord_contivio_ai_scorecard";

function ParseAIData(context) {
	try {
        var scorecard, totalScore=0, qScore = 0;
		log.debug('Contivio ParseAIData ...', `ID: ${context.newRecord.id}`);
		contextType = context.type;
		if (contextType == context.UserEventType.CREATE || contextType == context.UserEventType.EDIT) {
				newRec = context.newRecord;
				oldRec = context?.oldRecord;

                var aiData = newRec.getValue('custevent_contivio_ai_data');
                var oldAIData = oldRec?.getValue('custevent_contivio_ai_data');

				if (aiData && aiData != oldAIData) {
                    // Delete attached records
                    DeleteRelatedAIRecords(newRec.id);

                    var objAIData = CreateAIObject(aiData);
                    
                    if(objAIData)
                    {
                        newRec.setValue({fieldId: 'custevent_contivio_ai_title', value: objAIData.title});
                        newRec.setValue({fieldId: 'custevent_contivio_ai_short_summary', value: objAIData.shortCallSummary});
                        newRec.setValue({fieldId: 'custevent_contivio_ai_summary', value: objAIData.callSummary});
                        newRec.setValue({fieldId: 'custevent_contivio_ai_satisfaction', value: objAIData.customerSatisfaction});
                        newRec.setValue({fieldId: 'custevent_contivio_ai_postive_negative', value: objAIData.posNeg});
                        newRec.setValue({fieldId: 'custevent_contivio_ai_keywords', value: objAIData.keywords?.toString() ?? ''});
                        newRec.setValue({fieldId: 'custevent_contivio_ai_followactions', value: objAIData.followActions});
                        newRec.setValue({fieldId: 'custevent_contivio_ai_proposed_disp', value: objAIData.proposedDisposition});
                        
                        scorecard = objAIData.scorecard;
                        if(scorecard?.questions)
                        {
                            scorecard?.questions?.forEach(function (q) {
                                qScore = 0;
                                q.answerList.forEach(function(a) {
                                    if(a.value > qScore) qScore = a.value;
                                });
                                totalScore += qScore;
                            });
                            if(scorecard?.sum){ 
                                newRec.setValue({fieldId: 'custevent_contivio_ai_agentscore', value: scorecard.sum});
                                newRec.setValue({fieldId: 'custevent_contivio_ai_agentscore_perc', value: ((totalScore < scorecard.sum ? 1 : scorecard.sum / totalScore) * 100).toFixed(2)});
                            }
                        }
                    }

				}
		}
	} catch (exp) {
		log.error('ParseAIData err:' , exp);
	}
}

function CreateAIRelatedRecords(context) 
{
	try {
        var insights, crInsight, scorecard, crScorecard;
		log.debug('Contivio CreateAIRelatedRecords ...');
		contextType = context.type;
		if (contextType == context.UserEventType.CREATE || contextType == context.UserEventType.EDIT) {
				newRec = context.newRecord;
				oldRec = context?.oldRecord;

                var aiData = newRec.getValue('custevent_contivio_ai_data');
                var oldAIData = oldRec?.getValue('custevent_contivio_ai_data');

				if (aiData && aiData != oldAIData) 
                {
                    var objAIData = CreateAIObject(aiData);

                    insights = objAIData.insights;
                    if(insights?.length > 0)
                    {
                        insights?.forEach(function (insight) {
                            for (let i = 0; i < insight.ref.length; i++) {
                            crInsight = record.create({ type: insightsRecordName, isDynamic: true });
                            crInsight.setValue({ fieldId: "name", value: insight.name });
                            crInsight.setValue({ fieldId: "custrecord_time", value: insight.ref[i].tm, });
                            crInsight.setValue({ fieldId: "custrecord_insight_call", value: newRec.id, });
                            var customRecId = crInsight.save();
                            log.debug("New Insight custom record created", "ID: " + customRecId + " - Insight " + insight.name);
                            }
                        });
                    }

                    scorecard = objAIData.scorecard;
                    if(scorecard?.questions){
                        scorecard?.questions?.forEach(function (q) {
                            crScorecard = record.create({ type: scorecardRecordName, isDynamic: true });
                            crScorecard.setValue({ fieldId: "custrecord_question", value: q.name });
                            crScorecard.setValue({fieldId: "custrecord_answer", value: q.selectedAnswerName });
                            crScorecard.setValue({ fieldId: "custrecord_value", value: q.selectedAnswerValue });
                            crScorecard.setValue({ fieldId: "custrecord_scorecard_call", value: newRec.id });
                            var customRecId = crScorecard.save();
                            log.debug( "New Scorecard custom record created", "ID: " + customRecId + " - Scorecard " + q.name );
                        });
                    }

                }
            }
        }
        catch (exp) { log.error('CreateAIRelatedRecords err:' , exp);	}
}

function DeleteRelatedAIRecords(callId)
{
    const insightsSearch = search.create({type: insightsRecordName,filters: [['custrecord_insight_call', 'is', callId]],columns: ['internalid']}).run();
    if(insightsSearch?.length){
    log.audit('About to delete existing insights', `Number of records: ${insightsSearch.length}`);
    insightsSearch?.each(result => { return DeleteRecord(insightsRecordName, result.getValue({ name: 'internalid' }));});
    }

    const scorecardSearch = search.create({type: scorecardRecordName ,filters: [['custrecord_scorecard_call', 'is', callId]],columns: ['internalid']}).run();
    if(scorecardSearch?.length)
    {
    log.audit('About to delete existing scorecards', `Number of records: ${insightsSearch.length}`);
    scorecardSearch?.each(result => {return DeleteRecord(scorecardRecordName, result.getValue({ name: 'internalid' }));});
    }
}

function DeleteRecord(recName, recId) {
    try {
            record.delete({type: recName, id: recId});
            log.audit('Deleted record', `Deleted record ID: ${recId}`);
        } catch (deleteErr) {
            log.error('Error deleting record', `ID: ${recId}, Error: ${deleteErr.message}`);
        }

        return true;
}

function CreateAIObject(aiData)
{   var objAIData = JSON.parse(aiData);
    if(objAIData && objAIData.data) objAIData = objAIData.data;
    return objAIData;
}

return {
	beforeSubmit: ParseAIData,
    afterSubmit: CreateAIRelatedRecords,
};

});
