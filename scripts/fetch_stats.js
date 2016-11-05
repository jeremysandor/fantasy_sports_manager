var Promise = require('bluebird');
var rp = require('request-promise');

var base_url = 'http://localhost'

rp({uri: base_url + '/refreshtoken', method: 'POST'})
.then((res0) => {
  console.log('RES0', res0);
  return rp({uri: base_url + '/teams', method: 'PUT'});    
})
.then((res1) => {
  console.log('res1', res1);
  return rp({uri: base_url + '/teams'});
})
.then((res2) => {
  console.log('res2', res2);
  var parseteam = JSON.parse(res2);
  console.log('parseteam', parseteam);
  var week = parseteam[0].roster_adds.coverage_value;
  return Promise.map([10, 20, 30, 40], (position) => {
    // return rp({uri: base_url + "/projections", method: "PUT", body: {week: 6, position: position}, json: true} )  
    return rp({uri: base_url + "/projections", method: "PUT", body: {week: week, position: position}, json: true} )  
  })
  
})