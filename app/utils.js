var _u = require('underscore');
var config = require('../config');
var User = require('../models/user');
var Promise = require('bluebird');


User.findOne({_id: "568ef435000ad777555d1c41"}, function(err, user) {
  TOKEN = user.token;
  TOKEN_SECRET = user.token_secret;
  SESSION_HANDLE = user.session_handle;
});

exports.fetchUser = () => {
  return Promise.promisify(User.findOne.bind(User))({_id: "568ef435000ad777555d1c41"})
}

exports.userCreds = (user) => {
  return { consumer_key: config.consumer_key
    , consumer_secret: config.consumer_secret
    , token: user.token 
    , token_secret: user.token_secret
  }
}

exports.translateData = function(data) {
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
        };
        if (key === 'bye_weeks') {
          console.log('got the bye week', val)
          finalData[key] = val.week;
        };
        if (key === 'name') {
          finalData[key] = val.full
        };
        if (['bye_weeks', 'name', 'headshot', 'image_url', 'has_player_notes', 'eligible_positions'].indexOf(key) === -1) {
          finalData[key] = val;
        }
      });
    });

    // set current position
    _u.each(v[1], function(val, key) {
      finalData[key] = val[1].position;
    });

  });
  console.log('finalData', finalData)
  if (_u.isEmpty(finalData) === false) {
    return finalData
  }
}



// edit roster and matchplayers are confusing. could def use a rewrite
exports.editRoster = function(players, callback) {
  var activate = [];
  var deactivate = [];
  _u.each(players, function(player) {
    // if (player['status'] === 'PUP-P' && player.selected_position !== 'BN') {
    //   deactivate.push(player);
    // }
    // if (player['status'] !== 'PUP-P' && player.selected_position === 'BN') {
    //   activate.push(player);
    // }
    if (_u.indexOf(['Q'], player['status']) !== -1 && player.selected_position !== 'BN') {
      deactivate.push(player);
    }
    if (_u.indexOf(['Q'], player['status']) === -1 && player.selected_position === 'BN') {
      activate.push(player);
    }
  });
  return callback(deactivate, activate);
}

exports.matchPlayers = function(deactivate, activate) {
  swaps = []
  _u.each(activate, function(activatePlayer) {
    _u.each(deactivate, function(deactivatePlayer) {
      if (_u.indexOf(activatePlayer.eligible_positions, deactivatePlayer.selected_position) !== -1) {
        // var swapObj = {};
        var insertAt = deactivatePlayer.selected_position;
        if (swaps.length === 0) {
          swaps.push({activate:
                        {
                          player_key: activatePlayer.player_key, position: insertAt
                        },
                      bench:
                        {
                          player_key: deactivatePlayer.player_key, position: 'BN'
                        }
                      })
        }
        else {
          swapKeys = [];
          _u.each(swaps, function(swap) {
            console.log('swap', swap);
            swapKeys.push(swap.activate.player_key);
            swapKeys.push(swap.bench.player_key);
          });
          console.log('swapKeys', swapKeys);
          if (_u.indexOf(swapKeys, deactivatePlayer.player_key) === -1 && _u.indexOf(swapKeys, activatePlayer.player_key) === -1) {
            swaps.push({activate:
                        {
                          player_key: activatePlayer.player_key, position: insertAt
                        },
                      bench:
                        {
                          player_key: deactivatePlayer.player_key, position: 'BN'}
                        }
                      )
          }
        }
      }
    });
  });
  return swaps
}
