import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { Express, RequestHandler } from "express";
import type { User } from "@shared/schema";

const PgSession = connectPgSimple(session);

// Configure session middleware
export function getSession() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const isProduction = process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT === "1";
  
  // Cookie configuration for custom domains
  const cookieConfig: session.CookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
  };
  
  return session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "sessions",
      createTableIfMissing: true,
      errorLog: console.error,
    }),
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: cookieConfig,
  });
}

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      // User doesn't exist in database - invalidate session gracefully
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    // Log error but don't crash - just invalidate the session
    console.error("Error deserializing user:", error);
    done(null, false);
  }
});

// Passport Local Strategy for email/password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);

        if (!user) {
          console.log("[Login Debug] User not found:", email);
          return done(null, false, { message: "Invalid email or password" });
        }

        if (!user.isActive) {
          console.log("[Login Debug] User is inactive", email);
          return done(null, false, { message: "Account is inactive" });
        }

        if (!user.passwordHash) {
          console.log("[Login Debug] Password not set", email);
          return done(null, false, { message: "Password not set for this account" });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        console.log(`[Login Debug] Password valid for ${email}: ${isValidPassword}`);

        if (!isValidPassword) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // Update last login
        await storage.updateLastLogin(user.id);

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Setup authentication
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
}

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]): RequestHandler => {
  return async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as any;

    // Super Admin bypasses all role checks
    if (user.isSuperAdmin || user.role === "super_admin") {
      return next();
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
};

// UserType-based authorization middleware
export const requireUserType = (allowedTypes: string[]): RequestHandler => {
  return async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as any;

    // Super Admin bypasses all user type checks
    if (user.isSuperAdmin || user.role === "super_admin") {
      return next();
    }

    if (!allowedTypes.includes(user.userType)) {
      return res.status(403).json({ message: "Forbidden: insufficient user type" });
    }

    next();
  };
};

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Helper function to check if user can access all data
export function canAccessAllData(user: User): boolean {
  return user.role === "company_admin" || user.role === "super_admin" || user.userType === "super_admin" || (user as any).isSuperAdmin;
}

// ========== Enhanced RBAC & Multi-Tenant Authorization ==========

// Super Admin-only middleware - for subscription, role, and critical system management
export const requireSuperAdmin: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  // Check if user is Super Admin (never expires, cannot be disabled)
  if (!user.isSuperAdmin && user.role !== "super_admin") {
    return res.status(403).json({ message: "Forbidden: Super Admin access required" });
  }

  next();
};

// Organization-scoped middleware - ensures user can only access their organization's data
export const requireOrganizationAccess = (paramName: string = "organizationId"): RequestHandler => {
  return async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as any;
    const requestedOrgId = req.params[paramName] || req.body[paramName] || req.query[paramName];

    // Super Admin can access all organizations
    if (user.isSuperAdmin || user.role === "super_admin") {
      return next();
    }

    // If no organization ID in request, allow (will be filtered by user's org)
    if (!requestedOrgId) {
      return next();
    }

    // Check if user belongs to the requested organization
    if (user.organizationId !== requestedOrgId) {
      return res.status(403).json({ message: "Forbidden: Access to this organization is denied" });
    }

    next();
  };
};

// Module access middleware - checks if user's organization has access to a module
export const requireModuleAccess = (moduleCode: string): RequestHandler => {
  return async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as any;

    // Super Admin has access to all modules
    if (user.isSuperAdmin || user.role === "super_admin") {
      return next();
    }

    // Check organization's subscription and module access
    // This would normally check the organization_modules table
    // For now, allow access - full implementation would query the database
    next();
  };
};

// Subscription validation middleware - checks if organization subscription is active
export const requireActiveSubscription: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized", code: "NOT_AUTHENTICATED" });
  }

  const user = req.user as any;

  // Debug logging for subscription checks
  console.log(`[requireActiveSubscription] User: ${user.email}, role: ${user.role}, isSuperAdmin: ${user.isSuperAdmin}, organizationId: ${user.organizationId}`);

  // Super Admin is not subject to subscription limits
  if (user.isSuperAdmin || user.role === "super_admin") {
    console.log(`[requireActiveSubscription] Super admin bypass for ${user.email}`);
    return next();
  }

  // Individual users without organization - check their trial expiry
  if (!user.organizationId) {
    const now = new Date();
    if (user.trialEndDate && new Date(user.trialEndDate) < now) {
      console.log(`[requireActiveSubscription] Trial expired for ${user.email}`);
      return res.status(403).json({ 
        message: "Trial expired. Please upgrade your subscription.", 
        code: "TRIAL_EXPIRED",
        expiredAt: user.trialEndDate,
        debug: { email: user.email, role: user.role, isSuperAdmin: user.isSuperAdmin }
      });
    }
    console.log(`[requireActiveSubscription] Individual user ${user.email} - trial valid or no trial set`);
    return next();
  }

  // Check organization subscription status
  if (user.organizationId) {
    const org = await storage.getOrganization(user.organizationId);
    if (org) {
      const now = new Date();
      if (org.subscriptionEndDate && new Date(org.subscriptionEndDate) < now) {
        return res.status(403).json({ 
          message: "Subscription expired", 
          code: "SUBSCRIPTION_EXPIRED",
          expiredAt: org.subscriptionEndDate
        });
      }
    }
  }

  next();
};

// Subscription tier middleware - checks if user's tier has access to specific features
// Uses explicit membership validation with tier hierarchy for security
export const requireSubscriptionTier = (requiredTiers: string[]): RequestHandler => {
  return async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized", code: "NOT_AUTHENTICATED" });
    }

    const user = req.user as any;

    // Debug logging for tier checks
    console.log(`[requireSubscriptionTier] User: ${user.email}, role: ${user.role}, isSuperAdmin: ${user.isSuperAdmin}, requiredTiers: ${requiredTiers.join(',')}`);

    // Super Admin has access to all tiers - bypasses all tier checks
    if (user.isSuperAdmin || user.role === "super_admin") {
      console.log(`[requireSubscriptionTier] Super admin bypass for ${user.email}`);
      return next();
    }

    // Tier hierarchy: custom > golden > silver > basic
    // Higher tiers inherit access to lower tier features
    const tierHierarchy: Record<string, number> = {
      'basic': 1,
      'silver': 2,
      'golden': 3,
      'custom': 4
    };

    // Normalize required tiers to lowercase
    const normalizedRequiredTiers = requiredTiers.map(t => t.toLowerCase());
    
    // Calculate the minimum required tier level from the allowed tiers list
    const requiredMinLevel = Math.min(
      ...normalizedRequiredTiers.map(t => tierHierarchy[t] || 0).filter(level => level > 0)
    );

    // If requiredMinLevel is 0, no valid tiers were provided - block access
    if (requiredMinLevel === 0) {
      return res.status(403).json({ 
        message: "Invalid tier configuration",
        code: "TIER_CONFIG_ERROR"
      });
    }

    // User MUST have an organization to access tier-protected features
    if (!user.organizationId) {
      return res.status(403).json({ 
        message: "Organization membership required for this feature",
        code: "NO_ORGANIZATION",
        requiredTiers
      });
    }

    // Fetch organization data
    const org = await storage.getOrganization(user.organizationId);
    
    // Organization must exist and have a valid subscriptionTier
    if (!org) {
      return res.status(403).json({ 
        message: "Organization not found",
        code: "ORGANIZATION_NOT_FOUND",
        requiredTiers
      });
    }

    // Subscription tier MUST be set - do not default to basic
    if (!org.subscriptionTier) {
      return res.status(403).json({ 
        message: "Organization subscription tier not configured",
        code: "TIER_NOT_CONFIGURED",
        requiredTiers
      });
    }

    const userTier = org.subscriptionTier.toLowerCase();
    const userTierLevel = tierHierarchy[userTier];

    // Validate user's tier is recognized
    if (!userTierLevel) {
      return res.status(403).json({ 
        message: "Invalid subscription tier",
        code: "INVALID_TIER",
        currentTier: org.subscriptionTier,
        requiredTiers
      });
    }

    // Check if user's tier level meets the minimum required level
    // Higher tiers (golden/custom) can access features requiring lower tiers (basic/silver)
    if (userTierLevel >= requiredMinLevel) {
      return next();
    }

    // User's tier is insufficient
    return res.status(403).json({ 
      message: `This feature requires ${requiredTiers.join(' or ')} subscription`,
      code: "TIER_REQUIRED",
      currentTier: org.subscriptionTier,
      requiredTiers
    });
  };
};

// Helper to check if user is Super Admin
export function isSuperAdmin(user: any): boolean {
  return user?.isSuperAdmin || user?.role === "super_admin";
}

// Helper to get user's organization ID for data filtering
export function getUserOrganizationId(user: any): string | null {
  if (isSuperAdmin(user)) {
    return null; // Super Admin sees all data
  }
  return user?.organizationId || null;
}

// Phase 3: Screen-based permission middleware with 3-level override chain
// Priority: User Override > Organization Override > Role Default
// Access levels: none=0, view=1, create=2, edit=3, delete=4, full=5
export const requirePermission = (screenCode: string, requiredLevel: 'view' | 'create' | 'edit' | 'delete' | 'full'): RequestHandler => {
  return async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized", code: "NOT_AUTHENTICATED" });
    }

    const user = req.user as any;

    // Super Admin bypasses all permission checks
    if (user.isSuperAdmin || user.role === "super_admin") {
      return next();
    }

    try {
      // Get effective permissions using the 3-level chain
      const permissions = await storage.getEffectivePermissions(user.id, screenCode);
      
      if (!permissions) {
        console.log(`[requirePermission] No permissions found for user ${user.email} on screen ${screenCode}`);
        return res.status(403).json({ 
          message: "Access denied: No permissions found for this screen",
          code: "NO_PERMISSION",
          screenCode
        });
      }

      // Access level hierarchy
      const accessLevels: Record<string, number> = {
        'none': 0,
        'view': 1,
        'create': 2,
        'edit': 3,
        'delete': 4,
        'full': 5
      };

      const userLevel = accessLevels[permissions.accessLevel] || 0;
      const requiredLevelNum = accessLevels[requiredLevel] || 0;

      // Check if user's effective permission level meets requirement
      if (userLevel >= requiredLevelNum) {
        console.log(`[requirePermission] User ${user.email} granted ${requiredLevel} access to ${screenCode} (level: ${permissions.accessLevel}, source: ${permissions.source})`);
        return next();
      }

      console.log(`[requirePermission] User ${user.email} denied ${requiredLevel} access to ${screenCode} (has: ${permissions.accessLevel})`);
      return res.status(403).json({ 
        message: `Access denied: ${requiredLevel} permission required`,
        code: "INSUFFICIENT_PERMISSION",
        screenCode,
        currentLevel: permissions.accessLevel,
        requiredLevel
      });

    } catch (error) {
      console.error(`[requirePermission] Error checking permissions:`, error);
      return res.status(500).json({ 
        message: "Error checking permissions",
        code: "PERMISSION_CHECK_ERROR"
      });
    }
  };
};
