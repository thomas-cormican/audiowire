require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const cookieParser = require("cookie-parser");
const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;
const flash = require("connect-flash");
const User = require('./models/User.js');
const Post = require('./models/Post.js');
const Message = require('./models/Message.js');
const routes = require('./routes/routes.js');

const app = express();

// app configurations
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(cookieParser('keyboard cat'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// database configuration
mongoose.connect('mongodb+srv://'+ process.env.DB_AUTH + '@cluster0.3nifq.mongodb.net/audiowire?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  autoIndex: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("database connected");
});

// passport configuration
require('./config/passport.js')

// routes
app.use('/', routes)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404
  next(error);
});

// error handler
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.send(res.statusCode + " " + error.message);
});

// start the server
const server = app.listen(process.env.PORT || 3000, function() {
  console.log('server started on port ' + server.address().port);
});
