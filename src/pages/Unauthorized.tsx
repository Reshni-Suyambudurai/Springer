import { useNavigate } from 'react-router-dom';
import './css/Unauthorized.css';

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-code">403</div>
        <h1 className="error-title">Access Denied</h1>
        <p className="error-message">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
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

export default Unauthorized;