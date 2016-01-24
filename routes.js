var express = require('express');
var JSONStream = require('JSONStream');
var request = require('request');
var qs = require('querystring');
var _u = require('underscore');
// var moment = require('moment');
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
    , url = 'https://api.login.yahoo.com/oauth/v2/get_token';
  console.log('GET REFRESHTOKEN OAUTH', oauth);
  request.get({url:url, oauth:oauth}, function (e, r, body) {
    console.log('ERROR:', e);
    console.log('R', r.body)
    console.log('BODY: ', body);
    res.send(body);
  })

});


var roster = require('./app/roster');
router.get('/teams', roster.teams);
router.get('/roster', roster.index);
router.get('/editRoster', roster.editRoster);

module.exports = router;