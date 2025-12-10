import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import aiRoutes from "./src/routes/aiRoutes.js";
import commandRoutes from "./src/routes/commandRoutes.js";
import ngrok from "ngrok";
import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === CONFIG ===
const SHARE_DIR = process.env.SHARE_DIR || path.resolve("./shared");
const API_KEY = "aansh";

// === Trust proxy for ngrok ===
app.set('trust proxy', 1);

// Create shared directory if missing
if (!fs.existsSync(SHARE_DIR)) {
  fs.mkdirSync(SHARE_DIR, { recursive: true });
  console.log(`✅ Created shared directory: ${SHARE_DIR}`);
} else {
  const stats = fs.statSync(SHARE_DIR);
  if (!stats.isDirectory()) {
    console.log(`⚠️  SHARE_DIR exists but is not a directory. Renaming...`);
    const backupPath = SHARE_DIR + '.backup';
    fs.renameSync(SHARE_DIR, backupPath);
    fs.mkdirSync(SHARE_DIR, { recursive: true });
    console.log(`✅ Created new shared directory and backed up old file to: ${backupPath}`);
  }
}

// ----------------------
// Middleware
// ----------------------
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "x-api-key"],
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("combined"));

// === Rate limiting ===
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later" },
  validate: { 
    trustProxy: false,
    xForwardedForHeader: false
  }
});
app.use(limiter);

// Serve static files
app.use(express.static(__dirname));

// === AUTH MIDDLEWARE ===
function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"] || req.query.api_key;
  
  const isWebRequest = req.headers['user-agent']?.includes('Mozilla') || 
                      req.headers['sec-fetch-site'] === 'same-origin' ||
                      req.path === '/' || 
                      req.path === '/index.html' ||
                      req.headers['referer']?.includes(req.headers['host']);
  
  if (isWebRequest) {
    return next();
  }
  
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing API key" });
  }
  next();
}

// === HELPERS ===
function safeJoin(base, target = "") {
  if (!target) return base;
  
  let decodedTarget = target;
  try {
    decodedTarget = decodeURIComponent(target);
  } catch (e) {
    console.log('Path decoding failed, using original:', target);
  }
  
  const normalizedTarget = path.normalize(decodedTarget);
  const resolved = path.resolve(base, normalizedTarget);
  
  if (!resolved.startsWith(path.resolve(base))) {
    console.log('Path traversal detected:', {
      base: path.resolve(base),
      target: decodedTarget,
      normalized: normalizedTarget,
      resolved: resolved
    });
    throw new Error("Invalid path: Path traversal detected");
  }
  
  return resolved;
}

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  
  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) {
    throw new Error(`Path exists but is not a directory: ${dirPath}`);
  }
  
  return true;
}

// === FILE UPLOAD CONFIGURATION ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmpDir = path.join(SHARE_DIR, "tmp");
    ensureDirectoryExists(tmpDir);
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + "-" + cleanName);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024,
    fieldSize: 100 * 1024 * 1024
  }
});

// Increase timeout for upload routes
app.use('/upload', (req, res, next) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  next();
});

app.use('/upload-chunk', (req, res, next) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  next();
});

// ----------------------
// Routes (Existing + New)
// ----------------------
app.use("/api/ai", aiRoutes);
app.use("/", commandRoutes);

// === COMMAND ROUTES (From server.js 1) ===
app.post("/runCommand", requireApiKey, express.json(), (req, res) => {
  try {
    const { command, args = [] } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }

    console.log(`🔧 Running command: ${command}`, args);
    
    // Simple command execution - in production, you'd want to sanitize commands
    const allowedCommands = ['ls', 'pwd', 'whoami', 'date', 'echo'];
    
    if (!allowedCommands.includes(command)) {
      return res.status(400).json({ error: "Command not allowed" });
    }

    // For demo purposes - in real app, use child_process exec safely
    let result = '';
    
    switch(command) {
      case 'ls':
        result = fs.readdirSync(SHARE_DIR).join('\n');
        break;
      case 'pwd':
        result = process.cwd();
        break;
      case 'whoami':
        result = 'server-user';
        break;
      case 'date':
        result = new Date().toString();
        break;
      case 'echo':
        result = args.join(' ');
        break;
      default:
        result = 'Command executed';
    }
    
    res.json({
      success: true,
      command: command,
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("Error running command:", err);
    res.status(500).json({ error: err.message });
  }
});

// === AI ROUTES (Basic implementation) ===
app.post("/api/ai/process", requireApiKey, express.json(), (req, res) => {
  try {
    const { prompt, type = 'text' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log(`🤖 AI Processing (${type}):`, prompt);
    
    // Mock AI response - replace with actual AI service
    const mockResponses = {
      text: `AI Response to: "${prompt}" - This is a mock response.`,
      image: `Image generated for: "${prompt}"`,
      voice: `Voice processing for: "${prompt}"`
    };
    
    res.json({
      success: true,
      type: type,
      prompt: prompt,
      response: mockResponses[type] || mockResponses.text,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("Error in AI processing:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/voice/process", requireApiKey, express.json(), (req, res) => {
  try {
    const { audio, command } = req.body;
    
    console.log(`🔊 Voice Processing:`, command || 'Audio data received');
    
    // Mock voice processing
    res.json({
      success: true,
      command: command || 'voice_command',
      text: command || 'Voice command processed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("Error in voice processing:", err);
    res.status(500).json({ error: err.message });
  }
});

// === FILE SHARING API ENDPOINTS ===

// 🗂️ List files and folders
app.get("/files", requireApiKey, (req, res) => {
  try {
    const requestedPath = req.query.path || "";
    const targetPath = safeJoin(SHARE_DIR, requestedPath);

    ensureDirectoryExists(SHARE_DIR);
    
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: "Path not found" });
    }

    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: "Requested path is not a directory" });
    }

    const items = fs.readdirSync(targetPath, { withFileTypes: true });
    
    const files = items.map((item) => ({
      name: item.name,
      isDirectory: item.isDirectory(),
      size: item.isDirectory() ? null : fs.statSync(path.join(targetPath, item.name)).size,
      modified: fs.statSync(path.join(targetPath, item.name)).mtime,
    }));

    res.json(files);
  } catch (err) {
    console.error("Error listing files:", err);
    
    if (err.code === 'ENOTDIR') {
      return res.status(400).json({ error: "Requested path is not a directory" });
    } else if (err.code === 'ENOENT') {
      return res.status(404).json({ error: "Path not found" });
    }
    
    res.status(400).json({ error: err.message });
  }
});

// 📥 Download file
app.get("/download", requireApiKey, (req, res) => {
  try {
    const fileName = req.query.file;
    if (!fileName) {
      return res.status(400).json({ error: "file parameter required" });
    }

    const filePath = safeJoin(SHARE_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    if (fs.lstatSync(filePath).isDirectory()) {
      return res.status(400).json({ error: "Cannot download a directory" });
    }

    res.download(filePath);
  } catch (err) {
    console.error("Error downloading file:", err);
    res.status(400).json({ error: err.message });
  }
});

// 👁️ View file
app.get("/view", requireApiKey, (req, res) => {
  try {
    const fileName = req.query.file;
    if (!fileName) {
      return res.status(400).json({ error: "file parameter required" });
    }

    const filePath = safeJoin(SHARE_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    if (fs.lstatSync(filePath).isDirectory()) {
      return res.status(400).json({ error: "Cannot view a directory" });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.gif': 'image/gif',
      '.webp': 'image/webp', '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4', '.webm': 'video/webm',
      '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
      '.txt': 'text/plain', '.html': 'text/html',
      '.css': 'text/css', '.js': 'application/javascript',
      '.json': 'application/json', '.xml': 'application/xml'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.sendFile(filePath);
  } catch (err) {
    console.error("Error viewing file:", err);
    res.status(400).json({ error: err.message });
  }
});

// 📤 Upload file
app.post("/upload", requireApiKey, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded or file too large" });
    }

    const file = req.file;
    let destName = req.body.name || file.originalname;
    
    destName = destName.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
    
    let currentPath = req.body.currentPath || "";
    if (currentPath) {
      destName = `${currentPath}/${path.basename(destName)}`;
    }

    const destPath = safeJoin(SHARE_DIR, destName);

    const destDir = path.dirname(destPath);
    ensureDirectoryExists(destDir);

    fs.renameSync(file.path, destPath);
    
    console.log(`✅ File uploaded: ${destName} (${file.size} bytes)`);
    res.json({ 
      ok: true, 
      name: destName,
      size: file.size,
      uploadedAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("Error uploading file:", err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    let errorMessage = err.message;
    let statusCode = 500;
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'File too large. Maximum size is 100MB.';
      statusCode = 413;
    }
    
    res.status(statusCode).json({ error: errorMessage });
  }
});

// 🗑️ Delete file or folder
app.delete("/file", requireApiKey, (req, res) => {
  try {
    const fileName = req.query.file;
    if (!fileName) {
      return res.status(400).json({ error: "file parameter required" });
    }

    const filePath = safeJoin(SHARE_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File or folder not found" });
    }

    const stats = fs.lstatSync(filePath);
    
    if (stats.isDirectory()) {
      deleteFolderRecursive(filePath);
      console.log(`🗑️ Deleted folder: ${fileName}`);
    } else {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${fileName}`);
    }

    res.json({ ok: true, deleted: fileName });
  } catch (err) {
    console.error("Error deleting:", err);
    res.status(400).json({ error: err.message });
  }
});

// 🏠 Root route
app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

let publicUrl = null;

// Endpoint to fetch public ngrok URL
app.get("/api/url", (req, res) => {
  res.json({ url: publicUrl });
});

// ----------------------
// NGROK v3 — correct implementation
// ----------------------
async function startNgrok() {
  try {
    console.log("🚀 Starting ngrok...");

    // Kill all running tunnels first
    await ngrok.kill();

    const url = await ngrok.connect({
      addr: PORT,
      authtoken: process.env.NGROK_TOKEN,
      proto: "http",
      region: "in"
    });

    publicUrl = url;
    console.log("🌍 NGROK URL:", publicUrl);

  } catch (err) {
    console.error("❌ NGROK ERROR:", err.message);
  }
}

// ----------------------
// Health Check (Enhanced)
// ----------------------
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    services: {
      voiceAI: "active",
      multiTechStack: "active",
      fileSharing: "active",
      commandExecution: "active",
      ngrok: publicUrl ? "active" : "inactive",
      timestamp: new Date().toISOString()
    }
  });
});

// ----------------------
// WebSocket Setup (Enhanced)
// ----------------------
const server = createServer(app);
const wss = new WebSocketServer({ server });

global.wsClients = new Set();

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
  global.wsClients.add(ws);

  ws.on("close", () => {
    global.wsClients.delete(ws);
    console.log("WebSocket client disconnected");
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "voice_command") {
        console.log("🎤 Voice command:", data.command);
        // Broadcast to all connected clients
        global.wsClients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'voice_update',
              command: data.command,
              timestamp: new Date().toISOString()
            }));
          }
        });
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  });
});

// Clean up temporary files on startup
function cleanupTempFiles() {
  const tmpDir = path.join(SHARE_DIR, "tmp");
  if (fs.existsSync(tmpDir)) {
    console.log('Cleaning up temporary files...');
    deleteFolderRecursive(tmpDir);
    fs.mkdirSync(tmpDir, { recursive: true });
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 100MB.' });
  }
  
  res.status(500).json({ error: "Internal server error" });
});

// ----------------------
// Start Server + Ngrok
// ----------------------
const startServer = async () => {
  // Clean up temp files before starting
  cleanupTempFiles();

  server.listen(PORT, async () => {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🔥 Server running at http://localhost:${PORT}`);
    console.log(`📂 File Sharing: ${SHARE_DIR}`);
    console.log(`🔑 API Key: ${API_KEY} (Web access allowed)`);
    console.log(`⚡ Commands: http://localhost:${PORT}/runCommand`);
    console.log(`🧠 AI API: http://localhost:${PORT}/api/ai`);
    console.log(`📁 File operations: Upload, Download, View, Delete`);
    console.log(`💾 Max file size: 100MB`);
    console.log("⏳ Initializing ngrok...");

    await startNgrok();

    if (!publicUrl) {
      console.log("❌ NGROK failed to start. Check your token.");
      return;
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🚀 NGROK Ready: ${publicUrl}`);
    console.log(`⚡ Commands: ${publicUrl}/runcommand`);
    console.log(`🧠 AI API: ${publicUrl}/api/ai`);
    console.log(`📁 File Sharing: ${publicUrl}/files`);
    console.log(`🌐 WebSocket active`);
    console.log(`${"=".repeat(50)}\n`);

    console.log(`💡 Mobile App Instructions:`);
    console.log(`   1. Copy ngrok URL and paste in React Native app`);
    console.log(`   2. App will open browser with file browser`);
  });
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  cleanupTempFiles();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  cleanupTempFiles();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

startServer();

export default app;