const { Telegraf } = require('telegraf');
const mysql = require('mysql2/promise');
const fetch = require('node-fetch');
require('dotenv').config();
const dialog = require('./dialog.json');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

// Fetch currency rates from CoinGecko
const fetchCurrencyRates = async () => {
    const response = await fetch(process.env.COINGECKO_API);
    const data = await response.json();
    return data;
};

// Update the current user state in the database
const updateCurrentStep = async (userId, step) => {
    await db.query('INSERT INTO user_sessions (user_id, current_step) VALUES (?, ?) ON DUPLICATE KEY UPDATE current_step = ?', [userId, step, step]);
};

// Verify user's current step
const getUserCurrentStep = async (userId) => {
    const [rows] = await db.query('SELECT current_step FROM user_sessions WHERE user_id = ?', [userId]);
    return rows.length > 0 ? rows[0].current_step : null;
};

// Generate OTP Function
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Start command
bot.command('start', async (ctx) => {
    try {
        const phone = ctx.message.from.id; // Use Telegram ID as user identifier
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
    } catch (error) {
        console.error('Error in start command:', error);
        ctx.reply('An error occurred while processing your request. Please try again later.');
    }
});

// Handle language selection
bot.on('text', async (ctx) => {
    const step = await getUserCurrentStep(ctx.message.from.id);
    
    if (step === 'language_selection') {
        const selectedLanguage = ctx.message.text.toLowerCase();
        if (['english', 'amharic'].includes(selectedLanguage)) {
            await db.query('UPDATE users SET language = ? WHERE phone_number = ?', [selectedLanguage, ctx.message.from.id]);
            await updateCurrentStep(ctx.message.from.id, 'otp_verification');
            const otp = generateOTP();
            ctx.reply(`Your OTP is: ${otp}. Please enter it to verify your account.`, {
                reply_markup: {
                    force_reply: true // Ensure the user can respond
                }
            });
            // Ideally, you would save the OTP securely (e.g., in-memory, distributed cache, etc.)
        } else {
            ctx.reply('Invalid selection. Please choose either English or Amharic.');
        }
    } else if (step === 'otp_verification') {
        // In a real-world scenario, here you would validate the OTP from a temporary storage
        // For simplicity, assuming OTP verification is successful
        const userOTP = ctx.message.text; 
        // TODO: Validate OTP here

        await db.query('UPDATE users SET kyc_verified = TRUE WHERE phone_number = ?', [ctx.message.from.id]);
        await updateCurrentStep(ctx.message.from.id, 'main_menu');
        ctx.reply('Your account has been verified! Type /menu to access main options.');
    }
    // More flow handling based on dialog structure...
});

// Show main menu
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
    if (step === 'buy_crypto' || step === 'sell_crypto') {
        const action = step === 'buy_crypto' ? 'buy' : 'sell';
        const selectedCrypto = ctx.message.text;
        const validCryptos = ['USDT', 'BTC'];

        if (validCryptos.includes(selectedCrypto)) {
            await updateCurrentStep(ctx.message.from.id, 'payment_method');
            ctx.reply(dialog.payment_method.message, {
                reply_markup: {
                    keyboard: [
                        [{ text: 'Telebirr' }, { text: 'EBirr (Kaafi)' }],
                        [{ text: 'Bank Deposit (CBE)' }, { text: 'Bank Deposit (Abyssinia Bank)' }]
                    ],
                    one_time_keyboard: true
                }
            });
        } else {
            ctx.reply('Invalid currency selection. Please select USDT or BTC.');
        }
    }
    // Handle additional stages of the flow...
});

// More handling for transactions, transaction history, and help

// Start the bot
bot.launch().then(() => {
    console.log('Bot is running...');
}).catch((err) => {
    console.error('Failed to launch bot:', err);
});