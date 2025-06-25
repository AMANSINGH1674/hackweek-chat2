"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function DebugConnection() {
  const [serverStatus, setServerStatus] = useState<string>("Not tested")
  const [socketStatus, setSocketStatus] = useState<string>("Not tested")
  const [isLoading, setIsLoading] = useState(false)
  const [serverResponse, setServerResponse] = useState<any>(null)
  const [socketError, setSocketError] = useState<string>("")

  const testServerHealth = async () => {
    setIsLoading(true)
    try {
      console.log("Testing server health...")
      const response = await fetch("https://hackweek-chat2.onrender.com/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setServerResponse(data)
        setServerStatus("✅ Server is running")
        console.log("Server response:", data)
      } else {
        setServerStatus(`❌ Server error: ${response.status}`)
        console.error("Server error:", response.status, response.statusText)
      }
    } catch (error) {
      setServerStatus(`❌ Server unreachable: ${error}`)
      console.error("Server test failed:", error)
    }
    setIsLoading(false)
  }

  const testSocketConnection = async () => {
    setIsLoading(true)
    setSocketError("")

    try {
      console.log("Testing Socket.IO connection...")

      // Import socket.io-client dynamically
      const { io } = await import("socket.io-client")

      const socket = io("https://hackweek-chat2.onrender.com", {
        transports: ["websocket", "polling"],
        timeout: 10000,
        forceNew: true,
      })

      socket.on("connect", () => {
        console.log("✅ Socket.IO connected:", socket.id)
        setSocketStatus("✅ Socket.IO connection successful")
        socket.disconnect()
        setIsLoading(false)
      })

      socket.on("connect_error", (error) => {
        console.error("❌ Socket.IO connection failed:", error)
        setSocketStatus("❌ Socket.IO connection failed")
        setSocketError(error.message)
        setIsLoading(false)
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        if (socket.connected === false) {
          setSocketStatus("❌ Socket.IO connection timeout")
          setSocketError("Connection timed out after 10 seconds")
          socket.disconnect()
          setIsLoading(false)
        }
      }, 10000)
    } catch (error) {
      console.error("Socket test error:", error)
      setSocketStatus(`❌ Socket test failed: ${error}`)
      setIsLoading(false)
    }
  }

  const testBoth = async () => {
    await testServerHealth()
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
    await testSocketConnection()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            Connection Debugger
          </CardTitle>
          <p className="text-sm text-muted-foreground">Let's figure out what's wrong with the connection</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Server Health Test */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">1. Server Health Check</h3>
              <Button onClick={testServerHealth} disabled={isLoading} size="sm">
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Test Server"}
              </Button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-mono">{serverStatus}</p>
              {serverResponse && (
                <pre className="text-xs mt-2 p-2 bg-white rounded border overflow-auto">
                  {JSON.stringify(serverResponse, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Socket.IO Test */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">2. Socket.IO Connection Test</h3>
              <Button onClick={testSocketConnection} disabled={isLoading} size="sm">
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Test Socket"}
              </Button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-mono">{socketStatus}</p>
              {socketError && <p className="text-xs text-red-600 mt-1">{socketError}</p>}
            </div>
          </div>

          {/* Test Both */}
          <div className="pt-4 border-t">
            <Button onClick={testBoth} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Run Full Diagnostic"
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-2">Troubleshooting Steps:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>First test should show server is running</li>
              <li>Second test should show Socket.IO can connect</li>
              <li>If server test fails, your Render service might be down</li>
              <li>If socket test fails, there's a Socket.IO configuration issue</li>
            </ol>
          </div>

          {/* Server URL */}
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              Server: https://hackweek-chat2.onrender.com
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
