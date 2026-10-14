// index.js or app.js

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const User = require('./models/user');
const Friend = require('./models/friend');
const authRoutes = require('./routes/authRoutes');
const friendRoutes = require('./routes/friendsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userInfoRoutes = require('./routes/userinfoRoutes');
const setupAssociations = require('./models/associations');
const bodyParser = require('body-parser');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 5000;

// app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

setupAssociations();

app.use('/auth', authRoutes);
app.use('/api', friendRoutes);
app.use('/api', chatRoutes);
app.use('/api', uploadRoutes);
app.use('/api', userInfoRoutes);
app.get('/', (req, res) => {    
    res.send('Hello World!');
});

// Initialize associations
User.associate({ Friend });
Friend.associate({ User });

sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database synced successfully.');
        app.listen(PORT, () => {  // Use server.listen instead of app.listen
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to sync the database:', error);
    });
