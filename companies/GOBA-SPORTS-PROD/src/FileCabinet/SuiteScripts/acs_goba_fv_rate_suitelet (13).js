/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/http', 'N/https', 'N/ui/serverWidget', 'N/redirect', 'N/crypto', 'N/encode', 'N/runtime', '/SuiteScripts/oauth', '/SuiteScripts/secret'],

    function(http, https, ui, redirect, crypto, encode, runtime, oauth, secret) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {

            log.debug('Suitelet executed!');

            var date = new Date();

            var time = date.getHours();

            log.debug('Time', time);

            if (context.request.method === 'GET' && time <= 3) {


                var form = ui.createForm({
                    title: 'Please select Pick up Date and enter Dimensions'
                });

                var pdate = form.addField({
                    id: 'custpage_pickupdate',
                    type: ui.FieldType.DATE,
                    label: 'Pick up Date'
                });

                var shipto = form.addField({
                    id: 'custpage_shipto',
                    type: ui.FieldType.SELECT,
                    label: 'Ship To (ZIP/POSTAL CODE)',
                    source: 'customrecord_fv_customer'
                });

                shipto.isMandatory = true;


                var weight = form.addField({
                    id: 'custpage_weight',
                    type: ui.FieldType.INTEGER,
                    label: 'Weight (lbs)'
                });

                weight.isMandatory = true;

                var length = form.addField({
                    id: 'custpage_length',
                    type: ui.FieldType.INTEGER,
                    label: 'Length (in)'
                });
                length.isMandatory = true;

                var width = form.addField({
                    id: 'custpage_width',
                    type: ui.FieldType.INTEGER,
                    label: 'Width (in)'
                });
                width.isMandatory = true;

                var height = form.addField({
                    id: 'custpage_height',
                    type: ui.FieldType.INTEGER,
                    label: 'Height (in)'
                });
                height.isMandatory = true;

                var ponumber = form.addField({
                    id: 'custpage_ponumber',
                    type: ui.FieldType.TEXT,
                    label: 'Purchase Order #'
                });
                ponumber.isMandatory = true;

                var freightclass = form.addField({
                    id: 'custpage_freightclass',
                    type: ui.FieldType.SELECT,
                    label: 'Freight Class'
                });
                freightclass.isMandatory = true;

                freightclass.addSelectOption({
                    value: '',
                    text: ''
                });


                freightclass.addSelectOption({
                    value: '50',
                    text: '50'
                });
                freightclass.addSelectOption({
                    value: '55',
                    text: '55'
                });
                freightclass.addSelectOption({
                    value: '60',
                    text: '60'
                });
                freightclass.addSelectOption({
                    value: '65',
                    text: '65'
                });
                freightclass.addSelectOption({
                    value: '70',
                    text: '70'
                });
                freightclass.addSelectOption({
                    value: '75',
                    text: '75'
                });
                freightclass.addSelectOption({
                    value: '77.5',
                    text: '77.5'
                });
                freightclass.addSelectOption({
                    value: '85',
                    text: '85'
                });
                freightclass.addSelectOption({
                    value: '92.5',
                    text: '92.5'
                });
                freightclass.addSelectOption({
                    value: '100',
                    text: '100'
                });
                freightclass.addSelectOption({
                    value: '110',
                    text: '110'
                });
                freightclass.addSelectOption({
                    value: '125',
                    text: '125'
                });
                freightclass.addSelectOption({
                    value: '150',
                    text: '150'
                });
                freightclass.addSelectOption({
                    value: '175',
                    text: '175'
                });
                freightclass.addSelectOption({
                    value: '200',
                    text: '200'
                });
                freightclass.addSelectOption({
                    value: '250',
                    text: '250'
                });
                freightclass.addSelectOption({
                    value: '300',
                    text: '300'
                });
                freightclass.addSelectOption({
                    value: '400',
                    text: '400'
                });
                freightclass.addSelectOption({
                    value: '500',
                    text: '500'
                });

                form.addSubmitButton({
                    label: 'Submit'
                });


                context.response.writePage({
                    pageObject: form
                });



            } else if (context.request.method === 'GET' && time > 3) {

                var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1;
                var yyyy = today.getFullYear();

                today = mm + '/' + dd + '/' + yyyy;

                var pickupDate = today;

                log.debug('pickupDate', pickupDate);

                var form = ui.createForm({
                    title: 'Please enter Dimensions'
                });

                var pdate = form.addField({
                    id: 'custpage_pickupdate',
                    type: ui.FieldType.DATE,
                    label: 'Date'
                });

                pdate.defaultValue = pickupDate;

                pdate.updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                });


                var shipto = form.addField({
                    id: 'custpage_shipto',
                    type: ui.FieldType.SELECT,
                    label: 'Ship To (ZIP/POSTAL CODE)',
                    source: 'customrecord_fv_customer'
                });

                shipto.isMandatory = true;

                var weight = form.addField({
                    id: 'custpage_weight',
                    type: ui.FieldType.INTEGER,
                    label: 'Weight (lbs)'
                });

                weight.isMandatory = true;

                var length = form.addField({
                    id: 'custpage_length',
                    type: ui.FieldType.INTEGER,
                    label: 'Length (in)'
                });
                length.isMandatory = true;

                var width = form.addField({
                    id: 'custpage_width',
                    type: ui.FieldType.INTEGER,
                    label: 'Width (in)'
                });
                width.isMandatory = true;

                var height = form.addField({
                    id: 'custpage_height',
                    type: ui.FieldType.INTEGER,
                    label: 'Height (in)'
                });
                height.isMandatory = true;

                var ponumber = form.addField({
                    id: 'custpage_ponumber',
                    type: ui.FieldType.TEXT,
                    label: 'Purchase Order #'
                });
                ponumber.isMandatory = true;

                var freightclass = form.addField({
                    id: 'custpage_freightclass',
                    type: ui.FieldType.SELECT,
                    label: 'Freight Class'
                });
                freightclass.isMandatory = true

                freightclass.addSelectOption({
                    value: '',
                    text: ''
                });


                freightclass.addSelectOption({
                    value: '50',
                    text: '50'
                });
                freightclass.addSelectOption({
                    value: '55',
                    text: '55'
                });
                freightclass.addSelectOption({
                    value: '60',
                    text: '60'
                });
                freightclass.addSelectOption({
                    value: '65',
                    text: '65'
                });
                freightclass.addSelectOption({
                    value: '70',
                    text: '70'
                });
                freightclass.addSelectOption({
                    value: '75',
                    text: '75'
                });
                freightclass.addSelectOption({
                    value: '77.5',
                    text: '77.5'
                });
                freightclass.addSelectOption({
                    value: '85',
                    text: '85'
                });
                freightclass.addSelectOption({
                    value: '92.5',
                    text: '92.5'
                });
                freightclass.addSelectOption({
                    value: '100',
                    text: '100'
                });
                freightclass.addSelectOption({
                    value: '110',
                    text: '110'
                });
                freightclass.addSelectOption({
                    value: '125',
                    text: '125'
                });
                freightclass.addSelectOption({
                    value: '150',
                    text: '150'
                });
                freightclass.addSelectOption({
                    value: '175',
                    text: '175'
                });
                freightclass.addSelectOption({
                    value: '200',
                    text: '200'
                });
                freightclass.addSelectOption({
                    value: '250',
                    text: '250'
                });
                freightclass.addSelectOption({
                    value: '300',
                    text: '300'
                });
                freightclass.addSelectOption({
                    value: '400',
                    text: '400'
                });
                freightclass.addSelectOption({
                    value: '500',
                    text: '500'
                });

                form.addSubmitButton({
                    label: 'Submit'
                });


                context.response.writePage({
                    pageObject: form
                });


            } else {

                var pickupDate = context.request.parameters.custpage_pickupdate;
                var weight = context.request.parameters.custpage_weight;
                var shipto = context.request.parameters.custpage_shipto;
                var length = context.request.parameters.custpage_length;
                var width = context.request.parameters.custpage_width;
                var height = context.request.parameters.custpage_height;
                var freightclass = context.request.parameters.custpage_freightclass;
                var ponumber = context.request.parameters.custpage_ponumber;

                log.debug('pickupDate', pickupDate);
                log.debug('shipto', shipto);
                log.debug('weight', weight);
                log.debug('length', length);
                log.debug('width', width);
                log.debug('height', height);
                log.debug('freightclass', freightclass);
                log.debug('ponumber', ponumber);


                var json = "{\"pickupdate\":\"" + pickupDate + "\",\"shipto\":\"" + shipto + "\",\"weight\":\"" + weight + "\",\"length\":\"" + length + "\",\"width\":\"" + width + "\",\"height\":\"" + height + "\",\"ponumber\":\"" + ponumber + "\",\"freightclass\":\"" + freightclass + "\"}";

                log.debug('json parameters', json);

                var url = 'https://693183.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=2237&deploy=1';

                var method = "POST";
                var headers = oauth.getHeaders({
                    url: url,
                    method: method,
                    tokenKey: secret.token.public,
                    tokenSecret: secret.token.secret
                });


                headers['Content-Type'] = 'application/json';

                var response = https.request({
                    method: http.Method.POST,
                    url: url,
                    body: json,
                    headers: headers
                });


                log.debug(response.body);

                //redirect to custom shipping record
                //
                redirect.toRecord({
									id: response.body,
									type: 'customrecord_fv_shipment',
									isEditMode: false
								})


            }
        }

        return {

            onRequest: onRequest

        }

    });