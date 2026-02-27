🏥

**ElderCare AI**

Agentic AI Platform for Elderly Healthcare

**Build for India --- Agentic AI Hackathon 2026**

*Kerala Startup Mission, Kochi \| February 27--28, 2026*

*Full Project Walkthrough • Agent Architecture • Setup Guide • Tech
Stack*

**1. Project Overview**

ElderCare AI is a multi-agent autonomous healthcare platform designed
for elderly citizens in India. It combines 6 specialized AI agents
orchestrated through a central MCP (Model Context Protocol) server to
deliver continuous health monitoring, emergency response, medication
management, mental wellness support, and intelligent assistance --- all
accessible through a web dashboard and WhatsApp.

> 🎯 Target Users: 100M+ elderly Indians aged 60+, their family
> guardians, and treating doctors.

  --------------------- -------------------------------------------------
  **Dimension**         **Details**

  Hackathon Track       Multi-Agent Systems & Collaboration + Public
                        Services & Social Impact

  Core Technology       Agentic AI with MCP orchestration, MedGemma,
                        Claude, Supabase

  Primary Interface     React Web Dashboard (WhatsApp as Phase 2)

  Demo Scenario         2 AM emergency: BP spike → agents fire →
                        ambulance dispatched in \<60s

  Grant Potential       Up to ₹20 lakh for winning teams
  --------------------- -------------------------------------------------

**1.1 The Problem**

-   India has 100M+ elderly citizens, a number growing rapidly

-   60% live alone or without adequate medical supervision

-   Medication non-compliance causes 30% of hospital admissions in
    seniors

-   Falls and cardiac events at night go undetected for hours

-   Navigating hospitals, insurance, and government schemes is
    overwhelming

-   Loneliness and undiagnosed depression affect over 40% of elderly
    Indians

**1.2 The Solution**

A 24/7 autonomous AI system that acts as a digital health companion ---
monitoring, deciding, coordinating, communicating, and supporting
elderly patients without requiring constant human intervention.

**2. System Architecture**

**2.1 High-Level Architecture**

> All agents communicate exclusively through the MCP Server --- no
> direct agent-to-agent coupling. Every event is logged with full
> timestamps for the audit trail.
>
> ┌─────────────────────────────────────────────────────────┐\
> │ USER INTERFACES │\
> │ Web Dashboard │ Doctor Portal │ Guardian Panel │\
> └────────────────────────┬────────────────────────────────┘\
> │\
> ┌───────▼────────┐\
> │ FastAPI Backend│\
> └───────┬────────┘\
> │\
> ┌──────────▼──────────┐\
> │ MCP SERVER │\
> │ (Event Bus + Logs) │\
> └──┬──┬──┬──┬──┬──────┘\
> \_\_\_\_\_\_\_\_\_\_\_\_\| \| \| \| \|\_\_\_\_\_\_\_\_\_\_\_\_\
> \| \| \| \| \| \| \| \|\
> Health Care Emerg Comms Well Assist\
> Agent Agent Agent Agent Agent Agent\
> \| \| \| \| \| \| \| \|\
> └──────┴──────┴──┴──┴──┴──────┘ \|\
> │ \|\
> ┌────────▼─────────┐ \|\
> │ Supabase DB │ \|\
> │ (PostgreSQL) │ \|\
> └──────────────────┘ \|\
> \|\
> ┌─────────────────────────────┘\
> │ External APIs │\
> │ Google Maps, HuggingFace │\
> │ MedGemma,  │\
> └──────────────────────────────┘

**2.2 MCP Server --- The Central Nervous System**

The MCP (Model Context Protocol) server is the single most important
architectural decision in this project. It acts as an event bus, message
router, and audit logger between all agents.

  ---------------------- ------------------------------------------------
  **MCP Responsibility** **Details**

  Event Bus              Agents publish events; other agents subscribe
                         and react

  Message Schema         Standard JSON: { patient_id, event_type,
                         payload, timestamp }

  Agent Registry         Each agent registered as a named tool/resource

  Audit Logging          Every inter-agent message stored in mcp_events
                         table

  Context Sharing        Wellness + Assistant agents share patient
                         context via MCP
  ---------------------- ------------------------------------------------

**3. The 6 Agents --- Full Details**

+-----------------------------------------------------------------------+
| **🩺 Agent 1: Health Monitoring Agent**                               |
|                                                                       |
| *Track: Autonomous & Decision-Making Agents*                          |
|                                                                       |
| **AI Model: MedGemma 4B (text) + Rule Engine**                        |
+-----------------------------------------------------------------------+

**What it does**

-   Ingests vitals logged by patient: BP, blood sugar, heart rate,
    weight, temperature, SpO2

-   Compares each reading against personalized thresholds set per
    patient (not population averages)

-   Monitors inactivity --- if no interaction in X hours, raises an
    alert flag

-   Runs trend analysis --- detects creeping patterns over days/weeks
    (e.g. BP slowly rising)

-   Publishes typed events to MCP when thresholds breach

**Events it publishes to MCP**

  --------------------- ------------------------------- -----------------
  **Event Type**        **Trigger**                     **Severity**

  EMERGENCY_VITALS      BP \> 180/110 or heart rate \<  CRITICAL
                        40 or \> 150                    

  INACTIVITY_ALERT      No patient interaction for 6+   HIGH
                        hours                           

  TREND_WARNING         Metric trending abnormally over MEDIUM
                        3+ days                         

  NORMAL_LOG            Vitals logged and within range  INFO
  --------------------- ------------------------------- -----------------

**Why MedGemma here?**

MedGemma understands clinical terminology and medical context natively.
It can reason about which vital combinations are medically significant
(e.g. elevated BP + high heart rate together vs. individually) rather
than simple threshold checks.

+-----------------------------------------------------------------------+
| **🏥 Agent 2: Care Decision Agent**                                   |
|                                                                       |
| *Track: Autonomous & Decision-Making Agents*                          |
|                                                                       |
| **AI Model: MedGemma 4B (text) --- Primary reasoning model**          |
+-----------------------------------------------------------------------+

**What it does**

-   Subscribes to EMERGENCY_VITALS events from MCP

-   Pulls full patient medical history: conditions, allergies, current
    medications, recent vitals

-   Fetches nearby hospitals from DB and scores them on: distance, ER
    availability, relevant specialization, rating

-   Generates LLM rationale in plain English explaining why a specific
    hospital was chosen

-   Publishes HOSPITAL_DECISION event to MCP with ranked list +
    rationale

**Sample LLM Output**

> Recommending Apollo Hospital over KIMS because: (1) Patient has a
> documented cardiac history (hypertension since 2019, on Amlodipine),
> (2) Apollo has an active Cardiac ICU with a cardiologist on duty, (3)
> Distance is 2.3km vs 4.1km for KIMS, (4) Apollo is Ayushman Bharat
> empanelled for this patient\'s insurance. ETA via current traffic: 8
> minutes.

**Why MedGemma here?**

This is the most medically sensitive decision in the system. MedGemma\'s
training on clinical data ensures that hospital recommendations account
for medical context (cardiac history → cardiac ER), not just proximity.

+-----------------------------------------------------------------------+
| **🚑 Agent 3: Emergency Coordination Agent**                          |
|                                                                       |
| *Track: Multi-Agent Systems & Collaboration*                          |
|                                                                       |
| **AI Model: Groq – Llama 3.1 70B --- Coordination & communication       |
| logic**                                                               |
+-----------------------------------------------------------------------+

**What it does**

-   Subscribes to HOSPITAL_DECISION events from MCP

-   Mocks ambulance dispatch to the selected hospital (API call or
    simulation)

-   Compiles a patient medical summary: conditions, allergies, current
    medications, recent vitals, emergency context

-   Sends summary to hospital\'s emergency contact

-   Gets and tracks estimated arrival time (ETA)

-   Publishes DISPATCH_CONFIRMED event with ETA back to MCP

**Patient Summary sent to Hospital**

  ------------------ ----------------------------------------------------
  **Field**          **Content**

  Patient            Rajan Kumar, 72M --- Blood group: O+

  Known Conditions   Hypertension, Type 2 Diabetes, Mild CKD

  Current            Amlodipine 5mg, Metformin 500mg, Telmisartan 40mg
  Medications        

  Allergies          Penicillin, Sulpha drugs

  Emergency Vitals   BP: 185/115, HR: 98, logged at 02:14 AM

  Last Lab Values    HbA1c: 7.8 (3 weeks ago), Creatinine: 1.4
  ------------------ ----------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 Agent 4: Communication Agent**                                   |
|                                                                       |
| *Track: Multi-Agent Systems & Collaboration*                          |
|                                                                       |
| **AI Model: Gemini 1.5 Pro --- Message generation & tone          |
| adaptation**                                                          |
+-----------------------------------------------------------------------+

**What it does**

-   Subscribes to ALL events published on MCP

-   Formats and sends appropriate notifications to guardian, doctor, and
    patient

-   Currently: in-app notifications + email (WhatsApp in Phase 2)

-   Handles all reminder scheduling: medication reminders, refill
    alerts, appointment confirmations

-   Adapts tone: urgent for emergencies, gentle for daily reminders,
    clinical for doctor summaries

**Notification Matrix**

  ------------------ ------------------ ----------------- ---------------
  **Event**          **Guardian**       **Doctor**        **Patient**

  Emergency vitals   🚨 Alert +         Patient summary   Calm
                     hospital + ETA     PDF               reassurance

  Medication time    ---                ---               Gentle reminder

  Missed medication  Alert after 30 min ---               Follow-up nudge

  Refill needed      Stock alert        ---               Pharmacy
                                                          suggestion

  Abnormal lab       Flagged summary    Full lab report   Plain
                                                          explanation

  Wellness concern   3-day distress     Wellness report   ---
                     flag                                 
  ------------------ ------------------ ----------------- ---------------

+-----------------------------------------------------------------------+
| **🧘 Agent 5: Mental Wellness Agent**                                 |
|                                                                       |
| *Track: Public Services & Social Impact*                              |
|                                                                       |
| **AI Model: Gemini 1.5 Pro --- Empathetic conversation + MedGemma |
| for clinical scoring**                                                |
+-----------------------------------------------------------------------+

**What it does**

-   Initiates a daily check-in conversation with the patient (morning,
    via chat interface)

-   Asks structured questions about mood, sleep quality, pain, energy
    levels, social interaction

-   Performs sentiment analysis on free-text responses

-   Tracks mood trends over time --- detects patterns indicating
    depression or cognitive decline

-   Applies PHQ-9 inspired clinical scoring to flag medically
    significant distress

-   Flags guardian if 3 or more consecutive days show distress signals

-   Maintains persistent memory of past conversations --- remembers
    names, stories, preferences

**Sample Daily Check-in Flow**

> Agent: Good morning Rajan! How did you sleep last night?\
> Patient: Not very well, back was hurting.\
> Agent: I\'m sorry to hear that. How are you feeling overall today?\
> \[Sentiment: slightly negative --- back pain + poor sleep\]\
> Patient: Okay I guess. A bit lonely since my son left.\
> \[Sentiment: moderate negative --- loneliness keyword detected\]\
> → Logs: mood_score: 4/10, sleep: poor, pain: moderate, social: low\
> → Day 3 of below-threshold score → triggers guardian alert

**Why both Claude and MedGemma?**

Claude handles the warm, empathetic conversational flow. MedGemma
provides clinical scoring context --- understanding the medical
significance of symptoms like persistent low mood + sleep disturbance +
social withdrawal as a depression indicator.

+-----------------------------------------------------------------------+
| **🙋 Agent 6: Personal Assistant Agent**                              |
|                                                                       |
| *Track: Autonomous & Decision-Making Agents*                          |
|                                                                       |
| **AI Model:Groq – Llama 3.1 70B--- RAG over patient\'s own health     |
| data**                                                                |
+-----------------------------------------------------------------------+

**What it does**

-   Answers patient or guardian questions grounded entirely in the
    patient\'s own health data

-   Uses RAG (Retrieval-Augmented Generation) --- pulls relevant data
    from Supabase before answering

-   Supports natural language queries --- no commands to memorize

-   Responds in simple, non-clinical language appropriate for elderly
    users

-   Connects to MCP for real-time context (e.g., if an emergency just
    occurred, it knows)

**Example Questions it Answers**

  ---------------------------------- ------------------------------------
  **Question**                       **Data Source Used**

  What medicines do I take after     medications table
  dinner?                            

  When is my next appointment?       appointments table

  What did my last blood report say? lab_reports table

  How has my BP been this week?      vitals table (7-day trend)

  Did I take my morning tablet       medication_logs table
  today?                             

  How many Metformin tablets do I    medications.stock_count
  have left?                         
  ---------------------------------- ------------------------------------

**4. Platform Features**

**4.1 Prescription Analyser**

Patient or guardian uploads a photo of a handwritten or printed
prescription through the web dashboard.

  -------------- ------------------------------------- -----------------------
  **Step**       **What Happens**                      **Model Used**

  1\. Upload     Image sent to backend via multipart   ---
                 form upload                           

  2\. Vision     MedGemma 4B multimodal reads the      MedGemma (multimodal)
  Analysis       prescription image                    

  3\. Extraction Extracts: medicine name, dosage,      MedGemma
                 frequency, duration, special          
                 instructions                          

  4\. Validation Cross-checks extracted medicines      Rule engine
                 against known drug database           

  5\. Storage    Saved to medications table, reminders ---
                 auto-scheduled                        

  6\.            Summary shown to user for review      ---
  Confirmation   before saving                         
  -------------- ------------------------------------- -----------------------

**4.2 Lab Report Parser**

Patient uploads a PDF or image of a lab report. The system extracts all
values, flags abnormal ones, and explains results in plain language.

  ---------------------- ------------------ -----------------------------
  **Extracted Value      **Example**        **Action if Abnormal**
  Type**                                    

  Blood glucose          HbA1c: 8.2%        Flag red + plain
  (fasting)                                 explanation + doctor alert

  Kidney function        Creatinine: 1.8    Flag yellow + recommend
                         mg/dL              follow-up

  Lipid profile          LDL: 145 mg/dL     Flag yellow + dietary note

  Complete blood count   Hemoglobin: 9.2    Flag red + doctor
                         g/dL               notification

  Liver enzymes          SGPT: 55 U/L       Flag yellow if mildly
                                            elevated
  ---------------------- ------------------ -----------------------------

**4.3 Medication Reminder System**

-   Scheduler fires at exact medicine time based on
    prescription-extracted schedule

-   Patient sees reminder on dashboard (Phase 2: WhatsApp/SMS)

-   Patient marks as taken or skipped

-   If no response in 30 minutes → guardian is notified

-   Compliance history tracked: percentage of doses taken on time per
    week

**4.4 Tablet Refill Alert**

-   Each medicine has a stock_count and daily_dose in the DB

-   System calculates days_remaining = stock_count / daily_dose

-   When days_remaining \< 5 → alert sent to patient and guardian

-   System can suggest nearest pharmacy or generate a prescription
    refill request

**4.5 Auto Appointment Booking**

-   Guardian or doctor requests appointment via dashboard

-   Agent checks doctor availability slots in DB

-   Matches patient\'s flagged conditions to right specialist

-   Books slot and sends confirmation to patient, guardian, and doctor

-   Pre-fills patient medical form for the appointment

**4.6 Doctor Summary Generator**

On doctor request (one click in portal), the system compiles a
comprehensive clinical summary in under 30 seconds.

  ---------------------- ------------------------------------------------
  **Summary Section**    **Contents**

  Vitals Trend           7-day / 30-day graphs for BP, sugar, heart rate,
                         weight

  Medications            Current meds, dosages, compliance rate

  Recent Lab Values      Latest results with flagged abnormals
                         highlighted

  Wellness Score         7-day mood and sleep trend from daily check-ins

  Flagged Concerns       Any alerts triggered in past 30 days with
                         context

  Active Conditions      Diagnosis list with last review date
  ---------------------- ------------------------------------------------

**5. Website Structure**

**5.1 Pages & Components**

  ---------------- ---------------------------------- --------------------
  **Page**         **Key Components**                 **Users**

  Landing Page     Hero, problem stats, how it works, Public
                   agent overview, CTA                

  Patient          Vitals graph, meds tracker,        Patient / Family
  Dashboard        appointments, lab results, chat    
                   assistant                          

  Guardian         Alert feed, emergency history,     Guardian
  Dashboard        hospital rationale cards, wellness 
                   trend                              

  Doctor Portal    Patient cards, one-click summary,  Doctor
                   appointment schedule, flagged labs 

  Admin Panel      Add/edit patients + doctors +      Admin
                   hospitals, view MCP event logs,    
                   configure thresholds               
  ---------------- ---------------------------------- --------------------
**6. Backend & Infrastructure**

**6.1 Tech Stack --- Backend**

  ---------------- --------------------- ---------------------------------
  **Layer**        **Technology**        **Purpose**

  API Framework    FastAPI (Python)      High-performance async REST API

  Agent Framework  LangGraph             Agent state machines and
                                         orchestration

  MCP Server       Custom FastAPI        Event bus between agents
                   websocket layer       

  Database         Supabase (PostgreSQL) Primary data store + auth +
                                         realtime

  Task Scheduler   APScheduler           Medication reminders, daily
                                         check-ins

  PDF Generation   WeasyPrint /          Doctor summary PDFs
                   ReportLab             

  Image Processing Pillow + base64       Prescription and lab report
                                         uploads

  MedGemma Access  HuggingFace Inference Medical image and text analysis
                   API                   

  Claude Access    Anthropic Python SDK  Agent reasoning and communication

  Maps             Google Maps API       Hospital distance and routing
  ---------------- --------------------- ---------------------------------

**6.2 Database Schema**

**patients**

> id UUID PRIMARY KEY\
> name TEXT NOT NULL\
> age INTEGER\
> gender TEXT\
> conditions TEXT\[\] \-- e.g. \[\'hypertension\', \'diabetes\'\]\
> allergies TEXT\[\] \-- e.g. \[\'penicillin\'\]\
> blood_group TEXT\
> guardian_id UUID REFERENCES users(id)\
> doctor_id UUID REFERENCES doctors(id)\
> phone TEXT\
> address TEXT\
> created_at TIMESTAMPTZ DEFAULT NOW()

**vitals**

> id UUID PRIMARY KEY\
> patient_id UUID REFERENCES patients(id)\
> bp_systolic INTEGER\
> bp_diastolic INTEGER\
> heart_rate INTEGER\
> blood_sugar DECIMAL\
> weight DECIMAL\
> spo2 DECIMAL\
> temperature DECIMAL\
> notes TEXT\
> logged_at TIMESTAMPTZ DEFAULT NOW()

**medications**

> id UUID PRIMARY KEY\
> patient_id UUID REFERENCES patients(id)\
> name TEXT NOT NULL\
> dosage TEXT \-- e.g. \'500mg\'\
> frequency TEXT \-- e.g. \'twice daily after meals\'\
> timing TEXT\[\] \-- e.g. \[\'08:00\', \'20:00\'\]\
> stock_count INTEGER\
> daily_dose INTEGER\
> refill_alert BOOLEAN DEFAULT TRUE\
> prescribed_by UUID REFERENCES doctors(id)\
> start_date DATE\
> end_date DATE

**alerts**

> id UUID PRIMARY KEY\
> patient_id UUID REFERENCES patients(id)\
> type TEXT \-- EMERGENCY_VITALS \| INACTIVITY \| TREND_WARNING\
> severity TEXT \-- CRITICAL \| HIGH \| MEDIUM \| INFO\
> payload JSONB \-- full context of the alert\
> resolved BOOLEAN DEFAULT FALSE\
> resolved_by UUID\
> triggered_at TIMESTAMPTZ DEFAULT NOW()

**mcp_events (Audit Log)**

> id UUID PRIMARY KEY\
> source_agent TEXT \-- e.g. \'health_monitoring_agent\'\
> target_agent TEXT \-- e.g. \'care_decision_agent\'\
> event_type TEXT \-- e.g. \'EMERGENCY_VITALS\'\
> patient_id UUID REFERENCES patients(id)\
> payload JSONB\
> processed BOOLEAN DEFAULT FALSE\
> created_at TIMESTAMPTZ DEFAULT NOW()

**7. AI Models --- Full Breakdown**

  --------------------- ---------------- --------------------- -------------
  **Task**              **Model**        **Why This Model**    **Access
                                                               Method**

  Prescription image    MedGemma 4B      Trained on medical    HuggingFace
  analysis              multimodal       documents,            free API
                                         understands           
                                         handwritten Rx        

  Lab report parsing    MedGemma 4B      Knows clinical        HuggingFace
                        multimodal       reference ranges,     free API
                                         flags abnormals       
                                         accurately            

  Clinical reasoning    MedGemma 4B text Medical context       HuggingFace
  (Care Decision)                        awareness,            free API
                                         drug-condition        
                                         knowledge             

  Agent orchestration              Best-in-class         Anthropic SDK
                              reasoning, tool use,  
                                         structured output     

  Patient communication Claude           Empathetic, clear     Anthropic SDK
  & tone                (Anthropic)      language, adapts to   
                                         non-technical users   

  Emergency             Claude           Multi-step reasoning  Anthropic SDK
  coordination logic    (Anthropic)      under urgency         

  Wellness conversation Claude           Warm, empathetic,     Anthropic SDK
                        (Anthropic)      persistent memory via 
                                         Mem0                  

  Personal assistant    Claude           Grounded responses    Anthropic SDK
  RAG                   (Anthropic)      from retrieved        
                                         patient data          
  Doctor summary         +         Clinical accuracy     Both APIs
  generation            MedGemma         (MedGemma) + readable 
                                         output (Claude)       
  --------------------- ---------------- --------------------- -------------

**7.1 Getting MedGemma Free (HuggingFace)**

-   Go to huggingface.co and create a free account

-   Search for \'google/medgemma-4b-it\' and accept the model terms of
    service (takes 2 minutes)

-   Generate a free API token from Settings → Access Tokens

-   Use the Inference API endpoint --- free tier allows \~100
    requests/hour, sufficient for demo

> import requests\
> \
> HF_TOKEN = \'hf_your_token_here\'\
> API_URL =
> \'https://api-inference.huggingface.co/models/google/medgemma-4b-it\'\
> headers = {\'Authorization\': f\'Bearer {HF_TOKEN}\'}\
> \
> def analyze_prescription(image_base64: str) -\> dict:\
> payload = {\
> \'inputs\': {\
> \'image\': image_base64,\
> \'text\': \'Extract all medicines, dosages, and frequencies from this
> prescription.\'\
> }\
> }\
> response = requests.post(API_URL, headers=headers, json=payload)\
> return response.json()

**8. Project Folder Structure**

**9. Environment Setup (.env)**
> \
> \# ── HuggingFace (MedGemma) ──────────────────────────────\
> HF_API_TOKEN=hf_your_token_here\
> MEDGEMMA_MODEL=google/medgemma-4b-it\
> \
> \# ── Supabase ────────────────────────────────────────────\
> SUPABASE_URL=https://your-project.supabase.co\
> SUPABASE_ANON_KEY=your-anon-key\
> SUPABASE_SERVICE_KEY=your-service-key\
> \
> \# ── Google Maps ─────────────────────────────────────────\
> GOOGLE_MAPS_API_KEY=your-google-maps-key\
> \
> \# ── Twilio (Phase 2 --- WhatsApp) ─────────────────────────\
> TWILIO_ACCOUNT_SID=your-twilio-sid\
> TWILIO_AUTH_TOKEN=your-twilio-token\
> TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886\
> \
> \# ── App Config ──────────────────────────────────────────\
> BACKEND_URL=http://localhost:8000\
> FRONTEND_URL=http://localhost:5173\
> JWT_SECRET=your-super-secret-key

**10. Step-by-Step Setup Guide**


**Step 2 --- Supabase Setup**

-   Go to supabase.com → New Project → name it \'eldercare-ai\'

-   Copy Project URL and anon/service keys into .env

-   Go to SQL Editor → paste and run the full schema.sql from the db/
    folder

-   Run seed.sql to load mock patient data for demo

-   Enable Row Level Security on patient-sensitive tables

**Step 3 --- Backend Setup**

> cd backend\
> python -m venv venv\
> source venv/bin/activate \# Windows: venv\\Scripts\\activate\
> pip install fastapi uvicorn supabase anthropic requests\
> python-dotenv apscheduler langgraph pillow\
> reportlab weasyprint python-multipart\
> \
> \# Run the backend\
> uvicorn main:app \--reload \--port 8000

**Step 4 --- Frontend Setup**

> cd frontend\
> npm create vite@latest . \-- \--template react\
> npm install\
> npm install axios react-query zustand recharts\
> \@supabase/supabase-js react-router-dom\
> tailwindcss postcss autoprefixer react-pdf\
> \
> npx tailwindcss init -p\
> \
> \# Run the frontend\
> npm run dev

**Step 5 --- Verify API Keys**

> \# Test Anthropic\
> python -c \"import anthropic; c = anthropic.Anthropic();
> print(c.messages.create(model=\'claude-opus-4-6\', max_tokens=10,
> messages=\[{\'role\':\'user\',\'content\':\'hi\'}\]).content)\"\
> \
> \# Test MedGemma (HuggingFace)\
> python -c \"import requests; r =
> requests.post(\'https://api-inference.huggingface.co/models/google/medgemma-4b-it\',
> headers={\'Authorization\':\'Bearer YOUR_TOKEN\'},
> json={\'inputs\':\'test\'}); print(r.status_code)\"\
> \
> \# Test Supabase\
> python -c \"from supabase import create_client; c =
> create_client(\'URL\',\'KEY\');
> print(c.table(\'patients\').select(\'id\').limit(1).execute())\"

**11. 24-Hour Hackathon Build Plan**

> ⚠️ This is a survival plan --- prioritize ruthlessly. Working demo \>
> perfect code.

  -------------- ------------------------------- --------------- --------------
  **Time**       **Task**                        **Owner**       **Priority**

  0:00--1:00     GitHub repo, folder structure,  Full team       🔴 CRITICAL
                 .env, Supabase schema, seed                     
                 data                                            

  1:00--3:00     FastAPI: patient/vitals/meds    Backend dev 1   🔴 CRITICAL
                 CRUD endpoints                                  

  1:00--3:00     React: routing, Supabase auth,  Frontend dev    🔴 CRITICAL
                 base layout                                     

  3:00--5:00     MCP Server: event bus, schema,  Backend dev 2   🔴 CRITICAL
                 logging                                         

  5:00--7:00     Health Monitoring Agent + Care  Agent dev 1     🔴 CRITICAL
                 Decision Agent                                  

  5:00--7:00     Patient Dashboard UI: vitals    Frontend dev    🔴 CRITICAL
                 graph, meds                                     

  7:00--9:00     Emergency Coordination +        Agent dev 1+2   🔴 CRITICAL
                 Communication Agent                             

  7:00--9:00     Guardian Dashboard: alert feed, Frontend dev    🔴 CRITICAL
                 hospital card                                   

  9:00--11:00    Full emergency pipeline test    Full team       🔴 CRITICAL
                 end-to-end                                      

  11:00--13:00   Prescription Analyser (MedGemma Backend dev 1   🟡 HIGH
                 multimodal)                                     

  11:00--13:00   Doctor Portal + Admin Panel     Frontend dev    🟡 HIGH

  13:00--15:00   Lab Report Parser + Doctor PDF  Backend dev 2   🟡 HIGH
                 Summary                                         

  15:00--17:00   Mental Wellness Agent daily     Agent dev 1     🟡 HIGH
                 check-in                                        

  17:00--19:00   Personal Assistant Agent (RAG)  Agent dev 2     🟡 HIGH

  19:00--21:00   Landing page, UI polish, demo   Frontend dev    🟡 HIGH
                 data cleanup                                    

  21:00--22:00   Full end-to-end 2 AM scenario   Full team       🔴 CRITICAL
                 rehearsal                                       

  22:00--23:00   Bug fixes, fallback mocks for   Full team       🔴 CRITICAL
                 any broken agents                               

  23:00--24:00   Demo script rehearsal, backup   All             🔴 CRITICAL
                 screen recording                                
  -------------- ------------------------------- --------------- --------------

**12. The 2 AM Demo Scenario**

> This is your money shot. Rehearse this until it runs in under 60
> seconds flawlessly.

**The Story**

Rajan Kumar, 72, lives alone in Kochi. His daughter is in Bangalore.
It\'s 2 AM. Rajan\'s blood pressure spikes to 185/115. Here\'s what
ElderCare AI does --- automatically, without anyone pressing a button.

  ------------ ------------------------------- --------------------------------
  **Second**   **What Happens**                **Shown On Screen**

  0--5s        Rajan logs BP 185/115 into the  Patient vitals input
               app                             

  5--10s       Health Monitoring Agent detects MCP event log lights up
               threshold breach, publishes     
               EMERGENCY_VITALS to MCP         

  10--20s      Care Decision Agent pulls       Hospital decision card appears
               Rajan\'s history (cardiac,      on Guardian Dashboard
               hypertension), scores           
               hospitals, selects Apollo       

  20--30s      Emergency Coordination Agent    Dispatch confirmation appears
               dispatches mock ambulance, gets 
               ETA 8 mins, sends patient       
               summary                         

  30--40s      Communication Agent fires:      Guardian Dashboard alert pops in
               in-app alert to daughter with   real time
               hospital name, rationale, ETA   

  40--50s      Doctor receives patient summary Doctor portal notification
               notification                    

  50--60s      Full MCP audit trail visible    Admin panel MCP log
               --- every agent action          
               timestamped                     
  ------------ ------------------------------- --------------------------------

> 💡 Judge Hook: Ask them --- \'What would have happened without this
> system? Rajan lies there for 3 hours before his daughter finds out.\'
> Then show the 60-second response.

**13. Why This Project Wins**

  ---------------------- ---------------------------------- --------------
  **Judging Criteria**   **How ElderCare AI Scores**        **Rating**

  Agentic AI             6 specialized agents with clear    ⭐⭐⭐⭐⭐
                         roles, not a monolithic LLM        

  MCP Architecture       Central event bus with pub/sub,    ⭐⭐⭐⭐⭐
                         audit logging --- rare at          
                         hackathons                         

  Real India Problem     100M+ elderly, massive unmet need, ⭐⭐⭐⭐⭐
                         emotionally resonant               

  Model Selection        MedGemma for medical tasks +       ⭐⭐⭐⭐⭐
                         Claude for orchestration ---       
                         thoughtful choice                  

  Demo Quality           2 AM scenario is dramatic, fast,   ⭐⭐⭐⭐⭐
                         emotional --- judges will remember 
                         it                                 

  Completeness           3 user types, 6 agents, 5          ⭐⭐⭐⭐⭐
                         features, full DB schema --- not a 
                         feature, a platform                

  Scalability            WhatsApp as Phase 2, open to any   ⭐⭐⭐⭐⭐
                         language, state or region          
  ---------------------- ---------------------------------- --------------

*ElderCare AI --- Build for India Hackathon 2026*

*Kerala Startup Mission, Kochi \| February 27--28, 2026*
