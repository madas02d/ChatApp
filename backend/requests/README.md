# API Test Requests

This directory contains HTTP request files for testing the Chat App API.

## Directory Structure

```
requests/
├── auth.http      # Authentication endpoints
├── user.http      # User management endpoints
├── room.http      # Room management endpoints
├── message.http   # Message management endpoints
└── README.md      # This file
```

## Setup Instructions

1. **Install REST Client**
   - Install the "REST Client" extension in VS Code
   - Or use any HTTP client that supports `.http` files (Postman, Insomnia, etc.)

2. **Using VS Code REST Client**
   - Open any `.http` file
   - Click "Send Request" above any request
   - Or use the keyboard shortcut (Ctrl+Alt+R or Cmd+Alt+R)

3. **Testing Flow**

   a. Authentication:
   - Run "Register User" request
   - Run "Login User" request
   - Copy the JWT token from the response
   - Update the `@authToken` variable in the files

   b. Room Management:
   - Run "Create New Room" request
   - Copy the room ID from the response
   - Update the `@roomId` variable in the files
   - Run "Join Room" request

   c. Messaging:
   - Run "Send Message" request
   - Copy the message ID from the response
   - Update the `@messageId` variable in the files

## Variables

Each `.http` file contains these variables at the top:
```http
@baseUrl = http://localhost:5000/api
@authToken = your_jwt_token_here
@roomId = your_room_id_here
@messageId = your_message_id_here
```

Update these variables with your actual values after each successful request.

## Testing Tips

1. **Authentication**
   - Always start with registration/login
   - Keep the JWT token updated in variables
   - Test invalid credentials and token expiration

2. **Room Management**
   - Create a room before testing room-specific endpoints
   - Join a room before sending messages
   - Test room access permissions

3. **Messages**
   - Send messages after joining a room
   - Test message deletion permissions
   - Verify message content and timestamps

4. **Error Cases**
   - Test with invalid tokens
   - Test with non-existent room/message IDs
   - Test rate limiting by making multiple requests

## Troubleshooting

1. **Token Issues**
   - Ensure the token is properly set in variables
   - Check token expiration
   - Verify token format in Cookie header

2. **Room Access**
   - Verify you're joined to the room
   - Check room ID in variables
   - Ensure proper permissions

3. **Message Issues**
   - Verify room membership
   - Check message ID format
   - Ensure proper content format

## Using with Other Tools

### Postman
1. Import the `.http` files into Postman
2. Create an environment with the variables
3. Update variables after each request

### Insomnia
1. Import the `.http` files into Insomnia
2. Create an environment with the variables
3. Update variables after each request

### cURL
You can convert the requests to cURL commands:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
``` 