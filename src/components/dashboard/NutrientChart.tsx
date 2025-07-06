
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

interface NutrientChartProps {
  proteinCalories: number;
  carbsCalories: number;
  fatCalories: number;
}

export const NutrientChart = ({
  proteinCalories,
  carbsCalories,
  fatCalories,
}: NutrientChartProps) => {
  const data = [
    { name: "Protein", value: proteinCalories, color: "#3b82f6" },
    { name: "Carbs", value: carbsCalories, color: "#22c55e" },
    { name: "Fat", value: fatCalories, color: "#eab308" },
  ];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="nourish-card h-[350px]">
      <CardHeader>
        <CardTitle>Macronutrient Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} calories`, ""]}
              contentStyle={{ 
                borderRadius: '8px', 
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid #ddd'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
