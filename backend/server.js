const express = require('express');
const connectDB = require('./db');
const path = require('path'); // Import the 'path' module
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(express.json());
const corsOptions = {
  origin: '*', // For development only - be more restrictive in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

connectDB();

// Configure middleware to serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'Controllers', 'uploads')));

app.use('/api/regional-admin', require('./Routes/regionalAdmin')); // For RegionalAdmin endpoints approval / deny / view etc
app.use('/api/regionalAdmin' , require('./Routes/superAdmin') ); // For super admin to view / reject / accept regional admin signups
app.use('/api/auth' , require('./Routes/auth'));
// app.use('/api/login', cartRoutes);
app.use('/api/cart', require('./Routes/cart'));  // working all
app.use('/api/orders', require('./Routes/orders'));
app.use('/api/products', require('./Routes/products'));
app.use('/api/seller', require('./Routes/seller'));
app.use('/api/analytics', require('./Routes/cart'));
app.use('/api/userData' , require('./Routes/auth'));

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});