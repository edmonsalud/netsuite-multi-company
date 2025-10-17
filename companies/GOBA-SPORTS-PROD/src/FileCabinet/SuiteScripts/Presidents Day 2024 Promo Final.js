/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * Written by Brandon Penycad for goba Sports Group
 */

define(['N/record', 'N/log', 'N/format'], function(record, log, format) {
  
  function beforeSubmit(context) {
    if (context.type !== context.UserEventType.CREATE) {
      return;
    }
    
    var newRecord = context.newRecord;
    var order = newRecord.type; // Check if it's a Sales Order or another record type
    
    // Check if the record is a Sales Order
    if (order === record.Type.SALES_ORDER) {
      var currentDate = new Date();
      var orderDate = newRecord.getValue('trandate'); // Get the order creation date
      var orderSubsidiary = newRecord.getValue('subsidiary'); // Get the subsidiary of the order
      
      // Check if the order falls within the specified date range
      var startDate = new Date('2024-02-15'); // Specify the start date
      var endDate = new Date('2024-02-22'); // Specify the end date
      
      if (orderDate < startDate || orderDate > endDate) {
        return; // Exit if the order is not within the specified date range
      }
      
      // Check if the subsidiary is 'SFT-US'
      if (orderSubsidiary != '3') {
        return; // Exit if the subsidiary is not 'SFT-US'
      }
      
      // Define SKU to promo code mappings
            var skuToPromoCodeMap = {
        //O200
		  '114997': {
          'default': '2363',
          'bundleResult': '2365'
        },
        //s155
		'113632': {
          'default': '2359',
          'bundleResult': '2364'
        },
		//S155RED
		'115243': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155BLUE
		'115245': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155GREEN
		'115244': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155GMG
		'115238': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155BLK
		'114736': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155WHITE
		'115246': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155 Box #1
		'113449': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155 Box #1 BLUE
		'110103': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155 Box #1 GREEN
		'110107': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155 Box #1 GUNMETAL
		'110118': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155 Box #1 RED
		'110124': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155 Box #1 PINK
		'110121': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S155 Box #1 WHITE
		'110138': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S113
		'113631': {
          'default': '2359',
          'bundleResult': '2362'
		},
		//S113BLK
		'114735': {
          'default': '2359',
          'bundleResult': '2359'
		},
		//S113GREEN
		'115241': {
          'default': '2359',
          'bundleResult': '2359'
		},
		//S113BLUE
		'115242': {
          'default': '2359',
          'bundleResult': '2359'
		},
		//S113RED
		'115240': {
          'default': '2359',
          'bundleResult': '2359'
		},
		//S113GMG
		'115237': {
          'default': '2359',
          'bundleResult': '2359'
		},
		//S113 Box #1
		'113446': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S113 Box #1 BLUE
		'110097': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S113 Box #1 GREEN
		'110100': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S113 Box #1 GUNMETAL
		'110112': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S113 Box #1 RED
		'110104': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S113 Box #1 PINK
		'110115': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//S113 Box #1 WHITE
		'110135': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//O92
		'113626': {
          'default': '2359',
          'bundleResult': '2362'
		},
		//O92 BLK
		'114734': {
          'default': '2359',
          'bundleResult': '2359'
		},
		//O92 BOX #1
		'113430': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//O92 BOX #1 BLUE
		'110079': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//O92 BOX #1 GREEN
		'110080': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//O92 BOX #1 GUNMETAL
		'110081': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//O92 BOX #1 RED
		'110077': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//O92 BOX #1 PINK
		'110078': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//O92 BOX #1 WHITE
		'110132': {
          'default': '2359',
          'bundleResult': '2359'
        },
		//O77
		'113625': {
          'default': '2358',
          'bundleResult': '2360'
		},
		//O77BLK
		'114733': {
          'default': '2358',
          'bundleResult': '2358'
		},
		//O77 BOX #1
		'113427': {
          'default': '2358',
          'bundleResult': '2358'
        },
		//O77 BOX #1 BLUE
		'110068': {
          'default': '2358',
          'bundleResult': '2358'
        },
		//O77 BOX #1 GREEN
		'110071': {
          'default': '2358',
          'bundleResult': '2358'
        },
		//O77 BOX #1 GUNMETAL
		'110074': {
          'default': '2358',
          'bundleResult': '2358'
        },
		//O77 BOX #1 RED
		'110051': {
          'default': '2358',
          'bundleResult': '2358'
        },
		//O77 BOX #1 PINK
		'110065': {
          'default': '2358',
          'bundleResult': '2358'
        },
		//O77 BOX #1 WHITE
		'110127': {
          'default': '2358',
          'bundleResult': '2358'
        },
		//O77BUNDLE
		'110160': {
          'default': '2360',
          'bundleResult': '2360'
        },
		//O77BLKBUNDLE
		'114762': {
          'default': '2360',
          'bundleResult': '2360'
        },
		//O92BUNDLE
		'110155': {
          'default': '2362',
          'bundleResult': '2362'
        },
		//O92BLKBUNDLE
		'114763': {
          'default': '2362',
          'bundleResult': '2362'
        },
		//S113BUNDLE
		'110159': {
          'default': '2362',
          'bundleResult': '2362'
        },
		//S113BLKBUNDLE
		'114764': {
          'default': '2362',
          'bundleResult': '2362'
        },
		//S155BUNDLE
		'110154': {
          'default': '2364',
          'bundleResult': '2364'
        },
		//S155BLKBUNDLE
		'114765': {
          'default': '2364',
          'bundleResult': '2364'
        },
		//O200BUNDLE
		'115012': {
          'default': '2365',
          'bundleResult': '2365'
        },
        // Add more mappings as needed
      };
      
	  var promoCodeToAdd = ''; // Set the default promo code to an empty string
      var itemFound = false; // Flag to track if eligible item is found
      
      // Check if the main line has a specific result
      var mainLineResult = newRecord.getValue({
        fieldId: 'custbody_bundle_report' // Specify the custom field ID for the main line result
      });
      
      // Get line count
      var lineCount = newRecord.getLineCount({
        sublistId: 'item'
      });
      
      // Loop through each line item
      for (var i = 0; i < lineCount; i++) {
        var itemId = newRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: i
        });
        
        log.debug('Item ID', 'Item ID for line ' + i + ': ' + itemId);  
        
        // Check if the item has a specific SKU
        if (skuToPromoCodeMap.hasOwnProperty(itemId)) {
          itemFound = true; // Set flag to true if eligible item is found
          
          // Check if the custbody_bundle_report is empty or not
          if (!mainLineResult) {
            promoCodeToAdd = skuToPromoCodeMap[itemId]['default']; // Use default promo code if custbody_bundle_report is empty
            log.debug('Default Promo Code', 'Default promo code for item ' + itemId + ': ' + promoCodeToAdd);
          } else {
            // Use bundle promo code if custbody_bundle_report is not empty
            promoCodeToAdd = skuToPromoCodeMap[itemId]['bundleResult'];
            log.debug('Bundle Promo Code', 'Bundle promo code for item ' + itemId + ': ' + promoCodeToAdd);
          }
          
          // Exit loop if promo code is determined
          break;
        }
      }
      
      // Set the promo code for each line in the 'promotions' sublist only if an eligible item is found
if (itemFound) {
    // Set the promo code for the first line only
    newRecord.setSublistValue({
        sublistId: 'promotions',
        fieldId: 'promocode',
        line: 0, // Set the promo code for the first line
        value: promoCodeToAdd
    });
    log.debug('Promo Code Applied', 'Promo Code ' + promoCodeToAdd + ' applied to the sales order');
}

	  else {
        log.debug('No Eligible Items Found', 'No eligible items found, no promo code added.');
      }
    }
  }

    function afterSubmit(context) {
   // Edit and save record here. This is to trigger a tax recalculation.
    if (context.type === context.UserEventType.CREATE) {
      var newRecordId = context.newRecord.id;
      var salesOrder = record.load({
        type: record.Type.SALES_ORDER,
        id: newRecordId,
        isDynamic: true
      });

      // Perform any edits here if necessary

      // Save the changes
      salesOrder.save();
      log.debug('Sales Order Edited and Saved', 'Sales Order ' + newRecordId + ' has been edited and saved.');
    }
  }

  return {
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit
  };
});