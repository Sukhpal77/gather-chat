// models/friend.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Friend = sequelize.define('Friend', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    friendId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'friends',
    timestamps: true,
});

Friend.associate = (models) => {
    Friend.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
    });
};

module.exports = Friend;
