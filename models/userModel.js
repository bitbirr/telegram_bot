const db = require('../config');

const createUser = (telegramId) => {
    return new Promise((resolve, reject) => {
        db.query('INSERT IGNORE INTO users (telegram_id) VALUES (?)', [telegramId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

const getUser = (telegramId) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM users WHERE telegram_id=?', [telegramId], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
};

const updateUserLanguage = (telegramId, language) => {
    return new Promise((resolve, reject) => {
        db.query('UPDATE users SET language=? WHERE telegram_id=?', [language, telegramId], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

module.exports = {
    createUser,
    getUser,
    updateUserLanguage,
};