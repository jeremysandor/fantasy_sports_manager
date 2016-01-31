var _u = require('underscore');

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
  if (_u.isEmpty(finalData) === false) {
    return finalData
  }
}

exports.editRoster = function(players, callback) {
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