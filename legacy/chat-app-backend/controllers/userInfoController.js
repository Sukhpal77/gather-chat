const User = require('../models/user');
const { join } = require('path');
const { existsSync, unlinkSync } = require('fs');

exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findOne({ where: { id: req.user.userId },
        except: ['password']
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.updateUserInfo = async (req, res) => {
    const { userName, firstName, lastName, mobile, address, bio } = req.body;
    const profile = req.file ? req.file.path : null;

    try {
        const user = await User.findOne({ where: { id: req.user.userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (userName) {
            user.userName = userName;
        }
        if (firstName) {
            user.firstName = firstName;
        }
        if (lastName) {
            user.lastName = lastName;
        }
        if (mobile) {
            user.mobile = mobile;
        }
        if (address) {
            user.address = address;
        }
        if (bio) {
            user.bio = bio;
        }
        
        if (profile) {
            user.profile = profile;
            if (user.profile) {
                const oldProfilePath = user.profile; // Assuming this contains the filename
                const oldProfile = join(process.cwd(), oldProfilePath);
        
                if (existsSync(oldProfile)) {
                    try {
                        unlinkSync(oldProfile);
                        console.log(`Deleted old profile picture: ${oldProfilePath}`);
                    } catch (error) {
                        console.error(`Error deleting file: ${error.message}`);
                    }
                } else {
                    console.log(`No file found at: ${oldProfile}`);
                }
            }
        }
        await user.save();
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }


}