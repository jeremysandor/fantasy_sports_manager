var Xray = require('x-ray');
// var $ = require('cheerio');
var xray = Xray();
var Promise = require('bluebird');
var _u = require('underscore');
var crypto = require('crypto');



exports.projection = (req, res, next) => {
  var week = req.body.week;
  console.log('PUT projection body', req.body);

  // http://www.fftoday.com/rankings/playerwkproj.php?Season=2016&GameWeek=6&PosID=10

  var pos_id = [req.body.position]
  var page = 0;
  var projections = () => {
    return Promise.map(pos_id, (pos_id) => {
      return Promise.promisify(xray('http://www.fftoday.com/rankings/playerwkproj.php?' + '&order_by=FFPts&sort_order=DESC&Season=' + 2016 + '&GameWeek=' + week + '&PosID=' + pos_id + '&cur_page=' + page, '[bgcolor="#eeeeee"]', ['.bodycontent']))()
    })
    .then((content) => {
      // console.log('content', content);
      content.forEach((elem, i) => {
        console.log('elem', elem);
        if (elem.length) {
          console.log('elem.length')
          page += 1;
          projections();
        }
        else {
          console.log('no elem length')
          res.send('finished');
        }
      })
    })  
  }

  projections();
  


}




YEAR = [2015, 2014]
WEEK = [1,2,3]
POSITION = ['QB', 'RB']


exports.testPromise = (req, res, next) => {
  
  // var myPromise = Promise.promisify(xray('http://www.footballdb.com/fantasy-football/index.html?pos=QB&yr=2015&wk=1', '.statistics', ['td']));

  // Promise.all([myPromise(), myPromise()]).then(function(content) {
  //   console.log('got array of content', content)
  // });


  qs = []
  _u.each(YEAR, function(year) {
    _u.each(WEEK, function(week) {
      _u.each(POSITION, function(position) {
        // qs.push('?pos=' + position + '&yr=' + year + '&wk=' + week)
        qs.push({pos: position, yr: year, wk: week})
      })
    });
  });



  Promise.map(qs, (qs) => {
    return Promise.promisify(xray('http://www.footballdb.com/fantasy-football/index.html?' + 'pos=' + qs.pos + '&yr=' + qs.yr + '&wk=' + qs.wk, '.statistics', ['td']))()
  })
  .then((content) => {
    console.log('qs', qs.length, qs);
    // console.log('got content', content.length, content)
    // res.send(content);
    
    var weekObj = {}
    content.forEach((elem, i) => {
      var playerObj = {};

      elem.splice(0, 6);
      elem.forEach((item, j) => {
        console.log('current elem length', elem.length)
        if (elem.length > 0) {
          var playerData = elem.splice(0, 19);
          // console.log(item);
          console.log('info', qs[i].pos, qs[i].wk, qs[i].yr);
          console.log('playerData', playerData);

          var fullName = playerData[0].split(',')[0].toLowerCase()

          var checksum = crypto.createHash('md5').update(fullName + ' ' + qs[i].pos).digest('hex');   // fullName + position

          var statObj = _u.object(['nameinfo', 'opponent', 'points', 'passAtt', 'passComp', 'passYds', 'passTd', 'int', 'passTwoPt', 'rushAtt', 'rushYds', 'rushTd', 'rushTwoPt', 'rec', 'recYds', 'recTd', 'recTwoPt', 'fl', 'fnl'], playerData)
          console.log('statObj', statObj);

          playerObj['name'] = fullName;
          playerObj['checksum'] = checksum
          playerObj['stats'] = {}
          playerObj['stats'][qs[i].yr] = {}
          playerObj['stats'][qs[i].yr][qs[i].wk] = statObj
          

          console.log('playerObj', JSON.stringify(playerObj, null, 4));
        }
      })
    })
  })
}





// var playerTransform = function (playerWeek) {
//   console.log('playerWeek', playerWeek);
//   if (playerWeek.length) {

//   }
//   return playerWeek
// }

exports.fetchHistorical = function(req, res, next) {
  qs = []
  _u.each(YEAR, function(year) {
    _u.each(WEEK, function(week) {
      _u.each(POSITION, function(position) {
        qs.push('?pos=' + position + '&yr=' + year + '&wk=' + week)
      })
    });
  });


  console.log('QS', qs)
  _u.each(qs, function(qs) {
    xray('http://www.footballdb.com/fantasy-football/index.html' + qs, '.statistics', ['td'])(function(err, content) {
      
      // var playerWeeks = []

      if (content) {

        var spliced = content.splice(0, 6)
        // console.log('spliced', spliced)
        // console.log('content', content.length);
      }
      
      console.log('allStats', allStats)
      // res.send(content);
    });
  });
}

