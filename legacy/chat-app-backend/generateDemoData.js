const { Sequelize, DataTypes } = require('sequelize');
const { faker } = require('@faker-js/faker'); // Keep this line
const sequelize = require('./config/db'); // Adjust the path as necessary
const User = require('./models/user'); // Adjust the path as necessary

// Function to generate demo users
const generateDemoUsers = async (numUsers) => {
    try {
        // Sync database
        await sequelize.sync({ force: true }); // Use force: true to drop the table and recreate it

        for (let i = 0; i < numUsers; i++) {
            const user = {
                userName: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
                firstName: faker.person.firstName(), // Use faker.person instead of faker.name
                lastName: faker.person.lastName(), // Use faker.person instead of faker.name
                mobile: faker.phone.number(), // Use faker.phone.number instead of faker.phone.phoneNumber
                address: faker.location.streetAddress(), // Use faker.location for address
                profile: faker.image.avatar(),
                status: 'active', // You can modify the status as needed
            };

            // Create user
            const createdUser = await User.create(user);
            console.log(`Created User: ${createdUser.userName}`);
        }
        console.log(`${numUsers} demo users created successfully.`);
    } catch (error) {
        console.error('Error generating demo users:', error);
    } finally {
        await sequelize.close(); // Close the database connection
    }
};

// Change the number of users you want to create here
const numberOfUsers = 10;
generateDemoUsers(numberOfUsers);
