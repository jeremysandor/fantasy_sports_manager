// CRUD ops for roster
var request = require('request');
var User = require('../models/user');
var RosterPlayer = require('../models/rosterPlayer');
var config = require('../config');
var JSONStream = require('JSONStream');
var _u = require('underscore');

var CONSUMER_KEY = config.consumer_key;
var CONSUMER_SECRET = config.consumer_secret;

var TOKEN;
var TOKEN_SECRET;
var SESSION_HANDLE;

User.findOne({_id: "568ef435000ad777555d1c41"}, function(err, user) {
  TOKEN = user.token;
  TOKEN_SECRET = user.token_secret;
  SESSION_HANDLE = user.session_handle;
});

// exports.teams = function(req, res, next) {
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
// }

exports.index = function(req, res, next) {
  var oauth =
    { consumer_key: CONSUMER_KEY
    , consumer_secret: CONSUMER_SECRET
    , token: TOKEN
    , token_secret: TOKEN_SECRET
    }
  , url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/353.l.221086.t.7/roster?format=json'

  console.log('GET ROSTER', oauth);

  var body = ''
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
      data = JSON.parse(body);
      // console.log('DATA', data);
      // var playerKey = data[0].player[0][1].player_id;
      // console.log('playerKey', playerKey);
      data.forEach(function(elem, index) {
        // console.log('elem', elem);
        finalData = translateData(elem);
        console.log('finalData', finalData);
        var rosterPlayer = new RosterPlayer(finalData);
        rosterPlayer.save();
      });
    })
    .pipe(res);
}

var translateData = function (data) {
  var finalData = {}
  _u.each(data, function(v, k) {
    _u.each(v[0], function(elem) {
      _u.each(elem, function(val, key) {
        if (key === 'eligible_positions') {
          positions = [];
          _u.each(val, function(position) {
            positions.push(position.position);
          });
          finalData[key] = positions;
        }
        if (['headshot', 'image_url', 'has_player_notes', 'eligible_positions'].indexOf(key) === -1) {
          finalData[key] = val;
        }
      });
    });
    _u.each(v[1], function(val, key) {
      finalData[key] = val[1].position;
    });
  });
  console.log('FINALDATA', finalData);
  if (_u.isEmpty(finalData) === false) {
    return finalData
  }
}

