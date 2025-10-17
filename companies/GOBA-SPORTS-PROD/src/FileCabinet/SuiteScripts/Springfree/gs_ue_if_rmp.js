/**
 * Module Description
 *
 * Version  Date    Author          Remarks
 * 1.00     02-11-17  Eric.Choe    Created following functions
 *                       - "function setDefaults_AfterSubmit(type)"
 *                       - "function createInvoice(so_id)"
 *
 * 1.01    15-11-17  Eric.Choe    Updated "function setDefaults_AfterSubmit(type)"
 *                       - To be triggered for Core Sports as well
 *
 * 1.02    22-11-17  Eric.Choe    Updated "function createInvoice(so_id)"
 *                       - To filter out fully billed sales order
 *
 * 1.03    18-01-17  Eric.Choe    Updated "function setDefaults_AfterSubmit(type)"
 *                       - Not to trigger "createInvoice(createdFrom)" for Shopify orders
 *
 * 1.04    22-02-18  Eric.Choe    Updated "function setDefaults_AfterSubmit(type)"
 *                       - To trigger "setFillRate(createdFrom, false, false)" when Item Fulfillment is created(i.e. for Picked item)
 *                       - To invoice non-fulfilable line items in the first Invoice
 *
 * 1.14    07-03-18  Eric.Choe    Created following function for Springfree orders
 *                       - "function createInvoiceFull(so_id)"
 *                      Updated "function setDefaults_AfterSubmit(type)"
 *                       - To trigger "function createInvoiceFull(so_id)"
 *
 * 1.15    01-05-18  Eric.Choe    Updated "function setDefaults_AfterSubmit(type)"
 *                       - To trigger "function createInvoiceFull(so_id)" for NA as well
 *
 * 1.16    10-05-18  Eric.Choe    Updated "function setDefaults_AfterSubmit(type)"
 *                       - To add "128 *SFT Sales Order (Dealer/Wholesaler Inv)" in cashsaleForms
 *
 * 1.17    16-07-18  Eric.Choe    Updated "function setDefaults_AfterSubmit(type)"
 *                       - To update fill rate for Shopify orders
 *
 * 1.20    20-08-18  Eric.Choe    Created following function for RMP orders
 *                       - function updateQtyPicked()
 *
 * 1.21    01-10-19  Eric.Choe    Updated "function setDefaults_AfterSubmit(type)"
 *                       - Added AUDIT log to monitor script execution context
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {NLObjForm} form Current form
 * @param {NLObjRequest} request Request object
 */
function test_BeforeLoad(type, form, request) {
  var processMsg, errorStr;
  try {
    if (type.toString() === 'edit') {
      /*      var curRec       = nlapiLoadRecord('salesorder', nlapiGetFieldValue('createdfrom'));
            var totalLineItem  = curRec.getLineItemCount('item');
            for(var i = 1; i<=totalLineItem; i++){
              curRec.selectLineItem('item', i); // Get current line item
              var iTem = curRec.getCurrentLineItemText('item', 'item');
              var itemType = curRec.getCurrentLineItemValue('item', 'itemtype');
              var itemSubType = curRec.getCurrentLineItemValue('item', 'itemsubtype');
              nlapiLogExecution('DEBUG', 'test_BeforeLoad','item = ' + iTem + ' : itemtype = ' + itemType + ' : itemSubType = ' + itemSubType);
            }*/
    }
  } catch(ex) {
    processMsg = 'Error encountered while processing Item Fulfilment \n';
    errorStr   = ex.toString();
    if (ex instanceof nlobjError) {
      errorStr = getErrorMessage(ex);
    }
    nlapiLogExecution('ERROR', 'createInvoice', processMsg  + ' ' +  errorStr);
  }
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 */
function setDefaults_AfterSubmit(type) {
  var extContext, subSidiary, createdFrom, updateFillRate, isValidRec, createdFromType, validSubsidiary, cashsaleForms, customForm, processMsg, errorStr;
  try {
    extContext = nlapiGetContext().getExecutionContext();
    nlapiLogExecution('AUDIT', 'Execution Context', 'Execution Context = ' + extContext + ' : ' + 'type = ' + type + ' : ' + 'recType = ' + nlapiGetRecordType() + ' : '  + 'recID = ' + nlapiGetRecordId());
    type = String(type);
    if (type !== 'delete' && type !== 'xedit') {
      subSidiary     = nlapiGetFieldValue('subsidiary');
      createdFrom    = nlapiGetFieldValue('createdfrom');
      updateFillRate = false;
      isValidRec     = false;
      if (subSidiary === '9' || subSidiary === '10') { // Update Quantity Picked for 9 = RMP Athletic, 10 = Core Sports only
        updateQtyPicked();
      }
      if (createdFrom) {
        createdFromType = nlapiLookupField('transaction', createdFrom, 'recordtype');
        if (createdFromType === 'salesorder') {
          validSubsidiary = ['1','3','4','5','9','10'];
          cashsaleForms   = ['100', '150', '167', '128'];
          customForm      = nlapiLookupField('salesorder', createdFrom, 'customform');
          if (validSubsidiary.indexOf(subSidiary) !== -1 && cashsaleForms.indexOf(customForm) === -1) { // If it's valid subsidiary & not sales order-cash sale form
            isValidRec = true;
            if (subSidiary === '9' ||subSidiary === '10') { // Update fill rate for 9 = RMP Athletic, 10 = Core Sports only
              updateFillRate = true;
            }
          }
        }
      }
      if (isValidRec) {
        if (type === 'create' && updateFillRate) {
          setFillRate(createdFrom, false, false); // Update Fill Rate on Sales Order when it's picked
        }
        if (nlapiGetFieldText('shipstatus') === 'Shipped' && nlapiGetFieldValue('custbody_order_status') !== '2') {
          if (updateFillRate) { // If it's RMP sales order
            if (type !== 'create') { // To avoid multi-executions in creation
              setFillRate(createdFrom, false, false); // Update Fill Rate/Quantity Shipped on Sales Order
            }
            if (isNULL(nlapiLookupField('salesorder', createdFrom, 'custbody_celigo_shopify_order_no')) && customForm !== '229') { // If it's not a Shopify order
              createInvoice(createdFrom); //Create Invoice from Sales Order
            }
          } else {
            createInvoiceFull(createdFrom); //Create Invoice in full for Springfree(i.e. to handle group items)
          }
          nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), 'custbody_order_status', '2'); // Update flag field so it only run once, 2 = Shipped
        }
      } else { // Not valid record
        if (createdFrom) {
          nlapiLogExecution('AUDIT', 'setDefaults_AfterSubmit', 'Not valid Item Fulfilment ' + nlapiGetRecordId()
            + ' : Subsidiary = ' + nlapiGetFieldText('subsidiary')
            + ' : Customform = ' + nlapiLookupField('salesorder', createdFrom, 'customform', true));
        } else {
          nlapiLogExecution('AUDIT', 'setDefaults_AfterSubmit', 'Not valid Item Fulfilment ' + nlapiGetRecordId()
            + ' : Subsidiary = ' + nlapiGetFieldText('subsidiary')
            + ' : CreatedFrom = NULL');
        }
      }
    }
  } catch(ex) {
    processMsg = 'Error encountered while processing Item Fulfilment \n';
    errorStr   = ex.toString();
    if (ex instanceof nlobjError) errorStr = getErrorMessage(ex);
    nlapiLogExecution('ERROR', 'setDefaults_AfterSubmit', processMsg  + ' ' +  errorStr);
  }
}

function updateQtyPicked() {
  var curRec, i, qtyPicked, processMsg, errorStr, totalLineItem;
  try {
    nlapiLogExecution('debug', 'updateQtyPicked', 'Reloading IF ' + nlapiGetRecordId());
    curRec    = nlapiLoadRecord('itemfulfillment', nlapiGetRecordId());
    qtyPicked = 0;
    // Calculate total Quantity picked
    totalLineItem = curRec.getLineItemCount('item');
    for (i = 1; i <= totalLineItem; i++) {
      curRec.selectLineItem('item', i); // Get current line item
      qtyPicked += parseInt(curRec.getCurrentLineItemValue('item', 'quantity'));
    }
    curRec.setFieldValue('custbody_so_qty_picked', qtyPicked);
    nlapiLogExecution('debug', 'updateQtyPicked', 'Saving IF ' + nlapiGetRecordId());
    nlapiSubmitRecord(curRec,false,true); // Ignore sourcing & mandatory fields
  } catch(ex) {
    processMsg = 'Error encountered while processing Item Fulfilment \n';
    errorStr   = ex.toString();
    if (ex instanceof nlobjError) {
      errorStr = getErrorMessage(ex);
    }
    nlapiLogExecution('ERROR', 'updateQtyPicked', processMsg  + ' ' +  errorStr);
  }
}

function createInvoiceFull(so_id) { // Triggered in After Submit, when fulfillment is shipped
  var isValidRec, rec_Status, slUrl, response, newInvoice_ID, processMsg, errorStr;
  try {
    if (so_id) {
      // salesOrder = nlapiLoadRecord('salesorder', so_id);
      // rec_Status = salesOrder.getFieldValue('orderstatus');
      rec_Status = nlapiLookupField('salesorder', so_id, 'status', true);
      nlapiLogExecution('debug','createInvoiceFull', 'Looked up status for SO ID: ' + rec_Status);
      isValidRec = rec_Status === 'Pending Billing' || rec_Status === 'Pending Billing/Partially Fulfilled'; // F = Pending Billing, E = Pending Billing/Partially Fulfilled
      /*      else if(rec_Status == 'E'){ // E = Pending Billing/Partially Fulfilled
              if(rec_Subsidiary == '1' || rec_Subsidiary == '5'){ // AU = 1, US = 3, CA = 4, NZ = 5,
                isValidRec = true;
              }
            }*/
      // Bill Sales Order if it's valid
      if (isValidRec) {
        nlapiLogExecution('debug','createInvoiceFull', 'Triggering invoice creation for SO ID: ' + so_id);
        slUrl = nlapiResolveURL('SUITELET', 'customscript_server_task_suitelet', 'customdeploy1', true);
        response = nlapiRequestURL(slUrl + '&mode=invoiceSalesOrder&orderId=' + so_id + '&fulfillment=' + nlapiGetRecordId()); // [GOBASD-6]
        nlapiLogExecution('debug', 'createInvoiceFull', 'Response (' + new Date() + '): ' + response.getBody());
        newInvoice_ID = response.getBody();
        // var newInvoice    = nlapiTransformRecord('salesorder', so_id, 'invoice');
        // var newInvoice_ID  = nlapiSubmitRecord(newInvoice);
        nlapiLogExecution('AUDIT', 'createInvoiceFull', 'Invoice ' + newInvoice_ID + ' is created from Item Fulfilment ' + nlapiGetRecordId() + ' : Usage Remaining = ' + nlapiGetContext().getRemainingUsage());
      } else {
        nlapiLogExecution('AUDIT', 'createInvoiceFull', 'Invoice is not created from Item Fulfilment ' + nlapiGetRecordId() + ' : Sales Order Status = ' + salesOrder.getFieldText('orderstatus') + ' : Customform = ' + salesOrder.getFieldText('customform'));
      }
    }
  } catch(ex) {
    processMsg = 'Error encountered while processing Item Fulfilment \n';
    errorStr    = ex.toString();
    if (ex instanceof nlobjError) {
      errorStr = getErrorMessage(ex);
    }
    nlapiLogExecution('ERROR', 'createInvoiceFull', processMsg  + ' ' +  errorStr);
  }
}

function createInvoice(so_id) {
  var errorStr, finalLineItemCount, isValidRec, itemType, newInvoice_ID, processMsg, qty_SO, qty_Billed_SO, isClosed, salesOrder, i, j, k, newInvoice, totalLineItem_INV, totalLineItem_IF, foundMatching, removeItem, item_INV, qty_INV, item_IF, qty_IF, lineCount;
  try {
    isValidRec = false;
    // Check all items in Sales Order are fully invoiced
    if (so_id) {
      salesOrder = nlapiLoadRecord('salesorder', so_id);
      for (k = 1; k <= salesOrder.getLineItemCount('item'); k++) {
        qty_SO        = salesOrder.getLineItemValue('item', 'quantity', k);
        qty_Billed_SO = salesOrder.getLineItemValue('item', 'quantitybilled', k);
        isClosed      = salesOrder.getLineItemValue('item', 'isclosed', k);
        if (isClosed === 'F' && qty_SO > qty_Billed_SO){
          isValidRec = true;
          break;
        }
      }
    }
    if (isValidRec) { // Not fully invoiced
      newInvoice        = nlapiTransformRecord('salesorder', so_id, 'invoice');
      totalLineItem_INV = newInvoice.getLineItemCount('item');
      totalLineItem_IF  = nlapiGetLineItemCount('item');
      lineCount = 1;
      for (i = 1; i <= totalLineItem_INV; i++) {
        foundMatching = false;
        removeItem    = false;
        item_INV      = newInvoice.getLineItemValue('item', 'item', i);
        qty_INV       = newInvoice.getLineItemValue('item', 'quantity', i);
        nlapiLogExecution('DEBUG', 'createInvoice', 'Invoice Line #' + lineCount + ' : Item = ' + item_INV
          + ' : Qty = ' + qty_INV
          + ' : QtyAvail = ' + newInvoice.getLineItemValue('item', 'quantityavailable', i)
          + ' : totalLineItem_INV = ' + totalLineItem_INV);
        for (j = 1; j <= totalLineItem_IF; j++) {
          item_IF = nlapiGetLineItemValue('item', 'item', j);
          qty_IF  = nlapiGetLineItemValue('item', 'quantity',j);
          nlapiLogExecution('DEBUG', 'createInvoice', 'Item Fulfilment Line #' + j +' : Item = ' + item_IF + ' : Qty = ' + qty_IF);
          if (item_IF === item_INV && !isNULL(qty_IF)) { // Update Qty of line item in Invoice if matching, also checking qty as all line items are available in creation of item fulfillment
            foundMatching  = true;
            if (parseInt(qty_INV) > parseInt(qty_IF)) { // Only update qty in invoice if it's partly fulfilling
              newInvoice.setLineItemValue('item','quantity', i, qty_IF);
            }
            nlapiLogExecution('DEBUG', 'createInvoice', 'foundMatching ' + foundMatching);
            break;
          }
        }
        if (!foundMatching) {
          itemType = newInvoice.getLineItemValue('item', 'itemtype', i);
          if (itemType === 'InvtPart' || itemType === 'Kit'){
            removeItem = true; // Remove non-matching one from invoice if it's inventory or kit item
          } else if(nlapiLookupField('item', item_INV, 'isfulfillable') === 'T') {
            removeItem = true; // Remove non-matching one from invoice if it can be fulfilled
          }
          if (removeItem) {
            newInvoice.removeLineItem('item', i);
            i -= 1; //Stay on current line number as current line item is removed
            totalLineItem_INV = newInvoice.getLineItemCount('item'); //Recalculate total number of line item left
            nlapiLogExecution('DEBUG', 'createInvoice', 'Invoice Line #' + lineCount + ' : Item = ' + item_INV + ' : Mismatching item is removed, remaining total number of line items is ' + totalLineItem_INV);
          }
        }
        lineCount += 1;
      }
      finalLineItemCount = newInvoice.getLineItemCount('item');
      nlapiLogExecution('DEBUG', 'createInvoice', 'Number of line items to invoice = ' +  finalLineItemCount);
      if (!isNULL(finalLineItemCount) && finalLineItemCount > 0){
        newInvoice_ID = nlapiSubmitRecord(newInvoice);
        nlapiLogExecution('AUDIT', 'createInvoice', 'Invoice ' + newInvoice_ID + ' is created from Item Fulfilment ' + nlapiGetRecordId() + ' : Usage Remaining = ' + nlapiGetContext().getRemainingUsage());
      } else {
        nlapiLogExecution('AUDIT', 'createInvoice', 'There is no quantity left to be invoiced, Sales Order : ' + so_id + ' : Usage Remaining = ' + nlapiGetContext().getRemainingUsage());
      }
    } else {
      nlapiLogExecution('AUDIT', 'createInvoice', 'There is no line item left to be invoiced, Sales Order : ' + so_id + ' : Usage Remaining = ' + nlapiGetContext().getRemainingUsage());
    }
  } catch(ex) {
    processMsg = 'Error encountered while processing Item Fulfilment \n';
    errorStr   = ex.toString();
    if (ex instanceof nlobjError) {
      errorStr = getErrorMessage(ex);
    }
    nlapiLogExecution('ERROR', 'createInvoice', processMsg  + ' ' +  errorStr);
  }
}
