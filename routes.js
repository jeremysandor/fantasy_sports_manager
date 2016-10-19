var express = require('express');

// set up router
var router = express.Router();

// oauth routes
var auth = require('./app/authorize');
router.get('/handle_yahoo_callback', auth.handleCallback);
router.post('/refreshtoken', auth.refreshToken);

// stats
var stats = require('./app/stats');
router.put('/projections', stats.projection);
router.get('/scrape/stats/historical', stats.fetchHistorical);
router.get('/stats/testpromise', stats.testPromise);

// roster routes
var roster = require('./app/roster');
router.get('/teams', roster.fetchteams);
router.put('/teams', roster.teams);
router.put('/roster', roster.index);
// router.get('/editRosterOld', roster.index, roster.editRoster);
// router.get('/editroster', roster.editRosterNew, roster.editRoster);
router.put('/editroster', roster.editRoster);


// player routes
var players = require('./app/players');
router.get('/allplayers', players.allPlayers);
router.get('/player', players.player);

module.exports = router;