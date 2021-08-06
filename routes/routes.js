const express = require('express');
const mongoose = require("mongoose");
const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const flash = require("connect-flash");
const dataLists = require("./../input_data/data_lists.js");
const fetch = require('node-fetch');
const {
  stringify
} = require('querystring');
const User = require('./../models/User.js');
const Post = require('./../models/Post.js');
const Message = require('./../models/Message.js');
const {
  upload,
  profilePicUpload
} = require('./../config/multer.js');

const router = express.Router();

router.get("/", function(req, res) {
  Post.find({}).limit(1).sort('-createdAt').exec((err, foundPosts) => {
    res.render("index", {
      req,
      posts: foundPosts
    });
  });
});

router.get("/register", function(req, res) {
  res.render("register", {
    req,
    message: req.flash('info')
  });
});

router.post("/register", function(req, res) {
  const newEmail = req.body.email;
  const newUsername = req.body.username;
  const newEmailLower = req.body.email.toLowerCase();
  const newUsernameLower = req.body.username.toLowerCase();
  const newPassword = req.body.password;
  const confirmedPassword = req.body.confirmPassword;
  bcrypt.hash(newPassword, saltRounds, function(err, hash) {
    // check if username or email already exist and if the confirmed password matches
    User.findOne({
      $or: [{
        'usernameLower': newUsernameLower
      }, {
        'emailLower': newEmailLower
      }]
    }, function(err, foundUser) {
      if (!foundUser && newPassword == confirmedPassword) {
        const newUser = new User({
          email: newEmail,
          username: newUsername,
          emailLower: newEmailLower,
          usernameLower: newUsernameLower,
          password: hash,
          profilePic: "default-profile-pic.jpg",
          bio: ""
        });
        newUser.save();
        res.redirect("/login");
      } else if (foundUser) {
        req.flash('info', 'Username or email already exists');
        res.redirect("/register");
      } else if (newPassword != confirmedPassword) {
        req.flash('info', 'Passwords do not match');
        res.redirect("/register");
      }
    });
  });
});

router.get("/login", function(req, res) {
  res.render("login", {
    req,
    message: req.flash('info')
  });
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('info', 'Incorrect username or password');
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      return res.redirect('/profile/' + user.id);
    });
  })(req, res, next);
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/profile/:user_id', function(req, res, next) {
  const userId = req.params.user_id;
  Post.find().exec((err, posts) => {
    User.findById(userId, function(err, foundUser) {
      if (err) {
        return next();
      } else {
        Post.find({
          createdById: userId
        }).limit(10).sort('-createdAt').exec((err, foundPosts) => {
          res.render("profile", {
            req: req,
            user: foundUser,
            posts: foundPosts,
            fullLength: posts.length,
            currentPage: 0
          });
        });
      }
    });
  });
});

router.get('/profile/:user_id/:page', function(req, res) {
  const pageNumber = req.params.page;
  const userId = req.params.user_id;
  Post.find().exec((err, posts) => {
    User.findById(userId, function(err, foundUser) {
      if (err) {
        res.send("no user found");
      } else {
        Post.find({
          createdById: userId
        }).skip(pageNumber * 10).limit(10).sort('-createdAt').exec((err, foundPosts) => {
          res.render("profile", {
            req: req,
            user: foundUser,
            posts: foundPosts,
            fullLength: posts.length,
            currentPage: parseInt(pageNumber)
          });
        });
      }
    });
  });
});

router.get('/updateprofile/:user_id', function(req, res) {
  if (req.user && req.user.id === req.params.user_id) {
    res.render('update-profile', {
      req
    });
  } else {
    res.send('unauthorized');
  }
});

router.post('/updateprofile/:user_id', profilePicUpload.single("profilePic"), function(req, res) {
  if (req.user && req.user.id === req.params.user_id) {
    const userId = req.params.user_id;
    const updatedBio = req.body.bio;
    const currentPic = req.body.currentPic;
    const updatedProfilePicture = getNewPic();

    function getNewPic() {
      if (req.file) {
        return req.file.filename;
      } else {
        return currentPic;
      }
    }
    const updates = {
      "$set": {
        bio: updatedBio,
        profilePic: updatedProfilePicture
      }
    }
    User.findByIdAndUpdate(userId, updates, {
      multi: true
    }, function(err, doc) {
      res.redirect('/profile/' + userId);
    });
  } else {
    res.render('unauthorized');
  }
});

router.get('/create', function(req, res) {
  if (req.user) {
    res.render('create', {
      req,
      keysList: dataLists.keys,
      instruments: dataLists.instruments,
      genres: dataLists.genres,
      siteKey: process.env.SITE_KEY
    });
  } else {
    res.redirect('/login');
  }
});

router.post('/create', upload.single("audio"), function(req, res) {
  if (req.user) {
    const newPost = new Post({
      title: req.body.title,
      description: req.body.description,
      file: req.file.filename,
      instrument: req.body.instrument,
      genre: req.body.genre,
      key: req.body.key,
      tempo: req.body.tempo,
      createdByUsername: req.user.usernameLower,
      createdById: req.user.id
    });
    newPost.save();
    res.redirect("/profile/" + req.user.id);
  } else {
    res.redirect('/login');
  }
});

router.post('/verify-captcha', async function(req, res) {
  if (!req.body.captcha)
    return res.json({
      success: false,
      msg: 'Please select captcha'
    });

  const secretKey = process.env.SECRET_KEY;

  // Verify URL
  const query = stringify({
    secret: secretKey,
    response: req.body.captcha,
    remoteip: req.connection.remoteAddress
  });
  const verifyURL = `https://google.com/recaptcha/api/siteverify?${query}`;

  // Make a request to verifyURL
  const body = await fetch(verifyURL).then(res => res.json());

  // If not successful
  if (body.success !== undefined && !body.success)
    return res.json({
      success: false,
      msg: 'Failed captcha verification'
    });

  // If successful
  return res.json({
    success: true,
    msg: 'Captcha passed'
  });
});

router.post('/delete', function(req, res) {
  const postId = req.body.postId;
  if (req.user.id == req.body.postUserId) {
    Post.findByIdAndDelete(postId, function(err, post) {
      res.redirect("/profile/" + req.user.id);
    });
  } else {
    res.redirect('/');
  }
});

router.get('/loops', function(req, res) {
  Post.find().exec((err, posts) => {
    Post.find({}).limit(10).sort('-createdAt').exec((err, foundPosts) => {
      if (err) {
        next(err);
      } else {
        res.render("loops", {
          req: req,
          posts: foundPosts,
          fullLength: posts.length,
          keysList: dataLists.keys,
          instruments: dataLists.instruments,
          genres: dataLists.genres,
          searchedPosts: false,
          currentPage: 0
        });
      }
    });
  });
});

router.get('/loops/:length/:page', function(req, res) {
  const pageNumber = req.params.page;
  const fullLength = req.params.length;
  Post.find().skip(pageNumber * 10).limit(10).sort('-createdAt').exec((err, foundPosts) => {
    res.render("loops", {
      req: req,
      posts: foundPosts,
      fullLength: fullLength,
      keysList: dataLists.keys,
      instruments: dataLists.instruments,
      genres: dataLists.genres,
      searchedPosts: false,
      currentPage: parseInt(pageNumber)
    });
  });
});

router.get('/loops/:searchparams/:length/:page/:sort', function(req, res) {
  const pageNumber = req.params.page;
  const fullLength = req.params.length;
  const filteredParams = JSON.parse(req.params.searchparams);
  const sortBy = req.params.sort;
  Post.find(filteredParams).skip(pageNumber * 10).limit(10).sort(sortBy).exec((err, foundPosts) => {
    res.render("loops", {
      req: req,
      posts: null,
      fullLength: fullLength,
      sortBy: sortBy,
      filteredParams: JSON.stringify(filteredParams),
      keysList: dataLists.keys,
      instruments: dataLists.instruments,
      genres: dataLists.genres,
      searchedPosts: foundPosts,
      currentPage: parseInt(pageNumber)
    });
  });
});

router.post('/loops', function(req, res) {
  const searchParams = {
    createdByUsername: req.body.username.toLowerCase(),
    instrument: req.body.instrument,
    description: {
      "$regex": req.body.keyword
    },
    genre: req.body.genre,
    key: req.body.key,
    tempo: {
      $gte: req.body.tempomin,
      $lte: req.body.tempomax
    }
  };
  let filteredParams = {};
  const sortBy = req.body.sort;
  for (const [key, value] of Object.entries(searchParams)) {
    if (!value) {} else {
      filteredParams[key] = value;
    }
  }
  Post.find(filteredParams).exec((err, posts) => {
    Post.find(filteredParams).limit(10).sort(sortBy).exec((err, foundPosts) => {
      res.render("loops", {
        req: req,
        posts: null,
        fullLength: posts.length,
        filteredParams: JSON.stringify(filteredParams),
        sortBy: sortBy,
        keysList: dataLists.keys,
        instruments: dataLists.instruments,
        genres: dataLists.genres,
        searchedPosts: foundPosts,
        currentPage: 0
      });
    });
  });
});

router.post('/like', function(req, res) {
  var userId = req.body.userId;
  var postId = req.body.postId;
  Post.findById(postId, function(err, foundPost) {
    if (foundPost.likes.includes(userId)) {
      var filteredLikes = foundPost.likes.filter(like => {
        return like != userId;
      });
      foundPost.likes = filteredLikes;
      foundPost.save();
      res.send({
        message: 'removed user',
        foundPost
      });
    } else {
      foundPost.likes.push(userId);
      foundPost.save();
      res.send({
        message: 'added user',
        foundPost
      });
    }
  });
});

router.get('/users', function(req, res) {
  res.render("users", {
    req,
    foundUsers: false
  });
});

router.post('/users', function(req, res) {
  User.find({
    usernameLower: {
      "$regex": req.body.searchedName.toLowerCase()
    }
  }).limit(10).exec(function(err, foundUsers) {
    res.render("users", {
      req,
      foundUsers: foundUsers
    });
  });
});

router.get('/help', function(req, res) {
  res.render('support', {
    req
  });
});

router.post('/help', function(req, res) {
  const email = req.body.email;
  const subject = req.body.subject;
  const message = req.body.message;
  const newMessage = new Message({
    email: email,
    subject: subject,
    message: message
  });
  newMessage.save();
  res.send('data received');
});

module.exports = router
