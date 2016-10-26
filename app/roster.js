// CRUD ops for roster
var request = require('request');
var User = require('../models/user');
var RosterPlayer = require('../models/rosterPlayer');
var Team = require('../models/team');
var config = require('../config');
var JSONStream = require('JSONStream');
var _u = require('underscore');
var moment = require('moment');
var utils = require('./utils');
var CronJob = require('cron').CronJob;
var jsontoxml = require('jsontoxml');
var Promise = require('bluebird');

// for quick dev switching
// var TEAM_KEY = '359.l.355701.t.5'

exports.fetchteams = (req, res, next) => {
  Team.find({}, (err, teams) => {
    console.log('team', teams);
    res.send(teams);
  });
}

exports.teams = function(req, res, next) {
  utils.fetchUser()
  .then((user) => {
    return utils.userCreds(user)
  })
  .then((oauth) => {
    var body = '';
    var url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/teams?format=json';    
    request
      .get({url:url, oauth:oauth})
      .on('error', (err) => {
        return new Error(err);
      })
      .pipe(JSONStream.parse('fantasy_content.users.*.user.*.games.0.game.*.teams.*.team'))
      .pipe(JSONStream.stringify())
      .on('data', (data) => {
        body += data;
      })
      .on('end', () => {
        var data = JSON.parse(body);
        data.forEach(function(elem, index) {
          var finalData = utils.translateTeams(elem);
          Team.remove({}, () => {});
          var team = new Team(finalData);
          team.save();
        });
      })
      .pipe(res);    
  })
}


exports.index = function(req, res, next) {
  utils.fetchUser()
  .then((user) => {
    return utils.userCreds(user)
  })
  .then((oauth) => {
    var teamKey = req.body.team_key
    console.log('INDEX TEAMKEY', teamKey)
    var body = ''
    var url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/' + teamKey + '/roster?format=json'
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
          if (finalData) {
            finalData['team_key'] = teamKey;  
            // this needs to go. update each player 
            // rather than removing the 
            // RosterPlayer.remove({}, function() {});
            var rosterPlayer = new RosterPlayer(finalData);
            rosterPlayer.save();
          }
        });
      })
      .pipe(res);
  })
}



exports.editRoster = function(req, res, next) {
  var swap = {}
  var teamKey = req.body.team_key;
  console.log('REQ.body', req.body);
  RosterPlayer.find({'team_key': teamKey}, function(err, players) {
    console.log('WTF PLAYERS', players);
    console.log('ERR', err);
    swaps = utils.editRoster(players, utils.matchPlayers);
    var playerList = [];
    _u.each(swaps, function(swap) {
      _u.each(swap, function(val, key) {
        console.log('VAL', val);     
        playerList.push({player: val});   
      })
    });

    var week = req.body.week; 
    var xml = jsontoxml({fantasy_content: {roster: {coverage_type: 'week', week: week, players: playerList}}}, xmlHeader="true");
    console.log('xml', xml);

    if (swaps.length > 0) {
      utils.fetchUser()
      .then((user) => {
        return utils.userCreds(user)
      })
      .then((oauth) => {
        var body = xml;
        var headers = {'Content-Type': 'application/xml'};
        var url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/' + teamKey + '/roster'
        request.put({url:url, oauth:oauth, headers: headers, body:body}, function(e, r, body) {
          res.send(body);
          // console.log('success')
        });        
      })
    }
    else {
      res.send(teamKey + 'Roster is already optimized \n' );
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