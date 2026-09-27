# 🍽️ RestoAI — Smart Restaurant Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue.svg?logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Local-brightgreen.svg?logo=mongodb)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-black.svg?logo=socket.io)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**RestoAI** is an intelligent, full-stack restaurant automation system built on the **MERN** stack (MongoDB, Express, React, Node.js). It unifies customer ordering, waiter POS, kitchen display system (KDS), manager analytics, inventory recipes/BOM, WhatsApp bot integration, and AI-powered insights.

---

## ⚡ Core Features

- **Role-Based Portals**: Dedicated interfaces for **Customer**, **Waiter**, **Kitchen (KDS)**, **Manager**, and **Vendor**.
- **Real-Time Kitchen Display**: Live order status transitions (`Pending` → `Preparing` → `Ready` → `Served`) via Socket.IO.
- **QR Staff Onboarding**: Instant waiter and kitchen staff onboarding via time-limited, encrypted QR join links.
- **Biometric Attendance**: Contactless employee attendance via Python + OpenCV facial recognition.
- **WhatsApp Automation**: Local Baileys QR bot and Meta Cloud API webhooks for automated order and inventory alerts.
- **AI & Smart Analytics**: Ingredient spoilage forecasting, menu upsell recommendations, and Gemini voice assistant.
- **Secure Email OTP**: Multi-step registration verified with 6-digit email OTPs.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Chakra UI, Framer Motion, Tailwind CSS, Socket.IO Client, Axios.
- **Backend**: Node.js, Express.js (ESM), MongoDB (Mongoose), JWT, Socket.IO, Nodemailer, Redis.
- **Microservices & AI**: Python (OpenCV, Face Recognition), Google Gemini API, `@whiskeysockets/baileys`.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ & **npm**
- **MongoDB** (Local or MongoDB Atlas)
- **Python 3.9+** *(optional, for facial recognition service)*

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env    # Configure MONGO_URI, JWT_SECRET, EMAIL_USER/PASS
npm run dev             # Server starts on http://localhost:4000
```

### 3. Frontend Setup
```bash
cd frontend/my-app
npm install
cp .env.example .env    # Ensure VITE_API_URL=http://localhost:4000
npm run dev             # App starts on http://localhost:5173
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=4000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/resto?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173

# Optional: Email OTP (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### Frontend (`frontend/my-app/.env`)
```env
VITE_API_URL=http://localhost:4000
```

---

## 📖 API Documentation

Once the backend is running, inspect and test endpoints via Swagger OpenAPI:
```
http://localhost:4000/api-docs
```

---

## 📄 License

Distributed under the [MIT License](LICENSE).
