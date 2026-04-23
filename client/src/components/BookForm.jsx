import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

// axios.defaults.withCredentials = true;
// axios.defaults.baseURL = 'http://localhost:3000';

function BookForm({ onSuccess, isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    rating: "",
    date_read: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // If editing, pre-fill the form
  useEffect(() => {
    if (isEdit && id) {
      const fetchBook = async () => {
        try {
          const res = await axios.get(`/books/${id}`);
          const book = res.data;
          setFormData({
            title: book.title || "",
            author: book.author || "",
            isbn: book.isbn || "",
            rating: book.rating || "",
            date_read: book.date_read ? book.date_read.split("T")[0] : "",
            notes: book.notes || "",
          });
        } catch (err) {
          console.error("Error fetching book for edit:", err);
        } finally {
          setFetching(false);
        }
      };
      fetchBook();
    }
  }, [isEdit, id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`/books/${id}`, formData);
      } else {
        await axios.post("/books", formData);
      }
      if (onSuccess) onSuccess();
      navigate("/");
    } catch (err) {
      console.error("Error saving book:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading">Loading book details...</div>;

  return (
    <div className="form-container">
      <h1 className="hero-title">
        {isEdit ? "Edit " : "Add "}
        <span className="hero-notes">{isEdit ? "Book" : "New Book"}</span>
      </h1>

      <form onSubmit={handleSubmit} className="modern-form">
        <div className="input-group">
          <label htmlFor="title">Book Title *</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Atomic Habits"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="author">Author</label>
          <input
            id="author"
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="e.g. James Clear"
          />
        </div>

        <div className="input-group">
          <label htmlFor="isbn">
            ISBN <span className="label-hint">(for cover art)</span>
          </label>
          <input
            id="isbn"
            type="text"
            name="isbn"
            value={formData.isbn}
            onChange={handleChange}
            placeholder="e.g. 9780735211292"
          />
        </div>

        <div className="form-row">
          <div className="input-group">
            <label htmlFor="rating">Rating (1–10)</label>
            <input
              id="rating"
              type="number"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              placeholder="8"
              min="1"
              max="10"
            />
          </div>

          <div className="input-group">
            <label htmlFor="date_read">Date Read</label>
            <input
              id="date_read"
              type="date"
              name="date_read"
              value={formData.date_read}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="notes">My Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Key takeaways, favourite quotes, thoughts..."
            rows="5"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-action"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-action btn-edit"
            disabled={loading}
          >
            {loading ? "Saving..." : isEdit ? "Update Book" : "Save Book"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookForm;
