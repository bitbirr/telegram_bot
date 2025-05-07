birbitt-api/
│
├── server.js         // Entry point for the Express server
├── config.js         // Configuration for DB connection
├── .env              // Environment variables
├── models/           // Database models
│   ├── userModel.js  // User data model
│   └── transactionModel.js // Transaction data model
├── routes/           // API route handlers
│   ├── userRoutes.js // User related routes
│   └── transactionRoutes.js // Transaction related routes
└── dialog.json       // JSON flow configuration

1. Handle user registration and management.
2. Manage buy/sell orders.
3. Check current exchange rates.
4. Retrieve transaction history.
5. Provide help and FAQs.