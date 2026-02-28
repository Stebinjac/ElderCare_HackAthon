# ElderCare - AI Healthcare Assistant

An intelligent, proactive healthcare management system tailored for elderly care and modern clinic workflows. Built during the ElderCare Hackathon.

## Team Members
*   [Stebin Jacob Titus](https://github.com/Stebinjac)
*   [Ashin Sabu Mathew](https://github.com/AshinSMathew)
*   [Goldi Babu](https://github.com/goldibabu)
*   [Deon Sebastian](https://github.com/deonsebastian)
*   [Abin Raju Daniel](https://github.com/abinrd)

## Overview
ElderCare is an autonomous AI companion and clinic management platform. It bridges the gap between doctors, patients, and guardians through proactive health monitoring, dynamic pre-visit assessments, and autonomous workflows.

## Key Features

### 🎙️ AI Voice Chat Assistant
An accessible, conversational AI agent powered by **Groq LLaMA 3.3 70B** and **Sarvam AI** for real-time speech-to-text. Patients can ask about their vitals, medications, find nearby hospitals, or trigger emergency alerts using natural voice commands.

### 📝 Appoint-Ready (Live Pre-Visit Interview)
When a patient books an appointment, the AI acts as a virtual triage nurse. It conducts a dynamic, context-aware "Simulated Interview" to gather detailed symptoms. As the patient answers, a **Live Pre-Visit Report** is generated and updated in real-time on the screen. The final report includes clinical insights and an **AI Self-Evaluation** of the interview quality, which is automatically securely sent to the doctor.

### 💊 Autonomous Prescription Refill System
A background agent continuously monitors patient medication levels. When a prescription runs low, it automatically drafts a current health summary and initiates a **Dual-Approval Workflow**. It requests consent from both the prescribing doctor and the patient before autonomously completing the refill.

### 🏥 Context-Aware Tooling & Workflows
*   **Emergency Alerts:** Instantly notify guardians and doctors with a single command.
*   **Hospital Locator:** Automatically fetch the user's location and find the nearest relevant medical facilities.
*   **Vitals Dashboard:** Real-time tracking of blood pressure, heart rate, and SpO2 levels.
*   **Guardian & Admin Panels:** Dedicated interfaces for caretakers to monitor their dependents and for admins to manage clinical operations.

## Tech Stack

### Frontend
*   **Framework:** Next.js / React
*   **Styling:** Tailwind CSS / shadcn/ui
*   **Auth & Storage:** Firebase 

### Backend
*   **Framework:** FastAPI (Python)
*   **Database:** Supabase (PostgreSQL)
*   **AI Providers:** Groq API (LLaMA models), Sarvam AI (STT)

## Project Structure
*   `/frontend` - The Next.js web application encompassing patient dashboards, doctor views, and the live interview UI.
*   `/backend/src` - The FastAPI server and the core logic for the AI Orchestrator, Pre-Visit Agent, and Background Refill Agent.

## Getting Started

### Prerequisites
*   Node.js & npm
*   Python 3.10+
*   Supabase Account & Firebase Project
*   Groq API Key

### Installation

1.  **Clone the repository.**
2.  **Backend Setup:**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # Or .\venv\Scripts\activate on Windows
    pip install -r requirements.txt
    ```
    Create a `.env` file in the `backend` directory with your `GROQ_API_KEY`, `SUPABASE_URL`, and `SUPABASE_KEY`. Run using `python src/main.py`.
3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    ```
    Create a `.env.local` file in the `frontend` directory with your Firebase config and run using `npm run dev`.

### Testing Credentials

For testing purposes, you can use the following default accounts:

**Patient Account:**
*   **Email:** `ashin@gmail.com`
*   **Password:** `ashin`

**Doctor Account:**
*   **Email:** `doc3@doctor.com`
*   **Password:** `doc3`

---

