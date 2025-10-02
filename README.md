#  LiftEd: Predicting Student Dropout in Malawi

**Tagline:** A data-driven mobile application to combat student dropout in Malawi.

##  Project Overview
LiftEd is a mobile-first web application designed to address the persistent challenge of student dropout in Malawi's primary and secondary schools. By providing a streamlined system for digitizing and tracking student attendance, LiftEd powers a machine learning model that proactively identifies and flags students at risk of dropping out. This tool is not just an attendance tracker; it is an early warning system that empowers school administrators and the Ministry of Education to implement timely, targeted interventions.

This project builds upon prior research and development in student dropout prediction to create a tangible, impactful solution tailored to the specific needs of the Malawian education system.

##  Problem Statement
Student dropout in Malawi is driven by a complex mix of socioeconomic, academic, and household factors. Without a centralized, real-time method for tracking student engagement, schools lack the crucial data needed to identify at-risk students before it's too late. The challenge is twofold:
1.  **Inefficient Data Collection:** Paper-based systems are slow, prone to error, and make timely analysis impossible.
2.  **Reactive Interventions:** Interventions often occur after a student has already dropped out, limiting their effectiveness.

##  Our Solution: How LiftEd Works
1.  **Mobile Attendance Tracking:** Teachers use a simple mobile interface to record daily student attendance, creating a clean, digital dataset in real-time.
2.  **Predictive Analytics:** This attendance data, along with other key factors, feeds a powerful machine learning model that calculates a student's risk of dropping out.
3.  **Early Warning System:** The app's dashboard visually alerts school administrators and education officials to students who are predicted to be at high risk.
4.  **Empowering Intervention:** With this real-time, data-driven insight, educators can initiate early and targeted support, improving student retention.

## ⚙️ Methodology & Technical Details
This project leverages a predictive analytics pipeline, adapting best practices from prior machine learning projects.

**Key Components:**
*   **Data Acquisition (Pilot Phase):** During the initial pilot program, attendance data will be collected directly from participating schools via the mobile application. This real-world dataset will be critical for training and validating the model.
*   **Feature Engineering:** Building upon previous work, the model will use not only attendance records but also incorporate other socioeconomic and academic factors.
*   **Machine Learning Models:** The predictive core will involve comparing and deploying different classification models to find the most accurate solution for the Malawi-specific context.
*   **Model Validation:** Performance metrics such as precision, recall, and F1-score will be used to evaluate the model's effectiveness in accurately identifying at-risk students.
*   **Web Development:** A full-stack web application, including a mobile-optimized teacher interface and a dashboard for administrators, will serve as the front end of the system.

##  Partnership with the Ministry of Education
This project is designed as a collaborative effort. A partnership with the Ministry of Education in Malawi is crucial for:
*   **Securing Data:** Safely and ethically collecting student data for a pilot program.
*   **Scaling the Solution:** Ensuring the system meets the Ministry's needs for a potential nationwide rollout.
*   **Guidance and Expertise:** Integrating the app into the existing educational framework and procedures.

##  Repository Structure
<details>
<summary>
.
├── backend/ # Back-end API (e.g., Node.js with Express)
│ ├── app/ # Application logic
│ ├── models/ # Database models
│ ├── routes/ # API routes
│ └── ...
├── frontend/ # Mobile-optimized web app (e.g., React)
│ ├── src/ # Source code
│ ├── public/ # Static assets
│ └── ...
├── data/ # Placeholder for proxy or pilot data
│ ├── proxy_data/ # High-level or public data for proof-of-concept
│ └── pilot_data/ # Secure folder for anonymized pilot data (future)
├── ml_model/ # Machine learning model pipeline
│ ├── notebooks/ # Jupyter notebooks for data exploration and modeling
│ ├── model.py # Python script for the prediction model
│ └── ...
├── README.md # This file
├── requirements.txt # Python dependencies for ML model
├── package.json # Node.js dependencies
└── ...
</summary>summary>
</details>

##  Milestones and Future Work
*   **Q4 2025: Proof-of-Concept:** Develop a functional prototype using publicly available proxy data to demonstrate the model's capabilities.
*   **Q1 2026: Pitch and Pilot Plan:** Present the proof-of-concept to the Ministry of Education and formalize the pilot program.
*   **Q2 2026: Pilot Deployment and Data Collection:** Deploy the app in selected schools and begin collecting real-world data under the Ministry's guidance.
*   **Q3 2026: Model Refinement and Full-Scale Development:** Train a more accurate model using pilot data and build out the full-featured application.

##  Acknowledgements
This project is inspired by previous research, including the **"Student Dropout Prediction—Summative ML project,"** which provided a foundational understanding of predicting student outcomes using machine learning.


