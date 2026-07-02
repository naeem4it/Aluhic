import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface QuarterlyData {
  quarter: string;
  current: number;
  previous: number;
}

interface QuarterlyComparisonChartProps {
  data: QuarterlyData[];
}

export function QuarterlyComparisonChart({ data }: QuarterlyComparisonChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quarterly Sales Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="quarter"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `Rs. ${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              formatter={(value: number) => `Rs. ${(value / 1000000).toFixed(2)}M`}
            />
            <Bar dataKey="current" fill="hsl(var(--chart-1))" name="Current Year" />
            <Bar dataKey="previous" fill="hsl(var(--chart-3))" name="Previous Year" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
