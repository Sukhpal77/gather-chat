// controllers/friendsController.js
const Friend = require('../models/friend');
const User = require('../models/user');
const { Op, where } = require('sequelize');

const getAllPeople = async (req, res) => {
    const userId = req.user.userId;
    const userName = req.query.name;
    try {
        const friends = await User.findAll({
            where: {
                userName: {
                    [Op.like]: `%${userName}%`,
                },
                id: {
                    [Op.ne]: userId,
                },
            },
            attributes: ['firstName', 'lastName', 'profile', 'userName', 'id', 'bio','address','mobile','email','createdAt'],
            // include: {
            //     model: Friend,
            //     as: 'friends',
            //     required: false,
            //     where: {
            //         [Op.or]: [
            //             { friendId: userId },
            //             { userId: userId },
            //         ],
            //     },
            //     attributes: ['status', 'friendId'],
            // },
        });

        if (friends.length === 0) {
            return res.status(404).json({ message: 'No users found.' });
        }

        const friendsWithStatus = await Promise.all(
            friends.map(async (friend) => {
                const requestedByUser = await Friend.findOne({
                    where: { userId: friend.id, friendId: userId, status: 'pending' },
                });
        
                if (requestedByUser) {
                    friend.status = 'requested';
                    return friend;
                }
        
                const pendingRequestToUser = await Friend.findOne({
                    where: { friendId: friend.id, userId: userId, status: 'pending' },
                });
        
                if (pendingRequestToUser) {
                    friend.status = 'pending';
                    return friend;
                }
        
                const acceptedFriendship = await Friend.findOne({
                    where: {
                        [Op.or]: [
                            { userId: friend.id, friendId: userId, status: 'accepted' },
                            { friendId: friend.id, userId: userId, status: 'accepted' },
                        ],
                    },
                });
        
                if (acceptedFriendship) {
                    friend.status = 'accepted';
                    return friend;
                }
        
                friend.status = 'unfriended';
                return friend;
            })
        );

        res.json(friendsWithStatus);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).send('Server error');
    }
};



const getFriends = async (req, res) => {
    try {
        const friends = await Friend.findAll({
            where: {
                status: 'accepted',
                [Op.or]: [
                    { userId: req.user.userId },
                    { friendId: req.user.userId },
                ],
            },
        });

        const friendData = await Promise.all(friends.map(async (friend) => {
            let fd;
            if (friend.userId === req.user.userId) {
                fd = await User.findByPk(friend.friendId);
            } else {
                fd = await User.findByPk(friend.userId);
            }

            return {
                ...friend.toJSON(),
                firstName: fd.firstName,
                lastName: fd.lastName,
                profile: fd.profile,
                userName: fd.userName,
                friendId: fd.id,
                bio: fd.bio,
                address: fd.address,
                mobile: fd.mobile,
                email: fd.email,
                userId: req.user.userId
            };
        }));

        res.json(friendData);
    } catch (error) {
        console.error('Error fetching friends', error);
        res.status(500).send('Server error');
    }
};



const addFriend = async (req, res) => {
    const { friendId } = req.body;
    const { userId } = req.user;
    const status = 'pending';
    try {
        const existingRequest = await Friend.findOne({ where: { userId, friendId } || { userId: friendId, friendId: userId } });
        if (existingRequest) {
            return res.status(400).send('Request already exists');
        }
        const newFriend = await Friend.create({ userId,friendId, status });
        res.status(201).json(newFriend);
    } catch (error) {
        console.error('Error adding friend', error);
        res.status(500).send('Server error');
    }
};

const updateFriendStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;
    try {
        const friend = await Friend.findByPk(id);
        if (!friend) {
            return res.status(404).send('Friend not found');
        }
        friend.status = status;
        await friend.save();
        res.json(friend);
    } catch (error) {
        console.error('Error updating friend', error);
        res.status(500).send('Server error');
    }
};

const getRequests = async (req, res) => {
    const { userId } = req.user;
    try {
        const pendingRequests = await Friend.findAll({
            where: {
                friendId: userId,
                status: 'pending',
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'profile', 'userName'],
                },
            ]
        });

        res.json(pendingRequests);
    } catch (error) {
        console.error('Error fetching friends', error);
        res.status(500).send('Server error');
    }
    
}

module.exports = {
    getFriends,
    addFriend,
    updateFriendStatus,
    getAllPeople,
    getRequests,
};
