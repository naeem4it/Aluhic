import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  comparison?: {
    label: string;
    value: number;
    prefix?: string;
  };
  icon?: LucideIcon;
}

export function StatCard({ title, value, comparison, icon: Icon }: StatCardProps) {
  const isPositive = comparison && comparison.value >= 0;

  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-mono font-semibold" data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {comparison && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            {isPositive ? (
              <ArrowUp className="h-3 w-3 text-chart-2" />
            ) : (
              <ArrowDown className="h-3 w-3 text-destructive" />
            )}
            <span className={isPositive ? "text-chart-2" : "text-destructive"}>
              {comparison.prefix}{Math.abs(comparison.value)}%
            </span>
            <span>{comparison.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
