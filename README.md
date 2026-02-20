# Shrnk.

**A High-Performance, Minimalist File Utility Suite**

> Zero-clutter file utilities — in-stream image processing, encrypted archiving, and real-time progress tracking. Built with Spring Boot and React.

![Java](https://img.shields.io/badge/Java-17+-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
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

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 17+, Spring Boot 3.2, Spring WebFlux |
| **Archive** | Zip4j (AES-256), `java.util.zip` |
| **Image** | Thumbnailator, metadata-extractor |
| **Frontend** | React 19, Vite 7, Tailwind CSS 3 |
| **Progress** | Server-Sent Events (SSE), XHR Upload Listeners |
| **Design** | Glassmorphic UI, Inter & JetBrains Mono fonts |

---

## 🚀 Getting Started

### Prerequisites
- **Java 17+** (tested on Java 23)
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

## 📐 Architecture

```
┌──────────────────────────────────────────────────┐
│                   React Frontend                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ DropZone │  │ Progress │  │  ConfigBar    │  │
│  │          │  │   Ring   │  │ (encrypt/     │  │
│  │ XHR      │  │   (SVG)  │  │  resize/strip)│  │
│  │ Upload   │  │          │  │               │  │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
│       │              │ SSE            │          │
├───────┼──────────────┼────────────────┼──────────┤
│       ▼              ▼                ▼          │
│  ┌─────────────────────────────────────────────┐ │
│  │            Spring Boot REST API             │ │
│  │  /api/archive/*          /api/image/*       │ │
│  └────────┬───────────────────────┬────────────┘ │
│           │                       │              │
│  ┌────────▼────────┐    ┌────────▼────────────┐ │
│  │ ArchiveService  │    │   ImageService      │ │
│  │ • Zip4j AES-256 │    │ • Thumbnailator     │ │
│  │ • 8KB streaming │◄──►│ • Parallel Streams  │ │
│  │ • Peek/Extract  │    │ • EXIF stripping    │ │
│  └─────────────────┘    └─────────────────────┘ │
│           │                                      │
│  ┌────────▼────────┐    ┌─────────────────────┐ │
│  │ ProgressService │    │  JanitorService     │ │
│  │ • SSE Emitters  │    │ • @Scheduled 30min  │ │
│  │ • ETA calc      │    │ • Temp dir cleanup  │ │
│  └─────────────────┘    └─────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
shrnk/
├── backend/
│   ├── pom.xml
│   ├── mvnw
│   └── src/main/java/com/shrnk/
│       ├── ShrnkApplication.java
│       ├── config/
│       │   └── CorsConfig.java
│       ├── controller/
│       │   ├── ArchiveController.java
│       │   └── ImageController.java
│       ├── service/
│       │   ├── ArchiveService.java      # Zip4j + 8KB streaming
│       │   ├── ImageService.java        # Thumbnailator + parallel
│       │   ├── ProgressService.java     # SSE + ETA
│       │   └── JanitorService.java      # Cron cleanup
│       ├── model/
│       │   ├── FileEntry.java
│       │   ├── ProgressEvent.java
│       │   └── ProcessingConfig.java
│       └── util/
│           └── StreamUtils.java
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── ModeSelector.jsx
│   │   │   ├── DropZone.jsx
│   │   │   ├── ProgressRing.jsx
│   │   │   ├── FileTree.jsx
│   │   │   ├── ConfigBar.jsx
│   │   │   └── FileCard.jsx
│   │   ├── pages/
│   │   │   ├── ArchivePage.jsx
│   │   │   └── ImagePage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

---

## 🔌 API Endpoints

### Archive

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/archive/zip` | Create ZIP from uploaded files |
| `POST` | `/api/archive/unzip` | Extract all files from ZIP |
| `POST` | `/api/archive/peek` | View file tree inside ZIP |
| `POST` | `/api/archive/extract-selected` | Extract specific files |
| `GET` | `/api/archive/download/{sessionId}` | Download processed output |
| `GET` | `/api/archive/progress/{sessionId}` | SSE progress stream |

### Image

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/image/resize` | Batch resize images |
| `POST` | `/api/image/strip-metadata` | Strip EXIF from images |
| `GET` | `/api/image/download/{sessionId}` | Download processed images |
| `GET` | `/api/image/progress/{sessionId}` | SSE progress stream |

---

## 🎨 Design Philosophy

- **Glassmorphic UI** — Frosted glass cards with `backdrop-filter: blur(20px)`, subtle borders, and ambient gradient backgrounds
- **Micro-Animations** — Pulse-glow on hover, slide-up entrances, smooth progress ring transitions
- **Zero Clutter** — Single-column layouts, minimal chrome, and intuitive drag-and-drop interactions
- **Typography** — Inter for UI text, JetBrains Mono for technical data (file sizes, progress)

---

## 🔐 Security Notes

- **AES-256 Encryption** — Archives encrypted using Zip4j's AES implementation
- **EXIF Stripping** — Removes GPS, camera model, and all embedded metadata by re-encoding images
- **Session Isolation** — Each operation runs in an isolated temp directory, auto-cleaned by the Janitor
- **No Persistence** — Files are never stored permanently; all data is session-scoped and ephemeral

---

## 📄 License

MIT — use it, fork it, ship it.
