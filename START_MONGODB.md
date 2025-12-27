# Start MongoDB - Quick Guide

## Problem
Your backend server is running but can't connect to MongoDB. Error: `ECONNREFUSED 127.0.0.1:27017`

## Solution 1: Start Local MongoDB (Recommended for Development)

### Start MongoDB Service

Run this command in your terminal:

```bash
sudo systemctl start mongod
```

### Enable MongoDB to start automatically on boot (optional)

```bash
sudo systemctl enable mongod
```

### Verify MongoDB is running

```bash
sudo systemctl status mongod
```

You should see:
```
● mongod.service - MongoDB Database Server
     Loaded: loaded
     Active: active (running)
```

### Check if MongoDB is listening on port 27017

```bash
sudo lsof -i :27017
```

Or test the connection:

```bash
mongosh
```

If MongoDB starts successfully, you should see:
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000
Using MongoDB: 7.x.x
Using Mongosh: x.x.x
```

---

## Solution 2: Use MongoDB Atlas (Cloud - No Local Setup Required)

If you prefer not to manage local MongoDB, use MongoDB Atlas (free tier available).

### Steps:

1. **Create a free MongoDB Atlas account:**
   - Go to https://www.mongodb.com/cloud/atlas/register

2. **Create a cluster:**
   - Choose the free tier (M0)
   - Select a region close to you
   - Click "Create Cluster"

3. **Create a database user:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create username and password
   - Set privileges to "Read and write to any database"

4. **Whitelist your IP:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development) or add your specific IP
   - Save

5. **Get your connection string:**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `chatapp` (or remove it)

6. **Update your backend `.env` file:**
   ```bash
   cd backend
   nano .env
   ```
   
   Update the MONGODB_URI:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority
   ```

7. **Restart your backend server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm start
   ```

---

## After Starting MongoDB

Once MongoDB is running (either locally or via Atlas), restart your backend server:

```bash
cd backend
npm start
```

You should now see:
```
✅ Server running on port 5000
📍 API endpoint: http://localhost:5000/api
🔗 Frontend URL: http://localhost:5173
MongoDB Connected: [connection details]
```

## Troubleshooting

### MongoDB won't start locally
- Check if MongoDB is installed: `which mongod`
- Check MongoDB logs: `sudo journalctl -u mongod -n 50`
- Make sure port 27017 is not used by another process: `sudo lsof -i :27017`

### Connection still fails
- Verify MongoDB URI in `backend/.env` file
- Check if MongoDB is listening: `netstat -tuln | grep 27017`
- For Atlas: Make sure your IP is whitelisted

### Permission denied errors
- Make sure you're using `sudo` for systemctl commands
- Check MongoDB data directory permissions: `ls -la /var/lib/mongodb`

## Quick Commands Reference

```bash
# Start MongoDB
sudo systemctl start mongod

# Stop MongoDB
sudo systemctl stop mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo journalctl -u mongod -f

# Connect to MongoDB shell
mongosh

# Test connection
mongosh mongodb://localhost:27017/chatapp
```






