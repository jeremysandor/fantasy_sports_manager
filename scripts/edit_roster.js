var Promise = require('bluebird');
var rp = require('request-promise');
var RosterPlayer = require('../models/rosterPlayer');
var mongoose = require('mongoose');
var db = mongoose.connection;

// connect to mongo
mongoose.connect('mongodb://localhost/test');
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback) {console.log('database open')});

//
var base_url = 'http://localhost'

// start with fresh RosterPlayer collection 
RosterPlayer.remove({}, function(err, removed) {console.log('removed', removed)} );

// refresh token, fetch teams, fetch roster, edit roster
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
  return Promise.map(parseteam, (team) => {
    console.log('team', team);
    rp({uri: base_url + '/roster', method: 'PUT', body: {team_key: team.team_key, week: team.roster_adds.coverage_value}, json: true} );
    return rp({uri: base_url + '/editroster', method: 'PUT', body: {team_key: team.team_key, week: team.roster_adds.coverage_value}, json: true} );
  })
})
.then((finalRes) => {
  console.log('finalRes', finalRes);
})
.catch((err) => {
  console.log('ERR', err);
})


// close the connection
mongoose.connection.close();







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




