let express = require('express');
let router = express.Router();
const Preset = require('../models/Preset');
const { verifyAuthorization } = require('../middlewares/userVerify');


// TODO: GET /presets Retourner la liste des configurations (🔗 avec les données de l'utilisateur et l'ampli ⚙️ filtre par ampli + recherche partielle sur titre de musique)
router.get('/presets', async (req, res) => {
    // #swagger.summary = 'Get all presets'
    // #swagger.description = 'Retrieve a list of all presets, optionally filtering by amplifier and searching by music title. Includes user and amplifier data.'
    // #swagger.parameters['page'] = { description: 'Page number (default 0)', type: 'number' }
    // #swagger.parameters['limit'] = { description: 'Number of elements per page (default 2)', type: 'number' }
    // #swagger.parameters['ampli'] = { description: 'Filter by amplifier ID', type: 'string' }
    // #swagger.parameters['musicTitle'] = { description: 'Partial search on music title', type: 'string' }
    try {
        let { page, limit, ampli, musicTitle } = req.query;
        let filters = {};

        page = isNaN(page) ? 1 : parseInt(page);
        limit = isNaN(limit) ? 2 : parseInt(limit);

        if (ampli) {
            filters.amp = ampli;
        }
        if (musicTitle) {
            filters.musicTitle = { $regex: musicTitle, $options: 'i' };
        }

        const presets = await Preset.find(filters)
            .populate('user', 'username email') // Adaptez les champs selon vos besoins
            .populate('amp', 'name brand') // Adaptez les champs selon vos besoins
            .limit(limit)
            .skip((page - 1) * limit);

        const total = await Preset.where(filters).countDocuments();

        res.json({
            page,
            "hydra:totalItems": total,
            "hydra:members": presets
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// TODO: POST /presets Créer une nouvelle configuration (🔒 être connecté)
router.post('/', verifyAuthorization(false), async (req, res) => {
    // #swagger.summary = 'Create a new preset'
    // #swagger.description = 'Create a new preset (need to be authenticated)'
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
    // #swagger.summary = 'Get one preset data'
    // #swagger.description = 'Get one preset data with user and amplifier data'
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
});

// TODO: PATCH /presets/1 Modifier les données d'une configuration (🔒 être connecté avec son propre compte ou admin)
router.patch('/:id', verifyAuthorization(false), async (req, res) => {
    // #swagger.summary = 'Update one preset data'
    // #swagger.description = 'Update one preset data (need to be authenticated or admin)'
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
});

// TODO: DELETE /presets/1 Supprimer les données d'une configuration (🔒 être connecté avec son propre compte ou admin)
router.delete('/:id', verifyAuthorization(false), async (req, res) => {
    // #swagger.summary = 'Delete one preset'
    // #swagger.description = 'Delete one preset (need to be authenticated or admin)'
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
