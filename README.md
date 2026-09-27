# 🍽️ RestoAI — Intelligent Restaurant Operating & Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-v6-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Local-brightgreen.svg?logo=mongodb)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-black.svg?logo=socket.io)](https://socket.io/)
[![Chakra UI](https://img.shields.io/badge/Chakra_UI-v2-teal.svg?logo=chakraui)](https://chakra-ui.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**RestoAI** is an enterprise-grade, full-stack restaurant operating and automation platform built using the **MERN** stack (MongoDB, Express, React, Node.js), powered by **Socket.IO** real-time events, **Python microservices** for biometric face recognition, **predictive AI** for inventory waste forecasting, and **WhatsApp bot automation**.

---

## 📑 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Key Modules & Role-Based Access Control](#-key-modules--role-based-access-control)
- [Advanced Features](#-advanced-features)
  - [Biometric Face Recognition](#1-biometric-face-recognition--attendance)
  - [QR Code Staff Onboarding](#2-qr-code-staff-onboarding)
  - [WhatsApp Automation Engine](#3-dual-mode-whatsapp-automation)
  - [AI Waste & Analytics Engine](#4-ai-waste-prediction--analytics)
  - [Email OTP Verification](#5-secure-email-otp-verification)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started & Installation](#-getting-started--installation)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. Biometrics / Python Service (Optional)](#4-biometrics--python-service-optional)
- [Environment Variables Guide](#-environment-variables-guide)
- [API Documentation & Swagger](#-api-documentation--swagger)
- [Real-time Socket.IO Events](#-real-time-socketio-events)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [License](#-license)

---

## 🏛️ Overview & Architecture

RestoAI modernizes dining and restaurant workflows by providing unified real-time collaboration between customers, front-of-house waiters, back-of-house kitchen staff, inventory vendors, and managers.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                        |
|  +-------------------+  +-------------------+  +-------------------+  +------------+  |
|  |   Customer App    |  |    Waiter POS     |  |   Kitchen (KDS)   |  |  Manager   |  |
|  |  (Browse & Order) |  | (Table Management)|  | (Live Order Queue)|  | (Dashboard)|  |
|  +---------+---------+  +---------+---------+  +---------+---------+  +-----+------+  |
+------------|----------------------|----------------------|------------------|---------+
             |                      |                      |                  |
             +----------------------+----+-----------------+------------------+
                                         |  HTTPS / WebSocket (Socket.IO)
                                         v
+---------------------------------------------------------------------------------------+
|                                    BACKEND API                                        |
|   Express 4 (ESM)  •  JWT Auth  •  Swagger OpenAPI  •  Nodemailer  •  Redis Caching   |
|                                                                                       |
|   [ Controllers ]       [ Services ]              [ Automation ]                      |
|   • Auth & OTP          • Table Management        • Baileys WhatsApp Engine           |
|   • Orders & KDS        • Inventory & BOM         • Meta Cloud Webhook                |
|   • Restaurants/Dishes  • Analytics & Sales       • Face Verification Client          |
+-------------------+--------------------+------------------------+---------------------+
                    |                    |                        |
                    v                    v                        v
          +------------------+  +------------------+   +----------------------+
          |     MongoDB      |  |  Python Micro-   |   |   External AI APIs   |
          |  (Atlas / Mongoose) |  service (OpenCV)|   |  (Gemini / OpenAI)   |
          +------------------+  +------------------+   +----------------------+
```

---

## 👥 Key Modules & Role-Based Access Control

The platform enforces strict Role-Based Access Control (RBAC) across five user roles:

| Role | Access & Capabilities |
| :--- | :--- |
| **Customer** | Interactive menu browsing, filtering by category/cuisine, cart checkout, real-time live order status tracking, automated receipt generation. |
| **Waiter** | Real-time table layout viewer, fast-order taking directly at tables, quick join via manager QR code, status updates from kitchen to table. |
| **Kitchen Staff** | Dedicated Kitchen Display System (KDS). Live incoming tickets sorted by urgency with one-click status transitions (`Pending` $\rightarrow$ `Preparing` $\rightarrow$ `Ready` $\rightarrow$ `Served`). |
| **Manager** | Complete administrative dashboard: real-time sales and revenue KPIs, staff management, QR code invitation generator, inventory BOM recipes, table layout builder. |
| **Vendor** | Supply-chain portal for monitoring ingredients, low-stock threshold triggers, and fulfillment orders. |

---

## 🚀 Advanced Features

### 1. Biometric Face Recognition & Attendance
- Built using **Python**, **OpenCV**, and **Dlib** / **Face-API**.
- Allows employees (waiters, kitchen staff) to clock in and out touch-free using camera verification.
- Validates facial embeddings against enrolled employee profiles in MongoDB.

### 2. QR Code Staff Onboarding
- Managers can generate dynamic, time-limited, encrypted JWT join tokens via their dashboard.
- Staff scan the QR code to instantly onboard to that specific restaurant without manual registration paperwork.
- Includes automatic session preservation and redirect back to confirmation upon sign-in.

### 3. Dual-Mode WhatsApp Automation
- **Baileys QR Mode**: Native local WhatsApp Web bot for scanning and pairing a business phone. Managers can query inventory levels, check pending orders, and receive low-stock alerts right inside WhatsApp.
- **Meta WhatsApp Cloud API**: Webhook endpoints ready for enterprise deployment via official Meta developer accounts.

### 4. AI Waste Prediction & Analytics
- Machine learning regression models correlate sales trends, weather data, and seasonality to predict ingredient spoilage.
- Automatic dish upsell suggestions during checkout to increase Average Order Value (AOV).
- Embedded **Gemini AI** voice assistant for hands-free menu querying and dish recommendations.

### 5. Secure Email OTP Verification
- Multi-step registration flow backed by **Nodemailer** and Gmail SMTP.
- Issues time-sensitive 6-digit one-time passwords for email verification before account activation.
- Fully accessible 6-digit input UI with auto-focus, paste support, and resend cooldown timers.

---

## 💻 Tech Stack

### Frontend
- **Framework**: React 19 + Vite 6
- **UI Kit**: Chakra UI v2 & Emotion
- **Animations**: Framer Motion 12
- **Styling**: Tailwind CSS & Vanilla CSS3 Glassmorphism
- **Routing**: React Router DOM v6
- **Real-Time**: Socket.IO Client
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js v18+ (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Engine**: Socket.IO
- **Security & Auth**: JSON Web Tokens (JWT), Bcrypt.js, Helmet, CORS
- **Email Service**: Nodemailer (Gmail SMTP / Custom SMTP)
- **Caching**: Redis / ioredis (optional)
- **Documentation**: Swagger UI & Swagger JSDoc

### AI & Microservices
- **Biometrics**: Python 3.9+, OpenCV, face_recognition
- **WhatsApp**: `@whiskeysockets/baileys`
- **Generative AI**: Google Gemini API SDK (`@google/genai`), OpenAI SDK

---

## 📂 Project Directory Structure

```text
RESTO-main/
├── backend/
│   ├── analytics-service/          # Python AI & predictive analytics service
│   ├── config/                     # Database connection & Swagger configurations
│   ├── controllers/                # Request handlers (auth, orders, dishes, etc.)
│   ├── middleware/                 # JWT verification, RBAC, Redis cache middleware
│   ├── models/                     # Mongoose Schemas (User, Order, Dish, Inventory, Table)
│   ├── routes/                     # Express REST routes
│   ├── services/                   # WhatsApp Baileys service, socket emitters
│   ├── face_recognition_service.py # Biometric face-matching Python server
│   ├── server.js                   # Node.js Express & Socket.IO server entrypoint
│   ├── whatsappBot.js              # Standalone CLI Baileys WhatsApp bot
│   ├── package.json
│   └── .env.example
├── frontend/
│   └── my-app/
│       ├── src/
│       │   ├── components/         # Reusable widgets (Receipts, VoiceAssistant, etc.)
│       │   ├── pages/              # Role dashboards (manager, waiter, kitchen, customer)
│       │   ├── utils/              # Authentication helpers and redirects
│       │   ├── App.jsx             # React router & role routing
│       │   └── main.jsx            # Application root
│       ├── package.json
│       ├── vite.config.js
│       └── .env.example
├── .gitignore                      # Security-hardened git ignore specification
└── README.md                       # Documentation
```

---

## 🛠️ Getting Started & Installation

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Python** (v3.9+ optional, required for face recognition & analytics service)

---

### 2. Backend Setup

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```

4. Open `.env` and fill in your database and auth credentials:
   ```env
   PORT=4000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/resto?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_here
   CLIENT_URL=http://localhost:5173

   # Email OTP Configuration (Use Gmail App Password)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_16_char_app_password
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will boot up at `http://localhost:4000` and connect to MongoDB.*

---

### 3. Frontend Setup

1. In a new terminal window, navigate to the frontend directory:
   ```bash
   cd frontend/my-app
   ```

2. Install client dependencies:
   ```bash
   npm install
   ```

3. Set up the frontend `.env` file:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_URL` points to your backend:
   ```env
   VITE_API_URL=http://localhost:4000
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:5173](http://localhost:5173) in your browser.*

---

### 4. Biometrics / Python Service (Optional)

If you wish to test facial attendance or the analytics service:

1. Navigate to the analytics or face service folder:
   ```bash
   cd backend/analytics-service
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the service:
   ```bash
   python app.py
   ```

---

## ⚙️ Environment Variables Guide

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | No | `4000` | Port for the Express server to listen on. |
| `MONGO_URI` | **Yes** | — | MongoDB Atlas or local connection string. |
| `JWT_SECRET` | **Yes** | — | Secret key used for signing and verifying JWT tokens. |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed CORS origin for frontend client requests. |
| `EMAIL_USER` | No | — | Gmail or SMTP email address for sending OTP codes. |
| `EMAIL_PASS` | No | — | Gmail 16-character App Password (2FA enabled). |
| `REDIS_URL` | No | `redis://127.0.0.1:6379`| Optional Redis instance for route caching. |
| `GEMINI_API_KEY`| No | — | Google Gemini API key for AI assistant features. |
| `OPENAI_API_KEY`| No | — | OpenAI API key for alternative LLM processing. |

### Frontend (`frontend/my-app/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `VITE_API_URL` | **Yes** | `http://localhost:4000` | Base URL of the backend API. |
| `VITE_GEMINI_API_KEY` | No | — | Optional client-side key for voice agent. |

---

## 📖 API Documentation & Swagger

RestoAI comes with auto-generated interactive OpenAPI/Swagger documentation.

Once the backend is running, open:
```
http://localhost:4000/api-docs
```

Here you can inspect request bodies, parameter schemas, and test endpoints directly from the browser:
- `POST /api/auth/register/initiate-email` — Send 6-digit OTP to user email.
- `POST /api/auth/register/verify-email-otp` — Verify OTP and create user.
- `POST /api/auth/login` — Sign in and retrieve JWT.
- `GET /api/auth/generate-qr` — Generate manager QR token for staff onboarding.
- `GET /api/auth/join` — Onboard waiter/kitchen staff to a restaurant via QR token.
- `GET /api/orders` — Retrieve restaurant order queue.
- `POST /api/orders` — Create new table order with inventory deduction.
- `GET /api/inventory` — Fetch ingredient levels and reorder thresholds.

---

## ⚡ Real-Time Socket.IO Events

RestoAI uses Socket.IO for sub-second synchronization across all restaurant terminals:

```
[Customer / Waiter POS]  ---( order:created )--->  [Socket.IO Server]
                                                            |
                                    +-----------------------+-----------------------+
                                    |                                               |
                                    v (order:new)                                   v (table:updated)
                           [Kitchen Display (KDS)]                        [Manager / Waiter Floor]
```

- **`order:created`**: Emitted when a new order is confirmed; broadcasts to kitchen screens.
- **`order:status_updated`**: Emitted when kitchen advances ticket status (`Preparing` $\rightarrow$ `Ready`); alerts waiters.
- **`table:status_changed`**: Updates table occupancy status (`Available`, `Occupied`, `Reserved`).
- **`inventory:low_stock`**: Broadcasts alerts to managers when an ingredient drops below safety thresholds.

---

## 💡 Troubleshooting & FAQ

#### 1. MongoDB connection times out or fails
- Make sure your current IP address is whitelisted in **MongoDB Atlas** $\rightarrow$ **Network Access** $\rightarrow$ **Add IP Address** (`0.0.0.0/0` for development).
- Check that your username and password in `MONGO_URI` have no unencoded special characters.

#### 2. Email OTP is not arriving
- Ensure you generated a **Google App Password** (16 characters) rather than your personal account password.
- Verify `EMAIL_USER` matches the account that created the App Password.

#### 3. WhatsApp Baileys QR code pairing fails or gives 401
- Delete the local cached auth session:
  ```bash
  cd backend
  node whatsappBot.js --reset
  ```
- Re-run the QR generator from the Manager Dashboard and scan with WhatsApp.

#### 4. CORS error between Frontend and Backend
- Verify that `CLIENT_URL` in `backend/.env` exactly matches your frontend port (default `http://localhost:5173`).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Developed with ❤️ for modern hospitality and restaurant operations.
