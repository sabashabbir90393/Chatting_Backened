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
  res.send("Realtime Socket Chat Server is running");
});

const roomUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ============================
  // JOIN ROOM
  // ============================

  socket.on("join", (roomId, username) => {
    if (!roomId || !username) return;

    socket.join(roomId);

    socket.currentRoom = roomId;
    socket.username = username;

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, []);
    }

    const users = roomUsers.get(roomId);

    const alreadyExists = users.some(
      (user) => user.socketId === socket.id
    );

    if (!alreadyExists) {
      users.push({
        socketId: socket.id,
        username,
      });
    }

    console.log(
      `${username} joined room: ${roomId}`
    );

    io.to(roomId).emit("room-users", {
      room: roomId,

      users: users.map((user) => ({
        socketId: user.socketId,
        username: user.username,
      })),
    });

    socket.emit("user-joined", {
      username,
    });
  });

  // ============================
  // TYPING
  // ============================

  socket.on("typing", ({ room }) => {
    if (!room || !socket.username) return;

    socket.to(room).emit("user-typing", {
      username: socket.username,
    });
  });

  // ============================
  // STOP TYPING
  // ============================

  socket.on("stop-typing", ({ room }) => {
    if (!room || !socket.username) return;

    socket.to(room).emit("user-stop-typing", {
      username: socket.username,
    });
  });

  // ============================
  // SEND MESSAGE
  // ============================

  socket.on("send", (message) => {
    if (!message?.room) return;

    console.log(
      "Message received:",
      message
    );

    socket
      .to(message.room)
      .emit("message", message);
  });

  // ============================
  // LEAVE ROOM
  // ============================

  socket.on("leave", (roomId) => {
    if (!roomId) return;

    socket.leave(roomId);

    removeUserFromRoom(
      socket,
      roomId
    );

    console.log(
      `${socket.username || socket.id} left room: ${roomId}`
    );

    emitRoomUsers(roomId);
  });

  // ============================
  // DISCONNECT
  // ============================

  socket.on("disconnect", () => {
    console.log(
      "User disconnected:",
      socket.username || socket.id
    );

    const roomId =
      socket.currentRoom;

    if (roomId) {
      removeUserFromRoom(
        socket,
        roomId
      );

      emitRoomUsers(roomId);
    }
  });
});

// =================================
// REMOVE USER
// =================================

function removeUserFromRoom(
  socket,
  roomId
) {
  const users =
    roomUsers.get(roomId);

  if (!users) return;

  const updatedUsers =
    users.filter(
      (user) =>
        user.socketId !== socket.id
    );

  if (updatedUsers.length === 0) {
    roomUsers.delete(roomId);
  } else {
    roomUsers.set(
      roomId,
      updatedUsers
    );
  }

  socket.currentRoom = null;
}

// =================================
// EMIT USERS
// =================================

function emitRoomUsers(roomId) {
  const users =
    roomUsers.get(roomId) || [];

  io.to(roomId).emit(
    "room-users",
    {
      room: roomId,

      users: users.map((user) => ({
        socketId: user.socketId,
        username: user.username,
      })),
    }
  );
}

export default server;