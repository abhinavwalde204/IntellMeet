# IntellMeet 🚀

**AI-Powered Enterprise Meeting & Collaboration Suite**

IntellMeet is a secure, production-grade enterprise meeting and collaboration suite. It integrates real-time video conferencing, AI-powered automatic transcription, post-meeting summaries, persistent team workspaces, interactive Kanban task boards, and advanced team performance analytics.

---

## 🏗️ Architecture & Features

```
               +-------------------------------------------------+
               |              IntellMeet Client                  |
               |       React 19 + TypeScript + Vite + Nginx      |
               +-------+-----------------------+-----------------+
                       |                       |
            Socket.io  |                       | HTTPS API
            (Real-Time |                       | (Auth, Rooms, Teams)
                       v                       v
               +-------+-----------------------+-----------------+
               |              IntellMeet Server                  |
               |            Node.js + Express.js API             |
               +---+---------------+---------------+-------------+
                   |               |               |
                   |               |               |
                   v               v               v
            +------+------+ +------+------+ +------+------+
            |   MongoDB   | |    Redis    | |  OpenAI API |
            |  Database   | |  PubSub/Web  | |   Whisper   |
            |   Cluster   | |  Socket sync | |   & GPT-4   |
            +-------------+ +-------------+ +-------------+
```

### 📅 Feature Implementation Matrix

| Week | Focus | Core Features Implemented |
|---|---|---|
| **Week 1** | **Backend Foundation** | Express server config, JWT Authentication with short-lived tokens & refresh rotation, custom MongoDB model index validations, and initial Glassmorphism dashboard layout. |
| **Week 2** | **Real-Time Core** | WebRTC video/audio conferencing channels, real-time sync with Socket.io, screen-sharing toggle using `getDisplayMedia`, live participant status lists, and text chats. |
| **Week 3** | **AI Intelligence** | Live audio chunking pipelines, OpenAI Whisper API integrations for automatic transcription, GPT-4 prompt pipelines for action items, Kanban task integration, and dashboard analytics. |
| **Week 4** | **Deployment & Polish** | Multi-stage Docker optimization, Kubernetes deployment manifests, Helm charts, GitHub Actions CI/CD automation, Prometheus metric monitoring, and Sentry instrumentation. |

---

## 🛠️ Technology Stack

*   **Frontend Client:** React 19, TypeScript, Vite, Tailwind CSS v4, Zustand (State Management), TanStack Query (Server State), Socket.io Client.
*   **Backend API Server:** Node.js, Express, Mongoose, Socket.io, Helmet (Headers protection), express-mongo-sanitize, express-rate-limit.
*   **Databases & Caching:** MongoDB (Atlas/Local), Redis.
*   **AI Integration:** OpenAI API (Whisper & GPT-4 pipelines).
*   **Observability:** Sentry SDK (Error Tracking), Prometheus (Metrics Scraping), Grafana Dashboards.
*   **Infrastructure:** Docker, Docker Compose, Kubernetes, Helm Charts, GitHub Actions.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (>= 20.x)
*   Docker Desktop (or local MongoDB + Redis instances)

### Setup & Installation

#### Option A: Running locally with Docker Compose (Recommended)
1.  Clone the repository.
2.  Start all services (MongoDB, Redis, API Server, Nginx Frontend) in one command:
    ```bash
    docker-compose up -d --build
    ```
3.  Access the client dashboard at: `http://localhost:8080`
4.  Access the API gateway at: `http://localhost:5000`

#### Option B: Running locally for Development (Manual)
1.  **Configure environment variables:**
    Create a `server/.env` file with the following keys:
    ```env
    PORT=5000
    MONGO_URI=mongodb://127.0.0.1:27017/intellmeet
    JWT_SECRET=supersecretkey_change_this_in_production
    JWT_REFRESH_SECRET=supersecretrefreshkey_change_this_in_production
    JWT_EXPIRE=15m
    JWT_REFRESH_EXPIRE=7d
    CLIENT_URL=http://localhost:5173
    SENTRY_DSN=your_sentry_dsn_here
    OPENAI_API_KEY=your_openai_api_key_here
    ```

2.  **Start Local Database:**
    If you don't have MongoDB installed, run our portable zero-admin setup script:
    ```powershell
    powershell -ExecutionPolicy Bypass -File .\setup_mongo.ps1
    ```

3.  **Start Server Backend:**
    ```bash
    cd server
    npm install
    npm run dev
    ```

4.  **Start Client Frontend:**
    ```bash
    cd ../client
    npm install
    npm run dev
    ```
    Access the dev client at: `http://localhost:5173`.

---

## ☸️ Kubernetes & Production Deployment

Kubernetes base manifests are located under `/k8s`, organizing all workloads with stateful database claims and high availability configurations.

### Deploying Base Workloads
To apply the base configurations:
```bash
kubectl apply -f k8s/config.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/server.yaml
kubectl apply -f k8s/client.yaml
```

### Parameterized Helm Charts
For customizable deployments (e.g., dev/staging/prod), use our Helm chart:
```bash
cd k8s/helm
helm upgrade --install intellmeet ./intellmeet -f intellmeet/values.yaml
```

---

## 📊 Observability & Monitoring

*   **Sentry Logging:** Integrated into both the React client (`main.tsx`) and Express backend (`server.js`) to capture runtime errors and capture stack traces.
*   **Prometheus Metrics:** The API server exposes standard Node.js runtime metrics and HTTP response histogram stats on `/metrics`. Scraped by Prometheus using `monitoring/prometheus.yml`.
*   **Load Testing:** JMeter configuration is available in `monitoring/intellmeet-load-test.jmx` to simulate up to 500 concurrent users hitting core authentication and health endpoints.

---

## 📝 Personal Reflection & Journey

### Key Learnings
1.  **Strict Security Configurations:** Building authentication using short-lived JWT credentials coupled with Silent Refresh Rotation cookies was a rewarding experience that solidified my understanding of secure session management.
2.  **Bypassing Enterprise Restrictions:** Designing custom scripting solutions (like using fast `curl` downloads of portable MongoDB databases and correcting NTFS permissions via CLI) proved that developers must be highly adaptable to their work environment's constraints.
3.  **Multi-Stage Docker & Orchestration:** Developing microservices where Nginx serves static compiled SPA files while proxying traffic to backend Node clusters under Kubernetes services showed me the depth of scaling modern cloud platforms.

### Challenges & Workarounds
*   *Network Blocking:* The corporate network blocked the MongoDB SRV protocol. I solved this by switching the Mongoose client to use a manual multi-node replica set configuration string directly targeting the primary servers.
*   *No Docker Admin Rights:* Solved by crafting a completely automated Powershell workflow that setups, initializes, and runs a localized, portable MongoDB binary without registering Windows Services or requiring admin prompts.

### Future Roadmap
*   Transitioning from standard WebRTC Peer-to-Peer channels to a Selective Forwarding Unit (SFU) architecture using Mediasoup/WebRTC to support larger enterprise team layouts (100+ active video sessions).
*   Adding AI transcription translation to enable cross-language collaboration dynamically during international meetings.
