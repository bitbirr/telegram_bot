const db = require('../config');

const createTransaction = (userId, amount, currency) => {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO transactions (user_id, amount, currency) VALUES (?, ?, ?)', [userId, amount, currency], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

const getTransactionHistory = (userId) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC LIMIT 5', [userId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

module.exports = {
    createTransaction,
    getTransactionHistory,
};