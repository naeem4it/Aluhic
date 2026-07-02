# Alhuic - Medical Representative Sales Tracker & Hospital/Clinic Management System

## Overview
Alhuic is a comprehensive full-stack web application designed to enhance efficiency and data-driven decisions for medical sales forces and healthcare facilities. It features a **Medical Representative Sales Tracker** for sales activity management, performance analysis, and reporting, and a **Hospital/Clinic Management System** for patient and facility operations. The system includes integrated HR, Payroll, and Accounting modules, multi-tenant capabilities, and AI-powered insights across various domains. Its core purpose is to provide a unified platform for managing medical sales and healthcare operations with robust security and offline functionality.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **Routing**: Wouter.
- **State Management**: TanStack Query for server state, React hooks for local state.
- **UI Components**: Shadcn UI (Radix UI primitives) with Tailwind CSS, following Material Design 3 and mobile-first responsive layouts.
- **Form Handling**: React Hook Form with Zod schema validation.
- **Design System**: Custom CSS variables, light/dark themes, Inter and Roboto Mono fonts, consistent spacing.

### Backend Architecture
- **Framework**: Express.js with TypeScript on Node.js.
- **API Design**: RESTful API endpoints.
- **Request Handling**: Middleware for JSON parsing, session management, and logging.

### Authentication & Authorization
- **Authentication**: Passport.js Local Strategy (email/password), server-side sessions (PostgreSQL, `connect-pg-simple`), Bcrypt hashing.
- **User Roles**: `user`, `company_admin`, `super_admin`.
- **User Types**: `individual`, `company`, `super_admin`.
- **Access Control**: Comprehensive Role-Based Access Control (RBAC) with middleware chain (`isAuthenticated → requireActiveSubscription → requireSubscriptionTier → requireRole`).
- **Email System**: Token-based email verification and password reset.

### Data Storage
- **Database**: PostgreSQL (Neon serverless driver).
- **ORM**: Drizzle ORM for type-safe queries and schema migrations (Drizzle Kit).
- **Schema Design**: Extensive schema covering sales, healthcare, HR, payroll, accounts, and authentication.

### Key Architectural Patterns
- **Type Safety**: End-to-end with TypeScript and shared Zod schemas.
- **API Client**: Centralized, authenticated API request function.
- **Mobile-First Design**: Optimized for field use.
- **Multi-Tenant System**: Role-based access controls with data isolation for multiple organizations.
- **Offline Capability**: Service Worker (network-first/cache-first) and IndexedDB for offline data storage and background sync.
- **Comprehensive Audit Logging**: Immutable logging for all sensitive operations.

### Person Master Architecture
All identities in the system are stored in the `persons` table as the single source of truth. Role associations are managed via the `personContexts` table.

- **Identity Entry Points**: When doctors, users, or employees are created, a person entry is created in `persons` table first
- **Role Assignment**: `personContexts` links persons to organizations with specific roles (doctor, mr, admin, front_desk, staff, etc.)
- **Unified Identity**: The same person can have multiple roles across different organizations while maintaining a single identity record
- **Data Flow**:
  1. Data enters `persons` table (firstName, lastName, CNIC, phone, email)
  2. Role assigned via `personContexts` (roleType, organizationId, facilityId, designation)
  3. Role-specific details in domain tables linked by `personId` (e.g., healthcare_doctors.personId)
- **Listing by Role**: Use `/api/persons/by-role/:roleType` to get persons filtered by role and organization
- **Person Search**: Use `/api/persons/search-with-roles` to search persons with their role information

### Facility Department Management
Departments are now managed at the facility level (not organization level) with full CRUD support:

- **API Routes**:
  - `GET /api/healthcare/facilities/:facilityId/departments` - List departments for a facility
  - `POST /api/healthcare/facilities/:facilityId/departments` - Create department
  - `PATCH /api/healthcare/departments/:id` - Update department
  - `DELETE /api/healthcare/departments/:id` - Delete department
- **Security**: All routes enforce multi-tenant isolation via organizationId checks with `canAccessAllData()` override for super admins
- **Validation**: POST/PATCH routes use Zod schema validation (`insertFacilityDepartmentSchema`)
- **Hierarchy**: Departments can have parent departments for nested structure (parentId field)

### Department Roles (Phase 1.4)
Department roles link roles to departments with custom permission overrides:

- **Database Schema**: `departmentRoles` table with:
  - `departmentId`: Links to facility department
  - `roleId`: Links to role definition
  - `defaultPermissions`: JSON permission overrides for this department-role
  - `maxPositions`/`currentPositions`: Staffing capacity tracking
- **PersonContext Integration**: `personContexts.departmentRoleId` links persons to specific department-role assignments
- **API Routes**:
  - `GET /api/healthcare/departments/:departmentId/roles` - List roles in department
  - `POST /api/healthcare/departments/:departmentId/roles` - Create department role
  - `PATCH /api/healthcare/department-roles/:id` - Update department role
  - `DELETE /api/healthcare/department-roles/:id` - Delete department role
- **Validation**: POST/PATCH routes use Zod schema validation (`insertDepartmentRoleSchema`)

### MR Analytics (Phase 4)
Medical Representative analytics for doctor visits and sales performance:

- **Visit Analytics Endpoint**: `GET /api/mr/visit-analytics`
  - Total visits, completed visits, agreements reached
  - Conversion rate calculation
  - Average visit duration
  - Top visited doctors with visit counts and agreement rates
  - Date range filtering (startDate, endDate params)
  
- **Sales Performance Endpoint**: `GET /api/mr/sales-performance`
  - Total sales, quantity, and revenue
  - Top selling products
  - Sales trend by date
  - Date range filtering (startDate, endDate params)

- **Access Control**:
  - MRs see only their own data
  - Company admins see all MR data within their organization
  - Super admins see all data

- **MR Analytics Dashboard**:
  - **Route**: `/admin/mr-analytics`
  - **Access**: `user`, `medical_rep`, `company_admin`, `super_admin` roles
  - **Features**: Summary cards, Doctor Visits tab, Sales Performance tab, date filtering

### Feature Specifications
- **Medical Representative Sales Tracker**: Call KPI tracking, expenses management, dashboard metrics, advanced sales reports, doctor visit tracking (with GPS), doctor/product management, sales entry, lead management, and MR profile management.
- **Hospital/Clinic Management System**: Facility management, doctor management (with availability and agreement types), patient management (vitals, consultations, prescriptions, test reports), appointment & queue management, payment processing, specialized terminal UIs, OPD workflow with status tracking, Pharmacy dispensing, IPD admission/ward/bed management, Operating Theatre (OT) scheduling with case management, and Insurance Claims processing with provider/policy management.
- **HR/Payroll/Accounts Module**: Comprehensive HR (attendance, shifts, salary structures), Payroll (workflow, payslips, tax compliance), and Accounts (chart of accounts, journal entries, ledger) functionalities.
- **Multi-Tenant Healthcare Platform**: Centralized identity (Person Master), employment tracking (PersonContext), Queue Management System, Lab Module, Medical Store/Pharmacy module, and Super Admin-controlled data governance.
- **AI-Powered Insights**: 21 intelligent features across Healthcare, Sales/MR, Inventory & Supply Chain, Marketing & Engagement, and Analytics & Intelligence.
- **Super Admin Management**: Dedicated interface for organization, subscription, user management, and audit logging. Includes user creation from Person Master with all role options.
- **User Creation from Person Master**: Super admins can create user accounts directly from the Person Management page. When creating a user from a person, the firstName/lastName are auto-populated. All 28+ roles are available (Healthcare, Laboratory, Pharmacy, Sales, Administration, System). Users can be assigned to companies/facilities with optional super admin privileges.
- **Employee Invitation System**: Role-based employee onboarding with token-based invitations.
- **UI/UX**: Dark theme, vibrant color palette, custom app icon, horizontal scroll for mobile navigation, responsive layouts.

## External Dependencies

### Third-Party Services
- **Neon Database**: PostgreSQL serverless database.
- **Gmail**: For transactional email services.

### Key Libraries
- **Frontend**: `@tanstack/react-query`, `react-hook-form`, `zod`, `recharts`, `date-fns`, `jsPDF`, `xlsx`, `wouter`, `@radix-ui/*`, `tailwindcss`, `class-variance-authority`.
- **Backend**: `drizzle-orm`, `passport`, `express-session`, `connect-pg-simple`.

## Master Data Architecture

### Global Core Masters (No Org Isolation)
- **Medical Professions**: 18 categories (Doctor, Nurse, Pharmacist, etc.) with licensing requirements
- **Qualifications**: 12 degrees (MBBS, FCPS, MCPS, BDS, etc.) with certifying bodies
- **Vital Types**: 11 standard vitals with normal/critical ranges (BP, Pulse, Temp, SpO2, etc.)
- **Sample Types**: 10 lab sample types with collection instructions (Blood, Serum, Urine, etc.)
- **Diagnoses (ICD-10)**: 20 common conditions across respiratory, cardiovascular, endocrine categories
- **Payment Modes**: 6 payment methods (Cash, Card, UPI, Bank Transfer, Cheque, Insurance)
- **Insurance Companies**: 8 major Pakistani insurers (State Life, Jubilee, Sehat Sahulat, etc.)

### System Governance Masters
- **Permission Master**: 29 core permissions across OPD, IPD, Lab, Pharmacy, Billing, HR, Payroll modules
- **Audit Event Types**: 16 event types with severity levels and retention policies

### Tenant-Level Masters (Organization/Facility Isolated)
- **Departments**: Facility-specific department hierarchy with cost centers
- **Service Procedures**: Billable services with ICD codes and pricing
- **Leave Types**: 8 standard types (CL, SL, AL, ML, PL, etc.) with policies
- **Tax Master**: Organization-specific tax configurations
- **Clinical Templates**: Customizable prescription/note templates
- **Lab Tests**: Organization-defined test catalog with TAT and ranges
- **Lab Equipment**: Facility equipment with calibration tracking
- **Medicine Batches**: Inventory batch tracking with expiry management
- **Doctor CRM Profiles**: Sales/MR doctor engagement tracking
- **Product Promotions**: Campaign management with KPIs
- **Sales Targets**: Period-based target tracking per role/territory

### Master Data Admin UI
- **Route**: `/master-data`
- **Access**: `company_admin`, `super_admin` roles
- **Features**: Search, filter, CRUD operations for all master data categories

### Pharmaceutical Cross-Organization Analytics (Phase 4)
Pharma companies can track prescription and sales data for their products across all healthcare organizations:

- **Products Enhanced for Pharma**:
  - `organizationId`: Links product to pharma company
  - `productCode`: Unique pharma product identifier
  - `genericName`: Generic drug name (e.g., "Paracetamol")
  - `saltComposition`: Active pharmaceutical ingredients
  - `mrp`: Maximum retail price
  - `strength`, `packSize`, `dosageForm`: Product details

- **Cross-Org Analytics Endpoints**:
  - `GET /api/pharma/prescription-analytics`: Aggregates prescription data for owned products across all organizations
  - `GET /api/pharma/sales-analytics`: Aggregates sales data for owned products across all organizations
  - Both endpoints return only aggregate counts (no raw prescription/sales details)

- **Security Model**:
  - Strict product ownership scoping: company_admins only see products of their organization
  - Cross-org aggregation: Queries all prescriptions/sales but filters by owned productIds only
  - Multi-tenant isolation maintained for non-admin data

- **Pharma Analytics Dashboard**:
  - **Route**: `/admin/pharma-analytics`
  - **Access**: `company_admin`, `super_admin` roles
  - **Features**: Summary cards (Total Prescriptions, Units Prescribed, Total Sales, Revenue), Product-level breakdown tables, Date range filtering for sales