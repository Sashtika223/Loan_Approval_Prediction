# Loan Approval Prediction System 🚀

![Output Preview](assets/output_preview.png)

## 📝 Project Description
This is a high-performance full-stack web application designed to revolutionize the way home loan eligibility is assessed. By leveraging a **Stacked Ensemble Machine Learning model**, the system moves beyond simple spreadsheets to provide a dynamic, multi-factored risk analysis. 

The application evaluates complex relationships between income, credit history, and property value to categorize applicants into **Low Risk** or **High Risk** profiles. It features a premium "Aura" design system with glassmorphism and real-time financial reasoning.

## ✨ Features
- **Smart Prediction**: Utilizes a meta-model stacking technique with three base models for higher accuracy.
- **Financial Guardrails**: Built-in business rules to prevent illogical approvals (e.g., zero income rejections).
- **Premium UI**: Modern, responsive dashboard with glassmorphism aesthetics and smooth animations.
- **Secure Authentication**: Local session management for user registration and login.
- **Dynamic Reasoning**: Provides detailed explanations for every "Low Risk" or "High Risk" decision based on LTV (Loan-to-Value) and DTI (Debt-to-Income) ratios.

## 🛠️ Technology Stack
- **Frontend**: React (Vite), Vanilla CSS3, Lucide Icons.
- **Backend**: Python, Flask, Flask-CORS.
- **Machine Learning**: Scikit-learn, Pandas, Joblib (Stacked Ensemble Model).

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*Backend runs on `http://localhost:8000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

## 📊 Sample Output & Risk Logic
The system evaluates applications based on key financial vectors:
- **Low Risk**: Usually assigned when Credit History is Good (1.0), LTV is ≤ 80%, and monthly EMI is ≤ 45% of income.
- **High Risk**: Triggered by poor credit history, insufficient collateral, or high debt-to-income ratios.
- **Automatic Rejection**: Applications with zero declared income are automatically flagged as High Risk to ensure financial safety.

### Example API Response
```json
{
  "prediction": "Low Risk",
  "reason": "Income securely supports calculated monthly EMIs. Property value yields robust collateral backing. Excellent credit history solidifies safety."
}
```

## 🤝 Test Credentials
- **Email**: `test@example.com`
- **Password**: `password123`

---
Developed for secure and intelligent financial assessment.
