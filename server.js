const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const { body, query, param } = require("express-validator");
const { validationResult } = require("express-validator");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

// load env vars
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "./config/config.env" });
}

// connect to database
connectDB();

// route files
const auth = require("./routes/auth");
// const users = require("./routes/users");

const app = express();

// Global sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  body().trim().escape()(req, res, next);

  // Sanitize query parameters
  query().trim().escape()(req, res, next);

  // Sanitize request parameters
  param().trim().escape()(req, res, next);
};

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Sanitize input
app.use(mongoSanitize());
app.use(sanitizeInput);

// set security headers
app.use(helmet());

// rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 1000,
});
app.use(limiter);

// Prevent Http param pollution
app.use(hpp());

// Enable cors
app.use(cors());

// set static folder
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/auth", auth);
// app.use("/api/v1/users", users);

app.use(errorHandler);

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

const PORT = process.env.PORT;

const server = app.listen(
  PORT,
  process.env.IP,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // close server & exit process
  server.close(() => process.exit(1));
});
