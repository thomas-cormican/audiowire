const multer = require("multer");

// handle file uploads using multer
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/uploads');
  },
  filename: function(req, file, cb) {
    const originalName = file.originalname.split(".")
    const fileType = originalName[originalName.length - 1]
    const fileName = originalName.slice(0, originalName.length - 1).join('-')
    cb(null, (Date.now() + fileName.replace(/[^a-zA-Z ]/g, "") + `.${fileType}`));
  }
})

var upload = multer({
  storage: storage
});

// seperate storage for profile pictures
var profileStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/profile-pics');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }
});

var profilePicUpload = multer({
  storage: profileStorage
});

module.exports = {upload, profilePicUpload}
