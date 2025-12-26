# Fix Registration Errors

## Errors Fixed

### 1. ✅ Removed Duplicate Route
- **Issue**: There was a duplicate `/api/auth/register` route in `server.js` that conflicted with the proper route in `auth.routes.js`
- **Fix**: Removed the duplicate route from `server.js`
- **Result**: The proper route with password hashing is now used

### 2. ✅ Improved Error Handling
- **Issue**: Generic error messages didn't help identify the problem
- **Fix**: Added specific error handling for:
  - Network connection errors (connection refused)
  - MongoDB duplicate key errors
  - Validation errors
  - Missing environment variables

### 3. ✅ Added Environment Variable Validation
- **Issue**: Server would fail silently if environment variables were missing
- **Fix**: Added validation on server startup to check for required variables

## How to Fix Connection Refused Error

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm start
```

You should see:
```
✅ Server running on port 5000
📍 API endpoint: http://localhost:5000/api
🔗 Frontend URL: http://localhost:5173
MongoDB Connected: [your-mongodb-host]
```

### Step 2: Check Environment Variables

Make sure you have a `.env` file in the `backend` directory with:

```env
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-secret-key-here
PORT=5000
```

If any variables are missing, the server will now show a clear error message.

### Step 3: Verify MongoDB Connection

The server should connect to MongoDB. If it fails, check:
- Your MongoDB connection string
- Network connectivity
- MongoDB Atlas whitelist settings (if using Atlas)

### Step 4: Check Frontend Connection

Make sure your frontend is running:

```bash
cd frontend
npm run dev
```

The frontend should proxy `/api` requests to `http://localhost:5000` (as configured in `vite.config.js`).

## Testing Registration

1. Open the signup page in your browser
2. Fill in the registration form
3. Submit the form

### Expected Results:

**If Backend is Running:**
- ✅ Registration succeeds
- ✅ User is created in MongoDB
- ✅ JWT token is set in httpOnly cookie
- ✅ Auto-login and redirect to dashboard

**If Backend is NOT Running:**
- ❌ Error message: "Cannot connect to server. Please make sure the backend server is running on port 5000."

## Common Issues and Solutions

### Issue: "Connection Refused"
**Cause**: Backend server is not running
**Solution**: Start the backend server (see Step 1 above)

### Issue: "Missing environment variables"
**Cause**: `.env` file is missing or incomplete
**Solution**: Create/update `backend/.env` with required variables

### Issue: "Email already exists"
**Cause**: User already registered with that email
**Solution**: Use a different email or login instead

### Issue: "MongoDB connection failed"
**Cause**: Invalid connection string or network issue
**Solution**: 
- Check `MONGODB_URI` in `.env`
- Verify MongoDB Atlas whitelist includes your IP
- Check network connectivity

### Issue: "Registration failed" (500 error)
**Cause**: Server-side error (check backend logs)
**Solution**: 
- Check backend terminal for error messages
- Verify MongoDB is accessible
- Check JWT_SECRET is set

## Verification

To verify everything is working:

1. **Backend Health Check:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Test Registration:**
   - Go to signup page
   - Fill form and submit
   - Should redirect to dashboard

3. **Check Backend Logs:**
   - Registration request should appear in backend terminal
   - No error messages should be present

## Additional Notes

- The registration route now properly hashes passwords using bcrypt
- Error messages are more descriptive
- Network errors are detected and reported clearly
- MongoDB duplicate key errors are handled gracefully

If you continue to experience issues, check:
1. Backend server logs
2. Browser console for frontend errors
3. Network tab in browser DevTools for request/response details





