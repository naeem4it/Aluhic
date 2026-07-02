import { db } from "../db";
import { 
  aiAppointmentOptimizations, patientRiskScores, aiLabSuggestions,
  teleconsultTriages, prescriptionValidations, drugInteractions, medications,
  patients, patientVitals, consultations, prescriptions, appointments,
  healthcareDoctors, healthcareFacilities, doctorAvailability
} from "@shared/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

interface AppointmentSuggestion {
  suggestedDate: Date;
  suggestedTimeSlot: string;
  confidenceScore: number;
  urgencyLevel: string;
  expectedWaitTime: number;
  reasoningFactors: {
    doctorAvailability: number;
    historicalDemand: number;
    urgencyFactor: number;
    patientPreference: number;
  };
}

interface RiskScoreResult {
  riskScore: number;
  riskLevel: string;
  riskType: string;
  contributingFactors: {
    vitals: { factor: string; weight: number; value: string }[];
    labResults: { factor: string; weight: number; value: string }[];
    medications: { factor: string; weight: number; value: string }[];
    history: { factor: string; weight: number; value: string }[];
  };
  recommendations: string[];
}

interface LabSuggestion {
  testName: string;
  testType: string;
  priority: string;
  reasoning: string;
  confidenceScore: number;
}

interface TriageResult {
  category: string;
  urgencyLevel: string;
  suggestedSpecialty: string;
  suggestedAction: string;
  extractedSymptoms: string[];
  redFlags: string[];
  confidenceScore: number;
}

interface PrescriptionValidationResult {
  validationStatus: string;
  overallRiskLevel: string;
  drugInteractions: { drug1: string; drug2: string; severity: string; description: string }[];
  dosageWarnings: { medication: string; issue: string; recommendation: string }[];
  allergyAlerts: { medication: string; allergen: string; severity: string }[];
  duplicateTherapy: { drug1: string; drug2: string; therapeuticClass: string }[];
  requiresPharmacistReview: boolean;
}

const SYMPTOM_KEYWORDS: Record<string, string[]> = {
  cardiology: ["chest pain", "heart", "palpitation", "shortness of breath", "cardiac", "blood pressure", "hypertension", "angina"],
  dermatology: ["skin", "rash", "itching", "eczema", "acne", "psoriasis", "dermatitis", "allergy"],
  orthopedics: ["bone", "joint", "fracture", "sprain", "arthritis", "back pain", "knee", "hip", "shoulder"],
  neurology: ["headache", "migraine", "dizziness", "seizure", "numbness", "tingling", "stroke", "memory"],
  gastroenterology: ["stomach", "abdominal pain", "nausea", "vomiting", "diarrhea", "constipation", "acid reflux", "indigestion"],
  pulmonology: ["cough", "breathing", "asthma", "wheezing", "pneumonia", "bronchitis", "lung"],
  endocrinology: ["diabetes", "thyroid", "hormone", "weight gain", "fatigue", "metabolic"],
  general: ["fever", "cold", "flu", "weakness", "pain", "infection"]
};

const RED_FLAG_SYMPTOMS = [
  "chest pain", "difficulty breathing", "severe headache", "loss of consciousness",
  "severe bleeding", "stroke symptoms", "high fever", "seizure", "severe allergic reaction",
  "suicidal thoughts", "severe abdominal pain", "sudden vision loss"
];

const URGENCY_KEYWORDS = {
  emergency: ["severe", "sudden", "acute", "emergency", "unbearable", "excruciating", "life-threatening"],
  urgent: ["worsening", "persistent", "moderate", "concerning", "spreading"],
  soon: ["mild", "recurring", "chronic", "ongoing"],
  routine: ["minor", "occasional", "slight", "follow-up", "check-up"]
};

export class HealthcareAIService {
  
  async suggestAppointmentSlots(
    facilityId: string,
    doctorId?: string,
    patientId?: string,
    urgency: string = "normal"
  ): Promise<AppointmentSuggestion[]> {
    const suggestions: AppointmentSuggestion[] = [];
    const now = new Date();
    
    const availability = doctorId ? await db.select()
      .from(doctorAvailability)
      .where(eq(doctorAvailability.doctorId, doctorId)) : [];
    
    const existingAppointments = await db.select()
      .from(appointments)
      .where(and(
        eq(appointments.facilityId, facilityId),
        gte(appointments.appointmentDate, now)
      ))
      .limit(100);

    const appointmentsBySlot = new Map<string, number>();
    existingAppointments.forEach(apt => {
      const key = `${apt.appointmentDate?.toISOString().split('T')[0]}-${apt.appointmentTime}`;
      appointmentsBySlot.set(key, (appointmentsBySlot.get(key) || 0) + 1);
    });

    const urgencyMultiplier = urgency === "emergency" ? 0 : urgency === "high" ? 1 : urgency === "normal" ? 3 : 5;
    
    for (let dayOffset = urgencyMultiplier; dayOffset < 7 + urgencyMultiplier; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      
      if (date.getDay() === 0) continue;
      
      const timeSlots = ["09:00-09:30", "09:30-10:00", "10:00-10:30", "10:30-11:00", 
                         "11:00-11:30", "11:30-12:00", "14:00-14:30", "14:30-15:00",
                         "15:00-15:30", "15:30-16:00", "16:00-16:30", "16:30-17:00"];
      
      for (const slot of timeSlots) {
        const key = `${date.toISOString().split('T')[0]}-${slot}`;
        const existingCount = appointmentsBySlot.get(key) || 0;
        
        if (existingCount < 3) {
          const demandScore = Math.max(0, 1 - (existingCount * 0.3));
          const dayScore = dayOffset < 3 ? 0.9 : dayOffset < 5 ? 0.7 : 0.5;
          const timeScore = slot.startsWith("10") || slot.startsWith("15") ? 0.9 : 0.7;
          
          const confidenceScore = (demandScore * 0.4 + dayScore * 0.3 + timeScore * 0.3);
          
          suggestions.push({
            suggestedDate: date,
            suggestedTimeSlot: slot,
            confidenceScore: Number(confidenceScore.toFixed(4)),
            urgencyLevel: urgency,
            expectedWaitTime: Math.round(existingCount * 10 + 5),
            reasoningFactors: {
              doctorAvailability: dayScore,
              historicalDemand: demandScore,
              urgencyFactor: urgencyMultiplier === 0 ? 1 : 1 / urgencyMultiplier,
              patientPreference: timeScore
            }
          });
        }
      }
    }

    return suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 5);
  }

  async calculatePatientRiskScore(patientId: string, facilityId: string): Promise<RiskScoreResult> {
    const vitals = await db.select()
      .from(patientVitals)
      .where(eq(patientVitals.patientId, patientId))
      .orderBy(desc(patientVitals.recordedAt))
      .limit(5);

    const patientData = await db.select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    const recentConsultations = await db.select()
      .from(consultations)
      .where(eq(consultations.patientId, patientId))
      .orderBy(desc(consultations.consultationDate))
      .limit(10);

    const contributingFactors = {
      vitals: [] as { factor: string; weight: number; value: string }[],
      labResults: [] as { factor: string; weight: number; value: string }[],
      medications: [] as { factor: string; weight: number; value: string }[],
      history: [] as { factor: string; weight: number; value: string }[]
    };

    let riskScore = 0;
    const recommendations: string[] = [];

    if (vitals.length > 0) {
      const latestVitals = vitals[0];
      
      if (latestVitals.bloodPressureSystolic) {
        const systolic = latestVitals.bloodPressureSystolic;
        if (systolic > 140) {
          riskScore += 0.2;
          contributingFactors.vitals.push({ factor: "High Blood Pressure", weight: 0.2, value: `${systolic} mmHg` });
          recommendations.push("Monitor blood pressure regularly and consider lifestyle modifications");
        } else if (systolic > 130) {
          riskScore += 0.1;
          contributingFactors.vitals.push({ factor: "Elevated Blood Pressure", weight: 0.1, value: `${systolic} mmHg` });
        }
      }

      if (latestVitals.sugarLevel) {
        const sugar = parseFloat(latestVitals.sugarLevel);
        if (sugar > 200) {
          riskScore += 0.25;
          contributingFactors.vitals.push({ factor: "High Blood Sugar", weight: 0.25, value: `${sugar} mg/dL` });
          recommendations.push("Urgent diabetes management consultation required");
        } else if (sugar > 140) {
          riskScore += 0.15;
          contributingFactors.vitals.push({ factor: "Elevated Blood Sugar", weight: 0.15, value: `${sugar} mg/dL` });
          recommendations.push("Consider HbA1c test and dietary consultation");
        }
      }

      if (latestVitals.oxygenLevel) {
        const o2 = parseFloat(latestVitals.oxygenLevel);
        if (o2 < 92) {
          riskScore += 0.3;
          contributingFactors.vitals.push({ factor: "Low Oxygen Saturation", weight: 0.3, value: `${o2}%` });
          recommendations.push("Immediate pulmonary evaluation recommended");
        } else if (o2 < 95) {
          riskScore += 0.1;
          contributingFactors.vitals.push({ factor: "Borderline Oxygen Saturation", weight: 0.1, value: `${o2}%` });
        }
      }

      if (latestVitals.pulseRate) {
        const pulse = latestVitals.pulseRate;
        if (pulse > 100 || pulse < 60) {
          riskScore += 0.1;
          contributingFactors.vitals.push({ factor: "Abnormal Heart Rate", weight: 0.1, value: `${pulse} bpm` });
          if (pulse > 100) {
            recommendations.push("Evaluate for tachycardia causes");
          }
        }
      }
    }

    if (patientData.length > 0) {
      const patient = patientData[0];
      if (patient.age) {
        const age = patient.age;
        if (age > 65) {
          riskScore += 0.1;
          contributingFactors.history.push({ factor: "Age Factor", weight: 0.1, value: `${age} years` });
        }
      }

      if (patient.medicalHistory) {
        const history = patient.medicalHistory.toLowerCase();
        if (history.includes("diabetes")) {
          riskScore += 0.15;
          contributingFactors.history.push({ factor: "Diabetes History", weight: 0.15, value: "Present" });
        }
        if (history.includes("hypertension") || history.includes("heart")) {
          riskScore += 0.15;
          contributingFactors.history.push({ factor: "Cardiovascular History", weight: 0.15, value: "Present" });
        }
      }
    }

    if (recentConsultations.length > 3) {
      riskScore += 0.05;
      contributingFactors.history.push({ factor: "Frequent Consultations", weight: 0.05, value: `${recentConsultations.length} in recent period` });
      recommendations.push("Review for chronic condition management optimization");
    }

    riskScore = Math.min(riskScore, 1);
    
    let riskLevel: string;
    if (riskScore >= 0.7) riskLevel = "critical";
    else if (riskScore >= 0.5) riskLevel = "high";
    else if (riskScore >= 0.3) riskLevel = "moderate";
    else riskLevel = "low";

    if (recommendations.length === 0) {
      recommendations.push("Continue regular health monitoring");
    }

    return {
      riskScore: Number(riskScore.toFixed(4)),
      riskLevel,
      riskType: "hospitalization",
      contributingFactors,
      recommendations
    };
  }

  async suggestLabTests(patientId: string, symptoms: string[], consultationId?: string): Promise<LabSuggestion[]> {
    const suggestions: LabSuggestion[] = [];
    const symptomsLower = symptoms.map(s => s.toLowerCase());
    
    const commonTests: Record<string, { triggers: string[]; testType: string; priority: string; reasoning: string }> = {
      "Complete Blood Count (CBC)": {
        triggers: ["fever", "weakness", "fatigue", "infection", "anemia"],
        testType: "blood",
        priority: "high",
        reasoning: "Basic screening to detect infections, anemia, and blood disorders"
      },
      "Blood Sugar (Fasting)": {
        triggers: ["diabetes", "thirst", "frequent urination", "fatigue", "weight loss"],
        testType: "blood",
        priority: "high",
        reasoning: "Essential for diabetes screening and glucose metabolism assessment"
      },
      "Lipid Profile": {
        triggers: ["heart", "cholesterol", "chest pain", "obesity", "hypertension"],
        testType: "blood",
        priority: "medium",
        reasoning: "Cardiovascular risk assessment through cholesterol levels"
      },
      "Thyroid Function Test": {
        triggers: ["thyroid", "weight gain", "weight loss", "fatigue", "hair loss", "cold intolerance"],
        testType: "blood",
        priority: "medium",
        reasoning: "Evaluate thyroid hormone levels for metabolic disorders"
      },
      "Liver Function Test": {
        triggers: ["liver", "jaundice", "abdominal pain", "nausea", "alcohol"],
        testType: "blood",
        priority: "high",
        reasoning: "Assess liver health and function"
      },
      "Kidney Function Test": {
        triggers: ["kidney", "urination", "swelling", "back pain", "hypertension"],
        testType: "blood",
        priority: "high",
        reasoning: "Evaluate kidney function and detect renal issues"
      },
      "Urine Analysis": {
        triggers: ["urination", "burning", "kidney", "infection", "diabetes"],
        testType: "urine",
        priority: "medium",
        reasoning: "Screen for UTI, kidney issues, and diabetes"
      },
      "Chest X-Ray": {
        triggers: ["cough", "breathing", "chest pain", "pneumonia", "lung"],
        testType: "x-ray",
        priority: "high",
        reasoning: "Evaluate lung and chest conditions"
      },
      "ECG": {
        triggers: ["heart", "chest pain", "palpitation", "breathlessness", "cardiac"],
        testType: "ecg",
        priority: "urgent",
        reasoning: "Assess heart rhythm and electrical activity"
      },
      "Ultrasound Abdomen": {
        triggers: ["abdominal pain", "liver", "kidney", "gallbladder", "pancreas"],
        testType: "ultrasound",
        priority: "medium",
        reasoning: "Non-invasive imaging for abdominal organ evaluation"
      }
    };

    for (const [testName, testInfo] of Object.entries(commonTests)) {
      const matchedTriggers = testInfo.triggers.filter(trigger => 
        symptomsLower.some(symptom => symptom.includes(trigger) || trigger.includes(symptom))
      );
      
      if (matchedTriggers.length > 0) {
        const confidenceScore = Math.min(0.5 + (matchedTriggers.length * 0.15), 0.95);
        suggestions.push({
          testName,
          testType: testInfo.testType,
          priority: testInfo.priority,
          reasoning: `${testInfo.reasoning}. Matched symptoms: ${matchedTriggers.join(", ")}`,
          confidenceScore: Number(confidenceScore.toFixed(4))
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
    });
  }

  async performTeleconsultTriage(complaint: string, facilityId: string, patientId?: string): Promise<TriageResult> {
    const complaintLower = complaint.toLowerCase();
    const extractedSymptoms: string[] = [];
    const redFlags: string[] = [];
    let category = "general";
    let urgencyLevel = "routine";
    let suggestedAction = "teleconsult";

    for (const keyword of RED_FLAG_SYMPTOMS) {
      if (complaintLower.includes(keyword)) {
        redFlags.push(keyword);
      }
    }

    for (const [specialty, keywords] of Object.entries(SYMPTOM_KEYWORDS)) {
      for (const keyword of keywords) {
        if (complaintLower.includes(keyword)) {
          extractedSymptoms.push(keyword);
          if (specialty !== "general" && category === "general") {
            category = specialty;
          }
        }
      }
    }

    if (redFlags.length > 0) {
      urgencyLevel = "emergency";
      suggestedAction = "emergency";
    } else {
      for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
        if (keywords.some(keyword => complaintLower.includes(keyword))) {
          urgencyLevel = level;
          break;
        }
      }
    }

    if (urgencyLevel === "urgent") {
      suggestedAction = "in_person";
    } else if (urgencyLevel === "emergency") {
      suggestedAction = "emergency";
    } else if (extractedSymptoms.length <= 1 && !redFlags.length) {
      suggestedAction = "self_care";
    }

    const confidenceScore = Math.min(0.5 + (extractedSymptoms.length * 0.1) + (redFlags.length * 0.15), 0.95);

    const specialtyMap: Record<string, string> = {
      cardiology: "Cardiologist",
      dermatology: "Dermatologist",
      orthopedics: "Orthopedic Surgeon",
      neurology: "Neurologist",
      gastroenterology: "Gastroenterologist",
      pulmonology: "Pulmonologist",
      endocrinology: "Endocrinologist",
      general: "General Physician"
    };

    return {
      category,
      urgencyLevel,
      suggestedSpecialty: specialtyMap[category] || "General Physician",
      suggestedAction,
      extractedSymptoms,
      redFlags,
      confidenceScore: Number(confidenceScore.toFixed(4))
    };
  }

  async validatePrescription(prescriptionId: string, patientId: string): Promise<PrescriptionValidationResult> {
    const prescriptionData = await db.select()
      .from(prescriptions)
      .where(eq(prescriptions.id, prescriptionId))
      .limit(1);

    const patientData = await db.select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    const knownInteractions = await db.select()
      .from(drugInteractions)
      .limit(100);

    const knownMedications = await db.select()
      .from(medications)
      .limit(100);

    const result: PrescriptionValidationResult = {
      validationStatus: "passed",
      overallRiskLevel: "low",
      drugInteractions: [],
      dosageWarnings: [],
      allergyAlerts: [],
      duplicateTherapy: [],
      requiresPharmacistReview: false
    };

    if (prescriptionData.length === 0) {
      return result;
    }

    const prescription = prescriptionData[0];
    const patient = patientData[0];
    
    let medicationsList: { name: string; dosage: string; frequency: string }[] = [];
    if (prescription.medications) {
      try {
        medicationsList = typeof prescription.medications === 'string' 
          ? JSON.parse(prescription.medications) 
          : prescription.medications as any;
      } catch {
        medicationsList = [];
      }
    }

    const commonInteractions: Record<string, { conflicts: string[]; severity: string; description: string }> = {
      "warfarin": { 
        conflicts: ["aspirin", "ibuprofen", "naproxen"], 
        severity: "high", 
        description: "Increased bleeding risk" 
      },
      "metformin": { 
        conflicts: ["alcohol", "contrast dye"], 
        severity: "moderate", 
        description: "Risk of lactic acidosis" 
      },
      "lisinopril": { 
        conflicts: ["potassium supplements", "spironolactone"], 
        severity: "moderate", 
        description: "Risk of hyperkalemia" 
      },
      "simvastatin": { 
        conflicts: ["grapefruit", "erythromycin", "clarithromycin"], 
        severity: "moderate", 
        description: "Increased risk of muscle damage" 
      },
      "clopidogrel": {
        conflicts: ["omeprazole", "esomeprazole"],
        severity: "moderate",
        description: "Reduced antiplatelet effect"
      }
    };

    for (let i = 0; i < medicationsList.length; i++) {
      const drug1 = medicationsList[i].name.toLowerCase();
      
      for (const [interactingDrug, interactionInfo] of Object.entries(commonInteractions)) {
        if (drug1.includes(interactingDrug)) {
          for (let j = 0; j < medicationsList.length; j++) {
            if (i !== j) {
              const drug2 = medicationsList[j].name.toLowerCase();
              for (const conflict of interactionInfo.conflicts) {
                if (drug2.includes(conflict)) {
                  result.drugInteractions.push({
                    drug1: medicationsList[i].name,
                    drug2: medicationsList[j].name,
                    severity: interactionInfo.severity,
                    description: interactionInfo.description
                  });
                }
              }
            }
          }
        }
      }
    }

    const therapeuticClasses: Record<string, string[]> = {
      "ACE Inhibitors": ["lisinopril", "enalapril", "ramipril", "captopril"],
      "Beta Blockers": ["metoprolol", "atenolol", "propranolol", "carvedilol"],
      "Statins": ["atorvastatin", "simvastatin", "rosuvastatin", "pravastatin"],
      "NSAIDs": ["ibuprofen", "naproxen", "diclofenac", "celecoxib"],
      "PPIs": ["omeprazole", "pantoprazole", "esomeprazole", "lansoprazole"]
    };

    for (const [className, drugs] of Object.entries(therapeuticClasses)) {
      const matchedDrugs = medicationsList.filter(med => 
        drugs.some(drug => med.name.toLowerCase().includes(drug))
      );
      if (matchedDrugs.length > 1) {
        result.duplicateTherapy.push({
          drug1: matchedDrugs[0].name,
          drug2: matchedDrugs[1].name,
          therapeuticClass: className
        });
      }
    }

    if (patient?.allergies) {
      const allergies = patient.allergies.toLowerCase().split(",").map(a => a.trim());
      for (const med of medicationsList) {
        for (const allergy of allergies) {
          if (med.name.toLowerCase().includes(allergy) || allergy.includes(med.name.toLowerCase())) {
            result.allergyAlerts.push({
              medication: med.name,
              allergen: allergy,
              severity: "high"
            });
          }
        }
      }
    }

    if (result.drugInteractions.length > 0 || result.allergyAlerts.length > 0) {
      result.validationStatus = "error";
      result.overallRiskLevel = "high";
      result.requiresPharmacistReview = true;
    } else if (result.duplicateTherapy.length > 0 || result.dosageWarnings.length > 0) {
      result.validationStatus = "warning";
      result.overallRiskLevel = "moderate";
    }

    return result;
  }

  async saveAppointmentOptimization(optimization: any) {
    const result = await db.insert(aiAppointmentOptimizations).values(optimization).returning();
    return result[0];
  }

  async savePatientRiskScore(riskScore: any) {
    const result = await db.insert(patientRiskScores).values(riskScore).returning();
    return result[0];
  }

  async saveLabSuggestion(suggestion: any) {
    const result = await db.insert(aiLabSuggestions).values(suggestion).returning();
    return result[0];
  }

  async saveTeleconsultTriage(triage: any) {
    const result = await db.insert(teleconsultTriages).values(triage).returning();
    return result[0];
  }

  async savePrescriptionValidation(validation: any) {
    const result = await db.insert(prescriptionValidations).values(validation).returning();
    return result[0];
  }

  async getPatientRiskScores(patientId: string) {
    return db.select()
      .from(patientRiskScores)
      .where(eq(patientRiskScores.patientId, patientId))
      .orderBy(desc(patientRiskScores.createdAt))
      .limit(10);
  }

  async getLabSuggestions(patientId: string) {
    return db.select()
      .from(aiLabSuggestions)
      .where(eq(aiLabSuggestions.patientId, patientId))
      .orderBy(desc(aiLabSuggestions.createdAt))
      .limit(10);
  }

  async getTriageHistory(facilityId: string) {
    return db.select()
      .from(teleconsultTriages)
      .where(eq(teleconsultTriages.facilityId, facilityId))
      .orderBy(desc(teleconsultTriages.createdAt))
      .limit(50);
  }
}

export const healthcareAI = new HealthcareAIService();
