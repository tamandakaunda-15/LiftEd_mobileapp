#  LiftEd: Predicting Student Dropout in Malawi

 A data-driven mobile application to combat student dropout in Malawi.
 
 [Deployment link](https://liftedmobileapp-production.up.railway.app/)
 
 [Short Video Demo](https://drive.google.com/file/d/1jbGH5BNc8elHjkD25yd0LOCAK4u5gmrh/view?usp=sharing)
 
 [LSTM Model API](https://lifted-webapp.onrender.com/docs)

 [Full Testing Links](https://www.canva.com/design/DAHD4Hcwg1M/nUEXoTKDqHypgeseOdQrWQ/edit?utm_content=DAHD4Hcwg1M&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

 

##  Project Overview
LiftEd is a web application that utilises machine learning to address the persistent challenge of student dropout in Malawi's primary and secondary schools. By providing a streamlined system for digitizing and tracking student attendance, LiftEd powers a machine learning model that proactively identifies and flags students at risk of dropping out. This tool is not just an attendance tracker; it is an early warning system that empowers school administrators and the Ministry of Education to implement timely, targeted interventions.

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
*   **Data Acquisition (Pilot Phase):** During the initial pilot program, attendance data is collected directly from an existing online database via secured access and submission of user intent on Havard DataVerse Database. This real-world dataset was critical for training and validating the model.
*   **Feature Engineering:** Building upon previous work, the model will use not only attendance records but also incorporate other socioeconomic and academic factors.
*   **Machine Learning Models:** The predictive core will involve comparing and deploying different classification models to find the most accurate solution for the Malawi-specific context.
*   **Model Validation:** Performance metrics such as precision, recall, and F1-score will be used to evaluate the model's effectiveness in accurately identifying at-risk students.
*   **Web Development:** A full-stack web application, including a mobile-optimized teacher interface and a dashboard for administrators, will serve as the front end of the system.


# Model Performance Highlights
The system’s predictive engine (LSTM) has been optimized for the Malawian educational context, achieving high-reliability metrics in identifying at-risk students across 5 terms.

***Overall Accuracy***: 70% > The model demonstrates a strong ability to classify student outcomes across the dataset correctly.

***At-Risk Detection (Recall)***: 80% > Using an optimized sensitivity threshold, the system successfully identifies 8 out of 10 students who are actually at risk of dropping out, allowing for early intervention.

***Precision Stability***: 0.79 (Class 0)

The model maintains high reliability in identifying students on a stable academic path, reducing unnecessary alarms for school administrators.


### Why 5 Rounds?
The model utilizes a 5-term temporal window to ensure high predictive validity. By analyzing a sequence of 5 rounds, the LSTM can distinguish between temporary academic fluctuations and sustained downward trends, allowing the system to intervene before a student reaches a **" point of no return"**.


## Model Explainability (SHAP) & Top Predictors
To ensure the LSTM model is transparent and actionable for educators, we integrated SHAP (Shapley Additive exPlanations). Instead of acting as a "black box," the system interprets the weight of each feature, allowing Headteachers and PEAs to understand the specific socio-economic and behavioral factors driving a student's risk score.

Based on the SHAP values and Feature Importance and correlation plots, extracted during training and before training respectively, the model identified the following Top 15 Predictors of student dropout in the Malawian context:

### Financial & Resource Factors:
```
    Payer: School Uniform (Who is responsible for providing the uniform)

    Payer: Food/Snacks (Financial stability regarding daily meals)

    Payer: Future Fees (Confidence in funding continuous education)

    Owns School Uniform (Direct indicator of material support)

     Owns an exercise book (Basic learning material availability)
```

### Academic Engagement & Behavior:

```
     Rarely Completes Tasks (Strong behavioral indicator of disengagement)

     Attentive in Class (Classroom presence and focus)

     Studies at Home (Supportive home learning environment)

     Respects Teachers (Integration into the school social structure)

     Aspiration: Continue (The student's personal educational goals)
```

### School Environment & Support:

```
    Teacher Encouragement (Impact of positive reinforcement)

   Used English Textbook (Access to core curriculum materials)

   Used Soc-Dev Textbook (Access to secondary curriculum materials)

   Shared Math Textbook (Resource constraints in the classroom)

   School Level (The critical transition between Primary and Secondary)
```




#  Repository Structure

```
├── LiftEd-Malawi/ # Core container of the full stack machine project
  
│ ├── app/ # Application logic
│ ├── dashboard/ # website-optimized web app (React, Tailwind CSS) containing (headteacher, teacher, and PEA dashboards)
│ ├── routes/ # API routes with Node.Js
│ └── ...

├── backend/ # Model file and requirements
│ ├── main.py/ # fast api for lstm model
│ ├── requirements.txt/ # List all needed libraries for installation
│ └── ...

├── ml_model notebook/ # Machine learning model pipeline
│ ├── notebooks/ # Jupyter notebooks for data exploration and modeling
│ ├── model.py # Python script for the prediction model
│ └── ...

├── README.md # This file

├── requirements.txt # Python dependencies for ML model

├── package.json # Node.js dependencies
└── ...

```


# System Access & Governance Flow(Student Data Security)
A multi-tier security architecture designed for the Malawi education ecosystem.

To maintain data integrity and student privacy, LiftEd utilizes a top-down registration hierarchy:

### 1. The PEA Tier (Zone Authority)
Access: PEAs register via the platform by selecting their assigned Zone.

Responsibility: PEAs are the only users authorized to register new Schools within the system.

Output: Upon registration, the system generates a unique EMIS Code for the school.

### 2. The Headteacher Tier (School Authority)
Access: Headteachers register using the EMIS Code provided by their PEA.

Responsibility: Once authenticated to their school, Headteachers manage the student census and Teacher Assignments.

Output: When a Headteacher adds a teacher, the system generates a Unique Login Key.


### 3. The Teacher Tier (Classroom Authority)
Access: Teachers log in using their Email and the Unique Login Key generated by their Headteacher.

Responsibility: Teachers have direct access to their assigned standards (e.g., Standard 7) to input term data and trigger the LSTM-powered dropout predictions.


### Design Responsiveness Across Devices
The mobile interface has been tested on multiple devices, and its intuitive design allows teachers to immediately visualize at-risk students—making early intervention practical and effective.
[Full Testing Links](https://www.canva.com/design/DAHD4Hcwg1M/nUEXoTKDqHypgeseOdQrWQ/edit?utm_content=DAHD4Hcwg1M&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)


#  How to Access the Platform & Testing Guide
To test the full hierarchy of the system, use the following credentials or follow the registration flow:

### Option A: Direct Login (Recommended for Grading)
I have pre-configured a test environment so you can immediately access the dashboards:

  ***Role: Teacher (Standard 2)***

  ***Email: kayamba@mail.com***

  ***Password: LE2J3M2F!***

  Access: Direct access to student prediction and classroom management.
  

### Option B: Full Registration Flow (Governance Test)
If you wish to test the security hierarchy from scratch:

 1. Register as a PEA: Create a PEA account and register a new School.

 2. Generate EMIS Code: The system will provide an EMIS Code for that school.

 3. Register as a Headteacher: Use the new EMIS Code to "claim" the school.

 4. Add a Teacher: From the Headteacher dashboard, add a teacher to a specific Standard/Class.

 5. Teacher Login: The teacher can now log in using the unique Login Key generated by the Headteacher.


# Live System Links

[Full Stack Deployment](https://liftedmobileapp-production.up.railway.app) : Railway (for both frontend and backend) 

[ML API Documentation](https://lifted-dropout-api.onrender.com/docs) : Render (fo the api live testing with shap explainability)

Database: Hosted on Supabase (PostgreSQL).


# Analysis of Results vs. Project Objectives

The primary objective of the LiftEd project was to develop a secure, end-to-end machine learning platform capable of predicting student dropout in Malawi to enable early interventions.

### 1. Predictive Modeling
 Objective Goal: Train a model to accurately identify students at risk of dropping out based on historical data.
 
Result: Achieved with strategic trade-offs. The LSTM model successfully utilized a 5-term temporal window to capture dropout trajectories.

During evaluation, we faced a standard machine learning trade-off between Precision and Recall. We purposefully tuned the classification threshold to 0.3, resulting in a Recall of 80% for the dropout class.

Analysis: While this lowered overall accuracy to around 44% at that specific threshold (compared to 70% at a 0.4 threshold), it was a necessary and successful optimization. In the context of Malawian education, the cost of a "False Negative" (failing to identify a dropout) is catastrophic, whereas a "False Positive" (flagging a stable student for a check-in) simply results in a brief, harmless teacher intervention.

### 2. Explainability and Intervention

Objective/ Goal: Provide teachers with actionable reasons why a student is at risk, rather than a "black-box" prediction.Result: Achieved. By integrating SHAP (SHapley Additive exPlanations), the system successfully maps predictions back to 15 top socio-economic and behavioral factors (e.g., "Payer: School Uniform" or "Rarely Completes Tasks").Analysis: 

This transforms the platform from a purely analytical tool into a decision-support system, directly fulfilling the proposal's goal of enabling targeted, resource-efficient interventions by school administrators.

### 3. Secure Governance
Objective/ Goal: Protect sensitive student demographic data through strict access controls.

Result: Achieved. The implementation of a multi-tier Role-Based Access Control (RBAC) system utilizing Supabase.

Analysis: The top-down hierarchy (PEA registers Schools, followed by the Headteacher registers Teachers and the Teachers access assigned Standards) successfully met the objective of modeling real-world Ministry of Education governance structures, ensuring data privacy at the classroom level.


### Limitations and Future Scope

While the objectives were largely met, the analysis revealed that predicting human behavior from socio-economic data contains inherent noise. The model's False Positive rate indicates that many students possess severe risk factors but demonstrate unmeasured resilience and do not drop out. Future iterations of this project could improve overall precision by incorporating real-time attendance tracking and continuous academic grading into the LSTM's temporal sequence.

### Future Work:

    Incorporate continuous academic performance ( in core subjects) and real-time attendance for improved precision.

    Expand deployment to additional districts in Malawi.

    Integrate additional predictive models (e.g., ensemble learning) to reduce false positives.

### Recommendations:

    Schools should use LiftEd daily to track attendance and identify at-risk students early.

    Training sessions for teachers and PEAs are essential for effective adoption.
 
    Ministry of Education can use aggregate dashboards to inform policy and resource allocation.    

##  Acknowledgements
This project is inspired by previous research, including the **"Student Dropout Prediction—Summative ML project,"** which provided a foundational understanding of predicting student outcomes using machine learning.
1. Data Source: [Havard Dataverse](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi%3A10.7910%2FDVN%2FV4C81G&version=2.1)

