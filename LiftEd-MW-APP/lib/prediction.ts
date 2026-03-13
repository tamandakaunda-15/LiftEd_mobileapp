import type { PredictionResponse } from "./types"

export async function predictRisk(predictors: any): Promise<PredictionResponse> {
  try {
    // 1. DATA MAPPING: Ensure the keys match your Python Pydantic Schema exactly
    const mlPayload = {
      home_study_freq: Number(predictors.home_study_freq ?? 0),
      exercise_books: Number(predictors.exercise_books ?? 0),
      teacher_respect: Number(predictors.teacher_respect ?? 0),
      task_completion: Number(predictors.task_completion ?? 0),
      uniform_ownership: Number(predictors.uniform_ownership ?? 0),
      uniform_paid: Number(predictors.uniform_paid ?? 0),
      teacher_encouragement: Number(predictors.teacher_encouragement ?? 0),
      textbook_access: Number(predictors.textbook_access ?? 0),
      aspire_to_continue: Number(predictors.aspire_to_continue ?? 0),
      snack_money: Number(predictors.snack_money ?? 0),
    };

    console.log("Sending to FastAPI:", mlPayload);

    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mlPayload),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("FastAPI Validation Error:", errorBody);
      // This usually happens if a field is missing or a string is sent where a float is expected
      throw new Error(`ML Engine Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Mapping Python response (e.g., 99.0) back to your UI expectations
    return {
      riskScore: data.riskScore, 
      riskLevel: data.riskLevel,
      riskFactors: data.riskFactors || [],
    };
  } catch (error) {
    console.error("Connection Error (Python API):", error);
    // Rethrow so the Teacher's UI can show a proper "Connection Refused" toast
    throw error; 
  }
}