const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const {
  notFoundErrorHandler,
  genericErrorHandler,
} = require("./api/handlers.js");
const controllers = require("./api/index.js");
const Response = require("./response/index.js");
const { OK } = Response;

// App Instance
const app = express();

// DB Connection
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

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan("common"));
app.use(express.json());
app.use(Response.middleware);

app.get("/", (req, res) => {
  res.dispatch(new OK("Welcome to Parkour"));
});

// Controller Routes
app.use("/api/plans", controllers.planRoute);
app.use("/api/users", controllers.userRoute);
app.use("/api/inventory", controllers.inventoryRoute);

// Error Handlers
app.use(notFoundErrorHandler);
app.use(genericErrorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`[INFO] Server started on address: http://127.0.0.1:${PORT}/`)
);
