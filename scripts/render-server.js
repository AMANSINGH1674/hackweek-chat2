import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"

const app = express()
const server = createServer(app)

// Get the port from environment (Render provides this)
const PORT = process.env.PORT || 3001

console.log("🚀 Starting Socket.IO server...")
console.log("📍 Port:", PORT)
console.log("🌍 Environment:", process.env.NODE_ENV || "development")

// Configure CORS to allow all origins for now (you can restrict this later)
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST"],
    credentials: false,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true, // Allow Engine.IO v3 clients
})

// Enable CORS for Express routes too
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  }),
)

app.use(express.json())

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Socket.IO Chat Server is running",
    timestamp: new Date().toISOString(),
    port: PORT,
    users: users.size,
    messages: messages.length,
  })
})

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// Store messages and users in memory
let messages = []
const users = new Map()

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`)

  // Handle user joining
  socket.on("join", (username) => {
    console.log(`👤 ${username} joining chat...`)

    const user = {
      id: socket.id,
      username: username,
    }

    users.set(socket.id, user)

    // Send message history to the new user
    socket.emit("messageHistory", messages)

    // Notify all users about the new user
    io.emit("userJoined", {
      user: user,
      users: Array.from(users.values()),
    })

    console.log(`✅ ${username} joined the chat. Total users: ${users.size}`)
  })

  // Handle new messages
  socket.on("message", (text) => {
    const user = users.get(socket.id)
    if (user) {
      const message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        username: user.username,
        text: text,
        timestamp: new Date(),
        userId: socket.id,
      }

      // Store message
      messages.push(message)

      // Keep only last 100 messages
      if (messages.length > 100) {
        messages = messages.slice(-100)
      }

      // Broadcast message to all connected clients
      io.emit("message", message)

      console.log(`💬 Message from ${user.username}: ${text}`)
    }
  })

  // Handle user disconnection
  socket.on("disconnect", (reason) => {
    const user = users.get(socket.id)
    if (user) {
      users.delete(socket.id)

      // Notify all users about user leaving
      io.emit("userLeft", {
        user: user,
        users: Array.from(users.values()),
      })

      console.log(`❌ ${user.username} left the chat. Reason: ${reason}. Total users: ${users.size}`)
    }
  })

  // Handle connection errors
  socket.on("error", (error) => {
    console.error("❌ Socket error:", error)
  })
})

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`)
  console.log(`🌐 Server URL: https://hackweek-chat2.onrender.com`)
  console.log(`👥 Ready for connections!`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  server.close(() => {
    console.log("✅ Server closed")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully")
  server.close(() => {
    console.log("✅ Server closed")
    process.exit(0)
  })
})

// Keep the server alive (prevent sleeping on free tier)
setInterval(() => {
  console.log(`💓 Server heartbeat - Users: ${users.size}, Messages: ${messages.length}`)
}, 300000) // Every 5 minutes
