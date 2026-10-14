const express = require('express');
const { getChats, sendMessage, getUserFriends, sendVoiceMessage, getRecentChats } = require('../controllers/chatController');
const authVerify  = require('../middleware/authVerify');
const router = express.Router();

// Chat Routes
router.get('/chats', authVerify, getChats);
router.get('/recent-chats', authVerify, getRecentChats);
router.post('/send-message', authVerify, sendMessage);
router.post('/send-voice-message', authVerify, sendVoiceMessage);
router.get('/friends', authVerify, getUserFriends);


module.exports = router;