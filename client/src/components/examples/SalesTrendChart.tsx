import { SalesTrendChart } from '../SalesTrendChart';

export default function SalesTrendChartExample() {
  const mockData = Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}/10`,
    sales: Math.floor(Math.random() * 30000) + 40000,
  }));

  return (
    <div className="max-w-4xl">
      <SalesTrendChart data={mockData} />
    </div>
  );
}
