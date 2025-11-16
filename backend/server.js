import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiLimiter } from './middleware/rateLimiter.js';
import routes from './routes/index.js';
import connectDB from './utils/db.js';
import { errorHandler, notFoundHandler } from './controllers/error.controller.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\nPlease create a .env file in the backend directory with these variables.');
    process.exit(1);
}

// Connect to MongoDB
connectDB();

const app = express();

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cookieParser()); // Parse cookies
app.use(express.json()); // Parse JSON bodies
app.use(cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(apiLimiter); // Apply rate limiting to all routes
app.options('*', cors()); // Enable pre-flight for all routes

// Mount all routes
app.use('/api', routes);

// Handle undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
    console.log(`🔗 Frontend URL: http://localhost:5173`);
}); 