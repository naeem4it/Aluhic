import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface SalesTrendChartProps {
  data: Array<{ date: string; sales: number }>;
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
  const avgDailySales = data.length > 0 ? totalSales / data.length : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Sales Trend (Last 30 Days)</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-chart-1" />
              <span>Daily Sales</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm mt-2">
          <div>
            <span className="text-muted-foreground">Total Period Sales:</span>{" "}
            <span className="font-semibold">Rs. {totalSales.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg Daily Sales:</span>{" "}
            <span className="font-semibold">Rs. {Math.round(avgDailySales).toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, "Sales"]}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
              name="Daily Sales"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
