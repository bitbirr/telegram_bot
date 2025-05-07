import { Telegraf, Markup } from 'telegraf';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Define dialog messages
const dialog = {
    language_selection: {
        message: "Welcome to BirBitt! Please select your language:",
        options: {
            "1": "English",
            "2": "Amharic"
        }
    },
    main_menu: {
        message: "What would you like to do?",
    },
    otp_verification: {
        message: "For your security, please verify your phone number. Enter the 6-digit OTP."
    },
    payment_method: {
        message: "Please choose a payment method to proceed:"
    }
};

// MySQL connection setup
const db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

// Initialize the Telegram bot
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Function to generate a random 6-digit OTP
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// Get or create user in the database
const getOrCreateUser = async (userId, language) => {
    console.log(`Checking if user exists: ${userId}`);
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        console.log(`User query result: ${JSON.stringify(rows)}`);

        if (rows.length === 0) {
            // Using userId as the phone number, converting it to string
            await db.query('INSERT INTO users (id, phone_number, language) VALUES (?, ?, ?)', [userId, userId.toString(), language]);
            console.log(`User created: ${userId}`);
        } else {
            console.log(`User already exists: ${userId}`);
        }
    } catch (error) {
        console.error('Error while checking or creating user:', error);
    }
};

// Update user session step
const updateCurrentStep = async (userId, step) => {
    console.log(`Updating current step for user: ${userId} to ${step}`);
    try {
        await db.query(
            'INSERT INTO user_sessions (user_id, current_step) VALUES (?, ?) ON DUPLICATE KEY UPDATE current_step = ?',
            [userId, step, step]
        );
        console.log(`User ${userId} step updated to: ${step}`);
    } catch (error) {
        console.error('Error updating current step:', error);
    }
};

// Command handler for /start
bot.command('start', async (ctx) => {
    const userId = ctx.from.id;
    const language = ctx.from.language_code || "en";
    await getOrCreateUser(userId, language);
    
    await updateCurrentStep(userId, 'language_selection');
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
    const userId = ctx.from.id;
    const [stepRows] = await db.query('SELECT current_step FROM user_sessions WHERE user_id = ?', [userId]);

    console.log(`Current step for user ${userId}: ${JSON.stringify(stepRows)}`);

    if (stepRows.length === 0 || stepRows[0].current_step === null) {
        console.warn(`No valid step found for user ${userId}. Asking to start again.`);
        ctx.reply('It seems your session is invalid. Please start again by typing /start.');
        return;
    }

    const step = stepRows[0].current_step;

    if (step === 'language_selection') {
        const selectedLanguage = ctx.message.text.toLowerCase();
        if (['english', 'amharic'].includes(selectedLanguage)) {
            await db.query('UPDATE users SET language = ? WHERE id = ?', [selectedLanguage, userId]);
            const otp = generateOTP();
            await db.query('INSERT INTO otp_sessions (user_id, otp) VALUES (?, ?) ON DUPLICATE KEY UPDATE otp = ?', [userId, otp, otp]);
            await updateCurrentStep(userId, 'otp_verification');
            console.log(`Generated OTP for user ${userId}: ${otp}`);
            ctx.reply(`Your OTP is: ${otp}. Please enter it to verify your account.`, {
                reply_markup: { force_reply: true }
            });
        } else {
            ctx.reply('Invalid selection. Please choose either English or Amharic.');
            console.log(`Invalid language selection by user ${userId}: ${ctx.message.text}`);
        }
    } else if (step === 'otp_verification') {
        const inputOTP = ctx.message.text;
        const [otpRows] = await db.query('SELECT otp FROM otp_sessions WHERE user_id = ?', [userId]);

        console.log(`OTP query result for user ${userId}: ${JSON.stringify(otpRows)}`);

        // Verify the OTP
        if (otpRows.length > 0 && otpRows[0].otp === inputOTP) {
            await db.query('DELETE FROM otp_sessions WHERE user_id = ?', [userId]); // Remove OTP after verification
            await updateCurrentStep(userId, 'main_menu'); // Go to main menu step
            ctx.reply('Your account has been verified! Type /menu to access main options.');
            console.log(`OTP confirmed for user ${userId}`);
        } else {
            ctx.reply('Invalid OTP. Please try again.');
            console.log(`Invalid OTP entered by user ${userId}: ${inputOTP}`);
        }
    } else if (step === 'payment_method') {
        ctx.reply(dialog.payment_method.message, {
            reply_markup: {
                keyboard: [
                    [{ text: 'Telebirr' }, { text: 'EBirr (Kaafi)' }],
                    [{ text: 'Bank Deposit (CBE)' }, { text: 'Bank Deposit (Abyssinia Bank)' }]
                ],
                one_time_keyboard: true
            }
        });
    }
});

// Enhanced menu functionality
bot.command('menu', async (ctx) => {
    const userId = ctx.from.id;

    try {
        // Fetch menu items from the database
        const [results] = await db.query('SELECT * FROM menu_items');
        const menu = results.map(item => [Markup.button.callback(item.name, `item_${item.id}`)]);

        if (menu.length > 0) {
            await ctx.reply('Choose an item:', Markup.inlineKeyboard(menu));
            console.log(`Menu displayed to user: ${userId}`);
        } else {
            await ctx.reply('No menu items available at the moment.');
            console.log(`No menu items for user: ${userId}`);
        }
    } catch (error) {
        console.error('Error fetching menu items:', error);
        await ctx.reply('There was an error retrieving the menu. Please try again later.');
    }
});

// Handle menu item selection
bot.action(/item_(\d+)/, async (ctx) => {
    const itemId = ctx.match[1];

    try {
        const [results] = await db.query('SELECT * FROM menu_items WHERE id = ?', [itemId]);
        
        if (results.length > 0) {
            const item = results[0];
            await ctx.reply(`You selected: ${item.name} - ${item.description}`);
            console.log(`User ${ctx.from.id} selected item: ${item.name}`);
        } else {
            await ctx.reply('Item not found.');
            console.log(`Item not found for id: ${itemId}`);
        }
    } catch (error) {
        console.error('Error fetching menu item:', error);
        await ctx.reply('There was an error fetching the item details. Please try again later.');
    }
});

// Check rates command
bot.command('check_rates', async (ctx) => {
    ctx.reply("Current rates: \n1 BTC = 200,000 ETB\n1 USDT = 50 ETB"); // Placeholder
    console.log(`Rates checked by user: ${ctx.from.id}`);
});

// Transaction history command
bot.command('transaction_history', async (ctx) => {
    const userId = ctx.from.id;
    const [transactions] = await db.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);

    console.log(`Transaction history query result for user ${userId}: ${JSON.stringify(transactions)}`);

    if (transactions.length > 0) {
        const history = transactions.map(t =>
            `ID: ${t.id}, Type: ${t.transaction_type}, Amount: ${t.amount}, Currency: ${t.currency}, Payment Method: ${t.payment_method}, Date: ${t.created_at}`
        ).join('\n');
        ctx.reply(`Your Transaction History:\n${history}`);
    } else {
        ctx.reply('You have no transaction history.');
    }
    console.log(`Transaction history requested by user: ${userId}`);
});

// Start the bot
bot.launch().then(() => {
    console.log('Bot is running...');
}).catch((err) => {
    console.error('Failed to launch bot:', err);
});