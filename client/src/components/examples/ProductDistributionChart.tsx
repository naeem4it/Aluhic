import { ProductDistributionChart } from '../ProductDistributionChart';

export default function ProductDistributionChartExample() {
  const mockData = [
    { name: "Product A", value: 450000 },
    { name: "Product B", value: 320000 },
    { name: "Product C", value: 280000 },
    { name: "Product D", value: 190000 },
    { name: "Others", value: 160000 },
  ];

  return (
    <div className="max-w-4xl">
      <ProductDistributionChart data={mockData} />
    </div>
  );
}
