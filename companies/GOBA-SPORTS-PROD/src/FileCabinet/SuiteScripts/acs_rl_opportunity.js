/**
 * Copyright (c) 1998-2021 Oracle NetSuite GBU, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Oracle NetSuite GBU, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Oracle NetSuite GBU.
 */
/**
 * Module Description:
 * UE script which calculate total quantity
 *
 * Version          Date                        Author                  Remarks
 * 1.11             October, 2022               Vlad Motyka             Initial Version
 */
/**
 * @NApiVersion 2.1
 * @NScriptType restlet
 */
/*jshint esversion: 6 */
define(['N/record', 'N/error', 'N/search', 'N/file', 'N/crypto', 'N/encode'], function (record, error, search, file, crypto, encode) {
    const STATES = {
        "AL": "Alabama",
        "AK": "Alaska",
        "AZ": "Arizona",
        "AR": "Arkansas",
        "AA": "Armed Forces Americas",
        "AE": "Armed Forces Europe",
        "AP": "Armed Forces Pacific",
        "CA": "California",
        "CO": "Colorado",
        "CT": "Connecticut",
        "DE": "Delaware",
        "DC": "District of Columbia",
        "FL": "Florida",
        "GA": "Georgia",
        "HI": "Hawaii",
        "ID": "Idaho",
        "IL": "Illinois",
        "IN": "Indiana",
        "IA": "Iowa",
        "KS": "Kansas",
        "KY": "Kentucky",
        "LA": "Louisiana",
        "ME": "Maine",
        "MD": "Maryland",
        "MA": "Massachusetts",
        "MI": "Michigan",
        "MN": "Minnesota",
        "MS": "Mississippi",
        "MO": "Missouri",
        "MT": "Montana",
        "NE": "Nebraska",
        "NV": "Nevada",
        "NH": "New Hampshire",
        "NJ": "New Jersey",
        "NM": "New Mexico",
        "NY": "New York",
        "NC": "North Carolina",
        "ND": "North Dakota",
        "OH": "Ohio",
        "OK": "Oklahoma",
        "OR": "Oregon",
        "PA": "Pennsylvania",
        "PR": "Puerto Rico",
        "RI": "Rhode Island",
        "SC": "South Carolina",
        "SD": "South Dakota",
        "TN": "Tennessee",
        "TX": "Texas",
        "UT": "Utah",
        "VT": "Vermont",
        "VA": "Virginia",
        "WA": "Washington",
        "WV": "West Virginia",
        "WI": "Wisconsin",
        "WY": "Wyoming"
    };
    const MAPPING = {
        PROD: {
            "Australia": {
                subsidiary: 1,
                department: 13,	// not confirmed
                custentity_sp_filtered_campaign_source: 26737888,	// not confirmed
            },
            "New Zealand": {
                subsidiary: 5,
                department: 46,	// not confirmed
                custentity_sp_filtered_campaign_source: 26737888,	// not confirmed
            },
            "Canada": {
                subsidiary: 4,
                department: 65,	// not confirmed
                custentity_sp_filtered_campaign_source: 26737888,	// not confirmed
            },
            "United States": {
                subsidiary: 3,
                department: 63,	// not confirmed
                custentity_sp_filtered_campaign_source: 26737888,	// not confirmed
            },
        },
        SB1: {
            "Australia": {
                subsidiary: 1,
                department: 13,
                custentity_sp_filtered_campaign_source: 26737888,
            },
            "New Zealand": {
                subsidiary: 5,
                department: 46,
                custentity_sp_filtered_campaign_source: 26737888,
            },
            "Canada": {
                subsidiary: 4,
                department: 65,
                custentity_sp_filtered_campaign_source: 26737888,
            },
            "United States": {
                subsidiary: 3,
                department: 63,
                custentity_sp_filtered_campaign_source: 26737888,
            }
        }
    };

    function overrideWithPreCachedValues(context) {
        const AccountType = context.AccountType || 'PROD';
        const object = MAPPING[AccountType][context.custevent_case_country];

        if (!object) return;
        for (const key in object) {
            if (Object.hasOwnProperty.call(object, key)) {
                if (!context[key]) context[key] = object[key];
            }
        }
    }

    function addNewAddress(objRecordCustomer, object) {
        const DEF_ADDRESSBOOK = {
            sublistId: "addressbook",
            fieldId: "addressbookaddress"
        };

        objRecordCustomer.selectNewLine(DEF_ADDRESSBOOK);

        const OBJECT_SUBRECORD_ADDRESSBOOK = objRecordCustomer.getCurrentSublistSubrecord(DEF_ADDRESSBOOK);
        /*
        OBJECT_SUBRECORD_ADDRESSBOOK.setValue({
            fieldId: "override",
            value: override ? true : false
        });
        */

        OBJECT_SUBRECORD_ADDRESSBOOK.setText({
            fieldId: 'country',
            text: object.country,
            forceSyncSourcing: true,
            isDynamic: true,
            fireSlavingSync: true
        });

        OBJECT_SUBRECORD_ADDRESSBOOK.setValue({ fieldId: 'addressee', value: object.addressee });
        OBJECT_SUBRECORD_ADDRESSBOOK.setValue({ fieldId: 'addr1', value: object.addr1 });
        OBJECT_SUBRECORD_ADDRESSBOOK.setValue({ fieldId: 'addr2', value: object.addr2 });

        if (object.country == "United States") {
            // we want to source STATE + CITY by ZIP
            OBJECT_SUBRECORD_ADDRESSBOOK.setValue({
                fieldId: 'zip',
                value: object.zip,
                forceSyncSourcing: true,
                isDynamic: true,
                fireSlavingSync: true
            });

        } else {
            OBJECT_SUBRECORD_ADDRESSBOOK.setValue({ fieldId: 'zip', value: object.zip });
            OBJECT_SUBRECORD_ADDRESSBOOK.setText({ fieldId: 'state', text: object.state });
            OBJECT_SUBRECORD_ADDRESSBOOK.setValue({ fieldId: 'city', value: object.city });
        }

        objRecordCustomer.commitLine(DEF_ADDRESSBOOK);

        const numLines = objRecordCustomer.getLineCount({
            sublistId: 'addressbook'
        });
        log.debug('numLines', numLines);

        objRecordCustomer.setCurrentSublistValue({
            sublistId: "addressbook",
            fieldId: "defaultshipping", // defaultshipping or defaultbilling
            value: true,
            line: numLines - 1
        });

        const id = objRecordCustomer.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
        });
        log.debug('link', { id, recordType: 'customer' });
    }

    function checkAddress(customer_id, object, override) {
        const objRecordCustomer = record.load({
            type: "customer",
            id: customer_id,
            isDynamic: true
        });

        const numLines = objRecordCustomer.getLineCount({
            sublistId: 'addressbook'
        });


        // find existing line
        let addressAlreadyExists = false;
        for (let index = 0; index < numLines; index++) {

            objRecordCustomer.selectLine({
                sublistId: "addressbook",
                line: index
            });
            //log.debug('selected line', index);

            const OBJECT_SUBRECORD_ADDRESSBOOK = objRecordCustomer.getCurrentSublistSubrecord({
                sublistId: "addressbook",
                fieldId: "addressbookaddress"
            });

            let diff = false;
            for (const fieldId in object) if (Object.hasOwnProperty.call(object, fieldId) && object[fieldId] !== null && OBJECT_SUBRECORD_ADDRESSBOOK.getText({ fieldId }) != object[fieldId]) {
                // log.debug(fieldId, { index, obj: object[fieldId] || '#', txt: OBJECT_SUBRECORD_ADDRESSBOOK.getText({ fieldId }), val: OBJECT_SUBRECORD_ADDRESSBOOK.getValue({ fieldId }) });
                // selected line differs at least in one field
                if (fieldId != 'state') diff = true;
            }
            if (!diff) {
                // SELECTED Address LINE is same as POST data

                // check DEFAULT billing
                const defaultshipping = objRecordCustomer.getCurrentSublistValue({
                    sublistId: "addressbook",
                    fieldId: "defaultshipping", // defaultshipping or defaultbilling
                    line: index
                });
                if (!defaultshipping) {
                    log.debug('defaultshipping line', { index, defaultshipping });
                    // TODO: MAKE default SHIPPING address
                    objRecordCustomer.setCurrentSublistValue({
                        sublistId: "addressbook",
                        fieldId: "defaultshipping", // defaultshipping or defaultbilling
                        value: true,
                        line: index
                    });
                    objRecordCustomer.commitLine({
                        sublistId: 'addressbook'
                    });

                    //log.debug('custentity_lifemode_segment', objRecordCustomer.getValue({fieldId: "custentity_lifemode_segment"}));
                    /*
                            objRecordCustomer.setText({
                                fieldId: "custentity_lifemode_segment",
                                text: 'Exurbanites'
                            });
                    */
                    objRecordCustomer.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug('link', {
                        id: customer_id,
                        recordType: 'customer'
                    });
                }

                addressAlreadyExists = true;
                break;
            }
        }
        if (!addressAlreadyExists) {
            log.debug('adding new address', object);
            addNewAddress(objRecordCustomer, object);
        }
    }

    function createNewCustomerRecord(context) {
        try {
            const objRecordCustomer2 = record.create({
                type: record.Type.CUSTOMER,
                isDynamic: true
            });
            objRecordCustomer2.setValue({
                fieldId: 'customform',
                value: 97 // SFT - Customer Form - Warranty
            });

            log.debug('customform', objRecordCustomer2.getField({
                fieldId: 'customform',
            }))

            objRecordCustomer2.setText({
                fieldId: 'category',
                text: 'Consumer'
            });
            objRecordCustomer2.setText({
                fieldId: 'firstname',
                text: context.firstName
            });
            objRecordCustomer2.setText({
                fieldId: 'lastname',
                text: context.lastName
            });
            objRecordCustomer2.setText({
                fieldId: 'email',
                text: context.email
            });
            objRecordCustomer2.setValue({
                fieldId: 'subsidiary',
                value: context.subsidiary
            });
            objRecordCustomer2.setValue({
                fieldId: 'custentity_customer_department',
                value: context.department	// 'Brisbane'
            });
            objRecordCustomer2.setText({
                fieldId: 'custentity_lead_source_class',
                text: 'Other'
            });

            objRecordCustomer2.setValue({
                fieldId: 'custentity_sp_filtered_campaign_source',
                value: context.custentity_sp_filtered_campaign_source
            });

            const id = objRecordCustomer2.save({
                enableSourcing: true
            });
            log.debug('new user created', id);
            return id;

        } catch (err) {
            log.error('create customer', [
                context.firstName,
                context.lastName,
                context.email,
                err
            ]);
            log.error('create customer - err', err);
            throw "FATAL error: failed to create New Customer Record. " + JSON.stringify(err);
        }
    }

    function searchForCustomer(firstName, lastName, email, subsidiary) {
        const objSearch = {
            type: search.Type.CUSTOMER,
            filters: [
                ['email', 'is', email],
                'AND',
                ['entityid', 'is', firstName + ' ' + lastName],
                'AND',
                ['subsidiary', 'anyof', subsidiary]
            ]
        };
        const result = search.create(objSearch).run().getRange({
            start: 0,
            end: 1
        });
        if (result.length) {
            log.debug('user found', result[0].id);
            log.debug('result', result);
            //log.debug('objSearch', objSearch);

            return result[0].id;
        } else {
            return null;
        }
    }

    function getCustomer(context) {
        const customerId = searchForCustomer(context.firstName, context.lastName, context.email, context.subsidiary);
        if (customerId) {
            return customerId;
        } else {
            return createNewCustomerRecord(context);
        }
    }

    function doValidation(args, argNames, methodName) {
        for (let i = 0; i < args.length; i++)
            if (!args[i] && args[i] !== 0)
                throw error.create({
                    name: 'MISSING_REQ_ARG',
                    message: 'Missing a required argument: [' + argNames[i] + '] for method: ' + methodName + '. Value: [' + args[i] + ']'
                });
    }

    function createMd5Hash(inputString) {
        const hash = crypto.createHash({
            algorithm: crypto.HashAlg.SHA256
        });
        const hashUpdated = hash.update({
            input: inputString,
            inputEncoding: encode.Encoding.UTF_8
        });
        const hashDigested = hash.digest({
            outputEncoding: encode.Encoding.HEX
        });
        return hashDigested;
    }

    const PHOTO_FOLDER = {
        id: 12508912,
        path: '/CRM/Global Warranty Images 2024+/'
    };
    const REGEX_EXTENSIONS = /^data:image\/(jpg|jpeg|pjpeg|gif|png);base64,/;
    const EXTENSIONS = {
        jpg: file.Type.JPGIMAGE,
        jpeg: file.Type.JPGIMAGE,
        pjpeg: file.Type.PJPGIMAGE,
        png: file.Type.PNGIMAGE,
        gif: file.Type.GIFIMAGE,
    }

    function post(context) {
        // Check if the 'photo' property exists and is not an empty array (added by Brandon 12/12/23)
        if (!context.photo || context.photo.length === 0) {
            log.debug('No photos to process');
            // this has been disabled by Brandon
            // return;  // Skip the rest of the function
        }

        log.debug('POST', context);
        if (context.photo) {
            for (let index = 0; index < context.photo.length; index++) {
                const photo = context.photo[index];

                if (REGEX_EXTENSIONS.test(photo)) {
                    const extension = photo.match(REGEX_EXTENSIONS)[1];

                    const filename = `${createMd5Hash(photo)}.${extension}`;
                    let fileObj;
                    try {
                        fileObj = file.load({
                            id: PHOTO_FOLDER.path + filename,
                        });
                        context.photo[index] = fileObj.id;
                        //log.debug('filehash', {filename, fileObj});
                    } catch (error) {
                        fileObj = file.create({
                            name: filename,
                            fileType: EXTENSIONS[extension],
                            contents: photo.replace(REGEX_EXTENSIONS, ''),
                            encoding: file.Encoding.UTF8,
                            folder: PHOTO_FOLDER.id,
                            //isOnline: false,
                            conflictResolution: file.NameConflictResolution.RENAME_TO_UNIQUE
                        });
                        context.photo[index] = fileObj.save();
                        //log.debug('save', {error, filename, fileObj});
                    }

                    log.debug('photo saved', { fileObj });
                } else {
                    log.error('photo - wrong header', photo ? photo.slice(0, 21) : photo);
                }
            }
        }




        doValidation([context.incomingmessage], ['incomingmessage'], 'POST');

        let objRecordSupportCase = record.create({
            type: record.Type.SUPPORT_CASE,
            isDynamic: true,
            defaultValues: {
                customform: 81 // SFT Case Form - Warranty
            }
        });

        // Set this first
        // [{"value":"1","text":"Accessories"},{"value":"10","text":"Non Warranty"},{"value":"11","text":"Non Warranty: Expired"},{"value":"108","text":"Product Incident Report"},{"value":"14","text":"Spare Parts"},{"value":"15","text":"Warranty"},{"value":"16","text":"Warranty Registration"}]
        objRecordSupportCase.setValue({
            fieldId: 'customform',
            value: 81
        });

        /*
          // commented out on 2023-08-08
      
        objRecordSupportCase.setValue({
            fieldId: 'custevent_case_service_type',
            value: 15
        });
        */

        // Origin: Web ... ID:-5    ALWAYS
        objRecordSupportCase.setValue({
            fieldId: 'origin',
            value: -5
        });

        // Some values are hardcoded per email communication with Brandon Peneycad <bpeneycad@gobasports.com> && Richard Ng <rng@gobasports.com>
        overrideWithPreCachedValues(context);

        log.debug('context', context);

        const customerId = getCustomer(context);
        objRecordSupportCase.setValue({
            fieldId: 'company',
            value: customerId
        });

        // Category:   ID: 1   "Warranty \u0026 Product Support"
        objRecordSupportCase.setValue({
            fieldId: 'category',
            value: 1
        });

        // CASE TYPE:   ID: 1   "Warranty \u0026 Product Support"
        // [{"value":"","text":""},{"value":"-1","text":"- New -"},{"value":"1","text":"Accessories"},{"value":"10","text":"Non Warranty"},{"value":"11","text":"Non Warranty: Expired"},{"value":"108","text":"Product Incident Report"},{"value":"14","text":"Spare Parts"},{"value":"15","text":"Warranty"},{"value":"16","text":"Warranty Registration"}]





        const CCT = {
            'Warranty': 15,
            'Warranty Registration': 16
        };
        objRecordSupportCase.setValue({
            fieldId: 'custevent_case_type',
            value: CCT[context.custevent_case_type] || 15
        });

        // PURCHASE DATE - payload OR today (now) - Made Inactive By Brandon Nov 21, 2023
        // objRecordSupportCase.setValue({
        //fieldId: 'custevent_purchase_date',
        //  value: context.custevent_purchase_date ? new Date(context.custevent_purchase_date) : new Date()
        // });

        // SUBJECT: text
        objRecordSupportCase.setText({
            fieldId: 'title',
            text: context.title || 'Online Warranty Claim' // Hardcoded as for Richard's request on 17 July 2023      //context.incomingmessage || 'NO SUBJECT'
        });

        // SUBJECT: text
        objRecordSupportCase.setText({
            fieldId: 'incomingmessage',
            text: context.incomingmessage
        });

        // TEXT values in required order
        const required_text_values = [
            "phone", // newly added 2023-08-02
            "custevent_mobile", // newly added 2023-08-02
            "custevent_case_add1",
            "custevent_case_add2",
            "custevent_case_city",
            "custevent_case_postcode",
            "custevent_case_country",
            "custevent_case_state_new",
            "custevent_purchase_date", //made active again by brandon Nov 21, 2023
            "custevent_sn_frame",
            "custevent_sn_enclosure",
            "custevent_sn_mat",
            "custevent_sunshade",
            "custevent_warranty_item_cr_id",    // warranty item class
            "custevent_shifting_wheels",
            "custevent_flexrhoop",
            "custevent_flexrstep",
            "custevent_weather_cover",
            "custevent_ground_anchor",
            "startdate",
            "custevent_case_users_details"
        ];
        for (let index = 0; index < required_text_values.length; index++) {
            let fieldId = required_text_values[index];
            if (context[fieldId]) {
                // log.debug('setText', {fieldId, value: context[fieldId]});
                objRecordSupportCase.setText({
                    fieldId,
                    text: context[fieldId]
                });
            }
        }

        // NUMBER/ID values in required order
        const required_values = [
            "custevent_trampoline_model",
            "custevent_installer"
        ];
        for (let index2 = 0; index2 < required_values.length; index2++) {
            let key2 = required_values[index2];
            //doValidation([context[key2]], required_values, 'POST');
            objRecordSupportCase.setValue({
                fieldId: key2,
                value: context[key2]
            });
        }

        // MULTISELECT values in required order
        const required_multiselect_values = ["custevent_access_warr_claim"];
        for (let index2 = 0; index2 < required_multiselect_values.length; index2++) {
            let key2 = required_multiselect_values[index2];
            //log.debug('multiselect', { key2, value: context[key2] })
            //doValidation([context[key2]], required_multiselect_values, 'POST');
            objRecordSupportCase.setValue({
                fieldId: key2,
                value: context[key2]
            });
        }

        if (context.photo) {
            for (let index3 = 0; index3 < context.photo.length; index3++) {
                objRecordSupportCase.setValue({
                    fieldId: `custevent_photo${index3 + 1}`,
                    value: context.photo[index3]
                });
                log.debug('photo', { id: `custevent_photo${index3}`, value: context.photo[index3] });
            }
        }

        const id = objRecordSupportCase.save({
            enableSourcing: true
        });

        log.debug('link', { id, recordType: 'supportcase' });

        /*
            Update Address if needed
        */
        checkAddress(customerId, {
            addressee: context.firstName + ' ' + context.lastName,
            addr1: context.custevent_case_add1,
            addr2: context.custevent_case_add2,
            city: context.custevent_case_city,
            state: context.custevent_case_state_new,
            zip: context.custevent_case_postcode,
            country: context.custevent_case_country,
        }, false);

        return String(id);
    }

    return {
        post
    };
});