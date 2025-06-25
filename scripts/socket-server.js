import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"

const app = express()
const server = createServer(app)

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
})

app.use(cors())
app.use(express.json())

// Store messages and users in memory
let messages = []
const users = new Map()

console.log("🚀 Starting Socket.IO server...")

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

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`)
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`)
  console.log(`🌐 CORS enabled for: http://localhost:3000`)
  console.log(`👥 Ready for connections!`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  server.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})

// Handle process interruption
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully")
  server.close(() => {
    console.log("✅ Server closed")
    process.exit(0)
  })
})
