// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import { createServer } from "http";
// import { Server } from "socket.io";
// import cors from "cors";
// import path from "path";
// import fs from "fs";

// import { PrismaClient } from "./generated/prisma/index.js";
// import anprService from "./services/anprService.js";
// const prisma = new PrismaClient();

// const app = express();
// const server = createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*" },
// }); 

// // Fix __dirname in ES modules
// const __dirname = path.resolve();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Health check route
// app.get("/api/health", (req, res) => {
//   res.json({ status: "OK", timestamp: new Date().toISOString() });
// });

// // WebSocket
// io.on("connection", (socket) => {
//   console.log("Client connected:", socket.id);

//   socket.emit("status", { message: "ANPR Backend Ready" });

//   socket.on("disconnect", () => {
//     console.log("Client disconnected:", socket.id);
//   });
// });


// // Test ANPR route
// app.post("/api/test-anpr", async (req, res) => {
//     console.log(req.body)
//   const { imagePath = "./test.jpeg", cameraId = 1 } = req.body;
//   const absolutePath = path.resolve(imagePath);

// console.log("Resolved path:", absolutePath);
// console.log(fs.existsSync(absolutePath)); 
// console.log(fs.existsSync(imagePath))
// // const imagePath = path.join(__dirname, "../test.jpg");

//   if (!imagePath || !fs.existsSync(absolutePath)) {
//     return res.status(400).json({ error: "Image path required and must exist" });
//   }

//   try {
//     const result = await anprService.processFrame(imagePath, cameraId);

//     if (result) {
//       console.log("Test Detection:", result);
//       return res.json({ success: true, ...result });
//     }

//     res.json({ success: false, message: "No plate detected" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Error processing image" });
//   }
// });

// // Paginated detections route
// app.get("/api/detections", async (req, res) => {
//   const page = parseInt(req.query.page ?? 1);
//   const limit = parseInt(req.query.limit ?? 10);
//   const skip = (page - 1) * limit;

//   try {
//     const detections = await prisma.detection.findMany({
//       take: limit,
//       skip,
//       include: { camera: true },
//       orderBy: { timestamp: "desc" },
//     });

//     res.json(detections);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch detections" });
//   }
// });

// // Graceful shutdown
// process.on("SIGINT", async () => {
//   await prisma.$disconnect();
//   server.close(() => process.exit(0));
// });

// // Start server
// const PORT = process.env.PORT || 5000;

// server.listen(PORT, () => {
//   console.log(`🚀 ANPR Server running on http://localhost:${PORT}`);
// });
// src/index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";

import prisma from "./db.js";
import anprService from "./services/anprService.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// ES module __dirname substitute
const __dirname = path.resolve();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// WebSocket
let connectedClients = new Set();
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  connectedClients.add(socket);

  socket.emit("status", { message: "ANPR Backend Ready" });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    connectedClients.delete(socket);
  });
});

// Test ANPR route
app.post("/api/test-anpr", async (req, res) => {
  const { imagePath = "./test.jpeg", cameraId = 1 } = req.body || {};

  const absolutePath = path.resolve(imagePath);
  console.log("Resolved path:", absolutePath);
  console.log("exists(abs):", fs.existsSync(absolutePath));
  console.log("exists(raw):", fs.existsSync(imagePath));

  if (!imagePath || !fs.existsSync(absolutePath)) {
    return res
      .status(400)
      .json({ error: "Image path required and must exist" });
  }

  try {
    const result = await anprService.processFrame(absolutePath, cameraId);

    if (result) {
      console.log("Test Detection:", result);
      return res.json({ success: true, ...result });
    }

    res.json({ success: false, message: "No plate detected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error processing image" });
  }
});

// Upload Image for ANPR Processing
app.post("/api/upload", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const { cameraId = 1 } = req.body;
    const imagePath = req.file.path;

    console.log("📸 Processing uploaded image:", req.file.filename);

    // Process the image through ANPR
    const result = await anprService.processFrame(imagePath, cameraId);

    if (result) {
      // Emit real-time update to all connected clients
      for (const client of connectedClients) {
        client.emit('new-detection', result);
      }

      console.log("✅ Upload processed successfully:", result.plateNumber);

      return res.json({
        success: true,
        message: result.blacklistFlag ?
          `⚠️ ALERT: Blacklisted plate detected - ${result.plateNumber}` :
          `Plate detected: ${result.plateNumber}`,
        ...result
      });
    }

    // Clean up uploaded file if no plate detected
    fs.unlinkSync(imagePath);

    res.json({
      success: false,
      message: "No plate detected in the uploaded image"
    });
  } catch (err) {
    console.error("Upload error:", err);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: "Error processing uploaded image" });
  }
});

// Enhanced Detections Route with Filtering
app.get("/api/detections", async (req, res) => {
  const page = parseInt(req.query.page ?? 1, 10);
  const limit = parseInt(req.query.limit ?? 20, 10);
  const skip = (page - 1) * limit;

  const { plate, startDate, endDate, blacklisted, cameraId } = req.query;

  const where = {};

  if (plate) {
    where.plateNumber = { contains: plate, mode: 'insensitive' };
  }

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  if (blacklisted !== undefined) {
    where.blacklistFlag = blacklisted === 'true';
  }

  if (cameraId) {
    where.cameraId = parseInt(cameraId);
  }

  try {
    const [detections, total] = await Promise.all([
      prisma.detection.findMany({
        take: limit,
        skip,
        where,
        include: { camera: true, blacklist: true },
        orderBy: { timestamp: "desc" },
      }),
      prisma.detection.count({ where }),
    ]);

    res.json({
      data: detections,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch detections" });
  }
});

// Stats Route
app.get("/api/stats", async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfHour = new Date();
    startOfHour.setMinutes(0, 0, 0);

    const [totalDetections, blacklistedCount, todayCount, recentAlerts] = await Promise.all([
      prisma.detection.count(),
      prisma.detection.count({ where: { blacklistFlag: true } }),
      prisma.detection.count({ where: { timestamp: { gte: startOfDay } } }),
      prisma.detection.findMany({
        where: { blacklistFlag: true },
        take: 5,
        orderBy: { timestamp: "desc" },
      }),
    ]);

    // Hourly stats for chart (last 24 hours)
    // This is a simplified version. For production, use raw SQL or proper aggregation.
    const last24Hours = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
    const hourlyData = await prisma.detection.groupBy({
      by: ['timestamp'],
      where: { timestamp: { gte: last24Hours } },
      _count: { id: true },
    });

    // Process hourly data in JS (since Prisma groupBy date truncation is tricky without raw SQL)
    // Or just return raw counts for now and let frontend handle or mock for demo

    res.json({
      totalDetections,
      blacklistedCount,
      todayCount,
      recentAlerts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Blacklist Routes
app.get("/api/blacklist", async (req, res) => {
  try {
    const blacklist = await prisma.blacklist.findMany({
      orderBy: { addedAt: "desc" },
    });
    res.json(blacklist);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blacklist" });
  }
});

app.post("/api/blacklist", async (req, res) => {
  const { plateNumber, notes } = req.body;
  if (!plateNumber) return res.status(400).json({ error: "Plate number required" });

  try {
    const entry = await prisma.blacklist.create({
      data: {
        plateNumber: plateNumber.toUpperCase(),
        notes,
      },
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: "Failed to add to blacklist" });
  }
});

app.delete("/api/blacklist/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.blacklist.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove from blacklist" });
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 ANPR Server running on http://localhost:${PORT}`);
});
