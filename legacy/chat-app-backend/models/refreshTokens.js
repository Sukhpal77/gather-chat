const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RefreshToken = sequelize.define('RefreshToken', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    refreshToken: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
}, {
    tableName: 'refresh_tokens',
    timestamps: true,
});

RefreshToken.associate = (models) => {
    RefreshToken.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
    });
};

module.exports = RefreshToken;