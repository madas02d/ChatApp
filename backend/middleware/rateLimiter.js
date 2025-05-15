import rateLimit from 'express-rate-limit';

// Login attempt limiter
export const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 attempts per minute
    message: {
        error: 'Too many login attempts. Please try again after 1 minute.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API limiter
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
        error: 'Too many requests from this IP. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
}); 