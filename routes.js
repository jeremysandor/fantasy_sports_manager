var express = require('express');
var JSONStream = require('JSONStream');
var request = require('request');
var qs = require('querystring');
var _u = require('underscore');
var moment = require('moment');
var config = require('./config');
var User = require('./models/user');
var RosterPlayer = require('./models/rosterPlayer');

var CONSUMER_KEY = config.consumer_key;
var CONSUMER_SECRET = config.consumer_secret;

// these will change over time, need to refresh them
var TOKEN;
var TOKEN_SECRET;
var SESSION_HANDLE;

User.findOne({_id: "568ef435000ad777555d1c41"}, function(err, user) {
  TOKEN = user.token;
  TOKEN_SECRET = user.token_secret;
  SESSION_HANDLE = user.session_handle;
});

// set up router
var router = express.Router();

// set up routes
// var teams = require('./teams');
// router.get('/', function(req, res) {res.send('seems like we got the callback')});
// router.get('/teams', teams.index)

// oauth routes
router.get('/handle_yahoo_callback', function(req, res) {
  // console.log('req.query', req.query);
  var data = req.query;

  // user = new User({token: data.access_token, token_secret: data.access_secret});
  User.update({_id: "568ef435000ad777555d1c41"}, {token: data.access_token, token_secret: data.access_secret, session_handle: data.raw.oauth_session_handle},
    function(err, numberAffected, rawResponse) {
      console.log('ERR', err);
      console.log('numberAffected', numberAffected);
      console.log('rawResponse', rawResponse);
     //handle it
    });
  // user.save();
  // console.log('res', res);
  res.end(JSON.stringify(req.query, null, 2));
});

router.get('/refreshtoken', function(req, res) {
  var oauth =
      { consumer_key: CONSUMER_KEY
      , consumer_secret: CONSUMER_SECRET
      , token: TOKEN //perm_data.oauth_token
      , token_secret: TOKEN_SECRET //perm_data.oauth_token_secret
      , oauth_session_handle: SESSION_HANDLE
      }
    // , url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json';
    , url = 'https://api.login.yahoo.com/oauth/v2/get_token';
    // , url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/348.l.188062.t.10/roster?format=json'
  console.log('GET REFRESHTOKEN OAUTH', oauth);
  request.get({url:url, oauth:oauth}, function (e, r, body) {
    console.log('ERROR:', e);
    console.log('R', r.body)
    console.log('BODY: ', body);
    res.send(body);
  })

});

// router.get('/teams', function(req, res) {
//   var oauth =
//       { consumer_key: CONSUMER_KEY
//       , consumer_secret: CONSUMER_SECRET
//       , token: TOKEN //perm_data.oauth_token
//       , token_secret: TOKEN_SECRET //perm_data.oauth_token_secret
//       }
//     // , url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json';
//     , url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nba/teams?format=json';
//     // , url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/348.l.188062.t.10/roster?format=json'
//   request.get({url:url, oauth:oauth}, function (e, r, body) {
//     console.log('ERROR:', e);
//     // console.log('R', r.body)
//     console.log('BODY: ', body);
//     res.send(body);
//   })
// });

var roster = require('./app/roster');
// router.get('/teams', roster.teams);

router.get('/roster', roster.index);

// nfl team key: 348.l.188062.t.10
// router.get('/roster', function(req, res, next) {
//   var oauth =
//       { consumer_key: CONSUMER_KEY
//       , consumer_secret: CONSUMER_SECRET
//       , token: TOKEN
//       , token_secret: TOKEN_SECRET
//       }
//     , url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/353.l.221086.t.7/roster?format=json'

//   console.log('GET ROSTER', oauth);

//   var body = ''
//   request
//     .get({url:url, oauth:oauth})
//     .on('error', function (err) {
//       console.log('error', err);
//     })
//     .pipe(JSONStream.parse('fantasy_content.team.*.roster.0.players.*'))
//     .pipe(JSONStream.stringify())
//     .on('data', function(data) {
//       body += data
//     })
//     .on('end', function() {
//       data = JSON.parse(body);
//       // console.log('DATA', data);
//       // var playerKey = data[0].player[0][1].player_id;
//       // console.log('playerKey', playerKey);
//       data.forEach(function(elem, index) {
//         // console.log('elem', elem);
//         finalData = translateData(elem);
//         console.log('finalData', finalData);
//         var rosterPlayer = new RosterPlayer(finalData);
//         rosterPlayer.save();
//       });
//     })
//     .pipe(res);
// });

// var translateData = function (data) {
//   var finalData = {}
//   _u.each(data, function(v, k) {
//     _u.each(v[0], function(elem) {
//       _u.each(elem, function(val, key) {
//         if (key === 'eligible_positions') {
//           positions = [];
//           _u.each(val, function(position) {
//             positions.push(position.position);
//           });
//           finalData[key] = positions;
//         }
//         if (['headshot', 'image_url', 'has_player_notes', 'eligible_positions'].indexOf(key) === -1) {
//           finalData[key] = val;
//         }
//       });
//     });
//     _u.each(v[1], function(val, key) {
//       finalData[key] = val[1].position;
//     });
//   });
//   console.log('FINALDATA', finalData);
//   if (_u.isEmpty(finalData) === false) {
//     return finalData
//   }
// }

router.put('/roster', function(req, res) {
  // nfl uses weeks, all other sports use dates
  // var body = '<?xml version="1.0"?><fantasy_content><roster><coverage_type>week</coverage_type><week>13</week><players><player><player_key>242.p.8332</player_key><position>WR</position></player><player><player_key>242.p.1423</player_key><position>BN</position></player></players></roster></fantasy_content>'
  var body = '<?xml version="1.0"?><fantasy_content><roster><coverage_type>date</coverage_type><date>2016-01-02</date><players><player><player_key>353.p.3929</player_key><position>G</position></player><player><player_key>353.p.5357</player_key><position>BN</position></player></players></roster></fantasy_content>'
  var headers = {'Content-Type': 'application/xml'};
  var oauth =
      { consumer_key: CONSUMER_KEY
      , consumer_secret: CONSUMER_SECRET
      , token: TOKEN //perm_data.oauth_token
      , token_secret: TOKEN_SECRET //perm_data.oauth_token_secret
      }
    , url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/353.l.221086.t.7/roster'
  request.put({url:url, oauth:oauth, headers: headers, body:body}, function(e, r, body) {
    console.log('REQ', req);
    res.send(body);
  });
});


router.get('/editRoster', function(req, res) {
  var swap = {}

  var players = RosterPlayer.find({}, function(err, players) {
    // console.log('players', players);
    swaps = editRoster(players, matchPlayers);
    // console.log('swap0', swaps);

    _u.each(swaps, function(swap) {
      console.log('swap', swap);
      var date = moment(new Date()).format("YYYY-MM-DD");
      var activateKey = swap.activate.playerKey;
      var activatePostion = swap.activate.position;
      var benchKey = swap.bench.playerKey;
      var benchPosition = swap.bench.position;

      var body = '<?xml version="1.0"?><fantasy_content><roster><coverage_type>date</coverage_type><date>' + date + '</date><players><player><player_key>' + activateKey + '</player_key><position>'+ activatePostion +'</position></player><player><player_key>' + benchKey + '</player_key><position>' + benchPosition + '</position></player></players></roster></fantasy_content>'
      var headers = {'Content-Type': 'application/xml'};
      var oauth =
          { consumer_key: CONSUMER_KEY
          , consumer_secret: CONSUMER_SECRET
          , token: TOKEN
          , token_secret: TOKEN_SECRET
          }
        , url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/353.l.221086.t.7/roster'
      request.put({url:url, oauth:oauth, headers: headers, body:body}, function(e, r, body) {
        res.send(body);
      });
    });
  });
});


var editRoster = function (players, callback) {
  console.log('editRoster');
  var activate = [];
  var deactivate = [];
  _u.each(players, function(player) {
    if (player['status'] === 'INJ' && player.selected_position !== 'BN') {
      deactivate.push(player);
    }
    if (player['status'] !== 'INJ' && player.selected_position === 'BN') {
      activate.push(player);
    }
  });
  return callback(deactivate, activate);
}

var matchPlayers = function (deactivate, activate) {
  console.log('matchPlayers');
  swaps = []
  _u.each(activate, function(activatePlayer) {
    _u.each(deactivate, function(deactivatePlayer) {
      if (_u.indexOf(activatePlayer.eligible_positions, deactivatePlayer.selected_position) !== -1) {
        // var swapObj = {};
        var insertAt = deactivatePlayer.selected_position;
        if (swaps.length === 0) {
          swaps.push({activate:
                        {
                          playerKey: activatePlayer.player_key, position: insertAt
                        },
                      bench:
                        {
                          playerKey: deactivatePlayer.player_key, position: 'BN'}
                        }
                      )
        }
        else {
          swapKeys = [];
          _u.each(swaps, function(swap) {
            swapKeys.push(swap.activate.playerKey);
            swapKeys.push(swap.bench.playerKey);
          });
          if (_u.indexOf(swapKeys, deactivatePlayer.player_key) === -1 && _u.indexOf(swapKeys, activatePlayer.player_key) === -1) {
            // console.log('activatePlayer', activatePlayer);
            // console.log('deactivatePlayer', deactivatePlayer);
            swaps.push({activate:
                        {
                          playerKey: activatePlayer.player_key, position: insertAt
                        },
                      bench:
                        {
                          playerKey: deactivatePlayer.player_key, position: 'BN'}
                        }
                      )
          }
        }
      }
    });
  });
  return swaps
}


// router.get('/player', function(req, res) {
//   var oauth =
//       { consumer_key: CONSUMER_KEY
//       , consumer_secret: CONSUMER_SECRET
//       , token: TOKEN //perm_data.oauth_token
//       , token_secret: TOKEN_SECRET //perm_data.oauth_token_secret
//       }
//     // , url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json';
//     // , url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/teams?format=json';
//     , url = 'http://fantasysports.yahooapis.com/fantasy/v2/league/348.l.188062/players;player_keys=348.p.27564?format=json'
//   request.get({url:url, oauth:oauth}, function (e, r, body) {
//     console.log('ERROR: ', e);
//     // console.log('R', r.body)
//     console.log('BODY: ', body);
//     res.send(body);
//   })
// });

// router.get('/roster', function(req, res) {
//   var oauth =
//       { consumer_key: CONSUMER_KEY
//       , consumer_secret: CONSUMER_SECRET
//       , token: TOKEN //perm_data.oauth_token
//       , token_secret: TOKEN_SECRET //perm_data.oauth_token_secret
//       }
//     , url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json';
//   request.get({url:url, oauth:oauth}, function (e, r, user) {
//     console.log('R', r)
//     console.log(user)
//   })
// });



module.exports = router;