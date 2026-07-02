import { StatCard } from '../StatCard';
import { DollarSign } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
      <StatCard
        title="Today's Sales"
        value="Rs. 52,000"
        comparison={{ label: "vs Yesterday", value: 10.6 }}
        icon={DollarSign}
      />
      <StatCard
        title="This Month"
        value="Rs. 8.2M"
        comparison={{ label: "vs Last Month", value: -5.2 }}
        icon={DollarSign}
      />
    </div>
  );
}
