from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Home Loan Approval API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow your React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoanApplication(BaseModel):
    Gender: str
    Married: str
    Dependents: str
    Education: str
    Self_Employed: str
    ApplicantIncome: float
    CoapplicantIncome: float
    LoanAmount: float
    Loan_Amount_Term: float
    Credit_History: float
    Property_Area: str
    Property_Value: float = 0.0

@app.post("/predict")
async def get_prediction(application: LoanApplication):
    try:
        # ------- 20-30-40 Rule Business Logic Validation -------
        
        # 1. 20% Down Payment Rule
        # Assuming LoanAmount is requested in Thousands (e.g., 150 = $150,000)
        actual_loan_amount = application.LoanAmount * 1000
        
        if application.Property_Value > 0:
            max_loan_allowed = application.Property_Value * 0.80 # Must put at least 20% down
            if actual_loan_amount > max_loan_allowed:
                return {
                    "status": "success", 
                    "prediction": "N", 
                    "business_rule": True,
                    "reason": f"Fails the 20% Down Payment Rule: Maximum loan permitted for a property value of ₹{application.Property_Value:,.2f} is ₹{max_loan_allowed:,.2f}."
                }
        
        # 2. 30% EMI Rule
        total_monthly_income = application.ApplicantIncome + application.CoapplicantIncome
        max_emi_allowed = total_monthly_income * 0.30
        
        # EMI Calculation (Assuming a standard 8.5% annual interest rate for the rule check)
        r = 8.5 / 12 / 100 # Monthly interest rate
        n = application.Loan_Amount_Term # Term in months
        
        if n > 0 and r > 0 and actual_loan_amount > 0:
            emi = actual_loan_amount * r * ((1 + r)**n) / (((1 + r)**n) - 1)
            if emi > max_emi_allowed:
                return {
                    "status": "success", 
                    "prediction": "N", 
                    "business_rule": True,
                    "reason": f"Fails the 30% Income Rule: Estimated monthly EMI is ₹{emi:,.2f}, which exceeds the 30% threshold (₹{max_emi_allowed:,.2f}) of your gross monthly income."
                }
        
        # 3. Credit History Rule
        if application.Credit_History == 0:
             return {
                "status": "success", 
                "prediction": "N", 
                "business_rule": True,
                "reason": "Rejected due to poor Credit History. A score of 0.0 indicates significantly high lending risk."
            }
                
        # If the financial guidelines pass, return 'Y' (Eligible)
        return {
            "status": "success", 
            "prediction": "Y", 
            "business_rule": True, 
            "reason": "Congratulations! Your financial credentials meet the eligibility guidelines for this loan."
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
