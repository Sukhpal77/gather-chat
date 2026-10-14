const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/profile_pictures' });

router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = router;