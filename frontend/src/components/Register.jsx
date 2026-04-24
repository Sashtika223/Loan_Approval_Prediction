import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../index.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Simulate successful registration
    if (formData.email && formData.password) {
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
         navigate('/login');
      }, 1500);
    } else {
      setError('Please fill all fields');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join us to predict your home loan eligibility instantly</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              name="name"
              placeholder="Ex: John Doe"
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email"
              placeholder="Ex: test@example.com"
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              placeholder="Enter password"
              value={formData.password} 
              onChange={handleChange} 
              required 
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <button type="submit" className="submit-btn primary-btn">Register</button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="text-link">Login here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;
