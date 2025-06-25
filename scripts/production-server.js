import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);

// Get Render-assigned port
const PORT = process.env.PORT;
if (!PORT) throw new Error("PORT environment variable is not set");

// Allow CORS for your frontend domain and Vercel wildcard
const io = new Server(server, {
  cors: {
    origin: [
      "https://your-frontend-domain.vercel.app",
      /\.vercel\.app$/,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use(cors());
app.use(express.json());

// Optional health check
app.get("/", (req, res) => {
  res.json({ status: "OK", time: new Date().toISOString() });
});

// Socket state
let messages = [];
const users = new Map();

io.on("connection", (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  socket.on("join", (username) => {
    users.set(socket.id, { id: socket.id, username });
    socket.emit("messageHistory", messages);
    io.emit("userJoined", {
      user: users.get(socket.id),
      users: Array.from(users.values()),
    });
  });

  socket.on("message", (text) => {
    const user = users.get(socket.id);
    if (!user) return;
    const message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      username: user.username,
      text,
      timestamp: new Date(),
      userId: socket.id,
    };
    messages.push(message);
    if (messages.length > 100) messages = messages.slice(-100);
    io.emit("message", message);
  });

  socket.on("disconnect", (reason) => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      io.emit("userLeft", {
        user,
        users: Array.from(users.values()),
      });
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});
