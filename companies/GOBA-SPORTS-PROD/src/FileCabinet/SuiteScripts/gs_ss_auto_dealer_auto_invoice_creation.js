/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/render', 'N/runtime'],
    (search, record, email, render, runtime) => {

        const execute = () => {
            const title = "execute() :: ";
            try {
                const script = runtime.getCurrentScript();
                const savedSearchId = script.getParameter('custscript_gs_dealer_invoice_saved_srch');
                const templateId = script.getParameter('custscript_gs_dealer_invoice_email_tpl');
                const senderId = script.getParameter('custscript_gs_dealer_email_send');

                if (!savedSearchId || !templateId) {
                    log.error('Missing Parameters', 'Saved search ID and Email Template ID are required.');
                    return;
                }

                let soSearch = search.load({ id: savedSearchId });
                let results = soSearch.run().getRange({
                    start: 0,
                    end: 1000
                });

                for (let i = 0; i < results.length; i++) {
                    let soId = results[i].id;
                    let customerId = results[i].getValue('entity');
                    let isNetReturnTransaction = results[i].getValue('custbody_gs_net_return_transaction');

                    log.debug(title + "soId:", soId);

                    try {
                        let invoiceRec = record.transform({
                            fromType: record.Type.SALES_ORDER,
                            fromId: soId,
                            toType: record.Type.INVOICE,
                            isDynamic: false
                        });

                        let invoiceId = invoiceRec.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });

                        if (invoiceId) {

                            log.debug(title + "invoiceId:", invoiceId);

                            const pdfFile = render.transaction({
                                entityId: +invoiceId,
                                printMode: render.PrintMode.PDF
                            });

                            let renderer = render.mergeEmail({
                                templateId: templateId,
                                entity: { type: 'customer', id: +customerId },
                                transactionId: +invoiceId
                            });

                            if (!isNetReturnTransaction) {
                                email.send({
                                    author: senderId,
                                    recipients: customerId,
                                    subject: renderer.subject,
                                    body: renderer.body,
                                    relatedRecords: {
                                        transactionId: +invoiceId
                                    },
                                    attachments: [pdfFile]
                                });

                            }
                        }

                    } catch (e) {
                        log.error("ERROR IN " + title, e.message);
                    }
                }

            } catch (e) {
                log.error('Script Error', e);
            }
        };

        return {
            execute
        };
    });
