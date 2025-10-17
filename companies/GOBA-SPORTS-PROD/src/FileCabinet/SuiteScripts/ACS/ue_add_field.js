/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
/*


*/
define(['N/ui/serverWidget', 'N/format', 'N/runtime'], function (serverWidget, format, runtime) {
    return {
        beforeLoad: function (context) {
            if (context.type == "view") {
                try {
                    const original_ts = context.newRecord.getValue({
                        fieldId: 'custbody_acs_zero_timestamp'
                    });

                    const new_ts = format.format({
                        value: format.parse({
                            type: format.Type.DATE,
                            value: original_ts
                        }),
                        type: format.Type.DATETIME,
                        timezone: runtime.getCurrentUser().getPreference({
                            name: 'TIMEZONE'
                        })
                    });

                    const field = context.form.addField({
                        id: 'custpage_text007',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'DOM Script'
                    });
                    field.defaultValue = `<h1 style="color: red;">${new Date(new_ts)}</h1>`;

                    context.newRecord.setValue({
                        fieldId: 'custbody_acs_pst_timestamp',
                        value: new Date(new_ts)
                    });
                } catch (e) {
                    log.debug('error', e.message);
                }
            }
        }
    };
});