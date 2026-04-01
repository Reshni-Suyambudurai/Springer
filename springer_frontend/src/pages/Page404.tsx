import { useNavigate } from 'react-router-dom';
import './css/Page404.css';

function Page404() {
  const navigate = useNavigate();

  return (
    <div className="error-page404">
      <div className="error-container">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="error-actions">
          <button className="btn-primary" onClick={() => navigate(-1)}>
            Go Back
          </button>
          <button className="btn-secondary" onClick={() => navigate('/')}>
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Page404;