var request = require('request');
var Team = require('./models/team');
// var mongoose = require('mongoose');

exports.index = function(req, res, next) {
  var oauth =
      { consumer_key: CONSUMER_KEY
      , consumer_secret: CONSUMER_SECRET
      , token: TOKEN //perm_data.oauth_token
      , token_secret: TOKEN_SECRET //perm_data.oauth_token_secret
      }
    // , url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json';
    , url = 'http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/teams?format=json';
  request.get({url:url, oauth:oauth}, function (e, r, user) {
    console.log('R', r)
    console.log(user)
  })
}

// exports.index = function(req, res, next) {
//   var body = ''
//   var allData = request
//     .get('https://www.reddit.com/r/bodyweightfitness.json')
//     .on('error', function(err) {
//       console.log('Error', err);
//     })
//     .on('data', function(data) {
//       // console.log('data', data.toString());
//       body += data
//     })
//     .on('end', function() {
//       console.log('end event hit, got the full body', JSON.parse(body));
//       data = JSON.parse(body);
//       var charles = new Team(data);
//       console.log('charles.name', charles);
//       charles.save();
//     })
//     .pipe(res)
// }

