var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/users/:username', function(req, res) {
  var username = req.params.username;
  res.render('users/profile', { username: username});
});

router.get('', function(req, res) {
  res.render('/users/form', )
});

module.exports = router;
