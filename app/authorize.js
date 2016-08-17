// authorize is called via /connect/yahoo

var User = require('../models/user');
var request = require('request');
var config = require('../config');

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

exports.handleCallback = function(req, res) {
  var data = req.query;

  // user = new User({token: data.access_token, token_secret: data.access_secret});
  User.update({_id: "568ef435000ad777555d1c41"}, {token: data.access_token, token_secret: data.access_secret, session_handle: data.raw.oauth_session_handle},
    function(err, numberAffected, rawResponse) {
      console.log('ERR', err);
      console.log('numberAffected', numberAffected);
      console.log('rawResponse', rawResponse);
     //handle it
     res.end(JSON.stringify(req.query, null, 2));
    });
}

exports.refreshToken = function(req, res) {
  var oauth =
      { consumer_key: CONSUMER_KEY
      , consumer_secret: CONSUMER_SECRET
      , token: TOKEN //perm_data.oauth_token
      , token_secret: TOKEN_SECRET //perm_data.oauth_token_secret
      , session_handle: SESSION_HANDLE
      }
    , url = 'https://api.login.yahoo.com/oauth/v2/get_token';
  console.log('GET REFRESHTOKEN OAUTH', oauth);
  request.post({url:url, oauth:oauth}, function (e, r, body) {
    // console.log('ERROR:', e);
    // console.log('R', r)
    console.log('BODY: ', body);
    // console.log('body', body.split('&'));
    
    // var decodeBody = decodeURIComponent(body);
    // console.log('decodeBody', decodeBody)
    
    var token = '';
    var token_secret = '';
    var splitBody = body.split('&');
    for (elem of splitBody) {
      console.log('elem', elem);
      var splitElem = elem.split('=');
      if (splitElem[0] === 'oauth_token') {
        token = decodeURIComponent(splitElem[1]);
      }
      if (splitElem[0] === 'oauth_token_secret') {
        token_secret = splitElem[1];
      }
    }
    console.log('token, token_secret', token, token_secret);

    User.update({_id: "568ef435000ad777555d1c41"}, {token: token, token_secret: token_secret},
    function(err, numberAffected, rawResponse) {
      console.log('ERR', err);
      console.log('numberAffected', numberAffected);
      console.log('rawResponse', rawResponse);
     //handle it
    });

    res.send(body);
  })
}