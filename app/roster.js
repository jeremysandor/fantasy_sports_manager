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


exports.teams = function(req, res, next) {
  var oauth =
      { consumer_key: CONSUMER_KEY
      , consumer_secret: CONSUMER_SECRET
      , token: TOKEN //perm_data.oauth_token
      , token_secret: TOKEN_SECRET //perm_data.oauth_token_secret
      }
    // , url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json';
    , url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nba/teams?format=json';
    // , url = 'http://fantasysports.yahooapis.com/fantasy/v2/team/348.l.188062.t.10/roster?format=json'
  request.get({url:url, oauth:oauth}, function (e, r, body) {
    console.log('ERROR:', e);
    // console.log('R', r.body)
    console.log('BODY: ', body);
    res.send(body);
  })
}

new CronJob('05 * * * * *', function() {
  console.log('cronjob hit');
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
        finalData = utils.translateData(elem);
        console.log('finalData', finalData);
        var rosterPlayer = new RosterPlayer(finalData);
        rosterPlayer.save();
      });
    });
}, null, true, 'America/Los_Angeles');


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
        finalData = utils.translateData(elem);
        console.log('finalData', finalData);
        var rosterPlayer = new RosterPlayer(finalData);
        rosterPlayer.save();
      });
    })
    .pipe(res);
}

exports.editRoster = function(req, res, next) {
  var swap = {}

  var players = RosterPlayer.find({}, function(err, players) {
    // console.log('players', players);
    swaps = utils.editRoster(players, utils.matchPlayers);
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
}

