function userEventBeforeSubmit(type) {
 if (type == 'create') {
  nlapiSetFieldValue('paypalprocess', 'T');
 }
}