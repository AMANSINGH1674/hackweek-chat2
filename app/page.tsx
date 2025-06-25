"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, Users, MessageCircle, Wifi, WifiOff, RefreshCw } from "lucide-react"
import DebugConnection from "./debug-connection"

interface Message {
  id: string
  username: string
  text: string
  timestamp: Date
  userId: string
}

interface User {
  id: string
  username: string
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [username, setUsername] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [hasJoined, setHasJoined] = useState(false)
  const [connectionError, setConnectionError] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showDebug, setShowDebug] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const connectToServer = () => {
    setIsConnecting(true)
    setConnectionError("")

    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect()
    }

    console.log("Attempting to connect to:", "https://hackweek-chat2.onrender.com")

    const newSocket = io("https://hackweek-chat2.onrender.com", {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on("connect", () => {
      console.log("✅ Connected to server:", newSocket.id)
      setIsConnected(true)
      setConnectionError("")
      setIsConnecting(false)
    })

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from server:", reason)
      setIsConnected(false)
      setIsConnecting(false)
    })

    newSocket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error)
      setConnectionError(`Connection failed: ${error.message}`)
      setIsConnected(false)
      setIsConnecting(false)
    })

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Reconnected after", attemptNumber, "attempts")
      setIsConnected(true)
      setConnectionError("")
    })

    newSocket.on("reconnect_error", (error) => {
      console.error("🔄 Reconnection failed:", error)
      setConnectionError("Reconnection failed")
    })

    newSocket.on("message", (message: Message) => {
      console.log("📨 Received message:", message)
      setMessages((prev) => [...prev, { ...message, timestamp: new Date(message.timestamp) }])
    })

    newSocket.on("messageHistory", (history: Message[]) => {
      console.log("📚 Received message history:", history)
      setMessages(history.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) })))
    })

    newSocket.on("userJoined", (data: { user: User; users: User[] }) => {
      console.log("👤 User joined:", data)
      setUsers(data.users)
      if (data.user.username !== username) {
        const systemMessage: Message = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          username: "System",
          text: `${data.user.username} joined the chat`,
          timestamp: new Date(),
          userId: "system",
        }
        setMessages((prev) => [...prev, systemMessage])
      }
    })

    newSocket.on("userLeft", (data: { user: User; users: User[] }) => {
      console.log("👋 User left:", data)
      setUsers(data.users)
      const systemMessage: Message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        username: "System",
        text: `${data.user.username} left the chat`,
        timestamp: new Date(),
        userId: "system",
      }
      setMessages((prev) => [...prev, systemMessage])
    })

    newSocket.on("users", (userList: User[]) => {
      console.log("👥 Updated user list:", userList)
      setUsers(userList)
    })

    setSocket(newSocket)
  }

  useEffect(() => {
    connectToServer()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const joinChat = () => {
    if (username.trim() && socket && isConnected) {
      console.log("🚪 Joining chat as:", username.trim())
      socket.emit("join", username.trim())
      setHasJoined(true)
      inputRef.current?.focus()
    }
  }

  const sendMessage = () => {
    if (newMessage.trim() && socket && hasJoined && isConnected) {
      console.log("📤 Sending message:", newMessage.trim())
      socket.emit("message", newMessage.trim())
      setNewMessage("")
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (hasJoined) {
        sendMessage()
      } else {
        joinChat()
      }
    }
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (showDebug) {
    return (
      <div>
        <DebugConnection />
        <div className="fixed bottom-4 right-4">
          <Button onClick={() => setShowDebug(false)} variant="outline">
            Skip to Chat
          </Button>
        </div>
      </div>
    )
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Join Chat Room
            </CardTitle>
            <p className="text-sm text-muted-foreground">Enter your username to start chatting</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={20}
                autoFocus
              />
            </div>
            <Button onClick={joinChat} className="w-full" disabled={!username.trim() || !isConnected}>
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : isConnected ? (
                "Join Chat"
              ) : (
                "Connection Failed"
              )}
            </Button>
            <div className="flex items-center justify-center gap-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnecting ? "bg-yellow-500" : isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              {isConnecting ? (
                <span className="text-yellow-600">Connecting...</span>
              ) : isConnected ? (
                <span className="text-green-600">Connected to server</span>
              ) : (
                <span className="text-red-600">Disconnected</span>
              )}
            </div>
            {connectionError && (
              <div className="text-xs text-center text-red-600 bg-red-50 p-3 rounded border border-red-200">
                <p className="font-medium">Connection Error:</p>
                <p>{connectionError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connectToServer}
                  className="mt-2 text-xs"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry Connection
                    </>
                  )}
                </Button>
              </div>
            )}
            <div className="text-xs text-center text-muted-foreground bg-green-50 p-2 rounded">
              🌐 Ready for multi-user chat!
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-2rem)]">
        {/* Users Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Online Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-2">
                {users.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No users online</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        user.username === username ? "bg-blue-100 border border-blue-200" : "bg-gray-50"
                      }`}
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium">
                        {user.username}
                        {user.username === username && " (You)"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Real-Time Chat Room
              </div>
              <Badge
                variant="outline"
                className={`${
                  isConnected ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <ScrollArea className="flex-1 mb-4 border rounded-lg p-4 bg-white">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col space-y-1 ${
                        message.userId === "system"
                          ? "items-center"
                          : message.username === username
                            ? "items-end"
                            : "items-start"
                      }`}
                    >
                      {message.userId === "system" ? (
                        <div className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
                          {message.text}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{message.username}</span>
                            <span>{formatTime(message.timestamp)}</span>
                          </div>
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.username === username ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {message.text}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={isConnected ? "Type your message..." : "Connecting..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!isConnected}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim() || !isConnected} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {!isConnected && (
              <div className="text-xs text-center text-red-600 mt-2 bg-red-50 p-2 rounded">
                Connection lost. Check server status or try refreshing.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="fixed bottom-4 right-4">
        <Button onClick={() => setShowDebug(true)} variant="outline" size="sm">
          Debug Connection
        </Button>
      </div>
    </div>
  )
}
