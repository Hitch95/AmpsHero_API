var express = require('express');
var router = express.Router();
const User = require('../models/User');
const Preset = require('../models/Preset');

/* GET users listing. */
router.get('/', async function (req, res, next) {
  const users = await User.find();
  res.render('users/list', { users });
});

router.get('/profile/:username', (req, res) => {
  const { username } = req.params;
  res.render('users/profile', { username: username });
});

router.get('/create', (req, res) => res.render('/users/form/'));

router.post('/', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = await User.create({ username, email, password });
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

// GET /users Récupérer tous les utilisateurs (+ filtre de recherche partielle sur le username)

// GET /users/1 Récupérer les données d'un utilisateur avec la liste de ses presets
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const presets = await Preset.find({ user: req.params.id }).populate('amp');
    res.json({ user, presets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /users/1 Modifier les données d'un utilisateur (+ être connecté + uniquement sur son compte sauf si admin)

// DELETE /users/1 Supprimer les données d'un utilisateur (+ être connecté + uniquement sur son compte sauf si admin)

module.exports = router;