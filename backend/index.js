const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connect = require('./config/db.js');
// const { notFound, errorHandler } = require('./middleware/errorMiddleware');
// const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes')


dotenv.config();

connect();

const app = express();


app.use(cors());
app.use(express.json());



app.use('/api/register', authRoutes);
app.use('/api/')
// app.use('/api/seller', sellerRoutes)


app.get('/', (req, res) => {
  res.send('API is running...');
});


// app.use(notFound);
// app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});