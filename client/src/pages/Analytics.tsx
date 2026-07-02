import { QuarterlyComparisonChart } from "@/components/QuarterlyComparisonChart";
import { ProductDistributionChart } from "@/components/ProductDistributionChart";
import { PerformanceSummary } from "@/components/PerformanceSummary";

export default function Analytics() {
  // TODO: remove mock data
  const mockQuarterlyData = [
    { quarter: "Q1", current: 3200000, previous: 2800000 },
    { quarter: "Q2", current: 3800000, previous: 3400000 },
    { quarter: "Q3", current: 4500000, previous: 3900000 },
    { quarter: "Q4", current: 4700000, previous: 4700000 },
  ];

  const mockProductData = [
    { name: "Antibiotic XYZ", value: 450000 },
    { name: "Pain Relief ABC", value: 320000 },
    { name: "Vitamin Complex", value: 280000 },
    { name: "Cardiac Med", value: 190000 },
    { name: "Others", value: 160000 },
  ];

  const mockTopProducts = [
    { name: "Antibiotic XYZ", value: "Rs. 450K", rank: 1 },
    { name: "Pain Relief ABC", value: "Rs. 320K", rank: 2 },
    { name: "Vitamin Complex", value: "Rs. 280K", rank: 3 },
  ];

  const mockTopDoctors = [
    { name: "Dr. Kumar", value: "Rs. 380K", rank: 1 },
    { name: "Dr. Sharma", value: "Rs. 295K", rank: 2 },
    { name: "Dr. Patel", value: "Rs. 240K", rank: 3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed performance analysis and comparisons
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <QuarterlyComparisonChart data={mockQuarterlyData} />
        <ProductDistributionChart data={mockProductData} />
      </div>

      <PerformanceSummary
        topProducts={mockTopProducts}
        topDoctors={mockTopDoctors}
        avgDailySales="Rs. 54,200"
        targetAchievement={92}
      />
    </div>
  );
}
