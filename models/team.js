var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamSchema = new Schema({
  week: Number
});

var Team = mongoose.model('Team', teamSchema);

module.exports = Team;