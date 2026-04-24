import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    Gender: 'Male',
    Married: 'No',
    Dependents: '0',
    Education: 'Graduate',
    Self_Employed: 'No',
    ApplicantIncome: '',
    CoapplicantIncome: '',
    LoanAmount: '',
    Loan_Amount_Term: 360,
    Credit_History: 1.0,
    Property_Area: 'Urban',
    Property_Value: '',
  });
  
  const [prediction, setPrediction] = useState(null);
  const [reason, setReason] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    setReason(null);
    setError('');
    
    // Ensure numerical types
    const dataToSend = {
      ...formData,
      ApplicantIncome: parseFloat(formData.ApplicantIncome),
      CoapplicantIncome: parseFloat(formData.CoapplicantIncome),
      LoanAmount: parseFloat(formData.LoanAmount),
      Loan_Amount_Term: parseFloat(formData.Loan_Amount_Term),
      Credit_History: parseFloat(formData.Credit_History),
      Property_Value: parseFloat(formData.Property_Value)
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction from server. Ensure backend is running.');
      }

      const data = await response.json();
      setPrediction(data.prediction);
      setReason(data.reason);
    } catch (err) {
      setError("Network connection failed. Make sure the backend is running at http://127.0.0.1:8000.");
    } finally {
      setLoading(false);
    }
  };

  if(!user) return null;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <h2>Predictor<span>AI</span></h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li className="active"><a href="#dashboard">Dashboard</a></li>
            <li><a href="#history">Prediction History</a></li>
            <li><a href="#profile">Profile Settings</a></li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">👤</div>
            <div className="user-text">
              <span className="user-email">{user.email}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">Log Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="dashboard-header">
          <h1>Welcome, let's process your application</h1>
          <p>Fill in the required fields below to receive an instant home loan prediction.</p>
        </div>

        <div className="glass-panel main-panel">
          <form className="form" onSubmit={handleSubmit}>
            <div className="grid">
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
                <label>Dependents</label>
                <select name="Dependents" value={formData.Dependents} onChange={handleChange}>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3+">3+</option>
                </select>
              </div>

              <div className="form-group">
                <label>Education</label>
                <select name="Education" value={formData.Education} onChange={handleChange}>
                  <option value="Graduate">Graduate</option>
                  <option value="Not Graduate">Not Graduate</option>
                </select>
              </div>

              <div className="form-group">
                <label>Self Employed</label>
                <select name="Self_Employed" value={formData.Self_Employed} onChange={handleChange}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="form-group">
                <label>Property Area</label>
                <select name="Property_Area" value={formData.Property_Area} onChange={handleChange}>
                  <option value="Urban">Urban</option>
                  <option value="Semiurban">Semiurban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>

              <div className="form-group">
                <label>Property Value (₹)</label>
                <input type="number" name="Property_Value" value={formData.Property_Value} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Applicant Income (₹)</label>
                <input type="number" name="ApplicantIncome" value={formData.ApplicantIncome} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Co-Applicant Income (₹)</label>
                <input type="number" name="CoapplicantIncome" value={formData.CoapplicantIncome} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Loan Amount (₹)</label>
                <input type="number" name="LoanAmount" value={formData.LoanAmount} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Loan Term (months)</label>
                <input type="number" name="Loan_Amount_Term" value={formData.Loan_Amount_Term} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Credit History</label>
                <select name="Credit_History" value={formData.Credit_History} onChange={handleChange}>
                  <option value="1.0">Good (1.0)</option>
                  <option value="0.0">Poor (0.0)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <span className="loader"></span> : 'Predict Approval'}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          {prediction && (
            <div className={`result ${prediction === 'Low Risk' ? 'approved' : 'rejected'}`}>
              <h2>{prediction === 'Low Risk' ? '🎉 Low Risk (Approved)!' : '❌ High Risk (Rejected)'}</h2>
              <p>
                {prediction === 'Low Risk' 
                  ? 'Congratulations! Based on your profile, you are eligible for the loan.' 
                  : 'Unfortunately, based on the provided data, the loan application was not approved due to high risk factors.'}
              </p>
              {reason && (
                <div className="reason-section" style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', borderLeft: prediction === 'Low Risk' ? '4px solid #4ade80' : '4px solid #ef4444' }}>
                  <p style={{ margin: 0 }}><strong>Key Factors:</strong> {reason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
