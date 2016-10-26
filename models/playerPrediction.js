var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerPredictionSchema = new Schema({
  checksum: String,
  name: String,
  position: String,
  week: Number,
  projection: String
});

var PlayerPrediction = mongoose.model('PlayerPrediction', playerPredictionSchema);

module.exports = PlayerPrediction;
