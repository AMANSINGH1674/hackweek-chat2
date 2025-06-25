// This script will install the required dependencies
import { execSync } from "child_process"

console.log("Installing Socket.IO chat server dependencies...")

try {
  // Install dependencies
  execSync("npm install express socket.io cors", { stdio: "inherit" })
  console.log("✅ Dependencies installed successfully!")

  console.log("\n📦 Installed packages:")
  console.log("- express: Web framework for Node.js")
  console.log("- socket.io: Real-time bidirectional event-based communication")
  console.log("- cors: Cross-Origin Resource Sharing middleware")

  console.log("\n🚀 To start the server, run:")
  console.log("node server.js")
} catch (error) {
  console.error("❌ Failed to install dependencies:", error.message)
}
