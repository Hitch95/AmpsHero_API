var express = require('express');
var router = express.Router();
const User = require('../models/User');

/* GET users listing. */
router.get('/', async function(req, res, next) {
  const users = await User.find();
  res.render('users/list', {users});
});

router.get('/profile/:username', (req, res) => {
  const {username} = req.params;
  res.render('users/profile', {username: username});
});

router.get('/create', (req, res) => res.render('/users/form/'));

router.post('/', async (req, res) => {
  const {username, email, password} = req.body;
  try {
    const user = await User.create({username, email, password});
    console.log(user);
  } catch (e) {
    if (e.code === 11000) {
      console.log('duplicate key error');
    } else {
      console.log(e);
    }
  }

  res.redirect('/users/profile/' + username);
});

module.exports = router;