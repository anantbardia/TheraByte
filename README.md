# TheraByte 🧠

🔗 **Live Application**: [https://therabyte.vercel.app/](https://therabyte.vercel.app/)

> **TheraByte** is an intelligent, assessment-first mental health platform designed to deliver structured, evidence-based AI psychological support (CBT/DBT), real-time crisis intervention, therapist telemetry, and seamless multimodal sessions.

---


## 🌟 Key Features

### 1. 📋 Assessment-First Clinical Workflow
- **Structured Onboarding**: Multi-phase triage workflow guiding users from initial welcome through a 5-question micro-assessment into tailored therapy routes.
- **Adaptive Persona & Age Context**: Dynamic prompt engineering tailoring therapeutic tone for teens (13–19), young adults (20–30), and mature adults (30+).

### 2. 💬 CBT & DBT Psychological Engine
- **Powered by Groq & Llama 3.3 70B**: High-throughput, sub-second latency therapeutic reasoning engine.
- **Cognitive Distortion & Emotion Detection**: Built-in ML classifiers detecting cognitive distortions (catastrophizing, all-or-nothing thinking, overgeneralization) and mood states.
- **Interactive Exercises**: Embedded DBT opposite-action modal, 4-7-8 breathing exercises, PMR (Progressive Muscle Relaxation), grounding routines, and thought journaling.

### 3. 🚨 Multi-Layer Safety & Crisis Protocols
- **Real-Time Signal Analysis**: Dual-layer heuristic regex and pattern detection for suicidal ideation, self-harm, hopelessness, and panic attack indicators.
- **Automated Overrides**: Instantaneous crisis protocol activation providing helpline resources (988 US / Vandrevala Foundation India) and directive grounding exercises.
- **Emergency SOS Trigger**: One-touch floating SOS overlay accessible from anywhere in the application.

### 4. 📊 Therapist Telemetry & Analytics Dashboard
- **Clinical Overview**: Real-time patient mood trends, risk score tracking, appointment booking management, and session feedback logs.
- **Case Summarization**: AI-generated longitudinal patient profiles for attending therapists.

### 5. 🎙️ Multimodal Interactions
- **Voice-to-Voice Therapy**: Continuous silence-detection auto-looping voice interface with web speech synthesis.
- **Video Sessions**: Integrated WebRTC video room layout with TURN server fallback for therapist-patient consultations.

---

## 🏗️ System Architecture

```
                       ┌─────────────────────────┐
                       │   React + Vite Frontend │
                       │    (Patient & Therapist)│
                       └────────────┬────────────┘
                                    │ WebSockets / REST
                                    ▼
                       ┌─────────────────────────┐
                       │     FastAPI Backend     │
                       └────────────┬────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Groq LLM Engine │      │  ML Classifiers  │      │ SQLite Storage   │
│ (Llama 3.3 70B)  │      │ (Distortion/Risk)│      │ & Trigram Vector │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

- **Frontend**: React 18, Vite, Vanilla CSS with custom glassmorphism design system, WebSockets.
- **Backend**: FastAPI (Python 3.11), Uvicorn, Async WebSockets, Zero-download Trigram Vector Store.
- **Machine Learning**: Custom Joblib classifiers for distortion and crisis scoring; Groq inference integration.

---

## 🔒 Copyright & Ownership

**TheraByte** is a personal portfolio project developed by **Anant Bardia**. 
All Rights Reserved. This repository is displayed for project portfolio and demonstration purposes only.
