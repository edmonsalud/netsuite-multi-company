/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */


const subsidiaryDeptMap = {
    1: 13,   // AU - Kunda Park
    3: 63,   // US - Corporate US Office : Direct Sales : National Direct
    4: 65,   // CA - Corporate CA Office : Direct Sales : National Direct
    5: 47    // NZ - Christchurch : Direct Sales
};

define([], () => {

    const pageInit = (context) => {
        try {
            const currentRecord = context.currentRecord;
            const subsidiaryId = currentRecord.getValue({ fieldId: 'subsidiary' });
            const customFormId = currentRecord.getValue({ fieldId: 'customform' });

            if (currentRecord.type == 'salesorder' && customFormId != 128 && customFormId != 235) {
                setDepartmentBySubsidiary(currentRecord, subsidiaryId);

            } else if (currentRecord.type != 'salesorder') {
                setDepartmentBySubsidiary(currentRecord, subsidiaryId);

            }

        } catch (e) {
            console.log('Error in pageInit: ' + e.message);
        }
    };

    const fieldChanged = (context) => {
        try {
            const currentRecord = context.currentRecord;
            if (context.fieldId === 'subsidiary' || context.fieldId == 'entity') {
                const subsidiaryId = currentRecord.getValue({ fieldId: 'subsidiary' });
                const customFormId = currentRecord.getValue({ fieldId: 'customform' });

                if (currentRecord.type == 'salesorder' && customFormId != 128 && customFormId != 235) {
                    setDepartmentBySubsidiary(currentRecord, subsidiaryId);

                } else if (currentRecord.type != 'salesorder') {
                    setDepartmentBySubsidiary(currentRecord, subsidiaryId);

                }
            }
        } catch (e) {
            console.log('Error in fieldChanged: ' + e.message);
        }
    };


    const setDepartmentBySubsidiary = (currentRecord, subsidiaryId) => {
        try {
            if (subsidiaryId && subsidiaryDeptMap[subsidiaryId]) {
                currentRecord.setValue({
                    fieldId: 'department',
                    value: subsidiaryDeptMap[subsidiaryId],
                    ignoreFieldChange: true
                });
            }
        } catch (e) {
            console.log('Error in setDepartmentBySubsidiary: ' + e.message);
        }
    };

    return {
        pageInit,
        fieldChanged
    };
});
