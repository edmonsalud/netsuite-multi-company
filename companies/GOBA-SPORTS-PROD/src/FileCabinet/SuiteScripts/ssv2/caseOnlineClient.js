/**
 * caseOnlineClient.ts
 * by Head in the Cloud Development, Inc.
 * gurus@headintheclouddev.com
 *
 * @NScriptType ClientScript
 * @NApiVersion 2.1
 */
define(['N/currentRecord'], function (currentRecord) {
    'use strict';

    // function pageInit(context) {
    //     console.log('Page Init running');
    //     addFileUploadHandler(context.currentRecord, 'custevent_case_store_receipt_id', '#proof-of-purchase');
    //     addFileUploadHandler(context.currentRecord, 'custevent_case_photo_of_damage_id', '#photo-of-damage');
    //     console.log('Page Init running 22');
    //     jQuery('input[name="email_field"]').on('change', (event) => {
    //         context.currentRecord.setValue({ fieldId: 'email', value: event.target.value });
    //     });
    // }

    function saveRecord(context) {
        console.log('Saving record');
        const subsidiary = context.currentRecord.getValue({ fieldId: 'subsidiary' });
        let errorMsg = validate_WarrantyFields(subsidiary);

        $('.nb-result').each(function () {
            var text = $(this).text().trim();

            console.log("text:", text)

            if (text === "Invalid email") {
                console.log("invalid:", text);


                nlapiSetFieldValue("email", null);
                errorMsg += '\n';
                errorMsg += " Invalid Email";

            }
        });

        if (!window.nlapiGetFieldValue("startdate")) {
            if (errorMsg) errorMsg += '\n';
            errorMsg += ' When was it first noticed';
        }

        if (!window.nlapiGetFieldValue("incomingmessage")) {
            if (errorMsg) errorMsg += '\n';
            errorMsg += ' Details of concern';
        }

        if (!window.nlapiGetFieldValue("custevent_installer")) {
            if (errorMsg) errorMsg += '\n';
            errorMsg += ' Who installed the trampoline';
        }

        if (errorMsg) {
            console.log('saveRecord', errorMsg);
            alert('Please correct the following:\n' + errorMsg);
            return false;
        }


        context.currentRecord.setValue({ fieldId: 'subsidiary', value: '-1' }); // Reset subsidiary flag
        return true;
    }


    function addFileUploadHandler(rec, fileIdField, imageInputId) {
        jQuery(imageInputId).on('change', (event) => {
            const input = event.target;
            if (input.files.length > 0) {
                const file = input.files[0];
                const reader = new FileReader();
                const fileName = file.name;
                const fileType = getFileType(file);

                reader.onload = function () {
                    const arrayBuff = reader.result;
                    const uIntArray = new Uint8Array(arrayBuff);
                    let binaryStr = '';
                    for (let i = 0; i < uIntArray.length; i++) {
                        binaryStr += String.fromCharCode(uIntArray[i]);
                    }
                    const base64Str = btoa(binaryStr);

                    console.log('Sending file to suitelet', new Date());
                    jQuery('#submitbutton').prop('disabled', true);

                    const folder = '66557';
                    let suiteletURL = 'https://693183.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=2239&deploy=1&compid=693183&ns-at=AAEJ7tMQcv8Dz_Azg-ekXe2xebsWphX8pxC4ScWB1uWpn7FXWmw';

                    if (window.location.host.includes('sb1')) {
                        suiteletURL = 'https://693183-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=2239&deploy=1&compid=693183_SB1&ns-at=AAEJ7tMQmRSarZ4TeC-JrulwuVayJlT5wFu9u2xXff1tKC7rQSQ';
                    }

                    jQuery.ajax({
                        url: suiteletURL,
                        method: 'POST',
                        data: {
                            pdf: base64Str,
                            mode: 'createFile',
                            name: `${Date.now()} ${fileName}`,
                            fileType,
                            folder
                        }
                    }).then((response) => {
                        console.log('File processed', response, new Date());
                        rec.setValue({ fieldId: fileIdField, value: response });
                        jQuery('#submitbutton').prop('disabled', false);
                    });
                };

                reader.readAsArrayBuffer(file);
            }
        });
    }

    function getFileType(fileObj) {
        const type = fileObj.type;
        console.log('Processing file type', type);
        if (type === 'application/pdf') return 'pdf';
        if (type === 'image/png') return 'png';
        if (type === 'image/jpeg') return 'jpg';
        if (fileObj.name.includes('.doc')) return 'doc';
        if (fileObj.name.includes('.txt')) return 'txt';
        return 'bin';
    }

    function validate_Name_Email() {
        const rec = currentRecord.get();
        let errorMsg = '';

        if (!rec.getValue({ fieldId: 'firstname' })) errorMsg = '  First Name';
        if (!rec.getValue({ fieldId: 'lastname' })) {
            if (errorMsg) errorMsg += '\n';
            errorMsg += '  Last Name';
        }
        if (!rec.getValue({ fieldId: 'email' })) {
            if (errorMsg) errorMsg += '\n';
            errorMsg += '  Email';
        }

        return errorMsg;
    }

    function validate_WarrantyFields(subsidiary) {
        const rec = currentRecord.get();
        let errorMsg = validate_Name_Email();

        const checks = [
            { fieldId: 'phone', label: '  Phone Number' },
            { fieldId: 'custevent_case_add1', label: '  Address 1' },
            { fieldId: 'custevent_case_city', label: subsidiary === '5' ? ' Suburb / Town' : ' City' },
            { fieldId: 'custevent_case_state_new', label: subsidiary === '5' ? ' City / Town' : ' State' },
            { fieldId: 'custevent_case_postcode', label: ['1', '5'].includes(subsidiary) ? ' Post Code' : ' Zip/Postal Code' },
            { fieldId: 'custevent_case_country', label: '  Country' },
            { fieldId: 'custevent_trampoline_model', label: '  Trampoline Model #' },
            { fieldId: 'custevent_purchase_date', label: '  Date of Purchase' },
            { fieldId: 'custevent_sn_frame', label: '  Trampoline Serial Number' }
        ];

        for (const check of checks) {
            if (!rec.getValue({ fieldId: check.fieldId })) {
                if (errorMsg) errorMsg += '\n';
                errorMsg += check.label;
            }
        }

        return errorMsg;
    }

    return {
        // pageInit,
        saveRecord
    };
});
