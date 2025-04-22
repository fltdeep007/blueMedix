const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect('mongodb+srv://deepanshujain288:N3xWmTCRZFmengDa@goal.zzkvw.mongodb.net/blue', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ DB Error:', err));

app.use('/customers', customerRoutes);
app.use('/orders', orderRoutes);

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
