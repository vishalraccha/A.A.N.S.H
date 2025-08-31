import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// WebSocket Connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Listen for voice/text commands from mobile
  socket.on("command", async (data) => {
    console.log("Received command:", data);

    // Example AI response (replace with OpenAI API call)
    const response = `You said: ${data}`;

    // Send back response
    socket.emit("response", response);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Nova AI Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
