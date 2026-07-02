import { db } from "../db";
import { 
  aiCallPlans, mrPerformanceInsights, targetAchievementAlerts,
  salesForecasts, sampleConversionPredictions, doctors, products,
  salesEntries, doctorVisits, callKPIs, sampleDistributions, users
} from "@shared/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

interface DoctorSuggestion {
  doctorId: string;
  doctorName: string;
  priority: number;
  score: number;
  reason: string;
  lastVisit?: Date;
  expectedConversion: number;
}

interface RouteStop {
  doctorId: string;
  doctorName: string;
  order: number;
  estimatedTime: string;
  travelTime: number;
  latitude?: number;
  longitude?: number;
}

interface CallPlanResult {
  suggestedDoctors: DoctorSuggestion[];
  optimizedRoute: RouteStop[];
  totalEstimatedTime: number;
  totalTravelDistance: number;
  expectedConversions: number;
}

interface PerformanceInsight {
  insightType: string;
  title: string;
  description: string;
  priority: string;
  actionItems: { action: string; target: string; deadline: string }[];
  expectedImpact: { salesIncrease: number; conversionRate: number };
  confidenceScore: number;
}

interface TargetAlert {
  alertType: string;
  severity: string;
  title: string;
  description: string;
  metricName: string;
  currentValue: number;
  targetValue: number;
  variance: number;
  suggestedActions: string[];
}

interface ForecastResult {
  territory?: string;
  forecastPeriod: string;
  startDate: Date;
  endDate: Date;
  predictedSales: number;
  predictedQuantity: number;
  confidenceInterval: { lower: number; upper: number };
  confidenceScore: number;
  historicalBasis: { date: string; sales: number }[];
}

interface ConversionPrediction {
  conversionProbability: number;
  expectedPrescriptions: number;
  expectedRevenue: number;
  recommendation: string;
  influencingFactors: {
    doctorHistory: number;
    productFit: number;
    timing: number;
    competition: number;
  };
}

export class SalesAIService {

  async generateCallPlan(userId: string, planDate: Date, territory?: string): Promise<CallPlanResult> {
    const doctorsList = await db.select()
      .from(doctors)
      .where(eq(doctors.userId, userId))
      .limit(50);

    const thirtyDaysAgo = new Date(planDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentVisits = await db.select()
      .from(doctorVisits)
      .where(and(
        eq(doctorVisits.userId, userId),
        gte(doctorVisits.punchInTime, thirtyDaysAgo)
      ))
      .orderBy(desc(doctorVisits.punchInTime));

    const recentSales = await db.select()
      .from(salesEntries)
      .where(and(
        eq(salesEntries.userId, userId),
        gte(salesEntries.date, thirtyDaysAgo)
      ));

    const visitsByDoctor = new Map<string, { count: number; lastVisit: Date; hadSale: boolean }>();
    
    for (const visit of recentVisits) {
      const existing = visitsByDoctor.get(visit.doctorId) || { count: 0, lastVisit: visit.punchInTime, hadSale: false };
      existing.count++;
      if (visit.saleAgreement) existing.hadSale = true;
      visitsByDoctor.set(visit.doctorId, existing);
    }

    const salesByDoctor = new Map<string, number>();
    for (const sale of recentSales) {
      const current = salesByDoctor.get(sale.doctorId) || 0;
      salesByDoctor.set(sale.doctorId, current + parseFloat(sale.totalAmount?.toString() || "0"));
    }

    const suggestedDoctors: DoctorSuggestion[] = [];

    for (const doctor of doctorsList) {
      const visitInfo = visitsByDoctor.get(doctor.id);
      const totalSales = salesByDoctor.get(doctor.id) || 0;
      
      let score = 0;
      let reason = "";
      let priority = 3;

      if (!visitInfo || visitInfo.count === 0) {
        score = 0.9;
        reason = "No recent visits - high priority for coverage";
        priority = 1;
      } else if (visitInfo.count < 2) {
        const daysSinceVisit = Math.floor((planDate.getTime() - visitInfo.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceVisit > 14) {
          score = 0.8;
          reason = `Last visited ${daysSinceVisit} days ago - needs follow-up`;
          priority = 1;
        } else if (daysSinceVisit > 7) {
          score = 0.6;
          reason = "Weekly visit due";
          priority = 2;
        } else {
          score = 0.3;
          reason = "Recently visited";
          priority = 3;
        }
      }

      if (totalSales > 10000) {
        score = Math.min(score + 0.2, 1);
        reason += ". High-value prescriber";
        priority = Math.max(priority - 1, 1);
      }

      if (visitInfo?.hadSale) {
        score = Math.min(score + 0.1, 1);
        reason += ". Previous conversion success";
      }

      const expectedConversion = totalSales > 5000 ? 0.7 : totalSales > 1000 ? 0.5 : 0.3;

      suggestedDoctors.push({
        doctorId: doctor.id,
        doctorName: doctor.name,
        priority,
        score: Number(score.toFixed(4)),
        reason: reason.trim().replace(/^\. /, ""),
        lastVisit: visitInfo?.lastVisit,
        expectedConversion
      });
    }

    suggestedDoctors.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.score - a.score;
    });

    const topDoctors = suggestedDoctors.slice(0, 8);

    const optimizedRoute = this.optimizeRoute(topDoctors, doctorsList);

    const totalEstimatedTime = topDoctors.length * 45 + (topDoctors.length - 1) * 20;
    const totalTravelDistance = (topDoctors.length - 1) * 5;
    const expectedConversions = Math.round(topDoctors.reduce((acc, d) => acc + d.expectedConversion, 0));

    return {
      suggestedDoctors: topDoctors,
      optimizedRoute,
      totalEstimatedTime,
      totalTravelDistance,
      expectedConversions
    };
  }

  private optimizeRoute(suggestedDoctors: DoctorSuggestion[], allDoctors: any[]): RouteStop[] {
    const doctorMap = new Map(allDoctors.map(d => [d.id, d]));
    const route: RouteStop[] = [];
    
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0);

    for (let i = 0; i < suggestedDoctors.length; i++) {
      const suggestion = suggestedDoctors[i];
      const doctor = doctorMap.get(suggestion.doctorId);
      
      const travelTime = i === 0 ? 0 : 15 + Math.floor(Math.random() * 15);
      currentTime = new Date(currentTime.getTime() + travelTime * 60000);
      
      route.push({
        doctorId: suggestion.doctorId,
        doctorName: suggestion.doctorName,
        order: i + 1,
        estimatedTime: currentTime.toTimeString().slice(0, 5),
        travelTime,
        latitude: doctor?.latitude ? parseFloat(doctor.latitude) : undefined,
        longitude: doctor?.longitude ? parseFloat(doctor.longitude) : undefined
      });

      currentTime = new Date(currentTime.getTime() + 45 * 60000);
    }

    return route;
  }

  async generatePerformanceInsights(userId: string): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentVisits = await db.select()
      .from(doctorVisits)
      .where(and(
        eq(doctorVisits.userId, userId),
        gte(doctorVisits.punchInTime, thirtyDaysAgo)
      ));

    const recentSales = await db.select()
      .from(salesEntries)
      .where(and(
        eq(salesEntries.userId, userId),
        gte(salesEntries.date, thirtyDaysAgo)
      ));

    const recentKPIs = await db.select()
      .from(callKPIs)
      .where(and(
        eq(callKPIs.userId, userId),
        gte(callKPIs.date, thirtyDaysAgo)
      ));

    const totalSales = recentSales.reduce((acc, s) => acc + parseFloat(s.totalAmount?.toString() || "0"), 0);
    const totalVisits = recentVisits.length;
    const successfulVisits = recentVisits.filter(v => v.saleAgreement).length;
    const conversionRate = totalVisits > 0 ? successfulVisits / totalVisits : 0;

    if (conversionRate < 0.3 && totalVisits > 5) {
      insights.push({
        insightType: "coverage_gap",
        title: "Conversion Rate Below Target",
        description: `Your conversion rate is ${(conversionRate * 100).toFixed(1)}%. Focus on high-potential doctors to improve results.`,
        priority: "high",
        actionItems: [
          { action: "Review presentation materials", target: "Sales deck", deadline: "This week" },
          { action: "Schedule training session", target: "Product knowledge", deadline: "Next week" }
        ],
        expectedImpact: { salesIncrease: 15, conversionRate: 10 },
        confidenceScore: 0.85
      });
    }

    const salesByProduct = new Map<string, number>();
    for (const sale of recentSales) {
      const current = salesByProduct.get(sale.productId) || 0;
      salesByProduct.set(sale.productId, current + parseFloat(sale.totalAmount?.toString() || "0"));
    }

    const productEntries = Array.from(salesByProduct.entries());
    if (productEntries.length > 0) {
      const topProduct = productEntries.sort((a, b) => b[1] - a[1])[0];
      const lowProducts = productEntries.filter(([_, sales]) => sales < topProduct[1] * 0.3);
      
      if (lowProducts.length > 0) {
        insights.push({
          insightType: "product_opportunity",
          title: "Underperforming Products Identified",
          description: `${lowProducts.length} products have significantly lower sales. Cross-selling opportunities exist.`,
          priority: "medium",
          actionItems: [
            { action: "Promote underperforming products", target: "Top prescribers", deadline: "This month" },
            { action: "Bundle products in presentations", target: "All visits", deadline: "Ongoing" }
          ],
          expectedImpact: { salesIncrease: 20, conversionRate: 5 },
          confidenceScore: 0.75
        });
      }
    }

    const avgCallsPerDay = recentKPIs.length > 0 
      ? recentKPIs.reduce((acc, k) => acc + (k.totalCallsDone || 0), 0) / recentKPIs.length 
      : 0;

    if (avgCallsPerDay < 8) {
      insights.push({
        insightType: "timing",
        title: "Increase Daily Call Volume",
        description: `Average ${avgCallsPerDay.toFixed(1)} calls per day. Industry benchmark is 10-12 calls.`,
        priority: "medium",
        actionItems: [
          { action: "Optimize route planning", target: "Daily schedule", deadline: "Immediately" },
          { action: "Reduce time per call", target: "15-20 min average", deadline: "This week" }
        ],
        expectedImpact: { salesIncrease: 25, conversionRate: 0 },
        confidenceScore: 0.8
      });
    }

    const visitsByDoctor = new Map<string, number>();
    for (const visit of recentVisits) {
      visitsByDoctor.set(visit.doctorId, (visitsByDoctor.get(visit.doctorId) || 0) + 1);
    }

    const singleVisitDoctors = Array.from(visitsByDoctor.entries()).filter(([_, count]) => count === 1);
    if (singleVisitDoctors.length > 3) {
      insights.push({
        insightType: "doctor_focus",
        title: "Follow-Up Opportunity",
        description: `${singleVisitDoctors.length} doctors received only one visit. Follow-ups can increase conversions by 40%.`,
        priority: "high",
        actionItems: [
          { action: "Schedule follow-up visits", target: `${singleVisitDoctors.length} doctors`, deadline: "This week" },
          { action: "Prepare personalized pitches", target: "Each doctor's specialty", deadline: "Before visits" }
        ],
        expectedImpact: { salesIncrease: 30, conversionRate: 15 },
        confidenceScore: 0.9
      });
    }

    return insights;
  }

  async generateTargetAlerts(userId: string): Promise<TargetAlert[]> {
    const alerts: TargetAlert[] = [];
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const progressExpected = dayOfMonth / daysInMonth;

    const mtdSales = await db.select()
      .from(salesEntries)
      .where(and(
        eq(salesEntries.userId, userId),
        gte(salesEntries.date, startOfMonth)
      ));

    const mtdVisits = await db.select()
      .from(doctorVisits)
      .where(and(
        eq(doctorVisits.userId, userId),
        gte(doctorVisits.punchInTime, startOfMonth)
      ));

    const totalSales = mtdSales.reduce((acc, s) => acc + parseFloat(s.totalAmount?.toString() || "0"), 0);
    const monthlyTarget = 100000;
    const expectedSales = monthlyTarget * progressExpected;
    const salesVariance = ((totalSales - expectedSales) / expectedSales) * 100;

    if (salesVariance < -20) {
      alerts.push({
        alertType: "behind_target",
        severity: salesVariance < -40 ? "critical" : "warning",
        title: "Sales Target Behind Schedule",
        description: `MTD sales Rs. ${totalSales.toLocaleString()} vs expected Rs. ${expectedSales.toLocaleString()}`,
        metricName: "sales",
        currentValue: totalSales,
        targetValue: expectedSales,
        variance: salesVariance,
        suggestedActions: [
          "Focus on high-value doctors for quick wins",
          "Increase daily call volume",
          "Follow up on pending orders"
        ]
      });
    }

    const visitTarget = 120;
    const expectedVisits = visitTarget * progressExpected;
    const visitsVariance = ((mtdVisits.length - expectedVisits) / expectedVisits) * 100;

    if (visitsVariance < -15) {
      alerts.push({
        alertType: "behind_target",
        severity: visitsVariance < -30 ? "critical" : "warning",
        title: "Visit Target Behind Schedule",
        description: `MTD visits ${mtdVisits.length} vs expected ${Math.round(expectedVisits)}`,
        metricName: "visits",
        currentValue: mtdVisits.length,
        targetValue: expectedVisits,
        variance: visitsVariance,
        suggestedActions: [
          "Optimize route to cover more doctors",
          "Reduce time spent per visit",
          "Schedule more appointments"
        ]
      });
    }

    const successfulVisits = mtdVisits.filter(v => v.saleAgreement).length;
    const conversionRate = mtdVisits.length > 0 ? (successfulVisits / mtdVisits.length) * 100 : 0;
    const targetConversion = 35;

    if (conversionRate < targetConversion && mtdVisits.length > 10) {
      alerts.push({
        alertType: "declining_performance",
        severity: conversionRate < 20 ? "critical" : "warning",
        title: "Conversion Rate Below Target",
        description: `Current conversion ${conversionRate.toFixed(1)}% vs target ${targetConversion}%`,
        metricName: "conversions",
        currentValue: conversionRate,
        targetValue: targetConversion,
        variance: ((conversionRate - targetConversion) / targetConversion) * 100,
        suggestedActions: [
          "Review and improve pitch quality",
          "Focus on receptive doctors",
          "Request manager coaching session"
        ]
      });
    }

    const visitsByDoctor = new Map<string, number>();
    for (const visit of mtdVisits) {
      visitsByDoctor.set(visit.doctorId, (visitsByDoctor.get(visit.doctorId) || 0) + 1);
    }

    const doctorsList = await db.select().from(doctors).where(eq(doctors.userId, userId)).limit(50);
    const unvisitedDoctors = doctorsList.filter(d => !visitsByDoctor.has(d.id));

    if (unvisitedDoctors.length > doctorsList.length * 0.3 && doctorsList.length > 10) {
      alerts.push({
        alertType: "undervisited_doctor",
        severity: "warning",
        title: "Coverage Gap Detected",
        description: `${unvisitedDoctors.length} of ${doctorsList.length} doctors not visited this month`,
        metricName: "coverage",
        currentValue: doctorsList.length - unvisitedDoctors.length,
        targetValue: doctorsList.length,
        variance: ((unvisitedDoctors.length / doctorsList.length) * -100),
        suggestedActions: [
          `Schedule visits for ${unvisitedDoctors.slice(0, 5).map(d => d.name).join(", ")}`,
          "Review territory coverage strategy",
          "Prioritize based on potential"
        ]
      });
    }

    return alerts;
  }

  async generateSalesForecast(
    userId: string,
    territory?: string,
    doctorId?: string,
    productId?: string,
    period: string = "monthly"
  ): Promise<ForecastResult> {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);

    if (period === "weekly") {
      startDate.setDate(startDate.getDate() + 1);
      endDate.setDate(endDate.getDate() + 7);
    } else if (period === "monthly") {
      startDate.setMonth(startDate.getMonth() + 1, 1);
      endDate.setMonth(endDate.getMonth() + 2, 0);
    } else {
      startDate.setMonth(startDate.getMonth() + 1, 1);
      endDate.setMonth(endDate.getMonth() + 4, 0);
    }

    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    let query = db.select().from(salesEntries)
      .where(and(
        eq(salesEntries.userId, userId),
        gte(salesEntries.date, threeMonthsAgo)
      ));

    const historicalSales = await query;

    const salesByWeek: { date: string; sales: number }[] = [];
    const weeklyTotals = new Map<string, number>();
    
    for (const sale of historicalSales) {
      const weekStart = new Date(sale.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      weeklyTotals.set(weekKey, (weeklyTotals.get(weekKey) || 0) + parseFloat(sale.totalAmount?.toString() || "0"));
    }

    Array.from(weeklyTotals.entries()).forEach(([date, sales]) => {
      salesByWeek.push({ date, sales });
    });

    salesByWeek.sort((a, b) => a.date.localeCompare(b.date));

    let predictedSales = 0;
    let predictedQuantity = 0;

    if (salesByWeek.length > 0) {
      const recentWeeks = salesByWeek.slice(-4);
      const avgWeeklySales = recentWeeks.reduce((acc, w) => acc + w.sales, 0) / recentWeeks.length;

      if (salesByWeek.length >= 4) {
        const firstHalf = salesByWeek.slice(0, Math.floor(salesByWeek.length / 2));
        const secondHalf = salesByWeek.slice(Math.floor(salesByWeek.length / 2));
        const firstAvg = firstHalf.reduce((acc, w) => acc + w.sales, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((acc, w) => acc + w.sales, 0) / secondHalf.length;
        const trend = (secondAvg - firstAvg) / firstAvg;

        const weeks = period === "weekly" ? 1 : period === "monthly" ? 4 : 13;
        predictedSales = avgWeeklySales * weeks * (1 + trend * 0.5);
      } else {
        const weeks = period === "weekly" ? 1 : period === "monthly" ? 4 : 13;
        predictedSales = avgWeeklySales * weeks;
      }

      const avgQuantity = historicalSales.reduce((acc, s) => acc + s.quantity, 0) / Math.max(historicalSales.length, 1);
      predictedQuantity = Math.round(avgQuantity * (predictedSales / (avgWeeklySales || 1)));
    }

    const confidenceScore = Math.min(0.5 + (salesByWeek.length * 0.05), 0.9);
    const marginOfError = predictedSales * (1 - confidenceScore);

    return {
      territory,
      forecastPeriod: period,
      startDate,
      endDate,
      predictedSales: Number(predictedSales.toFixed(2)),
      predictedQuantity,
      confidenceInterval: {
        lower: Number((predictedSales - marginOfError).toFixed(2)),
        upper: Number((predictedSales + marginOfError).toFixed(2))
      },
      confidenceScore: Number(confidenceScore.toFixed(4)),
      historicalBasis: salesByWeek.slice(-8)
    };
  }

  async predictSampleConversion(
    userId: string,
    doctorId: string,
    productId: string,
    sampleQuantity: number
  ): Promise<ConversionPrediction> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);

    const doctorSales = await db.select()
      .from(salesEntries)
      .where(and(
        eq(salesEntries.doctorId, doctorId),
        eq(salesEntries.productId, productId),
        gte(salesEntries.date, thirtyDaysAgo)
      ));

    const doctorVisitsData = await db.select()
      .from(doctorVisits)
      .where(and(
        eq(doctorVisits.doctorId, doctorId),
        eq(doctorVisits.userId, userId),
        gte(doctorVisits.punchInTime, thirtyDaysAgo)
      ));

    const productData = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    let doctorHistoryScore = 0.3;
    if (doctorSales.length > 0) {
      doctorHistoryScore = Math.min(0.3 + (doctorSales.length * 0.1), 0.9);
    }

    let productFitScore = 0.5;
    if (productData.length > 0) {
      const totalProductSales = doctorSales.reduce((acc, s) => acc + parseFloat(s.totalAmount?.toString() || "0"), 0);
      productFitScore = totalProductSales > 5000 ? 0.9 : totalProductSales > 1000 ? 0.7 : 0.5;
    }

    let timingScore = 0.5;
    const recentVisit = doctorVisitsData.find(v => {
      const daysSince = (Date.now() - new Date(v.punchInTime).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 7;
    });
    if (recentVisit) {
      timingScore = 0.8;
    }

    const competitionScore = 0.6;

    const conversionProbability = (
      doctorHistoryScore * 0.3 +
      productFitScore * 0.35 +
      timingScore * 0.2 +
      competitionScore * 0.15
    );

    const avgSaleValue = doctorSales.length > 0
      ? doctorSales.reduce((acc, s) => acc + parseFloat(s.totalAmount?.toString() || "0"), 0) / doctorSales.length
      : 500;

    const expectedPrescriptions = Math.round(sampleQuantity * conversionProbability);
    const expectedRevenue = expectedPrescriptions * avgSaleValue;

    let recommendation: string;
    if (conversionProbability >= 0.7) {
      recommendation = "prioritize";
    } else if (conversionProbability >= 0.4) {
      recommendation = "distribute";
    } else {
      recommendation = "hold";
    }

    return {
      conversionProbability: Number(conversionProbability.toFixed(4)),
      expectedPrescriptions,
      expectedRevenue: Number(expectedRevenue.toFixed(2)),
      recommendation,
      influencingFactors: {
        doctorHistory: Number(doctorHistoryScore.toFixed(4)),
        productFit: Number(productFitScore.toFixed(4)),
        timing: Number(timingScore.toFixed(4)),
        competition: Number(competitionScore.toFixed(4))
      }
    };
  }

  async saveCallPlan(callPlan: any) {
    const result = await db.insert(aiCallPlans).values(callPlan).returning();
    return result[0];
  }

  async savePerformanceInsight(insight: any) {
    const result = await db.insert(mrPerformanceInsights).values(insight).returning();
    return result[0];
  }

  async saveTargetAlert(alert: any) {
    const result = await db.insert(targetAchievementAlerts).values(alert).returning();
    return result[0];
  }

  async saveSalesForecast(forecast: any) {
    const result = await db.insert(salesForecasts).values(forecast).returning();
    return result[0];
  }

  async saveSampleConversionPrediction(prediction: any) {
    const result = await db.insert(sampleConversionPredictions).values(prediction).returning();
    return result[0];
  }

  async getCallPlans(userId: string) {
    return db.select()
      .from(aiCallPlans)
      .where(eq(aiCallPlans.userId, userId))
      .orderBy(desc(aiCallPlans.createdAt))
      .limit(10);
  }

  async getPerformanceInsights(userId: string) {
    return db.select()
      .from(mrPerformanceInsights)
      .where(eq(mrPerformanceInsights.userId, userId))
      .orderBy(desc(mrPerformanceInsights.createdAt))
      .limit(20);
  }

  async getActiveAlerts(userId: string) {
    return db.select()
      .from(targetAchievementAlerts)
      .where(and(
        eq(targetAchievementAlerts.userId, userId),
        eq(targetAchievementAlerts.status, "active")
      ))
      .orderBy(desc(targetAchievementAlerts.createdAt))
      .limit(20);
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    return db.update(targetAchievementAlerts)
      .set({ 
        status: "acknowledged", 
        acknowledgedBy: userId, 
        acknowledgedAt: new Date() 
      })
      .where(eq(targetAchievementAlerts.id, alertId))
      .returning();
  }

  async getSalesForecasts(userId?: string, territory?: string) {
    let query = db.select().from(salesForecasts);
    if (userId) {
      query = query.where(eq(salesForecasts.userId, userId)) as any;
    }
    return query.orderBy(desc(salesForecasts.createdAt)).limit(20);
  }
}

export const salesAI = new SalesAIService();
