import axios from "axios";
import FormData from "form-data";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ANPRService {
  async processFrame(imagePath, cameraId) {
    try {
      console.log("🚀 Starting ANPR process via Python backend for:", imagePath);

      // 1. Check file existence
      await fs.access(imagePath);

      // 2. Prepare form data
      const form = new FormData();
      const fileBuffer = await fs.readFile(imagePath);
      form.append("file", fileBuffer, { filename: path.basename(imagePath) });

      // 3. Call Python API
      console.log("📡 Sending request to Python backend (http://localhost:8000/detect)...");
      let response;
      try {
        response = await axios.post("http://localhost:8000/detect", form, {
          headers: {
            ...form.getHeaders()
          }
        });
      } catch (apiError) {
        console.error("❌ Python API Error:", apiError.message);
        if (apiError.code === 'ECONNREFUSED') {
          console.error("⚠️ Is the Python server running? (uvicorn app:app --port 8000)");
        }
        return null;
      }

      const result = response.data;
      console.log("🐍 Python API Response:", result);

      // 4. Handle No Plate Detected
      if (result.message || !result.cleaned_text) {
        console.log("❌ No plate detected by Python backend");
        return null;
      }

      const plateText = result.cleaned_text;
      console.log("📝 Detected Plate:", plateText);

      // 5. Database & Blacklist Check

      // Check blacklist
      const blacklistEntry = await prisma.blacklist.findUnique({
        where: { plateNumber: plateText }
      });

      const isBlacklisted = !!blacklistEntry;

      // Save detection
      const filename = path.basename(imagePath);

      const detection = await prisma.detection.create({
        data: {
          plateNumber: plateText,
          cameraId: parseInt(cameraId),
          imagePath: filename,
          videoPath: null,
          blacklistFlag: isBlacklisted,
          blacklistId: blacklistEntry ? blacklistEntry.id : null
        }
      });

      console.log("✅ Detection saved:", detection.id, "Blacklisted:", isBlacklisted);

      return {
        ...detection,
        fullImagePath: filename,
        boundingBox: result.bounding_box
      };

    } catch (error) {
      console.error("💥 ANPR Service Error:", error);
      return null;
    }
  }
}

export default new ANPRService();
