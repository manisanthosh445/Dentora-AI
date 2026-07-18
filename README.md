# Dentora AI 🦷✨
**Enterprise AI-Powered Dental Clinic Management & ERP System**

Dentora AI is a state-of-the-art dental clinic operating system designed to optimize operations, automate billing, and leverage AI to enhance diagnostic capabilities and patient care. Built with **React**, **Vite**, **Tailwind CSS**, and **Supabase**.

---

## ⚠️ Core Business Challenges Addressed (Problem Statement)
*   **Appointment Management**: Businesses lose revenue due to manual scheduling, no-shows, and inefficient appointment handling.
*   **Intelligent Workforce Scheduling**: Organizations struggle to assign employees efficiently based on skills, availability, and workload.
*   **Resource Reservation**: Businesses require centralized booking systems for rooms, vehicles, courts, equipment, and facilities.
*   **Dynamic Pricing**: Businesses need demand-based pricing strategies for appointments, bookings, and reservations.
*   **Automated Notifications**: Customers miss appointments because businesses lack automated reminders and confirmations.
*   **Capacity Optimization**: Organizations cannot efficiently manage booking availability, utilization, and peak demand.

---

## 🚀 Key Modules & Capabilities

### 🩺 Clinic Operations
*   **Smart Dashboard**: Tracks daily appointments, active queue metrics, total collections, and notification statuses at a glance.
*   **Patients Database**: Patient EMR histories, demographics, medical histories, allergies, and treatment charts.
*   **Queue Management**: Real-time patient flow controller to monitor wait times and check-in statuses.
*   **Treatments Log**: Record clinical notes and dental procedures. Automatically generates invoice records on treatment completion.
*   **Prescriptions Engine**: Auto-synchronizes with clinical notifications to schedule medicine reminders directly from doctors' approvals.

### 💰 Billing & Financial Center
*   **Financial KPIs**: 9 real-time summary cards mapping cumulative collections, monthly revenue, outstanding balances, and invoice categories.
*   **Collections System**: Supports cash/card/UPI recording, auto-calculates remaining balances, and assigns color-coded payment statuses.
*   **Printable A4 PDFs**: Pixel-perfect template generator for printable customer invoices and payment receipts with customizable QR codes.
*   **Financial Analytics Center**: Revenue metrics mapping doctor performance and top treatment categories.

### 🤖 AI-Powered Enhancements
*   **AI Consultation**: Ambient clinical voice recorder leveraging Gemini API to transcribe doctor-patient conversations into structured SOAP notes.
*   **X-Ray AI Analysis**: Image upload system using Vision AI to scan dental radiographs and highlight decay, fractures, or pathologies.
*   **AI Receptionist**: Conversational agent assisting receptionist desks with automated appointments scheduling.

---

## 🛠️ Tech Stack & Architecture
*   **Frontend Framework**: React 18, Vite (Fast HMR)
*   **Styling**: Tailwind CSS (Utility-first styling, fully responsive, dark mode compatible)
*   **Icons**: Lucide React
*   **Backend & DB**: Supabase (PostgreSQL database, authentication, row-level security)
*   **API Client Layer**: Custom mapped API service with translation mapping between frontend properties (camelCase) and database tables (snake_case).

---

## ⚙️ Local Development Setup

### 1. Prerequisite Packages
Verify Node.js is installed on your computer.

### 2. Install Project Dependencies
Run the install command from the root folder:
```bash
npm install
```

### 3. Setup Local Environment Variables
Create a file named `.env` in the root folder of the project (already configured in `.gitignore` to prevent secret leaks) and populate it with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_vision_api_key
```

### 4. Setup Database Schema
Execute the SQL migrations found in [supabase/schema.sql](file:///c:/Users/manis/OneDrive/Desktop/Dr.New%20Project/supabase/schema.sql) inside your **Supabase SQL Editor (SQL Editor -> New Query)**. This script initializes all structural tables, handles type-compatible constraints (`UUID`/`TEXT`), enables RLS security gates, and populates baseline indexes and doctor/staff seed profiles.

### 5. Launch Local Dev Server
Start Vite's development runner:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your web browser.

---

## 🧹 Code Cleanups
The non-functional legacy modules (**Dental Charts** and **AI Smart Scheduler**) were cleanly removed from navigation links, routing trees, and bundle files, reducing compiled asset sizes and improving load performance.