/**
 * Module Description
 * 
 * Version	Date		Author          Remarks
 * 1.00     04-04-19	Eric.Choe		Created following functions for postcode library
 * 											- function getPostCode(city, postcode, country)
 * 											- function getCountryID(countrycode)
 * 											- function getStateID(countrycode, statecode)
 * 											- function getFeightZone(postcode)
 * 											- function getDefaultWarehouse(subsidiary, state, postcode, country, item, shiptype, freightzone)
 * 											- function getInstallGroup(postcode)
 * 
 * 1.10     16-10-19	Eric.Choe		Created following new function
 * 											- function getZonePostCode(postcode)
 * 
 * 1.11		21-10-19	ERic.Choe		Updated following functions to return 'Not Found' if there is no matching record.
 *  										- function getFeightZone(postcode)
 *  										- function getInstallGroup(postcode)
 * 
 * 1.20     04-03-20	Eric.Choe		Created following new function
 * 											- function getInstaller(postcode)
 * 
 * 1.30     15-06-20	Eric.Choe		Created following new function
 * 											- function getFreightCost(freightzone, item))
 * 											- function getInstallCost(installgroup)
 * 
**/

/**
 * @NApiVersion 2.0
 */

define(['N/search', 'N/url', 'N/https', './utils'],
/**
 * @param {search} search
 * @param {url} url
 * @param {https} https
 * @param {https} utils
 */	
		
function(search, url, https, utils) {
	
	function getPostCode(city, postcode, country){				
		try{									
			var postCode = '';
			if(city && postcode && country){
				var mySearch = search.create({
					type: 'customrecord_post_code',
					filters: [{
						name: 'isinactive',
						operator: 'is',
						values: false
					}, {
						name: 'custrecord_pc_city_suburb',
			            operator: 'is',
			            values: city
					}, {
						name: 'custrecord_pc_post_code',
			            operator: 'is',
			            values: postcode
					}, {
						name: 'custrecord_pc_country',
			            operator: 'is',
			            values: country
					}],
					columns: ['internalid']			
				});
				mySearch.run().each(function(result){
//					log.debug('postcode.getPostCode', 'result = ' + result);
					if(result.id){
						postCode = result.id;
						return false; //  returns a boolean which can be used to stop the iteration with a value of false, or continue the iteration with a value of true.
					}
				});	
			}					
			return postCode;		
		}catch(ex){
    		var processMssg = 'searching Post Code ';
    		log.error({
    		    title: 'postcode.getPostCode()', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
		}		
	}
	
	function getCountryID(countrycode){
		try{
			var countryID = 0;
			if(countrycode){
				var scriptURL = url.resolveScript({
				    scriptId: 'customscript_gs2_sl_countryid',
				    deploymentId: 'customdeploy_gs2_sl_countryid',
				    returnExternalUrl: true
				});
				var scriptResponse = https.request({
				    method: https.Method.GET,
				    url: scriptURL + '&req_countrycode=' + countrycode
				});
				if(scriptResponse.code == 200){
					countryID = scriptResponse.body;
					if(countryID == 'No Matching Record'){
						countryID = 0; //Return 0 if there is no matching one
					}
				}
			}
			return countryID;
		}catch(ex){
			var processMssg = 'searching Country ID ';
    		log.error({
    		    title: 'postcode.getCountryID()', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
		}
	}
		
	function getStateID(countrycode, statecode){
		try{			
			var stateID = [];
			//Australia
			stateID['AU_ACT'] = '400';
			stateID['AU_NSW'] = '401';
			stateID['AU_NT']  = '402';
			stateID['AU_QLD'] = '403';
			stateID['AU_SA']  = '404';
			stateID['AU_TAS'] = '405';
			stateID['AU_VIC'] = '406';
			stateID['AU_WA']  = '407';
			//Canada
			stateID['CA_AB'] = '101';
			stateID['CA_BC'] = '102';
			stateID['CA_MB'] = '103';
			stateID['CA_NB'] = '104';
			stateID['CA_NL'] = '105';
			stateID['CA_NT'] = '106';
			stateID['CA_NS'] = '107';
			stateID['CA_NU'] = '108';
			stateID['CA_ON'] = '109';
			stateID['CA_PE'] = '110';
			stateID['CA_QC'] = '111';
			stateID['CA_SK'] = '112';
			stateID['CA_YT'] = '113';
			//United States
			stateID['US_AL'] = '0'; 
			stateID['US_AK'] = '1'; 
			stateID['US_AZ'] = '2'; 
			stateID['US_AR'] = '3'; 
			stateID['US_AA'] = '53'; 
			stateID['US_AE'] = '52'; 
			stateID['US_AP'] = '54'; 
			stateID['US_CA'] = '4';
			stateID['US_CO'] = '5';
			stateID['US_CT'] = '6';
			stateID['US_DE'] = '7';  
			stateID['US_DC'] = '8';  
			stateID['US_FL'] = '9';  
			stateID['US_GA'] = '10'; 
			stateID['US_HI'] = '11'; 
			stateID['US_ID'] = '12'; 
			stateID['US_IL'] = '13'; 
			stateID['US_IN'] = '14'; 
			stateID['US_IA'] = '15'; 
			stateID['US_KS'] = '16'; 
			stateID['US_KY'] = '17'; 
			stateID['US_LA'] = '18'; 
			stateID['US_ME'] = '19'; 
			stateID['US_MD'] = '20'; 
			stateID['US_MA'] = '21'; 
			stateID['US_MI'] = '22'; 
			stateID['US_MN'] = '23'; 
			stateID['US_MS'] = '24'; 
			stateID['US_MO'] = '25'; 
			stateID['US_MT'] = '26'; 
			stateID['US_NE'] = '27'; 
			stateID['US_NV'] = '28'; 
			stateID['US_NH'] = '29'; 
			stateID['US_NJ'] = '30'; 
			stateID['US_NM'] = '31'; 
			stateID['US_NY'] = '32'; 
			stateID['US_NC'] = '33'; 
			stateID['US_ND'] = '34'; 
			stateID['US_OH'] = '35'; 
			stateID['US_OK'] = '36'; 
			stateID['US_OR'] = '37'; 
			stateID['US_PA'] = '38'; 
			stateID['US_PR'] = '39'; 
			stateID['US_RI'] = '40'; 
			stateID['US_SC'] = '41'; 
			stateID['US_SD'] = '42'; 
			stateID['US_TN'] = '43'; 
			stateID['US_TX'] = '44'; 
			stateID['US_UT'] = '45'; 
			stateID['US_VT'] = '46'; 
			stateID['US_VA'] = '47'; 
			stateID['US_WA'] = '48'; 
			stateID['US_WV'] = '49'; 
			stateID['US_WI'] = '50'; 
			stateID['US_WY'] = '51'; 			
//			log.debug('postcode.getStateID()', 'countrycode = ' + countrycode);
//			log.debug('postcode.getStateID()', 'statecode = ' + statecode);
//			log.debug('postcode.getStateID()', 'stateCode[] = ' + stateID[countrycode + '_' + statecode]);			
			return stateID[countrycode + '_' + statecode];			
		}catch(ex){
			var processMssg = 'searching State ID ';
    		log.error({
    		    title: 'postcode.getStateID()', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
		}
	}
	
	function getFeightZone(postcode){
		try{
			var mySearch = search.create({
				type: 'customrecord_zone_post_code',
				filters: [{
					name: 'isinactive',
					operator: 'is',
					values: false
				}, /*{
					name: 'custrecord_zpc_zone',
		            operator: 'noneof',
		            values: '@NONE@'
				},*/ {
					name: 'custrecord_zpc_post_code',
		            operator: 'is',
		            values: postcode
				}],
				columns: ['custrecord_zpc_zone']			
			});						
			var freightZone = 'Not Found';
			mySearch.run().each(function(result){
				if(result.id){
					freightZone = result.getValue({name: 'custrecord_zpc_zone'});
					return false; //  returns a boolean which can be used to stop the iteration with a value of false, or continue the iteration with a value of true.
				}
			});			
			return freightZone;
		}catch(ex){
			var processMssg = 'searching Frieght Zone ';
    		log.error({
    		    title: 'postcode.getFeightZone()', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
		}
	}
	
	function getDefaultWarehouse(subsidiary, state, postcode, country, item, shiptype, freightzone){
		try{
			var defaultWarehouse = '';
			var itemClass  = search.lookupFields({
			    type: 'item',
			    id: item,
			    columns: 'class'
			}).class[0];

			if(itemClass){
				var itemClassID = itemClass.value;
				var mySearch = search.create({
					type: 'customrecord_default_location',
					filters: [{
						name: 'isinactive',
						operator: 'is',
						values: false
					}, {
						name: 'custrecord_dw_subsidiary',
			            operator: 'is',
			            values: subsidiary
					}, {
						name: 'custrecord_dw_shiptype',
			            operator: 'is',
			            values: shiptype
					},{
						name: 'custrecord_dw_item_class',
			            operator: 'anyof',
			            values: itemClassID
					}],
					columns: ['internalid', 'custrecord_dw_state', 'custrecord_dw_zone', 'custrecord_dw_postcode', 'custrecord_dw_warehouse']			
				});				
				var isMatching = false;
				mySearch.run().each(function(result){					
					var df_Zones = result.getValue({name: 'custrecord_dw_zone'}).split(',');
					// Search by freight zone
					for(var i=0; i<df_Zones.length; i++){
						if(df_Zones[i] == freightzone){
							var isMatching = true;
							break;
						}						
					}					
					if(!isMatching){
						// Search by State
						var df_States = result.getValue({name: 'custrecord_dw_state'}).split(',');
//						log.debug('postcode.getDefaultWarehouse()', 'df_States = ' + JSON.stringify(df_States));
						for(var i=0; i<df_States.length; i++){
							if(df_States[i] == state){
								var isMatching = true;
								break;
							}						
						}
						if(!isMatching){
							// Search by Post Code
							var df_PostCodes = result.getValue({name: 'custrecord_dw_postcode'}).split(',');
//							log.debug('postcode.getDefaultWarehouse()', 'df_PostCodes = ' + JSON.stringify(df_PostCodes));
							for(var i=0; i<df_PostCodes.length; i++){
								if(df_PostCodes[i] == postcode){
									var isMatching = true;
									break;
								}						
							}
						}						
					}					
					if(isMatching){
						defaultWarehouse = result.getValue({name: 'custrecord_dw_warehouse'});
						return false; //  returns a boolean which can be used to stop the iteration with a value of false, or continue the iteration with a value of true. 
					}
					else{
						return true;
					}
				});	
			}
			return  defaultWarehouse;
		}catch(ex){
			var processMssg = 'searching Default Warehouse ';
    		log.error({
    		    title: 'postcode.getDefaultWarehouse()', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
		}
	}
			
	function getInstallGroup(postcode){
		try{			
			var installGroup = '';			
			if(postcode){
				var scriptURL = url.resolveScript({
				    scriptId: 'customscript_gs2_sl_installgroup',
				    deploymentId: 'customdeploy_gs2_sl_installgroup',
				    returnExternalUrl: true
				});
				var scriptResponse = https.request({
				    method: https.Method.GET,
				    url: scriptURL + '&postcode=' + postcode
				});
				if(scriptResponse.code == 200){
					installGroup = scriptResponse.body;
				}
			}
			return installGroup;		
		}catch(ex){
			var processMssg = 'searching Install Group ';
    		log.error({
    		    title: 'postcode.getInstallGroup()', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
		}
	}
	
	function getZonePostCode(postcode){
		try{
			var mySearch = search.create({
				type: 'customrecord_zone_post_code',
				filters: [{
					name: 'isinactive',
					operator: 'is',
					values: false
				}, /*{
					name: 'custrecord_zpc_zone',
		            operator: 'noneof',
		            values: '@NONE@'
				},*/ {
					name: 'custrecord_zpc_post_code',
		            operator: 'is',
		            values: postcode
				}],
				columns: ['internalid']			
			});						
			var zonePostCode = '';
			mySearch.run().each(function(result){
				if(result.id){
					zonePostCode = result.id;
					return false; //  returns a boolean which can be used to stop the iteration with a value of false, or continue the iteration with a value of true.
				}
			});			
			return zonePostCode;
		}catch(ex){
			var processMssg = 'searching Zone Post Code ';
    		log.error({
    		    title: 'postcode.getZonePostCode()', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
		}				
	}
	
	function getInstaller(postcode){
		try{			
			var insTaller = '';			
			if(postcode){
				var scriptURL = url.resolveScript({
				    scriptId: 'customscript_gs2_sl_installer',
				    deploymentId: 'customdeploy_gs2_sl_installer',
				    returnExternalUrl: true
				});
				var scriptResponse = https.request({
				    method: https.Method.GET,
				    url: scriptURL + '&postcode=' + postcode
				});
				if(scriptResponse.code == 200){
					insTaller = scriptResponse.body;
					if(insTaller == "Not Found"){
						insTaller = '';		
					}
				}
			}
			return insTaller;		
		}catch(ex){
			var processMssg = 'searching Installer ';
    		log.error({
    		    title: 'postcode.getInstaller()', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
		}
	}
		
	function getFreightCost(freightzone, item){
		try{			
			var freightCost = 0;			
			if(freightzone && item){
				var scriptURL = url.resolveScript({
				    scriptId: 'customscript_gs2_sl_zonefreightcost',
				    deploymentId: 'customdeploy_gs2_sl_zonefreightcost',
				    returnExternalUrl: true
				});
				var scriptResponse = https.request({
				    method: https.Method.GET,
				    url: scriptURL + '&freightzone=' + freightzone + '&item=' + item
				});
				if(scriptResponse.code == 200){
					freightCost = scriptResponse.body;
					if(freightCost == "Not Found"){
						freightCost = 0;		
					}
				}
			}
			return freightCost;		
		}catch(ex){
			var processMssg = 'searching Freight Cost ';
    		log.error({
    		    title: 'postcode.getFreightCost()', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
		}
	}
		
	function getInstallCost(installgroup){
		try{			
			var installCost = 0;			
			if(installgroup){
				var scriptURL = url.resolveScript({
				    scriptId: 'customscript_gs2_sl_installCost',
				    deploymentId: 'customdeploy_gs2_sl_installCost',
				    returnExternalUrl: true
				});
				var scriptResponse = https.request({
				    method: https.Method.GET,
				    url: scriptURL + '&installgroup=' + installgroup
				});
				if(scriptResponse.code == 200){
					installCost = scriptResponse.body;
					if(installCost == "Not Found"){
						installCost = 0;		
					}
				}
			}
			return installCost;		
		}catch(ex){
			var processMssg = 'searching Install Cost ';
    		log.error({
    		    title: 'postcode.getInstallCost()', 
    		    details: 'Error encountered while ' + processMssg  + '\n'  + '[' + utils.getErrorMessage(ex) + ']'
    		});
		}
	}
		
    return {
    	getPostCode			: getPostCode,
    	getCountryID		: getCountryID,
    	getStateID			: getStateID,
    	getFeightZone		: getFeightZone,
    	getDefaultWarehouse	: getDefaultWarehouse,
    	getInstallGroup		: getInstallGroup,
    	getZonePostCode		: getZonePostCode,
    	getInstaller		: getInstaller,
    	getFreightCost		: getFreightCost,
    	getInstallCost		: getInstallCost
    };    
});