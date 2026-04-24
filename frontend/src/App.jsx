import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'login', 'register', 'loan_application'
  const [user, setUser] = useState(null);

  // Authentication States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Loan Application Form States
  const [formData, setFormData] = useState({
    Gender: 'Male',
    Married: 'No',
    Dependents: '0',
    Education: 'Graduate',
    Self_Employed: 'No',
    ApplicantIncome: 415000, // ~5000 USD
    CoapplicantIncome: 0,
    Property_Value: 16600000, // ~200,000 USD
    LoanAmount: 12450, // ~150k USD
    Loan_Amount_Term: 360,
    Credit_History: 1.0,
    Property_Area: 'Urban',
  });
  
  const [prediction, setPrediction] = useState(null);
  const [predReason, setPredReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [predError, setPredError] = useState('');

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setCurrentView('loan_application');
    }
  }, []);

  // --------------- Handlers ---------------
  
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    
    const email = authEmail.trim().toLowerCase();
    const password = authPassword.trim();
    
    if (email && password) {
      // First check hardcoded test user
      if(email === 'test@example.com' && password === 'password123') {
           const userData = { email: email, name: 'Test User' };
           localStorage.setItem('user', JSON.stringify(userData));
           setUser(userData);
           setCurrentView('loan_application');
           return;
      }

      // Then check dynamically registered users
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const registeredUser = users.find(u => u.email.toLowerCase() === email && u.password === password);
      
      if(registeredUser) {
           const userData = { email: registeredUser.email, name: registeredUser.name };
           localStorage.setItem('user', JSON.stringify(userData));
           setUser(userData);
           setCurrentView('loan_application');
      } else {
           setAuthError('Invalid credentials! Please check your email and password.');
      }
    } else {
      setAuthError('Please fill all fields');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const email = authEmail.trim().toLowerCase();
    const password = authPassword.trim();
    const confirmPassword = authConfirmPassword.trim();
    const name = authName.trim();

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    
    if (email && password && name) {
      // Fetch or initialize users list from local storage
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      
      // Check if user already exists
      if (users.find(u => u.email.toLowerCase() === email)) {
          setAuthError('An account with this email already exists.');
          return;
      }
      
      // Save the newly registered user
      users.push({ name: name, email: email, password: password });
      localStorage.setItem('registeredUsers', JSON.stringify(users));

      setAuthSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
         setCurrentView('login');
         setAuthSuccess('');
         setAuthError('');
         // Clear sensitive fields so they only need to type their password again
         setAuthName('');
         setAuthPassword('');
         setAuthConfirmPassword('');
      }, 1500);
    } else {
      setAuthError('Please fill all fields');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('home');
    setAuthEmail('');
    setAuthPassword('');
    setPrediction(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    setPredError('');
    setPredReason('');
    
    const dataToSend = {
      ...formData,
      ApplicantIncome: parseFloat(formData.ApplicantIncome),
      CoapplicantIncome: parseFloat(formData.CoapplicantIncome),
      Property_Value: parseFloat(formData.Property_Value),
      LoanAmount: parseFloat(formData.LoanAmount),
      Loan_Amount_Term: parseFloat(formData.Loan_Amount_Term),
      Credit_History: parseFloat(formData.Credit_History)
    };

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction from server. Ensure Python backend is running.');
      }

      const data = await response.json();
      setPrediction(data.prediction);
      
      if (data.reason) {
          setPredReason(data.reason);
      }
      
    } catch (err) {
      setPredError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------- Components ---------------

  const Navigation = () => (
    <nav className="navbar">
      <div className="logo" onClick={() => setCurrentView('home')}>
        Loan<span>Predictor</span>
      </div>
      <div className="nav-links">
        <span className={currentView === 'home' ? 'active-nav' : ''} onClick={() => setCurrentView('home')}>Home</span>
        {user ? (
          <>
            <span className={currentView === 'loan_application' ? 'active-nav' : ''} onClick={() => setCurrentView('loan_application')}>Loan Application</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>{user.email}</span>
            <button className="nav-btn" onClick={handleLogout} style={{background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)'}}>Log Out</button>
          </>
        ) : (
          <>
            <span className={currentView === 'login' ? 'active-nav' : ''} onClick={() => setCurrentView('login')}>Login</span>
            <button className="nav-btn" onClick={() => setCurrentView('register')}>Register</button>
          </>
        )}
      </div>
    </nav>
  );

  const renderHome = () => (
    <div className="hero-section">
      <div className="hero-content">
        <div className="hero-badge">Smart Loan Eligibility Analysis</div>
        <h1>Predict Your Home Loan Instantly.</h1>
        <p>Utilizing financial guidelines and standard bank eligibility criteria to analyze your credentials and estimate your loan approval chances in real-time.</p>
        <div className="hero-buttons">
          <button className="btn-large primary-btn" onClick={() => user ? setCurrentView('loan_application') : setCurrentView('register')}>
            Apply for Loan Now
          </button>
          <button className="btn-large secondary-btn" onClick={() => user ? setCurrentView('loan_application') : setCurrentView('login')}>
            Member Login
          </button>
        </div>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to submit your personal details for loan prediction.</p>
        </div>
        
        {authError && <div className="error-message">{authError}</div>}
        {authSuccess && <div className="success-message">{authSuccess}</div>}
        
        <form onSubmit={handleLogin} className="auth-form" autoComplete="off">
          {/* Hidden inputs to trick stubborn browser autofill */}
          <input type="email" name="hidden-email" style={{display: 'none'}} autoComplete="username" />
          <input type="password" name="hidden-password" style={{display: 'none'}} autoComplete="current-password" />

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="user_email_login"
              placeholder="Ex: test@example.com"
              value={authEmail} 
              onChange={(e) => setAuthEmail(e.target.value)} 
              required 
              autoComplete="nope"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="user_password_login"
              placeholder="Ex: password123"
              value={authPassword} 
              onChange={(e) => setAuthPassword(e.target.value)} 
              required 
              autoComplete="new-password"
            />
          </div>
          
          <button type="submit" className="btn-large primary-btn" style={{width: '100%', marginTop: '1rem'}}>Secure Login</button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? <span onClick={() => setCurrentView('register')} className="text-link" style={{cursor: 'pointer'}}>Register here</span></p>
        </div>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join us to predict your home loan instantly</p>
        </div>
        
        {authError && <div className="error-message">{authError}</div>}
        {authSuccess && <div className="success-message">{authSuccess}</div>}
        
        <form onSubmit={handleRegister} className="auth-form" autoComplete="off">
          {/* Hidden inputs to trick stubborn browser autofill */}
          <input type="email" name="hidden-email-reg" style={{display: 'none'}} autoComplete="username" />
          <input type="password" name="hidden-password-reg" style={{display: 'none'}} autoComplete="current-password" />

          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="user_fullname_reg" placeholder="Ex: John Doe" value={authName} onChange={(e) => setAuthName(e.target.value)} required autoComplete="nope" />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="user_email_reg" placeholder="Ex: test@example.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required autoComplete="nope" />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="user_password_reg" placeholder="Enter password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required minLength="6" autoComplete="new-password" />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" name="user_confirm_password_reg" placeholder="Confirm password" value={authConfirmPassword} onChange={(e) => setAuthConfirmPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          
          <button type="submit" className="btn-large primary-btn" style={{width: '100%', marginTop: '1rem'}}>Register</button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <span onClick={() => setCurrentView('login')} className="text-link" style={{cursor: 'pointer'}}>Login here</span></p>
        </div>
      </div>
    </div>
  );

  const renderLoanApplication = () => (
    <div className="app-content-wrapper">
      <div className="dashboard-header">
        <h1>Personal Details for Loan Application</h1>
        <p>Please provide your accurate personal and financial details to evaluate your loan request.</p>
      </div>

      <div className="glass-panel main-panel">
        <form onSubmit={handlePredict}>
          
          {/* Section: Personal Information */}
          <h3 style={{marginBottom: '1.5rem', color: '#60A5FA', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem'}}>1. Personal Information</h3>
          <div className="grid" style={{marginBottom: '2rem'}}>
            <div className="form-group">
              <label>Gender</label>
              <select name="Gender" value={formData.Gender} onChange={handleChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label>Married</label>
              <select name="Married" value={formData.Married} onChange={handleChange}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label>Number of Dependents</label>
              <select name="Dependents" value={formData.Dependents} onChange={handleChange}>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3+">3 or more</option>
              </select>
            </div>

            <div className="form-group">
              <label>Education Level</label>
              <select name="Education" value={formData.Education} onChange={handleChange}>
                <option value="Graduate">Graduate</option>
                <option value="Not Graduate">Not Graduate</option>
              </select>
            </div>
          </div>

          {/* Section: Financial Details */}
          <h3 style={{marginBottom: '1.5rem', color: '#60A5FA', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem'}}>2. Financial Details</h3>
          <div className="grid" style={{marginBottom: '2rem'}}>
            <div className="form-group">
              <label>Are You Self Employed?</label>
              <select name="Self_Employed" value={formData.Self_Employed} onChange={handleChange}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label>Applicant Income (Monthly ₹)</label>
              <input type="number" name="ApplicantIncome" value={formData.ApplicantIncome} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Co-Applicant Income (Monthly ₹)</label>
              <input type="number" name="CoapplicantIncome" value={formData.CoapplicantIncome} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>Credit History Status</label>
              <select name="Credit_History" value={formData.Credit_History} onChange={handleChange}>
                <option value="1.0">Good Credit (1.0)</option>
                <option value="0.0">Poor Credit (0.0)</option>
              </select>
            </div>
          </div>

          {/* Section: Loan Details */}
          <h3 style={{marginBottom: '1.5rem', color: '#60A5FA', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem'}}>3. Loan Details</h3>
          <div className="grid">
            <div className="form-group">
              <label>Total Property Value (₹)</label>
              <input type="number" name="Property_Value" value={formData.Property_Value} onChange={handleChange} placeholder="e.g. 200000" required />
            </div>
            
            <div className="form-group">
              <label>Requested Loan Amount (₹ Thousands)</label>
              <input type="number" name="LoanAmount" value={formData.LoanAmount} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Loan Term duration (Months)</label>
              <input type="number" name="Loan_Amount_Term" value={formData.Loan_Amount_Term} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Target Property Area</label>
              <select name="Property_Area" value={formData.Property_Area} onChange={handleChange}>
                <option value="Urban">Urban</option>
                <option value="Semiurban">Semiurban</option>
                <option value="Rural">Rural</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-large primary-btn submit-btn" disabled={loading}>
            {loading ? <span className="loader"></span> : 'Submit Loan Application'}
          </button>
        </form>

        {predError && <div className="error-message">{predError}</div>}

        {prediction !== null && (
          <div className={`result ${prediction === 'Low Risk' ? 'approved' : 'rejected'}`}>
            <h2>{prediction === 'Low Risk' ? '🎉 Analysis: Low Risk' : '❌ Analysis: High Risk'}</h2>
            <p>
              {predReason ? predReason :
               (prediction === 'Low Risk'
                ? 'Congratulations! According to our analysis, your current personal and financial details present a low-risk profile for this loan.' 
                : 'Unfortunately, your profile characteristics indicate poor eligibility based on the requested loan amount and financial guidelines.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Main Render Layout
  return (
    <>
      <Navigation />
      
      {/* Dynamic Background Effects */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      
      {currentView === 'home' && renderHome()}
      {currentView === 'login' && renderLogin()}
      {currentView === 'register' && renderRegister()}
      {currentView === 'loan_application' && renderLoanApplication()}
      
      <footer>
        <p>&copy; 2026 Home Loan Predictor. All rights reserved.</p>
      </footer>
    </>
  );
}

export default App;
