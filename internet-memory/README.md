# Internet Memory — AI-Powered Browser History

Internet Memory is a production-ready, self-hosted Chrome Extension and Web Dashboard that replaces your standard browser history. Instead of searching by keywords or URLs, Internet Memory extracts text from visited pages, cleans out ads/layouts, and uses vector embeddings to enable **natural language semantic search** and **Retrieval-Augmented Generation (RAG) AI chats** over your browsing past.

---

## 🚀 Key Features

*   **Semantic Search**: Query your history with meaning: *"the tutorial about MongoDB transactions I read last week"* or *"FastAPI JWT setups"*.
*   **Conversational RAG Chat**: Ask questions directly to your history. The AI references and links to pages you visited as citations.
*   **Webpage Content Purger**: An integrated content script automatically extracts readable texts, stripping navbars, footer layouts, sidebars, and ads.
*   **Dashboard & Timeline**: Sleek, glassmorphic dark/light mode React dashboard presenting chronological histories, tagging metrics, reading speed statistics, and difficulty breakdowns.
*   **Folder Collections**: Group relevant pages together into custom collection spaces.
*   **Privacy Rules**: Define domains and keyword exclusions to prevent sensitive websites (such as PayPal, bank logs, checkout fields) from being indexed.

---

## 🛠️ Architecture Overview

The codebase is structured as a TypeScript monorepo with workspaces:
*   `client/`: React 19 + TypeScript + Tailwind CSS v4 dashboard app.
*   `server/`: Node.js + Express + Mongoose (MongoDB) + Google Gen AI SDK backend server.
*   `extension/`: Manifest V3 Chrome Extension (React Popup interface and background capture workers).
*   `shared/`: Unified TypeScript type declarations shared transitively across repositories.

---

## 📦 Getting Started

### Prerequisites
*   [Node.js (v20+)](https://nodejs.org/)
*   [MongoDB](https://www.mongodb.com/try/download/community)
*   [Google Gemini API Key](https://aistudio.google.com/)

---

### Quick Start with Docker (Recommended)

1.  **Configure Environment**:
    Create a `.env` file in the `server` directory or configure it as environment variables:
    ```bash
    GEMINI_API_KEY=your_gemini_api_key
    JWT_SECRET=your_jwt_signing_secret_here
    ```

2.  **Start Services**:
    Launch the database, API server, and Nginx client app:
    ```bash
    docker compose up -d --build
    ```

3.  **Access the stack**:
    *   Web Client Dashboard: [http://localhost](http://localhost)
    *   Backend Health Endpoint: [http://localhost:5000/health](http://localhost:5000/health)

---

### Local Development Setup (Manual)

1.  **Install Dependencies**:
    Run from the root workspace directory:
    ```bash
    npm install
    ```

2.  **Configure Backend Environments**:
    Create a `server/.env` file:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/internet-memory
    JWT_SECRET=super_secret_jwt_key_12345
    GEMINI_API_KEY=your_gemini_api_key
    ```

3.  **Run Development Workspaces**:
    Start the backend API server:
    ```bash
    npm run dev --workspace=server
    ```
    Start the React frontend client:
    ```bash
    npm run dev --workspace=client
    ```

4.  **Test Backend Calculations**:
    Run automated vector math and similarity test suites:
    ```bash
    npm run test --workspace=server
    ```

---

## 🔌 Installing the Chrome Extension

1.  **Build the Extension**:
    From the root workspace directory:
    ```bash
    npm run build --workspace=extension
    ```
    This bundles popup bundles and background scripts into `extension/dist/`.

2.  **Load in Google Chrome**:
    *   Open Google Chrome and navigate to `chrome://extensions/`.
    *   Enable **Developer mode** (toggle on the top right).
    *   Click **Load unpacked** (top left).
    *   Select the `extension/dist` folder.

3.  **Sync Extension API Connection**:
    *   Click the **Internet Memory** extension icon in your Chrome bar.
    *   Click the **Sliders** icon on the top right to open the Connection settings.
    *   Input your Backend API Endpoint (`http://localhost:5000`).
    *   Paste your **JWT Authentication Token** (copy it from the dashboard settings area).
    *   Click **Save Credentials**.
