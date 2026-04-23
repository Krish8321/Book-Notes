import express from "express";
import pg from "pg";
import { fileURLToPath } from "url";
import path from "path";
import cors from "cors";
import env from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
env.config();

// const db = new pg.Client({
//   user: process.env.PG_USER,
//   host: process.env.PG_HOST,
//   database: process.env.PG_DATABASE,
//   password: process.env.PG_PASSWORD,
//   port: process.env.PG_PORT,
// });
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
db.connect();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // one day
    },
  }),
);
// auth middleware
function requireAuth(req, res, next) {
  if (req.session.user) {
    next(); // user is logged in, continue
  } else {
    res.status(401).json({ error: "Please log in first" });
  }
}

// auth routes
app.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      return res.status(400).json({ error: "Email already Registered" });
    }

    const hashedPass = await bcrypt.hash(password, 10); // saltRounds 10

    const store = await db.query(
      "INSERT INTO users (username,email,password) VALUES ($1,$2,$3) RETURNING id, username, email",
      [username, email, hashedPass],
    );

    const user = store.rows[0];

    // start session
    req.session.user = user;
    res.status(201).json({ user });
  } catch (err) {
    console.error("POST /auth/register error: ", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// login auth
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // save user info in the session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    res.json({ user: req.session.user });
  } catch (err) {
    console.error("POST /auth/login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Logout
app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout Failed" });
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

app.get("/auth/me", (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

function getSortClause(sort) {
  switch (sort) {
    case "rating":
      return "rating DESC NULLS LAST";
    case "title":
      return "title ASC";
    default:
      return "date_read DESC NULLS LAST"; // 'recent'
  }
}

// ── GET all books ──
// Frontend calls: GET /books?sort=rating
app.get("/books", requireAuth, async (req, res) => {
  try {
    const sort = req.query.sort || "recent";
    const order = getSortClause(sort);
    const userID = req.session.user.id;

    const result = await db.query(
      `SELECT * FROM books WHERE user_id = $1 ORDER BY ${order}`,
      [userID],
    );

    res.json(result.rows); // ← send only the rows array
  } catch (err) {
    console.error("GET /books error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET single book ──
app.get("/books/:id", requireAuth, async (req, res) => {
  try {
    const userID = req.session.user.id;

    const result = await db.query(
      "SELECT * FROM books WHERE id = $1 AND user_id = $2",
      [req.params.id, userID],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /books/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST add new book ──
app.post("/books", requireAuth, async (req, res) => {
  try {
    const { title, author, isbn, date_read, rating, notes } = req.body;
    const userID = req.session.user.id;

    const result = await db.query(
      `INSERT INTO books (title, author, isbn, date_read, rating, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        title,
        author,
        isbn || null,
        date_read || null,
        rating || null,
        notes || null,
        userID,
      ],
    );
    res.status(201).json(result.rows[0]); // return the created book
  } catch (err) {
    console.error("POST /books error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT update book ──
app.put("/books/:id", requireAuth, async (req, res) => {
  try {
    const { title, author, isbn, date_read, rating, notes } = req.body;
    const userID = req.session.user.id;

    const result = await db.query(
      `UPDATE books SET title=$1, author=$2, isbn=$3, date_read=$4, rating=$5, notes=$6
       WHERE id=$7 AND user_id = $8 RETURNING *`,
      [
        title,
        author,
        isbn || null,
        date_read || null,
        rating || null,
        notes || null,
        req.params.id,
        userID,
      ],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /books/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE book ──
app.delete("/books/:id", requireAuth, async (req, res) => {
  try {
    const userID = req.session.user.id;

    const result = await db.query(
      "DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, userID],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error("DELETE /books/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── 404 fallback ──
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () =>
  console.log(`📚  Book Notes API running on http://localhost:${PORT}`),
);
