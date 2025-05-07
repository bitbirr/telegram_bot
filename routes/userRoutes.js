const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');

// Create or find a user
router.post('/users', async (req, res) => {
    const { telegramId } = req.body;
    try {
        await userModel.createUser(telegramId);
        res.status(201).json({ message: 'User created or already exists' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user language preference
router.put('/users/language', async (req, res) => {
    const { telegramId, language } = req.body;
    try {
        await userModel.updateUserLanguage(telegramId, language);
        res.status(200).json({ message: 'Language updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user by Telegram ID
router.get('/users/:telegramId', async (req, res) => {
    try {
        const user = await userModel.getUser(req.params.telegramId);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;