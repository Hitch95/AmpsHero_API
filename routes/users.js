let express = require('express');
let router = express.Router();
const User = require('../models/User');
const Preset = require('../models/Preset');
const { verifyAuthorization } = require('../middlewares/userVerify');

/* GET users listing. */
router.get('/', async function (req, res, next) {
  // #swagger.summary = 'List Users'
  // #swagger.description = 'Retrieve a list of all registered users. Optionally, filter the list by a partial username match.'
  const users = await User.find();
  res.render('users/list', { users });
});

router.get('/profile/:username', (req, res) => {
  // #swagger.summary = 'User Profile'
  // #swagger.description = 'Display the profile page for a user, identified by their username.'
  const { username } = req.params;
  res.render('users/profile', { username: username });
});

router.get('/create', (req, res) => {
  // #swagger.summary = 'User Creation Form'
  // #swagger.description = 'Render the form page for creating a new user account.'
  res.render('/users/form/');
});

router.post('/', async (req, res) => {
  // #swagger.summary = 'Create a new user'
  // #swagger.description = 'Create a new user'
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
router.get('/', async (req, res) => {
  // #swagger.summary = 'Get all users'
  // #swagger.description = 'Get all users with partial filter on username'
  try {
    let query = {};

    if (req.query.username) {
      query.username = { $regex: req.query.username, $options: 'i' };
    }

    const users = await User.find(query);
    res.render('users/list', { users });
  } catch {
    res.status(500).json({ message: err.message });
  }
})

// GET /users/1 Récupérer les données d'un utilisateur avec la liste de ses presets
router.get('/:id', async (req, res) => {
  // #swagger.summary = 'Get one user data'
  // #swagger.description = 'Get one user data with list of presets'
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
router.patch('/:id', verifyAuthorization(false), async (req, res) => {
  // #swagger.summary = 'Update one user'
  // #swagger.description = 'Update one user (need to be authenticated or admin)'
  try {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user._id !== userToUpdate._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access Denied: You can only update your own account unless you are an admin' });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /users/1 Supprimer les données d'un utilisateur (+ être connecté + uniquement sur son compte sauf si admin)
router.delete('/:id', verifyAuthorization(false), async (req, res) => {
  // #swagger.summary = 'Delete one user'
  // #swagger.description = 'Delete one user (need to be authenticated or admin)'
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user._id !== userToDelete._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access Denied: You can only delete your own account unless you are an admin' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;