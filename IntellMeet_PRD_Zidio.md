# IntellMeet – Product Requirements Document

**AI-Powered Enterprise Meeting & Collaboration Platform**

---

| Field | Details |
|---|---|
| **Author** | Abhinav – KIIT University, B.Tech CS |
| **Organization** | Zidio Development – Web Development (MERN) Domain |
| **Date** | June 2026 |
| **Version** | 1.0 – Initial Release |
| **Stack** | MERN + WebRTC + Socket.io + OpenAI + Redis + Kubernetes |

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals and Success Metrics](#2-goals-and-success-metrics)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [28-Day Execution Plan](#7-28-day-execution-plan)
8. [Security Design](#8-security-design)
9. [Risks and Mitigations](#9-risks-and-mitigations)
10. [Submission Checklist](#10-submission-checklist)

---

## 1. Product Overview

### 1.1 What Is IntellMeet?

IntellMeet is a production-grade enterprise meeting and collaboration platform built on the MERN stack. It combines real-time video conferencing, AI-powered meeting intelligence (live transcription, automated summaries, smart action item extraction), persistent team chat, project management boards, and analytics — all in one cohesive product.

The project is designed to demonstrate industry-grade full-stack engineering skills during a one-month internship at Zidio Development. Every architectural and technology decision is made with production constraints in mind: scalability, security, observability, and zero-downtime deployments.

### 1.2 The Problem Being Solved

Unproductive meetings are one of the most measurable productivity drains in enterprise teams. The core issues are:

- Meeting notes are informal, inconsistent, or simply never written.
- Action items agreed verbally in a meeting get lost — no one is accountable.
- Follow-up emails take significant time to draft and send after every meeting.
- There is no searchable, structured history of what was discussed and decided.

IntellMeet addresses all four by automating the post-meeting workflow using AI, while keeping the real-time meeting experience clean and low-friction.

### 1.3 Target Users

| User Type | Primary Use Case | Key Need |
|---|---|---|
| Team Leads / Managers | Run meetings, review AI summaries, assign tasks | Speed and accuracy of post-meeting follow-up |
| Individual Contributors | Attend meetings, view action items assigned to them | Clarity on what they are responsible for |
| Admins / IT | Manage teams, roles, workspace settings | Security, access control, audit trails |
| Executives | Review analytics, productivity reports | High-level meeting health insights |

---

## 2. Goals and Success Metrics

### 2.1 Business Goals

- Reduce meeting follow-up time by 40–60% through AI-generated summaries and automatic action item extraction.
- Improve team task accountability with assignee-linked action items tracked post-meeting.
- Provide a single platform for video meetings, chat, notes, and task management — eliminating tool-switching.
- Demonstrate enterprise-grade engineering in a portfolio-quality MERN project.

### 2.2 Technical Goals

- Support 500–5,000 concurrent meeting participants with horizontal scaling.
- Maintain end-to-end latency under 200ms for real-time features (video, chat, AI status updates).
- Handle 10,000+ concurrent meetings during peak usage.
- Achieve 99.95% uptime with zero-downtime deployments.
- Pass OWASP Top 10 security review with no critical findings.

### 2.3 Submission Goals (Zidio Evaluation)

| # | Deliverable | Description | Weight | Target |
|---|---|---|---|---|
| 1 | Documentation PDF | This PRD + architecture + timeline (8–15 pages, A4) | 25% | Full marks |
| 2 | Live Public Demo | HTTPS URL, no forced login, loads under 5 seconds | 30% | Full marks |
| 3 | GitHub Repository | Clean folder structure, semantic commits, no secrets | 20% | Full marks |
| 4 | README.md | Detailed setup guide, architecture overview, screenshots | 15% | Full marks |
| 5 | Demo Video | 3–7 min walkthrough showing multi-user real-time session | 10% | Full marks |

---

## 3. Functional Requirements

### 3.1 Authentication & User Management (F01)

**What it does**

Handles how users register, log in, and maintain sessions. Also defines roles and team membership.

**Key behaviors**

- Users can sign up with email/password or via Google OAuth2.
- Passwords are hashed using bcrypt before storage — no plaintext ever persists.
- Login returns a short-lived JWT access token (15 min) and a long-lived refresh token (7 days) stored in an HTTP-only cookie.
- Two roles exist: Admin (full access) and Member (meeting/task access only).
- Admins can invite teammates via email link with a signed invite token.
- Rate limiting on auth endpoints (max 10 login attempts per 15 minutes per IP).

**Acceptance criteria**

- Registration, login, logout, and token refresh all work end-to-end in under 500ms.
- Accessing protected routes without a valid token returns HTTP 401.
- A brute-force attempt (11+ failed logins) triggers a 429 response.

---

### 3.2 Real-Time Video Meetings (F02)

**What it does**

The core conferencing module. Users create or join meetings, share video/audio/screen, and control participant access.

**Key behaviors**

- Meeting host creates a room with a unique shareable link.
- WebRTC handles peer-to-peer video/audio; Socket.io acts as the signaling server.
- For meetings with more than 4 participants, the architecture scales via a selective forwarding unit (SFU) model using mediasoup or similar.
- Screen sharing via browser `getDisplayMedia` API with a clear toggle button.
- Meeting recording starts on host command; audio/video stream is captured and uploaded to Cloudinary/S3 after the meeting ends.
- Live captions are rendered in real time using OpenAI Whisper (streaming mode).
- Host can mute any participant, remove them from the meeting, or lock the room.

**Acceptance criteria**

- Video and audio work between 2–50 participants with under 200ms latency on a standard broadband connection.
- Screen sharing activates in under 2 seconds.
- Recording is available for playback within 5 minutes of meeting end.

---

### 3.3 AI Meeting Intelligence (F03)

**What it does**

The differentiating feature. During and after a meeting, AI processes the audio transcript to produce structured, actionable outputs.

**Key behaviors**

- Live transcription streams to all participants via Socket.io — each speaker's text appears in real time with speaker labels.
- On meeting end, the full transcript is sent to OpenAI GPT-4 to generate: a concise 200–400 word summary, a bulleted list of decisions made, and a list of action items each with an assignee name (inferred from transcript context) and suggested due date.
- The AI output is editable — meeting participants can correct assignees or rephrase action items before they get saved.
- All outputs are persisted to MongoDB and linked to the meeting document.

**Accuracy targets**

- Transcription accuracy > 90% on clear audio (verified against manual transcript on test recordings).
- Action item extraction precision > 85% — fewer than 15% of extracted items should be false positives.

**Acceptance criteria**

- Summary and action items are generated within 60 seconds of meeting end for a 30-minute session.
- The edit-and-confirm flow completes before items sync to the task board.

---

### 3.4 Real-Time Chat & Collaboration (F04)

**What it does**

In-meeting and persistent team chat, plus shared collaborative notes.

**Key behaviors**

- In-meeting chat panel with typing indicators and message timestamps.
- Persistent team channel per workspace — messages are stored and searchable after the meeting.
- `@mention` support that triggers a notification to the mentioned user.
- Shared meeting notes (rich text) that all participants can edit simultaneously using operational transforms or CRDT.
- File attachment support (images, PDFs) via Cloudinary.

---

### 3.5 Post-Meeting Dashboard (F05)

**What it does**

A central place to access everything that happened in a meeting after it ends.

**Key behaviors**

- Meeting history list with date, duration, participants, and AI summary preview.
- Full transcript viewer with search and speaker filter.
- Recording playback inline with synchronized transcript scroll.
- Action items panel showing status (pending / in progress / done) and assigned user.
- Export options: PDF summary, CSV of action items, plain text transcript.

---

### 3.6 Team & Project Management (F06)

**Key behaviors**

- Team workspaces with isolated data per organization.
- Kanban boards with columns: Backlog, In Progress, In Review, Done.
- Task cards auto-created from AI action items; also manually creatable.
- Each card has: title, description, assignee, due date, priority, and linked meeting.
- Real-time board updates via Socket.io — moving a card reflects instantly for all viewers.

---

### 3.7 Analytics & Insights (F07)

**Key behaviors**

- Meeting frequency chart by team or individual over configurable time ranges.
- Average meeting duration and talk-time distribution per participant.
- Action item completion rate — how many items raised in meetings actually get closed.
- Exportable CSV/PDF reports for team leads and executives.

---

## 4. Non-Functional Requirements

| Category | Target | Implementation Approach | Why It Matters |
|---|---|---|---|
| Latency | < 200ms real-time | WebRTC + Socket.io, Redis for in-memory state | Video and chat must feel instant |
| Throughput | 10,000+ concurrent meetings | Horizontal scaling + Socket.io clustering | Peak usage on Monday mornings / quarterly reviews |
| Availability | 99.95% uptime SLA | Kubernetes self-healing, multi-replica deploys | Business-critical meetings cannot fail mid-session |
| Security | OWASP Top 10 compliant | JWT + bcrypt, Helmet.js, input sanitization, rate limiting | Sensitive business conversations must stay private |
| Scalability | 500–5,000 concurrent users | Kubernetes autoscaling + Helm, Redis clustering | Must survive company-wide town halls |
| Load Time | < 3s initial page load | Vite code-splitting, CDN for static assets, lazy routes | First impressions and demo quality depend on this |
| Observability | Full stack visibility | Prometheus + Grafana + Sentry error tracking | Bugs in prod must be found and fixed fast |

---

## 5. Technology Stack

| Layer | Technology | Rationale | Alternatives Considered |
|---|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Fast HMR, strong typing, code-splitting out of the box | Next.js (overkill for SPA) |
| UI Components | shadcn/ui + Tailwind CSS v4 | Accessible, composable, no lock-in | MUI, Chakra UI |
| State Management | TanStack Query + Zustand | Server state + lightweight client state — no Redux complexity | Redux Toolkit, SWR |
| Backend | Node.js + Express | Lightweight, fast I/O, huge ecosystem | NestJS (more structured but heavier) |
| Database | MongoDB + Mongoose | Flexible schema suits meeting/task data shapes | PostgreSQL (relational schema less flexible here) |
| Real-Time | Socket.io + WebRTC | Bidirectional events + peer-to-peer video | SSE (unidirectional), Agora SDK (paid) |
| AI | OpenAI Whisper + GPT-4 | Best-in-class transcription + summarization quality | Hugging Face (self-hosted, more infra complexity) |
| Cache | Redis | In-memory session store, pub/sub for Socket.io scaling | Memcached (no pub/sub) |
| Authentication | JWT + bcrypt + OAuth2 | Stateless, secure, industry standard | Sessions (stateful, harder to scale) |
| File Storage | Cloudinary / AWS S3 | Managed CDN delivery, automatic media optimization | Local storage (not scalable) |
| Containerization | Docker multi-stage | Lean images, consistent environments across dev/prod | Bare metal (inconsistent envs) |
| Orchestration | Kubernetes + Helm | Autoscaling, self-healing, rolling deployments | Docker Compose (not prod-ready at scale) |
| CI/CD | GitHub Actions | Native to GitHub, free for public repos, easy YAML config | CircleCI, Jenkins |
| Monitoring | Prometheus + Grafana + Sentry | Metrics, dashboards, and error tracking — full coverage | Datadog (paid) |

---

## 6. System Architecture

### 6.1 High-Level Overview

The system follows a three-tier architecture with a clear separation between the client, the application servers, and the data layer. Real-time concerns (video signaling, chat, notifications) are handled as a separate concern from the REST API layer.

| Layer | Components |
|---|---|
| **Client** | React 19 SPA served from CDN (Vercel / S3 + CloudFront). Communicates via REST (TanStack Query) and WebSocket (Socket.io client). WebRTC peer connections for video. |
| **API** | Node.js/Express REST server. Handles auth, meeting CRUD, AI job dispatch, analytics queries. Stateless — multiple replicas behind a load balancer. |
| **Real-Time** | Socket.io server (separate process or same process with namespace isolation). Uses Redis Pub/Sub adapter to synchronize events across multiple server replicas. |
| **AI Worker** | Background Node.js worker process. Receives meeting transcript chunks via Redis queue, calls OpenAI Whisper (transcription) and GPT-4 (summary + action items), writes results back to MongoDB. |
| **Data** | MongoDB Atlas (primary data store). Redis (session cache, pub/sub, job queue). Cloudinary/S3 (recording and file storage). |
| **Infra** | Kubernetes cluster (3 node minimum). Docker multi-stage images. GitHub Actions pipeline for test → build → push → deploy. Prometheus + Grafana for metrics. Sentry for error tracking. |

### 6.2 Data Flow: Meeting with AI Intelligence

The following describes the end-to-end data flow from meeting start to action items appearing on the Kanban board:

1. **Host creates a meeting room.** REST API creates a Meeting document in MongoDB and returns a room ID and Socket.io room token.

2. **Participants join via the shareable link.** Frontend connects to the Socket.io server using the room token. WebRTC peer connections are negotiated via Socket.io signaling.

3. **Audio is streamed in 5-second chunks** from the browser to the API server, which forwards them to the AI Worker via a Redis job queue.

4. **AI Worker calls OpenAI Whisper per chunk.** Transcription results stream back to Socket.io, which broadcasts them to all participants as live captions.

5. **On meeting end**, the AI Worker receives the full transcript and calls GPT-4 to generate the summary and action items. Results are stored in MongoDB and emitted via Socket.io to all clients.

6. **A confirmation modal appears** for the host to review and edit AI outputs before they are pushed to the Kanban board as Task documents.

---

## 7. 28-Day Execution Plan

### Week 1 – Core Backend & Authentication Foundation (Days 1–7)

| Day | Focus | Deliverables |
|---|---|---|
| 1 | Project Foundation | MERN boilerplate (Vite + Express), MongoDB connection, folder structure, initial git commit with `.gitignore`, README skeleton. |
| 2 | Authentication | User model, signup/login routes, JWT access + refresh token flow, bcrypt password hashing. Postman collection for auth endpoints. |
| 3 | Auth Polish | Profile creation, avatar upload via Cloudinary, protected route middleware, `express-rate-limit` on auth routes, Google OAuth2 integration. |
| 4 | Meeting Model + WebRTC | Meeting MongoDB schema, full CRUD routes, WebRTC peer connection logic (offer/answer/ICE candidate handling via Socket.io signaling). |
| 5 | Redis + Socket.io | Redis setup for session storage and meeting state caching. Socket.io server configured with Redis Pub/Sub adapter for multi-replica support. |
| 6 | Chat + Notifications | Basic in-meeting chat with message persistence. Real-time notification events for joins, leaves, and mentions. |
| **7** | **Week 1 Checkpoint** | All backend routes tested via Postman. Auth flow end-to-end verified. Real-time Socket.io connection confirmed. README updated. All changes committed. |

### Week 2 – Frontend & Real-Time Meeting Core (Days 8–14)

| Day | Focus | Deliverables |
|---|---|---|
| 8 | React Setup | React 19 + TypeScript + Vite app. shadcn/ui + Tailwind CSS v4 configured. TanStack Query + Zustand wired up. Socket.io client connected to backend. |
| 9 | Auth UI | Login, signup, and profile pages. Protected route components. JWT refresh handled silently via axios interceptor. |
| 10 | Meeting Room UI | Meeting lobby page (pre-join camera/mic check), video room layout with participant tiles. WebRTC integration in frontend. |
| 11 | In-Meeting Chat | Chat panel component with typing indicators, message timestamps, and real-time sync via Socket.io. |
| 12 | Screen Share + Record | Screen sharing toggle using `getDisplayMedia`. Recording start/stop controls. Upload-to-storage trigger on meeting end. |
| 13 | Participant Controls | Live participant list with presence indicators, mute/unmute controls, host-only remove and lock-room actions. |
| **14** | **Week 2 Checkpoint** | Full end-to-end meeting: create room, join from two browser tabs, video+audio works, chat syncs, screen sharing functional. Recorded demo clip. |

### Week 3 – AI Intelligence & Collaboration Features (Days 15–21)

| Day | Focus | Deliverables |
|---|---|---|
| 15 | Live Transcription | OpenAI Whisper integration. Audio chunking pipeline (browser → API → AI Worker → Socket.io). Live captions rendered in meeting UI. |
| 16 | Summary + Action Items | Post-meeting GPT-4 pipeline. Generates summary, decision list, and action items with assignees. Results stored in MongoDB. |
| 17 | Post-Meeting Dashboard | Meeting history list, transcript viewer with search, recording playback, AI summary panel, action items panel with status tracking. |
| 18 | Team Workspace | Workspace model, team creation flow, member invite by email, role assignment (Admin/Member). |
| 19 | Kanban Board | Task board with drag-and-drop cards. Auto-creation of task cards from AI action items. Manual task creation. Real-time board sync via Socket.io. |
| 20 | Notifications | `@mention` notifications, action item assignment alerts, meeting invite emails via SendGrid or Nodemailer. |
| **21** | **Week 3 Checkpoint** | Full AI flow tested end-to-end: meeting → transcription → summary → action items → Kanban board. AI accuracy manually evaluated on 3 sample meetings. |

### Week 4 – Deployment, Monitoring & Production Polish (Days 22–28)

| Day | Focus | Deliverables |
|---|---|---|
| 22 | Docker | Multi-stage Dockerfiles for frontend and backend. `docker-compose.yml` for local dev with all services (MongoDB, Redis, app). Images verified locally. |
| 23 | Kubernetes | K8s manifests: Deployments, Services, ConfigMaps, Secrets. Helm chart for parameterized environment configs. |
| 24 | CI/CD Pipeline | GitHub Actions workflow: lint → test → Docker build → push to registry → `kubectl apply`. Secrets managed via GitHub Encrypted Secrets. |
| 25 | Cloud Deployment | Frontend deployed to Vercel. Backend + Redis + workers deployed on Render or AWS EC2. MongoDB Atlas connected. HTTPS enforced. |
| 26 | Monitoring | Prometheus scrape config. Grafana dashboards for API latency, Socket.io connection count, error rates. Sentry SDK integrated in both frontend and backend. |
| 27 | Load Test + Security | JMeter load test simulating 500 concurrent users. OWASP ZAP automated security scan. Fix all high/critical findings. |
| **28** | **Final Submission Day** | Full QA pass on all 7 features. README finalized with setup guide + screenshots. Demo video recorded (multi-user session shown). PDF documentation exported. Submitted to Zidio dashboard. |

---

## 8. Security Design

Security is not a feature added at the end — it is built into the design from Day 1. The following measures address the OWASP Top 10 and production-level security hygiene.

| Threat / Concern | Mitigation | Implementation |
|---|---|---|
| Broken Authentication | JWT with short expiry (15 min) + HTTP-only refresh cookie | `jsonwebtoken` + `cookie-parser`, HTTPS-only cookie flags |
| Brute Force Login | Rate limiting per IP on auth endpoints | `express-rate-limit`: 10 req / 15 min on `/auth/*` |
| Injection (NoSQL) | Input sanitization on all MongoDB queries | `mongoose-sanitize` + `express-mongo-sanitize` middleware |
| XSS | Content Security Policy headers, output encoding | `Helmet.js` CSP headers, React's built-in DOM escaping |
| Insecure Direct Object Reference | All resource access checks ownership via userId in JWT | Middleware validates `req.user.id === resource.ownerId` |
| Secrets in Code | No hardcoded secrets, all via environment variables | `.env` locally, Kubernetes Secrets in prod, GitHub Encrypted Secrets in CI |
| Meeting Eavesdropping | Room tokens validated on Socket.io connection, DTLS for WebRTC | Custom Socket.io auth middleware checks JWT before join |
| Dependency Vulnerabilities | Automated dependency scanning in CI pipeline | `npm audit` run in GitHub Actions, fail build on high severity |

---

## 9. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| WebRTC scaling beyond 4 participants becomes complex | High | Feature gap in demo | Use mediasoup SFU or fallback to 4-person limit for demo; document scaling path clearly in README |
| OpenAI API cost and rate limits during development | Medium | Dev slowdowns | Use mock transcripts during local dev; real API only for integration testing and demo |
| AI transcription accuracy drops on accented or fast speech | Medium | Demo looks bad | Use high-quality microphone for demo recording; allow manual transcript correction before summary |
| 28-day timeline too tight for all 7 features at production quality | High | Incomplete submission | Prioritize F01–F05 for MVP. F06 (Kanban) and F07 (Analytics) as stretch goals. Demo must show the AI pipeline working end-to-end. |
| Free-tier cloud deployment unstable (cold starts, memory limits) | Medium | Live demo fails during evaluation | Record demo video as primary backup. Use Render paid tier if needed for demo week. |
| Kubernetes setup takes too long for internship scope | Medium | Deployment incomplete | Docker Compose + cloud PaaS is acceptable MVP deployment. Document K8s plan thoroughly even if not live. |

---

## 10. Submission Checklist

### Code & Repository

- [ ] Modular folder structure: `/client`, `/server`, `/workers`, `/k8s`, `/docs`
- [ ] ESLint + Prettier configured and passing
- [ ] Semantic commit messages used throughout (`feat:`, `fix:`, `chore:`, `docs:`)
- [ ] Feature branches used with PRs (even if solo)
- [ ] `.gitignore` covers `node_modules`, `.env`, `dist`, `build`
- [ ] No committed secrets or API keys — verified via `git log` scan
- [ ] Unit tests for auth middleware and AI pipeline (target 30–50% coverage)
- [ ] ARIA labels and keyboard navigation on all interactive components

### Live Demo

- [ ] Publicly accessible HTTPS URL — no VPN, no geo-restriction
- [ ] Demo account pre-seeded (no forced sign-up for evaluators)
- [ ] Initial page load under 5 seconds (Lighthouse performance score > 70)
- [ ] Mobile-responsive on 375px viewport (tested on Chrome DevTools)
- [ ] Brief usage instructions on landing page
- [ ] Real-time video meeting working between two browser sessions
- [ ] AI summary and action items generated from a pre-recorded test meeting

### Documentation

- [ ] This PRD included as the project documentation PDF
- [ ] `README.md` includes: project description, tech stack, local setup steps, env variable list, architecture diagram, screenshots
- [ ] Architecture diagram created in Excalidraw or Draw.io
- [ ] Lighthouse scores screenshot included
- [ ] OWASP ZAP scan results screenshot included
- [ ] Personal reflection section written (key learnings, challenges, future roadmap)

### Demo Video

- [ ] 3–7 minutes in length
- [ ] Shows real multi-user session (two separate browser tabs or devices)
- [ ] Demonstrates: joining meeting, video/audio, screen share, in-meeting chat, live captions, AI summary generation, Kanban board with action items
- [ ] Uploaded to YouTube (unlisted), Loom, or Google Drive — link included in README

---

*IntellMeet – Product Requirements Document*
*Prepared by Abhinav | Zidio Development Internship – June 2026 | Version 1.0*
