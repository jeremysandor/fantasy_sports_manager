// CRUD ops for roster
var request = require('request');
var User = require('../models/user');
var RosterPlayer = require('../models/rosterPlayer');
var config = require('../config');
var JSONStream = require('JSONStream');
var _u = require('underscore');
var moment = require('moment');
var utils = require('./utils');
var CronJob = require('cron').CronJob;
var jsontoxml = require('jsontoxml');
var Promise = require('bluebird');

// for quick dev switching
var TEAM_KEY = '359.l.355701.t.5'

exports.teams = function(req, res, next) {
  utils.fetchUser()
  .then((user) => {
    return utils.userCreds(user)
  })
  .then((oauth) => {
    var url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/teams?format=json';    
    request.get({url:url, oauth:oauth}, function (e, r, body) {
      console.log('body', body);
      res.send(body);
    })    
  })
}


exports.index = function(req, res, next) {
  utils.fetchUser()
  .then((user) => {
    return utils.userCreds(user)
  })
  .then((oauth) => {
    var body = ''
    var url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/' + TEAM_KEY + '/roster?format=json'
    request
      .get({url:url, oauth:oauth})
      .on('error', function (err) {
        console.log('error', err);
      })
      .pipe(JSONStream.parse('fantasy_content.team.*.roster.0.players.*'))
      .pipe(JSONStream.stringify())
      .on('data', function(data) {
        body += data
      })
      .on('end', function() {
        var data = JSON.parse(body);
        data.forEach(function(elem, index) {
          var finalData = utils.translateData(elem);
          RosterPlayer.remove({}, function() {});
          var rosterPlayer = new RosterPlayer(finalData);
          rosterPlayer.save();
        });
      })
      .pipe(res);
  })
}



exports.editRoster = function(req, res, next) {
  var swap = {}

  RosterPlayer.find({}, function(err, players) {
    swaps = utils.editRoster(players, utils.matchPlayers);
    var playerList = []
    _u.each(swaps, function(swap) {
      _u.each(swap, function(val, key) {
        console.log('VAL', val);     
        playerList.push({player: val});   
      })
    });

    var xml = jsontoxml({fantasy_content: {roster: {coverage_type: 'week', week: 5, players: playerList}}}, xmlHeader="true");
    console.log('xml', xml);

    if (swaps.length > 0) {
      utils.fetchUser()
      .then((user) => {
        return utils.userCreds(user)
      })
      .then((oauth) => {
        var body = xml;
        var headers = {'Content-Type': 'application/xml'};
        var url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/' + TEAM_KEY + '/roster'
        request.put({url:url, oauth:oauth, headers: headers, body:body}, function(e, r, body) {
          res.send(body);
          // console.log('success')
        });        
      })
    }
    else {
      res.send('Roster is already optimized \n');
    }
  });
}



// exports.editRosterNew = (req, res, next) => {
//   utils.fetchUser()
//   .then((user) => {
//     return utils.userCreds(user)
//   })
//   .then((oauth) => {
//     var body = ''
//     var url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/' + TEAM_KEY + '/roster?format=json'
//     request
//       .get({url:url, oauth:oauth})
//       .on('error', function (err) {
//         console.log('error', err);
//       })
//       .pipe(JSONStream.parse('fantasy_content.team.*.roster.0.players.*'))
//       .pipe(JSONStream.stringify())
//       .on('data', function(data) {
//         body += data
//       })
//       .on('end', function() {
//         var data = JSON.parse(body);
//         data.forEach(function(elem, index) {
//           var finalData = utils.translateData(elem);
//           RosterPlayer.remove({}, function() {});
//           var rosterPlayer = new RosterPlayer(finalData);
//           rosterPlayer.save();
//         });
//         next();
//       })
//   })
// }