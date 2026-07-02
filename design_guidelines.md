# Aluhic Design System - Healthcare & Pharma Operations Platform

## Brand Identity
**Tagline**: "Your Medical Partner"
**Core Pillars**: Healthcare Credibility, AI Intelligence, Enterprise Grade

## Design Principles
1. **Enterprise-first, clinical clarity** - Clean, professional interfaces for healthcare environments
2. **Grid-based 8pt layout system** - Consistent spacing using multiples of 8px
3. **Role-based UI optimization** - Tailored experiences for 5 user roles
4. **WCAG AA compliant contrast** - Accessible color combinations

## Core Values (Design Themes)
- **Trust** - Clinical credibility through clean, professional aesthetics
- **Intelligence** - AI-driven insights with smart visual cues
- **Efficiency** - Workflow optimization with intuitive navigation
- **Scalability** - Enterprise-ready responsive design

---

## Color Palette (5 Core Colors)

### Primary Colors
**Light Mode:**
- Primary (Teal): 173 80% 40% - Healthcare trust, main actions
- Secondary (Blue): 210 70% 50% - AI features, secondary actions
- Accent (Violet): 262 70% 55% - Intelligence indicators, highlights
- Success: 152 76% 36% - Positive status, approvals
- Warning: 38 92% 50% - Alerts, pending items
- Error: 0 84% 60% - Critical alerts, errors
- Background: 210 20% 98%
- Surface/Card: 0 0% 100%
- Muted: 210 15% 96%
- Text Primary: 210 20% 15%
- Text Secondary: 210 10% 45%
- Border: 210 15% 88%

**Dark Mode:**
- Primary (Teal): 173 70% 50%
- Secondary (Blue): 210 65% 60%
- Accent (Violet): 262 65% 65%
- Success: 152 70% 50%
- Warning: 38 85% 55%
- Error: 0 75% 60%
- Background: 210 25% 8%
- Surface/Card: 210 20% 12%
- Muted: 210 20% 15%
- Text Primary: 210 15% 95%
- Text Secondary: 210 10% 65%
- Border: 210 15% 20%

### Semantic Colors
- **Healthcare Green**: 160 60% 45% - Medical status, health indicators
- **Clinical Blue**: 200 80% 50% - Lab results, clinical data
- **Alert Orange**: 25 90% 55% - Urgent notifications
- **Pharma Purple**: 270 60% 55% - Pharma-specific features

---

## Typography

### Font Stack
- **Primary**: 'Inter', system-ui, sans-serif - All UI text
- **Mono**: 'Roboto Mono', monospace - Numerical data, codes, IDs

### Scale
- **Display**: text-4xl md:text-5xl (36px/48px) - Hero sections
- **H1**: text-3xl md:text-4xl (30px/36px) - Page titles
- **H2**: text-2xl md:text-3xl (24px/30px) - Section headers
- **H3**: text-xl md:text-2xl (20px/24px) - Card headers
- **H4**: text-lg (18px) - Subsection headers
- **Body**: text-base (16px) - Primary content
- **Small**: text-sm (14px) - Secondary content, labels
- **Caption**: text-xs (12px) - Metadata, timestamps

### Weights
- **Bold** (700): Headings, emphasis
- **Semibold** (600): Card titles, important labels
- **Medium** (500): Navigation, buttons
- **Regular** (400): Body text

---

## Layout System (8pt Grid)

### Spacing Scale
- 2 (0.5rem/8px) - Tight spacing
- 3 (0.75rem/12px) - Compact elements
- 4 (1rem/16px) - Standard gaps
- 6 (1.5rem/24px) - Section spacing
- 8 (2rem/32px) - Large gaps
- 12 (3rem/48px) - Section breaks
- 16 (4rem/64px) - Page sections

### Container Widths
- Mobile: Full width with px-4 padding
- Tablet: max-w-3xl with px-6 padding
- Desktop: max-w-7xl with px-8 padding

### Grid System
- Mobile: 1 column (grid-cols-1)
- Tablet: 2 columns (md:grid-cols-2)
- Desktop: 3-4 columns (lg:grid-cols-3 xl:grid-cols-4)

---

## Logo Usage

### Logo Variants (4 types)
1. **Full Logo**: Aluhic icon + wordmark - Headers, landing pages
2. **Icon Only**: "A" symbol with gradient - Favicons, mobile nav
3. **Wordmark Only**: "Aluhic" text - Compact spaces
4. **Monochrome**: Single color version - Footer, print

### Logo Specifications
- Primary icon: Rounded square with "A" letter
- Gradient: Primary teal to secondary blue
- Minimum size: 32px for icon, 120px for full logo
- Clear space: 1x logo height on all sides

---

## Component Patterns

### Cards
- Border radius: rounded-lg (8px)
- Shadow: shadow-sm (light) / none (dark)
- Padding: p-4 md:p-6
- Border: 1px solid border color

### Buttons
- Height: h-9 (default), h-8 (sm), h-10 (lg)
- Border radius: rounded-md (6px)
- Primary: Primary background, white text
- Secondary: Secondary background, white text
- Outline: Transparent, border, text color
- Ghost: Transparent, text color only

### Form Inputs
- Height: h-10
- Border radius: rounded-md
- Border: 1px solid, focus ring on focus
- Padding: px-3

### Badges
- Height: h-5 (default), h-4 (sm)
- Border radius: rounded-full
- Padding: px-2

---

## Role-Based UI (5 Roles)

### Super Admin
- Full platform access
- Dashboard: Organization overview, subscription metrics, user management
- Accent: Primary teal

### Medical Representative (MR)
- Sales and territory focus
- Dashboard: Sales metrics, doctor visits, territory performance
- Accent: Secondary blue

### Doctor
- Clinical workflow focus
- Dashboard: Patient queue, appointments, consultation tools
- Accent: Healthcare green

### Hospital/Clinic Admin
- Facility management focus
- Dashboard: Staff, departments, patient flow, financials
- Accent: Clinical blue

### Payroll Admin
- Financial operations focus
- Dashboard: Payroll calculations, doctor payments, revenue
- Accent: Pharma purple

---

## Icon System (18+ Categories)

### Navigation Icons (lucide-react)
- Home, LayoutDashboard, Settings, Menu, ChevronLeft/Right

### Healthcare Icons
- Stethoscope, Heart, Activity, Pill, Syringe, Hospital

### Business Icons
- Users, Building2, Briefcase, TrendingUp, DollarSign, CreditCard

### Action Icons
- Plus, Edit, Trash2, Search, Filter, Download, Upload

### Status Icons
- Check, X, AlertTriangle, Info, Clock, Calendar

### AI/Intelligence Icons
- Brain, Sparkles, Zap, Target, Lightbulb

---

## Animations

### Principles
- Subtle and purposeful
- Duration: 150-300ms
- Easing: ease-out for exits, ease-in-out for transitions

### Allowed Animations
- Fade-in for content loading (200ms)
- Scale on button hover (transform scale-[1.02])
- Slide for modals/drawers (300ms)
- Spin for loading indicators

### Avoided
- Page transitions
- Scroll effects
- Excessive bouncing
