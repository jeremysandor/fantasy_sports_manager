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

var fetchUser = () => {
  return Promise.promisify(User.findOne.bind(User))({_id: "568ef435000ad777555d1c41"})
}

var userCreds = (user) => {
  return { consumer_key: CONSUMER_KEY
    , consumer_secret: CONSUMER_SECRET
    , token: user.token 
    , token_secret: user.token_secret
  }
}


exports.allPlayers = (req, res, next) => {
  fetchUser()
  .then((user) => {
    return userCreds(user)
  })
  .then((oauth) => {
    var url = 'http://fantasysports.yahooapis.com/fantasy/v2/league/359.l.355701/players;sort_season=2016;start=0;count=25;status=A;sort=PTS?format=json'
    console.log('GET ALL PLAYERS', oauth);
    var body = ''
    request
      .get({url:url, oauth:oauth})
      .on('error', function (err) {
        console.log('error', err);
      })
      .pipe(JSONStream.parse('fantasy_content.league.*.players'))
      .pipe(JSONStream.stringify())
      .on('data', function(data) {
        body += data
      })
      .on('end', function() {
        console.log('BODY', body);
        data = JSON.parse(body);
        data.forEach(function(elem, index) {
          finalData = utils.translateData(elem);
          // RosterPlayer.remove({}, function() {});
          // var rosterPlayer = new RosterPlayer(finalData);
          // rosterPlayer.save();
        });
      })
      .pipe(res); 
  })
}

exports.player = (req, res, next) => {
  fetchUser()
  .then((user) => {
    return userCreds(user)
  })
  .then((oauth) => {
    var url = 'http://fantasysports.yahooapis.com/fantasy/v2/player/359.p.8780/stats;type=week;week=5?format=json'
    console.log('PLAYER', oauth);
    var body = ''
    request
      .get({url:url, oauth:oauth})
      .on('error', function (err) {
        console.log('error', err);
      })
      // .pipe(JSONStream.parse('fantasy_content.league.*.players'))
      .pipe(JSONStream.parse('*'))
      .pipe(JSONStream.stringify())
      .on('data', function(data) {
        body += data
      })
      .on('end', function() {
        console.log('BODY', body);
        data = JSON.parse(body);
        // data.forEach(function(elem, index) {
        //   finalData = utils.translateData(elem);
        //   // RosterPlayer.remove({}, function() {});
        //   // var rosterPlayer = new RosterPlayer(finalData);
        //   // rosterPlayer.save();
        // });
      })
      .pipe(res); 
  })
}




