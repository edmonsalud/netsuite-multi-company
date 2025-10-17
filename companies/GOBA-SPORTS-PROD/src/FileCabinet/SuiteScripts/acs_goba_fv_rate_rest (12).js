/**
  * @NApiVersion 2.x
  * @NScriptType Restlet
  * @NModuleScope SameAccount
  */
define(['N/record', 'N/http', 'N/https', 'N/encode', 'N/search','N/email','N/file'],
  /**
    * @param {record} record
    */
  function(record, http, https, encode, search,email,file) {

    /**
      * Function called upon sending a GET request to the RESTlet.
      *
      * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
      * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
      * @since 2015.1
      */
    function doGet(requestParams) {

    }

    /**
      * Function called upon sending a PUT request to the RESTlet.
      *
      * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
      * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
      * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
      * @since 2015.2
      */
    function doPut(requestBody) {

    }


    /**
      * Function called upon sending a POST request to the RESTlet.
      *
      * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
      * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
      * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
      * @since 2015.2
      */
    function doPost(requestBody) {

      log.debug('Restlet executed');

      var pickupdate = requestBody.pickupdate;

      log.debug('pickupdate', pickupdate);

      var shipto = requestBody.shipto;

      log.debug('shipto', shipto);

      var shiptodetails = search.lookupFields({
        type: 'customrecord_fv_customer',
        id: shipto,
        columns: ['custrecord_fv_company', 'custrecord_fv_streetaddr', 'custrecord_fv_citystatezip', 'custrecord_fv_contact_name', 'custrecord_fv_contact_phone', 'custrecord_fv_contact_email', 'custrecord_fv_open_time', 'custrecord_fv_close_time','custrecord_fv_call_before','custrecord_fv_delivery_appointment','custrecord_fv_send_copy_bol','custrecord_fv_lift_gate']
      });
      log.debug('shipttodetails', shiptodetails);
      
      var callbeforedelivery = shiptodetails.custrecord_fv_call_before;
          
      var deliveryappointment = shiptodetails.custrecord_fv_delivery_appointment;
      
      var sendcopyofbol = shiptodetails.custrecord_fv_send_copy_bol;
		
      var destcompany = shiptodetails.custrecord_fv_company;
      
       log.debug('destcompany', destcompany);
      
      var destaddress = shiptodetails.custrecord_fv_streetaddr;
      
      log.debug('destaddress', destaddress);
      
      var destcity = shiptodetails.custrecord_fv_citystatezip;
      
      var liftgate = shiptodetails.custrecord_fv_lift_gate;
      
      log.debug('liftgate', liftgate);
      
      var destcitysplitted = destcity.split(",");
      
      destcity = destcitysplitted[0];
      
      log.debug('destcity', destcity);
      
      var deststate = destcitysplitted[1];
      
      deststate = deststate.trim();
      
      var deststatesplitted = deststate.split(" ");
      
      deststate = deststatesplitted[0];
      
      log.debug('deststate', deststate);
      
      var destpostalcode = deststatesplitted[1];
      
      log.debug('destpostalcode', destpostalcode);
        
      var weight = parseInt(requestBody.weight);

      log.debug('weight', weight);

      var length = parseInt(requestBody.length);

      log.debug('length', length);

      var width = parseInt(requestBody.width);

      log.debug('width', width);

      var height = parseInt(requestBody.height);

      log.debug('height', height);

      var freightclass = requestBody.freightclass;

      log.debug('freightclass', freightclass);

      var ponumber = requestBody.ponumber;

      log.debug('ponumber', ponumber);
      
      
      
      
        
       
        
      

      var apikey = "1759912467f944427c6e817beee02b4f44ca08ceb64:";// should be changed

      var base64apikey = encode.convert({
        string: apikey,
        inputEncoding: encode.Encoding.UTF_8,
        outputEncoding: encode.Encoding.BASE_64
      });

      var authurl = "https://www.freightview.com/api/v1.0/authenticate";

      var aheaders = {
        "Content-type": "application/json",
        "Authorization": "Basic " + base64apikey
      };


      var authresponse = https.request({
        method: http.Method.GET,
        url: authurl,
        headers: aheaders
      });


      log.debug("Auth Response", authresponse.body);

      var rateurl = 'https://www.freightview.com/api/v1.0/rates';
if (liftgate == true) {
log.debug("liftgate true");
      var json = {
        "pickupDate": pickupdate,
        "originPostalCode": "75074",
        "originCompany": "Springfree Trampoline",
        "originAddress": "1808 10th Street, Suite 400",
        "originCity": "Plano",
        "originState": "TX",
        "originType": "business dock",
        "originContactName": "",
        "originContactPhone": "",
        "originDockHoursOpen": "",
        "originDockHoursClose": "",
        "destCompany": destcompany,
        "destAddress": destaddress,
        "destCity": destcity,
        "destState": deststate,
        "destPostalCode": destpostalcode, // destpostalcode, shipto
        "destType": "business dock",
        "destReferenceNumber": ponumber,
        "items": [{
          //"pieces":1 //default 1
          "description": "Trampolines",
          "package": "Pallets_other",
          "weight": weight,
          "freightClass": freightclass,
          "length": length,
          "width": width,
          "height": height,
        }],
        
        "charges": [
          "liftgate delivery"
        ]
        
      }
      }
      else {
        log.debug("liftgate false");
        var json = {
        "pickupDate": pickupdate,
        "originPostalCode": "75074",
        "originCompany": "Springfree Trampoline",
        "originAddress": "1808 10th Street, Suite 400",
        "originCity": "Plano",
        "originState": "TX",
        "originType": "business dock",
        "originContactName": "",
        "originContactPhone": "",
        "originDockHoursOpen": "",
        "originDockHoursClose": "",
        "destCompany": destcompany,
        "destAddress": destaddress,
        "destCity": destcity,
        "destState": deststate,
        "destPostalCode": destpostalcode, // destpostalcode, shipto
        "destType": "business dock",
        "destReferenceNumber": ponumber,
        "items": [{
          //"pieces":1 //default 1
          "description": "Trampolines",
          "package": "Pallets_other",
          "weight": weight,
          "freightClass": freightclass,
          "length": length,
          "width": width,
          "height": height,
        }],

        
      }
        
      }
      
      
      var rateresponse = https.request({
        method: http.Method.POST,
        url: rateurl,
        body: JSON.stringify(json),
        headers: aheaders
      });

      var response = JSON.parse(rateresponse.body);

      log.debug('Rate Response', response);

      var responseid = response.id;

      log.debug('responseid', response.id);

      log.debug('Rates length', response.rates.length);

      for (i = 0; i < response.rates.length; i++) {

        log.debug('Rates' + i, response.rates[i]);
        log.debug('Rates' + i + 'total', response.rates[i].total);

      }

      var rateid = response.rates[0].id; // first rate according to the sorting by cheapest in FV
      
      log.debug('rateid', rateid);

      //cheapest rate will be selected and booking request will be sent

      var json2 = {
        "id": responseid,
        "rateId": rateid,
        "schedulePickup": false,
        "shareShipmentEmails": [
          "mdadak@netsuite.com"//needs to be changed
        ],
        "originCompany": "Springfree Trampoline",
        "originAddress": "1808 10th Street, Suite 400",
        "originContactName": "Efren Beltran",//default
        "originContactPhone": "(555) 555-5555",//default
        "originContactEmail": "",
        "originReferenceNumber": "",
        "originInstructions": "",
        "originDockHoursOpen": "9:00 AM",//default
        "originDockHoursClose": "5:00 PM",//default
        "destCompany": "",
        "destAddress": "",
        "destAddress2": "",
        "destContactName": "",
        "destContactPhone": "",
        "destContactEmail": "",
        "destReferenceNumber": ponumber,
        "destInstructions": "",
        "destDockHoursOpen": "9:00 AM",//default
        "destDockHoursClose": "5:00 PM",//default
        "emergencyName": "",
        "emergencyPhone": ""
      }


      var bookurl = 'https://www.freightview.com/api/v1.0/book';

      var bookresponse = https.request({
        method: http.Method.POST,
        url: bookurl,
        body: JSON.stringify(json2),
        headers: aheaders
      });

      var bookresponse1 = JSON.parse(bookresponse.body);
      
      log.debug('Book Response', bookresponse1.id);
      
      var fvshipment = record.create({
       type: 'customrecord_fv_shipment',
       isDynamic: true
   });
      
      log.debug("BOL", bookresponse1.files);
      
      fvshipment.setValue("name", "FV Shipment BOL # " + bookresponse1.bolNum);
      fvshipment.setValue("custrecord_fv_shipment_id", bookresponse1.id);
      
      fvshipment.setValue("custrecord_fv_bol", bookresponse1['files'][0].url);
      
      fvshipment.setValue("custrecord_fv_call_before_sh",callbeforedelivery);
      fvshipment.setValue("custrecord_fv_delivery_appointment_sh",deliveryappointment);
      fvshipment.setValue("custrecord_fv_send_copy_bol_sh",sendcopyofbol);
      fvshipment.setValue("custrecord_fv_label_url",bookresponse1['files'][3].url);
      fvshipment.setValue("custrecord_fv_bol_number", bookresponse1.bolNum);
      
        var bolurl           = bookresponse1['files'][0].url;
        var content    = https.get({ url: bolurl });
        var bol = content.body;

        var fileObj1 = file.create({
            name: "BOL#"+bookresponse1.bolNum+".pdf",
            fileType: file.Type.PDF,
            contents: bol,
            folder: 803672, // your folder id on file cabinet
            isOnline: false
        });
        var id = fileObj1.save();
      
      var labelurl           = bookresponse1['files'][3].url;
        var content    = https.get({ url: labelurl });
        var label= content.body;

        var fileObj2 = file.create({
            name: "Label BOL#"+bookresponse1.bolNum+".pdf",
            fileType: file.Type.PDF,
            contents: label,
            folder: 803672, // your folder id on file cabinet
            isOnline: false
        });
        var labelid = fileObj2.save();

        log.debug('id of label file: ', labelid);

      var fvshipmentid = fvshipment.save();
      
      log.debug('fvshipmentid', fvshipmentid);
      
      var bolpdf = record.attach({
    record: {
        type: 'file',
        id: id
    },
    to: {
        type: 'customrecord_fv_shipment',
        id: fvshipmentid
    }
});
      
   var labelpdf = record.attach({
    record: {
        type: 'file',
        id: labelid
    },
    to: {
        type: 'customrecord_fv_shipment',
        id: fvshipmentid
    }
});
      
      if(sendcopyofbol == true){
        
        email.send({
    author: 6177264,//emp id as a sender
    recipients: shiptodetails.custrecord_fv_contact_email,
    subject: 'Copy of BOL #'+ bookresponse1.bolNum,
    body: 'Here is the link: '+bookresponse1['files'][0].url, //email body can be arranged by html
    attachments: [fileObj1,fileObj2],

});
        
      }

      return fvshipmentid;

    }

    /**
      * Function called upon sending a DELETE request to the RESTlet.
      *
      * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
      * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
      * @since 2015.2
      */
    function doDelete(requestParams) {

    }

    return {
      'get': doGet,
      'put': doPut,
      'post': doPost,
      'delete': doDelete
    };

  });