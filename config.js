const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,       // Ensure this is correctly set in your .env file
    user: process.env.DB_USER,       // Your MySQL username
    password: process.env.DB_PASSWORD,// Your MySQL password
    database: process.env.DB_DATABASE // Your database name
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
});

module.exports = db;