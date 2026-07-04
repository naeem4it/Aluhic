import { db } from "./server/db";
import { sql } from "drizzle-orm";
import { modules } from "./shared/schema";

const initialModules = [
  { id: "hcm_opd", name: "Outpatient Department (OPD)", description: "OPD Workflow, Fast OPD, Patient Registration", category: "Hospital/Clinic", basePrice: "49.99" },
  { id: "hcm_ipd", name: "Inpatient Department (IPD)", description: "IPD Management, Ward Manager, Bed Tracking", category: "Hospital/Clinic", basePrice: "99.99" },
  { id: "hcm_ot", name: "Operation Theater Management", description: "OT Scheduling, Surgery Logs", category: "Hospital/Clinic", basePrice: "79.99" },
  { id: "hcm_frontdesk", name: "Appointment & Queue Management", description: "Front Desk Terminal, Patient Queue", category: "Hospital/Clinic", basePrice: "29.99" },
  { id: "pms_core", name: "Prescription Management System", description: "Doctor Terminal, EMR, Notes, E-Prescriptions", category: "Clinical Services", basePrice: "59.99" },
  { id: "pms_analytics", name: "Doctor Analytics Dashboard", description: "Analytics and Visit statistics for Doctors", category: "Clinical Services", basePrice: "19.99" },
  { id: "pharmacy_dispensing", name: "Pharmacy Management", description: "Pharmacy workflow, Dispensing, Pharmacist Dashboard", category: "Pharmacy/Lab", basePrice: "69.99" },
  { id: "lis_core", name: "Laboratory Information System", description: "Sample Tracking, Test Results, Lab Technician workflow", category: "Pharmacy/Lab", basePrice: "89.99" },
  { id: "inventory_core", name: "Inventory Management", description: "Global Inventory, Supply Chain, Stock Alerts", category: "Pharmacy/Lab", basePrice: "49.99" },
  { id: "pharma_crm", name: "Pharma CRM & Sales", description: "MR Profiles, Sales Leads, Doctor Visit tracking", category: "Pharma CRM", basePrice: "129.99" },
  { id: "pharma_analytics", name: "Pharma Sales Analytics", description: "Call KPIs, MR Performance, Sales Dashboards", category: "Pharma CRM", basePrice: "89.99" },
  { id: "finance_billing", name: "Centralized Billing", description: "Billing Management, Invoices, Accounts Dashboard", category: "Finance", basePrice: "79.99" },
  { id: "finance_insurance", name: "Insurance Claims", description: "Insurance Claims Processing, Coverage Verification", category: "Finance", basePrice: "49.99" },
  { id: "hr_core", name: "HR Core", description: "Employee Management, Invitations, Person Directory", category: "HR", basePrice: "39.99" },
  { id: "hr_payroll", name: "Payroll Management", description: "Payroll Dashboard, Doctor Payroll, Expenditures", category: "HR", basePrice: "59.99" },
  { id: "sys_audit", name: "Audit & Compliance", description: "System Audit Logs, Advanced Permission Management", category: "System", basePrice: "29.99" },
  { id: "ai_insights", name: "AI Health Insights", description: "AI-powered analytics and clinical insights", category: "Advanced", basePrice: "149.99" }
];

async function seed() {
  console.log("Setting up SaaS Module Architecture...");

  try {
    // 1. Create modules table
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS modules (
        id VARCHAR PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        base_price DECIMAL(10, 2) DEFAULT '0',
        is_active BOOLEAN NOT NULL DEFAULT true
      );
    `));
    console.log("✅ modules table checked/created.");

    // 2. Create company_modules table
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS company_modules (
        company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        module_id VARCHAR NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'active',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        PRIMARY KEY (company_id, module_id)
      );
    `));
    console.log("✅ company_modules table checked/created.");

    // 3. Seed initial modules
    console.log(`Seeding ${initialModules.length} modules...`);
    
    for (const mod of initialModules) {
      await db.execute(sql.raw(`
        INSERT INTO modules (id, name, description, category, base_price, is_active)
        VALUES (
          '${mod.id}', 
          '${mod.name.replace(/'/g, "''")}', 
          '${mod.description.replace(/'/g, "''")}', 
          '${mod.category.replace(/'/g, "''")}', 
          ${mod.basePrice}, 
          true
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          base_price = EXCLUDED.base_price;
      `));
    }
    
    console.log("✅ SaaS modules seeded successfully!");
    console.log("You can now build out the Module Subscription UI for Super Admins.");
    
  } catch (err: any) {
    console.error("❌ Seeding failed:", err.message);
  } finally {
    process.exit(0);
  }
}

seed();
