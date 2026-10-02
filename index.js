/* import express from "express";
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

const roomUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (roomId, username) => {
    if (!roomId || !username) return;

    socket.join(roomId);
    socket.currentRoom = roomId;
    socket.username = username;

    console.log(`${username} joined ${roomId}`);

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, []);
    }

    const users = roomUsers.get(roomId);

    if (!users.some((user) => user.socketId === socket.id)) {
      users.push({
        socketId: socket.id,
        username,
      });
    }
  });

  socket.on("send", (message) => {
    if (!message?.room) return;

    console.log("Message:", message);

    socket.to(message.room).emit("message", message);
  });

  socket.on("leave", (roomId) => {
    if (!roomId) return;

    socket.leave(roomId);
    removeUser(socket, roomId);
  });

  socket.on("disconnect", () => {
    const roomId = socket.currentRoom;

    if (roomId) {
      removeUser(socket, roomId);
    }

    console.log("Disconnected:", socket.id);
  });
});

function removeUser(socket, roomId) {
  const users = roomUsers.get(roomId);

  if (!users) return;

  const updated = users.filter(
    (user) => user.socketId !== socket.id
  );

  if (updated.length === 0) {
    roomUsers.delete(roomId);
  } else {
    roomUsers.set(roomId, updated);
  }

  socket.currentRoom = null;
}

export default server; */

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

app.get("/", (req, res) => {
  res.send("ChatConnect Backend is running");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (roomId, username) => {
    if (!roomId || !username) return;

    socket.join(roomId);
    socket.currentRoom = roomId;
    socket.username = username;

    console.log(`${username} joined ${roomId}`);
  });

  socket.on("send", (message) => {
    if (!message?.room) return;

    console.log("Message:", message);

    socket.to(message.room).emit("message", message);
  });

  socket.on("leave", (roomId) => {
    if (!roomId) return;

    socket.leave(roomId);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});