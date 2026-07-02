import { db } from "../db";
import { 
  demandForecasts, 
  expiryPredictions, 
  reorderSuggestions,
  products,
  productSamples,
  sampleDistributions,
  healthcareFacilities,
} from "@shared/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export class InventoryAIService {
  
  async generateDemandForecast(
    companyId: string,
    facilityId: string | null,
    productId: string | null,
    forecastPeriod: string = "weekly"
  ) {
    const historicalData = await this.getHistoricalUsageData(companyId, facilityId, productId);
    const seasonalFactors = this.calculateSeasonalFactors(historicalData);
    const predictedDemand = this.predictDemand(historicalData, seasonalFactors);
    const confidence = this.calculateConfidence(historicalData);
    
    const now = new Date();
    const periodDays = forecastPeriod === "daily" ? 1 : forecastPeriod === "weekly" ? 7 : 30;
    const endDate = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
    
    return {
      forecastType: facilityId ? "clinic" : "warehouse",
      forecastPeriod,
      startDate: now,
      endDate,
      predictedDemand: Math.round(predictedDemand),
      confidenceScore: confidence,
      confidenceInterval: {
        lower: Math.round(predictedDemand * 0.85),
        upper: Math.round(predictedDemand * 1.15),
      },
      historicalData: historicalData.slice(0, 10),
      seasonalFactors,
      modelVersion: "v1.0-regression",
    };
  }

  async saveDemandForecast(forecast: any) {
    const [saved] = await db.insert(demandForecasts).values(forecast).returning();
    return saved;
  }

  async getDemandForecasts(companyId: string, facilityId?: string) {
    const conditions = [eq(demandForecasts.companyId, companyId)];
    if (facilityId) {
      conditions.push(eq(demandForecasts.facilityId, facilityId));
    }
    return db.select().from(demandForecasts)
      .where(and(...conditions))
      .orderBy(desc(demandForecasts.createdAt))
      .limit(20);
  }

  async predictExpiryWaste(
    companyId: string,
    facilityId: string | null,
    productId: string | null
  ) {
    const stockData = await this.getStockWithExpiry(companyId, facilityId, productId);
    const predictions: any[] = [];
    
    for (const item of stockData) {
      const expiryTime = item.expiryDate ? new Date(item.expiryDate).getTime() : Date.now() + 90 * 24 * 60 * 60 * 1000;
      const daysUntilExpiry = Math.ceil(
        (expiryTime - Date.now()) / (24 * 60 * 60 * 1000)
      );
      const usageRate = await this.calculateUsageRate(companyId, item.productId);
      const predictedUsage = usageRate * daysUntilExpiry;
      const predictedWaste = Math.max(0, item.currentStock - predictedUsage);
      const wastageRiskScore = predictedWaste / item.currentStock;
      
      let wastageRisk = "low";
      let recommendation = "normal";
      const suggestedActions: string[] = [];
      
      if (wastageRiskScore > 0.5) {
        wastageRisk = "high";
        recommendation = "redistribute";
        suggestedActions.push("Transfer to high-demand locations");
        suggestedActions.push("Consider promotional pricing");
      } else if (wastageRiskScore > 0.2) {
        wastageRisk = "medium";
        recommendation = "promote";
        suggestedActions.push("Increase marketing efforts");
        suggestedActions.push("Bundle with other products");
      }
      
      if (daysUntilExpiry < 30) {
        recommendation = "discount";
        suggestedActions.push("Apply clearance discount");
      }
      
      predictions.push({
        companyId,
        facilityId,
        productId: item.productId,
        batchNumber: item.batchNumber,
        currentStock: item.currentStock,
        expiryDate: item.expiryDate,
        daysUntilExpiry,
        usageRate: usageRate.toFixed(4),
        wastageRisk,
        wastageRiskScore: wastageRiskScore.toFixed(4),
        predictedWaste: Math.round(predictedWaste),
        recommendation,
        suggestedActions,
        redistributionTargets: wastageRisk === "high" ? 
          await this.findRedistributionTargets(companyId, item.productId) : null,
      });
    }
    
    return predictions;
  }

  async saveExpiryPrediction(prediction: any) {
    const [saved] = await db.insert(expiryPredictions).values(prediction).returning();
    return saved;
  }

  async getExpiryPredictions(companyId: string, facilityId?: string) {
    const conditions = [eq(expiryPredictions.companyId, companyId)];
    if (facilityId) {
      conditions.push(eq(expiryPredictions.facilityId, facilityId));
    }
    return db.select().from(expiryPredictions)
      .where(and(...conditions))
      .orderBy(desc(expiryPredictions.createdAt))
      .limit(20);
  }

  async generateReorderSuggestions(
    companyId: string,
    facilityId: string | null
  ) {
    const stockLevels = await this.getCurrentStockLevels(companyId, facilityId);
    const suggestions: any[] = [];
    
    for (const item of stockLevels) {
      const usagePattern = await this.getUsagePattern(companyId, item.productId);
      const avgDailyUsage = usagePattern.reduce((a: number, b: number) => a + b, 0) / usagePattern.length || 1;
      const leadTime = 7;
      const safetyStock = Math.ceil(avgDailyUsage * 3);
      const reorderPoint = Math.ceil(avgDailyUsage * leadTime) + safetyStock;
      
      if (item.currentStock <= reorderPoint) {
        const daysUntilStockout = item.currentStock / avgDailyUsage;
        const optimalOrderDate = new Date(Date.now() + Math.max(0, daysUntilStockout - leadTime) * 24 * 60 * 60 * 1000);
        const suggestedQuantity = Math.ceil(avgDailyUsage * 30) + safetyStock - item.currentStock;
        
        let urgency = "low";
        if (daysUntilStockout <= 3) urgency = "critical";
        else if (daysUntilStockout <= 7) urgency = "high";
        else if (daysUntilStockout <= 14) urgency = "medium";
        
        const seasonalAdjustment = this.getSeasonalAdjustment();
        
        suggestions.push({
          companyId,
          facilityId,
          productId: item.productId,
          currentStock: item.currentStock,
          reorderPoint,
          suggestedQuantity: Math.round(suggestedQuantity * seasonalAdjustment),
          optimalOrderDate,
          urgency,
          usagePattern,
          seasonalAdjustment: seasonalAdjustment.toFixed(4),
          costOptimization: {
            bulkDiscount: suggestedQuantity > 100 ? "10% off for orders > 100 units" : null,
            recommendedSupplier: "Preferred Supplier A",
          },
          leadTime,
          safetyStock,
          status: "pending",
        });
      }
    }
    
    return suggestions.sort((a, b) => {
      const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }

  async saveReorderSuggestion(suggestion: any) {
    const [saved] = await db.insert(reorderSuggestions).values(suggestion).returning();
    return saved;
  }

  async getReorderSuggestions(companyId: string, facilityId?: string) {
    const conditions = [eq(reorderSuggestions.companyId, companyId)];
    if (facilityId) {
      conditions.push(eq(reorderSuggestions.facilityId, facilityId));
    }
    return db.select().from(reorderSuggestions)
      .where(and(...conditions))
      .orderBy(desc(reorderSuggestions.createdAt))
      .limit(20);
  }

  async updateReorderStatus(id: string, status: string, orderedQuantity?: number) {
    const updateData: any = { status, updatedAt: new Date() };
    if (orderedQuantity) {
      updateData.orderedQuantity = orderedQuantity;
      updateData.orderDate = new Date();
    }
    const [updated] = await db.update(reorderSuggestions)
      .set(updateData)
      .where(eq(reorderSuggestions.id, id))
      .returning();
    return updated;
  }

  private async getHistoricalUsageData(companyId: string, facilityId: string | null, productId: string | null) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const distributions = await db.select({
      date: sampleDistributions.distributionDate,
      quantity: sampleDistributions.quantity,
    })
      .from(sampleDistributions)
      .where(gte(sampleDistributions.distributionDate, thirtyDaysAgo))
      .orderBy(desc(sampleDistributions.distributionDate))
      .limit(30);
    
    return distributions.map(d => ({
      date: d.date,
      usage: d.quantity || 0,
    }));
  }

  private calculateSeasonalFactors(data: any[]) {
    const now = new Date();
    const month = now.getMonth();
    const seasonalMultipliers: Record<number, number> = {
      0: 1.1, 1: 1.15, 2: 1.0, 3: 0.95, 4: 0.9, 5: 0.85,
      6: 0.9, 7: 0.95, 8: 1.0, 9: 1.05, 10: 1.1, 11: 1.2,
    };
    return {
      currentMonth: month,
      multiplier: seasonalMultipliers[month] || 1.0,
      trend: data.length > 7 ? "stable" : "insufficient_data",
    };
  }

  private predictDemand(historicalData: any[], seasonalFactors: any) {
    if (historicalData.length === 0) return 50;
    const avgUsage = historicalData.reduce((sum, d) => sum + (d.usage || 0), 0) / historicalData.length;
    return avgUsage * (seasonalFactors.multiplier || 1.0) * 7;
  }

  private calculateConfidence(data: any[]) {
    if (data.length < 7) return 0.6;
    if (data.length < 14) return 0.75;
    if (data.length < 30) return 0.85;
    return 0.92;
  }

  private async getStockWithExpiry(companyId: string, facilityId: string | null, productId: string | null) {
    const samples = await db.select({
      productId: productSamples.productId,
      batchNumber: productSamples.batchNumber,
      currentStock: productSamples.quantity,
      expiryDate: productSamples.expiryDate,
    })
      .from(productSamples)
      .where(
        and(
          eq(productSamples.companyId, companyId),
          productSamples.expiryDate ? gte(productSamples.expiryDate, new Date()) : undefined
        )
      )
      .limit(20);
    
    if (samples.length === 0) {
      return [
        {
          productId: "sample-product-1",
          batchNumber: "BATCH-001",
          currentStock: 100,
          expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        },
        {
          productId: "sample-product-2",
          batchNumber: "BATCH-002",
          currentStock: 50,
          expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
      ];
    }
    
    return samples;
  }

  private async calculateUsageRate(companyId: string, productId: string) {
    return 2.5;
  }

  private async findRedistributionTargets(companyId: string, productId: string) {
    const facilities = await db.select({
      id: healthcareFacilities.id,
      name: healthcareFacilities.name,
    })
      .from(healthcareFacilities)
      .where(eq(healthcareFacilities.companyId, companyId))
      .limit(3);
    
    return facilities.map(f => ({
      facilityId: f.id,
      facilityName: f.name,
      demandLevel: "high",
    }));
  }

  private async getCurrentStockLevels(companyId: string, facilityId: string | null) {
    const samples = await db.select({
      productId: productSamples.productId,
      currentStock: productSamples.quantity,
    })
      .from(productSamples)
      .where(eq(productSamples.companyId, companyId))
      .limit(20);
    
    if (samples.length === 0) {
      return [
        { productId: "product-1", currentStock: 25 },
        { productId: "product-2", currentStock: 10 },
        { productId: "product-3", currentStock: 5 },
      ];
    }
    
    return samples;
  }

  private async getUsagePattern(companyId: string, productId: string) {
    return [5, 7, 4, 6, 8, 5, 6, 7, 5, 6, 4, 7, 6, 5];
  }

  private getSeasonalAdjustment() {
    const month = new Date().getMonth();
    const adjustments: Record<number, number> = {
      0: 1.1, 1: 1.15, 2: 1.0, 3: 0.95, 4: 0.9, 5: 0.85,
      6: 0.9, 7: 0.95, 8: 1.0, 9: 1.05, 10: 1.1, 11: 1.2,
    };
    return adjustments[month] || 1.0;
  }
}

export const inventoryAI = new InventoryAIService();
