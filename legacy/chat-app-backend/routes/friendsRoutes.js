// routes/friendsRoutes.js
const express = require('express');
const authVerify  = require('../middleware/authVerify');
const { getFriends, addFriend, updateFriendStatus, getAllPeople, getRequests } = require('../controllers/friendsController');

const route = express.Router();

route.get('/all', authVerify, getAllPeople);
route.get('/friends', authVerify, getFriends);
route.post('/friends', authVerify, addFriend);
route.put('/friends/:id', authVerify, updateFriendStatus);
route.put('/request/cancelRequest/:id', authVerify, updateFriendStatus);
route.get('/request', authVerify, getRequests); 

module.exports = route;
