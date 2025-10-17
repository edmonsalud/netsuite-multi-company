/**
 * @NApiVersion 2.1
 * @NScriptType restlet
 *
 * Script Name: ACS | RL | Get task status
 * Deploy it as scriptId: _acs_task_handler
 *
 * release date: 2023-01-03
 * author:       wladyslaw.motyka@oracle.com
 */
/*jshint esversion: 6, multistr: true */
define(['N/task'], function (task) {
    const SCRIPT_VERSION = 2.4;
    return {
        get: function (context) {
            // log.debug('GET context', context);
            try {
                if (context.task_id.indexOf('MAPREDUCETASK_') != -1) {
                    const MapReduceScriptTaskStatus = task.checkStatus(context.task_id);
                    const taskStatus = {
                        status: MapReduceScriptTaskStatus.status,
                        stage: MapReduceScriptTaskStatus.stage,
                        completion: MapReduceScriptTaskStatus.getPercentageCompleted()
                    };
                    switch (MapReduceScriptTaskStatus.stage) {
                        case task.MapReduceStage.MAP:
                            taskStatus.total = MapReduceScriptTaskStatus.getTotalMapCount();
                            taskStatus.pending = MapReduceScriptTaskStatus.getPendingMapCount();
                            break;
                        case task.MapReduceStage.REDUCE:
                            taskStatus.total = MapReduceScriptTaskStatus.getTotalReduceCount();
                            taskStatus.pending = MapReduceScriptTaskStatus.getPendingReduceCount();
                            break;
                        default:
                            break;
                    }
                    return JSON.stringify(taskStatus);
                } else if (context.task_id.indexOf('SCHEDULEDSCRIPTTASK_') != -1) {
                    // const ScheduledScriptTaskStatus = task.checkStatus(context.task_id);
                    // return JSON.stringify({status: ScheduledScriptTaskStatus.status});
                    // log.debug(task.checkStatus(context.task_id));
                    return JSON.stringify({
                        stage: 'EXECUTE',
                        status: task.checkStatus(context.task_id).status
                    });
                } else {
                    log.debug('not supported', context);
                    log.debug('not supported', context.task_id.slice(0,30));
                    return '{"error":"not supported taskType"}';
                }
            } catch (error) {
                log.debug('GET', error);
                return JSON.stringify({
                    error
                });
            }
        },
        post: function (context) {
            // log.debug('POST context', context);
            try {
                const myTask = task.create(context);
                myTask.submit();
                log.debug('myTask', myTask);
                return {
                    version: SCRIPT_VERSION,
                    taskType: context.taskType,
                    id: myTask.id,
                    scriptId: myTask.scriptId,
                    deploymentId: myTask.deploymentId
                };
            } catch (error) {
                if (error.name == "MAP_REDUCE_ALREADY_RUNNING") {
                    log.debug('POST', error.message);
                } else {
                    log.debug('POST', {
                        error,
                        context
                    });
                }
                return JSON.stringify({
                    version: SCRIPT_VERSION,
                    name: error.name,
                    message: error.message
                });
            }
        }
    };
});