const database = require('../util/db');
const express = require('express');
const bcryptjs = require('bcryptjs');

// Middleware
const MiddlewarRegister = (req, res, next) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.render('profile', { error: "Please Enter the form!!" });
    }
    if (password.length < 6) {
        return res.render('profile', { error: 'Password must be over 6 digits' });
    }
    next();
};


const AuthenticateUser = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }    
    return res.render('profile', { error: "Please login first!!" });
};

const GetProfile = (req, res) => {
    res.render('profile', { name: 'Guest', role: 'Visitor' });
};

const registerUser = async (req, res) => { 
    try {
        const { username, email, password } = req.body;
        
        const [existUser] = await database.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (existUser.length > 0) { 
            return res.render('profile', { error: 'This email already exists' });
        }

        const hashpaswword = await bcryptjs.hash(password, 10);
        
        await database.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashpaswword]);
        res.redirect('/');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const LoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [rows] = await database.execute(
            'SELECT * FROM users WHERE email = ?', 
            [email]
        );
        
        if (rows.length > 0) {
            const user = rows[0];

            const isMatch = await bcryptjs.compare(password, user.password);

            if (isMatch) {
                req.session.user = user;
                return res.redirect('/trailer'); 
            }
        } 
        return res.render('profile', { error: "Invalid password" });
    } catch (error) {
        console.error('Login error:', error);
        res.render('profile', { error: 'An error occurred during login. Please try again.' });
    }
};

module.exports = {
    GetProfile,
    registerUser,
    LoginUser,
    MiddlewarRegister,
    AuthenticateUser
};