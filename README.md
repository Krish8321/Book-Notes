# 📚 Book Notes

A premium, full-stack web application to search, track, review, and manage your reading library. Keep your books, personal ratings, and notes in one place with a secure user authentication system and persistent cloud storage.

*   **Frontend**: Hosted on **Vercel**
*   **Backend**: Hosted on **Render** (Node/Express)
*   **Database**: **PostgreSQL** hosted on **Neon DB**

---

## 🚀 Coldstart Keep-Alive Handler
Render's free tier automatically spins down web services after 15 minutes of inactivity, causing subsequent requests to suffer from a 50+ second "cold start" delay.

To resolve this:
1.  **GET `/ping` Endpoint**: A lightweight health endpoint has been added to the server.
2.  **Self-Ping Background Loop**: The server runs an automatic keep-alive timer that makes an HTTP GET request to its own public URL every **14 minutes**. This resets Render's inactivity countdown and prevents the server from going to sleep.

**Configuration**:
- The server dynamically reads `RENDER_EXTERNAL_URL` (automatically supplied by Render in production) or your custom `BACKEND_URL` environment variable to determine where to ping.
- If neither variable is defined (e.g. during local development), the keep-alive loop logs a message and safely disables itself to avoid spamming.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Axios, React Router, CSS |
| **Backend** | Node.js, Express.js, express-session |
| **Database** | PostgreSQL (Neon DB), connect-pg-simple (Session Storage) |

---

## 🔑 Environment Variables

To run the project locally or in production, configure the following environment variables:

### Backend (`/server/.env`)
Create a `.env` file in the `server` directory:
```env
PORT=3000
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_super_secret_session_key
FRONTEND_URL=http://localhost:5173
# Optional locally, automatic on Render:
# RENDER_EXTERNAL_URL=https://your-backend.onrender.com
```

### Frontend (`/client`)
No local `.env` is required as it defaults to `/api` proxy. In production, configure Vercel's rewrite destination in `vercel.json` to route `/api/:path*` to your Render backend URL (e.g., `https://your-backend.onrender.com/:path*`).

---

## 🗄️ Database Setup

Create the following tables in your PostgreSQL database (e.g. via Neon console or a DB client):

```sql
-- 1. Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- 2. Books Table
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(20),
  date_read DATE,
  rating INTEGER CHECK (rating >= 0 AND rating <= 10),
  notes TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Session Table (for persistent session storage across server sleep/restarts)
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

---

## 💻 Local Development

### 1. Backend Setup
1. Open a terminal in the `/server` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make sure your local `.env` is configured correctly.
4. Start the development server (runs nodemon):
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open a terminal in the `/client` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Deployment Instructions

### Frontend (Vercel)
1. Import the `/client` directory (or workspace root and specify `/client` as root directory).
2. Configure rewrite rules inside `vercel.json` to point `/api/:path*` to your Render backend API.
3. Deploy!

### Backend (Render)
1. Create a new Web Service pointing to your repository.
2. Set the root directory to `server` (or set Build Command to `npm install` and Start Command to `npm start`).
3. Add the environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `FRONTEND_URL` (your deployed Vercel frontend URL)
4. Render will automatically set `RENDER_EXTERNAL_URL`, which enables the keep-alive handler to ping itself.
