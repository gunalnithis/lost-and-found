const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const itemRoutes = require("./routes/itemRoutes");
const contactRoutes = require("./routes/contactRoutes");
const aiRoutes = require("./routes/aiRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const advertisementRoutes = require("./routes/advertisementRoutes");
const advertisementRequestRoutes = require("./routes/advertisementRequestRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


// Routes
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/advertisements", advertisementRoutes);
app.use("/api/advertisement-requests", advertisementRequestRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  console.log(`Gemini key loaded: ${process.env.GEMINI_API_KEY ? "YES" : "NO"}`);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();



