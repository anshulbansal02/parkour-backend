const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const controllers = require("./api/index.js");

const app = express();

const DB_URI = process.env.DB_URI || "mongodb://localhost/parkour";
mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database!"));
db.once("open", () => {
  console.log("[INFO] Connected to database");
});

app.use(helmet());
app.use(cors());
app.use(morgan("common"));
app.use(express.json());

app.get("/", (req, res) => {
  res.end("Parkour API");
});

app.use("/api/plan", controllers.planRoute);
app.use("/api/account", controllers.accountRoute);
app.use("/api/user", controllers.userRoute);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "NotFound",
    message: `Requested resource ${req.url} was not found`,
  });
});

// Generic Error handler
app.use((err, req, res, next) => {
  res.status(res.statusCode || 500);
  res.json({
    status: err.name,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`[INFO] Server started on address: http://127.0.0.1:${PORT}/`)
);
