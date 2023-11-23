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
const xss = require("xss-clean");
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
const users = require("./routes/users");
const reviews = require("./routes/reviews");
const bookings = require("./routes/bookings");
const appointments = require("./routes/appointments");
const tickets = require("./routes/tickets");
const payment = require("./routes/payment");
const chat = require("./routes/chat");
const waitlist = require("./routes/waitlist");

const app = express();

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
app.use(xss());

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
app.use(
  cors({
    origin: "https://www.glamorgram.com",
  })
);

// set static folder
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);
app.use("/api/v1/bookings", bookings);
app.use("/api/v1/appointments", appointments);
app.use("/api/v1/tickets", tickets);
app.use("/api/v1/payment", payment);
app.use("/api/v1/chat", chat);
app.use("/api/v1/waitlist", waitlist);

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
