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
          // console.log('finalData', finalData);
          if (finalData) {
            finalData['team_key'] = teamKey;  
            // this needs to go. update each player 
            // rather than removing the 
            // RosterPlayer.remove({}, function() {});
            // var rosterPlayer = new RosterPlayer(finalData);
            // rosterPlayer.save();
            RosterPlayer.findOneAndUpdate({'checksum': finalData.checksum, 'team_key': finalData.team_key}, {$set: finalData}, {upsert: true}, (err, doc) => {
              // console.log('err', err);
              // console.log('doc', doc);
            })

            // PlayerPredition.findOneAndUpdate({'checksum': finalprojectionObj.checksum, 'week': week}, {$set: finalprojectionObj}, {upsert: true}, (err, doc) => {
            //     console.log('ERR 40', err);
            //     console.log('DOC 40', doc);
            //   });
          }
        });
      })
      .pipe(res);
  })
}



// exports.editRoster = function(req, res, next) {
//   var swap = {}
//   var teamKey = req.body.team_key;
//   console.log('REQ.body', req.body);
//   RosterPlayer.find({'team_key': teamKey}, function(err, players) {
//     console.log('WTF PLAYERS', players);
//     console.log('ERR', err);
//     swaps = utils.editRoster(players, utils.matchPlayers);
//     var playerList = [];
//     _u.each(swaps, function(swap) {
//       _u.each(swap, function(val, key) {
//         console.log('VAL', val);     
//         playerList.push({player: val});   
//       })
//     });

//     console.log('player LIST', playerList)
//     // player LIST [ { player: { player_key: '359.p.24916', position: 'TE' } },
//     // { player: { player_key: '359.p.24070', position: 'BN' } } ]  
//     var week = req.body.week; 
//     var xml = jsontoxml({fantasy_content: {roster: {coverage_type: 'week', week: week, players: playerList}}}, xmlHeader="true");
//     console.log('xml', xml);

//     if (swaps.length > 0) {
//       utils.fetchUser()
//       .then((user) => {
//         return utils.userCreds(user)
//       })
//       .then((oauth) => {
//         var body = xml;
//         var headers = {'Content-Type': 'application/xml'};
//         var url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/' + teamKey + '/roster'
//         request.put({url:url, oauth:oauth, headers: headers, body:body}, function(e, r, body) {
//           res.send(body);
//           // console.log('success')
//         });        
//       })
//     }
//     else {
//       res.send(teamKey + 'Roster is already optimized \n' );
//     }
//   });
// }

var swapPlayers = (players) => {
  // filter by position
  var qbs = players.filter((player) => {return _u.indexOf(player['eligible_positions'], 'QB') !== -1})
  var wrs = players.filter((player) => {return _u.indexOf(player['eligible_positions'], 'WR') !== -1})
  var rbs = players.filter((player) => {return _u.indexOf(player['eligible_positions'], 'RB') !== -1})
  var tes = players.filter((player) => {return _u.indexOf(player['eligible_positions'], 'TE') !== -1})

  // sort player positions by projected points
  var sortedQbs = _u.sortBy(qbs, (w) => {return - w.projection})
  var sortedWrs = _u.sortBy(wrs, (w) => {return - w.projection})
  var sortedRbs = _u.sortBy(rbs, (w) => {return - w.projection})
  var sortedTes = _u.sortBy(tes, (w) => {return - w.projection})

  console.log('QBS', qbs);
  console.log('WRS', wrs);
  console.log('sortedWrs', sortedWrs);
  
  // determine available slots by position
  var availableWrSlots = 0;
  wrs.map((wr) => {if (wr.selected_position === 'WR') {availableWrSlots += 1;}});
  console.log('availableWrSlots', availableWrSlots);


  // should we map or filter here...
  var swapWrs = sortedWrs.filter((player, index) => {
    if (index < availableWrSlots) {
      if (player.selected_position === 'BN') {
        // activate player
        console.log('this player should be activated:', player.name);
        return player.name;
      }
    }
  });

  console.log('swapWrs', swapWrs);

  return players;
}

exports.editRoster = (req, res, next) => {
  var teamKey = req.body.team_key;
  var week = req.body.week;
  RosterPlayer.find({'team_key': teamKey}, (err, players) => {
    if (players) {
      var swaps = swapPlayers(players);  
      // console.log('swaps', swaps);
    }
    else if (err) {
      throw new Error('no good!');
    }
  })
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