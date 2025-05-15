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
                throw new AuthenticationError('Token expired');
            }
            throw new AuthenticationError('Invalid token');
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

        // Find user
        const user = await User.findById(userId).select('-password');

        // Log user lookup result
        console.log('User lookup:', {
            userId,
            userFound: !!user,
            userStatus: user?.status,
            userEmail: user?.email,
            userUsername: user?.username
        });

        if (!user) {
            console.log('Authentication failed: User not found', { 
                userId,
                token: token.substring(0, 10) + '...',
                tokenIssuedAt: new Date(decoded.iat * 1000).toISOString(),
                tokenExpiresAt: new Date(decoded.exp * 1000).toISOString()
            });

            // Clear the invalid token from cookies
            if (req.cookies?.token) {
                res.clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });
            }

            throw new AuthenticationError('Session expired. Please log in again.');
        }

        // Check if user is active
        if (user.status === 'offline') {
            console.log('Authentication failed: User is offline', { 
                userId: user._id,
                username: user.username,
                lastSeen: user.lastSeen
            });
            throw new AuthenticationError('User account is inactive');
        }

        // Update user's last seen & status
        await User.findByIdAndUpdate(user._id, {
            lastSeen: new Date(),
            status: 'online'
        });
        // Express auth middleware (simplified)
        req.user = { id: decoded.id };

        // Attach user to request
        req.user = user;
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
            stack: error.stack,
            path: req.path,
            method: req.method
        });

        // Clear token on authentication errors
        if (req.cookies?.token) {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
        }

        if (error instanceof AuthenticationError) {
            next(error);
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(new AuthenticationError('Invalid token'));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new AuthenticationError('Token expired'));
        } else {
            next(new AuthenticationError('Authentication failed'));
        }
    }
};
