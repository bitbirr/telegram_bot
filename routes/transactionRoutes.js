const express = require('express');
const router = express.Router();
const transactionModel = require('../models/transactionModel');

// Create a new transaction
router.post('/transactions', async (req, res) => {
    const { userId, amount, currency } = req.body;
    try {
        await transactionModel.createTransaction(userId, amount, currency);
        res.status(201).json({ message: 'Transaction created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get transaction history for a user
router.get('/transactions/:userId', async (req, res) => {
    try {
        const transactions = await transactionModel.getTransactionHistory(req.params.userId);
        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;