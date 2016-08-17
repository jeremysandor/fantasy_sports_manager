var express = require('express');

// set up router
var router = express.Router();

// oauth routes
var auth = require('./app/authorize');
router.get('/handle_yahoo_callback', auth.handleCallback);
router.post('/refreshtoken', auth.refreshToken);

// stats
var stats = require('./app/stats');
router.get('/scrape/stats/historical', stats.fetchHistorical);
router.get('/stats/testpromise', stats.testPromise);

// roster routes
var roster = require('./app/roster');
router.get('/teams', roster.teams);
router.get('/roster', roster.index);
router.get('/allplayers', roster.allPlayers);
router.get('/editRoster', roster.index, roster.editRoster);

module.exports = router;