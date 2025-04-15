const express = require('express');
const connectDB = require('./db');

const cors = require('cors');

const cartRoutes = require('./Routes/cart'); 
const orderRoutes = require('./Routes/orders');
const productRoutes = require('./Routes/products');
const sellerRoutes = require('./Routes/seller'); 

const app = express();
const PORT = 5000;

app.use(express.json()); 
app.use(cors());        

connectDB();

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
