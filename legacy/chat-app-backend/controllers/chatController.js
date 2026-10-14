const e = require('express');
const Chat = require('../models/chat');
const User = require('../models/user');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');

// Get chat messages with a specific friend
exports.getChats = async (req, res) => {
    const { friendId } = req.query;
    const { userId } = req.user;

    try {
        const chats = await Chat.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId },
                ],
            },
            order: [['createdAt', 'ASC']],
        });

        if (!chats) {
            return res.status(404).json({ error: 'Chats not found' });
        }
        await Chat.update({ isRead: true }, {
            where: {
                [Sequelize.Op.or]: [
                    { senderId: userId, receiverId: friendId, isRead: false },
                    { senderId: friendId, receiverId: userId, isRead: false },
                ],
            },
        });


        const enhancedChats = chats.map(chat => ({
            ...chat.toJSON(),
            isUser: chat.senderId === userId,
            time: new Date(chat.createdAt),
        }));

        res.json(enhancedChats);
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
};

// Get Recent Chats
exports.getRecentChats = async (req, res) => {
    const { userId } = req.user;

    try {
        // Raw SQL query to get recent chats with user details
        const recentChats = await Chat.sequelize.query(`
            SELECT 
                CASE 
                    WHEN "Chat"."senderId" = '${userId}' THEN "Chat"."receiverId" 
                    ELSE "Chat"."senderId" 
                END AS "friendId",
                "Chat"."message",
                "Chat"."createdAt",
                (
                    SELECT COUNT(*)
                    FROM "chats" AS "UnreadChats"
                    WHERE 
                        "UnreadChats"."senderId" = CASE 
                            WHEN "Chat"."senderId" = '${userId}' THEN "Chat"."receiverId" 
                            ELSE "Chat"."senderId" 
                        END 
                        AND "UnreadChats"."receiverId" = '${userId}'
                        AND "UnreadChats"."isRead" = false
                ) AS "unreadCount",
                "FriendUser"."firstName",
                "FriendUser"."lastName",
                "FriendUser"."userName",
                "FriendUser"."profile",
                "FriendUser"."bio",
                "FriendUser"."address",
                "FriendUser"."mobile",
                "FriendUser"."email"
            FROM "chats" AS "Chat"
            JOIN "users" AS "FriendUser" ON 
                "FriendUser"."id" = CASE 
                    WHEN "Chat"."senderId" = '${userId}' THEN "Chat"."receiverId" 
                    ELSE "Chat"."senderId" 
                END
            WHERE 
                "Chat"."senderId" = '${userId}' OR "Chat"."receiverId" = '${userId}'
            ORDER BY "Chat"."createdAt" DESC
        `, {
            type: Sequelize.QueryTypes.SELECT
        });

        // Group by friendId and take the latest chat message for each friend
        const groupedChats = recentChats.reduce((acc, chat) => {
            const friendId = chat.friendId;
            if (!acc[friendId] || acc[friendId].createdAt < chat.createdAt) {
                acc[friendId] = chat;
            }
            return acc;
        }, {});

        const result = Object.values(groupedChats);

        res.json(result);
    } catch (error) {
        console.error('Error fetching recent chats:', error);
        res.status(500).json({ error: 'Failed to fetch recent chats' });
    }
};



// Send a message
exports.sendMessage = async (req, res) => {
    const {  friendId:receiverId, message } = req.body;
    const { userId:senderId } = req.user;
    const type = 'text';

    try {
        const newChat = new Chat({ senderId, receiverId, message,type });
        await newChat.save();
        
        // // Emit to WebSocket here if needed
        // req.io.emit('newMessage', newChat);

        res.status(201).json(newChat);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

exports.sendVoiceMessage = async (req, res) => {
    const {  friendId:receiverId,voiceMail  } = req.body;
    const { userId:senderId } = req.user;
    const type = 'voice';

    try {
        const newChat = new Chat({ senderId, receiverId, voiceMail,type });
        await newChat.save();
        
        // Emit to WebSocket here if needed
        req.io.emit('newMessage', newChat);

        res.status(201).json(newChat);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// exports.getUnreadMessages = async (req, res) => {
//     const { userId } = req.user;
//     try {
//         const chats = await Chat.findAll({
//             where: { receiverId: userId, isRead: false },
//         });
//         res.json(chats);
//     } catch (error) {
//         console.error('Error fetching unread messages:', error);
//         res.status(500).json({ error: 'Failed to fetch unread messages' });
//     }
// };

// Get list of friends

exports.getUserFriends = async (req, res) => {
    const { userId } = req.query;
    try {
        const user = await User.findById(userId).populate('friends');
        res.json(user.friends);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'Failed to fetch friends' });
    }
};
