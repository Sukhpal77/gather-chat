const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profile_pictures')
    },
    filename: function (req, file, cb) {
        cb(null,`${Date.now()}_${file.originalname}`)
    }
})

// Define file filter and limits
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: function (req, file, cb) {
      const fileTypes = /jpeg|jpg|png|gif/; // Allowed file types
      const extname = fileTypes.test(file.mimetype);
      const mimetype = fileTypes.test(file.originalname.split('.').pop().toLowerCase());

      if (extname && mimetype) {
          return cb(null, true);
      } else {
          cb(new Error('Error: File type not allowed'));
      }
  }
});

module.exports = upload;
