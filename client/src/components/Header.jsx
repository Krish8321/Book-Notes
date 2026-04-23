import { Link } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          Book Notes
        </Link>

        <div className="navbar-actions">
          {user && (
            <span className="navbar-user">
              Hey, <strong>{user.username || user.email}</strong>
            </span>
          )}
          <Link to="/" className="btn-nav">Library</Link>
          <Link to="/add" className="btn-nav btn-primary-nav">+ New Book</Link>
          {onLogout && (
            <button className="btn-nav btn-logout" onClick={onLogout}>
              Sign Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
