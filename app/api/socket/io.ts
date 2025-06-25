import type { NextApiRequest, NextApiResponse } from "next"
import { Server as SocketIOServer } from "socket.io"

export const config = {
  api: {
    bodyParser: false,
  },
}

// Store messages and users in memory
let messages: any[] = []
const users = new Map()

const SocketHandler = (req: NextApiRequest, res: NextApiResponse & { socket: any }) => {
  if (res.socket.server.io) {
    console.log("Socket is already running")
  } else {
    console.log("Socket is initializing")
    const io = new SocketIOServer(res.socket.server)
    res.socket.server.io = io

    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`)

      socket.on("join", (username) => {
        const user = {
          id: socket.id,
          username: username,
        }

        users.set(socket.id, user)
        socket.emit("messageHistory", messages)
        io.emit("userJoined", {
          user: user,
          users: Array.from(users.values()),
        })
      })

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

          messages.push(message)
          if (messages.length > 100) {
            messages = messages.slice(-100)
          }

          io.emit("message", message)
        }
      })

      socket.on("disconnect", () => {
        const user = users.get(socket.id)
        if (user) {
          users.delete(socket.id)
          io.emit("userLeft", {
            user: user,
            users: Array.from(users.values()),
          })
        }
      })
    })
  }
  res.end()
}

export default SocketHandler
