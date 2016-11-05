var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerPredictionSchema = new Schema({
  checksum: String,
  name: String,
  position: String,
  week: Number,
  projection: { type: Number, default: 0 }
});

var PlayerPrediction = mongoose.model('PlayerPrediction', playerPredictionSchema);

module.exports = PlayerPrediction;
