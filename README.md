# 🚗 ANPR System (Automatic Number Plate Recognition)

A complete, production-ready ANPR (Automatic Number Plate Recognition) system featuring:
- **Python AI Engine** (YOLOv8 + EasyOCR) for accurate plate detection and text recognition
- **Node.js Backend** (Express + Prisma + PostgreSQL) for API management and database operations
- **React Frontend** (Vite + Shadcn UI) for real-time monitoring and management

## ✨ Features

-  **Real-Time Detection**: Process images through YOLOv8 and EasyOCR pipeline
-  **Live Dashboard**: WebSocket-based real-time updates of detections
-  **Blacklist Management**: Flag vehicles and receive instant alerts
-  **Detection History**: Searchable logs with advanced filtering
-  **Analytics**: Operational insights with statistics and charts
-  **Modern UI**: Beautiful, responsive dashboard built with Shadcn UI

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  React Frontend │◄────►│  Node.js Backend │◄────►│ Python AI Engine│
│  (Port 5173)    │      │   (Port 5000)    │      │   (Port 8000)   │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │   PostgreSQL DB  │
                         └──────────────────┘
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.10 or higher) - [Download](https://www.python.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/)
- **npm** or **yarn** package manager

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "ANPR Systems"
```

### 2. Database Setup

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE anpr_db;

# Exit psql
\q
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
```

Create `.env`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/anpr_db?schema=public"
PORT=5000
```

**Replace `yourpassword` with your actual PostgreSQL password.**

#### Run Database Migrations

```bash
# Install backend dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 3. Python AI Engine Setup

```bash
# Navigate to root directory
cd ..

# Install Python dependencies
pip install -r requirements.txt
```

**Note**: First run will download YOLOv8 model (`yolov8n.pt`) and EasyOCR language models (~300MB total).

### 4. Node.js Backend Setup

```bash
cd backend

# Install dependencies (if not already done)
npm install
```

### 5. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

## 🎯 Running the Application

You'll need **3 terminal windows** to run all services:

### Terminal 1: Python AI Engine

```bash
# From root directory
python -m uvicorn app:app --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Terminal 2: Node.js Backend

```bash
cd backend
npm run dev
```

You should see:
```
🚀 ANPR Server running on http://localhost:5000
```

### Terminal 3: Frontend Dashboard

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v7.2.4  ready in XXX ms
➜  Local:   http://localhost:5173/
```

## 📱 Accessing the Application

Open your browser and navigate to:

**Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)

### Available Pages:

1. **Dashboard** - Real-time feed, statistics, and analytics
2. **History** - Searchable detection logs with filters
3. **Blacklist** - Manage blacklisted vehicles

## 🧪 Testing the System

### Method 1: Using Test Script

```bash
cd backend
node test-minimal.js
```

This will:
1. Send `test1.png` to the Python API
2. Process it through YOLO + OCR
3. Save the detection to the database
4. You'll see the result appear on the Dashboard in real-time!

### Method 2: Using Postman/API Testing Tool

#### Test Python API:
```bash
POST http://localhost:8000/detect
Body: form-data
  - file: [upload test1.png]
```

#### Test Node.js API:
```bash
GET http://localhost:5000/api/health
GET http://localhost:5000/api/stats
GET http://localhost:5000/api/detections
```

## 📊 Database Management

### View Database in Prisma Studio

```bash
cd backend
npx prisma studio
```

Opens a GUI at [http://localhost:5555](http://localhost:5555) to view/edit database records.

### Add a Blacklisted Plate

**Option 1**: Via Frontend
- Go to "Blacklist" page
- Enter plate number (e.g., "ABC123")
- Click "Add Vehicle"

**Option 2**: Via Prisma Studio
- Open Prisma Studio
- Go to "Blacklist" table
- Click "Add record"
- Fill in `plateNumber` and optional `notes`

## 🛠️ Troubleshooting

### Frontend Won't Load / Shows Errors

**Issue**: Tailwind CSS errors or blank page

**Solution**:
```bash
cd frontend

# Ensure correct Tailwind version
npm uninstall tailwindcss @tailwindcss/postcss
npm install -D tailwindcss@^3.4.0 postcss autoprefixer

# Restart dev server
npm run dev
```

### Python API Not Responding

**Issue**: `ECONNREFUSED http://localhost:8000`

**Solution**:
```bash
# Check if Python server is running
curl http://localhost:8000

# Restart Python server
python -m uvicorn app:app --port 8000 --reload
```

### Database Connection Errors

**Issue**: `Can't reach database server`

**Solution**:
1. Verify PostgreSQL is running
2. Check `.env` DATABASE_URL is correct
3. Ensure database `anpr_db` exists

```bash
# Test connection
psql -U postgres -d anpr_db
```

### Port Already in Use

**Issue**: `EADDRINUSE`

**Solution**:

**Windows**:
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**Linux/Mac**:
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9
```

## 📁 Project Structure

```
ANPR Systems/
├── app.py                  # Python FastAPI service
├── requirements.txt        # Python dependencies
├── yolov8n.pt             # YOLO model (downloaded on first run)
│
├── backend/
│   ├── src/
│   │   ├── index.js       # Express server & API routes
│   │   ├── db.js          # Prisma client singleton
│   │   └── services/
│   │       └── anprService.js  # ANPR logic (calls Python API)
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── .env               # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx        # Main app component
    │   ├── components/    # UI components
    │   ├── pages/         # Dashboard, History, Blacklist
    │   └── lib/           # Utilities (API client)
    ├── tailwind.config.js
    └── package.json
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/anpr_db?schema=public"
PORT=5000
```

### Modifying Detection Settings

Edit `app.py` to adjust YOLO/OCR parameters:

```python
# Line 12: Change YOLO model
model = YOLO("yolov8n.pt")  # Use yolov8s.pt for better accuracy

# Line 15: Change OCR language
reader = easyocr.Reader(['en'], gpu=False)  # Add 'hi' for Hindi
```

## 📝 API Endpoints

### Python API (Port 8000)
- `GET /` - Health check
- `POST /detect` - Upload image for detection

### Node.js API (Port 5000)
- `GET /api/health` - Health check
- `GET /api/stats` - Dashboard statistics
- `GET /api/detections?page=1&limit=20` - Paginated detections
  - Query params: `plate`, `startDate`, `endDate`, `blacklisted`, `cameraId`
- `GET /api/blacklist` - List blacklisted plates
- `POST /api/blacklist` - Add plate to blacklist
  - Body: `{ "plateNumber": "ABC123", "notes": "Reason" }`
- `DELETE /api/blacklist/:id` - Remove from blacklist

## 🎓 Usage Examples

### Adding Sample Detections

```javascript
// Use test-minimal.js or create your own test
import anprService from './src/services/anprService.js';

const result = await anprService.processFrame('./test1.png', 1);
console.log(result);
```

### Querying Detections

```javascript
// Get all blacklisted detections today
const today = new Date();
today.setHours(0, 0, 0, 0);

const response = await fetch(
  `http://localhost:5000/api/detections?blacklisted=true&startDate=${today.toISOString()}`
);
const data = await response.json();
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Ensure all services are running (Python, Node.js, PostgreSQL)
3. Check server logs for error messages
4. Verify database connection and migrations

## 🙏 Acknowledgments

- **YOLOv8** by Ultralytics for object detection
- **EasyOCR** for text recognition
- **Shadcn UI** for beautiful React components
- **Prisma** for type-safe database access
