var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamSchema = new Schema({
  faab_balance: String,
  team_key: String,
  team_id: String,
  name: String,
  is_owned_by_current_login: Number,
  waiver_priority: Number,
  number_of_trades: Number,
  roster_adds: Object,
  league_scoring_type: String
});

var Team = mongoose.model('Team', teamSchema);

module.exports = Team;
