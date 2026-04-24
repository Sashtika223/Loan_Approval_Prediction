# Loan Approval Prediction System 🏦

A full-stack, machine-learning-powered application designed to predict home loan eligibility based on personal and financial data. The system features a modern, premium Glassmorphism UI and a robust backend ensemble of ML models.

## 🚀 Key Features
- **Stacked Ensemble ML Model**: Utilizes multiple models (Base Models -> Meta-Model) for high-accuracy risk prediction.
- **Intelligent Reasoning**: Provides detailed explanations for why a loan was classified as "High Risk" or "Low Risk".
- **Business Safeguards**: Hardcoded financial guardrails (e.g., automatic rejection for 0 income) to complement ML logic.
- **Premium UI/UX**: Built with React and Vanilla CSS, featuring dynamic background effects and a responsive glassmorphism design.
- **Secure Simulation**: Includes a mock authentication system for multi-user simulation.

## 🛠️ Technology Stack
- **Frontend**: React.js, Vite
- **Backend**: Python, Flask, Flask-CORS
- **Machine Learning**: Scikit-learn, Pandas, Joblib
- **Styling**: Vanilla CSS (Custom Design System)

## 📦 Project Structure
- `/frontend`: React application (Vite-based)
- `/backend`: Flask API server and ML models (`.pkl` files)

## ⚙️ How to Run

### 1. Backend Setup (Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*Backend runs on `http://localhost:8000`*

### 2. Frontend Setup (React)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

## 📊 Expected Output & Logic

### Low Risk (Approved)
The system predicts Low Risk when:
- Credit History is **1.0 (Good)**.
- Loan-to-Value (LTV) ratio is **<= 80%**.
- Monthly EMI is **<= 45%** of total income.

### High Risk (Rejected)
The system predicts High Risk when:
- Credit History is **0.0 (Poor)**.
- Total declared income is **$0**.
- Debt-to-Income or LTV ratios exceed safe banking thresholds.

---
Developed with ❤️ by Sashtika
