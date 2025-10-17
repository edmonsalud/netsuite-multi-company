var combineFiles = (function () {

    var getFileContent = function (folder, nameStartsWith) {
            var loadFile = null,

                filters = [
                    new nlobjSearchFilter('folder', null, 'is', folder),
                    new nlobjSearchFilter('name', null, 'startswith', nameStartsWith)
                ],

                theFile = nlapiSearchRecord('file', null, filters, null);

            if (theFile && theFile.length) {
                // nlapiLogExecution('DEBUG', 'file id', theFile[0].getId());
                loadFile = nlapiLoadFile(theFile[0].getId());
                return loadFile.getValue();
            }
            return '';
        },

        getFilesContents = function (files) {

            var filesLenght = files.length,
                allContent = [],
                i;

            try {

                for (i = 0; i < filesLenght; i++) {
                    allContent.push(getFileContent(files[i].folder, files[i].fileName));
                }

                return allContent.join('');
            }
            catch (ex) {
                nlapiLogExecution('ERROR', 'getFilesContents Exception', ex);
                return '';
            }
        },

        createFile = function (fileData) {
            var theFile,
                fileId;

            try {
                theFile = nlapiCreateFile(fileData.fileName, fileData.fileType, fileData.content);
                theFile.setFolder(fileData.targetFolder);
                fileId = nlapiSubmitFile(theFile);
            } catch (ex) {

            }
            return fileId > 0;
        },

/* **** JAVASCRIPTS ************************************************************************** */
        // shopping content
		checkoutJsContentDH = getFilesContents([
			{
				// reference templates checkout
				folder: 1835,
				fileName: 'jquery.183.min.js'
			},
			{
				// reference templates checkout
				folder: 48715,
				fileName: 'Templates-'
			},
			{
				// reference js checkout
				folder: 48721,
				fileName: 'Application-'
			}
		]);
		/*customCheckoutJsContent = getFilesContents([
			{
				// custom templates checkout
				folder: 1451689,
				fileName: 'Templates-'
			},
			{
				// custom js checkout
				folder: 1451659,
				fileName: 'Application-'
			}
		]);*/

/* **** STYLESHEETS ************************************************************************** */

		checkoutCssContentDH = getFilesContents([
			{
				// custom js checkout
				folder: 1832,
				fileName: 'springfreeStyles'
			},
			{
				// checkout customizations
				folder: 48722,
				fileName: 'Styles-'
			}
			
		]);	
    return {
        init: function () {
			// create common and shopping combined customizations file
			/*var commonShopResult = createFile({
				fileName: 'checkout-customizations-us.js',
				fileType: 'JAVASCRIPT',
				content: customCheckoutJsContent,
				targetFolder: 1451291
			});*/

			// create common and shopping combined
			var commonShopResultDH = createFile({
				fileName: 'checkout-customizations-dh.js',
				fileType: 'JAVASCRIPT',
				content: checkoutJsContentDH ,
				targetFolder: 48721
			});
			
			// create fonts, reference, common and shopping combined styles
			commonShoppingCssResultDH = createFile({
				fileName: 'checkout-styles-dh.css',
				fileType: 'STYLESHEET',
				content: checkoutCssContentDH,
				targetFolder: 48722
			});
			
            if (commonShopResultDH) {
                response.write('The combination was successfully done!');
            }
            else {
                response.write('An error occurred, please review excecution log of NS | Combine SCA Files script/deploy.');
            }
        }
    };

})();

// only for debugger
// combineFiles.init();
