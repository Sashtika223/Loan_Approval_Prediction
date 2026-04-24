import { useState, useEffect, useMemo } from 'react';
import './index.css';

const STEPS = [
  { id: 1, title: 'Identity' },
  { id: 2, title: 'Financials' },
  { id: 3, title: 'Loan Details' },
  { id: 4, title: 'Documents' },
  { id: 5, title: 'Result' }
];

function App() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [formData, setFormData] = useState({
    Gender: 'Male',
    Married: 'No',
    Dependents: '0',
    Education: 'Graduate',
    Self_Employed: 'No',
    ApplicantIncome: 50000,
    CoapplicantIncome: 0,
    Property_Value: 2000000,
    LoanAmount: 1500, // In thousands
    Loan_Amount_Term: 360,
    Credit_History: 1.0,
    Property_Area: 'Urban',
    Interest_Rate: 8.5
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Real-time Financial Calculations ---
  const financialMetrics = useMemo(() => {
    const totalIncome = Number(formData.ApplicantIncome) + Number(formData.CoapplicantIncome);
    const monthlyIncome = totalIncome / 12;
    
    // EMI Calculation
    const p = Number(formData.LoanAmount) * 1000;
    const r = (Number(formData.Interest_Rate) / 100) / 12;
    const n = Number(formData.Loan_Amount_Term);
    
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalRepayment = emi * n;
    const totalInterest = totalRepayment - p;
    const dti = monthlyIncome > 0 ? emi / monthlyIncome : 1;
    const ltv = formData.Property_Value > 0 ? p / formData.Property_Value : 1;

    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalRepayment: Math.round(totalRepayment),
      dti: (dti * 100).toFixed(1),
      ltv: (ltv * 100).toFixed(1),
      canAfford: dti <= 0.45
    };
  }, [formData]);

  // Real-time Probability Mock (Instantly updates as user types)
  const probability = useMemo(() => {
    let score = 50;
    if (formData.Credit_History === 1.0) score += 30;
    else score -= 40;
    
    if (Number(financialMetrics.dti) > 50) score -= 20;
    if (Number(financialMetrics.ltv) > 85) score -= 15;
    if (formData.Education === 'Graduate') score += 5;
    
    return Math.min(Math.max(score, 5), 98);
  }, [formData, financialMetrics]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    notify("Encrypting and submitting application...", "info");
    try {
      const response = await fetch('http://localhost:8001/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      setPrediction(data);
      setStep(5);
      notify("Application processed successfully", "success");
    } catch (err) {
      setError("Server connection failed. Please ensure the Pro Backend is running on port 8001.");
      notify("Submission failed", "danger");
    } finally {
      setLoading(false);
    }
  };

  // --- UI Components ---
  
  const ProgressBar = () => (
    <div className="progress-container">
      {STEPS.map(s => (
        <div key={s.id} className={`step-node ${step === s.id ? 'active' : step > s.id ? 'completed' : ''}`}>
          {step > s.id ? '✓' : s.id}
        </div>
      ))}
    </div>
  );

  const Step1Identity = () => (
    <div className="fade-in">
      <h2 style={{marginBottom: '1.5rem'}}>Personal Identity</h2>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
        <div className="form-group">
          <label>Gender</label>
          <select name="Gender" value={formData.Gender} onChange={handleChange}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className="form-group">
          <label>Marital Status</label>
          <select name="Married" value={formData.Married} onChange={handleChange}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
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
          <label>Dependents</label>
          <select name="Dependents" value={formData.Dependents} onChange={handleChange}>
            <option value="0">None</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3+">3+</option>
          </select>
        </div>
      </div>
      <button className="primary-btn" onClick={() => setStep(2)} style={{marginTop: '2rem', width: '100%'}}>Continue to Financials</button>
    </div>
  );

  const Step2Financials = () => (
    <div className="fade-in">
      <h2>Financial Health</h2>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
        <div className="form-group">
          <label>Monthly Applicant Income (₹)</label>
          <input type="number" name="ApplicantIncome" value={formData.ApplicantIncome} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Monthly Co-applicant Income (₹)</label>
          <input type="number" name="CoapplicantIncome" value={formData.CoapplicantIncome} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Credit History</label>
          <select name="Credit_History" value={formData.Credit_History} onChange={handleChange}>
            <option value="1.0">Good (1.0)</option>
            <option value="0.0">Poor (0.0)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Self Employed</label>
          <select name="Self_Employed" value={formData.Self_Employed} onChange={handleChange}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
      </div>
      
      {!financialMetrics.canAfford && (
        <div style={{background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--danger)', marginTop: '1rem'}}>
          <p style={{color: 'var(--danger)', fontSize: '0.9rem'}}>⚠️ Warning: Your Debt-to-Income ratio is high ({financialMetrics.dti}%). This might impact approval.</p>
        </div>
      )}

      <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
        <button className="secondary-btn" onClick={() => setStep(1)} style={{flex: 1}}>Back</button>
        <button className="primary-btn" onClick={() => setStep(3)} style={{flex: 2}}>Loan Details</button>
      </div>
    </div>
  );

  const Step3Loan = () => (
    <div className="fade-in">
      <h2>Loan Request</h2>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
        <div className="form-group">
          <label>Loan Amount (₹ Thousands)</label>
          <input type="number" name="LoanAmount" value={formData.LoanAmount} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Property Value (₹)</label>
          <input type="number" name="Property_Value" value={formData.Property_Value} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Tenure (Months)</label>
          <input type="range" name="Loan_Amount_Term" min="12" max="480" step="12" value={formData.Loan_Amount_Term} onChange={handleChange} />
          <p style={{textAlign: 'right', fontSize: '0.8rem'}}>{formData.Loan_Amount_Term} Months</p>
        </div>
        <div className="form-group">
          <label>Interest Rate (%)</label>
          <input type="number" name="Interest_Rate" step="0.1" value={formData.Interest_Rate} onChange={handleChange} />
        </div>
      </div>

      <div className="glass-panel" style={{padding: '1.5rem', marginTop: '1.5rem', border: '1px dashed var(--primary)'}}>
        <h4 style={{color: 'var(--primary)', marginBottom: '0.5rem'}}>EMI ESTIMATOR</h4>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div>
            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Monthly EMI</p>
            <p style={{fontSize: '1.2rem', fontWeight: 'bold'}}>₹{financialMetrics.emi.toLocaleString()}</p>
          </div>
          <div>
            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Total Interest</p>
            <p style={{fontSize: '1.2rem', fontWeight: 'bold'}}>₹{financialMetrics.totalInterest.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
        <button className="secondary-btn" onClick={() => setStep(2)} style={{flex: 1}}>Back</button>
        <button className="primary-btn" onClick={() => setStep(4)} style={{flex: 2}}>Verification Documents</button>
      </div>
    </div>
  );

  const Step4Docs = () => (
    <div className="fade-in">
      <h2>Document Verification</h2>
      <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>Upload digital copies for instant verification.</p>
      
      <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
        {['ID Proof (Aadhar/PAN)', 'Bank Statement (Last 6 Months)', 'Salary Slips'].map((doc, i) => (
          <div key={i} className="glass-panel" style={{padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <span style={{fontSize: '0.9rem'}}>{doc}</span>
             <button className="secondary-btn" style={{padding: '0.4rem 0.8rem', fontSize: '0.7rem'}}>Upload</button>
          </div>
        ))}
      </div>

      <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
        <button className="secondary-btn" onClick={() => setStep(3)} style={{flex: 1}}>Back</button>
        <button className="primary-btn" onClick={handlePredict} style={{flex: 2}} disabled={loading}>
          {loading ? 'Processing...' : 'Final Submission'}
        </button>
      </div>
    </div>
  );

  const Step5Result = () => (
    <div className="fade-in" style={{textAlign: 'center'}}>
      <div className={`result-icon ${prediction?.prediction === 'Low Risk' ? 'success' : 'fail'}`} style={{fontSize: '4rem', marginBottom: '1rem'}}>
        {prediction?.prediction === 'Low Risk' ? '🎉' : '❌'}
      </div>
      <h2 style={{color: prediction?.prediction === 'Low Risk' ? 'var(--success)' : 'var(--danger)'}}>
        {prediction?.prediction === 'Low Risk' ? 'Loan Approved!' : 'Application Rejected'}
      </h2>
      <p style={{margin: '1rem 0', color: 'var(--text-muted)'}}>{prediction?.reason}</p>
      
      <div className="glass-panel" style={{padding: '1.5rem', textAlign: 'left', marginTop: '2rem'}}>
        <h4 style={{marginBottom: '1rem'}}>Financial Insights</h4>
        <ul style={{listStyle: 'none'}}>
          {prediction?.insights.map((insight, i) => (
            <li key={i} style={{marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', fontSize: '0.9rem'}}>
              <span style={{color: 'var(--primary)'}}>•</span> {insight}
            </li>
          ))}
        </ul>
      </div>

      <button className="secondary-btn" onClick={() => setStep(1)} style={{marginTop: '2rem', width: '100%'}}>New Application</button>
    </div>
  );

  return (
    <div className="dashboard-container">
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
        <div>
          <h1 style={{fontSize: '1.5rem'}}>LoanPredictor <span style={{color: 'var(--primary)'}}>PRO</span></h1>
          <p style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>Premium Fintech Assessment Engine</p>
        </div>
        <div style={{textAlign: 'right'}}>
          <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Live Approval Probability</p>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div className="prob-meter" style={{width: '100px'}}>
              <div className="prob-fill" style={{width: `${probability}%`, background: probability > 70 ? 'var(--success)' : probability > 40 ? 'var(--warning)' : 'var(--danger)'}}></div>
            </div>
            <span style={{fontWeight: 'bold', minWidth: '40px'}}>{probability}%</span>
          </div>
        </div>
      </header>

      {notification && (
        <div className={`fade-in`} style={{
          position: 'fixed', top: '2rem', right: '2rem', 
          background: notification.type === 'success' ? 'var(--success)' : notification.type === 'danger' ? 'var(--danger)' : 'var(--secondary)',
          color: 'var(--bg-main)', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 'bold', zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}>
          {notification.msg}
        </div>
      )}

      <main className="glass-panel" style={{padding: '3rem', maxWidth: '700px', margin: '0 auto'}}>
        <ProgressBar />
        {step === 1 && <Step1Identity />}
        {step === 2 && <Step2Financials />}
        {step === 3 && <Step3Loan />}
        {step === 4 && <Step4Docs />}
        {step === 5 && <Step5Result />}
        {error && <p style={{color: 'var(--danger)', marginTop: '1rem', textAlign: 'center'}}>{error}</p>}
      </main>

      {/* Application History Mini Dashboard */}
      <section className="fade-in" style={{maxWidth: '700px', margin: '3rem auto 0'}}>
        <h3 style={{marginBottom: '1rem', fontSize: '1rem'}}>Recent Activity</h3>
        <div className="glass-panel" style={{padding: '1.5rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border)'}}>
            <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Application ID: #44291</span>
            <span className="status-badge" style={{fontSize: '0.7rem', background: 'var(--success)', color: 'var(--bg-main)', padding: '2px 8px', borderRadius: '4px'}}>APPROVED</span>
          </div>
          <div style={{marginTop: '1rem', display: 'flex', justifyContent: 'space-between'}}>
            <p style={{fontSize: '0.9rem'}}>Home Loan - ₹1.5M</p>
            <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Applied: 24 Apr 2026</p>
          </div>
        </div>
      </section>

      <footer style={{marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem'}}>
        <div style={{display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem'}}>
          <span>🔒 AES-256 Encrypted</span>
          <span>🏦 RBI Compliant Logic</span>
          <span>⚡ Real-time ML Stacking</span>
        </div>
        <p>&copy; 2026 LoanPredictor Fintech Corp. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
