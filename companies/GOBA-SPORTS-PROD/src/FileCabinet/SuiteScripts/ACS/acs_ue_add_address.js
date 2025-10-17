/**
 * 
 * Version		Date				Author						Remarks
 * 1.0			11 Nov 2022			Vlad Motyka 				.
 *
 * Copyright (c) 1998-2021 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.h NetSuite.
 * 
 * 
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
/*jshint esversion: 6 */
define(['N/record'], (record) => {
    function setAddress(customer_id, object, override) {
        var customerRec = record.load({
            type: "customer",
            id: customer_id,
            isDynamic: true
        });

        customerRec.selectLine({
            sublistId: "addressbook",
            line: 0
        });

        var myaddressSubrecord = customerRec.getCurrentSublistSubrecord({
            sublistId: "addressbook",
            fieldId: "addressbookaddress"
        });

        for (const key in object) {
            if (Object.hasOwnProperty.call(object, key)) {
                if (object[key] !== null) {
                    myaddressSubrecord.setText({
                        fieldId: key,
                        text: object[key]
                    });
                }
            }
        }

        if (override) {
            myaddressSubrecord.setValue({
                fieldId: "override",
                value: true
            });
        }

        customerRec.commitLine({
            sublistId: "addressbook"
        });

        customerRec.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
        });
    }
    function beforeSubmit(scriptContext) {
        try {
            const rec = scriptContext.newRecord;
          	/*
          	 * This Function will be executed only for CASE Category of type "Warranty & Product Support"
          	 * */
            if (rec.getText({fieldId: 'category'}) != 'Warranty & Product Support') return false;

            const object = {
                custevent_case_add1: null,
                custevent_case_add2: null,
                custevent_case_city: null,
                custevent_case_state_new: null,
                custevent_case_postcode: null,
                custevent_case_country: null
            };
            for (const key in object) {
                if (Object.hasOwnProperty.call(object, key)) {
                    object[key] = rec.getText({fieldId: key});
                }
            }
            object.addressee = rec.getText({fieldId: 'company'}).replace(/\d+ /,'');
            object.customerId = rec.getValue({fieldId: 'company'});
            log.debug('object', object);

            setAddress(object.customerId, {
                addressee: object.addressee,        //text      "Full Name"
                //addrphone: null,        //phone     Address Phone
                addr1: object.custevent_case_add1,            //text      Address 1
                addr2: object.custevent_case_add2,            //text      Address 2
                //addr3: null,            //text      Address 3
                city: object.custevent_case_city,             //text      City
                state: object.custevent_case_state_new,            //text      State
                zip: object.custevent_case_postcode,              //text      Zip
                country: object.custevent_case_country,          //select    Country
                //countrycode: null,      //text      Country Code
                //addrtext: null,         //textarea  Address Text
                //override    checkbox    Override
            }, false);

        } catch(error) {
            log.error({
                title: 'beforeSubmit',
                details: error
            });
        }
    }
    return {
        beforeSubmit
    };
});