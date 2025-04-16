const express = require('express');
const connectDB = require('./db');

const cors = require('cors');





const cartRoutes = require('./Routes/cart'); 
const orderRoutes = require('./Routes/orders');
const productRoutes = require('./Routes/products');
const sellerRoutes = require('./Routes/seller'); 
const authRoutes = require('./Routes/auth')
const superAdmin = require('./Routes/superAdmin')
const regAdminRoutes = require('./Routes/regionalAdmin')

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


app.use('/api/regional-admin', regAdminRoutes); // For RegionalAdmin endpoints approval / deny / view etc
app.use('/api/regionalAdmin' , superAdmin ) // For super admin to view / reject / accept regional admin signups
app.use('/api/auth' , authRoutes)
app.use('/api/login', cartRoutes); 
app.use('/api/cart', cartRoutes); 
app.use('/api/orders', orderRoutes)
app.use('/api/products', productRoutes);
app.use('/api/seller', sellerRoutes); 

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
