import { 
  type User, 
  type InsertUser,
  type UpsertUser,
  type SalesEntry,
  type InsertSalesEntry,
  type CompanySettings,
  type InsertCompanySettings,
  type Doctor,
  type InsertDoctor,
  type Product,
  type InsertProduct,
  type ProductPriceHistory,
  type InsertProductPriceHistory,
  type Company,
  type InsertCompany,
  type DoctorVisit,
  type InsertDoctorVisit,
  type Expense,
  type InsertExpense,
  type CallKPI,
  type InsertCallKPI,
  type Specialty,
  type InsertSpecialty,
  type HealthcareFacility,
  type InsertHealthcareFacility,
  type HealthcareDoctor,
  type InsertHealthcareDoctor,
  type DoctorAvailability,
  type InsertDoctorAvailability,
  type Patient,
  type InsertPatient,
  type Appointment,
  type InsertAppointment,
  type QueueEntry,
  type InsertQueueEntry,
  type Payment,
  type InsertPayment,
  type PatientVitals,
  type InsertPatientVitals,
  type Consultation,
  type InsertConsultation,
  type Prescription,
  type InsertPrescription,
  type TestReport,
  type InsertTestReport,
  type ProductSample,
  type InsertProductSample,
  type SampleDistribution,
  type InsertSampleDistribution,
  type VisitRequest,
  type InsertVisitRequest,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type InsertSubscription,
  type RoutePlan,
  type InsertRoutePlan,
  type RoutePlanStop,
  type InsertRoutePlanStop,
  type SalesLead,
  type InsertSalesLead,
  type MRProfile,
  type InsertMRProfile,
  type PharmaCompanySettings,
  type InsertPharmaCompanySettings,
  type Organization,
  type InsertOrganization,
  type OrganizationType,
  type Warehouse,
  type InsertWarehouse,
  type StockItem,
  type InsertStockItem,
  type StockMovement,
  type InsertStockMovement,
  type DoctorPayrollRecord,
  type InsertDoctorPayrollRecord,
  type DoctorExpenditure,
  type InsertDoctorExpenditure,
  type Person,
  type InsertPerson,
  type PersonContext,
  type InsertPersonContext,
  type QueueDefinition,
  type InsertQueueDefinition,
  type QueueDayState,
  type InsertQueueDayState,
  type QueueToken,
  type InsertQueueToken,
  type LabOrder,
  type InsertLabOrder,
  type LabOrderItem,
  type InsertLabOrderItem,
  type LabResult,
  type InsertLabResult,
  type LabReport,
  type InsertLabReport,
  type Medicine,
  type InsertMedicine,
  type MedicineStockLedger,
  type InsertMedicineStockLedger,
  type PrescriptionOrder,
  type InsertPrescriptionOrder,
  type DispenseEvent,
  type InsertDispenseEvent,
  type DataTransferRequest,
  type InsertDataTransferRequest,
  type AuditLog,
  type InsertAuditLog,
  type PayslipTemplate,
  type InsertPayslipTemplate,
  type AttendanceSource,
  type InsertAttendanceSource,
  type ShiftDefinition,
  type InsertShiftDefinition,
  type ShiftAssignment,
  type InsertShiftAssignment,
  type OvertimeRule,
  type InsertOvertimeRule,
  type AttendanceLog,
  type InsertAttendanceLog,
  type AttendanceException,
  type InsertAttendanceException,
  type SalaryStructure,
  type InsertSalaryStructure,
  type SalaryComponent,
  type InsertSalaryComponent,
  type PayrollRun,
  type InsertPayrollRun,
  type Payslip,
  type InsertPayslip,
  type PayslipItem,
  type InsertPayslipItem,
  type LedgerAccount,
  type InsertLedgerAccount,
  type JournalEntry,
  type InsertJournalEntry,
  type JournalLine,
  type InsertJournalLine,
  type PakistanTaxSlab,
  type InsertPakistanTaxSlab,
  type OrganizationHRSettings,
  type InsertOrganizationHRSettings,
  type FacilityBillingConfig,
  type InsertFacilityBillingConfig,
  type PatientInvoice,
  type InsertPatientInvoice,
  users,
  salesEntries,
  companySettings,
  doctors,
  products,
  productPriceHistory,
  companies,
  doctorVisits,
  expenses,
  callKPIs,
  healthcareFacilities,
  healthcareDoctors,
  doctorAvailability,
  patients,
  appointments,
  queueEntries,
  payments,
  patientVitals,
  consultations,
  prescriptions,
  testReports,
  productSamples,
  sampleDistributions,
  visitRequests,
  subscriptionPlans,
  subscriptions,
  routePlans,
  salesLeads,
  mrProfiles,
  pharmaCompanySettings,
  routePlanStops,
  organizations,
  warehouses,
  stockItems,
  stockMovements,
  doctorPayrollRecords,
  doctorExpenditures,
  persons,
  personContexts,
  queueDefinitions,
  queueDayStates,
  queueTokens,
  labOrders,
  labOrderItems,
  labResults,
  labReports,
  medicines,
  medicineStockLedger,
  prescriptionOrders,
  dispenseEvents,
  dataTransferRequests,
  auditLogs,
  payslipTemplates,
  attendanceSources,
  shiftDefinitions,
  shiftAssignments,
  overtimeRules,
  attendanceLogs,
  attendanceExceptions,
  salaryStructures,
  salaryComponents,
  payrollRuns,
  payslips,
  payslipItems,
  ledgerAccounts,
  journalEntries,
  journalLines,
  pakistanTaxSlabs,
  organizationHRSettings,
  specialties,
  opdVisits,
  patientFacilityEncounters,
  facilityBillingConfig,
  patientInvoices,
  wards,
  beds,
  ipdAdmissions,
  operatingTheatres,
  surgicalCases,
  insuranceProviders,
  insurancePolicies,
  insuranceClaims,
  organizationTypes,
  facilityDepartments,
  type FacilityDepartment,
  type InsertFacilityDepartment,
  departmentRoles,
  type DepartmentRole,
  type InsertDepartmentRole,
  screens,
  type Screen,
  type InsertScreen,
  screenPermissions,
  type ScreenPermission,
  type InsertScreenPermission,
  userPermissionOverrides,
  type UserPermissionOverride,
  type InsertUserPermissionOverride,
  organizationPermissionOverrides,
  type OrganizationPermissionOverride,
  type InsertOrganizationPermissionOverride,
  prescriptionMedicines,
  type PrescriptionMedicine,
  type InsertPrescriptionMedicine,
  medicalInstructionsDict,
  type MedicalInstruction,
  type InsertMedicalInstruction,
  doctorPharmaCommitments,
  type DoctorPharmaCommitment,
  type InsertDoctorPharmaCommitment,
  modules,
  type Module,
  type InsertModule,
  companyModules,
  type CompanyModule,
  type InsertCompanyModule
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, gte, lte, desc, like, or, isNull, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Raw SQL query method for master data endpoints (with optional params for safe queries)
  query(sql: string, params?: any[]): Promise<{ rows: any[] }>;
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(searchTerm?: string, companyId?: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateLastLogin(id: string): Promise<void>;

  // Company methods
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  // Organization methods
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;
  
  // Organization type methods
  getOrganizationTypes(): Promise<OrganizationType[]>;
  getOrganizationTypeById(id: string): Promise<OrganizationType | undefined>;

  // Sales entry methods
  createSalesEntry(entry: InsertSalesEntry): Promise<SalesEntry>;
  getSalesEntries(userId?: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  getSalesEntryById(id: string): Promise<SalesEntry | undefined>;
  updateSalesEntry(id: string, entry: Partial<InsertSalesEntry>): Promise<SalesEntry | undefined>;
  deleteSalesEntry(id: string): Promise<boolean>;

  // Company settings methods
  getCompanySettings(): Promise<CompanySettings | undefined>;
  upsertCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;

  // Doctor methods
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  getDoctors(userId?: string): Promise<Doctor[]>;
  getDoctorsWithPerson(userId?: string): Promise<Array<Doctor & { person?: Person }>>;
  getDoctorById(id: string): Promise<Doctor | undefined>;
  getDoctorByEmail(email: string, userId: string): Promise<Doctor | undefined>;
  updateDoctor(id: string, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined>;
  deleteDoctor(id: string): Promise<boolean>;

  // Product methods
  createProduct(product: InsertProduct): Promise<Product>;
  getProducts(userId?: string, organizationId?: string): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductsByOrganization(organizationId: string): Promise<Product[]>;
  searchProducts(query: string, organizationId?: string): Promise<Product[]>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Product price history methods
  createProductPriceHistory(history: InsertProductPriceHistory): Promise<ProductPriceHistory>;
  getProductPriceHistory(productId: string): Promise<ProductPriceHistory[]>;

  // Doctor visit methods
  createDoctorVisit(visit: InsertDoctorVisit): Promise<DoctorVisit>;
  getDoctorVisits(userId?: string, doctorId?: string): Promise<any[]>;
  getDoctorVisitById(id: string): Promise<DoctorVisit | undefined>;
  updateDoctorVisit(id: string, visit: Partial<InsertDoctorVisit>): Promise<DoctorVisit | undefined>;
  getActiveDoctorVisit(userId: string): Promise<DoctorVisit | undefined>;
  punchOut(id: string, punchOutData: { punchOutTime: Date; punchOutLatitude?: string | null; punchOutLongitude?: string | null; duration: number }): Promise<DoctorVisit | undefined>;

  // Expense methods
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpenses(userId?: string, startDate?: Date, endDate?: Date): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | undefined>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // Call KPI methods
  createCallKPI(kpi: InsertCallKPI): Promise<CallKPI>;
  getCallKPIs(userId?: string, startDate?: Date, endDate?: Date): Promise<CallKPI[]>;
  getCallKPIById(id: string): Promise<CallKPI | undefined>;
  getCallKPIByDate(userId: string, date: Date): Promise<CallKPI | undefined>;
  updateCallKPI(id: string, kpi: Partial<InsertCallKPI>): Promise<CallKPI | undefined>;
  deleteCallKPI(id: string): Promise<boolean>;

  // ========== Hospital/Clinic Methods ==========
  
  // Healthcare facility methods
  createHealthcareFacility(facility: InsertHealthcareFacility): Promise<HealthcareFacility>;
  getHealthcareFacilities(companyId?: string): Promise<HealthcareFacility[]>;
  getHealthcareFacilityById(id: string): Promise<HealthcareFacility | undefined>;
  updateHealthcareFacility(id: string, facility: Partial<InsertHealthcareFacility>): Promise<HealthcareFacility | undefined>;
  deleteHealthcareFacility(id: string): Promise<boolean>;

  // Facility department methods
  createFacilityDepartment(dept: InsertFacilityDepartment): Promise<FacilityDepartment>;
  getFacilityDepartments(facilityId: string): Promise<FacilityDepartment[]>;
  getFacilityDepartmentById(id: string): Promise<FacilityDepartment | undefined>;
  updateFacilityDepartment(id: string, dept: Partial<InsertFacilityDepartment>): Promise<FacilityDepartment | undefined>;
  deleteFacilityDepartment(id: string): Promise<boolean>;

  // Department role methods
  createDepartmentRole(role: InsertDepartmentRole): Promise<DepartmentRole>;
  getDepartmentRoles(departmentId: string): Promise<DepartmentRole[]>;
  getDepartmentRoleById(id: string): Promise<DepartmentRole | undefined>;
  updateDepartmentRole(id: string, role: Partial<InsertDepartmentRole>): Promise<DepartmentRole | undefined>;
  deleteDepartmentRole(id: string): Promise<boolean>;

  // Healthcare doctor methods
  createHealthcareDoctor(doctor: InsertHealthcareDoctor): Promise<HealthcareDoctor>;
  getHealthcareDoctors(facilityId?: string): Promise<HealthcareDoctor[]>;
  getHealthcareDoctorsWithPerson(facilityId?: string): Promise<Array<HealthcareDoctor & { person?: Person }>>;
  getHealthcareDoctorById(id: string): Promise<HealthcareDoctor | undefined>;
  updateHealthcareDoctor(id: string, doctor: Partial<InsertHealthcareDoctor>): Promise<HealthcareDoctor | undefined>;
  deleteHealthcareDoctor(id: string): Promise<boolean>;

  // Doctor availability methods
  createDoctorAvailability(availability: InsertDoctorAvailability): Promise<DoctorAvailability>;
  getDoctorAvailability(doctorId: string): Promise<DoctorAvailability[]>;
  getDoctorAvailabilityById(id: string): Promise<DoctorAvailability | undefined>;
  updateDoctorAvailability(id: string, availability: Partial<InsertDoctorAvailability>): Promise<DoctorAvailability | undefined>;
  deleteDoctorAvailability(id: string): Promise<boolean>;

  // Patient methods
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatients(facilityId?: string, searchTerm?: string): Promise<Patient[]>;
  getPatientById(id: string): Promise<Patient | undefined>;
  getPatientByNumber(facilityId: string, patientNumber: string): Promise<Patient | undefined>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;

  // Appointment methods
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointments(facilityId?: string, doctorId?: string, startDate?: Date, endDate?: Date): Promise<Appointment[]>;
  getAppointmentById(id: string): Promise<Appointment | undefined>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;

  // Queue entry methods
  createQueueEntry(queue: InsertQueueEntry): Promise<QueueEntry>;
  getQueueEntries(facilityId?: string, doctorId?: string, date?: Date): Promise<QueueEntry[]>;
  getQueueEntryById(id: string): Promise<QueueEntry | undefined>;
  updateQueueEntry(id: string, queue: Partial<InsertQueueEntry>): Promise<QueueEntry | undefined>;
  getNextQueueNumber(facilityId: string, doctorId: string, date: Date): Promise<number>;

  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayments(facilityId?: string, patientId?: string, startDate?: Date, endDate?: Date): Promise<Payment[]>;
  getPaymentById(id: string): Promise<Payment | undefined>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;

  // Patient vitals methods
  createPatientVitals(vitals: InsertPatientVitals): Promise<PatientVitals>;
  getPatientVitals(patientId?: string, queueEntryId?: string): Promise<PatientVitals[]>;
  getPatientVitalsById(id: string): Promise<PatientVitals | undefined>;
  updatePatientVitals(id: string, vitals: Partial<InsertPatientVitals>): Promise<PatientVitals | undefined>;

  // Consultation methods
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  getConsultations(facilityId?: string, patientId?: string, doctorId?: string): Promise<Consultation[]>;
  getConsultationById(id: string): Promise<Consultation | undefined>;
  updateConsultation(id: string, consultation: Partial<InsertConsultation>): Promise<Consultation | undefined>;

  // Prescription methods
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getPrescriptions(patientId?: string, consultationId?: string): Promise<Prescription[]>;
  getPrescriptionById(id: string): Promise<Prescription | undefined>;
  updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;

  // Prescription medicines methods (normalized for cross-org analytics)
  createPrescriptionMedicine(medicine: InsertPrescriptionMedicine): Promise<PrescriptionMedicine>;
  getPrescriptionMedicines(prescriptionId: string): Promise<PrescriptionMedicine[]>;
  getPrescriptionMedicinesByProduct(pharmaProductId: string): Promise<PrescriptionMedicine[]>;

  // Test report methods
  createTestReport(report: InsertTestReport): Promise<TestReport>;
  getTestReports(patientId?: string, consultationId?: string): Promise<TestReport[]>;
  getTestReportById(id: string): Promise<TestReport | undefined>;
  updateTestReport(id: string, report: Partial<InsertTestReport>): Promise<TestReport | undefined>;
  deleteTestReport(id: string): Promise<boolean>;

  // ========== Pharma & MR Module Methods ==========

  // Product sample methods
  createProductSample(sample: InsertProductSample): Promise<ProductSample>;
  getProductSamples(productId?: string, companyId?: string): Promise<ProductSample[]>;
  getProductSampleById(id: string): Promise<ProductSample | undefined>;
  updateProductSample(id: string, sample: Partial<InsertProductSample>): Promise<ProductSample | undefined>;
  deleteProductSample(id: string): Promise<boolean>;

  // Sample distribution methods
  createSampleDistribution(distribution: InsertSampleDistribution): Promise<SampleDistribution>;
  getSampleDistributions(userId?: string, doctorId?: string): Promise<SampleDistribution[]>;
  getSampleDistributionById(id: string): Promise<SampleDistribution | undefined>;

  // Visit request methods
  createVisitRequest(request: InsertVisitRequest): Promise<VisitRequest>;
  getVisitRequests(userId?: string, doctorId?: string, status?: string): Promise<VisitRequest[]>;
  getVisitRequestById(id: string): Promise<VisitRequest | undefined>;
  updateVisitRequest(id: string, request: Partial<InsertVisitRequest>): Promise<VisitRequest | undefined>;

  // Subscription plan methods
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | undefined>;
  updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: string): Promise<boolean>;

  // Subscription methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptions(userId?: string, companyId?: string): Promise<Subscription[]>;
  getSubscriptionById(id: string): Promise<Subscription | undefined>;
  updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: string): Promise<boolean>;

  // Route plan methods
  createRoutePlan(plan: InsertRoutePlan): Promise<RoutePlan>;
  getRoutePlans(userId?: string, startDate?: Date, endDate?: Date): Promise<RoutePlan[]>;
  getRoutePlanById(id: string): Promise<RoutePlan | undefined>;
  updateRoutePlan(id: string, plan: Partial<InsertRoutePlan>): Promise<RoutePlan | undefined>;
  deleteRoutePlan(id: string): Promise<boolean>;

  // Route plan stop methods
  createRoutePlanStop(stop: InsertRoutePlanStop): Promise<RoutePlanStop>;
  getRoutePlanStops(routePlanId: string): Promise<RoutePlanStop[]>;
  getRoutePlanStopById(id: string): Promise<RoutePlanStop | undefined>;
  updateRoutePlanStop(id: string, stop: Partial<InsertRoutePlanStop>): Promise<RoutePlanStop | undefined>;
  deleteRoutePlanStop(id: string): Promise<boolean>;

  // ========== Inventory Management Methods ==========

  // Warehouse methods
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  getWarehouses(organizationId?: string, facilityId?: string): Promise<Warehouse[]>;
  getWarehouseById(id: string): Promise<Warehouse | undefined>;
  updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  deleteWarehouse(id: string): Promise<boolean>;

  // Stock item methods
  createStockItem(item: InsertStockItem): Promise<StockItem>;
  getStockItems(warehouseId?: string, category?: string): Promise<StockItem[]>;
  getStockItemById(id: string): Promise<StockItem | undefined>;
  getStockItemByCode(warehouseId: string, itemCode: string): Promise<StockItem | undefined>;
  updateStockItem(id: string, item: Partial<InsertStockItem>): Promise<StockItem | undefined>;
  deleteStockItem(id: string): Promise<boolean>;
  getLowStockItems(warehouseId?: string): Promise<StockItem[]>;
  getExpiringItems(warehouseId?: string, daysUntilExpiry?: number): Promise<StockItem[]>;

  // Stock movement methods
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  getStockMovements(stockItemId?: string, warehouseId?: string, startDate?: Date, endDate?: Date): Promise<StockMovement[]>;
  getStockMovementById(id: string): Promise<StockMovement | undefined>;

  // ========== Doctor Payroll Methods ==========

  // Doctor payroll record methods
  createDoctorPayrollRecord(record: InsertDoctorPayrollRecord): Promise<DoctorPayrollRecord>;
  getDoctorPayrollRecords(facilityId?: string, doctorId?: string, status?: string): Promise<any[]>;
  getDoctorPayrollRecordById(id: string): Promise<DoctorPayrollRecord | undefined>;
  updateDoctorPayrollRecord(id: string, record: Partial<InsertDoctorPayrollRecord>): Promise<DoctorPayrollRecord | undefined>;
  deleteDoctorPayrollRecord(id: string): Promise<boolean>;
  calculateDoctorEarnings(doctorId: string, startDate: Date, endDate: Date): Promise<{
    totalPatients: number;
    patientFeeEarnings: string;
    consultationRevenue: string;
    commissionEarnings: string;
  }>;

  // ========== Doctor Expenditure Methods ==========

  // Doctor expenditure methods
  createDoctorExpenditure(expenditure: InsertDoctorExpenditure): Promise<DoctorExpenditure>;
  getDoctorExpenditures(userId?: string, doctorId?: string, organizationId?: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  getDoctorExpenditureById(id: string): Promise<DoctorExpenditure | undefined>;
  updateDoctorExpenditure(id: string, expenditure: Partial<InsertDoctorExpenditure>): Promise<DoctorExpenditure | undefined>;
  deleteDoctorExpenditure(id: string): Promise<boolean>;
  getDoctorExpenditureSummary(doctorId?: string, organizationId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalAmount: string;
    byCategory: Record<string, string>;
  }>;

  // ========== Centralized Person Master Methods ==========
  
  // Person methods
  createPerson(person: InsertPerson): Promise<Person>;
  getPersons(organizationId?: string, searchTerm?: string): Promise<Person[]>;
  getPersonById(id: string): Promise<Person | undefined>;
  getPersonByCnic(cnic: string): Promise<Person | undefined>;
  getPersonByPhone(phone: string): Promise<Person | undefined>;
  findOrCreatePerson(data: { cnic?: string; phone?: string; firstName: string; lastName?: string; createdBy?: string }): Promise<Person>;
  updatePerson(id: string, person: Partial<InsertPerson>): Promise<Person | undefined>;
  deletePerson(id: string): Promise<boolean>;

  // Person context methods
  createPersonContext(context: InsertPersonContext): Promise<PersonContext>;
  getPersonContexts(personId?: string, organizationId?: string, roleType?: string): Promise<PersonContext[]>;
  getPersonContextById(id: string): Promise<PersonContext | undefined>;
  updatePersonContext(id: string, context: Partial<InsertPersonContext>): Promise<PersonContext | undefined>;
  terminatePersonContext(id: string, terminationDate: Date, terminationReason: string): Promise<PersonContext | undefined>;
  
  // Get persons with their role context (joined data)
  getPersonsWithRole(organizationId: string, roleType: string): Promise<Array<Person & { context: PersonContext }>>;

  // ========== Queue Management Methods ==========

  // Queue definition methods
  createQueueDefinition(definition: InsertQueueDefinition): Promise<QueueDefinition>;
  getQueueDefinitions(organizationId?: string, facilityId?: string): Promise<QueueDefinition[]>;
  getQueueDefinitionById(id: string): Promise<QueueDefinition | undefined>;
  updateQueueDefinition(id: string, definition: Partial<InsertQueueDefinition>): Promise<QueueDefinition | undefined>;
  deleteQueueDefinition(id: string): Promise<boolean>;

  // Queue day state methods
  getOrCreateQueueDayState(queueDefinitionId: string, queueDate: Date): Promise<QueueDayState>;
  getQueueDayStateById(id: string): Promise<QueueDayState | undefined>;
  updateQueueDayState(id: string, state: Partial<InsertQueueDayState>): Promise<QueueDayState | undefined>;

  // Queue token methods
  issueQueueToken(token: InsertQueueToken): Promise<QueueToken>;
  getQueueTokens(queueDayStateId?: string, status?: string): Promise<QueueToken[]>;
  getQueueTokenById(id: string): Promise<QueueToken | undefined>;
  updateQueueToken(id: string, token: Partial<InsertQueueToken>): Promise<QueueToken | undefined>;
  callNextToken(queueDayStateId: string, calledBy: string): Promise<QueueToken | undefined>;

  // ========== Lab Module Methods ==========

  // Lab order methods
  createLabOrder(order: InsertLabOrder): Promise<LabOrder>;
  getLabOrders(labOrganizationId?: string, patientPersonId?: string, status?: string): Promise<LabOrder[]>;
  getLabOrderById(id: string): Promise<LabOrder | undefined>;
  updateLabOrder(id: string, order: Partial<InsertLabOrder>): Promise<LabOrder | undefined>;

  // Lab order item methods
  createLabOrderItem(item: InsertLabOrderItem): Promise<LabOrderItem>;
  getLabOrderItems(labOrderId: string): Promise<LabOrderItem[]>;
  getLabOrderItemById(id: string): Promise<LabOrderItem | undefined>;
  updateLabOrderItem(id: string, item: Partial<InsertLabOrderItem>): Promise<LabOrderItem | undefined>;

  // Lab result methods
  createLabResult(result: InsertLabResult): Promise<LabResult>;
  getLabResultById(id: string): Promise<LabResult | undefined>;
  updateLabResult(id: string, result: Partial<InsertLabResult>): Promise<LabResult | undefined>;

  // Lab report methods
  createLabReport(report: InsertLabReport): Promise<LabReport>;
  getLabReports(labOrderId?: string, patientPersonId?: string): Promise<LabReport[]>;
  getLabReportById(id: string): Promise<LabReport | undefined>;
  updateLabReport(id: string, report: Partial<InsertLabReport>): Promise<LabReport | undefined>;

  // ========== Medical Store / Pharmacy Methods ==========

  // Medicine methods
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  getMedicines(organizationId?: string, searchTerm?: string): Promise<Medicine[]>;
  getMedicineById(id: string): Promise<Medicine | undefined>;
  updateMedicine(id: string, medicine: Partial<InsertMedicine>): Promise<Medicine | undefined>;
  deleteMedicine(id: string): Promise<boolean>;

  // Medicine stock ledger methods
  createMedicineStockEntry(entry: InsertMedicineStockLedger): Promise<MedicineStockLedger>;
  getMedicineStockLedger(medicineId?: string, organizationId?: string): Promise<MedicineStockLedger[]>;
  getMedicineCurrentStock(medicineId: string, organizationId: string): Promise<number>;

  // Prescription order methods
  createPrescriptionOrder(order: InsertPrescriptionOrder): Promise<PrescriptionOrder>;
  getPrescriptionOrders(organizationId?: string, patientPersonId?: string, status?: string): Promise<PrescriptionOrder[]>;
  getPrescriptionOrderById(id: string): Promise<PrescriptionOrder | undefined>;
  updatePrescriptionOrder(id: string, order: Partial<InsertPrescriptionOrder>): Promise<PrescriptionOrder | undefined>;

  // Dispense event methods
  createDispenseEvent(event: InsertDispenseEvent): Promise<DispenseEvent>;
  getDispenseEvents(prescriptionOrderId: string): Promise<DispenseEvent[]>;

  // ========== Billing / Invoice Methods ==========
  
  // Facility billing config methods
  getFacilityBillingConfig(organizationId: string): Promise<FacilityBillingConfig | undefined>;
  upsertFacilityBillingConfig(config: InsertFacilityBillingConfig): Promise<FacilityBillingConfig>;
  
  // Patient invoice methods
  createPatientInvoice(invoice: InsertPatientInvoice): Promise<PatientInvoice>;
  getPatientInvoices(organizationId?: string, personId?: string, status?: string): Promise<PatientInvoice[]>;
  getPatientInvoiceById(id: string): Promise<PatientInvoice | undefined>;
  updatePatientInvoice(id: string, invoice: Partial<InsertPatientInvoice>): Promise<PatientInvoice | undefined>;
  getNextInvoiceNumber(organizationId: string): Promise<string>;

  // ========== Data Transfer Governance Methods ==========

  // Data transfer request methods
  createDataTransferRequest(request: InsertDataTransferRequest): Promise<DataTransferRequest>;
  getDataTransferRequests(requestedBy?: string, status?: string): Promise<DataTransferRequest[]>;
  getDataTransferRequestById(id: string): Promise<DataTransferRequest | undefined>;
  updateDataTransferRequest(id: string, request: Partial<InsertDataTransferRequest>): Promise<DataTransferRequest | undefined>;
  approveDataTransferRequest(id: string, reviewedBy: string, reviewNotes?: string): Promise<DataTransferRequest | undefined>;
  rejectDataTransferRequest(id: string, reviewedBy: string, rejectionReason: string): Promise<DataTransferRequest | undefined>;

  // ========== Audit Log Methods ==========

  // Audit log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(actorUserId?: string, targetType?: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]>;

  // ========== HR/Payroll/Accounts Methods ==========

  // Payslip template methods
  createPayslipTemplate(template: InsertPayslipTemplate): Promise<PayslipTemplate>;
  getPayslipTemplates(organizationId?: string, isActive?: boolean): Promise<PayslipTemplate[]>;
  getPayslipTemplateById(id: string): Promise<PayslipTemplate | undefined>;
  updatePayslipTemplate(id: string, template: Partial<InsertPayslipTemplate>): Promise<PayslipTemplate | undefined>;
  deletePayslipTemplate(id: string): Promise<boolean>;
  createPayslipTemplateVersion(id: string, template: Partial<InsertPayslipTemplate>): Promise<PayslipTemplate>;

  // Attendance source methods
  createAttendanceSource(source: InsertAttendanceSource): Promise<AttendanceSource>;
  getAttendanceSources(organizationId?: string, isActive?: boolean): Promise<AttendanceSource[]>;
  getAttendanceSourceById(id: string): Promise<AttendanceSource | undefined>;
  updateAttendanceSource(id: string, source: Partial<InsertAttendanceSource>): Promise<AttendanceSource | undefined>;
  deleteAttendanceSource(id: string): Promise<boolean>;

  // Shift definition methods
  createShiftDefinition(shift: InsertShiftDefinition): Promise<ShiftDefinition>;
  getShiftDefinitions(organizationId?: string, isActive?: boolean): Promise<ShiftDefinition[]>;
  getShiftDefinitionById(id: string): Promise<ShiftDefinition | undefined>;
  updateShiftDefinition(id: string, shift: Partial<InsertShiftDefinition>): Promise<ShiftDefinition | undefined>;
  deleteShiftDefinition(id: string): Promise<boolean>;

  // Shift assignment methods
  createShiftAssignment(assignment: InsertShiftAssignment): Promise<ShiftAssignment>;
  getShiftAssignments(personContextId?: string, shiftId?: string): Promise<ShiftAssignment[]>;
  getShiftAssignmentById(id: string): Promise<ShiftAssignment | undefined>;
  updateShiftAssignment(id: string, assignment: Partial<InsertShiftAssignment>): Promise<ShiftAssignment | undefined>;

  // Overtime rule methods
  createOvertimeRule(rule: InsertOvertimeRule): Promise<OvertimeRule>;
  getOvertimeRules(organizationId?: string, isActive?: boolean): Promise<OvertimeRule[]>;
  getOvertimeRuleById(id: string): Promise<OvertimeRule | undefined>;
  updateOvertimeRule(id: string, rule: Partial<InsertOvertimeRule>): Promise<OvertimeRule | undefined>;
  deleteOvertimeRule(id: string): Promise<boolean>;

  // Attendance log methods
  createAttendanceLog(log: InsertAttendanceLog): Promise<AttendanceLog>;
  getAttendanceLogs(organizationId?: string, personId?: string, startDate?: Date, endDate?: Date): Promise<AttendanceLog[]>;
  getAttendanceLogById(id: string): Promise<AttendanceLog | undefined>;
  updateAttendanceLog(id: string, log: Partial<InsertAttendanceLog>): Promise<AttendanceLog | undefined>;
  normalizeAttendanceLog(id: string, shiftId: string): Promise<AttendanceLog | undefined>;

  // Attendance exception methods
  createAttendanceException(exception: InsertAttendanceException): Promise<AttendanceException>;
  getAttendanceExceptions(organizationId?: string, personId?: string, status?: string): Promise<AttendanceException[]>;
  getAttendanceExceptionById(id: string): Promise<AttendanceException | undefined>;
  updateAttendanceException(id: string, exception: Partial<InsertAttendanceException>): Promise<AttendanceException | undefined>;

  // Salary structure methods
  createSalaryStructure(structure: InsertSalaryStructure): Promise<SalaryStructure>;
  getSalaryStructures(organizationId?: string, personContextId?: string, isActive?: boolean): Promise<SalaryStructure[]>;
  getSalaryStructureById(id: string): Promise<SalaryStructure | undefined>;
  updateSalaryStructure(id: string, structure: Partial<InsertSalaryStructure>): Promise<SalaryStructure | undefined>;
  getActiveSalaryStructure(personContextId: string): Promise<SalaryStructure | undefined>;

  // Salary component methods
  createSalaryComponent(component: InsertSalaryComponent): Promise<SalaryComponent>;
  getSalaryComponents(salaryStructureId: string): Promise<SalaryComponent[]>;
  getSalaryComponentById(id: string): Promise<SalaryComponent | undefined>;
  updateSalaryComponent(id: string, component: Partial<InsertSalaryComponent>): Promise<SalaryComponent | undefined>;
  deleteSalaryComponent(id: string): Promise<boolean>;

  // Payroll run methods
  createPayrollRun(run: InsertPayrollRun): Promise<PayrollRun>;
  getPayrollRuns(organizationId?: string, status?: string, fiscalYear?: string): Promise<PayrollRun[]>;
  getPayrollRunById(id: string): Promise<PayrollRun | undefined>;
  updatePayrollRun(id: string, run: Partial<InsertPayrollRun>): Promise<PayrollRun | undefined>;
  calculatePayrollRun(id: string, calculatedBy: string): Promise<PayrollRun | undefined>;
  approvePayrollRun(id: string, approvedBy: string): Promise<PayrollRun | undefined>;
  finalizePayrollRun(id: string, finalizedBy: string): Promise<PayrollRun | undefined>;

  // Payslip methods
  createPayslip(payslip: InsertPayslip): Promise<Payslip>;
  getPayslips(payrollRunId?: string, personId?: string): Promise<Payslip[]>;
  getPayslipById(id: string): Promise<Payslip | undefined>;
  updatePayslip(id: string, payslip: Partial<InsertPayslip>): Promise<Payslip | undefined>;

  // Payslip item methods
  createPayslipItem(item: InsertPayslipItem): Promise<PayslipItem>;
  getPayslipItems(payslipId: string): Promise<PayslipItem[]>;
  getPayslipItemById(id: string): Promise<PayslipItem | undefined>;
  updatePayslipItem(id: string, item: Partial<InsertPayslipItem>): Promise<PayslipItem | undefined>;
  deletePayslipItem(id: string): Promise<boolean>;

  // Ledger account methods
  createLedgerAccount(account: InsertLedgerAccount): Promise<LedgerAccount>;
  getLedgerAccounts(organizationId?: string, accountType?: string): Promise<LedgerAccount[]>;
  getLedgerAccountById(id: string): Promise<LedgerAccount | undefined>;
  getLedgerAccountByCode(organizationId: string, accountCode: string): Promise<LedgerAccount | undefined>;
  updateLedgerAccount(id: string, account: Partial<InsertLedgerAccount>): Promise<LedgerAccount | undefined>;
  deleteLedgerAccount(id: string): Promise<boolean>;

  // Journal entry methods
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntries(organizationId?: string, sourceType?: string, startDate?: Date, endDate?: Date): Promise<JournalEntry[]>;
  getJournalEntryById(id: string): Promise<JournalEntry | undefined>;
  updateJournalEntry(id: string, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  postJournalEntry(id: string, postedBy: string): Promise<JournalEntry | undefined>;
  reverseJournalEntry(id: string, reversedBy: string): Promise<JournalEntry | undefined>;

  // Journal line methods
  createJournalLine(line: InsertJournalLine): Promise<JournalLine>;
  getJournalLines(journalEntryId: string): Promise<JournalLine[]>;
  getJournalLineById(id: string): Promise<JournalLine | undefined>;
  updateJournalLine(id: string, line: Partial<InsertJournalLine>): Promise<JournalLine | undefined>;
  deleteJournalLine(id: string): Promise<boolean>;

  // Pakistan tax slab methods
  createPakistanTaxSlab(slab: InsertPakistanTaxSlab): Promise<PakistanTaxSlab>;
  getPakistanTaxSlabs(fiscalYear?: string, isActive?: boolean): Promise<PakistanTaxSlab[]>;
  getPakistanTaxSlabById(id: string): Promise<PakistanTaxSlab | undefined>;
  updatePakistanTaxSlab(id: string, slab: Partial<InsertPakistanTaxSlab>): Promise<PakistanTaxSlab | undefined>;
  calculateIncomeTax(annualIncome: number, fiscalYear: string): Promise<number>;

  // Organization HR settings methods
  getOrganizationHRSettings(organizationId: string): Promise<OrganizationHRSettings | undefined>;
  upsertOrganizationHRSettings(settings: InsertOrganizationHRSettings): Promise<OrganizationHRSettings>;

  // Master Data: Specialty methods (case-insensitive)
  createSpecialty(specialty: InsertSpecialty): Promise<Specialty>;
  getSpecialties(isActive?: boolean): Promise<Specialty[]>;
  getSpecialtyById(id: string): Promise<Specialty | undefined>;
  getSpecialtyByName(name: string): Promise<Specialty | undefined>;
  updateSpecialty(id: string, specialty: Partial<InsertSpecialty>): Promise<Specialty | undefined>;
  deleteSpecialty(id: string): Promise<boolean>;

  // ========== Phase 3: Permission System Methods ==========
  
  // Screen methods
  getScreens(module?: string, isActive?: boolean): Promise<Screen[]>;
  getScreenById(id: string): Promise<Screen | undefined>;
  getScreenByCode(code: string): Promise<Screen | undefined>;
  createScreen(screen: InsertScreen): Promise<Screen>;
  updateScreen(id: string, screen: Partial<InsertScreen>): Promise<Screen | undefined>;
  deleteScreen(id: string): Promise<boolean>;

  // Screen permission methods
  getScreenPermissions(roleId?: string, screenId?: string): Promise<ScreenPermission[]>;
  getScreenPermissionById(id: string): Promise<ScreenPermission | undefined>;
  createScreenPermission(permission: InsertScreenPermission): Promise<ScreenPermission>;
  updateScreenPermission(id: string, permission: Partial<InsertScreenPermission>): Promise<ScreenPermission | undefined>;
  deleteScreenPermission(id: string): Promise<boolean>;
  
  // User permission override methods
  getUserPermissionOverrides(userId?: string, screenId?: string): Promise<UserPermissionOverride[]>;
  getUserPermissionOverrideById(id: string): Promise<UserPermissionOverride | undefined>;
  createUserPermissionOverride(override: InsertUserPermissionOverride): Promise<UserPermissionOverride>;
  updateUserPermissionOverride(id: string, override: Partial<InsertUserPermissionOverride>): Promise<UserPermissionOverride | undefined>;
  deleteUserPermissionOverride(id: string): Promise<boolean>;

  // Organization permission override methods
  getOrganizationPermissionOverrides(organizationId?: string, screenId?: string): Promise<OrganizationPermissionOverride[]>;
  getOrganizationPermissionOverrideById(id: string): Promise<OrganizationPermissionOverride | undefined>;
  createOrganizationPermissionOverride(override: InsertOrganizationPermissionOverride): Promise<OrganizationPermissionOverride>;
  updateOrganizationPermissionOverride(id: string, override: Partial<InsertOrganizationPermissionOverride>): Promise<OrganizationPermissionOverride | undefined>;
  deleteOrganizationPermissionOverride(id: string): Promise<boolean>;

  // Effective permissions - resolves role → org → user override chain
  getEffectivePermissions(userId: string, screenCode: string): Promise<{
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
    canApprove: boolean;
    accessLevel: 'none' | 'view' | 'create' | 'edit' | 'delete' | 'full';
    source: 'role' | 'organization' | 'user';
  } | null>;

  // Medical Instructions Dictionary
  getMedicalInstructions(category?: string): Promise<MedicalInstruction[]>;
  createMedicalInstruction(instruction: InsertMedicalInstruction): Promise<MedicalInstruction>;
  updateMedicalInstruction(id: string, instruction: Partial<InsertMedicalInstruction>): Promise<MedicalInstruction | undefined>;
  deleteMedicalInstruction(id: string): Promise<boolean>;

  // Doctor Pharma Commitments
  getDoctorPharmaCommitments(doctorId?: string, pharmaCompanyId?: string): Promise<DoctorPharmaCommitment[]>;
  createDoctorPharmaCommitment(commitment: InsertDoctorPharmaCommitment): Promise<DoctorPharmaCommitment>;
  updateDoctorPharmaCommitment(id: string, commitment: Partial<InsertDoctorPharmaCommitment>): Promise<DoctorPharmaCommitment | undefined>;
  deleteDoctorPharmaCommitment(id: string): Promise<boolean>;

  // SaaS Modules
  getAllModules(): Promise<Module[]>;
  getCompanyModules(companyId: string): Promise<CompanyModule[]>;
  toggleCompanyModule(companyId: string, moduleId: string, status: string): Promise<CompanyModule>;
}

export class DbStorage implements IStorage {
  // Raw SQL query method for master data endpoints (with optional params for safe queries)
  async query(sqlQuery: string, params?: any[]): Promise<{ rows: any[] }> {
    if (params && params.length > 0) {
      return await pool.query(sqlQuery, params);
    }
    return await pool.query(sqlQuery);
  }

  // User methods (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, id));
    } catch (e) {
      console.error("[DbStorage] Failed to update last login (schema mismatch?):", e);
    }
  }

  async getUsers(searchTerm?: string, companyId?: string): Promise<User[]> {
    const conditions = [];
    
    if (searchTerm) {
      conditions.push(
        or(
          like(users.email, `%${searchTerm}%`),
          like(users.firstName, `%${searchTerm}%`),
          like(users.lastName, `%${searchTerm}%`)
        )
      );
    }
    if (companyId) {
      conditions.push(eq(users.companyId, companyId));
    }

    const query = conditions.length > 0
      ? db.select().from(users).where(and(...conditions)).orderBy(desc(users.createdAt))
      : db.select().from(users).orderBy(desc(users.createdAt));

    return await query;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async updateLastLogin(id: string): Promise<void> {
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  // Company methods
  async createCompany(company: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(company).returning();
    return result[0];
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0];
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const result = await db.update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return result[0];
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id)).returning();
    return result.length > 0;
  }

  // ========== Organization Methods ==========
  
  async getOrganization(id: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id));
    return result[0];
  }

  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const result = await db.update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return result[0];
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const result = await db.insert(organizations).values(org as any).returning();
    return result[0];
  }

  // Organization type methods
  async getOrganizationTypes(): Promise<OrganizationType[]> {
    return await db.select().from(organizationTypes).where(eq(organizationTypes.isActive, true));
  }

  async getOrganizationTypeById(id: string): Promise<OrganizationType | undefined> {
    const result = await db.select().from(organizationTypes).where(eq(organizationTypes.id, id));
    return result[0];
  }

  // Sales entry methods
  async createSalesEntry(entry: InsertSalesEntry): Promise<SalesEntry> {
    // Get the product to determine the price
    const product = await this.getProductById(entry.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Use priceOverride if provided, otherwise use product's current price
    const rate = entry.priceOverride || product.currentPrice;
    
    // Calculate total amount server-side to prevent tampering
    const totalAmount = (parseFloat(rate as string) * entry.quantity).toFixed(2);
    const entryWithCalculatedTotal: any = {
      ...entry,
      rate, // Set the actual rate used
      totalAmount,
    };
    const result = await db.insert(salesEntries).values(entryWithCalculatedTotal).returning();
    return result[0];
  }

  async getSalesEntries(userId?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(salesEntries.userId, userId));
    }
    if (startDate) {
      conditions.push(gte(salesEntries.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(salesEntries.date, endDate));
    }

    const query = conditions.length > 0
      ? db.select({
          id: salesEntries.id,
          userId: salesEntries.userId,
          date: salesEntries.date,
          repName: salesEntries.repName,
          territory: salesEntries.territory,
          doctorId: salesEntries.doctorId,
          doctorName: doctors.name,
          productId: salesEntries.productId,
          productName: products.name,
          quantity: salesEntries.quantity,
          rate: salesEntries.rate,
          priceOverride: salesEntries.priceOverride,
          totalAmount: salesEntries.totalAmount,
          paymentMode: salesEntries.paymentMode,
          remarks: salesEntries.remarks,
          createdAt: salesEntries.createdAt,
        })
        .from(salesEntries)
        .leftJoin(doctors, eq(salesEntries.doctorId, doctors.id))
        .leftJoin(products, eq(salesEntries.productId, products.id))
        .where(and(...conditions))
        .orderBy(desc(salesEntries.date))
      : db.select({
          id: salesEntries.id,
          userId: salesEntries.userId,
          date: salesEntries.date,
          repName: salesEntries.repName,
          territory: salesEntries.territory,
          doctorId: salesEntries.doctorId,
          doctorName: doctors.name,
          productId: salesEntries.productId,
          productName: products.name,
          quantity: salesEntries.quantity,
          rate: salesEntries.rate,
          priceOverride: salesEntries.priceOverride,
          totalAmount: salesEntries.totalAmount,
          paymentMode: salesEntries.paymentMode,
          remarks: salesEntries.remarks,
          createdAt: salesEntries.createdAt,
        })
        .from(salesEntries)
        .leftJoin(doctors, eq(salesEntries.doctorId, doctors.id))
        .leftJoin(products, eq(salesEntries.productId, products.id))
        .orderBy(desc(salesEntries.date));

    return await query;
  }

  async getSalesEntryById(id: string): Promise<SalesEntry | undefined> {
    const result = await db.select().from(salesEntries).where(eq(salesEntries.id, id)).limit(1);
    return result[0];
  }

  async updateSalesEntry(id: string, entry: Partial<InsertSalesEntry>): Promise<SalesEntry | undefined> {
    // Recalculate total if quantity or rate is being updated
    let updateData = { ...entry };
    if (entry.quantity !== undefined || entry.rate !== undefined) {
      const existing = await this.getSalesEntryById(id);
      if (existing) {
        const quantity = entry.quantity !== undefined ? entry.quantity : existing.quantity;
        const rate = entry.rate !== undefined ? entry.rate : existing.rate;
        updateData.totalAmount = (parseFloat(rate as string) * quantity).toFixed(2);
      }
    }
    
    const result = await db.update(salesEntries)
      .set(updateData)
      .where(eq(salesEntries.id, id))
      .returning();
    return result[0];
  }

  async deleteSalesEntry(id: string): Promise<boolean> {
    const result = await db.delete(salesEntries).where(eq(salesEntries.id, id)).returning();
    return result.length > 0;
  }

  // Company settings methods
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const result = await db.select().from(companySettings).limit(1);
    return result[0];
  }

  async upsertCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const existing = await this.getCompanySettings();
    
    if (existing) {
      const result = await db.update(companySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(companySettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(companySettings).values(settings).returning();
      return result[0];
    }
  }

  // Doctor methods
  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const result = await db.insert(doctors).values(doctor).returning();
    return result[0];
  }

  async getDoctors(userId?: string): Promise<Doctor[]> {
    if (userId) {
      return await db.select().from(doctors).where(eq(doctors.userId, userId)).orderBy(desc(doctors.createdAt));
    }
    return await db.select().from(doctors).orderBy(desc(doctors.createdAt));
  }

  async getDoctorsWithPerson(userId?: string): Promise<Array<Doctor & { person?: Person }>> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(doctors.userId, userId));
    }

    const results = await db
      .select({
        doctor: doctors,
        person: persons
      })
      .from(doctors)
      .leftJoin(persons, eq(doctors.personId, persons.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(doctors.createdAt));

    return results.map(r => ({
      ...r.doctor,
      person: r.person || undefined
    }));
  }

  async getDoctorById(id: string): Promise<Doctor | undefined> {
    const result = await db.select().from(doctors).where(eq(doctors.id, id)).limit(1);
    return result[0];
  }

  async getDoctorByEmail(email: string, userId: string): Promise<Doctor | undefined> {
    const result = await db.select().from(doctors)
      .where(and(eq(doctors.email, email), eq(doctors.userId, userId)))
      .limit(1);
    return result[0];
  }

  async updateDoctor(id: string, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined> {
    const result = await db.update(doctors)
      .set({ ...doctor, updatedAt: new Date() })
      .where(eq(doctors.id, id))
      .returning();
    return result[0];
  }

  async deleteDoctor(id: string): Promise<boolean> {
    const result = await db.delete(doctors).where(eq(doctors.id, id)).returning();
    return result.length > 0;
  }

  // Product methods
  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async getProducts(userId?: string, organizationId?: string): Promise<Product[]> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(products.userId, userId));
    }
    if (organizationId) {
      conditions.push(eq(products.organizationId, organizationId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(products).where(and(...conditions)).orderBy(desc(products.createdAt));
    }
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductsByOrganization(organizationId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(
        eq(products.organizationId, organizationId),
        eq(products.isActive, true)
      ))
      .orderBy(desc(products.createdAt));
  }

  async searchProducts(query: string, organizationId?: string): Promise<Product[]> {
    const conditions = [
      or(
        sql`${products.name} ILIKE ${`%${query}%`}`,
        sql`${products.genericName} ILIKE ${`%${query}%`}`,
        sql`${products.saltComposition} ILIKE ${`%${query}%`}`,
        sql`${products.productCode} ILIKE ${`%${query}%`}`
      )
    ];
    
    if (organizationId) {
      conditions.push(eq(products.organizationId, organizationId));
    }
    
    return await db.select().from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(50);
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db.update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  // Product price history methods
  async createProductPriceHistory(history: InsertProductPriceHistory): Promise<ProductPriceHistory> {
    const result = await db.insert(productPriceHistory).values(history).returning();
    return result[0];
  }

  async getProductPriceHistory(productId: string): Promise<ProductPriceHistory[]> {
    return await db.select().from(productPriceHistory)
      .where(eq(productPriceHistory.productId, productId))
      .orderBy(desc(productPriceHistory.effectiveDate));
  }

  // Doctor visit methods
  async createDoctorVisit(visit: InsertDoctorVisit): Promise<DoctorVisit> {
    const result = await db.insert(doctorVisits).values(visit as any).returning();
    return result[0];
  }

  async getDoctorVisits(userId?: string, doctorId?: string): Promise<any[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(doctorVisits.userId, userId));
    }
    if (doctorId) {
      conditions.push(eq(doctorVisits.doctorId, doctorId));
    }

    const query = conditions.length > 0
      ? db.select({
          visit: doctorVisits,
          doctor: doctors,
        })
        .from(doctorVisits)
        .leftJoin(doctors, eq(doctorVisits.doctorId, doctors.id))
        .where(and(...conditions))
        .orderBy(desc(doctorVisits.punchInTime))
      : db.select({
          visit: doctorVisits,
          doctor: doctors,
        })
        .from(doctorVisits)
        .leftJoin(doctors, eq(doctorVisits.doctorId, doctors.id))
        .orderBy(desc(doctorVisits.punchInTime));

    return await query;
  }

  async getDoctorVisitById(id: string): Promise<DoctorVisit | undefined> {
    const result = await db.select().from(doctorVisits).where(eq(doctorVisits.id, id)).limit(1);
    return result[0];
  }

  async updateDoctorVisit(id: string, visit: Partial<InsertDoctorVisit>): Promise<DoctorVisit | undefined> {
    const result = await db.update(doctorVisits)
      .set({ ...visit, updatedAt: new Date() } as any)
      .where(eq(doctorVisits.id, id))
      .returning();
    return result[0];
  }

  async getActiveDoctorVisit(userId: string): Promise<DoctorVisit | undefined> {
    const result = await db.select().from(doctorVisits)
      .where(and(
        eq(doctorVisits.userId, userId),
        isNull(doctorVisits.punchOutTime)
      ))
      .limit(1);
    return result[0];
  }

  async punchOut(id: string, punchOutData: { punchOutTime: Date; punchOutLatitude?: string | null; punchOutLongitude?: string | null; duration: number }): Promise<DoctorVisit | undefined> {
    const result = await db.update(doctorVisits)
      .set({ ...punchOutData, updatedAt: new Date() })
      .where(eq(doctorVisits.id, id))
      .returning();
    return result[0];
  }

  // Expense methods
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const result = await db.insert(expenses).values(expense as any).returning();
    return result[0];
  }

  async getExpenses(userId?: string, startDate?: Date, endDate?: Date): Promise<Expense[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(expenses.userId, userId));
    }
    if (startDate) {
      conditions.push(gte(expenses.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(expenses.date, endDate));
    }

    if (conditions.length > 0) {
      return await db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.date));
    }
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return result[0];
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await db.update(expenses)
      .set({ ...expense, updatedAt: new Date() } as any)
      .where(eq(expenses.id, id))
      .returning();
    return result[0];
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }

  // Call KPI methods
  async createCallKPI(kpi: InsertCallKPI): Promise<CallKPI> {
    const result = await db.insert(callKPIs).values(kpi as any).returning();
    return result[0];
  }

  async getCallKPIs(userId?: string, startDate?: Date, endDate?: Date): Promise<CallKPI[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(callKPIs.userId, userId));
    }
    if (startDate) {
      conditions.push(gte(callKPIs.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(callKPIs.date, endDate));
    }

    if (conditions.length > 0) {
      return await db.select().from(callKPIs).where(and(...conditions)).orderBy(desc(callKPIs.date));
    }
    return await db.select().from(callKPIs).orderBy(desc(callKPIs.date));
  }

  async getCallKPIById(id: string): Promise<CallKPI | undefined> {
    const result = await db.select().from(callKPIs).where(eq(callKPIs.id, id)).limit(1);
    return result[0];
  }

  async getCallKPIByDate(userId: string, date: Date): Promise<CallKPI | undefined> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    const result = await db.select().from(callKPIs)
      .where(and(
        eq(callKPIs.userId, userId),
        gte(callKPIs.date, startOfDay),
        lte(callKPIs.date, endOfDay)
      ))
      .limit(1);
    return result[0];
  }

  async updateCallKPI(id: string, kpi: Partial<InsertCallKPI>): Promise<CallKPI | undefined> {
    const result = await db.update(callKPIs)
      .set({ ...kpi, updatedAt: new Date() } as any)
      .where(eq(callKPIs.id, id))
      .returning();
    return result[0];
  }

  async deleteCallKPI(id: string): Promise<boolean> {
    const result = await db.delete(callKPIs).where(eq(callKPIs.id, id)).returning();
    return result.length > 0;
  }

  // ========== Hospital/Clinic Method Implementations ==========

  // Healthcare facility methods
  async createHealthcareFacility(facility: InsertHealthcareFacility): Promise<HealthcareFacility> {
    const result = await db.insert(healthcareFacilities).values(facility as any).returning();
    return result[0];
  }

  async getHealthcareFacilities(organizationId?: string): Promise<HealthcareFacility[]> {
    if (organizationId) {
      return await db.select().from(healthcareFacilities).where(eq(healthcareFacilities.organizationId, organizationId));
    }
    return await db.select().from(healthcareFacilities);
  }

  async getHealthcareFacilityById(id: string): Promise<HealthcareFacility | undefined> {
    const result = await db.select().from(healthcareFacilities).where(eq(healthcareFacilities.id, id)).limit(1);
    return result[0];
  }

  async updateHealthcareFacility(id: string, facility: Partial<InsertHealthcareFacility>): Promise<HealthcareFacility | undefined> {
    const result = await db.update(healthcareFacilities)
      .set({ ...facility, updatedAt: new Date() } as any)
      .where(eq(healthcareFacilities.id, id))
      .returning();
    return result[0];
  }

  async deleteHealthcareFacility(id: string): Promise<boolean> {
    const result = await db.delete(healthcareFacilities).where(eq(healthcareFacilities.id, id)).returning();
    return result.length > 0;
  }

  // Facility department methods
  async createFacilityDepartment(dept: InsertFacilityDepartment): Promise<FacilityDepartment> {
    const result = await db.insert(facilityDepartments).values(dept as any).returning();
    return result[0];
  }

  async getFacilityDepartments(facilityId: string): Promise<FacilityDepartment[]> {
    return await db.select().from(facilityDepartments)
      .where(eq(facilityDepartments.facilityId, facilityId))
      .orderBy(facilityDepartments.displayOrder);
  }

  async getFacilityDepartmentById(id: string): Promise<FacilityDepartment | undefined> {
    const result = await db.select().from(facilityDepartments).where(eq(facilityDepartments.id, id)).limit(1);
    return result[0];
  }

  async updateFacilityDepartment(id: string, dept: Partial<InsertFacilityDepartment>): Promise<FacilityDepartment | undefined> {
    const result = await db.update(facilityDepartments)
      .set({ ...dept, updatedAt: new Date() } as any)
      .where(eq(facilityDepartments.id, id))
      .returning();
    return result[0];
  }

  async deleteFacilityDepartment(id: string): Promise<boolean> {
    const result = await db.delete(facilityDepartments).where(eq(facilityDepartments.id, id)).returning();
    return result.length > 0;
  }

  // Department role methods
  async createDepartmentRole(role: InsertDepartmentRole): Promise<DepartmentRole> {
    const result = await db.insert(departmentRoles).values(role as any).returning();
    return result[0];
  }

  async getDepartmentRoles(departmentId: string): Promise<DepartmentRole[]> {
    return await db.select().from(departmentRoles)
      .where(eq(departmentRoles.departmentId, departmentId))
      .orderBy(departmentRoles.name);
  }

  async getDepartmentRoleById(id: string): Promise<DepartmentRole | undefined> {
    const result = await db.select().from(departmentRoles).where(eq(departmentRoles.id, id)).limit(1);
    return result[0];
  }

  async updateDepartmentRole(id: string, role: Partial<InsertDepartmentRole>): Promise<DepartmentRole | undefined> {
    const result = await db.update(departmentRoles)
      .set({ ...role, updatedAt: new Date() })
      .where(eq(departmentRoles.id, id))
      .returning();
    return result[0];
  }

  async deleteDepartmentRole(id: string): Promise<boolean> {
    const result = await db.delete(departmentRoles).where(eq(departmentRoles.id, id)).returning();
    return result.length > 0;
  }

  // Healthcare doctor methods
  async createHealthcareDoctor(doctor: InsertHealthcareDoctor): Promise<HealthcareDoctor> {
    const result = await db.insert(healthcareDoctors).values(doctor as any).returning();
    return result[0];
  }

  async getHealthcareDoctors(facilityId?: string): Promise<HealthcareDoctor[]> {
    if (facilityId) {
      return await db.select().from(healthcareDoctors).where(eq(healthcareDoctors.facilityId, facilityId));
    }
    return await db.select().from(healthcareDoctors);
  }

  async getHealthcareDoctorsWithPerson(facilityId?: string): Promise<Array<HealthcareDoctor & { person?: Person }>> {
    // Join healthcare_doctors with persons to get Person Master data
    const conditions = [];
    if (facilityId) {
      conditions.push(eq(healthcareDoctors.facilityId, facilityId));
    }

    const results = await db
      .select({
        doctor: healthcareDoctors,
        person: persons
      })
      .from(healthcareDoctors)
      .leftJoin(persons, eq(healthcareDoctors.personId, persons.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(healthcareDoctors.createdAt));

    return results.map(r => ({
      ...r.doctor,
      person: r.person || undefined
    }));
  }

  async getHealthcareDoctorById(id: string): Promise<HealthcareDoctor | undefined> {
    const result = await db.select().from(healthcareDoctors).where(eq(healthcareDoctors.id, id)).limit(1);
    return result[0];
  }

  async updateHealthcareDoctor(id: string, doctor: Partial<InsertHealthcareDoctor>): Promise<HealthcareDoctor | undefined> {
    const result = await db.update(healthcareDoctors)
      .set({ ...doctor, updatedAt: new Date() } as any)
      .where(eq(healthcareDoctors.id, id))
      .returning();
    return result[0];
  }

  async deleteHealthcareDoctor(id: string): Promise<boolean> {
    const result = await db.delete(healthcareDoctors).where(eq(healthcareDoctors.id, id)).returning();
    return result.length > 0;
  }

  // Doctor availability methods
  async createDoctorAvailability(availability: InsertDoctorAvailability): Promise<DoctorAvailability> {
    const result = await db.insert(doctorAvailability).values(availability as any).returning();
    return result[0];
  }

  async getDoctorAvailability(doctorId: string): Promise<DoctorAvailability[]> {
    return await db.select().from(doctorAvailability).where(eq(doctorAvailability.doctorId, doctorId));
  }

  async getDoctorAvailabilityById(id: string): Promise<DoctorAvailability | undefined> {
    const result = await db.select().from(doctorAvailability).where(eq(doctorAvailability.id, id)).limit(1);
    return result[0];
  }

  async updateDoctorAvailability(id: string, availability: Partial<InsertDoctorAvailability>): Promise<DoctorAvailability | undefined> {
    const result = await db.update(doctorAvailability)
      .set({ ...availability, updatedAt: new Date() } as any)
      .where(eq(doctorAvailability.id, id))
      .returning();
    return result[0];
  }

  async deleteDoctorAvailability(id: string): Promise<boolean> {
    const result = await db.delete(doctorAvailability).where(eq(doctorAvailability.id, id)).returning();
    return result.length > 0;
  }

  // Patient methods
  async createPatient(patient: InsertPatient): Promise<Patient> {
    const result = await db.insert(patients).values(patient as any).returning();
    return result[0];
  }

  async getPatients(facilityId?: string, searchTerm?: string): Promise<Patient[]> {
    const conditions = [];
    
    if (facilityId) {
      conditions.push(eq(patients.facilityId, facilityId));
    }
    if (searchTerm) {
      conditions.push(
        or(
          like(patients.name, `%${searchTerm}%`),
          like(patients.patientNumber, `%${searchTerm}%`),
          like(patients.phone, `%${searchTerm}%`)
        )!
      );
    }

    if (conditions.length > 0) {
      return await db.select().from(patients).where(and(...conditions)).orderBy(desc(patients.createdAt));
    }
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatientById(id: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
    return result[0];
  }

  async getPatientByNumber(facilityId: string, patientNumber: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients)
      .where(and(
        eq(patients.facilityId, facilityId),
        eq(patients.patientNumber, patientNumber)
      ))
      .limit(1);
    return result[0];
  }

  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const result = await db.update(patients)
      .set({ ...patient, updatedAt: new Date() } as any)
      .where(eq(patients.id, id))
      .returning();
    return result[0];
  }

  async deletePatient(id: string): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id)).returning();
    return result.length > 0;
  }

  // Appointment methods
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values(appointment as any).returning();
    return result[0];
  }

  async getAppointments(facilityId?: string, doctorId?: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    const conditions = [];
    
    if (facilityId) {
      conditions.push(eq(appointments.facilityId, facilityId));
    }
    if (doctorId) {
      conditions.push(eq(appointments.doctorId, doctorId));
    }
    if (startDate) {
      conditions.push(gte(appointments.appointmentDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(appointments.appointmentDate, endDate));
    }

    if (conditions.length > 0) {
      return await db.select().from(appointments).where(and(...conditions)).orderBy(appointments.appointmentDate);
    }
    return await db.select().from(appointments).orderBy(appointments.appointmentDate);
  }

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    return result[0];
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const result = await db.update(appointments)
      .set({ ...appointment, updatedAt: new Date() } as any)
      .where(eq(appointments.id, id))
      .returning();
    return result[0];
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id)).returning();
    return result.length > 0;
  }

  // Queue entry methods
  async createQueueEntry(queue: InsertQueueEntry): Promise<QueueEntry> {
    const result = await db.insert(queueEntries).values(queue as any).returning();
    return result[0];
  }

  async getQueueEntries(facilityId?: string, doctorId?: string, date?: Date): Promise<QueueEntry[]> {
    const conditions = [];
    
    if (facilityId) {
      conditions.push(eq(queueEntries.facilityId, facilityId));
    }
    if (doctorId) {
      conditions.push(eq(queueEntries.doctorId, doctorId));
    }
    if (date) {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      conditions.push(gte(queueEntries.queueDate, startOfDay));
      conditions.push(lte(queueEntries.queueDate, endOfDay));
    }

    if (conditions.length > 0) {
      return await db.select().from(queueEntries).where(and(...conditions)).orderBy(queueEntries.queueNumber);
    }
    return await db.select().from(queueEntries).orderBy(queueEntries.queueNumber);
  }

  async getQueueEntryById(id: string): Promise<QueueEntry | undefined> {
    const result = await db.select().from(queueEntries).where(eq(queueEntries.id, id)).limit(1);
    return result[0];
  }

  async updateQueueEntry(id: string, queue: Partial<InsertQueueEntry>): Promise<QueueEntry | undefined> {
    const result = await db.update(queueEntries)
      .set(queue as any)
      .where(eq(queueEntries.id, id))
      .returning();
    return result[0];
  }

  async getNextQueueNumber(facilityId: string, doctorId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    const result = await db.select({ maxQueue: queueEntries.queueNumber })
      .from(queueEntries)
      .where(and(
        eq(queueEntries.facilityId, facilityId),
        eq(queueEntries.doctorId, doctorId),
        gte(queueEntries.queueDate, startOfDay),
        lte(queueEntries.queueDate, endOfDay)
      ))
      .orderBy(desc(queueEntries.queueNumber))
      .limit(1);
    
    return result.length > 0 && result[0].maxQueue ? result[0].maxQueue + 1 : 1;
  }

  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment as any).returning();
    return result[0];
  }

  async getPayments(facilityId?: string, patientId?: string, startDate?: Date, endDate?: Date): Promise<Payment[]> {
    const conditions = [];
    
    if (facilityId) {
      conditions.push(eq(payments.facilityId, facilityId));
    }
    if (patientId) {
      conditions.push(eq(payments.patientId, patientId));
    }
    if (startDate) {
      conditions.push(gte(payments.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(payments.createdAt, endDate));
    }

    if (conditions.length > 0) {
      return await db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.createdAt));
    }
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return result[0];
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const result = await db.update(payments)
      .set(payment as any)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  // Patient vitals methods
  async createPatientVitals(vitals: InsertPatientVitals): Promise<PatientVitals> {
    const result = await db.insert(patientVitals).values(vitals as any).returning();
    return result[0];
  }

  async getPatientVitals(patientId?: string, queueEntryId?: string): Promise<PatientVitals[]> {
    const conditions = [];
    
    if (patientId) {
      conditions.push(eq(patientVitals.patientId, patientId));
    }
    if (queueEntryId) {
      conditions.push(eq(patientVitals.queueEntryId, queueEntryId));
    }

    if (conditions.length > 0) {
      return await db.select().from(patientVitals).where(and(...conditions)).orderBy(desc(patientVitals.recordedAt));
    }
    return await db.select().from(patientVitals).orderBy(desc(patientVitals.recordedAt));
  }

  async getPatientVitalsById(id: string): Promise<PatientVitals | undefined> {
    const result = await db.select().from(patientVitals).where(eq(patientVitals.id, id)).limit(1);
    return result[0];
  }

  async updatePatientVitals(id: string, vitals: Partial<InsertPatientVitals>): Promise<PatientVitals | undefined> {
    const result = await db.update(patientVitals)
      .set(vitals as any)
      .where(eq(patientVitals.id, id))
      .returning();
    return result[0];
  }

  // Consultation methods
  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const result = await db.insert(consultations).values(consultation as any).returning();
    return result[0];
  }

  async getConsultations(facilityId?: string, patientId?: string, doctorId?: string): Promise<Consultation[]> {
    const conditions = [];
    
    if (facilityId) {
      conditions.push(eq(consultations.facilityId, facilityId));
    }
    if (patientId) {
      conditions.push(eq(consultations.patientId, patientId));
    }
    if (doctorId) {
      conditions.push(eq(consultations.doctorId, doctorId));
    }

    if (conditions.length > 0) {
      return await db.select().from(consultations).where(and(...conditions)).orderBy(desc(consultations.consultationDate));
    }
    return await db.select().from(consultations).orderBy(desc(consultations.consultationDate));
  }

  async getConsultationById(id: string): Promise<Consultation | undefined> {
    const result = await db.select().from(consultations).where(eq(consultations.id, id)).limit(1);
    return result[0];
  }

  async updateConsultation(id: string, consultation: Partial<InsertConsultation>): Promise<Consultation | undefined> {
    const result = await db.update(consultations)
      .set({ ...consultation, updatedAt: new Date() } as any)
      .where(eq(consultations.id, id))
      .returning();
    return result[0];
  }

  // Prescription methods
  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const result = await db.insert(prescriptions).values(prescription as any).returning();
    return result[0];
  }

  async getPrescriptions(patientId?: string, consultationId?: string): Promise<Prescription[]> {
    const conditions = [];
    
    if (patientId) {
      conditions.push(eq(prescriptions.patientId, patientId));
    }
    if (consultationId) {
      conditions.push(eq(prescriptions.consultationId, consultationId));
    }

    if (conditions.length > 0) {
      return await db.select().from(prescriptions).where(and(...conditions)).orderBy(desc(prescriptions.createdAt));
    }
    return await db.select().from(prescriptions).orderBy(desc(prescriptions.createdAt));
  }

  async getPrescriptionById(id: string): Promise<Prescription | undefined> {
    const result = await db.select().from(prescriptions).where(eq(prescriptions.id, id)).limit(1);
    return result[0];
  }

  async updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const result = await db.update(prescriptions)
      .set(prescription as any)
      .where(eq(prescriptions.id, id))
      .returning();
    return result[0];
  }

  // Prescription medicines methods (normalized for cross-org analytics)
  async createPrescriptionMedicine(medicine: InsertPrescriptionMedicine): Promise<PrescriptionMedicine> {
    const result = await db.insert(prescriptionMedicines).values(medicine as any).returning();
    return result[0];
  }

  async getPrescriptionMedicines(prescriptionId: string): Promise<PrescriptionMedicine[]> {
    return await db.select().from(prescriptionMedicines)
      .where(eq(prescriptionMedicines.prescriptionId, prescriptionId))
      .orderBy(desc(prescriptionMedicines.createdAt));
  }

  async getPrescriptionMedicinesByProduct(pharmaProductId: string): Promise<PrescriptionMedicine[]> {
    return await db.select().from(prescriptionMedicines)
      .where(eq(prescriptionMedicines.pharmaProductId, pharmaProductId))
      .orderBy(desc(prescriptionMedicines.createdAt));
  }

  // Test report methods
  async createTestReport(report: InsertTestReport): Promise<TestReport> {
    const result = await db.insert(testReports).values(report as any).returning();
    return result[0];
  }

  async getTestReports(patientId?: string, consultationId?: string): Promise<TestReport[]> {
    const conditions = [];
    
    if (patientId) {
      conditions.push(eq(testReports.patientId, patientId));
    }
    if (consultationId) {
      conditions.push(eq(testReports.consultationId, consultationId));
    }

    if (conditions.length > 0) {
      return await db.select().from(testReports).where(and(...conditions)).orderBy(desc(testReports.createdAt));
    }
    return await db.select().from(testReports).orderBy(desc(testReports.createdAt));
  }

  async getTestReportById(id: string): Promise<TestReport | undefined> {
    const result = await db.select().from(testReports).where(eq(testReports.id, id)).limit(1);
    return result[0];
  }

  async updateTestReport(id: string, report: Partial<InsertTestReport>): Promise<TestReport | undefined> {
    const result = await db.update(testReports)
      .set({ ...report, updatedAt: new Date() } as any)
      .where(eq(testReports.id, id))
      .returning();
    return result[0];
  }

  async deleteTestReport(id: string): Promise<boolean> {
    const result = await db.delete(testReports).where(eq(testReports.id, id)).returning();
    return result.length > 0;
  }

  // ========== Pharma & MR Module Methods ==========

  // Product sample methods
  async createProductSample(sample: InsertProductSample): Promise<ProductSample> {
    const result = await db.insert(productSamples).values(sample as any).returning();
    return result[0];
  }

  async getProductSamples(productId?: string, companyId?: string): Promise<ProductSample[]> {
    const conditions = [];
    if (productId) conditions.push(eq(productSamples.productId, productId));
    if (companyId) conditions.push(eq(productSamples.companyId, companyId));

    if (conditions.length > 0) {
      return await db.select().from(productSamples).where(and(...conditions)).orderBy(desc(productSamples.createdAt));
    }
    return await db.select().from(productSamples).orderBy(desc(productSamples.createdAt));
  }

  async getProductSampleById(id: string): Promise<ProductSample | undefined> {
    const result = await db.select().from(productSamples).where(eq(productSamples.id, id)).limit(1);
    return result[0];
  }

  async updateProductSample(id: string, sample: Partial<InsertProductSample>): Promise<ProductSample | undefined> {
    const result = await db.update(productSamples)
      .set({ ...sample, updatedAt: new Date() } as any)
      .where(eq(productSamples.id, id))
      .returning();
    return result[0];
  }

  async deleteProductSample(id: string): Promise<boolean> {
    const result = await db.delete(productSamples).where(eq(productSamples.id, id)).returning();
    return result.length > 0;
  }

  // Sample distribution methods
  async createSampleDistribution(distribution: InsertSampleDistribution): Promise<SampleDistribution> {
    const result = await db.insert(sampleDistributions).values(distribution as any).returning();
    return result[0];
  }

  async getSampleDistributions(userId?: string, doctorId?: string): Promise<SampleDistribution[]> {
    const conditions = [];
    if (userId) conditions.push(eq(sampleDistributions.userId, userId));
    if (doctorId) conditions.push(eq(sampleDistributions.doctorId, doctorId));

    if (conditions.length > 0) {
      return await db.select().from(sampleDistributions).where(and(...conditions)).orderBy(desc(sampleDistributions.createdAt));
    }
    return await db.select().from(sampleDistributions).orderBy(desc(sampleDistributions.createdAt));
  }

  async getSampleDistributionById(id: string): Promise<SampleDistribution | undefined> {
    const result = await db.select().from(sampleDistributions).where(eq(sampleDistributions.id, id)).limit(1);
    return result[0];
  }

  // Visit request methods
  async createVisitRequest(request: InsertVisitRequest): Promise<VisitRequest> {
    const result = await db.insert(visitRequests).values(request as any).returning();
    return result[0];
  }

  async getVisitRequests(userId?: string, doctorId?: string, status?: string): Promise<VisitRequest[]> {
    const conditions = [];
    if (userId) conditions.push(eq(visitRequests.userId, userId));
    if (doctorId) conditions.push(eq(visitRequests.doctorId, doctorId));
    if (status) conditions.push(eq(visitRequests.status, status));

    if (conditions.length > 0) {
      return await db.select().from(visitRequests).where(and(...conditions)).orderBy(desc(visitRequests.createdAt));
    }
    return await db.select().from(visitRequests).orderBy(desc(visitRequests.createdAt));
  }

  async getVisitRequestById(id: string): Promise<VisitRequest | undefined> {
    const result = await db.select().from(visitRequests).where(eq(visitRequests.id, id)).limit(1);
    return result[0];
  }

  async updateVisitRequest(id: string, request: Partial<InsertVisitRequest>): Promise<VisitRequest | undefined> {
    const result = await db.update(visitRequests)
      .set({ ...request, updatedAt: new Date() } as any)
      .where(eq(visitRequests.id, id))
      .returning();
    return result[0];
  }

  // Subscription plan methods
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const result = await db.insert(subscriptionPlans).values(plan as any).returning();
    return result[0];
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.name);
  }

  async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | undefined> {
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
    return result[0];
  }

  async updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const result = await db.update(subscriptionPlans)
      .set({ ...plan, updatedAt: new Date() } as any)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return result[0];
  }

  async deleteSubscriptionPlan(id: string): Promise<boolean> {
    const result = await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id)).returning();
    return result.length > 0;
  }

  // Subscription methods
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(subscription as any).returning();
    return result[0];
  }

  async getSubscriptions(userId?: string, companyId?: string): Promise<Subscription[]> {
    const conditions = [];
    if (userId) conditions.push(eq(subscriptions.userId, userId));
    if (companyId) conditions.push(eq(subscriptions.companyId, companyId));

    if (conditions.length > 0) {
      return await db.select().from(subscriptions).where(and(...conditions)).orderBy(desc(subscriptions.createdAt));
    }
    return await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }

  async getSubscriptionById(id: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return result[0];
  }

  async updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const result = await db.update(subscriptions)
      .set({ ...subscription, updatedAt: new Date() } as any)
      .where(eq(subscriptions.id, id))
      .returning();
    return result[0];
  }

  async deleteSubscription(id: string): Promise<boolean> {
    const result = await db.delete(subscriptions).where(eq(subscriptions.id, id)).returning();
    return result.length > 0;
  }

  // Route plan methods
  async createRoutePlan(plan: InsertRoutePlan): Promise<RoutePlan> {
    const result = await db.insert(routePlans).values(plan as any).returning();
    return result[0];
  }

  async getRoutePlans(userId?: string, startDate?: Date, endDate?: Date): Promise<RoutePlan[]> {
    const conditions = [];
    if (userId) conditions.push(eq(routePlans.userId, userId));
    if (startDate) conditions.push(gte(routePlans.planDate, startDate));
    if (endDate) conditions.push(lte(routePlans.planDate, endDate));

    if (conditions.length > 0) {
      return await db.select().from(routePlans).where(and(...conditions)).orderBy(desc(routePlans.planDate));
    }
    return await db.select().from(routePlans).orderBy(desc(routePlans.planDate));
  }

  async getRoutePlanById(id: string): Promise<RoutePlan | undefined> {
    const result = await db.select().from(routePlans).where(eq(routePlans.id, id)).limit(1);
    return result[0];
  }

  async updateRoutePlan(id: string, plan: Partial<InsertRoutePlan>): Promise<RoutePlan | undefined> {
    const result = await db.update(routePlans)
      .set({ ...plan, updatedAt: new Date() } as any)
      .where(eq(routePlans.id, id))
      .returning();
    return result[0];
  }

  async deleteRoutePlan(id: string): Promise<boolean> {
    const result = await db.delete(routePlans).where(eq(routePlans.id, id)).returning();
    return result.length > 0;
  }

  // Route plan stop methods
  async createRoutePlanStop(stop: InsertRoutePlanStop): Promise<RoutePlanStop> {
    const result = await db.insert(routePlanStops).values(stop as any).returning();
    return result[0];
  }

  async getRoutePlanStops(routePlanId: string): Promise<RoutePlanStop[]> {
    return await db.select().from(routePlanStops)
      .where(eq(routePlanStops.routePlanId, routePlanId))
      .orderBy(routePlanStops.stopOrder);
  }

  async getRoutePlanStopById(id: string): Promise<RoutePlanStop | undefined> {
    const result = await db.select().from(routePlanStops).where(eq(routePlanStops.id, id)).limit(1);
    return result[0];
  }

  async updateRoutePlanStop(id: string, stop: Partial<InsertRoutePlanStop>): Promise<RoutePlanStop | undefined> {
    const result = await db.update(routePlanStops)
      .set(stop as any)
      .where(eq(routePlanStops.id, id))
      .returning();
    return result[0];
  }

  async deleteRoutePlanStop(id: string): Promise<boolean> {
    const result = await db.delete(routePlanStops).where(eq(routePlanStops.id, id)).returning();
    return result.length > 0;
  }

  // Sales Lead methods (FR-MR-06)
  async createSalesLead(lead: InsertSalesLead): Promise<SalesLead> {
    const result = await db.insert(salesLeads).values(lead as any).returning();
    return result[0];
  }

  async getSalesLeads(userId?: string, companyId?: string, status?: string): Promise<any[]> {
    const conditions = [];
    if (userId) conditions.push(eq(salesLeads.userId, userId));
    if (companyId) conditions.push(eq(salesLeads.companyId, companyId));
    if (status) conditions.push(eq(salesLeads.status, status));

    const query = conditions.length > 0
      ? db.select({
          lead: salesLeads,
          doctor: doctors,
          product: products,
        })
        .from(salesLeads)
        .leftJoin(doctors, eq(salesLeads.doctorId, doctors.id))
        .leftJoin(products, eq(salesLeads.productId, products.id))
        .where(and(...conditions))
        .orderBy(desc(salesLeads.createdAt))
      : db.select({
          lead: salesLeads,
          doctor: doctors,
          product: products,
        })
        .from(salesLeads)
        .leftJoin(doctors, eq(salesLeads.doctorId, doctors.id))
        .leftJoin(products, eq(salesLeads.productId, products.id))
        .orderBy(desc(salesLeads.createdAt));

    return await query;
  }

  async getSalesLeadById(id: string): Promise<SalesLead | undefined> {
    const result = await db.select().from(salesLeads).where(eq(salesLeads.id, id)).limit(1);
    return result[0];
  }

  async updateSalesLead(id: string, lead: Partial<InsertSalesLead>): Promise<SalesLead | undefined> {
    const result = await db.update(salesLeads)
      .set({ ...lead, updatedAt: new Date() } as any)
      .where(eq(salesLeads.id, id))
      .returning();
    return result[0];
  }

  async deleteSalesLead(id: string): Promise<boolean> {
    const result = await db.delete(salesLeads).where(eq(salesLeads.id, id)).returning();
    return result.length > 0;
  }

  // MR Profile methods (FR-MR-01)
  async createMRProfile(profile: InsertMRProfile): Promise<MRProfile> {
    const result = await db.insert(mrProfiles).values(profile as any).returning();
    return result[0];
  }

  async getMRProfiles(companyId?: string): Promise<any[]> {
    const conditions = [];
    if (companyId) conditions.push(eq(mrProfiles.companyId, companyId));

    const query = conditions.length > 0
      ? db.select({
          profile: mrProfiles,
          user: users,
        })
        .from(mrProfiles)
        .leftJoin(users, eq(mrProfiles.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(mrProfiles.createdAt))
      : db.select({
          profile: mrProfiles,
          user: users,
        })
        .from(mrProfiles)
        .leftJoin(users, eq(mrProfiles.userId, users.id))
        .orderBy(desc(mrProfiles.createdAt));

    return await query;
  }

  async getMRProfileByUserId(userId: string): Promise<MRProfile | undefined> {
    const result = await db.select().from(mrProfiles).where(eq(mrProfiles.userId, userId)).limit(1);
    return result[0];
  }

  async getMRProfileById(id: string): Promise<MRProfile | undefined> {
    const result = await db.select().from(mrProfiles).where(eq(mrProfiles.id, id)).limit(1);
    return result[0];
  }

  async updateMRProfile(id: string, profile: Partial<InsertMRProfile>): Promise<MRProfile | undefined> {
    const result = await db.update(mrProfiles)
      .set({ ...profile, updatedAt: new Date() } as any)
      .where(eq(mrProfiles.id, id))
      .returning();
    return result[0];
  }

  async deleteMRProfile(id: string): Promise<boolean> {
    const result = await db.delete(mrProfiles).where(eq(mrProfiles.id, id)).returning();
    return result.length > 0;
  }

  // Pharma Company Settings methods (FR-PH-01)
  async createPharmaCompanySettings(settings: InsertPharmaCompanySettings): Promise<PharmaCompanySettings> {
    const result = await db.insert(pharmaCompanySettings).values(settings as any).returning();
    return result[0];
  }

  async getPharmaCompanySettings(companyId: string): Promise<PharmaCompanySettings | undefined> {
    const result = await db.select().from(pharmaCompanySettings).where(eq(pharmaCompanySettings.companyId, companyId)).limit(1);
    return result[0];
  }

  async getAllPharmaCompanySettings(): Promise<any[]> {
    return await db.select({
      settings: pharmaCompanySettings,
      company: companies,
    })
    .from(pharmaCompanySettings)
    .leftJoin(companies, eq(pharmaCompanySettings.companyId, companies.id))
    .orderBy(desc(pharmaCompanySettings.createdAt));
  }

  async updatePharmaCompanySettings(id: string, settings: Partial<InsertPharmaCompanySettings>): Promise<PharmaCompanySettings | undefined> {
    const result = await db.update(pharmaCompanySettings)
      .set({ ...settings, updatedAt: new Date() } as any)
      .where(eq(pharmaCompanySettings.id, id))
      .returning();
    return result[0];
  }

  async deletePharmaCompanySettings(id: string): Promise<boolean> {
    const result = await db.delete(pharmaCompanySettings).where(eq(pharmaCompanySettings.id, id)).returning();
    return result.length > 0;
  }

  // ========== Inventory Management Methods ==========

  // Warehouse methods
  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const result = await db.insert(warehouses).values(warehouse as any).returning();
    return result[0];
  }

  async getWarehouses(organizationId?: string, facilityId?: string): Promise<Warehouse[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(warehouses.organizationId, organizationId));
    if (facilityId) conditions.push(eq(warehouses.facilityId, facilityId));

    if (conditions.length > 0) {
      return await db.select().from(warehouses).where(and(...conditions)).orderBy(desc(warehouses.createdAt));
    }
    return await db.select().from(warehouses).orderBy(desc(warehouses.createdAt));
  }

  async getWarehouseById(id: string): Promise<Warehouse | undefined> {
    const result = await db.select().from(warehouses).where(eq(warehouses.id, id)).limit(1);
    return result[0];
  }

  async updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const result = await db.update(warehouses)
      .set({ ...warehouse, updatedAt: new Date() } as any)
      .where(eq(warehouses.id, id))
      .returning();
    return result[0];
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    const result = await db.delete(warehouses).where(eq(warehouses.id, id)).returning();
    return result.length > 0;
  }

  // Stock item methods
  async createStockItem(item: InsertStockItem): Promise<StockItem> {
    const result = await db.insert(stockItems).values(item as any).returning();
    return result[0];
  }

  async getStockItems(warehouseId?: string, category?: string): Promise<StockItem[]> {
    const conditions = [];
    if (warehouseId) conditions.push(eq(stockItems.warehouseId, warehouseId));
    if (category) conditions.push(eq(stockItems.category, category));

    if (conditions.length > 0) {
      return await db.select().from(stockItems).where(and(...conditions)).orderBy(desc(stockItems.createdAt));
    }
    return await db.select().from(stockItems).orderBy(desc(stockItems.createdAt));
  }

  async getStockItemById(id: string): Promise<StockItem | undefined> {
    const result = await db.select().from(stockItems).where(eq(stockItems.id, id)).limit(1);
    return result[0];
  }

  async getStockItemByCode(warehouseId: string, itemCode: string): Promise<StockItem | undefined> {
    const result = await db.select().from(stockItems)
      .where(and(eq(stockItems.warehouseId, warehouseId), eq(stockItems.itemCode, itemCode)))
      .limit(1);
    return result[0];
  }

  async updateStockItem(id: string, item: Partial<InsertStockItem>): Promise<StockItem | undefined> {
    const result = await db.update(stockItems)
      .set({ ...item, updatedAt: new Date() } as any)
      .where(eq(stockItems.id, id))
      .returning();
    return result[0];
  }

  async deleteStockItem(id: string): Promise<boolean> {
    const result = await db.delete(stockItems).where(eq(stockItems.id, id)).returning();
    return result.length > 0;
  }

  async getLowStockItems(warehouseId?: string): Promise<StockItem[]> {
    // Get items where current quantity is at or below reorder level
    const items = await this.getStockItems(warehouseId);
    return items.filter(item => {
      const current = parseFloat(item.currentQuantity || "0");
      const reorder = parseFloat(item.reorderLevel || "10");
      return current <= reorder;
    });
  }

  async getExpiringItems(warehouseId?: string, daysUntilExpiry: number = 30): Promise<StockItem[]> {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysUntilExpiry);

    const conditions = [lte(stockItems.expiryDate, expiryThreshold)];
    if (warehouseId) conditions.push(eq(stockItems.warehouseId, warehouseId));

    return await db.select().from(stockItems)
      .where(and(...conditions))
      .orderBy(stockItems.expiryDate);
  }

  // Stock movement methods
  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const result = await db.insert(stockMovements).values(movement as any).returning();
    return result[0];
  }

  async getStockMovements(stockItemId?: string, warehouseId?: string, startDate?: Date, endDate?: Date): Promise<StockMovement[]> {
    const conditions = [];
    if (stockItemId) conditions.push(eq(stockMovements.stockItemId, stockItemId));
    if (warehouseId) conditions.push(eq(stockMovements.warehouseId, warehouseId));
    if (startDate) conditions.push(gte(stockMovements.movementDate, startDate));
    if (endDate) conditions.push(lte(stockMovements.movementDate, endDate));

    if (conditions.length > 0) {
      return await db.select().from(stockMovements).where(and(...conditions)).orderBy(desc(stockMovements.movementDate));
    }
    return await db.select().from(stockMovements).orderBy(desc(stockMovements.movementDate));
  }

  async getStockMovementById(id: string): Promise<StockMovement | undefined> {
    const result = await db.select().from(stockMovements).where(eq(stockMovements.id, id)).limit(1);
    return result[0];
  }

  // ========== Doctor Payroll Methods ==========

  async createDoctorPayrollRecord(record: InsertDoctorPayrollRecord): Promise<DoctorPayrollRecord> {
    const result = await db.insert(doctorPayrollRecords).values(record as any).returning();
    return result[0];
  }

  async getDoctorPayrollRecords(facilityId?: string, doctorId?: string, status?: string): Promise<any[]> {
    const conditions = [];
    if (facilityId) conditions.push(eq(doctorPayrollRecords.facilityId, facilityId));
    if (doctorId) conditions.push(eq(doctorPayrollRecords.doctorId, doctorId));
    if (status) conditions.push(eq(doctorPayrollRecords.status, status));

    const query = conditions.length > 0
      ? db.select({
          record: doctorPayrollRecords,
          doctor: healthcareDoctors,
        })
        .from(doctorPayrollRecords)
        .leftJoin(healthcareDoctors, eq(doctorPayrollRecords.doctorId, healthcareDoctors.id))
        .where(and(...conditions))
        .orderBy(desc(doctorPayrollRecords.createdAt))
      : db.select({
          record: doctorPayrollRecords,
          doctor: healthcareDoctors,
        })
        .from(doctorPayrollRecords)
        .leftJoin(healthcareDoctors, eq(doctorPayrollRecords.doctorId, healthcareDoctors.id))
        .orderBy(desc(doctorPayrollRecords.createdAt));

    return await query;
  }

  async getDoctorPayrollRecordById(id: string): Promise<DoctorPayrollRecord | undefined> {
    const result = await db.select().from(doctorPayrollRecords).where(eq(doctorPayrollRecords.id, id)).limit(1);
    return result[0];
  }

  async updateDoctorPayrollRecord(id: string, record: Partial<InsertDoctorPayrollRecord>): Promise<DoctorPayrollRecord | undefined> {
    const result = await db.update(doctorPayrollRecords)
      .set({ ...record, updatedAt: new Date() } as any)
      .where(eq(doctorPayrollRecords.id, id))
      .returning();
    return result[0];
  }

  async deleteDoctorPayrollRecord(id: string): Promise<boolean> {
    const result = await db.delete(doctorPayrollRecords).where(eq(doctorPayrollRecords.id, id)).returning();
    return result.length > 0;
  }

  async calculateDoctorEarnings(doctorId: string, startDate: Date, endDate: Date): Promise<{
    totalPatients: number;
    patientFeeEarnings: string;
    consultationRevenue: string;
    commissionEarnings: string;
  }> {
    // Get consultations for this doctor in the date range
    const doctorConsultations = await db.select()
      .from(consultations)
      .where(and(
        eq(consultations.doctorId, doctorId),
        gte(consultations.consultationDate, startDate),
        lte(consultations.consultationDate, endDate)
      ));

    // Get doctor details for fee/commission rates
    const doctor = await this.getHealthcareDoctorById(doctorId);
    if (!doctor) {
      return {
        totalPatients: 0,
        patientFeeEarnings: "0",
        consultationRevenue: "0",
        commissionEarnings: "0"
      };
    }

    const totalPatients = doctorConsultations.length;
    const perPatientFee = parseFloat(doctor.perPatientFee || "0");
    const patientFeeEarnings = (totalPatients * perPatientFee).toFixed(2);

    // Calculate consultation revenue from payments via queue entries
    let consultationRevenue = 0;
    for (const consult of doctorConsultations) {
      if (consult.queueEntryId) {
        const paymentsList = await db.select()
          .from(payments)
          .where(eq(payments.queueEntryId, consult.queueEntryId));
        
        for (const payment of paymentsList) {
          consultationRevenue += parseFloat(payment.amount || "0");
        }
      }
    }

    const commissionPercentage = parseFloat(doctor.percentageShare || "0") / 100;
    const commissionEarnings = (consultationRevenue * commissionPercentage).toFixed(2);

    return {
      totalPatients,
      patientFeeEarnings,
      consultationRevenue: consultationRevenue.toFixed(2),
      commissionEarnings
    };
  }

  // ========== Doctor Expenditure Methods ==========

  async createDoctorExpenditure(expenditure: InsertDoctorExpenditure): Promise<DoctorExpenditure> {
    const result = await db.insert(doctorExpenditures).values(expenditure as any).returning();
    return result[0];
  }

  async getDoctorExpenditures(userId?: string, doctorId?: string, organizationId?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const conditions = [];
    if (userId) conditions.push(eq(doctorExpenditures.userId, userId));
    if (doctorId) conditions.push(eq(doctorExpenditures.doctorId, doctorId));
    if (organizationId) conditions.push(eq(doctorExpenditures.organizationId, organizationId));
    if (startDate) conditions.push(gte(doctorExpenditures.expenditureDate, startDate));
    if (endDate) conditions.push(lte(doctorExpenditures.expenditureDate, endDate));

    const query = conditions.length > 0
      ? db.select({
          expenditure: doctorExpenditures,
          doctor: doctors,
          product: products,
        })
        .from(doctorExpenditures)
        .leftJoin(doctors, eq(doctorExpenditures.doctorId, doctors.id))
        .leftJoin(products, eq(doctorExpenditures.productId, products.id))
        .where(and(...conditions))
        .orderBy(desc(doctorExpenditures.createdAt))
      : db.select({
          expenditure: doctorExpenditures,
          doctor: doctors,
          product: products,
        })
        .from(doctorExpenditures)
        .leftJoin(doctors, eq(doctorExpenditures.doctorId, doctors.id))
        .leftJoin(products, eq(doctorExpenditures.productId, products.id))
        .orderBy(desc(doctorExpenditures.createdAt));

    return await query;
  }

  async getDoctorExpenditureById(id: string): Promise<DoctorExpenditure | undefined> {
    const result = await db.select().from(doctorExpenditures).where(eq(doctorExpenditures.id, id)).limit(1);
    return result[0];
  }

  async updateDoctorExpenditure(id: string, expenditure: Partial<InsertDoctorExpenditure>): Promise<DoctorExpenditure | undefined> {
    const result = await db.update(doctorExpenditures)
      .set({ ...expenditure, updatedAt: new Date() } as any)
      .where(eq(doctorExpenditures.id, id))
      .returning();
    return result[0];
  }

  async deleteDoctorExpenditure(id: string): Promise<boolean> {
    const result = await db.delete(doctorExpenditures).where(eq(doctorExpenditures.id, id)).returning();
    return result.length > 0;
  }

  async getDoctorExpenditureSummary(doctorId?: string, organizationId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalAmount: string;
    byCategory: Record<string, string>;
  }> {
    const expendituresList = await this.getDoctorExpenditures(undefined, doctorId, organizationId, startDate, endDate);
    
    let totalAmount = 0;
    const byCategory: Record<string, number> = {};

    for (const { expenditure } of expendituresList) {
      const amount = parseFloat(expenditure.amount || "0");
      totalAmount += amount;
      
      const category = expenditure.category;
      byCategory[category] = (byCategory[category] || 0) + amount;
    }

    const byCategoryStr: Record<string, string> = {};
    for (const [key, value] of Object.entries(byCategory)) {
      byCategoryStr[key] = value.toFixed(2);
    }

    return {
      totalAmount: totalAmount.toFixed(2),
      byCategory: byCategoryStr
    };
  }

  // ========== Centralized Person Master Implementation ==========

  async createPerson(person: InsertPerson): Promise<Person> {
    const result = await db.insert(persons).values(person as any).returning();
    return result[0];
  }

  async getPersons(organizationId?: string, searchTerm?: string): Promise<Person[]> {
    const conditions = [];
    
    if (searchTerm) {
      conditions.push(
        or(
          like(persons.firstName, `%${searchTerm}%`),
          like(persons.lastName, `%${searchTerm}%`),
          like(persons.cnic, `%${searchTerm}%`),
          like(persons.phone, `%${searchTerm}%`)
        )
      );
    }

    const query = conditions.length > 0
      ? db.select().from(persons).where(and(...conditions)).orderBy(desc(persons.createdAt))
      : db.select().from(persons).orderBy(desc(persons.createdAt));

    return await query;
  }

  async getPersonById(id: string): Promise<Person | undefined> {
    const result = await db.select().from(persons).where(eq(persons.id, id)).limit(1);
    return result[0];
  }

  async getPersonByCnic(cnic: string): Promise<Person | undefined> {
    const result = await db.select().from(persons).where(eq(persons.cnic, cnic)).limit(1);
    return result[0];
  }

  async getPersonByPhone(phone: string): Promise<Person | undefined> {
    const result = await db.select().from(persons).where(eq(persons.phone, phone)).limit(1);
    return result[0];
  }

  async findOrCreatePerson(data: { cnic?: string; phone?: string; firstName: string; lastName?: string; createdBy?: string }): Promise<Person> {
    // Try to find by CNIC first
    if (data.cnic) {
      const existingByCnic = await this.getPersonByCnic(data.cnic);
      if (existingByCnic) return existingByCnic;
    }
    
    // Try to find by phone if no CNIC match
    if (data.phone) {
      const existingByPhone = await this.getPersonByPhone(data.phone);
      if (existingByPhone) return existingByPhone;
    }
    
    // Create new person
    return await this.createPerson({
      cnic: data.cnic,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      createdBy: data.createdBy,
    });
  }

  async updatePerson(id: string, person: Partial<InsertPerson>): Promise<Person | undefined> {
    const result = await db.update(persons)
      .set({ ...person, updatedAt: new Date() } as any)
      .where(eq(persons.id, id))
      .returning();
    return result[0];
  }

  async deletePerson(id: string): Promise<boolean> {
    const result = await db.delete(persons).where(eq(persons.id, id)).returning();
    return result.length > 0;
  }

  // Person context methods
  async createPersonContext(context: InsertPersonContext): Promise<PersonContext> {
    const result = await db.insert(personContexts).values(context as any).returning();
    return result[0];
  }

  async getPersonContexts(personId?: string, organizationId?: string, roleType?: string): Promise<PersonContext[]> {
    const conditions = [];
    
    if (personId) conditions.push(eq(personContexts.personId, personId));
    if (organizationId) conditions.push(eq(personContexts.organizationId, organizationId));
    if (roleType) conditions.push(eq(personContexts.roleType, roleType));

    const query = conditions.length > 0
      ? db.select().from(personContexts).where(and(...conditions)).orderBy(desc(personContexts.createdAt))
      : db.select().from(personContexts).orderBy(desc(personContexts.createdAt));

    return await query;
  }

  async getPersonContextById(id: string): Promise<PersonContext | undefined> {
    const result = await db.select().from(personContexts).where(eq(personContexts.id, id)).limit(1);
    return result[0];
  }

  async updatePersonContext(id: string, context: Partial<InsertPersonContext>): Promise<PersonContext | undefined> {
    const result = await db.update(personContexts)
      .set({ ...context, updatedAt: new Date() } as any)
      .where(eq(personContexts.id, id))
      .returning();
    return result[0];
  }

  async terminatePersonContext(id: string, terminationDate: Date, terminationReason: string): Promise<PersonContext | undefined> {
    const result = await db.update(personContexts)
      .set({ 
        terminationDate, 
        terminationReason, 
        status: 'terminated',
        updatedAt: new Date() 
      })
      .where(eq(personContexts.id, id))
      .returning();
    return result[0];
  }

  async getPersonsWithRole(organizationId: string, roleType: string): Promise<Array<Person & { context: PersonContext }>> {
    // Join persons with personContexts filtered by organization and role
    const results = await db
      .select({
        person: persons,
        context: personContexts
      })
      .from(persons)
      .innerJoin(personContexts, eq(persons.id, personContexts.personId))
      .where(
        and(
          eq(personContexts.organizationId, organizationId),
          eq(personContexts.roleType, roleType),
          eq(personContexts.status, 'active')
        )
      )
      .orderBy(desc(personContexts.createdAt));
    
    return results.map(r => ({
      ...r.person,
      context: r.context
    }));
  }

  // ========== Queue Management Implementation ==========

  async createQueueDefinition(definition: InsertQueueDefinition): Promise<QueueDefinition> {
    const result = await db.insert(queueDefinitions).values(definition).returning();
    return result[0];
  }

  async getQueueDefinitions(organizationId?: string, facilityId?: string): Promise<QueueDefinition[]> {
    const conditions = [];
    
    if (organizationId) conditions.push(eq(queueDefinitions.organizationId, organizationId));
    if (facilityId) conditions.push(eq(queueDefinitions.facilityId, facilityId));

    const query = conditions.length > 0
      ? db.select().from(queueDefinitions).where(and(...conditions)).orderBy(desc(queueDefinitions.createdAt))
      : db.select().from(queueDefinitions).orderBy(desc(queueDefinitions.createdAt));

    return await query;
  }

  async getQueueDefinitionById(id: string): Promise<QueueDefinition | undefined> {
    const result = await db.select().from(queueDefinitions).where(eq(queueDefinitions.id, id)).limit(1);
    return result[0];
  }

  async updateQueueDefinition(id: string, definition: Partial<InsertQueueDefinition>): Promise<QueueDefinition | undefined> {
    const result = await db.update(queueDefinitions)
      .set({ ...definition, updatedAt: new Date() })
      .where(eq(queueDefinitions.id, id))
      .returning();
    return result[0];
  }

  async deleteQueueDefinition(id: string): Promise<boolean> {
    const result = await db.delete(queueDefinitions).where(eq(queueDefinitions.id, id)).returning();
    return result.length > 0;
  }

  async getOrCreateQueueDayState(queueDefinitionId: string, queueDate: Date): Promise<QueueDayState> {
    // Normalize date to start of day
    const normalizedDate = new Date(queueDate);
    normalizedDate.setHours(0, 0, 0, 0);

    // Try to find existing state for this queue and date
    const existing = await db.select()
      .from(queueDayStates)
      .where(
        and(
          eq(queueDayStates.queueDefinitionId, queueDefinitionId),
          gte(queueDayStates.queueDate, normalizedDate),
          lte(queueDayStates.queueDate, new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000))
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new day state (auto-reset for new day)
    const queueDef = await this.getQueueDefinitionById(queueDefinitionId);
    const result = await db.insert(queueDayStates).values({
      queueDefinitionId,
      queueDate: normalizedDate,
      currentNumber: 0,
      lastIssuedNumber: 0,
      status: 'open',
      openedAt: new Date(),
    }).returning();
    
    return result[0];
  }

  async getQueueDayStateById(id: string): Promise<QueueDayState | undefined> {
    const result = await db.select().from(queueDayStates).where(eq(queueDayStates.id, id)).limit(1);
    return result[0];
  }

  async updateQueueDayState(id: string, state: Partial<InsertQueueDayState>): Promise<QueueDayState | undefined> {
    const result = await db.update(queueDayStates)
      .set({ ...state, updatedAt: new Date() })
      .where(eq(queueDayStates.id, id))
      .returning();
    return result[0];
  }

  async issueQueueToken(token: InsertQueueToken): Promise<QueueToken> {
    // Get the queue day state to determine next token number
    const dayState = await this.getQueueDayStateById(token.queueDayStateId);
    if (!dayState) throw new Error('Queue day state not found');

    const nextNumber = dayState.lastIssuedNumber + 1;
    const queueDef = await this.getQueueDefinitionById(token.queueDefinitionId);
    const prefix = queueDef?.prefix || '';
    const tokenDisplay = prefix ? `${prefix}-${String(nextNumber).padStart(3, '0')}` : String(nextNumber).padStart(3, '0');

    // Create the token
    const result = await db.insert(queueTokens).values({
      ...token,
      tokenNumber: nextNumber,
      tokenDisplay,
    }).returning();

    // Update day state
    await this.updateQueueDayState(dayState.id, {
      lastIssuedNumber: nextNumber,
      totalTokensIssued: dayState.totalTokensIssued + 1,
    });

    return result[0];
  }

  async getQueueTokens(queueDayStateId?: string, status?: string): Promise<QueueToken[]> {
    const conditions = [];
    
    if (queueDayStateId) conditions.push(eq(queueTokens.queueDayStateId, queueDayStateId));
    if (status) conditions.push(eq(queueTokens.status, status));

    const query = conditions.length > 0
      ? db.select().from(queueTokens).where(and(...conditions)).orderBy(queueTokens.tokenNumber)
      : db.select().from(queueTokens).orderBy(queueTokens.tokenNumber);

    return await query;
  }

  async getQueueTokenById(id: string): Promise<QueueToken | undefined> {
    const result = await db.select().from(queueTokens).where(eq(queueTokens.id, id)).limit(1);
    return result[0];
  }

  async updateQueueToken(id: string, token: Partial<InsertQueueToken>): Promise<QueueToken | undefined> {
    const result = await db.update(queueTokens)
      .set({ ...token, updatedAt: new Date() })
      .where(eq(queueTokens.id, id))
      .returning();
    return result[0];
  }

  async callNextToken(queueDayStateId: string, calledBy: string): Promise<QueueToken | undefined> {
    // Find next waiting token
    const waitingTokens = await db.select()
      .from(queueTokens)
      .where(
        and(
          eq(queueTokens.queueDayStateId, queueDayStateId),
          eq(queueTokens.status, 'waiting')
        )
      )
      .orderBy(queueTokens.tokenNumber)
      .limit(1);

    if (waitingTokens.length === 0) return undefined;

    const token = waitingTokens[0];
    
    // Update token status
    const result = await db.update(queueTokens)
      .set({ 
        status: 'called', 
        calledAt: new Date(),
        calledBy,
        updatedAt: new Date() 
      })
      .where(eq(queueTokens.id, token.id))
      .returning();

    // Update day state current number
    const dayState = await this.getQueueDayStateById(queueDayStateId);
    if (dayState) {
      await this.updateQueueDayState(dayState.id, {
        currentNumber: token.tokenNumber,
      });
    }

    return result[0];
  }

  // ========== Lab Module Implementation ==========

  async createLabOrder(order: InsertLabOrder): Promise<LabOrder> {
    const result = await db.insert(labOrders).values(order).returning();
    return result[0];
  }

  async getLabOrders(labOrganizationId?: string, patientPersonId?: string, status?: string): Promise<LabOrder[]> {
    const conditions = [];
    
    if (labOrganizationId) conditions.push(eq(labOrders.labOrganizationId, labOrganizationId));
    if (patientPersonId) conditions.push(eq(labOrders.patientPersonId, patientPersonId));
    if (status) conditions.push(eq(labOrders.status, status));

    const query = conditions.length > 0
      ? db.select().from(labOrders).where(and(...conditions)).orderBy(desc(labOrders.createdAt))
      : db.select().from(labOrders).orderBy(desc(labOrders.createdAt));

    return await query;
  }

  async getLabOrderById(id: string): Promise<LabOrder | undefined> {
    const result = await db.select().from(labOrders).where(eq(labOrders.id, id)).limit(1);
    return result[0];
  }

  async updateLabOrder(id: string, order: Partial<InsertLabOrder>): Promise<LabOrder | undefined> {
    const result = await db.update(labOrders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(labOrders.id, id))
      .returning();
    return result[0];
  }

  async createLabOrderItem(item: InsertLabOrderItem): Promise<LabOrderItem> {
    const result = await db.insert(labOrderItems).values(item).returning();
    return result[0];
  }

  async getLabOrderItems(labOrderId: string): Promise<LabOrderItem[]> {
    return await db.select().from(labOrderItems).where(eq(labOrderItems.labOrderId, labOrderId));
  }

  async getLabOrderItemById(id: string): Promise<LabOrderItem | undefined> {
    const result = await db.select().from(labOrderItems).where(eq(labOrderItems.id, id)).limit(1);
    return result[0];
  }

  async updateLabOrderItem(id: string, item: Partial<InsertLabOrderItem>): Promise<LabOrderItem | undefined> {
    const result = await db.update(labOrderItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(labOrderItems.id, id))
      .returning();
    return result[0];
  }

  async createLabResult(result_data: InsertLabResult): Promise<LabResult> {
    const result = await db.insert(labResults).values(result_data).returning();
    return result[0];
  }

  async getLabResultById(id: string): Promise<LabResult | undefined> {
    const result = await db.select().from(labResults).where(eq(labResults.id, id)).limit(1);
    return result[0];
  }

  async updateLabResult(id: string, result_data: Partial<InsertLabResult>): Promise<LabResult | undefined> {
    const result = await db.update(labResults)
      .set({ ...result_data, updatedAt: new Date() })
      .where(eq(labResults.id, id))
      .returning();
    return result[0];
  }

  async createLabReport(report: InsertLabReport): Promise<LabReport> {
    const result = await db.insert(labReports).values(report).returning();
    return result[0];
  }

  async getLabReports(labOrderId?: string, patientPersonId?: string): Promise<LabReport[]> {
    const conditions = [];
    
    if (labOrderId) conditions.push(eq(labReports.labOrderId, labOrderId));
    if (patientPersonId) conditions.push(eq(labReports.patientPersonId, patientPersonId));

    const query = conditions.length > 0
      ? db.select().from(labReports).where(and(...conditions)).orderBy(desc(labReports.createdAt))
      : db.select().from(labReports).orderBy(desc(labReports.createdAt));

    return await query;
  }

  async getLabReportById(id: string): Promise<LabReport | undefined> {
    const result = await db.select().from(labReports).where(eq(labReports.id, id)).limit(1);
    return result[0];
  }

  async updateLabReport(id: string, report: Partial<InsertLabReport>): Promise<LabReport | undefined> {
    const result = await db.update(labReports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(labReports.id, id))
      .returning();
    return result[0];
  }

  // ========== Medical Store / Pharmacy Implementation ==========

  async createMedicine(medicine: InsertMedicine): Promise<Medicine> {
    const result = await db.insert(medicines).values(medicine).returning();
    return result[0];
  }

  async getMedicines(organizationId?: string, searchTerm?: string): Promise<Medicine[]> {
    const conditions = [];
    
    if (organizationId) conditions.push(eq(medicines.organizationId, organizationId));
    if (searchTerm) {
      conditions.push(
        or(
          like(medicines.name, `%${searchTerm}%`),
          like(medicines.genericName, `%${searchTerm}%`),
          like(medicines.brandName, `%${searchTerm}%`)
        )
      );
    }

    const query = conditions.length > 0
      ? db.select().from(medicines).where(and(...conditions)).orderBy(medicines.name)
      : db.select().from(medicines).orderBy(medicines.name);

    return await query;
  }

  async getMedicineById(id: string): Promise<Medicine | undefined> {
    const result = await db.select().from(medicines).where(eq(medicines.id, id)).limit(1);
    return result[0];
  }

  async updateMedicine(id: string, medicine: Partial<InsertMedicine>): Promise<Medicine | undefined> {
    const result = await db.update(medicines)
      .set({ ...medicine, updatedAt: new Date() })
      .where(eq(medicines.id, id))
      .returning();
    return result[0];
  }

  async deleteMedicine(id: string): Promise<boolean> {
    const result = await db.delete(medicines).where(eq(medicines.id, id)).returning();
    return result.length > 0;
  }

  async createMedicineStockEntry(entry: InsertMedicineStockLedger): Promise<MedicineStockLedger> {
    const result = await db.insert(medicineStockLedger).values(entry as any).returning();
    return result[0];
  }

  async getMedicineStockLedger(medicineId?: string, organizationId?: string): Promise<MedicineStockLedger[]> {
    const conditions = [];
    
    if (medicineId) conditions.push(eq(medicineStockLedger.medicineId, medicineId));
    if (organizationId) conditions.push(eq(medicineStockLedger.organizationId, organizationId));

    const query = conditions.length > 0
      ? db.select().from(medicineStockLedger).where(and(...conditions)).orderBy(desc(medicineStockLedger.transactionDate))
      : db.select().from(medicineStockLedger).orderBy(desc(medicineStockLedger.transactionDate));

    return await query;
  }

  async getMedicineCurrentStock(medicineId: string, organizationId: string): Promise<number> {
    const ledger = await this.getMedicineStockLedger(medicineId, organizationId);
    if (ledger.length === 0) return 0;
    // Get the most recent entry's new stock value
    return ledger[0].newStock;
  }

  async createPrescriptionOrder(order: InsertPrescriptionOrder): Promise<PrescriptionOrder> {
    const result = await db.insert(prescriptionOrders).values(order).returning();
    return result[0];
  }

  async getPrescriptionOrders(organizationId?: string, patientPersonId?: string, status?: string): Promise<PrescriptionOrder[]> {
    const conditions = [];
    
    if (organizationId) conditions.push(eq(prescriptionOrders.organizationId, organizationId));
    if (patientPersonId) conditions.push(eq(prescriptionOrders.patientPersonId, patientPersonId));
    if (status) conditions.push(eq(prescriptionOrders.status, status));

    const query = conditions.length > 0
      ? db.select().from(prescriptionOrders).where(and(...conditions)).orderBy(desc(prescriptionOrders.createdAt))
      : db.select().from(prescriptionOrders).orderBy(desc(prescriptionOrders.createdAt));

    return await query;
  }

  async getPrescriptionOrderById(id: string): Promise<PrescriptionOrder | undefined> {
    const result = await db.select().from(prescriptionOrders).where(eq(prescriptionOrders.id, id)).limit(1);
    return result[0];
  }

  async updatePrescriptionOrder(id: string, order: Partial<InsertPrescriptionOrder>): Promise<PrescriptionOrder | undefined> {
    const result = await db.update(prescriptionOrders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(prescriptionOrders.id, id))
      .returning();
    return result[0];
  }

  async createDispenseEvent(event: InsertDispenseEvent): Promise<DispenseEvent> {
    const result = await db.insert(dispenseEvents).values(event).returning();
    return result[0];
  }

  async getDispenseEvents(prescriptionOrderId: string): Promise<DispenseEvent[]> {
    return await db.select().from(dispenseEvents).where(eq(dispenseEvents.prescriptionOrderId, prescriptionOrderId));
  }

  // ========== Billing / Invoice Implementation ==========

  async getFacilityBillingConfig(organizationId: string): Promise<FacilityBillingConfig | undefined> {
    const result = await db.select().from(facilityBillingConfig).where(eq(facilityBillingConfig.organizationId, organizationId)).limit(1);
    return result[0];
  }

  async upsertFacilityBillingConfig(config: InsertFacilityBillingConfig): Promise<FacilityBillingConfig> {
    const existing = await this.getFacilityBillingConfig(config.organizationId);
    if (existing) {
      const result = await db.update(facilityBillingConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(facilityBillingConfig.organizationId, config.organizationId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(facilityBillingConfig).values(config as any).returning();
      return result[0];
    }
  }

  async createPatientInvoice(invoice: InsertPatientInvoice): Promise<PatientInvoice> {
    const result = await db.insert(patientInvoices).values(invoice as any).returning();
    return result[0];
  }

  async getPatientInvoices(organizationId?: string, personId?: string, status?: string): Promise<PatientInvoice[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(patientInvoices.organizationId, organizationId));
    if (personId) conditions.push(eq(patientInvoices.personId, personId));
    if (status) conditions.push(eq(patientInvoices.status, status));
    
    return conditions.length > 0
      ? await db.select().from(patientInvoices).where(and(...conditions)).orderBy(desc(patientInvoices.createdAt))
      : await db.select().from(patientInvoices).orderBy(desc(patientInvoices.createdAt));
  }

  async getPatientInvoiceById(id: string): Promise<PatientInvoice | undefined> {
    const result = await db.select().from(patientInvoices).where(eq(patientInvoices.id, id)).limit(1);
    return result[0];
  }

  async updatePatientInvoice(id: string, invoice: Partial<InsertPatientInvoice>): Promise<PatientInvoice | undefined> {
    const result = await db.update(patientInvoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(patientInvoices.id, id))
      .returning();
    return result[0];
  }

  async getNextInvoiceNumber(organizationId: string): Promise<string> {
    const config = await this.getFacilityBillingConfig(organizationId);
    const prefix = config?.invoicePrefix || "INV";
    const startNum = config?.invoiceStartNumber || 1;
    
    const lastInvoice = await db.select()
      .from(patientInvoices)
      .where(eq(patientInvoices.organizationId, organizationId))
      .orderBy(desc(patientInvoices.createdAt))
      .limit(1);
    
    let nextNum = startNum;
    if (lastInvoice.length > 0 && lastInvoice[0].invoiceNumber) {
      const match = lastInvoice[0].invoiceNumber.match(/(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `${prefix}-${dateStr}-${String(nextNum).padStart(5, '0')}`;
  }

  // ========== Data Transfer Governance Implementation ==========

  async createDataTransferRequest(request: InsertDataTransferRequest): Promise<DataTransferRequest> {
    const result = await db.insert(dataTransferRequests).values(request as any).returning();
    return result[0];
  }

  async getDataTransferRequests(requestedBy?: string, status?: string): Promise<DataTransferRequest[]> {
    const conditions = [];
    
    if (requestedBy) conditions.push(eq(dataTransferRequests.requestedBy, requestedBy));
    if (status) conditions.push(eq(dataTransferRequests.status, status));

    const query = conditions.length > 0
      ? db.select().from(dataTransferRequests).where(and(...conditions)).orderBy(desc(dataTransferRequests.createdAt))
      : db.select().from(dataTransferRequests).orderBy(desc(dataTransferRequests.createdAt));

    return await query;
  }

  async getDataTransferRequestById(id: string): Promise<DataTransferRequest | undefined> {
    const result = await db.select().from(dataTransferRequests).where(eq(dataTransferRequests.id, id)).limit(1);
    return result[0];
  }

  async updateDataTransferRequest(id: string, request: Partial<InsertDataTransferRequest>): Promise<DataTransferRequest | undefined> {
    const result = await db.update(dataTransferRequests)
      .set({ ...request, updatedAt: new Date() } as any)
      .where(eq(dataTransferRequests.id, id))
      .returning();
    return result[0];
  }

  async approveDataTransferRequest(id: string, reviewedBy: string, reviewNotes?: string): Promise<DataTransferRequest | undefined> {
    const result = await db.update(dataTransferRequests)
      .set({ 
        status: 'approved',
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
        approvalExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        updatedAt: new Date() 
      })
      .where(eq(dataTransferRequests.id, id))
      .returning();
    return result[0];
  }

  async rejectDataTransferRequest(id: string, reviewedBy: string, rejectionReason: string): Promise<DataTransferRequest | undefined> {
    const result = await db.update(dataTransferRequests)
      .set({ 
        status: 'rejected',
        reviewedBy,
        reviewedAt: new Date(),
        rejectionReason,
        updatedAt: new Date() 
      })
      .where(eq(dataTransferRequests.id, id))
      .returning();
    return result[0];
  }

  // ========== Audit Log Implementation ==========

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  async getAuditLogs(actorUserId?: string, targetType?: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]> {
    const conditions = [];
    
    if (actorUserId) conditions.push(eq(auditLogs.actorUserId, actorUserId));
    if (targetType) conditions.push(eq(auditLogs.targetType, targetType));
    if (startDate) conditions.push(gte(auditLogs.createdAt, startDate));
    if (endDate) conditions.push(lte(auditLogs.createdAt, endDate));

    const query = conditions.length > 0
      ? db.select().from(auditLogs).where(and(...conditions)).orderBy(desc(auditLogs.createdAt)).limit(1000)
      : db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1000);

    return await query;
  }

  // ========== HR/Payroll/Accounts Implementation ==========

  // Payslip Template Methods
  async createPayslipTemplate(template: InsertPayslipTemplate): Promise<PayslipTemplate> {
    const result = await db.insert(payslipTemplates).values(template as any).returning();
    return result[0];
  }

  async getPayslipTemplates(organizationId?: string, isActive?: boolean): Promise<PayslipTemplate[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(payslipTemplates.organizationId, organizationId));
    if (isActive !== undefined) conditions.push(eq(payslipTemplates.isActive, isActive));
    
    const query = conditions.length > 0
      ? db.select().from(payslipTemplates).where(and(...conditions)).orderBy(desc(payslipTemplates.createdAt))
      : db.select().from(payslipTemplates).orderBy(desc(payslipTemplates.createdAt));
    return await query;
  }

  async getPayslipTemplateById(id: string): Promise<PayslipTemplate | undefined> {
    const result = await db.select().from(payslipTemplates).where(eq(payslipTemplates.id, id)).limit(1);
    return result[0];
  }

  async updatePayslipTemplate(id: string, template: Partial<InsertPayslipTemplate>): Promise<PayslipTemplate | undefined> {
    const result = await db.update(payslipTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(payslipTemplates.id, id))
      .returning();
    return result[0];
  }

  async deletePayslipTemplate(id: string): Promise<boolean> {
    const result = await db.delete(payslipTemplates).where(eq(payslipTemplates.id, id)).returning();
    return result.length > 0;
  }

  async createPayslipTemplateVersion(id: string, template: Partial<InsertPayslipTemplate>): Promise<PayslipTemplate> {
    const existing = await this.getPayslipTemplateById(id);
    if (!existing) throw new Error("Template not found");
    
    // Create new version
    const newTemplate = {
      ...existing,
      ...template,
      version: existing.version + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    delete (newTemplate as any).id;
    
    const result = await db.insert(payslipTemplates).values(newTemplate as any).returning();
    return result[0];
  }

  // Attendance Source Methods
  async createAttendanceSource(source: InsertAttendanceSource): Promise<AttendanceSource> {
    const result = await db.insert(attendanceSources).values(source as any).returning();
    return result[0];
  }

  async getAttendanceSources(organizationId?: string, isActive?: boolean): Promise<AttendanceSource[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(attendanceSources.organizationId, organizationId));
    if (isActive !== undefined) conditions.push(eq(attendanceSources.isActive, isActive));
    
    const query = conditions.length > 0
      ? db.select().from(attendanceSources).where(and(...conditions)).orderBy(desc(attendanceSources.createdAt))
      : db.select().from(attendanceSources).orderBy(desc(attendanceSources.createdAt));
    return await query;
  }

  async getAttendanceSourceById(id: string): Promise<AttendanceSource | undefined> {
    const result = await db.select().from(attendanceSources).where(eq(attendanceSources.id, id)).limit(1);
    return result[0];
  }

  async updateAttendanceSource(id: string, source: Partial<InsertAttendanceSource>): Promise<AttendanceSource | undefined> {
    const result = await db.update(attendanceSources)
      .set({ ...source, updatedAt: new Date() })
      .where(eq(attendanceSources.id, id))
      .returning();
    return result[0];
  }

  async deleteAttendanceSource(id: string): Promise<boolean> {
    const result = await db.delete(attendanceSources).where(eq(attendanceSources.id, id)).returning();
    return result.length > 0;
  }

  // Shift Definition Methods
  async createShiftDefinition(shift: InsertShiftDefinition): Promise<ShiftDefinition> {
    const result = await db.insert(shiftDefinitions).values(shift as any).returning();
    return result[0];
  }

  async getShiftDefinitions(organizationId?: string, isActive?: boolean): Promise<ShiftDefinition[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(shiftDefinitions.organizationId, organizationId));
    if (isActive !== undefined) conditions.push(eq(shiftDefinitions.isActive, isActive));
    
    const query = conditions.length > 0
      ? db.select().from(shiftDefinitions).where(and(...conditions)).orderBy(desc(shiftDefinitions.createdAt))
      : db.select().from(shiftDefinitions).orderBy(desc(shiftDefinitions.createdAt));
    return await query;
  }

  async getShiftDefinitionById(id: string): Promise<ShiftDefinition | undefined> {
    const result = await db.select().from(shiftDefinitions).where(eq(shiftDefinitions.id, id)).limit(1);
    return result[0];
  }

  async updateShiftDefinition(id: string, shift: Partial<InsertShiftDefinition>): Promise<ShiftDefinition | undefined> {
    const result = await db.update(shiftDefinitions)
      .set({ ...shift, updatedAt: new Date() })
      .where(eq(shiftDefinitions.id, id))
      .returning();
    return result[0];
  }

  async deleteShiftDefinition(id: string): Promise<boolean> {
    const result = await db.delete(shiftDefinitions).where(eq(shiftDefinitions.id, id)).returning();
    return result.length > 0;
  }

  // Shift Assignment Methods
  async createShiftAssignment(assignment: InsertShiftAssignment): Promise<ShiftAssignment> {
    const result = await db.insert(shiftAssignments).values(assignment as any).returning();
    return result[0];
  }

  async getShiftAssignments(personContextId?: string, shiftId?: string): Promise<ShiftAssignment[]> {
    const conditions = [];
    if (personContextId) conditions.push(eq(shiftAssignments.personContextId, personContextId));
    if (shiftId) conditions.push(eq(shiftAssignments.shiftId, shiftId));
    
    const query = conditions.length > 0
      ? db.select().from(shiftAssignments).where(and(...conditions)).orderBy(desc(shiftAssignments.createdAt))
      : db.select().from(shiftAssignments).orderBy(desc(shiftAssignments.createdAt));
    return await query;
  }

  async getShiftAssignmentById(id: string): Promise<ShiftAssignment | undefined> {
    const result = await db.select().from(shiftAssignments).where(eq(shiftAssignments.id, id)).limit(1);
    return result[0];
  }

  async updateShiftAssignment(id: string, assignment: Partial<InsertShiftAssignment>): Promise<ShiftAssignment | undefined> {
    const result = await db.update(shiftAssignments)
      .set(assignment)
      .where(eq(shiftAssignments.id, id))
      .returning();
    return result[0];
  }

  // Overtime Rule Methods
  async createOvertimeRule(rule: InsertOvertimeRule): Promise<OvertimeRule> {
    const result = await db.insert(overtimeRules).values(rule as any).returning();
    return result[0];
  }

  async getOvertimeRules(organizationId?: string, isActive?: boolean): Promise<OvertimeRule[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(overtimeRules.organizationId, organizationId));
    if (isActive !== undefined) conditions.push(eq(overtimeRules.isActive, isActive));
    
    const query = conditions.length > 0
      ? db.select().from(overtimeRules).where(and(...conditions)).orderBy(desc(overtimeRules.createdAt))
      : db.select().from(overtimeRules).orderBy(desc(overtimeRules.createdAt));
    return await query;
  }

  async getOvertimeRuleById(id: string): Promise<OvertimeRule | undefined> {
    const result = await db.select().from(overtimeRules).where(eq(overtimeRules.id, id)).limit(1);
    return result[0];
  }

  async updateOvertimeRule(id: string, rule: Partial<InsertOvertimeRule>): Promise<OvertimeRule | undefined> {
    const result = await db.update(overtimeRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(overtimeRules.id, id))
      .returning();
    return result[0];
  }

  async deleteOvertimeRule(id: string): Promise<boolean> {
    const result = await db.delete(overtimeRules).where(eq(overtimeRules.id, id)).returning();
    return result.length > 0;
  }

  // Attendance Log Methods
  async createAttendanceLog(log: InsertAttendanceLog): Promise<AttendanceLog> {
    const result = await db.insert(attendanceLogs).values(log as any).returning();
    return result[0];
  }

  async getAttendanceLogs(organizationId?: string, personId?: string, startDate?: Date, endDate?: Date): Promise<AttendanceLog[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(attendanceLogs.organizationId, organizationId));
    if (personId) conditions.push(eq(attendanceLogs.personId, personId));
    if (startDate) conditions.push(gte(attendanceLogs.attendanceDate, startDate));
    if (endDate) conditions.push(lte(attendanceLogs.attendanceDate, endDate));
    
    const query = conditions.length > 0
      ? db.select().from(attendanceLogs).where(and(...conditions)).orderBy(desc(attendanceLogs.attendanceDate))
      : db.select().from(attendanceLogs).orderBy(desc(attendanceLogs.attendanceDate));
    return await query;
  }

  async getAttendanceLogById(id: string): Promise<AttendanceLog | undefined> {
    const result = await db.select().from(attendanceLogs).where(eq(attendanceLogs.id, id)).limit(1);
    return result[0];
  }

  async updateAttendanceLog(id: string, log: Partial<InsertAttendanceLog>): Promise<AttendanceLog | undefined> {
    const result = await db.update(attendanceLogs)
      .set({ ...log, updatedAt: new Date() })
      .where(eq(attendanceLogs.id, id))
      .returning();
    return result[0];
  }

  async normalizeAttendanceLog(id: string, shiftId: string): Promise<AttendanceLog | undefined> {
    const log = await this.getAttendanceLogById(id);
    const shift = await this.getShiftDefinitionById(shiftId);
    if (!log || !shift) return undefined;

    // Calculate normalized hours based on shift
    const punchIn = log.punchIn;
    const punchOut = log.punchOut;
    
    if (!punchOut) return log;

    const totalMinutes = (punchOut.getTime() - punchIn.getTime()) / 60000;
    const breakMinutes = shift.breakDurationMinutes || 0;
    const regularMinutes = totalMinutes - breakMinutes;
    const regularHours = Math.max(0, regularMinutes / 60);
    const standardHours = parseFloat(shift.standardWorkingHours?.toString() || "8");
    const overtimeHours = Math.max(0, regularHours - standardHours);

    // Check for late arrival
    const shiftStart = new Date(punchIn);
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    shiftStart.setHours(startHour, startMin, 0, 0);
    const lateGrace = shift.lateGraceMinutes || 15;
    const lateMinutes = Math.max(0, (punchIn.getTime() - shiftStart.getTime()) / 60000 - lateGrace);
    const isLate = lateMinutes > 0;

    // Check for early leave
    const shiftEnd = new Date(punchIn);
    const [endHour, endMin] = shift.endTime.split(':').map(Number);
    shiftEnd.setHours(endHour, endMin, 0, 0);
    const earlyGrace = shift.earlyLeaveGraceMinutes || 15;
    const earlyLeaveMinutes = Math.max(0, (shiftEnd.getTime() - punchOut.getTime()) / 60000 - earlyGrace);
    const isEarlyLeave = earlyLeaveMinutes > 0;

    return await this.updateAttendanceLog(id, {
      shiftId,
      normalizedHours: regularHours.toFixed(2),
      regularHours: Math.min(regularHours, standardHours).toFixed(2),
      overtimeHours: overtimeHours.toFixed(2),
      isLate,
      lateMinutes: Math.round(lateMinutes),
      isEarlyLeave,
      earlyLeaveMinutes: Math.round(earlyLeaveMinutes),
      isValid: true
    });
  }

  // Attendance Exception Methods
  async createAttendanceException(exception: InsertAttendanceException): Promise<AttendanceException> {
    const result = await db.insert(attendanceExceptions).values(exception as any).returning();
    return result[0];
  }

  async getAttendanceExceptions(organizationId?: string, personId?: string, status?: string): Promise<AttendanceException[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(attendanceExceptions.organizationId, organizationId));
    if (personId) conditions.push(eq(attendanceExceptions.personId, personId));
    if (status) conditions.push(eq(attendanceExceptions.status, status));
    
    const query = conditions.length > 0
      ? db.select().from(attendanceExceptions).where(and(...conditions)).orderBy(desc(attendanceExceptions.createdAt))
      : db.select().from(attendanceExceptions).orderBy(desc(attendanceExceptions.createdAt));
    return await query;
  }

  async getAttendanceExceptionById(id: string): Promise<AttendanceException | undefined> {
    const result = await db.select().from(attendanceExceptions).where(eq(attendanceExceptions.id, id)).limit(1);
    return result[0];
  }

  async updateAttendanceException(id: string, exception: Partial<InsertAttendanceException>): Promise<AttendanceException | undefined> {
    const result = await db.update(attendanceExceptions)
      .set({ ...exception, updatedAt: new Date() })
      .where(eq(attendanceExceptions.id, id))
      .returning();
    return result[0];
  }

  // Salary Structure Methods
  async createSalaryStructure(structure: InsertSalaryStructure): Promise<SalaryStructure> {
    const result = await db.insert(salaryStructures).values(structure as any).returning();
    return result[0];
  }

  async getSalaryStructures(organizationId?: string, personContextId?: string, isActive?: boolean): Promise<SalaryStructure[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(salaryStructures.organizationId, organizationId));
    if (personContextId) conditions.push(eq(salaryStructures.personContextId, personContextId));
    if (isActive !== undefined) conditions.push(eq(salaryStructures.isActive, isActive));
    
    const query = conditions.length > 0
      ? db.select().from(salaryStructures).where(and(...conditions)).orderBy(desc(salaryStructures.createdAt))
      : db.select().from(salaryStructures).orderBy(desc(salaryStructures.createdAt));
    return await query;
  }

  async getSalaryStructureById(id: string): Promise<SalaryStructure | undefined> {
    const result = await db.select().from(salaryStructures).where(eq(salaryStructures.id, id)).limit(1);
    return result[0];
  }

  async updateSalaryStructure(id: string, structure: Partial<InsertSalaryStructure>): Promise<SalaryStructure | undefined> {
    const result = await db.update(salaryStructures)
      .set({ ...structure, updatedAt: new Date() })
      .where(eq(salaryStructures.id, id))
      .returning();
    return result[0];
  }

  async getActiveSalaryStructure(personContextId: string): Promise<SalaryStructure | undefined> {
    const result = await db.select().from(salaryStructures)
      .where(and(
        eq(salaryStructures.personContextId, personContextId),
        eq(salaryStructures.isActive, true),
        or(
          isNull(salaryStructures.effectiveTo),
          gte(salaryStructures.effectiveTo, new Date())
        )
      ))
      .orderBy(desc(salaryStructures.effectiveFrom))
      .limit(1);
    return result[0];
  }

  // Salary Component Methods
  async createSalaryComponent(component: InsertSalaryComponent): Promise<SalaryComponent> {
    const result = await db.insert(salaryComponents).values(component as any).returning();
    return result[0];
  }

  async getSalaryComponents(salaryStructureId: string): Promise<SalaryComponent[]> {
    return await db.select().from(salaryComponents)
      .where(eq(salaryComponents.salaryStructureId, salaryStructureId));
  }

  async getSalaryComponentById(id: string): Promise<SalaryComponent | undefined> {
    const result = await db.select().from(salaryComponents).where(eq(salaryComponents.id, id)).limit(1);
    return result[0];
  }

  async updateSalaryComponent(id: string, component: Partial<InsertSalaryComponent>): Promise<SalaryComponent | undefined> {
    const result = await db.update(salaryComponents)
      .set(component)
      .where(eq(salaryComponents.id, id))
      .returning();
    return result[0];
  }

  async deleteSalaryComponent(id: string): Promise<boolean> {
    const result = await db.delete(salaryComponents).where(eq(salaryComponents.id, id)).returning();
    return result.length > 0;
  }

  // Payroll Run Methods
  async createPayrollRun(run: InsertPayrollRun): Promise<PayrollRun> {
    const result = await db.insert(payrollRuns).values(run as any).returning();
    return result[0];
  }

  async getPayrollRuns(organizationId?: string, status?: string, fiscalYear?: string): Promise<PayrollRun[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(payrollRuns.organizationId, organizationId));
    if (status) conditions.push(eq(payrollRuns.status, status));
    if (fiscalYear) conditions.push(eq(payrollRuns.fiscalYear, fiscalYear));
    
    const query = conditions.length > 0
      ? db.select().from(payrollRuns).where(and(...conditions)).orderBy(desc(payrollRuns.createdAt))
      : db.select().from(payrollRuns).orderBy(desc(payrollRuns.createdAt));
    return await query;
  }

  async getPayrollRunById(id: string): Promise<PayrollRun | undefined> {
    const result = await db.select().from(payrollRuns).where(eq(payrollRuns.id, id)).limit(1);
    return result[0];
  }

  async updatePayrollRun(id: string, run: Partial<InsertPayrollRun>): Promise<PayrollRun | undefined> {
    const result = await db.update(payrollRuns)
      .set({ ...run, updatedAt: new Date() })
      .where(eq(payrollRuns.id, id))
      .returning();
    return result[0];
  }

  async calculatePayrollRun(id: string, calculatedBy: string): Promise<PayrollRun | undefined> {
    const run = await this.getPayrollRunById(id);
    if (!run) return undefined;

    // Update status to calculating
    await this.updatePayrollRun(id, { status: 'calculating' } as any);

    // Get all payslips for this run
    const payslipList = await this.getPayslips(id);
    
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalTax = 0;

    for (const payslip of payslipList) {
      totalGross += parseFloat(payslip.grossPay?.toString() || '0');
      totalDeductions += parseFloat(payslip.totalDeductions?.toString() || '0');
      totalNet += parseFloat(payslip.netPay?.toString() || '0');
      totalTax += parseFloat(payslip.incomeTax?.toString() || '0');
    }

    return await this.updatePayrollRun(id, {
      status: 'review',
      totalGrossPay: totalGross.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      totalNetPay: totalNet.toFixed(2),
      totalTax: totalTax.toFixed(2),
      employeeCount: payslipList.length,
      calculatedAt: new Date(),
      calculatedBy
    } as any);
  }

  async approvePayrollRun(id: string, approvedBy: string): Promise<PayrollRun | undefined> {
    return await this.updatePayrollRun(id, {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy
    } as any);
  }

  async finalizePayrollRun(id: string, finalizedBy: string): Promise<PayrollRun | undefined> {
    return await this.updatePayrollRun(id, {
      status: 'finalized',
      finalizedAt: new Date(),
      finalizedBy
    } as any);
  }

  // Payslip Methods
  async createPayslip(payslip: InsertPayslip): Promise<Payslip> {
    const result = await db.insert(payslips).values(payslip as any).returning();
    return result[0];
  }

  async getPayslips(payrollRunId?: string, personId?: string): Promise<Payslip[]> {
    const conditions = [];
    if (payrollRunId) conditions.push(eq(payslips.payrollRunId, payrollRunId));
    if (personId) conditions.push(eq(payslips.personId, personId));
    
    const query = conditions.length > 0
      ? db.select().from(payslips).where(and(...conditions)).orderBy(desc(payslips.createdAt))
      : db.select().from(payslips).orderBy(desc(payslips.createdAt));
    return await query;
  }

  async getPayslipById(id: string): Promise<Payslip | undefined> {
    const result = await db.select().from(payslips).where(eq(payslips.id, id)).limit(1);
    return result[0];
  }

  async updatePayslip(id: string, payslip: Partial<InsertPayslip>): Promise<Payslip | undefined> {
    const result = await db.update(payslips)
      .set({ ...payslip, updatedAt: new Date() })
      .where(eq(payslips.id, id))
      .returning();
    return result[0];
  }

  // Payslip Item Methods
  async createPayslipItem(item: InsertPayslipItem): Promise<PayslipItem> {
    const result = await db.insert(payslipItems).values(item as any).returning();
    return result[0];
  }

  async getPayslipItems(payslipId: string): Promise<PayslipItem[]> {
    return await db.select().from(payslipItems)
      .where(eq(payslipItems.payslipId, payslipId))
      .orderBy(payslipItems.sortOrder);
  }

  async getPayslipItemById(id: string): Promise<PayslipItem | undefined> {
    const result = await db.select().from(payslipItems).where(eq(payslipItems.id, id)).limit(1);
    return result[0];
  }

  async updatePayslipItem(id: string, item: Partial<InsertPayslipItem>): Promise<PayslipItem | undefined> {
    const result = await db.update(payslipItems)
      .set(item)
      .where(eq(payslipItems.id, id))
      .returning();
    return result[0];
  }

  async deletePayslipItem(id: string): Promise<boolean> {
    const result = await db.delete(payslipItems).where(eq(payslipItems.id, id)).returning();
    return result.length > 0;
  }

  // Ledger Account Methods
  async createLedgerAccount(account: InsertLedgerAccount): Promise<LedgerAccount> {
    const result = await db.insert(ledgerAccounts).values(account as any).returning();
    return result[0];
  }

  async getLedgerAccounts(organizationId?: string, accountType?: string): Promise<LedgerAccount[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(ledgerAccounts.organizationId, organizationId));
    if (accountType) conditions.push(eq(ledgerAccounts.accountType, accountType));
    
    const query = conditions.length > 0
      ? db.select().from(ledgerAccounts).where(and(...conditions)).orderBy(ledgerAccounts.accountCode)
      : db.select().from(ledgerAccounts).orderBy(ledgerAccounts.accountCode);
    return await query;
  }

  async getLedgerAccountById(id: string): Promise<LedgerAccount | undefined> {
    const result = await db.select().from(ledgerAccounts).where(eq(ledgerAccounts.id, id)).limit(1);
    return result[0];
  }

  async getLedgerAccountByCode(organizationId: string, accountCode: string): Promise<LedgerAccount | undefined> {
    const result = await db.select().from(ledgerAccounts)
      .where(and(
        eq(ledgerAccounts.organizationId, organizationId),
        eq(ledgerAccounts.accountCode, accountCode)
      ))
      .limit(1);
    return result[0];
  }

  async updateLedgerAccount(id: string, account: Partial<InsertLedgerAccount>): Promise<LedgerAccount | undefined> {
    const result = await db.update(ledgerAccounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(ledgerAccounts.id, id))
      .returning();
    return result[0];
  }

  async deleteLedgerAccount(id: string): Promise<boolean> {
    const result = await db.delete(ledgerAccounts).where(eq(ledgerAccounts.id, id)).returning();
    return result.length > 0;
  }

  // Journal Entry Methods
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const result = await db.insert(journalEntries).values(entry as any).returning();
    return result[0];
  }

  async getJournalEntries(organizationId?: string, sourceType?: string, startDate?: Date, endDate?: Date): Promise<JournalEntry[]> {
    const conditions = [];
    if (organizationId) conditions.push(eq(journalEntries.organizationId, organizationId));
    if (sourceType) conditions.push(eq(journalEntries.sourceType, sourceType));
    if (startDate) conditions.push(gte(journalEntries.entryDate, startDate));
    if (endDate) conditions.push(lte(journalEntries.entryDate, endDate));
    
    const query = conditions.length > 0
      ? db.select().from(journalEntries).where(and(...conditions)).orderBy(desc(journalEntries.entryDate))
      : db.select().from(journalEntries).orderBy(desc(journalEntries.entryDate));
    return await query;
  }

  async getJournalEntryById(id: string): Promise<JournalEntry | undefined> {
    const result = await db.select().from(journalEntries).where(eq(journalEntries.id, id)).limit(1);
    return result[0];
  }

  async updateJournalEntry(id: string, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const result = await db.update(journalEntries)
      .set({ ...entry, updatedAt: new Date() })
      .where(eq(journalEntries.id, id))
      .returning();
    return result[0];
  }

  async postJournalEntry(id: string, postedBy: string): Promise<JournalEntry | undefined> {
    const entry = await this.getJournalEntryById(id);
    if (!entry) return undefined;

    // Update ledger balances
    const lines = await this.getJournalLines(id);
    for (const line of lines) {
      const account = await this.getLedgerAccountById(line.accountId);
      if (account) {
        const debit = parseFloat(line.debitAmount?.toString() || '0');
        const credit = parseFloat(line.creditAmount?.toString() || '0');
        const currentBalance = parseFloat(account.currentBalance?.toString() || '0');
        
        let newBalance = currentBalance;
        if (account.normalBalance === 'debit') {
          newBalance = currentBalance + debit - credit;
        } else {
          newBalance = currentBalance + credit - debit;
        }
        
        await this.updateLedgerAccount(account.id, { currentBalance: newBalance.toFixed(2) });
      }
    }

    return await this.updateJournalEntry(id, {
      status: 'posted',
      postedAt: new Date(),
      postedBy
    } as any);
  }

  async reverseJournalEntry(id: string, reversedBy: string): Promise<JournalEntry | undefined> {
    const entry = await this.getJournalEntryById(id);
    if (!entry || entry.status !== 'posted') return undefined;

    // Reverse ledger balances
    const lines = await this.getJournalLines(id);
    for (const line of lines) {
      const account = await this.getLedgerAccountById(line.accountId);
      if (account) {
        const debit = parseFloat(line.debitAmount?.toString() || '0');
        const credit = parseFloat(line.creditAmount?.toString() || '0');
        const currentBalance = parseFloat(account.currentBalance?.toString() || '0');
        
        let newBalance = currentBalance;
        if (account.normalBalance === 'debit') {
          newBalance = currentBalance - debit + credit;
        } else {
          newBalance = currentBalance - credit + debit;
        }
        
        await this.updateLedgerAccount(account.id, { currentBalance: newBalance.toFixed(2) });
      }
    }

    return await this.updateJournalEntry(id, {
      status: 'reversed',
      reversedAt: new Date(),
      reversedBy
    } as any);
  }

  // Journal Line Methods
  async createJournalLine(line: InsertJournalLine): Promise<JournalLine> {
    const result = await db.insert(journalLines).values(line as any).returning();
    return result[0];
  }

  async getJournalLines(journalEntryId: string): Promise<JournalLine[]> {
    return await db.select().from(journalLines)
      .where(eq(journalLines.journalEntryId, journalEntryId))
      .orderBy(journalLines.lineNumber);
  }

  async getJournalLineById(id: string): Promise<JournalLine | undefined> {
    const result = await db.select().from(journalLines).where(eq(journalLines.id, id)).limit(1);
    return result[0];
  }

  async updateJournalLine(id: string, line: Partial<InsertJournalLine>): Promise<JournalLine | undefined> {
    const result = await db.update(journalLines)
      .set(line)
      .where(eq(journalLines.id, id))
      .returning();
    return result[0];
  }

  async deleteJournalLine(id: string): Promise<boolean> {
    const result = await db.delete(journalLines).where(eq(journalLines.id, id)).returning();
    return result.length > 0;
  }

  // Pakistan Tax Slab Methods
  async createPakistanTaxSlab(slab: InsertPakistanTaxSlab): Promise<PakistanTaxSlab> {
    const result = await db.insert(pakistanTaxSlabs).values(slab as any).returning();
    return result[0];
  }

  async getPakistanTaxSlabs(fiscalYear?: string, isActive?: boolean): Promise<PakistanTaxSlab[]> {
    const conditions = [];
    if (fiscalYear) conditions.push(eq(pakistanTaxSlabs.fiscalYear, fiscalYear));
    if (isActive !== undefined) conditions.push(eq(pakistanTaxSlabs.isActive, isActive));
    
    const query = conditions.length > 0
      ? db.select().from(pakistanTaxSlabs).where(and(...conditions)).orderBy(pakistanTaxSlabs.minIncome)
      : db.select().from(pakistanTaxSlabs).orderBy(pakistanTaxSlabs.minIncome);
    return await query;
  }

  async getPakistanTaxSlabById(id: string): Promise<PakistanTaxSlab | undefined> {
    const result = await db.select().from(pakistanTaxSlabs).where(eq(pakistanTaxSlabs.id, id)).limit(1);
    return result[0];
  }

  async updatePakistanTaxSlab(id: string, slab: Partial<InsertPakistanTaxSlab>): Promise<PakistanTaxSlab | undefined> {
    const result = await db.update(pakistanTaxSlabs)
      .set(slab)
      .where(eq(pakistanTaxSlabs.id, id))
      .returning();
    return result[0];
  }

  async calculateIncomeTax(annualIncome: number, fiscalYear: string): Promise<number> {
    const slabs = await this.getPakistanTaxSlabs(fiscalYear, true);
    if (slabs.length === 0) return 0;

    let tax = 0;
    for (const slab of slabs) {
      const minIncome = parseFloat(slab.minIncome.toString());
      const maxIncome = slab.maxIncome ? parseFloat(slab.maxIncome.toString()) : Infinity;
      const fixedTax = parseFloat(slab.fixedTax?.toString() || '0');
      const percentage = parseFloat(slab.taxPercentage.toString());

      if (annualIncome > minIncome) {
        if (annualIncome <= maxIncome) {
          // This is the applicable slab
          if (slab.taxOnExcess) {
            tax = fixedTax + ((annualIncome - minIncome) * percentage / 100);
          } else {
            tax = fixedTax + (annualIncome * percentage / 100);
          }
          break;
        }
      }
    }

    return Math.round(tax * 100) / 100;
  }

  // Organization HR Settings Methods
  async getOrganizationHRSettings(organizationId: string): Promise<OrganizationHRSettings | undefined> {
    const result = await db.select().from(organizationHRSettings)
      .where(eq(organizationHRSettings.organizationId, organizationId))
      .limit(1);
    return result[0];
  }

  async upsertOrganizationHRSettings(settings: InsertOrganizationHRSettings): Promise<OrganizationHRSettings> {
    const existing = await this.getOrganizationHRSettings(settings.organizationId);
    
    if (existing) {
      const result = await db.update(organizationHRSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(organizationHRSettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(organizationHRSettings).values(settings as any).returning();
      return result[0];
    }
  }

  // Master Data: Specialty methods (case-insensitive)
  async createSpecialty(specialty: InsertSpecialty): Promise<Specialty> {
    const normalizedName = specialty.name.toLowerCase().trim();
    const result = await db.insert(specialties).values({
      ...specialty,
      name: specialty.name.trim(),
      normalizedName,
    }).returning();
    return result[0];
  }

  async getSpecialties(isActive?: boolean): Promise<Specialty[]> {
    if (isActive !== undefined) {
      return await db.select().from(specialties)
        .where(eq(specialties.isActive, isActive))
        .orderBy(specialties.name);
    }
    return await db.select().from(specialties).orderBy(specialties.name);
  }

  async getSpecialtyById(id: string): Promise<Specialty | undefined> {
    const result = await db.select().from(specialties)
      .where(eq(specialties.id, id))
      .limit(1);
    return result[0];
  }

  async getSpecialtyByName(name: string): Promise<Specialty | undefined> {
    const normalizedName = name.toLowerCase().trim();
    const result = await db.select().from(specialties)
      .where(eq(specialties.normalizedName, normalizedName))
      .limit(1);
    return result[0];
  }

  async updateSpecialty(id: string, specialty: Partial<InsertSpecialty>): Promise<Specialty | undefined> {
    const updates: any = { ...specialty };
    if (specialty.name) {
      updates.name = specialty.name.trim();
      updates.normalizedName = specialty.name.toLowerCase().trim();
    }
    const result = await db.update(specialties)
      .set(updates)
      .where(eq(specialties.id, id))
      .returning();
    return result[0];
  }

  async deleteSpecialty(id: string): Promise<boolean> {
    const result = await db.delete(specialties).where(eq(specialties.id, id)).returning();
    return result.length > 0;
  }

  // ========== OPD Visits ==========
  
  async getOpdVisits(filter: { organizationId?: string; date?: string; status?: string; personId?: string }): Promise<any[]> {
    let query = db.select().from(opdVisits);
    const conditions = [];
    
    if (filter.organizationId) {
      conditions.push(eq(opdVisits.organizationId, filter.organizationId));
    }
    if (filter.date) {
      const startOfDay = new Date(filter.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filter.date);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(sql`${opdVisits.visitDate} >= ${startOfDay} AND ${opdVisits.visitDate} <= ${endOfDay}`);
    }
    if (filter.status) {
      conditions.push(eq(opdVisits.status, filter.status));
    }
    if (filter.personId) {
      conditions.push(eq(opdVisits.personId, filter.personId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const visits = await query.orderBy(desc(opdVisits.createdAt));
    
    // Enrich with person names
    const enrichedVisits = await Promise.all(visits.map(async (visit: any) => {
      const person = await this.getPersonById(visit.personId);
      return {
        ...visit,
        personName: person ? `${person.firstName} ${person.lastName || ''}`.trim() : 'Unknown',
      };
    }));
    
    return enrichedVisits;
  }

  async getOpdVisitById(id: string): Promise<any | undefined> {
    const result = await db.select().from(opdVisits).where(eq(opdVisits.id, id)).limit(1);
    if (!result[0]) return undefined;
    
    const person = await this.getPersonById(result[0].personId);
    return {
      ...result[0],
      personName: person ? `${person.firstName} ${person.lastName || ''}`.trim() : 'Unknown',
    };
  }

  async createOpdVisit(visit: any): Promise<any> {
    const result = await db.insert(opdVisits).values(visit).returning();
    return result[0];
  }

  async updateOpdVisit(id: string, data: any): Promise<any | undefined> {
    const result = await db.update(opdVisits)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(opdVisits.id, id))
      .returning();
    return result[0];
  }

  // ========== Patient Facility Encounters ==========
  
  async getPatientFacilityEncounter(personId: string, organizationId: string): Promise<any | undefined> {
    const result = await db.select().from(patientFacilityEncounters)
      .where(and(
        eq(patientFacilityEncounters.personId, personId),
        eq(patientFacilityEncounters.organizationId, organizationId)
      ))
      .limit(1);
    return result[0];
  }

  async createPatientFacilityEncounter(encounter: any): Promise<any> {
    const result = await db.insert(patientFacilityEncounters).values(encounter).returning();
    return result[0];
  }

  async updatePatientFacilityEncounter(id: string, data: any): Promise<any | undefined> {
    const result = await db.update(patientFacilityEncounters)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(patientFacilityEncounters.id, id))
      .returning();
    return result[0];
  }

  async getPatientFacilityEncountersByOrg(organizationId: string): Promise<any[]> {
    return await db.select().from(patientFacilityEncounters)
      .where(eq(patientFacilityEncounters.organizationId, organizationId));
  }

  // ========== IPD MODULE: Wards ==========
  
  async getWards(organizationId: string): Promise<any[]> {
    return await db.select().from(wards)
      .where(eq(wards.organizationId, organizationId))
      .orderBy(wards.name);
  }

  async getWardById(id: string): Promise<any | undefined> {
    const result = await db.select().from(wards).where(eq(wards.id, id)).limit(1);
    return result[0];
  }

  async createWard(ward: any): Promise<any> {
    const result = await db.insert(wards).values({
      id: crypto.randomUUID(),
      ...ward,
    }).returning();
    return result[0];
  }

  async updateWard(id: string, data: any): Promise<any | undefined> {
    const result = await db.update(wards)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(wards.id, id))
      .returning();
    return result[0];
  }

  // ========== IPD MODULE: Beds ==========
  
  async getBeds(wardId?: string, organizationId?: string): Promise<any[]> {
    if (wardId) {
      return await db.select().from(beds)
        .where(eq(beds.wardId, wardId))
        .orderBy(beds.bedNumber);
    }
    if (organizationId) {
      const wardList = await this.getWards(organizationId);
      const wardIds = wardList.map(w => w.id);
      if (wardIds.length === 0) return [];
      return await db.select().from(beds)
        .where(inArray(beds.wardId, wardIds))
        .orderBy(beds.bedNumber);
    }
    return [];
  }

  async getBedById(id: string): Promise<any | undefined> {
    const result = await db.select().from(beds).where(eq(beds.id, id)).limit(1);
    return result[0];
  }

  async getAvailableBeds(wardId: string): Promise<any[]> {
    return await db.select().from(beds)
      .where(and(
        eq(beds.wardId, wardId),
        eq(beds.status, "available")
      ))
      .orderBy(beds.bedNumber);
  }

  async createBed(bed: any): Promise<any> {
    const result = await db.insert(beds).values({
      id: crypto.randomUUID(),
      ...bed,
    }).returning();
    return result[0];
  }

  async updateBed(id: string, data: any): Promise<any | undefined> {
    const result = await db.update(beds)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(beds.id, id))
      .returning();
    return result[0];
  }

  // ========== IPD MODULE: Admissions ==========
  
  async getIpdAdmissions(organizationId: string, status?: string): Promise<any[]> {
    let query = db.select().from(ipdAdmissions)
      .where(eq(ipdAdmissions.organizationId, organizationId));
    
    if (status) {
      query = db.select().from(ipdAdmissions)
        .where(and(
          eq(ipdAdmissions.organizationId, organizationId),
          eq(ipdAdmissions.status, status)
        ));
    }
    
    return await query.orderBy(desc(ipdAdmissions.admissionDate));
  }

  async getIpdAdmissionById(id: string): Promise<any | undefined> {
    const result = await db.select().from(ipdAdmissions).where(eq(ipdAdmissions.id, id)).limit(1);
    return result[0];
  }

  async getNextAdmissionNumber(organizationId: string): Promise<string> {
    const today = new Date();
    const datePrefix = `${String(today.getFullYear()).slice(-2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    
    const existing = await db.select().from(ipdAdmissions)
      .where(and(
        eq(ipdAdmissions.organizationId, organizationId),
        like(ipdAdmissions.admissionNumber, `ADM-${datePrefix}-%`)
      ))
      .orderBy(desc(ipdAdmissions.createdAt))
      .limit(1);
    
    let seq = 1;
    if (existing.length > 0 && existing[0].admissionNumber) {
      const lastSeq = parseInt(existing[0].admissionNumber.split('-').pop() || '0');
      seq = lastSeq + 1;
    }
    
    return `ADM-${datePrefix}-${String(seq).padStart(5, '0')}`;
  }

  async createIpdAdmission(admission: any): Promise<any> {
    const result = await db.insert(ipdAdmissions).values({
      id: crypto.randomUUID(),
      ...admission,
    }).returning();
    
    // Update bed status to occupied if bed is assigned
    if (admission.bedId) {
      await this.updateBed(admission.bedId, { 
        status: "occupied", 
        currentAdmissionId: result[0].id 
      });
    }
    
    return result[0];
  }

  async updateIpdAdmission(id: string, data: any): Promise<any | undefined> {
    const current = await this.getIpdAdmissionById(id);
    
    // Handle bed transfer
    if (data.bedId && current && data.bedId !== current.bedId) {
      // Free old bed
      if (current.bedId) {
        await this.updateBed(current.bedId, { status: "available", currentAdmissionId: null });
      }
      // Occupy new bed
      await this.updateBed(data.bedId, { status: "occupied", currentAdmissionId: id });
    }
    
    // Handle discharge - free bed
    if (data.status === "discharged" && current?.bedId) {
      await this.updateBed(current.bedId, { status: "available", currentAdmissionId: null });
    }
    
    const result = await db.update(ipdAdmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ipdAdmissions.id, id))
      .returning();
    return result[0];
  }

  // ========== Operating Theatre (OT) Methods ==========
  
  async getOperatingTheatres(organizationId?: string): Promise<any[]> {
    if (organizationId) {
      return db.select().from(operatingTheatres).where(eq(operatingTheatres.organizationId, organizationId));
    }
    return db.select().from(operatingTheatres);
  }

  async getOperatingTheatreById(id: string): Promise<any | undefined> {
    const result = await db.select().from(operatingTheatres).where(eq(operatingTheatres.id, id));
    return result[0];
  }

  async createOperatingTheatre(data: any): Promise<any> {
    const result = await db.insert(operatingTheatres).values(data).returning();
    return result[0];
  }

  async updateOperatingTheatre(id: string, data: any): Promise<any | undefined> {
    const result = await db.update(operatingTheatres)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(operatingTheatres.id, id))
      .returning();
    return result[0];
  }

  async getSurgicalCases(organizationId?: string, filters?: { status?: string; theatreId?: string; date?: string }): Promise<any[]> {
    const conditions = [];
    if (organizationId) {
      conditions.push(eq(surgicalCases.organizationId, organizationId));
    }
    if (filters?.status) {
      conditions.push(eq(surgicalCases.status, filters.status));
    }
    if (filters?.theatreId) {
      conditions.push(eq(surgicalCases.theatreId, filters.theatreId));
    }
    
    if (conditions.length > 0) {
      return db.select().from(surgicalCases).where(and(...conditions)).orderBy(surgicalCases.scheduledDate);
    }
    return db.select().from(surgicalCases).orderBy(surgicalCases.scheduledDate);
  }

  async getSurgicalCaseById(id: string): Promise<any | undefined> {
    const result = await db.select().from(surgicalCases).where(eq(surgicalCases.id, id));
    return result[0];
  }

  async createSurgicalCase(data: any): Promise<any> {
    // Generate case number: OT-YYMMDD-XXXXX
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
    const caseNumber = data.caseNumber || `OT-${dateStr}-${randomNum}`;
    
    const result = await db.insert(surgicalCases).values({ ...data, caseNumber }).returning();
    return result[0];
  }

  async updateSurgicalCase(id: string, data: any): Promise<any | undefined> {
    const result = await db.update(surgicalCases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(surgicalCases.id, id))
      .returning();
    return result[0];
  }

  // ========== Insurance Methods ==========

  async getInsuranceProviders(): Promise<any[]> {
    return db.select().from(insuranceProviders).orderBy(insuranceProviders.name);
  }

  async getInsuranceProviderById(id: string): Promise<any | undefined> {
    const result = await db.select().from(insuranceProviders).where(eq(insuranceProviders.id, id));
    return result[0];
  }

  async createInsuranceProvider(data: any): Promise<any> {
    const result = await db.insert(insuranceProviders).values(data).returning();
    return result[0];
  }

  async updateInsuranceProvider(id: string, data: any): Promise<any | undefined> {
    const result = await db.update(insuranceProviders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(insuranceProviders.id, id))
      .returning();
    return result[0];
  }

  async getInsurancePolicies(personId?: string): Promise<any[]> {
    if (personId) {
      return db.select().from(insurancePolicies).where(eq(insurancePolicies.personId, personId));
    }
    return db.select().from(insurancePolicies);
  }

  async getInsurancePolicyById(id: string): Promise<any | undefined> {
    const result = await db.select().from(insurancePolicies).where(eq(insurancePolicies.id, id));
    return result[0];
  }

  async createInsurancePolicy(data: any): Promise<any> {
    const result = await db.insert(insurancePolicies).values(data).returning();
    return result[0];
  }

  async updateInsurancePolicy(id: string, data: any): Promise<any | undefined> {
    const result = await db.update(insurancePolicies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(insurancePolicies.id, id))
      .returning();
    return result[0];
  }

  async getInsuranceClaims(organizationId?: string, filters?: { status?: string; personId?: string }): Promise<any[]> {
    const conditions = [];
    if (organizationId) {
      conditions.push(eq(insuranceClaims.organizationId, organizationId));
    }
    if (filters?.status) {
      conditions.push(eq(insuranceClaims.status, filters.status));
    }
    if (filters?.personId) {
      conditions.push(eq(insuranceClaims.personId, filters.personId));
    }
    
    if (conditions.length > 0) {
      return db.select().from(insuranceClaims).where(and(...conditions)).orderBy(desc(insuranceClaims.createdAt));
    }
    return db.select().from(insuranceClaims).orderBy(desc(insuranceClaims.createdAt));
  }

  async getInsuranceClaimById(id: string): Promise<any | undefined> {
    const result = await db.select().from(insuranceClaims).where(eq(insuranceClaims.id, id));
    return result[0];
  }

  async createInsuranceClaim(data: any): Promise<any> {
    // Generate claim number: CLM-YYMMDD-XXXXX
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
    const claimNumber = data.claimNumber || `CLM-${dateStr}-${randomNum}`;
    
    const result = await db.insert(insuranceClaims).values({ ...data, claimNumber }).returning();
    return result[0];
  }

  async updateInsuranceClaim(id: string, data: any): Promise<any | undefined> {
    const result = await db.update(insuranceClaims)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(insuranceClaims.id, id))
      .returning();
    return result[0];
  }

  // ========== Phase 3: Permission System Methods ==========

  // Screen methods
  async getScreens(module?: string, isActive?: boolean): Promise<Screen[]> {
    const conditions: any[] = [];
    if (module) conditions.push(eq(screens.module, module));
    if (isActive !== undefined) conditions.push(eq(screens.isActive, isActive));
    
    if (conditions.length > 0) {
      return db.select().from(screens).where(and(...conditions)).orderBy(screens.sortOrder);
    }
    return db.select().from(screens).orderBy(screens.sortOrder);
  }

  async getScreenById(id: string): Promise<Screen | undefined> {
    const result = await db.select().from(screens).where(eq(screens.id, id));
    return result[0];
  }

  async getScreenByCode(code: string): Promise<Screen | undefined> {
    const result = await db.select().from(screens).where(eq(screens.code, code));
    return result[0];
  }

  async createScreen(screen: InsertScreen): Promise<Screen> {
    const result = await db.insert(screens).values(screen).returning();
    return result[0];
  }

  async updateScreen(id: string, screen: Partial<InsertScreen>): Promise<Screen | undefined> {
    const result = await db.update(screens).set(screen).where(eq(screens.id, id)).returning();
    return result[0];
  }

  async deleteScreen(id: string): Promise<boolean> {
    const result = await db.delete(screens).where(eq(screens.id, id)).returning();
    return result.length > 0;
  }

  // Screen permission methods
  async getScreenPermissions(roleId?: string, screenId?: string): Promise<ScreenPermission[]> {
    const conditions: any[] = [];
    if (roleId) conditions.push(eq(screenPermissions.roleId, roleId));
    if (screenId) conditions.push(eq(screenPermissions.screenId, screenId));
    
    if (conditions.length > 0) {
      return db.select().from(screenPermissions).where(and(...conditions));
    }
    return db.select().from(screenPermissions);
  }

  async getScreenPermissionById(id: string): Promise<ScreenPermission | undefined> {
    const result = await db.select().from(screenPermissions).where(eq(screenPermissions.id, id));
    return result[0];
  }

  async createScreenPermission(permission: InsertScreenPermission): Promise<ScreenPermission> {
    const result = await db.insert(screenPermissions).values(permission).returning();
    return result[0];
  }

  async updateScreenPermission(id: string, permission: Partial<InsertScreenPermission>): Promise<ScreenPermission | undefined> {
    const result = await db.update(screenPermissions).set(permission).where(eq(screenPermissions.id, id)).returning();
    return result[0];
  }

  async deleteScreenPermission(id: string): Promise<boolean> {
    const result = await db.delete(screenPermissions).where(eq(screenPermissions.id, id)).returning();
    return result.length > 0;
  }

  // User permission override methods
  async getUserPermissionOverrides(userId?: string, screenId?: string): Promise<UserPermissionOverride[]> {
    const conditions: any[] = [eq(userPermissionOverrides.isActive, true)];
    if (userId) conditions.push(eq(userPermissionOverrides.userId, userId));
    if (screenId) conditions.push(eq(userPermissionOverrides.screenId, screenId));
    
    return db.select().from(userPermissionOverrides).where(and(...conditions));
  }

  async getUserPermissionOverrideById(id: string): Promise<UserPermissionOverride | undefined> {
    const result = await db.select().from(userPermissionOverrides).where(eq(userPermissionOverrides.id, id));
    return result[0];
  }

  async createUserPermissionOverride(override: InsertUserPermissionOverride): Promise<UserPermissionOverride> {
    const result = await db.insert(userPermissionOverrides).values(override).returning();
    return result[0];
  }

  async updateUserPermissionOverride(id: string, override: Partial<InsertUserPermissionOverride>): Promise<UserPermissionOverride | undefined> {
    const result = await db.update(userPermissionOverrides)
      .set({ ...override, updatedAt: new Date() })
      .where(eq(userPermissionOverrides.id, id))
      .returning();
    return result[0];
  }

  async deleteUserPermissionOverride(id: string): Promise<boolean> {
    const result = await db.delete(userPermissionOverrides).where(eq(userPermissionOverrides.id, id)).returning();
    return result.length > 0;
  }

  // Organization permission override methods
  async getOrganizationPermissionOverrides(organizationId?: string, screenId?: string): Promise<OrganizationPermissionOverride[]> {
    const conditions: any[] = [eq(organizationPermissionOverrides.isActive, true)];
    if (organizationId) conditions.push(eq(organizationPermissionOverrides.organizationId, organizationId));
    if (screenId) conditions.push(eq(organizationPermissionOverrides.screenId, screenId));
    
    return db.select().from(organizationPermissionOverrides).where(and(...conditions));
  }

  async getOrganizationPermissionOverrideById(id: string): Promise<OrganizationPermissionOverride | undefined> {
    const result = await db.select().from(organizationPermissionOverrides).where(eq(organizationPermissionOverrides.id, id));
    return result[0];
  }

  async createOrganizationPermissionOverride(override: InsertOrganizationPermissionOverride): Promise<OrganizationPermissionOverride> {
    const result = await db.insert(organizationPermissionOverrides).values(override).returning();
    return result[0];
  }

  async updateOrganizationPermissionOverride(id: string, override: Partial<InsertOrganizationPermissionOverride>): Promise<OrganizationPermissionOverride | undefined> {
    const result = await db.update(organizationPermissionOverrides)
      .set({ ...override, updatedAt: new Date() })
      .where(eq(organizationPermissionOverrides.id, id))
      .returning();
    return result[0];
  }

  async deleteOrganizationPermissionOverride(id: string): Promise<boolean> {
    const result = await db.delete(organizationPermissionOverrides).where(eq(organizationPermissionOverrides.id, id)).returning();
    return result.length > 0;
  }

  // Effective permissions - resolves role → org → user override chain
  async getEffectivePermissions(userId: string, screenCode: string): Promise<{
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
    canApprove: boolean;
    accessLevel: 'none' | 'view' | 'create' | 'edit' | 'delete' | 'full';
    source: 'role' | 'organization' | 'user';
  } | null> {
    // Get the user with their role and organization
    const user = await this.getUser(userId);
    if (!user) return null;

    // Get the screen by code
    const screen = await this.getScreenByCode(screenCode);
    if (!screen) return null;

    // Default permissions (all denied)
    let permissions = {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
      canApprove: false,
      accessLevel: 'none' as 'none' | 'view' | 'create' | 'edit' | 'delete' | 'full',
      source: 'role' as 'role' | 'organization' | 'user'
    };

    // 1. Get role default permissions (if user has roleId in personContext)
    // For now, use user's role to get screen permissions
    if (user.roleId) {
      const rolePerms = await db.select().from(screenPermissions)
        .where(and(
          eq(screenPermissions.roleId, user.roleId),
          eq(screenPermissions.screenId, screen.id),
          eq(screenPermissions.isActive, true)
        ));
      
      if (rolePerms.length > 0) {
        const rp = rolePerms[0];
        permissions = {
          canView: rp.canView ?? false,
          canCreate: rp.canCreate ?? false,
          canEdit: rp.canEdit ?? false,
          canDelete: rp.canDelete ?? false,
          canExport: rp.canExport ?? false,
          canApprove: rp.canApprove ?? false,
          accessLevel: this.calculateAccessLevel(rp.canView ?? false, rp.canCreate ?? false, rp.canEdit ?? false, rp.canDelete ?? false),
          source: 'role'
        };
      }
    }

    // 2. Apply organization overrides (if any)
    if (user.organizationId) {
      const orgOverrides = await db.select().from(organizationPermissionOverrides)
        .where(and(
          eq(organizationPermissionOverrides.organizationId, user.organizationId),
          eq(organizationPermissionOverrides.screenId, screen.id),
          eq(organizationPermissionOverrides.isActive, true)
        ));
      
      if (orgOverrides.length > 0) {
        const oo = orgOverrides[0];
        if (oo.overrideType === 'deny') {
          // Deny overrides - set specific permissions to false
          if (oo.canView === false) permissions.canView = false;
          if (oo.canCreate === false) permissions.canCreate = false;
          if (oo.canEdit === false) permissions.canEdit = false;
          if (oo.canDelete === false) permissions.canDelete = false;
          if (oo.canExport === false) permissions.canExport = false;
          if (oo.canApprove === false) permissions.canApprove = false;
        } else if (oo.overrideType === 'allow') {
          // Allow overrides - set specific permissions to true
          if (oo.canView === true) permissions.canView = true;
          if (oo.canCreate === true) permissions.canCreate = true;
          if (oo.canEdit === true) permissions.canEdit = true;
          if (oo.canDelete === true) permissions.canDelete = true;
          if (oo.canExport === true) permissions.canExport = true;
          if (oo.canApprove === true) permissions.canApprove = true;
        }
        permissions.source = 'organization';
        permissions.accessLevel = this.calculateAccessLevel(permissions.canView, permissions.canCreate, permissions.canEdit, permissions.canDelete);
      }
    }

    // 3. Apply user overrides (highest priority)
    const userOverrides = await db.select().from(userPermissionOverrides)
      .where(and(
        eq(userPermissionOverrides.userId, userId),
        eq(userPermissionOverrides.screenId, screen.id),
        eq(userPermissionOverrides.isActive, true),
        or(
          isNull(userPermissionOverrides.expiresAt),
          gte(userPermissionOverrides.expiresAt, new Date())
        )
      ));
    
    if (userOverrides.length > 0) {
      const uo = userOverrides[0];
      if (uo.overrideType === 'deny') {
        if (uo.canView === false) permissions.canView = false;
        if (uo.canCreate === false) permissions.canCreate = false;
        if (uo.canEdit === false) permissions.canEdit = false;
        if (uo.canDelete === false) permissions.canDelete = false;
        if (uo.canExport === false) permissions.canExport = false;
        if (uo.canApprove === false) permissions.canApprove = false;
      } else if (uo.overrideType === 'allow') {
        if (uo.canView === true) permissions.canView = true;
        if (uo.canCreate === true) permissions.canCreate = true;
        if (uo.canEdit === true) permissions.canEdit = true;
        if (uo.canDelete === true) permissions.canDelete = true;
        if (uo.canExport === true) permissions.canExport = true;
        if (uo.canApprove === true) permissions.canApprove = true;
      }
      permissions.source = 'user';
      permissions.accessLevel = this.calculateAccessLevel(permissions.canView, permissions.canCreate, permissions.canEdit, permissions.canDelete);
    }

    return permissions;
  }

  // Helper to calculate access level from individual permission flags
  private calculateAccessLevel(canView: boolean, canCreate: boolean, canEdit: boolean, canDelete: boolean): 'none' | 'view' | 'create' | 'edit' | 'delete' | 'full' {
    if (canDelete && canEdit && canCreate && canView) return 'full';
    if (canDelete) return 'delete';
    if (canEdit) return 'edit';
    if (canCreate) return 'create';
    if (canView) return 'view';
    return 'none';
  }

  // Medical Instructions Dictionary
  async getMedicalInstructions(category?: string): Promise<MedicalInstruction[]> {
    if (category) {
      return await db.select().from(medicalInstructionsDict).where(eq(medicalInstructionsDict.category, category));
    }
    return await db.select().from(medicalInstructionsDict);
  }

  async createMedicalInstruction(instruction: InsertMedicalInstruction): Promise<MedicalInstruction> {
    const result = await db.insert(medicalInstructionsDict).values(instruction).returning();
    return result[0];
  }

  async updateMedicalInstruction(id: string, instruction: Partial<InsertMedicalInstruction>): Promise<MedicalInstruction | undefined> {
    const result = await db
      .update(medicalInstructionsDict)
      .set(instruction)
      .where(eq(medicalInstructionsDict.id, id))
      .returning();
    return result[0];
  }

  async deleteMedicalInstruction(id: string): Promise<boolean> {
    const result = await db.delete(medicalInstructionsDict).where(eq(medicalInstructionsDict.id, id)).returning();
    return result.length > 0;
  }

  // ========== Doctor Pharma Commitments Methods ==========
  async getDoctorPharmaCommitments(doctorId?: string, pharmaCompanyId?: string): Promise<DoctorPharmaCommitment[]> {
    let query = db.select().from(doctorPharmaCommitments).$dynamic();
    
    if (doctorId && pharmaCompanyId) {
      query = query.where(and(eq(doctorPharmaCommitments.doctorId, doctorId), eq(doctorPharmaCommitments.pharmaCompanyId, pharmaCompanyId)));
    } else if (doctorId) {
      query = query.where(eq(doctorPharmaCommitments.doctorId, doctorId));
    } else if (pharmaCompanyId) {
      query = query.where(eq(doctorPharmaCommitments.pharmaCompanyId, pharmaCompanyId));
    }
    
    return await query;
  }

  async createDoctorPharmaCommitment(commitment: InsertDoctorPharmaCommitment): Promise<DoctorPharmaCommitment> {
    const result = await db.insert(doctorPharmaCommitments).values(commitment).returning();
    return result[0];
  }

  async updateDoctorPharmaCommitment(id: string, commitment: Partial<InsertDoctorPharmaCommitment>): Promise<DoctorPharmaCommitment | undefined> {
    const result = await db.update(doctorPharmaCommitments)
      .set({ ...commitment, updatedAt: new Date() })
      .where(eq(doctorPharmaCommitments.id, id))
      .returning();
    return result[0];
  }

  async deleteDoctorPharmaCommitment(id: string): Promise<boolean> {
    const result = await db.delete(doctorPharmaCommitments).where(eq(doctorPharmaCommitments.id, id)).returning();
    return result.length > 0;
  }

  // ==========================================
  // SaaS Modules
  // ==========================================
  async getAllModules(): Promise<Module[]> {
    return await db.select().from(modules).orderBy(modules.category, modules.name);
  }

  async getCompanyModules(companyId: string): Promise<CompanyModule[]> {
    return await db.select().from(companyModules).where(eq(companyModules.companyId, companyId));
  }

  async toggleCompanyModule(companyId: string, moduleId: string, status: string): Promise<CompanyModule> {
    const existing = await db.select().from(companyModules)
      .where(and(eq(companyModules.companyId, companyId), eq(companyModules.moduleId, moduleId)))
      .limit(1);

    if (existing.length > 0) {
      const result = await db.update(companyModules)
        .set({ status })
        .where(and(eq(companyModules.companyId, companyId), eq(companyModules.moduleId, moduleId)))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(companyModules)
        .values({ companyId, moduleId, status })
        .returning();
      return result[0];
    }
  }
}

export const storage = new DbStorage();
