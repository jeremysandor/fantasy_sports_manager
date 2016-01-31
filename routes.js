var express = require('express');

// set up router
var router = express.Router();

// oauth routes
var auth = require('./app/authorize');
router.get('/handle_yahoo_callback', auth.handleCallback);
router.post('/refreshtoken', auth.refreshToken);

// roster routes
var roster = require('./app/roster');
router.get('/teams', roster.teams);
router.get('/roster', roster.index);
router.get('/editRoster', roster.editRoster);

module.exports = router;