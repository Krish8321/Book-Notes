import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await axios.get(`/books/${id}`);
        setBook(res.data);
      } catch (err) {
        console.error('Error fetching book details:', err);
        setError('Could not load book details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  if (loading) return <div className="loading">Loading book details...</div>;
  if (error) return <div className="loading">{error} <Link to="/">Go back</Link></div>;

  return (
    <main className="detail-page">
      <button onClick={() => navigate(-1)} className="back-link">← Back to Library</button>

      <div className="detail-layout">
        <div className="detail-cover">
          {book.isbn ? (
            <img
              src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`}
              alt={book.title}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="cover-fallback cover-fallback-large"
            style={{ display: book.isbn ? 'none' : 'flex' }}
          >
            <span>{book.title?.[0]}</span>
          </div>
        </div>

        <div className="detail-content">
          <h1 className="detail-title">{book.title}</h1>
          <p className="detail-author">by {book.author}</p>

          <div className="meta-info">
            {book.rating && (
              <span className="rating-badge">★ {book.rating}/10</span>
            )}
            {book.date_read && (
              <span className="date-badge">
                Read on {new Date(book.date_read).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            )}
          </div>

          <div className="notes-box">
            <h3>My Notes</h3>
            <p>{book.notes || 'No notes written for this book yet.'}</p>
          </div>

          <div className="detail-actions">
            <Link to={`/edit/${book.id}`} className="btn-action btn-edit">
              Edit Book
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BookDetail;
