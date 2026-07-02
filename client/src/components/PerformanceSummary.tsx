import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

interface TopItem {
  name: string;
  value: string;
  rank: number;
}

interface PerformanceSummaryProps {
  topProducts: TopItem[];
  topDoctors: TopItem[];
  avgDailySales: string;
  targetAchievement: number;
}

export function PerformanceSummary({
  topProducts,
  topDoctors,
  avgDailySales,
  targetAchievement,
}: PerformanceSummaryProps) {
  const getAchievementLevel = (percentage: number) => {
    if (percentage >= 100) return { label: "Gold", color: "bg-chart-4" };
    if (percentage >= 85) return { label: "Silver", color: "bg-chart-3" };
    if (percentage >= 70) return { label: "Bronze", color: "bg-chart-5" };
    return { label: "Developing", color: "bg-muted" };
  };

  const achievement = getAchievementLevel(targetAchievement);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="text-base">Top Products</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProducts.map((product) => (
              <div
                key={product.name}
                className="flex items-center justify-between"
                data-testid={`item-product-${product.rank}`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                    {product.rank}
                  </Badge>
                  <span className="text-sm">{product.name}</span>
                </div>
                <span className="text-sm font-mono font-semibold">{product.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="text-base">Top Prescribers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topDoctors.map((doctor) => (
              <div
                key={doctor.name}
                className="flex items-center justify-between"
                data-testid={`item-doctor-${doctor.rank}`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                    {doctor.rank}
                  </Badge>
                  <span className="text-sm">{doctor.name}</span>
                </div>
                <span className="text-sm font-mono font-semibold">{doctor.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Average Daily Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-mono font-semibold" data-testid="text-avg-daily-sales">
            {avgDailySales}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Based on last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Target Achievement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-semibold" data-testid="text-achievement">
                {targetAchievement}%
              </span>
              <Badge className={achievement.color}>{achievement.label}</Badge>
            </div>
            <Progress value={targetAchievement} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
