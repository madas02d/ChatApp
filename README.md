# Chat App

This is a full-stack real-time chat application project.

## 1. Project Workflow

* User registers (username, email, password).
* User logs in.
* User is redirected to the chat dashboard.
* User can create or join a chat room.
* User enters a chat room and sees a list of online users.
* User sends and receives messages in real time via WebSockets.
* User can see timestamps and sender names.
* Messages auto-scroll and persist temporarily (or stored in DB if implemented).
* User can leave the chat room or logout.

---

## 2. Define Core Features & User Stories

**Formula:**

1. Persona + need + purpose
2. I [user], need to [do something] to [achieve something]
3. As a [persona], I [want to], [so that].

Authentication:

* As a guest, I want to register, so that I can access the chat platform.
* As a registered user, I want to log in, so that I can chat with others.
* As a logged-in user, I want to log out when done for security.

Chat Rooms:

* As a user, I want to create a new chat room, so I can invite others to join.
* As a user, I want to join existing chat rooms, so I can communicate in groups.
* As a user, I want to see who is online in a chat room, so I know who I’m talking to.

Messaging:

* As a user, I want to send and receive messages in real time.
* As a user, I want to see who sent each message and when.
* As a user, I want to auto-scroll to the latest message to stay updated.

Optional:

* As a user, I want my chat messages to be stored, so I can revisit them later.
* As a user, I want to send emojis or images (future enhancement).

---

## 3. Wireframe Planning

[Wireframe](#) *(Add your Figma or image link here)*

### Main pages and UI elements

* Landing Page (Welcome screen with login/signup)
* Signup Page
* Login Page
* Chat Dashboard (list of available chat rooms, create/join buttons)
* Chat Room Page (chat interface with messages and active users)
* About Page

---

## 4. Database Schemas

### User Schema (`User.js`)

{
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastLogin: { type: Date, default: Date.now },
}

### Chat Room Schema (`Room.js`)

{
  roomName: { type: String, required: true, unique: true },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
}

### Message Schema (`Message.js`) *(optional for persistence)*

{
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}

---

## 5. Backend API Design

### User Routes (`/api/user`)

| Method | Endpoint      | Description              | Auth Required? |
| ------ | ------------- | ------------------------ | -------------- |
| POST   | `/register` | Register a new user      | No             |
| POST   | `/login`    | Log in and receive token | No             |
| GET    | `/logout`   | Logout the user          | Yes            |
| GET    | `/profile`  | Get current user info    | Yes            |

### Room Routes (`/api/rooms`)

| Method | Endpoint     | Description               | Auth Required? |
| ------ | ------------ | ------------------------- | -------------- |
| GET    | `/`        | Get all rooms             | Yes            |
| POST   | `/create`  | Create a new room         | Yes            |
| GET    | `/:roomId` | Join/view a specific room | Yes            |

### Message Routes (`/api/messages`) *(if storing chats)*

| Method | Endpoint     | Description                | Auth Required? |
| ------ | ------------ | -------------------------- | -------------- |
| GET    | `/:roomId` | Fetch messages from a room | Yes            |
| POST   | `/`        | Post a new message         | Yes            |

---

## 6. Thinking The Frontend Structure (React)

### Components

| Component            | Purpose                                |
| -------------------- | -------------------------------------- |
| `Navbar.jsx`       | Navigation bar with login/logout       |
| `RoomList.jsx`     | Displays available chat rooms          |
| `RoomForm.jsx`     | Form to create or join a room          |
| `ChatBox.jsx`      | The main chat area                     |
| `Message.jsx`      | Individual message component           |
| `UserList.jsx`     | Shows current active users in the room |
| `LoginForm.jsx`    | Handles login input                    |
| `RegisterForm.jsx` | Handles user registration              |
| `Toast.jsx`        | For real-time error/success messages   |

### Pages

| Page              | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `HomePage.jsx`  | Landing screen with login/register links    |
| `Dashboard.jsx` | Shows rooms and lets user create/join rooms |
| `ChatRoom.jsx`  | Real-time chat room                         |
| `AboutPage.jsx` | About the app and contributors              |

---

## 7. State Management

* Use **Context API** for:
  * Auth state (user info, JWT)
  * Chat state (current room, messages, active users)

---

## 8. Suggestions for Improvement

1. **Security:**
   * Use bcrypt for password hashing.
   * Store JWT in httpOnly cookies.
   * Rate limit login attempts to prevent brute force.
2. **UX/UI Enhancements:**
   * Show typing indicators.
   * Show "user joined/left" system messages.
   * Add dark mode toggle.
   * Use `react-toastify` or similar for alerts.
3. **Performance & Scalability:**
   * Use WebSockets (Socket.IO) for real-time communication.
   * Deploy using Docker on services like Render/Vercel.
4. **Testing:**
   * Use Postman/Thunder Client to test endpoints.
   * Write unit tests for components and API logic.
5. **Optional Features:**
   * Add support for DMs (private messages).
   * Add emoji picker.
   * Implement file/image sharing.
