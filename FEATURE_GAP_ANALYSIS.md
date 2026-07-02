# Alhuic - Feature Gap Analysis Report
**Generated:** January 10, 2026  
**Purpose:** Compare implemented features against SRS requirements
**Revision:** 2.0 - Updated with accurate implementation audit

---

## Executive Summary

The Alhuic platform has foundational infrastructure but requires significant security and feature work to fully meet SRS requirements. This revised analysis provides accurate implementation status based on code audit.

### Overall Status (REVISED - January 10, 2026)
- **Core Infrastructure:** 75% Complete
- **RBAC/Security:** 95% Complete (✅ MAJOR UPDATE)
- **Pharma Module:** 60% Complete  
- **Hospital/Clinic Module:** 55% Complete
- **AI/Intelligence Features:** 40% Complete (stubs with tier enforcement)
- **Common Features:** 55% Complete

---

## SECURITY STATUS (✅ UPDATED)

### RBAC Enforcement - IMPLEMENTED (January 2026)
**All 200+ routes now have proper RBAC middleware.**

Middleware Chain: `isAuthenticated` → `requireActiveSubscription` → `requireSubscriptionTier` → `requireRole`

**Role Assignments by Module:**
| Module | Roles Allowed |
|--------|---------------|
| Sales/Pharma routes | user, medical_rep, company_admin, super_admin |
| Healthcare routes | doctor, doctor_frontdesk, company_admin, super_admin |
| AI Healthcare routes | doctor, doctor_frontdesk, company_admin, super_admin + Silver tier |
| AI Sales/MR routes | user, medical_rep, company_admin, super_admin + Silver tier |
| AI Inventory/Marketing/Analytics | company_admin, super_admin + Golden tier |
| Admin routes | super_admin only |
| Invitation routes | company_admin, super_admin |

**Subscription Enforcement - IMPLEMENTED:**
- `requireActiveSubscription` checks user.trialEndDate and org.subscriptionEndDate
- `requireSubscriptionTier` validates basic/silver/golden/custom tier access
- Super Admins bypass all tier and subscription checks

**Routes with Auth-Only Access (intentional):**
- `/api/auth/user` - Session check for any authenticated user
- `/api/auth/resend-verification` - Email verification resend

---

## 1. GLOBAL RULES & RBAC (Requirement Status: ✅ IMPLEMENTED)

### Implemented Features
| Feature | Status | Notes |
|---------|--------|-------|
| Super Admin role definition | ✅ IMPLEMENTED | Schema and auth configured |
| Super Admin subscription routes protected | ✅ IMPLEMENTED | requireRole in place |
| Role hierarchy schema | ✅ IMPLEMENTED | Database tables exist |
| Multi-tenant data isolation | ✅ IMPLEMENTED | Routes filter by companyId/organizationId |
| Frontend menu filtering by role | ✅ IMPLEMENTED | menuConfig.ts works |
| **RBAC enforcement on all routes** | ✅ IMPLEMENTED | All 200+ routes protected |
| **Subscription tier enforcement** | ✅ IMPLEMENTED | requireSubscriptionTier middleware |
| **Trial/Subscription expiry blocking** | ✅ IMPLEMENTED | requireActiveSubscription checks dates |

### Remaining Items
| Feature | Priority | Notes |
|---------|----------|-------|
| Audit logging enhancement | MEDIUM | Table exists, needs more usage |
| Row-level security testing | LOW | Needs comprehensive testing |

---

## 2. PHARMA COMPANY MODULE

### Implemented Features
| Feature | Status | Notes |
|---------|--------|-------|
| Company registration | IMPLEMENTED | /register route works |
| Employee invitation system | IMPLEMENTED | /admin/invitations with token flow |
| Sales entry form | IMPLEMENTED | /entry page with doctor/product selection |
| Doctor management | IMPLEMENTED | CRUD routes exist, GPS fields |
| Product management | IMPLEMENTED | CRUD routes with price history |
| Doctor visits | IMPLEMENTED | GPS tracking, punch-in/out |
| KPI tracking | IMPLEMENTED | Daily metrics recording |
| Expense management | IMPLEMENTED | CRUD with categories |
| Basic reporting | IMPLEMENTED | by-product, by-doctor, by-territory |

### Partially Implemented
| Feature | Status | Notes |
|---------|--------|-------|
| MR profile management | PARTIAL | UI exists, but some fields not persisted |
| Sales leads | PARTIAL | Page exists, needs backend verification |
| MR performance dashboard | PARTIAL | Basic charts, needs real data integration |

### Subscription Tiers - Schema Only, NOT Enforced

**CRITICAL: No route checks subscription tier before granting access**

#### Basic Tier Features
| Feature | Status |
|---------|--------|
| Medicines/Products | Routes exist, NO tier check |
| In-house employees | Invitations work |
| Medical representatives | Schema exists |
| Sales tracking | Routes exist |
| Visits | Routes exist |
| KPIs | Routes exist |
| Stock management | NOT IMPLEMENTED |

#### Silver Tier Features (Basic + Intelligence)
| Feature | Status |
|---------|--------|
| Doctor data | Routes exist |
| Doctor potential scoring | AI module exists, returns mock data |
| Medical rep visit mapping | Routes exist |
| Doctor expenditure tracking | NOT IMPLEMENTED |
| Predictive insights | AI stubs exist, no real ML |
| Medical news integration | SCHEMA ONLY |
| Disease outbreak intelligence | SCHEMA ONLY |

#### Golden Tier Features (Silver + AI)
| Feature | Status |
|---------|--------|
| AI-driven market prediction | STUB - returns simulated data |
| Targeted area demand forecasting | STUB |
| Medicine demand intelligence | NOT IMPLEMENTED |
| Sales growth strategy recommendations | STUB |

### Missing Pharma Features (Priority Order)
| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| Subscription tier enforcement | CRITICAL | Medium | Must check tier before feature access |
| Stock/Inventory module | HIGH | Large | Required for Basic tier |
| Real AI predictions (not stubs) | MEDIUM | Large | Requires ML integration |
| Doctor expenditure tracking | MEDIUM | Medium | Schema change needed |
| Medical intelligence ingestion | LOW | Large | API integrations needed |

---

## 3. HOSPITAL/CLINIC MODULE

### Implemented Features
| Feature | Status | Notes |
|---------|--------|-------|
| Healthcare facility management | IMPLEMENTED | CRUD for facilities |
| Patient management | IMPLEMENTED | CRUD for patients |
| Front Desk Terminal | IMPLEMENTED | UI for queue/payments |
| Doctor Front Desk Terminal | IMPLEMENTED | Vitals recording UI |
| Doctor Terminal | IMPLEMENTED | Queue view, consultations |
| Test Terminal | IMPLEMENTED | Test report uploads |
| Appointment scheduling | IMPLEMENTED | API endpoints exist |
| Queue management | IMPLEMENTED | Auto-numbering |
| Payment processing | IMPLEMENTED | Cash/card/UPI methods |
| Vitals recording | IMPLEMENTED | Temperature, BP, etc. |
| Prescriptions | IMPLEMENTED | Schema and basic API |
| Doctor availability | IMPLEMENTED | Scheduling table |

### Partially Implemented
| Feature | Status | Notes |
|---------|--------|-------|
| Doctor agreement types | SCHEMA ONLY | Fields exist but no calculation logic |
| Hospital doctors | SCHEMA ONLY | hospital_doctors table exists, no routes |
| Payroll records | SCHEMA ONLY | Table exists, NO routes or UI |

### Doctor Agreement Types - Schema Present, NO Logic
| Type | Schema | Calculation Logic |
|------|--------|-------------------|
| Permanent (monthly salary) | monthlySalary field | NOT IMPLEMENTED |
| On-call (per patient fee) | perPatientFee field | NOT IMPLEMENTED |
| Commission-based | commissionPercentage field | NOT IMPLEMENTED |

### NOT Implemented
| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| **Payroll generation** | HIGH | Medium | Schema exists, needs CRUD + calculation |
| **Salary calculation logic** | HIGH | Medium | Must aggregate patient visits |
| **Commission calculation** | HIGH | Medium | Per-visit fee tracking |
| **Offline capability** | HIGH | Large | useOfflineSync is stub only |
| Department management | MEDIUM | Medium | Not in schema |
| Medical store integration | LOW | Large | New module needed |
| Real-time queue sync | MEDIUM | Medium | WebSocket exists but partial |

---

## 4. MEDICAL & MARKET INTELLIGENCE

### Schema Implemented, Logic Largely Stubs
| Feature | Schema | Backend Logic | Notes |
|---------|--------|---------------|-------|
| Intelligence sources | IMPLEMENTED | NO INGESTION | Table empty |
| Intelligence data storage | IMPLEMENTED | NO DATA | Table empty |
| Market segmentation AI | IMPLEMENTED | RETURNS MOCKS | No real clustering |
| Competitive intelligence | IMPLEMENTED | RETURNS MOCKS | Basic keyword extraction |
| Anomaly detection | IMPLEMENTED | RETURNS MOCKS | Simple threshold logic |
| Predictive KPIs | IMPLEMENTED | RETURNS MOCKS | Linear extrapolation only |
| Natural language queries | IMPLEMENTED | PARTIAL | Basic parsing, limited |

### AI Module Reality Check
The `/api/ai/*` endpoints exist and return data, but:
- No ML models are trained or deployed
- Predictions are rule-based calculations, not AI
- Intelligence sources have no ingestion pipelines
- Data tables are empty in production

### Not Implemented (Data Ingestion)
| Source Category | Status | Priority |
|-----------------|--------|----------|
| WHO/CDC/ECDC disease surveillance | NOT IMPLEMENTED | MEDIUM |
| PubMed/medRxiv research | NOT IMPLEMENTED | LOW |
| IQVIA/Statista market data | NOT IMPLEMENTED | LOW |
| Reuters/BBC health news | NOT IMPLEMENTED | LOW |
| FDA/WHO drug safety | NOT IMPLEMENTED | MEDIUM |
| Pakistan-specific (DRAP, NIH) | NOT IMPLEMENTED | MEDIUM |

---

## 5. COMMON FEATURES

### Implemented
| Feature | Status | Notes |
|---------|--------|-------|
| Excel/CSV bulk upload | IMPLEMENTED | Sales, doctors, products |
| PDF/Excel export | IMPLEMENTED | Reports module |
| Email verification | IMPLEMENTED | Token-based, 24hr expiry |
| Password reset | IMPLEMENTED | Token-based, 1hr expiry |
| Role-based menu system | IMPLEMENTED | Frontend filtering works |
| Dark/Light theme | IMPLEMENTED | CSS variables |
| Mobile-responsive design | IMPLEMENTED | Tailwind responsive |

### Missing
| Feature | Priority | Effort |
|---------|----------|--------|
| Payroll generation | HIGH | Medium |
| Expense sheet export | MEDIUM | Small |
| Google Sheets integration | LOW | Medium |
| Template version control | LOW | Medium |

---

## 6. SUBSCRIPTION ENFORCEMENT (CRITICAL GAP)

**This is the highest priority security issue.**

### Current State
- `subscription_tiers` table exists with Basic/Silver/Golden/Custom tiers
- `organizations` table has subscription_tier and subscription_end_date fields
- `module_permissions` table links tiers to modules
- **ZERO routes check subscription tier or expiry**

### Required Implementation (URGENT)
1. **Create `requireSubscription` middleware** - Check tier and expiry
2. **Add tier checks to all feature routes** - Block premium features
3. **Add expiry checks** - Block access when subscription expired
4. **Graceful degradation** - Show upgrade prompts, not errors
5. **Warning notifications** - Alert 30/7/1 days before expiry

---

## 7. PRIORITY RECOMMENDATIONS (REVISED)

### Critical (Security - Do First)
| Task | Effort | Notes |
|------|--------|-------|
| Add RBAC to all routes | Large | 150+ routes need audit |
| Subscription enforcement middleware | Medium | Block access by tier/expiry |
| Row-level security consistency | Medium | Ensure companyId/orgId filtering |

### High Priority (Core Functionality)
| Task | Effort | Notes |
|------|--------|-------|
| Payroll generation (routes + UI) | Medium | Hospital doctors need this |
| Stock/Inventory module | Large | Basic tier requirement |
| Doctor salary/commission logic | Medium | Calculate from patient visits |
| Offline capability | Large | Hospital terminals need this |

### Medium Priority (Feature Completion)
| Task | Effort | Notes |
|------|--------|-------|
| Hospital doctors CRUD routes | Small | Schema exists |
| Doctor expenditure tracking | Medium | New feature |
| AI predictions (replace stubs) | Large | Requires ML expertise |
| Intelligence data ingestion | Large | API integrations |

### Low Priority (Enhancements)
| Task | Effort | Notes |
|------|--------|-------|
| Google Sheets integration | Medium | |
| Department management | Medium | |
| Medical store integration | Large | |

---

## 8. DATABASE SCHEMA COMPLETENESS

### Tables Present and USED
- users, companies, organizations, organization_types
- sales_entries, doctors, products, product_price_history
- doctor_visits, expenses, call_kpis
- healthcare_facilities, patients, appointments
- consultations, prescriptions, vitals, test_reports
- queue_entries, payments
- employee_invitations
- email_verification_tokens, password_reset_tokens

### Tables Present but NOT USED (No Routes)
| Table | Needs |
|-------|-------|
| subscription_tiers | Used only in Super Admin UI |
| module_permissions | NO middleware uses this |
| payroll_records | NO routes, NO UI |
| hospital_doctors | NO routes |
| intelligence_sources | NO ingestion |
| intelligence_data | NO population |
| audit_logs | Inconsistent logging |

---

## 9. SUMMARY

### What Works Well
- Core CRUD for sales, doctors, products, visits, KPIs, expenses
- Healthcare terminals UI (Front Desk, Doctor, Test)
- Employee invitation system
- Email verification and password reset
- Frontend role-based menu filtering
- Dark/Light theme and responsive design

### What Needs Urgent Attention
1. **RBAC enforcement** - Most routes have no role checks
2. **Subscription enforcement** - Zero routes check tier/expiry
3. **Row-level security** - Inconsistent org/company filtering

### What's Not Really Implemented (Despite Claims)
- AI features (return mocks, not ML predictions)
- Medical intelligence (schema only, no data)
- Payroll system (schema only, no logic)
- Offline capability (stub hook only)
- Stock/Inventory module (not implemented)

### Estimated Completion
With critical security fixes + high priority features: ~65% of SRS
Current state without fixes: ~45% of SRS (due to security gaps)
