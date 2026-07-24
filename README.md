# Attend | CSI - Production Event Attendance Management System

**Attend | CSI** is a full-stack web application designed for the **CSI-CATT Committee** to record, manage, and verify student attendance at department-level events using dynamic QR code sessions, rotating venue presence verification tokens, live monitoring, analytics, and data export tools.

---

## 🌟 Key Features

1. **Rotating Physical Presence Token Engine**:
   - Prevents off-site QR code sharing via WhatsApp/Telegram.
   - Rotates short-lived encrypted HMAC-SHA256 tokens every 20 seconds.
   - Includes standalone `companion_service.py` to broadcast presence tokens locally over venue Wi-Fi.

2. **Admin Dashboard & Analytics**:
   - Executive metrics: Total Events, Active Sessions, Today's Attendance, All-Time Records, Attendance Rates.
   - Interactive Recharts breakdown by Department, Year (FE/SE/TE/BE), Semester, and Attendance Trend.

3. **Event Management Lifecycle**:
   - Create, edit, duplicate, filter, search, and delete events.
   - Transition statuses: `UPCOMING` ➔ `LIVE` ➔ `ATTENDANCE_ACTIVE` ➔ `CLOSED`.

4. **Dynamic Session QR Generator**:
   - Fullscreen venue presentation mode with live rotating presence token countdown bar.
   - Pause, resume, copy link, and session controls.

5. **Student Scan & Attendance Form**:
   - Unauthenticated student access via scanned QR code (`/attendance/session/{session_uuid}`).
   - Strict validation: Full Name, GR Number, Roll Number, Department, Year, Semester, Class, Division, Mobile.
   - Duplicate submission prevention per GR Number & event.
   - Device fingerprinting and IP tracking.

6. **Manual Override & Data Export**:
   - Committee members can manually register students for edge cases.
   - One-click export to **Excel (.xlsx)**, **CSV**, and **PDF** rosters.

7. **Security & Audit Logs**:
   - JWT authentication for admin users.
   - Immutable security audit trail recording logins, event modifications, manual entries, and exports.

---

## 🛠 Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, ReportLab (PDF), OpenPyXL (Excel).
- **Frontend**: React 18, Vite, Tailwind CSS v3, React Router v6, Recharts, `qrcode.react`, Lucide Icons, `react-hot-toast`.
- **Companion Service**: Python HTTP/HMAC broadcast runner (`companion_service.py`).
- **DevOps**: Docker, Docker Compose, Nginx.

---

## 🚀 Quick Setup Instructions

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Seed initial database & admin user (admin / admin123)
python seed.py

# Run FastAPI Dev Server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Swagger API Docs: `http://localhost:8000/docs`
- ReDoc API Docs: `http://localhost:8000/redoc`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- Open Web Portal: `http://localhost:5173`
- Default Admin Login:
  - **Username**: `admin`
  - **Password**: `admin123`

### 3. Local Venue Companion Service (Optional for Event Hosting)

Run this script on the event host's laptop connected to the venue Wi-Fi:

```bash
cd companion
python companion_service.py
```

### 4. Docker Deployment

```bash
docker-compose up --build
```

---

## 📁 Project Structure

```
Attend CSI/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # FastAPI Endpoint Controllers
│   │   ├── core/           # Security, JWT, Token Rotation & Config
│   │   ├── database/       # SQLAlchemy Base & Session Management
│   │   ├── models/         # User, Event, Session, Attendance, Audit ORM Models
│   │   ├── schemas/        # Pydantic v2 Validation Schemas
│   │   └── services/       # Export (Excel/CSV/PDF) & Audit Services
│   ├── seed.py             # Database Initializer & Seeder
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, QRCodeModal, AttendanceTable, Modals
│   │   ├── context/        # AuthContext & ThemeContext
│   │   ├── pages/          # Login, Dashboard, Events, Detail, Live, Audit, Student Scan
│   │   └── services/       # Axios API Client
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── companion/
│   └── companion_service.py # Local Venue Companion Broadcast Service
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🛡 License

Organized & Maintained by **CSI-CATT Committee** © 2026.
