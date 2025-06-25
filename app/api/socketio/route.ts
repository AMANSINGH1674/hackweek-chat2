import { type NextRequest, NextResponse } from "next/server"
import { Server } from "socket.io"

// This is a simpler approach using Next.js API routes
let io: Server | null = null
const messages: any[] = []
const users = new Map()

export async function GET(request: NextRequest) {
  if (!io) {
    // Initialize Socket.IO server
    const { createServer } = await import("http")
    const server = createServer()

    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      socket.on("join", (username) => {
        const user = { id: socket.id, username }
        users.set(socket.id, user)

        socket.emit("messageHistory", messages)
        io?.emit("userJoined", { user, users: Array.from(users.values()) })
      })

      socket.on("message", (text) => {
        const user = users.get(socket.id)
        if (user) {
          const message = {
            id: Date.now().toString(),
            username: user.username,
            text,
            timestamp: new Date(),
            userId: socket.id,
          }
          messages.push(message)
          io?.emit("message", message)
        }
      })

      socket.on("disconnect", () => {
        const user = users.get(socket.id)
        if (user) {
          users.delete(socket.id)
          io?.emit("userLeft", { user, users: Array.from(users.values()) })
        }
      })
    })

    server.listen(3001)
  }

  return NextResponse.json({ status: "Socket.IO server running" })
}
