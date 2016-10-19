var express = require('express');
var mongoose = require('mongoose');
var db = mongoose.connection;
var routes = require('./routes');
var session = require('express-session');
var config = require('./config');
var Grant = require('grant-express');
var bodyParser = require('body-parser');
var grant = new Grant(config.grant);
var CronJob = require('cron').CronJob;

// var roster = require('./app/roster');


mongoose.connect('mongodb://localhost/test');
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback) {console.log('database open')});

var app = express();
app.use(session({secret: 'grant'}));
app.use(grant);
app.use(bodyParser.json());
app.use('/', routes);

var server = app.listen(80, 'localhost', function() {
  var port = server.address().port;
  var host = server.address().address;
  // console.log('process.env.NODE_ENV, process.env.HOST', process.env, process.env.HOST)
  // console.log('server', server.address())
  console.log('Example app listening at:', host, port);
});


