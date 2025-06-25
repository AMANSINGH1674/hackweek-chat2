import type { NextRequest } from "next/server"
import { Server as NetServer } from "http"
import { Server as SocketIOServer } from "socket.io"

// Store messages and users in memory (use database in production)
let messages: any[] = []
const users = new Map()

// Global Socket.IO server instance
let io: SocketIOServer | null = null

export async function GET(req: NextRequest) {
  if (!io) {
    console.log("*First use, starting Socket.IO server...")

    const httpServer = new NetServer()
    io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

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
        io?.emit("userJoined", {
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
          io?.emit("message", message)

          console.log(`💬 Message from ${user.username}: ${text}`)
        }
      })

      // Handle user disconnection
      socket.on("disconnect", (reason) => {
        const user = users.get(socket.id)
        if (user) {
          users.delete(socket.id)

          // Notify all users about user leaving
          io?.emit("userLeft", {
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

    // Start the HTTP server
    const port = 3001
    httpServer.listen(port, () => {
      console.log(`🚀 Socket.IO server running on port ${port}`)
    })

    console.log("✅ Socket.IO server initialized")
  }

  return new Response("Socket.IO server is running", { status: 200 })
}
