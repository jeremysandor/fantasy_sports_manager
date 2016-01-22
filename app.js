var express = require('express');
var mongoose = require('mongoose');
var db = mongoose.connection;
var routes = require('./routes');

var session = require('express-session');
var config = require('./config');
var Grant = require('grant-express');
var grant = new Grant(config.grant);


mongoose.connect('mongodb://localhost/test');
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback) {
  console.log('database open')
});

var app = express();
app.use(session({secret: 'grant'}));
app.use(grant);
app.use('/', routes);

var server = app.listen(80, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at:', host, port);
});


