import { QuarterlyComparisonChart } from '../QuarterlyComparisonChart';

export default function QuarterlyComparisonChartExample() {
  const mockData = [
    { quarter: "Q1", current: 3200000, previous: 2800000 },
    { quarter: "Q2", current: 3800000, previous: 3400000 },
    { quarter: "Q3", current: 4500000, previous: 3900000 },
    { quarter: "Q4", current: 4700000, previous: 4700000 },
  ];

  return (
    <div className="max-w-4xl">
      <QuarterlyComparisonChart data={mockData} />
    </div>
  );
}
