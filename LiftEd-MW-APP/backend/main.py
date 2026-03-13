import logging
import joblib
import pandas as pd
import numpy as np
import tensorflow as tf
import uvicorn
import shap
from typing import List, Dict, Optional, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 1. LOAD ASSETS & INITIALIZE SHAP
# 1. LOAD ASSETS & INITIALIZE SHAP
try:
    model = tf.keras.models.load_model("malawi_dropout_lstm_v2.keras")
    scaler = joblib.load("scaler_longitudinal_v2.pkl")
    logger.info(" LSTM Model and Scaler loaded successfully")
    
    # --- MODEL-AGNOSTIC XAI ARCHITECTURE ---
    # KernelExplainer likes 2D data, so we flatten our (5, 15) timesteps into 75 features
    background_2d = np.zeros((10, 75)) # Reduced to 10 for speed
    
    # We write a wrapper that reshapes the 2D data back to 3D for the LSTM
    def predict_wrapper(X_2d):
        X_3d = X_2d.reshape(-1, 5, 15)
        return model.predict(X_3d, verbose=0)
        
    explainer = shap.KernelExplainer(predict_wrapper, background_2d)
    logger.info(" SHAP KernelExplainer initialized (Bypassing TF Graph Bugs)")
except Exception as e:
    logger.error(f" Critical Error Loading Assets: {e}")
    explainer = None

app = FastAPI(
    title="LiftEd Malawi EWS API",
    description="Contextually-Aware Longitudinal Prediction with XAI",
    version="3.3"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. SCHEMAS
class RoundData(BaseModel):
    c16_2: float; c16_4: float; c19_2: float; g36a_9: float; h1: float
    g1b_2t: float; g36a_2: float; j3: float; g36c_4: float; c17: float
    g4_a: float; j5: float; j7: float; j2: float; g4_e: float

    @field_validator('*', mode='before')
    @classmethod
    def validate_input(cls, v: Any) -> Any:
        if not isinstance(v, (int, float)):
            raise ValueError('All inputs must be numeric')
        return v

class StudentHistoryRequest(BaseModel):
    history: List[RoundData] = Field(..., min_items=5, max_items=5)

class RiskAssessmentResponse(BaseModel):
    riskScore: float
    riskLevel: str
    isFlagged: bool
    majorFactors: List[str]
    trendAnalysis: str
    modelExplanation: str

# 3. MAPPING & CONSTANTS
HUMAN_MAPPING = {
    "c16_2": "Financial support for uniform",
    "c16_4": "Financial support for food/snacks",
    "c19_2": "Secured fee payer for next level",
    "g36a_9": "Social Development textbook access",
    "h1": "Teacher classroom encouragement",
    "g1b_2t": "School level transition risk",
    "g36a_2": "English textbook access",
    "j3": "Consistency in completing tasks",
    "g36c_4": "Mathematics textbook sharing",
    "c17": "Educational aspirations for next level",
    "g4_a": "Uniform ownership status",
    "j5": "Respect and discipline in school",
    "j7": "Home study habits",
    "j2": "Attentiveness during lessons",
    "g4_e": "Exercise book ownership"
}
FEATURE_ORDER = list(HUMAN_MAPPING.keys())

def get_risk_metadata(score: float) -> tuple:
    if score >= 60: return "CRITICAL", True
    if score >= 25: return "HIGH RISK", True
    return "STABLE / LOW RISK", False

# 4. ENDPOINTS
@app.post("/predict", response_model=RiskAssessmentResponse)
async def predict(data: StudentHistoryRequest):
    try:
        raw_matrix = []
        for rd in data.history:
            row = [getattr(rd, feat) for feat in FEATURE_ORDER]
            raw_matrix.append(row)
        
        matrix = np.array(raw_matrix)
        scaled_matrix = scaler.transform(matrix)
        final_input = scaled_matrix.reshape(1, 5, 15)

        # 4.1 RAW INFERENCE
        prediction_prob = float(model.predict(final_input, verbose=0)[0][0])
        display_score = prediction_prob * 100
        
        # 4.2 TREND LOGIC
        # 4.2 & 4.3 HEURISTIC OFFSET
        r1_avg = np.mean(matrix[0])
        r5_avg = np.mean(matrix[4])
        
        total_positive_indicators = np.sum(matrix) 
        if total_positive_indicators >= 70:
            display_score = max(5.0, display_score - 60.0) 
        elif total_positive_indicators >= 50 and r5_avg >= r1_avg:
            display_score = max(15.0, display_score - 30.0)
        
        display_score = round(display_score, 2)
        risk_level, flagged = get_risk_metadata(display_score)

        # 4.4 TRUE SHAP DYNAMIC FACTOR ANALYSIS
        # 4.4 TRUE SHAP DYNAMIC FACTOR ANALYSIS
        top_factors = []
        if explainer is not None and flagged:
            try:
                # Flatten the input to 2D for KernelExplainer
                final_input_2d = final_input.reshape(1, 75)
                
                # Get SHAP values
                shap_vals = explainer.shap_values(final_input_2d)
                
                # Extract the array (handles both single and multi-output formatting)
                val_array = shap_vals[0] if isinstance(shap_vals, list) else shap_vals
                
                # Reshape back to (5, 15) so we can sum across the 5 academic terms
                feature_impacts_3d = val_array.reshape(5, 15)
                feature_impacts = np.sum(feature_impacts_3d, axis=0) 
                
                impact_dict = {FEATURE_ORDER[i]: float(feature_impacts[i]) for i in range(15)}
                sorted_impacts = sorted(impact_dict.items(), key=lambda x: x[1], reverse=True)
                
                # Grab the top 3 drivers mapping back to human text
                top_factors = [HUMAN_MAPPING[feat] for feat, impact in sorted_impacts if impact > 0][:3]
            except Exception as shap_e:
                logger.error(f"SHAP failed: {shap_e}")

        # 4.5 FALLBACK 
        if not top_factors:
            current_round = raw_matrix[4]
            flagged_factors = [HUMAN_MAPPING[FEATURE_ORDER[i]] for i, val in enumerate(current_round) if val == 0]
            top_factors = flagged_factors[:3] if flagged_factors else ["Environmental baseline risk"]

        # 4.6 SMART TREND ANALYSIS & EXPLANATION
        # Remember: 1 = Good (Has resources), 0 = Bad (Lacks resources). 
        if display_score >= 60:
            if r5_avg < r1_avg:
                trend_status = "Sharply Declining (Protective factors have worsened over time)"
            elif r5_avg == r1_avg and r5_avg < 0.5:
                trend_status = "Consistently Critical (Prolonged lack of resources and support)"
            else:
                trend_status = "High Risk (Persistent vulnerability despite some stable areas)"
        elif display_score >= 25:
            if r5_avg < r1_avg:
                trend_status = "Deteriorating (Early warning signs of disengagement detected)"
            else:
                trend_status = "Chronically At-Risk (Stable, but lacks sufficient protective factors)"
        else:
            if r5_avg > r1_avg:
                trend_status = "Improving (Protective factors are increasing)"
            else:
                trend_status = "Consistently Stable (Strong, sustained support system)"

        # Dynamic Explanation mentioning the specific top factor!
        primary_driver = top_factors[0].lower() if top_factors else "multiple vulnerabilities"
        explanation = f"Based on the 5-term trajectory, the student is {risk_level}, heavily driven by {primary_driver}."

        return RiskAssessmentResponse(
            riskScore=display_score,
            riskLevel=risk_level,
            isFlagged=flagged,
            majorFactors=top_factors,
            trendAnalysis=trend_status,
            modelExplanation=explanation
        )

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)