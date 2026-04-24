import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../index.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    // Simulate API Login
    if (email && password) {
      if(email === 'test@example.com' && password === 'password123') {
           localStorage.setItem('user', JSON.stringify({ email }));
           navigate('/dashboard');
      } else {
           setError('Invalid credentials! (Try test@example.com / password123)');
      }
    } else {
      setError('Please fill all fields');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to your Home Loan Predictor account</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="Ex: test@example.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Ex: password123"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="submit-btn primary-btn">Login</button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register" className="text-link">Register here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
