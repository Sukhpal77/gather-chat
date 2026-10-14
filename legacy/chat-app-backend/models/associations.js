// associations.js
const User = require('./user');
const Chat = require('./user');

const setupAssociations = () => {
    User.hasMany(Chat, { foreignKey: 'senderId', as: 'sentMessages' });
    User.hasMany(Chat, { foreignKey: 'receiverId', as: 'receivedMessages' });

    Chat.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
    Chat.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
};

module.exports = setupAssociations;
