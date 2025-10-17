/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record'], (record) => {
  const onAction = (context) => {
    const title = "onAction() :: ";

    try {
      const salesOrderRec = context.newRecord;
      log.debug(title + "salesOrderRec.id:", salesOrderRec.id);
      let objData = validateBackOrderAndFulfillment(salesOrderRec);

      log.debug(title + "objData:", JSON.stringify(objData));

      if (objData.isAlreadFulfilled) {
        return true;
      }

      if (objData.backOrderedFlag) {
        record.submitFields({
          type: record.Type.SALES_ORDER,
          id: salesOrderRec.id,
          values: {
            custbody_logistics_approval: false
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true
          }
        });

        return true;

      }


      let isFulfillmentCreated = createItemFulfillment(context);

      if (!isFulfillmentCreated) {
        record.submitFields({
          type: record.Type.SALES_ORDER,
          id: salesOrderRec.id,
          values: {
            custbody_logistics_approval: false
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true
          }
        });

      }

    } catch (e) {
      log.error('ERROR IN ' + title, e);
    }
  };

  const createItemFulfillment = (context) => {
    const title = "createItemFulfillment() :: ";

    try {
      const salesOrderRec = context.newRecord;
      const fulfillmentRecord = record.transform({
        fromType: record.Type.SALES_ORDER,
        fromId: salesOrderRec.id,
        toType: record.Type.ITEM_FULFILLMENT,
        isDynamic: false
      });

      const lineCount = fulfillmentRecord.getLineCount({ sublistId: 'item' });

      log.debug(title + "lineCount:", lineCount);

      for (let i = 0; i < lineCount; i++) {
        const itemType = fulfillmentRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: i
        });

        if (itemType != 'InvtPart' && itemType != 'Assembly') {
          fulfillmentRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'itemreceive',
            line: i,
            value: false
          });
        }
      }
      const fulfillmentId = fulfillmentRecord.save();

      log.debug(title + "fulfillmentId:", fulfillmentId);

      return fulfillmentId;

    } catch (e) {
      log.error('ERROR IN ' + title, e);

      return false;
    }
  };

  const validateBackOrderAndFulfillment = (salesOrderRec) => {
    const title = "validateBackOrderAndFulfillment() :: ";

    try {
      let backOrderedFlag = false;
      let isAlreadFulfilled = false;
      const lineCount = salesOrderRec.getLineCount({ sublistId: 'item' });

      log.debug(title + "lineCount:", lineCount);

      for (let i = 0; i < lineCount; i++) {
        const itemType = salesOrderRec.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: i
        });

        if (itemType == 'InvtPart' || itemType == 'Assembly') {
          let qtyCommitted = salesOrderRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantitycommitted',
            line: i
          }) || 0;
          let qtyFulfilled = salesOrderRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantityfulfilled',
            line: i
          }) || 0;

          let qtyPickPack = salesOrderRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantitypickpackship',
            line: i
          }) || 0;

          if (+qtyPickPack > 0) {
            isAlreadFulfilled = true;
          }


          log.debug(title + "qtyCommitted : qtyFulfilled : qtyPickPack", qtyCommitted + " : " + qtyFulfilled + " : " + qtyPickPack);

          if (parseInt(qtyCommitted) == 0 && qtyFulfilled == 0) {

            backOrderedFlag = true;

          }

        }
      }

      log.debug(title + "backOrderedFlag:", backOrderedFlag);

      return {
        backOrderedFlag,
        isAlreadFulfilled
      };

    } catch (e) {
      log.error('ERROR IN ' + title, e);

      return false;
    }
  };

  return {
    onAction
  };
});
