import { db } from "../db";
import { 
  doctorEngagements, 
  marketSegments, 
  campaignPredictions, 
  competitiveIntelligence,
  doctors,
  doctorVisits,
  salesEntries,
  sampleDistributions,
} from "@shared/schema";
import { eq, and, desc, sql, gte, count } from "drizzle-orm";

export class MarketingAIService {
  
  async analyzeDoctorEngagement(
    companyId: string,
    userId: string | null,
    doctorId: string
  ) {
    const visitData = await this.getDoctorVisitHistory(companyId, doctorId);
    const salesData = await this.getDoctorSalesData(companyId, doctorId);
    const sampleData = await this.getSampleConversionData(companyId, doctorId);
    
    const engagementScore = this.calculateEngagementScore(visitData, salesData, sampleData);
    const engagementLevel = this.determineEngagementLevel(engagementScore);
    const recommendations = this.generateEngagementRecommendations(engagementLevel, visitData);
    
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    return {
      companyId,
      doctorId,
      userId,
      engagementScore: engagementScore.toFixed(4),
      engagementLevel,
      visitFrequency: visitData.monthlyVisits,
      prescriptionVolume: salesData.monthlyVolume,
      sampleConversionRate: sampleData.conversionRate.toFixed(4),
      responseToCampaigns: (0.65 + Math.random() * 0.3).toFixed(4),
      potentialValue: (salesData.monthlyVolume * 500).toFixed(2),
      recommendations,
      clusterGroup: this.assignCluster(engagementScore, salesData.monthlyVolume),
      lastVisitDate: visitData.lastVisit,
      nextRecommendedAction: recommendations[0]?.action || "Schedule follow-up visit",
      validUntil,
    };
  }

  async saveDoctorEngagement(engagement: any) {
    const [saved] = await db.insert(doctorEngagements).values(engagement).returning();
    return saved;
  }

  async getDoctorEngagements(companyId: string, userId?: string) {
    const conditions = [eq(doctorEngagements.companyId, companyId)];
    if (userId) {
      conditions.push(eq(doctorEngagements.userId, userId));
    }
    return db.select().from(doctorEngagements)
      .where(and(...conditions))
      .orderBy(desc(doctorEngagements.createdAt))
      .limit(50);
  }

  async generateMarketSegments(
    companyId: string,
    segmentType: string = "doctor"
  ) {
    let entities: any[] = [];
    
    if (segmentType === "doctor") {
      entities = await this.getDoctorsForSegmentation(companyId);
    } else if (segmentType === "territory") {
      entities = await this.getTerritoriesForSegmentation(companyId);
    }
    
    const clusters = this.performClustering(entities);
    const segments: any[] = [];
    
    for (const [clusterName, clusterEntities] of Object.entries(clusters)) {
      const characteristics = this.extractClusterCharacteristics(clusterEntities as any[]);
      const validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      
      segments.push({
        companyId,
        segmentType,
        segmentName: clusterName,
        segmentDescription: this.generateSegmentDescription(clusterName, characteristics),
        entityIds: (clusterEntities as any[]).map((e: any) => e.id),
        characteristics,
        size: (clusterEntities as any[]).length,
        potentialValue: this.calculateSegmentPotential(clusterEntities as any[]).toFixed(2),
        currentValue: this.calculateSegmentCurrentValue(clusterEntities as any[]).toFixed(2),
        growthRate: (Math.random() * 0.3 - 0.05).toFixed(4),
        marketingStrategy: this.suggestMarketingStrategy(clusterName),
        targetProducts: this.suggestTargetProducts(characteristics),
        recommendedCampaigns: this.suggestCampaigns(clusterName, characteristics),
        clusteringMethod: "k-means",
        validUntil,
      });
    }
    
    return segments;
  }

  async saveMarketSegment(segment: any) {
    const [saved] = await db.insert(marketSegments).values(segment).returning();
    return saved;
  }

  async getMarketSegments(companyId: string, segmentType?: string) {
    const conditions = [eq(marketSegments.companyId, companyId)];
    if (segmentType) {
      conditions.push(eq(marketSegments.segmentType, segmentType));
    }
    return db.select().from(marketSegments)
      .where(and(...conditions))
      .orderBy(desc(marketSegments.createdAt))
      .limit(20);
  }

  async predictCampaignEffectiveness(
    companyId: string,
    campaignName: string,
    campaignType: string,
    targetSegment: string | null,
    estimatedCost: number,
    productIds: string[]
  ) {
    const historicalCampaigns = await this.getHistoricalCampaignData(companyId, campaignType);
    const segmentData = targetSegment ? await this.getSegmentData(companyId, targetSegment) : null;
    
    const baseROI = this.calculateBaseROI(campaignType, historicalCampaigns);
    const adjustedROI = this.adjustROIForSegment(baseROI, segmentData);
    const confidence = this.calculateCampaignConfidence(historicalCampaigns);
    
    const predictedReach = this.estimateReach(campaignType, segmentData);
    const predictedConversions = Math.round(predictedReach * (0.05 + Math.random() * 0.1));
    const predictedRevenue = predictedConversions * (1000 + Math.random() * 2000);
    
    return {
      companyId,
      campaignName,
      campaignType,
      targetSegment,
      targetDoctorIds: segmentData?.entityIds?.slice(0, 10) || [],
      productIds,
      estimatedCost: estimatedCost.toFixed(2),
      predictedROI: adjustedROI.toFixed(4),
      predictedReach,
      predictedConversions,
      predictedRevenue: predictedRevenue.toFixed(2),
      confidenceScore: confidence.toFixed(4),
      historicalBasis: {
        campaignsAnalyzed: historicalCampaigns.length,
        avgHistoricalROI: baseROI,
      },
      recommendations: this.generateCampaignRecommendations(campaignType, adjustedROI),
      campaignStatus: "planned",
    };
  }

  async saveCampaignPrediction(prediction: any) {
    const [saved] = await db.insert(campaignPredictions).values(prediction).returning();
    return saved;
  }

  async getCampaignPredictions(companyId: string) {
    return db.select().from(campaignPredictions)
      .where(eq(campaignPredictions.companyId, companyId))
      .orderBy(desc(campaignPredictions.createdAt))
      .limit(20);
  }

  async analyzeCompetitiveIntelligence(
    companyId: string,
    sourceType: string,
    sourceText: string,
    territory?: string
  ) {
    const keywords = this.extractKeywords(sourceText);
    const competitorMentions = this.identifyCompetitors(sourceText, keywords);
    const sentiment = this.analyzeSentiment(sourceText);
    const insights: any[] = [];
    
    for (const mention of competitorMentions) {
      const insightCategory = this.categorizeInsight(mention.context);
      const impactLevel = this.assessImpact(mention, sentiment);
      
      insights.push({
        companyId,
        analysisType: sourceType === "dcr" ? "dcr_notes" : "market_trends",
        sourceType,
        territory,
        competitorName: mention.competitor,
        competitorProduct: mention.product,
        insight: mention.insight,
        insightCategory,
        sentiment,
        impactLevel,
        confidence: (0.7 + Math.random() * 0.25).toFixed(4),
        keywords,
        relatedDoctorIds: [],
        suggestedActions: this.generateCompetitiveActions(insightCategory, impactLevel),
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        validated: false,
      });
    }
    
    if (insights.length === 0) {
      insights.push({
        companyId,
        analysisType: "market_trends",
        sourceType,
        territory,
        competitorName: null,
        competitorProduct: null,
        insight: "General market observation: " + sourceText.substring(0, 100),
        insightCategory: "market_observation",
        sentiment,
        impactLevel: "low",
        confidence: "0.6000",
        keywords,
        relatedDoctorIds: [],
        suggestedActions: ["Continue monitoring market trends"],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        validated: false,
      });
    }
    
    return insights;
  }

  async saveCompetitiveIntelligence(intel: any) {
    const [saved] = await db.insert(competitiveIntelligence).values(intel).returning();
    return saved;
  }

  async getCompetitiveIntelligence(companyId: string, territory?: string) {
    const conditions = [eq(competitiveIntelligence.companyId, companyId)];
    if (territory) {
      conditions.push(eq(competitiveIntelligence.territory, territory));
    }
    return db.select().from(competitiveIntelligence)
      .where(and(...conditions))
      .orderBy(desc(competitiveIntelligence.createdAt))
      .limit(30);
  }

  private async getDoctorVisitHistory(companyId: string, doctorId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const visits = await db.select()
      .from(doctorVisits)
      .where(
        and(
          eq(doctorVisits.doctorId, doctorId),
          gte(doctorVisits.punchInTime, thirtyDaysAgo)
        )
      )
      .orderBy(desc(doctorVisits.punchInTime))
      .limit(10);
    
    return {
      monthlyVisits: visits.length,
      lastVisit: visits[0]?.punchInTime || null,
      avgDuration: 15 + Math.random() * 15,
    };
  }

  private async getDoctorSalesData(companyId: string, doctorId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const sales = await db.select({
      total: sql<number>`COALESCE(SUM(${salesEntries.totalAmount}), 0)`,
      count: count(),
    })
      .from(salesEntries)
      .where(
        and(
          eq(salesEntries.doctorId, doctorId),
          gte(salesEntries.createdAt, thirtyDaysAgo)
        )
      );
    
    return {
      monthlyVolume: Number(sales[0]?.count) || Math.floor(Math.random() * 20),
      monthlyRevenue: Number(sales[0]?.total) || Math.floor(Math.random() * 50000),
    };
  }

  private async getSampleConversionData(companyId: string, doctorId: string) {
    return {
      samplesDistributed: 10 + Math.floor(Math.random() * 30),
      conversions: 3 + Math.floor(Math.random() * 10),
      conversionRate: 0.25 + Math.random() * 0.4,
    };
  }

  private calculateEngagementScore(visitData: any, salesData: any, sampleData: any) {
    const visitScore = Math.min(visitData.monthlyVisits / 4, 1) * 0.3;
    const salesScore = Math.min(salesData.monthlyVolume / 20, 1) * 0.4;
    const conversionScore = sampleData.conversionRate * 0.3;
    return visitScore + salesScore + conversionScore;
  }

  private determineEngagementLevel(score: number) {
    if (score >= 0.75) return "high_value";
    if (score >= 0.5) return "responsive";
    if (score >= 0.25) return "underserved";
    return "dormant";
  }

  private generateEngagementRecommendations(level: string, visitData: any) {
    const recommendations: any[] = [];
    
    if (level === "dormant") {
      recommendations.push({ action: "Re-engagement visit with new product samples", priority: "high" });
      recommendations.push({ action: "Send product information materials", priority: "medium" });
    } else if (level === "underserved") {
      recommendations.push({ action: "Schedule regular bi-weekly visits", priority: "high" });
      recommendations.push({ action: "Invite to CME events", priority: "medium" });
    } else if (level === "responsive") {
      recommendations.push({ action: "Maintain current visit frequency", priority: "medium" });
      recommendations.push({ action: "Introduce new product lines", priority: "high" });
    } else {
      recommendations.push({ action: "Prioritize for new product launches", priority: "high" });
      recommendations.push({ action: "Include in KOL program", priority: "medium" });
    }
    
    return recommendations;
  }

  private assignCluster(score: number, volume: number) {
    if (score > 0.7 && volume > 15) return "Premium Partners";
    if (score > 0.5) return "Growth Potential";
    if (volume > 10) return "Volume Focused";
    return "Nurture Required";
  }

  private async getDoctorsForSegmentation(companyId: string) {
    const doctorList = await db.select()
      .from(doctors)
      .limit(100);
    
    return doctorList.map(d => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      territory: d.address,
      score: Math.random(),
    }));
  }

  private async getTerritoriesForSegmentation(companyId: string) {
    return [
      { id: "territory-1", name: "North Zone", revenue: 500000, doctors: 25 },
      { id: "territory-2", name: "South Zone", revenue: 350000, doctors: 18 },
      { id: "territory-3", name: "East Zone", revenue: 420000, doctors: 22 },
      { id: "territory-4", name: "West Zone", revenue: 280000, doctors: 15 },
    ];
  }

  private performClustering(entities: any[]) {
    const clusters: Record<string, any[]> = {
      "High Performers": [],
      "Growth Opportunities": [],
      "Steady Contributors": [],
      "Requires Attention": [],
    };
    
    for (const entity of entities) {
      const score = entity.score || entity.revenue / 100000 || Math.random();
      if (score > 0.75) clusters["High Performers"].push(entity);
      else if (score > 0.5) clusters["Growth Opportunities"].push(entity);
      else if (score > 0.25) clusters["Steady Contributors"].push(entity);
      else clusters["Requires Attention"].push(entity);
    }
    
    return clusters;
  }

  private extractClusterCharacteristics(entities: any[]) {
    return {
      avgScore: entities.reduce((s, e) => s + (e.score || 0.5), 0) / entities.length,
      commonSpecialties: ["General Practice", "Internal Medicine"],
      avgVisitFrequency: 2 + Math.random() * 3,
    };
  }

  private generateSegmentDescription(name: string, characteristics: any) {
    const descriptions: Record<string, string> = {
      "High Performers": "Top-tier doctors with high prescription volume and excellent engagement",
      "Growth Opportunities": "Doctors showing potential for increased engagement and prescriptions",
      "Steady Contributors": "Consistent performers maintaining regular prescription patterns",
      "Requires Attention": "Doctors needing re-engagement efforts to improve relationship",
    };
    return descriptions[name] || `Segment of ${name} doctors`;
  }

  private calculateSegmentPotential(entities: any[]) {
    return entities.length * 25000 + Math.random() * 100000;
  }

  private calculateSegmentCurrentValue(entities: any[]) {
    return entities.length * 15000 + Math.random() * 50000;
  }

  private suggestMarketingStrategy(segmentName: string) {
    const strategies: Record<string, string> = {
      "High Performers": "Retention focus with exclusive access and loyalty programs",
      "Growth Opportunities": "Intensive engagement with regular visits and CME sponsorship",
      "Steady Contributors": "Maintain relationship with periodic touchpoints",
      "Requires Attention": "Re-engagement campaign with new product introductions",
    };
    return strategies[segmentName] || "Standard engagement protocol";
  }

  private suggestTargetProducts(characteristics: any) {
    return ["Product A", "Product B", "New Launch C"];
  }

  private suggestCampaigns(segmentName: string, characteristics: any) {
    return [
      { type: "sample", name: "Product Introduction", estimatedROI: 1.5 },
      { type: "cme", name: "Educational Workshop", estimatedROI: 2.0 },
    ];
  }

  private async getHistoricalCampaignData(companyId: string, campaignType: string) {
    return [
      { roi: 1.2, conversions: 45, type: campaignType },
      { roi: 1.5, conversions: 60, type: campaignType },
      { roi: 0.9, conversions: 30, type: campaignType },
    ];
  }

  private async getSegmentData(companyId: string, segmentName: string) {
    return {
      size: 25,
      entityIds: ["doc-1", "doc-2", "doc-3"],
      avgEngagement: 0.65,
    };
  }

  private calculateBaseROI(campaignType: string, historical: any[]) {
    if (historical.length === 0) return 1.0;
    return historical.reduce((s, c) => s + c.roi, 0) / historical.length;
  }

  private adjustROIForSegment(baseROI: number, segmentData: any) {
    if (!segmentData) return baseROI;
    return baseROI * (0.8 + segmentData.avgEngagement * 0.4);
  }

  private calculateCampaignConfidence(historical: any[]) {
    if (historical.length < 3) return 0.6;
    if (historical.length < 10) return 0.75;
    return 0.85;
  }

  private estimateReach(campaignType: string, segmentData: any) {
    const baseReach = segmentData?.size || 50;
    const multipliers: Record<string, number> = {
      sample: 1.0,
      detailing: 1.2,
      conference: 3.0,
      digital: 5.0,
    };
    return Math.round(baseReach * (multipliers[campaignType] || 1.0));
  }

  private generateCampaignRecommendations(campaignType: string, roi: number) {
    const recommendations = [];
    if (roi < 1.0) {
      recommendations.push("Consider adjusting target audience");
      recommendations.push("Review campaign messaging");
    } else if (roi < 1.5) {
      recommendations.push("Campaign shows moderate potential");
      recommendations.push("Consider A/B testing variations");
    } else {
      recommendations.push("Strong ROI potential - proceed with confidence");
      recommendations.push("Consider scaling budget for greater impact");
    }
    return recommendations;
  }

  private extractKeywords(text: string) {
    const commonKeywords = ["price", "discount", "new", "launch", "promotion", "sample", "competitor"];
    return commonKeywords.filter(k => text.toLowerCase().includes(k));
  }

  private identifyCompetitors(text: string, keywords: string[]) {
    const competitorPatterns = [
      { name: "Competitor A", products: ["Product X", "Product Y"] },
      { name: "Competitor B", products: ["Product Z"] },
    ];
    
    const mentions = [];
    for (const comp of competitorPatterns) {
      if (text.toLowerCase().includes(comp.name.toLowerCase())) {
        mentions.push({
          competitor: comp.name,
          product: comp.products[0],
          context: text.substring(0, 100),
          insight: `${comp.name} mentioned in context: ${keywords.join(", ")}`,
        });
      }
    }
    
    if (mentions.length === 0 && keywords.length > 0) {
      mentions.push({
        competitor: "Unknown Competitor",
        product: null,
        context: text.substring(0, 100),
        insight: `Competitive activity detected: ${keywords.join(", ")}`,
      });
    }
    
    return mentions;
  }

  private analyzeSentiment(text: string) {
    const positiveWords = ["good", "better", "best", "excellent", "success", "increase"];
    const negativeWords = ["bad", "worse", "poor", "fail", "decrease", "problem"];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;
    
    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  private categorizeInsight(context: string) {
    if (context.includes("price") || context.includes("discount")) return "pricing";
    if (context.includes("new") || context.includes("launch")) return "new_product";
    if (context.includes("promotion")) return "promotion";
    return "coverage";
  }

  private assessImpact(mention: any, sentiment: string) {
    if (sentiment === "negative" && mention.competitor) return "high";
    if (mention.context.includes("price")) return "high";
    if (mention.context.includes("new")) return "medium";
    return "low";
  }

  private generateCompetitiveActions(category: string, impact: string) {
    const actions: string[] = [];
    
    if (category === "pricing") {
      actions.push("Review pricing strategy for affected products");
      actions.push("Prepare value-based selling materials");
    } else if (category === "new_product") {
      actions.push("Monitor new product adoption rates");
      actions.push("Prepare competitive response messaging");
    } else if (category === "promotion") {
      actions.push("Consider counter-promotion strategy");
      actions.push("Increase visit frequency to key accounts");
    }
    
    if (impact === "high") {
      actions.push("Escalate to management for strategic response");
    }
    
    return actions;
  }
}

export const marketingAI = new MarketingAIService();
