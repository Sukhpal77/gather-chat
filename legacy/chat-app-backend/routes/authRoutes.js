const express = require('express');
const authController = require('../controllers/authController');
const route = express.Router();
const upload = require('../config/multerConfig');
// const multer = require('multer');
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/profile_pictures')
//     },
//     filename: function (req, file, cb) {
//         cb(null,`${Date.now()}_${file.originalname}`)
//     }
// })

// const upload = multer({ storage: storage });

route.post('/register',upload.single('profile'), authController.createUser);
route.post('/login', authController.loginUser);
route.post('/forgot-password', authController.forgotPassword);
route.post('/reset-password', authController.resetPassword);
route.post('/refresh', authController.refreshToken);
// route.get('/verify', authController.verifyUser);
route.get('/logout', authController.logoutUser);

module.exports = route;