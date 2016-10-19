var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerPredictionSchema = new Schema({
  checksum: String,
  name: String,
  position: String,
  projection: Object
});

var PlayerPrediction = mongoose.model('PlayerPrediction', playerPredictionSchema);

module.exports = PlayerPrediction;
