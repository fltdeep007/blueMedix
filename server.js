
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

app.listen(process.env.PORT, () => {
  console.log(`✅ Server running at http://localhost:${process.env.PORT}`);
});




