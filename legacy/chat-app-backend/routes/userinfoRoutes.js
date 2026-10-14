const express = require('express');
const authVerify  = require('../middleware/authVerify');
const userInfoController = require('../controllers/userInfoController.js');
const upload = require('../config/multerConfig');
const route = express.Router();

route.get('/userInfo', authVerify, userInfoController.getUserInfo);
route.put('/updateProfile', upload.single('profile'), authVerify, userInfoController.updateUserInfo);

module.exports = route;