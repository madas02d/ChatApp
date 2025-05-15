import { Router } from 'express';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { auth } from '../middleware/auth.js';
import { 
    hashPassword, 
    comparePassword, 
    generateToken, 
    setTokenCookie, 
    clearTokenCookie 
} from '../utils/authUtils.js';
import User from '../models/User.js';
import { 
    catchAsync, 
    ValidationError, 
    AuthenticationError 
} from '../controllers/error.controller.js';
import bcrypt from 'bcrypt';
const router = Router();

// Register new user
router.post('/register', catchAsync(async (req, res) => {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
        throw new ValidationError('Please provide all required fields');
    }

    if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
    });

    if (existingUser) {
        throw new ValidationError('User with this email or username already exists');
    }
    
    // Hash password
    console.log('Hashing password for new user...');
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed successfully');
    
    // Create new user
    const user = await User.create({
        username,
        email,
        password: hashedPassword
    });

    // Generate token and set cookie
    const token = generateToken(user);
    setTokenCookie(res, token);
    
    res.status(201).json({ 
        message: 'User registered successfully',
        user: { 
            id: user._id,
            username: user.username, 
            email: user.email,
            avatar: user.avatar
        }
    });
}));

// Login user
router.post('/login', loginLimiter, catchAsync(async (req, res) => {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
        console.log('Login attempt failed: Missing credentials');
        throw new ValidationError('Please provide email and password');
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    console.log(user)
    if (!user) {
        console.log('Login failed: User not found');
        throw new AuthenticationError('Invalid email or password');
    }
    
    // Compare password using the User model's method
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
        console.log('Login failed: Invalid password');
        throw new AuthenticationError('Invalid email or password');
    }
    
    // Update user status to online
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    // Set cookie
    setTokenCookie(res, token);
    
    console.log('Login successful:', { userId: user._id });
    
    // Send response
    res.json({ 
        message: 'Login successful',
        user: { 
            id: user._id,
            username: user.username, 
            email: user.email,
            avatar: user.avatar,
            status: user.status
        }
    });
}));

// Logout user
router.post('/logout', auth, catchAsync(async (req, res) => {
    // Update user status to offline
    await User.findByIdAndUpdate(req.user.id, {
        status: 'offline',
        lastSeen: new Date()
    });

    clearTokenCookie(res);
    res.json({ message: 'Logged out successfully' });
}));

// Get current user
router.get('/me', auth, catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
        throw new AuthenticationError('User not found');
    }
    
    res.json({ user });
}));

// Reset password (temporary route for testing)
router.post('/reset-password', catchAsync(async (req, res) => {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
        throw new ValidationError('Please provide email and new password');
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ValidationError('User not found');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
}));

export default router; 