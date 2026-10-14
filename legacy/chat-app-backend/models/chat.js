const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');


const Chat = sequelize.define('Chat', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    senderId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    receiverId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    message: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    voiceMail: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    tableName: 'chats',
    timestamps: true,
});


module.exports = Chat