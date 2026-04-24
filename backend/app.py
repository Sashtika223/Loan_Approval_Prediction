from flask_cors import CORS
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib

app = Flask(__name__)
# Explicitly allowing all origins for testing
CORS(app, resources={r"/*": {"origins": "*"}})

# Load newly generated dynamic models
model1 = joblib.load("model1.pkl")
model2 = joblib.load("model2.pkl")
model3 = joblib.load("model3.pkl")
meta_model = joblib.load("meta_model.pkl")

scaler = joblib.load("scaler.pkl")
feature_columns = joblib.load("feature_columns.pkl")

# ------------------------------
# Preprocessing function
# ------------------------------
def preprocess_input(data):
    # Initialize a dict mapped perfectly to exactly the columns needed by the loaded model
    df_dict = {col: 0.0 for col in feature_columns}
    
    app_inc = float(data.get('ApplicantIncome', 0))
    co_inc = float(data.get('CoapplicantIncome', 0))
    loan_amt = float(data.get('LoanAmount', 150))
    loan_term = float(data.get('Loan_Amount_Term', 360))
    cred_hist = float(data.get('Credit_History', 1.0))
    
    prop_val = float(data.get('Property_Value', 0))
    # No fallbacks. The user input must be directly used.

    # Start mapping values
    # Standard numerical values
    features_to_set = {
        'ApplicantIncome': app_inc,
        'CoapplicantIncome': co_inc,
        'LoanAmount': loan_amt,
        'Loan_Amount_Term': loan_term,
        'Property_Value': prop_val,
        'Credit_History': cred_hist,
        'Total_Income': app_inc + co_inc,
        'LTV': (loan_amt / prop_val) if prop_val > 0 else 1.0
    }
    
    total_inc = features_to_set['Total_Income']
    features_to_set['DTI'] = (loan_amt / total_inc) if total_inc > 0 else 1.0
    
    monthly_inc = total_inc / 12.0
    r = 0.08 / 12.0
    term = loan_term if loan_term > 0 else 360.0
    monthly_payment = loan_amt * (r * ((1 + r) ** term)) / (((1 + r) ** term) - 1)
    
    features_to_set['Monthly_Payment_to_Income_ratio'] = (monthly_payment / monthly_inc) if monthly_inc > 0 else 1.0
    
    # Categoricals mapping according to feature_columns
    if data.get('Gender') == 'Male':
        features_to_set['Gender_Male'] = 1.0
        
    married = str(data.get('Married', 'No'))
    if married.lower() == 'yes':
        features_to_set['Married_Yes'] = 1.0
        
    deps = str(data.get('Dependents', '0'))
    # The dataset encoded Dependents as '1', '2', '3' instead of '3+'
    if deps == '1':
        features_to_set['Dependents_1'] = 1.0
    elif deps == '2':
        features_to_set['Dependents_2'] = 1.0
    elif deps == '3+':
        features_to_set['Dependents_3'] = 1.0
        
    if data.get('Education') == 'Not Graduate':
        features_to_set['Education_Not Graduate'] = 1.0
        
    if data.get('Self_Employed') == 'Yes':
        features_to_set['Self_Employed_Yes'] = 1.0
        
    area = data.get('Property_Area', '')
    if area == 'Urban':
        features_to_set['Property_Area_Urban'] = 1.0

    # Now apply whichever feature set the CURRENT feature_columns.pkl dictates
    for col in features_to_set:
        if col in df_dict:
            df_dict[col] = features_to_set[col]

    # Structure into the exact order for standard scaling
    df = pd.DataFrame([df_dict])[feature_columns]
    
    # Scale based on the loaded scaler
    df_scaled = scaler.transform(df)

    return df_scaled

# ------------------------------
# Health Check API
# ------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

# ------------------------------
# Prediction API
# ------------------------------
@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    try:
        data = request.json
        
        # Attempt to cast raw payloads to numeric if needed
        for key in data:
            if isinstance(data[key], str) and data[key].replace('.', '', 1).isdigit():
                data[key] = float(data[key])
                
        # Business rule: zero loan amount is always Low Risk — bypass the model
        if float(data.get('LoanAmount', 0)) == 0:
            return jsonify({
                "prediction": "Low Risk",
                "reason": "Zero loan amount requested. Guaranteed safe facility."
            })
            
        # Business rule: Zero or negative total income is an automatic High Risk
        total_income = float(data.get('ApplicantIncome', 0)) + float(data.get('CoapplicantIncome', 0))
        if total_income <= 0:
            return jsonify({
                "prediction": "High Risk",
                "reason": "Total declared income is zero. Applicant does not have the capacity to repay the loan."
            })
        processed = preprocess_input(data)

        # Predict Base Models
        p1 = model1.predict(processed)
        p2 = model2.predict(processed)
        p3 = model3.predict(processed)

        # Meta Model Stacking Structure
        meta_input = np.column_stack((p1, p2, p3))
        
        # Final Prediction
        final = meta_model.predict(meta_input)

        prediction_val = final[0]
        result = "Low Risk" if prediction_val == 1.0 else "High Risk"

        # Generate intelligent reasoning matching prediction
        reasons = []
        loan_amt, prop_val = float(data.get('LoanAmount', 150)), float(data.get('Property_Value', 0))
        total_inc = float(data.get('ApplicantIncome', 0)) + float(data.get('CoapplicantIncome', 0))
        
        monthly_inc = total_inc / 12.0
        r = 0.08 / 12.0
        term = float(data.get('Loan_Amount_Term', 360))
        monthly_payment = loan_amt * (r * ((1 + r) ** term)) / (((1 + r) ** term) - 1) if loan_amt > 0 else 0.0
        
        pmti = monthly_payment / monthly_inc if monthly_inc > 0 else 1.0
        ltv = loan_amt / prop_val if prop_val > 0 else 2.0
        
        if result == "Low Risk":
            if loan_amt == 0: reasons.append("Zero loan amount requested. Guaranteed safe facility.")
            else:
                if pmti <= 0.45: reasons.append(f"Income securely supports calculated monthly EMIs.")
                if ltv <= 0.8: reasons.append("Property value yields robust collateral backing.")
                if float(data.get('Credit_History', 1)) == 1.0: reasons.append("Excellent credit history solidifies safety.")
            reason = " ".join(reasons) if reasons else "Profile successfully hits automatic machine learning approval thresholds."
        else:
            if pmti > 0.45: reasons.append("Calculated monthly EMI exceeds safe affordability thresholds given declared income.")
            if ltv > 0.85: reasons.append("Requested loan aggressively exceeds property collateral value (> 85% LTV).")
            if float(data.get('Credit_History', 1)) == 0.0: reasons.append("Critical risk flagged due to negative credit history.")
            reason = " ".join(reasons) if reasons else "Risk classification algorithm flagged overlapping high-risk affordability vectors."

        return jsonify({"prediction": result, "reason": reason})
        
    except Exception as e:
        print("Prediction Error:", str(e))
        return jsonify({"prediction": "High Risk", "reason": f"System error processing evaluation: {str(e)}"}), 500

# ------------------------------
# Run server
# ------------------------------
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)