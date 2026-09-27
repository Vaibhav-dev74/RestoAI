# 🍽️ RestoAI — Intelligent Restaurant Operating & Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-v6-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Local-brightgreen.svg?logo=mongodb)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-black.svg?logo=socket.io)](https://socket.io/)
[![Chakra UI](https://img.shields.io/badge/Chakra_UI-v2-teal.svg?logo=chakraui)](https://chakra-ui.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**RestoAI** is an all-in-one restaurant operating and management platform designed to streamline dining operations across customers, floor staff, kitchen teams, and management. Built on the modern **MERN** stack with **Socket.IO** real-time synchronization, RestoAI integrates biometric attendance, dynamic QR onboarding, WhatsApp automation, and predictive AI analytics into a single cohesive ecosystem.

---

## 🌟 Key Role Portals & Workflows

RestoAI provides dedicated, specialized interfaces for every tier of restaurant operations:

### 📱 1. Customer Ordering & Self-Service
- **Interactive Digital Menu**: Filter by cuisine, dietary preferences, and popularity with rich imagery.
- **Table QR Ordering & Cart**: Direct self-ordering from the dining table.
- **Live Order Tracker**: Real-time status indicators as meals progress through the kitchen.
- **Automated Digital Receipts**: Instant receipt generation with itemized tax and breakdown.

### 🛎️ 2. Waiter POS & Floor Management
- **Table Occupancy Grid**: Visual real-time layout showing Available, Occupied, and Billed tables.
- **Rapid Order Punching**: Direct order placement and add-on dish modification at tableside.
- **Instant Restaurant Join**: Auto-onboard to a restaurant by scanning the manager's dynamic QR code.

### 👨‍🍳 3. Kitchen Display System (KDS)
- **Live Ticket Pipeline**: Color-coded incoming order tickets prioritized by wait time.
- **One-Click Progression**: Seamless status transitions (`Pending` $\rightarrow$ `Preparing` $\rightarrow$ `Ready` $\rightarrow$ `Served`) synchronized across all screens via Socket.IO.

### 📊 4. Manager & Administrative Hub
- **Executive KPI Dashboard**: Live tracking of revenue, order volume, popular items, and peak service hours.
- **Inventory & Recipe (BOM) Control**: Automatic ingredient depletion based on recipes with low-stock warnings.
- **Staff Access Management**: Manage waiter and kitchen roles with dynamic QR-based onboarding.
- **Table Layout Builder**: Create and configure seating capacities and dining sections.

### 🚚 5. Vendor Supply Chain Portal
- Monitor ingredient inventory thresholds and process replenishment orders directly with suppliers.

---

## 🚀 Advanced Capabilities

### 🔍 Biometric Facial Attendance
- Powered by a dedicated **Python + OpenCV** microservice.
- Contactless, camera-based clock-in/out for kitchen and waiter staff, verifying embeddings against enrolled profiles.

### 📲 QR Code Staff Onboarding
- Managers generate time-limited, encrypted JWT join QR codes.
- Staff scan to join instantly without manual registration or credential exchange.

### 💬 Dual-Mode WhatsApp Bot
- **Local Baileys QR Bot**: Pairs directly via WhatsApp Web QR code for automated inventory queries and order notifications.
- **Meta Cloud API Ready**: Production-ready webhook endpoints for enterprise WhatsApp business messaging.

### 🧠 Predictive AI & Voice Assistant
- **Waste & Spoilage Predictor**: Correlates past sales, shelf life, and trends to forecast ingredient waste.
- **Menu Upsell Engine**: Suggests pairings and complementary dishes at checkout to increase Average Order Value (AOV).
- **Gemini Voice Assistant**: Hands-free voice querying for menu exploration and customer recommendations.

### 🔐 Secure Email OTP Verification
- Multi-step account authentication powered by **Nodemailer**.
- Generates 6-digit verification codes with input auto-focus, paste detection, and cooldown timers.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 6, Chakra UI, Framer Motion, Tailwind CSS, Axios |
| **Backend** | Node.js (ES Modules), Express.js, JWT, Nodemailer, Redis Caching |
| **Database** | MongoDB with Mongoose ODM (Atlas & Local supported) |
| **Real-Time** | Socket.IO (Event-driven bidirectional communication) |
| **AI & Microservices** | Python 3.9+, OpenCV, Face-API, Google Gemini API, `@whiskeysockets/baileys` |
| **Documentation** | Swagger UI Express (OpenAPI specification) |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **MongoDB** (Local instance or MongoDB Atlas cluster)
- **Python 3.9+** *(optional, for facial recognition microservice)*

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env      # Configure your MongoDB URI, JWT Secret & Email settings
npm run dev               # API server boots on http://localhost:4000
```

### 3. Frontend Setup
```bash
cd frontend/my-app
npm install
cp .env.example .env      # Verify VITE_API_URL=http://localhost:4000
npm run dev               # Vite server starts on http://localhost:5173
```

### 4. Facial Recognition Service *(Optional)*
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # On Linux/macOS: source venv/bin/activate
pip install opencv-python numpy
python face_recognition_service.py
```

---

## 📡 Real-Time Socket.IO Channels

RestoAI uses WebSocket channels for instant updates across devices:
- `order:created` — Broadcasts new orders to Kitchen Display screens instantly.
- `order:status_updated` — Alerts waiters when dishes are ready for service.
- `table:status_changed` — Synchronizes table availability across floor terminals.
- `inventory:low_stock` — Pushes real-time stock alerts to managers when supplies dip below safety levels.

---

## 📖 Interactive API Documentation

Swagger OpenAPI documentation is integrated directly into the backend:
```
http://localhost:4000/api-docs
```
Explore, inspect, and test REST endpoints including authentication, order workflows, table layouts, and inventory directly in your browser.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
