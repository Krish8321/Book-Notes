import { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import BookDetail from './components/BookDetail';
import BookForm from './components/BookForm';
import AuthPage from './components/AuthPage';

// ── Protected Route wrapper ──
const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ── HOME PAGE: BOOKS GRID ──
const BookList = ({ books, setSort, sort, deleteBook, loading }) => (
  <>
    <section className="hero">
      <h1 className="hero-title">
        Books I've read,<br />
        <span className="hero-notes">notes I've kept.</span>
      </h1>
      <p className="hero-subtitle">{books.length} books in your library</p>
    </section>

    <section className="controls-section">
      <span className="sort-label">Sort by</span>
      <div className="sort-buttons">
        {['recent', 'rating', 'title'].map((s) => (
          <button key={s} onClick={() => setSort(s)} className={`sort-btn ${sort === s ? 'active' : ''}`}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>
    </section>

    {loading ? (
      <div className="loading">Loading your library...</div>
    ) : books.length === 0 ? (
      <div className="empty-state">
        <p>No books yet. <Link to="/add">Add your first book →</Link></p>
      </div>
    ) : (
      <section className="books-grid">
        {books.map((book) => (
          <article key={book.id} className="book-card">
            <Link to={`/book/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="book-cover-container">
                {book.isbn ? (
                  <img
                    src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`}
                    className="book-cover"
                    alt={book.title}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div className="cover-fallback" style={{ display: book.isbn ? 'none' : 'flex' }}>
                  <span>{book.title?.[0]}</span>
                </div>
              </div>
              <div className="book-info">
                <div className="rating-tag">★ {book.rating}/10</div>
                <h2 className="book-title">{book.title}</h2>
                <p className="book-author">{book.author}</p>
              </div>
            </Link>
            <div className="book-actions">
              <Link to={`/edit/${book.id}`} className="btn-action btn-edit">Edit</Link>
              <button className="btn-action btn-delete" onClick={() => deleteBook(book.id)}>Delete</button>
            </div>
          </article>
        ))}
      </section>
    )}
  </>
);

// ── MAIN APP ──
function App() {
  const [books, setBooks] = useState([]);
  const [sort, setSort] = useState('rating');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check if a session already exists on page load
  useEffect(() => {
    axios.get('/auth/me', { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/books?sort=${sort}`, { withCredentials: true });
      setBooks(res.data.rows || res.data);
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBooks();
  }, [sort, user]);

  const deleteBook = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await axios.delete(`/books/${id}`, { withCredentials: true });
        setBooks((prev) => prev.filter((b) => b.id !== id));
      } catch (err) {
        console.error('Error deleting book:', err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });
      setUser(null);
      setBooks([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Wait for session check before rendering to avoid login flash
  if (!authChecked) return null;

  return (
    <Router>
      <div className="app-wrapper">
        <Routes>
          {/* Public */}
          <Route path="/login" element={
            user ? <Navigate to="/" replace /> : <AuthPage onLogin={setUser} />
          } />

          {/* Protected */}
          <Route path="/*" element={
            <ProtectedRoute user={user}>
              <>
                <Header user={user} onLogout={handleLogout} />
                <main className="container main-content">
                  <Routes>
                    <Route path="/" element={
                      <BookList books={books} setSort={setSort} sort={sort} deleteBook={deleteBook} loading={loading} />
                    } />
                    <Route path="/book/:id" element={<BookDetail />} />
                    <Route path="/add" element={<BookForm onSuccess={fetchBooks} />} />
                    <Route path="/edit/:id" element={<BookForm onSuccess={fetchBooks} isEdit />} />
                  </Routes>
                </main>
                <Footer />
              </>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
