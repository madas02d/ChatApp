# Fix MongoDB Connection Error

## Current Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
MongooseError: Operation `users.findOne()` buffering timed out after 10000ms
```

This means your backend server is running, but MongoDB is NOT running.

## Quick Fix

### Option 1: Start Local MongoDB (Fastest)

```bash
# Start MongoDB service
sudo systemctl start mongod

# Enable auto-start on boot (optional)
sudo systemctl enable mongod

# Verify it's running
sudo systemctl status mongod
```

You should see:
```
● mongod.service - MongoDB Database Server
     Active: active (running)
```

### Option 2: Use MongoDB Atlas (Cloud - Recommended)

If you don't want to manage local MongoDB or don't have sudo access:

1. **Sign up for free MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/register

2. **Create a cluster** (choose free M0 tier)

3. **Create database user**:
   - Go to "Database Access"
   - Add new user with username/password
   - Give "Read and write" privileges

4. **Whitelist your IP**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (or add your specific IP)

5. **Get connection string**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `chatapp`

6. **Update your `.env` file**:
   ```bash
   cd backend
   nano .env
   ```
   
   Change:
   ```env
   MONGODB_URI=mongodb://localhost:27017/chatapp
   ```
   
   To:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority
   ```

## After Starting MongoDB

Restart your backend server:

```bash
cd backend
# Stop current server (Ctrl+C)
npm start
```

You should now see:
```
✅ Server running on port 5000
MongoDB Connected: [connection details]
```

Instead of:
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

## Verify MongoDB is Running

### For Local MongoDB:
```bash
# Check if MongoDB is listening on port 27017
sudo lsof -i :27017

# Connect to MongoDB shell
mongosh

# Or test specific database
mongosh mongodb://localhost:27017/chatapp
```

### For MongoDB Atlas:
- Check the Atlas dashboard - cluster should be "Running"
- Verify your IP is whitelisted
- Test connection from Atlas dashboard

## Troubleshooting

### MongoDB service won't start:
```bash
# Check MongoDB logs
sudo journalctl -u mongod -n 50

# Check if MongoDB data directory exists and has correct permissions
ls -la /var/lib/mongodb
```

### Connection still fails:
1. **Verify connection string** in `backend/.env`
2. **Check MongoDB is running**: `sudo systemctl status mongod`
3. **Check port is available**: `sudo lsof -i :27017`
4. **For Atlas**: Make sure IP is whitelisted

### Permission denied:
- Make sure you're using `sudo` for systemctl commands
- Check MongoDB data directory permissions

## Fixed Issues

I also fixed:
- ✅ **Duplicate schema index warning** - Removed duplicate index in ConversationKey model
- ✅ **401 Unauthorized errors** - Changed `/auth/me` to use optionalAuth

After starting MongoDB and restarting the server, everything should work!


