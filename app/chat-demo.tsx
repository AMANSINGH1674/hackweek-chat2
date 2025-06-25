"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, Users, MessageCircle, Bot } from "lucide-react"

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

// Simulate other users for demonstration
const simulatedUsers = ["Alice", "Bob", "Charlie", "Diana"]
const botResponses = [
  "That's interesting!",
  "I agree with that point.",
  "Thanks for sharing!",
  "Great question!",
  "I was thinking the same thing.",
  "That makes sense.",
  "Good point!",
  "I hadn't considered that.",
]

export default function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [username, setUsername] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [hasJoined, setHasJoined] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Simulate connection
    const timer = setTimeout(() => {
      setIsConnected(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (hasJoined) {
      // Add welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        username: "System",
        text: `Welcome to the chat room! This is a demo showing bidirectional messaging.`,
        timestamp: new Date(),
        userId: "system",
      }
      setMessages([welcomeMessage])

      // Simulate other users joining
      const otherUsers = simulatedUsers.slice(0, Math.floor(Math.random() * 3) + 1).map((name, index) => ({
        id: `user-${index}`,
        username: name,
      }))

      setUsers([{ id: "current-user", username }, ...otherUsers])

      // Simulate periodic messages from other users
      const messageInterval = setInterval(
        () => {
          if (otherUsers.length > 0 && Math.random() > 0.7) {
            const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)]
            const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)]

            const simulatedMessage: Message = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              username: randomUser.username,
              text: randomResponse,
              timestamp: new Date(),
              userId: randomUser.id,
            }

            setMessages((prev) => [...prev, simulatedMessage])
          }
        },
        5000 + Math.random() * 10000,
      ) // Random interval between 5-15 seconds

      return () => clearInterval(messageInterval)
    }
  }, [hasJoined, username])

  const joinChat = () => {
    if (username.trim() && isConnected) {
      setHasJoined(true)
      inputRef.current?.focus()
    }
  }

  const sendMessage = () => {
    if (newMessage.trim() && hasJoined) {
      const message: Message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        username: username,
        text: newMessage.trim(),
        timestamp: new Date(),
        userId: "current-user",
      }

      setMessages((prev) => [...prev, message])
      setNewMessage("")
      inputRef.current?.focus()

      // Simulate responses from other users occasionally
      if (Math.random() > 0.6) {
        setTimeout(
          () => {
            const respondingUsers = users.filter((u) => u.id !== "current-user")
            if (respondingUsers.length > 0) {
              const randomUser = respondingUsers[Math.floor(Math.random() * respondingUsers.length)]
              const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)]

              const responseMessage: Message = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                username: randomUser.username,
                text: randomResponse,
                timestamp: new Date(),
                userId: randomUser.id,
              }

              setMessages((prev) => [...prev, responseMessage])
            }
          },
          1000 + Math.random() * 3000,
        )
      }
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

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Join Chat Room Demo
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your username to start chatting (Demo with simulated users)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={20}
              />
            </div>
            <Button onClick={joinChat} className="w-full" disabled={!username.trim() || !isConnected}>
              {isConnected ? "Join Chat" : "Connecting..."}
            </Button>
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              {isConnected ? "Connected" : "Connecting..."}
            </div>
            <div className="text-xs text-center text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <Bot className="h-4 w-4 mx-auto mb-1" />
              This is a demo with simulated users to show bidirectional messaging
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
                {users.map((user) => (
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
                      {user.id !== "current-user" && <Bot className="h-3 w-3 inline ml-1 text-gray-400" />}
                    </span>
                  </div>
                ))}
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
                Chat Room Demo
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connected (Demo)
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
                            <span className="font-medium">
                              {message.username}
                              {message.userId !== "current-user" && <Bot className="h-3 w-3 inline ml-1" />}
                            </span>
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
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-xs text-center text-muted-foreground mt-2 bg-blue-50 p-2 rounded">
              <Bot className="h-3 w-3 inline mr-1" />
              Demo mode: Simulated users will respond to demonstrate bidirectional messaging
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
