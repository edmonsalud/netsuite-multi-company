var tabObj = document.getElementById("custpage_contactinsighttabtxt");
if (tabObj) {
	console.log('pageLoaded - got tab object');
	tabObj.onclick = function () {
		console.log('inside tab click event');
		var ifrmFldValue,
		divObj;
		divObj = document.getElementById("ciDiv");
		var iframeURL = nlapiGetFieldValue('custentity_cps_ci_url');
		if (iframeURL !== "NA") {
			console.log('iframe url ' + iframeURL);
			ifrmFldValue = '<iframe id="ciIfrm"  frameBorder="0" src="' + iframeURL + '" width="800px" height="450px" ></iframe>';
		} else {
			console.log('iframe url ' + iframeURL);
			ifrmFldValue = '<p style="color:red; width:800px; height:450px; font-family: Verdana,Arial,Helvetica,sans-serif; font-size: 11px;">This contact has not yet synced to Engage. If you recently added this contact, please try again in a few minutes to allow the synchronization to complete.</p>';
		}
		if (divObj && !divObj.hasChildNodes()) {
			console.log('iframe set to div');
			divObj.innerHTML = ifrmFldValue;
			divObj.innerHTML += '<a id="anch_div"></a>';
		}
		ShowTab("custpage_contactinsighttab", false);
		jQuery('html, body').animate({
			scrollTop : jQuery('#anch_div').offset().top,
			scrollLeft : 0
		}, "fast");
	};
} else {
	console.log('pageLoaded - tab object is null');
}
