// config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME, // Database name
    process.env.DB_USER, // Username
    process.env.DB_PASSWORD, // Password
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false, 
    }
);

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to the local database has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the local database:', error);
    }
};

testConnection();

module.exports = sequelize;
