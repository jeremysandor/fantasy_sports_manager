var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var rosterPlayerSchema = new Schema({
  team_key: String,
  player_key: String,
  player_id: String,
  status: String,
  editorial_team_full_name: String,
  display_position: String,
  is_undroppable: String,
  position_type: String,
  eligible_positions: Array,
  selected_position: String,
  bye_weeks: String,
  name: String
});

var RosterPlayer = mongoose.model('RosterPlayer', rosterPlayerSchema);

module.exports = RosterPlayer;
