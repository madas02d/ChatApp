import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Hash password
export const hashPassword = async (password) => {
    try {
        if (!password) {
            throw new Error('Password is required');
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Password hashed successfully');
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Error hashing password');
    }
};

// Compare password - simplified version
export const comparePassword= async (password, hashedPassword) => {
    try {
        // Basic validation
        if (!password || !hashedPassword) {
            console.log('Missing password or hash');
            return false;
        }

        // Simple direct comparison using bcrypt
        const isMatch = await bcrypt.compare(password, hashedPassword);
        console.log('Password match:', isMatch);
        
        return isMatch;
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

// Generate JWT token
export const generateToken = (user) => {
    try {
        if (!user || !user._id) {
            console.error('Invalid user object for token generation:', user);
            throw new Error('Invalid user object for token generation');
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined');
            throw new Error('JWT_SECRET is not defined');
        }

        const token = jwt.sign(
            { 
                id: user._id.toString(),
                username: user.username,
                email: user.email
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '7d',
                algorithm: 'HS256'
            }
        );
        console.log('Token generated successfully');
        return token;
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Error generating token');
    }
};

// Set token cookie
export const setTokenCookie = (res, token) => {
    try {
        if (!token) {
            console.error('No token provided for cookie');
            throw new Error('No token provided for cookie');
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        };

        res.cookie('token', token, cookieOptions);
        console.log('Token cookie set successfully');
    } catch (error) {
        console.error('Error setting token cookie:', error);
        throw new Error('Error setting token cookie');
    }
};

// Clear token cookie
export const clearTokenCookie = (res) => {
    try {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
            path: '/'
        };

        res.clearCookie('token', cookieOptions);
        console.log('Token cookie cleared successfully');
    } catch (error) {
        console.error('Error clearing token cookie:', error);
        throw new Error('Error clearing token cookie');
    }
}; 