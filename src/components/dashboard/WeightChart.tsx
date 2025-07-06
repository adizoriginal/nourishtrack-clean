
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface WeightDataPoint {
  date: string;
  weight: number;
}

interface WeightChartProps {
  weightData: WeightDataPoint[];
}

export const WeightChart = ({ weightData }: WeightChartProps) => {
  if (weightData.length === 0) {
    return (
      <Card className="nourish-card h-[350px]">
        <CardHeader>
          <CardTitle>Weight Tracking</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">No weight data logged yet. Start logging your weight to see the chart!</p>
        </CardContent>
      </Card>
    );
  }

  const minWeight = Math.min(...weightData.map(d => d.weight)) * 0.98;
  const maxWeight = Math.max(...weightData.map(d => d.weight)) * 1.02;

  return (
    <Card className="nourish-card h-[350px]">
      <CardHeader>
        <CardTitle>Weight Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={weightData}
            margin={{
              top: 5,
              right: 20,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="date"
              tickMargin={10}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[minWeight, maxWeight]}
              tickFormatter={(value) => `${value.toFixed(1)}`}
              tick={{ fontSize: 12 }}
              width={40}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} kg`, "Weight"]}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              }}
              contentStyle={{ 
                borderRadius: '8px', 
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid #ddd'
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ stroke: '#22c55e', strokeWidth: 2, r: 4, fill: 'white' }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
