"use strict";

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const logger = require("morgan");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
const LocalStrategy = require("passport-local");

require("dotenv").config();

// Database setup
const { mongoose } = require("mongoose");
const Client = require("./models/Client.js");
const Product = require("./models/Product.js");
const Invoice = require("./models/Invoice.js")

// Replace the uri string with your connection string.
const uri = process.env.MONGO_CONNECTION_STRING;

// set up default mongoose connection
mongoose.connect(uri);

// store a reference to the default connection
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// routers
const indexRouter = require("./routers/indexRouter");
const clientsRouter = require("./routers/clientsRouter");
const productsRouter = require("./routers/productsRouter");
const invoicesRouter = require("./routers/invoicesRouter")
const apiRouter = require("./routers/apiRouter");

const port = process.env.PORT || 3003;
const app = express();

// log all requests, using the morgan's dev template
app.use(logger("dev"));

// allow cross origin requests from this machine
app.use(cors({ origin: [/127.0.0.1*/, /localhost*/] }));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(
  require("express-session")({
    secret: "a long time ago in a galaxy far far away",
    resave: false,
    saveUninitialized: false,
  })
)

// Set up User Auth via Passport
// Initialize passport and configure for User model
app.use(passport.initialize());
app.use(passport.session());
const User = require("./models/User");
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// use express.static middleware to make the public folder accessible
app.use(express.static("public"));

// Set up for EJS

// Enable layouts
app.use(expressLayouts);
// Set the default layout
app.set("layout", "layouts/full-width");

// Make views folder globally accessible
app.set("views", path.join(__dirname, "views"));
// Tell express that we'll be using the EJS templating engine
app.set("view engine", "ejs");

// index routes
app.use(indexRouter);

// clients routes
app.use("/clients", clientsRouter);

// products routes
app.use("/products", productsRouter);

// invoices routes
app.use("/invoices", invoicesRouter);

const userRouter = require("./routers/userRouter");
app.use("/user", userRouter);

// Secure routes
const secureRouter = require("./routers/secureRouter");
app.use("/secure", secureRouter);

// api routes
app.use("/api", apiRouter);

// handle unrecognized routes
app.get("*", function (req, res) {
  res.status(404).send('<h2 class="error">File Not Found</h2>');
});

// start listening
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
