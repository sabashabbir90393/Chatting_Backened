import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  // Images/files ke liye larger payload allow
  maxHttpBufferSize: 10 * 1024 * 1024,

  cors: {
    origin: "http://localhost:5173",
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