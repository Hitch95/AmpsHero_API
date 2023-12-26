const express = require('express');
const passport = require("passport");
const Amplifier = require("../models/Amplifier");
const Preset = require('../models/Preset');
const router = express.Router();


// GET /amplifiers Retourner la liste des amplis
router.get('/', async (req, res) => {
    // #swagger.summary = 'Get all amps'
    // #swagger.description = 'Get all amps'
    // #swagger.parameters['page'] = {description: 'Page number (default 0)', type: 'number'}
    // #swagger.parameters['limit'] = {description: 'Elements per page (default 2)', type: 'number'}
    // #swagger.parameters['brand'] = {description: 'Brand id', type: 'string'}
    let { page, limit, brand } = req.query;
    let filters = {};

    page = isNaN(page) ? 1 : parseInt(page);
    limit = isNaN(limit) ? 2 : parseInt(limit);

    if (brand) {
        filters.brand = brand;
    }

    const amplifiers = await Amplifier.find().populate('brand', 'name').where(filters).limit(limit).skip((page - 1) * limit);
    const total = await Amplifier.where(filters).countDocuments();

    res.json({
        page,
        "hydra:totalItems": total,
        "hydra:members": amplifiers
    });
});

// POST /amplifiers Créer un nouvel ampli
router.post('/', async (req, res) => {
    try {
        const newAmplifier = new Amplifier(req.body);
        const savedAmplifier = await newAmplifier.save();
        res.status(201).json(savedAmplifier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /amplifiers/1 Récupérer les données d'un ampli
router.get('/:id', async (req, res) => {
    const amplifier = await Amplifier.findById(req.params.id).populate(['brand', 'presets', 'presets.user']);

    if (amplifier) {
        res.json(amplifier);
    } else {
        res.status(404).json({ 'error': 'Can\'t find amplifier' });
    }
});

// TODO: PATCH /amplifiers/1 Modifier les données d'un ampli
router.patch('/:id', async (req, res) => {
    try {
        const updateAmplifier = await Amplifier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updateAmplifier) {
            res.status(400).json({ 'error': 'Can\'t find amplifier' });
        }
        res.json(updateAmplifier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

// TODO: DELETE /amplifiers/1 Supprimer les données d'un ampli (🗑️ en supprimer également ses presets)
router.delete('/:id', async (req, res) => {
    try {
        await Preset.deleteMany({ amp: req.params.id });
        const deletedAmplifier = await Amplifier.findByIdAndDelete(req.params.id);
        if (!deletedAmplifier) {
            res.status(400).json({ 'error': 'Can\'t find amplifier' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

module.exports = router;
