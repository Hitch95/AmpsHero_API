var express = require('express');
var router = express.Router();
const Preset = require('../models/Preset');
const { verifyAuthorization } = require('../middlewares/userVerify');


// TODO: GET /presets Retourner la liste des configurations (🔗 avec les données de l'utilisateur et l'ampli ⚙️ filtre par ampli + recherche partielle sur titre de musique)
router.get('/presets', async (req, res) => {
    try {
        let queryObj = {};
        if (req.query.ampli) {
            queryObj.amp = req.query.ampli;
        }
        if (req.query.musicTitle) {
            queryObj.musicTitle = { $regex: req.query.musicTitle, $options: 'i' };
        }

        const presets = await Preset.find(queryObj)
            .populate('user', 'username') // Remplacez 'username' par les champs nécessaires de l'utilisateur
            .populate('amp', 'name'); // Remplacez 'name' par les champs nécessaires de l'amplificateur

        res.json(presets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// TODO: POST /presets Créer une nouvelle configuration (🔒 être connecté)
router.post('/', verifyAuthorization(false), async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(400).json({ 'error': 'User ID is required' });
        }

        const newPreset = new Preset({
            ...req.body,
            user: req.user._id
        });

        const savedPreset = await newPreset.save();
        res.status(201).json(savedPreset);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// TODO: GET /presets/1 Récupérer les données d'une configuration (🔗 avec les données de l'utilisateur et l'ampli)
router.get(('/presets/:id'), async (req, res) => {
    try {
        const preset = await Preset.findById(req.params.id)
            .populate('user', 'username')
            .populate('amp', 'name');

        if (!preset) {
            return res.status(404).json({ 'error': 'Preset not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

// TODO: PATCH /presets/1 Modifier les données d'une configuration (🔒 être connecté avec son propre compte ou admin)
router.patch('/:id', verifyAuthorization(false), async (req, res) => {
    try {
        const preset = await Preset.findById(req.params.id);

        if (!preset) {
            return res.status(404).json({ 'error': 'Preset not found' });
        }

        if (req.user._id !== preset.user.toString() && !req.user.isAdmin) {
            return res.status(403).json({ 'error': 'Access denied' });
        }

        const updatePreset = await Preset.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatePreset) {
            res.status(400).json({ 'error': 'Can\'t find preset' });
        }
        res.json(updatePreset);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

// TODO: DELETE /presets/1 Supprimer les données d'une configuration (🔒 être connecté avec son propre compte ou admin)
router.delete('/:id', verifyAuthorization(false), async (req, res) => {
    try {
        const preset = await Preset.findById(req.params.id);

        if (!preset) {
            return res.status(404).json({ 'error': 'Preset not found' });
        }

        if (req.user._id !== preset.user.toString() && !req.user.isAdmin) {
            return res.status(403).json({ 'error': 'Access denied' });
        }

        await Preset.findByIdAndDelete(req.params.id);
        res.status(200).json({ 'message': 'Preset deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



module.exports = router;
