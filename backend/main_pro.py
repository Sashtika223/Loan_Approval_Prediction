from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
from typing import Optional, List

app = FastAPI(title="LoanPredictor Pro API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models
try:
    model1 = joblib.load("model1.pkl")
    model2 = joblib.load("model2.pkl")
    model3 = joblib.load("model3.pkl")
    meta_model = joblib.load("meta_model.pkl")
    scaler = joblib.load("scaler.pkl")
    feature_columns = joblib.load("feature_columns.pkl")
except Exception as e:
    print(f"Error loading models: {e}")

class LoanApplication(BaseModel):
    Gender: str = "Male"
    Married: str = "No"
    Dependents: str = "0"
    Education: str = "Graduate"
    Self_Employed: str = "No"
    ApplicantIncome: float
    CoapplicantIncome: float = 0
    LoanAmount: float
    Loan_Amount_Term: float = 360
    Credit_History: float = 1.0
    Property_Area: str = "Urban"
    Property_Value: float
    Interest_Rate: float = 8.5

class PredictionResponse(BaseModel):
    prediction: str
    probability: float
    reason: str
    insights: List[str]
    dti_ratio: float
    ltv_ratio: float
    monthly_emi: float

def calculate_emi(principal: float, rate: float, months: float) -> float:
    if principal <= 0 or rate <= 0 or months <= 0:
        return 0
    r = (rate / 100) / 12
    emi = (principal * 1000) * r * ((1 + r)**months) / (((1 + r)**months) - 1)
    return round(emi, 2)

@app.post("/predict", response_model=PredictionResponse)
async def predict(data: LoanApplication):
    total_income = data.ApplicantIncome + data.CoapplicantIncome
    monthly_income = total_income / 12
    emi = calculate_emi(data.LoanAmount, data.Interest_Rate, data.Loan_Amount_Term)
    
    dti = (emi / monthly_income) if monthly_income > 0 else 1.0
    ltv = (data.LoanAmount * 1000 / data.Property_Value) if data.Property_Value > 0 else 1.0
    
    insights = []
    
    # 1. Business Guardrails (BEFORE ML)
    if total_income <= 0:
        return {
            "prediction": "High Risk",
            "probability": 0.05,
            "reason": "Critical: Total household income is zero.",
            "insights": ["Stable monthly income is mandatory for loan approval."],
            "dti_ratio": 1.0,
            "ltv_ratio": ltv,
            "monthly_emi": emi
        }
    
    if dti > 0.50:
        return {
            "prediction": "High Risk",
            "probability": 0.15,
            "reason": "High Debt-to-Income ratio detected.",
            "insights": [
                f"Your EMI takes up {dti*100:.1f}% of your income.",
                "Consider increasing loan tenure or reducing amount."
            ],
            "dti_ratio": dti,
            "ltv_ratio": ltv,
            "monthly_emi": emi
        }

    # 2. ML Prediction Logic
    try:
        # Preprocessing (similar to app.py)
        df_dict = {col: 0.0 for col in feature_columns}
        features_to_set = {
            'ApplicantIncome': data.ApplicantIncome,
            'CoapplicantIncome': data.CoapplicantIncome,
            'LoanAmount': data.LoanAmount,
            'Loan_Amount_Term': data.Loan_Amount_Term,
            'Property_Value': data.Property_Value,
            'Credit_History': data.Credit_History,
            'Total_Income': total_income,
            'LTV': ltv,
            'DTI': dti,
            'Monthly_Payment_to_Income_ratio': dti
        }
        
        # Categorical mapping
        if data.Gender == 'Male': df_dict['Gender_Male'] = 1.0
        if data.Married == 'Yes': df_dict['Married_Yes'] = 1.0
        if data.Dependents == '1': df_dict['Dependents_1'] = 1.0
        elif data.Dependents == '2': df_dict['Dependents_2'] = 1.0
        elif data.Dependents == '3+': df_dict['Dependents_3'] = 1.0
        if data.Education == 'Not Graduate': df_dict['Education_Not Graduate'] = 1.0
        if data.Self_Employed == 'Yes': df_dict['Self_Employed_Yes'] = 1.0
        if data.Property_Area == 'Urban': df_dict['Property_Area_Urban'] = 1.0
        
        for col in features_to_set:
            if col in df_dict: df_dict[col] = features_to_set[col]

        df = pd.DataFrame([df_dict])[feature_columns]
        df_scaled = scaler.transform(df)
        
        p1 = model1.predict(df_scaled)
        p2 = model2.predict(df_scaled)
        p3 = model3.predict(df_scaled)
        meta_input = np.column_stack((p1, p2, p3))
        
        final_prediction = meta_model.predict(meta_input)[0]
        
        # Mock probability based on ensemble agreement
        probs = [p1[0], p2[0], p3[0]]
        prob_score = sum(probs) / 3.0
        if final_prediction == 1.0:
            prob_score = max(prob_score, 0.75)
        else:
            prob_score = min(prob_score, 0.45)

        result = "Low Risk" if final_prediction == 1.0 else "High Risk"
        
        # Intelligence for insights
        if result == "Low Risk":
            insights.append("Profile shows strong financial stability.")
            if data.Credit_History == 1.0: insights.append("Excellent credit history detected.")
        else:
            if data.Credit_History == 0.0: insights.append("Improve your credit score to increase approval odds.")
            if ltv > 0.8: insights.append("High Loan-to-Value ratio. Try increasing your downpayment.")

        return {
            "prediction": result,
            "probability": round(prob_score * 100, 1),
            "reason": "Machine Learning analysis complete." if result == "Low Risk" else "Risk thresholds exceeded.",
            "insights": insights,
            "dti_ratio": round(dti, 3),
            "ltv_ratio": round(ltv, 3),
            "monthly_emi": emi
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
