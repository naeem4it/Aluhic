import { PerformanceSummary } from '../PerformanceSummary';

export default function PerformanceSummaryExample() {
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
    <div className="max-w-4xl">
      <PerformanceSummary
        topProducts={mockTopProducts}
        topDoctors={mockTopDoctors}
        avgDailySales="Rs. 54,200"
        targetAchievement={92}
      />
    </div>
  );
}
