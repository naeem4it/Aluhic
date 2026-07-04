import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { z } from "zod";
import passport from "passport";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, or, inArray, gte, lte, desc } from "drizzle-orm";
import { doctorVisits, doctors, salesEntries, users } from "@shared/schema";
import { 
  setupAuth, 
  isAuthenticated, 
  requireRole, 
  requireUserType, 
  hashPassword, 
  canAccessAllData,
  requireActiveSubscription,
  requireSubscriptionTier,
  requireSuperAdmin,
  requireOrganizationAccess,
  isSuperAdmin
} from "./auth";
import { sendVerificationEmail, sendPasswordResetEmail, sendInvitationEmail } from "./emailService";
import { 
  insertSalesEntrySchema, 
  insertCompanySettingsSchema,
  insertDoctorSchema,
  insertProductSchema,
  insertProductPriceHistorySchema,
  insertDoctorVisitSchema,
  insertExpenseSchema,
  insertCallKPISchema,
  registerUserSchema,
  loginUserSchema,
  updateProfileSchema,
  insertCompanySchema,
  insertHealthcareFacilitySchema,
  insertFacilityDepartmentSchema,
  insertHealthcareDoctorSchema,
  insertDoctorAvailabilitySchema,
  insertPatientSchema,
  insertAppointmentSchema,
  insertQueueEntrySchema,
  insertPaymentSchema,
  insertPatientVitalsSchema,
  insertConsultationSchema,
  insertPrescriptionSchema,
  insertTestReportSchema,
  insertProductSampleSchema,
  insertSampleDistributionSchema,
  insertVisitRequestSchema,
  insertSubscriptionPlanSchema,
  insertSubscriptionSchema,
  insertRoutePlanSchema,
  insertRoutePlanStopSchema,
  insertSalesLeadSchema,
  insertMRProfileSchema,
  insertPharmaCompanySettingsSchema,
  insertWarehouseSchema,
  insertStockItemSchema,
  insertStockMovementSchema,
  insertDoctorPayrollRecordSchema,
  insertDoctorExpenditureSchema,
  insertPersonSchema,
  insertPersonContextSchema,
  insertQueueDefinitionSchema,
  insertQueueTokenSchema,
  insertLabOrderSchema,
  insertLabResultSchema,
  insertMedicineSchema,
  insertMedicineStockSchema,
  insertPrescriptionFulfillmentSchema,
  insertDataTransferRequestSchema,
  insertPayslipTemplateSchema,
  insertAttendanceSourceSchema,
  insertShiftDefinitionSchema,
  insertScreenSchema,
  insertScreenPermissionSchema,
  insertUserPermissionOverrideSchema,
  insertOrganizationPermissionOverrideSchema,
  insertShiftAssignmentSchema,
  insertOvertimeRuleSchema,
  insertAttendanceLogSchema,
  insertAttendanceExceptionSchema,
  insertSalaryStructureSchema,
  insertSalaryComponentSchema,
  insertPayrollRunSchema,
  insertPayslipSchema,
  insertPayslipItemSchema,
  insertLedgerAccountSchema,
  insertJournalEntrySchema,
  insertJournalLineSchema,
  insertPakistanTaxSlabSchema,
  insertOrganizationHRSettingsSchema,
  insertDepartmentRoleSchema,
  insertMedicalInstructionSchema,
  type User
} from "@shared/schema";
import * as XLSX from "xlsx";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Helper function to verify facility ownership for multi-tenant isolation
  async function verifyFacilityAccess(user: User, facilityId: string): Promise<{ ok: boolean; facility?: any; error?: string }> {
    const facility = await storage.getHealthcareFacilityById(facilityId);
    if (!facility) {
      return { ok: false, error: "Facility not found" };
    }
    if (!canAccessAllData(user) && facility.companyId !== user.companyId) {
      return { ok: false, error: "Forbidden" };
    }
    return { ok: true, facility };
  }

  // Configure multer for file uploads (must be before routes that use it)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel') {
        cb(null, true);
      } else {
        cb(new Error('Only Excel files are allowed'));
      }
    }
  });

  // ========== Auth Routes ==========
  
  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validation = registerUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const { email, password, firstName, lastName, territory, userType, companyName, companyEmail, companyPhone, companyAddress } = validation.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const passwordHash = await hashPassword(password);
      console.log(`[Registration] Creating user ${email} with passwordHash length: ${passwordHash?.length || 0}`);

      // Handle company registration
      let companyId: string | undefined;
      if (userType === "company" && companyName) {
        const company = await storage.createCompany({
          name: companyName,
          email: companyEmail,
          phone: companyPhone,
          address: companyAddress,
        });
        companyId = company.id;
      }

      // Create user with 14-day trial
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const user = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        territory,
        userType,
        companyId,
        role: userType === "company" ? "company_admin" : "user",
        trialStartDate,
        trialEndDate,
        subscriptionActive: "trial",
        isActive: true,
      });

      console.log(`[Registration] User created successfully: ${user.id}, has passwordHash: ${!!user.passwordHash}`);

      // Create person entry in Person Master for unified identity
      try {
        const person = await storage.createPerson({
          firstName: firstName || "",
          lastName: lastName || undefined,
          email,
          userId: user.id,
        });

        // Create personContext with role if organization exists
        const effectiveOrgId = companyId || user.organizationId;
        if (effectiveOrgId) {
          // Map user role to personContext roleType
          const userRole = user.role || "user";
          let roleType = "staff";
          if (userRole === "company_admin" || userRole === "super_admin") {
            roleType = "admin";
          } else if (userRole === "medical_rep" || userRole.includes("sales")) {
            roleType = "mr";
          } else if (userRole === "doctor") {
            roleType = "doctor";
          } else if (userRole === "front_desk") {
            roleType = "front_desk";
          }

          await storage.createPersonContext({
            personId: person.id,
            organizationId: effectiveOrgId,
            organizationType: userType === "company" ? "company" : "company",
            roleType,
            status: "active",
          });
        }
        console.log(`[Registration] Person Master entry created: ${person.id}`);
      } catch (personError) {
        console.error("[Registration] Person Master creation failed (non-blocking):", personError);
        // Non-blocking - user can still proceed
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("[Registration] Auto-login failed:", err);
          return res.status(500).json({ message: "Registration successful but login failed. Please try logging in manually." });
        }
        // Return user without password hash
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("[Registration] Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to register";
      res.status(500).json({ message: `Registration failed: ${errorMessage}` });
    }
  });

  // Login
  app.post("/api/auth/login", (req, res, next) => {
    const validation = loginUserSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid data", errors: validation.error });
    }

    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        // Return user without password hash
        const { passwordHash: _, ...userWithoutPassword } = user;
        console.log(`[POST /api/auth/login] User ${user.email}, isSuperAdmin: ${user.isSuperAdmin}, role: ${user.role}`);
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", isAuthenticated, (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const sessionUser = req.user as User;
      // Always fetch fresh user data from database to get latest isSuperAdmin status
      const freshUser = await storage.getUser(sessionUser.id);
      if (!freshUser) {
        return res.status(401).json({ message: "User not found" });
      }
      // Log to debug isSuperAdmin issue
      console.log(`[GET /api/auth/user] User ${freshUser.email}, isSuperAdmin: ${freshUser.isSuperAdmin}, role: ${freshUser.role}`);
      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = freshUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      if ((user as any).isEmailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      const { pool } = await import("./db");
      
      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Store token in database
      await pool.query(
        `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        [user.id, token, expiresAt]
      );
      
      // Send verification email
      const emailSent = await sendVerificationEmail(user.email, user.firstName || 'User', token);
      
      if (emailSent) {
        res.json({ message: "Verification email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // Verify email
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      const { pool } = await import("./db");
      
      // Find and validate token
      const result = await pool.query(
        `SELECT * FROM email_verification_tokens WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
        [token]
      );
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      const tokenRecord = result.rows[0] as any;
      
      // Mark token as used and update user
      await pool.query(
        `UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1`,
        [tokenRecord.id]
      );
      
      await pool.query(
        `UPDATE users SET is_email_verified = true, email_verified_at = NOW() WHERE id = $1`,
        [tokenRecord.user_id]
      );
      
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Request password reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If an account exists with that email, a password reset link has been sent" });
      }
      
      const { pool } = await import("./db");
      
      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Store token in database
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        [user.id, token, expiresAt]
      );
      
      // Send password reset email
      await sendPasswordResetEmail(user.email, user.firstName || 'User', token);
      
      res.json({ message: "If an account exists with that email, a password reset link has been sent" });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      const { pool } = await import("./db");
      
      // Find and validate token
      const result = await pool.query(
        `SELECT * FROM password_reset_tokens WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
        [token]
      );
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      const tokenRecord = result.rows[0] as any;
      
      // Hash new password
      const passwordHash = await hashPassword(password);
      
      // Mark token as used and update user password
      await pool.query(
        `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
        [tokenRecord.id]
      );
      
      await pool.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [passwordHash, tokenRecord.user_id]
      );
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Sales entry routes - accessible by users with sales access (Basic tier+)
  app.post("/api/sales", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Validate request body (excluding userId, totalAmount, and rate - all set server-side)
      const validation = insertSalesEntrySchema.omit({ userId: true, totalAmount: true, rate: true }).safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Verify doctor and product exist
      const [doctor, product] = await Promise.all([
        storage.getDoctorById(validation.data.doctorId),
        storage.getProductById(validation.data.productId),
      ]);

      if (!doctor) {
        return res.status(400).json({ message: "Invalid doctor" });
      }

      if (!product) {
        return res.status(400).json({ message: "Invalid product" });
      }

      // Regular users can only use their own doctors/products, admins can use any
      if (!canAccessAllData(user)) {
        if (doctor.userId !== userId) {
          return res.status(400).json({ message: "Invalid doctor" });
        }
        if (product.userId !== userId) {
          return res.status(400).json({ message: "Invalid product" });
        }
      }

      // Determine the rate: use priceOverride if provided, otherwise use product's current price
      const priceOverride = validation.data.priceOverride;
      const rate = (priceOverride !== null && priceOverride !== undefined && priceOverride !== '') 
        ? priceOverride.toString() 
        : product.currentPrice.toString();

      const entry = await storage.createSalesEntry({
        ...validation.data,
        userId,
        rate,
      });

      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating sales entry:", error);
      res.status(500).json({ message: "Failed to create sales entry" });
    }
  });

  app.get("/api/sales", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { startDate, endDate } = req.query;
      
      // Company admins and super admins can see all entries, regular users only see their own
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      
      const entries = await storage.getSalesEntries(
        filterUserId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(entries);
    } catch (error) {
      console.error("Error fetching sales entries:", error);
      res.status(500).json({ message: "Failed to fetch sales entries" });
    }
  });

  app.get("/api/sales/template", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      // Create a new workbook with template headers
      const wb = XLSX.utils.book_new();
      const headers = [
        "Date*",
        "Territory*",
        "Rep Name*",
        "Doctor Email*",
        "Product Name*",
        "Quantity*",
        "Rate",
        "Payment Mode",
        "Remarks"
      ];
      
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, // Date
        { wch: 15 }, // Territory
        { wch: 20 }, // Rep Name
        { wch: 25 }, // Doctor Email
        { wch: 20 }, // Product Name
        { wch: 10 }, // Quantity
        { wch: 10 }, // Rate
        { wch: 15 }, // Payment Mode
        { wch: 30 }  // Remarks
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, "Sales Template");
      
      // Generate buffer
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename="sales_template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
    } catch (error) {
      console.error("Error generating sales template:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  app.post("/api/sales/upload", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), upload.single('file'), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({ message: "Excel file is empty" });
      }

      // Validate headers
      const requiredHeaders = ["Date*", "Territory*", "Rep Name*", "Doctor Email*", "Product Name*", "Quantity*"];
      const firstRow: any = data[0];
      const missingHeaders = requiredHeaders.filter(header => !(header in firstRow || header.replace('*', '') in firstRow));
      
      if (missingHeaders.length > 0) {
        return res.status(400).json({ 
          message: `Missing required columns: ${missingHeaders.join(', ')}` 
        });
      }

      // Get all doctors and products for mapping
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      const [allDoctors, allProducts] = await Promise.all([
        storage.getDoctors(filterUserId),
        storage.getProducts(filterUserId)
      ]);

      const doctorEmailMap = new Map(allDoctors.map(d => [d.email.toLowerCase(), d]));
      const productNameMap = new Map(allProducts.map(p => [p.name.toLowerCase(), p]));

      const validRows = [];
      const errors = [];
      const duplicates = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)

        try {
          // Extract and validate required fields
          const dateStr = row["Date*"] || row["Date"];
          const territory = row["Territory*"] || row["Territory"];
          const repName = row["Rep Name*"] || row["Rep Name"];
          const doctorEmail = row["Doctor Email*"] || row["Doctor Email"];
          const productName = row["Product Name*"] || row["Product Name"];
          const quantity = row["Quantity*"] || row["Quantity"];
          
          if (!dateStr || !territory || !repName || !doctorEmail || !productName || !quantity) {
            errors.push({ row: rowNum, message: "Missing required fields" });
            continue;
          }

          // Parse date
          let date: Date;
          if (typeof dateStr === 'number') {
            // Excel serial date
            date = new Date((dateStr - 25569) * 86400 * 1000);
          } else {
            date = new Date(dateStr);
          }
          
          if (isNaN(date.getTime())) {
            errors.push({ row: rowNum, message: "Invalid date format" });
            continue;
          }

          // Find doctor by email
          const doctor = doctorEmailMap.get(doctorEmail.toLowerCase());
          if (!doctor) {
            errors.push({ row: rowNum, message: `Doctor not found: ${doctorEmail}` });
            continue;
          }

          // Find product by name
          const product = productNameMap.get(productName.toLowerCase());
          if (!product) {
            errors.push({ row: rowNum, message: `Product not found: ${productName}` });
            continue;
          }

          // Check for duplicate (same date, doctor, product)
          const dateKey = date.toISOString().split('T')[0];
          const existingSales = await storage.getSalesEntries(filterUserId, date, date);
          const duplicate = existingSales.find(s => 
            s.doctorId === doctor.id && 
            s.productId === product.id &&
            new Date(s.date).toISOString().split('T')[0] === dateKey
          );

          if (duplicate) {
            duplicates.push({
              date: dateKey,
              doctorEmail: doctor.email,
              productName: product.name
            });
            continue;
          }

          // Optional fields
          const rate = row["Rate"] || row["rate"] || null;
          const paymentMode = row["Payment Mode"] || row["payment mode"] || "cash";
          const remarks = row["Remarks"] || row["remarks"] || "";

          validRows.push({
            userId,
            date: date, // Pass Date object, not ISO string
            territory: territory.toString(),
            repName: repName.toString(),
            doctorId: doctor.id,
            productId: product.id,
            quantity: parseInt(quantity.toString()),
            priceOverride: rate ? rate.toString() : null,
            paymentMode: paymentMode.toString().toLowerCase(),
            remarks: remarks.toString()
          });
        } catch (error) {
          errors.push({ row: rowNum, message: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
      }

      if (duplicates.length > 0) {
        return res.status(409).json({
          message: `Found ${duplicates.length} duplicate sales entries`,
          duplicates,
          validRows: validRows.length,
          errors
        });
      }

      if (errors.length > 0 && validRows.length === 0) {
        return res.status(400).json({
          message: "No valid rows to import",
          errors
        });
      }

      // Insert valid rows
      for (const rowData of validRows) {
        await storage.createSalesEntry(rowData);
      }

      res.json({
        message: `Successfully imported ${validRows.length} sales entry(s)`,
        imported: validRows.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error uploading sales:", error);
      res.status(500).json({ message: "Failed to upload sales data" });
    }
  });

  app.post("/api/sales/upload-with-update", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), upload.single('file'), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({ message: "Excel file is empty" });
      }

      // Get all doctors and products for mapping
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      const [allDoctors, allProducts] = await Promise.all([
        storage.getDoctors(filterUserId),
        storage.getProducts(filterUserId)
      ]);

      const doctorEmailMap = new Map(allDoctors.map(d => [d.email.toLowerCase(), d]));
      const productNameMap = new Map(allProducts.map(p => [p.name.toLowerCase(), p]));

      let inserted = 0;
      let updated = 0;
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2;

        try {
          const dateStr = row["Date*"] || row["Date"];
          const territory = row["Territory*"] || row["Territory"];
          const repName = row["Rep Name*"] || row["Rep Name"];
          const doctorEmail = row["Doctor Email*"] || row["Doctor Email"];
          const productName = row["Product Name*"] || row["Product Name"];
          const quantity = row["Quantity*"] || row["Quantity"];
          
          if (!dateStr || !territory || !repName || !doctorEmail || !productName || !quantity) {
            errors.push({ row: rowNum, message: "Missing required fields" });
            continue;
          }

          // Parse date
          let date: Date;
          if (typeof dateStr === 'number') {
            date = new Date((dateStr - 25569) * 86400 * 1000);
          } else {
            date = new Date(dateStr);
          }
          
          if (isNaN(date.getTime())) {
            errors.push({ row: rowNum, message: "Invalid date format" });
            continue;
          }

          const doctor = doctorEmailMap.get(doctorEmail.toLowerCase());
          if (!doctor) {
            errors.push({ row: rowNum, message: `Doctor not found: ${doctorEmail}` });
            continue;
          }

          const product = productNameMap.get(productName.toLowerCase());
          if (!product) {
            errors.push({ row: rowNum, message: `Product not found: ${productName}` });
            continue;
          }

          const dateKey = date.toISOString().split('T')[0];
          const existingSales = await storage.getSalesEntries(filterUserId, date, date);
          const existing = existingSales.find(s => 
            s.doctorId === doctor.id && 
            s.productId === product.id &&
            new Date(s.date).toISOString().split('T')[0] === dateKey
          );

          const rate = row["Rate"] || row["rate"] || null;
          const paymentMode = row["Payment Mode"] || row["payment mode"] || "cash";
          const remarks = row["Remarks"] || row["remarks"] || "";

          const salesData: any = {
            userId,
            date: date, // Pass Date object, not ISO string
            territory: territory.toString(),
            repName: repName.toString(),
            doctorId: doctor.id,
            productId: product.id,
            quantity: parseInt(quantity.toString()),
            priceOverride: rate ? rate.toString() : null,
            paymentMode: paymentMode.toString().toLowerCase(),
            remarks: remarks.toString()
          };

          if (existing) {
            await storage.updateSalesEntry(existing.id, salesData);
            updated++;
          } else {
            await storage.createSalesEntry(salesData);
            inserted++;
          }
        } catch (error) {
          errors.push({ row: rowNum, message: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
      }

      res.json({
        message: `Successfully processed ${inserted + updated} sales entry(s) (${inserted} new, ${updated} updated)`,
        inserted,
        updated,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error uploading sales with update:", error);
      res.status(500).json({ message: "Failed to upload sales data" });
    }
  });
  app.get("/api/sales/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const entry = await storage.getSalesEntryById(req.params.id);
      
      if (!entry) {
        return res.status(404).json({ message: "Sales entry not found" });
      }

      // Regular users can only access their own entries
      if (!canAccessAllData(user) && entry.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(entry);
    } catch (error) {
      console.error("Error fetching sales entry:", error);
      res.status(500).json({ message: "Failed to fetch sales entry" });
    }
  });

  app.patch("/api/sales/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const entry = await storage.getSalesEntryById(req.params.id);
      
      if (!entry) {
        return res.status(404).json({ message: "Sales entry not found" });
      }

      // Regular users can only update their own entries
      if (!canAccessAllData(user) && entry.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Validate partial update (excluding userId, totalAmount, and rate - all protected server-side)
      const validation = insertSalesEntrySchema.omit({ userId: true, totalAmount: true, rate: true }).partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Explicitly strip userId, totalAmount, and rate to prevent any tampering
      const { userId: _, totalAmount: __, rate: ___, ...safeData } = validation.data as any;

      // Determine whose resources to validate against
      // Admins can use any user's resources, regular users only their own
      const ownerUserId = canAccessAllData(user) ? undefined : userId;

      // Validate doctor ownership if being updated
      if (safeData.doctorId) {
        const doctor = await storage.getDoctorById(safeData.doctorId);
        if (!doctor) {
          return res.status(400).json({ message: "Invalid doctor" });
        }
        // For regular users, ensure doctor belongs to them
        if (ownerUserId && doctor.userId !== ownerUserId) {
          return res.status(400).json({ message: "Invalid doctor" });
        }
      }

      // If productId or priceOverride is being updated, recalculate the rate
      let updateData = { ...safeData };
      if (safeData.productId || safeData.priceOverride !== undefined) {
        const productId = safeData.productId || entry.productId;
        const product = await storage.getProductById(productId);
        
        if (!product) {
          return res.status(400).json({ message: "Invalid product" });
        }
        // For regular users, ensure product belongs to them
        if (ownerUserId && product.userId !== ownerUserId) {
          return res.status(400).json({ message: "Invalid product" });
        }

        // Determine override: if explicitly set in update, use it; if product changed, clear old override
        let priceOverride;
        if (safeData.priceOverride !== undefined) {
          // Explicit override provided (including null to clear)
          priceOverride = safeData.priceOverride;
        } else if (safeData.productId) {
          // Product changed but no new override - clear old override
          priceOverride = null;
        } else {
          // Only override changed or neither - keep existing
          priceOverride = entry.priceOverride;
        }

        // Calculate rate: use override if it's not null/empty, otherwise use product price
        const rate = (priceOverride !== null && priceOverride !== '') 
          ? priceOverride.toString() 
          : product.currentPrice.toString();
        updateData.rate = rate;
        
        // Update priceOverride in database to match logic
        if (safeData.productId && safeData.priceOverride === undefined) {
          updateData.priceOverride = null;
        }
      }

      const updated = await storage.updateSalesEntry(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating sales entry:", error);
      res.status(500).json({ message: "Failed to update sales entry" });
    }
  });

  app.delete("/api/sales/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const entry = await storage.getSalesEntryById(req.params.id);
      
      if (!entry) {
        return res.status(404).json({ message: "Sales entry not found" });
      }

      // Regular users can only delete their own entries
      if (!canAccessAllData(user) && entry.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const deleted = await storage.deleteSalesEntry(req.params.id);
      
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete sales entry" });
      }
    } catch (error) {
      console.error("Error deleting sales entry:", error);
      res.status(500).json({ message: "Failed to delete sales entry" });
    }
  });


  // Analytics routes
  app.get("/api/analytics/trend", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { days = "30" } = req.query;
      const daysCount = parseInt(days as string);
      const filterUserId = user.role === "super_admin" ? undefined : userId;
      
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysCount);
      
      const entries = await storage.getSalesEntries(filterUserId, startDate, now);
      
      const dailyTotals: Record<string, number> = {};
      entries.forEach(entry => {
        const dateKey = new Date(entry.date).toISOString().split('T')[0];
        dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + parseFloat(entry.totalAmount);
      });
      
      const trendData = [];
      for (let i = daysCount - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        trendData.push({
          date: dateKey,
          sales: dailyTotals[dateKey] || 0,
        });
      }
      
      res.json(trendData);
    } catch (error) {
      console.error("Error fetching trend analytics:", error);
      res.status(500).json({ message: "Failed to fetch trend analytics" });
    }
  });

  // Expenses routes
  app.post("/api/expenses", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const validation = insertExpenseSchema.omit({ userId: true }).safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const expense = await storage.createExpense({ ...validation.data, userId });
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.get("/api/expenses", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { startDate, endDate } = req.query;
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      
      const expenses = await storage.getExpenses(
        filterUserId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const expense = await storage.getExpenseById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      if (!canAccessAllData(user) && expense.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.patch("/api/expenses/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const expense = await storage.getExpenseById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      if (!canAccessAllData(user) && expense.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validation = insertExpenseSchema.omit({ userId: true }).partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const updated = await storage.updateExpense(req.params.id, validation.data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const expense = await storage.getExpenseById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      if (!canAccessAllData(user) && expense.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const deleted = await storage.deleteExpense(req.params.id);
      
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete expense" });
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Call KPI routes
  app.post("/api/kpis", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const validation = insertCallKPISchema.omit({ userId: true }).safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const kpi = await storage.createCallKPI({ ...validation.data, userId });
      res.status(201).json(kpi);
    } catch (error) {
      console.error("Error creating KPI:", error);
      res.status(500).json({ message: "Failed to create KPI" });
    }
  });

  app.get("/api/kpis", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { startDate, endDate } = req.query;
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      
      const kpis = await storage.getCallKPIs(
        filterUserId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(kpis);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  app.get("/api/kpis/today", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const today = new Date();
      const kpi = await storage.getCallKPIByDate(userId, today);
      
      if (!kpi) {
        return res.json({
          totalCallsDone: 0,
          totalPlannedCalls: 0,
          plannedCallsDone: 0,
          unplannedCallsDone: 0,
          totalEDAsViewed: 0,
          totalSlidesViewed: 0,
          avgTimePerCall: 0,
          avgTimePerEDA: 0,
          avgTimePerSlide: 0,
          targetDoctors: 0,
          plannedDoctors: 0,
          coveredDoctors: 0,
        });
      }

      res.json(kpi);
    } catch (error) {
      console.error("Error fetching today's KPI:", error);
      res.status(500).json({ message: "Failed to fetch today's KPI" });
    }
  });

  app.get("/api/kpis/mtd", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Get first day of current month and today
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const filterUserId = canAccessAllData(user) ? undefined : userId;
      const kpis = await storage.getCallKPIs(filterUserId, firstDayOfMonth, lastDayOfMonth);

      // Calculate MTD totals and weighted averages
      const mtdTotals = kpis.reduce(
        (acc, kpi) => ({
          totalCallsDone: acc.totalCallsDone + (kpi.totalCallsDone || 0),
          totalPlannedCalls: acc.totalPlannedCalls + (kpi.totalPlannedCalls || 0),
          plannedCallsDone: acc.plannedCallsDone + (kpi.plannedCallsDone || 0),
          unplannedCallsDone: acc.unplannedCallsDone + (kpi.unplannedCallsDone || 0),
          totalEDAsViewed: acc.totalEDAsViewed + (kpi.totalEDAsViewed || 0),
          totalSlidesViewed: acc.totalSlidesViewed + (kpi.totalSlidesViewed || 0),
          // For time metrics, weight by activity count (multiply average by count)
          totalTimeForCalls: acc.totalTimeForCalls + ((kpi.avgTimePerCall || 0) * (kpi.totalCallsDone || 0)),
          totalTimeForEDAs: acc.totalTimeForEDAs + ((kpi.avgTimePerEDA || 0) * (kpi.totalEDAsViewed || 0)),
          totalTimeForSlides: acc.totalTimeForSlides + ((kpi.avgTimePerSlide || 0) * (kpi.totalSlidesViewed || 0)),
          // For doctor metrics, use the latest values (not sum)
          targetDoctors: kpi.targetDoctors || acc.targetDoctors,
          plannedDoctors: kpi.plannedDoctors || acc.plannedDoctors,
          coveredDoctors: acc.coveredDoctors + (kpi.coveredDoctors || 0),
        }),
        {
          totalCallsDone: 0,
          totalPlannedCalls: 0,
          plannedCallsDone: 0,
          unplannedCallsDone: 0,
          totalEDAsViewed: 0,
          totalSlidesViewed: 0,
          totalTimeForCalls: 0,
          totalTimeForEDAs: 0,
          totalTimeForSlides: 0,
          targetDoctors: 0,
          plannedDoctors: 0,
          coveredDoctors: 0,
        }
      );

      // Calculate weighted average times
      const avgTimePerCall = mtdTotals.totalCallsDone > 0
        ? Math.round(mtdTotals.totalTimeForCalls / mtdTotals.totalCallsDone)
        : 0;
      const avgTimePerEDA = mtdTotals.totalEDAsViewed > 0
        ? Math.round(mtdTotals.totalTimeForEDAs / mtdTotals.totalEDAsViewed)
        : 0;
      const avgTimePerSlide = mtdTotals.totalSlidesViewed > 0
        ? Math.round(mtdTotals.totalTimeForSlides / mtdTotals.totalSlidesViewed)
        : 0;

      res.json({
        totalCallsDone: mtdTotals.totalCallsDone,
        totalPlannedCalls: mtdTotals.totalPlannedCalls,
        plannedCallsDone: mtdTotals.plannedCallsDone,
        unplannedCallsDone: mtdTotals.unplannedCallsDone,
        totalEDAsViewed: mtdTotals.totalEDAsViewed,
        totalSlidesViewed: mtdTotals.totalSlidesViewed,
        avgTimePerCall,
        avgTimePerEDA,
        avgTimePerSlide,
        targetDoctors: mtdTotals.targetDoctors,
        plannedDoctors: mtdTotals.plannedDoctors,
        coveredDoctors: mtdTotals.coveredDoctors,
        daysInMonth: kpis.length,
      });
    } catch (error) {
      console.error("Error fetching MTD KPI:", error);
      res.status(500).json({ message: "Failed to fetch MTD KPI" });
    }
  });

  app.get("/api/kpis/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const kpi = await storage.getCallKPIById(req.params.id);
      
      if (!kpi) {
        return res.status(404).json({ message: "KPI not found" });
      }

      if (!canAccessAllData(user) && kpi.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(kpi);
    } catch (error) {
      console.error("Error fetching KPI:", error);
      res.status(500).json({ message: "Failed to fetch KPI" });
    }
  });

  app.patch("/api/kpis/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const kpi = await storage.getCallKPIById(req.params.id);
      
      if (!kpi) {
        return res.status(404).json({ message: "KPI not found" });
      }

      if (!canAccessAllData(user) && kpi.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validation = insertCallKPISchema.omit({ userId: true }).partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const updated = await storage.updateCallKPI(req.params.id, validation.data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating KPI:", error);
      res.status(500).json({ message: "Failed to update KPI" });
    }
  });

  app.delete("/api/kpis/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const kpi = await storage.getCallKPIById(req.params.id);
      
      if (!kpi) {
        return res.status(404).json({ message: "KPI not found" });
      }

      if (!canAccessAllData(user) && kpi.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const deleted = await storage.deleteCallKPI(req.params.id);
      
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete KPI" });
      }
    } catch (error) {
      console.error("Error deleting KPI:", error);
      res.status(500).json({ message: "Failed to delete KPI" });
    }
  });

  // Reports analytics endpoints
  app.get("/api/reports/by-product", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { startDate, endDate } = req.query;
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      
      const entries = await storage.getSalesEntries(
        filterUserId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      // Aggregate by product
      const productMap = new Map<string, { 
        productName: string;
        totalQuantity: number;
        totalAmount: number;
        orderCount: number;
      }>();

      entries.forEach(entry => {
        const existing = productMap.get(entry.productName) || {
          productName: entry.productName,
          totalQuantity: 0,
          totalAmount: 0,
          orderCount: 0,
        };
        
        existing.totalQuantity += parseInt(entry.quantity);
        existing.totalAmount += parseFloat(entry.totalAmount);
        existing.orderCount += 1;
        
        productMap.set(entry.productName, existing);
      });

      const productReport = Array.from(productMap.values())
        .sort((a, b) => b.totalAmount - a.totalAmount);

      res.json(productReport);
    } catch (error) {
      console.error("Error fetching product report:", error);
      res.status(500).json({ message: "Failed to fetch product report" });
    }
  });

  app.get("/api/reports/by-doctor", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { startDate, endDate } = req.query;
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      
      const entries = await storage.getSalesEntries(
        filterUserId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      // Aggregate by doctor
      const doctorMap = new Map<string, { 
        doctorName: string;
        totalQuantity: number;
        totalAmount: number;
        orderCount: number;
        uniqueProducts: Set<string>;
      }>();

      entries.forEach(entry => {
        const existing = doctorMap.get(entry.doctorName) || {
          doctorName: entry.doctorName,
          totalQuantity: 0,
          totalAmount: 0,
          orderCount: 0,
          uniqueProducts: new Set<string>(),
        };
        
        existing.totalQuantity += parseInt(entry.quantity);
        existing.totalAmount += parseFloat(entry.totalAmount);
        existing.orderCount += 1;
        existing.uniqueProducts.add(entry.productName);
        
        doctorMap.set(entry.doctorName, existing);
      });

      const doctorReport = Array.from(doctorMap.values())
        .map(item => ({
          doctorName: item.doctorName,
          totalQuantity: item.totalQuantity,
          totalAmount: item.totalAmount,
          orderCount: item.orderCount,
          productCount: item.uniqueProducts.size,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

      res.json(doctorReport);
    } catch (error) {
      console.error("Error fetching doctor report:", error);
      res.status(500).json({ message: "Failed to fetch doctor report" });
    }
  });

  app.get("/api/reports/by-territory", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { startDate, endDate } = req.query;
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      
      const entries = await storage.getSalesEntries(
        filterUserId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      // Aggregate by territory
      const territoryMap = new Map<string, { 
        territory: string;
        totalQuantity: number;
        totalAmount: number;
        orderCount: number;
        uniqueDoctors: Set<string>;
        uniqueProducts: Set<string>;
      }>();

      entries.forEach(entry => {
        const existing = territoryMap.get(entry.territory) || {
          territory: entry.territory,
          totalQuantity: 0,
          totalAmount: 0,
          orderCount: 0,
          uniqueDoctors: new Set<string>(),
          uniqueProducts: new Set<string>(),
        };
        
        existing.totalQuantity += parseInt(entry.quantity);
        existing.totalAmount += parseFloat(entry.totalAmount);
        existing.orderCount += 1;
        existing.uniqueDoctors.add(entry.doctorName);
        existing.uniqueProducts.add(entry.productName);
        
        territoryMap.set(entry.territory, existing);
      });

      const territoryReport = Array.from(territoryMap.values())
        .map(item => ({
          territory: item.territory,
          totalQuantity: item.totalQuantity,
          totalAmount: item.totalAmount,
          orderCount: item.orderCount,
          doctorCount: item.uniqueDoctors.size,
          productCount: item.uniqueProducts.size,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

      res.json(territoryReport);
    } catch (error) {
      console.error("Error fetching territory report:", error);
      res.status(500).json({ message: "Failed to fetch territory report" });
    }
  });

  // ========== PHARMA CROSS-ORG ANALYTICS ==========
  // These endpoints allow pharma companies to see prescription/sales data for their products across all organizations

  // Get prescription analytics for products owned by the pharma company (cross-org aggregation)
  app.get("/api/pharma/prescription-analytics", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      if (!user.organizationId && !canAccessAllData(user)) {
        return res.status(403).json({ message: "Organization required for analytics" });
      }
      
      // Get products owned ONLY by user's organization (enforced org scoping)
      // Super admin can optionally filter by organizationId but must specify one
      const orgIdForProducts = canAccessAllData(user) 
        ? (req.query.organizationId as string | undefined)
        : user.organizationId!;
      
      // Non-super admin MUST have org scoping
      const products = orgIdForProducts
        ? await storage.getProductsByOrganization(orgIdForProducts)
        : await storage.getProducts();
      
      if (products.length === 0) {
        return res.json({ products: [], totalPrescriptions: 0, totalQuantity: 0 });
      }
      
      // Get prescription medicines for ONLY the owned products (cross-org aggregation)
      // This fetches prescriptions from ALL organizations but only for owned productIds
      const prescriptionData = await Promise.all(
        products.map(async (product) => {
          const medicines = await storage.getPrescriptionMedicinesByProduct(product.id);
          return {
            productId: product.id,
            productName: product.name,
            genericName: product.genericName || null,
            // Return only aggregate counts, no raw prescription details
            prescriptionCount: medicines.length,
            totalQuantity: medicines.reduce((sum, m) => sum + (m.quantity || 0), 0),
          };
        })
      );
      
      const totalPrescriptions = prescriptionData.reduce((sum, p) => sum + p.prescriptionCount, 0);
      const totalQuantity = prescriptionData.reduce((sum, p) => sum + p.totalQuantity, 0);
      
      // Return only aggregated data, no raw prescription details
      res.json({
        products: prescriptionData.filter(p => p.prescriptionCount > 0).sort((a, b) => b.prescriptionCount - a.prescriptionCount),
        totalPrescriptions,
        totalQuantity,
      });
    } catch (error: any) {
      console.error("Error fetching pharma prescription analytics:", error);
      res.status(500).json({ message: "Failed to fetch prescription analytics", error: error?.message });
    }
  });

  // Get sales analytics for products owned by the pharma company (cross-org aggregation)
  app.get("/api/pharma/sales-analytics", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { startDate, endDate } = req.query;
      
      if (!user.organizationId && !canAccessAllData(user)) {
        return res.status(403).json({ message: "Organization required for analytics" });
      }
      
      // Get products owned ONLY by user's organization (enforced org scoping)
      // Super admin can optionally filter by organizationId but defaults to all
      const orgIdForProducts = canAccessAllData(user) 
        ? (req.query.organizationId as string | undefined)
        : user.organizationId!;
      
      const products = orgIdForProducts 
        ? await storage.getProductsByOrganization(orgIdForProducts)
        : await storage.getProducts();
      
      if (products.length === 0) {
        return res.json({ products: [], totalSales: 0, totalQuantity: 0, totalAmount: 0 });
      }
      
      // Get ALL sales entries across ALL users (cross-org) to aggregate for owned products
      // This is the key difference from regular reports - we don't filter by user.id
      const salesEntries = await storage.getSalesEntries(
        undefined,  // No user filter - cross-org aggregation
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      // Only include sales that match owned product IDs (strict product ownership scoping)
      const ownedProductIds = new Set(products.map(p => p.id));
      const ownedProductNames = new Set(products.map(p => p.name.toLowerCase()));
      
      const productSalesData = products.map(product => {
        // Match by productId first (preferred), fallback to product name match
        const productSales = salesEntries.filter(s => 
          s.productId === product.id ||
          (s.productName && ownedProductNames.has(s.productName.toLowerCase()) && s.productName.toLowerCase() === product.name.toLowerCase())
        );
        return {
          productId: product.id,
          productName: product.name,
          genericName: product.genericName || null,
          // Return only aggregate counts, no raw data
          salesCount: productSales.length,
          totalQuantity: productSales.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0),
          totalAmount: productSales.reduce((sum, s) => sum + (parseFloat(s.totalAmount) || 0), 0),
        };
      });
      
      const totalSales = productSalesData.reduce((sum, p) => sum + p.salesCount, 0);
      const totalQuantity = productSalesData.reduce((sum, p) => sum + p.totalQuantity, 0);
      const totalAmount = productSalesData.reduce((sum, p) => sum + p.totalAmount, 0);
      
      // Return only aggregated data, no raw details
      res.json({
        products: productSalesData.filter(p => p.salesCount > 0).sort((a, b) => b.totalAmount - a.totalAmount),
        totalSales,
        totalQuantity,
        totalAmount,
      });
    } catch (error: any) {
      console.error("Error fetching pharma sales analytics:", error);
      res.status(500).json({ message: "Failed to fetch sales analytics", error: error?.message });
    }
  });

  // MR Analytics - Doctor visit analytics for Medical Representatives
  app.get("/api/mr/visit-analytics", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { startDate, endDate } = req.query;
      
      // Build date filter conditions
      let dateCondition = undefined;
      if (startDate || endDate) {
        const conditions = [];
        if (startDate) {
          conditions.push(gte(doctorVisits.punchInTime, new Date(startDate)));
        }
        if (endDate) {
          conditions.push(lte(doctorVisits.punchInTime, new Date(endDate)));
        }
        dateCondition = and(...conditions);
      }
      
      // Get visits - MRs see their own visits, admins see all org visits
      let visits;
      if (canAccessAllData(user)) {
        visits = dateCondition 
          ? await db.select().from(doctorVisits).where(dateCondition)
          : await db.select().from(doctorVisits);
      } else if (user.role === "company_admin" && user.organizationId) {
        // Company admin sees all MR visits in their org
        const orgUsers = await storage.getUsers(); // Get all users in org
        const orgUserIds = orgUsers.filter(u => u.organizationId === user.organizationId).map(u => u.id);
        visits = dateCondition
          ? await db.select().from(doctorVisits).where(and(inArray(doctorVisits.userId, orgUserIds), dateCondition))
          : await db.select().from(doctorVisits).where(inArray(doctorVisits.userId, orgUserIds));
      } else {
        // Regular MR sees only their own visits
        visits = dateCondition
          ? await db.select().from(doctorVisits).where(and(eq(doctorVisits.userId, user.id), dateCondition))
          : await db.select().from(doctorVisits).where(eq(doctorVisits.userId, user.id));
      }
      
      // Aggregate visit data
      const totalVisits = visits.length;
      const completedVisits = visits.filter(v => v.punchOutTime !== null).length;
      const agreementsReached = visits.filter(v => v.saleAgreement === true).length;
      const totalDuration = visits.reduce((sum, v) => sum + (v.duration || 0), 0);
      const avgDuration = completedVisits > 0 ? Math.round(totalDuration / completedVisits) : 0;
      
      // Group visits by doctor
      const doctorVisitMap = new Map<string, { doctorId: string; visitCount: number; agreements: number; totalDuration: number }>();
      for (const visit of visits) {
        if (!doctorVisitMap.has(visit.doctorId)) {
          doctorVisitMap.set(visit.doctorId, { doctorId: visit.doctorId, visitCount: 0, agreements: 0, totalDuration: 0 });
        }
        const entry = doctorVisitMap.get(visit.doctorId)!;
        entry.visitCount++;
        if (visit.saleAgreement) entry.agreements++;
        entry.totalDuration += visit.duration || 0;
      }
      
      // Get doctor names for top doctors
      const doctorIds = Array.from(doctorVisitMap.keys());
      const doctorsList = await db.select().from(doctors).where(inArray(doctors.id, doctorIds));
      const doctorNameMap = new Map(doctorsList.map(d => [d.id, d.name]));
      
      const topDoctors = Array.from(doctorVisitMap.values())
        .map(d => ({ ...d, doctorName: doctorNameMap.get(d.doctorId) || "Unknown" }))
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, 10);
      
      // Group visits by date for trend
      const visitsByDate = new Map<string, number>();
      for (const visit of visits) {
        const dateKey = visit.punchInTime.toISOString().split('T')[0];
        visitsByDate.set(dateKey, (visitsByDate.get(dateKey) || 0) + 1);
      }
      
      res.json({
        summary: {
          totalVisits,
          completedVisits,
          agreementsReached,
          conversionRate: totalVisits > 0 ? Math.round((agreementsReached / totalVisits) * 100) : 0,
          avgDuration,
        },
        topDoctors,
        visitTrend: Array.from(visitsByDate.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
      });
    } catch (error: any) {
      console.error("Error fetching MR visit analytics:", error);
      res.status(500).json({ message: "Failed to fetch visit analytics", error: error?.message });
    }
  });

  // MR Analytics - Sales performance for Medical Representatives
  app.get("/api/mr/sales-performance", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { startDate, endDate } = req.query;
      
      // Build date filter conditions
      let dateCondition = undefined;
      if (startDate || endDate) {
        const conditions = [];
        if (startDate) {
          conditions.push(gte(salesEntries.createdAt, new Date(startDate)));
        }
        if (endDate) {
          conditions.push(lte(salesEntries.createdAt, new Date(endDate)));
        }
        dateCondition = and(...conditions);
      }
      
      // Get sales - MRs see their own sales, admins see all org sales
      let sales;
      if (canAccessAllData(user)) {
        sales = dateCondition 
          ? await db.select().from(salesEntries).where(dateCondition)
          : await db.select().from(salesEntries);
      } else if (user.role === "company_admin" && user.organizationId) {
        // Company admin sees all MR sales in their org
        const orgUsers = await storage.getUsers();
        const orgUserIds = orgUsers.filter(u => u.organizationId === user.organizationId).map(u => u.id);
        sales = dateCondition
          ? await db.select().from(salesEntries).where(and(inArray(salesEntries.userId, orgUserIds), dateCondition))
          : await db.select().from(salesEntries).where(inArray(salesEntries.userId, orgUserIds));
      } else {
        // Regular MR sees only their own sales
        sales = dateCondition
          ? await db.select().from(salesEntries).where(and(eq(salesEntries.userId, user.id), dateCondition))
          : await db.select().from(salesEntries).where(eq(salesEntries.userId, user.id));
      }
      
      // Aggregate sales data
      const totalSales = sales.length;
      const totalQuantity = sales.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);
      const totalAmount = sales.reduce((sum, s) => sum + (parseFloat(s.totalAmount) || 0), 0);
      
      // Group sales by product
      const productSalesMap = new Map<string, { productName: string; quantity: number; amount: number }>();
      for (const sale of sales) {
        const productName = sale.productName || "Unknown";
        if (!productSalesMap.has(productName)) {
          productSalesMap.set(productName, { productName, quantity: 0, amount: 0 });
        }
        const entry = productSalesMap.get(productName)!;
        entry.quantity += parseInt(sale.quantity) || 0;
        entry.amount += parseFloat(sale.totalAmount) || 0;
      }
      
      const topProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
      
      // Group sales by date for trend
      const salesByDate = new Map<string, { count: number; amount: number }>();
      for (const sale of sales) {
        const dateKey = sale.createdAt.toISOString().split('T')[0];
        if (!salesByDate.has(dateKey)) {
          salesByDate.set(dateKey, { count: 0, amount: 0 });
        }
        const entry = salesByDate.get(dateKey)!;
        entry.count++;
        entry.amount += parseFloat(sale.totalAmount) || 0;
      }
      
      res.json({
        summary: {
          totalSales,
          totalQuantity,
          totalAmount,
          avgSaleValue: totalSales > 0 ? Math.round(totalAmount / totalSales) : 0,
        },
        topProducts,
        salesTrend: Array.from(salesByDate.entries()).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date)),
      });
    } catch (error: any) {
      console.error("Error fetching MR sales performance:", error);
      res.status(500).json({ message: "Failed to fetch sales performance", error: error?.message });
    }
  });

  app.get("/api/analytics/dashboard", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const filterUserId = canAccessAllData(user) ? undefined : userId;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week (Sunday)
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const lastQuarterStart = new Date(quarterStart);
      lastQuarterStart.setMonth(lastQuarterStart.getMonth() - 3);
      
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);

      const [todaySales, yesterdaySales, weekSales, lastWeekSales, monthSales, lastMonthSales, quarterSales, lastQuarterSales, yearSales, lastYearSales] = await Promise.all([
        storage.getSalesEntries(filterUserId, todayStart, now),
        storage.getSalesEntries(filterUserId, yesterdayStart, todayStart),
        storage.getSalesEntries(filterUserId, weekStart, now),
        storage.getSalesEntries(filterUserId, lastWeekStart, weekStart),
        storage.getSalesEntries(filterUserId, monthStart, now),
        storage.getSalesEntries(filterUserId, lastMonthStart, monthStart),
        storage.getSalesEntries(filterUserId, quarterStart, now),
        storage.getSalesEntries(filterUserId, lastQuarterStart, quarterStart),
        storage.getSalesEntries(filterUserId, yearStart, now),
        storage.getSalesEntries(filterUserId, lastYearStart, yearStart),
      ]);

      const calculateTotal = (entries: any[]) => 
        entries.reduce((sum, e) => sum + parseFloat(e.totalAmount), 0);

      const todayTotal = calculateTotal(todaySales);
      const yesterdayTotal = calculateTotal(yesterdaySales);
      const weekTotal = calculateTotal(weekSales);
      const lastWeekTotal = calculateTotal(lastWeekSales);
      const monthTotal = calculateTotal(monthSales);
      const lastMonthTotal = calculateTotal(lastMonthSales);
      const quarterTotal = calculateTotal(quarterSales);
      const lastQuarterTotal = calculateTotal(lastQuarterSales);
      const yearTotal = calculateTotal(yearSales);
      const lastYearTotal = calculateTotal(lastYearSales);

      const calculatePercentChange = (current: number, previous: number) => 
        previous === 0 ? 0 : ((current - previous) / previous) * 100;

      res.json({
        today: {
          total: todayTotal,
          percentChange: calculatePercentChange(todayTotal, yesterdayTotal),
        },
        week: {
          total: weekTotal,
          percentChange: calculatePercentChange(weekTotal, lastWeekTotal),
        },
        month: {
          total: monthTotal,
          percentChange: calculatePercentChange(monthTotal, lastMonthTotal),
        },
        quarter: {
          total: quarterTotal,
          percentChange: calculatePercentChange(quarterTotal, lastQuarterTotal),
        },
        year: {
          total: yearTotal,
          percentChange: calculatePercentChange(yearTotal, lastYearTotal),
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Company settings routes (admin only)
  app.get("/api/company-settings", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "doctor", "doctor_frontdesk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.put("/api/company-settings", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertCompanySettingsSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const settings = await storage.upsertCompanySettings(validation.data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(500).json({ message: "Failed to update company settings" });
    }
  });

  // ========== Master Data Routes ==========

  // Specialties routes (case-insensitive)
  app.get("/api/specialties", isAuthenticated, async (req: any, res) => {
    try {
      const specialties = await storage.getSpecialties(true); // Only active specialties
      res.json(specialties);
    } catch (error) {
      console.error("Error fetching specialties:", error);
      res.status(500).json({ message: "Failed to fetch specialties" });
    }
  });

  app.post("/api/specialties", isAuthenticated, async (req: any, res) => {
    try {
      const { name } = req.body;
      
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ message: "Specialty name is required" });
      }

      // Check for case-insensitive duplicate
      const existing = await storage.getSpecialtyByName(name);
      if (existing) {
        // Return existing specialty instead of creating duplicate
        return res.json(existing);
      }

      const specialty = await storage.createSpecialty({ name: name.trim() });
      res.status(201).json(specialty);
    } catch (error: any) {
      console.error("Error creating specialty:", error);
      if (error.code === "23505") { // Unique constraint violation
        const existing = await storage.getSpecialtyByName(req.body.name);
        if (existing) {
          return res.json(existing);
        }
      }
      res.status(500).json({ message: "Failed to create specialty" });
    }
  });

  app.patch("/api/specialties/:id", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, isActive } = req.body;

      // If updating name, check for case-insensitive duplicate
      if (name) {
        const existing = await storage.getSpecialtyByName(name);
        if (existing && existing.id !== id) {
          return res.status(400).json({ message: "A specialty with this name already exists" });
        }
      }

      const specialty = await storage.updateSpecialty(id, { name, isActive });
      if (!specialty) {
        return res.status(404).json({ message: "Specialty not found" });
      }
      res.json(specialty);
    } catch (error) {
      console.error("Error updating specialty:", error);
      res.status(500).json({ message: "Failed to update specialty" });
    }
  });

  app.delete("/api/specialties/:id", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSpecialty(id);
      if (!deleted) {
        return res.status(404).json({ message: "Specialty not found" });
      }
      res.json({ message: "Specialty deleted successfully" });
    } catch (error) {
      console.error("Error deleting specialty:", error);
      res.status(500).json({ message: "Failed to delete specialty" });
    }
  });

  // Doctor routes
  app.post("/api/doctors", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      const validation = insertDoctorSchema.omit({ userId: true }).safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const doctor = await storage.createDoctor({
        ...validation.data,
        userId,
      });

      res.status(201).json(doctor);
    } catch (error) {
      console.error("Error creating doctor:", error);
      res.status(500).json({ message: "Failed to create doctor" });
    }
  });

  app.get("/api/doctors", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Company admins and super admins can see all doctors, regular users only see their own
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      const doctorsWithPerson = await storage.getDoctorsWithPerson(filterUserId);
      
      // Format response with Person Master data merged
      const formattedDoctors = doctorsWithPerson.map(doc => ({
        ...doc,
        displayName: doc.person ? `${doc.person.firstName} ${doc.person.lastName || ''}`.trim() : doc.name,
        personCnic: doc.person?.cnic,
        personPhone: doc.person?.phone || doc.phone,
        personEmail: doc.person?.email || doc.email,
        personId: doc.personId,
      }));
      
      res.json(formattedDoctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  // Doctor Excel Routes
  app.get("/api/doctors/template", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const wb = XLSX.utils.book_new();
      const headers = [
        "Name*",
        "Email*",
        "Phone",
        "Specialty",
        "Hospital",
        "Address",
        "Latitude",
        "Longitude"
      ];
      
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Name
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 20 }, // Specialty
        { wch: 25 }, // Hospital
        { wch: 30 }, // Address
        { wch: 12 }, // Latitude
        { wch: 12 }  // Longitude
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, "Doctors Template");
      
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename="doctors_template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
    } catch (error) {
      console.error("Error generating doctors template:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  app.post("/api/doctors/upload", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), upload.single('file'), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({ message: "Excel file is empty" });
      }

      // Validate headers
      const requiredHeaders = ["Name*", "Email*"];
      const firstRow: any = data[0];
      const missingHeaders = requiredHeaders.filter(header => !(header in firstRow || header.replace('*', '') in firstRow));
      
      if (missingHeaders.length > 0) {
        return res.status(400).json({ 
          message: `Missing required columns: ${missingHeaders.join(', ')}` 
        });
      }

      // Get existing doctors for duplicate detection
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      const existingDoctors = await storage.getDoctors(filterUserId);
      const existingEmailsSet = new Set(existingDoctors.map(d => d.email.toLowerCase()));

      const validRows = [];
      const errors = [];
      const duplicates = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2;

        try {
          const name = row["Name*"] || row["Name"];
          const email = row["Email*"] || row["Email"];
          
          if (!name || !email) {
            errors.push({ row: rowNum, message: "Missing required fields (Name, Email)" });
            continue;
          }

          // Check for duplicate email
          if (existingEmailsSet.has(email.toLowerCase())) {
            duplicates.push({
              name: name.toString(),
              email: email.toString()
            });
            continue;
          }

          const phone = row["Phone"] || row["phone"] || "";
          const specialty = row["Specialty"] || row["specialty"] || "";
          const hospital = row["Hospital"] || row["hospital"] || "";
          const address = row["Address"] || row["address"] || "";
          const latitude = row["Latitude"] || row["latitude"] || null;
          const longitude = row["Longitude"] || row["longitude"] || null;

          validRows.push({
            userId,
            name: name.toString(),
            email: email.toString(),
            phone: phone.toString(),
            specialty: specialty.toString(),
            hospital: hospital.toString(),
            address: address.toString(),
            latitude: latitude ? latitude.toString() : null,
            longitude: longitude ? longitude.toString() : null
          });
        } catch (error) {
          errors.push({ row: rowNum, message: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
      }

      if (duplicates.length > 0) {
        return res.status(409).json({
          message: `Found ${duplicates.length} duplicate doctor(s) by email`,
          duplicates,
          validRows: validRows.length,
          errors
        });
      }

      if (errors.length > 0 && validRows.length === 0) {
        return res.status(400).json({
          message: "No valid rows to import",
          errors
        });
      }

      // Insert valid rows
      for (const rowData of validRows) {
        await storage.createDoctor(rowData);
      }

      res.json({
        message: `Successfully imported ${validRows.length} doctor(s)`,
        imported: validRows.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error uploading doctors:", error);
      res.status(500).json({ message: "Failed to upload doctors data" });
    }
  });

  app.post("/api/doctors/upload-with-update", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), upload.single('file'), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({ message: "Excel file is empty" });
      }

      const filterUserId = canAccessAllData(user) ? undefined : userId;
      const existingDoctors = await storage.getDoctors(filterUserId);
      const existingEmailMap = new Map(existingDoctors.map(d => [d.email.toLowerCase(), d]));

      let inserted = 0;
      let updated = 0;
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2;

        try {
          const name = row["Name*"] || row["Name"];
          const email = row["Email*"] || row["Email"];
          
          if (!name || !email) {
            errors.push({ row: rowNum, message: "Missing required fields" });
            continue;
          }

          const phone = row["Phone"] || row["phone"] || "";
          const specialty = row["Specialty"] || row["specialty"] || "";
          const hospital = row["Hospital"] || row["hospital"] || "";
          const address = row["Address"] || row["address"] || "";
          const latitude = row["Latitude"] || row["latitude"] || null;
          const longitude = row["Longitude"] || row["longitude"] || null;

          const doctorData: any = {
            userId,
            name: name.toString(),
            email: email.toString(),
            phone: phone.toString(),
            specialty: specialty.toString(),
            hospital: hospital.toString(),
            address: address.toString(),
            latitude: latitude ? latitude.toString() : null,
            longitude: longitude ? longitude.toString() : null
          };

          const existing = existingEmailMap.get(email.toLowerCase());
          if (existing) {
            await storage.updateDoctor(existing.id, doctorData);
            updated++;
          } else {
            await storage.createDoctor(doctorData);
            inserted++;
          }
        } catch (error) {
          errors.push({ row: rowNum, message: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
      }

      res.json({
        message: `Successfully processed ${inserted + updated} doctor(s) (${inserted} new, ${updated} updated)`,
        inserted,
        updated,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error uploading doctors with update:", error);
      res.status(500).json({ message: "Failed to upload doctors data" });
    }
  });


  app.get("/api/doctors/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const doctor = await storage.getDoctorById(req.params.id);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Regular users can only access their own doctors
      if (!canAccessAllData(user) && doctor.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(doctor);
    } catch (error) {
      console.error("Error fetching doctor:", error);
      res.status(500).json({ message: "Failed to fetch doctor" });
    }
  });

  app.patch("/api/doctors/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const doctor = await storage.getDoctorById(req.params.id);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Regular users can only update their own doctors
      if (!canAccessAllData(user) && doctor.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validation = insertDoctorSchema.omit({ userId: true }).partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const updated = await storage.updateDoctor(req.params.id, validation.data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating doctor:", error);
      res.status(500).json({ message: "Failed to update doctor" });
    }
  });

  app.delete("/api/doctors/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const doctor = await storage.getDoctorById(req.params.id);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Regular users can only delete their own doctors
      if (!canAccessAllData(user) && doctor.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteDoctor(req.params.id);
      res.json({ message: "Doctor deleted successfully" });
    } catch (error) {
      console.error("Error deleting doctor:", error);
      res.status(500).json({ message: "Failed to delete doctor" });
    }
  });


  // Doctor visits routes
  app.post("/api/doctor-visits", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      // Validate required fields
      if (!req.body.doctorId) {
        return res.status(400).json({ message: "doctorId is required" });
      }

      // Check if user already has an active visit
      const activeVisit = await storage.getActiveDoctorVisit(userId);
      if (activeVisit) {
        return res.status(400).json({ message: "You already have an active visit. Please punch out first." });
      }

      // Verify doctor ownership/visibility
      const doctor = await storage.getDoctorById(req.body.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Regular users can only punch into their own doctors
      if (!canAccessAllData(user) && doctor.userId !== userId) {
        return res.status(403).json({ message: "You can only visit your own doctors" });
      }

      // Geolocation verification (100m radius check)
      let locationVerification: { withinRadius: boolean; distance: number } | null = null;
      if (
        req.body.punchInLatitude &&
        req.body.punchInLongitude &&
        doctor.latitude &&
        doctor.longitude
      ) {
        const { verifyLocationWithinRadius } = await import("./utils/geolocation");
        locationVerification = verifyLocationWithinRadius(
          parseFloat(req.body.punchInLatitude),
          parseFloat(req.body.punchInLongitude),
          parseFloat(doctor.latitude),
          parseFloat(doctor.longitude),
          100 // 100 meters radius
        );
        
        // Log verification result for audit purposes
        console.log(`Location verification for doctor ${doctor.name}: ${locationVerification.withinRadius ? "PASSED" : "FAILED"} (${locationVerification.distance}m)`);
        
        // Warning if outside radius, but don't block (business rule: warn but allow)
        if (!locationVerification.withinRadius) {
          console.warn(`User ${userId} checked in ${locationVerification.distance}m away from doctor ${doctor.name}`);
        }
      }

      // Create visit with server-stamped punch-in time
      const visit = await storage.createDoctorVisit({
        userId,
        doctorId: req.body.doctorId,
        punchInTime: new Date(), // Server-controlled
        punchInLatitude: req.body.punchInLatitude || null,
        punchInLongitude: req.body.punchInLongitude || null,
        visitNotes: req.body.visitNotes || null,
        saleAgreement: req.body.saleAgreement || false,
        saleAgreementDetails: req.body.saleAgreementDetails || null,
      });

      // Include location verification in response
      res.status(201).json({
        ...visit,
        _locationVerification: locationVerification,
      });
    } catch (error) {
      console.error("Error creating doctor visit:", error);
      res.status(500).json({ message: "Failed to create doctor visit" });
    }
  });

  app.get("/api/doctor-visits", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      const { doctorId } = req.query;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Company admins and super admins can see all visits, regular users only see their own
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      const visits = await storage.getDoctorVisits(filterUserId, doctorId as string | undefined);
      res.json(visits);
    } catch (error) {
      console.error("Error fetching doctor visits:", error);
      res.status(500).json({ message: "Failed to fetch doctor visits" });
    }
  });

  app.get("/api/doctor-visits/active", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const visit = await storage.getActiveDoctorVisit(userId);
      res.json(visit || null);
    } catch (error) {
      console.error("Error fetching active visit:", error);
      res.status(500).json({ message: "Failed to fetch active visit" });
    }
  });

  app.patch("/api/doctor-visits/:id/punch-out", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      const { punchOutLatitude, punchOutLongitude } = req.body;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const visit = await storage.getDoctorVisitById(req.params.id);
      
      if (!visit) {
        return res.status(404).json({ message: "Visit not found" });
      }

      // Regular users can only punch out their own visits
      if (!canAccessAllData(user) && visit.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (visit.punchOutTime) {
        return res.status(400).json({ message: "Already punched out" });
      }

      // Calculate duration in minutes
      const punchOutTime = new Date();
      const duration = Math.floor((punchOutTime.getTime() - new Date(visit.punchInTime).getTime()) / 60000);

      const updatedVisit = await storage.punchOut(req.params.id, {
        punchOutTime,
        punchOutLatitude,
        punchOutLongitude,
        duration,
      });

      res.json(updatedVisit);
    } catch (error) {
      console.error("Error punching out:", error);
      res.status(500).json({ message: "Failed to punch out" });
    }
  });

  app.patch("/api/doctor-visits/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const visit = await storage.getDoctorVisitById(req.params.id);
      
      if (!visit) {
        return res.status(404).json({ message: "Visit not found" });
      }

      // Regular users can only update their own visits
      if (!canAccessAllData(user) && visit.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Validate and filter allowed fields (prevent modifying server-controlled fields)
      const allowedFields = {
        visitNotes: req.body.visitNotes,
        saleAgreement: req.body.saleAgreement,
        saleAgreementDetails: req.body.saleAgreementDetails,
      };

      // Remove undefined fields
      const updateData = Object.fromEntries(
        Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updatedVisit = await storage.updateDoctorVisit(req.params.id, updateData);
      res.json(updatedVisit);
    } catch (error) {
      console.error("Error updating visit:", error);
      res.status(500).json({ message: "Failed to update visit" });
    }
  });

  // Product routes
  app.post("/api/products", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      const validation = insertProductSchema.omit({ userId: true }).safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const product = await storage.createProduct({
        ...validation.data,
        userId,
      });

      // Create initial price history entry
      await storage.createProductPriceHistory({
        productId: product.id,
        price: validation.data.currentPrice,
        effectiveDate: new Date(),
        notes: "Initial price",
      });

      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get("/api/products", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      const { organizationId } = req.query;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Company admins and super admins can see all products, regular users only see their own
      const filterUserId = canAccessAllData(user) ? undefined : userId;
      const filterOrgId = canAccessAllData(user) 
        ? (organizationId as string | undefined)
        : user.organizationId || undefined;
      const products = await storage.getProducts(filterUserId, filterOrgId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Search products (for linking medicines to pharma products)
  app.get("/api/products/search", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { q, organizationId } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Company admins can only search their org's products
      const filterOrgId = canAccessAllData(user)
        ? (organizationId as string | undefined)
        : user.organizationId || undefined;
      
      const products = await storage.searchProducts(q, filterOrgId);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const product = await storage.getProductById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Regular users can only access their own products
      if (!canAccessAllData(user) && product.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const product = await storage.getProductById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Regular users can only update their own products
      if (!canAccessAllData(user) && product.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validation = insertProductSchema.omit({ userId: true }).partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // If price is being updated, create price history entry
      if (validation.data.currentPrice) {
        const newPrice = parseFloat(validation.data.currentPrice.toString());
        const oldPrice = parseFloat(product.currentPrice.toString());
        
        // Only create history if price actually changed (numeric comparison)
        if (newPrice !== oldPrice) {
          await storage.createProductPriceHistory({
            productId: product.id,
            price: validation.data.currentPrice.toString(),
            effectiveDate: new Date(),
            notes: req.body.priceChangeNotes || "Price updated",
          });
        }
      }

      // Update product with new data (including price if provided)
      const updated = await storage.updateProduct(req.params.id, validation.data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const product = await storage.getProductById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Regular users can only delete their own products
      if (!canAccessAllData(user) && product.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Product price history routes
  app.get("/api/products/:id/price-history", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const product = await storage.getProductById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Regular users can only access price history for their own products
      if (!canAccessAllData(user) && product.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const history = await storage.getProductPriceHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  // ========== Hospital/Clinic Module Routes ==========

  // Healthcare Facilities Routes
  app.post("/api/healthcare/facilities", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Super admin can pass organizationId or organizationName, regular users use their organizationId
      let effectiveOrgId = canAccessAllData(user) ? req.body.organizationId : user.organizationId;
      
      // If no organization is provided/available, automatically create one
      if (!effectiveOrgId) {
        // Use organizationName if provided (from super admin), otherwise use facility name
        const orgName = req.body.organizationName || req.body.name || "My Healthcare Facility";
        
        // Get or create a default organization type
        let orgTypeId = req.body.organizationTypeId;
        if (!orgTypeId) {
          const orgTypes = await storage.getOrganizationTypes();
          const defaultType = orgTypes.find(t => t.code === 'clinic') || orgTypes[0];
          orgTypeId = defaultType?.id;
        }
        
        if (!orgTypeId) {
          return res.status(400).json({ message: "Organization type is required" });
        }
        
        const newOrg = await storage.createOrganization({
          name: orgName,
          organizationTypeId: orgTypeId,
          email: user.email || undefined,
          phone: req.body.phone || undefined,
          address: req.body.address || undefined,
          isActive: true,
          subscriptionTier: "basic",
        });
        
        // For non-super-admin users, also update their organizationId
        if (!canAccessAllData(user)) {
          await storage.updateUser(user.id, { 
            organizationId: newOrg.id,
            userType: "company" // Upgrade user type to company
          });
        }
        
        effectiveOrgId = newOrg.id;
        console.log(`Auto-created organization "${orgName}" (${newOrg.id}) for facility creation by user ${user.id}`);
      }

      const validation = insertHealthcareFacilitySchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Use effective organizationId for security
      const facilityData = {
        ...validation.data,
        organizationId: effectiveOrgId
      };

      const facility = await storage.createHealthcareFacility(facilityData);
      res.status(201).json(facility);
    } catch (error: any) {
      console.error("Error creating healthcare facility:", error);
      // Testing phase: expose full error details
      res.status(500).json({ 
        message: "Failed to create facility", 
        error: error?.message || String(error),
        details: error?.detail || error?.hint || null,
        stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined
      });
    }
  });

  app.get("/api/healthcare/facilities", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const organizationId = canAccessAllData(user) ? req.query.organizationId : user.organizationId;
      
      const facilities = await storage.getHealthcareFacilities(organizationId);
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  // Healthcare dashboard stats for doctors (scoped by organization/facility)
  app.get("/api/healthcare/doctor-stats", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { pool } = await import("./db");
      const today = new Date().toISOString().split('T')[0];
      
      // Build company filter for multi-tenant isolation
      const isSuperAdmin = canAccessAllData(user);
      const companyId = user.companyId || user.organizationId;
      
      if (!isSuperAdmin && !companyId) {
        return res.json({
          todayAppointments: 0,
          pendingQueue: 0,
          inProgress: 0,
          completedToday: 0,
          totalPatients: 0
        });
      }
      
      // Get queue stats - scoped by company/facility
      let queueQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE qe.status = 'waiting') as waiting,
          COUNT(*) FILTER (WHERE qe.status = 'in_progress') as in_progress,
          COUNT(*) FILTER (WHERE qe.status = 'completed') as completed,
          COUNT(*) as total
        FROM queue_entries qe
        JOIN healthcare_facilities hf ON qe.facility_id = hf.id
        WHERE DATE(qe.created_at) = $1
      `;
      let queueParams: any[] = [today];
      
      if (!isSuperAdmin) {
        queueQuery += ` AND hf.company_id = $2`;
        queueParams.push(companyId);
      }
      
      const queueStats = await pool.query(queueQuery, queueParams);
      
      // Get today's appointments - scoped by company/facility
      let appointmentQuery = `
        SELECT COUNT(*) as count FROM appointments a
        JOIN healthcare_facilities hf ON a.facility_id = hf.id
        WHERE DATE(a.scheduled_time) = $1
      `;
      let appointmentParams: any[] = [today];
      
      if (!isSuperAdmin) {
        appointmentQuery += ` AND hf.company_id = $2`;
        appointmentParams.push(companyId);
      }
      
      const appointmentStats = await pool.query(appointmentQuery, appointmentParams);
      
      res.json({
        todayAppointments: parseInt(String(appointmentStats.rows[0]?.count || 0)),
        pendingQueue: parseInt(String(queueStats.rows[0]?.waiting || 0)),
        inProgress: parseInt(String(queueStats.rows[0]?.in_progress || 0)),
        completedToday: parseInt(String(queueStats.rows[0]?.completed || 0)),
        totalPatients: parseInt(String(queueStats.rows[0]?.total || 0))
      });
    } catch (error) {
      console.error("Error fetching doctor stats:", error);
      res.status(500).json({ message: "Failed to fetch doctor stats" });
    }
  });

  // Get facility doctors (for hospital/clinic admin dashboard)
  app.get("/api/healthcare/facility-doctors", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { pool } = await import("./db");
      
      let query = `
        SELECT fd.*, u.first_name, u.last_name, u.email, ds.name as specialty
        FROM facility_doctors fd
        LEFT JOIN users u ON fd.user_id = u.id
        LEFT JOIN doctor_specialties ds ON fd.specialty_id = ds.id
      `;
      const params: any[] = [];
      
      if (!canAccessAllData(user) && user.companyId) {
        query += ` WHERE fd.facility_id IN (SELECT id FROM healthcare_facilities WHERE company_id = $1)`;
        params.push(user.companyId);
      }
      
      query += ` ORDER BY fd.created_at DESC`;
      
      const result = await pool.query(query, params);
      res.json(result.rows.map((row: any) => ({
        ...row,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.name || 'Unknown',
        isAvailable: row.is_available !== false
      })));
    } catch (error) {
      console.error("Error fetching facility doctors:", error);
      res.status(500).json({ message: "Failed to fetch facility doctors" });
    }
  });

  app.get("/api/healthcare/facilities/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const facility = await storage.getHealthcareFacilityById(req.params.id);
      
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      // Check company access
      if (!canAccessAllData(user) && facility.companyId !== user.companyId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(facility);
    } catch (error) {
      console.error("Error fetching facility:", error);
      res.status(500).json({ message: "Failed to fetch facility" });
    }
  });

  app.patch("/api/healthcare/facilities/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Check existing facility ownership
      const existingFacility = await storage.getHealthcareFacilityById(req.params.id);
      if (!existingFacility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      if (!canAccessAllData(user) && existingFacility.companyId !== user.companyId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validation = insertHealthcareFacilitySchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Don't allow changing companyId
      const updateData = { ...validation.data };
      delete (updateData as any).companyId;

      const facility = await storage.updateHealthcareFacility(req.params.id, updateData);
      res.json(facility);
    } catch (error) {
      console.error("Error updating facility:", error);
      res.status(500).json({ message: "Failed to update facility" });
    }
  });

  app.delete("/api/healthcare/facilities/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Check existing facility ownership
      const existingFacility = await storage.getHealthcareFacilityById(req.params.id);
      if (!existingFacility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      if (!canAccessAllData(user) && existingFacility.companyId !== user.companyId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteHealthcareFacility(req.params.id);
      res.json({ message: "Facility deleted successfully" });
    } catch (error) {
      console.error("Error deleting facility:", error);
      res.status(500).json({ message: "Failed to delete facility" });
    }
  });

  // ========== Facility Department Routes ==========

  // Get departments for a facility
  app.get("/api/healthcare/facilities/:facilityId/departments", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const user = req.user as User;
      const facilityId = req.params.facilityId;

      // Verify facility exists and user has access (multi-tenant isolation)
      const facility = await storage.getHealthcareFacilityById(facilityId);
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      if (!canAccessAllData(user) && facility.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const departments = await storage.getFacilityDepartments(facilityId);
      res.json(departments);
    } catch (error) {
      console.error("Error fetching facility departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Create department in a facility
  app.post("/api/healthcare/facilities/:facilityId/departments", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const facilityId = req.params.facilityId;
      
      // Verify facility exists and user has access
      const facility = await storage.getHealthcareFacilityById(facilityId);
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      if (!canAccessAllData(user) && facility.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Validate request body with Zod schema (facilityId comes from URL)
      const validation = insertFacilityDepartmentSchema.omit({ facilityId: true }).safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const deptData = {
        ...validation.data,
        facilityId,
      };
      
      const department = await storage.createFacilityDepartment(deptData);
      res.status(201).json(department);
    } catch (error: any) {
      console.error("Error creating department:", error);
      res.status(500).json({ message: "Failed to create department", error: error?.message });
    }
  });

  // Update department
  app.patch("/api/healthcare/departments/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Verify department exists
      const existing = await storage.getFacilityDepartmentById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Department not found" });
      }

      // Verify facility access
      const facility = await storage.getHealthcareFacilityById(existing.facilityId);
      if (facility && !canAccessAllData(user) && facility.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Validate update data with partial schema (facilityId cannot be changed)
      const validation = insertFacilityDepartmentSchema.partial().omit({ facilityId: true }).safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const updated = await storage.updateFacilityDepartment(req.params.id, validation.data);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating department:", error);
      res.status(500).json({ message: "Failed to update department", error: error?.message });
    }
  });

  // Delete department
  app.delete("/api/healthcare/departments/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Verify department exists
      const existing = await storage.getFacilityDepartmentById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Department not found" });
      }

      // Verify facility access
      const facility = await storage.getHealthcareFacilityById(existing.facilityId);
      if (facility && !canAccessAllData(user) && facility.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteFacilityDepartment(req.params.id);
      res.json({ message: "Department deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting department:", error);
      res.status(500).json({ message: "Failed to delete department", error: error?.message });
    }
  });

  // Department Roles Routes - CRUD for roles within departments
  app.get("/api/healthcare/departments/:departmentId/roles", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Verify department exists and user has access
      const department = await storage.getFacilityDepartmentById(req.params.departmentId);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      const facility = await storage.getHealthcareFacilityById(department.facilityId);
      if (facility && !canAccessAllData(user) && facility.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const roles = await storage.getDepartmentRoles(req.params.departmentId);
      res.json(roles);
    } catch (error: any) {
      console.error("Error fetching department roles:", error);
      res.status(500).json({ message: "Failed to fetch department roles", error: error?.message });
    }
  });

  app.post("/api/healthcare/departments/:departmentId/roles", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Validate request body
      const validation = insertDepartmentRoleSchema.omit({ departmentId: true }).safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      
      // Verify department exists and user has access
      const department = await storage.getFacilityDepartmentById(req.params.departmentId);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      const facility = await storage.getHealthcareFacilityById(department.facilityId);
      if (facility && !canAccessAllData(user) && facility.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const role = await storage.createDepartmentRole({
        ...validation.data,
        departmentId: req.params.departmentId
      });
      res.status(201).json(role);
    } catch (error: any) {
      console.error("Error creating department role:", error);
      res.status(500).json({ message: "Failed to create department role", error: error?.message });
    }
  });

  app.patch("/api/healthcare/department-roles/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Validate request body (partial update, departmentId cannot be changed)
      const validation = insertDepartmentRoleSchema.partial().omit({ departmentId: true }).safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      
      // Verify department role exists
      const existing = await storage.getDepartmentRoleById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Department role not found" });
      }

      // Verify access via department → facility → organization chain
      const department = await storage.getFacilityDepartmentById(existing.departmentId);
      if (department) {
        const facility = await storage.getHealthcareFacilityById(department.facilityId);
        if (facility && !canAccessAllData(user) && facility.organizationId !== user.organizationId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const updated = await storage.updateDepartmentRole(req.params.id, validation.data);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating department role:", error);
      res.status(500).json({ message: "Failed to update department role", error: error?.message });
    }
  });

  app.delete("/api/healthcare/department-roles/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Verify department role exists
      const existing = await storage.getDepartmentRoleById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Department role not found" });
      }

      // Verify access via department → facility → organization chain
      const department = await storage.getFacilityDepartmentById(existing.departmentId);
      if (department) {
        const facility = await storage.getHealthcareFacilityById(department.facilityId);
        if (facility && !canAccessAllData(user) && facility.organizationId !== user.organizationId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      await storage.deleteDepartmentRole(req.params.id);
      res.json({ message: "Department role deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting department role:", error);
      res.status(500).json({ message: "Failed to delete department role", error: error?.message });
    }
  });

  // Healthcare Doctors Routes
  app.post("/api/healthcare/doctors", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const cnic = req.body.cnic; // Extract CNIC separately (not in doctor schema)
      const validation = insertHealthcareDoctorSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Verify facility ownership
      const facility = await storage.getHealthcareFacilityById(validation.data.facilityId);
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      if (!canAccessAllData(user) && facility.companyId !== user.companyId) {
        return res.status(403).json({ message: "Forbidden: Facility not in your company" });
      }

      let personId = validation.data.personId;
      const organizationId = facility.companyId;

      // If no personId provided, create a person entry in Person Master
      if (!personId && organizationId) {
        // Parse name into first/last name
        const nameParts = validation.data.name.trim().split(/\s+/);
        const firstName = nameParts[0] || validation.data.name;
        const lastName = nameParts.slice(1).join(' ') || undefined;

        // Create person entry
        const person = await storage.createPerson({
          firstName,
          lastName,
          email: validation.data.email || undefined,
          phone: validation.data.phone || undefined,
          cnic: cnic || undefined,
        });
        personId = person.id;

        // Create personContext with doctor role
        await storage.createPersonContext({
          personId: person.id,
          organizationId,
          organizationType: facility.facilityType === "hospital" ? "hospital" : "clinic",
          roleType: "doctor",
          designation: validation.data.specialty || undefined,
          employmentType: validation.data.agreementType === "permanent" ? "permanent" : "on_call",
          agreementType: validation.data.agreementType === "permanent" ? "permanent_salary" : "on_call_fee",
          monthlySalary: validation.data.monthlySalary || undefined,
          perPatientFee: validation.data.perPatientFee || undefined,
          percentageShare: validation.data.percentageShare || undefined,
          specialty: validation.data.specialty || undefined,
          qualification: validation.data.qualification || undefined,
          status: "active",
        });
      }

      // Create doctor with personId link
      const doctor = await storage.createHealthcareDoctor({
        ...validation.data,
        personId,
      });
      res.status(201).json(doctor);
    } catch (error) {
      console.error("Error creating healthcare doctor:", error);
      res.status(500).json({ message: "Failed to create doctor" });
    }
  });

  app.get("/api/healthcare/doctors", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const facilityId = req.query.facilityId as string | undefined;

      // If facilityId specified, verify ownership
      if (facilityId) {
        const facility = await storage.getHealthcareFacilityById(facilityId);
        if (!facility) {
          return res.status(404).json({ message: "Facility not found" });
        }
        if (!canAccessAllData(user) && facility.companyId !== user.companyId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      // Get doctors with Person Master data
      const doctorsWithPerson = await storage.getHealthcareDoctorsWithPerson(facilityId);
      
      // Filter by company if user is not super admin
      const filteredDoctors = canAccessAllData(user) ? doctorsWithPerson : await Promise.all(
        doctorsWithPerson.map(async (doc) => {
          const fac = await storage.getHealthcareFacilityById(doc.facilityId);
          return fac && fac.companyId === user.companyId ? doc : null;
        })
      ).then(results => results.filter(Boolean) as typeof doctorsWithPerson);

      // Format response with Person Master data merged
      const formattedDoctors = filteredDoctors.map(doc => ({
        ...doc,
        // If linked to Person Master, use person's data for display
        displayName: doc.person ? `${doc.person.firstName} ${doc.person.lastName || ''}`.trim() : doc.name,
        personCnic: doc.person?.cnic,
        personPhone: doc.person?.phone || doc.phone,
        personEmail: doc.person?.email || doc.email,
        personId: doc.personId,
      }));

      res.json(formattedDoctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  // Search doctors by name or specialty (for frontdesk appointment booking)
  app.get("/api/healthcare/doctors/search", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { name, specialty } = req.query;

      // Get all doctors with Person Master data
      const doctorsWithPerson = await storage.getHealthcareDoctorsWithPerson();
      
      // Filter by company if user is not super admin
      let filteredDoctors = canAccessAllData(user) ? doctorsWithPerson : await Promise.all(
        doctorsWithPerson.map(async (doc) => {
          const fac = await storage.getHealthcareFacilityById(doc.facilityId);
          return fac && fac.companyId === user.companyId ? doc : null;
        })
      ).then(results => results.filter(Boolean) as typeof doctorsWithPerson);

      // Filter by name if provided (search in doctor name or person's first/last name)
      if (name && typeof name === 'string' && name.trim()) {
        const searchName = name.toLowerCase().trim();
        filteredDoctors = filteredDoctors.filter(doc => {
          const doctorName = (doc.name || '').toLowerCase();
          const personName = doc.person ? `${doc.person.firstName || ''} ${doc.person.lastName || ''}`.toLowerCase() : '';
          return doctorName.includes(searchName) || personName.includes(searchName);
        });
      }

      // Filter by specialty if provided
      if (specialty && typeof specialty === 'string' && specialty.trim()) {
        const searchSpecialty = specialty.toLowerCase().trim();
        filteredDoctors = filteredDoctors.filter(doc => 
          (doc.specialty || '').toLowerCase().includes(searchSpecialty)
        );
      }

      // Get unique specialties from the filtered doctors
      const specialties = [...new Set(filteredDoctors.map(d => d.specialty).filter(Boolean))];

      // Format response with Person Master data merged
      const formattedDoctors = filteredDoctors.map(doc => ({
        ...doc,
        personName: doc.person ? `${doc.person.firstName || ''} ${doc.person.lastName || ''}`.trim() : doc.name,
        personPhone: doc.person?.phone || doc.phone,
        personEmail: doc.person?.email || doc.email,
        personId: doc.personId,
      }));

      res.json({
        doctors: formattedDoctors,
        specialties: specialties,
        totalCount: formattedDoctors.length
      });
    } catch (error) {
      console.error("Error searching doctors:", error);
      res.status(500).json({ message: "Failed to search doctors" });
    }
  });

  // Get all specialties for dropdown
  app.get("/api/healthcare/specialties", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;

      // Get all doctors
      const doctors = await storage.getHealthcareDoctorsWithPerson();
      
      // Filter by company if user is not super admin
      const filteredDoctors = canAccessAllData(user) ? doctors : await Promise.all(
        doctors.map(async (doc) => {
          const fac = await storage.getHealthcareFacilityById(doc.facilityId);
          return fac && fac.companyId === user.companyId ? doc : null;
        })
      ).then(results => results.filter(Boolean));

      // Get unique specialties
      const specialties = [...new Set(filteredDoctors.map(d => d.specialty).filter(Boolean))].sort();

      res.json(specialties);
    } catch (error) {
      console.error("Error fetching specialties:", error);
      res.status(500).json({ message: "Failed to fetch specialties" });
    }
  });

  app.get("/api/healthcare/doctors/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const doctor = await storage.getHealthcareDoctorById(req.params.id);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Verify facility ownership
      const facility = await storage.getHealthcareFacilityById(doctor.facilityId);
      if (!facility) {
        return res.status(404).json({ message: "Associated facility not found" });
      }

      if (!canAccessAllData(user) && facility.companyId !== user.companyId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(doctor);
    } catch (error) {
      console.error("Error fetching doctor:", error);
      res.status(500).json({ message: "Failed to fetch doctor" });
    }
  });

  app.patch("/api/healthcare/doctors/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Check existing doctor and facility ownership
      const existingDoctor = await storage.getHealthcareDoctorById(req.params.id);
      if (!existingDoctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const facility = await storage.getHealthcareFacilityById(existingDoctor.facilityId);
      if (!facility) {
        return res.status(404).json({ message: "Associated facility not found" });
      }

      if (!canAccessAllData(user) && facility.companyId !== user.companyId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const cnic = req.body.cnic;
      const validation = insertHealthcareDoctorSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Don't allow changing facilityId
      const updateData = { ...validation.data };
      delete (updateData as any).facilityId;

      // Update person's CNIC if doctor is linked to a person
      if (cnic && existingDoctor.personId) {
        try {
          await storage.updatePerson(existingDoctor.personId, { cnic });
        } catch (e) {
          // Non-critical - continue with doctor update
        }
      }

      const doctor = await storage.updateHealthcareDoctor(req.params.id, updateData);
      res.json(doctor);
    } catch (error) {
      console.error("Error updating doctor:", error);
      res.status(500).json({ message: "Failed to update doctor" });
    }
  });

  app.delete("/api/healthcare/doctors/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Check existing doctor and facility ownership
      const existingDoctor = await storage.getHealthcareDoctorById(req.params.id);
      if (!existingDoctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const facility = await storage.getHealthcareFacilityById(existingDoctor.facilityId);
      if (!facility) {
        return res.status(404).json({ message: "Associated facility not found" });
      }

      if (!canAccessAllData(user) && facility.companyId !== user.companyId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteHealthcareDoctor(req.params.id);
      res.json({ message: "Doctor deleted successfully" });
    } catch (error) {
      console.error("Error deleting doctor:", error);
      res.status(500).json({ message: "Failed to delete doctor" });
    }
  });

  // Doctor Availability Routes
  app.post("/api/healthcare/doctor-availability", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertDoctorAvailabilitySchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Verify doctor and facility ownership
      const doctor = await storage.getHealthcareDoctorById(validation.data.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, doctor.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const availability = await storage.createDoctorAvailability(validation.data);
      res.status(201).json(availability);
    } catch (error) {
      console.error("Error creating availability:", error);
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  app.get("/api/healthcare/doctors/:doctorId/availability", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Verify doctor and facility ownership
      const doctor = await storage.getHealthcareDoctorById(req.params.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, doctor.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const availability = await storage.getDoctorAvailability(req.params.doctorId);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.patch("/api/healthcare/doctor-availability/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing availability and verify ownership
      const existingAvailability = await storage.getDoctorAvailabilityById(req.params.id);
      if (!existingAvailability) {
        return res.status(404).json({ message: "Availability not found" });
      }

      const doctor = await storage.getHealthcareDoctorById(existingAvailability.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Associated doctor not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, doctor.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const validation = insertDoctorAvailabilitySchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Don't allow changing doctorId
      const updateData = { ...validation.data };
      delete (updateData as any).doctorId;

      const availability = await storage.updateDoctorAvailability(req.params.id, updateData);
      res.json(availability);
    } catch (error) {
      console.error("Error updating availability:", error);
      res.status(500).json({ message: "Failed to update availability" });
    }
  });

  app.delete("/api/healthcare/doctor-availability/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing availability and verify ownership
      const existingAvailability = await storage.getDoctorAvailabilityById(req.params.id);
      if (!existingAvailability) {
        return res.status(404).json({ message: "Availability not found" });
      }

      const doctor = await storage.getHealthcareDoctorById(existingAvailability.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Associated doctor not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, doctor.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      await storage.deleteDoctorAvailability(req.params.id);
      res.json({ message: "Availability deleted successfully" });
    } catch (error) {
      console.error("Error deleting availability:", error);
      res.status(500).json({ message: "Failed to delete availability" });
    }
  });

  // Patient Routes
  app.post("/api/healthcare/patients", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertPatientSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Verify facility ownership
      const verifyResult = await verifyFacilityAccess(user, validation.data.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const patient = await storage.createPatient(validation.data);
      res.status(201).json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.get("/api/healthcare/patients", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const facilityId = req.query.facilityId as string | undefined;
      const searchTerm = req.query.search as string | undefined;

      // If facilityId specified, verify ownership
      if (facilityId) {
        const verifyResult = await verifyFacilityAccess(user, facilityId);
        if (!verifyResult.ok) {
          return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
        }
      }
      
      const patients = await storage.getPatients(facilityId, searchTerm);
      
      // Filter by company if user is not super admin
      const filteredPatients = canAccessAllData(user) ? patients : await Promise.all(
        patients.map(async (patient) => {
          const fac = await storage.getHealthcareFacilityById(patient.facilityId);
          return fac && fac.companyId === user.companyId ? patient : null;
        })
      ).then(results => results.filter(Boolean) as typeof patients);

      res.json(filteredPatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Patient search endpoint for front desk
  app.get("/api/healthcare/patients/search", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }

      const { pool } = await import("./db");
      const searchPattern = `%${query}%`;
      
      // Search patients by name, phone, or CNIC
      let result;
      if (canAccessAllData(user)) {
        result = await pool.query(`
          SELECT p.id, p.first_name as "firstName", p.last_name as "lastName", p.phone, p.cnic,
                 p.date_of_birth as "dateOfBirth", p.gender, p.facility_id as "facilityId"
          FROM patients p
          WHERE p.first_name ILIKE $1 
             OR p.last_name ILIKE $1 
             OR p.phone ILIKE $1 
             OR p.cnic ILIKE $1
          ORDER BY p.created_at DESC
          LIMIT 20
        `, [searchPattern]);
      } else {
        // Filter by company facilities
        result = await pool.query(`
          SELECT p.id, p.first_name as "firstName", p.last_name as "lastName", p.phone, p.cnic,
                 p.date_of_birth as "dateOfBirth", p.gender, p.facility_id as "facilityId"
          FROM patients p
          JOIN healthcare_facilities hf ON p.facility_id = hf.id
          WHERE hf.company_id = $1
            AND (p.first_name ILIKE $2 
             OR p.last_name ILIKE $2 
             OR p.phone ILIKE $2 
             OR p.cnic ILIKE $2)
          ORDER BY p.created_at DESC
          LIMIT 20
        `, [user.companyId, searchPattern]);
      }
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error searching patients:", error);
      res.status(500).json({ message: "Failed to search patients" });
    }
  });

  app.get("/api/healthcare/patients/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const patient = await storage.getPatientById(req.params.id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Verify facility ownership
      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.patch("/api/healthcare/patients/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing patient and verify ownership
      const existingPatient = await storage.getPatientById(req.params.id);
      if (!existingPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, existingPatient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const validation = insertPatientSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Don't allow changing facilityId
      const updateData = { ...validation.data };
      delete (updateData as any).facilityId;

      const patient = await storage.updatePatient(req.params.id, updateData);
      res.json(patient);
    } catch (error) {
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete("/api/healthcare/patients/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing patient and verify ownership
      const existingPatient = await storage.getPatientById(req.params.id);
      if (!existingPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, existingPatient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      await storage.deletePatient(req.params.id);
      res.json({ message: "Patient deleted successfully" });
    } catch (error) {
      console.error("Error deleting patient:", error);
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Appointment Routes
  app.post("/api/healthcare/appointments", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertAppointmentSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Verify facility ownership
      const verifyResult = await verifyFacilityAccess(user, validation.data.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const appointment = await storage.createAppointment(validation.data);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.get("/api/healthcare/appointments", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const facilityId = req.query.facilityId as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      // If facilityId specified, verify ownership
      if (facilityId) {
        const verifyResult = await verifyFacilityAccess(user, facilityId);
        if (!verifyResult.ok) {
          return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
        }
      }
      
      const appointments = await storage.getAppointments(facilityId, doctorId, startDate, endDate);
      
      // Filter by company if user is not super admin
      const filteredAppointments = canAccessAllData(user) ? appointments : await Promise.all(
        appointments.map(async (appointment) => {
          const fac = await storage.getHealthcareFacilityById(appointment.facilityId);
          return fac && fac.companyId === user.companyId ? appointment : null;
        })
      ).then(results => results.filter(Boolean) as typeof appointments);

      res.json(filteredAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/healthcare/appointments/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const appointment = await storage.getAppointmentById(req.params.id);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Verify facility ownership
      const verifyResult = await verifyFacilityAccess(user, appointment.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.patch("/api/healthcare/appointments/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing appointment and verify ownership
      const existingAppointment = await storage.getAppointmentById(req.params.id);
      if (!existingAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, existingAppointment.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const validation = insertAppointmentSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Don't allow changing facilityId
      const updateData = { ...validation.data };
      delete (updateData as any).facilityId;

      const appointment = await storage.updateAppointment(req.params.id, updateData);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/healthcare/appointments/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing appointment and verify ownership
      const existingAppointment = await storage.getAppointmentById(req.params.id);
      if (!existingAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, existingAppointment.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      await storage.deleteAppointment(req.params.id);
      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Queue Entry Routes
  app.post("/api/healthcare/queue", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertQueueEntrySchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Verify facility ownership
      const verifyResult = await verifyFacilityAccess(user, validation.data.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      // Auto-generate queue number if not provided
      if (!validation.data.queueNumber) {
        const nextNumber = await storage.getNextQueueNumber(
          validation.data.facilityId,
          validation.data.doctorId,
          validation.data.queueDate
        );
        (validation.data as any).queueNumber = nextNumber;
      }

      const queue = await storage.createQueueEntry(validation.data);
      res.status(201).json(queue);
    } catch (error) {
      console.error("Error creating queue entry:", error);
      res.status(500).json({ message: "Failed to create queue entry" });
    }
  });

  app.get("/api/healthcare/queue", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const facilityId = req.query.facilityId as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;

      // If facilityId specified, verify ownership
      if (facilityId) {
        const verifyResult = await verifyFacilityAccess(user, facilityId);
        if (!verifyResult.ok) {
          return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
        }
      }
      
      const queue = await storage.getQueueEntries(facilityId, doctorId, date);
      
      // Filter by company if user is not super admin
      const filteredQueue = canAccessAllData(user) ? queue : await Promise.all(
        queue.map(async (entry) => {
          const fac = await storage.getHealthcareFacilityById(entry.facilityId);
          return fac && fac.companyId === user.companyId ? entry : null;
        })
      ).then(results => results.filter(Boolean) as typeof queue);

      res.json(filteredQueue);
    } catch (error) {
      console.error("Error fetching queue:", error);
      res.status(500).json({ message: "Failed to fetch queue" });
    }
  });

  app.get("/api/healthcare/queue/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const queueEntry = await storage.getQueueEntryById(req.params.id);
      
      if (!queueEntry) {
        return res.status(404).json({ message: "Queue entry not found" });
      }

      // Verify facility ownership
      const verifyResult = await verifyFacilityAccess(user, queueEntry.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      res.json(queueEntry);
    } catch (error) {
      console.error("Error fetching queue entry:", error);
      res.status(500).json({ message: "Failed to fetch queue entry" });
    }
  });

  app.patch("/api/healthcare/queue/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing queue entry and verify ownership
      const existingQueueEntry = await storage.getQueueEntryById(req.params.id);
      if (!existingQueueEntry) {
        return res.status(404).json({ message: "Queue entry not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, existingQueueEntry.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const validation = insertQueueEntrySchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Don't allow changing facilityId
      const updateData = { ...validation.data };
      delete (updateData as any).facilityId;

      const queueEntry = await storage.updateQueueEntry(req.params.id, updateData);
      res.json(queueEntry);
    } catch (error) {
      console.error("Error updating queue entry:", error);
      res.status(500).json({ message: "Failed to update queue entry" });
    }
  });

  // Payment Routes
  app.post("/api/healthcare/payments", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertPaymentSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Verify facility ownership via patient
      const patient = await storage.getPatientById(validation.data.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const payment = await storage.createPayment(validation.data);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.get("/api/healthcare/payments", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const facilityId = req.query.facilityId as string | undefined;
      const patientId = req.query.patientId as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      // If facilityId specified, verify ownership
      if (facilityId) {
        const verifyResult = await verifyFacilityAccess(user, facilityId);
        if (!verifyResult.ok) {
          return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
        }
      }
      
      const payments = await storage.getPayments(facilityId, patientId, startDate, endDate);
      
      // Filter by company if user is not super admin
      const filteredPayments = canAccessAllData(user) ? payments : await Promise.all(
        payments.map(async (payment) => {
          const patient = await storage.getPatientById(payment.patientId);
          if (!patient) return null;
          const fac = await storage.getHealthcareFacilityById(patient.facilityId);
          return fac && fac.companyId === user.companyId ? payment : null;
        })
      ).then(results => results.filter(Boolean) as typeof payments);

      res.json(filteredPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/healthcare/payments/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const payment = await storage.getPaymentById(req.params.id);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Verify facility ownership via patient
      const patient = await storage.getPatientById(payment.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Associated patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  app.patch("/api/healthcare/payments/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing payment and verify ownership
      const existingPayment = await storage.getPaymentById(req.params.id);
      if (!existingPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const patient = await storage.getPatientById(existingPayment.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Associated patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const validation = insertPaymentSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Don't allow changing patientId
      const updateData = { ...validation.data };
      delete (updateData as any).patientId;

      const payment = await storage.updatePayment(req.params.id, updateData);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  // Patient Vitals Routes
  app.post("/api/healthcare/vitals", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertPatientVitalsSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Verify facility ownership via patient
      const patient = await storage.getPatientById(validation.data.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      // Auto-set recordedBy to current user if not provided
      if (!validation.data.recordedBy) {
        (validation.data as any).recordedBy = user.id;
      }

      const vitals = await storage.createPatientVitals(validation.data);
      res.status(201).json(vitals);
    } catch (error) {
      console.error("Error creating vitals:", error);
      res.status(500).json({ message: "Failed to create vitals" });
    }
  });

  app.get("/api/healthcare/vitals", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const patientId = req.query.patientId as string | undefined;
      const queueEntryId = req.query.queueEntryId as string | undefined;

      // If patientId specified, verify ownership
      if (patientId) {
        const patient = await storage.getPatientById(patientId);
        if (!patient) {
          return res.status(404).json({ message: "Patient not found" });
        }
        const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
        if (!verifyResult.ok) {
          return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
        }
      }
      
      const vitals = await storage.getPatientVitals(patientId, queueEntryId);
      
      // Filter by company if user is not super admin
      const filteredVitals = canAccessAllData(user) ? vitals : await Promise.all(
        vitals.map(async (vital) => {
          const patient = await storage.getPatientById(vital.patientId);
          if (!patient) return null;
          const fac = await storage.getHealthcareFacilityById(patient.facilityId);
          return fac && fac.companyId === user.companyId ? vital : null;
        })
      ).then(results => results.filter(Boolean) as typeof vitals);

      res.json(filteredVitals);
    } catch (error) {
      console.error("Error fetching vitals:", error);
      res.status(500).json({ message: "Failed to fetch vitals" });
    }
  });

  app.get("/api/healthcare/vitals/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const vitals = await storage.getPatientVitalsById(req.params.id);
      
      if (!vitals) {
        return res.status(404).json({ message: "Vitals not found" });
      }

      // Verify facility ownership via patient
      const patient = await storage.getPatientById(vitals.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Associated patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      res.json(vitals);
    } catch (error) {
      console.error("Error fetching vitals:", error);
      res.status(500).json({ message: "Failed to fetch vitals" });
    }
  });

  app.patch("/api/healthcare/vitals/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing vitals and verify ownership
      const existingVitals = await storage.getPatientVitalsById(req.params.id);
      if (!existingVitals) {
        return res.status(404).json({ message: "Vitals not found" });
      }

      const patient = await storage.getPatientById(existingVitals.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Associated patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const validation = insertPatientVitalsSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Don't allow changing patientId or queueEntryId
      const updateData = { ...validation.data };
      delete (updateData as any).patientId;
      delete (updateData as any).queueEntryId;

      const vitals = await storage.updatePatientVitals(req.params.id, updateData);
      res.json(vitals);
    } catch (error) {
      console.error("Error updating vitals:", error);
      res.status(500).json({ message: "Failed to update vitals" });
    }
  });

  // Consultation Routes
  app.post("/api/healthcare/consultations", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertConsultationSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Verify facility ownership
      const verifyResult = await verifyFacilityAccess(user, validation.data.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const consultation = await storage.createConsultation(validation.data);
      res.status(201).json(consultation);
    } catch (error) {
      console.error("Error creating consultation:", error);
      res.status(500).json({ message: "Failed to create consultation" });
    }
  });

  app.get("/api/healthcare/consultations", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const facilityId = req.query.facilityId as string | undefined;
      const patientId = req.query.patientId as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;

      // If facilityId specified, verify ownership
      if (facilityId) {
        const verifyResult = await verifyFacilityAccess(user, facilityId);
        if (!verifyResult.ok) {
          return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
        }
      }
      
      const consultations = await storage.getConsultations(facilityId, patientId, doctorId);
      
      // Filter by company if user is not super admin
      const filteredConsultations = canAccessAllData(user) ? consultations : await Promise.all(
        consultations.map(async (consultation) => {
          const fac = await storage.getHealthcareFacilityById(consultation.facilityId);
          return fac && fac.companyId === user.companyId ? consultation : null;
        })
      ).then(results => results.filter(Boolean) as typeof consultations);

      res.json(filteredConsultations);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      res.status(500).json({ message: "Failed to fetch consultations" });
    }
  });

  app.get("/api/healthcare/consultations/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const consultation = await storage.getConsultationById(req.params.id);
      
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }

      // Verify facility ownership
      const verifyResult = await verifyFacilityAccess(user, consultation.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      res.json(consultation);
    } catch (error) {
      console.error("Error fetching consultation:", error);
      res.status(500).json({ message: "Failed to fetch consultation" });
    }
  });

  app.patch("/api/healthcare/consultations/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing consultation and verify ownership
      const existingConsultation = await storage.getConsultationById(req.params.id);
      if (!existingConsultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, existingConsultation.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const validation = insertConsultationSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Don't allow changing facilityId
      const updateData = { ...validation.data };
      delete (updateData as any).facilityId;

      const consultation = await storage.updateConsultation(req.params.id, updateData);
      res.json(consultation);
    } catch (error) {
      console.error("Error updating consultation:", error);
      res.status(500).json({ message: "Failed to update consultation" });
    }
  });

  // Prescription Routes
  app.post("/api/healthcare/prescriptions", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertPrescriptionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Verify facility ownership via patient
      const patient = await storage.getPatientById(validation.data.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const prescription = await storage.createPrescription(validation.data);
      res.status(201).json(prescription);
    } catch (error) {
      console.error("Error creating prescription:", error);
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  app.get("/api/healthcare/prescriptions", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const patientId = req.query.patientId as string | undefined;
      const consultationId = req.query.consultationId as string | undefined;

      // If patientId specified, verify ownership
      if (patientId) {
        const patient = await storage.getPatientById(patientId);
        if (!patient) {
          return res.status(404).json({ message: "Patient not found" });
        }
        const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
        if (!verifyResult.ok) {
          return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
        }
      }
      
      const prescriptions = await storage.getPrescriptions(patientId, consultationId);
      
      // Filter by company if user is not super admin
      const filteredPrescriptions = canAccessAllData(user) ? prescriptions : await Promise.all(
        prescriptions.map(async (prescription) => {
          const patient = await storage.getPatientById(prescription.patientId);
          if (!patient) return null;
          const fac = await storage.getHealthcareFacilityById(patient.facilityId);
          return fac && fac.companyId === user.companyId ? prescription : null;
        })
      ).then(results => results.filter(Boolean) as typeof prescriptions);

      res.json(filteredPrescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.get("/api/healthcare/prescriptions/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const prescription = await storage.getPrescriptionById(req.params.id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }

      // Verify facility ownership via patient
      const patient = await storage.getPatientById(prescription.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Associated patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      res.json(prescription);
    } catch (error) {
      console.error("Error fetching prescription:", error);
      res.status(500).json({ message: "Failed to fetch prescription" });
    }
  });

  app.patch("/api/healthcare/prescriptions/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing prescription and verify ownership
      const existingPrescription = await storage.getPrescriptionById(req.params.id);
      if (!existingPrescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }

      const patient = await storage.getPatientById(existingPrescription.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Associated patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const validation = insertPrescriptionSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Don't allow changing patientId or consultationId
      const updateData = { ...validation.data };
      delete (updateData as any).patientId;
      delete (updateData as any).consultationId;

      const prescription = await storage.updatePrescription(req.params.id, updateData);
      res.json(prescription);
    } catch (error) {
      console.error("Error updating prescription:", error);
      res.status(500).json({ message: "Failed to update prescription" });
    }
  });

  // Test Report Routes
  app.post("/api/healthcare/test-reports", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertTestReportSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Verify facility ownership via patient
      const patient = await storage.getPatientById(validation.data.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      // Auto-set uploadedBy to current user if not provided
      if (!validation.data.uploadedBy) {
        (validation.data as any).uploadedBy = user.id;
      }

      const report = await storage.createTestReport(validation.data);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating test report:", error);
      res.status(500).json({ message: "Failed to create test report" });
    }
  });

  app.get("/api/healthcare/test-reports", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const patientId = req.query.patientId as string | undefined;
      const consultationId = req.query.consultationId as string | undefined;

      // If patientId specified, verify ownership
      if (patientId) {
        const patient = await storage.getPatientById(patientId);
        if (!patient) {
          return res.status(404).json({ message: "Patient not found" });
        }
        const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
        if (!verifyResult.ok) {
          return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
        }
      }
      
      const reports = await storage.getTestReports(patientId, consultationId);
      
      // Filter by company if user is not super admin
      const filteredReports = canAccessAllData(user) ? reports : await Promise.all(
        reports.map(async (report) => {
          const patient = await storage.getPatientById(report.patientId);
          if (!patient) return null;
          const fac = await storage.getHealthcareFacilityById(patient.facilityId);
          return fac && fac.companyId === user.companyId ? report : null;
        })
      ).then(results => results.filter(Boolean) as typeof reports);

      res.json(filteredReports);
    } catch (error) {
      console.error("Error fetching test reports:", error);
      res.status(500).json({ message: "Failed to fetch test reports" });
    }
  });

  app.get("/api/healthcare/test-reports/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const report = await storage.getTestReportById(req.params.id);
      
      if (!report) {
        return res.status(404).json({ message: "Test report not found" });
      }

      // Verify facility ownership via patient
      const patient = await storage.getPatientById(report.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Associated patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      res.json(report);
    } catch (error) {
      console.error("Error fetching test report:", error);
      res.status(500).json({ message: "Failed to fetch test report" });
    }
  });

  app.patch("/api/healthcare/test-reports/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Fetch existing test report and verify ownership
      const existingReport = await storage.getTestReportById(req.params.id);
      if (!existingReport) {
        return res.status(404).json({ message: "Test report not found" });
      }

      const patient = await storage.getPatientById(existingReport.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Associated patient not found" });
      }

      const verifyResult = await verifyFacilityAccess(user, patient.facilityId);
      if (!verifyResult.ok) {
        return res.status(verifyResult.error === "Facility not found" ? 404 : 403).json({ message: verifyResult.error });
      }

      const validation = insertTestReportSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Don't allow changing patientId or consultationId
      const updateData = { ...validation.data };
      delete (updateData as any).patientId;
      delete (updateData as any).consultationId;

      const report = await storage.updateTestReport(req.params.id, updateData);
      res.json(report);
    } catch (error) {
      console.error("Error updating test report:", error);
      res.status(500).json({ message: "Failed to update test report" });
    }
  });

  app.delete("/api/healthcare/test-reports/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      await storage.deleteTestReport(req.params.id);
      res.json({ message: "Test report deleted successfully" });
    } catch (error) {
      console.error("Error deleting test report:", error);
      res.status(500).json({ message: "Failed to delete test report" });
    }
  });

  // ========== Pharma & MR Module Routes ==========

  // Product Samples Routes
  app.post("/api/product-samples", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertProductSampleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const sample = await storage.createProductSample(validation.data);
      res.status(201).json(sample);
    } catch (error) {
      console.error("Error creating product sample:", error);
      res.status(500).json({ message: "Failed to create product sample" });
    }
  });

  app.get("/api/product-samples", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { productId, companyId } = req.query;
      const samples = await storage.getProductSamples(productId, companyId);
      res.json(samples);
    } catch (error) {
      console.error("Error fetching product samples:", error);
      res.status(500).json({ message: "Failed to fetch product samples" });
    }
  });

  app.get("/api/product-samples/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const sample = await storage.getProductSampleById(req.params.id);
      if (!sample) {
        return res.status(404).json({ message: "Product sample not found" });
      }
      res.json(sample);
    } catch (error) {
      console.error("Error fetching product sample:", error);
      res.status(500).json({ message: "Failed to fetch product sample" });
    }
  });

  app.patch("/api/product-samples/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertProductSampleSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const sample = await storage.updateProductSample(req.params.id, validation.data);
      if (!sample) {
        return res.status(404).json({ message: "Product sample not found" });
      }
      res.json(sample);
    } catch (error) {
      console.error("Error updating product sample:", error);
      res.status(500).json({ message: "Failed to update product sample" });
    }
  });

  app.delete("/api/product-samples/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      await storage.deleteProductSample(req.params.id);
      res.json({ message: "Product sample deleted successfully" });
    } catch (error) {
      console.error("Error deleting product sample:", error);
      res.status(500).json({ message: "Failed to delete product sample" });
    }
  });

  // Sample Distributions Routes
  app.post("/api/sample-distributions", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertSampleDistributionSchema.safeParse({
        ...req.body,
        userId: user.id,
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Deduct from sample inventory
      const sample = await storage.getProductSampleById(validation.data.productSampleId);
      if (!sample) {
        return res.status(404).json({ message: "Product sample not found" });
      }
      if (sample.quantity < validation.data.quantity) {
        return res.status(400).json({ message: "Insufficient sample quantity" });
      }

      await storage.updateProductSample(sample.id, {
        quantity: sample.quantity - validation.data.quantity,
      });

      const distribution = await storage.createSampleDistribution(validation.data);
      res.status(201).json(distribution);
    } catch (error) {
      console.error("Error creating sample distribution:", error);
      res.status(500).json({ message: "Failed to create sample distribution" });
    }
  });

  app.get("/api/sample-distributions", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { userId, doctorId } = req.query;
      
      // Regular users can only see their own distributions
      const effectiveUserId = canAccessAllData(user) ? userId : user.id;
      const distributions = await storage.getSampleDistributions(effectiveUserId, doctorId);
      res.json(distributions);
    } catch (error) {
      console.error("Error fetching sample distributions:", error);
      res.status(500).json({ message: "Failed to fetch sample distributions" });
    }
  });

  // Visit Requests Routes
  app.post("/api/visit-requests", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertVisitRequestSchema.safeParse({
        ...req.body,
        userId: user.id,
        status: "pending",
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const request = await storage.createVisitRequest(validation.data);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating visit request:", error);
      res.status(500).json({ message: "Failed to create visit request" });
    }
  });

  app.get("/api/visit-requests", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { userId, doctorId, status } = req.query;
      
      // Regular users can only see their own requests
      const effectiveUserId = canAccessAllData(user) ? userId : user.id;
      const requests = await storage.getVisitRequests(effectiveUserId, doctorId, status);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching visit requests:", error);
      res.status(500).json({ message: "Failed to fetch visit requests" });
    }
  });

  app.get("/api/visit-requests/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const request = await storage.getVisitRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Visit request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching visit request:", error);
      res.status(500).json({ message: "Failed to fetch visit request" });
    }
  });

  app.patch("/api/visit-requests/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertVisitRequestSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // If status is changing to approved/rejected, set respondedAt
      const updateData: any = { ...validation.data };
      if (updateData.status === "approved" || updateData.status === "rejected") {
        updateData.respondedAt = new Date();
      }

      const request = await storage.updateVisitRequest(req.params.id, updateData);
      if (!request) {
        return res.status(404).json({ message: "Visit request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error updating visit request:", error);
      res.status(500).json({ message: "Failed to update visit request" });
    }
  });

  // Subscription Plans Routes (Super Admin only)
  app.post("/api/subscription-plans", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const validation = insertSubscriptionPlanSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const plan = await storage.createSubscriptionPlan(validation.data);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ message: "Failed to create subscription plan" });
    }
  });

  app.get("/api/subscription-plans", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.patch("/api/subscription-plans/:id", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const validation = insertSubscriptionPlanSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const plan = await storage.updateSubscriptionPlan(req.params.id, validation.data);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });

  app.delete("/api/subscription-plans/:id", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      await storage.deleteSubscriptionPlan(req.params.id);
      res.json({ message: "Subscription plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Failed to delete subscription plan" });
    }
  });

  // Subscriptions Routes (Super Admin manages all, others see their own)
  app.post("/api/subscriptions", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertSubscriptionSchema.safeParse({
        ...req.body,
        createdBy: user.id,
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const subscription = await storage.createSubscription(validation.data);
      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.get("/api/subscriptions", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const user = req.user as User;
      const { userId, companyId } = req.query;
      
      // Super admin sees all, others see their own
      if (canAccessAllData(user)) {
        const subscriptions = await storage.getSubscriptions(userId, companyId);
        res.json(subscriptions);
      } else {
        const subscriptions = await storage.getSubscriptions(user.id, user.companyId || undefined);
        res.json(subscriptions);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/subscriptions/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const subscription = await storage.getSubscriptionById(req.params.id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.patch("/api/subscriptions/:id", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const validation = insertSubscriptionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const subscription = await storage.updateSubscription(req.params.id, validation.data);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  app.delete("/api/subscriptions/:id", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      await storage.deleteSubscription(req.params.id);
      res.json({ message: "Subscription deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  // Route Plans Routes
  app.post("/api/route-plans", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertRoutePlanSchema.safeParse({
        ...req.body,
        userId: user.id,
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const plan = await storage.createRoutePlan(validation.data);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating route plan:", error);
      res.status(500).json({ message: "Failed to create route plan" });
    }
  });

  app.get("/api/route-plans", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { startDate, endDate } = req.query;
      
      const effectiveUserId = canAccessAllData(user) ? undefined : user.id;
      const plans = await storage.getRoutePlans(
        effectiveUserId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      res.json(plans);
    } catch (error) {
      console.error("Error fetching route plans:", error);
      res.status(500).json({ message: "Failed to fetch route plans" });
    }
  });

  app.get("/api/route-plans/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const plan = await storage.getRoutePlanById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Route plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching route plan:", error);
      res.status(500).json({ message: "Failed to fetch route plan" });
    }
  });

  app.patch("/api/route-plans/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertRoutePlanSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const plan = await storage.updateRoutePlan(req.params.id, validation.data);
      if (!plan) {
        return res.status(404).json({ message: "Route plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating route plan:", error);
      res.status(500).json({ message: "Failed to update route plan" });
    }
  });

  app.delete("/api/route-plans/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      await storage.deleteRoutePlan(req.params.id);
      res.json({ message: "Route plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting route plan:", error);
      res.status(500).json({ message: "Failed to delete route plan" });
    }
  });

  // Route Plan Stops Routes
  app.post("/api/route-plan-stops", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertRoutePlanStopSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const stop = await storage.createRoutePlanStop(validation.data);
      res.status(201).json(stop);
    } catch (error) {
      console.error("Error creating route plan stop:", error);
      res.status(500).json({ message: "Failed to create route plan stop" });
    }
  });

  app.get("/api/route-plans/:planId/stops", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const stops = await storage.getRoutePlanStops(req.params.planId);
      res.json(stops);
    } catch (error) {
      console.error("Error fetching route plan stops:", error);
      res.status(500).json({ message: "Failed to fetch route plan stops" });
    }
  });

  app.patch("/api/route-plan-stops/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertRoutePlanStopSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const stop = await storage.updateRoutePlanStop(req.params.id, validation.data);
      if (!stop) {
        return res.status(404).json({ message: "Route plan stop not found" });
      }
      res.json(stop);
    } catch (error) {
      console.error("Error updating route plan stop:", error);
      res.status(500).json({ message: "Failed to update route plan stop" });
    }
  });

  app.delete("/api/route-plan-stops/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      await storage.deleteRoutePlanStop(req.params.id);
      res.json({ message: "Route plan stop deleted successfully" });
    } catch (error) {
      console.error("Error deleting route plan stop:", error);
      res.status(500).json({ message: "Failed to delete route plan stop" });
    }
  });

  // Sales Leads Routes (FR-MR-06)
  app.post("/api/sales-leads", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertSalesLeadSchema.safeParse({
        ...req.body,
        userId: user.id,
        companyId: user.companyId,
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const lead = await storage.createSalesLead(validation.data);
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating sales lead:", error);
      res.status(500).json({ message: "Failed to create sales lead" });
    }
  });

  app.get("/api/sales-leads", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { status } = req.query;
      
      const effectiveUserId = canAccessAllData(user) ? undefined : user.id;
      const effectiveCompanyId = canAccessAllData(user) ? undefined : user.companyId || undefined;
      
      const leads = await storage.getSalesLeads(effectiveUserId, effectiveCompanyId, status);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching sales leads:", error);
      res.status(500).json({ message: "Failed to fetch sales leads" });
    }
  });

  app.get("/api/sales-leads/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const lead = await storage.getSalesLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Sales lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching sales lead:", error);
      res.status(500).json({ message: "Failed to fetch sales lead" });
    }
  });

  app.patch("/api/sales-leads/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertSalesLeadSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const lead = await storage.updateSalesLead(req.params.id, validation.data);
      if (!lead) {
        return res.status(404).json({ message: "Sales lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error updating sales lead:", error);
      res.status(500).json({ message: "Failed to update sales lead" });
    }
  });

  app.delete("/api/sales-leads/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      await storage.deleteSalesLead(req.params.id);
      res.json({ message: "Sales lead deleted successfully" });
    } catch (error) {
      console.error("Error deleting sales lead:", error);
      res.status(500).json({ message: "Failed to delete sales lead" });
    }
  });

  // MR Profile Routes (FR-MR-01)
  app.post("/api/mr-profiles", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertMRProfileSchema.safeParse({
        ...req.body,
        companyId: user.companyId || req.body.companyId,
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const profile = await storage.createMRProfile(validation.data);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating MR profile:", error);
      res.status(500).json({ message: "Failed to create MR profile" });
    }
  });

  app.get("/api/mr-profiles", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const effectiveCompanyId = canAccessAllData(user) ? undefined : user.companyId || undefined;
      
      const profiles = await storage.getMRProfiles(effectiveCompanyId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching MR profiles:", error);
      res.status(500).json({ message: "Failed to fetch MR profiles" });
    }
  });

  app.get("/api/mr-profiles/user/:userId", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const profile = await storage.getMRProfileByUserId(req.params.userId);
      if (!profile) {
        return res.status(404).json({ message: "MR profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching MR profile:", error);
      res.status(500).json({ message: "Failed to fetch MR profile" });
    }
  });

  app.get("/api/mr-profiles/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const profile = await storage.getMRProfileById(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "MR profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching MR profile:", error);
      res.status(500).json({ message: "Failed to fetch MR profile" });
    }
  });

  app.patch("/api/mr-profiles/:id", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertMRProfileSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const profile = await storage.updateMRProfile(req.params.id, validation.data);
      if (!profile) {
        return res.status(404).json({ message: "MR profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error updating MR profile:", error);
      res.status(500).json({ message: "Failed to update MR profile" });
    }
  });

  app.delete("/api/mr-profiles/:id", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      await storage.deleteMRProfile(req.params.id);
      res.json({ message: "MR profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting MR profile:", error);
      res.status(500).json({ message: "Failed to delete MR profile" });
    }
  });

  // Pharma Company Settings Routes (FR-PH-01)
  app.post("/api/pharma-company-settings", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const companyId = user.companyId || req.body.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }

      // Check if settings already exist
      const existing = await storage.getPharmaCompanySettings(companyId);
      if (existing) {
        return res.status(409).json({ message: "Pharma company settings already exist for this company" });
      }

      const validation = insertPharmaCompanySettingsSchema.safeParse({
        ...req.body,
        companyId,
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const settings = await storage.createPharmaCompanySettings(validation.data);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Error creating pharma company settings:", error);
      res.status(500).json({ message: "Failed to create pharma company settings" });
    }
  });

  app.get("/api/pharma-company-settings", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const settings = await storage.getAllPharmaCompanySettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching pharma company settings:", error);
      res.status(500).json({ message: "Failed to fetch pharma company settings" });
    }
  });

  app.get("/api/pharma-company-settings/:companyId", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic", "silver", "golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { companyId } = req.params;
      
      // Non-admins can only view their own company's settings
      if (!canAccessAllData(user) && user.companyId !== companyId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const settings = await storage.getPharmaCompanySettings(companyId);
      if (!settings) {
        return res.status(404).json({ message: "Pharma company settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching pharma company settings:", error);
      res.status(500).json({ message: "Failed to fetch pharma company settings" });
    }
  });

  app.patch("/api/pharma-company-settings/:id", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertPharmaCompanySettingsSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      const settings = await storage.updatePharmaCompanySettings(req.params.id, validation.data);
      if (!settings) {
        return res.status(404).json({ message: "Pharma company settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error updating pharma company settings:", error);
      res.status(500).json({ message: "Failed to update pharma company settings" });
    }
  });

  app.delete("/api/pharma-company-settings/:id", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      await storage.deletePharmaCompanySettings(req.params.id);
      res.json({ message: "Pharma company settings deleted successfully" });
    } catch (error) {
      console.error("Error deleting pharma company settings:", error);
      res.status(500).json({ message: "Failed to delete pharma company settings" });
    }
  });

  // Account Lifecycle Management Routes (FR-SA-03)
  app.get("/api/admin/users", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:userId/suspend", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user to suspended status (using role as a flag for now)
      await storage.updateUser(userId, { role: "suspended" });
      res.json({ message: "Account suspended successfully" });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  app.post("/api/admin/users/:userId/activate", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Reactivate user (set role back to user or original role)
      await storage.updateUser(userId, { role: "user" });
      res.json({ message: "Account activated successfully" });
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ message: "Failed to activate user" });
    }
  });

  app.post("/api/admin/users/:userId/export", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Collect all user data for export
      const exportData = {
        user: { ...user, passwordHash: undefined },
        salesEntries: await storage.getSalesEntries(userId),
        expenses: await storage.getExpenses(userId),
        doctorVisits: await storage.getDoctorVisits(userId),
        callKPIs: await storage.getCallKPIs(userId),
        exportedAt: new Date().toISOString(),
      };
      
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  app.delete("/api/admin/users/:userId", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deleting super admin accounts
      if (user.role === "super_admin") {
        return res.status(403).json({ message: "Cannot delete super admin accounts" });
      }
      
      await storage.deleteUser(userId);
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ========== AI-Powered Features Routes ==========
  const { healthcareAI } = await import("./ai/healthcareAI");
  const { salesAI } = await import("./ai/salesAI");

  // Healthcare AI: Appointment Optimization
  app.get("/api/ai/appointments/suggestions", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { facilityId, doctorId, patientId, urgency } = req.query;
      if (!facilityId) {
        return res.status(400).json({ message: "Facility ID required" });
      }
      
      const suggestions = await healthcareAI.suggestAppointmentSlots(
        facilityId as string,
        doctorId as string | undefined,
        patientId as string | undefined,
        urgency as string || "normal"
      );
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error getting appointment suggestions:", error);
      res.status(500).json({ message: "Failed to generate appointment suggestions" });
    }
  });

  app.post("/api/ai/appointments/accept", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { facilityId, doctorId, patientId, suggestedDate, suggestedTimeSlot, urgencyLevel, confidenceScore, reasoningFactors, expectedWaitTime } = req.body;
      
      const optimization = await healthcareAI.saveAppointmentOptimization({
        facilityId,
        doctorId,
        patientId,
        suggestedDate: new Date(suggestedDate),
        suggestedTimeSlot,
        urgencyLevel: urgencyLevel || "normal",
        confidenceScore,
        reasoningFactors,
        expectedWaitTime,
        isAccepted: true
      });
      
      res.json(optimization);
    } catch (error) {
      console.error("Error saving appointment optimization:", error);
      res.status(500).json({ message: "Failed to save appointment optimization" });
    }
  });

  // Healthcare AI: Patient Risk Scoring
  app.get("/api/ai/patients/:patientId/risk", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { patientId } = req.params;
      const { facilityId } = req.query;
      
      if (!facilityId) {
        return res.status(400).json({ message: "Facility ID required" });
      }
      
      const riskScore = await healthcareAI.calculatePatientRiskScore(patientId, facilityId as string);
      res.json(riskScore);
    } catch (error) {
      console.error("Error calculating patient risk:", error);
      res.status(500).json({ message: "Failed to calculate risk score" });
    }
  });

  app.post("/api/ai/patients/:patientId/risk/save", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { patientId } = req.params;
      const { facilityId, riskScore, riskLevel, riskType, contributingFactors, recommendations } = req.body;
      
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 7);
      
      const savedScore = await healthcareAI.savePatientRiskScore({
        patientId,
        facilityId,
        riskScore,
        riskLevel,
        riskType: riskType || "hospitalization",
        contributingFactors,
        recommendations,
        validUntil
      });
      
      res.json(savedScore);
    } catch (error) {
      console.error("Error saving patient risk score:", error);
      res.status(500).json({ message: "Failed to save risk score" });
    }
  });

  app.get("/api/ai/patients/:patientId/risk/history", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { patientId } = req.params;
      const history = await healthcareAI.getPatientRiskScores(patientId);
      res.json(history);
    } catch (error) {
      console.error("Error getting risk history:", error);
      res.status(500).json({ message: "Failed to get risk history" });
    }
  });

  // Healthcare AI: Lab Suggestions
  app.post("/api/ai/labs/suggestions", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { patientId, symptoms, consultationId } = req.body;
      
      if (!patientId || !symptoms || !Array.isArray(symptoms)) {
        return res.status(400).json({ message: "Patient ID and symptoms array required" });
      }
      
      const suggestions = await healthcareAI.suggestLabTests(patientId, symptoms, consultationId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating lab suggestions:", error);
      res.status(500).json({ message: "Failed to generate lab suggestions" });
    }
  });

  app.post("/api/ai/labs/suggestions/save", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { patientId, consultationId, symptoms, suggestedTests, confidenceScore, diagnosticPattern } = req.body;
      
      const suggestion = await healthcareAI.saveLabSuggestion({
        patientId,
        consultationId,
        symptoms,
        suggestedTests,
        confidenceScore,
        diagnosticPattern,
        status: "pending"
      });
      
      res.json(suggestion);
    } catch (error) {
      console.error("Error saving lab suggestion:", error);
      res.status(500).json({ message: "Failed to save lab suggestion" });
    }
  });

  // Healthcare AI: Teleconsult Triage
  app.post("/api/ai/teleconsult/triage", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { complaint, facilityId, patientId } = req.body;
      
      if (!complaint || !facilityId) {
        return res.status(400).json({ message: "Complaint and facility ID required" });
      }
      
      const triage = await healthcareAI.performTeleconsultTriage(complaint, facilityId, patientId);
      res.json(triage);
    } catch (error) {
      console.error("Error performing triage:", error);
      res.status(500).json({ message: "Failed to perform triage" });
    }
  });

  app.post("/api/ai/teleconsult/triage/save", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { patientId, facilityId, patientComplaint, extractedSymptoms, category, urgencyLevel, suggestedSpecialty, suggestedAction, confidenceScore, redFlags } = req.body;
      
      const savedTriage = await healthcareAI.saveTeleconsultTriage({
        patientId,
        facilityId,
        patientComplaint,
        extractedSymptoms,
        category,
        urgencyLevel,
        suggestedSpecialty,
        suggestedAction,
        confidenceScore,
        redFlags,
        status: "pending"
      });
      
      res.json(savedTriage);
    } catch (error) {
      console.error("Error saving triage:", error);
      res.status(500).json({ message: "Failed to save triage" });
    }
  });

  app.get("/api/ai/teleconsult/triage/history/:facilityId", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "doctor_frontdesk", "front_desk", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { facilityId } = req.params;
      const history = await healthcareAI.getTriageHistory(facilityId);
      res.json(history);
    } catch (error) {
      console.error("Error getting triage history:", error);
      res.status(500).json({ message: "Failed to get triage history" });
    }
  });

  // Healthcare AI: Prescription Validation
  app.post("/api/ai/prescriptions/validate", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { prescriptionId, patientId } = req.body;
      
      if (!prescriptionId || !patientId) {
        return res.status(400).json({ message: "Prescription ID and patient ID required" });
      }
      
      const validation = await healthcareAI.validatePrescription(prescriptionId, patientId);
      res.json(validation);
    } catch (error) {
      console.error("Error validating prescription:", error);
      res.status(500).json({ message: "Failed to validate prescription" });
    }
  });

  app.post("/api/ai/prescriptions/validation/save", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { prescriptionId, patientId, validationStatus, overallRiskLevel, drugInteractions, dosageWarnings, allergyAlerts, duplicateTherapy, requiresPharmacistReview } = req.body;
      
      const savedValidation = await healthcareAI.savePrescriptionValidation({
        prescriptionId,
        patientId,
        validationStatus,
        overallRiskLevel,
        drugInteractions,
        dosageWarnings,
        allergyAlerts,
        duplicateTherapy,
        requiresPharmacistReview: requiresPharmacistReview || false
      });
      
      res.json(savedValidation);
    } catch (error) {
      console.error("Error saving prescription validation:", error);
      res.status(500).json({ message: "Failed to save validation" });
    }
  });

  // MR AI: Call Planning
  app.get("/api/ai/mr/call-plan", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { planDate, territory } = req.query;
      
      const date = planDate ? new Date(planDate as string) : new Date();
      const callPlan = await salesAI.generateCallPlan(userId, date, territory as string);
      res.json(callPlan);
    } catch (error) {
      console.error("Error generating call plan:", error);
      res.status(500).json({ message: "Failed to generate call plan" });
    }
  });

  app.post("/api/ai/mr/call-plan/save", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { planDate, territory, suggestedDoctors, optimizedRoute, totalEstimatedTime, totalTravelDistance, expectedConversions } = req.body;
      
      const savedPlan = await salesAI.saveCallPlan({
        userId,
        planDate: new Date(planDate),
        territory,
        suggestedDoctors,
        optimizedRoute,
        totalEstimatedTime,
        totalTravelDistance,
        expectedConversions,
        status: "accepted"
      });
      
      res.json(savedPlan);
    } catch (error) {
      console.error("Error saving call plan:", error);
      res.status(500).json({ message: "Failed to save call plan" });
    }
  });

  app.get("/api/ai/mr/call-plan/history", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const history = await salesAI.getCallPlans(userId);
      res.json(history);
    } catch (error) {
      console.error("Error getting call plan history:", error);
      res.status(500).json({ message: "Failed to get call plan history" });
    }
  });

  // MR AI: Performance Insights
  app.get("/api/ai/mr/performance-insights", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const insights = await salesAI.generatePerformanceInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ message: "Failed to generate performance insights" });
    }
  });

  app.get("/api/ai/mr/performance-insights/history", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const history = await salesAI.getPerformanceInsights(userId);
      res.json(history);
    } catch (error) {
      console.error("Error getting insights history:", error);
      res.status(500).json({ message: "Failed to get insights history" });
    }
  });

  // MR AI: Target Achievement Alerts
  app.get("/api/ai/mr/achievement-alerts", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const alerts = await salesAI.generateTargetAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error generating alerts:", error);
      res.status(500).json({ message: "Failed to generate achievement alerts" });
    }
  });

  app.get("/api/ai/mr/achievement-alerts/active", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const alerts = await salesAI.getActiveAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error getting active alerts:", error);
      res.status(500).json({ message: "Failed to get active alerts" });
    }
  });

  app.post("/api/ai/mr/achievement-alerts/:alertId/acknowledge", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { alertId } = req.params;
      const userId = req.user.id;
      const result = await salesAI.acknowledgeAlert(alertId, userId);
      res.json(result);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  // MR AI: Sales Forecasting
  app.get("/api/ai/sales/forecast", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { territory, doctorId, productId, period } = req.query;
      
      const forecast = await salesAI.generateSalesForecast(
        userId,
        territory as string,
        doctorId as string,
        productId as string,
        (period as string) || "monthly"
      );
      res.json(forecast);
    } catch (error) {
      console.error("Error generating forecast:", error);
      res.status(500).json({ message: "Failed to generate sales forecast" });
    }
  });

  app.get("/api/ai/sales/forecast/history", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { territory } = req.query;
      const forecasts = await salesAI.getSalesForecasts(userId, territory as string);
      res.json(forecasts);
    } catch (error) {
      console.error("Error getting forecast history:", error);
      res.status(500).json({ message: "Failed to get forecast history" });
    }
  });

  // MR AI: Sample Conversion Predictions
  app.post("/api/ai/samples/conversion", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver", "golden", "custom"]), requireRole(["user", "medical_rep", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { doctorId, productId, sampleQuantity } = req.body;
      
      if (!doctorId || !productId || !sampleQuantity) {
        return res.status(400).json({ message: "Doctor ID, product ID, and sample quantity required" });
      }
      
      const prediction = await salesAI.predictSampleConversion(userId, doctorId, productId, sampleQuantity);
      res.json(prediction);
    } catch (error) {
      console.error("Error predicting conversion:", error);
      res.status(500).json({ message: "Failed to predict sample conversion" });
    }
  });

  // ==========================================
  // Inventory AI Routes
  // ==========================================
  
  // Demand Forecasting
  app.get("/api/ai/inventory/demand-forecast", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { facilityId, productId, period } = req.query;
      
      const { InventoryAIService } = await import("./ai/inventoryAI");
      const inventoryAI = new InventoryAIService();
      const forecast = await inventoryAI.generateDemandForecast(
        userId, 
        facilityId as string || null,
        productId as string || null,
        (period as string) || "monthly"
      );
      res.json(forecast);
    } catch (error) {
      console.error("Error generating demand forecast:", error);
      res.status(500).json({ message: "Failed to generate demand forecast" });
    }
  });

  // Expiry & Waste Prediction
  app.get("/api/ai/inventory/expiry-prediction", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { facilityId, productId } = req.query;
      
      const { InventoryAIService } = await import("./ai/inventoryAI");
      const inventoryAI = new InventoryAIService();
      const predictions = await inventoryAI.predictExpiryWaste(
        userId,
        facilityId as string || null,
        productId as string || null
      );
      res.json(predictions);
    } catch (error) {
      console.error("Error predicting expiry:", error);
      res.status(500).json({ message: "Failed to predict expiry waste" });
    }
  });

  // Smart Reorder Suggestions
  app.get("/api/ai/inventory/reorder-suggestions", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { facilityId } = req.query;
      
      const { InventoryAIService } = await import("./ai/inventoryAI");
      const inventoryAI = new InventoryAIService();
      const suggestions = await inventoryAI.generateReorderSuggestions(
        userId,
        facilityId as string || null
      );
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating reorder suggestions:", error);
      res.status(500).json({ message: "Failed to generate reorder suggestions" });
    }
  });

  // ==========================================
  // Marketing AI Routes  
  // ==========================================

  // Doctor Engagement Scoring
  app.get("/api/ai/marketing/doctor-engagement", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { doctorId } = req.query;
      
      if (!doctorId) {
        return res.status(400).json({ message: "Doctor ID is required" });
      }
      
      const { MarketingAIService } = await import("./ai/marketingAI");
      const marketingAI = new MarketingAIService();
      const engagement = await marketingAI.analyzeDoctorEngagement(
        userId,
        userId,
        doctorId as string
      );
      res.json(engagement);
    } catch (error) {
      console.error("Error calculating engagement:", error);
      res.status(500).json({ message: "Failed to calculate doctor engagement" });
    }
  });

  // Market Segmentation
  app.get("/api/ai/marketing/segmentation", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { segmentType } = req.query;
      
      const { MarketingAIService } = await import("./ai/marketingAI");
      const marketingAI = new MarketingAIService();
      const segments = await marketingAI.generateMarketSegments(
        userId,
        (segmentType as string) || "doctor"
      );
      res.json(segments);
    } catch (error) {
      console.error("Error generating segments:", error);
      res.status(500).json({ message: "Failed to generate market segments" });
    }
  });

  // Campaign Effectiveness Prediction
  app.post("/api/ai/marketing/campaign-prediction", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { campaignName, campaignType, targetSegment, budget, productIds } = req.body;
      
      const { MarketingAIService } = await import("./ai/marketingAI");
      const marketingAI = new MarketingAIService();
      const prediction = await marketingAI.predictCampaignEffectiveness(
        userId,
        campaignName || "New Campaign",
        campaignType || "product_launch",
        targetSegment || null,
        budget || 50000,
        productIds || []
      );
      res.json(prediction);
    } catch (error) {
      console.error("Error predicting campaign:", error);
      res.status(500).json({ message: "Failed to predict campaign effectiveness" });
    }
  });

  // Competitive Intelligence
  app.post("/api/ai/marketing/competitive-insights", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { sourceType, sourceText, territory } = req.body;
      
      if (!sourceText) {
        return res.status(400).json({ message: "Source text is required for analysis" });
      }
      
      const { MarketingAIService } = await import("./ai/marketingAI");
      const marketingAI = new MarketingAIService();
      const insights = await marketingAI.analyzeCompetitiveIntelligence(
        userId,
        sourceType || "dcr",
        sourceText,
        territory as string
      );
      res.json(insights);
    } catch (error) {
      console.error("Error getting competitive insights:", error);
      res.status(500).json({ message: "Failed to get competitive insights" });
    }
  });

  // ==========================================
  // Analytics AI Routes
  // ==========================================

  // Automated Insights
  app.get("/api/ai/analytics/insights", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const { AnalyticsAIService } = await import("./ai/analyticsAI");
      const analyticsAI = new AnalyticsAIService();
      const insights = await analyticsAI.generateAutomatedInsights(
        userId,
        userId
      );
      res.json(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ message: "Failed to generate automated insights" });
    }
  });

  // Anomaly Detection
  app.get("/api/ai/analytics/anomalies", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { dataType } = req.query;
      
      const { AnalyticsAIService } = await import("./ai/analyticsAI");
      const analyticsAI = new AnalyticsAIService();
      const anomalies = await analyticsAI.detectAnomalies(
        userId,
        (dataType as string) || "all"
      );
      res.json(anomalies);
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      res.status(500).json({ message: "Failed to detect anomalies" });
    }
  });

  // Predictive KPIs
  app.get("/api/ai/analytics/predictive-kpis", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { kpiType, period, facilityId } = req.query;
      
      const { AnalyticsAIService } = await import("./ai/analyticsAI");
      const analyticsAI = new AnalyticsAIService();
      const kpis = await analyticsAI.generatePredictiveKPIs(
        userId,
        userId,
        (facilityId as string) || null,
        (kpiType as string) || "revenue",
        (period as string) || "monthly"
      );
      res.json(kpis);
    } catch (error) {
      console.error("Error generating KPIs:", error);
      res.status(500).json({ message: "Failed to generate predictive KPIs" });
    }
  });

  // Natural Language Queries
  app.post("/api/ai/analytics/nl-query", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { query, context } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      const { AnalyticsAIService } = await import("./ai/analyticsAI");
      const analyticsAI = new AnalyticsAIService();
      const result = await analyticsAI.processNaturalLanguageQuery(
        userId,
        query,
        context || null
      );
      res.json(result);
    } catch (error) {
      console.error("Error processing NL query:", error);
      res.status(500).json({ message: "Failed to process natural language query" });
    }
  });

  // NL Query History
  app.get("/api/ai/analytics/nl-query/history", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["golden", "custom"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const { AnalyticsAIService } = await import("./ai/analyticsAI");
      const analyticsAI = new AnalyticsAIService();
      const history = await analyticsAI.getNLQueryHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error getting NL query history:", error);
      res.status(500).json({ message: "Failed to get query history" });
    }
  });

  // ========== Super Admin Routes ==========
  // These routes are only accessible by Super Admin users

  // Get all organizations (Super Admin only)
  app.get("/api/admin/organizations", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        return res.status(403).json({ message: "Super Admin access required" });
      }

      const { pool } = await import("./db");
      const result = await pool.query(`
        SELECT o.*, ot.name as organization_type_name, ot.code as organization_type_code,
               u.email as owner_email, u.first_name as owner_first_name, u.last_name as owner_last_name
        FROM organizations o
        LEFT JOIN organization_types ot ON o.organization_type_id = ot.id
        LEFT JOIN users u ON o.owner_id = u.id
        ORDER BY o.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Get organization types
  app.get("/api/admin/organization-types", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { pool } = await import("./db");
      const result = await pool.query(`
        SELECT * FROM organization_types WHERE is_active = true ORDER BY name
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching organization types:", error);
      res.status(500).json({ message: "Failed to fetch organization types" });
    }
  });

  // Get subscription tiers
  app.get("/api/admin/subscription-tiers", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { orgType } = req.query;
      const { pool } = await import("./db");
      
      let query = `SELECT * FROM subscription_tiers WHERE is_active = true`;
      const params: string[] = [];
      if (orgType) {
        params.push(String(orgType));
        query += ` AND organization_type_code = $1`;
      }
      query += ` ORDER BY organization_type_code, display_order`;
      
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching subscription tiers:", error);
      res.status(500).json({ message: "Failed to fetch subscription tiers" });
    }
  });

  // Get feature modules
  app.get("/api/admin/feature-modules", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { orgType } = req.query;
      const { pool } = await import("./db");
      
      let query = `SELECT * FROM feature_modules WHERE is_active = true`;
      const params: string[] = [];
      if (orgType) {
        params.push(String(orgType));
        query += ` AND $1 = ANY(applicable_org_types)`;
      }
      query += ` ORDER BY category, name`;
      
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching feature modules:", error);
      res.status(500).json({ message: "Failed to fetch feature modules" });
    }
  });

  // ========== Company Management Routes (Super Admin) ==========
  
  // Migrate existing doctors to Person Master (Super Admin only)
  app.post("/api/admin/migrate-doctors-to-persons", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { pool } = await import("./db");
      
      // First, check if person_id column exists; if not, add it
      const columnCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'doctors' AND column_name = 'person_id'
      `);
      
      if (columnCheck.rows.length === 0) {
        await pool.query(`
          ALTER TABLE doctors ADD COLUMN IF NOT EXISTS person_id VARCHAR REFERENCES persons(id) ON DELETE SET NULL
        `);
      }
      
      // Get all MR doctors without person_id
      const doctorsResult = await pool.query(`
        SELECT id, name, phone, email FROM doctors WHERE person_id IS NULL
      `);
      
      let migratedCount = 0;
      const errors: string[] = [];
      
      for (const doc of doctorsResult.rows) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // Parse name - normalize and remove Dr./DR./dr. prefix variations
          let cleanName = doc.name.trim();
          cleanName = cleanName.replace(/^(Dr\.|DR\.|dr\.|Dr |DR |dr )/i, '').trim();
          
          let firstName = cleanName;
          let lastName = null;
          
          if (cleanName.includes(' ')) {
            const nameParts = cleanName.split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ') || null;
          }
          
          // Check if person already exists by email or phone (dedupe)
          let personId = null;
          if (doc.email) {
            const existingPerson = await client.query(`
              SELECT id FROM persons WHERE email = $1 LIMIT 1
            `, [doc.email]);
            if (existingPerson.rows.length > 0) {
              personId = existingPerson.rows[0].id;
            }
          }
          
          if (!personId && doc.phone) {
            const existingPerson = await client.query(`
              SELECT id FROM persons WHERE phone = $1 LIMIT 1
            `, [doc.phone]);
            if (existingPerson.rows.length > 0) {
              personId = existingPerson.rows[0].id;
            }
          }
          
          // Create person entry if not found
          if (!personId) {
            const personResult = await client.query(`
              INSERT INTO persons (id, first_name, last_name, phone, email, is_active, created_at, updated_at)
              VALUES (gen_random_uuid(), $1, $2, $3, $4, true, now(), now())
              RETURNING id
            `, [firstName, lastName, doc.phone, doc.email]);
            personId = personResult.rows[0].id;
          }
          
          // Update doctor to link to person
          await client.query(`
            UPDATE doctors SET person_id = $1 WHERE id = $2
          `, [personId, doc.id]);
          
          await client.query('COMMIT');
          migratedCount++;
        } catch (err: any) {
          await client.query('ROLLBACK');
          errors.push(`Failed to migrate doctor ${doc.id}: ${err.message}`);
        } finally {
          client.release();
        }
      }
      
      res.json({ 
        message: `Migration completed. ${migratedCount} doctors migrated to Person Master.`,
        migratedCount,
        totalFound: doctorsResult.rows.length,
        errors
      });
    } catch (error) {
      console.error("Error migrating doctors:", error);
      res.status(500).json({ message: "Failed to migrate doctors" });
    }
  });

  // Get all companies (Super Admin only)
  app.get("/api/admin/companies", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { pool } = await import("./db");
      const result = await pool.query(`
        SELECT c.*, ct.name as company_type_name 
        FROM companies c
        LEFT JOIN company_types ct ON c.company_type_id = ct.id
        ORDER BY c.name
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Create company (Super Admin only)
  app.post("/api/admin/companies", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { name, email, phone, address, logoUrl, companyTypeId } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Company name is required" });
      }

      const company = await storage.createCompany({
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        logoUrl: logoUrl || null,
        companyTypeId: companyTypeId || null,
        isActive: true,
      });

      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  // Update company (Super Admin only)
  app.put("/api/admin/companies/:id", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, address, logoUrl, companyTypeId, isActive } = req.body;
      
      const { pool } = await import("./db");
      const result = await pool.query(`
        UPDATE companies 
        SET name = COALESCE($1, name),
            email = COALESCE($2, email),
            phone = COALESCE($3, phone),
            address = COALESCE($4, address),
            logo_url = COALESCE($5, logo_url),
            company_type_id = COALESCE($6, company_type_id),
            is_active = COALESCE($7, is_active),
            updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [name, email, phone, address, logoUrl, companyTypeId, isActive, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Delete company (Super Admin only)
  app.delete("/api/admin/companies/:id", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { pool } = await import("./db");
      
      const result = await pool.query(`DELETE FROM companies WHERE id = $1 RETURNING id`, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Create organization (Super Admin only)
  app.post("/api/admin/organizations", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        return res.status(403).json({ message: "Super Admin access required" });
      }

      const { name, organizationTypeId, email, phone, address, city, state, subscriptionTier, subscriptionMonths = 3 } = req.body;
      
      if (!name || !organizationTypeId) {
        return res.status(400).json({ message: "Name and organization type are required" });
      }

      const { pool } = await import("./db");
      
      // Calculate subscription end date (default 3 months)
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + subscriptionMonths);

      const result = await pool.query(`
        INSERT INTO organizations (name, organization_type_id, email, phone, address, city, state, subscription_tier, subscription_end_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [name, organizationTypeId, email || null, phone || null, address || null, city || null, state || null, subscriptionTier || 'basic', subscriptionEndDate]);

      // Log audit
      await pool.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, severity)
        VALUES ($1, 'create', 'organization', $2, $3, 'info')
      `, [user.id, result.rows[0].id, JSON.stringify(result.rows[0])]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  // Update organization (Super Admin only)
  app.put("/api/admin/organizations/:id", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        return res.status(403).json({ message: "Super Admin access required" });
      }

      const { id } = req.params;
      const { name, email, phone, address, city, state, subscriptionTier, subscriptionEndDate, isActive, isSuspended, suspendedReason } = req.body;
      
      const { pool } = await import("./db");

      // Get previous value for audit
      const previous = await pool.query(`SELECT * FROM organizations WHERE id = $1`, [id]);
      if (!previous.rows.length) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const result = await pool.query(`
        UPDATE organizations SET
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          address = COALESCE($4, address),
          city = COALESCE($5, city),
          state = COALESCE($6, state),
          subscription_tier = COALESCE($7, subscription_tier),
          subscription_end_date = COALESCE($8, subscription_end_date),
          is_active = COALESCE($9, is_active),
          is_suspended = COALESCE($10, is_suspended),
          suspended_reason = COALESCE($11, suspended_reason),
          suspended_at = CASE WHEN $10 = true AND is_suspended = false THEN NOW() ELSE suspended_at END,
          suspended_by = CASE WHEN $10 = true AND is_suspended = false THEN $12 ELSE suspended_by END,
          updated_at = NOW()
        WHERE id = $13
        RETURNING *
      `, [name, email, phone, address, city, state, subscriptionTier, subscriptionEndDate, isActive, isSuspended, suspendedReason, user.id, id]);

      // Log audit
      await pool.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_value, new_value, severity)
        VALUES ($1, 'update', 'organization', $2, $3, $4, 'info')
      `, [user.id, id, JSON.stringify(previous.rows[0]), JSON.stringify(result.rows[0])]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  // Extend subscription (Super Admin only)
  app.post("/api/admin/organizations/:id/extend-subscription", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        return res.status(403).json({ message: "Super Admin access required" });
      }

      const { id } = req.params;
      const { months = 3, tier } = req.body;
      
      const { pool } = await import("./db");

      // Get current subscription end date
      const current = await pool.query(`SELECT subscription_end_date, subscription_tier FROM organizations WHERE id = $1`, [id]);
      if (!current.rows.length) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Extend from current end date or now, whichever is later
      const endDate = current.rows[0].subscription_end_date;
      const currentEnd = endDate ? new Date(endDate) : new Date();
      const extensionStart = currentEnd > new Date() ? currentEnd : new Date();
      const newEndDate = new Date(extensionStart);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      const result = await pool.query(`
        UPDATE organizations SET
          subscription_end_date = $1,
          subscription_tier = COALESCE($2, subscription_tier),
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [newEndDate, tier || null, id]);

      // Log audit
      await pool.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_value, new_value, severity, metadata)
        VALUES ($1, 'extend_subscription', 'organization', $2, $3, $4, 'warning', $5)
      `, [user.id, id, JSON.stringify(current.rows[0]), JSON.stringify(result.rows[0]), JSON.stringify({ months, tier })]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error extending subscription:", error);
      res.status(500).json({ message: "Failed to extend subscription" });
    }
  });

  // Create test users for all roles (Super Admin only)
  app.post("/api/admin/create-test-users", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        return res.status(403).json({ message: "Super Admin access required" });
      }

      const { organizationId } = req.body;
      if (!organizationId) {
        return res.status(400).json({ message: "organizationId is required" });
      }

      const bcrypt = await import("bcrypt");
      const { pool } = await import("./db");
      
      // All roles that should have test users
      const testRoles = [
        "doctor", "nurse", "senior_nurse", "ward_manager", "icu_coordinator",
        "ot_technician", "anesthetist", "front_desk", "billing_officer",
        "insurance_coordinator", "pharmacist", "store_keeper", "inventory_manager",
        "lab_technician", "lab_supervisor", "pathologist", "quality_officer",
        "medical_rep", "area_sales_manager", "regional_sales_manager", "zone_head", "sales_analyst",
        "hr_manager", "payroll_officer", "accounts_officer", "finance_manager",
        "system_auditor", "support_agent", "compliance_officer",
        "company_admin"
      ];

      const password = "Password123!";
      const passwordHash = await bcrypt.hash(password, 10);
      const createdUsers: any[] = [];
      const skippedUsers: string[] = [];

      for (const role of testRoles) {
        const email = `${role}@test.com`;
        const firstName = role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

        // Check if user already exists
        const existingUser = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
        if (existingUser.rows.length > 0) {
          skippedUsers.push(email);
          continue;
        }

        // Create user
        const userResult = await pool.query(`
          INSERT INTO users (email, password_hash, first_name, last_name, role, user_type, organization_id, is_active, subscription_active, created_at, updated_at)
          VALUES ($1, $2, $3, 'Test', $4, 'company', $5, true, 'active', NOW(), NOW())
          RETURNING id, email, role
        `, [email, passwordHash, firstName, role, organizationId]);

        if (userResult.rows.length > 0) {
          const newUser = userResult.rows[0];

          // Create person entry
          const personResult = await pool.query(`
            INSERT INTO persons (first_name, last_name, email, user_id, created_at, updated_at)
            VALUES ($1, 'Test', $2, $3, NOW(), NOW())
            RETURNING id
          `, [firstName, email, newUser.id]);

          // Create personContext with role
          if (personResult.rows.length > 0) {
            const personId = personResult.rows[0].id;
            let roleType = "staff";
            if (role === "company_admin" || role === "super_admin") roleType = "admin";
            else if (role.includes("rep") || role.includes("sales") || role.includes("zone")) roleType = "mr";
            else if (role === "doctor") roleType = "doctor";
            else if (role === "nurse" || role === "senior_nurse" || role.includes("ward") || role.includes("icu")) roleType = "nurse";
            else if (role === "front_desk") roleType = "front_desk";
            else if (role === "pharmacist" || role.includes("store") || role.includes("inventory")) roleType = "pharmacist";
            else if (role.includes("lab") || role === "pathologist") roleType = "lab_tech";
            else roleType = "staff";

            await pool.query(`
              INSERT INTO person_contexts (person_id, organization_id, organization_type, role_type, designation, status, created_at, updated_at)
              VALUES ($1, $2, 'hospital', $3, $4, 'active', NOW(), NOW())
            `, [personId, organizationId, roleType, firstName]);
          }

          createdUsers.push({
            email: newUser.email,
            role: newUser.role,
            password: password
          });
        }
      }

      res.json({
        message: `Created ${createdUsers.length} test users`,
        created: createdUsers,
        skipped: skippedUsers,
        password: password
      });
    } catch (error) {
      console.error("Error creating test users:", error);
      res.status(500).json({ message: "Failed to create test users", error: (error as Error).message });
    }
  });

  // Get all users (Super Admin only) - Extended version with org join and PersonContext roles
  app.get("/api/admin/users-extended", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        return res.status(403).json({ message: "Super Admin access required" });
      }

      const { pool } = await import("./db");
      // Get users with their organization
      const usersResult = await pool.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.user_type, u.is_active, u.is_super_admin,
               u.organization_id, u.created_at, u.last_login,
               o.name as organization_name
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        ORDER BY u.created_at DESC
      `);
      
      // Get PersonContext roles for all persons linked to users
      const personContextsResult = await pool.query(`
        SELECT pc.person_id, pc.role_type, pc.organization_type, pc.status, pc.specialty,
               o.name as org_name, p.user_id
        FROM person_contexts pc
        JOIN persons p ON pc.person_id = p.id
        JOIN organizations o ON pc.organization_id = o.id
        WHERE p.user_id IS NOT NULL
        ORDER BY pc.created_at DESC
      `);
      
      // Map PersonContext roles to users by userId
      const userRolesMap: Record<string, any[]> = {};
      for (const ctx of personContextsResult.rows) {
        if (!userRolesMap[ctx.user_id]) {
          userRolesMap[ctx.user_id] = [];
        }
        userRolesMap[ctx.user_id].push({
          roleType: ctx.role_type,
          organizationType: ctx.organization_type,
          orgName: ctx.org_name,
          status: ctx.status,
          specialty: ctx.specialty
        });
      }
      
      // Attach roles to each user
      const usersWithRoles = usersResult.rows.map((u: any) => ({
        ...u,
        person_roles: userRolesMap[u.id] || []
      }));
      
      res.json(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user role/organization (Super Admin only)
  app.put("/api/admin/users/:id", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        return res.status(403).json({ message: "Super Admin access required" });
      }

      const { id } = req.params;
      const { role, organizationId, isActive, isSuperAdmin } = req.body;

      // Only Super Admin can create other Super Admins
      if (isSuperAdmin !== undefined && !user.isSuperAdmin) {
        return res.status(403).json({ message: "Only existing Super Admin can modify Super Admin status" });
      }
      
      const { pool } = await import("./db");

      // Get previous value for audit
      const previous = await pool.query(`SELECT id, email, role, organization_id, is_active, is_super_admin FROM users WHERE id = $1`, [id]);
      if (!previous.rows.length) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build dynamic update query to handle booleans correctly
      const updates: string[] = ['updated_at = NOW()'];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (role !== undefined) {
        updates.push(`role = $${paramIndex}`);
        values.push(role);
        paramIndex++;
      }
      if (organizationId !== undefined) {
        updates.push(`organization_id = $${paramIndex}`);
        values.push(organizationId);
        paramIndex++;
      }
      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(isActive);
        paramIndex++;
      }
      if (isSuperAdmin !== undefined) {
        updates.push(`is_super_admin = $${paramIndex}`);
        values.push(isSuperAdmin);
        paramIndex++;
      }
      
      values.push(id);
      
      const result = await pool.query(`
        UPDATE users SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, first_name, last_name, role, organization_id, is_active, is_super_admin
      `, values);

      // Log audit
      await pool.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_value, new_value, severity)
        VALUES ($1, 'update_user', 'user', $2, $3, $4, 'warning')
      `, [user.id, id, JSON.stringify(previous.rows[0]), JSON.stringify(result.rows[0])]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Create user from Person Master (Super Admin only)
  app.post("/api/admin/users/create", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const adminUser = req.user;
      if (!adminUser.isSuperAdmin && adminUser.role !== "super_admin") {
        return res.status(403).json({ message: "Super Admin access required" });
      }

      const { 
        personId, 
        email, 
        password, 
        firstName, 
        lastName,
        role, 
        userType, 
        companyId, 
        organizationId,
        facilityId,
        isSuperAdmin 
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const bcrypt = await import("bcrypt");
      const passwordHash = await bcrypt.hash(password, 10);

      // Get person data if personId provided
      let personData: any = null;
      if (personId) {
        personData = await storage.getPersonById(personId);
      }

      // Create user
      const user = await storage.createUser({
        email,
        passwordHash,
        firstName: firstName || personData?.firstName || "",
        lastName: lastName || personData?.lastName || undefined,
        userType: userType || "individual",
        role: role || "user",
        companyId: companyId || undefined,
        organizationId: organizationId || undefined,
        isSuperAdmin: isSuperAdmin || false,
        isActive: true,
        subscriptionActive: "active",
      });

      // Link person to user if personId provided
      if (personId && personData) {
        await storage.updatePerson(personId, { userId: user.id });
      }

      // Create person context if organization/facility provided
      if (personId && (organizationId || companyId)) {
        try {
          await storage.createPersonContext({
            personId,
            organizationId: organizationId || companyId,
            organizationType: "company",
            roleType: role || "staff",
            facilityId: facilityId || undefined,
            status: "active",
          });
        } catch (e) {
          console.log("Person context creation skipped:", e);
        }
      }

      // Audit log
      const { pool } = await import("./db");
      await pool.query(`
        INSERT INTO audit_logs (user_id, entity_type, entity_id, action, new_value)
        VALUES ($1, 'user', $2, 'created_by_admin', $3)
      `, [adminUser.id, user.id, JSON.stringify({ email, role, userType, companyId, organizationId })]);

      res.status(201).json({ 
        ...user, 
        passwordHash: undefined,
        message: "User created successfully" 
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user", error: error.message });
    }
  });

  // Get all roles for user creation (Super Admin only)
  app.get("/api/admin/roles", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const roles = [
        // Healthcare roles
        { value: "doctor", label: "Doctor", category: "Healthcare" },
        { value: "nurse", label: "Nurse", category: "Healthcare" },
        { value: "senior_nurse", label: "Senior Nurse", category: "Healthcare" },
        { value: "ward_manager", label: "Ward Manager", category: "Healthcare" },
        { value: "icu_coordinator", label: "ICU Coordinator", category: "Healthcare" },
        { value: "anesthetist", label: "Anesthetist", category: "Healthcare" },
        { value: "ot_technician", label: "OT Technician", category: "Healthcare" },
        { value: "front_desk", label: "Front Desk", category: "Healthcare" },
        { value: "billing_officer", label: "Billing Officer", category: "Healthcare" },
        { value: "insurance_coordinator", label: "Insurance Coordinator", category: "Healthcare" },
        // Lab roles
        { value: "lab_technician", label: "Lab Technician", category: "Laboratory" },
        { value: "lab_supervisor", label: "Lab Supervisor", category: "Laboratory" },
        { value: "pathologist", label: "Pathologist", category: "Laboratory" },
        { value: "quality_officer", label: "Quality Officer", category: "Laboratory" },
        // Pharmacy roles
        { value: "pharmacist", label: "Pharmacist", category: "Pharmacy" },
        { value: "store_keeper", label: "Store Keeper", category: "Pharmacy" },
        { value: "inventory_manager", label: "Inventory Manager", category: "Pharmacy" },
        // Sales/MR roles
        { value: "medical_rep", label: "Medical Representative", category: "Sales" },
        { value: "area_sales_manager", label: "Area Sales Manager", category: "Sales" },
        { value: "regional_sales_manager", label: "Regional Sales Manager", category: "Sales" },
        { value: "zone_head", label: "Zone Head", category: "Sales" },
        { value: "sales_analyst", label: "Sales Analyst", category: "Sales" },
        // HR/Admin roles
        { value: "hr_manager", label: "HR Manager", category: "Administration" },
        { value: "payroll_officer", label: "Payroll Officer", category: "Administration" },
        { value: "accounts_officer", label: "Accounts Officer", category: "Administration" },
        { value: "finance_manager", label: "Finance Manager", category: "Administration" },
        { value: "company_admin", label: "Company Admin", category: "Administration" },
        // System roles
        { value: "user", label: "Basic User", category: "System" },
        { value: "super_admin", label: "Super Admin", category: "System" },
      ];

      const userTypes = [
        { value: "individual", label: "Individual User" },
        { value: "company", label: "Company/Organization" },
        { value: "super_admin", label: "Super Admin" },
      ];

      res.json({ roles, userTypes });
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // Get audit logs (Super Admin only)
  app.get("/api/admin/audit-logs", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        return res.status(403).json({ message: "Super Admin access required" });
      }

      const { entityType, action, limit = 100 } = req.query;
      const { pool } = await import("./db");
      
      const params: any[] = [];
      let paramIndex = 1;
      let query = `
        SELECT al.*, u.email as user_email, u.first_name as user_first_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      
      if (entityType) {
        query += ` AND al.entity_type = $${paramIndex}`;
        params.push(entityType);
        paramIndex++;
      }
      if (action) {
        query += ` AND al.action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }
      query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex}`;
      params.push(parseInt(String(limit)));
      
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Get intelligence sources (Super Admin only)
  app.get("/api/admin/intelligence-sources", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        return res.status(403).json({ message: "Super Admin access required" });
      }

      const { pool } = await import("./db");
      const result = await pool.query(`
        SELECT * FROM intelligence_sources ORDER BY category, name
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching intelligence sources:", error);
      res.status(500).json({ message: "Failed to fetch intelligence sources" });
    }
  });

  // Dashboard stats (Super Admin only)
  app.get("/api/admin/dashboard-stats", isAuthenticated, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        return res.status(403).json({ message: "Super Admin access required" });
      }

      const { pool } = await import("./db");
      
      // Get counts
      const orgsCount = await pool.query(`SELECT COUNT(*) as count FROM organizations`);
      const usersCount = await pool.query(`SELECT COUNT(*) as count FROM users`);
      const activeOrgs = await pool.query(`SELECT COUNT(*) as count FROM organizations WHERE is_active = true AND is_suspended = false`);
      const expiringSoon = await pool.query(`
        SELECT COUNT(*) as count FROM organizations 
        WHERE subscription_end_date <= NOW() + INTERVAL '30 days' AND subscription_end_date > NOW()
      `);

      // Get organization stats by type
      const orgsByType = await pool.query(`
        SELECT ot.name, COUNT(o.id) as count
        FROM organization_types ot
        LEFT JOIN organizations o ON o.organization_type_id = ot.id
        GROUP BY ot.id, ot.name
      `);

      // Get subscription tier distribution
      const subscriptionDist = await pool.query(`
        SELECT subscription_tier, COUNT(*) as count
        FROM organizations
        GROUP BY subscription_tier
      `);

      res.json({
        totalOrganizations: parseInt(String(orgsCount.rows[0]?.count || 0)),
        totalUsers: parseInt(String(usersCount.rows[0]?.count || 0)),
        activeOrganizations: parseInt(String(activeOrgs.rows[0]?.count || 0)),
        expiringSoon: parseInt(String(expiringSoon.rows[0]?.count || 0)),
        organizationsByType: orgsByType.rows,
        subscriptionDistribution: subscriptionDist.rows
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // ========== Employee Invitation Routes ==========
  
  // Get pending invitations for an organization (Company Admin or Super Admin)
  app.get("/api/invitations", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      
      // Only company_admin or super_admin can view invitations
      if (!user.isSuperAdmin && user.role !== "super_admin" && user.role !== "company_admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { pool } = await import("./db");
      
      let query = `
        SELECT ei.*, ei.role_id as role, ei.invitation_token as token, o.name as organization_name
        FROM employee_invitations ei
        LEFT JOIN organizations o ON ei.organization_id = o.id
        WHERE ei.status = 'pending'::text
      `;
      const params: any[] = [];
      
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        // Company admin can only see their organization's invitations
        if (!user.organizationId) {
          return res.status(403).json({ message: "Not associated with an organization" });
        }
        query += ` AND ei.organization_id = $1`;
        params.push(user.organizationId);
      }
      
      query += ` ORDER BY ei.created_at DESC`;
      
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Create an invitation (Company Admin or Super Admin)
  app.post("/api/invitations", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      const { email, role, organizationId } = req.body;
      
      // Only company_admin or super_admin can create invitations
      if (!user.isSuperAdmin && user.role !== "super_admin" && user.role !== "company_admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }
      
      const { pool } = await import("./db");
      
      // Determine organization ID
      let orgId = organizationId;
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        // Company admin can only invite to their organization
        if (!user.organizationId) {
          return res.status(403).json({ message: "Not associated with an organization" });
        }
        orgId = user.organizationId;
      } else if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required for Super Admin" });
      }
      
      // Check if email already has a pending invitation
      const existing = await pool.query(
        `SELECT id FROM employee_invitations WHERE email = $1 AND organization_id = $2 AND status = 'pending'::text`,
        [email, orgId]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: "This email already has a pending invitation" });
      }
      
      // Check if user already exists with this email
      const existingUser = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }
      
      // Generate unique token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
      
      const result = await pool.query(`
        INSERT INTO employee_invitations (organization_id, email, role_id, invitation_token, expires_at, invited_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *, role_id as role
      `, [orgId, email, role, token, expiresAt, user.id]);
      
      // Log audit
      await pool.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, severity, organization_id)
        VALUES ($1, 'create_invitation', 'invitation', $2, $3, 'info', $4)
      `, [user.id, result.rows[0].id, JSON.stringify({ email, role }), orgId]);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Accept an invitation (public route - no auth required)
  app.post("/api/invitations/accept", async (req, res) => {
    try {
      const { token, password, firstName, lastName } = req.body;
      
      if (!token || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      const { pool } = await import("./db");
      
      // Find the invitation
      const invitation = await pool.query(`
        SELECT *, role_id as role FROM employee_invitations 
        WHERE invitation_token = $1 AND status = 'pending' AND expires_at > NOW()
      `, [token]);
      
      if (!invitation.rows.length) {
        return res.status(400).json({ message: "Invalid or expired invitation" });
      }
      
      const inv = invitation.rows[0];
      
      // Create the user
      const passwordHash = await hashPassword(password);
      
      const userResult = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, organization_id, is_active, user_type, subscription_active)
        VALUES ($1, $2, $3, $4, $5, $6, true, 'company', 'active')
        RETURNING id, email, first_name, last_name, role, organization_id, is_active
      `, [inv.email, passwordHash, firstName, lastName, inv.role, inv.organization_id]);
      
      // Update invitation status
      await pool.query(`
        UPDATE employee_invitations SET status = 'accepted'::text, accepted_at = NOW(), accepted_user_id = $2 WHERE id = $1
      `, [inv.id, userResult.rows[0].id]);
      
      // Log audit
      await pool.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, severity, organization_id)
        VALUES ($1, 'accept_invitation', 'invitation', $2, $3, 'info', $4)
      `, [userResult.rows[0].id, inv.id, JSON.stringify({ email: inv.email, role: inv.role }), inv.organization_id]);
      
      res.json({ message: "Account created successfully", user: userResult.rows[0] });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Verify invitation token (public route)
  app.get("/api/invitations/verify/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { pool } = await import("./db");
      
      const invitation = await pool.query(`
        SELECT ei.email, ei.role_id as role, ei.expires_at, o.name as organization_name
        FROM employee_invitations ei
        LEFT JOIN organizations o ON ei.organization_id = o.id
        WHERE ei.invitation_token = $1 AND ei.status = 'pending' AND ei.expires_at > NOW()
      `, [token]);
      
      if (!invitation.rows.length) {
        return res.status(400).json({ message: "Invalid or expired invitation" });
      }
      
      res.json(invitation.rows[0]);
    } catch (error) {
      console.error("Error verifying invitation:", error);
      res.status(500).json({ message: "Failed to verify invitation" });
    }
  });

  // Cancel an invitation (Company Admin or Super Admin)
  app.delete("/api/invitations/:id", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      
      // Only company_admin or super_admin can cancel invitations
      if (!user.isSuperAdmin && user.role !== "super_admin" && user.role !== "company_admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { pool } = await import("./db");
      
      // Get the invitation
      const invitation = await pool.query(`SELECT * FROM employee_invitations WHERE id = $1`, [id]);
      if (!invitation.rows.length) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      const inv = invitation.rows[0];
      
      // Check organization authorization for non-super admins
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        if (inv.organization_id !== user.organizationId) {
          return res.status(403).json({ message: "Not authorized to cancel this invitation" });
        }
      }
      
      // Update status to cancelled
      await pool.query(`UPDATE employee_invitations SET status = 'cancelled'::text WHERE id = $1`, [id]);
      
      // Log audit
      await pool.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_value, severity, organization_id)
        VALUES ($1, 'cancel_invitation', 'invitation', $2, $3, 'warning', $4)
      `, [user.id, id, JSON.stringify({ email: inv.email, role: inv.role }), inv.organization_id]);
      
      res.json({ message: "Invitation cancelled" });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      res.status(500).json({ message: "Failed to cancel invitation" });
    }
  });

  // Resend an invitation (Company Admin or Super Admin)
  app.post("/api/invitations/:id/resend", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      
      // Only company_admin or super_admin can resend invitations
      if (!user.isSuperAdmin && user.role !== "super_admin" && user.role !== "company_admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { pool } = await import("./db");
      
      // Get the invitation
      const invitation = await pool.query(`SELECT * FROM employee_invitations WHERE id = $1`, [id]);
      if (!invitation.rows.length) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      const inv = invitation.rows[0];
      
      // Check organization authorization for non-super admins
      if (!user.isSuperAdmin && user.role !== "super_admin") {
        if (inv.organization_id !== user.organizationId) {
          return res.status(403).json({ message: "Not authorized to resend this invitation" });
        }
      }
      
      // Generate new token and extend expiry
      const newToken = crypto.randomUUID();
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);
      
      await pool.query(`
        UPDATE employee_invitations SET invitation_token = $1, expires_at = $2, status = 'pending'::text
        WHERE id = $3
      `, [newToken, newExpiry, id]);
      
      res.json({ message: "Invitation resent", token: newToken });
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ message: "Failed to resend invitation" });
    }
  });

  // ========== Inventory Management Routes ==========

  // Warehouse routes
  app.get("/api/warehouses", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const user = req.user;
      const { facilityId } = req.query;
      const warehouses = await storage.getWarehouses(user.organizationId, facilityId as string);
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ message: "Failed to fetch warehouses" });
    }
  });

  app.get("/api/warehouses/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const warehouse = await storage.getWarehouseById(req.params.id);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      res.status(500).json({ message: "Failed to fetch warehouse" });
    }
  });

  app.post("/api/warehouses", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      const validation = insertWarehouseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const warehouse = await storage.createWarehouse({
        ...validation.data,
        organizationId: user.organizationId,
      });
      res.status(201).json(warehouse);
    } catch (error) {
      console.error("Error creating warehouse:", error);
      res.status(500).json({ message: "Failed to create warehouse" });
    }
  });

  app.patch("/api/warehouses/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const warehouse = await storage.updateWarehouse(req.params.id, req.body);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      console.error("Error updating warehouse:", error);
      res.status(500).json({ message: "Failed to update warehouse" });
    }
  });

  app.delete("/api/warehouses/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const deleted = await storage.deleteWarehouse(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json({ message: "Warehouse deleted" });
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      res.status(500).json({ message: "Failed to delete warehouse" });
    }
  });

  // Stock item routes
  app.get("/api/stock-items", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { warehouseId, category } = req.query;
      const items = await storage.getStockItems(warehouseId as string, category as string);
      res.json(items);
    } catch (error) {
      console.error("Error fetching stock items:", error);
      res.status(500).json({ message: "Failed to fetch stock items" });
    }
  });

  app.get("/api/stock-items/low-stock", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { warehouseId } = req.query;
      const items = await storage.getLowStockItems(warehouseId as string);
      res.json(items);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.get("/api/stock-items/expiring", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { warehouseId, days } = req.query;
      const items = await storage.getExpiringItems(warehouseId as string, parseInt(days as string) || 30);
      res.json(items);
    } catch (error) {
      console.error("Error fetching expiring items:", error);
      res.status(500).json({ message: "Failed to fetch expiring items" });
    }
  });

  app.get("/api/stock-items/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const item = await storage.getStockItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Stock item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching stock item:", error);
      res.status(500).json({ message: "Failed to fetch stock item" });
    }
  });

  app.post("/api/stock-items", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const validation = insertStockItemSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const item = await storage.createStockItem(validation.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating stock item:", error);
      res.status(500).json({ message: "Failed to create stock item" });
    }
  });

  app.patch("/api/stock-items/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const item = await storage.updateStockItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ message: "Stock item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating stock item:", error);
      res.status(500).json({ message: "Failed to update stock item" });
    }
  });

  app.delete("/api/stock-items/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const deleted = await storage.deleteStockItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Stock item not found" });
      }
      res.json({ message: "Stock item deleted" });
    } catch (error) {
      console.error("Error deleting stock item:", error);
      res.status(500).json({ message: "Failed to delete stock item" });
    }
  });

  // Stock movement routes
  app.get("/api/stock-movements", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { stockItemId, warehouseId, startDate, endDate } = req.query;
      const movements = await storage.getStockMovements(
        stockItemId as string,
        warehouseId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  app.post("/api/stock-movements", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const user = req.user;
      const validation = insertStockMovementSchema.safeParse({
        ...req.body,
        performedBy: user.id,
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }

      // Get current stock item to update quantities
      const stockItem = await storage.getStockItemById(validation.data.stockItemId);
      if (!stockItem) {
        return res.status(404).json({ message: "Stock item not found" });
      }

      const currentQty = parseFloat(stockItem.currentQuantity || "0");
      const movementQty = parseFloat(validation.data.quantity as any);
      let newQty = currentQty;

      if (validation.data.movementType === "in" || validation.data.movementType === "return") {
        newQty = currentQty + movementQty;
      } else if (validation.data.movementType === "out" || validation.data.movementType === "transfer") {
        newQty = currentQty - movementQty;
        if (newQty < 0) {
          return res.status(400).json({ message: "Insufficient stock" });
        }
      } else if (validation.data.movementType === "adjustment") {
        newQty = movementQty;
      }

      // Create movement with calculated values
      const movement = await storage.createStockMovement({
        ...validation.data,
        previousQuantity: currentQty.toString(),
        newQuantity: newQty.toString(),
      });

      // Update stock item quantity
      await storage.updateStockItem(stockItem.id, {
        currentQuantity: newQty.toString(),
      });

      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating stock movement:", error);
      res.status(500).json({ message: "Failed to create stock movement" });
    }
  });

  // ========== Doctor Payroll Routes ==========

  app.get("/api/doctor-payroll", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver"]), async (req: any, res) => {
    try {
      const { facilityId, doctorId, status } = req.query;
      const records = await storage.getDoctorPayrollRecords(
        facilityId as string,
        doctorId as string,
        status as string
      );
      res.json(records);
    } catch (error) {
      console.error("Error fetching payroll records:", error);
      res.status(500).json({ message: "Failed to fetch payroll records" });
    }
  });

  app.get("/api/doctor-payroll/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver"]), async (req: any, res) => {
    try {
      const record = await storage.getDoctorPayrollRecordById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: "Payroll record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching payroll record:", error);
      res.status(500).json({ message: "Failed to fetch payroll record" });
    }
  });

  app.post("/api/doctor-payroll/calculate", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver"]), async (req: any, res) => {
    try {
      const { doctorId, startDate, endDate } = req.body;
      if (!doctorId || !startDate || !endDate) {
        return res.status(400).json({ message: "doctorId, startDate, and endDate are required" });
      }
      const earnings = await storage.calculateDoctorEarnings(
        doctorId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json(earnings);
    } catch (error) {
      console.error("Error calculating earnings:", error);
      res.status(500).json({ message: "Failed to calculate earnings" });
    }
  });

  app.post("/api/doctor-payroll", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      const validation = insertDoctorPayrollRecordSchema.safeParse({
        ...req.body,
        createdBy: user.id,
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const record = await storage.createDoctorPayrollRecord(validation.data);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating payroll record:", error);
      res.status(500).json({ message: "Failed to create payroll record" });
    }
  });

  app.post("/api/doctor-payroll/generate", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      const { facilityId, doctorId, startDate, endDate } = req.body;

      if (!facilityId || !doctorId || !startDate || !endDate) {
        return res.status(400).json({ message: "facilityId, doctorId, startDate, and endDate are required" });
      }

      // Get doctor info
      const doctor = await storage.getHealthcareDoctorById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Calculate earnings
      const earnings = await storage.calculateDoctorEarnings(
        doctorId,
        new Date(startDate),
        new Date(endDate)
      );

      // Calculate totals based on agreement type
      let grossEarnings = 0;
      if (doctor.agreementType === "permanent") {
        grossEarnings = parseFloat(doctor.monthlySalary || "0");
      } else {
        grossEarnings = parseFloat(earnings.patientFeeEarnings) + parseFloat(earnings.commissionEarnings);
      }

      // Create payroll record
      const record = await storage.createDoctorPayrollRecord({
        facilityId,
        doctorId,
        payPeriodStart: new Date(startDate),
        payPeriodEnd: new Date(endDate),
        agreementType: doctor.agreementType,
        baseSalary: doctor.agreementType === "permanent" ? doctor.monthlySalary || "0" : "0",
        totalPatientsSeen: earnings.totalPatients,
        perPatientFee: doctor.perPatientFee || "0",
        patientFeeEarnings: earnings.patientFeeEarnings,
        totalConsultationRevenue: earnings.consultationRevenue,
        commissionPercentage: doctor.percentageShare || "0",
        commissionEarnings: earnings.commissionEarnings,
        grossEarnings: grossEarnings.toFixed(2),
        netPayable: grossEarnings.toFixed(2),
        status: "draft",
        createdBy: user.id,
      });

      res.status(201).json({ record, earnings });
    } catch (error) {
      console.error("Error generating payroll:", error);
      res.status(500).json({ message: "Failed to generate payroll" });
    }
  });

  app.patch("/api/doctor-payroll/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const record = await storage.updateDoctorPayrollRecord(req.params.id, req.body);
      if (!record) {
        return res.status(404).json({ message: "Payroll record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error updating payroll record:", error);
      res.status(500).json({ message: "Failed to update payroll record" });
    }
  });

  app.patch("/api/doctor-payroll/:id/approve", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      const record = await storage.updateDoctorPayrollRecord(req.params.id, {
        status: "approved",
        approvedBy: user.id,
      });
      if (!record) {
        return res.status(404).json({ message: "Payroll record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error approving payroll:", error);
      res.status(500).json({ message: "Failed to approve payroll" });
    }
  });

  app.patch("/api/doctor-payroll/:id/pay", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { paymentMethod, paymentReference } = req.body;
      const record = await storage.updateDoctorPayrollRecord(req.params.id, {
        status: "paid",
        paymentDate: new Date(),
        paymentMethod,
        paymentReference,
      });
      if (!record) {
        return res.status(404).json({ message: "Payroll record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error marking payroll as paid:", error);
      res.status(500).json({ message: "Failed to mark payroll as paid" });
    }
  });

  app.delete("/api/doctor-payroll/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["silver"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const deleted = await storage.deleteDoctorPayrollRecord(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Payroll record not found" });
      }
      res.json({ message: "Payroll record deleted" });
    } catch (error) {
      console.error("Error deleting payroll record:", error);
      res.status(500).json({ message: "Failed to delete payroll record" });
    }
  });

  // ========== Doctor Expenditure Routes ==========

  app.get("/api/doctor-expenditures", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const user = req.user;
      const { doctorId, startDate, endDate } = req.query;
      
      // MRs see only their own expenditures, admins see all
      const userId = canAccessAllData(user) ? undefined : user.id;
      
      const expenditures = await storage.getDoctorExpenditures(
        userId,
        doctorId as string,
        user.organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(expenditures);
    } catch (error) {
      console.error("Error fetching expenditures:", error);
      res.status(500).json({ message: "Failed to fetch expenditures" });
    }
  });

  app.get("/api/doctor-expenditures/summary", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const user = req.user;
      const { doctorId, startDate, endDate } = req.query;
      
      const summary = await storage.getDoctorExpenditureSummary(
        doctorId as string,
        user.organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(summary);
    } catch (error) {
      console.error("Error fetching expenditure summary:", error);
      res.status(500).json({ message: "Failed to fetch expenditure summary" });
    }
  });

  app.get("/api/doctor-expenditures/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const expenditure = await storage.getDoctorExpenditureById(req.params.id);
      if (!expenditure) {
        return res.status(404).json({ message: "Expenditure not found" });
      }
      res.json(expenditure);
    } catch (error) {
      console.error("Error fetching expenditure:", error);
      res.status(500).json({ message: "Failed to fetch expenditure" });
    }
  });

  app.post("/api/doctor-expenditures", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const user = req.user;
      const validation = insertDoctorExpenditureSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const expenditure = await storage.createDoctorExpenditure({
        ...validation.data,
        userId: user.id,
        organizationId: user.organizationId,
      });
      res.status(201).json(expenditure);
    } catch (error) {
      console.error("Error creating expenditure:", error);
      res.status(500).json({ message: "Failed to create expenditure" });
    }
  });

  app.patch("/api/doctor-expenditures/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const user = req.user;
      const expenditure = await storage.getDoctorExpenditureById(req.params.id);
      if (!expenditure) {
        return res.status(404).json({ message: "Expenditure not found" });
      }
      // Only owner or admin can update
      if (!canAccessAllData(user) && expenditure.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const updated = await storage.updateDoctorExpenditure(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating expenditure:", error);
      res.status(500).json({ message: "Failed to update expenditure" });
    }
  });

  app.patch("/api/doctor-expenditures/:id/approve", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user;
      const expenditure = await storage.updateDoctorExpenditure(req.params.id, {
        status: "approved",
        approvedBy: user.id,
        approvedAt: new Date(),
      });
      if (!expenditure) {
        return res.status(404).json({ message: "Expenditure not found" });
      }
      res.json(expenditure);
    } catch (error) {
      console.error("Error approving expenditure:", error);
      res.status(500).json({ message: "Failed to approve expenditure" });
    }
  });

  app.patch("/api/doctor-expenditures/:id/reject", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { rejectionReason } = req.body;
      const expenditure = await storage.updateDoctorExpenditure(req.params.id, {
        status: "rejected",
        rejectionReason,
      });
      if (!expenditure) {
        return res.status(404).json({ message: "Expenditure not found" });
      }
      res.json(expenditure);
    } catch (error) {
      console.error("Error rejecting expenditure:", error);
      res.status(500).json({ message: "Failed to reject expenditure" });
    }
  });

  app.delete("/api/doctor-expenditures/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const user = req.user;
      const expenditure = await storage.getDoctorExpenditureById(req.params.id);
      if (!expenditure) {
        return res.status(404).json({ message: "Expenditure not found" });
      }
      // Only owner or admin can delete
      if (!canAccessAllData(user) && expenditure.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      // Can only delete pending expenditures
      if (expenditure.status !== "pending" && !canAccessAllData(user)) {
        return res.status(400).json({ message: "Can only delete pending expenditures" });
      }
      await storage.deleteDoctorExpenditure(req.params.id);
      res.json({ message: "Expenditure deleted" });
    } catch (error) {
      console.error("Error deleting expenditure:", error);
      res.status(500).json({ message: "Failed to delete expenditure" });
    }
  });

  // ========== Centralized Person Master Routes ==========

  // Get all available roles (for person context assignment)
  app.get("/api/roles", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const { pool } = await import("./db");
      const result = await pool.query(`
        SELECT id, name, code, category, description, company_type_id 
        FROM roles 
        WHERE is_active = true 
        ORDER BY category, name
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // Person CRUD
  app.get("/api/persons", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { search } = req.query;
      const persons = await storage.getPersons(undefined, search);
      res.json(persons);
    } catch (error) {
      console.error("Error fetching persons:", error);
      res.status(500).json({ message: "Failed to fetch persons" });
    }
  });

  app.get("/api/persons/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const person = await storage.getPersonById(req.params.id);
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      res.json(person);
    } catch (error) {
      console.error("Error fetching person:", error);
      res.status(500).json({ message: "Failed to fetch person" });
    }
  });

  app.post("/api/persons", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      // Validate input with Zod schema
      const validation = insertPersonSchema.safeParse({
        ...req.body,
        createdBy: req.user.id,
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.flatten() });
      }
      
      const person = await storage.createPerson(validation.data as any);
      
      // Create audit log
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'create',
        actionCategory: 'person',
        targetType: 'person',
        targetId: person.id,
        newData: person,
      });
      
      res.status(201).json(person);
    } catch (error) {
      console.error("Error creating person:", error);
      res.status(500).json({ message: "Failed to create person" });
    }
  });

  app.post("/api/persons/find-or-create", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      // Validate input with Zod schema (requires at least cnic or phone for deduplication)
      const findOrCreateSchema = insertPersonSchema.pick({
        cnic: true,
        phone: true,
        firstName: true,
        lastName: true,
      }).extend({
        cnic: insertPersonSchema.shape.cnic.optional().nullable(),
        phone: insertPersonSchema.shape.phone.optional().nullable(),
      }).refine(data => data.cnic || data.phone, {
        message: "Either CNIC or phone number is required for identity deduplication"
      });
      
      const validation = findOrCreateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.flatten() });
      }
      
      const { cnic, phone, firstName, lastName } = validation.data;
      
      // Check if person already exists before calling findOrCreatePerson
      let existingPerson = null;
      if (cnic) {
        existingPerson = await storage.getPersonByCnic(cnic);
      }
      if (!existingPerson && phone) {
        existingPerson = await storage.getPersonByPhone(phone);
      }
      
      const person = await storage.findOrCreatePerson({
        cnic,
        phone,
        firstName,
        lastName,
        createdBy: req.user.id,
      });
      
      // Create appropriate audit log based on whether person was found or created
      if (existingPerson) {
        // Person was found, log as view
        await storage.createAuditLog({
          actorUserId: req.user.id,
          action: 'view',
          actionCategory: 'person',
          targetType: 'person',
          targetId: person.id,
          newData: { found: true, personId: person.id },
        });
      } else {
        // New person was created, log as create
        await storage.createAuditLog({
          actorUserId: req.user.id,
          action: 'create',
          actionCategory: 'person',
          targetType: 'person',
          targetId: person.id,
          newData: person,
        });
      }
      
      res.json(person);
    } catch (error) {
      console.error("Error finding/creating person:", error);
      res.status(500).json({ message: "Failed to find or create person" });
    }
  });

  app.patch("/api/persons/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const user = req.user;
      const existingPerson = await storage.getPersonById(req.params.id);
      if (!existingPerson) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      // Core identity can only be edited by the person themselves (via linkedUserId) or Super Admin
      // Core identity fields: cnic, phone (fallback identifier), firstName, lastName, dateOfBirth, gender, bloodGroup
      const coreIdentityFields = ['cnic', 'phone', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'bloodGroup'];
      const isEditingCoreIdentity = coreIdentityFields.some(field => field in req.body);
      
      if (isEditingCoreIdentity) {
        const isOwner = existingPerson.linkedUserId && existingPerson.linkedUserId === user.id;
        const isSuperAdmin = user.role === 'super_admin';
        
        if (!isOwner && !isSuperAdmin) {
          return res.status(403).json({ 
            message: "Core identity data can only be edited by the person themselves or Super Admin" 
          });
        }
      }
      
      // Validate partial update with Zod (allow partial updates)
      const updateSchema = insertPersonSchema.partial();
      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.flatten() });
      }
      
      const person = await storage.updatePerson(req.params.id, validation.data as any);
      
      // Create audit log
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'update',
        actionCategory: 'person',
        targetType: 'person',
        targetId: req.params.id,
        previousData: existingPerson,
        newData: person,
      });
      
      res.json(person);
    } catch (error) {
      console.error("Error updating person:", error);
      res.status(500).json({ message: "Failed to update person" });
    }
  });

  // Person Context (Employment) Routes
  app.get("/api/person-contexts", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { personId, organizationId, roleType } = req.query;
      const contexts = await storage.getPersonContexts(personId, organizationId, roleType);
      res.json(contexts);
    } catch (error) {
      console.error("Error fetching person contexts:", error);
      res.status(500).json({ message: "Failed to fetch person contexts" });
    }
  });

  app.post("/api/person-contexts", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      // Validate input with Zod schema
      const validation = insertPersonContextSchema.safeParse({
        ...req.body,
        hiredBy: req.user.id,
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.flatten() });
      }
      
      const context = await storage.createPersonContext(validation.data as any);
      
      // Create audit log for hire action
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'hire',
        actionCategory: 'person',
        targetType: 'person_context',
        targetId: context.id,
        newData: context,
      });
      
      res.status(201).json(context);
    } catch (error) {
      console.error("Error creating person context:", error);
      res.status(500).json({ message: "Failed to create person context" });
    }
  });

  app.patch("/api/person-contexts/:id/terminate", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { terminationDate, terminationReason } = req.body;
      const existingContext = await storage.getPersonContextById(req.params.id);
      if (!existingContext) {
        return res.status(404).json({ message: "Person context not found" });
      }
      
      const context = await storage.terminatePersonContext(
        req.params.id,
        new Date(terminationDate),
        terminationReason
      );
      
      // Create audit log for terminate action
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'terminate',
        actionCategory: 'person',
        targetType: 'person_context',
        targetId: req.params.id,
        previousData: existingContext,
        newData: context,
      });
      
      res.json(context);
    } catch (error) {
      console.error("Error terminating person context:", error);
      res.status(500).json({ message: "Failed to terminate person context" });
    }
  });

  // ========== Queue Management Routes ==========

  // Queue Definitions
  app.get("/api/queue-definitions", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { organizationId, facilityId } = req.query;
      const definitions = await storage.getQueueDefinitions(organizationId, facilityId);
      res.json(definitions);
    } catch (error) {
      console.error("Error fetching queue definitions:", error);
      res.status(500).json({ message: "Failed to fetch queue definitions" });
    }
  });

  app.post("/api/queue-definitions", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const definition = await storage.createQueueDefinition(req.body);
      res.status(201).json(definition);
    } catch (error) {
      console.error("Error creating queue definition:", error);
      res.status(500).json({ message: "Failed to create queue definition" });
    }
  });

  app.patch("/api/queue-definitions/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const definition = await storage.updateQueueDefinition(req.params.id, req.body);
      if (!definition) {
        return res.status(404).json({ message: "Queue definition not found" });
      }
      res.json(definition);
    } catch (error) {
      console.error("Error updating queue definition:", error);
      res.status(500).json({ message: "Failed to update queue definition" });
    }
  });

  // Queue Day State (for getting current queue status)
  app.get("/api/queue-day-state/:queueDefinitionId", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const today = new Date();
      const dayState = await storage.getOrCreateQueueDayState(req.params.queueDefinitionId, today);
      res.json(dayState);
    } catch (error) {
      console.error("Error fetching queue day state:", error);
      res.status(500).json({ message: "Failed to fetch queue day state" });
    }
  });

  // Queue Tokens
  app.get("/api/queue-tokens", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { queueDayStateId, status } = req.query;
      const tokens = await storage.getQueueTokens(queueDayStateId, status);
      res.json(tokens);
    } catch (error) {
      console.error("Error fetching queue tokens:", error);
      res.status(500).json({ message: "Failed to fetch queue tokens" });
    }
  });

  app.post("/api/queue-tokens", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const token = await storage.issueQueueToken({
        ...req.body,
        issuedBy: req.user.id,
      });
      
      // Create audit log
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'queue',
        actionCategory: 'queue',
        targetType: 'queue_token',
        targetId: token.id,
        newData: token,
      });
      
      res.status(201).json(token);
    } catch (error) {
      console.error("Error issuing queue token:", error);
      res.status(500).json({ message: "Failed to issue queue token" });
    }
  });

  app.post("/api/queue-tokens/call-next", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { queueDayStateId } = req.body;
      const token = await storage.callNextToken(queueDayStateId, req.user.id);
      if (!token) {
        return res.status(404).json({ message: "No waiting tokens" });
      }
      res.json(token);
    } catch (error) {
      console.error("Error calling next token:", error);
      res.status(500).json({ message: "Failed to call next token" });
    }
  });

  app.patch("/api/queue-tokens/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const token = await storage.updateQueueToken(req.params.id, req.body);
      if (!token) {
        return res.status(404).json({ message: "Queue token not found" });
      }
      res.json(token);
    } catch (error) {
      console.error("Error updating queue token:", error);
      res.status(500).json({ message: "Failed to update queue token" });
    }
  });

  // ========== Lab Module Routes ==========

  // Lab Orders
  app.get("/api/lab-orders", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { labOrganizationId, patientPersonId, status } = req.query;
      const orders = await storage.getLabOrders(labOrganizationId, patientPersonId, status);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching lab orders:", error);
      res.status(500).json({ message: "Failed to fetch lab orders" });
    }
  });

  app.get("/api/lab-orders/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const order = await storage.getLabOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Lab order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching lab order:", error);
      res.status(500).json({ message: "Failed to fetch lab order" });
    }
  });

  app.post("/api/lab-orders", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["doctor", "company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const order = await storage.createLabOrder({
        ...req.body,
        orderedBy: req.user.id,
      });
      
      // Create audit log
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'create',
        actionCategory: 'lab',
        targetType: 'lab_order',
        targetId: order.id,
        newData: order,
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating lab order:", error);
      res.status(500).json({ message: "Failed to create lab order" });
    }
  });

  app.patch("/api/lab-orders/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const order = await storage.updateLabOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ message: "Lab order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating lab order:", error);
      res.status(500).json({ message: "Failed to update lab order" });
    }
  });

  // Lab Order Items
  app.get("/api/lab-order-items/:labOrderId", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const items = await storage.getLabOrderItems(req.params.labOrderId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching lab order items:", error);
      res.status(500).json({ message: "Failed to fetch lab order items" });
    }
  });

  app.post("/api/lab-order-items", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const item = await storage.createLabOrderItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating lab order item:", error);
      res.status(500).json({ message: "Failed to create lab order item" });
    }
  });

  // Lab Results
  app.post("/api/lab-results", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const result = await storage.createLabResult({
        ...req.body,
        performedBy: req.user.id,
      });
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating lab result:", error);
      res.status(500).json({ message: "Failed to create lab result" });
    }
  });

  app.patch("/api/lab-results/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const result = await storage.updateLabResult(req.params.id, req.body);
      if (!result) {
        return res.status(404).json({ message: "Lab result not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error updating lab result:", error);
      res.status(500).json({ message: "Failed to update lab result" });
    }
  });

  // Lab Reports (read-only for ordering doctors and assigned lab staff)
  app.get("/api/lab-reports", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { labOrderId, patientPersonId } = req.query;
      const reports = await storage.getLabReports(labOrderId, patientPersonId);
      
      // Create audit log for viewing reports
      if (reports.length > 0) {
        await storage.createAuditLog({
          actorUserId: req.user.id,
          action: 'view',
          actionCategory: 'lab',
          targetType: 'lab_report',
          targetId: reports[0].id,
        });
      }
      
      res.json(reports);
    } catch (error) {
      console.error("Error fetching lab reports:", error);
      res.status(500).json({ message: "Failed to fetch lab reports" });
    }
  });

  app.get("/api/lab-reports/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const report = await storage.getLabReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Lab report not found" });
      }
      
      // Create audit log for viewing report
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'view',
        actionCategory: 'lab',
        targetType: 'lab_report',
        targetId: report.id,
      });
      
      res.json(report);
    } catch (error) {
      console.error("Error fetching lab report:", error);
      res.status(500).json({ message: "Failed to fetch lab report" });
    }
  });

  app.post("/api/lab-reports", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const report = await storage.createLabReport({
        ...req.body,
        generatedBy: req.user.id,
      });
      
      // Create audit log
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'report',
        actionCategory: 'lab',
        targetType: 'lab_report',
        targetId: report.id,
        newData: report,
      });
      
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating lab report:", error);
      res.status(500).json({ message: "Failed to create lab report" });
    }
  });

  // ========== Medical Store / Pharmacy Routes ==========

  // Medicines
  app.get("/api/medicines", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { organizationId, search } = req.query;
      const medicines = await storage.getMedicines(organizationId, search);
      res.json(medicines);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      res.status(500).json({ message: "Failed to fetch medicines" });
    }
  });

  app.get("/api/medicines/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const medicine = await storage.getMedicineById(req.params.id);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      res.json(medicine);
    } catch (error) {
      console.error("Error fetching medicine:", error);
      res.status(500).json({ message: "Failed to fetch medicine" });
    }
  });

  app.post("/api/medicines", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const medicine = await storage.createMedicine({
        ...req.body,
        createdBy: req.user.id,
      });
      res.status(201).json(medicine);
    } catch (error) {
      console.error("Error creating medicine:", error);
      res.status(500).json({ message: "Failed to create medicine" });
    }
  });

  app.patch("/api/medicines/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const medicine = await storage.updateMedicine(req.params.id, req.body);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      res.json(medicine);
    } catch (error) {
      console.error("Error updating medicine:", error);
      res.status(500).json({ message: "Failed to update medicine" });
    }
  });

  // Medicine Stock
  app.get("/api/medicine-stock-ledger", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { medicineId, organizationId } = req.query;
      const ledger = await storage.getMedicineStockLedger(medicineId, organizationId);
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching medicine stock ledger:", error);
      res.status(500).json({ message: "Failed to fetch medicine stock ledger" });
    }
  });

  app.get("/api/medicine-stock/:medicineId/:organizationId", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const stock = await storage.getMedicineCurrentStock(req.params.medicineId, req.params.organizationId);
      res.json({ currentStock: stock });
    } catch (error) {
      console.error("Error fetching medicine stock:", error);
      res.status(500).json({ message: "Failed to fetch medicine stock" });
    }
  });

  app.post("/api/medicine-stock-ledger", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const entry = await storage.createMedicineStockEntry({
        ...req.body,
        transactionBy: req.user.id,
        transactionDate: new Date(),
      });
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating medicine stock entry:", error);
      res.status(500).json({ message: "Failed to create medicine stock entry" });
    }
  });

  // Prescription Orders
  app.get("/api/prescription-orders", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { organizationId, patientPersonId, status } = req.query;
      const orders = await storage.getPrescriptionOrders(organizationId, patientPersonId, status);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching prescription orders:", error);
      res.status(500).json({ message: "Failed to fetch prescription orders" });
    }
  });

  app.post("/api/prescription-orders", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const order = await storage.createPrescriptionOrder({
        ...req.body,
        receivedBy: req.user.id,
      });
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating prescription order:", error);
      res.status(500).json({ message: "Failed to create prescription order" });
    }
  });

  app.patch("/api/prescription-orders/:id", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const order = await storage.updatePrescriptionOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ message: "Prescription order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating prescription order:", error);
      res.status(500).json({ message: "Failed to update prescription order" });
    }
  });

  // Dispense Events
  app.get("/api/dispense-events/:prescriptionOrderId", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const events = await storage.getDispenseEvents(req.params.prescriptionOrderId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching dispense events:", error);
      res.status(500).json({ message: "Failed to fetch dispense events" });
    }
  });

  app.post("/api/dispense-events", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const event = await storage.createDispenseEvent({
        ...req.body,
        dispensedBy: req.user.id,
      });
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating dispense event:", error);
      res.status(500).json({ message: "Failed to create dispense event" });
    }
  });

  // ========== Data Transfer Governance Routes (Super Admin Only) ==========

  app.get("/api/data-transfer-requests", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const user = req.user;
      // Super admin sees all, others see only their requests
      const requestedBy = canAccessAllData(user) ? req.query.requestedBy : user.id;
      const { status } = req.query;
      const requests = await storage.getDataTransferRequests(requestedBy, status);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching data transfer requests:", error);
      res.status(500).json({ message: "Failed to fetch data transfer requests" });
    }
  });

  app.get("/api/data-transfer-requests/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const request = await storage.getDataTransferRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Data transfer request not found" });
      }
      // Check access
      if (!canAccessAllData(req.user) && request.requestedBy !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching data transfer request:", error);
      res.status(500).json({ message: "Failed to fetch data transfer request" });
    }
  });

  app.post("/api/data-transfer-requests", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const request = await storage.createDataTransferRequest({
        ...req.body,
        requestedBy: req.user.id,
        requestedByOrganizationId: req.user.companyId,
      });
      
      // Create audit log
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'export',
        actionCategory: 'report',
        targetType: 'data_transfer_request',
        targetId: request.id,
        newData: request,
      });
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating data transfer request:", error);
      res.status(500).json({ message: "Failed to create data transfer request" });
    }
  });

  app.patch("/api/data-transfer-requests/:id/approve", isAuthenticated, requireActiveSubscription, requireSuperAdmin, async (req: any, res) => {
    try {
      const { reviewNotes } = req.body;
      const request = await storage.approveDataTransferRequest(
        req.params.id,
        req.user.id,
        reviewNotes
      );
      if (!request) {
        return res.status(404).json({ message: "Data transfer request not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'update',
        actionCategory: 'system',
        targetType: 'data_transfer_request',
        targetId: req.params.id,
        newData: { status: 'approved', reviewNotes },
      });
      
      res.json(request);
    } catch (error) {
      console.error("Error approving data transfer request:", error);
      res.status(500).json({ message: "Failed to approve data transfer request" });
    }
  });

  app.patch("/api/data-transfer-requests/:id/reject", isAuthenticated, requireActiveSubscription, requireSuperAdmin, async (req: any, res) => {
    try {
      const { rejectionReason } = req.body;
      const request = await storage.rejectDataTransferRequest(
        req.params.id,
        req.user.id,
        rejectionReason
      );
      if (!request) {
        return res.status(404).json({ message: "Data transfer request not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'update',
        actionCategory: 'system',
        targetType: 'data_transfer_request',
        targetId: req.params.id,
        newData: { status: 'rejected', rejectionReason },
      });
      
      res.json(request);
    } catch (error) {
      console.error("Error rejecting data transfer request:", error);
      res.status(500).json({ message: "Failed to reject data transfer request" });
    }
  });

  // ========== Audit Log Routes (Super Admin Only) ==========

  app.get("/api/audit-logs", isAuthenticated, requireActiveSubscription, requireSuperAdmin, async (req: any, res) => {
    try {
      const { actorUserId, targetType, startDate, endDate } = req.query;
      const logs = await storage.getAuditLogs(
        actorUserId,
        targetType,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ========== HR/Payroll/Accounts Routes ==========

  // Payslip Template Routes
  app.get("/api/hr/payslip-templates", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { organizationId, isActive } = req.query;
      const orgId = canAccessAllData(req.user) ? organizationId : req.user.organizationId;
      const templates = await storage.getPayslipTemplates(orgId, isActive === 'true' ? true : isActive === 'false' ? false : undefined);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching payslip templates:", error);
      res.status(500).json({ message: "Failed to fetch payslip templates" });
    }
  });

  app.get("/api/hr/payslip-templates/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const template = await storage.getPayslipTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Payslip template not found" });
      }
      if (!canAccessAllData(req.user) && template.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching payslip template:", error);
      res.status(500).json({ message: "Failed to fetch payslip template" });
    }
  });

  app.post("/api/hr/payslip-templates", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertPayslipTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const template = await storage.createPayslipTemplate({
        ...validation.data,
        createdBy: req.user.id
      });
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'create',
        actionCategory: 'hr',
        targetType: 'payslip_template',
        targetId: template.id,
        newData: template,
      });
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating payslip template:", error);
      res.status(500).json({ message: "Failed to create payslip template" });
    }
  });

  app.put("/api/hr/payslip-templates/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getPayslipTemplateById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Payslip template not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const template = await storage.updatePayslipTemplate(req.params.id, req.body);
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'update',
        actionCategory: 'hr',
        targetType: 'payslip_template',
        targetId: req.params.id,
        previousData: existing,
        newData: template,
      });
      res.json(template);
    } catch (error) {
      console.error("Error updating payslip template:", error);
      res.status(500).json({ message: "Failed to update payslip template" });
    }
  });

  app.post("/api/hr/payslip-templates/:id/version", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getPayslipTemplateById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Payslip template not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const newVersion = await storage.createPayslipTemplateVersion(req.params.id, req.body);
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'create',
        actionCategory: 'hr',
        targetType: 'payslip_template',
        targetId: newVersion.id,
        newData: { ...newVersion, note: 'New version created' },
      });
      res.status(201).json(newVersion);
    } catch (error) {
      console.error("Error creating payslip template version:", error);
      res.status(500).json({ message: "Failed to create payslip template version" });
    }
  });

  app.delete("/api/hr/payslip-templates/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getPayslipTemplateById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Payslip template not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deletePayslipTemplate(req.params.id);
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'delete',
        actionCategory: 'hr',
        targetType: 'payslip_template',
        targetId: req.params.id,
        previousData: existing,
      });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payslip template:", error);
      res.status(500).json({ message: "Failed to delete payslip template" });
    }
  });

  // Attendance Source Routes
  app.get("/api/hr/attendance-sources", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { organizationId, isActive } = req.query;
      const orgId = canAccessAllData(req.user) ? organizationId : req.user.organizationId;
      const sources = await storage.getAttendanceSources(orgId, isActive === 'true' ? true : isActive === 'false' ? false : undefined);
      res.json(sources);
    } catch (error) {
      console.error("Error fetching attendance sources:", error);
      res.status(500).json({ message: "Failed to fetch attendance sources" });
    }
  });

  app.get("/api/hr/attendance-sources/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const source = await storage.getAttendanceSourceById(req.params.id);
      if (!source) {
        return res.status(404).json({ message: "Attendance source not found" });
      }
      if (!canAccessAllData(req.user) && source.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(source);
    } catch (error) {
      console.error("Error fetching attendance source:", error);
      res.status(500).json({ message: "Failed to fetch attendance source" });
    }
  });

  app.post("/api/hr/attendance-sources", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertAttendanceSourceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const source = await storage.createAttendanceSource(validation.data);
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'create',
        actionCategory: 'hr',
        targetType: 'attendance_source',
        targetId: source.id,
        newData: source,
      });
      res.status(201).json(source);
    } catch (error) {
      console.error("Error creating attendance source:", error);
      res.status(500).json({ message: "Failed to create attendance source" });
    }
  });

  app.put("/api/hr/attendance-sources/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getAttendanceSourceById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Attendance source not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const source = await storage.updateAttendanceSource(req.params.id, req.body);
      res.json(source);
    } catch (error) {
      console.error("Error updating attendance source:", error);
      res.status(500).json({ message: "Failed to update attendance source" });
    }
  });

  app.delete("/api/hr/attendance-sources/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getAttendanceSourceById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Attendance source not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deleteAttendanceSource(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting attendance source:", error);
      res.status(500).json({ message: "Failed to delete attendance source" });
    }
  });

  // Shift Definition Routes
  app.get("/api/hr/shifts", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { organizationId, isActive } = req.query;
      const orgId = canAccessAllData(req.user) ? organizationId : req.user.organizationId;
      const shifts = await storage.getShiftDefinitions(orgId, isActive === 'true' ? true : isActive === 'false' ? false : undefined);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shift definitions:", error);
      res.status(500).json({ message: "Failed to fetch shift definitions" });
    }
  });

  app.get("/api/hr/shifts/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const shift = await storage.getShiftDefinitionById(req.params.id);
      if (!shift) {
        return res.status(404).json({ message: "Shift definition not found" });
      }
      if (!canAccessAllData(req.user) && shift.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(shift);
    } catch (error) {
      console.error("Error fetching shift definition:", error);
      res.status(500).json({ message: "Failed to fetch shift definition" });
    }
  });

  app.post("/api/hr/shifts", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertShiftDefinitionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const shift = await storage.createShiftDefinition(validation.data);
      res.status(201).json(shift);
    } catch (error) {
      console.error("Error creating shift definition:", error);
      res.status(500).json({ message: "Failed to create shift definition" });
    }
  });

  app.put("/api/hr/shifts/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getShiftDefinitionById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Shift definition not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const shift = await storage.updateShiftDefinition(req.params.id, req.body);
      res.json(shift);
    } catch (error) {
      console.error("Error updating shift definition:", error);
      res.status(500).json({ message: "Failed to update shift definition" });
    }
  });

  app.delete("/api/hr/shifts/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getShiftDefinitionById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Shift definition not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deleteShiftDefinition(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shift definition:", error);
      res.status(500).json({ message: "Failed to delete shift definition" });
    }
  });

  // Attendance Log Routes
  app.get("/api/hr/attendance", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { organizationId, personId, startDate, endDate } = req.query;
      const orgId = canAccessAllData(req.user) ? organizationId : req.user.organizationId;
      const logs = await storage.getAttendanceLogs(
        orgId,
        personId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching attendance logs:", error);
      res.status(500).json({ message: "Failed to fetch attendance logs" });
    }
  });

  app.get("/api/hr/attendance/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const log = await storage.getAttendanceLogById(req.params.id);
      if (!log) {
        return res.status(404).json({ message: "Attendance log not found" });
      }
      if (!canAccessAllData(req.user) && log.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(log);
    } catch (error) {
      console.error("Error fetching attendance log:", error);
      res.status(500).json({ message: "Failed to fetch attendance log" });
    }
  });

  app.post("/api/hr/attendance", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const validation = insertAttendanceLogSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const log = await storage.createAttendanceLog(validation.data);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating attendance log:", error);
      res.status(500).json({ message: "Failed to create attendance log" });
    }
  });

  app.put("/api/hr/attendance/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const existing = await storage.getAttendanceLogById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Attendance log not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const log = await storage.updateAttendanceLog(req.params.id, req.body);
      res.json(log);
    } catch (error) {
      console.error("Error updating attendance log:", error);
      res.status(500).json({ message: "Failed to update attendance log" });
    }
  });

  app.post("/api/hr/attendance/:id/normalize", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const { shiftId } = req.body;
      if (!shiftId) {
        return res.status(400).json({ message: "shiftId is required" });
      }
      const log = await storage.normalizeAttendanceLog(req.params.id, shiftId);
      if (!log) {
        return res.status(404).json({ message: "Attendance log not found" });
      }
      res.json(log);
    } catch (error) {
      console.error("Error normalizing attendance log:", error);
      res.status(500).json({ message: "Failed to normalize attendance log" });
    }
  });

  // Salary Structure Routes
  app.get("/api/hr/salary-structures", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { organizationId, personContextId, isActive } = req.query;
      const orgId = canAccessAllData(req.user) ? organizationId : req.user.organizationId;
      const structures = await storage.getSalaryStructures(orgId, personContextId, isActive === 'true' ? true : isActive === 'false' ? false : undefined);
      res.json(structures);
    } catch (error) {
      console.error("Error fetching salary structures:", error);
      res.status(500).json({ message: "Failed to fetch salary structures" });
    }
  });

  app.get("/api/hr/salary-structures/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const structure = await storage.getSalaryStructureById(req.params.id);
      if (!structure) {
        return res.status(404).json({ message: "Salary structure not found" });
      }
      if (!canAccessAllData(req.user) && structure.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(structure);
    } catch (error) {
      console.error("Error fetching salary structure:", error);
      res.status(500).json({ message: "Failed to fetch salary structure" });
    }
  });

  app.post("/api/hr/salary-structures", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertSalaryStructureSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const structure = await storage.createSalaryStructure({
        ...validation.data,
        createdBy: req.user.id
      });
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'create',
        actionCategory: 'hr',
        targetType: 'salary_structure',
        targetId: structure.id,
        newData: structure,
      });
      res.status(201).json(structure);
    } catch (error) {
      console.error("Error creating salary structure:", error);
      res.status(500).json({ message: "Failed to create salary structure" });
    }
  });

  app.put("/api/hr/salary-structures/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getSalaryStructureById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Salary structure not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const structure = await storage.updateSalaryStructure(req.params.id, req.body);
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'update',
        actionCategory: 'hr',
        targetType: 'salary_structure',
        targetId: req.params.id,
        previousData: existing,
        newData: structure,
      });
      res.json(structure);
    } catch (error) {
      console.error("Error updating salary structure:", error);
      res.status(500).json({ message: "Failed to update salary structure" });
    }
  });

  // Payroll Run Routes
  app.get("/api/payroll/runs", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { organizationId, status, fiscalYear } = req.query;
      const orgId = canAccessAllData(req.user) ? organizationId : req.user.organizationId;
      const runs = await storage.getPayrollRuns(orgId, status, fiscalYear);
      res.json(runs);
    } catch (error) {
      console.error("Error fetching payroll runs:", error);
      res.status(500).json({ message: "Failed to fetch payroll runs" });
    }
  });

  app.get("/api/payroll/runs/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const run = await storage.getPayrollRunById(req.params.id);
      if (!run) {
        return res.status(404).json({ message: "Payroll run not found" });
      }
      if (!canAccessAllData(req.user) && run.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(run);
    } catch (error) {
      console.error("Error fetching payroll run:", error);
      res.status(500).json({ message: "Failed to fetch payroll run" });
    }
  });

  app.post("/api/payroll/runs", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertPayrollRunSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const run = await storage.createPayrollRun({
        ...validation.data,
        createdBy: req.user.id
      });
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'create',
        actionCategory: 'payroll',
        targetType: 'payroll_run',
        targetId: run.id,
        newData: run,
      });
      res.status(201).json(run);
    } catch (error) {
      console.error("Error creating payroll run:", error);
      res.status(500).json({ message: "Failed to create payroll run" });
    }
  });

  app.put("/api/payroll/runs/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getPayrollRunById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Payroll run not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const run = await storage.updatePayrollRun(req.params.id, req.body);
      res.json(run);
    } catch (error) {
      console.error("Error updating payroll run:", error);
      res.status(500).json({ message: "Failed to update payroll run" });
    }
  });

  app.post("/api/payroll/runs/:id/calculate", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getPayrollRunById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Payroll run not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const run = await storage.calculatePayrollRun(req.params.id, req.user.id);
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'update',
        actionCategory: 'payroll',
        targetType: 'payroll_run',
        targetId: req.params.id,
        newData: { status: 'calculated' },
      });
      res.json(run);
    } catch (error) {
      console.error("Error calculating payroll run:", error);
      res.status(500).json({ message: "Failed to calculate payroll run" });
    }
  });

  app.post("/api/payroll/runs/:id/approve", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getPayrollRunById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Payroll run not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const run = await storage.approvePayrollRun(req.params.id, req.user.id);
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'update',
        actionCategory: 'payroll',
        targetType: 'payroll_run',
        targetId: req.params.id,
        newData: { status: 'approved' },
      });
      res.json(run);
    } catch (error) {
      console.error("Error approving payroll run:", error);
      res.status(500).json({ message: "Failed to approve payroll run" });
    }
  });

  app.post("/api/payroll/runs/:id/finalize", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getPayrollRunById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Payroll run not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const run = await storage.finalizePayrollRun(req.params.id, req.user.id);
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'update',
        actionCategory: 'payroll',
        targetType: 'payroll_run',
        targetId: req.params.id,
        newData: { status: 'finalized' },
      });
      res.json(run);
    } catch (error) {
      console.error("Error finalizing payroll run:", error);
      res.status(500).json({ message: "Failed to finalize payroll run" });
    }
  });

  // Payslip Routes
  app.get("/api/payroll/payslips", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { payrollRunId, personId } = req.query;
      const payslipList = await storage.getPayslips(payrollRunId, personId);
      res.json(payslipList);
    } catch (error) {
      console.error("Error fetching payslips:", error);
      res.status(500).json({ message: "Failed to fetch payslips" });
    }
  });

  app.get("/api/payroll/payslips/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const payslip = await storage.getPayslipById(req.params.id);
      if (!payslip) {
        return res.status(404).json({ message: "Payslip not found" });
      }
      if (!canAccessAllData(req.user) && payslip.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(payslip);
    } catch (error) {
      console.error("Error fetching payslip:", error);
      res.status(500).json({ message: "Failed to fetch payslip" });
    }
  });

  app.get("/api/payroll/payslips/:id/items", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const items = await storage.getPayslipItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching payslip items:", error);
      res.status(500).json({ message: "Failed to fetch payslip items" });
    }
  });

  app.post("/api/payroll/payslips", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertPayslipSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const payslip = await storage.createPayslip(validation.data);
      res.status(201).json(payslip);
    } catch (error) {
      console.error("Error creating payslip:", error);
      res.status(500).json({ message: "Failed to create payslip" });
    }
  });

  app.put("/api/payroll/payslips/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getPayslipById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Payslip not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const payslip = await storage.updatePayslip(req.params.id, req.body);
      res.json(payslip);
    } catch (error) {
      console.error("Error updating payslip:", error);
      res.status(500).json({ message: "Failed to update payslip" });
    }
  });

  // Ledger Account Routes
  app.get("/api/accounts/ledger", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { organizationId, accountType } = req.query;
      const orgId = canAccessAllData(req.user) ? organizationId : req.user.organizationId;
      const accounts = await storage.getLedgerAccounts(orgId, accountType);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching ledger accounts:", error);
      res.status(500).json({ message: "Failed to fetch ledger accounts" });
    }
  });

  app.get("/api/accounts/ledger/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const account = await storage.getLedgerAccountById(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "Ledger account not found" });
      }
      if (!canAccessAllData(req.user) && account.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching ledger account:", error);
      res.status(500).json({ message: "Failed to fetch ledger account" });
    }
  });

  app.post("/api/accounts/ledger", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertLedgerAccountSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const account = await storage.createLedgerAccount(validation.data);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating ledger account:", error);
      res.status(500).json({ message: "Failed to create ledger account" });
    }
  });

  app.put("/api/accounts/ledger/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getLedgerAccountById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Ledger account not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const account = await storage.updateLedgerAccount(req.params.id, req.body);
      res.json(account);
    } catch (error) {
      console.error("Error updating ledger account:", error);
      res.status(500).json({ message: "Failed to update ledger account" });
    }
  });

  app.delete("/api/accounts/ledger/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getLedgerAccountById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Ledger account not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deleteLedgerAccount(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ledger account:", error);
      res.status(500).json({ message: "Failed to delete ledger account" });
    }
  });

  // Journal Entry Routes
  app.get("/api/accounts/journal-entries", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), async (req: any, res) => {
    try {
      const { organizationId, sourceType, startDate, endDate } = req.query;
      const orgId = canAccessAllData(req.user) ? organizationId : req.user.organizationId;
      const entries = await storage.getJournalEntries(
        orgId,
        sourceType,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/accounts/journal-entries/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const entry = await storage.getJournalEntryById(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      if (!canAccessAllData(req.user) && entry.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  app.get("/api/accounts/journal-entries/:id/lines", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const lines = await storage.getJournalLines(req.params.id);
      res.json(lines);
    } catch (error) {
      console.error("Error fetching journal lines:", error);
      res.status(500).json({ message: "Failed to fetch journal lines" });
    }
  });

  app.post("/api/accounts/journal-entries", isAuthenticated, requireActiveSubscription, requireSubscriptionTier(["basic"]), requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertJournalEntrySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const entry = await storage.createJournalEntry({
        ...validation.data,
        createdBy: req.user.id
      });
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'create',
        actionCategory: 'accounting',
        targetType: 'journal_entry',
        targetId: entry.id,
        newData: entry,
      });
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  app.post("/api/accounts/journal-entries/:id/lines", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = insertJournalLineSchema.safeParse({
        ...req.body,
        journalEntryId: req.params.id
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const line = await storage.createJournalLine(validation.data);
      res.status(201).json(line);
    } catch (error) {
      console.error("Error creating journal line:", error);
      res.status(500).json({ message: "Failed to create journal line" });
    }
  });

  app.post("/api/accounts/journal-entries/:id/post", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getJournalEntryById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const entry = await storage.postJournalEntry(req.params.id, req.user.id);
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'update',
        actionCategory: 'accounting',
        targetType: 'journal_entry',
        targetId: req.params.id,
        newData: { status: 'posted' },
      });
      res.json(entry);
    } catch (error) {
      console.error("Error posting journal entry:", error);
      res.status(500).json({ message: "Failed to post journal entry" });
    }
  });

  app.post("/api/accounts/journal-entries/:id/reverse", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const existing = await storage.getJournalEntryById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      if (!canAccessAllData(req.user) && existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const entry = await storage.reverseJournalEntry(req.params.id, req.user.id);
      await storage.createAuditLog({
        actorUserId: req.user.id,
        action: 'update',
        actionCategory: 'accounting',
        targetType: 'journal_entry',
        targetId: req.params.id,
        newData: { status: 'reversed' },
      });
      res.json(entry);
    } catch (error) {
      console.error("Error reversing journal entry:", error);
      res.status(500).json({ message: "Failed to reverse journal entry" });
    }
  });

  // Pakistan Tax Slabs Routes
  app.get("/api/tax/slabs", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const { fiscalYear, isActive } = req.query;
      const slabs = await storage.getPakistanTaxSlabs(fiscalYear, isActive === 'true' ? true : isActive === 'false' ? false : undefined);
      res.json(slabs);
    } catch (error) {
      console.error("Error fetching tax slabs:", error);
      res.status(500).json({ message: "Failed to fetch tax slabs" });
    }
  });

  app.post("/api/tax/slabs", isAuthenticated, requireActiveSubscription, requireSuperAdmin, async (req: any, res) => {
    try {
      const validation = insertPakistanTaxSlabSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const slab = await storage.createPakistanTaxSlab(validation.data);
      res.status(201).json(slab);
    } catch (error) {
      console.error("Error creating tax slab:", error);
      res.status(500).json({ message: "Failed to create tax slab" });
    }
  });

  app.put("/api/tax/slabs/:id", isAuthenticated, requireActiveSubscription, requireSuperAdmin, async (req: any, res) => {
    try {
      const slab = await storage.updatePakistanTaxSlab(req.params.id, req.body);
      if (!slab) {
        return res.status(404).json({ message: "Tax slab not found" });
      }
      res.json(slab);
    } catch (error) {
      console.error("Error updating tax slab:", error);
      res.status(500).json({ message: "Failed to update tax slab" });
    }
  });

  app.post("/api/tax/calculate", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const { annualIncome, fiscalYear } = req.body;
      if (!annualIncome || !fiscalYear) {
        return res.status(400).json({ message: "annualIncome and fiscalYear are required" });
      }
      const tax = await storage.calculateIncomeTax(parseFloat(annualIncome), fiscalYear);
      res.json({ annualIncome, fiscalYear, calculatedTax: tax });
    } catch (error) {
      console.error("Error calculating tax:", error);
      res.status(500).json({ message: "Failed to calculate tax" });
    }
  });

  // Organization HR Settings Routes
  app.get("/api/hr/settings/:organizationId", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      if (!canAccessAllData(req.user) && req.params.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const settings = await storage.getOrganizationHRSettings(req.params.organizationId);
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching HR settings:", error);
      res.status(500).json({ message: "Failed to fetch HR settings" });
    }
  });

  app.put("/api/hr/settings/:organizationId", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      if (!canAccessAllData(req.user) && req.params.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const settings = await storage.upsertOrganizationHRSettings({
        ...req.body,
        organizationId: req.params.organizationId,
        updatedBy: req.user.id
      });
      res.json(settings);
    } catch (error) {
      console.error("Error updating HR settings:", error);
      res.status(500).json({ message: "Failed to update HR settings" });
    }
  });

  // ========== Person Search Routes ==========
  // NOTE: Person Master Architecture - Persons (base identity) are shared across organizations
  // because the same real person (identified by CNIC/phone) can visit multiple healthcare facilities.
  // Organization-specific data is stored in PatientFacilityEncounter (MRN, visit history per facility).
  // This allows a patient's complete health record to be accessed across facilities while
  // maintaining facility-specific billing and visit tracking.
  
  app.get("/api/persons/search", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const { type, value, organizationId } = req.query;
      if (!type || !value) {
        return res.status(400).json({ message: "type and value are required" });
      }
      
      // For CNIC/phone search: persons are globally unique identifiers (same person, multiple facilities)
      // For name search: restrict to organization to avoid confusion with similar names
      const effectiveOrgId = canAccessAllData(req.user) ? organizationId : req.user.organizationId;
      
      let person = null;
      switch (type) {
        case 'cnic':
          person = await storage.getPersonByCnic(value as string);
          break;
        case 'phone':
          person = await storage.getPersonByPhone(value as string);
          break;
        case 'name':
          const persons = await storage.getPersons(effectiveOrgId, value as string);
          person = persons[0] || null;
          break;
        default:
          return res.status(400).json({ message: "Invalid search type. Use: cnic, phone, or name" });
      }
      
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      res.json(person);
    } catch (error) {
      console.error("Error searching person:", error);
      res.status(500).json({ message: "Failed to search person" });
    }
  });

  // Person search with roles - for add screens (employee, doctor, etc.)
  // Returns multiple results with role information
  app.get("/api/persons/search-with-roles", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const { pool } = await import("./db");
      const { query, searchType } = req.query;
      if (!query || typeof query !== 'string' || query.length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      // Super-admin MUST provide organizationId for multi-tenant isolation
      // Regular users use their own organizationId
      const effectiveOrgId = canAccessAllData(req.user) ? req.query.organizationId : req.user.organizationId;
      
      if (!effectiveOrgId) {
        return res.status(400).json({ message: "Organization ID is required for person search" });
      }
      
      // Build search query based on searchType
      const searchValue = query.trim();
      const params: any[] = [`%${searchValue}%`, effectiveOrgId];
      
      let searchCondition = '';
      if (searchType === 'cnic') {
        // CNIC-only search
        searchCondition = `p.cnic ILIKE $1`;
      } else {
        // Search by name, phone, or CNIC
        searchCondition = `(
          p.first_name ILIKE $1 OR 
          p.last_name ILIKE $1 OR 
          CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) ILIKE $1 OR
          p.phone ILIKE $1 OR 
          p.cnic ILIKE $1
        )`;
      }
      
      // Always apply organization filter for multi-tenant isolation
      const orgFilter = `AND EXISTS (
        SELECT 1 FROM person_contexts pc2 
        WHERE pc2.person_id = p.id AND pc2.organization_id = $2
      )`;
      
      // Query persons with their roles from personContexts
      const result = await pool.query(`
        SELECT 
          p.id,
          p.cnic,
          p.phone,
          p.first_name,
          p.last_name,
          p.date_of_birth,
          p.gender,
          p.email,
          p.address,
          p.city,
          p.blood_group,
          p.emergency_contact_name,
          p.emergency_contact_phone,
          p.is_active,
          (
            SELECT json_agg(json_build_object(
              'id', pc.id,
              'roleType', pc.role_type,
              'designation', pc.designation,
              'department', pc.department,
              'organizationId', pc.organization_id,
              'status', pc.status
            ))
            FROM person_contexts pc
            WHERE pc.person_id = p.id AND pc.status = 'active'
          ) as roles
        FROM persons p
        WHERE ${searchCondition} AND p.is_active = true ${orgFilter}
        ORDER BY p.first_name, p.last_name
        LIMIT 20
      `, params);
      
      // Format results with role display
      const personsWithRoles = result.rows.map((person: any) => {
        const roles = person.roles || [];
        const primaryRole = roles.length > 0 ? roles[0] : null;
        
        // Format display name with role or phone
        let displayLabel = '';
        const fullName = `${person.first_name} ${person.last_name || ''}`.trim();
        
        if (primaryRole) {
          const roleDisplay = primaryRole.designation || primaryRole.roleType || 'Staff';
          displayLabel = `${fullName} (${roleDisplay.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())})`;
        } else if (person.phone) {
          displayLabel = `${fullName} (Phone: ${person.phone})`;
        } else if (person.cnic) {
          displayLabel = `${fullName} (CNIC: ${person.cnic})`;
        } else {
          displayLabel = fullName;
        }
        
        return {
          id: person.id,
          cnic: person.cnic,
          phone: person.phone,
          firstName: person.first_name,
          lastName: person.last_name,
          dateOfBirth: person.date_of_birth,
          gender: person.gender,
          email: person.email,
          address: person.address,
          city: person.city,
          bloodGroup: person.blood_group,
          emergencyContactName: person.emergency_contact_name,
          emergencyContactPhone: person.emergency_contact_phone,
          isActive: person.is_active,
          roles: roles,
          displayLabel: displayLabel,
        };
      });
      
      res.json(personsWithRoles);
    } catch (error) {
      console.error("Error searching persons with roles:", error);
      res.status(500).json({ message: "Failed to search persons" });
    }
  });

  // Get list of persons by role and organization
  // Used for doctor lists, employee lists, etc.
  app.get("/api/persons/by-role/:roleType", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const { roleType } = req.params;
      
      // Validate roleType
      const validRoles = ['doctor', 'nurse', 'technician', 'pharmacist', 'front_desk', 'receptionist', 'admin', 'mr', 'staff', 'patient', 'employee'];
      if (!validRoles.includes(roleType)) {
        return res.status(400).json({ message: "Invalid role type" });
      }
      
      // Get organization ID - super-admin must provide, others use their own
      const effectiveOrgId = canAccessAllData(req.user) ? req.query.organizationId : req.user.organizationId;
      
      if (!effectiveOrgId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }
      
      const personsWithRole = await storage.getPersonsWithRole(effectiveOrgId, roleType);
      
      // Format response with combined data
      const formattedList = personsWithRole.map(person => ({
        id: person.id,
        personId: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        fullName: `${person.firstName} ${person.lastName || ''}`.trim(),
        cnic: person.cnic,
        phone: person.phone,
        email: person.email,
        gender: person.gender,
        dateOfBirth: person.dateOfBirth,
        bloodGroup: person.bloodGroup,
        address: person.address,
        city: person.city,
        isActive: person.isActive,
        // Context info
        contextId: person.context.id,
        roleType: person.context.roleType,
        designation: person.context.designation,
        department: person.context.department,
        facilityId: person.context.facilityId,
        organizationId: person.context.organizationId,
        status: person.context.status,
        joinDate: person.context.joinDate,
      }));
      
      res.json(formattedList);
    } catch (error) {
      console.error("Error getting persons by role:", error);
      res.status(500).json({ message: "Failed to get persons by role" });
    }
  });

  // ========== OPD Visits Routes ==========
  
  // Valid OPD visit statuses and allowed transitions
  const OPD_VALID_STATUSES = ['registered', 'vitals_done', 'in_consultation', 'tests_ordered', 'tests_done', 'prescription_given', 'payment_pending', 'completed', 'cancelled'];
  const OPD_STATUS_TRANSITIONS: Record<string, string[]> = {
    'registered': ['vitals_done', 'in_consultation', 'cancelled'],
    'vitals_done': ['in_consultation', 'cancelled'],
    'in_consultation': ['tests_ordered', 'prescription_given', 'payment_pending', 'completed', 'cancelled'],
    'tests_ordered': ['tests_done', 'cancelled'],
    'tests_done': ['in_consultation', 'prescription_given', 'payment_pending', 'completed', 'cancelled'],
    'prescription_given': ['payment_pending', 'completed', 'cancelled'],
    'payment_pending': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': [],
  };
  
  const opdVisitCreateSchema = z.object({
    personId: z.string().uuid("Invalid person ID"),
    organizationId: z.string().uuid("Invalid organization ID"),
    visitType: z.enum(['consultation', 'follow_up', 'procedure', 'emergency']).default('consultation'),
    doctorContextId: z.string().uuid().optional().nullable(),
    chiefComplaint: z.string().optional().nullable(),
  });
  
  const opdVisitUpdateSchema = z.object({
    status: z.enum(['registered', 'vitals_done', 'in_consultation', 'tests_ordered', 'tests_done', 'prescription_given', 'payment_pending', 'completed', 'cancelled'] as const).optional(),
    doctorContextId: z.string().uuid().optional().nullable(),
    chiefComplaint: z.string().optional().nullable(),
    diagnosis: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  });
  
  app.get("/api/opd-visits", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const { organizationId, date, status, personId } = req.query;
      
      // Enforce organization access - non-super-admins can only see their org's visits
      const effectiveOrgId = canAccessAllData(req.user) ? organizationId : req.user.organizationId;
      if (!effectiveOrgId) {
        return res.status(400).json({ message: "organizationId is required" });
      }
      
      // Build filter
      const filter: any = { organizationId: effectiveOrgId };
      if (date) filter.date = date;
      if (status && OPD_VALID_STATUSES.includes(status)) filter.status = status;
      if (personId) filter.personId = personId;
      
      const visits = await storage.getOpdVisits(filter);
      res.json(visits);
    } catch (error) {
      console.error("Error fetching OPD visits:", error);
      res.status(500).json({ message: "Failed to fetch OPD visits" });
    }
  });

  app.get("/api/opd-visits/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const visit = await storage.getOpdVisitById(req.params.id);
      if (!visit) {
        return res.status(404).json({ message: "OPD visit not found" });
      }
      
      // Organization access check
      if (!canAccessAllData(req.user) && visit.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized to view this visit" });
      }
      
      res.json(visit);
    } catch (error) {
      console.error("Error fetching OPD visit:", error);
      res.status(500).json({ message: "Failed to fetch OPD visit" });
    }
  });

  app.post("/api/opd-visits", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      // Validate request body with Zod
      const validation = opdVisitCreateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }
      
      const { personId, organizationId, visitType, doctorContextId, chiefComplaint } = validation.data;
      
      // Organization access check
      if (!canAccessAllData(req.user) && organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized to create visits for this organization" });
      }
      
      // Verify person exists
      const person = await storage.getPersonById(personId);
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      // Generate visit number (format: V-YYYYMMDD-NNN)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const existingVisitsToday = await storage.getOpdVisits({ 
        organizationId, 
        date: today.toISOString().slice(0, 10) 
      });
      const visitNumber = `V-${dateStr}-${String(existingVisitsToday.length + 1).padStart(3, '0')}`;
      
      // Find or create patient facility encounter with unique MRN
      // MRN format: MRN-YYMMDD-XXXXX where XXXXX is timestamp-based for uniqueness
      let encounter = await storage.getPatientFacilityEncounter(personId, organizationId);
      if (!encounter) {
        const datePrefix = today.toISOString().slice(2, 10).replace(/-/g, '');
        // Use timestamp-based suffix for uniqueness (last 5 digits of timestamp + random)
        const uniqueSuffix = String(Date.now()).slice(-4) + String(Math.floor(Math.random() * 10));
        encounter = await storage.createPatientFacilityEncounter({
          personId,
          organizationId,
          patientNumber: `MRN-${datePrefix}-${uniqueSuffix}`,
          createdBy: req.user.id,
        });
      }
      
      // Create OPD visit
      const visit = await storage.createOpdVisit({
        organizationId,
        personId,
        patientEncounterId: encounter.id,
        visitNumber,
        visitDate: today,
        visitType: visitType || 'consultation',
        doctorContextId: doctorContextId || null,
        chiefComplaint: chiefComplaint || null,
        status: 'registered',
        createdBy: req.user.id,
      });
      
      // Create queue token
      const queueToken = await storage.createQueueToken({
        organizationId,
        tokenType: 'opd',
        tokenNumber: existingVisitsToday.length + 1,
        personId,
        referenceType: 'opd_visit',
        referenceId: visit.id,
        status: 'waiting',
        issuedAt: today,
      });
      
      // Update encounter visit count
      await storage.updatePatientFacilityEncounter(encounter.id, {
        lastVisitDate: today,
        totalVisits: (encounter.totalVisits || 0) + 1,
      });
      
      // Create audit log
      await storage.createAuditLog({
        actorUserId: req.user.id,
        organizationId,
        action: 'create',
        actionCategory: 'queue',
        targetType: 'opd_visit',
        targetId: visit.id,
        newData: { visit, queueToken },
      });
      
      res.status(201).json({
        ...visit,
        personName: `${person.firstName} ${person.lastName || ''}`.trim(),
        queueToken,
        mrn: encounter.patientNumber,
      });
    } catch (error) {
      console.error("Error creating OPD visit:", error);
      res.status(500).json({ message: "Failed to create OPD visit" });
    }
  });

  app.patch("/api/opd-visits/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      // Validate request body with Zod
      const validation = opdVisitUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }
      
      // Get existing visit first
      const existingVisit = await storage.getOpdVisitById(req.params.id);
      if (!existingVisit) {
        return res.status(404).json({ message: "OPD visit not found" });
      }
      
      // Organization access check
      if (!canAccessAllData(req.user) && existingVisit.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Not authorized to update this visit" });
      }
      
      // Validate status transition if status is being updated
      const { status, ...otherUpdates } = validation.data;
      if (status) {
        const currentStatus = existingVisit.status;
        const allowedTransitions = OPD_STATUS_TRANSITIONS[currentStatus] || [];
        if (!allowedTransitions.includes(status)) {
          return res.status(400).json({ 
            message: `Invalid status transition from '${currentStatus}' to '${status}'`,
            allowedTransitions
          });
        }
      }
      
      const visit = await storage.updateOpdVisit(req.params.id, {
        ...otherUpdates,
        ...(status && { status }),
        updatedAt: new Date(),
      });
      
      // Create audit log for status changes
      if (status) {
        await storage.createAuditLog({
          actorUserId: req.user.id,
          organizationId: existingVisit.organizationId,
          action: 'update',
          actionCategory: 'queue',
          targetType: 'opd_visit',
          targetId: visit.id,
          oldData: { status: existingVisit.status },
          newData: { status },
        });
      }
      
      res.json(visit);
    } catch (error) {
      console.error("Error updating OPD visit:", error);
      res.status(500).json({ message: "Failed to update OPD visit" });
    }
  });

  // ========== Billing / Invoice Routes ==========

  // Get facility billing configuration
  app.get("/api/billing/config", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const organizationId = canAccessAllData(req.user) 
        ? (req.query.organizationId || req.user.organizationId)
        : req.user.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID required" });
      }
      
      const config = await storage.getFacilityBillingConfig(organizationId);
      res.json(config || { organizationId });
    } catch (error) {
      console.error("Error fetching billing config:", error);
      res.status(500).json({ message: "Failed to fetch billing configuration" });
    }
  });

  // Update facility billing configuration
  const billingConfigUpdateSchema = z.object({
    invoicePrefix: z.string().max(10).optional(),
    receiptPrefix: z.string().max(10).optional(),
    invoiceStartNumber: z.number().int().positive().optional(),
    receiptStartNumber: z.number().int().positive().optional(),
    enableGST: z.boolean().optional(),
    gstPercentage: z.string().optional(),
    gstRegistrationNumber: z.string().optional(),
    maxDiscountPercentage: z.string().optional(),
    requireDiscountApproval: z.boolean().optional(),
    acceptCash: z.boolean().optional(),
    acceptCard: z.boolean().optional(),
    acceptOnlinePayment: z.boolean().optional(),
    acceptInsurance: z.boolean().optional(),
    currency: z.string().max(3).optional(),
  });

  app.post("/api/billing/config", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = billingConfigUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid billing configuration", errors: validation.error.errors });
      }

      const organizationId = canAccessAllData(req.user) 
        ? (req.body.organizationId || req.user.organizationId)
        : req.user.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID required" });
      }
      
      const config = await storage.upsertFacilityBillingConfig({
        ...validation.data,
        organizationId,
        updatedBy: req.user.id,
      });
      res.json(config);
    } catch (error) {
      console.error("Error updating billing config:", error);
      res.status(500).json({ message: "Failed to update billing configuration" });
    }
  });

  // Get patient invoices
  app.get("/api/invoices", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const organizationId = canAccessAllData(req.user) 
        ? (req.query.organizationId || req.user.organizationId)
        : req.user.organizationId;
      const { personId, status } = req.query;
      
      const invoices = await storage.getPatientInvoices(organizationId, personId, status);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get single invoice
  app.get("/api/invoices/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const invoice = await storage.getPatientInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check organization access
      if (!canAccessAllData(req.user) && invoice.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Create invoice
  const lineItemSchema = z.object({
    description: z.string().min(1, "Description required"),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    amount: z.number().nonnegative().optional(),
    category: z.string().optional(),
  });

  const createInvoiceSchema = z.object({
    personId: z.string().uuid("Valid patient ID required"),
    visitType: z.enum(["opd", "ipd", "lab", "pharmacy", "emergency"]).optional(),
    visitId: z.string().uuid().optional(),
    lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
    discountAmount: z.number().nonnegative().optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    taxAmount: z.number().nonnegative().optional(),
    notes: z.string().optional(),
  });

  app.post("/api/invoices", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const validation = createInvoiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid invoice data", errors: validation.error.errors });
      }

      const organizationId = canAccessAllData(req.user) 
        ? (req.body.organizationId || req.user.organizationId)
        : req.user.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID required" });
      }
      
      // Generate invoice number
      const invoiceNumber = await storage.getNextInvoiceNumber(organizationId);
      
      // Calculate amounts for line items if not provided, and compute totals
      const lineItems = validation.data.lineItems.map(item => ({
        ...item,
        amount: item.amount ?? (item.quantity * item.unitPrice),
      }));
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const discountAmount = validation.data.discountAmount || 0;
      const taxAmount = validation.data.taxAmount || 0;
      const totalAmount = subtotal - discountAmount + taxAmount;
      
      const invoice = await storage.createPatientInvoice({
        personId: validation.data.personId,
        visitType: validation.data.visitType,
        visitId: validation.data.visitId,
        lineItems: validation.data.lineItems,
        notes: validation.data.notes,
        organizationId,
        invoiceNumber,
        discountAmount: discountAmount.toString(),
        taxAmount: taxAmount.toString(),
        subtotal: subtotal.toString(),
        totalAmount: totalAmount.toString(),
        balanceAmount: totalAmount.toString(),
        createdBy: req.user.id,
      });
      
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Update invoice
  app.patch("/api/invoices/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const invoice = await storage.getPatientInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check organization access
      if (!canAccessAllData(req.user) && invoice.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Recalculate totals if line items changed
      let updates = { ...req.body };
      if (req.body.lineItems) {
        const lineItems = req.body.lineItems;
        const subtotal = lineItems.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
        const discountAmount = parseFloat(req.body.discountAmount || invoice.discountAmount) || 0;
        const taxAmount = parseFloat(req.body.taxAmount || invoice.taxAmount) || 0;
        const totalAmount = subtotal - discountAmount + taxAmount;
        const paidAmount = parseFloat(req.body.paidAmount || invoice.paidAmount) || 0;
        
        updates = {
          ...updates,
          subtotal: subtotal.toString(),
          totalAmount: totalAmount.toString(),
          balanceAmount: (totalAmount - paidAmount).toString(),
        };
      }
      
      // Update paid amount and balance
      if (req.body.paidAmount !== undefined) {
        const paidAmount = parseFloat(req.body.paidAmount);
        const totalAmount = parseFloat(updates.totalAmount || invoice.totalAmount);
        updates.balanceAmount = (totalAmount - paidAmount).toString();
        
        // Auto-update status based on payment
        if (paidAmount >= totalAmount) {
          updates.status = "paid";
        } else if (paidAmount > 0) {
          updates.status = "partial";
        }
      }
      
      const updated = await storage.updatePatientInvoice(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // ========== IPD / Ward Management Routes ==========

  // Get wards
  app.get("/api/ipd/wards", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const organizationId = canAccessAllData(req.user) 
        ? (req.query.organizationId || req.user.organizationId)
        : req.user.organizationId;
      
      const wards = await storage.getWards(organizationId);
      res.json(wards);
    } catch (error) {
      console.error("Error fetching wards:", error);
      res.status(500).json({ message: "Failed to fetch wards" });
    }
  });

  // Create ward
  const createWardSchema = z.object({
    name: z.string().min(1, "Ward name required"),
    code: z.string().min(1, "Ward code required"),
    wardType: z.enum(["general", "semi_private", "private", "icu", "nicu", "picu", "ccu", "emergency"]),
    floor: z.string().optional(),
    totalBeds: z.number().int().nonnegative().optional(),
    dailyRate: z.string().optional(),
    isActive: z.boolean().optional(),
  });

  app.post("/api/ipd/wards", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = createWardSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid ward data", errors: validation.error.errors });
      }

      const organizationId = canAccessAllData(req.user) 
        ? (req.body.organizationId || req.user.organizationId)
        : req.user.organizationId;
      
      const ward = await storage.createWard({
        ...validation.data,
        organizationId,
      });
      res.status(201).json(ward);
    } catch (error) {
      console.error("Error creating ward:", error);
      res.status(500).json({ message: "Failed to create ward" });
    }
  });

  // Update ward
  app.patch("/api/ipd/wards/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const ward = await storage.getWardById(req.params.id);
      if (!ward) {
        return res.status(404).json({ message: "Ward not found" });
      }
      
      if (!canAccessAllData(req.user) && ward.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updated = await storage.updateWard(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating ward:", error);
      res.status(500).json({ message: "Failed to update ward" });
    }
  });

  // Get beds
  app.get("/api/ipd/beds", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const organizationId = canAccessAllData(req.user) 
        ? (req.query.organizationId || req.user.organizationId)
        : req.user.organizationId;
      const { wardId } = req.query;
      
      const beds = await storage.getBeds(wardId, organizationId);
      res.json(beds);
    } catch (error) {
      console.error("Error fetching beds:", error);
      res.status(500).json({ message: "Failed to fetch beds" });
    }
  });

  // Get available beds for a ward
  app.get("/api/ipd/wards/:wardId/available-beds", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const beds = await storage.getAvailableBeds(req.params.wardId);
      res.json(beds);
    } catch (error) {
      console.error("Error fetching available beds:", error);
      res.status(500).json({ message: "Failed to fetch available beds" });
    }
  });

  // Create bed
  const createBedSchema = z.object({
    wardId: z.string().uuid("Valid ward ID required"),
    bedNumber: z.string().min(1, "Bed number required"),
    bedType: z.enum(["standard", "electric", "icu", "pediatric", "bariatric"]),
    dailyRateOverride: z.string().optional(),
    status: z.enum(["available", "occupied", "maintenance", "reserved"]).optional(),
  });

  app.post("/api/ipd/beds", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const validation = createBedSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid bed data", errors: validation.error.errors });
      }

      // Verify ward exists and belongs to user's organization
      const ward = await storage.getWardById(validation.data.wardId);
      if (!ward) {
        return res.status(404).json({ message: "Ward not found" });
      }
      if (!canAccessAllData(req.user) && ward.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const bed = await storage.createBed(validation.data);
      res.status(201).json(bed);
    } catch (error) {
      console.error("Error creating bed:", error);
      res.status(500).json({ message: "Failed to create bed" });
    }
  });

  // Update bed
  app.patch("/api/ipd/beds/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const bed = await storage.getBedById(req.params.id);
      if (!bed) {
        return res.status(404).json({ message: "Bed not found" });
      }
      
      // Verify organization access through ward
      const ward = await storage.getWardById(bed.wardId);
      if (!ward) {
        return res.status(404).json({ message: "Ward not found" });
      }
      if (!canAccessAllData(req.user) && ward.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updated = await storage.updateBed(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating bed:", error);
      res.status(500).json({ message: "Failed to update bed" });
    }
  });

  // Get IPD admissions
  app.get("/api/ipd/admissions", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const organizationId = canAccessAllData(req.user) 
        ? (req.query.organizationId || req.user.organizationId)
        : req.user.organizationId;
      const { status } = req.query;
      
      const admissions = await storage.getIpdAdmissions(organizationId, status);
      res.json(admissions);
    } catch (error) {
      console.error("Error fetching admissions:", error);
      res.status(500).json({ message: "Failed to fetch admissions" });
    }
  });

  // Get single admission
  app.get("/api/ipd/admissions/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const admission = await storage.getIpdAdmissionById(req.params.id);
      if (!admission) {
        return res.status(404).json({ message: "Admission not found" });
      }
      
      if (!canAccessAllData(req.user) && admission.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(admission);
    } catch (error) {
      console.error("Error fetching admission:", error);
      res.status(500).json({ message: "Failed to fetch admission" });
    }
  });

  // Create IPD admission
  const createAdmissionSchema = z.object({
    personId: z.string().uuid("Valid patient ID required"),
    admittingDoctorId: z.string().uuid().optional(),
    admissionType: z.enum(["emergency", "planned", "transfer"]),
    admissionReason: z.string().optional(),
    chiefComplaint: z.string().optional(),
    wardId: z.string().uuid().optional(),
    bedId: z.string().uuid().optional(),
    expectedDays: z.number().int().positive().optional(),
    notes: z.string().optional(),
  });

  app.post("/api/ipd/admissions", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const validation = createAdmissionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid admission data", errors: validation.error.errors });
      }

      const organizationId = canAccessAllData(req.user) 
        ? (req.body.organizationId || req.user.organizationId)
        : req.user.organizationId;
      
      // Generate admission number
      const admissionNumber = await storage.getNextAdmissionNumber(organizationId);
      
      // If bed is assigned, verify it's available
      if (validation.data.bedId) {
        const bed = await storage.getBedById(validation.data.bedId);
        if (!bed) {
          return res.status(404).json({ message: "Bed not found" });
        }
        if (bed.status !== "available") {
          return res.status(400).json({ message: "Bed is not available" });
        }
      }
      
      const admission = await storage.createIpdAdmission({
        ...validation.data,
        organizationId,
        admissionNumber,
        admissionDate: new Date(),
        status: "admitted",
        createdBy: req.user.id,
      });
      
      res.status(201).json(admission);
    } catch (error) {
      console.error("Error creating admission:", error);
      res.status(500).json({ message: "Failed to create admission" });
    }
  });

  // Update admission (transfer bed, discharge, etc.)
  app.patch("/api/ipd/admissions/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const admission = await storage.getIpdAdmissionById(req.params.id);
      if (!admission) {
        return res.status(404).json({ message: "Admission not found" });
      }
      
      if (!canAccessAllData(req.user) && admission.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // If discharging, set discharge date
      let updates = { ...req.body };
      if (req.body.status === "discharged" && !req.body.dischargeDate) {
        updates.dischargeDate = new Date();
      }
      
      const updated = await storage.updateIpdAdmission(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating admission:", error);
      res.status(500).json({ message: "Failed to update admission" });
    }
  });

  // ========== Operating Theatre (OT) Routes ==========

  // Get operating theatres
  app.get("/api/ot/theatres", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const orgId = canAccessAllData(req.user) ? undefined : req.user.organizationId;
      const theatres = await storage.getOperatingTheatres(orgId);
      res.json(theatres);
    } catch (error) {
      console.error("Error fetching theatres:", error);
      res.status(500).json({ message: "Failed to fetch theatres" });
    }
  });

  // Create operating theatre
  app.post("/api/ot/theatres", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const schema = z.object({
        organizationId: z.string(),
        name: z.string().min(1, "Name is required"),
        code: z.string().optional(),
        theatreType: z.enum(["major", "minor", "cardiac", "ortho", "neuro", "ophthalmic", "ent"]),
        capacity: z.string().optional(),
        hourlyRate: z.string().optional(),
        isActive: z.boolean().optional().default(true)
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      
      if (!canAccessAllData(req.user) && parsed.data.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const theatre = await storage.createOperatingTheatre(parsed.data);
      res.status(201).json(theatre);
    } catch (error) {
      console.error("Error creating theatre:", error);
      res.status(500).json({ message: "Failed to create theatre" });
    }
  });

  // Update operating theatre
  app.patch("/api/ot/theatres/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const theatre = await storage.getOperatingTheatreById(req.params.id);
      if (!theatre) {
        return res.status(404).json({ message: "Theatre not found" });
      }
      
      if (!canAccessAllData(req.user) && theatre.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updated = await storage.updateOperatingTheatre(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating theatre:", error);
      res.status(500).json({ message: "Failed to update theatre" });
    }
  });

  // Get surgical cases
  app.get("/api/ot/cases", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const orgId = canAccessAllData(req.user) ? undefined : req.user.organizationId;
      const filters = {
        status: req.query.status as string | undefined,
        theatreId: req.query.theatreId as string | undefined,
        date: req.query.date as string | undefined
      };
      const cases = await storage.getSurgicalCases(orgId, filters);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching surgical cases:", error);
      res.status(500).json({ message: "Failed to fetch surgical cases" });
    }
  });

  // Get single surgical case
  app.get("/api/ot/cases/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const surgicalCase = await storage.getSurgicalCaseById(req.params.id);
      if (!surgicalCase) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      if (!canAccessAllData(req.user) && surgicalCase.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(surgicalCase);
    } catch (error) {
      console.error("Error fetching case:", error);
      res.status(500).json({ message: "Failed to fetch case" });
    }
  });

  // Create surgical case
  app.post("/api/ot/cases", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const schema = z.object({
        organizationId: z.string(),
        personId: z.string(),
        admissionId: z.string().optional().nullable(),
        theatreId: z.string().optional().nullable(),
        procedureName: z.string().min(1, "Procedure name is required"),
        procedureCode: z.string().optional(),
        surgeryType: z.enum(["elective", "emergency", "day_case"]),
        priority: z.enum(["routine", "urgent", "emergency"]).optional().default("routine"),
        scheduledDate: z.string().or(z.date()).transform(val => typeof val === "string" ? new Date(val) : val),
        scheduledStartTime: z.string().optional(),
        estimatedDuration: z.number().optional(),
        leadSurgeonContextId: z.string().optional().nullable(),
        anesthetistContextId: z.string().optional().nullable(),
        preOpDiagnosis: z.string().optional(),
        anesthesiaType: z.enum(["general", "spinal", "epidural", "local"]).optional()
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      
      if (!canAccessAllData(req.user) && parsed.data.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const surgicalCase = await storage.createSurgicalCase({
        ...parsed.data,
        createdBy: req.user.id
      });
      res.status(201).json(surgicalCase);
    } catch (error) {
      console.error("Error creating surgical case:", error);
      res.status(500).json({ message: "Failed to create surgical case" });
    }
  });

  // Update surgical case
  app.patch("/api/ot/cases/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const surgicalCase = await storage.getSurgicalCaseById(req.params.id);
      if (!surgicalCase) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      if (!canAccessAllData(req.user) && surgicalCase.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Handle status transitions
      let updates = { ...req.body };
      if (req.body.status === "in_progress" && !surgicalCase.actualStartTime) {
        updates.actualStartTime = new Date();
      }
      if (req.body.status === "completed" && !surgicalCase.actualEndTime) {
        updates.actualEndTime = new Date();
      }
      
      const updated = await storage.updateSurgicalCase(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating surgical case:", error);
      res.status(500).json({ message: "Failed to update surgical case" });
    }
  });

  // ========== Insurance Routes ==========

  // Get insurance providers
  app.get("/api/insurance/providers", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const providers = await storage.getInsuranceProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch insurance providers" });
    }
  });

  // Create insurance provider
  app.post("/api/insurance/providers", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1, "Name is required"),
        code: z.string().optional(),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().nullable(),
        address: z.string().optional(),
        website: z.string().optional(),
        claimSubmissionUrl: z.string().optional(),
        isActive: z.boolean().optional().default(true)
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      
      const provider = await storage.createInsuranceProvider(parsed.data);
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating provider:", error);
      res.status(500).json({ message: "Failed to create insurance provider" });
    }
  });

  // Update insurance provider
  app.patch("/api/insurance/providers/:id", isAuthenticated, requireActiveSubscription, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const provider = await storage.getInsuranceProviderById(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      const updated = await storage.updateInsuranceProvider(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(500).json({ message: "Failed to update insurance provider" });
    }
  });

  // Get insurance policies for a person
  app.get("/api/insurance/policies", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const personId = req.query.personId as string | undefined;
      const policies = await storage.getInsurancePolicies(personId);
      res.json(policies);
    } catch (error) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ message: "Failed to fetch insurance policies" });
    }
  });

  // Create insurance policy
  app.post("/api/insurance/policies", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const schema = z.object({
        personId: z.string(),
        providerId: z.string(),
        policyNumber: z.string().min(1, "Policy number is required"),
        groupNumber: z.string().optional(),
        membershipType: z.enum(["self", "spouse", "dependent"]).optional(),
        relationToHolder: z.enum(["self", "spouse", "child", "parent"]).optional(),
        policyHolderName: z.string().optional(),
        policyHolderCnic: z.string().optional(),
        coverageStartDate: z.string().optional(),
        coverageEndDate: z.string().optional(),
        maxCoverageAmount: z.string().optional(),
        remainingCoverage: z.string().optional(),
        copayPercentage: z.string().optional(),
        deductibleAmount: z.string().optional()
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      
      const policy = await storage.createInsurancePolicy({
        ...parsed.data,
        coverageStartDate: parsed.data.coverageStartDate ? new Date(parsed.data.coverageStartDate) : null,
        coverageEndDate: parsed.data.coverageEndDate ? new Date(parsed.data.coverageEndDate) : null
      });
      res.status(201).json(policy);
    } catch (error) {
      console.error("Error creating policy:", error);
      res.status(500).json({ message: "Failed to create insurance policy" });
    }
  });

  // Update insurance policy
  app.patch("/api/insurance/policies/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const policy = await storage.getInsurancePolicyById(req.params.id);
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }
      
      const updated = await storage.updateInsurancePolicy(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating policy:", error);
      res.status(500).json({ message: "Failed to update insurance policy" });
    }
  });

  // Get insurance claims
  app.get("/api/insurance/claims", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const orgId = canAccessAllData(req.user) ? undefined : req.user.organizationId;
      const filters = {
        status: req.query.status as string | undefined,
        personId: req.query.personId as string | undefined
      };
      const claims = await storage.getInsuranceClaims(orgId, filters);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: "Failed to fetch insurance claims" });
    }
  });

  // Get single insurance claim
  app.get("/api/insurance/claims/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const claim = await storage.getInsuranceClaimById(req.params.id);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      if (!canAccessAllData(req.user) && claim.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(claim);
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ message: "Failed to fetch claim" });
    }
  });

  // Create insurance claim
  app.post("/api/insurance/claims", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const schema = z.object({
        organizationId: z.string(),
        policyId: z.string(),
        personId: z.string(),
        admissionId: z.string().optional().nullable(),
        surgicalCaseId: z.string().optional().nullable(),
        claimType: z.enum(["opd", "ipd", "surgery", "diagnostic", "pharmacy"]),
        serviceDate: z.string(),
        diagnosisCodes: z.array(z.string()).optional(),
        procedureCodes: z.array(z.string()).optional(),
        totalBillAmount: z.string(),
        claimedAmount: z.string(),
        requiresPreAuth: z.boolean().optional().default(false),
        preAuthNumber: z.string().optional()
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      
      if (!canAccessAllData(req.user) && parsed.data.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const claim = await storage.createInsuranceClaim({
        ...parsed.data,
        serviceDate: new Date(parsed.data.serviceDate),
        createdBy: req.user.id
      });
      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(500).json({ message: "Failed to create insurance claim" });
    }
  });

  // Update insurance claim
  app.patch("/api/insurance/claims/:id", isAuthenticated, requireActiveSubscription, async (req: any, res) => {
    try {
      const claim = await storage.getInsuranceClaimById(req.params.id);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      if (!canAccessAllData(req.user) && claim.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Handle status transitions
      let updates = { ...req.body };
      if (req.body.status === "submitted" && !claim.submittedAt) {
        updates.submittedAt = new Date();
      }
      if ((req.body.status === "approved" || req.body.status === "denied" || req.body.status === "partially_approved") && !claim.reviewedAt) {
        updates.reviewedAt = new Date();
      }
      if (req.body.status === "paid" && !claim.paymentDate) {
        updates.paymentDate = new Date();
      }
      
      const updated = await storage.updateInsuranceClaim(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(500).json({ message: "Failed to update insurance claim" });
    }
  });

  // ===============================
  // MASTER DATA API ENDPOINTS
  // Admin-only access (company_admin, super_admin)
  // ===============================

  const masterDataAuth = [isAuthenticated, requireRole(["company_admin", "super_admin"])];

  // Medical Professions (Global - read-only for admins)
  app.get("/api/master/professions", ...masterDataAuth, async (req: any, res) => {
    try {
      const result = await storage.query(`SELECT * FROM medical_professions ORDER BY name`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching professions:", error);
      res.status(500).json({ message: "Failed to fetch professions" });
    }
  });

  // Qualifications (Global - read-only for admins)
  app.get("/api/master/qualifications", ...masterDataAuth, async (req: any, res) => {
    try {
      const result = await storage.query(`SELECT * FROM qualifications ORDER BY name`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching qualifications:", error);
      res.status(500).json({ message: "Failed to fetch qualifications" });
    }
  });

  // Vital Types (Global - read-only for admins)
  app.get("/api/master/vital-types", ...masterDataAuth, async (req: any, res) => {
    try {
      const result = await storage.query(`SELECT * FROM vital_types ORDER BY display_order, name`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching vital types:", error);
      res.status(500).json({ message: "Failed to fetch vital types" });
    }
  });

  // Sample Types (Global - read-only for admins)
  app.get("/api/master/sample-types", ...masterDataAuth, async (req: any, res) => {
    try {
      const result = await storage.query(`SELECT * FROM sample_types ORDER BY name`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching sample types:", error);
      res.status(500).json({ message: "Failed to fetch sample types" });
    }
  });

  // Diagnoses (ICD-10) (Global - read-only for admins)
  app.get("/api/master/diagnoses", ...masterDataAuth, async (req: any, res) => {
    try {
      const result = await storage.query(`SELECT * FROM diagnoses ORDER BY icd_code`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching diagnoses:", error);
      res.status(500).json({ message: "Failed to fetch diagnoses" });
    }
  });

  // Payment Modes (Global - read-only for admins)
  app.get("/api/master/payment-modes", ...masterDataAuth, async (req: any, res) => {
    try {
      const result = await storage.query(`SELECT * FROM payment_modes ORDER BY name`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching payment modes:", error);
      res.status(500).json({ message: "Failed to fetch payment modes" });
    }
  });

  // Insurance Companies (Global - read-only for admins)
  app.get("/api/master/insurance-companies", ...masterDataAuth, async (req: any, res) => {
    try {
      const result = await storage.query(`SELECT * FROM insurance_companies ORDER BY name`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching insurance companies:", error);
      res.status(500).json({ message: "Failed to fetch insurance companies" });
    }
  });

  // Leave Types (Global - read-only for admins)
  app.get("/api/master/leave-types", ...masterDataAuth, async (req: any, res) => {
    try {
      const result = await storage.query(`SELECT * FROM leave_types ORDER BY code`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching leave types:", error);
      res.status(500).json({ message: "Failed to fetch leave types" });
    }
  });

  // Permissions (Global - read-only for admins)
  app.get("/api/master/permissions", ...masterDataAuth, async (req: any, res) => {
    try {
      const result = await storage.query(`SELECT * FROM permission_master ORDER BY module, code`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // Audit Event Types (Global - read-only for admins)
  app.get("/api/master/audit-events", ...masterDataAuth, async (req: any, res) => {
    try {
      const result = await storage.query(`SELECT * FROM audit_event_types ORDER BY category, code`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching audit event types:", error);
      res.status(500).json({ message: "Failed to fetch audit event types" });
    }
  });

  // Departments (Tenant-scoped) - Uses parameterized query for safety
  app.get("/api/master/departments", ...masterDataAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      if (!canAccessAllData(req.user) && !organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }
      const result = canAccessAllData(req.user)
        ? await storage.query(`SELECT * FROM departments ORDER BY name`)
        : await storage.query(`SELECT * FROM departments WHERE organization_id = $1 ORDER BY name`, [organizationId]);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Service Procedures (Tenant-scoped) - Uses parameterized query for safety
  app.get("/api/master/service-procedures", ...masterDataAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      if (!canAccessAllData(req.user) && !organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }
      const result = canAccessAllData(req.user)
        ? await storage.query(`SELECT * FROM service_procedures ORDER BY name`)
        : await storage.query(`SELECT * FROM service_procedures WHERE organization_id = $1 ORDER BY name`, [organizationId]);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching service procedures:", error);
      res.status(500).json({ message: "Failed to fetch service procedures" });
    }
  });

  // Lab Tests (Tenant-scoped) - Uses parameterized query for safety
  app.get("/api/master/lab-tests", ...masterDataAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      if (!canAccessAllData(req.user) && !organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }
      const result = canAccessAllData(req.user)
        ? await storage.query(`SELECT * FROM lab_tests ORDER BY name`)
        : await storage.query(`SELECT * FROM lab_tests WHERE organization_id = $1 ORDER BY name`, [organizationId]);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching lab tests:", error);
      res.status(500).json({ message: "Failed to fetch lab tests" });
    }
  });

  // Lab Equipment (Tenant-scoped via user's organization) - verifies facility belongs to user's org
  app.get("/api/master/lab-equipment", ...masterDataAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      if (!canAccessAllData(req.user) && !organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }
      // For super_admin, show all; for company_admin, show only equipment from facilities in their org
      const result = canAccessAllData(req.user)
        ? await storage.query(`SELECT * FROM lab_equipment ORDER BY name`)
        : await storage.query(`SELECT le.* FROM lab_equipment le 
            INNER JOIN healthcare_facilities hf ON le.facility_id = hf.id 
            WHERE hf.organization_id = $1 ORDER BY le.name`, [organizationId]);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching lab equipment:", error);
      res.status(500).json({ message: "Failed to fetch lab equipment" });
    }
  });

  // Clinical Templates (Tenant-scoped) - Uses parameterized query for safety
  app.get("/api/master/clinical-templates", ...masterDataAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      if (!canAccessAllData(req.user) && !organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }
      const result = canAccessAllData(req.user)
        ? await storage.query(`SELECT * FROM clinical_templates ORDER BY name`)
        : await storage.query(`SELECT * FROM clinical_templates WHERE organization_id = $1 ORDER BY name`, [organizationId]);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching clinical templates:", error);
      res.status(500).json({ message: "Failed to fetch clinical templates" });
    }
  });

  // Tax Master (Tenant-scoped) - Uses parameterized query for safety
  app.get("/api/master/taxes", ...masterDataAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      if (!canAccessAllData(req.user) && !organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }
      const result = canAccessAllData(req.user)
        ? await storage.query(`SELECT * FROM tax_master ORDER BY name`)
        : await storage.query(`SELECT * FROM tax_master WHERE organization_id = $1 ORDER BY name`, [organizationId]);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching taxes:", error);
      res.status(500).json({ message: "Failed to fetch taxes" });
    }
  });

  // Doctor CRM Profiles (Tenant-scoped) - Uses parameterized query for safety
  app.get("/api/master/doctor-crm", ...masterDataAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      if (!canAccessAllData(req.user) && !organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }
      const result = canAccessAllData(req.user)
        ? await storage.query(`SELECT * FROM doctor_crm_profiles ORDER BY last_visit_date DESC NULLS LAST`)
        : await storage.query(`SELECT * FROM doctor_crm_profiles WHERE organization_id = $1 ORDER BY last_visit_date DESC NULLS LAST`, [organizationId]);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching doctor CRM profiles:", error);
      res.status(500).json({ message: "Failed to fetch doctor CRM profiles" });
    }
  });

  // Product Promotions (Tenant-scoped) - Uses parameterized query for safety
  app.get("/api/master/promotions", ...masterDataAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      if (!canAccessAllData(req.user) && !organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }
      const result = canAccessAllData(req.user)
        ? await storage.query(`SELECT * FROM product_promotions ORDER BY start_date DESC`)
        : await storage.query(`SELECT * FROM product_promotions WHERE organization_id = $1 ORDER BY start_date DESC`, [organizationId]);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  // Sales Targets (Tenant-scoped) - Uses parameterized query for safety
  app.get("/api/master/sales-targets", ...masterDataAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      if (!canAccessAllData(req.user) && !organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }
      const result = canAccessAllData(req.user)
        ? await storage.query(`SELECT * FROM sales_targets ORDER BY period_start DESC`)
        : await storage.query(`SELECT * FROM sales_targets WHERE organization_id = $1 ORDER BY period_start DESC`, [organizationId]);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching sales targets:", error);
      res.status(500).json({ message: "Failed to fetch sales targets" });
    }
  });

  // Medicine Batches (Tenant-scoped via warehouse with org verification)
  app.get("/api/master/medicine-batches", ...masterDataAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      if (!canAccessAllData(req.user) && !organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }
      // For super_admin, show all; for company_admin, show only batches from warehouses in their org
      const result = canAccessAllData(req.user)
        ? await storage.query(`SELECT * FROM medicine_batches ORDER BY expiry_date ASC`)
        : await storage.query(`SELECT mb.* FROM medicine_batches mb 
            INNER JOIN warehouses w ON mb.warehouse_id = w.id 
            WHERE w.organization_id = $1 ORDER BY mb.expiry_date ASC`, [organizationId]);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching medicine batches:", error);
      res.status(500).json({ message: "Failed to fetch medicine batches" });
    }
  });

  // ==================== Phase 3: Permission Management Routes ====================

  // Screen management routes (Super Admin only)
  app.get("/api/admin/screens", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const { module, isActive } = req.query;
      const screens = await storage.getScreens(
        module as string | undefined, 
        isActive === 'true' ? true : isActive === 'false' ? false : undefined
      );
      res.json(screens);
    } catch (error: any) {
      console.error("Error fetching screens:", error);
      res.status(500).json({ message: "Failed to fetch screens", error: error?.message });
    }
  });

  app.get("/api/admin/screens/:id", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const screen = await storage.getScreenById(req.params.id);
      if (!screen) {
        return res.status(404).json({ message: "Screen not found" });
      }
      res.json(screen);
    } catch (error: any) {
      console.error("Error fetching screen:", error);
      res.status(500).json({ message: "Failed to fetch screen", error: error?.message });
    }
  });

  app.post("/api/admin/screens", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const validation = insertScreenSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const screen = await storage.createScreen(validation.data);
      res.status(201).json(screen);
    } catch (error: any) {
      console.error("Error creating screen:", error);
      res.status(500).json({ message: "Failed to create screen", error: error?.message });
    }
  });

  app.patch("/api/admin/screens/:id", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const validation = insertScreenSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const screen = await storage.updateScreen(req.params.id, validation.data);
      if (!screen) {
        return res.status(404).json({ message: "Screen not found" });
      }
      res.json(screen);
    } catch (error: any) {
      console.error("Error updating screen:", error);
      res.status(500).json({ message: "Failed to update screen", error: error?.message });
    }
  });

  app.delete("/api/admin/screens/:id", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteScreen(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Screen not found" });
      }
      res.json({ message: "Screen deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting screen:", error);
      res.status(500).json({ message: "Failed to delete screen", error: error?.message });
    }
  });

  // Screen permission management routes (Super Admin only)
  app.get("/api/admin/screen-permissions", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const { roleId, screenId } = req.query;
      const permissions = await storage.getScreenPermissions(
        roleId as string | undefined, 
        screenId as string | undefined
      );
      res.json(permissions);
    } catch (error: any) {
      console.error("Error fetching screen permissions:", error);
      res.status(500).json({ message: "Failed to fetch screen permissions", error: error?.message });
    }
  });

  app.post("/api/admin/screen-permissions", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const validation = insertScreenPermissionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const permission = await storage.createScreenPermission(validation.data);
      res.status(201).json(permission);
    } catch (error: any) {
      console.error("Error creating screen permission:", error);
      res.status(500).json({ message: "Failed to create screen permission", error: error?.message });
    }
  });

  app.patch("/api/admin/screen-permissions/:id", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const validation = insertScreenPermissionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      const permission = await storage.updateScreenPermission(req.params.id, validation.data);
      if (!permission) {
        return res.status(404).json({ message: "Screen permission not found" });
      }
      res.json(permission);
    } catch (error: any) {
      console.error("Error updating screen permission:", error);
      res.status(500).json({ message: "Failed to update screen permission", error: error?.message });
    }
  });

  app.delete("/api/admin/screen-permissions/:id", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteScreenPermission(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Screen permission not found" });
      }
      res.json({ message: "Screen permission deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting screen permission:", error);
      res.status(500).json({ message: "Failed to delete screen permission", error: error?.message });
    }
  });

  // User permission override routes (Super Admin + Company Admin for their org users)
  app.get("/api/admin/user-permission-overrides", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { userId, screenId } = req.query;
      
      // Company admins can only see overrides for users in their organization
      if (!canAccessAllData(user) && userId) {
        const targetUser = await storage.getUser(userId as string);
        if (targetUser && targetUser.organizationId !== user.organizationId) {
          return res.status(403).json({ message: "Cannot access other organization's users" });
        }
      }
      
      const overrides = await storage.getUserPermissionOverrides(
        userId as string | undefined, 
        screenId as string | undefined
      );
      
      // Filter by org for company admins
      if (!canAccessAllData(user)) {
        const filteredOverrides = overrides.filter(o => o.organizationId === user.organizationId);
        return res.json(filteredOverrides);
      }
      
      res.json(overrides);
    } catch (error: any) {
      console.error("Error fetching user permission overrides:", error);
      res.status(500).json({ message: "Failed to fetch user permission overrides", error: error?.message });
    }
  });

  app.post("/api/admin/user-permission-overrides", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertUserPermissionOverrideSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      
      // Company admins can only create overrides for users in their organization
      if (!canAccessAllData(user)) {
        const targetUser = await storage.getUser(validation.data.userId);
        if (!targetUser || targetUser.organizationId !== user.organizationId) {
          return res.status(403).json({ message: "Cannot modify permissions for users outside your organization" });
        }
      }
      
      const override = await storage.createUserPermissionOverride({
        ...validation.data,
        organizationId: validation.data.organizationId || user.organizationId,
        createdBy: user.id
      });
      res.status(201).json(override);
    } catch (error: any) {
      console.error("Error creating user permission override:", error);
      res.status(500).json({ message: "Failed to create user permission override", error: error?.message });
    }
  });

  app.patch("/api/admin/user-permission-overrides/:id", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Verify ownership
      const existing = await storage.getUserPermissionOverrideById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Override not found" });
      }
      
      if (!canAccessAllData(user) && existing.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "Cannot modify overrides outside your organization" });
      }
      
      const validation = insertUserPermissionOverrideSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      
      const override = await storage.updateUserPermissionOverride(req.params.id, validation.data);
      res.json(override);
    } catch (error: any) {
      console.error("Error updating user permission override:", error);
      res.status(500).json({ message: "Failed to update user permission override", error: error?.message });
    }
  });

  app.delete("/api/admin/user-permission-overrides/:id", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      
      // Verify ownership
      const existing = await storage.getUserPermissionOverrideById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Override not found" });
      }
      
      if (!canAccessAllData(user) && existing.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "Cannot delete overrides outside your organization" });
      }
      
      await storage.deleteUserPermissionOverride(req.params.id);
      res.json({ message: "Override deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user permission override:", error);
      res.status(500).json({ message: "Failed to delete user permission override", error: error?.message });
    }
  });

  // Organization permission override routes (Super Admin only)
  app.get("/api/admin/organization-permission-overrides", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const { organizationId, screenId } = req.query;
      const overrides = await storage.getOrganizationPermissionOverrides(
        organizationId as string | undefined, 
        screenId as string | undefined
      );
      res.json(overrides);
    } catch (error: any) {
      console.error("Error fetching organization permission overrides:", error);
      res.status(500).json({ message: "Failed to fetch organization permission overrides", error: error?.message });
    }
  });

  app.post("/api/admin/organization-permission-overrides", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const user = req.user as User;
      const validation = insertOrganizationPermissionOverrideSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      
      const override = await storage.createOrganizationPermissionOverride({
        ...validation.data,
        createdBy: user.id
      });
      res.status(201).json(override);
    } catch (error: any) {
      console.error("Error creating organization permission override:", error);
      res.status(500).json({ message: "Failed to create organization permission override", error: error?.message });
    }
  });

  app.patch("/api/admin/organization-permission-overrides/:id", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const validation = insertOrganizationPermissionOverrideSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      
      const override = await storage.updateOrganizationPermissionOverride(req.params.id, validation.data);
      if (!override) {
        return res.status(404).json({ message: "Override not found" });
      }
      res.json(override);
    } catch (error: any) {
      console.error("Error updating organization permission override:", error);
      res.status(500).json({ message: "Failed to update organization permission override", error: error?.message });
    }
  });

  app.delete("/api/admin/organization-permission-overrides/:id", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteOrganizationPermissionOverride(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Override not found" });
      }
      res.json({ message: "Override deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting organization permission override:", error);
      res.status(500).json({ message: "Failed to delete organization permission override", error: error?.message });
    }
  });

  // Effective permissions endpoint - get resolved permissions for a user
  app.get("/api/admin/effective-permissions/:userId/:screenCode", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const user = req.user as User;
      const { userId, screenCode } = req.params;
      
      // Company admins can only check permissions for users in their organization
      if (!canAccessAllData(user)) {
        const targetUser = await storage.getUser(userId);
        if (!targetUser || targetUser.organizationId !== user.organizationId) {
          return res.status(403).json({ message: "Cannot check permissions for users outside your organization" });
        }
      }
      
      const permissions = await storage.getEffectivePermissions(userId, screenCode);
      if (!permissions) {
        return res.status(404).json({ message: "User or screen not found" });
      }
      res.json(permissions);
    } catch (error: any) {
      console.error("Error fetching effective permissions:", error);
      res.status(500).json({ message: "Failed to fetch effective permissions", error: error?.message });
    }
  });

  // Roles list for permission assignment (accessible to company_admin and super_admin)
  app.get("/api/admin/roles-for-permissions", isAuthenticated, requireRole(["company_admin", "super_admin"]), async (req: any, res) => {
    try {
      const result = await storage.query(`SELECT id, name, code, category, description, is_active FROM roles WHERE is_active = true ORDER BY category, name`);
      res.json(result.rows || []);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles", error: error?.message });
    }
  });

  // ========== Medical Instructions Dictionary Routes ==========
  
  app.get("/api/medical-instructions", isAuthenticated, async (req: any, res) => {
    try {
      const { category } = req.query;
      const instructions = await storage.getMedicalInstructions(category as string);
      res.json(instructions);
    } catch (error: any) {
      console.error("Error fetching medical instructions:", error);
      res.status(500).json({ message: "Failed to fetch medical instructions", error: error?.message });
    }
  });

  app.post("/api/medical-instructions", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertMedicalInstructionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      
      const instruction = await storage.createMedicalInstruction(validation.data);
      res.status(201).json(instruction);
    } catch (error: any) {
      console.error("Error creating medical instruction:", error);
      res.status(500).json({ message: "Failed to create medical instruction", error: error?.message });
    }
  });

  app.patch("/api/medical-instructions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertMedicalInstructionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error });
      }
      
      const instruction = await storage.updateMedicalInstruction(req.params.id, validation.data);
      if (!instruction) {
        return res.status(404).json({ message: "Medical instruction not found" });
      }
      res.json(instruction);
    } catch (error: any) {
      console.error("Error updating medical instruction:", error);
      res.status(500).json({ message: "Failed to update medical instruction", error: error?.message });
    }
  });

  app.delete("/api/medical-instructions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteMedicalInstruction(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Medical instruction not found" });
      }
      res.json({ message: "Medical instruction deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting medical instruction:", error);
      res.status(500).json({ message: "Failed to delete medical instruction", error: error?.message });
    }
  });

  // ========== Doctor Pharma Commitments ==========
  app.get("/api/doctor-pharma-commitments", isAuthenticated, async (req: any, res) => {
    try {
      const { doctorId, pharmaCompanyId } = req.query;
      const commitments = await storage.getDoctorPharmaCommitments(
        doctorId as string | undefined, 
        pharmaCompanyId as string | undefined
      );
      res.json(commitments);
    } catch (error: any) {
      console.error("Error fetching doctor pharma commitments:", error);
      res.status(500).json({ message: "Failed to fetch commitments", error: error?.message });
    }
  });

  app.post("/api/doctor-pharma-commitments", isAuthenticated, async (req: any, res) => {
    try {
      // In a real app, we'd validate using insertDoctorPharmaCommitmentSchema
      const commitment = await storage.createDoctorPharmaCommitment({
        ...req.body,
        createdBy: req.user.id
      });
      res.status(201).json(commitment);
    } catch (error: any) {
      console.error("Error creating commitment:", error);
      res.status(500).json({ message: "Failed to create commitment", error: error?.message });
    }
  });

  app.patch("/api/doctor-pharma-commitments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const commitment = await storage.updateDoctorPharmaCommitment(req.params.id, req.body);
      if (!commitment) {
        return res.status(404).json({ message: "Commitment not found" });
      }
      res.json(commitment);
    } catch (error: any) {
      console.error("Error updating commitment:", error);
      res.status(500).json({ message: "Failed to update commitment", error: error?.message });
    }
  });

  app.delete("/api/doctor-pharma-commitments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteDoctorPharmaCommitment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Commitment not found" });
      }
      res.json({ message: "Commitment deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting commitment:", error);
      res.status(500).json({ message: "Failed to delete commitment", error: error?.message });
    }
  });

  // ==========================================
  // Super Admin: SaaS Modules Management
  // ==========================================

  // Get all companies
  app.get("/api/companies", requireSuperAdmin, async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies", error: error?.message });
    }
  });

  // Get all available SaaS modules
  app.get("/api/admin/modules", requireSuperAdmin, async (req, res) => {
    try {
      const modules = await storage.getAllModules();
      res.json(modules);
    } catch (error: any) {
      console.error("Error fetching SaaS modules:", error);
      res.status(500).json({ message: "Failed to fetch modules", error: error?.message });
    }
  });

  // Get active modules for a specific company
  app.get("/api/admin/companies/:companyId/modules", requireSuperAdmin, async (req, res) => {
    try {
      const companyModules = await storage.getCompanyModules(req.params.companyId);
      res.json(companyModules);
    } catch (error: any) {
      console.error("Error fetching company modules:", error);
      res.status(500).json({ message: "Failed to fetch company modules", error: error?.message });
    }
  });

  // Toggle a module for a company
  app.post("/api/admin/companies/:companyId/modules", requireSuperAdmin, async (req, res) => {
    try {
      const { moduleId, status } = req.body;
      if (!moduleId || !status) {
        return res.status(400).json({ message: "moduleId and status are required" });
      }
      const updated = await storage.toggleCompanyModule(req.params.companyId, moduleId, status);
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling company module:", error);
      res.status(500).json({ message: "Failed to toggle module", error: error?.message });
    }
  });

  // ==========================================
  // Client: Fetch Active SaaS Modules
  // ==========================================
  app.get("/api/modules", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = req.user.companyId || req.user.organizationId;
      if (!companyId) {
         // Super admins might not have a companyId, return all modules if they want, or empty
         if (req.user.role === 'super_admin') {
            const allModules = await storage.getAllModules();
            return res.json(allModules.map(m => ({ moduleId: m.id, status: 'active' })));
         }
         return res.json([]);
      }
      const companyModules = await storage.getCompanyModules(companyId);
      res.json(companyModules.filter(m => m.status === 'active'));
    } catch (error: any) {
      console.error("Error fetching user modules:", error);
      res.status(500).json({ message: "Failed to fetch active modules", error: error?.message });
    }
  });


  // Catch-all 404 handler for undefined API routes
  // This prevents Vite's SPA middleware from serving HTML for non-existent API endpoints
  app.all("/api/*", (req, res) => {
    res.status(404).json({ 
      message: "API endpoint not found",
      code: "ENDPOINT_NOT_FOUND",
      path: req.path,
      method: req.method
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
