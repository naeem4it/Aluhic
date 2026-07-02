# Aluhoc - Application Workflow Documentation

## Overview
Aluhoc is a multi-tenant Healthcare Management SaaS Platform with comprehensive modules for Medical Representative Sales Tracking and Hospital/Clinic Management. This document outlines the workflow, menus, and functionalities available for each user role.

---

## Role: Super Admin

### Dashboard
When Super Admin logs in, they see the **Super Admin Dashboard** displaying:
- Total organizations, users, and revenue metrics
- Subscription overview (active, trial, expired)
- Recent activity logs
- System health indicators

### Available Menus

#### Sales Tracker Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| Dashboard | `/` | Super Admin overview dashboard | View all organizations, users, subscriptions, and system metrics |
| Entry | `/entry` | Sales data entry | Create new sales entries with product, quantity, and doctor details |
| Doctors | `/doctors` | Doctor management | Add/edit/view doctors, their specialties, and visit history |
| Products | `/products` | Product catalog | Manage pharmaceutical products, pricing, and stock information |
| KPI | `/kpi` | Key Performance Indicators | Track call targets, achievement rates, and performance metrics |
| Visits | `/visits` | Visit tracking | Log and review doctor visits with GPS location |
| Expenses | `/expenses` | Expense management | Submit and approve travel/field expenses |
| Reports | `/reports` | Reporting module | Generate sales, visit, and performance reports |
| Samples | `/samples` | Sample distribution | Track sample distribution to doctors |
| Visit Requests | `/visit-requests` | Visit scheduling | Manage MR visit requests to doctors |
| Leads | `/sales-leads` | Lead management | Track sales leads from doctor interest |
| Performance | `/performance` | Performance analytics | View MR performance metrics and rankings |
| AI Insights | `/ai-insights` | AI-powered analytics | Predictive insights for sales and healthcare |
| Inventory | `/inventory` | Inventory tracking | View stock levels across locations |
| Warehouses | `/inventory/warehouses` | Warehouse management | Manage multiple warehouse locations |

#### Healthcare Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| Facilities | `/healthcare/facilities` | Facility management | Add/edit hospitals, clinics, and their details |
| Front Desk | `/healthcare/frontdesk` | Front desk terminal | Patient registration, appointments, queue management |
| Doc Desk | `/healthcare/doctor-frontdesk` | Doctor's front desk | Manage doctor schedules and patient flow |
| Doctor | `/healthcare/doctor-terminal` | Doctor terminal | Patient consultations, prescriptions, notes |
| Tests | `/healthcare/test-terminal` | Lab test terminal | Order and manage diagnostic tests |
| Payroll | `/healthcare/payroll` | Doctor payroll | Process doctor salaries and commissions |
| Expenditures | `/healthcare/expenditures` | Expense tracking | Track doctor-related expenditures |
| Doctor Mgmt | `/healthcare/doctors-mgmt` | Doctor management | Manage facility doctors, schedules, agreements |
| Queue | `/healthcare/queue` | Queue management | Configure and monitor patient queues |
| OPD | `/healthcare/opd` | Outpatient department | Manage OPD workflow and patient encounters |
| Pharmacy | `/healthcare/pharmacy` | Pharmacy dispensing | Dispense medications, manage stock |
| Billing | `/healthcare/billing` | Billing & invoices | Generate bills, process payments |
| IPD | `/healthcare/ipd` | Inpatient department | Manage admissions, beds, ward transfers |
| Operating Theatre | `/healthcare/ot` | OT scheduling | Schedule surgeries, manage OT cases |
| Insurance | `/healthcare/insurance` | Insurance claims | Process and track insurance claims |

#### Administration Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| MR Profiles | `/mr-profiles` | Medical Rep profiles | Manage MR details and territories |
| Accounts | `/admin/accounts` | User accounts | Manage all user accounts system-wide |
| Settings | `/settings` | System settings | Configure application settings |
| Subscriptions | `/admin/subscriptions` | Subscription management | View and manage organization subscriptions |
| Pharma Mgmt | `/admin/pharma-companies` | Pharma company management | Manage pharmaceutical companies |
| Super Admin | `/admin/super-admin` | Super admin panel | Advanced system administration |
| Invitations | `/admin/invitations` | Employee invitations | Send and manage employee invites |
| Person Master | `/admin/person-master` | Centralized identity | Manage person identities across organizations |
| Audit Logs | `/admin/audit-logs` | Audit trail | View system audit logs |

#### HR Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| HR | `/hr` | Human Resources | Employee management, attendance, shifts |
| Payroll | `/payroll` | Payroll processing | Process employee salaries, deductions |
| Accounts | `/accounts` | Accounting module | Chart of accounts, journal entries |

### Special Feature: "View As"
Super Admin can use the **Role Selector** to preview the application as any other role. When viewing as another role:
- Dashboard switches to that role's dashboard
- Menus update to show only that role's accessible items
- An orange banner indicates "Viewing as [Role Name]"

---

## Role: Hospital/Clinic Admin

### Dashboard
The **Hospital Admin Dashboard** shows:
- Today's appointments and patient count
- Revenue metrics for the day/month
- Active OPD/IPD cases
- Staff attendance overview

### Available Menus

#### Healthcare Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| Facilities | `/healthcare/facilities` | Facility overview | View and manage hospital/clinic details |
| Payroll | `/healthcare/payroll` | Staff payroll | Process doctor and staff payments |
| Expenditures | `/healthcare/expenditures` | Expense tracking | Track operational expenses |
| Doctor Mgmt | `/healthcare/doctors-mgmt` | Doctor management | Manage employed and visiting doctors |
| Queue | `/healthcare/queue` | Queue configuration | Set up and monitor patient queues |
| OPD | `/healthcare/opd` | OPD management | View OPD workflow and patient status |
| Pharmacy | `/healthcare/pharmacy` | Pharmacy module | Manage pharmacy inventory and dispensing |
| Billing | `/healthcare/billing` | Billing system | Generate bills, track payments |
| IPD | `/healthcare/ipd` | IPD management | Manage beds, admissions, discharges |
| Operating Theatre | `/healthcare/ot` | OT scheduling | Schedule and manage surgeries |
| Insurance | `/healthcare/insurance` | Insurance processing | Submit and track insurance claims |

#### Administration Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| Settings | `/settings` | Hospital settings | Configure facility settings |
| Invitations | `/admin/invitations` | Staff invitations | Invite staff members to the system |
| Person Master | `/admin/person-master` | Patient registry | Manage patient identities |

#### HR Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| HR | `/hr` | HR management | Employee records, attendance |
| Payroll | `/payroll` | Payroll processing | Process salaries |
| Accounts | `/accounts` | Accounting | Financial transactions, ledgers |

---

## Role: Doctor

### Dashboard
The **Doctor Dashboard** displays:
- Today's appointments
- Pending consultations
- Recent patient list
- Visit requests from Medical Reps

### Available Menus

#### Healthcare Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| Facilities | `/healthcare/facilities` | My facilities | View associated hospitals/clinics |
| Doctor | `/healthcare/doctor-terminal` | Consultation terminal | Conduct patient consultations |
| OPD | `/healthcare/opd` | OPD patients | View and manage OPD patients |
| Visit Requests | `/visit-requests` | MR visit requests | Review and respond to MR visit requests |
| AI Insights | `/ai-insights` | AI recommendations | View AI-powered patient insights |
| Expenditures | `/healthcare/expenditures` | Expense records | View doctor-related expenses |

### Doctor Terminal Features
When clicking **Doctor** menu:
- View patient queue
- Start consultation
- Record vitals and symptoms
- Write prescriptions
- Order lab tests
- Add clinical notes
- Complete encounter

---

## Role: Front Desk (doctor_frontdesk)

### Dashboard
The **Front Desk Dashboard** shows:
- Current queue status
- Today's appointments
- Patient check-ins
- Pending payments

### Available Menus

#### Healthcare Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| Facilities | `/healthcare/facilities` | Facility info | View facility details |
| Front Desk | `/healthcare/frontdesk` | Main terminal | Patient registration and check-in |
| Doc Desk | `/healthcare/doctor-frontdesk` | Doctor support desk | Assist with doctor scheduling |
| Tests | `/healthcare/test-terminal` | Lab test management | Order and track lab tests |
| OPD | `/healthcare/opd` | OPD workflow | Manage patient flow |
| Queue | `/healthcare/queue` | Queue management | Call patients, manage queues |
| Pharmacy | `/healthcare/pharmacy` | Pharmacy | Assist with medication dispensing |
| Billing | `/healthcare/billing` | Payment collection | Generate bills, collect payments |
| IPD | `/healthcare/ipd` | Admissions | Process patient admissions |
| Operating Theatre | `/healthcare/ot` | OT coordination | Assist with surgery scheduling |
| Insurance | `/healthcare/insurance` | Insurance claims | Submit insurance documents |
| Expenditures | `/healthcare/expenditures` | Expenses | Record facility expenses |
| AI Insights | `/ai-insights` | Smart insights | View operational insights |

### Front Desk Terminal Features
When clicking **Front Desk** menu:
- Register new patients (linked to Person Master)
- Check-in existing patients
- Schedule appointments
- Add patients to queue
- Collect payments
- Print receipts

---

## Role: Medical Representative (rep/medical_rep)

### Dashboard
The **Sales Dashboard** displays:
- Monthly sales targets vs achievement
- Call KPI summary
- Recent visits map
- Top performing products

### Available Menus

#### Sales Tracker Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| Dashboard | `/` | Sales overview | View sales metrics and targets |
| Entry | `/entry` | Sales entry | Record daily sales data |
| Doctors | `/doctors` | Doctor database | Manage doctor contacts |
| Products | `/products` | Product list | View product information |
| KPI | `/kpi` | Call KPI | Track call performance |
| Visits | `/visits` | Visit log | Record doctor visits with GPS |
| Expenses | `/expenses` | Expense claims | Submit travel and allowance claims |
| Reports | `/reports` | Sales reports | Generate personal reports |
| Samples | `/samples` | Sample tracking | Record sample distribution |
| Visit Requests | `/visit-requests` | Appointment requests | Request doctor meetings |
| Leads | `/sales-leads` | Sales leads | Capture and track leads |
| Performance | `/performance` | My performance | View personal metrics |
| AI Insights | `/ai-insights` | Smart suggestions | AI-powered visit recommendations |
| Inventory | `/inventory` | Stock levels | Check product availability |

#### Healthcare Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| Facilities | `/healthcare/facilities` | Healthcare facilities | View hospital/clinic details |
| Expenditures | `/healthcare/expenditures` | Doctor expenses | Track doctor-related spending |

---

## Role: Company Admin (Pharma Company)

### Dashboard
The **Sales Dashboard** with company-wide metrics:
- Team sales performance
- Regional coverage
- Product-wise analysis
- MR performance rankings

### Available Menus

#### Sales Tracker Group
All menus available to Medical Rep, plus:
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| MR Profiles | `/mr-profiles` | MR management | Manage MR team profiles |
| Warehouses | `/inventory/warehouses` | Warehouse network | Manage multiple warehouses |

#### Administration Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| Settings | `/settings` | Company settings | Configure company preferences |
| Invitations | `/admin/invitations` | Employee onboarding | Invite new team members |
| Person Master | `/admin/person-master` | Contact management | Manage doctor/contact identities |

#### HR Group
| Menu | Path | Screen Description | Functionalities |
|------|------|-------------------|-----------------|
| HR | `/hr` | Team HR | Manage employee records |
| Payroll | `/payroll` | Salary processing | Process team salaries |
| Accounts | `/accounts` | Financials | Company accounting |

---

## Role: Payroll Admin

### Dashboard
The **Payroll Admin Dashboard** shows:
- Current payroll cycle status
- Pending payroll approvals
- Salary disbursement summary
- Tax compliance status

### Functionalities
- Process monthly payroll
- Manage salary structures
- Handle deductions and bonuses
- Generate payslips
- Tax compliance reporting

---

# USE CASES BY MODULE

## Sales Tracker Module Use Cases

### Entry (`/entry`)
**Purpose:** Record daily sales transactions for pharmaceutical products

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Record Daily Sales | MR | MR visits a pharmacy and sells products | 1. Click "Add Entry" 2. Select doctor/pharmacy 3. Choose products and quantities 4. Enter sale amount 5. Save entry |
| Bulk Sales Entry | MR | Enter multiple sales from a day's work | 1. Use bulk entry form 2. Add multiple product lines 3. Assign to different doctors 4. Submit all at once |
| Edit Sales Entry | MR/Manager | Correct a mistakenly entered sale | 1. Find entry in list 2. Click edit 3. Modify details 4. Save changes |
| View Sales History | MR | Review past sales for a period | 1. Set date range filter 2. Filter by product/doctor 3. View list with totals |

### Doctors (`/doctors`)
**Purpose:** Manage doctor contacts and relationship information

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Add New Doctor | MR | Met a new doctor during field visit | 1. Click "Add Doctor" 2. Enter name, specialty, clinic address 3. Add contact details 4. Set visit priority 5. Save |
| Update Doctor Details | MR | Doctor moved to new clinic | 1. Search for doctor 2. Click edit 3. Update address/phone 4. Save changes |
| View Doctor Profile | MR | Prepare for upcoming visit | 1. Search doctor by name 2. View full profile 3. See visit history, products discussed, preferences |
| Categorize Doctors | Manager | Segment doctors by potential | 1. Select doctors 2. Assign category (A/B/C) 3. Set visit frequency target |
| Import Doctor List | Admin | Onboard new MR with territory doctors | 1. Download template 2. Fill doctor details 3. Upload CSV file 4. Verify imports |

### Products (`/products`)
**Purpose:** Manage pharmaceutical product catalog

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Add New Product | Admin | Company launches new medicine | 1. Click "Add Product" 2. Enter product name, composition 3. Set pricing, pack size 4. Add therapeutic category 5. Activate product |
| Update Product Price | Admin | Price revision announced | 1. Find product 2. Edit pricing 3. Set effective date 4. Save changes |
| View Product Details | MR | Need product info for doctor | 1. Search product 2. View composition, indications 3. Check current stock 4. See sales trend |
| Discontinue Product | Admin | Product being phased out | 1. Find product 2. Set status to "Discontinued" 3. Update visibility |
| Compare Products | MR | Doctor asking about alternatives | 1. Select multiple products 2. View side-by-side comparison 3. Check therapeutic equivalence |

### KPI (`/kpi`)
**Purpose:** Track call targets and field performance indicators

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Set Monthly Targets | Manager | Beginning of month planning | 1. Select MR or team 2. Set call targets (daily/monthly) 3. Set coverage targets 4. Save targets |
| View Daily Progress | MR | Check performance mid-day | 1. Open KPI dashboard 2. See calls made vs target 3. View remaining doctors to visit |
| Review Team KPI | Manager | Weekly performance review | 1. Select date range 2. View team comparison 3. Identify underperformers 4. Drill into details |
| Export KPI Report | Admin | Prepare management presentation | 1. Set reporting period 2. Select metrics 3. Export to Excel/PDF |
| Track Call Quality | Manager | Assess visit effectiveness | 1. View detailed call metrics 2. Check time spent per visit 3. Review products discussed |

### Visits (`/visits`)
**Purpose:** Log and track doctor visits with location verification

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Log Doctor Visit | MR | Completed a clinic visit | 1. Click "Log Visit" 2. Select doctor 3. Enable GPS (auto-captures location) 4. Record discussion points 5. Add products promoted 6. Save visit |
| Plan Daily Route | MR | Morning planning for field work | 1. View assigned doctors 2. Check locations on map 3. Optimize route 4. Create visit plan |
| View Visit History | MR | Preparing for follow-up visit | 1. Search doctor 2. View past visits 3. See last discussion topics 4. Note pending commitments |
| Verify Field Activity | Manager | Validate MR attendance | 1. View visit log 2. Check GPS coordinates 3. Verify against clinic address 4. Review visit duration |
| Mark Visit as Cancelled | MR | Doctor was unavailable | 1. Log visit attempt 2. Select "Cancelled/Not Met" 3. Add reason 4. Save for records |

### Expenses (`/expenses`)
**Purpose:** Submit and manage field expense claims

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Submit Travel Expense | MR | Claim daily travel allowance | 1. Click "New Expense" 2. Select expense type (travel/food/misc) 3. Enter amount 4. Add receipt photo 5. Submit for approval |
| Approve Expenses | Manager | Process team expense claims | 1. View pending claims 2. Review details and receipts 3. Approve or reject with comments 4. Submit to accounts |
| View Expense Status | MR | Track reimbursement status | 1. Open my expenses 2. Filter by status (pending/approved/paid) 3. View payment date if processed |
| Bulk Expense Entry | MR | Enter week's expenses together | 1. Use bulk entry form 2. Add multiple expense lines 3. Attach receipts 4. Submit batch |
| Expense Report | Admin | Monthly expense analysis | 1. Set date range 2. Filter by team/category 3. View totals 4. Export report |

### Reports (`/reports`)
**Purpose:** Generate sales and activity reports

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Generate Sales Report | Manager | Monthly sales review | 1. Select report type 2. Set date range 3. Choose grouping (product/territory/MR) 4. Generate report 5. Export PDF/Excel |
| View Territory Analysis | Manager | Evaluate market coverage | 1. Select territory 2. View doctor coverage 3. See product penetration 4. Identify gaps |
| Compare Period Performance | Admin | Year-over-year analysis | 1. Select comparison periods 2. Choose metrics 3. View growth/decline 4. Drill into details |
| Doctor Visit Report | MR | Submit weekly report | 1. Select week 2. Auto-generate visit summary 3. Add comments 4. Submit to manager |
| Export to Excel | Manager | Custom data analysis | 1. Select data type 2. Set filters 3. Download Excel file 4. Create custom analysis |

### Samples (`/samples`)
**Purpose:** Track distribution of product samples to doctors

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Record Sample Distribution | MR | Gave samples during visit | 1. During visit logging 2. Add samples section 3. Select product and quantity 4. Record with visit |
| Request Sample Stock | MR | Running low on samples | 1. Click "Request Samples" 2. Select products needed 3. Enter quantities 4. Submit to warehouse |
| View Sample Inventory | MR | Check available samples | 1. Open sample inventory 2. View current stock by product 3. See expiry dates |
| Sample Usage Report | Manager | Track sample ROI | 1. Select period 2. View samples distributed 3. Compare against prescriptions 4. Calculate effectiveness |
| Receive Sample Stock | MR | New samples received from warehouse | 1. Acknowledge receipt 2. Verify quantities 3. Update inventory 4. Sign confirmation |

### Visit Requests (`/visit-requests`)
**Purpose:** Manage appointment requests between MRs and doctors

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Request Doctor Meeting | MR | Schedule appointment with busy doctor | 1. Select doctor 2. Choose preferred date/time 3. Add meeting purpose 4. Submit request |
| Respond to Request | Doctor | MR asked for appointment | 1. View pending requests 2. Check availability 3. Accept with time or suggest alternative 4. Add notes |
| Reschedule Visit | MR | Need to change appointment | 1. Find scheduled visit 2. Click reschedule 3. Propose new time 4. Wait for confirmation |
| View Scheduled Visits | MR | Plan weekly calendar | 1. Open visit requests 2. Filter by status (confirmed) 3. View calendar view 4. Sync with phone calendar |
| Cancel Appointment | Doctor/MR | Unable to meet as planned | 1. Find appointment 2. Click cancel 3. Add reason 4. Notify other party |

### Sales Leads (`/sales-leads`)
**Purpose:** Capture and track sales opportunities from doctor interest

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Capture New Lead | MR | Doctor showed interest in product | 1. Click "Add Lead" 2. Select doctor and product 3. Rate interest level 4. Add next steps 5. Save lead |
| Follow Up on Lead | MR | Continue sales conversation | 1. View my leads 2. Find lead to follow up 3. Log follow-up activity 4. Update status (warm/hot/closed) |
| Convert Lead to Sale | MR | Doctor started prescribing | 1. Open lead 2. Click "Convert" 3. Link to prescription data 4. Mark as won |
| View Lead Pipeline | Manager | Review team opportunities | 1. View all leads 2. Filter by stage 3. See total value 4. Identify coaching needs |
| Lead Analysis | Admin | Measure lead effectiveness | 1. View conversion rates 2. Analyze by product/territory 3. Identify successful patterns |

### Performance (`/performance`)
**Purpose:** View and analyze MR performance metrics

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| View My Performance | MR | Check personal standing | 1. Open performance dashboard 2. View current month metrics 3. Compare against targets 4. See ranking among peers |
| Team Performance Review | Manager | Monthly team assessment | 1. Select team 2. View comparison matrix 3. Identify top performers 4. Find areas needing support |
| Set Performance Goals | Admin | Annual target setting | 1. Define KPI weights 2. Set achievement thresholds 3. Configure incentive slabs 4. Publish to team |
| Performance Trend Analysis | Manager | Track improvement over time | 1. Select MR 2. View 6-month trend 3. Identify patterns 4. Plan interventions |
| Export Performance Data | Admin | Incentive calculation | 1. Set evaluation period 2. Export all metrics 3. Calculate incentives 4. Share with HR |

### AI Insights (`/ai-insights`)
**Purpose:** AI-powered recommendations and predictions

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Get Visit Recommendations | MR | Plan optimal daily visits | 1. Open AI Insights 2. View suggested doctors for today 3. See reasoning (last visit date, potential) 4. Accept recommendations |
| Product Opportunity Analysis | Manager | Identify growth products | 1. View product insights 2. See underperforming territories 3. Get action recommendations |
| Doctor Potential Scoring | MR | Prioritize high-value doctors | 1. View doctor ranking 2. See AI-calculated potential 3. Understand scoring factors |
| Predict Sales Trend | Admin | Forecast next quarter | 1. View predictive analytics 2. See projected sales 3. Identify influencing factors |
| Coverage Gap Analysis | Manager | Find missed opportunities | 1. View coverage insights 2. See unvisited doctors 3. Get prioritized list |

### Inventory (`/inventory`)
**Purpose:** Track product stock levels across locations

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Check Stock Availability | MR | Verify product for order | 1. Search product 2. View available stock 3. Check nearest warehouse 4. See incoming shipments |
| View Low Stock Alerts | Manager | Proactive stock management | 1. Open inventory dashboard 2. View low stock items 3. See reorder suggestions 4. Initiate purchase order |
| Stock Transfer Request | Admin | Move stock between warehouses | 1. Select source warehouse 2. Choose products and quantities 3. Select destination 4. Create transfer order |
| Expiry Management | Admin | Prevent stock wastage | 1. View expiring soon list 2. Prioritize for distribution 3. Create push promotions 4. Track disposal |
| Inventory Valuation | Admin | Financial reporting | 1. Select valuation date 2. View stock by category 3. See total inventory value 4. Export for accounts |

### Warehouses (`/inventory/warehouses`)
**Purpose:** Manage multiple warehouse locations

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Add New Warehouse | Admin | Expand distribution network | 1. Click "Add Warehouse" 2. Enter location details 3. Set capacity 4. Assign manager 5. Activate |
| View Warehouse Stock | Manager | Check specific location | 1. Select warehouse 2. View complete inventory 3. See inbound/outbound history |
| Configure Reorder Levels | Admin | Set auto-replenishment rules | 1. Select warehouse 2. Set minimum stock levels 3. Configure reorder quantities 4. Enable alerts |
| Warehouse Performance | Admin | Evaluate efficiency | 1. View warehouse metrics 2. See order fulfillment rate 3. Track turnaround time 4. Compare locations |

### MR Profiles (`/mr-profiles`)
**Purpose:** Manage Medical Representative team details

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Add New MR | Admin | Onboard new team member | 1. Click "Add MR" 2. Enter personal details 3. Assign territory 4. Set targets 5. Create login |
| Update Territory Assignment | Manager | Realign territories | 1. Select MR 2. Edit territory 3. Reassign doctors 4. Transfer pending leads 5. Save changes |
| View MR Dashboard | Manager | Review individual MR | 1. Select MR 2. View complete profile 3. See performance history 4. Check training records |
| Deactivate MR | Admin | Employee resignation | 1. Find MR 2. Click deactivate 3. Reassign doctors and leads 4. Archive data 5. Remove access |
| MR Training Records | Admin | Track skill development | 1. Select MR 2. View completed trainings 3. Assign new training 4. Track certifications |

---

## Healthcare Module Use Cases

### Facilities (`/healthcare/facilities`)
**Purpose:** Manage hospitals, clinics, and healthcare facility information

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Add New Facility | Admin | Register new hospital | 1. Click "Add Facility" 2. Enter name, type (hospital/clinic) 3. Add address, contact 4. Set operating hours 5. Activate |
| Update Facility Details | Admin | Change operating hours | 1. Find facility 2. Edit details 3. Update timings 4. Save changes |
| View Facility Dashboard | Admin | Overview of operations | 1. Select facility 2. View patient count 3. See revenue metrics 4. Check staff availability |
| Add Department | Admin | Expand facility services | 1. Select facility 2. Add department 3. Assign staff 4. Configure workflows |
| Facility Comparison | Super Admin | Multi-facility analysis | 1. Select facilities 2. Compare metrics 3. View benchmarks 4. Identify best practices |

### Front Desk (`/healthcare/frontdesk`)
**Purpose:** Patient registration, check-in, and appointment management

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Register New Patient | Front Desk | First-time patient arrives | 1. Click "New Patient" 2. Search by CNIC/phone (checks Person Master) 3. If not found, create new person 4. Enter demographics 5. Take photo 6. Issue patient ID |
| Check-in Existing Patient | Front Desk | Returning patient arrives | 1. Search by ID/phone/name 2. Verify identity 3. Update any changed details 4. Mark as arrived |
| Schedule Appointment | Front Desk | Patient calls to book | 1. Search patient 2. Select doctor 3. View available slots 4. Book appointment 5. Send confirmation SMS |
| Add to Doctor Queue | Front Desk | Patient ready to see doctor | 1. Find patient 2. Select doctor's queue 3. Generate token 4. Inform expected wait time |
| Collect Payment | Front Desk | Patient paying bill | 1. Find patient bill 2. Select payment method 3. Collect amount 4. Print receipt 5. Mark as paid |
| Walk-in Patient | Front Desk | Patient without appointment | 1. Register if new 2. Check doctor availability 3. Add to queue 4. Inform wait time |

### Doctor Terminal (`/healthcare/doctor-terminal`)
**Purpose:** Conduct patient consultations and clinical documentation

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Start Consultation | Doctor | Patient enters consultation room | 1. View queue 2. Call next patient 3. Review patient history 4. Start encounter |
| Record Vitals | Doctor/Nurse | Measure patient vitals | 1. During consultation 2. Enter BP, pulse, temperature, weight 3. Add SpO2 if needed 4. Save vitals |
| Document Symptoms | Doctor | Patient describes complaints | 1. Add chief complaint 2. Record history of present illness 3. Note relevant past history |
| Write Prescription | Doctor | Prescribe medications | 1. Search/select medicines 2. Set dosage and duration 3. Add instructions 4. Review drug interactions 5. Finalize prescription |
| Order Lab Tests | Doctor | Need diagnostic tests | 1. Select tests needed 2. Add clinical indication 3. Mark urgency 4. Send to lab |
| Complete Consultation | Doctor | Finish patient visit | 1. Review all entries 2. Add clinical notes 3. Set follow-up if needed 4. Complete encounter 5. Send to billing |
| Refer to Specialist | Doctor | Patient needs specialist care | 1. Create referral 2. Select specialty/doctor 3. Add clinical summary 4. Share relevant history |

### Tests (`/healthcare/test-terminal`)
**Purpose:** Manage laboratory tests and diagnostics

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| View Pending Tests | Lab Tech | Check work queue | 1. Open test terminal 2. View ordered tests 3. Prioritize by urgency 4. Start processing |
| Collect Sample | Lab Tech | Draw blood/collect specimen | 1. Find test order 2. Collect sample 3. Label specimen 4. Mark collection time |
| Enter Test Results | Lab Tech | Results available from analyzer | 1. Find test 2. Enter values 3. Flag abnormal results 4. Submit for verification |
| Verify Results | Lab Supervisor | Quality check before release | 1. View pending verification 2. Review values 3. Check against reference ranges 4. Approve or request retest |
| Print Lab Report | Lab Tech | Patient requesting report | 1. Find completed test 2. Generate report 3. Print with letterhead 4. Record handover |
| Upload External Report | Front Desk | Patient bringing outside reports | 1. Find patient 2. Upload scanned report 3. Tag with test type 4. Link to encounter |

### Queue (`/healthcare/queue`)
**Purpose:** Configure and manage patient queues

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Create Queue | Admin | Set up new doctor queue | 1. Click "New Queue" 2. Select queue type (consultation/lab/pharmacy) 3. Assign to doctor/service 4. Set token prefix 5. Activate |
| Call Next Patient | Doctor/Staff | Summon patient from waiting | 1. Click "Call Next" 2. Patient token displayed on screen 3. Mark patient as "In Service" |
| View Queue Status | Front Desk | Check waiting times | 1. Open queue dashboard 2. See all active queues 3. View current wait times 4. Monitor patient count |
| Skip Patient | Staff | Patient stepped away | 1. Find patient in queue 2. Click "Skip" 3. Patient moves to end 4. Call next patient |
| Priority Queue | Doctor | Mark patient as urgent | 1. Find patient 2. Mark as priority 3. Patient moves to front 4. Staff notified |
| Transfer Queue | Staff | Patient needs different service | 1. Select patient 2. Choose destination queue 3. Transfer 4. Patient gets new token |

### OPD (`/healthcare/opd`)
**Purpose:** Manage outpatient department workflow

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| View OPD Dashboard | Doctor | Morning patient overview | 1. Open OPD 2. View scheduled patients 3. See walk-ins 4. Check previous day pending |
| Track Patient Status | Front Desk | Monitor patient journey | 1. Open OPD tracker 2. View patient statuses (waiting/in-consult/lab/pharmacy) 3. Handle inquiries |
| Complete OPD Visit | Doctor | Patient finished all services | 1. Verify all services complete 2. Review final bill 3. Mark encounter complete 4. Set follow-up if needed |
| OPD Analytics | Admin | Review department performance | 1. View OPD metrics 2. See patient volumes 3. Analyze wait times 4. Identify bottlenecks |
| Follow-up Reminder | System | Patient due for follow-up | 1. Auto-generate reminder 2. Send SMS to patient 3. Pre-schedule appointment slot |

### Pharmacy (`/healthcare/pharmacy`)
**Purpose:** Dispense medications and manage pharmacy inventory

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Dispense Prescription | Pharmacist | Patient presents prescription | 1. Scan/find prescription 2. Review medications 3. Check stock availability 4. Pick medicines 5. Verify with prescription 6. Dispense and counsel |
| Check Drug Interactions | Pharmacist | Multiple medications prescribed | 1. System auto-checks interactions 2. Review warnings 3. Consult doctor if needed 4. Document resolution |
| Substitute Medicine | Pharmacist | Prescribed medicine out of stock | 1. Check alternatives 2. Find therapeutic equivalent 3. Consult doctor for approval 4. Update prescription 5. Dispense alternative |
| Pharmacy Inventory | Pharmacist | Check stock levels | 1. View current stock 2. Check expiry dates 3. Identify low stock items 4. Create reorder list |
| Return Medicine | Pharmacist | Patient returns unused medicine | 1. Check return eligibility 2. Inspect medicine condition 3. Process return 4. Update inventory 5. Refund if applicable |
| Controlled Drug Dispensing | Pharmacist | Dispensing regulated medicine | 1. Verify prescription authorization 2. Check patient ID 3. Record in controlled drug register 4. Get patient signature 5. Dispense |

### Billing (`/healthcare/billing`)
**Purpose:** Generate bills and process payments

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Generate Patient Bill | Front Desk | Patient consultation complete | 1. Find patient encounter 2. View all services rendered 3. Apply pricing 4. Calculate total 5. Generate bill |
| Apply Discount | Front Desk | Authorized discount for patient | 1. Open bill 2. Click "Apply Discount" 3. Select discount type 4. Enter authorization 5. Recalculate total |
| Collect Payment | Cashier | Patient paying bill | 1. Open bill 2. Select payment method 3. If card, process through terminal 4. Collect cash or verify payment 5. Print receipt |
| Partial Payment | Cashier | Patient paying in installments | 1. Open bill 2. Enter partial amount 3. Record payment 4. Generate receipt for amount paid 5. Balance shown as due |
| Insurance Billing | Billing Staff | Patient has insurance coverage | 1. Verify insurance 2. Check covered services 3. Calculate patient portion 4. Generate insurance claim 5. Collect patient co-pay |
| Refund Processing | Supervisor | Service cancelled, refund needed | 1. Find original payment 2. Verify refund eligibility 3. Process refund 4. Print refund receipt 5. Update accounts |
| Bill Inquiry | Front Desk | Patient questions charges | 1. Find patient bill 2. Show itemized breakdown 3. Explain each charge 4. Resolve dispute if any |

### IPD (`/healthcare/ipd`)
**Purpose:** Manage inpatient admissions, beds, and wards

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Admit Patient | Doctor | Patient needs hospitalization | 1. Create admission order 2. Select ward/room type 3. Assign bed 4. Enter admission diagnosis 5. Create treatment plan |
| Bed Assignment | Front Desk | Assign room to admitted patient | 1. View available beds 2. Select appropriate ward 3. Consider patient preference 4. Assign bed 5. Update occupancy |
| Daily Rounds | Doctor | Morning patient rounds | 1. View admitted patients 2. Review overnight notes 3. Examine patient 4. Update treatment plan 5. Order tests if needed |
| Transfer Ward | Nurse | Patient needs ICU | 1. Create transfer order 2. Select destination ward 3. Prepare patient 4. Update bed status 5. Hand over to new unit |
| Discharge Planning | Doctor | Patient ready for discharge | 1. Create discharge summary 2. Write final instructions 3. Prescribe take-home medicines 4. Schedule follow-up 5. Order billing |
| Bed Management Dashboard | Admin | Monitor bed occupancy | 1. View ward-wise occupancy 2. See available beds 3. Track admissions/discharges 4. Plan capacity |
| Nurse Handover | Nurse | Shift change | 1. Review patient list 2. Document current status 3. Flag concerns 4. Handover to incoming nurse 5. Sign off |

### Operating Theatre (`/healthcare/ot`)
**Purpose:** Schedule surgeries and manage OT cases

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Schedule Surgery | Doctor | Plan elective surgery | 1. Create surgery request 2. Select OT and date/time 3. Enter procedure details 4. Add surgery team 5. Submit for approval |
| Pre-operative Assessment | Anesthetist | Evaluate patient before surgery | 1. Review patient history 2. Check investigations 3. Assess anesthesia risk 4. Clear for surgery 5. Document assessment |
| OT Preparation | OT Nurse | Prepare for scheduled surgery | 1. View surgery list 2. Prepare equipment 3. Arrange supplies 4. Confirm team availability 5. Ready OT |
| Surgery Case Management | Surgeon | Document surgery | 1. Start surgery timer 2. Record procedure steps 3. Document findings 4. Note complications if any 5. Complete surgery |
| Post-operative Notes | Surgeon | After surgery documentation | 1. Write operative notes 2. Enter post-op orders 3. Prescribe medications 4. Set monitoring parameters 5. Hand over to ICU/ward |
| OT Utilization Report | Admin | Review OT efficiency | 1. View OT usage 2. Analyze turnaround times 3. Track cancellations 4. Optimize scheduling |
| Emergency Surgery | Surgeon | Urgent case needs OT | 1. Request emergency slot 2. Bump elective if needed 3. Fast-track preparation 4. Proceed with surgery |

### Insurance (`/healthcare/insurance`)
**Purpose:** Process and track insurance claims

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Verify Insurance | Front Desk | Check patient coverage | 1. Enter policy details 2. Verify with insurer (online/call) 3. Check covered services 4. Note exclusions 5. Inform patient of coverage |
| Pre-authorization Request | Billing Staff | Get approval before treatment | 1. Create pre-auth request 2. Enter treatment details 3. Attach supporting documents 4. Submit to insurer 5. Track status |
| Submit Claim | Billing Staff | Send claim after treatment | 1. Compile claim documents 2. Enter treatment details 3. Attach bills and reports 4. Submit electronically 5. Get acknowledgment |
| Track Claim Status | Billing Staff | Monitor pending claims | 1. View claims dashboard 2. Check status by insurer 3. Follow up on delayed claims 4. Update records |
| Handle Claim Rejection | Billing Staff | Insurer rejected claim | 1. Review rejection reason 2. Gather additional documents 3. File appeal 4. Resubmit claim 5. Escalate if needed |
| Insurance Settlement | Accounts | Receive payment from insurer | 1. Match payment to claims 2. Verify amount 3. Record settlement 4. Update claim status 5. Close claim |
| Patient Co-pay Collection | Cashier | Collect patient's share | 1. Calculate co-pay amount 2. Inform patient 3. Collect payment 4. Issue receipt 5. Link to claim |

---

## Administration Module Use Cases

### Person Master (`/admin/person-master`)
**Purpose:** Centralized identity management using CNIC/Phone

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Create New Person | Admin | Register new identity | 1. Enter CNIC or phone 2. Check for duplicates 3. Enter demographics 4. Save person record |
| Search Person | Staff | Find existing person | 1. Search by CNIC/phone/name 2. View matching results 3. Verify identity 4. Select correct person |
| Merge Duplicate Persons | Admin | Same person registered twice | 1. Identify duplicates 2. Compare records 3. Select primary record 4. Merge data 5. Archive duplicate |
| Add Person Context | Admin | Person works at multiple facilities | 1. Find person 2. Add new context (patient/employee/doctor) 3. Link to organization 4. Set role 5. Save |
| Update Person Details | Staff | Person changed phone number | 1. Find person 2. Edit contact details 3. Verify change 4. Update record |
| View Person History | Admin | Audit trail for person | 1. Find person 2. View all contexts 3. See interaction history 4. Check across organizations |

### Invitations (`/admin/invitations`)
**Purpose:** Send and manage employee invitations

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Invite New Employee | Admin | Hire new staff member | 1. Click "Send Invitation" 2. Enter email 3. Select role 4. Assign to department 5. Send invite |
| Resend Invitation | Admin | Invitee didn't receive email | 1. Find pending invitation 2. Verify email 3. Click "Resend" 4. New email sent |
| Accept Invitation | New Employee | Got invitation email | 1. Click link in email 2. Complete registration 3. Set password 4. Access granted |
| Cancel Invitation | Admin | Offer withdrawn | 1. Find invitation 2. Click "Cancel" 3. Invitation invalidated |
| View Invitation Status | Admin | Track pending invites | 1. Open invitations list 2. See pending/accepted/expired 3. Follow up on pending |
| Bulk Invite | Admin | Onboard multiple staff | 1. Download template 2. Fill employee details 3. Upload CSV 4. Send bulk invites |

### Audit Logs (`/admin/audit-logs`)
**Purpose:** View system audit trail for compliance

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| View Recent Activity | Admin | Check system usage | 1. Open audit logs 2. View recent entries 3. Filter by user/action 4. Review details |
| Investigate Security Incident | Super Admin | Suspicious activity reported | 1. Set date range 2. Filter by suspected user 3. Review all actions 4. Export evidence |
| Compliance Audit | Auditor | Prepare for inspection | 1. Set audit period 2. Filter relevant actions 3. Export logs 4. Generate report |
| Track Data Changes | Admin | Verify who modified record | 1. Search by record ID 2. View change history 3. See before/after values 4. Identify user |
| Export Audit Data | Super Admin | External audit requirement | 1. Set parameters 2. Select log types 3. Export to CSV 4. Share with auditors |

### Subscriptions (`/admin/subscriptions`)
**Purpose:** Manage organization subscriptions

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| View All Subscriptions | Super Admin | Overview of customers | 1. Open subscriptions 2. See all organizations 3. View by status (active/trial/expired) |
| Activate Subscription | Super Admin | New customer signed up | 1. Find organization 2. Select plan 3. Set billing cycle 4. Activate subscription |
| Upgrade Plan | Super Admin | Customer needs more features | 1. Find subscription 2. Select new plan 3. Calculate proration 4. Apply upgrade |
| Extend Trial | Super Admin | Customer needs more time | 1. Find trial subscription 2. Extend trial period 3. Notify customer |
| Cancel Subscription | Super Admin | Customer churning | 1. Find subscription 2. Process cancellation 3. Set end date 4. Revoke access after expiry |
| Subscription Reports | Super Admin | Revenue analysis | 1. View subscription metrics 2. See MRR/ARR 3. Track churn 4. Forecast revenue |

### Pharma Management (`/admin/pharma-companies`)
**Purpose:** Manage pharmaceutical company accounts

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Add New Pharma Company | Super Admin | New company signed up | 1. Click "Add Company" 2. Enter company details 3. Set subscription 4. Create admin user 5. Activate |
| View Company Dashboard | Super Admin | Review company performance | 1. Select company 2. View MR count 3. See activity metrics 4. Check subscription status |
| Suspend Company | Super Admin | Payment issue | 1. Find company 2. Click "Suspend" 3. Set suspension reason 4. Access restricted |
| Reassign MR | Super Admin | MR changing companies | 1. Find MR 2. Remove from current company 3. Assign to new company 4. Transfer data if needed |

### Super Admin Panel (`/admin/super-admin`)
**Purpose:** Advanced system administration

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| System Health Check | Super Admin | Daily monitoring | 1. View system dashboard 2. Check all services status 3. Review error logs 4. Take action if needed |
| User Management | Super Admin | Manage all users | 1. Search users 2. View user details 3. Reset password if needed 4. Modify access |
| Data Governance | Super Admin | Control data access | 1. Set data policies 2. Configure retention 3. Manage permissions 4. Audit access |
| Feature Flags | Super Admin | Enable beta features | 1. View feature flags 2. Enable for specific orgs 3. Monitor usage 4. Roll out globally |

---

## HR/Payroll/Accounts Module Use Cases

### HR (`/hr`)
**Purpose:** Employee management, attendance, and shifts

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Add New Employee | HR Admin | New hire joining | 1. Click "Add Employee" 2. Enter personal details 3. Assign department 4. Set reporting manager 5. Save |
| Mark Attendance | Employee/System | Daily attendance | 1. Employee clocks in 2. System records time 3. Auto-marks as present 4. Clock out recorded |
| Apply for Leave | Employee | Need time off | 1. Click "Apply Leave" 2. Select leave type 3. Enter dates 4. Add reason 5. Submit |
| Approve Leave | Manager | Employee requested leave | 1. View pending requests 2. Check team capacity 3. Approve or reject 4. Employee notified |
| Configure Shifts | HR Admin | Set up shift schedules | 1. Create shift template 2. Set timings 3. Assign to employees 4. Publish schedule |
| Generate Attendance Report | HR Admin | Monthly attendance summary | 1. Select period 2. Choose department 3. Generate report 4. Export for payroll |
| Employee Offboarding | HR Admin | Employee resignation | 1. Initiate exit process 2. Collect assets 3. Process final settlement 4. Revoke access 5. Archive records |

### Payroll (`/payroll`)
**Purpose:** Process employee salaries and deductions

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Run Monthly Payroll | Payroll Admin | End of month processing | 1. Initiate payroll run 2. Import attendance 3. Calculate earnings 4. Apply deductions 5. Generate payslips |
| Configure Salary Structure | HR Admin | Set up pay components | 1. Create structure 2. Add components (basic, allowances) 3. Set deductions 4. Assign to employees |
| Process Bonus | Payroll Admin | Annual bonus distribution | 1. Import bonus data 2. Apply tax calculations 3. Add to payroll 4. Process payment |
| Handle Arrears | Payroll Admin | Back-dated salary revision | 1. Calculate arrears amount 2. Add to current payroll 3. Generate arrears slip 4. Process |
| Generate Tax Report | Payroll Admin | Quarterly tax filing | 1. Export payroll data 2. Calculate tax liability 3. Generate tax report 4. Submit to authorities |
| Payslip Distribution | Payroll Admin | Share payslips with employees | 1. Finalize payroll 2. Generate PDF payslips 3. Email to employees 4. Upload to employee portal |
| Salary Advance | Employee | Request advance payment | 1. Submit advance request 2. Manager approval 3. Payroll processes 4. Deduction in next salary |

### Accounts (`/accounts`)
**Purpose:** Financial accounting and reporting

| Use Case | Actor | Scenario | Steps |
|----------|-------|----------|-------|
| Create Journal Entry | Accountant | Record financial transaction | 1. Click "New Entry" 2. Enter debit account 3. Enter credit account 4. Add narration 5. Post entry |
| View Ledger | Accountant | Check account balance | 1. Select account 2. Set date range 3. View transactions 4. See running balance |
| Reconcile Bank | Accountant | Match bank statement | 1. Upload bank statement 2. Match transactions 3. Mark reconciled 4. Report discrepancies |
| Generate Trial Balance | Accountant | Verify accounts | 1. Set period 2. Generate trial balance 3. Check debits equal credits 4. Investigate differences |
| Expense Tracking | Accountant | Record business expense | 1. Create expense entry 2. Categorize expense 3. Attach receipt 4. Post to accounts |
| Generate Financial Statements | CFO | Period-end reporting | 1. Close period 2. Generate P&L 3. Generate Balance Sheet 4. Review and approve |
| Vendor Payment | Accountant | Pay supplier invoice | 1. Find vendor invoice 2. Verify goods received 3. Schedule payment 4. Record in accounts |
| Revenue Recognition | Accountant | Record income | 1. Receive payment 2. Match to invoice 3. Record revenue 4. Update customer account |

---

## Healthcare Module Workflows

### OPD (Outpatient) Workflow
1. **Patient Registration** (Front Desk) - Create/find patient in Person Master
2. **Add to Queue** (Front Desk) - Patient joins doctor's queue
3. **Check-in** (Front Desk) - Mark patient arrived
4. **Consultation** (Doctor) - Record vitals, diagnosis, prescribe
5. **Lab Tests** (If needed) - Order and complete tests
6. **Pharmacy** (If needed) - Dispense prescribed medicines
7. **Billing** (Front Desk) - Generate bill, collect payment
8. **Complete** - Encounter marked complete

### IPD (Inpatient) Workflow
1. **Admission Request** - Doctor orders admission
2. **Bed Assignment** - Front desk assigns ward/bed
3. **Daily Rounds** - Doctor visits, updates notes
4. **Treatments/Tests** - Ongoing care documented
5. **Discharge Planning** - Prepare discharge summary
6. **Final Billing** - Calculate total charges
7. **Discharge** - Patient released

### Operating Theatre (OT) Workflow
1. **Surgery Scheduling** - Book OT slot
2. **Pre-op Assessment** - Patient preparation
3. **Surgery Case Creation** - Document surgery details
4. **Procedure** - Record surgery timeline
5. **Post-op Care** - Recovery documentation
6. **Billing** - Surgery charges added

### Insurance Claims Workflow
1. **Policy Verification** - Check patient coverage
2. **Pre-authorization** - Get approval for treatment
3. **Treatment** - Provide healthcare services
4. **Claim Submission** - Submit documents to insurer
5. **Claim Tracking** - Monitor approval status
6. **Settlement** - Receive payment

---

## Key Features by Module

### Person Master
- Centralized identity management using CNIC/Phone
- One person can have multiple contexts (patient, employee, doctor)
- Data shared across organizations while maintaining privacy

### Queue Management
- Multiple queue types (Doctor Consultation, Lab, Pharmacy, Reception)
- Automatic token generation with prefix
- Real-time queue display
- SMS/notification integration

### Billing System
- Multi-line item invoices
- Tax calculation
- Partial payments support
- Insurance billing integration
- Payment method tracking (Cash, Card, Insurance)

### Inventory Management
- Multi-warehouse support
- Stock level tracking
- Expiry management
- Reorder alerts
- Transfer between locations

---

## User Access Levels Summary

| Role | Dashboard Type | Primary Functions |
|------|---------------|-------------------|
| Super Admin | Super Admin Dashboard | Full system access, organization management |
| Hospital/Clinic Admin | Hospital Admin Dashboard | Facility operations, staff management |
| Doctor | Doctor Dashboard | Patient consultations, prescriptions |
| Front Desk | Front Desk Dashboard | Patient registration, queue, billing |
| Medical Rep | Sales Dashboard | Doctor visits, sales tracking |
| Company Admin (Pharma) | Sales Dashboard | Team management, reports |
| Payroll Admin | Payroll Dashboard | Salary processing |

---

*Last Updated: January 2026*
