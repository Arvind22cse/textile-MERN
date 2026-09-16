const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const productRouter = require('./routes/product');
const cartRouter = require('./routes/cart');
const orderRouter = require('./routes/order');
const checkoutRouter = require('./routes/checkout');
const userprod = require('./routes/userproduct');
const reviewRoutes = require("./routes/Reviewrotes");
const aiRouter = require('./routes/ai');
const { handleMalformedJson } = require('./middlewares/handleError');
const requestRouter = require('./routes/request.js');

const app = express();

// MongoDB connection — URI stored in .env (never hardcode credentials in source)
mongoose.set('strictQuery', true);
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("FATAL: MONGODB_URI environment variable is not set. Please add it to .env");
  process.exit(1);
}
mongoose.connect(mongoUri, {
  useUnifiedTopology: true,
  useNewUrlParser: true
}).then(() => console.log("Connected to database"))
  .catch(err => console.error("Database connection error:", err));

// CORS — allow both local dev and production Vercel frontend
const allowedOrigins = [
  "https://textile-mern.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: "2mb" }));
app.use(handleMalformedJson);
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/products", productRouter);
app.use("/carts", cartRouter);
app.use("/orders", orderRouter);
app.use("/checkout", checkoutRouter);
app.use("/userprod", userprod);
app.use("/reviews", reviewRoutes);
app.use("/request", requestRouter);
app.use("/api/ai", aiRouter);  // TextileAI chat endpoint

// Server status
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Kumar Textiles API" });
});

app.listen(process.env.PORT || 5001, () => {
  console.log(`Listening on port ${process.env.PORT || 5001}`);
});
