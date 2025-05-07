const TelegramBot = require('node-telegram-bot-api');
const db = require('./config');
const dialog = require('./dialog.json');
require('dotenv').config();

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Function to send notifications to users
const sendNotification = (chatId, message) => {
    bot.sendMessage(chatId, message).catch(err => {
        console.error('Error sending notification:', err);
    });
};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    db.query('INSERT IGNORE INTO users (telegram_id) VALUES (?)', [chatId], (err) => {
        if (err) {
            console.error('Error inserting user:', err);
            return;
        }
        bot.sendMessage(chatId, dialog.language_selection.message, {
            reply_markup: {
                keyboard: [["1 - English"], ["2 - Amharic"]],
                one_time_keyboard: true
            }
        });
    });
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // Set the language and handle user state
    if (msg.text.includes("English") || msg.text.includes("Amharic")) {
        const language = msg.text.includes("English") ? "en" : "am";
        db.query('UPDATE users SET language=? WHERE telegram_id=?', [language, chatId], (err) => {
            if (err) {
                console.error('Error updating language:', err);
            }
        });
        bot.sendMessage(chatId, dialog.main_menu.message, {
            reply_markup: {
                keyboard: [["1 - Buy Crypto"], ["2 - Sell Crypto"], ["3 - Check Rates"], ["4 - Transaction History"], ["5 - Help & FAQ"]],
                one_time_keyboard: true
            }
        });
        return;
    }

    // Handle main menu options
    if (msg.text.includes("Buy Crypto")) {
        db.query('UPDATE users SET current_action=? WHERE telegram_id=?', ['buy_crypto', chatId], (err) => {
            if (err) {
                console.error('Error setting current action:', err);
            }
        });
        bot.sendMessage(chatId, dialog.buy_crypto.message, {
            reply_markup: {
                keyboard: [["1 - USDT"], ["2 - BTC"]],
                one_time_keyboard: true
            }
        });
        return;
    }

    // Assume here we have mechanisms to process payment and confirm order
    if (msg.text.includes("Confirm Order")) {
        // This would be the logic to save an order
        // After saving the order, send a notification
        sendNotification(chatId, "Your order has been confirmed successfully!");
        return;
    }

    // Other handling for selling, checking rates, etc.

});

// Implement the rest of the bot logic including payment methods, transaction history, etc.