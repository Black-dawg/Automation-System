# Job Application Automation System

A streamlined, AI-powered placement and job application automation suite. Designed to automate job extraction, tracking, and intelligent form autofilling using local LLMs.

---

## 🚀 Key Modules

- **`automaton_pipeline_backend/`**  
  Spring Boot backend service that extracts job announcements, parses placement metadata, and syncs opportunities with tracking platforms (e.g., Notion).

- **`frontend-dashboard/`**  
  React + Vite modern web dashboard for tracking job applications, viewing pipeline analytics, and monitoring real-time logs.

- **`FormGlitch/`**  
  - **`chrome-extension/`**: Smart Chrome extension that detects and populates fields on job application portals.
  - **`extension-backend/`**: Spring Boot helper leveraging local LLMs (via Ollama) to parse resumes and provide context-aware response generation.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, GSAP, Xterm.js |
| **Backend** | Java, Spring Boot, REST APIs, Docker |
| **AI / Automation** | Ollama (Local LLMs), Chrome Extension API |
| **Integrations** | Notion API, Custom Pipeline Connectors |

---

## ⚡ Quick Start

### 1. Backend Service
```bash
cd automaton_pipeline_backend
./mvnw spring-boot:run
```

### 2. Frontend Dashboard
```bash
cd frontend-dashboard
npm install
npm run dev
```

### 3. FormGlitch Extension & Backend
```bash
# Extension Helper Backend
cd FormGlitch/extension-backend
./mvnw spring-boot:run

# Chrome Extension
# Navigate to chrome://extensions -> Enable Developer Mode -> Load unpacked -> Select FormGlitch/chrome-extension
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

