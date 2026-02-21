# Shrnk.

**A High-Performance, Minimalist File Utility Suite**

> Zero-clutter file utilities — in-stream image processing, encrypted archiving, and real-time progress tracking. Built with Spring Boot and React.

![Java](https://img.shields.io/badge/Java-21+-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## ✨ Features

### 🗜️ Archive Engine
- **Bidirectional ZIP** — Create and extract ZIP archives with 8KB buffered streaming I/O
- **AES-256 Encryption** — Password-protected archives using industry-standard encryption (Zip4j)
- **Peek Mode** — Inspect archive contents without extracting; view the file tree and download selectively
- **In-Stream Resize** — Optionally resize images *during* the zip process to save bandwidth

### 🖼️ Intelligent Image Processor
- **Batch Resize** — Scale images to 50%, 25%, or custom dimensions using Thumbnailator
- **Parallel Processing** — Java Parallel Streams for concurrent batch image processing
- **EXIF Stripping** — Remove GPS coordinates, camera info, and other private metadata

### ⚡ Performance & Architecture
- **Streaming I/O** — 8KB buffered chunks handle 1GB+ files without `OutOfMemory` errors
- **SSE Progress Tracking** — Real-time server-sent events with ETA calculation
- **XHR Upload Listeners** — Frame-by-frame upload progress via `XMLHttpRequest`
- **Janitor Service** — `@Scheduled` cron job purges expired temp directories every 30 minutes

### 🎨 UI & Design
- **Fluid Dark Mode** — Seamless local-first dark mode featuring liquid transition animations
- **Glassmorphic Elements** — Premium, frosted glass interface design
- **Drag & Drop** — Intuitive interaction model for bulk uploading files

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 21+, Spring Boot 3.2, Spring WebFlux |
| **Archive** | Zip4j (AES-256), `java.util.zip` |
| **Image** | Thumbnailator, metadata-extractor |
| **Frontend** | React 19, Vite 7, Tailwind CSS 3 |
| **Progress** | Server-Sent Events (SSE), XHR Upload Listeners |
| **Design** | Fluid Dark Mode, Glassmorphic UI, Inter & JetBrains Mono fonts |

---

## 🚀 Getting Started

### Prerequisites
- **Java 21+**
- **Node.js 18+** and npm

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend starts on `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173` and proxies API requests to the backend.

---

