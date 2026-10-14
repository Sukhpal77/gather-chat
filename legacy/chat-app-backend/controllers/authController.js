const User = require('../models/user');
const Friend = require('../models/friend');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/refreshTokens');
const { Op } = require('sequelize');
const transporter = require('../config/nodemailer');
const { where } = require('sequelize');
const e = require('express');
const { join } = require('path');
const fs = require('fs');

const secretKey = process.env.SECRET_KEY || 'your-very-secure-secret-key';

const authController = {
    createUser: async (req, res) => {
        const { userName, email, password, firstName, lastName, mobile, address, bio } = req.body;
        const profile = req.file ? req.file.path : null;

        // const profile = join(process.cwd(), 'uploads/profile_pictures', profilepath);

        try {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                userName,
                email,
                password: hashedPassword,
                firstName,
                lastName,   
                mobile,
                address,
                profile,
                bio,
            });
            const token = jwt.sign({ email: user.email }, secretKey, { expiresIn: '1h' });
            res.status(201).json({ message: 'User created successfully', token });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },
    loginUser: async (req, res) => {
        const { userName, password } = req.body;
        try {
            const user = await User.findOne({ where: { userName } });
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            
            const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '5m' });
            const refreshToken = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '12h' });

            const existingRefreshToken = await RefreshToken.findOne({ where: { userId: user.id } });
            if (existingRefreshToken) {
                await RefreshToken.update(
                    { refreshToken: refreshToken }, 
                    { where: { userId: user.id } }
                );
            } else {
                await RefreshToken.create({ userId: user.id, refreshToken: refreshToken });
            }
            const userInfo = {
                firstName: user.firstName,
                lastName: user.lastName,
                userName: user.userName,
                status: user.status
            };
            res.status(200).json({ message: 'Login successful', accessToken: token, refreshToken, userInfo });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },  

    refreshToken: async (req, res) => {
        const { refreshToken } = req.body;  
        if (!refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        
        try {
            const decoded = jwt.verify(refreshToken, secretKey);
            const user = await User.findOne({ where: { id: decoded.userId } });
            if (!user) {
                return res.status(401).json({ message: 'Invalid refresh token' });
            }
            
            const newRefreshToken = jwt.sign({ email: user.email }, secretKey, { expiresIn: '12h' });
            
            await RefreshToken.update(
                { token: newRefreshToken },
                { where: { userId: user.id } }
            );   
            
            const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '5m' });
            
            res.status(200).json({ message: 'Refresh token generated successfully', accessToken: token, newRefreshToken });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },
     
    logoutUser: async (req, res) => {
        const { refreshToken } = req.body;  
        if (!refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        try {
            const decoded = jwt.verify(refreshToken, secretKey);
            const user = await User.findOne({ where: { id: decoded.userId } });
            if (!user) {
                return res.status(401).json({ message: 'Invalid refresh token' });
            }

            await RefreshToken.destroy({ where: { userId: user.id } });

            res.status(200).json({ message: 'Logout successful' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },
     forgotPassword: async (req, res) => {
            const { email } = req.body;
            try {
                const user = await User.findOne({ where: { email } });
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                const otp = Math.floor(100000 + Math.random() * 900000);
                const hashedOtp = await bcrypt.hash(otp.toString(), 10);
                await User.update({ otp: hashedOtp }, { where: { id: user.id } });
    
                const mailOptions = {
                    from: 'chat-app@gmail.com',
                    to: email,
                    subject: 'Password Reset OTP',
                    text: `Your OTP for password reset is: ${otp}`,
                };
    
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return res.status(500).json({ message: 'Failed to send email' });
                    }
                    res.status(200).json({ message: 'OTP sent successfully' });
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Server error' });
            }
    },

    resetPassword: async (req, res) => {
        const { email, otp, newPassword } = req.body;
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const isMatch = await bcrypt.compare(otp.toString(), user.otp);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid OTP' });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await User.update({ password: hashedPassword, otp: null }, { where: { id: user.id } });
            res.status(200).json({ message: 'Password reset successful' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },
    

};
module.exports = authController
