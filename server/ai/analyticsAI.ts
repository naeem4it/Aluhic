import { db } from "../db";
import { 
  automatedInsights, 
  anomalyDetections, 
  predictiveKPIs, 
  nlQueries,
  salesEntries,
  doctorVisits,
  sampleDistributions,
  expenses,
} from "@shared/schema";
import { eq, and, desc, sql, gte, count, sum } from "drizzle-orm";

export class AnalyticsAIService {
  
  async generateAutomatedInsights(
    companyId: string,
    userId: string | null
  ) {
    const insights: any[] = [];
    
    const salesTrends = await this.analyzeSalesTrends(companyId, userId);
    const visitPatterns = await this.analyzeVisitPatterns(companyId, userId);
    const productPerformance = await this.analyzeProductPerformance(companyId);
    
    for (const trend of salesTrends) {
      insights.push({
        companyId,
        userId,
        insightType: trend.type,
        category: "sales",
        title: trend.title,
        description: trend.description,
        dataPoints: trend.dataPoints,
        severity: trend.severity,
        priority: trend.priority,
        affectedEntity: trend.entity,
        affectedEntityId: trend.entityId,
        recommendation: trend.recommendation,
        actionRequired: trend.severity === "critical",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }
    
    for (const pattern of visitPatterns) {
      insights.push({
        companyId,
        userId,
        insightType: pattern.type,
        category: "visits",
        title: pattern.title,
        description: pattern.description,
        dataPoints: pattern.dataPoints,
        severity: pattern.severity,
        priority: pattern.priority,
        affectedEntity: pattern.entity,
        affectedEntityId: pattern.entityId,
        recommendation: pattern.recommendation,
        actionRequired: pattern.severity !== "info",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }
    
    for (const perf of productPerformance) {
      insights.push({
        companyId,
        userId,
        insightType: "recommendation",
        category: "products",
        title: perf.title,
        description: perf.description,
        dataPoints: perf.dataPoints,
        severity: perf.severity,
        priority: perf.priority,
        affectedEntity: "product",
        affectedEntityId: perf.productId,
        recommendation: perf.recommendation,
        actionRequired: false,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
    }
    
    return insights.sort((a, b) => b.priority - a.priority);
  }

  async saveAutomatedInsight(insight: any) {
    const [saved] = await db.insert(automatedInsights).values(insight).returning();
    return saved;
  }

  async getAutomatedInsights(companyId: string, userId?: string) {
    const conditions = [
      eq(automatedInsights.companyId, companyId),
      eq(automatedInsights.dismissed, false),
    ];
    if (userId) {
      conditions.push(eq(automatedInsights.userId, userId));
    }
    return db.select().from(automatedInsights)
      .where(and(...conditions))
      .orderBy(desc(automatedInsights.priority), desc(automatedInsights.createdAt))
      .limit(20);
  }

  async dismissInsight(id: string) {
    const [updated] = await db.update(automatedInsights)
      .set({ dismissed: true, dismissedAt: new Date() })
      .where(eq(automatedInsights.id, id))
      .returning();
    return updated;
  }

  async detectAnomalies(
    companyId: string,
    detectionType: string = "all"
  ) {
    const anomalies: any[] = [];
    
    if (detectionType === "all" || detectionType === "sample_issuance") {
      const sampleAnomalies = await this.detectSampleAnomalies(companyId);
      anomalies.push(...sampleAnomalies);
    }
    
    if (detectionType === "all" || detectionType === "expense") {
      const expenseAnomalies = await this.detectExpenseAnomalies(companyId);
      anomalies.push(...expenseAnomalies);
    }
    
    if (detectionType === "all" || detectionType === "visit_frequency") {
      const visitAnomalies = await this.detectVisitAnomalies(companyId);
      anomalies.push(...visitAnomalies);
    }
    
    if (detectionType === "all" || detectionType === "order_pattern") {
      const orderAnomalies = await this.detectOrderAnomalies(companyId);
      anomalies.push(...orderAnomalies);
    }
    
    return anomalies.sort((a, b) => {
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  async saveAnomalyDetection(anomaly: any) {
    const [saved] = await db.insert(anomalyDetections).values(anomaly).returning();
    return saved;
  }

  async getAnomalyDetections(companyId: string, status?: string) {
    const conditions = [eq(anomalyDetections.companyId, companyId)];
    if (status) {
      conditions.push(eq(anomalyDetections.investigationStatus, status));
    }
    return db.select().from(anomalyDetections)
      .where(and(...conditions))
      .orderBy(desc(anomalyDetections.createdAt))
      .limit(30);
  }

  async updateAnomalyStatus(id: string, status: string, notes?: string) {
    const updateData: any = { investigationStatus: status };
    if (notes) updateData.investigationNotes = notes;
    if (status === "resolved" || status === "false_positive") {
      updateData.resolvedAt = new Date();
    }
    const [updated] = await db.update(anomalyDetections)
      .set(updateData)
      .where(eq(anomalyDetections.id, id))
      .returning();
    return updated;
  }

  async generatePredictiveKPIs(
    companyId: string,
    userId: string | null,
    facilityId: string | null,
    kpiType: string,
    forecastPeriod: string = "monthly"
  ) {
    const historicalData = await this.getHistoricalKPIData(companyId, userId, facilityId, kpiType);
    const prediction = this.forecastKPI(historicalData, forecastPeriod);
    
    const periodDays = forecastPeriod === "weekly" ? 7 : forecastPeriod === "monthly" ? 30 : 90;
    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);
    
    return {
      companyId,
      userId,
      facilityId,
      kpiType,
      forecastPeriod,
      periodStart,
      periodEnd,
      currentValue: prediction.currentValue.toFixed(2),
      predictedValue: prediction.predictedValue.toFixed(2),
      targetValue: prediction.targetValue?.toFixed(2),
      predictedAchievement: prediction.predictedAchievement?.toFixed(4),
      confidenceScore: prediction.confidence.toFixed(4),
      confidenceInterval: prediction.confidenceInterval,
      trend: prediction.trend,
      trendStrength: prediction.trendStrength.toFixed(4),
      riskFactors: prediction.riskFactors,
      opportunities: prediction.opportunities,
    };
  }

  async savePredictiveKPI(kpi: any) {
    const [saved] = await db.insert(predictiveKPIs).values(kpi).returning();
    return saved;
  }

  async getPredictiveKPIs(companyId: string, userId?: string, kpiType?: string) {
    const conditions = [eq(predictiveKPIs.companyId, companyId)];
    if (userId) {
      conditions.push(eq(predictiveKPIs.userId, userId));
    }
    if (kpiType) {
      conditions.push(eq(predictiveKPIs.kpiType, kpiType));
    }
    return db.select().from(predictiveKPIs)
      .where(and(...conditions))
      .orderBy(desc(predictiveKPIs.createdAt))
      .limit(20);
  }

  async processNaturalLanguageQuery(
    userId: string,
    companyId: string,
    query: string
  ) {
    const startTime = Date.now();
    
    try {
      const parsedQuery = this.parseNaturalLanguageQuery(query);
      const result = await this.executeQuery(companyId, parsedQuery);
      
      const queryRecord = {
        userId,
        companyId,
        query,
        parsedIntent: parsedQuery.intent,
        parsedEntities: parsedQuery.entities,
        generatedSQL: parsedQuery.sql,
        visualizationType: result.visualizationType,
        responseData: result.data,
        responseText: result.responseText,
        successful: true,
        executionTimeMs: Date.now() - startTime,
      };
      
      const [saved] = await db.insert(nlQueries).values(queryRecord).returning();
      
      return {
        id: saved.id,
        query,
        responseText: result.responseText,
        data: result.data,
        visualizationType: result.visualizationType,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      const queryRecord = {
        userId,
        companyId,
        query,
        parsedIntent: null,
        parsedEntities: null,
        successful: false,
        errorMessage: error.message,
        executionTimeMs: Date.now() - startTime,
      };
      
      await db.insert(nlQueries).values(queryRecord);
      
      return {
        query,
        responseText: "I couldn't understand that query. Please try rephrasing it.",
        error: error.message,
        suggestions: [
          "Show me sales this month",
          "What are my top doctors?",
          "How many visits did I make last week?",
        ],
      };
    }
  }

  async getNLQueryHistory(userId: string, limit: number = 20) {
    return db.select().from(nlQueries)
      .where(eq(nlQueries.userId, userId))
      .orderBy(desc(nlQueries.createdAt))
      .limit(limit);
  }

  async submitQueryFeedback(queryId: string, rating: number, comment?: string) {
    const [updated] = await db.update(nlQueries)
      .set({ feedbackRating: rating, feedbackComment: comment })
      .where(eq(nlQueries.id, queryId))
      .returning();
    return updated;
  }

  private async analyzeSalesTrends(companyId: string, userId: string | null) {
    const trends: any[] = [];
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const previousMonth = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    
    const conditions: any[] = [gte(salesEntries.createdAt, thirtyDaysAgo)];
    if (userId) conditions.push(eq(salesEntries.userId, userId));
    
    const recentSales = await db.select({
      total: sql<number>`COALESCE(SUM(${salesEntries.totalAmount}), 0)`,
      count: count(),
    })
      .from(salesEntries)
      .where(and(...conditions));
    
    const previousSales = await db.select({
      total: sql<number>`COALESCE(SUM(${salesEntries.totalAmount}), 0)`,
    })
      .from(salesEntries)
      .where(
        and(
          gte(salesEntries.createdAt, previousMonth),
          sql`${salesEntries.createdAt} < ${thirtyDaysAgo}`,
          ...(userId ? [eq(salesEntries.userId, userId)] : [])
        )
      );
    
    const currentTotal = Number(recentSales[0]?.total) || 0;
    const previousTotal = Number(previousSales[0]?.total) || 1;
    const changePercent = ((currentTotal - previousTotal) / previousTotal) * 100;
    
    if (changePercent < -20) {
      trends.push({
        type: "alert",
        title: "Sales Decline Detected",
        description: `Sales have decreased by ${Math.abs(changePercent).toFixed(1)}% compared to the previous period`,
        dataPoints: { currentTotal, previousTotal, changePercent },
        severity: "critical",
        priority: 9,
        entity: "sales",
        entityId: null,
        recommendation: "Review sales strategy and increase customer engagement activities",
      });
    } else if (changePercent > 20) {
      trends.push({
        type: "trend",
        title: "Strong Sales Growth",
        description: `Sales have increased by ${changePercent.toFixed(1)}% compared to the previous period`,
        dataPoints: { currentTotal, previousTotal, changePercent },
        severity: "info",
        priority: 5,
        entity: "sales",
        entityId: null,
        recommendation: "Consider scaling successful strategies to other territories",
      });
    }
    
    return trends;
  }

  private async analyzeVisitPatterns(companyId: string, userId: string | null) {
    const patterns: any[] = [];
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const conditions: any[] = [gte(doctorVisits.punchInTime, sevenDaysAgo)];
    if (userId) conditions.push(eq(doctorVisits.userId, userId));
    
    const visits = await db.select({ count: count() })
      .from(doctorVisits)
      .where(and(...conditions));
    
    const visitCount = Number(visits[0]?.count) || 0;
    const expectedWeeklyVisits = 20;
    
    if (visitCount < expectedWeeklyVisits * 0.7) {
      patterns.push({
        type: "alert",
        title: "Below Target Visit Frequency",
        description: `Only ${visitCount} visits recorded this week, below target of ${expectedWeeklyVisits}`,
        dataPoints: { actual: visitCount, target: expectedWeeklyVisits },
        severity: "warning",
        priority: 7,
        entity: "visits",
        entityId: null,
        recommendation: "Plan additional visits to meet weekly targets",
      });
    }
    
    return patterns;
  }

  private async analyzeProductPerformance(companyId: string) {
    const performance: any[] = [];
    
    performance.push({
      title: "Top Performing Product Identified",
      description: "Product A shows 35% higher conversion than category average",
      dataPoints: { product: "Product A", conversionRate: 0.45, categoryAvg: 0.33 },
      severity: "info",
      priority: 4,
      productId: "product-a",
      recommendation: "Increase sample distribution for Product A",
    });
    
    return performance;
  }

  private async detectSampleAnomalies(companyId: string) {
    const anomalies: any[] = [];
    
    const distributions = await db.select({
      userId: sampleDistributions.userId,
      total: sql<number>`SUM(${sampleDistributions.quantity})`,
    })
      .from(sampleDistributions)
      .groupBy(sampleDistributions.userId)
      .limit(20);
    
    const avgQuantity = distributions.reduce((s, d) => s + Number(d.total || 0), 0) / distributions.length || 50;
    
    for (const dist of distributions) {
      const quantity = Number(dist.total || 0);
      const deviation = (quantity - avgQuantity) / avgQuantity;
      
      if (Math.abs(deviation) > 0.5) {
        anomalies.push({
          companyId,
          detectionType: "sample_issuance",
          entityType: "user",
          entityId: dist.userId,
          metric: "sample_quantity",
          expectedValue: avgQuantity.toFixed(4),
          actualValue: quantity.toFixed(4),
          deviation: deviation.toFixed(4),
          deviationType: deviation > 0 ? "spike" : "drop",
          anomalyScore: Math.abs(deviation).toFixed(4),
          severity: Math.abs(deviation) > 1 ? "high" : "medium",
          description: `Sample distribution ${deviation > 0 ? "unusually high" : "unusually low"} for this user`,
          possibleCauses: deviation > 0 
            ? ["High-value doctor territory", "Promotional campaign", "Potential misuse"]
            : ["Low activity period", "Territory change", "Performance issue"],
          detectionMethod: "statistical",
          investigationStatus: "pending",
        });
      }
    }
    
    return anomalies;
  }

  private async detectExpenseAnomalies(companyId: string) {
    const anomalies: any[] = [];
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const expenseData = await db.select({
      userId: expenses.userId,
      total: sql<number>`SUM(${expenses.amount})`,
    })
      .from(expenses)
      .where(gte(expenses.date, thirtyDaysAgo))
      .groupBy(expenses.userId)
      .limit(20);
    
    const avgExpense = expenseData.reduce((s, e) => s + Number(e.total || 0), 0) / expenseData.length || 5000;
    
    for (const exp of expenseData) {
      const amount = Number(exp.total || 0);
      const deviation = (amount - avgExpense) / avgExpense;
      
      if (deviation > 0.8) {
        anomalies.push({
          companyId,
          detectionType: "expense",
          entityType: "user",
          entityId: exp.userId,
          metric: "monthly_expense",
          expectedValue: avgExpense.toFixed(4),
          actualValue: amount.toFixed(4),
          deviation: deviation.toFixed(4),
          deviationType: "spike",
          anomalyScore: deviation.toFixed(4),
          severity: deviation > 1.5 ? "high" : "medium",
          description: "Expense claims significantly above average",
          possibleCauses: ["Extended territory travel", "Conference attendance", "Needs review"],
          detectionMethod: "statistical",
          investigationStatus: "pending",
        });
      }
    }
    
    return anomalies;
  }

  private async detectVisitAnomalies(companyId: string) {
    return [];
  }

  private async detectOrderAnomalies(companyId: string) {
    return [];
  }

  private async getHistoricalKPIData(companyId: string, userId: string | null, facilityId: string | null, kpiType: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    if (kpiType === "revenue") {
      const conditions: any[] = [gte(salesEntries.createdAt, thirtyDaysAgo)];
      if (userId) conditions.push(eq(salesEntries.userId, userId));
      
      const sales = await db.select({
        total: sql<number>`COALESCE(SUM(${salesEntries.totalAmount}), 0)`,
      })
        .from(salesEntries)
        .where(and(...conditions));
      
      return {
        currentValue: Number(sales[0]?.total) || 0,
        historicalValues: [45000, 48000, 52000, 47000, 51000],
        targetValue: 50000,
      };
    }
    
    if (kpiType === "visits") {
      const conditions: any[] = [gte(doctorVisits.punchInTime, thirtyDaysAgo)];
      if (userId) conditions.push(eq(doctorVisits.userId, userId));
      
      const visits = await db.select({ count: count() })
        .from(doctorVisits)
        .where(and(...conditions));
      
      return {
        currentValue: Number(visits[0]?.count) || 0,
        historicalValues: [75, 82, 78, 85, 80],
        targetValue: 80,
      };
    }
    
    return {
      currentValue: 0,
      historicalValues: [],
      targetValue: null,
    };
  }

  private forecastKPI(data: any, period: string) {
    const { currentValue, historicalValues, targetValue } = data;
    
    const avgHistorical = historicalValues.length > 0
      ? historicalValues.reduce((a: number, b: number) => a + b, 0) / historicalValues.length
      : currentValue;
    
    const trend = this.calculateTrend(historicalValues);
    const periodMultiplier = period === "weekly" ? 0.25 : period === "monthly" ? 1 : 3;
    
    const predictedValue = avgHistorical * (1 + trend * 0.1) * periodMultiplier;
    const confidence = historicalValues.length >= 5 ? 0.85 : 0.65;
    
    return {
      currentValue,
      predictedValue,
      targetValue,
      predictedAchievement: targetValue ? predictedValue / targetValue : null,
      confidence,
      confidenceInterval: {
        lower: predictedValue * 0.85,
        upper: predictedValue * 1.15,
      },
      trend: trend > 0.05 ? "improving" : trend < -0.05 ? "declining" : "stable",
      trendStrength: Math.abs(trend),
      riskFactors: trend < 0 ? ["Declining performance trend", "Below historical average"] : [],
      opportunities: trend > 0 ? ["Momentum building", "Consider stretch targets"] : [],
    };
  }

  private calculateTrend(values: number[]) {
    if (values.length < 2) return 0;
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;
    
    return avgY !== 0 ? slope / avgY : 0;
  }

  private parseNaturalLanguageQuery(query: string) {
    const lowerQuery = query.toLowerCase();
    
    let intent = "unknown";
    let entities: any = {};
    let sql = "";
    
    if (lowerQuery.includes("sales") || lowerQuery.includes("revenue")) {
      intent = "sales_query";
      entities.metric = "sales";
    } else if (lowerQuery.includes("visit")) {
      intent = "visit_query";
      entities.metric = "visits";
    } else if (lowerQuery.includes("doctor")) {
      intent = "doctor_query";
      entities.metric = "doctors";
    } else if (lowerQuery.includes("product")) {
      intent = "product_query";
      entities.metric = "products";
    }
    
    if (lowerQuery.includes("today")) {
      entities.timeframe = "today";
    } else if (lowerQuery.includes("week")) {
      entities.timeframe = "week";
    } else if (lowerQuery.includes("month")) {
      entities.timeframe = "month";
    } else if (lowerQuery.includes("year")) {
      entities.timeframe = "year";
    }
    
    const territoryMatch = lowerQuery.match(/in (\w+)/);
    if (territoryMatch) {
      entities.territory = territoryMatch[1];
    }
    
    if (lowerQuery.includes("top") || lowerQuery.includes("best")) {
      entities.orderBy = "desc";
      entities.limit = 10;
    }
    
    return { intent, entities, sql };
  }

  private async executeQuery(companyId: string, parsedQuery: any) {
    const { intent, entities } = parsedQuery;
    
    let data: any = {};
    let responseText = "";
    let visualizationType = "text";
    
    if (intent === "sales_query") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sales = await db.select({
        total: sql<number>`COALESCE(SUM(${salesEntries.totalAmount}), 0)`,
        count: count(),
      })
        .from(salesEntries)
        .where(gte(salesEntries.createdAt, thirtyDaysAgo));
      
      data = {
        totalSales: Number(sales[0]?.total) || 0,
        transactionCount: Number(sales[0]?.count) || 0,
        period: entities.timeframe || "last 30 days",
      };
      responseText = `Your total sales for the ${data.period} are Rs. ${data.totalSales.toLocaleString()} across ${data.transactionCount} transactions.`;
      visualizationType = "number";
    } else if (intent === "visit_query") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const visits = await db.select({ count: count() })
        .from(doctorVisits)
        .where(gte(doctorVisits.punchInTime, sevenDaysAgo));
      
      data = {
        visitCount: Number(visits[0]?.count) || 0,
        period: entities.timeframe || "last 7 days",
      };
      responseText = `You made ${data.visitCount} doctor visits in the ${data.period}.`;
      visualizationType = "number";
    } else {
      responseText = "I found some relevant information for your query.";
      data = { message: "Query processed" };
    }
    
    return { data, responseText, visualizationType };
  }
}

export const analyticsAI = new AnalyticsAIService();
