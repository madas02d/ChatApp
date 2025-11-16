import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../controllers/error.controller.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const auth = async (req, res, next) => {
    try {
        // Get token from httpOnly cookie or Authorization header
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        // Log authentication attempt
        console.log('Auth attempt:', {
            hasCookie: !!req.cookies?.token,
            hasAuthHeader: !!req.headers.authorization,
            tokenPresent: !!token,
            path: req.path,
            method: req.method
        });

        if (!token) {
            console.log('Authentication failed: No token provided');
            throw new AuthenticationError('Authentication required');
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verified:', { 
                userId: decoded?.id,
                username: decoded?.username,
                email: decoded?.email,
                iat: decoded?.iat,
                exp: decoded?.exp
            });
        } catch (error) {
            console.error('Token verification failed:', {
                error: error.message,
                name: error.name,
                token: token.substring(0, 10) + '...'
            });

            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthenticationError('Token expired. Please log in again.');
            }
            
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthenticationError('Invalid token. Please log in again.');
            }
            
            throw new AuthenticationError('Authentication failed. Please log in again.');
        }

        // Get user ID from token (using id field)
        const userId = decoded?.id;

        if (!userId) {
            console.log('Authentication failed: Invalid token format', { decoded });
            throw new AuthenticationError('Invalid token format: Missing user ID');
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new AuthenticationError('Invalid user ID format');
        }

        // Find user in database
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            console.log('Authentication failed: User not found', { userId });
            throw new AuthenticationError('User not found');
        }

        // Attach user to request
        req.user = user;
        req.userId = userId;

        console.log('Authentication successful:', {
            userId: user._id,
            username: user.username,
            email: user.email,
            status: user.status
        });

        next();
    } catch (error) {
        console.error('Authentication error:', {
            name: error.name,
            message: error.message,
            path: req.path,
            method: req.method
        });

        // Clear invalid token cookie
        if (req.cookies?.token) {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
        }

        if (error instanceof AuthenticationError) {
            return res.status(401).json({ error: error.message });
        }

        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Optional auth middleware (doesn't throw error if no token)
export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded?.id;

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            const user = await User.findById(userId).select('-password');
            if (user) {
                req.user = user;
                req.userId = userId;
            }
        }

        next();
    } catch (error) {
        // Clear invalid token cookie
        if (req.cookies?.token) {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
        }
        next();
    }
};
