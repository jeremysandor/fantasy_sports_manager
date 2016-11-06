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
  var flex = players.filter((player) => {return _u.indexOf(player['eligible_positions'], 'W/R/T') !== -1})
  
  // sort player positions by projected points in decending order
  var sortedQbs = _u.sortBy(qbs, (w) => {return - w.projection})
  var sortedWrs = _u.sortBy(wrs, (w) => {return - w.projection})
  var sortedRbs = _u.sortBy(rbs, (w) => {return - w.projection})
  var sortedTes = _u.sortBy(tes, (w) => {return - w.projection})
  var sortedFlex = _u.sortBy(flex, (w) => {return - w.projection})

  console.log('sortedFlex', sortedFlex);

  // determine available slots by position
  var availableQbSlots = qbs.filter((p) => {return p.selected_position === 'QB'});
  var availableWrSlots = wrs.filter((p) => {return p.selected_position === 'WR'});
  var availableRbSlots = rbs.filter((p) => {return p.selected_position === 'RB'});
  var availableTeSlots = tes.filter((p) => {return p.selected_position === 'TE'});
  var availableFlexSlots = tes.filter((p) => {return p.selected_position === 'W/R/T'});

  console.log('availableWrSlots', availableWrSlots);


  var swapQbsIn = sortedQbs.filter((player, index) => {
    if (index < availableQbSlots.length) {
      if (player.selected_position === 'BN') {
        // return player to activate
        console.log('this player should be activated:', player.name);
        return true;
      }
    }
  });

  var swapQbsOut = sortedQbs.filter((player, index) => {
    if (index >= availableQbSlots.length) {
      if (player.selected_position === 'QB') {
        console.log('this player should be dectivated:', player.name);
        return true;
      }
    }
  });

  var swapWrsIn = sortedWrs.filter((player, index) => {
    if (index < availableWrSlots.length) {
      if (player.selected_position === 'BN') {
        // return player to activate
        console.log('this player should be activated:', player.name);
        return true;
      }
    }
  });

  var swapWrsOut = sortedWrs.filter((player, index) => {
    if (index >= availableWrSlots.length) {
      if (player.selected_position === 'WR') {
        console.log('this player should be deactivated', player.name);
        return true;
      }
    }
  });

  var swapRbsIn = sortedRbs.filter((player, index) => {
    if (index < availableRbSlots.length) {
      if (player.selected_position === 'BN') {
        // return player to activate
        console.log('this player should be activated:', player.name);
        return true;
      }
    }
  });

  var swapRbsOut = sortedRbs.filter((player, index) => {
    if (index >= availableRbSlots.length) {
      if (player.selected_position === 'RB') {
        console.log('this player should be deactivated', player.name);
        return true;
      }
    }
  });

  var swapTesIn = sortedTes.filter((player, index) => {
    if (index < availableTeSlots.length) {
      if (player.selected_position === 'BN') {
        // return player to activate
        console.log('this player should be activated:', player.name);
        return true;
      }
    }
  });

  var swapTesOut = sortedTes.filter((player, index) => {
    if (index >= availableTeSlots.length) {
      if (player.selected_position === 'RB') {
        console.log('this player should be deactivated', player.name);
        return true;
      }
    }
  });

  var swapFlexIn = sortedFlex.filter((player, index) => {
    if (index < availableFlexSlots.length) {
      if (player.selected_position === 'BN') {
        // return player to activate
        console.log('this player should be activated:', player.name);
        return true;
      }
    }
  });

  var swapFlexOut = sortedFlex.filter((player, index) => {
    if (index >= availableFlexSlots.length) {
      if (player.selected_position === 'W/R/T') {
        console.log('this player should be deactivated', player.name);
        return true;
      }
    }
  });
  
  // console.log('swapWrsIn', swapWrsIn);
  // console.log('swapWrsOut', swapWrsOut);
  
  // console.log('swapQbsIn', swapQbsIn);
  // console.log('swapQbsOut', swapQbsOut);
 
  var translateQbsIn = swapQbsIn.map((p) => {return { player: { player_key: p.player_key, position: 'QB' } }});
  var translateQbsOut = swapQbsOut.map((p) => {return { player: { player_key: p.player_key, position: 'BN' } }});
  var translateWrsIn = swapWrsIn.map((p) => {return { player: { player_key: p.player_key, position: 'WR' } }});
  var translateWrsOut = swapWrsOut.map((p) => {return { player: { player_key: p.player_key, position: 'BN' } }});
  var translateRbsIn = swapRbsIn.map((p) => {return { player: { player_key: p.player_key, position: 'RB' } }});
  var translateRbsOut = swapRbsOut.map((p) => {return { player: { player_key: p.player_key, position: 'BN' } }});
  var translateTesIn = swapTesIn.map((p) => {return { player: { player_key: p.player_key, position: 'TE' } }});
  var translateTesOut = swapTesOut.map((p) => {return { player: { player_key: p.player_key, position: 'BN' } }});  



  console.log('translateWrsIn', translateWrsIn);
  console.log('translateWrsOut', translateWrsOut);
  console.log('translateQbsIn', translateQbsIn);
  console.log('translateQbsOut', translateQbsOut);
  console.log('translateRbsIn', translateRbsIn);
  console.log('translateRbsOut', translateRbsOut);
  console.log('translateTesIn', translateTesIn);
  console.log('translateTesOut', translateTesOut);

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