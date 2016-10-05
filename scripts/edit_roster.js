var rp = require('request-promise');

var base_url = 'http://localhost'

rp({uri: base_url + '/refreshtoken', method: 'POST'})
.then((res0) => {
  console.log('RES0', res0);
  return rp({uri: base_url + '/roster'});
})
.then((res1) => {
  console.log('RES1', res1);
  return rp({uri: base_url + '/editroster'});
})
.then((res2) => {
  console.log('RES2', res2);
})
.catch((err) => {
  console.log('ERR', err);
})







// rp({uri: base_url + '/roster'})
// .then((res1) => {
//   console.log('RES1', res1);
//   return rp({uri: base_url + '/editroster'});
// })
// .then((res2) => {
//   console.log('RES2', res2);
// })



// make call to teams resource
// var httpReq = (url) => {
//   console.log('URL', url);
//   return Request({url: url}, (err, req, body) => {
//     console.log('HTTP RESULT', body);
//     return body;
//   });  
// }

// console.log('httpReq', httpReq);


// httpReq(base_url + '/teams')
// .then((hello) => {
//   console.log('HELLO', hello);
// })




