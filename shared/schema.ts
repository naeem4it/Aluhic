import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for authentication)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Account Types table (normalized)
export const accountTypes = pgTable("account_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
});

export const insertAccountTypeSchema = createInsertSchema(accountTypes).omit({ id: true });
export type InsertAccountType = z.infer<typeof insertAccountTypeSchema>;
export type AccountType = typeof accountTypes.$inferSelect;

// Company Types table (normalized)
export const companyTypes = pgTable("company_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
});

export const insertCompanyTypeSchema = createInsertSchema(companyTypes).omit({ id: true });
export type InsertCompanyType = z.infer<typeof insertCompanyTypeSchema>;
export type CompanyType = typeof companyTypes.$inferSelect;

// Roles table (normalized)
// System-level roles (global templates)
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // doctor, nurse, pharmacist, lab_technician, front_desk, admin, etc.
  category: text("category").notNull().default("general"), // healthcare, laboratory, pharmacy, sales, administration, system
  description: text("description"),
  companyTypeId: varchar("company_type_id").references(() => companyTypes.id),
  // Default permissions for this role (JSON object with module:permissions mapping)
  defaultPermissions: jsonb("default_permissions"), // { "opd": ["view", "create"], "pharmacy": ["view"] }
  isSystemRole: boolean("is_system_role").notNull().default(false), // System roles cannot be deleted
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// Master Data: Specialties table (for doctor specialties with case-insensitive handling)
export const specialties = pgTable("specialties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull().unique(), // lowercase version for case-insensitive matching
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSpecialtySchema = createInsertSchema(specialties).omit({ id: true, normalizedName: true, createdAt: true });
export type InsertSpecialty = z.infer<typeof insertSpecialtySchema>;
export type Specialty = typeof specialties.$inferSelect;

// Companies table
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: varchar("email"),
  phone: text("phone"),
  address: text("address"),
  logoUrl: text("logo_url"),
  companyTypeId: varchar("company_type_id").references(() => companyTypes.id),
  registrationDate: timestamp("registration_date").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table (email/password authentication)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  passwordHash: varchar("password_hash"), // Nullable for migration from Replit Auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: text("user_type").notNull().default("individual"), // individual, company, super_admin
  role: text("role").notNull().default("user"), // user, rep, manager, company_admin, super_admin
  accountTypeId: varchar("account_type_id").references(() => accountTypes.id),
  roleId: varchar("role_id").references(() => roles.id),
  organizationId: varchar("organization_id"), // Multi-tenant organization reference
  isSuperAdmin: boolean("is_super_admin").notNull().default(false), // Super Admin flag (never expires, cannot be disabled)
  isEmailVerified: boolean("is_email_verified").notNull().default(false), // Email verification status
  emailVerifiedAt: timestamp("email_verified_at"), // When email was verified
  territory: text("territory"),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  permissions: jsonb("permissions"), // Module-based permissions
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  subscriptionActive: text("subscription_active").notNull().default("trial"), // trial, active, expired
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctors table
export const doctors = pgTable("doctors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // Who created this doctor
  personId: varchar("person_id").references(() => persons.id, { onDelete: "set null" }), // Link to Person Master
  name: text("name").notNull(),
  specialty: text("specialty"),
  clinic: text("clinic"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }), // GPS latitude (e.g., 24.12345678)
  longitude: decimal("longitude", { precision: 11, scale: 8 }), // GPS longitude (e.g., 67.12345678)
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Products table - unified product catalog for pharma companies and sales tracking
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // Who created this product
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }), // Pharma company owning the product
  // Product identification
  productCode: varchar("product_code", { length: 50 }), // Unique pharma product code
  name: text("name").notNull(),
  genericName: text("generic_name"), // Generic drug name (e.g., "Paracetamol")
  saltComposition: text("salt_composition"), // Active pharmaceutical ingredients (e.g., "Paracetamol 500mg + Caffeine 30mg")
  description: text("description"),
  // Pricing and categorization
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  mrp: decimal("mrp", { precision: 10, scale: 2 }), // Maximum retail price
  category: text("category"),
  manufacturer: text("manufacturer"),
  // Product details
  strength: text("strength"), // e.g., "500mg"
  packSize: text("pack_size"), // e.g., "10 tablets"
  dosageForm: text("dosage_form"), // tablet, capsule, syrup, injection, cream, etc.
  // Status
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Product price history table
export const productPriceHistory = pgTable("product_price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  effectiveDate: timestamp("effective_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const salesEntries = pgTable("sales_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  repName: text("rep_name").notNull(),
  territory: text("territory").notNull(),
  doctorId: varchar("doctor_id").notNull().references(() => doctors.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(), // From product or override
  priceOverride: decimal("price_override", { precision: 10, scale: 2 }), // Optional price override
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMode: text("payment_mode").notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Doctor visits table - tracks field representative visits to doctors
export const doctorVisits = pgTable("doctor_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // Medical rep who made the visit
  doctorId: varchar("doctor_id").notNull().references(() => doctors.id),
  punchInTime: timestamp("punch_in_time").notNull(), // When the rep checked in
  punchOutTime: timestamp("punch_out_time"), // When the rep checked out (null if still in progress)
  punchInLatitude: decimal("punch_in_latitude", { precision: 10, scale: 8 }), // GPS coordinates at punch-in
  punchInLongitude: decimal("punch_in_longitude", { precision: 11, scale: 8 }),
  punchOutLatitude: decimal("punch_out_latitude", { precision: 10, scale: 8 }), // GPS coordinates at punch-out
  punchOutLongitude: decimal("punch_out_longitude", { precision: 11, scale: 8 }),
  visitNotes: text("visit_notes"), // Notes about the visit
  saleAgreement: boolean("sale_agreement").default(false), // Did they reach a sale agreement?
  saleAgreementDetails: text("sale_agreement_details"), // Details about the agreement
  duration: integer("duration"), // Duration in minutes (calculated when punching out)
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Expenses table - tracks daily expenses for medical representatives
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // Medical rep who incurred the expense
  date: timestamp("date").notNull(), // Date of expense
  category: text("category").notNull(), // travel, food, accommodation, fuel, parking, other
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"), // Optional description
  territory: text("territory"), // Territory/area where expense occurred
  receiptNumber: text("receipt_number"), // Optional receipt/bill number
  paymentMode: text("payment_mode").notNull(), // cash, card, company_paid
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  remarks: text("remarks"), // Admin remarks for approval/rejection
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Call KPI tracking table - tracks daily call performance metrics
export const callKPIs = pgTable("call_kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  repName: text("rep_name"),
  territory: text("territory"),
  
  // Call metrics
  totalCallsDone: integer("total_calls_done").notNull().default(0),
  totalPlannedCalls: integer("total_planned_calls").notNull().default(0),
  plannedCallsDone: integer("planned_calls_done").notNull().default(0),
  unplannedCallsDone: integer("unplanned_calls_done").notNull().default(0),
  
  // Content viewed metrics
  totalEDAsViewed: integer("total_edas_viewed").notNull().default(0),
  totalSlidesViewed: integer("total_slides_viewed").notNull().default(0),
  
  // Average timings (in seconds)
  avgTimePerCall: integer("avg_time_per_call").default(0),
  avgTimePerEDA: integer("avg_time_per_eda").default(0),
  avgTimePerSlide: integer("avg_time_per_slide").default(0),
  
  // Doctor coverage metrics
  targetDoctors: integer("target_doctors").default(0),
  plannedDoctors: integer("planned_doctors").default(0),
  coveredDoctors: integer("covered_doctors").default(0),
  
  // Additional fields
  contactPointStatus: text("contact_point_status").default("reported"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// ========== Hospital/Clinic Module Tables ==========

// Healthcare facilities (branches of organizations - hospitals, clinics, pharmacy outlets)
export const healthcareFacilities = pgTable("healthcare_facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  facilityCode: varchar("facility_code", { length: 20 }), // Unique code for the facility branch
  name: text("name").notNull(),
  facilityType: text("facility_type").notNull(), // hospital, individual_clinic, multi_doctor_clinic, pharmacy, lab
  isHeadquarter: boolean("is_headquarter").notNull().default(false), // Is this the main/head branch
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("Pakistan"),
  phone: text("phone"),
  email: varchar("email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Healthcare doctors (different from medical rep doctors - these are practicing doctors at facilities)
export const healthcareDoctors = pgTable("healthcare_doctors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  personId: varchar("person_id").references(() => persons.id, { onDelete: "set null" }), // Link to Person Master
  userId: varchar("user_id").references(() => users.id), // Optional - if doctor has a system login
  name: text("name").notNull(),
  specialty: text("specialty"),
  qualification: text("qualification"),
  phone: text("phone"),
  email: varchar("email"),
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }),
  agreementType: text("agreement_type").notNull(), // permanent, on_call
  // For permanent doctors
  monthlySalary: decimal("monthly_salary", { precision: 10, scale: 2 }),
  // For on-call doctors
  perPatientFee: decimal("per_patient_fee", { precision: 10, scale: 2 }),
  percentageShare: decimal("percentage_share", { precision: 5, scale: 2 }), // e.g., 40.00 for 40%
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Doctor availability schedule
export const doctorAvailability = pgTable("doctor_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull().references(() => healthcareDoctors.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: text("start_time").notNull(), // e.g., "09:00"
  endTime: text("end_time").notNull(), // e.g., "17:00"
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Patients
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  patientNumber: text("patient_number").notNull(), // Unique patient ID per facility
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender"), // male, female, other
  phone: text("phone"),
  email: varchar("email"),
  address: text("address"),
  bloodGroup: text("blood_group"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id").notNull().references(() => healthcareDoctors.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(), // e.g., "10:00"
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled, no_show
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Queue management
export const queueEntries = pgTable("queue_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id").notNull().references(() => healthcareDoctors.id),
  queueNumber: integer("queue_number").notNull(),
  queueDate: timestamp("queue_date").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, in_consultation, completed, cancelled
  checkedInAt: timestamp("checked_in_at").notNull().default(sql`now()`),
  calledAt: timestamp("called_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Payments/Transactions
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  queueEntryId: varchar("queue_entry_id").references(() => queueEntries.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card, online, upi
  paymentStatus: text("payment_status").notNull().default("completed"), // pending, completed, refunded
  receiptNumber: text("receipt_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Patient vitals
export const patientVitals = pgTable("patient_vitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  queueEntryId: varchar("queue_entry_id").references(() => queueEntries.id),
  temperature: decimal("temperature", { precision: 4, scale: 1 }), // in Fahrenheit, e.g., 98.6
  bloodPressureSystolic: integer("blood_pressure_systolic"), // e.g., 120
  bloodPressureDiastolic: integer("blood_pressure_diastolic"), // e.g., 80
  pulseRate: integer("pulse_rate"), // beats per minute
  oxygenLevel: decimal("oxygen_level", { precision: 5, scale: 2 }), // SpO2 percentage, e.g., 98.50
  sugarLevel: decimal("sugar_level", { precision: 5, scale: 2 }), // mg/dL
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  height: decimal("height", { precision: 5, scale: 2 }), // in cm
  notes: text("notes"),
  recordedBy: varchar("recorded_by").references(() => users.id), // User who recorded vitals
  recordedAt: timestamp("recorded_at").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Consultations
export const consultations = pgTable("consultations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id").notNull().references(() => healthcareDoctors.id),
  queueEntryId: varchar("queue_entry_id").references(() => queueEntries.id),
  chiefComplaint: text("chief_complaint"),
  observations: text("observations"),
  diagnosis: text("diagnosis"),
  treatmentPlan: text("treatment_plan"),
  followUpDate: timestamp("follow_up_date"),
  notes: text("notes"),
  consultationDate: timestamp("consultation_date").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consultationId: varchar("consultation_id").notNull().references(() => consultations.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id").notNull().references(() => healthcareDoctors.id),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }), // For multi-org analytics
  medications: jsonb("medications").notNull(), // Array of {name, dosage, frequency, duration} - kept for backwards compatibility
  instructions: text("instructions"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Prescription Medicines - normalized table for cross-org analytics (links prescriptions to pharma products)
export const prescriptionMedicines = pgTable("prescription_medicines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prescriptionId: varchar("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  pharmaProductId: varchar("pharma_product_id").references(() => products.id, { onDelete: "set null" }), // Link to pharma company's product catalog
  medicineId: varchar("medicine_id").references(() => medicines.id, { onDelete: "set null" }), // Link to facility's medicine inventory
  // Medicine details (captured at prescription time)
  medicineName: text("medicine_name").notNull(),
  genericName: text("generic_name"),
  saltComposition: text("salt_composition"),
  dosage: text("dosage"), // e.g., "500mg"
  frequency: text("frequency"), // e.g., "twice daily"
  duration: text("duration"), // e.g., "7 days"
  quantity: integer("quantity"), // Number of units prescribed
  instructions: text("instructions"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertPrescriptionMedicineSchema = createInsertSchema(prescriptionMedicines).omit({ id: true, createdAt: true });
export type InsertPrescriptionMedicine = z.infer<typeof insertPrescriptionMedicineSchema>;
export type PrescriptionMedicine = typeof prescriptionMedicines.$inferSelect;

// Test reports
export const testReports = pgTable("test_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  consultationId: varchar("consultation_id").references(() => consultations.id),
  testName: text("test_name").notNull(),
  testType: text("test_type"), // blood, urine, x-ray, mri, ct_scan, etc.
  reportUrl: text("report_url"), // URL to uploaded report file
  reportData: jsonb("report_data"), // Structured test results
  labName: text("lab_name"),
  labAttached: boolean("lab_attached").default(false), // Is lab integrated with system?
  testDate: timestamp("test_date"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Company schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  registrationDate: true,
});

// User schemas (internal - includes passwordHash for storage layer)
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

// Registration schemas
export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  territory: z.string().optional(),
  userType: z.enum(["individual", "company"]),
  // Company fields (only for company registration)
  companyName: z.string().optional(),
  companyEmail: z.string().email().optional(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  territory: z.string().optional(),
  profileImageUrl: z.string().url().optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export const insertSalesEntrySchema = createInsertSchema(salesEntries).omit({
  id: true,
  createdAt: true,
  totalAmount: true, // Calculated server-side
}).extend({
  date: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val), // Accept string or Date, convert to Date
  rate: z.string().optional(), // Price from product or override
  totalAmount: z.string().optional(), // Optional for client, calculated server-side
  priceOverride: z.string().nullable().optional(), // Allow null to clear override
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  updatedAt: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  latitude: z.coerce.number().min(-90).max(90).optional().nullable().transform(val => val != null ? val.toString() : null),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable().transform(val => val != null ? val.toString() : null),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductPriceHistorySchema = createInsertSchema(productPriceHistory).omit({
  id: true,
  createdAt: true,
});

export const insertDoctorVisitSchema = createInsertSchema(doctorVisits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  duration: true, // Calculated server-side
}).extend({
  punchInTime: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  punchOutTime: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  category: z.enum(["travel", "food", "accommodation", "fuel", "parking", "other"]),
  paymentMode: z.enum(["cash", "card", "company_paid"]),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const insertCallKPISchema = createInsertSchema(callKPIs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

// ========== Hospital/Clinic Insert Schemas ==========

export const insertHealthcareFacilitySchema = createInsertSchema(healthcareFacilities).omit({
  id: true,
  organizationId: true, // Set by backend based on user or request
  createdAt: true,
  updatedAt: true,
});

export const insertHealthcareDoctorSchema = createInsertSchema(healthcareDoctors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDoctorAvailabilitySchema = createInsertSchema(doctorAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  appointmentDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertQueueEntrySchema = createInsertSchema(queueEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  queueDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  checkedInAt: z.string().or(z.date()).optional().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  calledAt: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  completedAt: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertPatientVitalsSchema = createInsertSchema(patientVitals).omit({
  id: true,
  createdAt: true,
}).extend({
  recordedAt: z.string().or(z.date()).optional().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  consultationDate: z.string().or(z.date()).optional().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  followUpDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertTestReportSchema = createInsertSchema(testReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  testDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

// ========== Pharma & MR Module Tables ==========

// Product samples inventory - tracks sample stock for products
export const productSamples = pgTable("product_samples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  batchNumber: text("batch_number"),
  quantity: integer("quantity").notNull().default(0), // Current stock
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Sample distributions - tracks samples given to doctors by MRs
export const sampleDistributions = pgTable("sample_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // MR who distributed
  doctorId: varchar("doctor_id").notNull().references(() => doctors.id),
  productSampleId: varchar("product_sample_id").notNull().references(() => productSamples.id, { onDelete: "cascade" }),
  visitId: varchar("visit_id").references(() => doctorVisits.id, { onDelete: "set null" }), // Optional link to visit
  quantity: integer("quantity").notNull(),
  distributionDate: timestamp("distribution_date").notNull().default(sql`now()`),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Visit requests - MR requests to visit doctors with approval workflow
export const visitRequests = pgTable("visit_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // MR requesting
  doctorId: varchar("doctor_id").notNull().references(() => doctors.id),
  requestedDate: timestamp("requested_date").notNull(), // When MR wants to visit
  requestedTime: text("requested_time"), // Time slot preference
  purpose: text("purpose"), // Reason for visit
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed
  doctorNotes: text("doctor_notes"), // Doctor's response/notes
  respondedAt: timestamp("responded_at"), // When doctor responded
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Subscription plans - defines available subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Basic, Professional, Enterprise
  description: text("description"),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }),
  maxUsers: integer("max_users"), // null = unlimited
  maxFacilities: integer("max_facilities"),
  features: jsonb("features"), // Feature flags as JSON
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User subscriptions - tracks individual/company subscription status
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull().default("active"), // active, cancelled, expired, trial
  startDate: timestamp("start_date").notNull().default(sql`now()`),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly, yearly
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDate: timestamp("next_payment_date"),
  paymentMethod: text("payment_method"), // card, bank_transfer, cash
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id), // Admin who created/modified
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Sales Leads - MR captures doctor interest as leads (FR-MR-06)
export const salesLeads = pgTable("sales_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // MR who created the lead
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  doctorId: varchar("doctor_id").notNull().references(() => doctors.id),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  status: text("status").notNull().default("new"), // new, contacted, confirmed, fulfilled, lost
  estimatedQuantity: integer("estimated_quantity"),
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  source: text("source"), // visit, call, referral, event
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  convertedToOrderId: varchar("converted_to_order_id"), // Reference to order if converted
  lostReason: text("lost_reason"), // Reason if status is 'lost'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// MR Profiles - Enhanced MR information (FR-MR-01)
export const mrProfiles = pgTable("mr_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  employeeId: text("employee_id"), // Company employee ID
  kycDocumentUrl: text("kyc_document_url"), // KYC document upload
  kycStatus: text("kyc_status").notNull().default("pending"), // pending, verified, rejected
  visitQuota: integer("visit_quota"), // Monthly visit quota
  sampleQuota: integer("sample_quota"), // Monthly sample distribution quota
  assignedTerritories: text("assigned_territories").array(), // List of assigned territories
  targetDoctorIds: text("target_doctor_ids").array(), // Target doctor list
  joiningDate: timestamp("joining_date"),
  reportingTo: varchar("reporting_to").references(() => users.id), // Manager
  performanceRating: decimal("performance_rating", { precision: 3, scale: 2 }), // 0.00 to 5.00
  isFieldActive: boolean("is_field_active").notNull().default(true),
  lastActiveDate: timestamp("last_active_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Enhanced Company Fields for Pharma Company Management (FR-PH-01)
export const pharmaCompanySettings = pgTable("pharma_company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }).unique(),
  maxMRs: integer("max_mrs"), // Maximum number of MRs allowed
  maxProducts: integer("max_products"), // Maximum products in catalog
  productCategories: text("product_categories").array(), // Allowed product categories
  licenseNumber: text("license_number"),
  licenseExpiryDate: timestamp("license_expiry_date"),
  headOfficeAddress: text("head_office_address"),
  contactPerson: text("contact_person"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  subscriptionTier: text("subscription_tier").notNull().default("basic"), // basic, professional, enterprise
  features: jsonb("features"), // Feature flags
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Route plans - MR daily route planning
export const routePlans = pgTable("route_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // MR
  planDate: timestamp("plan_date").notNull(),
  territory: text("territory"),
  status: text("status").notNull().default("planned"), // planned, in_progress, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Route plan stops - individual stops in a route
export const routePlanStops = pgTable("route_plan_stops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routePlanId: varchar("route_plan_id").notNull().references(() => routePlans.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id").notNull().references(() => doctors.id),
  stopOrder: integer("stop_order").notNull(),
  plannedTime: text("planned_time"),
  actualArrival: timestamp("actual_arrival"),
  actualDeparture: timestamp("actual_departure"),
  status: text("status").notNull().default("pending"), // pending, visited, skipped
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ========== AI-Powered Features Tables ==========

// AI Appointment Optimization - suggests optimal appointment slots
export const aiAppointmentOptimizations = pgTable("ai_appointment_optimizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id").references(() => healthcareDoctors.id, { onDelete: "set null" }),
  patientId: varchar("patient_id").references(() => patients.id, { onDelete: "set null" }),
  suggestedDate: timestamp("suggested_date").notNull(),
  suggestedTimeSlot: text("suggested_time_slot").notNull(), // e.g., "09:00-09:30"
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  reasoningFactors: jsonb("reasoning_factors"), // { urgency, doctorAvailability, patientHistory, waitTimeOptimization }
  urgencyLevel: text("urgency_level").notNull().default("normal"), // low, normal, high, emergency
  expectedWaitTime: integer("expected_wait_time"), // in minutes
  isAccepted: boolean("is_accepted"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Patient Risk Scoring - predictive analytics for chronic patients
export const patientRiskScores = pgTable("patient_risk_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  riskType: text("risk_type").notNull(), // hospitalization, complication, readmission, deterioration
  riskScore: decimal("risk_score", { precision: 5, scale: 4 }).notNull(), // 0.0000 to 1.0000
  riskLevel: text("risk_level").notNull(), // low, moderate, high, critical
  contributingFactors: jsonb("contributing_factors"), // { vitals, labResults, medications, history }
  recommendations: jsonb("recommendations"), // Array of suggested interventions
  alertSent: boolean("alert_sent").notNull().default(false),
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  validUntil: timestamp("valid_until").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// AI Lab & Imaging Suggestions - recommends tests based on symptoms
export const aiLabSuggestions = pgTable("ai_lab_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  consultationId: varchar("consultation_id").references(() => consultations.id, { onDelete: "set null" }),
  symptoms: text("symptoms").array(), // Array of symptoms presented
  suggestedTests: jsonb("suggested_tests").notNull(), // [{testName, testType, priority, reasoning}]
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }),
  diagnosticPattern: text("diagnostic_pattern"), // Pattern matched from historical data
  status: text("status").notNull().default("pending"), // pending, approved, rejected, partially_approved
  approvedTests: jsonb("approved_tests"), // Tests that were actually ordered
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Teleconsult Triage - NLP categorization of patient complaints
export const teleconsultTriages = pgTable("teleconsult_triages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id, { onDelete: "set null" }),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  patientComplaint: text("patient_complaint").notNull(), // Raw patient text
  extractedSymptoms: text("extracted_symptoms").array(), // NLP extracted symptoms
  category: text("category").notNull(), // general, dermatology, cardiology, orthopedics, etc.
  urgencyLevel: text("urgency_level").notNull(), // routine, soon, urgent, emergency
  suggestedSpecialty: text("suggested_specialty"), // Recommended specialist
  suggestedAction: text("suggested_action").notNull(), // teleconsult, in_person, emergency, self_care
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }),
  redFlags: text("red_flags").array(), // Critical symptoms detected
  assignedDoctorId: varchar("assigned_doctor_id").references(() => healthcareDoctors.id),
  status: text("status").notNull().default("pending"), // pending, assigned, completed, escalated
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Prescription Error Detection - drug interactions and dosage validation
export const prescriptionValidations = pgTable("prescription_validations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prescriptionId: varchar("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  validationStatus: text("validation_status").notNull(), // passed, warning, error
  drugInteractions: jsonb("drug_interactions"), // [{drug1, drug2, severity, description}]
  dosageWarnings: jsonb("dosage_warnings"), // [{medication, issue, recommendation}]
  allergyAlerts: jsonb("allergy_alerts"), // [{medication, allergen, severity}]
  duplicateTherapy: jsonb("duplicate_therapy"), // [{drug1, drug2, therapeuticClass}]
  contraindicatedConditions: jsonb("contraindicated_conditions"), // [{medication, condition}]
  overallRiskLevel: text("overall_risk_level").notNull(), // low, moderate, high, critical
  requiresPharmacistReview: boolean("requires_pharmacist_review").notNull().default(false),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  overrideReason: text("override_reason"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ========== MR/Sales AI Features Tables ==========

// AI Call Planning - predictive doctor visit optimization
export const aiCallPlans = pgTable("ai_call_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // MR
  planDate: timestamp("plan_date").notNull(),
  territory: text("territory"),
  suggestedDoctors: jsonb("suggested_doctors").notNull(), // [{doctorId, priority, score, reason}]
  optimizedRoute: jsonb("optimized_route"), // [{doctorId, order, estimatedTime, travelTime}]
  totalEstimatedTime: integer("total_estimated_time"), // in minutes
  totalTravelDistance: decimal("total_travel_distance", { precision: 10, scale: 2 }), // in km
  expectedConversions: integer("expected_conversions"),
  modelVersion: text("model_version"),
  status: text("status").notNull().default("suggested"), // suggested, accepted, modified, completed
  actualOutcome: jsonb("actual_outcome"), // Actual results for feedback
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// MR Performance Insights - personalized recommendations
export const mrPerformanceInsights = pgTable("mr_performance_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // MR
  insightType: text("insight_type").notNull(), // doctor_focus, product_opportunity, timing, coverage_gap
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // low, medium, high
  actionItems: jsonb("action_items"), // [{action, target, deadline}]
  relatedDoctorId: varchar("related_doctor_id").references(() => doctors.id),
  relatedProductId: varchar("related_product_id").references(() => products.id),
  expectedImpact: jsonb("expected_impact"), // {salesIncrease, conversionRate}
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }),
  status: text("status").notNull().default("new"), // new, viewed, acted, dismissed
  viewedAt: timestamp("viewed_at"),
  validUntil: timestamp("valid_until").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Target Achievement Alerts - anomaly detection for underperformance
export const targetAchievementAlerts = pgTable("target_achievement_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // MR or Doctor
  alertType: text("alert_type").notNull(), // behind_target, undervisited_doctor, declining_performance, missed_calls
  severity: text("severity").notNull(), // info, warning, critical
  title: text("title").notNull(),
  description: text("description").notNull(),
  metricName: text("metric_name").notNull(), // sales, visits, calls, conversions
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }),
  variance: decimal("variance", { precision: 10, scale: 2 }), // percentage variance
  relatedDoctorId: varchar("related_doctor_id").references(() => doctors.id),
  suggestedActions: jsonb("suggested_actions"), // Array of recommended actions
  status: text("status").notNull().default("active"), // active, acknowledged, resolved
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Sales Forecasting - time series predictions
export const salesForecasts = pgTable("sales_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // MR (optional for territory forecasts)
  doctorId: varchar("doctor_id").references(() => doctors.id, { onDelete: "set null" }),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  territory: text("territory"),
  forecastPeriod: text("forecast_period").notNull(), // weekly, monthly, quarterly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  predictedSales: decimal("predicted_sales", { precision: 12, scale: 2 }).notNull(),
  predictedQuantity: integer("predicted_quantity"),
  confidenceInterval: jsonb("confidence_interval"), // {lower, upper}
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }),
  historicalBasis: jsonb("historical_basis"), // Data points used for prediction
  actualSales: decimal("actual_sales", { precision: 12, scale: 2 }), // Filled after period ends
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }), // Calculated after actuals
  modelVersion: text("model_version"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Sample-to-Prescription Conversion Predictions
export const sampleConversionPredictions = pgTable("sample_conversion_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sampleDistributionId: varchar("sample_distribution_id").references(() => sampleDistributions.id, { onDelete: "set null" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // MR
  doctorId: varchar("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sampleQuantity: integer("sample_quantity").notNull(),
  conversionProbability: decimal("conversion_probability", { precision: 5, scale: 4 }).notNull(), // 0.0000 to 1.0000
  expectedPrescriptions: integer("expected_prescriptions"),
  expectedRevenue: decimal("expected_revenue", { precision: 12, scale: 2 }),
  influencingFactors: jsonb("influencing_factors"), // {doctorHistory, productFit, timing, competition}
  recommendation: text("recommendation").notNull(), // distribute, hold, prioritize
  actualConversion: boolean("actual_conversion"), // Filled after follow-up
  actualPrescriptions: integer("actual_prescriptions"), // Filled after tracking period
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Drug Interaction Database - for prescription validation
export const drugInteractions = pgTable("drug_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drug1Name: text("drug1_name").notNull(),
  drug2Name: text("drug2_name").notNull(),
  interactionType: text("interaction_type").notNull(), // major, moderate, minor
  severity: text("severity").notNull(), // high, medium, low
  description: text("description").notNull(),
  mechanism: text("mechanism"),
  managementAdvice: text("management_advice"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Common medications database for prescription validation
export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  genericName: text("generic_name").notNull(),
  brandNames: text("brand_names").array(),
  category: text("category").notNull(), // antibiotic, analgesic, antihypertensive, etc.
  therapeuticClass: text("therapeutic_class"),
  standardDosage: text("standard_dosage"),
  maxDailyDose: text("max_daily_dose"),
  contraindications: text("contraindications").array(),
  commonSideEffects: text("common_side_effects").array(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ============ INVENTORY AI TABLES ============

// Demand Forecasting - predict stock requirements
export const demandForecasts = pgTable("demand_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  facilityId: varchar("facility_id").references(() => healthcareFacilities.id, { onDelete: "set null" }),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  forecastType: text("forecast_type").notNull(), // pharmacy, warehouse, clinic
  forecastPeriod: text("forecast_period").notNull(), // daily, weekly, monthly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  predictedDemand: integer("predicted_demand").notNull(),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }),
  confidenceInterval: jsonb("confidence_interval"), // {lower, upper}
  historicalData: jsonb("historical_data"), // Data points used
  seasonalFactors: jsonb("seasonal_factors"),
  actualDemand: integer("actual_demand"),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  modelVersion: text("model_version"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Expiry & Waste Reduction Predictions
export const expiryPredictions = pgTable("expiry_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  facilityId: varchar("facility_id").references(() => healthcareFacilities.id, { onDelete: "set null" }),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  batchNumber: text("batch_number"),
  currentStock: integer("current_stock").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  daysUntilExpiry: integer("days_until_expiry").notNull(),
  usageRate: decimal("usage_rate", { precision: 10, scale: 4 }), // units per day
  wastageRisk: text("wastage_risk").notNull(), // high, medium, low
  wastageRiskScore: decimal("wastage_risk_score", { precision: 5, scale: 4 }),
  predictedWaste: integer("predicted_waste"),
  recommendation: text("recommendation").notNull(), // redistribute, promote, discount, normal
  suggestedActions: jsonb("suggested_actions"), // Array of action items
  redistributionTargets: jsonb("redistribution_targets"), // Suggested facilities
  actualWaste: integer("actual_waste"),
  actionTaken: text("action_taken"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Smart Reordering Suggestions
export const reorderSuggestions = pgTable("reorder_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  facilityId: varchar("facility_id").references(() => healthcareFacilities.id, { onDelete: "set null" }),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  currentStock: integer("current_stock").notNull(),
  reorderPoint: integer("reorder_point").notNull(),
  suggestedQuantity: integer("suggested_quantity").notNull(),
  optimalOrderDate: timestamp("optimal_order_date").notNull(),
  urgency: text("urgency").notNull(), // critical, high, medium, low
  usagePattern: jsonb("usage_pattern"), // Historical usage data
  seasonalAdjustment: decimal("seasonal_adjustment", { precision: 5, scale: 4 }),
  costOptimization: jsonb("cost_optimization"), // Bulk discount suggestions
  leadTime: integer("lead_time"), // Days to receive order
  safetyStock: integer("safety_stock"),
  status: text("status").notNull().default("pending"), // pending, ordered, fulfilled, ignored
  orderedQuantity: integer("ordered_quantity"),
  orderDate: timestamp("order_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// ============ MARKETING AI TABLES ============

// Doctor Engagement Analysis
export const doctorEngagements = pgTable("doctor_engagements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  doctorId: varchar("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // MR
  engagementScore: decimal("engagement_score", { precision: 5, scale: 4 }).notNull(),
  engagementLevel: text("engagement_level").notNull(), // high_value, responsive, underserved, dormant
  visitFrequency: integer("visit_frequency"), // Monthly average
  prescriptionVolume: integer("prescription_volume"), // Monthly average
  sampleConversionRate: decimal("sample_conversion_rate", { precision: 5, scale: 4 }),
  responseToCampaigns: decimal("response_to_campaigns", { precision: 5, scale: 4 }),
  potentialValue: decimal("potential_value", { precision: 12, scale: 2 }),
  recommendations: jsonb("recommendations"), // Array of engagement suggestions
  clusterGroup: text("cluster_group"), // Clustering result
  lastVisitDate: timestamp("last_visit_date"),
  nextRecommendedAction: text("next_recommended_action"),
  validUntil: timestamp("valid_until").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Market Segmentation
export const marketSegments = pgTable("market_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  segmentType: text("segment_type").notNull(), // territory, doctor, hospital
  segmentName: text("segment_name").notNull(),
  segmentDescription: text("segment_description"),
  entityIds: text("entity_ids").array(), // IDs of entities in this segment
  characteristics: jsonb("characteristics"), // Shared traits
  size: integer("size").notNull(), // Number of entities
  potentialValue: decimal("potential_value", { precision: 12, scale: 2 }),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }),
  growthRate: decimal("growth_rate", { precision: 5, scale: 4 }),
  marketingStrategy: text("marketing_strategy"),
  targetProducts: text("target_products").array(),
  recommendedCampaigns: jsonb("recommended_campaigns"),
  clusteringMethod: text("clustering_method"), // k-means, hierarchical, etc.
  validUntil: timestamp("valid_until").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Campaign Effectiveness Predictions
export const campaignPredictions = pgTable("campaign_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  campaignName: text("campaign_name").notNull(),
  campaignType: text("campaign_type").notNull(), // sample, detailing, conference, digital
  targetSegment: text("target_segment"),
  targetDoctorIds: text("target_doctor_ids").array(),
  productIds: text("product_ids").array(),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  predictedROI: decimal("predicted_roi", { precision: 5, scale: 4 }).notNull(),
  predictedReach: integer("predicted_reach"),
  predictedConversions: integer("predicted_conversions"),
  predictedRevenue: decimal("predicted_revenue", { precision: 12, scale: 2 }),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }),
  historicalBasis: jsonb("historical_basis"),
  recommendations: jsonb("recommendations"),
  actualROI: decimal("actual_roi", { precision: 5, scale: 4 }),
  actualRevenue: decimal("actual_revenue", { precision: 12, scale: 2 }),
  campaignStatus: text("campaign_status").notNull().default("planned"), // planned, active, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Competitive Intelligence Analysis
export const competitiveIntelligence = pgTable("competitive_intelligence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  analysisType: text("analysis_type").notNull(), // dcr_notes, market_trends, competitor_activity
  sourceType: text("source_type").notNull(), // dcr, report, external
  territory: text("territory"),
  competitorName: text("competitor_name"),
  competitorProduct: text("competitor_product"),
  insight: text("insight").notNull(),
  insightCategory: text("insight_category"), // pricing, promotion, new_product, coverage
  sentiment: text("sentiment"), // positive, negative, neutral
  impactLevel: text("impact_level").notNull(), // high, medium, low
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  keywords: text("keywords").array(),
  relatedDoctorIds: text("related_doctor_ids").array(),
  suggestedActions: jsonb("suggested_actions"),
  expiryDate: timestamp("expiry_date"),
  validated: boolean("validated").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ============ ANALYTICS AI TABLES ============

// Automated Insights & Recommendations
export const automatedInsights = pgTable("automated_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  insightType: text("insight_type").notNull(), // trend, alert, recommendation, anomaly
  category: text("category").notNull(), // sales, visits, products, territory, performance
  title: text("title").notNull(),
  description: text("description").notNull(),
  dataPoints: jsonb("data_points"), // Supporting data
  severity: text("severity").notNull(), // critical, warning, info
  priority: integer("priority").notNull(), // 1-10
  affectedEntity: text("affected_entity"), // product, territory, doctor, mr
  affectedEntityId: varchar("affected_entity_id"),
  recommendation: text("recommendation"),
  actionRequired: boolean("action_required").default(false),
  actionTaken: text("action_taken"),
  dismissed: boolean("dismissed").default(false),
  dismissedAt: timestamp("dismissed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Anomaly Detection Results
export const anomalyDetections = pgTable("anomaly_detections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  detectionType: text("detection_type").notNull(), // sample_issuance, order_pattern, expense, visit_frequency
  entityType: text("entity_type").notNull(), // user, doctor, product, territory
  entityId: varchar("entity_id").notNull(),
  metric: text("metric").notNull(),
  expectedValue: decimal("expected_value", { precision: 12, scale: 4 }),
  actualValue: decimal("actual_value", { precision: 12, scale: 4 }).notNull(),
  deviation: decimal("deviation", { precision: 10, scale: 4 }).notNull(),
  deviationType: text("deviation_type").notNull(), // spike, drop, unusual_pattern
  anomalyScore: decimal("anomaly_score", { precision: 5, scale: 4 }).notNull(),
  severity: text("severity").notNull(), // critical, high, medium, low
  description: text("description").notNull(),
  possibleCauses: jsonb("possible_causes"),
  detectionMethod: text("detection_method"), // statistical, ml, rule_based
  investigationStatus: text("investigation_status").notNull().default("pending"), // pending, investigating, resolved, false_positive
  investigationNotes: text("investigation_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Predictive KPIs
export const predictiveKPIs = pgTable("predictive_kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // MR
  facilityId: varchar("facility_id").references(() => healthcareFacilities.id, { onDelete: "set null" }),
  kpiType: text("kpi_type").notNull(), // revenue, visits, patient_count, target_achievement
  forecastPeriod: text("forecast_period").notNull(), // weekly, monthly, quarterly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }),
  predictedValue: decimal("predicted_value", { precision: 12, scale: 2 }).notNull(),
  targetValue: decimal("target_value", { precision: 12, scale: 2 }),
  predictedAchievement: decimal("predicted_achievement", { precision: 5, scale: 4 }),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }),
  confidenceInterval: jsonb("confidence_interval"),
  trend: text("trend"), // improving, stable, declining
  trendStrength: decimal("trend_strength", { precision: 5, scale: 4 }),
  riskFactors: jsonb("risk_factors"),
  opportunities: jsonb("opportunities"),
  actualValue: decimal("actual_value", { precision: 12, scale: 2 }),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Natural Language Query Logs
export const nlQueries = pgTable("nl_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }),
  query: text("query").notNull(), // User's natural language question
  parsedIntent: text("parsed_intent"), // Extracted intent
  parsedEntities: jsonb("parsed_entities"), // Extracted entities (territory, date range, etc.)
  generatedSQL: text("generated_sql"), // If applicable
  visualizationType: text("visualization_type"), // chart, table, number, text
  responseData: jsonb("response_data"), // Query results
  responseText: text("response_text"), // Natural language response
  successful: boolean("successful").notNull().default(true),
  errorMessage: text("error_message"),
  executionTimeMs: integer("execution_time_ms"),
  feedbackRating: integer("feedback_rating"), // 1-5 stars
  feedbackComment: text("feedback_comment"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas for AI tables
export const insertAIAppointmentOptimizationSchema = createInsertSchema(aiAppointmentOptimizations).omit({
  id: true,
  createdAt: true,
}).extend({
  suggestedDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertPatientRiskScoreSchema = createInsertSchema(patientRiskScores).omit({
  id: true,
  createdAt: true,
}).extend({
  validUntil: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertAILabSuggestionSchema = createInsertSchema(aiLabSuggestions).omit({
  id: true,
  createdAt: true,
});

export const insertTeleconsultTriageSchema = createInsertSchema(teleconsultTriages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrescriptionValidationSchema = createInsertSchema(prescriptionValidations).omit({
  id: true,
  createdAt: true,
});

export const insertAICallPlanSchema = createInsertSchema(aiCallPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  planDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertMRPerformanceInsightSchema = createInsertSchema(mrPerformanceInsights).omit({
  id: true,
  createdAt: true,
}).extend({
  validUntil: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertTargetAchievementAlertSchema = createInsertSchema(targetAchievementAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertSalesForecastSchema = createInsertSchema(salesForecasts).omit({
  id: true,
  createdAt: true,
}).extend({
  startDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  endDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertSampleConversionPredictionSchema = createInsertSchema(sampleConversionPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDrugInteractionSchema = createInsertSchema(drugInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for Inventory AI tables
export const insertDemandForecastSchema = createInsertSchema(demandForecasts).omit({
  id: true,
  createdAt: true,
}).extend({
  startDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  endDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertExpiryPredictionSchema = createInsertSchema(expiryPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  expiryDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertReorderSuggestionSchema = createInsertSchema(reorderSuggestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  optimalOrderDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  orderDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

// Insert schemas for Marketing AI tables
export const insertDoctorEngagementSchema = createInsertSchema(doctorEngagements).omit({
  id: true,
  createdAt: true,
}).extend({
  lastVisitDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  validUntil: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertMarketSegmentSchema = createInsertSchema(marketSegments).omit({
  id: true,
  createdAt: true,
}).extend({
  validUntil: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertCampaignPredictionSchema = createInsertSchema(campaignPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  endDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertCompetitiveIntelligenceSchema = createInsertSchema(competitiveIntelligence).omit({
  id: true,
  createdAt: true,
}).extend({
  expiryDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

// Insert schemas for Analytics AI tables
export const insertAutomatedInsightSchema = createInsertSchema(automatedInsights).omit({
  id: true,
  createdAt: true,
}).extend({
  dismissedAt: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  expiresAt: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertAnomalyDetectionSchema = createInsertSchema(anomalyDetections).omit({
  id: true,
  createdAt: true,
}).extend({
  resolvedAt: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertPredictiveKPISchema = createInsertSchema(predictiveKPIs).omit({
  id: true,
  createdAt: true,
}).extend({
  periodStart: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  periodEnd: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertNLQuerySchema = createInsertSchema(nlQueries).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for new tables
export const insertProductSampleSchema = createInsertSchema(productSamples).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  expiryDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertSampleDistributionSchema = createInsertSchema(sampleDistributions).omit({
  id: true,
  createdAt: true,
}).extend({
  distributionDate: z.string().or(z.date()).optional().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertVisitRequestSchema = createInsertSchema(visitRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  requestedDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().or(z.date()).optional().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  endDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  trialEndsAt: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertRoutePlanSchema = createInsertSchema(routePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  planDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertRoutePlanStopSchema = createInsertSchema(routePlanStops).omit({
  id: true,
  createdAt: true,
});

export const insertSalesLeadSchema = createInsertSchema(salesLeads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  followUpDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertMRProfileSchema = createInsertSchema(mrProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  joiningDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

export const insertPharmaCompanySettingsSchema = createInsertSchema(pharmaCompanySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  licenseExpiryDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});

// Type exports
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type InsertSalesEntry = z.infer<typeof insertSalesEntrySchema>;
export type SalesEntry = typeof salesEntries.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctors.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProductPriceHistory = z.infer<typeof insertProductPriceHistorySchema>;
export type ProductPriceHistory = typeof productPriceHistory.$inferSelect;
export type InsertDoctorVisit = z.infer<typeof insertDoctorVisitSchema>;
export type DoctorVisit = typeof doctorVisits.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertCallKPI = z.infer<typeof insertCallKPISchema>;
export type CallKPI = typeof callKPIs.$inferSelect;

// Hospital/Clinic type exports
export type HealthcareFacility = typeof healthcareFacilities.$inferSelect;
export type InsertHealthcareFacility = z.infer<typeof insertHealthcareFacilitySchema>;
export type HealthcareDoctor = typeof healthcareDoctors.$inferSelect;
export type InsertHealthcareDoctor = z.infer<typeof insertHealthcareDoctorSchema>;
export type DoctorAvailability = typeof doctorAvailability.$inferSelect;
export type InsertDoctorAvailability = z.infer<typeof insertDoctorAvailabilitySchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type QueueEntry = typeof queueEntries.$inferSelect;
export type InsertQueueEntry = z.infer<typeof insertQueueEntrySchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type PatientVitals = typeof patientVitals.$inferSelect;
export type InsertPatientVitals = z.infer<typeof insertPatientVitalsSchema>;
export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type TestReport = typeof testReports.$inferSelect;
export type InsertTestReport = z.infer<typeof insertTestReportSchema>;

// Pharma & MR Module type exports
export type ProductSample = typeof productSamples.$inferSelect;
export type InsertProductSample = z.infer<typeof insertProductSampleSchema>;
export type SampleDistribution = typeof sampleDistributions.$inferSelect;
export type InsertSampleDistribution = z.infer<typeof insertSampleDistributionSchema>;
export type VisitRequest = typeof visitRequests.$inferSelect;
export type InsertVisitRequest = z.infer<typeof insertVisitRequestSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type RoutePlan = typeof routePlans.$inferSelect;
export type InsertRoutePlan = z.infer<typeof insertRoutePlanSchema>;
export type RoutePlanStop = typeof routePlanStops.$inferSelect;
export type InsertRoutePlanStop = z.infer<typeof insertRoutePlanStopSchema>;
export type SalesLead = typeof salesLeads.$inferSelect;
export type InsertSalesLead = z.infer<typeof insertSalesLeadSchema>;
export type MRProfile = typeof mrProfiles.$inferSelect;
export type InsertMRProfile = z.infer<typeof insertMRProfileSchema>;
export type PharmaCompanySettings = typeof pharmaCompanySettings.$inferSelect;
export type InsertPharmaCompanySettings = z.infer<typeof insertPharmaCompanySettingsSchema>;

// AI Features type exports
export type AIAppointmentOptimization = typeof aiAppointmentOptimizations.$inferSelect;
export type InsertAIAppointmentOptimization = z.infer<typeof insertAIAppointmentOptimizationSchema>;
export type PatientRiskScore = typeof patientRiskScores.$inferSelect;
export type InsertPatientRiskScore = z.infer<typeof insertPatientRiskScoreSchema>;
export type AILabSuggestion = typeof aiLabSuggestions.$inferSelect;
export type InsertAILabSuggestion = z.infer<typeof insertAILabSuggestionSchema>;
export type TeleconsultTriage = typeof teleconsultTriages.$inferSelect;
export type InsertTeleconsultTriage = z.infer<typeof insertTeleconsultTriageSchema>;
export type PrescriptionValidation = typeof prescriptionValidations.$inferSelect;
export type InsertPrescriptionValidation = z.infer<typeof insertPrescriptionValidationSchema>;
export type AICallPlan = typeof aiCallPlans.$inferSelect;
export type InsertAICallPlan = z.infer<typeof insertAICallPlanSchema>;
export type MRPerformanceInsight = typeof mrPerformanceInsights.$inferSelect;
export type InsertMRPerformanceInsight = z.infer<typeof insertMRPerformanceInsightSchema>;
export type TargetAchievementAlert = typeof targetAchievementAlerts.$inferSelect;
export type InsertTargetAchievementAlert = z.infer<typeof insertTargetAchievementAlertSchema>;
export type SalesForecast = typeof salesForecasts.$inferSelect;
export type InsertSalesForecast = z.infer<typeof insertSalesForecastSchema>;
export type SampleConversionPrediction = typeof sampleConversionPredictions.$inferSelect;
export type InsertSampleConversionPrediction = z.infer<typeof insertSampleConversionPredictionSchema>;
export type DrugInteraction = typeof drugInteractions.$inferSelect;
export type InsertDrugInteraction = z.infer<typeof insertDrugInteractionSchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

// Inventory AI type exports
export type DemandForecast = typeof demandForecasts.$inferSelect;
export type InsertDemandForecast = z.infer<typeof insertDemandForecastSchema>;
export type ExpiryPrediction = typeof expiryPredictions.$inferSelect;
export type InsertExpiryPrediction = z.infer<typeof insertExpiryPredictionSchema>;
export type ReorderSuggestion = typeof reorderSuggestions.$inferSelect;
export type InsertReorderSuggestion = z.infer<typeof insertReorderSuggestionSchema>;

// Marketing AI type exports
export type DoctorEngagement = typeof doctorEngagements.$inferSelect;
export type InsertDoctorEngagement = z.infer<typeof insertDoctorEngagementSchema>;
export type MarketSegment = typeof marketSegments.$inferSelect;
export type InsertMarketSegment = z.infer<typeof insertMarketSegmentSchema>;
export type CampaignPrediction = typeof campaignPredictions.$inferSelect;
export type InsertCampaignPrediction = z.infer<typeof insertCampaignPredictionSchema>;
export type CompetitiveIntelligenceRecord = typeof competitiveIntelligence.$inferSelect;
export type InsertCompetitiveIntelligence = z.infer<typeof insertCompetitiveIntelligenceSchema>;

// Analytics AI type exports
export type AutomatedInsight = typeof automatedInsights.$inferSelect;
export type InsertAutomatedInsight = z.infer<typeof insertAutomatedInsightSchema>;
export type AnomalyDetection = typeof anomalyDetections.$inferSelect;
export type InsertAnomalyDetection = z.infer<typeof insertAnomalyDetectionSchema>;
export type PredictiveKPI = typeof predictiveKPIs.$inferSelect;
export type InsertPredictiveKPI = z.infer<typeof insertPredictiveKPISchema>;
export type NLQuery = typeof nlQueries.$inferSelect;
export type InsertNLQuery = z.infer<typeof insertNLQuerySchema>;

// ========== Enhanced RBAC & Multi-Tenant System ==========

// Organization types - pharma_company, hospital, clinic
export const organizationTypes = pgTable("organization_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // pharma_company, hospital, clinic
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertOrganizationTypeSchema = createInsertSchema(organizationTypes).omit({ id: true, createdAt: true });
export type InsertOrganizationType = z.infer<typeof insertOrganizationTypeSchema>;
export type OrganizationType = typeof organizationTypes.$inferSelect;

// Organizations - multi-tenant entities (companies, hospitals, clinics)
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").unique(), // Unique organization code
  organizationTypeId: varchar("organization_type_id").notNull().references(() => organizationTypes.id),
  email: varchar("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("Pakistan"),
  logoUrl: text("logo_url"),
  ownerId: varchar("owner_id"), // Will be set after user creation
  subscriptionTier: text("subscription_tier").notNull().default("basic"), // basic, silver, golden, custom
  subscriptionStartDate: timestamp("subscription_start_date").notNull().default(sql`now()`),
  subscriptionEndDate: timestamp("subscription_end_date"), // Only Super Admin can modify
  isActive: boolean("is_active").notNull().default(true),
  isSuspended: boolean("is_suspended").notNull().default(false),
  suspendedReason: text("suspended_reason"),
  suspendedAt: timestamp("suspended_at"),
  suspendedBy: varchar("suspended_by"),
  settings: jsonb("settings"), // Organization-specific settings
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Feature modules - defines all available modules/features
export const featureModules = pgTable("feature_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // medicines, employees, medical_reps, sales, visits, kpis, stock, doctors, potential_clients, market_research, ai_predictions
  description: text("description"),
  category: text("category"), // core, intelligence, ai
  applicableOrgTypes: text("applicable_org_types").array(), // Which org types can use this module
  isCore: boolean("is_core").notNull().default(false), // Core modules always included
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertFeatureModuleSchema = createInsertSchema(featureModules).omit({ id: true, createdAt: true });
export type InsertFeatureModule = z.infer<typeof insertFeatureModuleSchema>;
export type FeatureModule = typeof featureModules.$inferSelect;

// Subscription tiers - defines subscription tier configurations
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Basic, Silver, Golden, Custom
  code: text("code").notNull().unique(), // basic, silver, golden, custom
  organizationTypeCode: text("organization_type_code").notNull(), // pharma_company, hospital, clinic
  description: text("description"),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }),
  includedModules: text("included_modules").array(), // Module codes included in this tier
  maxUsers: integer("max_users"), // null = unlimited
  maxEmployees: integer("max_employees"),
  maxMedicalReps: integer("max_medical_reps"),
  maxDoctors: integer("max_doctors"),
  features: jsonb("features"), // Additional features configuration
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertSubscriptionTierSchema = createInsertSchema(subscriptionTiers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscriptionTier = z.infer<typeof insertSubscriptionTierSchema>;
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;

// Organization modules - tracks which modules are enabled for each organization
export const organizationModules = pgTable("organization_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  moduleId: varchar("module_id").notNull().references(() => featureModules.id),
  isEnabled: boolean("is_enabled").notNull().default(true),
  enabledAt: timestamp("enabled_at").notNull().default(sql`now()`),
  enabledBy: varchar("enabled_by"), // Super Admin who enabled
  expiresAt: timestamp("expires_at"), // For custom module purchases
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertOrganizationModuleSchema = createInsertSchema(organizationModules).omit({ id: true, createdAt: true });
export type InsertOrganizationModule = z.infer<typeof insertOrganizationModuleSchema>;
export type OrganizationModule = typeof organizationModules.$inferSelect;

// Role permissions - defines granular permissions for roles
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  moduleCode: text("module_code").notNull(), // Feature module code
  canView: boolean("can_view").notNull().default(false),
  canCreate: boolean("can_create").notNull().default(false),
  canEdit: boolean("can_edit").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  canExport: boolean("can_export").notNull().default(false),
  canApprove: boolean("can_approve").notNull().default(false),
  customPermissions: jsonb("custom_permissions"), // Additional custom permissions
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true, createdAt: true });
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

// Employee invitations - secure registration links for inviting employees
export const employeeInvitations = pgTable("employee_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  roleId: varchar("role_id").notNull().references(() => roles.id), // Pre-selected role
  invitationToken: varchar("invitation_token").notNull().unique(),
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, expired, cancelled
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  acceptedUserId: varchar("accepted_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertEmployeeInvitationSchema = createInsertSchema(employeeInvitations).omit({ id: true, createdAt: true });
export type InsertEmployeeInvitation = z.infer<typeof insertEmployeeInvitationSchema>;
export type EmployeeInvitation = typeof employeeInvitations.$inferSelect;

// Organization employees - links users to organizations with role
export const organizationEmployees = pgTable("organization_employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").notNull().references(() => roles.id),
  employeeCode: text("employee_code"), // Organization-specific employee ID
  department: text("department"),
  designation: text("designation"),
  joiningDate: timestamp("joining_date"),
  terminationDate: timestamp("termination_date"),
  terminatedBy: varchar("terminated_by").references(() => users.id),
  terminationReason: text("termination_reason"),
  isActive: boolean("is_active").notNull().default(true),
  reportingTo: varchar("reporting_to").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertOrganizationEmployeeSchema = createInsertSchema(organizationEmployees).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrganizationEmployee = z.infer<typeof insertOrganizationEmployeeSchema>;
export type OrganizationEmployee = typeof organizationEmployees.$inferSelect;

// NOTE: auditLogs table moved to end of file with comprehensive fields

// Intelligence sources - for medical and market intelligence integration
export const intelligenceSources = pgTable("intelligence_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  category: text("category").notNull(), // disease_surveillance, medical_research, market_intelligence, news, drug_safety, pakistan_specific
  sourceUrl: text("source_url"),
  apiEndpoint: text("api_endpoint"),
  requiresAuth: boolean("requires_auth").notNull().default(false),
  credentialsKey: text("credentials_key"), // Key reference for credentials (configurable by Super Admin)
  dataFormat: text("data_format"), // json, xml, html, csv
  refreshInterval: integer("refresh_interval"), // Minutes between data refreshes
  lastFetchedAt: timestamp("last_fetched_at"),
  isActive: boolean("is_active").notNull().default(true),
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.00"), // Signal weighting
  isShortTerm: boolean("is_short_term").notNull().default(true), // Short-term vs long-term forecast source
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertIntelligenceSourceSchema = createInsertSchema(intelligenceSources).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIntelligenceSource = z.infer<typeof insertIntelligenceSourceSchema>;
export type IntelligenceSource = typeof intelligenceSources.$inferSelect;

// Intelligence data - normalized data from intelligence sources
export const intelligenceData = pgTable("intelligence_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").notNull().references(() => intelligenceSources.id),
  dataType: text("data_type").notNull(), // disease_outbreak, drug_safety_alert, market_trend, research_finding
  title: text("title").notNull(),
  content: text("content"),
  rawData: jsonb("raw_data"), // Original data
  processedData: jsonb("processed_data"), // AI-processed/normalized data
  relevanceScore: decimal("relevance_score", { precision: 3, scale: 2 }), // 0.00 to 1.00
  region: text("region"), // Geographic region
  relatedDiseases: text("related_diseases").array(),
  relatedMedicines: text("related_medicines").array(),
  effectiveDate: timestamp("effective_date"),
  expiryDate: timestamp("expiry_date"), // When this intelligence becomes stale
  isProcessed: boolean("is_processed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => [
  index("intelligence_data_source_idx").on(table.sourceId),
  index("intelligence_data_type_idx").on(table.dataType),
]);

export const insertIntelligenceDataSchema = createInsertSchema(intelligenceData).omit({ id: true, createdAt: true });
export type InsertIntelligenceData = z.infer<typeof insertIntelligenceDataSchema>;
export type IntelligenceData = typeof intelligenceData.$inferSelect;

// Hospital/Facility departments - departments within a facility (branch)
export const facilityDepartments = pgTable("facility_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code"),
  description: text("description"),
  parentDepartmentId: varchar("parent_department_id"), // For department hierarchy
  headPersonId: varchar("head_person_id").references(() => persons.id, { onDelete: "set null" }), // Department head
  costCenter: varchar("cost_center", { length: 20 }), // For accounting/billing
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertFacilityDepartmentSchema = createInsertSchema(facilityDepartments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFacilityDepartment = z.infer<typeof insertFacilityDepartmentSchema>;
export type FacilityDepartment = typeof facilityDepartments.$inferSelect;

// Department Roles - Links roles to departments with custom permission sets
export const departmentRoles = pgTable("department_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: varchar("department_id").notNull().references(() => facilityDepartments.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Display name for this department-role combination
  description: text("description"),
  defaultPermissions: jsonb("default_permissions"), // Override role's default permissions for this department
  maxPositions: integer("max_positions"), // Maximum number of people who can hold this role in this department
  currentPositions: integer("current_positions").notNull().default(0), // Current filled positions
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertDepartmentRoleSchema = createInsertSchema(departmentRoles).omit({ id: true, createdAt: true, updatedAt: true, currentPositions: true });
export type InsertDepartmentRole = z.infer<typeof insertDepartmentRoleSchema>;
export type DepartmentRole = typeof departmentRoles.$inferSelect;

// Legacy aliases for backward compatibility
export const hospitalDepartments = facilityDepartments;
export const insertHospitalDepartmentSchema = insertFacilityDepartmentSchema;
export type InsertHospitalDepartment = InsertFacilityDepartment;
export type HospitalDepartment = FacilityDepartment;

// Hospital doctors - doctors associated with hospitals (employee, visiting, commission-based)
export const hospitalDoctorAssociations = pgTable("hospital_doctor_associations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  doctorUserId: varchar("doctor_user_id").notNull().references(() => users.id),
  departmentId: varchar("department_id").references(() => hospitalDepartments.id),
  associationType: text("association_type").notNull(), // employee, visiting, commission_based
  monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }), // For employee doctors
  perPatientFee: decimal("per_patient_fee", { precision: 10, scale: 2 }), // For visiting/commission doctors
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }), // For commission-based
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  joiningDate: timestamp("joining_date"),
  terminationDate: timestamp("termination_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertHospitalDoctorAssociationSchema = createInsertSchema(hospitalDoctorAssociations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHospitalDoctorAssociation = z.infer<typeof insertHospitalDoctorAssociationSchema>;
export type HospitalDoctorAssociation = typeof hospitalDoctorAssociations.$inferSelect;

// Payroll records - for payroll generation
export const payrollRecords = pgTable("payroll_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => organizationEmployees.id),
  payPeriodStart: timestamp("pay_period_start").notNull(),
  payPeriodEnd: timestamp("pay_period_end").notNull(),
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }).notNull(),
  allowances: decimal("allowances", { precision: 12, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  bonus: decimal("bonus", { precision: 12, scale: 2 }).default("0"),
  netSalary: decimal("net_salary", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"), // draft, approved, paid
  paymentDate: timestamp("payment_date"),
  paymentMethod: text("payment_method"),
  paymentReference: text("payment_reference"),
  notes: text("notes"),
  approvedBy: varchar("approved_by").references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertPayrollRecordSchema = createInsertSchema(payrollRecords).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayrollRecord = z.infer<typeof insertPayrollRecordSchema>;
export type PayrollRecord = typeof payrollRecords.$inferSelect;

// Expense sheets - for expense report generation
export const expenseSheets = pgTable("expense_sheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  approvedAmount: decimal("approved_amount", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("draft"), // draft, submitted, approved, rejected, paid
  submittedAt: timestamp("submitted_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  paymentDate: timestamp("payment_date"),
  paymentReference: text("payment_reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertExpenseSheetSchema = createInsertSchema(expenseSheets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExpenseSheet = z.infer<typeof insertExpenseSheetSchema>;
export type ExpenseSheet = typeof expenseSheets.$inferSelect;

// Data upload templates - standardized templates for bulk uploads
export const dataUploadTemplates = pgTable("data_upload_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  entityType: text("entity_type").notNull(), // doctors, products, employees, patients, etc.
  columns: jsonb("columns").notNull(), // Column definitions with names, types, required, validation rules
  sampleData: jsonb("sample_data"), // Sample rows for template
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertDataUploadTemplateSchema = createInsertSchema(dataUploadTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDataUploadTemplate = z.infer<typeof insertDataUploadTemplateSchema>;
export type DataUploadTemplate = typeof dataUploadTemplates.$inferSelect;

// Data uploads - tracks bulk data upload history
export const dataUploads = pgTable("data_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  templateId: varchar("template_id").references(() => dataUploadTemplates.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  fileType: text("file_type").notNull(), // csv, excel, google_sheets
  totalRows: integer("total_rows").notNull().default(0),
  successfulRows: integer("successful_rows").notNull().default(0),
  failedRows: integer("failed_rows").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  errorLog: jsonb("error_log"), // Detailed error information
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertDataUploadSchema = createInsertSchema(dataUploads).omit({ id: true, createdAt: true });
export type InsertDataUpload = z.infer<typeof insertDataUploadSchema>;
export type DataUpload = typeof dataUploads.$inferSelect;

// ========== Authentication & Email Verification Tables ==========

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({ id: true, createdAt: true });
export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// ========== Enhanced Expense Tracking ==========

// Travel expense details - linked to expenses for travel category
export const travelExpenseDetails = pgTable("travel_expense_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseId: varchar("expense_id").notNull().references(() => expenses.id, { onDelete: "cascade" }),
  fromLocation: text("from_location").notNull(),
  toLocation: text("to_location").notNull(),
  transportMode: text("transport_mode").notNull(), // car, bike, bus, train, flight, taxi, other
  distanceKm: decimal("distance_km", { precision: 10, scale: 2 }),
  fuelLiters: decimal("fuel_liters", { precision: 10, scale: 2 }),
  fuelRate: decimal("fuel_rate", { precision: 10, scale: 2 }),
  tollCharges: decimal("toll_charges", { precision: 10, scale: 2 }),
  parkingCharges: decimal("parking_charges", { precision: 10, scale: 2 }),
  receiptUrl: text("receipt_url"),
  departureTime: timestamp("departure_time"),
  arrivalTime: timestamp("arrival_time"),
  purpose: text("purpose"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertTravelExpenseDetailSchema = createInsertSchema(travelExpenseDetails).omit({ id: true, createdAt: true });
export type InsertTravelExpenseDetail = z.infer<typeof insertTravelExpenseDetailSchema>;
export type TravelExpenseDetail = typeof travelExpenseDetails.$inferSelect;

// Expense approval workflow
export const expenseApprovals = pgTable("expense_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseId: varchar("expense_id").notNull().references(() => expenses.id, { onDelete: "cascade" }),
  approverId: varchar("approver_id").notNull().references(() => users.id),
  approvalLevel: integer("approval_level").notNull().default(1), // 1=manager, 2=director, 3=finance
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  comments: text("comments"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertExpenseApprovalSchema = createInsertSchema(expenseApprovals).omit({ id: true, createdAt: true });
export type InsertExpenseApproval = z.infer<typeof insertExpenseApprovalSchema>;
export type ExpenseApproval = typeof expenseApprovals.$inferSelect;

// Patient Tracking Numbers - for hospital/clinic workflows
export const patientTrackingNumbers = pgTable("patient_tracking_numbers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  trackingNumber: text("tracking_number").notNull(), // PTN - unique per visit
  visitDate: timestamp("visit_date").notNull(),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  doctorId: varchar("doctor_id").references(() => healthcareDoctors.id),
  chiefComplaint: text("chief_complaint"),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertPatientTrackingNumberSchema = createInsertSchema(patientTrackingNumbers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPatientTrackingNumber = z.infer<typeof insertPatientTrackingNumberSchema>;
export type PatientTrackingNumber = typeof patientTrackingNumbers.$inferSelect;

// ========== Inventory Management Module ==========

// Warehouses/Storage locations
export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  facilityId: varchar("facility_id").references(() => healthcareFacilities.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  code: text("code").notNull(),
  address: text("address"),
  phone: text("phone"),
  warehouseType: text("warehouse_type").notNull().default("main"), // main, branch, cold_storage
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;

// Stock items - inventory items in warehouses
export const stockItems = pgTable("stock_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(),
  itemCode: text("item_code").notNull(),
  category: text("category"), // medicine, equipment, consumable, etc.
  unit: text("unit").notNull().default("pcs"), // pcs, box, strip, bottle, kg, etc.
  currentQuantity: decimal("current_quantity", { precision: 12, scale: 2 }).notNull().default("0"),
  reorderLevel: decimal("reorder_level", { precision: 12, scale: 2 }).default("10"),
  maxLevel: decimal("max_level", { precision: 12, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }),
  batchNumber: text("batch_number"),
  expiryDate: timestamp("expiry_date"),
  manufacturer: text("manufacturer"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertStockItemSchema = createInsertSchema(stockItems).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStockItem = z.infer<typeof insertStockItemSchema>;
export type StockItem = typeof stockItems.$inferSelect;

// Stock movements - tracks all stock transactions
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stockItemId: varchar("stock_item_id").notNull().references(() => stockItems.id, { onDelete: "cascade" }),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  movementType: text("movement_type").notNull(), // in, out, transfer, adjustment, return
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  previousQuantity: decimal("previous_quantity", { precision: 12, scale: 2 }).notNull(),
  newQuantity: decimal("new_quantity", { precision: 12, scale: 2 }).notNull(),
  referenceType: text("reference_type"), // purchase, sale, prescription, transfer, adjustment
  referenceId: varchar("reference_id"), // ID of related document
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }),
  batchNumber: text("batch_number"),
  expiryDate: timestamp("expiry_date"),
  fromWarehouseId: varchar("from_warehouse_id").references(() => warehouses.id), // For transfers
  toWarehouseId: varchar("to_warehouse_id").references(() => warehouses.id), // For transfers
  reason: text("reason"),
  notes: text("notes"),
  performedBy: varchar("performed_by").notNull().references(() => users.id),
  movementDate: timestamp("movement_date").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({ id: true, createdAt: true });
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

// ========== Doctor Payroll & Compensation ==========

// Doctor payroll records - for healthcare doctor payments
export const doctorPayrollRecords = pgTable("doctor_payroll_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id").notNull().references(() => healthcareDoctors.id, { onDelete: "cascade" }),
  payPeriodStart: timestamp("pay_period_start").notNull(),
  payPeriodEnd: timestamp("pay_period_end").notNull(),
  agreementType: text("agreement_type").notNull(), // permanent, on_call
  // For permanent doctors
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }).default("0"),
  // For on-call doctors
  totalPatientsSeen: integer("total_patients_seen").default(0),
  perPatientFee: decimal("per_patient_fee", { precision: 10, scale: 2 }),
  patientFeeEarnings: decimal("patient_fee_earnings", { precision: 12, scale: 2 }).default("0"),
  // Commission-based earnings
  totalConsultationRevenue: decimal("total_consultation_revenue", { precision: 12, scale: 2 }).default("0"),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }),
  commissionEarnings: decimal("commission_earnings", { precision: 12, scale: 2 }).default("0"),
  // Additional earnings/deductions
  allowances: decimal("allowances", { precision: 12, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  bonus: decimal("bonus", { precision: 12, scale: 2 }).default("0"),
  // Totals
  grossEarnings: decimal("gross_earnings", { precision: 12, scale: 2 }).notNull(),
  netPayable: decimal("net_payable", { precision: 12, scale: 2 }).notNull(),
  // Status
  status: text("status").notNull().default("draft"), // draft, approved, paid
  paymentDate: timestamp("payment_date"),
  paymentMethod: text("payment_method"),
  paymentReference: text("payment_reference"),
  notes: text("notes"),
  approvedBy: varchar("approved_by").references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertDoctorPayrollRecordSchema = createInsertSchema(doctorPayrollRecords).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDoctorPayrollRecord = z.infer<typeof insertDoctorPayrollRecordSchema>;
export type DoctorPayrollRecord = typeof doctorPayrollRecords.$inferSelect;

// ========== Doctor Expenditure Tracking ==========

// Doctor expenditures - tracks expenses related to doctors (samples, sponsorships, etc.)
export const doctorExpenditures = pgTable("doctor_expenditures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // MR who incurred/recorded
  doctorId: varchar("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }), // Target doctor
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  expenditureDate: timestamp("expenditure_date").notNull(),
  category: text("category").notNull(), // samples, gifts, sponsorship, conference, meals, travel, other
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  receiptUrl: text("receipt_url"),
  // For sample distributions
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  sampleQuantity: integer("sample_quantity"),
  // For events/conferences
  eventName: text("event_name"),
  eventDate: timestamp("event_date"),
  // Status tracking
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertDoctorExpenditureSchema = createInsertSchema(doctorExpenditures).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  expenditureDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  eventDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});
export type InsertDoctorExpenditure = z.infer<typeof insertDoctorExpenditureSchema>;
export type DoctorExpenditure = typeof doctorExpenditures.$inferSelect;

// ========== CENTRALIZED PERSON MASTER (Single Source of Truth) ==========

// Person Master - centralized identity for all individuals in the system
export const persons = pgTable("persons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Primary identifiers (CNIC takes priority, phone as fallback)
  cnic: varchar("cnic", { length: 15 }).unique(), // Format: XXXXX-XXXXXXX-X
  phone: varchar("phone", { length: 20 }), // Fallback identifier if CNIC not available
  // Core identity (editable only by the person themselves)
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // male, female, other
  // Contact information
  email: varchar("email"),
  alternatePhone: varchar("alternate_phone", { length: 20 }),
  // Address
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("Pakistan"),
  postalCode: varchar("postal_code", { length: 10 }),
  // Medical info (for patients)
  bloodGroup: text("blood_group"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  // Photo/Profile
  profileImageUrl: text("profile_image_url"),
  // Linked user account (if person has system login)
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  // Status
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false), // CNIC/identity verified
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by"),
  // Metadata
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPersonSchema = createInsertSchema(persons).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  dateOfBirth: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, "CNIC format must be XXXXX-XXXXXXX-X").optional().nullable(),
});
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof persons.$inferSelect;

// ========== PERSON CONTEXT (Multi-Org/Multi-Role Employment) ==========

// PersonContext - tracks employment/engagement across multiple organizations with proper hierarchy
// Hierarchy: Organization → Facility (Branch) → Department → Role → Person
export const personContexts = pgTable("person_contexts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personId: varchar("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  // Organization hierarchy - proper foreign keys
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  facilityId: varchar("facility_id").references(() => healthcareFacilities.id, { onDelete: "set null" }), // Specific branch
  departmentId: varchar("department_id").references(() => facilityDepartments.id, { onDelete: "set null" }), // Department within facility
  roleId: varchar("role_id").references(() => roles.id, { onDelete: "set null" }), // Role with permissions
  departmentRoleId: varchar("department_role_id").references(() => departmentRoles.id, { onDelete: "set null" }), // Specific department-role assignment
  // Legacy fields (kept for backward compatibility, will be deprecated)
  organizationType: text("organization_type"), // clinic, hospital, lab, pharma, medical_store (deprecated: use organization.organizationTypeId)
  roleType: text("role_type"), // deprecated: use roleId instead
  department: text("department"), // deprecated: use departmentId instead
  designation: text("designation"), // Job title/designation
  // Employment/Engagement details
  employmentType: text("employment_type"), // permanent, on_call, contract, visiting
  hireDate: timestamp("hire_date"),
  terminationDate: timestamp("termination_date"),
  terminationReason: text("termination_reason"),
  // Status
  status: text("status").notNull().default("active"), // active, inactive, terminated, suspended
  // For doctors - agreement details
  agreementType: text("agreement_type"), // permanent_salary, on_call_fee, percentage_share
  monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }),
  perPatientFee: decimal("per_patient_fee", { precision: 10, scale: 2 }),
  percentageShare: decimal("percentage_share", { precision: 5, scale: 2 }),
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }),
  // Professional info
  specialty: text("specialty"),
  qualification: text("qualification"),
  licenseNumber: varchar("license_number"),
  // Permission overrides (company admin can customize per user)
  permissionOverrides: jsonb("permission_overrides"), // Override default role permissions
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPersonContextSchema = createInsertSchema(personContexts).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  hireDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  terminationDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});
export type InsertPersonContext = z.infer<typeof insertPersonContextSchema>;
export type PersonContext = typeof personContexts.$inferSelect;

// ========== QUEUE MANAGEMENT (Multi-Type Daily Auto-Reset) ==========

// Queue Definition - defines queue types per organization
export const queueDefinitions = pgTable("queue_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  facilityId: varchar("facility_id").references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  queueType: text("queue_type").notNull(), // doctor_consultation, lab_test, pharmacy_pickup, reception
  name: text("name").notNull(), // Display name for queue
  description: text("description"),
  // Queue configuration
  startNumber: integer("start_number").notNull().default(1),
  prefix: varchar("prefix", { length: 5 }), // e.g., "DC" for doctor consultation
  // Assignment (optional - for doctor-specific queues)
  doctorContextId: varchar("doctor_context_id").references(() => personContexts.id, { onDelete: "set null" }),
  // Operating hours
  operatingStartTime: text("operating_start_time"), // e.g., "09:00"
  operatingEndTime: text("operating_end_time"), // e.g., "17:00"
  // Status
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertQueueDefinitionSchema = createInsertSchema(queueDefinitions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQueueDefinition = z.infer<typeof insertQueueDefinitionSchema>;
export type QueueDefinition = typeof queueDefinitions.$inferSelect;

// Queue Day State - tracks daily queue state (auto-resets daily)
export const queueDayStates = pgTable("queue_day_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  queueDefinitionId: varchar("queue_definition_id").notNull().references(() => queueDefinitions.id, { onDelete: "cascade" }),
  queueDate: timestamp("queue_date").notNull(),
  currentNumber: integer("current_number").notNull().default(0),
  lastIssuedNumber: integer("last_issued_number").notNull().default(0),
  totalTokensIssued: integer("total_tokens_issued").notNull().default(0),
  totalTokensCompleted: integer("total_tokens_completed").notNull().default(0),
  totalTokensCancelled: integer("total_tokens_cancelled").notNull().default(0),
  // Status
  status: text("status").notNull().default("open"), // open, paused, closed
  openedAt: timestamp("opened_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertQueueDayStateSchema = createInsertSchema(queueDayStates).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  queueDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});
export type InsertQueueDayState = z.infer<typeof insertQueueDayStateSchema>;
export type QueueDayState = typeof queueDayStates.$inferSelect;

// Queue Token - individual tokens issued to patients
export const queueTokens = pgTable("queue_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  queueDayStateId: varchar("queue_day_state_id").notNull().references(() => queueDayStates.id, { onDelete: "cascade" }),
  queueDefinitionId: varchar("queue_definition_id").notNull().references(() => queueDefinitions.id, { onDelete: "cascade" }),
  // Token info
  tokenNumber: integer("token_number").notNull(),
  tokenDisplay: varchar("token_display", { length: 20 }).notNull(), // e.g., "DC-001"
  // Patient
  patientPersonId: varchar("patient_person_id").references(() => persons.id, { onDelete: "set null" }),
  patientName: text("patient_name"), // For walk-ins without full registration
  patientPhone: varchar("patient_phone", { length: 20 }),
  // Status tracking
  status: text("status").notNull().default("waiting"), // waiting, called, in_progress, completed, cancelled, no_show
  // Timestamps
  issuedAt: timestamp("issued_at").notNull().default(sql`now()`),
  calledAt: timestamp("called_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  // Staff tracking
  issuedBy: varchar("issued_by").references(() => users.id),
  calledBy: varchar("called_by").references(() => users.id),
  completedBy: varchar("completed_by").references(() => users.id),
  // Notes
  priority: text("priority").default("normal"), // normal, urgent, emergency
  notes: text("notes"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertQueueTokenSchema = createInsertSchema(queueTokens).omit({ id: true, createdAt: true, updatedAt: true, issuedAt: true });
export type InsertQueueToken = z.infer<typeof insertQueueTokenSchema>;
export type QueueToken = typeof queueTokens.$inferSelect;

// ========== LAB MODULE ==========

// Lab Orders - orders placed by doctors/clinics
export const labOrders = pgTable("lab_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number", { length: 30 }).notNull().unique(),
  // Source organization (ordering entity)
  orderingOrganizationId: varchar("ordering_organization_id").references(() => organizations.id, { onDelete: "set null" }),
  orderingFacilityId: varchar("ordering_facility_id").references(() => healthcareFacilities.id, { onDelete: "set null" }),
  // Lab organization (receiving lab)
  labOrganizationId: varchar("lab_organization_id").references(() => organizations.id, { onDelete: "set null" }),
  // Patient and Doctor
  patientPersonId: varchar("patient_person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  orderingDoctorContextId: varchar("ordering_doctor_context_id").references(() => personContexts.id, { onDelete: "set null" }),
  // Order details
  orderDate: timestamp("order_date").notNull().default(sql`now()`),
  priority: text("priority").default("routine"), // routine, urgent, stat
  clinicalNotes: text("clinical_notes"),
  // Status
  status: text("status").notNull().default("pending"), // pending, received, in_progress, completed, cancelled
  receivedAt: timestamp("received_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  // Billing
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0"),
  paymentStatus: text("payment_status").default("pending"), // pending, partial, paid
  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertLabOrderSchema = createInsertSchema(labOrders).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  orderDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});
export type InsertLabOrder = z.infer<typeof insertLabOrderSchema>;
export type LabOrder = typeof labOrders.$inferSelect;

// Lab Order Items - individual tests within an order
export const labOrderItems = pgTable("lab_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  labOrderId: varchar("lab_order_id").notNull().references(() => labOrders.id, { onDelete: "cascade" }),
  testCode: varchar("test_code", { length: 50 }),
  testName: text("test_name").notNull(),
  testCategory: text("test_category"), // blood, urine, stool, x_ray, mri, ct_scan, ultrasound, ecg, other
  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  // Assignment
  assignedTechnicianId: varchar("assigned_technician_id").references(() => personContexts.id, { onDelete: "set null" }),
  // Status
  status: text("status").notNull().default("pending"), // pending, sample_collected, in_progress, completed, cancelled
  sampleCollectedAt: timestamp("sample_collected_at"),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  // Sample info
  sampleType: text("sample_type"), // blood, urine, swab, tissue, etc.
  sampleId: varchar("sample_id", { length: 50 }),
  specialInstructions: text("special_instructions"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertLabOrderItemSchema = createInsertSchema(labOrderItems).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLabOrderItem = z.infer<typeof insertLabOrderItemSchema>;
export type LabOrderItem = typeof labOrderItems.$inferSelect;

// Lab Results - test results
export const labResults = pgTable("lab_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  labOrderItemId: varchar("lab_order_item_id").notNull().references(() => labOrderItems.id, { onDelete: "cascade" }),
  // Result data
  resultData: jsonb("result_data"), // Structured test results with parameters
  resultSummary: text("result_summary"),
  interpretation: text("interpretation"),
  referenceRange: text("reference_range"),
  abnormalFlags: text("abnormal_flags"), // high, low, critical
  // Verification
  resultEnteredBy: varchar("result_entered_by").references(() => personContexts.id, { onDelete: "set null" }),
  resultEnteredAt: timestamp("result_entered_at"),
  verifiedBy: varchar("verified_by").references(() => personContexts.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at"),
  isVerified: boolean("is_verified").notNull().default(false),
  // Status
  status: text("status").notNull().default("pending"), // pending, entered, verified, released
  releasedAt: timestamp("released_at"),
  releasedBy: varchar("released_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertLabResultSchema = createInsertSchema(labResults).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLabResult = z.infer<typeof insertLabResultSchema>;
export type LabResult = typeof labResults.$inferSelect;

// Lab Reports - final report documents
export const labReports = pgTable("lab_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  labOrderId: varchar("lab_order_id").notNull().references(() => labOrders.id, { onDelete: "cascade" }),
  patientPersonId: varchar("patient_person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  // Report file
  reportNumber: varchar("report_number", { length: 30 }).notNull(),
  reportUrl: text("report_url"), // URL to uploaded PDF
  reportData: jsonb("report_data"), // Structured report data
  // Report metadata
  reportTitle: text("report_title"),
  reportDate: timestamp("report_date").notNull(),
  // Approval
  generatedBy: varchar("generated_by").references(() => personContexts.id, { onDelete: "set null" }),
  approvedBy: varchar("approved_by").references(() => personContexts.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  // Access control - only ordering doctor and assigned lab staff can view
  isReleased: boolean("is_released").notNull().default(false),
  releasedAt: timestamp("released_at"),
  // Audit
  viewedByDoctor: boolean("viewed_by_doctor").default(false),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertLabReportSchema = createInsertSchema(labReports).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  reportDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});
export type InsertLabReport = z.infer<typeof insertLabReportSchema>;
export type LabReport = typeof labReports.$inferSelect;

// ========== MEDICAL STORE / PHARMACY MODULE ==========

// Medicines - medicine inventory master
export const medicines = pgTable("medicines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  pharmaProductId: varchar("pharma_product_id").references(() => products.id, { onDelete: "set null" }), // Link to pharma company's product catalog
  // Medicine info
  name: text("name").notNull(),
  genericName: text("generic_name"),
  brandName: text("brand_name"),
  manufacturer: text("manufacturer"),
  category: text("category"), // tablet, capsule, syrup, injection, cream, drops, inhaler, other
  strength: text("strength"), // e.g., "500mg", "10ml"
  packSize: text("pack_size"), // e.g., "10 tablets", "100ml bottle"
  // Identification
  barcode: varchar("barcode", { length: 50 }),
  sku: varchar("sku", { length: 50 }),
  // Pricing
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  mrp: decimal("mrp", { precision: 10, scale: 2 }), // Maximum retail price
  // Stock
  reorderLevel: integer("reorder_level").default(10),
  minStockLevel: integer("min_stock_level").default(5),
  // Regulatory
  requiresPrescription: boolean("requires_prescription").default(false),
  isControlled: boolean("is_controlled").default(false),
  storageInstructions: text("storage_instructions"),
  // Status
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertMedicineSchema = createInsertSchema(medicines).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type Medicine = typeof medicines.$inferSelect;

// Medicine Stock Ledger - batch-wise inventory tracking
export const medicineStockLedger = pgTable("medicine_stock_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicineId: varchar("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  // Batch info
  batchNumber: varchar("batch_number", { length: 50 }),
  expiryDate: timestamp("expiry_date"),
  manufacturingDate: timestamp("manufacturing_date"),
  // Stock movement
  transactionType: text("transaction_type").notNull(), // purchase, sale, return, adjustment, transfer, expired, damaged
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull().default(0),
  newStock: integer("new_stock").notNull(),
  // Pricing at time of transaction
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
  // References
  referenceType: text("reference_type"), // purchase_order, prescription, return, adjustment
  referenceId: varchar("reference_id"),
  supplierId: varchar("supplier_id"),
  // Metadata
  notes: text("notes"),
  transactionDate: timestamp("transaction_date").notNull().default(sql`now()`),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertMedicineStockLedgerSchema = createInsertSchema(medicineStockLedger).omit({ id: true, createdAt: true }).extend({
  transactionDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  expiryDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  manufacturingDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});
export type InsertMedicineStockLedger = z.infer<typeof insertMedicineStockLedgerSchema>;
export type MedicineStockLedger = typeof medicineStockLedger.$inferSelect;

// Prescription Orders - prescriptions linked to pharmacy
export const prescriptionOrders = pgTable("prescription_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number", { length: 30 }).notNull().unique(),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  // Patient and Doctor
  patientPersonId: varchar("patient_person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  prescribingDoctorContextId: varchar("prescribing_doctor_context_id").references(() => personContexts.id, { onDelete: "set null" }),
  // Original prescription
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id, { onDelete: "set null" }),
  consultationId: varchar("consultation_id").references(() => consultations.id, { onDelete: "set null" }),
  // Order details
  orderDate: timestamp("order_date").notNull().default(sql`now()`),
  items: jsonb("items").notNull(), // Array of {medicineId, medicineName, quantity, dosage, frequency, duration}
  // Pricing
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  // Payment
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0"),
  paymentStatus: text("payment_status").default("pending"), // pending, partial, paid
  paymentMethod: text("payment_method"),
  // Status
  status: text("status").notNull().default("pending"), // pending, processing, ready, dispensed, cancelled
  dispensedAt: timestamp("dispensed_at"),
  dispensedBy: varchar("dispensed_by").references(() => personContexts.id, { onDelete: "set null" }),
  // Queue reference
  queueTokenId: varchar("queue_token_id").references(() => queueTokens.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertPrescriptionOrderSchema = createInsertSchema(prescriptionOrders).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  orderDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});
export type InsertPrescriptionOrder = z.infer<typeof insertPrescriptionOrderSchema>;
export type PrescriptionOrder = typeof prescriptionOrders.$inferSelect;

// Dispense Events - individual dispensing transactions
export const dispenseEvents = pgTable("dispense_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prescriptionOrderId: varchar("prescription_order_id").notNull().references(() => prescriptionOrders.id, { onDelete: "cascade" }),
  medicineId: varchar("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  stockLedgerEntryId: varchar("stock_ledger_entry_id").references(() => medicineStockLedger.id, { onDelete: "set null" }),
  // Dispense details
  quantityDispensed: integer("quantity_dispensed").notNull(),
  batchNumber: varchar("batch_number", { length: 50 }),
  expiryDate: timestamp("expiry_date"),
  // Pricing
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  // Tracking
  dispensedAt: timestamp("dispensed_at").notNull().default(sql`now()`),
  dispensedBy: varchar("dispensed_by").references(() => personContexts.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertDispenseEventSchema = createInsertSchema(dispenseEvents).omit({ id: true, createdAt: true });
export type InsertDispenseEvent = z.infer<typeof insertDispenseEventSchema>;
export type DispenseEvent = typeof dispenseEvents.$inferSelect;

// ========== DATA TRANSFER GOVERNANCE ==========

// Data Transfer Requests - all data exports require Super Admin approval
export const dataTransferRequests = pgTable("data_transfer_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Requester
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  requestedByOrganizationId: varchar("requested_by_organization_id").references(() => organizations.id, { onDelete: "set null" }),
  // Request details
  requestType: text("request_type").notNull(), // report_export, ai_feed, analytics_export, integration_sync, bulk_export
  dataScope: text("data_scope").notNull(), // Description of data being requested
  dataCategories: jsonb("data_categories"), // Array of data types: patients, visits, prescriptions, etc.
  purpose: text("purpose").notNull(),
  justification: text("justification"),
  // Data details
  dateRangeStart: timestamp("date_range_start"),
  dateRangeEnd: timestamp("date_range_end"),
  estimatedRecordCount: integer("estimated_record_count"),
  // Destination
  destinationType: text("destination_type"), // download, external_api, analytics_pipeline, third_party
  destinationDetails: text("destination_details"),
  // Approval workflow
  status: text("status").notNull().default("pending"), // pending, approved, rejected, expired, completed
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  rejectionReason: text("rejection_reason"),
  // Validity
  approvalExpiresAt: timestamp("approval_expires_at"),
  // Execution
  executedAt: timestamp("executed_at"),
  downloadUrl: text("download_url"),
  downloadExpiresAt: timestamp("download_expires_at"),
  // Audit
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertDataTransferRequestSchema = createInsertSchema(dataTransferRequests).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  dateRangeStart: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  dateRangeEnd: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});
export type InsertDataTransferRequest = z.infer<typeof insertDataTransferRequestSchema>;
export type DataTransferRequest = typeof dataTransferRequests.$inferSelect;

// ========== COMPREHENSIVE AUDIT LOG ==========

// Audit Log - immutable log of all actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Actor
  actorUserId: varchar("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  actorPersonId: varchar("actor_person_id").references(() => persons.id, { onDelete: "set null" }),
  actorOrganizationId: varchar("actor_organization_id").references(() => organizations.id, { onDelete: "set null" }),
  actorIpAddress: varchar("actor_ip_address", { length: 45 }),
  actorUserAgent: text("actor_user_agent"),
  // Action
  action: text("action").notNull(), // create, read, update, delete, hire, terminate, queue_issue, queue_call, queue_complete, report_access, export, login, logout
  actionCategory: text("action_category").notNull(), // person, organization, queue, lab, pharmacy, report, auth, system
  // Target
  targetType: text("target_type").notNull(), // person, organization, queue_token, lab_order, prescription, report, user, etc.
  targetId: varchar("target_id"),
  targetOrganizationId: varchar("target_organization_id").references(() => organizations.id, { onDelete: "set null" }),
  // Data
  previousData: jsonb("previous_data"), // Snapshot of data before change
  newData: jsonb("new_data"), // Snapshot of data after change
  changedFields: jsonb("changed_fields"), // Array of field names that changed
  // Context
  sessionId: varchar("session_id"),
  requestPath: text("request_path"),
  requestMethod: varchar("request_method", { length: 10 }),
  // Metadata
  description: text("description"),
  severity: text("severity").default("info"), // info, warning, critical
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  // Timestamp (immutable)
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// ========== HR / PAYROLL / ACCOUNTS MODULE ==========

// Payslip Template - editable, versioned, organization-specific
export const payslipTemplates = pgTable("payslip_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  templateName: varchar("template_name", { length: 100 }).notNull(),
  description: text("description"),
  // Layout configuration stored as JSON
  layoutConfig: jsonb("layout_config").notNull(), // Header, employee details, earnings, deductions, tax, net pay, notes sections
  // Dynamic field catalog - which fields are available for binding
  dynamicFieldCatalog: jsonb("dynamic_field_catalog"), // Available fields for data binding
  // Versioning
  version: integer("version").notNull().default(1),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: timestamp("effective_from").notNull().default(sql`now()`),
  effectiveTo: timestamp("effective_to"),
  // Localization
  supportedLanguages: jsonb("supported_languages").default(sql`'["en", "ur"]'::jsonb`), // English and Urdu
  // Audit
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertPayslipTemplateSchema = createInsertSchema(payslipTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayslipTemplate = z.infer<typeof insertPayslipTemplateSchema>;
export type PayslipTemplate = typeof payslipTemplates.$inferSelect;

// Attendance Source - configurable punch devices
export const attendanceSources = pgTable("attendance_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sourceName: varchar("source_name", { length: 100 }).notNull(),
  sourceType: text("source_type").notNull(), // biometric, rfid, mobile_app, web_punch, third_party_api
  deviceVendor: varchar("device_vendor", { length: 100 }),
  deviceModel: varchar("device_model", { length: 100 }),
  // Connection configuration (API URL, credentials, etc.)
  connectionConfig: jsonb("connection_config"),
  // Field mapping for normalization
  fieldMapping: jsonb("field_mapping"), // Map device fields to standard fields
  // Settings
  isActive: boolean("is_active").notNull().default(true),
  syncIntervalMinutes: integer("sync_interval_minutes").default(15),
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncStatus: text("last_sync_status"), // success, failed, pending
  // Audit
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertAttendanceSourceSchema = createInsertSchema(attendanceSources).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAttendanceSource = z.infer<typeof insertAttendanceSourceSchema>;
export type AttendanceSource = typeof attendanceSources.$inferSelect;

// Shift Definition - configurable work shifts
export const shiftDefinitions = pgTable("shift_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  shiftName: varchar("shift_name", { length: 100 }).notNull(),
  shiftCode: varchar("shift_code", { length: 20 }).notNull(),
  // Timing
  startTime: varchar("start_time", { length: 8 }).notNull(), // HH:MM:SS format
  endTime: varchar("end_time", { length: 8 }).notNull(),
  // Break time
  breakStartTime: varchar("break_start_time", { length: 8 }),
  breakEndTime: varchar("break_end_time", { length: 8 }),
  breakDurationMinutes: integer("break_duration_minutes").default(0),
  // Grace periods
  lateGraceMinutes: integer("late_grace_minutes").default(15),
  earlyLeaveGraceMinutes: integer("early_leave_grace_minutes").default(15),
  // Working hours
  standardWorkingHours: decimal("standard_working_hours", { precision: 4, scale: 2 }).default("8.00"),
  // Days
  workingDays: jsonb("working_days").default(sql`'["mon", "tue", "wed", "thu", "fri"]'::jsonb`),
  // Status
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertShiftDefinitionSchema = createInsertSchema(shiftDefinitions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShiftDefinition = z.infer<typeof insertShiftDefinitionSchema>;
export type ShiftDefinition = typeof shiftDefinitions.$inferSelect;

// Shift Assignment - assign shifts to persons
export const shiftAssignments = pgTable("shift_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personContextId: varchar("person_context_id").notNull().references(() => personContexts.id, { onDelete: "cascade" }),
  shiftId: varchar("shift_id").notNull().references(() => shiftDefinitions.id, { onDelete: "cascade" }),
  effectiveFrom: timestamp("effective_from").notNull().default(sql`now()`),
  effectiveTo: timestamp("effective_to"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertShiftAssignmentSchema = createInsertSchema(shiftAssignments).omit({ id: true, createdAt: true });
export type InsertShiftAssignment = z.infer<typeof insertShiftAssignmentSchema>;
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;

// Overtime Rules - configurable overtime calculation
export const overtimeRules = pgTable("overtime_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  ruleName: varchar("rule_name", { length: 100 }).notNull(),
  // Threshold
  dailyOvertimeThresholdHours: decimal("daily_overtime_threshold_hours", { precision: 4, scale: 2 }).default("8.00"),
  weeklyOvertimeThresholdHours: decimal("weekly_overtime_threshold_hours", { precision: 5, scale: 2 }).default("40.00"),
  // Multipliers
  regularOvertimeMultiplier: decimal("regular_overtime_multiplier", { precision: 3, scale: 2 }).default("1.50"),
  holidayOvertimeMultiplier: decimal("holiday_overtime_multiplier", { precision: 3, scale: 2 }).default("2.00"),
  weekendOvertimeMultiplier: decimal("weekend_overtime_multiplier", { precision: 3, scale: 2 }).default("2.00"),
  // Eligibility
  eligibleEmployeeTypes: jsonb("eligible_employee_types").default(sql`'["hourly", "contract"]'::jsonb`),
  // Approval
  requiresApproval: boolean("requires_approval").notNull().default(true),
  // Status
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertOvertimeRuleSchema = createInsertSchema(overtimeRules).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOvertimeRule = z.infer<typeof insertOvertimeRuleSchema>;
export type OvertimeRule = typeof overtimeRules.$inferSelect;

// Attendance Log - normalized attendance records
export const attendanceLogs = pgTable("attendance_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personId: varchar("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  personContextId: varchar("person_context_id").references(() => personContexts.id, { onDelete: "set null" }),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  // Source tracking
  sourceId: varchar("source_id").references(() => attendanceSources.id, { onDelete: "set null" }),
  rawEventId: varchar("raw_event_id"), // ID from source system
  // Punch times
  punchIn: timestamp("punch_in").notNull(),
  punchOut: timestamp("punch_out"),
  // Date for easy querying
  attendanceDate: timestamp("attendance_date").notNull(),
  // Shift reference
  shiftId: varchar("shift_id").references(() => shiftDefinitions.id, { onDelete: "set null" }),
  // Calculated values (post-normalization)
  normalizedHours: decimal("normalized_hours", { precision: 5, scale: 2 }),
  regularHours: decimal("regular_hours", { precision: 5, scale: 2 }),
  overtimeHours: decimal("overtime_hours", { precision: 5, scale: 2 }),
  // Status flags
  isLate: boolean("is_late").default(false),
  lateMinutes: integer("late_minutes").default(0),
  isEarlyLeave: boolean("is_early_leave").default(false),
  earlyLeaveMinutes: integer("early_leave_minutes").default(0),
  isMissingPunchOut: boolean("is_missing_punch_out").default(false),
  // Validation
  isValid: boolean("is_valid").notNull().default(true),
  validationNotes: text("validation_notes"),
  // Approval for HR
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  // Audit
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertAttendanceLogSchema = createInsertSchema(attendanceLogs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAttendanceLog = z.infer<typeof insertAttendanceLogSchema>;
export type AttendanceLog = typeof attendanceLogs.$inferSelect;

// Attendance Exception - leave, holiday, adjustments
export const attendanceExceptions = pgTable("attendance_exceptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personId: varchar("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  personContextId: varchar("person_context_id").references(() => personContexts.id, { onDelete: "set null" }),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  // Exception details
  exceptionType: text("exception_type").notNull(), // leave, holiday, half_day, work_from_home, adjustment
  exceptionDate: timestamp("exception_date").notNull(),
  startTime: varchar("start_time", { length: 8 }),
  endTime: varchar("end_time", { length: 8 }),
  hoursAffected: decimal("hours_affected", { precision: 5, scale: 2 }),
  // Leave type details
  leaveType: text("leave_type"), // annual, sick, casual, maternity, unpaid
  isPaid: boolean("is_paid").default(true),
  // Approval
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  requestedBy: varchar("requested_by").references(() => users.id, { onDelete: "set null" }),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  // Audit
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertAttendanceExceptionSchema = createInsertSchema(attendanceExceptions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAttendanceException = z.infer<typeof insertAttendanceExceptionSchema>;
export type AttendanceException = typeof attendanceExceptions.$inferSelect;

// Salary Structure - base salary and components
export const salaryStructures = pgTable("salary_structures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personContextId: varchar("person_context_id").notNull().references(() => personContexts.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  // Payment type
  paymentType: text("payment_type").notNull(), // monthly_salary, hourly_wage, per_visit, percentage_share
  // Base amounts
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }).default("0.00"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).default("0.00"),
  perVisitRate: decimal("per_visit_rate", { precision: 10, scale: 2 }).default("0.00"),
  percentageShare: decimal("percentage_share", { precision: 5, scale: 2 }).default("0.00"),
  // Currency
  currency: varchar("currency", { length: 3 }).default("PKR"),
  // Effective dates
  effectiveFrom: timestamp("effective_from").notNull().default(sql`now()`),
  effectiveTo: timestamp("effective_to"),
  // Status
  isActive: boolean("is_active").notNull().default(true),
  // Audit
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertSalaryStructureSchema = createInsertSchema(salaryStructures).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSalaryStructure = z.infer<typeof insertSalaryStructureSchema>;
export type SalaryStructure = typeof salaryStructures.$inferSelect;

// Salary Components - allowances and deductions
export const salaryComponents = pgTable("salary_components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salaryStructureId: varchar("salary_structure_id").notNull().references(() => salaryStructures.id, { onDelete: "cascade" }),
  // Component details
  componentType: text("component_type").notNull(), // earning, deduction
  componentCategory: text("component_category").notNull(), // allowance, bonus, tax, eobi, pf, loan, advance, medical, transport, house_rent, other
  componentName: varchar("component_name", { length: 100 }).notNull(),
  // Calculation
  calculationType: text("calculation_type").notNull(), // fixed, percentage_of_base, percentage_of_gross
  amount: decimal("amount", { precision: 12, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  // Taxability (Pakistan specific)
  isTaxable: boolean("is_taxable").notNull().default(true),
  taxExemptLimit: decimal("tax_exempt_limit", { precision: 12, scale: 2 }),
  // Status
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertSalaryComponentSchema = createInsertSchema(salaryComponents).omit({ id: true, createdAt: true });
export type InsertSalaryComponent = z.infer<typeof insertSalaryComponentSchema>;
export type SalaryComponent = typeof salaryComponents.$inferSelect;

// Payroll Run - monthly/periodic payroll processing
export const payrollRuns = pgTable("payroll_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  // Period (Pakistan fiscal year: July - June)
  fiscalYear: varchar("fiscal_year", { length: 9 }).notNull(), // e.g., "2025-2026"
  periodMonth: integer("period_month").notNull(), // 1-12
  periodYear: integer("period_year").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  // Run details
  runType: text("run_type").notNull().default("regular"), // regular, adhoc, bonus, final_settlement
  runName: varchar("run_name", { length: 100 }),
  // Status workflow
  status: text("status").notNull().default("draft"), // draft, calculating, review, approved, finalized, paid, cancelled
  // Payslip template
  payslipTemplateId: varchar("payslip_template_id").references(() => payslipTemplates.id, { onDelete: "set null" }),
  // Totals (calculated)
  totalGrossPay: decimal("total_gross_pay", { precision: 15, scale: 2 }).default("0.00"),
  totalDeductions: decimal("total_deductions", { precision: 15, scale: 2 }).default("0.00"),
  totalNetPay: decimal("total_net_pay", { precision: 15, scale: 2 }).default("0.00"),
  totalTax: decimal("total_tax", { precision: 15, scale: 2 }).default("0.00"),
  employeeCount: integer("employee_count").default(0),
  // Workflow
  calculatedAt: timestamp("calculated_at"),
  calculatedBy: varchar("calculated_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  finalizedAt: timestamp("finalized_at"),
  finalizedBy: varchar("finalized_by").references(() => users.id, { onDelete: "set null" }),
  paidAt: timestamp("paid_at"),
  // Journal entry reference
  journalEntryId: varchar("journal_entry_id"),
  // Notes
  notes: text("notes"),
  // Audit
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertPayrollRunSchema = createInsertSchema(payrollRuns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayrollRun = z.infer<typeof insertPayrollRunSchema>;
export type PayrollRun = typeof payrollRuns.$inferSelect;

// Payslip - individual employee payslip
export const payslips = pgTable("payslips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payrollRunId: varchar("payroll_run_id").notNull().references(() => payrollRuns.id, { onDelete: "cascade" }),
  personId: varchar("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  personContextId: varchar("person_context_id").notNull().references(() => personContexts.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  // Salary structure snapshot
  salaryStructureId: varchar("salary_structure_id").references(() => salaryStructures.id, { onDelete: "set null" }),
  paymentType: text("payment_type").notNull(),
  // Attendance summary
  workingDays: integer("working_days").default(0),
  presentDays: decimal("present_days", { precision: 5, scale: 2 }).default("0.00"),
  absentDays: decimal("absent_days", { precision: 5, scale: 2 }).default("0.00"),
  leaveDays: decimal("leave_days", { precision: 5, scale: 2 }).default("0.00"),
  regularHours: decimal("regular_hours", { precision: 7, scale: 2 }).default("0.00"),
  overtimeHours: decimal("overtime_hours", { precision: 7, scale: 2 }).default("0.00"),
  // Earnings
  grossPay: decimal("gross_pay", { precision: 12, scale: 2 }).notNull().default("0.00"),
  basicPay: decimal("basic_pay", { precision: 12, scale: 2 }).default("0.00"),
  overtimePay: decimal("overtime_pay", { precision: 12, scale: 2 }).default("0.00"),
  allowances: decimal("allowances", { precision: 12, scale: 2 }).default("0.00"),
  bonuses: decimal("bonuses", { precision: 12, scale: 2 }).default("0.00"),
  // Deductions
  totalDeductions: decimal("total_deductions", { precision: 12, scale: 2 }).default("0.00"),
  incomeTax: decimal("income_tax", { precision: 12, scale: 2 }).default("0.00"),
  eobi: decimal("eobi", { precision: 10, scale: 2 }).default("0.00"), // Employees' Old-Age Benefits Institution
  providentFund: decimal("provident_fund", { precision: 10, scale: 2 }).default("0.00"),
  otherDeductions: decimal("other_deductions", { precision: 10, scale: 2 }).default("0.00"),
  // Net
  netPay: decimal("net_pay", { precision: 12, scale: 2 }).notNull().default("0.00"),
  // Template used (snapshot for historical reference)
  templateSnapshot: jsonb("template_snapshot"),
  // Payment details
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, cancelled
  paymentDate: timestamp("payment_date"),
  paymentMethod: text("payment_method"), // bank_transfer, cheque, cash
  paymentReference: varchar("payment_reference", { length: 100 }),
  // Audit
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertPayslipSchema = createInsertSchema(payslips).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayslip = z.infer<typeof insertPayslipSchema>;
export type Payslip = typeof payslips.$inferSelect;

// Payslip Items - line items on payslip
export const payslipItems = pgTable("payslip_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payslipId: varchar("payslip_id").notNull().references(() => payslips.id, { onDelete: "cascade" }),
  // Item details
  itemType: text("item_type").notNull(), // earning, deduction
  itemCategory: text("item_category").notNull(),
  itemName: varchar("item_name", { length: 100 }).notNull(),
  // Calculation details
  calculationType: text("calculation_type"),
  baseAmount: decimal("base_amount", { precision: 12, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  rate: decimal("rate", { precision: 10, scale: 2 }),
  // Final amount
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  // Tax info
  isTaxable: boolean("is_taxable").default(true),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  // Display order
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertPayslipItemSchema = createInsertSchema(payslipItems).omit({ id: true, createdAt: true });
export type InsertPayslipItem = z.infer<typeof insertPayslipItemSchema>;
export type PayslipItem = typeof payslipItems.$inferSelect;

// ========== ACCOUNTS / JOURNAL ENTRIES ==========

// Ledger Accounts - chart of accounts
export const ledgerAccounts = pgTable("ledger_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  // Account details
  accountCode: varchar("account_code", { length: 20 }).notNull(),
  accountName: varchar("account_name", { length: 100 }).notNull(),
  accountType: text("account_type").notNull(), // asset, liability, equity, income, expense
  accountCategory: text("account_category"), // cash, bank, receivable, payable, salary_expense, tax_liability, etc.
  // Hierarchy
  parentAccountId: varchar("parent_account_id"),
  level: integer("level").default(1),
  // Balance
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).default("0.00"),
  normalBalance: text("normal_balance").notNull().default("debit"), // debit, credit
  // Status
  isActive: boolean("is_active").notNull().default(true),
  isSystemAccount: boolean("is_system_account").default(false),
  // Audit
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertLedgerAccountSchema = createInsertSchema(ledgerAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLedgerAccount = z.infer<typeof insertLedgerAccountSchema>;
export type LedgerAccount = typeof ledgerAccounts.$inferSelect;

// Journal Entry - accounting entries
export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  // Entry details
  entryNumber: varchar("entry_number", { length: 50 }).notNull(),
  entryDate: timestamp("entry_date").notNull(),
  // Source reference
  sourceType: text("source_type").notNull(), // payroll, payment, receipt, manual, adjustment
  sourceId: varchar("source_id"), // payrollRunId, paymentId, etc.
  // Fiscal period
  fiscalYear: varchar("fiscal_year", { length: 9 }),
  fiscalMonth: integer("fiscal_month"),
  // Description
  description: text("description"),
  memo: text("memo"),
  // Totals
  totalDebit: decimal("total_debit", { precision: 15, scale: 2 }).notNull().default("0.00"),
  totalCredit: decimal("total_credit", { precision: 15, scale: 2 }).notNull().default("0.00"),
  // Status
  status: text("status").notNull().default("draft"), // draft, posted, reversed
  // Workflow
  postedAt: timestamp("posted_at"),
  postedBy: varchar("posted_by").references(() => users.id, { onDelete: "set null" }),
  reversedAt: timestamp("reversed_at"),
  reversedBy: varchar("reversed_by").references(() => users.id, { onDelete: "set null" }),
  reversalEntryId: varchar("reversal_entry_id"),
  // Audit
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// Journal Lines - individual debit/credit lines
export const journalLines = pgTable("journal_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journalEntryId: varchar("journal_entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  accountId: varchar("account_id").notNull().references(() => ledgerAccounts.id, { onDelete: "restrict" }),
  // Amount
  debitAmount: decimal("debit_amount", { precision: 15, scale: 2 }).default("0.00"),
  creditAmount: decimal("credit_amount", { precision: 15, scale: 2 }).default("0.00"),
  // Description
  lineDescription: text("line_description"),
  // Reference
  referenceType: text("reference_type"), // person, payslip, invoice, etc.
  referenceId: varchar("reference_id"),
  // Sort
  lineNumber: integer("line_number").default(1),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertJournalLineSchema = createInsertSchema(journalLines).omit({ id: true, createdAt: true });
export type InsertJournalLine = z.infer<typeof insertJournalLineSchema>;
export type JournalLine = typeof journalLines.$inferSelect;

// Pakistan Tax Slabs - income tax configuration
export const pakistanTaxSlabs = pgTable("pakistan_tax_slabs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Fiscal year
  fiscalYear: varchar("fiscal_year", { length: 9 }).notNull(), // e.g., "2025-2026"
  // Slab details
  minIncome: decimal("min_income", { precision: 15, scale: 2 }).notNull(),
  maxIncome: decimal("max_income", { precision: 15, scale: 2 }),
  // Tax calculation
  fixedTax: decimal("fixed_tax", { precision: 12, scale: 2 }).default("0.00"),
  taxPercentage: decimal("tax_percentage", { precision: 5, scale: 2 }).notNull(),
  taxOnExcess: boolean("tax_on_excess").default(true), // Apply percentage on amount exceeding minIncome
  // Status
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertPakistanTaxSlabSchema = createInsertSchema(pakistanTaxSlabs).omit({ id: true, createdAt: true });
export type InsertPakistanTaxSlab = z.infer<typeof insertPakistanTaxSlabSchema>;
export type PakistanTaxSlab = typeof pakistanTaxSlabs.$inferSelect;

// Organization HR Settings - configurable HR/Payroll settings per org
export const organizationHRSettings = pgTable("organization_hr_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }).unique(),
  // Dashboard preferences
  combineHRPayrollDashboard: boolean("combine_hr_payroll_dashboard").default(false),
  combinePayrollAccountsDashboard: boolean("combine_payroll_accounts_dashboard").default(false),
  // Payroll settings
  defaultPayslipTemplateId: varchar("default_payslip_template_id").references(() => payslipTemplates.id, { onDelete: "set null" }),
  payrollCutoffDay: integer("payroll_cutoff_day").default(25), // Day of month for payroll cutoff
  paymentDay: integer("payment_day").default(1), // Day of month for payment
  // Tax settings
  enableIncomeTax: boolean("enable_income_tax").default(true),
  enableEOBI: boolean("enable_eobi").default(true),
  eobiContributionRate: decimal("eobi_contribution_rate", { precision: 5, scale: 2 }).default("5.00"),
  enableProvidentFund: boolean("enable_provident_fund").default(false),
  pfContributionRate: decimal("pf_contribution_rate", { precision: 5, scale: 2 }).default("8.33"),
  // Attendance settings
  enableAttendanceTracking: boolean("enable_attendance_tracking").default(true),
  multipleAttendanceSources: boolean("multiple_attendance_sources").default(false),
  // Overtime settings
  enableOvertimeCalculation: boolean("enable_overtime_calculation").default(true),
  defaultOvertimeRuleId: varchar("default_overtime_rule_id").references(() => overtimeRules.id, { onDelete: "set null" }),
  // Audit
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertOrganizationHRSettingsSchema = createInsertSchema(organizationHRSettings).omit({ id: true, updatedAt: true });
export type InsertOrganizationHRSettings = z.infer<typeof insertOrganizationHRSettingsSchema>;
export type OrganizationHRSettings = typeof organizationHRSettings.$inferSelect;

// ========== MULTI-FACILITY HMS WORKFLOW TABLES ==========

// Doctor Context Availability - facility-specific schedules for multi-facility doctors
export const doctorContextAvailability = pgTable("doctor_context_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personContextId: varchar("person_context_id").notNull().references(() => personContexts.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: text("start_time").notNull(), // e.g., "09:00"
  endTime: text("end_time").notNull(), // e.g., "17:00"
  maxPatients: integer("max_patients"), // Optional max patients per slot
  slotDuration: integer("slot_duration").default(15), // Minutes per appointment
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertDoctorContextAvailabilitySchema = createInsertSchema(doctorContextAvailability).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDoctorContextAvailability = z.infer<typeof insertDoctorContextAvailabilitySchema>;
export type DoctorContextAvailability = typeof doctorContextAvailability.$inferSelect;

// Patient Facility Encounters - links Person to facility visits (longitudinal record)
export const patientFacilityEncounters = pgTable("patient_facility_encounters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personId: varchar("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  patientNumber: text("patient_number").notNull(), // Facility-specific MRN/patient number
  registrationDate: timestamp("registration_date").notNull().default(sql`now()`),
  // Emergency contact (can differ from person's default)
  facilityEmergencyContactName: text("facility_emergency_contact_name"),
  facilityEmergencyContactPhone: varchar("facility_emergency_contact_phone", { length: 20 }),
  // Insurance info specific to this facility
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: varchar("insurance_policy_number"),
  // Status
  isActive: boolean("is_active").notNull().default(true),
  lastVisitDate: timestamp("last_visit_date"),
  totalVisits: integer("total_visits").default(0),
  // Metadata
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPatientFacilityEncounterSchema = createInsertSchema(patientFacilityEncounters).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  registrationDate: z.string().or(z.date()).optional().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  lastVisitDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});
export type InsertPatientFacilityEncounter = z.infer<typeof insertPatientFacilityEncounterSchema>;
export type PatientFacilityEncounter = typeof patientFacilityEncounters.$inferSelect;

// Facility Billing Configuration - billing rules per facility
export const facilityBillingConfig = pgTable("facility_billing_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }).unique(),
  // Invoice settings
  invoicePrefix: varchar("invoice_prefix", { length: 10 }).default("INV"),
  invoiceStartNumber: integer("invoice_start_number").default(1),
  receiptPrefix: varchar("receipt_prefix", { length: 10 }).default("RCP"),
  receiptStartNumber: integer("receipt_start_number").default(1),
  // Tax settings
  enableGST: boolean("enable_gst").default(false),
  gstPercentage: decimal("gst_percentage", { precision: 5, scale: 2 }).default("0.00"),
  gstRegistrationNumber: varchar("gst_registration_number"),
  // Discount policies
  maxDiscountPercentage: decimal("max_discount_percentage", { precision: 5, scale: 2 }).default("20.00"),
  requireDiscountApproval: boolean("require_discount_approval").default(true),
  // Payment modes
  acceptCash: boolean("accept_cash").default(true),
  acceptCard: boolean("accept_card").default(true),
  acceptOnlinePayment: boolean("accept_online_payment").default(false),
  acceptInsurance: boolean("accept_insurance").default(false),
  // Currency
  currency: varchar("currency", { length: 3 }).default("PKR"),
  // Metadata
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertFacilityBillingConfigSchema = createInsertSchema(facilityBillingConfig).omit({ id: true, updatedAt: true });
export type InsertFacilityBillingConfig = z.infer<typeof insertFacilityBillingConfigSchema>;
export type FacilityBillingConfig = typeof facilityBillingConfig.$inferSelect;

// Patient Invoices - billing records for patient services
export const patientInvoices = pgTable("patient_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  personId: varchar("person_id").notNull().references(() => persons.id, { onDelete: "restrict" }),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  invoiceDate: timestamp("invoice_date").notNull().default(sql`now()`),
  dueDate: timestamp("due_date"),
  // Visit reference
  visitType: text("visit_type").notNull(), // opd, ipd, lab, pharmacy
  visitId: varchar("visit_id"), // Reference to opd_visit, ipd_admission, etc.
  // Amounts
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0.00"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0.00"),
  balanceAmount: decimal("balance_amount", { precision: 12, scale: 2 }).default("0.00"),
  // Status
  status: text("status").notNull().default("pending"), // pending, partial, paid, cancelled, refunded
  paymentMethod: text("payment_method"), // cash, card, online, insurance
  // Line items stored as JSON
  lineItems: jsonb("line_items").notNull().default([]), // [{description, quantity, unitPrice, amount, category}]
  // Notes
  notes: text("notes"),
  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertPatientInvoiceSchema = createInsertSchema(patientInvoices).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPatientInvoice = z.infer<typeof insertPatientInvoiceSchema>;
export type PatientInvoice = typeof patientInvoices.$inferSelect;

// ========== IPD MODULE (Inpatient Department) ==========

// Wards - hospital ward definitions
export const wards = pgTable("wards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: varchar("code", { length: 10 }),
  wardType: text("ward_type").notNull(), // general, semi_private, private, icu, nicu, picu, ccu, emergency
  floor: text("floor"),
  totalBeds: integer("total_beds").notNull().default(0),
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }), // Base daily rate for ward
  nursingChargePerDay: decimal("nursing_charge_per_day", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertWardSchema = createInsertSchema(wards).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWard = z.infer<typeof insertWardSchema>;
export type Ward = typeof wards.$inferSelect;

// Beds - individual bed definitions
export const beds = pgTable("beds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  wardId: varchar("ward_id").notNull().references(() => wards.id, { onDelete: "cascade" }),
  bedNumber: varchar("bed_number", { length: 20 }).notNull(),
  bedType: text("bed_type").notNull(), // standard, electric, icu, pediatric, bariatric
  dailyRateOverride: decimal("daily_rate_override", { precision: 10, scale: 2 }), // Override ward rate
  status: text("status").notNull().default("available"), // available, occupied, maintenance, reserved
  currentAdmissionId: varchar("current_admission_id"), // Will reference ipdAdmissions
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertBedSchema = createInsertSchema(beds).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBed = z.infer<typeof insertBedSchema>;
export type Bed = typeof beds.$inferSelect;

// IPD Admissions - inpatient admission records
export const ipdAdmissions = pgTable("ipd_admissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  personId: varchar("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  patientEncounterId: varchar("patient_encounter_id").references(() => patientFacilityEncounters.id, { onDelete: "set null" }),
  admissionNumber: varchar("admission_number", { length: 20 }).notNull(), // Facility-specific admission ID
  // Admission details
  admissionDate: timestamp("admission_date").notNull(),
  admissionTime: text("admission_time"),
  admissionType: text("admission_type").notNull(), // emergency, planned, transfer
  admissionReason: text("admission_reason"),
  chiefComplaint: text("chief_complaint"),
  provisionalDiagnosis: text("provisional_diagnosis"),
  // Bed assignment
  wardId: varchar("ward_id").references(() => wards.id, { onDelete: "set null" }),
  bedId: varchar("bed_id").references(() => beds.id, { onDelete: "set null" }),
  // Attending doctor
  attendingDoctorContextId: varchar("attending_doctor_context_id").references(() => personContexts.id, { onDelete: "set null" }),
  // Expected discharge
  expectedDischargeDate: timestamp("expected_discharge_date"),
  // Actual discharge
  dischargeDate: timestamp("discharge_date"),
  dischargeTime: text("discharge_time"),
  dischargeType: text("discharge_type"), // normal, lama, absconded, expired, transfer
  dischargeSummary: text("discharge_summary"),
  finalDiagnosis: text("final_diagnosis"),
  // Status
  status: text("status").notNull().default("admitted"), // admitted, discharged, transferred, expired
  // Insurance
  insuranceClaimId: varchar("insurance_claim_id"), // Will reference insurance claims
  // Billing
  totalBillAmount: decimal("total_bill_amount", { precision: 12, scale: 2 }),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }),
  // Metadata
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertIpdAdmissionSchema = createInsertSchema(ipdAdmissions).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  admissionDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  expectedDischargeDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  dischargeDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});
export type InsertIpdAdmission = z.infer<typeof insertIpdAdmissionSchema>;
export type IpdAdmission = typeof ipdAdmissions.$inferSelect;

// Daily Rounds - doctor rounds for admitted patients
export const dailyRounds = pgTable("daily_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  admissionId: varchar("admission_id").notNull().references(() => ipdAdmissions.id, { onDelete: "cascade" }),
  doctorContextId: varchar("doctor_context_id").notNull().references(() => personContexts.id, { onDelete: "cascade" }),
  roundDate: timestamp("round_date").notNull(),
  roundTime: text("round_time"),
  // Clinical notes
  subjective: text("subjective"), // Patient's complaints
  objective: text("objective"), // Examination findings
  assessment: text("assessment"), // Diagnosis/assessment
  plan: text("plan"), // Treatment plan
  vitalsRecorded: jsonb("vitals_recorded"), // Vitals at time of round
  // Orders
  medicationChanges: jsonb("medication_changes"),
  newInvestigations: jsonb("new_investigations"),
  specialInstructions: text("special_instructions"),
  // Status
  isUrgent: boolean("is_urgent").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertDailyRoundSchema = createInsertSchema(dailyRounds).omit({ id: true, createdAt: true }).extend({
  roundDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});
export type InsertDailyRound = z.infer<typeof insertDailyRoundSchema>;
export type DailyRound = typeof dailyRounds.$inferSelect;

// ========== OPERATING THEATRE (OT) MODULE ==========

// Operating Theatres - OT room definitions
export const operatingTheatres = pgTable("operating_theatres", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: varchar("code", { length: 10 }),
  theatreType: text("theatre_type").notNull(), // major, minor, cardiac, ortho, neuro, ophthalmic, ent
  capacity: text("capacity"), // Description of equipment/capacity
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertOperatingTheatreSchema = createInsertSchema(operatingTheatres).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOperatingTheatre = z.infer<typeof insertOperatingTheatreSchema>;
export type OperatingTheatre = typeof operatingTheatres.$inferSelect;

// Surgical Cases - OT scheduling and case tracking
export const surgicalCases = pgTable("surgical_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  personId: varchar("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  admissionId: varchar("admission_id").references(() => ipdAdmissions.id, { onDelete: "set null" }), // For inpatients
  theatreId: varchar("theatre_id").references(() => operatingTheatres.id, { onDelete: "set null" }),
  caseNumber: varchar("case_number", { length: 20 }).notNull(),
  // Surgery details
  procedureName: text("procedure_name").notNull(),
  procedureCode: varchar("procedure_code", { length: 20 }), // ICD/CPT code
  surgeryType: text("surgery_type").notNull(), // elective, emergency, day_case
  priority: text("priority").notNull().default("routine"), // routine, urgent, emergency
  // Scheduling
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledStartTime: text("scheduled_start_time"),
  estimatedDuration: integer("estimated_duration"), // Minutes
  // Actual times
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  // Team
  leadSurgeonContextId: varchar("lead_surgeon_context_id").references(() => personContexts.id, { onDelete: "set null" }),
  anesthetistContextId: varchar("anesthetist_context_id").references(() => personContexts.id, { onDelete: "set null" }),
  assistingSurgeons: jsonb("assisting_surgeons"), // Array of personContextIds
  scrubNurses: jsonb("scrub_nurses"), // Array of personContextIds
  // Pre-op
  preOpDiagnosis: text("pre_op_diagnosis"),
  preOpChecklist: jsonb("pre_op_checklist"), // Checklist items with status
  anesthesiaType: text("anesthesia_type"), // general, spinal, epidural, local
  // Post-op
  postOpDiagnosis: text("post_op_diagnosis"),
  operativeFindings: text("operative_findings"),
  procedureNotes: text("procedure_notes"),
  complications: text("complications"),
  bloodLossMl: integer("blood_loss_ml"),
  specimens: jsonb("specimens"), // Lab specimens collected
  // Status
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled, postponed
  cancellationReason: text("cancellation_reason"),
  // Billing
  surgeonFee: decimal("surgeon_fee", { precision: 10, scale: 2 }),
  anesthetistFee: decimal("anesthetist_fee", { precision: 10, scale: 2 }),
  theatreFee: decimal("theatre_fee", { precision: 10, scale: 2 }),
  consumablesCost: decimal("consumables_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }),
  // Metadata
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertSurgicalCaseSchema = createInsertSchema(surgicalCases).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  scheduledDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  actualStartTime: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  actualEndTime: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});
export type InsertSurgicalCase = z.infer<typeof insertSurgicalCaseSchema>;
export type SurgicalCase = typeof surgicalCases.$inferSelect;

// ========== INSURANCE MODULE ==========

// Insurance Providers - master list of insurance companies
export const insuranceProviders = pgTable("insurance_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }).unique(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: varchar("email"),
  address: text("address"),
  website: text("website"),
  claimSubmissionUrl: text("claim_submission_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertInsuranceProviderSchema = createInsertSchema(insuranceProviders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInsuranceProvider = z.infer<typeof insertInsuranceProviderSchema>;
export type InsuranceProvider = typeof insuranceProviders.$inferSelect;

// Insurance Policies - patient insurance policy details
export const insurancePolicies = pgTable("insurance_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personId: varchar("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id").notNull().references(() => insuranceProviders.id, { onDelete: "cascade" }),
  policyNumber: varchar("policy_number", { length: 50 }).notNull(),
  groupNumber: varchar("group_number", { length: 50 }),
  membershipType: text("membership_type"), // self, spouse, dependent
  relationToHolder: text("relation_to_holder"), // self, spouse, child, parent
  policyHolderName: text("policy_holder_name"),
  policyHolderCnic: varchar("policy_holder_cnic", { length: 15 }),
  // Coverage
  coverageStartDate: timestamp("coverage_start_date"),
  coverageEndDate: timestamp("coverage_end_date"),
  maxCoverageAmount: decimal("max_coverage_amount", { precision: 12, scale: 2 }),
  remainingCoverage: decimal("remaining_coverage", { precision: 12, scale: 2 }),
  copayPercentage: decimal("copay_percentage", { precision: 5, scale: 2 }),
  deductibleAmount: decimal("deductible_amount", { precision: 10, scale: 2 }),
  // Status
  isActive: boolean("is_active").notNull().default(true),
  verificationStatus: text("verification_status").default("pending"), // pending, verified, rejected
  verifiedAt: timestamp("verified_at"),
  // Metadata
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertInsurancePolicySchema = createInsertSchema(insurancePolicies).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  coverageStartDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  coverageEndDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});
export type InsertInsurancePolicy = z.infer<typeof insertInsurancePolicySchema>;
export type InsurancePolicy = typeof insurancePolicies.$inferSelect;

// Insurance Claims - claim processing
export const insuranceClaims = pgTable("insurance_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  policyId: varchar("policy_id").notNull().references(() => insurancePolicies.id, { onDelete: "cascade" }),
  personId: varchar("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  claimNumber: varchar("claim_number", { length: 30 }).notNull(),
  // Related records
  admissionId: varchar("admission_id").references(() => ipdAdmissions.id, { onDelete: "set null" }),
  surgicalCaseId: varchar("surgical_case_id").references(() => surgicalCases.id, { onDelete: "set null" }),
  // Claim details
  claimType: text("claim_type").notNull(), // opd, ipd, surgery, diagnostic, pharmacy
  serviceDate: timestamp("service_date").notNull(),
  diagnosisCodes: text("diagnosis_codes").array(), // ICD codes
  procedureCodes: text("procedure_codes").array(), // CPT codes
  // Amounts
  totalBillAmount: decimal("total_bill_amount", { precision: 12, scale: 2 }).notNull(),
  claimedAmount: decimal("claimed_amount", { precision: 12, scale: 2 }).notNull(),
  approvedAmount: decimal("approved_amount", { precision: 12, scale: 2 }),
  patientResponsibility: decimal("patient_responsibility", { precision: 12, scale: 2 }),
  // Pre-authorization
  requiresPreAuth: boolean("requires_pre_auth").default(false),
  preAuthNumber: varchar("pre_auth_number", { length: 30 }),
  preAuthStatus: text("pre_auth_status"), // pending, approved, denied
  preAuthApprovedAt: timestamp("pre_auth_approved_at"),
  // Claim workflow
  status: text("status").notNull().default("draft"), // draft, submitted, under_review, approved, partially_approved, denied, paid
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  denialReason: text("denial_reason"),
  // Payment
  paymentDate: timestamp("payment_date"),
  paymentReference: varchar("payment_reference", { length: 50 }),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }),
  // Documents
  supportingDocuments: jsonb("supporting_documents"), // Array of document URLs
  // Metadata
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertInsuranceClaimSchema = createInsertSchema(insuranceClaims).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  serviceDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  submittedAt: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
  paymentDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});
export type InsertInsuranceClaim = z.infer<typeof insertInsuranceClaimSchema>;
export type InsuranceClaim = typeof insuranceClaims.$inferSelect;

// ========== OPD VISIT TRACKING ==========

// OPD Visits - comprehensive OPD visit record linking all modules
export const opdVisits = pgTable("opd_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  personId: varchar("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  patientEncounterId: varchar("patient_encounter_id").references(() => patientFacilityEncounters.id, { onDelete: "set null" }),
  visitNumber: varchar("visit_number", { length: 20 }).notNull(), // Facility-specific visit ID
  visitDate: timestamp("visit_date").notNull(),
  // Queue
  queueTokenId: varchar("queue_token_id").references(() => queueTokens.id, { onDelete: "set null" }),
  // Doctor
  doctorContextId: varchar("doctor_context_id").references(() => personContexts.id, { onDelete: "set null" }),
  // Visit type
  visitType: text("visit_type").notNull().default("consultation"), // consultation, follow_up, procedure, emergency
  // Status workflow
  status: text("status").notNull().default("registered"), // registered, vitals_done, in_consultation, tests_ordered, tests_done, prescription_given, payment_pending, completed
  // Clinical
  chiefComplaint: text("chief_complaint"),
  vitalsId: varchar("vitals_id"), // Reference to patient vitals
  consultationId: varchar("consultation_id"), // Reference to consultation
  prescriptionId: varchar("prescription_id"), // Reference to prescription
  // Linked records
  labOrderIds: text("lab_order_ids").array(), // References to lab orders
  pharmacyDispenseIds: text("pharmacy_dispense_ids").array(), // References to pharmacy dispense
  // Billing
  invoiceId: varchar("invoice_id"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  paymentStatus: text("payment_status").default("pending"), // pending, partial, paid, waived
  // Follow-up
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  // Timing
  registeredAt: timestamp("registered_at").notNull().default(sql`now()`),
  consultationStartedAt: timestamp("consultation_started_at"),
  consultationEndedAt: timestamp("consultation_ended_at"),
  completedAt: timestamp("completed_at"),
  // Metadata
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertOpdVisitSchema = createInsertSchema(opdVisits).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  visitDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  followUpDate: z.string().or(z.date()).optional().nullable().transform(val => val && typeof val === 'string' ? new Date(val) : val),
});
export type InsertOpdVisit = z.infer<typeof insertOpdVisitSchema>;
export type OpdVisit = typeof opdVisits.$inferSelect;

// ========== MASTER DATA TABLES ==========

// 1.3 Medical Profession Master
export const medicalProfessions = pgTable("medical_professions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // clinical, administrative, technical, support
  requiresLicense: boolean("requires_license").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMedicalProfessionSchema = createInsertSchema(medicalProfessions).omit({ id: true, createdAt: true });
export type InsertMedicalProfession = z.infer<typeof insertMedicalProfessionSchema>;
export type MedicalProfession = typeof medicalProfessions.$inferSelect;

// 1.4 Qualification & Certification Master
export const qualifications = pgTable("qualifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(), // MBBS, FCPS, Pharm-D, etc.
  degreeType: text("degree_type").notNull(), // undergraduate, postgraduate, diploma, certificate
  certifyingBody: text("certifying_body"),
  country: text("country"),
  validityRequired: boolean("validity_required").default(false),
  renewalCycleMonths: integer("renewal_cycle_months"),
  applicableProfessions: text("applicable_professions").array(), // References profession codes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQualificationSchema = createInsertSchema(qualifications).omit({ id: true, createdAt: true });
export type InsertQualification = z.infer<typeof insertQualificationSchema>;
export type Qualification = typeof qualifications.$inferSelect;

// 2.3 Department Master
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  departmentType: text("department_type").notNull(), // opd, ipd, emergency, icu, pharmacy, laboratory, radiology, ot, finance, hr
  parentDepartmentId: varchar("parent_department_id"),
  headOfDepartment: varchar("head_of_department").references(() => users.id),
  costCenter: text("cost_center"),
  operatingHours: jsonb("operating_hours"), // { monday: {start: "09:00", end: "17:00"}, ... }
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

// 3.1 Service / Procedure Master (for billing, insurance, OT)
export const serviceProcedures = pgTable("service_procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(), // consultation, diagnostic, surgical, therapeutic, nursing
  departmentType: text("department_type"), // opd, ipd, ot, lab, radiology
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  taxable: boolean("taxable").default(true),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  insuranceEligible: boolean("insurance_eligible").default(true),
  insuranceCode: text("insurance_code"), // For insurance claims
  duration: integer("duration"), // Estimated duration in minutes
  requiresDoctor: boolean("requires_doctor").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceProcedureSchema = createInsertSchema(serviceProcedures).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertServiceProcedure = z.infer<typeof insertServiceProcedureSchema>;
export type ServiceProcedure = typeof serviceProcedures.$inferSelect;

// 3.2 Diagnosis Master (ICD-based)
export const diagnoses = pgTable("diagnoses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icdCode: text("icd_code").notNull().unique(), // ICD-10 or ICD-11 code
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // infectious, neoplasms, blood, endocrine, mental, nervous, etc.
  isChronic: boolean("is_chronic").default(false),
  severity: text("severity"), // mild, moderate, severe
  commonTests: text("common_tests").array(), // Suggested tests
  commonMedications: text("common_medications").array(), // Suggested medications
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDiagnosisSchema = createInsertSchema(diagnoses).omit({ id: true, createdAt: true });
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type Diagnosis = typeof diagnoses.$inferSelect;

// 3.3 Clinical Template Masters
export const clinicalTemplates = pgTable("clinical_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  facilityId: varchar("facility_id").references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  templateType: text("template_type").notNull(), // soap, prescription, discharge_summary, clinical_pathway, consent_form
  name: text("name").notNull(),
  specialty: text("specialty"), // Applicable specialty
  content: jsonb("content").notNull(), // Template structure/content
  variables: text("variables").array(), // Placeholders in template
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClinicalTemplateSchema = createInsertSchema(clinicalTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClinicalTemplate = z.infer<typeof insertClinicalTemplateSchema>;
export type ClinicalTemplate = typeof clinicalTemplates.$inferSelect;

// 3.4 Vital Types Master
export const vitalTypes = pgTable("vital_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  normalMin: decimal("normal_min", { precision: 10, scale: 2 }),
  normalMax: decimal("normal_max", { precision: 10, scale: 2 }),
  criticalMin: decimal("critical_min", { precision: 10, scale: 2 }),
  criticalMax: decimal("critical_max", { precision: 10, scale: 2 }),
  displayOrder: integer("display_order").default(0),
  isRequired: boolean("is_required").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVitalTypeSchema = createInsertSchema(vitalTypes).omit({ id: true, createdAt: true });
export type InsertVitalType = z.infer<typeof insertVitalTypeSchema>;
export type VitalType = typeof vitalTypes.$inferSelect;

// 4.1 Enhanced Test Master (Lab)
export const labTests = pgTable("lab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // hematology, biochemistry, microbiology, pathology, radiology
  sampleTypeId: varchar("sample_type_id").references(() => sampleTypes.id),
  normalRanges: jsonb("normal_ranges"), // { male: {min, max}, female: {min, max}, child: {min, max} }
  unit: text("unit"),
  turnaroundTime: integer("turnaround_time"), // TAT in hours
  price: decimal("price", { precision: 10, scale: 2 }),
  equipmentRequired: text("equipment_required").array(),
  instructions: text("instructions"),
  insuranceEligible: boolean("insurance_eligible").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLabTestSchema = createInsertSchema(labTests).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;
export type LabTest = typeof labTests.$inferSelect;

// 4.2 Sample Type Master
export const sampleTypes = pgTable("sample_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(), // blood, serum, urine, swab, tissue, stool, csf
  containerType: text("container_type"), // EDTA, plain, fluoride, etc.
  collectionInstructions: text("collection_instructions"),
  storageTemperature: text("storage_temperature"),
  maxStorageHours: integer("max_storage_hours"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSampleTypeSchema = createInsertSchema(sampleTypes).omit({ id: true, createdAt: true });
export type InsertSampleType = z.infer<typeof insertSampleTypeSchema>;
export type SampleType = typeof sampleTypes.$inferSelect;

// 4.3 Lab Equipment Master
export const labEquipment = pgTable("lab_equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").references(() => healthcareFacilities.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  manufacturer: text("manufacturer"),
  model: text("model"),
  serialNumber: text("serial_number"),
  purchaseDate: timestamp("purchase_date"),
  warrantyExpiry: timestamp("warranty_expiry"),
  lastCalibration: timestamp("last_calibration"),
  nextCalibration: timestamp("next_calibration"),
  calibrationCycleDays: integer("calibration_cycle_days"),
  supportedTests: text("supported_tests").array(),
  status: text("status").default("active"), // active, maintenance, out_of_order
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLabEquipmentSchema = createInsertSchema(labEquipment).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLabEquipment = z.infer<typeof insertLabEquipmentSchema>;
export type LabEquipment = typeof labEquipment.$inferSelect;

// 5.2 Batch & Expiry Master
export const medicineBatches = pgTable("medicine_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicineId: varchar("medicine_id").references(() => medicines.id, { onDelete: "cascade" }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "cascade" }),
  batchNumber: text("batch_number").notNull(),
  manufactureDate: timestamp("manufacture_date"),
  expiryDate: timestamp("expiry_date").notNull(),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }),
  quantityReceived: integer("quantity_received").notNull(),
  quantityRemaining: integer("quantity_remaining").notNull(),
  supplierId: varchar("supplier_id"),
  purchaseOrderId: varchar("purchase_order_id"),
  status: text("status").default("available"), // available, low_stock, expired, quarantine
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMedicineBatchSchema = createInsertSchema(medicineBatches).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMedicineBatch = z.infer<typeof insertMedicineBatchSchema>;
export type MedicineBatch = typeof medicineBatches.$inferSelect;

// 6.1 Doctor CRM Master (for MR module)
export const doctorCrmProfiles = pgTable("doctor_crm_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  personId: varchar("person_id").references(() => persons.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id").references(() => doctors.id),
  specialty: text("specialty"),
  clinicHospitalMapping: jsonb("clinic_hospital_mapping"), // Array of facility associations
  visitFrequency: text("visit_frequency"), // weekly, biweekly, monthly, quarterly
  preferredVisitDay: integer("preferred_visit_day"), // 0=Sunday, etc.
  preferredVisitTime: text("preferred_visit_time"),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }),
  prescribingBehavior: jsonb("prescribing_behavior"), // AI-generated insights
  lastVisitDate: timestamp("last_visit_date"),
  nextScheduledVisit: timestamp("next_scheduled_visit"),
  notes: text("notes"),
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDoctorCrmProfileSchema = createInsertSchema(doctorCrmProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDoctorCrmProfile = z.infer<typeof insertDoctorCrmProfileSchema>;
export type DoctorCrmProfile = typeof doctorCrmProfiles.$inferSelect;

// 6.2 Product Promotion Master
export const productPromotions = pgTable("product_promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }),
  campaignName: text("campaign_name").notNull(),
  targetSpecialties: text("target_specialties").array(),
  targetTerritories: text("target_territories").array(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  sampleLimit: integer("sample_limit"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  promotionalMaterials: jsonb("promotional_materials"), // URLs, descriptions
  kpis: jsonb("kpis"), // Target metrics
  status: text("status").default("draft"), // draft, active, completed, cancelled
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductPromotionSchema = createInsertSchema(productPromotions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProductPromotion = z.infer<typeof insertProductPromotionSchema>;
export type ProductPromotion = typeof productPromotions.$inferSelect;

// 6.3 Sales Target Master
export const salesTargets = pgTable("sales_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  roleType: text("role_type").notNull(), // mr, asm, rsm, zone_head
  productId: varchar("product_id").references(() => products.id),
  territory: text("territory"),
  targetType: text("target_type").notNull(), // quantity, value, visits, coverage
  targetValue: decimal("target_value", { precision: 12, scale: 2 }).notNull(),
  achievedValue: decimal("achieved_value", { precision: 12, scale: 2 }).default("0"),
  periodType: text("period_type").notNull(), // monthly, quarterly, yearly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  status: text("status").default("active"), // active, achieved, missed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSalesTargetSchema = createInsertSchema(salesTargets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSalesTarget = z.infer<typeof insertSalesTargetSchema>;
export type SalesTarget = typeof salesTargets.$inferSelect;

// 7.3 Leave Type Master
export const leaveTypes = pgTable("leave_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(), // casual, sick, annual, maternity, paternity, unpaid
  description: text("description"),
  defaultDays: integer("default_days").notNull(),
  carryForward: boolean("carry_forward").default(false),
  maxCarryForwardDays: integer("max_carry_forward_days"),
  encashable: boolean("encashable").default(false),
  requiresApproval: boolean("requires_approval").default(true),
  requiresDocument: boolean("requires_document").default(false),
  applicableGender: text("applicable_gender"), // null=all, male, female
  minServiceDays: integer("min_service_days"), // Minimum days of service required
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeaveTypeSchema = createInsertSchema(leaveTypes).omit({ id: true, createdAt: true });
export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;
export type LeaveType = typeof leaveTypes.$inferSelect;

// 8.2 Tax Master
export const taxMaster = pgTable("tax_master", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(), // GST, VAT, Sales Tax, etc.
  taxType: text("tax_type").notNull(), // goods, services, income, withholding
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  applicability: text("applicability"), // Description of when applicable
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  isCompound: boolean("is_compound").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaxMasterSchema = createInsertSchema(taxMaster).omit({ id: true, createdAt: true });
export type InsertTaxMaster = z.infer<typeof insertTaxMasterSchema>;
export type TaxMaster = typeof taxMaster.$inferSelect;

// 8.3 Payment Mode Master
export const paymentModes = pgTable("payment_modes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(), // cash, card, insurance, online, bank_transfer, cheque
  paymentType: text("payment_type").notNull(), // instant, deferred
  processingFee: decimal("processing_fee", { precision: 5, scale: 2 }),
  processingFeeType: text("processing_fee_type"), // percentage, fixed
  ledgerAccountId: varchar("ledger_account_id").references(() => ledgerAccounts.id),
  requiresReference: boolean("requires_reference").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentModeSchema = createInsertSchema(paymentModes).omit({ id: true, createdAt: true });
export type InsertPaymentMode = z.infer<typeof insertPaymentModeSchema>;
export type PaymentMode = typeof paymentModes.$inferSelect;

// 9.1 Insurance Company Master
export const insuranceCompanies = pgTable("insurance_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  companyType: text("company_type").notNull(), // health_insurance, life_insurance, tpa
  tpaName: text("tpa_name"), // Third Party Administrator
  tpaCode: text("tpa_code"),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: varchar("email"),
  address: text("address"),
  claimSubmissionUrl: text("claim_submission_url"),
  claimRules: jsonb("claim_rules"), // Pre-auth requirements, limits, etc.
  paymentTermsDays: integer("payment_terms_days"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInsuranceCompanySchema = createInsertSchema(insuranceCompanies).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInsuranceCompany = z.infer<typeof insertInsuranceCompanySchema>;
export type InsuranceCompany = typeof insuranceCompanies.$inferSelect;

// 10.2 Permission Master
export const permissionMaster = pgTable("permission_master", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  module: text("module").notNull(), // opd, ipd, lab, pharmacy, billing, hr, payroll, etc.
  screen: text("screen"), // Specific screen/page
  action: text("action").notNull(), // view, create, edit, delete, approve, export
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPermissionMasterSchema = createInsertSchema(permissionMaster).omit({ id: true, createdAt: true });
export type InsertPermissionMaster = z.infer<typeof insertPermissionMasterSchema>;
export type PermissionMaster = typeof permissionMaster.$inferSelect;

// 10.3 Audit Event Master
export const auditEventTypes = pgTable("audit_event_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // authentication, data_access, data_modification, system, compliance
  severity: text("severity").notNull(), // info, warning, critical
  retentionDays: integer("retention_days").notNull().default(365),
  requiresAlert: boolean("requires_alert").default(false),
  alertRecipients: text("alert_recipients").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditEventTypeSchema = createInsertSchema(auditEventTypes).omit({ id: true, createdAt: true });
export type InsertAuditEventType = z.infer<typeof insertAuditEventTypeSchema>;
export type AuditEventType = typeof auditEventTypes.$inferSelect;

// ==================== PHASE 3: PERMISSION SYSTEM ====================

// 10.4 Screens - Application screens/routes for permission mapping
export const screens = pgTable("screens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // unique identifier like "opd_dashboard", "patient_list"
  name: text("name").notNull(), // Display name like "OPD Dashboard"
  route: text("route").notNull(), // Frontend route like "/opd/dashboard"
  module: text("module").notNull(), // Module grouping: opd, ipd, lab, pharmacy, hr, payroll, admin, etc.
  description: text("description"),
  icon: text("icon"), // Lucide icon name for UI
  parentScreenId: varchar("parent_screen_id"), // For nested menu structure
  sortOrder: integer("sort_order").default(0),
  isMenuItem: boolean("is_menu_item").default(true), // Show in sidebar menu
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScreenSchema = createInsertSchema(screens).omit({ id: true, createdAt: true });
export type InsertScreen = z.infer<typeof insertScreenSchema>;
export type Screen = typeof screens.$inferSelect;

// 10.5 Screen Permissions - Link roles to screens with access levels
export const screenPermissions = pgTable("screen_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  screenId: varchar("screen_id").notNull().references(() => screens.id, { onDelete: "cascade" }),
  canView: boolean("can_view").default(false),
  canCreate: boolean("can_create").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  canExport: boolean("can_export").default(false),
  canApprove: boolean("can_approve").default(false),
  customActions: jsonb("custom_actions"), // Additional screen-specific actions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScreenPermissionSchema = createInsertSchema(screenPermissions).omit({ id: true, createdAt: true });
export type InsertScreenPermission = z.infer<typeof insertScreenPermissionSchema>;
export type ScreenPermission = typeof screenPermissions.$inferSelect;

// 10.6 User Permission Overrides - Per-user overrides by Super Admin/Company Admin
export const userPermissionOverrides = pgTable("user_permission_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  screenId: varchar("screen_id").notNull().references(() => screens.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  overrideType: text("override_type").notNull(), // "allow" or "deny"
  canView: boolean("can_view"),
  canCreate: boolean("can_create"),
  canEdit: boolean("can_edit"),
  canDelete: boolean("can_delete"),
  canExport: boolean("can_export"),
  canApprove: boolean("can_approve"),
  customActions: jsonb("custom_actions"),
  reason: text("reason"), // Why override was granted/revoked
  createdBy: varchar("created_by").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at"), // Optional expiration for temporary overrides
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPermissionOverrideSchema = createInsertSchema(userPermissionOverrides).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserPermissionOverride = z.infer<typeof insertUserPermissionOverrideSchema>;
export type UserPermissionOverride = typeof userPermissionOverrides.$inferSelect;

// 10.7 Organization Permission Overrides - Org-level restrictions by Super Admin
export const organizationPermissionOverrides = pgTable("organization_permission_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  screenId: varchar("screen_id").references(() => screens.id, { onDelete: "cascade" }), // Specific screen or null for module-level
  module: text("module"), // Module-level restriction (alternative to screenId)
  overrideType: text("override_type").notNull(), // "allow" or "deny"
  canView: boolean("can_view"),
  canCreate: boolean("can_create"),
  canEdit: boolean("can_edit"),
  canDelete: boolean("can_delete"),
  canExport: boolean("can_export"),
  canApprove: boolean("can_approve"),
  reason: text("reason"), // Why restriction was applied
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrganizationPermissionOverrideSchema = createInsertSchema(organizationPermissionOverrides).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrganizationPermissionOverride = z.infer<typeof insertOrganizationPermissionOverrideSchema>;
export type OrganizationPermissionOverride = typeof organizationPermissionOverrides.$inferSelect;
