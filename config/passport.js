const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = require('./../models/User.js')
const bcrypt = require('bcrypt');

// local strategy for logging in user
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({
      usernameLower: username.toLowerCase()
    }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: 'Incorrect username.'
        });
      }
      bcrypt.compare(password, user.password, function(err, result) {
        if (!result) {
          return done(null, false, {
            message: 'Incorrect password.'
          });
        } else if (result) {
          return done(null, user);
        }
      });
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
