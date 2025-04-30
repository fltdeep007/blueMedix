const express = require('express');
const connectDB = require('./db');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); // To use .env (optional)

const app = express();
const PORT = process.env.PORT || 5000;

//  Security Middleware
const corsOptions = {
  origin: '*', // Change to specific domain in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 🧾 Rate Limiter (Global or selective)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // Limit each IP to 100 requests per 15 mins
  message: { error: 'Too many requests from this IP. Please try again later.' }
});
app.use(limiter); // Apply to all requests

//  Middleware
app.use(express.json());

// Static file access (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'Controllers', 'uploads')));

//  Connect to DB
connectDB();

// 📍 Routes
app.use('/api/regional-admin', require('./Routes/regionalAdmin'));
app.use('/api/superAdmin', require('./Routes/superAdmin'));
app.use('/api/auth', require('./Routes/auth'));
app.use('/api/cart', require('./Routes/cart'));
app.use('/api/orders', require('./Routes/orders'));
app.use('/api/products', require('./Routes/products'));
app.use('/api/seller', require('./Routes/seller'));
app.use('/api/analytics', require('./Routes/cart'));
app.use('/api/userData', require('./Routes/auth'));
app.use('/api/order/invoice' , require('./Routes/invoice'))
//app.use('/api/specialProducts', require('./Routes/special'));

// Root route
app.get('/', (req, res) => {
  res.send('🚀 BlueMedix Server is running securely!');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
