var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  kind: String,
  name: String,
  title: String,
  token: String,
  token_secret: String,
  session_handle: String
});

var User = mongoose.model('User', userSchema);

module.exports = User;