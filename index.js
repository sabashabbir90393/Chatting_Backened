/* import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  // Images/files ke liye larger payload allow
  maxHttpBufferSize: 10 * 1024 * 1024,

  cors: {
    origin: ["http://localhost:5173", "https://client-bay-omega-91.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Test route
app.get("/", (req, res) => {
  res.send("<h1>Hello from Realtime Socket Chat Server</h1>");
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  // Join room
  socket.on("join", (roomId) => {
    socket.join(roomId);

    console.log(`${socket.id} joined room: ${roomId}`);
  });

  // Leave room
  socket.on("leave", (roomId) => {
    socket.leave(roomId);

    console.log(`${socket.id} left room: ${roomId}`);
  });

  // Send message
  socket.on("send", (message) => {
    console.log("Message received:", message);

    // Send message to other users in same room
    socket.to(message.room).emit("message", message);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

// Start server
server.listen(5050, () => {
  console.log("server is running on port 5050");
});
 */

import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  maxHttpBufferSize: 10 * 1024 * 1024,

  cors: {
    origin: [
      "http://localhost:5173",
      "https://client-bay-omega-91.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.send("<h1>Hello from Realtime Socket Chat Server</h1>");
});

// =====================================================
// ONLINE USERS
// =====================================================

// Har room ke users yahan temporarily store honge
const roomUsers = new Map();

/*
roomUsers structure:

roomUsers = {
  "room1" => [
    {
      socketId: "...",
      username: "Saba"
    },
    {
      socketId: "...",
      username: "Ali"
    }
  ]
}
*/

// =====================================================
// SOCKET.IO
// =====================================================

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ===================================================
  // JOIN ROOM
  // ===================================================

  socket.on("join", (roomId, username) => {
    if (!roomId || !username) return;

    socket.join(roomId);

    // User ka current room save
    socket.currentRoom = roomId;
    socket.username = username;

    // Agar room pehli dafa bana hai
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, []);
    }

    const users = roomUsers.get(roomId);

    // Duplicate user add na ho
    const alreadyExists = users.some(
      (user) => user.socketId === socket.id
    );

    if (!alreadyExists) {
      users.push({
        socketId: socket.id,
        username: username,
      });
    }

    console.log(`${username} joined room: ${roomId}`);

    // Room ke tamam users ko updated list bhejo
    io.to(roomId).emit("room-users", {
      room: roomId,
      users: users.map((user) => ({
        socketId: user.socketId,
        username: user.username,
      })),
    });

    // New user ko welcome notification
    socket.emit("user-joined", {
      username,
    });
  });

  // ===================================================
  // TYPING START
  // ===================================================

  socket.on("typing", ({ room }) => {
    if (!room || !socket.username) return;

    socket.to(room).emit("user-typing", {
      username: socket.username,
    });
  });

  // ===================================================
  // TYPING STOP
  // ===================================================

  socket.on("stop-typing", ({ room }) => {
    if (!room || !socket.username) return;

    socket.to(room).emit("user-stop-typing", {
      username: socket.username,
    });
  });

  // ===================================================
  // SEND MESSAGE
  // ===================================================

  socket.on("send", (message) => {
    console.log("Message received:", message);

    socket.to(message.room).emit("message", message);
  });

  // ===================================================
  // LEAVE ROOM
  // ===================================================

  socket.on("leave", (roomId) => {
    if (!roomId) return;

    socket.leave(roomId);

    removeUserFromRoom(socket, roomId);

    console.log(
      `${socket.username || socket.id} left room: ${roomId}`
    );

    // Updated users list
    emitRoomUsers(roomId);
  });

  // ===================================================
  // DISCONNECT
  // ===================================================

  socket.on("disconnect", () => {
    console.log(
      "User disconnected:",
      socket.username || socket.id
    );

    const roomId = socket.currentRoom;

    if (roomId) {
      removeUserFromRoom(socket, roomId);

      // Updated online users list
      emitRoomUsers(roomId);
    }
  });
});

// =====================================================
// REMOVE USER FROM ROOM
// =====================================================

function removeUserFromRoom(socket, roomId) {
  const users = roomUsers.get(roomId);

  if (!users) return;

  const updatedUsers = users.filter(
    (user) => user.socketId !== socket.id
  );

  if (updatedUsers.length === 0) {
    roomUsers.delete(roomId);
  } else {
    roomUsers.set(roomId, updatedUsers);
  }

  socket.currentRoom = null;
}

// =====================================================
// SEND UPDATED USERS
// =====================================================

function emitRoomUsers(roomId) {
  const users = roomUsers.get(roomId) || [];

  io.to(roomId).emit("room-users", {
    room: roomId,
    users: users.map((user) => ({
      socketId: user.socketId,
      username: user.username,
    })),
  });
}

// =====================================================
// SERVER
// =====================================================

server.listen(5050, () => {
  console.log("server is running on port 5050");
});