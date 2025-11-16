import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ 
                error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Create user
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username, 
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                status: user.status,
                photoURL: user.photoURL,
                displayName: user.displayName
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                error: `${field === 'email' ? 'Email' : 'Username'} already exists` 
            });
        }
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ 
            error: error.message || 'Registration failed. Please try again.' 
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update user status to online
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username, 
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                status: user.status,
                photoURL: user.photoURL,
                displayName: user.displayName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.json({ message: 'Logged out successfully' });
});

// Get current user (returns null if not authenticated - no 401 error)
router.get('/me', optionalAuth, (req, res) => {
    if (req.user) {
        res.json({
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                status: req.user.status,
                photoURL: req.user.photoURL,
                displayName: req.user.displayName,
                lastSeen: req.user.lastSeen
            }
        });
    } else {
        // Return 200 with null user instead of 401 - this prevents console errors
        res.json({
            user: null
        });
    }
});

// Clear all cookies (for debugging)
router.post('/clear-cookies', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.json({ message: 'All cookies cleared. Please log in again.' });
});

export default router;
