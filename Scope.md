## Build a multilingual using Node.js and a MySQL database based on the provided JSON file structure for the BirBitt business, we will follow a structured approach. The bot should:
1. Verify users using phone number and KYC if required.
2. Allow users to see current exchange rates (ETB ↔ USDT/BTC).
3. Let users place buy/sell orders with confirmation steps.
4. Notify admin of pending orders.
5. Support payment instructions for bank transfer, Telebirr, and Chapa.
6. Provide transaction history on request.
7. Offer basic support and FAQs.
8. Be fast, secure, and support Amharic and English.

### Requirements
1. Telegram Bot Token
2. CoinGecko API keys for fetching real-time currency rates.






1) Important Points:
# OTP Verification: The OTP generation and sending it through WhatsApp using Twilio are stubbed; you should implement the actual verification mechanisms and manage user sessions.

# Handling Database: You should implement a database (such as SQLite, PostgreSQL, etc.) to store user data, transaction records, and KYC information if necessary.

# Real API for Currency Rates: The fetch_current_rates function contains a hardcoded placeholder. Use an actual API to fetch rates.

# Security Considerations: Ensure secure handling of sensitive data and follow best practices for data protection and user privacy.

# Multilingual Responses: For language support, you may want to adjust dialogue flows based on user selection and store translations appropriately.

