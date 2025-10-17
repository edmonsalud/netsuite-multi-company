/*
Contivio.com Copyright @ 2022
All rights reserved. No part of this code may be reproduced, distributed, transmitted or used in any form or by any means, without the prior written permission from Contivio.com
 */

/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(["N/record", "N/search", "N/query", "N/https", "N/log"], function (a, b, d, e, c) {
	return {
		execute:function (j) {
			var A = b.load( {
				id:"customsearch_contivio_so_automated_sms_2"
			}); var f = A.run().getRange(0, 100); if (f.length == 0) {
				c.debug( {
					title:"No SMSs to be sent. Aborting ..."
				}); return
			}var w = {
			}, y = {
			}; for (var B = 0; B< f.length; B++) {
				w[f[B].id] = f[B].getValue( {
					name:"mobilephone", join:"customerMain"
				}) ? f[B].getValue( {
					name:"mobilephone", join:"customerMain"
				}) :f[B].getValue( {
					name:"phone", join:"customerMain"
				}); if (Object.keys(w).length> 20) {
					break
				}
			}var k = d.runSuiteQL( {
				query:"SELECT name, custrecord_contivio_template_text FROM customrecord_contivio_sms_template"
			}); var z = k.results; for (var B = 0; B< z.length; B++) {
				y[z[B].values[0]] = z[B].values[1]
			}var n, o, C, q; var l, m, g = ""; for (var E in w) {
				c.debug( {
					title:"Processing SalesOrder ID: " + E
				}); l = a.load( {
					type:a.Type.SALES_ORDER, id:E, isDynamic:true
				}); C = y[l.getText("custbody_sms_text_trigger")]; q = l.getValue("entity"); if (C.indexOf("%customer.") > 0 && q) {
					m = a.load( {
						type:a.Type.CUSTOMER, id:q, isDynamic:true
					}); n = m.getValue("mobilephone") ? m.getValue("mobilephone") :m.getValue("phone")
				}else {
					n = w[E]
				}if (n.indexOf("+") == - 1) {
					c.debug( {
						title:"Local Phone Number: " + n
					}); n = "+" + n; c.debug( {
						title:"International US Phone Number: " + n
					})
				}var h = C.split(" "); var u, t, D; for (var r = 0; r< h.length; r++) {
					if (h[r].length> 1 && h[r].indexOf("%") == 0 && h[r].lastIndexOf("%") > 1) {
						if (h[r].indexOf("%customer.") == 0) {
							D = m; u = 10
						}else {
							D = l; u = 1
						}t = h[r].lastIndexOf("%"); C = p(C, h[r].substring(0, t + 1), h[r].substring(u, t), D)
					}
				}if (n && C) {
					g += "<entity type='" + l.type + "' id='" + l.id + "' name='Customer SMS' phonenumbers='" + n + "' textmessage='" + s(C) + "' />"
				}a.submitFields( {
					type:a.Type.SALES_ORDER, id:l.id, values: {
						custbody_sms_to_be_sent:"F"
					}
				})
			}if (g) {
				v(g)
			}function p(G, i, x, F) {
				return G.replace(i, F.getText(x))
			}function s(i) {
				return encodeURIComponent(i).replace(/[']/g, "%27")
			}function v(I) {
				if (I) {
					var F, i, G, x, H; F = "https://usweb4.contivio.com/SMS/Public/WS/CampaignLoader/Default.aspx?smsCampaign=true&dataAttached=true&authKey=31BA7073645191625DDB71ACE6CBB21E&profileName=AUNetSuiteSMSHandler"; i = s("<entities>" + I + "</entities>"); G = {
						name:"Content-Type", value:"text/xml"
					}; try {
						x = e.post( {
							url:F, body:i, headers:G
						})
					}catch (J) {
						c.error( {
							title:"SubmitSMSRequest err", details:J
						})
					}c.debug( {
						title:"SMS request Sent", details:"Contacts: " + I
					})
				}
			}
		}
	}
});
