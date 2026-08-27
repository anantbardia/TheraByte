# TheraByte

Live Demo: https://therabyte.vercel.app/

TheraByte is a web-based mental health platform combining AI-driven Cognitive Behavioral Therapy (CBT) and Dialectical Behavior Therapy (DBT) interventions, automated risk detection, therapist management, and multimodal interaction interfaces.

## Key Modules

### Clinical Assessment Workflow
- Multi-stage onboarding protocol directing users through initial screening, a five-question micro-assessment, and case routing.
- Contextual tone adaptation targeting distinct user age brackets (13–19, 20–30, and 30+).

### Psychological & Intervention Engine
- LLM integration utilizing Groq and Llama 3.3 70B for real-time therapeutic conversational processing.
- Machine learning classification for identifying cognitive distortions (catastrophizing, black-and-white thinking, overgeneralization) and primary emotional states.
- In-app therapeutic modules including DBT opposite-action frameworks, 4-7-8 breathing exercises, Progressive Muscle Relaxation (PMR), grounding routines, and structured thought journals.

### Crisis Detection & Safety Protocols
- Pattern matching and rule-based heuristic filters for real-time evaluation of distress, self-harm, and panic indicators.
- Automated escalation protocols triggering crisis response UI overlays, regional helpline contacts, and step-by-step grounding sequences.
- Floating SOS modal accessible across patient interfaces.

### Therapist Analytics & Management Panel
- Patient monitoring dashboard tracking mood distributions, calculated risk scores, appointment scheduling, and feedback entries.
- Automated longitudinal summary generation for clinical review.

### Multimodal Interface
- Voice-to-voice interaction utilizing browser speech recognition, continuous silence detection, and speech synthesis.
- Video session interface leveraging WebRTC protocols and TURN server fallbacks.

## Architecture

```
                      +-------------------------+
                      |  React + Vite Frontend  |
                      |  (Patient & Therapist)  |
                      +------------+------------+
                                   | WebSockets / REST
                                   v
                      +-------------------------+
                      |     FastAPI Backend     |
                      +------------+------------+
                                   |
         +-------------------------+-------------------------+
         |                         |                         |
         v                         v                         v
+------------------+      +------------------+      +------------------+
| Groq LLM Engine  |      |  ML Classifiers  |      |  SQLite Storage  |
| (Llama 3.3 70B)  |      | (Distortion/Risk)|      | & Trigram Vector |
+------------------+      +------------------+      +------------------+
```

### Technology Stack
- Frontend: React 18, Vite, Vanilla CSS, WebSockets API.
- Backend: FastAPI, Python 3.11, Async WebSockets, custom trigram vector indexing.
- Machine Learning & Storage: Joblib-serialized scikit-learn models, Groq API, SQLite.
