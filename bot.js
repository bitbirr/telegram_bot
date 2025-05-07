const { Telegraf } = require('telegraf');
const mysql = require('mysql2/promise');
const fetch = require('node-fetch');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

// Load dialog from JSON
const dialog = require('./dialog.json');

// Fetch currency rates from CoinGecko
const fetchCurrencyRates = async () => {
    const response = await fetch(process.env.COINGECKO_API);
    const data = await response.json();
    return data;
};

// Helper function to update user session
const updateCurrentStep = async (userId, step) => {
    await db.query('INSERT INTO user_sessions (user_id, current_step) VALUES (?, ?) ON DUPLICATE KEY UPDATE current_step = ?', [userId, step, step]);
};

// Start command
bot.command('start', async (ctx) => {
    const phone = ctx.message.from.id; // Use Telegram ID for simplicity
    await db.query('INSERT INTO users (phone_number) VALUES (?) ON DUPLICATE KEY UPDATE phone_number = ?', [phone, phone]);
    await updateCurrentStep(phone, 'language_selection');
    ctx.reply(dialog.language_selection.message, {
        reply_markup: {
            keyboard: [
                [{ text: 'English' }, { text: 'Amharic' }]
            ],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    });
});

// Handle language selection
bot.on('text', async (ctx) => {
    const step = await getUserCurrentStep(ctx.message.from.id);
    
    if (step === 'language_selection') {
        const selectedLanguage = ctx.message.text.toLowerCase();
        if (['english', 'amharic'].includes(selectedLanguage)) {
            await db.query('UPDATE users SET language = ? WHERE phone_number = ?', [selectedLanguage, ctx.message.from.id]);
            await updateCurrentStep(ctx.message.from.id, 'otp_verification');
            ctx.reply(dialog.otp_verification.message);
        } else {
            ctx.reply('Please select a valid language');
        }
    }
    else if (step === 'otp_verification') {
        const otp = generateOTP(); // Generate your OTP logic
        // Store OTP securely and send it to the user (Send through Telegram or another secure way)
        ctx.reply(`Your OTP is: ${otp}. Please verify it.`);
        // Store OTP in the database
        await updateCurrentStep(ctx.message.from.id, 'verify_otp');
    }
    else if (step === 'verify_otp') {
        // Assuming OTP verification logic is implemented
        if (ctx.message.text === correctOTP) {
            await db.query('UPDATE users SET kyc_verified = TRUE WHERE phone_number = ?', [ctx.message.from.id]);
            await updateCurrentStep(ctx.message.from.id, 'main_menu');
            ctx.reply('Your account has been verified! Type /menu to access main options.');
        } else {
            ctx.reply('Invalid OTP. Please try again.');
        }
    }
    // Other flow logic based on dialog structure...
});

// Example to show main menu
bot.command('menu', async (ctx) => {
    const step = await getUserCurrentStep(ctx.message.from.id);
    if (step === 'main_menu') {
        ctx.reply(dialog.main_menu.message, {
            reply_markup: {
                keyboard: [
                    [{ text: 'Buy Crypto' }, { text: 'Sell Crypto' }, { text: 'Check Rates' }],
                    [{ text: 'Transaction History' }, { text: 'Help & FAQ' }]
                ],
                one_time_keyboard: true
            }
        });
        await updateCurrentStep(ctx.message.from.id, 'main_menu');
    }
});

// Handle Buy/Sell
bot.on('text', async (ctx) => {
    const step = await getUserCurrentStep(ctx.message.from.id);
    if (step === 'buy_crypto') {
        ctx.reply(dialog.buy_crypto.message, {
            reply_markup: {
                keyboard: [
                    [{ text: 'USDT' }, { text: 'BTC' }]
                ],
                one_time_keyboard: true
            }
        });
        await updateCurrentStep(ctx.message.from.id, 'payment_method');
    } 
    // Add further flow logic for each option users can select...

});

// Get Current User Step
const getUserCurrentStep = async (userId) => {
    const [rows] = await db.query('SELECT current_step FROM user_sessions WHERE user_id = ?', [userId]);
    return rows.length > 0 ? rows[0].current_step : null;
};

// Generate OTP Function
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// Start the bot
bot.launch().then(() => {
    console.log('Bot is running...');
}).catch((err) => {
    console.error('Failed to launch bot:', err);
});